# Labels, capture and styling: design

Agreed 1 October 2026. This extends [Delivery](DELIVERY.md) packets D2 and D3 and replaces their wording where the two differ. Background research is in [Styling knowledge](../research/STYLING-KNOWLEDGE.md).

Each part below gets its own implementation plan and is built in the order listed. Exact product identification is parked. One TestFlight build goes to her phone when all parts are done.

## Intent

She should be able to photograph her clothes and get pieces that are named, sorted and described correctly without typing. Today should then suggest outfits that follow real modest and Desi styling knowledge, fit her own taste, and explain why. Everything runs on the phone.

Success means:

- A clear photo becomes a piece with the right category, subcategory and style, and at most one quick question.
- With her own clothes, the first three suggestions are visibly better than a shuffle and come with true reasons.
- Her feedback changes later suggestions.
- The rules-based stylist and the trained model can be compared on her own ratings.

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

Existing owned pieces get the new attributes the next time the app prepares them. A one-time background pass re-prepares owned pieces from their stored originals.

## Part 3: Care label

- After each piece in Check this piece: Add care label, or Skip. It is also available later from the piece.
- The label photo is stored with the piece and never shown in the closet.
- Apple Vision text recognition reads the text on the phone.
- Cactus Needle 3 (`needle3.cact`, Apache 2.0, iOS engine) turns the text into `{ materials: [{ fibre, percent }], size, brand, origin }` with a fixed schema. Telemetry is turned off before the engine starts, and network traffic is checked on hardware.
- Below Needle's confidence threshold, or when it finds nothing, fields stay empty and editable. Nothing is invented.
- Materials set the piece's fabric attribute with source `label`.
- Washing and care symbols are not stored.

Checks: a fixture set of about 15 label texts in English, Norwegian and Urdu-English mixes with expected fields; Needle extraction accuracy recorded; parsing and mapping tests in the domain layer with Needle behind an adapter so tests run without it.

## Part 4: Photo enhancement and the rest of D2

### Enhancement

After the cutout, Core Image applies faithful fixes: white balance from neutral areas, exposure and shadow lift, light sharpening, centring and straightening, and a soft shadow for the closet canvas. Hue is not shifted beyond correcting the light. Check this piece shows Enhanced and Plain, Enhanced is the default, and she can switch at any time. Generative enhancement online is parked.

### Remaining D2 items

- Photo tips illustrated with simple drawings in the app's colours.
- Quality advice for blur, cut-off hems, dark or mixed light and merged background (P05). Advice is shown once with Retake or Use anyway; it never blocks.
- Retake as one action in Check this piece.
- Duplicate warning when the new embedding is very close to an existing piece: Same piece or Different piece.
- Desi sets: select pieces and choose These belong together. Pieces store a `setId`. Formal sets stay together in styling; casual sets may mix (Desi rules 11 and 12).
- Permission and failure states for denied camera, limited library, missing iCloud original, low storage and processing failure (P06), each keeping her work and offering a next step.

## Part 5: The stylist

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

A Style settings screen holds the topics where people and families disagree. All are neutral by default, and there is no onboarding:

- Belt over abaya, dress or long cardigan
- Minimum top length
- Trousers, skirts or both
- Print on print
- Avoid white or black at weddings
- Dupatta expected at family events
- Regional leaning

These change rules on or off or adjust weights. They never change coverage rules.

### Feedback

- Chips after a suggestion: Too formal, Too plain, Too warm, Not my style. They change the next suggestion for this request and update her taste weights.
- Wore this on Today, easy to undo. Less-worn suitable pieces get a gentle boost (R06), without inventing wear dates or penalising favourites.
- Saving a look and swapping a piece count as feedback.

## Part 6: Trained model and A/B comparison

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

## Part 7: The rest of D3

- **Coverage:** sleeve and length proposals are confirmed before they count. Unknown essential coverage is never shown as ready (R02). A sheer or open outer layer never certifies what is beneath it (R07).
- **Hijab comparison:** a sheet with the current hijab and three alternatives, each previewed in the whole outfit, with one short reason, Use this hijab, and undo. Every other piece stays (R03).
- **Saved looks on Today:** exact saved looks that fit the request appear separately from variants. Missing pieces are shown with a repair (R04).
- **Availability:** Unavailable for a while (in the wash, lent out) and Archive, both separate from delete and reversible.
- **Weather for her own clothes:** warmth, rain and snow on each piece, proposed from fabric and subcategory and confirmed by her.

## Data changes

`Closet` moves to version 3 with a migration from version 2. The `closet.v2` snapshot is kept and never overwritten. New and changed fields:

- `Piece`: `attributes` (each value with its source), `colors`, `embedding`, `setId`, `label` (care label fields and photo), `enhanced` and `plain` image paths, `availability`, `archived`
- `Occasion`: the seven occasions above, with `celebration` migrated
- `Closet.styling`: `profile` (style settings), `taste` (weights and pair counts), `engine` (rules, model or compare)
- `Closet.feedback`: events with time, request, outfit ids, engine and kind

## Verification

- `npm run check` passes with new domain tests for each part: taxonomy and style, attribute sources, migration from v2, care label mapping, colour classes and pair relations at their thresholds, RuleBook validation, fixed top three for a fixed closet and seed, taste weights staying within their limit after repeated feedback, set rules, availability, and engine recording.
- Classifier and Needle evaluations re-run and recorded with numbers.
- A rated outfit set of 60 to 100 outfits, including about 15 deliberately bad ones. Rules and Model are both scored on it. Main numbers: pairwise ordering accuracy, and no bad outfit in the top three.
- Screens checked on the simulator with Maestro, including larger text, and saved to `planning/build`. Status updated after each part.
- Cutouts, Needle speed and memory, and enhancement are confirmed on her iPhone with the final TestFlight build, since the simulator cannot run Vision background removal.

## Out of scope

- Exact product identification
- Washing instructions and care symbols
- Generative photo enhancement and any upload of her photos
- A language model in the scoring loop
- Automatic weather and natural-language requests (D4 and D5)
