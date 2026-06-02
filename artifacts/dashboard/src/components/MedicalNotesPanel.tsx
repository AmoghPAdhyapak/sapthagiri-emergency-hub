import { useState } from "react";
import {
  FileText, ShieldCheck, ShieldX, Plus, Clock, Building2, User, AlertTriangle, CheckCircle2, Trash2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import defaultDoctors from "@/data/doctors.json";

interface Doctor { name: string; doctor_id: string; }
interface MedNote {
  id: string;
  doctorName: string;
  doctorId: string;
  hospital: string;
  comments: string;
  timestamp: string;
  verified: boolean;
}

function getDoctors(): Doctor[] {
  try {
    const s = localStorage.getItem("sapthagiri_doctors");
    if (s) return JSON.parse(s) as Doctor[];
  } catch { /* ignore */ }
  return defaultDoctors as Doctor[];
}

function getNotes(): MedNote[] {
  try {
    const s = localStorage.getItem("sapthagiri_medical_notes");
    if (s) return JSON.parse(s) as MedNote[];
  } catch { /* ignore */ }
  return [];
}

function saveNotes(notes: MedNote[]) {
  localStorage.setItem("sapthagiri_medical_notes", JSON.stringify(notes));
}

const SH = "flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-0";

export function MedicalNotesPanel() {
  const { toast } = useToast();
  const [notes, setNotes] = useState<MedNote[]>(getNotes);
  const [showForm, setShowForm] = useState(false);
  const [doctorName, setDoctorName] = useState("");
  const [doctorId, setDoctorId] = useState("");
  const [hospital, setHospital] = useState("");
  const [comments, setComments] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function handleSubmit() {
    if (!doctorName.trim() || !doctorId.trim() || !comments.trim()) {
      toast({ title: "Missing fields", description: "Doctor name, ID and comments are required.", variant: "destructive" });
      return;
    }
    setSubmitting(true);

    // Validate doctor ID
    const registry = getDoctors();
    const verified = registry.some(
      (d) => d.doctor_id.trim().toUpperCase() === doctorId.trim().toUpperCase()
    );

    setTimeout(() => {
      const note: MedNote = {
        id: Date.now().toString(),
        doctorName: doctorName.trim(),
        doctorId: doctorId.trim().toUpperCase(),
        hospital: hospital.trim() || "External Facility",
        comments: comments.trim(),
        timestamp: new Date().toISOString(),
        verified,
      };
      const updated = [note, ...notes];
      saveNotes(updated);
      setNotes(updated);
      setDoctorName(""); setDoctorId(""); setHospital(""); setComments("");
      setShowForm(false);
      setSubmitting(false);
      toast({
        title: verified ? "Note Added — Verified ✓" : "Note Added — Unverified",
        description: verified
          ? `Dr. ${note.doctorName} is in the approved registry.`
          : "Doctor ID not found in registry. Note marked unverified.",
        variant: verified ? "default" : "destructive",
      });
    }, 600);
  }

  function deleteNote(id: string) {
    const updated = notes.filter((n) => n.id !== id);
    saveNotes(updated);
    setNotes(updated);
  }

  function fmtTime(iso: string) {
    try {
      return new Date(iso).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
    } catch { return iso; }
  }

  return (
    <div className="p-6 max-w-[1100px] mx-auto w-full">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-violet-500/20 p-2 rounded-lg">
            <FileText className="w-5 h-5 text-violet-400" />
          </div>
          <div>
            <h1 className="text-xl font-black uppercase tracking-wider text-foreground">Doctor Medical Notes</h1>
            <p className="text-xs text-muted-foreground">
              Cross-hospital treatment observations · Doctor verification required
            </p>
          </div>
        </div>
        <Button
          onClick={() => setShowForm((p) => !p)}
          variant={showForm ? "outline" : "default"}
          size="sm"
          className="font-bold uppercase tracking-wider"
        >
          <Plus className="w-4 h-4 mr-1" />
          {showForm ? "Cancel" : "Add Note"}
        </Button>
      </div>

      {/* Security notice */}
      <div className="mb-5 flex items-center gap-2 rounded-lg border border-violet-500/20 bg-violet-500/5 px-4 py-2.5">
        <ShieldCheck className="w-4 h-4 text-violet-400 shrink-0" />
        <p className="text-xs text-violet-300/80">
          Doctor IDs are validated against the Sapthagiri Dean Registry. Only approved medical personnel may submit verified notes.
        </p>
      </div>

      {/* Add-note form */}
      {showForm && (
        <Card className="mb-6 border-violet-500/30 bg-violet-500/5 shadow-lg">
          <CardHeader className="pb-3 border-b border-violet-500/20">
            <CardTitle className={SH}>
              <Plus className="w-3.5 h-3.5 text-violet-400" /> New Doctor Treatment Note
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground font-medium">Doctor Full Name *</label>
                <Input
                  placeholder="Dr. Anil Kumar"
                  value={doctorName}
                  onChange={(e) => setDoctorName(e.target.value)}
                  className="bg-background h-9"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground font-medium">Doctor ID (Registry Validation) *</label>
                <Input
                  placeholder="DOC-001"
                  value={doctorId}
                  onChange={(e) => setDoctorId(e.target.value)}
                  className="bg-background h-9 font-mono uppercase"
                />
              </div>
              <div className="space-y-1 sm:col-span-2">
                <label className="text-xs text-muted-foreground font-medium">Hospital / Clinic / Transfer Facility</label>
                <Input
                  placeholder="City General Hospital, Rural PHC, Ambulance Unit 7..."
                  value={hospital}
                  onChange={(e) => setHospital(e.target.value)}
                  className="bg-background h-9"
                />
              </div>
              <div className="space-y-1 sm:col-span-2">
                <label className="text-xs text-muted-foreground font-medium">Treatment Comments / Observations *</label>
                <Textarea
                  placeholder="Patient stabilized with oxygen support before transfer. BP 140/90, SpO2 94%. Administered aspirin 325mg and IV fluids..."
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  className="min-h-[90px] resize-none bg-background font-mono text-sm"
                />
              </div>
            </div>
            <div className="flex items-center gap-3 pt-1">
              <Button
                onClick={handleSubmit}
                disabled={submitting}
                className="font-bold uppercase tracking-wider px-6"
              >
                <ShieldCheck className="w-4 h-4 mr-2" />
                {submitting ? "Verifying & Submitting…" : "Submit & Verify"}
              </Button>
              <p className="text-[10px] text-muted-foreground/60">
                Doctor ID will be cross-checked with the Dean Registry
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Notes list */}
      {notes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <FileText className="w-12 h-12 text-muted-foreground/20 mb-3" />
          <p className="text-sm font-semibold text-muted-foreground/40 uppercase tracking-wider">No Medical Notes</p>
          <p className="text-xs text-muted-foreground/30 mt-1">
            Transfer notes, ambulance observations, and cross-hospital records will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {notes.map((note) => (
            <Card
              key={note.id}
              className={`border shadow-md ${
                note.verified
                  ? "border-emerald-500/25 bg-emerald-500/5"
                  : "border-amber-500/25 bg-amber-500/5"
              }`}
            >
              <CardContent className="pt-4 pb-4">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    {note.verified ? (
                      <Badge className="bg-emerald-500/15 border-emerald-500/40 text-emerald-400 border font-bold text-[10px] px-2 py-0.5 flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3" /> Verified
                      </Badge>
                    ) : (
                      <Badge className="bg-amber-500/15 border-amber-500/40 text-amber-400 border font-bold text-[10px] px-2 py-0.5 flex items-center gap-1">
                        <ShieldX className="w-3 h-3" /> Unverified
                      </Badge>
                    )}
                    <span className="text-xs font-black text-foreground">{note.doctorName}</span>
                    <span className="text-[10px] font-mono text-muted-foreground border border-border rounded px-1.5 py-0.5">
                      {note.doctorId}
                    </span>
                  </div>
                  <button
                    onClick={() => deleteNote(note.id)}
                    className="text-muted-foreground/30 hover:text-red-400 transition-colors shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="flex items-center gap-4 mb-2.5 flex-wrap">
                  <span className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                    <Building2 className="w-3 h-3 text-violet-400" />
                    {note.hospital}
                  </span>
                  <span className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    {fmtTime(note.timestamp)}
                  </span>
                </div>
                <div className="rounded-md border border-border/40 bg-background/40 px-3 py-2.5">
                  <p className="text-sm text-foreground/80 font-mono leading-relaxed whitespace-pre-wrap">
                    {note.comments}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
