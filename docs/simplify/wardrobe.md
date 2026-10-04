# Garderobe and adding clothes: simplify proposal

Scope: the Garderobe tab, adding pieces (capture, pieces found, confirm), the cutout editor, piece detail and piece edit.
Rule set: no sheets or floating modals, everything is a pushed screen or inline. Cut hard.

## 1. Findings

### 1.1 "Juster utklipp is completely broken, I cannot see the photo"

Root cause: the cutout canvas has zero height.

- `app/cutout/[id].tsx:161-274` renders `<CameraFrame guide controls>` without the `full` prop. The only children of the frame are absolute fill views (`:220` the backdrop View, `:223` `CutoutEditorView`), so they add no height.
- `src/ui/CameraFrame.tsx:561` `root: { gap }` has no flex, `:563` `frame` has no height, flex or aspect ratio. Only `full` adds `flex: 1` (`:562`, `:568`, applied at `:327` and `:336`).
- The native view therefore gets `bounds = 0x0`. `modules/closet-vision/ios/CutoutEditorView.swift:342-343` `fit()` exits on `guard ... bounds.width > 0, bounds.height > 0 else { return }`, so the scroll canvas and image layers never get a frame.
- The guide pill is positioned inside the same clipped zero height frame, so the "hold on a piece" hint is invisible too. What the owner sees is only the toolbar (two segmented controls plus Angre, Tilbakestill, Zoom) stacked under the header.
- `app/capture/scan.tsx:307` and `:376` pass `full` and work. CameraFrame never had an aspect ratio; the editor screen was introduced without `full` in commit `66f1e9b`.

Secondary issues on the same screen:
- Title mismatch: the stack sets "Juster utklipp" (`app/_layout.tsx:72`), the Screen overrides it with `cutout.title` = "Utklipp" (`src/i18n/nb.ts:1462`).
- First segmented control is labelled `cutout.brush` "Pensel" (`app/cutout/[id].tsx:168`) but its values are Gjenopprett / Visk ut. Second control is brush size S/M/L. Two segmented controls read as settings, not tools.
- With no cutout yet, only the 0.3 alpha faded layer is drawn (`CutoutEditorView.swift:91`, `:277-281`), so even when sized the photo looks washed out until a cutout exists.
- Zoom is a button that duplicates pinch.

Fix: pass `full` to CameraFrame in `app/cutout/[id].tsx`. One line. Then rebuild the toolbar (section 2.5).

### 1.2 "Bilde, Utklipp, Juster, Ren bakgrunn makes no sense"

The photo controls are split across three places with four names for related things.

`src/features/capture/ConfirmPiece.tsx`:
- `:81-86` photo choices: Forbedret, Utklipp, Original, Ren bakgrunn.
- `:258-274` and `:600` the "Juster utklipp" / "Klipp ut selv" button sits right under the hero.
- `:669-710` the choice between those photos lives in a "Bilde" Expander far down the page, after colour, garment and style, with a Cloudflare note and a studio retry inside.

`app/piece/edit/[id].tsx`:
- `:304-316` a ChipRow "Forhåndsvisning" with Original / Utklipp / Forbedret / Ren bakgrunn.
- `:318-334` a separate "Juster utklipp" button below it, then a clean note, then a "Bytt bilde" Expander.

So "Utklipp" is both a photo variant and the editor title, "Juster" edits only the Utklipp variant but sits beside all variants, and "Bilde" is a third label for the same choice. Forbedret and Utklipp look nearly identical to a user.

### 1.3 Several pieces in one photo

Already exists, but the per item edit is weak:
- `src/state/imports.ts:42-62` `parseCapture` runs the parser and writes one region cutout per garment.
- `src/domain/capture.ts:45+` `proposalsFromRegions`, `src/domain/importing.ts:401-433` `splitCapture` creates one job per region (`id-2`, `id-3`, ...).
- `app/capture/group/[id].tsx` (478 lines) is "Pieces found": the photo with numbered boxes, a box editor (move, Smaller/Larger, "Bruk boksen"), a checkbox list, "Koble som sett", "Legg til plagg" to draw a box, then Done opens `/capture/[id]` for the first item.
- `src/features/capture/ConfirmMany.tsx` is a batch confirm that sets one category/kind/style for many ("mixed").

Gaps: you adjust a rectangle, not the cutout. You cannot see each cutout before confirming, the box editor uses buttons instead of drag handles, and per item review only starts after Done, one at a time with no prev/next.

