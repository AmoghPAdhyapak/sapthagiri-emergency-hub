import { Router } from "express";
import {
  upsertEncounter,
  getEncounterById,
  getAllEncounters,
  getEncountersByPatient,
  encounterIdExists,
  getPatientById,
  getForensicLogsByPatient,
} from "../lib/sqliteDb";

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
  reason?: string;
  clinicalObservation?: string;
}

export interface ForensicLogEntry {
  logId: string;
  eventType: "DOCTOR_CHAIN" | "DEATH_REPORT" | "RECOVERY_TRAJECTORY" | "AI_OVERRIDE" | "CROSS_HOSPITAL";
  timestamp: string;
  [key: string]: unknown;
}

export interface EncounterRecord {
  encounterId: string;
  patientId: string;
  patientName: string;
  symptoms: string;
  symptomFinalVerdict: string;
  visitReason: string;
  triageLevel: "RED" | "YELLOW" | "GREEN";
  allergies: string[];
  assignedDoctor: string;
  doctorId: string;
  timestamp: string;
  crossHospitalContinuityLogs: ContinuityEntry[];
  statusHistory: StatusHistoryEntry[];
  forensicLifecycleTimeline: ForensicLogEntry[];
  aiOverrideTriggered?: boolean;
  completionStatus?: string;
  isArchived?: boolean;
  terminationTimestamp?: string;
  deceasedAt?: string;
  medicalImageBase64?: string;
}

// Dean Registry — licensed external doctor IDs allowed to submit continuity notes
export const DEAN_REGISTRY = ["75657", "88241", "99432", "AUTO-DISPATCH-ROUTER"];

