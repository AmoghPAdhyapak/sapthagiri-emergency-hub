---
name: Queue tri-separation
description: How the triage tracking is split into three separate sidebar sections
---

## Rule
Staff sidebar has three visually distinct queue nav items, each pulling filtered data from the same `/api/triage/encounters` endpoint (non-archived only):
- **Emergency Hub** (view: "dashboard") → RED only — LiveReportsPanel
- **Observation Queue** (view: "observation") → YELLOW only — ObservationQueuePanel
- **General Monitoring** (view: "general") → GREEN only — GeneralMonitoringPanel

**Why:** Old "Live Reports" panel mixed all triage levels. The spec requires tri-separation so doctors can focus on severity-matched workflows.

**How to apply:**
- Each panel fetches all encounters and client-side filters by triageLevel.
- "AI Triage" sidebar item was removed; replaced with "Patient Registration" (view: "patientreg").
- "Staff Information Directory" (view: "staffdir") added via GET /api/auth/staff-directory.
- EmergencySos floating button removed from staff Dashboard; lives only in PatientPortal.
