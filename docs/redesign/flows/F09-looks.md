# F09 Looks

Routes: `/(tabs)/looks`, `/look/[id]`. Entry: Looks tab; Today "Open look" after Save look (`today.openLook`); piece detail "Used in" rows. Exit: row -> look detail; header New look -> F10. Hand-offs: "Show on Today" -> F06 (records nothing); "Worn" records a wear (Today or Yesterday); "Plan" sets a date on the look in place, and Today shows it first that morning; "Change" (pieces) -> F10.

Sources: `architecture.md` (Owner decisions win), `design-system.md`, `motion.md`, `copy.md` F09, `use-cases.md` F09. Before: `screens/before/tab-looks.png` (one full-width collage per look, intro sentence, "Build a look" text button), `screens/before/look-detail.png` ("Your look" header, name, two meta lines, collage, plum "Change pieces" bar mid-screen, piece names as plain text).

What changes: the list becomes compact rows with one-line metas so several looks fit on one screen; the intro sentence and the "Your look" title go; the look name is the title; piece names become rows that push the piece; one pinned primary ("Show on Today"); Rename, Worn and Plan are one row of chips under the meta line and happen in place; worn rows open the same detail, never the builder, and look like a saved look from the first frame.

## Screens

### 1. Looks (tab root, `/(tabs)/looks`)

Purpose: every saved, worn and planned look, one tap from its detail.

Layout, top to bottom (Tab root recipe):

1. `Screen large`, title `nav.looks`. Header right: `HeaderItem` icon `plus`, label `looks.new`, always, as on Closet, so the header never changes.
2. `Row` list, one per look:
   - `leading: { lay }`, the look's pieces as a `FlatLay` `row` (72 pt, `design-system.md` 6).
   - `title`: look name (worn, not saved: the suggested outfit name).
   - `meta`, one line joined by " · ": occasion (`occasion.*`), then one status: `looks.planned` for an upcoming date, else `looks.worn` for a worn row that is not saved, else `looks.lastWorn`. A date of today or tomorrow reads "today" / "tomorrow" ("Planned for today", "Planlagt i dag"), later days the short date. When pieces are gone, `looks.missingOne` / `looks.missingMany` takes the place of the status; on a planned look with gone pieces the occasion goes instead and the meta reads "Planned for Sat 11 Oct · 1 piece missing", so a row sorted to the top still says why. The piece count is not shown: the lay shows the pieces.
   - `trailing: "chevron"`, `onPress` pushes `/look/[id]`.
3. Order: looks planned for today or later first, nearest date first; then everything else newest first (saved or last worn, whichever is later).
4. One row per piece set. A wear (Wear this on Today, Worn on look detail) whose pieces match a saved look, ignoring order, records on that look: its row moves up and reads `looks.lastWorn`, and no new row is added. A wear that matches an existing worn, not saved row updates that row (date and position). Only a new unsaved piece set adds a `looks.worn` row.
5. No Footer. No Section titles: one list.

