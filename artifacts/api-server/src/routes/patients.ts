import { Router } from "express";

const router = Router();

interface Patient {
  id: number;
  name: string;
  room_no: string;
  bed_no: string;
  symptoms: string;
  priority: "RED" | "YELLOW" | "GREEN";
  status: "active" | "handled";
  created_at: string;
}

let patients: Patient[] = [];
let nextId = 1;

function triage(symptoms: string = ""): "RED" | "YELLOW" | "GREEN" {
  const s = symptoms.toLowerCase();
  const RED = [
    "chest pain",
    "unconscious",
    "not breathing",
    "seizure",
    "stroke",
    "severe bleeding",
    "cardiac",
    "heart attack",
  ];
  const YELLOW = [
    "shortness of breath",
    "high fever",
    "fracture",
    "vomiting blood",
    "deep cut",
    "dehydration",
    "head injury",
  ];
  if (RED.some((k) => s.includes(k))) return "RED";
  if (YELLOW.some((k) => s.includes(k))) return "YELLOW";
  return "GREEN";
}

const priorityOrder: Record<string, number> = { RED: 0, YELLOW: 1, GREEN: 2 };

function sortedPatients(): Patient[] {
  return [...patients].sort((a, b) => {
    if (a.status === "handled" && b.status !== "handled") return 1;
    if (b.status === "handled" && a.status !== "handled") return -1;
    return (priorityOrder[a.priority] ?? 3) - (priorityOrder[b.priority] ?? 3);
  });
}

router.get("/patients/stats", (req, res) => {
  const stats = {
    total: patients.length,
    active: patients.filter((p) => p.status === "active").length,
    handled: patients.filter((p) => p.status === "handled").length,
    red: patients.filter((p) => p.priority === "RED").length,
    yellow: patients.filter((p) => p.priority === "YELLOW").length,
    green: patients.filter((p) => p.priority === "GREEN").length,
  };
  res.json(stats);
});

router.get("/patients", (_req, res) => {
  res.json(sortedPatients());
});

router.post("/patients", (req, res) => {
  const staff = (req.headers["x-staff-identity"] as string) || "System Gateway";
  const { name, room_no, bed_no, symptoms } = req.body || {};
  if (!name || !room_no || !symptoms) {
    res.status(400).json({ error: "name, room_no, symptoms required" });
    return;
  }
  const patient: Patient = {
    id: nextId++,
    name,
    room_no,
    bed_no: bed_no || "",
    symptoms,
    priority: triage(symptoms),
    status: "active",
    created_at: new Date().toISOString(),
  };
  patients.push(patient);
  req.log.info(`[AUDIT] 🏨 Staff Identity [${staff}] successfully ADMITTED patient: ${name} to Room ${room_no}.`);
  res.status(201).json(patient);
});

router.patch("/patients/:id", (req, res) => {
  const staff = (req.headers["x-staff-identity"] as string) || "System Gateway";
  const id = Number(req.params.id);
  const p = patients.find((x) => x.id === id);
  if (!p) {
    res.status(404).json({ error: "not found" });
    return;
  }
  Object.assign(p, req.body || {});
  req.log.info(`[AUDIT] ⚡ Staff Identity [${staff}] updated status for Patient ID #${id} to [${req.body?.status || "modified"}].`);
  res.json(p);
});

router.delete("/patients/:id", (req, res) => {
  const id = Number(req.params.id);
  const exists = patients.some((x) => x.id === id);
  if (!exists) {
    res.status(404).json({ error: "not found" });
    return;
  }
  patients = patients.filter((x) => x.id !== id);
  res.json({ ok: true });
});

export default router;
