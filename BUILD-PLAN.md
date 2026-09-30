# Digital closet: implementation handoff

Planning baseline: 30 September 2026. Product name is undecided. The project folder name is temporary.

## 1. Purpose of this handoff

Build a useful personal closet and modest stylist for the founder's wife, then refine it for a commercial audience of Muslim women. Start with iPhone. Preserve the working app and the approved visual direction while delivering complete, small increments.

The immediate deliverable is this written plan. No Today screen, recommendation engine, or automated photo-processing feature has been implemented as part of this handoff.

This document is the entry point. Read the specifications below before implementation. They turn the existing product discussions into buildable flows, boundaries, and acceptance criteria.

| Read in order | What it specifies |
| --- | --- |
| [Product and UX](planning/implementation/PRODUCT-UX.md) | Her needs, everyday and occasion paths, garment requests, selected pieces, hijab matching, wardrobe discovery, and all major screen flows |
| [Design system and interaction](planning/implementation/DESIGN-SYSTEM.md) | Direction A, exact current tokens, native behavior, flat lays, accessibility, component boundaries, and visual verification |
| [Photography and import](planning/implementation/PHOTOGRAPHY.md) | App-ready tutorials, practical capture instructions, automatic naming and cutouts, batch review, and image-quality checks |
| [Technical architecture](planning/implementation/ARCHITECTURE.md) | Data contracts, styling rules, capability layers, local storage, migration, provider evaluation, privacy boundaries, and performance |
| [Delivery and validation](planning/implementation/DELIVERY.md) | Ordered implementation packets, file touchpoints, meaningful tests, wife-led evaluation, and completion gates |
| [Operations and release](planning/implementation/OPERATIONS.md) | Data promises, accounts, backup, consent, deletion, commercial decisions, support, and store readiness |

For implementation sequencing and detailed behavior, this package supersedes conflicting proposals in earlier planning documents. Explicit user instructions and approved design decisions remain authoritative. Earlier plans and research remain useful background, not evidence that a capability has shipped.

## 2. What matters most

Her daily difficulty is deciding what to wear from clothes she already has. The app should reduce decisions and reveal useful combinations without making her maintain a complicated catalog.

The priority jobs are:

1. Find a hijab that works with the whole outfit and the intended style.
2. Open the app and see a useful everyday outfit based on her default preferences.
3. Ask for a specific type of garment, such as a blazer today or a dress for work.
4. Choose any number of exact items and have the rest of the outfit completed around them.
5. Choose Desi or Western styling and account for weather.
6. Find something appropriate for an occasion, including whether a Desi outfit feels sufficiently dressed up.
7. Change an individual piece while seeing the whole combination.
8. Reuse a saved outfit or discover clothes beyond her favorites.
9. Add clothes with little effort: take photos, review the prepared pieces, and move on.

The app should feel calm, attractive, practical, culturally fluent, and respectful of her own choices. It must not make religious judgments, require a body photograph, infer her ethnicity, or treat one woman's preferences as a universal modesty standard.

## 3. Decision register

### Confirmed by the user

- iPhone first; commercial distribution may follow the personal version.
- Hobby project, using the repository's hobby workflow.
- Start simply and work toward the polished product in increments.
- Direction A is the selected look and feel.
- White clothing surfaces so garments and hijabs stand out and colors are easy to compare.
- Earthy tones with restrained flower pink, purple, and white accents.
- A live, overlapping flat lay; the outfit must remain visible while choosing pieces.
- Everyday/default styling and temporary styling for another occasion.
- Garment-type requests and completion around one or many specific pieces.
- Desi and Western selection.
- Weather-sensitive clothing and layers.
- Hijab matching, single-piece changes, wardrobe rediscovery, mood, and relevant saved outfits.
- Automatic clothing names, categories, background removal, and tidy closet images.
- Manual outfit creation, saved looks, inspiration from saved looks, and reference-photo matching.
- Capability boundaries that allow models and services to be replaced.
- Modern supported phones and software; exact launch device policy is undecided.
- Clear photo-taking tutorials.
- Clothes already owned; no shopping or trend pressure.
- Privacy commitments: no sale of personal data, no advertising use, user choice over sharing, and account deletion with data removed within 90 days once an account service exists.

