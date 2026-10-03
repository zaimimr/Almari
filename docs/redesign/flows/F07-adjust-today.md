# F07 Adjust today

Date: 2026-10-03. Phase 2b flow design. Inputs: `architecture.md` (Owner decisions apply), `use-cases.md` (F07 rows and the rows that enter or leave this flow), `design-system.md`, `motion.md`, `copy.md`, before screens `today-adjust.png` and `today-pieces.png`.

Routes: `/today/adjust` (Adjust), `/today/pieces` (Start with a piece). Both are pushes with the native stack transition. No sheet, no modal, no floating panel.

Entries:

| Entry | Lands on | Seed |
|---|---|---|
| Today context row (occasion, style, weather chip) | Adjust | Current request; the tapped chip's section placed in view |
| Today problem card action that changes the request | Adjust | Current request; the section the problem names placed in view |
| Piece detail "Plan a day" (UC-F05-16) | Adjust | Piece kept, When Section header placed in view and focused |
| Today "Plan for {day}, not saved" card, "Open plan" | Adjust | The saved planning request, When set to its date, its kept pieces |
| Today "Start with a piece", Today problem action "Start with a piece" | Start with a piece | Current kept pieces selected |
| Adjust "Start with a piece" row (only when nothing is kept) | Start with a piece | Nothing selected; "Start with these" returns to Adjust |

Every styling entry from outside Today (Plan a day, Open plan) opens Your style first when no everyday style exists (hand-off rule 2), then continues here.

Exit: "Show outfit" is Adjust's only commit. It pops to Today in one step (`dismissTo` Today, never a chain) and the new outfit arrives with the Generating moment. With "Save to Your style" on, the same tap also writes the occasion and style to Your style and Today shows no Banner (UC-F07-03). With a When other than Today, Today shows the planning Banner, "Wear this" is not rendered and "Save look" is the Footer primary (F06, F09). The picker opened from Today commits with "Start with these" straight to Today (`dismissTo`); opened from Adjust, "Start with these" only pops back to Adjust. Cancel, or back on the picker, pops with nothing applied.

Before, and what changes:

- `today-adjust.png`: a sheet with an intro sentence, plum-filled selected chips, a caption under Weather and the commit below the fold. Now: a push with Cancel, no intro, blush selected chips, Segmented for fixed choices, no captions, and one full-width commit pinned in the Footer from the first frame.
- `today-pieces.png`: a sheet with a Georgia headline and two helper sentences over an empty area, a strip, and a grey "Done". Now: the empty area is the live FlatLay preview, no helper text, and "Start with these" appears in place once a piece is selected.

## Screens

### 1. Adjust (`/today/adjust`)

Purpose: change the request behind today's outfit, or plan an outfit for another day.

Recipe: Editor. Every block is a plain `Section` on `canvas`; no boxed container. Layout top to bottom:

1. `Screen` title `title.adjust`, `leading="cancel"` (`useDiscardChanges`), no header actions. The Screen root sets `onAccessibilityEscape` to the same `useDiscardChanges` handler as Cancel, so the VoiceOver scrub works although there is no back button.
2. `Section` `adjust.occasion`: `ChipRow` single, `wrap`, every `occasion.*` with its own label (Everyday, Work, Dinner or dawat, Eid, Party or mehndi, Wedding or nikah, Barat). The chip that matches the everyday occasion in Your style (Everyday unless Your style holds another) is the "no session" choice; no chip is relabelled for it. Any other chip starts an occasion session.
3. `Section` `adjust.day` ("When"): `ChipRow` single, `wrap`: `adjust.today`, `adjust.tomorrow` (`choice`), then a third chip, `control` with `chevron.down` and `accessibilityState.expanded` tied to the calendar. Before a date is picked its label is `adjust.pickDate`; once one is picked its label is the short date (`Sat 11 Oct` / `lør. 11. okt.`) and it takes the selected recipe (blush fill, `blushStrong` edge, `accessibilityState.selected`). Its `accessibilityLabel` is always `adjust.pickDate` and `accessibilityValue.text` is the full date once picked ("Choose a date, Saturday 11 October 2026"), so Voice Control users say "Choose a date".
   - Tapping the date chip opens the calendar directly under the ChipRow, in the same Section, exactly as the F09 Plan body: `MonthGrid` `pick` (`design-system.md` 20), full content width, the chosen date selected on the `blush` disc, opening on its month (the current month when none). Pressable days run from the day after tomorrow with no end (`from`; Tomorrow is its own chip); Previous is hidden on the month that holds `from`. A day tap picks the date and closes the calendar (Inline collapse); paging months does not. Tapping the chip again closes it with nothing changed. Tapping Today or Tomorrow while it is open picks that day and closes it. Where MonthGrid uses its Rows form (`ax`, or columns under 44 pt), the month's pressable days are `Row`s under the same month line, trailing `selected` on the chosen one.
   - After a day tap, focus goes to the date chip (shared focus rule).
