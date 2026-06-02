import { useState, useEffect } from "react";
import { StatsBar } from "@/components/StatsBar";
import { AdmitPatientForm } from "@/components/AdmitPatientForm";
import { PatientList } from "@/components/PatientList";
import { Activity, Bot } from "lucide-react";
import { AiChatPanel } from "@/components/AiChatPanel";
import { Button } from "@/components/ui/button";

export default function Dashboard() {
  const [isChatOpen, setIsChatOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans selection:bg-primary selection:text-primary-foreground overflow-hidden relative">
      {/* Top Navigation / Header */}
      <header className="border-b border-border bg-card px-6 py-4 flex items-center justify-between shadow-sm shrink-0">
        <div className="flex items-center gap-3">
          <div className="bg-red-500/20 p-2 rounded-md">
            <Activity className="w-6 h-6 text-red-500" />
          </div>
          <div>
            <h1 className="text-xl font-black uppercase tracking-widest text-primary leading-tight">
              Triage Control
            </h1>
            <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest">
              Smart Patient Emergency & Monitoring System
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            size="sm" 
            className="border-primary/50 text-primary hover:bg-primary/20 bg-background/50"
            onClick={() => setIsChatOpen(!isChatOpen)}
            data-testid="button-toggle-ai-chat"
          >
            <Bot className="w-4 h-4 mr-2" />
            AI Assistant
          </Button>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-mono text-emerald-500 uppercase tracking-widest font-bold">Live System Active</span>
          </div>
          <div className="h-6 w-px bg-border mx-2" />
          <div className="text-xs font-mono text-muted-foreground text-right leading-tight">
            <div>{new Date().toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</div>
            <LiveClock />
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 p-6 flex flex-col gap-6 max-w-[1800px] mx-auto w-full">
        {/* Stats Row */}
        <section>
          <StatsBar />
        </section>

        {/* Dashboard Grid */}
        <section className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
          {/* Admit Form (Sidebar) */}
          <div className="lg:col-span-1">
            <AdmitPatientForm />
          </div>
          
          {/* Active Patient List (Main Area) */}
          <div className="lg:col-span-3 flex flex-col h-full bg-card rounded-lg border border-border shadow-md overflow-hidden">
            <div className="px-4 py-3 border-b border-border bg-muted/30 flex items-center justify-between">
              <h2 className="font-bold uppercase tracking-wider text-sm flex items-center">
                <span className="w-2 h-2 bg-primary rounded-full mr-2" />
                Live Patient Monitoring
              </h2>
              <span className="text-xs font-mono text-muted-foreground uppercase">Auto-refresh: 5s</span>
            </div>
            <div className="p-4 flex-1 overflow-auto bg-background/50 relative">
              <PatientList />
            </div>
          </div>
        </section>
      </main>

      <AiChatPanel isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
    </div>
  );
}

function LiveClock() {
  const [time, setTime] = useState(new Date());
  
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  
  return (
    <div className="font-bold text-foreground">
      {time.toLocaleTimeString('en-US', { hour12: false })}
    </div>
  );
}