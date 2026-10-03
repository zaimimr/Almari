# F06 Today

Date: 2026-10-03. Phase 2b flow design (plan Task 4). Inputs: `architecture.md` (Owner decisions win), `use-cases.md` UC-F06-01 to UC-F06-18, `design-system.md` (Today recipe, Today action area), `motion.md`, `copy.md` F06. Before: `screens/before/tab-today.png`, `today-empty.png`, `today-check.png`, `today-stylist-results.png`.

Route: `/(tabs)/today`. Tab label `nav.today`. One screen with inline modes. Nothing on Today is a sheet: every change opens in place under what raised it (`Expander`), or pushes a full screen with the native back chevron.

What changes from before: the "Everyday style" capsule, the "A little inspiration for today." line, the sample note and the tinted bed grid are gone. The context line becomes control chips. The outfit is one `FlatLay`. The Footer holds one button.

## Screens

### S1 Today

Purpose: show today's outfit and let the user wear it, change it or save it.

Layout, top to bottom (design-system Today recipe, nothing else):

1. `Screen large` title `nav.today` (Georgia `display`). Header right: one `HeaderItem` icon `person.crop.circle`, label `nav.profile`, pushes `/profile`.
2. Context `ChipRow` (wrap), `Chip kind="control" opens="screen"` (`chevron.right`): occasion (`occasion.*`), style (`style.*`), weather (`weather.chip` / `weather.chipRain` / `weather.chipSnow` / `weather.unavailable` / `weather.unset`), then `closet.sample` last while the sample closet is in use. Each pushes `/today/adjust` (F07) scrolled to its row. VoiceOver labels name the category: `occasion.chipLabel`, `style.chipLabel`, `weather.chipLabel`, `closet.sampleChipLabel`. Every chip has `flexShrink: 1`, so a long label (a long city, snow) wraps inside its capsule (`radius.md`) and never runs past the gutter. In the common case (Work, Western, Oslo 4 to 9°, about 345 pt) the three fit one line at default size on a 390 pt phone; the row wraps when they do not. Temperatures below zero use the minus sign U+2212 (`−6 to −2°`), and `weather.chipLabel` speaks them with `weather.spoken` ("minus 6 to minus 2 degrees" / "minus 6 til minus 2 grader").
3. One `Banner` at most (see Banner order below).
4. `FlatLay size="hero"` with `onPiecePress`. Tapping a piece opens the Change strip (F08); tapping the hijab is how hijabs are compared. Each piece has hint `change.hint`. Every hero piece keeps at least 44 x 44 pt not covered by a higher piece; a unit test on `arrangePieces` output checks this for every fixture. A piece that cannot meet it is reachable by touch from the strip of the piece above it: that strip's header carries a `control` Chip with the covered piece's name (VoiceOver `change.title` for its role) that switches the strip to that piece (F08 Switch piece). VoiceOver also gets it as an `accessibilityAction` on the piece above.
5. Change strip `Expander`, only while open (F08 owns its content).
6. Outfit name in `title` (Georgia, header role), then one `footnote` `inkMuted` reason line, always shown: it is the stylist's why.
7. Check card `Expander tone="attention"`, only when a piece needs an answer, directly under the reason line: the one attention item next to the outfit. At most one rendered; the next open check arrives when this one is answered or its piece leaves.
8. Quiet row: `Button quiet` x3, Another (`today.another`), Save look (`common.saveLook`), Not for me (`outfit.notForMe`), in equal thirds. Every label the row can show (`today.another`, `common.saveLook`, `today.openLook`, `outfit.notForMe`) is measured in a hidden layer before the row is shown, as `design-system.md` Footer > Anatomy does. At `large`, or when any label would wrap, the row is the stacked quiet row from its first frame: the three quiet Buttons full width, one under the other, labels leading-aligned in `plum`. The same layout in English and bokmål (see States, Bokmål). Planning: Another and Not for me only.
9. Not for me `Expander` (reason chips), only while open, directly under the quiet row.
10. Undo slot: one row under the quiet row, the one place where an outfit change on Today is undone (see Undo below). Its height is reserved from the first frame, the loading state included.
11. One `Section` titled `today.startWith`, action `common.showAll` (VoiceOver `looks.showAllLabel`) switching to the Looks tab when there are more saved looks than shown. Content: up to three look `Row`s, then a `ChipRow` of `Chip kind="choice"` multi: Hijab, Knit (`today.garment.hijab`, `today.garment.knit`, hint `outfit.chipHint`), then `Chip kind="control" opens="screen"` `today.startWithPiece` pushing `/today/pieces` (F07). Every other garment starts from a piece.
    - Look Rows are one single-choice list (`radiogroup`): `leading lay`, title = look name, meta `looks.missingOne` / `looks.missingMany` / `looks.variantOf` when it applies. A tap is Show on Today. The look shown now carries the standard trailing `selected` checkmark (`accessibilityState.selected`), like the Change strip Rows at `ax` (F08); pressing it again does nothing. VoiceOver role `radio`, label `today.lookLabel` ("{look}, show on Today", {look} being the Row label per `design-system.md` Row). `accessibilityAction` `today.openLook` on every Row; the Looks tab also opens it.
    - Variant Row: Row with an action under its meta (`design-system.md` Row, `below`). The press area is lay, title and meta; under it, outside the press area, the quiet small Button `looks.fillGap`, leading-aligned with the title, is its own element. The Row also carries `looks.fillGap` as an `accessibilityAction`, so the rotor offers it.
    - While Banner 3 shows, its look is left out of the Rows, so a look shows in one place only. When a session (Banner 1 or 2) is active on a planned date, the planned look is the first Row.
