# F04 Closet

Route: `/(tabs)/closet`, tab root. Entry: Closet tab; Profile "Never worn" (Worn: Never worn); completeness chip `quick.details` (Coverage: Needs details); calendar Variety (Worn: Not worn lately, F09); the end of F02 and F03 (`dismissTo` Closet). Exit: tile -> F05; header `plus` or the progress card -> F02; select -> F06 (Start with these), F10 (New look), or stays (Mark as worn, Link as a set, Put away, Back in the closet).

Domain (`architecture.md` > Domain touches). New: `groupByCategory`; `filterPieces` over a `ClosetFilter` with `colour`, `coverage` (`PieceCoverage | "needs-details" | null`, one field, so the domain cannot hold a combination the panel forbids), `season`, `wear` (`never-worn` or `not-worn-lately`) and `availability` (`away` or `archived`); `pieceCoverage` and `needsDetails`, which read `sleeveEvidence`, `hemEvidence` and `opacity` in `src/domain/coverage.ts`; `captureProgress`, over the job queue that `useImportRunner` in `src/state/imports.ts` already runs; `woreLately`, `hasAnyWear`, `missingRoles`. Existing: `linkSet` (`src/domain/sets.ts`), `isAvailable` and `setAway` (`src/domain/closet.ts`), `setArchived` (`src/domain/wardrobe.ts`). Today `src/domain/closetFilters.ts` has only category, style, occasion and availability (`available`, `away`).

## Screens

Two screens on one route. Select is an inline mode of the same screen, not a push. The wear calendar is not here: it lives under Looks (`/looks/calendar`, F09), and its Variety row is one of this flow's entries.

The default grid leaves out put-away pieces. They show only under More > Availability > Put away.

### S1 Closet

Purpose: find a piece and open it.

Layout, top to bottom (`design-system.md` > Screen recipes > Closet):

1. `Screen large`, title `nav.closet`. Header right: `HeaderItem` icon `plus` (`closet.addPieces`, pushes `/capture`), then `HeaderItem` text `common.select`. No header left. No tab badge.
2. Native header search bar (`headerSearchBarOptions`, `hideWhenScrolling: true`), placeholder `closet.search`. Live filter on piece name and colour name.
3. Filter row, at every text size: More, fixed on the leading `gutter`, then a horizontal `ChipRow` `scroll` of the categories, running to the screen edge. Never reordered, no chip changes width, no chip appears or leaves when a filter changes.
   - More: `Chip kind="control" opens="expander"`, `chevron.down`, label always `closet.more`. It sits outside the ScrollView, so it never scrolls away. While any panel filter is set it takes the selected recipe (`blush` fill, `blushStrong` edge, chevron in `ink`, on the blush list in `design-system.md` 1), so a set filter shows with the panel closed. `accessibilityValue`: the set filters joined with `new Intl.ListFormat(locale, { type: "unit", style: "short" })` ("Never worn, Winter", no "and"); `accessibilityState.expanded`.
   - The ScrollView holds a `radiogroup` View: `closet.all`, then one `category.*` chip per category with at least one piece in the closet (owned or sample, put away included), computed from the whole closet, never from the filtered result. Taxonomy order. Single choice, `radio`. The `radiogroup` View is never `accessible`, so its chips stay reachable. A category chip shows that Section only.
   - Each chip sets `maxWidth` in points to the ScrollView's measured width, never `"100%"` (which resolves against the unbounded content width), so a long label wraps inside its capsule at `ax`.
4. Panel, only while open: `Expander headless` directly under the filter row, full content width, after the last category chip in reading order, as on screen. Opening keeps focus on More, which reads "expanded". Groups, in this order, each one line: its `headline` label (own text element, `accessibilityRole="header"`) in a leading column as wide as the widest label (measured in the hidden layer), then its chips in a `ChipRow` `scroll` running to the panel's trailing edge. At `large` and `ax` each label sits over its chip line. The ChipRow container is never `accessible`:
   - `fact.colour`: one `choice` chip per named colour (`colour.*`) that any piece in the closet has. Below `large` the chip is round and holds only its `swatch`, label in VoiceOver; the name is drawn at `large` and up, under Increase Contrast and under Differentiate Without Color (`AccessibilityInfo` `isDifferentiateWithoutColorEnabled`) (`design-system.md` > Review log > Swatch names).
   - `coverage.levelLabel`: `pieceCoverage.full`, `pieceCoverage.moderate`, `pieceCoverage.layer`, `piece.needsDetails`. Hijabs, shoes, bags and accessories are in none of them.
   - `fact.season`: `value.season.*` (Summer, Winter, All year).
   - `closet.worn`: `closet.notWornLately` (no wear in 30 days, never worn included), `closet.neverWorn`.
   - `piece.availability`: `closet.unavailable`, `closet.putAway`.
   - `adjust.style`: `style.desi`, `style.western`.
   - `adjust.occasion`: `occasion.*` that any piece in the closet has.
   - Each group is an optional single choice: tapping the selected chip clears it, tapping another replaces it. Chips are `button` with `accessibilityState.selected`, never `radio` or `checkbox`, and carry no hint. Chips use the `surface` recipe (`design-system.md` 7 > Anatomy). Results apply at once, no Apply.
   - Under the groups, `Button quiet small` `closet.clearFilters`, leading. Its row is reserved from the first frame and the Button is rendered only while a search or any filter is set. Clear resets search, category and the panel. Focus then goes to More, whose value is now empty. At `ax`, where More is above the viewport, the page moves there without animation, a move she caused.
   - Height budget, default size, 390 x 844, no Banner: header with search about 195 pt, filter row 60, panel 440 (seven 44 pt lines, the Clear row, padding), so the first Section title sits at about 733 pt and the top of the first tile row at about 741 pt, above the tab bar at 761. UC-F04-04 checks it.
