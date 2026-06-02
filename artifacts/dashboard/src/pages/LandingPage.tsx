import { Link } from "wouter";
import { HeartPulse, Bot, Activity, Brain, Users, ShieldCheck } from "lucide-react";
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
            <Link href="/signup">Sign Up</Link>
          </Button>
          <Button asChild data-testid="nav-login-button" className="glow-border">
            <Link href="/login">Emergency Login</Link>
          </Button>
        </div>
      </nav>

      {/* Hero Section */}
      <section 
        className="relative min-h-[90vh] flex flex-col items-center justify-center px-6 py-20 text-center overflow-hidden"
        style={{ background: 'radial-gradient(ellipse at 20% 50%, hsl(180 80% 8%) 0%, hsl(220 15% 4%) 60%)' }}
      >
        <div className="absolute top-10 flex items-center gap-2 bg-red-500/10 text-red-500 border border-red-500/20 px-4 py-1.5 rounded-full text-sm font-semibold tracking-wider animate-pulse">
          <span className="w-2 h-2 rounded-full bg-red-500" />
          🔴 LIVE Emergency System
        </div>
        
        <h1 className="text-5xl md:text-7xl font-black tracking-tight max-w-4xl leading-tight mt-12 mb-6">
          Advanced <span className="text-primary glow-text">Emergency</span> Care
        </h1>
        <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mb-10">
          AI-powered triage. Real-time monitoring. Student-ready care.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center gap-4 mb-16">
          <Button asChild size="lg" className="text-lg px-8 h-14" data-testid="hero-dashboard-button">
            <Link href="/login">Open Emergency Dashboard</Link>
          </Button>
          <Button variant="outline" size="lg" className="text-lg px-8 h-14" onClick={scrollToAbout} data-testid="hero-learn-more-button">
            Learn More
          </Button>
        </div>
        
        <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground font-medium uppercase tracking-wider flex-wrap">
          <span className="flex items-center gap-2"><Users className="w-4 h-4 text-primary" /> 500+ Students Served</span>
          <span className="hidden sm:inline-block w-1.5 h-1.5 rounded-full bg-border" />
          <span className="flex items-center gap-2"><Bot className="w-4 h-4 text-primary" /> 24/7 AI Triage</span>
          <span className="hidden sm:inline-block w-1.5 h-1.5 rounded-full bg-border" />
          <span className="flex items-center gap-2"><Activity className="w-4 h-4 text-primary" /> &lt; 3min Response Time</span>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-24 px-6 bg-card">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl font-bold mb-6 text-foreground">About Sapthagiri Healthcare</h2>
            <p className="text-lg text-muted-foreground mb-6">
              Our commitment to student wellness drives our innovation. Through our partnership with leading medical faculty, we've developed an AI-powered emergency response system that prioritizes rapid, accurate care when every second counts.
            </p>
            <p className="text-lg text-muted-foreground">
              Sapthagiri Student Healthcare System provides an unparalleled safety net, combining human expertise with cutting-edge artificial intelligence to ensure our community is always protected.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Card className="bg-background border-border/50">
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-black text-primary mb-2">2,400+</div>
                <div className="text-sm font-medium text-muted-foreground uppercase">Students</div>
              </CardContent>
            </Card>
            <Card className="bg-background border-border/50">
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-black text-primary mb-2">98.7%</div>
                <div className="text-sm font-medium text-muted-foreground uppercase">Satisfaction</div>
              </CardContent>
            </Card>
            <Card className="bg-background border-border/50">
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-black text-primary mb-2">&lt; 3min</div>
                <div className="text-sm font-medium text-muted-foreground uppercase">Response</div>
              </CardContent>
            </Card>
            <Card className="bg-background border-border/50">
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-black text-primary mb-2">24/7</div>
                <div className="text-sm font-medium text-muted-foreground uppercase">AI Support</div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Emergency Services */}
      <section className="py-24 px-6 bg-background">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold mb-12 text-center text-foreground">Core Services</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="border-red-500/20 bg-red-500/5 hover:bg-red-500/10 transition-colors">
              <CardContent className="p-8">
                <Activity className="w-12 h-12 text-red-500 mb-6" />
                <h3 className="text-xl font-bold text-foreground mb-3">Emergency Triage</h3>
                <p className="text-muted-foreground">Instant severity classification and routing for critical cases, ensuring the most urgent patients are seen first.</p>
              </CardContent>
            </Card>
            <Card className="border-primary/20 bg-primary/5 hover:bg-primary/10 transition-colors glow-border">
              <CardContent className="p-8">
                <Brain className="w-12 h-12 text-primary mb-6" />
                <h3 className="text-xl font-bold text-foreground mb-3">AI Diagnostics</h3>
                <p className="text-muted-foreground">Advanced symptom analysis powered by Google Gemini, providing rapid preliminary assessments to aid medical staff.</p>
              </CardContent>
            </Card>
            <Card className="border-blue-500/20 bg-blue-500/5 hover:bg-blue-500/10 transition-colors">
              <CardContent className="p-8">
                <ShieldCheck className="w-12 h-12 text-blue-500 mb-6" />
                <h3 className="text-xl font-bold text-foreground mb-3">24/7 Monitoring</h3>
                <p className="text-muted-foreground">Continuous vital tracking and automated alerting system that never sleeps, keeping a watchful eye on patient stability.</p>
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
                    I'm feeling a sharp pain in my lower right abdomen that started 2 hours ago.
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                    <Bot className="w-4 h-4 text-primary" />
                  </div>
                  <div className="bg-primary/10 border border-primary/20 rounded-2xl rounded-tl-none px-4 py-3 text-sm text-foreground">
                    <p className="font-semibold text-primary mb-1">Priority Alert</p>
                    <p>Sharp pain in the lower right abdomen can be a sign of appendicitis, a medical emergency. Please report to the Emergency Department immediately or call 108.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="order-1 md:order-2">
            <h2 className="text-4xl font-bold mb-6 text-foreground">Meet Your AI Health Assistant</h2>
            <p className="text-lg text-muted-foreground mb-6">
              Powered by Google Gemini, our intelligent assistant provides instant symptom guidance and triage support. It helps categorize urgency before you even reach the desk.
            </p>
            <div className="bg-destructive/10 text-destructive border border-destructive/20 p-4 rounded-lg text-sm mb-8">
              <strong>Disclaimer:</strong> This AI tool is for preliminary guidance only and is not a replacement for professional medical diagnosis or doctors.
            </div>
            <Button asChild size="lg" data-testid="try-ai-button">
              <Link href="/login">Try AI Assistant</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-24 px-6 bg-background">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-12 text-foreground">Why Choose Sapthagiri</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="flex flex-col items-center text-center p-4">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <Activity className="w-8 h-8 text-foreground" />
              </div>
              <h4 className="font-semibold mb-2">Fast Response</h4>
              <p className="text-sm text-muted-foreground">Under 3 minutes triage time</p>
            </div>
            <div className="flex flex-col items-center text-center p-4">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <Brain className="w-8 h-8 text-foreground" />
              </div>
              <h4 className="font-semibold mb-2">AI-Powered</h4>
              <p className="text-sm text-muted-foreground">Smart predictive analysis</p>
            </div>
            <div className="flex flex-col items-center text-center p-4">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <ShieldCheck className="w-8 h-8 text-foreground" />
              </div>
              <h4 className="font-semibold mb-2">Secure & Private</h4>
              <p className="text-sm text-muted-foreground">Enterprise-grade protection</p>
            </div>
            <div className="flex flex-col items-center text-center p-4">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <Users className="w-8 h-8 text-foreground" />
              </div>
              <h4 className="font-semibold mb-2">Student-Focused</h4>
              <p className="text-sm text-muted-foreground">Tailored for campus life</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card border-t border-border py-12 px-6 mt-auto">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <HeartPulse className="w-5 h-5 text-primary" />
            <span className="font-bold text-foreground">Sapthagiri</span>
          </div>
          <div className="flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
            <button onClick={scrollToAbout} className="hover:text-primary transition-colors">About</button>
            <Link href="/login" className="hover:text-primary transition-colors">Emergency</Link>
            <Link href="/login" className="hover:text-primary transition-colors">AI Assistant</Link>
            <Link href="/login" className="hover:text-primary transition-colors">Login</Link>
          </div>
        </div>
        <div className="max-w-6xl mx-auto mt-8 pt-8 border-t border-border/50 text-center flex flex-col gap-4">
          <p className="text-sm font-semibold text-destructive">
            Not a replacement for emergency services. Call 108 for life-threatening emergencies.
          </p>
          <p className="text-xs text-muted-foreground">
            © 2025 Sapthagiri Student Healthcare System. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}