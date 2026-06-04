export interface ForensicLogEntry {
  logId: string;
  eventType: "DOCTOR_CHAIN" | "DEATH_REPORT" | "RECOVERY_TRAJECTORY" | "AI_OVERRIDE" | "CROSS_HOSPITAL";
  timestamp: string;
  [key: string]: unknown;
}

interface ClinicalRealismChipsProps {
  triageLevel: string;
  completionStatus?: string;
  forensicLifecycleTimeline?: ForensicLogEntry[];
  aiOverrideTriggered?: boolean;
}

function deriveSurvivalState(triageLevel: string, completionStatus?: string): string {
  if (completionStatus === "DECEASED") return "Deceased";
  if (completionStatus === "COMPLETED") return "Discharged";
  if (triageLevel === "RED") return "Critical";
  if (triageLevel === "YELLOW") return "Stable";
  return "Recovering";
}

function stateColor(state: string): string {
  if (state === "Deceased") return "text-slate-500 border-slate-700";
  if (state === "Critical") return "text-red-400 border-red-900";
  if (state === "Stable") return "text-yellow-400 border-yellow-900";
  if (state === "Discharged") return "text-emerald-400 border-emerald-900";
  return "text-teal-400 border-teal-900";
}

export function ClinicalRealismChips({
  triageLevel,
  completionStatus,
  forensicLifecycleTimeline,
  aiOverrideTriggered,
}: ClinicalRealismChipsProps) {
  const state = deriveSurvivalState(triageLevel, completionStatus);
  const color = stateColor(state);
  const hasOverride =
    aiOverrideTriggered ||
    (forensicLifecycleTimeline?.some((l) => l.eventType === "AI_OVERRIDE") ?? false);
  const logCount = forensicLifecycleTimeline?.length ?? 0;

  return (
    <div className="flex flex-wrap gap-1.5 px-2 py-1.5 bg-slate-950 rounded-lg border border-slate-800 font-mono text-[10px]">
      <span className={`px-2 py-0.5 rounded border bg-slate-900 ${color}`}>
        🩺 SURVIVAL STATE: <strong>{state.toUpperCase()}</strong>
      </span>
      {hasOverride && (
        <span className="px-2 py-0.5 rounded bg-red-950/60 border border-red-900 text-red-400 font-bold animate-pulse">
          ⚠️ AI INTERVENTION DETECTED
        </span>
      )}
      <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-400">
        ⏱️ FORENSIC LOGS: {logCount}
      </span>
    </div>
  );
}
