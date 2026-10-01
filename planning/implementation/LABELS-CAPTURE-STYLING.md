# Labels, capture and styling: design

Agreed 1 October 2026, amended the same day after testing a competing modest styling app (see Lessons from ALIFF). This extends [Delivery](DELIVERY.md) packets D2 and D3 and replaces their wording where the two differ. Background research is in [Styling knowledge](../research/STYLING-KNOWLEDGE.md).

Each part below gets its own implementation plan and is built in the order listed. Part 5 pulls automatic weather forward from D4. Exact product identification is parked. One TestFlight build goes to her phone when all parts are done.

## Intent

She should be able to photograph her clothes and get pieces that are named, sorted and described correctly without typing. Today should then suggest outfits that follow real modest and Desi styling knowledge, fit her own taste, and explain why. Everything runs on the phone. The only network call is the weather forecast, which sends the city's coordinates and nothing else.

Success means:

- A clear photo becomes a piece with the right category, subcategory and style, and at most one quick question.
- With her own clothes, the first three suggestions are visibly better than a shuffle and come with true reasons.
- Her feedback changes later suggestions.
- The rules-based stylist and the trained model can be compared on her own ratings.
- One photo of her wearing an outfit becomes several separate pieces.

## Lessons from ALIFF

ALIFF is a modest styling app tested on 1 October 2026. What we take from it:

- Capture from a photo of her wearing the outfit, with several pieces found in one photo and clean product-style results.
- Closet chips by garment type, an item page with fact chips, Mark as unavailable and Used in N outfits.
- A short onboarding with coverage, hijab, body and taste questions.
- An outfit view with a flat lay, the main garment large and accessories in a column, an outfit name and a reason.

What we do differently, because ALIFF got it wrong:

- Generated product shots invented garments: a dark green hijab became a skirt under Bottoms. We keep her real garment and only correct the photo.
- It took a man's shirt from a group photo. We only use the main person.
- Guesses such as fabric and odd colour names were shown as facts. Ours stay marked as guesses until she confirms.
- It placed a hijab she does not own in the outfit. Ours never does; a missing piece is a tip below the outfit.
- Fahrenheit and feet for a user in Oslo, two different coverage vocabularies, and cut-off button text. We default to metric for Norway, use one vocabulary and test larger text.
- One category list mixed garment type, occasion and style. Ours keeps type as chips and the rest as filters.
- Login, usage limits and photos sent to outside AI services. We have none of these.

## Language

The app follows the phone's language: Norwegian bokmål when the phone is set to Norwegian, otherwise English. Never nynorsk. From Part 1 every new or changed screen text goes through one string catalog with both languages. Screens that already exist are moved into the catalog in Part 8. Taxonomy names such as kurta, dupatta and abaya stay the same in both languages.

## Part 1: Labels

### Taxonomy

Every piece has a category, a subcategory and a style.

| Category | Subcategories |
| --- | --- |
| Hijabs & scarves | Hijab, Instant hijab, Underscarf, Shawl |
| Tops | Blouse, Shirt, T-shirt, Sweater, Top |
| Kurtas & tunics | Kurta, Kurti, Kameez, Tunic |
| Trousers & skirts | Trousers, Jeans, Wide-leg, Shalwar, Churidar, Sharara, Gharara, Lehenga, Skirt |
| Dresses & abayas | Dress, Anarkali, Abaya, Kaftan |
| Layers | Blazer, Cardigan, Jacket, Coat, Waistcoat |
| Shoes | Sneakers, Flats, Loafers, Heels, Sandals, Khussa, Boots |
| Bags | Handbag, Tote, Crossbody, Clutch, Backpack |
| Accessories | Dupatta, Jewellery, Belt |

The existing `garmentKinds` list grows into this list. The 18 current ids stay valid with the same meaning, so stored pieces, saved looks and import jobs need no rewrite. The piece field stays `kind`; screens call it Subcategory. Subcategory becomes required for owned pieces in the editor.

Style is `desi`, `western` or both. Subcategories that decide style on their own carry a fixed style in the taxonomy table:

- Desi: kurta, kurti, kameez, shalwar, churidar, sharara, gharara, lehenga, anarkali, khussa, dupatta
- Both: all hijabs and scarves, coat, cardigan, all bags, jewellery, belt, sneakers, flats, heels, boots
- Decided from the photo: everything else

### Recognition

`labels.py` gets descriptions for every subcategory and for style. `convert.py` regenerates `garment-labels.json` grouped by subcategory, plus a style group. No new model.

1. Category: add up subcategory scores per category and take the best.
2. Subcategory: the best subcategory inside that category.
3. Style: fixed style when the subcategory has one. Otherwise compare the "South Asian embroidered garment" descriptions with the "Western garment" descriptions.

A close call becomes one quick check question for the piece, with the most useful question first: category, then subcategory, then style. The existing margin rule (under 0.01) stays as the starting threshold and is retuned in the evaluation.

Corrections she makes are stored as confirmed and are never replaced by later recognition (R01).

### Closet browsing

The closet shows one chip per category, with Hijabs & scarves first, plus All. A second row filters by style (Desi, Western), occasion and available or unavailable. Occasion and style are never categories.

### Checks

- Re-run the 48-photo evaluation, extended with about 20 photos covering the new subcategories and both styles.
- Category at least 47 of 48 as today. Subcategory and style accuracy measured and written into the model README.
- Domain tests for the category from subcategory scores, the fixed-style table, and that a confirmed value survives re-preparation.

## Part 2: Piece attributes

The classifier also proposes the attributes the stylist needs. Each is a separate group of descriptions on the same image embedding.

| Attribute | Values |
| --- | --- |
| Length | Hip, thigh, knee, calf, ankle (tops, tunics, dresses, layers) |
| Sleeve | Sleeveless, short, elbow, long |
| Volume | Fitted, straight, voluminous |
| Pattern | Solid, print, stripe, check, embroidered; scale small, medium, large |
| Fabric | Lawn, cotton, linen, jersey, modal, chiffon, silk, satin, velvet, wool, knit, denim, khaddar, karandi, organza, net |
| Embellishment | None, light, heavy |
| Formality | 1 to 6, derived from subcategory, fabric and embellishment |

Colour is measured, not guessed. At import the native module returns up to three palette colours with their share of the garment, using k-means on the cutout pixels. The piece stores Lab values and a colour class (black, white, grey, navy, denim, warm neutral, accent) using the thresholds in the colour report.

Every attribute has a source: `proposed`, `label` (from the care label) or `confirmed`. A quick check is asked only when a proposal is uncertain and the stylist needs it, never as a routine form. See-through and open front are never guessed; they are asked when a coverage decision depends on them.

The import step also stores the 768-value SigLIP embedding as 8-bit numbers (about 0.8 KB per piece) for duplicate detection and the trained model.

### Item page

- Fact chips show colour name, subcategory, fabric, pattern, sheer, fit, length, sleeve, formality and season. A proposed value has a dashed outline and a question mark; tapping it confirms or changes it. Confirmed and label values are plain chips. Unknown values have no chip.
- Mark as unavailable (in the wash, lent out, needs repair) removes the piece from suggestions until she turns it back. Reversible, separate from delete.
- Used in shows how many saved looks contain the piece. The wear count is added in Part 6, when Wore this exists.

Existing owned pieces get the new attributes the next time the app prepares them. A one-time background pass re-prepares owned pieces from their stored originals.

## Part 3: Care label

- After each piece in Check this piece: Add care label, or Skip. It is also available later from the piece.
- The label photo is stored with the piece and never shown in the closet.
- Apple Vision text recognition reads the text on the phone.
- A rules parser reads the text first: percentages with fibre names in English and Norwegian (for example "100% bomull", "65% polyester 35% viskose"), size codes, and "Made in" or "Laget i".
- Apple Foundation Models, the on-device language model in iOS 26, then fills anything the parser left empty, using guided generation into a fixed Swift struct `{ materials: [{ fibre, percent }], size, brand, origin }`. The parser's values always win over the model's.
- Needle is dropped: the phone does not have the memory for it.
- When Apple Intelligence is off, unsupported for the device language, or still downloading, only the parser runs. The screen does not mention this.
- When neither finds a field, it stays empty and editable. Nothing is invented. A model value is only kept when the same word appears in the label text.
- Materials set the piece's fabric attribute with source `label`.
- Washing and care symbols are not stored.