### 1.4 "Possible to scroll too far in Garderobe and not recover"

Three causes stack on the closet ScrollView (`src/ui/Screen.tsx:249-285`):

1. `maintainVisibleContentPosition` is on for Closet (`app/(tabs)/closet/index.tsx:142`, passed at `Screen.tsx:259-263`). In RN Fabric `RCTScrollViewComponentView.mm:1079-1120` the native side adds `deltaY` to `contentOffset` with no clamp to the content size. The anchor is the first visible child of the content container. Content above the grid changes size often: the filter Expander (`src/ui/Expander.tsx:126-135`, animated `layout={reflow}`), ProgressCard, AddedBanner, and the grid itself is re-keyed and crossfaded on every filter change (`src/features/closet/ClosetGrid.tsx:66-69`). When content shrinks under an anchor the offset is pushed past the end and you land in empty space.
2. `automaticallyAdjustKeyboardInsets` is true on Closet (`Screen.tsx:256-258`, no footer while not selecting). The header search bar keyboard plus `keyboardDismissMode="on-drag"` and the tab staying mounted under pushed screens with Fields (`RCTScrollViewComponentView.mm:187-250` listens globally) can leave a stale bottom inset, which is extra scrollable empty space.
3. `useShowPart` (`Screen.tsx:72-111`) scrolls to `offset + delta` with no max offset clamp, triggered when the "Mer" filter Expander opens.

Fix: remove `maintainVisibleContentPosition` from Closet, pass `automaticallyAdjustKeyboardInsets={false}` for Closet (new Screen prop or derive from `search`), clamp `to` in `useShowPart` to `contentHeight - viewport`, and stop re-keying the grid. The grid rebuild in step 6 makes 1 and 3 go away entirely. Verify on device: open and close filters at the bottom, search then push a piece and come back.

### 1.5 "Is the background remover Apple Intelligence?"

No. Two different things run on device, neither is Apple Intelligence:
- Apple Vision `VNGenerateForegroundInstanceMaskRequest`, the same "lift subject" engine as Photos. Plus `VNGeneratePersonInstanceMaskRequest` for people.
- A clothes parser, SegFormer B2 `mattmdjaga/segformer_b2_clothes` (`modules/closet-vision/model/README.md`), 18 classes, 512x512 input.
- "Ren bakgrunn" is separate: the photo is sent to a Cloudflare worker for a generated clean background.

Why items get cropped badly:
- Any photo with more than one item, or a worn photo, uses the parser mask as the final cutout and skips Vision completely (`ClosetVisionModule.swift:466-473`). That mask is coarse: the person box is stretched non uniformly to 512x512 (`ClothesParser.swift:126-137`), logits come out at quarter size (about 128 px of real detail), are upscaled and blurred with sigma 1.5 (`:68-82`). Result: blocky, soft, chewed edges.
- Parser labels outside the Vision person mask are zeroed (`ClothesParser.swift:163-177`). Dupattas, flared hems, sleeves held out and bags past the body outline get cut off.
- `cutoutFrame` adds a 2% inset (`ClothesParser.swift:46-49`), trimming edges further.
- Scan builds the box from parser grid min/max cells with no padding (`src/domain/scan.ts:198-203`), and `cropped()` cuts the image before Vision (`ClosetVisionModule.swift:364-375`), so sleeves and hems at the box edge are lost before masking starts.
- For single item photos Vision merges `allInstances` (`ClosetVisionModule.swift:475-494`), so a hanger, chair or hand is kept and the crop is the union.
- If Vision covers 97% or more (`:402`) it falls back to `heldCutout`, the parser plus a colour consistency filter (colourGap 18) that punches holes in patterned and embroidered fabric. This hits desi wear hardest.
- Flat lay items that touch merge into one region (`GarmentRegions.swift` around `:257`).
- `place()` (`ClosetVisionModule.swift:289-317`) leaves only about 3% margin, so even good cutouts look cramped in tiles.

Concrete fix: parser locates, Vision cuts.
1. Parser output becomes boxes only, padded 10% on each side and clamped to the image.
2. For each box, run `VNGenerateForegroundInstanceMaskRequest` on the padded crop. Pick the single instance with the highest overlap with the parser region instead of `allInstances`.
3. Use the parser mask only to split touching garments (top vs bottom on a worn photo): intersect the Vision instance with a dilated parser mask (about 6 px at 512 grid), never the raw mask.
4. If Vision returns the whole person, intersect with the dilated parser region as in 3. Only fall back to the raw parser mask when Vision returns nothing.
5. Remove the person mask zeroing, or dilate the person mask generously before applying it.
6. Remove the 2% inset, pad the scan box by 10% (`scan.ts:198-203`), drop the colour consistency filter for the fallback.
7. Raise the `place()` margin to about 8%.

