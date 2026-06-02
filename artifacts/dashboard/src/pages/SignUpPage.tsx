import { useState } from "react";
import { Link, useLocation } from "wouter";
import { HeartPulse, UserPlus, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function SignUpPage() {
  const [, setLocation] = useLocation();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [roomNumber, setRoomNumber] = useState("");
  const [symptoms, setSymptoms] = useState("");
  const [role, setRole] = useState("Patient");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSignUp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone || !password) {
      setError("Full name, phone number, and password are required");
      return;
    }
    localStorage.setItem(
      "sapthagiri_user",
      JSON.stringify({ name, phone, email, roomNumber, symptoms, role })
    );
    setLocation("/dashboard");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 py-12 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/10 via-background to-background pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="bg-primary/20 p-3 rounded-xl mb-4">
            <HeartPulse className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Sapthagiri Healthcare</h1>
          <p className="text-sm text-muted-foreground uppercase tracking-widest mt-1">Patient Registration Portal</p>
        </div>

        <Card className="border-primary/20 shadow-lg bg-card/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Register as a Patient</CardTitle>
            <CardDescription>Your phone number is your primary medical identifier.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSignUp} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  placeholder="e.g. Ramesh Kumar"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-background/50"
                  data-testid="input-name"
                />
              </div>

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
                <Label htmlFor="email">
                  Email Address <span className="text-muted-foreground text-xs">(optional — backup/recovery)</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="patient@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-background/50"
                  data-testid="input-email"
                  autoComplete="email"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="roomNumber">Room Number</Label>
                <Input
                  id="roomNumber"
                  placeholder="e.g. ER-3, Ward-B"
                  value={roomNumber}
                  onChange={(e) => setRoomNumber(e.target.value)}
                  className="bg-background/50 font-mono uppercase"
                  data-testid="input-room"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select value={role} onValueChange={setRole}>
                  <SelectTrigger className="bg-background/50" data-testid="select-role">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Patient">Patient</SelectItem>
                    <SelectItem value="Doctor">Doctor</SelectItem>
                    <SelectItem value="Nurse">Nurse</SelectItem>
                    <SelectItem value="Admin">Administrator</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="symptoms">
                  Health Details / Presenting Symptoms <span className="text-muted-foreground text-xs">(optional)</span>
                </Label>
                <Textarea
                  id="symptoms"
                  placeholder="Describe current symptoms, known conditions, allergies, or any health observations..."
                  value={symptoms}
                  onChange={(e) => setSymptoms(e.target.value)}
                  className="min-h-[80px] resize-none bg-background/50"
                  data-testid="input-symptoms"
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
                  autoComplete="new-password"
                />
              </div>

              {error && (
                <div className="text-sm text-destructive font-medium p-2 bg-destructive/10 border border-destructive/20 rounded-md">
                  {error}
                </div>
              )}

              <Button type="submit" className="w-full mt-4" data-testid="button-signup">
                <UserPlus className="w-4 h-4 mr-2" />
                Complete Registration
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex justify-center border-t border-border/50 pt-6 pb-6">
            <p className="text-sm text-muted-foreground">
              Already registered?{" "}
              <Link href="/login" className="text-primary hover:underline font-medium">
                Login here
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
