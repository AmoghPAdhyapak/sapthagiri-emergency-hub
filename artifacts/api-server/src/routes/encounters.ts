import { Router } from "express";
import { patientsFolder } from "./auth";

export interface ContinuityEntry {
  id: string;
  doctorName: string;
  doctorId: string;
  hospital: string;
  medRegId: string;
  doctorPhone: string;
  notes: string;
  timestamp: string;
  verificationStatus: string;
}

export interface StatusHistoryEntry {
  eventId: string;
  action: string;
  previousLevel: string;
  newLevel: string;
  doctorId: string;
  timestamp: string;
}

export interface EncounterRecord {
  encounterId: string;
  patientId: string;
  patientName: string;
  symptoms: string;
  visitReason: string;
  triageLevel: "RED" | "YELLOW" | "GREEN";
  assignedDoctor: string;
  doctorId: string;
  timestamp: string;
  crossHospitalContinuityLogs: ContinuityEntry[];
  statusHistory: StatusHistoryEntry[];
  completionStatus?: string;
  isArchived?: boolean;
  terminationTimestamp?: string;
}

export const encounters = new Map<string, EncounterRecord>();

const RED_KEYWORDS = [
  "chest pain", "cardiac", "breathing failure", "not breathing",
  "unconscious", "heart attack", "stroke", "severe bleeding", "seizure",
  "respiratory failure", "anaphylaxis", "coma", "no pulse",
];

const YELLOW_KEYWORDS = [
  "shortness of breath", "high fever", "fracture", "vomiting blood",
  "deep cut", "dehydration", "head injury", "severe pain", "dizziness",
];

function autoTriage(symptoms: string, doctorSelection: string): "RED" | "YELLOW" | "GREEN" {
  const s = symptoms.toLowerCase();
  if (RED_KEYWORDS.some((k) => s.includes(k))) return "RED";
  if (doctorSelection === "RED") return "RED";
  if (YELLOW_KEYWORDS.some((k) => s.includes(k))) return "YELLOW";
  if (doctorSelection === "YELLOW") return "YELLOW";
  return "GREEN";
}

const router = Router();

// POST /api/triage/process
router.post("/process", (req, res) => {
  const { patientId, symptoms, visitReason, juniorDoctorSelection, doctorId } = req.body || {};
  if (!patientId || !symptoms) {
    res.status(400).json({ error: "patientId and symptoms required" });
    return;
  }
  const finalTriageLevel = autoTriage(symptoms, juniorDoctorSelection || "GREEN");
  const patient = patientsFolder.get(patientId);

  let encounterId = `ENC-${Math.floor(1000 + Math.random() * 9000)}`;
  while (encounters.has(encounterId)) encounterId = `ENC-${Math.floor(1000 + Math.random() * 9000)}`;

  const record: EncounterRecord = {
    encounterId,
    patientId,
    patientName: patient?.name || "Unknown Patient",
    symptoms: String(symptoms),
    visitReason: String(visitReason || ""),
    triageLevel: finalTriageLevel,
    assignedDoctor: String(doctorId || "Unassigned"),
    doctorId: String(doctorId || ""),
    timestamp: new Date().toISOString(),
    crossHospitalContinuityLogs: [],
    statusHistory: [
      {
        eventId: `EVT-${Date.now()}`,
        action: "TRIAGE_CREATED",
        previousLevel: "",
        newLevel: finalTriageLevel,
        doctorId: String(doctorId || "AUTO"),
        timestamp: new Date().toISOString(),
      },
    ],
    isArchived: false,
  };

  encounters.set(encounterId, record);
  req.log.info(`[TRIAGE] ENC ${encounterId} → ${finalTriageLevel} | Patient ${patientId} | Doctor ${doctorId}`);
  res.status(201).json({ success: true, encounter: record });
});

// GET /api/triage/encounters
router.get("/encounters", (_req, res) => {
  const all = [...encounters.values()]
    .filter((e) => !e.isArchived)
    .sort((a, b) => {
      if (a.triageLevel === "RED" && b.triageLevel !== "RED") return -1;
      if (a.triageLevel !== "RED" && b.triageLevel === "RED") return 1;
      if (a.triageLevel === "YELLOW" && b.triageLevel === "GREEN") return -1;
      if (a.triageLevel === "GREEN" && b.triageLevel === "YELLOW") return 1;
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });
  res.json(all);
});

// GET /api/triage/encounters/:id
router.get("/encounters/:id", (req, res) => {
  const enc = encounters.get(req.params.id);
  if (!enc) { res.status(404).json({ error: "Encounter not found" }); return; }
  res.json(enc);
});

