# F09 Looks

Routes: `/(tabs)/looks`, `/look/[id]`, `/looks/calendar`. Entry: Looks tab; Today's filled Save icon (`today.openLook`, F06); Today Footer Open look (`today.openLook`, planning and tomorrow, F06); Today "Start with" look rows (`today.openLook` action); piece detail "Used in" rows. The calendar has one door, the Looks header. Exit: row -> look detail; header New look -> F10; header Calendar -> calendar. Hand-offs: "Show on Today" -> F06 (records nothing); "Worn" records a wear (Today or Yesterday); "Plan" sets a date on the look in place, and Today shows it first that morning; "Change" (pieces) -> F10; calendar day rows -> look detail; calendar Most worn rows -> piece detail (F05); calendar Variety (current month) -> Closet with Not worn lately on (F04, hand-off rule 7).

Sources: `architecture.md` (Owner decisions, Revision 1 and 2 changes win), `owner-feedback.md` round 2 item 11, `advocate-walkthroughs.md` Revision 1 walk (C9-01, C9-02), `design-system.md` (20 MonthGrid, Looks calendar recipe), `motion.md` (Month change), `copy.md` F09 and Revision 1 > F09 Calendar, `use-cases.md` F09. Before: `screens/before/tab-looks.png` (one full-width collage per look, intro sentence, "Build a look" text button), `screens/before/look-detail.png` ("Your look" header, name, two meta lines, collage, plum "Change pieces" bar mid-screen, piece names as plain text). The calendar is new.

What changes: the list becomes compact rows with one-line metas so several looks fit on one screen; the intro sentence and the "Your look" title go; the look name is the title; piece names become rows that push the piece; one pinned primary ("Show on Today"); Rename, Worn and Plan are one row of chips under the meta line and happen in place; worn rows open the same detail, never the builder, and look like a saved look from the first frame. Revision 1: the Looks header gains Calendar next to New look; the wear calendar is one pushed screen: a month grid, the chosen day's wears under it, then Most worn and Variety, each a door.

## Screens

### 1. Looks (tab root, `/(tabs)/looks`)

Purpose: every saved, worn and planned look, one tap from its detail.

Layout, top to bottom (Tab root recipe):

1. `Screen large`, title `nav.looks`. Header right: `HeaderItem` icon `plus`, label `looks.new`, pushes `/look/build`; `HeaderItem` icon `calendar`, label `calendar.title`, pushes `/looks/calendar`. Both always, in that order, so the header never changes.
2. `Row` list, one per look:
   - `leading: { lay }`, the look's pieces as a `FlatLay` `row` (72 pt, `design-system.md` 6).
   - `title`: look name (worn, not saved: the suggested outfit name).
   - `meta`, one line joined by " · ": occasion (`occasion.*`), then one status: `looks.planned` for an upcoming date, else `looks.worn` for a worn row that is not saved, else `looks.lastWorn`. A date of today or tomorrow reads "today" / "tomorrow" ("Planned for today", "Planlagt i dag"), later days the short date. When pieces are gone, `looks.missingOne` / `looks.missingMany` takes the place of the status; on a planned look with gone pieces the occasion goes instead and the meta reads "Planned for Sat 17 Oct · 1 piece missing", so a row sorted to the top still says why. The piece count is not shown: the lay shows the pieces.
   - `trailing: "chevron"`, `onPress` pushes `/look/[id]`.
3. Order: looks planned for today or later first, nearest date first; then everything else newest first (saved or last worn, whichever is later; `lookEntries`, `architecture.md` Domain touches).
4. One row per piece set. A wear (Wear this on Today, Worn on look detail) whose pieces match a saved look, ignoring order, records on that look: its row moves up and reads `looks.lastWorn`, and no new row is added. A wear that matches an existing worn, not saved row updates that row (date and position). Only a new unsaved piece set adds a `looks.worn` row. Pieces marked as worn in Closet select ("Mark as worn", "Mark what I wear most") are piece wears, not outfits: they add no row here and no day on the calendar (Screen 5); they show only in the piece's own counts, the wear filters and Rediscover.
5. No Footer. No Section titles: one list.

```
+--------------------------------------+
|                            (+) (cal) |
| Looks                                |
|                                      |
| [lay] Eid lunch                    > |
|       Eid · Planned for Sat 17 Oct   |
| ------------------------------------ |
| [lay] Sage and charcoal            > |
|       Everyday · Worn, not saved     |
| ------------------------------------ |
| [lay] Ivory work tunic             > |
|       Work · Last worn 9 Oct         |
| ------------------------------------ |
| [lay] Weekend denim                > |
|       Everyday · 1 piece missing     |
| ------------------------------------ |
| [lay] Office navy                  > |
|       Work · Last worn 28 Aug        |
|                                      |
+--------------------------------------+
| Today      Closet      [Looks]       |
+--------------------------------------+
```

Primary action: tap a row (opens the look). Creating is the header `plus`; the month of wears is the header `calendar`.

Empty (no looks): `EmptyState` in the upper third, title `looksTab.emptyTitle`, no line, no mark. Both header items stay (F10 handles an empty closet, UC-F10-04; the calendar handles no wears). Action `primary` regular:

- No pieces: `closet.addPieces` -> `/capture` (F02).
- Pieces, no looks: `looks.new` -> `/look/build` (F10).

```
+--------------------------------------+
|                            (+) (cal) |
| Looks                                |
|                                      |
|            No looks yet              |
|                                      |
|         (     New look     )         |
|                                      |
|                                      |
+--------------------------------------+
```

Long names: a user-typed name with a word of 12 or more characters gets a display-only soft-hyphen pass (hyphenation patterns for the app locale, nb-NO or en-US, for example the `hyphen` package), in one shared display helper used by Row titles, the FlatLay title and the rename Field's prefilled text. The raw name is the `accessibilityLabel` and the stored value. `nb.ts` copy carries its own soft hyphens and skips the pass.

### 2. Look detail (`/look/[id]`, saved look)

Purpose: see one look and do one thing with it: show it on Today, record a wear, plan it, rename it or change its pieces.

Layout, top to bottom (Detail recipe, as F05 piece detail):