## 2. New design per screen

### 2.1 Garderobe (closet tab)

Goal: a calm photo grid, like an Instagram profile of your clothes.

- Large title "Garderobe". Header right: one "+" (Legg til) and "Velg". Native search stays.
- One horizontal chip row: Alle, then categories with pieces. Last chip "Filter" toggles an inline filter row under it (Farge, Sesong, Vis). No Expander, no animated card.
- Grid: 3 columns, square cells, 2 px gaps, edge to edge, cutouts centred on a soft surface tone with 8% padding. No names, no meta line under tiles. Small dot only for "needs details".
- No section headers or counts in "Alle". Sorting is by category order, so the grid still groups visually.
- Above the grid: at most one banner at a time. Progress card while importing, otherwise the "N lagt til" line with one action "Start med disse". Nothing else.
- Long press enters select mode, as today. The select footer keeps 3 actions: Merk som brukt, Koble som sett, Legg bort. Ny look and Start med disse move to a "Mer" action row in the same footer only if room, otherwise cut.
- Virtualized list (FlatList with `numColumns={3}`), no re-key on filter change.

### 2.2 Legg til (capture index)

- Keep the four source rows: Ta bilder, Velg bilder, Skann, Legg til manuelt.
- Cut the tips expander from the page. The lightbulb header item stays as the only entry to tips.
- Grid of jobs stays. A group tile reads "3 plagg" and opens Pieces found.

### 2.3 Plagg funnet (split, `app/capture/group/[id].tsx`)

- Top: the photo with numbered outlines, full width.
- Below: a horizontal strip of the actual cutouts, one card per item, each with a check toggle in the corner.
- Tap a cutout card: push the confirm screen for that item (2.4) with "1 av 3" in the title and Forrige / Neste in the footer.
- Tap an outline on the photo: drag handles to resize and move, live. "Bruk" re-cuts. Cut the Smaller/Larger buttons.
- "Legg til plagg" stays as a text action under the strip.
- "Koble som sett" stays as one toggle row.
- Footer: "Legg til N plagg".

### 2.4 Bekreft plagg (`ConfirmPiece.tsx`)

Top to bottom:
1. Hero cutout.
2. Photo toolbar directly under the hero, one row: segmented Utklipp | Original | Ren bakgrunn, and a scissors icon button "Juster" at the end. "Juster" is disabled on Original.
3. Kind (one chip row, category is implied by kind, a "Bytt kategori" chip opens the category row inline).
4. Colour swatches.
5. Name field, prefilled.
6. Footer: "Ser riktig ut". Text action under it: "Ta på nytt". "Fjern" moves to the header as a trash icon.

Cut: the "Bilde" expander, the Cloudflare note (show it once, inline, the first time Ren bakgrunn is tapped), "Forbedret" as a separate choice (it becomes what Utklipp shows), the style expander (auto labelled, editable later on piece edit), the advice banner. Keep the duplicate banner and the problem banner.

### 2.5 Juster utklipp (cutout editor)

- Title "Juster utklipp".
- Canvas fills the screen above the toolbar (`full`). Photo shown at full opacity, removed areas shown as a checkerboard or 30% dim.
- One bottom toolbar, single row, icons with short labels:
  `[Visk ut] [Gjenopprett]  ·  ● ● ●  ·  [Angre] [Tilbakestill]`
  Tool toggle on the left, three dots for brush size in the middle, history on the right.
- Pinch to zoom, two fingers to pan. Cut the Zoom button.
- Hint pill at the top of the canvas: "Hold på et plagg for å velge det". It hides after the first stroke.
- Footer: "Ferdig" saves and pops.

### 2.6 Plagg (piece detail, `app/piece/[id].tsx`)

- Hero, name, wear line.
- Facts as one wrapped chip line: kind, colour, season. Cut coverage, sparkle, sheer, attributes and weather chips from the default view. They remain on piece edit.
- Sets and "Brukt i" stay.
- One footer action: "Start med dette plagget". Planlegg en dag and Legg i en look move to a single row of two text buttons. "Legg bort" moves to piece edit.
- Header: "Endre".

