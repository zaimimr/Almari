# F06 Today

Date: 2026-10-03. Phase 2b flow design, Revision 1 pass. Inputs: `architecture.md` (Owner decisions, Revision 1 changes, Revision 2 changes and the Today rows of Inline modes win), `advocate-walkthroughs.md` (Revision 1 walk, architect response), `owner-feedback.md` rounds 1 and 2, `use-cases.md` UC-F06-01 to UC-F06-23, `design-system.md` (Today recipe, Today action area, FlatLay, Button icon variant), `motion.md`, `copy.md` F06 and Revision 1 > F06 Today. Before: `screens/before/tab-today.png`, `today-empty.png`, `today-check.png`, `today-stylist-results.png`.

Route: `/(tabs)/today`. Tab label `nav.today`. One screen with inline modes. Nothing on Today is a sheet: every change opens in place under what raised it (`Expander`), or pushes a full screen with the native back chevron.

What changes in this pass: the large title greets her by name. Like, Not for me and Save look are icons on the outfit's title line. The quiet row holds Another alone; Not for me sits next to Undo after Another. The reason line carries the coverage sentence. The hijab carries an always-on swap mark. Rediscover is its own Section. The 21:00 notification opens Tomorrow's outfit. Everything else from the first pass stands.

The wear calendar is not on Today: it lives at `/looks/calendar` (F09). Today feeds it through Wear this.

## Screens

### S1 Today

Purpose: show today's outfit and let her wear it, change it or save it.

Layout, top to bottom (design-system Today recipe, nothing else):

