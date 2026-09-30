# Delivery packets and acceptance checks

Read with [the handoff](../../BUILD-PLAN.md). This is the execution order. Each packet delivers a working increment with honest limitations. Acceptance criteria below are requirements to verify, not claims that they already pass.

## 1. Working method

1. Inspect the current working tree, applicable project instructions, relevant memories, and the feature's existing code.
2. State the packet's assumptions, exact user task, and how success will be demonstrated.
3. Keep changes within that packet. Add only the capability boundaries needed by its implementation.
4. Implement the complete path, including empty, loading, denied, uncertain, cancelled, and failed states that apply.
5. Add meaningful domain tests for constraints, migrations, or asynchronous behavior. Avoid tests that merely repeat static UI markup.
6. Run the relevant checks and inspect the actual iPhone screen. A web screenshot does not establish native behavior.
7. Fix failures, rerun the affected check, and stop broadening verification once the concrete risk is resolved.
8. Save representative screenshots, record remaining limitations, and commit a logical increment under the hobby workflow.

Do not combine all packets into one large rewrite. D1 can be subdivided into reviewable commits while remaining one end-to-end milestone. Do not add a model just to make the product appear more advanced.

## 2. D0: Establish the baseline and prepare useful fixtures

**Outcome:** The next builder can distinguish working behavior, existing data, and proposed functionality.

**Tasks**

- Read the six specifications and inspect the actual package lock, app configuration, routes, repository, media handling, and screenshots.
- Run existing checks before modifying the app. Record pre-existing failures separately.
- Start the native app and verify the closet, manual builder, saved looks, and persistence.
- Capture the existing Today-equivalent entry, Closet, builder, and saved-look detail as before evidence.
- Inspect a copy of the current snapshot. Preserve it while implementing migrations.
- Audit the twelve sample items' actual categories and images. Add reviewed, explicit fixture metadata for D1; do not pretend uncertain attributes were inferred from a real owner's clothes.
- Decide the smallest fixture extension needed to exercise a dress-for-work request. An optional olive dress image and prompt are in `planning/fixtures`; neither is currently integrated.
- Keep at least one deliberate insufficient-wardrobe weather case. A sample wardrobe without suitable snow footwear should explain that gap.
- Preserve the one-time seeding behavior. Add any new fixture once through a versioned catalog change, never by resetting the closet.

**Likely touchpoints:** Existing domain tests, sample catalog, photo mapping, fixture metadata, implementation-status documentation. No framework replacement.

**Exit gate**

- Existing eight tests still pass, or an unrelated baseline failure is documented with evidence.
- Adding a fixture does not restore deleted samples or change existing IDs and saved looks.
- Sample and owned clothes are distinguishable in data and UI.
- The device/OS used for screenshots is recorded. A simulator is labeled as such.

## 3. D1: Make Today work with the sample wardrobe

**Outcome:** She can open a daily outfit, request another occasion, choose a garment type or exact pieces, and see a complete result she can change and save.

**Dependencies:** D0, approved Direction A. No cloud model, account, or automatic forecast is required.

### Implementation sequence

1. Extend the domain with the smallest versioned preference, request, attribute, and daily-result records. Migrate old snapshots without losing data.
2. Implement pure eligibility, role completion, and deterministic ranking functions against reviewed sample attributes. Keep a clear result type for ready, needs review, conflict, and insufficient evidence.
3. Add a compact everyday-default editor. Start with occasion, Desi/Western, and essential personal coverage choices. Do not invent her answers.
4. Add Today to the native and browser navigation and make it the entry route. Retain Closet and Looks.
5. Build the white garment composition and simple request summary using the shared flat lay and existing theme.
6. Add Everyday and Another occasion behavior. Temporary requests preserve the saved everyday preset and previous daily result.
7. Add structured garment-type selection and a multi-select Keep these pieces picker. Show all kept pieces in the live composition, with an accessible kept state.
8. Add manual warm/mild/cold, dry/rain/snow, and indoor/outdoor context. Manual weather is never described as a live forecast.
9. Generate a small useful set of distinct alternatives. Try another keeps exact items and requirements. Explain missing types or conflicts without changing them.
10. Add single-piece replacement using the same request engine. Keep all other IDs fixed, update the full composition, and support undo. D3 refines the hijab-specific ranking.
11. Allow saving and reopening the selected outfit through existing Looks. Preserve unsaved edits through navigation and interruption.
12. Validate all constraints again when applying a result. Ignore a late result belonging to an older request revision.

