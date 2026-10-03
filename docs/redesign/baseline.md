# Baseline (Phase 0)

Date: 2026-10-03. Commit under test: `0ea6928`. Release simulator build, simulator `Closet Development` (iPhone 17 Pro, iOS 27.0), Maestro 2.11.

## How to run

- Full suite: `npm run e2e` (builds the Release app if missing, `REBUILD=1` forces a rebuild, runs every folder in `.maestro`).
- One folder: `npm run e2e -- .maestro/<folder>`.
- Screenshots from `takeScreenshot` are copied back to the repo path named in the flow.

## Full suite result

25 of 56 flows passed, 31 failed. Existing suite: 24 of 55 passed. The new `baseline/routes.yaml` passed.

Most failures are not app bugs. Many flows start with `launchApp` without `clearState` and expect state left by an earlier flow or by a seed script in the folder (`seed-capture.sh`, `seed-variants.sh`, `seed.sh`, `seed-owned.sh`, `seed-weather.sh`). The runner does not run seed scripts, and the folder order leaves the app in onboarding, so `Closet` is not found.

| Flow | Result | First error |
|---|---|---|
| 04-capture/capture-group | Fail | Element not found: Closet |
| 04-capture/duplicate-and-retake | Fail | Element not found: Closet |
| 04-capture/permissions | Fail | Element not found: Closet |
| 04-capture/sets | Fail | Element not found: Closet |
| 04-capture/tips | Fail | Element not found: Closet |
| 04-capture/variants | Fail | Element not found: Closet |
| 07-model/stylist-setting | Fail | No visible element found: "Style settings" |
| 07-model/stylist-setting-nb | Fail | No visible element found: "Stilinnstillinger" |
| 07-model/today-unlabelled | Fail | No visible element found: "Not for me" |
| attributes/item-page | Fail | Element not found: Closet |
| attributes/item-page-large | Fail | Element not found: Closet |
| attributes/piece-details | Fail | Element not found: Closet |
| attributes/piece-details-large | Fail | Element not found: Closet |
| attributes/quick-check | Fail | Element not found: Closet |
| attributes/quick-check-large | Fail | Element not found: Closet |
| attributes/remove-piece | Fail | Element not found: Closet |
| baseline/routes | Pass | |
| care-label/check-piece | Fail | Assertion is false: "cotton" is visible |
| care-label/large-text | Fail | No visible element found: "Label test dress.*" |
| care-label/nb | Fail | Element not found: Closet\|Klesskap\|Garderobe |
| care-label/piece | Fail | Element not found: Label test dress.* |
| care-label/skip | Pass | |
| labels/capture | Fail | Element not found: Add 1 ready piece |
| labels/closet | Fail | Element not found: Unavailable |
| labels/closet-large | Pass | |
| labels/closet-nb | Fail | Assertion is false: "Alle" is visible |
| labels/editor | Fail | No visible element found: "Kurti.*" |
| labels/large-text | Pass | |
| labels/native | Pass | |
| onboarding/answers | Pass | |
| onboarding/answers-large | Pass | |
| onboarding/city | Fail | Element not found: Skip |
| onboarding/colours | Pass | |
| onboarding/flow | Pass | |
| onboarding/flow-large | Pass | |
| onboarding/settings | Pass | |
| onboarding/skip | Pass | |
| onboarding/today-forecast | Fail | Element not found: Skip |
| profile-onboarding-builder/builder | Pass | |
| profile-onboarding-builder/onboarding | Pass | |
| profile-onboarding-builder/profile | Pass | |
| stylist/feedback | Pass | |
| stylist/large-text | Pass | |
| stylist/layouts | Pass | |
| stylist/looks | Pass | |
| stylist/occasions | Fail | Assertion is false: "Eid" is visible |
| stylist/start | Pass | |
| stylist/style-settings | Pass | |
| wardrobe/archive | Pass | |
| wardrobe/bokmal | Fail | No visible element found: "Hopp over" |
| wardrobe/coverage | Pass | |
| wardrobe/coverage-owned | Fail | No visible element found: "My clothes" |
| wardrobe/hijab | Pass | |
| wardrobe/looks | Fail | Assertion is false: "Variant of Office" is visible |
| wardrobe/start | Pass | |
| wardrobe/weather | Fail | Element not found: Closet |

## Before screenshots

`.maestro/baseline/routes.yaml` starts from a clean install with the sample closet, adds `sage-kurta.png` to the photo library, and visits every route. 27 screenshots in `docs/redesign/screens/before/`.

| Route | Screenshot |
|---|---|
| onboarding/index | onboarding-index.png |
| onboarding/colours | onboarding-colours.png |
| Today tab, no everyday style | today-empty.png |
| Today tab, sample style | tab-today.png |
| today/everyday | today-everyday.png |
| today/adjust | today-adjust.png |
| today/hijab | today-hijab.png |
| today/replace | today-replace.png |
| today/pieces | today-pieces.png |
| today/style | today-style.png |
| today/stylist-results | today-stylist-results.png |
| today/check | today-check.png |
| Looks tab | tab-looks.png |
| look/[id] | look-detail.png |
| look/build | look-build.png |
| Profile tab | tab-profile.png |
| Closet tab | tab-closet.png |
| capture/index | capture-index.png, capture-index-prepared.png |
| capture/scan | capture-scan.png |
| piece/new | piece-new.png |
| capture/[id] | capture-detail.png |
| cutout/[id] | cutout.png |
| label/[id] | label.png |
| piece/[id] (owned piece) | piece-detail.png |
| piece/edit/[id] | piece-edit.png |
| capture/group/[id] | capture-group.png |

## Routes not reached in their main state

- `today/check`: reached by deep link, shows "Nothing to check". Every sample piece has confirmed sleeves and length, so the question state needs an owned piece with unconfirmed coverage (covered by `wardrobe/coverage-owned` with `seed-owned.sh`).
- `capture/group/[id]`: reached by deep link with an unknown id, shows "These pieces are no longer waiting". A real group needs a photo with several pieces or people (covered by `04-capture/capture-group` with `seed-capture.sh`).
- `capture/scan`: shows "The camera is not available on this device". The simulator has no camera.
- `onboarding/colours`: shows the library fallback. The simulator has no camera.