```
+--------------------------------------+
|                                   (+)|
| Looks                                |
|                                      |
| [lay] Eid lunch                    > |
|       Eid · Planned for Sat 11 Oct   |
| ------------------------------------ |
| [lay] Ivory work tunic             > |
|       Work · Last worn 12 Sep        |
| ------------------------------------ |
| [lay] Sage and charcoal            > |
|       Everyday · Worn, not saved     |
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

Primary action: tap a row (opens the look). Creating is the header `plus`.

Empty (no looks): `EmptyState` in the upper third, title `looksTab.emptyTitle`, no line, no mark. The header `plus` stays (F10 handles an empty closet, UC-F10-04). Action `primary` regular:

- No pieces: `closet.addPieces` -> `/capture` (F02).
- Pieces, no looks: `looks.new` -> `/look/build` (F10).

```
+--------------------------------------+
|                                   (+)|
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
   - Worn body: `ChipRow` of `action` chips `adjust.today`, `looks.yesterday`. A tap records the wear at once. The chips crossfade into a `ResultBar` in the same body (`checkmark`, `outfit.worn` or `looks.wornYesterday`, quiet `common.undo`). The body reserves the larger of the chip row and the ResultBar, measured at the current text size in English and bokmål; at `large` that is the stacked ResultBar (`design-system.md` 14), so at AX3 "Worn yesterday" / "Brukt i går" gets the full 311 pt line and Undo sits under it. The body does not change size. The ResultBar stays until the user presses or edits something else on the screen (scrolling and VoiceOver focus moves do not count), presses Worn again, or leaves; then the body closes with inline collapse and the wear stays. When that press is below the body (Change, a piece row, Remove look), the body collapses without animation once the alert closes or the detail shows again after the push, so nothing moves under the finger. Undo removes the wear and the chips crossfade back. On an unplanned look the meta line updates in place to the new `looks.lastWorn`; on a planned look the meta keeps `looks.planned` and only the ResultBar confirms the wear.
   - Plan body below `ax`: opens straight onto the native `@react-native-community/datetimepicker` `display="inline"` calendar (never `compact`, which floats a popover, and never a spinner, which fires on scroll), `accentColor` `plum` (selected day `onPlum` on `plum` 6.89, today's number `plum` on `canvas` 6.89), `themeVariant="light"` to match `userInterfaceStyle: light`. It spans the full content width (the body's horizontal padding is cancelled for it, 343 pt on a 375 pt phone, day cells about 49 pt wide), dates from tomorrow on, the planned day preselected. Only a day tap commits; paging months does not. Under it, only when a date is set, `Button quiet` `looks.clearPlan`, leading-aligned. A day tap or Clear date writes at once and the body resolves (inline collapse).
   - Plan body at `ax`: the calendar does not reflow, so it becomes `Row`s of 14 days (title the full date in `body`, trailing `selected` on the planned day). The list opens on the 14-day window, counted from tomorrow, that holds the planned day. A `Row` `looks.earlierDates` comes first on any window after the first, and a `Row` `looks.laterDates` comes last; both are `button` with no chevron (they do not push) and replace the list in place, focus to the first new day row. Clear date as above, after the list. Only a day tap commits.
   - Opening either body follows Inline expand, so the calendar or list scrolls into view and never sits under the Footer.
7. `Section` titled with the piece count (`common.pieceCountOne` / `common.pieceCountMany`), Section action `look.change` (quiet, VoiceOver label `look.changePieces`, "Change pieces" / "Endre plagg", which contains the visible word) -> `/look/build?id=` (F10). Rows: `leading: { thumb }`, title piece name, `trailing: "chevron"`, push `/piece/[id]`. A gone piece has no row (the Banner says it).
8. `Button destructive` `look.remove`, leading-aligned, last in the scroll. System alert `look.removeTitle` / `look.removeBody`. It sits on the detail because a look has no editor with a scroll end (the builder is `scroll=false`); `design-system.md` Detail recipe names this exception.
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
| Eid · Planned for Sat 11 Oct         |
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
| Eid · Planned for Sat 11 Oct         |       | Eid · Planned for Sat 11 Oct         |
| (Rename) (Worn ^) (Plan v)           |  -->  | (Rename) (Worn ^) (Plan v)           |
| +----------------------------------+ |       | +----------------------------------+ |
| | (Today) (Yesterday)              | |       | | v Worn yesterday           Undo  | |
| +----------------------------------+ |       | +----------------------------------+ |
```

Plan open on a planned look:

```
| (Rename) (Worn v) (Plan ^)           |
| +----------------------------------+ |
| [ native inline calendar, full     ] |
| [ content width, 11 Oct selected   ] |
| | Clear date                       | |
| +----------------------------------+ |
```

Primary action: `Footer` "Show on Today". It switches to the Today tab with this look as the outfit and records nothing. VoiceOver focus lands on the Today outfit title (F06); the Generating moment is announced once there, not again here.

#### 2a. Rename in place

Pressing Rename turns the title into a `Field` in the same spot. The Field uses the `title` role (Georgia, same size and line height), with no fill and no box: only the caret and a 1 pt `lineField` underline (3.34 on canvas) drawn inside the title's own bottom padding, so the name, the meta line and everything below stay exactly where they are. It is a `multiline` `TextInput` with `submitBehavior="blurAndSubmit"` and `returnKeyType="done"`, so a long name wraps like the title instead of scrolling sideways, and Return commits instead of adding a line. Prefilled with the display text (soft hyphens from the shared helper, stripped on commit), caret at the end, keyboard up, VoiceOver focus on the Field. Its label is hidden and `look.name` is its VoiceOver label (the rename exception in `design-system.md` 9).

- Commit: the return key (Done), dragging the keyboard down (`keyboardDismissMode="on-drag"`), back or swipe-back, or pressing any other control (a chip, Rename again, a row, the Footer), which commits first and then acts. An empty or unchanged name drops and keeps the old one.
- VoiceOver escape (two-finger Z, `onAccessibilityEscape` on the Field) drops the edit and returns focus to the title header; a second escape pops.
- It counts as the screen's open Expander: pressing Rename closes Worn or Plan, and opening one of those commits or drops the rename.
- After commit, focus returns to the title (header). The back menu and the Looks row follow the new name.
- The Footer does not ride the keyboard during rename: it stays at the bottom, under the keyboard, because Done and dragging the keyboard down commit. The Field scrolls into view above the keyboard. At AX3 on a 667 pt phone, the 64 pt bar and the 260 pt keyboard (with the QuickType bar) leave about 343 pt, enough for a three-line Georgia Field at the 52 pt cap (about 192 pt) plus a `common.error.save` footnote (about 48 pt) in both languages. Lane 1 confirms these heights at AX3 in English and bokmål.

```
| Eid lunch                            |   -->   | Eid Saturday|                        |
| Eid · Planned for Sat 11 Oct         |         | ------------------------------------ |
                                                 | Eid · Planned for Sat 11 Oct         |
