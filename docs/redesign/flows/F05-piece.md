# F05 Piece

Routes: `/piece/[id]`, `/piece/edit/[id]`, `/cutout/[id]?target=piece`, `/label/[id]?target=piece`. Built only from `design-system.md` components plus native navigation and system alerts. Timing from `motion.md`, words from `copy.md`.

Entry: Closet tile (any filter), Today check card "Open {name}", look detail piece row, a set partner Row on another piece, the Looks calendar Most worn rows (F09). Exit: Back. Hand-offs (architecture.md, flow table):

- `piece.startWith` -> F06 Today with the piece kept and the `today.banner.started` banner. With no everyday style, F11 Your style first, then Today.
- `piece.planWith` -> F07 Adjust with the piece kept and the Day row focused.
- `piece.addToLook` -> F10 builder with the piece placed.
- A look row under the looks section -> F09 look detail.
- Data, no navigation: a corrected colour feeds the hijab reasons on Today (F08); a Coverage chip that turns from Needs details to a verdict removes the dot from the Closet tile and the piece from the Needs details filter and the completeness count (F04, F11); Coverage and Season feed the Closet filters; Sparkle feeds the stylist on Eid, party, wedding guest and barat requests.

Nothing on this screen records a wear (owner, round 2: "wore today on piece" not taken). The wear line only reads what Today, look detail and Closet select record.

## Screens

### S1 Piece detail `/piece/[id]`

Purpose: see one piece, fix what the app got wrong, and send it to an outfit.

Recipe: Detail (hero / title / meta / Sections / Footer with the one primary).

1. `Screen` (no header title, the piece name is the title). `HeaderItem` text `common.edit` on the right.
2. `Tile` `size="hero"`: the piece cut-out on `canvas` at `elevation.rest`. Hidden from VoiceOver at rest: the title names the piece and the Colour chip gives its colour. While the hero is re-prepared (States > Generating) it is one image element labelled `capture.statePreparing` with `accessibilityState.busy`, hidden again when the new cut-out fades in.
3. `Text title` (Georgia): piece name, `accessibilityRole="header"`. Focus lands on it when the push ends (Detail recipe rule).
4. `Text subhead muted`, the wear line: `piece.wornMany` / `piece.wornOnce` / `closet.neverWorn`. It counts every `wore` event for the piece: Wear this on Today, Mark as worn on a look, Mark as worn in Closet select.
5. `Section` `piece.facts.title`, one `ChipRow wrap` of fact `Chip`s in this order. A chip that is read from other facts sits after them, so a pick never changes a chip above the one she tapped.
   1. Colour (with `swatch`).
   2. Garment (`kind.*`; the category follows from it and is not shown).
   3. Style, not shown when the garment fixes it (as F02).
   4. Coverage (`fact.coverage`), on tops, tunics, layers, bottoms, dresses and abayas. It holds the facts it is read from (S1c), so Sleeves and See-through have no chip of their own there, nor Length on bottoms and dresses.
   5. Sparkle (`fact.sparkle`, value `sparkle.*`), on Desi and both-style pieces and dupattas.
   6. Fabric, Pattern, Fit, Length, Formality (`attribute.*` / `value.*`), each when it has a value. Sleeves and See-through (`fact.sheer`) join them on a piece Coverage does not judge, when they have a value.
   7. Weather traits: Warmth on coat, layer and hijab; Rain and Snow on shoes.
   8. Season (`fact.season`, value `value.season.*`), read only.
   9. Availability, value only ("Available", "In the wash"), as Closet tiles do. Always there.

   Chip rules:

   - Editable facts are `Chip kind="fact"`: key in `placeholder`, value in `ink`, trailing `chevron.down`, `accessibilityRole="button"` with `accessibilityState.expanded`. A suggested value is `tentative` (needs-an-answer dot). VoiceOver: `piece.fact.suggested` when tentative, `piece.fact.confirmed` for a colour the owner confirmed, else `piece.fact.known`. Availability, whose visible text is the value, reads "{value}, {key}" ("Available, Availability" / "Tilgjengelig, Tilgjengelighet", F12 L), so Voice Control "Tap Available" finds it.
   - Coverage is always editable. Its value follows `pieceCoverage(piece)`, judged by what the piece covers: tops, tunics and layers by Sleeves and See-through, bottoms by Length, dresses and abayas by both (the weaker one). A long-sleeved blouse at the hip is Fully covered; ankle trousers are Fully covered; a knee skirt is Needs layering. While any fact it reads is unread or suggested (`needsDetails(piece)` not empty), the value is `piece.needsDetails`, `tentative`, read `piece.fact.known` with `accessibilityValue` the open facts' keys joined with `Intl.ListFormat`: "Coverage: Needs details, Sleeves, Length". Hijabs, shoes, bags and accessories never get the chip.
   - Season is the one read-only fact: the same `Chip kind="fact"` with no `onPress`, no chevron, no `lineField` edge on canvas (`sunken` fill only), never tentative, no button trait; one text element read with `piece.fact.known` ("Season: Summer"). No line says why it cannot be set (`copy.md` > F05 Piece facts). It changes only when Warmth or Fabric changes, both above it.
   - Sparkle, unread, shows Plain with no dot and reads `piece.fact.known`, because the stylist already reads a missing value as Plain; the dot stays for real questions. The same four words as onboarding and Your style.
   - Every editable chip opens its `Expander` (S1a for colour, S1c for Coverage, S1b for the rest). One open at a time. It opens directly under the chip line that holds the tapped chip, as a full-width item in the wrap; the following chip lines reflow below it (Inline expand, anchored at its top). The line breaks are read from each chip's `onLayout`, so the chips above never move. The open chip's chevron turns up (Expander chevron); that is the only open mark, so the chip keeps its width.
   - Focus: on open, `setAccessibilityFocus` goes to the selected option chip, or the first option when none is selected. iOS speaks no radiogroup label when focus enters the group (design-system.md > Accessibility rules > Semantics on device), so every option chip in S1a, S1b and S1c carries the Segmented-as-Rows label (F12 L) "{option}, {fact key}": "Sage, Colour", "Long, Sleeves" / "Lang, Ermer", "No, See-through" / "Nei, Gjennomsiktig". `experimental_accessibilityOrder` places the body directly after the tapped chip; Lane 1 device check. If it fails, the natural order is used (body after the last chip on that line, as drawn) and the focus moves on open and close keep it usable. Opening announces nothing else.
