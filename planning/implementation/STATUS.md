# Implementation status

Read with [the handoff](../../BUILD-PLAN.md) and [Delivery](DELIVERY.md). This records what has actually been built and checked. It is updated after each packet.

## D0: Baseline and fixtures (done, 1 October 2026)

- Baseline before changes: all 8 existing tests, typecheck, lint, and formatting passed.
- The simulator's stored closet (`closet.v1`, 12 samples, no saved looks) was copied before migration. The old key is never overwritten; the app now writes `closet.v2` and reads `closet.v1` only when no newer snapshot exists.
- Pieces now record `source: "sample" | "owned"`. The Sample label in the closet uses this field instead of the photo path.
- The twelve samples received reviewed fixture metadata in `src/domain/samples.ts`: garment type, Desi/Western, tone, suitable occasions, and warmth where relevant. These are fixture assumptions, not facts about anyone's clothes. Metadata is only restored for a sample whose category is unchanged, and owned pieces never inherit it.
- Fixture choices worth knowing: the taupe abaya is an open outer layer that needs a complete outfit beneath it, and it sits in the Western path because there is no Arab or Either option yet. No sample shoe is marked suitable for rain or snow, and no layer is marked warm, so cold time outside and snow stay honest gaps.
- The olive maxi dress was added as catalog version 2 so "Dress for work" has a real dress. It is added once through `sampleCatalog`, and it is never re-added after being deleted. Deleted version 1 samples are not restored.

## D1: Today with the sample wardrobe (done, 1 October 2026)

What works:

- Today is the first tab and the entry route. Closet and Looks are unchanged.
- Everyday style: usual occasion, Desi or Western, and a hijab preference (always, not needed, or unset). Nothing is preselected. A clearly labeled sample style is available for the sample closet.
- A stable daily outfit per local date and time zone. It survives restarts and is recomputed on a new day when the app returns to the foreground.
- Try another walks a ranked, varied list and says when there are no further combinations.
- For an occasion opens a temporary request. The everyday style and today's look stay untouched, and Back to today's look restores them.
- Garment-type requests (Blazer, Dress, Kurta, Trousers) use the stored garment type, not item names. A kept item can satisfy the request.
- Choose pieces keeps any number of exact items. Kept items are marked in the flat lay and in the piece list, and each can be released.
- Manual weather: warm, mild, or cold; dry, rain, or snow; mostly indoors or time outside. It is labeled as entered by you, never as a forecast.
- Conflicts, missing pieces, and weather gaps are explained with specific recovery actions.
- Change a piece previews alternatives in the whole outfit, changes only that piece, and supports undo. When nothing fits, it offers a separate restyle without that piece.
- Save look opens the existing builder with the outfit preselected, so saved looks keep the same item IDs and composition.
- Owned clothes can optionally be marked with a garment type and Desi/Western in the piece editor. Owned and sample clothes are never mixed in suggestions.

Automated checks: `npm run check` (typecheck, lint, formatting, 25 domain tests), `npx expo-doctor` (21/21), and `npx expo export --platform ios --platform web`. The tests cover T01 to T09, T11, T12, migration, one-time fixture seeding, day rollover in two time zones, and stale revisions.

Screens checked on the Closet Development simulator (iPhone 18 Pro, iOS 27.0, simulator, not a physical phone) with Maestro 2.11: first run, everyday style, blazer and dress requests, keeping shoes and a bag, try another, a Desi celebration in cold snow, back to today, changing the hijab, saving and reopening the look with the keyboard open, a kept-pieces conflict and its recovery, and accessibility-large text. The browser preview was checked at 1280 and 390 pixels wide. Screenshots are in [planning/build/today](../build/today).

Known limitations:

- Only the hijab preference is a coverage rule. Sleeve, neckline, hem, and opacity are not checked, and the app says so.
- Owned clothes cannot yet be marked for warmth, rain, or snow, so those requests always show "Check before wearing".
- A Kept badge can be hidden when another garment overlaps it, for example trousers under a tunic. The piece list below the outfit always shows the kept state.
- Saved looks are not yet suggested on Today, and mood is not implemented. Both belong to D3.
- The wide browser layout is a single centered column rather than two columns.
- VoiceOver reading order and Reduce Motion have not been audited.
- The wife-led usability check in the D1 stop gate has not happened yet.

## D2: Easy clothing capture (first increment, 1 October 2026)

Decisions from the owner: her phone is believed to be an iPhone 16 Pro. An optional online service is acceptable if it is quick, and a cheap classifier is preferred over a large language model. The spike showed that everything can run on the phone, so no online service or account is used yet.

What works:

- Add pieces (Closet, Today, and Looks) opens capture on iPhone. The browser preview keeps the manual editor.
- Three first-use photo tips with Skip, replayable from Photo tips.
- Take a photo, or choose up to 20 photos at once. Each photo is copied into the app, recorded as an import job, and prepared one at a time off the main thread.
- A local Swift module (`modules/closet-vision`) handles orientation, Apple Vision background removal, a transparent square cutout with visible bounds, a thumbnail, a Core ML garment classifier (SigLIP 2 base, Apache 2.0, 8-bit, 88 MB), and the dominant colour.
- The name comes from colour plus garment type, for example "Sage kurta". The category comes from the type. Kurta, kameez, shalwar, and dupatta are marked Desi. Hijabs, shoes, boots, and bags are marked for both styles.
- Each job shows Waiting, Preparing, Ready, Quick check, or Could not finish. Quick check covers a close call between two types ("Is this a hijab or a dupatta?"), no cutout, or several subjects.
- Check this piece shows the prepared image beside the original, with Use prepared or Keep original, type choices, name, and Remove.
- Add ready pieces saves only the ready jobs and leaves the rest. Saving twice, retrying, and results that arrive after a photo was removed cannot create duplicates or bring the photo back. Unfinished jobs resume after a restart.
- Originals are kept, and removing a piece also removes its original.

Evidence: the classifier comparison and license review are in [the model README](../../modules/closet-vision/model/README.md). On the Mac, Vision cutouts took about 30 ms per photo after a 3.5 second first load and kept fringe and hems. `npm run check` passes with 32 domain tests, including P01 and P07. Screens were checked on the simulator: photo tips, the photo picker with 8 photos, batch preparation, quick checks, the full type list, partial save, the closet with imported pieces, and Today styling from my clothes. Screenshots are in [planning/build/capture](../build/capture).

Known limitations:

- Vision background removal does not run in the iOS simulator, so every simulator import shows "no cutout". The same code produced clean cutouts on the Mac. It still has to be confirmed on her iPhone, along with timing, memory, and heat.
- The Core ML classifier runs on CPU in the simulator (Neural Engine is not available there).
- Recognition was tested on 48 photos, mostly not her own clothes. Accuracy on her wardrobe is unknown until she tries it.
- The tips are text only. The paired example photos from the photography specification do not exist yet.
- Blur, cropped hems, lighting, duplicate detection, and linking a Desi set (P04, P05) are not implemented.
- Retake is available as Remove followed by another photo, not as a single action.
- The app grows by about 90 MB because of the model.

Next: install the development build on her iPhone and try 10 to 20 of her real pieces, including hijabs, a white garment, embroidery, and a long dress. Then finish D2 quality hints and sets, or move on to D3.

## Labels, capture and styling: Part 1, labels (done, 1 October 2026)

What works:

- Every piece has a category, a subcategory and a style. The taxonomy has 9 categories and 46 subcategories. Earlier ids stay valid; the general `shoes` and `bag` ids are kept for stored pieces but no longer offered, so their cards show only the category until she picks a subcategory.
- Recognition pools subcategory scores per category (log-sum-exp), picks the best subcategory inside it, and takes the style from the subcategory when it is fixed or from the Desi and Western descriptions otherwise. A close call becomes one quick question, category first, then subcategory, then style.
- Check this piece shows Category, Subcategory and Style, with the one question in place of the relevant heading. Kurtas, dupattas and other fixed subcategories show their style instead of a choice.
- The piece editor shows Subcategory (required for her own pieces) and Style. Editing a piece keeps its original photo and position in the flat lay.
- Closet cards read "Category · Subcategory".
- The closet shows All plus one chip for each of the 9 categories, Hijabs & scarves first, and a second row of style, occasion and availability filters. Filters combine, and Clear filters resets them with the search.
- New and changed texts follow the phone language: bokmål when the phone is set to Norwegian (including nynorsk and plain Norwegian), otherwise English. The catalogs are `src/i18n/en.ts` and `src/i18n/nb.ts`; a missing bokmål text fails typecheck.
- What she picks or changes is stored as confirmed and is never replaced by later recognition (R01). Values the app proposed stay marked as proposed until she changes them.
- The closet moved to version 3. The app writes `closet.v3` and reads `closet.v2`, then `closet.v1`, only when no newer snapshot exists. Older snapshots are never overwritten. Unfinished import jobs keep their state.
- Needle is not used anywhere in the app. Recognition uses only the on-device classifier.

Evidence: `npm run check` passes with 56 domain tests, including the migration from a realistic version 2 closet, the category pool, the fixed style table, one question when several things are unsure, and confirmed values surviving re-preparation. `npx expo-doctor` (21 of 21 checks) and `npx expo export --platform ios --platform web` pass. Recognition evaluation is pending photos: only the 13 sample garments were available, and on those the Core ML 8-bit model got category 13/13, subcategory 13/13 and style 13/13, with 6 quick checks. The 35 earlier web photos and the 20 extra photos still have to be collected, so the 48-photo and 20-photo numbers do not exist yet. Details in [the model README](../../modules/closet-vision/model/README.md). Screens were checked with Maestro on the Closet Development simulator (iOS 27.0), including accessibility extra large text and bokmål; screenshots are in [planning/build/labels](../build/labels).