```

### 3. Look detail, worn and not saved (`/look/[id]` from a worn row)

Purpose: keep an outfit that was worn but never saved, without going through the builder.

Same skeleton as Screen 2, fewer parts:

1. `Screen`, `leading="back"`, `title` = the suggested name (same rule: VoiceOver and back menu only).
2. `FlatLay` hero, `title` = the suggested name. Pieces push as on Screen 2.
3. Meta line: occasion · `looks.lastWorn`.
4. `ChipRow` with `look.rename`. Worn and Plan are rendered hidden after it (opacity 0, `pointerEvents="none"`, hidden from VoiceOver, as Footer Waiting), so the row has the saved state's height from the first frame. Rename works as 2a; the new name stays on the worn row, and Save look keeps it.
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
| Everyday · Last worn 12 Sep          |
| (Rename)                             |
|                                      |
| 4 pieces                             |
| [t] Sage kurta                     > |
|  ...                                 |
+--------------------------------------+
| (            Save look           )   |
+--------------------------------------+
```

After Save look: `success` haptic. The Footer label changes in place to `looks.showOnToday` (`motion.md` > Banners and bars, label that changes in place) and `result.saved` is announced; focus stays on the Footer button. No ResultBar. Worn, Plan and "Change" fade in where their space was reserved, and Remove look appears at the end of the scroll. Nothing moves. The screen is now Screen 2.

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

## States