12. Apple Weather link, only while a forecast is shown, the last scroll item, leading-aligned: the Apple Weather mark (`forecast.mark`) drawn in `ink` (13.49 on canvas), at `footnote` line height scaled by `symbolScale` (the Large Content Viewer does not reach in-content images), in a 44 pt target. `accessibilityRole="link"`, label `forecast.markLabel`, opens Apple's data sources page in the browser. This is the attribution WeatherKit requires, on the screen that shows the data.
13. `Footer`: primary `outfit.wear`, nothing else. Planning: primary `common.saveLook`.

Reading order (VoiceOver): Profile, occasion chip, style chip, weather chip, Sample chip, Banner, outfit block, check card, quiet row, Not for me Expander, Undo slot (skipped while empty), Start with (title, Show all, look Rows, chips), Apple Weather link, Footer. The outfit block is one container wrapping hero, Change strip, title and reason line. It sets `experimental_accessibilityOrder` to `today-title`, the piece ids in dressing order (top, bottom, layer, shoes, hijab, accessories), `change-strip` (while open), `today-reason`, so VoiceOver names the outfit before its pieces. FlatLay's own order is not used here, because it cannot reach the strip.

Change strip focus: on a piece tap or "Hijab does not match", the strip scrolls into view and `setAccessibilityFocus` goes to its header. The piece that opened it carries `accessibilityState.expanded`. When the strip closes, focus returns to that piece, or to the Not for me Button if the reason chip opened it.

Expanders on S1: one open at a time, at most one check card rendered. When one Expander replaces another, both height changes run in one `LinearTransition` (`settle`, `silk`), so everything below moves once. The hero never moves when an Expander under it opens, and the title never moves when the check card or Not for me Expander opens.

Banner order (never two stacked; a problem merges into the session Banner and takes its action slot):

| Priority | Banner | Tone | Text | Actions |
|---|---|---|---|---|
| 1 | Planning a day | session | `today.banner.planning` | `today.backToToday` |
| 2 | Occasion or started session | session | `today.banner.occasion`, `today.banner.started`, `today.banner.startedMore` | `today.backToEveryday` |
| 3 | Planned look for this date, everyday active | session | `today.planned` | `looks.showOnToday` |
| 4 | Dated plan left unsaved, everyday active | session | `today.unsavedPlan` | `today.openPlan`, `common.discard` |
| 5 | Outfit stale | notice | `today.noLongerFits` or `today.pieceUnavailable` | `today.findNew` |
| 6 | Styling failed | notice | `today.stylingFailed` | `common.tryAgain` |

When banner 3 and 4 are both due, 3 shows; 4 shows once 3 has left. Banner 4 shows on one visit only (see States).

Everyday default:

```
+--------------------------------------+
| Today                           (o)  |  large title, Profile icon
|                                      |
| [Work >] [Western >] [Oslo 4 to 9° >]|  control chips, one line
|                                      |
|   +------------------------------+   |
|   |      cut-outs on white       |   |  FlatLay hero, tap a piece
|   |   top     hijab              |   |
|   |   bottom  layer   shoes      |   |
|   +------------------------------+   |
|                                      |
| Ivory work tunic                     |  Georgia title
| Picks up the brown in the loafers    |  reason line
|                                      |
|  Another    Save look   Not for me   |  quiet row
|                                      |  Undo slot, empty, height kept
|                                      |
| Start with                 Show all  |  Section
| [lay] Office navy                    |  look Rows, single choice
| [lay] Eid lunch                      |
| [Hijab] [Knit] [Start with a piece >]|  start chips
|                                      |
| Apple Weather                        |  data sources link
|--------------------------------------|
| [            Wear this             ] |  Footer
+--------------------------------------+
```

