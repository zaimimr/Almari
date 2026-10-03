# F08 Change a piece

Date: 2026-10-03. Phase 2 flow design. Sources: `architecture.md` (F08 row, Inline modes, Owner decisions), `use-cases.md` (UC-F08-01 to UC-F08-06, UC-F06-05, UC-F06-14), `design-system.md` (11 FlatLay, 12 Expander, 10 Tile, Today recipe), `motion.md`, `copy.md` (F08).

F08 has no route. It is the Change strip: one `Expander` on Today, directly under the `FlatLay` hero. Entry: tap a piece in the flat lay, or the "Hijab does not match" reason chip (UC-F06-05). Exit: close the strip, or pick and keep going. The outfit, header and Footer never move.

"Change" is the one verb, with one wording: the strip title says "Change hijab". While the strip is open on another piece, tapping the hijab in the flat lay switches it to the hijab (Switch piece). The Footer holds Wear this alone (F06).

Where the use case text and the Phase 2 component docs differ, this file follows `design-system.md` and `copy.md` (later and owned by the component and copy roles). The differences are listed under Open items.

## Screens

### S1 Today with the Change strip open

Purpose: swap one piece of today's outfit without leaving Today.

Layout, top to bottom (Today recipe, nothing added):

1. `Screen large`, native header, Profile `HeaderItem`. Unchanged.
2. Context `ChipRow` (control chips). Unchanged.
3. Optional `Banner` (session or planning). Unchanged.
4. `FlatLay` hero. Each piece is a button (`change.pieceLabel`, hint `change.hint`), with `accessibilityState.expanded` while its strip is open. The piece being changed has no outline or glow; only the strip title says which one. Every piece keeps at least 44 x 44 pt not covered by a higher piece; a piece that cannot gets its Change from an `accessibilityAction` on the piece above it (F06 S1 item 4). A kept piece carries the kept mark: one 22 pt blush disc with an `ink` `pin.fill` symbol at the bottom trailing corner of its slot, at `rest` scale, hidden from VoiceOver (the piece label already ends in ", kept"). Pieces that are not kept carry nothing.
5. Change strip, `Expander` open, `canvas` fill with a `line` hairline on its top edge (no box, so the cut-outs sit on the same white as the hero). The strip counts as a `canvas` container: Chips get the 1 pt `lineField` edge when unselected, secondary Buttons use the `plumSoft` fill. Two parts only:
   - Header line: title `change.title` ("Change hijab"), then the value, then the Keep `Chip`, then the chevron. No Close button: the header and the tapped piece both close it. The value is hijab strip only: `change.reason.with` ("With the tunic") for the hijab in the outfit when it picks up a colour in a drawn piece, else none. `subhead` `inkMuted`, beside the title, under it at `large` (Expander value rule). The header reads "Change hijab, With the tunic, expanded". At `large` the Keep chip also moves under the title.
   - Keep `Chip`: `accessibilityRole="checkbox"`, `accessibilityState.checked`, visible `today.keep`, VoiceOver `change.keepLabel` ("Keep Mauve chiffon hijab"). Checked = kept: blush fill, `blushStrong` edge and a leading `checkmark` (`ink`, scaled by `symbolScale`). The checkmark's width is reserved when unchecked, so the chip never resizes. It sits beside the header button, never inside it.
   - Tile row: horizontal strip of `Tile size="strip"` with `accessibilityRole="button"`, alternatives in rank order. The piece in the outfit carries the selected disc and `accessibilityState.selected`. The piece the strip opened with is always the first tile and keeps that place after a pick, so tapping it is the way back.
     - Every role: the label is the piece name, as in Closet.
     - Hijab role: swatch, then the name. The reason is not on the tile; it shows once, as the strip value for the hijab in the outfit, and in full in each tile's VoiceOver label. Order: warm hijabs first when the request is cold or snowy, then by tone so pinks sit together.
     - A piece in another plan within seven days: `planned` mark, neutral (`sunken` fill, `inkMuted` calendar symbol and short weekday "Fri"), only when the tile is not selected. Blush only ever means chosen or kept.
     - At most three marks per tile: one on the photo (selected disc or plan mark), the swatch (it is the only thing before the label), the label.
     - Labels wrap with no line cap at any size. The row has no fixed height: it sizes to its content (`alignItems: 'flex-start'`), so a label is never clipped when Switch piece, Show all, a language change or a Dynamic Type change puts new labels in it. A height change runs through the Expander's inline expand or collapse.
     - At default sizes a word wider than the tile label width breaks at the tile edge (`textBreakStrategy` simple), soft hyphens where the name has them. Lane 1 tests NB piece names at default size.
     - No `colour.onPress` on strip tiles: a tap always picks. The selected hijab tile alone carries `common.editColour` as an `accessibilityAction` and on long-press; it opens the S1a colour chips under the tile row. Nothing visible is added.
   - No action row and no Undo. The way back is the first tile; the outfit's Undo is Today's Undo slot under the quiet row (UC-F06-14).
