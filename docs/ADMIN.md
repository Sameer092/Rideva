# Rideva — Admin Panel Architecture

The admin experience is split:
- **Mobile (in-app):** a lightweight live-monitoring surface for on-call admins (`src/screens/admin/AdminScreen.tsx`) — platform metrics, refreshed every 15s using the admin's RLS-elevated access.
- **Web dashboard (recommended build):** the full operations console. Backend is already in place; only the web front end is out of scope for the mobile repo.

## Capabilities (web dashboard)

| Domain | Actions | Backed by |
|--------|---------|-----------|
| Users | list/search, view profile, **suspend/ban** | `profiles.status` + `is_admin()` policies |
| Drivers | verify documents, approve, set `vehicle_class`, block | `drivers.is_verified`, `driver-documents` bucket |
| Rides | live monitor, force-cancel, inspect route/timeline | `rides` + `driver_locations` |
| Analytics | trips/day, revenue, surge, driver utilisation | SQL views / materialized views |
| Disputes | triage `ride_reports`, resolve, refund | `ride_reports`, `payments` |
| Pricing | edit tariffs, surge multipliers | `pricing_config` |

## Why it's already supported
- Every table's RLS includes an `is_admin()` branch granting full read/write, so the same Postgres + PostgREST API serves the dashboard — **no separate backend**.
- A user becomes admin by setting `profiles.role = 'admin'` (do this manually / via a protected migration, never from the client).

## Recommended web stack
- **Next.js + supabase-js** (service role on the server, anon + admin JWT on the client) or **Supabase Studio**-style internal tool.
- Reuse the same domain types (`src/types`) and mappers by extracting them to a shared package in a monorepo.
- Realtime subscriptions to `rides` power a live ops map.

## Suggested analytics views
```sql
create view admin_daily_metrics as
select date_trunc('day', completed_at) as day,
       count(*)               as trips,
       sum(fare_final)        as gross_minor,
       avg(fare_final)        as avg_fare_minor
from rides where status = 'completed'
group by 1 order by 1 desc;
```
Expose via an `is_admin()`-guarded policy or a Postgres function.
