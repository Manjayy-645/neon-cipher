# Neon Cipher: Style Guide for the coding agent

Put this at docs/STYLE_GUIDE.md. Read it before building or changing any UI.
It describes how the game must LOOK and MOVE. The Canva screens in
docs/reference/ show the mood; if you can view images, use them. If you cannot,
follow this document exactly.

Values marked PROPOSED are my estimates. Do not silently invent tokens: add the
proposed ones to packages/tokens, list them for review, and use them from there.

---

## 1. Look in one paragraph
A grounded, earthy, near-future street world. The MAP is light: warm cream
panels, dusty sand and clay, moss green, rust and brick red, a little amber for
money. Type is a high-contrast serif for headings and a monospace for data.
The HACKING TERMINAL is the dark, focused screen. Nothing glows, nothing is
glossy, nothing is purple. Detail is small and deliberate; the base stays calm.

**Never:** purple or cyan gradients, neon glow on everything, glassmorphism,
big soft blur shadows, default sci-fi fonts, emoji, centered hero layouts with
three identical cards, constant glitch effects.

## 2. Color roles (from packages/tokens)

| Role | Token | Use |
|---|---|---|
| Ink | color.ink.default #37332E | text and icons |
| Muted ink | color.ink.muted #6B645A | labels, secondary text |
| Panel | color.surface.panel #E2D6C6 | HUD, nav |
| Panel light | color.surface.panelLight #EFE7DA | sheet, cards, bubbles |
| Line | PROPOSED color.line #C9BBA6 | 1px dividers and borders |
| Accent green | color.accent.default #426947 | buttons, owned, available ring, fills |
| Accent text | color.accent.text #35583A | green words on cream (passes contrast) |
| Money | color.money.default #C48C36 | fills and icons only |
| Money text | color.money.text #74500F | bounty and credit numbers on cream |
| Danger | color.danger.default #A8593F | contested, heat, errors (fills) |
| Danger text | color.danger.text #99412C | red words on cream |
| Heat track | color.heat.track #CBBFAE | empty segments |

Rules: plain accent and plain money fail contrast for small text, so words use
the .text variants. Heat is always the danger color, never green. A thing is
never shown by color alone.

## 3. Typography
- Heading: high-contrast serif. PROPOSED placeholder DM Serif Display
  (fallback Georgia). Used for city name, node names, dialogue names, big numbers.
- Data and body: monospace. PROPOSED placeholder IBM Plex Mono.
- Both defined once in a single font file so they can be swapped.

| Style | Size | Weight | Notes |
|---|---|---|---|
| Label | 10 to 11px | 500 | monospace, UPPERCASE, letter-spacing 1 to 2px, muted ink |
| Body | 14px | 400 | monospace |
| Value | 15 to 16px | 600 | monospace, ink |
| Node name | 21px, line-height 23px | serif | in the sheet |
| City name | 19px | serif | HUD, centered |
| Button | 15px | 600 | monospace, letter-spacing 3px, UPPERCASE |
| Screen title | 28px | serif | |

## 4. Shape, spacing, depth
- Radii: sm 6px (chips, buttons), md 12px (cards, bubbles), lg 24px (bottom sheet top corners), pill 999px.
- Spacing scale: 4, 8, 12, 16, 24, 32. Screen edge padding 16px. Gap between a title and its specs 10 to 12px.
- Borders: 1px solid line color. No thick outlines on UI (markers have 3 to 4px plates; that is the only exception).
- Shadows are small and warm, never blurry halos:
  - Marker: 0 1px 1px rgba(40,30,20,0.45)
  - Bubble or card: 0 2px 8px rgba(0,0,0,0.25)
  - Bottom sheet: 0 -4px 14px rgba(0,0,0,0.25)
- Texture: optional grain overlay, opacity below 4 percent. Page canvases may
  use equally faint token-colored route-grid or contour marks; panels stay flat.

