import { Router } from "express";

export interface PatientUser {
  patientId: string;
  name: string;
  phone: string;
  age: string;
  email: string;
  password: string;
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

const router = Router();

// POST /api/auth/patient/register
router.post("/patient/register", (req, res) => {
  const { name, phone, age, email, password } = req.body || {};
  if (!name || !phone || !password) {
    res.status(400).json({ error: "name, phone, password required" });
    return;
  }
  const phoneClean = String(phone).replace(/\D/g, "");
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

  if (loginType === "NAME_PASSWORD" || (!phone && name)) {
    // Name + Password mode
    if (!name) {
      res.status(400).json({ error: "name required for name-based login" });
      return;
    }
    patient = [...patientsFolder.values()].find(
      (p) => p.name.toLowerCase() === String(name).toLowerCase().trim()
    );
    if (!patient) {
      res.status(401).json({ error: "No patient account found with this name. Please check spelling or register first." });
      return;
    }
  } else {
    // Phone + Password mode (default)
    if (!phone) {
      res.status(400).json({ error: "phone or name required" });
      return;
    }
    const phoneClean = String(phone).replace(/\D/g, "");
    patient = [...patientsFolder.values()].find((p) => p.phone === phoneClean);
    if (!patient) {
      res.status(401).json({ error: "No patient account found for this phone number. Please register first." });
      return;
    }
  }

  if (patient.password !== String(password)) {
    res.status(401).json({ error: "Incorrect password." });
    return;
  }
  const { password: _, ...safe } = patient;
  res.json({ success: true, user: safe });
});

// POST /api/auth/staff/register
router.post("/staff/register", (req, res) => {
  const { name, staffId, password, role } = req.body || {};
  if (!name || !staffId || !password) {
    res.status(400).json({ error: "name, staffId, password required" });
    return;
  }
  const idClean = String(staffId).trim().toUpperCase();
  if (staffUsers.has(idClean)) {
    res.status(409).json({ error: "Staff ID already registered. Please choose a different ID or log in." });
    return;
  }
  const staff: StaffUser = {
    userId: idClean,
    staffId: idClean,
    name: String(name).trim(),
    password: String(password),
    role: role ? String(role).trim() : "Staff",
    createdAt: new Date().toISOString(),
  };
  staffUsers.set(idClean, staff);
  const { password: _, ...safe } = staff;
  res.status(201).json({ success: true, userId: idClean, name: staff.name, user: safe });
});

// POST /api/auth/staff/login
router.post("/staff/login", (req, res) => {
  const { staffId, password } = req.body || {};
  if (!staffId || !password) {
    res.status(400).json({ error: "staffId and password required" });
    return;
  }
  const idClean = String(staffId).trim().toUpperCase();
  const staff = staffUsers.get(idClean);
  if (!staff) {
    res.status(401).json({ error: "No staff account found for this Staff ID." });
    return;
  }
  if (staff.password !== String(password)) {
    res.status(401).json({ error: "Incorrect password." });
    return;
  }
  const { password: _, ...safe } = staff;
  res.json({ success: true, user: safe });
});

// GET /api/auth/staff-directory
router.get("/staff-directory", (_req, res) => {
  const all = [...staffUsers.values()].map(({ password: _, ...safe }) => safe);
  res.json(all);
});

export default router;