6. Outfit `title` and reason line. The reason line updates after a pick; the title changes only when the top or the outer layer changes. While the strip is open both usually sit below the fold (see Height), so in-strip feedback is the flat lay swap, the selected disc and the strip value.
7. Quiet row (Another, Save look, Not for me). Unchanged. After a pick, `result.changed` and `common.undo` crossfade into F06's reserved Undo slot under it, with no height change.
8. `Footer`: "Wear this" primary alone (or "Save look" primary while planning). Unchanged.

VoiceOver order: FlatLay title, pieces in dressing order, strip header, Keep, tiles, actions (S1a), colour chips (S1a), error, reason line, quiet row, Undo slot, Footer. One focus rule for every entry: after the expand, `setAccessibilityFocus` on the strip header ("Change hijab, With the tunic, expanded"). The open strip handles `onAccessibilityEscape` (two-finger scrub): it closes, focus goes to its opener.

Height (6.1-inch, 393 x 852 pt): collapsed header with status bar 103, Footer 110 (12 + 52 + 12 + 34 safe area), so 639 between them. Hero 361, `space.xl` 24, strip 248 (16 padding, header 44, 12, tile photo 112, 8, two label lines 40, 16 padding): 633. The scroll view always has a bottom `contentInset` (and indicator inset) equal to the measured Footer height, so the last tile or Row can scroll fully above the Footer and VoiceOver never lands on a tile hidden under it. The open scroll, a worklet `scrollTo` (`settle`, `silk`):

- Starts only after the expand has settled, and only when the strip's bottom would otherwise sit under the Footer.
- Default and `large`: puts the strip's bottom on the Footer's top edge, but never so far that the changed piece's slot leaves view. A taller strip (a third label line, an error line) stops there and the rest scrolls by hand above the inset.
- `ax`: puts the strip header just under the collapsed nav bar, even when the hero scrolls away. The swap is still announced and the Row shows selected.

The native large title collapses because of this scroll, not as its own motion; Lane 1 checks the open on device. After the scroll the reason line and the Undo slot are below the fold. That is accepted: the first tile is the in-strip way back and the strip value carries the reason.

```
┌─────────────────────────────────────┐
│ Today                          (o)  │  collapses on open scroll
│                                     │
│        [abaya] [tunic]  [hijab]     │  FlatLay hero, white canvas
│                [trousers] [bag]     │
│                         [loafers]   │
│ ─────────────────────────────────── │  hairline, strip on canvas
│ Change hijab  With the tunic (✓Keep)⌃│  title, value, Keep, chevron
│ ┌──────┐ ┌──────┐ ┌──────┐ ┌──      │
│ │ hijab│ │ hijab│ │ hijab│ │        │  Tile strip, 112 pt
│ │   (✓)│ │ [Fri]│ │      │ │        │  ✓ = blush disc, [Fri] = neutral plan mark
│ └──────┘ └──────┘ └──────┘ └──      │
│ ● Mauve  ● Choco ● Ivory   ● S      │  swatch + name, wraps, no cap
│ chiffon  late    silk      s        │
│                                     │  title, quiet row, Undo slot below
├─────────────────────────────────────┤
│ [           Wear this           ]   │  Footer
└─────────────────────────────────────┘
```

