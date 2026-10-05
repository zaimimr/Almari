# QA: Looks, planning, calendar, notifications, accessibility

Simulator: Almari QA 5, build 0.1.14 (17). Seeds: seed-looks-clean, seed-looks, seed-wears. Screens in `docs/qa/screens/looks/`.

## 1. Bugs

**1. Show on Today quietly swaps in a different outfit (broken)**
- Repro: Looks > Work blouse (no shoes) or Eid lunch > Show on Today.
- Actual: Today opens with the generated outfit, not the look. In the DB the revision goes up, but pieceIds go back to the generated set and previousPieceIds is null. The occasion stays Everyday. A complete everyday look (Tunic) works.
- Expected: Today shows the exact look, with its occasion.
- Source: `src/features/today/useToday.ts:378-390`. `evaluateOutfit` flags "missing" problems (addShoes, addMain...), `stale` becomes true and `restyle(startOver)` replaces the look. `applyLook` also never sets the occasion.
- Fix: mark user-applied looks (from showOnToday or a planned look) and skip the stale auto-restyle for them. Use a soft "No shoes in this look" note instead. Set the occasion to the look's occasion in applyLook.
- Screen: `show-on-today-replaced.png`

**2. Editing a look loses its custom name (wrong)**
- Repro: Office navy > Change > deselect Sage blouse > select it again > Save changes.
- Actual: the look is renamed to "Work blouse". Save is enabled even though the set did not change.
- Source: `src/features/builder/useBuilder.ts:70-73` and `:96`. Both compare `pieceIds.join()`, which depends on order, and toggling appends the piece at the end.
- Fix: compare sorted ids. When editing, always keep `source.name`. Only generate a name for new looks.
- Screens: `build-reorder-dirty.png`, `build-name-lost.png`

**3. Two looks can be planned for the same day with no warning (wrong)**
- Repro: Office navy > Plan a day > 11 Oct. Eid lunch > Plan a day > 11 Oct.
- Actual: both are planned and the picker shows no marker for days that already have a plan. `plannedToday` returns both, and Today applies only one.
- Source: `src/domain/looks.ts:152` (setPlannedFor), `app/look/[id].tsx:282` (MonthGrid).
- Fix: dot planned days in the MonthGrid. When a day is taken, confirm "Replace Office navy on Sun 11 Oct?" and clear the other look's plannedFor.
- Screen: `two-looks-same-day.png`

**4. Tapping a notification while the app is open or in the background does nothing (broken)**
- Repro: let the reminder fire with the app in the background, then tap it.
- Actual: the app resumes on the last screen. A "tomorrow" reminder does not open tomorrow.
- Source: `app/index.tsx:9`. `useLastNotificationResponse` is only read when the index route mounts, which only happens on a cold start. The code never registers `addNotificationResponseReceivedListener`. It also calls setLaunchIntent during render.
- Fix: in the root layout, use `useEffect` on `useLastNotificationResponse()` (or add a response listener) that calls `setLaunchIntent` and `router.navigate("/(tabs)/today")`.

**5. Past plans never expire (wrong)**
- Actual: a look planned for a past day keeps `plannedFor`. Its meta reads as planned forever, and the Plan picker cannot clear it from a past date.
- Source: `src/domain/looks.ts` (no cleanup). Sorting uses `closet.styling.today?.localDate`, but `format.ts` uses `todayDate()`, so the two can disagree around midnight.
- Fix: ignore or clear `plannedFor < todayDate()` when reading, and use one date source.

**6. The adjust plan Maestro flow asserts the wrong weekday (wrong, test)**
- `.maestro/adjust/plan.yaml:12,19,34` expects "Sat 11 Oct". 11 Oct 2026 is a Sunday and the app correctly shows "Sun 11 Oct". Fix: change the test to "Sun 11 Oct".

**7. Looks detail cannot be scrolled from the hero at large text (broken, a11y)**
- Repro: set the size to AX5, open any look, and swipe up starting on the flat-lay.
- Actual: the page does not move, because the hero takes the gesture. At AX5 the "Show on Today" footer wraps to 2 lines (about 180pt), which leaves about 530pt to scroll in. A tap on "Change" landed on the footer and opened Today.
- Fix: set `pointerEvents="none"` on the hero when it is not interactive, or make the footer label shorter ("Wear today") with `numberOfLines={1}` and `adjustsFontSizeToFit`. Add bottom padding equal to the footer height.
- Screen: `ax5-detail-no-scroll-on-hero.png`

