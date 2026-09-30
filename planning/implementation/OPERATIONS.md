# Privacy, reliability, and commercial readiness

Read with [the handoff](../../BUILD-PLAN.md). This document specifies intended product behavior and release work. The current app has no account, cloud backend, billing, or account-deletion service.

## 1. Turn the trust promise into behavior

The user's commitments are: personal data is never sold, never used for advertising, sharing is the user's choice, and account data is removed within 90 days of deletion once an account service exists.

Implement these commitments through data minimization, explicit controls, provider terms, logging rules, backup policy, and deletion verification. Do not publish a stronger promise than the system can demonstrate. A warm privacy headline cannot substitute for a working lifecycle.

Proposed additional policy: no training on personal wardrobes by the app or its processors. Select provider settings and contracts that support this before enabling hosted processing. Personal photos are not evaluation fixtures or marketing material without separate permission.

No advertising SDKs, tracking-based personalization, affiliate shopping, or sale of inferred interests belong in the initial product. The value is helping her use her own clothes.

## 2. Personal version and account boundary

Start without a required account. Local closet, manual outfits, and available local styling should work offline. Explain that an unexported local closet can be lost when the app is removed or the phone is lost.

Keep these choices separate:

| Choice | Meaning |
| --- | --- |
| Device storage | App records and managed photos on this installation |
| Operating-system backup | Device/platform backup behavior, which must be inspected and documented |
| Export | A user-created archive saved to a location they choose |
| App backup/sync | Optional service storing selected data for recovery or other devices |
| Remote processing | A specific photo/text/attribute task sent to a named service |

Choosing backup does not authorize remote styling, model training, or diagnostics containing photos. Disabling app sync does not prove the OS has no backup copy. Avoid “never leaves your phone” unless every applicable path supports that statement and its scope is clear.

When accounts become useful, support a deliberate transition from local use. Preview what will upload and handle account switching without merging another person's closet. Keep local data until a verified migration and the user's chosen retention behavior are complete.

## 3. Data inventory and retention design

| Data | Why needed | Default treatment | Deletion/export requirements |
| --- | --- | --- | --- |
| Original clothing photo | Faithful processing and recovery | Managed local file; retain while its item is retained | Include in full export; remove with item when unreferenced |
| Cutout, mask, thumbnail, bounds | Clean closet and fast preview | Local derived assets, versioned | Remove or regenerate with source lifecycle; include useful variants in export |
| Name/category/color | Browsing and outfit matching | Local typed record | Editable/exportable/deletable |
| Coverage, fit, comfort preferences | Personal suitability | Minimum explicit facts, optional where possible | Treat as private; export and delete with profile |
| Saved outfits and feedback | Reuse and taste | Local records, no fabricated wear history | Export references and contextual feedback; preserve understandable missing-item state |
| Reference screenshot/brief | Inspiration | Process only selected content; offer brief-only retention | Delete original when no longer requested; clear derived embeddings too |
| City/forecast | Clothing context | Chosen city or approximate position; dated short-lived weather | Avoid location history; clear cached location on removal |
| Import job/temp image | Reliable processing | Managed temporary storage and bounded cleanup | Cancel obsolete work and clear unreferenced staging files |
| Model download/cache | Local capabilities | Versioned downloadable resources | Removable without deleting closet data |
| Consent record | Remember allowed processing | Purpose/version/scope, minimal history | Apply revocation to queued work; retain only justified minimal records |
| Account/auth data, if added | Access and recovery | Separate from wardrobe records | Delete access promptly and cover service lifecycle |
| Diagnostics | Repair failures | Error codes, timings, versions; no personal content by default | Bounded retention and user-visible reporting choice |

Specify concrete retention durations before enabling each service. For temporary processing files, a proposed target is cleanup promptly after success/cancellation, with a daily sweep for abandoned files. Unfinished jobs need a defined resume window before their sources can be removed. Test this rather than asserting a background task always runs on schedule.

A deleted item should stop appearing immediately. Retained saved looks can keep a non-sensitive missing-item placeholder; do not preserve a hidden full garment record indefinitely under the label of history.

Strip unneeded location and camera metadata from working copies and anything shared. Original retention policy must explicitly address embedded metadata, since keeping an untouched original can also keep its EXIF. Do not change the user's source file in Photos.

## 4. Permission and sharing experience

### Device permissions