| State | Screen | What shows |
|---|---|---|
| Empty, no pieces | Looks | `EmptyState` `looksTab.emptyTitle` + primary `closet.addPieces` -> F02. Header `plus` stays |
| Empty, pieces but no looks | Looks | `EmptyState` `looksTab.emptyTitle` + primary `looks.new` -> F10. Header `plus` stays |
| First run | Looks | The empty state above. The first row arrives after the first "Wear this" (worn row) or "Save look" on Today, or a save in the builder |
| Loading | Looks | Closet not opened yet: three `Silk placeholder` rows in the exact `Row` shape (text hidden, so the height follows Dynamic Type). The list container carries `common.loading` and `accessibilityState.busy`; rows are hidden until resolve |
| Loading | Look detail | The push renders complete. If the closet has not opened (cold deep link), the hero is a `Silk placeholder` in the flat-lay shape and the title and meta lines are text placeholders. Photos that decode late fade in |
| Generating | Look detail -> Today | No generating on these screens. "Show on Today" hands off to Today, which plays the Generating moment (F06) |
| Busy | Look detail | Footer "Show on Today" and "Save look": `Silk busy`. Chips in Worn, calendar days, date rows, Clear date and the rename Field: in-flight rule (disabled look only after `wait`). Remove look: busy after the alert |
| Error, save | Look detail | Worn or Plan write fails: `footnote` `error` `common.error.save` at the end of the open body, which stays open. Rename fails: `Field` error `common.error.save` under the title Field, the old name stays. Save worn look fails: the Footer `error` slot (`design-system.md` 3), announced; the Footer stays "Save look" |
| Error, remove | Look detail | `footnote` `error` `common.error.remove` directly under Remove look; the look stays |
| Missing pieces | Looks, Look detail | Row meta `looks.missingOne` / `looks.missingMany` in place of the status; on a planned look in place of the occasion ("Planned for Sat 11 Oct · 1 piece missing"). Detail: `Banner notice` under the meta line, sentence only; "Change" on the Section repairs it. Show on Today still works: Today shows the variant card (UC-F06-08) |
| Gone | Look detail | Screen 4 |
| Planned | Looks, Look detail | Row and meta read `looks.planned`, "today" and "tomorrow" for those days. The date leaves once the day has passed and the meta falls back to `looks.lastWorn` |
| Worn again | Looks | A wear of a saved look's pieces records on that look (row moves up, `looks.lastWorn`); a repeated unsaved set updates its worn row. Never a second row for the same pieces |
| Offline | All | No change. Looks, pieces and photos are local; nothing in this flow uses the network (UC-F12-04) |
| Permission denied | All | Not applicable. This flow asks for no permission |
| Largest text (AX3) | All | Lane 1 verifies: Looks rows put the 72 pt lay above the text with the chevron trailing on the lay line, so "Bryllupsmiddag" (about 309 pt at 45 pt) fits the full 343 pt on one line. The detail title (Georgia, 52 pt cap, about 360 pt for the word) and the rename Field break at the soft hyphen ("Bryllups-middag"), never mid-syllable. The Worn ResultBar stacks (text line, Undo under it) inside the reserved body. ChipRows wrap. Plan's calendar becomes the 14-day `Row` list. Section action "Change" wraps under the Section title. Footer primary stays pinned and grows, and stays under the keyboard during rename. EmptyState title wraps, button full label |
| Bokmål | All | Tab and title `Samling`. "Ny look", "Vis på I dag", chips "Endre navn", "Brukt", "Planlegg", "I dag", "I går", "Fjern dato", day list "Tidligere", "Senere", Section action "Endre" (VoiceOver "Endre plagg"). Meta "Eid · Planlagt lør. 11. okt.", "Planlagt i dag", "Brukt, ikke lagret", "Sist brukt 12. sep.". Empty "Ingen looker ennå". Gone "Denne looken er ikke her lenger". Every label sits in a wrapping container; nothing truncates |
| Reduce Motion | All | Fallbacks per Motion below |

## Motion

All tokens from `motion.md`.

