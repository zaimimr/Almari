# QA: capture (adding clothes)

Simulator: Almari QA 2, build 0.1.14 (17). Tested: library import of 10 photos (hijab, tunic, blazer, kurta x2, building, face, 12000x1500 panorama, 8x8 red, solid black), simulated camera, confirm screen, colour/name, discard, Studio clean background, duplicate banner, scan with camera denied, app kill mid-batch. Some paths were checked in code only because the machine was very heavily loaded (load average about 1000).

## 1. Bugs

### B1. Non-clothing photos become pieces with confident names (wrong)
- Repro: Add pieces > Choose photos > pick a building photo, a solid black image, an 8x8 red image, a 12000x1500 panorama and a selfie.
- Happened: building -> "Black top" (a roof sliver was cut out), panorama -> "Belt", red square -> "Top", black square -> "Top". The selfie became "3 pieces in one photo": Camel instant hijab, Mustard belt, Camel belt (the necklace became a belt). None of them was rejected or flagged.
- Expected: very low confidence, tiny or blank inputs fail with "No clothing found", and a face-only photo is not split into pieces.
- Screens: docs/qa/screens/capture/01-weird-photos-become-pieces.png, docs/qa/screens/capture/02-black-red-panorama-pieces.png
- Source: src/state/imports.ts:101 (parseCapture with no lower bound), src/domain/importing.ts:166 (names always come from the top label).
- Fix: before splitting, reject when the image is under about 64px, has almost no variance, or the top label confidence is under a threshold. Show these as failed jobs with "No clothing found" and a Retake button.

### B2. The photo quality advice is computed but never shown (broken)
- Repro: import a blurry or dark photo.
- Happened: `advice` is set on the job (blur, dark, clipped, merged, mixed light), but nothing in app/, src/features or src/ui reads it. Only the i18n strings exist. The user never gets "Too dark, retake?".
- Expected: a short hint on the tile and on the confirm screen, with Retake.
- Source: src/domain/importing.ts:94-96, src/domain/quality.ts:15.
- Fix: show one line on ConfirmPiece above the photo toolbar when `job.advice` is set. Mark it seen through `adviceShown`.

### B3. Clean product shots are flagged "dark" (wrong)
- Repro: import the mauve hijab or navy blazer product photo (white background), then read `imports[].advice` in the DB.
- Happened: advice is "dark" for both.
- Expected: no advice.
- Source: src/domain/quality.ts:22 (darkBelow 0.22). Brightness is likely measured on the cutout, where transparent pixels count as black, or on the garment only, so dark garments read as dark photos.
- Fix: measure brightness on the original frame, or on opaque pixels only. Do this before B2 makes the advice visible.

### B4. Changing the colour does not update the auto name (wrong)
- Repro: open a "Sage kurta" on the confirm screen > change Colour to Olive > Looks right.
- Happened: it is saved as Olive with the name "Sage kurta".
- Expected: "Olive kurta", unless the user typed their own name.
- Source: src/features/capture/ConfirmPiece.tsx:176 and :674 (`onPick={setColour}`). Only `chooseKind` (:417) renames.
- Fix: wrap setColour so it renames when `name === nameFor(kind, current colour)`, the same way chooseKind does.

### B5. Prev/next silently throws away edits when the name is empty (wrong)
- Repro: on the confirm screen, change the kind or colour, clear the name, then go to the next piece.
- Happened: `go()` calls allowClose() and navigates. The edits are lost with no prompt.
- Expected: the "Discard your changes?" alert, or block until there is a name.
- Source: src/features/capture/ConfirmPiece.tsx:468-475.
- Fix: when `dirty && !name.trim()`, show the discard alert instead of allowClose().

### B6. The duplicate banner says "Already in your closet?" for a piece in the same unconfirmed batch (wrong)
- Repro: import two copies of the same kurta photo in one pick > open the second.
- Happened: the banner says "Already in your closet?", but the match is the other unconfirmed import, not a closet piece. The grid tile has no duplicate cue. Tapping "Looks right" saves it and clears duplicateOf without asking.
- Expected: "Same as another photo in this batch", with Same piece / Different piece, and a small badge on the tile.
- Screen: docs/qa/screens/capture/03-duplicate-in-same-batch.png
- Source: src/features/capture/ConfirmPiece.tsx:301-308, src/domain/duplicates.ts:37-50, src/i18n/en.ts:402.
- Fix: use a different string when `duplicateOf` is an import id. Show a dot on JobTile when duplicateOf is set.

### B7. Studio "Clean background" can spin forever (broken)
- Repro (from code): start Clean background on a slow or stalled network.
- Happened: `fetch` has no timeout or AbortController. "Cleaning the background" stays up and Looks right stays disabled, so the user can only leave the screen.
- Expected: give up after about 45s with "Couldn't clean the background. Try again".
- Source: src/state/studio.ts:80.
- Fix: use an AbortController with a 45s timeout and map an abort to "failed".

### B8. The Cloudflare privacy note appears only after the upload has started (wrong)
- Repro: confirm screen > tap Clean background.
- Happened: "Clean background sends this photo to Cloudflare." appears only while it is running, so the photo is already uploading.
- Expected: tell the user before the photo leaves the device.
- Source: src/features/capture/PhotoToolbar.tsx:65-69.
- Fix: show the note under the Clean background row before the first tap, or ask once on first use.

