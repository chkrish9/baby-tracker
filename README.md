<div align="center">
  <img src="public/logo.svg" width="96" height="96" alt="Baby Tracker logo" />
  <h1>Baby Tracker</h1>
  <p>A Progressive Web App for tracking baby feedings, diaper changes, photos, and medical documents.<br/>Multiple parents can track the same baby simultaneously from any device.</p>
</div>

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Running with Docker](#running-with-docker-recommended)
- [Running Locally](#running-locally-development)
- [First Run](#first-run)
- [Project Structure](#project-structure)
- [File Storage](#file-storage)
- [Environment Variables](#environment-variables)
- [Production Notes](#production-notes)

---

## Features

### Authentication
- Register and sign in with email and password
- **Remember me** — checkbox on sign in and registration; checked sessions persist across browser restarts (`localStorage`), unchecked sessions clear on browser close (`sessionStorage`)
- JWT-based sessions with 30-day expiry

### Baby Management
- Add multiple babies to one account
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

### Dashboard Trends
- D3-powered stacked bar charts on each baby's dashboard showing feedings and diaper changes broken down by type
- Date range selector — **Today**, **Yesterday**, **Last 7 days**, **Last 30 days** — updates both charts together
- Hover any bar segment for an exact count; "Show as table" gives a plain-text breakdown per chart

### Photo Gallery
- Upload multiple photos per baby
- Photos are stored privately — only accessible to authenticated parents
- **Flag a photo for the doctor** — tap the flag on any photo to pull it into that baby's next doctor visit prep list
- Delete photos individually

### Doctor Visit Prep
- Track **appointments** — add a visit date + note; the dashboard surfaces the nearest upcoming ("Next visit") and most recent past ("Previous visit") automatically
- Tap into any appointment (past or future) for a dedicated page scoped to that visit
- **Questions for the doctor** — jot down a question any time; check it off once asked. New questions and newly-flagged photos/diaper notes attach automatically to the next upcoming appointment
- Each visit's page shows its own questions, flagged photos, flagged diaper notes, and the baby's medical documents in one place

### Medical Documents
- Upload PDFs, images, and Word documents (`.pdf`, `.jpg`, `.png`, `.webp`, `.doc`, `.docx`)
- Max 10 MB per file
- Files are session-gated — never publicly accessible
- Delete documents individually

### Parent Invites
- Invite a co-parent by email — generates a one-time shareable link
- Invitee accepts after signing in or registering
- Baby owner can remove co-parents at any time

### Settings
- **Profile photo** — upload your avatar, shown in the header on all pages
- **Theme** — 4 colour themes, preference saved to your account and synced across devices:

  | Theme | Description |
  |---|---|
  | Stone | Warm taupe — gender neutral (default) |
  | Sage | Soft green |
  | Ocean | Soft blue |
  | Blossom | Original pink |

- **Display name** — update your name
- **Change password** — requires current password verification

### PWA (Progressive Web App)
- Install on iOS, Android, or desktop via "Add to Home Screen"
- Works offline — cached pages and logs load without a network connection
- Standalone display mode (no browser chrome when installed)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router, TypeScript) |
| Database | PostgreSQL 16 + Prisma ORM |
| Auth | NextAuth.js v5 — Credentials provider, JWT strategy |
| File Storage | Local filesystem (`./uploads/`), served via authenticated API |
| Styling | Tailwind CSS v4 |
| Data Fetching | SWR |
| Charts | D3.js |
| Containerisation | Docker + Docker Compose |
| PWA | Custom service worker + Web App Manifest |

---

## Running with Docker (Recommended)

Runs the app, API, and database together with a single command.

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running

### 1. Set a secret

Create a `.env` file in the project root (or edit the existing one):

```env
AUTH_SECRET="your-random-secret-here"
```

Generate a secure value:

```bash
openssl rand -base64 32
```

### 2. Build and start

```bash
docker compose up --build
```

Open **http://localhost:3001** in your browser.

On first run this will:
1. Pull the PostgreSQL 16 image
2. Build the Next.js app (4-stage: deps → builder → migrator → runner)
3. Run all database migrations in a dedicated one-shot container
4. Start the app once migrations complete

### Docker commands

| Command | What it does |
|---|---|
| `docker compose up --build -d` | Build and run in the background |
| `docker compose down` | Stop all containers |
| `docker compose down -v` | Stop and wipe all data (volumes) |
| `docker compose logs -f app` | Stream live app logs |
| `docker compose logs -f migrate` | Stream migration logs |
| `docker compose logs -f db` | Stream live database logs |
| `docker compose ps` | List running containers |
| `docker compose restart app` | Restart only the app container |

### Persistent data

| Data | Docker volume |
|---|---|
| PostgreSQL records | `db_data` |
| Uploaded files | `uploads_data` |

Both volumes survive container restarts and rebuilds. Run `docker compose down -v` only if you want a completely fresh start.

---

## Running Locally (Development)

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

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Create `.env.local` in the project root:

```env
DATABASE_URL="postgresql://babytracker:babytracker@localhost:5434/babytracker"
AUTH_SECRET="your-random-secret-here"
```

### 3. Apply database migrations

```bash
npx prisma migrate deploy
```

### 4. Start the dev server

```bash
npm run dev
```

Open **http://localhost:3002** in your browser.

> Hot reload is enabled. Changes to `src/` are reflected immediately without restarting.

---

## First Run

1. Go to **`/register`** and create your account
2. On the dashboard tap **Add baby**, enter the name and date of birth
3. Open the baby profile to log feedings and diaper changes
4. Tap the baby's avatar to upload a profile photo
5. Click your avatar (top-right) → **Settings** to upload your own photo and pick a theme

---

## Project Structure

```
baby-tracker/
├── Dockerfile                  # Multi-stage production build
├── docker-compose.yml          # db, migrate, and app services
├── .dockerignore
├── prisma/
│   ├── schema.prisma           # Database models
│   └── migrations/             # SQL migration history
├── public/
│   ├── logo.svg                # App logo
│   ├── manifest.json           # PWA manifest
│   ├── sw.js                   # Service worker
│   ├── offline.html            # Offline fallback
│   └── icons/                  # PWA icons (192, 512, apple-touch)
├── uploads/                    # User-uploaded files — gitignored, Docker volume in prod
└── src/
    ├── middleware.ts            # Route protection (NextAuth)
    ├── auth.ts                 # NextAuth configuration
    ├── app/
    │   ├── layout.tsx          # Root layout — PWA meta, SessionProvider, ThemeProvider
    │   ├── (auth)/             # Public pages: login, register
    │   ├── (app)/              # Auth-guarded pages
    │   │   ├── layout.tsx      # Remember-me enforcement, ToastProvider
    │   │   ├── dashboard/      # Baby list
    │   │   ├── babies/
    │   │   │   ├── new/        # Add baby form
    │   │   │   └── [babyId]/   # Profile (+ trend charts), feeding, diapers, photos, documents, invite
    │   │   │       └── doctor-visit/
    │   │   │           └── [appointmentId]/  # Per-visit questions, flagged items, documents
    │   │   └── settings/       # Theme, profile photo, name, password
    │   ├── api/
    │   │   ├── auth/           # NextAuth handler
    │   │   ├── register/       # User registration
    │   │   ├── babies/         # Baby CRUD + feeding/diaper/photo/document/parent routes
    │   │   │   └── [babyId]/
    │   │   │       ├── appointments/    # Doctor appointment CRUD
    │   │   │       └── doctor-notes/    # "Questions for the doctor" CRUD
    │   │   ├── files/          # Authenticated file serving
    │   │   ├── invites/        # Invite accept
    │   │   └── user/           # Settings, profile photo, password
    │   └── invite/[token]/     # Public invite landing page
    ├── components/
    │   ├── ThemeProvider.tsx   # CSS variable theme switcher + localStorage/DB sync
    │   ├── SessionProvider.tsx
    │   ├── ui/                 # Button, Input, Card, Avatar, Badge, Modal, Toast, Spinner, ThemeSwitcher
    │   ├── layout/             # Navbar (with profile dropdown), BottomNav, PageHeader
    │   ├── baby/               # BabyCard
    │   ├── charts/             # WeeklyStackedBarChart (D3-backed trend charts)
    │   └── doctor-visit/       # VisitPrep — questions/flagged-photos/flagged-diapers, shared across visit pages
    ├── hooks/                  # useBaby, useFeeding, useDiapers
    ├── lib/
    │   ├── db.ts               # Prisma client singleton
    │   ├── upload.ts           # saveFile / deleteFile helpers
    │   ├── auth-helpers.ts     # assertParentOf, unauthorized, forbidden, notFound
    │   ├── appointments.ts     # findNextAppointmentId — auto-links flags/questions to the next visit
    │   ├── validation.ts       # Zod schemas for all API inputs
    │   └── utils.ts            # cn(), formatBytes(), addDays()
    └── types/
        └── index.ts            # NextAuth session / JWT type augmentation
```

---

## File Storage

Files are saved to `./uploads/` (excluded from git) and served exclusively through `/api/files/[...path]`, which verifies the user's session before serving any byte.

```
uploads/
├── babies/[babyId]/
│   ├── profile/        # Baby profile photo
│   ├── photos/         # Photo gallery images
│   └── documents/      # Medical documents
└── users/[userId]/
    └── profile/        # User profile photo
```

In Docker, `uploads/` is mounted as a named volume (`uploads_data`) so files persist across deploys.

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `AUTH_SECRET` | Yes | Random string used to sign JWT tokens (min 32 chars) |

For local development put these in `.env.local`. For Docker they are set in `docker-compose.yml` and `.env`.

---

## Production Notes

- **`AUTH_SECRET`** must be a strong random value — never reuse a dev secret in production
- **Database** — swap the Docker PostgreSQL for a managed service (Supabase, Railway, Neon) by updating `DATABASE_URL`
- **File storage** — for multi-instance deployments replace `./uploads/` with S3-compatible object storage
- **HTTPS** — run behind a reverse proxy (Nginx, Caddy, Traefik) with a TLS certificate
- **Build** — the Docker image uses `next build` + standalone output; run `docker compose up --build -d` to deploy updates
