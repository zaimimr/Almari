# F12 App-wide checks

Date: 2026-10-03. Flow design (UX, UI, motion, copy). Routes: every route in the screen tree. Inputs: `architecture.md` (F12 row, shell rules, hand-off rules, Magic moments, Owner decisions), `use-cases.md` UC-F12-01 to UC-F12-07, `design-system.md`, `motion.md`, `copy.md` (F12 App-wide and each flow table), the flow docs in `flows/`. Before: `screens/before/today-empty.png`, `tab-closet.png`, `tab-profile.png`, `capture-index.png`, `cutout.png`.

F12 has no screen of its own. It sets the rules every other flow doc must follow for seven concerns: empty closet, largest text, bokmål, offline, interrupted magic moments, Reduce Motion and VoiceOver. A flow doc may be stricter, never looser. Where a flow doc and this file disagree, this file wins and the flow doc is fixed.

What changes from the before screens: empty states lose their paragraphs (`today-empty.png` had a title, three lines of body and a footnote), no screen goes blank or grey while something loads, and no state adds a banner, toast or sheet beyond the ones the flow docs already define. Every state below lives inside a component that is already on the screen.

## Screens

### Screen families

Every route belongs to one family. The family decides how the concerns look.

| Family | Routes | Recipe (`design-system.md`) | Primary action |
|---|---|---|---|
| Tab root | `/(tabs)/today`, `/(tabs)/closet`, `/(tabs)/looks` | Today, Tab root | Today: Footer "Wear this". Closet: none; Closet select: Footer pair (New look, Start with these), Waiting until a selection (F04). Looks: none. The EmptyState button when empty |
| Detail | `/piece/[id]`, `/look/[id]`, `/profile` | Detail | Footer primary of the flow (piece: Start with this piece; look: Show on Today). Profile: none |
| Editor | `/piece/new`, `/piece/edit/[id]`, `/look/build`, `/profile/style`, `/profile/answer/[step]`, `/today/adjust`, `/today/pieces`, `/onboarding` | Editor | Footer commit, rendered disabled from the first frame |
| Capture list | `/capture`, `/capture/[id]`, `/capture/group/[id]` | Tab root shape on a push (grid), Editor (confirm) | Footer "Add N pieces" / "Looks right" |
| Media | `/capture/scan`, `/cutout/[id]`, `/onboarding/colours`, `/label/[id]` | Media | Footer of the flow (Done, Save) |
| Gate | splash overlay | Splash (`motion.md`) | none |

Layout rule for every family, top to bottom: `Screen` header (native) / content in `Section`s / `Footer` (a flex sibling, never floating). F12 states replace content inside this order. They never add a layer on top, never move the header, never move the Footer.

### E. Empty closet (UC-F12-01)

Purpose: no screen is ever blank; each one names the next flow and links to it (hand-off rule 5).

`EmptyState` in the upper third when a whole region is empty: one action, title in Georgia, no line unless the title cannot say what happens. When the screen keeps its structure (Today S1b, Profile stats), the empty slot is a `Row` with one action instead. The scarf A mark (on `tile.png`) appears only on Closet empty and Today first run, as `design-system.md` 15 sets, and both use the same shape: mark plus one primary, no title, because the native large title already names the screen. Every other EmptyState is title plus action. Where the screen has a Footer, the EmptyState button is `secondary` small and the Footer keeps its own primary (or waits).

| Screen | Family | What shows | Action | Goes to |
|---|---|---|---|---|
| Today, onboarding skipped | Tab root | Mark, no title. Primary `today.firstRun.style` with `accessibilityHint` `today.firstRun.styleHint` (VoiceOver only), quiet `sample.try`. No context row, no Footer | Set your style | F11 `/profile/style` |
| Today, style set, My clothes empty | Tab root | F06 S1b: dashed empty slots in the FlatLay, then the problem `Row` with trailing `closet.addPieces` under them as the one action. The Section "Start with" is not rendered, because it only leads to the empty `pieces.none` screen. Footer waits | Add pieces | F02 |
| Closet | Tab root | Mark, no title, primary `closet.addPieces`. Search, filters and Select are not rendered. Header `plus` stays, because the header never changes between empty and full | Add pieces | F02 |
| Looks | Tab root | No pieces: `pieces.none`, primary `closet.addPieces`. Pieces, no looks: `looksTab.emptyTitle`, primary `looks.new`. Header `plus` stays for now (Owner questions) | Add pieces / New look | F02 / F10 |
| Start with a piece | Editor | `pieces.none`, secondary `closet.addPieces`. Footer "Start with these" disabled | Add pieces | F02, pops back here |
| Build a look | Editor | Strip region: `closet.firstTitle`, secondary `closet.addPieces`. Collage keeps its dashed slots. Fill the rest not rendered. Footer "Save look" disabled | Add pieces | F02, pops back here |
| Add pieces | Capture list | F02 S1 as it always is: tip cards on first open, then the Source rows `capture.takePhotos`, `capture.choosePhotos`, `capture.scan`, quiet `capture.byHand`. Select is not rendered | Take photos | F02 |
| Profile, Closet stats | Detail | Only one `Row` `closet.addPieces` with a chevron under the Section title, pushing `/capture`. Pieces, Never worn and Most worn are not rendered: with no pieces each is a statistic about nothing or a door to nothing. No Section action | Add pieces | F02, ends on Closet |

