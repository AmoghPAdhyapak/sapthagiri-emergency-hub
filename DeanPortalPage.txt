import { useState } from "react";
import { useLocation } from "wouter";
import {
  Lock, ShieldCheck, ChevronLeft, ChevronDown, Loader2,
  Plus, Trash2, Users, Stethoscope, AlertOctagon,
} from "lucide-react";
import logoUrl from "@/assets/logo.png";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import defaultDoctors from "@/data/doctors.json";

// ── Constants ─────────────────────────────────────────────────────────────────
const DEAN_PASSWORD = "apa@07072007";
const DEAN_NAME = "Dr. Amogh P Adhyapak";

const ROLE_CATEGORIES = [
  "Doctor",
  "Nurse",
  "Medical Officer",
  "Pharmacist",
  "Receptionist",
  "Lab Technician",
  "Radiologist",
  "Administrative Staff",
  "Emergency Technician",
  "Staff Registration Officer",
];

// ── Types ─────────────────────────────────────────────────────────────────────
interface Doctor {
  name: string;
  doctor_id: string;
}

interface DeanAlert {
  id: string;
  doctorName: string;
  doctorId: string;
  hospital: string;
  patientName: string;
  commentPreview: string;
  timestamp: string;
}

interface StaffMember {
  staffId: string;
  name: string;
  role: string;
  createdAt: string;
  accountStatus: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function getDoctors(): Doctor[] {
  try {
    const stored = localStorage.getItem("sapthagiri_doctors");
    if (stored) return JSON.parse(stored) as Doctor[];
  } catch {
    // fall through
  }
  return defaultDoctors as Doctor[];
}

function saveDoctors(docs: Doctor[]) {
  localStorage.setItem("sapthagiri_doctors", JSON.stringify(docs));
}

function getDeanAlerts(): DeanAlert[] {
  try {
    return JSON.parse(localStorage.getItem("sapthagiri_dean_alerts") || "[]") as DeanAlert[];
  } catch { return []; }
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function DeanPortalPage() {
  const [, setLocation] = useLocation();

  // Auth
  const [unlocked, setUnlocked] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [authError, setAuthError] = useState("");

  // Doctor registry
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [newName, setNewName] = useState("");
  const [newId, setNewId] = useState("");
  const [addError, setAddError] = useState("");

  // Audit log
  const [alerts, setAlerts] = useState<DeanAlert[]>([]);

  // Staff governance
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [staffLoading, setStaffLoading] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Folder accordion
  const [openFolders, setOpenFolders] = useState<Set<string>>(new Set(["Doctor"]));

  // ── Auth ───────────────────────────────────────────────────────────────────
  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === DEAN_PASSWORD) {
      setDoctors(getDoctors());
      setAlerts(getDeanAlerts());
      setUnlocked(true);
      setAuthError("");
      void fetchStaffList();
    } else {
      setAuthError("Incorrect password. Access denied.");
    }
  };

  // ── Staff API ──────────────────────────────────────────────────────────────
  const fetchStaffList = async () => {
    setStaffLoading(true);
    try {
      const res = await fetch("/api/auth/staff/all");
      const data = await res.json() as StaffMember[];
      setStaffList(data);
    } catch { /* ignore */ } finally { setStaffLoading(false); }
  };