Known limitations:

- Recognition accuracy on the new subcategories and styles is unmeasured beyond the 13 sample garments until the evaluation photos exist.
- No photo exists yet for shirt, kameez, jacket, clutch, backpack, belt and dupatta, so those subcategories are untested.
- Shawls and underscarves sit in Hijabs & scarves, so Today can still use a shawl in the hijab slot until the stylist rules in Part 6.
- Screens and texts that were not changed in this part, including the tab bar, stay in English on a Norwegian phone until Part 8.
- Pieces without occasion tags show under every occasion filter until she tags them. Unavailable shows nothing until Part 2 adds Mark as unavailable.
- Owned pieces saved before this version have no record of whether their subcategory was proposed, so they count as confirmed and will not be re-labelled automatically.
- The simulator cannot remove backgrounds, so every simulator import asks a quick check; real photos on her iPhone have not been tried with the new labels.

## Part 2: Piece attributes and colour (done, 1 October 2026)

What works:

- New photos get suggested length, sleeves, fit, pattern, pattern size, fabric and embellishment, plus a formality from 1 to 6 worked out from the subcategory, fabric and embellishment. Each value is stored with its source: suggested, from the care label, or confirmed.
- A quick check is asked only when length or sleeves are unclear and no category, subcategory or style question is already being asked, so a piece never gets more than one question. Unclear fabric or pattern stays a suggestion.
- See-through and open front are never guessed.
- The item page shows fact chips for colour, subcategory, fabric, pattern, see-through, fit, length, sleeves, formality and season. Guesses have a dashed outline and a question mark; tapping one asks her to confirm or change it. Unknown values have no chip.
- Mark as unavailable (in the wash, lent out, needs repair) keeps the piece in the closet and in saved looks but leaves it out of outfit suggestions and Change a piece until she marks it available. A piece on today's outfit is swapped out at once; a kept piece is explained with a release. The closet filters Available and Unavailable.
- The item page shows how many saved looks use the piece.
- Editing moved behind Edit on the item page. The editor shows a Details section with each value, where it came from, and Looks right or another option to confirm it. Confirmed values are never replaced by a later suggestion.
- On iPhone, k-means on the cutout gives up to three garment colours with their share, and the name uses the largest one. The image embedding is stored as 768 signed bytes (1,024 base64 characters).
- Colour maths for the stylist: Lab and LCh, CIEDE2000, colour classes (black, white, grey, navy, denim, warm neutral, accent) and pair relations (same, tonal, near miss, analogous, complementary, echo) plus the outfit contrast range.
- Existing owned pieces are re-prepared once in the background from their originals. Imports go first, failures are skipped, scratch files are removed, and values she set by hand stay.
- Every new or changed text on these screens is in English and bokmål.

Evidence: `npm run check` with 103 domain tests, including all 34 CIEDE2000 reference pairs from Sharma, Wu and Dalal (2005), colour classes and pair relations at each threshold, the one-question rule, re-preparation keeping confirmed values, fact chips and their sources, and availability on Today. `npx expo-doctor` and `npx expo export --platform ios --platform web` pass. Simulator checks with Maestro (item page, confirming a guess, Mark as unavailable, piece details, the length question, removing a piece, larger text) are in [planning/build/attributes](../build/attributes). The background pass was checked on the simulator with a seeded older piece.

Known limitations:

- The simulator cannot cut out garments, so palettes there are always empty. Colours and their shares have to be checked on her iPhone.
- Attribute accuracy has not been measured. Suggestions may be wrong until she confirms them.
- The colour report's thresholds put camel, olive and chocolate in accent rather than warm neutral. The colour layer in Part 6 should tune this with her clothes.
- Sample pieces have no attributes or colours yet, so their item pages show only subcategory and, where set, season.
- Used in counts saved looks only. The wear count arrives with Wore this in Part 6.
- A piece whose photo is replaced in the editor loses its colours and embedding and is not re-prepared, because the one-time pass has already run.
- Screens that existed before this part still have English-only text; Part 8 moves them into the catalog.

## Part 3: Care label (done, 1 October 2026)

What works:

- After Looks right in Check this piece she is asked "Add the care label?" with Add care label or Skip. A label can also be added, viewed, edited and removed later from the item page. All new text is in English and bokmål.
- The label photo is read on the phone with Apple Vision (English, Norwegian bokmål, German, French and Turkish). The photo is stored with the piece, shown only on the Care label screen, and deleted with the label, the piece or an unfinished import.
- A rules parser reads fibres with percentages, size and origin in English and Norwegian. When Apple Intelligence is on, the on-device language model fills only fields the parser left empty, usually the brand. A model value is kept only when it is printed on the label. When Apple Intelligence is off, still downloading or does not support the phone's language, only the parser runs and the screen does not mention it. Fields that cannot be read stay empty and editable.
- Fibres are stored as one English name and shown in the app's language. Cotton, linen, wool, cashmere, silk and modal set the piece's fabric with source label. A fabric she confirmed is never replaced, and removing the label clears only a fabric that came from it. Washing and care symbols are not stored.