**Likely touchpoints:** `src/domain/closet.ts`, new focused domain modules/tests, `src/domain/repository.ts`, `src/state/closet.tsx`, platform storage decoders, `app/index.tsx`, `src/navigation/Tabs.native.tsx`, `src/navigation/Tabs.tsx`, a Today route, focused request/default feature components, and `src/ui/OutfitCollage.tsx` only where needed.

### D1 acceptance

- T01: The same local day's everyday result survives a restart. Try another changes the suggestion deliberately while respecting the request.
- T02: Changing to a party, selecting Desi, and changing weather does not mutate everyday defaults. Returning to Everyday restores its state.
- T03: “Blazer” selects an actual available blazer, or explains that none is available. A cardigan does not silently satisfy the requirement.
- T04: “Dress for work” includes a dress and any required layers. A dress over trousers remains possible when appropriate.
- T05: Choosing exact shoes and a bag keeps both IDs in every alternative. Repeat with one pair of trousers and with three or more selected items.
- T06: Incompatible kept items produce a recoverable conflict. The user chooses which constraint to release.
- T07: Desi and Western affect appropriate garment combinations while allowing shared shoes, bags, trousers, and hijabs.
- T08: Cold sun is treated as cold. Snow suitability is not inferred from a dark shoe color. Missing weather evidence stays visible.
- T09: Changing one item changes only that item. If a valid one-item change is impossible, the app explains this and offers a separately chosen broader restyle.
- T10: The whole outfit stays visible while selecting pieces, including a long garment and a hijab. Save/reopen uses the same item IDs and composition rules.
- T11: Empty closet, deleted kept item, unavailable item, insufficient roles, unknown attributes, and no further distinct alternatives have clear recovery actions.
- T12: No sample item appears as an owned recommendation. Fixture-only attribute assumptions never transfer to imported clothes.

**Stop gate:** She can complete blazer, dress, shoes-and-bag, and temporary-occasion tasks without technical explanation. Capture this as a usability observation, not a claim about styling quality with her real wardrobe.

## 4. D2: Make clothing capture easy

**Outcome:** Photograph a piece, review its prepared image and suggested category/name, then save it without routine typing.

**Dependencies:** D0/D1 storage discipline, [Photography](PHOTOGRAPHY.md), actual target-phone details before a native processing decision. Cloud consent is required before any personal image upload.

### Implementation sequence

1. Build the three short tutorial cards, replayable garment-specific help, and a camera/library entry using the specified copy and accessible illustrations.
2. Run a small cutout and recognition spike on consented difficult photos. Compare actual results before choosing adapters.
3. Add focused local native processing if needed, with availability checks, cancellation, and development-build support. Keep implementation-specific errors out of customer copy.
4. Implement durable original-image import, orientation handling, working variants, faithful cutouts, thumbnails, and visible bounds.
5. Implement automatic name/category proposals. A provider that only removes backgrounds does not complete recognition.
6. Add per-item batch jobs and review: ready, needs a quick check, processing, failed, and saved. Save ready items while others continue.
7. Preserve corrections and originals. Retry one failed stage without duplicate garments. Cancelling a batch must not delete already saved items.
8. Add focused uncertainty review, including a later manual correction path. Do not require complete coverage or warmth metadata at capture time.
9. Add Keep original, Retake, and Edit category actions. On failure, manual entry remains available as recovery rather than the standard workflow.

**Likely touchpoints:** `src/features/PieceEditor.tsx`, new capture/review features, media storage, import coordinator, processor adapters, native module/config plugin when justified, domain records/migrations, photo rendering.

### D2 acceptance

