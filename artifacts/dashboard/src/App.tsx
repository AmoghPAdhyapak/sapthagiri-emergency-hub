import { useEffect, useState, ReactNode, createContext, useContext } from "react";
import { SplashScreen } from "@/components/SplashScreen";
import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/Dashboard";
import PatientPortal from "@/pages/PatientPortal";
import LandingPage from "@/pages/LandingPage";
import LoginPage from "@/pages/LoginPage";
import SignUpPage from "@/pages/SignUpPage";
import StaffSignupPage from "@/pages/StaffSignupPage";

const queryClient = new QueryClient();

// ── Auth Context — Persistent Session Rehydration ───────────────────────────
// On every page load the AuthProvider verifies the cached localStorage session
// against the backend SQLite store via POST /api/auth/verify.
// If verification fails the stale session is cleared and the user is sent to /login.

export interface UserProfile {
  patientId?: string;
  staffId?: string;
  userId?: string;
  name: string;
  role: string;
  phone?: string;
  email?: string;
  age?: string;
  allergies?: string[];
}

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  login: (userData: UserProfile) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function hydrateAndVerifySession() {
      const cachedUserStr = localStorage.getItem("sapthagiri_user");
      if (!cachedUserStr) {
        setLoading(false);
        return;
      }

      try {
        const cachedUser = JSON.parse(cachedUserStr) as UserProfile;
        const lookupId = cachedUser.role === "patient"
          ? cachedUser.patientId
          : cachedUser.staffId;

        if (!lookupId) {
          throw new Error("Malformed session profile.");
        }

        const response = await fetch("/api/auth/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ role: cachedUser.role, id: lookupId }),
        });

        if (!response.ok) {
          throw new Error("Backend verification failed.");
        }

        const data = await response.json() as { valid: boolean; user?: UserProfile };
        if (data.valid && data.user) {
          setUser(data.user);
          localStorage.setItem("sapthagiri_user", JSON.stringify(data.user));
          localStorage.setItem("sapthagiri_login_ts", new Date().toISOString());
        } else {
          throw new Error("Invalid session.");
        }
      } catch {
        localStorage.removeItem("sapthagiri_user");
        localStorage.removeItem("sapthagiri_login_ts");
        setUser(null);
      } finally {
        setLoading(false);
      }
    }

    hydrateAndVerifySession();
  }, []);

  const login = (userData: UserProfile) => {
    setUser(userData);
    localStorage.setItem("sapthagiri_user", JSON.stringify(userData));
    localStorage.setItem("sapthagiri_login_ts", new Date().toISOString());
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("sapthagiri_user");
    localStorage.removeItem("sapthagiri_login_ts");
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth requires an active AuthProvider.");
  }
  return context;
}

// ── Route Guards (auth-context-aware) ───────────────────────────────────────

function StaffGuard({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();
  useEffect(() => {
    if (loading) return;
    if (!user) { setLocation("/login"); return; }
    if (user.role === "patient") { setLocation("/patient"); return; }
  }, [user, loading, setLocation]);
  if (loading) return null;
  return <>{children}</>;
}

function PatientGuard({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();
  useEffect(() => {
    if (loading) return;
    if (!user) { setLocation("/login"); return; }
    if (user.role === "staff" || !user.role) { setLocation("/dashboard"); return; }
  }, [user, loading, setLocation]);
  if (loading) return null;
  return <>{children}</>;
}

// ── Router ──────────────────────────────────────────────────────────────────

function Router() {
  return (
    <Switch>
      <Route path="/" component={LandingPage} />
      <Route path="/login" component={LoginPage} />
      <Route path="/signup" component={SignUpPage} />
      <Route path="/staff/signup" component={StaffSignupPage} />
      <Route path="/dashboard">
        <StaffGuard>
          <Dashboard />
        </StaffGuard>
      </Route>
      <Route path="/patient">
        <PatientGuard>
          <PatientPortal />
        </PatientGuard>
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

// ── Inner App — reads AuthContext, renders routing ───────────────────────────

function AppInner() {
  const [splashDone, setSplashDone] = useState(false);
  const { loading } = useAuth();

  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-mono tracking-wider">Synchronizing session…</p>
        </div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        {!splashDone && <SplashScreen onDone={() => setSplashDone(true)} />}
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

// ── Default Export ───────────────────────────────────────────────────────────

export default function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  );
}
