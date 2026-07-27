# Little Notes — Mobile

A native iOS/Android port of the [Little Notes](../README.md) baby tracker, built with Expo (React Native). It's a pixel-faithful port of the `web/` app — same screens, colors, fonts, icons, and charts — talking to the same [`server/`](../server) API.

See the [root README](../README.md) for the full project overview, architecture, and how to run `server/`/`web/`.

## Prerequisites

- Node.js 20+
- A running API — either `docker compose up` from the repo root, or `server/`'s local dev server (see the [root README](../README.md#running-locally-development))
- [Expo Go](https://expo.dev/go) on your phone (must match this project's Expo SDK version — see below), or Xcode/Android Studio for a simulator/emulator

## Setup

```bash
npm install
```

Create `.env.local` pointing at the API (copy `.env.example` as a starting point):

```env
EXPO_PUBLIC_API_URL=http://localhost:4000
```

The right value depends on where the app runs, since `localhost` means something different on each target:

| Target | `EXPO_PUBLIC_API_URL` |
|---|---|
| iOS Simulator | `http://localhost:4000` |
| Android Emulator | `http://10.0.2.2:4000` (the emulator's alias for the host machine) |
| Physical device (Expo Go) | `http://<your-computer's-LAN-IP>:4000` — find it with `ipconfig getifaddr en0` (macOS) — phone and computer must be on the same Wi-Fi |

Native `fetch` isn't subject to browser CORS, so unlike `web/`, no `CORS_ORIGIN` changes are needed to reach the API from a device or simulator.

## Running

```bash
npx expo start
```

Then press `i` (iOS Simulator), `a` (Android emulator), or scan the printed QR code with Expo Go on a physical device.

> **Expo SDK version**: this project targets **SDK 54** specifically (not the latest), because Expo Go on your phone only runs one SDK version at a time and 54 is broadly compatible. If `expo-doctor` or `npx expo install --check` ever reports mismatched versions after a dependency change, run `npx expo install --fix` to realign everything back to SDK 54's compatible set — don't hand-bump individual `expo-*` packages.

## Auth

The app authenticates with `Authorization: Bearer <accessToken>` instead of cookies (native apps have no cookie jar). Tokens are stored in `expo-secure-store` (falling back to `AsyncStorage` on the `web` Expo target, which `expo-secure-store` doesn't support). See `src/lib/apiClient.ts` and `src/lib/auth.tsx`.

## Project Structure

```
mobile/
├── app.json                  # Expo config — name, scheme, splash, plugins
├── .env.local                # EXPO_PUBLIC_API_URL (gitignored — copy from .env.example)
└── src/
    ├── app/                   # Expo Router routes (file-based, mirrors web/'s URL structure)
    │   ├── _layout.tsx        # Root layout — font loading, ThemeProvider, AuthProvider
    │   ├── index.tsx          # Redirects to /dashboard or /login based on auth state
    │   ├── (auth)/            # login, register — no chrome
    │   ├── invite/[token]/    # Public invite landing screen
    │   └── (app)/             # Auth-guarded — Navbar + custom bottom tab bar
    │       ├── dashboard.tsx  # Baby list
    │       ├── settings.tsx
    │       └── babies/
    │           ├── new.tsx
    │           └── [babyId]/  # Per-baby access guard + BabyContext
    │               ├── index.tsx      # Profile — stats, trends, quick-add
    │               ├── edit.tsx
    │               ├── feeding.tsx    # Combined feeding/diaper logs
    │               ├── health.tsx     # Vaccines, weight, height, other records
    │               ├── photos.tsx     # Grid + lightbox
    │               └── doctor-visit/  # Overview + per-appointment detail + PDF export
    ├── components/
    │   ├── icons/              # One react-native-svg component per icon, ported from web/'s inline SVGs
    │   ├── ui/                  # Button, Card, Avatar, Badge, Input, Modal, Toast, ThemeSwitcher…
    │   ├── layout/               # BottomTabBar, Navbar
    │   ├── charts/                # GrowthLineChart, WeeklyStackedBarChart (react-native-svg + d3)
    │   ├── doctor-visit/           # VisitPrep, AppointmentFormModal, pdfTemplate/pdfCharts
    │   └── baby/, health/, photos/, invite/  # Screen-specific forms & widgets
    ├── hooks/                   # useBaby, useSectionAccess, useActiveBaby, usePhotos…
    ├── lib/
    │   ├── apiClient.ts         # Bearer-token fetch wrapper — mirrors web/'s api-client.ts
    │   ├── auth.tsx             # AuthProvider — SecureStore token lifecycle, refresh-on-401
    │   ├── storage.ts           # SecureStore wrapper (falls back to AsyncStorage on web target)
    │   ├── pdf.ts               # PDF generation (expo-print) + authenticated image → data URI
    │   └── dates.ts             # Date/time helpers ported from web/'s lib/utils.ts
    └── theme/
        ├── tokens.ts            # Colors/radii/shadows transcribed verbatim from web/'s globals.css
        └── ThemeContext.tsx     # Theme provider + AsyncStorage persistence + server sync
```

## Design fidelity

This app intentionally avoids "native-feeling" redesigns — every screen is meant to match `web/` exactly:

- **Colors** live in `src/theme/tokens.ts`, copied verbatim from `web/src/app/globals.css`'s CSS variables (all 4 themes). If web's palette ever changes, diff that file and update `tokens.ts` to match — don't eyeball it.
- **Charts** (`src/components/charts/`) are hand-built with `react-native-svg` + `d3-scale`/`d3-shape`, the same D3-math approach `web/`'s charts use (no chart library on either side).
- **Icons** (`src/components/icons/`) are direct ports of web's inline SVGs — same paths, same stroke widths.
- **Navigation** uses a custom bottom tab bar and top navbar (not Expo Router's built-in `Tabs`), because the active-tab pill styling and per-baby permission gating don't map cleanly onto `Tabs.Screen` config.
- **PDF export** (`src/lib/pdf.ts`, `src/components/doctor-visit/pdfTemplate.ts`) reconstructs the exact same report sections as `web/`'s print components, rendering charts as real vector SVG (not a screenshot) since `expo-print`'s HTML renderer supports SVG natively.

If you're porting a new web screen or fixing a mismatch, read the corresponding file under `web/src/` first and match it section-for-section rather than approximating from memory.
