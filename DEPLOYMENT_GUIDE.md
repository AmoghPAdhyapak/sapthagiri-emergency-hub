# Sapthagiri NPS University — Emergency Medical Portal
## Complete Deployment Guide

> **Get the source code first:** In Replit's Files panel → three-dot menu (⋯) → **Download as ZIP**.  
> This document covers every configuration, command, schema, and platform-specific note needed to run the app anywhere else.

---

## 1. Project File Structure

```
sapthagiri-emergency-portal/
├── package.json                    # Root — workspace-level scripts & devDeps
├── pnpm-workspace.yaml             # pnpm workspace config, catalog pins, overrides
├── tsconfig.base.json              # Shared strict TypeScript defaults
├── tsconfig.json                   # Solution file for composite libs only
│
├── artifacts/
│   ├── api-server/                 # Express 5 backend (Node.js ESM)
│   │   ├── package.json
│   │   ├── build.mjs               # esbuild bundle script
│   │   ├── tsconfig.json
│   │   ├── hospital_ecosystem.db   # SQLite database (created at runtime)
│   │   └── src/
│   │       ├── index.ts            # Entry point — binds to PORT
│   │       ├── app.ts              # Express app, CORS, JSON middleware
│   │       ├── lib/
│   │       │   ├── sqliteDb.ts     # better-sqlite3 init + all CRUD helpers
│   │       │   ├── logger.ts       # pino singleton logger
│   │       │   └── otp.ts          # Fast2SMS OTP helper
│   │       └── routes/
│   │           ├── index.ts        # Mounts all sub-routers under /api
│   │           ├── health.ts       # GET /api/healthz
│   │           ├── auth.ts         # Patient + staff auth, OTP, signup
│   │           ├── encounters.ts   # Triage encounters, emergency hub actions
│   │           ├── patients.ts     # Patient lookup endpoints
│   │           ├── patientsfolder.ts # Staff patients folder
│   │           └── gemini/         # Gemini AI chat routes
│   │
│   └── dashboard/                  # React + Vite frontend
│       ├── package.json
│       ├── vite.config.ts
│       ├── tsconfig.json
│       ├── index.html
│       └── src/
│           ├── main.tsx
│           ├── App.tsx             # wouter routing
│           ├── index.css           # Tailwind v4 + custom institutional theme
│           ├── assets/
│           │   └── logo.png        # University crest (from attached_assets/)
│           ├── components/
│           │   ├── ui/             # shadcn/ui component library
│           │   ├── AiChatPanel.tsx
│           │   ├── ClinicalRealismChips.tsx
│           │   ├── LiveReportsPanel.tsx      # RED zone
│           │   ├── ObservationQueuePanel.tsx # YELLOW zone
│           │   └── GeneralMonitoringPanel.tsx# GREEN zone
│           ├── hooks/
│           │   └── useViewMode.ts  # Desktop/Mobile dual-layout toggle
│           └── pages/
│               ├── LandingPage.tsx
│               ├── LoginPage.tsx
│               ├── SignUpPage.tsx
│               ├── Dashboard.tsx   # Staff dashboard (all panels + dual layout)
│               ├── PatientPortal.tsx
│               └── DeanPortalPage.tsx
│
└── lib/                            # Shared workspace libraries
    ├── api-spec/                   # OpenAPI 3.1 spec + Orval codegen output
    │   ├── openapi.yaml
    │   └── src/                    # Generated Zod schemas + React Query hooks
    ├── api-zod/                    # Shared Zod schemas
    ├── api-client-react/           # Generated React Query hooks
    ├── db/                         # Drizzle ORM (PostgreSQL, Gemini chat history)
    ├── integrations/
    └── integrations-gemini-ai/     # @google/genai wrapper for Gemini
```

---

## 2. Environment Variables

