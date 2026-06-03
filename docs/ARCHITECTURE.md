# Rideva — Architecture

## 1. System overview

```
┌──────────────────────────── Mobile (Expo / RN) ────────────────────────────┐
│  Screens (presentational)                                                   │
│     │ read state                ▲ realtime push                            │
│     ▼                           │                                          │
│  Hooks (useActiveRide, useDriverTracking, useBooking, useIncomingOffers)   │
│     │                                                                       │
│  Services (auth, rides, location, notifications) ──► Supabase JS client     │
│  Store (Zustand: auth, booking)   Cache (TanStack Query)                    │
└────────────────────────────────────┬───────────────────────────────────────┘
                                      │ HTTPS / WSS
┌─────────────────────────────────── Supabase ───────────────────────────────┐
│  Auth (JWT)   PostgREST   Realtime (logical replication)   Storage          │
│  Edge Functions:  dispatch-ride · send-push                                 │
│  PostgreSQL 15 + PostGIS                                                     │
│     Tables · RLS · RPCs (calculate_fare, find_nearby_drivers,               │
│              accept_ride_offer, complete_ride, update_driver_location)      │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Layering principle:** screens never call the SDK directly. They read from Zustand/Query and call **services**. Services own all I/O and translate DB rows ↔ domain types (`services/mappers.ts`). Invariants that can't trust the client (atomic accept, fare, single active ride) live in **`SECURITY DEFINER` RPCs** and **constraints**, not app code.

## 2. Data model

| Table | Role |
|-------|------|
| `profiles` | 1:1 with `auth.users`; carries role for RBAC + rating aggregate |
| `drivers` | driver extension; `current_location` (geography) powers matching |
| `rides` | central trip aggregate + status state machine |
| `ride_offers` | dispatch ledger; partial unique index prevents double-pending |
| `driver_locations` | high-frequency GPS time-series |
| `payments` / `earnings` | fare settlement + driver payout ledger |
| `ratings` / `ride_reports` | bidirectional ratings + disputes |
| `notifications` | in-app feed (streamed via Realtime) |
| `pricing_config` | per-class tariff (admin-editable) |

Key constraints: partial **unique indexes** enforce *one active ride per passenger* and *per driver*; a `CHECK` rejects pickup==dropoff; money is **integer minor units**; geography is **SRID 4326** with **GiST** indexes.

## 3. The matching algorithm

1. `find_nearby_drivers` — PostGIS `<->` KNN over `drivers.current_location`, filtered to `online + verified + class + location fresh (<60s)`, excluding drivers already offered this ride or holding a pending offer. Backed by a GiST index and a partial index.
2. `dispatch-ride` edge function offers the closest candidate with a 15s TTL and push-notifies them. It is **stateless and idempotent per wave** — re-invoking advances to the next wave.
3. Auto-reassign: on reject/expiry the next wave offers the next driver and **expands the radius** (4km → +3km/wave). After 6 waves → `no_drivers`.
4. `accept_ride_offer` — `FOR UPDATE` locks resolve the race: the first accepter wins, the ride is assigned, sibling offers expire, driver flips to `on_trip`.

## 4. Real-time design

- **Ride state:** subscribe to `UPDATE` on the single `rides` row → push into Query cache. No polling for live state.
- **Driver location:** subscribe to `INSERT` on `driver_locations` filtered by `ride_id`. RLS guarantees scoping. Driver broadcasts via `update_driver_location` (one RPC writes both live column + time-series).
- **Offers:** driver subscribes to `ride_offers` changes for instant request cards.
- Publication `supabase_realtime` includes `rides`, `ride_offers`, `driver_locations`, `notifications`.

## 5. Trade-offs & notes
- **Dispatch cadence** is client-poked while matching for simplicity; in production move to `pg_cron` or a Realtime-triggered worker so it runs server-side independent of the passenger's connection.
- **Routing/ETA** uses a straight-line × road-factor estimate as a fallback; wire the Google Directions API in a `services/routing` module (the fare math + create payload already accept road distance + encoded polyline).
- **Denormalised `drivers.current_location`** trades a little write amplification for a fast, index-friendly matching query.
