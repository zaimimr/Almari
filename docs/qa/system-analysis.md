# Almari system and user expectations

11 October 2026. Source baseline: `d632496`. This is a code audit and desk research, with local regression execution. It is not a usability study, production telemetry analysis, or a measured provider shootout. The [story inventory](user-stories.md) distinguishes coverage from remaining evidence; [validation](validation.md) records executed checks.

## What users are trying to accomplish

The central job is deciding what to wear from clothes they really own. Capturing clothes is setup work needed for that decision. If indexing takes too long, misidentifies a scarf, or produces a different garment, the rest of the product loses its value. The user's existing complaints about missing fabric and redesigned Studio clothes are direct evidence for Almari. Requirements about other users below are informed hypotheses, not measured demand percentages.

Jiang and Macintyre's 2025 study examined 27 wardrobe apps and 5,953 reviews. Users reported increased use of existing clothes, less overconsumption and reduced decision burden; complaints included monetization barriers. These are self-reported review themes, not causal evidence or Almari adoption rates. The paper notes self-selection, English-language-only reviews and missing demographic comparisons. That limits its applicability to Bokmål users and culturally specific wardrobes. The publisher blocked retrieval, but a full-text copy of the original paper was inspected. [Original publication](https://www.mdpi.com/2071-1050/17/9/4159), [full-text copy](https://www.wisdomlib.org/uploads/journals/mdpi-sust/2025-volume-17-issue-9--2071-1050-17-9-4159-.pdf).

