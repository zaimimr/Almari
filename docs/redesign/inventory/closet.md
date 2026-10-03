# Inventory: Closet area

Scope: Closet tab (`app/(tabs)/closet`), `app/piece/new`, `app/piece/[id]`, `app/piece/edit/[id]`, `app/label/[id]`, `app/cutout/[id]`, `src/features/PieceEditor.tsx`, `PieceSections.tsx`, `AttributeEditor.tsx`, `SamplePoints.tsx`, plus `MissingPiece.tsx` (shared fallback). Read from code on main at `0ea6928`.

Global context that shapes this area:

- `canPrepareOnDevice = ClosetVision.isAvailable()` (`src/state/imports.ts:25`). True on iOS dev/release builds with the native module. Gates cutout, care label and background photo preparation.
- `addPiecesRoute = canPrepareOnDevice ? "/capture" : "/piece/new"` (`src/state/imports.ts:26`). Every "Add pieces" entry point uses it, so on iOS the manual editor is only reached through capture.
- `studioAvailable = Boolean(studioUrl && studioToken)` (`src/state/studio.ts:26`). Gates the Studio photo chip.
- The whole app sits behind `ClosetProvider` which renders its own loading and error screen before any route mounts (`src/state/closet.tsx:62-86`).
- Native tabs on iOS (`src/navigation/Tabs.native.tsx`, SF symbol `hanger` for Closet), JS tabs elsewhere (`src/navigation/Tabs.tsx`, Feather `grid`).
- `SamplePoints.tsx` is not used by any closet route. Its only consumer is `app/onboarding/colours.tsx:148` (selfie colour sampling). Listed here because it was assigned, documented under Magic moments.

## Routes

| Path | Title (EN / NB) | How reached | Presentation |
|---|---|---|---|
| `/(tabs)/closet` (`app/(tabs)/closet/index.tsx`) | Large title "Your closet" / "Garderoben din" (`closet/_layout.tsx:8`). Tab label "Closet" / "Garderobe" | Tab bar. `MissingPiece` "Go to closet" (`router.replace("/closet")`, `MissingPiece.tsx:14`). `PieceEditor.remove` (`router.dismissTo("/closet")`, `PieceEditor.tsx:251`) | Tab root inside its own Stack with `largeTitleOptions` (Georgia large title) |
| `/piece/new` (`app/piece/new.tsx`) | "Add a piece" (`_layout.tsx:31`, re-set in `PieceEditor.tsx:263`) | `addPiecesRoute` when no on-device vision: Closet header "Add pieces" (`closet/index.tsx:118`), Closet empty "Add your first piece" (`:242`), Today problem action `add-pieces` (`today/index.tsx:195`), Looks empty (`looks/index.tsx:59`), onboarding finish (`onboarding/index.tsx:155`). Always: capture screen "Add without photo preparation" (`capture/index.tsx:373`) | **Modal** (`presentation: "modal"`, `_layout.tsx:29-32`). From capture it is a modal on top of the capture modal |
| `/piece/[id]` (`app/piece/[id].tsx`) | "Your piece" / NB equivalent (`_layout.tsx:33`, re-set `:111`) | Tap a tile on Closet (`closet/index.tsx:278`). Today problem action `edit-piece` (`today/index.tsx:206`) | Push (root stack) |
| `/piece/edit/[id]` (`app/piece/edit/[id].tsx`) | "Edit piece" (`_layout.tsx:36`, `PieceEditor.tsx:263`) | Header right "Edit" on piece detail (`piece/[id].tsx:113-121`) | Push. Custom headerLeft "Back" replaces native back (`PieceEditor.tsx:264-268`) |
| `/label/[id]?target=piece\|import` (`app/label/[id].tsx`) | "Care label" (`_layout.tsx:61-63`) | Piece detail "Add care label" / "View or edit care label" (`piece/[id].tsx:229-240`, target `piece`). Capture check "Add care label" offer (`capture/[id].tsx:175`, target `import`) | Push. When reached from capture it is pushed on top of the capture modal |
| `/cutout/[id]?target=piece\|import` (`app/cutout/[id].tsx`) | "Adjust cut-out" or "Cut out by hand" depending on whether a cutout exists (`_layout.tsx:52-54` sets "Adjust cut-out"; `cutout/[id].tsx:112` overrides) | Edit piece button (`PieceEditor.tsx:319-332`, target `piece`). Capture check (`capture/[id].tsx:389`, `:441`, target `import`) | Push with `gestureEnabled: false` (no swipe back). Custom headerLeft "Cancel" (`cutout/[id].tsx:113-118`) |
| Fallback `MissingPiece` | "This piece is no longer here" | Rendered by `piece/[id]`, `piece/edit/[id]`, `label/[id]`, `cutout/[id]` when the id is not found | Inline replacement of the screen body, inherits host header |

