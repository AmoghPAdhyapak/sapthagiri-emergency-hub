import { Router } from "express";
import { getAllPatients, getPatientById, getEncountersByPatient } from "../lib/sqliteDb";
import type { EncounterRecord } from "./encounters";

const router = Router();

// GET /api/patients-folder — all registered patients (staff only)
router.get("/", (_req, res) => {
  const patients = getAllPatients().map(({ password: _, ...p }) => p);
  res.json(patients);
});

// GET /api/patients-folder/:patientId — single patient with encounters
router.get("/:patientId", (req, res) => {
  const patient = getPatientById(req.params.patientId);
  if (!patient) {
    res.status(404).json({ error: "Patient not found in folder" });
    return;
  }
  const { password: _, ...safePatient } = patient;
  const patientEncounters = getEncountersByPatient<EncounterRecord>(req.params.patientId)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  res.json({ ...safePatient, encounters: patientEncounters });
});

export default router;