Whering advertises photo/database/retailer imports, wardrobe search, suggestions, planning and packing. Its suggestion documentation describes personal-style and weather-aware choices. These set a competing-product baseline, rather than proof that every advertised feature works well. [Product overview](https://whering.co.uk/how-it-works), [suggestions](https://whering.co.uk/faq/outfit-suggestions-on-Whering).

Indyx recommends complete unfolded item photographs without hangers, mannequins or other garments, and explains that colour, drape and pose affect how useful a digital wardrobe feels. Its image guidance illustrates the difficult part of Almari's promise: supporting floor, hanging and worn references asks the system to recover the product view from inputs that a competitor explicitly discourages. [Image standard](https://www.myindyx.com/blog/our-image-standard-and-cataloging-tips).

| User situation                              | Expected outcome                                                        | Unacceptable failure                                                                            | Measure to collect                                                 |
| ------------------------------------------- | ----------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| Digitizing an existing wardrobe             | Batch capture, quick corrections, faithful recognizable photos          | Re-photographing everything or a crop that loses half the item                                  | Time per accepted item, correction/retake rate, abandoned sessions |
| Loose, worn or wrapped hijab                | One scarf, correct fabric/border, no face/body                          | Scarf becomes a top, duplicated scarf, invented stitched opening                                | Acceptance by scene and scarf construction                         |
| Mixed western/Desi wardrobe                 | Culturally correct combinations using known pieces                      | Interchanging kameez, kurta, dupatta and ordinary western roles without compatible construction | Hard-rule violations and wearer preference, separately             |
| Coverage-conscious dressing                 | Confirmed sleeve/hem/opacity constraints and optional hijab preferences | Guessing a sheer item is opaque or overriding a coverage preference                             | Coverage violation rate, unknown-field frequency                   |
| Leaving for work or school                  | A usable outfit with few decisions                                      | Laundry items, things not owned, unexplained missing pieces                                     | Suggestion-to-wear rate and time to decision                       |
| Event or week planning                      | Exact outfit/date, conflict warning and change/undo                     | Quiet replacement, wrong day, lost custom name                                                  | Plan-save success, unintended replacement reports                  |
| Different size/accessibility/language needs | Reachable controls, readable labels, English/Bokmål                     | Trapped sheets, clipped actions, silent state changes                                           | Task success with large text and VoiceOver                         |
| Maintaining a valuable closet               | History, correction, export and recovery                                | Lost photographs, corrupt save, reset mistaken for sign-out                                     | Recovery success and export completeness                           |

Do interviews around completed tasks: have a user add three difficult garments, correct one crop, choose tomorrow's outfit, remove an unwanted layer, and plan an event. Observe intervention count and whether they recognize each image as their own garment. Include people with and without hijab, several scarf fabrics, western/Desi/mixed wardrobes and accessibility needs. Treat this as a proposed research protocol; no interviews were conducted here.

## Current architecture and feature boundaries

The Expo Router application has 31 non-layout route files. UI and hooks live under `app/` and `src/features/`; pure rules and persisted transformations live under `src/domain/`; side effects live under `src/state/` and `src/storage/`. The Swift Expo module owns camera scanning, local clothing parsing, subject masks, crop editing, image preparation and background processing.

`ClosetRepository` serializes transformations and publishes a snapshot only after storage writes succeed. This is the foundation for reliable save/retry flows. Files are stored separately from closet JSON, so a correct JSON round-trip does not prove photographs remain readable. `filesInUse`, orphan cleanup and `repairPhotos` address references; they still need disk-level execution evidence.

Capture jobs progress through queued, preparing, ready/review and failed. Automatic garment/attribute proposals are separate from owner confirmation. Outfit photos can split into regions; individual imports can be corrected, retained as a set, retaken or discarded. The final piece can preserve original, plain cutout, enhanced cutout, Studio and normalized crop location. A late result must not recreate a removed target.

Outfit generation is deterministic locally: `styleOutfits` builds candidates, enforces construction/coverage/style/availability constraints and ranks them with the rule scorer and taste context. Studio image generation is separate. Testing outfit creation does not require an image provider, and a prettier Studio photo must not overwrite garment metadata used by the rules.

Today has everyday, occasion and tomorrow sessions, with revisions to reject stale edits. The manual builder pins selected items and explains incompatible sets. Saved looks are exact item sets, not instructions to create a similar outfit. One saved look has one `plannedFor` date; assigning a second look to that day clears the previous assignment. Moving a look moves its one date. Repeated scheduling of the same look on several days is not represented by this schema. That is a product limitation to discuss before promising recurring weekly outfit plans.

Wear feedback, calendar and statistics are derived from logged events; undone events should disappear from counts. Reminders are local device notifications, serialized and rebuilt after context changes. Export creates a folder, archives it through the native module and invokes the share sheet.

Simulator execution exposed a planner navigation edge case: opening `almari://looks/plan?date=2026-10-12` as a root deep link saves the assignment and checks the row, but stays on the picker because `router.back()` has no history. The normal weekly-planner entry is tested separately. Code inspection also shows that this route trusts its `date` parameter, and `setPlannedFor` accepts any string; malformed external dates need boundary validation before deep-link planning can be considered hardened.

The same test exposed a production touch bug in filled weekly tiles: passive `FlatLay` garment pressables intercepted the enclosing tile's tap. Empty tiles worked while filled ones appeared unresponsive. Passive garment previews now disable their own pointer handling, allowing the enclosing tile to open the saved look; hero garments with actions retain their touch handling. The planner journey and interactive swap flow verify this boundary on the rebuilt app.

## Studio pipeline and what can go wrong

`studioSource` prefers the plain cutout, then the preserved original, then the current photo for owned pieces. Imports prefer prepared cutout or original. `studioForm` prepares the selection and, when distinct, the uncut source as separate images; it includes normalized location, name, colour, note and confirmed construction details. Native preparation applies orientation, scales the longest edge to 500 pixels, repairs small alpha holes and composites on white. The original remains available for subsequent generations.

The Worker validates request metadata, reference dimensions and basic image headers, constructs the prompt, forwards multipart references to Klein 4B and returns image bytes. The app uses a 45-second abort deadline and attempts local white-background removal. If cleanup cannot create a useful mask, it retains the raw photograph. Tests now reject empty or non-image successful HTTP responses before the app saves them.

The prompt prioritizes owner corrections over guessed type, name/colour and apparent cropped outline. It requests complete garment reconstruction using both references, faithful design, a white square product view, no body/mannequin/hanger and no added details. These are instructions to a stochastic model. The prompt contract can pass while an output still shortens trousers, invents buttons, changes transparency or retains a shadow.

The requested universal crop guarantee has an information limit: the source and description cannot reveal genuinely invisible embroidery, a hidden reverse side, the true length of a wrapped scarf or whether an unseen sleeve is attached. Correct behavior is to preserve visible evidence, let an owner supply missing facts, and keep original/manual recovery available. A system that confidently invents those facts has failed fidelity even if its result looks polished.

Important failure distinctions:

| Failure                                                | Current mitigation                                             | Remaining evidence or gap                                                         |
| ------------------------------------------------------ | -------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| Bad crop removes a sleeve, hem or scarf end            | Separate uncut reference plus location and owner details       | Real worn/head/hanging cases with reviewed outputs                                |
| Wrong detected category                                | Owner name/note/confirmed details override guess               | Visual category fidelity, not only prompt text                                    |
| Wrapped scarf confused with face/upper garment         | Manual selection now retains cap labels; exclude person in prompt | One real head photo passes fabric/face/hand landmarks; complete mask and Studio output unreviewed |
| White/pale/translucent material merges with background | Border flood-fill, colour distance, raw fallback               | Thin lace, sheer chiffon, white-on-white edge fidelity                            |
| 500-pixel reference loses embroidery detail            | Original and selection give context/detail at different scales | Measure recognizability and detail retention before raising model expectations    |
| Result arrives after view/target changes               | Revision and target checks in application transformations      | Cancellation/unmount races need UI runtime execution                              |
| Repeated Studio uses a generated reference             | Preserved original and plain-cutout source                     | Existing legacy Studio-only data has weaker provenance                            |
| Unexpected HTTP 200 JSON/HTML/empty data               | New app response regression and validation                     | Full image decoding remains a separate check                                      |
| Concurrent calls exceed the intended daily limit       | KV counter is best effort                                      | Atomic quota, request reservation, idempotency and server-side timeout are absent |

KV is eventually consistent and not a transactional compare-and-swap counter. From the current read/generate/write code, two requests can read the same count and both spend inference while writing the same increment. Failures count as no successful image but may still incur provider work. The static public application token is not a per-user authorization boundary. These are findings from code, not evidence of observed abuse. [KV consistency guidance](https://developers.cloudflare.com/kv/concepts/how-kv-works/).

## Provider costs and recommendation

Keep Cloudflare Klein 4B as the current low-cost baseline. It is the cheapest priced hosted option verified here for this request shape, but its superior reliability is unproven. Do not switch providers on marketing fidelity claims alone.

Cloudflare lists $0.000059 per input 512×512 tile and $0.000287 per output tile for 4B. With two one-tile references and four output tiles, inference is approximately `2 × 0.000059 + 4 × 0.000287 = $0.001266` per attempt. At that shape, 10,000 attempts are about $12.66 before free allowance, Workers/KV costs, failures and retries. Its published 10,000-neuron daily allocation and 114.94 neurons for this shape imply roughly 87 attempts per day if no other model consumes the allowance. This is a calculation, not billing measured from Almari's account. [Inference pricing](https://developers.cloudflare.com/workers-ai/platform/pricing/).

| Candidate                   | Published pricing checked today                                                           | Decision for Almari                                                                                    |
| --------------------------- | ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Cloudflare Klein 4B         | About $0.001266 for the current two-reference/1024-square shape                           | Cost baseline; no new paid comparison performed                                                        |
| Cloudflare Klein 9B         | $0.015 for first output MP, $0.002 for subsequent output MP; input charges also published | Compare only if its accepted-image rate compensates for added cost; no evidence here that it does      |
| BFL direct Klein 4B         | Starts at $0.014; reference/additional-MP charges depend on request                       | More expensive baseline; higher reference-detail support needs a same-corpus measurement               |
| fal Klein 4B edit           | Current model page advertises $0.01 per MP                                                | More expensive listed baseline; confirm reference billing in a quote before exact totals               |
| Replicate Klein 4B          | Model exists, but inspected page did not expose a usable current price                    | Price and quality not ranked                                                                           |
| Gemini 3.1 Flash Image      | Standard 1K image output about $0.067, plus input/text costs                              | Far above baseline; evaluate difficult reconstruction only if it wins fidelity                         |
| Gemini 3.1 Flash Lite Image | Standard 1K image output about $0.0336, plus input/text costs                             | Cheaper Google challenger, still substantially above baseline                                          |
| Local cutout/manual repair  | No hosted inference                                                                       | Most faithful option when no new view needs reconstruction; still has processing and user-effort costs |
| Self-hosted Klein 4B        | Open weights; hosting, memory, uptime and operations determine cost                       | No cost advantage established at this app's current volume                                             |

Pricing sources: [Cloudflare](https://developers.cloudflare.com/workers-ai/platform/pricing/), [BFL costs](https://help.bfl.ai/articles/7986977817-what-are-the-costs-associated-with-using-your-models), [fal edit](https://fal.ai/models/fal-ai/flux-2/klein/4b/edit), [Replicate model](https://replicate.com/black-forest-labs/flux-2-klein-4b), [Google pricing](https://ai.google.dev/gemini-api/docs/pricing). These are indicative request prices, not a ranking of photographed garment fidelity.

Cloudflare's launch documentation describes fixed four-step inference, four reference slots and input images smaller than 512×512. The app's 500-pixel preparation fits that restriction; the Worker currently accepts 512, which should be checked against actual provider behavior before advertising the boundary. [Model launch and reference contract](https://developers.cloudflare.com/changelog/post/2026-01-15-flux-2-klein-4b-workers-ai/).

For total cost, add the Workers Paid account minimum where applicable, published as $5 per month, plus relevant request/storage usage. Shared infrastructure can make this an incremental rather than dedicated charge. [Workers pricing](https://developers.cloudflare.com/workers/platform/pricing/).

Self-hosting is not equivalent to zero cost. BFL describes commercially usable Apache-2.0 4B weights and approximately 13GB VRAM for its documented setup. Quantized variants need their own measurements. That does not establish a reliable iPhone deployment. [Local deployment guidance](https://help.bfl.ai/articles/7592221790-how-do-i-generate-quickly-with-flux-2-klein).

Optimize cost per accepted image: `(all billed attempts + attributable hosting + manual correction cost) / accepted faithful photos`. At a hypothetical 60% acceptance rate, 4B's inference-only cost becomes about $0.00211 per accepted image. At 90% acceptance, a $0.01 attempt becomes about $0.01111. Those are scenarios, not observed rates. Compare latency, retry rate and hard fidelity failures separately so that a cheap but wrong photo cannot win the decision.

Cloudflare states that Workers AI content is not used to train or improve models/services without explicit consent, and that content may be stored when storage services are used. The current application sends the uncut reference when necessary, which can include an entire outfit/person. Describe that upload accurately and retain a local/manual option. This policy is not a guarantee of on-device processing. [Data usage](https://developers.cloudflare.com/workers-ai/platform/data-usage/).

## Test strategy without inference charges

`npm run test:offline` runs domain and mocked service/Worker tests with ordinary HTTP, HTTPS, socket and fetch calls blocked. Mocked inference is local. `npm run test:vision` compiles the actual mask/background/repair Swift implementations on macOS and executes pixel-level synthetic tests. `scripts/studio-eval.ts` now prepares inputs/prompts by default; only explicit `--live` enables inference and loads provider credentials.

The 10-scene request matrix covers loose floor, hanging, outfit-draped and head-wrapped hijabs; floor/hanging/body trousers; and floor/hanging/body jackets. Each has five crop shapes and original-only fallback. It uses image headers and scene descriptions to test transport/prompt behavior, not actual scene understanding. Synthetic native cases test downstream algorithms using segmentation maps and RGBA pixels. `npm run test:photos` additionally runs the packaged parser and actual selector on two licensed photographs. The headscarf case exposed a cap-label omission, now repaired; hanging trousers pass selection despite a raw parser dress prediction. These [landmark results](native-photos.md) do not establish complete mask or reconstruction accuracy. App fixtures copy a source photograph to simulate success; that proves interaction states, not generation.

Historical cached crop comparisons are locally available in ignored `planning/build/studio/crop-eval/`. Inspected scarf, trousers and blazer comparisons recover complete silhouettes from fragments, but contain visible cast shadows. Their sources are catalogue-like assets, not a complete floor/hanging/head/body corpus. The cache has no reliable per-result request hash and generation metadata, so it cannot establish current prompt quality or current-provider reliability. Default dry runs intentionally do not refresh outputs.

For a proper visual gate, freeze consented sources, normalized crop areas, owner-confirmed facts, input preparation, model/version, prompt hash, seed where supported, latency, request count and billable usage. Include at least three fabrics/colours per scene, severe crops, multiple nearby garments, white-on-white, dark-on-dark, occlusion, mirrored/rotated references, sheer fabric and intentional openings. Each cached output must have a human review of type, full outline, colour, transparency, construction/details, person/background exclusion and recognizability. A request test does not substitute for that review.

Suggested release targets, to be validated with users: zero hard category/body/fabric-detail substitutions in the frozen critical corpus; at least 95% first-attempt acceptance overall with no scene group hidden by an average; p95 latency below the app deadline; explicit recovery for every failed case. These are proposed gates, not achieved metrics. Keep missing/unreviewed cases visibly missing. New live measurements are outside the requested no-spend test loop.

## Priorities from the audit

1. Preserve garment identity, originals and confirmed facts through crop/Studio/regeneration. New integration regressions cover this across imports and saved pieces.
2. Preserve exact outfit selections through save/plan/show/wear/reopen; respect laundry, ownership, hijab, coverage and manual exclusions. Existing rules plus new journeys cover these contracts.
3. Execute the current UI paths, fill the named simulator gaps, and repair stale test expectations before declaring feature coverage complete.
4. Build provenance-aware cached visual evidence for head/hanging/body cases. No universal photo guarantee or provider superiority claim is currently justified.
5. Measure user task completion and accepted-image cost before a provider change. Consider an atomic quota and idempotency if Studio volume grows; no provider or deployment was changed in this audit.