1. `Screen`, `leading="back"`, `title` = the look name for VoiceOver and the back menu, no visible bar title, no header items. When the push transition ends, focus goes to the title, as F05.
2. `FlatLay` hero with `title` = look name (Georgia `title`, `accessibilityRole="header"`). `onPiecePress` pushes that piece (`/piece/[id]`), with the FlatLay pressed-piece feedback, so the gesture learned on Today is never a dead tap. The piece views stay hidden from VoiceOver (`accessibilityElementsHidden`): the piece rows below are the same targets (`design-system.md` 11).
3. Meta line, `subhead` `inkMuted`: occasion · `looks.planned` (when set) or `looks.lastWorn` (when worn), today and tomorrow as on Screen 1. Nothing when neither. VoiceOver label: the parts joined with ", " (never the visible " · "), dates with `dateStyle: "full"`.
4. `Banner notice`, only when pieces are gone: `look.missingOne` / `look.missingMany`, sentence only, no action (the Section action below does the repair). Present on arrival. It sits under the meta line, so the problem reads next to the name and the visual order is the reading order.
5. `ChipRow wrap`, three `control` chips, each with the 1 pt `lineField` edge on `canvas` (`design-system.md` 7): `look.rename` (no glyph, opens the title Field in place), `look.markWorn` (`chevron.down`), `looks.plan` (`chevron.down`). Rename comes first so that the saved-only chips on Screen 3 enter after it and nothing moves. The row fits one line at default size in both languages (EN about 266 pt, NB "Endre navn", "Brukt", "Planlegg" about 322 pt, of 343 pt).
6. One `Expander` body directly under the ChipRow, opened by Worn or Plan, with no title line of its own (the chip is the header and carries `accessibilityState.expanded`), as F05 S1a and Today's context chips. One open at a time. Pressing the open chip again closes it; pressing the other chip swaps the body in place.
   - Worn body: `ChipRow` of `action` chips `adjust.today`, `looks.yesterday`, with the VoiceOver and Voice Control labels `outfit.worn` ("Worn today" / "Brukt i dag") and `looks.wornYesterday` ("Worn yesterday" / "Brukt i går"), so "I dag" never matches the Today tab too; the visible words are inside the labels. A tap records the wear at once (`woreLook` with that date), and the wear reaches the Looks row, the calendar, Profile stats, the piece wear lines, the Closet wear filters, Rediscover and the stylist without another step (hand-off rule 4). The chips crossfade into a `ResultBar` in the same body (`checkmark`, `outfit.worn` or `looks.wornYesterday`, quiet `common.undo`). The body reserves the larger of the chip row and the ResultBar, measured at the current text size in English and bokmål; at `large` that is the stacked ResultBar (`design-system.md` 14), so at AX3 "Worn yesterday" / "Brukt i går" gets the full 311 pt line and Undo sits under it. The body does not change size. The ResultBar stays until the user presses or edits something else on the screen (scrolling and VoiceOver focus moves do not count), presses Worn again, or leaves; then the body closes with inline collapse and the wear stays. When that press is below the body (Change, a piece row, Remove look), the body collapses without animation once the alert closes or the detail shows again after the push, so nothing moves under the finger. Undo removes the wear everywhere it showed and the chips crossfade back. On an unplanned look the meta line updates in place to the new `looks.lastWorn`; on a planned look the meta keeps `looks.planned` and only the ResultBar confirms the wear.
   - Plan body: `MonthGrid` in `pick` mode (`design-system.md` 20), the same calendar as Screen 5, so a chosen day looks the same everywhere: the `blush` disc with its `blushStrong` edge, today ringed in `ink`. It spans the full content width (the body's horizontal padding is cancelled for it). Days from tomorrow on are pressable; today and earlier days are `inkMuted` and not pressable. It opens on the planned day's month (the current month when none), the planned day selected; Previous is hidden on the current month and Next has no limit. A day tap commits; paging months does not. When the columns are narrower than 44 pt, at `ax`, or when the scaled disc would not fit its column, the grid is MonthGrid's own `Row` list of the month's pressable days under the same month line (`design-system.md` 20 > Grid or Rows). Under it, only when a date is set, `Button quiet` `looks.clearPlan`, leading-aligned. A day tap or Clear date writes at once and the body resolves (inline collapse).
   - Opening either body follows Inline expand, so the calendar or list scrolls into view and never sits under the Footer.
7. `Section` titled with the piece count (`common.pieceCountOne` / `common.pieceCountMany`), Section action `look.change` (quiet, VoiceOver label `look.changePieces`, "Change pieces" / "Endre plagg", which contains the visible word) -> `/look/build?id=` (F10). Rows: `leading: { thumb }`, title piece name, `trailing: "chevron"`, push `/piece/[id]`. A gone piece has no row (the Banner says it).
8. `Button destructive` `look.remove`, leading-aligned, last in the scroll. System alert `look.removeTitle` with `look.removeBody`, or `look.removeBodyWorn` for a look with wears ("The pieces and the days you wore it stay." / "Plaggene og dagene du brukte den blir."), so she knows before she confirms that its row stays. It sits on the detail because a look has no editor with a scroll end (the builder is `scroll=false`); `design-system.md` Detail recipe names this exception. Removing un-saves the look and never erases a wear: a look that was never worn leaves the list; a look with wears stays as its worn row, keeping its name ("Eid lunch", from `setNames`, Domain touches in the Review log) with the meta `looks.worn`, because the calendar and the counts still hold those days. Look detail is the only place a look is removed.
9. `Footer` primary `looks.showOnToday`.

Reading order follows the visual order: title, meta line, Banner, ChipRow, body, Section, Remove look, then the Footer.

```
+--------------------------------------+
| <                                    |
|                                      |
|   +------------------------------+   |
|   |  [hijab]   [kurta]           |   |
|   |            [shalwar] [shoes] |   |
|   |                     [bag]    |   |
|   +------------------------------+   |
|                                      |
| Eid lunch                            |
| Eid · Planned for Sat 17 Oct         |
| (Rename) (Worn v) (Plan v)           |
|                                      |
| 5 pieces                     Change  |
| [t] Dusty rose chiffon hijab       > |
| ------------------------------------ |
| [t] Plum kurta                     > |
| ------------------------------------ |
| [t] Ivory shalwar                  > |
|  ...                                 |
| Remove look                          |
+--------------------------------------+
| (         Show on Today          )   |
+--------------------------------------+
```

Worn open on a planned look, then after tapping Yesterday (the meta and the Footer do not change):

```
| Eid lunch                            |       | Eid lunch                            |
| Eid · Planned for Sat 17 Oct         |       | Eid · Planned for Sat 17 Oct         |
| (Rename) (Worn ^) (Plan v)           |  -->  | (Rename) (Worn ^) (Plan v)           |
| +----------------------------------+ |       | +----------------------------------+ |
| | (Today) (Yesterday)              | |       | | v Worn yesterday           Undo  | |
| +----------------------------------+ |       | +----------------------------------+ |
```

Plan open on a planned look:

```
| (Rename) (Worn v) (Plan ^)           |
| +----------------------------------+ |
| October 2026               ( )  (>)  |
|   M    T    W    T    F    S    S    |
|  ...                                 |
|   12   13  (14)  15   16  {17}  18   |
|  ...                                 |
| | Clear date                       | |
| +----------------------------------+ |
```

Primary action: `Footer` "Show on Today". It shows this look as Today's outfit and records nothing. From the Looks stack it switches to the Today tab and the detail stays in the Looks stack. From the Today stack (Today's Save icon, Today's Footer Open look, a "Start with" row, or a piece's "Used in" row pushed from Today) it pops that stack to the Today root with the native pop. Either way Today then plays the Generating moment and VoiceOver focus lands on the Today outfit title (F06); the moment is announced once there, not again here.

