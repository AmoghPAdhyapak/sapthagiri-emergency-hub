import { Link } from "wouter";
import { HeartPulse, Bot, Activity, Brain, Users, ShieldCheck, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function LandingPage() {
  const scrollToAbout = () => {
    document.getElementById("about")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-primary/20 p-2 rounded-md">
            <HeartPulse className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-foreground leading-none">Sapthagiri</h1>
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Healthcare & Emergency Care</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Button asChild variant="ghost" className="hidden md:inline-flex" data-testid="nav-signup-button">
            <Link href="/signup">Patient Registration</Link>
          </Button>
          <Button asChild data-testid="nav-login-button" className="glow-border">
            <Link href="/login">Staff Login</Link>
          </Button>
        </div>
      </nav>

      {/* Hero Section */}
      <section
        className="relative min-h-[90vh] flex flex-col items-center justify-center px-6 py-20 text-center overflow-hidden"
        style={{ background: 'radial-gradient(ellipse at 20% 50%, hsl(180 80% 8%) 0%, hsl(220 15% 4%) 60%)' }}
      >
        {/* Ambient floating orbs — pure CSS, zero JS */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
          <div className="absolute top-1/4 left-[8%]  w-72 h-72 rounded-full bg-primary/20 blur-3xl animate-orb-float" />
          <div className="absolute bottom-1/4 right-[8%] w-96 h-96 rounded-full bg-blue-500/15 blur-3xl animate-orb-float-alt" />
          <div className="absolute top-[55%] left-[45%] w-56 h-56 rounded-full bg-primary/10 blur-2xl animate-orb-drift" />
          {/* Subtle teal grid mesh */}
          <div
            className="absolute inset-0 animate-grid-fade"
            style={{
              backgroundImage:
                'linear-gradient(hsl(180 70% 50% / 0.04) 1px, transparent 1px), linear-gradient(90deg, hsl(180 70% 50% / 0.04) 1px, transparent 1px)',
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
          <span
            className="text-primary"
            style={{ textShadow: "0 0 40px hsl(180 70% 50% / 0.4)" }}
          >
            Emergency
          </span>
          <br />Care
        </h1>
        <p className="relative text-xl md:text-2xl text-muted-foreground max-w-xl mb-4 z-10 leading-relaxed">
          AI-powered triage. Real-time patient monitoring.
          <br className="hidden md:inline" /> Critical care support.
        </p>

        {/* Glassmorphism stat pill */}
        <div className="relative z-10 mb-10 flex items-center gap-2 glass-panel px-5 py-2.5 rounded-full border border-primary/20 text-xs font-semibold text-primary uppercase tracking-widest">
          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          Gemini AI · Doctor-Verified Records · Live Monitoring
        </div>

        <div className="relative z-10 flex flex-col sm:flex-row items-center gap-4 mb-16">
          <Button
            asChild
            size="lg"
            className="text-base px-10 h-13 font-bold shadow-[0_0_25px_hsl(180_70%_50%_/_0.35)] hover:shadow-[0_0_35px_hsl(180_70%_50%_/_0.5)] transition-shadow"
            data-testid="hero-dashboard-button"
          >
            <Link href="/login">Open Emergency Dashboard</Link>
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="text-base px-10 h-13 border-border/60 hover:border-primary/50 hover:text-primary transition-colors"
            onClick={scrollToAbout}
            data-testid="hero-learn-more-button"
          >
            Learn More
          </Button>
        </div>

        <div className="relative z-10 flex items-center justify-center gap-8 text-xs text-muted-foreground font-medium uppercase tracking-wider flex-wrap">
          <span className="flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" /> 1,000+ Patients Treated
          </span>
          <span className="hidden sm:block w-px h-4 bg-border" />
          <span className="flex items-center gap-2">
            <Bot className="w-4 h-4 text-primary" /> 24/7 AI Triage
          </span>
          <span className="hidden sm:block w-px h-4 bg-border" />
          <span className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary" /> &lt; 3min Response Time
          </span>
        </div>
      </section>

      {/* About Section */}
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

      {/* Emergency Services */}
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

      {/* AI Assistant Section */}
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
            <Button asChild size="lg" data-testid="try-ai-button">
              <Link href="/login">Access Clinical Dashboard</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-24 px-6 bg-background">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-12 text-foreground">Why Sapthagiri Healthcare</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="flex flex-col items-center text-center p-4">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <Activity className="w-8 h-8 text-foreground" />
              </div>
              <h4 className="font-semibold mb-2">Rapid Response</h4>
              <p className="text-sm text-muted-foreground">Under 3 minutes triage time</p>
            </div>
            <div className="flex flex-col items-center text-center p-4">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <Brain className="w-8 h-8 text-foreground" />
              </div>
              <h4 className="font-semibold mb-2">AI-Powered</h4>
              <p className="text-sm text-muted-foreground">Intelligent clinical analysis</p>
            </div>
            <div className="flex flex-col items-center text-center p-4">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <ShieldCheck className="w-8 h-8 text-foreground" />
              </div>
              <h4 className="font-semibold mb-2">Secure Records</h4>
              <p className="text-sm text-muted-foreground">Doctor-verified edits only</p>
            </div>
            <div className="flex flex-col items-center text-center p-4">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <Phone className="w-8 h-8 text-foreground" />
              </div>
              <h4 className="font-semibold mb-2">Patient-Centered</h4>
              <p className="text-sm text-muted-foreground">Phone-first patient identity</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card border-t border-border py-12 px-6 mt-auto">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <HeartPulse className="w-5 h-5 text-primary" />
            <span className="font-bold text-foreground">Sapthagiri Healthcare</span>
          </div>
          <div className="flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
            <button onClick={scrollToAbout} className="hover:text-primary transition-colors">About</button>
            <Link href="/login" className="hover:text-primary transition-colors">Emergency Access</Link>
            <Link href="/login" className="hover:text-primary transition-colors">AI Assistant</Link>
            <Link href="/signup" className="hover:text-primary transition-colors">Patient Registration</Link>
          </div>
        </div>
        <div className="max-w-6xl mx-auto mt-8 pt-8 border-t border-border/50 text-center flex flex-col gap-4">
          <p className="text-sm font-semibold text-destructive">
            Not a replacement for emergency services. Call 108 immediately for life-threatening emergencies.
          </p>
          <p className="text-xs text-muted-foreground">
            © 2025 Sapthagiri Healthcare & Emergency Care. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