Only when true, each in its fixed place: Sample chip (after weather), Banner (under the chips), Change strip (under the hero), check card (under the reason line), Not for me Expander (under the quiet row), "Changed  Undo" or "Noted for next time  Undo" in the Undo slot, the trailing checkmark on the look Row that is shown, Fill the gap under a variant Row.

Primary action: Wear this (Footer). Planning: Save look.

Inline modes on S1 (no route):

- Not for me: the quiet Button carries `accessibilityState.expanded`. `Expander` under the quiet row, body `ChipRow` of `button` chips with hint `outfit.chipHint`: `feedback.too-formal`, `feedback.too-plain`, `feedback.too-warm`, `feedback.too-cold`, `feedback.hijab-mismatch`, `feedback.not-my-style`. A tap records the reason, collapses the Expander and plays Generating; when the outfit lands, the Undo slot shows `outfit.thanks` with `common.undo`. Focus goes to the Not for me Button, because the pressed chip has left. Undo restores the outfit and withdraws the reason. "Hijab does not match" closes this Expander and opens the hijab Change strip with the reason kept (UC-F08-02); focus goes to the strip header, and the slot fills only when a hijab is picked.
- Check card: `Expander tone="attention"` with the Expander's standard header: needs-an-answer dot, title `today.check.title`, `chevron.down`. Open: the question (`coverage.askSleeve`, `coverage.askLength`, `coverage.askSheer`, `coverage.askOpen`, `coverage.askBoth`) as a single-choice `ChipRow` (`value.*`), the piece as a `Row` (`thumb`, name, `chevron`, VoiceOver `today.openPiece`) pushing `/piece/[id]`, actions `check.save` (secondary) and `check.useAnother` (quiet, opens the Change strip on that piece). Tapping the header collapses it; nothing is saved and the card waits in place. It leaves when answered or when the piece leaves the outfit, and the next check, if any, takes its place.
- Save look: saves at once with the suggested name (owner decision 2). The label crossfades in place to `today.openLook`; tapping it pushes `/look/[id]`. Presses on the new label are ignored until the crossfade ends (`quick` + `base`), so a double tap never saves and opens. Whenever the outfit changes (Another, Show on Today, Undo, a pick), the label crossfades back to `common.saveLook`. When the shown outfit is already a saved look, it reads `today.openLook` from the first frame. No toast, no builder.
- Undo: one level, one place. Every outfit change on Today undoes from the Undo slot: Another, Show on Today, Fill the gap and a Change strip pick (F08) show `result.changed` with `common.undo`; a Not for me reason shows `outfit.thanks` with `common.undo`. The content crossfades in (`base`, `silk`) when the result lands and out (`quick`, `release`) on Undo or the next action elsewhere. The slot never changes height and is never an inline expand. Its height comes from a hidden layer that lays out the tallest bar it can show (`result.changed` or `outfit.thanks`, plus `common.undo`), side by side or stacked (action under text) as it would render, at the current fontScale and language. It is measured before the first frame, in the loading state too, and again on a fontScale or language change. While empty it sets `accessibilityElementsHidden`, so VoiceOver never lands on a blank element. Focus stays on the pressed control (Not for me: see above). Announcement, one per change, never by the slot: the slot text is not announced; Another, Show on Today, Fill the gap and a Not for me reason announce `today.announce.outfit`, a Change strip pick announces `result.changed`, queued (F08). After Undo, focus returns to the control that made the change, or to Another when that control is gone. The only other Undo on Today is the Footer: after Wear this it becomes a `ResultBar` (`outfit.worn`, `common.undo`), because it replaces the action it undoes. One ResultBar per screen: the Worn bar empties the slot, and a slot result restores the Footer. Start with chips are not Undo triggers (a toggle is its own undo).
- Last and only outfit: after the last combination the reason line slot shows `today.lastCombination` once, and the next Another starts over. With one combination Another is not rendered and the line reads `today.onlyCombination`.
- Planning (F07 hand-off): Banner 1, no Wear this, Footer primary Save look (crossfades to `today.openLook` after saving). Back to today with an unsaved changed plan: the planning Banner asks in place. Its text crossfades to `today.savePlanTitle` and its action row to `common.saveLook` (secondary) and `common.discard` (quiet). From its first frame the planning Banner reserves the taller of its two texts (measured in a hidden layer) and, at `large` and above, the stacked two-action row, as Expander > Anatomy does for a second action. So the question changes no height at any size and the hero does not move. Focus moves to the question text. Acting elsewhere restores Back to today. No dialog floats over Today and nothing is added to the Footer.

