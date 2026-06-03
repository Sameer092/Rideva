-- =============================================================================
-- Rideva — Seed data (local development only)
-- =============================================================================
-- Creates a handful of demo accounts directly in auth.users (bypassing email
-- confirmation) plus online drivers positioned around downtown San Francisco
-- so the matching algorithm has candidates to work with.
--
-- Demo credentials (all): password "Password123!"
--   passenger@rideva.dev   — passenger
--   driver1@rideva.dev     — driver (economy, online)
--   driver2@rideva.dev     — driver (comfort, online)
--   admin@rideva.dev       — admin
-- =============================================================================

-- Helper to insert a confirmed auth user + return its id.
do $$
declare
  v_pass_id   uuid := gen_random_uuid();
  v_drv1_id   uuid := gen_random_uuid();
  v_drv2_id   uuid := gen_random_uuid();
  v_admin_id  uuid := gen_random_uuid();
  v_pw text := crypt('Password123!', gen_salt('bf'));
begin
  insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_user_meta_data, created_at, updated_at)
  values
    (v_pass_id,  '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'passenger@rideva.dev', v_pw, now(), '{"full_name":"Pat Passenger","role":"passenger"}', now(), now()),
    (v_drv1_id,  '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'driver1@rideva.dev',   v_pw, now(), '{"full_name":"Dana Driver","role":"driver"}',     now(), now()),
    (v_drv2_id,  '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'driver2@rideva.dev',   v_pw, now(), '{"full_name":"Drew Driver","role":"driver"}',     now(), now()),
    (v_admin_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'admin@rideva.dev',     v_pw, now(), '{"full_name":"Avery Admin","role":"admin"}',      now(), now());
  -- (profiles + drivers rows are auto-created by the on_auth_user_created trigger)

  -- Mark drivers online, verified, and positioned downtown SF.
  update public.drivers set
    status = 'online', is_verified = true, vehicle_class = 'economy',
    vehicle_make = 'Toyota', vehicle_model = 'Prius', vehicle_color = 'White',
    license_plate = '7RID001',
    current_location = st_setsrid(st_makepoint(-122.4194, 37.7749), 4326)::geography,
    location_updated_at = now()
  where id = v_drv1_id;

  update public.drivers set
    status = 'online', is_verified = true, vehicle_class = 'comfort',
    vehicle_make = 'Honda', vehicle_model = 'Accord', vehicle_color = 'Black',
    license_plate = '7RID002',
    current_location = st_setsrid(st_makepoint(-122.4144, 37.7793), 4326)::geography,
    location_updated_at = now()
  where id = v_drv2_id;
end $$;
