import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

const SESSION_VERSION = "v4-clean";
const CURRENT_VERSION_KEY = "sapthagiri_session_ver";

// Safe migration: on version bump, clear stale cache keys but RETAIN the
// authenticated user profile and login timestamp so the AuthProvider can
// rehydrate the session against the backend on next load.
function executeSafeMigration(): void {
  const systemVersion = localStorage.getItem(CURRENT_VERSION_KEY);
  if (systemVersion !== SESSION_VERSION) {
    const RETAINED = {
      user: localStorage.getItem("sapthagiri_user"),
      loginTs: localStorage.getItem("sapthagiri_login_ts"),
    };

    localStorage.clear();

    if (RETAINED.user) {
      localStorage.setItem("sapthagiri_user", RETAINED.user);
    }
    if (RETAINED.loginTs) {
      localStorage.setItem("sapthagiri_login_ts", RETAINED.loginTs);
    }

    localStorage.setItem(CURRENT_VERSION_KEY, SESSION_VERSION);
  }
}

executeSafeMigration();

const container = document.getElementById("root");
if (!container) {
  throw new Error("Root container resolution failed.");
}

createRoot(container).render(<App />);
