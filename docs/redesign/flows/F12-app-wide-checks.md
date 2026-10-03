# F12 App-wide checks

Date: 2026-10-03, revision 3 (owner rounds 1 and 2, review round 3). Flow design (UX, UI, motion, copy). Routes: every route in the screen tree. Inputs: `architecture.md` (F12 row, shell rules, hand-off rules, Magic moments, Owner decisions, Revision 1 and 2 changes), `owner-feedback.md` rounds 1 and 2, `advocate-walkthroughs.md` (Revision 1 walk and its architect response), `use-cases.md` UC-F12-01 to UC-F12-08, `design-system.md`, `motion.md`, `copy.md` (F12 App-wide, Revision 1 and each flow table), the flow docs in `flows/`. Before: `screens/before/today-empty.png`, `tab-closet.png`, `tab-profile.png`, `capture-index.png`, `cutout.png`.

F12 has no screen of its own. The wear calendar is a Looks push (`architecture.md` Round 2 feature homes, item 11) and is designed in `flows/F09-looks.md`; this file only sets how it behaves under the app-wide concerns. F12 sets the rules every other flow doc must follow for eight concerns: empty closet, largest text, bokmål, offline, permissions off, interrupted magic moments, Reduce Motion and VoiceOver. A flow doc may be stricter, never looser. Where a flow doc and this file disagree, this file wins and the flow doc is fixed.

What changes from the before screens: empty states lose their paragraphs (`today-empty.png` had a title, three lines of body and a footnote), no screen goes blank or grey while something loads, and no state adds a banner, toast or sheet beyond the ones the flow docs already define. Every state below lives inside a component that is already on the screen.

What owner rounds 1 and 2 add: the ten onboarding steps with illustrated choice cards, the selfie's three phases, the greeting, the outfit card icons, the coverage line, Rediscover, Tomorrow's outfit, the Closet progress card, Closet sections and the filter panel, the wear calendar, `/profile/never`, `/profile/wear-more`, the completeness meter, location and the morning outfit. Each one is placed in every concern below, and the two new permissions get their own section (P).

## Screens

### Screen families

Every route belongs to one family. The family decides how the concerns look.