Main action: tap a tile. The pick applies at once; VoiceOver double-tap does the same. There is no "Use" button, no "Use" action and no commit step. The Footer keeps the only primary, "Wear this".

### S1a Strip with no alternative (same Expander, short body)

Purpose: never a dead end when nothing else fits.

- Header line as S1. Keep shows in the hijab role only; the piece role has no Keep, because its only action drops the piece.
- In place of the tile row: one `body` `ink` line, `change.none` (any role) or `hijabs.noOther` (hijab).
- Actions, leading-aligned wrapping row, one secondary in the same place for both:
  - Any role: `change.anotherWithout` (secondary).
  - Hijab: `common.showAll` (secondary, VoiceOver `hijabs.showAllLabel`), then `common.editColour` (quiet, VoiceOver `change.editColourLabel`, `accessibilityState.expanded` while its chips are open).
- Edit colour opens a colour `ChipRow` under the actions (`choice`, single, `wrap`, swatch on each chip with a 1 pt `ink` edge, swatch hidden from VoiceOver, `colour.*` names), the hijab's current colour selected. This is the only visible nested choice in F08.
- "Show all" replaces the line with the S1 tile row of every available hijab, unranked, labelled by name as in S1. The Show all button leaves with the line; Edit colour keeps its place. Focus moves with `setAccessibilityFocus` to the first tile (the first Row in S1b). Picks then work as in S1.

```
│ ─────────────────────────────────── │
│ Change hijab          (Keep)     ⌃  │
│ No other hijab works with this      │
│ outfit                              │
│ ( Show all )  Edit colour           │  secondary, quiet
```

```
│ ─────────────────────────────────── │
│ Change trousers                  ⌃  │
│ No other piece works here           │
│ ( Another without it )              │  secondary
```

Main action: `change.anotherWithout` (piece) or "Show all" (hijab), both secondary.

### S1b Strip at `large` and `ax` text sizes (same Expander, list body)

Purpose: the same strip when tiles cannot hold the text.

- Used at `large` and `ax` only, by text size. At default sizes the strip is always tiles.
- The tile row becomes a list of `Row`s: `thumb` leading, title = the piece name, meta = the plan day, trailing `selected` on the piece in the outfit. The strip value sits under the strip title.
- Each Row's `accessibilityLabel` is the tile label, in the same order, with `change.inPlan` and the full weekday ("In Friday's plan"). The "·" separator is never spoken.
- Keep moves under the title. S1a actions and colour chips stack, full width.

```
│ ─────────────────────────────────── │
│ Change hijab                     ⌃  │
│ With the tunic                      │  value
│ (✓ Keep)                            │
│ [▢] Chocolate jersey hijab        ✓ │  Row, thumb, selected
│ ─────────────────────────────────── │
│ [▢] Mauve chiffon hijab             │
│     Fri                             │
```

Main action: tap a Row (applies at once, as S1).

## States

