# F01 Start

Date: 2026-10-03. Phase 2, flow design. Routes: gate (`app/index.tsx`, not a route), `/onboarding`, `/onboarding/colours`. Sources: `architecture.md` (Owner decisions win), `use-cases.md` F01 rows, `design-system.md`, `motion.md`, `copy.md`. Components are the design-system names only. Copy is written as keys; the English value is shown in wireframes for reading.

Entry: cold launch. Exit: Today (returning user), or the done step, which hands off to F02 (Add pieces with Closet under it) or F06 (Today on the sample closet).

## Screens

### S1 Splash and gate

Purpose: show the scarf A while the closet opens, then hand off to Today or onboarding.

Layout, top to bottom:

1. Splash overlay (`motion.md` > Splash): white canvas, `tile.png` 160 pt centred, `mark.png` draping onto it. The `tile.png` and `mark.png` image views are hidden from VoiceOver; the overlay container is not, so its error state (S2) stays reachable. At hand-off focus goes to the destination's registered header.
2. Under the overlay the gate mounts the destination once it knows it: `/(tabs)/today` when `closet.styling.onboarded` is set, `/onboarding` step 1 when it is not. The flag lives in the closet, so the gate knows only after the closet opens. Until hand-off the mounted destination has `accessibilityElementsHidden` and `importantForAccessibility="no-hide-descendants"`, so the VoiceOver cursor cannot land on elements the overlay covers.
3. If the closet has not opened at drape end, the overlay keeps the still mark (no loop, no extra motion) until the gate knows where to go, then hands off. If the hold passes `wait`, `common.loading` is announced once (queued). Today's `Silk placeholder` FlatLay shows only once the destination is known to be Today and its outfit is still loading. Onboarding never sits behind a Today placeholder.

```
+--------------------------------+
|                                |
|                                |
|                                |
|           +--------+           |
|           |   /\   |           |
|           |  /--\  |  plum     |
|           | /    \ |  tile     |
|           +--------+           |
|                                |
|                                |
|          white canvas          |
+--------------------------------+
```

Primary action: none.

### S2 Closet could not open

Purpose: the one way out when stored data will not open.

A splash state, not an `EmptyState`: the splash overlay does not fade out. The tile and the still mark stay at their exact centred 160 pt rect, and below the tile the title and the button fade in (`base`, `silk`) with nothing moving: `space.xl` / `Text title` `start.error.title` (Georgia, centred, `accessibilityRole="header"`) / `space.xl` / `Button primary` `common.tryAgain` (`Silk` busy while reopening). No header, no Footer. At `ax` the block under the tile scrolls; the tile stays.

```
+--------------------------------+
|                                |
|                                |
|                                |
|           +--------+           |
|           |   /\   |           |
|           |  /--\  |           |
|           | /    \ |           |
|           +--------+           |
|                                |
|   Could not open your closet   |
|                                |
|        ( Try again )           |
+--------------------------------+
```

VoiceOver: the overlay sets `accessibilityViewIsModal`, so nothing under it is reachable. The tile and mark stay hidden; the title and Try again are normal elements. When the title fades in, focus moves to it. A retry that fails again ends the busy state, announces `start.error.title` once (queued) and keeps focus on Try again. Success hands off as the splash does (M1) to Today, or to onboarding on first run.

Primary action: `common.tryAgain`.

### S3 Onboarding step (shared frame)

Purpose: one short question set per step, answerable or left empty.

Frame for every step 1 to 5, top to bottom:

1. `Screen` with no header title and `progress { step, total: 6 }`: the `Silk progress` bar under the header (2 pt `plum` fill on its 1 pt `lineField` track, 3.34 on canvas, so the total shows) is the only progress mark. The bar is hidden from VoiceOver; the step title carries `accessibilityValue { text: onboarding.progressLabel }` ("Step 2 of 6"), so the step is read where focus lands.
2. `leading`: back chevron on steps 2 to 6, which returns to the previous step with its answers kept. Steps change in place inside one route, so the route has `gestureEnabled: false` on every step except step 1 on replay, where swipe back and the chevron both pop to Profile. Between steps the chevron is the only way back. Step 1 on first run has no leading item and no swipe.
3. Step title: `Text` `title` (Georgia), `accessibilityRole="header"`, value as item 1. No intro sentence.
4. Step content in `Section`s (below). A focused `Field` scrolls into view above the Footer and the keyboard per `motion.md` > Inline expand (worklet `scrollTo`, `settle`, `silk`; not animated under Reduce Motion).
5. `Footer`: one full-width `primary` `onboarding.next`, always enabled. There is no Skip. Chips, Tiles and Segmented controls save on tap, so an unanswered step advances with Next. A typed field (city, height) must resolve or be valid before Next advances; clearing the field is the way past it.
6. Save error: a failed chip, tile or segment write shows `common.error.save` as `Text footnote error` directly under the ChipRow, Segmented or Tile grid that failed, entering with inline expand and announced once (queued), as Field errors do. The answer stays selected. Next retries the write and advances when it lands. No error slot on the Footer.