Checks: a fixture set of about 15 label texts in English, Norwegian and Urdu-English mixes with expected fields; parser and model accuracy recorded separately; parsing and mapping tests in the domain layer with the model behind an adapter so tests run without it.

## Part 4: Capture and the rest of D2

### Several pieces from one photo

- A clothes parsing model runs on the phone: SegFormer B2 trained on clothes parsing (classes hat, hair, sunglasses, upper clothes, skirt, pants, dress, belt, shoes, bag, scarf, face, arms and legs), converted to Core ML at 8 bits, about 30 MB.
- It works on photos of her wearing the clothes and on flat lays on the floor or bed. Floor, feet and furniture are dropped.
- Only the largest person in the photo is used, so other people's clothes are never added.
- Each garment region becomes a proposal with its own cutout. Left and right shoes merge into one pair. Regions smaller than a set share of the photo are dropped. Hat and scarf regions on the head become hijab proposals, checked by the SigLIP subcategory scores.
- Each proposal then goes through the normal recognition from Part 1 and Part 2.
- She sees all proposals from one photo with Keep and Drop on each, and can adjust a crop by hand. Add a piece lets her draw a box for anything that was missed.
- A garment that is partly hidden (a top under an abaya) is marked Partly visible and gets a quick check before its length or sleeve counts.
- Single-garment photos still use the existing Vision cutout when the parser finds only one garment.

Checks: real test photos are kept only on the Mac and never committed. They include her floor flat lays and photos of her wearing outfits. Garment count and category per photo are recorded in the model README.

### Enhancement

After the cutout, Core Image applies faithful fixes: white balance from neutral areas, exposure and shadow lift, light sharpening, centring and straightening, and a soft shadow for the closet canvas. Hue is not shifted beyond correcting the light. Check this piece shows Enhanced and Plain, Enhanced is the default, and she can switch at any time. Enhanced images are stored as separate variants, so a generative product shot can later be added as a third variant, opt-in per piece, with the real photo always kept. Generative enhancement online is parked.

### Remaining D2 items

- Photo tips illustrated with simple drawings in the app's colours.
- Quality advice for blur, cut-off hems, dark or mixed light and merged background (P05). Advice is shown once with Retake or Use anyway; it never blocks.
- Retake as one action in Check this piece.
- Duplicate warning when the new embedding is very close to an existing piece: Same piece or Different piece.
- Desi sets: select pieces and choose These belong together. Pieces store a `setId`. Formal sets stay together in styling; casual sets may mix (Desi rules 11 and 12).
- Permission and failure states for denied camera, limited library, missing iCloud original, low storage and processing failure (P06), each keeping her work and offering a next step.

## Part 5: Onboarding, colour analysis and weather

### Onboarding

Shown once on first start, about six screens, every screen has Skip, and every answer can be changed later in Style settings. The sample closet works without any answers.

1. Hijab: always, sometimes, or not. Coverage: full (arms, legs and neck), moderate, or her own line. One vocabulary used everywhere in the app.
2. Units and city: metric and Celsius by default, with imperial as an option. City for the weather.
3. Body: height in centimetres, body shape (pear, apple, hourglass, rectangle, inverted triangle, athletic, prefer not to say). Used for proportion rules only.
4. Taste: fit (loose, structured, depends), colours (bold, soft and neutral, depends), and Desi, Western or both.
5. Colour analysis (below), or pick skin tone from labelled swatches.
6. Done, then the photo tips.

Answers fill `StyleProfile` with source `confirmed`. Skipped answers stay null and mean neutral.

### Colour analysis