```
 Closet (empty)                   Today (onboarding skipped)
┌─────────────────────────────┐  ┌─────────────────────────────┐
│ Closet                   +  │  │ Today                   (o) │
│                             │  │                             │
│          ┌──────┐           │  │          ┌──────┐           │
│          │  A   │           │  │          │  A   │           │  scarf A on
│          └──────┘           │  │          └──────┘           │  the plum tile
│                             │  │                             │
│ [       Add pieces       ]  │  │ [     Set your style     ]  │  primary
│                             │  │    Try the sample closet    │  quiet
│                             │  │                             │
│                             │  │                             │
├─────────────────────────────┤  ├─────────────────────────────┤
│  Today    Closet    Looks   │  │  Today    Closet    Looks   │  native tabs
└─────────────────────────────┘  └─────────────────────────────┘

 Profile, Closet stats with no pieces
│ Closet stats                     │  Section title
│ Add pieces                     > │  Row, chevron, pushes /capture
```

Primary action: the EmptyState button, or the one action Row. One onward action per empty state, with two exceptions: Today first run keeps its sample escape as a quiet second, and Add pieces shows its source list, because choosing a source is that screen's job (F02 S1, Take photos first, Add by hand quiet).

### L. Largest text (UC-F12-02)

Purpose: every route works at AX3 (fontScale 2.643) with nothing clipped, nothing overlapping and the commit always reachable.

One hook, `useLargeText()`, gives `large` (fontScale 1.35 and up) and `ax` (1.6 and up). Every rule below keys off it; no screen picks its own threshold.

Every family, at `large`:

- Footer pair stacks, secondary above.
- Row trailing values, Expander values and Section title-line actions move under the title.
- Banner and Expander actions stack.
- `Segmented` becomes a vertical list of `Row`s.
- Tile labels lose their 2-line cap.
- Header items (Edit, Select, Done, Cancel) and inline titles keep their text at the fixed bar size and are read through the Large Content Viewer. Native bar items get it from UIKit; a shared header item built as a React view sets `accessibilityShowsLargeContentViewer` and `accessibilityLargeContentTitle`.
- Below `large`, a trailing value or action also moves under the title as soon as the longest label the slot can show in the current language, at the current weight, does not fit on the line (B layout rule).
- Segmented-as-Rows keep the `radio` role, `accessibilityState.selected` and the "{option}, {group label}" label. Strip Rows keep `selected` and the Keep Chip state. Semantics never change with text size.

Every family, at `ax`: only the Footer primary stays pinned; the secondary becomes a quiet Button at the end of the scroll content. `ChipRow scroll` becomes `wrap`. `Tile` grids go to one column. Strips (Change strip, picker strip, builder strip) become `Row` lists with `thumb` leading and `selected` trailing.

| Family | At `large` | At `ax` |
|---|---|---|
| Tab root | Large title in Georgia, built natively with `UIFontMetrics(forTextStyle: .largeTitle).scaledFont(for: Georgia 34, maximumPointSize: 60)`, never a fixed `fontSize` in `headerLargeTitleStyle`. Tab labels do not grow; long press shows them in the Large Content Viewer | Today: quiet row is three full-width `Row`s. Closet: one column of tiles, filters wrap. Looks: rows keep the 72 pt lay leading, meta wraps |
| Detail | The title is the content `title` Text under the hero (the Detail recipe has no visible bar title); it caps at 2.0x and wraps. Fact chips wrap inside their capsule | Hero stays full width; the planned mark leaves the photo for the line under it |
| Editor | Field grows with its line height. Segmented as Rows | Builder and picker scroll as one column (F10). Footer commit stays pinned and grows. While the keyboard is open the Footer does not ride it: it stays at the bottom under the keyboard and returns when the keyboard closes, so the focused Field and its label keep the space |
| Capture list | Tile meta and colour line wrap | Grid is one column. The tile colour line stays its own 44 pt control under the photo |
| Media | Guide pill and readout stay on the photo with `mark` capped at 1.4x | Guide pill and readout leave the photo for the controls area under the frame, uncapped `subhead` `onMedia` on `ink`. The frame keeps at least 40 percent of the safe area height; past that, the controls area scrolls, with the shutter pinned, centred and at its distance from the bottom safe area. Text never overlaps the shutter |
| Empty and gone | Title wraps, button shows its full label | Same; the mark keeps its size |