## User actions

### Closet tab (`app/(tabs)/closet/index.tsx`)

| Route | Action | Result | Data read / written |
|---|---|---|---|
| Closet | Open tab | Grid of non-archived pieces, 2 columns, intro count line | Reads `closet.pieces` via `shelf(pieces, false)` |
| Closet | Tap "Add pieces" (header right, always shown) | Push `addPiecesRoute` (capture modal on iOS, piece/new modal otherwise) | None |
| Closet | Tap "Select" (header left, only when more than 1 piece) | Enters select mode: tiles toggle selection, set hint + "These belong together" button appear in list header, header left becomes "Cancel" | Local state |
| Closet (select) | Tap tiles | Toggle chosen; tile shows "Selected" badge | Local state |
| Closet (select) | Tap "These belong together" (enabled at 2+) | `linkSet(current, chosen, uuid)`; exits select mode; shows "Linked as a set. Open a piece to see or change its set." | Writes `piece.setId` on chosen pieces |
| Closet (select) | Tap "Cancel" | Exit select mode, clears choice | Local state |
| Closet | Tap "Build a look" (only when sample pieces exist) | Push `/look/build` (modal) | None |
| Closet | Type in "Find a piece" field | Filters by name substring (case-insensitive). Name only, not colour or category | Local state |
| Closet | Tap category chip (All + every category, always all shown) | Single-select category filter | Local state |
| Closet | Tap style chip (Desi, Western) | Toggle style filter | Local state |
| Closet | Tap occasion chip (all occasions) | Toggle occasion filter (pieces with no occasions always pass) | Local state |
| Closet | Tap "Available" / "Unavailable" | Toggle availability filter | Local state |
| Closet | Tap "Archived (n)" (shown when any archived or already on) | Switches grid to archived pieces only | Reads `shelf(pieces, true)` |
| Closet (no match) | Tap "Clear filters" | Resets search, filter, archived toggle | Local state |
| Closet (empty) | Tap "Add your first piece" | Push `addPiecesRoute` | None |
| Closet | Tap a tile (not selecting) | Push `/piece/[id]` | None |

### Piece detail (`app/piece/[id].tsx`, `src/features/PieceSections.tsx`)

| Route | Action | Result | Data read / written |
|---|---|---|---|
| Piece | Open | Photo (280 pt), name, "Used in n saved looks", sections below | Reads piece, `usedIn(closet, id)`, `setMembers`, `pieceFacts` |
| Piece | Tap "Edit" (header right) | Push `/piece/edit/[id]` | None |
| Piece | Tap "Style this piece" (shown when piece has no status and `closet.styling.everyday` is set) | `stylePiece` builds a Today session around it, then `router.navigate("/today")` (switches tab) | Writes `styling.today` session |
| Piece | Tap a guessed fact chip (dashed, "?") | Opens inline question card under Details with option chips | Local state |
| Piece (question) | Tap an option chip | `confirmFact(key, option)`; card closes | Writes `piece.attributes[key]`, `sources[key] = confirmed` |
| Piece (question) | Tap "Looks right" | Confirms current suggested value | Same as above |
| Piece (question) | Tap "Not now" | Closes card | Local state |
| Piece | Weather: tap Warmth Light/Medium/Warm (tops, tunics, dresses, layers) | `confirmPiece(... traits.warmth)` immediately | Writes `traits.warmth`, source confirmed |
| Piece | Weather: tap Rain / Snow yes or no (shoes) | `confirmPiece(... traits.rain/snow)` immediately | Writes `traits.rain` / `traits.snow` |
| Piece | Care label: tap "Add care label" / "View or edit care label" (owned piece and on-device only) | Push `/label/[id]?target=piece` | None |
| Piece | Set: tap "Remove from this set" (if in a set) | `unlinkPiece` | Clears `setId` (and the set if 1 left) |
| Piece | Availability: tap "In the wash" / "Lent out" / "Needs repair" (not archived) | `setAway(reason)` + `dropFromToday`; tapping the selected reason clears it | Writes `status: "away"`, `away`; removes from today's outfit |
| Piece | Tap "Mark as available" | `setAway(null)` | Clears `status`, `away` |
| Piece | Archive: tap "Archive this piece" | `setArchived(true)` + `dropFromToday`; no confirm | Writes `status: "archived"` |
| Piece | Archive: tap "Back in my closet" | `setArchived(false)` | Clears status |
| Piece | Native back | Pop to previous (closet or Today) | None |

