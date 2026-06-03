-- =============================================================================
-- Rideva — Initial Schema
-- PostgreSQL 15 (Supabase) with PostGIS for geospatial queries
-- =============================================================================
-- This migration creates the core relational model for the ride-booking
-- platform: identities, driver profiles, rides, payments, ratings, realtime
-- location streams and earnings ledger.
--
-- Design notes:
--   * `auth.users` is owned by Supabase Auth. We mirror app-level identity into
--     `public.profiles` (1:1) keyed by the auth uid.
--   * Geography columns use SRID 4326 (WGS84 lon/lat). We index them with GiST.
--   * Money is stored as integer minor units (cents) to avoid float drift.
--   * Enums are first-class Postgres types for status machines.
-- =============================================================================

create extension if not exists "postgis";
create extension if not exists "pgcrypto";       -- gen_random_uuid()
create extension if not exists "pg_trgm";         -- fuzzy search on addresses

-- -----------------------------------------------------------------------------
-- Enums
-- -----------------------------------------------------------------------------
create type user_role        as enum ('passenger', 'driver', 'admin');
create type account_status   as enum ('active', 'suspended', 'banned', 'pending');
create type driver_status    as enum ('offline', 'online', 'on_trip');
create type vehicle_class     as enum ('economy', 'comfort', 'xl', 'premium');
create type ride_status      as enum (
  'requested',     -- passenger created request, searching for driver
  'matching',      -- offers being dispatched to drivers
  'accepted',      -- a driver accepted, en route to pickup
  'arriving',      -- driver close to pickup
  'arrived',       -- driver at pickup, waiting
  'in_progress',   -- trip started
  'completed',     -- trip finished, awaiting payment settle
  'cancelled',     -- cancelled by passenger/driver/system
  'no_drivers'     -- matching exhausted
);
create type ride_offer_status as enum ('pending', 'accepted', 'rejected', 'expired', 'cancelled');
create type payment_method    as enum ('cash', 'card', 'wallet');
create type payment_status    as enum ('pending', 'authorized', 'paid', 'failed', 'refunded');
create type cancelled_by       as enum ('passenger', 'driver', 'system');
create type notification_type as enum (
  'ride_requested', 'ride_accepted', 'driver_arriving', 'driver_arrived',
  'ride_started', 'ride_completed', 'payment_confirmed', 'ride_cancelled', 'system'
);

-- -----------------------------------------------------------------------------
-- profiles  (1:1 with auth.users)
-- -----------------------------------------------------------------------------
create table public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  role          user_role      not null default 'passenger',
  status        account_status not null default 'active',
  full_name     text           not null check (char_length(full_name) between 1 and 120),
  phone         text           unique,
  email         text           unique,
  avatar_url    text,
  rating_avg    numeric(3,2)   not null default 5.00 check (rating_avg between 0 and 5),
  rating_count  integer        not null default 0 check (rating_count >= 0),
  push_token    text,                       -- Expo push token
  created_at    timestamptz    not null default now(),
  updated_at    timestamptz    not null default now()
);
comment on table public.profiles is 'App-level identity, 1:1 with auth.users.';

create index profiles_role_idx   on public.profiles (role);
create index profiles_status_idx on public.profiles (status);
create index profiles_name_trgm  on public.profiles using gin (full_name gin_trgm_ops);

-- -----------------------------------------------------------------------------
-- drivers  (1:1 extension of a profile with role='driver')
-- -----------------------------------------------------------------------------
create table public.drivers (
  id                 uuid primary key references public.profiles(id) on delete cascade,
  status             driver_status  not null default 'offline',
  vehicle_class      vehicle_class  not null default 'economy',
  vehicle_make       text,
  vehicle_model      text,
  vehicle_color      text,
  license_plate      text           unique,
  license_number     text,
  is_verified        boolean        not null default false,
  -- denormalised live location for fast matching (also streamed in driver_locations)
  current_location   geography(Point, 4326),
  heading            numeric(5,2),          -- compass degrees 0..360
  speed_kmh          numeric(6,2),
  location_updated_at timestamptz,
  total_trips        integer        not null default 0,
  created_at         timestamptz    not null default now(),
  updated_at         timestamptz    not null default now()
);
comment on table public.drivers is 'Driver-specific data; current_location powers the matching geo-query.';

-- GiST index over the live location — the heart of nearest-driver search.
create index drivers_location_gix on public.drivers using gist (current_location);
-- Partial index: matching only ever scans online & verified drivers.
create index drivers_online_idx on public.drivers (status)
  where status = 'online' and is_verified = true;

