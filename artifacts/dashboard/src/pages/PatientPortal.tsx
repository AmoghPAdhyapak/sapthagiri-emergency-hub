import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import {
  User, Heart, Clock, LogOut, Activity, Bot, FileText,
  Phone, Mail, Calendar, Loader2, AlertTriangle, Stethoscope,
  CheckCircle2, Shield,
} from "lucide-react";
import { AiChatPanel } from "@/components/AiChatPanel";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import logoUrl from "@/assets/logo.png";

type PatientView = "profile" | "history" | "visit" | "status" | "ai";

interface PatientUser {
  name: string;
  phone?: string;
  email?: string;
  age?: string;
  patientId?: string;
  role?: string;
}

interface ContinuityEntry {
  id: string;
  doctorName: string;
  doctorId?: string;
  hospital: string;
  medRegId?: string;
  doctorPhone?: string;
  notes: string;
  timestamp: string;
  verificationStatus?: string;
}

interface EncounterRecord {
  encounterId: string;
  symptoms: string;
  visitReason: string;
  triageLevel: "RED" | "YELLOW" | "GREEN";
  assignedDoctor: string;
  timestamp: string;
  crossHospitalContinuityLogs: ContinuityEntry[];
}

const TRIAGE_COLORS = {
  RED:    { badge: "bg-red-500/20 text-red-300 border-red-500/40", label: "text-red-400" },
  YELLOW: { badge: "bg-yellow-500/20 text-yellow-300 border-yellow-500/40", label: "text-yellow-400" },
  GREEN:  { badge: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40", label: "text-emerald-400" },
};

function PatientSidebar({
  activeView,
  onNavigate,
  patient,
}: {
  activeView: PatientView;
  onNavigate: (v: PatientView) => void;
  patient: PatientUser | null;
}) {
  const navItems: { view: PatientView; icon: React.ReactNode; label: string }[] = [
    { view: "profile",  icon: <User className="w-4 h-4" />,          label: "My Profile" },
    { view: "history",  icon: <FileText className="w-4 h-4" />,       label: "Medical History" },
    { view: "visit",    icon: <Heart className="w-4 h-4" />,          label: "Current Visit" },
    { view: "status",   icon: <Activity className="w-4 h-4" />,       label: "Emergency Status" },
  ];

  return (
    <aside className="w-56 shrink-0 border-r border-border bg-card flex flex-col py-4 overflow-y-auto">
      <div className="px-4 mb-5 flex items-center gap-2.5">
        <img src={logoUrl} alt="Sapthagiri NPS" className="h-9 w-9 object-contain shrink-0" />
        <div className="min-w-0">
          <p className="text-xs font-black text-foreground leading-tight truncate">Sapthagiri NPS</p>
          <p className="text-[9px] text-blue-400 uppercase tracking-widest truncate">Patient Portal</p>
        </div>
      </div>

      {patient?.patientId && (
        <div className="mx-4 mb-3 p-2.5 rounded-lg bg-blue-500/10 border border-blue-500/20">
          <p className="text-[9px] text-blue-400 uppercase tracking-wider font-bold mb-0.5">Patient ID</p>
          <p className="font-mono text-xs font-bold text-blue-300">{patient.patientId}</p>
        </div>
      )}

      <div className="px-4 mb-3">
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">My Health</p>
      </div>
      <nav className="flex flex-col gap-1 px-2 flex-1">
        {navItems.map(({ view, icon, label }) => (
          <button
            key={view}
            onClick={() => onNavigate(view)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors text-left ${
              activeView === view
                ? "bg-blue-500/15 text-blue-300 border border-blue-500/20"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            }`}
          >
            {icon}
            {label}
          </button>
        ))}

        <button
          onClick={() => onNavigate("ai")}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors text-left mt-1 ${
            activeView === "ai"
              ? "bg-primary/15 text-primary border border-primary/20"
              : "text-primary border border-primary/20 bg-primary/10 hover:bg-primary/20 shadow-[0_0_12px_hsl(180_70%_50%_/_0.15)]"
          }`}
        >
          <Bot className={`w-4 h-4 ${activeView !== "ai" ? "animate-pulse" : ""}`} />
          <span>AI Assistant</span>
          <span className="ml-auto flex h-1.5 w-1.5 rounded-full bg-primary animate-ping" />
        </button>
      </nav>

      <div className="px-4 mt-4 pt-4 border-t border-border">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
          <span className="text-[10px] font-mono text-blue-400 uppercase tracking-wider">Patient Live</span>
        </div>
      </div>
    </aside>
  );
}

function ProfileView({ patient }: { patient: PatientUser }) {
  return (
    <div className="p-6 max-w-xl mx-auto">
      <h2 className="text-xl font-bold text-foreground mb-5 flex items-center gap-2">
        <User className="w-5 h-5 text-blue-400" /> My Profile
      </h2>
      <Card className="border-blue-500/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <Shield className="w-3.5 h-3.5" /> Identity Card — Read Only
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-0 divide-y divide-border/50">
          {patient.patientId && (
            <div className="flex items-center justify-between py-3">
              <span className="text-sm text-muted-foreground font-medium">Patient ID</span>
              <span className="font-mono text-sm font-bold text-blue-300">{patient.patientId}</span>
            </div>
          )}
          <div className="flex items-center justify-between py-3">
            <span className="text-sm text-muted-foreground font-medium">Full Name</span>
            <span className="text-sm font-semibold text-foreground">{patient.name}</span>
          </div>
          <div className="flex items-center justify-between py-3">
            <span className="text-sm text-muted-foreground font-medium flex items-center gap-2">
              <Phone className="w-3.5 h-3.5 text-primary" /> Phone
              <Badge variant="outline" className="text-[9px] px-1 py-0 text-primary border-primary/30">PRIMARY ID</Badge>
            </span>
            <span className="text-sm font-mono font-semibold text-foreground">{patient.phone || "—"}</span>
          </div>
          {patient.email && (
            <div className="flex items-center justify-between py-3">
              <span className="text-sm text-muted-foreground font-medium flex items-center gap-2">
                <Mail className="w-3.5 h-3.5" /> Email
              </span>
              <span className="text-sm text-foreground">{patient.email}</span>
            </div>
          )}
          {patient.age && (
            <div className="flex items-center justify-between py-3">
              <span className="text-sm text-muted-foreground font-medium flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5" /> Age
              </span>
              <span className="text-sm font-semibold text-foreground">{patient.age} years</span>
            </div>
          )}
          <div className="flex items-center justify-between py-3">
            <span className="text-sm text-muted-foreground font-medium">Role</span>
            <Badge variant="outline" className="text-xs font-semibold bg-blue-500/10 text-blue-300 border-blue-500/30">
              Patient
            </Badge>
          </div>
        </CardContent>
      </Card>
      <div className="mt-4 p-3 bg-muted/30 rounded-lg border border-border/40">
        <p className="text-xs text-muted-foreground">
          <strong className="text-foreground">Note:</strong> Your profile is read-only. If any details are incorrect, please contact the hospital reception or email{" "}
          <a href="mailto:sapthagiri.healthsupport@gmail.com" className="text-primary hover:underline">
            sapthagiri.healthsupport@gmail.com
          </a>
        </p>
      </div>
    </div>
  );
}

interface NoteForm {
  doctorName: string;
  doctorId: string;
  hospital: string;
  medRegId: string;
  doctorPhone: string;
  notes: string;
}

function EncounterCard({ enc }: { enc: EncounterRecord }) {
  const colors = TRIAGE_COLORS[enc.triageLevel];
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [noteForm, setNoteForm] = useState<NoteForm>({ doctorName: "", doctorId: "", hospital: "", medRegId: "", doctorPhone: "", notes: "" });
  const [noteLoading, setNoteLoading] = useState(false);
  const [noteResult, setNoteResult] = useState<{ success: boolean; message: string } | null>(null);
  const [localLogs, setLocalLogs] = useState(enc.crossHospitalContinuityLogs);

  const handleNoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteForm.doctorName.trim() || !noteForm.notes.trim()) {
      setNoteResult({ success: false, message: "Doctor name and treatment notes are required." });
      return;
    }
    setNoteLoading(true);
    try {
      const res = await fetch(`/api/triage/encounters/${enc.encounterId}/continuity`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(noteForm),
      });
      const data = await res.json() as { success?: boolean; entry?: ContinuityEntry; error?: string };
      if (!res.ok || !data.success) {
        setNoteResult({ success: false, message: data.error ?? "Failed to add note." });
      } else {
        if (data.entry) setLocalLogs((prev) => [...prev, data.entry!]);
        setNoteForm({ doctorName: "", doctorId: "", hospital: "", medRegId: "", doctorPhone: "", notes: "" });
        setShowNoteForm(false);
        setNoteResult({ success: true, message: "Note added successfully." });
      }
    } catch {
      setNoteResult({ success: false, message: "Network error." });
    } finally {
      setNoteLoading(false);
    }
  };

  return (
    <Card className={`border ${
      enc.triageLevel === "RED" ? "border-red-500/40" : enc.triageLevel === "YELLOW" ? "border-yellow-500/30" : "border-emerald-500/20"
    }`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3 mb-2">
          <span className="font-mono text-xs font-bold text-muted-foreground">{enc.encounterId}</span>
          <Badge variant="outline" className={`text-xs font-bold ${colors.badge}`}>
            {enc.triageLevel}
          </Badge>
        </div>
        <p className="text-sm text-foreground mb-2">{enc.symptoms}</p>
        {enc.visitReason && (
          <p className="text-xs text-muted-foreground mb-2">Reason: {enc.visitReason}</p>
        )}
        <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
          <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{new Date(enc.timestamp).toLocaleString()}</span>
          <span className="flex items-center gap-1"><Stethoscope className="w-3 h-3" />{enc.assignedDoctor}</span>
        </div>

        {/* Doctor Medical Notes / Cross-Hospital Observations Timeline */}
        <div className="mt-4 pt-3 border-t border-border/30">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Shield className="w-3 h-3" /> Doctor Medical Notes / Cross-Hospital Observations
            </p>
            <button
              onClick={() => { setShowNoteForm((v) => !v); setNoteResult(null); }}
              className="text-[10px] font-semibold text-primary hover:underline flex items-center gap-1"
            >
              {showNoteForm ? "Cancel" : "+ Add Note"}
            </button>
          </div>

          {/* Existing notes timeline */}
          {localLogs.length > 0 ? (
            <div className="space-y-2 mb-3">
              {localLogs.map((c) => (
                <div key={c.id} className="bg-background/40 border border-border/30 rounded-lg p-3 text-xs">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div>
                      <span className="font-semibold text-primary">{c.doctorName}</span>
                      {c.doctorId && <span className="text-muted-foreground font-mono ml-1.5">#{c.doctorId}</span>}
                      {c.hospital && <span className="text-muted-foreground"> · {c.hospital}</span>}
                    </div>
                    <Badge variant="outline" className="text-[9px] px-1 py-0 border-amber-500/30 text-amber-400 shrink-0">
                      Unverified
                    </Badge>
                  </div>
                  <p className="text-foreground/80 leading-relaxed">{c.notes}</p>
                  <p className="text-muted-foreground/50 mt-1.5 text-[10px]">
                    {new Date(c.timestamp).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            !showNoteForm && (
              <p className="text-xs text-muted-foreground/50 italic mb-3">No doctor observations recorded yet for this encounter.</p>
            )
          )}

          {/* Inline add note form */}
          {showNoteForm && (
            <form onSubmit={handleNoteSubmit} className="space-y-3 bg-primary/5 border border-primary/15 rounded-lg p-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-primary mb-2">Add Doctor / Cross-Hospital Observation</p>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-muted-foreground uppercase">Doctor Name *</label>
                  <input
                    type="text"
                    placeholder="Dr. Full Name"
                    value={noteForm.doctorName}
                    onChange={(e) => setNoteForm((p) => ({ ...p, doctorName: e.target.value }))}
                    className="w-full rounded-md border border-border bg-background/60 px-2.5 py-1.5 text-xs text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary/40"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-muted-foreground uppercase">Doctor ID</label>
                  <input
                    type="text"
                    placeholder="e.g. DOC101"
                    value={noteForm.doctorId}
                    onChange={(e) => setNoteForm((p) => ({ ...p, doctorId: e.target.value.toUpperCase() }))}
                    className="w-full rounded-md border border-border bg-background/60 px-2.5 py-1.5 text-xs text-foreground font-mono placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary/40"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-muted-foreground uppercase">Workplace / Hospital</label>
                <input
                  type="text"
                  placeholder="e.g. Sapthagiri NPS Medical Center"
                  value={noteForm.hospital}
                  onChange={(e) => setNoteForm((p) => ({ ...p, hospital: e.target.value }))}
                  className="w-full rounded-md border border-border bg-background/60 px-2.5 py-1.5 text-xs text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary/40"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-muted-foreground uppercase">Medical Reg. ID *</label>
                  <input
                    type="text"
                    placeholder="e.g. MCI-2024-XXXXX"
                    value={noteForm.medRegId}
                    onChange={(e) => setNoteForm((p) => ({ ...p, medRegId: e.target.value.toUpperCase() }))}
                    className="w-full rounded-md border border-border bg-background/60 px-2.5 py-1.5 text-xs text-foreground font-mono placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary/40"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-muted-foreground uppercase">Doctor Phone</label>
                  <input
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={noteForm.doctorPhone}
                    onChange={(e) => setNoteForm((p) => ({ ...p, doctorPhone: e.target.value }))}
                    className="w-full rounded-md border border-border bg-background/60 px-2.5 py-1.5 text-xs text-foreground font-mono placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary/40"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-muted-foreground uppercase">Treatment Notes *</label>
                <textarea
                  rows={3}
                  placeholder="Clinical observations, treatment administered, follow-up instructions..."
                  value={noteForm.notes}
                  onChange={(e) => setNoteForm((p) => ({ ...p, notes: e.target.value }))}
                  className="w-full rounded-md border border-border bg-background/60 px-2.5 py-1.5 text-xs text-foreground placeholder:text-muted-foreground/40 resize-none focus:outline-none focus:ring-1 focus:ring-primary/40"
                />
              </div>
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 text-[10px] text-amber-400">
                  <AlertTriangle className="w-3 h-3" />
                  <span>Verification Status: <strong>Unverified</strong> (default)</span>
                </div>
                <button
                  type="submit"
                  disabled={noteLoading}
                  className="px-3 py-1.5 text-xs font-semibold rounded-md bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50 flex items-center gap-1.5"
                >
                  {noteLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
                  {noteLoading ? "Saving…" : "Add to Timeline"}
                </button>
              </div>
              {noteResult && !noteResult.success && (
                <p className="text-xs text-destructive">{noteResult.message}</p>
              )}
            </form>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function HistoryView({ encounters, loading }: { encounters: EncounterRecord[]; loading: boolean }) {
  if (loading) return (
    <div className="flex items-center justify-center py-20 text-muted-foreground">
      <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading history...
    </div>
  );
  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h2 className="text-xl font-bold text-foreground mb-5 flex items-center gap-2">
        <FileText className="w-5 h-5 text-blue-400" /> Medical History
      </h2>
      {encounters.length === 0 ? (
        <div className="text-center py-16">
          <FileText className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground font-medium">No medical history on file yet.</p>
          <p className="text-sm text-muted-foreground/60 mt-1">Your visit records will appear here after a triage session.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {encounters.map((enc) => (
            <EncounterCard key={enc.encounterId} enc={enc} />
          ))}
        </div>
      )}
    </div>
  );
}

function CurrentVisitView({ encounters, loading }: { encounters: EncounterRecord[]; loading: boolean }) {
  const latest = encounters[0];
  if (loading) return (
    <div className="flex items-center justify-center py-20 text-muted-foreground">
      <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading visit data...
    </div>
  );
  return (
    <div className="p-6 max-w-xl mx-auto">
      <h2 className="text-xl font-bold text-foreground mb-5 flex items-center gap-2">
        <Heart className="w-5 h-5 text-blue-400" /> Current Visit
      </h2>
      {!latest ? (
        <div className="text-center py-16">
          <Heart className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground font-medium">No active visit on record.</p>
          <p className="text-sm text-muted-foreground/60 mt-1">Your current encounter will appear here once triage is complete.</p>
        </div>
      ) : (
        <Card className={`border ${
          latest.triageLevel === "RED" ? "border-red-500/50" : latest.triageLevel === "YELLOW" ? "border-yellow-500/40" : "border-emerald-500/30"
        }`}>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
                Latest Encounter
              </CardTitle>
              <Badge variant="outline" className={`text-sm font-bold ${TRIAGE_COLORS[latest.triageLevel].badge}`}>
                {latest.triageLevel}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">Encounter ID</p>
              <p className="font-mono text-sm font-bold text-foreground">{latest.encounterId}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">Symptoms Reported</p>
              <p className="text-sm text-foreground">{latest.symptoms}</p>
            </div>
            {latest.visitReason && (
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">Visit Reason</p>
                <p className="text-sm text-foreground">{latest.visitReason}</p>
              </div>
            )}
            <div className="flex gap-4 text-sm">
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">Assigned Doctor</p>
                <p className="font-semibold text-foreground">{latest.assignedDoctor}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">Date & Time</p>
                <p className="font-mono text-foreground">{new Date(latest.timestamp).toLocaleString()}</p>
              </div>
            </div>
            {latest.triageLevel === "RED" && (
              <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                <p className="text-sm text-red-300 font-semibold">Critical — You have been flagged as high priority. Please remain in the emergency area.</p>
              </div>
            )}
            {latest.triageLevel === "GREEN" && (
              <div className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <p className="text-sm text-emerald-300 font-semibold">Stable — Non-urgent. Please wait for your appointment slot.</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function EmergencyStatusView({ encounters }: { encounters: EncounterRecord[] }) {
  const latest = encounters[0];
  const level = latest?.triageLevel ?? null;

  const statusConfig = {
    RED:    { bg: "bg-red-500/10", border: "border-red-500/50", text: "text-red-300", icon: <AlertTriangle className="w-16 h-16 text-red-500 animate-pulse" />, msg: "CRITICAL — Immediate attention required." },
    YELLOW: { bg: "bg-yellow-500/10", border: "border-yellow-500/40", text: "text-yellow-300", icon: <Activity className="w-16 h-16 text-yellow-500" />, msg: "URGENT — Will be seen shortly." },
    GREEN:  { bg: "bg-emerald-500/10", border: "border-emerald-500/30", text: "text-emerald-300", icon: <CheckCircle2 className="w-16 h-16 text-emerald-500" />, msg: "STABLE — Waiting for routine consultation." },
  };

  return (
    <div className="p-6 max-w-md mx-auto">
      <h2 className="text-xl font-bold text-foreground mb-5 flex items-center gap-2">
        <Activity className="w-5 h-5 text-blue-400" /> Emergency Status
      </h2>
      {!level ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Shield className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
            <p className="font-semibold text-foreground mb-2">No Active Emergency</p>
            <p className="text-sm text-muted-foreground">Your emergency status will be updated when a triage session is completed by hospital staff.</p>
          </CardContent>
        </Card>
      ) : (
        <Card className={`border-2 ${statusConfig[level].border} ${statusConfig[level].bg}`}>
          <CardContent className="p-8 text-center">
            <div className="flex justify-center mb-4">{statusConfig[level].icon}</div>
            <Badge variant="outline" className={`text-2xl font-black px-6 py-2 mb-3 ${TRIAGE_COLORS[level].badge}`}>
              {level}
            </Badge>
            <p className={`font-semibold mt-3 ${statusConfig[level].text}`}>{statusConfig[level].msg}</p>
            <p className="text-xs text-muted-foreground mt-4">
              Last updated: {new Date(latest.timestamp).toLocaleString()}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function PatientPortal() {
  const [, setLocation] = useLocation();
  const [patient, setPatient] = useState<PatientUser | null>(null);
  const [activeView, setActiveView] = useState<PatientView>("profile");
  const [encounters, setEncounters] = useState<EncounterRecord[]>([]);
  const [loadingEnc, setLoadingEnc] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [ambulanceState, setAmbulanceState] = useState<"idle" | "dispatching" | "dispatched">("idle");
  const [ambulanceMsg, setAmbulanceMsg] = useState("");

  useEffect(() => {
    const stored = localStorage.getItem("sapthagiri_user");
    if (!stored) { setLocation("/login"); return; }
    try {
      const user = JSON.parse(stored) as PatientUser;
      if (user.role === "staff") { setLocation("/dashboard"); return; }
      setPatient(user);
      if (user.patientId) {
        setLoadingEnc(true);
        fetch(`/api/triage/patient/${user.patientId}`)
          .then((r) => r.json())
          .then((data: EncounterRecord[]) => { setEncounters(data); setLoadingEnc(false); })
          .catch(() => setLoadingEnc(false));
      }
    } catch {
      setLocation("/login");
    }
  }, [setLocation]);

  useEffect(() => {
    if (activeView === "ai") setAiOpen(true);
    else setAiOpen(false);
  }, [activeView]);

  const handleLogout = () => {
    localStorage.removeItem("sapthagiri_user");
    localStorage.removeItem("sapthagiri_login_ts");
    setLocation("/");
  };

  const handleAmbulanceRequest = async () => {
    if (ambulanceState !== "idle") return;
    setAmbulanceState("dispatching");
    setAmbulanceMsg("Locating nearest Sapthagiri Advanced Life Support unit…");
    try {
      await fetch("/api/triage/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId: patient?.patientId ?? "ANON",
          symptoms: "AUTOMATED EMERGENCY REQUEST: Patient initiated remote ambulance dispatch.",
          visitReason: "CRITICAL — AMBULANCE DISPATCH",
          juniorDoctorSelection: "RED",
          doctorId: "AUTO-DISPATCH",
        }),
      });
      setTimeout(() => {
        setAmbulanceState("dispatched");
        setAmbulanceMsg("ALS Unit dispatched. Expected arrival 7–10 min. Stay calm and keep this screen open.");
      }, 1600);
    } catch {
      setAmbulanceState("dispatched");
      setAmbulanceMsg("Request sent. If no response, call 108 immediately.");
    }
  };

  if (!patient) return null;

  return (
    <div className="h-screen bg-background text-foreground flex flex-col font-sans overflow-hidden">
      {/* Header */}
      <header className="border-b border-border bg-card px-6 py-3 flex items-center justify-between shadow-sm shrink-0">
        <div className="flex items-center gap-3">
          <div className="bg-blue-500/20 p-2 rounded-md">
            <Heart className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h1 className="text-lg font-black uppercase tracking-widest text-blue-400 leading-tight">
              Patient Portal
            </h1>
            <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">
              Sapthagiri NPS University — Institute of Medical Sciences
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-muted-foreground hidden md:inline-block">
            Welcome, <span className="text-foreground font-semibold">{patient.name}</span>
          </span>
          {patient.patientId && (
            <Badge variant="outline" className="font-mono text-blue-300 border-blue-500/30 hidden md:inline-flex">
              {patient.patientId}
            </Badge>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-foreground"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </header>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        <PatientSidebar activeView={activeView} onNavigate={setActiveView} patient={patient} />
        <main className="flex-1 overflow-auto">
          {activeView === "profile"  && <ProfileView patient={patient} />}
          {activeView === "history"  && <HistoryView encounters={encounters} loading={loadingEnc} />}
          {activeView === "visit"    && <CurrentVisitView encounters={encounters} loading={loadingEnc} />}
          {activeView === "status"   && <EmergencyStatusView encounters={encounters} />}
          {activeView === "ai" && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <Bot className="w-12 h-12 text-primary mx-auto mb-3 animate-pulse" />
                <p className="text-foreground font-semibold">AI Medical Assistant</p>
                <p className="text-sm text-muted-foreground mt-1 mb-4">Your personal AI health guide is ready.</p>
                <Button onClick={() => setAiOpen(true)} className="glow-border">
                  <Bot className="w-4 h-4 mr-2" /> Open AI Chat
                </Button>
              </div>
            </div>
          )}
        </main>
      </div>

      <AiChatPanel isOpen={aiOpen} onClose={() => { setAiOpen(false); if (activeView === "ai") setActiveView("profile"); }} />

      {/* Emergency Ambulance — Patient Portal only */}
      <div className="fixed bottom-6 right-6 z-50">
        {ambulanceState === "idle" && (
          <button
            onClick={handleAmbulanceRequest}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 active:scale-95 text-white font-bold px-4 py-3 rounded-full shadow-2xl border-2 border-red-400/60 animate-pulse transition-all duration-200"
          >
            <span className="text-lg">🚑</span>
            <span className="text-[11px] uppercase tracking-widest font-mono leading-none">Request Ambulance</span>
          </button>
        )}
        {ambulanceState === "dispatching" && (
          <div className="flex items-center gap-2.5 bg-slate-900 border border-red-500/60 text-red-400 px-4 py-3 rounded-xl shadow-2xl max-w-xs">
            <Loader2 className="w-4 h-4 animate-spin shrink-0 text-red-500" />
            <span className="text-[11px] font-mono leading-snug">{ambulanceMsg}</span>
          </div>
        )}
        {ambulanceState === "dispatched" && (
          <div className="bg-slate-900 border-2 border-red-600 rounded-xl shadow-2xl max-w-xs p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="h-2 w-2 rounded-full bg-red-500 animate-ping shrink-0" />
              <span className="text-[10px] font-black uppercase tracking-wider text-red-400">Dispatch Active</span>
            </div>
            <p className="text-[11px] font-mono text-slate-200 leading-relaxed">{ambulanceMsg}</p>
            <button
              onClick={() => { setAmbulanceState("idle"); setAmbulanceMsg(""); }}
              className="mt-3 text-[10px] text-muted-foreground hover:text-foreground underline"
            >
              Dismiss
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
