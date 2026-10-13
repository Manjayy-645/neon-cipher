# Contributing

## Branches

- `main` is production and must be protected.
- `develop` is the integration branch and must be protected.
- Create feature work on `feature/<short-description>` and open a pull request to
  `develop`.
- Promote reviewed integration work from `develop` to `main` through a pull request.

## Commits

Use Conventional Commit messages, for example `feat: add district filter`,
`fix: preserve terminal input`, or `docs: clarify local setup`.

## Local checks

Use the Node.js LTS release pinned by `.nvmrc` and the pnpm version specified in
the root `package.json`.

```sh
pnpm install --frozen-lockfile
pnpm --filter web exec eslint .
pnpm --filter web exec tsc --noEmit
pnpm --filter web exec vitest run
pnpm --filter web build
```

## Previews and UI review

Vercel's GitHub integration creates a Preview deployment for every branch. Do
not use production credentials or payment keys in Preview; see
[ENVIRONMENTS.md](./ENVIRONMENTS.md).

UI changes must include screenshots captured at 390x844 in the pull request.
Check reduced motion, keyboard access, contrast in grayscale, and 44px minimum
touch targets before requesting review.
