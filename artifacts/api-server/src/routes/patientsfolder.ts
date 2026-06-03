import { Router } from "express";
import { patientsFolder } from "./auth";
import { encounters } from "./encounters";

const router = Router();

// GET /api/patients-folder — all registered patients (staff only)
router.get("/", (_req, res) => {
  const patients = [...patientsFolder.values()].map(({ password: _, ...p }) => p);
  res.json(patients);
});

// GET /api/patients-folder/:patientId — single patient with encounters
router.get("/:patientId", (req, res) => {
  const patient = patientsFolder.get(req.params.patientId);
  if (!patient) {
    res.status(404).json({ error: "Patient not found in folder" });
    return;
  }
  const { password: _, ...safePatient } = patient;
  const patientEncounters = [...encounters.values()]
    .filter((e) => e.patientId === req.params.patientId)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  res.json({ ...safePatient, encounters: patientEncounters });
});

export default router;