### Build defaults proposed by this handoff

- Continue the existing Expo/React Native implementation.
- Keep the personal version local, with no account requirement.
- Introduce Today before adding a standalone Stylist tab.
- Start structured styling controls and local rules before conversational requests.
- Start with manually entered weather; add optional forecasts later.
- Keep one editable everyday preset initially.
- Make today's outfit stable for the local day; refresh explicitly or on the next day.
- Use sample metadata to validate the first styling flow, then test with her real clothes.
- Require no routine name/category typing for a successfully recognized import.
- Ask only for an uncertain attribute when it materially affects the requested outfit.
- Keep body-type labels optional and out of required onboarding.

These defaults make the next increments concrete. They are not claims about the wife's actual taste, workplace, body, city, phone, or weather.

### Questions that can wait until their feature needs them

| Decision | When it becomes necessary |
| --- | --- |
| Her phone model, OS, storage, and preferred language | Before the first real-device processing spike |
| Her everyday occasion, preferred silhouettes, coverage, Desi/Western preference, and warmth comfort | During the first editable preference setup |
| Local-only processing versus an optional cloud quality option | Before transmitting any personal photo or preference |
| Whether she wants an Either / Mix selector | After trying the explicit Desi and Western paths |
| Definition of suitable workwear and event dressiness | During relevant real-wardrobe tasks |
| Product name, first commercial market, account policy, and pricing | Before public branding or store work |

Do not reopen settled visual decisions or ask her to design technical infrastructure. Continue independent work while waiting on a decision that affects a later phase.

## 4. Exact starting state

The application baseline is commit `b5486e3`, followed by planning updates in `c1708e5`. Inspect the actual working tree before beginning; newer commits may exist when this is handed over.

### Working now

- Closet and Looks tabs.
- Twelve illustrative sample clothing items, seeded once.
- Camera/library entry through a manual name/category form.
- Search and category filters, editing, and removal.
- Manual outfit selection with a live overlapping flat lay.
- Fixed preview above a horizontal item picker on iPhone; two columns on wide web previews.
- Saved looks with the same composition and editable item selections.
- Local persistence and failure handling that preserves previous records.
- Eight existing domain/repository tests, strict TypeScript, linting, and formatting scripts.

### Planned, not implemented

Today, defaults, coverage profiles, automatic styling, garment-type metadata, multiple kept-piece generation, style filters, weather, automatic naming, background removal for uploads, batch import, photo tutorials, hijab recommendation, occasion advice, mood, rediscovery, reference interpretation, conversation, accounts, sync, export UI, billing, and account deletion.

The collage is a visual layout, not a fit simulation or proof of coverage. New uploaded photos currently retain their backgrounds. Native and browser storage are separate. A saved look is not evidence it was worn.

### Repository map

| Area | Existing location |
| --- | --- |
| App entry | `app/index.tsx`, currently redirects to Closet |
| Native/browser tabs | `src/navigation/Tabs.native.tsx`, `src/navigation/Tabs.tsx` |
| Manual outfit builder | `app/look/build.tsx` |
| Saved outfit detail | `app/look/[id].tsx` |
| Clothing editor | `src/features/PieceEditor.tsx` |
| Domain and validation | `src/domain/closet.ts` |
| Serialized write queue | `src/domain/repository.ts` |
| Shared state | `src/state/closet.tsx` |
| Platform persistence | `src/storage/local.native.ts`, `src/storage/local.ts` |
| Theme and components | `src/ui/theme.ts`, `src/ui/index.tsx` |
| Flat lay | `src/ui/OutfitCollage.tsx` |
| Sample images and visible bounds | `assets/wardrobe`, `src/ui/photos.ts`, `src/ui/sample-frames.json` |

