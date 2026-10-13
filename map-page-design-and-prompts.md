# Map page: design spec, Canva prompt and agy prompt

Design only. Nothing here has been built or tested. Follow docs/STYLE_GUIDE.md for colors, type and motion.
Values marked PROPOSED are starting points to tune on a phone.

---

## 1. The three states of the map page

### State A: Overview (default when you open the map)
The whole map is visible, both cities.
- **No markers, no node icons, no cluster badges.** Only the two district tags, the map, the fog and the HUD/nav.
- **Two floating tags,** one above each city:
  - THE SLUMS: serif name, "8 nodes, 2 contested" written on the tag, an OPEN chip (accent).
  - COMMERCIAL STRIP: serif name, "7 nodes" written on the tag, a LOCKED chip (gray, lock icon) and a short unlock hint (placeholder text in one constant).
  - Tags look like cream cards with a small pointer tail aimed at the city below, and a slow float (2 to 3px, about 4 seconds, transform only).
  - The Slums tag is the main call to action: a faint ring pulse and the small hint "TAP TO ENTER".
- **Fog over Commercial:** a cool gray fog covers the whole east side including the towers. It is feathered along the river (no hard edge), has two slow drifting layers, and sits under the Commercial tag so the tag stays readable.
- **Nix:** a small portrait button with a speech bubble (see section 3).

### State B: District view (after tapping the Slums tag)
- The camera glides into the Slums (about 600ms, eased).
- The Slums tag collapses into a compact header chip at top-left: back arrow, "THE SLUMS", "8 nodes". Tapping it, or pinching out, returns to State A.
- The 8 node markers pop in with a 30 to 50ms stagger, each showing its icon plate and tier badge.
- Commercial stays fogged, with no markers anywhere in it at any zoom level.

### State C: Node selected (after tapping a marker)
- The marker lifts and pulses a ring once.
- The camera eases so the marker sits in the visible area above the sheet.
- The bottom sheet rises to its half height: icon plate, node name, tier chip, DIGITS / TRIES / TIMER / BOUNTY, one line of microcopy, and the JACK IN button.
- Peek, half and expanded heights work as already specified. Dragging the sheet down or tapping the map empty space deselects and returns to State B.

---

## 2. Tag and fog details

**District tag:** surface.panelLight, 1px line, radius 12, card shadow, padding 10px 14px, min height 56px, constant on-screen size. Name in serif 17px UPPERCASE; below it the count line in 12px mono; status chip on the right. Pointer tail: 10px triangle, same fill and border.
Tag fades out as the zoom leaves the overview range and fades in when it returns.

**Fog (tokens: overlay.hazeLocked and a new PROPOSED fog tint):**
- Base: a feathered gradient over the Commercial half at about 55 to 70 percent opacity, ramping in over the first 14 percent of its width at the river.
- Two drifting layers of soft cloud shapes (a tileable transparent fog image, or CSS soft radial gradients if no image yet), moving in opposite directions, 40 to 60 second linear loops, transform only.
- Under prefers-reduced-motion: static fog, no drifting.
- Unlock: the fog thins and drifts away over about 1.2 seconds, then the district tag turns OPEN and markers pop in.
- The fog blocks interaction: tapping it makes Nix say the unlock line.

---

## 3. Nix redesign (interactive guide)

Replace the current bubble with a guide made of two parts:
- **Portrait button:** 48px round, 1px line, with a small notification dot when Nix has something new. Tapping it toggles the bubble.
- **Speech bubble:** surface.panelLight, 1px line, radius 14, card shadow, solid fill (no transparency over map art). Typewriter text (instant under reduced motion). A "tap for more" tap area advances multi-line tips, and an X dismisses.

**Placement:** under the HUD at top-left in State A and B. In State C it moves to sit just above the top-left corner of the sheet, so it never covers the HUD, the tags or the sheet.

**Contextual lines (placeholders):**
| Moment | Nix says |
|---|---|
| Overview | "Two districts. The Slums are open. Tap it to look closer." |
| Tap the fogged Commercial | "Fogged out. Cross the bridge before you go poking around there." |
| District view | "Rings are open jobs. Diamonds mean a rival's been here. Start with a T1." |
| T1 node | "Quiet corner. Three digits, no repeats." |
| Contested node | "Rival decker's been here. Expect company." |
| Cooldown node | "Locked out. Come back when the timer ends." |

