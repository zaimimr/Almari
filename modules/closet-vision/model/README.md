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

## Attribute groups

`labels.py` also describes length, sleeve, volume, pattern, pattern size, fabric and embellishment. The app scores the same image embedding against each group and keeps the best value as a suggestion. A gap under 0.01 between the two best values counts as unsure; only an unsure length or sleeve becomes a quick check. Attribute accuracy has not been measured yet. See-through and open front are never described, so they are never guessed.

## Evaluation

Evaluation pending photos.

`zeroshot.py` (PyTorch) and `evalml.py` (Core ML) score the 13 sample garments, 35 public web photos and 20 extra photos covering the new subcategories and Desi style (`truth.py`). The photos are not committed; their sources and licences are listed in `web/sources.json`, `ov/sources.json` and `extra/sources.json` next to the photos. Both scripts skip photos that are missing, print `photos found: N of 68`, and exit cleanly when none exist. Recognition follows `src/domain/recognition.ts`: the category is the pooled score of its subcategories, the subcategory is the best inside that category, and the style is fixed by the subcategory or taken from the style descriptions. A photo gets a quick check when the top two candidates are closer than the margin.

Only the 13 sample garments are available now. The 35 web photos from the first evaluation are gone and the 20 extra photos have not been collected, so the numbers below cover 13 of 68 photos and are not comparable with the earlier 48-photo baseline.

| Model                        | Photos     | Category | Subcategory | Style | Quick checks |
| ---------------------------- | ---------- | -------- | ----------- | ----- | ------------ |
| SigLIP 2 base (PyTorch)      | samples 13 | 13/13    | 13/13       | 13/13 | 7/13         |
| SigLIP 2 base, Core ML 8-bit | samples 13 | 13/13    | 13/13       | 13/13 | 6/13         |

Margin: kept at 0.01. With it, the Core ML run asks a quick check for 6 of 13 photos and leaves 0 wrong without one. Median Core ML time per photo on the Mac: 29.2 ms.

Photos still needed, one garment per JPEG, with source and licence recorded in `sources.json` next to them:

- Original 35: restore `web/` (28 photos) and `ov/` (7 photos) with the names listed in `truth.py`, or replace them with comparable photos.
- Extra 20 in `extra/`: instant-hijab-0, underscarf-0, kurti-0, churidar-0, sharara-0, gharara-0, lehenga-0, anarkali-0, kaftan-0, waistcoat-0, khussa-0, sandals-0, blouse-0, jeans-0, sweater-0, t-shirt-0, wide-leg-0, flats-0, tote-0, jewellery-0.

Subcategories without a dedicated photo: shirt, kameez, jacket, clutch, backpack, belt, dupatta. On 1 October 2026, before the new subcategories, the Core ML model had 46/48 garment types and 47/48 categories right.

## Earlier baseline, 1 October 2026

Before the subcategory and style labels, `zeroshot.py` and `evalml.py` scored the 13 sample garments plus 35 public web photos (`truth.py`). The web photos are not committed.

| Model                          | Garment type correct | Category correct | Time per photo |
| ------------------------------ | -------------------- | ---------------- | -------------- |
| OpenAI CLIP ViT-B/32 (PyTorch) | 35/48                | 41/48            | 53 ms, Mac CPU |
| SigLIP 2 base (PyTorch)        | 47/48                | 47/48            | 85 ms, Mac CPU |
| SigLIP 2 base, Core ML 8-bit   | 46/48                | 47/48            | 13.5 ms, Mac   |

Both Core ML misses (a scarf read as a dupatta, trousers read as shalwar) had a margin under 0.01 between the first two guesses. The app asks for a quick check below that margin. On the iOS 27 simulator, 8 of 8 imported web photos were classified correctly on CPU. Timing on an iPhone 16 Pro has not been measured.

Once the photos exist, run:

```bash
.venv/bin/python zeroshot.py google/siglip2-base-patch16-224 ../../.. | tee .venv/zeroshot.txt
.venv/bin/python evalml.py GarmentEncoder.mlpackage | tee .venv/evalml.txt
```

## Care label reading, evaluation

Label text comes from Apple Vision. A rules parser in `src/domain/careLabel.ts` reads fibres with percentages, size and origin in English and Norwegian. Apple Foundation Models, the on-device language model, then fills fields the parser left empty, using guided generation into `CareLabelFields` in `ios/CareLabelModel.swift`. A model value is kept only when it is printed on the label. Needle was dropped because the phone does not have the memory for it.

16 fixture labels in `src/domain/fixtures/care-labels.json` (English, Norwegian, Urdu-English, one unreadable, one with only an origin), 50 expected facts. The model's answers are recorded on a Mac with `model/care_labels.swift` into `src/domain/fixtures/care-labels.model.json`.

| Reader                                        | Correct                   | Wrong                     | Missed                    |
| --------------------------------------------- | ------------------------- | ------------------------- | ------------------------- |
| Parser alone                                  | 45                        | 0                         | 5                         |
| Model alone, after the printed-on-label check | not available on this Mac | not available on this Mac | not available on this Mac |
| Parser first, model fills gaps (shipped)      | not available on this Mac | not available on this Mac | not available on this Mac |

The model could not be recorded on 2 October 2026: `SystemLanguageModel.default.availability` was `unavailable(modelNotReady)`, so `care-labels.model.json` is an empty object and the model rows are not measured. With an empty recording the merged reader equals the parser (45 correct, 0 wrong, 5 missed). The 5 missed facts are the brands, which the parser does not read.

