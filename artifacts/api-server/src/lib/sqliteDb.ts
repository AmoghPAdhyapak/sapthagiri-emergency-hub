import Database from "better-sqlite3";
import path from "node:path";

// At runtime __dirname = artifacts/api-server/dist/ (set by build banner)
// Go one level up to store the db file in artifacts/api-server/
const dbPath = path.resolve(__dirname, "../hospital_ecosystem.db");

export const db = new Database(dbPath);

db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

db.exec(`
  CREATE TABLE IF NOT EXISTS STAFF_ACCOUNTS (
    staffId   TEXT PRIMARY KEY,
    userId    TEXT NOT NULL,
    name      TEXT NOT NULL,
    password  TEXT NOT NULL,
    role      TEXT NOT NULL DEFAULT 'Staff',
    createdAt TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS PATIENT_MASTER_FOLDER (
    patientId    TEXT PRIMARY KEY,
    name         TEXT NOT NULL,
    age          TEXT NOT NULL DEFAULT '',
    allergies    TEXT NOT NULL DEFAULT '[]',
    phone        TEXT NOT NULL,
    email        TEXT NOT NULL DEFAULT '',
    password     TEXT NOT NULL,
    survivalState TEXT NOT NULL DEFAULT 'Stable',
    createdAt    TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS ENCOUNTERS (
    encounterId TEXT PRIMARY KEY,
    patientId   TEXT NOT NULL,
    data        TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS FORENSIC_LIFECYCLE_LOGS (
    logId           TEXT PRIMARY KEY,
    encounterId     TEXT NOT NULL,
    patientId       TEXT NOT NULL,
    eventType       TEXT NOT NULL,
    timestamp       TEXT NOT NULL,
    forensicPayload TEXT NOT NULL
  );
`);

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PatientRow {
  patientId: string;
  name: string;
  age: string;
  allergies: string[];
  phone: string;
  email: string;
  password: string;
  survivalState: string;
  createdAt: string;
}

export interface StaffRow {
  staffId: string;
  userId: string;
  name: string;
  password: string;
  role: string;
  createdAt: string;
}

interface RawPatientRow {
  patientId: string;
  name: string;
  age: string;
  allergies: string;
  phone: string;
  email: string;
  password: string;
  survivalState: string;
  createdAt: string;
}

interface RawEncounterRow {
  encounterId: string;
  patientId: string;
  data: string;
}

interface RawForensicRow {
  logId: string;
  encounterId: string;
  patientId: string;
  eventType: string;
  timestamp: string;
  forensicPayload: string;
}

// ---------------------------------------------------------------------------
// Prepared statements
// ---------------------------------------------------------------------------

const stmts = {
  // Patients
  insertPatient: db.prepare(`
    INSERT INTO PATIENT_MASTER_FOLDER
      (patientId, name, age, allergies, phone, email, password, survivalState, createdAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `),
  getPatientById: db.prepare(`SELECT * FROM PATIENT_MASTER_FOLDER WHERE patientId = ?`),
  getPatientByPhone: db.prepare(`SELECT * FROM PATIENT_MASTER_FOLDER WHERE phone = ?`),
  getPatientByName: db.prepare(`SELECT * FROM PATIENT_MASTER_FOLDER WHERE LOWER(name) = LOWER(?)`),
  getAllPatients: db.prepare(`SELECT * FROM PATIENT_MASTER_FOLDER ORDER BY createdAt DESC`),
  updatePatientSurvivalState: db.prepare(
    `UPDATE PATIENT_MASTER_FOLDER SET survivalState = ? WHERE patientId = ?`
  ),

  // Staff
  insertStaff: db.prepare(`
    INSERT INTO STAFF_ACCOUNTS (staffId, userId, name, password, role, createdAt)
    VALUES (?, ?, ?, ?, ?, ?)
  `),
  getStaffById: db.prepare(`SELECT * FROM STAFF_ACCOUNTS WHERE staffId = ?`),

  // Encounters
  upsertEncounter: db.prepare(`
    INSERT OR REPLACE INTO ENCOUNTERS (encounterId, patientId, data)
    VALUES (?, ?, ?)
  `),
  getEncounterById: db.prepare(`SELECT * FROM ENCOUNTERS WHERE encounterId = ?`),
  getAllEncounters: db.prepare(`SELECT * FROM ENCOUNTERS`),
  getEncountersByPatient: db.prepare(`SELECT * FROM ENCOUNTERS WHERE patientId = ?`),
  encounterIdExists: db.prepare(`SELECT 1 FROM ENCOUNTERS WHERE encounterId = ?`),

  // Forensic logs
  insertForensicLog: db.prepare(`
    INSERT OR IGNORE INTO FORENSIC_LIFECYCLE_LOGS
      (logId, encounterId, patientId, eventType, timestamp, forensicPayload)
    VALUES (?, ?, ?, ?, ?, ?)
  `),
  getForensicLogsByPatient: db.prepare(`
    SELECT * FROM FORENSIC_LIFECYCLE_LOGS WHERE patientId = ? ORDER BY timestamp ASC
  `),
};

