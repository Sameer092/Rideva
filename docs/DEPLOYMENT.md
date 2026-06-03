# Rideva — Deployment Guide

Two halves ship independently: the **Supabase backend** and the **Expo mobile app**.

---

## 1. Backend (Supabase)

### 1.1 Create the project
1. Create a project at [supabase.com](https://supabase.com).
2. Note the **Project URL**, **anon key** (Settings → API), and **service role key** (keep secret).
3. Link the CLI:
   ```bash
   supabase login
   supabase link --project-ref <your-ref>
   ```

### 1.2 Apply schema + functions
```bash
supabase db push                 # applies migrations 0001 → 0003
# (do NOT run seed.sql in production — it creates demo accounts)
supabase functions deploy dispatch-ride
supabase functions deploy send-push
```

### 1.3 Function secrets
```bash
supabase secrets set \
  SUPABASE_URL=https://<ref>.supabase.co \
  SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
```

### 1.4 Auth providers (Dashboard → Authentication → Providers)
- **Email:** enable confirmations for production.
- **Google:** create an OAuth client (Google Cloud Console), add the web client id/secret, set redirect `https://<ref>.supabase.co/auth/v1/callback`.
- **Apple:** configure a Services ID + key (Apple Developer), add to the Apple provider.
- Add `rideva://auth/callback` to the allowed redirect URLs.

### 1.5 Storage
Buckets `avatars` (public) and `driver-documents` (private) are declared in `config.toml`; create them in the dashboard if not auto-provisioned, and confirm policies.

### 1.6 Production dispatch (recommended)
Replace client-poked dispatch with a server-side trigger:
```sql
-- pg_cron example: re-run dispatch for stale matching rides every 5s
select cron.schedule('rideva-dispatch', '5 seconds', $$
  select net.http_post(
    url := 'https://<ref>.functions.supabase.co/dispatch-ride',
    headers := '{"Content-Type":"application/json"}'::jsonb,
    body := json_build_object('ride_id', id)::jsonb)
  from public.rides where status in ('requested','matching');
$$);
```

---

## 2. Mobile app (EAS)

### 2.1 Configure
- Put production `EXPO_PUBLIC_SUPABASE_URL` / `_ANON_KEY` into EAS secrets or `eas.json` env.
- Add real Google Maps API keys in `app.json` (`ios.config.googleMapsApiKey`, `android.config.googleMaps.apiKey`).
- Set the EAS `projectId` in `app.json → extra.eas`.

### 2.2 Build
```bash
npm install -g eas-cli
eas login
eas build:configure
eas build --platform ios       # → .ipa
eas build --platform android   # → .aab
```

### 2.3 Push notifications
- iOS: upload an APNs key in Expo / EAS credentials.
- Android: FCM is handled by Expo's push service automatically.
- The `send-push` function targets the Expo token stored on each profile.

### 2.4 Submit
```bash
eas submit --platform ios       # App Store Connect
eas submit --platform android   # Google Play
```

### 2.5 OTA updates
```bash
eas update --branch production --message "hotfix"
```

---

## 3. Pre-launch checklist
- [ ] RLS enabled on every table (`select * from pg_tables` → verify `rowsecurity`)
- [ ] Email confirmations ON; OAuth redirects whitelisted
- [ ] Service role key only in function secrets (never in the app bundle)
- [ ] Maps keys restricted by bundle id / SHA-1
- [ ] Server-side dispatch (pg_cron) enabled
- [ ] Stripe keys set if card payments enabled; webhooks verified
- [ ] Sentry/observability wired; Postgres backups + PITR on
