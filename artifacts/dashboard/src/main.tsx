import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// ── Session migration: clear stale user data on schema upgrade ─────────────
const SESSION_VERSION = "v3-otp";
if (localStorage.getItem("sapthagiri_session_ver") !== SESSION_VERSION) {
  localStorage.removeItem("sapthagiri_user");
  localStorage.setItem("sapthagiri_session_ver", SESSION_VERSION);
}

createRoot(document.getElementById("root")!).render(<App />);
