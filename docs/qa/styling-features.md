# Styling features

2026-10-11, iPhone simulator, iOS 27.0.

Named presets are available in Profile and Create a fit. They save occasion, style, feel, hijab and coverage choices. Names must be unique and contain at most 40 characters. Existing closets load without migration.

Plan a week is available in Looks. Its default is work on weekdays and everyday on weekends. Each day can use a named preset or a different occasion. Preview before saving, choose which days to keep, and preserve existing plans. Missing weather remains unknown. Saving rechecks clothes, constraints, dates and existing plans.

Photo inspiration is available in Today. The local photo picker and bundled garment models analyze the reference, then rank complete outfits from owned clothes. The reference does not become a closet piece. Temporary reference copies are removed when leaving the screen. Photos with several people require a different reference.

Checks:

- `npm run check`: 681 domain tests and 171 service tests passed, including offline network guards. Two pre-existing unused-import lint warnings remain in `src/domain/importing.test.ts`.
- Offline domain coverage: 98.39% lines, 91.73% branches, 91.65% functions. This measures loaded domain code, not native or UI code.
- Release iOS simulator build passed.
- `bash scripts/test-inspiration-vision.sh`: actual fixture photo produced two independently classified regions, blouse and jeans, each with a 768-dimensional embedding. Source photo remained unchanged.
- All four simulator flows below passed. The largest accessibility text size also passed Save look, with both Save look and Use today reachable.

Simulator flows:

- `.maestro/today/style-presets.yaml`: create, restart, rename, apply and remove.
- `.maestro/looks/automatic-week.yaml`: preview, save seven days, restart and preserve existing plans.
- `.maestro/system/photo-inspiration.yaml`: deterministic matching, another outfit, Use today and Save look. Storage checks verify owned clothes, no imports and temporary reference cleanup.
- `.maestro/system/photo-inspiration-native.yaml`: actual system photo picker and native analysis, followed by cleanup checks.

Screenshots are in `docs/qa/screens/system/`: `style-presets`, `style-presets-applied`, `automatic-week`, `photo-inspiration`, `photo-inspiration-saved`, `photo-inspiration-native` and `photo-inspiration-large`.

Recognition is best effort. One actual photo validates the native pipeline, not recognition accuracy across all photos or how well a match captures personal taste. Partial garments reduce reliance on inferred shape. Insufficient matches display an empty state.

No paid inference, hosted evaluation, deployment or release was used.
