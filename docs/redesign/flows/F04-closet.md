# F04 Closet

Route: `/(tabs)/closet`, tab root. Entry: Closet tab; Profile "Never worn" (filter on); the end of F02 and F03 (`dismissTo` Closet). Exit: tile -> F05; Add -> F02; select -> F06 (Start with these), F10 (New look), or stays (Mark as worn, Link as a set, Put away, Back in the closet).

## Screens

Two screens on one route. Select is an inline mode of the same screen, not a push.

The default grid leaves out put-away pieces. They show only under More > Availability > Put away.

### S1 Closet

Purpose: find a piece and open it.

Layout, top to bottom:

1. `Screen large`, title `nav.closet`. Header right: `HeaderItem` icon `plus` (`closet.addPieces`, pushes `/capture`), `HeaderItem` text `common.select`. No header left.
2. Native header search bar (`headerSearchBarOptions`, `hideWhenScrolling: true`), placeholder `closet.search`. Live filter on piece name and colour name.
3. `Banner` notice, only when present (see States, N added and Preparing). One Banner at most.
4. `ChipRow` layout `scroll`, two groups in one visual row:
   - `Chip kind="control" opens="expander"`, `chevron.down`, label `closet.more`, or `closet.moreValue` with one More filter on, or `closet.moreCount` with two or more. `accessibilityState.expanded`. Its `accessibilityLabel` always names the filters: `closet.moreValue` with the active values joined by commas ("More: Never worn, Desi" / "Mer: Aldri brukt, Desi"), so VoiceOver never reads only a number.
   - A nested View with `radiogroup`: `closet.all`, then one chip per non-empty category. Single choice, `radio`. Empty categories are not offered.
5. More body, only while open: `Expander` body inline under the ChipRow (as Today), placed after the More chip in VoiceOver order (`experimental_accessibilityOrder`). Four labelled `ChipRow`s: `closet.worn` (`closet.notWornLately`, `closet.neverWorn`), `piece.availability` (`closet.unavailable`, `closet.putAway`), `adjust.style` (`style.desi`, `style.western`), `adjust.occasion` (`occasion.*` with pieces). Each row is an optional single choice: tapping the selected chip clears it, tapping another replaces it. Chips are `button` with `accessibilityState.selected`, not `checkbox`, so VoiceOver never suggests multi-select. The row label is `header` and is also the row container's `accessibilityLabel`, so the group is named. Inside this `surface` body an unselected chip has a 1 pt `lineField` edge and a selected one a 2 pt `#9A5A52` edge (5.05 on surface, 1.59 against `lineField`), per `design-system.md` 7. Chip > Anatomy, so selected and unselected differ by more than hue and edge width. Tapping More again closes it; focus goes to the More chip.
6. `Section`, title = count of the owned pieces shown (`common.pieceCountOne` / `common.pieceCountMany`). Action `closet.clearFilters` while a search or any filter is on. Clear resets search, category and More.
7. Inside the Section: `Tile` grid, size `grid`, 2 columns (1 at `ax`). Label = piece name. `meta` only for the `piece.away.*` reason of an unavailable piece (`closet.unavailable` when it has no reason). VoiceOver `tile.label`: name, colour, marks, where marks include that meta, so "In the wash" is never visual only.
8. Sample pieces, when the closet holds any that match: a second `Section`, title `closet.sampleCountOne` / `closet.sampleCountMany`, same grid. With no owned pieces shown it is the only Section and carries Clear.
9. No Footer.

Primary action: tap a Tile (push `/piece/[id]`). The header `plus` is the way in for new pieces.

```
+---------------------------------------+
|                          [+]   Select |  HeaderItem x2
| Closet                                |  display, Georgia
| +-----------------------------------+ |
| | Q  Name or colour                 | |  native search, hides on scroll
| +-----------------------------------+ |
| +-----------------------------------+ |
| | 2 added                           | |  Banner notice (after Add pieces)
| | (Start with these)  Link as a set | |  secondary, quiet
| +-----------------------------------+ |
| (More: Never worn v) (All) (Hijabs) (>   control chip, then categories
|                                       |
| 23 pieces                Clear filters|  Section title + quiet action
|                                       |
|    [ cut-out ]        [ cut-out ]     |  Tile grid, cut-outs on canvas
|  Mauve chiffon       Ivory modal      |
|  hijab               hijab            |
|                      In the wash      |  meta, inkMuted, only when needed
|    [ cut-out ]        [ cut-out ]     |
|  ...                                  |
| 13 sample pieces                      |  second Section, sample closet
|    [ cut-out ]        [ cut-out ]     |
+---------------------------------------+
|   Today       Closet       Looks      |  native tabs
+---------------------------------------+
```

