# Config Flags

Small React Native (Expo) app that shows feature flags based on what tier a
user's account is on. Everything runs locally — Supabase through the CLI and a
Vercel function in front of it. No cloud stuff to set up, it's all in the repo.

The basic idea: the app logs in, hits the API with the user's token, and the
database decides which flags come back. A free user doesn't even see the premium
flags exist — that's enforced in Postgres with row level security, not in the
app code.

```
app  ->  /api/flags (vercel)  ->  supabase
         forwards the JWT          RLS filters rows by tier
```

## Stack

- Expo / React Native for the app
- Supabase local (Postgres + auth) via the CLI
- A Vercel edge function as the API gateway
- Maestro for the e2e test

## Running it locally

You need Docker running first (Supabase spins up containers).

```bash
npm install

# database
npm run db:start
npm run db:reset      # runs migrations + seed

# api  (separate terminal)
cp .env.example .env
npm run api:local     # http://localhost:3000

# app  (another terminal)
npm run start:device  # for a real phone over Expo Go
# or: npm run start:staging  and use a simulator
```

`api:local` is just a small node server that runs the same code as the Vercel
function without needing to log into Vercel. `npm run api:dev` is the real
`vercel dev` if you'd rather use that.

### Test logins

All three use the password `password123`:

- `free@example.com` — sees free flags only
- `premium@example.com` — free + premium
- `beta@example.com` — everything

Log in as one, then another, and watch the list change. That's the whole point.

## Where things live

- `supabase/migrations/` — tables, the tier ranking, and the RLS policies
- `supabase/seed.sql` — the 3 users + the flags
- `api/flags.ts` — the function that serves flags (forwards the user token so
  RLS runs as that user)
- `src/lib/config.ts` + `app.config.js` — staging vs production switching
- `src/lib/supabase.ts` — supabase client, session kept in expo-secure-store so
  it survives restarts
- `.maestro/login_flow.yaml` — e2e test (logs in, checks the right flags show)

## Environments

`APP_ENV` decides which backend the app points at. `npm run start:production`
swaps the whole config block. Locally they hit the same Supabase instance but
the flags are tagged per environment, so e.g. the production-only flag doesn't
show up in staging.

## Staging / prod branches

`staging` is where I work. CI on that branch stands the DB up from scratch and
typechecks. `main` is the production line — promote by merging staging in.

## E2E

```bash
npm run test:e2e
```

Needs a simulator running with the app installed. It logs in as the premium
user, checks the premium flag is there and the beta one isn't, then relaunches
to make sure the session stuck around.
