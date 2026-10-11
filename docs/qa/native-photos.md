# Native photograph evidence

Checked on 11 October 2026 with `npm run test:photos`. The test runs the packaged Core ML clothes parser and Apple's Vision foreground selection locally. It compiles the production `CutoutSelector`, `GarmentRegions`, `ClothesParser` and colour sampling code. No hosted generation runs.

The unchanged photographs, source pages, creators, licences and SHA-256 hashes are recorded in [the fixture manifest](../../tests/fixtures/vision/sources.json). Coordinates use the original photograph's top-left origin, normalized to its width and height. Each test verifies the source hash, person count, selected fabric landmarks and exclusion landmarks. Parser category predictions are diagnostic, because another model proposes the final item type in the app.

| Photograph | Result | Evidence |
| ---------- | ------ | -------- |
| Head-wrapped hijab | Passed after repair | Three fabric landmarks include the cap, shoulder and chest. Face, hand and background landmarks remain excluded. The parser detects one person and head/upper regions. |
| Folded hanging trousers | Passed | Three visible fabric landmarks remain selected; two background landmarks are excluded. Vision's foreground path selects the fabric despite the parser predicting dress. The image does not show the complete trousers. |

The headscarf test failed before the repair: the parser labelled the cap as `hat`, but manual selection accepted only clothing classes. Selection now uses the existing carried-garment classes, which include hats and shoes while excluding face, skin and hair. A separate synthetic regression recreates the adjoining cap, scarf, face and upper-garment labels. It failed before the change and passes afterwards.

Testing only the parser mask initially also rejected the hanging photograph. That would have been an inaccurate app failure claim: the production selector uses Vision foreground selection for photographs without a person. The photo suite runs that selector and its fallback, rather than substituting the parser mask.

The older parser smoke check was also executed on all 23 wardrobe catalogue images. It checks valid grids, labels and person detection, but allows category mismatches and missed garment regions. Its passing status does not establish recognition accuracy.

These are landmark tests, not complete pixel ground truth. They do not prove every fabric edge survives, exclude the entire hanger, establish final classification accuracy or assess automatic outfit splitting. macOS inference does not establish physical iPhone camera behavior. The simulator cutout flow separately checks the production constructor and editor wiring.

Neither photograph has a corresponding current Studio output. Floor, outfit-draped and worn-body scenes, more fabrics and colours, severe crops and reconstruction fidelity still need reviewed evidence. The missing Studio corpus remains a quality gap in [the system analysis](system-analysis.md).