// ---------------------------------------------------------------------------
// Patient helpers
// ---------------------------------------------------------------------------

function parsePatientRow(row: RawPatientRow): PatientRow {
  return { ...row, allergies: JSON.parse(row.allergies || "[]") };
}

export function insertPatient(p: PatientRow): void {
  stmts.insertPatient.run(
    p.patientId, p.name, p.age, JSON.stringify(p.allergies),
    p.phone, p.email, p.password, p.survivalState, p.createdAt,
  );
}

export function getPatientById(patientId: string): PatientRow | undefined {
  const row = stmts.getPatientById.get(patientId) as RawPatientRow | undefined;
  return row ? parsePatientRow(row) : undefined;
}

export function getPatientByPhone(phone: string): PatientRow | undefined {
  const row = stmts.getPatientByPhone.get(phone) as RawPatientRow | undefined;
  return row ? parsePatientRow(row) : undefined;
}

export function getPatientByName(name: string): PatientRow | undefined {
  const row = stmts.getPatientByName.get(name) as RawPatientRow | undefined;
  return row ? parsePatientRow(row) : undefined;
}

export function getAllPatients(): PatientRow[] {
  return (stmts.getAllPatients.all() as RawPatientRow[]).map(parsePatientRow);
}

export function updatePatientSurvivalState(patientId: string, state: string): void {
  stmts.updatePatientSurvivalState.run(state, patientId);
}

// ---------------------------------------------------------------------------
// Staff helpers
// ---------------------------------------------------------------------------

export function insertStaff(s: StaffRow): void {
  stmts.insertStaff.run(s.staffId, s.userId, s.name, s.password, s.role, s.createdAt);
}

export function getStaffById(staffId: string): StaffRow | undefined {
  return stmts.getStaffById.get(staffId) as StaffRow | undefined;
}

// ---------------------------------------------------------------------------
// Encounter helpers
// ---------------------------------------------------------------------------

export function upsertEncounter<T extends { encounterId: string; patientId: string; forensicLifecycleTimeline?: unknown[] }>(enc: T): void {
  stmts.upsertEncounter.run(enc.encounterId, enc.patientId, JSON.stringify(enc));

  // Sync each forensic log entry into the dedicated table
  if (Array.isArray(enc.forensicLifecycleTimeline)) {
    for (const entry of enc.forensicLifecycleTimeline as Array<Record<string, unknown>>) {
      if (entry["logId"] && entry["eventType"] && entry["timestamp"]) {
        stmts.insertForensicLog.run(
          entry["logId"],
          enc.encounterId,
          enc.patientId,
          entry["eventType"],
          entry["timestamp"],
          JSON.stringify(entry),
        );
      }
    }
  }
}

export function getEncounterById<T>(encounterId: string): T | undefined {
  const row = stmts.getEncounterById.get(encounterId) as RawEncounterRow | undefined;
  return row ? (JSON.parse(row.data) as T) : undefined;
}

export function getAllEncounters<T>(): T[] {
  return (stmts.getAllEncounters.all() as RawEncounterRow[]).map((r) => JSON.parse(r.data) as T);
}

export function getEncountersByPatient<T>(patientId: string): T[] {
  return (stmts.getEncountersByPatient.all(patientId) as RawEncounterRow[]).map((r) => JSON.parse(r.data) as T);
}

export function encounterIdExists(encounterId: string): boolean {
  return !!stmts.encounterIdExists.get(encounterId);
}

// ---------------------------------------------------------------------------
// Forensic log helpers (for sync-master endpoint)
// ---------------------------------------------------------------------------

export interface ForensicLogRow {
  logId: string;
  encounterId: string;
  patientId: string;
  eventType: string;
  timestamp: string;
  forensicPayload: Record<string, unknown>;
}

export function getForensicLogsByPatient(patientId: string): ForensicLogRow[] {
  return (stmts.getForensicLogsByPatient.all(patientId) as RawForensicRow[]).map((r) => ({
    ...r,
    forensicPayload: JSON.parse(r.forensicPayload),
  }));
}