| State | What shows | Use case |
|---|---|---|
| Closed | Today recipe with no strip. Each flat lay piece is a button `change.pieceLabel` ("Mauve chiffon hijab", or "Ivory work tunic, main piece"), hint `change.hint`; ", kept" added when kept, and the kept mark on its slot | UC-F08-01 |
| Opening, loading | Alternatives come from the on-device stylist, so they are normally there in the first frame. If not ready after `wait`: `Silk placeholder shape="tile"` at strip size, three slots, one VoiceOver element `common.loading` ("Loading" / "Laster"). The tile row replaces them with one `base` fade | UC-F08-01, UC-F08-02 |
| Open, no pick | S1. The first tile is the piece in the outfit and carries the selected disc. Focus on the strip header | UC-F08-01, UC-F08-02 |
| Picked | The flat lay swaps the piece. The tapped tile takes the selected disc, focus stays on it. The strip value crossfades to the new hijab's reason. The reason line updates; the title only when the top or outer layer changed. `result.changed` and `common.undo` crossfade into F06's reserved Undo slot, no height change. One announcement: `result.changed`, queued (F06 Undo rule). The swap is recorded as feedback (silent). Tapping the first tile again is a pick like any other and brings the original back | UC-F08-01, UC-F08-02, UC-F06-14 |
| Kept | Keep `Chip` checked with its checkmark; the kept mark shows on the piece's flat lay slot, also after the strip closes. Another keeps this piece; it holds still while the rest arranges. Keep follows the piece in the outfit: after a pick it shows the new piece's state and its VoiceOver label names it | UC-F08-04 |
| Released | Keep `Chip` unchecked; the kept mark fades out | UC-F08-04 |
| Keep and Another without it | Never together: S1a for the piece role has no Keep, so "Another without it" has nothing to contradict. The hijab S1a keeps Keep, and its actions do not drop the hijab | UC-F08-03, UC-F08-04 |
| Planned elsewhere | Neutral tile `planned` mark "Fri" / "fre.", hidden while the tile is selected; VoiceOver "In Friday's plan" in the tile label either way | UC-F08-02 |
| Cold or snow | Hijab order: warm hijabs first, then tone. No extra text | UC-F08-02 |
| Editing colour | S1a hijab, or the selected hijab tile's `common.editColour` action or long-press in S1. Colour chips open, current colour selected, Edit colour `expanded` in S1a. Tap a colour: it saves as confirmed, chips close, `result.saved` ("Lagret") announced once, queued, focus returns to Edit colour (or the tile). Nothing re-ranks until the strip next opens. Piece detail shows the same confirmed colour | UC-F08-06 |
| Empty (no alternative) | S1a. Never an empty strip | UC-F08-03 |
| Show all hijabs | S1a after "Show all": every available hijab by name, unranked. The Show all button is gone, Edit colour stays, focus on the first tile (first Row in S1b) | UC-F08-03 |
| Generating | "Another without it", or Another with a kept piece: the strip closes, focus goes to the FlatLay title (role header), then the Generating moment on the flat lay (only changed slots swap) and `today.announce.outfit` once, queued | UC-F08-03, UC-F08-04 |
| Error, swap | The pick could not be saved: the flat lay swaps back, the disc returns, `common.error.save` in `footnote` `error` under the tile row, announced. It enters with inline expand and leaves with inline collapse on the next successful pick. The tiles stay usable | UC-F08-01 |
| Error, colour | The previous chip stays selected, `common.error.save` under the colour chips, announced, with the same inline expand and collapse | UC-F08-06 |
| Offline | No change. Alternatives, ranking, the swap and the colour fix are all local. `common.offline` never shows here | all |
| Permission denied | Not applicable. No camera, photos or location in this flow | - |
| First run | Not reachable: Today first run has no outfit, so there is nothing to tap. The first strip a user opens looks like every other: no tip, no intro line | - |
| Piece leaves | The piece is put away or removed elsewhere while open: the strip closes, no message, focus goes to the FlatLay title | UC-F08-05 |
| Closed with a pick | Tap the header or the same flat lay piece: the strip collapses, the swap stays, the Undo slot keeps Undo. No prompt | UC-F08-05 |
| Switch piece | Tap another flat lay piece: same Expander, title and value crossfade to the new role, the tile row crossfades and sizes to its new labels (height change by inline expand or collapse), Keep shows that piece's state | UC-F08-01 |
| Largest text | `large` and `ax`: S1b, Rows instead of tiles, plan day in the meta, value and Keep under the title, S1a actions and colour chips stack. `ax` uses the header-under-nav-bar open scroll. Georgia title capped at 2.0x. Nothing truncates | UC-F08-01, UC-F08-06 |
| Bokmål | "Bytt hijab", "Behold", value "Med tunikaen" (EN "With the tunic"), VoiceOver "Tar opp gammelrosa fra kardiganen", "Endre farge", "Vis alle", "Nytt uten dette plagget". Labels wrap at word breaks; "fre." fits the 1.4x-capped mark | UC-F08-01, UC-F08-06 |
| Reduce Motion | Every motion below takes its Reduce Motion path. Layout lands at once, content fades | all |

