# Clothing photography, tutorials, and automatic import

This specification covers both the help shown to the user and the pipeline that turns a photo into a faithful closet item. Clear photos should normally need no name or category typing. Start with a few useful pieces, not a demand to digitize the entire wardrobe.

## 1. Principles

- The original garment remains the source of truth.
- Improve framing and remove the surrounding background while preserving color, pattern, silhouette, sleeve length, hem, texture, and visible transparency.
- A quick usable photo is valuable. Do not require studio equipment, perfect ironing, special backdrops, or a professional setup.
- Teach in context with short help, examples, and recoverable quality hints.
- A normal single-item photo should become a suggested name, category, cutout, and review thumbnail automatically.
- Keep the original available for comparison, retries, and future processing.
- An uncertain result should be easy to correct. Do not convert uncertainty into confident coverage, fabric, or weather attributes.

The guidance below is a practical starting protocol to test with the wife's phone and clothes. Tune it from real examples; do not promise identical color reproduction across every camera and display.

## 2. First-use tutorial: app-ready copy

Present three short cards when she first opens clothing capture. Each has a real example image, concise text, a visible Skip action, and progress that does not require watching an animation. Make the same tutorial available later through Photo tips.

### Card 1: Find soft light

**Title:** Let the real color show.

**Body:** Place your piece near a window in even daylight. Avoid strong sunlight, harsh shadows, and colored lamps.

**Visual:** The same garment in soft window light and under a strong warm lamp. Label the lighting conditions plainly. The garment itself must be identical across the instructional comparison.

### Card 2: Give it a clear background

**Title:** One piece, a little space.

**Body:** Use a plain background that contrasts with your clothes. Spread sleeves and hems so the whole shape is visible. Photograph one piece at a time.

**Visual:** A pale tunic on a contrasting neutral surface, with all edges inside the frame. A pair of shoes is treated as one closet item.

### Card 3: Take it straight on

**Title:** Keep every edge in view.

**Body:** Hold your phone parallel to the clothes. Leave a small border around the piece, tap to focus, and take the photo. We will prepare the closet image for you.

**Primary action:** Start taking photos.

Only use the final sentence once automatic preparation actually works. Before then, the tutorial's copy must describe the currently implemented behavior.

Do not gate camera access behind the tutorial. Remember dismissal locally. Replay must always be available. Include text alternatives for every visual and respect Reduce Motion.

## 3. The quick capture routine

Offer this as a single help screen and optional checklist:

1. Wipe the camera lens if the image looks hazy.
2. Choose even light, preferably near a window without a direct sunbeam.
3. Put one item on a plain surface, or hang it against a plain wall.
4. Gently arrange sleeves, straps, hems, and other important details. Do not stretch the garment into a different shape.
5. Use the main camera at its ordinary field of view where practical. Step back to fit the item rather than relying on extreme wide-angle distortion or digital zoom.
6. Hold the phone parallel to a flat lay, or straight in front of a hanging garment.
7. Include the entire piece with a small margin. No cut-off hems, cuffs, or handles.
8. Tap to focus, hold still, and take the photo.
9. Check the preview once: full item, clear edges, recognizable color.
10. Take the next piece. Review the prepared batch together.

Keep camera defaults simple. Prefer ordinary photo mode without portrait blur, beauty filters, strong color filters, or flash that washes out pale fabric. Do not require users to understand exposure values or white-balance settings.

## 4. Capture background versus closet background

The app displays cutouts on white. The photo does not have to be taken on white.

- White or cream clothing: choose a mid-tone neutral surface, such as a plain gray sheet or wall.
- Black or very dark clothing: use a lighter neutral surface and enough even light to reveal the edges.
- Patterned clothing: use a plain surface so embroidery and print do not merge with the background.
- Avoid a backdrop close to the garment's own color when its edges become hard to distinguish.
- Avoid highly colored surfaces that visibly reflect color onto the clothing.

Never tell her to photograph every item on the same white background simply because the closet UI is white. The tutorial should explicitly demonstrate this distinction.

## 5. Instructions by garment

| Piece | Recommended setup | Details to keep visible | Optional extra photo |
| --- | --- | --- | --- |
| Hijab/scarf | Lay open or in a loose, shallow fold on a plain contrasting surface | Main color, print, border, fringe, and enough shape to identify it | Close-up of print or fabric label |
| Long tunic/kurta/kameez | Lay flat or hang straight; extend sleeves naturally | Neckline, sleeve reach, hem, side openings, embroidery | Side opening or lining detail |
| Trousers/shalwar | Lay waistband flat with both legs visible | Full leg length, width, cuffs, and distinctive fabric | Label or fastening detail |
| Blazer/jacket | Hang or lay flat, with sleeves separated | Front opening, lapels, full sleeve length, hem | Closed-front or lining view |
| Dress/abaya | Hang against a clear wall or use a large flat surface | Entire length, front opening/closure, sleeves, neckline | Side slit, back, or underlayer detail |
| Matching Desi set | Photograph each piece separately, then link them as a set | Kurta, trousers, dupatta, and any separate layer | One group photo as a set reference |
| Shoes | Photograph the pair together on a plain surface from a useful slight overhead angle | Color, silhouette, heel, straps, and material appearance | Sole/label only if relevant to owner-confirmed use |
| Bag | Stand upright or lay flat without twisting it | Body, handles, strap, and hardware | Size comparison or interior, optional |
| Belt/jewelry/accessory | Lay individually with its shape clear | Full length or recognizable outline | Detail if small features matter |

