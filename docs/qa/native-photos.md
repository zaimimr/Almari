# Native photograph evidence

Checked on 11 October 2026 with `npm run test:photos` and `npm run test:photo-gaps`. The tests run the packaged Core ML clothes parser and Apple's Vision foreground selection locally, then use production cutout cropping and Studio input preparation. No hosted generation runs.

The positive suite has five selections from four photographs. A fifth photograph is a separate strict failing floor-selection gate. Source pages, creators, licences, image changes and SHA-256 hashes are recorded in [the positive manifest](../../tests/fixtures/vision/sources.json) and [the unresolved manifest](../../tests/fixtures/vision/unresolved.json). Coordinates use the original photograph's top-left origin, normalized to its width and height. Each case verifies source hash, person count, selected fabric landmarks and exclusion landmarks. Parser category predictions are diagnostic; capture-region planning and the separate item recognizer are outside this suite.

| Selection | Result | Evidence |
| --------- | ------ | -------- |
| Head-wrapped hijab | Passed after earlier repair | Cap, shoulder and chest fabric retained; face, hand and background excluded. |
| Folded hanging trousers | Passed | Visible fabric retained and background excluded despite a parser dress prediction. The photograph does not show the complete trousers. |
| Hanging dark jacket | Passed | Body and sleeve fabric retained; window and surrounding wall excluded. The source jacket is partly outside the frame. |
| Worn white blazer | Passed after repair | Both sides and sleeves retained; black top, hand, face and background landmarks excluded. |
| Worn blue jeans | Passed | Visible denim landmarks retained; white blazer, hand, face and background excluded. The legs extend outside the photograph. |
| Crowded folded trousers on the floor | Failed | The selected foreground includes adjacent clothing and the sheet. Strict exclusion landmarks fail. |

The earlier headscarf test exposed a missing cap: the parser labelled it `hat`, while manual selection accepted only clothing classes. Selection now includes the existing carried-garment classes while excluding skin, face and hair. The synthetic cap/scarf regression failed before that repair and passes afterwards.

The white blazer exposed another defect. Before the current repair, its selection included the adjoining black top. Chroma-only comparison cannot distinguish neutral black and white. Colour comparison now includes weighted lightness, and picked regions retain the seed's garment role. Head and upper labels can still join for wrapped scarves. Worn selections can retain matching fabric separated by arms or other occlusion; loose selections retain the selected component. Three new synthetic cases check adjoining upper/trouser separation, shaded neutral fabric and occluded worn versus separate loose garments. The corrected baseline passes the jeans selection before this repair. Its initially reported failure was an incorrect tap annotation on the white blazer, subsequently corrected against the source image.

A trial fallback for the crowded floor image was rejected: it lost fabric, included neighbours and broke other passing photographs. The production Vision foreground path remains unchanged. The floor case is retained as a failing test, without an expected-failure waiver or weakened landmarks. Run both photo commands to assess the requested scene coverage; the positive command alone is insufficient.

Each case writes parser diagnostics, full-source selection mask, transparent cropped cutout, prepared Studio input and JSON metadata to ignored `planning/build/studio/crop-eval/native-photos/`. Metadata includes source, mask and prepared-input hashes, crop bounds, input dimensions and `inference: false`. Artifacts are written before landmark assertions, so their existence does not imply a passing case. The production input helper enforces the 500-pixel limit; a separate native test checks top-left crop coordinates and retained source orientation.

The blazer's [before mask](screens/native/blazer-before-mask.png) and [after mask](screens/native/blazer-after-mask.png) share the source dimensions. The [prepared input](screens/native/blazer-input.png) is cropped and whitened, not a generated Studio output. These derivatives use SkajaLee's [portrait photograph](https://commons.wikimedia.org/wiki/File:2021_urban_summer_fashion,_Andrea_Martinez_portrait.jpeg), licensed [CC BY-SA 2.0](https://creativecommons.org/licenses/by-sa/2.0/); the mask/input transformations are described above and the derivatives retain that licence.

The older parser smoke check also ran on all 23 wardrobe catalogue images. It permits category mismatches and missed garment regions, so a pass does not establish recognition accuracy.

These are landmark tests, not complete pixel ground truth. They do not prove every edge or patterned detail survives, exclude an entire hanger, establish classification accuracy or assess automatic outfit splitting. Same-colour overlapping garments and multiple people remain untested. macOS inference does not establish physical iPhone camera behavior. Simulator cutout flows separately exercise the constructor and editor wiring.

None of these photographs has a corresponding reviewed current Studio output. Loose and outfit-draped hijabs, isolated floor garments, more fabrics and colours, severe crops and reconstruction fidelity still need evidence. Crowded floor selection is a confirmed gap; the missing Studio corpus remains a separate gap in [the system analysis](system-analysis.md).