4. `Section` `adjust.style`: `Segmented` `style.desi`, `style.western`, `style.both`.
5. `Section` `adjust.garment`: `ChipRow` single, `wrap`: `adjust.any`, `today.garment.hijab`, `today.garment.knit`, `today.garment.blazer`, `today.garment.dress`, `today.garment.kurta`, `today.garment.trousers`. Under it, in the same Section, one pieces `Row` in one of two standard Row forms. It changes form in place (label crossfade, height held at the larger of the two forms):
   - Nothing kept: title `today.startWithPiece`, trailing `chevron`, `onPress` pushes Start with a piece. One element, role `button`.
   - Pieces kept: leading `lay` (mini FlatLay, or `thumb` for one piece), title `adjust.keepingOne` / `adjust.keepingMany`, trailing action `adjust.stopKeeping` (quiet, small). No `onPress`, no chevron. The title is one element with the keeping text followed by the kept piece names in dressing order ("Keeping 1 piece, Sage kurta" / "Beholder 1 plagg, Sage kurta"); Stop keeping is its own button (Row > Accessibility). Stop keeping turns the Row back into the first form, from where the picker is one tap away. Stop keeping moves under the title, leading-aligned, whenever the title would wrap beside it (measured with `onTextLayout` at the current text size and language, as the Footer pair), so "Beholder {count} plagg" never wraps to two lines next to the action.
6. `Section` `adjust.weather`: `ChipRow` single, `wrap`: `adjust.useForecast` (only when When is inside the forecast range and the forecast is fresh), `adjust.notSet`, `weather.warm`, `weather.mild`, `weather.cold`. Directly under the chips, in the same Section and with no header of its own: `Segmented` `adjust.dry`, `adjust.rain`, `adjust.snow`, `accessibilityLabel` `adjust.conditions` ("Conditions" / "Føre"). Only with a manual band; the forecast already carries rain and snow.
7. `Section` `adjust.yourDay`: `Segmented` `adjust.indoors`, `adjust.outside`, preselected from Your style (always set there; Mostly indoors by default, F11). Always rendered, whatever the weather choice. It changes this request only.
8. `Section` `adjust.closet`: `Segmented` `today.wardrobeSample`, `today.wardrobeOwned`. Under it, in the same Section, only when pieces are set aside for this request: `Row` `today.includeSetAside`, trailing `toggle`. The `Switch` gets `accessibilityLabel` = the Row title, and the title Text is hidden from VoiceOver, so VoiceOver reads one element ("Include set-aside pieces, switch, off"). Its `hitSlop` `{ top: 7, bottom: 7 }` (design-system Row > Anatomy) is checked on device; if the slop does not reach UISwitch under Fabric, the whole Row becomes the toggle: one Pressable, role `switch`, `accessibilityState.checked`, label `today.includeSetAside`, with the Switch inside it not accessible and not touchable.
9. `Row` `adjust.makeEveryday` ("Save to Your style"), trailing `toggle`, off by default, the last content block, built as the set-aside Row (Switch label, device check). Rendered only while When is Today; it enters and leaves with List insert and List remove, and goes back to off when it leaves. It writes nothing on its own: it is applied when the user taps "Show outfit" (UC-F07-03). Turning it on counts as a change for the Footer.
10. Save error line, only after a failed write: `Text` `footnote` `error` `common.error.save`, the last block of the content, directly above the Footer.
11. `Footer`: one primary `adjust.find`, full width at every text size and for every When.

