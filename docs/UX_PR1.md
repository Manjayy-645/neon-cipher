# UX PR 1 — Modal and reminder safety

This report describes the original UX commit. The subsequent credential-guard review
and server-boundary correction are documented in [PR7_CREDENTIAL_REVIEW.md](PR7_CREDENTIAL_REVIEW.md).

Scope: the first package in `NEON_CIPHER_CODEX_UX_IMPLEMENTATION_SPEC.md` only.
Base: main at `3264f00`, as explicitly requested because develop lacks parts of the audited UI.
No merge or production deployment. No gameplay rules, scoring, APIs, purchase/equip callbacks,
wallet accounting, unlocks, flags, artwork, routes, or credentials changed.

## What changed

- `Modal` uses native `dialog.showModal()`: the browser top layer escapes transformed
  scene stacking contexts, makes background controls inert, contains keyboard focus,
  and supports nested dialogs. Escape/click-outside cancel only the top dialog;
  dismissal never confirms a transaction. Focus returns to the invoking control.
- Native top-layer rendering stays in the React/surface ancestry instead of moving
  content to body, preserving inherited settings and theme. All migrated sheets have
  an opaque paper surface. Header and footer stay fixed; only the body scrolls.
- The viewport-sized modal frame uses `100dvh` and safe-area padding. The sheet is
  constrained to the available frame, including on short landscape screens.
- Clue legend, market purchase/equip/coin sheets, rig loadout, Settings and the shared
  BottomDrawer use that infrastructure. Existing shared-drawer save/reset actions
  now occupy the footer slot. Reset and purchase business callbacks are unchanged.
- An ephemeral overlay store owns modal and focused-flow registrations. Quest reminders
  are suppressed during these modals, chapter briefings, co-op (including preflight),
  all terminal routes, and duel-match routes. They return on exit when still relevant.
- Window-level Escape listeners were removed from migrated sheets so a nested Settings
  reset dialog cannot close both itself and the parent. Dialog keyboard events do not
  leak to terminal/window shortcuts.

## Layer contract and proposed tokens for review

Page layers remain scene/content → map controls → HUD (50) → permitted reminder (55).
Legacy scene inspector/tooltips remain below modal ownership. New roles in
`packages/tokens/design-tokens.json`, `tokens.css`, and `tailwind.tokens.ts`:

| Token | Value | Meaning |
| --- | --- | --- |
| reminder | 55 | Only when no focused flow owns attention |
| modalBackdrop | 80 | Reserved backdrop role; native backdrop precedes its dialog |
| modalSurface | 90 | Modal role; actual ownership uses the browser top layer |
| criticalToast | 100 | Reserved for future critical feedback within the active modal layer |
| modalBackdrop color | rgba(40, 30, 20, 0.6) | Warm ink shade using the established ink/shadow family |

A numeric page z-index cannot outrank a native modal. Current purchase/error feedback
stays inside its sheet. Ordinary app toasts intentionally remain behind the modal;
future critical feedback must be placed in the active modal, not given a larger page z-index.
Do not mount a new ad-hoc fixed overlay for these flows. Use `Modal` with named
`header`/`footer` slots, or `BottomDrawer` for existing drawer callers.

## Behavior inventory (current code, not backend readiness)

| Concern | Existing behavior | PR 1 treatment |
| --- | --- | --- |
| Entry/onboarding | `/` and `/onboarding/*`; OnboardingGate redirects a fresh guest to entry | Preserved |
| App chrome | ConditionalHud/Nav use onboarding state and route families | Kept mounted; inert behind a native dialog |
| Map/rig/market | `/map`, `/rig`, `/market`; flags default enabled | Preserved |
| Missions | `/comms` contains campaign and co-op; tab feature flag defaults false | Preserved; navigation truth belongs to PR 2 |
| Duel | `/duel`, `/duel/match*`; feature flag defaults false | Preserved; no online-readiness claim |
| Campaign gates | Black Market Chapter 2, bridge Chapter 3, online play Chapter 4 | Preserved |
| Sessions | Terminal, wallet, campaign, duel and co-op services use `/api/mock/*` in tested local flows | No transport/data changes |
| Profile | HUD/onboarding handle and dossier data differ in the audit | Not changed; belongs to PR 5 |
| Modal ancestry | Previously fixed elements inside lower scene contexts | Migrated audited sheets to browser top layer |
| Quest visibility | Previously independent of briefing/modal/co-op ownership | Central ephemeral registration, route guard for timed terminal/match screens |