5. One Banner slot, at most one of:
   - Progress card: `Banner tone="progress"` while the capture queue holds jobs. One `button` with a trailing `chevron.right`, pushes `/capture`, no hint. Sentence `progress.newOne` / `progress.newMany`; when no job prepares, `progress.readyOne` / `progress.readyMany` joined with `progress.confirmOne` / `progress.confirmMany` and `capture.failedOne` / `capture.failedMany` (", ", a part with 0 left out). `Silk progress` line. Meta: one `closet.section` per category of the ready pieces, full category name. Below `large` it is one line joined with " · " ("Hijabs & scarves 3 · Tops 1"), and the groups that do not fit become `progress.moreGroups`. At `large` and `ax` it wraps, one group per line, nothing hidden. VoiceOver reads every group at every size. It sits here whatever filter is set.
   - "N added" `Banner tone="notice"` (States, N added). The two never share a frame: the Banner shows only when Add pieces left nothing in the queue; with Confirm tiles left, the slot holds the progress card alone (F02 States, Added, tiles left).
6. Owned pieces: one `Section` per non-empty category, `title` `category.*`, `count` the pieces shown in it ("Tops 14", read `closet.sectionLabel`). Hijabs in tone order (same order as the Change strip), other sections by date added, newest first.
7. Inside each Section: `Tile` grid, size `grid`, 2 columns (1 at `ax`). Label = piece name. The needs-an-answer dot before the label on an owned piece with `needsDetails` open, never on a hijab, shoes, bag or accessory. `meta` only for the `piece.away.*` reason of an unavailable piece (`closet.unavailable` when it has no reason). VoiceOver `tile.label`: name, colour, marks; marks include the meta and `piece.needsDetails`, so neither is visual only.
8. Sample pieces, when the closet holds any that match: one more `Section` after the owned ones, `closet.section` with `closet.samples` and the same muted count ("Samples 13", "Eksempler 13"), read `closet.sectionLabel`. Same grid, ordered by category. No dot on sample tiles.
9. No Footer.

Primary action: tap a Tile (push `/piece/[id]`). The header `plus` is the way in for new pieces.

```
+---------------------------------------+
|                          [+]   Select |  HeaderItem x2
| Closet                                |  display, Georgia
| +-----------------------------------+ |
| | Q  Name or colour                 | |  native search, hides on scroll
| +-----------------------------------+ |
| (More v) (All) (Hijabs & scarves) (To>   More fixed, categories scroll
| +-----------------------------------+ |
| | 6 new pieces, 4 of 6 ready      > | |  progress card, one button
| | ====================------------  | |  Silk progress line
| | Hijabs & scarves 3 · Tops 1       | |  meta, inkMuted
| +-----------------------------------+ |
|                                       |
| Hijabs & scarves 31                   |  Section, count in inkMuted
|    [ cut-out ]        [ cut-out ]     |  tone order
|  Blush chiffon       Mauve modal      |
|  hijab               hijab            |
|                      In the wash      |  meta, only when needed
|  ...                                  |
| Tops 14                               |
|    [ cut-out ]        [ cut-out ]     |
|  * Ivory blouse      Plum shirt       |  * = needs-an-answer dot
|  ...                                  |
| Samples 13                            |  sample Section, last
|    [ cut-out ]        [ cut-out ]     |
+---------------------------------------+
|   Today       Closet       Looks      |  native tabs
+---------------------------------------+
```

More open (inline, pushes the Banner slot and the grid down; nothing above it moves):

```
| (More ^) (All) (Hijabs & scarves) (To>
| +-----------------------------------+ |
| | Colour       (o) (o) (o) (o) (o) (>  swatch only below large, scrolls
| | Coverage     (Fully covered) (Mod>|  one line per group, scrolls
| | Season       (Summer) (Winter) (A>|
| | Worn         (Not worn lately) (N>|
| | Availability (Unavailable) (Put a>|
| | Style        (Desi) (Western)     |
| | Occasion     (Everyday) (Work) (E>|
| | Clear filters                     | |  reserved row, shown while a filter is set
| +-----------------------------------+ |
| Hijabs & scarves 31                   |  in view at default size
|    [ cut-out ]        [ cut-out ]     |
```