- She takes a selfie with the front camera in daylight, without makeup if she likes.
- The clothes parser from Part 4 finds hair and face; Vision face landmarks find cheeks and eyes. Skin, hair and eye colours are sampled in Lab after white balance from the sclera and a neutral area.
- From these the app derives undertone (warm, cool, neutral), depth (light, medium, deep), contrast between hair, skin and eyes (low, medium, high), and one of 12 seasons.
- She sees the measured colours and the result, and can confirm or adjust each. Bad or mixed light asks for a retake instead of guessing.
- The selfie is deleted right after; only the measured values are stored.
- The colour layer in the stylist adds a bonus for colours near her best colours next to the face (hijab, top, dupatta) and a small penalty for colours that clash with her undertone there. It never removes an outfit.

### Weather

- Apple WeatherKit gives the forecast for her city. The city becomes coordinates with the Apple geocoder; no location permission is asked.
- Today uses the forecast for the day's daytime hours: temperature, rain or snow, and wind. It maps to the existing warm, mild, cold and dry, rain, snow values.
- She can still change the weather by hand on Today, and a manual choice wins for that day.
- When there is no network or WeatherKit fails, Today falls back to manual weather and says so. The forecast is labelled with the WeatherKit attribution Apple requires.
- Only the coordinates are sent. No photos, pieces or feedback.

## Part 6: The stylist

### Occasions

The four occasions become seven, each with a formality level:

| Occasion | Formality |
| --- | --- |
| Everyday | 1 |
| Work | 2 |
| Dinner or dawat | 3 |
| Eid | 4 |
| Party or mehndi | 4 |
| Wedding guest, nikah or walima | 5 |
| Barat or formal wedding | 6 |

Stored `celebration` values migrate to Party or mehndi. Sample metadata is updated to the new list.

### Scoring

All outfits first pass the existing hard constraints: roles, kept pieces, style, hijab preference, coverage and weather. The remaining candidates are ranked by a `Scorer`:

```ts
type Scorer = {
  id: "rules" | "model";
  score(outfit: Piece[], request: OutfitRequest, profile: StyleProfile): {
    score: number;
    reasons: string[];
  };
};
```

The rules scorer adds three layers:

1. **Style rules** from a bundled, versioned `RuleBook` JSON. It starts with the rules marked strong or medium in the research reports: hijab pairing, proportion, formality distance, shoes and bags, Desi length pairing, sets, dupatta with hijab, "dressed up enough" from formality 3, fusion and winter rules. Each rule has an id, source, condition, weight and reason text.
2. **Colour harmony** from stored colours: accent count, echo bonus, near-miss penalty, tonal lightness steps, one bold print, warm and cool mix on large pieces, the all-light penalty.
3. **Her taste**: a weight per rule id that starts at the rule weight and moves with her feedback within a fixed limit, plus a bonus for pairs she has worn together.

Reasons shown are the two strongest positive ones, as today. The date-seeded tie-break stays.

### Style settings

A Style settings screen holds the onboarding answers and the topics where people and families disagree. All are neutral by default:

- Belt over abaya, dress or long cardigan
- Minimum top length
- Trousers, skirts or both
- Print on print
- Avoid white or black at weddings
- Dupatta expected at family events
- Regional leaning

These change rules on or off or adjust weights. They never change coverage rules.

### Outfit view

- Today and the outfit view become one screen: the flat lay with the main garment large and accessories in a column, an outfit name, the reasons, and Change, Not for me and Wear this.
- Style this piece on the item page opens the same view with that piece kept.
- Saved looks and outfits she accepted are one list, Looks, each with its name and occasion.
- Two or three card layouts (for example minimal, with reasons, with reasons and coverage checks) are switchable in Style settings, like the engine. She picks one and the others are removed later.
- Outfit names are short and made from the pieces and occasion, for example "Green Eid kurta". No made-up poetic names.
- A piece she does not own never appears in the outfit. When a missing piece would clearly help, one tip line below the outfit says so, for example "A cream hijab would finish this."

### Feedback

- Chips after a suggestion: Too formal, Too plain, Too warm, Not my style. They change the next suggestion for this request and update her taste weights.
- Wore this on Today, easy to undo. Less-worn suitable pieces get a gentle boost (R06), without inventing wear dates or penalising favourites.
- Saving a look and swapping a piece count as feedback.

