import { useState, useEffect, useRef } from "react";
import {
  Users, Search, X, ChevronRight, User, Phone, Mail, Calendar,
  Stethoscope, ClipboardList, Clock, FileText,
  Loader2, Activity, Link2, Eye, ImagePlus, XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ClinicalOverrideBanner, type OverrideSignal } from "./ClinicalOverrideBanner";
import { ClinicalRealismChips } from "./ClinicalRealismChips";

interface PatientRecord {
  patientId: string;
  name: string;
  phone: string;
  age: string;
  email: string;
  createdAt: string;
}

interface ContinuityEntry {
  id: string;
  doctorName: string;
  doctorId: string;
  hospital: string;
  medRegId?: string;
  doctorPhone?: string;
  notes: string;
  timestamp: string;
}

interface ForensicLogEntry {
  logId: string;
  eventType: "DOCTOR_CHAIN" | "DEATH_REPORT" | "RECOVERY_TRAJECTORY" | "AI_OVERRIDE" | "CROSS_HOSPITAL";
  timestamp: string;
  [key: string]: unknown;
}

interface EncounterRecord {
  encounterId: string;
  patientId: string;
  patientName: string;
  symptoms: string;
  visitReason: string;
  medicalImageBase64?: string;
  triageLevel: "RED" | "YELLOW" | "GREEN";
  assignedDoctor: string;
  doctorId: string;
  timestamp: string;
  crossHospitalContinuityLogs: ContinuityEntry[];
  forensicLifecycleTimeline?: ForensicLogEntry[];
  aiOverrideTriggered?: boolean;
  completionStatus?: string;
}

interface PatientDetail extends PatientRecord {
  encounters: EncounterRecord[];
}

const TRIAGE_COLORS = {
  RED:    "bg-red-500/20 text-red-300 border-red-500/40",
  YELLOW: "bg-yellow-500/20 text-yellow-300 border-yellow-500/40",
  GREEN:  "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
};

function getDoctorsFromStorage(): { name: string; doctor_id: string }[] {
  try {
    const stored = localStorage.getItem("sapthagiri_doctors");
    if (stored) return JSON.parse(stored) as { name: string; doctor_id: string }[];
  } catch { /* ignore */ }
  return [
    { name: "Dr. Primary Physician", doctor_id: "DOC001" },
    { name: "Dr. Senior Resident",   doctor_id: "DOC101" },
    { name: "Dr. Emergency Consult", doctor_id: "DOC102" },
  ];
}

