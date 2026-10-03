# Inventory: capture

Area: adding pieces by photo, multi-piece photo review, live closet scan, quick check of a prepared piece, Studio enhancement.

Files read: `app/_layout.tsx`, `app/capture/index.tsx`, `app/capture/[id].tsx`, `app/capture/group/[id].tsx`, `app/capture/scan.tsx`, `src/features/ScanLift.tsx`, `src/features/PhotoChoice.tsx`, `src/features/Retake.ts`, `src/features/MissingPiece.tsx`, `src/state/imports.ts`, `src/state/studio.ts`, `src/navigation/*`, `src/i18n/en.ts`, `src/domain/importing.ts`, `src/domain/capture.ts`, `src/domain/scan.ts` (behaviour only), hand-off targets `app/cutout/[id].tsx`, `app/label/[id].tsx`, `app/piece/new.tsx`, and `.maestro/04-capture/*`, `.maestro/labels/*`, `.maestro/attributes/*`, `.maestro/care-label/*`.

Domain model in one paragraph: every photo becomes an `ImportJob` in `closet.imports` (persisted). The background runner `useImportRunner` (`src/state/imports.ts:85`) picks `queued` jobs. A fresh photo (no `captureId`) is first parsed for garments (`parseCapture`, `imports.ts:41`); the job is split into one job per region (`splitCapture`, `importing.ts:361`) or kept whole. Each job is then prepared on device (`ClosetVision.prepare`: cut-out, enhanced image, thumbnail, labels, palette, embedding) and ends as `ready`, `review` (needs a quick check) or `failed`. `review` reasons: `uncertain`, `no-cutout`, `several`, `attribute`, `partial`, plus `duplicateOf` and photo `advice` (quality). "Add N ready pieces" turns `ready` jobs into closet pieces (`acceptImports`, `importing.ts:556`). Jobs survive closing the screen and app restarts (`recoverImports` re-queues `preparing` jobs, `importing.ts:229`).

## Routes

| Path | Title (EN) | How reached | Modal or push |
|---|---|---|---|
| `/capture` (`app/capture/index.tsx`) | "Add pieces" (`title.addPieces`, set twice: `_layout.tsx:45` and `index.tsx:248`). Tips mode title "Photo tips" | `addPiecesRoute` (`imports.ts:26`) from: Closet tab header "Add pieces" (`closet/index.tsx:116-118`), Closet empty state "closet.addFirst" (`closet/index.tsx:240-242`), Today action `add-pieces` (`today/index.tsx:194-195`), Looks tab empty CTA "Add a piece" (`looks/index.tsx:55-59`), onboarding finish with "add clothes" (`onboarding/index.tsx:155`, pushed on top of `/today`). Back from group, check and scan. | **Modal** (`presentation: "modal"`, `_layout.tsx:43-46`). Header: left "Close", right "Photo tips". |
| `/piece/new` (fallback) | "Add a piece" (`capture.addPiece`) | Same entry points when `canPrepareOnDevice` is false (no ClosetVision module), and "Add without photo preparation" link inside `/capture` (`index.tsx:369-374`) | **Modal** (`_layout.tsx:29-32`). From `/capture` this is a modal on top of a modal. Owned by the closet inventory. |
| `/capture/[id]` (`app/capture/[id].tsx`) | "Check this piece" (`title.checkPiece`, `_layout.tsx:47-50`). Title does not change in the care label step | Tap a tile in `Ready` or `Quick check` state in `/capture` (`index.tsx:351-356`, tile disabled for other states `index.tsx:414,425`) | Push (inside the modal stack). Header left replaced with text "Back" (`[id].tsx:357-365`); in label step header left is "Done" (`[id].tsx:152-160`). |
| `/capture/group/[id]` (`app/capture/group/[id].tsx`) | "Pieces in this photo" (`capture.group.title`) or "Scanned pieces" (`scan.reviewTitle`) when jobs come from several frames; in box mode "Adjust crop" or "Add a piece" | "Review" button on a group card in `/capture` (`index.tsx:332-342`); `router.replace` from scan "Done" when the scan took at least one piece (`scan.tsx:216-223`) | Push. Header left "Cancel" (`group/[id].tsx:276-281`), box mode header left "Cancel" (`group/[id].tsx:228-237`). Box drawing is an in-screen mode, not a route. |
| `/capture/scan` (`app/capture/scan.tsx`) | "Scan pieces" (`scan.title`) | "Scan pieces" secondary button in `/capture` (`index.tsx:280-286`). Only reachable when `canPrepareOnDevice` | Push. Header left "Close", right "Done" (`scan.tsx:225-240`). |
| `/cutout/[id]?target=import` (hand-off, owned by closet inventory) | "Adjust cut-out" or "Cut out by hand" | `/capture/[id]` buttons (`[id].tsx:381-394`, `[id].tsx:433-446`) | Push, `gestureEnabled: false` (`_layout.tsx:51-54`), header left "Cancel", discard confirm via `useDiscardChanges`. |
| `/label/[id]?target=import` (hand-off, owned by closet inventory) | "Care label" | `/capture/[id]` label step "Add care label" / "Change care label" (`[id].tsx:171-179`) | Push. Returns with `router.back()` to the label step. |

