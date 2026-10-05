# Styling knowledge

Researched 1 October 2026. This is the summary. The full rule candidates and sources are in three reports:

| Report | Covers |
| --- | --- |
| [Modest Western and hijab](styling/WESTERN-HIJAB.md) | 61 rules: hijab pairing and fabric, proportion, layering for coverage, occasion formality, shoes and bags, outfit formulas, clashes, weather |
| [Desi](styling/DESI.md) | 59 rules and a six-level formality ladder: tops and bottoms by length, three-piece sets, dupatta with hijab, events from everyday to barat, fusion, colour conventions, winter |
| [Colour and scoring](styling/COLOUR-AND-SCORING.md) | Colour classes and harmony thresholds in LCh and CIEDE2000, prints, learned compatibility models and licences, personalisation, rule data schema, evaluation |

Most styling sources are brand blogs and stylist practice, not research. Treat every rule as a default that her feedback can override, never as a fact about what is correct or modest.

## Why the app needs this

Today's scorer only knows occasion tags and a light, mid or dark tone, and only the sample pieces have them. With her own clothes every valid outfit scores about the same, so the order is a date-based shuffle. The colour found at import names the piece and is then thrown away.

## Recommended approach

Score in four layers. Each layer is a pure function that returns a score change and short reasons.

1. **Hard constraints** (exists): one main piece, a bottom when needed, kept pieces, style, hijab preference, coverage, weather. These remove outfits and never trade off against style.
2. **Style rules as data**: a versioned `RuleBook` JSON bundled with the app, holding the Western, hijab and Desi rules. Each rule has an id, source, condition, weight and reason text.
3. **Colour harmony**: computed from each piece's stored colours. Neutrals versus accents, at most three accent colours, echo bonus when the hijab, dupatta, shoes or bag repeats a colour from the main piece, near-miss penalty for two almost matching darks, tonal looks need visible lightness steps, one bold print at a time.
4. **Personal preference**: a small linear model over the same rule ids, starting from the rule weights. Wore this, saved looks, piece swaps and Not my style shift the weights within a fixed limit. Pairs she often wears together get a bonus and a reason.

The top suggestion explains itself with the two strongest reasons, as today.

Not recommended now:

- A model trained on Polyvore outfits. The data is Western, has no hijabs, kurtas or dupattas, has unclear image rights, and gives scores that cannot be explained.
- A language model inside the scoring loop. It may later help write new rules or reword reasons.

## What each piece needs to know

| Attribute | Values | Where it comes from |
| --- | --- | --- |
| Colour profile | Lab colour, up to three palette colours with share, colour class | Computed at import from the cutout |
| Pattern | Solid, print, stripe, check, embroidered; scale small, medium, large | Classifier proposal |
| Length | Hip, thigh, knee, calf, ankle | Classifier proposal, she confirms. Desi pairing depends on length more than on the garment name |
| Volume | Fitted, straight, voluminous | Classifier proposal |
| Fabric | Lawn, cotton, linen, jersey, modal, chiffon, silk, satin, velvet, wool, knit, denim, khaddar, karandi, organza, net | Care label material when scanned, otherwise classifier proposal |
| Embellishment | None, light, heavy | Classifier proposal |
| Formality | 1 to 6, from everyday to barat | Derived from subcategory, fabric and embellishment; she can change it |
| Set | Link to other pieces of a three-piece | She links them at import |

Sleeve length and see-through belong to the D3 coverage work and use the same proposal and confirm flow.

## Occasions

The current four occasions (everyday, work, dinner, celebration) are too coarse for Desi events. The ladder from the Desi report maps onto formality levels:

| Level | Western | Desi |
| --- | --- | --- |
| 1 | Everyday | Everyday, lawn |
| 2 | Work | Work |
| 3 | Dinner | Dawat, Eid visiting |
| 4 | Party | Mehndi, dholki |
| 5 | Wedding guest | Nikah, walima |
| 6 | Formal wedding | Barat |

A "dressed up enough" check applies from level 3: at least one formal fabric, visible embellishment or formal silhouette.

## Her settings, not rules

The research found real disagreement on these, by person, family or region. They become optional settings with no default judgment:

- Belt over abaya, dress or long cardigan
- Minimum tunic or top length
- Trousers, skirts or both
- Print on print
- White or black at weddings
- Whether a dupatta is expected at family events
- Regional style leaning (for example Gulf abaya-centred, Turkish, UK, South Asian)

## How to check it works

- A rated test set of 60 to 100 outfits from her real closet and the samples, each rated no, ok or would wear, across occasions and both styles, including about 15 deliberately bad outfits.
- Main numbers: pairwise ordering accuracy, and no bad outfit in the top three.
- Unit tests for colour classes and pair relations at the thresholds, fixed top-three results for a fixed closet and seed, and a check that ten Wore this events move a weight without breaking its limit.

## How pieces fit together (researched 5 October 2026)

- Silhouette: balance volume. One full half with one slim half reads best; full on both halves hides the shape (blog.petitedressing.com, robertastylelee.co.uk). Already in the rules.
- Length: split the body roughly one third to two thirds, not in half (awellstyledlife.com, eileenfisher.com). For South Asian sets the kurti length decides the bottom: short with sharara or gharara, long with straight trousers or shalwar (barkhaboutique.com, thejaipurstudio.com). Already in the rules.
- Layering: a layer should be clearly longer or shorter than the piece under it (tkmaxx.com). An open abaya at full length over a maxi dress is the normal way to wear it and is not a clash (abayabuth.com, mybatua.com). Added as an exception to same-length-layers.
- Pattern scale: when mixing prints, pair a small print with a large one; two prints at the same scale fight for attention (aarp.org, today.com). Added as print-scale-mix and print-same-scale, only when she mixes prints.
- Sheen: pair one shiny piece with matte pieces; satin on satin looks costume-like unless it is a matching set (masterclass.com, 40plusstyle.com). Added as shiny-on-shiny.
- Season weight: summer fabrics (lawn, linen, chiffon) and winter fabrics (wool, velvet, khaddar, karandi) in the same top and bottom look mismatched (shopmashburn.com, westwoodhart.com). Added as season-fabric-clash.
- Petite proportions: one colour column and a visible waist lengthen the line (insideoutstyleblog.com, youlookfab.com). Not added, the app does not know height or body shape.
- Learned compatibility: Han 2017 (arxiv 1707.05691) and Vasileva 2018 (arxiv 1803.09196) learn which pieces go together from outfit data. These need large rated sets, so the rule book stays the main engine and her Wore this history tunes the weights.
