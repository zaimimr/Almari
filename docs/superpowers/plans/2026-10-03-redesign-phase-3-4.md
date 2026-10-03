# Almari redesign, Phases 3 and 4, Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the approved redesign (tokens, primitives, three-tab shell without modals, silk motion, splash, every flow F01 to F11 with its new features) with a passing Maestro flow per use case, then finish with regression, accessibility, screenshots, DESIGN.md and a TestFlight build.

**Architecture:** Lane 1 replaces `src/ui` with the token file and the 21 components from `docs/redesign/design-system.md`, the three-tab shell and the splash gate. Lane 2 adds every row of "Domain touches" in `docs/redesign/architecture.md` as pure functions and optional fields in `src/domain`, unit tests first, closet storage version 3 unchanged. Flow lanes then rebuild one route family each on top of those, delete the screens they replace, and prove each use case with a Maestro flow under `.maestro/<flow-slug>/`. Phase 4 runs the full regression, the accessibility pass, the critic pass, screenshots, DESIGN.md and the release.

**Tech Stack:** Expo SDK 57, expo-router (NativeTabs, Stack), React Native 0.86, Reanimated 4.5 + react-native-worklets, expo-image, expo-symbols, expo-haptics, expo-notifications, expo-location, expo-file-system, TypeScript 6 strict, `node --test` via tsx, Maestro 2.11 on the "Closet Development" simulator (Release build through `scripts/e2e.sh`).

**Spec:** `docs/superpowers/specs/2026-10-03-full-redesign-design.md`. Source of truth in priority order: `docs/redesign/owner-feedback.md` (rounds 1, 2, Approval), `docs/redesign/mockups/index.html` (approved mockup, screens are the `S.*` and `AX.*` JS helpers), then `docs/redesign/architecture.md` (Owner decisions and Revision 1 and 2 override earlier text), `use-cases.md`, `design-system.md`, `motion.md`, `copy.md`, `flows/*.md`, `signoff.md`. Where a doc contradicts the mockup or the Approval section, the mockup wins.

## Global Constraints

- Keep Direction A: white canvas `#FFFFFF`, ink `#322E28`, plum `#675469` for actions, blush from the ribbon for small marks, Georgia display, system body type. Light appearance only (`userInterfaceStyle: "light"` stays).
- Mockup tokens win over `design-system.md` where they differ: `blushStrong` is `#BE8077` (tile and calendar disc edge, session dot), `blushEdge` is `#9A5A52` (selected chip border, ChoiceCard disc edge), `paper` `#FEF6DE` exists and is the ChoiceCard art ground. Everything else from the Token file shape in `design-system.md` > Tokens.
- Illustrations are final: the 16 files in `assets/illustrations/*.jpg` (600 x 800, ivory paper, blush and plum scarves). Never re-render, never strip blush or paper. The "Abaya or desi" card uses `style-abaya.jpg` (as the mockup); `style-desi.jpg` stays on disk unused.
- No `presentation: "modal"`, no floating or resizing sheet, no toast, no `router.replace` into a tab from inside a flow. Every former modal is a push or an inline Expander (`architecture.md` > Former modals).
- No feature removed. `src/storage`, `src/state`, the model code and `modules/closet-vision` Swift stay, except the one new Swift module for `accessibilityLanguage`. Closet stays `version: 3`; every new field is optional; `src/domain/closet-v2.fixture.ts` and `closet.test.ts` keep passing.
- Copy only through `src/i18n/en.ts` and `src/i18n/nb.ts`, keys and words from `docs/redesign/copy.md` (glossary, flow tables, Revision 1). No nynorsk. No em dash anywhere (docs, code, copy, commits). No exclamation marks in copy. `npm run strings` must stay green.
- No code comments. Minimum code. Match existing patterns (named exports, `t()` for every string, `confirmAction` for system dialogs).
- Motion: `withTiming` only with tokens from `src/ui/motion.ts`, never `withSpring`, never `ActivityIndicator`, never `LayoutAnimation`, never RN `Animated`. Every moment has a Reduce Motion branch read live from `useReduceMotion()`.
- Accessibility: VoiceOver labels on every control, 44 pt targets (`minHeight`, never `height`), Dynamic Type through `useLargeText()` (`large` at fontScale 1.35, `ax` at 1.6), WCAG AA contrast per the token table, `accessibilityIgnoresInvertColors` on every garment image.
- Tests: `npm run check` (typecheck, lint, prettier, `node --test` domain suite, hard-coded string scan) green on every commit. Every use case ID in `use-cases.md` gets its Maestro flow at the planned path, tagged in a `# UC-Fxx-yy` comment on line 2. Magic moments assert the in-progress `testID` (`moment-loading`, `moment-generating`, `moment-selecting`, `moment-found`) and the result `testID` with `extendedWaitUntil`, never `waitForAnimationToEnd` while a sheen can loop.
- Git: hobby project, each lane works on its own branch in a worktree and merges to `main` fast-forward once its gate passes. Commit messages are conventional (`feat:`, `fix:`, `test:`, `docs:`, `chore:`), no attribution lines, no AI or tool credit.
- Owner decisions that override earlier text: three tabs, Profile pushed from Today; Save look on Today saves at once with the suggested name; Stylist engine switch and the scan speed readout ship in release builds; mood is out of scope; every Domain touches row is in with a unit test first; the Looks tab is "Samling" in bokmål. Units stay on the Body answer (open question 8 was never answered and the build starts without further questions).

## Review Focus

1. A closet written by the shipped app (version 3, `onboardingSteps` of the old shape, `Styling.units`, `ColourProfile.source: "swatch"`, feedback events without `scope`) opens unchanged and Today renders its outfit. Pinned by Task 15 Step 1 (`decodeCloset` of the stored shape with every new field absent, a legacy wore event without `scope`) and Task 20 Step 1 (`lookEntries` ignores piece-scope events and keeps outfit events).
2. Midnight passes while the app is in the foreground or backgrounded with an occasion, a plan or a tomorrow session active: the first `ensureToday` of the new date lands on the everyday outfit, promotes `tomorrow` only on its own date and never drops a planned look. Pinned by Task 21 Steps 1 and 3.
3. "Use my location" tapped with location denied, then again offline, then "Search for your city" offline: one line at a time under the Field, never a dead end, and `placeFrom` never stores NaN or out-of-range coordinates. Pinned by Task 23 Step 1 and Task 26 (`.maestro/start/city.yaml`, `location.yaml`).
4. A piece is removed (or put away) while it sits in today's outfit, in a look planned for today, in "Trying to wear more of" and on the never-wear list: `rediscover`, `wearMore`, `plannedToday` and the Change strip all prune it without throwing. Pinned by Task 16 Step 1 (`wearMoreIds` pruning) and Task 21 Step 1 (the removed-piece morning test and `rediscover` exclusions).
5. The morning notification keeps one schedule: changing the time, switching language, replaying onboarding or deleting all data cancels and recreates (or clears) it, and nothing is scheduled before "You are set". Pinned by Task 24 Step 1 (`notificationPlan` is `null` for Off and after `resetCloset`) and Task 26 (`.maestro/start/notifications.yaml`), Task 49 (`.maestro/profile/notifications.yaml`).

---

## Lanes

Each lane is one developer agent on one branch in one worktree. A lane's gate is the whole of: `npm run check` green; its Maestro folder(s) green on the "Closet Development" simulator (`npm run e2e -- .maestro/<folder>`); its screenshots in `docs/redesign/screens/after/<flow>/` compared by the design critic against the matching `S.*` screens of `docs/redesign/mockups/index.html` (same blocks, same order, same words, same tokens, nothing floating); an accessibility check (Accessibility Inspector audit on the simulator for every new route: no missing label, no target under 44 pt, no contrast warning; VoiceOver order checked by the lane's `labels.yaml` flow asserting `id:` and label pairs). Then rebase on `main`, rerun the gate if `main` moved under it, fast-forward merge, push.

| # | Lane | Branch | Tasks | Starts after | Parallel with |
|---|---|---|---|---|---|
| L1 | Foundation | `lane/foundation` | 1 to 14 | main | L2 |
| L2 | Domain | `lane/domain` | 15 to 24 | main | L1 |
| L3 | F01 Start | `lane/f01-start` | 25 to 28 | L1 and L2 merged | L4, L5, L6, L7, L8 |
| L4 | F02 Add pieces and background tagging | `lane/f02-add-pieces` | 29 to 32 | L1 and L2 | L3, L5, L6, L7, L8 |
| L5 | F04 Closet | `lane/f04-closet` | 33 to 35 | L1 and L2 | L3, L4, L6, L7, L8 |
| L6 | F05 Piece | `lane/f05-piece` | 36 to 38 | L1 and L2 | L3, L4, L5, L7, L8 |
| L7 | F06 Today and F08 Change a piece | `lane/f06-today` | 39 to 43 | L1 and L2 | L3, L4, L5, L6, L8 |
| L8 | F09 Looks and the wear calendar | `lane/f09-looks` | 44 to 46 | L1 and L2 | L3, L4, L5, L6, L7 |
| L9 | F03 Scan | `lane/f03-scan` | 47 | L4 | L10, L11, L12 |
| L10 | F07 Adjust | `lane/f07-adjust` | 48 | L7 | L9, L11, L12 |
| L11 | F10 Build a look | `lane/f10-build` | 49 | L7 and L8 | L9, L10, L12 |
| L12 | F11 Profile and style | `lane/f11-profile` | 50 to 53 | L3, L5 and L7 | L9, L10, L11 |
| L13 | F12 app-wide and Phase 4 | `lane/finish` | 54 to 60 | every lane above | none, sequential |

File ownership (no two parallel lanes touch the same file):

