# Supabase projects

Maintain separate Supabase projects for staging and production. Do not use
production credentials for local development or Preview deployments.

## Link the CLI

After installing and authenticating the Supabase CLI, link to the intended
project from the repository root:

```sh
supabase link --project-ref YOUR_STAGING_PROJECT_REF
```

Before production work, explicitly link to the production project:

```sh
supabase link --project-ref YOUR_PRODUCTION_PROJECT_REF
```

Verify the linked project before every migration operation. Never assume a
previous link targets the intended environment.

## Migrations

Create migrations with descriptive names:

```sh
supabase migration new describe_change
```

Review and test the migration against staging, then apply it to staging:

```sh
supabase db push
```

Production may be changed only by migrations reviewed and merged into the
protected repository branch. After merging, link to production and apply the
merged migrations through the approved release process. Do not make manual
production schema changes.

`seed.sql` is reserved for fake staging data only. Do not put real player data,
production credentials, or production seed data in this repository. No schema
is defined by this scaffold.
