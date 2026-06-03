import { useState, useEffect } from "react";
import { AlertTriangle, Clock, Stethoscope, Loader2, RefreshCw, ShieldAlert, CheckCircle2, Eye, Skull, IdCard } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
  visitReason: string;
  triageLevel: "RED" | "YELLOW" | "GREEN";
  assignedDoctor: string;
  timestamp: string;
  crossHospitalContinuityLogs: ContinuityEntry[];
  isArchived?: boolean;
}

type StatusAction = "OUT_OF_DANGER" | "UNDER_OBSERVATION" | "DECEASED";

interface ActionState {
  encounterId: string;
  doctorId: string;
  selectedAction: StatusAction | null;
  loading: boolean;
  error: string;
}

const STATUS_OPTIONS: { action: StatusAction; label: string; color: string; icon: React.ReactNode }[] = [
  { action: "OUT_OF_DANGER",    label: "Out of Danger",       color: "border-emerald-500/50 bg-emerald-500/10 text-emerald-300", icon: <CheckCircle2 className="w-4 h-4 text-emerald-400" /> },
  { action: "UNDER_OBSERVATION", label: "Under Observation",  color: "border-yellow-500/50 bg-yellow-500/10 text-yellow-300",   icon: <Eye className="w-4 h-4 text-yellow-400" /> },
  { action: "DECEASED",          label: "Deceased",           color: "border-red-900/60 bg-red-900/20 text-red-400",            icon: <Skull className="w-4 h-4 text-red-500" /> },
];

