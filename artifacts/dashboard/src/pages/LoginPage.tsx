import { useState } from "react";
import { Link, useLocation } from "wouter";
import { LogIn, ArrowRight, Phone, IdCard, UserPlus, Loader2 } from "lucide-react";
import logoUrl from "@/assets/logo.png";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

type PortalTab = "patient" | "staff";

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const [tab, setTab] = useState<PortalTab>("patient");

  // Patient login
  const [patPhone, setPatPhone] = useState("");
  const [patPassword, setPatPassword] = useState("");
  const [patError, setPatError] = useState("");
  const [patLoading, setPatLoading] = useState(false);

  // Staff login
  const [staffId, setStaffId] = useState("");
  const [staffPassword, setStaffPassword] = useState("");
  const [staffError, setStaffError] = useState("");
  const [staffLoading, setStaffLoading] = useState(false);

  const handlePatientLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setPatError("");
    if (!patPhone || !patPassword) { setPatError("Phone number and password are required."); return; }
    setPatLoading(true);
    try {
      const res = await fetch("/api/auth/patient/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: patPhone.trim(), password: patPassword }),
      });
      const data = await res.json() as { error?: string; user?: { name: string; patientId: string; phone: string; email: string; age: string } };
      if (!res.ok) {
        setPatError(data.error ?? "Login failed.");
        return;
      }
      localStorage.setItem("sapthagiri_user", JSON.stringify({ ...data.user, role: "patient" }));
      localStorage.setItem("sapthagiri_login_ts", String(Date.now()));
      setLocation("/patient");
    } catch {
      // Fallback: check localStorage if backend is down
      try {
        const stored = localStorage.getItem("sapthagiri_user");
        if (stored) {
          const u = JSON.parse(stored) as { phone?: string; password?: string };
          if (u.phone?.replace(/\D/g, "") === patPhone.replace(/\D/g, "")) {
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
      const data = await res.json() as { error?: string; user?: { name: string; staffId: string } };
      if (!res.ok) {
        setStaffError(data.error ?? "Login failed.");
        setStaffLoading(false);
        return;
      }
      localStorage.setItem("sapthagiri_user", JSON.stringify({ ...data.user, role: "staff" }));
      localStorage.setItem("sapthagiri_login_ts", String(Date.now()));
      setLocation("/dashboard");
    } catch {
      setStaffError("Network error. Please try again.");
    } finally {
      setStaffLoading(false);
    }
  };

  const handleGuestLogin = () => {
    localStorage.setItem("sapthagiri_user", JSON.stringify({ name: "Guest Staff", staffId: "GUEST", role: "staff" }));
    localStorage.setItem("sapthagiri_login_ts", String(Date.now()));
    setLocation("/dashboard");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/10 via-background to-background pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        <div className="flex flex-col items-center mb-8 text-center">
          <img src={logoUrl} alt="Sapthagiri NPS University" className="h-20 w-20 object-contain mb-3" />
          <h1 className="text-2xl font-bold tracking-tight">Sapthagiri NPS University</h1>
          <p className="text-xs text-muted-foreground uppercase tracking-widest mt-1">Institute of Medical Sciences &amp; Research Center</p>
        </div>

        {/* Portal tabs */}
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
              <form onSubmit={handlePatientLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="pat-phone" className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-blue-400" />
                    Phone Number <span className="text-blue-400 text-xs font-bold ml-1">PRIMARY ID</span>
                  </Label>
                  <Input
                    id="pat-phone"
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={patPhone}
                    onChange={(e) => setPatPhone(e.target.value)}
                    className="bg-background/50 font-mono"
                    data-testid="input-phone"
                    autoComplete="tel"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pat-password">Password</Label>
                  <Input
                    id="pat-password"
                    type="password"
                    placeholder="••••••••"
                    value={patPassword}
                    onChange={(e) => setPatPassword(e.target.value)}
                    className="bg-background/50"
                    data-testid="input-password"
                    autoComplete="current-password"
                  />
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
                <Link href="/signup" className="text-blue-400 hover:underline font-medium">
                  Register here
                </Link>
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
                  <Input
                    id="staff-password"
                    type="password"
                    placeholder="••••••••"
                    value={staffPassword}
                    onChange={(e) => setStaffPassword(e.target.value)}
                    className="bg-background/50"
                    data-testid="input-password"
                    autoComplete="current-password"
                  />
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
