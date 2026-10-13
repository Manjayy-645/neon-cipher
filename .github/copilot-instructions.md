# Neon Cipher coding instructions

- Keep secrets, generated game codes, and authoritative balances server-side. The client is a display cache.
- Put scoring rules in `packages/game-rules` and add tests before changing scoring.
- Use design tokens; do not hardcode colors, radii, spacing, or fonts. Read the [style guide](../docs/STYLE_GUIDE.md) before UI work.
- Make small, focused changes. Do not add dependencies, restructure folders, or commit without approval.
- Use typed service layers; keep unfinished features behind their feature flags.
- Respect reduced motion, accessible controls, and 44px minimum touch targets.
- Read the applicable [AGENTS.md](../apps/web/AGENTS.md) for framework-specific guidance.