| Family | Routes | Recipe (`design-system.md`) | Primary action |
|---|---|---|---|
| Tab root | `/(tabs)/today`, `/(tabs)/closet`, `/(tabs)/looks` | Today, Tab root, Closet | Today: Footer "Wear this" ("Save look" while planning and on Tomorrow's outfit). Closet: none; select mode: an action row (Mark as worn, Link as a set, Put away) above the Footer pair (New look, Start with these), all disabled until a selection (F04). Looks: none. The EmptyState button when empty |
| Detail | `/piece/[id]`, `/look/[id]`, `/looks/calendar`, `/profile`, `/profile/never`, `/profile/wear-more`, `/profile/stylist` | Detail, Looks calendar, Profile | Piece: Start with this piece; look: Show on Today. Calendar, Profile and its pushes: none, every change saves at once |
| Editor | `/piece/new`, `/piece/edit/[id]`, `/look/build`, `/profile/style`, `/profile/answer/[step]`, `/today/adjust`, `/today/pieces` | Editor | Footer commit, rendered disabled from the first frame |
| Step | `/onboarding` (ten steps and the done step) | Onboarding step | Footer `onboarding.next` alone, always enabled; an unanswered step writes nothing |
| Selfie | `/onboarding/colours` (tips, camera, result) | Selfie | Tips: Footer "Open camera". Camera: none, the photo takes itself. Result: Footer "Save colours" |
| Capture list | `/capture`, `/capture/[id]`, `/capture/group/[id]` | Tab root shape on a push (grid), Editor (confirm) | Footer "Add N pieces" / "Looks right" |
| Media | `/capture/scan`, `/cutout/[id]`, `/label/[id]` | Media | Footer of the flow (Done, Save) |
| Gate | splash overlay | Splash (`motion.md`), Splash error | none; Try again on the error |

Layout rule for every family, top to bottom: `Screen` header (native) / content in `Section`s / `Footer` (a flex sibling, never floating). F12 states replace content inside this order. They never add a layer on top, never move the header, never move the Footer.

### E. Empty closet (UC-F12-01)

Purpose: no screen is ever blank; each one names the next flow and links to it (hand-off rule 5).

`EmptyState` in the upper third when a whole region is empty: title in Georgia plus one action, no line unless the title cannot say what happens. When the screen keeps its structure (Today S1b, Profile stats), the empty slot is a `Row` with one action instead. The scarf A mark (on `tile.png`) shows only on Closet empty, Today first run and the onboarding done step (`design-system.md` 15). Today first run is mark plus actions with no title, because the greeting large title already sits above it. One path reaches it: an install that finished today's onboarding with its style and hijab steps skipped (`finishOnboarding` in `src/domain/onboarding.ts` sets `onboarded` and writes no style), then updates. The new done step always writes an everyday style (F01), so a new install never sees it. Where the screen has a Footer, the EmptyState button is `secondary` small and the Footer keeps its own primary (or waits).

Parts of a screen that need data are not rendered while they have none, rather than shown empty: Rediscover until a wear exists, the coverage line when no layer or bottom does the work, Most worn and Never worn without pieces, the completeness chips at 100 percent.

| Screen | Family | What shows | Action | Goes to |
|---|---|---|---|---|
| Today, no everyday style (updated install) | Tab root | Greeting large title. Mark, no title. Primary `today.firstRun.style` with `accessibilityHint` `today.firstRun.styleHint`, quiet `sample.try`. No context row, no Footer | Set your style | F11 `/profile/style` |
| Today, onboarding done, no owned pieces | Tab root | The sample closet outfit (rule 8: the stylist stays on the sample closet until owned pieces can make a full outfit). No Rediscover, no problem card | Today as usual | F06 |
| Today, Adjust set to My clothes, none owned | Tab root | F06 S1b: dashed empty slots in the FlatLay, then the problem `Row` with trailing `closet.addPieces` as the one action. "Start with" and Rediscover are not rendered. Footer waits | Add pieces | F02 |
| Closet | Tab root | Mark, title `closet.firstTitle`, primary `closet.addPieces`. Search, filter row, sections and Select are not rendered. Header `plus` stays (Owner questions) | Add pieces | F02 |
| Closet, no pieces, photos preparing | Tab root | The progress card alone, as the first block. No mark, no EmptyState: the card is already the door to Add pieces, and a second button to the same place is clutter | The card | F02 |
| Closet, filters match nothing | Tab root | Sections not rendered. Title `closet.noneFoundTitle`, primary `closet.clearFilters`, no mark (F04) | Clear filters | Closet |
| Looks | Tab root | No pieces: `looksTab.emptyTitle`, primary `closet.addPieces`. Pieces, no looks: `looksTab.emptyTitle`, primary `looks.new`. Header `plus` and `calendar` stay, because the header never changes; whether that rule outranks "no door to nothing" is an Owner question | Add pieces / New look | F02 / F10 |
| Calendar, no wears at all | Detail | The month grid with no marks, then `calendar.emptyMonth` as the one line under it, as in any month with no wears (F09). No Sections, no action: it is a reading screen one tap from Looks, and `copy.md` cut "Go to Today" | Back | F09 |
| Calendar, a month with no wears | Detail | The grid, then `calendar.emptyMonth` under it | Chevrons, Back | F09 |
| Start with a piece | Editor | `pieces.none`, secondary `closet.addPieces`. Footer "Start with these" disabled | Add pieces | F02, pops back here |
| Build a look | Editor | Strip region: `closet.firstTitle`, secondary `closet.addPieces`. Collage keeps its dashed slots. Fill the rest not rendered. Footer "Save look" disabled | Add pieces | F02, pops back here |
| Add pieces | Capture list | F02 S1 as it always is: tip lines on first open, then the Source rows `capture.takePhotos`, `capture.choosePhotos`, `capture.scan`, quiet `capture.byHand`. Select is not rendered | Take photos | F02 |
| Profile, Closet stats | Detail | Only one `Row` `closet.addPieces` with a chevron under the Section title, pushing `/capture`. Pieces, Never worn and Most worn are not rendered: with no pieces each is a statistic about nothing or a door to nothing. No Section action | Add pieces | F02, ends on Closet |
| Profile, pieces, nothing worn | Detail | Most worn reads `stats.nothingWorn` as plain text, no chevron, no door | none on the row | n/a |
| Trying to wear more of, no pieces | Detail | `pieces.none`, primary `closet.addPieces` (UC-F11-10). The Profile row value is `common.none` | Add pieces | F02 |
| I'll never wear | Detail | Never empty: the garment, colour, hijab colour and pattern chips come from the taxonomy, not the closet | n/a | n/a |

```
 Closet (empty)                   Today (no everyday style)
┌─────────────────────────────┐  ┌─────────────────────────────┐
│ Garderobe                +  │  │ God kveld              (o)  │  greeting, no name
│                             │  │                             │
│          ┌──────┐           │  │          ┌──────┐           │
│          │  A   │           │  │          │  A   │           │  scarf A on
│          └──────┘           │  │          └──────┘           │  the plum tile
│      Ditt første plagg      │  │                             │  title (Closet)
│                             │  │ [     Velg stilen din     ] │  primary
│ [      Legg til plagg     ] │  │  Prøv eksempelgarderoben    │  quiet
│                             │  │                             │
├─────────────────────────────┤  ├─────────────────────────────┤
│  I dag   Garderobe  Samling │  │  I dag   Garderobe  Samling │  native tabs
└─────────────────────────────┘  └─────────────────────────────┘

 Closet, no pieces, photos preparing
┌─────────────────────────────────┐
│ Garderobe                     + │
│ ┌─────────────────────────────┐ │
│ │ 8 nye plagg, 3 av 8 klare > │ │  progress card, one button
│ │ ━━━━━━━━━━━━━────────────── │ │  Silk progress line
│ │ Hijaber og skjerf 2 · ...   │ │  meta, one line
│ └─────────────────────────────┘ │
│                                 │  nothing else
├─────────────────────────────────┤
│  I dag    Garderobe    Samling  │  native tabs
└─────────────────────────────────┘

 Profile, Closet stats with no pieces
│ Closet stats                     │  Section title
│ Add pieces                     > │  Row, chevron, pushes /capture
```

Primary action: the EmptyState button, the one action Row, or the progress card. One onward action per empty state, with two exceptions: Today first run keeps its sample escape as a quiet second, and Add pieces shows its source list, because choosing a source is that screen's job (F02 S1, Take photos first, Add by hand quiet). Open Settings under a permission line fixes that control; it is not an onward action (P). The calendar is the one read-only screen with no action; its back chevron is the way on.

### L. Largest text (UC-F12-02)

Purpose: every route works at every size up to AX5 (fontScale 3.571, `body` and `headline` about 61 pt) with nothing clipped, nothing overlapping and the commit always reachable.

Two steps, `large` (fontScale 1.35 and up) and `ax` (1.6 and up), read from one shared hook (`architecture.md` > Dependencies and native work). Every rule below keys off them; no screen picks its own threshold.

Every family, at `large`:

- Footer pair stacks, secondary above.
- Row trailing values, Expander values and Section title-line actions move under the title.
- Banner, ResultBar and Expander actions stack.
- `Segmented` becomes a vertical list of `Row`s.
- Tile labels lose their 2-line cap.
- Header text items (Edit, Select, Done, Cancel) become their icon (`pencil`, `checklist`, `checkmark`, `xmark`) with the word as VoiceOver label and in the Large Content Viewer (`design-system.md` 2). Icon items (`plus`, `calendar`, the Profile icon) keep their icon. Native bar items get the viewer from UIKit; a header item built as a React view sets `accessibilityShowsLargeContentViewer` and `accessibilityLargeContentTitle`.
- Today: Like, Not for me and Save look leave the title line for their own line under the reason line, leading-aligned (`design-system.md` 11). The Undo slot reserves its stacked height.
- `Swatches` draw each colour name under its swatch.
- Below `large`, a trailing value or action also moves under the title as soon as the longest label the slot can show in the current language, at the current weight, does not fit on the line (B layout rule).
- Segmented-as-Rows keep the `radio` role, `accessibilityState.selected` and the "{option}, {group label}" label. Strip Rows keep `selected` and the Keep Chip state. Choice cards keep their role and state at every size. Semantics never change with text size.

Every family, at `ax`: only the Footer primary stays pinned; the secondary becomes a quiet Button at the end of the scroll content, except Closet select, where the action row stays pinned and New look becomes its last Button (F04). `ChipRow scroll` becomes `wrap`, except the Closet filter row and panel group lines (F04). `Tile` grids go to one column. Strips (Change strip, picker strip, builder strip, Rediscover) become `Row` lists with `thumb` leading and `selected` trailing. `ChoiceCardGroup` goes to one column. `MonthGrid` becomes its Row list (worn days, or the days she can pick), also below `ax` when a column would be under 44 pt.

At AX5 on a 375x667 phone the pinned Footer (primary only) takes at most 50 percent of the safe-area height, so content always keeps the other half. The longest bokmål primaries ("Lagre endringer", "Legg til 12 plagg") with Bold Text set the measure.

| Family | At `large` | At `ax` |
|---|---|---|
| Tab root | Large title in Georgia from `headerLargeTitleStyle` `{ fontFamily: "Georgia", fontSize: 34 * Math.min(fontScale, 1.76) }`, 60 pt at most, set again when `fontScale` changes (`design-system.md` Type > Dynamic Type); the hidden layer measures the greeting at that same size. The native large title truncates, so Today's greeting is measured before it is set and takes the first form that fits one line: with her name, then `today.greeting.short`, then without the name, then `nav.today` (F06). Tab labels do not grow; long press shows them in the Large Content Viewer | Today: Rediscover is a `Row` list. Closet: one column of tiles; the filter row stays one scrolling row, each chip wraps its label inside its capsule (F04); the panel groups stack. The progress card sentence and meta wrap and keep the same content at every size, `progress.moreGroups` included. Looks: rows keep the 72 pt lay leading, meta wraps |
| Detail | The title is the content `title` Text under the hero (the Detail recipe has no visible bar title); it caps at 2.0x and wraps. Fact chips wrap inside their capsule. Profile: the meter sentence wraps, the quick add chips wrap. Calendar: the grid keeps seven columns; numbers grow, the 40 pt cut-outs do not | Hero stays full width; the planned mark leaves the photo for the line under it. Calendar: F09 day Rows (the short date alone as title, `calendar.day` as label, `button`, `accessibilityState.expanded`, the day's wears open under it); the month title wraps and Previous and Next sit on their own line under it. Never wear and Wear more: chip groups wrap, the piece picker is one column |
| Editor | Field grows with its line height. Segmented as Rows. Your style card questions stay closed Expander rows, value under the title | Builder and picker scroll as one column (F10). Footer commit stays pinned and grows. While the keyboard is open the Footer does not ride it: it stays at the bottom under the keyboard and returns when the keyboard closes, so the focused Field and its label keep the space |
| Step | Choice cards stay two columns, labels wrap. The question title wraps, never capped. Progress bar unchanged | Cards one column, full width, min(240 pt, 30 percent of the safe-area height) tall, `contentFit="contain"`; plain chips wrap under them with `minHeight`, never a fixed height. Name step: the keyboard rule from Editor |
| Selfie | Tips Rows wrap. Swatch names drawn | The camera phase never scrolls: she holds the phone at eye level and auto capture needs the guide in view. The feedback line reserves the height of the longest `selfie.guide.*` or retake reason in the current language and weight, measured in the hidden layer. The circle stays the first child, diameter min(264, 40 percent of the safe area, safe area minus header minus that reserve minus the `space.lg` gap), floor 120 pt. If `colours.library` stays (Owner questions), its height joins the reserve. Tips and result scroll; `Swatches` become a list of `Row`s, swatch leading and name as the title |
| Capture list | Tile meta and colour line wrap | Grid is one column. The tile colour line stays its own 44 pt control under the photo |
| Media | Guide pill and readout stay on the photo with `mark` capped at 1.4x | Guide pill and readout leave the photo for the controls area under the frame, uncapped `subhead` `onMedia` on `ink`. The frame keeps at least 40 percent of the safe area height; past that, the controls area scrolls, with the shutter pinned, centred and at its distance from the bottom safe area. Text never overlaps the shutter |
| Gate | Splash error block centred between the insets | The block is a ScrollView from `space.xxl` under the top inset, Try again last and clear of the home indicator |
| Empty and gone | Title wraps, button shows its full label | Same; the mark keeps its size |

Checks per route: the ScrollView bottom inset is the measured Footer height plus `space.footerInset`, so the last block always scrolls clear of the Footer. Nothing truncates; the only line caps in the app are the Tile label below `large` and the progress card meta below `ax` (one line, the rest as `progress.moreGroups`). Native inline titles are fixed strings, never user content (Edit piece is `piece.edit.title`, the piece name lives in the content). Lane 1 device checks on a 375x667 phone:

- The longest bokmål inline titles ("Start med et plagg", "Endre plagget", "Jeg bruker aldri", "Vil bruke mer", "Kalender") fit beside the back button and one trailing item; any that do not are shortened in `copy.md`.
- The Georgia large title grows from default to its 60 pt cap, "Garderobe" and "Samling" fit at 60 pt, and the greeting falls back to "I dag" before it would truncate.
- At default size the bokmål afternoon greeting is "Hei, {name}" (decided, Notes), so "Hei, Fatima", "Hei, Khadija" and "Hei, Zainab" fit one line; the fallback chain only covers extreme names.
- In nb at xLarge, "Garderoben i tall" plus "Legg til plagg" moves the action under the title before paint.
- Edit piece name entry and onboarding step 1 at AX3 and AX5 with the keyboard open: the Field and its label stay visible.
- At AX5 in nb with Bold Text: Edit piece ("Lagre endringer" pinned), the hijab styles step and the selfie camera phase. The Footer leaves at least half the safe area, the feedback line keeps its reserved height through every guide, nothing clips.
- Coverage step at AX5 with Bold Text: "Spiller ingen rolle" grows its chip, nothing clips.
- Selfie camera phase at AX5, nb, Bold Text: the whole circle and the longest reason ("Fant ikke ansiktet. Hold telefonen i øyehøyde.") are visible without scrolling.
- "Kameratilgang er av" with "Åpne Innstillinger" on the selfie at AX5.
- The coverage step under Increase Contrast: the sleeve and hem lines of all three figures read on `paper`.

```
 Edit piece at AX3                  Coverage step at AX3
┌─────────────────────────────┐    ┌─────────────────────────────┐
│ (x)          Endre plagget  │    │ <                           │  icon items
│ Kategori                    │    │ ━━━━━━──────────────────────│  progress
│ ( Topper  ) ( Kurtaer og    │    │ Hvor dekket vil             │  question
│   tunikaer )                │    │ du være til                 │  wraps
│ Stil                        │    │ hverdags?                   │
│ Desi                     ✓  │    │ ┌─────────────────────────┐ │
│ ───────────────────────────│    │ │        figure           │ │  one column,
│ Vestlig                     │    │ │       (contain)         │ │  240 pt cap
│ ───────────────────────────│    │ └─────────────────────────┘ │
│            ...              │    │ Helt dekket                 │
├─────────────────────────────┤    │            ...              │  scrolls
│ ┌─────────────────────────┐ │    ├─────────────────────────────┤
│ │      Lagre endringer    │ │    │ [          Neste          ] │  pinned
│ └─────────────────────────┘ │    └─────────────────────────────┘
└─────────────────────────────┘

 Calendar at AX3
│ <            Kalender            │
│ oktober 2026                     │  month title, wraps
│                      (<)  ( )    │  own line, Next slot kept
│ tor. 2. okt.                 ^   │  day Row, date alone, open
│ ┌────┐ Hverdag                   │  its wears under it
│ │lay │                           │
│ └────┘                           │
│ man. 29. sep.                v   │  closed, newest first
```

### B. Bokmål (UC-F12-03)

Purpose: the app reads as written in Norwegian, with no truncated label and one word per concept.

| Family | Rule |
|---|---|
| All | Every word comes from the `copy.md` glossary (and its Revision 1 additions). "Bruk" means wear and nothing else: picking an alternative is "Velg", and "Use my location" is "Finn posisjonen min". Copy keys hold no soft hyphens; the shared `Text` adds them at render time in `nb` for words of 12 or more characters (the hyphenator is planned in `architecture.md` > Dependencies and native work). User content (her name, piece and look names she typed) is never hyphenated, and tests match on `testID` or on strings with hyphens stripped. Dates from `Intl.DateTimeFormat` with the app locale ("lør. 11. okt."); times with `hourCycle: "h23"` ("07:00"); percentages with `Intl.NumberFormat` ("38 %"). Never nynorsk |
| VoiceOver language | The app language is set natively once ("nb-NO" or "en"), at launch and on every language switch (the module is planned in `architecture.md` > Dependencies and native work), so every element is spoken with the voice of the app language whatever the phone's language. A parent view's `accessibilityLanguage` does not reach its children on iOS, so no screen relies on it. Elements that speak another language set their own (F11 Language Rows) |
| Tab root | Tabs `I dag`, `Garderobe`, `Samling`. Samling holds looks; Antrekk is only the outfit on Today. Large titles fit at 60 pt on a 375 pt phone (Lane 1 device check). Greeting "God morgen, {name}" / "Hei, {name}" / "God kveld, {name}" falls back as in L, the same rule in both languages |
| Today | Footer `Bruk i dag` alone (or `Lagre look` while planning and on `Morgendagens antrekk`). Quiet row `Et annet` alone, full width. The coverage line uses `kind.subject.*` in definite form ("Blazeren dekker armene.") |
| Step and Editor | Segmented switches to its vertical list when any label would wrap (`Eksempelgarderobe` / `Mine klær`). Choice card labels wrap under the card, never truncate ("Dekkende vestlig", "Spiller ingen rolle"). Footer labels wrap, never truncate |
| Capture list, Detail and Tab root tiles | Tile `mark` strings fit 9 characters ("fre."); the abbreviation is visual only, and the VoiceOver label uses `weekday: 'long'`, `month: 'long'` ("fredag", "lørdag 11. oktober"). Fact chips read "Farge: salvie, gjettet" in VoiceOver. Calendar day labels use `dateStyle: "full"` |
| Media and Selfie | Guide pill strings are the `scan.status.*` values; the face circle line is `selfie.guide.*`; one phrase "Hold stille" in both |
| Notifications | Title from `today.greeting.*` by the hour it fires, body `notify.today` / `notify.tomorrow`, in the app language. `notificationPlan(styling, locale)` runs again on every language switch, so the next notification is in the new language (UC-F11-11) |
| Language switch | Profile re-renders in place; the user stays on Profile (F11). The native `accessibilityLanguage` updates and the notification is rescheduled in the same tick |

Layout rule: every label sits in a wrapping container with `minHeight`, never a fixed width or height, and any row that picks horizontal or vertical layout measures the longest label the slot can show in the current language (for example Save look and Open look) at the current weight before it paints, so a crossfade never changes the layout. Weight comes from `AccessibilityInfo.isBoldTextEnabled`, and the row measures again on `boldTextChanged`.

### O. Offline (UC-F12-04)

Purpose: only the features that use the network change state, each inside its own control. Everything else works as usual.

The network features are the ones the privacy line names (`settings.privacy`): the place and forecast (Apple) and Clean background (Cloudflare). "Use my location" counts as network: the phone finds its position offline, but the city name comes from Apple's reverse lookup. Nothing else changes offline: background preparation, the selfie and its palette, the stylist, the calendar, the meter, the illustrations (bundled) and the morning notification (local) all work. There is no app-wide offline banner, no greyed screen and no queued request.

| Feature | Where | Offline state | Way out |
|---|---|---|---|
| Forecast | Today context row, Tomorrow's outfit, Adjust Weather | Chip reads `weather.unavailable`, no Apple Weather link at the end of the scroll. VoiceOver: role button, label `weather.chipLabel` with `weather.unavailable` as {weather} ("Weather, Weather unavailable" / "Vær, Ingen værmelding"; `weather.chipLabelTomorrow` on Tomorrow's outfit), so the visible words are in the label; chevron hidden. The outfit is styled from local data; Tomorrow's outfit is built without tomorrow's forecast | Tapping the chip still opens Adjust Weather, where the manual bands work. Foreground or pull to refresh fetches again |
| Place lookup | Onboarding step 8, Profile > Location | One cause, one message: `common.offline` in the one slot under the Field, from either path. Use my location ends busy (the position is found, only the city name needs Apple's reverse lookup); VoiceOver focus moves to the line and the keyboard stays down. Search keeps focus on the Field, which reads its label with the error. Nothing above the Field moves. `place.notFound` is only for a phone that cannot get a position, `onboarding.city.notFound` only for a city that does not exist | Search again once online; Next writes nothing (onboarding); Cancel (answer) |
| Clean background | Capture confirm, Edit piece | The chip returns unselected with the `quick` crossfade; `footnote` `error` `common.offline` under the chip row, announced (shared announcement rule) with focus kept on the chip, then `common.tryAgain` as a `Button quiet small` (minHeight 44) on its own line under the footnote. The photo is unchanged | Try again, or keep any other photo chip |
| Apple Weather link | End of Today's scroll | Not shown offline (no forecast, no link) | n/a |

```
 Today offline                         Place step offline
│ God morgen, Sara           (o) │    │ Hvor holder du til?            │
│ ( Hverdag > ) ( Begge > )      │    │                                │
│ ( Ingen værmelding  > )        │    │ (   Finn posisjonen min    )   │  secondary, tapped
│ ┌────────────────────────────┐ │    │                                │
│ │      outfit FlatLay        │ │    │ [Q Søk etter byen din      ]   │  Field, keyboard down
│ │                            │ │    │   Du er uten nett              │  the one slot
                                      │                                │
                                      │ Rundes av til byen og sendes   │  privacy
                                      │ bare til Apple for været.      │
```

### P. Permissions off (UC-F12-08)

Purpose: a denied permission changes only the control that needs it, and nothing asks again on its own. Every system prompt is asked on the control she tapped, never at launch.

| Permission | Where | Denied state | When it is allowed in Settings |
|---|---|---|---|
| Location | Onboarding step 8, Profile > Location | Use my location ends busy; `place.locationOff` with `common.openSettings` as a `Button quiet small` in the one slot under the Field. VoiceOver focus moves to the line, the keyboard stays down until she taps the Field, nothing above the Field moves, and search works as usual. Without any place, Today's forecast chip reads `weather.unavailable` and the outfit still shows | Nothing runs by itself; the next tap on "Use my location" finds the city |
| Notifications | Onboarding step 9, Profile > Morning outfit | The chosen time chip stays selected; `notify.denied` as `footnote` `inkMuted` under the chips with `common.openSettings` (quiet small). On the step, Next still moves on | On return to the foreground the permission is read again: allowed, the line leaves with inline collapse and the schedule is set without another tap |
| Camera | Selfie camera phase | The circle is an empty `sunken` disc, no ring, hidden from VoiceOver; the feedback slot holds the camera-off recipe. The tips and result phases are unchanged | The feed fades in at the same size; nothing moves |
| Camera | Scan, cut-out photo, capture "Take photos" | `CameraFrame` unavailable: the camera-off recipe in the frame. The shutter is not rendered; its height stays reserved so the frame does not resize if access returns | Same frame, live feed |

Camera off, one recipe everywhere: `common.cameraOff` as the line, `common.openSettings` as `Button quiet small` under it, then `capture.choosePhotos` (`Button secondary small`) where a library path exists (scan, cut-out photo, Take photos; on the selfie only if `colours.library` stays, Owner questions). VoiceOver focus goes to the line.

```
 Profile, morning outfit, notifications off
│ Morgenantrekk                    │  Row title
│ ( Av ) (06:00) [07:00] (08:00)   │  chips in place, 07:00 stays selected
│ (21:00 kvelden før)              │
│ Varseltilgang er av              │  footnote
│ Åpne Innstillinger               │  quiet small
```

### I. Interrupted magic moments (UC-F12-05)

Purpose: leaving mid-moment never leaves a stuck shimmer, a half-saved piece, a duplicate job or a late result on a gone screen.

Two kinds of work, two rules:

1. **Closet work keeps running.** Capture preparation, a Clean background request and a save that has started belong to the closet, not the screen. Leaving does not cancel them, and returning shows them where they are. They are created once; returning never starts a second request.
2. **Screen work stops.** The cut-out mask load, the hold-to-select, the box snap, the selfie countdown and measuring, the location lookup and every animation belong to the screen. Leaving cancels them, cancels their shared values and guards their callbacks, so no state update runs on an unmounted screen.

| Moment | Leave and return | Shows on return |
|---|---|---|
| Cut-out editor loading | Load cancelled. Nothing is saved to the mask | The editor opens fresh: photo or placeholder, then `sheen` while the mask loads |
| Cut-out hold to select | Ring and sweep dropped | The last saved mask, no outline |
| Group "Use this box" | Selection dropped; the box stays as drawn | The row list as it was before the tap |
| Scan, back during the lift | The lift is dropped, never replayed. A capture that fired is one job, created once, and follows F03's back behaviour | No sticker on screen, no duplicate thumbnail |
| Clean background | Request keeps running | Still running: the chip selected with `accessibilityState.busy`, `footnote` `inkMuted` `photo.cleanMaking` under the chip row, `sheen` over the photo. Done while away: the new photo in place with the chip selected, no crossfade replay. Failed while away: the original photo, `common.offline` or `photo.cleanFailed` as a `footnote` `error` under the chip row, with quiet `common.tryAgain` as in O, announced once when the screen regains focus, focus kept where it was |
| Selfie countdown (arc filling) | Countdown and its callback cancelled; nothing is taken | The camera phase, arc from nothing, when the tips were seen in this session; the tips phase only on a fresh entry |
| Selfie "Measuring your colours" | Measuring dropped. The temp selfie is deleted. The onboarding step is unchanged; no result or error lands on it | As the countdown: the camera phase when the tips were seen in this session, else the tips |
| Selfie result, not saved | Nothing is written until "Save colours" | The step or the Profile row shows the colours saved before, or none |
| "Use my location" finding | Lookup dropped, nothing written | The place Field as it was before the tap |
| App killed during preparation | Jobs resume once each on relaunch | Closet: the progress card in place from the first frame with its current counts (`progress.newOne` / `progress.newMany`, then `progress.readyOne` / `progress.readyMany`). Add pieces shows the preparing `sheen` on the tiles. A job that cannot finish shows `capture.stateFailed` with `capture.retake` |
| Today generating (tab switch or push mid-arrange, a Rediscover tile, Tomorrow's outfit) | The stylist result still lands in the store; the sheen loop stops on blur | The new outfit in place, no swap replay. When Today regains focus with a new outfit, `today.announce.outfit` is announced once, queued, and focus stays where it was |
| Tomorrow's outfit, app killed before it was built | Nothing is stored | The next open shows today's outfit |
| Midnight with the app open | Sessions end with their day (`ensureToday`) | On the next focus or foreground: the greeting, the session and Tomorrow's promotion apply at once, never under her eyes |
| Committing button (save mid-write) | The write finishes | The saved data. The ResultBar is not shown on a later visit |
| Chip that saves at once (never wear, morning outfit, choice card) | The write finishes | The chip as saved; `result.saved` is not announced again |
| Profile meter easing | Dropped on blur | The meter at its value on the first frame, no replay; it eases only when Profile is shown after the answer changed |
| Calendar month change | Crossfade dropped | The month she was on, in place |
| Splash drape (app backgrounded) | Hand-off still happens at drape end | Warm return goes straight to the screen; nothing replays |

```
 Closet after relaunch with jobs pending
│ Garderobe                     +  │
│ ( Søk                          ) │  native search bar
│ ( Mer v ) ( Alle ) ( Hijaber og  │  filter row, scrolls
│ ┌─────────────────────────────┐ │
│ │ 6 nye plagg, 4 av 6 klare > │ │  progress card, one button
│ │ ━━━━━━━━━━━━━━────────────  │ │
│ │ Hijaber og skjerf 3 · ...   │ │
│ └─────────────────────────────┘ │
│ Hijaber og skjerf 31            │  first section
```

### R. Reduce Motion (UC-F12-06)

Purpose: every moment still resolves, with fades only. While a wait runs, the band pulses in place so it can be seen. Where the band is faint on its host (busy primary Button, Clean background over a light photo, placeholders), visible text carries the wait where the host has text (Clean background `photo.cleanMaking`); elsewhere, and past `loop`, the dependable cue is VoiceOver (`accessibilityState.busy`, `busyLabel`, the host's label).

The `useReduceMotion()` hook (JS) and `UIAccessibility.isReduceMotionEnabled` (native editor) are read live, so a change in Settings applies without a restart. A moment that is running when the setting changes continues from its current values on the reduced path: travel jumps to its end, opacity finishes as a `base` fade.

The pulse: the band fades in place by opacity only, with no travel, from 0 to the host's peak over `sheen` and back, `wait` between. Full motion: the band travels for `loop`, then on a usable screen it fades out (`base`) and stops (WCAG 2.2.2). Reduce Motion: the pulse replaces the travelling band, with the same `loop` limit. A full-screen wait (the editor mask load) runs the pulse after `loop`, in either mode, until it resolves. This is the one loop `motion.md` principle 7 allows.

| Family | Under Reduce Motion |
|---|---|
| All | Push and pop stay native. Inline expand and collapse: layout in one frame, content fades (`base`). List insert and remove: fade, no stagger, neighbours move in one frame. Filter result crossfades at `base`. Selection fills, icon toggles, choice card discs and `press` unchanged (opacity only already). Every sheen host (tiles, buttons, the face circle while measuring, Today and builder flat lay arranging, Clean background over the photo, the Detail hero) pulses after `wait`; every placeholder stays still (Today lay, Looks rows, forecast chip, the place Field, calendar cut-outs). Every `scrollTo`, `scrollToIndex` and `scrollToOffset` passes `animated: !reduceMotion`. Segmented thumb crossfades (`base`). `lift` shadow and Expander chevron jump. `Silk progress` steps in one frame |
| Tab root | Today: changed slots crossfade in place (`base`), no travel, no stagger; a Rediscover tile or start chip scrolls to the top in one frame. Closet: placeholders still, new tiles fade in, the progress card's line steps and its text crossfades (`base`) |
| Detail | Calendar month change crossfades at `base`, the day list opens in one frame. Profile meter steps, its chips crossfade (`base`) |
| Editor | Builder Fill the rest crossfades. Busy Buttons pulse after `wait`, label unchanged; a busy primary uses the `motion.md` Sheen peak for plum. Secondary, quiet and destructive keep their peaks. Clean background: the chip keeps its selected and busy look and `photo.cleanMaking` shows as a `footnote` `inkMuted` line under the chip row |
| Step | Step change crossfades (`base`), the progress bar steps |
| Selfie | Phases crossfade (`base`). The arc stays, because it is a timer, not travel. The capture veil fades in and out (`base`). Then the pulse over the circle. The palette arrives with one `base` fade |
| Capture list | Preparing tiles pulse; ready content fades in (`base`) |
| Media | Cut-out: ring fades in, mask and dim at once, outline fades in, holds `wait`, fades out. Group box: crossfade from drawn to snapped frame. Scan: outline fades in once; moves only past 8 pt, at most once per `dwell`, as a crossfade (old out `quick`, new in `base`); sticker fades in, holds `wait`, fades out while the tray thumb fades in |
| Gate | Mark fades in (`base`), hand-off at the end of the fade, overlay fades out (`base`). Splash error: the tile crossfades to its place in the block, title and Try again fade in with it |

Each reduced path still exposes its in-progress `testID` (`moment-loading`, `moment-generating`, `moment-selecting`, `moment-found`) while the work runs, and resolves to the same result `testID`.

### V. VoiceOver walk (UC-F12-07)

Real phone, checklist. Not a magic moment and not a new screen. Run four times: English phone with the app in English, nb-NO phone with the app in bokmål, English phone with the app in bokmål, and nb-NO phone with the app in English.

Screens to walk:

- Onboarding, all ten steps: name Field, hijab chips, hijab styles (multi), coverage, everyday style and fit cards, sparkle chips, place (both ways), time chips, colours step, done.
- Selfie: tips, face circle with its feedback and the Take photo action in the Actions rotor, auto capture, palette, "These don't look like me".
- Today and Today first run: greeting, the three outfit icons and the two icons on Tomorrow's outfit (Like, Not for me, in that order, no Save), the hijab with its swap mark, the reason line with the coverage line, Rediscover, the Tomorrow's outfit Banner, the Change strip.
- Closet empty, sections, filter row and panel, select (Cancel in Select's place, the count as the title, the Footer action row then the pair, last), the progress card.
- Add pieces with preparing tiles and the tile colour line control. Group box resize.
- Edit piece: Segmented radios, ChipRow wrap, Clean background offline.
- Builder. Cut-out editor (hold to select through `cutout.selectPiece` / `cutout.selectPieceN`). Scan capture.
- Calendar: month line, worn days, a day's rows, Most worn, Variety.
- Profile: the meter and its chips, morning outfit chips, I'll never wear, Trying to wear more of, the language switch.

What must hold:

- Every control is reachable in reading order with a label, spoken with the voice of the app language.
- Radio role and position read correctly in bokmål (`design-system.md`, shared rules). Hijab style cards are checkboxes with `accessibilityState.checked`; clearing other cards announces `choice.clearedOne` / `choice.clearedMany` once.
- RN writes the words for selected, checked, expanded and busy itself, from the bundle or phone locale. In the two cross-language runs, pass means the state word is spoken in the app language for selected (Like, the Closet panel chips, a calendar day below `ax`), checkbox (hijab styles, None of these), expanded (Not for me, the Your style "My own limit" chip, a calendar day Row at `ax`) and busy (Use my location, Another, the Clean background chip). If it comes in the phone's language, that control falls back as radio does: a checkbox becomes `button` with `accessibilityState.selected`, and any other state word comes from `copy.md` in the app language inside its label.
- Card figures are hidden; a coverage or hijab style card is read as its word, then `coverage.*.description` / `hijabStyle.*.description`, joined with ", " in one accessibilityLabel, never as `accessibilityHint`.
- 44 pt targets everywhere, the outfit card icons and the calendar chevrons included.
- Header items, the outfit card icons and the calendar chevrons show the Large Content Viewer on long press at `large`.
- The hijab is one element: its label and `change.hintHijab`; the swap mark is hidden. Like reports `selected`, Not for me `expanded` (the card icon and the word by Undo report the same state), Save look no state, then `today.openLook` with value `result.saved` (F06, Owner questions).
- The `outfit.notForMe` word next to Undo acts on the skipped outfit, so its VoiceOver label is `outfit.notForMeSkipped` ("Not for me, last outfit" / "Passer ikke, forrige antrekk"), the visible word first, so VoiceOver and Voice Control tell it from the card's thumbs down.
- Outfit changes announce once (`today.announce.outfit`). The selfie announces `colours.taken` once; the face circle is one element `colours.circleLabel` with `activate` and `magicTap`, and while a face is found also a named custom action `common.takePhoto`, so it shows in the Actions rotor (the name of `activate` is never spoken). A plain tap on the circle also takes the photo, for a sighted hand that cannot hold still for `dwell` (Owner questions). Each palette row is one element `colours.paletteLabel`.
- The progress card is one button; only the switch to done is announced.
- The calendar exposes worn days only, each `calendar.day` or `calendar.today`; a month change keeps focus on the chevron and announces the month label once.
- The meter is one element `profile.meter`, its percent read once.
- Focus stays after an in-place change and never jumps to the top. A step change and the splash hand-off focus the new title; a selfie phase change focuses the face circle (camera, retake) or the season title (result) (F01).
- No exiting copy is reachable (`design-system.md`, Accessibility rules; `motion.md`, VoiceOver during motion).

## States

The full matrix. A cell names the section rule above; "n/a" means the state cannot occur there.

| State | Tab root | Detail | Editor | Step | Selfie | Capture list | Media |
|---|---|---|---|---|---|---|---|
| Empty | EmptyState, mark on Closet and Today first run only; progress card alone on Closet while photos prepare; Rediscover not rendered (E) | Profile stats: one Add pieces Row. Wear more: Add pieces. Calendar: grid plus one line. Piece and look always have content (E) | EmptyState in the strip or body, Footer disabled (E) | Unanswered step: Next writes nothing | n/a | F02 S1 source rows (E) | n/a |
| Loading | `Silk placeholder` in the target's shape; one `common.loading` per region | Hero placeholder; calendar cut-out placeholders; late images fade in | Strip tile placeholders | Place Field placeholder after `wait`; card art has no placeholder | Circle `sunken` until the feed is live | Tile `sheen` while preparing | Ink frame until the feed is live; editor photo then `sheen` |
| Generating | Today and builder flat lay: current pieces stay, `sheen` after `wait`, changed slots swap. Progress card line | n/a | Builder Fill the rest | n/a | Measuring sheen over the circle | Preparing tiles, Clean background | Box snap, care label reading |
| Error | Inline next to the control (`common.error.*`), announced. Closet cannot open: Splash error with `common.tryAgain` | Same | `Field` error or `footnote` above the Footer | Under the control that failed | Retake reason in the feedback line | Failed tile with Retake | `scan.unavailable` in the frame |
| Offline | Today forecast chip, Tomorrow's outfit (O) | Profile > Location (O) | Edit piece Clean background (O) | Place step (O) | No change | Confirm Clean background (O) | No change |
| Permission off | Forecast chip with no place (P) | Location, Morning outfit (P) | n/a | Place, notifications (P) | Camera off in the circle slot (P) | n/a | `CameraFrame` unavailable (P) |
| Interrupted | Today generating, Closet pending jobs, midnight (I) | Save mid-write, meter, month change (I) | Save mid-write (I) | Location lookup, chip saves (I) | Countdown, measuring, unsaved result (I) | Preparation, Clean background (I) | Editor, box snap, scan lift (I) |
| First run | Today first run on an updated install; Closet and Looks empty (E) | Profile with nothing answered: `profile.notAnswered` values, meter with its first three chips | Your style opened from Today first run | Step 1 with no back item | Tips phase | Tip lines on the first empty open | Cut-out hint `cutout.hold` until first use |
| Gone | n/a | `Screen gone` with `common.goBack`, pops | Same | n/a | n/a | `capture.gone.title`, `capture.group.gone` with Go back | `/cutout` and `/label` gone line under their own header |
| Largest text | L | L | L | L | L | L | L |
| Bold Text | Measured layouts use the bold width (B layout rule) | Same | Same | Same | Same | Same | Same |
| Increase Contrast | `design-system.md` swaps: `blushStrong`, `inkMuted` to `ink`, `line` to `lineField`, placeholder edge | Same; swatch names drawn | Same | Same; every `ChoiceCard` gets the 1 pt `lineField` edge a Silk placeholder gets (3.34 on canvas). The edge does not help the figure, so the re-render pass gives garment outlines at least 3:1 on `paper`, the three coverage cards at least, where sleeve and hem length is the answer (Notes) | Same; swatch names drawn | Same | Same; `onMedia` text unchanged |
| Bokmål | B | B | B | B | B | B | B |
| Reduce Motion | R | R | R | R | R | R | R |

## Motion

All names are `motion.md` tokens and transitions. F12 adds one motion, the sheen pulse (R); otherwise it fixes which motion each concern uses.

- **Empty states.** The EmptyState is there in the first frame of the screen: no entrance, the mark is still (`motion.md`, Loading). The first piece reaches Closet while `/capture` is on top, so the swap from empty to full happens before the pop reveals Closet: search, the filter row, Select and the sections are in place on Closet's first visible frame, and only the new tiles fade in (F04, Arrive after Add pieces). The progress card replaces the Closet EmptyState in the same way, before Closet is shown again. A part that is not rendered without data (Rediscover, the coverage line) appears with the screen when the data exists, never with an entrance of its own.
- **Loading.** `Silk placeholder` at once with the final size, band only after `wait`, resolve with content fading in (`base`, `silk`) and the band fading out (`quick`). One sheen clock per screen; the travelling pass stops after `loop` on a usable screen and on blur. The progress card has no band: busy is its line.
- **Offline and permissions.** No motion of their own. The forecast chip resolves from its placeholder to `weather.unavailable` with the Loading resolve. The Clean background chip returns with the `Selection` crossfade (`quick`, `silk`) and its error line enters with `Inline expand`. The place slot line and the `notify.denied` line enter with `Inline expand` and leave with `Inline collapse`.
- **Interrupted.** Every moment cancels its shared values on unmount and guards its callbacks (`motion.md`, Testing notes). Returning never replays a moment that finished while away: the result is in place on the first frame, like any pushed screen (`Push and pop`). A moment still running on return shows its current frame (sheen band on its clock, the progress line at its value), never restarts from zero.
- **Largest text.** No layout animates because of text size. A Footer pair that stacks, the outfit icons that move under the reason line, a choice card grid that goes to one column and a month grid that becomes a list are laid out from measured sizes before they paint (`Banners and bars`), so nothing shows one way and then jumps.
- **Bokmål.** The language switch on Profile re-renders in place with no transition. Label crossfades measure both labels of the current language and hold `minHeight` (`Banners and bars`).
- **Reduce Motion.** As R above; every reduced fade passes `ReduceMotion.Never` so the fade is not lost.
- **Haptics.** Unchanged by any F12 state. Offline, empty, permission and interrupted states fire none.

## Copy

One new key, `outfit.notForMeSkipped`, and two changed wordings, `progress.newOne` and the bokmål `today.greeting.afternoon` set, sent to `copy.md` (Notes). Every other key below is in `copy.md` (F12 App-wide, the flow tables and Revision 1).

| Where | Key | English | Bokmål |
|---|---|---|---|
| Loading region (VoiceOver) | `common.loading` | Loading | Laster |
| Today first run | `today.firstRun.style`, `sample.try` | Set your style, Try the sample closet | Velg stilen din, Prøv eksempelgarderoben |
| Today first run hint (VoiceOver) | `today.firstRun.styleHint` | Needed before your first outfit | Trengs før det første antrekket |
| Today heading | `today.greeting.morning`, `.afternoon`, `.evening`, the `*Plain` set, `today.greeting.short`, `nav.today` | Good morning, {name}; Good morning; Hi, {name}; Today | God morgen, {name}; God morgen; Hei, {name}; I dag. Afternoon in nb: Hei, {name}; Hei |
| Closet empty | `closet.firstTitle`, `closet.addPieces` | Your first piece, Add pieces | Ditt første plagg, Legg til plagg |
| Closet, nothing matches | `closet.noneFoundTitle`, `closet.clearFilters` | No pieces found, Clear filters | Fant ingen plagg, Fjern filtre |
| Progress card | `progress.newOne`, `progress.newMany` | 1 new piece, getting ready; {total} new pieces, {ready} of {total} ready | 1 nytt plagg gjøres klart; {total} nye plagg, {ready} av {total} klare |
| Progress card done | `progress.readyOne`, `progress.readyMany`, `capture.failedOne`, `capture.failedMany` | 1 ready to add, {count} ready to add, 1 could not finish, {count} could not finish | 1 klar til å legge til, {count} klare til å legge til, 1 ble ikke ferdig, {count} ble ikke ferdig |
| Builder strip empty | `closet.firstTitle`, `closet.addPieces` | Your first piece, Add pieces | Ditt første plagg, Legg til plagg |
| Looks empty | `looksTab.emptyTitle`, `looks.new` | No looks yet, New look | Ingen looker ennå, Ny look |
| No pieces (Looks, Start with a piece, Wear more) | `pieces.none` | No pieces yet | Ingen plagg ennå |
| Calendar empty | `calendar.emptyMonth` | No looks worn in {month} | Ingen looker brukt i {month} |
| Profile Most worn, nothing worn | `stats.nothingWorn` | Nothing worn yet | Ingenting brukt ennå |
| Add pieces empty | `capture.takePhotos`, `capture.choosePhotos`, `capture.scan`, `capture.byHand` | Take photos, Choose photos, Scan, Add by hand | Ta bilder, Velg bilder, Skann, Legg til manuelt |
| Profile stats empty | `closet.addPieces` | Add pieces | Legg til plagg |
| Offline | `common.offline` | You are offline | Du er uten nett |
| Place not found (no position, no such city; offline is `common.offline` from both paths) | `place.notFound`, `onboarding.city.notFound` | Could not find your location, Could not find this city | Kunne ikke finne posisjonen din, Kunne ikke finne byen |
| Offline forecast | `weather.unavailable`; VoiceOver `weather.chipLabel` | Weather unavailable; Weather, Weather unavailable | Ingen værmelding; Vær, Ingen værmelding |
| Place step | `place.useLocation`, `place.search` (the Field's placeholder and label) | Use my location, Search for your city | Finn posisjonen min, Søk etter byen din |
| Clean background running | `photo.cleanMaking` | Cleaning the background | Renser bakgrunnen |
| Clean background failed | `photo.cleanFailed` | Could not clean the background | Kunne ikke rense bakgrunnen |
| Retry | `common.tryAgain` | Try again | Prøv igjen |
| Location off | `place.locationOff`, `common.openSettings` | Location access is off, Open Settings | Posisjonstilgang er av, Åpne Innstillinger |
| Notifications off | `notify.denied`, `common.openSettings` | Notification access is off, Open Settings | Varseltilgang er av, Åpne Innstillinger |
| Camera off | `common.cameraOff`, `common.openSettings`, `capture.choosePhotos` (where a library path exists) | Camera access is off, Open Settings, Choose photos | Kameratilgang er av, Åpne Innstillinger, Velg bilder |
| Job that cannot finish | `capture.stateFailed`, `capture.retake` | Could not finish, Retake | Ble ikke ferdig, Ta på nytt |
| Closet cannot open | `start.error.title` | Could not open your closet | Kunne ikke åpne garderoben |
| Gone | `common.goBack`, `capture.gone.title`, `look.goneTitle` | Go back, This photo is no longer waiting, This look is no longer here | Gå tilbake, Dette bildet venter ikke lenger, Denne looken er ikke her lenger |
| Tabs | `nav.today`, `nav.closet`, `nav.looks` | Today, Closet, Looks | I dag, Garderobe, Samling |
| Not for me next to Undo (VoiceOver) | `outfit.notForMeSkipped` | Not for me, last outfit | Passer ikke, forrige antrekk |
| Outfit arrived (announced) | `today.announce.outfit` | New outfit: {name} | Nytt antrekk: {name} |
| Cards cleared (announced) | `choice.clearedOne`, `choice.clearedMany` | 1 choice cleared, {count} choices cleared | 1 valg fjernet, {count} valg fjernet |
| Selfie (VoiceOver) | `colours.circleLabel`, `common.takePhoto`, `colours.taken` | Camera, {guide}; Take photo; Photo taken | Kamera, {guide}; Ta bilde; Bilde tatt |
| Notification | `today.greeting.*`, `notify.today`, `notify.tomorrow` | Good morning, {name}; See today's outfit; See tomorrow's outfit | God morgen, {name}; Se dagens antrekk; Se morgendagens antrekk |

## Use cases

| ID | Screens | States |
|---|---|---|
| UC-F12-01 | E: Today first run, then Today on the sample closet after Your style; Closet (empty, then photos preparing, then a filter with no match); Looks (no pieces, and pieces with no looks); Calendar with no wears; Start with a piece; Build a look; Add pieces; Profile Closet stats and Most worn; Trying to wear more of | Empty, first run. Every screen has one onward action except Today first run, Add pieces and the read-only calendar; mark on Closet and Today first run only; no empty Rediscover |
| UC-F12-02 | L: every route in the screen tree at AX5 (fontScale 3.571) in nb with Bold Text on, the ten onboarding steps, the selfie phases, `/looks/calendar`, `/profile/never` and `/profile/wear-more` included, then a second pass at AX3 (fontScale 2.643), plus a pass at xLarge in nb; sample closet plus one seeded owned piece with a recorded wear | Largest text (`large`, `ax`), Bold Text; choice cards one column, calendar as a day list, the Closet filter row still one scrolling row, the selfie camera phase without scrolling, greeting fallback, pinned Footer at most half the safe area at AX5 |
| UC-F12-03 | B: every route, the notification text in both languages | Bokmål; tab labels I dag, Garderobe, Samling; no "Bruk" outside wear |
| UC-F12-04 | O: Today forecast chip and Tomorrow's outfit, Clean background on confirm and edit, place lookup in onboarding and Profile (both ways) | Offline; everything else unchanged, the progress card and the selfie included |
| UC-F12-05 | I: cut-out editor, scan lift (fixture feed), Clean background, selfie countdown and measuring, "Use my location", relaunch after kill with jobs queued, Today generating across a tab switch | Interrupted (loading, generating, error); the selfie reopens at the camera phase when the tips were seen; progress card after relaunch |
| UC-F12-06 | R: splash and splash error, selfie arc and measuring, palette, tile preparing, the progress card, Another, a Rediscover tile, choice card, icon toggles, month change, the meter, cut-out select, group box snap, scan capture (fixture feed), Clean background | Reduce Motion; each resolves, the pulse stops after `loop` on usable screens |
| UC-F12-07 | V: the walk list above (real phone; English, nb-NO, and app language different from the phone's in both directions) | VoiceOver labels, voice, order, 44 pt, announcements, gesture actions, Large Content Viewer, state words in the app language |
| UC-F12-08 | P: place step and Profile Location with location denied, morning outfit with notifications denied, Today forecast with no place, return from Settings | Permission off; nothing asks on launch; the schedule is set on return without another tap |

## Notes for other roles

Open items only, by section name; settled ones are removed.

- `use-cases.md`: UC-F12-01 Expected reads "a designed empty state with one onward action; the A mark on Closet empty and Today first run only", with the calendar as the one read-only empty screen. UC-F12-02 targets AX5 with AX3 as a second pass: seven calendar columns up to `large`, a day list at `ax`, the Closet filter row still one scrolling row, the selfie camera phase without scrolling. UC-F12-04 and UC-F12-05: "Studio" is Clean background, "City lookup" is the place lookup (both ways), and offline shows `common.offline` from both. UC-F12-06 takes the moments in its row above.
- `architecture.md` > Principles, item 5: "marks every empty state" becomes "marks the empty Closet, Today first run and the done step". Screen tree `/closet` and Domain touches `captureProgress` drop the tab badge.
- `copy.md`: `progress.newOne` becomes "1 new piece, getting ready" / "1 nytt plagg gjøres klart" (`progress.readyOne` covers done). Bokmål `today.greeting.afternoon` becomes "Hei, {name}" and `afternoonPlain` "Hei"; "God ettermiddag, Fatima" is 369 pt against 343 pt, so most afternoons lost the name or the time of day, and "God dag" reads stiff. The Review log line that keeps "God ettermiddag" is superseded. Add `outfit.notForMeSkipped` ("Not for me, last outfit" / "Passer ikke, forrige antrekk"). Offline in the place step is `common.offline` from both paths; `place.notFound` only for no position. The F01 flow design additions table drops the retired `coverage.*.hint` rows (the descriptions replace them). The F04 tab badge paragraph and its Lane 1 open item go.
- `design-system.md`: Size and touch `faceCircle` takes the `ax` formula from L (Selfie), floor 120 pt. Type > Dynamic Type: "`ChipRow` `scroll` becomes `wrap`, except the Closet filter row", and the line caps are the Tile label below `large` and the progress card meta below `ax`. 15 EmptyState props: on Today first run the large title is the greeting. 18 ChoiceCard > Art upkeep: the re-render pass gives garment outlines at least 3:1 on `paper`, the three coverage cards at least. 20 MonthGrid at `ax`: the month title wraps and Previous and Next sit on their own line under it, as F09; no `lay` leading and no wear count or occasion meta on the day Rows. 12 Expander > Location search already follows F01 step 8.
- `motion.md` > Sheen (Loop limit), the `loop` token and Reduce Motion: replace "the band stands still" with the pulse as R words it. The Closet tab badge line goes.
- F01: Largest text row: AX5 `body` is about 61 pt (17 x 3.571), not 53; the camera phase never scrolls at `ax` (L, Selfie), so the reason line stays in view and "Choose a recent selfie" no longer scrolls under the circle. S4b Unavailable and Camera failed: Open Settings is `Button quiet small`, the camera-off recipe in P. Interrupted: a selfie left mid-countdown or mid-measuring reopens at the camera phase when the tips were seen in this session, at tips only on a fresh entry (I). `colours.library` follows the owner's answer.
- F04: the empty Closet with photos preparing shows the progress card alone, not a card above the EmptyState (E).
- F06: S1a is reached only by an updated install with no everyday style (E). Rediscover and the coverage line are not rendered without data; Today with no owned pieces after onboarding is the sample closet outfit, never S1b (rule 8). The Not for me word next to Undo is labelled `outfit.notForMeSkipped`. Save look's second tap opening the look is written down as intended (Owner questions).
- F11: the Location answer adopts F01 step 8: both choices visible from the first frame, the Field with `place.search` as placeholder and label (no `place.city`), one message slot under it, keyboard down after a failure, nothing above the Field moves. Its own note that keeps the expander layout is reversed.

## Owner questions

- Header items on an empty tab: hide `plus` on empty Closet and Looks, and `calendar` on Looks while no wear exists? Recommended: hide both. Profile already hides rows that are a door to nothing; empty Closet's `plus` repeats its one button, and the calendar opens an empty month. Kept for now, because the header never changing is the current rule.
- Keep "Choose a recent selfie" under the circle? Recommended: cut it. It is clutter under a screen that takes the photo itself, and Next on the colours step already skips the selfie. Kept, it is the only colours path for anyone who will not grant camera access. F01 owns the result; if kept, it joins the `ax` reserve (L) and the camera-off recipe (P).
- Add one tip Row to the selfie tips, "Tap the circle to take it yourself" / "Trykk på sirkelen for å ta bildet selv"? Recommended: yes. A plain tap on the circle is the only manual capture a sighted hand that cannot hold still can find, and the tips phase already exists, so the camera phase gains nothing.
- Like and Save look look alike on the title line but a second tap differs: Like undoes, the filled Save look opens the look. Recommended: keep the bookmark glyph, give the saved state the VoiceOver value "Saved" (`result.saved`) and state Open look as its action in F06, so the difference is intended and written down.

## Review log

- Preparing Banner sheen: one finding asked to keep the sheen on the Banner fill (stops after `loop`), another to drop it at 1.01:1. Dropped, because a band nobody can see only adds motion. The progress card that replaced the Banner has no band by design.
- Title-line actions and Row trailing values: measured fit uses the current language, not both, to match the B layout rule (the language switch re-renders in place, so cross-language measuring buys nothing).
- Camera denied: one recipe everywhere (P), the line, quiet small Open Settings, then Choose photos where a library path exists. The earlier split (Choose photos alone on scan, Open Settings alone on the selfie) made one denial look different per screen. Open Settings fixes the control, so it is not a second onward action (E).
- Still sheen band: replaced by the pulse (R). The pulse stops after `loop` on usable screens to keep WCAG 2.2.2, so past `loop` the busy primary, placeholders and preparing tiles rely on VoiceOver; R's purpose says so. Clean background got its visible `photo.cleanMaking` line because it can run long.
- Busy primary: no visible text added. The label never changes (`motion.md`), and saves are local and short, so the pulse and VoiceOver `busy` carry it.
- VoiceOver language: chose the native `UIApplication.shared.accessibilityLanguage` over passing the prop through every primitive, because one setter cannot be missed by a new component.
- Add pieces: named as the second exception rather than cut, because its source rows are the screen's content in F02 S1, not onward actions.
- Edit piece inline title: `piece.edit.title` ("Endre plagget" in `copy.md`) is kept rather than "Rediger plagg"; it is already a fixed string.
- Revision 1, Closet empty title: Closet empty now has `closet.firstTitle` under the mark, as `design-system.md` 15 and F04 set. Only Today first run has no title, because its greeting already sits there.
- Revision 1, header text items: they become icons at `large` (`design-system.md` 2) instead of keeping text at a fixed bar size; the Large Content Viewer still reads the word.
- Revision 1, `capture.gone.title`: the earlier proposal ("no longer here") is withdrawn. `architecture.md` shell rules and `copy.md` both say "This photo is no longer waiting", which is true for a photo that never reached the closet.
- Revision 1, permissions as their own section: location and notifications are new asks, and keeping each denial inside its own control with one Open Settings is the same rule as offline, so it reads as one more concern, not a new pattern.
- Revision 1, calendar with no action when empty: hand-off rule 5 covers screens without pieces, looks or a style; the calendar has all three missing only when Looks itself is empty, which already offers the way on. A "Go to Today" button was cut in `copy.md` as clutter.
- Revision 1, empty Closet with photos preparing: the card alone, not card plus EmptyState, so there is one door to Add pieces.
- Revision 2, largest text: the target is AX5 (fontScale 3.571), with AX3 as a second pass, because the brief asks for every Dynamic Type size and the pinned Footer, the feedback line and the card labels all grow again past AX3.
- Revision 2, place step: O, P and the sketch now follow F01 S3 step 8 as it stands (both choices from the first frame, the Field with `place.search` as placeholder, one slot under it, keyboard down). The earlier entry here described the expander version and is withdrawn; `place.city` is cut. Offline shows `common.offline` from both paths, because one cause gets one message; `place.notFound` is only for a phone that cannot get a position.
- Revision 2, Closet tab badge: reversed. The badge repeated the card's number on a second surface and was not asked for; the card is the one place progress shows. Owner question 2 is withdrawn.
- Revision 2, `colours.library`: the cut is now an Owner question. It is a content decision for F01, and it is the only colours path without camera access.
- Revision 2, large title: the JS `headerLargeTitleStyle` formula in `design-system.md` wins over a native `UIFontMetrics` font, because it is simpler and the hidden-layer greeting measurement uses the same number.
- Revision 2, Save look: F06 wins over the `design-system.md` toggle, so one Save look ships.
- Revision 2, Open Settings: `quiet small` everywhere, the selfie included, so one action has one weight.
- Declined, F11 note on missing round 2 sections: F11 already has the meter, I'll never wear, Trying to wear more of, the Morning outfit row and Location, and Most worn opens the calendar (F11 lines 10 and 25), as `architecture.md` item 11 sets.
- Revision 3, selfie at `ax`: the camera phase never scrolls; the circle gives way to the reserved reason line. The gap in the formula is `space.lg`, the gap F01 draws between circle and line, not `space.md` as the finding wrote.
- Revision 3, calendar at `ax`: L and the sketch follow F09 (date-only day Rows, headless Expander, month title wrapping with the chevrons under it).
- Revision 3, focus on selfie phases: the circle (camera, retake) or the season title (result), as F01; the camera phase has no title.
- Revision 3, Closet filter row: stays one scrolling row at `ax`, the one exception to wrap, as F04 asked.
- Revision 3, Today first run: kept, with its one path stated (an updated install with no everyday style). Cutting it would leave that install on an outfit the stylist cannot build.
- Revision 3, progress card: same content at every size; the meta keeps `progress.moreGroups` and is the second line cap.
- Revision 3, greeting: decided now, bokmål afternoon "Hei, {name}". "God dag" was proposed earlier and dropped as stiff.
- Revision 3, `outfit.notForMeSkipped`: bokmål starts with "Passer ikke", the visible word in `copy.md`, not "Ikke for meg" as the finding wrote, so the visible word stays first.
- Revision 3, circle tap tip: asked, not added, because it adds words to a screen the owner wants calm.
- Revision 3, new infrastructure: the text size hook, the hyphenator and the VoiceOver language module are listed in `architecture.md` > Dependencies and native work; this file keeps only the rules that use them.
- Declined, coverage plain chip key: `design-system.md` 18 already names it `coverage.noPreference`, so no note is sent.
- Declined, notes on Save look in `design-system.md`, the Profile meter role, calendar day counts, `closet.notWornLately`, the radio fallback and F11 `stats.pieces`: already settled in those files, so the notes are removed.
