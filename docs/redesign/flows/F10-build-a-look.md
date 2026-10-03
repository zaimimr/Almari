# F10 Build a look

Date: 2026-10-03. Flow design (UX, UI, motion, copy). Route: `/look/build`. Inputs: `architecture.md` (F10 row, shell rules, owner decisions), `use-cases.md` UC-F10-01 to UC-F10-07, `design-system.md`, `motion.md`, `copy.md` (F10 New look), before screen `screens/before/look-build.png`.

Entries (push, native stack): Looks header New look and Looks empty state New look (`looks.new`, empty builder), look detail "Change pieces" (with look id), Closet select footer and "N added" bar "Build a look" (with pieces), piece detail "Use in a look" (with piece). Exit: "Save look" pops to the caller. Empty closet hands off to F02 and comes back.

What changes from the before screen: no floating card sheet, no Georgia pep line or helper sentence in the empty collage, no name field and no grey "Save look" beside it. The look takes its suggested name, shown as the Georgia title under the collage; rename happens in look detail (owner decision 2). One pinned bottom dock holds the status line, the strip region and the Footer. The occasion chip is new (B10-01) and sits first in the strip's chip row. The strip region is the one place that changes mode (picker, Change strip, occasion), in place and at one held height, so nothing above it moves.

## Screens

One screen. Swap mode and the occasion choice are in-place modes of the strip region, not new screens.

### Builder

Purpose: put pieces together by hand and save them as a look.

Recipe: Editor (`design-system.md` > Screen recipes). `Screen leading="cancel"`. One layout at every size below `ax`: an upper `ScrollView` (collage and title) and a bottom dock pinned to the bottom edge (status line, strip region, Footer). The upper area scrolls only when its content is taller than the space left; the dock never scrolls. A pick in the strip therefore always lands in a collage that is at least partly in view, and nothing jumps or auto-scrolls. At `ax` the layout changes (States).

Layout, top to bottom:

1. `Screen` header. Left `HeaderItem` text "Cancel" (`common.cancel`). Inline title "New look" (`looks.new`), or "Edit look" (`build.edit`) from look detail. No header right.
2. Upper area (scrolls): `FlatLay size="hero"` with `title`, centred.
   - Collage. Square. The side is computed once per text size, language and window size: the upper area's height minus 8 top, 12 gap and the reserved title slot, clamped between a minimum (60 percent of the content width, never under 240 pt) and the content width. It is never re-derived from a title or status line change.
   - Slot map. The occasion's slot map (one frame per role) is fixed from the first frame and does not depend on how many pieces are placed, so a piece always lands in its own dashed slot and never moves its neighbours. The builder never uses `arrangePieces`' one-piece or no-clothing fallbacks (Phase 3 change). Only a structural change re-lays the collage: a dress placed or removed (it fills the main and bottom slots), or a layer added or removed. That re-lay is one `settle` move.
   - One placed piece per role. Tapping a strip tile whose role is filled replaces that piece with the full `Flat lay piece swap` (outgoing half, then incoming half). A dress replaces the main piece and the bottom; a bottom placed over a dress replaces the dress.
   - Pieces. Each is pressable (`onPiecePress`) and opens swap mode. Each keeps an uncovered 44x44 pt touch area, measured with its hitSlop, that no higher piece covers. Phase 3 adds a geometry unit test over every role combination the builder allows (each role empty or filled, main as top, tunic or dress, layer on or off) at the hero minimum; it asserts that rect for every placed piece. The unchanged geometry fails it for the bag (29 pt tall strip under hijab and shoes), so the bag is nudged: candidate is to draw it above the hijab and under the shoes, which leaves about 67x46 pt at 240. If no nudge passes, the hero minimum rises to the smallest side that passes. The test decides; until it exists this spec makes no promise about the minimum.
   - Remove. Each piece has the VoiceOver action `common.remove` ("Remove" / "Fjern"). The visible path, which also serves Switch Control and Voice Control: tap the piece's selected tile in the picker strip; that tile is reachable by its spoken name.
   - Empty slots: dashed silhouettes (`lineField`) for the occasion's required roles (Everyday: main, bottom, shoes, hijab; a dress fills main and bottom). They stay dashed after other pieces are placed, with no visible text. For VoiceOver each is static text (not a button) `build.slotEmpty` with `role.one.*` ("No shoes" / "Mangler sko"), read after the placed pieces in dressing order. An occasion change fades dashed slots in or out in place (`base`).
   - Title: the suggested name (`outfitName.*`, Georgia `title`, role header). Its slot is reserved from the first frame at the measured height of two `title` lines for the current language and text size, also with no pieces (then blank and not an accessibility element). A new look's title follows the pieces; in edit the saved name stays. Save uses the title as the name.