6. In a set: `Section` `sets.partOf` with one `Row` per partner piece: `thumb` leading, the partner's name, `chevron`. Pushes that piece's S1. No meta.
7. Care label `Row`: title `careLabel.title`, meta the fibre line (`careLabel.fibreItem` per fibre, joined with `Intl.ListFormat` `type: "unit"`, `style: "narrow"`: "95% cotton, 5% elastane") then `careLabel.lineSize`, `careLabel.lineBrand`, `careLabel.lineOrigin` when recorded; no meta when none is recorded. Trailing `chevron`. One element. Pushes S4.
8. Looks, only when the piece is in one or more: `Section` titled `piece.usedIn.one` / `piece.usedIn.other`, no Section action. One `Row` per look: `lay` leading, look name, `chevron`. Push F09.
9. Actions, at the end of the content: `Button quiet` with a leading icon, one per line, leading-aligned, `space.sm` apart:
   - `piece.addToLook`, icon `plus`. Always.
   - `piece.planWith`, icon `calendar`. Only when the Footer primary is `piece.startWith` (not on an away or put-away piece).
   - `closet.putAwayAction`, icon `archivebox`. Not on a put-away piece. Acts at once, no alert: a `ResultBar` `result.putAway` with `common.undo` takes the place of the Plan a day and Put away lines, and the Footer label crossfades to `closet.backInCloset`. Undo restores both lines and the Footer label; focus returns to Put away. `closet.backInCloset` in the Footer does the same as Undo while the ResultBar is there. The ResultBar stays until the screen is left; on the next visit the actions read Add to a look only (Put away piece).
10. `Footer`: one primary in every state, full width. Only its label changes, by crossfade: `piece.startWith` by default, `piece.planWith` on an away piece (wash, lent, repair), `closet.backInCloset` on a put-away piece. The button's `minHeight` is the tallest of the three labels, measured in a hidden layer in the current language and text size (as Footer > Waiting), so Put away, Undo and an Availability change never resize the Footer. When an S1 pick changes the label (Availability), the primary's `accessibilityLabel` changes at once and the new label is announced once, queued; nothing is added on screen. Pressing `closet.backInCloset` (put-away piece, or while the ResultBar is shown) announces `result.backInCloset` once, queued, and focus stays on the Footer button.

Primary action: `piece.startWith`.

A kurta:

```
 <                                Edit
+-----------------------------------+
|                                   |
|            [ cut-out ]            |
|          (sage kurta on           |
|           white canvas)           |
|                                   |
+-----------------------------------+
 Sage kurta                  Georgia
 Worn 3 times, last 12 Sep

 Details
 (o Colour Sage v) (Garment Kurta v)
 (Coverage Modest v) (Sparkle Plain v)
 (Fabric Lawn v) (* Pattern Solid v)
 (* Fit Straight v) (Length Calf v)
 (* Formality Smart v) (Season Summer)
 (Available v)

 Part of a set
 [thumb] Sage trousers             >

 Care label                        >
 95% cotton, 5% elastane

 In 2 looks
 [lay] Eid lunch                   >
 [lay] Office Monday               >

 + Add to a look
 [cal] Plan a day
 [box] Put away
===================================
 [      Start with this piece      ]
```

A hijab: no Coverage and no Sparkle, Warmth after the attributes.

```
 Details
 (o Colour Blush v) (Garment Hijab v)
 (Fabric Chiffon v) (Pattern Solid v)
 (* Formality Casual v) (Warmth Light v)
 (Season Summer) (Available v)
```

No looks, end of the screen: the actions keep their icons and their own lines, so they read as a list of actions, not stray links.

```
 Care label                        >

 + Add to a look
 [cal] Plan a day
 [box] Put away
===================================
 [      Start with this piece      ]
```

`(o ...)` swatch chip, `(* ...)` tentative fact chip with the plum dot, `v` the chip's chevron (editable), a chip without `v` is read only (no edge), `[... ^]` the open chip (chevron turned up), `(#...#)` selected option (blush).

#### S1a Colour Expander (inline on S1)

Opened by the colour chip. `Expander` `headless` (the chip is the header). Body: `ChipRow wrap` of the named `colour.*` chips, each with `swatch` (inside a chip the swatch edge is 1 pt `ink`); the current one selected. The radiogroup's `accessibilityLabel` is `fact.colour`. Then `Button secondary` `common.looksRight`, only while the colour is not confirmed. Picking a colour saves it as confirmed and closes; Looks right confirms the shown colour and closes. Tapping the colour chip again closes it. On close, focus returns to the colour chip, which now reads `piece.fact.confirmed`. Same chips and confirmed state as F02 confirm and F08 "Edit colour".

```
 [o Colour Beige ^] (Garment Kurta v)
+-----------------------------------+
| (o Beige#) (o Blush) (o Mauve)    |
| (o Ivory) (o Sage) (o Navy) ...   |
| [Looks right]                     |
+-----------------------------------+
 (Coverage Modest v) (Sparkle Plain v) ...
```

#### S1b Fact Expander (inline on S1)

Opened by any other editable fact chip except Coverage. The same `headless` Expander as S1a. Body: `ChipRow wrap` of the options, the current one selected, then `Button secondary` `common.looksRight` only while the value is suggested. Every fact edits with a ChipRow, whatever the option count (design-system.md > Segmented, exception). The radiogroup's `accessibilityLabel` is the fact key, and each option reads "{option}, {fact key}" as S1 Chip rules > Focus. Picking another option saves it as confirmed and closes; Looks right confirms and closes; tapping the chip again closes. On close, focus returns to the fact chip, which now reads `piece.fact.known`.

Options per chip:

- Garment: `kind.*` for the piece's category. Style: `style.desi`, `style.western`, `style.both`.
- Sparkle: `sparkle.plain`, `sparkle.little`, `sparkle.heavy`, `sparkle.bridal`; label `fact.sparkle`.
- See-through: `value.sheer.no`, `value.sheer.yes`; label `fact.sheer`.
- Fabric, Pattern, Fit, Length, Sleeves, Formality: `value.*`; label `attribute.*`.
- Warmth: `pieceWeather.light`, `pieceWeather.medium`, `pieceWeather.warm`. Rain and Snow: `pieceWeather.fine`, `pieceWeather.avoid`.
- Availability: `closet.available`, `piece.away.wash`, `piece.away.lent`, `piece.away.repair`. Never suggested, so no Looks right.

A pick can change a chip below it, in place, with the label crossfade: Warmth Light turns Season to Summer; a new Fabric can change Season; a suggested Formality follows Sparkle and Fabric (`fitAttributes` -> `formalityFor`) and keeps its dot; a confirmed Formality never changes. A Style or Garment pick that moves the piece into or out of Desi brings Sparkle in or takes it out. After the close, the changed chip's `piece.fact.known` text ("Season: Summer") is announced once, queued, and focus stays on the tapped chip. Nothing is added on screen.

```
 (o Colour Sage v) (Garment Kurta v)
 (Coverage Modest v) [Sparkle Plain ^]
+-----------------------------------+
| (#Plain#) (A little) (Heavy)      |
| (Bridal)                          |
+-----------------------------------+
 (Fabric Lawn v) (* Pattern Solid v) ...
```

