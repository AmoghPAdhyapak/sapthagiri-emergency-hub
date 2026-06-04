import { Router } from "express";
import {
  insertPatient,
  getPatientById,
  getPatientByPhone,
  getPatientByName,
  insertStaff,
  getStaffById,
  type PatientRow,
} from "../lib/sqliteDb";

export interface PatientUser {
  patientId: string;
  name: string;
  phone: string;
  age: string;
  email: string;
  password: string;
  allergies: string[];
  role: "patient";
  createdAt: string;
}

export interface StaffUser {
  userId: string;
  staffId: string;
  name: string;
  password: string;
  role: string;
  createdAt: string;
}

function generatePatientId(): string {
  return `Patient-${Math.floor(1000 + Math.random() * 9000)}`;
}

function generateUniquePatientId(): string {
  let id = generatePatientId();
  while (getPatientById(id)) id = generatePatientId();
  return id;
}

/** Normalize phone to 10-digit local number, stripping country code prefixes */
function normalizePhone(raw: string): string {
  const d = String(raw).replace(/\D/g, "");
  if (d.length === 12 && d.startsWith("91")) return d.slice(2);
  if (d.length === 11 && d.startsWith("0")) return d.slice(1);
  return d;
}

function parseAllergies(raw: unknown): string[] {
  if (Array.isArray(raw)) return (raw as string[]).map(String).filter(Boolean);
  if (typeof raw === "string" && raw.trim()) return raw.split(",").map((a) => a.trim()).filter(Boolean);
  return [];
}

function rowToPatientUser(row: PatientRow): PatientUser {
  return {
    patientId: row.patientId,
    name: row.name,
    phone: row.phone,
    age: row.age,
    email: row.email,
    password: row.password,
    allergies: row.allergies,
    role: "patient",
    createdAt: row.createdAt,
  };
}

const router = Router();

// POST /api/auth/patient/register
router.post("/patient/register", (req, res) => {
  const { name, phone, age, email, password, allergies } = req.body || {};
  if (!name || !phone || !password) {
    res.status(400).json({ error: "name, phone, password required" });
    return;
  }
  const phoneClean = normalizePhone(phone);
  const existing = getPatientByPhone(phoneClean);
  if (existing) {
    const user = rowToPatientUser(existing);
    const { password: _, ...safe } = user;
    res.json({ success: true, patientId: existing.patientId, name: existing.name, user: safe });
    return;
  }
  const patientId = generateUniquePatientId();
  const patient: PatientRow = {
    patientId,
    name: String(name).trim(),
    phone: phoneClean,
    age: String(age || ""),
    email: String(email || ""),
    password: String(password),
    allergies: parseAllergies(allergies),
    survivalState: "Stable",
    createdAt: new Date().toISOString(),
  };
  insertPatient(patient);
  const user = rowToPatientUser(patient);
  const { password: _, ...safe } = user;
  res.status(201).json({ success: true, patientId, name: patient.name, user: safe });
});

// POST /api/auth/patient/login
// Dual-mode: {phone, password} OR {name, password}
router.post("/patient/login", (req, res) => {
  const { phone, name, password, loginType } = req.body || {};
  if (!password) {
    res.status(400).json({ error: "password required" });
    return;
  }

  let row: PatientRow | undefined;

  if (loginType === "NAME_PASSWORD" && name) {
    row = getPatientByName(String(name).trim());
    if (!row) {
      res.status(404).json({ error: `No patient account found for name "${name}". Please register first.` });
      return;
    }
  } else {
    if (!phone) {
      res.status(400).json({ error: "phone required" });
      return;
    }
    const phoneClean = normalizePhone(phone);
    row = getPatientByPhone(phoneClean);
    if (!row) {
      res.status(404).json({
        error: `No patient account found for phone ${phone}. Please register first.`,
      });
      return;
    }
  }

  if (row.password !== String(password)) {
    res.status(401).json({ error: "Incorrect password. Please try again." });
    return;
  }

  const user = rowToPatientUser(row);
  const { password: _, ...safe } = user;
  res.json({ success: true, user: safe });
});

// GET /api/auth/patient/:patientId — internal lookup
router.get("/patient/:patientId", (req, res) => {
  const row = getPatientById(req.params.patientId);
  if (!row) {
    res.status(404).json({ error: "Patient not found" });
    return;
  }
  const user = rowToPatientUser(row);
  const { password: _, ...safe } = user;
  res.json(safe);
});

// POST /api/auth/staff/register
router.post("/staff/register", (req, res) => {
  const { name, staffId, password, role } = req.body || {};
  if (!name || !staffId || !password) {
    res.status(400).json({ error: "name, staffId, password required" });
    return;
  }
  const idUpper = String(staffId).trim().toUpperCase();
  if (getStaffById(idUpper)) {
    res.status(409).json({ error: "Staff ID already registered." });
    return;
  }
  const user = {
    staffId: idUpper,
    userId: `USR-${Date.now()}`,
    name: String(name).trim(),
    password: String(password),
    role: String(role || "Staff"),
    createdAt: new Date().toISOString(),
  };
  insertStaff(user);
  const { password: _, ...safe } = user;
  res.status(201).json({ success: true, user: safe });
});

// POST /api/auth/staff/login
router.post("/staff/login", (req, res) => {
  const { staffId, password } = req.body || {};
  if (!staffId || !password) {
    res.status(400).json({ error: "staffId and password required" });
    return;
  }
  const idUpper = String(staffId).trim().toUpperCase();
  const user = getStaffById(idUpper);
  if (!user) {
    res.status(404).json({ error: "Staff ID not registered. Please create an account." });
    return;
  }
  if (user.password !== String(password)) {
    res.status(401).json({ error: "Incorrect password." });
    return;
  }
  const { password: _, ...safe } = user;
  res.json({ success: true, user: safe });
});

export default router;