Evidence: 16 fixture labels in `src/domain/fixtures/care-labels.json`. Domain tests C01 to C23 cover the parser, fibre names, sizes, origin, merging, broken model output, the model being off, drafts, the fabric rules, storage and the recorded evaluation. `npm run check` passes with 133 tests, `npx expo-doctor` passes 21 of 21 checks, `npx expo export --platform ios --platform web` finishes, and no Needle traces remain in the code. Parser accuracy is recorded in the [model README](../../modules/closet-vision/model/README.md): the parser alone got 45 of 50 facts right and 0 wrong. Model recording pending: the Apple Intelligence model was not ready on this Mac, so the model rows are not measured. Rerun the `care_labels` tool when the model is available. Screens were checked with Maestro in English, in bokmål and with larger text. Screenshots are in [planning/build/care-label](../build/care-label). The simulator made no outside network connections while reading a label.

Known limitations:

- Brand comes only from the language model, so on a phone without Apple Intelligence she types it herself, and model accuracy is unmeasured until the recording is rerun.
- The 5 facts the parser missed on the fixtures are all brands.
- The parser's fixture score is optimistic because its rules and the fixtures were written together. Her own labels are the real test.
- Urdu script is not supported by Vision text recognition.

Before the TestFlight build is signed off on her iPhone:

- Read three real labels with Apple Intelligence on and three with it off, and note the time per label.
- Network check: turn on Settings, Privacy and Security, App Privacy Report, read three labels, and confirm Almari shows no network activity from label reading.

## Part 4: Capture and the rest of D2 (done, 2 October 2026)

What works:

- One photo of her wearing an outfit, or a flat lay on the floor or bed, becomes several pieces. A clothes parser (SegFormer B2 trained on clothes parsing, Core ML with 8-bit weights, 27.9 MB) runs on the phone. Only the largest person is used; when other people are in the photo she is told they were ignored. Left and right shoes become one pair, hat and scarf become a hijab proposal, small regions are dropped, and floor, hair, face, arms and legs are ignored.
- Add pieces shows "N pieces found in one photo". The review screen has Keep and Drop for each piece, Adjust crop, and Add a piece with a box drawn by hand. A piece that is partly hidden is marked Partly visible and gets a quick check before it can be saved.
- A photo of one garment without a person still uses the Vision cutout. Pieces from one photo share a `captureId`, and dropping one never deletes the photo or files the others still use.
- After the cutout, the phone makes an enhanced closet image with Core Image: white balance from the neutral background around the piece (never from the piece itself), a small exposure lift when the background is dark, a light shadow lift, light sharpening, centring, and a soft shadow on the white canvas. The plain cutout is kept.
- Check this piece and the piece screen offer Enhanced and Plain. Enhanced is the default and she can switch at any time. Keep original still works.
- Each photo is measured for blur, brightness, cut-off edges, merged background and mixed light. One advice message is shown on the piece with Retake or Use anyway. It never blocks saving, and the same advice is not shown again after a retake.
- Retake replaces the photo of a job in place. The saved piece keeps one id, so retakes and repeated saves never create a second piece.
- A new photo very close to an owned piece, or to an earlier photo in the same batch, asks Same piece or Different piece.
- Pieces can be selected in the closet and linked with These belong together. The piece screen shows the rest of its set and can remove it from the set. A set never keeps a single piece.
- Photo tips have simple drawings in the app colours and can be replayed from Photo tips.
- Denied camera access, photos that cannot be opened (including iCloud originals while offline), low storage, and preparation failures each keep her work and offer a next step. The system photo picker works without photo library access, so limited access does not hide photos.

Evidence: `npm run check` passes with 175 domain tests, including proposals from a group photo, the single-garment fallback, splitting one photo into jobs, shared file clean-up, fresh file names for a piece cropped again, quality advice, retake idempotence, duplicate thresholds and set linking. `npx expo-doctor` passes 21 of 21 checks and `npx expo export --platform ios --platform web` finishes. The parser check: Core ML against PyTorch mean pixel agreement 0.997 on the sample garments. The region check (`modules/closet-vision/checks/parse`) passes on synthetic label maps. Her own photos have not been run yet: `~/Almari-test-photos` does not exist on this Mac, so the check ran on the 16 photos in the repo and gave 11 of 23 garments with the right kind (6 extra regions, 12 missed). These numbers are provisional; the table and the rerun command are in the [model README](../../modules/closet-vision/model/README.md), and no photos are committed. The native check (`modules/closet-vision/checks`) on the 13 sample cutouts: hue moved at most 0.3 degrees in neutral light and 0.7 degrees after correcting a warm cast; blur, a cut hem, a dark photo, a merged background and mixed light were all detected. Screens checked on the Closet Development simulator with Maestro, including accessibility extra large text, and the attribute flows now have a seed script (`.maestro/attributes/seed.sh`). Screenshots are in [planning/build/04-capture](../build/04-capture).