#### S1c Coverage Expander (inline on S1)

Opened by the Coverage chip, in either form. The same `headless` Expander. Body: one `ChipRow wrap` per fact the coverage reading uses for this category (`needsDetails` facts): Sleeves and See-through on tops, tunics and layers; Length on bottoms; Sleeves, See-through and Length on dresses and abayas. Each row has its `label` drawn (`attribute.sleeve`, `fact.sheer`, `attribute.length`), because no chip names it, and is a radiogroup with that label. A confirmed value is selected; a suggested value is preselected; an unread one has nothing selected. Then `Button secondary` `common.looksRight`, while any row holds a suggestion.

1. Focus on open: the selected option of the first row that needs an answer (unread or suggested), or that row's first option when it is empty ("Sleeveless, Sleeves"); on a verdict, the first row's selected option.
2. A pick saves that fact as confirmed. Looks right confirms every suggested row. While a row still needs an answer, the body stays open and focus moves to that row: its preselected option, or its first option when empty (the row is already laid out, so at once). Looks right leaves with Inline collapse when no suggestion is left.
3. When no row needs an answer, the body closes. From frame 0 of the collapse it is hidden from VoiceOver and `pointerEvents="none"`. Then the Coverage value crossfades in place to the verdict and its dot fades out. Nothing enters or leaves the chip row. From the Inline collapse end callback plus one frame, `setAccessibilityFocus` goes to the Coverage chip ("Coverage: Fully covered"); the Coverage chip never unmounts, so its ref is always there.
4. Tapping the Coverage chip again closes it, the same way. Answers already given are kept; the chip stays Needs details with the facts still open in its value.

On a verdict, every row is already confirmed, so one pick closes the body, as S1b.

```
 Details
 (o Colour Navy v) (Garment Dress v)
 (Style Western v)
 [* Coverage Needs details ^]
+-----------------------------------+
| Sleeves                           |
| (Sleeveless) (Short) (Elbow)      |
| (#Long#)                          |
| See-through                       |
| (#No#) (Yes)                      |
| Length                            |
| (Hip) (Thigh) (Knee) (Calf)       |
| (Ankle)                           |
| [Looks right]                     |
+-----------------------------------+
 (Fabric Crepe v) ...
```

After Ankle, then Looks right:

```
 Details
 (o Colour Navy v) (Garment Dress v)
 (Style Western v)
 (Coverage Fully covered v)
 (Fabric Crepe v) ...
```

### S2 Edit piece `/piece/edit/[id]`

Purpose: change what the piece is: photo, name, category, set, or remove it. Garment, style and every other fact are edited on S1; Garment shows here only when a new category needs one.

Recipe: Editor.

1. `Screen leading="cancel"`, title `piece.edit.title`. Discard guard (`common.discardTitle`, `common.keepEditing`, `common.discard`) on Cancel, swipe back and the VoiceOver two-finger scrub (`onAccessibilityEscape`), all through expo-router `usePreventRemove`, so no route drops edits.
2. `Tile` `size="hero"`, the current photo variant. Switching between `photo.original` (raw photo, `radius.md` frame) and a cut-out variant crossfades the image and the frame together (`base`, `silk`); the frame never snaps.
3. `ChipRow wrap`, single, `accessibilityLabel` `editor.photoPreview`: `photo.enhanced`, `photo.plain`, `photo.original`, and `photo.clean` only when Clean background is configured. It stays a ChipRow with 3 options too, because the count changes (3 or 4) and the control never swaps type.
4. `Button quiet small`, icon `scissors`: `cutout.adjust` / `cutout.byHand`. Pushes S3. Same order as F02 S2.
5. `Text footnote muted` `photo.cleanNote`, only the first time `photo.clean` is shown on this phone (kept: privacy).
6. `Expander` `editor.changePhoto`. Actions: `common.takePhoto` (secondary), `common.choosePhoto` (quiet).
7. `Field` `piece.name` (label above), placeholder `editor.nameHint`.
8. `ChipRow` `piece.category` (`category.*`), single.
9. `ChipRow` `piece.kind` (`kind.*` for the chosen category), single, only after the category changes (Inline expand), with no garment chosen and `Text footnote error` `piece.kindRequired` directly under it until one is picked.
10. `Button quiet` `sets.remove`, only when the piece is in a set. Part of the draft: pressing it puts a `ResultBar` `sets.removed` with `common.undo` in its place, which stays until Save, Undo or Discard. The removal is written by `common.saveChanges`; Cancel and Discard drop it. The ResultBar text takes focus (it replaced the pressed control), so focus never jumps to Remove piece.
11. `Button destructive` `editor.remove`, at the end of the content.
12. `Footer`: primary `common.saveChanges`, disabled until there is a change and, after a category change, a garment is chosen.

A category change can change which facts apply (`fitAttributes`): back on S1, Coverage (with its Needs details form) and Sparkle follow the new category; nothing is asked on this screen.

Sample piece: rows 3 to 6 are not rendered. Row 9 is optional. A `Text subhead muted` `closet.sample` line sits under the hero instead. On S1 a sample piece works like any other: every fact chip and its Expander, Care label, looks and Put away. It never carries Needs details.

Primary action: `common.saveChanges`.

```
 Cancel          Edit piece
+-----------------------------------+
|            [ cut-out ]            |
+-----------------------------------+
 (#Enhanced#) (Cut-out) (Original)
 (Clean background)
 (scissors) Adjust cut-out
 Clean background sends this photo to Cloudflare.
+-----------------------------------+
| Change photo                    v |
+-----------------------------------+
 Name
 [ Sage kurta                      ]
 Category
 (Hijabs) (Tops) (#Kurtas#) ...
 Remove from set
 Remove piece
===================================
 [          Save changes           ]
```

### S3 Cut-out editor `/cutout/[id]?target=piece`

Purpose: fix the cut-out by holding on the piece or painting the mask.

Recipe: Media.