Remaining legacy overlays outside this package (e.g. duel resolution, offline/developer
screens, terminal result/tool-inspector/pause overlays) have not all been migrated.
This PR does not claim universal dialog accessibility or two-human multiplayer readiness.

## Automated results

| Check | Baseline | PR 1 |
| --- | --- | --- |
| Frozen install | Pass (also verified using pinned pnpm 9.15.9) | Pass; no dependency/lockfile changes |
| ESLint | Fails loading config: locked typescript-eslint rejects TypeScript 7.0 | Same pre-existing failure |
| `tsc --noEmit` | Pass | Pass |
| Full Vitest | 1,246 pass; 2 fail | 1,256 pass; same 2 baseline failures |
| Production build | Pass | Pass |
| Focus/visibility/settings/responsive targeted tests | — | 37 pass |
| Real browser overlay journeys | Blocked actions reproduced | 35 pass, plus 7 at an additional 720×500 effective viewport |

The two baseline Vitest failures are live Supabase checks: connection timeout / DNS
failure for the configured host. They are not hidden, deleted, or reclassified as passes.
No Supabase settings or credentials were changed. ESLint cannot currently evaluate source;
this PR does not claim a clean lint result.

Unit tests use a small jsdom dialog lifecycle shim because jsdom does not implement
showModal/top-layer behavior. Browser tests, not that shim, prove hit testing,
background inertness, real Escape, Tab traversal, and focus return.

### Reproduce

