# Redesign Phases 0 to 2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Produce a tested baseline, the approved app architecture and use case catalogue, and a complete design package (system, motion, flows, copy, mockup artifact) ready for the owner's approval gate.

**Architecture:** Orchestrator (main session) runs Workflow scripts. Architect role uses model `fable`, every other role uses model `opus`. Phase 0 (baseline) and Phase 1 (architecture) run in parallel because they share no files. Phase 2 starts when Phase 1 is signed off. Phases 3 and 4 get their own plan, written by the architect from the approved design, because their tasks depend on design output that does not exist yet.

**Tech Stack:** Expo SDK 57, expo-router, React Native 0.86, Reanimated 4.5, TypeScript, `node --test` via tsx, Maestro 2.11 (`~/.maestro/bin/maestro`), Xcode 27, Artifact tool for the mockup page, impeccable skill for critique and audit.

**Spec:** `docs/superpowers/specs/2026-10-03-full-redesign-design.md`

## Global Constraints

- Keep palette and feel: white canvas `#FFFFFF`, surface `#FBF9F7`, ink `#322E28`, muted `#706963`, plum accent `#675469`, Georgia display, system body.
- Logo `assets/brand/icon.png`: blush pink is the second accent, silk motion language, animated splash.
- Light appearance only.
- No floating or resizing sheets. Every `presentation: "modal"` route in `app/_layout.tsx` becomes a full-screen push or inline change.
- No feature removed. `src/domain`, `src/storage`, `src/state` and model code unchanged in behaviour.
- Copy only through `src/i18n` in English and Norwegian bokmål. Never nynorsk. Never the em dash.
- No code comments. Minimum code. No attribution lines to any AI or tool in commits or docs.
- Four magic moments get designed motion: loading, generating, selecting object in image, found clothes in video.
- VoiceOver, Dynamic Type, Reduce Motion, 44 pt targets, WCAG AA contrast.
- Hobby mode: commit and push to `main`.

## Review Focus

- First run with an empty closet: every flow must have a designed empty state, not a blank screen.
- Accessibility extra large text: layouts must not clip or overlap at the largest Dynamic Type size.
- Bokmål strings run about 20 percent longer: buttons and tab labels must not truncate.
- Offline or forecast failure: Today must still produce an outfit, with weather shown as unavailable.
- Interrupted magic moments: leaving a cutout, scan or Studio generation midway must not leave a stuck spinner or half-saved piece.

Each line becomes a required use case in Task 2 and a required state in Task 4.

---

### Task 1: Baseline (Phase 0)

**Files:**
- Modify: `package.json` (scripts)
- Create: `scripts/e2e.sh`
- Create: `.maestro/baseline/routes.yaml`
- Create: `docs/redesign/baseline.md`
- Create: `docs/redesign/screens/before/*.png`

**Interfaces:**
- Produces: `npm run e2e` (builds Release simulator app if missing, installs, runs `.maestro` or a given folder), `npm run e2e -- .maestro/<folder>` for one folder, simulator named `Closet Development`. Later lanes rely on these exact commands.

- [ ] **Step 1: Create the simulator if missing**

```bash
xcrun simctl list devices | grep -q "Closet Development" || xcrun simctl create "Closet Development" "iPhone 17 Pro" "$(xcrun simctl list runtimes | grep -o 'com.apple.CoreSimulator.SimRuntime.iOS-27[^ ]*' | head -1)"
xcrun simctl boot "Closet Development" || true
```

- [ ] **Step 2: Write `scripts/e2e.sh`**

```sh
#!/bin/sh
set -e
device="${DEVICE:-Closet Development}"
app="ios/build/Build/Products/Release-iphonesimulator/Almari.app"
if [ ! -d "$app" ] || [ "$REBUILD" = "1" ]; then
  xcodebuild -workspace ios/Almari.xcworkspace -scheme Almari -configuration Release -sdk iphonesimulator -derivedDataPath ios/build -quiet build
fi
xcrun simctl boot "$device" 2>/dev/null || true
xcrun simctl install "$device" "$app"
~/.maestro/bin/maestro --device "$(xcrun simctl list devices | grep "$device" | grep -oE '[0-9A-F-]{36}' | head -1)" test "${1:-.maestro}"
```

