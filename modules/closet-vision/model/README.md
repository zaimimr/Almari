# Garment classifier

`ios/Resources/GarmentEncoder.mlmodelc` is the image encoder of Google's SigLIP 2 base model (`google/siglip2-base-patch16-224`), converted to Core ML with 8-bit weights. `ios/Resources/garment-labels.json` holds text embeddings for the garment descriptions in `labels.py`, computed with the same model. The app compares a photo's embedding with these descriptions, so no text model ships in the app.

SigLIP 2 is released by Google under the Apache License 2.0. The converted weights are a modified version of that model. Apple MobileCLIP was tested first and rejected because its weights are licensed for non-commercial research only.

## Rebuild

```sh
uv venv --python 3.12 .venv
VIRTUAL_ENV=.venv uv pip install "torch==2.7.0" "torchvision==0.22.0" transformers sentencepiece protobuf pillow coremltools
.venv/bin/python convert.py
xcrun coremlcompiler compile GarmentEncoder.mlpackage ../ios/Resources/
```

`convert.py` writes `../ios/Resources/garment-labels.json` (version 2): one entry per subcategory in the `kind` group and one per style (`desi`, `western`) in the `style` group, each with the embeddings of all its descriptions. The subcategory order must match `offeredKinds` in `src/domain/taxonomy.ts`; `npm test` checks this. Recompiling `GarmentEncoder.mlmodelc` is only needed when the image model changes.

## Evaluation

Evaluation pending photos.

`zeroshot.py` (PyTorch) and `evalml.py` (Core ML) score the 13 sample garments, 35 public web photos and 20 extra photos covering the new subcategories and Desi style (`truth.py`). The photos are not committed; their sources and licences are listed in `web/sources.json`, `ov/sources.json` and `extra/sources.json` next to the photos. Both scripts skip photos that are missing, print `photos found: N of 68`, and exit cleanly when none exist. Recognition follows `src/domain/recognition.ts`: the category is the pooled score of its subcategories, the subcategory is the best inside that category, and the style is fixed by the subcategory or taken from the style descriptions. A photo gets a quick check when the top two candidates are closer than the margin.

Only the 13 sample garments are available now. The 35 web photos from the first evaluation are gone and the 20 extra photos have not been collected, so the numbers below cover 13 of 68 photos and are not comparable with the earlier 48-photo baseline.

| Model | Photos | Category | Subcategory | Style | Quick checks |
| --- | --- | --- | --- | --- | --- |
| SigLIP 2 base (PyTorch) | samples 13 | 13/13 | 13/13 | 13/13 | 7/13 |
| SigLIP 2 base, Core ML 8-bit | samples 13 | 13/13 | 13/13 | 13/13 | 6/13 |

Margin: kept at 0.01. With it, the Core ML run asks a quick check for 6 of 13 photos and leaves 0 wrong without one. Median Core ML time per photo on the Mac: 29.2 ms.

Photos still needed, one garment per JPEG, with source and licence recorded in `sources.json` next to them:

- Original 35: restore `web/` (28 photos) and `ov/` (7 photos) with the names listed in `truth.py`, or replace them with comparable photos.
- Extra 20 in `extra/`: instant-hijab-0, underscarf-0, kurti-0, churidar-0, sharara-0, gharara-0, lehenga-0, anarkali-0, kaftan-0, waistcoat-0, khussa-0, sandals-0, blouse-0, jeans-0, sweater-0, t-shirt-0, wide-leg-0, flats-0, tote-0, jewellery-0.

Subcategories without a dedicated photo: shirt, kameez, jacket, clutch, backpack, belt, dupatta. On 1 October 2026, before the new subcategories, the Core ML model had 46/48 garment types and 47/48 categories right.

## Earlier baseline, 1 October 2026

Before the subcategory and style labels, `zeroshot.py` and `evalml.py` scored the 13 sample garments plus 35 public web photos (`truth.py`). The web photos are not committed.

| Model | Garment type correct | Category correct | Time per photo |
| --- | --- | --- | --- |
| OpenAI CLIP ViT-B/32 (PyTorch) | 35/48 | 41/48 | 53 ms, Mac CPU |
| SigLIP 2 base (PyTorch) | 47/48 | 47/48 | 85 ms, Mac CPU |
| SigLIP 2 base, Core ML 8-bit | 46/48 | 47/48 | 13.5 ms, Mac |

Both Core ML misses (a scarf read as a dupatta, trousers read as shalwar) had a margin under 0.01 between the first two guesses. The app asks for a quick check below that margin. On the iOS 27 simulator, 8 of 8 imported web photos were classified correctly on CPU. Timing on an iPhone 16 Pro has not been measured.

Once the photos exist, run:

```bash
.venv/bin/python zeroshot.py google/siglip2-base-patch16-224 ../../.. | tee .venv/zeroshot.txt
.venv/bin/python evalml.py GarmentEncoder.mlpackage | tee .venv/evalml.txt
```