#### 2a. Rename in place

Pressing Rename turns the title into a `Field` in the same spot. The Field uses the `title` role (Georgia, same size and line height), with no fill and no box: only the caret and a 1 pt `lineField` underline (3.34 on canvas) drawn inside the title's own bottom padding, so the name, the meta line and everything below stay exactly where they are. It is a `multiline` `TextInput` with `submitBehavior="blurAndSubmit"` and `returnKeyType="done"`, so a long name wraps like the title instead of scrolling sideways, and Return commits instead of adding a line. Prefilled with the display text (soft hyphens from the shared helper, stripped on commit), caret at the end, keyboard up, VoiceOver focus on the Field. Its label is hidden and `look.name` is its VoiceOver label (the rename exception in `design-system.md` 9).

- Commit: the return key (Done), dragging the keyboard down (`keyboardDismissMode="on-drag"`), back or swipe-back, or pressing any other control (a chip, Rename again, a row, the Footer), which commits first and then acts. An empty or unchanged name drops and keeps the old one.
- VoiceOver escape (two-finger Z, `onAccessibilityEscape` on the Field) drops the edit and returns focus to the title header; a second escape pops.
- It counts as the screen's open Expander: pressing Rename closes Worn or Plan, and opening one of those commits or drops the rename.
- After commit, focus returns to the title (header). The back menu, the Looks row and the calendar day rows follow the new name.
- The Footer does not ride the keyboard during rename: it stays at the bottom, under the keyboard, because Done and dragging the keyboard down commit. The Field scrolls into view above the keyboard. At AX5 on a 667 pt phone, the 64 pt bar and the 260 pt keyboard (with the QuickType bar) leave about 343 pt; a three-line Georgia Field at the 52 pt cap (about 192 pt), `space.sm`, and a two-line `common.error.save` footnote (about 128 pt) come to about 328 pt in both languages. Lane 1 confirms these heights at AX5 in English and bokmål.

```
| Eid lunch                            |   -->   | Eid Saturday|                        |
| Eid · Planned for Sat 17 Oct         |         | ------------------------------------ |
                                                 | Eid · Planned for Sat 17 Oct         |
```

### 3. Look detail, worn and not saved (`/look/[id]` from a worn row)

Purpose: keep an outfit that was worn but never saved, without going through the builder.

Same skeleton as Screen 2, fewer parts:

1. `Screen`, `leading="back"`, `title` = the suggested name (same rule: VoiceOver and back menu only).
2. `FlatLay` hero, `title` = the suggested name. Pieces push as on Screen 2.
3. Meta line: occasion · `looks.lastWorn`.
4. `ChipRow` with `look.rename`. Worn and Plan are rendered hidden after it (opacity 0, `pointerEvents="none"`, hidden from VoiceOver, as Footer Waiting), so the row has the saved state's height from the first frame. Rename works as 2a; the new name is kept for the piece set in `setNames` (Domain touches in the Review log), so the worn row and its calendar rows show it, and Save look keeps it.
5. `Section` piece count with piece `Row`s. The Section action "Change" is rendered hidden the same way, so its line is reserved.
6. `Footer` primary `common.saveLook`.

No Worn, Plan, Change or Remove look yet: they need a saved look.

```
+--------------------------------------+
| <                                    |
|   +------------------------------+   |
|   |        [flat lay hero]       |   |
|   +------------------------------+   |
| Sage and charcoal                    |
| Everyday · Last worn 9 Oct           |
| (Rename)                             |
|                                      |
| 4 pieces                             |
| [t] Sage kurta                     > |
|  ...                                 |
+--------------------------------------+
| (            Save look           )   |
+--------------------------------------+
```

After Save look: `success` haptic. The Footer label changes in place to `looks.showOnToday` (`motion.md` > Banners and bars, label that changes in place) and `result.saved` is announced; focus stays on the Footer button. No ResultBar. Worn, Plan and "Change" fade in where their space was reserved, and Remove look appears at the end of the scroll. Nothing moves. The screen is now Screen 2. Its earlier wears now belong to the saved look (same piece set), so the calendar rows for those days open Screen 2.

Primary action: `Footer` "Save look".

### 4. Look gone (`/look/[id]` for a removed look)

`Screen gone` with `look.goneTitle`; the action `common.goBack` pops. Never a jump to the Looks tab.

```
+--------------------------------------+
| <                                    |
|                                      |
|    This look is no longer here       |
|                                      |
|            ( Go back )               |
|                                      |
|                                      |
|                                      |
|                                      |
+--------------------------------------+
```

### 5. Calendar (`/looks/calendar`)

Purpose: what she wore this month, by day, and which pieces she reached for. Reads `wearCalendar` and `monthWearStats`; writes nothing.

Entry: Looks header `calendar` (Looks stack), the only door. It opens on the current month with no day selected.

Layout, top to bottom (Looks calendar recipe):

1. `Screen`, `leading="back"`, inline title `calendar.title`, no header items, no Footer.
2. `MonthGrid` in `wear` mode (`design-system.md` 20): month line `calendar.month` with the previous and next `Button icon`s; weekday letters; six week rows always laid out.
   - Grid or Rows: the grid only when each of the seven columns is at least 44 pt wide and holds the scaled 28 pt disc with 2 pt to spare; otherwise, and always at `ax`, the day `Row` list below (`design-system.md` 20 > Grid or Rows). On a 375 pt phone the grid holds up to `large`; at 320 pt (Display Zoom) it is always the Rows.
   - Next is not rendered on the current month (slot kept). Previous is not rendered on the month of her first outfit wear, or on the current month when she has none (slot kept), so paging back never runs into empty years.
   - A worn day carries a 40 pt cut-out of its mark piece (`wearCalendar`, `architecture.md` Domain touches), the number in `ink`. Every cut-out sits on the same 40 pt `radius.sm` `sunken` square (`design-system.md` 20), so a white kurta still shows and no day looks framed or chosen next to the blush selected day. The day is pressable. Unworn and future days are `inkMuted` numbers only and not pressable. Today is ringed in `ink`. The selected day sits on the `blush` disc; when today is selected, the disc's edge is today's 1.5 pt `ink` ring instead of `blushStrong`.
   - Outfit wears only: Wear this (Today) and Worn (look detail). Piece wears from Closet Mark as worn feed the piece counts, the wear filters, Rediscover and Variety, never a day here. "Show on Today" and a planned date never mark a day. An undone wear leaves. A wear whose pieces have all left the closet leaves; one with some pieces left keeps them.