### 2.7 Endre plagg (`app/piece/edit/[id].tsx`)

- Hero, then the same photo toolbar as 2.4 (shared component).
- "Bytt bilde" becomes one row with two buttons (Ta bilde, Velg bilde), no expander.
- Name, kind, colour, then an "Flere detaljer" inline section with style, coverage, season, sheer, sparkle.
- Bottom: Legg bort, Fjern (destructive). Footer: Lagre.

## 3. Control inventory

### Garderobe

| Control | Where | Decision |
|---|---|---|
| Large title | header | keep |
| + Legg til plagg | header | keep |
| Velg / Avbryt | header | keep |
| Search "Navn eller farge" | header | keep |
| Chip "Mangler detaljer" | filter row | cut, the tile dot is enough |
| Chips Alle + categories | filter row | keep |
| Chip "Mer" + FilterPanel expander | filter row | move to inline "Filter" row |
| Filter Farge | panel | keep |
| Filter Dekning | panel | cut |
| Filter Sesong | panel | keep |
| Filter Vis (ikke brukt, aldri brukt, utilgjengelig, lagt bort) | panel | keep, as one chip group |
| Filter Stil | panel | cut |
| Filter Anledning | panel | cut |
| Fjern filtre | panel | keep, only when a filter is set |
| ProgressCard | top | keep |
| AddedBanner "N lagt til" | top | keep, one line |
| AddedBanner Start med disse | top | keep |
| AddedBanner Koble som sett | top | cut |
| AddedBanner Merk det jeg bruker mest | top | cut |
| AddedBanner Ny look | top | cut |
| AddedBanner missing roles line | top | cut |
| Section titles and counts | grid | cut in Alle |
| Tile name | tile | cut |
| Tile away meta | tile | cut, use a small icon |
| Tile needs details dot | tile | keep |
| Long press select | tile | keep |
| Select: Merk som brukt (I dag / I går) | footer | keep |
| Select: Koble som sett | footer | keep |
| Select: Legg bort / Tilbake | footer | keep |
| Select: Ny look | footer | cut |
| Select: Start med disse | footer | cut |
| ResultBar Angre | footer | keep |
| EmptyState | body | keep |

### Legg til / Plagg funnet

| Control | Decision |
|---|---|
| Ta bilder, Velg bilder, Skann, Legg til manuelt | keep |
| Tips expander on page | cut, lightbulb header stays |
| Velg header | keep |
| Job grid, group tile | keep |
| Footer Legg til / Bekreft N plagg | keep |
| Pieces found photo with boxes | keep |
| Box editor Smaller / Larger buttons | cut, use drag handles |
| Bruk boksen | keep, rename "Bruk" |
| Checkbox list rows | move to cutout strip with check toggles |
| Koble som sett toggle | keep |
| Legg til plagg (draw box) | keep |
| Done opens first review | move to per item review with prev/next |

### Bekreft plagg

| Control | Decision |
|---|---|
| Hero | keep |
| Juster utklipp / Klipp ut selv button | move into photo toolbar |
| Bilde expander (Forbedret, Utklipp, Original, Ren bakgrunn) | move into photo toolbar, cut Forbedret as a choice |
| Cloudflare note | move, show once on first Ren bakgrunn tap |
| Studio retry | keep, inside toolbar state when it fails |
| Colour expander | keep, as inline swatches |
| Garment expander (category + kind) | keep, as one kind chip row |
| Style expander | cut, editable on piece edit |
| Name field | keep |
| Care label row | move to piece detail |
| Fjern | move to header trash icon |
| Ta på nytt | keep, text action |
| Problem banner | keep |
| Duplicate banner | keep |
| Advice banner | cut |
| Footer Ser riktig ut | keep |

### Juster utklipp

| Control | Decision |
|---|---|
| Segmented "Pensel" (Gjenopprett / Visk ut) | keep, as two toolbar icons |
| Segmented brush size S/M/L | keep, as three dots |
| Angre | keep |
| Tilbakestill | keep |
| Zoom button | cut, pinch only |
| Long press select | keep |
| Guide pill | keep, visible once canvas is sized |

### Plagg / Endre plagg

