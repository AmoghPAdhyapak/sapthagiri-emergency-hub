import { useState, useEffect } from "react";
import { AlertTriangle, Clock, Stethoscope, Loader2, RefreshCw, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

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
}

const TRIAGE_STYLE = {
  RED: {
    border: "border-red-500/60",
    bg: "bg-red-500/8",
    badge: "bg-red-500/20 text-red-300 border-red-500/40",
    dot: "bg-red-500",
    label: "text-red-400",
    glow: "shadow-[0_0_20px_hsl(0_80%_50%_/_0.15)]",
  },
  YELLOW: {
    border: "border-yellow-500/40",
    bg: "bg-yellow-500/5",
    badge: "bg-yellow-500/20 text-yellow-300 border-yellow-500/40",
    dot: "bg-yellow-500",
    label: "text-yellow-400",
    glow: "",
  },
  GREEN: {
    border: "border-emerald-500/30",
    bg: "bg-emerald-500/5",
    badge: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
    dot: "bg-emerald-500",
    label: "text-emerald-400",
    glow: "",
  },
};

export function LiveReportsPanel() {
  const [encounters, setEncounters] = useState<EncounterRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState<Set<string>>(() => {
    try {
      const s = localStorage.getItem("sapthagiri_dismissed_encounters");
      return s ? new Set(JSON.parse(s) as string[]) : new Set();
    } catch { return new Set(); }
  });

  const fetchEncounters = () => {
    setLoading(true);
    fetch("/api/triage/encounters")
      .then((r) => r.json())
      .then((data: EncounterRecord[]) => { setEncounters(data); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { fetchEncounters(); }, []);

  const dismiss = (id: string) => {
    const next = new Set(dismissed);
    next.add(id);
    setDismissed(next);
    localStorage.setItem("sapthagiri_dismissed_encounters", JSON.stringify([...next]));
  };

  const visible = encounters.filter((e) => e.triageLevel === "RED" || !dismissed.has(e.encounterId));

  const redCount = visible.filter((e) => e.triageLevel === "RED").length;
  const yellowCount = visible.filter((e) => e.triageLevel === "YELLOW").length;
  const greenCount = visible.filter((e) => e.triageLevel === "GREEN").length;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-400" /> Live Patient Reports
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Active triage encounters — RED cases always pinned. Cannot remove RED.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-3 text-xs font-mono font-bold">
            <span className="text-red-400">{redCount} RED</span>
            <span className="text-yellow-400">{yellowCount} YEL</span>
            <span className="text-emerald-400">{greenCount} GRN</span>
          </div>
          <Button variant="ghost" size="sm" onClick={fetchEncounters}>
            <RefreshCw className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          <Loader2 className="w-6 h-6 animate-spin mr-3" /> Loading encounters...
        </div>
      ) : visible.length === 0 ? (
        <div className="text-center py-20">
          <Users className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground font-medium">No active encounters.</p>
          <p className="text-sm text-muted-foreground/60 mt-1">
            Triage encounters created via Patients Folder appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {visible.map((enc) => {
            const style = TRIAGE_STYLE[enc.triageLevel];
            const isRed = enc.triageLevel === "RED";
            return (
              <Card
                key={enc.encounterId}
                className={`border ${style.border} ${style.bg} ${style.glow} ${
                  isRed ? "animate-[pulse_3s_ease-in-out_infinite]" : ""
                } transition-all`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className={`mt-1 w-2.5 h-2.5 rounded-full shrink-0 ${style.dot} ${isRed ? "animate-ping" : ""}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="font-bold text-foreground text-sm">{enc.patientName}</span>
                          <span className="font-mono text-xs text-muted-foreground">{enc.patientId}</span>
                          <Badge variant="outline" className={`text-xs font-bold ${style.badge}`}>
                            {enc.triageLevel}
                          </Badge>
                          {isRed && (
                            <span className={`text-xs font-black uppercase tracking-widest ${style.label} flex items-center gap-1`}>
                              <AlertTriangle className="w-3 h-3" /> CRITICAL
                            </span>
                          )}
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
                          {enc.encounterId && (
                            <span className="font-mono text-muted-foreground/60">{enc.encounterId}</span>
                          )}
                        </div>
                        {enc.crossHospitalContinuityLogs.length > 0 && (
                          <div className="mt-2 pt-2 border-t border-border/30">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                              Continuity Logs ({enc.crossHospitalContinuityLogs.length})
                            </p>
                            {enc.crossHospitalContinuityLogs.slice(0, 2).map((c) => (
                              <div key={c.id} className="text-xs text-muted-foreground bg-background/30 rounded px-2 py-1 mb-1">
                                <span className="font-semibold text-primary">{c.doctorName}</span>: {c.notes.slice(0, 80)}{c.notes.length > 80 ? "…" : ""}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    {!isRed && (
                      <button
                        onClick={() => dismiss(enc.encounterId)}
                        className="text-xs text-muted-foreground hover:text-foreground border border-border/40 hover:border-border px-2 py-1 rounded transition-colors shrink-0"
                        title="Dismiss from view"
                      >
                        Dismiss
                      </button>
                    )}
                    {isRed && (
                      <div className="text-xs text-red-400/60 border border-red-500/20 px-2 py-1 rounded shrink-0 font-mono">
                        LOCKED
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