- P01: A clear ordinary photo becomes a recognizable, correctly categorized item without typing a name or category.
- P02: Hijab edges, fringe, dress hem, embroidery, holes, and garment color remain faithful. Compare original and processed versions side by side at useful scale.
- P03: White clothing remains visible on the white closet canvas through faithful edges and composition, without recoloring the cloth.
- P04: A three-piece Desi set can become separate linked pieces through a comprehensible capture flow. Multi-garment image segmentation is optional, not a hidden dependency.
- P05: Blur, clipped hems, mixed lighting, and merged background receive specific advice. Help never traps the user in an endless retake loop.
- P06: Denied camera permission, limited library access, unavailable remote library image, no network, unsupported model, insufficient storage, and processing failure preserve work and offer valid next actions.
- P07: Restarting during a batch resumes or cleanly marks unfinished work. Retry/save twice creates one item. A late result cannot resurrect a deleted garment.
- P08: No personal image is sent remotely in local mode. Permission to access Photos does not imply permission to upload it.

**Stop gate:** The chosen provider is measured on her phone and suitable clothing. If recognition or cutout quality is insufficient, document the result and choose another adapter or explicit review experience before calling capture automated.

## 5. D3: Make the real wardrobe useful

**Outcome:** Suggestions reflect her actual clothes, hijab preferences, mood, saved outfits, and comfort beyond the sample demonstration.

**Dependencies:** D1, D2, a small consented collection of real clothes, and user-confirmed attributes where an image cannot establish them.

**Tasks**

- Refine coverage validation for opacity, openings, sleeve/hem reach, fit on the wearer, and indoor/outdoor layers. Ask for missing evidence only when relevant.
- Add explicit availability and exclusion actions. Keep garment archiving distinct from deletion.
- Add the hijab comparison sheet: selected scarf, few alternatives, concise reasons, full-outfit preview, one-tap apply, and undo.
- Tune color, pattern, drape, occasion, and personal pairing preferences from her feedback. Do not turn a color score into a universal rule.
- Add saved-look retrieval for the active request. Distinguish exact saved matches from proposed variants and show missing-item repairs.
- Add temporary work mood and contextual feedback such as too formal, too warm, too much contrast, or not my style. Keep it optional.
- Add gentle discovery of less-suggested pieces while allowing reliable favorites. Actual worn history requires explicit confirmation.
- Allow basic saved-look duplication and renaming. Add inspiration-from-saved only as specified in D5 unless the deterministic variant flow already provides the whole task.

**Acceptance**

- R01: User-confirmed garment facts override later recognition proposals.
- R02: Unknown essential coverage cannot become a confident “ready” result through a high style score.
- R03: When suitable hijabs exist, the comparison presents plausible alternatives she can judge in the whole outfit. Changing a hijab preserves every other piece.
- R04: An exact saved look appears only if its present items and context satisfy the request. Variants preserve the original.
- R05: A work mood affects ranking without dropping coverage, kept pieces, or weather requirements.
- R06: Rediscovery exposes suitable alternatives without inventing wear dates or shaming repeated favorites.
- R07: A sheer or open outer layer does not falsely certify the outfit beneath it as covered.

**Stop gate:** In the agreed realistic cases, she finds at least one outfit she would wear among the first three suggestions when the wardrobe contains suitable options. This is a proposed personal usefulness target to test, not a benchmark already achieved.

## 6. D4: Improve weather and occasion decisions

**Outcome:** Optional forecasts and clearer event context help her choose practical clothing and judge dressiness.

**Dependencies:** D3. Manual weather and occasion controls continue working independently.

**Tasks**

- Add optional city selection or approximate location at the moment weather is enabled. Avoid always-on location.
- Normalize forecast units, freshness, place, and valid time interval at the weather boundary. Explain stale or missing forecasts.
- Preserve explicit manual overrides. Avoid silently rebuilding an outfit she is currently editing when weather changes.
- Distinguish outdoor warmth/rain/snow needs from the indoor outfit and coverage after removing outerwear.
- Add concise event details when relevant: time, indoor/outdoor, stated dress code, desired dressiness, and personal expectations.
- Provide tentative occasion advice grounded in those details and known garment attributes. Show ways to adapt a saved outfit using owned pieces.
- Reuse the current outfit generator and data contracts. Do not create a separate event styling engine.

**Acceptance**