3. Bottom dock, status line: one row, height reserved from the first frame. Leading: `Button quiet small` "Fill the rest" (`build.fill`), which never shrinks; after it, a problem or error line (States), `Text footnote`, `flexShrink: 1`, wrapping. Same leading alignment as F08's quiet row. Fill the rest is rendered only when the closet has pieces and at least one required slot is empty; otherwise the row keeps its height. When the line is empty it is not an accessibility element (`accessibilityElementsHidden`), so VoiceOver does not stop on a blank. When the measured labels do not fit side by side (any text size or language), the row stacks, Fill the rest first and the line under it, laid out for the longer measured pair per `motion.md` > Banners and bars, so a taller row is decided once and never changes on a tap.
4. Bottom dock, strip region: one held height for the current text size and language, the measured maximum of its three modes, measured in a hidden layer as `motion.md` > Banners and bars. Never a fixed value. Every mode's content is anchored to the top of the region; the slack sits under it, against the Footer hairline, never between the chips and the tiles. Tile labels keep the Tile's 2-line rule below `large` and nothing else caps them.
   - Picker mode, on `canvas`: one `ChipRow layout="scroll"`: the occasion chip first, a hairline divider, then `closet.all` and `category.*` for categories that have pieces. Under it a horizontal strip of `Tile size="strip"` labelled with the piece name. The strip order is set on entry and on each category or occasion change: under "All", placed pieces lead in dressing order, then the rest ranked for the occasion and the placed pieces. Placing or removing never reorders the strip, so nothing shifts under the finger; a removed piece keeps its place until the next re-rank. Placed pieces show the selected disc. Tap toggles a piece in or out of the collage.
   - Occasion chip: `Chip kind="control" opens="expander"` showing the current occasion ("Everyday" preselected; the look's occasion in edit) with `chevron.down`. VoiceOver label `adjust.chipLabel` ("Occasion, Eid" / "Anledning, Eid"), `accessibilityState.expanded` while occasion mode is open.
   - Occasion mode: the ChipRow stays; everything under it becomes the Expander body on `surface`, a single-choice `ChipRow layout="wrap"` of `occasion.*` (radiogroup labelled `adjust.occasion`), current one selected. No visible title. A pick applies at once and returns to picker mode. Tapping the occasion chip again closes it with no change; tapping a category chip closes it and filters.
   - Change strip mode, on `surface` (Swap mode, below).
   - The `surface` fill crossfades with the mode switch (`base`), the same under Reduce Motion.
5. Bottom dock, `Footer` with one primary: "Save look" (`common.saveLook`), or "Save changes" (`common.saveChanges`) in edit. Editor rule: rendered from the first frame, disabled until at least one piece is placed (in edit: until something changed).

Fit check, default text, bokmål, 402x874 pt test phone: 62 top inset, 44 nav bar and a 110 Footer (12 + 52 + 12 + 34 safe area) leave 658. Dock: status row 44 plus strip region 304, the Change strip being the tallest mode (16 + 44 header + 12 + 112 tile + 8 + 40 two-line label + 12 + 44 Undo row + 16) = 348. Upper area 310: 8 top + 12 gap + 64 title slot leave 226 for the collage, under the 240 minimum, so the collage is 240 and the upper area scrolls by 14 pt. With a one-line title only the blank second title line is out of view at rest. Picker mode is 248, so 56 pt of slack sits under the tiles against the Footer hairline. On a 375x667 pt phone (20 top, 44 nav, 76 Footer) the upper area is 179, so about 170 pt of the 240 collage is in view at rest and the rest is a scroll away.

Swap mode (tap a piece in the collage). The strip region becomes F08's Change strip (S1 and S1a) in place, at the region's height: header `change.title` with `role.the.*` ("Change the hijab" / "Bytt hijaben") and chevron, tiles in F08's order with the piece in the look selected, hijab reasons, Edit colour, Undo in its reserved row, `change.none` / `hijabs.noOther` with "Show all". A pick applies at once. Selected state per `design-system.md` > Selected. The header or the same collage piece closes it. Differences from F08:

- It sits in the strip region instead of under the hero.
- No Keep chip, and builder strip tiles carry no `today.keep` accessibilityAction, because the builder has no reroll to keep a piece through. "Another without it" is replaced by the picker itself.

Focus:

- Activating a collage piece moves VoiceOver focus to the Change strip header (role header). The collage piece carries `accessibilityState.expanded` while its strip is open. A pick keeps focus on the picked tile and announces `result.changed`, as on Today. Closing (header, the same piece, or the escape gesture) returns focus to that collage piece.
- Activating the occasion chip moves focus to the selected occasion chip in the body. A pick returns focus to the occasion chip, which reads its new value. Closing returns focus to the occasion chip.
- Escape: while swap or occasion mode is open, `onAccessibilityEscape` on the strip region closes that mode and returns focus to its opener. Only a second escape reaches the discard guard.
- At `ax` the region is in the scrolling column: a newly focused header or chip scrolls into view per `motion.md` > Inline expand (`scrollTo` not animated under Reduce Motion). Below `ax` the dock is pinned and never scrolls.
- After a fill that leaves no empty slot, Fill the rest unmounts: `setAccessibilityFocus` on the FlatLay title (header). If a slot is still empty, focus stays on Fill the rest.
- After Remove (the `common.remove` action), focus goes to that slot's empty-slot text when the role is required, else to the next piece in dressing order, else to the title. A piece removed by "Error: piece gone" moves focus the same way, only if it held focus. Removing by tapping a picker tile keeps focus on that tile.

```
 Cancel          New look
┌─────────────────────────────┐
│     ┌───────────────────┐   │
│     │   hijab   kameez  │   │  FlatLay hero, cut-outs on white
│     │  shalwar   - - -  │   │  dashed slot: shoes still empty
│     └───────────────────┘   │
│     Eid in sage             │  FlatLay title (Georgia), 2 lines reserved
├ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┤  dock edge (above scrolls)
│ Fill the rest               │  status line, leading
│ ( Eid v ) | (All)(Hijabs)(T │  occasion chip, then categories
│ ┌────┐ ┌────┐ ┌────┐ ┌──    │  Tile strip, selected disc
│ │ ✓  │ │    │ │ ✓  │ │      │
│ └────┘ └────┘ └────┘ └──    │
│ Mauve   Ivory  Sage         │  piece names, 2 lines max
│ chiffon kurta  kameez       │
├─────────────────────────────┤
│ [        Save look        ] │  Footer primary
└─────────────────────────────┘

Swap mode (strip region only, the F08 Change strip: hairline, canvas, no Keep):
├─────────────────────────────┤
│ Change hijab              ^ │
│ ┌────┐ ┌────┐ ┌────┐ ┌──    │
│ │ ✓  │ │    │ │    │ │      │
│ └────┘ └────┘ └────┘ └──    │
│ •Mauve  •Ivory  •Choco-     │  swatch + piece name, 2 lines max;
│ chiffon  modal   late       │  the reason is in accessibilityLabel
│ Edit colour   Undo          │  reserved row

Occasion mode (chip row stays, body on surface):
│ ( Eid ^ ) | (All)(Hijabs)(T │
│ (Everyday)(Work)(Eid)       │
│ (Wedding guest, nikah or    │
│  walima)(Dinner)            │
```

Primary action: Save look (Footer). Second action on screen: Fill the rest (quiet, leading in the status line).

## States

| State | What shows | Use case |
|---|---|---|
| Empty collage | Dashed silhouettes for the occasion's required roles, blank reserved title slot, status line with Fill the rest only, picker strip, Save disabled | UC-F10-01 |
| Prefilled | The pieces from Closet select or piece detail are placed from the first frame, suggested name as title, Save enabled, title "New look" | UC-F10-07 |
| Edit | From look detail "Change pieces": the look's pieces, name and occasion; title "Edit look"; "Save changes" disabled until something changes | UC-F10-01 (detail updates) |
| Swap | Strip region is the F08 Change strip without Keep; focus on its header | UC-F10-03 |
| Swap, no alternatives | F08 S1a in the strip region: `change.none` (or `hijabs.noOther` with "Show all" for the hijab) | UC-F10-03 |
| Occasion | Under the chip row, the occasion chips on `surface`; a pick re-ranks the strip and returns to picker | UC-F10-01 |
| Empty closet | Strip region shows only `Button secondary small` "Add pieces" (`closet.addPieces`) at its top-leading edge, where the chip row sits; no occasion chip, since there is nothing to rank. It pushes F02. Returning pops back here (no replace to the Closet tab); the new pieces are in the strip. Fill the rest is not rendered. The collage keeps its dashed slots, Save disabled | UC-F10-04 |
| Loading | No closet wait: the closet is loaded at the gate. A strip tile whose image is still decoding keeps its `tile.label` and shows a hidden `Silk placeholder shape="tile"` in place of the image; the image fades in | UC-F10-01, UC-F10-07 |
| Gone | Look detail with a gone look id: `Screen gone` "This look is no longer here" (`look.goneTitle`) with "Go back" (`common.goBack`) | UC-F10-06 |
| Generating | Fill the rest busy (`Silk busy`, `busyLabel` `build.filling`), collage stays, sheen over the placed pieces after `wait`; the screen stays usable, so the band stands still after `loop` (`motion.md` > Sheen, Loop limit). Then the new slots arrive. `moment-generating` exists only while the fill runs | UC-F10-02 |
| Error: fill impossible | The status line names the problem after Fill the rest with the stylist's own line (`styling.*`, fallback `styling.incomplete`), `footnote ink`, announced. It clears on the next collage or occasion change. Collage unchanged | UC-F10-02 |
| Error: piece gone | A placed piece is no longer in the closet (edit, or removed elsewhere): it leaves the collage, its slot turns dashed and the status line reads "A piece is gone" (`build.pieceGone`), announced. It clears on the next collage or occasion change | UC-F10-06 |
| Error: save failed | "Could not save. Try again." (`common.error.save`) in the status line, `footnote error`, announced. Nothing else moves. Save returns from busy to enabled; pieces and occasion are kept. Tapping Save retries | UC-F10-06 |
| Leave with changes | Swipe back works until the first edit; after it, Cancel asks to discard with the system dialog "Discard changes?" (`common.discardTitle`), "Discard" (`common.discard`), "Continue editing" (`common.keepEditing`). Swipe back, hardware back and the VoiceOver escape gesture all hit the same guard (`usePreventRemove`) and open the dialog, never pop silently. While swap or occasion mode is open, the first escape closes that mode instead (Focus). With no changes, Cancel pops at once | UC-F10-06 |
| Offline | No change. The builder, Fill the rest and Save are all on the phone, so there is no offline line | UC-F10-01 to 07 |
| Permission denied | Not in this flow (no camera). Add pieces from the empty closet carries F02's own denied state | UC-F10-04 |
| First run | Opened from the Looks empty state with only the sample closet: the strip shows sample pieces and everything works. With no pieces at all it is the Empty closet state | UC-F10-01, UC-F10-04 |
| Largest text (`large`) | Same layout: dock pinned, upper area scrolls, collage at its minimum and at least partly in view. Header Cancel becomes the `xmark` icon with `common.cancel` as VoiceOver and Large Content Viewer label (HeaderItem rule). Status line stacks. Tile labels drop the line cap; the strip region re-measures and holds its new height. Footer label wraps | UC-F10-01 |
| Largest text (`ax`) | The dock is released: one scrolling column, Footer pinned. Collage full width with title, status line, then the strip region: chip row as `wrap` (occasion chip first), pieces as `Row`s (`thumb` leading, `selected` trailing) instead of the Tile strip. Change strip as F08 S1b `Row`s; occasion chips wrap. The held height is dropped: each mode takes its natural height. The region is last before the Footer, so nothing below it moves, and a mode switch keeps its opener still | UC-F10-01 |
| Bokmål | "Ny look", "Endre look", "Fyll ut resten", "Bytt hijaben", "Bytt skoene", "Lagre look"; VoiceOver "Mangler sko", "Mangler hovedplagg", "Anledning, Eid". Occasion and category chips wrap inside their capsules ("Bryllupsgjest, nikah eller walima"); long words carry soft hyphens per `copy.md`. The status line wraps or stacks, never truncates. Lane 1 checks `adjust.chipLabel` on device in nb-NO: the commas in "Anledning, Bryllupsgjest, nikah eller walima" may read as three items; if so, the chip's label is `adjust.occasion` and its `accessibilityValue` the occasion | UC-F10-01 |
| Reduce Motion | Place and remove crossfade in place (`base`); a structural re-lay takes the new frames in one frame (no `LinearTransition`); lift shadow steps at once; strip region mode switch crossfades its content and `surface` fill at `base`; Change strip and occasion body lay out in one frame with content fading in; the occasion chip's `Expander chevron` turns in one frame; scroll into view at `ax` uses `scrollTo` not animated; Fill the rest crossfades the whole result in place, no stagger; status line text crossfades; sheen is a still band | UC-F10-02 |

VoiceOver at every text size: each add or remove announces the count (`common.pieceCountOne` / `common.pieceCountMany`, queued, once). The count is never shown.

## Motion

All names are `motion.md` tokens and transitions.

- Enter and leave: native push and pop (`Push and pop`). The screen renders complete; no entrance on its content. Late tile images fade in (`base`, `silk`). Swipe back works until the first edit; after it, Cancel asks to discard (system dialog).
- Place a piece (tap a strip tile): the tile's selected disc crossfades in (`Selection`, `quick`, `silk`). In its own slot in the collage the piece arrives with the incoming half of `Flat lay piece swap` (opacity 0 to 1, translateY -6 to 0, `arrange`, `fall`, at `elevation.rest`). The other pieces do not move. A tile whose role is filled plays the full piece swap on that slot. Removing plays the outgoing half (`quick`, `release`). A structural change (dress, layer) first re-lays the moved pieces in one `settle` move (`LinearTransition`, `silk`, no stagger), then the piece arrives. The title crossfades (`base`) only when the resolved name text differs; otherwise it holds still. Reduce Motion: crossfade in place (`base`), re-laid pieces move in one frame.
- Press a collage piece: `lift` while the finger is down, settle back to `rest` on release. Reduce Motion: shadow steps at once.
- Strip region mode switch (picker, Change strip, occasion): label crossfade from `Banners and bars` (outgoing `quick`, incoming `base`) with the `surface` fill crossfading at `base`; height held below `ax`, so nothing above or below moves. The Change strip's own Undo row and Edit colour chips follow F08's motion inside the region.
- Swap: picking an alternative plays `Flat lay piece swap` on that slot; the rest of the collage holds still. A swap that is structural (a dress for a main piece) re-lays as in Place a piece.
- Fill the rest (magic moment, `Generating`, collage in the builder): tap sets Fill the rest `busy` (`Silk busy`) and `moment-generating`; nothing moves. After `wait` the `sheen` passes over the placed pieces, clipped to their alpha, and stands still after `loop`. On result the new pieces arrive in their own slots in dressing order (top, bottom, layer, shoes, hijab, accessories), `step` apart; placed pieces do not move, unless the fill is structural, which re-lays in one `settle` move first. The band fades out (`quick`). The title crossfades if the name differs. The count is announced once when the result arrives, queued, then focus moves per Focus. A failed fill shows the problem line with the status line crossfade and moves nothing. Reduce Motion: everything crossfades in place.
- Occasion: the occasion chip's chevron turns (`Expander chevron`) and the strip region switches mode as above. Picking switches back; the strip re-ranks with a crossfade (`base`) and dashed slots fade in or out in place. The collage pieces do not move.
- Errors: problem and save error lines crossfade into the status line (`base`); the row's height is already reserved, and a stacked row follows `Banners and bars`.
- Save: Footer primary `busy`, `success` haptic when the write lands, then pop. The caller shows the result: on Looks the new row arrives with `List insert`; on piece detail the "Used in" Section gets the new row with `List insert`; look detail shows the updated FlatLay on arrival with no extra motion; Closet leaves select mode with no extra bar.

## Copy

All keys exist in `copy.md` (F10 New look unless noted). Rows in the F10 table for this flow: `occasion.*`, `closet.all`, `category.*`, `build.pieceGone`, `build.filling`, `build.slotEmpty`, `adjust.occasion`, `adjust.chipLabel`, `look.goneTitle`, `common.goBack`, `styling.*`, `common.discardTitle`, `common.discard`, `common.keepEditing`, `common.error.save`, `common.cancel`, `common.remove`. Change strip keys and role words (`role.the.*`, `role.one.*`) are F08's.

| Where | Key | English | Bokmål |
|---|---|---|---|
| Title | `looks.new` | New look | Ny look |
| Title in edit | `build.edit` | Edit look | Endre look |
| Header left | `common.cancel` | Cancel | Avbryt |
| Occasion chip, VoiceOver | `adjust.chipLabel` | {adjust}, {value} | {adjust}, {value} |
| Occasion chips group, VoiceOver | `adjust.occasion` | Occasion | Anledning |
| Occasion chips | `occasion.*` | unchanged | unchanged |
| Look name (FlatLay title) | `outfitName.*` | unchanged | unchanged |
| Empty slot, VoiceOver | `build.slotEmpty` with `role.one.*` | No shoes | Mangler sko |
| Remove, VoiceOver action | `common.remove` | Remove | Fjern |
| Count, announced only | `common.pieceCountOne` / `common.pieceCountMany` | 1 piece / {count} pieces | 1 plagg / {count} plagg |
| Fill | `build.fill` | Fill the rest | Fyll ut resten |
| Fill busy, VoiceOver | `build.filling` | Filling the rest | Fyller ut resten |
| Fill impossible | `styling.*`, `styling.incomplete` | unchanged | unchanged |
| Piece gone | `build.pieceGone` | A piece is gone | Et plagg er borte |
| Category filter | `closet.all`, `category.*` | All, unchanged | Alle, unchanged |
| Change strip header | `change.title` with `role.the.*` | Change the hijab | Bytt hijaben |
| Change strip, rest | F08 keys (`change.none`, `hijabs.*`, `common.undo`, `common.showAll`, `common.editColour`, `result.changed`) | as F08 | as F08 |
| Empty closet | `closet.addPieces` | Add pieces | Legg til plagg |
| Save | `common.saveLook` | Save look | Lagre look |
| Save in edit | `common.saveChanges` | Save changes | Lagre endringer |
| Save failed | `common.error.save` | Could not save. Try again. | Kunne ikke lagre. Prøv igjen. |
| Discard dialog | `common.discardTitle`, `common.discard`, `common.keepEditing` | Discard changes?, Discard, Continue editing | Forkaste endringene?, Forkast, Fortsett å endre |
| Gone look | `look.goneTitle`, `common.goBack` | This look is no longer here, Go back | Denne looken er ikke her lenger, Gå tilbake |

VoiceOver: collage pieces use `change.pieceLabel` (`role.one.*`, left out when the name holds it: "Mauve chiffon hijab") and `change.hint`, with the `common.remove` action; empty slots `build.slotEmpty`; tiles use `tile.label`, also while the image loads. Announced (queued, once): the count on every add and remove and when a fill result arrives, `result.changed`, the fill problem line, `build.pieceGone`, `common.error.save`.

Cut for this screen: `collage.emptyTitle`, `collage.emptyBody`, `build.empty`, `build.nameHint`, `look.name`, `build.countOne`, `build.countMany`, `build.save` as a title, `common.done`, `common.noPiecesInCategory`, `closet.noneFoundTitle`, `closet.firstTitle`, `closet.lookInvalid`, `error.lookSave`, `common.loading` on strip tiles.

## Use cases

| ID | Screen | State(s) |
|---|---|---|
| UC-F10-01 Build and save a look | Builder (picker and occasion modes) | Empty collage, Occasion, Edit, Largest text, Bokmål, First run, Offline (none). Save pops to Looks; the row carries the occasion |
| UC-F10-02 Fill the rest | Builder status line and collage | Generating, Error: fill impossible, Reduce Motion |
| UC-F10-03 Swap a piece in the collage | Builder swap mode | Swap, Swap no alternatives |
| UC-F10-04 Filter and empty closet | Builder strip region | Empty closet (hand-off to F02 and back), Permission denied (F02's) |
| UC-F10-05 | Retired: no name field, so no keyboard state | - |
| UC-F10-06 Leave with changes | Builder header, status line and Footer | Leave with changes, Error: save failed, Error: piece gone, Gone |
| UC-F10-07 Start the builder with pieces | Builder from Closet select or piece detail | Prefilled; Save pops to the caller |

## Review log

- Occasion choice: the occasion chip is now the first chip in the strip's chip row, so occasion mode opens right under its trigger and the collage never moves. The separate context row above the collage is gone, which also stops it looking like Today's context chips that push Adjust.
- Picker tile labels kept (finding asked to drop them for space). The strip region height is set by the taller Change strip mode, whose tiles need their labels for hijab reasons, so dropping picker labels frees no space and would make the two modes' Tiles differ.
- Entry naming: empty-builder entries all use `looks.new` "New look" (Looks header, Looks empty state; `architecture.md` and `design-system.md` > EmptyState updated). Entries that carry pieces keep their verbs ("Build a look" with a Closet selection, "Use in a look" on piece detail) because they say what happens to the chosen pieces; renaming the Closet bar belongs to F02 and F04.
- Empty category state deleted: the ChipRow lists only categories that have pieces, so it cannot happen.
- Contrast pairs checked by the reviewer all pass; no colour change. The ratios live in `design-system.md`; this file names only each mode's ground.
- Bottom dock: the status line sits in the pinned dock, not in the scrolling area as the finding listed. The sum on the 402x874 test phone leaves the upper area 14 pt short, and in the scrolling area that would hide Fill the rest and every error line at rest. In the dock they are always in view, next to the strip the user is working in.
- Role words: kept F08's `role.one.*` and `role.the.*` (already in `copy.md`) instead of a new "top / overdel" family. The required slot is the main role, which a top, tunic or dress fills, so "main piece / hovedplagg" is correct where "overdel" would be wrong for a dress.
- Largest text (`ax`): no scroll back to the collage after an add from far down the Rows. Auto-scrolling on each add would pull the list away from under the finger, which is worse for the same low-vision user; the placed Row shows its checkmark and the count is announced. Accepted.
- Undo row reserved in every mode, not only in swap mode: the held height is the maximum of the modes either way, so reserving it only in swap mode saves nothing. The slack sits under the tiles instead.