Known limitations:

- The simulator cannot run Vision background removal, so Enhanced and Plain in Check this piece, the soft shadow on real photos, clipped-edge advice and merged-background advice must be confirmed on her iPhone. The piece screen switch was checked with a seeded fixture.
- Thresholds are starting values: blur below 60, dark below 0.22, merged above 0.9 coverage, mixed light above 8, duplicates above 0.93 cosine similarity. Sample renders measured sharpness between 125 and 2176. Tune them with her photos.
- Straightening is not done: rotating only the enhanced image would move it against the plain one and the stored frame.
- Formal and casual set rules in styling belong to Part 6.
- The clothes parser is licensed for non-commercial use only (NVIDIA Source Code License for SegFormer). Review it again before any public release.
- The parser labels a jacket over a top as one Upper-clothes region. Add a piece with a box covers the second piece for now.
- Person masks and background removal do not run on the simulator. The review screen was checked with seeded fixtures made from the sample garments; parsing worn photos must be confirmed on her iPhone.
- A piece prepared from a parser cutout gets no white balance from the background and no coverage, light spread or cut-edge advice, because there is no full-photo garment mask for it.
- Low storage is checked before adding photos (under 300 MB free); a failure while preparing shows the space message only when the native error says storage.
- Pieces from one photo each keep their own copy of the original photo, so a photo split into several pieces uses more storage.
- Parser accuracy on worn outfits, and the person gate, are unmeasured until her photos are run.

## Part 5: Onboarding, colour analysis and weather (done, 2 October 2026)

What works:

- A six-step onboarding shows once on first start: hijab and coverage, units and city, body (height and shape), taste (fit, colours, Desi, Western or both), colour analysis or a skin swatch, and a done screen with photo tips. Every step has Skip and a progress line. Existing closets with her own clothes skip it.
- Answers fill the style profile; skipped answers stay empty and neutral. The hijab answer sets the everyday hijab preference (always, not needed, or unset for sometimes). Choosing Desi or Western sets the everyday style.
- Profile and settings (Profile on Today, always visible) lists every answer and opens the same step to change it. It also has Language (Follow phone, English, Norsk bokmål), Replay onboarding, Reset all data with a confirm step, the app version and a privacy line. There is no login; everything stays on the phone.
- Colour analysis: a selfie with the front camera (or a recent selfie) is measured on the phone. Vision face landmarks find cheeks and eyes, the clothes parser finds hair and face, and white balance comes from the eye whites and a neutral background. Dark or mixed light asks for a retake. She sees skin, hair and eye colours, undertone, depth, contrast, one of 12 seasons and six best colours, and can change any of them. The photo is deleted right after.
- Weather: the city is looked up once without asking for location. Today fetches the WeatherKit forecast once a day and uses 08 to 20 local time: warm from 18°C, cold below 8°C (feels-like with wind chill), rain or snow when the chance is 40% or more. A manual choice wins for the day. Without network or with a WeatherKit failure, Today says the forecast is unavailable and manual weather works. The Apple Weather mark and legal link are shown with every forecast.
- Metric and Celsius by default; imperial changes height and temperature display.
- The camera and photo library permission prompts are in bokmål on a phone set to Norwegian.

Evidence: `npm run check` with 224 domain tests, including the closet migration (older keys untouched), every onboarding answer, colour thresholds at each boundary, all 12 seasons, hair covered by a hijab, retakes, the daytime window, wind, rain and snow thresholds, manual winning over the forecast, the no-network fallback, the language choice, replay and reset. `npx expo-doctor` (21 of 21) and `npx expo export --platform ios --platform web` pass. Simulator flows on a Release build (onboarding, skip all, city lookup, colours intro and a faceless photo retake, Today forecast note, answers, settings in English and bokmål, replay, reset, larger text) are in [planning/build/onboarding](../build/onboarding). A faceless library photo gives the retake message and leaves no picker copy behind.

Known limitations:

- The skin undertone, depth and season thresholds are practitioner heuristics chosen in this part, not published constants. They need tuning on her real selfies.
- The colour layer that uses her best colours is built in Part 6.
- The debug build on the simulator cannot fetch WeatherKit, so the forecast itself is only checked on her iPhone. WeatherKit must be ticked for `com.zaimimran.almari` under Capabilities and App Services in the Apple developer portal before the TestFlight build.
- The simulator camera opens but cannot take a picture, so a measured selfie is only checked on her iPhone.
- Onboarding flows clear the simulator; re-run the Part 2 to 4 seed scripts before their flows.
- Screens not yet in the string catalog (Today, Adjust, Everyday style, some header titles and the loading screen) stay English until Part 8, so Norwegian testers see mixed languages there.
- The confirm dialog's Cancel button is still English.
- Switching language returns to Today.
- The permission prompts follow the phone's language, not the in-app language choice.