### S2 Closet, select

Purpose: act on several pieces at once.

Entry: header `common.select`; the "N added" Banner action `closet.markWearMost`. Leaves with Cancel, or after Start with these and New look.

Layout, top to bottom. Nothing is inserted into the scroll content, so the grid never moves on enter or leave:

1. `Screen large`, title `common.selectedOne` / `common.selectedMany` in place of `nav.closet`, counting every selected piece, also those hidden by search or filters ("0 selected" before the first tap), as iOS Photos. Header right: `HeaderItem` text `common.cancel` in Select's place; `plus` is not rendered. No header left, no header menu. Entering from Select, focus moves to Cancel, in the same spot; on Cancel, back to Select.
2. Search bar, filter row, panel and the Banner slot: unchanged and usable. Selection survives filtering and search, so a top from Tops and a hijab from Hijabs & scarves can be chosen together. Entering select by any route ends an "N added" Banner (States, N added), so only the progress card can hold the slot in S2.
3. Category Sections and the sample Section as in S1. Tap toggles `selected` (the `blush` disc with the `ink` checkmark). No push. A selected tile carries `accessibilityState.selected`; an unselected one `accessibilityValue` `common.notSelected`, because iOS reads nothing for selected false.
4. `Footer`, pinned, two rows, rendered in place from entry and disabled until the first tile is selected (Button > Disabled: `inkDisabled` label, not pressable, `accessibilityState.disabled`):
   - Action row: `Button quiet small` `looks.markWorn` (`accessibilityState.expanded`), `closet.linkSet`, `closet.putAwayAction` (or `closet.backInCloset` in its place while Availability is Put away). One line at every size, a horizontal scroll from the leading `gutter` to the screen edge, each Button's label wrapping inside a `maxWidth` of the Footer's inner width. Its `minHeight` is measured in the hidden layer at the current size and language, and the ResultBar, the error and the Mark as worn chips take this row's place at that height.
   - Pair: secondary `looks.new`, primary `pieces.startWithThese`. Side by side, stacked at `large` or when a label wraps (measured before showing).
   - At `ax` the Footer keeps the action row and the primary pinned, and `looks.new` becomes the last quiet Button of the action row, disabled until the first tile like the rest (a named exception to `design-system.md` 3, where the secondary moves to the end of the scroll content: here that end is a 1-column grid of every piece). The Footer is about 200 pt at AX5.
5. Mark as worn: `looks.markWorn` opens two `action` chips `adjust.today` and `looks.yesterday`, which crossfade into the action row in place of the Buttons after it; Mark as worn keeps its place, first in the row, and the row scrolls back to its start. Pressing Mark as worn again closes them. The same chips and results as look detail (F09).

Primary action: `pieces.startWithThese`.

```
+---------------------------------------+
|                               Cancel  |  in Select's place, plus hidden
| 3 selected                            |  title, every selected piece
| +-----------------------------------+ |
| | Q  Name or colour                 | |
| +-----------------------------------+ |
| (More v) (All) (Hijabs & scarves) (To>
|                                       |
| Hijabs & scarves 31                   |
|    [ cut-out ](v)     [ cut-out ]     |  blush disc, ink checkmark
|  Blush chiffon       Mauve modal      |
|  hijab               hijab            |
| Tops 14                               |
|    [ cut-out ](v)     [ cut-out ](v)  |
+---------------------------------------+
| Mark as worn  Link as a set  Put aw>  |  action row, one line, scrolls
| ( New look )     [ Start with these ] |  pair; all disabled at 0 selected
+---------------------------------------+
|   Today       Closet       Looks      |
+---------------------------------------+
```

Mark as worn open, then a result:

```
| Mark as worn ^  (Today) (Yesterday)   |  action chips in place of the Buttons after it
| ( New look )     [ Start with these ] |

| v Worn today                     Undo |  ResultBar in the action row's place
| ( New look )     [ Start with these ] |  disabled, selection cleared
```

Hand-offs:

- `pieces.startWithThese`: select mode ends, selection clears, the Today tab is shown with the pieces kept and the banner `today.banner.started` (F06, F07 session). VoiceOver focus goes to that Banner, which is not also announced. Without an everyday style, `/profile/style` is pushed first (hand-off rule 2), then Today.
- `looks.new`: select mode ends, `/look/build` pushes with the pieces in the collage (F10). Save pops back to Closet.
- What each action takes: Start with these and New look take owned and sample pieces and leave put-away pieces out, as the stylist does; the pair stays disabled while only put-away pieces are selected. Mark as worn, Link as a set, Put away and Back in the closet take owned pieces only; the action row stays disabled while only sample pieces are selected.
- `looks.markWorn` > `adjust.today` or `looks.yesterday`: `woreLately`, one wear per selected owned piece dated that day, nothing learned as an outfit. The selection clears and `ResultBar` `outfit.worn` / `looks.wornYesterday` with `common.undo` takes the action row's place. Undo removes the wears and restores the selection. The wear reaches the wear filters, Profile, Rediscover, the calendar's Variety and the stylist at once (hand-off rule 4); it draws no calendar day, which holds outfits (F09).
- `closet.linkSet`: `linkSet` on the selection, `ResultBar` `closet.linked` in the action row's place, selection cleared. One piece selected: `error.setTooSmall` in the action row's place (States, Error).
- `closet.putAwayAction`: no alert, Undo is the safety net. Acts on every selected piece, also those hidden by search or filters; search and filters never change. The visible selected tiles leave together (Filter result), `ResultBar` `result.putAway` counts every piece, with `common.undo`. Undo brings the pieces back selected.
- `closet.backInCloset`: acts on the selected put-away pieces, which leave the Put away grid together. `ResultBar` `result.backInCloset` with `common.undo`. Undo works as for Put away.
- Every ResultBar here replaces the row she pressed, so VoiceOver focus moves to its text and it is not announced (`design-system.md` 14 > Focus). After Undo the action row crossfades back and focus returns to the Button that was pressed.
- A ResultBar in S2 stays until the next tile tap, which ends it and brings the action row back.

## States

| State | Screen | What shows |
|---|---|---|
| First run, empty closet | S1 | `EmptyState` with mark (`mark.png` on `tile.png`), title `closet.firstTitle`, primary `closet.addPieces` (pushes `/capture`). Search, filter row, Sections and the Select item are not rendered. The header `plus` stays. With photos preparing, the progress card alone is the first block, no EmptyState (F12 E) |
| Sample closet | S1 | Sample tiles in their own Section "Samples 13", after the owned Sections. With no owned pieces it is the only Section. No per-tile mark, no Banner |
| Loading | S1 | The closet is on device and is usually ready at once. For the first `wait` only the canvas, header, search bar and More chip render. Still not ready after `wait`: `Silk` placeholder chips, one placeholder Section title shape and 6 placeholder tiles (real component, text hidden). One element carries `common.loading` and `accessibilityState.busy`. testID `closet-loading`, resolves to `closet-grid` |
| Default | S1 | Category Sections with counts, as wireframe |
| Category chosen | S1 | Only that category's Section (and the matching sample pieces). All shows every Section |
| Filtered | S1 | Sections and counts show only what matches; empty Sections are not rendered. More takes the selected recipe while a panel filter is set. The result is announced after each change (Announcements) |
| Arrival with a filter | S1 | Profile "Never worn": Profile pops, Closet tab on top, Worn: Never worn. Completeness `quick.details`: Coverage: Needs details. Calendar Variety: Worn: Not worn lately; the calendar stays on the Looks stack. The panel is open in the first frame (no expand motion, nothing moves later), so the selected chip and Clear filters are in view, and More takes the selected recipe. The arriving filter replaces any search and filters, select mode ends. VoiceOver focus goes to More ("More, Never worn, expanded"); nothing is announced |
| Put away filter | S1, S2 | Only put-away pieces, no tile meta and no VoiceOver mark: the selected chip and More's value say what they are. In S2 the action row offers `closet.backInCloset` in place of `closet.putAwayAction` |
| Needs details filter | S1 | Owned pieces with open coverage facts. Back from a piece whose facts are now set: its tile has left (Filter result) and the count drops. The last one set: No results |
| No results | S1 | Sections not rendered. `EmptyState`, title `closet.noneFoundTitle`, no mark, under the filter row and panel so the chips that caused it stay in view. With the panel closed it has `Button secondary` `closet.clearFilters`; with the panel open it has no button, because the panel's Clear filters sits directly above it. Clear: focus goes to More |
| Background tagging | S1 | Progress card in the Banner slot: `progress.new*` with the line counting up, the meta grouping ready pieces by category. Done: `progress.ready*` (with `progress.confirm*` and `capture.failed*`), line full. Tap anywhere on it pushes `/capture`. Survives relaunch. `moment-generating` while a job runs, resolving to the done card |
| N added (end of F02, F03) | S1 | `Banner` notice in place from the first frame, actions by the table below. Ends when one of its actions is used, when select starts (by any route), at the next Add pieces, or at the next visit to the Closet tab |
| Linked from the Banner | S1 | The Banner action row becomes `ResultBar` `closet.linked`. It stays while Closet is focused. The Banner leaves when Closet is not focused (a push to a piece, a tab change), or when select starts; on return it is gone |
| Mark what I wear most | S1 -> S2 | The Banner's action enters select mode with nothing selected; the Banner leaves (Banner leaves, Motion) and focus goes to the first Section title. The offer returns on every later "N added" Banner until a wear exists (`hasAnyWear`) |
| Select, nothing selected | S2 | Title "0 selected". Action row and pair in place, disabled |
| Select, selection | S2 | Action row and pair enabled. Title `common.selectedOne` / `common.selectedMany` |
| Mark as worn open | S2 | Today and Yesterday action chips in the action row after Mark as worn. Close on a second press of Mark as worn, when the last tile is deselected, on Cancel, or after a pick |
| Busy | S2 | All writes are on device. If one has not finished after `wait`, the pressed quiet Button shows `Silk` busy until its ResultBar replaces the row. The grid stays enabled |
| Result | S2 | ResultBar in the action row's place: `outfit.worn` or `looks.wornYesterday` + Undo, `closet.linked`, `result.putAway` + Undo, `result.backInCloset` + Undo |
| Error | S2 | Mark as worn, Link, Put away or Back in the closet fails: `common.error.save` in the action row's place, `footnote` `error`, same crossfade as a ResultBar, focus to its text. `error.setTooSmall` the same way. The action row returns on the next tile tap. Nothing leaves the grid and the grid does not move. The closet that cannot open at all is F01 (UC-F01-02) |
| Offline | S1, S2 | No change. Closet, search, filters, the progress card and every select action are on device |
| Permission denied | n/a | Closet asks for no permission. Camera and library permission states belong to F02 |
| Large text (`large`) | S1, S2 | Select becomes `checklist`, Cancel becomes `xmark` (label in VoiceOver and the Large Content Viewer). Tile label uncapped. Panel labels sit over their chip lines; Colour chips show their names. Progress meta one group per line. Banner actions stack. Footer pair stacks; the action row stays one scroll line |
| Largest text (`ax`) | S1, S2 | Grid 1 column. Two named exceptions to `design-system.md` 7, where `ChipRow scroll` becomes `wrap`: the filter row (a wrapped row of up to 11 chips is about 800 pt tall and pushes the first Section off screen) and each panel group's chip line. Chips wrap their labels inside their point `maxWidth`, and every chip stays reachable by swipe and VoiceOver. The panel opens directly under the row and the scroll brings its first group into view. Progress meta one group per line. Footer: action row and `pieces.startWithThese` pinned, `looks.new` last in the action row (S2 item 4). Lane 1 checks that the native large title "Garderobe" fits at 60 pt Georgia on a 375 pt wide phone with Bold Text on |
| Bokmål | S1, S2 | Garderobe, Mer, Alle, Farge, Dekning, Helt dekket, Moderat, Trenger et lag, Mangler detaljer, Sesong, Sommer, Vinter, Hele året, Brukt, Ikke brukt nylig, Aldri brukt, Tilgjengelighet, Utilgjengelig, Lagt bort, Stil, Desi, Vestlig, Anledning, Fjern filtre, Fant ingen plagg, plagg funnet, Eksempler, klare til å legge til, Ikke valgt, Start med disse, Ny look, Merk som brukt, Koble som sett, Legg bort, Tilbake i garderoben, Merk det jeg bruker mest. Every label wraps. The action row height and the Footer pair are measured before showing. Soft-hyphen check (`copy.md` > Rules, F12 B): Tilgjengelighet, Utilgjengelig, and in English Availability (`headline`, about 400 pt at AX5) and Unavailable (about 324 pt in a chip with about 279 pt free) |
| Reduce Motion | S1, S2 | Fallbacks in Motion below |

