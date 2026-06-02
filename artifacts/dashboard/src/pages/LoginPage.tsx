import { useState } from "react";
import { Link, useLocation } from "wouter";
import { LogIn, ArrowRight, Phone } from "lucide-react";
import logoUrl from "@/assets/logo.png";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || !password) {
      setError("Please enter your phone number and password");
      return;
    }
    const name = phone.replace(/\D/g, "").slice(-4)
      ? `Patient-${phone.replace(/\D/g, "").slice(-4)}`
      : "Staff Member";
    localStorage.setItem(
      "sapthagiri_user",
      JSON.stringify({ name, phone, email: "", role: "Staff" })
    );
    setLocation("/dashboard");
  };

  const handleGuestLogin = () => {
    localStorage.setItem(
      "sapthagiri_user",
      JSON.stringify({ name: "Guest Staff", phone: "0000000000", email: "", role: "Staff" })
    );
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
          <p className="text-xs text-primary/70 font-semibold uppercase tracking-wider mt-0.5">Authorized Staff Access</p>
        </div>

        <Card className="border-primary/20 shadow-[0_0_30px_hsl(180_70%_50%_/_0.1)] bg-card/80 backdrop-blur-sm glow-border">
          <CardHeader>
            <CardTitle>Staff Login</CardTitle>
            <CardDescription>Enter your phone number to access the emergency control room.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="phone" className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-primary" />
                  Phone Number <span className="text-primary text-xs font-bold ml-1">PRIMARY ID</span>
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="bg-background/50 font-mono"
                  data-testid="input-phone"
                  autoComplete="tel"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-background/50"
                  data-testid="input-password"
                  autoComplete="current-password"
                />
              </div>

              {error && (
                <div className="text-sm text-destructive font-medium p-2 bg-destructive/10 border border-destructive/20 rounded-md">
                  {error}
                </div>
              )}

              <Button type="submit" className="w-full mt-2" data-testid="button-login">
                <LogIn className="w-4 h-4 mr-2" />
                Login Securely
              </Button>
            </form>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">Or bypass</span>
              </div>
            </div>

            <Button
              variant="secondary"
              className="w-full"
              onClick={handleGuestLogin}
              data-testid="button-guest-login"
            >
              Continue as Guest Staff
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </CardContent>
          <CardFooter className="flex justify-center border-t border-border/50 pt-6 pb-6">
            <p className="text-sm text-muted-foreground">
              New patient?{" "}
              <Link href="/signup" className="text-primary hover:underline font-medium">
                Register here
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