More open (inline, pushes the Section down; nothing above it moves):

```
| (More ^) (All) (Hijabs) (Tops) (Botto>
| +-----------------------------------+ |
| | Worn                              | |
| | (Not worn lately) (Never worn)    | |
| | Availability                      | |
| | (Unavailable) (Put away)          | |
| | Style                             | |
| | (Desi) (Western)                  | |
| | Occasion                          | |
| | (Everyday) (Work) (Eid) (Dinner)  | |
| +-----------------------------------+ |
```

### S2 Closet, select

Purpose: act on several pieces at once.

Entry: header `common.select`. Leaves with Cancel, or after Start with these and New look.

Layout, top to bottom:

1. `Screen large`, title `nav.closet`. Header left: `HeaderItem` text `common.cancel`. Header right: one `HeaderItem` menu, icon `ellipsis.circle`, label `common.actions`, native UIMenu, disabled until a tile is selected. Menu items in order: `looks.markWorn` (submenu `adjust.today`, `looks.yesterday`, as on a look in F09), `closet.linkSet`, `closet.putAwayAction` (`closet.backInCloset` while Availability is Put away). Focus moves to Cancel on entry, and back to Select on Cancel.
2. Search bar, `Banner` (if one was showing), `ChipRow` and More: unchanged and usable. Selection survives filtering and search, so a top from Tops and a hijab from Hijabs can be chosen together.
3. First `Section` title: the piece count until a tile is selected, then `common.selectedOne` / `common.selectedMany`, counting every selected piece in both Sections, also those hidden by search or filters. Action `closet.clearFilters` while a search or filter is on, with or without a selection; it does not clear the selection. The title block keeps its height whatever is selected.
4. `Tile` grid. Tap toggles `selected` (the blush disc with the ink checkmark). No push. A selected tile carries `accessibilityState.selected`. An unselected tile carries `accessibilityValue` `common.notSelected`, because iOS reads nothing for selected false: "Mauve chiffon hijab, mauve, Not selected, button".
5. `Footer` pair, Waiting until the first tile is selected: secondary `looks.new`, primary `pieces.startWithThese`. Stacked at `large` or when a label wraps (measured before showing). At `ax` only the primary is pinned and New look is a quiet Button at the end of the scroll content (`design-system.md` 3. Footer). Every menu result and error lands in this Footer, so one recipe covers all of them.

The grid does not move when select starts or ends: the header items swap natively, and the Footer is a flex sibling under the ScrollView that only shortens the viewport from the bottom.

Primary action: `pieces.startWithThese`.

```
+---------------------------------------+
| Cancel                          (...) |  HeaderItem text left, menu right
| Closet                                |
| (More v) (All) (Hijabs) (Tops) (Botto>
|                                       |
| 3 selected                            |  Section title
|                                       |
|    [ cut-out ](v)     [ cut-out ]     |  blush disc, ink checkmark
|  Mauve chiffon       Ivory modal      |
|  hijab               hijab            |
|    [ cut-out ](v)     [ cut-out ](v)  |
+---------------------------------------+
| ( New look )     [ Start with these ] |  Footer secondary, primary
+---------------------------------------+
|   Today       Closet       Looks      |
+---------------------------------------+
```

Menu open (native UIMenu, anchored to the header item):

```
                     +------------------+
                     | Mark as worn   > |  Today, Yesterday
                     | Link as a set    |
                     | Put away         |
                     +------------------+
```

Hand-offs:

- `pieces.startWithThese`: select mode ends, selection clears, the Today tab is shown with the pieces kept and the banner `today.banner.started` / `today.banner.startedMore` (F06, F07 session). VoiceOver focus goes to that Banner, which is not also announced. Without an everyday style, `/profile/style` is pushed first (hand-off rule 2), then Today.
- `looks.new`: select mode ends, `/look/build` pushes with the pieces in the collage (F10). Save pops back to Closet.
- Menu `looks.markWorn` > `adjust.today` or `looks.yesterday`: `woreLately`, one wear per piece dated that day. Footer `ResultBar` `outfit.worn` / `looks.wornYesterday` with `common.undo`, selection cleared. Undo removes the wears and restores the selection.
- Menu `closet.linkSet`: links the selection (`linkSet`). Footer `ResultBar` `closet.linked`, selection cleared. With one piece selected: error `error.setTooSmall`.
- Menu `closet.putAwayAction`: no alert, Undo is the safety net. If any selected piece is hidden by search or filters, search and filters clear first (one `quick` crossfade) so every piece that leaves is in view. Then the tiles leave the grid together, Footer `ResultBar` `result.putAway` with `common.undo`. Undo brings the tiles back selected (List insert).
- Menu `closet.backInCloset`: acts on the selected put-away pieces, which leave the Put away grid together. Footer `ResultBar` `result.backInCloset` with `common.undo`. Undo works as for Put away.
- Every ResultBar here is announced and focus stays on the menu item, because the cause is in the header (`design-system.md` 14 ResultBar > Focus). After Undo the Footer buttons crossfade back and focus goes to the menu item.
- A ResultBar stays until the user acts elsewhere. The next tile tap ends it and the Footer buttons return.
- Errors: the Footer error slot (`design-system.md` 3. Footer > Error), `footnote` `error` `common.error.save` or `error.setTooSmall`, announced. The Footer grows upward, so neither the grid nor the buttons move. It clears on the next press. Nothing leaves the grid.

## States

| State | Screen | What shows |
|---|---|---|
| First run, empty closet | S1 | `EmptyState` with mark (`mark.png` on `tile.png`), title `closet.firstTitle`, primary `closet.addPieces` (pushes `/capture`). Search, ChipRow, Section and the Select item are not rendered. The header `plus` stays. A Preparing Banner, if any, sits above the EmptyState |
| Sample closet | S1 | Sample tiles sit in their own Section titled `closet.sampleCountMany`, after the owned Section. No per-tile mark, no banner, no caption |
| Loading | S1 | The closet is on device and is usually ready at once. For the first `wait` only the canvas, header, search bar and More chip render. Still not ready after `wait`: `Silk` placeholder category chips, a placeholder Section title shape and 6 `Silk` placeholder tiles (real component, text hidden). One element carries `common.loading` and `accessibilityState.busy`. testID `closet-loading`, resolves to `closet-grid` |
| Default | S1 | As wireframe |
| Filtered | S1 | Section titles show the filtered counts; Clear filters on the first title line. The More chip label shows the active More filters. From Profile "Never worn": Profile pops, Closet tab on top, More reads `closet.moreValue` "More: Never worn", body closed. The count is announced after each change (Announcements) |
| Put away filter | S1, S2 | Only put-away pieces, no tile meta: the chip says what they are. In S2 the menu offers `closet.backInCloset` instead of `closet.putAwayAction` |
| No results | S1 | Sections not rendered. `EmptyState`, title `closet.noneFoundTitle`, primary `closet.clearFilters`, no mark. Clear: focus goes to the first Section title |
| N added (end of F02, F03) | S1 | `Banner` notice in place from the first frame, actions by the table below. Ends when one of its actions is used, at the next Add pieces, or at the next visit to the Closet tab |
| Linked from the Banner | S1 | The Banner action row becomes `ResultBar` `closet.linked`. It stays until the user acts elsewhere, then the Banner leaves with Inline collapse. No action returns in that place |
| Preparing (generating) | S1 | `Banner` notice `closet.preparingOne` / `closet.preparingMany`, secondary `common.open` (pushes `/capture`; VoiceOver label "Open, Add pieces", `common.open` then `closet.addPieces`). No sheen. When jobs finish the text crossfades to `closet.readyOne` / `closet.readyMany`. The Banner leaves when nothing is waiting. Survives relaunch. If an N added Banner is showing, it wins and the Preparing Banner takes its place when it leaves |
| Select, nothing selected | S2 | Footer Waiting: buttons at opacity 0, height reserved. Header menu disabled. Section title is the piece count. Clear filters shows while a filter is on |
| Select, selection | S2 | Footer shown, header menu enabled. Section title `common.selectedOne` / `common.selectedMany`. Clear filters still shows while a filter is on |
| Busy | S2 | All writes are on device. If a menu action has not finished after `wait`, the Footer primary shows `Silk` busy until its ResultBar replaces it. The grid stays enabled |
| Result | S2 | Footer ResultBar: `outfit.worn` or `looks.wornYesterday` + Undo, `closet.linked`, `result.putAway` + Undo, `result.backInCloset` + Undo |
| Error | S2 | Mark as worn, Link, Put away or Back in the closet fails: Footer error slot, `common.error.save`, announced; focus stays on the menu item. `error.setTooSmall` in the same slot. Nothing leaves the grid. The closet that cannot open at all is F01 (UC-F01-02) |
| Offline | S1, S2 | No change. Closet, search, filters and every select action are on device |
| Permission denied | n/a | Closet asks for no permission. Camera and library permission states belong to F02 |
| Large text (`large`) | S1, S2 | Select becomes `checklist`, Cancel becomes `xmark` (label in VoiceOver and the Large Content Viewer). Tile label uncapped. Banner actions stack. Section action wraps under the title. Footer pair stacks |
| Largest text (`ax`) | S1, S2 | Grid 1 column. `ChipRow` wraps instead of scrolling. Footer: only `pieces.startWithThese` pinned; `looks.new` is a quiet Button at the end of the scroll content. Lane 1 checks that the native large title "Garderobe" fits at 60 pt Georgia on a 375 pt wide phone, with Bold Text on (Georgia-Bold about 332 pt of 343) |
| Bokmål | S1, S2 | Garderobe, Mer, Alle, Brukt, Ikke brukt nylig, Aldri brukt, Fjern filtre, Start med disse, Ny look, Merk som brukt, Koble som sett, Legg bort, Tilbake i garderoben. Every label wraps. The Footer pair is measured before showing and stacks when either label wraps. Menu items are native and wrap on their own |
| Reduce Motion | S1, S2 | Fallbacks in Motion below |