| Control | Decision |
|---|---|
| Detail: hero, name, wear line | keep |
| Detail: Fakta FactChips (kind, colour, season) | keep |
| Detail: coverage, sparkle, sheer, attributes, weather chips | move to edit |
| Detail: AvailabilityChip | keep |
| Detail: sets, care label, brukt i | keep |
| Detail: Legg i en look, Planlegg en dag | keep, one row |
| Detail: Legg bort | move to edit |
| Detail: footer Start med dette plagget | keep |
| Edit: Forhåndsvisning ChipRow | move into shared photo toolbar |
| Edit: Juster utklipp button | move into shared photo toolbar |
| Edit: clean note | move, show once |
| Edit: Bytt bilde expander | keep, as a plain two button row |
| Edit: name, category, kind | keep |
| Edit: set remove ResultBar | keep |
| Edit: remove, save | keep |

## 4. Implementation steps

Each step is one PR sized task, in order. Steps 1 to 3 are bugs and ship first.

1. **Show the photo in the cutout editor.** `app/cutout/[id].tsx`: pass `full` to `CameraFrame`. Drop the `title` override so the stack title "Juster utklipp" shows (`app/_layout.tsx:72`). Verify on device: photo visible, long press selects, save works.
2. **Stop overscroll in Garderobe.** `app/(tabs)/closet/index.tsx:142`: remove `maintainVisibleContentPosition`. `src/ui/Screen.tsx`: add a `keyboardInsets?: boolean` prop (default current behaviour), pass false from Closet. In `useShowPart` clamp `to` to `max(0, contentHeight - viewportHeight)` using the size Screen already tracks in `frame`. `src/features/closet/ClosetGrid.tsx:66-69`: remove `key={gridKey}`. Verify: open and close filters at the bottom, search, push a piece and pop, rotate text size.
3. **Better cutouts.** `modules/closet-vision/ios/ClosetVisionModule.swift`: for region jobs, run Vision on a 10% padded crop of the region and pick the best overlapping instance (`:466-494`), intersect with a dilated parser mask only when the instance spans several garments, raise `place()` margin to 8% (`:289-317`), remove the colour consistency fallback. `ClothesParser.swift`: remove the 2% inset (`:46-49`), dilate instead of hard zeroing by the person mask (`:163-177`). `src/domain/scan.ts:198-203`: pad the box 10%. Verify with the floor and held up photo fixtures, side by side before and after.
4. **One photo toolbar.** New `src/features/capture/PhotoToolbar.tsx`: segmented Utklipp | Original | Ren bakgrunn plus a Juster icon button. Use it in `ConfirmPiece.tsx` under the hero (replace `:258-274`, `:600`, `:669-710`) and in `app/piece/edit/[id].tsx` (replace `:304-334`). Map "Forbedret" into "Utklipp". Update `src/i18n/nb.ts` and `en.ts` keys.
5. **Cutout toolbar.** `app/cutout/[id].tsx`: replace the two Segmented and three buttons with one bottom row (tool toggle, three size dots, Angre, Tilbakestill), remove the Zoom button. `CutoutEditorView.swift:91`: draw removed areas dimmed instead of the 0.3 faded base when no cutout exists.
6. **Grid redesign.** `src/features/closet/ClosetGrid.tsx` to a FlatList, 3 columns, square cells, no section headers in Alle. `src/ui/Tile.tsx`: add a compact variant without name and meta, 8% inner padding. `app/(tabs)/closet/index.tsx`: render the grid as the Screen content with `scroll={false}` and banners as list header.
7. **Cut filters and banners.** `app/(tabs)/closet/index.tsx` and the FilterRow / FilterPanel files: remove Mangler detaljer chip, Dekning, Stil, Anledning; replace the Expander with an inline row. AddedBanner: keep one line plus Start med disse. SelectFooter: drop Ny look and Start med disse.
8. **Split flow.** `app/capture/group/[id].tsx`: replace the checkbox Rows with a horizontal cutout strip, replace Smaller/Larger with drag handles, open per item confirm with "1 av N" and Forrige / Neste. `src/features/capture/ConfirmPiece.tsx`: accept a group position and render prev/next in the footer.
9. **Trim confirm.** `ConfirmPiece.tsx`: remove style expander and advice banner, flatten garment to one kind row, move Fjern to header, care label to piece detail.
10. **Trim piece detail and edit.** `app/piece/[id].tsx` and `src/features/piece/FactChips.tsx`: show kind, colour, season only, one footer action. `app/piece/edit/[id].tsx`: add the "Flere detaljer" inline section, turn Bytt bilde into a two button row, move Legg bort here.