1. `Screen media leading="cancel"`, title `cutout.title`. Swipe back works until the first edit; after it, Cancel, swipe back and the two-finger scrub go through the discard guard as S2.
2. `CameraFrame` with the canvas (`ink` ground, `radius.lg`), `accessibilityLabel` `editor.photoPreview`. The kept area is the photo at full strength; erased areas show the same photo under `scrim` (0.55). Whenever the mask is shown, a steady 1.5 pt `onMedia` line on a 1 pt `ink` halo runs along the kept-area edge, redrawn on each stroke (motion.md > Outlines on media). Pinch to zoom, two-finger pan, one finger paints. The canvas sits outside the ScrollView, so painting never fights scrolling. The native canvas carries `UIAccessibilityTraitAllowsDirectInteraction`, so VoiceOver users can paint. VoiceOver actions: `cutout.selectPiece` / `cutout.selectPieceN`, `cutout.zoomIn`, `cutout.fit`.
3. `Text subhead onMedia` `cutout.hold`, until the first hold (kept: needed to act).
4. `Segmented`: `cutout.restore`, `cutout.erase`.
5. `Segmented`: `cutout.small`, `cutout.medium`, `cutout.large`, full width with no visible label. `cutout.brush` is the radiogroup's VoiceOver label.
6. CameraFrame controls row: `Button quiet` `common.undo`, `Button quiet` `cutout.reset`, `Button quiet` zoom, whose label crossfades between `cutout.zoomIn` and `cutout.fit`. Zoom in centres on the last stroke or hold point (the centre before any), so one finger or Voice Control reaches any part without pinching.
7. `Footer`: primary `common.done`. Saves the mask at full size whatever the zoom, then pops.

Media rule on S3: Segmented and chips keep their light fills and ink labels; Row titles, checkmarks, quiet Buttons and the hint use onMedia (13.49 on ink); Rows press to plumPressed (8.75).

Primary action: `common.done`.

```
 Cancel            Cut-out
+-----------------------------------+
|###################################|
|####   .-[ photo ]-.         ######|
|####  erased: photo under scrim  ##|
|###################################|
+-----------------------------------+
 Hold on a piece to select it
 [#Restore#|  Erase  ]
 [ Small |#Medium#| Large ]
 Undo   Reset   Zoom in
===================================
 [              Done               ]
```

`.-[ ]-.` the steady edge line around the kept area.

### S4 Care label `/label/[id]?target=piece`

Purpose: record what the piece is made of from its care label.

Recipe: Editor.

1. `Screen leading="cancel"`, title `careLabel.title`. Discard guard as S2.
2. No photo yet: `Text body muted` `careLabel.intro` (kept: needed to act), then `Button secondary` `common.takePhoto` and `Button quiet` `common.choosePhoto`.
3. With a photo: `Tile` (raw photo, `radius.md` frame, full width, VoiceOver `careLabel.photo`), then `Button quiet` `careLabel.takeAnother`. A read problem shows as `Text footnote error` directly under the photo: `careLabel.unreadable` or `careLabel.nothingFound`.
4. `Section` `careLabel.madeOf`: per fibre, `Field` and `Field` side by side, with `Button quiet` icon `minus.circle`, label `careLabel.removeFibre`. The visible labels `careLabel.fibreLabel` and `careLabel.percentLabel` show once, above the first row, as column headings; `careLabel.fibre` and `careLabel.percent` stay as each Field's numbered `accessibilityLabel`. The percent Field shows a `%` suffix in `inkMuted` (5.14 on surface), hidden from VoiceOver. Then `Button quiet` `careLabel.addFibre`. Add moves focus to the new Fibre Field; remove moves it to the next row's Fibre Field, or to Add a fibre when the last row left. At `large` each row stacks (Fibre, Percent, then the remove button under Percent, leading-aligned) and every Field shows its own label.
5. `Field` `careLabel.size`, `Field` `careLabel.brand`, `Field` `careLabel.origin`, labels above.
6. `Button destructive` `careLabel.remove`, only when a care label is saved.
7. `Footer`: primary `common.saveChanges`, disabled until there is something to save.

Rows 4 and 5 show once there is a photo, or when a care label is already saved.

Primary action: `common.saveChanges`.

```
 Cancel          Care label
+-----------------------------------+
|        [ label photo ]            |
+-----------------------------------+
 Take another photo
 Made of
 Fibre             Percent
 [ Cotton        ] [ 95  % ]   (-)
 [ Elastane      ] [ 5   % ]   (-)
 Add a fibre
 Size
 [ M                               ]
 Brand
 [ Khaadi                          ]
 Made in
 [ Pakistan                        ]
 Remove care label
===================================
 [          Save changes           ]
```

### S5 Gone (six routes)

Purpose: say the piece or photo is gone and go back.

Routes: `/piece/[id]`, `/piece/edit/[id]`, `/cutout/[id]?target=piece`, `/label/[id]?target=piece`, `/cutout/[id]?target=import`, `/label/[id]?target=import`.

`Screen gone` under the route's own header (S1 no title, S2 `piece.edit.title`, S3 `cutout.title`, S4 `careLabel.title`): `EmptyState` title `piece.missing.title` (piece targets) or `capture.gone.title` (import targets), action `common.goBack`, which pops to the caller. No form, no canvas, no Footer.

```
 <            Cut-out

     This piece is no longer here
            [ Go back ]
```

## States

