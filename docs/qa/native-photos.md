# Native photograph evidence

Checked on 11 October 2026 with `npm run test:photos` and `npm run test:photo-gaps`. The tests run the packaged Core ML clothes parser and Apple's Vision foreground selection locally, then use production cutout cropping and Studio input preparation. No hosted generation runs.

The positive suite has five selections from four photographs. Four additional photographs are strict failing gates: crowded floor trousers and three hanging scarf displays. Source pages, creators, licences, image changes and SHA-256 hashes are recorded in [the positive manifest](../../tests/fixtures/vision/sources.json) and [the unresolved manifest](../../tests/fixtures/vision/unresolved.json). Coordinates use the original photograph's top-left origin, normalized to its width and height. Each case verifies source hash, person count, selected fabric landmarks and exclusion landmarks. Parser category predictions are diagnostic; capture-region planning and the separate item recognizer are outside this suite.

| Selection | Result | Evidence |
| --------- | ------ | -------- |
| Head-wrapped hijab | Passed after earlier repair | Cap, shoulder and chest fabric retained; face, hand and background excluded. |
| Folded hanging trousers | Passed | Visible fabric retained and background excluded despite a parser dress prediction. The photograph does not show the complete trousers. |
| Hanging dark jacket | Passed | Body and sleeve fabric retained; window and surrounding wall excluded. The source jacket is partly outside the frame. |
| Worn white blazer | Passed after repair | Both sides and sleeves retained; black top, hand, face and background landmarks excluded. |
| Worn blue jeans | Passed | Visible denim landmarks retained; white blazer, hand, face and background excluded. The legs extend outside the photograph. |
| Crowded folded trousers on the floor | Failed | The selected foreground includes adjacent clothing and the sheet. Strict exclusion landmarks fail. |
| Hand-dyed scarves drying on a line | Failed | Selecting the leftmost scarf includes a neighboring scarf. |
| Solid-colour scarves tied on a display rail | Failed after person repair | Zero people now reported correctly; the chosen teal scarf still includes its blue neighbor. |
| Patterned scarves on a display | Failed after person repair | Zero people now reported correctly; the selected red scarf still includes orange/blue neighbors. |
| Folded black jacket on a wooden floor, separate local download | Failed | Body and neighbor landmarks pass, but the dangling hem drawstring is missing. |

The earlier headscarf test exposed a missing cap: the parser labelled it `hat`, while manual selection accepted only clothing classes. Selection now includes the existing carried-garment classes while excluding skin, face and hair. The synthetic cap/scarf regression failed before that repair and passes afterwards.

The white blazer exposed another defect. Before the current repair, its selection included the adjoining black top. Chroma-only comparison cannot distinguish neutral black and white. Colour comparison now includes weighted lightness, and worn picked regions retain the seed's garment role. Head and upper labels can still join for wrapped scarves. Worn selections can retain matching fabric separated by arms or other occlusion; loose selections retain the selected component. Three new synthetic cases check adjoining upper/trouser separation, shaded neutral fabric and occluded worn versus separate loose garments. The corrected baseline passes the jeans selection before this repair. Its initially reported failure was an incorrect tap annotation on the white blazer, subsequently corrected against the source image.

A subsequent synthetic closed-scarf check exposed a hole-filling defect: the face enclosed by the scarf was added back into the selected mask. The pre-repair production probe failed. Final selection now removes known face, hair, arm and leg labels after hole filling; a new regression checks all six body classes while retaining cap and chest fabric. All five positive photograph cases still pass. This synthetic evidence does not establish recognition accuracy for an untested closed-wrap photograph.

Visual review of the saved simulator mask then caught a regression that those macOS photograph cases did not: the isolated ivory tunic lost large fabric sections. Restricting every selection to one parser role treated conflicting labels within a single loose garment as separate items. Role restriction now applies to worn selections; loose selections retain the selected connected garment across clothing labels. A new synthetic case failed before that repair and passes after it, while the worn upper/trouser separation regression remains enforced with an explicit person context. The rebuilt simulator screenshot restores the fabric. Post-flow checks read the actual saved PNG and source-coordinate mapping, require four fabric and two background landmarks, and record hashes in ignored `planning/build/studio/crop-eval/simulator/tunic.json`. The UI flow is marked failed if those disk landmarks fail.

The photograph harness also stopped whitening transparent references before selection. It now preserves source alpha and uses the production 2048-pixel working-photo scaler, matching the editor preprocessing. All five positive cases still pass. A separate transparent-catalogue probe passed on macOS even while the simulator image had holes; Vision device/platform differences mean the macOS selector results cannot replace simulator disk checks.

A trial fallback for the crowded floor image was rejected: it lost fabric, included neighbours and broke other passing photographs. The production Vision foreground path remains unchanged. The floor case is retained as a failing test, without an expected-failure waiver or weakened landmarks. Run both photo commands to assess the requested scene coverage; the positive command alone is insufficient.