Pending for the owner, with a TestFlight build on her iPhone (delete and reinstall first, so onboarding shows):

1. Onboarding shows on first start. Answer hijab and coverage, type Oslo and tap Find city, skip body, answer taste.
2. Colours: take a selfie facing a window in daylight. Expected: skin, hair (or Not measured with a hijab on) and eyes swatches that look like her, a season, and six best colours. Adjust undertone and see the season change. Save.
3. Retake checks: a selfie in a dim room gives the too-dark message; a selfie with a warm lamp on one side and daylight on the other gives the mixed light message. Neither shows a season.
4. In the Photos app, no new selfie was saved.
5. Today shows "Forecast for Oslo" with a temperature range in °C, the Apple Weather mark and Data sources. Data sources opens Apple's legal page. The context line ends with "(forecast)" and matches the day's weather.
6. Adjust, choose Warm: Today says she chose the weather herself and the outfit follows Warm. Close and reopen the app: still her choice.
7. Profile, Units and city, choose Feet and °F, Save: height shows in feet and inches and Today's range shows in °F.
8. Turn on flight mode, open Profile, change the city to Bergen and save, return to Today. Expected: "The forecast is not available right now" and manual weather still works. Turn flight mode off.

## Part 6: The stylist (done, 2 October 2026)

What works:

- Seven occasions with formality levels: Everyday 1, Work 2, Dinner or dawat 3, Eid 4, Party or mehndi 4, Wedding guest, nikah or walima 5, Barat or formal wedding 6. Stored `celebration` values open as Party or mehndi; the stored snapshot is not rewritten until the next save under the current key.
- The sample catalog moved to version 3 with the new occasions, attributes and measured colours. Stored samples are refreshed in place; removed samples stay removed and names she edited stay.
- Today ranks outfits with the rules scorer: 119 rules from `src/domain/scoring/rulebook.json` (version 1, validated when the app loads), a colour layer from each piece's palette, her best colours next to the face from the colour analysis, and her taste. Hard constraints, the date-seeded tie-break and the two-reason explanation are unchanged. Reasons never quote an attribute that is still a proposal or a colour analysis she has not confirmed. Pieces marked unavailable are never suggested.
- Each shown outfit can gain a bag, and a Desi outfit a dupatta, when that improves it.
- Today is the outfit view: the main garment large with the hijab, accessories, bag and shoes in a column, a plain outfit name such as "Sage party kurta" ("Kurta i salviegrønt til fest" in bokmål), the reasons, and Change, Not for me and Wear this. Three card layouts (outfit only, with reasons, with reasons and coverage checks) are switchable in Style settings; with reasons is the default. Coverage checks only name a gap when the values behind it are confirmed.
- One tip line below the outfit names a piece she does not own when an empty role would clearly help, for example "A hijab in ivory would finish this." It never enters the flat lay.
- Style this piece on the item page opens Today with that piece kept; her everyday outfit stays.
- Looks lists saved looks and worn outfits together, each with its name and occasion.
- Style settings: card layout, belt over long pieces, shortest top, trousers or skirts, print on print, colours to avoid at weddings, dupatta at family events, regional leaning, and a link to her onboarding answers. All style settings start at No preference and only switch or weight rules.
- Feedback: Too formal, Too plain, Too warm and Not my style (under Not for me) change the outfit for the same request and update her taste. Wear this can be undone. Changing a piece and saving today's outfit as a look also count. Every event records the engine. Taste weights stay within 1.0 of each rule weight; twenty Not my style taps on one outfit leave every piece available.
- All new text is in English and bokmål.
- `npm run evaluate` scores a rated outfit file. The starter file is a developer smoke set from the samples: pairwise ordering accuracy 100.0% (15 of 15 pairs), no bad outfit in a top three.

Evidence: `npm run check` (349 domain tests), `npx expo-doctor`, `npx expo export --platform ios --platform web`, Maestro flows in `.maestro/stylist` (style settings, occasions, feedback, layouts, looks and Style this piece, larger text) on a Release build in the simulator, including accessibility-large text. Screenshots are in [planning/build/stylist](../build/stylist).

Known limitations:

- The rule weights are research defaults, not tuned on her ratings. The 60 to 100 outfit rating session with her has not happened yet; see [planning/eval/README.md](../eval/README.md).
- Her owned pieces only get attribute-based rules once Part 2 has proposed attributes and she has confirmed the ones that matter; until then colour, occasion formality from the subcategory, and her feedback carry most of the ranking.
- Jewellery metal, tucking, funerals and coverage layering rules are not encoded. Neckline coverage is not checked.
- Sample hijabs carry only `pattern`, `fabric` and `formality`, and sample shoes and the bag only `formality`, so `statement-hijab-busy-main` (its embellishment branch) and `sparkly-hijab-work` never fire on the sample closet. Rules that name kinds the samples do not have (for example `dupatta`, `shawl`, `belt`, `heels`, `khussa`, `skirt`) are only exercised by her own pieces and the unit tests.
- Screens that existed before this part keep their English text until Part 8 moves them into the catalog.
- Changing a style setting keeps today's outfit; the next Change uses the new settings.
- On a phone screen the flat lay is tall, so the reasons and Change, Not for me and Wear this sit below the fold and need a scroll.