-- -----------------------------------------------------------------------------
-- saved_locations  (passenger favourites: home, work, custom)
-- -----------------------------------------------------------------------------
create table public.saved_locations (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  label       text not null check (char_length(label) between 1 and 60),
  address     text not null,
  point       geography(Point, 4326) not null,
  created_at  timestamptz not null default now(),
  unique (user_id, label)
);
create index saved_locations_user_idx on public.saved_locations (user_id);

-- -----------------------------------------------------------------------------
-- rides  (the central trip aggregate)
-- -----------------------------------------------------------------------------
create table public.rides (
  id                 uuid primary key default gen_random_uuid(),
  passenger_id       uuid not null references public.profiles(id) on delete restrict,
  driver_id          uuid          references public.profiles(id) on delete set null,
  status             ride_status not null default 'requested',
  vehicle_class      vehicle_class not null default 'economy',

  -- locations
  pickup_address     text not null,
  pickup_point       geography(Point, 4326) not null,
  dropoff_address    text not null,
  dropoff_point      geography(Point, 4326) not null,

  -- route / estimate (filled at request time)
  distance_m         integer  check (distance_m >= 0),     -- planned distance, metres
  duration_s         integer  check (duration_s >= 0),     -- planned duration, seconds
  route_polyline     text,                                 -- encoded polyline for replay

  -- fare (minor units, e.g. cents). estimate at request, final at completion.
  currency           char(3)  not null default 'USD',
  fare_estimate      integer  check (fare_estimate >= 0),
  fare_final         integer  check (fare_final >= 0),
  surge_multiplier   numeric(4,2) not null default 1.00 check (surge_multiplier >= 1),

  payment_method     payment_method not null default 'cash',

  -- lifecycle timestamps
  requested_at       timestamptz not null default now(),
  accepted_at        timestamptz,
  arrived_at         timestamptz,
  started_at         timestamptz,
  completed_at       timestamptz,
  cancelled_at       timestamptz,
  cancelled_by       cancelled_by,
  cancellation_reason text,

  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),

  -- a passenger may only have one "live" ride at a time (enforced via partial unique below)
  constraint dropoff_differs_from_pickup
    check (st_distance(pickup_point, dropoff_point) > 10)
);
comment on table public.rides is 'Central trip aggregate; status drives the realtime state machine.';

create index rides_passenger_idx on public.rides (passenger_id, created_at desc);
create index rides_driver_idx    on public.rides (driver_id, created_at desc);
create index rides_status_idx    on public.rides (status);
create index rides_pickup_gix    on public.rides using gist (pickup_point);

-- A passenger can only have ONE active ride at any time.
create unique index rides_one_active_per_passenger
  on public.rides (passenger_id)
  where status in ('requested','matching','accepted','arriving','arrived','in_progress');

-- A driver can only be on ONE active ride at any time.
create unique index rides_one_active_per_driver
  on public.rides (driver_id)
  where status in ('accepted','arriving','arrived','in_progress') and driver_id is not null;

