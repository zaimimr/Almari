# Live Studio photograph review

Initial batch, 11 October 2026, after explicit approval for the 20 prepared requests. All 20 were attempted once against the configured live service: 17 returned decodable 1024-by-1024 images and three returned HTTP 502. No retries, deployment or provider change were performed in that batch. This is one batch on one service, not a provider comparison or an acceptance-rate estimate.

The user accepted the nine results initially marked for owner review and confirmed the eight failures. Final batch result: nine accepted images, eight rejected images and three HTTP errors. The local [crop report](native-photos.md) remains separate: all ten original selection landmarks pass, while 12 of 56 extended crop variants fail.

## Input dimension recovery

The later 20-case run on deployment `31a07d09-455b-44b6-b82c-4b1e37eed137` returned 17 images and the same three fragment failures. A live Worker log identified `AiError: 3030: Invalid input image[0]: Image width must be at least 64 pixels and height at least 64 pixels`. The three inputs measured 34-by-150 (teal scarf), 72-by-54 (floor trousers) and 62-by-150 (floor jacket). These errors were input validation failures, not transient outages or content rejections.

Native and web preparation now centre references on white padding when either side is below 64, preserving fabric scale and proportions. Worker validation rejects known undersized dimensions before inference. The evaluation harness applies the same padding, records failure latency and continues through failed cases. The Worker still bounds retries for transient provider failures.

Deployment `542fc502-cffc-471e-b0f7-ebd067d3f5c1` uses the same Klein 4B model. All three padded fragments returned HTTP 200 and decodable 1024-by-1024 images: floor trousers in 8.4 seconds, floor jacket in 8.5 seconds and teal scarf in 14.2 seconds. Local records and comparisons are under `planning/build/studio/crop-eval/improvements/padded-recovery/`; the earlier repeated batch is under `deployed-recovery-20261011/`. Paid evaluations remain authorized by the user.

This verifies recovery of these three dimension failures, not overall visual fidelity. The new floor trousers lose their washed texture; the floor jacket changes length and pocket construction. New outputs have not received owner acceptance. The initial acceptance table below remains historical evidence for its original batch.

## Results

| Selection                      | Full selection                                                                                                                            | Central fragment                                                                                     |
| ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Head-wrapped scarf             | Failed: adds a hand across the face opening.                                                                                              | Failed: olive/taupe fabric becomes pale ivory.                                                       |
| Folded hanging trousers        | Failed: includes a wooden clamp hanger.                                                                                                   | Failed: includes the source clamp hanger and its lettering.                                          |
| Hanging dark jacket            | Failed: visible coarse fabric becomes a smooth hooded coat.                                                                               | Failed: becomes a smooth bomber with ribbed collar/cuffs, materially different from the full result. |
| Worn white blazer              | Accepted by user visual review.                                                                                                           | Accepted by user visual review.                                                                      |
| Worn blue jeans                | Accepted by user visual review.                                                                                                           | Accepted by user visual review.                                                                      |
| Crowded floor trousers         | Failed: mottled, washed denim becomes relatively plain charcoal jeans. Neighbors are excluded.                                            | HTTP 502, no output.                                                                                 |
| Teal scarf on a display rail   | Accepted by user visual review.                                                                                                           | HTTP 502, no output.                                                                                 |
| Pastel scarf drying on a line  | Accepted by user visual review.                                                                                                           | Accepted by user visual review.                                                                      |
| Red paisley scarf on a display | Accepted by user visual review.                                                                                                           | Accepted by user visual review.                                                                      |
| Long black floor jacket        | Failed: drawstring retained and neighbors excluded, but a shorter jacket, chest pocket and altered panel/pocket layout are reconstructed. | HTTP 502, no output.                                                                                 |

Full selections returned ten images, with five clear failures and five accepted results. Fragments returned seven images, with three clear failures and four accepted results, plus the three service failures. Successful request latency was 6.1 to 36.2 seconds, median 8.3 seconds. Those times cover the request and output download, not the local comparison rendering. Failed-request latency was not captured by the original harness.

The user confirmed: "the owner review looks good. the failed are really failed". Acceptance records that visual judgment for this batch. The eight rejected images retain their observed hand/hanger, fabric and construction failures. Complete pixel annotation and hidden construction were not measured; the original preliminary notes remain in the local review metadata.

## Provenance

Each request used exactly the approved preview's selected/original image bytes and parameters. The full case uses the actual native prepared selection; the fragment uses its central 40 percent by 30 percent, with corresponding source location. Inputs are at most 500 pixels. Source hashes, input hashes, output hashes, request timestamps, successful latency and failure statuses are saved locally.

The active deployment was `cea93c93-eb62-42be-b1c1-20b589741658`, created `2026-10-10T23:31:26.364452Z`. Its configured model is `@cf/black-forest-labs/flux-2-klein-4b`, and its code requests 1024-by-1024 output. No explicit seed is supplied; the provider's internal model revision and billed usage were not measured.

The deployed bundle was fetched read-only through Cloudflare's [script-content API](https://developers.cloudflare.com/api/resources/workers/subresources/scripts/subresources/content/methods/get/). Its SHA-256 is `b8c3264b3a43214eabe2b04b4fec0c2f391f627243f42626295c1317373f42ea`. Its actual request parser and prompt function were evaluated locally against each recorded multipart input. The sanitized local and deployed prompt text match for all 20 cases. The original unsanitized preview prompt hash matches only four: the server replaces semicolons in the other 16 scene notes with spaces. Separate deployed-prompt hashes and text now record that difference. These hashes are reconstructed from the downloaded deployment, not returned by the inference server.

## Local artifacts

Artifacts are ignored under `planning/build/studio/crop-eval/real-photos/`:

- `review.html`: filterable gallery of all 20 cases, with original, selection and generated image side by side.
- `manifest.json`: all 20 attempts, input/output hashes, deployment and prompt provenance, latency summary and review classifications.
- `review.json`: per-case visual findings.
- `<case>-compare.jpg`, `<case>-result.jpg`: 17 comparisons and outputs.
- `<case>-request.json`, `<case>-deployed-prompt.txt`: every request's metadata and reconstructed deployed prompt.

The approved preview stays in `planning/build/studio/crop-eval/preview/real-photos/`. The first command stopped after the twelfth request's HTTP 502; the remaining eight previously unattempted cases ran individually. All 20 preview records were reconciled against the live records. No case was resent. The floor jacket, teal scarf and crowded-floor fragment failures have no result image.

The gallery is local because its sources and derivatives have different licences, recorded in the [photo manifests](native-photos.md). No generated output was added to a closet or substituted for an original. This run confirms that the current service can still add body parts/props and change garment identity despite the prompt. It does not validate loose floor or outfit-draped hijabs, additional independent fabrics/scenes, exact hidden construction, physical-device behavior or another provider. Prompt-only adherence remains insufficient evidence of fidelity.