- Ask for camera access when Take photo is chosen, with a specific purpose.
- Use the system photo picker and the narrowest access needed. Limited access is a normal supported state.
- Request optional location only when weather is enabled; city entry remains available.
- Do not request notifications until a useful reminder feature exists and is chosen.
- Provide Settings links after a denial where appropriate, while preserving useful alternative actions.

No permission prompt belongs at first launch solely because a future feature might need it.

### Remote processing consent

Before the first personal-data upload for a purpose, explain in a short sheet:

1. The task, such as preparing the selected clothing photo.
2. Exactly what will be sent and to which service.
3. Why local processing is insufficient or why the remote option is offered.
4. Applicable retention/training treatment in plain language.
5. Whether this is a one-time choice or a preference that can be changed.
6. A useful local/manual option when available.

The action must be an explicit choice. Declining must not silently switch to another remote provider. Revocation cancels queued uploads; explain the treatment of work already sent. Check current consent again when a background job is about to transmit.

Keep permission for support attachments, model evaluation, research interviews, and marketing separate from ordinary app processing. Never automatically attach photos or prompts to a crash report.

## 5. Security and data handling

Use standard platform and service protections. Store credentials in appropriate secure storage, use authenticated encrypted transport, and apply private access controls to media and databases. Do not design bespoke cryptography.

Verify native file-protection behavior on physical hardware and during background tasks. Avoid presenting the app sandbox or ordinary transport encryption as end-to-end encryption. Hosted processing that reads garment data changes that claim's scope.

For any cloud implementation:

- Enforce ownership on every record, asset, processing job, export, and signed media request at the server boundary.
- Use private buckets and short-lived authorized links where appropriate. Never rely on an obscure public filename for privacy.
- Keep service credentials server-side. Mobile bundles and web previews are public clients.
- Validate image type, dimensions, decoded size, and processing limits. Reject malformed uploads safely.
- Send only the data required for the operation. Ranking often needs attributes and IDs rather than full photographs.
- Disable unnecessary provider telemetry and verify actual network traffic.
- Keep logs free of photos, raw prompts, fit notes, precise location, tokens, and signed asset URLs.
- Bound retries, queues, and task cost. Rate-limit abusive usage without making routine photo batches fail mysteriously.
- Protect exports and support attachments with the same access discipline as the closet.

An implementation should document its actual data-flow diagram and providers. Recheck it whenever an SDK or processing service changes.

## 6. Export, restore, and recovery

### Export

Provide a clear Export closet action before encouraging long-term dependence on local-only storage. Explain that the archive includes private images and preferences and is saved wherever the user chooses.

Include a versioned manifest, garment records, saved looks, relevant preferences, media references, and the actual necessary assets. Use stable IDs and relative archive paths. Record export time and schema version. A contact sheet alone is not a recoverable backup.

Export should be available without an active paid subscription. Offer a smaller export of selected looks separately if useful later; do not confuse it with full recovery.

### Restore

1. Validate the archive and supported schema before modifying the closet.
2. Check file counts, decoded image sizes, available space, references, and path safety.
3. Show a summary of items, looks, and any missing or unsupported content.
4. Make replace versus merge explicit. Begin with one well-tested recovery path if full merge is not yet reliable.
5. Stage imported files and records, validate them, then commit atomically or through a recoverable transaction.
6. Preserve the previous valid closet until success is confirmed.
7. On failure, clean staging data and retain the existing closet.

If merge is supported, define ID collisions, duplicates, and conflicting edits. Do not silently overwrite a different garment sharing an imported ID. Keep a complete restore usable offline.

### Recovery behavior

Missing photo, corrupt metadata, failed migration, full disk, and interrupted export each need distinct messages and recovery actions. Never reset a damaged closet to empty without an explicit informed choice. Keep diagnostic reports useful without including the private contents by default.

## 7. Optional sync semantics

Add sync only after the local repository and export path are dependable. Define:

- A stable owner and record ID scheme.
- Local outbox, retries, idempotency, server acknowledgments, and explicit sync state.
- Separate media upload completion from metadata changes so broken references are recoverable.
- Conflict handling for edits from two devices, especially saved-look item selections and preference profiles.
- Tombstones for deletion that survive offline devices reconnecting.
- Cancellation of processing for deleted assets and accounts.
- Account sign-out behavior: what remains on the phone, how it is protected, and how a different account is isolated.
- Restore behavior when a service backup predates a deletion. Reapply deletion records before making data accessible.

