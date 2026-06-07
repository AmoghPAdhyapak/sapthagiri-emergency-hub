import { Router } from "express";
import {
  insertPatient,
  getPatientById,
  getPatientByPhone,
  getPatientByName,
  insertStaff,
  getStaffById,
  getAllStaff,
  updateStaffStatus,
  type PatientRow,
} from "../lib/sqliteDb";

// ── Role-based Staff ID generation ───────────────────────────────────────────
const ROLE_PREFIX_MAP: Record<string, string> = {
  "Doctor":                     "DOC",
  "Nurse":                      "NUR",
  "Medical Officer":            "MED",
  "Pharmacist":                 "PHA",
  "Receptionist":               "REC",
  "Lab Technician":             "LAB",
  "Radiologist":                "RAD",
  "Administrative Staff":       "ADM",
  "Emergency Technician":       "EMT",
  "Staff Registration Officer": "STF",
};

function generateStaffIdForRole(role: string): string {
  const prefix = ROLE_PREFIX_MAP[role] ?? "STF";
  const num = Math.floor(100 + Math.random() * 900).toString();
  return `${prefix}${num}`;
}

function generateUniqueStaffId(role: string): string {
  let id = generateStaffIdForRole(role);
  let tries = 0;
  while (getStaffById(id) && tries++ < 20) id = generateStaffIdForRole(role);
  return id;
}

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

// POST /api/auth/verify — backend-as-source-of-truth session rehydration
// Called by AuthProvider on every page load to verify the cached localStorage session
// against the persistent SQLite store.
router.post("/verify", (req, res) => {
  const { role, id } = req.body || {};
  if (!role || !id) {
    res.status(400).json({ valid: false, error: "Role and reference ID required for synchronization verification." });
    return;
  }

  if (role === "patient") {
    const row = getPatientById(String(id));
    if (!row) {
      res.status(404).json({ valid: false, error: "Persistent patient registration parameters not located." });
      return;
    }
    const user = rowToPatientUser(row);
    const { password: _, ...safe } = user;
    res.json({ valid: true, role: "patient", user: safe });
    return;
  }

  // Staff and guest-staff paths
  // Guest users (GUEST id) are not persisted — return a synthetic valid response
  // so they aren't forcibly logged out on refresh.
  if (String(id).toUpperCase() === "GUEST") {
    res.json({ valid: true, role: "staff", user: { name: "Guest Staff", staffId: "GUEST", role: "staff" } });
    return;
  }

  const user = getStaffById(String(id).toUpperCase());
  if (!user) {
    res.status(404).json({ valid: false, error: "Persistent staff registration parameters not located." });
    return;
  }
  const { password: _, ...safe } = user;
  res.json({ valid: true, role: user.role.toLowerCase(), user: safe });
});

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
  if (!name || !password) {
    res.status(400).json({ error: "name and password required" });
    return;
  }
  const resolvedRole = String(role || "Staff").trim();

  // Auto-generate ID from role prefix if not provided
  let idUpper: string;
  if (staffId && String(staffId).trim()) {
    idUpper = String(staffId).trim().toUpperCase();
  } else {
    idUpper = generateUniqueStaffId(resolvedRole);
  }

  if (getStaffById(idUpper)) {
    // If manually provided ID conflicts, try auto-generating
    if (staffId && String(staffId).trim()) {
      res.status(409).json({ error: `Staff ID ${idUpper} already registered.` });
      return;
    }
    idUpper = generateUniqueStaffId(resolvedRole);
  }

  const user = {
    staffId: idUpper,
    userId: `USR-${Date.now()}`,
    name: String(name).trim(),
    password: String(password),
    role: resolvedRole,
    createdAt: new Date().toISOString(),
    accountStatus: "active" as const,
  };
  insertStaff(user);
  const { password: _, ...safe } = user;
  res.status(201).json({ success: true, staffId: idUpper, user: safe });
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
  if ((user.accountStatus ?? "active") === "inactive") {
    res.status(403).json({ error: "This account has been deactivated. Contact your administrator." });
    return;
  }
  if (user.password !== String(password)) {
    res.status(401).json({ error: "Incorrect password." });
    return;
  }
  const { password: _, ...safe } = user;
  res.json({ success: true, user: safe });
});

// GET /api/auth/staff/all — Dean governance: list all staff accounts (sans passwords)
router.get("/staff/all", (_req, res) => {
  const staff = getAllStaff();
  const safe = staff.map(({ password: _, ...s }) => s);
  res.json(safe);
});

// PATCH /api/auth/staff/:staffId/status — Dean governance: activate / deactivate
router.patch("/staff/:staffId/status", (req, res) => {
  const idUpper = String(req.params.staffId).toUpperCase();
  const { status } = req.body || {};
  if (status !== "active" && status !== "inactive") {
    res.status(400).json({ error: "status must be 'active' or 'inactive'" });
    return;
  }
  const user = getStaffById(idUpper);
  if (!user) {
    res.status(404).json({ error: "Staff member not found." });
    return;
  }
  updateStaffStatus(idUpper, status);
  res.json({ success: true, staffId: idUpper, accountStatus: status });
});

export default router;
