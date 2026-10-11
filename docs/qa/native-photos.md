# Native photograph evidence

Checked on 11 October 2026. The original five positive selections, four bundled gap photographs and separate local-download floor jacket pass their strict fabric/exclusion landmarks. The broader transformed-photo gate remains red: 44 of 56 variants pass, with 12 failures. The local crop commands run no hosted generation. A separate approved 20-request [live Studio review](studio-photos.md) returned 17 images and three HTTP 502 errors; eight images clearly fail and nine require owner review.

The tests exercise the packaged clothes parser, production manual selector, cutout bounds and Studio input preparation. Loose garments now use the packaged SAM 2.1 Small point segmenter, followed by source-pixel refinement. Worn garments retain the existing person-aware parser path. Production selection never reads fixture names, hashes, garment annotations or landmark coordinates.

## Original photographs

| Selection                                             | Result           | Evidence                                                                                                                |
| ----------------------------------------------------- | ---------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Head-wrapped hijab                                    | Passed           | Cap, shoulder and chest retained; face, hand and background excluded.                                                   |
| Folded hanging trousers                               | Passed           | Fabric and background landmarks pass despite a diagnostic dress prediction. The source does not show complete trousers. |
| Hanging dark jacket                                   | Passed           | Body and sleeves retained; window and wall excluded. The jacket is partly outside the frame.                            |
| Worn white blazer                                     | Passed           | Both sides and sleeves retained; black top, hand, face and background excluded.                                         |
| Worn blue jeans                                       | Passed           | Denim retained; blazer, hand, face and background excluded. Legs extend outside the frame.                              |
| Crowded folded trousers on the floor                  | Repaired, passed | Selected trousers retained; adjoining garments and sheet excluded.                                                      |
| Hand-dyed scarves drying on a line                    | Repaired, passed | Leftmost scarf retained; neighboring scarf excluded.                                                                    |
| Solid-colour scarves tied on a rail                   | Repaired, passed | Selected teal scarf retained; blue neighbor excluded.                                                                   |
| Patterned scarves on a display                        | Repaired, passed | Selected red scarf, including reviewed printed fabric, retained; orange and blue neighbors excluded.                    |
| Folded black jacket on a wooden floor, local download | Repaired, passed | Body and dangling hem drawstring retained; adjacent jacket and floor excluded.                                          |

The loose-garment repair selects the tap-connected model component and uses original colours to recover attached thin details and small missing fabric areas. Broad neighboring regions are not added by the thin-detail recovery. Small-mask logits are interpolated before thresholding. Crop bounds come from the same refined selection, so retained cords also reach prepared inputs. Source-derived palettes, relative distances and connectivity apply across images rather than matching these photographs.

Six added native regressions cover diagonal thin details at three sizes and three colours, broad touching neighbors, existing cords and genuine openings, patterned fabric holes, component/anchor behavior and rectangular mask interpolation. The native suite has 29 passing cases. A review-artifact bug was also repaired: fractional Core Image widths were truncated when writing masks, shifting pixels between rows. Evidence now uses the actual rendered selection dimensions.

Model source, pinned revision and nine file hashes are recorded in [segmenter-source.json](../../modules/closet-vision/model/segmenter-source.json). [segmenter.py](../../modules/closet-vision/model/segmenter.py) verifies and compiles those sources. The three packaged models add approximately 90 MB. The resource bundle includes the model licence. Physical-device memory, inference latency and camera behavior remain unmeasured.

## Broader gate

Mirroring, clockwise rotation, a 600-pixel long edge and alternative taps at every reviewed fabric landmark reuse the original keep/exclude assertions. There are no expected-failure waivers. Alternative taps include a knot, printed fabric and a drawstring.

| Suite                       | Passed | Failed | Remaining failures                                                                                                                                                                                        |
| --------------------------- | ------ | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Positive-photo variants     | 24     | 2      | Mirrored scarf cap omitted; rotated white blazer includes black top.                                                                                                                                      |
| Bundled gap variants        | 15     | 7      | One drying-scarf tap loses fabric; teal scarf mirror includes its neighbor, rotation loses its knot, two taps lose its body; patterned scarf rotation loses fabric and one print tap includes a neighbor. |
| Local floor-jacket variants | 5      | 3      | Rotation, smaller input and tapping directly on the cord lose the cord.                                                                                                                                   |

The exact clockwise affine transform was rerun separately and retained the same failures. This is broader robustness evidence, not complete pixel ground truth. Hangers, rails and fine background fringes have no complete pixel-level exclusion gate. Same-colour overlapping garments, sheer fabric, multiple people and further independent scenes need evidence. The original five repaired defects do not imply universal selection accuracy.

```sh
npm run test:vision
npm run test:photos
npm run test:photo-gaps
npm run test:photo-variants
PHOTO_VARIANTS=1 npm run test:photo-gaps
PHOTO_VARIANTS=1 bash scripts/test-photo-vision.sh tests/fixtures/vision/external.json
```

