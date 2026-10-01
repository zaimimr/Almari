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

Evidence: 16 fixture labels in `src/domain/fixtures/care-labels.json`. Domain tests C01 to C23 cover the parser, fibre names, sizes, origin, merging, broken model output, the model being off, drafts, the fabric rules, storage and the recorded evaluation. `npm run check` passes with 130 tests, `npx expo-doctor` passes 21 of 21 checks, `npx expo export --platform ios --platform web` finishes, and no Needle traces remain in the code. Parser accuracy is recorded in the [model README](../../modules/closet-vision/model/README.md): the parser alone got 45 of 50 facts right and 0 wrong. Model recording pending: the Apple Intelligence model was not ready on this Mac, so the model rows are not measured. Rerun the `care_labels` tool when the model is available. Screens were checked with Maestro in English, in bokmål and with larger text. Screenshots are in [planning/build/care-label](../build/care-label). The simulator made no outside network connections while reading a label.

Known limitations:

- Brand comes only from the language model, so on a phone without Apple Intelligence she types it herself, and model accuracy is unmeasured until the recording is rerun.
- The 5 facts the parser missed on the fixtures are all brands.
- The parser's fixture score is optimistic because its rules and the fixtures were written together. Her own labels are the real test.
- Urdu script is not supported by Vision text recognition.

Before the TestFlight build is signed off on her iPhone:

- Read three real labels with Apple Intelligence on and three with it off, and note the time per label.
- Network check: turn on Settings, Privacy and Security, App Privacy Report, read three labels, and confirm Almari shows no network activity from label reading.
