-- =============================================================================
-- Rideva — New users start unrated (0.00 / 0 ratings) instead of a fake 5.00
-- =============================================================================
-- Run once in the SQL Editor.
-- =============================================================================

alter table public.profiles alter column rating_avg set default 0.00;

-- Existing users who have never been rated → reset their placeholder 5.00 to 0.
update public.profiles set rating_avg = 0.00 where rating_count = 0;

-- Aggregation fallback: when a ratee has no ratings, keep 0.00 (not 5.00).
create or replace function public.tg_recompute_rating()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_avg numeric(3,2);
  v_cnt integer;
begin
  select round(avg(score)::numeric, 2), count(*)
    into v_avg, v_cnt
    from public.ratings where ratee_id = new.ratee_id;

  update public.profiles
     set rating_avg = coalesce(v_avg, 0.00), rating_count = v_cnt
   where id = new.ratee_id;

  return new;
end$$;
