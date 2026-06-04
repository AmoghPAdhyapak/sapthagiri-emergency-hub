import { Router } from "express";

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

export const patientsFolder = new Map<string, PatientUser>();
export const staffUsers = new Map<string, StaffUser>();

function generatePatientId(): string {
  return `Patient-${Math.floor(1000 + Math.random() * 9000)}`;
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

const router = Router();

// POST /api/auth/patient/register
router.post("/patient/register", (req, res) => {
  const { name, phone, age, email, password, allergies } = req.body || {};
  if (!name || !phone || !password) {
    res.status(400).json({ error: "name, phone, password required" });
    return;
  }
  const phoneClean = normalizePhone(phone);
  const existing = [...patientsFolder.values()].find((p) => p.phone === phoneClean);
  if (existing) {
    const { password: _, ...safe } = existing;
    res.json({ success: true, patientId: existing.patientId, name: existing.name, user: safe });
    return;
  }
  let patientId = generatePatientId();
  while (patientsFolder.has(patientId)) patientId = generatePatientId();
  const patient: PatientUser = {
    patientId,
    name: String(name).trim(),
    phone: phoneClean,
    age: String(age || ""),
    email: String(email || ""),
    password: String(password),
    allergies: parseAllergies(allergies),
    role: "patient",
    createdAt: new Date().toISOString(),
  };
  patientsFolder.set(patientId, patient);
  const { password: _, ...safe } = patient;
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

  let patient: PatientUser | undefined;

  if (loginType === "NAME_PASSWORD" && name) {
    patient = [...patientsFolder.values()].find(
      (p) => p.name.toLowerCase().trim() === String(name).toLowerCase().trim()
    );
    if (!patient) {
      res.status(404).json({ error: `No patient account found for name "${name}". Please register first.` });
      return;
    }
  } else {
    if (!phone) {
      res.status(400).json({ error: "phone required" });
      return;
    }
    const phoneClean = normalizePhone(phone);
    patient = [...patientsFolder.values()].find((p) => p.phone === phoneClean);
    if (!patient) {
      res.status(404).json({
        error: `No patient account found for phone ${phone}. Please register first.`,
      });
      return;
    }
  }

  if (patient.password !== String(password)) {
    res.status(401).json({ error: "Incorrect password. Please try again." });
    return;
  }

  const { password: _, ...safe } = patient;
  res.json({ success: true, user: safe });
});

// GET /api/auth/patient/:patientId — internal lookup
router.get("/patient/:patientId", (req, res) => {
  const patient = patientsFolder.get(req.params.patientId);
  if (!patient) {
    res.status(404).json({ error: "Patient not found" });
    return;
  }
  const { password: _, ...safe } = patient;
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
  const existing = staffUsers.get(idUpper);
  if (existing) {
    res.status(409).json({ error: "Staff ID already registered." });
    return;
  }
  const user: StaffUser = {
    userId: `USR-${Date.now()}`,
    staffId: idUpper,
    name: String(name).trim(),
    password: String(password),
    role: String(role || "Staff"),
    createdAt: new Date().toISOString(),
  };
  staffUsers.set(idUpper, user);
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
  const user = staffUsers.get(idUpper);
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
