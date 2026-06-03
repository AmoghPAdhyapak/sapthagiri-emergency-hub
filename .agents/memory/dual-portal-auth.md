---
name: Dual portal auth
description: How patient vs staff roles are determined and where data flows
---

## Rule
`localStorage.sapthagiri_user.role` drives portal routing: `"patient"` → `/patient`, `"staff"` or missing → `/dashboard`.

**Why:** Existing sessions before dual-portal had no role field, so defaulting to staff keeps the existing staff sessions working.

**How to apply:**
- `App.tsx` has `StaffGuard` (redirects patients to `/patient`) and `PatientGuard` (redirects staff to `/dashboard`).
- Patient register/login sets `role: "patient"` + `patientId: "Patient-XXXX"`.
- Staff register/login sets `role: "staff"` + `staffId`.
- Guest staff login (bypass) sets `role: "staff"`, `staffId: "GUEST"`.
- Backend stores patients in `patientsFolder` Map (in `routes/auth.ts`), staff in `staffUsers` Map.
- Backend is the source of truth for `patientId` — generated server-side on register.
- Login falls back gracefully: if backend is down, patient login checks localStorage directly.