Footer rules:

- Primary is rendered from the first frame. It is disabled (Footer > Disabled) until the draft differs from the current request or "Save to Your style" is on, and enabled from the first frame when Adjust opens with a seed (Plan a day, Open plan, a problem action).
- The Footer never holds a secondary, so it has one layout across text sizes, languages and days.

```
+---------------------------------------+
| Cancel           Adjust               |
|---------------------------------------|
| Occasion                              |
| ( Everyday ) ( Work ) (*Eid*)         |
| ( Dinner or dawat ) ( Party or mehndi)|
| ( Wedding or nikah ) ( Barat )        |
|                                       |
| When                                  |
| ( Today ) ( Tomorrow ) (*Sat 11 Oct*v)|
|                                       |
| Style                                 |
| < *Desi* |  Western  |  Both >        |
|                                       |
| Garment                               |
| (*Any*) ( Hijab ) ( Knit ) ( Blazer ) |
| ( Dress ) ( Kurta ) ( Trousers )      |
| [lay] Keeping 1 piece   Stop keeping  |
|                                       |
| Weather                               |
| ( Forecast ) ( Not set ) (*Warm*)     |
| ( Mild ) ( Cold )                     |
| < *Dry* |  Rain  |  Snow >            |
|                                       |
| Your day                              |
| < *Mostly indoors* | Time outside >   |
|                                       |
| Closet                                |
| < *Sample closet* | My clothes >      |
| Include set-aside pieces      [ on ]  |
|---------------------------------------|
| (           Show outfit             ) |
+---------------------------------------+
( x ) = choice chip     (*x*) = selected chip (blush fill, blushStrong edge)
v = control chip that opens the calendar under the row
< a | b > = Segmented track, *b* = selected segment
With When Today, "Save to Your style  [ off ]" is the last row above the Footer.
```

Primary action: `adjust.find` "Show outfit".

### 2. Start with a piece (`/today/pieces`)

Purpose: pick the pieces the outfit is built around and see them together before committing.

Shared with the F10 picker mode: the `FlatLay` hero with dashed empty-slot silhouettes, the category `ChipRow` (`closet.all` first, then categories with pieces) and the `Tile` strip with the blush selected disc. Different from F10: here the hero is a preview (no `onPiecePress`, no title), the line under it is the selection count with Clear (F10 has a status line with Fill the rest), and the Footer commits the selection, not a look. Build both from the same ChipRow and strip, not as one screen.

Layout top to bottom. `Screen` scrolls at every text size (the default); the Footer is pinned and the preview is always first:

1. `Screen` title `today.startWithPiece`, `leading="back"` (a selection, not a draft: no Cancel, no guard), no header actions.
2. `FlatLay` `hero`, preview variant (no `onPiecePress`, no title): the selected pieces arranged by `arrangePieces`. With nothing selected it shows the empty-slot silhouettes (dashed `lineField`) for the main, bottom and shoes. Never a sentence on or under it. VoiceOver: each piece is `accessibilityRole="image"` with label = piece name and colour, no hint, in dressing order; empty slots keep their VoiceOver-only label `build.slotEmpty` ("No shoes").
3. Selection line, height reserved from the first frame: `Text` `subhead` `common.selectedOne` / `common.selectedMany` and a quiet small `Button` `pieces.clear`. Until a piece is selected both are at opacity 0 with `pointerEvents="none"`, `accessibilityElementsHidden` and `importantForAccessibility="no-hide-descendants"`, so they can be neither seen, touched nor reached. At `large` Clear wraps under the count, leading-aligned (as Section actions); the reserved height is measured at the current text size in that layout.
4. `ChipRow` single, `scroll`: `closet.all`, then `category.*` for the categories that hold pieces in the current closet (sample or owned). Categories with no pieces are not offered. At `ax` it becomes an `Expander` (tone `plain`, title the chosen filter, `closet.all` or the `category.*` label) whose body is the same ChipRow in `wrap`; a pick resolves and closes it, as the Closet "More" filters.
5. Horizontal strip of `Tile` `strip` size, cut-outs on `canvas`, `selected` shows the blush disc. Pieces put away or unavailable are not offered.
6. `Footer`: primary `pieces.startWithThese`, state Waiting until a piece is selected, then Shown. In Waiting it also carries `pointerEvents="none"` and `importantForAccessibility="no-hide-descendants"`. No secondary.

