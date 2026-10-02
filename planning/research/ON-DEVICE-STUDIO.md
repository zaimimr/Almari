# On-device Studio photos (FLUX.2 [klein] 4B)

Feasibility spike, 2 October 2026. The question was whether a generative product shot can run on her iPhone (15 Pro or 16 Pro, 8 GB) with nothing uploaded.

## Verdict

Yes, it is feasible. The licence allows it, and the whole pipeline ran end to end on the Mac using the same Swift code that ships in the app. It used 3.9 GB of memory at 512 x 512. Speed, heat and quality on the phone still need checking on her iPhone.

## Licence

| Part | Licence | Commercial use |
| --- | --- | --- |
| FLUX.2 [klein] 4B (distilled and base), `black-forest-labs/FLUX.2-klein-4B` | Apache 2.0, not gated | Yes. Can also be hosted again, as long as the licence and attribution go with it |
| FLUX.2 [klein] 9B | FLUX Non-Commercial, gated | No. Not used |
| Text encoder (Qwen3-4B, inside the 4B repo) | Apache 2.0 | Yes |
| VAE (inside the 4B repo) | Covered by the repo's Apache 2.0 | Yes |
| 4-bit MLX weights `mlx-community/flux2-klein-4b-4bit` | Apache 2.0 | Yes |
| flux2-klein-swift (Xocialize), the port our code is adapted from | MIT | Yes, with the notice in `Resources/NOTICE.txt` |
| flux2-vae-mlx-swift (Xocialize) | No licence file | Not used. Our VAE decoder is written from scratch |

## What exists

- **Weights:** the BFL bf16 files are 7.75 GB for the transformer, 8 GB for the text encoder and 168 MB for the VAE. mlx-community publishes a 4-bit MLX build: a 2.18 GB transformer and a 2.26 GB text encoder. There are also GGUF builds (Q4 about 2.5 GB), which we don't need. Nunchaku and FP8/NVFP4 only run on NVIDIA.
- **Swift:** flux2-klein-swift (MIT, MLX) supports editing from a reference image, but its package targets macOS only and pulls in a large dependency tree. flux-2-swift-mlx (MIT) is macOS only. mzbac/flux.swift is GPL and FLUX.1 only. mlx-swift-examples has no FLUX. Apple's coreai-models needs iOS 27. Draw Things runs klein 4B on iPhone, but it is closed source.
- **Memory limit:** an 8 GB iPhone gives an app about 6.1 GB. Adding `increased-memory-limit` was reported not to raise that on 8 GB phones, but we add it anyway because it does no harm. A ported pipeline that keeps the text encoder resident needs 9 GB or more, which is why nobody runs it on a phone.

## Chosen path

1. **Fixed prompt, so no text encoder on the phone.** The prompt never changes, so it was encoded once on the Mac with the bf16 Qwen3-4B (`model/embed.py`, `model/prompt.txt`). The result, 512 x 7680 bf16 and 7.9 MB, ships in the app as `studio-prompt.safetensors`. That removes 8 GB of weights and the biggest memory peak.
2. **Our own MLX Swift module** (`modules/studio-photo`) adapted from flux2-klein-swift. It has the transformer, the VAE encoder and our own VAE decoder, and its only dependency is `mlx-swift` 0.31.6 via `spm_dependency` in the podspec.
3. **Weights straight from Hugging Face, pinned to a commit.** The download is `mlx-community/flux2-klein-4b-4bit` transformer (2.18 GB) plus the BFL VAE (168 MB), 2.35 GB in total. It starts after she turns the setting on and is saved to Application Support, excluded from backup and checked by exact size. No R2 is needed, because the licences allow loading from HF directly.
4. **Edit with the cutout as reference.** The cutout is placed on white, at 512 x 512, and 4 steps run at guidance 1, which is the distilled default. The prompt asks for a pressed garment on a ghost mannequin on soft white, with every colour, pattern, embroidery and trim kept.

## Mac measurements (M2 Pro, 32 GB, same Swift code, `checks/`)

| Step | MLX peak |
| --- | --- |
| Weights loaded (4-bit transformer, bf16 VAE, prompt) | 2.36 GB |
| VAE encode of the reference | 3.52 GB |
| One transformer step (target and reference tokens, fp32 activations, evaluated block by block) | 3.36 GB |
| VAE decode | 3.92 GB |
| Whole process, peak footprint | 3.9 GB |

- **Time:** about 20 s per image at 512 x 512 with 4 steps. Loading takes under 3 s cold and 0.2 s warm.
- **Changes the measurements forced:** with an fp32 VAE and no per-block evaluation, the peak was 7.4 GB, which would not fit on the phone. Running the VAE in bf16, evaluating after each block and capping the MLX cache at 64 MB brought it to 3.9 GB.
- **Quality:** three sample garments, one of them darkened, colour shifted and rotated to look like a phone photo. Output is in `planning/build/studio/mac-compare.jpg`. Embroidery, buttons, lapels and slits were kept. On the darkened photo the colour came out a little more saturated than the original. There is no real phone photo on the Mac to test with.

## Expected on iPhone (estimate, not measured)

- **Speed:** the A17 Pro and A18 Pro GPUs have roughly a quarter to a third of the M2 Pro's throughput, so expect about 60 to 90 s per image. The phone will get warm.
- **Memory:** about 3.9 GB for the model and around 0.5 GB for the app, under the roughly 6.1 GB limit. The module refuses to start with less than 4.3 GB available.
- **Simulator:** MLX does not run in the iOS simulator, so the module reports Studio as unavailable there.

## Build note

mlx-swift declares a CUDA build plugin. Command-line Xcode builds need `-skipPackagePluginValidation`, or run this once: `defaults write com.apple.dt.Xcode IDESkipPackagePluginFingerprintValidatation -bool YES`. In the Xcode app, choose Trust & Enable once. The Metal Toolchain component must be installed (`xcodebuild -downloadComponent MetalToolchain`).
