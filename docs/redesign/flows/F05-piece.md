# F05 Piece

Date: 2026-10-03. Phase 2 flow doc. Routes: `/piece/[id]`, `/piece/edit/[id]`, `/cutout/[id]?target=piece`, `/label/[id]?target=piece`. Built only from `design-system.md` components plus native navigation and system alerts. Timing from `motion.md`, words from `copy.md`.

Entry: Closet tile, Today check card "Open {name}", look detail piece row, a set partner Row on another piece. Exit: Back. Hand-offs (architecture.md, flow table):

- `piece.startWith` -> F06 Today with the piece kept and the `today.banner.started` banner. With no everyday style, F11 Your style first, then Today.
- `piece.planWith` -> F07 Adjust with the piece kept and the Day row focused.
- `piece.addToLook` -> F10 builder with the piece placed.
- A look row under the looks section -> F09 look detail.

## Screens

### S1 Piece detail `/piece/[id]`

Purpose: see one piece, fix what the app got wrong, and send it to an outfit.

Recipe: Detail (hero / title / meta / Sections / Footer with the one primary).

1. `Screen` (no header title, the piece name is the title). `HeaderItem` text `common.edit` on the right.
2. `Tile` `size="hero"`: the piece cut-out on `canvas` at `elevation.rest`. One image element for VoiceOver, labelled name and colour ("Sage kurta, sage").
3. `Text title` (Georgia): piece name, `accessibilityRole="header"`. Focus lands on it when the push ends (Detail recipe rule).
4. `Text subhead muted`, the wear line: `piece.wornMany` / `piece.wornOnce` / `closet.neverWorn`.
5. `Section` `piece.facts.title`:
   - `ChipRow wrap` of fact `Chip`s, in this order: colour (with `swatch`), garment (`kind.*`; the category follows from it and is not shown), style (not shown when the garment fixes it, as F02), attributes (`attribute.*`: fabric, pattern, fit, length, sleeves, formality, season), weather traits (Warmth for coat, layer and hijab; Rain and Snow for shoes), availability. Each chip is `piece.fact.known` key and value, except availability, which shows the value only ("Available", "In the wash"), as Closet tiles do. A suggested value is `tentative` (needs-an-answer dot). The availability chip is always there, so the row is never empty. A kurta has about 11 chips (drawn below).
   - Every fact chip opens its `Expander` (S1a for colour, S1b for the rest), tentative or confirmed. Each chip is `accessibilityRole="button"` with `accessibilityState.expanded`. VoiceOver label: `piece.fact.suggested` when tentative, `piece.fact.confirmed` for a colour the owner confirmed, else `piece.fact.known` (availability included, so it reads "Availability: Available").
   - The open chip's 2 pt border (transparent on every fact chip, as on choice chips) turns `ink` (13.49 on canvas) while its Expander is open, so the chip keeps its width and Zoom or AX3 users can see which chip opened it. No blush, no chevron.
   - One Expander open at a time. It opens directly under the chip line that holds the tapped chip, as a full-width item in the wrap; the following chip lines reflow below it (Inline expand, anchored at its top). The line breaks are read from each chip's `onLayout`, so the chips above never move.
   - Focus: on open, `setAccessibilityFocus` goes to the selected option chip. `experimental_accessibilityOrder` places the body directly after the tapped chip; Lane 1 device check. If it fails, the natural order is used (body after the last chip on that line, as drawn) and the focus moves on open and close keep it usable. Opening announces nothing else.
6. In a set: `Section` `sets.partOf` with one `Row` per partner piece: `thumb` leading, the partner's name, `chevron`. Pushes that piece's S1. No meta.
7. Care label `Row`: title `careLabel.title`, meta the fibre line (`careLabel.fibreItem` per fibre, joined with `Intl.ListFormat` `type: "unit"`, `style: "narrow"`: "95% cotton, 5% elastane") then `careLabel.lineSize`, `careLabel.lineBrand`, `careLabel.lineOrigin` when recorded; no meta when none is recorded. Trailing `chevron`. One element. Pushes S4.
8. Looks, only when the piece is in one or more: `Section` titled `piece.usedIn.one` / `piece.usedIn.other`, no Section action. One `Row` per look: `lay` leading, look name, `chevron`. Push F09.
9. Actions, at the end of the content: `Button quiet` with a leading icon, one per line, leading-aligned, `space.sm` apart:
   - `piece.addToLook`, icon `plus`. Always.
   - `piece.planWith`, icon `calendar`. Only when the Footer primary is `piece.startWith` (not on an away or put-away piece).
   - `closet.putAwayAction`, icon `archivebox`. Not on a put-away piece. Acts at once, no alert: a `ResultBar` `result.putAway` with `common.undo` takes the place of the Plan a day and Put away lines, and the Footer label crossfades to `closet.backInCloset`. Undo restores both lines and the Footer label; focus returns to Put away.