3. Selected day, only while a day is selected: `Section` titled `calendar.dayTitle` (the short date). It opens with Inline expand and scrolls into view by the least distance, capped so the selected day stays on screen; while VoiceOver runs it does not scroll. One `Row` per outfit wear, in the order recorded: `leading: { lay }` (`mini`), title the look name, or for a set that is not saved the name its Looks row shows (`setNames`, else the suggested outfit name), meta the occasion word (`occasion.*`), `trailing: "chevron"`, pushes `/look/[id]` (Screen 2, or Screen 3 for a set that is not saved). Two wears of the same look on one day are two rows. Tapping the selected day again, or changing month, closes the Section.
4. Month, only when the month has outfit wears:
   - `Section` `stats.mostWorn`, only when the top piece was worn twice or more this month: up to three `Row`s from `monthWearStats`, each worn twice or more: `leading: { thumb }`, title the piece name, meta `calendar.timesMany`, `trailing: "chevron"`, pushes `/piece/[id]`.
   - On the current month, when she owns pieces: after `space.lg`, the `Row` `calendar.variety` on its own, no Section title, no leading, title and meta on the gutter, meta `calendar.varietyValue`, `trailing: "chevron"`. Its number is the share of owned pieces worn in the last 30 days, the window and pool of Not worn lately, so it and the door's grid add up to the whole closet. A tap switches to the Closet tab with Worn: Not worn lately set and the filter panel open (F04 Arrival with a filter); VoiceOver focus moves to the More chip ("More, Not worn lately, expanded"). The calendar stays in its stack. On a past month Variety is not rendered: the 30 days end today.
5. A month with no outfit wears: no Sections. One `body` `inkMuted` line under the grid, `calendar.emptyMonth`, its own text element. With no outfit wears at all this is the whole screen on the current month, both chevrons hidden; nothing else is added.

Below `ax` (today Wed 14 Oct, Fri 9 Oct selected):

```
+--------------------------------------+
| <             Calendar               |
|                                      |
| October 2026               (<)  ( )  |
|   M    T    W    T    F    S    S    |
|                  1    2    3    4    |
|                 [c]  [c]             |
|   5    6    7    8   {9}   10   11   |
|  [c]  [c]       [c]  [c]             |
|   12   13  (14)  15   16   17   18   |
|  [c]  [c]  [c]                       |
|   19   20   21   22   23   24   25   |
|   26   27   28   29   30   31        |
|                                      |
|                                      |
| Fri 9 Oct                            |
| [lay] Ivory work tunic             > |
|       Work                           |
| ------------------------------------ |
| [lay] Sage and charcoal            > |
|       Everyday                       |
|                                      |
| Most worn                            |
| [t] Plum chiffon hijab             > |
|     6 times                          |
| ------------------------------------ |
| [t] Black work trousers            > |
|     4 times                          |
| ------------------------------------ |
| [t] Grey cardigan                  > |
|     3 times                          |
|                                      |
| Variety                            > |
| 38% of your closet in 30 days        |
+--------------------------------------+
[c] = worn day cut-out on its sunken square   (14) = today   {9} = selected   ( ) = kept slot, Next hidden   sixth week row empty, still laid out
```

A past month with no wears, after her first wear month (both chevrons, no Sections):

```
| July 2026                  (<)  (>)  |
|   M    T    W    T    F    S    S    |
|             1    2    3    4    5    |
|   6    7    8    9    10   11   12   |
|  ...                                 |
|                                      |
| No looks worn in July                |
```

Rows (at `ax`, or when the columns are too narrow, `design-system.md` 20): the month line stays; at AX5 its title wraps and the chevrons sit on their own line under it, trailing, both 44 pt slots kept, so Previous never jumps when Next is hidden. Each worn day of the month is a `Row`, in date order as the grid, title the short date alone, no leading and no meta (the first wear Row under it shows the lay), `trailing` a 13 pt `inkMuted` `chevron.down` that rotates 180 degrees when open, as every other `headless` Expander trigger. A tap opens that day's wear Rows directly under its Row in a `headless` `Expander` (the day Row carries `accessibilityState.expanded` only, never `selected`), so the list stays where her finger is; a second tap closes it. Most worn and Variety follow the list as above. `calendar.emptyMonth` sits under the month line when the month has no outfit wears.

```
| October 2026                         |
|                         (<)  ( )     |
| Thu 1 Oct                          v |
| ------------------------------------ |
|  ...                                 |
| Fri 9 Oct                          ^ |
| +----------------------------------+ |
| | [lay]                            | |
| | Ivory work tunic               > | |
| | Work                             | |
| | -------------------------------- | |
| | [lay]                            | |
| | Sage and charcoal              > | |
| | Everyday                         | |
| +----------------------------------+ |
| ------------------------------------ |
| Mon 12 Oct                         v |
```

Primary action: tap a worn day (its wears open under the grid). No Footer: the screen reads and opens, it commits nothing.

## States