Create a `.env` file (or set in your platform's dashboard):

```env
# ── REQUIRED ────────────────────────────────────────────────────────────────

# Backend API server port
PORT=8080

# Secret for session signing (any long random string)
SESSION_SECRET=your-very-long-random-session-secret-here

# SMS OTP via Fast2SMS (https://fast2sms.com → API → DLT route key)
FAST2SMS_API_KEY=your-fast2sms-api-key

# Gemini AI (https://aistudio.google.com/app/apikey)
GEMINI_API_KEY=your-gemini-api-key

# ── OPTIONAL ─────────────────────────────────────────────────────────────────

# Override where hospital_ecosystem.db is stored.
# Defaults to artifacts/api-server/ (next to the compiled bundle).
# On Railway/Render/VPS use a mounted persistent volume path.
DATABASE_STORAGE_PATH=/data/sapthagiri

# PostgreSQL (only required if Gemini conversation history persistence is used)
# DATABASE_URL=postgresql://user:pass@host:5432/dbname

# ── FRONTEND (set at build time or in vite config) ───────────────────────────

# Port Vite dev server listens on
PORT=23183          # (different from API port — set per-service)

# URL base path for the frontend (/ for root-hosted, /dashboard for subpath)
BASE_PATH=/
```

> **Replit-specific vars** (`REPL_ID`, `REPLIT_DOMAINS`) are only used to conditionally load Replit dev-tool plugins. They are safe to omit — the app detects their absence and skips the plugins.

---

## 3. SQLite Database Schema

The database file is created automatically on first server start. No migration step required.

```sql
-- Staff accounts (doctors, nurses, admin)
CREATE TABLE IF NOT EXISTS STAFF_ACCOUNTS (
  staffId       TEXT PRIMARY KEY,   -- e.g. "STF-1234567890"
  userId        TEXT NOT NULL,      -- login username
  name          TEXT NOT NULL,
  password      TEXT NOT NULL,      -- plaintext (hash in production)
  role          TEXT NOT NULL DEFAULT 'Staff',
  createdAt     TEXT NOT NULL,      -- ISO 8601 timestamp
  accountStatus TEXT NOT NULL DEFAULT 'active'  -- 'active' | 'inactive'
);

-- Patient master folder (auth + demographics)
CREATE TABLE IF NOT EXISTS PATIENT_MASTER_FOLDER (
  patientId    TEXT PRIMARY KEY,    -- e.g. "PAT-1234567890"
  name         TEXT NOT NULL,
  age          TEXT NOT NULL DEFAULT '',
  allergies    TEXT NOT NULL DEFAULT '[]',  -- JSON array of strings
  phone        TEXT NOT NULL,       -- normalized 10-digit
  email        TEXT NOT NULL DEFAULT '',
  password     TEXT NOT NULL,       -- plaintext (hash in production)
  survivalState TEXT NOT NULL DEFAULT 'Stable',
  createdAt    TEXT NOT NULL
);

-- Triage encounters (the full JSON encounter blob is stored in data)
CREATE TABLE IF NOT EXISTS ENCOUNTERS (
  encounterId TEXT PRIMARY KEY,
  patientId   TEXT NOT NULL,
  data        TEXT NOT NULL         -- JSON-serialized EncounterRecord
);

-- Forensic audit trail (immutable lifecycle events)
CREATE TABLE IF NOT EXISTS FORENSIC_LIFECYCLE_LOGS (
  logId           TEXT PRIMARY KEY,
  encounterId     TEXT NOT NULL,
  patientId       TEXT NOT NULL,
  eventType       TEXT NOT NULL,
  timestamp       TEXT NOT NULL,
  forensicPayload TEXT NOT NULL     -- JSON
);
```

---

## 4. Complete Dependency Lists

### Root `package.json`
```json
{
  "name": "workspace",
  "version": "0.0.0",
  "private": true,
  "scripts": {
    "build": "pnpm run typecheck && pnpm -r --if-present run build",
    "typecheck:libs": "tsc --build",
    "typecheck": "pnpm run typecheck:libs && pnpm -r --filter \"./artifacts/**\" --filter \"./scripts\" --if-present run typecheck"
  },
  "devDependencies": {
    "prettier": "^3.8.3",
    "typescript": "~5.9.3"
  }
}
```

### `artifacts/api-server/package.json`
```json
{
  "name": "@workspace/api-server",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "export NODE_ENV=development && pnpm run build && pnpm run start",
    "build": "node ./build.mjs",
    "start": "node --enable-source-maps ./dist/index.mjs",
    "typecheck": "tsc -p tsconfig.json --noEmit"
  },
  "dependencies": {
    "@google/genai": "^1.52.0",
    "better-sqlite3": "^12.10.0",
    "cookie-parser": "^1.4.7",
    "cors": "^2.8.6",
    "drizzle-orm": "^0.45.2",
    "express": "^5.2.1",
    "pino": "^9.14.0",
    "pino-http": "^10.5.0"
  },
  "devDependencies": {
    "@types/better-sqlite3": "^7.6.13",
    "@types/cookie-parser": "^1.4.10",
    "@types/cors": "^2.8.19",
    "@types/express": "^5.0.6",
    "@types/node": "^25.3.3",
    "esbuild": "0.27.3",
    "esbuild-plugin-pino": "^2.3.3",
    "pino-pretty": "^13.1.3",
    "thread-stream": "3.1.0"
  }
}
```

### `artifacts/dashboard/package.json` (abbreviated key deps)
```json
{
  "name": "@workspace/dashboard",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite --config vite.config.ts --host 0.0.0.0",
    "build": "vite build --config vite.config.ts",
    "serve": "vite preview --config vite.config.ts --host 0.0.0.0",
    "typecheck": "tsc -p tsconfig.json --noEmit"
  },
  "devDependencies": {
    "@radix-ui/react-*": "various",
    "@tailwindcss/vite": "^4.1.14",
    "@tanstack/react-query": "^5.90.21",
    "@vitejs/plugin-react": "^5.0.4",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "framer-motion": "^12.23.24",
    "lucide-react": "^0.545.0",
    "react": "19.1.0",
    "react-dom": "19.1.0",
    "tailwind-merge": "^3.3.1",
    "tailwindcss": "^4.1.14",
    "vite": "^7.3.2",
    "wouter": "^3.3.5",
    "zod": "^3.25.76"
  }
}
```
> See the full `artifacts/dashboard/package.json` in your downloaded zip for the complete `@radix-ui/*` list.

---

## 5. API Routes Reference

All routes are mounted under `/api`:

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/healthz` | Health check |
| `POST` | `/api/auth/patient/register` | Patient OTP registration |
| `POST` | `/api/auth/patient/login` | Patient login |
| `POST` | `/api/auth/staff/login` | Staff login |
| `POST` | `/api/auth/staff/register` | Staff registration |
| `POST` | `/api/otp/send` | Send OTP via Fast2SMS |
| `POST` | `/api/otp/verify` | Verify OTP |
| `GET` | `/api/triage/encounters` | All triage encounters |
| `POST` | `/api/triage/process` | Submit new triage encounter |
| `GET` | `/api/triage/red` | RED zone encounters |
| `GET` | `/api/triage/yellow` | YELLOW zone encounters |
| `GET` | `/api/triage/green` | GREEN zone encounters |
| `GET` | `/api/triage/deceased` | Deceased registry |
| `PATCH` | `/api/triage/emergency-hub/action` | Doctor action on RED encounter |
| `POST` | `/api/triage/encounters/:id/continuity` | Add external treatment note |
| `GET` | `/api/triage/patient/:patientId` | Encounters by patient |
| `GET` | `/api/patients` | All patients |
| `GET` | `/api/patients-folder` | Staff patients folder |
| `POST` | `/api/gemini/chat` | Gemini AI chat message |
| `GET` | `/api/gemini/history` | Gemini chat history |
| `POST` | `/api/dean/staff` | Dean — manage staff registry |
| `DELETE` | `/api/dean/staff/:id` | Dean — remove staff member |

---

## 6. Architecture & Key Design Decisions

### Auth
- **Patients**: register with phone + OTP (Fast2SMS DLT route), login with phone + password
- **Staff**: register with staff ID + name + password (no OTP), login with userId + password
- Role stored in `sapthagiri_user` localStorage key: `{ role: "patient" | "staff", ... }`
- Session timeout: 4 hours for staff, persistent for patients

### Triage Classification
- Backend (`encounters.ts`) auto-classifies: RED keywords override any doctor selection
- `symptomFinalVerdict` string computed server-side
- RED encounters are locked from deletion
- Emergency Hub action (`PATCH /emergency-hub/action`) moves encounters between zones

### Dean Registry
- Authorized IDs: `["75657", "88241", "99432", "AUTO-DISPATCH-ROUTER"]`
- Validated **only** for cross-hospital continuity notes (`POST /continuity`)
- Internal doctor queue actions do NOT require Dean validation

### Database Persistence
- SQLite (`better-sqlite3`) in WAL mode — survives server restarts
- Default path: `artifacts/api-server/hospital_ecosystem.db`
- Override with `DATABASE_STORAGE_PATH` env var (critical for containerized deployments)

### Desktop/Mobile Dual Layout
- `useViewMode()` hook reads from `localStorage` key `view_mode`
- Fires `sapthagiri_viewmode` custom event for instant cross-component switching
- Desktop: full sidebar institutional dashboard
- Mobile: bottom tab navigation app-style layout

---

## 7. Run Commands

### Prerequisites
```bash
node --version  # Must be >= 20 (Node.js 24 recommended)
pnpm --version  # Must be >= 9

# Install pnpm if not present:
npm install -g pnpm@latest

# Linux/VPS: build tools for better-sqlite3 (native addon)
apt-get install -y build-essential python3
```

### Install Dependencies
```bash
pnpm install
```

### Development (two terminals)

**Terminal 1 — API server:**
```bash
export PORT=8080
export SESSION_SECRET=dev-secret-change-this
export FAST2SMS_API_KEY=your-key
export GEMINI_API_KEY=your-key
pnpm --filter @workspace/api-server run dev
```

**Terminal 2 — Frontend:**
```bash
export PORT=23183
export BASE_PATH=/
pnpm --filter @workspace/dashboard run dev
```

Then open `http://localhost:23183` in your browser.  
The frontend calls the API at `/api/*` — configure a proxy (see below) so those requests reach port 8080.

### Production Build
```bash
# Build everything
export NODE_ENV=production
pnpm --filter @workspace/api-server run build
pnpm --filter @workspace/dashboard run build
```

Output:
- Backend bundle: `artifacts/api-server/dist/index.mjs`
- Frontend static: `artifacts/dashboard/dist/public/`

### Production Start
```bash
# API server
PORT=8080 SESSION_SECRET=... FAST2SMS_API_KEY=... GEMINI_API_KEY=... \
  node --enable-source-maps artifacts/api-server/dist/index.mjs

# Frontend — serve as static files (nginx example below)
```

---

## 8. Platform-Specific Deployment

### Local Machine / VPS (recommended: nginx + PM2)

**nginx config (`/etc/nginx/sites-available/sapthagiri`):**
```nginx
server {
    listen 80;
    server_name your-domain.com;

    # API — proxy to Node.js
    location /api/ {
        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # Frontend — static files
    location / {
        root /path/to/artifacts/dashboard/dist/public;
        try_files $uri $uri/ /index.html;  # SPA fallback
    }
}
```

**PM2 for the API:**
```bash
pm2 start artifacts/api-server/dist/index.mjs \
  --name sapthagiri-api \
  --interpreter node \
  -- --enable-source-maps
pm2 save
pm2 startup
```

### Railway

1. Create two services: `api-server` and `dashboard` (or serve static from CDN)
2. **API service:**
   - Start command: `node --enable-source-maps artifacts/api-server/dist/index.mjs`
   - Build command: `pnpm install && node artifacts/api-server/build.mjs`
   - Environment variables: `PORT`, `SESSION_SECRET`, `FAST2SMS_API_KEY`, `GEMINI_API_KEY`, `DATABASE_STORAGE_PATH=/data`
   - Mount a volume at `/data` for SQLite persistence
3. **Frontend service:**
   - Build command: `pnpm install && BASE_PATH=/ PORT=3000 pnpm --filter @workspace/dashboard run build`
   - Publish directory: `artifacts/dashboard/dist/public`
   - Or use a static hosting service and point domain to it

### Render

Same as Railway. Use "Web Service" for the API with:
- Build: `pnpm install && node artifacts/api-server/build.mjs`
- Start: `node --enable-source-maps artifacts/api-server/dist/index.mjs`
- Add a persistent disk at `/data` and set `DATABASE_STORAGE_PATH=/data`

For the frontend, use "Static Site":
- Build: `BASE_PATH=/ PORT=3000 pnpm --filter @workspace/dashboard run build`
- Publish: `artifacts/dashboard/dist/public`
- Rewrite rule: `/* → /index.html` (200)

### Docker (single container)

```dockerfile
FROM node:24-slim AS base
RUN apt-get update && apt-get install -y build-essential python3 && rm -rf /var/lib/apt/lists/*
RUN npm install -g pnpm@latest

WORKDIR /app
COPY . .
RUN pnpm install

# Build backend
RUN node artifacts/api-server/build.mjs

# Build frontend (static)
ARG BASE_PATH=/
ENV BASE_PATH=$BASE_PATH
ARG PORT=3000
ENV PORT=$PORT
RUN pnpm --filter @workspace/dashboard run build

# Runtime — serve both
FROM node:24-slim
RUN apt-get update && apt-get install -y nginx && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY --from=base /app/artifacts/api-server/dist ./api-dist
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/artifacts/dashboard/dist/public /var/www/html

# nginx config
COPY docker/nginx.conf /etc/nginx/nginx.conf

EXPOSE 80
CMD ["sh", "-c", "nginx && node --enable-source-maps api-dist/index.mjs"]
```

### Vercel (frontend only, API on separate service)

Vercel cannot run persistent Node.js processes or SQLite. You must host the API on Railway/Render/VPS and deploy only the static frontend to Vercel.

```json
// vercel.json
{
  "rewrites": [
    { "source": "/api/(.*)", "destination": "https://your-api-host.com/api/$1" },
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

Build command: `BASE_PATH=/ PORT=3000 pnpm --filter @workspace/dashboard run build`  
Output directory: `artifacts/dashboard/dist/public`

---

## 9. Replit-Specific Code to Remove Outside Replit

### `artifacts/dashboard/vite.config.ts`

The `@replit/vite-plugin-*` plugins are only loaded when `REPL_ID` is defined, so they're **safe to leave as-is** — they auto-skip outside Replit. But if you want a clean config:

```ts
// Replace the plugins array with:
plugins: [
  react(),
  tailwindcss(),
],
```

### `pnpm-workspace.yaml` — esbuild platform overrides

The `overrides` section excludes non-linux-x64 esbuild binaries (Replit runs on linux-x64 only). **Remove these overrides** to allow cross-platform installs:

```yaml
# Delete the entire "overrides:" section, or keep only what applies to your platform
overrides: {}
```

### `minimumReleaseAge`

This Replit security setting causes `pnpm install` to fail if a package was published less than 24 hours ago. You can safely remove it outside Replit:

```yaml
# Remove or comment out:
# minimumReleaseAge: 1440
```

---

## 10. Third-Party Service Setup

### Fast2SMS (OTP)
1. Register at [fast2sms.com](https://www.fast2sms.com)
2. Go to API → Dev API or DLT route
3. Copy your API key → `FAST2SMS_API_KEY`
4. The app sends OTP via `GET https://www.fast2sms.com/dev/bulkV2?authorization=KEY&route=otp&numbers=PHONE&variables_values=OTP`

### Google Gemini AI
1. Go to [aistudio.google.com](https://aistudio.google.com/app/apikey)
2. Create an API key → `GEMINI_API_KEY`
3. The app uses `@google/genai` SDK with `gemini-2.0-flash` model

---

## 11. Dean Registry (Governance System)

Authorized Dean IDs (hardcoded in `artifacts/api-server/src/routes/encounters.ts`):
```typescript
const DEAN_REGISTRY = ["75657", "88241", "99432", "AUTO-DISPATCH-ROUTER"];
```

These IDs are validated **only** when submitting cross-hospital continuity notes (`POST /api/triage/encounters/:id/continuity`). To add/remove authorized Deans, edit this array in `encounters.ts`.

---

## 12. Typecheck & Build Verification

```bash
# Full typecheck (libs + all artifacts)
pnpm run typecheck

# Typecheck frontend only
pnpm --filter @workspace/dashboard run typecheck

# Typecheck backend only
pnpm --filter @workspace/api-server run typecheck

# Full production build (typecheck + bundle)
pnpm run build
```

---

*Generated from live Replit source — June 2026.*