## Part 7: Trained model and A/B comparison

### Model

- Offline training on the Polyvore Outfits dataset using SigLIP 2 embeddings of the items, with a small compatibility head (type-aware pairwise or a two-layer set transformer, about 1 to 2 million parameters).
- Exported to Core ML or a weight file evaluated in TypeScript, scoring outfits from the stored piece embeddings.
- The model scorer uses the same hard constraints and the same reason rules for explanations, but ranks only by the model score.
- Training scripts and a README with dataset licence notes live next to the classifier in `modules/closet-vision/model`.

Polyvore metadata is CC BY 4.0, but the item images come from retailers and their rights are unclear. That is acceptable for personal use. Before a public App Store release, the licence position is reviewed again and the model is removed if it cannot be cleared.

The model has never seen hijabs, kurtas or dupattas, so Desi outfits are out of its training data. The comparison records style so this shows up in the results.

### Switching and comparison

- A Stylist setting: Rules, Model or Compare.
- Compare alternates the engine for each new suggestion with a fixed pattern per day, labels nothing on screen, and stores which engine produced each suggestion.
- Every feedback event records the engine.
- A small results screen under Style settings shows, per engine, would-wear rate in the first three, Not my style rate and Wore this count, split by Desi and Western.

## Part 8: The rest of D3

- **Coverage:** sleeve and length proposals are confirmed before they count. Unknown essential coverage is never shown as ready (R02). A sheer or open outer layer never certifies what is beneath it (R07).
- **Hijab comparison:** a sheet with the current hijab and three alternatives, each previewed in the whole outfit, with one short reason, Use this hijab, and undo. Every other piece stays (R03).
- **Saved looks on Today:** exact saved looks that fit the request appear separately from variants. Missing pieces are shown with a repair (R04).
- **Archive:** separate from delete and from Unavailable (Part 2), and reversible.
- **Weather for her own clothes:** warmth, rain and snow on each piece, proposed from fabric and subcategory and confirmed by her.

## Data changes

`Closet` moves to version 3 with a migration from version 2. The `closet.v2` snapshot is kept and never overwritten. New and changed fields:

- `Piece`: `attributes` (each value with its source), `colors`, `embedding`, `setId`, `label` (care label fields and photo), `enhanced` and `plain` image paths, `availability`, `archived`
- `Occasion`: the seven occasions above, with `celebration` migrated
- `Piece`: proposals from one photo share a `captureId`
- `Closet.styling`: `profile` (style settings and onboarding answers, including height, body shape and colour analysis), `units`, `city` with coordinates, `layout` (outfit card layout), `onboarded`, `taste` (weights and pair counts), `engine` (rules, model or compare)
- `Closet.feedback`: events with time, request, outfit ids, engine and kind

## Verification

- `npm run check` passes with new domain tests for each part: taxonomy and style, attribute sources, migration from v2, care label mapping, colour classes and pair relations at their thresholds, RuleBook validation, fixed top three for a fixed closet and seed, taste weights staying within their limit after repeated feedback, set rules, availability, and engine recording.
- Classifier, clothes parser and care label evaluations re-run and recorded with numbers.
- A rated outfit set of 60 to 100 outfits, including about 15 deliberately bad ones. Rules and Model are both scored on it. Main numbers: pairwise ordering accuracy, and no bad outfit in the top three.
- Screens checked on the simulator with Maestro, including larger text, and saved to `planning/build`. Status updated after each part.
- Cutouts, clothes parsing, colour analysis, care label model speed and memory, WeatherKit, and enhancement are confirmed on her iPhone with the final TestFlight build, since the simulator cannot run Vision background removal.

## Out of scope

- Exact product identification
- Washing instructions and care symbols
- Generative photo enhancement, generated try-on ("On You") and any upload of her photos. Both are parked for later.
- A language model in the scoring loop
- Chat and natural-language requests
- Brand per piece, beyond what the care label gives
- Login, accounts and usage limits