"Start with these":

- From Today: keeps the selected pieces and pops to Today (`dismissTo`) with the Banner `today.banner.started` / `today.banner.startedMore`.
- From Adjust: pops back to Adjust only and applies nothing else. The pieces Row changes to its kept form in place (lay and count, label crossfade), Garment returns to Any if another garment was chosen, and "Show outfit" becomes enabled. "Show outfit" stays Adjust's only commit. After the stack `transitionEnd`, `setAccessibilityFocus` moves to the pieces Row.
- From Adjust, back (with or without Clear) leaves the kept pieces as they were. Kept pieces are released only with Stop keeping on Adjust.

```
+---------------------------------------+
| <          Start with a piece         |
|---------------------------------------|
|  +---------------------------------+  |
|  |          .-------.              |  |
|  |          | hijab |   .------.   |  |
|  |          '-------'   | kurta|   |  |
|  |     .- - - - -.      '------'   |  |
|  |     : bottom  :                 |  |
|  |     '- - - - -'   .- - - -.     |  |
|  |                   : shoes :     |  |
|  +---------------------------------+  |
|  2 selected                   Clear   |
|                                       |
| (*All*) ( Hijabs ) ( Tops ) ( Kurt..  |
|                                       |
|  +------+   +------+   +------+   +-- |
|  | (o)  |   |   v* |   |      |   |   |
|  |hijab |   |kurta |   | knit |   |   |
|  +------+   +------+   +------+   +-- |
|  Mauve      Sage       Ivory          |
|  chiffon    kurta      knit           |
|---------------------------------------|
| (          Start with these         ) |
+---------------------------------------+
(*x*) = selected choice chip; v* = blush disc with ink checkmark (selected tile)
The content scrolls under the pinned Footer when it does not fit.
```

Primary action: `pieces.startWithThese` "Start with these".

## States

### Adjust

| State | What shows |
|---|---|
| Default | Opens complete with the current request (or its seed). Nothing loads: the request is local. Footer primary disabled until something changes, enabled at once with a seed. |
| Empty | Nothing to be empty: every section always has its choices. The set-aside Row is absent when nothing is set aside. Choosing `today.wardrobeOwned` with an owned closet that cannot make an outfit is allowed; Today then shows its empty card with `closet.addPieces` (F06, UC-F07-06). |
| Kept pieces and Garment | Keeping a piece (picker return or a seed) sets Garment back to `adjust.any` with the selection crossfade, so the screen never holds two requests that contradict each other. |
| Loading | Only the Forecast chip. When When changes to a day inside the forecast range, the Forecast chip is offered at once and shows a `Silk` `placeholder` `chip` (band after `wait`, looping at most `loop`, 5000 ms, then a still band), sized to the measured `adjust.useForecast` label at the current text size, so the wrapped chips do not reflow when it resolves. It keeps the `radio` role and its selected state, with `accessibilityLabel` "{adjust.useForecast}, {common.loading}" ("Forecast, Loading" / "Værmelding, Laster") and `accessibilityState.busy`. It resolves to the Forecast chip. If the fetch fails, the chip stays in place with the `weather.unavailable` label and its selection unchanged, as on Today. A day outside the range has no Forecast chip; if Forecast was selected, `adjust.notSet` becomes selected and one queued announcement says `adjust.chipLabel` with `adjust.weather` and `adjust.notSet` ("Weather, Not set" / "Vær, Ikke satt") (UC-F07-08). |
| Generating | Not on this screen. "Show outfit" sets `accessibilityState.busy` (busy look only after `wait`), pops, and the outfit arranges on Today (Motion). |
| Error | Failed write on "Show outfit" (the request, and Your style when "Save to Your style" is on): the draft stays, the button returns from busy, and `common.error.save` appears at the end of the content (item 10); the scroll brings it into view and it is announced (UC-F07-07). A styling failure after the pop is Today's `today.stylingFailed` with `common.tryAgain` (F06). |
| Offline | No fresh forecast: the Forecast chip is absent and Weather opens on `adjust.notSet` or the manual band already set. Everything else works; styling is on the device (UC-F12-04). |
| Permission denied | Not applicable. The forecast uses the saved city, so this flow asks for no permission. |
| First run | Adjust is never a first screen: the context row exists only once Today has an outfit. A styling entry with no everyday style opens Your style first, then Today; Adjust then opens prefilled from it. |
| Discard | Cancel, back or the VoiceOver scrub with changes: system dialog `common.discardTitle`, `common.keepEditing` / `common.discard`. Swipe back is disabled after the first edit. With no changes Cancel pops at once. |
| Planning | When other than Today: the date chip shows the date, selected; Weather shows that day's forecast when it is in range, else Not set with the manual bands; "Save to Your style" is not rendered. The Footer is unchanged. |
| Largest text | `large`: each `Segmented` becomes a vertical list of `Row`s with a trailing checkmark; Stop keeping sits under the pieces Row title. `ax`: chips keep `wrap`, the calendar becomes the 14-day Rows. The Footer is the same single "Show outfit" at every size. Nothing truncates. |
| Bokmål | Labels: Juster, Anledning, Når (I dag, I morgen, Velg dato), Stil, Plaggtype, Vær (Værmelding, Ikke satt), Dagen din, Garderobe. Conditions Segmented "Tørt / Regn / Snø", VoiceOver "Føre". "Eksempelgarderobe / Mine klær" switches the Segmented to the vertical list. "Ta med plagg lagt til side" and "Lagre i Din stil" wrap in their Rows. "Ikke behold" sits under "Beholder {count} plagg" when the title would wrap. Footer "Vis antrekk". Dates `lør. 11. okt.`, VoiceOver full date. |