One good front photo is the normal starting point. Extra photos belong to the same item and must not create duplicates. Do not make three views mandatory for every piece.

### Hijabs

Avoid a tightly twisted bundle when the goal is identifying print, borders, or drape. A shallow fold is enough for a tidy thumbnail; a more open arrangement is useful for a patterned scarf. Keep fabric texture and translucency intact during cleanup.

A photo cannot reliably establish how opaque a scarf will be when worn or how it feels. If relevant to her profile, ask whether she uses an undercap or prefers a particular layering arrangement, with an option to leave it unknown.

### Long garments

The entire hem must fit in frame. Step back or choose a longer clear surface. Avoid photographing from a high angle that makes the bottom look narrower or shorter. The app must not invent the missing hem if it is cropped out.

An open abaya must retain its open front. A long outer layer must not be relabeled as a closed dress because that makes a styling template easier to satisfy.

### Embroidery, lace, fringe, and sheer fabric

Use even light and a contrasting plain backdrop. Keep the whole item as the primary photo; add a detail image only when useful. Background removal must preserve fine edges, tassels, intentional holes, and transparent regions.

If the cutout erases embroidery or fills lace, offer Keep original and Retake. Add Refine edges only when an evaluated correction tool exists; a brush editor is a later refinement. Never automatically replace fine texture with a smooth invented surface.

### Sets

After related photos are reviewed, offer These belong to a set with optional piece-role labels. Keep individual IDs. A grouped photo can be attached as a reference, but must not be assumed to contain automatically separated usable pieces.

The first version should flag a multiple-garment image and ask which item to import or suggest separate photos. Automatic multi-garment extraction is a later evaluated capability.

### Photos of clothing being worn

Support choosing an existing photo without requiring anyone to wear clothing for capture. A person wearing several layers is a harder segmentation problem and may expose personal information.

Offer a crop before any optional remote processing, explain that extraction may need review, and never reconstruct hidden fabric as if it were photographed. Do not infer body shape, religion, skin tone, or identity. Keep mannequin/person removal separate from the basic single-item capture pipeline.

## 6. Quality hints in the camera and review

Use quiet, actionable hints. A hint should not block saving a usable image unless the file is unreadable or a technical requirement prevents import.

| Detected issue | Suggested copy | Action |
| --- | --- | --- |
| Edge outside frame | The sleeve or hem may be outside the photo. | Step back / Use anyway |
| Blur | This looks a little soft. Hold still and try again. | Retake / Use anyway |
| Underexposure | More even light may help show the edges. | Retake / Continue |
| Strong shadow | Try moving away from the direct light. | Show tip / Continue |
| Multiple garments | There may be more than one piece here. | Choose one / Take separate photos |
| Low background contrast | A different background may give a cleaner cutout. | See example / Keep original |
| Failed subject detection | We could not separate this piece from its background. | Keep original / Crop / Retry |
| Possible duplicate | This looks similar to a piece already in your closet. | View existing / Add as separate |

Treat quality detections as imperfect. Never force repeated retakes because a heuristic dislikes an otherwise recognizable photo. The owner may intentionally own two identical items; duplicate detection needs a choice.

## 7. Capture and batch-review interaction

### Capture

Show a camera preview, clear shutter, library import, flash control if supported, Photo tips, and a thumbnail count for the current batch. After a photo, provide brief feedback and allow the next capture immediately. Processing can continue separately.

Request camera permission only when using the camera. A denied permission leaves library import available. Use the system picker for chosen photos. Distinguish downloading a selected cloud-library asset from uploading a wardrobe photo to a processing service.

### Review

Show one tile per imported item with its current stage:

`Queued -> Preparing -> Ready` or `Needs review` or `Could not finish`.

Each tile can reveal original/cutout comparison, suggested name, category, visible colors, and a focused correction. Do not show a form with every possible garment attribute expanded by default.

Primary action: Add ready pieces, with an exact count. Failed items remain in the queue with Retry or Remove. Saving a successful subset must not discard the rest. Double taps and retry must not duplicate records.

Allow editing the proposed name/category, but do not require it for a confident usable result. For uncertain type, offer two or three likely choices where supported and a searchable category picker. Do not guess a material just to populate a field.