## Motion

All tokens from `motion.md`. Nothing bounces, nothing floats, the outfit and Footer never move.

| Moment | Motion |
|---|---|
| Press a flat lay piece | `lift` (`base`, `silk`), back to rest on release (`settle`, `fall`) |
| Strip opens | Inline expand: Expander `LinearTransition` `settle`, `silk`, anchored at its top, so the flat lay above stays still and the title, reason and quiet row glide down. After `step`, the body (Keep and the tile row) fades in once, opacity and translateY 4 to 0 (`base`, `silk`), no per-tile stagger. Chevron rotates (`settle`, `silk`). Only after the expand settles, and only if needed, the open scroll runs (Height rule in S1); the large title collapses as part of that scroll |
| Opened from the reason chip | Same inline expand and scroll. The Footer does not change |
| Loading tiles | `Silk` placeholder (Loading moment), shown only after `wait`. The tile row replaces it with one `base` fade |
| Tap a tile | Tile `press` fill, then Selection crossfade of the disc (`quick`, `silk`). The flat lay plays Flat lay piece swap: outgoing piece fades and rises 4 pt (`quick`, `release`), incoming starts after `step` and falls 6 pt to rest (`arrange`, `fall`). The other pieces do not move. The strip value and the reason line use the label crossfade (Banners and bars); the title only when the top or outer layer changed. The Undo slot crossfades in (`base`, `silk`), no height change (F06) |
| Keep | Chip Selection crossfade (`quick`, `silk`), the checkmark fades in its reserved space. The flat lay kept mark fades in or out (`quick`, `silk`). No haptic |
| Another while kept | Generating moment: the kept piece and its mark hold still, only changed slots swap in dressing order, `step` apart |
| Edit colour | Colour chips open with inline expand (the content above stays still) |
| Colour chosen | Chips collapse (Inline collapse). Nothing reorders |
| Show all | The line and the Show all button leave with list remove (`quick`, `release`); tiles enter with list insert, `step` apart, max 6. The only stagger in F08 |
| Switch to another piece | Title and value label crossfade; the tile row crossfades as one (`quick` out, `base` in). The Expander height changes only through inline expand or collapse |
| Error line | Enters with inline expand (`settle`, `silk`), leaves with inline collapse |
| Strip closes | Inline collapse: content fades (`quick`, `release`), then height closes (`settle`, `silk`) and the content below glides up. Focus goes to the flat lay piece or the button that opened it |
| Reduce Motion | Piece swap crossfades in place (`base`). Strip expand and collapse land in one frame, content fades (`base`). `scrollTo` is not animated. Chevron rotates in one frame. Colour chips and the error line expand and collapse in one frame. Show all fades, no stagger. `lift` steps at once. The body's translateY 4 to 0 and the outgoing piece's 4 pt rise drop their travel and keep only the `base` fade, with `ReduceMotion.Never` on those fades (`motion.md`) |

VoiceOver during motion: the outgoing flat lay piece is hidden from frame 0. One announcement per pick (`result.changed`). Focus stays on the tapped tile after a pick.

Haptics: none. Tiles and chips are silent (`motion.md` > Haptics).

## Copy

All keys exist in `copy.md` > F08 unless marked new.

