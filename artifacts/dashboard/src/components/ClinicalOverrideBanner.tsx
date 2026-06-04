import { useState, useEffect } from "react";
import { ShieldAlert } from "lucide-react";

export interface OverrideSignal {
  active: boolean;
  message: string;
}

export function ClinicalOverrideBanner({ overrideSignal }: { overrideSignal: OverrideSignal | null }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!overrideSignal?.active) return;
    setVisible(true);
    const timer = setTimeout(() => setVisible(false), 7000);
    return () => clearTimeout(timer);
  }, [overrideSignal]);

  if (!visible) return null;

  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] w-full max-w-xl px-4">
      <div className="bg-red-950 border-2 border-red-600 text-red-200 px-4 py-3 rounded-xl shadow-2xl font-mono text-xs flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
        <div className="flex-1">
          <strong className="text-red-400 block uppercase tracking-wider text-[10px]">
            CRITICAL CLINICAL OVERRIDE ACTIVATED
          </strong>
          <p className="mt-0.5 text-slate-200">{overrideSignal?.message}</p>
          <span className="text-[9px] text-red-500 block mt-1 uppercase font-bold">
            Safeguard Override: Patient locked into RED Emergency Hub.
          </span>
        </div>
      </div>
    </div>
  );
}
