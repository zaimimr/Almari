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

## Evaluation, 1 October 2026

`zeroshot.py` and `evalml.py` score the 13 sample garments plus 35 public web photos (`truth.py`). The web photos are not committed.

| Model | Garment type correct | Category correct | Time per photo |
| --- | --- | --- | --- |
| OpenAI CLIP ViT-B/32 (PyTorch) | 35/48 | 41/48 | 53 ms, Mac CPU |
| SigLIP 2 base (PyTorch) | 47/48 | 47/48 | 85 ms, Mac CPU |
| SigLIP 2 base, Core ML 8-bit | 46/48 | 47/48 | 13.5 ms, Mac |

Both Core ML misses (a scarf read as a dupatta, trousers read as shalwar) had a margin under 0.01 between the first two guesses. The app asks for a quick check below that margin. On the iOS 27 simulator, 8 of 8 imported web photos were classified correctly on CPU. Timing on an iPhone 16 Pro has not been measured.