- W01: Denied location or failed network leads to manual weather without blocking the closet.
- W02: A future event never displays today's weather as its own forecast. Stale forecasts are labeled, with refresh/manual actions.
- W03: A coat-dependent warm outfit still satisfies the indoor coverage profile after the coat is removed.
- W04: “Is this Desi look dressy enough?” receives context-aware guidance and uncertainty when event expectations are missing. Eid, work, and weddings do not have universal dressiness scores.
- W05: A weather update preserves kept pieces and unsaved work; a conflict is explained rather than silently repaired.

## 7. D5: Add language and reference inspiration

**Outcome:** She can express a request naturally and translate a saved look or reference image into combinations of her own clothes.

**Dependencies:** D3; D4 only when the feature uses automatic weather. Existing structured controls remain usable if interpretation is unavailable.

**Tasks**

- Evaluate Needle, available Apple capabilities, or another permitted parser using the same typed request contract. Verify availability, licensing, telemetry, performance, and accuracy before integrating.
- Handle type versus identity, negation, multiple pieces, mood, occasion, and ambiguous phrases. Show interpreted request chips that she can correct.
- Add a “Make something similar” saved-look action with an explicit choice of what to preserve: palette, silhouette, dressiness, or selected pieces.
- Add a reference-photo picker and optional crop. Analyze only the selected image and produce an editable brief before styling.
- Search owned items against the chosen aspects. Show the preserved idea and any wardrobe gap without introducing unowned products.
- Do not require a Pinterest account, scrape private boards, or infer identity/body/religion from people in references.
- Add a standalone Stylist destination only when it contains a useful conversation capability beyond the existing request controls.

**Acceptance**

- I01: “Use a blazer but not the black one” resolves to type plus exclusion, never the opposite.
- I02: “Keep these shoes and bag” preserves exact selected IDs through parsing and generation.
- I03: An unavailable model, interrupted download, offline device, refusal, or invalid provider output preserves the request and offers structured controls.
- I04: A reference becomes an editable brief; generated suggestions contain only current available owned IDs and pass ordinary eligibility checks.
- I05: A saved-inspired result has its own draft/identity. Saving it does not overwrite the source unless explicitly selected.
- I06: A reference requiring missing clothing explains the gap and proposes the nearest permitted interpretation. It never pretends an owned item is identical to the reference.
- I07: Text inside an uploaded screenshot is treated as reference content, never as instructions to bypass constraints, reveal data, or call unrelated tools.

## 8. D6: Make the personal app dependable

**Outcome:** The full daily loop works on her physical iPhone and the closet can be recovered.

**Dependencies:** Relevant preceding packets. Reliability work also belongs within every earlier packet; do not postpone data protection until here.

**Tasks**

- Implement export and validated restore with metadata, original/cutout assets, and versions. Explain what the archive includes.
- Provide clear local storage, deletion, sample removal, cloud-processing consent, and permission settings.
- Validate migration, disk pressure, process termination, large images, malformed imports, missing media, and interrupted jobs.
- Run the wife-led task protocol below. Address observed friction before adding another feature.
- Verify VoiceOver, accessibility text sizes, reduced motion, contrast, focus restoration, and 44-point controls on relevant screens.
- Measure actual capture and generation latency, memory, battery/thermal behavior, and app size on the supported phone.
- Test offline closet, builder, saved looks, and any advertised local styling path.
- Reconcile every privacy claim with actual file protection, backup behavior, logs, networking, and provider settings.

**Acceptance:** All implemented task invariants pass; export restores into a clean installation without losing valid IDs or photos; deletion clears the intended managed data; the wife can finish ordinary dressing tasks without coaching. Document the exact build/device and remaining limitations.

## 9. D7: Prepare a commercial release

**Outcome:** A useful personal product becomes a maintainable product for additional women.

**Dependencies:** D6, broader consented testing, chosen launch market, device policy, identity, and business model. Use [Operations](OPERATIONS.md) as the detailed release specification.

**Tasks**

