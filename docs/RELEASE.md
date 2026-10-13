# Release checklist

1. Confirm the release candidate is merged into `develop` and CI is green.
2. Test the candidate on its Vercel Preview deployment with the Supabase staging
   project.
3. Review required migrations, then apply the approved, merged migrations to the
   production Supabase project.
4. Confirm production environment variables are set only on the Vercel Production
   environment.
5. Open and review a pull request from `develop` to `main`; merge it to release.
6. Verify the Vercel Production deployment and key player flows.
7. If the deployment must be rolled back, use Vercel's deployment controls to
   promote the last known-good deployment. Handle database rollback separately;
   do not assume reverting an app deployment reverses a migration.