1. `Screen large`. Title: the greeting, `greeting(name, hour, locale)` (`today.greeting.*`), computed when Today gains focus and when the app returns to the foreground, never while Today is visible. The hidden layer measures it with the exact `headerLargeTitleStyle` from `src/navigation/options.ts`: Georgia, or Georgia-Bold while Bold Text is on, 34 x min(fontScale, 1.76) as the integer the native header takes, tracking 0 (the native large title takes no letter spacing, so the type table's -0.4 would measure narrow). A fontScale change or `boldTextChanged` measures it again. It takes the first form that fits one line. With a name: `today.greeting.*`, then `today.greeting.short` (drops the time of day, keeps her name), then `nav.today`. Without a name: `today.greeting.*Plain`, then `nav.today`. It never truncates. Header right: one `HeaderItem` icon `person.crop.circle`, label `nav.profile`, pushes `/profile`.
2. Context `ChipRow` (wrap), `Chip kind="control" opens="screen"` (`chevron.right`): occasion (`occasion.*`), style (`style.*`), weather (`weather.chip` / `weather.chipRain` / `weather.chipSnow` / `weather.unavailable` / `weather.unset`), then `closet.sample` last while the sample closet is in use. Each pushes `/today/adjust` (F07) scrolled to its row. VoiceOver labels name the category: `occasion.chipLabel`, `style.chipLabel`, `weather.chipLabel` (`weather.chipLabelTomorrow` on Tomorrow's outfit), `closet.sampleChipLabel`. Every chip has `flexShrink: 1`, so a long label wraps inside its capsule (`radius.md`) and never runs past the gutter. In the common case (Work, Western, Oslo 4 to 9°, about 345 pt) the three fit one line at default size on a 390 pt phone. Temperatures below zero use U+2212 (`−6 to −2°`), spoken with `weather.spoken`.
3. One `Banner` at most (see Banner order).
4. `FlatLay size="hero"` with `onPiecePress`, centred, capped at 236 pt, with or without a Banner, so it never resizes (`design-system.md` FlatLay > Anatomy has the budget). Tapping a piece opens its Change strip (F08); hint `change.hint`, on the hijab `change.hintHijab`. The hijab always carries the swap mark (`arrow.2.squarepath`, plum on a 26 pt canvas disc, scaled by min(`symbolScale`, 1.35), so at most 35 pt) at the top trailing corner of its frame, inside its own hit area, hidden from VoiceOver. It is never its own button and the only mark ever drawn on a flat lay. Every hero piece keeps at least 44 x 44 pt not covered by a higher piece; a unit test on `arrangePieces` output checks this for every fixture at the 236 pt hero, counting the swap-mark disc as hijab area. A covered piece is reached from the strip of the piece above it (a `control` Chip with its name in the strip header, F08 Switch piece) and as an `accessibilityAction` on that piece.
5. Change strip `Expander`, only while open (F08 owns its content).
6. Title line: outfit name in `title` (Georgia, header role) leading and wrapping; trailing, top-aligned to its first line, three `Button icon`: Like (`hand.thumbsup`), Not for me (`hand.thumbsdown`), Save look (`bookmark`), `space.sm` apart (3 x 44 + 2 x 8 = 148 pt at default size), so thumbs up and thumbs down are not one slip apart. The three move to their own line under the reason line, leading-aligned, same order, at `large` and up, and below `large` whenever the hidden layer finds the longest word a title can hold (the `outfitName.*` words in the current language and her look names) wider than the title column (content width less the icons and `space.sm`), so a bokmål compound never breaks mid-word. Measured when Today gains focus and on a fontScale or language change, never per outfit, so Another never moves the icons. Planning and Tomorrow's outfit: Save look is not rendered; Like and Not for me sit flush trailing.
7. Reason line: one `footnote` `inkMuted` text element, always shown: the stylist's reason, then the coverage sentence (`coverageNote.*`) as its second sentence when `coverageNote` returns one ("Picks up the brown in the loafers. Blazer covers the arms."). The reserve is a minimum height, never a line cap: `numberOfLines` is not set and the text wraps. The hidden layer measures the tallest of two lines, the current text, and the longest `reason.*` followed by the longest `coverageNote.*`, at the current fontScale and language. The coverage sentence is left out of that measure while her coverage answer is No preference, since `coverageNote` then never returns one. It fills `{a}` and `{b}` with the longest name `nameFor` gives (longest `colour.*`, then longest `kind.*`), `{occasion}` with the longest occasion phrase and `{piece}` with the longest `kind.subject.*`, the same fill as the `copy.md` length rule, which keeps every pair within two lines at default size, so the reserve is the two-line slot of the `design-system.md` budget. It measures before the first frame and again on a fontScale, language or coverage answer change, so a new outfit does not move what is under it. When an outfit's text still needs more (a name she typed that is longer than the fill), the line grows once inside the same `LinearTransition` as its crossfade (`settle`, `silk`; one frame under Reduce Motion) and the content below follows (`design-system.md` FlatLay > Reason line). While a check is unanswered for a piece in the outfit, the coverage sentence is not drawn: the check card asks about the same need.
8. Not for me `Expander` from the card icon (headless, reason chips), only while open, directly under the reason line (under the icon line at `large`), inside the outfit block. Its trigger sits above it and does not move when it opens.
9. Check card `Expander tone="attention"`, only when a piece needs an answer, under the reason line (under the icon line at `large`), after the card's Not for me reasons while they are open. At most one rendered; the next open check arrives when this one is answered or its piece leaves.
10. Quiet row: one `Button quiet`, full content width, label centred: Another (`today.another`). When the outfit shown is the last combination, its label crossfades to `today.lastCombination` and the next press starts over at the first outfit; any other outfit change crossfades it back. Focus stays on it and VoiceOver does not re-read a changed label, so on the last combination `today.lastCombination` is queued after `today.announce.outfit`. With one combination there is no button: the row holds `today.onlyCombination` as a `footnote` `inkMuted` line, centred. The row's height is measured in the hidden layer from all three (both labels and the line), in English and bokmål, so it never changes. It is never pinned.
11. Undo slot: one row under the quiet row, the one place an outfit change on Today is undone (see Undo). Its content is centred under Another. It reserves the measured height from the first frame, loading included.
12. Not for me `Expander` from the slot, only while open, directly under the Undo slot. Either Not for me Expander, when it opens below the Footer edge, settles the scroll by the least distance that shows it whole (`settle`, `silk`), starting together with the inline expand.
13. `Section` `today.startWith`, action `common.showAll` (VoiceOver `looks.showAllLabel`) switching to the Looks tab when there are more saved looks than shown. Content: up to three look `Row`s, then a `ChipRow` of `Chip kind="choice"` multi: Hijab, Knit (`today.garment.hijab`, `today.garment.knit`, hint `outfit.chipHint`), then `Chip kind="control" opens="screen"` `today.startWithPiece` pushing `/today/pieces` (F07). Every other garment starts from a piece.
    - Look Rows are one single-choice list (`radiogroup`): `leading lay`, title = look name, meta `looks.missingOne` / `looks.missingMany` / `looks.variantOf` when it applies. A tap is Show on Today. The look shown now carries the trailing `selected` checkmark; pressing it again does nothing. VoiceOver role `radio`, label `today.lookLabel`, the meta as `accessibilityValue`, `accessibilityAction` `today.openLook`.
    - Variant Row: `below` action, the quiet small Button `looks.fillGap`, outside the press area, also an `accessibilityAction`.
    - While Banner 4 (Planned for today) shows, its look is left out of the Rows. While a planning session is active on a planned date, the planned look is the first Row.
14. `Section` `today.rediscover`, only once a wear exists (`rediscover` returns `[]` until `hasAnyWear`; the Section is never rendered empty). A horizontal strip of up to six `Tile`s at `strip` size, label only, leading edge on `gutter` and running to the screen edge; at `ax` a list of `Row`s with `thumb` leading. VoiceOver per tile: `tile.label`, value `closet.neverWorn` or `looks.lastWorn`, hint `rediscover.hint`. A tap is Start with this piece (`stylePiece`): the scroll settles to the top at once (`settle`, `silk`), then an occasion session arrives with Banner `today.banner.started` and `today.backToEveryday` (see Motion). The list is computed when Today gains focus and when the Section enters, as the greeting is; while visible it changes only when a wear lands (List remove), never on a chip tap, Another, a look Row or a strip pick. Not rendered while any session is active (occasion, started, planning, Tomorrow's outfit: Banners 1 and 2), because a tile starts a session for today and would replace the one she is in.
15. Apple Weather link, only while a forecast is shown, the last scroll item, leading-aligned: the Apple Weather mark (`forecast.mark`) in `ink` at `footnote` line height scaled by `symbolScale`, in a 44 pt target. `accessibilityRole="link"`, label `forecast.markLabel`, opens Apple's data sources page in the browser.
16. `Footer`: primary `outfit.wear`, nothing else. Planning and Tomorrow's outfit: primary `common.saveLook`, which crossfades to `today.openLook` once saved.

Reading order (VoiceOver): greeting, Profile, occasion chip, style chip, weather chip, Sample chip, Banner, outfit block, check card, quiet row, Undo slot (skipped while empty), the slot's Not for me Expander, Start with (title, Show all, look Rows, chips), Rediscover (title, tiles), Apple Weather link, Footer. The outfit block is one container wrapping hero, Change strip, title line, reason line and the card's Not for me Expander. It sets `experimental_accessibilityOrder` to `today-title`, the piece ids in dressing order (top, bottom, layer, shoes, hijab, accessories), `change-strip` (while open), `today-reason`, `today-like`, `today-not-for-me`, `today-save`, `today-reasons` (while open), so she hears the outfit and why before she rates it. The same order at every text size.

Change strip focus: on a piece tap or "Hijab does not match", the strip scrolls into view and `setAccessibilityFocus` goes to its header. The piece that opened it carries `accessibilityState.expanded`. When the strip closes, focus returns to that piece.

Expanders on S1: one open at a time, at most one check card rendered. When one Expander replaces another, both height changes run in one `LinearTransition` (`settle`, `silk`), so everything below moves once. Nothing above an Expander changes layout when it opens; the scroll may settle to show it. An open Expander or check card takes `onAccessibilityEscape` (two-finger scrub): it collapses and focus goes to the control that opened it (the Not for me trigger, the check card header, the piece).

Banner order (never two stacked; a problem merges into the session Banner and takes its action slot):

| Priority | Banner | Tone | Text | Actions |
|---|---|---|---|---|
| 1 | Planning a day, or Tomorrow's outfit (one active session) | session | `today.banner.planning`, `today.tomorrow` | `today.backToToday` |
| 2 | Occasion or started session | session | `today.banner.occasion`, `today.banner.started`, `today.banner.startedMore` | `today.backToEveryday` |
| 3 | Tomorrow's outfit waiting, everyday active, one visit | session | `today.tomorrow` | `today.showTomorrow` (label `today.showTomorrowLabel`) |
| 4 | Planned look for this date, everyday active | session | `today.planned` | `looks.showOnToday` |
| 5 | Dated plan left unsaved, everyday active | session | `today.unsavedPlan` | `today.openPlan`, `common.discard` |
| 6 | Outfit stale | notice | `today.noLongerFits` or `today.pieceUnavailable` | `today.findNew` |
| 7 | Styling failed | notice | `today.stylingFailed` | `common.tryAgain` |

When 4 and 5 are both due, 4 shows; 5 shows once 4 has left. Banners 3 and 5 show on one visit only: on the next focus of Today they are gone from the first frame (see States). `today.banner.planning` is for a date after tomorrow; whether Adjust's Day row Tomorrow opens the planning session or Tomorrow's outfit is F07's (see Hand-off notes). This flow renders whichever session is active.

Everyday default:

```
+--------------------------------------+
| Good morning, Sara              (o)  |  greeting, Profile icon
|                                      |
| [Work >] [Western >] [Oslo 4 to 9° >]|  control chips, one line
|                                      |
|   +------------------------------+   |
|   |      cut-outs on white       |   |  FlatLay hero, 236 pt
|   |   top     hijab (~)          |   |  (~) swap mark on the hijab
|   |   bottom  layer   shoes      |   |
|   +------------------------------+   |
|                                      |
| Ivory work tunic        (+) (-) (S)  |  title; Like, Not for me, Save look
| Picks up the brown in the loafers.   |  reason line, measured height
| Blazer covers the arms.              |  coverage sentence
|                                      |
|               Another                |  quiet row
|                                      |  Undo slot, empty, one line kept
|                                      |
| Start with                 Show all  |  Section
| [lay] Office navy                    |  look Rows, single choice
| [lay] Eid lunch                      |
| [Hijab] [Knit] [Start with a piece >]|  start chips
|                                      |
| Rediscover                           |  Section, once a wear exists
| [tile] [tile] [tile] [tile] [ti      |  strip runs to the edge
|                                      |
| Apple Weather                        |  data sources link
|--------------------------------------|
| [            Wear this             ] |  Footer
+--------------------------------------+
```

After Another (the Undo slot filled):

```
| Ivory work tunic        (+) (-) (S)  |
| Picks up the brown in the loafers.   |
|                                      |
|               Another                |
|          Undo   Not for me           |  Undo slot, centred, about the skipped outfit
```

Only when true, each in its fixed place: Sample chip (after weather), Banner (under the chips), Change strip (under the hero), coverage sentence (in the reason line), Not for me Expander (under the reason line from the card icon, under the Undo slot from the slot), check card (under the reason line), the Undo slot's content, the trailing checkmark on the look Row that is shown, Fill the gap under a variant Row, Rediscover (after Start with).

Primary action: Wear this (Footer). Planning and Tomorrow's outfit: Save look.

Inline modes on S1 (no route):

- Like: `Button icon`, a toggle. Tap: the outline crossfades to the filled `ink` symbol, `accessibilityState.selected`, `likeOutfit` records it, and `outfit.thanks` is announced once per outfit (queued). Nothing visible is added and the Undo slot is untouched: tapping Like again is its undo. Like while the reasons are open closes them (focus to Like). Recording a Not for me reason from the card icon clears Like.
- Not for me: two triggers, each opening the reason chips under itself and each about its own outfit; one open at a time. The card icon (label `outfit.notForMe`) is always there and acts on the outfit shown; its chips open under the reason line, inside the outfit block (under the icon line at `large`). After Another, the slot Button next to Undo (visible `outfit.notForMe`, `accessibilityLabel` `outfit.notForMeSkipped`, "Not for me, previous outfit", which starts with the visible text for Voice Control) acts on the outfit she skipped, the one Undo would restore; its chips open under the Undo slot. Where the chips sit shows which outfit they rate. The trigger that opened them carries `accessibilityState.expanded`; neither is ever drawn selected. Pressing the other trigger while they are open closes them and opens them under that trigger, both height changes in one `LinearTransition`, focus to the first chip. A second press on the trigger that opened them collapses them; focus stays on the pressed control. Body: `ChipRow` of `button` chips: `feedback.too-formal`, `feedback.too-plain`, `feedback.too-warm`, `feedback.too-cold`, `feedback.hijab-mismatch`, `feedback.not-my-style`. Focus moves to the first reason chip.
  - From the card icon: hint `outfit.chipHint`, on "Hijab does not match" `change.hintHijab`. A tap records the reason (`dislikeOutfit`), collapses the Expander and plays Generating; when the outfit lands the Undo slot shows `outfit.thanks` with `common.undo`, and focus goes to the card icon. Undo restores the outfit and withdraws the reason. "Hijab does not match" closes this Expander and opens the hijab Change strip with the reason kept (UC-F08-02); focus goes to the strip header, and the slot shows `outfit.thanks` with Undo when a hijab is picked (Undo restores the hijab and withdraws the reason). With no alternative outfit the outfit stays and the slot still shows `outfit.thanks` with Undo.
  - From the slot: no hint. A tap records the reason against the skipped outfit, "Hijab does not match" included (its hijab is no longer shown, so no strip), with no Generating; the outfit shown stays. The Expander collapses, the slot crossfades to `outfit.thanks` with Undo, and focus goes to Undo. Undo withdraws the reason and the slot empties.
- Save look: `Button icon`, label `common.saveLook`. Tap: saves at once with the suggested name (owner decision 2), the outline crossfades to the filled symbol, `success` haptic, the label becomes `today.openLook` with value `result.saved` (no selected state), and `result.saved` is announced. Pressed again it pushes `/look/[id]`. Presses are ignored until the crossfade ends (`quick` + `base`), so a double tap never saves and opens. The Undo slot is untouched. When the outfit shown already is a look (`lookForPieces`), the icon is filled from its first frame, after Undo and after Show on Today too, so a look is never saved twice. Any outfit change crossfades it to the new outfit's state when its first swap starts.
- Check card: `Expander tone="attention"` with the standard header: needs-an-answer dot (hidden from VoiceOver), title `today.check.title`, `chevron.down`. The header button reads label `today.check.title`, then `accessibilityValue` "Needs an answer" / "Trenger svar" (`capture.stateConfirm`, `design-system.md` Expander `attention`), with `accessibilityState.expanded`. Open: the question (`coverage.askSleeve`, `coverage.askLength`, `coverage.askSheer`, `coverage.askOpen`, `coverage.askBoth`) as a single-choice `ChipRow` (`value.*`), the piece as a `Row` (`thumb`, name, `chevron`, VoiceOver `today.openPiece`) pushing `/piece/[id]`, actions `check.save` (secondary) and `check.useAnother` (quiet, opens the Change strip on that piece). Tapping the header collapses it; nothing is saved and the card waits in place. It leaves when answered or when the piece leaves the outfit; then the coverage sentence, if any, crossfades into the reason line. After Save answer, focus goes to the next check card's header, or else to `today-reason`, which now carries the coverage sentence.
- Undo: one level, one place. Another, Show on Today (a look Row), Fill the gap and a Change strip pick (F08) show `common.undo` alone, centred under Another, no text and no checkmark: she just watched the outfit change. After Another `outfit.notForMe` (VoiceOver `outfit.notForMeSkipped`) sits next to Undo; both are about the skipped outfit. A Not for me reason shows `outfit.thanks` with `common.undo`, because that is news. A change that shows its own way back does not fill the slot: the Like and Save look icons and the Hijab and Knit chips (their state is the way back), and a Rediscover tile (its Banner's Back to everyday is the way back). The content crossfades in (`base`, `silk`) when the result lands and out (`quick`, `release`) on Undo or the next press elsewhere. The slot never changes height and is never an inline expand. Its height comes from a hidden layer holding both bars it can show (Undo with Not for me, `outfit.thanks` with Undo) at the current fontScale and language, measured before the first frame and again on a fontScale or language change. Each bar is side by side, centred as one pair under Another, or stacked when it is wider than the content width, each line centred; the measurement decides, never the `large` threshold. The slot reserves the taller result. When the slot fills below the Footer edge (a Banner, a long title or reason, larger text), the scroll settles by the least distance that shows it whole (`settle`, `silk`). While empty it sets `accessibilityElementsHidden`. Focus stays on the pressed control; the slot text is not announced. Another, Show on Today, Fill the gap and a reason announce `today.announce.outfit`; a strip pick announces `result.changed`, queued (F08). After Undo, focus returns to the control that made the change, or to Another when that control is gone. The only other Undo on Today is the Footer: after Wear this it becomes a `ResultBar` (`outfit.worn`, `common.undo`). One ResultBar per screen: the Worn bar empties the slot, and a slot result restores the Footer.
- Planning (F07 hand-off): Banner 1 `today.banner.planning`, no Wear this, no Save icon, Footer primary Save look (crossfades to `today.openLook` after saving). Back to today with an unsaved changed plan: the planning Banner asks in place. Its text crossfades to `today.savePlanTitle` and its action row to `common.saveLook` (secondary) and `common.discard` (quiet). From its first frame the planning Banner reserves the taller of its two texts and, at `large` and up, the stacked two-action row, so the question changes no height at any size. Focus moves to the question text. Acting elsewhere restores Back to today. No dialog floats over Today and nothing is added to the Footer.

### S1c Tomorrow's outfit

Purpose: the outfit for tomorrow, opened from the 21:00 notification (`notify.tomorrow`), which becomes the next morning's outfit.

Layout: S1 with Banner 1 `today.tomorrow` and `today.backToToday`; the weather chip shows tomorrow's forecast (VoiceOver `weather.chipLabelTomorrow`); no Wear this, Footer primary Save look; no Save icon on the title line; no Rediscover. Another, the Change strip, the start chips, Start with a piece, Like and Not for me act on tomorrow's outfit, and the Undo slot works as on S1. The greeting is the evening one.

```
+--------------------------------------+
| Good evening, Sara              (o)  |
| [Work >] [Western >] [Oslo 2 to 7° >]|  tomorrow's forecast
| +----------------------------------+ |
| | . Tomorrow's outfit              | |  session Banner
| | [Back to today]                  | |
| +----------------------------------+ |
|        +------------------+          |
|        |  cut-outs  (~)   |          |  hero 236 pt
|        +------------------+          |
| Ivory work tunic            (+) (-)  |  Like, Not for me
| Picks up the grey in the coat.       |
|               Another                |
|                                      |  Undo slot
|--------------------------------------|
| [            Save look             ] |  Footer
+--------------------------------------+
```

- Back to today: the Banner's text and action crossfade in place to the one-line Banner 3 (`today.tomorrow` with `today.showTomorrow`), today's outfit swaps in, the Footer crossfades to Wear this, the Save icon fades in, the weather chip crossfades to today's forecast, and Rediscover (once a wear exists) enters with Inline expand in the same `LinearTransition` as the Banner change. The session is kept (`backToToday`); nothing is asked, because it is not lost.
- Show: the reverse, back to tomorrow's outfit with every change she made; Rediscover leaves with Inline collapse in the same transition.
- The Banner action stays one element through both, so focus stays on it; its label switches at once, and `today.announce.outfit` is queued when the other day's outfit lands.
- Banner 3 stays for this visit only: on the next focus of Today it is gone, the session kept. The next morning `ensureToday` promotes the session: Today opens on that outfit as the everyday outfit, no Banner, no Generating. A look planned for that day still shows Banner 4 first. Opened first two days later, the session is dropped and the day builds fresh.

Primary action: Save look. No wear can be recorded on tomorrow's outfit.

### S1a First run (onboarding skipped)

Purpose: get to a first outfit when no everyday style exists.

Layout: `Screen large` with the greeting title and the Profile icon / `EmptyState mark` (scarf A on the plum tile, still), no title (the large title already greets), primary Button `today.firstRun.style` (hint `today.firstRun.styleHint`) pushing `/profile/style` (F11), then quiet Button `sample.try`. No context row, no Section, no Footer. When S1 replaces it, focus goes to the hero placeholder while loading, then to `today-title` when the outfit resolves.

```
+--------------------------------------+
| Good morning                    (o)  |  no name: onboarding skipped
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

Layout: `Screen large` (greeting) / context ChipRow / session Banner if any / `FlatLay hero` of the kept pieces with a dashed empty slot per missing role / problems / Section Start with / Section Rediscover (once a wear exists) / Apple Weather link while a forecast is shown / `Footer` in Waiting (no Wear this). No title line, no icons, no quiet row, no Undo slot: there is no outfit to act on.

Problems use the Banner notice anatomy, in one notice container under the hero (never two Banners stacked): per problem the `body` `ink` line (`styling.*`, `coverage.*`, `stylist.*`), then its fix under it in a leading-aligned row at `control.small`, problems `space.lg` apart. The first problem's fix is `secondary`, the rest `quiet`. Same layout at every text size and in both languages.

Fixes, one per problem: `today.stopKeeping`, `today.anyType`, `today.switchTo`, `today.clearWeather`, `today.includeSetAside`, `today.startWithPiece` (push `/today/pieces`), `closet.addPieces` (push `/capture`, F02, back returns here), `sample.try`, `today.answerQuestion` (opens the blocking check card), `today.openPiece` (push `/piece/[id]`).

```
+--------------------------------------+
| Good morning, Sara              (o)  |
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

Primary action: the first problem's fix. Each action resolves on Today or pushes and returns here. Never shown the morning after adding pieces (hand-off rule 8).

## States

| State | Where | What shows |
|---|---|---|
| Empty, first run | S1a | Mark, Set your style, Try the sample closet. No context row before a session exists (UC-F06-01) |
| Empty, no saved looks | S1 Section | Start with shows only the chips; no look Rows, no Show all |
| Empty, no wear yet | S1 | No Rediscover Section and nothing reserves its space. It arrives once a wear exists (Wear this, Mark as worn on a look, or Closet select Mark as worn, UC-F04-12) |
| Empty, nothing to rediscover | S1 | Every owned piece worn within 30 days, or in today's outfit: no Rediscover Section, never an empty one |
| Empty, no coverage sentence | Reason line | Coverage No preference, no need, or the main piece meets every need by itself (an abaya): the reason alone, its measured height held |
| Empty, no planned look | S1 | Banner 4 is not rendered; nothing reserves its space |
| Empty, closet cannot make an outfit | S1b | Problems with Add pieces or Try the sample closet |
| Loading, cold launch | S1 | Header with the greeting and the context chips at once. `Silk placeholder` in the `lay` shape for the hero is the only loading cue; text placeholders for the title and the reason slot (its measured height) are sized from line height x fontScale (title capped at 2.0x); the icons are not drawn until the outfit resolves, their space held; the quiet row and Undo slot heights are reserved, so nothing jumps at AX3. The Footer is in Waiting until the outfit resolves, then plays Footer entering. Resolves with the Loading fade, never Generating. VoiceOver `common.loading` once on the flat lay region |
| Loading, forecast | Weather chip | `Silk placeholder` `chip`, then the chip text and the Apple Weather link at the end of the scroll, or `weather.unavailable` |
| Generating | Hero | Another, Adjust return, a start chip, Show on Today, Fill the gap, a Not for me reason, Open plan, Save and update today, a Rediscover tile, a warm 21:00 tap, Back to today and Show on S1c, a new day while Today is mounted. Current outfit stays; changed slots swap in dressing order. One visible cue at a time: the sheen on the hero; the tapped control keeps its look and sets `accessibilityState.busy`, and shows the still busy band only after the hero's band has faded at `loop`. `moment-generating` testID while running, announced `today.announce.outfit`, `today.styling` as the busy label |
| Error, styling | S1 | Banner 7 `today.stylingFailed` with Try again. The last outfit stays when there is one; otherwise the hero is the dashed empty lay and the Footer waits. Never a stuck "Styling" line |
| Error, save | Footer, title line, check card | `common.error.save` as `footnote` `error` directly under the control that failed: inside the Footer above Wear this (or Save look while planning), under the title line for the Save look icon (Like and Not for me record locally and are undone on failure with the same line), under the check card actions for Save answer. The control returns to its state. Announced |
| Error, outfit stale | S1 | Banner 6 `today.noLongerFits` or `today.pieceUnavailable` with Find a new outfit; the old outfit stays under it |
| Offline | Weather chip | `weather.unavailable`, no Apple Weather link, tap pushes Adjust weather. The outfit is still styled from local data. Pull to refresh or foreground refetches |
| Permission denied | None | Today asks for no permission. Location and notifications are asked in onboarding and Profile (F01, F11). With no place the chip reads `weather.unset` and opens Adjust weather |
| First run | S1a | As Empty, first run. Only reachable when onboarding was skipped |
| Greeting | Title | By local hour: morning before 12, afternoon before 18, evening after. No name: the plain form, then `nav.today`. With a name, too wide for one line: drops the time of day (`today.greeting.short`, "Hi, Fatima" / "Hei, Fatima"), then `nav.today`, so her name never depends on the hour. Measured as the native title draws it, Bold Text included. Never changes while Today is visible |
| From a morning notification | S1 | Cold: splash, then Today on today's outfit, never Generating. Warm: switches to the Today tab and pops Today's stack to its root, except a guarded editor holding a draft, which stays with its draft. Before onboarding is finished the gate still lands on onboarding (UC-F06-22) |
| Tomorrow's outfit | S1c | Banner 1 `today.tomorrow`, tomorrow's forecast, Save look in the Footer, no Wear this, no Save icon, no Rediscover (UC-F06-23) |
| Tomorrow waiting | S1 Banner 3 | After Back to today on S1c, for that visit only. Show returns to S1c. Gone on the next focus of Today, the session kept; the next morning tomorrow is the everyday outfit |
| Session: occasion, started, planning | Banner 1 or 2 | There in the first frame on return from Adjust or a tab switch; always true and gone on the next day |
| Planned for today | Banner 4 | First block above the outfit. Show on Today, then Wear this. Its look is not repeated in Start with. Leaves the next day |
| Unsaved plan | Banner 5 | Shown on the first visit to Today after the plan was left, once. Open plan restores the planning session; Discard drops it. Ignored, it does not come back, and the plan is dropped when its day passes |
| Liked | Title line | Like filled (`ink`), `accessibilityState.selected`. Clears on a new outfit, returns with Undo to a liked outfit |
| Worn | Footer | `ResultBar` `outfit.worn` with Undo. A second outfit worn the same day is its own wear. The worn pieces leave Rediscover |
| Saved | Title line | Save look icon filled, label `today.openLook`, value `result.saved`; a press opens the look |
| Last and only outfit | Quiet row | Last: Another reads `today.lastCombination`. Only one: the row holds `today.onlyCombination`, no button |
| Reduce Motion | Everywhere | Swaps crossfade in place, all changed slots at once (no stagger), expands lay out in one frame, placeholders still, no band on the flat lay, icons crossfade (opacity only) (`motion.md`) |
| Accessibility sizes (AX1 to AX5) | S1 | Greeting falls back to fit one line, at AX5 usually to `nav.today` (`I dag`); context chips wrap, a wrapped chip switches to `radius.md`; title capped at 2.0x; Like, Not for me and Save look on their own line under the reason line; the reason line wraps, never clipped; the quiet row label wraps centred; the Undo slot reserves its measured height; Footer Wear this alone, its Worn ResultBar puts the action under the text; Banner, check card and Undo slot actions stack under their text; Fill the gap stays under the variant Row; the Change strip and Rediscover become Rows; the Apple Weather mark grows by `symbolScale`, the swap mark by min(`symbolScale`, 1.35); at AX5 Lane 1 checks by eye that the hijab still reads as a hijab beside the 35 pt disc, not only that it keeps its 44 x 44 pt target. At AX5 the large title holds at 1.76x (60 pt); the icon line stays inside 343 pt (`symbolScale` capped at 2, 3 x 76 + 2 x 8 = 244 pt); on a 375 x 667 phone the pinned Footer with the stacked Worn ResultBar still leaves the outfit block scrollable. Nothing truncates |
| Bokmål | S1 | Tab `I dag`. Greeting `God morgen, Sara` / `God ettermiddag, Sara` (331 pt of Georgia 34 at -0.4, about 339 pt at the native title's tracking 0, inside 343 pt on a 375 pt phone; in Georgia-Bold under Bold Text it is wider and becomes `Hei, Sara`) / `God kveld, Sara`; `God ettermiddag, Fatima` (369 pt) becomes `Hei, Fatima`. Footer `Bruk i dag`. Quiet row `Et annet`, last combination `Tilbake til det første antrekket` (about 250 pt, one line in a 343 pt row). Undo slot after Another: `Angre`, `Passer ikke` side by side (about 210 pt), after a reason `Notert til neste gang` with `Angre` (about 270 pt), one line at default size on 375, 390 and 402 pt phones, as English; at larger sizes the hidden layer decides. Sections `Start med`, `Gjenoppdag`; chips `Hijab`, `Strikk`. Banner `Morgendagens antrekk` with `Tilbake til i dag` or `Vis`. Coverage sentence in definite form (`Blazeren dekker armene.`). Temperatures show U+2212 and are spoken "minus 6 til minus 2 grader" |

## Motion

All values are `motion.md` tokens.

| Moment | Motion |
|---|---|
| Cold launch | Splash drape, hand-off at drape end, overlay fades (`settle`, `silk`). Today is already mounted under it, greeting and Banner in place. If the closet is not loaded, the placeholder flat lay resolves with the Loading fade (`base`, `silk`), then the Footer plays Footer entering (`base`, `silk`). Never Generating on launch, from a notification included |
| Warm launch | Nothing plays. The greeting is recomputed before the first visible frame |
| New outfit (Generating) | Tap: nothing moves, `moment-generating`, the tapped control sets `accessibilityState.busy` and keeps its look. After `wait`, `sheen` over the pieces clipped to their alpha. After `loop` the band fades out (`quick`) and the tapped control shows the still busy band until resolve (Today stays usable). Result: changed slots play Flat lay piece swap (outgoing `quick` `release`, incoming after `step`, `arrange` `fall`) in dressing order `step` apart; unchanged pieces hold, the hijab's swap mark travels with the hijab. When the first swap starts the icons crossfade to the new outfit's state (`quick`, `silk`). After the last swap the title and reason line update with the label crossfade, in their reserved height. A second Another mid-swap starts from where the pieces are |
| Piece tap | `lift` while the finger is down, back with `settle` `fall`. The Change strip opens with Inline expand under the hero |
| Change strip pick | Flat lay piece swap on that slot only (F08), then the Undo slot crossfades in |
| Like | Icon toggle: outline to filled (`quick`, `silk`), off is the reverse (`quick`, `release`). Nothing else moves |
| Save look icon | Outline to filled as Like, `success` haptic, label switches at once. Pressed filled: native push to the look |
| Not for me, check card | Inline expand (`settle`, `silk`, content after `step`, `base`) and Inline collapse, each at its own place: the card icon's reasons under the reason line, the slot's under the Undo slot, the check card under the reason line. Chevron rotates 180 degrees (`settle`). When one Expander replaces another (the other Not for me trigger included), both height changes run in one `LinearTransition` (`settle`, `silk`). Opening below the Footer edge: the scroll settles by the least distance that shows it whole (`settle`, `silk`), starting with the expand |
| Not for me reason | From the card icon: Inline collapse of the Expander, Generating, then the Undo slot crossfades in `outfit.thanks` with Undo. From the slot: Inline collapse, then the slot crossfades to `outfit.thanks` with Undo, no Generating |
| Undo slot | Text and actions crossfade in (`base`, `silk`) and out (`quick`, `release`). No height change. Filling below the Footer edge: scroll settles by the least distance (`settle`, `silk`) |
| Quiet row label | Another to `today.lastCombination` and back: Banners and bars label crossfade, height held (measured for both) |
| Coverage sentence | Part of the reason line: crossfades with it. When a check is answered it crossfades in within the reserved height; more than that grows the line once (`settle`, `silk`) |
| Save look to Open look (Footer, planning and S1c) | Banners and bars label crossfade; `success` haptic |
| Save this plan question | Banner text and action row label crossfade; no height change (reserved, see Planning) |
| Wear this to Worn today | ResultBar crossfade in the Footer (`quick` `release` out, `base` `silk` in); `success` haptic. Undo crossfades back |
| S1a to S1 (Try the sample closet, Set your style returning) | EmptyState fades out (`quick`, `release`), S1 content fades in (`base`, `silk`) with the hero placeholder or the outfit, then Footer entering (`base`, `silk`). No height jump above the Footer. Focus: the hero placeholder while loading, then `today-title` when the outfit resolves |
| Banner arrives from an action on Today (Rediscover tile, warm 21:00 tap) | One movement at a time. A Rediscover tile first settles the scroll to the top on the tap (`settle`, `silk`), so the sheen runs on a hero she can see. Then the stylist result: the sheen runs over the current outfit as in Generating. At the result, the Banner opens with Inline expand and Rediscover leaves with Inline collapse, in one `LinearTransition` (`settle`, `silk`), siblings gliding; the hero stays 236 pt and never resizes. Once it settles the changed slots swap, so pieces fall only on a still canvas. The weather chip (21:00) and the title crossfade with the last swap. From the result to the last piece landing it takes at most 1100 ms (`settle` 320, then up to six swaps `step` apart, 300 + 60 + `arrange` 420), the ceiling `motion.md` Generating states. The Undo slot, now under the Footer edge, settles the scroll as for any Banner. Focus (Rediscover tile): once the Banner has opened, focus goes to the Banner text (`today.banner.started`); the List remove next-tile rule does not apply |
| Banner leaves (Back to everyday, Show on Today, Discard, Find a new outfit, Try again) | Inline collapse (`settle`, `silk`), the hero unchanged, with Rediscover entering by Inline expand when a session ends; once it settles the changed slots swap (Generating). The title crossfades with the last swap. Focus: the pressed action has gone, so after the last swap focus goes to `today-title` |
| Banner changes in place (Back to today and Show on S1c, Save this plan) | Text and actions label crossfade, no height change; the hero holds; pieces swap; the Footer and the Save icon crossfade with the last swap |
| Banner on return from Adjust, a tab switch, a cold launch | In place in the first frame, no expand (Pop to a tab after a flow) |
| Tab switch from Show on Today in Looks | Instant; then Generating on Today |
| Choice chip toggle | Selection crossfade (`quick`, `silk`), then Generating |
| Rediscover | The list is fixed while Today is visible. The Section arrives with Inline expand when the first wear lands while Today is visible, else it is in place on the next visit. A tile whose piece is worn leaves with List remove; the last one takes the Section with Inline collapse. A session starting or ending (S1c Back to today and Show, a tile, Back to everyday) collapses or expands the Section in the same `LinearTransition` as the Banner change |
| Placeholders and busy | `Silk` per Loading; busy Buttons keep their label |
| Reduce Motion | Swaps crossfade (`base`), all changed slots at once with no stagger. Expands lay out in one frame with a content fade; collapses fade (`base`) then lay out in one frame. Expander chevron swaps at once, no rotation. No band on the flat lay; the tapped control shows the still band after `wait`. Icons crossfade, opacity only. Banner arrives and leaves: fade and one-frame layout first, then the swap crossfade. S1a to S1: the same crossfades, opacity only. No `lift` travel (shadow steps at once). Scroll settles not animated |

Magic moments on this flow: Loading (launch, forecast chip) and Generating (every new outfit, tomorrow's outfit on a warm tap).

## Copy

All keys from `copy.md` F06 and Revision 1 > F06 Today unless noted.

| Place | Keys |
|---|---|
| Header | `today.greeting.morning`, `today.greeting.afternoon`, `today.greeting.evening`, `today.greeting.morningPlain`, `today.greeting.afternoonPlain`, `today.greeting.eveningPlain`, `today.greeting.short`, `nav.today` (fallback and tab), `nav.profile` |
| First run | `today.firstRun.style`, `today.firstRun.styleHint`, `sample.try` |
| Context row | `occasion.*`, `style.*`, `closet.sample`, `occasion.chipLabel`, `style.chipLabel`, `closet.sampleChipLabel`, `weather.chip`, `weather.chipRain`, `weather.chipSnow`, `weather.unavailable`, `weather.unset`, `weather.chipLabel`, `weather.chipLabelTomorrow`, `weather.spoken`, `weather.setByYou` (VoiceOver) |
| Apple Weather link | `forecast.mark`, `forecast.markLabel` |
| Banners | `today.banner.occasion`, `today.banner.started`, `today.banner.startedMore`, `today.banner.planning`, `today.tomorrow`, `today.backToEveryday`, `today.backToToday`, `today.showTomorrow`, `today.showTomorrowLabel`, `today.savePlanTitle`, `common.saveLook`, `today.planned`, `today.unsavedPlan`, `today.openPlan`, `common.discard`, `looks.showOnToday`, `today.noLongerFits`, `today.pieceUnavailable`, `today.findNew`, `today.stylingFailed`, `common.tryAgain` |
| Outfit | `outfitName.*`, `reason.*`, `outfitTip`, `coverageNote.arms`, `coverageNote.ankleOne`, `coverageNote.ankleMany`, `coverageNote.calfOne`, `coverageNote.calfMany`, `kind.subject.*`, `today.styling`, `today.announce.outfit`, `change.pieceLabel`, `change.hint`, `change.hintHijab`, `change.title` (covered piece chip) |
| Title line icons | `outfit.like`, `outfit.notForMe`, `common.saveLook`, `today.openLook`, `result.saved`, `outfit.thanks` (announced after Like) |
| Quiet row | `today.another`, `today.lastCombination`, `today.onlyCombination` |
| Undo slot | `common.undo`, `outfit.notForMe`, `outfit.notForMeSkipped` (VoiceOver label of the slot's Not for me), `outfit.thanks`; `result.changed` is announced after a strip pick, never shown |
| Not for me | `feedback.too-formal`, `feedback.too-plain`, `feedback.too-warm`, `feedback.too-cold`, `feedback.hijab-mismatch`, `feedback.not-my-style`, `outfit.chipHint`, `change.hintHijab` |
| Check card | `today.check.title`, `capture.stateConfirm` (header value), `coverage.askSleeve`, `coverage.askLength`, `coverage.askSheer`, `coverage.askOpen`, `coverage.askBoth`, `value.*`, `check.save`, `check.useAnother`, `today.openPiece` |
| Problems | `styling.*`, `coverage.*`, `stylist.keptAway`, `stylist.keptArchived`, `today.stopKeeping`, `today.anyType`, `today.switchTo`, `today.clearWeather`, `today.includeSetAside`, `today.startWithPiece`, `closet.addPieces`, `sample.try`, `today.answerQuestion`, `today.openPiece` |
| Start with | `today.startWith`, `today.garment.hijab`, `today.garment.knit`, `outfit.chipHint`, `today.startWithPiece`, `today.lookLabel`, `looks.variantOf`, `looks.fillGap`, `looks.missingOne`, `looks.missingMany`, `today.openLook` (Row action), `common.showAll`, `looks.showAllLabel` |
| Rediscover | `today.rediscover`, `tile.label`, `closet.neverWorn`, `looks.lastWorn`, `rediscover.hint` |
| Footer | `outfit.wear`, `outfit.worn`, `common.saveLook`, `today.openLook`, `common.undo`, `common.error.save` |
| Loading | `common.loading` |

Added to `copy.md` by this pass: `weather.chipLabelTomorrow` (the weather chip is read before the Banner, so it says tomorrow itself), `today.greeting.short` ("Hi, {name}" / "Hei, {name}", the named greeting's one fallback before `nav.today`) and `outfit.notForMeSkipped` ("Not for me, previous outfit" / "Passer ikke, forrige antrekk", VoiceOver label of the slot's Not for me). Added to `copy.md` F06: the length rule for the reason line. Changed in `copy.md`: `today.lastCombination` is the quiet row Button's label on the last combination; `outfit.thanks` after Like is VoiceOver only, announced once per outfit, never shown in the Undo slot. Not used on Today: `looks.fromYourLooks`, `looks.showing`, `today.changeHijab`, `common.showAllCount`.

## Use cases

| ID | Screen | State |
|---|---|---|
| UC-F06-01 | S1a, then S1 | First run, empty, loading (sample Button busy), S1a to S1 crossfade, greeting without a name |
| UC-F06-02 | S1 | Greeting by hour and fallbacks; icons on the title line; swap mark on the hijab; coverage sentence; Another alone; Generating (new day while mounted), loading (cold launch, Footer in Waiting), large text, bokmål |
| UC-F06-03 | S1 quiet row, Undo slot | Generating; Not for me next to Undo after Another; last combination label, only combination line; reduce motion |
| UC-F06-04 | S1 Footer | Worn ResultBar, Undo; second wear after Adjust; the worn pieces leave Rediscover |
| UC-F06-05 | S1 Not for me Expander, Undo slot | Opened from the card icon (outfit shown, under the reason line) and from the slot (skipped outfit, under the Undo slot, VoiceOver "Not for me, previous outfit"), expanded on the trigger that opened it, the other trigger moves it; reason collapses the Expander, thanks with Undo; from the card hijab-mismatch hands off to the hijab strip; escape closes it |
| UC-F06-06 | S1 title line | Save icon fills, Open look, Saved; pressed again opens the look; filled again after Undo and Show on Today; error under the title line |
| UC-F06-07 | S1 check card | Open, collapsed, answered (next check arrives), gone with the piece; coverage sentence absent while it is unanswered |
| UC-F06-08 | S1 Section Start with | Look Row tap shows it (selected checkmark), variant Row with Fill the gap, Open look action, Show all, Banner 4 look left out |
| UC-F06-09 | S1 Sections Start with, Rediscover | Hijab and Knit toggle (no Undo slot), Start with a piece push, Rediscover under Start with |
| UC-F06-10 | S1 context row, Apple Weather link | Loading chip, forecast with the link at the end of the scroll, set by you, offline unavailable, minus temperatures |
| UC-F06-11 | S1 Banner 6, S1b | Stale outfit, problems, every fix; Add pieces returns here |
| UC-F06-12 | S1 Banners 1 and 2 | Back to everyday, Back to today, Save this plan asked in the planning Banner |
| UC-F06-13 | S1 Banner 7 | Styling error with Try again |
| UC-F06-14 | S1 Undo slot | One level, one slot, reserved from the first frame, no layout shift; toggles and session Banners do not fill it |
| UC-F06-15 | S1 Footer | Save error inside the Footer above Wear this |
| UC-F06-16 | S1 header | Profile push and back |
| UC-F06-17 | S1 Banner 4 | Planned for today, Show on Today, Wear this; variant when a piece is missing |
| UC-F06-18 | S1 Banners 5, S1c | New day: occasion gone, unsaved plan offered once, Open plan restores it; tomorrow's outfit promoted the next morning with no Banner, dropped two days later |
| UC-F06-19 | S1 reason line | Coverage sentence names the layer or bottom; none for an abaya, No preference or an open check; bokmål definite form; large text |
| UC-F06-20 | S1 title line | Like toggles, nothing else moves, thanks announced once; a Not for me reason from the card clears Like; error |
| UC-F06-21 | S1 Section Rediscover | Hidden with no wear; arrives after the first wear; order; tile starts a session with its Banner, scroll to top; worn tile leaves; gone when empty; `ax` Rows; bokmål |
| UC-F06-22 | S1 | From a morning notification, cold and warm; onboarding unfinished |
| UC-F06-23 | S1c, S1 Banner 3 | 21:00 tap, warm Generating with Banner arrival, tomorrow's forecast, no Wear this, no Save icon, Back to today and Show, next morning promoted |

Touches from other flows that land here: UC-F01-19 (21:00 and morning notification taps), UC-F02-21 (no problem card the morning after adding pieces), UC-F04-12 (Mark as worn makes Rediscover appear), UC-F05-12 (Start with this piece lands here with its Banner), UC-F07-08 (planning Banner), UC-F08-01 to UC-F08-06 (Change strip inline on S1, Undo in the Today slot, swap mark), UC-F09-04 and UC-F09-11 (Show on Today, planned look as Banner 4), UC-F09-12 (Wear this feeds the calendar), UC-F11-09 and UC-F11-10 (I'll never wear leaves pieces out of the outfit and Rediscover; Trying to wear more of puts its pieces first in Rediscover), UC-F12-02, UC-F12-03, UC-F12-06, UC-F12-07.

Lane 1 device check: the `design-system.md` Semantics on device check covers, in English and on an nb-NO device, radio/selected (look Rows), checkbox/checked (Hijab, Knit), selected (Like), expanded (Not for me on the trigger that opened it, check card, hero piece), busy (Another), and that Save look reads "Open look, Saved" / "Åpne look, Lagret" once. Like reads "Selected" and then "Noted for next time" / "Notert til neste gang" once each, with no repeated label. After Another, one swipe right from Another reaches Undo, then "Not for me, previous outfit" / "Passer ikke, forrige antrekk", never a closed Expander's old place. The check card header reads "Check {name}, Needs an answer". The nb-NO pass also checks that the weather chip reads "minus", never "bindestrek", and that "God ettermiddag, {name}" on a 375 pt phone with a 6 to 8 letter name keeps the name or falls back to "Hei, {name}", with Bold Text off and on, never truncated. Both languages run at AX3 and AX5.

## Hand-off notes

- `design-system.md`, changed in this pass so both files say one thing: Rules > Selected (line 52, icon buttons: filled means on or saved), 4 Button > Icon variant (Save look opens the look once saved, never removes it, no "Saved" with Open), Today action area (Save look bullet; Undo: Undo alone after an outfit change, Not for me about the skipped outfit, no Rediscover tile or start chip in the slot, layout from the measurement), Greeting (the short fallback), FlatLay > Hijab swap mark (capped at 1.35), Anatomy budget, Reason line (minimum, never a cap), Accessibility (one order at every size, reason line before Like), ResultBar (`text?` for the Undo slot), the "Saved look" review entry and the Revision 1 note that cut `today.openLook`. `copy.md`: `today.greeting.short` added, the greeting note updated.
- Changed in review round 2 so every file says one thing. `architecture.md`: Inline modes row 86, the Revision 2 bullet (C6-04) and the `likeOutfit` / `dislikeOutfit` domain row now say the thumbs down rates the outfit shown and the slot's Not for me the skipped outfit, each opening the chips under itself; the 21:00 row's Banner 3 is one visit. `copy.md`: `outfit.notForMeSkipped` added, Revision 1 > F06 no longer says both triggers carry `expanded` or that the slot Button is the card's action, the reason line length rule added, the greeting notes match the named and plain chains. `design-system.md`: Type > Dynamic Type large title (Georgia-Bold under Bold Text, tracking 0), Button > Icon variant and FlatLay > Title line (`space.sm`, 148 pt, the longest-word rule), FlatLay > Reason line (coverage measured only when it can show, the length rule), Today action area (Not for me places, centred slot, greeting chain). `motion.md`: the 1100 ms ceiling under Generating and the Icon toggle Like rule. The length rule's unit test may fail some current `reason.*` pairs in bokmål; those reasons are shortened in `copy.md`, never capped.
- `motion.md` Splash > Notification tap and Generating: done. A warm 21:00 tap with no Banner showing arrives as "Banner arrives from an action on Today" above; the label crossfade is only for a Banner already on screen. The hero stays 236 pt with a Banner (the device-check fallback made the rule), so a Banner arrival never resizes it. `motion.md` Banners and bars names `common.saveLook`.
- `use-cases.md`: UC-F06-03 step 4 "a line says so" becomes "Another reads Back to the first outfit"; UC-F06-14 step 1 "Undo in the action row" becomes "Undo in the Undo slot"; UC-F06-15 "Error line under the action row" becomes "inside the Footer above Wear this"; UC-F06-20 steps 1 and 2: no visible thanks line and no Undo, tapping Like again is the undo; UC-F06-10 step 1 and 4: the Apple Weather mark is the link at the end of the scroll, not beside the chip; UC-F06-05 "one action with one label" becomes "the thumbs down rates the outfit shown, Not for me next to Undo the skipped outfit (VoiceOver 'Not for me, previous outfit'), each opening the chips under itself"; UC-F06-23 Banner 3 lasts one visit.
- F12 S1 Tab root row: the greeting chain is greeting, then `today.greeting.short`, then `nav.today` with a name, and plain greeting, then `nav.today` without; measured with Bold Text.
- `architecture.md`: Rediscover is not rendered while any session is active (occasion, started, planning, Tomorrow's outfit), and its list is fixed while Today is visible except for a wear; add to the Rediscover row of Inline modes. Still open there: whether Adjust's Day row Tomorrow opens Tomorrow's outfit (`copy.md` `adjust.tomorrow`, F07).
- F08: the swap mark (capped at min(`symbolScale`, 1.35)) and `change.hintHijab` are drawn and read as above. A strip pick fills the slot with Undo alone; after "Hijab does not match" it shows `outfit.thanks` with Undo, and Undo restores the hijab and withdraws the reason.
- F09: the calendar reads the wears Today records; nothing on Today links to it.

## Review log

- **First pass items kept.** Save this plan asked inside the planning Banner; Apple Weather mark at the end of the scroll; Footer holds Wear this alone; reason line always shown; one Undo slot; Banner leaves before pieces swap; one cue while generating; no checkmark on Hijab and Knit; Change strip above the title; contrast checked against `design-system.md`.
- **Quiet row is Another alone (owner round 1, item 6; round 2, item 7).** This replaces the first pass's three-button row and its thirds measurement. Not for me is the card's thumbs down and, after Another, the word next to Undo, each opening the reason chips under itself (C6-04, see review round 2).
- **Save look is a door once saved, not a toggle.** Four sources (architecture row 86, UC-F06-06, `copy.md`, `motion.md`) agree; `design-system.md` alone made it a toggle that removes the look. A remove on the outfit card sits one tap from Like and needs a system alert on the daily screen; Remove look already lives on look detail.
- **Like says thanks to VoiceOver only.** A visible "Noted for next time" after every Like is a word added to the screen for something the filled icon already shows. Like's undo is Like.
- **Toggles and sessions do not fill the Undo slot.** Their state or Banner is already the way back; a second one adds words under the outfit. The rule replaces a list of exceptions.
- **Last combination on the Button, not a line.** "Back to the first outfit" said what the next Another does, so it is that Button's label. A line in the Undo slot would not fit one line beside Undo and Not for me (about 410 pt in English), and in the reason line it would push out the stylist's why.
- **Banner arrival is layout first, then pieces.** The same order as Banner leave, so pieces never fall onto a canvas that is still resizing. This names tomorrow for one `settle` before its pieces land, which is the price of one motion at a time.
- **Rediscover off in any session.** A tile starts a session for today; offering it while planning, on tomorrow or during an occasion would replace the session she is in, and nothing would undo it. One rule instead of two exceptions.
- **Greeting is the title, the tab stays Today.** The greeting changes only on focus or foreground, so the title never changes under her eyes, and it falls back rather than truncating.
- **Wear calendar not added here.** It belongs to Looks (`architecture.md` Tabs, Round 2 feature homes 11); Today only records the wear.
- **Review round on this pass, fixed.** Reason line and Undo slot heights are measured minimums, never line caps or the `large` threshold; the Not for me Expander settles the scroll like the slot; focus targets after a Banner leaves, a Rediscover tile, Save answer and S1a to S1; the slot's Not for me acts on the skipped outfit; the greeting drops the time of day before the name; Rediscover is fixed while visible and hidden in any session; `design-system.md` and `copy.md` now match this file. Minor: swap mark cap, the `arrangePieces` test at both hero sizes, the hijab-mismatch hint, escape on open Expanders, Like cleared only when a reason is recorded, the last-combination announcement, look Row meta as value, AX1 to AX5, the S1c action focus, Undo alone without "Changed", how the reasons close, one movement at a time after a Rediscover tile.
- **Two Not for me triggers, two outfits, two places.** Owner round 1 item 6 put Not for me next to Undo after Another; read as "why did you skip that one", it rates the skipped outfit, and the card's thumbs down rates the outfit shown. Each opens the chips under itself, so where they sit says which outfit they rate, the card's no longer opens three blocks away under the Footer edge, and the silent retarget is gone. All five sources now agree. One question for the owner's next round, not a blocker: confirm this reading of item 6.
- **Taken in the mockup and `design-system.md` (Button > Icon variant), for the owner to confirm: quiet rating icons.** Three plum outline glyphs after the title read as the stock chat rating row, and with the swap mark, Another and the slot up to seven plum marks sit in one outfit block. Recommendation: unselected icons as `inkMuted` outlines, filled `ink` when on (shape and colour still differ), plum kept for Another, the slot and the swap mark. If accepted, `design-system.md` Button > Icon variant and Rules > Plum change with it.
- **Review round 2, fixed.** The slot's Not for me has its own VoiceOver label; the card's reasons open under the reason line; the reason reserve is the two-line slot, held by a `copy.md` length rule and measured with coverage only when it can show; the greeting is measured with the native title's own style, Bold Text and tracking 0 included, and the AX cap reads 1.76x (60 pt); Banner 3 lasts one visit; icons `space.sm` apart and on their own line when a title word does not fit; the slot centred under Another; the check card header names its state; the greeting chain has no dead step; a 1100 ms ceiling after the result with a device check and a fallback; Lane 1 checks for Like, the swipe after Another, Bold Text and the swap mark at AX5.
- **Review round 2, label wording.** The review offered "Not for me, last outfit" and "previous outfit". "Previous" is used: "last" already means the last combination on this screen (`today.lastCombination`), and it matches the bokmål "forrige".
- **Review round 2, check card state as a value.** The review asked for the needs-an-answer words after the label; `design-system.md` Expander `attention` puts them in `accessibilityValue`, which VoiceOver reads right after the label, so the recipe stays one rule.
- **Review round 2, tracking 0 for the greeting.** The review asked to measure at -0.4. The native large title takes only font family, size, weight and colour (react-native-screens has no letter spacing for it), so it draws at 0; measuring at -0.4 would let a greeting through that then truncates.
- **Declined: Rediscover as the one door to Start with a piece.** Rediscover is hidden until the first wear and in every session (occasion, started, planning, Tomorrow's outfit), so the chip would vanish exactly when a new user, or a planner, needs it, and UC-F06-09 and S1c rely on it. The two stay: the chip from any piece, the strip from pieces she has not worn lately.
- **Declined in part: no coverage reserve for an abaya wearer.** The everyday style answer is "Abaya or desi", one choice, and desi outfits do produce the sentence ("Shalwar reaches the ankle"), so the hidden layer cannot leave it out without guessing. No preference is the case it can know.