### S1a First run (onboarding skipped)

Purpose: get to a first outfit when no everyday style exists.

Layout: `Screen large` `nav.today` with the Profile icon / `EmptyState mark` (scarf A on the plum tile, still), no title (the large title already says Today; the Today first-run exception in `design-system.md` EmptyState), primary Button `today.firstRun.style` pushing `/profile/style` (F11), then quiet Button `sample.try`. No context row, no Section, no Footer.

```
+--------------------------------------+
| Today                           (o)  |
|                                      |
|              [ A ]                   |  mark
|                                      |
|        [   Set your style   ]        |  primary
|        Try the sample closet         |  quiet
|                                      |
+--------------------------------------+
```

Primary action: Set your style. Save on Your style returns here and the outfit arrives. "Try the sample closet" runs `busy` on its Button, then S1 replaces S1a (see Motion, S1a to S1).

### S1b No outfit can be made (conflict)

Purpose: say what stops the outfit and offer the one fix for each problem.

Layout: `Screen large` / context ChipRow / session Banner if any / `FlatLay hero` of the kept pieces with a dashed empty slot per missing role / problems / Section Start with / Apple Weather link while a forecast is shown / `Footer` in Waiting (no Wear this).

Problems use the Banner notice anatomy, in one notice container under the hero (so never two Banners stacked): per problem the `body` `ink` line (`styling.*`, `coverage.*`, `stylist.*`), then its fix under it in a leading-aligned row at `control.small`, problems `space.lg` apart. The first problem's fix is `secondary`, the rest `quiet`. Same layout at every text size and in both languages.

Fixes, one per problem: `today.stopKeeping`, `today.anyType`, `today.switchTo`, `today.clearWeather`, `today.includeSetAside`, `today.startWithPiece` (push `/today/pieces`), `closet.addPieces` (push `/capture`, F02, back returns here), `sample.try`, `today.answerQuestion` (opens the blocking check card), `today.openPiece` (push `/piece/[id]`).

```
+--------------------------------------+
| Today                           (o)  |
| [Eid >] [Desi >] [Oslo −6 to −2° >]  |
|   +------------------------------+   |
|   |  kept kurta    [ - - - ]     |   |  dashed empty slot
|   +------------------------------+   |
| +----------------------------------+ |
| | No shoes for snow                | |  problem line
| | [Start with a piece]             | |  first fix, secondary
| |                                  | |
| | Kept dupatta is put away         | |
| | Stop keeping dupatta             | |  quiet
| +----------------------------------+ |
+--------------------------------------+
```

Primary action: the first problem's fix. Each action resolves on Today or pushes and returns here.

## States

