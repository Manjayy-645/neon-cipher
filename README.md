# Neon Cipher

Neon Cipher is a mobile-first code-cracking game set across a fictional city. Players tap map locations and crack hidden digit codes; game rules and outcomes stay server-authoritative.

## Prerequisites

- Node.js LTS 24 (see `.nvmrc`).
- pnpm 9.15.9 (pinned in `package.json`).

## Install and run

```sh
pnpm install --frozen-lockfile
pnpm dev
```

For local environment configuration, copy `apps/web/.env.example` to `apps/web/.env.local` and use local or staging-only values.

## Checks

```sh
pnpm --filter web exec eslint .
pnpm --filter web exec tsc --noEmit
pnpm --filter web exec vitest run
pnpm --filter web build
```

## Repository map

- `apps/web/`: Next.js web application.
- `packages/game-rules/`: shared game rules and tests.
- `packages/tokens/`: design tokens.
- `supabase/`: database and function scaffolding.
- `docs/`: project, environment, security, release, and contribution guides.
- `assets-src/`: source design assets; runtime map icons are kept separately.

## Branches

- `main`: protected production branch.
- `develop`: protected integration branch.
- `feature/*`: feature work; open pull requests to `develop`.

See [Contributing](./docs/CONTRIBUTING.md), [Environments](./docs/ENVIRONMENTS.md), [Branch protection](./docs/BRANCH_PROTECTION.md), [Release](./docs/RELEASE.md), [Security](./docs/SECURITY.md), and the [style guide](./docs/STYLE_GUIDE.md).