  const handleToggleStatus = async (s: StaffMember) => {
    setTogglingId(s.staffId);
    const newStatus = s.accountStatus === "active" ? "inactive" : "active";
    try {
      await fetch(`/api/auth/staff/${s.staffId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      setStaffList((prev) => prev.map((m) => m.staffId === s.staffId ? { ...m, accountStatus: newStatus } : m));
    } catch { /* ignore */ } finally { setTogglingId(null); }
  };

  const handleDeleteAccount = async (staffId: string) => {
    setTogglingId(staffId);
    try {
      await fetch(`/api/auth/staff/${staffId}`, { method: "DELETE" });
      setStaffList((prev) => prev.filter((m) => m.staffId !== staffId));
      setConfirmDeleteId(null);
    } catch { /* ignore */ } finally { setTogglingId(null); }
  };

  // ── Doctor registry ────────────────────────────────────────────────────────
  const handleAddDoctor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newId.trim()) {
      setAddError("Both name and Doctor ID are required.");
      return;
    }
    const alreadyExists = doctors.some((d) => d.doctor_id.toUpperCase() === newId.trim().toUpperCase());
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

  const handleRemoveDoctor = (doctor_id: string) => {
    const updated = doctors.filter((d) => d.doctor_id !== doctor_id);
    saveDoctors(updated);
    setDoctors(updated);
  };

  // ── Folder toggle ──────────────────────────────────────────────────────────
  const toggleFolder = (category: string) => {
    setOpenFolders((prev) => {
      const next = new Set(prev);
      if (next.has(category)) next.delete(category);
      else next.add(category);
      return next;
    });
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Locked screen
  // ─────────────────────────────────────────────────────────────────────────
  if (!unlocked) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-amber-500/8 via-background to-background pointer-events-none" />

        <button
          onClick={() => setLocation("/")}
          className="absolute top-4 left-4 z-20 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/50 border border-border/40 hover:border-border transition-all"
        >
          <ChevronLeft className="w-3.5 h-3.5" /> Back to Home
        </button>

        <div className="w-full max-w-sm relative z-10">
          <div className="flex flex-col items-center mb-8 text-center">
            <img src={logoUrl} alt="Sapthagiri NPS University" className="h-20 w-20 object-contain mb-3" />
            <h1 className="text-2xl font-bold tracking-tight">Sapthagiri NPS University</h1>
            <p className="text-xs text-muted-foreground uppercase tracking-widest mt-1">Institute of Medical Sciences</p>
            <p className="text-xs text-amber-400/80 font-semibold uppercase tracking-wider mt-0.5">Dean Access Portal</p>
          </div>

          <div className="flex flex-col items-center mb-6">
            <div className="bg-amber-500/15 p-4 rounded-2xl mb-3 border border-amber-500/20">
              <Lock className="w-8 h-8 text-amber-400" />
            </div>
            <p className="text-sm text-muted-foreground text-center">Restricted to authorized medical administration.</p>
            <p className="text-xs text-amber-400 font-semibold mt-1 uppercase tracking-wider">{DEAN_NAME}</p>
          </div>

          <Card className="border-amber-500/20 bg-card/80 backdrop-blur-sm shadow-[0_0_30px_hsl(45_90%_50%_/_0.08)]">
            <CardContent className="pt-6">
              <form onSubmit={handleUnlock} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="dean-password">Dean Password</Label>
                  <div className="flex items-center gap-2 bg-background/50 border border-input rounded-md focus-within:ring-1 focus-within:ring-ring">
                    <input
                      id="dean-password"
                      type={showPass ? "text" : "password"}
                      placeholder="Enter dean password"
                      value={passwordInput}
                      onChange={(e) => { setPasswordInput(e.target.value); setAuthError(""); }}
                      className="flex-1 bg-transparent px-3 py-2 text-sm outline-none font-mono"
                      data-testid="input-dean-password"
                      autoComplete="off"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass((v) => !v)}
                      className="px-3 text-[10px] font-mono font-bold text-muted-foreground hover:text-primary transition-colors shrink-0"
                    >
                      {showPass ? "HIDE" : "SHOW"}
                    </button>
                  </div>
                </div>
                {authError && (
                  <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md p-2">
                    {authError}
                  </div>
                )}
                <Button type="submit" className="w-full" data-testid="button-dean-unlock">
                  <Lock className="w-4 h-4 mr-2" /> Unlock Dean Portal
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Authenticated: full Dean portal
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border bg-card px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <img src={logoUrl} alt="Logo" className="h-8 w-8 object-contain" />
          <div>
            <p className="text-sm font-bold text-foreground">Dean Administration Portal</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Sapthagiri NPS University</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="text-amber-400 border-amber-500/30 bg-amber-500/10 text-xs font-semibold flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5" /> {DEAN_NAME}
          </Badge>
          <button
            onClick={() => setLocation("/")}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors border border-border/40 hover:border-border rounded-md px-3 py-1.5"
          >
            <ChevronLeft className="w-3.5 h-3.5" /> Home
          </button>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8">

        {/* ── Medical Notes Audit Log ────────────────────────────────────── */}
        {alerts.length > 0 && (
          <Card className="border-amber-500/30 bg-amber-500/5">
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
                        <span className="text-amber-400">{a.doctorName}</span>{" "}
                        <span className="font-mono text-muted-foreground text-[10px]">({a.doctorId})</span>{" "}
                        added emergency treatment notes
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

        {/* ── Doctor Assignment Registry ─────────────────────────────────── */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <Stethoscope className="w-4 h-4" /> Doctor Assignment Registry ({doctors.length})
            </CardTitle>
            <p className="text-xs text-muted-foreground">Doctors listed here can be assigned to patients during triage.</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddDoctor} className="flex flex-col sm:flex-row gap-3 mb-4">
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
                  onChange={(e) => { setNewId(e.target.value.toUpperCase()); setAddError(""); }}
                  className="bg-background/50 font-mono uppercase"
                  data-testid="input-new-doctor-id"
                />
              </div>
              <div className="sm:self-end">
                <Button type="submit" size="sm" className="w-full sm:w-auto" data-testid="button-add-doctor">
                  <Plus className="w-4 h-4 mr-1" /> Add
                </Button>
              </div>
            </form>
            {addError && <p className="text-sm text-destructive mb-3">{addError}</p>}
            {doctors.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No doctors in the registry yet.</p>
            ) : (
              <div className="divide-y divide-border rounded-md border border-border/50 overflow-hidden">
                {doctors.map((doc) => (
                  <div
                    key={doc.doctor_id}
                    className="flex items-center justify-between px-4 py-2.5 hover:bg-muted/20"
                    data-testid={`doctor-row-${doc.doctor_id}`}
                  >
                    <div>
                      <span className="text-sm font-semibold text-foreground">{doc.name}</span>
                      <span className="text-xs font-mono text-primary ml-3">{doc.doctor_id}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      onClick={() => handleRemoveDoctor(doc.doctor_id)}
                      data-testid={`button-remove-doctor-${doc.doctor_id}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── Staff Governance Folders ───────────────────────────────────── */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Users className="w-5 h-5 text-amber-400" />
              Staff Governance
              <span className="text-xs font-normal text-muted-foreground ml-1">({staffList.length} accounts)</span>
            </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={fetchStaffList}
              disabled={staffLoading}
              className="h-7 text-xs text-muted-foreground hover:text-foreground"
            >
              {staffLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : "Refresh"}
            </Button>
          </div>

          {staffLoading && staffList.length === 0 ? (
            <div className="flex items-center justify-center py-16 text-muted-foreground text-sm gap-2">
              <Loader2 className="w-4 h-4 animate-spin" /> Loading staff registry…
            </div>
          ) : (
            <div className="space-y-2">
              {ROLE_CATEGORIES.map((category) => {
                const members = staffList.filter((s) => s.role === category);
                const isOpen = openFolders.has(category);
                const isSRO = category === "Staff Registration Officer";
                return (
                  <Card
                    key={category}
                    className={`overflow-hidden border ${isSRO ? "border-amber-500/30" : "border-border/60"}`}
                  >
                    <button
                      type="button"
                      onClick={() => toggleFolder(category)}
                      className={`w-full flex items-center justify-between px-5 py-3 hover:bg-muted/20 transition-colors text-left ${isSRO ? "bg-amber-500/5" : ""}`}
                    >
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-semibold ${isSRO ? "text-amber-400" : "text-foreground"}`}>
                          {isSRO ? "Staff Registration" : category}
                        </span>
                        {members.length > 0 && (
                          <span className="text-[10px] font-mono font-bold bg-muted/60 text-muted-foreground px-1.5 py-0.5 rounded">
                            {members.length}
                          </span>
                        )}
                      </div>
                      <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`} />
                    </button>

                    {isOpen && (
                      <div className="border-t border-border/50">
                        {members.length === 0 ? (
                          <p className="text-xs text-muted-foreground text-center py-5">
                            No {isSRO ? "Staff Registration Officer" : category.toLowerCase()} accounts registered.
                          </p>
                        ) : (
                          <div className="divide-y divide-border/40">
                            {members.map((s) => (
                              <div
                                key={s.staffId}
                                className={`flex items-center justify-between px-5 py-3 hover:bg-muted/10 transition-colors ${s.accountStatus === "inactive" ? "opacity-60" : ""}`}
                              >
                                <div>
                                  <p className="text-sm font-semibold text-foreground">{s.name}</p>
                                  <p className="text-xs font-mono text-primary">{s.staffId}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${
                                    s.accountStatus === "active"
                                      ? "text-emerald-400 border-emerald-500/30 bg-emerald-500/10"
                                      : "text-slate-400 border-slate-600 bg-slate-800/50"
                                  }`}>
                                    {s.accountStatus}
                                  </span>
                                  {confirmDeleteId === s.staffId ? (
                                    <div className="flex items-center gap-1">
                                      <span className="text-[10px] text-destructive font-semibold">Delete?</span>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        disabled={togglingId === s.staffId}
                                        className="h-6 text-[10px] text-destructive hover:bg-destructive/15"
                                        onClick={() => void handleDeleteAccount(s.staffId)}
                                      >
                                        {togglingId === s.staffId ? <Loader2 className="w-3 h-3 animate-spin" /> : "Yes"}
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 text-[10px] text-muted-foreground"
                                        onClick={() => setConfirmDeleteId(null)}
                                      >
                                        No
                                      </Button>
                                    </div>
                                  ) : (
                                    <>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        disabled={togglingId === s.staffId}
                                        className={`h-7 text-xs ${s.accountStatus === "active" ? "text-destructive/80 hover:text-destructive hover:bg-destructive/10" : "text-emerald-400 hover:bg-emerald-500/10"}`}
                                        onClick={() => void handleToggleStatus(s)}
                                      >
                                        {togglingId === s.staffId
                                          ? <Loader2 className="w-3 h-3 animate-spin" />
                                          : s.accountStatus === "active" ? "Deactivate" : "Activate"}
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-7 w-7 p-0 text-destructive/40 hover:text-destructive hover:bg-destructive/10"
                                        onClick={() => setConfirmDeleteId(s.staffId)}
                                        title="Permanently delete credentials"
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </Button>
                                    </>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