Not routes but full-screen modes inside a route:
- Photo tips carousel (3 cards) replaces the whole `/capture` content (`index.tsx:203-242`).
- Care label offer step replaces the whole `/capture/[id]` content (`[id].tsx:149-186`).
- Draw or adjust box mode replaces the whole `/capture/group/[id]` content (`group/[id].tsx:225-269`).

Navigation shell notes (`src/navigation`): `stackOptions` gives plum header tint, white header, no shadow, minimal back button (`options.ts:3-9`). Capture screens override `headerLeft` with text `HeaderAction`s, so the native minimal back chevron is never shown in this area. `useDiscardChanges` is not used by any capture route (only by the cut-out editor hand-off).

## User actions

| Route | Action | Result | Data read / written |
|---|---|---|---|
| `/capture` | First open (tips never seen) | Tips carousel card 1 of 3 shows instead of the screen (`index.tsx:79-81`) | Reads `closet.photoTipsSeen` |
| `/capture` tips | "Next tip" | Next card (`index.tsx:226-232`) | none |
| `/capture` tips | "Back" (secondary, from card 2) | Previous card (`index.tsx:233-239`) | none |
| `/capture` tips | "Start adding pieces" on last card, or header "Skip" | Leaves tips, shows main screen (`index.tsx:104-110`) | Writes `photoTipsSeen: true` (only once; failure ignored) |
| `/capture` | Header "Photo tips" | Reopens tips at card 1 (`index.tsx:255-257`) | none |
| `/capture` | Header "Close" | `router.back()`; jobs in progress keep running and stay in `closet.imports` (`index.tsx:249-254`) | none |
| `/capture` | "Take a photo" | Checks low space, asks camera permission, opens system camera; on photo, copies file and queues a job (`index.tsx:134-167`, `112-132`) | Writes photo file (`keepPhotoAs`), `closet.imports` (+1 queued job). Low space / denied / failure -> Notice |
| `/capture` | "Choose photos" | Opens system library, up to 20 photos, each queued (`index.tsx:156-162`) | Writes photo files, `closet.imports` (+N) |
| `/capture` | "Scan pieces" | Push `/capture/scan` | none |
| `/capture` | Notice "Choose photos instead" (camera off) | Opens library (`index.tsx:176-179,292-297`) | as Choose photos |
| `/capture` | Notice "Open Settings" (camera off) | Opens iOS Settings (`index.tsx:298-301`) | none |
| `/capture` | Notice "Try again" (low space, unavailable, failed) | Opens the **library** picker, or a library retake when the problem came from a tile retake (`index.tsx:176-179,303`) | as Choose photos / Retake |
| `/capture` | Group card "Review" ("N pieces found in one photo", "N pieces from a scan") | Push `/capture/group/[id]` (`index.tsx:319-345`) | Reads `captureJobs` |
| `/capture` | Tap tile (Ready or Quick check) | Push `/capture/[id]` (`index.tsx:351-356`) | Reads job |
| `/capture` | Failed tile "Retry" | Job back to `queued` (`index.tsx:357-359`, `retryImport`) | Writes `closet.imports` |
| `/capture` | Failed tile "Retake" | Camera (falls back to library if camera launch throws, `Retake.ts:41-43`); new photo replaces job source, job re-queued and loses group membership (`retakeImport`, `importing.ts:193-227`) | Writes photo file, `closet.imports`; discards replaced files |
| `/capture` | Failed tile "Remove" | Job removed at once, no confirm (`index.tsx:195-201,363-365`) | Writes `closet.imports`, discards orphaned files |
| `/capture` | "Add without photo preparation" | Push modal `/piece/new` (manual editor) (`index.tsx:369-374`) | Owned by closet inventory |
| `/capture` | Footer "Add N ready pieces" (disabled when 0 ready) | All `ready` jobs become closet pieces; if every job was ready the modal closes (`index.tsx:181-193`) | Reads `closet.imports`; writes `closet.pieces` (+N, with care label if set), removes accepted jobs |
| `/capture/[id]` | Pick "Enhanced" / "Plain" / "Keep original" / "Use prepared" chip | Changes which image the piece will use (`PhotoChoice.tsx:54-103`) | Local state until "Looks right" |
| `/capture/[id]` | "Studio" chip (when offered and not made yet) | Sends enhanced image to Studio worker, whitens background, sets `variant: studio` (`[id].tsx:253-274`, `studio.ts:46-88`) | Network POST to `EXPO_PUBLIC_STUDIO_URL` with image, category, kind, name, colour, install id; writes studio file and `job.prepared.studio` |
| `/capture/[id]` | "Studio" chip (already made) | Selects studio variant | Local state |
| `/capture/[id]` | "Adjust cut-out" (cut-out exists, not keeping original) | Push `/cutout/[id]?target=import` (`[id].tsx:381-394`) | Cut-out editor writes new cut-out to job |
| `/capture/[id]` | "Cut out by hand" (no cut-out) | Push `/cutout/[id]?target=import` (`[id].tsx:433-446`) | as above |
| `/capture/[id]` | Duplicate notice "Same piece" | Removes the job, goes back (`[id].tsx:399-415,276-286`) | Writes `closet.imports` |
| `/capture/[id]` | Duplicate notice "Different piece" | Clears duplicate flag; state becomes ready or stays review (`[id].tsx:311-321`, `keepDuplicate`) | Writes `closet.imports` |
| `/capture/[id]` | Advice notice "Retake" | Camera retake; on success back to `/capture` (`[id].tsx:416-428,288-297`) | Writes photo file, job re-queued |
| `/capture/[id]` | Advice notice "Use anyway" | Dismisses advice, remembers it (`[id].tsx:299-309`, `dismissAdvice`) | Writes `job.advice`, `job.adviceShown` |
| `/capture/[id]` | Category chip / "Something else" | Changes category, picks the top ranked kind, may rename (`[id].tsx:215-226,461-475`) | Local state; reads `prepared.labels` |
| `/capture/[id]` | Subcategory chip | Changes kind, renames if name was auto, fixes or clears style (`[id].tsx:215-222,482-489`) | Local state |
| `/capture/[id]` | Style choice "Desi" / "Western" / "Both" (hidden when kind fixes style) | Sets styles (`[id].tsx:492-506`) | Local state |
| `/capture/[id]` | Attribute question chip (length or sleeve, shows "Suggested: X") | Sets answer (`[id].tsx:507-530`) | Local state |
| `/capture/[id]` | Edit "Name" field (`testID="check-name"`) | Local name (`[id].tsx:531-538`) | Local state |
| `/capture/[id]` | "Looks right" | Saves corrections, job becomes `ready`, screen switches to care label step (`[id].tsx:228-251`, `correctImport`) | Writes job kind, styles, name, keepOriginal, variant, confirmed attribute, sources; clears checks |
| `/capture/[id]` | "Retake" (main button) | Camera retake; on success back (`[id].tsx:549-556`) | as Retake |
| `/capture/[id]` | Retake problem notice "Choose a photo instead" / "Open Settings" / "Try again" | Library retake or Settings (`[id].tsx:330-353`) | as Retake |
| `/capture/[id]` | "Remove this photo" | Removes job at once, no confirm, back (`[id].tsx:557-564`) | Writes `closet.imports` |
| `/capture/[id]` | Header "Back" | `router.back()`, unsaved corrections dropped without warning (`[id].tsx:357-365`) | none |
| `/capture/[id]` label step | "Add care label" / "Change care label" | Push `/label/[id]?target=import` (`[id].tsx:171-179`) | Label screen writes `job.label` (`setImportLabel`) |
| `/capture/[id]` label step | "Skip" / "Done" (button) or header "Done" | `router.back()` to `/capture` (`[id].tsx:153-158,180-184`) | none |
| `/capture/group/[id]` | "Keep" / "Drop" chip per proposal | Marks row kept or dropped (local), box on photo greys out (`group/[id].tsx:320-333`) | Local state |
| `/capture/group/[id]` | "Adjust crop" (settled, kept rows) | Enters box mode with that job's frame (`group/[id].tsx:334-343`) | none |
| `/capture/group/[id]` | "Add a piece" (single-photo groups only) | Enters box mode with a centred start box (`group/[id].tsx:348-354`) | none |
| `/capture/group/[id]` box mode | Drag on photo | Draws box (`boxFrom`) (`group/[id].tsx:186-194`) | Local state |
| `/capture/group/[id]` box mode | "Smaller" / "Larger" buttons, or VoiceOver adjustable increment / decrement | Resizes box by 5 percent (`group/[id].tsx:99-102,176-185,246-259`) | Local state |
| `/capture/group/[id]` box mode | "Use this box" | Adjust: replaces job with a new cropped job id. Add: appends a new job to the capture. Both re-queue for preparation (`group/[id].tsx:112-135`) | Writes `closet.imports` (`cropCapture`, `addToCapture`) |
| `/capture/group/[id]` box mode | Header "Cancel" | Leaves box mode (`group/[id].tsx:231-236`) | none |
| `/capture/group/[id]` | Footer "Done" | Removes dropped jobs, back to `/capture` (`group/[id].tsx:137-150`) | Writes `closet.imports` |
| `/capture/group/[id]` | Header "Cancel" | Back; Keep/Drop choices lost, no warning (`group/[id].tsx:276-281`) | none |
| `/capture/scan` | Open screen | Requests camera permission (`scan.tsx:92-106`), starts native `LiveScanView` at 4 fps (`scanFps`) | Reads `closet.styling.scan` |
| `/capture/scan` | Hold a piece up (Auto mode) | Status advances find -> show -> hold; when held still for `holdMs` (700 ms) a capture fires automatically (`scan.tsx:197-209`) | Writes photo + region/crop job into `closet.imports` with `captureId = scanId` (`addScanCapture`) |
| `/capture/scan` | Shutter (Manual mode, ready camera) | Captures the currently held piece if any (`scan.tsx:180-187,282-295`) | as above |
| `/capture/scan` | "Auto" / "Manual" chip | Switches mode, resets hold (`scan.tsx:189-195,343-356`) | Writes `closet.styling.scan` |
| `/capture/scan` | "Switch camera" | Toggles front/back, restarts detection (`scan.tsx:357-365`) | Local |
| `/capture/scan` | "Start again" | Resets detection baseline (`scan.tsx:211-214,366`) | Local |
| `/capture/scan` | Long press status heading | Toggles fps / parse ms readout (`scan.tsx:298-310`) | Local (debug) |
| `/capture/scan` | Header "Done" | With pieces: replace to `/capture/group/[scanId]`. Without: back (`scan.tsx:216-223`) | none |
| `/capture/scan` | Header "Close" | Back to `/capture`; scanned jobs are kept and show as a "N pieces from a scan" card there (`scan.tsx:229-233`) | none |
| `/capture/scan` denied / unavailable | "Open Settings" (denied only), "Go back" (`scan.tsx:242-263`) | Settings or back | none |
| `/capture/[id]`, `/capture/group/[id]` gone state | "Go back" | back (`[id].tsx:136-147`, `group/[id].tsx:68-79`) | none |
| Background | Runner prepares queued jobs | queued -> preparing -> ready / review / failed; multi-garment photos split into groups | Writes `closet.imports`, photo files; discards stale or orphaned files |