10. `Footer`: one primary in every state, full width. Only its label changes, by crossfade: `piece.startWith` by default, `piece.planWith` on an away piece (wash, lent, repair), `closet.backInCloset` on a put-away piece. The Footer never changes height.

Primary action: `piece.startWith`.

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
 (o Colour Sage) (Garment Kurta)
 (Style Desi) (* Fabric Lawn)
 (* Pattern Solid) (* Fit Straight)
 (* Length Calf) (* Sleeves Elbow)
 (* Formality Smart) (* Season Summer)
 (Available)

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

No looks, end of the screen: the actions keep their icons and their own lines, so they read as a list of actions, not stray links.

```
 Care label                        >

 + Add to a look
 [cal] Plan a day
 [box] Put away
===================================
 [      Start with this piece      ]
```

`(o ...)` swatch chip, `(* ...)` tentative fact chip with the plum dot, `(#...#)` selected chip (blush), `[...]` open fact chip (ink edge).

#### S1a Colour Expander (inline on S1)

Opened by the colour chip. `Expander` with no header of its own (the chip is the header). Body: `ChipRow wrap` of the named `colour.*` chips, each with `swatch` (inside a chip the swatch edge is 1 pt `ink`); the current one selected. The radiogroup's `accessibilityLabel` is `fact.colour`. Then `Button secondary` `common.looksRight`, only while the colour is not confirmed. Picking a colour saves it as confirmed and closes; Looks right confirms the shown colour and closes. Tapping the colour chip again closes it. On close, focus returns to the colour chip, which now reads `piece.fact.confirmed`. Same chips and confirmed state as F02 confirm and F08 "Not this colour?".

A confirmed colour feeds the hijab reasons on Today (F08). It is data, not a hand-off: nothing navigates.

```
 [o Colour Beige] (Garment Kurta)
+-----------------------------------+
| (o Beige#) (o Blush) (o Mauve)    |
| (o Ivory) (o Sage) (o Navy) ...   |
| [Looks right]                     |
+-----------------------------------+
 (Style Desi) ...
```

#### S1b Fact Expander (inline on S1)

Opened by any other fact chip. The same headerless `Expander` as S1a: the chip is the only header. Body: `ChipRow wrap` of the options, the current one selected, then `Button secondary` `common.looksRight` only while the value is suggested. Every fact edits with a ChipRow, whatever the option count (design-system.md > Segmented, exception). The radiogroup's `accessibilityLabel` is the fact key (`piece.kind`, `piece.style`, `attribute.*`, `pieceWeather.warmth`, `pieceWeather.rain`, `pieceWeather.snow`, `piece.availability`). Picking another option saves it as confirmed and closes; Looks right confirms and closes; tapping the chip again closes. On close, focus returns to the fact chip, which now reads `piece.fact.known`.

Options per chip:

- Garment: `kind.*` for the piece's category. Style: `style.desi`, `style.western`, `style.both`. Attributes: `value.*`.
- Warmth: `pieceWeather.light`, `pieceWeather.medium`, `pieceWeather.warm`. Rain and Snow: `pieceWeather.fine`, `pieceWeather.avoid`.
- Availability: `closet.available`, `piece.away.wash`, `piece.away.lent`, `piece.away.repair`. Never suggested, so no Looks right.