| State | Where | What shows |
|---|---|---|
| Default | S1 | Layout above. Wear line always present (`closet.neverWorn` when 0). |
| Empty | S1 | No weather chips for categories without weather traits. No Coverage on hijabs, shoes, bags and accessories. Sparkle only on Desi and both-style pieces and dupattas. No Season when neither Warmth nor Fabric gives one. No Part of a set Section outside a set. No looks: no looks Section; the actions stay as drawn. Care label Row with no meta. |
| Empty | S1 hand-off, no everyday style | `piece.startWith` and `piece.planWith` push F11 Your style first, then land on Today or Adjust. |
| Empty | S4 | No photo: intro line and the two photo buttons; Footer primary disabled. |
| Needs details | S1 | The Coverage chip reads "Coverage: Needs details", tentative, while a fact it reads is unread or suggested, only on owned pieces. A closet saved before the redesign, with suggested sleeves, lands here and one Looks right clears it. It turns to the verdict when the last is confirmed. The Closet tile carries the dot until then (F04). |
| Loading | S1, S2 | The push renders complete (pieces are local, as F09 look detail). Only on a cold deep link before the closet has opened: hero `Silk placeholder` shape `tile`, text rows as hidden-text placeholders, Header and Footer present from the first frame. Late images fade in. |
| Loading | S3 | `Silk placeholder` at the photo rect until it decodes, then `Silk sheen` over the photo while the mask loads (loop keeps running: full-screen wait). Controls and Footer present, Done disabled. |
| Generating | S1 hero and Closet tile | After Save with a new photo: the old photo stays under `Silk sheen` while the piece is re-prepared; the hero is then one VoiceOver image element labelled `capture.statePreparing` with `accessibilityState.busy` (S1 item 2), hidden again when the new cut-out fades in. A confirmed colour and every confirmed fact are kept; newly read facts arrive as suggestions, and Coverage follows them. |
| Generating | S2 Clean background | In-flight rule: `photo.clean` chip disabled with `accessibilityState.busy` (`photo.cleanMaking`); the sheen is on the hero only. Result saves to the piece at once; the chip stays selected after Cancel + Discard, which shows it is already saved. Announces `photo.cleanDone`. |
| Generating | S4 reading | `Silk sheen` over the label photo (`careLabel.reading`), then the read fields fill and `setAccessibilityFocus` goes to the first filled Field. |
| Selecting | S3 | Ring on hold, outline sweep landing on the steady edge line, the new mask applies (Motion). `cutout.selected` or `cutout.noneFound` announced. |
| Busy | S2, S3, S4 | Footer primary `Silk busy`. S1 fact chips and S1c options: in-flight look only after `wait`. |
| Result | S1 | After `closet.putAwayAction`: `ResultBar` `result.putAway` with `common.undo` in place of the Plan a day and Put away lines; the Footer label becomes `closet.backInCloset`, which does the same as Undo and announces `result.backInCloset`, focus staying on the Footer. The ResultBar stays until the screen is left; on the next visit the actions read Add to a look only. The ResultBar text takes focus. After Undo, focus goes to the restored Put away button. |
| Result | S1c | When no row needs an answer: the body collapses, Coverage crossfades from Needs details to the verdict in place, focus on Coverage. Nothing enters or leaves the chip row. |
| Result | S2 | After `sets.remove`: `ResultBar` `sets.removed` with `common.undo` in its place until Save, Undo or Discard. |
| Error | S1 facts, S1c | `Text footnote error` `common.error.save` directly under the open Expander's options. The chip keeps its previous value; in S1c the body stays open and that row keeps its previous selection. |
| Error | S1 Put away | `common.error.save` in place of the ResultBar text, with quiet `common.tryAgain`; the Footer label does not change. |
| Error | S2 | Save fails (including a pending Remove from set): `common.error.save` in the Footer error slot, Footer stays. Missing garment after a category change: `piece.kindRequired` under the Garment ChipRow, Save disabled. Clean background fails: `photo.cleanFailed` under the photo chips, quiet `common.tryAgain`; limit: `photo.cleanLimit`. Original photo stays. |
| Error | S3 | Photo or mask fails to load: `EmptyState` on `media`, title `common.photoOpenFailed`, action `common.goBack`. |
| Error | S4 | `careLabel.unreadable` (photo could not be read) or `careLabel.nothingFound` (read, no text found) under the photo; form stays usable. Save fails: `common.error.save`. Remove fails: `common.error.remove`. |
| Error | Remove piece | `common.error.remove` under `editor.remove`. |
| Offline | S2 | Tapping `photo.clean`: `Text footnote error` `common.offline` under the photo chips, chip not selected. Everything else on F05 is on the phone and works offline. |
| Permission denied | S2 Change photo, S4 | Camera off: `Text footnote error` `common.cameraOff` in place of the error line, with `Button quiet` `common.openSettings`. `common.choosePhoto` still works. |
| First run | S3 | `cutout.hold` shows until the first hold, then leaves without a gap. |
| First run | S2 | `photo.cleanNote` shows the first time `photo.clean` appears, then never again. |
| Gone | S1 to S4 | S5. All six routes pop to the caller. |
| Sample piece | S1, S2 | S1: no Needs details. S2: `closet.sample` line, no photo controls (rows 3 to 6), Garment optional after a category change. |
| Away piece | S1 | Availability chip shows the reason. Footer label `piece.planWith`; no Plan a day line in the actions (Motion > Availability change). The new Footer label is announced once, queued. |
| Put away piece | S1 | Footer label `closet.backInCloset`; pressing it announces `result.backInCloset`, focus stays on the Footer. Actions: Add to a look only. |
| On "I'll never wear" | S1 | Nothing marks it. `piece.startWith` and `piece.planWith` keep it, because she chose it (UC-F11-09). |
| Largest text | S1 | From `large`: Edit becomes the `pencil` icon, label `common.edit` in VoiceOver and the Large Content Viewer. AX3 to AX5: Footer unchanged (one primary, `minHeight` from the tallest label). Fact chips wrap, nothing truncates; a chip whose label wraps takes `radius.md`; the Expander still opens under the tapped chip's line. On a 375 pt phone the Expander body is 311 pt (gutter 16 x 2, Expander padding 16 x 2), 64 pt narrower than canvas. Device check at AX5 (subhead about 53.6 pt), against about 275 pt of label in an option chip and about 249 pt in a tentative fact chip: "Gjennomsiktig", "Tilgjengelig", "Tilgjengelighet", "Hverdagslig", "Formalitet", "reparasjon" and "Brudestas" break at a soft hyphen, never mid-word; the S1c drawn label "Gjennomsiktig" wraps at its hyphen. |
| Largest text | S2, S4 | Fields grow; fibre rows stack as S4 item 4. |
| Largest text | S3 | Each Segmented on its own full-width line showing its options' symbols (`paintbrush`, `eraser`, three `circle.fill` sizes), the words as `accessibilityLabel` (design-system.md > Segmented > Anatomy, media). Undo, Reset and zoom stay in one wrapping row. The canvas stays outside the ScrollView at a minimum of half the screen height; only the controls between canvas and Footer scroll. |
| Bokmål | all | Soft hyphens come from the shared `Text` at render time (`copy.md` rules): `tilgjengelig|het`, `til|gjengelig`, `gjennom|siktig`, `tilbake|still`, and in chip and segment labels from 9 letters (Notes for other roles): `hverdags|lig`, `formali|tet`, `repara|sjon`. Values "Til vask", "Lånt bort", "Til reparasjon", "Mangler detaljer", "Trenger et lag", "Brudestas" and labels like "Gjenopprett", "Ren bakgrunn", "Start med dette plagget" wrap in their containers. |
| Reduce Motion | S1, S2, S3, S4 | Expanders, ResultBars and the Footer label fade. The Expander scroll into view is not animated. S1c close: the body fades, Coverage's label crossfades, neighbours in one frame; focus from the same collapse end callback plus one frame. Hero re-prepare, S3 mask load, Clean background and care label reading show the still band at centre. Cut-out ring fades in, no sweep, outline fades in, holds, fades out; the mask edge line is still. `cutout.hold` leaves and its space closes in one frame. The tentative dot fades out with the base fade. Care label fields fade in together, not `step` apart. Fibre rows fade, neighbours move in one frame. Segmented thumbs crossfade. A chip whose label changes width reflows the ChipRow in one frame. Every other moment per motion.md, reduced column. |

## Motion

All tokens from `motion.md`.