### Start with a piece

| State | What shows |
|---|---|
| Default | Kept pieces arrive selected; the preview already shows them. Footer Waiting with nothing selected. |
| Empty closet | No pieces in the current closet: the FlatLay, selection line, category row and strip are not rendered and no Footer is shown. `EmptyState` (no mark) `pieces.none` with primary `closet.addPieces`, which pushes Add pieces (F02); back from there returns here (UC-F07-05, UC-F12-01). |
| Empty category | The selected category has no pieces left (a piece put away while here): the strip is replaced by `EmptyState` `closet.noneFoundTitle` with secondary `common.showAll`, which selects `closet.all`. |
| Loading | Strip tiles whose photos are not decoded yet show `Silk` `placeholder` `tile` (band looping at most `loop`, 5000 ms, then still) and resolve with the Loading fade; the strip region reads `common.loading` once. |
| Generating | Not here. From Today, "Start with these" pops and the outfit arranges on Today. |
| Error | No write happens on this screen; a failed styling result is Today's `today.stylingFailed` (F06). |
| Offline | No change: pieces and photos are on the device. |
| Permission denied | Not applicable. |
| First run | With the sample closet, the sample pieces are offered. With an empty owned closet, the Empty closet state above. |
| Largest text | The screen scrolls at every size. `large`: Tile labels drop their 2 line cap; Clear wraps under the count. `ax`: the category filter becomes its Expander; the strip becomes a list of `Row`s (leading `thumb`, trailing `selected`). The preview stays first and the Footer stays pinned. |
| Bokmål | Title "Start med et plagg", "2 valgt", "Fjern alle", "Alle", Footer "Start med disse". Empty: "Ingen plagg ennå" / "Legg til plagg". |

## Motion

All tokens from `motion.md`.

