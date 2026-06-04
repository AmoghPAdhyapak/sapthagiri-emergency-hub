import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// ── One-time session reset: clears all legacy test data ────────────────────
// Bump SESSION_VERSION to trigger a fresh wipe. After it runs once, the new
// version is stored and this block never executes again — persistence is fully
// intact for any accounts created after this point.
const SESSION_VERSION = "v4-clean";
if (localStorage.getItem("sapthagiri_session_ver") !== SESSION_VERSION) {
  // Clear all static sapthagiri_* and encounter cache keys
  const STATIC_KEYS = [
    "sapthagiri_user",
    "sapthagiri_login_ts",
    "sapthagiri_doctors",
    "sapthagiri_dean_alerts",
    "sapthagiri_medical_notes",
    "sapthagiri_auth_version",
    "HOSPITAL_DB_ENCOUNTERS_RED",
    "HOSPITAL_DB_ENCOUNTERS_YELLOW",
    "HOSPITAL_DB_ENCOUNTERS_GREEN",
  ];
  STATIC_KEYS.forEach((k) => localStorage.removeItem(k));

  // Clear dynamic keys: sapthagiri_med_<phone> (medical timeline per patient)
  const dynamicKeys: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith("sapthagiri_med_")) dynamicKeys.push(key);
  }
  dynamicKeys.forEach((k) => localStorage.removeItem(k));

  // Brand the new version so cleanup never fires again
  localStorage.setItem("sapthagiri_session_ver", SESSION_VERSION);
}

createRoot(document.getElementById("root")!).render(<App />);