## States

Per route, what the UI shows today.

### `/capture`

| State | Today |
|---|---|
| First run | Tips carousel (`index.tsx:203-242`): "1 of 3" caption, `TipDrawing` illustration, title ("Let the real color show." / "One piece, a little space." / "Keep every edge in view."), body paragraph, "Next tip" / "Start adding pieces", "Back" from card 2. Header: "Skip" left, nothing right. |
| Empty (no jobs) | Long intro paragraph (`capture.intro`, en.ts:1040), three buttons in a wrapping row (Take a photo primary, Choose photos, Scan pieces), "Add without photo preparation" compact link, pinned footer with disabled "Add ready pieces". No illustration, no empty state message. |
| Loading (closet) | Not handled in this route; relies on the root provider. |
| Working (queued / preparing) | Tile shows the raw source photo with a badge "Waiting" or "Preparing"; status line "N being prepared" (live region). Tile not tappable. No motion. |
| Ready | Tile shows thumbnail (cut-out), badge "Ready" filled plum, name under tile. Status line "N ready". Footer button "Add N ready pieces" / "Add 1 ready piece". |
| Quick check | Tile has 2px plum border and badge "Quick check"; caption "Photo tip" when advice exists. Status "N need a quick check". |
| Group found | Card above the grid: "N pieces found in one photo" / "1 piece found in one photo" / "N pieces from a scan" + "Review" button (`index.tsx:319-345`). The grid also shows every job of the group as its own tile. |
| Job failed | Tile badge "Could not finish" with error border, caption with reason (storage / unreadable / processing, en.ts:377-382), then three stacked compact buttons Retry, Retake, Remove inside the narrow tile (`index.tsx:464-488`). Status "N could not finish". |
| Error: pick / save | Pick problems show a `Notice` between the action row and the grid (`index.tsx:288-306`). Save or remove errors show `ErrorMessage` in the footer (`index.tsx:378`). |
| Low space | Notice "Your iPhone is almost out of space..." + "Try again" (checked before picking and after a failed copy). |
| Permission denied (camera) | Notice "Camera access is off. You can choose photos instead, or turn on camera access in Settings." + "Choose photos instead" + "Open Settings". |
| Permission denied (photos) | No app UI; the iOS picker still opens (covered by `permissions.yaml`). |
| Photo unavailable (iCloud) | Notice `problem.unavailable` + "Try again". |
| Offline | Not relevant; preparation is on device. iCloud photo case mentions connecting. |
| Large text | Tiles go to 47 percent width at fontScale 1.3, full width with 4:3 photo at fontScale 2 (`index.tsx:412-430`). |
| Device without ClosetVision | Route never reached; entry points go to `/piece/new`. |
| Saving | Footer button busy spinner. |
| After save | If all jobs were ready the modal closes with no confirmation; otherwise saved tiles just disappear. |