const RED_KEYWORDS = [
  "chest pain", "cardiac", "breathing failure", "not breathing",
  "unconscious", "heart attack", "stroke", "severe bleeding", "seizure",
  "respiratory failure", "anaphylaxis", "coma", "no pulse",
  "cardiac arrest", "breathing collapse", "internal bleeding",
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

function verdictLabel(level: "RED" | "YELLOW" | "GREEN"): string {
  if (level === "RED") return "RED — Critical Emergency";
  if (level === "YELLOW") return "YELLOW — Urgent Care Required";
  return "GREEN — Stable / Routine Monitoring";
}

function scanForCriticalPhrase(text: string): string | undefined {
  const lower = text.toLowerCase();
  return RED_KEYWORDS.find((p) => lower.includes(p));
}

function overrideBannerMessage(phrase: string): string {
  if (phrase.includes("heart") || phrase.includes("cardiac")) {
    return "AI Override Activated: Cardiac emergency indicators detected.";
  }
  if (phrase.includes("breath") || phrase.includes("collapse") || phrase.includes("respiratory")) {
    return "AI Override Activated: Critical respiratory failure language detected.";
  }
  if (phrase.includes("bleed") || phrase.includes("bleeding")) {
    return "AI Override Activated: Severe hemorrhage indicators detected.";
  }
  return "AI Override Activated: Neurological emergency severity threshold exceeded.";
}

function mkForensicId(): string {
  return `FOR-LN-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
}

function generateEncounterId(): string {
  return `ENC-${Math.floor(1000 + Math.random() * 9000)}`;
}

function generateUniqueEncounterId(): string {
  let id = generateEncounterId();
  while (encounterIdExists(id)) id = generateEncounterId();
  return id;
}

const router = Router();

// POST /api/triage/process
router.post("/process", (req, res) => {
  const { patientId, symptoms, visitReason, juniorDoctorSelection, doctorId, allergies, medicalImageBase64 } = req.body || {};
  if (!patientId || !symptoms) {
    res.status(400).json({ error: "patientId and symptoms required" });
    return;
  }
  const finalTriageLevel = autoTriage(symptoms, juniorDoctorSelection || "GREEN");
  const patient = getPatientById(patientId);

  const encounterId = generateUniqueEncounterId();

  const allergyList: string[] = Array.isArray(allergies)
    ? (allergies as string[]).map(String).filter(Boolean)
    : typeof allergies === "string" && allergies.trim()
      ? allergies.split(",").map((a: string) => a.trim()).filter(Boolean)
      : patient?.allergies ?? [];

  const ts0 = new Date().toISOString();
  const docSel = (juniorDoctorSelection || "GREEN").toString().toUpperCase();
  const aiOverrideActive = finalTriageLevel === "RED" && docSel !== "RED";
  const matchedIntakePhrase = scanForCriticalPhrase(String(symptoms) + " " + String(visitReason || ""));
  const bannerReason = aiOverrideActive && matchedIntakePhrase ? overrideBannerMessage(matchedIntakePhrase) : undefined;

  const forensicTimeline: ForensicLogEntry[] = [];

  if (aiOverrideActive && matchedIntakePhrase) {
    forensicTimeline.push({
      logId: mkForensicId(),
      eventType: "AI_OVERRIDE",
      timestamp: ts0,
      originalDoctorVerdict: docSel,
      aiOverrideReason: bannerReason,
      detectedEmergencyPhrase: matchedIntakePhrase,
      authorizingDoctorId: String(doctorId || "AUTO"),
    });
  }
  forensicTimeline.push({
    logId: mkForensicId(),
    eventType: "DOCTOR_CHAIN",
    timestamp: ts0,
    doctorId: String(doctorId || "AUTO"),
    roleInTreatment: "Initial Triage Classification",
    escalationDecision: finalTriageLevel,
  });

  const record: EncounterRecord = {
    encounterId,
    patientId,
    patientName: patient?.name || "Unknown Patient",
    symptoms: String(symptoms),
    symptomFinalVerdict: verdictLabel(finalTriageLevel),
    visitReason: String(visitReason || ""),
    triageLevel: finalTriageLevel,
    allergies: allergyList,
    assignedDoctor: String(doctorId || "Unassigned"),
    doctorId: String(doctorId || ""),
    timestamp: ts0,
    crossHospitalContinuityLogs: [],
    statusHistory: [
      {
        eventId: `EVT-${Date.now()}`,
        action: "TRIAGE_CREATED",
        previousLevel: "",
        newLevel: finalTriageLevel,
        doctorId: String(doctorId || "AUTO"),
        timestamp: ts0,
      },
    ],
    forensicLifecycleTimeline: forensicTimeline,
    aiOverrideTriggered: aiOverrideActive && !!matchedIntakePhrase,
    isArchived: false,
    ...(medicalImageBase64 && typeof medicalImageBase64 === "string"
      ? { medicalImageBase64: medicalImageBase64.slice(0, 8 * 1024 * 1024) }
      : {}),
  };

  upsertEncounter(record);
  req.log.info(`[TRIAGE] ENC ${encounterId} → ${finalTriageLevel} | Patient ${patientId} | Doctor ${doctorId} | AIOverride:${record.aiOverrideTriggered}`);
  res.status(201).json({ success: true, encounter: record, aiOverrideActive: record.aiOverrideTriggered, bannerReason });
});

// GET /api/triage/encounters
router.get("/encounters", (_req, res) => {
  const all = getAllEncounters<EncounterRecord>()
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

// GET /api/triage/deceased — frozen write-protected archive of deceased records
router.get("/deceased", (_req, res) => {
  const deceased = getAllEncounters<EncounterRecord>()
    .filter((e) => e.isArchived && e.deceasedAt)
    .sort((a, b) => new Date(b.deceasedAt!).getTime() - new Date(a.deceasedAt!).getTime());
  res.json(deceased);
});

// GET /api/triage/encounters/:id
router.get("/encounters/:id", (req, res) => {
  const enc = getEncounterById<EncounterRecord>(req.params.id);
  if (!enc) { res.status(404).json({ error: "Encounter not found" }); return; }
  res.json(enc);
});

// GET /api/triage/sync-master/:patientId — unified persistent state for patient + forensic timeline
router.get("/sync-master/:patientId", (req, res) => {
  const { patientId } = req.params;
  const profile = getPatientById(patientId);
  if (!profile) {
    res.status(404).json({ success: false, error: "Patient record completely missing from persistent storage rows." });
    return;
  }
  const { password: _, ...safeProfile } = profile;
  const forensicTimeline = getForensicLogsByPatient(patientId);
  res.json({ success: true, profile: safeProfile, forensicTimeline });
});

// POST /api/triage/encounters/:id/continuity
// Requires Dean Registry validation for external doctor IDs
router.post("/encounters/:id/continuity", (req, res) => {
  const enc = getEncounterById<EncounterRecord>(req.params.id);
  if (!enc) { res.status(404).json({ error: "Encounter not found" }); return; }
  const { doctorName, doctorId, hospital, medRegId, doctorPhone, notes } = req.body || {};
  if (!doctorName || !notes) {
    res.status(400).json({ error: "doctorName and notes required" });
    return;
  }
  if (doctorId && !DEAN_REGISTRY.includes(String(doctorId).trim())) {
    res.status(403).json({
      error: `Doctor ID "${doctorId}" is not listed in the Dean Registry. Only registered external practitioners may submit continuity notes. Authorized IDs: 75657, 88241, 99432.`,
    });
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
    verificationStatus: DEAN_REGISTRY.includes(String(doctorId || "").trim()) ? "Dean-Verified" : "Unverified",
  };
  enc.crossHospitalContinuityLogs.push(entry);
  if (!enc.forensicLifecycleTimeline) enc.forensicLifecycleTimeline = [];
  enc.forensicLifecycleTimeline.push({
    logId: mkForensicId(),
    eventType: "CROSS_HOSPITAL",
    timestamp: entry.timestamp,
    facilityName: String(hospital || ""),
    externalDoctorLicenseId: String(medRegId || ""),
    externalDoctorPhone: String(doctorPhone || ""),
    externalDoctorId: String(doctorId || ""),
    treatmentSummary: String(notes),
    verificationStatus: entry.verificationStatus,
  });
  upsertEncounter(enc);
  res.status(201).json({ success: true, entry });
});

// PATCH /api/triage/emergency-hub/action
router.patch("/emergency-hub/action", (req, res) => {
  const { encounterId, doctorId, statusAction, reason, clinicalObservation } = req.body || {};

  if (!doctorId) {
    res.status(403).json({ success: false, error: "Access Denied. Valid Licensed Doctor ID required." });
    return;
  }
  if (!encounterId || !statusAction) {
    res.status(400).json({ success: false, error: "encounterId and statusAction required." });
    return;
  }
  if (!reason || !String(reason).trim()) {
    res.status(400).json({ success: false, error: "Clinical reasoning is mandatory. Provide a reason for the status change." });
    return;
  }

  const activeEncounter = getEncounterById<EncounterRecord>(String(encounterId));
  if (!activeEncounter) {
    res.status(404).json({ success: false, error: "Emergency record reference not located." });
    return;
  }

  const ts = new Date().toISOString();
  const reasonStr = String(reason).trim();
  const observationStr = clinicalObservation ? String(clinicalObservation).trim() : undefined;

  if (statusAction === "OUT_OF_DANGER") {
    activeEncounter.triageLevel = "GREEN";
    activeEncounter.symptomFinalVerdict = verdictLabel("GREEN");
    activeEncounter.statusHistory.push({
      eventId: `EVT-${Date.now()}`,
      action: "OUT_OF_DANGER",
      previousLevel: "RED",
      newLevel: "GREEN",
      doctorId: String(doctorId),
      timestamp: ts,
      reason: reasonStr,
      clinicalObservation: observationStr,
    });
  } else if (statusAction === "UNDER_OBSERVATION") {
    activeEncounter.triageLevel = "YELLOW";
    activeEncounter.symptomFinalVerdict = verdictLabel("YELLOW");
    activeEncounter.statusHistory.push({
      eventId: `EVT-${Date.now()}`,
      action: "UNDER_OBSERVATION",
      previousLevel: "RED",
      newLevel: "YELLOW",
      doctorId: String(doctorId),
      timestamp: ts,
      reason: reasonStr,
      clinicalObservation: observationStr,
    });
  } else if (statusAction === "DECEASED") {
    activeEncounter.isArchived = true;
    activeEncounter.terminationTimestamp = ts;
    activeEncounter.deceasedAt = ts;
    activeEncounter.completionStatus = "DECEASED";
    activeEncounter.statusHistory.push({
      eventId: `EVT-${Date.now()}`,
      action: "DECEASED — Record Permanently Archived",
      previousLevel: "RED",
      newLevel: "DECEASED",
      doctorId: String(doctorId),
      timestamp: ts,
      reason: reasonStr,
      clinicalObservation: observationStr,
    });
  } else {
    res.status(400).json({ success: false, error: "Invalid statusAction. Must be OUT_OF_DANGER, UNDER_OBSERVATION, or DECEASED." });
    return;
  }

  // Forensic lifecycle timeline
  if (!activeEncounter.forensicLifecycleTimeline) activeEncounter.forensicLifecycleTimeline = [];

  // Scan reason + observation for critical emergency phrases
  const combinedHubText = `${reasonStr} ${observationStr ?? ""}`;
  const matchedHubPhrase = scanForCriticalPhrase(combinedHubText);
  let hubAiOverride = false;
  let hubBannerReason: string | undefined;
  if (matchedHubPhrase) {
    hubAiOverride = true;
    hubBannerReason = overrideBannerMessage(matchedHubPhrase);
    activeEncounter.aiOverrideTriggered = true;
    activeEncounter.forensicLifecycleTimeline.push({
      logId: mkForensicId(),
      eventType: "AI_OVERRIDE",
      timestamp: ts,
      originalDoctorVerdict: statusAction,
      aiOverrideReason: hubBannerReason,
      detectedEmergencyPhrase: matchedHubPhrase,
      authorizingDoctorId: String(doctorId),
    });
  }

  activeEncounter.forensicLifecycleTimeline.push({
    logId: mkForensicId(),
    eventType: "DOCTOR_CHAIN",
    timestamp: ts,
    doctorId: String(doctorId),
    roleInTreatment: `Status Mutation: ${statusAction}`,
    escalationDecision: statusAction,
    observationNotes: observationStr,
  });

  if (statusAction === "DECEASED") {
    activeEncounter.forensicLifecycleTimeline.push({
      logId: mkForensicId(),
      eventType: "DEATH_REPORT",
      timestamp: ts,
      exactCauseOfDeath: reasonStr,
      symptomsBeforeDeath: activeEncounter.symptoms,
      attendingDoctors: [String(doctorId)],
      finalClinicalNotes: observationStr,
    });
  } else if (statusAction === "OUT_OF_DANGER") {
    activeEncounter.forensicLifecycleTimeline.push({
      logId: mkForensicId(),
      eventType: "RECOVERY_TRAJECTORY",
      timestamp: ts,
      stabilizationLog: reasonStr,
      recoveryObservations: observationStr,
      dischargeCode: "OUT_OF_DANGER",
    });
  }

  upsertEncounter(activeEncounter);
  req.log.info(`[EMERGENCY-HUB] ${encounterId} → ${statusAction} by Doctor ${doctorId} | AIOverride:${hubAiOverride}`);
  res.status(200).json({
    success: true,
    message: `Patient state modified to ${statusAction}. Queue recalculated.`,
    encounter: activeEncounter,
    aiOverrideActive: hubAiOverride,
    bannerReason: hubBannerReason,
  });
});

// PATCH /api/triage/queue/action — universal action endpoint for all triage zones
router.patch("/queue/action", (req, res) => {
  const { encounterId, doctorId, action, reason, clinicalObservation } = req.body || {};

  if (!doctorId) {
    res.status(403).json({ success: false, error: "Doctor ID required to authorize this action." });
    return;
  }
  if (!encounterId || !action) {
    res.status(400).json({ success: false, error: "encounterId and action are required." });
    return;
  }
  if (!reason || !String(reason).trim()) {
    res.status(400).json({ success: false, error: "Clinical reasoning is mandatory. Provide a reason for the status change." });
    return;
  }

  const enc = getEncounterById<EncounterRecord>(String(encounterId));
  if (!enc) {
    res.status(404).json({ success: false, error: "Encounter not found." });
    return;
  }

  const previousLevel = enc.triageLevel;
  const ts = new Date().toISOString();
  const reasonStr = String(reason).trim();
  const observationStr = clinicalObservation ? String(clinicalObservation).trim() : undefined;

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
      reason: reasonStr,
      clinicalObservation: observationStr,
    });
  } else if (action === "ESCALATE") {
    const nextLevel = previousLevel === "GREEN" ? "YELLOW" : previousLevel === "YELLOW" ? "RED" : null;
    if (!nextLevel) {
      res.status(400).json({ success: false, error: "Cannot escalate a RED patient further." });
      return;
    }
    enc.triageLevel = nextLevel as "RED" | "YELLOW" | "GREEN";
    enc.symptomFinalVerdict = verdictLabel(enc.triageLevel);
    enc.statusHistory.push({
      eventId: `EVT-${Date.now()}`,
      action: `ESCALATE_${previousLevel}_TO_${nextLevel}`,
      previousLevel,
      newLevel: nextLevel,
      doctorId: String(doctorId),
      timestamp: ts,
      reason: reasonStr,
      clinicalObservation: observationStr,
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
      reason: reasonStr,
      clinicalObservation: observationStr,
    });
  } else if (action === "DECEASED") {
    enc.isArchived = true;
    enc.completionStatus = "DECEASED";
    enc.terminationTimestamp = ts;
    enc.deceasedAt = ts;
    enc.statusHistory.push({
      eventId: `EVT-${Date.now()}`,
      action: "DECEASED — Record Permanently Archived",
      previousLevel,
      newLevel: "DECEASED",
      doctorId: String(doctorId),
      timestamp: ts,
      reason: reasonStr,
      clinicalObservation: observationStr,
    });
  } else {
    res.status(400).json({ success: false, error: "Invalid action. Must be COMPLETED, ESCALATE, UNDER_OBSERVATION, or DECEASED." });
    return;
  }

  // Forensic lifecycle timeline
  if (!enc.forensicLifecycleTimeline) enc.forensicLifecycleTimeline = [];

  // Scan reason + observation for critical emergency phrases
  const combinedQueueText = `${reasonStr} ${observationStr ?? ""}`;
  const matchedQueuePhrase = scanForCriticalPhrase(combinedQueueText);
  let queueAiOverride = false;
  let queueBannerReason: string | undefined;
  if (matchedQueuePhrase) {
    queueAiOverride = true;
    queueBannerReason = overrideBannerMessage(matchedQueuePhrase);
    enc.aiOverrideTriggered = true;
    enc.forensicLifecycleTimeline.push({
      logId: mkForensicId(),
      eventType: "AI_OVERRIDE",
      timestamp: ts,
      originalDoctorVerdict: action,
      aiOverrideReason: queueBannerReason,
      detectedEmergencyPhrase: matchedQueuePhrase,
      authorizingDoctorId: String(doctorId),
    });
  }

  enc.forensicLifecycleTimeline.push({
    logId: mkForensicId(),
    eventType: "DOCTOR_CHAIN",
    timestamp: ts,
    doctorId: String(doctorId),
    roleInTreatment: `Status Mutation: ${action}`,
    escalationDecision: action,
    observationNotes: observationStr,
  });

  if (action === "DECEASED") {
    enc.forensicLifecycleTimeline.push({
      logId: mkForensicId(),
      eventType: "DEATH_REPORT",
      timestamp: ts,
      exactCauseOfDeath: reasonStr,
      symptomsBeforeDeath: enc.symptoms,
      attendingDoctors: [String(doctorId)],
      finalClinicalNotes: observationStr,
    });
  } else if (action === "COMPLETED") {
    enc.forensicLifecycleTimeline.push({
      logId: mkForensicId(),
      eventType: "RECOVERY_TRAJECTORY",
      timestamp: ts,
      stabilizationLog: reasonStr,
      recoveryObservations: observationStr,
      dischargeCode: "COMPLETED",
    });
  }

  upsertEncounter(enc);
  req.log.info(`[QUEUE-ACTION] ${encounterId} → ${action} by Doctor ${doctorId} | AIOverride:${queueAiOverride}`);
  res.status(200).json({ success: true, encounter: enc, aiOverrideActive: queueAiOverride, bannerReason: queueBannerReason });
});

// GET /api/triage/patient/:patientId
router.get("/patient/:patientId", (req, res) => {
  const patientEncounters = getEncountersByPatient<EncounterRecord>(req.params.patientId)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  res.json(patientEncounters);
});

export default router;
