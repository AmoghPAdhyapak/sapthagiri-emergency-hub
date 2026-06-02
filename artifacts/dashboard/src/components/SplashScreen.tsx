import { useEffect, useState } from "react";
import splashLogo from "@assets/ChatGPT_image_logo_Image_Jun_2,_2026,_02_27_22_PM_1780393955376.png";

interface SplashScreenProps {
  onDone: () => void;
}

export function SplashScreen({ onDone }: SplashScreenProps) {
  const [phase, setPhase] = useState<"enter" | "hold" | "exit">("enter");

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("hold"), 100);
    const t2 = setTimeout(() => setPhase("exit"), 2800);
    const t3 = setTimeout(() => onDone(), 3500);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [onDone]);

  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#020817]"
      style={{
        opacity: phase === "exit" ? 0 : 1,
        transition: phase === "exit" ? "opacity 0.7s ease-in-out" : "none",
      }}
    >
      {/* Ambient glow layers */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full"
          style={{
            background: "radial-gradient(circle, rgba(0,150,255,0.08) 0%, transparent 70%)",
            animation: "pulse 3s ease-in-out infinite",
          }}
        />
        <div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full"
          style={{
            background: "radial-gradient(circle, rgba(0,200,255,0.06) 0%, transparent 70%)",
            animation: "pulse 2s ease-in-out infinite 0.5s",
          }}
        />
      </div>

      {/* Content */}
      <div
        className="relative flex flex-col items-center gap-6"
        style={{
          opacity: phase === "enter" ? 0 : 1,
          transform: phase === "enter" ? "scale(0.88) translateY(12px)" : "scale(1) translateY(0)",
          transition: "opacity 0.8s ease-out, transform 0.8s cubic-bezier(0.34,1.2,0.64,1)",
        }}
      >
        {/* Logo with glow ring */}
        <div className="relative">
          <div
            className="absolute inset-0 rounded-full"
            style={{
              boxShadow: "0 0 60px 20px rgba(0,180,255,0.18), 0 0 120px 40px rgba(0,100,255,0.1)",
            }}
          />
          <img
            src={splashLogo}
            alt="Sapthagiri NPS University"
            className="relative w-44 h-44 object-contain drop-shadow-2xl"
            style={{ filter: "drop-shadow(0 0 24px rgba(0,180,255,0.4))" }}
          />
        </div>

        {/* Brand text */}
        <div
          className="text-center"
          style={{
            opacity: phase === "enter" ? 0 : 1,
            transform: phase === "enter" ? "translateY(8px)" : "translateY(0)",
            transition: "opacity 0.7s ease-out 0.35s, transform 0.7s ease-out 0.35s",
          }}
        >
          <h1 className="text-3xl font-black text-white uppercase tracking-[0.18em] mb-1">
            Sapthagiri <span className="text-cyan-400">NPS</span>
          </h1>
          <p className="text-sm font-bold text-slate-400 uppercase tracking-[0.25em] mb-0.5">
            Institute of Medical Sciences & Research Center
          </p>
          <p className="text-xs font-mono text-cyan-500/70 uppercase tracking-widest">
            AI-Assisted Healthcare Platform
          </p>
        </div>

        {/* Loading bar */}
        <div
          className="w-56 h-0.5 bg-slate-800 rounded-full overflow-hidden"
          style={{
            opacity: phase === "enter" ? 0 : 1,
            transition: "opacity 0.5s ease-out 0.6s",
          }}
        >
          <div
            className="h-full bg-gradient-to-r from-cyan-500 via-blue-400 to-cyan-500 rounded-full"
            style={{
              width: phase === "hold" || phase === "exit" ? "100%" : "0%",
              transition: "width 2.2s cubic-bezier(0.4,0,0.2,1) 0.7s",
              boxShadow: "0 0 8px rgba(0,210,255,0.8)",
            }}
          />
        </div>

        {/* Status text */}
        <p
          className="text-[10px] font-mono text-slate-600 uppercase tracking-[0.3em]"
          style={{
            opacity: phase === "enter" ? 0 : 1,
            transition: "opacity 0.5s ease-out 0.8s",
          }}
        >
          Initializing Emergency Systems…
        </p>
      </div>

      {/* Bottom badge */}
      <div
        className="absolute bottom-8 text-center"
        style={{
          opacity: phase === "enter" ? 0 : 0.4,
          transition: "opacity 0.6s ease-out 1s",
        }}
      >
        <p className="text-[10px] font-mono text-slate-600 uppercase tracking-widest">
          Sapthagiri Medical Care Portal · v2025
        </p>
      </div>
    </div>
  );
}