| Where | Motion |
|---|---|
| Row -> look detail, back | Push and pop: native stack transition. The detail renders complete; late photos fade in (`base`, `silk`) |
| "Open look" on Today, "Used in" on a piece, hero piece | Same push |
| Rows loading | Loading moment: placeholder at once; after `wait` the `sheen` band crosses the rows on one clock (`carry`); resolve fades rows in over the placeholders (`base`, `silk`), band out (`quick`) |
| New or moved row (a save in the builder, Save look on Today, a wear) | While Looks is on screen when it arrives: list insert, opacity 0 to 1 (`base`, `silk`), neighbours reflow (`settle`, `silk`); a worn saved look moves up with the same reflow. On a later visit the list is already in its final layout and only a new row fades in (`base`, `silk`), as `motion.md` > Pop to a tab after a flow |
| Remove look | After the system alert has gone, the detail pops. Once the pop has settled, the row plays list remove on Looks: opacity to 0 (`quick`, `release`), neighbours close the gap (`settle`, `silk`). Focus moves to the next row |
| Worn, Plan | Inline expand under the ChipRow: the body grows (`settle`, `silk`), siblings below glide down, content enters after `step` (opacity, translateY 4 to 0, `base`, `silk`). Chevron rotates (`settle`, `silk`). Swapping Worn and Plan: old content out (`quick`), height eases to the new content (`settle`, `silk`), new content in (`base`, `silk`). Resolve: inline collapse (`quick`, `release`, then `settle`, `silk`). Collapse after a press below the body: no animation, after the alert or on return |
| Day list Earlier / Later (`ax`) | Rows crossfade in place: old out (`quick`), new in (`base`, `silk`); the body height eases if the row count changes (`settle`, `silk`) |
| Action chip tap (Today, Yesterday), Rename, Clear date | `press` only. Chips never take the selected state. No haptic (`motion.md` > Haptics) |
| Worn result | In the body: chips and the `ResultBar` crossfade in the reserved height (outgoing `quick`, `release`; incoming `base`, `silk`). Undo crossfades back. Leaving the result: inline collapse |
| Meta line after Worn, Plan, Rename | Label change in place: old text out (`quick`), new text in (`base`), height held until the fade ends |
| Rename | No crossfade and no movement: the caret appears and the underline fades in (`quick`). Keyboard: system curve; the Footer stays under it |
| Save worn look | `success` haptic. Footer label change in place (`quick` out, `base` in). Worn, Plan and "Change" fade in in their reserved space (`base`, `silk`), Remove look fades in (`base`, `silk`). No expand |
| Show on Today | Tab switch: none, instant. Today then plays the Generating moment: only changed slots swap in dressing order, `step` apart (`arrange`, `fall`). The look detail stays in the Looks stack |
| Missing pieces Banner | Present on arrival, no expand |
| Reduce Motion | Push: system. Loading: placeholders stay still with no band (`motion.md` Loading), rows fade in (`base`); a busy Footer button shows the still band at its centre, in after `wait` and out at resolve (`base`). Insert, move and remove: fades (`base`), neighbours move in one frame. Bodies: layout in one frame, content fades (`base`), chevron in one frame, `scrollTo` not animated. Day list swap: layout in one frame, rows fade (`base`). Save worn look: chips, "Change" and Remove look fade in (`base`). Label, meta and ResultBar crossfades at `base`. Today's swap after Show on Today crossfades in place (`base`) |

VoiceOver:

- Look row label: "{name}, {occasion}, {count or missing}, {status}", parts joined with ", ", dates with `dateStyle: "full"`. The count is spoken even though it is not shown; `looks.missingOne` / `looks.missingMany` replace it when pieces are gone. No hint: the button role and chevron say it opens. The lay is hidden.
- Look detail: the screen name is the look name. Focus starts on the title (header). The hero pieces are hidden; the title comes before the Banner.
- Worn: the ResultBar replaces the chip that was pressed, so its text takes focus and is not announced (`design-system.md` 14 > Focus). After Undo, focus returns to the Today or Yesterday chip that was pressed. When the body closes because Worn was pressed again, focus goes to the Worn chip; when it closes because something else was pressed, focus stays on, or follows, what was pressed.
- Plan: exception to `design-system.md` > Accessibility rules > Focus ("resolves: next sibling"). When Plan resolves, focus goes to the Plan chip, and the new meta is announced queued: `looks.planned` with the full date ("Planned for Saturday 11 October") or `looks.planCleared`. Earlier and Later: focus to the first new day row.
- Rename: focus goes to the Field on open and back to the title on commit or escape.
- Save worn look: focus stays on the Footer button, whose label switches at once; `result.saved` is announced once, queued.
- Rename, Worn and Plan chips: `button`. Worn and Plan carry `accessibilityState.expanded`. Action chips have no selected state.

## Copy

Keys from `copy.md` F09 unless noted.