### B9. Picking many photos stops at the first failure and drops the rest silently (wrong)
- Repro (from code): pick 20 photos where one cannot be copied (iCloud-only original, or low space).
- Happened: `add()` returns on the first error. Later photos are never queued and closeTipsSeen is skipped. The user sees one generic problem and fewer tiles than picked.
- Expected: keep going and report "2 photos could not be added".
- Source: src/features/capture/useCaptureGrid.ts:154-178.
- Fix: `continue` instead of `return`, count the failures, then set one problem with the count.

### B10. The import runner stops for good after one unexpected error (broken)
- Repro (from code): any throw in `startImport`/`parseCapture`/`repository.update` outside the inner try.
- Happened: the outer catch sets `stopped = true`, so no further queued job is prepared until the app restarts. The tiles stay on blank placeholders.
- Expected: mark that job failed and keep going.
- Source: src/state/imports.ts:138-140.
- Fix: in the outer catch, call failImport for `job.id` and do not set `stopped`.

### B11. Retake from a tile swallows camera errors (wrong)
- Repro: deny camera, then on a failed tile tap Retake.
- Happened: the result of `retake(job, "camera")` ("camera-off" or "unavailable") is ignored, so nothing visible happens.
- Expected: the same "Camera access is off / Open Settings" problem as the main rows.
- Source: app/capture/index.tsx:109.
- Fix: use the return value and call setProblem the way ConfirmPiece does at :283-295.

### B12. The Style control shows Western selected when nothing is chosen (wrong)
- Repro: confirm a piece whose style is not fixed and not detected.
- Happened: the segmented control shows Western, but the save passes `styles: undefined`. What you see is not what is saved.
- Source: src/features/capture/ConfirmPiece.tsx:509.
- Fix: show no selection when undefined, or initialise chosenStyles to ["western"] so the UI and the data match.

### B13. The step counter does not count down and jumps back (polish)
- Repro: open the 5th tile > Looks right.
- Happened: the title goes "New piece, 5 of 11" -> "New piece, 1 of 11". The total never shrinks, and there is no prev/next to see where you are.
- Source: src/features/capture/ConfirmPiece.tsx:239 (`run` is computed once).
- Fix: continue to the next piece after the current one, not the first. Show "n left" instead of "n of total".

### B14. The scan screen keeps the flip-camera button when the camera is denied (polish)
- Repro: `simctl privacy revoke camera` > Add pieces > Scan.
- Happened: "Camera access is off" with Open Settings and Choose photos (good), but the flip-camera button in the header is still shown and does nothing.
- Screen: docs/qa/screens/capture/04-scan-denied-flip-button.png
- Source: app/capture/scan.tsx:304.
- Fix: hide the header action in the denied and unavailable states.

### B15. The length question is preselected wrongly (polish)
- Repro: confirm the knee-length sage kurta.
- Happened: "Where does it end?" comes with Hip already selected.
- Expected: no preselection when confidence is low, so the user must look.
- Source: src/features/capture/ConfirmPiece.tsx (attribute answer initial value).
- Fix: only preselect when the attribute confidence is high.

## 2. UX / design problems

1. Preparing tiles are blank beige squares with no progress. Show the photo thumbnail dimmed with a thin progress shimmer, plus "Preparing 3 of 10" in the header.
2. The photo toolbar is a vertical list (Cut-out, Original, Clean background), with "Adjust" floating at the right of the Original row. Use a horizontal 3-thumbnail picker (each option shows its own preview) with Adjust as an icon on the hero.
3. The colour picker is about 30 chips across about 3 screens of scrolling. Show the 5 detected palette colours first and put "More colours" behind a sheet.
4. In the discard alert, the "Cancel" button inside a Cancel action is ambiguous. Use "Keep editing" / "Discard".
5. The kurta cutout keeps a dark sliver of backdrop on the right edge. Erode the mask edge by 1-2px or trim near-black border columns after the cutout.
6. Tiles jump into category sections when you come back to the grid (recomputed on focus). Animate the move, or group them only after "Add N pieces".
7. Failed jobs offer Retake, trash and cut-out by hand, but no plain "Try again". Add Retry for transient failures (re-queue the same source).
8. "Add by hand" still needs a photo, and has no colour picker and no auto name. Either allow no photo (an illustrated placeholder by kind), or call it "Add with details". Prefill the name from kind plus colour.
9. Once, after returning from a tile, the grid showed the tips again and scrolled to the top even though photoTipsSeen was true. I could not reproduce it. Watch the `!closet.photoTipsSeen` initial state in useCaptureGrid for a stale snapshot on remount.
10. The Studio wait shows only a skeleton bar under the hero. Show a before/after shimmer on the hero itself, and keep Looks right enabled (save the original, then swap in the clean version when it is ready).

## 3. Feature / premium ideas (ranked)

1. **Smart rejection with a reason**: "No clothing found", "Too dark", "Several pieces, tap to split". Builds on the parser plus the unused advice. This is the biggest trust win.
2. **Batch review swipe**: a full-screen card stack for the batch. Swipe right to keep, left to drop, and tap to edit. Makes adding 20 pieces feel like 30 seconds.
3. **Live duplicate hint while picking**: after import, group lookalikes side by side with "Keep both / Keep one" before review.
4. **Clean all**: one tap runs Studio on every ready piece in the batch, with a progress pill and a privacy note before it starts. Premium-gated.
5. **Receipt / product link import**: paste a shop URL or share a product page to Almari, then fetch the product image and name. No photo shoot needed.
6. **Auto-fill from colour plus kind plus fabric**: the name suggests "Olive cotton kurta". A long-press on the name offers three alternatives.