Checks per route: the ScrollView bottom inset is the measured Footer height plus `space.footerInset`, so the last block always scrolls clear of the Footer. Nothing truncates; the only line cap in the app is the Tile label below `large`. Native inline titles are fixed strings, never user content (Edit piece is `piece.edit.title`, the piece name lives in the content). Lane 1 device checks on a 375x667 phone:

- The longest bokmål inline titles ("Start med et plagg", "Enheter og by", "Endre plagget") fit beside the back button and one trailing item; any that do not are shortened in `copy.md`.
- The Georgia large title grows from default to AX3 and "Garderobe" and "Samling" fit at 60 pt.
- In nb at xLarge, "Garderoben i tall" plus "Legg til plagg" moves the action under the title before paint.
- Edit piece name entry at AX3 with the keyboard open: the Field and its label stay visible.
- "Kameraet er ikke tilgjengelig" at AX3.

```
 Edit piece at AX3
┌─────────────────────────────┐
│ Cancel       Edit piece     │  text items, fixed bar size
│ Category                    │
│ ( Tops  ) ( Kurtas )        │  ChipRow wraps
│ ( Hijabs ) ( Dresses )      │
│ Style                       │
│ Desi                     ✓  │  Segmented as Rows
│ ───────────────────────────│
│ Western                     │
│ ───────────────────────────│
│ Both                        │
│            ...              │  scrolls
├─────────────────────────────┤
│ ┌─────────────────────────┐ │
│ │          Save           │ │  one pinned button,
│ │         changes         │ │  label wraps, it grows
│ └─────────────────────────┘ │
└─────────────────────────────┘
```

### B. Bokmål (UC-F12-03)

Purpose: the app reads as written in Norwegian, with no truncated label and one word per concept.

| Family | Rule |
|---|---|
| All | Every word comes from the `copy.md` glossary. "Bruk" means wear and nothing else; picking an alternative is "Velg". Copy keys hold no soft hyphens; the shared `Text` adds them at render time in `nb` for words of 12 or more characters, user names included, from the TeX `hyph-nb` Liang patterns, and tests match on `testID` or on strings with hyphens stripped. Dates from `Intl.DateTimeFormat` with the app locale ("lør. 11. okt."). Never nynorsk |
| VoiceOver language | The app language is set natively once on `UIApplication.shared.accessibilityLanguage` ("nb-NO" or "en") through a small Expo module, at launch and on every language switch, so every element is spoken with the voice of the app language whatever the phone's language. A parent view's `accessibilityLanguage` does not reach its children on iOS, so no screen relies on it. Elements that speak another language set their own (F11 Language Rows) |
| Tab root | Tabs `I dag`, `Garderobe`, `Samling`. Samling holds looks; Antrekk is only the outfit on Today. Large titles fit at 60 pt on a 375 pt phone (Lane 1 device check) |
| Today | Footer pair `Bruk i dag` / `Sammenlign hijaber` stacks when either wraps. Quiet row measures its three labels at the Bold Text width and becomes a vertical list when any label is wider than its third ("Passer ikke" leaves 2 pt on a 375 pt phone) |
| Editor | Segmented switches to its vertical list when any label would wrap (`Eksempelgarderobe` / `Mine klær`). Footer labels wrap, never truncate |
| Capture list and Detail | Tile `mark` strings fit 9 characters ("fre."); the abbreviation is visual only, and the VoiceOver label uses `weekday: 'long'`, `month: 'long'` ("fredag", "lørdag 11. oktober"). Fact chips read "Farge: salvie, gjettet" in VoiceOver |
| Media | Guide pill strings are the `scan.status.*` and `selfie.guide.*` values; one phrase "Hold stille" in both |
| Language switch | Profile re-renders in place; the user stays on Profile (F11). The native `accessibilityLanguage` updates in the same tick |

