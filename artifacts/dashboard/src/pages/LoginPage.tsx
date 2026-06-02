import { useState } from "react";
import { Link, useLocation } from "wouter";
import { HeartPulse, LogIn, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please enter credentials");
      return;
    }
    
    // UI illusion login
    const name = email.split("@")[0] || "User";
    localStorage.setItem("sapthagiri_user", JSON.stringify({ name, email, role: "Staff" }));
    setLocation("/dashboard");
  };

  const handleGuestLogin = () => {
    localStorage.setItem("sapthagiri_user", JSON.stringify({ name: "Guest Staff", email: "guest@sapthagiri.edu", role: "Staff" }));
    setLocation("/dashboard");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/10 via-background to-background pointer-events-none" />
      
      <div className="w-full max-w-md relative z-10">
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="bg-primary/20 p-3 rounded-xl mb-4">
            <HeartPulse className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Sapthagiri Emergency</h1>
          <p className="text-sm text-muted-foreground uppercase tracking-widest mt-1">Authorized Access Only</p>
        </div>

        <Card className="border-primary/20 shadow-[0_0_30px_hsl(180_70%_50%_/_0.1)] bg-card/80 backdrop-blur-sm glow-border">
          <CardHeader>
            <CardTitle>Login to Dashboard</CardTitle>
            <CardDescription>Enter your staff credentials to access the control room.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email address</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="staff@sapthagiri.edu" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-background/50"
                  data-testid="input-email"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                </div>
                <Input 
                  id="password" 
                  type="password" 
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-background/50"
                  data-testid="input-password"
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
              Don't have an account?{" "}
              <Link href="/signup" className="text-primary hover:underline font-medium">
                Sign up
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}