```
 (* Pattern Solid) (* Fit Straight)
 [* Length Calf] (* Sleeves Elbow)
+-----------------------------------+
| (Hip) (Knee) (#Calf#) (Ankle)     |
| [Looks right]                     |
+-----------------------------------+
 (* Formality Smart) ...
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

Sample piece: rows 3 to 6 are not rendered. Row 9 is optional. A `Text subhead muted` `closet.sample` line sits under the hero instead. On S1 a sample piece works like any other: every fact chip and its Expander, Care label, looks and Put away.

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
2. `CameraFrame` with the canvas (`ink` ground, `radius.lg`), `accessibilityLabel` `editor.photoPreview`. The kept area is the photo at full strength; erased areas show the same photo under `scrim` (0.55). Whenever the mask is shown, a steady 1.5 pt `onMedia` line on a 1 pt `ink` halo runs along the kept-area edge, redrawn on each stroke (camera and photo rule: 13.49, reads on white and dark garments, as motion.md > Outlines on media). Pinch to zoom, two-finger pan, one finger paints. The canvas sits outside the ScrollView, so painting never fights scrolling. The native canvas carries `UIAccessibilityTraitAllowsDirectInteraction`, so VoiceOver users can paint. VoiceOver actions: `cutout.selectPiece` / `cutout.selectPieceN`, `cutout.zoomIn`, `cutout.fit`.
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
| Empty | S1 | No weather chips for categories without weather traits. No Part of a set Section outside a set. No looks: no looks Section; the actions stay as drawn. Care label Row with no meta. |
| Empty | S1 hand-off, no everyday style | `piece.startWith` and `piece.planWith` push F11 Your style first, then land on Today or Adjust. |
| Empty | S4 | No photo: intro line and the two photo buttons; Footer primary disabled. |
| Loading | S1, S2 | The push renders complete (pieces are local, as F09 look detail). Only on a cold deep link before the closet has opened: hero `Silk placeholder` shape `tile`, text rows as hidden-text placeholders, Header and Footer present from the first frame. Late images fade in. |
| Loading | S3 | `Silk placeholder` at the photo rect until it decodes, then `Silk sheen` over the photo while the mask loads (loop keeps running: full-screen wait). Controls and Footer present, Done disabled. |
| Generating | S1 hero and Closet tile | After Save with a new photo: the old photo stays under `Silk sheen` while the piece is re-prepared (`capture.statePreparing` in VoiceOver); the new cut-out fades in. A confirmed colour is kept. |
| Generating | S2 Clean background | In-flight rule: `photo.clean` chip disabled with `accessibilityState.busy` (`photo.cleanMaking`); the sheen is on the hero only. Result saves to the piece at once; the chip stays selected after Cancel + Discard, which shows it is already saved. Announces `photo.cleanDone`. |
| Generating | S4 reading | `Silk sheen` over the label photo (`careLabel.reading`), then the read fields fill and `setAccessibilityFocus` goes to the first filled Field. |
| Selecting | S3 | Ring on hold, outline sweep landing on the steady edge line, the new mask applies (Motion). `cutout.selected` or `cutout.noneFound` announced. |
| Busy | S2, S3, S4 | Footer primary `Silk busy`. S1 fact chips: in-flight look only after `wait`. |
| Result | S1 | After `closet.putAwayAction`: `ResultBar` `result.putAway` with `common.undo` in place of the Plan a day and Put away lines; the Footer label becomes `closet.backInCloset`. The ResultBar text takes focus. After Undo, focus goes to the restored Put away button. |
| Result | S2 | After `sets.remove`: `ResultBar` `sets.removed` with `common.undo` in its place until Save, Undo or Discard. |
| Error | S1 facts | `Text footnote error` `common.error.save` directly under the open Expander's options. The chip keeps its previous value. |
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
| Sample piece | S2 | `closet.sample` line, no photo controls (rows 3 to 6), Garment optional after a category change. |
| Away piece | S1 | Availability chip shows the reason. Footer label `piece.planWith`; no Plan a day line in the actions. |
| Put away piece | S1 | Footer label `closet.backInCloset`. Actions: Add to a look only. |
| Largest text (AX3) | S1 | Footer unchanged (one primary). Fact chips wrap, nothing truncates; the Expander still opens under the tapped chip's line. Edit becomes the `pencil` icon. |
| Largest text | S2, S4 | Fields grow; fibre rows stack as S4 item 4. |
| Largest text | S3 | Restore / Erase and Brush each become a `Row` list (radiogroup; Brush labelled `cutout.brush`); Undo, Reset and zoom stay in one wrapping row. Rows, chips and labels follow the S3 media rule. The canvas stays outside the ScrollView at a minimum of half the screen height; only the controls between canvas and Footer scroll. |
| Bokmål | all | Soft hyphens: `tilgjengelig|het`, `til|gjengelig` (`closet.available` chip), `tilbake|still`. Availability values "Til vask", "Lånt bort", "Til reparasjon" and labels like "Gjenopprett", "Ren bakgrunn", "Start med dette plagget" wrap in their containers. |
| Reduce Motion | S1, S2, S3, S4 | Expanders, ResultBars and the Footer label fade. The Expander scroll into view is not animated. Hero re-prepare, S3 mask load, Clean background and care label reading show the still band at centre. Cut-out ring fades in, no sweep, outline fades in, holds, fades out; the mask edge line is still. `cutout.hold` leaves and its space closes in one frame. The tentative dot fades out with the base fade. Care label fields fade in together, not `step` apart. Fibre rows fade, neighbours move in one frame. Segmented thumbs crossfade. A chip whose label changes width reflows the ChipRow in one frame. Every other moment per motion.md, reduced column. |

## Motion

All tokens from `motion.md`.

- **Push and pop**: native for S1 to S4. No entrance animation on content; late images fade in (`base`, `silk`).
- **S1a and S1b**: Inline expand and Inline collapse under the tapped chip's line; the chip lines below reflow with it. Opening one closes the other per the Expander rule. The open chip's edge fades to `ink` (`quick`, `silk`).
- **Fact chip label change**: the chip's label crossfades (`base`, `silk`) via the label crossfade in Banners and bars; when its width changes, the following chips in the wrap ChipRow move with `LinearTransition` (`settle`, `silk`). No haptic.
- **Fact answered**: the Expander resolves with Inline collapse; the chip's dot fades out (`quick`, `release`); focus returns to the fact chip.
- **Restore/Erase, Brush**: Segmented thumb (`settle`, `silk`). `selection` haptic on Segmented change only.
- **Footer label** (Put away, Availability change, Back in the closet, Undo): plain label crossfade (Banners and bars). No height change.
- **Put away**: the ResultBar crossfades in place of the Plan a day and Put away lines; Undo crossfades them back and focus returns to Put away.
- **Remove from set (S2)**: the ResultBar crossfades in place of the button; Undo crossfades it back.
- **Away lines**: the Plan a day line leaves and returns with List remove and List insert at the end of the content.
- **S2 photo variant**: image and frame crossfade (`base`, `silk`). Garment ChipRow after a category change: Inline expand.
- **Editor Footer**: S2 and S4 primary crossfades from disabled to `plum` (`quick`, `silk`) when it can act. No height change.
- **Hero re-prepare (generating)**: capture tile preparing pattern on the S1 hero and the Closet tile: `sheen` band over the old photo, loop limit `loop`, cut-out fades in at resolve (`base`, `silk`), no scale.
- **Clean background (generating)**: Studio moment, `sheen` over the hero while the chip is in flight, new image crossfades in (`base`, `silk`). Failure: chip returns with a `quick` crossfade.
- **Care label reading (generating)**: `sheen` over the label photo, then filled fields fade in `step` apart, max 6.
- **Fibre rows**: List insert on `careLabel.addFibre`, List remove on `careLabel.removeFibre`.
- **Cut-out loading**: Loading moment, placeholder then `sheen` over the photo.
- **Cut-out hold (magic moment 3, Selecting an object in an image)**: `selection` haptic on hold; 72 pt `onMedia` ring on its 1 pt `ink` halo (motion.md > Outlines on media) fades in (`quick`); on found the ring fades (`quick`), the mask applies, the outline sweeps from the touch point (`drape`, `silk`) and lands on the steady edge line, the newly erased area dims to `scrim` (`base`), the sweep fades (`base`, `release`). Nothing found: ring fades, `cutout.noneFound`. Any touch ends the sequence at its final state. The `cutout.hold` line fades (`quick`) and its space closes with Inline collapse.
- **Mask edge line**: redrawn with each stroke, no animation of its own.
- **Pinch out past fit**: the canvas eases back to fit (`settle`, `fall`), as does the zoom button's Fit. Under Reduce Motion it is applied at once.
- **Gone**: no motion; the EmptyState is there when the screen is.

## Copy

All keys are in `copy.md` (F02, F04, F05, F12). New for this flow: `piece.fact.confirmed`, `pieceWeather.rain`, `pieceWeather.snow`, `pieceWeather.fine`, `pieceWeather.avoid`, `careLabel.fibreItem`, `careLabel.fibreLabel`, `careLabel.percentLabel`, `cutout.zoomIn`, `cutout.fit`, `sets.removed`.

| Screen | Keys |
|---|---|
| S1 | `common.edit`, `piece.wornMany`, `piece.wornOnce`, `closet.neverWorn`, `piece.facts.title`, `fact.colour`, `piece.kind`, `piece.style`, `piece.fact.known`, `piece.fact.suggested`, `piece.fact.confirmed`, `common.looksRight`, `pieceWeather.warmth`, `pieceWeather.light`, `pieceWeather.medium`, `pieceWeather.warm`, `pieceWeather.rain`, `pieceWeather.snow`, `pieceWeather.fine`, `pieceWeather.avoid`, `piece.availability`, `closet.available`, `piece.away.wash`, `piece.away.lent`, `piece.away.repair`, `sets.partOf`, `careLabel.title`, `careLabel.fibreItem`, `careLabel.lineSize`, `careLabel.lineBrand`, `careLabel.lineOrigin`, `piece.usedIn.one`, `piece.usedIn.other`, `piece.addToLook`, `piece.planWith`, `closet.putAwayAction`, `closet.backInCloset`, `result.putAway`, `common.undo`, `common.tryAgain`, `piece.startWith`, `common.error.save`, `attribute.*`, `value.*`, `colour.*`, `kind.*`, `style.desi`, `style.western`, `style.both` |
| S2 | `piece.edit.title`, `common.cancel`, `editor.photoPreview`, `cutout.adjust`, `cutout.byHand`, `photo.enhanced`, `photo.plain`, `photo.original`, `photo.clean`, `photo.cleanMaking`, `photo.cleanDone`, `photo.cleanFailed`, `photo.cleanLimit`, `photo.cleanNote`, `common.offline`, `common.tryAgain`, `editor.changePhoto`, `common.takePhoto`, `common.choosePhoto`, `common.cameraOff`, `common.openSettings`, `piece.name`, `editor.nameHint`, `piece.category`, `piece.kind`, `piece.kindRequired`, `sets.remove`, `sets.removed`, `common.undo`, `closet.sample`, `editor.remove`, `editor.removeTitle`, `editor.removeUsedOne`, `editor.removeUsedMany`, `common.remove`, `common.error.remove`, `common.saveChanges`, `common.error.save`, `common.discardTitle`, `common.keepEditing`, `common.discard`, `capture.statePreparing` |
| S3 | `cutout.title`, `common.cancel`, `editor.photoPreview`, `cutout.hold`, `cutout.selectPiece`, `cutout.selectPieceN`, `cutout.zoomIn`, `cutout.fit`, `cutout.selected`, `cutout.noneFound`, `cutout.restore`, `cutout.erase`, `cutout.brush`, `cutout.small`, `cutout.medium`, `cutout.large`, `common.undo`, `cutout.reset`, `common.done`, `common.photoOpenFailed`, `common.goBack`, `common.discardTitle`, `common.keepEditing`, `common.discard` |
| S4 | `careLabel.title`, `common.cancel`, `careLabel.intro`, `common.takePhoto`, `common.choosePhoto`, `common.cameraOff`, `common.openSettings`, `careLabel.photo`, `careLabel.takeAnother`, `careLabel.reading`, `careLabel.unreadable`, `careLabel.nothingFound`, `careLabel.madeOf`, `careLabel.fibre`, `careLabel.percent`, `careLabel.fibreLabel`, `careLabel.percentLabel`, `careLabel.removeFibre`, `careLabel.addFibre`, `careLabel.size`, `careLabel.brand`, `careLabel.origin`, `careLabel.remove`, `careLabel.removeTitle`, `common.remove`, `common.error.remove`, `common.saveChanges`, `common.error.save`, `fibre.*`, discard keys as S3 |
| S5 | `piece.missing.title`, `capture.gone.title`, `common.goBack` |

## Use cases

| ID | Screen | States |
|---|---|---|
| UC-F05-01 Read a piece | S1 | Default, Empty, Loading (cold deep link), Largest text, Bokmål. Look rows push F09, set Rows push the partner |
| UC-F05-02 Confirm a guessed fact | S1 + S1b | Default, Error |
| UC-F05-15 Correct the colour | S1 + S1a | Default, Error, Largest text, Bokmål. Feeds F08 reasons |
| UC-F05-03 Set weather traits | S1 Warmth, Rain, Snow fact chips + S1b | Default, Error. Warmth set on the F02 confirm shows here |
| UC-F05-04 Unavailable or available | S1 Availability fact chip + S1b | Default, Error, Away piece |
| UC-F05-05 Put away and bring back | S1 Put away button, ResultBar, Footer label | Result (no confirm, Undo), Error, Put away piece |
| UC-F05-06 Edit a piece | S2 | Default, Error (`piece.kindRequired`, save), Result (Remove from set), Sample piece, Largest text, Bokmål, discard guard |
| UC-F05-07 Change the photo | S2 Change photo Expander, then S1 hero and Closet tile | Generating (re-prepare), Permission denied |
| UC-F05-08 Adjust the cut-out | S3, from S2 and F02 confirm | Loading, Selecting, Error (`common.photoOpenFailed` + Go back), First run (`cutout.hold`), Largest text, Reduce Motion, discard guard |
| UC-F05-09 Studio photo of an owned piece | S2 `photo.clean` chip | Generating, Offline, Error (`photo.cleanFailed`, `photo.cleanLimit`), saved chip after Discard |
| UC-F05-10 Record the care label | S1 Care label Row -> S4 | Empty, Generating (reading), Error (unreadable, nothing found, remove), Permission denied, Largest text, Bokmål, discard guard |
| UC-F05-11 Remove a piece | S2 `editor.remove`, system alert | Error. Pops past S1 to the caller (Closet or Today), never a tab jump |
| UC-F05-12 Start with this piece today | S1 Footer primary -> F06 | Empty (no everyday style -> F11 first). Not offered on an away or put-away piece |
| UC-F05-16 Plan a day around this piece | S1 `piece.planWith` (action line, or Footer label on an away piece) -> F07 Day row | Default, Away piece. Today's outfit untouched |
| UC-F05-13 Use this piece in a look | S1 `piece.addToLook` action line -> F10 | Default, Empty |
| UC-F05-14 Open a piece that is gone | S5 on all six routes | Gone |

## Review log

Open:

- `design-system.md` > Segmented > Anatomy says a media Segmented never becomes a list (symbols at `large`), while the media rule and this flow use Row lists at `large`. F05 follows the Row list; the architect picks one line for design-system.md.
- `design-system.md` > Segmented now says fact Expander bodies always use a ChipRow. F02 S2 item 5 still opens Style and Warmth as `Segmented`; F02 should switch to match.
- Detail recipe focus rule (focus on the title when the push ends) is now in design-system.md; F09 look detail should follow it.

Declined:

- Cutting `careLabel.save` from copy.md: F02 S6 still uses it. F05 S4 uses `common.saveChanges`.
- Care label action name ("Add care label" / "Edit care label") and its large-text placement: no longer needed, the Row has a chevron and no trailing action, so it is one element read as "Care label, 95% cotton, 5% elastane".
- Style as a read-only Row on a sample piece in S2: Style is no longer on S2.

Contrast checked: ink/canvas 13.49, inkMuted/canvas 5.40, placeholder key/sunken 4.64, ink/sunken 11.59, plum dot/sunken 5.92, ink/blush 7.12, blushStrong/surface 3.06 (IC 5.05), lineField chip edge/surface 3.18, plum/plumSoftPressed 5.20 (pressed plumSoftDeep 4.71), error/surface 6.88, error/canvas 7.23, onMedia/ink 13.49, onMedia/plumPressed 8.75, media primary plum/onMedia 6.89. Fixed: S3 Segmented and chips keep light fills with ink labels on media (they were onMedia white, 1.16 and 1.00); S3 kept-area edge gets a steady onMedia line on an ink halo (the scrim edge alone was 1.00 to 1.94 on dark and mid garments).
