# Outfit scoring for Almari: colour theory, compatibility and architecture

## What the code does today

- `scoreOutfit` in `src/domain/styling.ts` only uses `traits.tone` (light/mid/dark) and `traits.occasions`. Owned pieces have neither, so ranking falls through to the `hash(seed + ids)` tiebreak in `diversify`.
- The import step computes a dominant RGB (`Prepared.color` in `src/domain/closet.ts`), but it is only used by `colorName()` in `importing.ts` to name the piece. `Piece` never stores it, so the outfit generator never sees colour.
- The SigLIP 2 image embedding stays in Swift (`ClosetVisionModule.swift`). Only the `kinds` scores reach JS, and the embedding is not saved.

**First step:** save a colour profile on `Piece`. Store `lab`, `lch`, a small palette and a `pattern` flag, and add a back-fill when a photo is re-prepared. Also save the 768-d embedding (as int8, about 0.8 KB per piece) only if you want the learned path later. Everything below depends on this.

## 1. Colour harmony from dominant colours

### Classify each piece first (CIELAB/LCh, D65)

Convert sRGB to Lab once and store it. Then put each piece in one class:

| Class | Rule (L*, C*, h°) | Notes |
|---|---|---|
| black | L* < 22, C* < 12 | Phone photos lift blacks to L* 15-25 |
| white / ivory | L* > 88, C* < 10 | Ivory and cream are often C* 6-14, h 70-95 |
| grey | 22 ≤ L* ≤ 88, C* < 8 | |
| navy | L* < 35, 240 ≤ h ≤ 290, C* < 40 | Neutral |
| denim | kind is trousers/jacket and 215 ≤ h ≤ 265, 8 ≤ C* ≤ 35 | Neutral. Better: add "denim" as a SigLIP prompt |
| warm neutral (beige, camel, tan, khaki, brown, olive) | C* < 28, 45 ≤ h ≤ 100 | Neutral, warm |
| accent | everything else | |

These cut-offs are practitioner heuristics tuned for photographed fabric. They are not published constants. Photo white balance easily moves a garment 3-6 ΔE00, so keep the bins wide and let the user correct a piece's colour in PieceEditor.

### Pair-level relations (CIEDE2000 and hue angle)

