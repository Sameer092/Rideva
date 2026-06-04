-- =============================================================================
-- Rideva — Avatars storage bucket + policies
-- =============================================================================
-- Public "avatars" bucket; each user may write only into their own folder
-- (path = "<uid>/..."). Reads are public so avatars render anywhere.
-- Run once in the SQL Editor.
-- =============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 5242880, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public = true;

drop policy if exists "avatars public read"  on storage.objects;
drop policy if exists "avatars insert own"   on storage.objects;
drop policy if exists "avatars update own"   on storage.objects;
drop policy if exists "avatars delete own"   on storage.objects;

create policy "avatars public read" on storage.objects
  for select using (bucket_id = 'avatars');

create policy "avatars insert own" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "avatars update own" on storage.objects
  for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "avatars delete own" on storage.objects
  for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