### Add / edit piece (`app/piece/new.tsx`, `app/piece/edit/[id].tsx`, `src/features/PieceEditor.tsx`, `src/features/AttributeEditor.tsx`)

| Route | Action | Result | Data read / written |
|---|---|---|---|
| New / Edit | Tap "Choose a photo" / "Change photo" | System photo library picker; sets local image, `newImage = true` | Local state |
| New / Edit | Tap "Take a photo" (not web) | Requests camera permission, opens camera | Local state; permission prompt |
| Edit (owned with variants) | Tap "Enhanced" / "Plain" chip | Swaps shown photo variant (saved on Save) | Local state, written to `piece.photo` on Save |
| Edit (owned with variants, Studio configured) | Tap "Studio" when not made | `useStudioMaker.make` sends photo to Cloudflare, chip reads "Making studio photo"; on success **saves immediately** to `variants.studio` and shows it | Network; writes `variants.studio` + new file outside the Save flow |
| Edit | Tap "Studio" when made | Shows studio variant | Local state |
| Edit (owned, on-device, cutout source exists) | Tap "Adjust cut-out" / "Cut out by hand" | Push `/cutout/[id]?target=piece` | None |
| New / Edit | Type name (max 80) | Local state | Local |
| New / Edit | Tap category pill | Sets category; resets subcategory; clears styles if they were fixed | Local |
| New / Edit | Tap subcategory chip | Sets kind; fixed-style kinds set styles automatically and replace the style chips with "{styles}, set by the subcategory" | Local |
| New / Edit | Tap Desi / Western chips | Toggle worn styles (both allowed) | Local |
| New / Edit (not sample, category set) | Details: tap attribute option chip | `confirmAttribute`; source label flips to "Confirmed" | Local, written on Save |
| New / Edit | Details: tap "Looks right" on a suggested attribute | Confirms suggested value | Local, written on Save |
| New / Edit | Tap "Add to closet" / "Save changes" | Copies new photo into app storage, `savePiece`, discards old photo files if replaced, runs `measurePiece` in background when photo changed (re-prepare: cutout, enhanced, colours, embedding), `router.back()` | Writes piece; file system; background vision |
| Edit | Tap "Remove piece" | Native Alert confirm (body mentions saved looks count); `removePiece` + `unlinkPiece`; deletes files not used elsewhere; `router.dismissTo("/closet")` | Deletes piece, photo files, label photo |
| New | Tap "Cancel" (header left) | `router.back()`; discard Alert if dirty | None |
| Edit | Tap "Back" (header left) or swipe | `router.back()`; discard Alert if dirty ("Discard your changes?") | None |

### Care label (`app/label/[id].tsx`)

| Route | Action | Result | Data read / written |
|---|---|---|---|
| Label | Tap "Take a photo" / "Take another photo" (not web) | Camera permission, camera, then on-device OCR (`readCareLabel`) | Writes new label photo file (unsaved until Save) |
| Label | Tap "Choose a photo" | Library picker, then OCR | Same |
| Label | Edit fibre / percent / size / brand / made in fields | Local draft | Local |
| Label | Tap "Remove fibre n" | Drops a material row | Local |
| Label | Tap "Add a fibre" | Adds empty material row | Local |
| Label | Tap "Save care label" | `setPieceLabel` or `setImportLabel`; deletes previous label photo if replaced; `router.back()` | Writes `piece.label` or `import.label` |
| Label (saved label exists) | Tap "Remove care label" | Native Alert confirm, clears label, deletes photo, back | Clears label, deletes file |
| Label | Native back | Pops; unsaved new photo deleted on unmount; **no discard prompt** for edited fields | Deletes unsaved photo |

