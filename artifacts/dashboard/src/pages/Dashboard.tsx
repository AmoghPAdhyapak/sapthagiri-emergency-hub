import { useState, useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListGeminiConversations,
  useCreateGeminiConversation,
  useDeleteGeminiConversation,
  useGetGeminiConversation,
  getListGeminiConversationsQueryKey,
  getGetGeminiConversationQueryKey,
} from "@workspace/api-client-react";
import { useLocation } from "wouter";
import { StatsBar } from "@/components/StatsBar";
import { PatientList } from "@/components/PatientList";
import { PatientsFolderPanel } from "@/components/PatientsFolderPanel";
import { LiveReportsPanel } from "@/components/LiveReportsPanel";
import { MedicalTimelinePanel } from "@/components/MedicalTimelinePanel";
import { ObservationQueuePanel } from "@/components/ObservationQueuePanel";
import { GeneralMonitoringPanel } from "@/components/GeneralMonitoringPanel";
import {
  Activity,
  Bot,
  LogOut,
  User,
  Users,
  Settings,
  ShieldCheck,
  Plus,
  Trash2,
  Lock,
  Phone,
  Mail,
  BedDouble,
  Stethoscope,
  AlertTriangle,
  FileEdit,
  ClipboardList,
  CheckCircle2,
  X,
  Send,
  Loader2,
  FileText,
  Eye,
  UserPlus,
  FolderSearch,
  ShieldAlert,
  IdCard,
  AlertOctagon,
  MessageSquare,
  ArrowLeft,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { AiChatPanel } from "@/components/AiChatPanel";
import { DoctorVerificationModal } from "@/components/DoctorVerificationModal";
import { MedicalNotesPanel } from "@/components/MedicalNotesPanel";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import defaultDoctors from "@/data/doctors.json";
import logoUrl from "@/assets/logo.png";

type DashView = "dashboard" | "observation" | "general" | "patientreg" | "folder" | "staffdir" | "timeline" | "ai" | "account" | "dean" | "notes";

interface UserData {
  name: string;
  phone?: string;
  email?: string;
  roomNumber?: string;
  symptoms?: string;
  role?: string;
}

interface Doctor {
  name: string;
  doctor_id: string;
}

function getDoctors(): Doctor[] {
  try {
    const stored = localStorage.getItem("sapthagiri_doctors");
    if (stored) return JSON.parse(stored) as Doctor[];
  } catch {
    // fall through
  }
  return defaultDoctors as Doctor[];
}

function saveDoctors(doctors: Doctor[]) {
  localStorage.setItem("sapthagiri_doctors", JSON.stringify(doctors));
}

// ── Medical Record helpers ────────────────────────────────────────────────────
interface MedicalRecord {
  clinicalNotes: string;
  emergencyStatus: string;
  lastUpdated: string | null;
  verifiedNote: string | null;
}

const DEFAULT_MED_RECORD: MedicalRecord = {
  clinicalNotes: "",
  emergencyStatus: "Registered — No Active Incidents",
  lastUpdated: null,
  verifiedNote: null,
};

function getMedRecord(phone: string | undefined): MedicalRecord {
  try {
    const key = `sapthagiri_med_${phone || "default"}`;
    const stored = localStorage.getItem(key);
    if (stored) return { ...DEFAULT_MED_RECORD, ...(JSON.parse(stored) as Partial<MedicalRecord>) };
  } catch { /* ignore */ }
  return { ...DEFAULT_MED_RECORD };
}

function saveMedRecord(phone: string | undefined, record: MedicalRecord) {
  localStorage.setItem(`sapthagiri_med_${phone || "default"}`, JSON.stringify(record));
}

// ── Sidebar ──────────────────────────────────────────────────────────────────
function Sidebar({
  activeView,
  onNavigate,
  onOpenChat,
  collapsed,
  onToggleCollapse,
}: {
  activeView: DashView;
  onNavigate: (v: DashView) => void;
  onOpenChat: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}) {
  const queueItems: { view: DashView; icon: React.ReactNode; label: string; activeColor: string; dotColor: string; title: string }[] = [
    {
      view: "dashboard",
      icon: <ShieldAlert className="w-4 h-4 shrink-0" />,
      label: "Emergency Hub",
      title: "Emergency Hub",
      activeColor: "bg-red-500/15 text-red-300 border border-red-500/30",
      dotColor: "bg-red-500",
    },
    {
      view: "observation",
      icon: <Eye className="w-4 h-4 shrink-0" />,
      label: "Observation Queue",
      title: "Observation Queue",
      activeColor: "bg-yellow-500/15 text-yellow-300 border border-yellow-500/30",
      dotColor: "bg-yellow-500",
    },
    {
      view: "general",
      icon: <Activity className="w-4 h-4 shrink-0" />,
      label: "General Monitoring",
      title: "General Monitoring",
      activeColor: "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30",
      dotColor: "bg-emerald-500",
    },
  ];

  const mgmtItems: { view: DashView; icon: React.ReactNode; label: string }[] = [
    { view: "patientreg", icon: <UserPlus className="w-4 h-4 shrink-0" />,    label: "Patient Registration" },
    { view: "folder",     icon: <FolderSearch className="w-4 h-4 shrink-0" />, label: "Patients Folder" },
    { view: "staffdir",   icon: <IdCard className="w-4 h-4 shrink-0" />,      label: "Staff Directory" },
    { view: "timeline",   icon: <ClipboardList className="w-4 h-4 shrink-0" />,label: "Medical Timeline" },
    { view: "notes",      icon: <FileText className="w-4 h-4 shrink-0" />,     label: "Medical Notes" },
    { view: "account",    icon: <User className="w-4 h-4 shrink-0" />,         label: "Settings" },
    { view: "dean",       icon: <Settings className="w-4 h-4 shrink-0" />,     label: "Dean Access" },
  ];

  return (
    <aside
      className={`shrink-0 border-r border-border bg-card flex flex-col py-4 overflow-y-auto overflow-x-hidden transition-[width] duration-200 ease-in-out ${
        collapsed ? "w-[52px]" : "w-56"
      }`}
    >
      {/* Logo + brand + collapse toggle */}
      <div className={`px-2 mb-5 flex items-center ${collapsed ? "justify-center" : "gap-2 pl-3"}`}>
        {!collapsed && (
          <img src={logoUrl} alt="Sapthagiri NPS" className="h-8 w-8 object-contain shrink-0" />
        )}
        {!collapsed && (
          <div className="min-w-0 flex-1">
            <p className="text-xs font-black text-foreground leading-tight truncate">Sapthagiri NPS</p>
            <p className="text-[9px] text-muted-foreground uppercase tracking-widest truncate">Clinical Network</p>
          </div>
        )}
        <button
          onClick={onToggleCollapse}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors shrink-0"
        >
          {collapsed
            ? <PanelLeftOpen className="w-4 h-4" />
            : <PanelLeftClose className="w-4 h-4" />}
        </button>
      </div>

      {/* Queue section label */}
      {!collapsed && (
        <div className="px-4 mb-2">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Live Queues</p>
        </div>
      )}
      {collapsed && <div className="mx-auto my-1 w-5 border-t border-border" />}

      <nav className="flex flex-col gap-1 px-1.5">
        {queueItems.map(({ view, icon, label, title, activeColor, dotColor }) => (
          <button
            key={view}
            onClick={() => onNavigate(view)}
            data-testid={`nav-${view}`}
            title={collapsed ? title : undefined}
            className={`w-full flex items-center rounded-md text-sm font-medium transition-colors ${
              collapsed ? "justify-center px-0 py-2.5" : "gap-3 px-3 py-2.5 text-left"
            } ${
              activeView === view
                ? activeColor
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            }`}
          >
            {icon}
            {!collapsed && <span className="flex-1 text-left">{label}</span>}
            {!collapsed && activeView !== view && (
              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColor}`} />
            )}
          </button>
        ))}
      </nav>

      <div className="mx-2 my-3 border-t border-border" />

      {/* Management section label */}
      {!collapsed && (
        <div className="px-4 mb-2">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Management</p>
        </div>
      )}

      <nav className="flex flex-col gap-1 px-1.5 flex-1">
        {mgmtItems.map(({ view, icon, label }) => (
          <button
            key={view}
            onClick={() => onNavigate(view)}
            data-testid={`nav-${view}`}
            title={collapsed ? label : undefined}
            className={`w-full flex items-center rounded-md text-sm font-medium transition-colors ${
              collapsed ? "justify-center px-0 py-2.5" : "gap-3 px-3 py-2.5 text-left"
            } ${
              activeView === view
                ? "bg-primary/15 text-primary border border-primary/20"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            }`}
          >
            {icon}
            {!collapsed && label}
          </button>
        ))}

        {/* AI Assistant */}
        <button
          onClick={() => onNavigate("ai")}
          data-testid="nav-ai-assistant"
          title={collapsed ? "AI Assistant" : undefined}
          className={`w-full flex items-center rounded-md text-sm font-medium transition-colors mt-1 ${
            collapsed ? "justify-center px-0 py-2.5" : "gap-3 px-3 py-2.5 text-left"
          } ${
            activeView === "ai"
              ? "bg-primary/15 text-primary border border-primary/20"
              : "text-primary border border-primary/20 bg-primary/10 hover:bg-primary/20 shadow-[0_0_12px_hsl(180_70%_50%_/_0.15)]"
          }`}
        >
          <Bot className={`w-4 h-4 shrink-0 ${activeView !== "ai" ? "animate-pulse" : ""}`} />
          {!collapsed && <span>AI Assistant</span>}
          {!collapsed && <span className="ml-auto flex h-1.5 w-1.5 rounded-full bg-primary animate-ping" />}
        </button>
      </nav>

      <div className="px-2 mt-4 pt-4 border-t border-border">
        <div className={`flex items-center gap-2 ${collapsed ? "justify-center" : ""}`}>
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
          {!collapsed && <span className="text-[10px] font-mono text-emerald-500 uppercase tracking-wider">System Live</span>}
        </div>
      </div>
    </aside>
  );
}

// ── Account Panel ─────────────────────────────────────────────────────────────
const STATUS_COLORS: Record<string, string> = {
  "Registered — No Active Incidents": "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
  "Under Observation":                "bg-yellow-500/10 text-yellow-400 border-yellow-500/30",
  "Active Emergency — GREEN":         "bg-emerald-500/20 text-emerald-300 border-emerald-500/50",
  "Active Emergency — YELLOW":        "bg-yellow-500/20 text-yellow-300 border-yellow-500/50",
  "Active Emergency — RED":           "bg-red-500/20 text-red-300 border-red-500/50",
};

function AccountPanel({ user }: { user: UserData | null }) {
  const [verifyOpen, setVerifyOpen]   = useState(false);
  const [editMode, setEditMode]       = useState(false);
  const [medRecord, setMedRecord]     = useState<MedicalRecord>(() => getMedRecord(user?.phone));
  const [editNotes, setEditNotes]     = useState("");
  const [editStatus, setEditStatus]   = useState("");

  if (!user) {
    return <div className="p-8 text-center text-muted-foreground">No account data found. Please log in.</div>;
  }

  const roleColor: Record<string, string> = {
    Patient: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    Doctor:  "bg-primary/20 text-primary border-primary/30",
    Nurse:   "bg-purple-500/20 text-purple-400 border-purple-500/30",
    Admin:   "bg-orange-500/20 text-orange-400 border-orange-500/30",
    Staff:   "bg-gray-500/20 text-gray-400 border-gray-500/30",
  };

  const handleDoctorVerified = () => {
    setEditNotes(medRecord.clinicalNotes);
    setEditStatus(medRecord.emergencyStatus);
    setEditMode(true);
  };

  const handleSave = () => {
    const updated: MedicalRecord = {
      clinicalNotes:  editNotes,
      emergencyStatus: editStatus,
      lastUpdated:    new Date().toISOString(),
      verifiedNote:   "Doctor-verified edit",
    };
    saveMedRecord(user.phone, updated);
    setMedRecord(updated);
    setEditMode(false);
  };

  const handleCancelEdit = () => {
    setEditMode(false);
    setEditNotes("");
    setEditStatus("");
  };

  const statusClass = STATUS_COLORS[medRecord.emergencyStatus] ?? STATUS_COLORS["Registered — No Active Incidents"];

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <DoctorVerificationModal
        open={verifyOpen}
        onClose={() => setVerifyOpen(false)}
        onVerified={handleDoctorVerified}
        action="edit this patient's health record"
      />

      <div className="mb-6">
        <h2 className="text-xl font-bold text-foreground">Patient Account</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Registered profile and medical records. Clinical record edits require a valid Doctor ID.
        </p>
      </div>

      {/* Identity Card */}
      <Card className="mb-4">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <User className="w-4 h-4" /> Identity
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-0 divide-y divide-border/50">
          <div className="flex items-center justify-between py-3">
            <span className="text-sm text-muted-foreground font-medium">Full Name</span>
            <span className="text-sm font-semibold text-foreground">{user.name}</span>
          </div>
          <div className="flex items-center justify-between py-3">
            <span className="text-sm text-muted-foreground font-medium flex items-center gap-2">
              <Phone className="w-3.5 h-3.5 text-primary" /> Phone Number
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-primary border-primary/30">PRIMARY ID</Badge>
            </span>
            <span className="text-sm font-mono font-semibold text-foreground">{user.phone || "—"}</span>
          </div>
          <div className="flex items-center justify-between py-3">
            <span className="text-sm text-muted-foreground font-medium flex items-center gap-2">
              <Mail className="w-3.5 h-3.5" /> Email
              <span className="text-[10px] text-muted-foreground">(backup)</span>
            </span>
            <span className="text-sm text-foreground">{user.email || "—"}</span>
          </div>
          <div className="flex items-center justify-between py-3">
            <span className="text-sm text-muted-foreground font-medium">Role</span>
            <Badge variant="outline" className={`text-xs font-semibold ${roleColor[user.role ?? "Staff"] ?? roleColor["Staff"]}`}>
              {user.role || "Staff"}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Admission Details */}
      <Card className="mb-4">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <BedDouble className="w-4 h-4" /> Admission Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-0 divide-y divide-border/50">
          <div className="flex items-center justify-between py-3">
            <span className="text-sm text-muted-foreground font-medium">Room Number</span>
            <span className="text-sm font-mono font-semibold text-foreground uppercase">{user.roomNumber || "—"}</span>
          </div>
          <div className="flex items-center justify-between py-3">
            <span className="text-sm text-muted-foreground font-medium">Emergency Status</span>
            <Badge variant="outline" className={`text-xs font-semibold ${statusClass}`}>
              {medRecord.emergencyStatus}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Clinical Medical Records */}
      <Card className="mb-4">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <ClipboardList className="w-4 h-4" /> Clinical Medical Records
            </CardTitle>
            {!editMode && (
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs border-primary/40 text-primary hover:bg-primary/10"
                onClick={() => setVerifyOpen(true)}
                data-testid="button-edit-health-record"
              >
                <FileEdit className="w-3.5 h-3.5 mr-1.5" />
                Edit Health Record
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {editMode ? (
            <div className="space-y-4">
              <div className="bg-primary/5 border border-primary/20 rounded-md px-3 py-2 text-xs text-primary flex items-center gap-2">
                <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                Doctor-verified edit in progress. Changes will be saved to the patient record.
              </div>

              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground font-bold">Emergency Status</Label>
                <Select value={editStatus} onValueChange={setEditStatus}>
                  <SelectTrigger className="bg-background/50" data-testid="select-emergency-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.keys(STATUS_COLORS).map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground font-bold">
                  Clinical Notes / Medical Observations
                </Label>
                <Textarea
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="Enter clinical observations, diagnoses, treatment notes, and medical findings..."
                  className="min-h-[140px] resize-none bg-background/50 font-mono text-sm"
                  data-testid="textarea-clinical-notes"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <Button onClick={handleSave} size="sm" className="flex-1" data-testid="button-save-record">
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Save Medical Record
                </Button>
                <Button onClick={handleCancelEdit} size="sm" variant="outline" data-testid="button-cancel-edit">
                  <X className="w-4 h-4 mr-1" />
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div>
              {medRecord.clinicalNotes ? (
                <>
                  <div className="bg-muted/40 rounded-md p-4 text-sm text-foreground whitespace-pre-wrap font-mono leading-relaxed">
                    {medRecord.clinicalNotes}
                  </div>
                  {medRecord.lastUpdated && (
                    <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                      <ShieldCheck className="w-3.5 h-3.5 text-primary" />
                      Last updated:{" "}
                      {new Date(medRecord.lastUpdated).toLocaleString("en-US", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}{" "}
                      · {medRecord.verifiedNote}
                    </div>
                  )}
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-10 text-center border-2 border-dashed border-border rounded-lg">
                  <Stethoscope className="w-10 h-10 text-muted-foreground/40 mb-3" />
                  <p className="text-sm font-semibold text-muted-foreground">No medical observations yet</p>
                  <p className="text-xs text-muted-foreground/70 mt-1">Awaiting medical intake or doctor update</p>
                  <div className="mt-4 flex items-center gap-1.5 text-xs text-muted-foreground/60">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400/60" />
                    Requires a valid Doctor ID to add observations
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Self-reported symptoms (registration only — not clinical) */}
      {user.symptoms && (
        <Card className="border-border/40">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" /> Patient-Reported Symptoms
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-amber-400 border-amber-500/30 ml-auto">
                Self-reported at registration
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-amber-500/5 border border-amber-500/15 rounded-md p-4 text-sm text-foreground/80 whitespace-pre-wrap leading-relaxed italic">
              {user.symptoms}
            </div>
            <p className="text-xs text-muted-foreground/60 mt-3">
              This is patient self-reported data from registration — not a clinical diagnosis. A doctor must review and enter official observations above.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ── Dean Access Panel ─────────────────────────────────────────────────────────
const DEAN_PASSWORD = "apa@07072007";
const DEAN_NAME = "Dr. Amogh P Adhyapak";

interface DeanAlert {
  id: string;
  doctorName: string;
  doctorId: string;
  hospital: string;
  patientName: string;
  commentPreview: string;
  timestamp: string;
}

function getDeanAlerts(): DeanAlert[] {
  try {
    return JSON.parse(localStorage.getItem("sapthagiri_dean_alerts") || "[]") as DeanAlert[];
  } catch { return []; }
}

function DeanPanel() {
  const [unlocked, setUnlocked] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [authError, setAuthError] = useState("");
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [alerts, setAlerts] = useState<DeanAlert[]>([]);
  const [newName, setNewName] = useState("");
  const [newId, setNewId] = useState("");
  const [addError, setAddError] = useState("");

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === DEAN_PASSWORD) {
      setDoctors(getDoctors());
      setAlerts(getDeanAlerts());
      setUnlocked(true);
      setAuthError("");
    } else {
      setAuthError("Incorrect password. Access denied.");
    }
  };

  const handleAddDoctor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newId.trim()) {
      setAddError("Both name and Doctor ID are required.");
      return;
    }
    const alreadyExists = doctors.some(
      (d) => d.doctor_id.toUpperCase() === newId.trim().toUpperCase()
    );
    if (alreadyExists) {
      setAddError("A doctor with this ID already exists.");
      return;
    }
    const updated = [...doctors, { name: newName.trim(), doctor_id: newId.trim().toUpperCase() }];
    saveDoctors(updated);
    setDoctors(updated);
    setNewName("");
    setNewId("");
    setAddError("");
  };

  const handleRemove = (doctor_id: string) => {
    const updated = doctors.filter((d) => d.doctor_id !== doctor_id);
    saveDoctors(updated);
    setDoctors(updated);
  };

  if (!unlocked) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-full max-w-sm">
          <div className="flex flex-col items-center mb-8 text-center">
            <div className="bg-primary/20 p-4 rounded-2xl mb-4">
              <Lock className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-xl font-bold">Dean Access Panel</h2>
            <p className="text-sm text-muted-foreground mt-2">Restricted to authorized medical administration only.</p>
            <p className="text-xs text-primary font-semibold mt-1 uppercase tracking-wider">{DEAN_NAME}</p>
          </div>

          <Card className="border-primary/20">
            <CardContent className="pt-6">
              <form onSubmit={handleUnlock} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="dean-password">Dean Password</Label>
                  <Input
                    id="dean-password"
                    type="password"
                    placeholder="Enter dean password"
                    value={passwordInput}
                    onChange={(e) => { setPasswordInput(e.target.value); setAuthError(""); }}
                    className="font-mono"
                    data-testid="input-dean-password"
                    autoComplete="off"
                  />
                </div>
                {authError && (
                  <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md p-2">
                    {authError}
                  </div>
                )}
                <Button type="submit" className="w-full" data-testid="button-dean-unlock">
                  <Lock className="w-4 h-4 mr-2" />
                  Unlock Panel
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-foreground">Dean Access Panel</h2>
          <p className="text-sm text-muted-foreground mt-1">Manage the doctor registry used for health record verification.</p>
        </div>
        <Badge variant="outline" className="text-primary border-primary/30 bg-primary/10 text-xs font-semibold flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5" />
          {DEAN_NAME}
        </Badge>
      </div>

      {/* Add Doctor */}
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <Plus className="w-4 h-4" /> Register New Doctor
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddDoctor} className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 space-y-1">
              <Label className="text-xs text-muted-foreground">Doctor Name</Label>
              <Input
                placeholder="Dr. Full Name"
                value={newName}
                onChange={(e) => { setNewName(e.target.value); setAddError(""); }}
                className="bg-background/50"
                data-testid="input-new-doctor-name"
              />
            </div>
            <div className="sm:w-36 space-y-1">
              <Label className="text-xs text-muted-foreground">Doctor ID</Label>
              <Input
                placeholder="DOC105"
                value={newId}
                onChange={(e) => { setNewId(e.target.value); setAddError(""); }}
                className="bg-background/50 font-mono uppercase"
                data-testid="input-new-doctor-id"
              />
            </div>
            <div className="sm:self-end">
              <Button type="submit" size="sm" className="w-full sm:w-auto" data-testid="button-add-doctor">
                <Plus className="w-4 h-4 mr-1" />
                Add
              </Button>
            </div>
          </form>
          {addError && (
            <p className="text-sm text-destructive mt-2">{addError}</p>
          )}
        </CardContent>
      </Card>

      {/* Dean Notifications */}
      {alerts.length > 0 && (
        <Card className="mb-6 border-amber-500/30 bg-amber-500/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
              <AlertOctagon className="w-4 h-4" /> Medical Notes Audit Log ({alerts.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border/50 max-h-72 overflow-y-auto">
              {alerts.map((a) => (
                <div key={a.id} className="px-5 py-3 hover:bg-muted/20">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <p className="text-xs font-semibold text-foreground">
                      <span className="text-amber-400">{a.doctorName}</span>
                      {" "}
                      <span className="font-mono text-muted-foreground text-[10px]">({a.doctorId})</span>
                      {" "}added emergency treatment notes
                      {a.patientName ? <> for patient <span className="text-primary">{a.patientName}</span></> : ""}.
                    </p>
                    <span className="text-[10px] font-mono text-muted-foreground shrink-0">
                      {new Date(a.timestamp).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    Source: {a.hospital} · {new Date(a.timestamp).toLocaleDateString("en-IN")}
                  </p>
                  <p className="text-xs font-mono text-muted-foreground/70 mt-1 truncate">"{a.commentPreview}"</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Doctor Registry */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <Stethoscope className="w-4 h-4" /> Doctor Registry ({doctors.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {doctors.length === 0 ? (
            <div className="px-6 py-8 text-center text-muted-foreground text-sm">No doctors registered yet.</div>
          ) : (
            <div className="divide-y divide-border">
              {doctors.map((doctor) => (
                <div
                  key={doctor.doctor_id}
                  className="flex items-center justify-between px-6 py-3 hover:bg-muted/30 transition-colors"
                  data-testid={`doctor-row-${doctor.doctor_id}`}
                >
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-foreground">{doctor.name}</span>
                    <span className="text-xs font-mono text-primary">{doctor.doctor_id}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/20"
                    onClick={() => handleRemove(doctor.doctor_id)}
                    data-testid={`button-remove-doctor-${doctor.doctor_id}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ── Patient Registration Panel ────────────────────────────────────────────────
function PatientRegistrationPanel() {
  const [form, setForm] = useState({ name: "", phone: "", age: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; patientId?: string; name?: string; error?: string } | null>(null);

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setResult(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.phone.trim() || !form.password) {
      setResult({ success: false, error: "Full name, phone number, and password are required." });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/patient/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json() as { success?: boolean; patientId?: string; name?: string; error?: string };
      if (!res.ok || !data.success) {
        setResult({ success: false, error: data.error ?? "Registration failed." });
      } else {
        setResult({ success: true, patientId: data.patientId, name: data.name });
        setForm({ name: "", phone: "", age: "", email: "", password: "" });
      }
    } catch {
      setResult({ success: false, error: "Network error. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-xl mx-auto">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
          <UserPlus className="w-5 h-5 text-primary" /> Patient Registration
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Register a new patient directly from the staff dashboard. Patient credentials are created server-side.
        </p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reg-name">Full Name <span className="text-destructive">*</span></Label>
              <Input id="reg-name" placeholder="e.g. Adarsh Kumar" value={form.name}
                onChange={(e) => handleChange("name", e.target.value)} className="bg-background/50" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reg-phone">Phone Number <span className="text-destructive">*</span></Label>
              <Input id="reg-phone" type="tel" placeholder="+91 98765 43210" value={form.phone}
                onChange={(e) => handleChange("phone", e.target.value)} className="bg-background/50 font-mono" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="reg-age">Age</Label>
                <Input id="reg-age" type="number" placeholder="e.g. 34" value={form.age}
                  onChange={(e) => handleChange("age", e.target.value)} className="bg-background/50" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reg-email">Email <span className="text-muted-foreground text-xs">(optional)</span></Label>
                <Input id="reg-email" type="email" placeholder="patient@email.com" value={form.email}
                  onChange={(e) => handleChange("email", e.target.value)} className="bg-background/50" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="reg-password">Password <span className="text-destructive">*</span></Label>
              <Input id="reg-password" type="password" placeholder="Set a login password for the patient" value={form.password}
                onChange={(e) => handleChange("password", e.target.value)} className="bg-background/50" />
              <p className="text-[10px] text-muted-foreground/60">Patient uses this password to log into the Patient Portal.</p>
            </div>

            {result && (
              result.success ? (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-md">
                  <div className="flex items-center gap-2 text-emerald-300 font-semibold text-sm mb-1">
                    <CheckCircle2 className="w-4 h-4" /> Patient registered successfully!
                  </div>
                  <p className="text-xs text-muted-foreground">Patient ID: <span className="font-mono font-bold text-emerald-300">{result.patientId}</span></p>
                  <p className="text-xs text-muted-foreground">Name: <span className="font-semibold text-foreground">{result.name}</span></p>
                </div>
              ) : (
                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md text-sm text-destructive">
                  {result.error}
                </div>
              )
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Registering…</> : <><UserPlus className="w-4 h-4 mr-2" /> Register Patient</>}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Staff Directory Panel ─────────────────────────────────────────────────────
function StaffDirectoryPanel() {
  const [me, setMe] = useState<{ userId?: string; staffId?: string; name?: string; role?: string; createdAt?: string } | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("sapthagiri_user");
      if (raw) setMe(JSON.parse(raw) as { userId?: string; staffId?: string; name?: string; role?: string; createdAt?: string });
    } catch { /* ignore */ }
  }, []);

  const joinedDate = me?.createdAt
    ? new Date(me.createdAt).toLocaleDateString("en-US", { dateStyle: "medium" })
    : "—";

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
          <IdCard className="w-5 h-5 text-primary" /> Staff Information Directory
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Your registered identity record. Credentials are never displayed.
        </p>
      </div>

      {!me ? (
        <div className="text-center py-16">
          <IdCard className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground font-medium">No session found.</p>
          <p className="text-sm text-muted-foreground/60 mt-1">Please log in to view your staff record.</p>
        </div>
      ) : (
        <Card className="border-primary/20 shadow-[0_0_20px_hsl(180_70%_50%_/_0.06)]">
          <CardContent className="p-6">
            <div className="flex items-start gap-5">
              <div className="w-14 h-14 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-7 h-7 text-primary" />
              </div>
              <div className="flex-1 space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-0.5">Full Name</p>
                  <p className="text-lg font-bold text-foreground">{me.name ?? "—"}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-0.5">Staff / Doctor ID</p>
                    <p className="font-mono text-sm text-primary font-semibold">{me.staffId ?? me.userId ?? "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-0.5">Role</p>
                    <Badge variant="outline" className="text-xs text-muted-foreground border-border/60">{me.role ?? "Staff"}</Badge>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-0.5">Joined Date</p>
                    <p className="text-sm text-foreground">{joinedDate}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-0.5">Account Type</p>
                    <Badge className="text-xs bg-primary/15 text-primary border-primary/30 border">Verified Staff</Badge>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ── Dashboard Main View ───────────────────────────────────────────────────────
function PatientDashboardView() {
  return (
    <div className="p-6 flex flex-col gap-6 max-w-[1600px] mx-auto w-full">
      <section>
        <StatsBar />
      </section>
      <section className="flex-1 flex flex-col bg-card rounded-lg border border-border shadow-md overflow-hidden">
        <div className="px-4 py-3 border-b border-border bg-muted/30 flex items-center justify-between">
          <h2 className="font-bold uppercase tracking-wider text-sm flex items-center">
            <span className="w-2 h-2 bg-primary rounded-full mr-2 animate-pulse" />
            Live Patient Monitoring
          </h2>
          <span className="text-xs font-mono text-muted-foreground uppercase">Auto-refresh: 5s</span>
        </div>
        <div className="p-4 flex-1 overflow-auto bg-background/50 relative">
          <PatientList />
        </div>
      </section>
    </div>
  );
}

// ── AI Full Page ─────────────────────────────────────────────────────────────
function AiFullPage() {
  const queryClient = useQueryClient();
  const [activeConversationId, setActiveConversationId] = useState<number | null>(null);
  const [inputValue, setInputValue] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const [localMessages, setLocalMessages] = useState<Array<{ role: string; content: string }>>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: conversations, isLoading: loadingConvs } = useListGeminiConversations();
  const createConversation = useCreateGeminiConversation();
  const deleteConversation = useDeleteGeminiConversation();
  const { data: activeConversation, isLoading: loadingMsgs } = useGetGeminiConversation(
    activeConversationId as number,
    { query: { enabled: !!activeConversationId, queryKey: getGetGeminiConversationQueryKey(activeConversationId as number) } }
  );

  useEffect(() => {
    if (activeConversation) setLocalMessages(activeConversation.messages.map(m => ({ role: m.role, content: m.content })));
    else setLocalMessages([]);
  }, [activeConversation]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [localMessages, streamingContent]);

  const handleNewChat = () => { setActiveConversationId(null); setLocalMessages([]); setStreamingContent(""); };

  const handleSend = async () => {
    if (!inputValue.trim() || isStreaming) return;
    const msg = inputValue; setInputValue("");
    setLocalMessages(prev => [...prev, { role: "user", content: msg }]);
    setIsStreaming(true); setStreamingContent("");
    let convId = activeConversationId;
    if (!convId) {
      try {
        const newConv = await createConversation.mutateAsync({ data: { title: msg.slice(0, 50) } });
        convId = newConv.id; setActiveConversationId(newConv.id);
        queryClient.invalidateQueries({ queryKey: getListGeminiConversationsQueryKey() });
      } catch { setIsStreaming(false); return; }
    }
    try {
      const res = await fetch(`/api/gemini/conversations/${convId}/messages`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ content: msg }),
      });
      if (!res.ok) throw new Error("Failed");
      const reader = res.body!.getReader(); const dec = new TextDecoder(); let buf = "";
      while (true) {
        const { done, value } = await reader.read(); if (done) break;
        buf += dec.decode(value, { stream: true });
        const lines = buf.split("\n"); buf = lines.pop() ?? "";
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const json = JSON.parse(line.slice(6));
            if (json.content) setStreamingContent(prev => prev + json.content);
            if (json.done) queryClient.invalidateQueries({ queryKey: getGetGeminiConversationQueryKey(convId as number) });
          }
        }
      }
    } catch { /* silent */ } finally { setIsStreaming(false); }
  };

  const inChat = activeConversationId || localMessages.length > 0;

  return (
    <div className="h-full flex">
      {/* Conversation sidebar */}
      <div className="w-56 shrink-0 border-r border-border bg-card flex flex-col">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bot className="w-4 h-4 text-primary animate-pulse" />
            <span className="text-xs font-black uppercase tracking-wider text-primary">AI Health Assistant</span>
          </div>
        </div>
        <div className="px-3 py-2 border-b border-border/50">
          <button
            onClick={handleNewChat}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-xs font-medium bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20 transition-colors"
            data-testid="button-new-chat"
          >
            <Plus className="w-3.5 h-3.5" /> New Consultation
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-2 py-1">Recent Consults</p>
          {loadingConvs ? (
            <div className="flex justify-center py-4"><Loader2 className="w-4 h-4 animate-spin text-muted-foreground" /></div>
          ) : conversations?.length === 0 ? (
            <p className="text-xs text-muted-foreground/50 px-2 py-2 text-center font-mono">No consults yet</p>
          ) : conversations?.map(conv => (
            <button
              key={conv.id}
              onClick={() => setActiveConversationId(conv.id)}
              className={`w-full text-left flex items-center gap-2 px-3 py-2 rounded-md text-xs transition-colors ${
                activeConversationId === conv.id ? "bg-primary/15 text-primary border border-primary/20" : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{conv.title}</span>
            </button>
          ))}
        </div>
        <div className="px-4 py-3 border-t border-border">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-mono text-emerald-500 uppercase">Gemini 2.5 Flash</span>
          </div>
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col bg-[#0a0c10] overflow-hidden">
        {/* Top bar */}
        <div className="px-6 py-3 border-b border-border bg-[#161b22] flex items-center gap-3 shrink-0">
          <div className="bg-primary/20 p-1.5 rounded-md">
            <Bot className="w-4 h-4 text-primary" />
          </div>
          <div>
            <p className="text-sm font-black uppercase tracking-wider text-primary">Sapthagiri AI Healthcare Assistant</p>
            <p className="text-[10px] font-mono text-muted-foreground uppercase">
              {isStreaming ? "⚡ Live Output — Gemini 2.5 Flash" : "Powered by Google Gemini · Healthcare AI"}
            </p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${isStreaming ? "bg-emerald-500 animate-pulse" : "bg-muted-foreground/40"}`} />
            <span className="text-[10px] font-mono text-muted-foreground uppercase">{isStreaming ? "Responding…" : "Ready"}</span>
          </div>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4">
          {!inChat && (
            <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto">
              <div className="relative mb-6">
                <span className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
                <div className="relative w-16 h-16 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center">
                  <Bot className="w-8 h-8 text-primary" />
                </div>
              </div>
              <h2 className="text-xl font-black text-foreground mb-2">AI Healthcare Assistant</h2>
              <p className="text-sm text-muted-foreground mb-6">
                Powered by Gemini 2.5 Flash. Ask about triage protocols, symptoms, medication guidance, or emergency care.
              </p>
              <div className="grid grid-cols-1 gap-2 w-full">
                {[
                  "What are the RED triage criteria for chest pain?",
                  "Patient has SpO₂ 88% and respiratory distress — guidance?",
                  "First aid for suspected cardiac arrest",
                  "Triage a patient with severe allergic reaction",
                ].map(prompt => (
                  <button
                    key={prompt}
                    onClick={() => { setInputValue(prompt); }}
                    className="text-left px-4 py-2.5 rounded-lg border border-border hover:border-primary/40 hover:bg-primary/5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          )}
          {inChat && (
            <>
              <div className="text-center">
                <span className="text-[10px] uppercase font-mono text-muted-foreground border border-border/50 rounded px-2 py-1 bg-muted/20">
                  AI-assisted healthcare guidance · Not a substitute for clinical judgment
                </span>
              </div>
              {loadingMsgs && !localMessages.length ? (
                <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
              ) : localMessages.map((msg, i) => (
                <div key={i} className={`flex flex-col max-w-[75%] ${msg.role === "user" ? "ml-auto items-end" : "mr-auto items-start"}`}>
                  <div className={`px-4 py-3 rounded-xl text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "bg-slate-700 text-slate-100 rounded-tr-sm"
                      : "bg-primary/15 text-foreground border border-primary/20 rounded-tl-sm"
                  }`}>
                    {msg.content}
                  </div>
                  <span className="text-[10px] text-muted-foreground font-mono mt-1">
                    {msg.role === "user" ? "You" : "Gemini AI"}
                  </span>
                </div>
              ))}
              {isStreaming && (
                <div className="flex flex-col max-w-[75%] mr-auto items-start">
                  <div className="px-4 py-3 rounded-xl text-sm leading-relaxed bg-primary/15 text-foreground border border-primary/20 rounded-tl-sm">
                    {streamingContent || <Loader2 className="w-4 h-4 animate-spin inline" />}
                    <span className="inline-block w-1.5 h-3 ml-1 bg-primary animate-pulse align-middle" />
                  </div>
                  <span className="text-[10px] text-muted-foreground font-mono mt-1">Gemini AI</span>
                </div>
              )}
            </>
          )}
        </div>

        {/* Input */}
        <div className="p-4 border-t border-border bg-[#161b22] shrink-0">
          <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex gap-3">
            <Input
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              placeholder="Ask about triage, symptoms, medications, emergency protocols…"
              className="flex-1 bg-[#0a0c10] border-border text-sm focus-visible:ring-primary/50 h-11"
              disabled={isStreaming}
              data-testid="input-chat-message"
            />
            <Button
              type="submit"
              disabled={!inputValue.trim() || isStreaming}
              className="h-11 px-5 bg-primary hover:bg-primary/90 font-bold"
              data-testid="button-send-message"
            >
              {isStreaming ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </Button>
          </form>
          <p className="text-[10px] text-muted-foreground/40 text-center mt-2 font-mono uppercase">
            AI guidance only — always defer to qualified medical personnel
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Root Dashboard Page ───────────────────────────────────────────────────────
export default function Dashboard() {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [, setLocation] = useLocation();
  const [user, setUser] = useState<UserData | null>(null);
  const [activeView, setActiveView] = useState<DashView>("dashboard");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("sapthagiri_user");
    if (stored) {
      try {
        setUser(JSON.parse(stored) as UserData);
      } catch {
        // ignore
      }
    }
    // Session expiry — 30 minutes
    const SESSION_MS = 30 * 60 * 1000;
    const loginTs = Number(localStorage.getItem("sapthagiri_login_ts") || "0");
    if (loginTs && Date.now() - loginTs > SESSION_MS) {
      localStorage.removeItem("sapthagiri_user");
      localStorage.removeItem("sapthagiri_login_ts");
      setLocation("/login");
      return;
    }
    if (!loginTs) localStorage.setItem("sapthagiri_login_ts", String(Date.now()));
    const expiry = setTimeout(() => {
      localStorage.removeItem("sapthagiri_user");
      localStorage.removeItem("sapthagiri_login_ts");
      setLocation("/login");
    }, SESSION_MS - (Date.now() - loginTs));
    return () => clearTimeout(expiry);
  }, [setLocation]);

  const handleLogout = () => {
    localStorage.removeItem("sapthagiri_user");
    localStorage.removeItem("sapthagiri_login_ts");
    setLocation("/");
  };

  return (
    <div className="h-screen bg-background text-foreground flex flex-col font-sans overflow-hidden">
      {/* Header */}
      <header className="border-b border-border bg-card px-4 py-3 flex items-center justify-between shadow-sm shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setLocation("/")}
            title="Back to Home"
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="h-5 w-px bg-border" />
          <div className="bg-red-500/20 p-2 rounded-md">
            <Activity className="w-5 h-5 text-red-500" />
          </div>
          <div>
            <h1 className="text-lg font-black uppercase tracking-widest text-primary leading-tight">
              Sapthagiri Emergency Hub
            </h1>
            <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">
              Sapthagiri Healthcare & Emergency Care — Live Control Room
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {user && (
            <span className="text-sm font-medium text-muted-foreground hidden md:inline-block">
              Welcome, <span className="text-foreground font-semibold">{user.name}</span>
            </span>
          )}
          <Button
            variant="outline"
            size="sm"
            className="border-primary/50 text-primary hover:bg-primary/20 bg-background/50"
            onClick={() => setIsChatOpen(!isChatOpen)}
            data-testid="button-toggle-ai-chat"
          >
            <Bot className="w-4 h-4 mr-2" />
            AI Assistant
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-foreground"
            onClick={handleLogout}
            data-testid="button-logout"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
          <div className="h-6 w-px bg-border" />
          <div className="text-xs font-mono text-muted-foreground text-right leading-tight hidden lg:block">
            <div>{new Date().toLocaleDateString("en-US", { weekday: "short", year: "numeric", month: "short", day: "numeric" })}</div>
            <LiveClock />
          </div>
        </div>
      </header>

      {/* Body: Sidebar + Main */}
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          activeView={activeView}
          onNavigate={setActiveView}
          onOpenChat={() => setIsChatOpen(true)}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(c => !c)}
        />
        <main className="flex-1 overflow-auto">
          {activeView === "dashboard"   && <LiveReportsPanel />}
          {activeView === "observation" && <ObservationQueuePanel />}
          {activeView === "general"     && <GeneralMonitoringPanel />}
          {activeView === "patientreg"  && <PatientRegistrationPanel />}
          {activeView === "folder"      && <PatientsFolderPanel />}
          {activeView === "staffdir"    && <StaffDirectoryPanel />}
          {activeView === "timeline"    && <MedicalTimelinePanel />}
          {activeView === "notes"       && <MedicalNotesPanel />}
          {activeView === "ai"          && <AiFullPage />}
          {activeView === "account"     && <AccountPanel user={user} />}
          {activeView === "dean"        && <DeanPanel />}
        </main>
      </div>

      <AiChatPanel isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
    </div>
  );
}

function LiveClock() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  return <div className="font-bold text-foreground">{time.toLocaleTimeString("en-US", { hour12: false })}</div>;
}
