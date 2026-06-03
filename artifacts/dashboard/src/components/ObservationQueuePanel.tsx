import { useState, useEffect } from "react";
import { Eye, Clock, Stethoscope, Loader2, RefreshCw, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface EncounterRecord {
  encounterId: string;
  patientId: string;
  patientName: string;
  symptoms: string;
  visitReason: string;
  triageLevel: "RED" | "YELLOW" | "GREEN";
  assignedDoctor: string;
  timestamp: string;
  crossHospitalContinuityLogs: { id: string; doctorName: string; notes: string; timestamp: string }[];
}

export function ObservationQueuePanel() {
  const [encounters, setEncounters] = useState<EncounterRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEncounters = () => {
    setLoading(true);
    fetch("/api/triage/encounters")
      .then((r) => r.json())
      .then((data: EncounterRecord[]) => {
        setEncounters(data.filter((e) => e.triageLevel === "YELLOW"));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => { fetchEncounters(); }, []);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Eye className="w-5 h-5 text-yellow-400" />
            Observation Queue
            <Badge variant="outline" className="bg-yellow-500/20 text-yellow-300 border-yellow-500/40 text-xs font-bold ml-1">
              YELLOW
            </Badge>
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Urgent patients under observation — requires timely attention.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-bold text-yellow-400">{encounters.length} YELLOW</span>
          <Button variant="ghost" size="sm" onClick={fetchEncounters}>
            <RefreshCw className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          <Loader2 className="w-6 h-6 animate-spin mr-3" /> Loading queue...
        </div>
      ) : encounters.length === 0 ? (
        <div className="text-center py-20">
          <Eye className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground font-medium">No patients under observation.</p>
          <p className="text-sm text-muted-foreground/60 mt-1">
            YELLOW triage patients will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {encounters.map((enc) => (
            <Card
              key={enc.encounterId}
              className="border border-yellow-500/40 bg-yellow-500/5 transition-all"
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="mt-1 w-2.5 h-2.5 rounded-full shrink-0 bg-yellow-500" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-bold text-foreground text-sm">{enc.patientName}</span>
                      <span className="font-mono text-xs text-muted-foreground">{enc.patientId}</span>
                      <Badge variant="outline" className="text-xs font-bold bg-yellow-500/20 text-yellow-300 border-yellow-500/40">
                        YELLOW
                      </Badge>
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
                            <span className="font-semibold text-yellow-400">{c.doctorName}</span>: {c.notes.slice(0, 80)}{c.notes.length > 80 ? "…" : ""}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