N added Banner actions (two at most, first secondary, second quiet). `closet.addedOne` replaces `closet.addedMany` for one piece:

| Condition | Text | Secondary | Quiet |
|---|---|---|---|
| Can make an outfit | `closet.addedMany` | `pieces.startWithThese` | `closet.linkSet` when all came from one photo and are not yet a set, else `looks.new` |
| Roles missing | `closet.missingRoles` | `looks.new` | `closet.linkSet` when all came from one photo and are not yet a set, else none |

Banner actions act on the added pieces. Tiles carry no New mark.

## Motion

| Moment | Motion (`motion.md`) | Reduce Motion |
|---|---|---|
| Tab switch to Closet, or from Start with these to Today | Tab switch: none, instant. Today then plays its own Generating moment | Same |
| Grid loading | Ready within `wait`: the grid paints in its first frame, no fade. Still not ready: placeholders fade in (`base`, `silk`); band after a further `wait`, one shared clock across all tiles (`sheen`, `carry`), repeats after `wait` until `loop`, then stands still at the centre (search and header stay usable); resolve `base`, `silk`, band out `quick` | Placeholders still; content fades in `base` |
| Late photo in a tile | Push and pop rule for late images: fade in `base`, `silk` | Fade `base` |
| Open a piece, back | Push and pop: native. Scroll position kept | System |
| Arrive after Add pieces | Pop to a tab after a flow: Banner already in place, no expand. The new tiles fade in together (List insert, `base`, `silk`, no stagger). VoiceOver focus moves to the Banner | Same fade (`base`) |
| Preparing Banner | No sheen. Count change: Banners and bars label crossfade (`quick` out, `base` in). Taking the N added Banner's place: content crossfade (`quick` out, `base` in), height eases (`settle`, `silk`), no collapse and expand. Leaving: Inline collapse | Label crossfade `base`; taking the place: crossfade `base`, layout in one frame; leaving: collapse in one frame after the fade |
| Search | The filtered grid and the count swap in one frame under one `quick` crossfade. No reflow travel, no stagger | Same |
| Category chip, More chip, Clear | Tiles that leave: List remove (`quick`, `release`); the rest reflow (`settle`, `silk`); tiles that arrive: List insert (`base`, `silk`, `step`, max 6). Chip fill: Selection (`quick`, `silk`). Count title: label crossfade | Fades `base`, layout in one frame, no stagger |
| More chip label changes ("More" to "More: Never worn") | Label crossfade (`quick` out, `base` in); chip width eases (`settle`, `silk`) and the category chips after it glide with it | Label crossfade `base`, width in one frame |
| Grid to No results and back | The grid and the EmptyState crossfade in place (`quick` out, `base` in) | Crossfade `base` |
| More open and close | Inline expand and collapse (`settle`, `silk`, content after `step`), chevron rotate (`settle`, `silk`), scroll follows on the UI thread | Layout in one frame, content fades `base`, chevron in one frame, `scrollTo` not animated |
| Enter and leave select | Native header items swap. The Footer is laid out Waiting (opacity 0) as a flex sibling. The grid does not move | Same |
| First tile selected | Footer buttons fade in place (`base`, `silk`), no height change. Header menu enables (system). Section title: label crossfade | Same fade |
| Tile select and deselect | Selection: blush disc crossfades in `quick`, `silk`. Press: `press`. No haptic | Same |
| Last tile deselected | Footer buttons fade out in place (`quick`, `release`), height held. Header menu disables (system) | Fade `base` |
| Mark as worn, Link, Back in the closet | Native menu closes. ResultBar crossfades in place of the Footer buttons (out `quick`, `release`; in `base`, `silk`); text announced, focus stays on the menu item | Crossfade `base` |
| Put away | Filters clear first when needed (`quick` crossfade). List remove of all selected tiles at once, then reflow (`settle`, `silk`); ResultBar as above. Undo plays List insert back (`base`, `silk`, all at once), tiles selected | Fade out `base`, layout in one frame. Undo: fade in `base`, all at once, layout in one frame |
| ResultBar ends (next tile tap) | Footer buttons crossfade back (`quick` out, `base` in) | Crossfade `base` |
| Error | Footer error slot (`design-system.md` 3. Footer > Error): text fades in (`base`, `silk`), Footer grows upward, grid and buttons do not move | Fade `base`, layout in one frame |
| Banner Link as a set | ResultBar crossfades in place of the Banner action row. When the user acts elsewhere the Banner leaves with Inline collapse | Crossfade `base`; then collapse in one frame after a `base` fade |
| Banner leaves | Inline collapse; focus to the next sibling (the More chip) | Fade `base`, layout in one frame |