Do not assume last-write-wins is suitable for every field. Test a device deleting an item while another edits it offline. A pending job or restored backup must not resurrect the deleted photo.

## 8. Deletion and the 90-day commitment

### Local controls

Provide distinct actions for remove sample clothes, delete a garment, delete a saved look, clear an import batch, remove downloaded models, and erase this local closet. Explain scope and counts. Use undo for reversible edits where practical; use confirmation for irreversible bulk removal.

Deleting the app's managed garment photo must not delete the source from the user's Photos library. A saved look referencing the item can show a missing piece and offer repair or deletion. Removing the look must not remove the garments from the closet.

### Account service, when present

Apple's account-deletion guidance says apps supporting account creation must let users initiate account deletion within the app. Build a discoverable account setting and verify current requirements before submission. [Apple account deletion guidance](https://developer.apple.com/support/offering-account-deletion-in-your-app/).

The proposed lifecycle is:

1. Explain the scope, offer export, and confirm identity where necessary without creating needless friction.
2. Accept a deletion request with a trackable status. Revoke account access and sharing promptly.
3. Cancel queued jobs and new uploads; invalidate sessions and media access as appropriate.
4. Delete active wardrobe records, originals, derivatives, reference images, embeddings, feedback, and processor copies promptly.
5. Ensure backup expiry and any processor retention fit the promised maximum of 90 days. Keep inaccessible backup data from reappearing during recovery.
6. Verify completion, retain only minimal justified operational evidence, and provide the promised confirmation path.

The 90 days is a maximum requested service promise, not a reason to keep active data for three months. Define processor and backup deadlines before publishing it. If necessary legal or transaction record retention conflicts with an absolute claim, resolve the scope and language before launch rather than hiding an exception.

Subscription cancellation and account deletion are distinct. Explain both clearly and test their interaction. Do not require an active subscription, email conversation, or a sales-retention flow to request deletion.

Run an actual deletion drill covering active storage, caches, job queues, diagnostics, exports held by the service, processors, and backup restoration. Track overdue tasks without storing deleted wardrobe contents in the tracking system.

## 9. Commercial product decisions

Keep pricing out of the personal alpha. First establish that she returns to the product and that other women value the same tasks.

| Option to evaluate later | Fits when | Questions to answer |
| --- | --- | --- |
| One-time purchase | Useful styling is predominantly local | Can maintenance and future support be funded? |
| Subscription | Ongoing sync, backup, or hosted styling delivers recurring value | What usage is included and what does it cost to serve? |
| Useful base with paid capabilities | The basic closet has standalone value | Is the free experience complete enough to earn trust? |
| Paid app with a clear trial/demo | Value can be demonstrated quickly | Can users evaluate capture and styling before committing? |

These are hypotheses, not pricing recommendations or a chosen business model. Measure inference per successful import/request, storage and transfer, retries, support burden, and applicable store charges before promising unlimited use.

Explain paid features in customer terms. Avoid credits and model jargon unless a limit materially affects a purchase decision. Keep existing personal data, export, and deletion accessible under the published expiry policy.

