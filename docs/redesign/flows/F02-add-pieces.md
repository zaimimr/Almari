# F02 Add pieces

Date: 2026-10-03. Phase 2b flow design (plan Task 4), revised for `architecture.md` Revision 1 and 2. Sources: `architecture.md` (Owner decisions, Revision 1 changes, Revision 2 changes), `owner-feedback.md` rounds 1 and 2, `advocate-walkthroughs.md` (architect responses to pass 2 and the revision 1 walk), `use-cases.md` rows UC-F02-01 to UC-F02-23, `design-system.md`, `motion.md`, `copy.md`. Before: `screens/before/capture-index.png`, `capture-detail.png`, `capture-group.png`, `piece-new.png`, `cutout.png`, `label.png`.

Routes: `/capture`, `/capture/[id]`, `/capture/group/[id]`, `/piece/new`, `/cutout/[id]?target=import`, `/label/[id]?target=import`. Every one is a push: S1 has the native back chevron; S2 to S6 show Cancel with the discard guard (`Screen leading=cancel`, the shell rule for editors that guard a draft). No sheet, no modal. No new route in this revision: the wear calendar belongs to Looks (`/looks/calendar`, F09).

Entry: Closet header Add, Closet empty state, Today empty closet card, Today problem card "Add pieces", Looks empty state, Start with a piece empty, New look empty, onboarding done "Add pieces", the Closet progress card (the whole card is the door; there is no Review button).

Exit: Add pops to Closet with one `dismissTo` when the grid is empty; with tiles left S1 stays (S1 item 9). Leaving S1 never prompts: the jobs stay queued in the closet provider and the Closet progress card (F04) takes over.

Background tagging (round 2, item 12): S1 never prepares anything itself. Photos join the import queue, and the runner in the closet provider (`useImportRunner` in `src/state/imports.ts`, already mounted, recovered on launch) prepares them one at a time in add order, whichever screen or tab is in front. Nothing reaches the closet until "Add N pieces".

What changed from before:

- The sheet is gone; every route is a push.
- No intro paragraph and no status line: each tile shows its own state.
- "Take a photo" and "Add without photo preparation" become three equal rows and one quiet link.
- The always-disabled "Add ready pieces" button is gone until something is Ready.
- A multi-piece photo keeps its own grid slot, so the grid never reshuffles.
- "Check this piece": the four photo chips move behind one Photo chip, in one row with Adjust cut-out, Remove photo and Retake under the photo; only real questions are open choices.
- The group gone screen loses its second line.

Revision 2 (owner rounds 1 and 2, advocate C2 and B2 fixes):

- New piece: Colour is the first fact chip and Sparkle joins them; the Photo chip moves to the photo actions row; a sleeve, see-through or length the app could not read is a row with nothing selected, and Looks right still accepts it.
- Preparing runs one photo at a time in the closet provider; leaving Add pieces never stops it, and the Closet progress card replaces the "N preparing" Banner.
- Add pieces opened with resolved tiles shows them in category Sections, as Closet does (round 2, item 12).
- "Ready" means a tile Add can take, on the Closet card, the S1 Footer and every announcement.
- The read colour on a Ready tile stands unless she changes it; no tap is needed before Add.
- The photo and the scan share one review title, `capture.group.title` "Pieces found".

## Screens

### S1 Add pieces (`/capture`)

Purpose: start photos, watch them prepare, fix a colour, add the ready ones.

Layout, top to bottom (screen type: push, `Screen title=title.addPieces`):

1. Header right: `HeaderItem` icon `lightbulb` (`capture.tips`, `accessibilityState.expanded` while Tips is open), `HeaderItem` text `common.select` (hidden while the grid is empty). In Select mode the header left is `HeaderItem` text `common.cancel` and Select is hidden; swipe back is off (`gestureEnabled: false`) and `onAccessibilityEscape` leaves Select mode, the same as Cancel.
2. Tips `Expander`, rendered only while open, with no closed header line: the `lightbulb` is its only toggle, and `capture.tips` is its VoiceOver container label. Open on first run, closed otherwise. Body: the three titles `capture.tip{n}Title` (`body` `ink`), with `capture.tip1Body` and `capture.tip2Body` under the first two (`subhead` `inkMuted`). No icons. Action: `Button secondary` `capture.gotIt` closes it and marks tips seen. The first photo added, from any source, also closes Tips and marks them seen, without moving focus, so at large text the grid rises toward view. Opening from the `lightbulb` moves VoiceOver focus to the first tip title; closing with Got it or the `lightbulb` returns focus to the `lightbulb`.
3. Source `Section` (no title): three equal `Row`s with `icon` leading: `capture.takePhotos` (`camera`), `capture.choosePhotos` (`photo.on.rectangle`), `capture.scan` (`viewfinder`, trailing `chevron`, pushes F03). Take photos opens the system camera for one photo and returns to S1, where the new tile enters the grid; focus stays on Take photos, so the next photo is one tap away. Choose photos opens the system photo picker (up to 20, the existing `selectionLimit`) and returns the same way, each photo a Waiting tile in pick order. Then `Button quiet` `capture.byHand` (pushes S4).
4. Source problem `Banner notice` (only when one exists), directly under the source rows: camera off, low space, photo not available. See States.
5. Job grid: `Tile size=grid`, 2 columns (1 at `ax`), `state` `queued`, `preparing`, `ready`, `needsAnswers`, `failed` or `removed`.
   - Layout: first one untitled group, directly under the source rows where new photos land: tiles Waiting or Preparing, failed tiles, group tiles and Confirm tiles with no settled category, in add order; photos added during the visit join its end. Below it, resolved tiles sit in category `Section`s with counts, the Closet recipe and words (`closet.section` "Tops 3", one header element read as `closet.sectionLabel`), in `groupByCategory` order, tiles in add order inside each. So nothing unlabelled trails a labelled Section, and a new photo pushes the Sections down only by her own action. On a first visit nothing is resolved, so there is only the untitled group.
   - Section membership is set when S1 opens and recomputed only while S1 is covered, the same window as a typed name, never on screen: a tile that resolves during the visit stays in the untitled group until S1 is next covered, and a tile moved from Tops to Bottoms on S2 is under Bottoms when the pop ends. The count is the live tiles in the Section, Removed slots excluded; after Add or Undo it changes in place with the label crossfade. A Section whose last tile leaves after Add leaves with it (List remove).
   - Queue: the runner takes one job at a time in add order, so at most one tile is Preparing and the tiles after it are Waiting. Try again and Retake make the job Waiting again in its own slot; the runner takes the earliest Waiting job, so it is prepared right after the one running.
   - Label block: from Waiting on, every capture tile reserves one label block under the photo, measured in a hidden layer at the current text size and language for its tallest layout: the longest generated name (longest `colour.*` plus longest `kind.*`, held to the 2-line cap below `large`, uncapped at `large` and up) over the longest `capture.colourLabel` value at 44 pt, the needs-an-answer dot's width included, or a meta line plus a 44 pt line. While Waiting and Preparing it holds a `Silk placeholder` `text` shape at label height (hidden from VoiceOver). Every later state fits the same block, so resolve is opacity only at every text size and nothing moves under a finger. Only a name typed on S2 can grow a row, laid out while S1 is covered, so it is in place when the pop ends.
   - Ready: the name on the label line, then the colour line: the 14 pt swatch plus `capture.colourLabel` ("Farge: salvie"), one control with a real `minHeight` 44 below the photo's press area (`colour.onPress`), which opens the colour Expander (item 6). The swatch always draws its 1 pt `lineField` edge (3.34 on canvas). The read colour stands unless she changes it: Add takes it as it is, so ten Ready tiles with one wrong colour cost one correction, not ten taps (C2-04). A tile whose only gap is an unread sleeve, see-through or length (`needsDetails`) is Ready and Add takes it; it carries the needs-an-answer dot before its name, the same piece and the same dot as in Closet (F04).
   - Confirm (`needsAnswers`): the 8 pt `plum` needs-an-answer dot, never edged, plus the name, and no colour line: the colour is confirmed on S2, which she opens anyway. The dot means what it means everywhere, this piece has an open question. Ready and Confirm differ by the colour line, which only Ready tiles have, and the Footer count says what Add takes. A plum swatch never looks like the dot: different size, the edge, and the "Colour:" words.
   - Failed: meta `capture.stateFailed` (`footnote` `error`), then `Button quiet` `common.tryAgain` as its own 44 pt control below the photo's press area, like the colour line. Try again re-runs preparation.
   - Group: a photo found to hold several pieces keeps the slot it started in. The tile shows the photo, and its label block crossfades to `capture.found` ("3 pieces in one photo") with a trailing `chevron.right` (`inkMuted`). Tap pushes S3. A scan batch from F03 takes the next slot in add order, with its first piece's photo and `scan.found` / `scan.foundOne`. The jobs of a group never also show as tiles. One VoiceOver element, role `button`, labelled with the visible text.
   - Names: generated names (colour plus garment) fit the 2-line cap below `large` in the 2-column grid in bokmål. Only a name the user typed on S2 can pass two lines; it ends in a tail ellipsis on the tile, full in VoiceOver and on S2.
   - Accessibility: each job tile is one element labelled `capture.jobLabel` ("Sage kurta, green, Ready"; `{colour}` left out when unknown). A Confirm tile's `{state}` is `capture.stateConfirm` "Needs an answer" / "Trenger svar", the words of the needs-an-answer recipe ("Sage kurta, Needs an answer"). A Ready tile with the dot adds `piece.needsDetails` after its state, as `tile.label` marks do ("Sage kurta, sage, Ready, Needs details"). `accessibilityActions`: Ready `common.editColour`, `capture.retake`, `common.remove`; Confirm `capture.retake`, `common.remove`; Failed `common.tryAgain`, `capture.retake`, `common.remove`. A Ready tile has `accessibilityState.expanded` true while its colour Expander is open. The visible colour line and Try again are the same actions, so nothing is a nested pressable.