- L1: `src/ui/**`, `src/navigation/**`, `src/features/Splash.tsx`, `src/features/PiecePicker.tsx`, `src/features/ColourChips.tsx`, `src/features/FixtureScanView.tsx`, `src/testing/**`, `src/state/clock.ts`, `src/state/launch.ts`, `src/state/closet.tsx`, `src/state/notifications.ts`, `src/state/location.ts`, `app/_layout.tsx`, `app/index.tsx`, `app/(tabs)/_layout.tsx`, `app/(tabs)/*/_layout.tsx`, `app.json`, `package.json`, `package-lock.json`, `modules/accessibility-language/**`, `assets/brand/**`, `assets/fixtures/**`, `scripts/e2e.sh`, `scripts/scan-fixture.ts`, `.maestro/lib/**`, deletion of the old `.maestro` folders. Later lanes may add new seed scripts under `.maestro/lib/` (append-only, one file per script, never editing an existing one) and new keys to `src/testing/fixtures.ts` (append-only to the `Fixtures` type).
- L2: `src/domain/**` only (and `src/i18n/en.ts`, `nb.ts` for keys the domain reads: `today.greeting.*`, `coverageNote.*`, `notify.*`, `feedback.too-cold`, `feedback.hijab-mismatch`, `role.*List`). Every other lane adds its own keys under a `// ` free, alphabetically placed block in both catalogs; conflicts in `en.ts`/`nb.ts` are append-only and resolved by keeping both sides.
- L3: `app/onboarding/**`, `src/features/onboarding/**`, `src/features/selfie/**`, deletion of `src/features/SamplePoints.tsx`, `SelfieCamera.tsx`, `OnboardingBar.tsx`, `BodyShapes.tsx` (moved to `src/features/onboarding/BodyShapes.tsx`).
- L4: `app/capture/index.tsx`, `app/capture/[id].tsx`, `app/capture/group/[id].tsx`, `app/piece/new.tsx`, `src/features/capture/**`, `src/features/PieceEditor.tsx`, `PhotoChoice.tsx`, `AttributeEditor.tsx`, `Retake.ts`, `src/state/imports.ts` (only `settleWardrobe` call on accept).
- L5: `app/(tabs)/closet/index.tsx`, `src/features/closet/**`, deletion of `src/features/PieceSections.tsx` (its `WeatherSection` moves to L6's `src/features/piece/WeatherChips.tsx`; coordinate: L5 deletes the file, L6 does not import it).
- L6: `app/piece/[id].tsx`, `app/piece/edit/[id].tsx`, `app/cutout/[id].tsx`, `app/label/[id].tsx`, `src/features/piece/**`, `src/features/MissingPiece.tsx` (deleted), `modules/closet-vision/ios/CutoutEditorView.swift` (motion retune only).
- L7: `app/(tabs)/today/index.tsx`, `src/features/today/**`, `src/features/ChangeStrip.tsx`, deletion of `app/today/check.tsx`, `replace.tsx`, `hijab.tsx`, `everyday.tsx`, `style.tsx`, `stylist-results.tsx`, `src/ui/OutfitView.tsx`, `src/ui/OutfitCollage.tsx` (L1 already moved `arrangePieces`).
- L8: `app/(tabs)/looks/index.tsx`, `app/look/[id].tsx`, `app/looks/calendar.tsx`, `src/features/looks/**`.
- L9: `app/capture/scan.tsx`, `src/features/ScanLift.tsx`, `.maestro/scan/**`.
- L10: `app/today/adjust.tsx`, `app/today/pieces.tsx`, `src/features/adjust/**`, `.maestro/adjust/**`.
- L11: `app/look/build.tsx`, `src/features/builder/**`, `.maestro/build-look/**`.
- L12: `app/profile/**`, `src/features/profile/**`, `.maestro/profile/**`, deletion of `app/(tabs)/profile/**` (L1 already removed the tab; the folder is deleted here once its content is moved).
- L13: `.maestro/app-wide/**`, `.maestro/baseline/**`, `docs/redesign/screens/after/**`, `DESIGN.md`, `store/release-notes/next.md`.

Worktree and gate commands, the same for every lane (`<slug>` is the branch slug):

```bash
cd /Users/zaimimran/Dev/Zaim/Almari
git fetch origin
git worktree add ../almari-<slug> -b lane/<slug> origin/main
cd ../almari-<slug>
npm ci
npx expo prebuild --platform ios --clean
REBUILD=1 npm run e2e -- .maestro/baseline
```

```bash
npm run check
npm run e2e -- .maestro/<folder>
git fetch origin && git rebase origin/main
npm run check && npm run e2e -- .maestro/<folder>
cd /Users/zaimimran/Dev/Zaim/Almari && git merge --ff-only lane/<slug> && git push origin main
git worktree remove ../almari-<slug>
```

Orchestrator constraints:

- The simulator is one device. Two lanes cannot run Maestro at the same time on "Closet Development". Either serialize gates, or create a second simulator once (`xcrun simctl create "Closet Development 2" "iPhone 17 Pro"`) and run a lane's gate with `DEVICE="Closet Development 2" npm run e2e -- ...`. Never two gates on one device.
- Every lane after L1 needs a fresh native build: L1 adds `expo-notifications`, `expo-location` and the Swift `accessibility-language` module, so `npx expo prebuild --platform ios --clean` and `REBUILD=1` are required once per worktree created after L1 merges (and once on the owner's phone: `npx expo run:ios --device`, owner-only).
- Owner-only steps: real-phone rows in `use-cases.md` (UC-F01-07 steps 3 and 4, UC-F01-20, UC-F03-02, UC-F12-07), the dev client rebuild on the phone, and the TestFlight install at the end. The orchestrator lists them for the owner at the end of Phase 4; they do not block merges.
- `ios/` is gitignored. A worktree without `ios/` has no Release app until `prebuild` and `REBUILD=1` have run.

Conventions used in every task:

- "Flow doc" means `docs/redesign/flows/<Fxx>.md`; "mockup `S.x`" means that helper in `docs/redesign/mockups/index.html`.
- Maestro step shorthand in tables: `tap "X"` is `tapOn: "X"`, `tap id:x` is `tapOn: { id: x }`, `see "X"` is `assertVisible`, `gone "X"` is `assertNotVisible`, `wait id:x` is `extendedWaitUntil: { visible: { id: x }, timeout: 60000 }`, `scroll "X"` is `scrollUntilVisible` with `timeout: 60000`, `shot name` is `takeScreenshot: docs/redesign/screens/after/<flow>/name`, `type "X"` is `inputText`, `back` is `tapOn: "Back"` (the native chevron's accessibility label is `common.back` through `headerBackTitle` with `headerBackButtonDisplayMode: "minimal"`; the onboarding left item uses the same label), `seed x.sh` is a `# seed: x.sh` header line that `scripts/e2e.sh` runs before the flow.
- Every flow starts with `appId: com.zaimimran.almari`, line 2 `# UC-...` tags, then `launchApp` with `clearState: true` unless the table says `keep state`, and `permissions: { all: allow }` unless the row tests a denied permission (`permissions: { camera: deny }` etc.).
- "Sample closet" setup is `runFlow: ../lib/sample-closet.yaml` (Task 13). "Seeded owned closet" is `seed seed-owned.sh`.
- Copy keys: a lane adds exactly the keys its flow doc's Copy section lists that do not yet exist, with the EN and NB strings from `copy.md`, and removes the keys its flow doc names as cut when their last reader is deleted. `src/domain/i18n.test.ts` already asserts that every key exists in both catalogs; it stays green on every commit.

---

## Lane 1: Foundation

### Task 1: Tokens and the theme file

**Files:**
- Modify: `src/ui/theme.ts` (rewrite)
- Create: `src/ui/useColors.ts`
- Test: `src/domain/theme.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces:

```ts
export const theme = {
  colors: {
    canvas: "#FFFFFF", surface: "#FBF9F7", sunken: "#F2EDE7",
    ink: "#322E28", inkMuted: "#706963", inkDisabled: "#706963", placeholder: "#706963",
    line: "#E6E0DC", lineField: "#948B85",
    plum: "#675469", plumPressed: "#574559",
    plumSoft: "#F3EEF4", plumSoftPressed: "#E6DDE7", plumSoftDeep: "#DDD2DF", onPlum: "#FFFFFF",
    blush: "#E2B1A8", blushStrong: "#BE8077", blushEdge: "#9A5A52", paper: "#FEF6DE",
    error: "#96354A",
    scrim: "rgba(50,46,40,0.55)", scrimPill: "rgba(50,46,40,0.70)", onMedia: "#FFFFFF",
  },
  colorsIncreasedContrast: { inkMuted: "#322E28", line: "#948B85" },
  brand: { ivory: "#F4EDE3", plumGround: "#644E64", sheen: "#FAF8F3" },
  space: { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32, footerInset: 48 },
  radius: { sm: 8, md: 12, lg: 20, full: 999 },
  type: {
    display: { fontFamily: "Georgia", fontSize: 34, lineHeight: 41, letterSpacing: -0.4, maxFontSizeMultiplier: 2 },
    title: { fontFamily: "Georgia", fontSize: 26, lineHeight: 32, letterSpacing: -0.2, maxFontSizeMultiplier: 2 },
    headline: { fontSize: 17, lineHeight: 22, fontWeight: "600" },
    body: { fontSize: 17, lineHeight: 24 },
    subhead: { fontSize: 15, lineHeight: 20 },
    footnote: { fontSize: 13, lineHeight: 18 },
    mark: { fontSize: 12, lineHeight: 16, fontWeight: "600", maxFontSizeMultiplier: 1.4 },
  },
  elevation: {
    flat: {},
    rest: { shadowColor: "#322E28", shadowOpacity: 0.1, shadowRadius: 6, shadowOffset: { width: 0, height: 3 } },
    lift: { shadowColor: "#322E28", shadowOpacity: 0.14, shadowRadius: 12, shadowOffset: { width: 0, height: 6 } },
  },
  size: { touch: 44, controlRegular: 52, controlSmall: 44, iconInline: 17, iconBar: 22, thumb: 40, swatch: 14, swatchLarge: 44, faceCircle: 264, brandMark: 96 },
} as const;
export type Colors = typeof theme.colors;
export function gutterFor(windowWidth: number): 16 | 20; // 20 when width >= 428
```

```ts
// src/ui/useColors.ts
export function useColors(): Colors; // theme.colors, with inkMuted and line swapped when AccessibilityInfo.isDarkerSystemColorsEnabled(), listening to "darkerSystemColorsChanged"
```

- [ ] **Step 1: Write the failing test**

```ts
// src/domain/theme.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { gutterFor, theme } from "../ui/theme";

test("tokens follow the approved mockup", () => {
  assert.equal(theme.colors.blushStrong, "#BE8077");
  assert.equal(theme.colors.blushEdge, "#9A5A52");
  assert.equal(theme.colors.paper, "#FEF6DE");
  assert.equal(theme.colors.plum, "#675469");
  assert.equal(theme.radius.full, 999);
  assert.equal(theme.space.footerInset, 48);
  assert.equal(gutterFor(390), 16);
  assert.equal(gutterFor(428), 20);
  assert.equal(theme.type.title.maxFontSizeMultiplier, 2);
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx tsx --test src/domain/theme.test.ts`
Expected: FAIL (`blushStrong` undefined, `gutterFor` not exported).

- [ ] **Step 3: Rewrite `src/ui/theme.ts` to the Interfaces block above and add `src/ui/useColors.ts`**

`useColors` seeds from `AccessibilityInfo.isDarkerSystemColorsEnabled()` in a `useState` initializer promise, subscribes with `AccessibilityInfo.addEventListener("darkerSystemColorsChanged", setter)`, returns `{ ...theme.colors, ...theme.colorsIncreasedContrast }` when on.

Add `"theme.test.ts"` to the test glob: the `test` script already matches `src/domain/*.test.ts`, so nothing to change.

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx tsx --test src/domain/theme.test.ts`
Expected: PASS. `npm run typecheck` will now fail on every `theme.colors.accent` reader; that is expected until Task 4 renames the call sites.

- [ ] **Step 5: Rename the old token names across the app in one pass**

`accent` to `plum`, `accentSoft` to `plumSoft`, `accentText` to `onPlum`, `background` to `canvas`, `muted` to `inkMuted`, `theme.radius` (number) to `theme.radius.md`, `theme.typography.*` to `theme.type.*` (`heading` to `title`, `caption` to `footnote`):

```bash
grep -rlE 'theme\.(colors\.(accent|accentSoft|accentText|background|muted)|radius\b|typography)' app src modules/closet-vision/src | xargs sed -i '' -E \
  -e 's/theme\.colors\.accentSoft/theme.colors.plumSoft/g' \
  -e 's/theme\.colors\.accentText/theme.colors.onPlum/g' \
  -e 's/theme\.colors\.accent/theme.colors.plum/g' \
  -e 's/theme\.colors\.background/theme.colors.canvas/g' \
  -e 's/theme\.colors\.muted/theme.colors.inkMuted/g' \
  -e 's/theme\.radius([^.])/theme.radius.md\1/g' \
  -e 's/theme\.typography\.heading/theme.type.title/g' \
  -e 's/theme\.typography\.caption/theme.type.footnote/g' \
  -e 's/theme\.typography/theme.type/g'
```

Then `npm run typecheck` and fix the stragglers by hand (the `keyof typeof theme.typography` union in `AppText` becomes `keyof typeof theme.type`).

- [ ] **Step 6: Commit**

```bash
git add src/ui/theme.ts src/ui/useColors.ts src/domain/theme.test.ts app src modules/closet-vision/src
git commit -m "feat: design tokens from the approved mockup"
```

### Task 2: Text, Dynamic Type hook, Reduce Motion hook, hyphenation, announcements

**Files:**
- Create: `src/ui/Text.tsx`, `src/ui/useLargeText.ts`, `src/ui/announce.ts`, `src/domain/hyphenate.ts`
- Modify: `src/ui/motion.ts` (created in Task 3; `useReduceMotion` lives there), `package.json` (add `hyphen`)
- Test: `src/domain/hyphenate.test.ts`

**Interfaces:**
- Consumes: `theme.type`, `useColors()`.
- Produces:

```ts
// src/ui/Text.tsx
export type TextRole = "title" | "headline" | "body" | "subhead" | "footnote" | "mark";
export type TextTone = "ink" | "muted" | "disabled" | "plum" | "error" | "onPlum" | "onMedia";
export function Text(props: TextProps & { role?: TextRole; tone?: TextTone; announce?: boolean; user?: boolean }): JSX.Element;
// user: true marks user-entered content (never hyphenated). Bold Text swaps Georgia for Georgia-Bold on title.
```

```ts
// src/ui/useLargeText.ts
export function useLargeText(): { fontScale: number; large: boolean; ax: boolean; bold: boolean; symbolScale: number };
// large = fontScale >= 1.35, ax = fontScale >= 1.6, bold from AccessibilityInfo.isBoldTextEnabled() + "boldTextChanged", symbolScale = Math.min(fontScale, 2)
```

```ts
// src/ui/announce.ts
export function announce(text: string, options?: { queue?: boolean }): void;
// AccessibilityInfo.announceForAccessibilityWithOptions(text, { queue: options?.queue ?? true })
```

```ts
// src/domain/hyphenate.ts
export function hyphenate(text: string, locale: "en" | "nb"): string;
// soft hyphens (U+00AD) from hyphen/nb-no for words of 12+ characters in nb, hyphen/en-us for 11+ in en; other words untouched
```

- [ ] **Step 1: Install the hyphenation patterns**

Run: `npm install hyphen@^1.10`
Expected: `hyphen` in `dependencies`, lockfile updated.

- [ ] **Step 2: Write the failing test**

```ts
// src/domain/hyphenate.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { hyphenate } from "./hyphenate";

const soft = "­";

test("long bokmål words get soft hyphens at syllables, short words stay", () => {
  assert.ok(hyphenate("eksempelgarderoben", "nb").includes(`eksempel${soft}garderoben`));
  assert.ok(hyphenate("tilgjengelighet", "nb").includes(soft));
  assert.equal(hyphenate("Hijabstiler", "nb"), "Hijabstiler");
  assert.equal(hyphenate("Bruk i dag", "nb"), "Bruk i dag");
});

test("long English words get soft hyphens, eleven letters and up", () => {
  assert.ok(hyphenate("Unavailable", "en").includes(soft));
  assert.equal(hyphenate("Availability".slice(0, 10), "en"), "Availabili");
});
```

- [ ] **Step 3: Run it to verify it fails**

Run: `npx tsx --test src/domain/hyphenate.test.ts`
Expected: FAIL, module not found.

- [ ] **Step 4: Implement `src/domain/hyphenate.ts`**

```ts
import { hyphenateSync as nbSync } from "hyphen/nb-no";
import { hyphenateSync as enSync } from "hyphen/en-us";

const minimum = { en: 11, nb: 12 } as const;
const engines = { en: enSync, nb: nbSync } as const;

export function hyphenate(text: string, locale: "en" | "nb"): string {
  return text.replace(/[\p{L}]+/gu, (word) =>
    word.length >= minimum[locale]
      ? engines[locale](word, { hyphenChar: "­", minWordLength: minimum[locale] })
      : word,
  );
}
```

If `hyphen` ships no types, add `declare module "hyphen/*"` in `src/types/hyphen.d.ts` with `export function hyphenateSync(text: string, options?: { hyphenChar?: string; minWordLength?: number }): string;` and include `src/types` in `tsconfig.json` `include`.

- [ ] **Step 5: Run the test to verify it passes**

Run: `npx tsx --test src/domain/hyphenate.test.ts`
Expected: PASS. If the expected break of `eksempelgarderoben` differs, print `hyphenate("eksempelgarderoben","nb").split(soft)` and keep the test asserting the first break named in `copy.md` rules (`eksempel|garderoben`); if the patterns do not give that break, record the actual break in the test and in `copy.md` > rules (the pattern file is the authority, the doc lists expected breaks).

- [ ] **Step 6: Write `Text`, `useLargeText`, `announce`**

`Text`: wraps RN `Text`, applies `theme.type[role]`, colour from `useColors()` by tone (`muted` = inkMuted, `disabled` = inkDisabled, `plum`, `error`, `onPlum`, `onMedia`), `maxFontSizeMultiplier` from the role (undefined when the role has none), `fontFamily: "Georgia-Bold"` for `title` when `bold`. When `typeof children === "string"` and `!user`, render `hyphenate(children, locale)` (import `locale` from `src/i18n`). When `announce` is true, `useEffect` on the string: skip the first render, then `announce(text)`.

- [ ] **Step 7: Typecheck and commit**

Run: `npm run typecheck`
Expected: clean (nothing imports the new files yet).

```bash
git add src/ui/Text.tsx src/ui/useLargeText.ts src/ui/announce.ts src/domain/hyphenate.ts src/domain/hyphenate.test.ts src/types package.json package-lock.json tsconfig.json
git commit -m "feat: shared Text with Dynamic Type, hyphenation and announcements"
```

### Task 3: Motion tokens, Reduce Motion hook, Silk

**Files:**
- Create: `src/ui/motion.ts`, `src/ui/Silk.tsx`, `src/ui/SheenClock.tsx`
- Test: `src/domain/motion.test.ts`

**Interfaces:**
- Produces:

```ts
// src/ui/motion.ts
import { Easing, ReduceMotion, withTiming } from "react-native-reanimated";
export const motion = {
  duration: { quick: 160, base: 240, settle: 320, arrange: 420, drape: 640, sheen: 1100 },
  timer: { wait: 300, dwell: 700, step: 60, linger: 1500, announce: 2000, loop: 5000 },
  easing: { silk: Easing.bezier(0.22, 0.61, 0.36, 1), fall: Easing.bezier(0.16, 1, 0.3, 1), carry: Easing.bezier(0.5, 0, 0.2, 1), release: Easing.bezier(0.32, 0, 0.67, 0) },
} as const;
export type Duration = keyof typeof motion.duration;
export type EasingName = keyof typeof motion.easing;
export function timing(to: number, duration: Duration, easing: EasingName, callback?: (finished?: boolean) => void): ReturnType<typeof withTiming>;
// always reduceMotion: ReduceMotion.Never so the reduced branch's fades are not skipped by Reanimated
export function useReduceMotion(): boolean; // seeds from AccessibilityInfo.isReduceMotionEnabled(), listens to "reduceMotionChanged"
export const enter: (reduce: boolean) => LayoutAnimation; // FadeIn.duration(base) when reduce, else FadeIn + translateY 4 to 0 over base silk
export const reflow: (reduce: boolean) => LayoutAnimation | undefined; // LinearTransition.duration(settle).easing(silk), undefined when reduce
```

```tsx
// src/ui/Silk.tsx
export type SilkProps =
  | { kind: "placeholder"; shape: "tile" | "row" | "lay" | "chip" | "text"; label: string; style?: StyleProp<ViewStyle>; lines?: number }
  | { kind: "sheen"; peak?: number; label: string; children: ReactNode; style?: StyleProp<ViewStyle> }
  | { kind: "busy"; peak: number; style?: StyleProp<ViewStyle> }
  | { kind: "progress"; value: number; label: string; hidden?: boolean; style?: StyleProp<ViewStyle> };
export function Silk(props: SilkProps): JSX.Element;
```

```tsx
// src/ui/SheenClock.tsx
export function SheenClockProvider({ children }: PropsWithChildren): JSX.Element; // one shared value per screen, started after timer.wait, stops on blur (useIsFocused) and after timer.loop when `usable`
export function useSheen(): { progress: SharedValue<number>; pulse: SharedValue<number>; reduce: boolean };
```

- [ ] **Step 1: Write the failing test**

```ts
// src/domain/motion.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { motion } from "../ui/motion";

test("motion tokens match motion.md", () => {
  assert.deepEqual(motion.duration, { quick: 160, base: 240, settle: 320, arrange: 420, drape: 640, sheen: 1100 });
  assert.deepEqual(motion.timer, { wait: 300, dwell: 700, step: 60, linger: 1500, announce: 2000, loop: 5000 });
});
```

Importing Reanimated under node needs the mock: add to the top of the test `import "react-native-reanimated/mock";` is not available for ESM under tsx; instead keep the tokens in a dependency-free file `src/ui/motionTokens.ts` (durations, timers, bezier control points as tuples) that `motion.ts` imports and wraps with `Easing.bezier`. The test imports `motionTokens.ts`.

- [ ] **Step 2: Run it to verify it fails, implement `motionTokens.ts` and `motion.ts`, run again**

Run: `npx tsx --test src/domain/motion.test.ts` (FAIL, then PASS).

- [ ] **Step 3: Implement `SheenClock.tsx` and `Silk.tsx`**

Sheen band per `motion.md` > Sheen: a `View` with `overflow: "hidden"` and an `Animated.View` 40 percent of the host width, skewed 20 degrees, `experimental_backgroundImage: "linear-gradient(90deg, rgba(250,248,243,0), rgba(250,248,243,PEAK), rgba(250,248,243,0))"`, translated by the shared clock from -160 percent to 360 percent over `sheen` with `carry`, offset by the host's `x` from `onLayout`. Reduce Motion: opacity pulse 0 to peak to 0 over `sheen`, `wait` between. Placeholder: `sunken` fill, the shape's radius (`tile` 4:5 at `radius.md`, `row` 52 pt, `lay` square, `chip` 44 pt capsule, `text` `lineHeight * fontScale` per line); `accessibilityElementsHidden`, the region label carried by the parent (Silk sets nothing). Progress: a 1 pt `lineField` track with a 2 pt `plum` fill scaled on x from the leading edge (`base`, `silk`); `accessibilityRole="progressbar"` with `accessibilityValue { min: 0, max: 100, now }` unless `hidden`.

`Silk busy` draws the band clipped to the parent's capsule at `peak` (0.15 on primary, 0.7 on secondary and `sunken`).

- [ ] **Step 4: Typecheck, lint, commit**

```bash
npm run typecheck && npm run lint
git add src/ui/motion.ts src/ui/motionTokens.ts src/ui/Silk.tsx src/ui/SheenClock.tsx src/domain/motion.test.ts
git commit -m "feat: silk motion tokens, reduce motion hook and the Silk component"
```

### Task 4: Screen, HeaderItem, Footer, Button, Section

**Files:**
- Create: `src/ui/Screen.tsx`, `src/ui/HeaderItem.tsx`, `src/ui/Footer.tsx`, `src/ui/Button.tsx`, `src/ui/Section.tsx`, `src/ui/measure.tsx`, `src/ui/symbol.tsx`
- Modify: `src/ui/index.tsx` (re-export the new components; keep the old `AppText`, `Button`, `Screen`, `FormScreen`, `HeaderAction`, `Field`, `Chip`, `ChoiceGroup`, `PieceTile`, `PiecePhoto`, `Message`, `Notice`, `Filters`, `ErrorMessage` exported under a `legacy` namespace from `src/ui/legacy.tsx` until every lane has deleted its readers), `src/navigation/options.ts`

**Interfaces:**
- Produces:

```tsx
// src/ui/symbol.tsx
export function Symbol({ name, size, tone, weight }: { name: SFSymbol; size: number; tone: TextTone; weight?: "regular" | "medium" | "semibold" }): JSX.Element; // expo-symbols SymbolView, scaled by useLargeText().symbolScale, accessibilityElementsHidden

// src/ui/Button.tsx
export type ButtonVariant = "primary" | "secondary" | "quiet" | "destructive" | "icon";
export type ButtonProps = {
  label: string; onPress: () => void; variant?: ButtonVariant; size?: "regular" | "small";
  icon?: SFSymbol; selectedIcon?: SFSymbol; selected?: boolean; busy?: boolean; busyLabel?: string;
  disabled?: boolean; accessibilityLabel?: string; accessibilityValue?: string; expanded?: boolean;
  media?: boolean; inSurface?: boolean; testID?: string;
};
export function Button(props: ButtonProps): JSX.Element;

// src/ui/HeaderItem.tsx
export type HeaderItemProps = { label: string; onPress: () => void; icon?: SFSymbol; disabled?: boolean; expanded?: boolean; testID?: string };
export function HeaderItem(props: HeaderItemProps): JSX.Element; // text item below `large`, icon item (pencil/checklist/checkmark/xmark by label key) at `large`; accessibilityShowsLargeContentViewer, accessibilityLargeContentTitle

// src/ui/Footer.tsx
export type FooterProps = {
  primary?: ButtonProps; secondary?: ButtonProps; waiting?: boolean; error?: string | null;
  children?: ReactNode; actions?: ButtonProps[]; actionsContent?: ReactNode; media?: boolean;
};
export function Footer(props: FooterProps): JSX.Element;

// src/ui/Screen.tsx
export type ScreenProps = PropsWithChildren<{
  title?: string; large?: boolean; leading?: "back" | "cancel"; onCancel?: () => void;
  actions?: ReactNode; footer?: ReactNode; progress?: { step: number; total: number; label: string };
  scroll?: boolean; gone?: { title: string }; media?: boolean; search?: { placeholder: string; onChangeText: (text: string) => void };
  headerTitleVisible?: boolean; contentRef?: Ref<ScrollView>; testID?: string;
  maintainVisibleContentPosition?: boolean; keyboardFooter?: "ride" | "stay";
}>;
export function Screen(props: ScreenProps): JSX.Element;
// Sets its own header through <Stack.Screen options> (title, headerLargeTitleEnabled, headerLeft, headerRight, headerSearchBarOptions, headerStyle per media). Measures the Footer with onLayout and sets the ScrollView bottom inset to height + space.footerInset. Renders the gone EmptyState with "Go back" (router.back()) under the header; every gone state in the app (piece, edit, label, cut-out, capture confirm, group, look, builder) is <Screen gone={{ title }}>, there is no separate Gone component. Wraps children in SheenClockProvider. The native back chevron is matched in Maestro by its accessibility label t("common.back"): Screen sets headerBackTitle to that label with headerBackButtonDisplayMode "minimal".

// src/ui/Section.tsx
export function Section({ title, count, action, children, testID }: { title?: string; count?: number; action?: { label: string; onPress: () => void }; children: ReactNode; testID?: string }): JSX.Element | null; // null when children are empty

// src/ui/measure.tsx
export function useMeasuredMax(samples: { text: string; role: TextRole; width?: number }[]): number | null; // hidden layer (absolute, opacity 0, accessibilityElementsHidden) measuring the tallest sample at the current fontScale and language
```

- [ ] **Step 1: Write `symbol.tsx`, `Button.tsx`, `HeaderItem.tsx`, `Footer.tsx`, `Section.tsx`, `measure.tsx`, `Screen.tsx` to the specs in `design-system.md` 1 to 5 and the media rule (Colour > Rules)**

Button fills and pressed fills per the table in `design-system.md` 4; `press` is `interpolateColor` on a shared value over `quick` `silk`; busy delays the look by `timer.wait` and draws `Silk busy`; disabled is `inkDisabled` on `sunken` plus `accessibilityState.disabled`; `icon` variant: 44 pt square, 32 pt pressed disc, outline symbol in `inkMuted`, `selectedIcon` in `ink` when selected, crossfade over `quick`. Footer: Waiting renders the primary at opacity 0 with `pointerEvents="none"` and hidden from VoiceOver; pair stacks when either label wraps (measured with `useMeasuredMax`) or at `large`; at `ax` the secondary is not rendered in the Footer (the screen renders it at the end of content via `Footer.secondaryInContent`); error above the buttons as `footnote` `error` announced; `actions` row for Closet select at `control.small`.

Screen: `leading="cancel"` renders a `HeaderItem` with `t("common.cancel")` calling `onCancel`; `progress` renders the 2 pt `Silk progress` under the header with `hidden`; `media` sets `headerStyle.backgroundColor = ink`, `headerTintColor = onMedia`, `headerTitleStyle.color = onMedia`, `StatusBar style="light"`.

- [ ] **Step 2: Update `src/navigation/options.ts`**

```ts
export const stackOptions = {
  headerTintColor: theme.colors.plum,
  headerStyle: { backgroundColor: theme.colors.canvas },
  contentStyle: { backgroundColor: theme.colors.canvas },
  headerShadowVisible: false,
  headerBackButtonDisplayMode: "minimal" as const,
  animation: "default" as const,
};
export function largeTitleOptions(fontScale: number, bold: boolean) {
  return {
    ...stackOptions,
    headerLargeTitleEnabled: true,
    headerLargeTitleStyle: { color: theme.colors.ink, fontFamily: bold ? "Georgia-Bold" : "Georgia", fontSize: 34 * Math.min(fontScale, 1.76) },
    headerTitleStyle: { color: theme.colors.ink },
  };
}
```

`Screen large` calls `largeTitleOptions(useLargeText().fontScale, bold)` and re-sets options when either changes.

- [ ] **Step 3: Move the old exports to `src/ui/legacy.tsx`**

Cut `AppText`, `Screen`, `FormScreen`, `Button`, `HeaderAction`, `Field`, `ErrorMessage`, `Message`, `Notice`, `Filters`, `Chip`, `ChoiceGroup`, `PiecePhoto`, `PieceTile`, `styles` out of `src/ui/index.tsx` into `src/ui/legacy.tsx` unchanged, and change every `from "../src/ui"` / `from "../ui"` import of those names in `app/` and `src/features/` to `.../ui/legacy`. `src/ui/index.tsx` re-exports only the new components. `npm run typecheck` must be clean after this step.

- [ ] **Step 4: Commit**

```bash
npm run check
git add src/ui src/navigation/options.ts app src/features src/state
git commit -m "feat: Screen, HeaderItem, Footer, Button and Section primitives"
```

### Task 5: Row, Chip and ChipRow, Segmented, Field

**Files:**
- Create: `src/ui/Row.tsx`, `src/ui/Chip.tsx`, `src/ui/Segmented.tsx`, `src/ui/Field.tsx`

**Interfaces:**

```tsx
export type RowProps = {
  title: string; meta?: string; leading?: { thumb: Piece } | { lay: Piece[]; size?: "row" | "mini" } | { swatch: string } | { icon: SFSymbol };
  trailing?: "chevron" | "down" | { value: string } | { toggle: boolean; onToggle: (next: boolean) => void; busy?: boolean } | { action: ButtonProps } | "selected";
  onPress?: () => void; below?: ButtonProps; checked?: boolean; expanded?: boolean; accessibilityLabel?: string; media?: boolean; user?: boolean; testID?: string;
};
export function Row(props: RowProps): JSX.Element;

export type ChipKind = "choice" | "control" | "action" | "fact";
export type ChipProps = { label: string; selected?: boolean; onPress: () => void; swatch?: string; kind?: ChipKind; opens?: "expander" | "screen"; tentative?: boolean; dot?: boolean; key?: string; keyLabel?: string; accessibilityLabel?: string; accessibilityValue?: string; role?: "radio" | "checkbox" | "button"; disabled?: boolean; busy?: boolean; inSurface?: boolean; icon?: "xmark"; expanded?: boolean; testID?: string };
export function Chip(props: ChipProps): JSX.Element;
export type ChipRowProps<T extends string> = { label?: string; options: { id: T; label: string; swatch?: string; accessibilityLabel?: string }[]; value: T | T[] | null; onChange: (next: T | T[] | null) => void; layout?: "wrap" | "scroll"; multi?: boolean; optional?: boolean; inSurface?: boolean; testID?: string };
export function ChipRow<T extends string>(props: ChipRowProps<T>): JSX.Element;

export function Segmented<T extends string>({ label, options, value, onChange, disabled, media, icons }: { label?: string; options: readonly { id: T; label: string; icon?: SFSymbol }[]; value: T; onChange: (next: T) => void; disabled?: boolean; media?: boolean; icons?: boolean }): JSX.Element;

export type FieldProps = TextInputProps & { label: string; kind?: "text" | "search" | "rename"; error?: string | null; hideLabel?: boolean; trailing?: "check" | "clear"; busy?: boolean; busyValue?: string; testID?: string };
export function Field(props: FieldProps): JSX.Element;
```

- [ ] **Step 1: Write the four files to `design-system.md` 6 to 9**

Chip: capsule, `minHeight` 44, transparent 2 pt border always drawn, selected `blush` fill with `blushEdge` border, unselected `sunken` plus the 1 pt `lineField` inner edge on `canvas` (choice) and in surface; `fact` kind draws `keyLabel` in `placeholder` then the value in `ink` and a `chevron.down`; `control` draws `chevron.down` for `opens="expander"`, `chevron.right` for `"screen"`, `xmark` when `icon`; the capsule switches to `radius.md` once the label wraps (`onTextLayout` lines > 1). ChipRow single select renders a `radiogroup` View with `radio` chips; `multi` renders `checkbox` chips with `accessibilityState.checked`; `optional` renders `button` chips where a second tap clears. `scroll` layout is a horizontal `ScrollView` from the leading gutter to the screen edge; `ax` turns it to `wrap` unless `layout="scroll"` was forced with `keepScroll`.

Segmented: track `sunken`, thumb `canvas` with a 1 pt `inkMuted` edge translated over `settle` `silk`; vertical `Row` list at `large` or when a label would wrap (measured); on `media` with `icons` each segment shows its symbol.

Field: `surface` fill, 1 pt `lineField` edge, 1.5 pt `plum` focused, 1.5 pt `error` with the footnote under it (input `accessibilityLabel` becomes `"{label}, {error}"` while showing); `search` has a leading `magnifyingglass`; `rename` is the title role with an underline only; `trailing: "check"` draws a `plum` checkmark in the 44 pt clear slot; `busy` draws the `Silk placeholder text` over the input with `busyValue` as `accessibilityValue`.

- [ ] **Step 2: Commit**

```bash
npm run check
git add src/ui/Row.tsx src/ui/Chip.tsx src/ui/Segmented.tsx src/ui/Field.tsx src/ui/index.tsx
git commit -m "feat: Row, Chip, ChipRow, Segmented and Field primitives"
```

### Task 6: Tile and FlatLay

**Files:**
- Create: `src/ui/Tile.tsx`, `src/ui/FlatLay.tsx`, `src/ui/flatLayLayout.ts`
- Modify: `src/ui/OutfitCollage.tsx` (import `arrangePieces` from `flatLayLayout.ts` instead of defining it)

**Interfaces:**

```tsx
export type TileState = "queued" | "preparing" | "ready" | "needsAnswers" | "failed" | "removed" | "putAway";
export type TileProps = {
  image: Piece | ImageSource; label?: string; meta?: string; size: "hero" | "grid" | "strip" | "thumb";
  selected?: boolean; planned?: { short: string; spoken: string }; colour?: { hex: string; name: string; onPress?: () => void; expanded?: boolean };
  state?: TileState; tint?: string; dot?: boolean; onPress?: () => void; onLongPress?: () => void;
  actions?: { name: string; label: string; onPress: () => void }[]; accessibilityLabel: string; selectedLabel?: string; busyLabel?: string; raw?: boolean; testID?: string; onRetry?: () => void; onUndoRemove?: () => void;
};
export function Tile(props: TileProps): JSX.Element;

// src/ui/flatLayLayout.ts
export { arrangePieces } from the former OutfitCollage (moved verbatim, same signature)

export type FlatLayProps = {
  pieces: Piece[]; size: "hero" | "row" | "mini"; keptIds?: string[]; onPiecePress?: (piece: Piece) => void; openId?: string | null;
  state?: "arranging" | "loading"; swapMark?: boolean; emptyRoles?: Role[]; preview?: boolean; hiddenPieces?: boolean;
  revision?: number; order?: string[]; accessibilityLabel?: string; testID?: string; maxSize?: number;
};
export function FlatLay(props: FlatLayProps): JSX.Element;
// hero: square viewport capped at maxSize (236 on Today), each piece an Animated.View with elevation.rest; a change of `pieces` with the same `revision` plays the piece swap per slot in dressing order (top, bottom, layer, shoes, hijab, accessories) step apart, unchanged slots still; state "arranging" shows the sheen clipped to the pieces' alpha (tintColor copies) and testID "moment-generating" while set; swapMark draws arrow.2.squarepath in plum on a 26 pt canvas disc at the hijab's top trailing corner, inside the hijab's hit area; emptyRoles draw dashed lineField silhouettes with VoiceOver-only labels build.slotEmpty
```

- [ ] **Step 1: Move `arrangePieces` to `src/ui/flatLayLayout.ts`, write `Tile.tsx` and `FlatLay.tsx` to `design-system.md` 10 and 11 and the swap motion in `motion.md` > Transitions > Flat lay piece swap**

Tile states and the decoration cap as written; cut-outs sit on `canvas` with `contentFit="contain"`, `elevation.rest` at `grid` and `strip`, `shouldRasterizeIOS` at grid; raw photos in a `radius.md` frame; `preparing` wraps the image in `Silk sheen` with `testID="moment-generating"` on the tile; the selected disc is always laid out and transparent when unselected; `accessibilityActions` from `actions`; `accessibilityIgnoresInvertColors`.

FlatLay accessibility per `design-system.md` 11: hero pieces are buttons labelled by the caller (`accessibilityLabel` per piece built from `change.pieceLabel` by the screen through a `labelFor?: (piece) => string` prop; add it to `FlatLayProps`), `experimental_accessibilityOrder` in dressing order, `hitSlop` to 44 pt, `accessibilityState.expanded` on the piece whose id is `openId`.

- [ ] **Step 2: Commit**

```bash
npm run check
git add src/ui/Tile.tsx src/ui/FlatLay.tsx src/ui/flatLayLayout.ts src/ui/OutfitCollage.tsx src/ui/index.tsx
git commit -m "feat: Tile and FlatLay primitives"
```

### Task 7: Expander, Banner, ResultBar, EmptyState

**Files:**
- Create: `src/ui/Expander.tsx`, `src/ui/Banner.tsx`, `src/ui/ResultBar.tsx`, `src/ui/EmptyState.tsx`, `src/ui/useOneExpander.ts`

**Interfaces:**

```tsx
export function useOneExpander<K extends string>(): { open: K | null; toggle: (key: K) => void; close: () => void }; // one open per screen

export type ExpanderProps = PropsWithChildren<{ id: string; title?: string; value?: string; open: boolean; onToggle: () => void; tone?: "plain" | "attention"; headless?: boolean; actions?: [ButtonProps] | [ButtonProps, ButtonProps]; reserveActions?: boolean; card?: boolean; testID?: string }>;
export function Expander(props: ExpanderProps): JSX.Element;
// headless renders the body only; the trigger outside carries expanded. Body enters after timer.step with opacity and translateY 4 to 0; LinearTransition on the container and siblings (none under reduce). Chevron rotates over settle silk.

export type BannerProps = { tone: "session" | "notice" | "progress"; text: string; actions?: [ButtonProps] | [ButtonProps, ButtonProps]; leading?: SFSymbol | { thumb: Piece }; progress?: { value: number; meta?: string; done?: boolean }; onPress?: () => void; accessibilityLabel?: string; children?: ReactNode; testID?: string };
export function Banner(props: BannerProps): JSX.Element; // progress tone is one button with chevron.right, pressed sunken, moment-generating while !done

export type ResultBarProps = { text?: string; action?: ButtonProps; second?: ButtonProps; focus?: boolean; announce?: boolean; testID?: string };
export function ResultBar(props: ResultBarProps): JSX.Element;

export type EmptyStateProps = { title?: string; line?: string; action?: ButtonProps; secondary?: ButtonProps; mark?: boolean; media?: boolean; testID?: string };
export function EmptyState(props: EmptyStateProps): JSX.Element; // mark draws assets/brand/mark.png on tile.png at 96 pt
```

- [ ] **Step 1: Write the four components and the hook to `design-system.md` 12 to 15, with the inline expand and collapse rows of `motion.md` > Transitions (including the scroll-into-view through `scrollTo` from a worklet via `Screen.contentRef`, not animated under reduce)**

- [ ] **Step 2: Commit**

```bash
npm run check
git add src/ui/Expander.tsx src/ui/Banner.tsx src/ui/ResultBar.tsx src/ui/EmptyState.tsx src/ui/useOneExpander.ts src/ui/index.tsx
git commit -m "feat: Expander, Banner, ResultBar and EmptyState primitives"
```

### Task 8: CameraFrame, ChoiceCard, Swatches, MonthGrid

**Files:**
- Create: `src/ui/CameraFrame.tsx`, `src/ui/ChoiceCard.tsx`, `src/ui/Swatches.tsx`, `src/ui/MonthGrid.tsx`, `src/ui/dates.ts`

**Interfaces:**

```tsx
export type CameraFrameProps = PropsWithChildren<{
  guide?: string; readout?: string; outline?: { frame: Frame; state: "searching" | "found" } | null;
  shutter?: { onPress: () => void; disabled: boolean; canvas?: boolean }; tray?: ReactNode; controls?: ReactNode;
  unavailable?: { title: string; line?: string; action: ButtonProps; secondary?: ButtonProps }; full?: boolean; testID?: string;
}>;
export function CameraFrame(props: CameraFrameProps): JSX.Element;

export type FaceCircleProps = { children: ReactNode; state: "unavailable" | "find" | "guiding" | "ready" | "taken" | "measuring"; hold: SharedValue<number>; guide: string; guideSlotHeight: number; label: string; onActivate?: () => void; faceFound: boolean; busyLabel?: string; testID?: string };
export function FaceCircle(props: FaceCircleProps): JSX.Element; // the selfie circle, ring and arc (two rotating half rings driven by hold), sheen while measuring with testID moment-loading

export type ChoiceOption<T extends string> = { id: T; label: string; image?: ImageSource; description?: string; bust?: boolean };
export function ChoiceCardGroup<T extends string>({ label, options, plain, value, onChange, multi, exclusive, testID }: { label?: string; options: ChoiceOption<T>[]; plain?: { id: T; label: string }[]; value: T | T[] | null; onChange: (next: T | T[] | null) => void; multi?: boolean; exclusive?: T; testID?: string }): JSX.Element;
// card art: expo-image contentFit "cover" in a radius.md frame on paper; bust zooms 1.8x anchored at 50% 12% (the mockup .ccg.bust rule); transition 0; one column at ax with contentFit "contain" at min(240, 30% of safe height)

export function Swatches({ title, colours, testID }: { title: string; colours: { hex: string; name: string }[]; testID?: string }): JSX.Element; // one accessible element labelled colours.paletteLabel

export type MonthGridProps = {
  mode: "wear" | "pick"; month: string; today: string; selected?: string | null; onSelect: (date: string) => void; onMonth: (delta: -1 | 1) => void;
  days?: Record<string, Piece>; from?: string; first?: string; monthLabel: string; wornCount?: number; loading?: boolean; testID?: string;
};
export function MonthGrid(props: MonthGridProps): JSX.Element;

// src/ui/dates.ts
export function shortDate(date: string, locale: Locale): string;     // "Sat 11 Oct" / "lør. 11. okt."
export function fullDate(date: string, locale: Locale): string;      // dateStyle full
export function spokenDate(date: string, locale: Locale): string;    // weekday long, day numeric, month long, no year
export function monthTitle(month: string, locale: Locale): string;   // "October 2026" / "oktober 2026"
export function shortWeekday(date: string, locale: Locale): string;  // "Fri" / "fre."
export function percent(value: number, locale: Locale): string;      // Intl.NumberFormat percent, NB with U+00A0
```

- [ ] **Step 1: Write `dates.ts` with a unit test `src/domain/dates.test.ts`**

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { monthTitle, percent, shortDate, shortWeekday, spokenDate } from "../ui/dates";

test("dates and percentages follow the copy rules", () => {
  assert.equal(shortDate("2026-10-11", "en"), "Sat 11 Oct");
  assert.equal(shortDate("2026-10-11", "nb"), "lør. 11. okt.");
  assert.equal(spokenDate("2026-10-09", "nb"), "fredag 9. oktober");
  assert.equal(monthTitle("2026-10", "en"), "October 2026");
  assert.equal(shortWeekday("2026-10-09", "en"), "Fri");
  assert.equal(percent(0.38, "nb"), "38 %");
  assert.equal(percent(0.38, "en"), "38%");
});
```

Run: `npx tsx --test src/domain/dates.test.ts` (FAIL, implement with `Intl.DateTimeFormat` on `new Date(date + "T12:00:00")`, PASS). Node 26 has full ICU; Hermes too. Keep the locale tags `"en-GB"` for EN (day before month) and `"nb-NO"`.

- [ ] **Step 2: Write `CameraFrame.tsx` (media frame and `FaceCircle`), `ChoiceCard.tsx`, `Swatches.tsx`, `MonthGrid.tsx` to `design-system.md` 17 to 20, the face circle rows of `motion.md` > Magic moments > 4, and Month change**

MonthGrid decides Grid or Rows from `useLargeText()` and `useWindowDimensions()`: grid only when `(width - 2 * gutter) / 7 >= 44` and `28 * symbolScale <= column - 4` and not `ax`. Six week rows always laid out. Cells per the spec; only pressable days are accessible elements labelled with `spokenDate` plus `calendar.day` / `calendar.today` words passed by the caller through `dayLabel(date, worn, today)`; add `dayLabel: (date: string) => string` to the props.

- [ ] **Step 3: Commit**

```bash
npm run check
git add src/ui/CameraFrame.tsx src/ui/ChoiceCard.tsx src/ui/Swatches.tsx src/ui/MonthGrid.tsx src/ui/dates.ts src/domain/dates.test.ts src/ui/index.tsx
git commit -m "feat: CameraFrame, ChoiceCard, Swatches and MonthGrid primitives"
```

### Task 9: PiecePicker and ColourChips shared features

**Files:**
- Create: `src/features/PiecePicker.tsx`, `src/features/ColourChips.tsx`

**Interfaces:**

```tsx
export type PiecePickerProps = {
  pieces: Piece[]; selectedIds: string[]; onToggle: (id: string) => void; onClear?: () => void;
  preview?: boolean; emptyRoles?: Role[]; columns?: 2 | 3; onAddPieces: () => void; testID?: string; countTestID?: string;
};
export function PiecePicker(props: PiecePickerProps): JSX.Element;
// optional FlatLay preview (hero, preview variant) of the selected pieces with empty-slot silhouettes, selection line ("{n} selected" + quiet Clear), category ChipRow scroll (closet.all + categories that have pieces), Tile grid with selected discs (3 columns on the picker, 2 elsewhere, 1 at ax), EmptyState pieces.none + closet.addPieces when pieces is empty, closet.noneFoundTitle + common.showAll when a category is empty

// src/features/ColourChips.tsx
export function ColourChips({ value, onPick, inSurface }: { value: string | null; onPick: (name: string) => void; inSurface?: boolean }): JSX.Element;
// ChipRow wrap of the palette names in src/domain/color.ts (export `colourNames` from it here; Task 17 adds `namedSwatch` next to it) with swatches, labels colour.*; used by the capture tile and confirm (L4), piece detail (L6) and the Change strip (L7)
```

- [ ] **Step 1: Write both (reads the mockup `S.pieces`, `S.wearMore` and `S.pieceColour`)**

Copy keys used already exist (`common.selectedOne`, `common.selectedMany`, `pieces.clear`, `closet.all`, `pieces.none`, `closet.addPieces`, `closet.noneFoundTitle`, `common.showAll`, `tile.label`); check each exists in `en.ts`, add from `copy.md` F07 if missing.

- [ ] **Step 2: Commit**

```bash
npm run check
git add src/features/PiecePicker.tsx src/i18n
git commit -m "feat: shared piece picker"
```

### Task 10: Navigation shell, three tabs, root stack without modals, Profile route folder

**Files:**
- Modify: `src/navigation/Tabs.native.tsx`, `src/navigation/Tabs.tsx`, `app/_layout.tsx`, `app/(tabs)/today/_layout.tsx`, `app/(tabs)/closet/_layout.tsx`, `app/(tabs)/looks/_layout.tsx`
- Create: `app/profile/index.tsx` (moved from `app/(tabs)/profile/index.tsx`, header set through `Screen`; profile routes are flat files under the root Stack, no `app/profile/_layout.tsx`)
- Delete: `app/(tabs)/profile/_layout.tsx`, `app/(tabs)/profile/index.tsx`
- Modify: `src/i18n/en.ts`, `nb.ts` (`nav.looks` NB becomes "Samling"; add `title.calendar`, `title.profile` only if the flow copy needs them, otherwise titles come from existing keys)

- [ ] **Step 1: Three tabs**

```tsx
// src/navigation/Tabs.native.tsx
<NativeTabs tintColor={theme.colors.plum} backgroundColor={theme.colors.canvas}>
  <NativeTabs.Trigger name="today">
    <NativeTabs.Trigger.Label>{t("nav.today")}</NativeTabs.Trigger.Label>
    <NativeTabs.Trigger.Icon sf={{ default: "sun.horizon", selected: "sun.horizon.fill" }} />
  </NativeTabs.Trigger>
  <NativeTabs.Trigger name="closet">
    <NativeTabs.Trigger.Label>{t("nav.closet")}</NativeTabs.Trigger.Label>
    <NativeTabs.Trigger.Icon sf="hanger" />
  </NativeTabs.Trigger>
  <NativeTabs.Trigger name="looks">
    <NativeTabs.Trigger.Label>{t("nav.looks")}</NativeTabs.Trigger.Label>
    <NativeTabs.Trigger.Icon sf={{ default: "rectangle.stack", selected: "rectangle.stack.fill" }} />
  </NativeTabs.Trigger>
</NativeTabs>
```

`Tabs.tsx` (web) mirrors it with Feather `sun`, `grid`, `bookmark` and no profile tab. Set `nb` `"nav.looks": "Samling"`.

- [ ] **Step 2: Root stack**

`app/_layout.tsx`: `SplashScreen.preventAutoHideAsync()` and `SplashScreen.setOptions({ duration: 0, fade: false })` at module scope; `<Stack screenOptions={stackOptions}>` with only `index` and `(tabs)` set to `headerShown: false`; no `presentation: "modal"` anywhere; `cutout/[id]` keeps `gestureEnabled` controlled from inside the screen (`navigation.setOptions`) once the mask is edited. Every other screen sets its own options through `Screen`. Render `<Splash />` (Task 11) above the Stack.

Tab layouts: `app/(tabs)/today/_layout.tsx`, `closet/_layout.tsx`, `looks/_layout.tsx` become `<Stack screenOptions={stackOptions}>` with `index` only; `Screen large` sets the large title per screen. Delete `app/(tabs)/profile/`; move its screen to `app/profile/index.tsx` unchanged except the imports (the F11 lane rewrites it).

Change the old `router.push("/(tabs)/profile")` and the profile header item on Today: Lane 1 adds `HeaderItem` `person.crop.circle` with label `t("nav.profile")` to the existing Today screen's `headerRight` pushing `/profile` (the F06 lane rebuilds the screen; this keeps Profile reachable meanwhile).

- [ ] **Step 3: Verify the app boots on the simulator and every old route still opens as a push**

Run: `npx expo run:ios` (dev client, "Closet Development"), open Closet > Add, Today > Adjust: both push with a back chevron, nothing floats.

- [ ] **Step 4: Commit**

```bash
npm run check
git add -A app src/navigation src/i18n
git commit -m "feat: three tabs, profile pushed from Today, no modal routes"
```

### Task 11: Splash hand-off and the gate

**Files:**
- Create: `src/features/Splash.tsx`, `src/state/launch.ts`, `assets/brand/tile.png`, `assets/brand/mark.png`
- Modify: `src/state/closet.tsx`, `app/index.tsx`, `app.json` (splash plugin), `src/i18n/en.ts`, `nb.ts` (`start.error.title`, `common.tryAgain`, `common.loading` if missing)

**Interfaces:**

```ts
// src/state/closet.tsx
export function ClosetProvider({ children }): JSX.Element; // renders children only when ready; exposes status through ClosetStatusContext
export function useClosetStatus(): { status: "loading" | "ready" | "error"; retry: () => void };
export function useCloset(): { closet; update; reset }; // unchanged

// src/state/launch.ts
export type LaunchIntent = { day: "today" | "tomorrow" } | null;
export function setLaunchIntent(intent: LaunchIntent): void;
export function takeLaunchIntent(): LaunchIntent; // returns and clears
export function registerHandoffHeader(ref: RefObject<View>): void; // first header of the destination, focused at hand-off
export function onHandoff(listener: () => void): () => void;
export function setLastAdded(ids: string[]): void;   // Add pieces writes the ids it just accepted
export function takeLastAdded(): string[];           // Closet reads and clears them on focus (the "N added" Banner)
```

- [ ] **Step 1: Make the brand assets**

Run in the scratchpad with Python Pillow (`python3 -m pip install pillow` if missing): `tile.png` 480 x 480 (3x of 160) filled `#644E64` with continuous-corner radius 22.5 percent (approximate with a superellipse mask), alpha outside; `mark.png` by keying `assets/brand/icon.png` against its plum ground (colour distance to `#644E64` below 60 becomes transparent) and checking the scarf edge at 3x on the tile. Copy both to `assets/brand/`. Update the splash plugin in `app.json`:

```json
["expo-splash-screen", { "image": "./assets/brand/tile.png", "imageWidth": 160, "backgroundColor": "#FFFFFF" }]
```

and add `"CADisableMinimumFrameDurationOnPhone": true` to `ios.infoPlist`.

- [ ] **Step 2: Rework `ClosetProvider`**

Keep the load logic. Replace the `Message` branch with `null` children and a `ClosetStatusContext` value `{ status, retry }` provided around everything (so `Splash` can read it from outside the data context). Keep `setLanguage(language)` and the `Fragment key={locale}` remount.

- [ ] **Step 3: Write `Splash.tsx`**

Absolute fill `canvas` overlay above the Stack: `tile.png` at 160 pt centred (safe-area independent), `mark.png` same rect at opacity 0. On overlay `onLayout` and the mark's `onLoad`, call `SplashScreen.hide()`, then play the drape: opacity 0 to 1 (`base`, `silk`), translateY -10 to 0 (`drape`, `fall`); Reduce Motion: opacity only (`base`). At drape end, if `status` is still `loading`, hold still and after `timer.wait` announce `common.loading` once; when `ready`, hand off: set `pointerEvents="none"`, hide from VoiceOver, fade the overlay out (`settle`, `silk`), fire `onHandoff` listeners, focus the registered header (`AccessibilityInfo.setAccessibilityFocus`), unmount. `error`: the splash error block per `design-system.md` > Screen recipes > Splash error and `motion.md` M2b (tile settles up by translateY only, title and Try again fade in after `step`, `accessibilityViewIsModal`, focus to the title, ScrollView at `ax`, Try again at least `space.xl` above the bottom inset; Try again calls `retry()`). Until hand-off the Stack container has `accessibilityElementsHidden` and `importantForAccessibility="no-hide-descendants"` (pass a flag from `Splash` through `launch.ts`'s `onHandoff`). Mount once per JS start (module-level `let played = false`).

- [ ] **Step 4: The gate**

```tsx
// app/index.tsx
export default function Index() {
  const { closet } = useCloset();
  const response = Notifications.useLastNotificationResponse();
  const day = response?.notification.request.content.data?.day;
  if (day === "today" || day === "tomorrow") setLaunchIntent({ day });
  return <Redirect href={closet.styling.onboarded ? "/today" : "/onboarding"} />;
}
```

(`expo-notifications` is installed in Task 12; this task adds the import and the install together or lands after Task 12. Order the two tasks so Task 12 commits first.)

- [ ] **Step 5: Maestro check that the splash hands off and the error state is reachable**

Flows land in the F01 lane (`.maestro/start/launch.yaml`, `closet-error.yaml`); Lane 1 checks by hand on the simulator: cold launch shows the plum tile, the scarf drapes, Today appears under it with no white flash. For the error: `xcrun simctl terminate`, write `closet.v3` as `"{"` with sqlite3 (see `.maestro/lib/break-closet.sh`, Task 13), launch, see the centred block with Try again above the home indicator.

- [ ] **Step 6: Commit**

```bash
npm run check
git add src/features/Splash.tsx src/state/launch.ts src/state/closet.tsx app/index.tsx app.json assets/brand/tile.png assets/brand/mark.png src/i18n
git commit -m "feat: animated scarf splash with hand-off and the closet error state"
```

### Task 12: New dependencies, notifications and location state, VoiceOver language module

**Files:**
- Modify: `package.json`, `app.json`
- Create: `src/state/notifications.ts`, `src/state/location.ts`, `modules/accessibility-language/expo-module.config.json`, `modules/accessibility-language/ios/AccessibilityLanguage.podspec`, `modules/accessibility-language/ios/AccessibilityLanguageModule.swift`, `modules/accessibility-language/src/index.ts`, `modules/accessibility-language/src/index.web.ts`
- Modify: `src/i18n/index.ts` (`setLanguage` also calls the module)

**Interfaces:**

```ts
// src/state/notifications.ts
export type NotificationPlan = { hour: number; minute: number; title: string; body: string; data: { day: "today" | "tomorrow" } };
export async function askNotificationPermission(): Promise<"granted" | "denied">;
export async function notificationPermission(): Promise<"granted" | "denied" | "undetermined">;
export async function syncSchedule(plan: NotificationPlan | null): Promise<void>; // cancelAllScheduledNotificationsAsync, then one calendar trigger { hour, minute, repeats: true } when plan is set and permission granted
export function openSettings(): void; // Linking.openSettings()

// src/state/location.ts
export type Located = { name: string; latitude: number; longitude: number };
export async function locatePhone(): Promise<{ ok: true; place: Located } | { ok: false; reason: "denied" | "unavailable" | "offline" }>;
// requestForegroundPermissionsAsync; getCurrentPositionAsync({ accuracy: Accuracy.Low }); reverseGeocodeAsync -> city ?? subregion ?? region; offline when the geocode throws with no network (expo-network isConnected false)

// modules/accessibility-language/src/index.ts
export function setAccessibilityLanguage(tag: "en" | "nb-NO"): void;
```

- [ ] **Step 1: Install and configure**

Run: `npx expo install expo-notifications expo-location`
Add to `app.json` plugins:

```json
["expo-notifications", { "icon": "./assets/brand/icon.png", "color": "#675469" }],
["expo-location", { "locationWhenInUsePermission": "Find your city for the weather. Rounded to your city, sent only to Apple for the forecast." }]
```

and the NB strings for both permissions in `locales/nb.json` (`NSLocationWhenInUseUsageDescription`: "Finn byen din for værmeldingen. Avrundet til byen, sendt bare til Apple for værmeldingen.").

- [ ] **Step 2: Swift module**

`modules/accessibility-language/ios/AccessibilityLanguageModule.swift`:

```swift
import ExpoModulesCore

public class AccessibilityLanguageModule: Module {
  public func definition() -> ModuleDefinition {
    Name("AccessibilityLanguage")
    Function("set") { (tag: String) in
      DispatchQueue.main.async { UIApplication.shared.accessibilityLanguage = tag }
    }
  }
}
```

`expo-module.config.json`: `{ "platforms": ["apple"], "apple": { "modules": ["AccessibilityLanguageModule"] } }`. Podspec copied from `modules/closet-vision/ios/ClosetVision.podspec` with the name changed. `src/index.ts`: `requireNativeModule("AccessibilityLanguage")` guarded with `requireOptionalNativeModule`, web no-op. `src/i18n/index.ts` `setLanguage` calls `setAccessibilityLanguage(locale === "nb" ? "nb-NO" : "en")` after computing `locale`, and once at module load.

- [ ] **Step 3: Prebuild and build**

Run: `npx expo prebuild --platform ios --clean && REBUILD=1 npm run e2e -- .maestro/baseline`
Expected: the Release simulator app builds with the three new native pieces; `baseline/routes.yaml` still passes (it will be rewritten in Phase 4; if it fails only on removed modal text, update its taps to the push titles).

- [ ] **Step 4: Commit**

```bash
npm run check
git add package.json package-lock.json app.json locales/nb.json src/state/notifications.ts src/state/location.ts modules/accessibility-language src/i18n/index.ts
git commit -m "feat: notifications, location and VoiceOver language modules"
```

### Task 13: Test fixtures, clock, scan feed, Maestro infrastructure

**Files:**
- Create: `src/testing/fixtures.ts`, `src/state/clock.ts`, `src/features/FixtureScanView.tsx`, `assets/fixtures/scan/kameez-dupatta/frames.json`, `assets/fixtures/scan/kameez-dupatta/frame-1.jpg`, `frame-2.jpg`, `kameez.png`, `dupatta.png`, `scripts/scan-fixture.ts`, `.maestro/lib/fixture.sh`, `.maestro/lib/clear.sh`, `.maestro/lib/break-closet.sh`, `.maestro/lib/seed-owned.sh`, `.maestro/lib/seed-wears.sh`, `.maestro/lib/seed-looks.sh`, `.maestro/lib/seed-capture.sh`, `.maestro/lib/seed-coverage.sh`, `.maestro/lib/sample-closet.yaml`, `.maestro/lib/skip-onboarding.yaml`
- Create: `src/state/forecast.ts` (`fetchForecast(latitude, longitude)` wrapping `ClosetVision.forecast` with the fixture)
- Modify: `scripts/e2e.sh`, `src/state/closet.tsx` (await `loadFixtures()` before `repository.load()`), `src/storage/local.native.ts` (`failWrite`), `src/state/imports.ts` (`slowPrepare`, `failPrepare`), `src/features/today/useToday.ts` and every `new Date()` in `app/`, `src/state/`, `src/features/` (replace with `now()`)
- Delete: `.maestro/04-capture/`, `.maestro/07-model/`, `.maestro/attributes/`, `.maestro/care-label/`, `.maestro/labels/`, `.maestro/onboarding/`, `.maestro/profile-onboarding-builder/`, `.maestro/stylist/`, `.maestro/wardrobe/` (seed scripts move to `.maestro/lib/`)

**Interfaces:**

```ts
// src/testing/fixtures.ts
export type Fixtures = {
  now?: string;                       // ISO; the clock starts here and runs
  scan?: string;                      // folder name under assets/fixtures/scan
  forecast?: ForecastResult | "fail"; // replaces ClosetVision.forecast
  failWrite?: boolean;                // closetStorage.write rejects once, then clears the flag
  slowPrepare?: number;               // ms added per import job
  failPrepare?: number;               // the first N import jobs fail (L4 reads it)
  failCapture?: number;               // the first N scan captures reject (L9 reads it)
  studio?: "ok" | "offline" | "limit" | "fail"; // L4 reads it in src/state/studio.ts
  cameraFails?: boolean;              // selfie capture rejects (L3 reads it)
  language?: "en" | "nb";            // ClosetProvider calls setLanguage on load
  offline?: boolean;                  // expo-network reports disconnected; forecast, Studio and geocode reject
  launchDay?: "today" | "tomorrow";  // app/index.tsx treats it as a notification tap
};
export let fixtures: Fixtures;        // {} on devices; read once from Documents/almari-fixtures.json
export async function loadFixtures(): Promise<void>;
export function scanFixture(name: string): { frames: NativeScanFrame[]; images: number[]; cutouts: Record<string, number> } | null;

// src/state/clock.ts
export function now(): Date; // fixtures.now ? new Date(Date.parse(fixtures.now) + (Date.now() - loadedAt)) : new Date()
```

```sh
# .maestro/lib/fixture.sh  usage: fixture.sh now=2026-10-05T07:00:00+02:00 scan=kameez-dupatta failWrite=true
# writes Documents/almari-fixtures.json in the app container (values parsed as JSON when they look like JSON, else strings)
# .maestro/lib/clear.sh      removes the fixtures file and terminates the app
# .maestro/lib/break-closet.sh  writes "{" into closet.v3 so the closet cannot open
# .maestro/lib/seed-owned.sh    the former wardrobe/seed-owned.sh: Rose tunic, Grey trousers, Black boots, Sand hijab, plus a navy blazer (layer, sleeve long), an ankle trousers, a knee skirt, an abaya, a long-sleeved hip-length blouse, a chiffon hijab; all with createdAt in September
# .maestro/lib/seed-wears.sh    adds wore events: five pieces marked as worn (scope piece) on 2026-10-01, an outfit wear on 2026-10-02 (Rose tunic, Grey trousers, Black boots, Sand hijab) and one on 2026-09-12; the olive maxi dress last worn 2026-03-14
# .maestro/lib/seed-looks.sh    a saved look "Eid lunch" (occasion eid, plannedFor 2026-10-11) and "Office navy"
# .maestro/lib/seed-capture.sh  the former 04-capture/seed-capture.sh (group of three plus one single job)
# .maestro/lib/seed-coverage.sh the former attributes/seed.sh (a kurta with a proposed length and a review job)
# .maestro/lib/seed-owned-everyday.sh  seed-owned.sh plus styling.everyday { occasion everyday, style western, hijab always, sample false, coverage moderate }, wardrobe owned, onboarded true, name Sara
# .maestro/lib/ax5.sh / ax3.sh / default-size.sh   xcrun simctl ui "$DEVICE" content_size accessibility-extra-extra-extra-large | accessibility-large | medium
# .maestro/lib/reduce-motion.sh / reduce-motion-off.sh  xcrun simctl spawn "$DEVICE" defaults write com.apple.Accessibility ReduceMotionEnabled -bool true|false
# .maestro/lib/set-location.sh  xcrun simctl location "$DEVICE" set 59.9139,10.7522
# Lanes add their own seeds here as new files (seed-hijabs.sh, seed-queued.sh, seed-duplicate.sh, seed-advice.sh, seed-outfit-jobs.sh, seed-looks-missing.sh), each following seed-owned.sh's pattern (terminate, jq into closet.v3, copy photos)
```

- [ ] **Step 1: Fixture loading and the clock**

`fixtures.ts` reads `new File(Paths.document, "almari-fixtures.json")` when `exists`, parses, sets `fixtures`, records `loadedAt`. `ClosetProvider` awaits `loadFixtures()` first. `clock.ts` as above. Replace `new Date()` across `app/`, `src/state/`, `src/features/` with `now()` (`grep -rn "new Date()" app src/state src/features`). `closetStorage.write` in `src/storage/local.native.ts` wraps the write: when `fixtures.failWrite` is set, reject with `new Error("fixture")` once and clear the flag. `ClosetVision.forecast` calls go through `src/state/forecast.ts` `fetchForecast(lat, lon)` which returns the fixture when set. The import runner adds `await wait(fixtures.slowPrepare)` per job when set. Studio and the selfie camera read their fixture keys in their lanes.

- [ ] **Step 2: Scan feed**

`scripts/scan-fixture.ts` (run with `npx tsx scripts/scan-fixture.ts`): reads `src/domain/scan.ts` `readFrame` encoding (labels is a base64 `Uint8Array` of `cols * rows` cells, colours a base64 Float32 Lab triple per cell; confirm by reading `readFrame`), and writes `frames.json`: 4 frames with no held piece (body only, a person label block in the centre, hands at the sides), 8 frames with an `upper` block covering the kameez cut-out's alpha (sampled from `assets/wardrobe/sage-kurta.png` into the 36 x 48 grid, colours from its pixels) held still within `stillOverlap`, then 4 empty frames, then 8 frames with `ivory-hijab.png` as a `head` block. `frame-1.jpg` and `frame-2.jpg` are those two wardrobe PNGs composited on a dark room gradient at 1080 x 1440 (Pillow in the scratchpad). `kameez.png` and `dupatta.png` are the two cut-outs copied.

`FixtureScanView.tsx` implements `LiveScanHandle` with the same props as `LiveScanView` (`mode`, `onFrame`, `onState`, `style`): renders the current frame image, emits `frames[i]` every `1000 / scanFps` ms with `at` rebased to now, loops the last frame; `capture(id, box, kind)` copies the cut-out for the current phase into Documents with `keepPhotoAs(assetUri, id)` and resolves `{ photo, region: null, sticker: { name: <cutout>, frame: box }, box, milliseconds: {} }`. The scan screen (F03 lane) renders `FixtureScanView` when `fixtures.scan` is set; Lane 1 only ships the view and the assets.

- [ ] **Step 3: `scripts/e2e.sh` runs per flow with seeds**

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
udid=$(xcrun simctl list devices | grep "$device" | grep -oE '[0-9A-F-]{36}' | head -1)
[ $# -gt 0 ] || set -- .maestro/*/
status=0
for folder in "$@"; do
  [ "$(basename "$folder")" = "lib" ] && continue
  for flow in "$folder"/*.yaml; do
    sh .maestro/lib/clear.sh
    grep -E '^# seed: ' "$flow" | sed -E 's/^# seed: //' | tr ',' '\n' | while read -r seed; do
      [ -n "$seed" ] && DEVICE="$device" sh ".maestro/lib/$seed"
    done
    out=$(mktemp -d)
    ~/.maestro/bin/maestro --device "$udid" test --test-output-dir "$out" "$flow" || status=$?
    find "$out" -type d -name takeScreenshot -exec cp -R {}/. . \;
  done
done
exit $status
```

Seed scripts take `DEVICE` from the environment (the old ones hard-coded the name). `fixture.sh` arguments may also be given in the flow header as `# seed: fixture.sh now=2026-10-05T07:00:00+02:00` (the loop passes the rest of the line as arguments: use `set -- $seed; sh ".maestro/lib/$1" "${@:2}"` in bash, so run the loop with `bash`).

- [ ] **Step 4: Shared flows**

`.maestro/lib/skip-onboarding.yaml`: `launchApp` with `clearState`, then on each step `tapOn: "Next"` until `"You are set"` (repeat up to 11 with `while: notVisible`). `.maestro/lib/sample-closet.yaml`: `runFlow: skip-onboarding.yaml`, `tapOn: "Try the sample closet"`, `extendedWaitUntil: { visible: { id: today-outfit } }`. Until the F01 lane lands, the old onboarding has "Skip"; keep the old `.maestro/onboarding/skip.yaml` text under `lib/skip-onboarding.yaml` and let L3 rewrite it (L3 owns `lib/skip-onboarding.yaml` and `sample-closet.yaml` from then on).

- [ ] **Step 5: Delete the old Maestro folders and move the seeds**

```bash
git mv .maestro/wardrobe/seed-owned.sh .maestro/lib/seed-owned.sh
git mv .maestro/04-capture/seed-capture.sh .maestro/lib/seed-capture.sh
git mv .maestro/attributes/seed.sh .maestro/lib/seed-coverage.sh
git rm -r .maestro/04-capture .maestro/07-model .maestro/attributes .maestro/care-label .maestro/labels .maestro/onboarding .maestro/profile-onboarding-builder .maestro/stylist .maestro/wardrobe
```

Then edit the moved scripts to read `DEVICE`, extend `seed-owned.sh` with the pieces listed in the Interfaces block (ids `seed-blazer`, `seed-ankle-trousers`, `seed-knee-skirt`, `seed-abaya`, `seed-blouse`, `seed-chiffon-hijab`, attributes `sleeve`, `length`, `fabric` set with `sources` confirmed where the use cases need a known value, left unset where "Needs details" must show: `seed-dress` with no sleeve and no length).

- [ ] **Step 6: Run the baseline and commit**

Run: `npm run e2e -- .maestro/baseline`
Expected: PASS (the only remaining folder).

```bash
npm run check
git add -A src/testing src/state scripts .maestro assets/fixtures src/storage src/features app
git commit -m "test: fixtures file, clock, scan feed and per-flow seed runner"
```

### Task 14: Lane 1 gate and merge

- [ ] **Step 1: Device checks the design system asks of Lane 1**

On the simulator at AX5 (`xcrun simctl ui "Closet Development" content_size accessibility-extra-extra-extra-large`) with bokmål set in the old Profile: the tab bar long press shows the Large Content Viewer with "I dag", "Garderobe", "Samling"; the large titles fit at 60 pt on a 375 pt phone ("iPhone SE (3rd generation)" simulator, create it if missing). With VoiceOver on the owner's phone (owner-only, can be deferred): `radio` chips read their position in English and bokmål; if not, switch `Chip` single select to `button` plus `selected` (one flag in `Chip.tsx`). Record both results in `docs/redesign/signoff.md` under a new "Lane 1 device checks" heading.

- [ ] **Step 2: Gate**

```bash
npm run check
npm run e2e -- .maestro/baseline
```

- [ ] **Step 3: Merge**

Rebase, rerun, `git merge --ff-only lane/foundation`, push. Tell the orchestrator that every later worktree needs `npx expo prebuild --platform ios --clean` and `REBUILD=1`.

---

## Lane 2: Domain touches

Every task here is TDD: the test file first, run red, implement, run green, commit. Run one file with `npx tsx --test src/domain/<file>.test.ts`, the suite with `npm test`. The closet stays `version: 3`; every new field is optional and `decodeCloset` accepts its absence. Shared fixture helpers go in `src/domain/test-helpers.ts` (not matched by the test glob):

```ts
// src/domain/test-helpers.ts
import { emptyCloset, savePiece, type Closet, type Piece } from "./closet";
import { addSampleWardrobe } from "./samples";
import { clockFor, saveEverydayStyle } from "./today";

export const oslo = "Europe/Oslo";
export const at = (iso: string) => clockFor(new Date(iso), oslo);
export function piece(id: string, category: Piece["category"], extra: Partial<Piece> = {}): Piece {
  return { id, name: id, category, photo: `${id}.png`, createdAt: "2026-09-01T08:00:00.000Z", source: "owned", ...extra };
}
export function ownedCloset(pieces: Piece[], base: Closet = emptyCloset): Closet {
  return pieces.reduce((closet, item) => savePiece(closet, item), { ...base, styling: { ...base.styling, wardrobe: "owned" as const } });
}
export function styledSample(iso = "2026-10-02T08:00:00+02:00"): Closet {
  return saveEverydayStyle(addSampleWardrobe(emptyCloset), { occasion: "everyday", style: "western", hijab: "always", sample: true }, at(iso), true);
}
```

### Task 15: Closet types, onboarding steps, name and greeting

**Files:**
- Modify: `src/domain/closet.ts` (types and decoders), `src/domain/onboarding.ts`, `src/i18n/en.ts`, `src/i18n/nb.ts`
- Create: `src/domain/test-helpers.ts`, `src/domain/greeting.ts`
- Test: `src/domain/onboarding.test.ts` (extend), `src/domain/closet.test.ts` (extend)

**Interfaces:**

```ts
// closet.ts additions
export const hijabStyles = ["hijab", "shayla", "al-amira", "khimar", "chador", "niqab", "burqa"] as const;
export type HijabStyle = (typeof hijabStyles)[number];
export type Coverage = "full" | "moderate" | "relaxed" | "own";
export type Sparkle = "plain" | "little" | "heavy" | "bridal";
export type NeverWear = { kind: GarmentKind } | { colour: string; on: "clothes" | "hijabs" } | { pattern: Pattern };
export type StyleProfile = { ...existing; hijabStyles?: HijabStyle[]; sparkle?: Sparkle | null; neverWear?: NeverWear[]; wearMore?: string[]; hijabAnswered?: true; coverageAnswered?: true };
export type NotificationTime = "06:00" | "07:00" | "08:00" | "21:00";
export type Place = { name: string; latitude: number; longitude: number; source?: "device" | "search" };
export type Styling = { ...existing; name?: string; notification?: NotificationTime | null };
export type EverydayStyle = { ...existing; exposure?: "mostly-indoors" | "time-outside" | null };
export type Session = { ...existing; date?: string };
export type TodayState = { ...existing; tomorrow?: Session; active: "everyday" | "occasion" | "tomorrow" };
export type Look = { ...existing; plannedFor?: string };
export type Closet = { ...existing; setNames?: Record<string, string> };
export type FeedbackKind = ...existing | "liked" | "disliked";
export type FeedbackEvent = { ...existing; scope?: "piece" };
export type ImportJob = { ...existing; keepAsSet?: boolean };
export function coverageNeedFor(level: Coverage | null, own?: CoverageNeed): CoverageNeed | undefined; // "relaxed" gives { sleeve: "any", hem: "any" }

// onboarding.ts
export const onboardingSteps = ["name", "hijab", "hijabStyles", "coverage", "style", "fit", "sparkle", "place", "notifications", "colours", "done"] as const;
export type Answers = {
  name: { name: string | null };
  hijab: { hijab: "always" | "sometimes" | "no" | null };
  hijabStyles: { hijabStyles: HijabStyle[] | null };
  coverage: { coverage: Coverage | null; answered: boolean };
  style: { styleLean: StyleProfile["styleLean"] };
  fit: { fit: StyleProfile["fit"] };
  sparkle: { sparkle: Sparkle | null };
  place: { place: Place | null };
  notifications: { notification: NotificationTime | null };
  colours: { colour: ColourProfile | null; colourLean: StyleProfile["colourLean"] };
  body: { units: Units; heightCm: number | null; bodyShape: BodyShape | null };
};
export function stepsFor(answers: Answers): OnboardingStep[]; // drops "hijabStyles" when hijab === "no"
export function skipStep(step: OnboardingStep, answers: Answers): OnboardingStep;
export function previousStep(step: OnboardingStep, answers: Answers): OnboardingStep | null;
export function answersFrom(closet: Closet): Answers; // hijab: "sometimes" when hijabAnswered or an everyday style exists and everyday.hijab is null; null when never answered
export function applyAnswer<S extends keyof Answers>(closet: Closet, step: S, answer: Answers[S], clock: Clock): Closet; // hijab sets hijabAnswered; coverage sets coverageAnswered when answered; style writes styleLean and everyday.style ("both" keeps or sets style "western" on the preset, styleLean "both")
export function finishOnboarding(closet: Closet, clock: Clock): Closet; // onboarded true; writes the everyday style { occasion: "everyday", style: from styleLean (desi -> desi, else western), hijab: everyday?.hijab ?? from the hijab answer, sample: false, coverage from coverageLevel } when none exists
export function setName(closet: Closet, name: string): Closet; // trims, 40 chars, empty removes the field

// greeting.ts
export function greeting(name: string | null | undefined, hour: number, locale: Locale): string; // morning < 12, afternoon < 18, evening; keys today.greeting.{morning,afternoon,evening} with {name}, *Plain without
export function greetingShort(name: string, locale: Locale): string; // today.greeting.short
```

- [ ] **Step 1: Write the failing tests**

Append to `src/domain/closet.test.ts`:

```ts
test("a closet from the shipped app opens with every new field absent", () => {
  const stored = JSON.parse(JSON.stringify(addSampleWardrobe(emptyCloset)));
  stored.styling.units = "metric";
  stored.styling.profile.colour = { skin: [60, 10, 20], hair: null, eyes: null, undertone: "warm", depth: "medium", contrast: "medium", season: "warm-autumn", source: "swatch" };
  stored.feedback = [{ id: "e1", at: "2026-09-12T08:00:00.000Z", kind: "wore", pieceIds: ["sample-1"], request: stored.styling.everyday ?? { occasion: "everyday", style: "western", garmentType: null, keptIds: [], excludedIds: [], weather: { source: "unknown" }, hijab: null, wardrobe: "sample" }, engine: "rules" }];
  const closet = decodeCloset(JSON.stringify(stored));
  assert.equal(closet.version, 3);
  assert.equal(closet.styling.name, undefined);
  assert.equal(closet.styling.notification, undefined);
  assert.equal(closet.styling.profile.hijabStyles, undefined);
  assert.equal(closet.styling.profile.neverWear, undefined);
  assert.equal(closet.feedback[0]?.scope, undefined);
  assert.equal(closet.styling.profile.colour?.source, "swatch");
});

test("new optional fields survive a round trip", () => {
  const closet: Closet = { ...emptyCloset, setNames: { "a,b": "Eid lunch" }, styling: { ...emptyCloset.styling, name: "Sara", notification: "21:00", profile: { ...neutralProfile, hijabStyles: ["hijab", "shayla"], sparkle: "heavy", neverWear: [{ kind: "skirt" }, { colour: "Black", on: "clothes" }, { pattern: "stripe" }], wearMore: ["p1"], hijabAnswered: true, coverageAnswered: true, coverageLevel: "relaxed" } } };
  const again = decodeCloset(JSON.stringify(closet));
  assert.deepEqual(again.styling.profile, closet.styling.profile);
  assert.equal(again.styling.name, "Sara");
  assert.equal(again.styling.notification, "21:00");
  assert.deepEqual(again.setNames, { "a,b": "Eid lunch" });
});
```

Append to `src/domain/onboarding.test.ts`:

```ts
import { answersFrom, applyAnswer, finishOnboarding, onboardingSteps, previousStep, setName, skipStep, stepsFor } from "./onboarding";
import { greeting } from "./greeting";
import { at } from "./test-helpers";

test("ten steps in the owner's order, hijab styles skipped after Not needed", () => {
  assert.deepEqual([...onboardingSteps], ["name", "hijab", "hijabStyles", "coverage", "style", "fit", "sparkle", "place", "notifications", "colours", "done"]);
  const answers = answersFrom(emptyCloset);
  assert.equal(stepsFor(answers).length, 11);
  assert.equal(skipStep("hijab", answers), "hijabStyles");
  const no = { ...answers, hijab: { hijab: "no" as const } };
  assert.equal(stepsFor(no).length, 10);
  assert.equal(skipStep("hijab", no), "coverage");
  assert.equal(previousStep("coverage", no), "hijab");
});

test("Sometimes and never answered are told apart", () => {
  const clock = at("2026-10-02T08:00:00+02:00");
  assert.equal(answersFrom(emptyCloset).hijab.hijab, null);
  const sometimes = applyAnswer(emptyCloset, "hijab", { hijab: "sometimes" }, clock);
  assert.equal(sometimes.styling.profile.hijabAnswered, true);
  assert.equal(answersFrom(sometimes).hijab.hijab, "sometimes");
  const none = applyAnswer(emptyCloset, "coverage", { coverage: null, answered: true }, clock);
  assert.equal(none.styling.profile.coverageAnswered, true);
  assert.equal(answersFrom(none).coverage.answered, true);
  assert.equal(answersFrom(emptyCloset).coverage.answered, false);
});

test("finishing onboarding writes the everyday style so the sample closet lands on an outfit", () => {
  const clock = at("2026-10-02T08:00:00+02:00");
  let closet = applyAnswer(addSampleWardrobe(emptyCloset), "hijab", { hijab: "always" }, clock);
  closet = applyAnswer(closet, "style", { styleLean: "desi" }, clock);
  closet = applyAnswer(closet, "coverage", { coverage: "moderate", answered: true }, clock);
  closet = finishOnboarding(closet, clock);
  assert.equal(closet.styling.onboarded, true);
  assert.equal(closet.styling.everyday?.occasion, "everyday");
  assert.equal(closet.styling.everyday?.style, "desi");
  assert.equal(closet.styling.everyday?.hijab, "always");
  const skipped = finishOnboarding(addSampleWardrobe(emptyCloset), clock);
  assert.equal(skipped.styling.everyday?.style, "western");
  assert.equal(skipped.styling.everyday?.hijab, null);
});

test("the name is trimmed and the greeting follows the hour", () => {
  const named = setName(emptyCloset, "  Sara  ");
  assert.equal(named.styling.name, "Sara");
  assert.equal(setName(named, "   ").styling.name, undefined);
  assert.equal(setName(emptyCloset, "a".repeat(50)).styling.name?.length, 40);
  assert.equal(greeting("Sara", 8, "en"), "Good morning, Sara");
  assert.equal(greeting("Sara", 15, "en"), "Good afternoon, Sara");
  assert.equal(greeting("Sara", 20, "nb"), "God kveld, Sara");
  assert.equal(greeting(null, 9, "en"), "Good morning");
  assert.equal(greeting("Sara", 15, "nb"), "Hei, Sara");
});
```

- [ ] **Step 2: Run them to verify they fail**

Run: `npx tsx --test src/domain/closet.test.ts src/domain/onboarding.test.ts`
Expected: FAIL (missing exports, type errors on the new fields).

- [ ] **Step 3: Implement**

`closet.ts`: add the types; extend the decoder guards (`isRecord` checks around line 837 to 1000) with the new optional fields, each validated loosely (`hijabStyles` filtered to known values, `neverWear` entries filtered to the three shapes, `notification` to the four times, `name` to a string). Keep `migrateV1`/`migrateV2` untouched. `coverageNeedFor("relaxed")` returns `{ sleeve: "any", hem: "any" }`.

`onboarding.ts`: the new `onboardingSteps`, `Answers`, `stepsFor`, `skipStep(step, answers)`, `previousStep(step, answers)`, `answersFrom` and `applyAnswer` per the Interfaces block; `body` stays an answer step for Profile but is not in `onboardingSteps`; the old `taste` step is gone (`colourLean` moves into `colours`). `finishOnboarding(closet, clock)` writes the preset through `saveEverydayStyle(closet, preset, clock, true)` when `styling.everyday` is null. `setName` as specified.

`greeting.ts`: uses `translate({ en, nb }, locale, key, { name })` from `src/i18n/translate` with the catalogs imported directly (no global locale).

Add the keys to both catalogs from `copy.md` > Revision 1 > F06 Today: `today.greeting.morning`, `.afternoon`, `.evening`, `.morningPlain`, `.afternoonPlain`, `.eveningPlain`, `.short` (NB afternoon is "Hei, {name}" / "Hei", per `flows/F12-app-wide-checks.md` > Notes).

- [ ] **Step 4: Run the tests to verify they pass; run the whole suite**

Run: `npm test`
Expected: PASS. `onboarding-state.test.ts` and `profile-onboarding-builder` expectations about `onboardingSteps` must be updated to the new order (the test that asserted `["hijab","place","body","taste","colours","done"]`).

- [ ] **Step 5: Commit**

```bash
git add src/domain src/i18n
git commit -m "feat: onboarding steps, name, greeting and the new optional closet fields"
```

### Task 16: Style preferences the stylist reads

**Files:**
- Modify: `src/domain/attributes.ts`, `src/domain/facts.ts`, `src/domain/scoring/rules.ts`, `src/domain/scoring/rulesScorer.ts`, `src/domain/styling.ts`, `src/domain/wardrobe.ts`, `src/domain/builder.ts`
- Create: `src/domain/preferences.ts`
- Test: `src/domain/preferences.test.ts`

**Interfaces:**

```ts
// attributes.ts: embellishments gains { id: "bridal", label: "Bridal" } (never proposed by the parser; add it to embellishmentSteps if that list exists)
// facts.ts
export function sparkleOf(piece: Piece): Sparkle | null; // none -> plain, light -> little, heavy -> heavy, bridal -> bridal; null when unset
export function setSparkle(closet: Closet, pieceId: string, sparkle: Sparkle): Closet; // writes attributes.embellishment with sources.embellishment "confirmed"
// preferences.ts
export function isNeverWear(profile: StyleProfile, piece: Piece): boolean; // colour on "clothes" never matches a hijab; "hijabs" matches hijabs only; colour compared to colorName(colors[0].rgb)
export function allowedPieces(closet: Closet, pieces: Piece[]): Piece[]; // drops isNeverWear matches
export function wearMoreIds(closet: Closet): string[]; // profile.wearMore filtered to pieces that exist, are owned, available and not archived
export function setNeverWear(closet: Closet, entries: NeverWear[]): Closet;
export function setWearMore(closet: Closet, ids: string[]): Closet;
// rules.ts: Facts gains sparkle: Sparkle | null; rulesScorerFor adds the sparkle penalty on eid, party, wedding, barat only: a desi piece whose sparkle rank is above the profile's loses 0.6, one below "little" when the profile is heavy or bridal loses 0.3
// styling.ts: styleOutfits and replacementsFor filter their pool with allowedPieces (pass closet-free: a `profile` is already in ScoreContext; add `neverWear` filtering inside the pool builder using context.profile)
// wardrobe.ts hijabAlternatives and builder.ts fillOutfit, rankPieces, swapOptions: same filter
```

- [ ] **Step 1: Write the failing test**

```ts
// src/domain/preferences.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { neutralProfile } from "./closet";
import { sparkleOf } from "./facts";
import { isNeverWear, wearMoreIds } from "./preferences";
import { rulesScorer } from "./scoring/rulesScorer";
import { scoreContext } from "./scoring/taste";
import { ownedCloset, piece } from "./test-helpers";

const black = { rgb: [20, 20, 22] as [number, number, number], share: 1 };

test("a never-wear colour on clothes keeps black hijabs", () => {
  const profile = { ...neutralProfile, neverWear: [{ colour: "Black", on: "clothes" as const }, { kind: "skirt" as const }, { pattern: "stripe" as const }] };
  assert.equal(isNeverWear(profile, piece("top", "top", { colors: [black] })), true);
  assert.equal(isNeverWear(profile, piece("hijab", "hijab", { kind: "hijab", colors: [black] })), false);
  assert.equal(isNeverWear({ ...neutralProfile, neverWear: [{ colour: "Black", on: "hijabs" }] }, piece("hijab", "hijab", { kind: "hijab", colors: [black] })), true);
  assert.equal(isNeverWear(profile, piece("skirt", "bottom", { kind: "skirt" })), true);
  assert.equal(isNeverWear(profile, piece("tee", "top", { attributes: { pattern: "stripe" } })), true);
  assert.equal(isNeverWear(profile, piece("tee2", "top", { attributes: { pattern: "solid" } })), false);
});

test("wear more drops pieces that are gone, put away or sample", () => {
  const closet = ownedCloset([piece("a", "top"), piece("b", "top", { status: "archived" })]);
  const withList = { ...closet, styling: { ...closet.styling, profile: { ...neutralProfile, wearMore: ["a", "b", "gone"] } } };
  assert.deepEqual(wearMoreIds(withList), ["a"]);
});

test("sparkle maps the embellishment and is read for events only", () => {
  const plain = piece("k1", "tunic", { kind: "kameez", styles: ["desi"], attributes: { embellishment: "none" } });
  const heavy = piece("k2", "tunic", { kind: "kameez", styles: ["desi"], attributes: { embellishment: "heavy" } });
  assert.equal(sparkleOf(plain), "plain");
  assert.equal(sparkleOf(heavy), "heavy");
  assert.equal(sparkleOf(piece("k3", "tunic")), null);
  const request = (occasion: "everyday" | "eid") => ({ occasion, style: "desi" as const, garmentType: null, keptIds: [], excludedIds: [], weather: { source: "unknown" as const }, hijab: null, wardrobe: "owned" as const });
  const scoreWith = (level: "plain" | "heavy", occasion: "everyday" | "eid", outfit: typeof heavy) => {
    const closet = ownedCloset([outfit]);
    const context = scoreContext({ ...closet, styling: { ...closet.styling, profile: { ...neutralProfile, sparkle: level } } });
    return rulesScorer.score([outfit], request(occasion), context).score;
  };
  assert.equal(scoreWith("plain", "everyday", heavy), scoreWith("heavy", "everyday", heavy));
  assert.ok(scoreWith("heavy", "eid", heavy) > scoreWith("plain", "eid", heavy));
  assert.ok(scoreWith("heavy", "eid", heavy) > scoreWith("heavy", "eid", plain));
});
```

If `rulesScorer.score` has a different shape, read `src/domain/scoring/types.ts` `Scorer` and adapt the call, not the assertion.

- [ ] **Step 2: Run it to verify it fails, implement, run until it passes**

Run: `npx tsx --test src/domain/preferences.test.ts`

Then `npm test`: the golden tests in `src/domain/scoring/golden.test.ts` must still pass (sparkle is only read on event occasions and the golden sets have no `sparkle` profile value, so scores are unchanged; if `compat-head.json` compares feature vectors, add `sparkle` with value 0 to keep the vector stable or regenerate per the file's own instructions).

- [ ] **Step 3: Commit**

```bash
git add src/domain
git commit -m "feat: sparkle, never wear, wear more and relaxed coverage in the stylist"
```

### Task 17: Piece facts: colour correction, piece coverage, needs details, warmth on hijabs and layers, exposure

**Files:**
- Modify: `src/domain/facts.ts`, `src/domain/importing.ts`, `src/domain/pieceWeather.ts`, `src/domain/today.ts` (`everydayRequest` reads `exposure`), `src/domain/color.ts`
- Test: `src/domain/facts.test.ts` (extend), `src/domain/importing.test.ts` (extend), `src/domain/pieceWeather.test.ts` (extend)

**Interfaces:**

```ts
// color.ts
export const colourNames: readonly string[]; // the palette names in the order of paletteLab
export function namedSwatch(name: string): Swatch; // { rgb: palette rgb, share: 1 }
// facts.ts
export type PieceCoverage = "full" | "moderate" | "layer";
export function setColour(closet: Closet, pieceId: string, name: string): Closet; // colors[0] = namedSwatch(name) (rest kept), sources.colour = "confirmed"
export function pieceCoverage(piece: Piece): PieceCoverage | null;
export function needsDetails(piece: Piece): FactKey[]; // [] for sample pieces, hijab, shoes, bag, accessory
// importing.ts: correctImport change gains colour?: string (same write on job.prepared.palette[0] and job.sources.colour); finishImport keeps a confirmed colour and confirmed attributes when a job is re-prepared (retake keeps sources.colour)
// pieceWeather.ts: proposedWeather/withWeatherProposals also propose warmth for category "hijab" (light for chiffon, silk, cotton; medium for jersey, viscose; warm for wool, pashmina, knit) and "layer"; confirmedWeather/unconfirmedWeather unchanged
// today.ts: everydayRequest(preset, wardrobe, coverage, weather) applies preset.exposure to a forecast weather (exposure stays null on forecast weather today; set it from the preset)
```

- [ ] **Step 1: Write the failing tests**

Append to `src/domain/facts.test.ts`:

```ts
import { needsDetails, pieceCoverage, setColour } from "./facts";
import { colorName } from "./color";
import { ownedCloset, piece } from "./test-helpers";

test("piece coverage is judged by what the piece covers", () => {
  const blouse = piece("blouse", "top", { attributes: { sleeve: "long", length: "hip", sheer: false }, sources: { sleeve: "confirmed", length: "confirmed" } });
  const trousers = piece("trousers", "bottom", { attributes: { length: "ankle" }, sources: { length: "confirmed" } });
  const skirt = piece("skirt", "bottom", { attributes: { length: "knee" }, sources: { length: "confirmed" } });
  const kameez = piece("kameez", "tunic", { attributes: { sleeve: "elbow", sheer: false }, sources: { sleeve: "confirmed" } });
  assert.equal(pieceCoverage(blouse), "full");
  assert.equal(pieceCoverage(trousers), "full");
  assert.equal(pieceCoverage(skirt), "layer");
  assert.equal(pieceCoverage(kameez), "moderate");
  assert.equal(pieceCoverage(piece("hijab", "hijab")), null);
  assert.equal(pieceCoverage(piece("dress", "dress", { attributes: { sleeve: "long" } })), null);
});

test("needs details lists only the facts coverage reads for the category", () => {
  assert.deepEqual(needsDetails(piece("dress", "dress")), ["sleeve", "sheer", "length"]);
  assert.deepEqual(needsDetails(piece("blouse", "top", { attributes: { sleeve: "long" }, sources: { sleeve: "proposed" } })), ["sleeve", "sheer"]);
  assert.deepEqual(needsDetails(piece("trousers", "bottom")), ["length"]);
  assert.deepEqual(needsDetails(piece("hijab", "hijab")), []);
  assert.deepEqual(needsDetails(piece("sample", "dress", { source: "sample" })), []);
});

test("a corrected colour is confirmed and survives a re-prepare", () => {
  const closet = ownedCloset([piece("h", "hijab", { colors: [{ rgb: [220, 200, 170], share: 1 }] })]);
  const fixed = setColour(closet, "h", "Blush");
  const swatch = fixed.pieces[0]!.colors![0]!;
  assert.equal(colorName(swatch.rgb), "Blush");
  assert.equal(fixed.pieces[0]!.sources?.colour, "confirmed");
});
```

Append to `src/domain/importing.test.ts` a test that `correctImport(closet, id, { colour: "Blush" })` on a ready job sets `job.prepared.palette[0]` to the Blush swatch and `job.sources.colour` to `"confirmed"`, and that `pieceFromImport` carries both; and one that `retakeImport` followed by `finishImport` with a new palette keeps the confirmed colour.

Append to `src/domain/pieceWeather.test.ts`: a chiffon hijab gets `warmth: "light"` proposed, a wool hijab `"warm"`, a blazer layer `"medium"`.

- [ ] **Step 2: Run, implement, run**

`pieceCoverage` rules: `top`, `tunic`, `layer` by confirmed sleeve (`long` and opaque is `full`, `elbow` is `moderate`, shorter or sheer is `layer`); `bottom` by confirmed length (`ankle` full, `calf` moderate, else layer); `dress` by both, the weaker; `null` when a read fact is unknown or still proposed (use `confirmedSleeve`/`confirmedLength` from `coverage.ts`, export them). Sheer: `attributes.sheer === true` is sheer; `undefined` counts as unknown only for the `sheer` entry of `needsDetails`, while `pieceCoverage` treats undefined sheer as opaque when `opacity(piece)` is not `"yes"` (keep the existing `opacity` evidence function as the authority).

- [ ] **Step 3: Commit**

```bash
git add src/domain
git commit -m "feat: colour correction, piece coverage, needs details and hijab warmth"
```

### Task 18: Closet filters, sections, capture progress, sets on add, missing roles

**Files:**
- Modify: `src/domain/closetFilters.ts`, `src/domain/importing.ts`, `src/domain/styling.ts`, `src/domain/sets.ts`
- Test: `src/domain/closetFilters.test.ts` (extend), `src/domain/importing.test.ts` (extend), `src/domain/styling.test.ts` (extend)

**Interfaces:**

```ts
// closetFilters.ts
export type ClosetFilter = {
  category: Category | "all"; style: Style | null; occasion: Occasion | null;
  availability: "away" | "archived" | null; colour: string | null; coverage: PieceCoverage | "needs-details" | null;
  season: WearSeason | null; wear: "never-worn" | "not-worn-lately" | null; search: string;
};
export const noFilter: ClosetFilter;
export function lastWorn(closet: Closet): Record<string, string>; // piece id -> last wore event date (ISO), undone excluded, scope piece included
export function filterPieces<T extends Piece>(pieces: readonly T[], filter: ClosetFilter, context: { lastWorn: Record<string, string>; today: string }): T[];
// archived pieces are shown only with availability "archived"; "not-worn-lately" = no wear within 30 days of today, never worn included; search matches name and colorName(colors[0]) case-insensitively
export type ClosetSection = { id: Category | "samples"; pieces: Piece[] };
export function groupByCategory(pieces: readonly Piece[]): ClosetSection[]; // taxonomy order, samples last as one section; hijabs ordered by hue (toLch hue of colors[0]) then name, others by createdAt desc; empty sections omitted
export function panelFilterCount(filter: ClosetFilter): number;
// importing.ts
export type CaptureProgress = { total: number; ready: number; confirm: number; failed: number; done: boolean; byCategory: { category: Category; count: number }[] };
export function captureProgress(closet: Closet): CaptureProgress | null; // null when imports is empty
export function setKeepAsSet(closet: Closet, captureId: string, keep: boolean): Closet;
export function acceptImports(closet: Closet): Closet; // existing, plus: kept members of a capture with keepAsSet get one setId through linkSet; returns settleWardrobe(result)
export function settleWardrobe(closet: Closet): Closet; // wardrobe "sample" -> "owned" when missingRoles(owned available pieces, everyday request) is empty; else unchanged
export function sameCapture(pieces: Piece[]): boolean; // every piece carries one captureId
// styling.ts
export function missingRoles(pieces: Piece[], request: Pick<OutfitRequest, "hijab">): Role[]; // "main", "bottom" (when no main is a dress or abaya), "shoes", "hijab" when request.hijab === "always"
```

- [ ] **Step 1: Write the failing tests**

Append to `src/domain/closetFilters.test.ts`:

```ts
import { filterPieces, groupByCategory, lastWorn, noFilter } from "./closetFilters";
import { ownedCloset, piece } from "./test-helpers";

const wore = (id: string, pieceIds: string[], at: string, scope?: "piece") => ({ id, at, kind: "wore" as const, pieceIds, request: { occasion: "everyday" as const, style: "western" as const, garmentType: null, keptIds: [], excludedIds: [], weather: { source: "unknown" as const }, hijab: null, wardrobe: "owned" as const }, engine: "rules" as const, ...(scope ? { scope } : {}) });

test("wear filters read the last wear per piece, piece wears included", () => {
  const closet = { ...ownedCloset([piece("a", "top"), piece("b", "top"), piece("c", "top")]), feedback: [wore("e1", ["a"], "2026-09-30T08:00:00Z"), wore("e2", ["b"], "2026-08-01T08:00:00Z", "piece")] };
  const last = lastWorn(closet);
  assert.equal(last.a, "2026-09-30T08:00:00Z");
  assert.equal(last.b, "2026-08-01T08:00:00Z");
  const context = { lastWorn: last, today: "2026-10-02" };
  assert.deepEqual(filterPieces(closet.pieces, { ...noFilter, wear: "never-worn" }, context).map((p) => p.id), ["c"]);
  assert.deepEqual(filterPieces(closet.pieces, { ...noFilter, wear: "not-worn-lately" }, context).map((p) => p.id), ["b", "c"]);
});

test("search matches the colour name and coverage filters use piece coverage", () => {
  const pink = piece("h", "hijab", { name: "Chiffon hijab", colors: [{ rgb: [226, 177, 168], share: 1 }] });
  const blouse = piece("bl", "top", { attributes: { sleeve: "long", length: "hip", sheer: false }, sources: { sleeve: "confirmed", length: "confirmed" } });
  const dress = piece("d", "dress");
  const context = { lastWorn: {}, today: "2026-10-02" };
  const pieces = [pink, blouse, dress];
  assert.deepEqual(filterPieces(pieces, { ...noFilter, search: "blush" }, context).map((p) => p.id), ["h"]);
  assert.deepEqual(filterPieces(pieces, { ...noFilter, coverage: "full" }, context).map((p) => p.id), ["bl"]);
  assert.deepEqual(filterPieces(pieces, { ...noFilter, coverage: "needs-details" }, context).map((p) => p.id), ["d"]);
});

test("sections follow taxonomy order with hijabs by hue and the rest newest first", () => {
  const sections = groupByCategory([
    piece("t-old", "top", { createdAt: "2026-09-01T00:00:00Z" }),
    piece("t-new", "top", { createdAt: "2026-09-20T00:00:00Z" }),
    piece("h-blue", "hijab", { colors: [{ rgb: [60, 80, 160], share: 1 }] }),
    piece("h-pink", "hijab", { colors: [{ rgb: [226, 177, 168], share: 1 }] }),
    piece("h-red", "hijab", { colors: [{ rgb: [180, 40, 40], share: 1 }] }),
    piece("s", "shoes", { source: "sample" }),
  ]);
  assert.deepEqual(sections.map((s) => s.id), ["hijab", "top", "samples"]);
  assert.deepEqual(sections[1]!.pieces.map((p) => p.id), ["t-new", "t-old"]);
  const hues = sections[0]!.pieces.map((p) => p.id);
  assert.ok(hues.indexOf("h-red") < hues.indexOf("h-pink") || hues.indexOf("h-pink") < hues.indexOf("h-red"));
  assert.notEqual(hues.indexOf("h-blue"), 1);
});
```

Append to `src/domain/importing.test.ts`:

```ts
test("capture progress counts the queue and links a set on add", () => {
  // build a closet with three jobs: one ready (hijab), one review (top), one failed, all captureId "c1" via queueImport + finishImport + failImport
  // assert captureProgress(closet) deep equals { total: 3, ready: 1, confirm: 1, failed: 1, done: true, byCategory: [{ category: "hijab", count: 1 }, { category: "top", count: 1 }] }
  // then setKeepAsSet(closet, "c1", true), correct the review job to ready, acceptImports: both pieces share one setId
});
```

Write the body with the real helpers (`queueImport(closet, source, createdAt, captureId)`, `startImport`, `finishImport(closet, id, prepared)` with a `Prepared` whose `labels` carry `{ group: "kind", value: "hijab", score: 0.9 }`; read `importing.test.ts` for the existing `prepared` fixture and reuse it).

Append to `src/domain/styling.test.ts`:

```ts
import { missingRoles } from "./styling";
test("missing roles name what the owned pool still needs", () => {
  const hijab = piece("h", "hijab", { kind: "hijab" });
  const tunic = piece("t", "tunic", { kind: "kurta" });
  const trousers = piece("b", "bottom", { kind: "trousers" });
  const shoes = piece("s", "shoes", { kind: "flats" });
  const abaya = piece("a", "dress", { kind: "abaya" });
  assert.deepEqual(missingRoles([hijab], { hijab: "always" }), ["main", "bottom", "shoes"]);
  assert.deepEqual(missingRoles([tunic, trousers], { hijab: "always" }), ["shoes", "hijab"]);
  assert.deepEqual(missingRoles([abaya, shoes], { hijab: null }), []);
  assert.deepEqual(missingRoles([tunic, trousers, shoes, hijab], { hijab: "always" }), []);
});
```

- [ ] **Step 2: Run, implement, run**

`settleWardrobe` builds the everyday request with `everydayRequest(preset, "owned", ...)` when `styling.everyday` exists, else `{ hijab: null }`; it never switches back to sample. Keep `closetChips` for the old screen until L5 deletes it.

- [ ] **Step 3: Commit**

```bash
git add src/domain
git commit -m "feat: closet filters, category sections, capture progress and missing roles"
```

### Task 19: Feedback: wears by date and scope, likes, chips

**Files:**
- Modify: `src/domain/feedback.ts`, `src/domain/scoring/taste.ts`, `src/i18n/en.ts`, `nb.ts`
- Test: `src/domain/feedback.test.ts` (extend)

**Interfaces:**

```ts
export type Chip = "too-formal" | "too-plain" | "too-warm" | "too-cold" | "hijab-mismatch" | "not-my-style";
export function woreThis(closet: Closet, expectedRevision: number, at: string, id: string): Closet; // refused (closet returned unchanged) while the active session has a date or active === "tomorrow"
export function woreLately(closet: Closet, pieceIds: string[], at: string, idFor: (pieceId: string) => string): Closet; // one event per piece, scope "piece", request = the everyday request, no against, no cursor
export function hasAnyWear(closet: Closet): boolean; // any non-undone wore event whose pieceIds include an owned piece
export function woreLook(closet: Closet, lookId: string, at: string, id: string): Closet; // one wore event with the look's pieceIds and occasion
export function likeOutfit(closet: Closet, at: string, id: string): Closet; // "liked" for the active session's pieces; clears an existing undone-false "disliked" for the same set by undoing it
export function dislikeOutfit(closet: Closet, pieceIds: string[], at: string, id: string): Closet; // "disliked" for the given pieces (active outfit from thumbs down, or previousPieceIds from "Not for me" next to Undo); no restyle
export function likedNow(closet: Closet): FeedbackEvent | null; // the active outfit's live liked event
// taste.ts rebuildTaste / learnPreference: "liked" learns as "saved", "disliked" as a rejected pair; wearCounts counts scope "piece" events too (already does: kind === "wore")
// giveFeedback accepts the two new chips: "too-cold" prefers warmer pieces (reuse the too-warm logic inverted), "hijab-mismatch" returns the closet with the event recorded and no swap (the UI opens the hijab strip)
```

- [ ] **Step 1: Write the failing tests**

```ts
// append to src/domain/feedback.test.ts
import { dislikeOutfit, hasAnyWear, likeOutfit, woreLately, woreLook, woreThis } from "./feedback";
import { lookEntries } from "./looks";
import { wearCounts } from "./scoring/taste";
import { activeSession, startOccasion } from "./today";
import { at, ownedCloset, piece, styledSample } from "./test-helpers";

test("marking pieces as worn records one piece wear each and no outfit", () => {
  const closet = { ...ownedCloset([piece("a", "top"), piece("b", "bottom")]), styling: { ...styledSample().styling, wardrobe: "owned" as const } };
  assert.equal(hasAnyWear(closet), false);
  const marked = woreLately(closet, ["a", "b"], "2026-10-01T12:00:00Z", (id) => `w-${id}`);
  assert.equal(marked.feedback.length, 2);
  assert.ok(marked.feedback.every((event) => event.scope === "piece" && event.pieceIds.length === 1));
  assert.deepEqual(wearCounts(marked.feedback), { a: 1, b: 1 });
  assert.equal(hasAnyWear(marked), true);
  assert.equal(lookEntries(marked, "en").length, 0);
});

test("wear this is refused while planning another day or on tomorrow", () => {
  const closet = styledSample();
  const session = activeSession(closet.styling.today!);
  const planning = startOccasion(closet, { ...session.request, occasion: "eid" });
  const dated = { ...planning, styling: { ...planning.styling, today: { ...planning.styling.today!, occasion: { ...planning.styling.today!.occasion!, date: "2026-10-11" } } } };
  const revision = activeSession(dated.styling.today!).revision;
  assert.equal(woreThis(dated, revision, "2026-10-02T09:00:00Z", "w1"), dated);
  const worn = woreThis(closet, session.revision, "2026-10-02T09:00:00Z", "w2");
  assert.equal(worn.feedback.filter((e) => e.kind === "wore").length, 1);
});

test("a look can be marked worn yesterday and likes are undoable taste", () => {
  const base = styledSample();
  const look = { id: "l1", name: "Office", pieceIds: activeSession(base.styling.today!).pieceIds, createdAt: "2026-10-01T00:00:00Z", occasion: "work" as const };
  const closet = { ...base, looks: [look] };
  const worn = woreLook(closet, "l1", "2026-10-01T18:00:00Z", "w3");
  assert.equal(worn.feedback.at(-1)?.kind, "wore");
  assert.deepEqual(worn.feedback.at(-1)?.pieceIds, look.pieceIds);
  const liked = likeOutfit(closet, "2026-10-02T09:00:00Z", "like1");
  assert.equal(liked.feedback.at(-1)?.kind, "liked");
  const disliked = dislikeOutfit(liked, look.pieceIds, "2026-10-02T09:01:00Z", "dis1");
  assert.equal(disliked.feedback.find((e) => e.id === "like1")?.undone, true);
  assert.equal(disliked.feedback.at(-1)?.kind, "disliked");
  assert.deepEqual(activeSession(disliked.styling.today!).pieceIds, activeSession(liked.styling.today!).pieceIds);
});
```

- [ ] **Step 2: Run, implement, run**

Rename the label of `too-warm` to "Too hot" / "For varmt" in both catalogs and add `feedback.too-cold` ("Too cold" / "For kaldt") and `feedback.hijab-mismatch` ("Hijab does not match" / "Hijaben passer ikke") from `copy.md` F06. Like and dislike are mutually exclusive on the same piece set: each undoes the other's live event.

- [ ] **Step 3: Commit**

```bash
git add src/domain src/i18n
git commit -m "feat: piece wears, look wears, likes and the new feedback chips"
```

### Task 20: Looks: entries, set names, planning, calendar

**Files:**
- Modify: `src/domain/looks.ts`, `src/domain/profileStats.ts`
- Test: `src/domain/looks.test.ts` (extend), `src/domain/profileStats.test.ts` (extend)

**Interfaces:**

```ts
// looks.ts
export type LookEntry = { id: string; name: string; occasion: Occasion | null; pieceIds: string[]; at: string; saved: boolean; lookId: string | null; lastWorn: string | null; plannedFor: string | null; missing: number };
export function lookEntries(closet: Closet, locale: NameLocale): LookEntry[];
// worn rows id = `set-${sorted ids joined with ","}`; piece-scope events ignored; names from closet.setNames before outfitName; order: plannedFor today or later first (nearest first), then by max(createdAt, last wear) desc
export function lookForPieces(closet: Closet, pieceIds: string[]): Look | null; // same set, order-insensitive
export function removeLook(closet: Closet, id: string): Closet; // when the look has wears, writes setNames[key] = look.name
export function renameSet(closet: Closet, pieceIds: string[], name: string): Closet;
export function setPlannedFor(closet: Closet, lookId: string, date: string | null): Closet;
export function plannedToday(closet: Closet, clock: Clock): Look[]; // plannedFor === clock.localDate
export function plannedPieces(closet: Closet, clock: Clock): Record<string, string>; // piece id -> the earliest plannedFor within the next 7 days (tomorrow included, today excluded)
export type CalendarDay = { date: string; wears: { eventId: string; pieceIds: string[]; lookId: string | null; name: string; occasion: Occasion | null }[]; mark: Piece | null };
export function wearCalendar(closet: Closet, month: string, locale: NameLocale): Record<string, CalendarDay>; // outfit wears only (no scope piece), order recorded; mark = first outfit's first non-hijab piece in dressing order, else its hijab
export function firstWearMonth(closet: Closet): string | null;
// profileStats.ts
export function monthWearStats(closet: Closet, month: string, now: Clock): { mostWorn: { piece: Piece; count: number }[]; variety: number | null }; // mostWorn: up to three pieces worn twice or more in the month's outfit wears; variety only for the current month: owned pieces with lastWorn within 30 days / owned pieces (0 to 1)
```

- [ ] **Step 1: Write the failing tests**

```ts
// append to src/domain/looks.test.ts
import { firstWearMonth, lookEntries, lookForPieces, plannedPieces, plannedToday, removeLook, setPlannedFor, wearCalendar } from "./looks";
import { woreLately, woreLook, woreThis } from "./feedback";
import { monthWearStats } from "./profileStats";
import { activeSession } from "./today";
import { at, styledSample } from "./test-helpers";

const sample = () => {
  const base = styledSample();
  const ids = activeSession(base.styling.today!).pieceIds;
  const look = { id: "eid", name: "Eid lunch", pieceIds: ids, createdAt: "2026-09-20T00:00:00Z", occasion: "eid" as const };
  return { closet: { ...base, looks: [look] }, ids, look };
};

test("piece wears add no Looks row and removing a worn look keeps its name and id", () => {
  const { closet, ids, look } = sample();
  const marked = woreLately(closet, ids.slice(0, 2), "2026-10-01T12:00:00Z", (id) => `w-${id}`);
  assert.equal(lookEntries(marked, "en").filter((e) => !e.saved).length, 0);
  const worn = woreLook(marked, "eid", "2026-10-01T18:00:00Z", "w-look");
  const before = lookEntries(worn, "en").find((e) => e.lookId === "eid")!;
  const removed = removeLook(worn, "eid");
  const after = lookEntries(removed, "en").find((e) => e.name === "Eid lunch")!;
  assert.equal(after.saved, false);
  assert.equal(after.id, `set-${[...look.pieceIds].sort().join(",")}`);
  assert.equal(before.name, after.name);
});

test("planned looks come first and surface on their day", () => {
  const { closet, ids } = sample();
  const planned = setPlannedFor({ ...closet, looks: [...closet.looks, { id: "office", name: "Office", pieceIds: ids.slice(0, 3), createdAt: "2026-10-01T00:00:00Z" }] }, "eid", "2026-10-11");
  assert.equal(lookEntries(planned, "en")[0]?.lookId, "eid");
  assert.deepEqual(plannedToday(planned, at("2026-10-11T08:00:00+02:00")).map((l) => l.id), ["eid"]);
  assert.deepEqual(plannedToday(planned, at("2026-10-12T08:00:00+02:00")), []);
  assert.deepEqual(Object.values(plannedPieces(planned, at("2026-10-05T08:00:00+02:00"))).every((d) => d === "2026-10-11"), true);
  assert.deepEqual(plannedPieces(planned, at("2026-10-03T08:00:00+02:00")), {});
  assert.equal(lookForPieces(planned, [...ids].reverse())?.id, "eid");
  assert.equal(lookForPieces(planned, ids.slice(1)), null);
});

test("the calendar holds outfit wears only and variety plus not worn lately is the whole closet", () => {
  const { closet, ids } = sample();
  let worn = woreLately(closet, ids, "2026-10-01T12:00:00Z", (id) => `w-${id}`);
  worn = woreLook(worn, "eid", "2026-10-02T18:00:00Z", "w-eid");
  const month = wearCalendar(worn, "2026-10", "en");
  assert.deepEqual(Object.keys(month), ["2026-10-02"]);
  assert.equal(month["2026-10-02"]!.wears[0]!.name, "Eid lunch");
  assert.equal(month["2026-10-02"]!.wears[0]!.occasion, "eid");
  assert.notEqual(month["2026-10-02"]!.mark?.category, "hijab");
  assert.equal(firstWearMonth(worn), "2026-10");
  const stats = monthWearStats({ ...worn, styling: { ...worn.styling, wardrobe: "sample" } }, "2026-10", at("2026-10-14T08:00:00+02:00"));
  assert.ok(stats.variety !== null && stats.variety > 0 && stats.variety <= 1);
  assert.equal(monthWearStats(worn, "2026-09", at("2026-10-14T08:00:00+02:00")).variety, null);
});
```

- [ ] **Step 2: Run, implement, run**

`monthWearStats` variety pool: pieces with `source === styling.wardrobe` and not archived (the same pool `closetStats` uses), window 30 days before `now.localDate`, `lastWorn` from `closetFilters.lastWorn`. Keep `closetStats` and add `neverWorn` to count only owned pieces without any wear (already).

- [ ] **Step 3: Commit**

```bash
git add src/domain
git commit -m "feat: look entries by set, planning dates and the wear calendar"
```

### Task 21: Today sessions: new days, plans, tomorrow, rediscover, coverage note

**Files:**
- Modify: `src/domain/today.ts`, `src/domain/wardrobe.ts`, `src/domain/outfitView.ts`, `src/i18n/en.ts`, `nb.ts`
- Test: `src/domain/today.test.ts` (create), `src/domain/wardrobe.test.ts` (extend), `src/domain/outfitView.test.ts` (extend)

**Interfaces:**

```ts
// today.ts
export function ensureToday(closet: Closet, clock: Clock): Closet;
// new local date: active becomes "everyday"; an undated occasion session is dropped; a dated one is kept in today.occasion (inactive) until its date < localDate, then dropped; tomorrow with date === localDate becomes everyday (its revision continues), any other tomorrow is dropped
export function startPlan(closet: Closet, request: OutfitRequest, date: string): Closet; // occasion session with date, active "occasion"
export function unsavedPlan(closet: Closet): Session | null; // the inactive dated occasion session whose date >= localDate, when its pieces are not a saved look
export function resumePlan(closet: Closet): Closet; // active "occasion" again
export function discardPlan(closet: Closet): Closet; // occasion null
export function prepareTomorrow(closet: Closet, clock: Clock, forecast: Weather): Closet; // everyday session for the next local date with the given weather, revision 1, active "tomorrow"
export function backToToday(closet: Closet): Closet; // active "everyday", tomorrow kept
export function nextLocalDate(localDate: string): string;
// activeSession(today) returns today.tomorrow when active === "tomorrow"; tryAnother, replacePiece, toggleKeep, undoChange, applyLook, startOver act on it through withActive
// wardrobe.ts
export function rediscover(closet: Closet, clock: Clock, limit = 6): Piece[];
// outfitView.ts
export function coverageNote(pieces: Piece[], need: CoverageNeed | undefined, locale: NameLocale): string | null;
```

- [ ] **Step 1: Write the failing tests**

```ts
// src/domain/today.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { activeSession, backToToday, discardPlan, ensureToday, prepareTomorrow, replacePiece, resumePlan, startOccasion, startPlan, unsavedPlan } from "./today";
import { setPlannedFor } from "./looks";
import { at, styledSample } from "./test-helpers";

const weather = { source: "manual" as const, warmth: "cold" as const, precipitation: "snow" as const, exposure: null };

test("an undated occasion session ends with its day", () => {
  const saturday = styledSample("2026-10-03T09:00:00+02:00");
  const party = startOccasion(saturday, { ...activeSession(saturday.styling.today!).request, occasion: "party" });
  assert.equal(party.styling.today!.active, "occasion");
  const monday = ensureToday(party, at("2026-10-05T08:00:00+02:00"));
  assert.equal(monday.styling.today!.active, "everyday");
  assert.equal(monday.styling.today!.occasion, null);
  assert.equal(monday.styling.today!.localDate, "2026-10-05");
});

test("a dated plan is kept inactive, offered back, and gone once its day has passed", () => {
  const wednesday = styledSample("2026-10-07T09:00:00+02:00");
  const plan = startPlan(wednesday, { ...activeSession(wednesday.styling.today!).request, occasion: "eid" }, "2026-10-11");
  assert.equal(activeSession(plan.styling.today!).date, "2026-10-11");
  const thursday = ensureToday(plan, at("2026-10-08T08:00:00+02:00"));
  assert.equal(thursday.styling.today!.active, "everyday");
  assert.equal(unsavedPlan(thursday)?.date, "2026-10-11");
  const resumed = resumePlan(thursday);
  assert.equal(activeSession(resumed.styling.today!).date, "2026-10-11");
  assert.equal(unsavedPlan(discardPlan(thursday)), null);
  const later = ensureToday(thursday, at("2026-10-12T08:00:00+02:00"));
  assert.equal(later.styling.today!.occasion, null);
});

test("tomorrow's outfit becomes the next morning's everyday outfit, with the evening's changes", () => {
  const sunday = styledSample("2026-10-04T21:00:00+02:00");
  const tomorrow = prepareTomorrow(sunday, at("2026-10-04T21:00:00+02:00"), weather);
  assert.equal(tomorrow.styling.today!.active, "tomorrow");
  assert.equal(activeSession(tomorrow.styling.today!).date, "2026-10-05");
  const before = activeSession(tomorrow.styling.today!).pieceIds;
  const hijab = tomorrow.pieces.find((p) => p.category === "hijab" && !before.includes(p.id))!;
  const current = before.find((id) => tomorrow.pieces.find((p) => p.id === id)?.category === "hijab")!;
  const changed = replacePiece(tomorrow, activeSession(tomorrow.styling.today!).revision, current, hijab.id);
  assert.deepEqual(changed.styling.today!.everyday.pieceIds, sunday.styling.today!.everyday.pieceIds);
  const shown = backToToday(changed);
  assert.equal(shown.styling.today!.active, "everyday");
  assert.ok(shown.styling.today!.tomorrow);
  const monday = ensureToday(shown, at("2026-10-05T07:00:00+02:00"));
  assert.equal(monday.styling.today!.active, "everyday");
  assert.ok(monday.styling.today!.everyday.pieceIds.includes(hijab.id));
  assert.equal(monday.styling.today!.tomorrow, undefined);
  const tuesday = ensureToday(shown, at("2026-10-06T07:00:00+02:00"));
  assert.ok(!tuesday.styling.today!.everyday.pieceIds.includes(hijab.id) || tuesday.styling.today!.everyday.revision !== monday.styling.today!.everyday.revision);
  assert.equal(tuesday.styling.today!.tomorrow, undefined);
});

test("a planned look survives the night and a removed piece never breaks the morning", () => {
  const closet = styledSample("2026-10-10T09:00:00+02:00");
  const ids = activeSession(closet.styling.today!).pieceIds;
  const planned = setPlannedFor({ ...closet, looks: [{ id: "l", name: "Eid", pieceIds: ids, createdAt: "2026-10-01T00:00:00Z" }] }, "l", "2026-10-11");
  const removedPiece = { ...planned, pieces: planned.pieces.filter((p) => p.id !== ids[0]) };
  const morning = ensureToday(removedPiece, at("2026-10-11T08:00:00+02:00"));
  assert.equal(morning.looks[0]?.plannedFor, "2026-10-11");
  assert.ok(morning.styling.today!.everyday.pieceIds.length > 0);
});
```

Append to `src/domain/wardrobe.test.ts`:

```ts
import { rediscover } from "./wardrobe";
import { woreLately } from "./feedback";
import { at, ownedCloset, piece, styledSample } from "./test-helpers";

test("rediscover waits for a wear, then never worn first, then not worn lately, wear more first", () => {
  const pieces = [piece("never-a", "top", { createdAt: "2026-08-01T00:00:00Z" }), piece("never-b", "top", { createdAt: "2026-09-01T00:00:00Z" }), piece("march", "dress"), piece("fav", "bottom"), piece("away", "top", { status: "away" })];
  const closet = { ...ownedCloset(pieces), styling: { ...styledSample().styling, wardrobe: "owned" as const } };
  const clock = at("2026-10-02T08:00:00+02:00");
  assert.deepEqual(rediscover(closet, clock), []);
  let worn = { ...closet, feedback: [{ id: "m", at: "2026-03-14T10:00:00Z", kind: "wore" as const, pieceIds: ["march"], request: closet.styling.today!.everyday.request, engine: "rules" as const, scope: "piece" as const }] };
  worn = woreLately(worn, ["fav"], "2026-10-01T12:00:00Z", (id) => `w-${id}`);
  const withMore = { ...worn, styling: { ...worn.styling, profile: { ...worn.styling.profile, wearMore: ["never-b"] } } };
  assert.deepEqual(rediscover(withMore, clock).map((p) => p.id), ["never-b", "never-a", "march"]);
});
```

Append to `src/domain/outfitView.test.ts`:

```ts
import { coverageNote } from "./outfitView";
test("the coverage line names the layer or bottom that does the work", () => {
  const need = { sleeve: "long" as const, hem: "ankle" as const };
  const abaya = piece("a", "dress", { kind: "abaya", attributes: { sleeve: "long", length: "ankle" }, sources: { sleeve: "confirmed", length: "confirmed" } });
  const top = piece("t", "top", { kind: "top", attributes: { sleeve: "short" }, sources: { sleeve: "confirmed" } });
  const blazer = piece("b", "layer", { kind: "blazer", attributes: { sleeve: "long" }, sources: { sleeve: "confirmed" } });
  const kameez = piece("k", "tunic", { kind: "kameez", attributes: { sleeve: "long", length: "thigh" }, sources: { sleeve: "confirmed", length: "confirmed" } });
  const trousers = piece("tr", "bottom", { kind: "trousers", attributes: { length: "ankle" }, sources: { length: "confirmed" } });
  assert.equal(coverageNote([abaya], need, "en"), null);
  assert.equal(coverageNote([top, blazer, trousers], need, "en"), "Blazer covers the arms.");
  assert.equal(coverageNote([kameez, trousers], need, "en"), "Trousers reach the ankle.");
  assert.equal(coverageNote([kameez, trousers], undefined, "en"), null);
  assert.equal(coverageNote([kameez, trousers], need, "nb"), "Buksen når til ankelen.");
});
```

Keys from `copy.md` Revision 1 > F06 Today: `coverageNote.arms`, `coverageNote.ankleOne`, `coverageNote.ankleMany`, `coverageNote.calfOne`, `coverageNote.calfMany`, with `kind.subject.*` words in definite form for NB (reuse `garmentWord` from `outfitName.ts`).

- [ ] **Step 2: Run, implement, run**

`ensureToday` must also be safe when a planned look's piece is gone (the look stays; `plannedToday` consumers filter missing pieces through `piecesForLook`). `rediscover` excludes pieces in the active outfit, `neverWear` matches, `away`, `archived`, samples; never worn ordered by `createdAt` ascending, not worn lately by last wear ascending; `wearMore` ids first within each group; stops at `limit`.

- [ ] **Step 3: Commit**

```bash
git add src/domain src/i18n
git commit -m "feat: sessions end with their day, plans, tomorrow's outfit, rediscover and the coverage note"
```

### Task 22: Hijab ordering by tone and warmth, builder occasion

**Files:**
- Modify: `src/domain/wardrobe.ts`, `src/domain/builder.ts`
- Test: `src/domain/wardrobe.test.ts` (extend), `src/domain/builder.test.ts` (extend)

**Interfaces:**

```ts
// wardrobe.ts
export function hijabAlternatives(closet, request, currentIds, score, options?: { all?: boolean }): HijabComparison | null;
// options sorted: under a cold or snow request warm (confirmed warmth "warm") hijabs first, then by hue distance from the current hijab's hue ascending, ties by name; all: true lists every available hijab without the problem filter and with reason null; limit 3 unless all
export function hijabHue(piece: Piece): number | null;
// builder.ts
export function builderRequest(closet: Closet, pieceIds: string[], occasion?: Occasion): OutfitRequest; // occasion overrides the base request's occasion
```

- [ ] **Step 1: Write the failing tests**

```ts
// append to src/domain/wardrobe.test.ts
test("hijab options follow the current hue, warm first when it is cold", () => {
  const base = styledSample();
  const session = activeSession(base.styling.today!);
  const score = () => ({ score: 1, reasons: [] });
  const mild = hijabAlternatives(base, session.request, session.pieceIds, score)!;
  const current = hijabHue(mild.current.piece)!;
  const gaps = mild.options.map((o) => Math.abs(((hijabHue(o.piece) ?? current) - current + 540) % 360 - 180));
  assert.deepEqual(gaps, [...gaps].sort((a, b) => a - b));
  const cold = hijabAlternatives(base, { ...session.request, weather: { source: "manual", warmth: "cold", precipitation: "snow", exposure: null } }, session.pieceIds, score)!;
  const warmFirst = cold.options.findIndex((o) => o.piece.traits?.warmth !== "warm");
  assert.ok(warmFirst !== 0 || cold.options.every((o) => o.piece.traits?.warmth !== "warm"));
  const all = hijabAlternatives(base, session.request, session.pieceIds, score, { all: true })!;
  assert.ok(all.options.length >= mild.options.length);
});
```

Append to `src/domain/builder.test.ts`: `builderRequest(closet, [], "eid").occasion === "eid"` and a saved look through `saveLook` with `occasion: "eid"` keeps it (already a field).

- [ ] **Step 2: Run, implement, run; commit**

```bash
git add src/domain
git commit -m "feat: hijab alternatives by tone and warmth, builder occasion"
```

### Task 23: Colours, auto capture and place

**Files:**
- Modify: `src/domain/colourAnalysis.ts`, `src/domain/selfieGuide.ts`, `src/domain/onboarding.ts`
- Test: `src/domain/colourAnalysis.test.ts` (extend), `src/domain/selfieGuide.test.ts` (extend), `src/domain/onboarding.test.ts` (extend)

**Interfaces:**

```ts
// colourAnalysis.ts
export function fromSelfie(reading: SelfieReading, hairCovered: boolean): { profile: ColourProfile } | { retake: Retake }; // hairCovered passes hair: null
export function paletteFor(profile: Pick<ColourProfile, "season">): { best: Lab[]; goEasy: Lab[] }; // best = bestColours, goEasy = the opposite season's palette, the six furthest in Lab from best
export function oppositeSeason(season: Season): Season;
// selfieGuide.ts
export type GuideSample = { guide: Guide; at: number };
export function readyToCapture(samples: GuideSample[], now: number, hold = 700): boolean; // true when the latest sample is "ready" and every sample in the last `hold` ms is "ready", with the first ready sample at least `hold` ms old
// onboarding.ts
export function placeFrom(name: string, latitude: number, longitude: number, source: "device" | "search"): Place | null; // trims the name (non-empty), rounds to 2 decimals, null when NaN or out of [-90, 90] / [-180, 180]
```

- [ ] **Step 1: Write the failing tests**

```ts
// append to src/domain/colourAnalysis.test.ts
test("hair covered drops the hair point and the palette has a go-easy set", () => {
  const reading = { skin: [60, 10, 20] as Lab, hair: [20, 5, 5] as Lab, eyes: [30, 2, 2] as Lab, light: "ok" as const };
  const covered = fromSelfie(reading, true);
  assert.ok("profile" in covered && covered.profile.hair === null);
  const open = fromSelfie(reading, false);
  assert.ok("profile" in open && open.profile.hair !== null);
  const palette = paletteFor({ season: "warm-autumn" as Season });
  assert.equal(palette.best.length, bestColours({ season: "warm-autumn" as Season }).length);
  assert.equal(palette.goEasy.length, 6);
  assert.ok(palette.goEasy.every((lab) => !palette.best.some((b) => deltaE(b, lab) < 1)));
});
```

Use the real `Season` ids from `closet.ts` `seasons` (read the list; replace `"warm-autumn"` with an existing id).

```ts
// append to src/domain/selfieGuide.test.ts
import { readyToCapture } from "./selfieGuide";
test("capture fires once ready has held 700 ms and resets when the guide leaves ready", () => {
  const ready = (at: number) => ({ guide: "ready" as const, at });
  assert.equal(readyToCapture([ready(0), ready(300), ready(650)], 650), false);
  assert.equal(readyToCapture([ready(0), ready(300), ready(700)], 700), true);
  assert.equal(readyToCapture([ready(0), { guide: "still", at: 400 }, ready(500), ready(900)], 900), false);
  assert.equal(readyToCapture([ready(0), { guide: "still", at: 400 }, ready(500), ready(1200)], 1200), true);
});
```

```ts
// append to src/domain/onboarding.test.ts
import { placeFrom } from "./onboarding";
test("a place is trimmed, rounded and validated", () => {
  assert.deepEqual(placeFrom(" Oslo ", 59.91273, 10.74609, "device"), { name: "Oslo", latitude: 59.91, longitude: 10.75, source: "device" });
  assert.equal(placeFrom("Oslo", Number.NaN, 10, "search"), null);
  assert.equal(placeFrom("Oslo", 91, 10, "search"), null);
  assert.equal(placeFrom("   ", 59.9, 10.7, "search"), null);
});
```

- [ ] **Step 2: Run, implement, run; commit**

```bash
git add src/domain
git commit -m "feat: palette with go-easy shades, hair covered, auto capture hold and place validation"
```

### Task 24: Notification plan, completeness, reset

**Files:**
- Create: `src/domain/notifications.ts`
- Modify: `src/domain/profileStats.ts`, `src/domain/onboarding.ts` (`resetCloset`, `replayOnboarding` clear `notification`), `src/i18n/en.ts`, `nb.ts`
- Test: `src/domain/notifications.test.ts`, `src/domain/profileStats.test.ts` (extend)

**Interfaces:**

```ts
// notifications.ts
export type NotificationPlan = { hour: number; minute: number; title: string; body: string; data: { day: "today" | "tomorrow" } };
export function notificationPlan(styling: Pick<Styling, "notification" | "name">, locale: Locale): NotificationPlan | null;
// 21:00 -> body notify.tomorrow, day "tomorrow", title greeting(name, 21, locale); 06/07/08 -> notify.today, day "today", title greeting(name, hour, locale)
// profileStats.ts
export type QuickAdd = "name" | "hijab" | "hijabStyles" | "coverage" | "style" | "fit" | "sparkle" | "colours" | "location" | "body" | "never" | "wearMore" | "details";
export function completeness(closet: Closet): { score: number; next: QuickAdd[] }; // score 0 to 100, integer; parts as architecture.md Domain touches; next = first three missing in that order
```

- [ ] **Step 1: Write the failing tests**

```ts
// src/domain/notifications.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { emptyCloset } from "./closet";
import { notificationPlan } from "./notifications";
import { resetCloset, replayOnboarding } from "./onboarding";

test("one plan per setting, none when off, cleared by a reset", () => {
  assert.equal(notificationPlan({ notification: null, name: "Sara" }, "en"), null);
  assert.equal(notificationPlan({ notification: undefined, name: "Sara" }, "en"), null);
  const morning = notificationPlan({ notification: "07:00", name: "Sara" }, "en")!;
  assert.deepEqual([morning.hour, morning.minute, morning.data.day], [7, 0, "today"]);
  assert.equal(morning.title, "Good morning, Sara");
  assert.equal(morning.body, "Today's outfit is ready");
  const night = notificationPlan({ notification: "21:00", name: null as never }, "nb")!;
  assert.deepEqual([night.hour, night.data.day, night.body], [21, "tomorrow", "Morgendagens antrekk er klart"]);
  const set = { ...emptyCloset, styling: { ...emptyCloset.styling, notification: "08:00" as const } };
  assert.equal(resetCloset(set).closet.styling.notification, undefined);
  assert.equal(replayOnboarding(set).styling.notification, undefined);
});
```

```ts
// append to src/domain/profileStats.test.ts
import { completeness } from "./profileStats";
import { neutralProfile } from "./closet";
test("completeness counts only questions she can answer", () => {
  const empty = completeness(emptyCloset);
  assert.equal(empty.score, 0);
  assert.deepEqual(empty.next, ["name", "hijab", "hijabStyles"]);
  const notNeeded = { ...emptyCloset, styling: { ...emptyCloset.styling, name: "Sara", place: { name: "Oslo", latitude: 59.91, longitude: 10.75 }, everyday: { version: 1, occasion: "everyday" as const, style: "western" as const, hijab: "not-needed" as const, sample: false }, profile: { ...neutralProfile, hijabAnswered: true as const, coverageAnswered: true as const, coverageLevel: null, fit: "loose" as const, sparkle: "plain" as const, styleLean: "western" as const, colour: { skin: [60, 10, 20] as [number, number, number], hair: null, eyes: null, undertone: "warm" as const, depth: "medium" as const, contrast: "medium" as const, season: emptyCloset.styling.profile.colour?.season ?? ("warm-autumn" as never), source: "measured" as const }, heightCm: null, bodyShape: null, neverWear: [], wearMore: [] } } };
  const almost = completeness(notNeeded);
  assert.deepEqual(almost.next, ["body"]);
  const body = { ...notNeeded, styling: { ...notNeeded.styling, profile: { ...notNeeded.styling.profile, heightCm: 165 } } };
  assert.equal(completeness(body).score, 100);
  assert.deepEqual(completeness(body).next, []);
});
```

Keys from `copy.md` Revision 1 > F01 Onboarding and F06: `notify.today`, `notify.tomorrow` ("Today's outfit is ready" / "Dagens antrekk er klart"; "Tomorrow's outfit is ready" / "Morgendagens antrekk er klart"). Confirm the exact strings in `copy.md` before writing them; the test asserts them.

- [ ] **Step 2: Run, implement, run**

Completeness parts: name, hijab (`hijabAnswered` or everyday exists), hijabStyles (only when hijab is not `not-needed`; answered when `profile.hijabStyles !== undefined`), coverage (`coverageAnswered`), style (`styleLean !== null`), fit (`fit !== null`), sparkle (`sparkle != null`), colours (`colour !== null`), location (`place !== null`), body (`heightCm !== null || bodyShape !== null || profile.bodyShape === null && "bodyAnswered"`: store "Prefer not to say" as `bodyShape: null` with a new optional `bodyAnswered?: true` on `StyleProfile`, add it in `closet.ts`), never (`neverWear !== undefined`), wearMore (`wearMore !== undefined`), details (no owned piece with `needsDetails(piece).length`). `score = round(100 * answered / applicable)`.

- [ ] **Step 3: Full suite, lint, commit, lane gate**

```bash
npm run check
git add src/domain src/i18n
git commit -m "feat: notification plan and the completeness meter"
```

Lane 2 gate: `npm run check` only (no screens changed; the baseline flow is unaffected). Rebase on `main` (Lane 1 may have merged), rerun, merge, push.

---

## Lane 3: F01 Start

Covers UC-F01-01 to UC-F01-04, UC-F01-07 to UC-F01-21 (UC-F01-05 and UC-F01-12 Name on Profile belong to L12; UC-F01-06 is retired; UC-F01-20 and the live steps of UC-F01-07 are real-phone rows). Flow doc: `flows/F01-start.md`. Mockup: `S.splash`, `S.closetError`, `S.onbName` to `S.onbDone`, `S.selfieTips`, `S.selfieCam`, `S.selfie`, `S.selfieNotMe`, `AX.onb`, `AX.hijabStyles`, `AX.coverage`, `AX.everyday`, `AX.fit`, `AX.place`, `AX.notify`, `AX.face`, `AX.palette`.

### Task 25: Onboarding route with ten steps

**Files:**
- Rewrite: `app/onboarding/index.tsx`
- Create: `src/features/onboarding/useOnboarding.ts`, `src/features/onboarding/StepName.tsx`, `StepHijab.tsx`, `StepHijabStyles.tsx`, `StepCoverage.tsx`, `StepStyle.tsx`, `StepFit.tsx`, `StepSparkle.tsx`, `StepPlace.tsx`, `StepNotifications.tsx`, `StepColours.tsx`, `StepDone.tsx`, `src/features/onboarding/illustrations.ts`, `src/features/onboarding/BodyShapes.tsx` (moved from `src/features/BodyShapes.tsx`, redrawn with `Tile` `tint`)
- Delete: `src/features/OnboardingBar.tsx`, `src/features/BodyShapes.tsx`
- Modify: `src/i18n/en.ts`, `nb.ts`

**Interfaces:**

```ts
// illustrations.ts
export const illustrations = {
  "coverage-full": require("../../../assets/illustrations/coverage-full.jpg"), "coverage-moderate": ..., "coverage-relaxed": ...,
  "style-western": ..., "style-abaya": ..., "style-mix": ..., "fit-loose": ..., "fit-structured": ...,
  "hijab-hijab": ..., "hijab-shayla": ..., "hijab-al-amira": ..., "hijab-khimar": ..., "hijab-chador": ..., "hijab-niqab": ..., "hijab-burqa": ...,
} as const;
export function coverageOptions(): ChoiceOption<"full" | "moderate" | "relaxed">[]; // labels coverage.*, descriptions coverage.*.description
export function styleOptionsCards(): ChoiceOption<"western" | "desi" | "both">[];  // onboarding.style.*
export function fitOptions(): ChoiceOption<"loose" | "structured">[];
export function hijabStyleOptions(): ChoiceOption<HijabStyle>[]; // bust: true, descriptions hijabStyle.*.description

// Each Step component: { answers: Answers; onChange: (next: Partial<Answers[S]>) => void; error?: string | null }
// StepPlace also takes { onLocate: () => Promise<void>; locating: boolean; message: "denied" | "unavailable" | "offline" | "notFound" | null; onSearch: (query: string) => Promise<void> }
// StepNotifications takes { onPick: (time: NotificationTime | null) => Promise<void>; denied: boolean }
// StepColours takes { onSelfie: () => void }
// StepDone takes { onAddPieces: () => void; onSample: () => void; busy: "add" | "sample" | null }

// useOnboarding.ts
export function useOnboarding(): {
  step: OnboardingStep; steps: OnboardingStep[]; position: number; total: number; answers: Answers; error: string | null; busy: boolean;
  set<S extends keyof Answers>(step: S, answer: Answers[S]): void; next(): Promise<void>; back(): void;
  finish(target: "add" | "sample"): Promise<void>;
};
// next() writes the step's answer through applyAnswer (every step except notifications, which stores the time on styling and asks permission only when a time is chosen; nothing is scheduled before finish), then skipStep. finish() calls finishOnboarding, syncSchedule(notificationPlan(...)) when a time is set and permission granted, then router.replace("/today") and router.push(addPiecesRoute) for "add" (the Closet tab must be under Add pieces: navigate with router.replace("/(tabs)/closet") then router.push(addPiecesRoute)).
```

- [ ] **Step 1: Build the step frame**

`app/onboarding/index.tsx` renders `Screen` with `progress={{ step: position, total, label: t("onboarding.progressLabel", { step, total }) }}`, `leading="back"` only when `position > 1` (custom `HeaderItem` with `chevron.left`, `headerShown` through `Screen`; the native chevron is not available because onboarding is one route, so render a left `HeaderItem` icon `chevron.left` with label `common.back`), the step title as `Text role="title"` with `accessibilityRole="header"` and `accessibilityValue` "Step 3 of 10" (`onboarding.progressLabel`), the step body, and `Footer` with `onboarding.next` alone (always enabled; busy while writing). Step change in place per `motion.md` > Transitions > Step change in place (`gestureEnabled: false`, outgoing fades `quick` `release`, incoming after `step`, `setAccessibilityFocus` on the title). `common.error.save` as the Footer error when a write fails; the answer is kept.

Replay (`replayOnboarding`) opens the same ten steps prefilled through `answersFrom`.

- [ ] **Step 2: Build each step to its flow doc section (`flows/F01-start.md` > S3 > Step 1 to Done) and mockup**

Name: `Field` with `onboarding.name.question` as its label (hidden, the title says it), `returnKeyType="next"`, return calls `next()`, `maxLength` 40, `autoFocus`. Hijab: `ChipRow` single, nothing preselected, options `hijab.always`, `hijab.sometimes`, `onboarding.hijab.no`. Hijab styles: `ChoiceCardGroup multi exclusive="none"` with `plain=[{ id: "none", label: common.noneOfThese }]`, announces `choice.clearedOne/Many` when a tap clears others. Coverage: cards plus plain `coverage.noPreference`; selecting writes `{ coverage, answered: true }`. Style: three cards. Fit: two cards plus `onboarding.depends`. Sparkle: `ChipRow` of four. Place: `Button secondary` `place.useLocation` (icon `location`), the search `Field` (placeholder and label `place.search`, `returnKeyType="search"`, submit runs `geocodeCity` from `ClosetVision`), one message slot under the Field (`place.locationOff` + `common.openSettings` quiet, `place.notFound`, `onboarding.city.notFound`, `common.offline`), the found city written into the Field with `trailing="check"`, `place.privacy` footnote under it (mockup). Notifications: `ChipRow` single with `notify.off` selected by default, times from `notify.time` (`{time}` through `Intl.DateTimeFormat` h23) and `notify.nightBefore`; choosing a time calls `askNotificationPermission()`; denied shows `notify.denied` + `common.openSettings` under the chips with the chip kept. Colours: `Button secondary` `colours.selfie` (icon `camera`) pushing `/onboarding/colours`; shows the `Swatches` best row when a colour profile exists. Done: `EmptyState` with mark, title `onboarding.done.title`, primary `closet.addPieces`, secondary quiet `sample.try`, the other button disabled while one is busy (corrupting write rule).

- [ ] **Step 3: Copy keys**

Add the keys from `copy.md` > Revision 1 > F01 Onboarding (all rows from `onboarding.name.question` to `onboarding.done.title`) and from F01 Start that the flow doc Copy table lists and that are missing. Cut: `common.skip`, `onboarding.cancel`, `onboarding.hijab.title` and the other `onboarding.<step>.title` keys the old screen used, `onboarding.taste.*`, `onboarding.styleLean.question`, `onboarding.colours.swatch` (once no reader remains; the Profile answer screens in L12 still read `onboarding.units.*`, `onboarding.height.*`, `onboarding.shape.question`, `onboarding.colourLean.*`, so keep those).

- [ ] **Step 4: Update the shared Maestro helpers and run the step flows**

`.maestro/lib/skip-onboarding.yaml`: `launchApp` with `clearState: true`, then `repeat: { times: 10, while: { notVisible: "You are set" }, commands: [tapOn: "Next"] }`. `.maestro/lib/sample-closet.yaml`: `runFlow: skip-onboarding.yaml`, `tapOn: "Try the sample closet"`, `extendedWaitUntil: { visible: { id: today-outfit }, timeout: 60000 }` (the old Today keeps `testID="today-outfit"`; L7 keeps it).

Write `.maestro/start/onboarding.yaml`:

```yaml
appId: com.zaimimran.almari
# UC-F01-03
---
- launchApp:
    clearState: true
    permissions:
      all: allow
- assertVisible: "What's your name?"
- assertVisible:
    id: "step-1-of-10"
- inputText: "Sara"
- tapOn: "Next"
- assertVisible: "Do you wear a hijab?"
- assertNotVisible: "Skip"
- tapOn: "Sometimes"
- tapOn: "Next"
- assertVisible: "Which styles do you wear?"
- tapOn: "Hijab"
- tapOn: "Shayla"
- tapOn: "Next"
- assertVisible: "How covered do you like your everyday outfits?"
- tapOn: "Modest"
- tapOn: "Next"
- assertVisible: "What do you wear most days?"
- tapOn: "A mix of both"
- tapOn: "Back"
- assertVisible: "How covered do you like your everyday outfits?"
- tapOn: "Next"
- assertVisible: "What do you wear most days?"
- tapOn: "Next"
- assertVisible: "How do you like your clothes to sit?"
- tapOn: "Loose"
- tapOn: "Next"
- assertVisible: "For Eid and parties, how much sparkle?"
- tapOn: "A little"
- tapOn: "Next"
- assertVisible: "Where are you?"
- tapOn: "Next"
- assertVisible: "When should your outfit come?"
- tapOn: "Next"
- assertVisible: "Which colours suit you?"
- assertVisible:
    id: "step-10-of-10"
- tapOn: "Next"
- assertVisible: "You are set"
- takeScreenshot: docs/redesign/screens/after/start/done
- tapOn: "Try the sample closet"
- extendedWaitUntil:
    visible: "Good morning, Sara|Good afternoon, Sara|Good evening, Sara|Hi, Sara"
    timeout: 60000
- tapOn:
    id: "header-profile"
- tapOn: "Your style"
- assertVisible: "Sometimes"
- assertVisible: "Hijab, Shayla"
- assertVisible: "Modest"
- assertVisible: "Loose"
- assertVisible: "A little"
```

The step title carries `testID="step-{position}-of-{total}"` (its `accessibilityValue` is `onboarding.progressLabel`), which is how the flow checks the count without visible text. The `header-profile` testID is set by L1's Today header item (Task 10) and kept by L7.

- [ ] **Step 5: The other start flows**

| File | UC | Seed | Steps |
|---|---|---|---|
| `launch.yaml` | UC-F01-01 | sample closet, then `launchApp` without `clearState` | `wait id:today-outfit`; `gone id:splash` (the overlay sets `testID="splash"` while mounted); `shot launch` |
| `closet-error.yaml` | UC-F01-02 | `break-closet.sh` | `launchApp` keep state; `see "Could not open your closet"`; `see "Try again"`; `shot closet-error`; run `clear.sh` is not possible mid-flow, so the flow ends here; a second flow `closet-error-retry.yaml` seeds a good closet and asserts Today |
| `name.yaml` | UC-F01-12 | none | type "Sara", return advances; `back`, clear, Next; finish; Today title is "Good morning|Good afternoon|Good evening" without a name |
| `hijab-styles.yaml` | UC-F01-13 | none | hijab Always; tap Hijab, Khimar; tap "None of these" clears; tap Shayla clears None; repeat with "No": next step is coverage with `id:step-3-of-9`; `shot hijab-styles` |
| `coverage.yaml` | UC-F01-14 | none | tap Relaxed; Next; finish; Profile > Your style shows Relaxed and "My own limit" chip |
| `style.yaml` | UC-F01-15 | none | tap "Abaya or desi"; finish with sample; context row shows "Desi" |
| `fit.yaml` | UC-F01-16 | none | tap Structured; Your style shows Structured |
| `sparkle.yaml` | UC-F01-17 | none | tap Heavy; finish; Your style shows Heavy; Adjust occasion Eid Show outfit: `wait id:today-outfit` (the Eid preference itself is a unit test, Task 16) |
| `city.yaml` | UC-F01-04 | `permissions: { location: deny }` | tap "Use my location"; `see "Location access is off"`; `see "Open Settings"`; `type "Oslo"` in the search field; `see id:place-check`; tap Next; nonsense name shows "Could not find this city" |
| `location.yaml` | UC-F01-18 | `fixture.sh location=oslo` is not needed: `xcrun simctl location "Closet Development" set 59.9139,10.7522` in a `# seed: set-location.sh` script | tap "Use my location"; `wait id:place-check`; `see "Oslo"`; finish with sample; forecast chip contains "Oslo" |
| `notifications.yaml` | UC-F01-19 | `fixture.sh now=2026-10-05T06:59:30+02:00` | tap "07:00"; Next; finish; the schedule exists: assert through Profile > Morning outfit showing "07:00"; a second flow with `permissions: { notifications: deny }` asserts "Notification access is off" |
| `colours-selfie.yaml` | UC-F01-07 (library path) | `addMedia: [assets/fixtures/selfie.jpg]` (add a neutral face photo fixture under `assets/fixtures/`) | Task 26 |
| `colours-denied.yaml` | UC-F01-08 | `permissions: { camera: deny }` | Task 26 |
| `colours-camera-failed.yaml` | UC-F01-11 | `fixture.sh cameraFails=true` | Task 26 |
| `palette.yaml` | UC-F01-21 | library selfie | Task 26 |
| `add-my-clothes.yaml` | UC-F01-09 | none | finish; tap "Add pieces"; `see "Add pieces"` title; `back`; `see "Your first piece"` (Closet tab under it) |
| `sample-closet.yaml` | UC-F01-10 | none | finish; tap "Try the sample closet"; `wait id:moment-generating` is optional (fast); `wait id:today-outfit`; `see "Sample"` chip |
| `labels.yaml` | accessibility | none | every step: `assertVisible: { id: step-title }`; cards carry `accessibilityState` checked (Maestro cannot read it; assert the `selected` text in the card label through `id:card-<id>-selected` set only when selected) |

Write each as a full YAML file following the shorthand. Screenshots for the critic: `name`, `hijab`, `hijab-styles`, `coverage`, `style`, `fit`, `sparkle`, `place`, `notify`, `colours`, `done`.

- [ ] **Step 6: Run and commit**

```bash
npm run check && npm run e2e -- .maestro/start
git add -A app/onboarding src/features/onboarding src/features src/i18n .maestro
git commit -m "feat: ten-step onboarding with illustrated choice cards"
```

### Task 26: Colours route: tips, face circle with auto capture, palette

**Files:**
- Rewrite: `app/onboarding/colours.tsx`
- Create: `src/features/selfie/useSelfie.ts`, `src/features/selfie/SelfieTips.tsx`, `src/features/selfie/SelfieCameraPhase.tsx`, `src/features/selfie/PaletteResult.tsx`, `src/features/selfie/NotMe.tsx`
- Delete: `src/features/SelfieCamera.tsx`, `src/features/SamplePoints.tsx`, `src/features/colourText.ts` (its `seasonLabel` and `swatchLabel` move into `PaletteResult.tsx`)

**Interfaces:**

```ts
export function useSelfie(): {
  phase: "tips" | "camera" | "measuring" | "result"; guide: Guide | null; retake: Retake | "failed" | null; camera: "ready" | "denied" | "unavailable" | "failed";
  hold: SharedValue<number>; profile: ColourProfile | null; hairCovered: boolean; palette: { best: { hex: string; name: string }[]; goEasy: { hex: string; name: string }[] } | null;
  openCamera(): void; onReading(reading: SelfieReading & { guide: CameraReading }): void; capture(): void; chooseFromLibrary(): Promise<void>;
  setHairCovered(next: boolean): void; adjust(change: Partial<Pick<ColourProfile, "undertone" | "depth" | "contrast">>): void; retakePhoto(): void; save(): Promise<void>;
};
```

- [ ] **Step 1: Build the three phases per `flows/F01-start.md` > S4a, S4b, S4c and `motion.md` > Face circle and auto capture**

Tips: `Expander card`-style `surface` block with four `headline` lines (`colours.tip.*`), `colours.camera.privacy` footnote, Footer `colours.openCamera`. Camera: `FaceCircle` wrapping `SelfieCameraView` (from `modules/closet-vision/src`), `hold` driven by `withTiming(1, { duration: motion.timer.dwell, easing: Easing.linear })` started when the guide becomes `ready`, reversed (`quick`, `release`) when it leaves; on completion `scheduleOnRN(fireIfReady)` which checks `readyToCapture(samples, Date.now())` and calls the native `capture` once (`taking` ref). Manual capture: the circle's `activate`, the `takePhoto` custom action and `magicTap`. Feedback line under the ring (`selfie.guide.*`), height reserved with `useMeasuredMax` over every guide and retake string; `colours.library` quiet under it. Measuring: the still photo in the circle, `Silk sheen` (`testID="moment-loading"`), label `colours.busy`. Result: season title (`season.*`, header, focused), `Swatches` `colours.bestShades` and `colours.goEasy` from `paletteFor` through `labHex` and `colorName`, `NotMe` quiet button opening a `headless` Expander with Retake (secondary, icon camera), the `colours.hairCovered` toggle `Row`, three `Segmented` (`colours.undertone`, `colours.depth`, `colours.contrast`), Footer `colours.save`. `hairCovered` starts true unless `everyday.hijab === "not-needed"`. `fixtures.cameraFails` makes the native capture reject so UC-F01-11 can assert `colours.cameraFailed` with `colours.library` and `common.tryAgain`. Leaving the screen cancels the countdown and the pending measure (`active` ref), deletes the temp selfie.

Save writes `applyAnswer(closet, "colours", { colour, colourLean })` and pops.

- [ ] **Step 2: Maestro flows**

`colours-selfie.yaml` (UC-F01-07 simulator steps 5 to 9): onboarding to step 10, tap "Take a selfie", `see "Daylight, facing a window"`, tap "Open camera", `see "Camera access is off"` is absent (allowed), tap "Choose a recent selfie", pick the first photo (`tapOn: { id: ... }` on the system picker is matched by text "Recents" then the first image cell; reuse the picker steps from the old `.maestro/onboarding/colours.yaml` in git history `git show 123fc23:.maestro/onboarding/colours.yaml`), `wait id:moment-loading` optional, `wait id:colour-result`, `see "Best hijab shades"`, `see "Go easy on"`, tap "These don't look like me", `see "Retake"`, `see "Hair covered"`, tap "Cool", `see id:colour-result`, tap "Save colours", `see "Which colours suit you?"`, `shot palette`. `colours-denied.yaml`: camera denied, tap "Open camera", `see "Camera access is off"`, `see "Open Settings"`, `see "Choose a recent selfie"`. `colours-camera-failed.yaml`: `fixture.sh cameraFails=true`, open camera, tap the circle (`tapOn: { id: face-circle }`), `see "Could not open the camera"`, `see "Try again"`. `palette.yaml` (UC-F01-21): as `colours-selfie` plus `shot palette-notme` with the Expander open and the Profile > Colours row showing the season after save.

- [ ] **Step 3: Run and commit**

```bash
npm run check && npm run e2e -- .maestro/start
git add -A app/onboarding/colours.tsx src/features/selfie src/features .maestro/start
git commit -m "feat: selfie tips, face circle with auto capture and the palette result"
```

### Task 27: Gate, screenshots and merge for L3

- [ ] **Step 1: Large text and bokmål screenshots for the critic**

`.maestro/start/large.yaml`: `xcrun simctl ui "Closet Development" content_size accessibility-extra-extra-extra-large` in a `# seed: ax5.sh` script (`.maestro/lib/ax5.sh`, and `.maestro/lib/default-size.sh` resets with `content_size medium`), language set to bokmål through the fixture file (`fixture.sh language=nb` makes `ClosetProvider` call `setLanguage("nb")` on load), screenshots of hijab styles, coverage, place, notify, face circle, palette, matching `AX.hijabStyles`, `AX.coverage`, `AX.place`, `AX.notify`, `AX.face`, `AX.palette`.

- [ ] **Step 2: Gate and merge** (commands in the Lanes section).

### Task 28: Hand-off notes for L12

Record in `docs/redesign/signoff.md` > "Lane notes" which exports L12 reuses: `coverageOptions`, `styleOptionsCards`, `fitOptions`, `hijabStyleOptions`, `StepPlace`, `StepNotifications`, `StepColours`, `BodyShapes`, and that `/onboarding/colours` saves through `applyAnswer("colours")` and pops, so Profile's Colours answer needs no second save.

---

## Lane 4: F02 Add pieces and background tagging

Covers UC-F02-01 to UC-F02-23 (UC-F02-02 camera steps and UC-F02-11 Studio need fixtures; the simulator path uses the library and the `studio` fixture). Flow doc: `flows/F02-add-pieces.md`. Mockup: `S.add`, `S.addTips`, `S.confirm`, `S.group`, `S.byHand`, `S.closetAdded`, `S.batch`, `AX.add`.

### Task 29: Add pieces grid with tips, sources, sections, select and colour lines

**Files:**
- Rewrite: `app/capture/index.tsx`
- Create: `src/features/capture/useCaptureGrid.ts`, `src/features/capture/JobTile.tsx`, `src/features/capture/CaptureSources.tsx`
- Modify: `src/features/Retake.ts` (keep), `src/state/imports.ts` (`acceptImports` already returns `settleWardrobe`; nothing else)

**Interfaces:**

```ts
export function useCaptureGrid(): {
  jobs: ImportJob[]; sections: { category: Category | null; jobs: ImportJob[] }[]; groups: { captureId: string; jobs: ImportJob[]; thumbnail: string }[];
  ready: number; confirm: number; failed: number; tipsOpen: boolean; toggleTips(): void; selecting: boolean; selected: string[]; toggleSelect(id: string): void; startSelect(): void; endSelect(): void;
  takePhotos(): Promise<void>; choosePhotos(): Promise<void>; setColour(id: string, name: string): Promise<void>; retry(id: string): Promise<void>; remove(id: string): Promise<void>; undoRemove(id: string): Promise<void>;
  addReady(): Promise<"popped" | "stayed">; error: string | null; busy: boolean;
};
```

- [ ] **Step 1: Build S1 per `flows/F02-add-pieces.md` > S1 and mockup `S.add`**

`Screen` title `title.addPieces`, actions: `HeaderItem` `lightbulb` (`capture.tips`, `expanded` tied to the tips Expander) and `HeaderItem` text `common.select` (hidden while the grid is empty; becomes `common.cancel` in select). Tips: `headless` Expander at the top with three `headline` lines and two meta lines and a secondary "Got it"; first run opens it (`photoTipsSeen`). Sources: four `Row`s with leading icons (`camera`, `photo`, `viewfinder` with chevron for Scan, `pencil` with chevron for Add by hand); Scan pushes `/capture/scan`, Add by hand pushes `/piece/new`. Grouped tiles ("3 pieces in one photo", raw photo, chevron) in their own grid slot; then one `Section` per category with count (`groupByCategory` on `pieceFromImport`-shaped previews: group by `categoryOf(job.kind)`), queued and failed jobs in an untitled last group. `JobTile`: `Tile` with `state` from the job, the colour line (`colour: { hex, name, onPress }`) on Ready tiles opening a `ColourChips` Expander under that tile (writes `correctImport(closet, id, { colour })`), the dot on Confirm tiles, `Try again` on failed, `result.removed` with Undo on removed. Footer: `capture.addMany` (count of ready jobs), hidden (Waiting) until a ready job exists; in select mode `capture.confirmMany` pushes `/capture/[id]?ids=a,b,c`. Accessibility announcements per the flow's Copy table. Add commits `acceptImports`, then: grid empty, `router.dismissTo("/(tabs)/closet")` (pops the capture stack); tiles left, stays and announces `closet.addedMany`. Pass the added ids to Closet through `setLastAdded(ids)` from `src/state/launch.ts` (Task 11); Closet reads `takeLastAdded()` on focus.

- [ ] **Step 2: Build S3 Pieces found (`app/capture/group/[id].tsx`) per S3 and mockup `S.group`**

Photo with numbered outlines (`CameraFrame outline` state found drawn per region on the still photo), rows with thumbnails and `checked` state (Keep/Drop), `closet.linkSet` toggle `Row` (enabled with two or more kept), Draw a box inline mode (`capture.addPiece`, Smaller, Larger, `capture.useBox` with the selecting moment per `motion.md` > Capture group "Use this box", `testID="moment-selecting"` while the parse runs), Footer `common.done` (to the first kept Confirm, else back). `setKeepAsSet(closet, captureId, on)` on toggle. The same screen serves the scan review (L9 sets `?scan=1` to title it `scan.reviewTitle`... the flow doc cut that key: one title `capture.group.title`).

- [ ] **Step 3: Build S2 New piece confirm (`app/capture/[id].tsx`) per S2 and mockup `S.confirm`, and S4 Add by hand (`app/piece/new.tsx` through `PieceEditor`)**

Title `confirm.titleStep` ("New piece, 2 of 3"), `leading="cancel"` with the discard guard (`useDiscardChanges`), hero `Tile` (cut-out), quiet `cutout.adjust` or `cutout.byHand` under it pushing `/cutout/[id]?target=import`, the category question block (`capture.askCategory` chips plus `capture.somethingElse` expanding every category), then `Row`s with trailing values that open Expanders: Photo (`photo.enhanced`, `photo.plain`, `photo.original`, `photo.clean` with the Studio moment and `fixtures.studio`), Colour (`ColourChips`), Style (`style.desi`/`style.western` or the fixed line), facts (`fact.sparkle`, Warmth on hijabs and layers, sleeve, length, see-through as `fact` chips), Care label `Row` (`careLabel.addLabel`/`editLabel`) pushing `/label/[id]?target=import`, duplicate and advice `Banner`s, destructive `capture.remove` (`result.removed` with Undo on the grid), Footer `common.looksRight` (next confirm, else back). With `ids` (Confirm N pieces) the answers apply to every id through `correctImport` in a loop. `PieceEditor` (`piece/new`) is rebuilt on the primitives: dashed photo frame, quiet Take photo / Choose photo, category chips, Style `Segmented`, name `Field`, Footer `editor.addToCloset` disabled until complete with `manual.missing` as the Footer error line.

- [ ] **Step 4: Copy keys and deletions**

Add from the F02 Copy table what is missing (`confirm.titleStep`, `fact.photo`, `careLabel.addLabel`, `careLabel.editLabel`, `result.removed`, `capture.colourLabel`, `common.editColourHint`, `common.editColour`, `progress.confirmOne/Many`, `fact.mixed`, `capture.partialShort`, `capture.boxMove`, `capture.stateConfirm` reworded). Cut `closet.preparingOne/Many`, `closet.readyOne/Many`, `attribute.embellishment` and `value.embellishment.*` once `fact.sparkle` replaces them (L6 reads sparkle through `sparkleOf`). Delete `src/features/PhotoChoice.tsx` and `AttributeEditor.tsx` once `PieceEditor` and the confirm no longer import them.

- [ ] **Step 5: Maestro flows under `.maestro/capture/`**

Full flow `background.yaml` (UC-F02-23):

```yaml
appId: com.zaimimran.almari
# UC-F02-23
# seed: fixture.sh slowPrepare=4000
---
- addMedia:
    - "assets/wardrobe/sage-kurta.png"
    - "assets/wardrobe/ivory-tunic.png"
    - "assets/wardrobe/navy-blazer.png"
    - "assets/wardrobe/mauve-hijab.png"
    - "assets/wardrobe/ivory-hijab.png"
    - "assets/wardrobe/chocolate-hijab.png"
    - "assets/wardrobe/charcoal-trousers.png"
    - "assets/wardrobe/chocolate-loafers.png"
- runFlow: ../lib/sample-closet.yaml
- tapOn: "Closet"
- tapOn:
    id: "header-add"
- tapOn: "Choose photos"
- repeat:
    times: 8
    commands:
      - tapOn:
          id: "photo-cell-${index}"
- tapOn: "Add"
- tapOn: "Back"
- extendedWaitUntil:
    visible: "8 new pieces, 0 of 8 ready|8 new pieces, 1 of 8 ready"
    timeout: 60000
- assertVisible:
    id: "moment-generating"
- tapOn: "Today"
- tapOn: "Another"
- extendedWaitUntil:
    visible:
      id: "today-outfit"
    timeout: 60000
- tapOn: "Looks"
- tapOn: "Closet"
- extendedWaitUntil:
    visible: "8 ready to add|7 ready to add, 1 to confirm|6 ready to add, 2 to confirm"
    timeout: 120000
- assertNotVisible:
    id: "moment-generating"
- takeScreenshot: docs/redesign/screens/after/capture/progress-done
- tapOn:
    id: "progress-card"
- assertVisible: "Add pieces"
- assertVisible: "Add 8 pieces|Add 7 pieces|Add 6 pieces"
```

(The system photo picker's cell ids come from `PHPicker`; the old `.maestro/04-capture/variants.yaml` in git history shows the working selectors, reuse them.)

| File | UC | Seed | Steps |
|---|---|---|---|
| `tips.yaml` | UC-F02-01 | none | sample closet; Closet; `tap id:header-add`; `see "Daylight, facing a window"`; tap "Got it"; `gone "Daylight..."`; `tap id:header-tips`; `see "Daylight..."`; `see "Take photos"`, `"Choose photos"`, `"Scan"`, `"Add by hand"`; `shot tips` |
| `take-photo.yaml` | UC-F02-02 | none | library path with one photo; `wait id:moment-generating`; `wait id:job-ready-1`; `see "Colour:"` line |
| `tile-colour.yaml` | UC-F02-22 | `seed-capture.sh` (jobs ready) | tap the colour line of the first tile; tap "Blush"; `see "Colour: Blush"`; "Add N pieces"; open the piece; `see "Blush"` chip |
| `choose-photos.yaml` | UC-F02-03 | none | three photos; three tiles resolve |
| `permissions.yaml` | UC-F02-04 | `permissions: { camera: deny }` | tap "Take photos"; `see "Camera access is off"`; `see "Open Settings"`; "Choose photos" works |
| `failed-job.yaml` | UC-F02-05 | `fixture.sh failPrepare=1` (add this key: the runner fails the first job) | `see "Could not finish"`; `see "Try again"`; tap the tile; `see "Cut out by hand"`, `"Retake"`, `"Remove photo"`; Remove; `see "Removed"`; `see "Undo"` |
| `group.yaml` | UC-F02-06 | `seed-capture.sh` | tap "3 pieces in one photo"; `see id:region-1`; drop row 1; `see "Link as a set"`; toggle on; tap region 2 outline; "Smaller"; "Use this box"; `wait id:moment-selecting` optional; "Draw a box"; drag (`swipe` from id:draw-area); "Use this box"; "Done"; confirm; Add; open piece: "Part of a set" |
| `check.yaml` | UC-F02-07 | `seed-coverage.sh` plus a second review job | tap Confirm tile; tap Colour row; "Blush"; category chip; subcategory; "Looks right"; next confirm; "Looks right"; grid all Ready |
| `confirm-many.yaml` | UC-F02-20 | `seed-capture.sh` variant with four hijab review jobs (`seed-hijabs.sh`, add it) | "Select"; four tiles; "Confirm 4 pieces"; answers; "Looks right"; four Ready |
| `photo-choice.yaml` | UC-F02-08 | `seed-capture.sh` | Photo row; "Original"; "Looks right"; piece shows the original |
| `duplicate.yaml` | UC-F02-09 | `seed-capture.sh` on the seeded owned closet with a duplicate embedding (`seed-duplicate.sh`) | "Is this already in your closet?"; "Different piece"; "Same piece" removes |
| `advice.yaml` | UC-F02-10 | `seed-advice.sh` (job with `advice: "blur"`) | notice; "Use anyway"; gone |
| `studio.yaml` | UC-F02-11 | `fixture.sh studio=ok` then `studio=offline` | "Clean background"; `wait id:moment-generating`; chip selected; offline shows "You are offline" |
| `cutout.yaml` | UC-F02-12 | `seed-capture.sh` | "Adjust cut-out"; editor title "Cut-out"; "Done"; back on the confirm |
| `care-label.yaml` | UC-F02-13 | `seed-capture.sh` | Care label "Add"; choose photo; `wait id:moment-generating`; "Save care label"; label lines on the confirm |
| `add-ready.yaml` | UC-F02-14 | `seed-owned.sh,seed-wears.sh,seed-capture.sh` | "Add 2 pieces"; Closet on top; `see "2 added"`; `see "Link as a set"`; `see "Start with these"`; tap Link; `see "Linked"`; tap "Start with these"; `wait id:today-outfit`; `see "Started with"` |
| `first-owned.yaml` | UC-F02-21 | `seed-hijabs.sh` on the sample closet | Add four hijabs; `see "Add tops, bottoms and shoes to style from your clothes"`; `gone "Start with these"`; `see "Mark what I wear most"`; add tunic, trousers, shoes (`seed-outfit-jobs.sh`); `see "3 added"`; `see "Start with these"`; Today: no "Sample" chip |
| `pending.yaml` | UC-F02-15 | `fixture.sh slowPrepare=6000` | one photo; back; `see "1 new piece, getting ready"`; `stopApp`, `launchApp` keep state; card still there; `wait "1 ready to add"`; `see "Hijabs & scarves 1"`; tap card |
| `manual.yaml` | UC-F02-16 | none | "Add by hand"; choose photo; category; kind; name; "Add to closet" |
| `remove-retake.yaml` | UC-F02-17 | `seed-capture.sh` | "Remove photo"; `see "Removed"`; Undo; open; "Retake" |
| `gone.yaml` | UC-F02-18 | `seed-capture.sh` | open the confirm; `runScript` cannot remove the job; instead open `almari://capture/missing-id` with `openLink`; `see "This photo is no longer waiting"`; "Go back" |
| `discard.yaml` | UC-F02-19 | `seed-capture.sh` | rename; back; `see "Discard changes?"`; "Keep editing"; back; "Discard" |

- [ ] **Step 6: Run, screenshots (`add`, `tips`, `confirm`, `group`, `by-hand`, `batch`), commit**

```bash
npm run check && npm run e2e -- .maestro/capture
git add -A app/capture app/piece/new.tsx src/features/capture src/features src/i18n .maestro/capture .maestro/lib
git commit -m "feat: add pieces with tips, sections, colour lines and the batch confirm"
```

### Task 30: Closet progress card contract for L5

- [ ] **Step 1:** Document in `signoff.md` > Lane notes that Closet reads `captureProgress(closet)` for the card and `takeLastAdded()` (from `src/state/launch.ts`) for the "N added" Banner, and that `settleWardrobe` runs inside `acceptImports`. Commit with Task 29.

### Task 31: Gate and merge L4 (commands in Lanes).

### Task 32: Fixtures added by this lane

Add to `src/testing/fixtures.ts` the keys `failPrepare?: number` and `studio?: "ok" | "offline" | "limit" | "fail"` readers in `src/state/imports.ts` and `src/state/studio.ts` (`renderStudio` returns a copied bundled image for `ok`). Commit with Task 29.

---

## Lane 5: F04 Closet

Covers UC-F04-01 to UC-F04-13. Flow doc: `flows/F04-closet.md`. Mockup: `S.closet`, `S.closetMore`, `S.closetSelect`, `S.closetAdded`, `S.batch`, `AX.closet`, `AX.closetMore`, `AX.closetCard`.

### Task 33: Closet tab: search, filter row, panel, progress card, sections, select footer

**Files:**
- Rewrite: `app/(tabs)/closet/index.tsx`
- Create: `src/features/closet/useClosetScreen.ts`, `src/features/closet/FilterPanel.tsx`, `src/features/closet/ClosetGrid.tsx`, `src/features/closet/AddedBanner.tsx`, `src/features/closet/SelectFooter.tsx`, `src/state/closetFilter.ts`
- Delete: `src/features/PieceSections.tsx` (L6 owns the replacement for its weather chips), `Filters` from `src/ui/legacy.tsx`

**Interfaces:**

```ts
// src/state/closetFilter.ts  (a tiny external store so Profile "Never worn", the calendar "Variety" and the completeness chip can open Closet with a filter set)
export function setPendingFilter(filter: Partial<ClosetFilter> & { panelOpen?: boolean; select?: boolean }): void;
export function takePendingFilter(): (Partial<ClosetFilter> & { panelOpen?: boolean; select?: boolean }) | null;
```

- [ ] **Step 1: Build S1 per `flows/F04-closet.md` > S1 and mockup `S.closet`, `S.closetMore`**

`Screen large` title `nav.closet` with `search` (native header search bar, placeholder `closet.search`, `onChangeText` sets `filter.search`), actions `HeaderItem` `plus` (`closet.addPieces`, `testID="header-add"`) and text `common.select` (`testID="header-select"`). Filter row (mockup `closetChips`): fixed `control` chip `closet.more` (`chevron.down`, `expanded`, selected look while `panelFilterCount(filter) > 0`, `accessibilityValue` the set filters joined), a `choice` chip `piece.needsDetails` with the dot (toggles `coverage: "needs-details"`), a hairline divider, then the categories `ChipRow scroll` single select starting with `closet.all` (only categories with pieces). Panel: `headless` Expander with one line per group: Colour (round swatch-only chips from `colourNames` present in the closet), Coverage (`pieceCoverage.full`, `.moderate`, `.layer`), Season (`value.season.*`), Show (`closet.notWornLately`, `closet.neverWorn`, `closet.unavailable`, `closet.putAway`), Style (`style.desi`, `style.western`), Occasion (`occasion.*`), then `closet.clearFilters` in a reserved row. Groups are optional single select (`button` + `selected`). Results apply at once with the Filter result crossfade; `closet.resultsMany` announced after `timer.wait`. Progress card: `Banner tone="progress"` from `captureProgress(closet)` (`progress.newMany`/`newOne`, `progress.readyMany` joined with `progress.confirmMany` and `capture.failedMany` when done, meta `closet.section` per category joined with " · ", `testID="progress-card"`), pressing pushes `addPiecesRoute`. "N added" `Banner` (`AddedBanner`) from `takeLastAdded()` on focus: `closet.addedMany`, actions per `architecture.md` Inline modes > Closet "N added" precedence (`pieces.startWithThese` plus one of `closet.linkSet` when `sameCapture` and no `setId`, `closet.markWearMost` while `!hasAnyWear`, else `looks.new`); when `missingRoles` is not empty the sentence is `closet.missingRoles` and "Start with these" is hidden. Sections: `groupByCategory(filterPieces(...))`, each `Section` with `count` and a 2-column `Tile` grid (1 at `ax`), tiles with the needs-details dot (`needsDetails(piece).length > 0`), meta `piece.away.*` or `closet.putAway`; the whole content is one `Animated.FlatList` with `maintainVisibleContentPosition`, `Silk placeholder` tiles while photos decode (`testID="closet-loading"` resolving to `closet-grid`). Empty: `EmptyState mark` `closet.firstTitle` + `closet.addPieces` (search, filters, Select hidden). No results: `closet.noneFoundTitle` with `closet.clearFilters` only when the panel is closed.

- [ ] **Step 2: Build S2 select per `flows/F04-closet.md` > S2 and mockup `S.closetSelect`**

Title becomes `common.selectedMany` (count), header right `common.cancel`, `plus` hidden; tiles toggle `selected` (long press enters select); `SelectFooter`: `Footer actions` row `looks.markWorn` (opens `adjust.today` / `looks.yesterday` action chips in the row; a pick writes `woreLately(closet, ids, at, idFor)` and shows `ResultBar` `outfit.worn` / `looks.wornYesterday` with Undo), `closet.linkSet` (`linkSet`, `ResultBar` `closet.linked`), `closet.putAwayAction` or `closet.backInCloset` under the Put away filter (`setArchived`, `ResultBar` `result.putAway` / `result.backInCloset` with Undo restoring the selection); pair `looks.new` (pushes `/look/build?pieces=a,b`) and `pieces.startWithThese` (styles through `startOccasion` with `keptIds` from the selection, `wardrobe` owned, then `router.navigate("/(tabs)/today")`; when no everyday style exists, push `/profile/style?then=today` first). Disabled look until the first tile.

Hand-offs in: `takePendingFilter()` on focus sets the filter, opens the panel and focuses More (`setAccessibilityFocus`) or enters select with the quiet row open.

- [ ] **Step 3: Copy keys**

Add the missing keys from the F04 Copy table (`closet.section`, `closet.sectionLabel`, `closet.more`, `closet.worn`, `closet.notWornLately`, `closet.neverWorn`, `closet.putAway`, `closet.unavailable`, `closet.clearFilters`, `closet.noneFoundTitle`, `closet.firstTitle`, `closet.samples`, `closet.markWearMost`, `closet.addedOne/Many`, `closet.missingRoles`, `role.*List`, `closet.linked`, `closet.putAwayAction`, `closet.backInCloset`, `result.putAway`, `result.backInCloset`, `closet.resultsOne/Many`, `progress.*`, `pieceCoverage.*`, `coverage.levelLabel`, `error.setTooSmall`, `common.notSelected`). Cut `closet.moreValue`, `closet.moreCount`, `closet.filterClearHint`, `closet.sampleCountOne/Many`, `archive.*` (the word is Put away) when unread, `title.yourCloset`.

- [ ] **Step 4: Maestro flows under `.maestro/closet/`**

Full flow `filters.yaml` (UC-F04-04):

```yaml
appId: com.zaimimran.almari
# UC-F04-04
# seed: seed-owned.sh,seed-wears.sh
---
- launchApp:
    permissions:
      all: allow
- tapOn: "Closet"
- assertVisible: "More"
- assertVisible: "All"
- tapOn: "Layers"
- assertVisible: "Layers 1"
- assertNotVisible: "Tops"
- tapOn: "All"
- tapOn: "More"
- assertVisible: "Fully covered"
- assertVisible: "Not worn lately"
- takeScreenshot: docs/redesign/screens/after/closet/more
- tapOn: "Not worn lately"
- assertNotVisible: "Rose tunic"
- tapOn: "Not worn lately"
- tapOn:
    id: "colour-blush"
- assertVisible: "Chiffon hijab"
- tapOn:
    id: "colour-blush"
- tapOn: "Fully covered"
- assertVisible: "Long blouse"
- assertVisible: "Ankle trousers"
- assertVisible: "Abaya"
- assertNotVisible: "Knee skirt"
- tapOn: "Needs layering"
- assertVisible: "Knee skirt"
- tapOn: "Clear filters"
- assertVisible: "Rose tunic"
- tapOn: "Put away"
- assertVisible: "No pieces found"
- assertNotVisible: "Clear filters"
- tapOn: "More"
- assertVisible: "Clear filters"
- tapOn: "Clear filters"
- tapOn:
    id: "chip-needs-details"
- assertVisible: "Seed dress"
- assertNotVisible: "Sand hijab"
```

(The piece names come from `.maestro/lib/seed-owned.sh` as extended in Task 13: "Long blouse", "Ankle trousers", "Knee skirt", "Abaya", "Chiffon hijab" (blush), "Seed dress" (no sleeve, no length). Keep those names in the seed.)

| File | UC | Seed | Steps |
|---|---|---|---|
| `empty.yaml` | UC-F04-01 | none | skip onboarding; Add pieces? No: "Try the sample closet" is not pressed; Closet; `see "Your first piece"`; `see "Add pieces"`; `gone "More"`; `shot empty` |
| `browse.yaml` | UC-F04-02 | sample closet then `seed-owned.sh` | `see "Hijabs & scarves"` section with count; `see "Samples"`; tap "Tops"; only Tops; `shot closet` |
| `search.yaml` | UC-F04-03 | `seed-owned.sh` | tap the search bar (`tapOn: "Name or colour"`); type "hijab"; `see "Sand hijab"`; `gone "Rose tunic"`; clear; type "pink"; `see "Chiffon hijab"`; type "zzz"; `see "No pieces found"` |
| `sets.yaml` | UC-F04-05 | `seed-owned.sh` | "Select"; `see "0 selected"`; two tiles; `see "2 selected"`; "Link as a set"; `see "Linked"`; "Cancel"; open one; `see "Part of a set"`; `shot select` |
| `put-away.yaml` | UC-F04-10 | `seed-owned.sh` | Select; two tiles; "Put away"; `see "Put away"` ResultBar; "Undo"; tiles back selected; "Put away"; More > "Put away" filter; Select; one; `see "Back in the closet"`; tap it |
| `never-worn.yaml` | UC-F04-11 | `seed-owned.sh,seed-wears.sh` | Today; `tap id:header-profile`; "Never worn"; Closet with the panel open and "Never worn" selected; tile; "Start with this piece"; `wait id:today-outfit` |
| `worn-lately.yaml` | UC-F04-12 | `seed-owned.sh` | Select; five tiles; "Mark as worn"; "Yesterday"; `see "Worn yesterday"`; Profile "Most worn" lists them; Today shows "Rediscover"; Looks has no new row |
| `style-today.yaml` | UC-F04-06 | `seed-owned.sh` | Select; two; "Start with these"; `wait id:today-outfit`; `see "Started with"` |
| `build-look.yaml` | UC-F04-07 | `seed-owned.sh` | Select; two; "New look"; `see "New look"` title; "Save look"; Looks row (depends on L11's builder; until it merges, assert the title only and mark the save step `# after L11`) |
| `pending.yaml` | UC-F04-08 | `fixture.sh slowPrepare=5000` + one queued job via `seed-queued.sh` | `see "1 new piece, getting ready"`; `wait "1 ready to add"`; `see "Hijabs & scarves 1"`; tap card; "Add pieces" |
| `open-piece.yaml` | UC-F04-09 | `seed-owned.sh` | scroll to the last section; tile; back; the same section is in view |
| `needs-details.yaml` | UC-F04-13 | `seed-owned.sh` | Profile chip "Add piece details"; Closet with Needs details on; tile; set sleeve and length (L6 screen); back; `see "No pieces found"` |

- [ ] **Step 5: Run, screenshots, commit**

```bash
npm run check && npm run e2e -- .maestro/closet
git add -A "app/(tabs)/closet" src/features/closet src/state/closetFilter.ts src/features src/ui/legacy.tsx src/i18n .maestro/closet .maestro/lib
git commit -m "feat: closet with sections, inline filters, progress card and select footer"
```

### Task 34: AX5 and bokmål screenshots (`AX.closet`, `AX.closetMore`, `AX.closetCard`) in `.maestro/closet/large.yaml`; Task 35: gate and merge.

---

## Lane 6: F05 Piece

Covers UC-F05-01 to UC-F05-18 (UC-F05-14 for all six gone routes). Flow doc: `flows/F05-piece.md`. Mockup: `S.piece`, `S.pieceScrolled`, `S.pieceColour`, `S.pieceNeeds`, `S.pieceEdit`, `S.cutout`, `S.label`, `AX.piece`, `AX.cutout`.

### Task 36: Piece detail with fact chips, coverage, sparkle, wear line and actions

**Files:**
- Rewrite: `app/piece/[id].tsx`, `app/piece/edit/[id].tsx`
- Create: `src/features/piece/FactChips.tsx`, `src/features/piece/WeatherChips.tsx`, `src/features/piece/AvailabilityChip.tsx`, `src/features/piece/usePiece.ts`
- Delete: `src/features/MissingPiece.tsx` (replaced by `Screen gone`)

**Interfaces:**

```tsx
export function FactChips({ piece, onChange }: { piece: Piece; onChange: (next: (closet: Closet) => Closet) => Promise<void> }): JSX.Element;
// chips in order: colour (swatch, ColourChips body, setColour), kind, Coverage (pieceCoverage; "Needs details" with the dot when needsDetails(piece).length, body walks the open facts in order), Sparkle (sparkleOf, setSparkle), Season (wearSeason, no chevron), fabric, pattern, length, sleeve, see-through (fact Expanders through confirmFact / confirmAttribute), availability last (AvailabilityChip)
// gone states render <Screen gone={{ title: t("piece.missing.title") }}> (piece target) or t("capture.gone.title") (import target)
```

- [ ] **Step 1: Build S1 per `flows/F05-piece.md` > S1, S1a, S1b, S1c and mockup `S.piece`, `S.pieceScrolled`, `S.pieceColour`, `S.pieceNeeds`**

`Screen` with action `HeaderItem` text `common.edit` (push `/piece/edit/[id]`), hero `Tile hero`, `title` (header, focused after the push), wear line (`piece.wornMany`/`piece.wornOnce` with `lastWorn` and `shortDate`, or `closet.neverWorn`), `Section piece.facts.title` with `FactChips`, `Section sets.partOf` with the set partner `Row`s (`setMembers`), care label `Row` (`careLabel.title`, meta from `labelLines`, chevron, pushes `/label/[id]?target=piece`), `Section piece.usedIn.*` with look `Row`s (`lay` leading, pushes `/look/[id]`), quiet actions `piece.addToLook` (pushes `/look/build?pieces=id`), `piece.planWith` (pushes `/today/adjust?keep=id&focus=day`), `closet.putAwayAction` / `closet.backInCloset` (ResultBar with Undo in place), Footer `piece.startWith` (hidden when away or put away; `stylePiece` then `router.navigate("/(tabs)/today")`; Your style first when no everyday style). `Screen gone` when the id is unknown.

- [ ] **Step 2: Build S2 edit per S2 and mockup `S.pieceEdit`**

Title `piece.edit.title`, `leading="cancel"` with the guard, hero, photo chips (`photo.enhanced`, `photo.plain`, `photo.original`, `photo.clean`), `photo.cleanNote`, `editor.changePhoto` quiet (camera or library, re-prepare shows the Closet tile sheen), name `Field`, category and kind selection (`Segmented`-style rows), `sets.remove`, `editor.remove` destructive with the confirm naming `editor.removeUsedMany`, Footer `common.saveChanges` disabled until dirty and valid. Sample pieces: `closet.sample` line, no photo controls.

- [ ] **Step 3: Cut-out editor and care label screens**

`app/cutout/[id].tsx`: `Screen media` title `cutout.title`, `leading="cancel"` with the guard once edited (`navigation.setOptions({ gestureEnabled: false })` after the first edit), `CameraFrame` around `CutoutEditorView`, `Silk placeholder` then `sheen` while the mask loads (`testID="moment-loading"`), `Segmented` Restore/Erase and Small/Medium/Large (icons on media at `large`), quiet Undo, Reset, `cutout.zoomIn`/`cutout.fit`, Footer `common.done` busy on save; the hint `cutout.hold` collapses after the first select. Retune `CutoutEditorView.swift` per `motion.md` > Current code to retune (72 pt ring, sweep from touch over 640 ms with `CAMediaTimingFunction(controlPoints: 0.22, 0.61, 0.36, 1)`, `UIAccessibility.isReduceMotionEnabled` observed, `selectPiece` and `selectPieceN` accessibility actions; `testID="moment-selecting"` exposed through a `selecting` event the JS sets on the frame). `app/label/[id].tsx`: `Screen` title `careLabel.title`, `leading="cancel"` with the guard, photo with `sheen` while reading (`testID="moment-generating"`), fibre rows, size, brand, origin fields, Footer `careLabel.save`, destructive `careLabel.remove`. Both render `Screen gone` with `piece.missing.title` (piece target) or `capture.gone.title` (import target).

- [ ] **Step 4: Copy keys**

Add the missing F05 keys (`fact.coverage`, `fact.sparkle`, `sparkle.*`, `fact.season`, `fact.sheer`, `pieceCoverage.*`, `piece.needsDetails`, `piece.wornMany`, `piece.wornOnce`, `piece.planWith`, `piece.addToLook`, `piece.startWith`, `piece.edit.title`, `editor.changePhoto`, `piece.missing.title`). Cut `archive.*`, `replace.*` when unread, `attribute.embellishment` and `value.embellishment.*` (coordinate with L4 which cuts the same keys; whoever merges second drops the duplicate deletion).

- [ ] **Step 5: Maestro flows under `.maestro/piece/`**

| File | UC | Seed | Steps |
|---|---|---|---|
| `detail.yaml` | UC-F05-01 | `seed-owned.sh,seed-wears.sh,seed-looks.sh` | Closet; "Rose tunic"; `see "Worn"` line; `see "Coverage"`; `see "Start with this piece"`; look row; `shot piece`, `shot piece-scrolled` |
| `facts.yaml` | UC-F05-02 | `seed-coverage.sh` | "Seed kurta"; tap the Length chip with the dot; options; "Looks right"; chip confirmed |
| `colour.yaml` | UC-F05-15 | `seed-owned.sh` | "Sand hijab"; colour chip; "Blush"; `see "Blush"`; `shot colour` |
| `weather.yaml` | UC-F05-03 | `seed-owned.sh` | "Navy blazer"; Warmth "Warm"; "Sand hijab"; Warmth "Warm" |
| `availability.yaml` | UC-F05-04 | `seed-owned.sh` | availability chip; "In the wash"; Closet More Unavailable finds it |
| `put-away.yaml` | UC-F05-05 | `seed-owned.sh` | "Put away"; `see "Put away"` with Undo; back; More > Put away shows it; open; "Back in the closet" |
| `edit.yaml` | UC-F05-06 | `seed-owned.sh` | Edit; rename; category; "Save changes"; back with changes asks to discard |
| `photo.yaml` | UC-F05-07 | `seed-owned.sh` | Edit; "Change photo"; library; Save; Closet tile `id:moment-generating` then resolves |
| `cutout.yaml` | UC-F05-08 | `seed-owned.sh` | Edit; "Adjust cut-out"; `wait id:moment-loading`; `longPressOn: { id: cutout-canvas }`; `wait id:moment-selecting`; `see "Piece selected"`; "Done" |
| `studio.yaml` | UC-F05-09 | `fixture.sh studio=ok` | Edit; "Clean background"; `wait id:moment-generating`; chip selected after resolve |
| `care-label.yaml` | UC-F05-10 | `seed-owned.sh` | Care label "Add"; choose photo; `wait id:moment-generating`; "Save changes"; reopen; "Remove care label"; confirm |
| `remove.yaml` | UC-F05-11 | `seed-owned.sh,seed-looks.sh` | Edit; "Remove piece"; confirm names the look count; back on Closet |
| `start-with.yaml` | UC-F05-12 | `seed-owned.sh` | "Start with this piece"; `wait id:today-outfit`; `see "Started with Rose tunic"`; "Back to everyday" |
| `plan-with.yaml` | UC-F05-16 | `seed-owned.sh` | "Plan a day"; Adjust with the piece kept and When focused (L10 screen; assert the title "Adjust" and the kept piece chip; the rest `# after L10`) |
| `use-in-look.yaml` | UC-F05-13 | `seed-owned.sh` | "Add to a look"; builder with the piece (`# after L11` for Save) |
| `sparkle-season.yaml` | UC-F05-17 | `seed-owned.sh` | "Rose tunic"; Sparkle chip; "Bridal"; "Navy blazer"; Season reads Winter after Warmth Warm |
| `needs-details.yaml` | UC-F05-18 | `seed-owned.sh` | "Seed dress"; Coverage chip "Needs details"; sleeve "Long"; length "Ankle"; chip "Fully covered"; "Long blouse" with proposed sleeve: sleeve only; "Sand hijab": no Coverage chip; `shot needs-details` |
| `missing.yaml` | UC-F05-14 | none | `openLink: almari://piece/nope`; `see "This piece is no longer here"`; "Go back"; repeat for `piece/edit/nope`, `label/nope?target=piece`, `cutout/nope?target=piece`, `label/nope?target=import` ("This photo is no longer waiting"), `cutout/nope?target=import` |

- [ ] **Step 6: Run, commit**

```bash
npm run check && npm run e2e -- .maestro/piece
git add -A app/piece app/cutout app/label src/features/piece src/features modules/closet-vision/ios/CutoutEditorView.swift src/i18n .maestro/piece
git commit -m "feat: piece detail with coverage, sparkle and colour facts, edit, cut-out and care label"
```

### Task 37: AX5 screenshots (`AX.piece`, `AX.cutout`); Task 38: gate and merge (the Swift change needs `REBUILD=1`).

---

## Lane 7: F06 Today and F08 Change a piece

Covers UC-F06-01 to UC-F06-23 and UC-F08-01 to UC-F08-06 (UC-F06-22 and UC-F06-23 use the notification fixture: the gate reads `fixtures.launchDay` as the notification tap stand-in, add that key). Flow docs: `flows/F06-today.md`, `flows/F08-change-a-piece.md`. Mockup: `S.today`, `S.todayScrolled`, `S.todayAnother`, `S.todayNotForMe`, `S.todayFirst`, `S.todayStarted`, `S.todayPlanning`, `S.todayChange`, `S.todayChanged`, `AX.today`, `AX.todayScrolled`, `AX.change`, `AX.rediscover`, `AX.todayAnother`, `AX.bold`, `AX.xl`, and the moments `genToday`, `splashDemo`.

Session banners follow the mockup, not the Banner rows of `architecture.md`: an occasion or started session shows as a `control` chip with `xmark` first in the context row (`today.banner.occasion` "For a party", `today.banner.started` "Started with {name}"; tap returns to everyday); planning and tomorrow replace the large title with an inline title row (the date, or `today.tomorrow`) and a quiet `today.backToToday` trailing (mockup `todayTop({ back })`). `Banner` is used for planned-for-today, unsaved plan, problems, forecast unavailable and the "Tomorrow's outfit, Show" line.

### Task 39: Today screen

**Files:**
- Rewrite: `app/(tabs)/today/index.tsx`, `src/features/today/useToday.ts`
- Create: `src/features/today/ContextRow.tsx`, `src/features/today/OutfitCard.tsx`, `src/features/today/ActionArea.tsx`, `src/features/today/CheckCard.tsx`, `src/features/today/StartWith.tsx`, `src/features/today/Rediscover.tsx`, `src/features/today/ProblemBanner.tsx`, `src/features/today/FirstRun.tsx`, `src/features/ChangeStrip.tsx`
- Delete: `app/today/check.tsx`, `app/today/replace.tsx`, `app/today/hijab.tsx`, `app/today/everyday.tsx`, `app/today/style.tsx`, `app/today/stylist-results.tsx`, `src/features/today/SavedLooks.tsx`, `src/features/today/ForecastNote.tsx`, `src/ui/OutfitView.tsx`, `src/ui/OutfitCollage.tsx`

**Interfaces:**

```tsx
// src/features/ChangeStrip.tsx (shared with L11)
export type ChangeStripProps = {
  role: Role; pieceId: string; alternatives: { piece: Piece; reason: string | null; planned?: string }[]; currentId: string; open: boolean; onClose: () => void;
  onPick: (piece: Piece) => void; keep?: { kept: boolean; onToggle: () => void }; value?: string; onShowAll?: () => void; onEditColour?: (piece: Piece) => void; onAnotherWithout?: () => void; loading?: boolean; testID?: string;
};
export function ChangeStrip(props: ChangeStripProps): JSX.Element; // Expander body: Tile strip (Rows at ax) with selected disc on currentId, Keep chip, change.none / hijabs.noOther with common.showAll, Edit colour as a Tile action opening ColourChips in the strip
// useToday.ts adds: greetingTitle, mode ("everyday" | "occasion" | "planning" | "tomorrow"), another(), like(), dislike(target: "shown" | "skipped"), saveLook(), openStrip(piece), pick(piece), keep(piece), undo(), wear(), rediscoverPieces, coverageLine, plannedToday, unsavedPlan, tomorrowKept, backToToday(), showTomorrow(), startWithChip(kind), feedback(chip)
```

- [ ] **Step 1: Build S1 per `flows/F06-today.md` > S1 and the Today recipe in `design-system.md` > Screen recipes, mockup `S.today`, `S.todayScrolled`, `S.todayAnother`, `S.todayNotForMe`**

Order: `Screen large` with the greeting title (`greeting(name, hour, locale)` measured on focus against `headerLargeTitleStyle`; fallbacks `greetingShort`, plain, `nav.today`), action `HeaderItem` `person.crop.circle` (`nav.profile`, `testID="header-profile"`, push `/profile`); `ContextRow` (session chip when any, occasion chip pushing `/today/adjust`, style chip, weather chip with `Silk placeholder chip` while the forecast loads, `weather.unavailable` offline, "Sample" chip while `wardrobe === "sample"`); `Banner`s (planned for today with `looks.showOnToday`, unsaved plan with `today.openPlan` and `common.discard`, problem banners with their actions, "Tomorrow's outfit" `today.showTomorrow` line after Back to today); `FlatLay hero` (`maxSize` 236, `swapMark`, `onPiecePress` opens the strip, `state="arranging"` while styling, `testID="today-outfit"`); `ChangeStrip` under it when open; `OutfitCard`: title line (`title` + the three `Button icon`s: `outfit.like` `hand.thumbsup`, `outfit.notForMe` `hand.thumbsdown` with `expanded`, `common.saveLook` `bookmark` filled when `lookForPieces` finds the look and then labelled `today.openLook`; icons move under the reason line at `large`), reason line (`footnote`, the stylist reason plus `coverageNote`, `testID="today-reason"`, measured minimum height), the card's Not for me Expander (chips `feedback.*`, `outfit.thanks` after a pick), `CheckCard` (`Expander attention`), quiet row with `today.another` alone (full width, `busy` while styling), Undo slot (`ResultBar` Undo alone; after Another, Undo and `outfit.notForMe` labelled `outfit.notForMeSkipped` opening the chips under the slot aimed at `previousPieceIds`), `Section today.startWith` (saved-look `Row`s first with `today.lookLabel`, `looks.variantOf` and `looks.fillGap`, `common.showAll`; then chips `today.garment.hijab`, `today.garment.knit` as toggles and `today.startWithPiece` pushing `/today/pieces`), `Section today.rediscover` (`rediscover(closet, clock)`, `Tile strip` row, `Row`s at `ax`, tap = `stylePiece`), the Apple Weather mark link (`forecast.mark`, 44 pt, opens `closet.styling.forecast.attribution.url`), Footer `outfit.wear` (hidden while planning or on tomorrow, where the primary is `common.saveLook` and the card's Save icon is not rendered), ResultBar `outfit.worn` with Undo after Wear this, Footer error `common.error.save`.

First run (`S.todayFirst`): no everyday style and onboarded: `EmptyState mark` with `today.firstRun.style` (push `/profile/style`) and quiet `sample.try`.

Generating: `another()` sets `arranging` until the result, then only changed slots swap; `today.announce.outfit` once. Launch: `Silk placeholder lay` until `today` exists, never arranging on launch (`motion.md` > Splash). `takeLaunchIntent()` on focus: `day: "tomorrow"` calls `prepareTomorrow(closet, clock, tomorrowWeather)` where `tomorrowWeather` is `forecastWeather` for `nextLocalDate` (or `{ source: "unknown" }`), mode `tomorrow`.

- [ ] **Step 2: Build F08 per `flows/F08-change-a-piece.md` > S1, S1a, S1b and mockup `S.todayChange`, `S.todayChanged`**

Opening a piece: `replacementsFor` (non-hijab) or `hijabAlternatives` (hijab, with `plannedPieces` marks and the reason `change.reason.picksUp` built from the reason text), title `change.title` with `role.one.*`, value `change.reason.with` on the hijab strip, `Keep` chip (`toggleKeep`), a pick calls `replacePiece` and `swapPiece` feedback, `result.changed` announced, Undo slot filled; `common.editColour` as a `Tile` action on the selected hijab opening `ColourChips` in the strip (`setColour`); `change.none` with `change.anotherWithout` (`dropFromToday`), `hijabs.noOther` with `common.showAll` (`hijabAlternatives(..., { all: true })`).

- [ ] **Step 3: Copy keys and deletions**

Add the F06 and F08 keys that are missing (the Copy tables of both flow docs; `today.greeting.*` came with L2). Cut `today.changeHijab`, `today.compareHijabs`, `hijabs.currentLabel`, `hijabs.currentVoice`, `change.use`, `change.trying`, `looks.fromYourLooks`, `looks.showing`, `common.showAllCount`, `title.everyday`, `title.changePiece`, `title.choosePieces` (L10 adds its own title key), `check.title`, `title.adjustToday` stays for L10. Delete the six `app/today/*` routes listed above and the two `src/ui/Outfit*.tsx` files; `src/features/today/SavedLooks.tsx` and `ForecastNote.tsx` go.

- [ ] **Step 4: Maestro flows under `.maestro/today/` and `.maestro/change-piece/`**

Full flow `another.yaml` (UC-F06-03) with the generating moment:

```yaml
appId: com.zaimimran.almari
# UC-F06-03
---
- runFlow: ../lib/sample-closet.yaml
- assertVisible: "Another"
- assertNotVisible: "Not for me"
- tapOn: "Another"
- extendedWaitUntil:
    visible:
      id: "moment-generating"
    timeout: 5000
    optional: true
- extendedWaitUntil:
    visible:
      id: "today-outfit"
    timeout: 60000
- assertVisible: "Undo"
- assertVisible: "Not for me"
- takeScreenshot: docs/redesign/screens/after/today/another
- tapOn: "Another"
- tapOn: "Another"
- extendedWaitUntil:
    visible:
      id: "today-outfit"
    timeout: 60000
- tapOn: "Not for me"
- assertVisible: "Too formal"
- assertVisible: "Hijab does not match"
- tapOn: "Too plain"
- assertVisible: "Thanks"
```

| File | UC | Seed | Steps |
|---|---|---|---|
| `first-run.yaml` | UC-F06-01 | skip onboarding, do not press sample | Today; `see "Set your style"`; `see "Try the sample closet"`; tap sample; `wait id:today-outfit`; `shot first-run` |
| `outfit.yaml` | UC-F06-02 | `fixture.sh now=2026-10-05T08:00:00+02:00` | onboarding with the name Sara; sample; `see "Good morning, Sara"`; `see id:today-like`, `id:today-not-for-me`, `id:today-save`; `see id:today-reason`; `see "Wear this"`; `see "Another"`; `shot today`; relaunch keep state: same outfit; second flow `greeting-afternoon.yaml` with `now=...15:00` sees "Good afternoon, Sara" |
| `new-day.yaml` | UC-F06-18 | `fixture.sh now=2026-10-03T09:00:00+02:00` | Adjust Party, Show outfit (L10 screen: until it merges, the flow starts the session through `openLink: almari://today/adjust` is not enough; run this flow after L10 and mark `# after L10`); `stopApp`; `seed fixture.sh now=2026-10-05T08:00:00+02:00`; launch keep state; `gone "For a party"` |
| `wear.yaml` | UC-F06-04 | sample | "Wear this"; `see "Worn today"`; `see "Undo"`; Looks tab shows the worn row; back; "Undo"; `gone "Worn today"` |
| `feedback.yaml` | UC-F06-05 | sample | `tap id:today-not-for-me`; chips; "Hijab does not match"; the hijab strip opens (`see "Change hijab"`) |
| `save-look.yaml` | UC-F06-06 | sample | `tap id:today-save`; `see id:today-save-saved`; tap again; look detail with the suggested name; back; Looks row exists |
| `check.yaml` | UC-F06-07 | `seed-coverage.sh` with My clothes (`seed-owned-everyday.sh` writes everyday style and wardrobe owned) | `see "Sleeve length unknown"`; tap title; chips; tap title again collapses; expand; "Save answer"; gone |
| `from-looks.yaml` | UC-F06-08 | sample + `seed-looks.sh` (sample ids) | Start with rows; tap; outfit becomes the look; checkmark |
| `planned.yaml` | UC-F06-17 | `seed-looks.sh,fixture.sh now=2026-10-11T08:00:00+02:00` | `see "Planned for today: Eid lunch"`; "Show on Today"; `wait id:today-outfit`; "Wear this" |
| `start-with.yaml` | UC-F06-09 | sample | chip "Hijab" toggles and restyles; chip "Knit"; "Start with a piece" pushes the picker |
| `forecast.yaml` | UC-F06-10 | `fixture.sh forecast={"low":4,"high":9,...}` with a place set through onboarding location | `see "Oslo 4 to 9°"`; `see id:forecast-mark`; `fixture.sh forecast=fail`: `see "Weather unavailable"` |
| `problems.yaml` | UC-F06-11 | `seed-owned-everyday.sh` with only two pieces | `see "No shoes"` style problem Banner; "Add pieces" hands off |
| `back-to-everyday.yaml` | UC-F06-12 | `seed-owned.sh` | piece "Start with this piece"; `see "Started with"`; `tap id:session-chip`; `gone "Started with"` |
| `styling-error.yaml` | UC-F06-13 | `fixture.sh failWrite=true` before sample | "Try the sample closet"; `see "Could not style today"`; "Try again" |
| `undo.yaml` | UC-F06-14 | sample | Another; Undo; previous outfit (compare `id:today-title` text captured with `copyTextFrom`) |
| `save-error.yaml` | UC-F06-15 | sample then `fixture.sh failWrite=true` + relaunch | "Wear this"; `see "Could not save. Try again."` in the Footer |
| `open-profile.yaml` | UC-F06-16 | sample | `tap id:header-profile`; `see "Profile"`; back |
| `coverage-note.yaml` | UC-F06-19 | `seed-owned-everyday.sh` (coverage moderate, pieces: short-sleeved top, blazer, ankle trousers, abaya) | `see "Blazer covers the arms."` or `"Trousers reach the ankle."` on the first outfits; Your style coverage No preference: no line |
| `thumbs.yaml` | UC-F06-20 | sample | `tap id:today-like`; `see id:today-like-on`; Undo; `tap id:today-not-for-me`; like off |
| `rediscover.yaml` | UC-F06-21 | `seed-owned-everyday.sh` | `gone "Rediscover"`; Closet Select five; "Mark as worn"; "Today"; Today: `see "Rediscover"`; tile; `see "Started with"`; `shot rediscover` |
| `from-notification.yaml` | UC-F06-22 | `fixture.sh launchDay=today` | launch keep state; `wait id:today-outfit`; no profile |
| `tomorrow.yaml` | UC-F06-23 | `fixture.sh now=2026-10-04T21:00:00+02:00 launchDay=tomorrow` | `see "Tomorrow"` title row; `see "Back to today"`; `gone "Wear this"`; Another; "Back to today"; `see "Show"`; "Show"; `stopApp`; `fixture.sh now=2026-10-05T07:00:00+02:00`; launch; same outfit title |
| `change-piece/swap.yaml` | UC-F08-01 | sample | tap trousers in the lay (`tapOn: { id: lay-piece-bottom }`); `see "Change trousers"`; tap the second strip tile; `see "Undo"`; tap the header to close |
| `change-piece/hijab.yaml` | UC-F08-02 | sample | `tap id:lay-piece-hijab`; `see "Change hijab"`; `see id:change-strip`; first tile selected; tap the second; Undo; `shot change-hijab` |
| `change-piece/colour.yaml` | UC-F08-06 | `seed-owned-everyday.sh` | hijab strip; long press the selected tile; "Edit colour"; "Blush"; `see "Blush"` |
| `change-piece/none.yaml` | UC-F08-03 | `seed-owned-everyday.sh` (one hijab) | hijab strip; `see "No other hijab works with this outfit"`; "Show all" |
| `change-piece/keep.yaml` | UC-F08-04 | sample | strip; "Keep"; Another; the piece stays (`copyTextFrom` the piece label) |
| `change-piece/close.yaml` | UC-F08-05 | sample | pick; tap the header; pick stays; Undo stays |

- [ ] **Step 5: Run, screenshots (`today`, `today-scrolled`, `another`, `not-for-me`, `first-run`, `started`, `change-hijab`, `changed`), commit**

```bash
npm run check && npm run e2e -- .maestro/today && npm run e2e -- .maestro/change-piece
git add -A "app/(tabs)/today" app/today src/features/today src/features/ChangeStrip.tsx src/ui src/i18n .maestro/today .maestro/change-piece .maestro/lib src/testing
git commit -m "feat: Today with greeting, outfit icons, change strip, rediscover and tomorrow's outfit"
```

### Task 40: Tomorrow's outfit and notification launch fixture

`fixtures.launchDay` is read by `app/index.tsx` as a stand-in for `useLastNotificationResponse` (only when set; a device never has the file). Commit with Task 39.

### Task 41: AX5, xLarge and Bold Text screenshots (`AX.today`, `AX.todayScrolled`, `AX.change`, `AX.rediscover`, `AX.todayAnother`, `AX.bold`, `AX.xl`) in `.maestro/today/large.yaml`.

### Task 42: Reduce Motion check of Another and the strip (`.maestro/today/reduce-motion.yaml` with `# seed: reduce-motion.sh` running `xcrun simctl spawn "Closet Development" defaults write com.apple.Accessibility ReduceMotionEnabled -bool true` and a reset script): `moment-generating` appears and resolves.

### Task 43: Gate and merge L7.

---

## Lane 8: F09 Looks and the wear calendar

Covers UC-F09-01 to UC-F09-13. Flow doc: `flows/F09-looks.md`. Mockup: `S.looks`, `S.looksEmpty`, `S.look`, `S.lookWorn`, `S.calendar`, `S.calendarSep`, `AX.looks`, `AX.calendar`.

### Task 44: Looks tab, look detail, calendar

**Files:**
- Rewrite: `app/(tabs)/looks/index.tsx`, `app/look/[id].tsx`
- Create: `app/looks/calendar.tsx`, `src/features/looks/LookRow.tsx`, `src/features/looks/useLook.ts`, `src/features/looks/useCalendar.ts`

- [ ] **Step 1: Looks tab per `flows/F09-looks.md` > 1 and mockup `S.looks`**

`Screen large` `nav.looks`, actions `HeaderItem` `plus` (`looks.new`, push `/look/build`) and `calendar` (`calendar.title`, push `/looks/calendar`). Saved `Row`s from `lookEntries` (lay leading `row`, title, meta `occasion · looks.planned | looks.lastWorn | looks.missingMany`, chevron, label with the piece count), then `Section looks.worn` with worn rows. Empty: `EmptyState mark` `looksTab.emptyTitle` with `looks.new` (`closet.addPieces` when no pieces). `Silk placeholder row` while loading.

- [ ] **Step 2: Look detail per 2, 2a, 3, 4 and mockup `S.look`, `S.lookWorn`**

`Screen` with action `HeaderItem` text `look.rename` (rename in place: the title becomes a `Field kind="rename"`, Done commits, empty keeps), `FlatLay hero` with `onPiecePress` pushing the piece, title, meta line (occasion, `looks.planned` or `looks.lastWorn`), missing `Banner` (`look.missingMany`), `Section` with the piece count and action `look.change` (push `/look/build?id=`), piece `Row`s (`thumb`), quiet `look.markWorn` (opens `adjust.today` / `looks.yesterday` action chips in place; `woreLook`; `ResultBar outfit.worn` / `looks.wornYesterday` with Undo), quiet `looks.plan` (opens `MonthGrid pick` in place with `from` tomorrow, `looks.clearPlan` under it; `setPlannedFor`), destructive `look.remove` last with the confirm `look.removeBody` / `look.removeBodyWorn` (`removeLook`), Footer `looks.showOnToday` (`applyLook` then `router.navigate("/(tabs)/today")` from the Looks stack, `router.back()` chain to Today when opened from Today: use `router.dismissTo("/(tabs)/today")`). Worn, not saved: title is the suggested name, Footer `common.saveLook` (`saveLook` with `lookForPieces` guard) then `looks.showOnToday`. Gone: `Screen gone` with `look.goneTitle`.

- [ ] **Step 3: Calendar per 5 and mockup `S.calendar`, `S.calendarSep`**

`Screen` title `calendar.title`, `MonthGrid wear` fed by `wearCalendar(closet, month, locale)` (`days` as the mark pieces, `monthLabel` from `monthTitle`, `wornCount`, `dayLabel` with `calendar.day` / `calendar.today`), Previous hidden on `firstWearMonth`, Next hidden on the current month; selected day `Section calendar.dayTitle` with wear `Row`s (`lay mini`, occasion meta, push look or the unsaved worn detail `/look/set-...`); `Section stats.mostWorn` (`monthWearStats`, `calendar.timesMany`); current month: Variety `Row` (`calendar.variety`, meta `calendar.varietyValue` with `percent`), chevron, `setPendingFilter({ wear: "not-worn-lately", panelOpen: true })` then `router.navigate("/(tabs)/closet")`; `calendar.emptyMonth` when no wears.

- [ ] **Step 4: Copy keys**

Add the F09 and Revision 1 > F09 Calendar keys that are missing. Cut `looks.open`, `looks.earlierDates`, `looks.laterDates`, `calendar.emptyDay`, `calendar.timesOne`, `title.yourLooks`, `title.yourLook`.

- [ ] **Step 5: Maestro flows under `.maestro/looks/`**

Full flow `calendar.yaml` (UC-F09-12):

```yaml
appId: com.zaimimran.almari
# UC-F09-12
# seed: seed-owned.sh,seed-wears.sh,fixture.sh now=2026-10-14T09:00:00+02:00
---
- launchApp:
    permissions:
      all: allow
- tapOn: "Looks"
- tapOn:
    id: "header-calendar"
- assertVisible: "October 2026"
- assertVisible:
    id: "day-2026-10-02"
- assertNotVisible:
    id: "day-2026-10-01"
- assertVisible: "Variety"
- takeScreenshot: docs/redesign/screens/after/looks/calendar
- tapOn: "Variety"
- assertVisible: "Not worn lately"
- tapOn: "Looks"
- tapOn:
    id: "header-calendar"
- tapOn:
    id: "calendar-previous"
- assertVisible: "September 2026"
- assertVisible: "Most worn"
- assertNotVisible: "Variety"
- tapOn:
    id: "calendar-previous"
- assertVisible: "August 2026"
- assertVisible: "No looks worn in August"
```

| File | UC | Seed | Steps |
|---|---|---|---|
| `empty.yaml` | UC-F09-01 | skip onboarding | Looks; `see "Add pieces"`; with `seed-owned.sh`: `see "No looks yet"`, `see "New look"` |
| `browse.yaml` | UC-F09-02 | `seed-owned.sh,seed-wears.sh,seed-looks.sh` | rows; `see "Planned for Sat 11 Oct"`; `see "Last worn 2 Oct"`; `see "Worn"` section; tap a row; `shot looks` |
| `save-worn.yaml` | UC-F09-03 | `seed-owned.sh,seed-wears.sh` | worn row; `see "Save look"`; tap; `see "Show on Today"`; back; the row is saved |
| `show-on-today.yaml` | UC-F09-04 | `seed-looks.sh` | look; "Show on Today"; Today tab with the look; "Wear this" |
| `mark-worn.yaml` | UC-F09-09 | `seed-looks.sh` | "Worn"; "Yesterday"; `see "Worn yesterday"`; Undo |
| `rename.yaml` | UC-F09-10 | `seed-looks.sh` | "Rename"; `eraseText`; type "Eid Saturday"; `pressKey: Enter`; back; row renamed |
| `plan.yaml` | UC-F09-11 | `seed-looks.sh,fixture.sh now=2026-10-07T09:00:00+02:00` | "Plan"; `tap id:pick-2026-10-11`; `see "Planned for Sat 11 Oct"`; "Plan"; "Clear date"; gone |
| `open-piece.yaml` | UC-F09-05 | `seed-looks.sh` | piece row; piece detail; back |
| `change-pieces.yaml` | UC-F09-06 | `seed-looks.sh` | "Change"; builder title "Edit look" (`# after L11` for the save) |
| `remove.yaml` | UC-F09-07 | `seed-looks.sh,seed-wears.sh` | "Remove look"; confirm text; back on Looks; the worn one keeps its row |
| `missing.yaml` | UC-F09-08 | `seed-looks.sh` with a missing piece (`seed-looks-missing.sh`) | `see "1 piece is no longer in your closet"`; `openLink: almari://look/nope`; `see "This look is no longer here"`; "Go back" |
| `calendar-day.yaml` | UC-F09-13 | as calendar | `tap id:day-2026-10-02`; `see "Sat 2 Oct"` section; row; look detail; back; still selected |

- [ ] **Step 6: Run, screenshots (`looks`, `look`, `look-worn`, `calendar`, `calendar-september`, `empty`), commit**

```bash
npm run check && npm run e2e -- .maestro/looks
git add -A "app/(tabs)/looks" app/look/[id].tsx app/looks src/features/looks src/i18n .maestro/looks .maestro/lib
git commit -m "feat: looks with worn rows, in-place worn and plan, and the wear calendar"
```

### Task 45: AX5 screenshots (`AX.looks`, `AX.calendar` as the Rows form); Task 46: gate and merge.

---

## Lane 9: F03 Scan

Covers UC-F03-01, UC-F03-03 to UC-F03-07 (UC-F03-02 is real phone). Flow doc: `flows/F03-scan.md`. Mockup: `S.scan`, `S.scanned`, `AX.scan`, moment `found`.

### Task 47: Scan screen on the media frame with the fixture feed

**Files:**
- Rewrite: `app/capture/scan.tsx`, `src/features/ScanLift.tsx`
- Create: `.maestro/scan/*.yaml`

- [ ] **Step 1: Build S1 and S1u per `flows/F03-scan.md`**

`Screen media` title `scan.title`, action `HeaderItem` `camera.rotate` (`scan.switch`), `CameraFrame full` around `LiveScanView` or `FixtureScanView` (when `fixtures.scan`), `outline` from `scanStep` (searching dashed while `find`/`show`, found solid over `dwell` while `hold`), guide pill from `scan.status.*` (held `timer.dwell`, announced `{ queue: false }` at most every `timer.announce`), `readout` toggled by a long press on the pill (`scan.speedShow` / `scan.speedHide` as accessibility actions, shown in release builds), shutter (enabled when found in manual mode), tray of `Tile thumb`s (`scan.trayLabel`), `Segmented` `scan.auto` / `scan.manual` (persisted in `styling.scan`), Footer `common.done` (pushes `/capture/group/[scanId]` when the tray has pieces, else `router.back()`), `scan.captureFailed` line under the heading on a failed capture. Unavailable or denied: `CameraFrame unavailable` with `common.cameraOff` / `scan.unavailable`, `common.openSettings`, `capture.choosePhotos` (pops and opens the library through `setLaunchIntent`-style flag `openLibrary` on the capture grid), no shutter ring. `ScanLift` retuned per `motion.md` > Current code to retune: sticker fades in on the box (`quick`), fades out (`base`, `release`) while the tray thumb fades in, `withDelay`/`withSequence`, `scheduleOnRN` on landing, `testID="moment-found"` on the outline while a piece is detected, `scan-sticker` on the sticker, `tray-slot-N` on each slot; Reduce Motion per the R row. `light` impact haptic on landing, `scan.pieceAdded` announced once.

- [ ] **Step 2: Maestro flows**

Full flow `auto-fixture.yaml` (UC-F03-07):

```yaml
appId: com.zaimimran.almari
# UC-F03-07
# seed: fixture.sh scan=kameez-dupatta
---
- runFlow: ../lib/sample-closet.yaml
- tapOn: "Closet"
- tapOn:
    id: "header-add"
- tapOn: "Scan"
- extendedWaitUntil:
    visible: "Hold up a piece"
    timeout: 20000
- extendedWaitUntil:
    visible:
      id: "moment-found"
    timeout: 20000
- extendedWaitUntil:
    visible: "Hold still"
    timeout: 20000
- extendedWaitUntil:
    visible:
      id: "tray-slot-1"
    timeout: 20000
- assertNotVisible:
    id: "scan-sticker"
- extendedWaitUntil:
    visible:
      id: "tray-slot-2"
    timeout: 30000
- takeScreenshot: docs/redesign/screens/after/scan/tray
- tapOn: "Done"
- assertVisible: "Pieces found"
- assertVisible:
    id: "review-thumb-1"
- assertVisible:
    id: "review-thumb-2"
- assertVisible: "Link as a set"
```

| File | UC | Seed | Steps |
|---|---|---|---|
| `denied.yaml` | UC-F03-01 | `permissions: { camera: deny }` | Scan; `see "Camera access is off"`; `see "Open Settings"`; `see "Choose photos"`; `see "Go back"`; "Choose photos" returns to Add pieces |
| `manual.yaml` | UC-F03-03 | `fixture.sh scan=kameez-dupatta` | "Manual"; `see "Tap to take it"`; shutter (`tap id:shutter`); `wait id:tray-slot-1`; `tap id:header-switch`; "Start again" is not in the flow doc (cut), skip; relaunch keeps Manual |
| `done.yaml` | UC-F03-04 | fixture | two captures; "Done"; review rows with thumbs; toggle "Link as a set"; "Done"; confirms; "Add 2 pieces"; `see "2 added"`; empty tray: "Done" pops; back with pieces: Add pieces shows "2 from a scan" |
| `capture-failed.yaml` | UC-F03-05 | `fixture.sh scan=kameez-dupatta failCapture=1` (add the key: the first `capture` rejects) | `see "Could not take that one"` line (`scan.captureFailed` string from `copy.md`); detection resumes (`wait id:tray-slot-1`) |
| `debug.yaml` | UC-F03-06 | fixture | `longPressOn: { id: scan-guide }`; `see id:scan-readout`; long press again; gone |
| `reduce-motion.yaml` | UC-F12-06 part | fixture + `reduce-motion.sh` | as auto-fixture: `moment-found` then `tray-slot-1` |

- [ ] **Step 3: Run, screenshots (`scan`, `scanned`), gate, merge**

```bash
npm run check && npm run e2e -- .maestro/scan
git add -A app/capture/scan.tsx src/features/ScanLift.tsx src/testing src/i18n .maestro/scan .maestro/lib
git commit -m "feat: scan on the media frame with the fixture feed and the found-clothes moment"
```

---

## Lane 10: F07 Adjust today

Covers UC-F07-01 to UC-F07-08. Flow doc: `flows/F07-adjust-today.md`. Mockup: `S.adjust`, `S.pieces`, `S.todayPlanning`, `AX.adjust`.

### Task 48: Adjust and Start with a piece

**Files:**
- Rewrite: `app/today/adjust.tsx`, `app/today/pieces.tsx`
- Create: `src/features/adjust/useAdjust.ts`, `src/features/adjust/WhenRow.tsx`

- [ ] **Step 1: Adjust per `flows/F07-adjust-today.md` > 1 and mockup `S.adjust`**

`Screen` title `title.adjust`, `leading="cancel"` with the guard, blocks in order: Occasion `ChipRow` (`occasion.*`, labels per `copy.md` F07 shortened wedding and barat), When (`adjust.day`: chips `adjust.today`, `adjust.tomorrow`, `adjust.pickDate` which opens `MonthGrid pick` with `from` the day after tomorrow in a headless Expander; the chosen date chip shows `shortDate` with `chevron.down`), Style `Segmented` (`style.desi`, `style.western`, `style.both`), Garment `ChipRow` (`adjust.any`, `today.garment.*`, plus `today.startWithPiece` pushing `/today/pieces`), kept pieces line (`adjust.keepingMany`, `adjust.stopKeeping`), Weather `ChipRow` (`adjust.useForecast` only when fresh, `adjust.notSet`, `weather.warm/mild/cold`), Conditions (`adjust.dry/rain/snow`), Your day `Segmented` (`adjust.indoors`, `adjust.outside`, preselected from `everyday.exposure`), Closet `Segmented` (`today.wardrobeSample`, `today.wardrobeOwned`), `today.includeSetAside` toggle `Row` when any excluded, `adjust.makeEveryday` toggle `Row` in everyday mode, Footer `adjust.find` ("Show outfit"). Commit: everyday mode with "Save to Your style" writes `saveEverydayStyle(..., true)`; occasion mode with When Today calls `startOccasion`; another day calls `startPlan(closet, request, date)` with that day's forecast weather when the forecast covers it; then `router.back()` (pops to Today, which plays Generating). Entry params: `keep=<id>` (from piece detail "Plan a day") preselects the kept piece and focuses When; `focus=day`.

Start with a piece (`app/today/pieces.tsx`): `Screen` title `today.startWithPiece`, `PiecePicker` with preview and 3 columns, Footer `pieces.startWithThese` (`startOccasion` with `keptIds`, pops to Today), `adjust.stopKeeping` when reopened with kept pieces, empty closet hands off to `addPiecesRoute`.

- [ ] **Step 2: Copy keys**

All F07 keys exist per the flow doc; add `title.adjust` if `title.adjustToday` is the current name (rename), `adjust.pickDate`, `adjust.day` "When", and check the shortened `occasion.wedding` / `occasion.barat` strings against `copy.md` F07. Cut `title.choosePieces`.

- [ ] **Step 3: Maestro flows under `.maestro/adjust/`**

Full flow `plan.yaml` (UC-F07-08):

```yaml
appId: com.zaimimran.almari
# UC-F07-08
# seed: fixture.sh now=2026-10-07T09:00:00+02:00
---
- runFlow: ../lib/sample-closet.yaml
- tapOn:
    id: "context-occasion"
- assertVisible: "Adjust"
- tapOn: "Eid"
- tapOn: "Choose a date"
- tapOn:
    id: "pick-2026-10-11"
- assertVisible: "Sat 11 Oct"
- takeScreenshot: docs/redesign/screens/after/adjust/adjust
- tapOn: "Show outfit"
- extendedWaitUntil:
    visible:
      id: "today-outfit"
    timeout: 60000
- assertVisible: "Sat 11 Oct"
- assertVisible: "Back to today"
- assertNotVisible: "Wear this"
- assertVisible: "Save look"
- takeScreenshot: docs/redesign/screens/after/adjust/planning
- tapOn: "Another"
- extendedWaitUntil:
    visible:
      id: "today-outfit"
    timeout: 60000
- tapOn: "Save look"
- tapOn: "Back to today"
- assertVisible: "Wear this"
- tapOn: "Looks"
- assertVisible: "Planned for Sat 11 Oct"
```

| File | UC | Seed | Steps |
|---|---|---|---|
| `request.yaml` | UC-F07-01 | sample | `tap id:context-occasion`; Style "Desi"; Weather "Cold"; "Show outfit"; `wait id:today-outfit`; context chips read "Desi" and "Cold" |
| `occasion.yaml` | UC-F07-02 | sample | Party; Desi; "Show outfit"; `see "For a party"` chip |
| `make-everyday.yaml` | UC-F07-03 | sample | Work; "Save to Your style" on; "Show outfit"; `gone id:session-chip`; Profile > Your style reads Work |
| `release.yaml` | UC-F07-04 | sample after a Keep in the strip | "Stop keeping"; "Show outfit"; the kept mark is gone |
| `start-with-pieces.yaml` | UC-F07-05 | `seed-owned-everyday.sh` | "Start with a piece"; tiles; `see "2 selected"`; "Clear"; two; "Start with these"; `see "Started with Rose tunic and Grey trousers"`; empty closet variant hands off to Add pieces |
| `closet-source.yaml` | UC-F07-06 | sample then `seed-owned.sh` | Closet "My clothes"; "Show outfit"; owned outfit; empty owned variant shows the problem Banner with "Add pieces" |
| `discard.yaml` | UC-F07-07 | sample | change a chip; Cancel; "Discard changes?"; "Keep editing"; Cancel; "Discard"; `fixture.sh failWrite=true` variant: Footer error |

- [ ] **Step 4: Run, screenshots (`adjust`, `pieces`, `planning`), gate, merge**

```bash
npm run check && npm run e2e -- .maestro/adjust
git add -A app/today src/features/adjust src/i18n .maestro/adjust
git commit -m "feat: adjust with planning a day and the start with a piece picker"
```

---

## Lane 11: F10 Build a look

Covers UC-F10-01 to UC-F10-04, UC-F10-06, UC-F10-07. Flow doc: `flows/F10-build-a-look.md`. Mockup: `S.build`, `S.buildSwap`, `AX.build`.

### Task 49: Builder on the primitives with the shared Change strip

**Files:**
- Rewrite: `app/look/build.tsx`
- Create: `src/features/builder/useBuilder.ts`

- [ ] **Step 1: Build per `flows/F10-build-a-look.md` > Builder and mockup `S.build`, `S.buildSwap`**

`Screen scroll={false}` title `looks.new` or `build.edit`, `leading="cancel"` with the guard; `FlatLay hero` with `emptyRoles` for the occasion's missing roles and `onPiecePress` opening the `ChangeStrip` (no Keep) in the strip region; title line: `outfitName` title plus the occasion `control` chip (`adjust.chipLabel`) opening an occasion `ChipRow` Expander in the strip region; hairline; quiet `build.fill` (`fillOutfit` with `builderRequest(closet, ids, occasion)`, `arranging` on the collage, `build.filling` busy label, problem line from `styling.*`); category `ChipRow scroll`; the strip of `Tile strip` pieces (selected disc on placed pieces, `Row`s at `ax`); Footer `common.saveLook` / `common.saveChanges` (saves with the suggested name and `occasion`, pops to the caller). Params: `pieces=a,b` prefills, `id=` edits. Empty closet: `EmptyState` `closet.firstTitle` with `closet.addPieces` (push, returns here). Gone look: `Screen gone` with `look.goneTitle`.

- [ ] **Step 2: Maestro flows under `.maestro/build-look/`**

| File | UC | Seed | Steps |
|---|---|---|---|
| `new.yaml` | UC-F10-01 | sample | Looks; `tap id:header-new-look`; `see "New look"`; occasion chip; "Eid"; strip tiles: tap four; `see id:lay-piece-hijab`; "Save look"; Looks row with "Eid"; detail shows 4 pieces; `shot build` |
| `fill.yaml` | UC-F10-02 | sample | one piece; "Fill the rest"; `wait id:moment-generating` optional; `wait id:lay-piece-shoes` |
| `swap.yaml` | UC-F10-03 | sample | place a hijab; `tap id:lay-piece-hijab`; `see "Change the hijab"`; second tile; `see "Undo"`; `shot build-swap` |
| `filters.yaml` | UC-F10-04 | skip onboarding (empty closet, My clothes via Adjust) | "New look"; `see "Add pieces"`; tap; back returns to the builder |
| `discard.yaml` | UC-F10-06 | sample | pick; Cancel; "Discard changes?"; `fixture.sh failWrite=true`: Save shows "Could not save. Try again." |
| `prefilled.yaml` | UC-F10-07 | `seed-owned.sh` | Closet Select two, "New look": pieces placed; Save; back on Closet; piece detail "Add to a look": placed |

Also finish the `# after L11` steps left in `.maestro/closet/build-look.yaml`, `.maestro/piece/use-in-look.yaml`, `.maestro/looks/change-pieces.yaml`.

- [ ] **Step 3: Run, gate, merge**

```bash
npm run check && npm run e2e -- .maestro/build-look && npm run e2e -- .maestro/closet && npm run e2e -- .maestro/piece && npm run e2e -- .maestro/looks
git add -A app/look/build.tsx src/features/builder src/i18n .maestro
git commit -m "feat: build a look with an occasion and the shared change strip"
```

---

## Lane 12: F11 Profile and style

Covers UC-F11-01 to UC-F11-12, UC-F01-05 (Body) and UC-F01-12 Name on Profile. Flow doc: `flows/F11-profile-and-style.md`. Mockup: `S.profile`, `S.profileSettings`, `S.never`, `S.style`, `S.wearMore`, `S.stylist`, `S.answer`, `AX.profile`, `AX.style`.

### Task 50: Profile with the completeness meter, settings expanders, answers

**Files:**
- Rewrite: `app/profile/index.tsx`
- Create: `app/profile/style.tsx`, `app/profile/answer/[step].tsx`, `app/profile/never.tsx`, `app/profile/wear-more.tsx`, `app/profile/stylist.tsx`, `src/features/profile/Completeness.tsx`, `src/features/profile/MorningOutfit.tsx`, `src/features/profile/useProfile.ts`, `src/features/profile/StyleRules.tsx`
- Delete: `app/(tabs)/profile/` (folder), `app/today/style.tsx` and `stylist-results.tsx` are already gone (L7)

- [ ] **Step 1: Profile per `flows/F11-profile-and-style.md` > 1 and mockup `S.profile`, `S.profileSettings`**

`Screen` title `profile.title`: `Completeness` block (`profile.meter` sentence with `percent`, `Silk progress` hidden from VoiceOver, up to three `control` chips with `chevron.right` from `completeness(closet).next` mapped to `quick.*` labels and destinations; updates only after `transitionEnd` when Profile regains focus); `Row`s `style.title` (meta the everyday style words), `never.title` (meta count or `common.none`), `wearMore.title` (meta `common.pieceCountMany` or `common.none`); `Section settings.answers`: `profile.name`, `onboarding.place.title`, `onboarding.body.title`, `profile.colours` rows with their values (`profile.notAnswered`), pushing `/profile/answer/<step>`; `Section stats.title`: `stats.neverWorn` (count, pushes Closet with `setPendingFilter({ wear: "never-worn", panelOpen: true })`, shown once `hasAnyWear`), `stats.mostWorn` (opens the piece; `stats.nothingWorn` when empty); `Section settings.title`: `MorningOutfit` Expander (`profile.morning`, chips Off and the four times, `askNotificationPermission` on first pick, `syncSchedule(notificationPlan(...))` on every change, `notify.denied` + `common.openSettings` under the chips when denied; rescheduled on language switch and when Profile regains focus after Settings), `settings.language` Expander (chips; the user stays on Profile: remove the `Fragment key={locale}` remount from `ClosetProvider` and make `t()` reactive instead, a `useSyncExternalStore` store in `src/i18n/index.ts` exposing `useLocale()` that `Screen` and every component rendering copy reads once, so a switch re-renders in place and the Stack is never remounted), `style.layout` Expander; `Section settings.advanced`: `stylist.label` row (push `/profile/stylist`); `Section settings.app`: `settings.replay` (confirm, `replayOnboarding`, `router.replace("/onboarding")`), `settings.reset` destructive (confirm, `resetCloset`, `syncSchedule(null)`), `settings.privacy` line, `settings.version`.

- [ ] **Step 2: Your style per 2 and mockup `S.style`**

`Screen` title `style.title`, `leading="cancel"` with the guard, one Expander per question with its value closed: `style.occasion` (`ChipRow occasion.*`), `style.hijab` (`hijab.always/sometimes/notNeeded`), `style.hijabStyles` (`ChoiceCardGroup` from L3's `hijabStyleOptions`, hidden when hijab is Not needed), `coverage.levelLabel` (cards plus `coverage.noPreference` and `coverage.own` with Sleeves and Hem chips under it), `style.style` (cards), `style.fit` (cards plus `onboarding.depends`), `style.sparkle` (chips), `adjust.yourDay` `Segmented`, then `StyleRules` (`style.rules` Expander: belt, top length, bottoms, prints, wedding colours, dupatta, region as today's `today/style.tsx` controls on the primitives), Footer `everyday.saveRestyle` ("Save and update today") when a Today session exists, else `common.save`; `?then=today` from a styling entry saves and navigates to Today. Writes through `saveEverydayStyle` plus `saveProfile` with `coverageAnswered`, `hijabAnswered`.

- [ ] **Step 3: Answers, never wear, wear more, stylist**

`/profile/answer/[step]`: name (`Field`, Save Footer, guard), place (L3's `StepPlace` with a Save Footer), body (units `Segmented`, height fields, `BodyShapes` plus `shape.none` "Prefer not to say" which sets `bodyAnswered`), colours (back chevron, no Footer: the palette `Swatches`, `colours.selfie` pushing `/onboarding/colours`, `onboarding.colourLean.*` chips saving at once). `/profile/never`: `Section`s per Closet category of `kind.*` chips (kinds the active wardrobe holds), `never.colours` and `never.hijabColours` swatch chips (colours present), `never.patterns`; each tap `setNeverWear` at once with `result.saved` announced; back chevron. `/profile/wear-more`: `PiecePicker` (2 columns, no preview) with `setWearMore` at once. `/profile/stylist`: `stylist.label` sections Western and Desi with `Row`s Rules / Model / Compare (`setEngine`), `stylist.results` table pushed... the flow puts the Compare results on the same screen as rows; follow mockup `S.stylist` (rows with the check on the chosen engine, "No feedback yet" meta).

- [ ] **Step 4: Copy keys**

Add the F11 and Revision 1 > F11 Profile keys that are missing (`profile.meter`, `quick.*`, `never.*`, `wearMore.title`, `common.none`, `style.hijabStyles`, `style.fit`, `style.sparkle`, `shape.none`, `settings.title`, `settings.app`, `hijab.notNeeded`, `coverage.own`, `everyday.saveRestyle`). Cut `stylist.results`, `never.garments`, `place.city`, `onboarding.city.label/find/found`, `style.bothLong`, `profile.*` keys of the old tab that no reader keeps.

- [ ] **Step 5: Maestro flows under `.maestro/profile/`**

Full flow `completeness.yaml` (UC-F11-08):

```yaml
appId: com.zaimimran.almari
# UC-F11-08
---
- launchApp:
    clearState: true
    permissions:
      all: allow
- inputText: "Sara"
- tapOn: "Next"
- tapOn: "Always"
- tapOn: "Next"
- tapOn: "Next"
- tapOn: "Modest"
- tapOn: "Next"
- tapOn: "A mix of both"
- tapOn: "Next"
- repeat:
    times: 5
    commands:
      - tapOn: "Next"
- tapOn: "Try the sample closet"
- extendedWaitUntil:
    visible:
      id: "today-outfit"
    timeout: 60000
- tapOn:
    id: "header-profile"
- assertVisible: "The stylist knows .*% of your style"
- assertVisible: "Add hijab styles"
- assertVisible: "Add fit"
- assertVisible: "Add sparkle"
- takeScreenshot: docs/redesign/screens/after/profile/profile
- tapOn: "Add sparkle"
- assertVisible: "Your style"
- tapOn: "Heavy"
- tapOn: "Save and update today"
- assertVisible: "Profile"
- assertNotVisible: "Add sparkle"
- tapOn: "I'll never wear"
- tapOn: "Back"
- assertNotVisible: "Add things you never wear"
```

| File | UC | Seed | Steps |
|---|---|---|---|
| `read.yaml` | UC-F11-01 | `seed-owned.sh,seed-wears.sh` + onboarding with name | blocks in order; "Never worn" opens Closet filtered; back; "Most worn" opens the piece; `shot profile-scrolled` |
| `your-style.yaml` | UC-F11-02 | sample | Your style; each Expander opens and closes; coverage "My own limit" shows Sleeves and Hem; Save; back with changes asks to discard; `shot style` |
| `answers.yaml` | UC-F11-03 | sample | Location: "Search for your city", Oslo, Save; Body: Feet, 5 ft 5 in, Save, row shows feet; Colours: "Bold" saves at once; Name edit then back: discard guard; `shot answer` |
| `body.yaml` | UC-F01-05 | sample | Body; 1.65 shows the range error; 165 + Hourglass Save; "Prefer not to say" |
| `name.yaml` | UC-F11-12 | sample with name | Name; clear; Save; Today greets without a name; "Sara A"; `see "Good morning, Sara A|Good afternoon, Sara A|Good evening, Sara A|Hi, Sara A"` |
| `language.yaml` | UC-F11-04 | sample | Language; "Norsk bokmål"; `see "Profil"`; still on Profile; "Følg telefonen" |
| `reset.yaml` | UC-F11-05 | sample | "Show intro again"; confirm; step 1; "Delete all data" after re-onboarding; confirm; step 1 |
| `stylist.yaml` | UC-F11-06 | sample with feedback (`seed-wears.sh`) | Advanced > Stylist; Western rows; "Compare"; Today shows no engine name |
| `about.yaml` | UC-F11-07 | sample | privacy line and version visible |
| `never-wear.yaml` | UC-F11-09 | `seed-owned-everyday.sh` with a black hijab and a skirt | Skirt, Black (Colours), Stripe; back: row reads "3"; Today Another several times: no skirt title; Black under Hijab colours; `shot never` |
| `wear-more.yaml` | UC-F11-10 | `seed-owned.sh` | three tiles; `see "3 selected"`; back: "3 pieces"; Today Rediscover after a wear shows them first; `shot wear-more` |
| `notifications.yaml` | UC-F11-11 | sample | Morning outfit; "08:00"; `see "08:00"` closed value; "Off"; `permissions: { notifications: deny }` variant: `see "Notification access is off"` |

- [ ] **Step 6: Run, gate, merge**

```bash
npm run check && npm run e2e -- .maestro/profile
git add -A app/profile src/features/profile src/i18n .maestro/profile
git commit -m "feat: profile with completeness, morning outfit, your style, never wear and wear more"
```

### Task 51: AX5 screenshots (`AX.profile`, `AX.style`); Task 52: the Language remount fix verified by `language.yaml`; Task 53: gate and merge.

---

## Lane 13: F12 app-wide checks and Phase 4

Runs alone after every other lane has merged. Flow doc: `flows/F12-app-wide-checks.md`.

### Task 54: App-wide Maestro flows

**Files:**
- Create: `.maestro/app-wide/empty-closet.yaml`, `large-text.yaml`, `bokmal.yaml`, `offline.yaml`, `interrupted.yaml`, `reduce-motion.yaml`, `voiceover.yaml`, `permissions.yaml`, `.maestro/lib/ax3.sh`, `.maestro/lib/offline.sh` (`xcrun simctl status_bar` cannot cut the network; use the `fixture.sh offline=true` key that makes `expo-network` report disconnected and the forecast, Studio and geocode calls reject), `.maestro/lib/online.sh`

| File | UC | Steps |
|---|---|---|
| `empty-closet.yaml` | UC-F12-01 | skip onboarding; Adjust Closet "My clothes"; Today problem Banner with "Add pieces"; Closet "Your first piece"; Looks "Add pieces"; Start with a piece "Add pieces"; New look "Add pieces"; Profile stats "Add pieces"; one screenshot each |
| `large-text.yaml` | UC-F12-02 | `# seed: ax5.sh,fixture.sh language=nb`, `seed-owned.sh,seed-looks.sh`: visit every route in the screen tree (the ten onboarding steps, colours tips, Today, Closet, More, Select, piece, edit, cut-out, label, capture grid, confirm, group, by hand, scan (fixture), adjust, pieces, looks, look, calendar, builder, profile, style, answers, never, wear more, stylist), `takeScreenshot` per route into `docs/redesign/screens/after/large/`; then `ax3.sh` and a second pass of the ten most text-heavy; `assertVisible` the Footer primary on every editor |
| `bokmal.yaml` | UC-F12-03 | `fixture.sh language=nb`; every route; `assertVisible: "Samling"`, `"I dag"`, `"Garderobe"`; screenshots into `docs/redesign/screens/after/nb/` |
| `offline.yaml` | UC-F12-04 | `fixture.sh offline=true` with a place: `see "Weather unavailable"`; Studio "You are offline"; city search "You are offline"; Another works |
| `interrupted.yaml` | UC-F12-05 | cut-out: open, back during `moment-loading`, reopen resolves; scan fixture: back during the lift; Studio: back then return shows the same busy chip; selfie: back during measuring, reopen at the tips; `fixture.sh slowPrepare=8000`: kill during preparing, relaunch, card present, no duplicate job (`see "1 new piece"` not "2") |
| `reduce-motion.yaml` | UC-F12-06 | `reduce-motion.sh`: splash hand-off, Another (`moment-generating` resolves), capture tile preparing, progress card, a Banner on Today, cut-out select, group box snap, scan capture, a choice card, the icon toggles, a month change; each asserts the in-progress id then the result id |
| `voiceover.yaml` | UC-F12-07 labels | assert `accessibilityLabel`s through `assertVisible: { id, text }` pairs on: the three outfit icons (`today-like` "Like"), the hijab lay piece (`lay-piece-hijab` "Hijab, ..."), the session chip, the More chip value, the progress card label, the calendar day label, the completeness sentence, the face circle label; in English and bokmål |
| `permissions.yaml` | UC-F12-08 | `permissions: { location: deny, notifications: deny }`; Today "Weather unavailable"; Profile Location "Location access is off" and search works; Morning outfit shows the Settings line |

Also rewrite `.maestro/baseline/routes.yaml` to visit every route of the new screen tree with `takeScreenshot` into `docs/redesign/screens/after/<route>.png` (default size, English), the after record for `signoff`.

- [ ] **Step 1: Write the flows, run them, fix what they find (each fix is a `fix:` commit in the owning files; L13 owns everything now)**

```bash
npm run e2e -- .maestro/app-wide && npm run e2e -- .maestro/baseline
```

- [ ] **Step 2: Commit**

```bash
git add .maestro docs/redesign/screens/after
git commit -m "test: app-wide flows and the after screenshots"
```

### Task 55: Full regression

- [ ] **Step 1:** `REBUILD=1 npm run e2e` (every folder). Record pass counts per folder in `docs/redesign/signoff.md` > "Phase 4 regression" with the commit hash. Every flow must pass; a flaky flow is fixed (longer `extendedWaitUntil`, a `testID` instead of text), never retried into green.
- [ ] **Step 2:** `npm run check`. Commit any fixes.

### Task 56: Accessibility pass

- [ ] **Step 1: Simulator audit.** Xcode > Open Developer Tool > Accessibility Inspector, target the Release app on "Closet Development", run the Audit on every route from `.maestro/baseline/routes.yaml` (default size, then AX5, then bokmål through the fixture). Zero warnings of the kinds: missing label, hit area under 44 pt, contrast, dynamic type unsupported. Fix and recommit.
- [ ] **Step 2: Reduce Motion.** `.maestro/app-wide/reduce-motion.yaml` green (Task 54).
- [ ] **Step 3: VoiceOver on a device (owner-only).** Hand the owner `use-cases.md` UC-F12-07's walk list and `flows/F12-app-wide-checks.md` > V; record the result in `signoff.md`. Also the real-phone rows UC-F01-07 (steps 3 and 4), UC-F01-20, UC-F03-02.
- [ ] **Step 4:** Write the findings into `docs/redesign/signoff.md` > "Phase 4 accessibility".

### Task 57: Final design critique

- [ ] **Step 1:** Run the `impeccable:impeccable-finish-reviewer` agent with the direction contract: `docs/redesign/design-system.md`, `motion.md`, the mockup `index.html` and the after screenshots in `docs/redesign/screens/after/`, flow by flow (F01 to F11, plus the large text and bokmål sets). The critic returns an ordered list of material fixes; every blocking item is fixed in a `fix:` commit and the flow's Maestro folder rerun. Non-blocking items go into `docs/redesign/signoff.md` > "After the redesign".
- [ ] **Step 2:** Rams' ten principles pass over the app map in the mockup against the shipped routes: no route that is not in `architecture.md` > Screen tree, no sheet, no toast, no spinner (`grep -rn ActivityIndicator app src` is empty), no `presentation:` in `app/`, no `withSpring`, no raw hex outside `src/ui/theme.ts` (`grep -rnE '#[0-9A-Fa-f]{6}' app src --include=*.tsx | grep -v theme.ts` is empty), no `legacy` import left (`grep -rn "ui/legacy" app src` is empty, then delete `src/ui/legacy.tsx`).

### Task 58: DESIGN.md from the shipped app

- [ ] **Step 1:** Run the `impeccable:impeccable-documenter` agent on the repo root: it derives `DESIGN.md` (tokens, components, motion, copy rules, accessibility rules) from `src/ui/**`, `src/i18n`, `app/**` as built, not from the Phase 2 docs. Review it: every token value matches `src/ui/theme.ts`, every component name matches a file in `src/ui`, no em dash, no AI mention.
- [ ] **Step 2:** Commit: `docs: DESIGN.md from the shipped redesign`.

### Task 59: Release notes and TestFlight

- [ ] **Step 1:** Write `store/release-notes/next.md` (bullets only, plain English, no em dash): the redesign in one line, three tabs, onboarding with illustrated choices and a selfie palette, Today with greeting, thumbs and save, Rediscover and tomorrow's outfit, closet sections and filters with background tagging, piece coverage and sparkle facts, wear calendar, profile completeness, morning outfit notification, location by phone. Keep it under twelve bullets.
- [ ] **Step 2:** `release.json` build: check TestFlight's latest build number in App Store Connect (owner may need to say it); raise `release.json` if it is not higher than TestFlight's.
- [ ] **Step 3:** Commit `docs: release notes for the redesign`, push `main`, then `gh workflow run release.yml` (per `docs/RELEASE_CI.md`; secrets are already set). Watch with `gh run watch`. The TestFlight install on the owner's phone is owner-only.

### Task 60: Close-out

- [ ] **Step 1:** `docs/redesign/signoff.md` gets a "Phase 3 and 4 done" section: lane merge hashes, regression counts, accessibility findings, critic result, open items for after the redesign (mood lever, hanger.fill tab symbol if the capsule was judged insufficient, any real-phone row not yet walked by the owner).
- [ ] **Step 2:** Send the owner the list of owner-only steps: dev client rebuild on the phone, VoiceOver walk, the real-phone selfie and scan rows, TestFlight install.
- [ ] **Step 3:** Commit `docs: redesign sign-off after phases 3 and 4` and push.