| State | Screen | What shows |
|---|---|---|
| Empty, no pieces | Looks | `EmptyState` `looksTab.emptyTitle` + primary `closet.addPieces` -> F02. Header `plus` and `calendar` stay |
| Empty, pieces but no looks | Looks | `EmptyState` `looksTab.emptyTitle` + primary `looks.new` -> F10. Header `plus` and `calendar` stay |
| Empty, no wears | Calendar | No outfit wear yet (Closet Mark as worn does not count): current month grid, numbers only, today ringed, both chevrons hidden, `calendar.emptyMonth` under the grid. No Sections, no mark, no button |
| Empty month | Calendar | Grid with numbers only and `calendar.emptyMonth` under it; Most worn and Variety are not rendered |
| Past month | Calendar | Grid, day Section and Most worn as on the current month; Variety is not rendered, because its 30 days end today |
| First run | Looks, Calendar | The empty states above. The first Looks row arrives after the first "Wear this" (worn row) or Save look on Today, or a save in the builder. The first calendar mark arrives with the first outfit wear (Wear this on Today, Worn on a look). "Mark what I wear most" on day one adds no day: the calendar never shows a day she did not dress |
| Loading | Looks | Closet not opened yet: three `Silk placeholder` rows in the exact `Row` shape (text hidden, so the height follows Dynamic Type). The list container carries `common.loading` and `accessibilityState.busy`; rows are hidden until resolve |
| Loading | Look detail | The push renders complete. If the closet has not opened (cold deep link), the hero is a `Silk placeholder` in the flat-lay shape and the title and meta lines are text placeholders. Photos that decode late fade in |
| Loading | Calendar | The push renders complete: numbers, today ring, rows and text are drawn at once (local data). Each worn day's cut-out, and each row lay or thumb, holds a 40 pt `Silk placeholder` in its shape until it decodes |
| Generating | Look detail -> Today | No generating on these screens. "Show on Today" hands off to Today, which plays the Generating moment (F06) |
| Busy | Look detail | Footer "Show on Today" and "Save look": `Silk busy`. Chips in Worn, Plan days, Clear date and the rename Field: in-flight rule (disabled look only after `wait`). Remove look: busy after the alert |
| Busy | Calendar | None: nothing on it writes |
| Error, save | Look detail | Worn or Plan write fails: `footnote` `error` `common.error.save` at the end of the open body, which stays open. Rename fails: `Field` error `common.error.save` under the title Field, the old name stays. Save worn look fails: the Footer `error` slot (`design-system.md` 3), announced; the Footer stays "Save look" |
| Error, remove | Look detail | `footnote` `error` `common.error.remove` directly under Remove look; the look stays |
| Error | Calendar | Not applicable: it reads stored wears only |
| Missing pieces | Looks, Look detail, Calendar | Row meta `looks.missingOne` / `looks.missingMany` in place of the status; on a planned look in place of the occasion ("Planned for Sat 17 Oct · 1 piece missing"). Detail: `Banner notice` under the meta line, sentence only; "Change" on the Section repairs it. Show on Today still works: Today shows the variant card (UC-F06-08). Calendar: a day row's lay shows the pieces that are left, and the day's mark falls to the next piece by the mark rule; a wear with none left is not shown, and a day with no wear left loses its mark |
| Removed look with wears | Looks, Calendar | The alert says `look.removeBodyWorn`. The saved look goes; its row stays, same name, meta `looks.worn`, placed by its last wear date, and its calendar days stay under the same name, opening Screen 3 |
| Gone | Look detail | Screen 4 |
| Planned | Looks, Look detail | Row and meta read `looks.planned`, "today" and "tomorrow" for those days. The date leaves once the day has passed and the meta falls back to `looks.lastWorn`. The calendar shows wears only, never a plan |
| Worn again | Looks, Calendar | A wear of a saved look's pieces records on that look (row moves up, `looks.lastWorn`); a repeated unsaved set updates its worn row. Never a second row for the same pieces. The calendar shows every outfit wear on its own day, two rows when worn twice in a day |
| Piece wears | Looks, Calendar | Closet Mark as worn adds no Looks row and no calendar day. It counts in Variety, the piece's wear line, the wear filters and Rediscover |
| Offline | All | No change. Looks, wears, pieces and photos are local; nothing in this flow uses the network (UC-F12-04) |
| Permission denied | All | Not applicable. This flow asks for no permission |
| Largest text (AX3 to AX5) | All | Lane 1 verifies at AX3 and AX5 (fontScale 3.571, body about 61 pt): Looks rows put the 72 pt lay above the text with the chevron trailing on the lay line, so "Bryllupsmiddag" (about 309 pt at AX3) fits the full 343 pt on one line; at AX5 (about 417 pt) the Row title breaks at its soft hyphen ("Bryllups-middag"). The detail title (Georgia, 52 pt cap, about 360 pt for the word) and the rename Field break at the soft hyphen ("Bryllups-middag"), never mid-syllable. The Worn ResultBar stacks (text line, Undo under it) inside the reserved body; at AX5 its text wraps to two lines in both languages, inside the measured reservation. The rename over the keyboard fits at AX5 (2a). ChipRows wrap. Plan's MonthGrid becomes its `Row` list of pressable days. Section action "Change" wraps under the Section title. Footer primary stays pinned and grows, and stays under the keyboard during rename. EmptyState title wraps, button full label. Calendar: the grid keeps seven columns while each is 44 pt or wider and holds the scaled disc, and its cells grow with the numbers (cut-outs stay 40 pt); otherwise, and at `ax`, the day Rows with wears opening under the chosen day. At AX5 the month title ("september 2026", about 470 pt) wraps to two lines and the chevrons sit on their own line under it, trailing, both 44 pt slots kept |
| Bokmål | All | Tab and title `Samling`. "Ny look", "Kalender", "Vis på I dag", chips "Endre navn", "Brukt", "Planlegg", "I dag", "I går" (VoiceOver "Brukt i dag", "Brukt i går"), "Fjern dato", Section action "Endre" (VoiceOver "Endre plagg"). Meta "Eid · Planlagt lør. 17. okt.", "Planlagt i dag", "Brukt, ikke lagret", "Sist brukt 9. okt.". Empty "Ingen looker ennå". Gone "Denne looken er ikke her lenger". Calendar "oktober 2026", weeks start on Monday, day title "fre. 9. okt.", "Mest brukt", "6 ganger", "Variasjon", "38 % av garderoben siste 30 dager", "Ingen looker brukt i juli". Every label sits in a wrapping container; nothing truncates |
| Reduce Motion | All | Fallbacks per Motion below |

## Motion

All tokens from `motion.md`.

