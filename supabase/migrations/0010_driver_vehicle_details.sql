-- =============================================================================
-- Rideva — Capture driver vehicle number (plate) + description at signup
-- =============================================================================
-- Drivers now supply a vehicle number (license plate) and a short vehicle
-- description at signup; this trigger persists them onto the drivers row so the
-- passenger can see "White Toyota Corolla · ABC-123" on each offer.
-- Run once in the SQL Editor.
-- =============================================================================

create or replace function public.tg_handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_role  user_role;
  v_class vehicle_class;
  v_plate text;
  v_make  text;
begin
  v_role := coalesce((new.raw_user_meta_data->>'role')::user_role, 'passenger');

  insert into public.profiles (id, role, full_name, email, phone)
  values (
    new.id, v_role,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.email, new.raw_user_meta_data->>'phone'
  ) on conflict (id) do nothing;

  if v_role = 'driver' then
    begin
      v_class := coalesce((new.raw_user_meta_data->>'vehicle_class')::vehicle_class, 'economy');
    exception when others then v_class := 'economy';
    end;
    v_plate := nullif(trim(new.raw_user_meta_data->>'license_plate'), '');
    v_make  := nullif(trim(new.raw_user_meta_data->>'vehicle_make'), '');

    insert into public.drivers (id, vehicle_class, is_verified, status, license_plate, vehicle_make)
    values (new.id, v_class, true, 'offline', v_plate, v_make)
    on conflict (id) do update
      set vehicle_class = excluded.vehicle_class,
          is_verified   = true,
          license_plate = coalesce(excluded.license_plate, public.drivers.license_plate),
          vehicle_make  = coalesce(excluded.vehicle_make, public.drivers.vehicle_make);
  end if;

  return new;
end$$;