Haptics: none in this flow. Magic moment here: none (a local read is not a moment). testIDs: `closet-loading` -> `closet-grid`.

## Copy

All keys exist in `copy.md` > F04 Closet. Added there by this flow: `closet.worn`, `closet.moreValue`, `closet.moreCount`, `closet.sampleCountOne`, `closet.sampleCountMany`, `common.notSelected`, `common.actions`, `result.backInCloset`. Reused from F09: `adjust.today`, `looks.yesterday`, `outfit.worn`, `looks.wornYesterday`. Cut there by this flow: `closet.inSet`, `closet.new`, `closet.ownedNow`, `closet.putAwayTitleMany`, `closet.searchLabel`, `result.markedWorn`, and `closet.available` from Closet (F05 keeps it).

| Where | Keys |
|---|---|
| Title, tab | `nav.closet` |
| Header | `closet.addPieces` (VoiceOver on `plus`), `common.select`, `common.cancel`, `common.actions` (VoiceOver on `ellipsis.circle`) |
| Search | `closet.search` |
| Chip row | `closet.more`, `closet.moreValue`, `closet.moreCount`, `closet.all`, `category.*` |
| More | `closet.worn`, `closet.notWornLately`, `closet.neverWorn`, `piece.availability`, `closet.unavailable`, `closet.putAway`, `adjust.style`, `style.desi`, `style.western`, `adjust.occasion`, `occasion.*` |
| Section | `common.pieceCountOne`, `common.pieceCountMany`, `closet.sampleCountOne`, `closet.sampleCountMany`, `common.selectedOne`, `common.selectedMany`, `closet.clearFilters` |
| Tile | `tile.label` "{name}, {colour}, {marks}" (VoiceOver), meta `piece.away.*` or `closet.unavailable`, `common.notSelected` (S2 value) |
| Empty | `closet.firstTitle`, `closet.addPieces`, `closet.noneFoundTitle`, `closet.clearFilters` |
| Loading | `common.loading` |
| Banners | `closet.addedOne`, `closet.addedMany`, `closet.missingRoles` (`role.mainList`, `role.bottomList`, `role.shoesList`, `role.hijabList`, `word.and`), `closet.preparingOne`, `closet.preparingMany`, `closet.readyOne`, `closet.readyMany`, `common.open` |
| Select menu | `looks.markWorn`, `adjust.today`, `looks.yesterday`, `closet.linkSet`, `closet.putAwayAction`, `closet.backInCloset` |
| Select Footer | `looks.new`, `pieces.startWithThese` |
| Results | `outfit.worn`, `looks.wornYesterday`, `closet.linked`, `result.putAway`, `result.backInCloset`, `common.undo` |
| Errors | `common.error.save`, `error.setTooSmall` |