N added Banner actions: two at most, first `secondary`, second `quiet`. `closet.addedOne` replaces `closet.addedMany` for one piece. Precedence list: `closet.linkSet` (every added piece from one photo and not yet a set), then `closet.markWearMost` (no owned piece has a wear), then `looks.new`.

| Condition | Text | Secondary | Quiet |
|---|---|---|---|
| Can make an outfit | `closet.addedMany` | `pieces.startWithThese` | first of the precedence list that applies |
| Roles missing (`missingRoles`) | `closet.missingRoles` | first of the precedence list that applies | the next one that applies |

Banner actions act on the added pieces; `closet.markWearMost` opens select with nothing selected, because her favourites are not only the new pieces. Tiles carry no New mark.

## Motion

| Moment | Motion (`motion.md`) | Reduce Motion |
|---|---|---|
| Tab switch to Closet, or from Start with these to Today | Tab switch: none, instant. Today then plays its own Generating moment | Same |
| Grid loading | Ready within `wait`: the grid paints in its first frame, no fade. Still not ready: Loading (placeholders, then the band after `wait`, one shared clock across all tiles, until `loop`); resolve `base`, `silk`, band out `quick` | Placeholders still; content fades in `base` |
| Late photo in a tile | Push and pop rule for late images: fade in `base`, `silk` | Fade `base` |
| Open a piece, back | Push and pop: native. Scroll position and Section kept | System |
| Arrive after Add pieces | Pop to a tab after a flow: Banner already in place, no expand. The new tiles fade in together (List insert, `base`, `silk`, no stagger). VoiceOver focus moves to the Banner | Same fade (`base`) |
| Arrive with a filter | The panel and the filtered grid are in place in the first frame. No expand, no crossfade | Same |
| Progress card | Generating > Closet progress card: in place from the first frame; a count change uses the label crossfade and the line eases (`base`, `silk`); done crossfades the sentence, line held full; leaves with Inline collapse when the queue empties while Closet is focused, with `maintainVisibleContentPosition` when it is above the viewport. Not focused: nothing animates | Line steps in one frame, text crossfades `base`, collapse is a fade then layout in one frame |
| Search | The filtered grid and the Section counts swap in one frame under one `quick` crossfade. No travel, no stagger | Same |
| Category chip, panel chip, Clear | Filter result: outgoing grid as a hidden overlay fades out (`quick`, `release`), the new grid fades in at its final place (`base`, `silk`). Tiles never slide. A category chip sets the scroll offset in the same frame so the filter row sits at the top of the content: the chip stays in view and only the Sections change; focus stays on the chip. Chip fill: Selection (`quick`, `silk`). More's selected look crossfades in the same frame; its width never changes | Same crossfade at `base` |
| Grid to No results and back | Filter result: the grid and the EmptyState crossfade in place | Crossfade `base` |
| Panel open and close | Inline expand and collapse (`settle`, `silk`, content after `step`), chevron rotate (`settle`, `silk`), scroll follows on the UI thread. Clear filters fades in its reserved row (`base`, `silk`), nothing moves | Layout in one frame, content fades `base`, chevron in one frame, `scrollTo` not animated |
| Enter and leave select | Header items and title swap natively. The Footer fades in place as a flex sibling (`base`, `silk`), already laid out disabled; it never slides. Nothing is inserted into the scroll content, so the grid keeps its place. Leaving: the Footer fades out (`quick`, `release`) | Footer fades `base` |
| Mark what I wear most | The Banner leaves (Inline collapse, `settle`, `silk`; `maintainVisibleContentPosition` when it is above the viewport) and select enters as above, in the same pass | Banner fades `base`, layout in one frame, Footer fades `base` |
| First tile selected | Action row and pair labels and fills crossfade from disabled to enabled (`base`, `silk`), nothing moves. Title: native | Same crossfade |
| Tile select and deselect | Selection: blush disc crossfades in `quick`, `silk`. Press: `press`. No haptic | Same |
| Last tile deselected | Action row and pair crossfade back to disabled (`quick`, `release`), nothing moves; open Mark as worn chips crossfade back to the Buttons | Crossfade `base` |
| Mark as worn open and close | The Buttons after Mark as worn crossfade to the Today and Yesterday chips and back (out `quick`, `release`; in `base`, `silk`); the row keeps its height | Crossfade `base` |
| Mark as worn, Link, Back in the closet | ResultBar crossfades in the action row's place (out `quick`, `release`; in `base`, `silk`); focus to its text | Crossfade `base` |
| Put away, Back in the closet, Undo | Filter result: the outgoing grid fades out (`quick`, `release`), the new grid without (or, for Undo, with) those tiles fades in at its final place (`base`, `silk`). Tiles never slide. Search and filters untouched; ResultBar as above | Crossfade `base` |
| ResultBar or error ends (next tile tap) | Action row crossfades back (`quick` out, `base` in) | Crossfade `base` |
| Error | The error text crossfades into the action row's place, as a ResultBar (out `quick`, `release`; in `base`, `silk`). The grid does not move | Crossfade `base` |
| Banner Link as a set | ResultBar crossfades in place of the Banner action row. The Banner leaves while Closet is not focused, so no collapse is seen | Crossfade `base` |
| Banner leaves (an action used, or select starts, while Closet is focused) | Inline collapse; focus to the next sibling (the first Section title) | Fade `base`, layout in one frame |

