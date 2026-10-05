# QA: Wardrobe (Garderobe / closet tab)

Simulator: Almari QA 3, Release build 0.1.14 (17). Tested in English and Norwegian, with 0, 11 and 616 pieces and with a corrupt closet.

## 1. Bugs

### 1. Opening most pieces crashes the app (crash)
- Repro: seed the closet, tap any top, tunic, layer, bottom or dress (for example the trousers). The same happens for any piece with a care label.
- Happened: the app crashes with `TypeError: undefined cannot be used as a constructor`. Only hijabs, shoes, bags and accessories open. Edit piece crashes for the same pieces.
- Expected: piece detail opens.
- Screenshot: docs/qa/screens/wardrobe/crash-open-trousers.png
- Source: Hermes has no `Intl.ListFormat`.
  - src/features/piece/FactChips.tsx:272 (coverageFact)
  - app/piece/[id].tsx:35 (labelMeta)
  - app/piece/edit/[id].tsx:422, through moreFacts, then factSpecs, then coverageFact
- Fix: replace ListFormat with a small join helper (`a, b og c` / `a, b and c` from i18n), or construct it lazily with a fallback. Add a Maestro flow that opens a top.

### 2. A corrupt closet is a dead end (broken)
- Repro: `.maestro/lib/break-closet.sh`, then launch.
- Happened: "Could not open your closet" with a "Try again" button that always fails. There is no way out other than deleting the app.
- Expected: a way to recover, such as starting fresh while keeping a copy, or restoring the last good save.
- Screenshot: docs/qa/screens/wardrobe/broken-closet-dead-end.png
- Source: src/state/closet.tsx:80 (retry), src/domain/repository.ts
- Fix: keep a `closet.v3.backup` on each successful load and offer "Restore last save". When that fails too, offer "Start over", which moves the bad blob to `closet.v3.corrupt-<date>`.

### 3. "Mark as worn" shows success but saves nothing (broken)
- Repro: Select a few pieces, then Mark as worn, on a closet where `styling.everyday` is null (no outfit generated yet, as in the seeded closets).
- Happened: a success toast with Undo appears, but the wear count and "Worn lately" do not change.
- Expected: wears are recorded, or the action is hidden.
- Source:
  - src/domain/today.ts:157 (ensureToday returns the closet unchanged when `everyday` is null)
  - src/domain/feedback.ts:280 (woreLately returns unchanged when `today` is null)
- Fix: record `wornOn` on the pieces directly, without needing a Today outfit, and announce success only when the closet changed.

### 4. Clearing filters leaves the old search text in the bar (wrong)
- Repro: type "zzz" in search, then tap "Clear filters".
- Happened: the grid shows everything, but the search bar still says "zzz".
- Expected: the search bar is emptied.
- Screenshot: docs/qa/screens/wardrobe/search-clear-desync.png
- Source: src/features/closet/useClosetScreen.ts:100. The search is uncontrolled `headerSearchBarOptions` in app/(tabs)/closet/index.tsx.
- Fix: pass a `ref` to headerSearchBarOptions and call `ref.current?.clearText()` in clear.

### 5. "Link as a set" with one piece hides all footer actions (wrong)
- Repro: Select, tap 1 piece, then Link.
- Happened: the error text replaces every action button until you toggle a tile.
- Expected: Link is disabled with fewer than 2 pieces, and an error never hides the actions.
- Source: src/ui/Footer.tsx:126 (`rowContent = actionsContent ?? errorText`), src/features/closet/SelectFooter.tsx
- Fix: disable Link when fewer than 2 pieces are selected. Render the error above the actions instead of instead of them.

### 6. Every piece put away gives a dead-end grid (wrong)
- Repro: put away all pieces.
- Happened: "No pieces found" with a "Clear filters" button that does nothing. Category chips for the put-away pieces still show.
- Expected: an empty state like "Everything is put away" with "Show put away".
- Screenshot: docs/qa/screens/wardrobe/all-put-away-dead-end.png
- Source: app/(tabs)/closet/index.tsx:74 (`empty` counts archived pieces), useClosetScreen.ts:71 (`offered` includes archived)
- Fix: base `empty` and `offered` on pieces that are not archived, and add an empty state for "all put away".

### 7. Deleting the last piece in a category leaves a hidden filter (wrong)
- Repro: tap the Sko chip, open the only pair of shoes, Edit, then Remove, and confirm.
- Happened: the closet shows "Fant ingen plagg". The Sko chip is gone, so no chip is highlighted, and the user cannot see why the grid is empty.
- Expected: the filter falls back to All.
- Screenshot: docs/qa/screens/wardrobe/stale-category-after-delete.png
- Source: src/features/closet/useClosetScreen.ts:71
- Fix: when `filter.category` is not in `offered`, reset it to null in an effect, or derive the active category from what is offered.