**8. Builder breaks at AX5 (polish, a11y)**
- Actual: the X cancel icon scales up with the text. The collage fills the screen and pushes the name below the fold. The "Save changes" footer wraps and covers the picker, and a chip edge peeks out from under it.
- Source: `app/look/build.tsx:274` (`dock: { minHeight: 304 }`).
- Fix: cap the icon size and the footer label lines. Make the collage smaller at accessibility sizes, or put the collage and dock in one scroll view.
- Screen: `ax5-builder.png`

**9. The empty builder goes to a different add route than the list (polish)**
- `app/look/build.tsx:140` pushes `"/capture"`, but the Looks empty state uses `addPiecesRoute`. Fix: use `addPiecesRoute` in both.

**10. The Today occasion chip loses its shape at AX5 (polish)**
- "Party or mehndi" wraps and the pill turns into a rectangle. Fix: `numberOfLines={1}` with a horizontal scroll, or a shorter label ("Party").

## 2. UX and design

- **Calendar shows only the past.** Planned looks (11 Oct) do not appear, and you cannot go to next month (`app/looks/calendar.tsx`). Show planned days with a dashed thumbnail and allow paging forward. Screen: `calendar-no-plans.png`.
- **Calendar hides piece wears.** Calendar marks use `scope !== "piece"` (`src/domain/looks.ts:51`), but variety stats count piece wears. Show them as a small dot.
- **Calendar layout.** Every week reserves a thumbnail row even when empty, which wastes height. The selected day uses rose instead of plum. The lone "<" arrow looks unbalanced. Days with no wear are missing from the VoiceOver tree, so you cannot move through the month by day.
- **You cannot plan today.** The picker starts at tomorrow (`app/look/[id].tsx:282`). Allow today and route it to Show on Today.
- **Plan and save give no feedback.** After you pick a date the expander closes and only the meta text changes. Saving a worn entry gives no toast or haptic. Add a toast ("Planned for Sun 11 Oct") and a success haptic.
- **Worn-only entries are dead ends.** You cannot plan them or mark them worn again until you save them. Allow both, and save automatically.
- **Unclear "Worn" button.** Use "Mark as worn", with the same VoiceOver label.
- **List hierarchy.** Saved looks have no header while the "Worn" section does. Rows and thumbnails are small next to the grid cards in Whering and Indyx. Worn entries get weak names ("Tunic"). Add a "Saved" header, use a 2-column card grid with large flat-lays, and name worn entries "Worn Fri 3 Oct".
- **The swap strip reorders after a swap.** The current piece jumps to the front, so the user loses their place. Keep the order stable.
- **The builder hides the name.** The title sits under the collage and the empty shoe slot is cut off. Put the name above the collage or in the header.
- **The builder accepts looks that Today rejects.** It saves looks with no shoes, which then fail on Today (bug 1). Show a "No shoes" hint while building.
- **The builder does not catch duplicates.** You can save the same set twice under different names. Warn with "Same as Office navy".
- **Notification copy is generic.** "See today's outfit" is shown even when a look is planned. Use "Today: Eid lunch" (src/domain/notifications.ts).
- **Large text.** Thumbnails stay tiny next to AX5 text. Scale thumbnails with the font size, or switch rows to a stacked layout.
- **Dark mode.** The app is light only (`app.json`). This is fine, but it should be a deliberate choice.

Checked and fine: the code handles reduce motion (FlatLay, MonthGrid, Tile and Footer read it), and the list and calendar scroll without visible jank.

## 3. Premium ideas (ranked)

1. **Share a look to Instagram Stories.** No share or export exists today. Render a branded flat-lay card (9:16, look name, date, Almari mark) with react-native-view-shot, then use expo-sharing or the Instagram Stories URL scheme. This is the content-creator feature.
2. **Week planner.** Show a 7-day strip on Looks with a planned look or an empty slot for each day. Tap a slot to pick a look. Reuses setPlannedFor, and also fixes the invisible plans.
3. **Planned-look reminder.** The evening before a planned day, send "Tomorrow: Eid lunch" with the flat-lay as an attachment. Tapping it opens the look (needs the bug 4 fix).
4. **Outfit diary export.** Export a monthly "What I wore" collage of the calendar grid as one image to share or save.
5. **Wear again.** Add a one-tap "Wear again today" on worn entries and calendar days that applies the look and marks it worn.
6. **Trip capsule.** Pick dates and get one planned look per day, plus a packing list made from the unique pieces.