Plan the initial iOS digital-feature purchase path around the applicable App Store rules, then verify regional and product-specific requirements at launch. Include entitlement verification, restore purchases, renewals, cancellation, billing failure, and subscription-expiry tests. [App Review Guidelines](https://developer.apple.com/app-store/review/guidelines/).

## 10. Broader audience and language

The wife's experience is the starting point. Before commercial claims, test with consenting women whose coverage choices, hijab practices, fit experiences, workplaces, climates, budgets, and clothing traditions vary.

Do not collapse Muslim women into one uniform style. Support the chosen Desi/Western control while retaining garment vocabulary and role data that can represent Arab and mixed wardrobes. Arabic-language support and Arab styling are different product decisions.

Start with the current English interface unless a different first language is chosen. Keep new user-facing strings organized for later localization, avoid concatenated sentences, and allow longer translations. Norwegian, if added, uses bokmål. Urdu and Arabic require reviewed vocabulary, correct directionality, typography, and RTL layout testing before being advertised.

Use garment photos and illustrations that do not require a person's face or body. Never infer religious observance, ethnicity, or body type to set defaults. Optional fit information must have a clear styling purpose and remain editable.

Keep men, Android, tablet layouts, social feeds, sharing, packing, calendars, and widgets outside the initial delivery unless a demonstrated need changes scope. Avoid hardcoding assumptions that would make future audience support require replacing the entire domain.

## 11. Product health and support

For the personal phase, a small observation log is enough. Do not introduce invasive analytics to answer questions that a short conversation can resolve.

Useful product measures, collected only under the chosen policy:

- Time and effort to get the first useful closet pieces.
- Import completion and corrections by garment type or processing stage, without raw photos in analytics.
- Successful requests versus conflicts, missing evidence, and provider failure.
- Whether a user found a useful suggestion, kept it, or changed an item.
- Return to saved looks and explicitly confirmed wear, kept distinct.
- Crash-free use, lost-data incidents, export/restore success, and deletion completion.

Do not equate longer screen time with success. A fast confident dressing decision may be the best outcome. Avoid engagement streaks that pressure outfit novelty or imply a religious judgment.

Provide support with app/build/device versions, a readable error code, and optional diagnostics. Photos and logs with content require an explicit selection and preview. Make account recovery, failed import, missing closet data, refund/billing questions, and deletion status understandable to a nontechnical user.

For a service, monitor failures and cost ceilings without putting personal inputs in alerts. Have a simple way to disable a failing provider while preserving local closet access and previously saved data.

## 12. Release checklist

### Product and design

- Approved white Direction A screens are implemented, including empty, loading, error, and uncertain states.
- Real garments remain recognizable and colors are handled faithfully; screenshots show actual app behavior.
- Everyday/occasion separation, kept pieces, single-piece changes, tutorials, and saved-look semantics pass their implemented acceptance checks.
- Accessibility includes VoiceOver, large text, contrast, reduced motion, and keyboard/focus behavior.
- Brand name, app icon, copy, tutorial illustrations, sample garments, fonts, and other assets have appropriate rights and provenance.
- Marketing is original. Do not ship competitor text or imply paid capabilities that are still plans.

### Engineering and privacy

- Physical-device build tested on the minimum supported hardware/OS and another relevant device where practical.
- Runtime capability checks, offline behavior, model download/cancellation, low-storage behavior, and thermal/performance limits are understood.
- Lockfile, migrations, exports, restore, data ownership, job cancellation, and deletion have appropriate evidence.
- No service secrets, personal evaluation photos, debug menus, private logs, or test entitlements are exposed in the release.
- Privacy policy and in-app controls match actual data flows, SDKs, processors, retention, and backups.
- Privacy labels and applicable manifests reflect third-party code as well as first-party behavior. Apple's submission guidance explicitly includes SDK data use. [User privacy and data use](https://developer.apple.com/app-store/user-privacy-and-data-use/).
- Required permissions, model licenses, third-party acknowledgments, weather attribution, and current SDK requirements are verified.

### Distribution and operation

- Chosen support contact, privacy/deletion information, terms, pricing, availability regions, and age-rating answers are accurate.
- Store screenshots and review notes explain actual supported features, device requirements, and any necessary account/demo access.
- Purchases and restore behavior work in the appropriate test environment if billing is included.
- Account creation, sign-in, sign-out, recovery, and in-app deletion are tested if accounts are included.
- Review current platform rules at submission time. Earlier research is not a substitute for a release check.
- There is a recovery plan for a bad app update, provider outage, migration failure, or deletion backlog.

## 13. Decisions to resolve just in time

| Decision | Who provides the needed input | Required before |
| --- | --- | --- |
| Phone model/OS, available storage, primary language | Wife/owner | Processing spike and physical-device baseline |
| Coverage, fit, everyday style, work expectations | Wife, through editable controls and examples | Confident real-wardrobe suggestions |
| Whether selected photos may use hosted processing | Owner/user per purpose | Any personal-data transmission |
| Which garments and reference images may be retained for evaluation | Photo owner | Evaluation collection or sharing |
| First commercial audience/market, product name | Owner | Public identity and release scope |
| Accounts, sync, backup retention, service region/providers | Owner with implementation evidence | Cloud product commitment |
| Subscription or purchase model and actual limits | Owner after usage/cost evidence | Billing implementation |
| Additional languages and translated garment vocabulary | Owner plus relevant speakers | Localized release |

These are future decisions. They do not prevent D0/D1 or the independent local work in the plan. Ask for the missing information when its implementation depends on it, explain the consequence briefly, and keep unrelated authorized work moving.
