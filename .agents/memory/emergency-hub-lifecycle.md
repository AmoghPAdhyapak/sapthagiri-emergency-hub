---
name: Emergency hub lifecycle
description: How doctors update RED patient status and clear them from the Emergency Hub
---

## Rule
`PATCH /api/triage/emergency-hub/action` with `{encounterId, doctorId, statusAction}`:
- `OUT_OF_DANGER` → sets triageLevel to GREEN (patient moves to General Monitoring)
- `UNDER_OBSERVATION` → sets triageLevel to YELLOW (patient moves to Observation Queue)
- `DECEASED` → sets `isArchived: true` + `terminationTimestamp` (permanently removed)

After a successful action, the encounter disappears from the Emergency Hub (LiveReportsPanel filters to RED only, non-archived).

**Why:** Doctors need lifecycle control over critical patients. Deceased records must be archived without deletion so audit trail is preserved.

**How to apply:**
- doctorId is required; 403 returned if missing.
- UI: each RED card has "Update Status" → inline form with Doctor ID input + 3-option grid → "Completed" button.
- DECEASED action requires browser confirm() dialog before API call.
- GET /api/triage/encounters filters `isArchived !== true`.
- Patient login also supports dual-mode: {phone+password} or {name+password, loginType:"NAME_PASSWORD"} for rural accessibility.