6. Colour `Expander`, Ready tiles only, one at a time, directly under the grid row of the tile whose colour line was tapped: body is a `ChipRow` of the named colours with `swatch`, current one selected. Opening it moves VoiceOver focus to the selected colour Chip. Each colour chip reads "{option}, {fact key}" with `fact.colour` ("Salvie, Farge"), as F05 S1a, because the body has no drawn label. Tapping a colour writes it as confirmed (`correctImport`), the swatch and line update, the Expander closes and focus returns to the tile that opened it, so `capture.jobLabel` reads the new colour ("Sage kurta, sage, Ready" after picking Sage). Close (tapping the colour line again) and Escape (two-finger scrub) also close it and return focus to that tile.
7. Failed tile: tapping it pushes S2 on its no-cut-out path (`photo.original` only, `cutout.byHand`, and the Retake / Remove photo row). There is no Expander under a failed tile.
8. Removed slot: Remove photo and Same piece (both on S2) pop to S1, where the removed tile keeps its grid slot as `Tile state=removed`: the photo area stays empty at its size and the label block shows `result.removed` (`subhead` `inkMuted`) and `Button quiet` `common.undo` (44 pt). On the pop, VoiceOver focus goes to Undo, so `result.removed` is not also announced. Undo puts the job back in the same slot. The slot leaves with List remove only while S1 is covered (on the next push, so it is gone on return from S2 or S3) or once it scrolls out of view, with the scroll offset held (`maintainVisibleContentPosition`). A press on S1 never removes it, so nothing moves under a finger.
9. `Footer`: Waiting (reserved, opacity 0, `pointerEvents="none"`, `accessibilityElementsHidden` and `importantForAccessibility="no-hide-descendants"`, `design-system.md` Footer > Waiting) until a Ready tile exists, then primary `capture.addOne` / `capture.addMany` (count of Ready tiles only). While the primary is pressed its label and count freeze, and Add commits only the count shown. In Select mode the primary is `capture.confirmOne` / `capture.confirmMany` once one Confirm tile is selected. After Add with tiles left, the Footer goes back to Waiting, or shows the next count when Ready tiles remain. VoiceOver focus: when the Footer still shows a count, it stays on the primary; when it goes back to Waiting, `setAccessibilityFocus` moves to the first tile left in the grid, before `closet.addedMany` is announced (queued). The same rule sets focus when Looks right or Confirm N pieces pops to S1.
10. Leaving and coming back: the back chevron never asks anything. Every tile stays in the queue as it is, and S1 opened again (from the Closet progress card or any Add entry) shows the same tiles, the resolved ones in their category Sections (item 5), with the work done while she was away already resolved: no catch-up animation, no tile replays its resolve. Tips stay closed once seen.

Primary action: `capture.addMany`, "Add N pieces".

Tap rules: a Ready or Confirm tile pushes S2. A Failed tile pushes S2 (item 7). A group tile pushes S3. A Waiting or Preparing tile does nothing (VoiceOver: busy). Long press on a Confirm tile enters Select mode with that tile selected. In Select mode only Confirm tiles toggle; the others are `accessibilityState.disabled` with no opacity dim (a dim would change garment colours and drop label contrast). A Confirm tile is the one with a dot and no colour line, and VoiceOver reads "dimmed" on the rest.

```
┌──────────────────────────────────┐
│ <      Add pieces     [t] Select │
├──────────────────────────────────┤
│ ┌──────────────────────────────┐ │  first run only
│ │ Daylight shows true colour   │ │
│ │ Near a window, lamps off     │ │
│ │ One piece, plain background  │ │
│ │ A pair of shoes is one piece │ │
│ │ Every edge in view           │ │
│ │ [ Got it ]                   │ │
│ └──────────────────────────────┘ │
│ [c] Take photos                  │
│ ──────────────────────────────── │
│ [p] Choose photos                │
│ ──────────────────────────────── │
│ [s] Scan                       > │
│ Add by hand                      │
│                                  │
│ ┌──────────┐  ┌──────────┐       │
│ │  photo   │  │  cut-out │       │
│ └──────────┘  └──────────┘       │
│ 3 pieces in   Sage kurta         │
│ one photo  >  ● Colour: sage     │
│                                  │
│ ┌──────────┐  ┌──────────┐       │
│ │  cut-out │  │ ░sheen░░ │       │
│ └──────────┘  └──────────┘       │
│ • Blush hijab ░░░░░░░░           │
│                                  │
│ ┌──────────┐                     │
│ │  photo   │                     │
│ └──────────┘                     │
│ Could not finish                 │
│ Try again                        │
├──────────────────────────────────┤
│ [         Add 1 piece          ] │
└──────────────────────────────────┘
```

```
opened from the progress card, after the queue ran:
│ Add by hand                      │
│                                  │  untitled: still preparing, failed, groups
│ ┌──────────┐                     │
│ │ ░sheen░░ │                     │
│ └──────────┘                     │
│ Hijabs & scarves 3               │
│ ┌──────────┐  ┌──────────┐       │
│ │  cut-out │  │  cut-out │  ...  │
│ Tops 2                           │
│ ┌──────────┐  ┌──────────┐       │
│ │  cut-out │  │  cut-out │       │
```

