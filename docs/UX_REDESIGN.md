# Neon Cipher — consolidated UX redesign

This feature branch continues PR #8 and retains PR #7's native modal safety,
pinned toolchain and server-only Supabase boundary. It targets PR #8's feature
branch for review; it does not merge either prerequisite or change production.

## Requirements and preserved behavior

Requirements come from the live `Neon-Cipher-UX-Audit.md` and the supplied
`NEON_CIPHER_CODEX_UX_IMPLEMENTATION_SPEC.md` / pasted remediation specification.
The user's later request to coordinate the remaining work replaces the earlier
small-PR sequencing and the style guide's original 480px-only desktop limit.
The paper palette, typefaces, illustrations, logos, device chassis and character
portraits remain. No game-rule package, backend route, player/campaign store,
price, progression rule, schema, dependency or security guard is changed.

### Behavior inventory

- Canonical main destinations remain City `/map`, Battle `/duel`, Missions
  `/comms`, Rig `/rig`, Market `/market`. `/coop`, `/profile`, `/story`,
  `/codemaker` and `/terminal/*` remain available. Legacy BottomNav exports the
  canonical navigation instead of its old non-routing controls.
- Profile is a secondary destination with no stale Market highlight. HUD and
  dossier both display the current player handle; Profile returns to its actual
  local entry point, with City as a direct-load fallback.
- Campaign guards remain: bridge clearance at Chapter 3, competitive progression
  at Chapter 4, and the existing Market conditions. Requirement links inspect a
  locked chapter without enabling acceptance or granting an unlock.
- Duel/co-op services still use `/api/mock/*`. Synthetic rooms, opponents,
  territory and Nix practice are explicitly distinguished from human online play.
- A timed console owns its leave confirmation. Global HUD/navigation and the
  Missions/Battle mode switches yield while it is active. Native dialogs retain
  keyboard ownership and background inertness. Map/Nix Escape handling retains
  PR #8's latest modal guard.
- Chapter 1 skip still marks that lesson complete and advances the existing
  campaign. Onboarding now explains that consequence before the click.

## Completed workstreams

| Requirement | Implementation and verification |
| --- | --- |
| Navigation / discovery | Real routes, canonical legacy export, correct secondary-route state, Profile return fallback, direct Nix practice discovery, explicit progression / preview language, protected active-console exits. Route/state and leave-confirmation tests added. |
| City / target selection | Adaptive map plus 360px desktop dossier, native keyboard target directory, one node sheet, parent-height detents, handle-only drag, scrollable dossier body and visible action footer. Guide/reminder suppression while selecting, bounded district labels, exact bridge requirement, real cooldown meaning and non-fictional attempt history. |
| Terminal | Reserved decorative fascia, separate identity/rules/actions/status, full node name, desktop history/control columns and compact landscape keypad. Keyboard controls, native pause/exit/help, actual-result coaching, count-not-slot explanation, monochrome clue mode and confirmed receipt. Existing scoring, timeout, attempts, ICE and tool behavior remain. |
| Missions / co-op / duels | Summary-first briefing with optional preserved narrative/art, actual city target/tier/base bounty versus contract terms, locked deep links, explicit Chapter 3 target alias. AI preflight, readable roles, My console / Partner & clues on phones, simultaneous desktop console/history, actual probe codes and Pan/Pot counts, recoverable errors and confirmed exits. All existing heist stages and duel modes remain. |
| Rig / Market | Installed parts, inventory and consumables separated; preset inspection before applying owned modules; missing components and example effects explained. Native hardware diagnostics, safehouse net yield and recorded dividends, explicit acquisition confirmation. Compact two-column catalogue with expandable notes, owned/equipped state, game-currency/balance previews and cancel safety. Repeat visits skip mandatory vendor dialogue; guided onboarding keeps its required vendor step. |
| Profile / Settings | Named mobile selector and desktop dossier rail; consistent identity and empty records; human-readable skill prerequisites; sample archive/social and Daily simulation labels. Gameplay/Accessibility/Audio/Account groups, selected-state marks, actual shared clue preview and retry behavior. All sections/cosmetics/factions/skills/account controls remain. |
| Shared layout / accessibility | Workspace expands progressively to 1200px; smaller landscape chrome; skip link; visible focus; native modal ownership; shape-only feedback; reduced motion. Correct CSS cascade-layer order and inline theme aliases restore existing primary-button colors and scoped terminal contrast. |

## Accounting and identity truth

The city Market Register is Tier 1 with a base bounty of 75 credits. The campaign
has separate 4-digit / 8-attempt / 120-second contract terms and a listed bounty
of 650 credits. The current mock completion code records 2,500 credits of
"Debt Relief" as **both a wallet credit and a debt reduction**; it does not add a
separate 650-credit wallet transaction. The UI now explains these distinct values
and derives the receipt from returned payout/bonus/campaign fields plus a wallet
read. An unavailable wallet read remains explicitly unconfirmed. No accounting
logic or amounts are changed by this redesign.

Chapter 3's contract name "Chop-shop Safe" refers to the city node "Hideout Safe"
(`n7`). Both names are disclosed rather than silently renaming the target or
changing progression. Simulated Daily and archive content remains accessible and
is explicitly labeled; no fabricated achievements or leaderboard are presented
as verified live records.

## Rendered evidence

The `screenshots/` links below contain real Chromium captures. Before images use
PR #8's navigation baseline `7332c83`; later prerequisite changes concern the
production developer guard and modal Escape handling. Final images use a local
production build, the same QA callsign and viewport sizes. Settings' after view
shows the selected shape-only preview, while its before view is the initial panel.