The three new hanging photographs are real scarves, with `head` as the selected garment intent. Their use as a particular hijab style is not established by the source descriptions. The drying-line case fails exclusion at `[0.33, 0.4]`; the two display cases initially failed the independently reviewed zero-person expectation before selection. A diagnostic production probe found two Vision person instances and zero parsed body pixels in each display. The parser previously checked that mismatch only for exactly one instance. Its existing rejection now also checks multiple instances, so all four gap photos report zero people. The original five passing photo selections remain passing.

The display selections still include adjacent scarves. Full-mask review exposed orange/blue neighbor fragments in the patterned case that its first landmarks missed; three additional reviewed exclusion points now enforce that failure. The case was not accepted as a positive test. All four scene quality gates remain failing after the person repair. These checks do not establish detection accuracy for a real multiple-person photograph. The strict annotations are retained. The photographs are Changku88's [drying scarves](https://commons.wikimedia.org/wiki/File:Drying_hand-dyed_scarves.jpg), Yannick Bammert's [colourful scarves](https://commons.wikimedia.org/wiki/File:Colorful_scarves.jpg) and Erkaha's [patterned scarves](https://commons.wikimedia.org/wiki/File:Bunte_Tuecher.jpg). The manifest records their licences and unedited 960-pixel thumbnail hashes.

Each case that reaches selection writes parser diagnostics, full-source selection mask, transparent cropped cutout, prepared Studio input and JSON metadata to ignored `planning/build/studio/crop-eval/native-photos/`. Metadata includes source, mask and prepared-input hashes, crop bounds, input dimensions and `inference: false`. Artifacts are written before landmark assertions, so their existence does not imply a passing case. The production input helper enforces the 500-pixel limit; a separate native test checks top-left crop coordinates and retained source orientation.

The blazer's [before mask](screens/native/blazer-before-mask.png) and [after mask](screens/native/blazer-after-mask.png) share the source dimensions. The [prepared input](screens/native/blazer-input.png) is cropped and whitened, not a generated Studio output. These derivatives use SkajaLee's [portrait photograph](https://commons.wikimedia.org/wiki/File:2021_urban_summer_fashion,_Andrea_Martinez_portrait.jpeg), licensed [CC BY-SA 2.0](https://creativecommons.org/licenses/by-sa/2.0/); the mask/input transformations are described above and the derivatives retain that licence.

The older parser smoke check also ran on all 23 wardrobe catalogue images. It permits category mismatches and missed garment regions, so a pass does not establish recognition accuracy.

These are landmark tests, not complete pixel ground truth. They do not prove every edge or patterned detail survives, exclude an entire hanger, establish classification accuracy or assess automatic outfit splitting. Same-colour overlapping garments and multiple people remain untested. macOS inference does not establish physical iPhone camera behavior. Simulator cutout flows separately exercise the constructor and editor wiring.

A separate floor-jacket case uses Hana Brannigan's [floor outerwear photograph](https://www.pexels.com/photo/flat-lay-of-jackets-on-brown-wooden-floor-3998647/). Its [manifest](../../tests/fixtures/vision/external.json) records source, [licence](https://www.pexels.com/license/), hash and landmarks. The source JPEG stays in ignored local storage. This case is additional to the five passing selections and four bundled failing gates, with no corresponding Studio output.

The first floor-jacket check passed body and neighbor landmarks. Full-mask review then showed that the visible drawstring below the hem was removed. Source-pixel review placed a fabric landmark at `[0.55513, 0.75709]`; the strengthened check fails there. The initial pass was rejected. It does not establish complete garment retention.

```sh
mkdir -p planning/build/studio/crop-eval/external
curl --fail --location 'https://images.pexels.com/photos/3998647/pexels-photo-3998647.jpeg?cs=srgb&dl=pexels-thishanabee-3998647.jpg&fm=jpg' -o planning/build/studio/crop-eval/external/jackets-floor.jpg
bash scripts/test-photo-vision.sh tests/fixtures/vision/external.json
```

The requested scene coverage remains incomplete:

| Requested scene | Real-photo selection | Reviewed Studio output |
| --------------- | -------------------- | ---------------------- |
| Loose floor hijab | Missing | Missing |
| Hanging hijab | Three related scarf scenes fail; particular hijab style not established | Missing |
| Outfit-draped hijab | Missing | Missing |
| Head-wrapped hijab | Landmark pass | Missing |
| Floor trousers | Crowded selection fails | Missing |
| Hanging trousers | Landmark pass, folded/partial | Missing |
| Worn trousers | Landmark pass, legs outside frame | Missing |
| Floor jacket | Separate local case fails drawstring retention | Missing |
| Hanging jacket | Landmark pass, partly outside frame | Missing |
| Worn jacket | Landmark pass | Missing |

None of these photographs has a corresponding reviewed current Studio output. Loose and outfit-draped hijabs, isolated floor garments, more fabrics and colours, severe crops and reconstruction fidelity still need evidence. Crowded floor selection is a confirmed gap; the missing Studio corpus remains a separate gap in [the system analysis](system-analysis.md).