Add to `package.json` scripts: `"e2e": "sh scripts/e2e.sh"`.

- [ ] **Step 3: Run the full existing suite**

Run: `npm run e2e`
Expected: Maestro summary with pass and fail count for all 61 flows. Copy failing flow names and their first error line into `docs/redesign/baseline.md`.

- [ ] **Step 4: Write `.maestro/baseline/routes.yaml`**

The flow starts with the sample closet (reuse the steps from `.maestro/wardrobe/start.yaml`), then visits every route in `app/` through the UI or `openLink: almari://<route>`, and calls `takeScreenshot: docs/redesign/screens/before/<route-name>` on each. Routes to cover: Today tab, Closet tab, Looks tab, Profile tab, piece new, piece detail, piece edit, look build, look detail, capture index, capture detail, capture scan, capture group, cutout, label, every `today/*` route, onboarding index, onboarding colours.

- [ ] **Step 5: Run it**

Run: `npm run e2e -- .maestro/baseline`
Expected: PASS and one PNG per route in `docs/redesign/screens/before/`.

- [ ] **Step 6: Check gates and commit**

Run: `npm run check`
Expected: PASS.

```bash
git add package.json scripts/e2e.sh .maestro/baseline docs/redesign
git commit -m "test: e2e runner and before screenshots for redesign"
git push origin main
```

### Task 2: Architecture and use case catalogue (Phase 1)

Runs in parallel with Task 1. Read-only on code, writes docs only.

**Files:**
- Create: `docs/redesign/inventory.md`
- Create: `docs/redesign/architecture.md`
- Create: `docs/redesign/use-cases.md`
- Create: `docs/redesign/advocate-walkthroughs.md`

**Interfaces:**
- Consumes: spec, `PRODUCT.md`, `DESIGN.md`, `planning/TODAY.md`, `planning/OUTFIT-BUILDER.md`, `planning/implementation/PRODUCT-UX.md`, every file in `app/`, `src/features/`, `src/ui/`, `src/navigation/`.
- Produces for Task 3 and 4:
  - `architecture.md` sections: `## Tabs`, `## Screen tree` (every route path with its parent and entry points), `## Former modals` (table: route, decision push or inline, reason), `## Flow list` (flow ID `F01`..., name, routes, entry, exit, hand-off to next flow).
  - `use-cases.md`: one row per use case with columns `ID` (`UC-F01-01`), `Goal`, `Entry`, `Steps`, `Expected`, `States` (empty, loading, error, offline, large text, bokmål), `Maestro flow path` (`.maestro/<flow-slug>/<use-case-slug>.yaml`, planned).

- [ ] **Step 1: Inventory (opus, parallel readers)**

Four readers, one per area: Today and stylist routes; Closet, piece, label, cutout routes; capture and scan routes; Looks, builder, Profile, onboarding routes. Each lists every user action, state, data read and written, and which existing Maestro flow covers it. Merge into `inventory.md`.

- [ ] **Step 2: Architecture draft (fable)**

The architect writes `architecture.md` and `use-cases.md` from the inventory and the spec. Rules: every inventory action maps to a use case; every former modal gets a decision; each Review Focus line in this plan is a use case.

- [ ] **Step 3: User advocate walk (opus)**

The advocate is the first user: a Muslim woman who struggles to match hijabs to outfits and wants to use more of her wardrobe, dresses for work, dinners and Desi events. She walks every flow in `architecture.md` step by step and records friction, dead ends, missing hand-offs and too-many-steps in `advocate-walkthroughs.md`.

- [ ] **Step 4: Architect revision (fable)**

The architect resolves every friction point or records why not. Repeat Steps 3 and 4 once more (two passes minimum, stop when the advocate reports no blocking friction).

- [ ] **Step 5: Coverage check (opus)**

A checker compares `inventory.md` to `use-cases.md`. Expected: zero inventory actions without a use case, zero modals without a decision. Fix gaps through the architect.

- [ ] **Step 6: Commit**