| State | Where | What shows |
|---|---|---|
| Empty, first run | S1a | Mark, Set your style, Try the sample closet. No context row before a session exists (UC-F06-01) |
| Empty, no saved looks | S1 Section | Start with shows only the chips; no look Rows, no Show all |
| Empty, no planned look | S1 | Banner 3 is not rendered; nothing reserves its space |
| Empty, closet cannot make an outfit | S1b | Problems with Add pieces or Try the sample closet. Never shown the morning after adding pieces (rule 8, UC-F02-21) |
| Loading, cold launch | S1 | Header and context chips present at once. `Silk placeholder` in the `lay` shape for the hero is the only loading cue; text placeholders for title and reason line are sized from line height x fontScale (title capped at 2.0x), and the Undo slot height is already reserved, so nothing jumps at AX3. The Footer is in Waiting (reserved height, opacity 0) until the outfit resolves, then plays Footer entering. Resolves with the Loading fade, never Generating. VoiceOver `common.loading` once on the flat lay region |
| Loading, forecast | Weather chip | `Silk placeholder` `chip`, then the chip text and the Apple Weather link at the end of the scroll, or `weather.unavailable` |
| Generating | Hero | Another, Adjust return, Start with chip, Start with these, Show on Today, Fill the gap, Not for me, Open plan, Save and update today, a new day while Today is mounted. Current outfit stays; changed slots swap in dressing order. One visible cue at a time: the sheen on the hero; the tapped control keeps its look and sets `accessibilityState.busy`, and shows the still busy band only after the hero's band has faded at `loop`. `moment-generating` testID while running, announced `today.announce.outfit`, `today.styling` as the busy label |
| Error, styling | S1 | Notice Banner `today.stylingFailed` with Try again. The last outfit stays when there is one; otherwise the hero is the dashed empty lay and the Footer waits. Never a stuck "Styling" line |
| Error, save | Footer or quiet row | `common.error.save` as `footnote` `error` directly under the control that failed: under the Footer button for Wear this, under the quiet row for Save look, under the check card actions for Save answer. The control returns to its label. Announced |
| Error, outfit stale | S1 | Notice Banner `today.noLongerFits` or `today.pieceUnavailable` with Find a new outfit; the old outfit stays under it |
| Offline | Weather chip | `weather.unavailable`, no Apple Weather link, tap pushes Adjust weather. The outfit is still styled from local data. Pull to refresh or foreground refetches |
| Permission denied | None | Today asks for no permission. The forecast uses the city from onboarding or Profile; with no city the chip reads `weather.unset` and opens Adjust weather |
| First run | S1a | As Empty, first run. Only reachable when onboarding was skipped |
| Session: occasion, started, planning | Banner 1 or 2 | The banner is there in the first frame on return from Adjust; it is always true and gone on the next day |
| Planned for today | Banner 3 | First block above the outfit. Show on Today, then Wear this. Its look is not repeated in Start with. Leaves the next day |
| Unsaved plan | Banner 4 | Shown on the first visit to Today after the plan was left, once. Open plan restores the planning session; Discard drops it. Ignored, it does not come back, and the plan is dropped when its day passes |
| Worn | Footer | `ResultBar` `outfit.worn` with Undo. A second outfit worn the same day is its own wear |
| Saved | Quiet row | Save look reads `today.openLook` until the outfit changes |
| Reduce Motion | Everywhere | Swaps crossfade in place, all changed slots at once (no stagger), expands lay out in one frame, placeholders still, no band on the flat lay (motion.md) |
| Largest text (AX3) | S1 | Context chips wrap, a wrapped chip label switches the chip to `radius.md`; title capped at 2.0x; stacked quiet row; Footer Wear this alone, its Worn ResultBar puts the action under the text; Banner, check card and Undo slot actions stack under their text; Fill the gap stays under the variant Row; the Change strip becomes Rows (F08); the Apple Weather mark grows by `symbolScale`. Nothing truncates |
| Bokmål | S1 | Tab `I dag`. Footer `Bruk i dag`. Quiet row, SF Pro Semibold 17: `Et annet` 69 pt, `Lagre look` 87, `Åpne look` 83, `Passer ikke` 96. A third on a 375 pt phone is 343 / 3 = 114 pt, so a label gets 98 pt inside the `space.sm` padding (8 + 8): every label fits, as in English (widest `Not for me` 89, `Open look` 84). Both languages get thirds at default size on 375, 390 and 402 pt phones and the stacked row at `large`. Section `Start med`, chips `Hijab`, `Strikk`. `Fra samlingen` is not shown on Today. Temperatures show U+2212 and are spoken "minus 6 til minus 2 grader" |

## Motion

All values are `motion.md` tokens.

