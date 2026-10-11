# Execution evidence

Checked on 11 October 2026 against the local source changes for this audit. Hosted generation is mocked. Five real-photo selection cases pass with the packaged native models locally. A separate strict crowded-floor selection case fails. No live Studio evaluation or provider comparison was requested by the test commands.

## Automated checks

| Check                    | Result                                          | Scope                                                                                                                        |
| ------------------------ | ----------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `npm run check`          | Passed                                          | Application types, test/Worker types, lint, formatting, offline domain/service/Worker tests and localized strings            |
| Domain tests             | 642 passed                                      | Existing 622 tests plus 17 cross-feature journeys and 3 plan-date/missing-look regressions                                    |
| Service and Worker tests | 131 passed                                      | Existing 29 Worker tests plus 63 scene/crop contracts, 19 app transport, 10 notification/export, 7 retailer and 3 native storage cases |
| `npm run test:vision`    | 23 passed                                       | Compiled production Swift garment regions, cutout repair, Studio background and upload-input preparation with synthetic maps/pixels         |
| `npm run test:photos`    | 5 passed                                        | Actual local parser/selector, cutout crop and Studio input on four licensed photographs: head scarf, hanging trousers/jacket, worn blazer/jeans |
| `npm run test:photo-gaps` | 1 failed                                        | Strict crowded-floor selection includes adjacent garments; this remains an open quality gate |
| Domain coverage          | 98.21% lines, 91.42% branches, 91.40% functions | Loaded domain files only; UI, services, native parser and Worker coverage are not included in these percentages              |
| Fresh iOS Release build  | Passed                                          | `xcodebuild` with the current source, iOS simulator target                                                                   |
| Studio input preview     | Six prepared cases                              | Request and input hashes recorded locally; no inference                                                                      |

The total is 801 passing automated tests, including 150 added during this audit, plus one retained failing real-photo quality test. This is not an all-green photo quality claim. Lint reports two existing unused-import warnings in `src/domain/importing.test.ts`; changed files pass without warnings. The coverage command enforces an 80% minimum for lines, branches and functions in its domain scope.

The ordinary HTTP, HTTPS, socket and fetch APIs are disabled by `scripts/tests/no-network.mjs` in `npm run test:offline`. Service tests replace platform/native modules, and Worker tests replace inference with deterministic responses. This guard protects the ordinary test code from accidental network calls; it is not an operating-system network sandbox.

`npm run check` also passed with `worker/studio/node_modules` temporarily removed and restored afterwards. The root development dependencies provide the test runner and Worker types, so checking the app does not require a separate Worker installation. Install the root lockfile with `npm ci` before using the commands below.

## Simulator evidence

The fresh Release build runs on the dedicated `Almari Systems QA` iOS 27.0 simulator. The runner injects a Studio fixture before each flow, including success, offline and failure fixtures, so pressing Enhance does not call a provider. Selected runtime flows are recorded below after execution. The remaining existing simulator flows are mapped in [user stories](user-stories.md), and their presence is not a current-build pass claim.

| Flow                          | Result | Behavior                                                                                                |
| ----------------------------- | ------ | ------------------------------------------------------------------------------------------------------- |
| `system/capture-link.yaml`    | Passed | Invalid input hides Add; a valid URL exposes it without fetching the retailer                           |
| `system/custom-lists.yaml`    | Passed | Rename survives reopening; confirmed removal empties the custom list                                    |
| `system/statistics.yaml`      | Passed | Owned counts and wear history appear; the most-worn row opens the correct garment                       |
| `system/date-first-plan.yaml` | Passed | An empty weekly slot saves the exact outfit; the filled preview opens it; date persists after reopening |
| `capture/studio.yaml`         | Passed | Fixture generation selects the resulting image and retains it after reopening the import                                            |
| `capture/studio-offline.yaml` | Passed | Offline generation shows recoverable failure                                                            |
| `piece/studio.yaml`           | Passed | Upload notice precedes the request; an existing piece selects the fixture result                        |
| `piece/cutout.yaml`           | Passed | Native long press selects the catalogue garment; Done returns to editing                                |
| `build-look/fill.yaml`        | Passed | Filling a partially selected outfit enables save                                                        |
| `looks/plan.yaml`             | Passed | Conflict confirmation replaces the plan; clearing its date restores unplanned state                     |
| `change-piece/swap.yaml`      | Passed | Interactive hero garments open the swap control; a replacement applies and the control closes           |
| `system/plan-deep-link.yaml`  | Passed | Missing/impossible dates recover; cold-launch planning returns to Looks; assignment survives reopening  |
| `system/group-failed-recovery.yaml` | Passed | A failed grouped garment opens recovery with its error and enabled Retake/Remove; cancelling retains all three parts |