| Where | Keys |
|---|---|
| Tab title and label | `nav.looks` |
| Header `plus` | `looks.new` |
| Row | `occasion.*`, `looks.missingOne`, `looks.missingMany`, `looks.planned`, `looks.worn`, `looks.lastWorn`; VoiceOver adds `common.pieceCountOne`, `common.pieceCountMany` |
| Empty | `looksTab.emptyTitle`, `closet.addPieces`, `looks.new` |
| Loading | `common.loading` (VoiceOver) |
| Detail title | look name; rename Field VoiceOver label `look.name` |
| Detail meta | `occasion.*`, `looks.planned`, `looks.lastWorn` |
| Chips | `look.rename`, `look.markWorn`, `looks.plan` |
| Missing Banner | `look.missingOne`, `look.missingMany` |
| Worn | `adjust.today`, `looks.yesterday`; ResultBar `outfit.worn`, `looks.wornYesterday`, `common.undo` |
| Plan | `looks.clearPlan`, `looks.earlierDates` and `looks.laterDates` (`ax` list), `looks.planCleared` (VoiceOver) |
| Pieces Section | `common.pieceCountOne`, `common.pieceCountMany`, `look.change` (VoiceOver label `look.changePieces`) |
| Remove | `look.remove`, `look.removeTitle`, `look.removeBody` |
| Footer | `looks.showOnToday`; worn not saved: `common.saveLook`, then `looks.showOnToday` with `result.saved` announced |
| Errors | `common.error.save`, `common.error.remove` |
| Gone | `look.goneTitle`, `common.goBack` |

Keys added or changed in `copy.md` F09: `looks.clearPlan` is "Clear date" / "Fjern dato"; new `looks.planCleared` (Plan cleared / Planen er fjernet), `looks.laterDates` (Later / Senere), `looks.earlierDates` (Earlier / Tidligere), `look.change` (Change / Endre), `look.markWorn` (Worn / Brukt); `look.rename` is "Rename" / "Endre navn"; `look.changePieces` NB is "Endre plagg"; `looks.planned` takes "today" / "tomorrow"; `looks.open`, `adjust.pickDate` and `adjust.tomorrow` are out of F09.

## Use cases

| ID | Screen | State |
|---|---|---|
| UC-F09-01 Start with no looks | 1 Looks, empty | empty (no pieces -> Add pieces; pieces -> New look), header plus present, first run, bokmål |
| UC-F09-02 Browse looks | 1 Looks, rows; row -> 2 | loading, missing pieces, planned, largest text |
| UC-F09-03 Save a worn outfit | 3 Worn not saved -> 2 in place | busy, error (Footer `error` slot), Footer label change, nothing moves |
| UC-F09-04 Show a saved look on Today | 2 Footer "Show on Today" -> F06 | hand-off, Today generating; no wear recorded here. "Wear this" on Today then records on this look: its row moves up and reads Last worn, no new row |
| UC-F09-05 Open a piece from a look | 2 Pieces Section row or hero piece -> piece detail, back | default |
| UC-F09-06 Change the pieces of a look | 2 Section action "Change" -> F10 push, detail updated on return | default |
| UC-F09-07 Remove a look | 2 Remove look -> system alert -> pop, row removed on 1 after the pop | busy, error by the button |
| UC-F09-08 A look with missing pieces | 2 missing Banner (sentence, under the meta) and Section action "Change"; 4 gone with "Go back" | missing pieces, gone |
| UC-F09-09 Mark a look as worn | 2 Worn chip, action chips Today / Yesterday, ResultBar with Undo in the body; 1 row reads Last worn | busy, error inside the body, largest text (stacked ResultBar) |
| UC-F09-10 Rename a look | 2a Rename chip, title becomes the Field in place, Done | error (Field), empty keeps old name, escape drops, largest text |
| UC-F09-11 Plan a saved look for a day | 2 Plan chip: calendar, Clear date; 1 row and 2 meta read Planned for | planned, error inside the body, largest text (day list with Earlier and Later) |