| Moment | Motion | Reduce Motion |
|---|---|---|
| Open Adjust or the picker | Push and pop: native stack transition. The screen renders complete, no entrance on its content | System |
| Seeded section in view (Plan a day, a context chip, a problem action) | Placed before first paint: the section is measured in `onLayout` and the offset set without animation while the content is still hidden for that one frame (or through `contentOffset`). Not animated. After the stack `transitionEnd` event, `setAccessibilityFocus` on that Section header | Not animated, same focus |
| Choice chip | Selection crossfade (`quick`, `silk`). No haptic | Same |
| Segmented | Thumb translateX (`settle`, `silk`); `selection` haptic. Vertical list: selection crossfade (`quick`, `silk`) | Thumb crossfades (`base`). Vertical list: same crossfade |
| When calendar | Opens under the ChipRow with Inline expand; the date chip chevron rotates (`settle`, `silk`). A day tap: Inline collapse, the date chip label changes with the label crossfade and takes the selected crossfade | Layout in one frame, content fades (`base`), chevron rotates in one frame |
| Conditions appear or leave | Inline expand and Inline collapse, nothing above them moves. Your day stays in place | Fade (`base`), layout in one frame |
| Forecast chip for a chosen day | Loading moment: placeholder at once, band after `wait` (`sheen`, `carry`), at most `loop` then still, resolve fade (`base`, `silk`). Chip offered or removed with a When change: List insert / List remove | Still placeholder, `base` fade; a leaving chip fades out (`base`), neighbours move in one frame |
| Forecast chip becomes `weather.unavailable` | Label crossfade (`quick`, `silk`); neighbouring chips reflow (`settle`, `silk`) | Fade (`base`), layout in one frame |
| Pieces Row changes form (keep, Stop keeping, picker return) | Label crossfade for title, leading and trailing; height held at the larger form. After Stop keeping, focus moves to the Row | Same at `base` |
| Footer primary enabled | Disabled to `plum` crossfade (`quick`, `silk`), no height change | Same |
| "Save to Your style" Row with When | List insert (`base`, `silk`) when When becomes Today; List remove (`quick`, `release`, then `settle`, `silk`) when it leaves Today | Fade (`base`), layout in one frame |
| Show outfit busy | `Silk` busy band over the primary after `wait`, label unchanged | Still band at centre |
| Error line | List insert (`base`, `silk`), then the scroll brings it into view (`settle`, `silk`) | Fade (`base`), `scrollTo` not animated |
| Picker: tile selected | Blush disc crossfades in (`quick`, `silk`). No haptic | Same |
| Picker: preview gains a piece | Flat lay piece swap, incoming half: opacity 0 to 1, translateY -6 to 0 (`arrange`, `fall`) after `step`; the empty-slot silhouette under it fades (`quick`). Other pieces hold still | Crossfade in place (`base`) |
| Picker: preview loses a piece | Outgoing half: opacity to 0, translateY 0 to -4 (`quick`, `release`); the silhouette returns (`base`) | Crossfade (`base`) |
| Picker: Clear | All selected pieces leave together, no stagger: opacity to 0, translateY 0 to -4 (`quick`, `release`); discs fade (`quick`); the silhouettes return (`base`); selection line and Footer primary fade to 0 in place (`quick`, `release`) and become untouchable and hidden. `setAccessibilityFocus` moves to the first Tile in the strip | All fade at once (`base`), same focus |
| Picker: selection line and Footer primary appear | Footer entering: fades in place (`base`, `silk`), no slide, no height change; count text uses the label crossfade | Same fade |
| Picker: category filter | Strip content crossfades (`base`, `silk`); scroll resets to the leading edge without animation | Same |
| Picker: empty category and Show all | `EmptyState` and the strip crossfade (`base`, `silk`) | Same |
| Picker back to Adjust | Native pop; the pieces Row is already in its new form in the first frame. After `transitionEnd`, `setAccessibilityFocus` on the pieces Row | System, same focus |
| Return to Today | One `dismissTo` Today. The occasion, started or planning Banner is already in place in the first frame (Pop to a tab after a flow) | Same |
| Magic moment: Generating on Today | The current outfit stays. `moment-generating` appears. After `wait` the `sheen` passes over the pieces, clipped to their alpha. On the result only changed slots play the piece swap, in dressing order, `step` apart (`arrange`, `fall`); unchanged pieces hold still. The reason line and action row update with the label crossfade. One announcement, `today.announce.outfit` | Current outfit still, still band; changed slots crossfade in place (`base`), no stagger |

No sheet, no slide-in footer, no spring, no scale.

## Copy

All keys exist in `copy.md`. No new keys. `adjust.day` is now "When" / "Når", and `occasion.wedding` and `occasion.barat` are shortened (`copy.md` F07). The calendar uses `calendar.month`, `calendar.previous` and `calendar.next`, shared with F09.

