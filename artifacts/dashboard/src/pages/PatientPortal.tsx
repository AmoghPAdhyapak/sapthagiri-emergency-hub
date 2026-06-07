import { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { ClinicalRealismChips } from "@/components/ClinicalRealismChips";
import {
  User, Heart, Clock, LogOut, Activity, Bot, FileText,
  Phone, Mail, Calendar, Loader2, AlertTriangle, Stethoscope,
  CheckCircle2, Shield, Building2, Link2, Send, ChevronDown, Menu,
} from "lucide-react";
import { AiChatPanel } from "@/components/AiChatPanel";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import logoUrl from "@/assets/logo.png";
import { useViewMode, switchViewMode } from "@/hooks/useViewMode";

const PATIENT_VIEW_LABELS: Record<string, string> = {
  profile:     "My Profile",
  history:     "Medical History",
  visit:       "Current Visit",
  status:      "Emergency Status",
  continuity:  "External Treatment",
  ai:          "AI Assistant",
};

type PatientView = "profile" | "history" | "visit" | "status" | "continuity" | "ai";

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

interface StatusHistoryEntry {
  eventId: string;
  action: string;
  previousLevel: string;
  newLevel: string;
  doctorId: string;
  timestamp: string;
  reason?: string;
  clinicalObservation?: string;
}

interface ForensicLogEntry {
  logId: string;
  eventType: "DOCTOR_CHAIN" | "DEATH_REPORT" | "RECOVERY_TRAJECTORY" | "AI_OVERRIDE" | "CROSS_HOSPITAL";
  timestamp: string;
  [key: string]: unknown;
}

interface EncounterRecord {
  encounterId: string;
  symptoms: string;
  symptomFinalVerdict?: string;
  visitReason: string;
  triageLevel: "RED" | "YELLOW" | "GREEN";
  allergies?: string[];
  assignedDoctor: string;
  doctorId?: string;
  timestamp: string;
  crossHospitalContinuityLogs: ContinuityEntry[];
  statusHistory?: StatusHistoryEntry[];
  forensicLifecycleTimeline?: ForensicLogEntry[];
  aiOverrideTriggered?: boolean;
  completionStatus?: string;
  isArchived?: boolean;
  deceasedAt?: string;
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
  mobileOpen,
}: {
  activeView: PatientView;
  onNavigate: (v: PatientView) => void;
  patient: PatientUser | null;
  mobileOpen: boolean;
}) {
  const navItems: { view: PatientView; icon: React.ReactNode; label: string }[] = [
    { view: "profile",     icon: <User className="w-4 h-4" />,       label: "My Profile" },
    { view: "history",     icon: <FileText className="w-4 h-4" />,    label: "Medical History" },
    { view: "visit",       icon: <Heart className="w-4 h-4" />,       label: "Current Visit" },
    { view: "status",      icon: <Activity className="w-4 h-4" />,    label: "Emergency Status" },
    { view: "continuity",  icon: <Link2 className="w-4 h-4" />,       label: "External Treatment" },
  ];

  return (
    <aside className={`border-r border-border bg-card flex flex-col py-4 overflow-y-auto transition-all duration-200 ease-in-out z-50 fixed inset-y-0 left-0 w-72 ${mobileOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"} md:relative md:inset-auto md:z-auto md:translate-x-0 md:shadow-none md:shrink-0 md:w-56`}>
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
                ? view === "continuity"
                  ? "bg-amber-500/15 text-amber-300 border border-amber-500/20"
                  : "bg-blue-500/15 text-blue-300 border border-blue-500/20"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            }`}
          >
            {icon}
            {label}
            {view === "continuity" && activeView !== "continuity" && (
              <span className="ml-auto w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
            )}
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

function EncounterCard({ enc }: { enc: EncounterRecord }) {
  const colors = TRIAGE_COLORS[enc.triageLevel];
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
        <div className="mb-2">
          <ClinicalRealismChips
            triageLevel={enc.triageLevel}
            completionStatus={enc.completionStatus}
            forensicLifecycleTimeline={enc.forensicLifecycleTimeline}
            aiOverrideTriggered={enc.aiOverrideTriggered}
          />
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
          <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{new Date(enc.timestamp).toLocaleString()}</span>
          <span className="flex items-center gap-1"><Stethoscope className="w-3 h-3" />{enc.assignedDoctor}</span>
        </div>

        {enc.crossHospitalContinuityLogs.length > 0 && (
          <div className="mt-3 pt-3 border-t border-border/30">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 mb-2">
              <Link2 className="w-3 h-3" /> External Treatment Notes ({enc.crossHospitalContinuityLogs.length})
            </p>
            <div className="space-y-2">
              {enc.crossHospitalContinuityLogs.map((c) => (
                <div key={c.id} className="bg-background/40 border border-border/30 rounded-lg p-3 text-xs">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div>
                      <span className="font-semibold text-amber-400">{c.doctorName}</span>
                      {c.doctorId && <span className="text-muted-foreground font-mono ml-1.5">#{c.doctorId}</span>}
                      {c.hospital && <span className="text-muted-foreground"> · {c.hospital}</span>}
                    </div>
                    <Badge variant="outline" className="text-[9px] px-1 py-0 border-amber-500/30 text-amber-400 shrink-0">
                      {c.verificationStatus ?? "Unverified"}
                    </Badge>
                  </div>
                  <p className="text-foreground/80 leading-relaxed">{c.notes}</p>
                  <p className="text-muted-foreground/50 mt-1.5 text-[10px]">
                    {new Date(c.timestamp).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
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
  const active = encounters.filter((e) => !e.isArchived);
  const archived = encounters.filter((e) => e.isArchived);
  const latest = active[0] ?? archived[0];
  const level = latest?.triageLevel ?? null;

  const statusConfig = {
    RED:    { bg: "bg-red-500/10", border: "border-red-500/50", text: "text-red-300", icon: <AlertTriangle className="w-12 h-12 text-red-500 animate-pulse" />, msg: "CRITICAL — Immediate attention required. Remain in the emergency area." },
    YELLOW: { bg: "bg-yellow-500/10", border: "border-yellow-500/40", text: "text-yellow-300", icon: <Activity className="w-12 h-12 text-yellow-500" />, msg: "URGENT — You are under monitoring. Staff will attend to you shortly." },
    GREEN:  { bg: "bg-emerald-500/10", border: "border-emerald-500/30", text: "text-emerald-300", icon: <CheckCircle2 className="w-12 h-12 text-emerald-500" />, msg: "STABLE — Routine consultation queue. Please wait for your appointment slot." },
  };

  const completionBadge = (enc: EncounterRecord) => {
    if (enc.deceasedAt) return <Badge variant="outline" className="text-xs font-bold bg-slate-700/40 text-slate-400 border-slate-600">Deceased</Badge>;
    if (enc.completionStatus === "COMPLETED") return <Badge variant="outline" className="text-xs font-bold bg-emerald-500/20 text-emerald-300 border-emerald-500/30">Completed</Badge>;
    if (enc.completionStatus === "ONGOING") return <Badge variant="outline" className="text-xs font-bold bg-blue-500/20 text-blue-300 border-blue-500/30">Ongoing</Badge>;
    if (!enc.isArchived) return <Badge variant="outline" className="text-xs font-bold bg-orange-500/20 text-orange-300 border-orange-500/30">Active</Badge>;
    return null;
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h2 className="text-xl font-bold text-foreground mb-5 flex items-center gap-2">
        <Activity className="w-5 h-5 text-blue-400" /> Emergency Status
      </h2>

      {/* ── Live Status Banner ── */}
      {!level ? (
        <Card className="mb-5">
          <CardContent className="p-8 text-center">
            <Shield className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
            <p className="font-semibold text-foreground mb-2">No Active Emergency</p>
            <p className="text-sm text-muted-foreground">Your emergency status will be updated when a triage session is completed by hospital staff.</p>
          </CardContent>
        </Card>
      ) : (
        <Card className={`border-2 ${statusConfig[level].border} ${statusConfig[level].bg} mb-5`}>
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0">{statusConfig[level].icon}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <Badge variant="outline" className={`text-base font-black px-3 py-1 ${TRIAGE_COLORS[level].badge}`}>{level}</Badge>
                  {latest && completionBadge(latest)}
                </div>
                <p className={`text-sm font-semibold ${statusConfig[level].text}`}>{statusConfig[level].msg}</p>
                {latest?.symptomFinalVerdict && (
                  <p className="text-xs text-muted-foreground mt-1">Verdict: <span className="font-mono font-bold">{latest.symptomFinalVerdict}</span></p>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  Encounter: <span className="font-mono">{latest.encounterId}</span> · {new Date(latest.timestamp).toLocaleString()}
                </p>
              </div>
            </div>

            {/* Allergies alert */}
            {latest?.allergies && latest.allergies.length > 0 && (
              <div className="mt-3 p-2.5 bg-red-500/10 border border-red-500/30 rounded-md">
                <p className="text-[10px] font-black uppercase tracking-wider text-red-400 mb-1.5">⚠ Documented Allergies — Read Only</p>
                <div className="flex flex-wrap gap-1.5">
                  {latest.allergies.map((a, i) => (
                    <span key={i} className="text-xs font-bold text-red-400 bg-red-500/10 border border-red-500/30 rounded px-2 py-0.5">{a}</span>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Full Encounter Timeline (read-only) ── */}
      {encounters.length > 0 && (
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-2">
            <Clock className="w-3.5 h-3.5" /> Patient Lifecycle Timeline — All Encounters
          </p>
          <div className="space-y-4">
            {encounters.map((enc) => {
              const colors = TRIAGE_COLORS[enc.triageLevel];
              return (
                <Card key={enc.encounterId} className={`border ${enc.isArchived ? "border-slate-700/40 opacity-70" : enc.triageLevel === "RED" ? "border-red-500/40" : enc.triageLevel === "YELLOW" ? "border-yellow-500/30" : "border-emerald-500/20"}`}>
                  <CardContent className="p-4">
                    {/* Encounter header */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs text-muted-foreground">{enc.encounterId}</span>
                        <Badge variant="outline" className={`text-xs font-bold ${colors.badge}`}>{enc.triageLevel}</Badge>
                        {completionBadge(enc)}
                      </div>
                      <span className="text-xs text-muted-foreground shrink-0">{new Date(enc.timestamp).toLocaleString()}</span>
                    </div>

                    {/* Symptoms + Verdict */}
                    <div className="mb-3">
                      <p className="text-xs text-muted-foreground mb-0.5">Symptoms</p>
                      <p className="text-sm text-foreground">{enc.symptoms}</p>
                      {enc.symptomFinalVerdict && (
                        <p className="text-[11px] mt-1 font-mono font-bold text-muted-foreground">{enc.symptomFinalVerdict}</p>
                      )}
                    </div>

                    {/* Allergies */}
                    {enc.allergies && enc.allergies.length > 0 && (
                      <div className="mb-3 p-2 bg-red-500/8 border border-red-500/20 rounded-md">
                        <p className="text-[10px] font-bold text-red-400 uppercase tracking-wider mb-1">Allergies</p>
                        <div className="flex flex-wrap gap-1">
                          {enc.allergies.map((a, i) => (
                            <span key={i} className="text-[11px] font-bold text-red-400 bg-red-500/10 border border-red-500/20 rounded px-1.5">{a}</span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Doctor + Time */}
                    <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3 flex-wrap">
                      <span className="flex items-center gap-1"><Stethoscope className="w-3 h-3" />{enc.assignedDoctor}</span>
                      {enc.deceasedAt && <span className="text-slate-500">Closed: {new Date(enc.deceasedAt).toLocaleString()}</span>}
                    </div>

                    {/* Status History timeline */}
                    {enc.statusHistory && enc.statusHistory.length > 0 && (
                      <div className="border-t border-border/30 pt-2">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">Treatment Timeline</p>
                        <div className="space-y-1 pl-2 border-l-2 border-border/30">
                          {enc.statusHistory.map((h) => (
                            <div key={h.eventId} className="flex items-start justify-between gap-2 text-[10px]">
                              <span className="text-muted-foreground">▪ <span className={`font-semibold ${colors.label}`}>{h.action}</span>{h.doctorId ? ` — ${h.doctorId}` : ""}</span>
                              <span className="text-muted-foreground/40 font-mono shrink-0">{new Date(h.timestamp).toLocaleTimeString()}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      <div className="mt-4 p-3 bg-muted/20 border border-border/30 rounded-lg">
        <p className="text-[10px] text-muted-foreground">
          <span className="font-bold text-foreground">Read-only view.</span> This information is managed by hospital staff. Contact the reception for any discrepancies.
        </p>
      </div>
    </div>
  );
}

interface ContinuityFormState {
  encounterId: string;
  doctorName: string;
  doctorId: string;
  hospital: string;
  medRegId: string;
  doctorPhone: string;
  notes: string;
}

const EMPTY_FORM: ContinuityFormState = {
  encounterId: "", doctorName: "", doctorId: "", hospital: "",
  medRegId: "", doctorPhone: "", notes: "",
};

function ContinuityView({
  encounters,
  loading,
  onNoteAdded,
}: {
  encounters: EncounterRecord[];
  loading: boolean;
  onNoteAdded: () => void;
}) {
  const [form, setForm] = useState<ContinuityFormState>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const set = (key: keyof ContinuityFormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm((p) => ({ ...p, [key]: e.target.value }));
    setResult(null);
  };

  const allNotes = encounters
    .flatMap((enc) =>
      enc.crossHospitalContinuityLogs.map((note) => ({
        ...note,
        encounterId: enc.encounterId,
        triageLevel: enc.triageLevel,
      }))
    )
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.encounterId) { setResult({ success: false, message: "Please select an encounter to attach this note to." }); return; }
    if (!form.doctorName.trim()) { setResult({ success: false, message: "Doctor name is required." }); return; }
    if (!form.medRegId.trim()) { setResult({ success: false, message: "Medical Registration ID is required." }); return; }
    if (!form.notes.trim()) { setResult({ success: false, message: "Treatment notes are required." }); return; }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/triage/encounters/${form.encounterId}/continuity`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          doctorName: form.doctorName.trim(),
          doctorId: form.doctorId.trim(),
          hospital: form.hospital.trim(),
          medRegId: form.medRegId.trim(),
          doctorPhone: form.doctorPhone.trim(),
          notes: form.notes.trim(),
        }),
      });
      const data = await res.json() as { success?: boolean; error?: string };
      if (!res.ok || !data.success) {
        setResult({ success: false, message: data.error ?? "Failed to submit note." });
      } else {
        setResult({ success: true, message: "External treatment note submitted. Hospital staff can now view it in your records." });
        setForm((p) => ({ ...EMPTY_FORM, encounterId: p.encounterId }));
        onNoteAdded();
      }
    } catch {
      setResult({ success: false, message: "Network error. Please try again." });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center py-20 text-muted-foreground">
      <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading...
    </div>
  );

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
          <Link2 className="w-5 h-5 text-amber-400" /> Cross-Hospital Continuity Notes
        </h2>
        <p className="text-sm text-muted-foreground mt-1.5">
          If you received treatment at another hospital or clinic, submit those details here.
          Your Sapthagiri hospital staff will be able to view and verify this information automatically.
        </p>
      </div>

      {encounters.length === 0 ? (
        <Card className="border-amber-500/20">
          <CardContent className="p-8 text-center">
            <Building2 className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="font-semibold text-foreground mb-1">No Encounters Found</p>
            <p className="text-sm text-muted-foreground">
              You need at least one triage encounter at Sapthagiri before submitting an external treatment note.
              Please visit the Emergency Department first.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card className="border-amber-500/20 bg-amber-500/5 mb-6">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
                <Building2 className="w-4 h-4" /> Add External Treatment Note
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                Fill in details about the doctor and treatment you received outside Sapthagiri.
                Required fields are marked *.
              </p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">

                {/* Encounter selector */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Link to Encounter *
                  </label>
                  <div className="relative">
                    <select
                      value={form.encounterId}
                      onChange={set("encounterId")}
                      className="w-full appearance-none rounded-md border border-border bg-background/60 px-3 py-2 pr-8 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-amber-500/40"
                    >
                      <option value="">Select a hospital encounter to attach to…</option>
                      {encounters.map((enc) => (
                        <option key={enc.encounterId} value={enc.encounterId}>
                          {enc.encounterId} — {enc.triageLevel} · {new Date(enc.timestamp).toLocaleDateString()}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  </div>
                </div>

                {/* Row: Doctor Name + Doctor ID */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Doctor Name *</label>
                    <input
                      type="text"
                      placeholder="Dr. Full Name"
                      value={form.doctorName}
                      onChange={set("doctorName")}
                      className="w-full rounded-md border border-border bg-background/60 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-amber-500/40"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Doctor ID</label>
                    <input
                      type="text"
                      placeholder="e.g. DOC101"
                      value={form.doctorId}
                      onChange={(e) => { setForm((p) => ({ ...p, doctorId: e.target.value.toUpperCase() })); setResult(null); }}
                      className="w-full rounded-md border border-border bg-background/60 px-3 py-2 text-sm text-foreground font-mono placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-amber-500/40"
                    />
                  </div>
                </div>

                {/* Hospital / Workplace */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Hospital / Workplace</label>
                  <input
                    type="text"
                    placeholder="e.g. City General Hospital, New Delhi"
                    value={form.hospital}
                    onChange={set("hospital")}
                    className="w-full rounded-md border border-border bg-background/60 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-amber-500/40"
                  />
                </div>

                {/* Row: Med Reg ID + Doctor Phone */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Medical Reg. ID *
                      <span className="normal-case text-[10px] text-muted-foreground/60 ml-1">(legal verification)</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. MCI-2024-XXXXX"
                      value={form.medRegId}
                      onChange={(e) => { setForm((p) => ({ ...p, medRegId: e.target.value.toUpperCase() })); setResult(null); }}
                      className="w-full rounded-md border border-border bg-background/60 px-3 py-2 text-sm text-foreground font-mono placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-amber-500/40"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Doctor Phone</label>
                    <input
                      type="tel"
                      placeholder="+91 98765 43210"
                      value={form.doctorPhone}
                      onChange={set("doctorPhone")}
                      className="w-full rounded-md border border-border bg-background/60 px-3 py-2 text-sm text-foreground font-mono placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-amber-500/40"
                    />
                  </div>
                </div>

                {/* Treatment Notes */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Treatment Notes / Observations *</label>
                  <textarea
                    rows={4}
                    placeholder="Describe the external treatment received, medications prescribed, diagnoses made, follow-up instructions, etc."
                    value={form.notes}
                    onChange={set("notes")}
                    className="w-full rounded-md border border-border bg-background/60 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/40 resize-none focus:outline-none focus:ring-1 focus:ring-amber-500/40"
                  />
                </div>

                {/* Timestamp note */}
                <p className="text-[10px] text-muted-foreground/50 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Timestamp will be recorded automatically at time of submission.
                </p>

                {result && (
                  <div className={`text-sm p-3 rounded-md border font-medium ${
                    result.success
                      ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
                      : "text-destructive bg-destructive/10 border-destructive/20"
                  }`}>
                    {result.success && <CheckCircle2 className="w-3.5 h-3.5 inline mr-1.5" />}
                    {result.message}
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-amber-600 hover:bg-amber-500 text-white border-0"
                >
                  {submitting
                    ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Submitting…</>
                    : <><Send className="w-4 h-4 mr-2" /> Submit External Treatment Note</>}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Timeline of all submitted notes */}
          {allNotes.length > 0 && (
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4" /> Submitted Notes ({allNotes.length})
              </h3>
              <div className="space-y-3">
                {allNotes.map((note) => (
                  <Card key={note.id} className="border-amber-500/20 bg-amber-500/5">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div>
                          <span className="font-semibold text-amber-400 text-sm">{note.doctorName}</span>
                          {note.doctorId && <span className="text-muted-foreground font-mono text-xs ml-2">#{note.doctorId}</span>}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Badge variant="outline" className={`text-[9px] font-bold ${TRIAGE_COLORS[note.triageLevel as "RED" | "YELLOW" | "GREEN"].badge}`}>
                            {note.triageLevel}
                          </Badge>
                          <Badge variant="outline" className="text-[9px] px-1.5 py-0 border-amber-500/30 text-amber-400">
                            Unverified
                          </Badge>
                        </div>
                      </div>
                      {note.hospital && (
                        <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                          <Building2 className="w-3 h-3" /> {note.hospital}
                        </p>
                      )}
                      {note.medRegId && (
                        <p className="text-xs text-muted-foreground mb-2 font-mono">Reg. ID: {note.medRegId}</p>
                      )}
                      <p className="text-sm text-foreground/80 leading-relaxed">{note.notes}</p>
                      <p className="text-[10px] text-muted-foreground/50 mt-2 font-mono">
                        {new Date(note.timestamp).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
                        {" · "}Encounter: {note.encounterId}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {allNotes.length === 0 && (
            <div className="text-center py-8 text-muted-foreground/50">
              <Link2 className="w-8 h-8 mx-auto mb-2" />
              <p className="text-sm">No external treatment notes submitted yet.</p>
            </div>
          )}
        </>
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const viewMode = useViewMode();
  const [mobilePatMoreOpen, setMobilePatMoreOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [ambulanceState, setAmbulanceState] = useState<"idle" | "dispatching" | "dispatched">("idle");
  const [ambulanceMsg, setAmbulanceMsg] = useState("");

  const fetchEncounters = useCallback((patientId: string) => {
    setLoadingEnc(true);
    fetch(`/api/triage/patient/${patientId}`)
      .then((r) => r.json())
      .then((data: EncounterRecord[]) => { setEncounters(data); setLoadingEnc(false); })
      .catch(() => setLoadingEnc(false));
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem("sapthagiri_user");
    if (!stored) { setLocation("/login"); return; }
    try {
      const user = JSON.parse(stored) as PatientUser;
      if (user.role === "staff") { setLocation("/dashboard"); return; }
      setPatient(user);
      if (user.patientId) fetchEncounters(user.patientId);
    } catch {
      setLocation("/login");
    }
  }, [setLocation, fetchEncounters]);

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
      {/* ── Desktop Header ── */}
      {viewMode !== "mobile" && (
        <header className="border-b border-border bg-card px-4 py-3 flex items-center justify-between shadow-sm shrink-0">
          <div className="flex items-center gap-3">
            <button
              className="md:hidden p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors shrink-0"
              onClick={() => setMobileMenuOpen(true)}
              title="Open navigation"
            >
              <Menu className="w-5 h-5" />
            </button>
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
      )}

      {/* ── Mobile Header ── */}
      {viewMode === "mobile" && (
        <header className="bg-card border-b border-border px-4 py-2.5 flex items-center justify-between shrink-0 shadow-sm">
          <div className="flex items-center gap-2.5">
            <div className="bg-blue-500/20 p-1.5 rounded-lg">
              <Heart className="w-4 h-4 text-blue-400" />
            </div>
            <div>
              <p className="text-[13px] font-black text-blue-400 leading-tight tracking-wide">Patient Portal</p>
              <p className="text-[9px] text-muted-foreground uppercase tracking-widest">Sapthagiri NPS</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => switchViewMode("desktop")}
              className="flex items-center gap-1 text-[10px] font-mono text-muted-foreground/60 hover:text-blue-400 border border-border/40 hover:border-blue-400/40 px-2 py-1 rounded-md transition-colors bg-muted/20"
              title="Switch to Desktop View"
            >
              <span>🖥</span>
              <span>Desktop</span>
            </button>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={handleLogout}>
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </header>
      )}

      {/* ── Mobile Page Title Bar ── */}
      {viewMode === "mobile" && (
        <div className="px-4 py-1.5 border-b border-border/40 flex items-center bg-blue-500/5 shrink-0">
          <span className="text-[11px] font-bold uppercase tracking-widest text-blue-400/70">
            {PATIENT_VIEW_LABELS[activeView] ?? activeView}
          </span>
          {patient.patientId && (
            <span className="ml-auto font-mono text-[10px] text-blue-300/50">{patient.patientId}</span>
          )}
        </div>
      )}

      {viewMode === "mobile" ? (
        /* ── Mobile Content ── */
        <main className="flex-1 overflow-auto">
          {activeView === "profile"     && <ProfileView patient={patient} />}
          {activeView === "history"     && <HistoryView encounters={encounters} loading={loadingEnc} />}
          {activeView === "visit"       && <CurrentVisitView encounters={encounters} loading={loadingEnc} />}
          {activeView === "status"      && <EmergencyStatusView encounters={encounters} />}
          {activeView === "continuity"  && (
            <ContinuityView
              encounters={encounters}
              loading={loadingEnc}
              onNoteAdded={() => patient.patientId && fetchEncounters(patient.patientId)}
            />
          )}
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
      ) : (
        /* ── Desktop Content (sidebar + main) ── */
        <div className="flex flex-1 overflow-hidden">
          {mobileMenuOpen && (
            <div
              className="fixed inset-0 bg-black/50 z-40 md:hidden"
              onClick={() => setMobileMenuOpen(false)}
            />
          )}
          <PatientSidebar
            activeView={activeView}
            onNavigate={(v) => { setActiveView(v); setMobileMenuOpen(false); }}
            patient={patient}
            mobileOpen={mobileMenuOpen}
          />
          <main className="flex-1 overflow-auto">
            {activeView === "profile"     && <ProfileView patient={patient} />}
            {activeView === "history"     && <HistoryView encounters={encounters} loading={loadingEnc} />}
            {activeView === "visit"       && <CurrentVisitView encounters={encounters} loading={loadingEnc} />}
            {activeView === "status"      && <EmergencyStatusView encounters={encounters} />}
            {activeView === "continuity"  && (
              <ContinuityView
                encounters={encounters}
                loading={loadingEnc}
                onNoteAdded={() => patient.patientId && fetchEncounters(patient.patientId)}
              />
            )}
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
      )}

      {/* ── Mobile Bottom Navigation ── */}
      {viewMode === "mobile" && (
        <nav className="shrink-0 bg-card border-t border-border grid grid-cols-5 px-1 pb-1 pt-1 gap-0.5">
          <button
            onClick={() => { setActiveView("profile"); setMobilePatMoreOpen(false); }}
            className={`flex flex-col items-center justify-center gap-0.5 py-2 rounded-xl transition-colors ${activeView === "profile" ? "bg-blue-500/10" : "hover:bg-muted/30"}`}
          >
            <User className={`w-5 h-5 ${activeView === "profile" ? "text-blue-400" : "text-muted-foreground/50"}`} />
            <span className={`text-[9px] font-semibold ${activeView === "profile" ? "text-blue-400" : "text-muted-foreground/50"}`}>Profile</span>
          </button>
          <button
            onClick={() => { setActiveView("history"); setMobilePatMoreOpen(false); }}
            className={`flex flex-col items-center justify-center gap-0.5 py-2 rounded-xl transition-colors ${activeView === "history" ? "bg-blue-500/10" : "hover:bg-muted/30"}`}
          >
            <FileText className={`w-5 h-5 ${activeView === "history" ? "text-blue-400" : "text-muted-foreground/50"}`} />
            <span className={`text-[9px] font-semibold ${activeView === "history" ? "text-blue-400" : "text-muted-foreground/50"}`}>History</span>
          </button>
          <button
            onClick={() => { setActiveView("visit"); setMobilePatMoreOpen(false); }}
            className={`flex flex-col items-center justify-center gap-0.5 py-2 rounded-xl transition-colors ${activeView === "visit" ? "bg-blue-500/10" : "hover:bg-muted/30"}`}
          >
            <Heart className={`w-5 h-5 ${activeView === "visit" ? "text-blue-400" : "text-muted-foreground/50"}`} />
            <span className={`text-[9px] font-semibold ${activeView === "visit" ? "text-blue-400" : "text-muted-foreground/50"}`}>Visit</span>
          </button>
          <button
            onClick={() => { setActiveView("status"); setMobilePatMoreOpen(false); }}
            className={`flex flex-col items-center justify-center gap-0.5 py-2 rounded-xl transition-colors ${activeView === "status" ? "bg-blue-500/10" : "hover:bg-muted/30"}`}
          >
            <Activity className={`w-5 h-5 ${activeView === "status" ? "text-blue-400" : "text-muted-foreground/50"}`} />
            <span className={`text-[9px] font-semibold ${activeView === "status" ? "text-blue-400" : "text-muted-foreground/50"}`}>Status</span>
          </button>
          <button
            onClick={() => setMobilePatMoreOpen(v => !v)}
            className={`flex flex-col items-center justify-center gap-0.5 py-2 rounded-xl transition-colors ${mobilePatMoreOpen ? "bg-muted/50" : "hover:bg-muted/30"}`}
          >
            <ChevronDown className={`w-5 h-5 text-muted-foreground/50 transition-transform duration-200 ${mobilePatMoreOpen ? "rotate-180" : ""}`} />
            <span className="text-[9px] font-semibold text-muted-foreground/50">More</span>
          </button>
        </nav>
      )}

      {/* ── Mobile More Sheet ── */}
      {viewMode === "mobile" && mobilePatMoreOpen && (
        <>
          <div className="fixed inset-0 bg-black/40 z-40" onClick={() => setMobilePatMoreOpen(false)} />
          <div className="fixed bottom-[57px] left-0 right-0 z-50 bg-card border-t border-border rounded-t-2xl shadow-2xl">
            <div className="w-10 h-1 bg-muted rounded-full mx-auto mt-3 mb-3" />
            <div className="grid grid-cols-3 gap-1 px-4 pb-6 pt-1">
              <button
                onClick={() => { setActiveView("continuity"); setMobilePatMoreOpen(false); }}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-xl transition-colors ${activeView === "continuity" ? "bg-amber-500/15 text-amber-400" : "hover:bg-muted/50 text-muted-foreground"}`}
              >
                <Link2 className="w-5 h-5" />
                <span className="text-[10px] font-medium text-center leading-tight">External Tx.</span>
              </button>
              <button
                onClick={() => { setActiveView("ai"); setMobilePatMoreOpen(false); setAiOpen(true); }}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-xl transition-colors ${activeView === "ai" ? "bg-primary/15 text-primary" : "hover:bg-muted/50 text-muted-foreground"}`}
              >
                <Bot className="w-5 h-5" />
                <span className="text-[10px] font-medium text-center leading-tight">AI Chat</span>
              </button>
            </div>
          </div>
        </>
      )}

      <AiChatPanel isOpen={aiOpen} onClose={() => { setAiOpen(false); if (activeView === "ai") setActiveView("profile"); }} />

      {/* Emergency Ambulance — Patient Portal only */}
      <div className={`fixed ${viewMode === "mobile" ? "bottom-[72px]" : "bottom-6"} right-6 z-50`}>
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
