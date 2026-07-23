<div align="center">
  <img src="web/public/logo.svg" width="96" height="96" alt="Little Notes logo" />
  <h1>Little Notes (Baby Tracker)</h1>
  <p>A Progressive Web App for tracking baby feedings, diaper changes, growth, vaccinations, and photos.<br/>Multiple parents can track the same baby simultaneously from any device.</p>
</div>

---

## Table of Contents

- [Features](#features)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Running with Docker](#running-with-docker-recommended)
- [Running Locally](#running-locally-development)
- [First Run](#first-run)
- [Project Structure](#project-structure)
- [File Storage](#file-storage)
- [Environment Variables](#environment-variables)
- [Security](#security)
- [Production Notes](#production-notes)

---

## Features

### Authentication
- Register and sign in with email and password
- Short-lived access token + long-lived refresh token, both in httpOnly/secure cookies — the app silently refreshes an expired access token in the background, so sessions stay alive without re-login
- **Remember me** — checked sessions persist 30 days across browser restarts; unchecked sessions are cleared when the browser closes
- Double-submit CSRF token on every state-changing request; per-account login lockout after repeated failed attempts

### Baby Management
- Add multiple babies to one account — first name, last name, optional nickname, date of birth, and optional birth weight/height
- Tap a baby's avatar to upload or change their profile photo
- Age is calculated automatically from date of birth
- Dashboard lands returning users on their last-active baby instead of the baby list; the list itself only shows once at least one baby exists

### Feeding & Diaper Logs
- Log breast (left / right), bottle, or solid food sessions; log wet, dirty, mixed, or dry diaper changes
- **Editable date & time** on every entry — defaults to now, can be backdated
- **Units** — bottle/solid amount in ml or oz, breastfeeding duration in minutes or hours, selectable per entry
- Optional notes per entry
- **Edit or delete** any past entry
- **Flag for the doctor** — flag a diaper entry to pull it into that baby's next doctor visit prep list (see [Doctor Visit Prep](#doctor-visit-prep))
- Full history, grouped by day

### Dashboard & Trends
- At-a-glance stat tiles: last feed, diapers today, total bottle volume today, total breast time today, latest logged weight, latest logged height
- D3-powered stacked bar charts on each baby's dashboard showing feedings and diaper changes broken down by type
- Date range selector — **Today**, **Yesterday**, **Last 7 days**, **Last 30 days** — updates both charts together
- Hover any bar segment for an exact count; "Show as table" gives a plain-text breakdown per chart

### Health Tracking
- **Vaccinations** — log name, date, and optional notes per vaccine
- **Growth** — log weight and height over time with a trend chart per metric (kg/lb, cm/in)
- **Other health records** — free-form title/date/notes for anything else worth tracking (diagnoses, allergies, etc.)

### Photo Gallery
- Upload multiple photos per baby
- Photos are private — only accessible to parents linked to that specific baby (per-photo ownership check, not just "any logged-in user")
- **Flag a photo for the doctor** — tap the flag on any photo to pull it into that baby's next doctor visit prep list
- Delete photos individually

### Doctor Visit Prep
- Track **appointments** — add a visit date + note; the dashboard surfaces the nearest upcoming ("Next visit") and most recent past ("Previous visit") automatically
- Tap into any appointment (past or future) for a dedicated page scoped to that visit
- **Questions for the doctor** — jot down a question any time; check it off once asked. New questions and newly-flagged photos/diaper notes attach automatically to the next upcoming appointment
- Each visit's page shows its own questions, flagged photos, and flagged diaper notes in one place

### Parent Invites
- Invite a co-parent by email — generates a one-time shareable link, selectable per baby
- Invitee accepts after signing in or registering
- Baby owner can remove co-parents at any time; co-parents can remove themselves ("Leave")

### Settings
- **Profile photo** — upload your avatar, shown in the header on all pages
- **Theme** — 4 colour themes, preference saved to your account and synced across devices:

  | Theme | Description |
  |---|---|
  | Sage | Soft green (default) |
  | Clay | Warm terracotta |
  | Ocean | Soft blue |
  | Plum | Soft purple |

- **Display name** — update your name
- **Change password** — requires current password verification

### PWA (Progressive Web App)
- Install on iOS, Android, or desktop via "Add to Home Screen"
- Works offline — cached pages and logs load without a network connection
- Standalone display mode (no browser chrome when installed)

---

## Architecture

The app is split into two independently deployable services:

```
┌──────────────────────┐         ┌──────────────────────┐
│   web/  (port 3002)   │  HTTPS  │  server/ (port 4000)  │
│   Next.js UI, no DB    │ ─────▶ │   Express API          │
│   access, no auth       │        │   Prisma + PostgreSQL  │
│   secrets                │ cookies│   owns file storage    │
└──────────────────────┘         └──────────────────────┘
```

- **`web/`** renders every page and talks to the API exclusively through `NEXT_PUBLIC_API_URL`, with cookies sent cross-origin (`credentials: "include"`) and a CSRF token attached to every mutating request.
- **`server/`** is the sole source of truth for authentication and authorization — it owns the database, issues/verifies JWTs, enforces per-baby ownership on every route, and serves uploaded files.
- A lightweight, non-httpOnly marker cookie set by `web/` drives instant login/logout redirects in its middleware, but it's a UX convenience only — the API re-verifies the real session on every request regardless.

See [Security](#security) for the full auth/CSRF/rate-limiting model.

---

## Tech Stack

### `server/` — API

| Layer | Technology |
|---|---|
| Framework | Express 4 + TypeScript |
| Database | PostgreSQL 16 + Prisma ORM |
| Auth | Custom access/refresh JWT (`jsonwebtoken`), httpOnly cookies |
| Validation | Zod (request bodies **and** env config) |
| Security | `helmet`, `cors`, `express-rate-limit`, double-submit CSRF, `bcryptjs` |
| Uploads | `multer` (memory storage) → local filesystem |

### `web/` — UI

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router, TypeScript) |
| Styling | Tailwind CSS v4 |
| Data Fetching | SWR + a shared cross-origin API client |
| Charts | D3.js |
| PWA | Custom service worker + Web App Manifest |

### Shared

| | |
|---|---|
| Containerisation | Docker + Docker Compose (4 services: `db`, `migrate`, `server`, `web`) |

---

## Running with Docker (Recommended)

Runs the database, API, and UI together with a single command.

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running

### 1. Set secrets

Create a `.env` file in the **project root** (used by `docker-compose.yml` for variable substitution):

```env
ACCESS_TOKEN_SECRET="your-random-secret-here"
REFRESH_TOKEN_SECRET="a-different-random-secret-here"
CORS_ORIGIN=http://localhost:3002
NEXT_PUBLIC_API_URL=http://localhost:4000
```

Generate secure values (run twice, once per secret):

```bash
openssl rand -base64 32
```

### 2. Build and start

```bash
docker compose up --build
```

Open **http://localhost:3002** in your browser. The API alone is reachable at **http://localhost:4000** (`curl http://localhost:4000/health`).

On first run this will:
1. Pull the PostgreSQL 16 image
2. Build the `server` image (deps → builder → migrator → runner) and the `web` image (deps → builder → runner)
3. Run all database migrations in a dedicated one-shot `migrate` container
4. Start `server` and `web` once migrations complete

### Docker commands

| Command | What it does |
|---|---|
| `docker compose up --build -d` | Build and run in the background |
| `docker compose down` | Stop all containers |
| `docker compose down -v` | Stop and wipe all data (volumes) |
| `docker compose logs -f server` | Stream live API logs |
| `docker compose logs -f web` | Stream live UI logs |
| `docker compose logs -f migrate` | Stream migration logs |
| `docker compose logs -f db` | Stream live database logs |
| `docker compose ps` | List running containers |
| `docker compose restart server web` | Restart the app containers without touching the db |
| `docker compose build server` | Rebuild just the API image after a code change |

### Persistent data

| Data | Docker volume |
|---|---|
| PostgreSQL records | `db_data` |
| Uploaded files | `uploads_data` (mounted into `server` at `/app/uploads`) |

Both volumes survive container restarts and rebuilds. Run `docker compose down -v` only if you want a completely fresh start.

> **Note:** local `npm run dev` (below) and `docker compose` point at different Postgres instances by default — they don't share data. Check `server/.env`'s `DATABASE_URL` against `docker-compose.yml`'s `db` service if you're ever unsure which one you're looking at.

---

## Running Locally (Development)

Runs `server/` and `web/` as two separate Node processes with hot reload — faster iteration than Docker.

### Prerequisites

- **Node.js** 20+
- **PostgreSQL** (local install or Docker)

### Start PostgreSQL with Docker

```bash
docker run -d --name baby-db \
  -e POSTGRES_USER=babytracker \
  -e POSTGRES_PASSWORD=babytracker \
  -e POSTGRES_DB=babytracker \
  -p 5434:5432 \
  postgres:16
```

### 1. Install dependencies (both packages)

```bash
cd server && npm install
cd ../web && npm install
```

### 2. Configure environment

`server/.env`:

```env
NODE_ENV=development
PORT=4000
DATABASE_URL="postgresql://babytracker:babytracker@localhost:5434/babytracker"
ACCESS_TOKEN_SECRET="your-random-secret-here"
REFRESH_TOKEN_SECRET="a-different-random-secret-here"
CORS_ORIGIN=http://localhost:3002
```

`web/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:4000
```

### 3. Apply database migrations

```bash
cd server
npx prisma migrate deploy
```

### 4. Start both dev servers (two terminals)

```bash
# Terminal 1
cd server && npm run dev    # API on :4000

# Terminal 2
cd web && npm run dev       # UI on :3002
```

Open **http://localhost:3002** in your browser.

> Hot reload is enabled on both sides — `tsx watch` restarts the API on file changes, `next dev --turbopack` fast-refreshes the UI.

---

## First Run

1. Go to **`/register`** and create your account
2. On the dashboard tap **Add baby**, enter their name and date of birth
3. Open the baby profile to log feedings and diaper changes
4. Tap the baby's avatar to upload a profile photo
5. Click your avatar (top-right) → **Settings** to upload your own photo and pick a theme

---

## Project Structure

```
baby-tracker/
├── docker-compose.yml          # db, migrate, server, and web services
├── .env                         # Root secrets for docker-compose variable substitution
│
├── server/                      # Express API (port 4000)
│   ├── Dockerfile               # Multi-stage: deps → builder → migrator → runner
│   ├── .dockerignore
│   ├── prisma/
│   │   ├── schema.prisma        # Database models
│   │   └── migrations/          # SQL migration history
│   ├── uploads/                 # User-uploaded files — gitignored, Docker volume in prod
│   └── src/
│       ├── index.ts             # Entrypoint — loads env, starts listening
│       ├── app.ts                # Express app assembly + middleware stack
│       ├── config/
│       │   └── env.ts           # Zod-validated env, loaded once, fail-fast
│       ├── middleware/
│       │   ├── auth.ts          # requireAuth — cookie or Bearer token
│       │   ├── ownership.ts     # requireBabyAccess / requireOwnerRole
│       │   ├── csrf.ts          # Double-submit CSRF check
│       │   ├── rateLimit.ts     # IP limiter + per-account login lockout
│       │   └── errorHandler.ts  # Centralized error → JSON responses
│       ├── routes/               # auth, babies, feeding, diapers, doctorNotes, growth,
│       │                         # healthRecords, vaccinations, appointments, photos,
│       │                         # parents, invites, user, files (one file per resource)
│       └── lib/
│           ├── db.ts             # Prisma client singleton
│           ├── tokens.ts         # Access/refresh JWT sign & verify
│           ├── cookies.ts        # Cookie set/clear helpers
│           ├── upload.ts         # saveFile / deleteFile helpers
│           ├── validation.ts     # Zod schemas for all API inputs
│           └── appointments.ts   # findNextAppointmentId — auto-links flags/questions
│
└── web/                          # Next.js UI (port 3002)
    ├── Dockerfile                # Multi-stage: deps → builder → runner
    ├── .dockerignore
    ├── public/
    │   ├── logo.svg              # App logo
    │   ├── manifest.json         # PWA manifest
    │   ├── sw.js                 # Service worker
    │   ├── offline.html          # Offline fallback
    │   └── icons/                # PWA icons (192, 512, apple-touch)
    └── src/
        ├── middleware.ts         # UX-only redirect based on a marker cookie
        ├── app/
        │   ├── layout.tsx        # Root layout — PWA meta, ThemeProvider
        │   ├── (auth)/            # Public pages: login, register
        │   ├── (app)/             # Auth-guarded pages
        │   │   ├── layout.tsx     # Client-side session gate, ToastProvider
        │   │   ├── dashboard/     # Baby list
        │   │   ├── babies/
        │   │   │   ├── new/       # Add baby form
        │   │   │   └── [babyId]/  # Profile (+ trend charts), feeding, diapers,
        │   │   │       │          # health, photos, invite
        │   │   │       └── doctor-visit/
        │   │   │           └── [appointmentId]/  # Per-visit questions, flagged items
        │   │   └── settings/      # Theme, profile photo, name, password, invites
        │   └── invite/[token]/    # Public invite landing page
        ├── components/
        │   ├── ThemeProvider.tsx  # CSS variable theme switcher + server sync
        │   ├── ui/                 # Button, Input, Card, Avatar, Badge, Modal, Toast, Spinner
        │   ├── layout/             # Navbar (with profile dropdown), BottomNav, PageHeader
        │   ├── baby/               # BabyCard
        │   ├── charts/              # WeeklyStackedBarChart, GrowthLineChart (D3-backed)
        │   └── doctor-visit/        # VisitPrep, FlagAppointmentsModal
        ├── hooks/                   # useBaby, useFeeding, useDiapers, useHealth, useCurrentUser
        └── lib/
            ├── api-client.ts        # Cross-origin fetch wrapper — credentials, CSRF, silent refresh
            ├── utils.ts             # cn(), babyDisplayName(), formatBytes(), etc.
            └── charts.ts            # Chart data-shaping helpers
```

---

## File Storage

Files are saved to `server/uploads/` (excluded from git) and served exclusively through `GET /files/*` on the API, which:
1. Verifies the requester's session (cookie or Bearer token)
2. Blocks path traversal
3. Checks the requester actually has access to the specific baby (or is the file's own user) before streaming it — a 404 is returned uniformly for "doesn't exist" and "no access" so forbidden paths can't be distinguished from missing ones

```
uploads/
├── babies/[babyId]/
│   ├── profile/        # Baby profile photo
│   └── photos/         # Photo gallery images
└── users/[userId]/
    └── profile/        # User profile photo
```

In Docker, `server/uploads/` is mounted as a named volume (`uploads_data`) so files persist across deploys.

---

## Environment Variables

### `server/.env`

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `ACCESS_TOKEN_SECRET` | Yes | Signs short-lived access tokens (min 32 chars) |
| `REFRESH_TOKEN_SECRET` | Yes | Signs long-lived refresh tokens — **must differ** from the access secret (min 32 chars) |
| `CORS_ORIGIN` | Yes | Exact origin allowed to call the API with credentials (e.g. `http://localhost:3002`) — never `*` |
| `PORT` | No | Defaults to `4000` |
| `NODE_ENV` | No | Defaults to `development`; gates the `Secure` cookie flag |

### `web/.env.local`

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | Yes | Base URL of the API the browser talks to (e.g. `http://localhost:4000`) — baked in at build time |

### Root `.env` (Docker Compose only)

Same four secrets as `server/.env` plus `NEXT_PUBLIC_API_URL`, read by `docker-compose.yml` for variable substitution into the containers.

`.env.example` files are committed alongside each real `.env` as a template.

---

## Security

The API follows a standard production hardening checklist:

| Concern | Approach |
|---|---|
| Token storage | httpOnly, `Secure` (prod), `SameSite=Lax` cookies — never `localStorage` |
| Token lifecycle | 15-minute access token + 7/30-day refresh token (session vs. "remember me"), refreshed via `POST /auth/refresh` |
| CSRF | Double-submit cookie — a non-httpOnly `csrf_token` cookie must match an `X-CSRF-Token` header on every mutating request |
| CORS | Explicit origin allow-list (`CORS_ORIGIN`), `credentials: true`, never a wildcard |
| Password storage | `bcryptjs` hashing |
| Authorization | Every baby-scoped route re-checks the requester is a linked parent (`requireBabyAccess`); owner-only actions (delete baby, remove another parent) additionally check `role === "OWNER"` |
| Rate limiting | IP-level limiter on all routes, a stricter limiter on `/auth/login` + `/auth/register`, and a separate per-account lockout after repeated failed logins |
| File access | Per-file ownership check on every download, not just "any authenticated user" |
| HTTP hardening | `helmet` security headers, `X-Powered-By` disabled, JSON body size capped at 1 MB, upload size/type limits enforced server-side |
| Config safety | No fallback secrets — Zod-validated env, fails fast at startup on anything missing or too short |
| Mobile-ready | `requireAuth` accepts the same access token via `Authorization: Bearer` in addition to cookies, for a future native client |

---

## Production Notes

- **`ACCESS_TOKEN_SECRET` / `REFRESH_TOKEN_SECRET`** must be strong, distinct random values — never reuse dev secrets in production, and never reuse one for the other
- **`CORS_ORIGIN` / `NEXT_PUBLIC_API_URL`** must point at real public hostnames in production (not `localhost`) — e.g. `https://app.example.com` and `https://api.example.com`
- **HTTPS is required** — `Secure` cookies only get set (and only get sent back) over HTTPS once `NODE_ENV=production`; run both services behind a reverse proxy (Nginx, Caddy, Traefik) with TLS
- **Database** — swap the Docker PostgreSQL for a managed service (Supabase, Railway, Neon) by updating `DATABASE_URL`
- **File storage** — for multi-instance deployments replace `server/uploads/` with S3-compatible object storage
- **Build** — each service has its own multi-stage Docker image; run `docker compose up --build -d` to deploy updates to both, or `docker compose build server` / `docker compose build web` to update just one