Native metadata is currently one versioned JSON snapshot in SQLite KV under `closet.v1`. It is not a normalized relational garment database. Native images are managed files in the app documents directory. Browser preview images are data URLs in local storage.

### Visual references

| Reference | Use |
| --- | --- |
| [Direction A](planning/concepts/a-dressing-room.png) | Approved overall identity and garment emphasis |
| [Current iPhone builder](planning/build/flatlay-builder-iphone.png) | Working overlapping composition and live selection |
| [Current desktop builder](planning/build/flatlay-builder-desktop.png) | Wide-screen adaptation |
| [Keyboard behavior](planning/build/flatlay-builder-keyboard.png) | Keep the outfit and name controls visible |
| [Larger text](planning/build/flatlay-builder-large-text.png) | Existing accessibility evidence |
| [Earlier daily concept](planning/concepts/a-daily-style.png) | Useful visual direction; predates the full current feature brief |

One additional [olive dress fixture](planning/fixtures/olive-maxi-dress.png) and its [prompt](planning/fixtures/olive-maxi-dress.prompt.txt) are supplied for a future sample-wardrobe extension. It is not connected to the app, included in the twelve seeded pieces, or part of the wife's wardrobe. No winter coat or verified snow-footwear fixture has been added.

## 5. Implementation order

1. Baseline and fixture preparation, preserving existing data and behavior.
2. First working Today increment: defaults, everyday/occasion paths, Desi/Western, garment types, exact kept pieces, manual weather, and local sample suggestions.
3. Automatic import with photo tutorials, faithful cutouts, suggested names/categories, batch review, and resumable jobs.
4. Real-wardrobe attributes and coverage validation, hijab comparison, saved-look retrieval, individual replacement, mood, and rediscovery.
5. Optional automatic weather and contextual event refinement.
6. Natural-language requests, saved-look inspiration, and reference photos, with evaluated providers.
7. Personal-use reliability, export/restore, privacy checks, and a physical-iPhone pilot.
8. Accounts and optional sync, commercial model, and store readiness when the personal loop is useful.

Detailed dependencies, acceptance tests, and stop conditions are in [Delivery](planning/implementation/DELIVERY.md). The owner should receive a usable increment after each packet. Do not build the entire commercial system before validating the everyday task.

## 6. Instructions for the next builder

Use this as the starting task:

> Read BUILD-PLAN.md and its six implementation specifications. Inspect the current app, DESIGN.md, package-lock.json, and local project instructions. Preserve the existing closet, saved looks, white visual system, and live flat lay. Begin with Delivery packets D0 and D1. Implement a complete working Today increment using the existing sample wardrobe plus clearly labeled fixtures where needed. Keep exact chosen pieces through regeneration, distinguish garment types from item IDs, preserve everyday defaults during occasion changes, and represent unavailable weather or clothing honestly. Keep model and provider details out of screens. Verify the main flows on iPhone, including larger text and the keyboard, and run meaningful domain tests. Save screenshots and update the implementation status. Continue through later packets in order, without inventing missing personal preferences or silently enabling cloud processing.

Follow the user's repository instructions: English or Norwegian bokmål, no em dashes, no code comments, no authorship credit lines, no secrets, small relevant changes, and explicit verification. Hobby mode permits direct default-branch commits. No remote is configured in this snapshot; do not invent a destination or publish externally as part of ordinary development.

## 7. What completion means

The personal app is useful when she can photograph a small useful selection, receive recognizable closet pieces without routine typing, find an outfit she wants to wear, compare hijabs, keep chosen items, change one item, and reopen the result the next day without data loss.

The commercial app additionally needs tested broader preferences, reliable capture across difficult clothing, real-device performance, accessible flows, truthful privacy controls, recoverable data, and verified distribution requirements. Neither a polished mockup nor a successful model response establishes those outcomes.
