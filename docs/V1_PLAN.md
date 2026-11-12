# BITE v1: from demo to real app

Goal: a working app real people can use in a pilot in Aalen, shown live to the INNO-Z (EXIST) 6 to 8 weeks after 12 Nov 2026.
The demo stays available (`bite.html` without a backend = demo mode), so pitches keep working.

## Stack (all managed services, nothing to run ourselves)
| Need | Service | Cost at pilot size |
| --- | --- | --- |
| Database, login, file storage, live chat | Supabase (EU region, Frankfurt) | free tier |
| Payments with the 12% fee split to hosts | Stripe Connect | per transaction only |
| ID check for hosts | manual video call in the pilot, Veriff/IDnow later | 0 in the pilot |
| Website + app hosting | GitHub Pages (already live) | free |

## Weeks
1. **Backend** (done 12 Nov 2026): database schema with security rules (`supabase/migrations/0001_init.sql`), installed on the live Supabase project `bite` (Frankfurt, https://hvwcuiknfqhbrjdbcooz.supabase.co). The 48 tests in `supabase/tests/rls_test.sql` passed locally and on the live database (run inside a transaction that is rolled back, so no test data is left).
2. **Accounts** (done 12 Nov 2026, live mode only): real sign-up with email + password and email confirmation, log-in, forgot password, profile and settings saved in the database (`src/app/liveAuth.ts`, migration `0002_profile_settings.sql`). Checked by `e2e/live_auth.test.cjs` (20 checks, Supabase mocked, no real account created). Open with `bite.html?live`, back to the demo with `bite.html?demo`.
3. **Hosting** (done 12 Nov 2026, live mode): "Start hosting" publishes a real meal; photos go to Supabase Storage (bucket `meal-photos`, each host writes only in their own folder); the street is stored apart and shown only to the host and accepted guests. Live mode shows only real meals.
4. **Booking** (done 12 Nov 2026, live mode): guest asks for seats → host accepts or declines → address revealed; guest cancels; host cancels the meal and every booking is cancelled with it; seats can never be overbooked. No false claims in live mode (no "verified" badge unless Bite checked the host, no insurance promise, no fake card).
5. **Chat** (done 12 Nov 2026, live mode): real messages, "message the host" before booking, unread counts, read receipts; updates arrive live (Supabase Realtime) and when the app comes back to the front.
6. **Payments**: Stripe Connect (host onboarding, guest pays in the app, fee kept by Bite).
7. **Safety and launch**: report button, host verification flag, legal texts updated, pilot with 5 to 10 hosts.
8. **Buffer and live demo** for INNO-Z.

## What the database guarantees (60 automatic tests)
- Nobody can publish in someone else's name, change or delete someone else's meal.
- Guests can only ask for seats; only the host can accept. Overbooking is impossible.
- The exact address is visible only to the host and confirmed guests.
- Chats are visible only to the two people in them; messages cannot be edited afterwards.
- Users cannot mark themselves as verified; reviews only after the dinner took place.

Run the tests locally: `supabase/tests/run.sh` (needs PostgreSQL 16). Browser tests: see `e2e/README.md` (demo smoke test, live log-in with 20 checks, full two-person flow with 24 checks).

## Before real users (not only the founders) can sign up
- Supabase's built-in email sender only delivers to the project team and only a few emails per hour.
  Connect a real sender (for example Resend, free tier) in Authentication -> Emails -> SMTP settings, with a bite address as sender.
- Brand the confirmation and reset emails (Authentication -> Emails -> Templates), in English and German.
- A short security review by a developer before payments go live.
