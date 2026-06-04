---
name: SQLite persistence
description: Backend persistence layer — better-sqlite3 replaces in-memory Maps for patients, staff, encounters, and forensic logs.
---

## Rule
All triage data now lives in `artifacts/api-server/hospital_ecosystem.db` (SQLite, WAL mode). The in-memory `patientsFolder` and `encounters` Maps are gone. All helpers are in `src/lib/sqliteDb.ts`.

**Why:** Data was lost on every server restart. SQLite gives reboot-safe persistence without requiring a Postgres connection.

## Tables
- `PATIENT_MASTER_FOLDER` — patient accounts (patientId, name, age, allergies JSON, phone, email, password, survivalState, createdAt)
- `STAFF_ACCOUNTS` — staff accounts (staffId, userId, name, password, role, createdAt)
- `ENCOUNTERS` — full encounter JSON blob per row (encounterId, patientId, data TEXT)
- `FORENSIC_LIFECYCLE_LOGS` — individual forensic entries for sync-master queries (logId, encounterId, patientId, eventType, timestamp, forensicPayload JSON)

## How to apply
- `src/routes/auth.ts` now imports from `../lib/sqliteDb` — no more exported Maps
- `src/routes/encounters.ts` imports upsertEncounter/getEncounterById/getAllEncounters etc.
- `src/routes/patientsfolder.ts` imports getAllPatients/getPatientById/getEncountersByPatient directly
- Sync endpoint: `GET /api/triage/sync-master/:patientId` → profile + forensicTimeline

## Installation gotcha
`better-sqlite3` needs its native build scripts approved. `onlyBuiltDependencies` in `pnpm-workspace.yaml` must include `better-sqlite3`, otherwise the .node binding won't compile and the server crashes on import.
