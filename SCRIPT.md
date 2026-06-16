# Walkthrough Script — Config Flags

A spoken-style script for explaining this project in the interview. Roughly
8–10 minutes. Each section says **what to show**, then **what to say**.

---

## 0. Framing (30s)

> "The brief was a lightweight React Native app that securely shows
> environment-specific feature flags based on a user's account status, with a
> fully local backend — Supabase via the CLI and a Vercel function — and an E2E
> test. I'll walk the data from the database outward to the UI, because the
> whole design hangs off one decision: **the database is the security boundary,
> not the app.**"

---

## 1. Data model & the business rule — `supabase/migrations/20260616000000_init.sql`

**Show:** the two tables and the enums.

> "Two tables. `profiles` is one row per auth user and carries an
> `account_tier` enum — free, premium, or beta. `feature_flags` carries a
> `required_tier` and an `environment`. The business rule was 'premium/beta
> flags should only be visible to qualified users,' so I modeled qualification
> as an orderable tier."

**Show:** `tier_rank()` and `current_user_rank()`.

> "I map the enum to a rank — free 0, premium 1, beta 2 — so 'can this user see
> this flag' is a single comparison: the flag's required rank must be ≤ the
> user's rank. `current_user_rank()` looks up the *calling* user via
> `auth.uid()`."

---

## 2. Security at the DB layer — same file, RLS section

**Show:** `enable row level security` and the policies.

> "This is the core of the access-control requirement. RLS is on for both
> tables and it denies by default. For `profiles`, you can only select or update
> the row where `auth.uid() = id` — you can't read anyone else's profile. For
> `feature_flags`, the read policy returns only rows where the required tier is
> within the caller's rank. There is deliberately **no write policy**, so every
> insert or update from an anon or authenticated client is rejected by Postgres
> itself. Only the service-role key bypasses this, which is what migrations and
> seeds use."

> "The important property: even if the API had a bug, the rows for a higher
> tier never leave the database for an under-qualified user."

---

## 3. Seeding — `supabase/seed.sql`

**Show:** `_seed_user` helper and the flag inserts.

> "The seed is deterministic so the E2E test is reproducible. A small SQL helper
> creates confirmed email/password users plus their auth identities, then I set
> each one's tier. A trigger auto-creates the matching profile row on signup.
> Then a catalog of flags across all three tiers and tagged staging / production
> / all."

---

## 4. The API gateway — `api/flags.ts`

**Show:** the client construction with the forwarded token.

> "The mobile app never queries flags from Supabase directly — it goes through
> this Vercel Edge function, a single auditable gateway. The trick is here: I
> build the Supabase client with the **anon** key but forward the **user's JWT**
> in the Authorization header. So every query runs inside that user's RLS
> context. The function holds no elevated privilege — the database decides what
> comes back. On top of that I apply the environment filter so staging and
> production return different flag sets."

---

## 5. Environment toggling — `app.config.js` + `src/lib/config.ts`

**Show:** the `ENVIRONMENTS` map and `extra`.

> "Environment is chosen at build time by `APP_ENV`. `app.config.js` picks the
> staging or production block and bakes it into Expo's `extra`. At runtime
> `config.ts` is the only place that reads it, so nothing in the app talks to a
> hard-coded URL — flipping the env swaps the API and the database target
> cleanly. `npm run start:staging` versus `start:production`."

---

## 6. Secure session — `src/lib/secureStorage.ts` + `supabase.ts`

**Show:** the SecureStore adapter wired into `createClient`.

> "Session persistence is required to survive restarts *securely*. I back
> Supabase auth with `expo-secure-store`, which uses the iOS keychain and
> Android keystore — encrypted at rest, not plain AsyncStorage. Keys are
> namespaced per environment so a staging and production session can't collide
> on one device. On cold start `App.tsx` calls `getSession()` and a returning
> user lands straight on the flags screen."

---

## 7. The UI — `App.tsx`, `LoginScreen`, `FlagsScreen`

**Show:** the session-gated render in `App.tsx`.

> "The app is intentionally minimal: one piece of state — is there a session.
> No session shows login; a session shows the flags list. Every interactive
> element has a `testID` so the E2E test can drive it. The flags screen just
> renders whatever the API returned — it does no filtering of its own, which is
> the point: trust flows from the database."

---

## 8. E2E test — `.maestro/login_flow.yaml`

**Show:** the assertions.

> "I used Maestro because it's a few lines of YAML. It launches the app with
> cleared state, asserts the environment badge, signs in as the premium user,
> and then asserts the UI reflects the backend decision: the premium flag is
> visible and the beta-only flag is not. Finally it relaunches *without*
> clearing state and asserts the list is still there — proving session
> persistence. So one test exercises auth, the RLS gate, and persistence."

---

## 9. Workflow & wrap (30s)

> "Everything is code — no dashboard clicking. `supabase db reset` rebuilds the
> entire backend from migrations and seed. The `staging` branch runs CI that
> stands the stack up from scratch and type-checks; promotion to production is a
> fast-forward into `main`. The whole thing is lightweight: no navigation
> library, one API route, two tables, and the security lives in the place that
> can actually enforce it."

**Anticipated questions:**

- *"Why route through Vercel instead of calling Supabase directly?"* — A single
  server-side gateway is auditable, lets me add caching / rate-limiting / env
  logic without shipping an app update, and keeps the contract stable.
- *"How would staging and production really differ?"* — Two Supabase projects
  and two Vercel deployments; `app.config.js` already points at separate URLs
  per env, so it's just filling in real values.
- *"What stops a user forging a higher tier?"* — The tier lives in `profiles`,
  guarded by RLS, and `account_tier` is only writable by service-role. The JWT
  only proves identity; entitlement is resolved server-side from the DB.