Announcements, all `{ queue: true }`, never on first mount:

- `closet.addedOne` / `closet.addedMany` once after the batch settles (focus moves to the Banner instead when arriving from capture).
- `closet.readyOne` / `closet.readyMany` when the Preparing Banner text changes.
- After search, a chip or Clear settles (a typing pause of `wait`), the count of pieces shown, `common.pieceCountOne` / `common.pieceCountMany`, or `closet.noneFoundTitle` when nothing matches. Last value only, once per settle, so a More choice that replaces another in the same row is announced once. Not when focus moves to the Section title (Clear), and not when the filter arrives with a hand-off (Profile "Never worn").
- S2: the Footer primary is not announced when it becomes usable. The tile's selected state is the feedback, and the Section title carries the count.
- ResultBar texts once; errors once.

## Use cases

| ID | Screen | States covered |
|---|---|---|
| UC-F04-01 Start an empty closet | S1 | First run, empty closet; large text; bokmål |
| UC-F04-02 Browse the closet | S1 | Loading (placeholders only after `wait`), sample closet (own Section), default |
| UC-F04-03 Find a piece by name or colour | S1 | Native header search, filtered, count announced, no results ("No pieces found", "Clear filters") |
| UC-F04-04 Filter the closet | S1 | Category chips (non-empty only), More > Worn, Availability, Style, Occasion; Clear filters; no results; large text; bokmål |
| UC-F04-05 Link pieces as a set | S2 | Select, selection, header menu Link as a set, result `closet.linked`, error, `error.setTooSmall`; Cancel |
| UC-F04-06 Style today from a selection | S2 -> F06 | `pieces.startWithThese`, select ends, selection cleared; Your style first when none exists |
| UC-F04-07 Build a look from a selection | S2 -> F10 | Footer `looks.new` pushes the builder with the pieces |
| UC-F04-08 See pending photos from the closet | S1 | Preparing Banner, ready count, leaves when nothing waits; `common.open` pushes Add pieces |
| UC-F04-09 Open a piece | S1 -> F05 | Default, push and back keep the scroll position |
| UC-F04-10 Put pieces away and bring them back | S2 | No alert, filters clear first when a selected piece is hidden, tiles leave together, Undo restores them selected; More > Put away, Back in the closet in bulk |
| UC-F04-11 Never worn from Profile | S1 | Filtered ("More: Never worn", count as title), Clear filters; tile -> F05 "Start with this piece" |
| UC-F04-12 Tell the app what I wear most | S2 | Select, header menu Mark as worn > Today or Yesterday; `outfit.worn` / `looks.wornYesterday` with Undo |
| UC-F02-14 Add ready pieces and land in the closet | S1 | N added Banner (two actions), Link as a set, Start with these, new tiles fade in together |
| UC-F02-15 Leave while photos prepare | S1 | Preparing Banner, survives relaunch |
| UC-F02-21 My clothes take over | S1 | N added Banner rows with `closet.missingRoles` |
| UC-F12-01, -02, -03, -04, -06, -07 | S1, S2 | Empty, large and largest text, bokmål, offline (no change), Reduce Motion, VoiceOver order: header (Cancel, menu), search, Banner, ChipRow (More body after the More chip), Section title, grid, sample Section, Footer last |

