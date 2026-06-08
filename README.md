# 🚕 Rideva

![Expo](https://img.shields.io/badge/Expo-SDK%2052-000020?logo=expo&logoColor=white)
![React Native](https://img.shields.io/badge/React%20Native-0.76.9-61DAFB?logo=react&logoColor=black)
![React](https://img.shields.io/badge/React-18.3.1-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)

> A production-grade, real-time ride-booking platform — React Native (Expo) on the front end and
> Supabase (PostgreSQL + PostGIS + Realtime + Edge Functions) on the back end. Three roles
> (passenger, driver, admin), live driver tracking, geospatial matching, a fare engine, payments architecture, and push notifications.

---

## 📖 Overview

Rideva is a portfolio-grade reference implementation demonstrating senior mobile + backend + real-time systems engineering. Architecture follows feature/layer separation and SOLID principles: side-effects live in `services/` and `hooks/`, screens stay presentational, and the database enforces invariants the client can't be trusted with (atomic ride assignment, fare integrity, one-active-ride).

---

## ✨ Features

| Area | Highlights |
|------|-----------|
| **Auth** | Email/password, Google OAuth, Apple Sign In, password reset, secure session persistence, RBAC by role |
| **Passenger** | Map-first booking, per-class fare estimate, live driver tracking, ride history, ratings, saved places |
| **Driver** | Online/offline toggle, real-time ride offers, accept/reject, trip state machine, earnings dashboard |
| **Matching** | PostGIS KNN nearest-driver search, sequential offers with TTL, auto-reassign, radius-expanding fallback |
| **Real-time** | Supabase Realtime for ride state + throttled driver-location stream |
| **Payments** | Cash today; Stripe-ready schema (payment intents) + itemised fare breakdown & surge |
| **Notifications** | Expo push + in-app feed, delivered from edge functions on every lifecycle event |
| **Admin** | RLS-elevated metrics; architecture for a full web dashboard |

---

## 🧱 Tech Stack

| Category | Technology |
|---|---|
| Framework | React Native 0.76.9 + Expo SDK 52 |
| Language | TypeScript 5.x (strict) |
| Navigation | React Navigation 7 |
| State | Zustand + TanStack Query v5 |
| Forms | React Hook Form + Zod |
| Styling | NativeWind v4 |
| Animations | Reanimated 3 + Gesture Handler |
| Maps / Location | react-native-maps, expo-location |
| Backend | Supabase — PostgreSQL 15 + PostGIS, RLS, Realtime, Storage, Deno Edge Functions |

---

## 🗂 Project Structure

```
Rideva/
├── App.tsx                  # Provider shell
├── index.ts                 # Entry (gesture handler + global.css)
├── app.json                 # Expo config (permissions, plugins, maps keys)
├── supabase/
│   ├── config.toml          # Local stack config
│   ├── seed.sql             # Demo accounts + online drivers
│   ├── migrations/          # 0001 schema · 0002 functions/triggers · 0003 RLS
│   └── functions/           # dispatch-ride/, send-push/
└── src/
    ├── components/          # ui/, map/, ride/
    ├── config/              # validated runtime env
    ├── constants/           # theme tokens, tunables, copy
    ├── hooks/               # useAuth, useActiveRide, useDriverTracking…
    ├── lib/                 # React Query client + key factory
    ├── navigation/          # RBAC root navigator + per-role stacks
    ├── screens/             # auth/ passenger/ driver/ shared/ admin/
    ├── services/            # supabase, auth, rides, location, notifications
    ├── store/               # Zustand (auth, booking)
    ├── types/               # domain models
    └── utils/               # geo (PostGIS/GeoJSON, polyline), format, validation
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 20+
- The [Supabase CLI](https://supabase.com/docs/guides/cli)
- Xcode / Android Studio, or the Expo Go app

### 1. Install
```bash
cd Rideva
npm install
cp .env.example .env        # fill in values (see below)
```

### 2. Boot the backend (local)
```bash
supabase start              # Postgres + Auth + Realtime + Storage + Edge runtime
supabase db reset           # applies migrations 0001→0003 and seed.sql
supabase functions serve    # (optional) run edge functions locally
```
`supabase start` prints your local **API URL** and **anon key** — put them in `.env`.

### 3. Run the app
```bash
npx expo start              # or: npm run ios / npm run android
```

### Demo accounts (after `db reset`)
| Role | Email | Password |
|------|-------|----------|
| Passenger | `passenger@rideva.dev` | `Password123!` |
| Driver | `driver1@rideva.dev` | `Password123!` |
| Admin | `admin@rideva.dev` | `Password123!` |

Two drivers are seeded **online** in downtown SF so booking returns a match immediately.

---

## ⚙️ Environment Variables

Mobile reads `EXPO_PUBLIC_*` (inlined at build) with an `app.json → extra` fallback. Edge functions read `SUPABASE_*` and provider secrets.

| Key | Used by | Purpose |
|-----|---------|---------|
| `EXPO_PUBLIC_SUPABASE_URL` / `_ANON_KEY` | app | Supabase client |
| `EXPO_PUBLIC_GOOGLE_OAUTH_CLIENT_ID` | app | Google sign-in |
| `GOOGLE_MAPS_IOS_KEY` / `_ANDROID_KEY` | app build | Maps SDK |
| `SUPABASE_SERVICE_ROLE_KEY` | edge fns | Privileged dispatch + push |
| `STRIPE_SECRET_KEY` / `EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY` | payments | Card flow (when enabled) |

---

## 📦 Deployment

```bash
npm install -g eas-cli
eas login
eas build --platform ios       # or: --platform android
```

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for the full app (EAS) + backend (Supabase) ship guide, and [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for system design.

---

## 🧪 Scripts

```bash
npm run typecheck   # tsc --noEmit
npm run lint        # eslint
npm test            # jest
npm run db:reset    # re-apply migrations + seed
npm run functions:deploy
```

---

## 📄 License

MIT — for portfolio/demo use.