```
+--------------------------------+
| <                              |
| ======-------------------------|  <- progress, 2 of 6
|                                |
| Units and city                 |  <- title, Georgia
|                                |
| [ step content ]               |
|                                |
|                                |
|--------------------------------|
| (            Next            ) |  <- Footer
+--------------------------------+
```

Primary action: `onboarding.next`.

#### Step 1 Hijab and coverage

Title `onboarding.hijab.title`. The block is F11 Your style's hijab-and-coverage block, as is. Both questions are single `ChipRow`s, like step 4: nothing is selected until she answers.

- `ChipRow` single, label `style.hijab`: `hijab.always`, `hijab.sometimes`, `hijab.notNeeded`. Never answered shows no chip selected; the domain tells never answered from Sometimes (`architecture.md` > Domain touches, `hijabAnswered`).
- `ChipRow` single, label `coverage.levelLabel`: `coverage.full`, `coverage.moderate`, `coverage.own`. The labels wrap inside their chips. The Own line chip carries `accessibilityState.expanded`.
- Only with `coverage.own`: `ChipRow` single `coverage.sleevesLabel` (`coverage.toElbow`, `coverage.toWrist`, `coverage.anyLength`) and `ChipRow` single `coverage.hemLabel` (`coverage.toCalf`, `coverage.toAnkle`, `coverage.anyLength`). They open in place under Coverage with F11's inline expand.

```
| Hijab and coverage             |
|                                |
| Hijab                          |
| (Always) (Sometimes)           |
| (Not needed)                   |
|                                |
| Coverage                       |
| (Full: wrist and ankle)        |
| (Moderate: elbow and mid-calf) |
| [Own line]                     |
|                                |
| Sleeves                        |
| (To elbow) (To wrist)          |
| (Any length)                   |
| Hem                            |
| (To calf) (To ankle)           |
| (Any length)                   |
```

Each answer saves on tap (in-flight rule). Finishing onboarding writes the everyday style from these answers (`architecture.md`, Domain touches).

#### Step 2 Units and city

Title `onboarding.place.title`.

- `Segmented`: `onboarding.units.metric`, `onboarding.units.imperial` (VoiceOver `onboarding.units.metricLabel`, `onboarding.units.imperialLabel`). Always has a value.
- `Field` text, label `onboarding.city.label`, `returnKeyType="search"`, error slot for not found and offline. The return key and Next both run the lookup; there is no Find button.
- Found: the Field shows the resolved city name; no extra line. `onboarding.city.found` is a VoiceOver announcement only.
- `Text footnote muted` `onboarding.city.privacy` (kept: privacy).

```
| Units and city                 |
|                                |
| [ cm and °C | ft and °F ]      |
|                                |
| City                           |
| [ Oslo                      ]  |
| Only the city is sent to       |
| Apple, for the weather.        |
```

Next with a typed, unresolved city runs the lookup (Next busy) and advances only when found. An empty Field advances.

VoiceOver: a city found from the return key announces `onboarding.city.found` once (queued). From Next, the step change and the title focus are the confirmation; nothing is announced. When Next fails on the city, focus moves to the Field, which reads its label, value and error once.

#### Step 3 Body

Title `onboarding.body.title`.

- Metric: `Field` `onboarding.height.label` (VoiceOver `onboarding.height.labelVoice`), error `onboarding.height.invalid`.
- Imperial: label `onboarding.height.labelImperial`, two `Field`s side by side, `onboarding.height.feet` and `onboarding.height.inches` (VoiceOver `...feetLabel`, `...inchesLabel`), one error under both, `onboarding.height.invalidImperial`.
- `Section` `onboarding.shape.question`: a `Tile` grid of seven: the six shapes (`tint` drawings, `shape.*` labels) and `shape.none` as the seventh Tile, same size, its label centred where a drawing would be. All seven use the Tile selected disc. The grid is one `radiogroup`; each Tile is `radio` with `accessibilityState.selected`, so VoiceOver counts "of 7".

```
| Body                           |
|                                |
| Height (cm)                    |
| [ 165                       ]  |
|                                |
| Body shape                     |
| +----------+  +----------+     |
| |   /\/\   |  |   )  (  ●|     |
| +----------+  +----------+     |
|  Pear          Hourglass       |
|  ... 6 shape tiles ...         |
| +----------+                   |
| |  Prefer  |                   |
| | not to say                   |
| +----------+                   |
```