- **Push and pop**: native for S1 to S4. No entrance animation on content; late images fade in (`base`, `silk`).
- **S1a, S1b, S1c open and close**: Inline expand and Inline collapse under the tapped chip's line; the chip lines below reflow with it. Opening one closes the other per the Expander rule. The tapped chip's chevron rotates (Expander chevron, `settle`, `silk`).
- **Fact chip label change** (a pick, Coverage after S1c closes, Season following Warmth or Fabric, a suggested Formality following Sparkle or Fabric): the chip's label crossfades (`base`, `silk`) via the label crossfade in Banners and bars; when its width changes, the following chips in the wrap ChipRow move with `LinearTransition` (`settle`, `silk`). Every changed chip is below the tapped one or is the tapped one. No haptic.
- **Fact answered**: the Expander resolves with Inline collapse; the chip's dot fades out (`quick`, `release`); focus returns to the fact chip.
- **S1c pick that keeps the body open**: the option's selection only (Chip selection); nothing moves. Looks right, when it leaves, goes with Inline collapse.
- **S1c close**: Inline collapse (body hidden from VoiceOver and `pointerEvents="none"` from frame 0), then the Coverage label crossfade as above while its dot fades out (`quick`, `release`). Focus from the collapse end callback plus one frame.
- **Sparkle in or out** (Style or Garment pick): after the collapse, List insert or List remove at its place after Coverage; the chips after it move with `LinearTransition` (`settle`, `silk`).
- **Restore/Erase, Brush**: Segmented thumb (`settle`, `silk`). `selection` haptic on Segmented change only.
- **Footer label** (Put away, Availability change, Back in the closet, Undo): plain label crossfade (Banners and bars). No height change: the button's `minHeight` is the tallest label, measured in the hidden layer.
- **Put away**: the ResultBar crossfades in place of the Plan a day and Put away lines; Undo crossfades them back and focus returns to Put away.
- **Remove from set (S2)**: the ResultBar crossfades in place of the button; Undo crossfades it back.
- **Availability change**: one moment. To an away value, the Plan a day line leaves (List remove), then the Footer label crossfades to Plan a day. Back to Available, the Footer label crossfades to Start with this piece, then the line returns (List insert).
- **S2 photo variant**: image and frame crossfade (`base`, `silk`). Garment ChipRow after a category change: Inline expand.
- **Editor Footer**: S2 and S4 primary crossfades from disabled to `plum` (`quick`, `silk`) when it can act. No height change.
- **Hero re-prepare (generating)**: capture tile preparing pattern on the S1 hero and the Closet tile: `sheen` band over the old photo, loop limit `loop`, cut-out fades in at resolve (`base`, `silk`), no scale. New fact chips enter with List insert after the cut-out.
- **Clean background (generating)**: Studio moment, `sheen` over the hero while the chip is in flight, new image crossfades in (`base`, `silk`). Failure: chip returns with a `quick` crossfade.
- **Care label reading (generating)**: `sheen` over the label photo, then filled fields fade in `step` apart, max 6.
- **Fibre rows**: List insert on `careLabel.addFibre`, List remove on `careLabel.removeFibre`.
- **Cut-out loading**: Loading moment, placeholder then `sheen` over the photo.
- **Cut-out hold (magic moment 3, Selecting an object in an image)**: `selection` haptic on hold; 72 pt `onMedia` ring on its 1 pt `ink` halo (motion.md > Outlines on media) fades in (`quick`); on found the ring fades (`quick`), the mask applies, the outline sweeps from the touch point (`drape`, `silk`) and lands on the steady edge line, the newly erased area dims to `scrim` (`base`), the sweep fades (`base`, `release`). Nothing found: ring fades, `cutout.noneFound`. Any touch ends the sequence at its final state. The `cutout.hold` line fades (`quick`) and its space closes with Inline collapse.
- **Mask edge line**: redrawn with each stroke, no animation of its own.
- **Pinch out past fit**: the canvas eases back to fit (`settle`, `fall`), as does the zoom button's Fit. Under Reduce Motion it is applied at once.
- **Gone**: no motion; the EmptyState is there when the screen is.

## Copy

All keys are in `copy.md` (F02, F04, F05, F12, Revision 1 > F05 Piece facts and F04 Closet sections and filters). Added to `copy.md` for this flow: `fact.sheer` (See-through / Gjennomsiktig, the existing `src/i18n` value, which would otherwise fall under the "not listed is cut" rule). New for this flow: `fact.coverage`, `pieceCoverage.full`, `pieceCoverage.moderate`, `pieceCoverage.layer`, `fact.sparkle`, `sparkle.*`, `fact.season`, `value.season.*`, `piece.needsDetails`.

| Screen | Keys |
|---|---|
| S1 | `common.edit`, `capture.statePreparing`, `piece.wornMany`, `piece.wornOnce`, `closet.neverWorn`, `piece.facts.title`, `piece.needsDetails`, `fact.colour`, `piece.kind`, `piece.style`, `fact.coverage`, `pieceCoverage.full`, `pieceCoverage.moderate`, `pieceCoverage.layer`, `fact.sparkle`, `sparkle.plain`, `sparkle.little`, `sparkle.heavy`, `sparkle.bridal`, `fact.season`, `value.season.*`, `fact.sheer`, `value.sheer.yes`, `value.sheer.no`, `piece.fact.known`, `piece.fact.suggested`, `piece.fact.confirmed`, `common.looksRight`, `pieceWeather.warmth`, `pieceWeather.light`, `pieceWeather.medium`, `pieceWeather.warm`, `pieceWeather.rain`, `pieceWeather.snow`, `pieceWeather.fine`, `pieceWeather.avoid`, `piece.availability`, `closet.available`, `piece.away.wash`, `piece.away.lent`, `piece.away.repair`, `sets.partOf`, `careLabel.title`, `careLabel.fibreItem`, `careLabel.lineSize`, `careLabel.lineBrand`, `careLabel.lineOrigin`, `piece.usedIn.one`, `piece.usedIn.other`, `piece.addToLook`, `piece.planWith`, `closet.putAwayAction`, `closet.backInCloset`, `result.putAway`, `result.backInCloset`, `common.undo`, `common.tryAgain`, `piece.startWith`, `common.error.save`, `attribute.*`, `value.*`, `colour.*`, `kind.*`, `style.desi`, `style.western`, `style.both` |
| S1c | `fact.coverage`, `piece.needsDetails`, `pieceCoverage.*`, `attribute.sleeve`, `attribute.length`, `fact.sheer`, `value.sleeve.*`, `value.length.*`, `value.sheer.yes`, `value.sheer.no`, `common.looksRight`, `piece.fact.known`, `common.error.save` |
| S2 | `piece.edit.title`, `common.cancel`, `editor.photoPreview`, `cutout.adjust`, `cutout.byHand`, `photo.enhanced`, `photo.plain`, `photo.original`, `photo.clean`, `photo.cleanMaking`, `photo.cleanDone`, `photo.cleanFailed`, `photo.cleanLimit`, `photo.cleanNote`, `common.offline`, `common.tryAgain`, `editor.changePhoto`, `common.takePhoto`, `common.choosePhoto`, `common.cameraOff`, `common.openSettings`, `piece.name`, `editor.nameHint`, `piece.category`, `piece.kind`, `piece.kindRequired`, `sets.remove`, `sets.removed`, `common.undo`, `closet.sample`, `editor.remove`, `editor.removeTitle`, `editor.removeUsedOne`, `editor.removeUsedMany`, `common.remove`, `common.error.remove`, `common.saveChanges`, `common.error.save`, `common.discardTitle`, `common.keepEditing`, `common.discard`, `capture.statePreparing` |
| S3 | `cutout.title`, `common.cancel`, `editor.photoPreview`, `cutout.hold`, `cutout.selectPiece`, `cutout.selectPieceN`, `cutout.zoomIn`, `cutout.fit`, `cutout.selected`, `cutout.noneFound`, `cutout.restore`, `cutout.erase`, `cutout.brush`, `cutout.small`, `cutout.medium`, `cutout.large`, `common.undo`, `cutout.reset`, `common.done`, `common.photoOpenFailed`, `common.goBack`, `common.discardTitle`, `common.keepEditing`, `common.discard` |
| S4 | `careLabel.title`, `common.cancel`, `careLabel.intro`, `common.takePhoto`, `common.choosePhoto`, `common.cameraOff`, `common.openSettings`, `careLabel.photo`, `careLabel.takeAnother`, `careLabel.reading`, `careLabel.unreadable`, `careLabel.nothingFound`, `careLabel.madeOf`, `careLabel.fibre`, `careLabel.percent`, `careLabel.fibreLabel`, `careLabel.percentLabel`, `careLabel.removeFibre`, `careLabel.addFibre`, `careLabel.size`, `careLabel.brand`, `careLabel.origin`, `careLabel.remove`, `careLabel.removeTitle`, `common.remove`, `common.error.remove`, `common.saveChanges`, `common.error.save`, `fibre.*`, discard keys as S3 |
| S5 | `piece.missing.title`, `capture.gone.title`, `common.goBack` |