- Broaden evaluation across coverage preferences, body/fit experiences, languages, cultures, devices, and wardrobe sizes. Preserve each woman's preferences independently.
- Add accounts and optional backup/sync only if chosen. Implement ownership authorization, offline conflict rules, deletion tombstones, export, and recovery before inviting users to trust the service.
- Choose billing based on demonstrated recurring value and actual operating costs. Add truthful entitlements, restore purchases, cancellation handling, and grace/expiry behavior.
- Make a usable local closet and access to existing data survive any applicable subscription expiration policy.
- Complete original branding/copy, licensed assets, store metadata, actual screenshots, support, privacy disclosures, and current platform requirements.
- Test the release build and distribution path. Verify provider terms, model redistribution, privacy manifests, required reasons, and server configuration at release time.
- Set up basic operational alerts for processing failure, storage problems, deletion backlog, and billing errors without logging wardrobe content.

**Stop gate:** Ship only capabilities actually verified in the release build. Defer unsupported promises or incomplete capabilities explicitly. Do not delay a sound smaller release for optional future audiences, social features, packing, or shopping.

## 10. Requirement traceability

| User requirement | First useful packet | Required evidence |
| --- | --- | --- |
| White Direction A design; visible colors | D1, maintained throughout | Native screen comparison with approved reference, no garment tinting |
| Live overlapping outfit while picking | Existing, preserved D1 | T10, large text/keyboard inspection |
| Everyday default and other occasion | D1 | T01, T02, day-rollover tests |
| Blazer/dress garment requests | D1 | T03, T04 |
| One or many exact chosen pieces | D1 | T05, T06, required-ID property tests |
| Desi and Western | D1, refined D3 | T07, linked-set and shared-accessory cases |
| Weather and warm/cold layers | D1 manual, D4 forecast | T08, W01-W05 |
| Change an individual piece | D1, refined D3 | T09, R03 |
| Matching hijabs | D3 | R03 plus wife's preference evaluation |
| Use beyond favorite clothes | D3 | R06, contextual feedback behavior |
| Work mood and dressy-enough Desi | D3/D4 | R05, W04 |
| Options from existing outfits | D3 | R04, missing-item repair |
| Automatic names/category/cutouts | D2 | P01-P08 |
| Clothing photo tutorials | D2 | Garment help assets and uncoached capture trial |
| Manual build/save | Existing, preserved throughout | Save/reopen offline, migration regression |
| Inspiration from saved looks | D5 | I05 |
| Screenshot/Pinterest inspiration | D5 | I04, I06, I07 |
| Replaceable capability layers | As each capability ships | Contract tests, no provider SDK in domain/screens |
| Local models when suitable | D2/D5 evaluated | Hardware measurements and no silent cloud fallback |
| Privacy and 90-day account deletion | Local controls D6, service D7 | Data-flow inspection and deletion lifecycle drill |

## 11. Automated test strategy

### Domain and constraint tests

Prefer small fixtures that explain real garment combinations. Include:

- Every successful candidate contains each required ID exactly once and contains no unavailable, excluded, deleted, reference-only, or foreign-mode item.
- Required types can be fulfilled by kept items without duplicates.
- Two items in the same broad category can coexist when their roles/layers are valid. Category uniqueness is not a coverage rule.
- Open abaya, sheer sleeve, unlined skirt, slit, short tunic, and dress-over-trousers examples exercise actual combined coverage.
- Unknown opacity stays unknown. Missing measurements do not become guessed fit on the wearer.
- Color preference, popularity, novelty, or model score cannot override a hard requirement.
- Cold sunshine, summer rain, snow without suitable footwear, and mostly-indoor winter requests remain distinct.
- Single-piece replacement preserves all other IDs. Undo restores the exact previous selection.
- Saved exact matches and proposed variants have different semantics.
- Equivalent resolved requests are deterministic until an explicit alternative or relevant data change.
- Invalid model IDs, malformed values, contradictory constraints, and stale revisions are rejected at the boundary.
- Bounded search exhaustion is distinguishable from a proven wardrobe constraint failure.

Use property-based tests for invariants if they add clear coverage beyond a small explicit fixture set. Do not install a framework solely for style.

### Storage and job tests