Layout rule: every label sits in a wrapping container with `minHeight`, never a fixed width or height, and any row that picks horizontal or vertical layout measures the longest label the slot can show in the current language (for example Save look and Open look) at the current weight before it paints, so a crossfade never changes the layout. Weight comes from `AccessibilityInfo.isBoldTextEnabled`, and the row measures again on `boldTextChanged`.

### O. Offline (UC-F12-04)

Purpose: only the features that use the network change state, each inside its own control. Everything else works as usual.

The network features are the ones the privacy line names (`settings.privacy`): the city and forecast (Apple) and Clean background (Cloudflare). Nothing else changes offline. There is no app-wide offline banner, no greyed screen and no queued request.

| Feature | Where | Offline state | Way out |
|---|---|---|---|
| Forecast | Today context row, Adjust Weather | Chip reads `weather.unavailable`, no Apple Weather mark. VoiceOver: role button, label "Weather: unavailable" / "Vær: utilgjengelig" (the fact chip key pattern), chevron hidden. The outfit is styled from local data | Tapping the chip still opens Adjust Weather, where the manual bands work. Foreground or pull to refresh fetches again |
| City lookup | Onboarding step 2, Profile > Units and city | `Field` error `common.offline` directly under the city field. It is a different line from `onboarding.city.notFound` | "Find city" again; Skip (onboarding) or Cancel (answer) |
| Clean background | Capture confirm, Edit piece | The chip returns unselected with the `quick` crossfade; `footnote` `error` `common.offline` under the chip row, announced (shared announcement rule) with focus kept on the chip, then `common.tryAgain` as a `Button quiet small` (minHeight 44) on its own line under the footnote. The photo is unchanged | Try again, or keep any other photo chip |
| Apple Weather data sources | Mark next to the forecast chip | Not shown offline (no forecast, no mark) | n/a |

```
 Today offline
│ ( Everyday v ) ( Both v )        │  context ChipRow
│ ( Weather unavailable  > )       │  no Apple mark
│ ┌─────────────────────────────┐  │
│ │       outfit FlatLay        │  │  styled from the phone
```

### I. Interrupted magic moments (UC-F12-05)

Purpose: leaving mid-moment never leaves a stuck shimmer, a half-saved piece, a duplicate job or a late result on a gone screen.

Two kinds of work, two rules:

1. **Closet work keeps running.** Capture preparation and a Clean background request belong to the closet, not the screen. Leaving does not cancel them, and returning shows them where they are. They are created once; returning never starts a second request.
2. **Screen work stops.** The cut-out mask load, the hold-to-select, the box snap, the selfie measuring and every animation belong to the screen. Leaving cancels them, cancels their shared values and guards their callbacks, so no state update runs on an unmounted screen.

| Moment | Leave and return | Shows on return |
|---|---|---|
| Cut-out editor loading | Load cancelled. Nothing is saved to the mask | The editor opens fresh: photo or placeholder, then `sheen` while the mask loads |
| Cut-out hold to select | Ring and sweep dropped | The last saved mask, no outline |
| Group "Use this box" | Selection dropped; the box stays as drawn | The row list as it was before the tap |
| Scan, back during the lift | The lift is dropped, never replayed. A capture that fired is one job, created once, and follows F03's back behaviour | No sticker on screen, no duplicate thumbnail |
| Clean background | Request keeps running | Still running: the chip selected with `accessibilityState.busy` (Chip busy, `design-system.md` 7), `footnote` `inkMuted` `photo.cleanMaking` under the chip row, `sheen` over the photo. Done while away: the new photo is already in place with the chip selected, no crossfade replay. Failed while away: the original photo, `common.offline` or `photo.cleanFailed` as a `footnote` `error` under the chip row, with quiet `common.tryAgain` as in O, announced once when the screen regains focus, focus kept where it was |
| Selfie "Measuring your colours" | Measuring dropped. The temp selfie is deleted. The onboarding step is unchanged; no result or error lands on it | Reopening the colours screen starts at the camera |
| App killed during preparation | Jobs resume once each on relaunch | Closet: the F04 Preparing Banner, notice `closet.preparingOne` / `closet.preparingMany` with secondary `common.open` (`control.small` 44, pushes `/capture`), text crossfading to `closet.readyOne` / `closet.readyMany` when jobs finish. No sheen on the Banner. Add pieces shows the preparing `sheen` on the tiles. A job that cannot finish shows `capture.stateFailed` with `capture.retake` |
| Today generating (tab switch or push mid-arrange) | The stylist result still lands in the store; the sheen loop stops on blur | The new outfit in place, no swap replay. When Today regains focus with a new outfit, `today.announce.outfit` is announced once, queued, and focus stays where it was |
| Committing button (save mid-write) | The write finishes | The saved data. The ResultBar is not shown on a later visit |
| Splash drape (app backgrounded) | Hand-off still happens at drape end | Warm return goes straight to the screen; nothing replays |

