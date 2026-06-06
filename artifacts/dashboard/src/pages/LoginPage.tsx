import { useState } from "react";
import { Link, useLocation } from "wouter";
import { LogIn, ArrowRight, Phone, IdCard, UserPlus, Loader2, User } from "lucide-react";
import logoUrl from "@/assets/logo.png";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/App";

type PortalTab = "patient" | "staff";
type PatientLoginMode = "PHONE_OTP" | "NAME_PASSWORD";

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const { login } = useAuth();
  const [tab, setTab] = useState<PortalTab>("patient");
  const [patLoginMode, setPatLoginMode] = useState<PatientLoginMode>("PHONE_OTP");

  const [patIdentifier, setPatIdentifier] = useState("");
  const [patPassword, setPatPassword] = useState("");
  const [showPatPass, setShowPatPass] = useState(false);
  const [patError, setPatError] = useState("");
  const [patLoading, setPatLoading] = useState(false);

  const [staffId, setStaffId] = useState("");
  const [staffPassword, setStaffPassword] = useState("");
  const [showStaffPass, setShowStaffPass] = useState(false);
  const [staffError, setStaffError] = useState("");
  const [staffLoading, setStaffLoading] = useState(false);

  const normPhone = (p: string) => {
    const d = p.replace(/\D/g, "");
    if (d.length === 12 && d.startsWith("91")) return d.slice(2);
    if (d.length === 11 && d.startsWith("0")) return d.slice(1);
    return d;
  };

  const cachedProfileMatches = (cached: { phone?: string; name?: string }) => {
    if (patLoginMode === "PHONE_OTP")
      return normPhone(cached.phone ?? "") === normPhone(patIdentifier);
    return cached.name?.toLowerCase().trim() === patIdentifier.toLowerCase().trim();
  };

  const handlePatientLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setPatError("");
    if (!patIdentifier.trim()) {
      setPatError(patLoginMode === "PHONE_OTP" ? "Phone number is required." : "Full name is required.");
      return;
    }
    if (!patPassword) { setPatError("Password is required."); return; }
    setPatLoading(true);
    try {
      const body =
        patLoginMode === "PHONE_OTP"
          ? { phone: patIdentifier.trim(), password: patPassword, loginType: "PHONE_OTP" }
          : { name: patIdentifier.trim(), password: patPassword, loginType: "NAME_PASSWORD" };

      const res = await fetch("/api/auth/patient/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json() as {
        error?: string;
        user?: { name: string; patientId: string; phone: string; email: string; age: string; allergies?: string[] };
      };

      if (!res.ok) {
        // Account not in backend — attempt to re-register from cached localStorage profile
        if (data.error?.includes("No patient account found")) {
          try {
            const stored = localStorage.getItem("sapthagiri_user");
            if (stored) {
              const cached = JSON.parse(stored) as {
                name?: string; phone?: string; age?: string;
                email?: string; patientId?: string; role?: string; allergies?: string[];
              };
              if (cached.role === "patient" && cachedProfileMatches(cached)) {
                const regRes = await fetch("/api/auth/patient/register", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    name: cached.name ?? patIdentifier.trim(),
                    phone: cached.phone ?? (patLoginMode === "PHONE_OTP" ? patIdentifier.trim() : ""),
                    age: cached.age ?? "",
                    email: cached.email ?? "",
                    password: patPassword,
                    allergies: cached.allergies ?? [],
                  }),
                });
                if (regRes.ok) {
                  const regData = await regRes.json() as { patientId?: string; name?: string; user?: { patientId?: string; name?: string; phone?: string } };
                  const refreshed = {
                    ...cached,
                    patientId: regData.patientId ?? regData.user?.patientId ?? cached.patientId,
                    role: "patient" as const,
                  };
                  login(refreshed);
                  setLocation("/patient");
                  return;
                }
              }
            }
          } catch { /* fall through to error */ }
        }
        setPatError(data.error ?? "Login failed.");
        return;
      }

      // Successful login — update auth context (also writes localStorage)
      login({ ...data.user, role: "patient" });
      setLocation("/patient");
    } catch {
      // Network error fallback — try to use cached profile if it matches
      try {
        const stored = localStorage.getItem("sapthagiri_user");
        if (stored) {
          const u = JSON.parse(stored) as { phone?: string; name?: string; role?: string };
          if (u.role === "patient" && cachedProfileMatches(u)) {
            login(u as Parameters<typeof login>[0]);
            setLocation("/patient");
            return;
          }
        }
      } catch { /* ignore */ }
      setPatError("Network error. Please try again.");
    } finally {
      setPatLoading(false);
    }
  };

  const handleStaffLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setStaffError("");
    if (!staffId || !staffPassword) { setStaffError("Staff ID and password are required."); return; }
    setStaffLoading(true);
    try {
      const res = await fetch("/api/auth/staff/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ staffId: staffId.trim(), password: staffPassword }),
      });
      const data = await res.json() as { error?: string; user?: { name: string; staffId: string; role?: string; createdAt?: string } };
      if (!res.ok) {
        setStaffError(data.error ?? "Login failed.");
        setStaffLoading(false);
        return;
      }
      login({ ...data.user, role: data.user?.role ?? "staff" });
      setLocation("/dashboard");
    } catch {
      setStaffError("Network error. Please try again.");
    } finally {
      setStaffLoading(false);
    }
  };

  const handleGuestLogin = () => {
    login({ name: "Guest Staff", staffId: "GUEST", role: "staff" });
    setLocation("/dashboard");
  };

  const switchPatLoginMode = (mode: PatientLoginMode) => {
    setPatLoginMode(mode);
    setPatIdentifier("");
    setPatError("");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/10 via-background to-background pointer-events-none" />

      <button
        onClick={() => setLocation("/")}
        className="absolute top-4 left-4 z-20 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/50 border border-border/40 hover:border-border transition-all"
      >
        <ArrowRight className="w-3.5 h-3.5 rotate-180" />
        Back
      </button>

      <div className="w-full max-w-md relative z-10">
        <div className="flex flex-col items-center mb-8 text-center">
          <img src={logoUrl} alt="Sapthagiri NPS University" className="h-20 w-20 object-contain mb-3" />
          <h1 className="text-2xl font-bold tracking-tight">Sapthagiri NPS University</h1>
          <p className="text-xs text-muted-foreground uppercase tracking-widest mt-1">Institute of Medical Sciences &amp; Research Center</p>
        </div>

        <div className="flex rounded-xl bg-muted/40 p-1 mb-6 border border-border/50">
          <button
            onClick={() => setTab("patient")}
            className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${
              tab === "patient"
                ? "bg-blue-500/20 text-blue-300 border border-blue-500/30 shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Patient Portal
          </button>
          <button
            onClick={() => setTab("staff")}
            className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${
              tab === "staff"
                ? "bg-primary/20 text-primary border border-primary/30 shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Staff Portal
          </button>
        </div>

        {/* ── Patient Login ── */}
        {tab === "patient" && (
          <Card className="border-blue-500/20 shadow-[0_0_30px_hsl(220_70%_50%_/_0.08)] bg-card/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-blue-400" />
                Patient Login
              </CardTitle>
              <CardDescription>Sign in to view your health records and visit status.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex rounded-lg bg-muted/40 p-0.5 mb-4 border border-border/40">
                <button
                  onClick={() => switchPatLoginMode("PHONE_OTP")}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center justify-center gap-1.5 ${
                    patLoginMode === "PHONE_OTP"
                      ? "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Phone className="w-3 h-3" /> Phone Number
                </button>
                <button
                  onClick={() => switchPatLoginMode("NAME_PASSWORD")}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center justify-center gap-1.5 ${
                    patLoginMode === "NAME_PASSWORD"
                      ? "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <User className="w-3 h-3" /> Full Name
                </button>
              </div>

              <form onSubmit={handlePatientLogin} className="space-y-4">
                {patLoginMode === "PHONE_OTP" ? (
                  <div className="space-y-2">
                    <Label htmlFor="pat-phone" className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-blue-400" />
                      Phone Number <span className="text-blue-400 text-xs font-bold ml-1">PRIMARY ID</span>
                    </Label>
                    <Input
                      id="pat-phone"
                      type="tel"
                      placeholder="+91 98765 43210"
                      value={patIdentifier}
                      onChange={(e) => setPatIdentifier(e.target.value)}
                      className="bg-background/50 font-mono"
                      data-testid="input-phone"
                      autoComplete="tel"
                    />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label htmlFor="pat-name" className="flex items-center gap-2">
                      <User className="w-3.5 h-3.5 text-blue-400" />
                      Full Name <span className="text-blue-400 text-xs font-bold ml-1">ALTERNATE ID</span>
                    </Label>
                    <Input
                      id="pat-name"
                      type="text"
                      placeholder="e.g. Adarsh Kumar"
                      value={patIdentifier}
                      onChange={(e) => setPatIdentifier(e.target.value)}
                      className="bg-background/50"
                      data-testid="input-name"
                      autoComplete="name"
                    />
                    <p className="text-[10px] text-muted-foreground/60">For patients in rural areas without phone access.</p>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="pat-password">Password</Label>
                  <div className="relative flex items-center bg-background/50 border border-input rounded-md focus-within:ring-1 focus-within:ring-ring">
                    <input
                      id="pat-password"
                      type={showPatPass ? "text" : "password"}
                      placeholder="••••••••"
                      value={patPassword}
                      onChange={(e) => setPatPassword(e.target.value)}
                      className="flex-1 bg-transparent px-3 py-2 text-sm outline-none font-mono"
                      data-testid="input-password"
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPatPass(!showPatPass)}
                      className="px-3 text-[10px] font-mono font-bold text-muted-foreground hover:text-primary transition-colors select-none shrink-0"
                      tabIndex={-1}
                    >
                      {showPatPass ? "HIDE" : "SHOW"}
                    </button>
                  </div>
                </div>

                {patError && (
                  <p className="text-sm text-destructive font-medium p-2 bg-destructive/10 border border-destructive/20 rounded-md">
                    {patError}
                  </p>
                )}
                <Button type="submit" className="w-full mt-2 bg-blue-600 hover:bg-blue-500 text-white" disabled={patLoading} data-testid="button-login">
                  {patLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Signing in…</> : <><LogIn className="w-4 h-4 mr-2" /> Sign In</>}
                </Button>
              </form>
            </CardContent>
            <CardFooter className="flex justify-center border-t border-border/50 pt-6 pb-6">
              <p className="text-sm text-muted-foreground">
                New patient?{" "}
                <Link href="/signup" className="text-blue-400 hover:underline font-medium">Register here</Link>
              </p>
            </CardFooter>
          </Card>
        )}

        {/* ── Staff Login ── */}
        {tab === "staff" && (
          <Card className="border-primary/20 shadow-[0_0_30px_hsl(180_70%_50%_/_0.1)] bg-card/80 backdrop-blur-sm glow-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IdCard className="w-4 h-4 text-primary" />
                Staff Login
              </CardTitle>
              <CardDescription>Access the Emergency Medical Operations Control Room.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleStaffLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="staff-id" className="flex items-center gap-2">
                    <IdCard className="w-3.5 h-3.5 text-primary" />
                    Staff ID <span className="text-primary text-xs font-bold ml-1">PRIMARY ID</span>
                  </Label>
                  <Input
                    id="staff-id"
                    placeholder="DOC101"
                    value={staffId}
                    onChange={(e) => setStaffId(e.target.value.toUpperCase())}
                    className="bg-background/50 font-mono uppercase"
                    data-testid="input-staff-id"
                    autoComplete="username"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="staff-password">Password</Label>
                  <div className="relative flex items-center bg-background/50 border border-input rounded-md focus-within:ring-1 focus-within:ring-ring">
                    <input
                      id="staff-password"
                      type={showStaffPass ? "text" : "password"}
                      placeholder="••••••••"
                      value={staffPassword}
                      onChange={(e) => setStaffPassword(e.target.value)}
                      className="flex-1 bg-transparent px-3 py-2 text-sm outline-none font-mono"
                      data-testid="input-password"
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowStaffPass(!showStaffPass)}
                      className="px-3 text-[10px] font-mono font-bold text-muted-foreground hover:text-primary transition-colors select-none shrink-0"
                      tabIndex={-1}
                    >
                      {showStaffPass ? "HIDE" : "SHOW"}
                    </button>
                  </div>
                </div>
                {staffError && (
                  <p className="text-sm text-destructive font-medium p-2 bg-destructive/10 border border-destructive/20 rounded-md">
                    {staffError}
                  </p>
                )}
                <Button type="submit" className="w-full mt-2" disabled={staffLoading} data-testid="button-login">
                  {staffLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Signing in…</> : <><LogIn className="w-4 h-4 mr-2" /> Login Securely</>}
                </Button>
              </form>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border" /></div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">Or bypass</span>
                </div>
              </div>

              <Button variant="secondary" className="w-full" onClick={handleGuestLogin} data-testid="button-guest-login">
                Continue as Guest Staff
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
            <CardFooter className="flex flex-col gap-1.5 border-t border-border/50 pt-6 pb-6 text-center">
              <p className="text-sm text-muted-foreground">
                New staff member?{" "}
                <Link href="/staff/signup" className="text-primary hover:underline font-medium flex-inline items-center gap-1">
                  <UserPlus className="w-3 h-3 inline mr-0.5" />Create account
                </Link>
              </p>
            </CardFooter>
          </Card>
        )}
      </div>
    </div>
  );
}