Behavior: lines show once per situation (remembered in the store), Nix never auto-opens over an open sheet drag, the dot shows when a new line is waiting, and everything is keyboard accessible (aria-live polite, Escape closes).

---

## 4. Interaction map

| Action | Result |
|---|---|
| Tap Slums tag | Zoom to Slums, tag collapses to the header chip, markers pop in |
| Tap Commercial tag or fog | Toast and a Nix line with the unlock condition, no zoom |
| Tap back chip or pinch out | Return to overview, markers fade out, tags fade in |
| Tap a marker | Select, lift, center, sheet to half |
| Tap JACK IN | Navigate to the terminal for that node |
| Drag sheet | Follows finger, snaps with a spring |
| Tap empty map while a node is selected | Deselect, sheet to peek |
| Tap Nix portrait | Toggle the bubble |

Touch targets are at least 44px. Everything works by keyboard (Tab, Enter, Space, Escape).

---

## 5. Canva prompt: mock up the three states

```text
Create three mobile app screens, 390 x 844 each, shown side by side, for a game
map called Low Meridian. Flat to lightly painted, earthy and gritty, LIGHT
interface: warm cream panels, ink charcoal text, forest green accent, muted amber
for money, brick red for danger. High-contrast serif for headings, monospace for
data. No glow, no neon, no glassmorphism, no purple. Use the attached top-down
city map as the background in all three screens.

SCREEN 1: OVERVIEW. The whole map is visible with NO node icons. Two floating
cream tags with a small pointer tail, one above each city. West tag: "THE
SLUMS", "8 nodes, 2 contested", a green OPEN chip, and a tiny "TAP TO ENTER"
hint. East tag: "COMMERCIAL STRIP", "7 nodes", a gray LOCKED chip with a
padlock. A soft cool gray fog covers the whole east side and the glass towers,
feathered along the river, with the east tag sitting above the fog. Top bar: avatar,
handle ZERO, credits $12,500 in amber, coins, city name, a red segmented heat
meter at 62 percent. Bottom nav: Map (active, green), Rig, Market, Comms, Duel.
A small round Nix portrait button under the top bar with a speech bubble: "Two
districts. The Slums are open. Tap it to look closer."

SCREEN 2: DISTRICT VIEW. Zoomed into the Slums only. A compact header chip at
top-left: back arrow, "THE SLUMS", "8 nodes". Eight round marker plates on the
map with device pictograms (vending machine, camera, parking meter, relay tower,
register, safe) and small dark tier badges (T1 to T3). Green ring = available,
red diamond = contested, gray with a timer = cooldown. The east side is still
fogged. Nix portrait with the bubble: "Rings are open jobs. Diamonds mean a rival's
been here. Start with a T1."

SCREEN 3: NODE SELECTED. Same as screen 2 but one marker (a cash register, T2) is
raised with a green glow ring. A cream bottom sheet slides up with a drag
handle: large plate, node name "St. Jude Corner Store Register" in serif, TIER 2
chip, four columns DIGITS 4 UNIQUE / TRIES 7 / TIMER 60s / BOUNTY $650, one line
"Signal stable. Lock is local.", and a full-width green JACK IN button. Nix
portrait sits just above the sheet's top-left corner.

Keep all text crisp and legible. Do not invent logos. Do not use real brands.
```

---

## 6. agy prompt: build the map page states