### `/capture/[id]`

| State | Today |
|---|---|
| Gone / not prepared | Centred `Message` "This photo is no longer waiting" / "Your other photos are still in Add pieces." + "Go back" (`[id].tsx:136-147`). Also shown if the job is re-queued while open. |
| Default (ready) | Two-up photo compare (prepared vs original) with chips, then category, subcategory, style, name, "Looks right", "Retake", "Remove this photo". |
| Quick check reasons | Each adds content: question replaces section label ("Is this in X or Y?", "Is this X or Y?", "Is this Desi or Western?"); `no-cutout` paragraph (en.ts:76) + "Cut out by hand"; `several` paragraph (en.ts:78); `partial` bold "Partly visible" + paragraph; attribute question ("Where does it end?", "How long are the sleeves?") with "Suggested: X". |
| Duplicate | Notice "Is this already in your closet?" / "It looks very like {name}." + "Same piece" / "Different piece". |
| Photo advice | Notice with title + body (merged, clipped, blur, dark, mixed light) + "Retake" / "Use anyway". |
| No cut-out | Only original half shown in `PhotoChoice` (prepared half hidden when `shown` is null, `PhotoChoice.tsx:36`). |
| Generating (Studio) | "Studio" chip label becomes "Making studio photo" and is disabled; "Adjust cut-out" disabled. No progress, no preview change until done. |
| Studio offered note | Muted line "Studio sends this photo to Cloudflare." under the photos when Studio not made yet (`[id].tsx:395-397`). |
| Studio error | `ErrorMessage` under the photo: offline ("You are offline. Try again when you are connected."), limit ("You have used today's studio photos. Try again tomorrow."), failed. |
| Offline | Only Studio is affected (above). |
| Permission denied (retake camera) | Notice "Camera access is off..." + "Choose a photo instead" + "Open Settings"; shown near advice notice or below "Looks right" (`[id].tsx:429,548`). |
| Saving | "Looks right" busy; all other buttons disabled while busy. |
| Save error | `ErrorMessage` "This piece could not be updated. Please try again." above "Looks right". |
| Care label step | Heading "Add the care label?", long body (en.ts:236), label lines if set, "Add care label" / "Change care label", "Skip" / "Done"; header left "Done". Title still "Check this piece". |
| Large text | Same scroll; covered by `quick-check-large.yaml` and `labels/large-text.yaml`. |

