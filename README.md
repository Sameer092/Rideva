# 🚕 Rideva

A production-grade, real-time ride-booking platform — built with **React Native (Expo)** on the front end and **Supabase** (PostgreSQL + PostGIS + Realtime + Edge Functions) on the back end. Three roles (passenger, driver, admin), live driver tracking, geospatial driver matching, fare engine, payments architecture, and push notifications.

> Portfolio-grade reference implementation demonstrating senior mobile + backend + real-time systems engineering.

---

## ✨ Features

| Area | Highlights |
|------|-----------|
| **Auth** | Email/password, Google OAuth, Apple Sign In, password reset, secure session persistence (SecureStore), RBAC by role |
| **Passenger** | Map-first booking, fare estimate per vehicle class, live driver tracking, ride history, ratings, saved places |
| **Driver** | Online/offline toggle, real-time ride offers, accept/reject, trip state machine, turn-by-turn handoff, earnings dashboard |
| **Matching** | PostGIS KNN nearest-driver search, sequential offers with TTL, auto-reassign on reject, radius-expanding time fallback |
| **Real-time** | Supabase Realtime for ride state + driver location stream; throttled GPS broadcast |
| **Payments** | Cash today; Stripe-ready schema (payment intents) + wallet-ready structure; itemised fare breakdown + surge |
| **Notifications** | Expo push + in-app feed, delivered from edge functions on every lifecycle event |
| **Admin** | RLS-elevated metrics on mobile; architecture for a full web dashboard |
| **UX** | Light/dark/system theming, glassmorphism, bottom sheets, loading/skeleton/empty/error states |

---

## 🧱 Tech Stack

**Mobile:** Expo SDK 52 · React Native 0.76 · TypeScript (strict) · React Navigation 7 · Zustand · TanStack Query · React Hook Form + Zod · NativeWind · Reanimated 3 · Gesture Handler · react-native-maps · expo-location / notifications / secure-store.

**Backend:** Supabase — PostgreSQL 15 + **PostGIS**, Row Level Security, Realtime, Storage, Deno **Edge Functions**.

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
│   ├── migrations/
│   │   ├── 0001_initial_schema.sql     # Tables, enums, indexes, constraints
│   │   ├── 0002_functions_triggers.sql # Fare, matching, atomic accept/complete
│   │   └── 0003_rls_policies.sql       # RLS + realtime publication
│   └── functions/
│       ├── dispatch-ride/   # Driver-matching dispatcher
│       └── send-push/       # Expo push delivery
└── src/
    ├── components/          # ui/ (Button, Input, Card, States…), map/, ride/
    ├── config/              # env (validated runtime config)
    ├── constants/           # theme tokens, tunables, copy
    ├── hooks/               # useAuth, useTheme, useActiveRide, useDriverTracking…
    ├── lib/                 # React Query client + key factory
    ├── navigation/          # RBAC root navigator + per-role stacks
    ├── screens/             # auth/ passenger/ driver/ shared/ admin/
    ├── services/            # supabase, auth, rides, location, notifications, mappers
    ├── store/               # Zustand (auth, booking)
    ├── types/               # domain models
    └── utils/               # geo (PostGIS/GeoJSON, haversine, polyline), format, validation
```

Architecture follows **feature/layer separation**, **SOLID**, and a reusable component system. Side-effects live in `services/` and `hooks/`; screens stay presentational; the database enforces invariants the client can't be trusted with.

---

## 🚀 Quick Start

### Prerequisites
- Node 20+, the [Supabase CLI](https://supabase.com/docs/guides/cli), and Xcode/Android Studio (or Expo Go).

### 1. Install
```bash
npm install
cp .env.example .env   # fill in values (see below)
```

### 2. Boot the backend (local)
```bash
supabase start          # spins up Postgres + Auth + Realtime + Storage + Edge runtime
supabase db reset       # applies migrations 0001→0003 and seed.sql
supabase functions serve # (optional) run edge functions locally
```
`supabase start` prints your local **API URL** and **anon key** — put them in `.env`.

### 3. Generate typed DB bindings (optional)
```bash
npm run gen:types
```

### 4. Run the app
```bash
npm run ios      # or: npm run android / npm start
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