| Moment | Motion |
|---|---|
| Cold launch | Splash drape, hand-off at drape end, overlay fades (`settle`, `silk`). Today is already mounted under it. If the closet is not loaded, the placeholder flat lay resolves with the Loading fade (`base`, `silk`), then the Footer plays Footer entering (`base`, `silk`). Never Generating on launch |
| Warm launch | Nothing plays |
| New outfit (Generating) | Tap: nothing moves, `moment-generating`, the tapped control sets `accessibilityState.busy` and keeps its look. After `wait`, `sheen` over the pieces clipped to their alpha. After `loop` the band fades out (`quick`) so no light sits on the cloth, and the tapped control shows the still busy band until resolve (Today stays usable). Result: changed slots play Flat lay piece swap (outgoing `quick` `release`, incoming after `step`, `arrange` `fall`) in dressing order `step` apart; unchanged pieces hold. Title and reason line update with the label crossfade after the last swap. A second Another mid-swap starts from where the pieces are |
| Piece tap | `lift` while the finger is down, back with `settle` `fall`. The Change strip opens with Inline expand under the hero |
| Change strip pick | Flat lay piece swap on that slot only (F08), then the Undo slot crossfades in |
| Not for me, check card | Inline expand (`settle`, `silk`, content after `step`, `base`) and Inline collapse. Chevron rotates 180 degrees (`settle`). When one Expander replaces another, both height changes run in one `LinearTransition` (`settle`, `silk`) |
| Not for me reason | Inline collapse of the Expander, Generating, then the Undo slot crossfades in `outfit.thanks` with Undo |
| Undo slot | Text and action crossfade in (`base`, `silk`) and out (`quick`, `release`). No height change |
| Save look to Open look | Banners and bars label crossfade; `success` haptic on Save look |
| Save this plan question | Banner text and action row label crossfade; no height change (reserved, see Planning) |
| Wear this to Worn today | ResultBar crossfade in the Footer (`quick` `release` out, `base` `silk` in); `success` haptic. Undo crossfades back |
| S1a to S1 (Try the sample closet, Set your style returning) | EmptyState fades out (`quick`, `release`), S1 content fades in (`base`, `silk`) with the hero placeholder or the outfit, then Footer entering (`base`, `silk`). No height jump in the content above the Footer |
| Banner leaves (Back to everyday, Show on Today, Discard) | Inline collapse (`settle`, `silk`); once it settles the changed slots swap (Generating), so the pieces fall only when the hero has stopped moving up. The title crossfades together with the last swap |
| Banner on return from Adjust or a tab switch | In place in the first frame, no expand (Pop to a tab after a flow) |
| Tab switch from Show on Today in Looks | Instant; then Generating on Today |
| Choice chip toggle | Selection crossfade (`quick`, `silk`), then Generating |
| Placeholders and busy | `Silk` per Loading; busy Buttons keep their label |
| Reduce Motion | Swaps crossfade (`base`), all changed slots at once with no stagger. Expands lay out in one frame with a content fade; collapses fade (`base`) then lay out in one frame. Expander chevron swaps at once, no rotation. No band on the flat lay; the tapped control shows the still band after `wait`. Banner leaves: the swap crossfade starts after the collapse fade and its one-frame layout. S1a to S1: the same crossfades, opacity only. No `lift` travel (shadow steps at once) |

Magic moments on this flow: Loading (launch, forecast chip) and Generating (every new outfit).

## Copy

All keys from `copy.md` F06 unless noted.

| Place | Keys |
|---|---|
| Header | `nav.today`, `nav.profile` |
| First run | `today.firstRun.style`, `sample.try` |
| Context row | `occasion.*`, `style.*`, `closet.sample`, `occasion.chipLabel`, `style.chipLabel`, `closet.sampleChipLabel`, `weather.chip`, `weather.chipRain`, `weather.chipSnow`, `weather.unavailable`, `weather.unset`, `weather.chipLabel`, `weather.spoken`, `weather.setByYou` (VoiceOver) |
| Apple Weather link | `forecast.mark`, `forecast.markLabel` |
| Banners | `today.banner.occasion`, `today.banner.started`, `today.banner.startedMore`, `today.banner.planning`, `today.backToEveryday`, `today.backToToday`, `today.savePlanTitle`, `common.saveLook`, `today.planned`, `today.unsavedPlan`, `today.openPlan`, `common.discard`, `looks.showOnToday`, `today.noLongerFits`, `today.pieceUnavailable`, `today.findNew`, `today.stylingFailed`, `common.tryAgain` |
| Outfit | `outfitName.*`, `reason.*`, `outfitTip`, `today.lastCombination`, `today.onlyCombination`, `today.styling`, `today.announce.outfit`, `change.pieceLabel`, `change.hint`, `change.title` (covered piece chip) |
| Quiet row | `today.another`, `common.saveLook`, `today.openLook`, `outfit.notForMe`, `result.saved` (announced) |
| Undo slot | `result.changed`, `outfit.thanks`, `common.undo` |
| Not for me | `feedback.too-formal`, `feedback.too-plain`, `feedback.too-warm`, `feedback.too-cold`, `feedback.hijab-mismatch`, `feedback.not-my-style`, `outfit.chipHint` |
| Check card | `today.check.title`, `coverage.askSleeve`, `coverage.askLength`, `coverage.askSheer`, `coverage.askOpen`, `coverage.askBoth`, `value.*`, `check.save`, `check.useAnother`, `today.openPiece` |
| Problems | `styling.*`, `coverage.*`, `stylist.keptAway`, `stylist.keptArchived`, `today.stopKeeping`, `today.anyType`, `today.switchTo`, `today.clearWeather`, `today.includeSetAside`, `today.startWithPiece`, `closet.addPieces`, `sample.try`, `today.answerQuestion`, `today.openPiece` |
| Start with | `today.startWith`, `today.garment.hijab`, `today.garment.knit`, `outfit.chipHint`, `today.startWithPiece`, `today.lookLabel`, `looks.variantOf`, `looks.fillGap`, `looks.missingOne`, `looks.missingMany`, `today.openLook` (Row action), `common.showAll`, `looks.showAllLabel` |
| Footer | `outfit.wear`, `outfit.worn`, `common.saveLook`, `today.openLook`, `common.undo`, `common.error.save` |
| Loading | `common.loading` |