| Where | Motion |
|---|---|
| Row -> look detail, back | Push and pop: native stack transition. The detail renders complete; late photos fade in (`base`, `silk`) |
| Open look on Today, "Used in" on a piece, hero piece, header Calendar, calendar rows | Same push |
| Rows loading | Loading moment: placeholder at once; after `wait` the `sheen` band crosses the rows on one clock (`carry`); resolve fades rows in over the placeholders (`base`, `silk`), band out (`quick`) |
| New or moved row (a save in the builder, Save look on Today, a wear) | While Looks is on screen when it arrives: list insert, opacity 0 to 1 (`base`, `silk`), neighbours reflow (`settle`, `silk`); a worn saved look moves up with the same reflow. On a later visit the list is already in its final layout and only a new row fades in (`base`, `silk`), as `motion.md` > Pop to a tab after a flow |
| Remove look | After the system alert has gone, the detail pops. Once the pop has settled: a look never worn plays list remove on Looks, opacity to 0 (`quick`, `release`), neighbours close the gap (`settle`, `silk`), focus moves to the next row; a look with wears keeps its row: the same list item (rows are keyed by piece set) and the same name, its meta changes with the label crossfade and it moves to its last-worn place with the reflow (`settle`, `silk`), focus on that row |
| Worn, Plan | Inline expand under the ChipRow: the body grows (`settle`, `silk`), siblings below glide down, content enters after `step` (opacity, translateY 4 to 0, `base`, `silk`). Chevron rotates (`settle`, `silk`). Swapping Worn and Plan: old content out (`quick`), height eases to the new content (`settle`, `silk`), new content in (`base`, `silk`). Resolve: inline collapse (`quick`, `release`, then `settle`, `silk`). Collapse after a press below the body: no animation, after the alert or on return |
| Plan month change | `motion.md` > Month change, inside the body: month line and grid (or its Rows) crossfade, no slide; the body height is held, because six week rows are always laid out (Rows: height eases, `settle`, `silk`) |
| Action chip tap (Today, Yesterday), Rename, Plan day, Clear date | `press` only. Chips never take the selected state. No haptic (`motion.md` > Haptics) |
| Worn result | In the body: chips and the `ResultBar` crossfade in the reserved height (outgoing `quick`, `release`; incoming `base`, `silk`). Undo crossfades back. Leaving the result: inline collapse |
| Meta line after Worn, Plan, Rename | Label change in place: old text out (`quick`), new text in (`base`), height held until the fade ends |
| Rename | No crossfade and no movement: the caret appears and the underline fades in (`quick`). Keyboard: system curve; the Footer stays under it |
| Save worn look | `success` haptic. Footer label change in place (`quick` out, `base` in). Worn, Plan and "Change" fade in in their reserved space (`base`, `silk`), Remove look fades in (`base`, `silk`). No expand |
| Show on Today | From the Looks stack: tab switch, none, instant; the look detail stays in the Looks stack. From the Today stack: native pop to the Today root, no extra animation. Today then plays the Generating moment: only changed slots swap in dressing order, `step` apart (`arrange`, `fall`) |
| Missing pieces Banner | Present on arrival, no expand |
| Calendar month change | `motion.md` > Month change: month line and grid crossfade (outgoing overlay `quick`, `release`; incoming `base`, `silk`), no slide and no swipe; Most worn, Variety and `calendar.emptyMonth` use the label crossfade; an open day Section closes with inline collapse. Next leaving or arriving fades in its kept slot; Previous does the same at the first wear month (`motion.md` > Month change, reaching the first wear month). Variety leaves or arrives with the label crossfade when the current month is left or reached |
| Calendar day select | The day's `blush` disc crossfades in (`quick`, `silk`), the old one out in the same frame; the today ring never animates. The day Section opens with inline expand and Most worn glides down (`settle`, `silk`); it scrolls into view by the least distance (Inline expand), capped so the selected day stays on screen, and not at all while VoiceOver runs. Another day: rows crossfade in place (`quick` out, `base` in), height held per Banners and bars `minHeight`. Tapping the selected day: disc out (`quick`, `release`), inline collapse |
| Calendar at `ax` | The day Row's `chevron.down` rotates (`settle`, `silk`) and its wears open under its Row with inline expand, scrolled into view; another day closes the first without animation and the scroll offset drops by the height removed (Expander > Rules), then opens. Month change: the Row list crossfades (`quick` out, `base` in), height in one frame after the fade |
| Calendar Variety | Tab switch: none, instant. Closet shows the filtered grid and the open panel already laid out, Not worn lately selected (F04 Arrival with a filter), no expand. The calendar stays in its stack |
| Back to the calendar | The day stays selected and its Section open. A wear recorded meanwhile (Worn on a look opened from the calendar) is in place on arrival: a new cut-out or row fades in (`base`, `silk`), nothing slides |
| Reduce Motion | Push: system. Loading: placeholders stay still with no band (`motion.md` Loading), rows fade in (`base`); a busy Footer button shows the still band at its centre, in after `wait` and out at resolve (`base`). Insert, move and remove: fades (`base`), neighbours move in one frame. Bodies: layout in one frame, content fades (`base`), chevron in one frame, `scrollTo` not animated. Plan month change: crossfade at `base`. Save worn look: chips, "Change" and Remove look fade in (`base`). Label, meta and ResultBar crossfades at `base`. Today's swap after Show on Today crossfades in place (`base`). Calendar: month and day crossfades at `base`; the day Section, and at `ax` the day Row's `headless` Expander, open and close in one frame, the day Row chevron turns in one frame, `scrollTo` not animated |

VoiceOver:

- Look row label: "{name}, {occasion}, {count or missing}, {status}", parts joined with ", ", dates with `dateStyle: "full"`. The count is spoken even though it is not shown; `looks.missingOne` / `looks.missingMany` replace it when pieces are gone. No hint: the button role and chevron say it opens. The lay is hidden.
- Looks header: "New look" (`looks.new`) and "Calendar" (`calendar.title`), both `button`, Large Content Viewer on hold.
- Look detail: the screen name is the look name. Focus starts on the title (header). The hero pieces are hidden; the title comes before the Banner.
- Worn: the chips read `outfit.worn` and `looks.wornYesterday`. The ResultBar replaces the chip that was pressed, so its text takes focus and is not announced (`design-system.md` 14 > Focus). After Undo, focus returns to the Today or Yesterday chip that was pressed. When the body closes because Worn was pressed again, focus goes to the Worn chip; when it closes because something else was pressed, focus stays on, or follows, what was pressed.
- Plan: exception to `design-system.md` > Accessibility rules > Focus ("resolves: next sibling"). When Plan resolves, focus goes to the Plan chip, and the new meta is announced queued: `looks.planned` with the full date ("Planned for Saturday 17 October 2026", `dateStyle: "full"`) or `looks.planCleared`. Plan days are `button` with the long date (no year, the month title holds it) and `accessibilityState.selected` on the planned day; today and earlier days are hidden (`design-system.md` 20, `pick`).
- Rename: focus goes to the Field on open and back to the title on commit or escape.
- Save worn look: focus stays on the Footer button, whose label switches at once; `result.saved` is announced once, queued.
- Rename, Worn and Plan chips: `button`. Worn and Plan carry `accessibilityState.expanded`. Action chips have no selected state.
- Calendar: focus starts on the month title (header), labelled `calendar.monthLabelOne` / `calendar.monthLabelMany` ("October 2026, worn on 9 days"), or `calendar.month` alone on a month with no wears. The `calendar.emptyMonth` line is its own text element after the chevrons, so it is read once; only the queued announcement after a month change joins the two ("July 2026. No looks worn in July"). Order: month title, Previous, Next, the empty line or the worn days in date order, the day Section, Most worn, Variety. Only worn days are elements: `button`, `calendar.day` ("Friday 2 October, worn") or `calendar.today` on today, `accessibilityState.selected` on the chosen day. Their dates use `weekday: "long", day: "numeric", month: "long"` with no year, because the month title holds it. Unworn and future cells and the weekday letters are hidden. Selecting a day keeps focus on it; its Section title (`calendar.dayTitle`, the same long date) is the next header, and the rotor's Headings step reaches it in one move. Lane 1 runs the VoiceOver walk (UC-F12-07) with this task: select Fri 9 Oct and open its first wear. If the tester does not find the rows, selecting a day moves focus to the Section title instead, as an `ax` day Row opening under itself. After a month change focus stays on the pressed chevron and the new month title is announced once, queued; when the chevron leaves (Next on reaching the current month, Previous on reaching the first wear month), focus moves to the month title. Day rows read "{name}, {occasion}". Most worn rows read "{name}, {calendar.timesOne or timesMany}" ("Plum chiffon hijab, 6 times"); Variety reads "Variety, 38% of your closet in 30 days", both `button`, no hint. After Variety, `setAccessibilityFocus` moves to Closet's More chip once Closet is laid out (F04 Arrival with a filter), which reads "More, Not worn lately, expanded" through its `accessibilityValue`, so the tab change and the filter are both heard. In the Rows form each day Row is `button` with `calendar.day` (`calendar.today` on today) and `accessibilityState.expanded`, no `selected`, in date order as the grid.

