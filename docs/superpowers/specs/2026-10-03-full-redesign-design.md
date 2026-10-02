# Almari full redesign

Date: 2026-10-03. Status: approved design, spec under review.

## Why

All planned features are built and merged (Parts 1 to 10, Studio, live scan). The app works but feels messy. The owner named five problems:

1. Navigation: it is hard to know where things live. Today alone has eight sub screens, capture has four.
2. Inconsistent screens: headers, buttons, spacing and sheets differ from screen to screen.
3. Too much text and clutter.
4. Flows feel disconnected: capture, closet, outfit and look do not hand off naturally.
5. Modal sheets ("app windows... they move to much arround and feel unfinihsed, try to avoid them"). The root stack presents 11 routes as modals today.

Goal: one coherent app where every flow hangs together, built around the logo, with every use case covered by a test.

## Fixed constraints

- Keep palette and feel of Direction A, The dressing room: white canvas so garment colours read true, bark ink, plum actions, editorial serif display, system body type. Type scale, spacing, radius and components may be refined.
- Build around the logo (`assets/brand/icon.png`): ivory silk scarf forming an A, blush pink ribbon crossbar, plum ground.
  - Plum stays primary accent. Blush pink from the ribbon becomes the second accent for small highlights (selected, favourite, today's pick). Contrast checked.
  - Silk motion language: transitions ease and settle like fabric. Calm, soft, never bouncy.
  - Animated splash: the scarf A drapes in, then hands off to the first screen.
- Light appearance only. Tokens are structured so dark mode can be added later.
- No floating or resizing sheets. Each former modal becomes either a full-screen push with a back button or an inline change on the same screen. The architect decides per case.
- No feature is removed. Storage (`src/storage`, `src/state`), domain logic (`src/domain`) and model code stay. Routes, UI layer, features components and copy change.
- Copy in English and Norwegian bokmål only, through `src/i18n`. Labels and values, no helper text unless the user cannot act correctly without it.
- Code style: no comments, minimum code, match existing patterns.
- Support VoiceOver, Dynamic Type, Reduce Motion, 44 pt touch targets and WCAG AA contrast.

## Magic moments

The owner asked for motion that shows "magic is happening" in four places. Each gets a designed animation, a Reduce Motion fallback, and a test that the state appears and resolves.

| Moment | Where today | Intent |
|---|---|---|
| Loading | app start, closet load, forecast | Calm silk shimmer, never a bare spinner |
| Generating | Studio photo enhancement, stylist results, outfit building | Visible progress that feels like fabric being arranged |
| Selecting object in image | cutout editor, capture cutout, hold-to-select | Outline traces the found piece, mask lifts off the background |
| Found clothes in video | live closet scan | Each detected piece is marked live, then lifts into a tray |

## Team and models

Orchestrator: main session (Opus 5.5). Architect: Fable 5.1 subagent. All other roles: Opus 5.5 subagents run through the Workflow tool, full parallel scale approved.

| Role | Owns |
|---|---|
| Architect (Fable 5.1) | Feature inventory, information architecture, tab model, screen tree, sheet replacement decisions, use case catalogue, flow sign-off |
| UX designer | Flow steps, states (empty, loading, error, offline, first run), hand-offs between flows |
| UI designer | Tokens from logo, component library, screen layouts, mockups |
| Motion designer | Silk motion system, transitions, magic moments, splash, Reduce Motion fallbacks |
| UX writer | All copy EN and NB, one word per concept across the app |
| Accessibility specialist | VoiceOver labels and order, Dynamic Type, contrast, targets, Reduce Motion |
| User advocate | Walks every flow as the first user (Muslim woman, hijab matching, occasions, using more of her wardrobe) and reports friction |
| Design critic | Reviews every flow against Rams' ten principles and the impeccable critique and audit; blocks until it passes |
| Developers | Implement design system and flows, one lane per flow |
| Testers | Maestro E2E per use case, unit tests where domain changes, baseline screenshots |

## Phases

### Phase 0: baseline

- Maestro 2.11 is installed (`~/.maestro/bin`) and 61 flows exist in `.maestro/`. Add an npm script to build the Release simulator app and run them on the "Closet Development" simulator. Record which flows pass today.
- Add stable `testID`s needed for flows.
- Screenshot every current screen as the before record.

### Phase 1: architecture

- Architect inventories every route, feature and state from code and `PRODUCT.md`, and turns them into user jobs.
- Proposes tabs (may merge, rename or add, e.g. a central add action), the screen tree, and for each of the 11 modals: push or inline.
- Writes the use case catalogue: ID, actor goal, entry point, steps, expected result, states covered. Every use case maps to at least one Maestro flow.
- User advocate walks each flow; architect iterates. Two passes minimum.
- Output: `docs/redesign/architecture.md` and `docs/redesign/use-cases.md`.

### Phase 2: design

- UI designer derives tokens from logo plus existing theme and builds the component library spec.
- UX designer details every flow with all states.
- Motion designer writes the motion system: durations, easing curves, transition rules per navigation type, the four magic moments, splash.
- UX writer produces copy tables EN and NB.
- Accessibility specialist and design critic review; designers iterate until critic passes.
- Output: `docs/redesign/design-system.md`, `docs/redesign/motion.md`, `docs/redesign/flows/*.md`, and one HTML artifact with app map, every flow, and mockups of key screens.
- **Owner approval gate.** The owner approves this artifact. After approval the team builds without further questions.

### Phase 3: build

- Lane 1 first: tokens, primitives, navigation shell, motion primitives, splash. Everything else depends on it.
- Then one lane per flow in parallel where routes do not overlap. Each lane: implement, Maestro flows for its use cases, unit tests if domain code changes, accessibility check, critic review against approved mockups, fix loop.
- Gate per lane: `npm run check` passes, its Maestro flows pass, screenshots match approved design. Then merge to main.
- Old screens and components a lane replaces are deleted in that lane.

### Phase 4: finish

- Full Maestro regression on simulator, full accessibility pass, final critic review across the whole app.
- Rewrite `DESIGN.md` from the shipped app (impeccable documenter).
- Before and after screenshots saved to `docs/redesign/screens/`.
- Release notes in `store/release-notes/next.md`, TestFlight build through the existing CI release.

## Testing

- Maestro E2E on the iOS simulator dev build: one or more flows per use case, grouped by flow folder, tagged with use case IDs.
- Existing `node --test` domain suite stays green. New domain logic gets unit tests first.
- Camera, live scan and model steps: Maestro uses seeded sample wardrobe and fixture images where the simulator has no camera. Real-phone checks stay on the owner's list.
- Magic moments: tests assert the in-progress state appears and resolves to the result.

## Out of scope

Dark mode, Android, new features, changes to models, storage schema or styling engine behaviour.

## Success

- Every use case in the catalogue has a passing Maestro flow.
- No modal or floating sheet remains.
- Every screen uses shared components and tokens only.
- Design critic passes every flow; accessibility pass clean.
- Owner sees a coherent app on TestFlight.
