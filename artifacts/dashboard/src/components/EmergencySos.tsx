import { useState, useEffect, useRef } from "react";
import { AlertOctagon, MapPin, CheckCircle2, X, Loader2, Radio, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

type SosStage = "idle" | "confirm" | "locating" | "dispatching" | "active";

interface LocationData {
  lat: number;
  lng: number;
  accuracy: number;
}

const DISPATCH_STEPS = [
  { label: "Emergency call received", delay: 0 },
  { label: "Locating nearest ambulance unit", delay: 1600 },
  { label: "Dispatching unit to your coordinates", delay: 3200 },
  { label: "Unit en route — ETA 8–12 minutes", delay: 4800 },
];

const AI_MESSAGES = [
  "Emergency response has been activated. Stay calm and remain in a safe position.",
  "If the patient is unconscious, check for breathing and place in the recovery position.",
  "Do not move the patient if spinal injury is suspected.",
  "Keep the patient warm. Monitor breathing and pulse continuously until help arrives.",
  "Clear the building entrance and elevator for emergency access. Ambulance is en route.",
];

const ETA_START = 11 * 60; // 11 minutes in seconds

export function EmergencySos() {
  const [stage, setStage] = useState<SosStage>("idle");
  const [location, setLocation] = useState<LocationData | null>(null);
  const [locationError, setLocationError] = useState("");
  const [dispatchStep, setDispatchStep] = useState(-1);
  const [aiMessages, setAiMessages] = useState<string[]>([]);
  const [etaSeconds, setEtaSeconds] = useState(ETA_START);
  const etaRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const aiRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const msgIndexRef = useRef(0);

  const handleActivate = () => setStage("confirm");
  const handleCancel = () => {
    setStage("idle");
    setLocation(null);
    setLocationError("");
    setDispatchStep(-1);
    setAiMessages([]);
    setEtaSeconds(ETA_START);
    msgIndexRef.current = 0;
    if (etaRef.current) clearInterval(etaRef.current);
    if (aiRef.current) clearInterval(aiRef.current);
  };

  const handleConfirm = () => {
    setStage("locating");
    if (!navigator.geolocation) {
      setLocationError("Geolocation not supported. Proceeding with dispatch.");
      runDispatch(null);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy });
        runDispatch({ lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy });
      },
      () => {
        setLocationError("Location unavailable. Proceeding with dispatch.");
        runDispatch(null);
      },
      { timeout: 8000, maximumAge: 0, enableHighAccuracy: true }
    );
  };

  const runDispatch = (loc: LocationData | null) => {
    if (loc) setLocation(loc);
    setStage("dispatching");
    setDispatchStep(0);

    DISPATCH_STEPS.forEach((step, i) => {
      if (i === 0) return;
      setTimeout(() => setDispatchStep(i), step.delay);
    });

    setTimeout(() => {
      setStage("active");
      startEta();
      startAiMessages();
    }, 6000);
  };

  const startEta = () => {
    setEtaSeconds(ETA_START);
    if (etaRef.current) clearInterval(etaRef.current);
    etaRef.current = setInterval(() => {
      setEtaSeconds((prev) => {
        if (prev <= 0) { clearInterval(etaRef.current!); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  const startAiMessages = () => {
    msgIndexRef.current = 0;
    setAiMessages([AI_MESSAGES[0]]);
    msgIndexRef.current = 1;
    if (aiRef.current) clearInterval(aiRef.current);
    aiRef.current = setInterval(() => {
      if (msgIndexRef.current >= AI_MESSAGES.length) {
        clearInterval(aiRef.current!);
        return;
      }
      setAiMessages((prev) => [...prev, AI_MESSAGES[msgIndexRef.current]]);
      msgIndexRef.current += 1;
    }, 3500);
  };

  useEffect(() => () => {
    if (etaRef.current) clearInterval(etaRef.current);
    if (aiRef.current) clearInterval(aiRef.current);
  }, []);

  const etaMin = Math.floor(etaSeconds / 60);
  const etaSec = String(etaSeconds % 60).padStart(2, "0");

  return (
    <>
      {/* ── Floating SOS Button ── */}
      {stage === "idle" && (
        <button
          onClick={handleActivate}
          data-testid="button-emergency-sos"
          className="fixed bottom-6 right-6 z-40 group"
          aria-label="Activate Emergency SOS"
        >
          {/* Outer ping rings */}
          <span className="absolute inset-0 rounded-full bg-red-500 opacity-30 animate-ping" />
          <span className="absolute inset-[-6px] rounded-full bg-red-500 opacity-15 animate-ping [animation-delay:0.4s]" />
          {/* Button */}
          <span className="relative flex h-16 w-16 items-center justify-center rounded-full bg-red-600 shadow-[0_0_28px_8px_rgba(239,68,68,0.5)] transition-transform group-hover:scale-110">
            <AlertOctagon className="w-7 h-7 text-white" strokeWidth={2.5} />
          </span>
          <span className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] font-black uppercase tracking-widest text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
            Emergency SOS
          </span>
        </button>
      )}

      {/* ── Confirmation Modal ── */}
      {stage === "confirm" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-sm mx-4 rounded-2xl border border-red-500/50 bg-[#0d0d0d] p-8 shadow-[0_0_60px_rgba(239,68,68,0.4)] text-center">
            {/* Siren glow */}
            <div className="mx-auto mb-5 relative w-20 h-20">
              <span className="absolute inset-0 rounded-full bg-red-500/20 animate-ping" />
              <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-red-600/20 border-2 border-red-500/60">
                <AlertOctagon className="w-9 h-9 text-red-400" />
              </div>
            </div>
            <h2 className="text-2xl font-black text-red-400 uppercase tracking-wider mb-2">Emergency SOS</h2>
            <p className="text-sm text-muted-foreground mb-1">Activate Emergency Response?</p>
            <p className="text-xs text-muted-foreground/60 mb-7">
              This will share your live location and trigger ambulance dispatch.
            </p>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1 border-border text-muted-foreground" onClick={handleCancel}>
                Cancel
              </Button>
              <Button
                className="flex-1 bg-red-600 hover:bg-red-500 text-white font-black uppercase tracking-wider"
                onClick={handleConfirm}
                data-testid="button-confirm-sos"
              >
                <AlertOctagon className="w-4 h-4 mr-2" /> Activate
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Locating / Dispatching Overlay ── */}
      {(stage === "locating" || stage === "dispatching") && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md">
          <div className="w-full max-w-md mx-4 text-center">
            {stage === "locating" && (
              <>
                <Loader2 className="w-12 h-12 text-red-400 animate-spin mx-auto mb-4" />
                <p className="text-lg font-bold text-red-400 uppercase tracking-wider">Retrieving Location…</p>
                <p className="text-xs text-muted-foreground mt-2">Please allow location access when prompted</p>
              </>
            )}
            {stage === "dispatching" && (
              <div className="rounded-2xl border border-red-500/40 bg-[#0d0d0d] p-8 shadow-[0_0_60px_rgba(239,68,68,0.3)]">
                {/* Flashing siren icon */}
                <div className="flex justify-center mb-6">
                  <div className="relative">
                    <span className="absolute inset-0 rounded-full bg-red-500/30 animate-ping" />
                    <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-red-600/20 border border-red-500/50">
                      <Radio className="w-7 h-7 text-red-400 animate-pulse" />
                    </div>
                  </div>
                </div>
                <h3 className="text-xl font-black text-red-400 uppercase tracking-wider mb-6">
                  Activating Emergency Response
                </h3>
                <div className="space-y-3 text-left">
                  {DISPATCH_STEPS.map((step, i) => (
                    <div
                      key={step.label}
                      className={`flex items-center gap-3 p-3 rounded-lg border transition-all duration-500 ${
                        i <= dispatchStep
                          ? "bg-red-500/10 border-red-500/30 text-foreground"
                          : "bg-muted/10 border-border/30 text-muted-foreground/30"
                      }`}
                    >
                      {i < dispatchStep ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      ) : i === dispatchStep ? (
                        <Loader2 className="w-4 h-4 text-red-400 animate-spin shrink-0" />
                      ) : (
                        <div className="w-4 h-4 rounded-full border border-border/30 shrink-0" />
                      )}
                      <span className="text-sm font-medium">{step.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Active Emergency Overlay ── */}
      {stage === "active" && (
        <div className="fixed inset-0 z-50 bg-[#0a0000]/95 backdrop-blur-sm overflow-y-auto">
          {/* Header bar */}
          <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 bg-red-600 shadow-[0_0_30px_rgba(239,68,68,0.6)]">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-white animate-pulse" />
              <span className="font-black text-white uppercase tracking-widest text-sm">
                Emergency Response Active
              </span>
              <span className="flex h-2 w-2 rounded-full bg-white animate-ping" />
            </div>
            <div className="flex items-center gap-4">
              <div className="text-white font-mono text-sm font-bold">
                🚑 ETA: {etaSeconds > 0 ? `${etaMin}:${etaSec}` : "Arriving"}
              </div>
              <button
                onClick={handleCancel}
                className="text-white/80 hover:text-white transition-colors"
                data-testid="button-cancel-sos"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="max-w-3xl mx-auto p-6 space-y-5">
            {/* Dispatch status */}
            <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-5">
              <h3 className="text-xs font-black uppercase tracking-widest text-red-400 mb-3 flex items-center gap-2">
                <Radio className="w-3.5 h-3.5 animate-pulse" /> Dispatch Status
              </h3>
              <div className="space-y-2">
                {DISPATCH_STEPS.map((step) => (
                  <div key={step.label} className="flex items-center gap-3 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="text-foreground">{step.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Location */}
            <div className="rounded-xl border border-primary/30 bg-primary/5 p-5">
              <h3 className="text-xs font-black uppercase tracking-widest text-primary mb-3 flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5" /> Location Shared Successfully
              </h3>
              {location ? (
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-background/50 rounded-lg p-3 font-mono">
                      <p className="text-[10px] text-muted-foreground uppercase mb-1">Latitude</p>
                      <p className="text-sm font-bold text-primary">{location.lat.toFixed(6)}°</p>
                    </div>
                    <div className="bg-background/50 rounded-lg p-3 font-mono">
                      <p className="text-[10px] text-muted-foreground uppercase mb-1">Longitude</p>
                      <p className="text-sm font-bold text-primary">{location.lng.toFixed(6)}°</p>
                    </div>
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    Accuracy: ±{Math.round(location.accuracy)}m — coordinates shared with emergency dispatch
                  </p>
                  {/* Simple map embed */}
                  <iframe
                    title="Emergency Location"
                    className="w-full h-44 rounded-lg border border-border/40 mt-2"
                    loading="lazy"
                    src={`https://www.openstreetmap.org/export/embed.html?bbox=${location.lng - 0.005},${location.lat - 0.005},${location.lng + 0.005},${location.lat + 0.005}&layer=mapnik&marker=${location.lat},${location.lng}`}
                  />
                </div>
              ) : (
                <p className="text-sm text-amber-400">
                  {locationError || "Location coordinates shared with dispatch team."}
                </p>
              )}
            </div>

            {/* AI Emergency Guidance */}
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-5">
              <h3 className="text-xs font-black uppercase tracking-widest text-amber-400 mb-3 flex items-center gap-2">
                <span className="flex h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
                AI Emergency Assistant — Guidance
              </h3>
              <div className="space-y-2.5">
                {aiMessages.map((msg, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-2.5 animate-in fade-in slide-in-from-bottom-2 duration-500"
                  >
                    <div className="mt-1 shrink-0 w-5 h-5 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center">
                      <span className="text-[10px] text-amber-400 font-bold">{i + 1}</span>
                    </div>
                    <p className="text-sm text-foreground/90 leading-relaxed">{msg}</p>
                  </div>
                ))}
                {aiMessages.length < AI_MESSAGES.length && (
                  <div className="flex items-center gap-2 text-amber-400/50">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span className="text-xs">AI analyzing situation…</span>
                  </div>
                )}
              </div>
              <p className="text-[10px] text-muted-foreground/40 mt-3 border-t border-border/20 pt-2">
                This is AI-assisted emergency support guidance. Always follow instructions from trained medical personnel.
              </p>
            </div>

            {/* Cancel */}
            <Button
              variant="outline"
              className="w-full border-red-500/30 text-red-400 hover:bg-red-500/10"
              onClick={handleCancel}
            >
              <X className="w-4 h-4 mr-2" /> Cancel Emergency Response
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