Units come from step 2; Back to step 2 to switch. An empty height advances.

VoiceOver: when Next fails on the height, focus moves to the Field with the error, which reads its label, value and error once.

#### Step 4 Your taste

Title `onboarding.taste.title`. Three single `ChipRow`s, each optional:

- `onboarding.fit.question`: `onboarding.fit.loose`, `onboarding.fit.structured`, `onboarding.depends`.
- `onboarding.colourLean.question`: `onboarding.colourLean.bold`, `onboarding.colourLean.soft`, `onboarding.depends`.
- `onboarding.styleLean.question`: `style.desi`, `style.western`, `style.both`.

```
| Your taste                     |
|                                |
| Fit                            |
| (Loose) (Structured)           |
| (It depends)                   |
| Colours                        |
| (Bold) (Soft) (It depends)     |
| Style                          |
| (Desi) (Western) (Both)        |
```

#### Step 5 Your colours

Title `onboarding.colours.title`.

- `Row` `colours.selfie`, leading icon `camera`, trailing `chevron`: pushes S4.
- `space.xxl`.
- `ChipRow` single, label `onboarding.colours.swatch` ("Skin tone"): nine `Chip`s with `swatch` (the skin tones), label `depth.*`, `undertone.*` ("Medium, warm"). Inside a Chip the swatch edge is `ink` at 1 pt (11.59 on sunken, 7.12 on blush), so light tones show. A tap saves at once.
- `Text body` `colours.season` ("Season: Warm autumn") under the chips. Its height is reserved from the first frame: laid out at opacity 0 and hidden from VoiceOver (as Footer > Waiting), measured for the longest season at the current text size, and re-measured on `fontScale`, Bold Text and language change. When colours are saved it fades in place; a change crossfades. Nothing above or below moves. Each appearance or change announces `colours.season` once (queued); focus stays on the chip.

```
| Your colours                   |
|                                |
| [cam] Take a selfie          > |
|                                |
| Skin tone                      |
| (o Light, cool) (o Light, ..)  |
| (o Medium, warm) ...           |
| ... 9 chips ...                |
|                                |
| Season: Warm autumn            |
```

#### Step 6 Done

Purpose: hand off into the loop.

- Same frame, `progress` 6 of 6, back chevron to step 5.
- In the upper third, as `EmptyState` places it: the still mark (`mark.png` on `tile.png`, `brandMark` size) / `space.xl` / title `onboarding.done.title`. The mark closes the loop the splash opened and is hidden from VoiceOver.
- `Footer`: `secondary` `sample.try` and `primary` `closet.addPieces`. "Try the sample closet" wraps at half width in `headline`, so the pair is stacked per Footer: secondary above, both full width. While one is busy the other is disabled (`design-system.md` > Footer, corrupting writes).

```
+--------------------------------+
| <                              |
| ===============================|
|                                |
|           +------+             |
|           |  /\  |             |
|           +------+             |
|                                |
|          You are set           |
|                                |
|                                |
|--------------------------------|
| (    Try the sample closet   ) |
| (         Add pieces         ) |
+--------------------------------+
```

Primary action: `closet.addPieces`. It replaces onboarding with the tab shell on the Closet tab and pushes `/capture` on it in the same commit, so Back from Add pieces shows the Closet empty state and Today never flashes. `sample.try` replaces onboarding with the tab shell on Today, styling from the sample closet.

### S4 Colours (selfie)

Purpose: measure skin, eyes and hair from a selfie and save the season. Entry: step 5 `colours.selfie`, Profile > Change colours > `colours.selfie`.

One route, phases in place, one scrolling `Screen` on `canvas` in every phase, back chevron. The `CameraFrame` frame is the first scroll child: full width, aspect 3:4, `ink` inside `radius.lg`. Below `ax` it keeps one rect in every phase, so the photo never moves. At `ax` its height is capped at 50 percent of the window height and everything under it scrolls. A phase change replaces what is in and under the frame; the scroll view goes to the top in one frame.

Canvas colours under the frame (`design-system.md` > CameraFrame, canvas screens): the shutter is a `plum` 76 pt ring with a 60 pt `plum` inner disc and a 4 pt `canvas` gap between them (6.89); disabled is the `inkDisabled` ring with no disc, so enabled and disabled differ as filled against empty. The `controls` are `quiet` Buttons in canvas colours: `plum` label (6.89), pressed `sunken` (5.92).

#### S4a Camera (live)

`CameraFrame` with the front camera, `oval` find or ready, `guide` pill `selfie.guide.*`, `shutter` (`common.takePhoto`, enabled when the oval is ready), `controls`: `quiet` `colours.library` / `Text subhead inkMuted` `colours.camera.privacy` (kept: privacy). No Footer: the shutter is the action.

