# Config Flags — Backend & Mobile Architecture Challenge

A lightweight **React Native (Expo)** app that securely displays
**environment-specific feature flags** based on a user's account tier. The
backend is **local-only**: a Supabase Postgres instance (via the Supabase CLI)
fronted by a **Vercel Edge function**. All schema, policies, and environment
flows live in this repo as code — nothing is provisioned in the cloud.

```
┌──────────────┐   Bearer JWT    ┌───────────────────┐   RLS as user   ┌──────────────┐
│  Expo app    │ ───────────────▶│  Vercel Edge fn   │ ───────────────▶│  Supabase    │
│ (staging|prod)│   GET /api/flags│  api/flags.ts     │   anon + token  │  Postgres    │
└──────────────┘ ◀─────────────── └───────────────────┘ ◀─────────────── └──────────────┘
   secure session       only entitled flags          RLS gates every row
```

## How each requirement is met

| PDF deliverable | Implementation |
|---|---|
| Local Supabase, schema as code | [`supabase/config.toml`](supabase/config.toml), [`supabase/migrations/`](supabase/migrations) |
| Profiles + Feature Flags, premium/beta gating | `profiles.account_tier`, `feature_flags.required_tier`, `tier_rank()` |
| DB-level security, reject unauthorized read/write | Row Level Security policies in the migration |
| Local Vercel API serving configs | [`api/flags.ts`](api/flags.ts) (Edge runtime) |
| Staging vs Production toggle | [`app.config.js`](app.config.js) + [`src/lib/config.ts`](src/lib/config.ts) |
| Secure session across restarts | `expo-secure-store` adapter in [`src/lib/supabase.ts`](src/lib/supabase.ts) |
| E2E UI automation | [`.maestro/login_flow.yaml`](.maestro/login_flow.yaml) |
| Staging workflow | [`.github/workflows/ci.yml`](.github/workflows/ci.yml) on the `staging` branch |

## Prerequisites

```bash
npm i -g supabase vercel    # CLIs (or use npx)
brew install maestro        # E2E runner
```

## Run it locally

```bash
# 1. Install app deps
npm install

# 2. Bring up Postgres + apply migrations + seed (creates 3 test users + flags)
npm run db:start
npm run db:reset

# 3. Serve the API (reads .env — copy from .env.example first)
cp .env.example .env
npm run api:dev          # vercel dev on :3000

# 4. Run the app for an environment
npm run start:staging    # or: npm run start:production
```

### Seeded test users (password: `password123`)

| Email | Tier | Sees |
|---|---|---|
| `free@example.com` | free | free flags only |
| `premium@example.com` | premium | free + premium flags |
| `beta@example.com` | beta | all flags |

## E2E test

```bash
npm run test:e2e        # maestro test .maestro/login_flow.yaml
```

Logs in as the premium user and asserts the premium flag renders while the
beta-only flag does not — i.e. the database's RLS decision is reflected in the
UI. Also relaunches without clearing state to prove the session persists.

## Promotion workflow

`staging` is the integration branch (CI runs the full DB reset + type-check).
Promote to production by fast-forwarding `staging → main`.

See [`SCRIPT.md`](SCRIPT.md) for a guided walkthrough of the code.