| Screen | Phone before / after | Desktop before / after |
| --- | --- | --- |
| City | [Before](ux-redesign/screenshots/before-city-390x844.png) / [After](ux-redesign/screenshots/city-390x844.png) | [Before](ux-redesign/screenshots/before-city-1440x1000.png) / [After](ux-redesign/screenshots/city-1440x1000.png) |
| Terminal | [Before](ux-redesign/screenshots/before-terminal-390x844.png) / [After](ux-redesign/screenshots/terminal-390x844.png) | [Before](ux-redesign/screenshots/before-terminal-1440x1000.png) / [After](ux-redesign/screenshots/terminal-1440x1000.png) |
| Rig | [Before](ux-redesign/screenshots/before-rig-390x844.png) / [After](ux-redesign/screenshots/rig-390x844.png) | [Before](ux-redesign/screenshots/before-rig-1440x1000.png) / [After](ux-redesign/screenshots/rig-1440x1000.png) |
| Market | [Before](ux-redesign/screenshots/before-market-390x844.png) / [After](ux-redesign/screenshots/market-390x844.png) | [Before](ux-redesign/screenshots/before-market-1440x1000.png) / [After](ux-redesign/screenshots/market-1440x1000.png) |
| Profile | [Before](ux-redesign/screenshots/before-profile-390x844.png) / [After](ux-redesign/screenshots/profile-390x844.png) | [Before](ux-redesign/screenshots/before-profile-1440x1000.png) / [After](ux-redesign/screenshots/profile-1440x1000.png) |
| Settings | [Before](ux-redesign/screenshots/before-settings-390x844.png) / [After](ux-redesign/screenshots/settings-390x844.png) | [Before](ux-redesign/screenshots/before-settings-1440x1000.png) / [After](ux-redesign/screenshots/settings-1440x1000.png) |

Additional examples: [desktop target dossier](ux-redesign/screenshots/city-target-1440x1000.png),
[landscape terminal](ux-redesign/screenshots/terminal-844x390.png),
[co-op actual probe](ux-redesign/screenshots/coop-probe-390x844.png),
[desktop co-op](ux-redesign/screenshots/coop-console-1440x1000.png),
[mission requirement](ux-redesign/screenshots/mission-requirement-390x844.png).

## Reproduce

Use Node 24, pnpm 9.15.9, Docker Compose and Python 3:

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
corepack pnpm --filter web start --port 3000
# In another shell, with an external Playwright installation:
NODE_PATH=/path/to/playwright/node_modules node apps/web/e2e/redesign.cjs
NODE_PATH=/path/to/playwright/node_modules node apps/web/e2e/overlay-safety.cjs
NODE_PATH=/path/to/playwright/node_modules node apps/web/e2e/accessibility.cjs
# When finished:
bash scripts/ci-data-api.sh stop
```

The browser scripts reject hosted URLs. `UX_EVIDENCE_DIR`,
`OVERLAY_EVIDENCE_DIR`, `CHROMIUM_PATH`, and `UX_VIEWPORTS` can select local
outputs/browser/viewports. The accessibility runner verifies 200% layout-equivalent reflow at 720×500 CSS
pixels and DPR 2 (a 1440×1000 capture). This is viewport/density emulation, not
a claim of native tab-zoom verification; the installed headless Chromium does
not expose the extension zoom control.

## Remaining risks and release boundaries

- Real human matchmaking, authenticated multi-client co-op, persistence and
  reconnect are **not implemented or certified** by a visual redesign. Preview
  labels remain until those transport/backend capabilities are verified.
- Browser co-op verification exercises preflight and Stage 1 with Nix; Stage 2/3
  retain unit coverage but have not been certified with two human clients.
- The mock economy's debt-relief/wallet coupling described above is a pre-existing
  accounting decision requiring a separate product/backend review.
- Native browser back/refresh may end an in-memory practice session; confirmed
  in-app exits are protected. This is not a persistence/reconnect guarantee.
- Chromium emulation is not physical iOS/Android, screen-reader, audio-quality or
  cross-browser certification. Native browser zoom remains a manual check; the
  equivalent reflow viewport is automated. Existing lint warnings remain visible.
- The earlier Supabase fixture's documented signup-trigger/schema inconsistency
  is unchanged. Real Data API/RLS and server-only credential checks remain active.

Rollback: revert the consolidated redesign commits on this feature branch. No
migration, persisted data conversion, new package or production configuration is
involved. Do not merge the stacked PRs or deploy production without approval.

## Validation results

- PR #8 navigation baseline: lint/typecheck/build passed; 1,264 tests passed.
- Final lint: zero errors; 29 warning-level diagnostics remain visible.
- Final typecheck and local production build passed; frozen install passed.
- Full suite: **1,298 passed across 85 files**. Targeted tests also cover the
  latest prerequisite Escape guards, identity, layout and confirmation updates.
- Production browser journey: **90 screen checks** across 360×740, 390×844,
  844×390, 1366×768 and 1440×1000. Actual hit testing includes node actions,
  header controls, keyboard probe submission, co-op input and purchase Cancel.
- Native overlay regression: **35 passed**, including modal ownership, keyboard
  containment, Escape, focus return, nested Settings/reset, mission acceptance,
  no-purchase cancellation and co-op reminder exclusion.
- Both original security guards pass and remain unchanged, as do the admin
  helper, private-key requirement, game-rule source and backend/store code.
- Machine-readable results: [screen checks](ux-redesign/screen-results.json) and
  [overlay checks](ux-redesign/overlay-results.json).

The draft pull request's GitHub Actions run is the final remote check; see its
Checks tab for the exact head commit and status. No merge or production deploy
is part of this implementation.
