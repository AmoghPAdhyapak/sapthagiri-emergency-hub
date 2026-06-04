import { useState, useEffect } from "react";
import {
  Activity, Clock, Stethoscope, Loader2, RefreshCw,
  CheckCircle2, ArrowUpCircle, Eye, IdCard, History,
  ChevronDown, ChevronUp, AlertCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const CACHE_KEY = "HOSPITAL_DB_ENCOUNTERS_GREEN";

interface StatusHistoryEntry {
  eventId: string;
  action: string;
  previousLevel: string;
  newLevel: string;
  doctorId: string;
  timestamp: string;
}

interface ContinuityEntry {
  id: string;
  doctorName: string;
  notes: string;
  timestamp: string;
}

interface EncounterRecord {
  encounterId: string;
  patientId: string;
  patientName: string;
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
  completionStatus?: string;
  isArchived?: boolean;
}

type QueueAction = "COMPLETED" | "ESCALATE" | "UNDER_OBSERVATION";

interface ActionState {
  encounterId: string;
  doctorId: string;
  selectedAction: QueueAction | null;
  loading: boolean;
  error: string;
}

const ACTION_OPTIONS: { action: QueueAction; label: string; color: string; icon: React.ReactNode; desc: string }[] = [
  {
    action: "COMPLETED",
    label: "Completed",
    desc: "Treatment finished — discharge from queue",
    color: "border-emerald-500/50 bg-emerald-500/10 text-emerald-300",
    icon: <CheckCircle2 className="w-4 h-4 text-emerald-400" />,
  },
  {
    action: "ESCALATE",
    label: "Escalate → YELLOW",
    desc: "Condition worsened — move to Observation Queue",
    color: "border-yellow-500/50 bg-yellow-500/10 text-yellow-300",
    icon: <ArrowUpCircle className="w-4 h-4 text-yellow-400" />,
  },
  {
    action: "UNDER_OBSERVATION",
    label: "Under Observation",
    desc: "Keep in queue — treatment ongoing",
    color: "border-emerald-500/30 bg-emerald-500/5 text-emerald-400",
    icon: <Eye className="w-4 h-4 text-emerald-400" />,
  },
];

export function GeneralMonitoringPanel() {
  const [encounters, setEncounters] = useState<EncounterRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [fromCache, setFromCache] = useState(false);
  const [actionState, setActionState] = useState<Record<string, ActionState>>({});
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const fetchEncounters = () => {
    setLoading(true);
    setFromCache(false);
    fetch("/api/triage/encounters")
      .then((r) => r.json())
      .then((data: EncounterRecord[]) => {
        const green = data.filter((e) => e.triageLevel === "GREEN" && !e.isArchived);
        if (green.length > 0) {
          setEncounters(green);
          try { localStorage.setItem(CACHE_KEY, JSON.stringify(green)); } catch { /* ignore */ }
        } else {
          try {
            const cached = localStorage.getItem(CACHE_KEY);
            if (cached) {
              setEncounters(JSON.parse(cached) as EncounterRecord[]);
              setFromCache(true);
            } else {
              setEncounters([]);
            }
          } catch { setEncounters([]); }
        }
        setLoading(false);
      })
      .catch(() => {
        try {
          const cached = localStorage.getItem(CACHE_KEY);
          if (cached) { setEncounters(JSON.parse(cached) as EncounterRecord[]); setFromCache(true); }
        } catch { /* ignore */ }
        setLoading(false);
      });
  };

  useEffect(() => { fetchEncounters(); }, []);

  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const openActions = (encounterId: string) =>
    setActionState((prev) => ({
      ...prev,
      [encounterId]: { encounterId, doctorId: "", selectedAction: null, loading: false, error: "" },
    }));

  const closeActions = (encounterId: string) =>
    setActionState((prev) => { const n = { ...prev }; delete n[encounterId]; return n; });

  const updateAction = (encounterId: string, patch: Partial<ActionState>) =>
    setActionState((prev) => ({ ...prev, [encounterId]: { ...prev[encounterId], ...patch } }));

  const handleConfirm = async (encounterId: string) => {
    const state = actionState[encounterId];
    if (!state) return;
    if (!state.doctorId.trim()) { updateAction(encounterId, { error: "Doctor ID is required to authorize this action." }); return; }
    if (!state.selectedAction) { updateAction(encounterId, { error: "Please select an outcome before confirming." }); return; }
    updateAction(encounterId, { loading: true, error: "" });
    try {
      const res = await fetch("/api/triage/queue/action", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ encounterId, doctorId: state.doctorId.trim(), action: state.selectedAction }),
      });
      const data = await res.json() as { success: boolean; error?: string };
      if (!res.ok || !data.success) {
        updateAction(encounterId, { loading: false, error: data.error ?? "Action failed." });
        return;
      }
      if (state.selectedAction === "UNDER_OBSERVATION") {
        setEncounters((prev) =>
          prev.map((e) => e.encounterId === encounterId ? { ...e, completionStatus: "ONGOING" } : e)
        );
      } else {
        const updated = encounters.filter((e) => e.encounterId !== encounterId);
        setEncounters(updated);
        if (updated.length > 0) {
          try { localStorage.setItem(CACHE_KEY, JSON.stringify(updated)); } catch { /* ignore */ }
        } else {
          try { localStorage.removeItem(CACHE_KEY); } catch { /* ignore */ }
        }
      }
      closeActions(encounterId);
    } catch {
      updateAction(encounterId, { loading: false, error: "Network error. Please try again." });
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Activity className="w-5 h-5 text-emerald-400" />
            General Monitoring
            <Badge variant="outline" className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-xs font-bold ml-1">
              GREEN
            </Badge>
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Stable patients — routine consultation and monitoring. Click any row to view full clinical details.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-bold text-emerald-400">{encounters.length} STABLE</span>
          <Button variant="ghost" size="sm" onClick={fetchEncounters}>
            <RefreshCw className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {fromCache && (
        <div className="mb-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg flex items-center gap-2 text-xs text-amber-400">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          Showing cached encounter data — server may have restarted. Refresh to sync live data.
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          <Loader2 className="w-6 h-6 animate-spin mr-3" /> Loading monitoring queue...
        </div>
      ) : encounters.length === 0 ? (
        <div className="text-center py-20">
          <CheckCircle2 className="w-12 h-12 text-emerald-400/30 mx-auto mb-3" />
          <p className="text-muted-foreground font-medium">No patients in general monitoring.</p>
          <p className="text-sm text-muted-foreground/60 mt-1">GREEN triage encounters will appear here as they arrive.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {encounters.map((enc) => {
            const isExpanded = expanded.has(enc.encounterId);
            const state = actionState[enc.encounterId];
            const isOngoing = enc.completionStatus === "ONGOING";
            const allergies = enc.allergies ?? [];
            return (
              <Card key={enc.encounterId} className={`border transition-all ${isExpanded ? "border-emerald-500/60" : "border-emerald-500/30 bg-emerald-500/5"}`}>
                <CardContent className="p-0">
                  {/* ── Clickable header row ── */}
                  <div
                    onClick={() => toggleExpand(enc.encounterId)}
                    className="p-4 cursor-pointer hover:bg-emerald-500/5 transition-colors select-none"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-2.5 h-2.5 rounded-full shrink-0 bg-emerald-500" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-0.5">
                            <span className="font-bold text-foreground text-sm">{enc.patientName}</span>
                            <span className="font-mono text-xs text-muted-foreground">{enc.patientId}</span>
                            <Badge variant="outline" className="text-xs font-bold bg-emerald-500/20 text-emerald-300 border-emerald-500/30">GREEN</Badge>
                            {isOngoing && <Badge variant="outline" className="text-xs font-bold bg-blue-500/20 text-blue-300 border-blue-500/40">Ongoing Treatment</Badge>}
                          </div>
                          <p className="text-xs text-muted-foreground font-mono">{enc.encounterId} · {new Date(enc.timestamp).toLocaleString()}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {allergies.length > 0 && (
                          <span className="text-[10px] font-bold text-red-400 bg-red-500/10 border border-red-500/30 rounded px-1.5 py-0.5">⚠ ALLERGY</span>
                        )}
                        {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                      </div>
                    </div>
                  </div>

                  {/* ── Expandable detail drawer ── */}
                  {isExpanded && (
                    <div className="border-t border-emerald-500/20 bg-slate-950/60 space-y-4 p-4">
                      {/* Symptoms + Verdict */}
                      <div className="grid grid-cols-2 gap-4 border-b border-slate-800 pb-4">
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">Raw Symptom Presentation</p>
                          <p className="text-sm text-slate-200">{enc.symptoms}</p>
                          {enc.visitReason && <p className="text-xs text-slate-400 mt-1">Reason: {enc.visitReason}</p>}
                        </div>
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">Symptom Final Verdict</p>
                          <span className="inline-block px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-900">
                            {enc.symptomFinalVerdict ?? "GREEN — Stable / Routine Monitoring"}
                          </span>
                        </div>
                      </div>

                      {/* Allergies + Doctor */}
                      <div className="grid grid-cols-2 gap-4 border-b border-slate-800 pb-4">
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">Critical Allergies Registry</p>
                          {allergies.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {allergies.map((a, i) => (
                                <span key={i} className="text-[11px] font-bold text-red-400 bg-red-500/10 border border-red-500/30 rounded px-1.5 py-0.5">{a}</span>
                              ))}
                            </div>
                          ) : (
                            <p className="text-xs text-slate-400">None logged</p>
                          )}
                        </div>
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">Attending Doctor</p>
                          <p className="text-sm text-teal-400 font-semibold">{enc.assignedDoctor}</p>
                          {enc.doctorId && <p className="text-xs text-slate-500 font-mono">ID: {enc.doctorId}</p>}
                        </div>
                      </div>

                      {/* Timeline */}
                      {enc.statusHistory && enc.statusHistory.length > 0 && (
                        <div className="border-b border-slate-800 pb-4">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2 flex items-center gap-1">
                            <History className="w-3 h-3" /> Chronological Treatment Timeline
                          </p>
                          <div className="space-y-1.5 pl-2 border-l border-slate-800">
                            {enc.statusHistory.map((h) => (
                              <div key={h.eventId} className="flex items-start justify-between gap-2 text-[11px]">
                                <span className="text-slate-400">▪ <span className="text-emerald-400">{h.action}</span>{h.doctorId ? ` — Dr. ${h.doctorId}` : ""}</span>
                                <span className="text-slate-600 font-mono shrink-0">{new Date(h.timestamp).toLocaleTimeString()}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Continuity logs */}
                      {enc.crossHospitalContinuityLogs.length > 0 && (
                        <div className="border-b border-slate-800 pb-4">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">
                            Cross-Hospital Continuity Logs ({enc.crossHospitalContinuityLogs.length})
                          </p>
                          {enc.crossHospitalContinuityLogs.slice(0, 3).map((c) => (
                            <div key={c.id} className="text-xs text-slate-400 bg-slate-900/50 rounded px-2 py-1 mb-1">
                              <span className="font-semibold text-emerald-400">{c.doctorName}</span>: {c.notes.slice(0, 100)}{c.notes.length > 100 ? "…" : ""}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Action panel */}
                      <div className="space-y-3">
                        <div className="bg-amber-500/5 border border-amber-500/20 rounded-md px-3 py-2 text-xs text-amber-300 flex items-center gap-2">
                          <IdCard className="w-3.5 h-3.5 shrink-0" />
                          Doctor authorization required to update patient status.
                        </div>
                        {!state ? (
                          <Button
                            size="sm"
                            variant="outline"
                            className="w-full border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/20 text-xs"
                            onClick={(e) => { e.stopPropagation(); openActions(enc.encounterId); }}
                          >
                            Update Clinical Status
                          </Button>
                        ) : (
                          <div className="space-y-3">
                            <div className="space-y-1.5">
                              <Label className="text-xs uppercase tracking-wider text-muted-foreground font-bold">Doctor ID</Label>
                              <Input
                                placeholder="e.g. DOC101"
                                value={state.doctorId}
                                onChange={(e) => updateAction(enc.encounterId, { doctorId: e.target.value.toUpperCase(), error: "" })}
                                className="bg-background/50 font-mono uppercase text-sm h-8"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-xs uppercase tracking-wider text-muted-foreground font-bold">Patient Outcome</Label>
                              <div className="grid grid-cols-3 gap-2">
                                {ACTION_OPTIONS.map(({ action, label, color, icon, desc }) => (
                                  <button
                                    key={action}
                                    onClick={() => updateAction(enc.encounterId, { selectedAction: action, error: "" })}
                                    className={`flex flex-col items-center gap-1.5 p-2.5 rounded-lg border text-xs font-semibold transition-all ${
                                      state.selectedAction === action
                                        ? `${color} ring-2 ring-offset-1 ring-offset-background ${action === "COMPLETED" ? "ring-emerald-500" : action === "ESCALATE" ? "ring-yellow-500" : "ring-emerald-400"}`
                                        : "border-border/40 text-muted-foreground hover:border-border hover:text-foreground"
                                    }`}
                                    title={desc}
                                  >
                                    {icon}
                                    <span className="text-center leading-tight">{label}</span>
                                  </button>
                                ))}
                              </div>
                            </div>
                            {state.error && (
                              <p className="text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded px-2 py-1.5">{state.error}</p>
                            )}
                            <div className="flex gap-2">
                              <Button className="flex-1" size="sm" disabled={state.loading} onClick={() => handleConfirm(enc.encounterId)}>
                                {state.loading
                                  ? <><Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" /> Processing…</>
                                  : <><CheckCircle2 className="w-3.5 h-3.5 mr-2" /> Confirm & Apply</>}
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => closeActions(enc.encounterId)}>Cancel</Button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