## 4a. Dark mode
Panels switch to PROPOSED dark values (#2B2824 panel, #35312C panel light,
ink #E2D6C6, line #4A443C) when the system is in dark mode. The map image does
not change. Accent text becomes #8FC196, money text #E0AE5C, danger text #E58A6E.

---

## 5. Components

### HUD (top, 56px tall, panel color, 1px line below)
Left: avatar slot (36px, rounded 6px), handle in 12px mono bold, credits in money
text color. Then coins with a small coin glyph. Center: city name in serif. Right:
Sector Heat: label above, 8 equal segments with 2px gaps, 7px tall, filled
segments use danger, empty use heat track, percent in danger text. Hairline
vertical dividers between groups.

### Bottom nav (64px, panel color, 1px line above)
Five equal items: icon 22px (1.8px stroke, round joins) over a 10px uppercase
label. Inactive: muted ink. Active: green filled rounded rectangle (radius 8,
margin 6px 4px) with white icon and label. Respect safe-area bottom padding.

### Map marker (built in code from three parts)
- Plate 52px with a 2 to 4px ring, glyph centered at about 24px, tier badge
  below overlapping the plate by 8px.
- available: cream fill, 4px green ring.
- owned: green fill, cream glyph, 2px ink outline.
- contested: cream fill, 4px danger ring, rotated square (diamond), glyph stays upright.
- cooldown: light gray fill, 3px gray ring, badge shows live countdown (mm:ss).
- locked: light gray fill with a lock glyph, badge reads LOCKED, 80 percent opacity.
- Tier badge: ink pill (#37332E), cream text, 10px mono 600, height 14px, radius 7px.
- Selected: green glow ring (0 0 5px green at 95 percent) and the badge turns green.
- Constant on-screen size (counter-scale with the map zoom). Min hit area 44px.

### District label on the map
Serif UPPERCASE, 16 to 18px, ink color, on a cream pill at 75 percent opacity so
it is readable without covering the art. No colored tag boxes.

### Cluster badge
Cream panel light, 1px line, radius 12, shadow like a card. Serif district name 16px,
then "N nodes" and a danger-text "N contested" in mono 12px. Min height 44px.

### Locked-zone haze
A cool gray overlay on the Commercial side, about 50 percent opacity ramping in
over the first 14 percent of its width so there is no hard edge. It fades out when unlocked.

### Bottom sheet
Panel light fill, 1px line top, radius 24px top corners, shadow above.
Handle: 44 by 5px pill, muted ink at 70 percent, centered, 28px tall touch zone.
Snap heights (PROPOSED): peek 76px, half 250px, expanded about 75 percent of map height.
Content in the half state, top to bottom:
1. Row: 52px plate of the selected node, node name in serif 21px, a tier or status chip on the right.
2. Specs row: four equal columns (DIGITS, TRIES, TIMER, BOUNTY) with 1px vertical dividers,
   label 11px muted, value 15px 600, bounty in money text.
3. One line of in-character microcopy, 12px mono muted.
4. JACK IN button pinned at the bottom.

### Chips and badges
Tier chip: green fill, white text, mono 11px 600, letter-spacing 1px, radius 6, padding 4 by 8.
CONTESTED chip: danger fill. COOLDOWN chip: gray fill. OWNED chip: green fill.

### Primary button (JACK IN)
Full width, min height 48px, accent fill, white text, radius 8px, mono 15px 600,
letter-spacing 3px, UPPERCASE. Press: scale 0.97 and a slightly darker green. Disabled: heat track fill,
muted text.

### Nix guide bubble
Panel light, 1px line, radius 12 to 14, shadow like a card. Left: 36px round portrait slot.
Right: NIX in accent text 11px with 1px letter-spacing, then one line at 12px.
Close button 44px. Appears near the top of the map, never over the sheet.

### Heat meter, pips and clue marks
- Attempt pips: small squares or cells, filled = used.
- Clue marks always pair shape and color: Pot = filled circle, Pan = ring, miss = dash.

---

## 6. Hacking terminal theme (DARK, scoped with data-surface="terminal")
All PROPOSED. Add as terminal tokens, then review with me.

| Role | Value |
|---|---|
| Background | #1B1915 |
| Panel | #26231E |
| Line | #3A362F |
| Ink | #E2D6C6 |
| Muted | #9A9183 |
| Phosphor green (Pot, accents) | #6FBF7A |
| Amber (Pan, warnings) | #E0AE5C |
| Danger | #D0765A |

Layout: header (node name serif, tier chip, ICE timer bar, attempt pips), guess history,
keypad, tool slots, Nix pip. Keypad keys: 52 to 56px squares, radius 8, panel fill, mono 20px,
1px line; pressed state darkens and scales 0.96; dead keys are dimmed to 35 percent opacity with a
diagonal slash. Timer bar: thin 4px bar that drains left to right, turns danger color under 10 seconds.
Subtle CRT effects are allowed ONLY here: a very faint scanline at 3 percent opacity, and a quick flicker
on a failed guess. Nothing glows continuously.

## 7. Dialogue, shop and story
- Dialogue panel: panel light, 1px line, name tab top-right with ink text, typewriter text in mono 14px
  (instant under reduced motion), choices as full-width ghost buttons: 1px line, mono 14px,
  44px tall, a small green diamond before the label.
- Shop item card: icon 52px, name in serif 16px, effect line in mono 12px muted, price in money text,
  Buy button (primary, compact, 44px tall). Unaffordable: price in danger text with the exact shortfall.
- Portraits: 1:1, radius 12, 1px line.

## 8. Motion (starting values, tune on a phone)
| Thing | Value |
|---|---|
| Fast / base / slow | 120ms / 220ms / 400ms |
| Map programmatic moves | 400 to 700ms, easeOutCubic |
| Bottom sheet | spring: stiffness 380, damping 34, mass 1, uses release velocity |
| Marker pop-in | spring: stiffness 500, damping 28, 30 to 50ms stagger |
| Selected marker | lift 4px and ring pulse once, 400ms |
| Button press | scale 0.97, 120ms |
| Count-up payout | 800 to 1200ms easeOut |
Animate transform and opacity only. Under prefers-reduced-motion: instant or under 80ms,
no bounce, no ambient animation.

## 9. Responsive and device rules
- Design at 390 by 844 first. Max app width 480px, centered on desktop.
- No page scroll. HUD and nav are always visible.
- Respect safe-area insets (top and bottom).
- Touch targets at least 44px, with at least 8px between them.
- Tablet and up: duel console shows both feeds side by side.

## 10. Accessibility
- Contrast at least 4.5:1 for text. Use the .text token variants on cream.
- Status is shape plus color plus text. Test every screen in grayscale.
- Real buttons, visible focus ring (2px accent with offset), aria-labels on icon-only controls,
  keyboard support for every interaction.

## 11. Voice
Plain, warm, a little dry. Nix explains in everyday words, Glitch is sly and brief. UI labels
are short and uppercase for data (TIER, TRIES, BOUNTY), sentence case for dialogue. Example microcopy:
"Signal stable. Lock is local." / "Quiet corner. Good place to start." No jargon for beginners.

---

## 12. Checklist before saying a UI task is done
- [ ] No hardcoded colors, radii, spacing or fonts.
- [ ] Any new token was added to packages/tokens and listed for review.
- [ ] Looks right at 390 by 844 and does not overflow at 360 wide.
- [ ] Status is readable in grayscale.
- [ ] Reduced motion tested.
- [ ] Touch targets are at least 44px.