| Where | Key | EN | NB |
|---|---|---|---|
| Strip title, also its VoiceOver header | `change.title` | Change {role} | Bytt {role} |
| Role, singular (new list) | `role.one.*` | hijab, shoes, main piece | hijab, sko, hovedplagg |
| Role, definite (new list) | `role.the.*` | the hijab, the tunic | hijaben, tunikaen |
| Strip value, hijab strip only (new) | `change.reason.with` | With {piece} | Med {piece} |
| Keep chip, visible | `today.keep` | Keep | Behold |
| Keep chip, VoiceOver (new) | `change.keepLabel` | Keep {name} | Behold {name} |
| Kept, VoiceOver on flat lay piece | `outfit.keptLabel` | {name}, kept | {name}, beholdt |
| Flat lay piece, VoiceOver | `change.pieceLabel` | {name}, {role} | {name}, {role} |
| Flat lay piece hint | `change.hint` | Changes this piece | Bytter plagget |
| Tile, VoiceOver, other roles | `tile.label` | {name}, {marks} | {name}, {marks} |
| Tile, VoiceOver, hijab strip | `tile.label` strip variant | {name}, {colour}, {reason}, {marks} | same order |
| Hijab reason, VoiceOver only | `change.reason.picksUp` | Picks up the {colour} in {piece} | Tar opp {colour} fra {piece} |
| Other hijab reasons, VoiceOver only | `reason.*` | unchanged, `{a}` dropped | unchanged |
| Plan mark | `change.inPlan` | In {day}'s plan (visible: "Fri") | I planen for {day} (visible: "fre.") |
| Loading | `common.loading` | Loading | Laster |
| Pick result, Undo slot, announced once | `result.changed` | Changed | Byttet |
| Undo slot action | `common.undo` | Undo | Angre |
| Edit colour | `common.editColour` | Edit colour | Endre farge |
| Edit colour, VoiceOver | `change.editColourLabel` | Edit colour of {name} | Endre farge på {name} |
| Colour saved, announced | `result.saved` | Saved | Lagret |
| Colour chips | `colour.*` | unchanged | unchanged |
| No alternative | `change.none` | No other piece works here | Ingen andre plagg passer her |
| No alternative, hijab | `hijabs.noOther` | No other hijab works with this outfit | Ingen annen hijab passer til antrekket |
| Restyle without | `change.anotherWithout` | Another without it | Nytt uten dette plagget |
| Show all | `common.showAll` | Show all | Vis alle |
| Show all, VoiceOver | `hijabs.showAllLabel` | Show all hijabs | Vis alle hijaber |
| Close, VoiceOver action on the open header | `common.close` | Close | Lukk |
| Errors | `common.error.save` | Could not save. Try again. | Kunne ikke lagre. Prøv igjen. |

`{role}` in `change.title` and `change.pieceLabel` comes from `role.one.*`, so the strip title reads "Change hijab" / "Bytt hijab"; in `change.pieceLabel` it is left out when the name already holds it ("Mauve chiffon hijab", not "Mauve chiffon hijab, hijab"). `role.the.*` stays only for `{piece}` in `change.reason.with` and `change.reason.picksUp`, the drawn piece in definite form ("the tunic" / "tunikaen"). `{colour}` in `change.reason.picksUp` is lower case in both languages ("plum", "gammelrosa"), since it sits inside a sentence.

Hijab strip tile label: `{name}` first (Label in Name), `{colour}` left out when the name already holds it, then the full reason and the marks. Examples: "Mauve chiffon hijab, Picks up the plum in the tunic, In Friday's plan", "Chocolate jersey hijab, brown". In the outfit is never a mark; it is `accessibilityState.selected`.

Cut from F08: `change.use` (a tile is a `button`; double-tap applies it), `change.trying` (picks apply at once), `hijabs.currentLabel` and `hijabs.currentVoice` (the selected disc and `accessibilityState.selected` say it), `common.undo` in the strip (the Undo slot owns Undo). All copy changes are applied in `copy.md`.