### Cutout editor (`app/cutout/[id].tsx`, native `CutoutEditorView`)

| Route | Action | Result | Data read / written |
|---|---|---|---|
| Cutout | Open | Native view loads original + cutout mask on a dark canvas; spinner until ready | Reads `pieceCutout(piece)` or `importCutout(job)` |
| Cutout | Drag one finger | Paints with current mode (Restore adds, Erase removes) | Native mask |
| Cutout | Two-finger pan / pinch | Pan and zoom canvas | Native |
| Cutout | Long press (0.4 s) on a garment | On-device instance selection; spinner at finger, haptic, mask replaced with selected object, white outline sweep glow; hides "Hold on a piece to select it" hint | Native mask |
| Cutout | Tap "Restore" / "Erase" chip | Brush mode | Local |
| Cutout | Tap brush "Small" / "Medium" / "Large" | Brush size | Local |
| Cutout | Tap "Undo" | Native undo | Native |
| Cutout | Tap "Reset" | Native reset to starting mask | Native |
| Cutout | Tap "Done" | If edited: native save to new file, `replacePieceCutout` / `replaceImportCutout`, delete leftover files, back. If not edited: back | Writes `variants.plain/enhanced`, `cutoutArea` (piece) or `prepared` (import); deletes files |
| Cutout | Tap "Cancel" (header left) | Back; discard Alert if any edit (`canUndo`) | None |
| Cutout (failed) | Tap "Go back" | Back | None |

### Missing piece (`src/features/MissingPiece.tsx`)

| Route | Action | Result | Data |
|---|---|---|---|
| Any piece route with unknown id | Tap "Go to closet" | `router.replace("/closet")` | None |

## States