App-wide rows this flow answers: UC-F12-01 (Looks empty state with one onward action), UC-F12-02 (largest text), UC-F12-03 (bokmål, tab `Samling`), UC-F12-04 (offline: no change). Entries owned by other flows that land here: UC-F06-06 ("Open look" -> 2), UC-F05-01 ("Used in" row -> 2), UC-F07-08 step 8 (row reads Planned for).

## Review log

- Worn and Plan bodies commit on tap, not through `Segmented` or `choice` chips. A Segmented always holds a value and would need a separate commit button; a `choice` chip reads as "radio button, 2 of 2" and flashes blush, which means chosen, not done. `design-system.md` 7 has the `action` kind (`button`, no selected state).
- Worn confirms with a ResultBar in its body because a wear needs Undo (UC-F09-09). Plan confirms through the meta line and a queued announcement: a date is a setting that the meta already shows, and setting it again is the undo.
- Row `lay` is 72 pt on Looks rows (`design-system.md` 6 and 11). At `ax` the chevron moves to the lay line, now in `design-system.md` 6.
- Pressable title: solved with the Rename chip. The title stays a plain `header` labelled with the look name.
- Rename is a `control` chip with no glyph (it opens the Field, it writes nothing), so the whole ChipRow is `control`, matching the Detail recipe. `design-system.md` 7 says so.
- The chip labels were shortened so the row fits one line at default size in bokmål. `look.markWorn` is a new key ("Worn" / "Brukt") because Closet's select footer keeps `looks.markWorn` "Mark as worn" as its commit label.
- Plan opens straight onto the calendar; the nested "Choose a date" chip and Tomorrow are gone (the calendar starts at tomorrow). F07 keeps its own "Choose a date" chip because there Today and Tomorrow are choices of a setting, not shortcuts.
- Bar title: dropped, as F05 piece detail. Both Detail screens pass `title` for VoiceOver and the back menu only, and focus the content title after the push.
- Footer error slot: `design-system.md` 3 now has `error?: string`, drawn inside the Footer above the buttons. F02, F05, F06 and F09 point at it.
- Planned look with gone pieces keeps "Planned for" with the date and drops the occasion, rather than a bare date, so the date cannot read as a last-worn date.
- Hero pieces push the piece, so the tap learned on Today is never dead. They stay hidden from VoiceOver because the piece rows are the same targets; `design-system.md` 11 says so.
- `Samling` against "Ny look" and "Ingen looker ennå": kept. `copy.md` Glossary names the tab as a place, like "Garderobe", which holds looks as Garderobe holds plagg; one term per concept holds (place vs item). The UX writer owns this under owner decision 6.
- Reduce Motion, Loading: placeholders stay still with no band, per `motion.md` Loading.
- The inline date picker is shared with F07. Lane 1 adds `@react-native-community/datetimepicker` (native, no sheet). On the 375 pt phone day cells are about 49 pt wide (343 / 7); Lane 1 checks day-cell height at `large` (1.35 to 1.6), where the calendar is still used. Every other F09 target meets 44 pt: Row 52, chips, Section action, Remove look, Clear date 44, header plus 44, Footer 52.
- Remove look stays on the detail, not in F10: the builder is `scroll=false` and has no scroll end.
- Contrast, all F09 pairs pass: ink/canvas 13.49, ink/surface 12.84, ink/sunken 11.59, inkMuted/canvas 5.40, inkMuted/surface 5.14, inkMuted/sunken 4.64, plum/canvas 6.89, plum/surface 6.56, plum/sunken 5.92, onPlum/plum 6.89, onPlum/plumPressed 8.75, error/canvas 7.23, error/surface 6.88, error/sunken 6.21, lineField/canvas 3.34 (rename underline, chip edge on canvas), lineField/surface 3.18 (chip edge in the body).
- UC-F09-01 says the empty state shows the A mark; `design-system.md` 15 keeps the mark for Closet empty and Today first run only. This flow follows the design system.
- UC-F09-01 "Build your first look" and UC-F06-06 "Saved, open" are renamed by `copy.md` to "New look" and "Open look". UC-F09-04, -09 and -11 in `use-cases.md` now match this flow (wear on the saved look, "Worn", calendar with "Clear date").