Adjust: `title.adjust`, `common.cancel`, `adjust.occasion`, `occasion.*`, `adjust.day`, `adjust.today`, `adjust.tomorrow`, `adjust.pickDate`, `calendar.month`, `calendar.previous`, `calendar.next`, `adjust.style`, `style.desi`, `style.western`, `style.both`, `adjust.garment`, `adjust.any`, `today.garment.hijab`, `today.garment.knit`, `today.garment.blazer`, `today.garment.dress`, `today.garment.kurta`, `today.garment.trousers`, `today.startWithPiece`, `adjust.keepingOne`, `adjust.keepingMany`, `adjust.stopKeeping`, `adjust.weather`, `adjust.useForecast`, `adjust.notSet`, `weather.warm`, `weather.mild`, `weather.cold`, `weather.unavailable`, `adjust.conditions` (VoiceOver), `adjust.dry`, `adjust.rain`, `adjust.snow`, `adjust.yourDay`, `adjust.indoors`, `adjust.outside`, `adjust.closet`, `today.wardrobeSample`, `today.wardrobeOwned`, `today.includeSetAside`, `adjust.makeEveryday`, `adjust.find`, `adjust.chipLabel` (VoiceOver), `common.error.save`, `common.discardTitle`, `common.keepEditing`, `common.discard`, `common.loading`.

Start with a piece: `today.startWithPiece`, `common.selectedOne`, `common.selectedMany`, `pieces.clear`, `closet.all`, `category.*`, `tile.label`, `build.slotEmpty` (VoiceOver), `pieces.startWithThese`, `pieces.none`, `closet.addPieces`, `closet.noneFoundTitle`, `common.showAll`, `common.loading`.

On Today after the hand-off (owned by F06): `today.banner.occasion`, `today.banner.started`, `today.banner.startedMore`, `today.banner.planning`, `today.backToEveryday`, `today.backToToday`, `today.announce.outfit`, `today.styling`, `today.stylingFailed`, `common.tryAgain`.

Notes:

- Dates on the date chip and the date Rows are `Intl.DateTimeFormat` short form; VoiceOver reads `dateStyle: "full"` (`copy.md` rule).
- No intro line, no caption under Weather, no "today only" helper on this screen. The session Banner on Today says it.

## Use cases

| ID | Screen | State | How it is covered |
|---|---|---|---|
| UC-F07-01 | Adjust | Default, largest text, bokmål | Order Occasion, When, Style, Garment, Weather (with Conditions), Your day, Closet. "Show outfit" pinned full width in the Footer, visible without scrolling. Forecast chip absent when not fresh or out of range. Pops to Today; context row shows the new style and "set by you" weather. |
| UC-F07-02 | Adjust | Default | Occasion `ChipRow` with the Desi event names in the short `occasion.*` labels (Dinner or dawat, Party or mehndi, Wedding or nikah, Barat). A non-everyday occasion starts an occasion session; Today shows `today.banner.occasion`. Everyday style untouched. |
| UC-F07-08 | Adjust | Planning, loading, largest text, bokmål | When Section: Today / Tomorrow / Choose a date with `MonthGrid` `pick` under the row (its Rows at `ax`). Forecast for that day with the Loading moment, or Not set with the manual bands. "Save to Your style" not rendered. Today shows the planning Banner, "Save look" primary, no "Wear this" (F06, F09). |
| UC-F07-03 | Adjust | Default (When Today) | "Save to Your style" toggle on, then "Show outfit": Your style written, Today restyled, no Banner. |
| UC-F07-04 | Adjust | Default | Pieces Row in its kept form with "Stop keeping", and the set-aside toggle Row in Closet; both apply on "Show outfit". |
| UC-F07-05 | Start with a piece | Default, empty closet, empty category, largest text | FlatLay preview, category `ChipRow` (Expander at `ax`), Tile strip, count line with "Clear", Footer "Start with these" appearing in place. From Today: Banner `today.banner.started`. From Adjust: back to Adjust with the pieces Row in its kept form, then "Show outfit". "Stop keeping" on Adjust's pieces Row. Empty closet hands off to Add pieces (F02). |
| UC-F07-06 | Adjust | Default; empty owned closet on Today | Closet `Segmented` Sample closet / My clothes. With no outfit from owned pieces, Today's empty card offers Add pieces (F06). |
| UC-F07-07 | Adjust | Discard, error | Cancel with changes asks `common.discardTitle` (Continue editing, Discard). Failed write: `common.error.save` as the last block above the Footer, draft kept. |
| UC-F05-16 | Adjust | Planning | Entry from piece detail: piece kept, When Section header in view and focused. |
| UC-F06-09 | Start with a piece | Default | Entry from Today "Start with a piece". |
| UC-F06-11 | Adjust, Start with a piece | Default | Problem actions that change the request open Adjust at the named section; "Start with a piece" opens the picker. |
| UC-F06-18 | Adjust | Planning | "Open plan" opens Adjust with the saved planning request and its When. |
| UC-F12-01 | Start with a piece | Empty closet | `pieces.none` with "Add pieces". |
| UC-F12-02 | Adjust, Start with a piece | Largest text | Segmented to Rows, calendar to Rows, category filter to Expander and strip to Rows at `ax`. |
| UC-F12-03 | Adjust, Start with a piece | Bokmål | Labels above, Segmented vertical for Eksempelgarderobe / Mine klær. |
| UC-F12-04 | Adjust | Offline | Forecast chip absent, manual weather, styling works. |
| UC-F12-06 | Today after Adjust | Reduce Motion | Generating crossfade path. |

