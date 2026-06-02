import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { StatsBar } from "@/components/StatsBar";
import { AdmitPatientForm } from "@/components/AdmitPatientForm";
import { PatientList } from "@/components/PatientList";
import {
  Activity,
  Bot,
  LogOut,
  LayoutDashboard,
  User,
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
} from "lucide-react";
import { AiChatPanel } from "@/components/AiChatPanel";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import defaultDoctors from "@/data/doctors.json";

type DashView = "dashboard" | "account" | "dean";

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

// ── Sidebar ──────────────────────────────────────────────────────────────────
function Sidebar({
  activeView,
  onNavigate,
}: {
  activeView: DashView;
  onNavigate: (v: DashView) => void;
}) {
  const navItems: { view: DashView; icon: React.ReactNode; label: string }[] = [
    { view: "dashboard", icon: <LayoutDashboard className="w-4 h-4" />, label: "Emergency Hub" },
    { view: "account", icon: <User className="w-4 h-4" />, label: "My Account" },
    { view: "dean", icon: <Settings className="w-4 h-4" />, label: "Dean Access" },
  ];

  return (
    <aside className="w-56 shrink-0 border-r border-border bg-card flex flex-col py-4 overflow-y-auto">
      <div className="px-4 mb-6">
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Navigation</p>
      </div>
      <nav className="flex flex-col gap-1 px-2 flex-1">
        {navItems.map(({ view, icon, label }) => (
          <button
            key={view}
            onClick={() => onNavigate(view)}
            data-testid={`nav-${view}`}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors text-left ${
              activeView === view
                ? "bg-primary/15 text-primary border border-primary/20"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            }`}
          >
            {icon}
            {label}
          </button>
        ))}
      </nav>
      <div className="px-4 mt-4 pt-4 border-t border-border">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[10px] font-mono text-emerald-500 uppercase tracking-wider">System Live</span>
        </div>
      </div>
    </aside>
  );
}

// ── Account Panel ─────────────────────────────────────────────────────────────
function AccountPanel({ user }: { user: UserData | null }) {
  if (!user) {
    return (
      <div className="p-8 text-center text-muted-foreground">No account data found. Please log in.</div>
    );
  }

  const roleColor: Record<string, string> = {
    Patient: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    Doctor: "bg-primary/20 text-primary border-primary/30",
    Nurse: "bg-purple-500/20 text-purple-400 border-purple-500/30",
    Admin: "bg-orange-500/20 text-orange-400 border-orange-500/30",
    Staff: "bg-gray-500/20 text-gray-400 border-gray-500/30",
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-foreground">Patient / Staff Account</h2>
        <p className="text-sm text-muted-foreground mt-1">Registered profile information. Critical health record edits require doctor approval.</p>
      </div>

      <Card className="mb-4">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <User className="w-4 h-4" /> Identity
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between py-2 border-b border-border/50">
            <span className="text-sm text-muted-foreground font-medium">Full Name</span>
            <span className="text-sm font-semibold text-foreground">{user.name}</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-border/50">
            <span className="text-sm text-muted-foreground font-medium flex items-center gap-2">
              <Phone className="w-3.5 h-3.5 text-primary" /> Phone Number
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-primary border-primary/30">PRIMARY ID</Badge>
            </span>
            <span className="text-sm font-mono font-semibold text-foreground">{user.phone || "—"}</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-border/50">
            <span className="text-sm text-muted-foreground font-medium flex items-center gap-2">
              <Mail className="w-3.5 h-3.5" /> Email
              <span className="text-[10px] text-muted-foreground">(backup)</span>
            </span>
            <span className="text-sm text-foreground">{user.email || "—"}</span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-sm text-muted-foreground font-medium">Role</span>
            <Badge
              variant="outline"
              className={`text-xs font-semibold ${roleColor[user.role ?? "Staff"] ?? roleColor["Staff"]}`}
            >
              {user.role || "Staff"}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-4">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <BedDouble className="w-4 h-4" /> Admission Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between py-2 border-b border-border/50">
            <span className="text-sm text-muted-foreground font-medium">Room Number</span>
            <span className="text-sm font-mono font-semibold text-foreground uppercase">{user.roomNumber || "—"}</span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-sm text-muted-foreground font-medium">Emergency Status</span>
            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-xs">
              Registered & Monitoring
            </Badge>
          </div>
        </CardContent>
      </Card>

      {user.symptoms && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <Stethoscope className="w-4 h-4" /> Health Observations
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-amber-400 border-amber-500/30 ml-auto flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> Edits require Doctor approval
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-muted/40 rounded-md p-4 text-sm text-foreground whitespace-pre-wrap font-mono leading-relaxed">
              {user.symptoms}
            </div>
            <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              Modifying health records requires a valid Doctor ID. Contact your attending physician.
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ── Dean Access Panel ─────────────────────────────────────────────────────────
const DEAN_PASSWORD = "apa@07072007";
const DEAN_NAME = "Dr. Amogh P Adhyapak";

function DeanPanel() {
  const [unlocked, setUnlocked] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [authError, setAuthError] = useState("");
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [newName, setNewName] = useState("");
  const [newId, setNewId] = useState("");
  const [addError, setAddError] = useState("");

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === DEAN_PASSWORD) {
      setDoctors(getDoctors());
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

// ── Dashboard Main View ───────────────────────────────────────────────────────
function PatientDashboardView() {
  return (
    <div className="p-6 flex flex-col gap-6 max-w-[1600px] mx-auto w-full">
      <section>
        <StatsBar />
      </section>
      <section className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        <div className="lg:col-span-1">
          <AdmitPatientForm />
        </div>
        <div className="lg:col-span-3 flex flex-col bg-card rounded-lg border border-border shadow-md overflow-hidden">
          <div className="px-4 py-3 border-b border-border bg-muted/30 flex items-center justify-between">
            <h2 className="font-bold uppercase tracking-wider text-sm flex items-center">
              <span className="w-2 h-2 bg-primary rounded-full mr-2" />
              Live Patient Monitoring
            </h2>
            <span className="text-xs font-mono text-muted-foreground uppercase">Auto-refresh: 5s</span>
          </div>
          <div className="p-4 flex-1 overflow-auto bg-background/50 relative">
            <PatientList />
          </div>
        </div>
      </section>
    </div>
  );
}

// ── Root Dashboard Page ───────────────────────────────────────────────────────
export default function Dashboard() {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [, setLocation] = useLocation();
  const [user, setUser] = useState<UserData | null>(null);
  const [activeView, setActiveView] = useState<DashView>("dashboard");

  useEffect(() => {
    const stored = localStorage.getItem("sapthagiri_user");
    if (stored) {
      try {
        setUser(JSON.parse(stored) as UserData);
      } catch {
        // ignore
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("sapthagiri_user");
    setLocation("/");
  };

  return (
    <div className="h-screen bg-background text-foreground flex flex-col font-sans overflow-hidden">
      {/* Header */}
      <header className="border-b border-border bg-card px-6 py-3 flex items-center justify-between shadow-sm shrink-0">
        <div className="flex items-center gap-3">
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
        <Sidebar activeView={activeView} onNavigate={setActiveView} />
        <main className="flex-1 overflow-auto">
          {activeView === "dashboard" && <PatientDashboardView />}
          {activeView === "account" && <AccountPanel user={user} />}
          {activeView === "dean" && <DeanPanel />}
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
