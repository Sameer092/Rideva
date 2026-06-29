# 🚕 Rideva

![Expo](https://img.shields.io/badge/Expo-SDK%2052-000020?logo=expo&logoColor=white)
![React Native](https://img.shields.io/badge/React%20Native-0.76.9-61DAFB?logo=react&logoColor=black)
![Redux](https://img.shields.io/badge/Redux-4.x-764ABC?logo=redux&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-Postgres%20%2B%20PostGIS-3FCF8E?logo=supabase&logoColor=white)

> A real-time ride-booking app (Uber / inDrive style) built with React Native (Expo) and Supabase.
> inDrive-style fare bidding, live map, multiple vehicle types, and full passenger / driver / admin experiences.

---

## ✨ Features

| Area | Highlights |
|------|-----------|
| **Auth** | Email/password sign up & sign in, password reset, role-based access (passenger / driver / admin) |
| **Bidding** | Passenger names their fare → nearby drivers accept or counter-offer → passenger picks a driver |
| **Passenger** | Map-first booking, nearby drivers by vehicle type, live tracking, ride history, ratings, saved places, profile + photo |
| **Driver** | Online/offline, nearby request feed, accept/counter, trip state machine, earnings, location broadcast |
| **Maps** | Free OpenStreetMap (Leaflet in a WebView) + Nominatim geocoding — no Google Maps API / billing |
| **Admin** | Live platform metrics |

---

## 🧱 Tech Stack

| Category | Technology |
|---|---|
| Framework | React Native 0.76.9 + Expo SDK 52 |
| Language | JavaScript (files use `.tsx`/`.ts`, no TypeScript types) |
| State | Redux + Redux Thunk + Redux Persist + Immutable.js |
| Navigation | React Navigation (stacks + bottom tabs) |
| Forms | Formik + Yup |
| Styling | React Native `StyleSheet` + central `colors` + responsive `wp`/`hp` |
| Maps / Location | OpenStreetMap + Leaflet (WebView), Nominatim, expo-location |
| Backend | Supabase — PostgreSQL 15 + PostGIS, RLS, Realtime, Storage, Edge Functions |

---

## 🗂 Project Structure

```
Rideva/
├── App.tsx                     # Provider + PersistGate + Main
├── index.ts                    # Entry
├── babel.config.js             # Module-resolver aliases
├── supabase/                   # Migrations, edge functions, seed (backend)
└── src/
    ├── colors.ts               # Color palette
    ├── fonts.ts                # Font weights
    ├── config/constant.ts      # Env keys, vehicle classes, status copy
    ├── library/
    │   ├── supabase.ts          # Supabase client (AsyncStorage)
    │   └── location.js          # Geocoding, geometry, location watch
    ├── utils/utilities.ts       # wp, hp, currency, formatters
    ├── components/
    │   ├── common/              # Button, TextField, Header, Loader, EmptyState, NameAvatar, StatusBadge
    │   └── map/RideMap/         # OpenStreetMap WebView
    ├── store/                   # Redux: index, reducers + domain folders
    │   ├── Auth/                #   reducers.ts · actions.ts · api.js
    │   ├── Common/              #   booking pickup/dropoff, location
    │   ├── Loader/              #   global HUD
    │   ├── Ride/                #   booking, bids, tracking
    │   └── Driver/              #   online status, requests
    ├── stacks/                  # Navigators: index (Main), Auth/Passenger/Driver/Admin
    └── routes/                  # Screens (folder + index.tsx)
        ├── Auth/                #   Login · SignUp · ForgotPassword
        ├── Passenger/           #   Home · LocationPicker · RideTracking · RideSummary · Activity · SavedLocations
        ├── Driver/              #   Dashboard · ActiveTrip · Earnings
        ├── Shared/              #   Profile · EditProfile · Rate
        └── Admin/               #   Dashboard
```

### Path aliases
`@src` `@store` `@library` `@config` `@utils` `@components` `@routes` `@stacks` `@colors` `@fonts` `@assets` (configured in `babel.config.js` + `tsconfig.json`).

### Conventions
- **Redux per domain**: each `store/<Domain>/` has an Immutable `reducers.ts`, thunk `actions.ts`, and a `api.js` for Supabase calls. Screens connect with `connect(mapState, actions)` and read state via `.get()`.
- **Screens & components** are folders containing `index.tsx`; styles live in a `StyleSheet.create` at the bottom of each file using `colors` + `wp`/`hp`.
- **Plain JavaScript** inside `.tsx`/`.ts` files (no type annotations), no comments.

---

## 🚀 Getting Started

### 1. Install
```bash
cd Rideva
npm install --legacy-peer-deps
cp .env.example .env        # add your Supabase URL + anon key
```

### 2. Backend (Supabase)
Run the SQL migrations in `supabase/migrations/` (in order) via the Supabase SQL Editor, then optionally `supabase/seed.sql` for demo data.

`.env`:
```
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Run
```bash
npx expo start -c           # Expo Go
# or a dev build:
npx expo run:ios            # / npx expo run:android
```

### Demo accounts (after running `seed.sql`)
| Role | Email | Password |
|------|-------|----------|
| Passenger | `passenger@rideva.dev` | `Password123!` |
| Driver | `driver1@rideva.dev` | `Password123!` |
| Admin | `admin@rideva.dev` | `Password123!` |

---

## 🔁 How bidding works
1. Passenger sets pickup + destination, picks a vehicle type, and names a fare.
2. The request appears in nearby drivers' feeds; each can **Accept** the offer or **Counter** with their own price.
3. The passenger sees the driver offers (name, rating, vehicle, price, ETA) and picks one.
4. The trip runs through the state machine: accepted → arrived → in progress → completed; the driver's earnings and both ratings are recorded.

## 📄 License
MIT — for portfolio/demo use.