## Part 7: Trained model and comparison (done, 2 October 2026)

What works:

- A small outfit compatibility head (50,944 parameters) trained on Polyvore Outfits over the same SigLIP 2 image embeddings the app stores for each piece. Training, evaluation and export scripts are in `modules/closet-vision/model/compat`. The head runs in TypeScript with no extra native model.
- Style settings has a Stylist choice: Rules, Model or Compare. Compare takes turns for each new suggestion, starting from an engine fixed by the date, and Change stays with the engine of its list. Nothing on Today shows which engine styled an outfit.
- Model keeps every hard constraint and shows the rules layer's reasons. When a piece that could be suggested has no photo reading, the suggestion is styled by Rules and recorded as Rules.
- Every feedback event records the engine and the outfit's position in its list.
- Compare results, under Style settings, shows per engine and split by Western and Desi: would wear in the first three, Not my style, and Wore this.
- The Stylist setting sits next to the card layout setting, and both new screens' texts are in English and bokmål.

Evidence: Polyvore test numbers, nondisjoint AUC 0.9279 and fill in the blank 0.6828, disjoint AUC 0.9233 and fill in the blank 0.6961 (README in `modules/closet-vision/model/compat`). Rated outfit set: Rules pairwise 1.000 with 0 bad in the top three, Model pairwise 0.333 with 3 bad in the top three (12 outfits in 3 requests, the developer smoke set). `npm run check` passes with 349 domain tests, including model scorer determinism, the fallback without embeddings, Compare alternation and results aggregation. Screens checked in the simulator with Maestro on a Release build (Stylist setting and Compare results in English at normal and the largest text size, in bokmål, and Today under Compare without an engine label); screenshots are in [planning/build/model](../build/model).

Known limitations:

- Polyvore has no hijabs, kurtas, shalwar, abayas or dupattas, so Model is out of its training data for Desi outfits and treats a hijab as a scarf.
- Polyvore item image rights are unclear. Use is personal only. The licence is reviewed again before any public App Store release, and the head is removed if it cannot be cleared.
- Pieces saved before Part 2, or added in the manual editor, have no photo reading, so Model falls back to Rules for requests that could include them until they are photographed again.
- The results are only as good as her feedback count; a few events per engine are not enough to choose a winner.

## Part 8: The rest of D3 (done, 2 October 2026)

What works:

- Coverage: her one coverage answer from onboarding (Full, Moderate or My own line) decides what is checked, and Everyday style shows the same answer, with sleeve and hem choices only for her own line. Only confirmed sleeve and length values count. An outfit with an unknown coverage fact is shown under Check before wearing with one question, never as ready (R02). Coats and open abayas never certify what is beneath them, and a see-through piece never certifies anything (R07). See-through and open front are asked only when an outfit depends on them, as one question. Neckline is still not checked, and Today says so.
- Hijab comparison: Compare hijabs (or tapping the hijab) shows the current hijab and up to three alternatives ranked by the active stylist, each previewed in the whole outfit with one short reason when there is evidence. Use this hijab changes only the hijab, and Undo last change restores it (R03).
- Saved looks on Today: From your looks lists saved looks that fit the request as saved, separately from variants with missing, unavailable or archived pieces. Fill the gap keeps the remaining pieces and restyles the rest. The saved look itself never changes (R04).
- Archive: on the item page next to Mark as unavailable, reversible with Back in my closet, separate from Remove piece and from Unavailable. Archived pieces are never suggested, never offered as replacements or hijabs, and sit on their own Archived shelf in the closet.
- Weather for her clothes: warmth, rain and snow are proposed from fabric and subcategory and shown as suggested on the item page. Weather checks use only what she confirms, for the forecast and for weather she picks by hand; a suggested value is named under Check before wearing with a link to the piece.
- Language: every screen follows the phone, English or bokmål. The screens from before these parts are in the catalogs, `src/domain/catalog.test.ts` checks that bokmål is complete, and `npm run strings` fails on any hard-coded screen text.

Automated checks: `npm run check` with new tests in `coverage.test.ts` (R02, R07, the one question, one coverage vocabulary, sample fixtures), `wardrobe.test.ts` (archive, R03, R04), `pieceWeather.test.ts` (proposals, confirmed values, manual and forecast weather) and `catalog.test.ts` (bokmål complete, placeholders, no nynorsk words), plus `npm run strings`. 361 domain tests pass. `npx expo-doctor` and `npx expo export --platform ios --platform web` pass.