// POST /api/triage/encounters/:id/continuity
router.post("/encounters/:id/continuity", (req, res) => {
  const enc = encounters.get(req.params.id);
  if (!enc) { res.status(404).json({ error: "Encounter not found" }); return; }
  const { doctorName, doctorId, hospital, medRegId, doctorPhone, notes } = req.body || {};
  if (!doctorName || !notes) {
    res.status(400).json({ error: "doctorName and notes required" });
    return;
  }
  const entry: ContinuityEntry = {
    id: `NOTE-${Math.floor(10000 + Math.random() * 90000)}`,
    doctorName: String(doctorName),
    doctorId: String(doctorId || ""),
    hospital: String(hospital || ""),
    medRegId: String(medRegId || ""),
    doctorPhone: String(doctorPhone || ""),
    notes: String(notes),
    timestamp: new Date().toISOString(),
    verificationStatus: "Unverified",
  };
  enc.crossHospitalContinuityLogs.push(entry);
  res.status(201).json({ success: true, entry });
});

// PATCH /api/triage/emergency-hub/action
router.patch("/emergency-hub/action", (req, res) => {
  const { encounterId, doctorId, statusAction } = req.body || {};

  if (!doctorId) {
    res.status(403).json({ success: false, error: "Access Denied. Valid Licensed Doctor ID required." });
    return;
  }
  if (!encounterId || !statusAction) {
    res.status(400).json({ success: false, error: "encounterId and statusAction required." });
    return;
  }

  const activeEncounter = encounters.get(String(encounterId));
  if (!activeEncounter) {
    res.status(404).json({ success: false, error: "Emergency record reference not located." });
    return;
  }

  if (statusAction === "OUT_OF_DANGER") {
    activeEncounter.triageLevel = "GREEN";
  } else if (statusAction === "UNDER_OBSERVATION") {
    activeEncounter.triageLevel = "YELLOW";
  } else if (statusAction === "DECEASED") {
    activeEncounter.isArchived = true;
    activeEncounter.terminationTimestamp = new Date().toISOString();
  } else {
    res.status(400).json({ success: false, error: "Invalid statusAction. Must be OUT_OF_DANGER, UNDER_OBSERVATION, or DECEASED." });
    return;
  }

  encounters.set(encounterId, activeEncounter);
  req.log.info(`[EMERGENCY-HUB] ${encounterId} → ${statusAction} by Doctor ${doctorId}`);
  res.status(200).json({
    success: true,
    message: `Patient state modified to ${statusAction}. Queue recalculated.`,
    encounter: activeEncounter,
  });
});

// PATCH /api/triage/queue/action — universal action endpoint for all triage zones
router.patch("/queue/action", (req, res) => {
  const { encounterId, doctorId, action } = req.body || {};

  if (!doctorId) {
    res.status(403).json({ success: false, error: "Doctor ID required to authorize this action." });
    return;
  }
  if (!encounterId || !action) {
    res.status(400).json({ success: false, error: "encounterId and action are required." });
    return;
  }

  const enc = encounters.get(String(encounterId));
  if (!enc) {
    res.status(404).json({ success: false, error: "Encounter not found." });
    return;
  }

  const previousLevel = enc.triageLevel;
  const ts = new Date().toISOString();

  if (!enc.statusHistory) enc.statusHistory = [];

  if (action === "COMPLETED") {
    enc.isArchived = true;
    enc.completionStatus = "COMPLETED";
    enc.terminationTimestamp = ts;
    enc.statusHistory.push({
      eventId: `EVT-${Date.now()}`,
      action: "COMPLETED",
      previousLevel,
      newLevel: previousLevel,
      doctorId: String(doctorId),
      timestamp: ts,
    });
  } else if (action === "ESCALATE") {
    const nextLevel = previousLevel === "GREEN" ? "YELLOW" : previousLevel === "YELLOW" ? "RED" : null;
    if (!nextLevel) {
      res.status(400).json({ success: false, error: "Cannot escalate a RED patient further." });
      return;
    }
    enc.triageLevel = nextLevel as "RED" | "YELLOW" | "GREEN";
    enc.statusHistory.push({
      eventId: `EVT-${Date.now()}`,
      action: `ESCALATE_${previousLevel}_TO_${nextLevel}`,
      previousLevel,
      newLevel: nextLevel,
      doctorId: String(doctorId),
      timestamp: ts,
    });
  } else if (action === "UNDER_OBSERVATION") {
    enc.completionStatus = "ONGOING";
    enc.statusHistory.push({
      eventId: `EVT-${Date.now()}`,
      action: "UNDER_OBSERVATION",
      previousLevel,
      newLevel: previousLevel,
      doctorId: String(doctorId),
      timestamp: ts,
    });
  } else {
    res.status(400).json({ success: false, error: "Invalid action. Must be COMPLETED, ESCALATE, or UNDER_OBSERVATION." });
    return;
  }

  encounters.set(encounterId, enc);
  req.log.info(`[QUEUE-ACTION] ${encounterId} → ${action} by Doctor ${doctorId}`);
  res.status(200).json({ success: true, encounter: enc });
});

// GET /api/triage/patient/:patientId
router.get("/patient/:patientId", (req, res) => {
  const patientEncounters = [...encounters.values()]
    .filter((e) => e.patientId === req.params.patientId)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  res.json(patientEncounters);
});

export default router;
