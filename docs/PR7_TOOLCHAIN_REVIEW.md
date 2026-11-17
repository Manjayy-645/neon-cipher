# PR 7: compatible lint and TypeScript toolchain

TypeScript 7 from the previous `latest` range is outside typescript-eslint
8.71.1's supported range (`>=4.8.4 <6.1.0`). ESLint 10 is also outside several
Next configuration plugins' peer ranges. The web development dependencies now
pin TypeScript **6.0.3**, ESLint **9.39.5**, typescript-eslint **8.71.1**, and
eslint-config-next **16.4.0**. The lockfile is regenerated with pnpm 9.15.9;
runtime dependency resolutions are unchanged.

Next 16 supplies native flat configuration. Importing its core-web-vitals preset
replaces the obsolete FlatCompat wrapper; no rules are disabled, severity levels
lowered, or extra file exclusions added.

## Errors exposed by the repaired linter

The first working lint run exposed 81 existing errors. The source corrections
retain the same game rules and paper styling: hydration uses an external-store
snapshot; local dialogue/presentation state resets when its input changes;
DOM measurements happen after layout; event-handler refs update after commit;
rendered time uses a sampled clock, while authoritative timeout and event
callbacks still read the current time. Hook ordering, action naming and literal
JSX text are corrected. No game-rule implementation or server transport changes
are included. Existing warning-level diagnostics remain visible.

Two tutorial tests now await the animation frame that measures their DOM target;
their spotlight, guard count and accessible-label assertions remain intact.
Additional hook tests cover input resets, stale asynchronous updates and clock
cleanup. Existing timeout-loss tests still assert exact attempt counts and reason.

## Deterministic security integration tests

The old live Supabase tests depended on an unreachable hosted project; one test
also accepted any failed request as evidence of privacy. CI now starts a disposable
PostgreSQL 17.6 / PostgREST 13.0.7 / nginx 1.28.0 fixture, applies the repository's
unchanged migration, and uses locally signed anonymous and user JWTs. No hosted
credentials or service key are needed. The port binds only to localhost.

The fixture seeds two users, their settings, and a game secret, so empty results
cannot pass merely because there are no private rows. Tests require a successful
public read, exactly the authenticated user's settings, and denial of anonymous
settings and both users' access to game secrets. Only the known PostgreSQL
permission-denial code or a successful empty RLS result is accepted; network,
authentication and schema failures fail the suite. There are no skips or mocks.

Fixture scope: this tests the Data API and actual migration RLS, not GoTrue signup.
Seeding temporarily disables only the signup trigger and reenables it immediately.
That existing trigger references `ON CONFLICT (user_id)` on safehouses without a
matching unique constraint, so using signup to seed would fail. The production
migration and trigger are not altered; that separate schema issue remains outside
this toolchain fix.

Both GitHub security guard scripts are byte-for-byte unchanged. The previously
improved Supabase admin helper, explicit server-only markers, and admin tests
remain intact. Phase 1 modal ownership, fixed actions and quest suppression remain
intact; no design tokens, artwork or CSS styles are changed.

## Reproduce

With Node 24, Docker Compose and Python 3:

```sh
corepack pnpm install --frozen-lockfile
corepack pnpm --filter web exec eslint .
corepack pnpm --filter web exec tsc --noEmit
bash scripts/ci-data-api.sh start /tmp/neon-cipher-ci.env
set -a
. /tmp/neon-cipher-ci.env
set +a
corepack pnpm --filter web exec vitest run
corepack pnpm --filter web build
bash scripts/ci-data-api.sh stop
```

CI always attempts fixture cleanup, including after failures. Local browser
regression instructions and the Phase 1 flow assertions are in `docs/UX_PR1.md`.

## Local validation

- Frozen install, lint (0 errors; 33 visible warnings), TypeScript and production build pass.
- All 1,266 tests across 80 files pass, including real Data API/RLS tests and admin-boundary tests.
- Both unchanged CI guard scripts pass; runtime lockfile dependencies match the previous commit.
- All 35 Chromium overlay regression checks pass across 360×740, 390×844,
  844×390, 1366×768 and 1440×1000. Existing modal ownership, keyboard focus,
  visible actions and quest suppression assertions remain unchanged.