## Copy

Keys from `copy.md` F09 and Revision 1 > F09 Calendar unless noted.

| Where | Keys |
|---|---|
| Tab title and label | `nav.looks` |
| Header | `looks.new` (`plus`), `calendar.title` (`calendar`) |
| Row | `occasion.*`, `looks.missingOne`, `looks.missingMany`, `looks.planned`, `looks.worn`, `looks.lastWorn`; VoiceOver adds `common.pieceCountOne`, `common.pieceCountMany` |
| Empty | `looksTab.emptyTitle`, `closet.addPieces`, `looks.new` |
| Loading | `common.loading` (VoiceOver) |
| Detail title | look name; rename Field VoiceOver label `look.name` |
| Detail meta | `occasion.*`, `looks.planned`, `looks.lastWorn` |
| Chips | `look.rename`, `look.markWorn`, `looks.plan` |
| Missing Banner | `look.missingOne`, `look.missingMany` |
| Worn | `adjust.today`, `looks.yesterday` (VoiceOver `outfit.worn`, `looks.wornYesterday`); ResultBar `outfit.worn`, `looks.wornYesterday`, `common.undo` |
| Plan | `calendar.month`, `calendar.previous`, `calendar.next`, `looks.clearPlan`, `looks.planCleared` (VoiceOver) |
| Pieces Section | `common.pieceCountOne`, `common.pieceCountMany`, `look.change` (VoiceOver label `look.changePieces`) |
| Remove | `look.remove`, `look.removeTitle`, `look.removeBody`, `look.removeBodyWorn` |
| Footer | `looks.showOnToday`; worn not saved: `common.saveLook`, then `looks.showOnToday` with `result.saved` announced |
| Errors | `common.error.save`, `common.error.remove` |
| Gone | `look.goneTitle`, `common.goBack` |
| Calendar title | `calendar.title` |
| Month line | `calendar.month`, `calendar.previous`, `calendar.next`; VoiceOver `calendar.monthLabelOne`, `calendar.monthLabelMany` |
| Day cells | VoiceOver `calendar.day`, `calendar.today` |
| Day Section | `calendar.dayTitle`; rows: look name or suggested outfit name, `occasion.*` |
| Month | `stats.mostWorn`, `calendar.timesMany`, `calendar.variety`, `calendar.varietyValue` |
| Empty month | `calendar.emptyMonth` |

Keys added or changed in `copy.md` F09: `looks.clearPlan` is "Clear date" / "Fjern dato"; new `looks.planCleared` (Plan cleared / Planen er fjernet), `look.change` (Change / Endre), `look.markWorn` (Worn / Brukt), `look.removeBodyWorn` (The pieces and the days you wore it stay. / Plaggene og dagene du brukte den blir.); `look.rename` is "Rename" / "Endre navn"; `look.changePieces` NB is "Endre plagg"; `looks.planned` takes "today" / "tomorrow"; `looks.open`, `adjust.pickDate`, `adjust.tomorrow`, `looks.earlierDates` and `looks.laterDates` are out of F09.

Keys added or changed in `copy.md` Revision 1 > F09 Calendar by this pass: new `calendar.dayTitle` ({date} / {date}, the short date as the day Section title, full date for VoiceOver) and `calendar.timesMany` ({count} times / {count} ganger) for the Most worn meta; `calendar.varietyValue` is "{percent} of your closet in 30 days" / "{percent} av garderoben siste 30 dager" and `calendar.emptyMonth` "No looks worn in {month}" / "Ingen looker brukt i {month}", because the calendar holds outfit wears only. Day rows take the same name as the Looks row, so `looks.worn` leaves the day row. Cut from this screen: `calendar.emptyDay` (empty days are not pressable), `stats.nothingWorn` (`calendar.emptyMonth` is the one line, with or without earlier wears) and `calendar.timesOne` (Most worn lists pieces worn twice or more).

## Use cases

