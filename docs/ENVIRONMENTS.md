# Environments

Keep local, staging, and production configuration separate. Never copy credentials
between environments.

| Environment | App deployment | Supabase project | `NEXT_PUBLIC_APP_ENV` |
| --- | --- | --- | --- |
| Local | Local Next.js development server | Local Supabase or non-production test values | `local` |
| Staging | Vercel Preview deployment | Dedicated Supabase staging project | `staging` |
| Production | Vercel Production deployment | Dedicated Supabase production project | `production` |

## Variables

- `NEXT_PUBLIC_SUPABASE_URL`: environment-specific Supabase project URL.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: environment-specific public anonymous key.
- `SUPABASE_SERVICE_ROLE_KEY`: server-only key. Never prefix it with `NEXT_PUBLIC_`,
  expose it to browser code, or add it to a client payload.
- `NEXT_PUBLIC_APP_ENV`: `local`, `staging`, or `production`.
- `NEXT_PUBLIC_FEATURE_*`: public feature switches. Keep the current defaults in
  both environment examples aligned.

For local development, copy `apps/web/.env.example` to `apps/web/.env.local` and
fill it with local or staging-only values. The root `.env.example` documents the
same variables for repository tooling; Next.js reads the app-local environment file.

In Vercel, configure staging values for Preview and production values only for
Production. **Production credentials and all payment keys must never be set for
Preview deployments.** Do not add production or payment credentials to local
files, examples, logs, or pull requests.