### `/capture/group/[id]`

| State | Today |
|---|---|
| Gone | `Message` "These pieces are no longer waiting" / "Your other photos are still waiting." + "Go back". |
| Single photo group | Intro paragraph (en.ts:299), optional "Other people were in this photo..." line, the photo with numbered plum boxes, a row per proposal (thumb 88pt, "1. Hijab or scarf", "Partly visible" caption, Keep / Drop chips, "Adjust crop"), "Add a piece", footer "Done". |
| Scan group | Title "Scanned pieces", no photo, no "Add a piece"; rows only. |
| Proposal still preparing | Row thumb uses `prepared.thumbnail ?? region.cutout`; crop-only jobs show an empty bordered square, no state label (`group/[id].tsx:293,301-310`). "Adjust crop" hidden until settled. |
| Dropped row | Row at 55 percent opacity, photo box border turns line grey. |
| Box mode | Muted hint "Drag across the photo to draw a box around the piece.", photo fitted to remaining height, dashed plum box with soft plum fill, Smaller / Larger, "Use this box" (busy while saving). |
| Error | `ErrorMessage` "This piece could not be updated..." in footer or box mode. |
| Large text / VoiceOver | Box is an adjustable element with increment / decrement actions; chips have "Keep, {title}" labels. |

### `/capture/scan`

| State | Today |
|---|---|
| Starting | Camera area plain ink colour, heading "Starting the camera". |
| Permission denied | Centred Notice with `problem.camera-off` copy ("...You can choose photos instead...") + "Open Settings" + "Go back". No "choose photos" action despite the copy. |
| Unavailable | Notice "The camera is not available on this device." + "Go back". |
| Ready, nothing seen | Heading "Step into view". |
| Person seen | "Hold up a piece". |
| Piece held | "Hold still" (Auto) or "Tap to take it" (Manual). |
| Capturing / lifted | "Taken" + ScanLift overlay (see Magic moments). Camera frozen. |
| Capture failed | `ErrorMessage` "The photo could not be added. Your other photos are kept. Please try again." under heading; detection resumes. |
| Pieces taken | Horizontal strip of 64pt thumbs (region cut-out or source), auto-scrolls to end. |
| Debug | "{fps} fps · {parse} ms" caption, on by default in dev builds, long press toggles in any build. |
| First run | No tips or explanation of Auto vs Manual. |
| Offline | Not relevant. |