export function PatientsFolderPanel() {
  const [patients, setPatients] = useState<PatientRecord[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedPatient, setSelectedPatient] = useState<PatientDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Triage form state
  const [symptoms, setSymptoms] = useState("");
  const [visitReason, setVisitReason] = useState("");
  const [doctorList] = useState<{ name: string; doctor_id: string }[]>(() => getDoctorsFromStorage());
  const [doctorId, setDoctorId] = useState(() => getDoctorsFromStorage()[0]?.doctor_id ?? "DOC001");
  const [secondaryDoctorId, setSecondaryDoctorId] = useState("");
  const [secondaryManual, setSecondaryManual] = useState("");
  const [useManualSecondary, setUseManualSecondary] = useState(false);
  const [triageLoading, setTriageLoading] = useState(false);
  const [triageMsg, setTriageMsg] = useState("");
  const [overrideSignal, setOverrideSignal] = useState<OverrideSignal | null>(null);

  // Medical image upload state
  const [medicalImageBase64, setMedicalImageBase64] = useState<string | null>(null);
  const [imageFileName, setImageFileName] = useState<string>("");
  const imageInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setTriageMsg("Image too large — maximum 5 MB.");
      return;
    }
    setImageFileName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result;
      if (typeof result === "string") setMedicalImageBase64(result);
    };
    reader.readAsDataURL(file);
  };

  const clearImage = () => {
    setMedicalImageBase64(null);
    setImageFileName("");
    if (imageInputRef.current) imageInputRef.current.value = "";
  };

  useEffect(() => {
    fetch("/api/patients-folder")
      .then((r) => r.json())
      .then((data: PatientRecord[]) => { setPatients(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const filtered = patients.filter((p) => {
    const q = search.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      p.phone.includes(q) ||
      p.email.toLowerCase().includes(q) ||
      p.patientId.toLowerCase().includes(q)
    );
  });

  const openPatient = async (patientId: string) => {
    setLoadingDetail(true);
    setTriageMsg("");
    try {
      const r = await fetch(`/api/patients-folder/${patientId}`);
      const data = await r.json() as PatientDetail;
      setSelectedPatient(data);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleTriage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient || !symptoms) return;
    setTriageLoading(true);
    setTriageMsg("");
    try {
      const r = await fetch("/api/triage/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId: selectedPatient.patientId,
          symptoms,
          visitReason,
          doctorId,
          juniorDoctorSelection: "GREEN",
          secondaryDoctorId: useManualSecondary ? secondaryManual : secondaryDoctorId,
          ...(medicalImageBase64 ? { medicalImageBase64 } : {}),
        }),
      });
      const data = await r.json() as { encounter: EncounterRecord; aiOverrideActive?: boolean; bannerReason?: string };
      if (data.aiOverrideActive && data.bannerReason) {
        setOverrideSignal({ active: true, message: data.bannerReason });
      }
      setTriageMsg(`✓ Triage complete — ${data.encounter.triageLevel}${data.aiOverrideActive ? " [AI OVERRIDE]" : ""} | ${data.encounter.encounterId}`);
      setSymptoms("");
      setVisitReason("");
      clearImage();
      await openPatient(selectedPatient.patientId);
    } catch {
      setTriageMsg("Failed to submit triage.");
    } finally {
      setTriageLoading(false);
    }
  };

  if (selectedPatient) {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <button
          onClick={() => setSelectedPatient(null)}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-5 transition-colors"
        >
          <ChevronRight className="w-4 h-4 rotate-180" /> Back to Folder
        </button>

        {/* Identity Card */}
        <Card className="mb-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <User className="w-4 h-4" /> Patient Identity — Read Only
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-muted-foreground text-xs mb-0.5">Patient ID</p>
              <p className="font-mono font-bold text-primary">{selectedPatient.patientId}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs mb-0.5">Full Name</p>
              <p className="font-semibold text-foreground">{selectedPatient.name}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs mb-0.5 flex items-center gap-1"><Phone className="w-3 h-3" /> Phone</p>
              <p className="font-mono text-foreground">{selectedPatient.phone}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs mb-0.5">Age</p>
              <p className="font-semibold text-foreground">{selectedPatient.age || "—"}</p>
            </div>
            <div className="col-span-2">
              <p className="text-muted-foreground text-xs mb-0.5 flex items-center gap-1"><Mail className="w-3 h-3" /> Email</p>
              <p className="text-foreground">{selectedPatient.email || "—"}</p>
            </div>
            <div className="col-span-2">
              <p className="text-muted-foreground text-xs mb-0.5 flex items-center gap-1"><Calendar className="w-3 h-3" /> Registered</p>
              <p className="text-foreground">{new Date(selectedPatient.createdAt).toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>

        {/* New Triage Form */}
        <Card className="mb-4 border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-primary flex items-center gap-2">
              <Stethoscope className="w-4 h-4" /> New Triage Encounter
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleTriage} className="space-y-3">
              <div>
                <Label className="text-xs">Symptoms *</Label>
                <Textarea
                  placeholder="Describe presenting symptoms..."
                  value={symptoms}
                  onChange={(e) => setSymptoms(e.target.value)}
                  className="bg-background/50 min-h-[70px] resize-none mt-1 text-sm"
                  required
                />
              </div>
              <div>
                <Label className="text-xs">Visit Reason</Label>
                <Input
                  placeholder="Emergency / Follow-up / Routine..."
                  value={visitReason}
                  onChange={(e) => setVisitReason(e.target.value)}
                  className="bg-background/50 mt-1 text-sm"
                />
              </div>
              {/* Medical Image Upload */}
              <div>
                <Label className="text-xs flex items-center gap-1.5">
                  <ImagePlus className="w-3.5 h-3.5 text-primary" /> Medical Image (optional, max 5 MB)
                </Label>
                <div className="mt-1">
                  {medicalImageBase64 ? (
                    <div className="relative w-full rounded-md overflow-hidden border border-primary/30 bg-background/50">
                      <img src={medicalImageBase64} alt="Medical scan" className="w-full max-h-40 object-contain" />
                      <button
                        type="button"
                        onClick={clearImage}
                        className="absolute top-1.5 right-1.5 bg-background/90 rounded-full p-0.5 text-destructive hover:text-red-400 transition-colors"
                        title="Remove image"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                      <p className="text-[10px] text-muted-foreground px-2 py-1 truncate">{imageFileName}</p>
                    </div>
                  ) : (
                    <label className="flex items-center gap-2 cursor-pointer border border-dashed border-border hover:border-primary/40 rounded-md px-3 py-2 bg-background/50 transition-colors">
                      <ImagePlus className="w-4 h-4 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">Attach scan / X-ray / report…</span>
                      <input
                        ref={imageInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleImageSelect}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>

              {/* ── Dual Doctor Assignment ── */}
              <div>
                <Label className="text-xs flex items-center gap-1.5">
                  <Stethoscope className="w-3.5 h-3.5 text-primary" /> Primary Attending Doctor
                </Label>
                <Select value={doctorId} onValueChange={setDoctorId}>
                  <SelectTrigger className="mt-1 text-sm bg-background/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {doctorList.map((d) => (
                      <SelectItem key={d.doctor_id} value={d.doctor_id}>
                        {d.name} <span className="font-mono text-muted-foreground ml-1">({d.doctor_id})</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <Label className="text-xs flex items-center gap-1.5">
                    <Stethoscope className="w-3.5 h-3.5 text-muted-foreground" /> Secondary Doctor (optional)
                  </Label>
                  <button
                    type="button"
                    onClick={() => { setUseManualSecondary(v => !v); setSecondaryDoctorId(""); setSecondaryManual(""); }}
                    className="text-[10px] text-primary hover:underline font-medium"
                  >
                    {useManualSecondary ? "Use dropdown" : "Type manually"}
                  </button>
                </div>
                {useManualSecondary ? (
                  <Input
                    placeholder="Doctor name or ID (e.g. Dr. Smith / DOC202)"
                    value={secondaryManual}
                    onChange={(e) => setSecondaryManual(e.target.value)}
                    className="bg-background/50 mt-1 text-sm"
                  />
                ) : (
                  <Select value={secondaryDoctorId} onValueChange={setSecondaryDoctorId}>
                    <SelectTrigger className="mt-1 text-sm bg-background/50">
                      <SelectValue placeholder="None (single doctor assignment)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {doctorList.filter((d) => d.doctor_id !== doctorId).map((d) => (
                        <SelectItem key={d.doctor_id} value={d.doctor_id}>
                          {d.name} <span className="font-mono text-muted-foreground ml-1">({d.doctor_id})</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
              {triageMsg && (
                <p className={`text-xs p-2 rounded border font-medium ${
                  triageMsg.startsWith("✓")
                    ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
                    : "text-destructive bg-destructive/10 border-destructive/20"
                }`}>{triageMsg}</p>
              )}
              <Button type="submit" size="sm" disabled={triageLoading} className="w-full">
                {triageLoading ? <Loader2 className="w-3 h-3 mr-2 animate-spin" /> : <Activity className="w-3 h-3 mr-2" />}
                Run AI Triage
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Encounters History */}
        {selectedPatient.encounters.length > 0 && (
          <Card className="mb-4">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <ClipboardList className="w-4 h-4" /> Encounter History ({selectedPatient.encounters.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {selectedPatient.encounters.map((enc) => (
                <div key={enc.encounterId} className={`rounded-lg border p-3 ${
                  enc.triageLevel === "RED"
                    ? "border-red-500/40 bg-red-500/5"
                    : enc.triageLevel === "YELLOW"
                    ? "border-yellow-500/30 bg-yellow-500/5"
                    : "border-emerald-500/20 bg-emerald-500/5"
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-xs font-bold text-muted-foreground">{enc.encounterId}</span>
                    <Badge variant="outline" className={`text-xs font-bold ${TRIAGE_COLORS[enc.triageLevel]}`}>
                      {enc.triageLevel}
                    </Badge>
                  </div>
                  <p className="text-sm text-foreground mb-1">{enc.symptoms}</p>
                  <div className="mb-2">
                    <ClinicalRealismChips
                      triageLevel={enc.triageLevel}
                      completionStatus={enc.completionStatus}
                      forensicLifecycleTimeline={enc.forensicLifecycleTimeline}
                      aiOverrideTriggered={enc.aiOverrideTriggered}
                    />
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{new Date(enc.timestamp).toLocaleString()}</span>
                    <span className="flex items-center gap-1"><Stethoscope className="w-3 h-3" />{enc.assignedDoctor}</span>
                  </div>
                  {enc.medicalImageBase64 && (
                    <div className="mt-2 pt-2 border-t border-border/40">
                      <p className="text-[10px] font-bold uppercase text-primary/70 mb-1.5 flex items-center gap-1">
                        <ImagePlus className="w-3 h-3" /> Attached Medical Image
                      </p>
                      <img
                        src={enc.medicalImageBase64}
                        alt="Medical scan"
                        className="w-full max-h-48 object-contain rounded-md border border-border/40 bg-background/50"
                      />
                    </div>
                  )}
                  {enc.crossHospitalContinuityLogs.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-border/40">
                      <p className="text-[10px] font-bold uppercase text-amber-400 mb-1.5 flex items-center gap-1">
                        <Link2 className="w-3 h-3" /> Patient-Submitted External Notes ({enc.crossHospitalContinuityLogs.length})
                      </p>
                      {enc.crossHospitalContinuityLogs.map((c) => (
                        <div key={c.id} className="text-xs bg-amber-500/5 border border-amber-500/20 rounded p-2.5 mb-1.5">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <div>
                              <span className="font-semibold text-amber-400">{c.doctorName}</span>
                              {c.doctorId && <span className="text-muted-foreground font-mono ml-1.5">#{c.doctorId}</span>}
                              {c.hospital && <span className="text-muted-foreground"> · {c.hospital}</span>}
                            </div>
                            <Badge variant="outline" className="text-[9px] px-1 py-0 border-amber-500/30 text-amber-400 shrink-0">
                              Unverified
                            </Badge>
                          </div>
                          {c.medRegId && (
                            <p className="text-muted-foreground font-mono text-[10px] mb-1">Reg. ID: {c.medRegId}</p>
                          )}
                          <p className="text-foreground/80 leading-relaxed">{c.notes}</p>
                          <p className="text-muted-foreground/50 mt-1 text-[10px]">
                            {new Date(c.timestamp).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Staff notice — continuity notes are patient-submitted only */}
        <Card className="border-amber-500/20 bg-amber-500/5">
          <CardContent className="p-4 flex items-start gap-3">
            <Eye className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-1">View Only — Cross-Hospital Continuity Notes</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                External treatment notes are submitted by the patient through their Patient Portal.
                Staff can monitor and verify these records here, but cannot create them on the patient's behalf.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6">
      <ClinicalOverrideBanner overrideSignal={overrideSignal} />
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" /> Patients Folder
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Centralized registered patient records. Search, view history, and manage triage.
          </p>
        </div>
        <Badge variant="outline" className="text-primary border-primary/30 font-mono">
          {patients.length} patients
        </Badge>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search by name, phone, email, or Patient ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 bg-background/50"
        />
        {search && (
          <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          <Loader2 className="w-6 h-6 animate-spin mr-3" /> Loading patient records...
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <Users className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground font-medium">
            {search ? "No patients match your search." : "No registered patients yet."}
          </p>
          <p className="text-sm text-muted-foreground/60 mt-1">
            Patients register via the Patient Portal using OTP verification.
          </p>
        </div>
      ) : (
        <div className="grid gap-3">
          {filtered.map((p) => (
            <button
              key={p.patientId}
              onClick={() => openPatient(p.patientId)}
              className="w-full text-left border border-border/50 rounded-lg p-4 hover:border-primary/30 hover:bg-primary/5 transition-all flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                  <User className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-foreground text-sm">{p.name}</p>
                  <p className="text-xs text-muted-foreground font-mono">{p.patientId}</p>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Phone className="w-3 h-3" />{p.phone}
                    </span>
                    {p.age && (
                      <span className="text-xs text-muted-foreground">Age: {p.age}</span>
                    )}
                  </div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </button>
          ))}
        </div>
      )}

      {loadingDetail && (
        <div className="fixed inset-0 bg-background/50 flex items-center justify-center z-50">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      )}
    </div>
  );
}
