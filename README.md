# PrepSmart LanguageCert (LC) practice portal

Standalone Vite + React + TypeScript app for LanguageCert **speaking & writing** practice. It targets only the **`lc`** Postgres schema in your existing Supabase project so LMS data stays isolated.

## Quick start

```bash
cd prepsmart-lc-frontend
cp .env.example .env
# Fill VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
npm install
npm run dev
```

Open http://localhost:5174 (see `vite.config.ts`).

## Supabase

1. Run `../supabase/migrations/20260424000000_lc_schema.sql` in the SQL editor (or via Supabase CLI).
2. In **Project Settings → API**, add **`lc`** to **Exposed schemas** (keep `public` if the LMS needs it; this app’s client uses `db.schema = 'lc'` only).
3. **Auth (no email confirmation):** Dashboard → **Authentication** → **Providers** → **Email** → turn **off** “Confirm email” so new users get a **session immediately** and the app can send them to `/dashboard` without a confirmation link. (Password reset email is not used in this build.)

### If you see **“Invalid ID”** (email link or right after sign-up)

- **Turn off “Confirm email”** (step 3) and sign up again from the app — old confirmation links are one-time and often show errors if reused or the project URL changed.
- **Authentication → URL configuration:** set **Site URL** to exactly where you run the app (e.g. `http://localhost:5174`). Under **Redirect URLs**, add `http://localhost:5174/**` and your production URLs.
- **Clear old Supabase sessions in the browser:** DevTools → Application → Local Storage → remove keys starting with `prepsmart-lc-auth-` and any `sb-*` for this site, then hard-refresh (**Ctrl+Shift+R**). The app now uses a **per-project** storage key so switching Supabase projects does not mix sessions.
4. Promote your user to admin (once) if you need `/admin/*`:

```sql
update lc.user_profiles set role = 'admin' where email = 'your@email.com';
```

5. Optional: insert a trial subscription for testing practice unlock:

```sql
insert into lc.subscriptions (user_id, plan, status, current_period_start, current_period_end)
select id, 'monthly', 'active', now(), now() + interval '30 days'
from lc.user_profiles where email = 'your@email.com';
```

## Product notes

- **Auth:** email + password only in this phase (Google OAuth & email provider deferred).
- **Speaking sets:** supports a 15-question mode (question audio only) and a legacy academic-parts mode.
- **Realtime speaking feedback:** set `VITE_REALTIME_SPEAKING_WS_URL` to enable WebSocket scoring (frontend sends audio + metadata and waits for final score). If not set, scoring uses the existing REST endpoint.
- **Stripe:** subscription UI and paywall logic are wired to `lc.subscriptions`; Checkout/Portal/webhooks are a follow-up.

## Stack

Vite 5, React 18, Tailwind + shadcn-style primitives, TanStack Query, Zustand (available; auth uses React context), Supabase JS with **`lc`** schema, Recharts, React Hook Form + Zod, Lucide.