### Hand-off routes (summary only)

- `/cutout/[id]`: loading and saving show an `ActivityIndicator` on a dark overlay over the canvas (`cutout/[id].tsx:134-138`); failure shows a centred Message + "Go back"; missing source shows `MissingPiece` ("This piece is no longer here" + "Go to closet", which `router.replace`s to `/closet` from inside the capture modal stack, `MissingPiece.tsx:14`).
- `/label/[id]`: owned by closet inventory.

## Magic moments

| Moment | Where | How it looks now |
|---|---|---|
| Preparing a photo (segmentation, cut-out, enhancement, recognition) | `/capture` grid, background runner | Static. Tile shows the original photo with a text badge "Waiting" then "Preparing"; status line "N being prepared". When done, the image swaps instantly to the cut-out thumbnail and the badge turns plum "Ready" or bordered "Quick check". No shimmer, no progress, no transition. Each job can take tens of seconds (flows wait up to 120 s). |
| Finding several pieces in one photo | `/capture` -> `/capture/group/[id]` | Invisible step. The single tile is replaced by several tiles and a card "3 pieces found in one photo" + "Review". On the group screen, static numbered plum boxes sit on the photo; no tracing or reveal. |
| Drawing a box (manual selection) | `/capture/group/[id]` box mode | Dashed 2px plum box with translucent soft plum fill that follows the finger; no snapping or feedback after "Use this box" beyond returning to the list with a new blank row. |
| Studio enhancement (generating) | `/capture/[id]` PhotoChoice "Studio" chip | Chip text changes to "Making studio photo" and disables. The preview keeps showing the previous image. On success the image swaps instantly and the Studio chip is selected. Network round trip plus native whitening, often several seconds. Leaving the screen loses the `making` flag while the request continues (`studio.ts:101-122`, `[id].tsx:253-274`). |
| Selecting object in image (cut-out editor, hold to select) | `/cutout/[id]` from `/capture/[id]` | Plain `ActivityIndicator` over a dark overlay while the native editor loads or saves. Hold-to-select reveals the found piece natively (`onSelect`), with a hint line (`cutout.hold`). |
| Found clothes in video (live scan) | `/capture/scan` + `src/features/ScanLift.tsx` | Before capture: no on-camera marker of the detected piece; only the heading text changes (Step into view / Hold up a piece / Hold still). On capture: camera freezes, a black shade fades to 45 percent (200 ms); a white rounded box (radius 18, 2px white border, 12 percent white fill) appears at the detected box with a diagonal white shine sweeping across on a 900 ms ease-in-out loop while the native capture runs. When done: the segmented sticker lifts (scale 1.08, shadow 0.35, 260 ms ease-out cubic), a white glint passes over it (440 ms, delay 120 ms), and after 560 ms it flies and shrinks into its slot in the bottom thumbnail strip (360 ms, bezier 0.5, 0, 0.2, 1) while the shade lifts; light haptic on landing, thumb revealed. Without a sticker the box itself flies. Reduce Motion: no sweep or glint; sticker fades in (200 ms), holds 400 ms, fades out; shade fades at 600 ms; lands at 800 ms. |
| Button work | Footer "Add N ready pieces", "Looks right", "Use this box", "Done" | Small `ActivityIndicator` inside the button (`src/ui/index.tsx:121`). |
| Camera start | `/capture/scan` | Ink rectangle and the text "Starting the camera". |

## Pain points

Navigation and modals
1. `/capture` is a modal sheet (`_layout.tsx:43-46`) and every other capture screen is pushed inside it: check, group, scan, cut-out, care label. Deep flows (photo -> group -> check -> cut-out -> label) all live inside one sheet.
2. Modal on modal: "Add without photo preparation" opens `/piece/new`, also `presentation: "modal"`, on top of the `/capture` sheet (`index.tsx:369-374`, `_layout.tsx:29-32`).
3. Screen content swaps inside one route instead of navigating, changing title and header buttons in place: tips (`index.tsx:203-242`), care label step (`[id].tsx:149-186`, title stays "Check this piece"), box mode (`group/[id].tsx:225-269`). Swipe back during box mode pops the whole group screen.
4. Header actions differ on every screen: "Close" + "Photo tips" (`index.tsx:249-257`), "Skip" (tips, `index.tsx:211-217`), text "Back" replacing the native chevron (`[id].tsx:359-364`), "Done" (label step, `[id].tsx:155-158`), "Cancel" (`group/[id].tsx:277-280`, `233-235`), "Close" + "Done" (`scan.tsx:229-237`), "Cancel" with discard confirm (cut-out). Two different keys for "Cancel" (`capture.cancel`, `common.cancel`).
5. Primary action placement differs: pinned footer on `/capture` and group, inline mid-scroll "Looks right" on check (`[id].tsx:540-547`) followed by more buttons, header "Done" on scan.
6. `MissingPiece` from the cut-out hand-off does `router.replace("/closet")` from inside the capture modal stack (`MissingPiece.tsx:14`).