## Review log

- Select actions. Select keeps one place for actions on the selection: Footer pair (secondary `looks.new`, primary `pieces.startWithThese`) for the two next steps, and one native header menu (`ellipsis.circle`) for the record-keeping actions (Mark as worn, Link as a set, Put away or Back in the closet). The in-content quiet row is cut: it reserved up to 130 pt of blank space in bokmål and at `large`, about 400 pt at `ax`, and jumped the grid on entering select. Every result and error now lands in the Footer, so one recipe covers them. `design-system.md` 2. HeaderItem gains the `menu` prop for this one use, and `F12-app-wide-checks.md` Tab root now lists the Closet select Footer.
- Mark as worn offers Today and Yesterday, the same choice as on a look (F09), so one label behaves the same everywhere. Its results reuse `outfit.worn` / `looks.wornYesterday`; `result.markedWorn` is cut.
- N added Banner no longer offers Mark as worn: the button marked nothing and put a chore ahead of the next step. The first owned add uses the same rows as a later add. UC-F04-12 starts from Select in `use-cases.md`.
- Put away and Availability. The default grid leaves out put-away pieces, so the `closet.putAway` tile meta and the `closet.available` filter added nothing and are cut. `copy.md` `tile.label` drops `closet.putAway` from `{marks}`.
- Selection across filters is kept (a top and a hijab from two categories is the main reason to select). Put away clears search and filters first when a selected piece is hidden, so nothing leaves unseen.
- Clear filters stays in select while a filter is on. It does not touch the selection, and removing it moved the grid under the finger at `large`.
- Errors use the Footer error slot from `design-system.md` 3. Footer rather than text in the ResultBar slot: the Footer grows upward, so the grid and buttons do not move, and it is the slot every Footer error already uses.
- More rows are `button` with `selected`, not `checkbox`, because each row is a single optional choice.
- Lane 1 VoiceOver check: `experimental_accessibilityOrder` puts the More body between the More chip and the category chips, across the horizontal ScrollView, on RN 0.86. Fallback if it fails: the More chip is a fixed leading sibling outside the ScrollView, the body renders directly after the chip row container, and focus moves into the body on open.
- Tile label. `closet.sample` and `closet.inSet` are not added to `{marks}`: neither is drawn on a tile any more, the label carries only what the tile shows, and "sample" is in the Section header VoiceOver reads before the tiles.
- Sample closet as its own Section, not one title over a mixed grid: owned and sample pieces live side by side until the user drops the samples, and one count title could not say which tiles are samples.
- Search is the native header search bar (UC-F04-03), not a `Field`: one band less above the grid. `design-system.md` Field no longer lists Closet search.
- Put away has no alert here. F05 single-piece Put away should match (UC-F05-05 still says it confirms); that is F05's change.
- Loading is no longer a magic moment: the closet is a local read, so placeholders show only after `wait`. testID `moment-loading` becomes `closet-loading`.
- `architecture.md` still uses the old words and rules in these lines, for the architect to update in one pass; this flow and `use-cases.md` win: line 35 (terms "Worn lately", "Style today"), line 87 ("Style today", "Build a look", "Link as set" bar), line 88 ("Not worn lately" first-row chip), line 89 ("Worn lately", "Back in my closet" in the select footer), line 99 (footer "Link as set", "Build a look", "Style today"), line 100 (pending row with shimmer; F04 has no sheen), line 137 (blush "New" mark, which does not exist), line 139 ("Worn lately", "Style today"), line 152 ("Style today"), line 154 ("Worn lately").
- Contrast. Fixed: inside the More body (`surface`) the unselected choice chip edge `lineField` (3.18) was within 1.04:1 of the selected `blushStrong` edge (3.06), with fills only 1.63:1 apart, so selected differed by hue and 1 pt of width. `design-system.md` 7. Chip > Anatomy now draws the selected edge inside `surface` in `#9A5A52` (5.05 on surface, 1.59 against `lineField`); F04 follows it rather than the `line` edge the review proposed, so one recipe holds for every Expander body. Every other pair passes as computed.