## Use cases

| ID | Screen | States |
|---|---|---|
| UC-F08-01 Change one piece | S1, S1b | Closed, Opening, Open no pick, Picked, Switch piece, Error swap, Largest text, Bokmål |
| UC-F08-02 Match a hijab | S1 (from the flat lay or the reason chip) | Open no pick (in-outfit hijab first with the disc, its reason as the strip value, pinks together), Cold or snow, Planned elsewhere, Picked |
| UC-F08-06 Fix a wrong hijab colour | S1a, the selected tile's Edit colour action in S1, or piece detail (UC-F05-15) | Editing colour, Error colour, Largest text, Bokmål |
| UC-F08-03 No alternative fits | S1a | Empty, Show all hijabs, Generating (Another without it), Keep and Another without it |
| UC-F08-04 Keep or release | S1, S1a (hijab), S1b, flat lay kept mark | Kept, Released, Generating (Another while kept) |
| UC-F08-05 Close the strip | S1 | Closed with a pick, Piece leaves |
| UC-F06-05 hand-off | S1 hijab strip, opened by "Hijab does not match" with the feedback kept; focus on the strip header | Open no pick |
| UC-F06-14 Undo | Today Undo slot after a pick | Picked |

## Open items

For the architect (`use-cases.md`), so the Maestro steps match the components:

- UC-F08-01, UC-F08-02, UC-F08-03: there is no "Use this piece" / "Use this hijab" button and no "Trying {name}" line. Tapping a tile applies it. The strip has no Undo; Undo is Today's Undo slot (UC-F06-14), and tapping the first tile brings the original back.
- UC-F08-02 step 1: no "Current" mark. The hijab in the outfit is first with the selected disc; every tile shows the hijab's name; the strip value shows "With the tunic" for the hijab in the outfit; the full "Picks up the plum in the tunic" is spoken in the tile label. Step 4 Undo is the Today Undo slot.
- UC-F08-05: closing keeps the pick (there is no preview to revert) and keeps Undo in the Undo slot.
- UC-F08-04: kept is drawn on the flat lay with the kept mark (blush disc, `pin.fill`), shown only while a piece is kept, as well as the checked Keep chip and the piece's VoiceOver label. S1a for the piece role has no Keep.
- UC-F08-06: "Not this colour?" is "Edit colour": in S1a (hijab), and as an `accessibilityAction` and long-press on the selected hijab tile in S1. The strip does not re-rank until it next opens. "Dusty pink" is not a `colour.*` name; use Blush or Mauve (`copy.md` Notes).
- UC-F08-03: "Restyle without this piece" is "Another without it". "Show all hijabs" is visible "Show all" with "Show all hijabs" in VoiceOver.
- "Compare hijabs" is gone: the hijab in the flat lay opens the strip, whose title is "Change hijab" / "Bytt hijab" (`change.title`). `today.changeHijab` is cut in `copy.md` (UC-F06-02, UC-F05-15, UC-F07-08, UC-F08-02, UC-F08-06, UC-F11-02 updated by the architect).

For the component role (`design-system.md`):