```text
# TASK: Map page with three states (overview, district, node selected)

Read AGENTS.md and docs/STYLE_GUIDE.md and docs/MAP_PAGE_DESIGN.md (the design spec
above). Change only the map feature. Do not touch other routes.

## State machine
In the map store add: view = 'overview' | 'district' | 'node', selectedDistrict,
selectedNodeId. Rules:
- Default: overview. Tap an unlocked district tag: view = 'district' (camera flies
  to that district preset). Tap a marker: view = 'node'. Back chip, pinch-out
  past the district threshold, or tap empty map: step back one state.
- Camera presets per state live in one file (camera.ts): OVERVIEW and one per
  district: center, zoom, padding. Programmatic moves use easeTo 500 to 700ms with
  easeOutCubic, and duration 0 under prefers-reduced-motion.
- Marker visibility is derived, never stored: markers render only when
  view != 'overview' AND the node's district is unlocked AND zoom >= district
  threshold. Locked-district nodes are NEVER rendered at any zoom.

## Components
1. DistrictTag: per docs spec. Name in serif UPPERCASE, a count line
   ("8 nodes, 2 contested") computed from the node data, a status chip (OPEN or
   LOCKED with lock icon), pointer tail, constant on-screen size, anchored to a
   percent position above each city (config in one file). Real button, min 44px,
   aria-label with name, count and status. Float animation 2 to 3px, 4s, transform
   only; off under reduced motion. Slums tag shows a one-time ring pulse and a
   TAP TO ENTER hint until first used.
2. FogLayer over the locked district: feathered gradient plus two slow drifting
   layers (transform only, 40 to 60s loops, opposite directions). Use
   public/map/fog-texture.png if it exists, otherwise CSS radial gradients and
   tell me what image to add. pointer-events: none, except tapping the fog area
   triggers the Nix unlock line and a toast. Stops animating when the tab is
   hidden and under reduced motion. Unlock animation: fade and drift away over
   about 1.2s, then the tag becomes OPEN.
3. DistrictHeaderChip (district view): back button (44px), name, node count.
4. NixGuide: portrait button 48px with a notification dot, plus a bubble
   (solid panelLight, 1px line, radius 14) with typewriter text (instant under
   reduced motion), tap to advance and an X to dismiss. Lines come from one data
   file keyed by situation (overview, locked tap, district, node tier 1 to 5,
   contested, cooldown). Shown once per situation (remembered in the store).
   Placement: under the HUD top-left in overview and district states; above the
   top-left corner of the sheet in the node state. Never overlaps the HUD, tags
   or the sheet. aria-live polite, Escape closes.
5. Node sheet: reuse the existing sheet. On marker select it rises to half and
   shows plate, node name, tier chip, DIGITS / TRIES / TIMER / BOUNTY, one line
   of microcopy and the JACK IN button (navigates to /terminal/[nodeId]). Deselect
   returns it to peek.
6. Remove the old cluster badges, the old top-left node-count chip and the old
   Nix bubble, replaced by the above.

## Rules
- Tokens only. No hardcoded colors, radii, spacing or fonts. Add the PROPOSED fog tint
  as a token and list it.
- Animate transform and opacity only. Counter-scale tags and markers so they keep
  a constant on-screen size.
- Status is never color alone. Touch targets at least 44px.
- Keyboard: Tab to tags, markers, Nix and the sheet; Enter or Space activates;
  Escape steps back one state.
- Keep fog to two animated layers maximum for performance.

## Tests
- Store: transitions overview to district to node and back, including Escape and pinch-out.
- Visibility: in overview no markers render; in district only unlocked-district
  markers render; locked-district markers never render at any zoom.
- Counts on tags match the node data.
- Unlock flips the district to OPEN and enables its tag.

## Acceptance
At 390 x 844: open map, see two tags with counts and fog over Commercial and no icons;
tap Slums, camera glides in and 8 markers pop in; tap a marker, sheet rises with JACK
IN; tap back, return to overview. Nothing overlaps the HUD, tags, Nix or sheet.
Reduced motion tested. Report anything you could not match. Do not commit.
```

---

## 7. Assets you may need
- **fog-texture.png:** tileable transparent soft cloud texture (optional, CSS gradients work without it).
- **Nix portrait** (one approved image, 1:1) for the button and bubble.
- **The 8 Slums node icons** plus the five plates, named as in the icon list.

## 8. Decisions still open
- The wording of the Commercial unlock hint (depends on the bridge unlock rule).
- Whether tapping the fog also zooms toward Commercial or only shows the Nix line (this spec: Nix line and toast only).
- Whether the tags show a small tier range ("T1 to T2") in addition to the node count.
