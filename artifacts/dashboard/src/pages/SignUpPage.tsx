import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";
import {
  Phone,
  MessageSquare,
  CheckCircle2,
  ChevronLeft,
  UserPlus,
  RefreshCw,
  ShieldCheck,
  Mail,
  Loader2,
} from "lucide-react";
import logoUrl from "@/assets/logo.png";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

const SUPPORT_EMAIL = "sapthagiri.healthsupport@gmail.com";
const OTP_TTL = 120; // seconds

type Step = "phone" | "otp" | "profile";

async function apiSendOtp(phone: string): Promise<void> {
  const res = await fetch("/api/otp/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone: phone.replace(/\D/g, "") }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error ?? "Failed to send OTP");
  }
}

async function apiVerifyOtp(phone: string, otp: string): Promise<void> {
  const res = await fetch("/api/otp/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone: phone.replace(/\D/g, ""), otp }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error ?? "Verification failed");
  }
}

export default function SignUpPage() {
  const [, setLocation] = useLocation();

  const [step, setStep] = useState<Step>("phone");

  // Step 1 — phone
  const [phone, setPhone] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [sending, setSending] = useState(false);

  // Step 2 — OTP
  const [enteredOtp, setEnteredOtp] = useState("");
  const [otpError, setOtpError] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Step 3 — profile
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [roomNumber, setRoomNumber] = useState("");
  const [symptoms, setSymptoms] = useState("");
  const [role, setRole] = useState("Patient");
  const [password, setPassword] = useState("");
  const [profileError, setProfileError] = useState("");

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const startTimer = () => {
    setCountdown(OTP_TTL);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = phone.trim();
    if (!cleaned) {
      setPhoneError("Phone number is required.");
      return;
    }
    if (cleaned.replace(/\D/g, "").length < 7) {
      setPhoneError("Please enter a valid phone number.");
      return;
    }
    setPhoneError("");
    setSending(true);
    try {
      await apiSendOtp(cleaned);
      setEnteredOtp("");
      setOtpError("");
      startTimer();
      setStep("otp");
    } catch (err) {
      setPhoneError(err instanceof Error ? err.message : "Failed to send OTP");
    } finally {
      setSending(false);
    }
  };

  const handleResendOtp = async () => {
    setSending(true);
    try {
      await apiSendOtp(phone.trim());
      setEnteredOtp("");
      setOtpError("");
      startTimer();
    } catch (err) {
      setOtpError(err instanceof Error ? err.message : "Failed to resend OTP");
    } finally {
      setSending(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (countdown === 0) {
      setOtpError("OTP has expired. Please request a new one.");
      return;
    }
    if (!enteredOtp.trim()) {
      setOtpError("Please enter the OTP.");
      return;
    }
    setVerifying(true);
    try {
      await apiVerifyOtp(phone.trim(), enteredOtp.trim());
      setOtpError("");
      if (timerRef.current) clearInterval(timerRef.current);
      setStep("profile");
    } catch (err) {
      setOtpError(err instanceof Error ? err.message : "Verification failed");
    } finally {
      setVerifying(false);
    }
  };

  const handleCompleteRegistration = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setProfileError("Full name is required.");
      return;
    }
    if (!password) {
      setProfileError("Password is required.");
      return;
    }
    setProfileError("");

    localStorage.removeItem(`sapthagiri_med_${phone.trim()}`);
    localStorage.setItem(
      "sapthagiri_user",
      JSON.stringify({
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim(),
        roomNumber: roomNumber.trim(),
        symptoms: symptoms.trim(),
        role,
      })
    );
    setLocation("/dashboard");
  };

  const stepIndex = step === "phone" ? 0 : step === "otp" ? 1 : 2;

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 py-12 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/10 via-background to-background pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8 text-center">
          <img src={logoUrl} alt="Sapthagiri NPS University" className="h-20 w-20 object-contain mb-3" />
          <h1 className="text-2xl font-bold tracking-tight">Sapthagiri NPS University</h1>
          <p className="text-xs text-muted-foreground uppercase tracking-widest mt-1">
            Institute of Medical Sciences &amp; Research Center
          </p>
          <p className="text-xs text-primary/70 font-semibold uppercase tracking-wider mt-0.5">
            Patient Registration Portal
          </p>
        </div>

        {/* Step progress */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {["Phone", "Verify OTP", "Profile"].map((label, i) => (
            <div key={label} className="flex items-center gap-2">
              <div
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border transition-all ${
                  i === stepIndex
                    ? "bg-primary text-primary-foreground border-primary"
                    : i < stepIndex
                    ? "bg-primary/20 text-primary border-primary/30"
                    : "bg-muted/30 text-muted-foreground border-border"
                }`}
              >
                {i < stepIndex ? <CheckCircle2 className="w-3 h-3" /> : <span>{i + 1}</span>}
                {label}
              </div>
              {i < 2 && (
                <div className={`w-6 h-px ${i < stepIndex ? "bg-primary" : "bg-border"}`} />
              )}
            </div>
          ))}
        </div>

        {/* ── Step 1: Phone ── */}
        {step === "phone" && (
          <Card className="border-primary/20 shadow-[0_0_30px_hsl(180_70%_50%_/_0.1)] bg-card/80 backdrop-blur-sm glow-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-primary" />
                Enter Your Mobile Number
              </CardTitle>
              <CardDescription>
                We'll send a one-time verification code to your phone. Your mobile number is your primary medical ID.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSendOtp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="phone" className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-primary" />
                    Mobile Number{" "}
                    <Badge className="text-[10px] py-0 px-1.5 bg-primary/10 text-primary border-primary/20">
                      PRIMARY ID
                    </Badge>
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="bg-background/50 font-mono"
                    autoComplete="tel"
                    data-testid="input-phone"
                  />
                </div>
                {phoneError && (
                  <p className="text-sm text-destructive font-medium p-2 bg-destructive/10 border border-destructive/20 rounded-md">
                    {phoneError}
                  </p>
                )}
                <Button type="submit" className="w-full" disabled={sending} data-testid="button-send-otp">
                  {sending ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Sending OTP…</>
                  ) : (
                    <><MessageSquare className="w-4 h-4 mr-2" /> Send Verification Code</>
                  )}
                </Button>
              </form>
            </CardContent>
            <CardFooter className="flex flex-col gap-1 border-t border-border/50 pt-4 pb-4 text-center">
              <p className="text-sm text-muted-foreground">
                Already registered?{" "}
                <Link href="/login" className="text-primary hover:underline font-medium">
                  Login here
                </Link>
              </p>
              <p className="text-xs text-muted-foreground/50">
                Support:{" "}
                <a href={`mailto:${SUPPORT_EMAIL}`} className="hover:text-primary transition-colors">
                  {SUPPORT_EMAIL}
                </a>
              </p>
            </CardFooter>
          </Card>
        )}

        {/* ── Step 2: OTP Verification ── */}
        {step === "otp" && (
          <Card className="border-primary/20 shadow-[0_0_30px_hsl(180_70%_50%_/_0.1)] bg-card/80 backdrop-blur-sm glow-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-primary" />
                Verify Your Number
              </CardTitle>
              <CardDescription>
                An OTP has been sent to <span className="font-mono text-foreground">{phone}</span> via SMS.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                {/* Timer display */}
                <div className={`flex items-center justify-between p-3 rounded-lg border text-sm font-mono ${
                  countdown > 0
                    ? "bg-primary/5 border-primary/20 text-primary"
                    : "bg-destructive/10 border-destructive/20 text-destructive"
                }`}>
                  <span className="flex items-center gap-1.5 text-xs uppercase tracking-wider font-bold">
                    {countdown > 0 ? (
                      <><MessageSquare className="w-3 h-3" /> OTP sent to your phone</>
                    ) : (
                      <><RefreshCw className="w-3 h-3" /> OTP expired</>
                    )}
                  </span>
                  <span className="text-base font-black">
                    {countdown > 0
                      ? `${Math.floor(countdown / 60)}:${String(countdown % 60).padStart(2, "0")}`
                      : "0:00"}
                  </span>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="otp">Enter 6-digit OTP</Label>
                  <Input
                    id="otp"
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="● ● ● ● ● ●"
                    value={enteredOtp}
                    onChange={(e) => setEnteredOtp(e.target.value.replace(/\D/g, ""))}
                    className="bg-background/50 font-mono text-center text-2xl tracking-[1rem] h-14"
                    autoComplete="one-time-code"
                    data-testid="input-otp"
                  />
                </div>

                {otpError && (
                  <p className="text-sm text-destructive font-medium p-2 bg-destructive/10 border border-destructive/20 rounded-md">
                    {otpError}
                  </p>
                )}

                <Button type="submit" className="w-full" disabled={verifying || countdown === 0} data-testid="button-verify-otp">
                  {verifying ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Verifying…</>
                  ) : (
                    <><ShieldCheck className="w-4 h-4 mr-2" /> Verify OTP</>
                  )}
                </Button>

                <div className="flex items-center justify-between">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setStep("phone")}
                    className="text-muted-foreground"
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" /> Change Number
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={countdown > 0 || sending}
                    onClick={handleResendOtp}
                    className="text-muted-foreground"
                    data-testid="button-resend-otp"
                  >
                    {sending ? (
                      <><Loader2 className="w-3 h-3 mr-1.5 animate-spin" /> Sending…</>
                    ) : (
                      <><RefreshCw className="w-3 h-3 mr-1.5" /> Resend OTP</>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* ── Step 3: Profile ── */}
        {step === "profile" && (
          <Card className="border-primary/20 shadow-[0_0_30px_hsl(180_70%_50%_/_0.1)] bg-card/80 backdrop-blur-sm glow-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-primary" />
                Complete Your Profile
              </CardTitle>
              <CardDescription>
                Set up your patient account. You can update this later in your dashboard.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCompleteRegistration} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    placeholder="Dr. / Mr. / Ms. Full Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="bg-background/50"
                    data-testid="input-name"
                    autoComplete="name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">
                    <Mail className="w-3.5 h-3.5 inline mr-1 text-primary" />
                    Email (Optional)
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-background/50"
                    data-testid="input-email"
                    autoComplete="email"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="room">Room / Ward</Label>
                    <Input
                      id="room"
                      placeholder="ER-1"
                      value={roomNumber}
                      onChange={(e) => setRoomNumber(e.target.value)}
                      className="bg-background/50 uppercase font-mono"
                      data-testid="input-room"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role">Role</Label>
                    <Select onValueChange={setRole} defaultValue={role}>
                      <SelectTrigger id="role" className="bg-background/50">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Patient">Patient</SelectItem>
                        <SelectItem value="Staff">Staff</SelectItem>
                        <SelectItem value="Visitor">Visitor</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="symptoms">Current Symptoms (Optional)</Label>
                  <Textarea
                    id="symptoms"
                    placeholder="Describe any current symptoms or reason for visit..."
                    value={symptoms}
                    onChange={(e) => setSymptoms(e.target.value)}
                    className="bg-background/50 min-h-[80px] resize-none"
                    data-testid="input-symptoms"
                  />
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
                    data-testid="input-password"
                    autoComplete="new-password"
                  />
                </div>

                {profileError && (
                  <p className="text-sm text-destructive font-medium p-2 bg-destructive/10 border border-destructive/20 rounded-md">
                    {profileError}
                  </p>
                )}

                <Button type="submit" className="w-full" data-testid="button-complete-registration">
                  <UserPlus className="w-4 h-4 mr-2" />
                  Complete Registration
                </Button>
              </form>
            </CardContent>
            <CardFooter className="flex justify-center border-t border-border/50 pt-4 pb-4">
              <p className="text-xs text-muted-foreground/50">
                Support:{" "}
                <a href={`mailto:${SUPPORT_EMAIL}`} className="hover:text-primary transition-colors">
                  {SUPPORT_EMAIL}
                </a>
              </p>
            </CardFooter>
          </Card>
        )}
      </div>
    </div>
  );
}
