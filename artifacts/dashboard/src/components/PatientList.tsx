import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListPatients,
  useUpdatePatient,
  useDeletePatient,
  getListPatientsQueryKey,
  getGetPatientStatsQueryKey,
} from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatDistanceToNow } from "date-fns";
import {
  AlertCircle,
  CheckCircle,
  Clock,
  Trash2,
  Pencil,
  X,
  Save,
  Stethoscope,
} from "lucide-react";
import { DoctorVerificationModal } from "@/components/DoctorVerificationModal";

export function PatientList() {
  const queryClient = useQueryClient();
  const { data: patients = [] } = useListPatients({
    query: { refetchInterval: 5000, queryKey: getListPatientsQueryKey() },
  });

  const updatePatient = useUpdatePatient({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListPatientsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetPatientStatsQueryKey() });
      },
    },
  });

  const deletePatient = useDeletePatient({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListPatientsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetPatientStatsQueryKey() });
      },
    },
  });

  const sortedPatients = useMemo(() => {
    return [...patients].sort((a, b) => {
      if (a.status === "handled" && b.status !== "handled") return 1;
      if (a.status !== "handled" && b.status === "handled") return -1;
      const priorityWeight = { RED: 3, YELLOW: 2, GREEN: 1 };
      const weightA = priorityWeight[a.priority as keyof typeof priorityWeight] || 0;
      const weightB = priorityWeight[b.priority as keyof typeof priorityWeight] || 0;
      if (weightA !== weightB) return weightB - weightA;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [patients]);

  const handleMarkHandled = (id: number) => {
    updatePatient.mutate({ id, data: { status: "handled" } });
  };

  const handleEdit = (id: number, symptoms: string, priority: string) => {
    updatePatient.mutate({ id, data: { symptoms, priority: priority as import("@workspace/api-client-react").Priority } });
  };

  const handleDelete = (id: number) => {
    deletePatient.mutate({ id });
  };

  if (patients.length === 0) {
    return (
      <div
        className="flex flex-col h-48 items-center justify-center border-2 border-dashed border-border/50 rounded-lg gap-3"
        data-testid="empty-patient-list"
      >
        <Stethoscope className="w-8 h-8 text-muted-foreground/30" />
        <div className="text-center">
          <p className="text-muted-foreground font-semibold">No active patients</p>
          <p className="text-xs text-muted-foreground/60 mt-1 uppercase tracking-wider font-mono">
            Awaiting Medical Intake
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2 flex-1" data-testid="patient-list">
      <div className="grid grid-cols-12 gap-4 px-4 py-2 border-b border-border text-xs font-bold text-muted-foreground uppercase tracking-widest sticky top-0 bg-background/95 z-10 backdrop-blur">
        <div className="col-span-2">Priority</div>
        <div className="col-span-2">Patient</div>
        <div className="col-span-1">Room</div>
        <div className="col-span-4">Symptoms / Observations</div>
        <div className="col-span-1">Wait</div>
        <div className="col-span-2 text-right">Actions</div>
      </div>

      {sortedPatients.map((patient) => (
        <PatientCard
          key={patient.id}
          patient={patient}
          onMarkHandled={() => handleMarkHandled(patient.id)}
          onEdit={(symptoms, priority) => handleEdit(patient.id, symptoms, priority)}
          onDelete={() => handleDelete(patient.id)}
          isUpdating={updatePatient.isPending}
          isDeleting={deletePatient.isPending}
        />
      ))}
    </div>
  );
}

interface PatientCardProps {
  patient: {
    id: number;
    name: string;
    priority: string;
    status: string;
    room_no: string;
    bed_no?: string;
    symptoms: string;
    created_at: string;
  };
  onMarkHandled: () => void;
  onEdit: (symptoms: string, priority: string) => void;
  onDelete: () => void;
  isUpdating: boolean;
  isDeleting: boolean;
}

function PatientCard({
  patient,
  onMarkHandled,
  onEdit,
  onDelete,
  isUpdating,
  isDeleting,
}: PatientCardProps) {
  const [verifyOpen, setVerifyOpen] = useState(false);
  const [verifyTarget, setVerifyTarget] = useState<"handle" | "edit">("handle");
  const [editMode, setEditMode] = useState(false);
  const [editSymptoms, setEditSymptoms] = useState(patient.symptoms);
  const [editPriority, setEditPriority] = useState(patient.priority);

  const isRed = patient.priority === "RED" && patient.status === "active";
  const isHandled = patient.status === "handled";

  const priorityColorMap: Record<string, string> = {
    RED: "bg-red-500 text-white shadow-[0_0_14px_rgba(239,68,68,0.5)]",
    YELLOW: "bg-yellow-500 text-black shadow-[0_0_10px_rgba(234,179,8,0.3)]",
    GREEN: "bg-emerald-500 text-white shadow-[0_0_10px_rgba(16,185,129,0.3)]",
  };

  const triggerVerify = (target: "handle" | "edit") => {
    setVerifyTarget(target);
    setVerifyOpen(true);
  };

  const handleVerified = () => {
    if (verifyTarget === "handle") {
      onMarkHandled();
    } else {
      setEditSymptoms(patient.symptoms);
      setEditPriority(patient.priority);
      setEditMode(true);
    }
  };

  const handleSave = () => {
    onEdit(editSymptoms, editPriority);
    setEditMode(false);
  };

  const handleCancelEdit = () => {
    setEditMode(false);
    setEditSymptoms(patient.symptoms);
    setEditPriority(patient.priority);
  };

  return (
    <>
      <DoctorVerificationModal
        open={verifyOpen}
        onClose={() => setVerifyOpen(false)}
        onVerified={handleVerified}
        action={
          verifyTarget === "handle"
            ? "mark this patient as handled"
            : "edit this patient's clinical record"
        }
      />

      <Card
        className={`border-l-4 transition-all duration-300 ${
          isHandled
            ? "opacity-50 border-l-gray-600 bg-gray-900/50"
            : patient.priority === "RED"
              ? "border-l-red-500 animate-critical"
              : patient.priority === "YELLOW"
                ? "border-l-yellow-500 bg-card"
                : "border-l-emerald-500 bg-card"
        }`}
        data-testid={`card-patient-${patient.id}`}
      >
        <CardContent className="p-0">
          {editMode ? (
            /* ── Inline Doctor Edit Form ── */
            <div className="p-4 space-y-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-primary bg-primary/8 border border-primary/20 rounded-md px-3 py-2">
                <Pencil className="w-3.5 h-3.5" />
                Doctor-verified edit — {patient.name}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">
                    Triage Priority
                  </Label>
                  <Select value={editPriority} onValueChange={setEditPriority}>
                    <SelectTrigger
                      className="bg-background h-8 text-sm"
                      data-testid={`select-priority-${patient.id}`}
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="RED">
                        <span className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-red-500 inline-block" /> RED — Critical
                        </span>
                      </SelectItem>
                      <SelectItem value="YELLOW">
                        <span className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-yellow-500 inline-block" /> YELLOW — Urgent
                        </span>
                      </SelectItem>
                      <SelectItem value="GREEN">
                        <span className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> GREEN — Stable
                        </span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5 col-span-2">
                  <Label className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">
                    Symptoms / Clinical Observations
                  </Label>
                  <Textarea
                    value={editSymptoms}
                    onChange={(e) => setEditSymptoms(e.target.value)}
                    className="resize-none bg-background text-sm min-h-[72px]"
                    placeholder="Update clinical symptoms and observations..."
                    data-testid={`textarea-symptoms-${patient.id}`}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  className="h-7 text-xs flex-1"
                  onClick={handleSave}
                  disabled={isUpdating}
                  data-testid={`button-save-edit-${patient.id}`}
                >
                  <Save className="w-3 h-3 mr-1.5" />
                  {isUpdating ? "Saving…" : "Save Changes"}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs"
                  onClick={handleCancelEdit}
                  data-testid={`button-cancel-edit-${patient.id}`}
                >
                  <X className="w-3 h-3 mr-1" />
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            /* ── Normal Card Row ── */
            <div className="grid grid-cols-12 gap-4 px-4 py-3 items-center">
              <div className="col-span-2 flex items-center gap-2">
                <Badge
                  variant="outline"
                  className={`font-mono font-bold text-xs uppercase border-0 ${
                    priorityColorMap[patient.priority] ?? "bg-gray-500 text-white"
                  }`}
                  data-testid={`badge-priority-${patient.id}`}
                >
                  {patient.priority}
                </Badge>
                {isRed && <AlertCircle className="w-4 h-4 text-red-500 animate-pulse" />}
              </div>

              <div
                className="col-span-2 font-semibold text-foreground truncate"
                data-testid={`text-name-${patient.id}`}
              >
                {isHandled ? (
                  <s className="text-muted-foreground">{patient.name}</s>
                ) : (
                  patient.name
                )}
              </div>

              <div
                className="col-span-1 text-xs text-muted-foreground font-mono"
                data-testid={`text-location-${patient.id}`}
              >
                R:{patient.room_no}
                {patient.bed_no ? ` B:${patient.bed_no}` : ""}
              </div>

              <div
                className="col-span-4 text-sm text-muted-foreground truncate"
                data-testid={`text-symptoms-${patient.id}`}
              >
                {patient.symptoms || (
                  <span className="italic text-muted-foreground/50">
                    No observations yet — Awaiting doctor intake
                  </span>
                )}
              </div>

              <div
                className="col-span-1 text-xs text-muted-foreground font-mono flex items-center gap-1"
                data-testid={`text-time-${patient.id}`}
              >
                <Clock className="w-3 h-3" />
                {formatDistanceToNow(new Date(patient.created_at))}
              </div>

              <div className="col-span-2 flex items-center justify-end gap-1.5">
                {patient.status === "active" && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-[11px] font-semibold border-primary/30 text-primary hover:bg-primary/10 px-2"
                      onClick={() => triggerVerify("edit")}
                      disabled={isUpdating}
                      data-testid={`button-edit-${patient.id}`}
                    >
                      <Pencil className="w-3 h-3 mr-1" />
                      EDIT
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-[11px] font-semibold border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 hover:text-emerald-300 px-2"
                      onClick={() => triggerVerify("handle")}
                      disabled={isUpdating}
                      data-testid={`button-handled-${patient.id}`}
                    >
                      <CheckCircle className="w-3 h-3 mr-1" />
                      HANDLE
                    </Button>
                  </>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/20"
                  onClick={onDelete}
                  disabled={isDeleting}
                  data-testid={`button-delete-${patient.id}`}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