Added to `copy.md` by this flow: `today.answerQuestion`, `occasion.chipLabel`, `style.chipLabel`, `closet.sampleChipLabel`, `today.lookLabel`, `weather.spoken`. Changed: `outfit.notForMe` NB `Passer ikke`, `today.another` NB `Et annet`, `today.openLook` NB `Åpne look`. Cut from Today: `looks.showing` (the trailing checkmark says it), `today.changeHijab` (the hijab in the flat lay opens the hijab strip). Today uses `common.showAll`, not `common.showAllCount`.

## Use cases

| ID | Screen | State |
|---|---|---|
| UC-F06-01 | S1a, then S1 | First run, empty, loading (sample Button busy), S1a to S1 crossfade |
| UC-F06-02 | S1 | Generating (new day while mounted), loading (cold launch, Footer in Waiting), large text, bokmål |
| UC-F06-03 | S1 quiet row, hero | Generating, last and only outfit lines, reduce motion |
| UC-F06-04 | S1 Footer | Worn ResultBar, Undo; second wear after Adjust |
| UC-F06-05 | S1 Not for me Expander, Undo slot | Reason collapses the Expander, thanks with Undo in the slot; hijab-mismatch hands off to the hijab strip |
| UC-F06-06 | S1 quiet row | Saved (Open look), back to Save look after Another, error under the quiet row |
| UC-F06-07 | S1 check card | Open, collapsed, answered (next check arrives), gone with the piece |
| UC-F06-08 | S1 Section Start with | Look Row tap shows it (selected checkmark), variant Row with Fill the gap under it, Open look action, Show all, Banner 3 look left out |
| UC-F06-09 | S1 Section Start with | Hijab and Knit selected, Start with a piece push |
| UC-F06-10 | S1 context row, Apple Weather link | Loading chip, forecast with the link at the end of the scroll, set by you, offline unavailable, minus temperatures |
| UC-F06-11 | S1 Banner 5, S1b | Stale outfit, problems, every fix; Add pieces returns here |
| UC-F06-12 | S1 Banners 1 and 2 | Back to everyday, Back to today, Save this plan asked in the planning Banner |
| UC-F06-13 | S1 Banner 6 | Styling error with Try again |
| UC-F06-14 | S1 Undo slot | One level, one slot for every outfit change, reserved from the first frame, no layout shift |
| UC-F06-15 | S1 Footer | Save error under the Footer button |
| UC-F06-16 | S1 header | Profile push and back |
| UC-F06-17 | S1 Banner 3 | Planned for today, Show on Today, Wear this; variant when a piece is missing |
| UC-F06-18 | S1 Banner 4 | New day: occasion gone, unsaved plan offered once, Open plan restores it |

Touches from other flows that land here: UC-F07-08 (planning banner), UC-F08-01 to UC-F08-06 (Change strip inline on S1, Undo in the Today slot), UC-F09-11 (planned look surfaces as Banner 3).

Lane 1 device check: the `design-system.md` Semantics on device check covers, in English and on an nb-NO device, radio/selected (look Rows), checkbox/checked (Hijab, Knit), expanded (Not for me, check card, hero piece) and busy (Another), so every state word is read in bokmål. The nb-NO pass also checks that the weather chip reads "minus", never "bindestrek".

## Hand-off notes

