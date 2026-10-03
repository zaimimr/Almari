# F01 Start

Date: 2026-10-03, revision 1. Phase 2, flow design. Routes: gate (`app/index.tsx`, not a route), `/onboarding` (ten steps and done), `/onboarding/colours`. Sources: `architecture.md` (Owner decisions, Onboarding, Revision 1 and 2 changes), `owner-feedback.md` rounds 1 and 2, `advocate-walkthroughs.md` (Revision 1 walk, architect response), `use-cases.md` F01 rows, `design-system.md`, `motion.md`, `copy.md`. Components are the design-system names only. Copy is written as keys; the English value is shown in wireframes for reading.

Entry: cold launch, a morning notification tap, Profile > Replay onboarding, Profile > Reset all data. Exit: Today (returning user, or "Tomorrow's outfit" from the 21:00 tap), or the done step, which hands off to F02 (Add pieces with Closet under it) or F06 (Today on the sample closet).

Not in this flow: Body and the colour lean left onboarding and live on Profile (F11, UC-F01-05). The wear calendar lives under Looks (F09, `/looks/calendar`).

## Screens

### S1 Splash and gate

Purpose: show the scarf A while the closet opens, then hand off to Today or onboarding.

Layout, top to bottom:

1. Splash overlay (`motion.md` > Splash): white canvas, `tile.png` 160 pt centred, `mark.png` draping onto it. The `tile.png` and `mark.png` image views are hidden from VoiceOver; the overlay container is not, so its error state (S2) stays reachable. At hand-off focus goes to the destination's registered header.
2. Under the overlay the gate mounts the destination once it knows it: `/(tabs)/today` when `closet.styling.onboarded` is set, `/onboarding` step 1 when it is not. The flag lives in the closet, so the gate knows only after the closet opens. Until hand-off the mounted destination has `accessibilityElementsHidden` and `importantForAccessibility="no-hide-descendants"`, so the VoiceOver cursor cannot land on elements the overlay covers.
3. Notification tap: the gate reads the tap response's `data.day` (`notificationPlan`). `today` lands on Today's outfit; `tomorrow` lands on Today in the "Tomorrow's outfit" state (F06, UC-F06-23). A tap only exists once `onboarded` is set, because `finishOnboarding` creates the schedule (step 9). The splash plays the same way; Today never plays Generating on a cold launch (`motion.md` > Splash > Notification tap). A warm tap has no splash.
4. If the closet has not opened at drape end, the overlay keeps the still mark (no loop, no extra motion) until the gate knows where to go, then hands off. If the hold passes `wait`, `common.loading` is announced once (queued). Today's `Silk placeholder` FlatLay shows only once the destination is known to be Today and its outfit is still loading. Onboarding never sits behind a Today placeholder.

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

Purpose: the one way out when stored data will not open (owner round 1, item 1).

A splash state, not an `EmptyState`: the splash overlay does not fade out. One block, centred between the top and bottom safe-area insets (`design-system.md` > Screen recipes > Splash error): tile and mark at 160 pt / `space.xl` / `Text title` `start.error.title` (Georgia, centred, `accessibilityRole="header"`) / `space.xl` / `Button primary` `common.tryAgain` (`Silk` busy while reopening). Try again is never closer than `space.xl` to the bottom inset, so it always sits clear of the home indicator. The tile moves up once from the splash rect to the top of the block, then the title and button fade in (M2b). No header, no Footer. At `ax` the block is a ScrollView starting `space.xxl` under the top inset, the tile first and Try again last.

```
+--------------------------------+
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
|                                |
|                                |
+--------------------------------+
```

VoiceOver: the overlay sets `accessibilityViewIsModal`, so nothing under it is reachable. The tile and mark stay hidden; the title and Try again are normal elements. When the title fades in, focus moves to it. A retry that fails again ends the busy state, announces `start.error.title` once (queued) and keeps focus on Try again. Success hands off as the splash does (M1) to Today, or to onboarding on first run.

Primary action: `common.tryAgain`.

### S3 Onboarding step (shared frame)

Purpose: one question per step, answered or left empty.

Frame for every step 1 to 10 (`design-system.md` > Screen recipes > Onboarding step), top to bottom:

1. `Screen` with no header title and `progress { step, total }`: the `Silk progress` bar under the header (2 pt `plum` fill on its 1 pt `lineField` track) is the only progress mark. `total` counts the steps she will see (`stepsFor(answers)`, done left out): 10, or 9 once step 2 is answered Not needed. The total is recomputed on step 2 the moment the answer changes, so no step she reaches is renumbered. The bar is hidden from VoiceOver; the step title carries `accessibilityValue { text: onboarding.progressLabel }` ("Step 3 of 9"), so the step is read where focus lands. This is the one place `Silk progress` drops its `progressbar` role (`design-system.md` > Screen recipes > Onboarding step).
2. `leading`: back chevron on steps 2 to 10 and done, which returns to the previous step she saw, answers kept (from step 4 with styles skipped, back to step 2). Steps change in place inside one route, so the route has `gestureEnabled: false` on every step except step 1 on replay, where swipe back and the chevron both pop to Profile. Step 1 on first run has no leading item. The step screen sets `onAccessibilityEscape` to the chevron's handler, so the VoiceOver scrub does what the chevron does and never reaches the native stack: previous step she saw, answers kept; step 1 on replay pops to Profile; step 1 on first run does nothing.
3. Step title: the question as `Text title` (Georgia), `accessibilityRole="header"`, value as item 1. No line under it.
4. One control (below). A selected `choice` chip draws its 2 pt edge in `#9A5A52` on canvas (`design-system.md` > 7 Chip > Anatomy), so selected differs from the unselected `lineField` edge by lightness, not hue alone. A focused `Field` scrolls into view above the Footer and the keyboard per `motion.md` > Inline expand (worklet `scrollTo`, `settle`, `silk`), with the line under it when one shows; the title may scroll off.
5. `Footer`: one full-width `primary` `onboarding.next`, always enabled. There is no Skip button: Next on an unanswered step writes nothing for it, which is how every step is skippable. Chips and cards save on tap; the name saves on Next.
6. Save error: a failed write shows `common.error.save` as `Text footnote error` directly under the control that failed (the ChipRow, the card grid's plain chips, the Field), entering with inline expand and announced once (queued). The answer stays selected. Next retries the write and advances when it lands. When a Next retry fails, the error line scrolls into view (Field into view motion, not animated under Reduce Motion) and VoiceOver focus moves to it instead of an announcement, so on the one-column hijab grid at `ax` the press is never silent. No error slot on the Footer.

```
+--------------------------------+
| <                              |
| ===------------------------    |  <- progress, 3 of 10
|                                |
| Which styles do you            |  <- title, the question
| wear?                          |
|                                |
| [ one control ]                |
|                                |
|--------------------------------|
| (            Next            ) |  <- Footer
+--------------------------------+
```

Primary action: `onboarding.next`.

#### Step 1 Name

Title `onboarding.name.question` ("What is your name?").

- `Field` text, `onboarding.name.question` as its `accessibilityLabel`, so Voice Control finds it by the words on screen ("Hva heter du?" holds no "Navn"); no drawn label and no placeholder (the question asks for one thing; the empty outline is enough). VoiceOver reads the question twice, once as the header and once on the text field; that is accepted. `profile.name` stays the Profile row label only.
- `textContentType="givenName"`, `autoCapitalize="words"`, `maxLength` 40, `returnKeyType="next"`. Return runs Next.
- `autoFocus` raises the keyboard once the splash hand-off has ended (or the push from Profile has), never under the overlay. With VoiceOver on (`isScreenReaderEnabled`), step 1 does not autoFocus: focus goes to the step title, and the keyboard rises when she activates the Field.
- Next trims and writes `setName`. Empty or only spaces writes nothing; Today then greets with the time of day alone.

```
| What is your name?             |
|                                |
| [                           ]  |
|--------------------------------|
| (            Next            ) |
|  keyboard                      |
```

#### Step 2 Hijab

Title `onboarding.hijab.question`. `ChipRow` single, no drawn label (the question names it): `hijab.always`, `hijab.sometimes`, `onboarding.hijab.no` ("No" / "Nei", this step only; it writes the Not needed answer, and `hijab.notNeeded` stays the word on Your style and Today). Nothing is selected until she answers; the domain tells never answered from Sometimes (`hijabAnswered`).

No (Not needed) takes step 3 out of her steps: the bar's total becomes 9 in the same frame (`Silk progress`), and Next goes to coverage. Changing the answer back puts step 3 back.

```
| Do you wear a hijab?           |
|                                |
| (Always) (Sometimes) (No)      |
```

#### Step 3 Hijab styles

Title `onboarding.hijabStyles.question`. `ChoiceCardGroup` multi, no drawn label: seven cards in two columns, `hijabStyle.hijab`, `.shayla`, `.al-amira`, `.khimar`, `.chador`, `.niqab`, `.burqa`, art `hijab-*`, each with its `hijabStyle.*.description` in the VoiceOver label. The head covering is the answer, so every card in this group is framed on the head and shoulders at one scale: the seven `hijab-*` files are re-rendered as bust figures (`architecture.md` > Onboarding re-render list, `design-system.md` > 18 Hijab styles row), shown with `cover` like every other card, so Hijab, Shayla, Al-Amira and Khimar read apart at 163 pt. Under the grid, the plain `choice` Chip `common.noneOfThese`, `exclusive`: choosing it clears the cards, choosing a card clears it, in the same frame; `choice.clearedOne` / `choice.clearedMany` is announced (queued) when a tap clears others. Writes `profile.hijabStyles` (`[]` for None of these). Shown only when step 2 is not Not needed. The content scrolls under the Footer.

```
| Which styles do you wear?      |
|                                |
| +-----------+  +-----------+   |
| |           |  |        (v)|   |  <- blush disc, check
| |  figure   |  |  figure   |   |
| |           |  |           |   |
| +-----------+  +-----------+   |
| Hijab          Shayla          |
|                                |
| ... Al-Amira, Khimar,          |
|     Chador, Niqab, Burqa ...   |
|                                |
| (None of these)                |
```

#### Step 4 Coverage

Title `onboarding.coverage.question` ("How covered do you like your everyday outfits?"). `ChoiceCardGroup` single: `coverage.full`, `coverage.moderate`, `coverage.relaxed` (art `coverage-*`, each with `coverage.*.description`), plain Chip `coverage.noPreference`. Writes `profile.coverageLevel` (`full`, `moderate`, `relaxed`, `null` for No preference). My own limit is not offered here; it lives on Your style (F11).

```
| How covered do you like        |
| your everyday outfits?         |
|                                |
| +-----------+  +-----------+   |
| |  figure   |  |  figure   |   |
| +-----------+  +-----------+   |
| Fully covered  Modest          |
| +-----------+                  |
| |  figure   |                  |
| +-----------+                  |
| Relaxed                        |
|                                |
| (No preference)                |
```

#### Step 5 Everyday style

Title `onboarding.style.question`. `ChoiceCardGroup` single, three cards, no plain chip, one figure per card at the single-figure scale: `onboarding.style.western` (`style-western`), `onboarding.style.desi` (`style-abaya-desi`, one figure in an open abaya over a long embroidered kameez), `onboarding.style.both` (`style-mix`, one figure in a kurta over straight trousers). Both new files are in the re-render list (`architecture.md` > Onboarding); `style-abaya` and `style-desi` leave the bundle. Writes `profile.styleLean` and, at finish, `everyday.style`.

```
| What do you wear most days?    |
|                                |
| +-----------+  +-----------+   |
| |  figure   |  |  figure   |   |
| +-----------+  +-----------+   |
| Western        Abaya or desi   |
| modest                         |
| +-----------+                  |
| |  figure   |                  |
| +-----------+                  |
| A mix of both                  |
```

#### Step 6 Fit

Title `onboarding.fit.question`. `ChoiceCardGroup` single: `onboarding.fit.loose` (`fit-loose`), `onboarding.fit.structured` (`fit-structured`), plain Chip `onboarding.depends`. Writes `profile.fit`; its one home after onboarding is Your style.

```
| How do you like your           |
| clothes to sit?                |
|                                |
| +-----------+  +-----------+   |
| |  figure   |  |  figure   |   |
| +-----------+  +-----------+   |
| Loose          Structured      |
|                                |
| (It depends)                   |
```

#### Step 7 Sparkle

Title `onboarding.sparkle.question` ("For Eid and parties, how much sparkle?"). `ChipRow` single, words only: `sparkle.plain`, `sparkle.little`, `sparkle.heavy`, `sparkle.bridal`. Nothing preselected. Writes `profile.sparkle`; read on event occasions only, so everyday outfits do not change with it.

```
| For Eid and parties, how       |
| much sparkle?                  |
|                                |
| (Plain) (A little) (Heavy)     |
| (Bridal)                       |
```

#### Step 8 Location

Title `onboarding.place.question` ("Where are you?"). Two choices in content, never in the Footer, both there from the first frame (`design-system.md` > Expander > Uses > Location search):

- `Button secondary` `place.useLocation`. A tap asks the system location permission the first time; while `src/state/location.ts` finds the position and reverse-geocodes the city, the button carries `accessibilityState.busy` and is not pressable, with no sweep drawn on it.
- The search `Field` (search kind, `place.search` as its placeholder and `accessibilityLabel`, no drawn label, `returnKeyType="search"`). The return key and Next both run `geocodeCity`.
- One message slot directly under the Field: `place.locationOff` with `Button quiet small` `common.openSettings`, `place.notFound`, `onboarding.city.notFound` or `common.offline`, one at a time, entering with inline expand. The two not-found lines are `Text footnote error`; `place.locationOff` and `common.offline` are `Text footnote ink`, because nothing she typed is wrong. Nothing ever shows between the two choices, so nothing above the Field moves.
- `Text footnote muted` `place.privacy` last (kept: privacy).

Both paths end in the one Field: a found city is its text with a trailing `plum` `checkmark` at `icon.inline`, scaled by `symbolScale` (`design-system.md` > Colour rules, no success green; hidden from VoiceOver), no keyboard, and the city name announced once (queued). Editing the text after that removes the check and makes it unresolved again, so Next runs the lookup. On replay the saved city is there from the first frame with its check, read as "Search for your city, Oslo".

Use my location: one loading place, where the answer lands. The button is busy (not pressable, nothing drawn) and focus stays on it; after `wait` the Field shows its `Silk` placeholder in its own shape, with `place.finding` as its `accessibilityValue` and `accessibilityState.busy`; the city resolves into it. Denied: `place.locationOff` and Open Settings show in the slot and focus moves to that line (not announced); the keyboard stays down. Unavailable: `place.notFound` in the slot, the same way. Offline: `common.offline` in the slot; the position is found, only the city name needs the network.

Search errors: `onboarding.city.notFound` or `common.offline` in the slot. While the slot holds a search error, the Field's `accessibilityLabel` is "{label}, {error}" (`design-system.md` > 9 Field), because a TextInput does not read the Text under it. From the return key, focus is already on the Field, so the error is announced once (queued).

Next: an empty Field writes nothing and advances. A typed, unresolved city runs the lookup (Next busy) and advances when found; on failure focus moves to the Field, which reads its label with the error and its value, and the error is not also announced. When a lookup from Next has failed and the text has not changed since, the next Next advances and writes nothing: the error line already told her, and the completeness meter's Location chip brings her back. Writes `styling.place` with `source` (`device` or `search`).

```
| Where are you?                 |
|                                |
| (     Use my location      )   |  secondary
|                                |
| [Q Oslo                   ✓ ]  |  Field, placeholder
|                                |  "Search for your city"
|   Location access is off       |  slot, one message
|   Open Settings                |  at a time
|                                |
| Rounded to your city, sent     |
| only to Apple for the weather. |
```

#### Step 9 Morning outfit

Title `onboarding.notify.question` ("When should your outfit come?" / "Når vil du ha antrekket?"), a question the five chips answer (the rule step 2 set), and it names the delivery, so the system prompt after a time chip is expected. `ChipRow` single, the same row as the Profile morning outfit row: `notify.off`, `notify.time` 06:00, 07:00, 08:00, `notify.nightBefore` (21:00). Off is selected from the first frame, because it is the true state, not a guessed answer. The time chips are h23; the Lane 1 device check in `design-system.md` > Expander > Uses > Morning outfit chips applies here first, since this is where she meets them (if VoiceOver reads "zero six zero zero", each chip's `accessibilityLabel` comes from `Intl.DateTimeFormat`). Choosing a time saves the choice at once and asks the system notification permission the first time (never at launch); nothing is scheduled yet. `finishOnboarding` creates the schedule from the saved choice, so a tap can only arrive once she is onboarded. On Replay and on Profile the schedule changes at once, as now. Denied: the chip stays selected, `notify.denied` with `Button quiet small` `common.openSettings` opens under the ChipRow with inline expand, and focus moves to the `notify.denied` line without an announcement (as step 8 does after its alert); the schedule is set once she allows it in Settings and onboarding is done (UC-F12-08). Off clears the choice, and cancels the schedule on Replay. Writes `styling.notification`.

```
| When should your outfit come?  |
|                                |
| (Off) (06:00) (07:00) (08:00)  |
| (21:00 the night before)       |
|                                |
| Notification access is off     |  only when denied
| Open Settings                  |
```

#### Step 10 Colours

Title `onboarding.colours.question` ("Which colours suit you?").

- `Button secondary` `colours.selfie`, leading `camera`: pushes S4.
- When a palette is saved: `space.xl` / `Text headline` the season (`season.*`) / `space.md` / `Swatches` of the six best shades (the one palette summary outside the result screen, the same on the Profile Colours answer), no Section title (the step title asks it; the row label is `colours.paletteLabel` with `colours.bestShades`, or `colours.bestShadesPlain` while hijab is Not needed). It is in place when the pop from S4 ends, so nothing animates in.

```
| Which colours suit you?        |
|                                |
| ([cam]  Take a selfie      )   |
|                                |
| Deep autumn                    |  after a save
| o o o o o o                    |
```

#### Done

Purpose: hand off into the loop.

- Same frame with the back chevron to step 10; `progress` is hidden in place (slot kept, fades out with the outgoing step), so the header holds still. No step value on the title.
- In the upper third, as `EmptyState` places it: the still mark (`mark.png` on `tile.png`, `brandMark` size) / `space.xl` / title `onboarding.done.title` / `space.xl` / its action, `Button secondary small` `sample.try`, because a Footer owns the primary (`design-system.md` > 15 EmptyState). The mark closes the loop the splash opened and is hidden from VoiceOver. Try the sample closet sits in this place at every text size.
- `Footer`: `primary` `closet.addPieces` alone, the same one-button Footer as every step, so the Footer edge holds still through M3. While one button is busy the other is disabled (`design-system.md` > Footer, corrupting writes).

```
+--------------------------------+
| <                              |
|                                |
|           +------+             |
|           |  /\  |             |
|           +------+             |
|                                |
|          You are set           |
|                                |
|    ( Try the sample closet )   |
|                                |
|--------------------------------|
| (         Add pieces         ) |
+--------------------------------+
```

Finishing writes the everyday style when none exists (occasion Everyday, the step 5 style, or Both when skipped, hijab from step 2, coverage from step 4), sets `onboarded` and creates the notification schedule when step 9 holds a time. Primary action: `closet.addPieces`. It replaces onboarding with the tab shell on the Closet tab and pushes `/capture` on it in the same commit, so Back from Add pieces shows the Closet empty state and Today never flashes. `sample.try` replaces onboarding with the tab shell on Today, styling from the sample closet.

### S4 Colours (selfie)

Purpose: take a selfie the right way, measure skin, eyes and hair, and show the palette (owner round 1, item 5; round 2, item 5). Entry: step 10 `colours.selfie`, Profile > Colours > `colours.selfie`. No skin tone chips anywhere.

One route, `Screen` on `canvas`, scrolling, inline title `onboarding.colours.title`, back chevron. Three phases replace each other in place with Step change in place: tips, camera (with measuring), result (`design-system.md` > Screen recipes > Selfie). From the camera phase on, the face circle (`CameraFrame` > Face circle) is the first scroll child and keeps one rect, so the photo never moves between camera, measuring and result.

#### S4a Tips

`Section` of four static `Row`s, no icons: `colours.tip.daylight`, `colours.tip.lens`, `colours.tip.glasses`, `colours.tip.lip` / `space.lg` / `Text footnote muted` `colours.camera.privacy` (kept: privacy) / `Footer` primary `colours.openCamera`. A retake never returns here.

```
+--------------------------------+
| <          Your colours        |
|                                |
| Daylight, facing a window      |
| Wipe the lens                  |
| No glasses                     |
| No bold lipstick               |
|                                |
| The selfie stays on this phone.|
|                                |
|--------------------------------|
| (         Open camera        ) |
+--------------------------------+
```

Primary action: `colours.openCamera`. It asks the camera permission the first time, over S4b.

#### S4b Camera and measuring

Face circle with the front camera (`faceCircle`, dashed `lineField` ring, `plum` arc lane outside it) / `space.lg` / feedback line (`headline` `ink`, centred, holding the height of the tallest measured guide or reason at the current size and language, its text top-aligned in that block so the current guide always sits just under the circle) / `Button quiet` `colours.library`. No shutter, no Footer (the slot is empty and hidden from VoiceOver).

- Guides from `selfieGuide`: `selfie.guide.find`, `.dark`, `.closer`, `.back`, `.centre`, `.straight`, `.still`, `.ready`. A guide shows only after it has held `dwell`.
- Auto capture: on `ready` the `plum` arc fills over `dwell` (700 ms); when it completes and `readyToCapture` agrees, `capture` fires once, the veil flashes over the circle only, `light` haptic, `colours.taken` announced. Leaving `ready` drains the arc and nothing fires.
- Manual capture: while a face is found, the circle has `accessibilityRole="button"`, keeps `activate` for the double tap, and carries a second, non-default custom action `takePhoto` named `common.takePhoto`, so VoiceOver says "Actions available" and the rotor lists Take photo. A tap on the circle (`onPress`), either action and `magicTap` take the photo. The label always starts with the fixed word `Camera`, so Voice Control ("Tap Camera") finds it whatever the guide says, and a shaking hand gets there without holding still. Nothing is drawn for it.
- Measuring: the circle holds the still selfie under `Silk sheen`, arc full; the feedback line reads `colours.busy` and the circle is the busy element. `colours.library` is hidden in place (opacity 0, `pointerEvents="none"`, `accessibilityElementsHidden`, `importantForAccessibility="no-hide-descendants"`, slot kept).
- Library: `colours.library` opens the photo picker; the picked photo fills the circle and measuring runs the same way. Using it cancels a running arc.

```
+--------------------------------+
| <          Your colours        |
|                                |
|          .-~~~~~~-.            |  dashed ring,
|        /    .--.    \          |  plum arc lane
|       |    (    )    |         |  outside it
|       |     `--'     |         |
|        \            /          |
|          `-......-'            |
|                                |
|         Centre your face       |  feedback line
|                                |
|     Choose a recent selfie     |  quiet
+--------------------------------+
```

Retake: when measuring cannot read the photo, the live camera returns in the circle and the reason (`selfie.guide.dark`, `common.light.mixed`, `colours.retake.no-face`, `colours.retake.failed`) holds the feedback line for at least `linger`. Focus stays on the circle, whose label now holds the reason; the reason is announced once (`{ queue: true }`). The arc starts again from nothing. No extra state.

Unavailable (permission asking, denied, or no camera): the circle is an empty `sunken` disc at the same size, the ring is not drawn, and the disc is hidden from VoiceOver. Asking: nothing else changes under the system prompt. Denied or no camera: the feedback slot holds `common.cameraOff` with `Button secondary small` `common.openSettings` under it; `colours.library` stays. VoiceOver reads the feedback text, Open Settings (or Try again when the camera failed), then Choose a recent selfie, and focus goes to the feedback text. Nothing moves when permission returns.

Camera failed: the circle is the same hidden `sunken` disc; the feedback line holds `colours.cameraFailed` with `Button secondary small` `common.tryAgain` (restarts the camera); `colours.library` stays. No measuring starts.

#### S4c Result

Top to bottom, the palette first:

1. The face circle with the still selfie; the ring and arc are gone. Points are drawn only while Adjust is open.
2. `Text title` the season (`season.*`, "Deep autumn"), Georgia, `accessibilityRole="header"`.
3. `Section` `colours.bestShades` (or `colours.bestShadesPlain` while hijab is Not needed): `Swatches`, six.
4. `Section` `colours.goEasy`: `Swatches`, six. Names drawn as `design-system.md` > 19 Swatches says: at `large` and up, under Increase Contrast and under Differentiate Without Color.
5. `Button quiet` `colours.notMe`, `accessibilityState.expanded`. It opens a `headless` `Expander` directly under itself. Body: `quiet` `capture.retake` first (back to S4b, the unsaved result discarded; redo is the common fix) / `Row` toggle `colours.hairCovered` / `Segmented` `colours.undertone` (`undertone.cool`, `.neutral`, `.warm`, the three `undertoneOf` measures) / `Segmented` `colours.depth` (`depth.*`) / `Segmented` `colours.contrast` (`contrast.*`). Each Segmented draws its key as its `label` (`headline`, above the track), and each segment's `accessibilityLabel` is "{label}, {option}" ("Depth, Medium" / "Dybde, Middels"), because iOS reads no group label and Depth and Contrast both have Medium. At `large`, where a Segmented becomes a list of Rows, the label is the list header. While it is open the points show on the circle: `colours.skin`, `colours.eyes`, and `colours.hair` while Hair covered is off. `experimental_accessibilityOrder` puts the point elements after the Contrast Segmented in the Expander body, as `design-system.md` 17 orders the camera controls, so VoiceOver meets them in the body she opened. At `ax` too, opening the Expander brings the top of the opened part into view (`motion.md` > Inline expand).
6. `Footer` primary `colours.save`. A failed save uses the Footer error slot, `common.error.save`, result kept.

The season title and both rows hold the height of the tallest season title at the current width and text size (re-measured on `fontScale`, Bold Text and language change); each row is always six swatches, so a change never moves anything below.

```
+--------------------------------+
| <          Your colours        |
|          .--------.            |
|        /   selfie   \          |
|       |    (o) eyes  |         |  points only
|       |    (o) skin  |         |  while Adjust
|        \            /          |  is open
|          `--------'            |
| Deep autumn                    |  Georgia
|                                |
| Best hijab shades              |
| o o o o o o                    |
| Go easy on                     |
| o o o o o o                    |
|                                |
|  These don't look like me      |  quiet
|  Retake                        |  Expander, open
|  Hair covered            [on]  |
|  Undertone                     |
|  [ Cool | Neutral | Warm ]     |
|  Depth                         |
|  [ Light | Medium | Deep ]     |
|  Contrast                      |
|  [ Low | Medium | High ]       |
|--------------------------------|
| (        Save colours        ) |
+--------------------------------+
```

`colours.hairCovered` starts on when hijab is Always or Sometimes, or never answered, and off for Not needed; on hides the Hair point and the season is measured from skin and eyes. Its value persists, so a retake does not bring Hair back. Each toggle, Segmented change or point move updates the season and both rows at once. Primary action: `colours.save`, which pops to step 10 (or the Profile Colours answer) with the season and best shades in place.

Points: each is a 44 pt target. Measured positions are pushed apart so centres sit at least 44 pt apart, and clamped so each centre sits at least 22 pt inside the circle, so the clip never cuts a hit area. Dragging a point remeasures its colour. The Segmented controls are the non-drag way to change the result (WCAG 2.5.7).

#### S4 VoiceOver

- S4a reads the tips, the privacy line, then Open camera.
- S4b: the circle is one element labelled `colours.circleLabel` ("Camera, Centre your face"), its first word always `Camera`. It is an `image` until a face is found, then a `button` with `activate` for the double tap and the custom action `takePhoto` named `common.takePhoto` (S4b > Manual capture); the feedback line, ring, arc and veil are hidden. Guide changes are announced `{ queue: false }`, held `dwell`, spaced `announce`; `ready` is not spoken; `colours.taken` once. Then `colours.library`. Measuring: the circle's label is `colours.busy` with `accessibilityState.busy`, focused.
- Unavailable and camera failed: the disc is hidden; the feedback text, Open Settings or Try again, then Choose a recent selfie; focus on the feedback text.
- Focus on a phase change: camera arrives, focus the circle. Result arrives, focus the season title (a header, not announced). Retake, focus stays on the circle, whose label now holds the reason; the reason is announced once (queued).
- Each `Swatches` row is one element labelled `colours.paletteLabel`; the swatches are hidden.
- Each point is read after the Contrast Segmented (S4c item 5) and labelled `colours.skin`, `colours.eyes` or `colours.hair`, with the measured `colour.*` as `accessibilityValue`, and has `accessibilityActions` `point.moveUp`, `point.moveDown`, `point.moveLeft`, `point.moveRight`, each stepping a fixed amount inside the clamped circle. After a move the new value is announced.
- A change that changes the season announces the season (`season.*`) once (queued), after the new value for a point; focus stays on the point or control.
- After `colours.save` pops back, the season is announced once (queued).

## States

| State | Screen | What shows |
|---|---|---|
| Loading, launch | S1 | Splash drape. If the closet is still opening at drape end, the overlay keeps the still mark until the gate knows the destination; past `wait`, `common.loading` is announced once. When that is Today and its outfit is still loading, Today's `Silk placeholder` FlatLay, one VoiceOver element `common.loading`, resolves with the Loading fade. Onboarding never shows behind a Today placeholder. Never a spinner, never a text screen between splash and the destination |
| Loading, warm launch | S1 | Nothing. Today as it was |
| Notification tap, cold | S1 | Splash, then Today's outfit, or Today in "Tomorrow's outfit" for the 21:00 tap (F06). Never onboarding, never Profile |
| Notification before Done | S3 step 9 | None is scheduled: a time chosen on step 9 is saved, and `finishOnboarding` creates the schedule |
| Relaunch before Done | S3 | Onboarding opens on step 1 with the saved answers prefilled, as Replay shows them; a name typed but not sent with Next is not kept |
| Loading, finding location | S3 step 8 | Use my location busy (`accessibilityState.busy`, not pressable, nothing drawn), focus kept on it; after `wait` the Field, already on screen, shows its `Silk` placeholder (value `place.finding`, busy) and resolves to the city with its check. One loading place |
| Loading, lookup | S3 step 8 | Next busy while `geocodeCity` runs, from the return key or Next. The Field stays editable |
| Loading, measuring | S4b | `Silk sheen` over the still selfie in the circle, `colours.busy` in the feedback line and as the circle's busy label, focused |
| Generating | Today after `sample.try` | Today's FlatLay arranges the first outfit (M4). No first-run card: finishing wrote the everyday style |
| Empty | S3 steps | Nothing chosen on any step: every ChipRow and card group unselected (Off on step 9 is the true state), the name and place Fields empty. Next advances and writes nothing for that step |
| Empty | S3 step 10 | No palette yet: Take a selfie alone |
| Empty | Today after all steps left empty and `sample.try` | Greeting without a name; Profile's meter shows the first three quick add chips (F11) |
| Empty | Closet after `closet.addPieces` | F04 empty state under Add pieces, reached by Back |
| Skipped step | S3 step 3 | Hijab Not needed: step 3 is never shown, the bar reads "of 9" from step 2 on, Back from step 4 lands on step 2 |
| Error, closet | S2 | The tile settles into the centred block; `start.error.title` and `common.tryAgain` fade in under it, clear of the home indicator; the overlay is VoiceOver modal |
| Error, save answer | S3 any step | `common.error.save` under the control that failed, answer kept, Next retries; a failed retry scrolls the line into view and moves focus to it |
| Error, city | S3 step 8 | `onboarding.city.notFound` in the slot under the Field and in the Field's label; from Next, focus moves to the Field and the error is not also announced. The next Next with the text unchanged advances and writes nothing |
| Error, location unavailable | S3 step 8 | `place.notFound` in the slot under the Field, focused, keyboard down. Nothing above the Field moves |
| Permission denied, location | S3 step 8 | `place.locationOff` with `common.openSettings` in the slot under the Field, the line focused, keyboard down. Search always works |
| Permission denied, notifications | S3 step 9 | The time chip stays selected; `notify.denied` with `common.openSettings` under the ChipRow, the line focused, not announced. Nothing asks again on launch |
| Offline | S3 step 8 | `common.offline` in the slot under the Field, distinct from not found, from either path. Use my location still finds the position; only the city name lookup needs the network |
| Error, camera failed | S4b | `colours.cameraFailed` in the feedback line, `common.tryAgain` under it, `colours.library` kept. No measuring starts |
| Error, retake | S4b | The live camera returns in the circle with the reason in the feedback line for at least `linger`; focus stays on the circle, whose label now holds the reason; the reason is announced once (queued). The arc restarts |
| Error, save colours | S4c | `common.error.save` in the Footer error slot, result kept, announced once; focus stays on Save colours |
| Permission asking | S4b | The `sunken` disc without a ring, hidden from VoiceOver, the feedback slot empty, `colours.library`, under the system camera prompt |
| Permission denied, camera | S4b | The `sunken` disc, hidden from VoiceOver; `common.cameraOff`, focused, with `common.openSettings` in the feedback slot, `colours.library` kept. The library path still measures |
| Interrupted | S4b | Back while measuring cancels: step 10 is unchanged, nothing lands later, the temp selfie is deleted, reopening starts at S4a. Leaving cancels a running arc and its callback |
| First run | S3 | Step 1 with no back item, keyboard up after the hand-off (with VoiceOver on, focus on the step title and no keyboard until she activates the Field). `gestureEnabled: false` on every step. The VoiceOver scrub (`onAccessibilityEscape`) goes back a step as the chevron does, and does nothing on step 1. Relaunch after finishing skips onboarding |
| Replay | S3 | From Profile (F11), after its system confirm: answers prefilled (name, cards, chips, the saved city with its check, the palette on step 10). Step 1 has a back chevron, and swipe back is on there only; both pop to Profile. The VoiceOver scrub runs the chevron's handler on every step, so it never pops to Profile from a later step and a typed city is kept. Step 1 autoFocus follows First run, VoiceOver rule included |
| Reduce Motion | all | See Motion |
| Largest text (AX3 to AX5) | all | ChipRows wrap; chips grow in height. Choice cards go one column, each min(240 pt, 30 percent of the safe-area height) tall with the whole figure, the plain chips after them. `Segmented` becomes a vertical list of `Row`s under its label. Footer pins only the primary; on Done, Try the sample closet stays in its EmptyState place under the title, as at every size. Step title `title` caps at 2.0x. S4: the circle shrinks to its 40 percent cap and stays first; the feedback line wraps uncapped; the result scrolls under the pinned Save colours; Swatches become a vertical list, one colour per line with its name (`design-system.md` > 19 Swatches). Checks that only fail at AX5 (fontScale 3.571, body about 61 pt): on a 667 pt phone, with a Footer of about 134 pt and the keyboard, steps 1 and 8 leave about 200 pt, so the 110 pt Field still fits; the focused Field (and the line under it) scrolls into view and the title may scroll off; the S2 block scrolls with Try again reachable; the S4b bokmål reason "Fant ikke ansiktet. Hold telefonen i øyehøyde." runs to five lines of about 79 pt, so the reserved block pushes Choose a recent selfie below the first viewport; the text is top-aligned in the block, so the current guide stays just under the circle. Nothing truncates |
| Bokmål | all | Progress VoiceOver "Steg 3 av 10". Titles wrap in Georgia: "Hvordan vil du at klærne skal sitte?", "Hvor dekket vil du være til hverdags?". Card labels wrap under the card ("Dekkende vestlig", "Spiller ingen rolle" as a chip). "Finn posisjonen min", "{time} kvelden før", "Prøv eksempelgarderoben" wrap inside their capsules; soft hyphens come from `Text` at render. Guide strings run longer than English; the line holds the tallest measured height |

## Motion

| Moment | Where | Motion (tokens from `motion.md`) | Reduce Motion |
|---|---|---|---|
| M1 Splash drape | S1 cold launch | `motion.md` > Splash: mark opacity 0 to 1 (`base`, `silk`), translateY -10 to 0 (`drape`, `fall`); hand-off at drape end once the destination is known; overlay fades out (`settle`, `silk`) over a screen that is already complete. Focus goes to the registered header | Mark fades in (`base`), overlay fades out (`base`) |
| M2 Launch hold | S1 to Today or onboarding | Closet not open at drape end: the overlay keeps the still mark, nothing loops or moves, until the gate knows the destination; then M1's hand-off. Past `wait`, `common.loading` announced once. Only when the destination is Today and its outfit is still loading: placeholder at once, band after `wait`, resolves with content fade (`base`, `silk`). Never Generating on a cold launch, notification tap included | Same hold; still placeholder, `base` fade |
| M2b Closet error | S1 to S2 | `motion.md` > Splash: the overlay stays. The block is measured in the hidden layer; the tile and mark move up once, translateY only, from the splash rect to the top of the centred block (`settle`, `silk`); after `step` the title and Try again fade in (`base`, `silk`). At `ax` the block scrolls | The tile crossfades from the old rect to the new one (`base`); title and Try again fade in with it |
| M3 Step change | S3 Next, Back | Step change in place: header and Footer hold still. Outgoing content opacity 1 to 0 (`quick`, `release`); incoming after `step`, opacity 0 to 1, translateY 4 to 0 (`base`, `silk`). Progress fill grows or shrinks as `Silk progress` (`base`, `silk`). Scroll to top in one frame. Focus to the step title, which reads the step value (step 1 with VoiceOver on included, where the Field does not autoFocus). Done: the progress bar fades out with the outgoing content and its slot stays. No swipe between steps | Content crossfade (`base`), progress steps in one frame |
| Total change | S3 step 2 | Not needed on or off: the fill eases to the new share (`Silk progress`, `base`, `silk`); the title value changes without an announcement | Fill steps in one frame |
| Field into view | S3 steps 1 and 8, a failed Next retry | A focused Field, or a save error line after a failed Next retry, below the fold scrolls above the Footer and keyboard with worklet `scrollTo` (`settle`, `silk`), as Inline expand. Keyboard: system | `scrollTo` not animated |
| Selection | Chips, Segmented | Selection crossfade (`quick`, `silk`); Segmented thumb (`settle`, `silk`); `press` on every control | Per `motion.md` |
| Choice card | S3 steps 3 to 6 | `motion.md` > Choice card: art there from the first frame; `press`; the blush disc crossfades in (`quick`, `silk`), the old one out (`quick`, `release`) in the same frame; an exclusive clear changes in the same frame. No auto advance, no haptic | Same, opacity only |
| Location | S3 step 8 | One loading place: Use my location goes busy with nothing drawn on it (`accessibilityState.busy`, not pressable); the Field, on screen from the first frame, shows its `Silk` placeholder after `wait`; the city and its check resolve with the Loading fade (`base`, `silk`). Nothing opens and nothing above the Field moves. Keyboard by the system | Placeholder still, text fades in (`base`) |
| Inline lines | S3 steps 8 and 9, all save errors | The step 8 slot under the Field (`place.locationOff`, `place.notFound`, `onboarding.city.notFound`, `common.offline`), `notify.denied` and `common.error.save` enter with inline expand under the control. Announced once, queued, unless focus moves to the line or to its Field (step 8 denied or unavailable, a lookup from Next, step 9 denied after the system alert, a failed Next retry), which then reads it once | Layout in one frame, text fades in (`base`) |
| Step 10 palette | S3 step 10 | None: the season and Swatches are in place when the pop from S4 ends | Same |
| M4 First outfit | Today after `sample.try` | Generating moment, with every slot new: the FlatLay starts as its `Silk placeholder`, then each piece plays the incoming half of the flat lay piece swap (opacity 0 to 1, translateY -6 to 0, `arrange`, `fall`) in dressing order, `step` apart. Announce `today.announce.outfit` once | Pieces crossfade in together (`base`) |
| M5 Hand-off to Add pieces | Done to `/capture` | Native push over the Closet tab; no tab animation (Tab switch: none) | System |
| Tips to camera | S4a to S4b | Step change in place; the tips Footer fades out with its phase (`quick`, `release`). The circle is `sunken` until the feed is live, then the feed fades in (`base`, `silk`). The dashed ring is there from the first frame and never moves | Crossfade (`base`) |
| Guide line | S4b | A guide shows after `dwell` with the label crossfade, height held | Crossfade (`base`) |
| Arc | S4b `ready` | `motion.md` > Face circle: the `plum` arc grows clockwise in its lane over `dwell`, linear (a timer); leaving `ready` drains it (`quick`, `release`) | Same: a timer, not travel |
| Capture | S4b | A `canvas` veil over the circle only, 0 to 0.5 (`quick`, `silk`), then to 0 (`settle`, `release`); the still photo replaces the feed at the peak. `light` haptic. `colours.library` fades out in place (`quick`, `release`) | Veil in and out at `base`; still photo crossfades (`base`) |
| Measuring | S4b | Loading `sheen` over the circle after `wait`, keeps looping (full-screen wait) | Still band at centre after `wait` |
| Retake | S4b | The band fades out (`quick`), the still crossfades back to the live feed (`base`), the arc clears (`quick`, `release`), the reason shows in the line at once and holds `linger`; `colours.library` fades back in (`base`, `silk`) | Crossfade (`base`) |
| Palette reveal | S4b to S4c | `motion.md` > Palette reveal: band fades out (`quick`); ring and arc fade out (`quick`, `release`); season title, both Swatches rows and These don't look like me fade in together (`base`, `silk`), no stagger; the Footer enters (Footer entering) | All fade in together (`base`) |
| These don't look like me | S4c | Inline expand; the points fade in on the circle (`base`, `silk`); collapse fades them out (`quick`, `release`) | Layout in one frame, content and points fade (`base`) |
| Adjust change | S4c | Every swatch crossfades to its new colour in place (`base`, `silk`), all at once; the season title uses the label crossfade, height held. A Hair point fades out (`quick`, `release`) or in (`base`, `silk`) | Same crossfades at `base` |
| Point drag | S4c | Follows the finger, no easing while down; on release nothing settles past the finger | Same |

Haptics: `selection` on a Segmented change in Adjust (Undertone, Depth, Contrast), `light` impact when auto capture fires. Chips and cards stay silent (`motion.md` > Haptics). Nothing else in F01 fires a haptic.

## Copy

All keys are in `copy.md` > F01 Start, Revision 1 > F01 Onboarding, F01 Colours and F01 flow design additions, F11 Profile, and F12 App-wide.

| Screen | Keys |
|---|---|
| S1 | `common.loading` |
| S2 | `start.error.title`, `common.tryAgain` |
| S3 frame | `onboarding.progressLabel`, `common.back`, `onboarding.next`, `common.error.save` |
| Step 1 | `onboarding.name.question` (the title and the Field's `accessibilityLabel`) |
| Step 2 | `onboarding.hijab.question`, `hijab.always`, `hijab.sometimes`, `onboarding.hijab.no` |
| Step 3 | `onboarding.hijabStyles.question`, `hijabStyle.*`, `hijabStyle.*.description`, `common.noneOfThese`, `choice.clearedOne`, `choice.clearedMany` |
| Step 4 | `onboarding.coverage.question`, `coverage.full`, `coverage.moderate`, `coverage.relaxed`, `coverage.*.description`, `coverage.noPreference` |
| Step 5 | `onboarding.style.question`, `onboarding.style.western`, `onboarding.style.desi`, `onboarding.style.both` |
| Step 6 | `onboarding.fit.question`, `onboarding.fit.loose`, `onboarding.fit.structured`, `onboarding.depends` |
| Step 7 | `onboarding.sparkle.question`, `sparkle.plain`, `sparkle.little`, `sparkle.heavy`, `sparkle.bridal` |
| Step 8 | `onboarding.place.question`, `place.useLocation`, `place.search` (the Field's placeholder and label), `place.finding` (the Field's value while finding), `place.locationOff`, `place.notFound`, `common.openSettings`, `onboarding.city.notFound`, `common.offline`, `place.privacy` |
| Step 9 | `onboarding.notify.question`, `notify.off`, `notify.time`, `notify.nightBefore`, `notify.denied`, `common.openSettings` |
| Step 10 | `onboarding.colours.question`, `colours.selfie`, `season.*`, `colours.paletteLabel`, `colours.bestShades`, `colours.bestShadesPlain`, `colour.*` |
| Done | `onboarding.done.title`, `closet.addPieces`, `sample.try` |
| S4 title | `onboarding.colours.title` |
| S4a | `colours.tip.daylight`, `colours.tip.lens`, `colours.tip.glasses`, `colours.tip.lip`, `colours.camera.privacy`, `colours.openCamera` |
| S4b | `colours.circleLabel`, `selfie.guide.*`, `colours.taken`, `common.takePhoto` (the circle's `takePhoto` custom action), `colours.library`, `colours.busy`, `common.light.mixed`, `colours.retake.no-face`, `colours.retake.failed`, `colours.cameraFailed`, `common.tryAgain`, `common.cameraOff`, `common.openSettings` |
| S4c | `season.*`, `colours.bestShades`, `colours.bestShadesPlain`, `colours.goEasy`, `colours.paletteLabel`, `colour.*`, `colours.notMe`, `colours.hairCovered`, `colours.undertone`, `colours.depth`, `colours.contrast`, `undertone.*`, `depth.*`, `contrast.*`, `capture.retake`, `colours.skin`, `colours.eyes`, `colours.hair`, `point.moveUp`, `point.moveDown`, `point.moveLeft`, `point.moveRight`, `colours.save`, `common.error.save` |
| Today (M4) | `today.announce.outfit` |

## Use cases

| ID | Screen | States |
|---|---|---|
| UC-F01-01 | S1, then Today | Loading, launch (M1, M2, still-mark hold on a slow open); warm launch; Reduce Motion |
| UC-F01-02 | S2 | Error, closet; centred block with Try again clear of the home indicator at AX3 and on the smallest phone; a failed retry is announced; retry lands on Today |
| UC-F01-03 | S3 steps 1 to 10, done | First run, all ten steps, Back keeps answers, no swipe between steps, the VoiceOver scrub goes back a step, error save answer under the control that failed, every step left empty with Next, relaunch before Done opens step 1 prefilled, relaunch after finishing skips onboarding, finish writes the everyday style, greeting by name, largest text up to AX5, bokmål |
| UC-F01-04 | S3 step 8 | Location denied: the line and Open Settings under the always-visible Field, nothing above it moves; lookup from the return key and from Next (loading), error city, offline, found announced |
| UC-F01-05 | F11 Body answer | Moved to Profile in revision 1; drawn in `flows/F11-profile-and-style.md` |
| UC-F01-06 | none | Retired: skin tone chips removed |
| UC-F01-07 | S4a, S4b, S4c | Tips, permission asking, guides, measuring (loading, focused), palette, Hair covered by hijab answer (Always, Sometimes, Not needed), These don't look like me with three Segmented controls and point Move actions, save (announced), retake reasons in the feedback line, library path, Reduce Motion |
| UC-F01-08 | S4b | Permission denied, Open Settings and the library path |
| UC-F01-09 | Done, then F02 over Closet | Add pieces alone in the Footer, Hand-off M5, Closet empty under Add pieces, no Today flash |
| UC-F01-10 | Done, then Today | Try the sample closet under the title at every text size, Generating (M4), no first-run card, sample closet in use, the step 5 style on the context row |
| UC-F01-11 | S4b | Error, camera failed; Try again restarts; library path still measures |
| UC-F01-12 | S3 step 1 | Keyboard up, return is Next, trim, 40 character limit, empty advances; with VoiceOver on, focus on the title and no keyboard until the Field is activated; AX5 on a 667 pt phone, bokmål |
| UC-F01-13 | S3 step 3 | Multi-select cards framed on the head and shoulders, None of these exclusive with the clear announced, skipped for Not needed with the "of 9" count, Back from step 4 to step 2, one column at AX up to AX5, bokmål |
| UC-F01-14 | S3 step 4 | Single select, Relaxed, No preference as the plain chip, largest text, bokmål |
| UC-F01-15 | S3 step 5 | One figure per card, the choice reaches Today and Your style |
| UC-F01-16 | S3 step 6 | Fit cards, It depends as the plain chip, Your style reads it |
| UC-F01-17 | S3 step 7 | Sparkle chips, event wording, bokmål |
| UC-F01-18 | S3 step 8 | Use my location busy, the Field resolves to the city with its check, location unavailable falls to search |
| UC-F01-19 | S3 step 9 | "When should your outfit come?", Off selected first, time chips read as times (Lane 1 device check), a time asks permission, denied line focused with Open Settings and the chip kept, nothing scheduled before Done, 21:00 lands on "Tomorrow's outfit" |
| UC-F01-20 | S4b | Real phone: guides, arc over `dwell`, auto capture once, arc drains when she moves, Reduce Motion veil |
| UC-F01-21 | S4c | Palette, six and six swatches as one element per row, These don't look like me with Retake first and the labelled Segmented controls (Neutral undertone included), Retake discards, save, largest text up to AX5 with Swatches as a list, bokmål |

Also touched here, owned elsewhere: UC-F06-23 (21:00 tap, "Tomorrow's outfit"), UC-F11-03 (Location and Colours answers reuse step 8 and S4), UC-F11-05 (Replay), UC-F12-02 (ten steps and the palette at AX3), UC-F12-04 (offline city), UC-F12-05 (Interrupted measuring), UC-F12-06 (splash, measuring, choice card, auto capture under Reduce Motion), UC-F12-07 (VoiceOver walk of onboarding and the selfie), UC-F12-08 (location and notifications off).

## Notes for other roles

- Architect: done in `architecture.md` and `use-cases.md` from this flow's review, so no "read X as Y" list remains here: one Next and no Skip; the step 1, 9 and 10 questions; No on step 2; chips under the cards for the options with no picture; sparkle in words only; the blush disc; one figure per style card and the head-and-shoulders hijab renders in the re-render list; the schedule created by `finishOnboarding`; UC-F01-03 (Next, relaunch before Done), UC-F01-04, UC-F01-09, UC-F01-10, UC-F01-12 to UC-F01-16, UC-F01-18, UC-F01-19, UC-F01-21 and UC-F06-22 step 4.
- F06: S1 States "From a morning notification" still says the gate lands on onboarding before it is finished. No tap can arrive then, because `finishOnboarding` creates the schedule (step 9); follow UC-F06-22 step 4.
- F11: the Location answer reuses step 8 as drawn here (the Field always visible, one message slot under it, no quiet Search button and no `place.city`).
- F12: the Place lookup and Location rows, the expanded check (Search for your city), the Place step copy row and the review notes that name `place.city` follow step 8 as drawn here. Offline from Use my location shows `common.offline`, not `place.notFound`: the position was found and only the city name needs the network, so "Could not find your location" would be untrue.
- UI designer: done in `design-system.md` from this flow's review: 7 Chip > Anatomy (unselected `choice` chips on canvas get the `lineField` edge, selected ones the `#9A5A52` edge), 9 Field (the error joins the label), 12 Expander > Uses > Location search, 17 Face circle > Manual capture (`button` role and the `takePhoto` custom action), 18 ChoiceCard (one `image` per card, the hijab head-and-shoulders framing, keys only), 19 Swatches (a list at `ax`), Screen recipes > Selfie (Hair covered inside the Expander, the circle first in the result), Screen recipes > Onboarding step. Still open: 17 Face circle > Ring draws the `plum` arc over the dashed ring, where it is 2.06:1 against `lineField` (WCAG 1.4.11); move it to its own lane outside the ring, as F01 S4b and `motion.md` have it. Size and touch > `faceCircle`: limit "the feedback line and the library button stay in the first viewport" to below `ax` (at AX5 the reserved bokmål reason pushes the library button down; the line is top-aligned, so the guide stays under the circle). 19 Swatches > Accessibility: "nothing in front" goes; each row label is `colours.paletteLabel` ("{label}: {names}"), which step 10 needs because it has no Section title. 7 and the Colour principles: the selected recipe line and the `blushStrong` row still name `blushStrong` as the selected chip edge; align them with 7. Screen recipes > Onboarding step: the notification ChipRow carries Off (step 9).
- Motion designer: `motion.md` > Transitions > Choice card says "Next with Skip"; it is Next alone. The face circle stays in the result phase with the still photo; its ring and arc fade out with the Palette reveal. Use my location shows no busy sweep; the Field's placeholder is the one loading place.
- Copy writer: this flow added or reinstated keys in `copy.md` > Revision 1 > F01 flow design additions: `colours.library`, `notify.off` on step 9, `colours.skin`, `colours.eyes`, `colours.hair`, `point.move*`, and the ChoiceCard `*.description` keys. F01 no longer uses `onboarding.progress`, `common.skip`, `colours.photo`, `colours.adjust`, `onboarding.colours.swatch`, `place.city` or `profile.name` (step 1). Done in `copy.md` from this flow's review: `onboarding.notify.question` ("When should your outfit come?"), `profile.name` as the Profile row label only, the circle's `takePhoto` action, `onboarding.hijab.no`, the place paragraph, "plain chip", the Profile Colours value. Still open: Revision 1 > F01 Onboarding > Cards and chips, first bullet, says hijab style and coverage cards "add their hint (`hijabStyle.*.hint`, `coverage.*.hint`)"; reword it to `*.description` joined into the label, and cut the `*.hint` rows, so no one wires an `accessibilityHint`.

## Review log

- Progress shown twice: took "drop the header title, keep the bar". The bar is hidden from VoiceOver and the step title carries "Step 3 of 10" as its value, so focus on a step change reads it; one element, no clutter. The bar's remaining track is a 1 pt `lineField` line (3.34), so the total shows.
- Skip: took the lone full-width Next, kept through revision 1. An empty step advances and writes nothing, so a Skip button would be a second word for the same tap on every one of ten steps.
- Splash error: one block centred between the safe-area insets with Try again at least `space.xl` above the bottom inset (owner round 1, item 1). The tile settles once into the block (M2b).
- Shape question and Body: moot in revision 1; Body left onboarding for Profile (F11).
- Permission denied on the selfie: the action is `common.openSettings`, because the library already sits under the line; one action, one place.
- Contrast evidence (WCAG 2.2) checked in round 2; revision 1 colours come from `design-system.md` (`paper` cards, `#9A5A52` disc edge on `paper`, `plum` arc on canvas 6.89).
- Revision 1, owner rounds 1 and 2: name, hijab, hijab styles, coverage, everyday style, fit, sparkle, location, morning outfit and colours, in the architecture's order. Coverage, style, fit and hijab styles are `ChoiceCard`s; hijab and sparkle stay `ChipRow`s; skin tone chips are gone; the selfie has tips, a face circle with auto capture and a palette with These don't look like me.
- Revision 1, advocate walk: sparkle asked for events (C1-01), the third style card shows western and desi (C1-05), Hair covered starts on for Sometimes too (C1-06), the bar counts the steps she will see (C1-07). C1-02, C1-03 and C1-08 are the illustration re-render; the hijab descriptions follow the C1-03 wording so VoiceOver tells Hijab, Shayla and Al-Amira apart before the art does.
- Notifications step keeps the Off chip. `copy.md` dropped it because "Skip means off", but there is no Skip, and the same ChipRow on Profile has Off; one row in both places, and a chosen time can be taken back without knowing a chip deselects.
- Library path kept. `copy.md` cut `colours.library`; `design-system.md` 17, `motion.md` > Face circle, `architecture.md` > Magic moments (the simulator covers measuring through the library) and UC-F01-07, UC-F01-08 and UC-F01-11 all need it, and a denied camera without it leaves Open Settings as the only way on.
- Place step: superseded in the 3 Oct review. The always-visible Field from `copy.md` is the second choice, named by `place.search`; the quiet Search button, its Expander and `place.city` are gone, so no two controls share a name and nothing moves between the choices.
- Hair covered inside the These don't look like me Expander, as `copy.md` and `motion.md` already have it: it is a correction, and the palette alone is the result.
- Review of 3 Oct, flow design, taken: step 1 without autoFocus under VoiceOver; labelled Segmented controls with "{label}, {option}" segments and a Neutral undertone; `onAccessibilityEscape` as the chevron; the place step as one always-visible Field with one message slot under it; step 9 as a yes or no question; AX5 checks; Swatches as a list at `ax`; no double reads on retake and on a failed lookup from Next; the Field error in its label; the check dropped on edit; hidden library and disc from VoiceOver; a tap on the circle takes the photo; the progressbar exception; ChoiceCard words only in `copy.md`; the unselected `choice` chip edge on canvas; the time chip device check; the feedback line height wording; Retake first; one palette summary; no name placeholder; no bar on done; "plain chip"; "No" on step 2.
- Declined: "`profile.name` is a drawn placeholder, so copy.md should say placeholder". The later finding of the same review removes the placeholder. Since round 2 the step 1 Field is labelled by `onboarding.name.question` and `profile.name` is the Profile row label only.
- Declined: the `place.finding` part of the copy.md finding (make copy.md say busyLabel of Use my location). F01 now follows `copy.md`: `place.finding` is the Field's busy value while Use my location is busy, so the place the city lands is the place VoiceOver says it is being found.
- Superseded: `contain` for the two-figure style cards. Two-figure cards are gone; each style card has its own single-figure render.
- Review of 3 Oct, round 2, taken: the circle as a `button` with a named `takePhoto` custom action and a label that always starts with Camera; the schedule created by `finishOnboarding`, with "Notification before Done: none is scheduled"; Done's Footer holding Add pieces alone and Try the sample closet as the EmptyState action under the title at every size; one figure per style card (`style-abaya-desi`, `style-mix`) and `images[]` dropped from ChoiceCard; AX5 at 61 pt with the sums redone (about 200 pt, the 110 pt Field fits); a failed Next retry scrolls to the error and focuses it; step 9 denial focuses the line; the points read after the Contrast Segmented, no scroll at `ax`; the feedback line top-aligned; the step 8 slot roles and the `plum` check; the question as step 1's Field label; the `#9A5A52` selected chip edge on canvas; head-and-shoulders hijab renders; one loading place on step 8; Next past a failed lookup; "When should your outfit come?"; relaunch before Done on step 1 prefilled; the architecture and use case corrections made at the source; the Selfie recipe updated in `design-system.md`.
- Relaunch before Done opens step 1, not the last step she saw: answers already save on tap and prefill as on Replay, so no new stored step is needed (`src/domain/onboarding.ts` keeps none today), and step 1 is one Next from where she was in a few taps.
- Declined: the empty 22 pt ring on unselected multi-select cards (step 3). Owner call on clutter: seven extra rings on every card before any tap, while the plural question already says more than one can be picked and VoiceOver says checkbox. The disc slot stays transparent until selected.
- Notes for other roles, not edited here: the arc lane in 17, the `faceCircle` first-viewport claim, 19 Swatches "nothing in front", the `*.hint` bullet in `copy.md` and F06's notification row are owned by those roles and sit under Notes for other roles.