(Wireframe markers: `[t]` Tips `lightbulb`, `[c]` `[p]` `[s]` row icons, `●` 14 pt swatch with its `lineField` edge, `•` 8 pt plum needs-an-answer dot, `>` chevron, `░░░` the reserved label block's placeholder.)

### S2 New piece, confirm (`/capture/[id]`)

Purpose: check the facts of one prepared photo, then move to the next.

Layout, top to bottom (`Screen title=confirm.title leading=cancel`, discard guard once anything changed). When the run has more than one Confirm tile, the header's VoiceOver label is `confirm.titleStep` ("New piece, 2 of 4"); nothing visible is added. A native-stack string title cannot take its own `accessibilityLabel`, so S2 uses a custom `headerTitle` component that keeps the native title's `title` role sizing and `maxFontSizeMultiplier` 1.3, with `accessibilityRole="header"` and `accessibilityShowsLargeContentViewer`, `accessibilityLargeContentTitle` the visible title.

1. Top slot, one `Banner notice` at a time, in this priority. Duplicate, when a match exists: text `duplicate.title`, the matched piece's `thumb` as `leading` (VoiceOver label `duplicate.named`), actions `Button secondary` `duplicate.same`, `Button quiet` `duplicate.different`. Otherwise advice (only when the photo has advice), priority `capture.partial`, `capture.several`, `advice.blur`, `common.light.dark`, `advice.clipped`, `advice.merged`, `common.light.mixed`, actions `Button secondary` `capture.retake`, `Button quiet` `advice.useAnyway`.
2. Photo: `Tile` image full content width (the chosen variant, cut-out on `canvas`). While Clean background runs, `Silk sheen` over it.
3. Photo actions, directly under the photo, one wrapping row in a fixed order: `Button quiet` with icon `scissors` `cutout.adjust` (`cutout.byHand` when there is no cut-out), the Photo `Chip kind="fact"` (`fact.photo`, value the chosen variant, "Photo: Enhanced"), `Button quiet` `capture.remove`, `Button quiet` `capture.retake`. Retake is last: while the advice Banner shows its own Retake, this one keeps its slot at opacity 0 with `pointerEvents="none"`, hidden from VoiceOver, so there is only one and nothing in the row moves. The Photo chip opens its `Expander` directly under this row: a single `ChipRow` of `photo.enhanced`, `photo.plain`, `photo.original`, `photo.clean` (only `photo.original` with no cut-out), a `radiogroup` with VoiceOver label `fact.photo`. Under it, only before the first Clean background ever, `Text footnote muted` `photo.cleanNote`. Clean background errors sit here as `Text footnote error` with `Button quiet` `common.tryAgain`.
4. Fact `Chip`s, one wrapping row directly under the photo actions, for facts about the garment, in this order: Colour (`fact.colour`, `swatch`; first because it is the one fact a hijab needs checked, B2-08), Category (`piece.category`), Garment (`piece.kind`), Style (`piece.style`; no chip for fixed-style garments, the garment sets it), Warmth (`pieceWeather.warmth`, hijabs and layers only), Sparkle (`fact.sparkle`, value `sparkle.*`, on garments whose category carries the embellishment attribute, so never on shoes, bags or accessories; unread, it shows Plain with no dot and reads `piece.fact.known`, exactly as F05 S1, a display of the stylist's default that is never written). A fact asked in item 5 has no chip. On `canvas` each fact chip has the 1 pt `lineField` edge (3.34) and a trailing `chevron.down` (design-system Chip). The Photo chip and every fact chip are `accessibilityRole="button"` with `accessibilityState.expanded` while their Expander is open, as F05 S1. No chip on S2 draws the `tentative` dot: Looks right confirms every value the app read or she picked at once. A suggested value reads `piece.fact.suggested` ("Colour: blush, suggested"). Season is not on S2: it is derived and shows on piece detail after Add (F05). Each chip opens its `Expander` directly under the chip row:
   - Colour a `ChipRow` of named colours with swatches.
   - Category every category; Garment the category's garments; Style and Warmth a `ChipRow` (`pieceWeather.light`, `pieceWeather.medium`, `pieceWeather.warm`); Sparkle a `ChipRow` of `sparkle.plain`, `sparkle.little`, `sparkle.heavy`, `sparkle.bridal` (Bridal is never proposed, only picked), per the fact Expander rule.
   - A pick writes at once, closes the Expander and the chip shows the new value. Clean background is the one exception: the Photo Expander stays open while it runs, so a failure shows in place, and closes on success. There is no "Looks right" inside these Expanders: the Footer confirms.
   - VoiceOver, for the Photo chip and every fact chip: opening an Expander moves focus to the selected option chip (the first chip when none is selected). The body has no drawn label, so each option chip reads "{option}, {fact key}" ("Brudestas, Pynt", "Salvie, Farge", "Forbedret, Bilde"), as F05 S1a and S1b; in Confirm N pieces mode a `fact.mixed` chip opens on "Lett, Varme". A pick, tapping the chip again, or Escape closes it and returns focus to the chip, which then reads `piece.fact.known` (`piece.fact.confirmed` for Colour), as F05 S1a and S1b. While Clean background holds the Photo Expander open, focus stays on the busy chip.
5. Questions, only where the app is unsure, as open choices in this order: Category `ChipRow` labelled `capture.askCategory` (the two candidates, then `capture.somethingElse`, which widens the row in place to every category with Inline expand, and VoiceOver focus moves to the first newly shown category chip); Garment `ChipRow` labelled `capture.askKind`; Style `Segmented` labelled `capture.askStyle` (`style.desi`, `style.western`); one `ChipRow` per open attribute question, labelled with the attribute name (`attribute.*`), suggested value preselected. Embellishment is never asked here: it is the Sparkle chip. Then, for each fact the coverage reading needs and could not read at all (`needsDetails`: sleeve and see-through on tops, tunics, layers and dresses, length on bottoms and dresses; never on hijabs, shoes, bags or accessories), a `ChipRow` labelled `attribute.sleeve`, `fact.sheer` or `attribute.length` with nothing selected. Its unselected `choice` chips draw the 1 pt `lineField` edge on `canvas` (`design-system.md` 7 > Anatomy), so the empty row still reads as chips. The empty row says what is missing; there is no separate Needs details line. Answering is one tap; leaving it is allowed and never disables Looks right (round 2, item 9).
   - VoiceOver: iOS speaks no radiogroup label or value when focus enters a chip (`design-system.md` > Accessibility rules > Semantics on device, F05 S1 Focus). So every option chip in these rows reads "{option}, {fact key}", with `piece.category`, `piece.kind`, `attribute.*` or `fact.sheer` as the key ("Hijaber og skjerf, Kategori"; "Uten ermer, Ermer"; "Nei, Gjennomsiktig"), the F05 S1c recipe. A needs-details row's drawn label (`headline`) is its one focusable label: it reads `attribute.sleeve`, `fact.sheer` or `attribute.length` with `accessibilityValue` `piece.needsDetails` ("Ermer, Mangler detaljer") until answered, then plain.
6. Name `Field` `piece.name`.
7. Care label `Row`: title `careLabel.title`, meta the label lines (`careLabel.lineSize`, `careLabel.lineBrand`, `careLabel.lineOrigin`) when present, trailing word `common.add` or `common.edit` as visible text only. The whole Row is one button labelled `careLabel.addLabel` or `careLabel.editLabel`, with the label lines as its `accessibilityValue`. Pushes S6.
8. `Footer`: primary `common.looksRight`. It confirms only values the app read or she picked: the measured colour, when not changed, along with every other answer. An unread Sparkle stays unread, whichever path adds the piece (S2 or Add from S1), and F05 treats it as any unread Sparkle. An unanswered needs-details row stays unknown and the piece carries "Needs details".

The ScrollView sets `automaticallyAdjustKeyboardInsets`, and the focused Field scrolls above the Footer.

Primary action: `common.looksRight`. It saves the answers, then shows the next Confirm tile in place (the route's id changes, no push): the content crossfades under the unchanged header and VoiceOver focus goes to the header title. After the last, it pops to S1 and VoiceOver focus follows S1 item 9.

"Confirm N pieces" mode (same route, several ids, `Screen title=capture.confirmMany`): a horizontal row of `Tile size=thumb` of the selected pieces, then items 4 and 5 without Colour. Each thumb is `accessibilityRole="image"` labelled with the `tile.label` name and colour, and is not pressable. No photo, photo actions, colour, name, care label, Retake or Remove: each piece keeps its own. Warmth and Sparkle apply to all, so fifteen hijabs get Warmth in one visit (B2-04); each shows only when every selected piece's category takes it. While the selected pieces differ, the chip's value is `fact.mixed` ("Warmth: Mixed" / "Varme: Blandet", read the same by VoiceOver) until a pick. Footer primary `common.looksRight` applies to all and pops to S1, focus per S1 item 9.

```
┌──────────────────────────────────┐
│ Cancel       New piece           │
├──────────────────────────────────┤
│ ┌ Blurry. Hold steady and tap ─┐ │  only with advice
│ │ to focus.                    │ │
│ │ [ Retake ]  Continue anyway  │ │
│ └──────────────────────────────┘ │
│ ┌──────────────────────────────┐ │
│ │                              │ │
│ │           cut-out            │ │
│ │                              │ │
│ └──────────────────────────────┘ │
│ x Adjust cut-out                 │
│ (Photo: Enhanced ⌄) Remove photo │  Retake held invisible with advice
│ (Colour: ● Blush ⌄)              │
│ (Garment: Chiffon hijab ⌄)       │
│ (Warmth: Light ⌄)                │
│ (Sparkle: Plain ⌄)               │
│ Hijabs or Scarves?               │  only when asked
│ (Hijabs)(Scarves)(Something else)│
│ Name                             │
│ [ Blush chiffon hijab          ] │
│ Care label                   Add │
├──────────────────────────────────┤
│ [         Looks right          ] │
└──────────────────────────────────┘

a kurta whose sleeve could not be read, end of the form:
│ Sleeves                          │
│ (Sleeveless)(Short)(Elbow)(Long) │  nothing selected
│ Name                             │
│ [ Sage kurta                   ] │
│ Care label                   Add │
├──────────────────────────────────┤
│ [         Looks right          ] │
```

### S3 Pieces found (`/capture/group/[id]`)

Purpose: choose which pieces found in one photo (or one scan) are added, and whether they are one set.

Layout, top to bottom (`Screen title=capture.group.title leading=cancel`, "Pieces found", the one title for a photo and for a scan batch, F03 S2; `scan.reviewTitle` is cut; discard guard per UC-F02-19):

1. `CameraFrame` with the photo (`accessibilityLabel` `capture.photo`), outlines on their `ink` halo, solid `blush` for kept pieces, dashed `onMedia` for dropped ones. Below `ax`, each outline carries its number in a `scrimPill` with `mark` `onMedia` (5.15 worst case); at `ax` the numbers leave the photo and the rows keep them. Each outline has a hit area of at least 44 x 44 pt (`hitSlop`), and where outlines overlap the smallest wins. Tapping an outline enters box mode for that piece (adjust crop). For a scan batch the frame is omitted, every row carries its thumbnail and rows have no number.
2. Piece `Row`s, all kept on arrival: `thumb` leading, title the number then the piece name ("1 Sage kameez"), falling back to the region name (`region.*`) and then to `capture.photoNumber`; a scan batch has no number and falls back to `confirm.title` instead (F03 S2). Meta `capture.partialShort` only when the piece is flagged partly visible. Row `checked` variant: trailing `ink` `checkmark` when kept. Tapping the row toggles kept. Role `checkbox`, `accessibilityState.checked` true or false, label `{number}, {name}` ("1, Sage kameez"), `accessibilityActions` `capture.adjust`.
3. `Row` with trailing toggle `closet.linkSet`, rendered from the first frame when the photo has two or more pieces. The whole 52 pt Row is the switch element (role `switch`, value on or off), as in iOS Settings. Its toggle is disabled (Row's disabled-toggle state) while fewer than two rows are kept. It never enters or leaves.
4. `Button quiet` `capture.addPiece` (enters box mode with a centred box).
5. `Footer`: primary `common.done`, `busy` while the write runs. Done removes the dropped pieces, writes the set when the toggle is on, then goes to the first kept piece that needs a confirm (S2), else back to S1. While no row is kept Done is disabled (Footer > Disabled, label unchanged); Cancel with the discard prompt is the way out. Same rule in F03 S2.

Box mode (inline, same header; swipe back is off while in box mode, and `onAccessibilityEscape` leaves the box like the header Cancel): the rows, set Row and Draw a box leave; the `CameraFrame` shows the box (`capture.box`, adjustable, `capture.boxValue`, `capture.boxMove` actions) and `controls` `capture.smaller`, `capture.larger`. A single tap on the photo outside the box moves the box centre to the tap point, clamped to the frame, with the `settle` move, so a piece near an edge needs no drag; dragging the box still works. S3 is a canvas `Screen`, so the controls are standard `plum` quiet Buttons on `canvas` (6.89) and any text off the photo is `ink` on `canvas` (13.49). The header's leading Cancel cancels the box: it returns to the rows unchanged, with no dialog, and stays reachable at every text size. `Footer` primary `capture.useBox`, no secondary. Use this box plays the box snap and adds or updates the row.

Primary action: `common.done`.

```
┌──────────────────────────────────┐
│ Cancel      Pieces found         │
├──────────────────────────────────┤
│ ┌──────────────────────────────┐ │
│ │  ┌1──────┐                   │ │
│ │  │kameez │   ┌3────┐         │ │
│ │  └───────┘   │dupat│         │ │
│ │    ┌2────┐   └─────┘         │ │
│ │    │shal.│                   │ │
│ └──────────────────────────────┘ │
│ [▣] 1 Sage kameez              ✓ │
│ [▣] 2 Sage shalwar             ✓ │
│ [▣] 3 Ivory dupatta            ✓ │
│ Link as a set               ( ●) │
│ Draw a box                       │
├──────────────────────────────────┤
│ [             Done             ] │
└──────────────────────────────────┘

box mode:
│ Cancel      Pieces found         │
├──────────────────────────────────┤
│ ┌──────────────────────────────┐ │
│ │ ░░░░░░┌─────────┐░░░░░░░░░░░ │ │
│ │ ░░░░░░│  box    │░░░░░░░░░░░ │ │
│ │ ░░░░░░└─────────┘░░░░░░░░░░░ │ │
│ └──────────────────────────────┘ │
│   Smaller          Larger        │
├──────────────────────────────────┤
│ [         Use this box         ] │
```

### S4 Add by hand (`/piece/new`)

Purpose: add one piece with a photo, without on-device preparation.

Editor recipe (`Screen title=manual.title leading=cancel`, discard guard). The order matches S2: photo, Category, Garment, Style, attributes, Name.

1. Photo: an empty `Tile` slot (dashed `lineField` silhouette) until a photo exists, with the photo source under it: two `Button quiet`, `common.takePhoto` with icon `camera` and `common.choosePhoto` with icon `photo.on.rectangle`, the same icons as the S1 source rows (S6 uses the same recipe). Once chosen, the photo (`editor.photoPreview`) with `Button quiet` `common.choosePhoto` to replace it. Camera off shows a `Banner notice` here (States).
2. Category `ChipRow` `piece.category`.
3. Garment `ChipRow` `piece.kind`; error `piece.kindRequired` under it when the chosen garment no longer fits the category.
4. Style `Segmented` `piece.style`.
5. Attribute `ChipRow`s, each labelled with the attribute name (`attribute.*`; embellishment is `fact.sparkle` with `sparkle.*`, Bridal included), suggested value preselected; sleeve, see-through and length as on S2 item 5, including its VoiceOver rules (option chips "{option}, {fact key}", the drawn label carries `piece.needsDetails` until answered). Add to closet accepts a preselected suggestion; there is no extra button.
6. Name `Field` `piece.name`, no placeholder.
7. `Text footnote muted` `manual.missing`, directly above the Footer, only once a field has been touched (a photo, a chip or a typed name) and while photo, category, garment or name is still missing. An unread sleeve, see-through or length row speaks for itself, as on S2 item 5 (nothing selected, its drawn label read with `piece.needsDetails`).
8. `Footer`: primary `editor.addToCloset`, disabled until photo, category, garment and name exist. Save errors (`common.error.save`) use the Footer `error` slot (`design-system.md` 3); the draft is kept.

The ScrollView sets `automaticallyAdjustKeyboardInsets`, and the focused Field scrolls above the Footer.

Primary action: `editor.addToCloset`. On success it pops to S1 and the piece joins the Closet like any added piece.

```
┌──────────────────────────────────┐
│ Cancel        Add by hand        │
├──────────────────────────────────┤
│ ┌ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┐            │
│   empty slot                     │
│ └ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┘            │
│ [c] Take photo  [p] Choose photo │
│ Category                         │
│ (Hijabs)(Tops)(Bottoms)(Shoes)...│
│ Garment                          │
│ (...)                            │
│ Style                            │
│ [  Desi  |  Western  ]           │
│ Name                             │
│ [                              ] │
├──────────────────────────────────┤
│ [ Add to closet (disabled)     ] │
└──────────────────────────────────┘
```

### S5 Cut-out (`/cutout/[id]?target=import`)

Purpose: adjust or draw the cut-out of a waiting photo. Same screen as F05 (UC-F05-08); only the target and the return differ.

Media recipe (`Screen media title=cutout.title leading=cancel`):

1. `CameraFrame` canvas with the photo, keeping the design-system floor of 40 percent of the safe-area height between header and Footer at every text size.
2. Under it, the controls in their own scroll area, top to bottom:
   - Hint `cutout.hold` (first use only), `subhead` `onMedia` on the `ink` ground (13.49).
   - `Segmented` `cutout.restore` `cutout.erase`, on its own full-width line.
   - `Segmented` brush `cutout.small` `cutout.medium` `cutout.large`, on its own full-width line.
   - A wrapping row of `Button quiet` `common.undo`, `cutout.reset` and the zoom button (F05 S3 item 6) (`onMedia` per the media rule).
3. `Footer` primary `common.done`, in the media variant of the primary (`onMedia` fill, `plum` label 6.89; design-system Colour > Media rule).

On this media screen the Segmenteds never fall back to `Row`s. They stay horizontal, and at `large`, or when a label would wrap, each segment shows its symbol only: `paintbrush` (Restore), `eraser` (Erase), and three `circle.fill` dots in rising sizes (Small, Medium, Large), all scaled by `symbolScale`. The symbols stand on their own for sighted users; the word is the segment's `accessibilityLabel` only. RN text segments do not reach the Large Content Viewer, so no long-press word is promised.

Primary action: `common.done`. Saves the mask to the job and pops to S2, which shows the new cut-out.

```
┌──────────────────────────────────┐
│ Cancel          Cut-out          │  ink ground
├──────────────────────────────────┤
│ ┌──────────────────────────────┐ │
│ │           photo              │ │
│ │        ( ring )              │ │  40 percent floor
│ │                              │ │
│ └──────────────────────────────┘ │
│ Hold on a piece to select it     │  controls scroll
│ [    Restore    |    Erase     ] │
│ [  Small  |  Medium  |  Large  ] │
│ Undo   Reset                     │
├──────────────────────────────────┤
│ [             Done             ] │
└──────────────────────────────────┘
```

### S6 Care label (`/label/[id]?target=import`)

Purpose: read the care label of a waiting photo into its draft. Same screen as F05; it returns to S2.

Editor recipe (`Screen title=careLabel.title leading=cancel`, discard guard):

1. Before a photo: the same empty `Tile` slot as S4 (dashed `lineField`), with `careLabel.intro` as its one line (`subhead` `inkMuted`, centred in the slot), then the S4 photo source under it: `Button quiet` `common.takePhoto` (`camera`) and `Button quiet` `common.choosePhoto` (`photo.on.rectangle`).
2. With a photo: the label photo (`careLabel.photo`), `Silk sheen` while reading (`careLabel.reading`), `Button quiet` `careLabel.takeAnother`. When reading ends with fields filled, VoiceOver focus moves to the first filled Field. A failed read shows `careLabel.nothingFound` or `careLabel.unreadable` as `Text footnote error` under the photo.
3. `Section` `careLabel.madeOf`: each fibre is a stacked group: fibre `Field`, percent `Field`, then `Button quiet` `careLabel.removeFibre`, shown only while two or more fibre groups exist. Fibre and percent may sit side by side only below `large`. Visible labels `careLabel.fibreLabel` and `careLabel.percentLabel` sit above the fields of the first group only; every group's fields carry the numbered VoiceOver labels `careLabel.fibre` ("Fibre 2") and `careLabel.percent` ("Percent, fibre 2"), matching `careLabel.removeFibre` ("Remove fibre 2"). Then `Button quiet` `careLabel.addFibre`.
4. `Field`s `careLabel.size`, `careLabel.brand`, `careLabel.origin`, each with its label above the field (Field anatomy).
5. `Button destructive` `careLabel.remove` when a label already exists (system alert `careLabel.removeTitle`).
6. `Footer`: primary `careLabel.save`.

The ScrollView sets `automaticallyAdjustKeyboardInsets`, and the focused Field scrolls above the Footer.

Primary action: `careLabel.save`. Pops to S2, where the Care label row shows the lines.

```
┌──────────────────────────────────┐
│ Cancel         Care label        │
├──────────────────────────────────┤
│ ┌──────────────────────────────┐ │
│ │ ░░░ label photo, sheen ░░░░░ │ │
│ └──────────────────────────────┘ │
│ Take another photo               │
│ Made of                          │
│ Fibre               Percent      │
│ [ Polyester      ]  [ 100     ]  │
│ Add a fibre                      │
│ Size                             │
│ [ M                            ] │
│ Brand                            │
│ [                              ] │
│ Made in                          │
│ [                              ] │
├──────────────────────────────────┤
│ [        Save care label       ] │
└──────────────────────────────────┘
```

### Gone (S2, S3, S5, S6)

`Screen gone` under the route's own header: `EmptyState` title `capture.gone.title` (S2, S5, S6) or `capture.group.gone` (S3), action `Button primary` `common.goBack`, which pops. No form, no canvas, no Footer. No second line.

## States

| State | Screen | Design | Use case |
|---|---|---|---|
| Empty | S1 | Source rows and Add by hand only. No grid, no Select, Footer Waiting (invisible, hidden from VoiceOver, height held). Nothing is disabled. | UC-F02-01, UC-F12-01 |
| First run | S1 | Tips `Expander` open above the source rows, with no header line. Got it, or the first photo added, closes it with inline collapse and stores "seen"; the header `lightbulb` opens it again. Title and back chevron never change. | UC-F02-01 |
| Empty | S4 | Empty photo slot with Take photo and Choose photo, the choices, Footer primary disabled. No `manual.missing` until a field is touched. | UC-F02-16 |
| Empty | S6 | Empty photo slot with `careLabel.intro` as its line, Take photo and Choose photo under it. | UC-F02-13 |
| Loading | S1 | A Waiting tile (`queued`) shows a `Silk placeholder` in the tile shape and in its reserved label block; its VoiceOver label carries `capture.stateQueued`. Photos are prepared one at a time in add order by the closet provider, so one tile is Preparing and the rest Waiting; the grid never reorders. The capture grid is exempt from the single busy container in `motion.md` (Loading > VoiceOver): busy is per tile (`capture.stateQueued` / `capture.statePreparing`, `accessibilityState.busy`), and Ready tiles stay reachable. | UC-F02-03 |
| Background | S1, every tab | Leaving S1 with tiles Waiting or Preparing is a normal exit, no prompt. The queue keeps running while she uses Today, Looks or any push; nothing on Today mentions it. Coming back to S1 shows the grid as it is now, with no catch-up animation. | UC-F02-15, UC-F02-23 |
| Loading | Closet | Closet progress card: F04 (the jobs persist in the closet provider). | UC-F02-15, UC-F02-23, UC-F04-08, UC-F12-05 |
| Loading | S5 | Photo, or a `Silk placeholder` at its rect, then `sheen` while the mask loads. Done is `busy` while saving. | UC-F02-12 |
| Generating | S1 | Preparing tile: original photo under the `Silk sheen`, label block holding its placeholder. Resolve: cut-out and label block content fade in, opacity only, no reflow. A photo found to hold several pieces resolves to a group tile in the same slot. | UC-F02-02, UC-F02-06, UC-F02-21 |
| Generating | S2 | Clean background: its chip in the Photo Expander selected and busy, the Expander held open, `sheen` over the photo. Leaving and returning shows the same in-progress state, never a second request. | UC-F02-11 |
| Generating | S3 | Use this box: outline trace, box snap, row enters. Nothing found: box stays as drawn, row enters. | UC-F02-06 |
| Generating | S6 | Reading: `sheen` over the label photo, fields fade in, focus moves to the first filled Field. | UC-F02-13 |
| Ready | S1 | Ready tiles carry the name, their colour line and the count in the Footer primary. The read colour stands; Add needs no colour tap. A tile whose only gap is an unread sleeve, see-through or length is Ready and carries the needs-an-answer dot, as it will in Closet (F04). Confirm tiles show the dot and no colour line, and are not counted. | UC-F02-02, UC-F02-14, UC-F02-22 |
| Needs details | S2, S4 | A sleeve, see-through or length the app could not read: its `ChipRow` in the questions with nothing selected, edged `choice` chips; its drawn label reads with `accessibilityValue` `piece.needsDetails` until answered ("Ermer, Mangler detaljer"), each option "{option}, {fact key}"; no separate line. Looks right and Add to closet stay enabled; an unanswered piece carries Needs details in Closet (F04, F05). | UC-F02-07, UC-F05-18 |
| Select | S1 | Header left Cancel; Confirm tiles toggle (selected disc); other tiles `accessibilityState.disabled` with no dim; Footer Waiting until one is selected, then `capture.confirmMany`. Escape and Cancel leave Select mode; swipe back is off. | UC-F02-20 |
| Colour open | S1, S2 | One colour `Expander` at a time: under the grid row of a Ready tile (S1, tile `accessibilityState.expanded`), or under the fact chip row (S2). The pick is confirmed at once. Focus goes to the selected colour Chip on open and back to the tile (S1) or the Colour chip (S2) after a pick, Close or Escape. | UC-F02-22, UC-F02-07 |
| Draft changed | S2, S3, S4, S6 | Cancel shows the system dialog `common.discardTitle` with `common.keepEditing` and `common.discard`. S3 guards Keep and drop choices the same way. In S3 box mode, Cancel and Escape only leave the box. | UC-F02-19 |
| Removed | S1 | Remove photo and Same piece (S2) pop to S1. The removed tile keeps its slot as `Tile state=removed`: `result.removed` with `common.undo` in its label block, VoiceOver focus on Undo. Undo puts the job back in the slot. The slot leaves only while S1 is covered or once it scrolls out of view, never on a press on S1. | UC-F02-05, UC-F02-09, UC-F02-17 |
| Added, tiles left | S1 | The added tiles leave (List remove), `success` haptic, `closet.addedMany` announced (queued). The Footer goes back to Waiting, or to the next count. Focus stays on the Footer primary while it shows a count; when it goes back to Waiting, `setAccessibilityFocus` moves to the first tile left in the grid before the announcement. S1 shows no "N added". Section counts change in place (S1 item 5). When S1 is popped, Closet's slot holds only the progress card for the tiles left ("2 to confirm"), no "N added" Banner (F04). | UC-F02-14 |
| Added, grid empty | Closet | `dismissTo` Closet; the queue is empty, so the progress card is gone and the "N added" Banner is there in the first frame (F04): `closet.addedMany` with `pieces.startWithThese` and one more by F04's precedence. While owned pieces cannot make an outfit (`missingRoles`), the Banner reads `closet.missingRoles` and Start with these is hidden. | UC-F02-14, UC-F02-21 |
| Error | S1 | Low space: `Banner notice` `problem.low-space` with `common.tryAgain`. Photo cannot open (iCloud): `common.photoOpenFailed` with `common.tryAgain`. Try again repeats the action that failed, camera or library. Failed job: `Tile state=failed`, "Could not finish" and Try again; tapping the tile opens S2 (S1 items 5 and 7). | UC-F02-05 |
| Error | S2 | Advice `Banner` (see S2 item 1). Clean background failure: `photo.cleanFailed` and `common.tryAgain` in the Photo Expander; the original stays. Daily limit: `photo.cleanLimit` in the Photo Expander, no retry. | UC-F02-10, UC-F02-11 |
| Error | S4 | Photo cannot open: `common.photoOpenFailed` under the photo slot. Full disk or failed write: `common.error.save` in the Footer `error` slot, draft kept. | UC-F02-16 |
| Error | S6 | `careLabel.nothingFound` or `careLabel.unreadable` under the photo; fields stay editable. | UC-F02-13 |
| Gone | S2, S3, S5, S6 | See Gone above. | UC-F02-18, UC-F05-14 |
| Offline | S2 | Clean background offline: `common.offline` in the Photo Expander with `common.tryAgain`; nothing else changes, on-device preparation keeps working. | UC-F02-11, UC-F12-04 |
| Permission denied | S1 | Take photos with camera off: `Banner notice` `common.cameraOff` under the source rows, actions `Button secondary` `capture.choosePhotos`, `Button quiet` `common.openSettings`. Choose photos still works. | UC-F02-04 |
| Permission denied | S2 | Retake with camera off: the same Banner in the top slot in place of the advice Banner, actions `common.choosePhoto` and `common.openSettings`. Retake never falls back to the library without saying so. | UC-F02-10 |
| Permission denied | S4, S6 | `Banner notice` `common.cameraOff` at the photo slot with `common.choosePhoto` and `common.openSettings`. | UC-F02-16 |
| Interrupted | S1, S2, S5 | Kill during preparation: jobs survive (`recoverImports` makes a Preparing job Waiting again), the queue resumes on launch from the closet provider without opening S1, and no job runs twice. Leave S5 while loading: no stuck sheen. Leave S2 during Clean background: same in-progress state on return. | UC-F12-05 |
| Largest text | all | At `large`: Footer pairs stack; Segmented becomes a list of Rows on canvas screens (S2, S4) and keeps symbol segments on S5; header Select becomes `checklist` icon; Expander values move under titles; tile labels lose their 2-line cap, and the label block is measured for the longest generated name at that size, so resolve stays opacity only (S1 item 5). At `ax`: grid goes to 1 column, `ChipRow`s, fact chips and the photo actions row wrap (Sparkle included, on its own line when needed); an opened fact Expander (Colour opens under Sparkle, lines below its chip) is scrolled into view per `motion.md` Inline expand, not animated under Reduce Motion; Section headers wrap with the count kept on the last line; the colour line stays its own 44 pt row under the name, S3 outline numbers leave the photo (rows keep them) and its controls stay `plum` on `canvas` under the frame, S5 controls scroll under a frame held at the 40 percent floor, S6 fibre and percent stack. The ScrollView keeps the focused Field above the keyboard and the Footer. Footer primary stays pinned and reachable. | UC-F02-06, UC-F02-07, UC-F02-13, UC-F02-20, UC-F02-22, UC-F12-02 |
| Bokmål | all | Longest labels: "Legg til {count} plagg", "Bekreft {count} plagg", "Legg til manuelt", "Klipp ut selv", "Velg denne rammen", "Fortsett likevel", "Ren bakgrunn", "Gjenopprett" (S5), "Tilbakestill" (S5), "Pynt: Brudestas", "Varme: Blandet", "Farge: gammelrosa" (in the label block measure), the Section headers "Kurtaer og tunikaer 3" and "Kjoler og abayaer 3" (`headline`), the needs-details rows "Gjennomsiktig" and "Uten ermer \| Korte \| Til albuen \| Lange". All sit in wrapping capsules or lines; none has a fixed width. Each S5 Segmented has its own full-width line, so "Gjenopprett \| Visk ut" and "Liten \| Middels \| Stor" fit at default size. "Kameratilgang", "Innstillinger" and "Tilbakestill" break at a syllable through the shared `Text` hyphenation (`copy.md`); keys hold no soft hyphens. | UC-F02-07, UC-F02-13, UC-F02-22, UC-F02-23, UC-F12-03 |
| Reduce Motion | all | Every moment takes its fade path from `motion.md` (below), including the Segmented thumb, Expanders, Clean background, busy Buttons, fact chip reflow and care label fields on S2, S4 and S6. | UC-F02-06, UC-F12-06 |

## Motion

All names refer to `motion.md` tokens. Nothing in this flow scales, flies or bounces.

Transitions:

- Every route: Push and pop, native, `animation: "default"`. Pushed screens render complete; late photos fade in (`base`, `silk`).
- S2 "Looks right" to the next Confirm tile: no push. The content crossfades in place under the unchanged header (`base`, `silk`). Entering S2 from S1 keeps the native push.
- Exit: Pop to a tab after a flow. One `dismissTo` the Closet tab; the "N added" Banner is in place in the first frame; only the new tiles fade in (list insert, `step`, max 6). VoiceOver focus moves to the Banner.
- Leaving S1 while the queue runs: the native pop, nothing else. The Closet progress card follows `motion.md` > Closet progress card (in place from the first frame, label crossfade and line ease on count changes, nothing animates while Closet is not focused). Tiles that resolved while S1 was not shown are drawn resolved on return, with no fade.
- Tips: first run closes once with Inline collapse (Got it or the first photo). Opened from the `lightbulb`, the content fades in (`base`) and the rows move down once with `settle`; closing on that same visit lays out in one frame while the content fades out (`base`). One visit never animates both directions.
- Colour (S1), Photo and fact chip (S2, Sparkle included) `Expander`s: Inline expand and Inline collapse (`settle`, `silk`; content after `step`, `base`). Chevron rotation `settle`.
- A fact chip whose value changes width: the chip row reflows (`settle`, `silk`).
- "Something else" widening the category row: Inline expand.
- S3 set Row: present from the first frame; its toggle turning enabled or disabled is a Selection crossfade (`quick`). It never enters or leaves.
- Tiles added to the grid: List insert (`base`, `silk`, `step` apart, max 6). Added tiles leaving: List remove (`quick`, `release`, then `settle`). A group tile resolves like any tile, label block crossfade only.
- Section count: after Add or Undo the count in its header changes in place with the label crossfade (`quick`). Membership changes only while S1 is covered.
- Removed slot: the photo fades out (`quick`, `release`) and `result.removed` with Undo crossfades into the label block; nothing moves. Undo fades the photo back (`base`, `silk`). The slot leaves with List remove only while S1 is covered or once out of view.
- Footer primary appearing when the first tile is Ready: Footer entering from Waiting (`base`, `silk`), no height change. The count changing: label crossfade (Banners and bars), held while the primary is pressed. After Add with tiles left, the label crossfades to the next count or the primary fades to Waiting (`base`).
- Chips, tile selection disc and Segmented thumb: Selection (`quick`, `silk`) and Segmented thumb (`settle`, `silk`).
- Box mode in S3: the rows collapse and the controls appear with Inline collapse and Inline expand; the Footer primary crossfades as a label change. A tap outside the box moves it with `settle`.
- Buttons that commit (Add N pieces, Looks right, Add to closet, Save care label, Done in S5): `Silk busy`.

Magic moments:

- Generating, capture tile preparing (S1; the Closet progress card has no band, its busy is the `Silk progress` line, `motion.md` > Closet progress card): `sheen` over the original photo after `wait`, stops looping after `loop` and stands still until resolve. Resolve: the cut-out fades in over the photo and the label block's placeholder crossfades to its content (`base`, `silk`), opacity only, no layout change. One announcement when nothing is Waiting or Preparing, only while S1 is the focused screen (`useIsFocused`; otherwise `copy.md` F12 > Counts covers it on Closet). If the batch settles while S2, S3 or S5 covers S1, nothing is announced: the Footer label is the source and reads the count on focus (accepted). The announcement: `capture.readyOne` / `capture.readyMany` (Ready tiles only, the Footer's number), with `progress.confirmOne` / `progress.confirmMany` and `capture.failed*` joined when above 0. `testID` `moment-generating` while running.
- Generating, Clean background (S2): `sheen` over the photo while the chip is selected and busy (`photo.cleanMaking`). Result crossfades in (`base`, `silk`), announces `photo.cleanDone`. Failure: original stays, chip crossfades back (`quick`).
- Generating, care label reading (S6): `sheen` over the label photo; filled fields fade in `step` apart, max 6; then VoiceOver focus moves to the first filled Field.
- Selecting object in image, Use this box (S3): the outline traces the piece (`drape`, `silk`), the box snaps to it (`settle`, `fall`), then the row enters (List insert). Announces `cutout.selected` or `cutout.noneFound`. `testID` `moment-selecting`.
- Selecting object in image, cut-out editor hold (S5): the 72 pt ring, sweep from the touch point (`drape`, `silk`) with `scrim`, `selection` haptic. As F05.
- Loading: Waiting tiles and the S5 mask load use `Silk placeholder` then `sheen`, resolve with `base`.

Haptics: `success` on Add N pieces. `selection` on the S5 hold. Nothing else in this flow.

Reduce Motion (every screen, S1 to S6):

- Tile preparing: still band at centre after `wait`; resolve fades (`base`).
- Clean background and care label: still band; result and fields fade in together (`base`).
- Box snap: the outline fades in (`base`), the box crossfades from drawn to snapped frame, the row is in place at once. A tap outside the box crossfades the box to its new place (`base`).
- Cut-out hold: ring fades in (`base`), no sweep, outline fades in, holds, fades out.
- Expanders, Tips, list insert and remove: layout in one frame, content fades (`base`). The Expander chevron turns in one frame.
- Box mode entering and leaving and the "Something else" widening: layout in one frame, content fades (`base`).
- A chip whose label changes width reflows the ChipRow in one frame.
- Segmented thumb: crossfades to the new segment (`base`).
- Busy Buttons: the still band at centre after `wait`, label unchanged.
- Late photos, the Footer primary, the S2 next-piece crossfade and the Removed slot: their plain fade (`base`).
- Section count change: in one frame.
- Exit to Closet: new tiles fade in (`base`) all at once.

## Copy

Keys from `copy.md`, by screen. New keys added to `copy.md` for this flow: `result.removed`, `confirm.titleStep`, `careLabel.addLabel`, `careLabel.editLabel`, `fact.photo`. Changed: `capture.jobLabel` gains `{colour}`. Revision 2 adds `progress.confirmOne`, `progress.confirmMany` ("{count} to confirm" / "{count} å bekrefte") and `fact.mixed` ("Mixed" / "Blandet"), and changes `capture.stateConfirm` to "Needs an answer" / "Trenger svar" (VoiceOver only). Sparkle, See-through and Needs details use the F05 Piece facts keys. Sparkle maps onto the existing `embellishment` attribute with one new value, `bridal` (an `embellishments` entry and a step in `embellishmentSteps`, `architecture.md` Domain touches, sparkle and bridal row). Cut here: `scan.reviewTitle` (one title, `capture.group.title`), `attribute.embellishment` and `value.embellishment.*` (now `fact.sparkle` and `sparkle.*`), `closet.preparingOne`, `closet.preparingMany`, `closet.readyOne`, `closet.readyMany` (now `progress.*`).

| Screen | Keys |
|---|---|
| S1 header | `title.addPieces`, `capture.tips`, `common.select`, `common.cancel` |
| S1 tips | `capture.tip1Title`, `capture.tip1Body`, `capture.tip2Title`, `capture.tip2Body`, `capture.tip3Title`, `capture.gotIt` |
| S1 sources | `capture.takePhotos`, `capture.choosePhotos`, `capture.scan`, `capture.byHand` |
| S1 problems | `common.cameraOff`, `common.openSettings`, `problem.low-space`, `common.photoOpenFailed`, `problem.failed`, `common.tryAgain` |
| S1 tiles | `capture.stateQueued`, `capture.statePreparing`, `capture.stateReady`, `capture.stateConfirm`, `capture.stateFailed`, `capture.jobLabel`, `piece.needsDetails`, `capture.photoNumber`, `capture.colourLabel`, `common.editColourHint`, `common.editColour`, `colour.*`, `common.tryAgain`, `capture.retake`, `common.remove`, `result.removed`, `common.undo` |
| S1 sections | `closet.section`, `closet.sectionLabel`, `category.*` |
| S1 announcements | `capture.readyOne`, `capture.readyMany`, `progress.confirmOne`, `progress.confirmMany`, `capture.failedOne`, `capture.failedMany` (VoiceOver only, after the batch settles), `closet.addedOne`, `closet.addedMany` (VoiceOver only, after Add with tiles left) |
| S1 groups | `capture.found`, `capture.foundOne`, `scan.found`, `scan.foundOne` |
| S1 Footer | `capture.addOne`, `capture.addMany`, `capture.confirmOne`, `capture.confirmMany` |
| S2 | `confirm.title`, `confirm.titleStep`, `capture.confirmMany`, `fact.photo` (new), `fact.colour`, `fact.sparkle`, `sparkle.plain`, `sparkle.little`, `sparkle.heavy`, `sparkle.bridal`, `fact.mixed`, `piece.fact.known`, `piece.fact.suggested`, `piece.fact.confirmed`, `attribute.sleeve`, `attribute.length`, `fact.sheer`, `piece.needsDetails`, `common.looksRight`, `photo.enhanced`, `photo.plain`, `photo.original`, `photo.clean`, `photo.cleanMaking`, `photo.cleanDone`, `photo.cleanFailed`, `photo.cleanLimit`, `photo.cleanNote`, `common.offline`, `cutout.adjust`, `cutout.byHand`, `capture.noCutout`, `capture.several`, `capture.partial`, `advice.merged`, `advice.clipped`, `advice.blur`, `common.light.dark`, `common.light.mixed`, `advice.useAnyway`, `duplicate.title`, `duplicate.named`, `duplicate.same`, `duplicate.different`, `piece.category`, `capture.askCategory`, `capture.somethingElse`, `piece.kind`, `capture.askKind`, `piece.style`, `capture.askStyle`, `style.desi`, `style.western`, `attribute.*`, `value.*`, `pieceWeather.warmth`, `pieceWeather.light`, `pieceWeather.medium`, `pieceWeather.warm`, `piece.name`, `careLabel.title`, `careLabel.lineSize`, `careLabel.lineBrand`, `careLabel.lineOrigin`, `common.add`, `common.edit`, `careLabel.addLabel`, `careLabel.editLabel`, `capture.retake`, `capture.remove`, `tile.label` |
| S3 | `capture.group.title`, `capture.photo`, `capture.photoNumber`, `capture.adjust`, `closet.linkSet`, `capture.addPiece`, `capture.box`, `capture.boxValue`, `capture.boxMove`, `direction.up`, `direction.down`, `direction.left`, `direction.right`, `capture.smaller`, `capture.larger`, `capture.useBox`, `common.cancel`, `common.done`, `cutout.selected`, `cutout.noneFound`, `capture.group.gone` |
| S4 | `manual.title`, `common.takePhoto`, `common.choosePhoto`, `editor.photoPreview`, `piece.category`, `piece.kind`, `piece.kindRequired`, `piece.style`, `attribute.*`, `value.*`, `fact.sparkle`, `sparkle.*`, `fact.sheer`, `piece.name`, `manual.missing`, `piece.needsDetails`, `editor.addToCloset`, `common.error.save`, `common.cameraOff`, `common.openSettings`, `common.photoOpenFailed` |
| S5 | `cutout.title`, `cutout.hold`, `cutout.selectPiece`, `cutout.selectPieceN`, `cutout.selected`, `cutout.noneFound`, `cutout.restore`, `cutout.erase`, `cutout.brush`, `cutout.small`, `cutout.medium`, `cutout.large`, `common.undo`, `cutout.reset`, `common.done`, `common.photoOpenFailed` |
| S6 | `careLabel.title`, `careLabel.intro`, `common.takePhoto`, `common.choosePhoto`, `careLabel.photo`, `careLabel.reading`, `careLabel.takeAnother`, `careLabel.nothingFound`, `careLabel.unreadable`, `careLabel.madeOf`, `careLabel.fibre`, `careLabel.percent`, `careLabel.fibreLabel`, `careLabel.percentLabel`, `careLabel.removeFibre`, `careLabel.addFibre`, `careLabel.size`, `careLabel.brand`, `careLabel.origin`, `careLabel.remove`, `careLabel.removeTitle`, `careLabel.save` |
| Closet hand-off (F04 owns) | `progress.newOne`, `progress.newMany`, `progress.readyOne`, `progress.readyMany`, `progress.confirmOne`, `progress.confirmMany`, `progress.moreGroups`, `capture.failedOne`, `capture.failedMany`, `closet.section`, `closet.sectionLabel`, `closet.addedOne`, `closet.addedMany`, `pieces.startWithThese`, `closet.linkSet`, `closet.markWearMost`, `looks.new`, `closet.missingRoles` |
| Gone and guards | `capture.gone.title`, `capture.group.gone`, `common.goBack`, `common.discardTitle`, `common.keepEditing`, `common.discard`, `common.cancel` |

## Use cases

| ID | Screen | States |
|---|---|---|
| UC-F02-01 | S1 Tips Expander, source rows, header Tips and Select | first run, empty |
| UC-F02-02 | S1 grid, preparing tile to Ready (name and colour line) or Confirm (dot, no colour line); the screenshot uses a plum garment so swatch and dot can be told apart | generating, loading |
| UC-F02-03 | S1 grid, three library photos prepared one at a time in add order | loading |
| UC-F02-04 | S1 camera-off Banner | permission denied |
| UC-F02-05 | S1 source problem Banner, failed tile with Try again, failed tile to S2, Removed slot | error |
| UC-F02-06 | S1 group tile in its own slot, S3 rows, set Row, box mode (tap to move, snap); S2 after Done | generating, largest text, reduce motion |
| UC-F02-07 | S2 fact chips (colour first, category with Something else, garment, style, Warmth, Sparkle), questions, attribute, an unread sleeve row with nothing selected, name, Looks right to next | largest text, bokmål |
| UC-F02-08 | S2 photo actions row with the Photo chip and its Expander | default |
| UC-F02-09 | S2 duplicate Banner; S1 Removed slot | default |
| UC-F02-10 | S2 advice Banner, single Retake, camera-off Banner on Retake | error, permission denied |
| UC-F02-11 | S2 Clean background, privacy line once, errors in the Photo Expander | generating, offline, error |
| UC-F02-12 | S2 photo action to S5 and back | loading |
| UC-F02-13 | S2 Care label row to S6 and back | empty, generating, largest text, bokmål |
| UC-F02-14 | S1 Footer Add; exit to Closet "N added" Banner (Link as a set, else Mark what I wear most while no wear exists, else New look), or with tiles left the tiles leave and the Footer moves to Waiting or the next count | default |
| UC-F02-15 | S1 back to Closet progress card, relaunch, "1 ready to add", the card pushes S1 | loading |
| UC-F02-16 | S4 | empty, error, permission denied |
| UC-F02-17 | S2 Retake and Remove photo; S1 Removed slot | default |
| UC-F02-18 | S2 and S3 gone | error |
| UC-F02-19 | S2 and S3 discard guard | draft changed |
| UC-F02-20 | S1 Select mode, S2 Confirm N pieces mode | largest text |
| UC-F02-21 | S1 Add; exit to Closet Banner with `closet.missingRoles` and Mark what I wear most, or Start with these once owned pieces make an outfit (F04 Banner, F06 Today) | empty, generating |
| UC-F02-22 | S1 colour line and colour Expander under one of ten Ready tiles; the other nine added with the read colour | largest text, bokmål |
| UC-F02-23 | S1 Choose photos (eight), back at once; the queue runs while she uses Today and Looks; Closet card counts up, then "6 ready to add, 2 to confirm"; the card pushes S1 with every tile resolved in category Sections and "Add 6 pieces"; a failed tile with Try again | loading, generating, error |

Also covered here: UC-F01-09 (onboarding done "Add pieces" hands off to S1 with Closet underneath), UC-F04-08 (the progress card is the door to S1), UC-F05-18 (Needs details set on S2 or S4 shows on the piece), UC-F05-08 and UC-F05-14 for the `target=import` cut-out and care label routes, UC-F06-11, UC-F07-05 and UC-F10-04 (their "Add pieces" actions push S1 and back returns to the caller), UC-F12-01 to UC-F12-06 for the S1 to S6 rows.

Notes for architect sign-off (words follow `copy.md`, which owns them; the Maestro text in these rows should follow):

- UC-F02-01: tips are an `Expander` with no header line, opened and closed by the `lightbulb`, not a swipe pager (no pager component exists in `design-system.md`); `capture.tipStep` is cut. The three source rows are equal; Take photos is first, not a filled primary, because the Footer owns the one primary. Scan carries no value line, because `copy.md` cut `capture.scanValue`. `use-cases.md` and the architecture inline-mode row are updated to match.
- UC-F02-05: a failed tile shows "Could not finish" and one visible action, Try again. Tapping the tile opens New piece on its no-cut-out path, which holds Cut out by hand, Retake and Remove photo (copy cut `capture.fix`). Retake and Remove are also the tile's VoiceOver actions. `use-cases.md` and `copy.md` are updated to match.
- UC-F02-06: the group is a tile in the photo's own grid slot, and tapping it is "Review". "Keep as a set" is `closet.linkSet` "Link as a set", "Add a piece" is `capture.addPiece` "Draw a box", "Adjust crop" is a tap on the piece's outline (and a VoiceOver action on its row), and Keep or Drop is the row tap with a checkmark. The "Other people were in this photo" line is cut in `copy.md` (`capture.othersIgnored`). In box mode the header Cancel leaves the box, so the Footer holds Use this box alone. `use-cases.md` step 1 is updated to match.
- UC-F02-20: "Answer for N" is `capture.confirmMany` "Confirm N pieces", which is also the title of the confirm screen in that mode.
- UC-F02-14 and UC-F02-21: "Style today", "Build a look" and "Mark what I wear most" are `pieces.startWithThese`, `looks.new` and `closet.markWearMost` (F04); "styling from your clothes now" (`closet.ownedNow`) is cut in `copy.md`. `design-system.md` has no blush "New" mark on tiles (the "N added" Banner says it), while `copy.md` still lists `closet.new`; F04 settles it. With tiles left, S1 shows no "N added": `use-cases.md` UC-F02-14 is updated to match.
- UC-F02-22: "Dusty pink" is not a named colour; tests use Blush or Mauve. Only Ready tiles carry the colour line; a Confirm tile's colour is set on S2.
- F12 device check (requested): Voice Control "Tap Edit colour" on a Ready tile and "Tap Try again" on a Failed tile. If either fails, the colour line or Try again becomes its own element for Voice Control only (`accessibilityRespondsToUserInteraction`, labelled with its visible text), and VoiceOver keeps the one merged tile.
- Architecture deviation (Former modals, "the cut-out action sits on the photo itself"): S2 places the cut-out action as one quiet `scissors` Button directly under the photo instead of on it. A control on the photo needs a `scrimPill` and must leave the photo at `ax`, so it would move between sizes; under the photo it stays in one place and the photo carries no chrome.

Notes for sign-off, revision 2:

- Review: cut (`copy.md` Renamed visible text, `design-system.md` 13). The progress card is one button that pushes S1. UC-F02-15 and UC-F02-23 in `use-cases.md` now tap the card; UC-F04-08 step 3 should do the same.
- Ready count, settled: "ready" means a tile Add can take, everywhere. `captureProgress.ready` counts Ready tiles only and gains `confirm` (Confirm tiles); `captureProgress` is new in `src`, so this costs nothing extra. The done card reads "6 ready to add, 2 to confirm", the S1 Footer "Add 6 pieces", and both announcements carry the same numbers. `copy.md` gains `progress.confirmOne` / `progress.confirmMany`; `architecture.md` adds `confirm` to the `captureProgress` row.
- Grouped by category (round 2, item 12): S1 shows resolved tiles in category Sections, chosen when S1 opens, never while it is on screen (S1 item 5). `groupByCategory` is reused over the jobs' categories; no new pattern.
- Confirm chips: `copy.md` > F05 Piece facts is now scoped to piece detail. S2 shows Colour, Category, Garment, Style, Warmth and Sparkle; unread sleeve, see-through and length are rows; no Coverage, Season or Needs details chip.
- Season: not on S2 (round 2, item 9 asks for it as a fact on the piece, not a capture step). It is derived and shows on piece detail (F05). UC-F02-07 in `use-cases.md` is updated.
- Sparkle, one form: an unread Sparkle is the Sparkle fact chip, shown as F05 S1 shows it (Plain, no dot, `piece.fact.known`), never a question row. Looks right confirms only what the app read or she picked, so an unread Sparkle is never stored as Plain on any path. S2 draws no `tentative` dot on any chip; F05 keeps the dot for read but unconfirmed values.
- `design-system.md` Chip `fact`: add "on the capture confirm no chip draws the tentative dot; VoiceOver still reads `piece.fact.suggested`", so the Colour chip never carries dot and swatch together. Banner > Progress card: drop "A change in the ready count is announced per the shared rule at most once every `announce`, and the switch to done always", so it matches `copy.md` F12 > Counts (announced once when the queue ends, counting up never).
- F04 S1 item 5: the done sentence joins `progress.confirmOne` / `progress.confirmMany` ("6 ready to add, 2 to confirm"), so the card is defined once there (F02 no longer restates it). "Add N pieces empties the queue" holds only when nothing is left; with Confirm tiles left the slot holds the progress card alone (States, Added, tiles left).
- `copy.md` `piece.needsDetails` (F05 Piece facts row): on New piece it is the `accessibilityValue` of the unanswered row's drawn label, not of the row.
- UX writer: `sparkle.plain` is "Plain" / "Ingen". "Pynt: Ingen" says no embellishment, while "Plain" says simple. Check whether "Enkel" carries the English meaning better. Copy only, no layout change.
- Wear calendar: not part of this flow. It lives at `/looks/calendar` (F09).

## Review log

- **Media primary label.** The review asked for an `ink` label on the `onMedia` fill. `design-system.md` (Colour > Media rule) already defines the media primary as an `onMedia` fill with a `plum` label (6.89), so the primary stays plum-coded on every screen. S5 points to that recipe.
- **"Colour looks right" VoiceOver label.** Not added: the S2 colour Expander has no Looks right action, so only the Footer says "Looks right".
- **S3 outline numbers.** Not dropped. The accessibility review asked rows to carry the number at every size, which links the outlines to the rows, so the numbers stay on outlines below `ax` and on rows always.
- **S3 box mode Cancel.** The ask was to state that the Footer secondary Cancel moves to the scroll end at `ax`. Instead the box mode Cancel is the header's leading Cancel, as Select mode on S1, so it is reachable at every size and the screen never shows two Cancels.
- **Label block at every size (revised).** The block is measured with the longest generated name and the longest colour line at the current text size and language, so resolve is opacity only at every size. Only a typed name can grow a row, laid out while S1 is covered.
- **New Tile states.** `queued` and `removed` are added to the `design-system.md` Tile `state` union for this flow. The UI designer should confirm the Removed look.
- **`editor.nameHint`.** S4 no longer uses it, but the row stays in `copy.md` because F05 S2 still sets it as a placeholder. F05 and the UX writer should drop it there under the Field rule (placeholders are short nouns).
- **Fact chip in `design-system.md`.** The Chip table `fact` row now reads "Opens its Expander with choices; a pick writes at once and closes it", so F03 and F05 fact chips behave as on S2. Chip anatomy also gives `fact` chips on `canvas` the `lineField` edge and the trailing `chevron.down`.
- **S1 colour line kept (declined).** One review asked to drop the colour line and fix colour only on S2, or to open the colour chips in the Footer. Kept as written: UC-F02-22 says no screen is left to fix a colour, and the blocking review settled the line as swatch plus `capture.colourLabel`. A Footer colour panel would be a new Footer pattern that grows over the grid like a sheet, which the owner does not want; the Expander under the row is the inline pattern every other fact uses.
- **Swatch edge on tiles.** One review asked for an `ink` edge, another for `lineField`. The tile swatch keeps the `lineField` edge of the `swatch` token (3.34 on canvas). Size (14 pt against 8 pt), the edge, and the "Colour:" words already separate it from the dot.
- **Tile name cap.** The cap stays on capture tiles below `large`, because removing it would make the reserved label block reflow at resolve. Generated names fit two lines; only a typed name can end in an ellipsis on the tile.
- **S5 symbol segments.** Chose standalone symbols over a native Large Content Viewer bridge: one native item for two controls is more cost than the gain, and the symbols are standard iOS editing symbols.
- **Season chip minors (superseded).** The read-only label, the Warmth-change announcement and its Reduce Motion fade no longer apply: Season left S2.
- **Photo actions order (changed from the ask).** The ask was Adjust cut-out, Retake, Remove photo with Retake keeping its slot. Retake goes last instead, so while the advice Banner shows its own Retake this one is held invisible at the end of the row and leaves no gap between visible controls. Two visible Retakes were declined.
- **Colour chip dot and swatch.** Chose to drop the dot on S2 rather than allow dot plus swatch in design-system Chip, so the Tile decoration cap holds everywhere.
- **Confirm N pieces, Sparkle.** Shown only when every selected piece's category takes it, like Warmth, rather than applying to some pieces: a chip that silently skips part of the selection would mislead.
- **Closet slot.** F04 owns it. With tiles left the slot holds the progress card alone (States, Added, tiles left); the card's text and its confirm count are asked of F04 under Notes for sign-off, revision 2. The tab badge is already gone in F04.
- **Dot on Ready tiles (changed).** The plum dot now means "this piece has an open question" on S1 as in Closet, so a Ready tile with needs details carries it and keeps it after Add. Ready and Confirm differ by the colour line and the Footer count. Such a tile shows the dot before its name and the swatch on its own colour line; the decoration cap (one mark before the label) still holds.
- **Untitled group first.** Placed directly under the source rows rather than after the Sections, so its tiles never read as part of the last Section. A VoiceOver user reaches it before the first Section header, so it needs no header and no `experimental_accessibilityOrder`.
- **Suggested values on S2.** Only VoiceOver hears "suggested" (`piece.fact.suggested`); S2 draws no tentative dot by choice (see Colour chip dot and swatch). An unread Sparkle is not a suggestion: it reads `piece.fact.known` Plain, as on F05, and is never written.
- **Sparkle shown as "Sparkle" with no value (declined).** It would make the same chip read differently on New piece and on piece detail. Kept the F05 display and fixed the storage instead: Looks right never writes it.
- **Edged `choice` chips on canvas.** `design-system.md` 7 > Anatomy already gives unselected `choice` chips on `canvas` the 1 pt `lineField` edge; S2 item 5 now points to it, no design-system change needed.
- **Hijab wireframe.** The Style chip is removed: hijab garments have a fixed style (`fixedStyles`, both), so per item 4 they get no Style chip.