Disconnected hand-offs and dead ends
7. Pending imports are invisible outside `/capture`. No route outside `app/capture` reads `closet.imports` except the hand-offs; closing the sheet mid-preparation leaves work with no indicator on Closet or Today.
8. After "Add N ready pieces" the sheet just closes (`index.tsx:187`) with no confirmation and no move to the Closet, even when entered from Today, Looks or onboarding.
9. Quick checks are one at a time: "Looks right" -> care label step -> "Done" -> back to grid -> tap the next tile (`[id].tsx:245,180-184`). No "next piece".
10. Group "Done" returns to the grid (`group/[id].tsx:145`) instead of moving on to check the kept pieces.
11. Scan "Close" keeps the scanned jobs silently (`scan.tsx:229-233`); scan "Done" with no pieces just goes back.
12. Scan permission denied shows copy that says "You can choose photos instead" but offers no such action (`scan.tsx:246-261`, en.ts:365).
13. "Try again" in problem notices always opens the photo library, even after a camera problem (`index.tsx:176-179,303`; `[id].tsx:345-350`). Retake also silently falls back to the library if the camera fails to launch (`Retake.ts:41-43`).
14. A failed garment parse is shown as "1 piece found in one photo" with "Review" (unparsed capture gets `crop: wholePhoto`, `capture.ts:22-27`, `importing.ts:384-385`, `index.tsx:96-102`).
15. Retake on a grouped job removes it from its group (`importing.ts:217-220`), so the group card count changes without explanation.

Clutter and too much text
16. Long helper paragraphs: `capture.intro` (en.ts:1040), `capture.noCutout` (en.ts:76), `capture.several` (en.ts:78), `capture.partialCheck` (en.ts:319), `capture.group.intro` (en.ts:299), `careLabel.offerBody` (en.ts:236), tips bodies (en.ts:1052-1059), `photo.studioNote` shown every time (`[id].tsx:395-397`).
17. Check screen stacks up to 3 notices, 2 paragraphs, 4 chip groups, a field and 3 full-width buttons in one scroll (`[id].tsx:355-565`).
18. "Retake" appears twice when photo advice is shown (notice action `[id].tsx:421-424` and button `[id].tsx:549-556`). Two cut-out buttons sit in different places ("Adjust cut-out" `[id].tsx:381-394`, "Cut out by hand" `[id].tsx:433-446`).
19. Failed tile crams a caption plus three stacked buttons into a 31 percent wide tile (`index.tsx:464-488`, `507`).
20. Group jobs appear twice on `/capture`: once in the group card and once each in the grid (`index.tsx:319-368`).
21. Empty `/capture` shows a disabled footer button "Add ready pieces" with nothing to add (`index.tsx:379-392`).
22. Four ways to add on one screen (Take a photo, Choose photos, Scan pieces, Add without photo preparation) with equal weight for three of them (`index.tsx:262-287,369-374`).

Consistency and copy
23. Same key, two meanings: `capture.addPiece` "Add a piece" is the Looks tab CTA into capture (`looks/index.tsx:55-56`), the `/piece/new` title (`_layout.tsx:31`) and the draw-a-box action in group (`group/[id].tsx:230,350`).
24. "Adjust crop" (group) vs "Adjust cut-out" (check, cut-out) vs "Cut out by hand" for related ideas.
25. "Take a photo" (`common.takePhoto`) vs shutter label "Take photo" (`scan.shutter`). "Choose photos instead" vs "Choose a photo instead". "Remove this photo" vs "Remove".
26. `scan.foundOne` exists but `/capture` always uses `scan.found` for scans, so one scanned piece reads "1 pieces from a scan" (`index.tsx:326-327`, en.ts:337-338).
27. Title set twice for `/capture` (`_layout.tsx:45`, `index.tsx:248`).
28. Studio failure and offline messages appear as small error text under the photos, far from the chip that started it (`[id].tsx:398`).