Ninety-four distinct simulator flows passed across the audit builds, including one reduced-motion reset setup flow. The 35-flow capture/scanner/recovery set is recorded in [capture execution](capture-paths.md); two Studio flows overlap the earlier audit count. These are passes across multiple runs, not one successful run of the entire suite. The full 24-flow outfit/builder/Looks batch, its initial failures and corrected reruns are recorded in [outfit execution](outfit-paths.md). Missing-date planning crashed the earlier build; the rebuilt deep-link flow now passes invalid-date recovery, return navigation and reopened persistence. Weekly planning and same-day replacement/clear were rerun after this repair. Native long-press selection and Done were rerun after the scarf-cap repair and selector constructor refactor; [the rebuilt editor screenshot](screens/system/native-cutout-selector.png) records that catalogue-garment flow. Screenshots are saved under `docs/qa/screens/system/`, `docs/qa/screens/outfits/` and `docs/qa/screens/capture/`. Grouped-failure recovery was proved failing before the repair and passing on the rebuilt app. Capture and scanner execution, media isolation and corrected automation expectations are recorded in [capture execution](capture-paths.md). All 29 piece/closet flows and the new native tool/recovery flow passed across their baseline and corrected reruns, adding 28 distinct flows after two overlaps. Their [execution report](piece-closet-paths.md) records the database/language isolation repairs, stale assertions, full rerun outcomes and the loose-tunic mask regression caught by visual review. Two cutout flows now also require six landmarks in the actual saved PNG, with source/cutout hashes recorded; those landmark checks are not six additional feature tests.

## Reproduce without inference

```sh
npm run check
npm run test:offline -- --coverage
npm run test:vision
npm run test:photos
npm run test:photo-gaps
node --import=./scripts/tests/no-network.mjs --import=tsx scripts/studio-eval.ts
DEVICE='Almari Systems QA' bash scripts/e2e.sh .maestro/system
```

`test:vision` and `test:photos` need macOS/Xcode; the photo suite also needs the packaged `ClothesParser.mlmodelc`. The preview needs ImageMagick. Simulator tests need a compatible installed iOS runtime and Maestro. The default Studio preview writes to ignored `planning/build/studio/crop-eval/preview/`, separately from historical outputs. Only the explicit `--live` flag permits hosted inference.

## What these results cannot establish

The crop matrix represents ten scene types with synthetic image headers and owner descriptions. It verifies the production request/prompt contract, not model recognition or reconstructed garment fidelity. Synthetic native tests verify downstream selection and repair; five additional real-photo selection cases verify local selection at reviewed landmarks, cutout cropping and input preparation. A separate crowded-floor case fails its strict exclusion landmarks. Their [evidence and limits](native-photos.md) include repaired scarf-cap and blazer/top defects, a corrected tap annotation, raw parser category mismatches and the unresolved crowded-floor failure. Four native input cases exercise the extracted production Core Image helper: small opaque references retain their dimensions/colour, transparent cutouts become white while large openings remain, shifted/rotated references retain aspect ratio within 500 pixels, and empty inputs are rejected. JPEG encoding preserves the prepared dimensions. A fifth preparation test checks top-left cutout bounds and source orientation through the extracted production crop helper. These checks cover input preparation, not provider fidelity or file-storage failures. Simulator Studio success copies a fixture image, rather than synthesizing a new one.

Historical catalogue-like scarf, trousers and blazer output pairs were inspected locally. They show recoverable silhouettes and visible shadows, but lack reliable per-output request metadata and do not supply the requested full floor/hanging/head/body corpus. A current, provenance-aware visual comparison is still missing. No claim that every crop can be reconstructed correctly, or that one provider is the most reliable, follows from these results. The [analysis](system-analysis.md) specifies the missing corpus and review criteria.

Physical camera behavior, broad on-device parser accuracy, real share sheets, actual notification delivery, complete large-text/VoiceOver task completion and the entire existing simulator suite still require separate runtime evidence. No live generation, provider migration or deployment occurred in this audit.