Haptics: none in this flow. Magic moment here: none; the progress card carries `moment-generating` for F02's background preparation. testIDs: `closet-loading` -> `closet-grid`; `moment-generating` on the progress card -> the done card.

## Copy

All keys are in `copy.md` > F04 Closet, F02 and F04 Background tagging, F04 Closet sections and filters, and F04 Closet, revision 2. Added there by this flow: `closet.markWearMost`, `closet.samples` ("Samples" / "Eksempler", used in `closet.section` and `closet.sectionLabel`). Cut there by this flow: `common.actions` (no header menu), `closet.moreValue`, `closet.moreCount` (More keeps its label), `closet.filterClearHint`, `closet.sampleCountOne`, `closet.sampleCountMany` (the sample Section uses `closet.section`), `closet.preparingOne`, `closet.preparingMany`, `closet.readyOne`, `closet.readyMany` (the progress card's `progress.*` keys). Reused from F09: `adjust.today`, `looks.yesterday`, `outfit.worn`, `looks.wornYesterday`.

| Where | Keys |
|---|---|
| Title, tab | `nav.closet`; S2 title `common.selectedOne`, `common.selectedMany` |
| Header | `closet.addPieces` (VoiceOver on `plus`), `common.select`, `common.cancel` |
| Search | `closet.search` |
| Filter row | `closet.more`, `closet.all`, `category.*` |
| Panel | `fact.colour`, `colour.*`, `coverage.levelLabel`, `pieceCoverage.full`, `pieceCoverage.moderate`, `pieceCoverage.layer`, `piece.needsDetails`, `fact.season`, `value.season.*`, `closet.worn`, `closet.notWornLately`, `closet.neverWorn`, `piece.availability`, `closet.unavailable`, `closet.putAway`, `adjust.style`, `style.desi`, `style.western`, `adjust.occasion`, `occasion.*`, `closet.clearFilters` |
| Results announced | `closet.resultsOne`, `closet.resultsMany` |
| Sections | `closet.section`, `closet.sectionLabel`, `common.pieceCountOne`, `common.pieceCountMany`, `closet.samples` |
| Tile | `tile.label` (VoiceOver; marks include `piece.away.*` or `closet.unavailable`, and `piece.needsDetails`), meta `piece.away.*` or `closet.unavailable`, `common.notSelected` (S2 value) |
| Empty | `closet.firstTitle`, `closet.addPieces`, `closet.noneFoundTitle`, `closet.clearFilters` |
| Loading | `common.loading` |
| Progress card | `progress.newOne`, `progress.newMany`, `progress.readyOne`, `progress.readyMany`, `progress.confirmOne`, `progress.confirmMany`, `capture.failedOne`, `capture.failedMany`, `closet.section`, `closet.sectionLabel`, `progress.moreGroups` |
| N added Banner | `closet.addedOne`, `closet.addedMany`, `closet.missingRoles` (`role.mainList`, `role.bottomList`, `role.shoesList`, `role.hijabList`, `word.and`), `pieces.startWithThese`, `closet.linkSet`, `closet.markWearMost`, `looks.new` |
| Select Footer | `looks.markWorn`, `adjust.today`, `looks.yesterday`, `closet.linkSet`, `closet.putAwayAction`, `closet.backInCloset`, `looks.new`, `pieces.startWithThese` |
| Results | `outfit.worn`, `looks.wornYesterday`, `closet.linked`, `result.putAway`, `result.backInCloset`, `common.undo` |
| Errors | `common.error.save`, `error.setTooSmall` |

Announcements, all `{ queue: true }`, never on first mount:

- `closet.addedOne` / `closet.addedMany` once after the batch settles (focus moves to the Banner instead when arriving from capture).
- Progress card: only the switch to done, `progress.readyOne` / `progress.readyMany` joined with `progress.confirm*` and `capture.failed*`, while Closet is focused. Count changes are read when focus reaches the card.
- After search, a panel chip, All or Clear settles (a pause of `wait`), `closet.resultsOne` / `closet.resultsMany`. A category chip announces `closet.sectionLabel` for the Section it shows. `closet.noneFoundTitle` when nothing matches. Focus stays on the chip that was pressed (Clear: on More). Last value only, once per settle. Not when a filter arrives with a hand-off.
- S2: the action row and pair are not announced when they become usable. The tile's selected state is the feedback, and the header title carries the count.
- ResultBars and errors in S2 take focus and are not announced; the Banner's `closet.linked` is announced once.

## Use cases

| ID | Screen | States covered |
|---|---|---|
| UC-F04-01 Start an empty closet | S1 | First run, empty closet; large text; bokmål |
| UC-F04-02 Browse the closet | S1 | Loading (placeholders only after `wait`), category Sections with counts, hijabs in tone order, other sections newest first, sample Section "Samples 13", category chip shows one Section and All shows every one, needs-details dot; first tile row visible with the progress card or a Banner, also at `ax` |
| UC-F04-03 Find a piece by name or colour | S1 | Native header search, filtered, count announced, no results ("No pieces found", "Clear filters") |
| UC-F04-04 Filter the closet | S1 | Filter row (More fixed, All, categories scroll), panel groups one line each in order, height budget (first tile row in view with the panel open, 390 x 844), Coverage by category (long-sleeved blouses, ankle trousers and the abaya Fully covered; the knee skirt Needs layering; hijabs and shoes in none), Worn single choice, Put away, Needs details, Clear filters, no results with and without the panel open; large text; bokmål |
| UC-F04-05 Link pieces as a set | S2 | Select (Cancel in its place, "0 selected" title), action row Link as a set, `closet.linked`, error in the action row's place, `error.setTooSmall`; no header menu; Cancel |
| UC-F04-06 Start with these from a selection | S2 -> F06 | `pieces.startWithThese`, select ends, selection cleared; put-away pieces left out; Your style first when none exists |
| UC-F04-07 Build a look from a selection | S2 -> F10 | Footer `looks.new` pushes the builder with the pieces; at `ax` New look is last in the pinned action row |
| UC-F04-08 See pending photos from the closet | S1 | Progress card counting up, done as "1 ready to add" with "Hijabs & scarves 1", the card is the door to Add pieces; the card leaves when the capture grid is empty |
| UC-F04-09 Open a piece | S1 -> F05 | Push and back keep the scroll position and Section |
| UC-F04-10 Put pieces away and bring them back | S2 | No alert, search and filters untouched, every selected piece put away (hidden ones too), visible tiles leave together, Undo restores them selected; More > Availability > Put away, Back in the closet in the action row |
| UC-F04-11 Never worn from Profile | S1 | Arrival with a filter: panel open with Never worn selected, tile -> F05 "Start with this piece" |
| UC-F04-12 Tell the app what I wear most | S2 | Select, or "Mark what I wear most" on the "N added" Banner (the Banner leaves); tiles further down, then Mark as worn > Today or Yesterday in the pinned Footer without scrolling back; `outfit.worn` / `looks.wornYesterday` with Undo in the action row's place |
| UC-F04-13 Fill in what the app could not read | S1 -> F05 | Arrival from `quick.details`: panel open with Needs details selected, tile leaves after its facts are set, no results at the last one |
| UC-F02-14 Add ready pieces and land in the closet | S1 | N added Banner by precedence (Link as a set, Mark what I wear most, New look), new tiles fade in together |
| UC-F02-15 Leave while photos prepare | S1 | Progress card, survives relaunch, "ready to add" |
| UC-F02-21 My clothes take over | S1 | N added Banner with `closet.missingRoles`, Start with these absent, Mark what I wear most until a wear exists |
| UC-F02-23 Add many photos and keep using the app | S1 | Progress card counts up while other tabs work, groups by category, "5 ready to add, 2 to confirm, 1 could not finish" |
| UC-F06-21 Rediscover (step 2) | S2 | Mark as worn on five favourites feeds Rediscover |
| UC-F09-12 See what I wore this month (step 2) | S1 | Arrival from Variety: panel open with Not worn lately selected |
| UC-F11-08 See how much the stylist knows (step 4) | S1 | Arrival from `quick.details` (UC-F04-13) |
| UC-F12-01, -02, -03, -04, -06, -07 | S1, S2 | Empty, large and largest text, bokmål, offline (no change), Reduce Motion, VoiceOver order: header (Select, or Cancel in S2), search, More, category chips, panel, Banner slot, Sections, sample Section, Footer last (action row, then the pair) |

## Review log

Decisions a builder needs:

- Select: the count is the header title and every select action is in the pinned Footer, so nothing is inserted into the content, the grid never moves on enter or leave, the actions never scroll away from the tile she just tapped, and a ResultBar lands where she pressed. Cancel takes Select's place, as iOS Photos. No header menu (owner: no floating menus).
- The action row is one scroll line, not a wrap: the three Buttons need about 385 pt in English at default size against 343, and stacking them would pin about 250 pt. Mark as worn comes first, so it keeps its place when its chips replace the other two.
- `ax`: New look joins the end of the pinned action row instead of the end of the scroll content, which is a 1-column grid of every piece (about 25,000 pt for 60 pieces at AX5).
- Entering select ends an "N added" Banner, so the screen never holds two Start with these, New look or Link as a set acting on different pieces.
- More keeps its label: a label that grew to "More: Never worn" pushed every category sideways. It sits outside the category ScrollView, so it never scrolls away, the panel follows the row in natural reading order and no experimental order prop is needed. Its selected look is declared on the blush list.
- Panel: Put away joins Availability and Needs details joins Coverage, so no group label repeats its only chip; Worn is one single choice (Not worn lately, Never worn). One line per group and name-less colour chips keep the open panel inside the first viewport.
- Chips never appear or leave with a filter: category, colour and occasion chips come from the whole closet.
- No tab badge: the owner asked for a card (round 2, item 12); a native badge is system red and nags on other tabs.
- Put away has no alert, as F05 (UC-F05-05), and never touches search or filters. Put-away tiles carry no mark in their own filter: the selected chip and More's value say it. Lane 1 should not file it as a missing mark.
- Focus stays where she pressed: a category chip keeps focus and announces its Section; Clear moves focus to More. Moving focus to a Section header made her swipe back after every pick and had no target on No results.
- Lane 1 checks: `Intl.ListFormat` on Hermes (nothing in `src/` uses it yet; fallback a plain ", " join, so both paths read the same); the native large title "Garderobe" at 60 pt with Bold Text on a 375 pt phone.
- Declined: one trigger and one label for Mark as worn here and on look detail (F09). F09's control chip row must fit one line in bokmål, and "Merk som brukt" does not; the triggers sit in different containers. Once opened, the chips, results and Undo are the same keys in both places.
- Declined: different English labels for the Put away filter and action. NB already differs (Lagt bort / Legg bort); in English the state and the verb are one word, and while the filter is set the action reads Back in the closet.
- For `copy.md` F05: `careLabel.fibreItem` joins with `Intl.ListFormat` unit `narrow`, which joins with spaces in English ("60% cotton 40% linen"); `short` gives ", " in both languages.
