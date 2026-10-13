# Security

## Reporting

Report suspected vulnerabilities privately through the repository's GitHub
security reporting feature. Do not open a public issue or include exploit details,
credentials, or player data in a public pull request. Include affected areas,
impact, and safe reproduction steps in the private report.

## Secrets

- Keep credentials in local environment files or the appropriate Vercel
  environment; never commit them.
- Keep `.env.example` values as placeholders only.
- Keep `SUPABASE_SERVICE_ROLE_KEY` server-only. Never prefix it with
  `NEXT_PUBLIC_`, import it into client code, or send it to a browser.
- Use separate credentials for local, staging, and production. Production and
  payment keys must never be configured for Preview.
- If a credential is exposed, revoke or rotate it immediately and report the
  incident privately.

## Server authority

Secret game codes, scoring outcomes, balances, inventory, payouts, and unlocks
are server-authoritative. The client may display cached state but must not decide
or persist those outcomes. Keep code generation server-only until a game is
finished; keep scoring logic in `packages/game-rules` and cover it with tests.