| Route | Empty | Loading | Generating | Error | Offline | Permission denied | First run |
|---|---|---|---|---|---|---|---|
| App shell (all routes) | n/a | `ClosetProvider` shows centred `Message` "Opening your closet" / "Your pieces will be here in a moment." Text only, no indicator (`state/closet.tsx:62-74`) | n/a | "Your closet could not open" + "Your saved data has been kept. Try opening it again." + "Try again" button (`state/closet.tsx:66-84`) | Local storage, unaffected | n/a | `app/index.tsx` redirects to `/onboarding` until `styling.onboarded` |
| Closet | No pieces: intro "A little space for the pieces you love.", bordered block "Your first piece." (plum) + "Start with a favorite hijab, a go-to layer, or something you want to wear more." (hard line breaks in copy), "Add your first piece" button, caption "Your closet is saved on this device." Search, chips and Select are hidden (`index.tsx:229-247`). No match: `Message` "No pieces found" / "Try another name or filter." + secondary "Clear filters" (`:249-262`). Archived view empty: same no-match message | No list-level loading; images load per tile via expo-image with no placeholder | n/a. Background `measurePiece` / attribute refresh change tiles silently | Link set failure: inline `ErrorMessage` "These pieces could not be linked. Please try again." inside list header (`:152`) | n/a | n/a | After onboarding with sample closet: "{count} sample pieces included. Try a combination you love." + "Build a look" button in list header (`:159-169`); tiles tagged "Sample" |
| Piece detail | No facts: caption "No details yet." (`[id].tsx:160-162`). No care label: hint "Photograph the label sewn inside this piece to record what it is made of." Label with no fields: "The label photo is saved. Nothing has been filled in yet." Not in looks: "Not in any saved looks yet" | None | n/a | Save failure: `ErrorMessage` "This change could not be saved. Please try again." at screen bottom (`:290`), far from the control. Set leave failure: "This piece could not leave its set." Weather and archive sections each have their own error line (`PieceSections.tsx:51`, `:117`). Missing id: `MissingPiece` | n/a | n/a | Sample pieces: no care label section (`source !== "owned"`), no cutout |
| Add piece (new) | No photo: bordered 280 pt box "Start with a photo." + "A clear photo in natural light helps you see the colors you love." (`PieceEditor.tsx:280-286`). Save disabled until photo, name, category and (owned) subcategory | None | n/a | Photo open failure: "The photo could not be opened. Please choose it again." Save failure: "This piece could not be saved. Check that your device has free space, then try again." Subcategory missing: caption "Choose a subcategory to save this piece." | n/a | Camera: inline `ErrorMessage` "Camera access is off. You can choose a photo, or enable camera access in Settings." No "Open Settings" button (capture has one) | Same screen |
| Edit piece | n/a | None | Studio: chip label "Making studio photo", chip disabled, cutout button disabled; photo box unchanged (`PieceEditor.tsx:303-316`). Privacy caption "Studio sends this photo to Cloudflare." while not yet made (`:333-335`) | Studio errors under photo: "The studio photo could not be made. Try again.", "You have used today's studio photos. Try again tomorrow." Remove failure "This piece could not be removed. Please try again." Save failure as above. Missing id: `MissingPiece` | Studio: "You are offline. Try again when you are connected." Everything else works offline | Camera as above | Sample piece: caption "A sample piece for trying outfit combinations." and no Details editor (`describes = source !== "sample"`) |
| Care label | No photo: paragraph "Photograph the label sewn inside this piece. Hold it flat in good light so the text fills the photo. The label photo stays on this iPhone and is not shown in your closet." + two buttons. Form is hidden until a photo exists | n/a | Reading: muted line "Reading the label" with live region, buttons disabled; no image or progress visual (`label/[id].tsx:200-204`) | Unreadable: "This label could not be read. Try another photo with the text flat and in focus." Nothing read: "Nothing could be read from this label. You can fill it in yourself or take another photo." Save / remove failures. Missing owner: `MissingPiece` | On-device OCR, works offline | Camera: "Camera access is off. You can choose a photo, or turn on camera access in Settings." (different wording from editor: "turn on" vs "enable") | n/a |
| Cutout | n/a | Dark canvas with white `ActivityIndicator` overlay; all controls disabled; "Done" disabled (`cutout/[id].tsx:134-138`) | Saving: same spinner overlay, "Done" busy. Selecting (long press): native white spinner at finger (`CutoutEditorView.swift:339-347`) | Load failure: full-screen `Message` titled "Adjust cut-out" / "Cut out by hand" + "This photo could not be opened for editing." + "Go back" (`:63-74`). Save failure: "The cut-out could not be saved. Try again." Missing source: `MissingPiece` | On-device, works offline | n/a | Hint "Hold on a piece to select it" until first successful select (hidden with opacity 0, keeps space) |

## Magic moments

| Moment | Where | How it looks now |
|---|---|---|
| Loading (app start, closet load) | `ClosetProvider` (`src/state/closet.tsx:62-74`) | Static centred heading + body text. No motion, no indicator. |
| Loading (photos) | `PiecePhoto` / `PieceTile` (`src/ui/index.tsx:332-412`) | expo-image with no placeholder or transition; tiles pop in. |
| Selecting object in image (cutout load) | `cutout/[id].tsx:121-138` | Black (`theme.colors.ink`) canvas with a bare white `ActivityIndicator`. The faded original (alpha 0.3) sits under the kept area once ready (`CutoutEditorView.swift:83-87`). |
| Selecting object in image (hold to select) | `CutoutEditorView.swift:332-410` | Long press 0.4 s, white UIKit spinner at the finger, medium haptic, mask swaps instantly to the selected piece, then a white outline with 6 pt glow is revealed by a diagonal gradient sweep (0.7 s ease-in-out) and fades out over 0.5 s. No Reduce Motion check (no `UIAccessibility.isReduceMotionEnabled` anywhere in the module). This is the only crafted animation in the area. |
| Selecting object (brush) | Native | Mask updates live under the finger; no feedback on mode other than chip state. |
| Generating (Studio photo) | `PieceEditor.tsx:303-316`, `src/state/studio.ts:101-122` | Chip text changes to "Making studio photo" and greys out. No progress, no change to the photo area. On success the photo swaps instantly. |
| Generating (care label OCR) | `label/[id].tsx:78-93`, `:200-204` | Text line "Reading the label" above the buttons. Photo appears only after reading finishes. |
| Generating (background re-prepare after photo change) | `PieceEditor.tsx:208`, `src/state/imports.ts:156-179` | Invisible. Tile and facts update later with no indication. Same for `useAttributeRefresh`. |
| Selfie colour sampling (`SamplePoints.tsx`, onboarding only) | `src/features/SamplePoints.tsx:20-153` | Draggable 44 pt dots with a 26 pt ring filled with the sampled colour and a shadowed white label; sampling runs async per point with a queue; no animation, colour fill just updates. |
| Found clothes in video | Not in this area (capture scan) | n/a |

