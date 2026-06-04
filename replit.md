# Sapthagiri NPS University — Emergency Medical Portal

Full-stack AI-assisted hospital emergency triage system. Dual portal: **Patient Portal** (registration, health history, emergency status, cross-hospital continuity) and **Staff Medical Operations Dashboard** (Emergency Hub, Observation Queue, General Monitoring, Deceased Registry, Dean Access).

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/dashboard run dev` — run the dashboard (Vite dev server)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string
- Secrets: `FAST2SMS_API_KEY` (SMS OTP), `SESSION_SECRET` (sessions)

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM (backend is in-memory for triage data; DB for Gemini conversations)
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)
- Frontend: React + Vite + Tailwind + shadcn/ui

## Where things live

- `artifacts/api-server/src/routes/auth.ts` — patient + staff auth, PatientUser schema (has allergies[])
- `artifacts/api-server/src/routes/encounters.ts` — EncounterRecord schema, triage logic, DEAN_REGISTRY, all triage endpoints
- `artifacts/dashboard/src/pages/Dashboard.tsx` — staff dashboard (all panels inline + sidebar)
- `artifacts/dashboard/src/pages/LoginPage.tsx` — dual patient/staff login with eye toggles
- `artifacts/dashboard/src/pages/SignUpPage.tsx` — patient OTP registration with allergies field
- `artifacts/dashboard/src/pages/PatientPortal.tsx` — patient portal with full lifecycle status view
- `artifacts/dashboard/src/components/LiveReportsPanel.tsx` — Emergency Hub (RED zone), expandable drawer
- `artifacts/dashboard/src/components/ObservationQueuePanel.tsx` — YELLOW zone, expandable drawer
- `artifacts/dashboard/src/components/GeneralMonitoringPanel.tsx` — GREEN zone, expandable drawer

## Architecture decisions

- **In-memory triage store**: encounters are stored in a `Map<string, EncounterRecord>` in the API server process. Server restarts wipe encounters; mitigated by localStorage cache per zone (RED/YELLOW/GREEN). Patient accounts persist the same way and are self-healed via local storage on login.
- **DEAN_REGISTRY validation**: only applied to cross-hospital continuity submissions (`POST /api/triage/encounters/:id/continuity`). Authorized IDs: 75657, 88241, 99432, AUTO-DISPATCH-ROUTER.
- **Triage auto-classification**: RED keywords trigger RED regardless of doctor selection; server computes `symptomFinalVerdict` string alongside `triageLevel`.
- **Expandable drawer**: all three triage panels use a `Set<string>` click-to-toggle pattern; the drawer renders full clinical file + action panel inline.
- **Deceased Registry**: `GET /api/triage/deceased` returns archived encounters filtered by `deceasedAt` field. Read-only panel in staff sidebar.

## Product

- Staff: Emergency Hub (RED critical queue), Observation Queue (YELLOW), General Monitoring (GREEN), Deceased Registry (frozen archive), Patient Registration, Patients Folder, Medical Timeline, Medical Notes, Dean Access (doctor registry mgmt)
- Patients: My Profile, Medical History, Current Visit, Emergency Status (full read-only lifecycle), External Treatment Notes (cross-hospital continuity with Dean Registry validation)

## User preferences

- Never `import React from "react"` — automatic JSX transform; named imports only
- `@assets/logo.png` via `@assets` alias for the university logo
- Lucide-react 0.545.0: `Siren` does NOT exist; use `AlertTriangle`/`ShieldAlert`. `Skull`, `History`, `ChevronDown`, `PanelLeftClose`, `PanelLeftOpen` all confirmed present.
- Never `console.log` in server code — use `req.log` in routes, `logger` singleton elsewhere
- Password eye toggles: plain SHOW/HIDE text buttons (not icon), inline in a flex wrapper div

## Gotchas

- Phone normalization: `normalizePhone()` strips +91/91/0 prefix to a 10-digit number
- Server restart wipes ALL triage encounter data — localStorage cache restores the last known state per zone
- `DashView` type in Dashboard.tsx must be kept in sync when adding new sidebar panels
- Backend DEAN_REGISTRY validates only for external continuity notes, not for internal doctor queue actions
- The `encounters` Map is the single source of truth; `patientsFolder` Map handles auth

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
