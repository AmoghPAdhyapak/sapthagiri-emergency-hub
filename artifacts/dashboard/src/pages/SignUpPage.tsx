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

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

type Step = "phone" | "otp" | "profile";

export default function SignUpPage() {
  const [, setLocation] = useLocation();

  // Step state
  const [step, setStep] = useState<Step>("phone");

  // Step 1 — phone
  const [phone, setPhone] = useState("");
  const [phoneError, setPhoneError] = useState("");

  // Step 2 — OTP
  const [generatedOtp, setGeneratedOtp] = useState("");
  const [enteredOtp, setEnteredOtp] = useState("");
  const [otpError, setOtpError] = useState("");
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

  const handleSendOtp = (e: React.FormEvent) => {
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
    const otp = generateOtp();
    setGeneratedOtp(otp);
    setEnteredOtp("");
    setOtpError("");
    startTimer();
    setStep("otp");
  };

  const handleResendOtp = () => {
    const otp = generateOtp();
    setGeneratedOtp(otp);
    setEnteredOtp("");
    setOtpError("");
    startTimer();
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (countdown === 0) {
      setOtpError("OTP has expired. Please request a new one.");
      return;
    }
    if (enteredOtp.trim() !== generatedOtp) {
      setOtpError("Incorrect OTP. Please check the code above and try again.");
      return;
    }
    setOtpError("");
    if (timerRef.current) clearInterval(timerRef.current);
    setStep("profile");
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

    // Clear any stale medical record for this phone number → fresh start
    localStorage.removeItem(`sapthagiri_med_${phone.trim()}`);

    // Persist account
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
      {/* Background radial glow */}
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
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                  i < stepIndex
                    ? "bg-primary/20 text-primary"
                    : i === stepIndex
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                }`}
              >
                {i < stepIndex ? (
                  <CheckCircle2 className="w-3 h-3" />
                ) : (
                  <span className="w-3 h-3 flex items-center justify-center font-bold text-[10px]">
                    {i + 1}
                  </span>
                )}
                {label}
              </div>
              {i < 2 && <div className="w-4 h-px bg-border" />}
            </div>
          ))}
        </div>

        {/* ── STEP 1: Phone Number ─────────────────────────── */}
        {step === "phone" && (
          <Card className="border-primary/20 shadow-lg bg-card/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="w-5 h-5 text-primary" /> Enter Your Mobile Number
              </CardTitle>
              <CardDescription>
                We'll send a one-time verification code to your phone. Your mobile number is your primary medical ID.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSendOtp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="phone" className="flex items-center gap-2 font-semibold">
                    <Phone className="w-3.5 h-3.5 text-primary" />
                    Mobile Number
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-primary border-primary/30 font-bold">
                      PRIMARY ID
                    </Badge>
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="bg-background/50 font-mono text-base h-11"
                    data-testid="input-phone"
                    autoComplete="tel"
                    autoFocus
                  />
                  {phoneError && (
                    <p className="text-xs text-destructive">{phoneError}</p>
                  )}
                </div>

                <Button type="submit" className="w-full h-11" data-testid="button-send-otp">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Send Verification Code
                </Button>
              </form>
            </CardContent>
            <CardFooter className="flex flex-col gap-3 border-t border-border/50 pt-5">
              <p className="text-sm text-muted-foreground text-center">
                Already registered?{" "}
                <Link href="/login" className="text-primary hover:underline font-medium">
                  Login here
                </Link>
              </p>
              <p className="text-xs text-muted-foreground/60 text-center">
                Support:{" "}
                <a href={`mailto:${SUPPORT_EMAIL}`} className="hover:text-primary transition-colors">
                  {SUPPORT_EMAIL}
                </a>
              </p>
            </CardFooter>
          </Card>
        )}

        {/* ── STEP 2: OTP Verification ─────────────────────── */}
        {step === "otp" && (
          <Card className="border-primary/20 shadow-lg bg-card/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-primary" /> Verify Mobile Number
              </CardTitle>
              <CardDescription>
                A 6-digit OTP has been sent to{" "}
                <span className="text-foreground font-semibold font-mono">{phone}</span>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Simulated SMS bubble */}
              <div className="bg-blue-500/8 border border-blue-500/20 rounded-xl p-4 relative">
                <div className="flex items-start gap-3">
                  <div className="bg-blue-500/20 p-1.5 rounded-lg shrink-0">
                    <MessageSquare className="w-4 h-4 text-blue-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[11px] font-bold text-blue-400 uppercase tracking-wider">
                        SMS — Sapthagiri Healthcare
                      </span>
                      <span className="text-[10px] text-muted-foreground font-mono">just now</span>
                    </div>
                    <p className="text-sm text-foreground/90 leading-relaxed">
                      Your Sapthagiri verification code is:{" "}
                      <span className="font-black text-primary tracking-widest font-mono text-base">
                        {generatedOtp}
                      </span>
                      . Valid for {Math.floor(countdown / 60)}:
                      {String(countdown % 60).padStart(2, "0")} mins. Do not share this code.
                    </p>
                  </div>
                </div>
              </div>

              {/* OTP input */}
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="otp" className="font-semibold">Enter 6-Digit OTP</Label>
                  <Input
                    id="otp"
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="• • • • • •"
                    value={enteredOtp}
                    onChange={(e) => setEnteredOtp(e.target.value.replace(/\D/g, ""))}
                    className="bg-background/50 font-mono text-2xl tracking-[0.5em] text-center h-14 border-2 focus:border-primary"
                    data-testid="input-otp"
                    autoFocus
                    autoComplete="one-time-code"
                  />
                  {countdown === 0 && (
                    <p className="text-xs text-amber-400 flex items-center gap-1">
                      OTP expired — please request a new one.
                    </p>
                  )}
                  {otpError && (
                    <p className="text-xs text-destructive">{otpError}</p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full h-11"
                  disabled={enteredOtp.length < 6 || countdown === 0}
                  data-testid="button-verify-otp"
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Verify & Continue
                </Button>
              </form>
            </CardContent>
            <CardFooter className="flex flex-col gap-3 border-t border-border/50 pt-5">
              <div className="flex items-center gap-3 w-full justify-between">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground"
                  onClick={() => setStep("phone")}
                  data-testid="button-back-to-phone"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Change number
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-primary"
                  onClick={handleResendOtp}
                  disabled={countdown > 90}
                  data-testid="button-resend-otp"
                >
                  <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                  Resend OTP
                </Button>
              </div>
            </CardFooter>
          </Card>
        )}

        {/* ── STEP 3: Complete Profile ──────────────────────── */}
        {step === "profile" && (
          <Card className="border-primary/20 shadow-lg bg-card/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-primary" /> Complete Patient Profile
              </CardTitle>
              <CardDescription>
                <span className="inline-flex items-center gap-1.5 text-emerald-400 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Mobile {phone} verified.
                </span>{" "}
                Fill in your healthcare details to complete registration.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCompleteRegistration} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="font-semibold">
                    Full Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="name"
                    placeholder="e.g. Ramesh Kumar"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="bg-background/50"
                    data-testid="input-name"
                    autoFocus
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5" />
                    Email Address{" "}
                    <span className="text-muted-foreground text-xs font-normal">(optional — backup)</span>
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

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="roomNumber">Room / Ward</Label>
                    <Input
                      id="roomNumber"
                      placeholder="ER-3 / Ward-B"
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
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Patient">Patient</SelectItem>
                        <SelectItem value="Doctor">Doctor</SelectItem>
                        <SelectItem value="Nurse">Nurse</SelectItem>
                        <SelectItem value="Admin">Administrator</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="symptoms">
                    Presenting Symptoms / Health Notes{" "}
                    <span className="text-muted-foreground text-xs font-normal">(optional)</span>
                  </Label>
                  <Textarea
                    id="symptoms"
                    placeholder="Describe current symptoms, known conditions, or allergies..."
                    value={symptoms}
                    onChange={(e) => setSymptoms(e.target.value)}
                    className="min-h-[72px] resize-none bg-background/50"
                    data-testid="input-symptoms"
                  />
                  <p className="text-xs text-muted-foreground/60">
                    Patient-reported only. Clinical records require doctor verification.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="font-semibold">
                    Password <span className="text-destructive">*</span>
                  </Label>
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

                {profileError && (
                  <div className="text-sm text-destructive font-medium p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                    {profileError}
                  </div>
                )}

                <Button type="submit" className="w-full h-11 mt-2" data-testid="button-signup">
                  <UserPlus className="w-4 h-4 mr-2" />
                  Create Patient Account
                </Button>
              </form>
            </CardContent>
            <CardFooter className="flex flex-col gap-2 border-t border-border/50 pt-5">
              <p className="text-sm text-muted-foreground text-center">
                Already registered?{" "}
                <Link href="/login" className="text-primary hover:underline font-medium">
                  Login here
                </Link>
              </p>
              <p className="text-xs text-muted-foreground/60 text-center">
                Need help?{" "}
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