export function LiveReportsPanel() {
  const [encounters, setEncounters] = useState<EncounterRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionState, setActionState] = useState<Record<string, ActionState>>({});

  const fetchEncounters = () => {
    setLoading(true);
    fetch("/api/triage/encounters")
      .then((r) => r.json())
      .then((data: EncounterRecord[]) => {
        setEncounters(data.filter((e) => e.triageLevel === "RED" && !e.isArchived));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => { fetchEncounters(); }, []);

  const openActions = (encounterId: string) => {
    setActionState((prev) => ({
      ...prev,
      [encounterId]: { encounterId, doctorId: "", selectedAction: null, loading: false, error: "" },
    }));
  };

  const closeActions = (encounterId: string) => {
    setActionState((prev) => {
      const next = { ...prev };
      delete next[encounterId];
      return next;
    });
  };

  const updateAction = (encounterId: string, patch: Partial<ActionState>) => {
    setActionState((prev) => ({
      ...prev,
      [encounterId]: { ...prev[encounterId], ...patch },
    }));
  };

  const handleComplete = async (encounterId: string) => {
    const state = actionState[encounterId];
    if (!state) return;
    if (!state.doctorId.trim()) {
      updateAction(encounterId, { error: "Doctor ID is required to authorize this action." });
      return;
    }
    if (!state.selectedAction) {
      updateAction(encounterId, { error: "Please select a status outcome before confirming." });
      return;
    }

    if (state.selectedAction === "DECEASED") {
      const confirmed = window.confirm(
        `Confirm: Mark ${encounters.find((e) => e.encounterId === encounterId)?.patientName ?? "patient"} as DECEASED? This action permanently archives the record.`
      );
      if (!confirmed) return;
    }

    updateAction(encounterId, { loading: true, error: "" });
    try {
      const res = await fetch("/api/triage/emergency-hub/action", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          encounterId,
          doctorId: state.doctorId.trim(),
          statusAction: state.selectedAction,
        }),
      });
      const data = await res.json() as { success: boolean; error?: string };
      if (!res.ok || !data.success) {
        updateAction(encounterId, { loading: false, error: data.error ?? "Action failed." });
        return;
      }
      setEncounters((prev) => prev.filter((e) => e.encounterId !== encounterId));
      closeActions(encounterId);
    } catch {
      updateAction(encounterId, { loading: false, error: "Network error. Please try again." });
    }
  };

  const redCount = encounters.length;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-red-400 animate-pulse" />
            Emergency Hub
            <Badge variant="outline" className="bg-red-500/20 text-red-300 border-red-500/40 text-xs font-bold ml-1">
              RED ONLY
            </Badge>
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Critical patients requiring immediate attention. Doctors can update patient status below.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-bold text-red-400">{redCount} CRITICAL</span>
          <Button variant="ghost" size="sm" onClick={fetchEncounters}>
            <RefreshCw className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          <Loader2 className="w-6 h-6 animate-spin mr-3" /> Loading critical cases...
        </div>
      ) : encounters.length === 0 ? (
        <div className="text-center py-20">
          <CheckCircle2 className="w-12 h-12 text-emerald-400/40 mx-auto mb-3" />
          <p className="text-muted-foreground font-medium">No critical RED patients at this time.</p>
          <p className="text-sm text-muted-foreground/60 mt-1">
            Critical triage encounters appear here as they come in.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {encounters.map((enc) => {
            const state = actionState[enc.encounterId];
            return (
              <Card
                key={enc.encounterId}
                className="border border-red-500/60 bg-red-500/8 shadow-[0_0_20px_hsl(0_80%_50%_/_0.15)] animate-[pulse_3s_ease-in-out_infinite] transition-all"
              >
                <CardContent className="p-4">
                  {/* Patient info row */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="mt-1 w-2.5 h-2.5 rounded-full shrink-0 bg-red-500 animate-ping" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="font-bold text-foreground text-sm">{enc.patientName}</span>
                          <span className="font-mono text-xs text-muted-foreground">{enc.patientId}</span>
                          <Badge variant="outline" className="text-xs font-bold bg-red-500/20 text-red-300 border-red-500/40">
                            RED
                          </Badge>
                          <span className="text-xs font-black uppercase tracking-widest text-red-400 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" /> CRITICAL
                          </span>
                        </div>
                        <p className="text-sm text-foreground/80 mb-2 line-clamp-2">{enc.symptoms}</p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(enc.timestamp).toLocaleString()}
                          </span>
                          <span className="flex items-center gap-1">
                            <Stethoscope className="w-3 h-3" />
                            {enc.assignedDoctor}
                          </span>
                          <span className="font-mono text-muted-foreground/60">{enc.encounterId}</span>
                        </div>
                        {enc.crossHospitalContinuityLogs.length > 0 && (
                          <div className="mt-2 pt-2 border-t border-border/30">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                              Continuity Logs ({enc.crossHospitalContinuityLogs.length})
                            </p>
                            {enc.crossHospitalContinuityLogs.slice(0, 2).map((c) => (
                              <div key={c.id} className="text-xs text-muted-foreground bg-background/30 rounded px-2 py-1 mb-1">
                                <span className="font-semibold text-red-400">{c.doctorName}</span>: {c.notes.slice(0, 80)}{c.notes.length > 80 ? "…" : ""}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Controls */}
                    <div className="shrink-0">
                      {!state ? (
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-red-500/40 text-red-300 hover:bg-red-500/20 text-xs"
                          onClick={() => openActions(enc.encounterId)}
                        >
                          Update Status
                        </Button>
                      ) : (
                        <button
                          onClick={() => closeActions(enc.encounterId)}
                          className="text-xs text-muted-foreground hover:text-foreground border border-border/40 hover:border-border px-2 py-1 rounded transition-colors"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Inline status action controls */}
                  {state && (
                    <div className="mt-4 pt-4 border-t border-red-500/20 space-y-3">
                      <div className="bg-amber-500/5 border border-amber-500/20 rounded-md px-3 py-2 text-xs text-amber-300 flex items-center gap-2">
                        <IdCard className="w-3.5 h-3.5 shrink-0" />
                        Doctor authorization required to update patient status.
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs uppercase tracking-wider text-muted-foreground font-bold">
                          Doctor ID
                        </Label>
                        <Input
                          placeholder="e.g. DOC101"
                          value={state.doctorId}
                          onChange={(e) => updateAction(enc.encounterId, { doctorId: e.target.value.toUpperCase(), error: "" })}
                          className="bg-background/50 font-mono uppercase text-sm h-8"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs uppercase tracking-wider text-muted-foreground font-bold">
                          Clinical Outcome
                        </Label>
                        <div className="grid grid-cols-3 gap-2">
                          {STATUS_OPTIONS.map(({ action, label, color, icon }) => (
                            <button
                              key={action}
                              onClick={() => updateAction(enc.encounterId, { selectedAction: action, error: "" })}
                              className={`flex flex-col items-center gap-1.5 p-2.5 rounded-lg border text-xs font-semibold transition-all ${
                                state.selectedAction === action
                                  ? `${color} ring-2 ring-offset-1 ring-offset-background ${
                                      action === "OUT_OF_DANGER" ? "ring-emerald-500" : action === "UNDER_OBSERVATION" ? "ring-yellow-500" : "ring-red-700"
                                    }`
                                  : "border-border/40 text-muted-foreground hover:border-border hover:text-foreground"
                              }`}
                            >
                              {icon}
                              <span className="text-center leading-tight">{label}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {state.error && (
                        <p className="text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded px-2 py-1.5">
                          {state.error}
                        </p>
                      )}

                      <Button
                        className="w-full"
                        size="sm"
                        disabled={state.loading}
                        onClick={() => handleComplete(enc.encounterId)}
                      >
                        {state.loading ? (
                          <><Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" /> Processing…</>
                        ) : (
                          <><CheckCircle2 className="w-3.5 h-3.5 mr-2" /> Completed — Update & Clear from Hub</>
                        )}
                      </Button>
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