Screens checked on a simulator Release build with Maestro flows in `.maestro/wardrobe` (coverage, hijab, looks, archive, weather at default and accessibility-large text, and bokmål). The stylist, onboarding and capture suites were run again on the same build and pass. Screenshots are in [planning/build/wardrobe](../build/wardrobe).

Known limitations:

- Neckline, slits and lining are not checked.
- Sample clothes have fixture sleeve and length values; they are not facts about real garments.
- Rain and snow suitability is never taken from a photo: boots are only suggested, and nothing counts until she confirms it.
- The hijab sheet has no zoom yet.
- Variants are repaired by restyling around the remaining pieces; when nothing fits, Today explains why instead of showing a repair preview.
- Sample piece names are stored data and stay in English on a Norwegian phone.

## Part 10: Profile tab, onboarding polish and outfit builder (code done, 2 October 2026; simulator checks pending)

What was built:

- Profile is a fourth tab (Profile, bokmål Profil, `person.crop.circle`). It holds her answers with Change, a link to Style settings, Closet stats (pieces in the active wardrobe without archived ones, never worn, the three most worn) and the app settings (language, replay onboarding, reset, privacy and version). The Profile button on Today and the Edit your answers link in Style settings are gone. `/today/profile` no longer exists.
- Onboarding and the colour analysis are full screen without the stack header, with their own top bar: Back on every step except the first (answers are kept), Cancel when one answer is changed from Profile, and the step progress. Skip stays.
- Body shape is chosen from six neutral line figures (`assets/shapes`, SVG sources rendered to PNG at 1x, 2x and 3x), tinted when selected, with Prefer not to say below.
- Selfie: a native front camera view in `closet-vision` (`SelfieCameraView.swift`, AVFoundation, no new dependency) with a dashed oval head guide and one live instruction at a time: look into the camera, face a window for more light, move closer, move back, fit your face in the oval, look straight at the camera, hold still, ready (`src/domain/selfieGuide.ts`). Choose a recent selfie stays as the fallback, and is the only option on the simulator, the web and when camera access is off.
- After a selfie is measured, the photo is shown with three draggable points (skin, hair, eyes) at the positions the analysis used. Dragging re-samples that point on the phone (`sampleSelfie`, same white balance as the analysis) and updates the swatches, undertone, depth, contrast and season live (`resampleColours`). The photo stays in the temporary folder only until Save, Try again or leaving the screen, then it is deleted.
- Outfit builder: Fill the rest keeps her pieces and completes the outfit with the active stylist and every hard rule (`src/domain/builder.ts`, through `styleOutfits`). The piece strip is ranked by the stylist score with the picked pieces, picked pieces first and pieces that break a rule (a second main piece, the other style, the other wardrobe, unavailable) last. Tapping a piece in the preview shows up to three alternatives for that slot. The name is prefilled with the plain outfit name and follows the pieces until she types her own.

Evidence: `npm run check` with 385 domain tests (new: `profileStats.test.ts`, `builder.test.ts`, `selfieGuide.test.ts`, `previousStep` and `resampleColours`), `npm run strings`, `npx expo-doctor` (21 of 21) and `npx expo export --platform ios --platform web` pass. Maestro flows are written in `.maestro/profile-onboarding-builder` (onboarding Back and body shapes, Profile tab and stats, builder fill, swap and naming); screenshots go to [planning/build/profile-onboarding-builder](../build/profile-onboarding-builder).

Not yet verified:

- The Release build for the simulator failed because the Mac ran out of disk space, so the Swift code (`SelfieCameraView.swift`, the points and `sampleSelfie` in `SelfieColours.swift`) has not been compiled yet and the Maestro flows have not been run. Free several GB, run `pod install` in `ios`, build, then run the three flows.

Known limitations:

- Face direction comes from AVFoundation face metadata, which reports yaw in coarse steps, so Look straight at the camera only shows for a clearly turned head.
- Moving a point re-derives undertone, depth, contrast and season from the measured colours, which replaces any chip she changed before dragging.
- When the hair is covered, the hair point starts above the forehead with no colour; dragging it onto a hijab would read the hijab as hair.
- Closet stats count wears from Wear this only.

Owner checks on her iPhone (TestFlight build):

1. Profile tab: answers, Open style settings, Closet stats after one Wear this, language, replay and reset all work.
2. Onboarding: Back on steps 2 to 6 returns with the answers kept; body shape drawings look tasteful at normal and large text.
3. Colours, Take a selfie: the live front camera shows with the oval. Covering the camera, standing far away, very close, off centre, turning the head and moving each give the matching instruction; facing a window and holding still gives Ready.
4. Take the photo: the frozen selfie shows skin, hair and eye points in the right places. Dragging each point changes its swatch, and the season changes when the skin point is moved to a much lighter or darker area. Save, then check the Photos app has no new selfie.
5. Builder: pick one piece, Fill the rest, tap the hijab in the preview and choose another, check the name follows until you type your own, save.
