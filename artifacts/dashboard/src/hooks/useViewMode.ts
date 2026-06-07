import { useState, useEffect } from "react";

export type ViewMode = "desktop" | "mobile";

const VM_KEY = "view_mode";
const VM_EVENT = "sapthagiri_viewmode";

function detectDefault(): ViewMode {
  const stored = localStorage.getItem(VM_KEY);
  if (stored === "desktop" || stored === "mobile") return stored;
  return typeof window !== "undefined" && window.innerWidth < 768 ? "mobile" : "desktop";
}

export function useViewMode(): ViewMode {
  const [mode, setMode] = useState<ViewMode>(detectDefault);

  useEffect(() => {
    const handler = (e: Event) => {
      setMode((e as CustomEvent<{ mode: ViewMode }>).detail.mode);
    };
    window.addEventListener(VM_EVENT, handler);
    return () => window.removeEventListener(VM_EVENT, handler);
  }, []);

  return mode;
}

export function switchViewMode(mode: ViewMode): void {
  localStorage.setItem(VM_KEY, mode);
  window.dispatchEvent(new CustomEvent(VM_EVENT, { detail: { mode } }));
  const meta = document.querySelector<HTMLMetaElement>('meta[name="viewport"]');
  if (meta) {
    meta.content = mode === "desktop"
      ? "width=1280"
      : "width=device-width, initial-scale=1.0";
  }
}
