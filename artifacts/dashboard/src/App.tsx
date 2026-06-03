import { useEffect, useState, ReactNode } from "react";
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

function getStoredUser(): { role?: string } | null {
  try {
    const s = localStorage.getItem("sapthagiri_user");
    return s ? (JSON.parse(s) as { role?: string }) : null;
  } catch {
    return null;
  }
}

function StaffGuard({ children }: { children: ReactNode }) {
  const [, setLocation] = useLocation();
  useEffect(() => {
    const user = getStoredUser();
    if (!user) { setLocation("/login"); return; }
    if (user.role === "patient") { setLocation("/patient"); return; }
  }, [setLocation]);
  return <>{children}</>;
}

function PatientGuard({ children }: { children: ReactNode }) {
  const [, setLocation] = useLocation();
  useEffect(() => {
    const user = getStoredUser();
    if (!user) { setLocation("/login"); return; }
    if (user.role === "staff" || !user.role) { setLocation("/dashboard"); return; }
  }, [setLocation]);
  return <>{children}</>;
}

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

function App() {
  const [splashDone, setSplashDone] = useState(false);

  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);

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

export default App;