Guide pill: `maxWidth` is the frame width minus 2 x `space.lg`; the text wraps freely, never `numberOfLines`. `minHeight` is held at the tallest measured string of `selfie.guide.*` and the retake reasons at the current text size, Bold Text and language (`motion.md` > Banners and bars). Its width and height never jump when the text changes.

At `ax` the shutter sits directly under the frame, so it is always in the first viewport, then the guide as `subhead` `ink`, then `colours.library`, then the privacy line last. VoiceOver order stays guide, shutter, library, privacy (`experimental_accessibilityOrder` on the container).

```
+--------------------------------+
| <                              |  canvas
| +----------------------------+ |
| |                            | |
| |        .-""""-.            | |
| |       :        :  oval     | |
| |       :        :           | |
| |        `-....-'            | |
| |    ( Look into the camera )| |  guide pill
| +----------------------------+ |
|              (@)               |  shutter, plum ring and disc
|     Choose a recent selfie     |
| The selfie stays on this phone.|
+--------------------------------+
```

Primary action: shutter.

Retake: when measuring cannot read the photo, the route returns to this layout with the live camera. The reason (`common.light.dark`, `common.light.mixed`, `colours.retake.no-face` or `colours.retake.failed`) sits in the guide pill slot until the guide state next changes after `dwell`. The shutter is the try again; the library stays in `controls`. No extra state, no Footer.

#### S4b Measuring

The frame holds the still selfie under `Silk sheen` / `Text subhead inkMuted` `colours.busy`. No Footer.

```
+--------------------------------+
| <                              |
| +----------------------------+ |
| | //    selfie, sheen   //   | |
| |   //                 //    | |
| |                            | |
| +----------------------------+ |
| Measuring your colours         |
+--------------------------------+
```

#### S4c Result

Top to bottom, the result first:

1. The frame with the selfie and `points` (Skin, Eyes, and Hair when not covered).
2. `Text title` `season.*` alone ("Warm autumn"), Georgia, `accessibilityRole="header"`.
3. `Section` `colours.best`: the season palette as `swatch` dots at `thumb` size in a wrapping row. The dots keep the `swatch` 1 pt `lineField` inner edge (3.34 on canvas), so ivory, cream and blush show against white.
4. `Expander` plain, title `colours.adjust`, closed. Body: `Row` toggle `colours.hairCovered` / `Segmented` `colours.undertone` (`undertone.*`) / `Segmented` `colours.depth` (`depth.*`) / `Segmented` `colours.contrast` (`contrast.*`).
5. `Footer` `secondary` `common.tryAgain` (back to S4a), `primary` `colours.save`. At `ax` only Save colours stays pinned.

The season title and the palette hold the height of the tallest season title and the largest palette, measured at the current width and text size and re-measured on `fontScale`, Bold Text and language change, so a change never moves anything below them.

```
+--------------------------------+
| <                              |
| +----------------------------+ |
| |      selfie                | |
| |       (o) hair             | |
| |    (o) eyes                | |
| |       (o) skin             | |
| +----------------------------+ |
| Warm autumn                    |  Georgia
|                                |
| Colours that suit you          |
| o o o o o o                    |
|                                |
| Adjust                       v |  Expander, closed
|--------------------------------|
| ( Try again )  ( Save colours )|
+--------------------------------+
```

`colours.hairCovered` starts on only when step 1 hijab is Always; on hides the Hair point and the season is measured from skin and eyes. Its value persists, so a retake does not bring Hair back. Each toggle or Segmented change updates the season title and the palette at once. Primary action: `colours.save`, which pops to the step (or Profile answer) with the season line in place.

Points: each is a 44 pt target. Measured positions are pushed apart so centres sit at least 44 pt apart, and clamped so each centre sits at least 22 pt inside the frame rect, so the `radius.lg` clip never cuts a hit area. Where hit areas still overlap, the topmost point wins the touch, as in FlatLay. Dragging a point remeasures its colour. The three Segmented controls in the Adjust Expander are the non-drag way to change the result (WCAG 2.5.7).

#### S4 VoiceOver

- S4a and S4b: the live feed and the still selfie under the sheen are hidden from VoiceOver. The guide pill and `colours.busy` carry the state, so S4a reads guide, shutter, library, privacy.
- The S4c photo is `colours.photo`. Each point is labelled `colours.skin`, `colours.eyes` or `colours.hair`, with the measured `colour.*` as `accessibilityValue`, and has `accessibilityActions` Move up, Move down, Move left and Move right, each stepping a fixed amount inside the clamped rect. After a move the new value is announced.
- The palette `Section` is one element labelled "Colours that suit you: rust, olive, ..." (`colours.best` and the `colour.*` names joined); the dots are hidden.
- A phase replaces the focused element in place, so the replacement takes focus: shutter pressed, then `setAccessibilityFocus` on the `colours.busy` text (busy state). Result, then focus the season title (it is read as a header, not announced). Retake, then focus the guide pill holding the reason.
- A point move or drag, toggle or Segmented change that changes the season announces `colours.season` once (queued), after the new value for a point; focus stays on the point or control.
- After `colours.save` pops back to step 5 or Profile, `colours.season` is announced once (queued). This replaces step 5's own announcement for that change.

## States

| State | Screen | What shows |
|---|---|---|
| Loading, launch | S1 | Splash drape. If the closet is still opening at drape end, the overlay keeps the still mark until the gate knows the destination; past `wait`, `common.loading` is announced once. When that is Today and its outfit is still loading, Today's `Silk placeholder` FlatLay, one VoiceOver element `common.loading`, resolves with the Loading fade. Onboarding never shows behind a Today placeholder. Never a spinner, never a text screen between splash and the destination |
| Loading, warm launch | S1 | Nothing. Today as it was |
| Loading, measuring | S4b | `Silk sheen` over the selfie, `colours.busy` visible and as the VoiceOver label with `accessibilityState.busy`, focused |
| Loading, lookup | S3 step 2 | Next busy while the lookup runs, from the return key or Next. The Field stays editable |
| Generating | Today after `sample.try` | Today's FlatLay arranges the first outfit (Motion, M4). No first-run card: the everyday style was written at finish |
| Empty | S3 steps | Nothing chosen: every ChipRow unselected, Hijab and Coverage included, Next still advances. Step 5 with nothing saved keeps the season line's space empty |
| Empty | Closet after `closet.addPieces` | F04 empty state under Add pieces, reached by Back |
| Error, closet | S2 | The splash tile stays; `start.error.title` and `common.tryAgain` fade in below; the overlay is VoiceOver modal |
| Error, save answer | S3 any step | `common.error.save` under the ChipRow, Segmented or Tile grid that failed, answer kept selected, Next retries |
| Error, height | S3 step 3 | `onboarding.height.invalid` or `onboarding.height.invalidImperial` under the Field; Next stays on the step and focuses the Field |
| Error, city | S3 step 2 | `onboarding.city.notFound` under the Field; from Next, focus moves to the Field |
| Error, camera failed | S4a | The guide pill is replaced in place by `colours.cameraFailed` on `scrimPill`; the shutter stays rendered, disabled; `controls` in canvas colours: `quiet` `common.tryAgain` (restarts the camera) and `quiet` `colours.library`. No measuring state starts |
| Error, retake | S4b to S4a | The live camera returns in the same frame with the reason in the guide pill slot, focused. The shutter retakes; `colours.library` stays in `controls` |
| Error, save colours | S4c | `common.error.save` as the last block of the scroll content, directly above the Footer (no Footer slot), result kept, announced once; focus stays on Save colours |
| Offline | S3 step 2 | `common.offline` under the city Field, distinct from not found. Nothing else in F01 needs the network: the selfie is measured on the phone |
| Permission asking | S4a | The empty ink frame, the disabled shutter and `controls`, under the system camera prompt |
| Permission denied | S4a | Inside the ink frame: `EmptyState` media variant, `title` `common.cameraOff` in `onMedia` (13.49), action `common.openSettings` with `onMedia` fill and `plum` label (6.89), pressed `plumSoft` (6.02). The shutter stays rendered and disabled, and `controls` keeps `quiet` `colours.library`, so the layout is the same in asking, denied and live. At `ax` the frame grows to fit its EmptyState (no live photo to keep still), so nothing clips. Library path still measures |
| Interrupted | S4b | Back while measuring cancels: the step is unchanged, nothing lands later, the temp selfie is deleted, reopening starts at S4a |
| First run | S3 | Step 1 with no back item. `gestureEnabled: false` on every step; the chevron moves between steps. Relaunch after finishing skips onboarding |
| Replay | S3 | From Profile (F11): answers prefilled. Step 1 has a back chevron, and swipe back is on there only; both pop to Profile. Steps 2 to 6: `gestureEnabled: false`, the chevron goes to the previous step |
| Reduce Motion | all | See Motion |
| Largest text (AX3) | all | ChipRows wrap; chips grow in height. `Segmented` becomes a vertical list of `Row`s. Shape `Tile` grid goes to 1 column, each Tile's label uncapped. At `ax` the imperial Fields stack. Footer pins only the primary; Try the sample closet and Try again become a `quiet` Button at the end of the scroll content. Step title `title` caps at 2.0x. S4: the frame is capped at 50 percent of the window height; under it, in order: shutter, guide (`subhead` `ink`), library, privacy line (`subhead` `inkMuted`). S4c: the Adjust Expander header moves its value under the title; its body scrolls with the content. Nothing truncates |
| Bokmål | all | Progress VoiceOver "Steg 2 av 6", title Georgia wraps. Long words carry soft hyphens at the joins `copy.md` lists: eksempel|garderoben (`sample.try`), kamera|tilgang (`common.cameraOff`), inn|stillinger (`common.openSettings`). The done Footer pair is stacked. Coverage chips ("Moderat: albue og midt på leggen") wrap inside the chip. Guide strings run up to 72 percent longer than English; the pill wraps and holds the tallest measured height |

## Motion

| Moment | Where | Motion (tokens from `motion.md`) | Reduce Motion |
|---|---|---|---|
| M1 Splash drape | S1 cold launch | `motion.md` > Splash: mark opacity 0 to 1 (`base`, `silk`), translateY -10 to 0 (`drape`, `fall`); hand-off at drape end once the destination is known; overlay fades out (`settle`, `silk`) over a screen that is already complete. Focus goes to the registered header | Mark fades in (`base`), overlay fades out (`base`) |
| M2 Launch hold | S1 to Today or onboarding | Closet not open at drape end: the overlay keeps the still mark, nothing loops or moves, until the gate knows the destination; then M1's hand-off. Past `wait`, `common.loading` announced once. Only when the destination is Today and its outfit is still loading: placeholder at once, band after `wait`, resolves with content fade (`base`, `silk`). Never Generating on launch | Same hold; still placeholder, `base` fade |
| M2b Closet error | S1 to S2 | The overlay stays. Title and Try again fade in below the still tile (`base`, `silk`); nothing moves | Same fade |
| M3 Step change | S3 Next, Back | Header and Footer hold still. Outgoing content opacity 1 to 0 (`quick`, `release`); incoming content after `step`, opacity 0 to 1, translateY 4 to 0 (`base`, `silk`), the inline-expand content entrance. Progress fill grows as `Silk progress` (`base`, `silk`). Scroll resets to top in one frame. Focus to the step title, which reads the step value. No swipe between steps | Content crossfade (`base`), progress steps in one frame |
| Field into view | S3 steps 2 and 3 | A focused Field below the fold scrolls above the Footer and keyboard with worklet `scrollTo` (`settle`, `silk`), as Inline expand | `scrollTo` not animated |
| M4 First outfit | Today after `sample.try` | Generating moment, with every slot new: the FlatLay starts as its `Silk placeholder`, then each piece plays the incoming half of the flat lay piece swap (opacity 0 to 1, translateY -6 to 0, `arrange`, `fall`) in dressing order, `step` apart. Announce `today.announce.outfit` once | Pieces crossfade in together (`base`) |
| M5 Hand-off to Add pieces | Step 6 to `/capture` | Native push over the Closet tab; no tab animation (Tab switch: none) | System |
| Selection | Chips, Tiles, Segmented, swatches | Selection crossfade (`quick`, `silk`); Segmented thumb (`settle`, `silk`); `press` on every control; `selection` haptic on a segment change only | Per `motion.md` |
| Own line | S3 step 1 | Sleeves and Hem open with F11's inline expand (`settle`, `silk`, content after `step`); Full or Moderate closes them with inline collapse. Nothing above moves | Layout in one frame, text fades in (`base`); collapse fades out (`base`), then layout in one frame |
| City found | S3 step 2 | The found line enters with inline expand (`settle`, `silk`); a changed name uses the label crossfade | Layout in one frame, text fades in (`base`) |
| Errors | S2, S3, S4 | Error text enters with inline expand under the control that failed; announced once, queued | Layout in one frame, text fades in (`base`) |
| Season line | S3 step 5, S4c | Step 5: the line fades in its reserved space (`base`, `silk`); later changes use the label crossfade. S4c: season title and palette use the label crossfade, height held at the larger measured size, so nothing below moves | Fade `base`; height in one frame after the fade |
| Selfie oval | S4a | `find` to `ready`: dashed to solid crossfade (`quick`, `silk`); guide pill text crossfades with its size held; spoken only after `dwell`, at most every `announce` | Same |
| Camera to still | S4a to S4b | Shutter: the frame keeps its rect and the still selfie replaces the feed in place (`quick`, `silk`). Under the frame, shutter, library and privacy line fade out (`quick`, `release`) and `colours.busy` fades in (`base`, `silk`). The ground stays `canvas` | Crossfade `base` |
| Measuring | S4b | Loading moment `sheen` over the selfie: band after `wait`, `sheen` per pass, `carry`, `wait` between passes (full-screen wait, keeps looping) | Still band at centre after `wait` |
| Result | S4b to S4c | Band fades out (`quick`); points fade in (`base`, `silk`); everything under the frame (season title, palette, Adjust header) fades in together in one `base`, `silk` fade, no stagger | All fade in together (`base`) |
| Adjust | S4c | The Expander opens and closes with inline expand and collapse; chevron rotates (`settle`, `silk`) | Layout in one frame, content fades (`base`) |
| Retake | S4b to S4a | Band fades out (`quick`); the live feed returns in the frame; the reason crossfades into the guide pill slot; shutter and controls fade in (`base`, `silk`) | Crossfade `base` |
| Hair point | S4c toggle | Point fades out (`quick`, `release`) or in (`base`, `silk`); season title and palette update with the label crossfade | Fade `base` |
| Point drag | S4c | Follows the finger, no easing while down; on release nothing settles past the finger | Same |

Haptics: `selection` on a Segmented change only (Units, and the three in Adjust). Chips and tiles stay silent (`motion.md` > Haptics). Nothing else in F01 fires a haptic.

## Copy

All keys exist in `copy.md` > F01 Start, F11 and F12 App-wide. `onboarding.done.title` and `colours.adjust` are reinstated there (see the copy.md review log).

| Screen | Keys |
|---|---|
| S1 | `common.loading` |
| S2 | `start.error.title`, `common.tryAgain` |
| S3 frame | `onboarding.progressLabel`, `common.back`, `onboarding.next`, `common.error.save` |
| Step 1 | `onboarding.hijab.title`, `style.hijab`, `hijab.always`, `hijab.sometimes`, `hijab.notNeeded`, `coverage.levelLabel`, `coverage.full`, `coverage.moderate`, `coverage.own`, `coverage.sleevesLabel`, `coverage.hemLabel`, `coverage.toElbow`, `coverage.toWrist`, `coverage.toCalf`, `coverage.toAnkle`, `coverage.anyLength` |
| Step 2 | `onboarding.place.title`, `onboarding.units.metric`, `onboarding.units.metricLabel`, `onboarding.units.imperial`, `onboarding.units.imperialLabel`, `onboarding.city.label`, `onboarding.city.found`, `onboarding.city.notFound`, `common.offline`, `onboarding.city.privacy` |
| Step 3 | `onboarding.body.title`, `onboarding.height.label`, `onboarding.height.labelImperial`, `onboarding.height.labelVoice`, `onboarding.height.feet`, `onboarding.height.feetLabel`, `onboarding.height.inches`, `onboarding.height.inchesLabel`, `onboarding.height.invalid`, `onboarding.height.invalidImperial`, `onboarding.shape.question`, `shape.*` (with `shape.none`) |
| Step 4 | `onboarding.taste.title`, `onboarding.fit.question`, `onboarding.fit.loose`, `onboarding.fit.structured`, `onboarding.depends`, `onboarding.colourLean.question`, `onboarding.colourLean.bold`, `onboarding.colourLean.soft`, `onboarding.styleLean.question`, `style.desi`, `style.western`, `style.both` |
| Step 5 | `onboarding.colours.title`, `colours.season`, `season.*`, `colours.selfie`, `onboarding.colours.swatch`, `depth.*`, `undertone.*` |
| Step 6 | `onboarding.done.title` (reinstated), `closet.addPieces`, `sample.try` |
| S4a | `common.takePhoto`, `selfie.guide.*`, `colours.library`, `colours.camera.privacy`, `colours.cameraFailed`, `common.tryAgain`, `common.cameraOff`, `common.openSettings`, `common.light.dark`, `common.light.mixed`, `colours.retake.no-face`, `colours.retake.failed` |
| S4b | `colours.busy` |
| S4c | `colours.photo`, `colours.skin`, `colours.eyes`, `colours.hair`, `colours.adjust` (reinstated), `colours.hairCovered`, `season.*`, `colours.season` (announcement), `colours.undertone`, `colours.depth`, `colours.contrast`, `undertone.*`, `depth.*`, `contrast.*`, `colours.best`, `colour.*`, `colours.save`, `common.tryAgain`, `common.error.save` |
| Today (M4) | `today.announce.outfit` |

## Use cases

| ID | Screen | States |
|---|---|---|
| UC-F01-01 | S1, then Today | Loading, launch (M1, M2, still-mark hold on a slow open); warm launch; Reduce Motion |
| UC-F01-02 | S2 | Error, closet ("Could not open your closet"); a failed retry is announced; retry lands on Today |
| UC-F01-03 | S3 steps 1 to 6 | First run, empty (step 2 left empty, Next; step 5 nothing chosen, Next), error save answer under the control that failed, Back keeps answers, no swipe between steps, largest text, bokmål; relaunch skips onboarding; finish writes the everyday style |
| UC-F01-04 | S3 step 2 | Lookup from the return key and from Next (loading), error city, offline, found announced from the return key |
| UC-F01-05 | S3 step 3 | Error height (metric and imperial) focuses the Field, `shape.none` Tile clears the shape, largest text |
| UC-F01-06 | S3 step 5 | Swatch saves at once, season line in its reserved space under the chips, announced, bokmål |
| UC-F01-07 | S4a, S4b, S4c | Permission asking, guide states, measuring (loading, focused), result with Hair covered by hijab answer, the Adjust Expander with three Segmented controls, point Move actions, save (announced), retake reasons in the guide pill, library path, Reduce Motion |
| UC-F01-08 | S4a | Permission denied, same layout as live |
| UC-F01-09 | S3 step 6, then F02 over Closet | Hand-off M5, Closet empty under Add pieces, no Today flash |
| UC-F01-10 | S3 step 6, then Today | Generating (M4), no first-run card, sample closet in use |
| UC-F01-11 | S4a | Error, camera failed; library path still measures |

Also touched here, owned elsewhere: UC-F11-05 (Replay state), UC-F12-04 (offline city), UC-F12-05 (Interrupted measuring), UC-F12-06 (splash and measuring under Reduce Motion).

## Notes for other roles

- UI designer: this flow made these `design-system.md` edits: Size and touch > `swatch` (ink edge inside a Chip) and `brandMark`, Screen > `progress` example ("Step 2 of 6"), Footer > Busy (the corrupting-writes exception), Segmented > Used for (Units labels from `copy.md`; Hijab moved to ChipRow), Chip > `choice` (no haptic), Silk > `progress` (`lineField` track), Button and EmptyState (media variant inside any ink frame), EmptyState (the mark on the done step and its size, and S2 as a splash state, not an EmptyState), CameraFrame (selfie on canvas, `controls` colours, the canvas shutter with a `plum` disc, disabled shutter on canvas, `ax` order with the shutter first) and Screen recipes (selfie out of Media).
- Copy writer: `splash.label` is removed from `copy.md` (the overlay's images are never reachable by VoiceOver). F01 no longer uses `onboarding.progress`, `common.skip`, `onboarding.city.find` or `onboarding.hijab.question`; cut them if no other flow does.

## Review log

- Progress shown twice: took "drop the header title, keep the bar". Round 2: the bar is now hidden from VoiceOver and the step title carries "Step 2 of 6" as its value, so focus on a step change reads it; one element, no clutter. The bar's remaining track is a 1 pt `lineField` line (3.34), so the total shows.
- Skip: took the lone full-width Next. An empty field advances and clearing a field is the way past an unresolved city or invalid height, so Skip has no job. The AX3 finding about the save error sitting above the quiet Skip is moot: save errors now sit under the control that failed.
- Camera to still contrast during the ink-to-canvas crossfade: moot. Every S4 phase is on `canvas`, so there is no ground crossfade and the header tint never changes.
- Season line on step 5: did both fixes, moved under the swatch ChipRow and its height reserved from the first frame.
- Shape question: did both fixes, `shape.none` is the seventh Tile and the seven are one radiogroup ("of 7").
- Step title grammar: declined. `onboarding.taste.title` and `onboarding.colours.title` are shared with the Profile row labels and `colours.title` in `copy.md`, where "Your" marks the user's own answers; "Hijab and coverage", "Units and city" and "Body" name topics, and "You are set" is the done state. Noted in `copy.md` review log.
- Permission denied: the frame's EmptyState action is `common.openSettings`, not `colours.library`, because the library already sits in `controls`; one action, one place.
- Contrast evidence (WCAG 2.2) checked: every pair passes; the ink swatch edge inside a Chip is the only change it led to.
- Round 2, all blocking findings fixed: splash images hidden instead of the overlay, S2 modal; plum shutter disc on canvas; canvas `controls` colours; EmptyState media variant inside the ink frame; denied frame grows at `ax`; shutter first under the frame at `ax`; Hijab and Coverage as single ChipRows with nothing preselected (domain row `hijabAnswered`); no swipe between steps; done step mark first; S4c controls in one closed Adjust Expander; splash hold written into `motion.md` with M2b.
- Round 2, minor: all applied except the 3 by 3 swatch-led grid on step 5. Declined: `Chip` has no swatch-only kind, a 14 pt dot alone does not tell "Light, cool" from "Light, neutral", and a new chip kind for one screen adds a component. The label is now "Skin tone" and the "Or" is gone.