## Sources and artifacts

Source pages, creators, licences, changes and SHA-256 hashes are recorded in [sources.json](../../tests/fixtures/vision/sources.json), [unresolved.json](../../tests/fixtures/vision/unresolved.json) and [external.json](../../tests/fixtures/vision/external.json). Coordinates use a normalized top-left origin. Parser category predictions are diagnostic; automatic capture-region planning and the item recognizer are outside this suite. Display scarves are real scarves, but a particular hijab style is not established by their source descriptions.

The separate floor source is Hana Brannigan's [floor outerwear photograph](https://www.pexels.com/photo/flat-lay-of-jackets-on-brown-wooden-floor-3998647/), under the [Pexels licence](https://www.pexels.com/license/). Its JPEG remains in ignored local storage. The first body-only check was rejected after visual review exposed the missing drawstring; that strengthened landmark remains enforced.

```sh
mkdir -p planning/build/studio/crop-eval/external
curl --fail --location 'https://images.pexels.com/photos/3998647/pexels-photo-3998647.jpeg?cs=srgb&dl=pexels-thishanabee-3998647.jpg&fm=jpg' -o planning/build/studio/crop-eval/external/jackets-floor.jpg
bash scripts/test-photo-vision.sh tests/fixtures/vision/external.json
```

Selections write parser diagnostics, full-source mask, transparent cutout, prepared selected/original references and JSON metadata to ignored `planning/build/studio/crop-eval/native-photos/`. Metadata includes source/mask/input hashes, exact source dimensions, bounds and `inference: false`. Artifacts may exist for failing cases; their existence is not a pass. Variant artifacts live under `variants/<variant>/`.

Earlier repairs retain the headscarf cap, separate the worn white blazer from its black top, remove enclosed body labels after hole filling, and allow conflicting clothing labels within a loose garment. The blazer's [before mask](screens/native/blazer-before-mask.png), [after mask](screens/native/blazer-after-mask.png) and [prepared input](screens/native/blazer-input.png) use SkajaLee's [portrait photograph](https://commons.wikimedia.org/wiki/File:2021_urban_summer_fashion,_Andrea_Martinez_portrait.jpeg), under [CC BY-SA 2.0](https://creativecommons.org/licenses/by-sa/2.0/). Mask/input derivatives retain that licence. These are cutouts, not generated Studio outputs.

Both rebuilt simulator cutout editor flows pass, including reading the saved catalogue-tunic PNG at four fabric and two background landmarks. Simulator catalogue fixtures and macOS real-photo tests provide different evidence; neither establishes physical iPhone performance. The older 23-image parser smoke check allows category errors and is not an accuracy gate.

## Studio evidence

`node --import=./scripts/tests/no-network.mjs --import=tsx scripts/studio-eval.ts --photos` prepares 20 real-photo requests: full selection and a central fragment for each of the ten selections. Both use actual native prepared inputs and the uncut original reference, with scene facts, source-derived crop bounds and request hashes. Preview artifacts live in ignored `planning/build/studio/crop-eval/preview/real-photos/`. Preview preparation makes no inference requests. `--live` is a separate explicit mode. After approval, these exact 20 requests were attempted once: 17 images returned and three requests failed with HTTP 502. The [live review](studio-photos.md) records all results and deployed-prompt provenance.

| Requested scene     | Real-photo selection                                                        | Reviewed current Studio output                                           |
| ------------------- | --------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| Loose floor hijab   | Missing                                                                     | Missing                                                                  |
| Hanging hijab       | Three related scarf scenes pass original landmarks; variant failures remain | Five images reviewed; one HTTP 502; owner fidelity review still required |
| Outfit-draped hijab | Missing                                                                     | Missing                                                                  |
| Head-wrapped hijab  | Original landmarks pass; mirrored cap fails                                 | Two failures: added hand and changed colour                              |
| Floor trousers      | Crowded original and tested variants pass                                   | Full fails visible fabric; fragment HTTP 502                             |
| Hanging trousers    | Landmark pass, folded/partial                                               | Both outputs retain a hanger                                             |
| Worn trousers       | Landmark pass, legs outside frame                                           | Two images need owner review                                             |
| Floor jacket        | Original passes; three cord variants fail                                   | Full keeps cord but changes construction; fragment HTTP 502              |
| Hanging jacket      | Landmark pass, partly outside frame                                         | Both outputs change visible fabric/construction                          |
| Worn jacket         | Original passes; rotated black-top exclusion fails                          | Two images need trim/construction review                                 |

All 17 returned current Studio outputs were visually reviewed; eight clearly fail and nine remain unconfirmed. Loose and outfit-draped hijabs, further independent scenes, broader crop robustness and validated reconstruction fidelity remain separate gaps in [the system analysis](system-analysis.md).