```bash
git add docs/redesign
git commit -m "docs: redesign architecture and use case catalogue"
git push origin main
```

### Task 3: Design system and motion (Phase 2a)

Starts after Task 2.

**Files:**
- Create: `docs/redesign/design-system.md`
- Create: `docs/redesign/motion.md`
- Create: `docs/redesign/copy.md`

**Interfaces:**
- Consumes: `architecture.md`, `use-cases.md`, `src/ui/theme.ts`, `src/ui/index.tsx`, logo.
- Produces for Task 4 and Phase 3:
  - `design-system.md`: token table (name, value, use) covering colour including blush pink, type scale, spacing, radius, elevation; component list with name, props, states, and which current component in `src/ui/index.tsx` or `src/features/` it replaces.
  - `motion.md`: duration and easing tokens (Reanimated `Easing.bezier` values), rules per navigation type (push, inline expand, tab switch, list insert), the four magic moments with frame-by-frame description and Reduce Motion fallback, the splash sequence.
  - `copy.md`: one table per flow, key, English, bokmål. One term per concept across the app.

- [ ] **Step 1: Parallel drafts (opus)**

UI designer writes `design-system.md` with the impeccable skill. Motion designer writes `motion.md`. UX writer writes `copy.md` from current `src/i18n/en.ts` and `src/i18n/nb.ts`, cutting helper text.

- [ ] **Step 2: Reviews (opus)**

Accessibility specialist checks contrast of every token pair, target sizes, Dynamic Type scale, Reduce Motion. Design critic scores against Rams' ten principles and impeccable critique. Each returns blocking and non-blocking findings.

- [ ] **Step 3: Fix loop**

Owners fix blocking findings. Repeat Step 2 until critic and accessibility report zero blocking findings.

- [ ] **Step 4: Commit**

```bash
git add docs/redesign
git commit -m "docs: redesign design system, motion and copy"
git push origin main
```

### Task 4: Flow designs and approval artifact (Phase 2b)

**Files:**
- Create: `docs/redesign/flows/F01-<slug>.md` ... one per flow
- Create: `docs/redesign/mockups/index.html`

**Interfaces:**
- Consumes: Tasks 2 and 3 outputs, `docs/redesign/screens/before/`.
- Produces: one flow doc per flow with sections `## Screens` (layout per screen using only design-system components), `## States` (every state from the use case rows), `## Motion` (transitions referencing `motion.md` tokens), `## Use cases` (IDs covered). The HTML artifact shows app map, every flow as a strip of screens, key screens as phone-size mockups using real sample wardrobe images from `assets/wardrobe/`, and the four magic moments animated in CSS.

- [ ] **Step 1: Flow designs (opus, pipeline per flow)**

Per flow: UX designer drafts, UI designer lays out screens, motion designer adds motion, UX writer fills copy keys, accessibility specialist and critic review, fix loop until no blocking findings.

- [ ] **Step 2: Mockup artifact (opus)**

UI designer builds `docs/redesign/mockups/index.html` following the artifact-design skill, white canvas, plum and blush tokens, Georgia display. Before and after pairs for key screens.

- [ ] **Step 3: Architect sign-off (fable)**

Architect checks every flow doc against `architecture.md` and `use-cases.md`. Expected: every use case appears in a flow, no sheet remains, hand-offs match.

- [ ] **Step 4: Publish and commit**

```bash
git add docs/redesign
git commit -m "docs: redesign flows and mockups"
git push origin main
```

Publish `docs/redesign/mockups/index.html` with the Artifact tool and send the link to the owner.

- [ ] **Step 5: Owner gate**

Owner approves the artifact or requests changes. Changes loop back to Step 1 for affected flows.

### Task 5: Phase 3 and 4 plan

After owner approval, the architect (fable) writes `docs/superpowers/plans/2026-10-03-redesign-phase-3-4.md`: Lane 1 (tokens, primitives, navigation shell, motion primitives, splash), then one lane per flow with exact files, Maestro flows per use case and gates from the spec, then Phase 4 finish tasks. Commit and push. Build starts without further owner questions.