Ask coverage or warmth questions at the point of need, such as before recommending a thin top without an underlayer. Capture should not become a full fit questionnaire.

## 8. Processing pipeline

1. Copy the selected source into a managed staging area. Persist the job before expensive work.
2. Validate file type, dimensions, byte limits, and decode success. Handle HEIC and orientation on the chosen native pipeline; keep unsupported files recoverable.
3. Normalize orientation in the working image and strip unnecessary metadata from derivatives and any remote payload. Define original metadata handling explicitly.
4. Make a bounded working-resolution copy for analysis. Retain the original separately.
5. Detect quality issues and possible multiple subjects.
6. Generate a foreground mask. Preserve soft alpha edges and meaningful transparent regions.
7. Compute visible bounds; fit the actual cutout in a consistent display frame without changing aspect ratio.
8. Suggest a short useful name, category/subtype, visible colors, and other genuinely supported attributes.
9. Store attribute provenance and uncertainty. Material composition, opacity, warmth, and fit may remain unknown.
10. Produce thumbnails and a larger transparent image for collages.
11. Present the result for review and persist approved items atomically.
12. Clean temporary files after successful commits, respecting retained originals and job retries.

Evaluate Apple Vision subject lifting as the first iPhone cutout candidate. It provides subject masking primitives, not a guarantee of garment-specific separation. Its processing should run off the UI thread. [Apple subject-lifting overview](https://developer.apple.com/videos/play/wwdc2023/10176/).

Analysis and cutout are separate replaceable capabilities. A better naming model should not force a change to image storage or segmentation. An unavailable local model must not silently cause a cloud upload.

Generative redrawing, virtual try-on, invented folds, aggressive de-wrinkling, and reconstructed missing parts are outside the initial cleanup scope. They can alter what she owns. If explored later, use a separate explicitly accepted visualization and keep the faithful cutout as the closet record.

## 9. File and color handling

- Preserve an original and versioned derivatives; never repeatedly compress the only copy.
- Use an appropriate tagged color-space conversion in the image pipeline and validate the rendered result on the target iPhone. Do not simply strip a wide-gamut profile and assume the pixel values remain correct.
- Keep alpha in cutouts. A JPEG derivative cannot carry transparency.
- Use image formats supported by the actual native decoder and export path; measure quality and size before choosing a single format globally.
- Normalize rotation consistently before computing masks and bounds.
- Use dimensions and bounds from the actual file, not the current square sample assumptions.
- Do not use black or white removal heuristics that erase garment pixels of the same color.
- Render thumbnails rather than loading every original in a scrolling list.
- Store original, working image, mask, cutout, and thumbnail provenance without placing image bytes in normal application logs.

Initial tuning candidates: thumbnails around 256-512 pixels on the long edge, collage derivatives around 1,024-1,536 pixels, and analysis inputs sized to the selected provider. These are proposals to measure on real clothes and the oldest supported phone, not fixed guarantees.

## 10. Reliability

Persist job IDs, source references, attempt counts, processor versions, state, and output references. Start with one expensive image job at a time on the phone; tune concurrency from memory and thermal measurements. Do not process a large batch in parallel by default.

Cancellation must stop or ignore pending work and prevent partial records from appearing. Restart should recover queued work from managed files. Deleting a source or item must invalidate late outputs. A lost cloud connection should leave successful local results and originals intact.

Low disk space, an unreadable file, limited photo access, model download needs, processing failure, and saving failure each require a specific recovery path. Retry only the failed step when safe; use stable job identities to prevent duplicate saves and charges.

## 11. Tutorial assets and production checklist

Create instructional assets only after the capture flow is stable. Use the same neutral garment in paired examples so the viewer learns the intended lesson. Label Poor lighting / Even lighting or Cropped hem / Whole garment, without shaming the photographer.

Required assets:

- Three first-use tutorial examples.
- White garment on white versus contrasting neutral background.
- Full long dress versus a cropped hem.
- Open scarf versus a tightly bundled scarf.
- A Desi set photographed as individual components and linked afterward.
- Original/cutout comparison with embroidery and fine edges intact.

Use owned or licensed material and record origins. Do not repurpose competitor app screenshots as tutorial artwork. Tutorial video is optional; still images and text must communicate the complete lesson.

Acceptance before release:

- A first-time user can follow the tips without another person's explanation.
- A clear single-item photo becomes a named and categorized item without typing.
- A batch with mixed success supports partial save and independent retries.
- A correctable cutout is not a dead end.
- Pale and dark garments, chiffon, lace, fringe, embroidery, sets, shoes, and long hems remain recognizable.
- Colors are compared against the source image and the physical item under reasonable light, with limitations recorded.
- Original retention, permission denial, app restart, duplicate handling, and removal during processing are verified.
- Measure active user effort and correction rate with her actual photos; an attractive sample cutout is not proof of import quality.