- Save this plan is asked inside the planning Banner, not in the Footer and not a system dialog. `copy.md` `today.savePlanTitle` is updated; UC-F06-12 should say "the planning banner asks Save this plan? with Save look and Discard" (glossary: never Drop).
- `use-cases.md` texts to correct: UC-F06-01 "Try the sample style" is `sample.try` "Try the sample closet"; UC-F06-08 "From your looks" cards with "Show on Today" are Start with Rows where a tap shows the look; UC-F06-09 chips are Hijab and Knit only, Blazer, Dress, Kurta and Trousers start from a piece; UC-F06-18 "From your looks carries Plan for..." is Banner 4 and "Drop" is "Discard". UC-F08-02, UC-F08-06 and UC-F11-02: "Compare hijabs" becomes "tap the hijab in the flat lay".
- F08: already undoes a pick from Today's Undo slot, so nothing to align there. To change: the Footer entry "Change hijab" is gone (entries are a flat lay piece and the "Hijab does not match" chip), so drop the Footer item in S1, the "Switch piece" sentence about the Footer button and `today.changeHijab` from its copy table. Add the header `control` Chip for a covered piece (S1 item 4 here).
- F11: Your style drops the outfit card layout `Segmented` (`style.layout`, `style.layout.*`); the reason line is always shown.
- `design-system.md` updated in the same pass: Row `below` action, ResultBar Focus (Undo slot rule), FlatLay (no `CardLayout`), Expander Change strip Undo, EmptyState first-run title, Today recipe order, Today action area (one Footer button, measured quiet row, one Undo slot), review log.
- `motion.md` updated: Loop limit and Reduce Motion fade the band off a flat lay instead of leaving it still on the cloth.
- `architecture.md` updated: tab icon `sun.horizon`, Inline modes rows for the Change strip, Apple Weather link and action row, `/today/hijab`, F08 entry, Your style without card layout.
- Today keeps one Section, `today.startWith`, holding look Rows and the chips (design-system review log). `looks.fromYourLooks` is not shown on Today; the architecture rows that say "From your looks" mean these Rows.

## Review log

- **Save this plan in the Banner, not under its action row.** The question replaces the planning Banner's text and the action row crossfades to Save look and Discard, instead of adding a text line above the actions. The Banner reserves the taller text and, at `large`, the stacked two-action row from its first frame, so the hero does not move at any size.
- **Apple Weather mark moved to the end of the scroll.** It was beside the weather chip (`architecture.md` row 75), which put the common case on two chip lines plus a 44 pt mark before the outfit, and a long city overflowed the non-breaking chip and mark group at `large`. As a link under Start with it still attributes the data on the screen that shows it; occasion, style and weather fit one line in the common case, and with no group left, a long weather chip just wraps its label. Row 75 is updated.
- **Footer holds only Wear this.** "Change hijab" opened the same strip as tapping the hijab, so the Footer held two buttons on nearly every outfit for a hijab-wearing user. This supersedes `architecture.md` row 81 and the `design-system.md` review log entry. The advocate's 07:10 need (B6-03, hijab then Wear this) is still one tap: the hijab in the flat lay, with hint `change.hint`.
- **Reason line always shown.** One `footnote` sentence is the stylist's why; a setting for it meant two versions of Today. `CardLayout` is deleted here and in `design-system.md` FlatLay; F11 drops the setting.
- **One Undo slot.** Another, Show on Today, Fill the gap, a strip pick and a Not for me reason all undo from the slot under the quiet row. The Footer Worn bar is the only other Undo, because it replaces the action it undoes.
- **Quiet row keeps three buttons.** Kept as `architecture.md` row 81 ranks them: Not for me records a reason the stylist learns from, Another does not, and merging them would put a "Why?" into the Undo slot on every change. In bokmål `Et annet` and `Passer ikke` share no word, so they do not read alike.
- **Banner leaves: swaps still wait for the collapse (partly declined).** The Banner sits above the hero, so its collapse moves the hero up; starting the swaps with it would drop pieces onto a moving canvas, two motions at once. The title crossfade now runs with the last swap instead of after it, which shortens the sequence.
- **One cue while generating.** The sheen on the hero is the cue; the tapped control only sets `accessibilityState.busy`. After `loop` the band fades off the cloth (a still band would tint the garment) and the control takes the still busy band.
- **No checkmark on the Hijab and Knit chips.** `design-system.md` Chip keeps "no glyph, so the chip keeps its width"; the selected state passes contrast (edge 3.06 to 3.21) and VoiceOver reads checkbox/checked.
- **Change strip still sits above the title.** Opening it moves the title down by design (F08 places it under the hero); the rule that nothing else moves covers the title only for Expanders under it.
- **Contrast recomputed.** Every colour pair on this flow was rechecked with WCAG 2.2 relative luminance and matches `design-system.md`; nothing fails.
