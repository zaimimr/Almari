# Model and platform research

Checked 30 September 2026 against the primary sources linked below. These are documentation findings and proposed experiments. No candidate has been installed, benchmarked, or integrated into this project.

## Jev

TypeSafe documents Jev as a hosted model for typed judgments. Its primitives include Choice, Score, and Noul, with probabilities and, for Choice and Score, confidence. It recommends evaluating narrow factors separately and combining them in application logic. [Official documentation](https://docs.typesafe.ai/introduction).

Proposed role: rank already valid outfit combinations for occasion, aesthetic coherence, and learned preferences. Compare it against a deterministic baseline and a general model on the same candidate sets. A typed output or confidence score does not establish correctness on modest-fashion tasks.

Keep coverage enforcement, ownership checks, and unavailable-item exclusions in code. Use an attributes-only payload where possible. Verify retention terms and runtime costs before sending personal preferences. Do not assume an on-device Jev release exists.

The gate is improved user preference ratings at acceptable latency and cost. If it does not beat the baseline, leave the adapter unused.

## Cactus Needle 3

The user confirmed [Cactus Needle](https://cactuscompute.com/needle) as the intended reference. The vendor describes text-based tool calls, structured extraction, and text embeddings with model sizes around 8 to 29 MB. Current deployment documentation refers to `needle3.cact` and provides iOS device and simulator libraries. The user's remembered `.bin` filename should not be treated as the integration API.

Proposed experiment: translate commands such as Show my purple hijabs or Save this as Friday work into validated application actions. Test ambiguous references, negation, multi-step requests, unsupported commands, and Urdu or Arabic garment terms within English sentences. Do not assume the published tool-call benchmarks predict performance on this vocabulary.

Needle is not the image segmentation or vision model in this plan. Download size is also different from peak runtime memory. Measure cold start, peak memory, energy use, and parsing accuracy on a real target iPhone.

The [official repository](https://github.com/cactus-compute/needle) documents telemetry enabled by default and the switches `NEEDLE_TELEMETRY=0` and `DO_NOT_TRACK=1`. Verify how these apply to the embedded iOS library, then check network behavior. Validate model-originated actions before execution; never let a parsed action silently authorize an upload or account deletion.

## Apple Foundation Models

Apple's current iOS 27 documentation describes multimodal prompting with images and text, alongside on-device tools. This makes local garment analysis and reference interpretation candidates for evaluation, in addition to short grounded stylist explanations. [Current iOS capabilities](https://developer.apple.com/ios/whats-new/), [multimodal prompting](https://developer.apple.com/documentation/foundationmodels/analyzing-images-with-multimodal-prompting).

Check runtime model availability and locale/device eligibility. The app must handle missing downloads and unavailable models. Fall back to manual attributes, ordinary controls, and templates where possible. Any cloud fallback needs its own consent path. [Availability guidance](https://developer.apple.com/documentation/FoundationModels/generating-content-and-performing-tasks-with-foundation-models).

Evaluate garment terminology, fabric uncertainty, layering, and fidelity to the supplied closet data. Keep an evaluation suite because operating-system updates can change the underlying model. Avoid promising that all requests run locally until every selected capability is measured and configured that way.

## Apple Vision

Foreground instance masks can isolate subjects and support background removal. The API is a candidate for faithful garment cutouts. [Subject lifting](https://developer.apple.com/videos/play/wwdc2023/10176/), [foreground masking request](https://developer.apple.com/documentation/vision/vngenerateforegroundinstancemaskrequest).

Test black cloth on dark backgrounds, white cloth on white walls, lace, tassels, sheer fabric, hangers, multiple garments, and clothing worn by a person. Subject extraction and separating individual garments on a body are different problems. A good cutout does not identify opacity or fit.

## MobileCLIP

Apple publishes image/text representation models in its [MobileCLIP repository](https://github.com/apple-aiml-research/ml-mobileclip). This is a candidate for matching a reference's visual elements to stored garment images.

Compare retrieval against ordinary category, color, and silhouette filters first. Evaluate model variant, commercial license, conversion path, memory, and representation quality on the intended iPhone. Embedding similarity cannot establish coverage compliance or suitability for an occasion by itself.

## Expo and native integration

As checked today, SDK 57 is the stable Expo release while SDK 58 is in beta. SDK 57 includes React Native 0.86 and React 19.2. Its updated notes specify scene support for Xcode 27/iOS 27 builds, available through patched SDK 57 configuration. Choose and pin compatible current patches at implementation time. [SDK 57 notes](https://expo.dev/changelog/sdk-57), [release chronology](https://expo.dev/changelog?q=sdk).

Native Swift integrations can live behind local Expo modules. Keep these modules separate from generated native project files. Use a development build for real integrations. [Custom native code](https://docs.expo.dev/workflow/customizing/).

Expo UI supplies native controls, including SwiftUI and Compose components and a universal surface. Its host/layout boundaries matter when mixed with ordinary React Native views. It is a suitable component foundation to trial for forms, sheets, and settings. [Expo UI](https://docs.expo.dev/versions/latest/sdk/ui/).

## Proposed comparison protocol

Use one consented fixture set for all candidates. Freeze expected garment IDs, required coverage, and the user's intent. Separate correctness from preference:

| Task | Correctness check | Quality or cost check |
| --- | --- | --- |
| Cutout | Keeps the real garment, excludes background | Edge fidelity, color shift, correction time |
| Attribute extraction | Uses known fields and supports unknown values | Correction rate across garment traditions |
| Command parsing | Correct action, arguments, negation, and permissions | Latency and offline reliability |
| Retrieval | Returns owned IDs only | Human relevance among the first results |
| Ranking | Never bypasses eligible-candidate rules | Pairwise preference and suggestion variety |
| Explanation | Refers only to actual items and verified facts | Clarity, usefulness, and unsupported claims |

Record model version, prompt version, operating system, device, cold/warm latency, peak memory, failures, and metered cost. Test a provider switch with the same contracts before claiming it is easy to replace. No model selection is final yet.
