# Live Studio photograph review

11 October 2026, after explicit approval for the 20 prepared requests. All 20 were attempted once against the configured live service: 17 returned decodable 1024-by-1024 images and three returned HTTP 502. No retries, deployment or provider change were performed. This is one batch on one service, not a provider comparison or an acceptance-rate estimate.

Visual comparison of all 17 outputs found eight clear failures and nine results requiring owner review. None is certified as a complete fidelity pass. The local [crop report](native-photos.md) remains separate: all ten original selection landmarks pass, while 12 of 56 extended crop variants fail.

## Results

| Selection                      | Full selection                                                                                                                            | Central fragment                                                                                     |
| ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Head-wrapped scarf             | Failed: adds a hand across the face opening.                                                                                              | Failed: olive/taupe fabric becomes pale ivory.                                                       |
| Folded hanging trousers        | Failed: includes a wooden clamp hanger.                                                                                                   | Failed: includes the source clamp hanger and its lettering.                                          |
| Hanging dark jacket            | Failed: visible coarse fabric becomes a smooth hooded coat.                                                                               | Failed: becomes a smooth bomber with ribbed collar/cuffs, materially different from the full result. |
| Worn white blazer              | Owner review: body-shaped presentation, bent sleeves and uncertain trim/lining.                                                           | Owner review: strong dark lapel piping and changed sleeve arrangement.                               |
| Worn blue jeans                | Owner review: lower legs are absent from the source; exact wash, width and length remain unverified.                                      | Owner review: wash, stitching and complete leg shape remain unverified.                              |
| Crowded floor trousers         | Failed: mottled, washed denim becomes relatively plain charcoal jeans. Neighbors are excluded.                                            | HTTP 502, no output.                                                                                 |
| Teal scarf on a display rail   | Owner review: teal identity retained and neighbors excluded; shade, weave, tag and length remain unverified.                              | HTTP 502, no output.                                                                                 |
| Pastel scarf drying on a line  | Owner review: selected pastel palette retained and neighbors/clothesline removed; dye layout, weave and opacity need confirmation.        | Owner review: more regular, saturated colour blocks; exact dye layout and texture need confirmation. |
| Red paisley scarf on a display | Owner review: red paisley identity retained and orange/blue neighbors excluded; exact motif/repeat fidelity needs confirmation.           | Owner review: red paisley identity retained; exact print geometry and dimensions need confirmation.  |
| Long black floor jacket        | Failed: drawstring retained and neighbors excluded, but a shorter jacket, chest pocket and altered panel/pocket layout are reconstructed. | HTTP 502, no output.                                                                                 |

Full selections returned ten images, with five clear failures and five owner-review results. Fragments returned seven images, with three clear failures and four owner-review results, plus the three service failures. Successful request latency was 6.1 to 36.2 seconds, median 8.3 seconds. Those times cover the request and output download, not the local comparison rendering. Failed-request latency was not captured by the original harness.

A clear failure requires an observable contradiction, such as a hand or hanger, changed visible fabric, or unsupported garment construction. Uncertain colours, trim, print geometry and parts absent from the source are marked for review rather than accepted. Missing ground truth is not a quality pass. This is a preliminary visual review, not owner acceptance or complete pixel annotation. Several outputs also have shadow-like edge/background shading; a plain white canvas does not establish adherence to the no-shadow instruction.

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