Use Node 24 and the pinned pnpm version:

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
corepack pnpm --filter web dev --hostname 0.0.0.0 --port 3000
```

The standalone browser check deliberately uses an external Playwright installation so
it does not refresh this repository's `latest` dependency ranges or lockfile:

```sh
npm install --prefix /tmp/neon-cipher-browser playwright@1.58.2
NODE_PATH=/tmp/neon-cipher-browser/node_modules \
CHROMIUM_PATH=/usr/bin/chromium \
OVERLAY_EVIDENCE_DIR=/tmp/neon-cipher-overlay-evidence \
node apps/web/e2e/overlay-safety.cjs
```

Supply another installed Chromium executable through `CHROMIUM_PATH` if necessary.
The runner rejects non-local hosts. It seeds only local onboarding browser state,
uses existing local market preview access, and accepts a local mock campaign assignment.
It never confirms a purchase, changes loadout, or performs a reset. It writes screenshots
and a JSON result log outside the checkout. No production credentials are required.

## Browser QA

All 35 scenarios passed in Chromium at 360×740, 390×844, 844×390, 1366×768 and 1440×1000:

- Legend: Got it wins hit testing; closes; focus returns; reopen + real Escape closes.
- Purchase: both action centers are on-screen and unobstructed; Cancel closes; focus returns;
  zero purchase API requests; Escape cancels the reopened sheet.
- Rig loadout: Confirm remains visible and clickable; closes without modifying equipment;
  invoking control regains focus.
- Market loadout: Done has the same guarantees.
- Briefing: reminder absent; Accept Assignment receives the actual click and returns to map.
- Settings: opening reset creates a nested modal; Escape closes only reset, restoring parent
  focus; the parent close control remains reachable; the next Escape closes Settings.
- Co-op: reminder absent during preflight and after entering AI Stage 1; no real-human claim.
- In each modal: forward/reverse Tab does not focus background UI, and a background nav
  link cannot take focus. No unintended document horizontal overflow.

Active legend resizing between portrait and landscape was also exercised. An additional
720×500 effective-layout check with full-motion preference covers the CSS viewport
size corresponding to 200% zoom on 1440×1000; this does not claim actual browser zoom.

Reduced-motion preference was active for the reference captures and primary browser suite.
The new modal layer does not animate. The established paper palette is retained; symbols,
labels and button text remain present. Physical-device safe-area behavior, actual browser
200% zoom, screen readers, WebKit/Firefox and color-blind-mode gameplay are **not verified**
by this Chromium suite. A separate effective half-width/half-height check can supplement
zoom QA but is not a substitute for actual browser zoom. Live human duel/co-op/reconnect,
confirmed purchases and destructive resets were not tested.

## Evidence

Source audit defects: [legend](ux-pr1/source/46-legend-settled.png),
[purchase](ux-pr1/source/53-purchase-preview.png),
[loadout](ux-pr1/source/56-loadout.png),
[acceptance](ux-pr1/source/83-accept-covered.png).

The local reference server uses the unchanged main commit, separately from the feature
server. Both use the same paper theme and local mock API. Reference screenshots show
QA_DECKER instead of the source-audit player. Before/after captures are below; unrelated
map art, terminal headers and content density intentionally remain outside PR 1.

### 390x844

| Flow | Before | After |
| --- | --- | --- |
| Legend | [Before](ux-pr1/screenshots/before-legend-390x844.png) | [After](ux-pr1/screenshots/after-legend-390x844.png) |
| Purchase | [Before](ux-pr1/screenshots/before-purchase-390x844.png) | [After](ux-pr1/screenshots/after-purchase-390x844.png) |
| Loadout | [Before](ux-pr1/screenshots/before-loadout-390x844.png) | [After](ux-pr1/screenshots/after-loadout-390x844.png) |
| Briefing | [Before](ux-pr1/screenshots/before-briefing-390x844.png) | [After](ux-pr1/screenshots/after-briefing-390x844.png) |

### 1440x1000

| Flow | Before | After |
| --- | --- | --- |
| Legend | [Before](ux-pr1/screenshots/before-legend-1440x1000.png) | [After](ux-pr1/screenshots/after-legend-1440x1000.png) |
| Purchase | [Before](ux-pr1/screenshots/before-purchase-1440x1000.png) | [After](ux-pr1/screenshots/after-purchase-1440x1000.png) |
| Loadout | [Before](ux-pr1/screenshots/before-loadout-1440x1000.png) | [After](ux-pr1/screenshots/after-loadout-1440x1000.png) |
| Briefing | [Before](ux-pr1/screenshots/before-briefing-1440x1000.png) | [After](ux-pr1/screenshots/after-briefing-1440x1000.png) |

### 844x390

| Flow | Before | After |
| --- | --- | --- |
| Legend | [Before](ux-pr1/screenshots/before-legend-844x390.png) | [After](ux-pr1/screenshots/after-legend-844x390.png) |
| Purchase | [Before](ux-pr1/screenshots/before-purchase-844x390.png) | [After](ux-pr1/screenshots/after-purchase-844x390.png) |
| Loadout | [Before](ux-pr1/screenshots/before-loadout-844x390.png) | [After](ux-pr1/screenshots/after-loadout-844x390.png) |
| Briefing | [Before](ux-pr1/screenshots/before-briefing-844x390.png) | [After](ux-pr1/screenshots/after-briefing-844x390.png) |

## Risks and rollback

Native dialog requires a current browser implementing showModal; only Chromium was tested.
Fixed footers intentionally replace sheet entrance/exit motion with immediate modal ownership.
Legacy non-migrated overlays still need their own future review. Feature flags, progression,
security/auth and transport contracts are unchanged. The current mock backend is not evidence
of online multiplayer readiness.

Rollback: revert this PR as one unit. No migrations, environment changes or persisted player
schema changes are involved. The overlay registration store is ephemeral and cleans up on
unmount, including nested dialogs.

PR 2 remains on hold until PR 1 is reviewed.

The subsequent toolchain repair and isolated security-test setup are documented in
[PR7_TOOLCHAIN_REVIEW.md](PR7_TOOLCHAIN_REVIEW.md). Earlier baseline check results
above are historical; use that document for the current dependency pins.
