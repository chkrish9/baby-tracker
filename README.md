# Baby Tracker

A Progressive Web App (PWA) for tracking baby feedings and diaper changes. Multiple parents can track the same baby simultaneously, upload photos, and store medical documents — all from any device.

---

## Features

### Authentication
- Register and log in with email and password
- **Remember me** option — session persists across browser restarts when enabled; clears on browser close when disabled
- Invite other parents to co-track a baby via a shareable link

### Baby Management
- Add multiple babies to your account
- Set a profile photo for each baby (tap the avatar to upload)
- View baby age automatically calculated from date of birth
- See all co-parents linked to a baby

### Feeding Logs
- Log breast (left/right), bottle, or solid food feedings
- Record amount (ml) or duration (minutes) per session
- Add optional notes
- View full feeding history, delete individual entries

### Diaper Logs
- Log wet, dirty, wet+dirty, or dry diaper changes
- Add optional notes
- View full diaper history, delete individual entries

### Photo Gallery
- Upload multiple photos per baby
- Photos are stored privately and served only to authenticated parents
- Delete photos individually

### Medical Documents
- Upload PDFs, images, and Word documents per baby
- Supports: `.pdf`, `.jpg`, `.png`, `.webp`, `.doc`, `.docx` (max 10 MB each)
- Files are stored securely and served only to authenticated parents
- Delete documents individually

### Parent Invites
- Invite another parent by email — generates a shareable link
- The invitee accepts the invite after signing in (or creating an account)
- Owners can remove co-parents

### Settings
- **Profile photo** — upload your own avatar (shown in the header)
- **Theme** — choose from 4 colour themes:
  - **Stone** (default, warm taupe — gender neutral)
  - **Sage** (soft green)
  - **Ocean** (soft blue)
  - **Blossom** (original pink)
- Theme preference is saved to your account and syncs across devices
- **Display name** — update your name
- **Change password** — requires current password verification

### PWA (Progressive Web App)
- Install on iPhone, Android, or desktop via the browser's "Add to Home Screen" prompt
- Offline support — cached pages and logs remain accessible without a network
- Native app-like experience (standalone display, no browser chrome)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router, TypeScript) |
| Database | PostgreSQL + Prisma ORM |
| Auth | NextAuth.js v5 (Credentials + JWT) |
| File Storage | Local filesystem (`./uploads/`) |
| Styling | Tailwind CSS v4 |
| Data Fetching | SWR |
| PWA | Custom service worker + Web App Manifest |

---

## Prerequisites

- **Node.js** 18 or later
- **PostgreSQL** — the app expects a database at `localhost:5434`

### Start PostgreSQL with Docker

```bash
docker run -d --name baby-db \
  -e POSTGRES_USER=babytracker \
  -e POSTGRES_PASSWORD=babytracker \
  -e POSTGRES_DB=babytracker \
  -p 5434:5432 \
  postgres:16
```

---

## Setup & Running

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Create a `.env.local` file in the project root:

```env
DATABASE_URL="postgresql://babytracker:babytracker@localhost:5434/babytracker"
AUTH_SECRET="your-random-secret-here"
```

Generate a secure `AUTH_SECRET`:

```bash
openssl rand -base64 32
```

### 3. Run database migrations

```bash
npx prisma migrate deploy
```

### 4. Start the development server

```bash
npm run dev
```

Open **http://localhost:3002** in your browser.

---

## First Run

1. Go to `/register` and create your account
2. On the dashboard, click **Add baby** and enter the baby's name and date of birth
3. Open the baby's profile to start logging feedings and diaper changes
4. Tap the baby's avatar to upload a profile photo
5. Go to **Settings** (profile icon in the top-right) to upload your own photo and choose a theme

---

## Project Structure

```
baby-tracker/
├── prisma/
│   ├── schema.prisma          # Database models
│   └── migrations/            # SQL migration history
├── public/
│   ├── manifest.json          # PWA manifest
│   ├── sw.js                  # Service worker
│   ├── offline.html           # Offline fallback page
│   └── icons/                 # PWA icons
├── uploads/                   # User-uploaded files (gitignored)
└── src/
    ├── app/
    │   ├── (auth)/            # Login & register pages
    │   ├── (app)/             # Protected app pages
    │   │   ├── dashboard/     # Baby list
    │   │   ├── babies/        # Baby profile, feeding, diapers, photos, documents, invite
    │   │   └── settings/      # User settings
    │   ├── api/               # API routes
    │   │   ├── babies/        # Baby CRUD, logs, photos, documents, parents
    │   │   ├── files/         # Authenticated file serving
    │   │   ├── invites/       # Invite accept
    │   │   ├── register/      # User registration
    │   │   └── user/          # Settings, photo, password
    │   └── invite/            # Public invite landing page
    ├── components/
    │   ├── ui/                # Button, Input, Card, Avatar, Badge, Toast, etc.
    │   ├── layout/            # Navbar, BottomNav, PageHeader
    │   └── baby/              # BabyCard
    ├── hooks/                 # useBaby, useFeeding, useDiapers
    ├── lib/                   # db, upload, auth-helpers, validation, utils
    └── middleware.ts          # Route protection
```

---

## File Storage

Uploaded files are stored in `./uploads/` (excluded from git) and served through the authenticated API route `/api/files/[...path]`. Files are never publicly accessible — every request is session-checked.

```
uploads/
├── babies/[babyId]/
│   ├── profile/    # Baby profile photo
│   ├── photos/     # Photo gallery
│   └── documents/  # Medical documents
└── users/[userId]/
    └── profile/    # User profile photo
```

---

## Production Notes

- Set a strong `AUTH_SECRET` (min 32 random characters)
- Use a managed PostgreSQL service (e.g. Supabase, Railway, Neon)
- Replace local file storage with S3 or similar for the `uploads/` directory
- Run `npm run build && npm start` instead of `npm run dev`