The parser's rules were written together with these fixtures, so its score is optimistic. Her own labels are the real test. Time per label on the Mac: not measured.

To record again once Apple Intelligence has downloaded the model, build and run `care_labels.swift` together with `ios/CareLabelModel.swift` as in Task 5 Step 2 of the care label plan, check that it prints `available true`, then run `npm test`.

## Clothes parser

`ios/Resources/ClothesParser.mlmodelc` is `mattmdjaga/segformer_b2_clothes` from Hugging Face: SegFormer B2 fine-tuned for clothes parsing on `mattmdjaga/human_parsing_dataset`, which is based on the ATR dataset. It is converted to Core ML with 8-bit weights by `parser.py`.

- Input `image`: RGB, fixed at 512 by 512. The photo, or the largest person in it, is stretched to this size, as the model's own image processor does. ImageNet normalisation is inside the converted model.
- Output `logits`: float32, 18 by 512 by 512, upsampled bilinearly from the model's quarter-size output. Classes in order: Background, Hat, Hair, Sunglasses, Upper-clothes, Skirt, Pants, Dress, Belt, Left-shoe, Right-shoe, Face, Left-leg, Right-leg, Left-arm, Right-arm, Bag, Scarf.
- Size: 27 MB compiled, 27.9 MB as a package.
- Core ML 8-bit against PyTorch on the 13 sample garments: mean pixel agreement 0.997.

### Clothes parser licence

The model card lists the licence as "other" and links the NVIDIA Source Code License for SegFormer (https://github.com/NVlabs/SegFormer/blob/master/LICENSE). It says: "The Work and any derivative works thereof only may be used or intended for use non-commercially", where non-commercially means for research or evaluation purposes only. ATR is a research dataset.

This app is a personal project used on one phone, with no sales and no public release. Before any public or commercial release the licence must be reviewed again, and the parser replaced by a model with a permissive licence or licensed from NVIDIA.

### Clothes parser rebuild

```sh
uv venv --python 3.12 .venv
VIRTUAL_ENV=.venv uv pip install "torch==2.7.0" "torchvision==0.22.0" transformers sentencepiece protobuf pillow coremltools
.venv/bin/python parser.py
.venv/bin/python parsercheck.py
xcrun coremlcompiler compile ClothesParser.mlpackage ../ios/Resources/
```

### Clothes parser on photos in the repo, Mac, provisional

`~/Almari-test-photos` does not exist on this Mac, so the check ran on the photos that are in the repo: the 13 sample garments in `assets/wardrobe` and 3 flat lay screenshots in `planning/research/assets`. There is no photo of a person wearing an outfit, no photo with a second person and no mirror photo in the repo, so the person path has not been measured. All numbers below are provisional.

To rerun on her own photos, put them in `~/Almari-test-photos` and run `dist/closet-parse-check modules/closet-vision/ios/Resources/ClothesParser.mlmodelc ~/Almari-test-photos dist/parse-photos`. Photos and cutouts stay on the Mac and are not committed. Replace this table with one row per photo, using a description instead of the file name.

Vision reports one person on every one of these flat lay photos, so the parser only counts a person when the parsed area has at least 1 percent hair, face, arm or leg pixels. Otherwise it parses the whole photo as a flat lay with people 0. The 1 percent threshold was set on flat lays only and has to be checked against worn outfits.

| Photo | Expected | People | Found | Partly visible | Time |
| --- | --- | --- | --- | --- | --- |
| Flat lay, wide charcoal trousers | pants | 0 | upper, upper, dress, dress, skirt, skirt, pants, pants | 7 of 8 | 692 ms (model load) |
| Flat lay, chocolate hijab | head | 0 | head, upper, upper | none | 142 ms |
| Flat lay, chocolate loafers | shoes | 0 | upper, upper, pants, pants, shoes | 1 | 144 ms |
| Flat lay, ivory hijab | head | 0 | head, upper x4, dress, dress | 3 | 147 ms |
| Flat lay, ivory salwar | pants | 0 | pants | 1 | 144 ms |
| Flat lay, ivory trousers | pants | 0 | pants | none | 140 ms |
| Flat lay, ivory tunic | upper | 0 | upper x4, dress, dress | 6 | 138 ms |
| Flat lay, mauve hijab | head | 0 | head, upper x3, dress | 3 | 151 ms |
| Flat lay, navy blazer | upper | 0 | upper | none | 173 ms |
| Flat lay, olive maxi dress | dress | 0 | dress | none | 173 ms |
| Flat lay, sage embroidered kurta | upper | 0 | dress | none | 147 ms |
| Flat lay, taupe abaya | dress | 0 | dress | 1 | 137 ms |
| Flat lay, taupe bag | bag | 0 | bag | none | 137 ms |
| Screenshot, outfit laid out: scarf, blazer, skirt, bag, loafers | head, upper, skirt, bag, shoes | 0 | upper, skirt | none | 745 ms (model load) |
| Screenshot, one sneaker on white | shoes | 0 | pants, shoes | none | 162 ms |
| Screenshot, look with dress, sandal, sunglasses and scarf | dress, shoes, sunglasses, head | 0 | upper, dress, shoes | none | 171 ms |

Totals: 16 photos, 23 garments expected, 17 found with the right kind, 30 extra regions, 6 missed garments. The kurta counts as a miss because the parser calls it a dress. Most extra regions are small pieces of one garment that the model labels as another class, mostly on the sample garments. The missed ones are the scarf, bag, shoes and sunglasses in the two outfit screenshots.
