import { useState } from "react";
import { Link, useLocation } from "wouter";
import { UserPlus, Loader2, ShieldCheck, ChevronLeft } from "lucide-react";
import logoUrl from "@/assets/logo.png";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

const ROLE_OPTIONS = [
  "Doctor",
  "Nurse",
  "Medical Officer",
  "Pharmacist",
  "Receptionist",
  "Lab Technician",
  "Radiologist",
  "Administrative Staff",
  "Emergency Technician",
];

export default function StaffSignupPage() {
  const [, setLocation] = useLocation();
  const [name, setName] = useState("");
  const [staffId, setStaffId] = useState("");
  const [role, setRole] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!name.trim() || !staffId.trim() || !role || !password) {
      setError("All fields are required.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/staff/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), staffId: staffId.trim(), role, password }),
      });
      const data = await res.json() as { error?: string; userId?: string };
      if (!res.ok) {
        setError(data.error ?? "Registration failed.");
        return;
      }
      setSuccess(`Account created! Staff ID: ${data.userId ?? staffId.toUpperCase()}. Redirecting to login…`);
      setTimeout(() => setLocation("/login"), 2000);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/10 via-background to-background pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        <div className="flex flex-col items-center mb-8 text-center">
          <img src={logoUrl} alt="Sapthagiri NPS University" className="h-20 w-20 object-contain mb-3" />
          <h1 className="text-2xl font-bold tracking-tight">Sapthagiri NPS University</h1>
          <p className="text-xs text-muted-foreground uppercase tracking-widest mt-1">
            Institute of Medical Sciences &amp; Research Center
          </p>
          <p className="text-xs text-primary/70 font-semibold uppercase tracking-wider mt-0.5">
            Staff Account Registration
          </p>
        </div>

        <Card className="border-primary/20 shadow-[0_0_30px_hsl(180_70%_50%_/_0.1)] bg-card/80 backdrop-blur-sm glow-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-primary" />
              Create Staff Account
            </CardTitle>
            <CardDescription>
              Register your staff account to access the Medical Operations Portal.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {success ? (
              <div className="flex items-center gap-2 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-400 font-medium">
                <ShieldCheck className="w-5 h-5 shrink-0" />
                {success}
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    placeholder="Dr. / Mr. / Ms. Full Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="bg-background/50"
                    autoComplete="name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="staffId">
                    Staff / Doctor ID *{" "}
                    <span className="text-xs text-muted-foreground font-normal">(e.g. DOC101 — becomes your login ID)</span>
                  </Label>
                  <Input
                    id="staffId"
                    placeholder="DOC101"
                    value={staffId}
                    onChange={(e) => setStaffId(e.target.value.toUpperCase())}
                    className="bg-background/50 font-mono uppercase"
                    autoComplete="username"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role">Role *</Label>
                  <select
                    id="role"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full h-10 px-3 rounded-md border border-input bg-background/50 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                  >
                    <option value="" disabled>Select your role…</option>
                    {ROLE_OPTIONS.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password *</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Choose a strong password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-background/50"
                    autoComplete="new-password"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm">Confirm Password *</Label>
                  <Input
                    id="confirm"
                    type="password"
                    placeholder="Re-enter password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    className="bg-background/50"
                    autoComplete="new-password"
                  />
                </div>

                {error && (
                  <p className="text-sm text-destructive font-medium p-2 bg-destructive/10 border border-destructive/20 rounded-md">
                    {error}
                  </p>
                )}

                <Button type="submit" className="w-full mt-2" disabled={loading}>
                  {loading ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Creating Account…</>
                  ) : (
                    <><UserPlus className="w-4 h-4 mr-2" /> Create Account</>
                  )}
                </Button>
              </form>
            )}
          </CardContent>
          <CardFooter className="flex flex-col gap-1 border-t border-border/50 pt-4 pb-4 text-center">
            <Link href="/login" className="flex items-center justify-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <ChevronLeft className="w-3.5 h-3.5" /> Back to Staff Login
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
