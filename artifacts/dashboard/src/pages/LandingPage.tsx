import { useState } from "react";
import { useViewMode, switchViewMode } from "@/hooks/useViewMode";
import { Link, useLocation } from "wouter";
import {
  Bot, Activity, Brain, Users, ShieldCheck, Phone, Mail,
  LogIn, IdCard, Loader2, User, Menu, X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import logoUrl from "@/assets/logo.png";
import { useAuth } from "@/App";

type LoginTab = "staff" | "patient";
type PatientMode = "phone" | "name";

export default function LandingPage() {
  const [, setLocation] = useLocation();
  const { login } = useAuth();

  // ── Login state ──────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<LoginTab>("staff");
  const [patMode, setPatMode] = useState<PatientMode>("phone");

  const [staffId, setStaffId] = useState("");
  const [staffPassword, setStaffPassword] = useState("");
  const [showStaffPass, setShowStaffPass] = useState(false);
  const [staffLoading, setStaffLoading] = useState(false);
  const [staffError, setStaffError] = useState("");

  const [patIdentifier, setPatIdentifier] = useState("");
  const [patPassword, setPatPassword] = useState("");
  const [showPatPass, setShowPatPass] = useState(false);
  const [patLoading, setPatLoading] = useState(false);
  const [patError, setPatError] = useState("");

  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const viewMode = useViewMode();

  const scrollToLogin = () =>
    document.getElementById("login-section")?.scrollIntoView({ behavior: "smooth" });

  const scrollToAbout = () =>
    document.getElementById("about")?.scrollIntoView({ behavior: "smooth" });

  const normPhone = (p: string) => {
    const d = p.replace(/\D/g, "");
    if (d.length === 12 && d.startsWith("91")) return d.slice(2);
    if (d.length === 11 && d.startsWith("0")) return d.slice(1);
    return d;
  };

  // ── Staff login ───────────────────────────────────────────────────────────
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
      if (!res.ok) { setStaffError(data.error ?? "Login failed."); return; }
      login({ ...data.user, name: data.user?.name ?? "", role: data.user?.role ?? "staff" });
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

  // ── Patient login ─────────────────────────────────────────────────────────
  const handlePatientLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setPatError("");
    if (!patIdentifier.trim()) { setPatError(patMode === "phone" ? "Phone number required." : "Full name required."); return; }
    if (!patPassword) { setPatError("Password required."); return; }
    setPatLoading(true);
    try {
      const body = patMode === "phone"
        ? { phone: patIdentifier.trim(), password: patPassword, loginType: "PHONE_OTP" }
        : { name: patIdentifier.trim(), password: patPassword, loginType: "NAME_PASSWORD" };

      const res = await fetch("/api/auth/patient/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json() as { error?: string; user?: { name: string; patientId: string; phone: string; email: string; age: string; allergies?: string[] } };

      if (!res.ok) {
        // Try re-registration from cached profile
        if (data.error?.includes("No patient account found")) {
          try {
            const stored = localStorage.getItem("sapthagiri_user");
            if (stored) {
              const cached = JSON.parse(stored) as { name?: string; phone?: string; age?: string; email?: string; patientId?: string; role?: string; allergies?: string[] };
              const matches = patMode === "phone"
                ? normPhone(cached.phone ?? "") === normPhone(patIdentifier)
                : cached.name?.toLowerCase().trim() === patIdentifier.toLowerCase().trim();
              if (cached.role === "patient" && matches) {
                const regRes = await fetch("/api/auth/patient/register", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ name: cached.name ?? patIdentifier.trim(), phone: cached.phone ?? (patMode === "phone" ? patIdentifier.trim() : ""), age: cached.age ?? "", email: cached.email ?? "", password: patPassword, allergies: cached.allergies ?? [] }),
                });
                if (regRes.ok) {
                  const rd = await regRes.json() as { patientId?: string; user?: { patientId?: string } };
                  login({ ...cached, name: cached.name ?? "", patientId: rd.patientId ?? rd.user?.patientId ?? cached.patientId, role: "patient" });
                  setLocation("/patient");
                  return;
                }
              }
            }
          } catch { /* fall through */ }
        }
        setPatError(data.error ?? "Login failed.");
        return;
      }
      login({ ...data.user, name: data.user?.name ?? "", role: "patient" });
      setLocation("/patient");
    } catch {
      setPatError("Network error. Please try again.");
    } finally {
      setPatLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">

      {/* ── Navbar ── */}
      <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50 px-6 py-4 flex items-center justify-between relative">
        <div className="flex items-center gap-3">
          <img src={logoUrl} alt="Sapthagiri NPS University" className="h-10 w-10 object-contain" />
          <div>
            <h1 className="text-xl font-bold tracking-tight text-foreground leading-none">Sapthagiri NPS</h1>
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Medical Care Portal</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <span className="system-status-indicator hidden md:inline">
            ● REGISTRAR COMPLIANT ENVIRONMENT (DARK BUILD)
          </span>

          <Button variant="ghost" size="sm" onClick={scrollToLogin} data-testid="nav-login-button">
            Login
          </Button>

          {/* Desktop/Mobile View Toggle */}
          <button
            onClick={() => switchViewMode(viewMode === "desktop" ? "mobile" : "desktop")}
            className="hidden sm:flex items-center gap-1.5 text-xs font-mono text-muted-foreground/60 hover:text-primary border border-border/40 hover:border-primary/40 px-2.5 py-1.5 rounded-md transition-colors bg-muted/20 hover:bg-primary/5"
            title={viewMode === "desktop" ? "Switch to Mobile View" : "Switch to Desktop View"}
          >
            <span className="text-sm leading-none">{viewMode === "desktop" ? "🖥" : "📱"}</span>
            <span className="hidden lg:inline text-[10px] tracking-wider uppercase">{viewMode === "desktop" ? "Desktop" : "Mobile"}</span>
          </button>

          {/* Desktop: Dean Access + Staff Registration */}
          <div className="hidden md:flex items-center gap-4">
            <Link
              href="/dean-portal"
              onClick={(e) => {
                e.stopPropagation();
                window.scrollTo(0, 0);
              }}
            >
              <Button
                variant="ghost"
                size="sm"
                className="text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 border border-amber-500/20 hover:border-amber-400/40 font-semibold"
                data-testid="nav-dean-access"
              >
                Dean Access
              </Button>
            </Link>

            <div className="restricted-admin-anchor" style={{ position: "relative", top: "auto", right: "auto" }}>
              <Link href="/admin-onboard">
                <button className="institutional-high-visibility admin-doorway-btn">
                  Staff Registration
                </button>
              </Link>
            </div>
          </div>

          {/* Mobile: Hamburger toggle */}
          <button
            className="md:hidden p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
            onClick={() => setMobileNavOpen((v) => !v)}
            aria-label="Toggle navigation"
          >
            {mobileNavOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile dropdown */}
        {mobileNavOpen && (
          <div className="absolute top-full left-0 right-0 bg-card border-b border-border shadow-lg px-4 py-3 flex flex-col gap-2 md:hidden">
            <Link href="/dean-portal" onClick={() => { window.scrollTo(0, 0); setMobileNavOpen(false); }}>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 border border-amber-500/20 font-semibold"
              >
                Dean Access
              </Button>
            </Link>
            <Link href="/admin-onboard" onClick={() => setMobileNavOpen(false)}>
              <button className="w-full text-left text-sm px-3 py-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors font-medium">
                Staff Registration
              </button>
            </Link>
          </div>
        )}
      </nav>

      {/* ── Hero Section ── */}
      <section
        className="relative min-h-[90vh] flex flex-col items-center justify-center px-6 py-20 text-center overflow-hidden"
        style={{ background: 'radial-gradient(ellipse at 20% 50%, hsl(180 80% 8%) 0%, hsl(220 15% 4%) 60%)' }}
      >
        <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
          <div className="absolute top-1/4 left-[8%] w-72 h-72 rounded-full bg-primary/20 blur-3xl animate-orb-float" />
          <div className="absolute bottom-1/4 right-[8%] w-96 h-96 rounded-full bg-blue-500/15 blur-3xl animate-orb-float-alt" />
          <div className="absolute top-[55%] left-[45%] w-56 h-56 rounded-full bg-primary/10 blur-2xl animate-orb-drift" />
          <div
            className="absolute inset-0 animate-grid-fade"
            style={{
              backgroundImage: 'linear-gradient(hsl(180 70% 50% / 0.04) 1px, transparent 1px), linear-gradient(90deg, hsl(180 70% 50% / 0.04) 1px, transparent 1px)',
              backgroundSize: '64px 64px',
            }}
          />
        </div>

        <div className="absolute top-10 flex items-center gap-2 bg-red-500/10 text-red-400 border border-red-500/20 px-4 py-1.5 rounded-full text-sm font-semibold tracking-wider animate-pulse">
          <span className="w-2 h-2 rounded-full bg-red-500" />
          🔴 LIVE Emergency System
        </div>

        <h1 className="relative text-6xl md:text-8xl font-black tracking-tight max-w-4xl leading-[1.05] mt-14 mb-6 z-10">
          Advanced{" "}
          <span className="text-primary" style={{ textShadow: "0 0 40px hsl(180 70% 50% / 0.4)" }}>
            Emergency
          </span>
          <br />Care
        </h1>
        <p className="relative text-xl md:text-2xl text-muted-foreground max-w-xl mb-4 z-10 leading-relaxed">
          AI-powered triage. Real-time patient monitoring.
          <br className="hidden md:inline" /> Critical care support.
        </p>

        <div className="relative z-10 mb-10 flex items-center gap-2 glass-panel px-5 py-2.5 rounded-full border border-primary/20 text-xs font-semibold text-primary uppercase tracking-widest">
          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          Gemini AI · Doctor-Verified Records · Live Monitoring
        </div>

        <div className="relative z-10 flex flex-col sm:flex-row items-center gap-4 mb-16">
          <Button
            size="lg"
            onClick={() => { setActiveTab("patient"); scrollToLogin(); }}
            className="text-base px-10 h-13 font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-[0_0_25px_hsl(220_70%_50%_/_0.3)] hover:shadow-[0_0_35px_hsl(220_70%_50%_/_0.5)] transition-shadow"
            data-testid="hero-patient-button"
          >
            Patient Portal
          </Button>
          <Button
            size="lg"
            onClick={() => { setActiveTab("staff"); scrollToLogin(); }}
            className="text-base px-10 h-13 font-bold shadow-[0_0_25px_hsl(180_70%_50%_/_0.35)] hover:shadow-[0_0_35px_hsl(180_70%_50%_/_0.5)] transition-shadow"
            data-testid="hero-dashboard-button"
          >
            Staff Portal
          </Button>
          <Button
            variant="ghost"
            size="lg"
            className="text-base px-6 h-13 border-border/60 hover:border-primary/50 hover:text-primary transition-colors"
            onClick={scrollToAbout}
            data-testid="hero-learn-more-button"
          >
            Learn More
          </Button>
        </div>

        <div className="relative z-10 flex items-center justify-center gap-8 text-xs text-muted-foreground font-medium uppercase tracking-wider flex-wrap">
          <span className="flex items-center gap-2"><Users className="w-4 h-4 text-primary" /> 1,000+ Patients Treated</span>
          <span className="hidden sm:block w-px h-4 bg-border" />
          <span className="flex items-center gap-2"><Bot className="w-4 h-4 text-primary" /> 24/7 AI Triage</span>
          <span className="hidden sm:block w-px h-4 bg-border" />
          <span className="flex items-center gap-2"><Activity className="w-4 h-4 text-primary" /> &lt; 3min Response Time</span>
        </div>
      </section>

      {/* ── Inline Login Section ── */}
      <section id="login-section" className="py-16 px-6 bg-background border-b border-border/50">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-foreground mb-1">Portal Access</h2>
            <p className="text-sm text-muted-foreground">Sign in to your institutional account to continue.</p>
          </div>

          {/* Tab switcher */}
          <div className="flex rounded-xl bg-muted/40 p-1 mb-6 border border-border/50">
            <button
              onClick={() => { setActiveTab("staff"); setStaffError(""); }}
              className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all flex items-center justify-center gap-2 ${
                activeTab === "staff"
                  ? "bg-primary/20 text-primary border border-primary/30 shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <IdCard className="w-4 h-4" /> Staff Login
            </button>
            <button
              onClick={() => { setActiveTab("patient"); setPatError(""); }}
              className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all flex items-center justify-center gap-2 ${
                activeTab === "patient"
                  ? "bg-blue-500/20 text-blue-300 border border-blue-500/30 shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Phone className="w-4 h-4" /> Patient Login
            </button>
          </div>

          {/* ── Staff Login Form ── */}
          {activeTab === "staff" && (
            <Card className="border-primary/20 shadow-[0_0_30px_hsl(180_70%_50%_/_0.1)] bg-card/80 backdrop-blur-sm glow-border">
              <CardContent className="pt-6 space-y-4">
                <form onSubmit={handleStaffLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="lp-staff-id" className="flex items-center gap-2">
                      <IdCard className="w-3.5 h-3.5 text-primary" />
                      Staff ID
                    </Label>
                    <Input
                      id="lp-staff-id"
                      placeholder="e.g. DOC101"
                      value={staffId}
                      onChange={(e) => setStaffId(e.target.value.toUpperCase())}
                      className="bg-background/50 font-mono uppercase"
                      autoComplete="username"
                      data-testid="input-staff-id"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lp-staff-pass">Password</Label>
                    <div className="relative flex items-center bg-background/50 border border-input rounded-md focus-within:ring-1 focus-within:ring-ring">
                      <input
                        id="lp-staff-pass"
                        type={showStaffPass ? "text" : "password"}
                        placeholder="••••••••"
                        value={staffPassword}
                        onChange={(e) => setStaffPassword(e.target.value)}
                        className="flex-1 bg-transparent px-3 py-2 text-sm outline-none font-mono"
                        autoComplete="current-password"
                        data-testid="input-password"
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
                    <p className="text-sm text-destructive font-medium p-2 bg-destructive/10 border border-destructive/20 rounded-md">{staffError}</p>
                  )}

                  <Button type="submit" className="w-full" disabled={staffLoading} data-testid="button-login">
                    {staffLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Signing in…</> : <><LogIn className="w-4 h-4 mr-2" /> Login</>}
                  </Button>
                </form>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border" /></div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">Or</span>
                  </div>
                </div>

                <Button variant="secondary" className="w-full" onClick={handleGuestLogin} data-testid="button-guest-login">
                  Continue as Guest Staff
                </Button>

                <p className="text-center text-xs text-muted-foreground/50 pt-1">
                  New staff?{" "}
                  <Link href="/admin-onboard" className="text-primary/60 hover:text-primary transition-colors font-medium">
                    Staff Registration
                  </Link>
                </p>
              </CardContent>
            </Card>
          )}

          {/* ── Patient Login Form ── */}
          {activeTab === "patient" && (
            <Card className="border-blue-500/20 shadow-[0_0_30px_hsl(220_70%_50%_/_0.08)] bg-card/80 backdrop-blur-sm">
              <CardContent className="pt-6 space-y-4">
                {/* Mode toggle */}
                <div className="flex rounded-lg bg-muted/40 p-0.5 border border-border/40">
                  <button
                    onClick={() => { setPatMode("phone"); setPatIdentifier(""); setPatError(""); }}
                    className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center justify-center gap-1.5 ${patMode === "phone" ? "bg-blue-500/20 text-blue-300 border border-blue-500/30" : "text-muted-foreground hover:text-foreground"}`}
                  >
                    <Phone className="w-3 h-3" /> Phone Number
                  </button>
                  <button
                    onClick={() => { setPatMode("name"); setPatIdentifier(""); setPatError(""); }}
                    className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center justify-center gap-1.5 ${patMode === "name" ? "bg-blue-500/20 text-blue-300 border border-blue-500/30" : "text-muted-foreground hover:text-foreground"}`}
                  >
                    <User className="w-3 h-3" /> Full Name
                  </button>
                </div>

                <form onSubmit={handlePatientLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="lp-pat-id" className="flex items-center gap-2">
                      {patMode === "phone" ? <Phone className="w-3.5 h-3.5 text-blue-400" /> : <User className="w-3.5 h-3.5 text-blue-400" />}
                      {patMode === "phone" ? "Phone Number" : "Full Name"}
                    </Label>
                    <Input
                      id="lp-pat-id"
                      type={patMode === "phone" ? "tel" : "text"}
                      placeholder={patMode === "phone" ? "+91 98765 43210" : "e.g. Adarsh Kumar"}
                      value={patIdentifier}
                      onChange={(e) => setPatIdentifier(e.target.value)}
                      className="bg-background/50 font-mono"
                      data-testid="input-phone"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lp-pat-pass">Password</Label>
                    <div className="relative flex items-center bg-background/50 border border-input rounded-md focus-within:ring-1 focus-within:ring-ring">
                      <input
                        id="lp-pat-pass"
                        type={showPatPass ? "text" : "password"}
                        placeholder="••••••••"
                        value={patPassword}
                        onChange={(e) => setPatPassword(e.target.value)}
                        className="flex-1 bg-transparent px-3 py-2 text-sm outline-none font-mono"
                        autoComplete="current-password"
                        data-testid="input-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPatPass(!showPatPass)}
                        className="px-3 text-[10px] font-mono font-bold text-muted-foreground hover:text-blue-400 transition-colors select-none shrink-0"
                        tabIndex={-1}
                      >
                        {showPatPass ? "HIDE" : "SHOW"}
                      </button>
                    </div>
                  </div>

                  {patError && (
                    <p className="text-sm text-destructive font-medium p-2 bg-destructive/10 border border-destructive/20 rounded-md">{patError}</p>
                  )}

                  <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white" disabled={patLoading} data-testid="button-login">
                    {patLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Signing in…</> : <><LogIn className="w-4 h-4 mr-2" /> Sign In</>}
                  </Button>
                </form>

                <p className="text-center text-xs text-muted-foreground/50 pt-1">
                  Patient registration is handled at the hospital intake desk by medical staff.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </section>

      {/* ── About Section ── */}
      <section id="about" className="py-24 px-6 bg-card">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl font-bold mb-6 text-foreground">About Sapthagiri Healthcare</h2>
            <p className="text-lg text-muted-foreground mb-6">
              Sapthagiri Healthcare & Emergency Care is a modern AI-assisted patient management platform built for rapid emergency response. Our system integrates real-time triage, intelligent diagnostics, and critical care monitoring to deliver hospital-grade emergency support.
            </p>
            <p className="text-lg text-muted-foreground">
              Through partnership with certified medical professionals, we provide an unparalleled emergency safety net — combining clinical expertise with cutting-edge artificial intelligence to ensure every patient receives timely, accurate care.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Card className="bg-background border-border/50">
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-black text-primary mb-2">2,400+</div>
                <div className="text-sm font-medium text-muted-foreground uppercase">Patients Served</div>
              </CardContent>
            </Card>
            <Card className="bg-background border-border/50">
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-black text-primary mb-2">98.7%</div>
                <div className="text-sm font-medium text-muted-foreground uppercase">Care Satisfaction</div>
              </CardContent>
            </Card>
            <Card className="bg-background border-border/50">
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-black text-primary mb-2">&lt; 3min</div>
                <div className="text-sm font-medium text-muted-foreground uppercase">Triage Response</div>
              </CardContent>
            </Card>
            <Card className="bg-background border-border/50">
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-black text-primary mb-2">24/7</div>
                <div className="text-sm font-medium text-muted-foreground uppercase">AI Monitoring</div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* ── Emergency Services ── */}
      <section className="py-24 px-6 bg-background">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold mb-12 text-center text-foreground">Core Emergency Services</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="border-red-500/20 bg-red-500/5 hover:bg-red-500/10 transition-colors">
              <CardContent className="p-8">
                <Activity className="w-12 h-12 text-red-500 mb-6" />
                <h3 className="text-xl font-bold text-foreground mb-3">Emergency Triage</h3>
                <p className="text-muted-foreground">Instant severity classification — RED, YELLOW, GREEN — ensuring the most critical patients receive immediate intervention.</p>
              </CardContent>
            </Card>
            <Card className="border-primary/20 bg-primary/5 hover:bg-primary/10 transition-colors glow-border">
              <CardContent className="p-8">
                <Brain className="w-12 h-12 text-primary mb-6" />
                <h3 className="text-xl font-bold text-foreground mb-3">AI Diagnostics</h3>
                <p className="text-muted-foreground">Advanced symptom analysis powered by Google Gemini, delivering rapid preliminary clinical assessments to support medical staff decisions.</p>
              </CardContent>
            </Card>
            <Card className="border-blue-500/20 bg-blue-500/5 hover:bg-blue-500/10 transition-colors">
              <CardContent className="p-8">
                <ShieldCheck className="w-12 h-12 text-blue-500 mb-6" />
                <h3 className="text-xl font-bold text-foreground mb-3">24/7 Monitoring</h3>
                <p className="text-muted-foreground">Continuous vital tracking and automated critical alerts — uninterrupted patient status surveillance across all wards.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* ── AI Assistant Section ── */}
      <section className="py-24 px-6 bg-card border-y border-border/50">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div className="order-2 md:order-1 flex flex-col gap-4">
            <div className="bg-background rounded-2xl p-6 border border-border shadow-lg">
              <div className="flex items-center gap-3 mb-4 pb-4 border-b border-border">
                <div className="bg-primary/20 p-2 rounded-full">
                  <Bot className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <div className="font-semibold text-sm">Gemini Medical AI</div>
                  <div className="text-xs text-muted-foreground">Online • Secure</div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center shrink-0">
                    <Users className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div className="bg-secondary rounded-2xl rounded-tl-none px-4 py-2 text-sm text-foreground">
                    Patient presenting with sharp pain in lower right abdomen, onset 2 hours ago.
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                    <Bot className="w-4 h-4 text-primary" />
                  </div>
                  <div className="bg-primary/10 border border-primary/20 rounded-2xl rounded-tl-none px-4 py-3 text-sm text-foreground">
                    <p className="font-semibold text-primary mb-1">Priority Alert — RED</p>
                    <p>Presentation consistent with possible acute appendicitis. Recommend immediate surgical consult and imaging. Escalate to emergency team now.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="order-1 md:order-2">
            <h2 className="text-4xl font-bold mb-6 text-foreground">AI-Assisted Clinical Support</h2>
            <p className="text-lg text-muted-foreground mb-6">
              Powered by Google Gemini, our clinical AI assistant provides instant symptom triage guidance and emergency prioritization — helping medical staff make faster, better-informed decisions at the point of care.
            </p>
            <div className="bg-destructive/10 text-destructive border border-destructive/20 p-4 rounded-lg text-sm mb-8">
              <strong>Clinical Disclaimer:</strong> This AI tool provides preliminary guidance only. All final clinical decisions must be made by qualified medical professionals.
            </div>
            <Button size="lg" onClick={() => { setActiveTab("staff"); scrollToLogin(); }}>
              Access Clinical Dashboard
            </Button>
          </div>
        </div>
      </section>

      {/* ── Why Choose Us ── */}
      <section className="py-24 px-6 bg-background">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-12 text-foreground">Why Sapthagiri Healthcare</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { icon: Activity, title: "Rapid Response", desc: "Under 3 minutes triage time" },
              { icon: Brain, title: "AI-Powered", desc: "Intelligent clinical analysis" },
              { icon: ShieldCheck, title: "Secure Records", desc: "Doctor-verified edits only" },
              { icon: Phone, title: "Patient-Centered", desc: "Phone-first patient identity" },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex flex-col items-center text-center p-4">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                  <Icon className="w-8 h-8 text-foreground" />
                </div>
                <h4 className="font-semibold mb-2">{title}</h4>
                <p className="text-sm text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-card border-t border-border py-12 px-6 mt-auto">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <img src={logoUrl} alt="Sapthagiri NPS" className="h-7 w-7 object-contain" />
            <span className="font-bold text-foreground">Sapthagiri NPS University</span>
          </div>
          <div className="flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
            <button onClick={scrollToAbout} className="hover:text-primary transition-colors">About</button>
            <button onClick={() => { setActiveTab("staff"); scrollToLogin(); }} className="hover:text-primary transition-colors">Emergency Access</button>
            <button onClick={() => { setActiveTab("staff"); scrollToLogin(); }} className="hover:text-primary transition-colors">AI Assistant</button>
          </div>
        </div>
        <div className="max-w-6xl mx-auto mt-8 pt-8 border-t border-border/50 flex flex-col items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Mail className="w-4 h-4 text-primary shrink-0" />
            Patient Support &amp; Help Centre:{" "}
            <a href="mailto:sapthagiri.healthsupport@gmail.com" className="text-primary hover:underline font-medium ml-1">
              sapthagiri.healthsupport@gmail.com
            </a>
          </div>
          <p className="text-sm font-semibold text-destructive text-center">
            Not a replacement for emergency services. Call 108 immediately for life-threatening emergencies.
          </p>
          <p className="text-xs text-muted-foreground">
            © 2026 Sapthagiri Healthcare &amp; Emergency Care. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
