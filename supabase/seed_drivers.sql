-- =============================================================================
-- Rideva — Seed a fleet of online drivers (varied vehicle types) around SF
-- =============================================================================
-- Creates fleet1@rideva.dev … fleet12@rideva.dev (password Password123!), each
-- a different vehicle type, online & verified, scattered ~1km around downtown
-- San Francisco (37.7749, -122.4194) — which is the iOS simulator's default GPS.
-- They appear as vehicle markers on the passenger map and are matchable.
--
-- To place them around YOUR city instead, change v_lat / v_lng below.
-- Safe to re-run: it skips emails that already exist.
-- =============================================================================
do $$
declare
  v_pw      text := crypt('Password123!', gen_salt('bf'));
  v_id      uuid;
  v_email   text;
  v_classes text[] := array['motorcycle','rickshaw','economy','economy','comfort','xl','premium','motorcycle','economy','rickshaw','comfort','economy'];
  v_makes   text[] := array['Honda','Bajaj','Toyota','Suzuki','Honda','Toyota','Mercedes','Yamaha','Kia','Bajaj','Honda','Hyundai'];
  v_models  text[] := array['CG125','RE','Corolla','Alto','Civic','Hiace','E-Class','YBR','Sportage','RE','City','Elantra'];
  v_lat     double precision := 37.7749;
  v_lng     double precision := -122.4194;
  i integer;
begin
  for i in 1 .. array_length(v_classes, 1) loop
    v_email := 'fleet' || i || '@rideva.dev';
    if exists (select 1 from auth.users where email = v_email) then continue; end if;

    v_id := gen_random_uuid();
    insert into auth.users (
      id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_user_meta_data, raw_app_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change, email_change_token_new,
      email_change_token_current, reauthentication_token, phone_change, phone_change_token
    ) values (
      v_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
      v_email, v_pw, now(),
      json_build_object('full_name', 'Driver ' || i, 'role', 'driver', 'vehicle_class', v_classes[i])::jsonb,
      '{"provider":"email","providers":["email"]}', now(), now(),
      '', '', '', '', '', '', '', ''
    );
    insert into auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
    values (gen_random_uuid(), v_id,
      json_build_object('sub', v_id::text, 'email', v_email)::jsonb, 'email', v_id::text, now(), now(), now());

    -- the on_auth_user_created trigger already made profile + drivers (verified,
    -- correct vehicle_class). Put them online with a scattered location + car.
    update public.drivers set
      status = 'online',
      vehicle_make = v_makes[i], vehicle_model = v_models[i], vehicle_color = 'White',
      license_plate = 'FLEET' || i,
      current_location = st_setsrid(
        st_makepoint(v_lng + (random() - 0.5) * 0.02, v_lat + (random() - 0.5) * 0.02), 4326)::geography,
      location_updated_at = now()
    where id = v_id;
  end loop;
end $$;