| ID | Screen | State |
|---|---|---|
| UC-F09-01 Start with no looks | 1 Looks, empty | empty (no pieces -> Add pieces; pieces -> New look), header plus and calendar present, first run, bokmål |
| UC-F09-02 Browse looks | 1 Looks, rows; row -> 2 | loading, missing pieces, planned, largest text |
| UC-F09-03 Save a worn outfit | 3 Worn not saved -> 2 in place | busy, error (Footer `error` slot), Footer label change, nothing moves |
| UC-F09-04 Show a saved look on Today | 2 Footer "Show on Today" -> F06 | hand-off, Today generating; from the Looks stack a tab switch, from the Today stack a pop to the Today root; no wear recorded here and no calendar mark. "Wear this" on Today then records on this look: its row moves up and reads Last worn, no new row |
| UC-F09-05 Open a piece from a look | 2 Pieces Section row or hero piece -> piece detail, back | default |
| UC-F09-06 Change the pieces of a look | 2 Section action "Change" -> F10 push, detail updated on return | default |
| UC-F09-07 Remove a look | 2 Remove look -> system alert (`look.removeBodyWorn` when it has wears) -> pop; on 1 a never-worn row is removed, a worn one stays with its name as Worn, not saved | busy, error by the button, removed look with wears |
| UC-F09-08 A look with missing pieces | 2 missing Banner (sentence, under the meta) and Section action "Change"; 4 gone with "Go back" | missing pieces, gone |
| UC-F09-09 Mark a look as worn | 2 Worn chip, action chips Today / Yesterday, ResultBar with Undo in the body; 1 row reads Last worn; 5 marks the day | busy, error inside the body, largest text (stacked ResultBar) |
| UC-F09-10 Rename a look | 2a Rename chip, title becomes the Field in place, Done | error (Field), empty keeps old name, escape drops, largest text |
| UC-F09-11 Plan a saved look for a day | 2 Plan chip: MonthGrid `pick`, Clear date; 1 row and 2 meta read Planned for | planned, error inside the body, largest text (Rows of the month's days) |
| UC-F09-12 See what I wore this month | 1 header Calendar -> 5; month chevrons; Most worn row -> F05; Variety (current month) -> F04 Not worn lately, focus on More | empty (no wears: grid and `calendar.emptyMonth`, both chevrons hidden), empty month, loading (cut-out placeholders), largest text (day Rows at `ax`), bokmål |
| UC-F09-13 Open a day in the calendar | 5 worn day -> day Section (look name, occasion) -> 2 or 3, back with the day still selected | selected day, two wears on one day, missing pieces, largest text |

App-wide rows this flow answers: UC-F12-01 (Looks empty state with one onward action; the calendar empty line has none because it is not a dead end, the back chevron and the grid stay), UC-F12-02 (largest text, `/looks/calendar` included), UC-F12-03 (bokmål, tab `Samling`, `Kalender`), UC-F12-04 (offline: no change), UC-F12-07 (VoiceOver walk: the calendar). Entries owned by other flows that land here: UC-F06-04 ("Wear this" -> Looks worn row and the calendar mark), UC-F06-06 (filled Save icon, "Open look" -> 2), UC-F05-01 ("Used in" row -> 2), UC-F07-08 step 8 (row reads Planned for), UC-F04-12 (Closet Mark as worn: no Looks row and no calendar day). UC-F11-01 step 3 (Profile Most worn) now opens the piece (F05), not this calendar.

## Review log

- Worn and Plan commit on tap, not through `Segmented` or `choice` chips. A Segmented always holds a value and would need a separate commit button; a `choice` chip reads as "radio button, 2 of 2" and flashes blush, which means chosen, not done. `action` chips (`design-system.md` 7) are `button` with no selected state.
- Worn confirms with a ResultBar in its body because a wear needs Undo (UC-F09-09). Plan confirms through the meta line and a queued announcement: a date is a setting the meta already shows, and setting it again is the undo.
- One calendar in the app: Plan (and F07 Choose a date) use `MonthGrid` `pick`, not the native inline date picker, so a chosen day is the `blush` disc everywhere and plum stays for actions. Its Rows form replaces the Earlier / Later 14-day list, and `@react-native-community/datetimepicker` is not added. The native picker's findings (its selected-day contrast, device-language month names and week start, "Earlier" read without an object) go with it.
- Grid or Rows: every F09 target is 44 pt or more. MonthGrid columns are at least 44 pt, otherwise the Row list: the grid needs (window width - 2 x gutter) / 7 of 44 pt or more and 28 x `symbolScale` no larger than the column less 4, and is never used at `ax`. A 375 pt phone keeps the grid up to `large` (49 pt columns, disc 44.5 pt at most); a 320 pt Display Zoom phone (41 pt columns) always gets the Rows.
- The calendar holds outfit wears only. Closet Mark as worn (and "Mark what I wear most" on day one) feeds the piece counts, the wear filters, Rediscover and Variety, never a day, so the first calendar she opens shows only days she dressed, and there is one day row type.
- Variety counts the last 30 days on the owned pool, the window and pool of Not worn lately, so its number and its door are one fact (hand-off rule 7) and add up to the whole closet. Dropping the door and keeping a month number was declined: rule 7. It shows on the current month only, because the 30 days end today.
- Most worn shows only pieces worn twice or more, and the Section only when one exists, so a month of single wears does not list "Once" rows. Variety stands alone after it, because it is not a most-worn piece.
- Day rows carry the occasion only, in the order recorded, no time: a Yesterday wear records when she tapped, not when she wore it, and the look name tells two rows apart.
- Worn-day cut-outs all sit on one `sunken` square (mockup review, 3 Oct): a frame on light pieces only read as a selected state beside the blush day and made the month a checkerboard. The cut-out and the `ink` number mark a worn day, also under Increase Contrast.
- Today selected keeps both cues: the `blush` disc takes today's 1.5 pt `ink` ring as its edge (13.49 on canvas).
- The Rows form lists days in date order, as the grid and its VoiceOver order, so changing text size never reverses the month.
- At `ax` a day's wears open under its own Row (`headless` Expander), not in a Section after a list that could be thirty rows long.
- Only worn days are pressable: a tap on an empty day would only say what the grid shows. Previous stops at the first wear month, so paging back never shows empty years.
- Remove look stays on the detail, not in F10: the builder is `scroll=false` and has no scroll end. It is the only remove; Today's filled Save icon is a door to this detail (F06), not a toggle, as `copy.md`, `motion.md` and `architecture.md` already agreed.
- Removing a look with wears un-saves it and keeps its worn row under the same name (`setNames`), because erasing its `wore` events would change the calendar, Most worn and the piece counts. `look.removeBodyWorn` says so before she confirms.
- Show on Today from a detail in the Today stack pops to the Today root; a tab switch there would show nothing.
- A planned look with gone pieces keeps "Planned for" with the date and drops the occasion, so the date cannot read as a last-worn date.
- Hero pieces push the piece, so the tap learned on Today is never dead, and stay hidden from VoiceOver because the piece rows are the same targets.
- `Samling` against "Ny look" and "Ingen looker ennå": kept. The tab is a place, like "Garderobe"; the UX writer owns this under owner decision 6.
- Empty Looks shows no A mark (UC-F09-01 asked for it): `design-system.md` 15 keeps the mark for Closet empty and Today first run only.
- Contrast, all pairs pass: ink/canvas 13.49, ink/surface 12.84, ink/sunken 11.59, inkMuted/canvas 5.40, inkMuted/surface 5.14, plum/canvas 6.89, onPlum/plum 6.89, onPlum/plumPressed 8.75, error/canvas 7.23, error/surface 6.88, lineField/canvas 3.34 (rename underline, chip edge, light cut-out frame), lineField/surface 3.18 (chip edge in the body), ink on blush 7.12 (selected day), blushStrong on canvas 3.21 (`#9A5A52` 5.31 under Increase Contrast), ink ring on canvas 13.49 (today, and the selected disc's edge on today).