## Review log

- Hidden-in-place controls: done. Selection line and Waiting primary carry `pointerEvents="none"` plus both VoiceOver hide props; the Adjust Footer no longer hides anything in place. Same line added to `design-system.md` Footer > Waiting.
- Footer pair width at default size: no longer applies. The Footer is one full-width primary.
- Start with a piece clipped below `ax`: fixed. The screen scrolls at every size with the Footer pinned and the preview first; `scroll={false}` is gone.
- Pieces Row: fixed with two standard Row forms (chevron with `onPress`, or trailing Stop keeping with no `onPress`). The `design-system.md` Row exception for this screen is reverted, so "One trailing item only" and "No nested pressables" hold as written.
- Declined: the `absoluteFill` press target recipe for a Row with both `onPress` and Stop keeping, and the matching exception in "No nested pressables". With the two-form Row there is no pressable Row holding a button, so the recipe and the exception are not needed.
- "Save to Your style" is now a toggle Row applied by "Show outfit", so Adjust has one commit. Its own busy, error and pop are gone.
- Your day: a `Segmented` here and on Your style (F11), required there with Mostly indoors as default, so Adjust always has a value. Always rendered on Adjust; only Conditions comes and goes.
- When: a plain Section with a ChipRow and the calendar directly under it, as F09 Plan. One level of disclosure, no boxed container. Same open-ended date range as F09, starting the day after tomorrow because Tomorrow is a chip. With no `surface` container on this screen, the chip edge note for `surface` is added to `design-system.md` Chip > Anatomy for the other Expander bodies.
- Set-aside toggle moved to Closet: it controls which pieces are available, not the garment type.
- Segmented segment height: each segment's Pressable fills the full 44 pt track; the 2 pt inset is visual only (`design-system.md` Segmented > Anatomy).
- Use case wording in `use-cases.md` (UC-F07-01, -02, -03, -04, -06, -08, UC-F05-16) updated to "Show outfit", "Save to Your style" (toggle), "Choose a date" and "When".
- Occasion labels: asked `copy.md` to shorten `occasion.wedding` to "Wedding or nikah" / "Bryllup eller nikah" and `occasion.barat` to "Barat" / "Barat". "Wedding or nikah" keeps one Western and one Desi word with no comma; walima stays in the reason lines. `src/domain/occasions.test.ts` quotes the old label and changes with the build. F11's wireframe now uses the same labels.
- Contrast: every F07 pair passes (WCAG 2.x), confirmed by computation. The date calendar is `MonthGrid` `pick`, as F09 Plan: ink on blush 7.12, the `blushStrong` edge 3.21 on canvas.