## Use cases

| ID | Screen | States |
|---|---|---|
| UC-F05-01 Read a piece | S1 | Default, Empty, Loading (cold deep link), Largest text, Bokmål. Chip order with Coverage after Garment and Style, Season and Availability last; Coverage by category (blouse, trousers, knee skirt, hijab); look rows push F09, set Rows push the partner |
| UC-F05-02 Confirm a guessed fact | S1 + S1b | Default, Error |
| UC-F05-15 Correct the colour | S1 + S1a | Default, Error, Largest text, Bokmål. Feeds F08 reasons |
| UC-F05-03 Set weather traits | S1 Warmth, Rain, Snow fact chips + S1b | Default, Error. Warmth set on the F02 confirm shows here |
| UC-F05-04 Unavailable or available | S1 Availability fact chip + S1b | Default, Error, Away piece |
| UC-F05-05 Put away and bring back | S1 Put away button, ResultBar, Footer label | Result (no confirm, Undo, `result.backInCloset` announced), Error, Put away piece |
| UC-F05-06 Edit a piece | S2 | Default, Error (`piece.kindRequired`, save), Result (Remove from set), Sample piece, Largest text, Bokmål, discard guard |
| UC-F05-07 Change the photo | S2 Change photo Expander, then S1 hero and Closet tile | Generating (re-prepare, `capture.statePreparing` in VoiceOver), Permission denied |
| UC-F05-08 Adjust the cut-out | S3, from S2 and F02 confirm | Loading, Selecting, Error (`common.photoOpenFailed` + Go back), First run (`cutout.hold`), Largest text, Reduce Motion, discard guard |
| UC-F05-09 Studio photo of an owned piece | S2 `photo.clean` chip | Generating, Offline, Error (`photo.cleanFailed`, `photo.cleanLimit`), saved chip after Discard |
| UC-F05-10 Record the care label | S1 Care label Row -> S4 | Empty, Generating (reading), Error (unreadable, nothing found, remove), Permission denied, Largest text, Bokmål, discard guard |
| UC-F05-11 Remove a piece | S2 `editor.remove`, system alert | Error. Pops past S1 to the caller (Closet or Today), never a tab jump |
| UC-F05-12 Start with this piece today | S1 Footer primary -> F06 | Empty (no everyday style -> F11 first), On "I'll never wear". Not offered on an away or put-away piece |
| UC-F05-16 Plan a day around this piece | S1 `piece.planWith` (action line, or Footer label on an away piece) -> F07 Day row | Default, Away piece. Today's outfit untouched |
| UC-F05-13 Use this piece in a look | S1 `piece.addToLook` action line -> F10 | Default, Empty |
| UC-F05-17 Set sparkle and see season follow | S1 Sparkle chip + S1b; Warmth chip + S1b with the read-only Season chip | Default (Bridal on a kameez, and its suggested Formality follows with its dot; a confirmed Formality stays; Warmth Light turns Season to Summer, announced), Error, Largest text (AX3 to AX5), Bokmål |
| UC-F05-18 Clear Needs details | S1c on a dress (Sleeves and See-through suggested, Length unread), a blouse saved before the redesign (suggested Sleeves, one Looks right), a hijab (no Coverage) | Needs details, Result (Coverage turns from Needs details to the verdict in place, focus on Coverage), Error, Largest text (AX3 to AX5), Bokmål, Reduce Motion |
| UC-F05-14 Open a piece that is gone | S5 on all six routes | Gone |

Also lands on F05: UC-F04-13 steps 2 to 4 (Closet filtered on Needs details, tile, S1c, back with the tile gone), UC-F08-06 step 5 (the colour fixed on Today reads confirmed on S1), UC-F11-09 (a piece on "I'll never wear" still starts with this piece).

## Notes for other roles

- `F02-add-pieces.md`: change S2 item 4 and the "Sparkle, one form" note to "unread Sparkle is Plain, known, no dot" (Looks right confirms it anyway), and show Sparkle only on Desi and both-style pieces and dupattas, as here.
- `copy.md` > F05 Piece facts: `piece.needsDetails` note becomes "(the tentative value of the Coverage chip; opens the first open fact)"; `fact.coverage` is editable (opens the Coverage body), its value `pieceCoverage.*` or `piece.needsDetails`. F12 B: lower the soft-hyphen threshold to 9 letters for chip and segment labels, expected breaks `hverdags|lig`, `formali|tet`, `repara|sjon`.
- `architecture.md`: the "Piece detail" row: Needs details is the tentative value of the Coverage chip, which holds Sleeves, See-through and Length; nothing leaves the row. `needsDetails(piece)` lists the coverage facts that are unread or still proposed, so a piece whose Coverage is `null` always lands in Needs details (F04 filter and dot, F11 completeness count follow). `sparkleOf` row: an unread Sparkle shows as Plain with no dot; `pieceFacts` emits Sparkle, as a known value, only for Desi and both-style pieces and dupattas. Season is read only here, so `factChoice("season")`, which today opens the Fabric options, is no longer reached from piece detail; keep or drop it in the facts row.
- `src/domain/facts.ts`: `askedAttribute` returns `null` for `sheer`, so `factChoice(piece, "sheer")` gives no options today; S1b and S1c edit See-through with `value.sheer.no`, `value.sheer.yes`.
- `use-cases.md`: UC-F05-13 and the `/look/build` entry in the screen tree say "Use in a look"; `copy.md` and UC-F05-01 say "Add to a look" (`piece.addToLook`). One wording before Maestro, the writer's. UC-F05-18 follows the S1c body (all coverage rows at once).
- `design-system.md` 7, Chip `fact`: add the read-only form (no `onPress`: no chevron, no `lineField` edge on canvas, never tentative, no button trait), used by Season.
- Lane 1 device check, nb-NO: the Needs details Coverage chip's custom `accessibilityValue` ("Ermer, Lengde") shares the iOS value with `accessibilityState.expanded`, which RN Fabric writes as an English "expanded"/"collapsed" string. If the open keys are dropped or the state is read in English, move the open keys into the `accessibilityLabel` ("Dekning: Mangler detaljer, Ermer, Lengde").