### 8. "More details" in Edit saves immediately and ignores Cancel (wrong)
- Repro: open Edit on a hijab, change a detail chip, then tap Cancel.
- Happened: the change is already saved.
- Expected: Cancel discards everything on the screen.
- Source: app/piece/edit/[id].tsx:430 (`onChange={update}`)
- Fix: write the change to the local draft state and save it together with Save.

### 9. "Put away" in Edit silently drops unsaved edits (wrong)
- Repro: Edit, change the name, then Put away.
- Happened: the piece is put away and the new name is lost.
- Expected: the edits are saved first, or the user is asked.
- Source: app/piece/edit/[id].tsx:241
- Fix: merge the draft into the update that sets the piece to archived.

### 10. Missing colour or details can never be added (wrong)
- Repro: a piece with no colour or no fabric/fit.
- Happened: there is no chip or field for the missing value anywhere, in detail or in Edit. There is no colour editing at all.
- Expected: empty facts show as "Add colour" or "Add fabric".
- Source: src/features/piece/FactChips.tsx:137, :171, :227 (they return null when the value is missing)
- Fix: return an empty "Add ..." spec when the value is missing. Add a colour picker row to Edit.

### 11. Marking worn twice on the same day counts 2 wears (wrong)
- Source: src/domain/feedback.ts:280. There is no same-day dedupe.
- Fix: skip the append when the last `wornOn` entry is today.

### 12. Edit screen title is "Photo and name" / "Bilde og navn" (polish)
- The screen edits everything: category, details, put away and delete.
- Source: app/piece/edit/[id].tsx:78 and :292
- Fix: use "Edit" / "Endre", or the piece name.

### 13. Select mode stays on as "0 selected" after an action (polish)
- Source: useClosetScreen.ts:103 and :110
- Fix: call setSelecting(false) after Mark as worn, Put away and Link succeed.

### 14. The in-wash (away) marker is nearly invisible (polish)
- A 13px muted moon in the tile corner. Users cannot see at a glance that a piece is in the wash.
- Source: src/features/closet/ClosetGrid.tsx:106
- Fix: dim the tile to 50% opacity and show the moon on a small blurred pill.

### 15. The filter panel has an empty gap at the bottom (polish)
- Source: src/features/closet/FilterPanel.tsx:245 (`minHeight` on the clear row, even when nothing is set)
- Fix: render the row only when a filter is active.

## 2. UX and design problems

- The Filter chip is last in a horizontal row, so you cannot see it without scrolling. Move it first, or into the header next to Select.
- The colour filter shows swatches only, with no labels. Pink and Blush look the same. Add the name under each swatch, or use an accessibility label plus a long-press tooltip.
- The "needs details" dot on tiles has no legend, and the detail page no longer says what is missing. Add an "Add details (2)" row on the detail page.
- With 600+ pieces, "All" has no count and no section headers, and the chips scroll away. Make the chip row sticky, and show "616 pieces" plus category headers in All.
- There is no user sort. Add Newest, Most worn, Least worn and Colour in the Filter panel.
- Search only matches name and colour. "kurta", "Sko" and "jeans" find nothing unless they are in the name. Also match kind and category labels in both languages.
- The empty closet is weak: "Your first piece" with the app icon. Use a real illustration, two clear actions (Scan closet, Add photo) and an optional "Try a sample wardrobe".
- Piece detail: the hero photo takes about 60% of the screen, so the facts, stats and actions sit below the fold. Cap it at about 45% and put wear stats ("Worn 4 times, last 3 Oct") as one line under the name.
- The Edit screen is cramped: the photo buttons, Name and Category have almost no space between them. Use the standard section spacing from DESIGN.md.
- Tiles load full-size 1254px PNGs into small cells. Generate a 300px thumbnail at capture and use it in the grid, which matters for memory on real closets with unique photos.
- Each change rewrites the whole closet JSON (about 200KB at 616 pieces). This is fine for now, but debounce writes or split pieces into rows before closets get large.
- Scroll at 616 pieces was smooth with no blank tiles, but ClosetGrid has no `getItemLayout` and no memoized rows. Add both before it gets worse with real photos.

## 3. Feature and premium ideas (ranked)

1. **Cost per wear and "forgotten" nudges.** Add an optional price field. The detail page shows cost per wear, and the closet gets a "Not worn in 60 days" smart chip with a one-tap "Plan it this week".
2. **Laundry mode.** One tap marks everything worn today as "in the wash". A "Laundry done" button brings it all back. This uses the existing away state.
3. **Smart collections.** Saved filters as chips, such as "Eid ready", "Work" or "Summer hijabs", built from the existing filter state.
4. **Closet stats sheet.** Colour breakdown, category balance, most and least worn, and wears this month, all from data the app already has.
5. **Backup and export.** Export the closet (JSON plus photos) to Files or iCloud, and import it back. This also fixes the corrupt-closet dead end.
6. **Multi-edit.** In Select mode, set season, category or "put away" for many pieces at once.
