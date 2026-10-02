# Outfit compatibility head

A small type-aware compatibility head trained on Polyvore Outfits over frozen SigLIP 2 image embeddings. The app runs it in TypeScript (`src/domain/scoring/modelScorer.ts`) as the Model engine. The weights are in `src/domain/scoring/compat-head.json`.

## Model

- Item embedding: the SigLIP 2 base image embedding (`google/siglip2-base-patch16-224`), computed exactly as the app does: composited on white, centred on a white square, scaled to 224 px, L2 normalised and stored as 768 signed 8-bit values.
- Head: one shared 768 to 64 projection and one diagonal mask per pair of the seven types `main`, `bottom`, `outer`, `shoes`, `bag`, `scarf`, `accessory`. A pair scores the cosine of the two masked projections. An outfit scores the mean over all its pairs. 50,944 parameters.
- Training: ordered pairs from each training outfit against a random training item of the same type as the second item, softplus loss with scale 10, AdamW (learning rate 0.001, weight decay 0.0001), batch 2048, 8 epochs, seed 0, best epoch by validation AUC, Apple Silicon MPS.

Polyvore categories map to the seven types as: tops and all-body to main, bottoms to bottom, outerwear to outer, shoes to shoes, bags to bag, scarves to scarf, and jewellery, accessories, hats and sunglasses to accessory. In the app, a hijab is a scarf, a layer or outer piece is outer, and a dupatta is an accessory.

## Results, 2 October 2026

Test split numbers from `evaluate.py`. Fill in the blank counts a question as right only when the right candidate scores strictly highest.

| Split | Compatibility AUC | Fill in the blank | Questions |
| --- | --- | --- | --- |
| Nondisjoint | 0.9279 | 0.6828 | 20000 and 10000 |
| Disjoint | 0.9233 | 0.6961 | 30290 and 15145 |

For reference: type-aware embeddings reported 0.86 and 55.3% (0.88 and 57.6% with the released code), and an OutfitTransformer reimplementation on CLIP features reported 0.95 and 69.2%, all on the nondisjoint split. The app ships the nondisjoint head. Embedding all items took 47 minutes and training took about 1 minute per split on an Apple M2 Pro Mac with 32 GB.

Polyvore has no hijabs, kurtas, shalwar, abayas or dupattas, so Desi outfits are outside the training data. The app's results screen splits every number by Desi and Western.

## Rebuild

```sh
uv venv --python 3.12 .venv
VIRTUAL_ENV=.venv uv pip install "torch==2.7.0" "transformers>=4.49" pillow numpy pyarrow scikit-learn huggingface_hub
.venv/bin/python download.py
.venv/bin/python embed.py
.venv/bin/python train.py nondisjoint
.venv/bin/python train.py disjoint
.venv/bin/python evaluate.py
.venv/bin/python embed_samples.py
.venv/bin/python export.py
```

`data/` (about 2.5 GB) and `out/` are not committed.

## Data and licence notes

- Polyvore Outfits: Mariya I. Vasileva, Bryan A. Plummer, Krishna Dusad, Shreya Rajpal, Ranjitha Kumar and David Forsyth, "Learning Type-Aware Embeddings for Fashion Compatibility", ECCV 2018. The authors publish the dataset under CC BY 4.0 (https://creativecommons.org/licenses/by/4.0/). Changes made here: item images were turned into SigLIP 2 embeddings, categories were mapped to seven types, and only a trained head is kept.
- The official copy (`mvasil/polyvore-outfits` on Hugging Face) is gated. Its card says access is intended for academic and non-profit research and that the authors do not own the copyright to the underlying images or metadata.
- `download.py` uses the refactored copies `owj0421/polyvore-outfits` (revision 5aabda5) and `owj0421/polyvore` (revision 8d38092), which are what the MIT-licensed `owj0421/outfit-transformer` uses. Their licence field says "other".
- In these copies the `image` column holds the JPEG bytes directly, and every negative compatibility question starts with an empty slot `""`. `embed.py` reads the bytes as they are and `head.py` drops empty slots, so all 251,008 items and all test questions are used.
- The item images come from retailers through Polyvore, and their rights are unclear. They stay on the Mac in `data/`, are never committed and never ship. Only the head (50,944 numbers) and the sample closet embeddings ship in the app.
- Use is personal only. Before a public App Store release, the licence position is reviewed again, and `compat-head.json` and the Model engine are removed if it cannot be cleared.
- The type-aware method comes from `mvasil/fashion-compatibility` (BSD-3-Clause); no code was copied. SigLIP 2 is Apache 2.0.