- 12 Expander > Uses, Change strip: header is title, value (hijab strip only), Keep (a sibling `checkbox` Chip, not inside the header button), chevron; body is the tile row. No Undo, no action row in S1; actions only in S1a (one secondary, plus quiet Edit colour for the hijab). `canvas` fill with a top `line` hairline instead of the `surface` card, and it counts as a `canvas` container (Chip edge, `plumSoft` secondary). Rows at `large` and `ax` only. `onAccessibilityEscape` closes it.
- 12 Expander > header: allow a trailing `accessory` (one Chip) between the value and the chevron.
- 7 Chip and Button: key the unselected Chip `lineField` edge and the secondary fill on the parent fill (`canvas` or `surface`), not on the component name, so a Chip on any `canvas` container gets the edge (sunken on canvas is 1.16 alone).
- 7 Chip, `checkbox`: a leading `checkmark` (`ink`, `symbolScale`) when checked, its width reserved when unchecked.
- 7 Chip: a swatch inside a chip uses a 1 pt `ink` edge (11.59 on sunken, 7.12 on blush), hidden from VoiceOver.
- 10 Tile: in a `strip`, `label` has no line cap at any size and the row has no fixed height (`alignItems: 'flex-start'`); strip tiles never set `colour.onPress`.
- 10 Tile > Mark look: the `planned` mark is neutral (`sunken` fill, `inkMuted` text and calendar symbol, 4.64). Blush only means chosen or kept.
- 10 Tile, selected disc: Lane 1 checks the blush disc on a blush hijab cut-out. If the disc is lost, add a 1.5 pt `canvas` edge to the disc.
- 11 FlatLay: the kept mark (22 pt blush disc, `ink` `pin.fill`, bottom trailing corner of the slot, `rest` scale, hidden from VoiceOver), only on kept pieces. The 44 x 44 pt uncovered rule from F06 S1 item 4 applies to every hero piece, since a tap on the piece is the only touch entry to F08 for any role except the hijab.
- Today action area: "A Change strip pick keeps its Undo inside the strip" becomes "A Change strip pick fills the Undo slot". The Footer holds Wear this alone (F06).

For F06 (`flows/F06-today.md`): Undo paragraph updated in this pass: a Change strip pick fills the Undo slot like Another, and the one announcement rule covers both flows.

For `architecture.md`: the `setColour` row ("fixable on ... the Change strip") holds through S1a and the selected hijab tile's Edit colour action and long-press.

## Review log

- Blocking, reason line cap and short label: combined. Visible hijab labels are short and also wrap with no cap; the full sentence is VoiceOver only.
- Blocking, Label in Name vs "Current": `hijabs.currentLabel` and `hijabs.currentVoice` are both cut, so the "Current, ..." example does not apply. In the outfit is `accessibilityState.selected` only.
- Minor, Keep in the action row: placed in the header line instead, because S1 no longer has an action row (strip is header plus tiles for the height budget). Its copy.md conflict is fixed in copy.md.
- Minor, focus after Undone: no longer applies; the Undone state is cut. Tapping the first tile keeps focus there and VoiceOver reads it as selected.
- Minor, `result.changed` missing in copy.md: no change, it exists in copy.md F12 (Shared results). `common.loading` is now named.
- Minor, colour fix through the tile's `colour.onPress`: declined. A second visible target in a 112 pt strip tile is clutter. Replaced in round 2 by an `accessibilityAction` and long-press on the selected hijab tile only, which adds nothing visible.
- Minor, Expander fill: chose `canvas` with a top hairline over a `surface` card, so cut-outs read on the same white as the hero.
- Minor, contrast and targets: verified, no change.
- `design-system.md` 11 FlatLay accessibility text updated to `change.pieceLabel` and `change.hint`.
- Round 2, blocking: all eight fixed. Row height is content-sized, not measured. Open scroll has an `ax` rule and a Footer `contentInset`. One focus rule (strip header) for every entry. Show all removes its button and moves focus to the first tile. Every tile is labelled by name, the reason is the strip value. A pick fills F06's Undo slot, with one announcement rule written into F06. Kept is drawn on the flat lay. Keep is left out of S1a for the piece role.
- Round 2, minor: the `tile.label` repetition fix (drop `{reason}` when it repeats `{label}`) no longer applies, since `{label}` is gone; `{colour}` is still dropped when the name holds it.
- Round 2, minor, soft hyphens and the fit test: resolved by dropping the fit test. S1b is chosen by text size only, so `onTextLayout` no longer decides the layout; a word too wide at default size breaks at the tile edge.
- Round 2, minor, `change.use`: dropped, not turned into a hint. A tile is a `button` and double-tap applies it; a hint would be one more spoken line on every tile.