| Relation | Condition |
|---|---|
| same colour | ΔE00 < 5 |
| tonal / monochrome | same hue family (Δh < 20°), ΔL* ≥ 15. Ou & Luo found lightness differences below about 15 L* units *reduce* harmony, so tone-on-tone needs visible lightness steps |
| clash risk | 5 ≤ ΔE00 < 12 with Δh < 25°, a "near miss" (two blacks or two navies that don't quite match). Penalise this, especially top vs bottom |
| analogous | 20° ≤ Δh ≤ 60° with both C* > 15 |
| complementary | 150° ≤ Δh ≤ 210° with both C* > 15. Good when one piece has C* < 35 or ΔL* > 25 (a muted partner), risky when both C* > 50 |
| contrast level | outfit ΔL* range = max L* minus min L*. Low < 25, medium 25-50, high > 50 |

### Outfit-level rules

- **Max 3 colours.** Cluster the accent colours of all pieces (single-link, ΔE00 < 12 joins a cluster), counting palette entries from prints at 0.5 weight. Neutrals don't count.
  - 0-1 accent: safe (+0.3)
  - 2: fine (0)
  - 3: penalty unless one is an echo (see below), -0.3
  - 4 or more: -1
- **60-30-10.** Use role as a proxy for visible area:
  - 60: main / abaya / outer
  - 30: bottom
  - 10: shoes, bag, accessory
  - The hijab is special. It frames the face and in practice covers 10-20% of the visible area.

  Reward when the highest-chroma accent sits in a small-area role or is echoed. Penalise when two large-area pieces are both saturated accents (C* > 45) that are not tonal.
- **Echo bonus.** An accent in the hijab, dupatta, shoes or bag that matches (ΔE00 < 10) a colour in the main piece's palette. This is the most explainable "styled" signal and fits desi dressing, where the dupatta ties the outfit together.
- **Warm/cool.** Warm is h in [20°, 100°], cool is h in [180°, 300°], and everything else, plus neutrals, is neither. Mixing warm and cool accents isn't wrong, so apply only a small penalty (-0.2) when two *large* accents disagree. Never penalise neutrals.
- **White.** It acts as a neutral, but all-white plus light pieces looks washed out. Keep the existing "all light" penalty, defined as L* > 75 on main, bottom and hijab.
- **Prints.** A single dominant RGB can't represent a print. On import, run k-means (k=4) on the cutout pixels and store up to 3 colours covering at least 15% of the area each. Set `pattern` when the second colour covers more than 20% and ΔE00(c1, c2) > 15, or add SigLIP zero-shot prompts ("a solid colour garment", "a floral print garment", "a striped garment", "an embroidered garment"). Then treat a print as its palette: other pieces should be neutral or match one palette colour.

### Literature for a continuous score

Ou & Luo's two-colour model (Color Res. Appl. 2006, 31(3):191-204) is CH = H_C + H_L + H_H. A chromatic-difference term, H_C = 0.04 + 0.53·tanh(0.8 − 0.045·ΔC), falls as hue and chroma differences grow. A lightness term rewards high L*. A hue term marks blue as most often harmonious and red as least.

- It is a good continuous "pair harmony" term for adjacent roles (hijab-main, main-bottom).
- I could only confirm the H_C term from secondary sources. Check the other coefficients against the paper before shipping them.
- Cohen-Or et al. (2006) give hue templates (Matsuda types). "i" is an 18° sector, "V" is 93.6°, "I" and "X" are opposite sectors. Use them as a check on accent hues only.
- O'Donovan et al. (2011) found from large datasets that people prefer similar or analogous hues more than classic complementary theory predicts. That supports giving tonal and analogous a bigger reward than complementary.
- A 2025 psychophysical study in *Fashion and Textiles* reports that modern clothing-colour harmony judgements differ from classical theories. That is another reason to keep the weights adjustable and personalised.
- Zhang et al. (2020) showed that colour alone predicts Polyvore compatibility about as well as earlier deep-feature models. Colour is the highest-value signal you have.

## 2. Pattern and texture

The usual stylist rules translate directly:

- At most one bold print per outfit, unless two prints share a palette colour (ΔE00 < 10) *and* differ in scale.
- The scale needs a new attribute: `small | medium | large` via SigLIP prompts ("small ditsy print", "large bold print").
- Stripes or checks with florals are fine when the colours are shared.
- Heavy embroidery counts as a print. A plain dupatta with an embroidered kameez, or the reverse, is a classic desi rule worth encoding.
- Texture (knit, denim, satin, chiffon, linen) only matters for occasion and formality: satin or chiffon for dinner and celebration, knit or denim for everyday. Get it from zero-shot prompts with your existing embedding. There is no texture-mixing rule worth computing.

## 3. Learned compatibility

| Item | What it is | License |
|---|---|---|
| Polyvore Outfits (Vasileva et al., ECCV 2018) | 68k outfits, 365k items, type-aware splits | HF card says CC BY 4.0 (attribution). The images come from Polyvore-era retailers, so image copyright is unclear. Using it for training is common, redistributing images is not advised |
| Type-aware embeddings code | `mvasil/fashion-compatibility` | BSD-3-Clause |
| Bi-LSTM (Han et al. 2017) | Sequence model, Maryland Polyvore | Code: `xthan/polyvore`, Apache-2.0 |
| OutfitTransformer (Sarkar et al., CVPR 2023) | Set transformer with an outfit token | Reimplementation `owj0421/outfit-transformer`, MIT, uses precomputed CLIP features. AUC 0.93-0.95, FITB 67-69% |
| POG / iFashion (Alibaba, KDD 2019) | 1.01M outfits | No license stated, so treat it as unusable |
| FashionCLIP | CLIP fine-tuned on Farfetch | MIT |
| Marqo-FashionSigLIP | 203M params | Apache-2.0 |
| SigLIP 2 base (your encoder) | | Apache-2.0 (already in `NOTICE.txt`) |

**Feasibility.** It is technically easy. Precompute SigLIP 2 embeddings for Polyvore items and train a small head offline: per-role projections to 128-d plus pairwise cosine, or a 2-layer, 4-head set transformer of about 1-2M params. Export it to Core ML, or as a weight matrix you run in JS. Scoring 4,000 candidates on device is trivial.

**Is it worth it now? No.**

- Polyvore is Western, mostly a "Polyvore aesthetic" from 2014-2016, and has no hijabs, kurtas, shalwar, abayas or dupattas as first-class types. A learned head would push desi outfits toward out-of-distribution scores.
- Polyvore negatives are random item swaps, so the high AUCs partly reflect type and category shortcuts rather than taste.
- You lose explainability. "The model says 0.71" isn't a reason you can show the user.

**Where embeddings are worth using now:**
1. More zero-shot attributes for free: pattern, scale, formality, fabric, denim, embroidery. These become rule inputs.
2. Near-duplicate detection, so two near-identical black trousers aren't both suggested.
3. Later, a personal pair-affinity model on the embeddings, trained on the user's own feedback (see below).

If you try Polyvore later, add its score as a weak feature (weight ≤ 0.15), apply it to Western outfits only, and gate it behind an evaluation on your own test set.

## 4. Personalisation from little feedback

Use a linear model over the same interpretable features the rules produce. Then every learned weight is also an explanation.

- **Features φ(outfit).** Rule hits (tonal, echo, complementary, high contrast, print present, layer present, ...), colour classes per role (for example "hijab is accent", "main is neutral"), and piece and pair indicators for pieces the user has interacted with.
- **Score.** S = Σ_k w_k·φ_k. The prior weights w⁰ come from the rule tables.
- **Updates.** Online logistic regression with a Gaussian prior toward w⁰ (L2 to prior, λ ≈ 1), equivalent to MAP Bayesian logistic regression.
- **Events** (pairwise updates, Bradley-Terry style):
  - "Wore this": +1 against the other shown outfits, the strongest signal.
  - Saved look: +1.
  - "Not my style": -1 against the next alternative.
  - Swapping piece A for B: a pairwise preference B over A in that context.
- **Update rule.** For each preference (a over b), with d = φ(a) − φ(b): w ← w + η·(1 − σ(w·d))·d − η·λ·(w − w⁰), with η = 0.1. It is deterministic, has no dependencies, and 20 events visibly shift rankings.
- **Pair affinity.** Keep a Beta(1 + wornTogether, 1 + rejectedTogether) table for piece pairs. Use the posterior mean minus 0.5 as a feature. A "You often wear these together" reason falls out of it.
- **Exploration.** Show the top 3 deterministically. Fill slots 4-5 from the next 20, ranked by an upper confidence bound (score + c·√(1/(1+n_shown))) instead of the random hash, keeping it deterministic per date seed.
- **Cap.** Clamp |w_k − w⁰_k| so a few clicks can't override hard constraints or turn the stylist knowledge upside down.

## 5. Recommended architecture

Four layers, each returning `{delta, reasons[]}`:

1. **Hard constraints** (existing `evaluateOutfit`): roles, style, hijab, weather. They filter candidates and never score them.
2. **Style knowledge** from JSON rule tables: occasion, formality, kind pairings, desi rules.
3. **Colour harmony**: the pair and outfit functions above, with thresholds read from the same tables.
4. **Personal preference**: the learned weight deltas and pair affinity.

Final score: `S = Σ layer deltas`, then a tiebreak by `hash(seed + ids)`. Explanations are the top 2 positive reasons by |delta|, as today. Keep each layer a pure function so it is testable with `tsx --test`.

```ts
type ColorClass = "black" | "white" | "grey" | "navy" | "denim" | "warm-neutral" | "accent";
type PieceColor = { lab: [number, number, number]; lch: [number, number, number]; class: ColorClass;
  palette: { lab: [number, number, number]; share: number }[]; pattern?: "solid" | "print" | "stripe" | "check" | "embroidered";
  scale?: "small" | "medium" | "large" };

type Selector = { role?: Role; kind?: GarmentKind; category?: Category; colorClass?: ColorClass;
  pattern?: PieceColor["pattern"]; style?: Style; occasion?: Occasion };

type Condition =
  | { all: Condition[] } | { any: Condition[] } | { not: Condition }
  | { has: Selector; count?: { min?: number; max?: number } }
  | { pair: [Selector, Selector]; relation: "same" | "tonal" | "analogous" | "complementary" | "near-miss" | "echo" | "contrast-high" | "contrast-low" }
  | { outfit: "accent-count" | "contrast-range" | "print-count"; op: "<" | "<=" | ">" | ">=" ; value: number };

type Rule = {
  id: string;
  source: string;
  layer: "style" | "color";
  when?: { occasion?: Occasion[]; style?: Style[]; weather?: ("warm" | "mild" | "cold")[] };
  if: Condition;
  weight: number;
  reason?: string;
  tags?: string[];
};

type Thresholds = { neutralChroma: number; sameDE: number; nearMissDE: [number, number];
  tonalHue: number; tonalMinDL: number; analogousHue: [number, number]; complementHue: [number, number] };

type RuleBook = { version: number; thresholds: Thresholds; rules: Rule[] };
```

Example rules:

```json
{ "id": "desi-dupatta-echo", "source": "stylist-desi", "layer": "style", "when": { "style": ["desi"] },
  "if": { "pair": [{ "kind": "dupatta" }, { "role": "main" }], "relation": "echo" },
  "weight": 1.0, "reason": "The {a} picks up a colour from the {b}." }
{ "id": "one-bold-print", "source": "colour-theory", "layer": "color",
  "if": { "outfit": "print-count", "op": ">", "value": 1 }, "weight": -0.8 }
{ "id": "top-bottom-near-miss", "source": "colour-theory", "layer": "color",
  "if": { "pair": [{ "role": "main" }, { "role": "bottom" }], "relation": "near-miss" },
  "weight": -1.0, "reason": "These two shades are close but not matching." }
```

**Design notes:**
- Keep the reason templates (`{a}`, `{b}`) in the rule so stylist research can be pasted in as data.
- `source` lets you A/B test whole rule packs or turn them off.
- Rule `id`s double as feature names for the personal weight vector.
- Ship the RuleBook as a bundled JSON. Version it, and validate it with a small parser like the existing `closet.ts` validators.

## 6. Evaluation

**Test set.** About 60-100 outfits built from the real closet plus the samples. Rate each on a 3-point scale (no / ok / would wear), split across occasions and Western/desi. Include about 15 deliberately bad ones (near-miss blacks, two loud prints, clashing saturated pairs). Store it as a fixture JSON.

**Metrics.**
- Pairwise accuracy: the share of (better, worse) pairs ordered correctly. The main number.
- NDCG@5 per request.
- "Bad in top 3" rate: should be 0.
- Precision@3 of "would wear".
- Run them for each layer combination (hard only, plus style, plus colour, plus personal) to show what each layer adds.

**Regression tests** (in `styling.test.ts`):
- Unit tests for the colour classifier with known RGBs: black jeans, navy, camel, ivory, denim.
- Unit tests for each pair relation at threshold boundaries.
- Golden tests: for fixed closet, request and seed, the top-3 ids and their reasons don't change unless the RuleBook version changes.
- Property tests: never a hard-constraint violation, scores deterministic for the same seed.
- After 10 simulated "wore this" events on tonal outfits, the tonal rule weight rises and stays within its clamp.

**Personalisation check.** Replay the user's real feedback history in time order and measure pairwise accuracy on each next event before updating on it (prequential evaluation).

## Learned vs rules

| | Rules + colour + linear personal | Learned head (Polyvore) |
|---|---|---|
| Explainable | Yes, every delta has a reason | No |
| Modest/desi coverage | Yes, by writing rules | Poor, out of distribution |
| Data needed | None, then a few events | 68k outfits, offline training |
| On-device cost | Microseconds | Small, needs the embedding saved |
| Deterministic | Yes | Yes once exported |
| Ceiling | Limited by rule quality | Better on generic Western taste |
| License risk | None | Polyvore images have unclear copyright |

**Recommendation:** rules plus colour plus linear personalisation now. A personal embedding-based pair model only after there are a few hundred feedback events. Polyvore only as an optional, weak, Western-only feature. An online LLM later only to propose new rule entries or reword reasons, never in the scoring loop.

## Sources
- Ou & Luo 2006, A colour harmony model for two-colour combinations: https://ir.lib.nycu.edu.tw/handle/11536/29880?mode=full and model summary in USPTO 9134179: https://image-ppubs.uspto.gov/dirsearch-public/print/downloadPdf/9134179
- Colour harmony models on apparel images: https://www.scientific.net/AMR.627.524
- Modern clothing colour harmony perception (2025): https://fashionandtextiles.springeropen.com/articles/10.1186/s40691-025-00433-y
- Zhang et al. 2020, Learning Color Compatibility in Fashion Outfits: https://arxiv.org/abs/2007.02388
- Cohen-Or et al. 2006, Color Harmonization: https://igl.ethz.ch/projects/color-harmonization/
- O'Donovan, Agarwala, Hertzmann 2011, Color Compatibility from Large Datasets: https://www.dgp.toronto.edu/~donovan/color/
- Vasileva et al. 2018, Type-aware embeddings: https://arxiv.org/abs/1803.09196, code: https://github.com/mvasil/fashion-compatibility, data (CC BY 4.0): https://huggingface.co/datasets/mvasil/polyvore-outfits
- Han et al. 2017, Bi-LSTM: https://arxiv.org/abs/1707.05691, code: https://github.com/xthan/polyvore
- Sarkar et al. 2023, OutfitTransformer: https://arxiv.org/abs/2204.04812, MIT reimplementation: https://github.com/owj0421/outfit-transformer
- POG / iFashion: https://arxiv.org/abs/1905.01866
- FashionCLIP (MIT): https://huggingface.co/patrickjohncyh/fashion-clip
- Marqo-FashionSigLIP (Apache-2.0): https://www.marqo.ai/blog/search-model-for-fashion
- SigLIP 2 base (Apache-2.0): https://huggingface.co/google/siglip2-base-patch16-224
- Outfit dataset overview: https://outfit-datasets.readthedocs.io/en/latest/polyvore_outfits.html