## Pain points

Clutter and too much text

1. Closet list header stacks up to seven blocks before the first tile: count sentence, select hint + button + error, linked message, sample caption + "Build a look", labelled search field, category chip row, filter chip row (`app/(tabs)/closet/index.tsx:133-227`). On a phone the grid starts below the fold when samples exist.
2. Intro line repeats the count in prose ("{count} pieces, ready for a new combination.") on every visit (`closet/index.tsx:135-141`).
3. Search uses a visible label "Find a piece" plus placeholder "Try a name, like mauve hijab" (`closet/index.tsx:172-179`); search only matches name (`:52-54`), so "mauve" finds nothing unless in the name.
4. Piece detail is a long form with a helper caption in every section: facts hint (`piece/[id].tsx:164-168`), weather help (`PieceSections.tsx:112-116`), availability hint (`piece/[id].tsx:261-266`), archive help (`PieceSections.tsx:36-38`), care label hint (`piece/[id].tsx:223-227`).
5. Edit screen carries several captions: style hint (`PieceEditor.tsx:463-465`), details hint (`AttributeEditor.tsx:31-33`), per-attribute source line under every attribute (`AttributeEditor.tsx:44-50`), saved note under Save (`PieceEditor.tsx:494-498`), Studio privacy note (`:333-335`), start hint in the empty photo box (`:281-286`).
6. Care label intro is a three-sentence paragraph (`label/[id].tsx:198`, `careLabel.intro`); it mentions "iPhone" explicitly.
7. Empty closet copy has hard-coded line breaks (`en.ts closet.firstBody`) which break at large text sizes.

Inconsistency

8. Two different editors for the same attributes: inline fact chips with a question card on detail (`piece/[id].tsx:144-213`) vs the full AttributeEditor on the edit screen (`PieceEditor.tsx:469-478`). Weather traits are editable only on detail; category, kind, style only on edit.
9. Mixed commit models in one flow: detail changes save on tap; edit screen waits for "Save changes"; but inside the edit screen Studio saves immediately (`PieceEditor.tsx:116-125`) and the cutout editor saves on "Done" (`cutout/[id].tsx:85-99`), so pressing Back + Discard on edit does not undo those.
10. Category picker is a hand-made `Pressable` pill with filled plum selection (`PieceEditor.tsx:374-402`) while subcategory, style, variants and filters use `Chip` (`:412-425`). Two selection looks on one screen.
11. Header left differs per screen: native back on detail, custom "Back" text on edit (`PieceEditor.tsx:264-268`), custom "Cancel" on new and cutout (`cutout/[id].tsx:113-118`), native back on label. Closet uses "Select"/"Cancel" text actions.
12. Availability vocabulary drifts: filter "Unavailable" / "Available" (`closet.away`), section "Mark as unavailable", button "Mark as available", code `away`. Archive restore is "Back in my closet". Remove is "Remove piece". Tab "Closet" vs title "Your closet" (NB "Garderobe" vs "Garderoben din").
13. Camera-off wording differs: editor "enable camera access" (`error.cameraOffOne`) vs label "turn on camera access" (`careLabel.cameraOff`); capture offers "Open Settings" but editor and label do not.
14. Error placement differs: detail shows one shared error at the very bottom (`piece/[id].tsx:290`) while Weather and Archive sections show their own (`PieceSections.tsx:51`, `:117`).
15. Away reason chips toggle off on second tap and there is also a "Mark as available" button doing the same (`piece/[id].tsx:268-286`).

Modals and sheets that move

