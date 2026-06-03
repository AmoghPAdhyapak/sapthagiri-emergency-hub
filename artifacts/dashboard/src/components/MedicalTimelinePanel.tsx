import { useState, useEffect } from "react";
import { Clock, Stethoscope, ChevronDown, ChevronUp, RefreshCw, Loader2, Activity } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ContinuityEntry {
  id: string;
  doctorName: string;
  doctorId: string;
  hospital: string;
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
  doctorId: string;
  timestamp: string;
  crossHospitalContinuityLogs: ContinuityEntry[];
}

const TRIAGE_COLORS = {
  RED:    { badge: "bg-red-500/20 text-red-300 border-red-500/40", line: "bg-red-500", dot: "bg-red-500" },
  YELLOW: { badge: "bg-yellow-500/20 text-yellow-300 border-yellow-500/40", line: "bg-yellow-500", dot: "bg-yellow-500" },
  GREEN:  { badge: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40", line: "bg-emerald-500", dot: "bg-emerald-500" },
};

export function MedicalTimelinePanel() {
  const [encounters, setEncounters] = useState<EncounterRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const fetchData = () => {
    setLoading(true);
    fetch("/api/triage/encounters")
      .then((r) => r.json())
      .then((data: EncounterRecord[]) => {
        const sorted = [...data].sort(
          (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
        setEncounters(sorted);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const toggle = (id: string) => {
    const next = new Set(expanded);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setExpanded(next);
  };

  const redCount = encounters.filter((e) => e.triageLevel === "RED").length;
  const yellowCount = encounters.filter((e) => e.triageLevel === "YELLOW").length;
  const greenCount = encounters.filter((e) => e.triageLevel === "GREEN").length;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary" /> Medical Timeline
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Full chronological record of all triage encounters and continuity-of-care notes.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex gap-3 text-xs font-mono font-bold">
            <span className="text-red-400">{redCount} RED</span>
            <span className="text-yellow-400">{yellowCount} YEL</span>
            <span className="text-emerald-400">{greenCount} GRN</span>
          </div>
          <Button variant="ghost" size="sm" onClick={fetchData}>
            <RefreshCw className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <Card className="border-border/40">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-black text-foreground">{encounters.length}</p>
            <p className="text-xs uppercase tracking-wider text-muted-foreground mt-0.5">Total Encounters</p>
          </CardContent>
        </Card>
        <Card className="border-border/40">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-black text-red-400">{redCount}</p>
            <p className="text-xs uppercase tracking-wider text-muted-foreground mt-0.5">Critical (RED)</p>
          </CardContent>
        </Card>
        <Card className="border-border/40">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-black text-primary">
              {encounters.reduce((acc, e) => acc + e.crossHospitalContinuityLogs.length, 0)}
            </p>
            <p className="text-xs uppercase tracking-wider text-muted-foreground mt-0.5">Continuity Notes</p>
          </CardContent>
        </Card>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          <Loader2 className="w-6 h-6 animate-spin mr-3" /> Loading timeline...
        </div>
      ) : encounters.length === 0 ? (
        <div className="text-center py-20">
          <Activity className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground font-medium">No encounters recorded yet.</p>
          <p className="text-sm text-muted-foreground/60 mt-1">
            Encounters appear here when triage is processed via Patients Folder.
          </p>
        </div>
      ) : (
        <div className="relative">
          <div className="absolute left-[22px] top-0 bottom-0 w-px bg-border/40" />
          <div className="space-y-4 pl-12">
            {encounters.map((enc, idx) => {
              const colors = TRIAGE_COLORS[enc.triageLevel];
              const isOpen = expanded.has(enc.encounterId);
              return (
                <div key={enc.encounterId} className="relative">
                  <div className={`absolute -left-[34px] top-4 w-4 h-4 rounded-full border-2 border-background ${colors.dot} z-10`} />
                  {idx < encounters.length - 1 && (
                    <div className={`absolute -left-[27px] top-8 w-px h-full ${colors.line} opacity-20`} />
                  )}
                  <Card className="border-border/40 hover:border-border/70 transition-colors">
                    <CardHeader className="pb-2 pt-3 px-4">
                      <button
                        onClick={() => toggle(enc.encounterId)}
                        className="flex items-center justify-between w-full text-left"
                      >
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-xs font-bold text-muted-foreground">{enc.encounterId}</span>
                          <span className="font-semibold text-foreground text-sm">{enc.patientName}</span>
                          <span className="text-xs text-muted-foreground font-mono">{enc.patientId}</span>
                          <Badge variant="outline" className={`text-xs font-bold ${colors.badge}`}>
                            {enc.triageLevel}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(enc.timestamp).toLocaleString()}
                          </span>
                          {isOpen ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                        </div>
                      </button>
                    </CardHeader>
                    {isOpen && (
                      <CardContent className="px-4 pb-4 pt-0">
                        <div className="border-t border-border/30 pt-3 space-y-3">
                          <div>
                            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Symptoms</p>
                            <p className="text-sm text-foreground">{enc.symptoms}</p>
                          </div>
                          {enc.visitReason && (
                            <div>
                              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Visit Reason</p>
                              <p className="text-sm text-foreground">{enc.visitReason}</p>
                            </div>
                          )}
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1"><Stethoscope className="w-3 h-3" /> {enc.assignedDoctor}</span>
                          </div>
                          {enc.crossHospitalContinuityLogs.length > 0 && (
                            <div>
                              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                                Continuity-of-Care ({enc.crossHospitalContinuityLogs.length})
                              </p>
                              <div className="space-y-2">
                                {enc.crossHospitalContinuityLogs.map((c) => (
                                  <div key={c.id} className="bg-background/40 rounded-lg p-3 border border-border/30">
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className="font-semibold text-primary text-xs">{c.doctorName}</span>
                                      {c.hospital && <span className="text-xs text-muted-foreground">@ {c.hospital}</span>}
                                      <span className="ml-auto text-xs text-muted-foreground">{new Date(c.timestamp).toLocaleString()}</span>
                                    </div>
                                    <p className="text-sm text-foreground">{c.notes}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    )}
                  </Card>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