Interrupted magic moments (Review Focus)
29. Leaving `/capture/[id]` during Studio loses the `making` state; returning shows an active Studio chip while the first request still runs, so a second request can start (`[id].tsx:134,253-274`).
30. No in-progress visual for preparing beyond a text badge; a group row for a cropped or added piece shows an empty square while it prepares (`group/[id].tsx:293,301-310`).
31. Corrections on the check screen are dropped without a discard prompt when leaving with "Back" (`[id].tsx:357-365`); group Keep/Drop choices are dropped on "Cancel" (`group/[id].tsx:276-281`). Only the cut-out editor uses `useDiscardChanges`.
32. "Remove this photo", "Same piece" and failed-tile "Remove" delete immediately with no confirm and no undo (`[id].tsx:557-564,408`; `index.tsx:481-486`).
33. Scan has no live marker on detected pieces before capture (only status text, `scan.tsx:297-305`), so "found clothes in video" is only visible after the capture fires.
34. Debug speed readout is reachable in release builds by long pressing the status heading and is on by default in dev (`scan.tsx:75,298-310`).

## Existing Maestro coverage

| Flow file | Covers |
|---|---|
| `.maestro/04-capture/tips.yaml` | Closet -> "Add pieces"; open tips (first run or "Photo tips"); card 1 -> 2 -> 3 via "Next tip"; "Start adding pieces"; main screen visible. Screenshots tips-1..3. |
| `.maestro/04-capture/permissions.yaml` | Camera and photos denied; "Take a photo" -> camera-off Notice with "Open Settings" and "Choose photos instead"; "Choose photos instead" opens picker; Cancel returns. |
| `.maestro/04-capture/capture-group.yaml` | Needs `seed-capture.sh` run first (seeds a 3-region group with 2 people and a single photo). Waits for preparing; "3 pieces found in one photo" -> "Review"; others-ignored line; "Partly visible"; Drop a row; "Add a piece" -> draw box by swipe -> "Use this box"; 4th row appears; "Done"; open a Quick check tile; partial check paragraph visible. |
| `.maestro/04-capture/duplicate-and-retake.yaml` | Camera denied, photos allowed. Choose the same photo twice; duplicate Notice "Is this already in your closet?" with Same / Different; "Different piece"; "Retake" -> camera-off notice with "Open Settings"; "Choose a photo instead" -> library retake; back on `/capture`. |
| `.maestro/04-capture/variants.yaml` | Not capture: closet piece edit Enhanced / Plain variant (needs `seed-variants.sh`). |
| `.maestro/04-capture/sets.yaml` | Not capture: closet multi-select "These belong together" sets. |
| `.maestro/labels/capture.yaml` | Choose photos -> Quick check tile; category question, subcategory question; "Something else" shows all categories; change category and kind; fixed style "Desi, set by the subcategory"; "Looks right"; care label "Skip"; "Add 1 ready piece"; closet card label. |
| `.maestro/labels/native.yaml` | Choose photos -> Quick check -> recognised subcategory "Kurta" visible. |
| `.maestro/labels/large-text.yaml` | Large text: Choose photos -> Quick check screen top and end; "Remove this photo"; "Close" the sheet. |
| `.maestro/attributes/quick-check.yaml` | Needs `attributes/seed.sh` (seeded review job "Sage kurta"). Attribute question "Where does it end?" with "Suggested: Knee"; answer "Calf"; "Looks right"; "Skip"; tile becomes "Sage kurta, Ready". |
| `.maestro/attributes/quick-check-large.yaml` | Same seeded job at large text, scroll to suggestion, screenshot. |
| `.maestro/care-label/check-piece.yaml` | Choose photos -> Quick check; edit name (`check-name`); "Looks right"; "Add the care label?" -> "Add care label" -> label screen -> read label -> "Save care label"; label lines on check step; "Done"; "Add ... ready ..."; piece in closet. |
| `.maestro/care-label/skip.yaml` | Choose photos -> Quick check -> "Looks right" -> "Skip" -> "Add ... ready ..." footer. |

Not covered by any flow: live scan (all states, Auto/Manual, switch camera, start again, Done/Close, permission denied, unavailable, ScanLift), Studio chip (generating, success, offline, limit, failed), Enhanced/Plain/Keep original choice on the check screen, "Adjust cut-out" and "Cut out by hand" from the check screen, photo advice notice ("Use anyway" / "Retake"), "Same piece", failed job (Retry, Retake, Remove), low space, photo unavailable, "Adjust crop" on an existing proposal, Smaller / Larger and VoiceOver box resize, group "Cancel", "Add without photo preparation", "Add N ready pieces" with several pieces and the sheet auto-closing, entry from Today, Looks and onboarding, `canPrepareOnDevice` false fallback, gone states for check and group, app restart mid-preparation (`recoverImports`), Reduce Motion for ScanLift. Seed scripts (`seed-capture.sh`, `seed-variants.sh`, `clear-imports.sh`, `attributes/seed.sh`) are run by hand; no flow calls them.
