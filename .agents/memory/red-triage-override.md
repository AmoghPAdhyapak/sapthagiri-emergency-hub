---
name: RED triage override
description: How the RED auto-escalation and encounter locking works
---

## Rule
`POST /api/triage/process` auto-escalates to RED if any of these keywords appear in symptoms (case-insensitive): chest pain, cardiac, breathing failure, not breathing, unconscious, heart attack, stroke, severe bleeding, seizure, respiratory failure, anaphylaxis, coma, no pulse.

**Why:** Junior doctors cannot downgrade critical cases. Safety net for hackathon demo.

**How to apply:**
- Even if `juniorDoctorSelection` is "GREEN", backend will override to RED if keywords match.
- YELLOW keywords provide a second tier for less-critical but urgent symptoms.
- In `LiveReportsPanel`, RED encounters show `LOCKED` badge and have no dismiss button; GREEN/YELLOW can be dismissed (stored in `localStorage.sapthagiri_dismissed_encounters`).
- Encounters live in `routes/encounters.ts` `encounters` Map; linked to patients via `patientId`.
- Continuity-of-care notes go via `POST /api/triage/encounters/:id/continuity`.