- Old snapshot migration preserves IDs, names, media paths, deleted-sample decisions, and incomplete saved looks.
- Migration failure leaves the previous valid snapshot recoverable.
- Concurrent save operations do not lose one another; failed persistence does not emit a success state.
- Import retries are idempotent, partial batches survive interruption, and cancellation prevents obsolete stage writes.
- Deleting an item while a job runs cannot restore it later.
- Removing one garment cannot delete a shared media asset still in use.
- Restore rejects corrupted, unsupported, oversized, or path-traversing archives safely; valid exports round-trip.
- Daily foregrounding, timezone changes, daylight-saving transitions, and midnight preserve active drafts and use the intended local date.

### Native interaction checks

Inspect the smallest supported screen and her physical phone where available. Cover keyboard opening, long garment names, long lists, sheet focus/close behavior, first-use permissions, Photos selection, Dynamic Type through accessibility sizes, VoiceOver reading order, reduced motion, and app background/foreground transitions. Include large text on the fixed-preview builder: preserve a usable picker by adapting layout rather than clipping content.

## 12. Wife-led evaluation protocol

Begin with approximately 20 to 30 consented pieces representing what she actually wears, including several hijabs, work clothing, Desi clothing, layers, shoes, and bags. This is a practical proposed starting range, not a statistically representative dataset. Include difficult fabrics and enough compatible roles to build actual outfits.

Ask her to perform tasks in her own words. Observe first; avoid teaching the interface during the task. Record only what she agrees to share.

| Task | Observe |
| --- | --- |
| Open the app before work | Does she understand the default and like any initial suggestion? |
| Wear a blazer today | Can she request a type without selecting a specific item? |
| Wear this dress to work | Does it respect the exact dress, coverage, and work preferences? |
| Keep these shoes and bag | Are both preserved, visible, and easy to release? |
| Dress for a Desi occasion | Does the vocabulary fit her wardrobe and event expectations? |
| Change only the hijab | Can she judge alternatives in context without losing the outfit? |
| Choose a softer/bolder work mood | Does ranking respond without becoming a different unwanted task? |
| Wear something less familiar | Are alternatives useful without punishing favorites? |
| Prepare for cold rain or snow | Does it identify practical gaps and indoor/outdoor layers? |
| Photograph a hijab and a detailed long garment | Can she follow the tutorial and finish without routine typing? |
| Reuse a saved outfit | Can she distinguish an exact look from an adapted version? |
| Use an inspiration screenshot | Can she correct the interpreted idea and recognize her actual clothes? |

Track completion, time to a useful decision, corrections, accidental changes, declined suggestions and stated reasons, and whether she would wear a result. Keep measured facts separate from interpretation.

Proposed targets: no hard-rule violations in the agreed cases; no unowned IDs; at least one of the first three feasible suggestions she would wear; ordinary capture usually under a minute of active effort after onboarding. Adjust targets using observed baseline performance. Do not optimize a timer at the expense of trustworthy clothing images or an outfit she likes.

## 13. Provider evaluation record

For each tested provider, store a small decision record: capability, model/library version, test date, device/OS, input set provenance, output schema validity, domain accuracy, failure examples, cold/warm latency, peak memory, download/storage cost, sustained thermal behavior, network traffic, telemetry configuration, license, privacy terms, and estimated cost per successful task.

Compare against the simplest working baseline. Prefer a provider only when its improvement matters to the wife's task. Small model file size alone does not establish runtime memory, latency, accuracy, or battery cost. Use the same fixture cases when replacing a provider.

## 14. Commands and evidence

The current repository uses npm. Run commands separately so failures remain attributable:

```sh
npm ci
npm run check
npx expo-doctor
npm run ios
```

Use `npm run web` for the browser preview. When a packet changes bundling or platform integration, export both supported previews as an additional check:

```sh
npx expo export --platform ios --platform web
```

These commands do not replace camera, permission, or on-device model tests. Inspect existing development sessions before starting conflicting Metro servers. Do not commit native generated folders or development-only simulator artifacts that the repository intentionally ignores.

When a remote/CI is introduced, run locked dependency installation, static checks, domain tests, and relevant export/build checks. Keep paid device suites and model evaluations scoped to changes that affect them. Add secrets through the chosen CI secret store, never the app bundle or repository.

After each packet, record: completed user tasks, changed areas, checks actually run, screenshots, migration impact, unresolved problems, and the next packet. Keep the status factual. A checkbox in this plan is not evidence that a task has shipped.