-- -----------------------------------------------------------------------------
-- ride_offers  (dispatch ledger: which drivers were offered which ride)
-- -----------------------------------------------------------------------------
create table public.ride_offers (
  id          uuid primary key default gen_random_uuid(),
  ride_id     uuid not null references public.rides(id) on delete cascade,
  driver_id   uuid not null references public.profiles(id) on delete cascade,
  status      ride_offer_status not null default 'pending',
  distance_m  integer,                       -- driver→pickup distance at offer time
  eta_s       integer,                       -- estimated seconds to pickup
  offered_at  timestamptz not null default now(),
  expires_at  timestamptz not null,
  responded_at timestamptz,
  unique (ride_id, driver_id)
);
create index ride_offers_ride_idx   on public.ride_offers (ride_id);
create index ride_offers_driver_idx on public.ride_offers (driver_id, status);
-- Only one pending offer per driver at a time (so we don't double-book a driver).
create unique index ride_offers_one_pending_per_driver
  on public.ride_offers (driver_id) where status = 'pending';

-- -----------------------------------------------------------------------------
-- driver_locations  (high-frequency location stream, time-series)
-- -----------------------------------------------------------------------------
create table public.driver_locations (
  id          bigint generated always as identity primary key,
  driver_id   uuid not null references public.profiles(id) on delete cascade,
  ride_id     uuid references public.rides(id) on delete set null,
  point       geography(Point, 4326) not null,
  heading     numeric(5,2),
  speed_kmh   numeric(6,2),
  recorded_at timestamptz not null default now()
);
-- Most reads are "latest point for ride X" or "track for ride X".
create index driver_locations_ride_idx on public.driver_locations (ride_id, recorded_at desc);
create index driver_locations_driver_idx on public.driver_locations (driver_id, recorded_at desc);

-- -----------------------------------------------------------------------------
-- payments
-- -----------------------------------------------------------------------------
create table public.payments (
  id              uuid primary key default gen_random_uuid(),
  ride_id         uuid not null unique references public.rides(id) on delete cascade,
  payer_id        uuid not null references public.profiles(id) on delete restrict,
  method          payment_method not null,
  status          payment_status not null default 'pending',
  currency        char(3) not null default 'USD',
  -- fare breakdown (minor units)
  base_fare       integer not null default 0 check (base_fare >= 0),
  distance_fare   integer not null default 0 check (distance_fare >= 0),
  time_fare       integer not null default 0 check (time_fare >= 0),
  surge_amount    integer not null default 0 check (surge_amount >= 0),
  booking_fee     integer not null default 0 check (booking_fee >= 0),
  tip_amount      integer not null default 0 check (tip_amount >= 0),
  total_amount    integer not null check (total_amount >= 0),
  -- Stripe-ready fields (nullable; populated when card flow is enabled)
  stripe_payment_intent_id text,
  stripe_charge_id         text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index payments_payer_idx on public.payments (payer_id, created_at desc);

-- -----------------------------------------------------------------------------
-- earnings  (driver ledger entry per completed ride)
-- -----------------------------------------------------------------------------
create table public.earnings (
  id              uuid primary key default gen_random_uuid(),
  driver_id       uuid not null references public.profiles(id) on delete cascade,
  ride_id         uuid not null unique references public.rides(id) on delete cascade,
  payment_id      uuid references public.payments(id) on delete set null,
  currency        char(3) not null default 'USD',
  gross_amount    integer not null check (gross_amount >= 0),   -- total fare
  platform_fee    integer not null default 0 check (platform_fee >= 0),
  net_amount      integer not null check (net_amount >= 0),     -- gross - fee
  created_at      timestamptz not null default now()
);
create index earnings_driver_idx on public.earnings (driver_id, created_at desc);

-- -----------------------------------------------------------------------------
-- ratings  (bidirectional: passenger↔driver, one per direction per ride)
-- -----------------------------------------------------------------------------
create table public.ratings (
  id          uuid primary key default gen_random_uuid(),
  ride_id     uuid not null references public.rides(id) on delete cascade,
  rater_id    uuid not null references public.profiles(id) on delete cascade,
  ratee_id    uuid not null references public.profiles(id) on delete cascade,
  score       smallint not null check (score between 1 and 5),
  comment     text check (char_length(comment) <= 500),
  created_at  timestamptz not null default now(),
  unique (ride_id, rater_id)        -- one rating per rater per ride
);
create index ratings_ratee_idx on public.ratings (ratee_id);

-- -----------------------------------------------------------------------------
-- ride_reports  (dispute / safety reports)
-- -----------------------------------------------------------------------------
create table public.ride_reports (
  id          uuid primary key default gen_random_uuid(),
  ride_id     uuid not null references public.rides(id) on delete cascade,
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  category    text not null,
  description text not null check (char_length(description) between 1 and 2000),
  resolved    boolean not null default false,
  resolved_by uuid references public.profiles(id) on delete set null,
  created_at  timestamptz not null default now()
);
create index ride_reports_open_idx on public.ride_reports (resolved) where resolved = false;

-- -----------------------------------------------------------------------------
-- notifications  (in-app feed; push delivery handled by edge function)
-- -----------------------------------------------------------------------------
create table public.notifications (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  type        notification_type not null,
  title       text not null,
  body        text not null,
  data        jsonb not null default '{}'::jsonb,
  read_at     timestamptz,
  created_at  timestamptz not null default now()
);
create index notifications_user_idx on public.notifications (user_id, created_at desc);
create index notifications_unread_idx on public.notifications (user_id) where read_at is null;

-- -----------------------------------------------------------------------------
-- pricing_config  (per vehicle-class tariff; editable from admin)
-- -----------------------------------------------------------------------------
create table public.pricing_config (
  vehicle_class    vehicle_class primary key,
  currency         char(3) not null default 'USD',
  base_fare        integer not null,          -- minor units
  per_km           integer not null,          -- minor units per km
  per_min          integer not null,          -- minor units per minute
  booking_fee      integer not null default 0,
  min_fare         integer not null,
  platform_fee_bps integer not null default 2000,  -- 20.00% in basis points
  updated_at       timestamptz not null default now()
);

insert into public.pricing_config (vehicle_class, base_fare, per_km, per_min, booking_fee, min_fare) values
  ('economy', 250, 120, 25, 100, 500),
  ('comfort', 350, 160, 35, 150, 700),
  ('xl',      450, 200, 45, 200, 900),
  ('premium', 600, 280, 60, 250, 1200);