See [.env.example](.env.example). Mobile reads `EXPO_PUBLIC_*` (inlined at build) with an `app.json → extra` fallback. Edge functions read `SUPABASE_*` and provider secrets.

| Key | Used by | Purpose |
|-----|---------|---------|
| `EXPO_PUBLIC_SUPABASE_URL` / `_ANON_KEY` | app | Supabase client |
| `EXPO_PUBLIC_GOOGLE_OAUTH_CLIENT_ID` | app | Google sign-in |
| `GOOGLE_MAPS_IOS_KEY` / `_ANDROID_KEY` | app build | Maps SDK |
| `SUPABASE_SERVICE_ROLE_KEY` | edge fns | Privileged dispatch + push |
| `STRIPE_SECRET_KEY` / `EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY` | payments | Card flow (when enabled) |

---

## 🔁 How the core flows work

**Booking → matching → tracking**
1. Passenger sets pickup/destination → client fetches a **fare estimate per class** via the `calculate_fare` RPC (single source of truth).
2. `createRide` inserts a `rides` row and invokes the **`dispatch-ride`** edge function.
3. The dispatcher runs `find_nearby_drivers` (PostGIS KNN, online + verified + class + freshness) and writes a **`ride_offers`** row with a 15s TTL; the driver is push-notified.
4. The driver accepts via **`accept_ride_offer`** — a `SELECT … FOR UPDATE` RPC that atomically assigns the ride to the first accepter and voids sibling offers (no double-booking).
5. On reject/timeout, the next dispatch wave offers the next driver and **widens the radius** (time-based fallback); after N waves it marks `no_drivers`.
6. Passenger watches the ride row + driver location stream over **Realtime**; the driver advances the state machine (`arriving → arrived → in_progress → completed`).
7. **`complete_ride`** settles the fare and writes `payments` + `earnings` rows transactionally.

**Real-time location:** the driver streams throttled GPS (time + distance gated) through `update_driver_location`, which updates the denormalised live column *and* appends to the `driver_locations` time-series in one round-trip. RLS guarantees a passenger only receives pings for **their** ride.

---

## 🔐 Security

- **RLS everywhere** — every table denies by default; policies grant least-privilege per role (see `0003_rls_policies.sql`). Counterparties see only each other's ride-relevant fields.
- **Atomic state transitions** via `SECURITY DEFINER` RPCs so the DB — not the client — enforces "one active ride", "first accepter wins", and fare integrity.
- **Secure sessions** in the device keychain via `expo-secure-store`; refresh-token rotation; auto-refresh gated on app foreground.
- **Input validation** with Zod on every form and at service boundaries.
- **Rate limiting** strategy: location writes throttled client-side + suitable for a Postgres trigger / edge guard; dispatch is idempotent per wave.

---

## ⚡ Performance

- Realtime-driven cache updates (`setQueryData`) instead of polling for live entities.
- GPS throttled by **time *and* distance**; KNN matching backed by a **GiST** index and a **partial index** that only scans online/verified drivers.
- TanStack Query caching, `staleTime`, reconnect refetch; optimistic UI on bookings.
- Map provider/theme centralised; lazy per-role navigation stacks.

---

## 📚 More docs
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — system design, data model, trade-offs
- [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) — ship the app (EAS) + backend (Supabase)
- [docs/ADMIN.md](docs/ADMIN.md) — admin panel / web dashboard architecture

---

## 🧪 Scripts
```bash
npm run typecheck   # tsc --noEmit
npm run lint        # eslint
npm test            # jest
npm run db:reset    # re-apply migrations + seed
npm run functions:deploy
```

## License
MIT — for portfolio/demo use.