```
 Closet after relaunch with jobs pending
│ Closet                       +  │
│ ┌─────────────────────────────┐ │
│ │ 3 preparing                 │ │  F04 Preparing Banner
│ │ [ Open ]                    │ │  secondary small, pushes /capture
│ └─────────────────────────────┘ │
│ ( All )( Not worn lately )(More)│
│ ┌──────┐ ┌──────┐               │
```

### R. Reduce Motion (UC-F12-06)

Purpose: every moment still resolves, with fades only. While a wait runs, the band pulses in place so it can be seen. Where the band is faint on its host (busy primary Button, Clean background over a light photo, placeholders), visible text carries the wait where the host has text (Clean background `photo.cleanMaking`); elsewhere, and past `loop`, the dependable cue is VoiceOver (`accessibilityState.busy`, `busyLabel`, the host's label).

The `useReduceMotion()` hook (JS) and `UIAccessibility.isReduceMotionEnabled` (native editor) are read live, so a change in Settings applies without a restart. A moment that is running when the setting changes continues from its current values on the reduced path: travel jumps to its end, opacity finishes as a `base` fade.

The pulse: the band does not stand still. It fades in place by opacity only, with no travel, from 0 to the host's peak over `sheen` and back, `wait` between. It runs under Reduce Motion in place of the still band, and on any host after `loop` in place of the travelling pass. It stops after `loop` on a screen that is otherwise usable (WCAG 2.2.2) and fades out (`base`); full-screen waits (the editor mask load) keep it until resolve. This is the one loop `motion.md` principle 7 allows.

| Family | Under Reduce Motion |
|---|---|
| All | Push and pop stay native. Inline expand and collapse: layout in one frame, content fades (`base`). List insert and remove: fade, no stagger, neighbours move in one frame. Selection fills and `press` unchanged. Every sheen host (tiles, buttons, selfie, Today and builder flat lay arranging, Clean background over the photo, the Detail hero) pulses after `wait`; every placeholder stays still (Today lay, Looks rows, forecast chip included). Every `scrollTo`, `scrollToIndex` and `scrollToOffset` passes `animated: !reduceMotion`. Segmented thumb crossfades (`base`). `lift` shadow and Expander chevron jump. `progress` fill jumps |
| Tab root | Today: changed slots crossfade in place (`base`), no travel, no stagger. Closet: placeholders still, new tiles fade in |
| Detail and Editor | Builder Fill the rest crossfades. Busy Buttons pulse after `wait`, label unchanged; a busy primary uses the `motion.md` Sheen peak for plum. Secondary, quiet and destructive keep their peaks. Clean background: the chip keeps its selected and busy look and `photo.cleanMaking` shows as a `footnote` `inkMuted` line under the chip row |
| Capture list | Preparing tiles pulse; ready content fades in (`base`) |
| Media | Cut-out: ring fades in, mask and dim at once, outline fades in, holds `wait`, fades out. Group box: crossfade from drawn to snapped frame. Scan: outline fades in once; moves only past 8 pt, at most once per `dwell`, as a crossfade (old out `quick`, new in `base`); sticker fades in, holds `wait`, fades out while the tray thumb fades in. Selfie: pulse over the photo |
| Gate | Mark fades in (`base`), hand-off at the end of the fade, overlay fades out (`base`) |

Each reduced path still exposes its in-progress `testID` (`moment-loading`, `moment-generating`, `moment-selecting`, `moment-found`) while the work runs, and resolves to the same result `testID`.

### V. VoiceOver walk (UC-F12-07)

Real phone, checklist. Not a magic moment and not a new screen. Run three times: English phone with the app in English, nb-NO phone with the app in bokmål, and English phone with the app in Norsk bokmål (then the reverse, nb-NO phone with the app in English).

Screens to walk:

- Onboarding, every step.
- Today and Today first run, Change strip.
- Closet empty and Closet select.
- Add pieces with preparing tiles and the tile colour line control.
- Group box resize.
- Edit piece: Segmented radios, ChipRow wrap, Clean background offline.
- Builder.
- Cut-out editor (hold to select through `cutout.selectPiece` / `cutout.selectPieceN`).
- Scan capture and selfie.
- Profile language switch.

What must hold:

- Every control is reachable in reading order with a label, spoken with the voice of the app language.
- Radio role and position read correctly in bokmål (`design-system.md`, shared rules).
- 44 pt targets everywhere.
- Header items show the Large Content Viewer on long press at `large`.
- Outfit changes announce once (`today.announce.outfit`).
- Focus stays after an in-place change and never jumps to the top.
- No exiting copy is reachable (`design-system.md`, Accessibility rules; `motion.md`, VoiceOver during motion).

## States

The full matrix. A cell names the family rule above; "n/a" means the state cannot occur there.

| State | Tab root | Detail | Editor | Capture list | Media |
|---|---|---|---|---|---|
| Empty | EmptyState, mark on Closet and Today first run only (E) | Profile stats: one Add pieces Row (E). Piece and look always have content | EmptyState in the strip or body, Footer disabled (E) | F02 S1 source rows (E) | n/a |
| Loading | `Silk placeholder` in the target's shape; one `common.loading` per region | Hero placeholder; late images fade in | Strip tile placeholders | Tile `sheen` while preparing | Ink frame until the feed is live; editor photo then `sheen` |
| Generating | Today and builder flat lay: current pieces stay, `sheen` after `wait`, changed slots swap | n/a | Builder Fill the rest | Preparing tiles, Clean background | Box snap, care label reading |
| Error | Inline next to the control (`common.error.*`), announced. Closet cannot open: `start.error.title` with `common.tryAgain` at the gate | Same | `Field` error or `footnote` above the Footer | Failed tile with Retake | `colours.cameraFailed`, `scan.unavailable` in the frame |
| Offline | Today forecast chip (O) | No change | Profile > Units and city, Edit piece Clean background (O) | Confirm Clean background (O) | No change |
| Permission denied | n/a | n/a | n/a | n/a | `CameraFrame` unavailable: EmptyState title `common.cameraOff`, one action `capture.choosePhotos` (`colours.library` on the selfie). The shutter is not rendered; its height stays reserved so the frame does not resize if access returns |
| Interrupted | Today generating, Closet pending jobs (I) | Save mid-write (I) | Save mid-write (I) | Preparation, Clean background (I) | Editor, box snap, scan lift, selfie (I) |
| First run | Today first run; Closet and Looks empty (E) | Profile with nothing answered: `profile.notAnswered` values | Your style opened from Today first run | Tip cards on the first empty open | Cut-out hint `cutout.hold` until first use |
| Gone | n/a | `Screen gone` with `common.goBack`, pops | Same | `capture.gone.title`, `capture.group.gone` with Go back | `/cutout` and `/label` gone line under their own header |
| Largest text | L | L | L | L | L |
| Bold Text | Measured layouts use the bold width (B layout rule) | Same | Same | Same | Same |
| Increase Contrast | `design-system.md` swaps: `blushStrong`, `inkMuted` to `ink`, `line` to `lineField`, placeholder edge | Same | Same | Same | Same; `onMedia` text unchanged |
| Bokmål | B | B | B | B | B |
| Reduce Motion | R | R | R | R | R |

## Motion

All names are `motion.md` tokens and transitions. F12 adds one motion, the sheen pulse (R); otherwise it fixes which motion each concern uses.

- **Empty states.** The EmptyState is there in the first frame of the screen: no entrance, the mark is still (`motion.md`, Loading). The first piece reaches Closet while `/capture` is on top, so the swap from empty to full happens before the pop reveals Closet: Search, the ChipRow, Select and the grid are in place on Closet's first visible frame, and only the new tiles fade in (F04, Arrive after Add pieces).
- **Loading.** `Silk placeholder` at once with the final size, band only after `wait`, resolve with content fading in (`base`, `silk`) and the band fading out (`quick`). One sheen clock per screen; the travelling pass stops after `loop` on a usable screen and on blur.
- **Offline.** No motion of its own. The forecast chip resolves from its placeholder to `weather.unavailable` with the Loading resolve. The Clean background chip returns with the `Selection` crossfade (`quick`, `silk`) and its error line enters with `Inline expand`.
- **Interrupted.** Every moment cancels its shared values on unmount and guards its callbacks (`motion.md`, Testing notes). Returning never replays a moment that finished while away: the result is in place on the first frame, like any pushed screen (`Push and pop`). A moment still running on return shows its current frame (sheen band on its clock), never restarts from zero.
- **Largest text.** No layout animates because of text size. A Footer pair that stacks or a quiet row that becomes Rows is laid out from measured labels before it paints (`Banners and bars`), so it never shows side by side and then jumps.
- **Bokmål.** The language switch on Profile re-renders in place with no transition. Label crossfades measure both labels of the current language and hold `minHeight` (`Banners and bars`).
- **Reduce Motion.** As R above; every reduced fade passes `ReduceMotion.Never` so the fade is not lost.
- **Haptics.** Unchanged by any F12 state. Offline, empty and interrupted states fire none.

## Copy

One new key (`today.firstRun.styleHint`, added to `copy.md`); one value change proposed (Gone row, see Notes).

| Where | Key | English | Bokmål |
|---|---|---|---|
| Loading region (VoiceOver) | `common.loading` | Loading | Laster |
| Today first run | `today.firstRun.style`, `sample.try` | Set your style, Try the sample closet | Velg stilen din, Prøv eksempelgarderoben |
| Today first run hint (VoiceOver) | `today.firstRun.styleHint` | Needed before your first outfit | Trengs før det første antrekket |
| Closet empty | `closet.addPieces` | Add pieces | Legg til plagg |
| Builder strip empty | `closet.firstTitle`, `closet.addPieces` | Your first piece, Add pieces | Ditt første plagg, Legg til plagg |
| Looks empty | `looksTab.emptyTitle`, `looks.new` | No looks yet, New look | Ingen looker ennå, Ny look |
| Looks and Start with a piece, no pieces | `pieces.none` | No pieces yet | Ingen plagg ennå |
| Add pieces empty | `capture.takePhotos`, `capture.choosePhotos`, `capture.scan`, `capture.byHand` | Take photos, Choose photos, Scan, Add by hand | Ta bilder, Velg bilder, Skann, Legg til manuelt |
| Profile stats empty | `closet.addPieces` | Add pieces | Legg til plagg |
| Offline, city and Clean background | `common.offline` | You are offline | Du er uten nett |
| City not found (distinct from offline) | `onboarding.city.notFound` | City not found | Fant ikke byen |
| Offline forecast | `weather.unavailable` | Weather unavailable | Ingen værmelding |
| Clean background running | `photo.cleanMaking` | Cleaning the background | Renser bakgrunnen |
| Clean background failed | `photo.cleanFailed` | Could not clean the background | Kunne ikke rense bakgrunnen |
| Retry | `common.tryAgain` | Try again | Prøv igjen |
| Pending after relaunch | `closet.preparingOne`, `closet.preparingMany` | 1 preparing, {count} preparing | 1 klargjøres, {count} klargjøres |
| Job that cannot finish | `capture.stateFailed`, `capture.retake` | Could not finish, Retake | Ble ikke ferdig, Ta på nytt |
| Closet cannot open | `start.error.title` | Could not open your closet | Kunne ikke åpne garderoben |
| Gone | `common.goBack`, `capture.gone.title` (proposed value), `look.goneTitle` | Go back, This photo is no longer here, This look is no longer here | Gå tilbake, Dette bildet er ikke her lenger, Denne looken er ikke her lenger |
| Camera denied | `common.cameraOff`, `capture.choosePhotos` | Camera access is off, Choose photos | Kameratilgang er av, Velg bilder |
| Tabs | `nav.today`, `nav.closet`, `nav.looks` | Today, Closet, Looks | I dag, Garderobe, Samling |
| Outfit arrived (announced) | `today.announce.outfit` | New outfit: {name} | Nytt antrekk: {name} |

## Use cases

| ID | Screens | States |
|---|---|---|
| UC-F12-01 | E: Today first run, then Today S1b after Your style; Closet; Looks (no pieces, and pieces with no looks); Start with a piece (from Today S1b "Start with"); Build a look; Add pieces; Profile Closet stats | Empty, first run. Every screen has one onward action except Today first run and Add pieces; mark on Closet and Today only, no title beside it |
| UC-F12-02 | L: every route in the screen tree at AX3 (fontScale 2.643) in nb with Bold Text on, plus a pass at xLarge in nb; sample closet plus one seeded owned piece | Largest text (`large`, `ax`), Bold Text |
| UC-F12-03 | B: every route | Bokmål; tab labels I dag, Garderobe, Samling |
| UC-F12-04 | O: Today forecast chip, Clean background on confirm and edit, city lookup in onboarding and Profile | Offline; everything else unchanged |
| UC-F12-05 | I: cut-out editor, scan lift (fixture feed), Clean background, selfie measuring, relaunch after kill, Today generating across a tab switch | Interrupted (loading, generating, error); pending work on Closet |
| UC-F12-06 | R: splash, selfie measuring, tile preparing, Another, cut-out select, group box snap, scan capture (fixture feed), Clean background | Reduce Motion; each resolves, the pulse stops after `loop` on usable screens |
| UC-F12-07 | V: onboarding, Today, Today first run, Change strip, Closet empty, Closet select, Add pieces with preparing tiles and the colour line, group box resize, Edit piece, builder, cut-out editor, scan capture, selfie, Profile language switch (real phone; English, nb-NO, and app language different from the phone's in both directions) | VoiceOver labels, voice, order, 44 pt, announcements, gesture actions, Large Content Viewer |

## Notes for other roles

- UC-F12-01 says "the A mark" on every empty state. `design-system.md` 15 limits the mark to Closet empty and Today first run (ivory `#F4EDE3` on white is 1.16:1, and a mark on every empty screen is clutter). This file follows the design system. The architect should change the UC-F12-01 Expected text to "a designed empty state with one onward action; the A mark on Closet and Today first run", and UC-F09-01 step 1 to drop the mark.
- Architect: `use-cases.md` UC-F12-02 and UC-F12-07 should take the Screens and States from the Use cases table above (AX3 in nb with Bold Text plus xLarge in nb; the added walk screens and the mixed-language runs).
- UC-F12-03 still points at open question 7. It is settled: the tab is Samling (`copy.md`). The row can drop the reference.
- F06 S1b: when My clothes is empty, the Section "Start with" is not rendered; the problem Row's `closet.addPieces` is the one action and the Footer waits (E).
- F11 "Empty, no pieces": updated to render only the Add pieces Row (E). F11's VoiceOver language now points at the B rule.
- F04 "Preparing" and its Motion row: drop the `Silk` sheen on the Banner fill. The band (`#FAF8F3`) on `surface` (`#FBF9F7`) is 1.01:1 and signals nothing; the text and `accessibilityState.busy` carry the state.
- `motion.md` Sheen (Loop limit, Reduce Motion) and Loading (Reduce Motion): replace "the band stands still at its centre" with the pulse from R. Principle 7 already names it as the one allowed loop.
- `design-system.md` 13 Banner: remove "forecast unavailable" from the notice uses. Offline forecast lives in the chip only (O).
- `design-system.md` 15 EmptyState: `title` is optional when `mark` is shown (Today first run, Closet empty), with the mark hidden from VoiceOver. VoiceOver gets the screen name from the native large title.
- `design-system.md` Screen, keyboard open: add the `ax` exception from L (the Footer stays under the keyboard).
- `design-system.md` 17 CameraFrame unavailable: the shutter is not rendered, its height reserved.
- UX writer: `capture.gone.title` should follow `look.goneTitle`: "This photo is no longer here" / "Dette bildet er ikke her lenger", so every gone state reads the same.

## Owner questions

- Closet and Looks header `plus` while the EmptyState shows. Recommended: hide it. On Looks with no pieces it leads to an empty builder that sends you back to Add pieces, and on Closet it duplicates the one primary. Kept for now, because the header never changing is the current rule.

## Review log

- Preparing Banner sheen: one finding asked to keep the sheen on the Banner fill (stops after `loop`), another to drop it at 1.01:1. Dropped, because a band nobody can see only adds motion.
- Title-line actions and Row trailing values: measured fit uses the current language, not both, to match the B layout rule (the language switch re-renders in place, so cross-language measuring buys nothing).
- Camera denied, Open Settings: not added. It would need `design-system.md` 17 to change first and E's exception list to take it as a quiet second; that is an owner decision.
- Still sheen band: replaced by the pulse (R). The pulse stops after `loop` on usable screens to keep WCAG 2.2.2, so past `loop` the busy primary, placeholders and preparing tiles rely on VoiceOver; R's purpose says so. Clean background got its visible `photo.cleanMaking` line because it can run long.
- Busy primary: no visible text added. The label never changes (`motion.md`), and saves are local and short, so the pulse and VoiceOver `busy` carry it.
- VoiceOver language: chose the native `UIApplication.shared.accessibilityLanguage` over passing the prop through every primitive, because one setter cannot be missed by a new component.
- Add pieces: named as the second exception rather than cut, because its source rows are the screen's content in F02 S1, not onward actions.
- Edit piece inline title: `piece.edit.title` ("Endre plagget" in `copy.md`) is kept rather than "Rediger plagg"; it is already a fixed string.