16. `/piece/new` is `presentation: "modal"` (`app/_layout.tsx:29-32`). From capture "Add without photo preparation" (`capture/index.tsx:373`) it stacks a second sheet on the capture sheet.
17. `/label/[id]` and `/cutout/[id]` are pushes, but from capture they push inside the capture modal sheet, so the same screen appears full-screen from Closet and inside a sheet from capture (`capture/[id].tsx:175`, `:389`, `:441`).
18. Closet "Build a look" opens `/look/build` as a modal (`closet/index.tsx:166`, `_layout.tsx:38-41`).
19. Destructive confirms and discard prompts use native `Alert` (`src/ui/confirm.ts`), a third presentation style.

Dead ends and disconnected hand-offs

20. After linking a set the only feedback is "Linked as a set. Open a piece to see or change its set." (`closet/index.tsx:154-157`); tiles show no set grouping, so the result is invisible in the grid.
21. "Used in n saved looks" is plain text (`piece/[id].tsx:128-134`); no way to open those looks or build a look with this piece from detail.
22. "Style this piece" jumps across tabs to Today with `router.navigate("/today")` (`piece/[id].tsx:103`) leaving the closet stack behind; it only appears when an everyday style exists (`:136`), otherwise there is no styling entry from a piece.
23. Removing a piece calls `router.dismissTo("/closet")` (`PieceEditor.tsx:251`); when detail was opened from Today (`today/index.tsx:206`) the user is moved to the Closet tab instead of back where they came from.
24. `MissingPiece` always replaces to `/closet` (`MissingPiece.tsx:14`) regardless of origin.
25. Cutout editor is only reachable from the edit screen (`PieceEditor.tsx:319-332`), two levels deep, not from the photo on detail. Photo variant chips are also only on edit.
26. The cutout button hides when the piece has only one variant (`pieceCutout` returns null, `src/domain/cutout.ts:29`), with no explanation.
27. Care label is hidden for sample pieces and on any build without on-device vision (`piece/[id].tsx:215`).
28. "Build a look" button appears on Closet only while sample pieces exist (`closet/index.tsx:159-169`); owned-only closets lose this entry.
29. Select mode's action button lives in the scrolling list header (`closet/index.tsx:142-152`); after choosing pieces lower in the grid the user must scroll back up (sets.yaml swipes down 8 times to find it).
30. Archived filter chip sits at the far end of a long horizontal filter row (`closet/index.tsx:217-223`); archive.yaml needs up to 27 swipes to reach it.
31. Category chips always list every category even when empty (`src/domain/closetFilters.ts:28-30`), so many taps lead to "No pieces found".
32. Background re-preparation after a photo change (`PieceEditor.tsx:208`) and attribute refresh run silently; facts and tiles change later without notice.

Other

33. Save disabled with no reason except subcategory (`PieceEditor.tsx:486-492`); missing photo or name gives no message.
34. Care label has no discard guard: edited fields are lost silently on back (`label/[id].tsx`, no `useDiscardChanges`), unlike editor and cutout.
35. Cutout `gestureEnabled: false` (`app/_layout.tsx:52-54`) disables swipe back everywhere for that screen even when nothing changed.
36. Cutout "Hold on a piece to select it" uses opacity 0 to hide, leaving a blank gap (`cutout/[id].tsx:169-176`).
37. Cutout load and save spinners are bare `ActivityIndicator`s (`cutout/[id].tsx:134-138`), and the native select glow ignores Reduce Motion (`CutoutEditorView.swift:376-410`).
38. Archive has no confirm while Remove does; both are near the bottom of different screens (`PieceSections.tsx:39-50`, `PieceEditor.tsx:499-508`).
39. Closet content uses hard-coded spacing (24, 110, 16, 20) instead of `theme.space` (`closet/index.tsx:291-318`); editor too (`PieceEditor.tsx:513-548`) while detail uses `theme.space`.

## Existing Maestro coverage