## Review log

Open:

- `design-system.md` > Segmented contradicts itself on media at `large`: States says a vertical Row list, Anatomy says symbols on full-width lines and names the cut-out editor. F05 S3 now follows Anatomy (the more specific line); the design-system owner removes the other.
- `design-system.md` > Segmented says fact Expander bodies always use a ChipRow. F02 S2 item 5 still opens Style and Warmth as `Segmented`; F02 should switch to match.

Resolved in this pass:

- Coverage holds the facts it reads. On judged categories Sleeves, See-through (and Length on bottoms and dresses) have no chip of their own; Coverage is always editable and opens one body with every coverage fact as a labelled ChipRow, suggestions preselected with Looks right. Its value is the verdict or Needs details (unread or suggested), so nothing enters or leaves the row and a closet saved before the redesign lands in Needs details. The "Suggested coverage fact" state, the "chip leaves instead" branch and the one-fact-at-a-time walk are gone, and with them the S1c next-fact focus timing and the done stagger.
- Every derived chip sits after its sources: Season moved after the weather traits, just before Availability. Season is the only read-only chip.
- S1c focus after close comes from the Inline collapse end callback plus one frame onto the Coverage chip ref; the body is hidden from VoiceOver and pointer events from frame 0.
- Hero: hidden at rest, one busy image element labelled `capture.statePreparing` while re-prepared; key added to S1 Copy.
- A change to a chip below the tapped one is announced once, queued, focus staying on the tapped chip.
- Footer Back in the closet announces `result.backInCloset`, focus stays; key added to S1 Copy.
- Availability chip reads "{value}, {key}" (F12 L).
- Sparkle only on Desi and both-style pieces and dupattas (the stylist reads it only there, architecture sparkle row). Unread Sparkle stays Plain, known, no dot; F02 told to match.
- AX5 check lists the shorter long words and the real label widths (311 pt body, about 275 and 249 pt labels); copy.md asked to lower the soft-hyphen threshold to 9 letters for chip and segment labels.
- Edit becomes the pencil icon from `large`, not AX3.
- Contrast line matches design-system.md 7 Chip > Anatomy.
- Hijab mockup order matches item 6 then 7; kurta caption shortened.
- Header and Entry trimmed; process history moved here.
- Lane 1 nb-NO check for the Needs details value with `expanded`, in Notes.
- Hand-offs added for copy.md (`piece.needsDetails`, `fact.coverage`), architecture.md (Piece detail row, `needsDetails`) and `src/domain/facts.ts` (`sheer` in `factChoice`). The copy.md wording itself is left to its owner: this pass writes only F05.

Earlier passes (built for `architecture.md` "Revision 1 changes" and "Revision 2 changes", the architect response to the "Revision 1 walk" in `advocate-walkthroughs.md`, and UC-F05-01, UC-F05-17, UC-F05-18, UC-F04-13):

- A suggested Formality follows Sparkle and Fabric with its dot; a confirmed one never changes (UC-F05-17).
- Footer `minHeight` from the tallest label; a Footer label change from a pick is announced once.
- Read-only fact chips drop the `lineField` edge.
- Availability change is one moment in Motion. Put away: the ResultBar stays until the screen is left, Back in the closet does the same as Undo.
- F09 calendar Most worn rows added to Entry.
- Fact chips carry the design-system `chevron.down`, and the open chip's mark is the turned chevron. One open mark, not two.
- C5-01: Coverage is judged by category and only shown as a verdict from confirmed facts, so a long-sleeved blouse reads Fully covered and nothing reads a suggestion as a verdict.
- C5-02: Needs details covers only the facts the category's coverage reading needs, never on a hijab, shoes, bag, accessory or sample piece.
- Detail recipe focus rule (focus on the title when the push ends) is in design-system.md and used here.

Declined:

- Season as an editable fact. Known limit: on tops, tunics, bottoms and dresses there is no Warmth, so a wrong Season (a lawn kurta worn all year) can only change through Fabric, and the Closet Season filter follows it. Owner round 2 asks for "season" as a fact, not how it is set; raise in the next owner round before making it editable.
- A "Trying to wear more of" toggle on piece detail. Preferences have one home (architecture hand-off rule 10): Profile.
- A wear button or "Wore today" on piece detail. Not taken by the owner (round 2); the wear line reads what other screens record.
- A step count ("1 of 2") in the Coverage body. Every row is drawn with its label; the chip's VoiceOver value lists what is left.
- A line explaining why Season cannot be set. The missing chevron says it (`copy.md`).
- Cutting `careLabel.save` from copy.md: F02 S6 still uses it. F05 S4 uses `common.saveChanges`.
- Care label action name ("Add care label" / "Edit care label") and its large-text placement: no longer needed, the Row has a chevron and no trailing action, so it is one element read as "Care label, 95% cotton, 5% elastane".
- Style as a read-only Row on a sample piece in S2: Style is no longer on S2.

Contrast checked: ink/canvas 13.49, inkMuted/canvas 5.40, placeholder key/sunken 4.64, ink/sunken 11.59, plum dot/sunken 5.92, inkMuted chevron/sunken 4.64, ink/blush 7.12, selected option edge #9A5A52/surface 5.05, unselected lineField/surface 3.18, lineField chip edge/canvas 3.34, plum/plumSoftPressed 5.20 (pressed plumSoftDeep 4.71), error/surface 6.88, error/canvas 7.23, onMedia/ink 13.49, onMedia/plumPressed 8.75, media primary plum/onMedia 6.89. S3 Segmented and chips keep light fills with ink labels on media; S3 kept-area edge gets a steady onMedia line on an ink halo.