| Flow file | Actions covered |
|---|---|
| `.maestro/labels/closet.yaml` | Closet category chips visible; search by name; style filter Desi to no-match state; category "Layers"; availability "Unavailable" to no-match; "Clear filters"; All selected after reset |
| `.maestro/labels/closet-nb.yaml` | Closet chips in bokmål |
| `.maestro/labels/closet-large.yaml` | Closet chips at large text (screenshot) |
| `.maestro/labels/editor.yaml` | Detail to Edit for sample piece (optional subcategory, fixed style text); owned piece: change category, subcategory required message, Save disabled, choose kind, choose style, save, tile summary updates |
| `.maestro/labels/large-text.yaml` | Edit screen at large text (screenshot); capture check remove photo |
| `.maestro/labels/capture.yaml`, `native.yaml` | Capture check category/kind (capture area), ends on closet tile summary |
| `.maestro/attributes/item-page.yaml` | Detail facts visible, used-in text; open fact question, "Looks right", toggle closed; mark "In the wash"; Edit name and save; filter "Unavailable" finds piece; "Mark as available" |
| `.maestro/attributes/item-page-large.yaml` | Detail at large text, fact question "Not now", availability section |
| `.maestro/attributes/piece-details.yaml` | Edit screen attribute sources (Confirmed, Suggested), "Looks right", choose option, save, sources persist |
| `.maestro/attributes/piece-details-large.yaml` | Edit screen attributes at large text |
| `.maestro/attributes/remove-piece.yaml` | Edit, "Remove piece", Alert "Remove", back on closet, piece gone, no MissingPiece |
| `.maestro/attributes/quick-check*.yaml` | Closet "Add pieces" entry to capture quick check (capture area) |
| `.maestro/care-label/piece.yaml` | Detail care label lines; open label; edit size; save; edit piece name keeps label; remove care label with Alert; "Add care label" shown again |
| `.maestro/care-label/check-piece.yaml` | Label from capture offer (target import): choose photo, OCR result, save, then add to closet |
| `.maestro/care-label/skip.yaml` | Capture care label offer "Skip" |
| `.maestro/care-label/large-text.yaml`, `nb.yaml` | Detail care label and label screen at large text and in bokmål |
| `.maestro/04-capture/sets.yaml` | Closet "Select", hint, choose two pieces, "These belong together", linked message, detail "Part of a set", "Remove from this set" |
| `.maestro/04-capture/variants.yaml` | Edit screen Enhanced / Plain chips, save Plain, persists (seeded fixture) |
| `.maestro/04-capture/permissions.yaml` | Closet "Add pieces" to capture with camera denied (capture area) |
| `.maestro/wardrobe/archive.yaml` | Detail "Archive this piece", archived state text, availability hidden, closet hides it, "Archived (1)" chip, open archived piece, "Back in my closet", "Archived (0)" |
| `.maestro/wardrobe/weather.yaml` | Detail weather: shoes Rain/Snow suggested, confirm "Fine in snow"; coat Warmth suggested, confirm "Medium", help text |
| `.maestro/wardrobe/looks.yaml` | Closet "Build a look" (sample closet); detail "In the wash" and effect on Today |
| `.maestro/wardrobe/coverage-owned.yaml` | Edit attribute Fabric: Chiffon and save, effect on Today |
| `.maestro/wardrobe/bokmal.yaml` | Closet and piece detail screenshots in bokmål |
| `.maestro/stylist/looks.yaml` | Detail "Style this piece" hands off to Today |

Not covered by any flow:

- Closet first-run empty state and "Add your first piece".
- Closet loading and "Your closet could not open" / "Try again".
- Occasion chips and "Western" filter, search with no results alone.
- Select mode "Cancel", link failure.
- `/piece/new` manual add (no flow taps "Add without photo preparation" or reaches `piece/new`), "Choose a photo", "Take a photo", camera denied in editor, photo open failure, save failure.
- Change photo on an existing piece and the background re-prepare.
- Studio chip, "Making studio photo", Studio errors and offline.
- Cutout editor entirely (`/cutout/[id]`): open, brush modes, sizes, undo, reset, hold to select, done, cancel with discard, load failure.
- Discard changes Alert on edit or new.
- Remove piece used in saved looks (count message).
- `MissingPiece` screen.
- Care label: camera denied, unreadable, nothing found, add / remove fibre, take another photo.
- Weather warmth "Light" / "Warm", rain yes/no explicit, weather on tops and dresses.
- Away reasons "Lent out", "Needs repair", toggling a reason off.
- Fact chip option change on detail (only "Looks right" covered).
- `SamplePoints` drag (onboarding colours flow covers the screen; dot dragging not asserted in closet area).
