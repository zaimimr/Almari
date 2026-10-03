# Almari design system

Date: 2026-10-03. Phase 2a output (plan Task 3). Sources: `src/ui/`, `src/features/`, `src/navigation/`, the ad-hoc styles in `app/`, the logo `assets/brand/icon.png`, `docs/redesign/architecture.md` (owner decisions apply) and the before screenshots in `docs/redesign/screens/before/`.

Motion durations, easing and the magic-moment choreography live in `docs/redesign/motion.md`. This file names which motion each component uses, never the numbers. The before-screen findings and the file and line references to the current code live in `docs/redesign/migration.md`.

## Principles

- **The garment is the colour.** The canvas is white and the chrome stays quiet, so a dusty-rose hijab next to a sage kurta reads true. Plum is for actions, blush for small marks, nothing else is coloured. Piece images, the FlatLay, swatches and the camera view set `accessibilityIgnoresInvertColors`, so Smart Invert never changes a garment.
- **Two shapes.** Anything you press is a capsule (buttons, chips, segments). Anything you look at is a continuous-corner rectangle (photos, cards, fields).
- **One fill for grouped content.** Grouped content sits on `surface`. No borders around cards, no shadows on chrome. The only shadow in the app belongs to cut-out garments, so they lie on the canvas like fabric on a table.
- **Native first.** Native large titles, native back chevron, native tab bar, native header items in system glass, system alerts for destructive confirms. Custom components only where iOS has nothing that fits.
- **Silk, not spring.** Every state change eases and settles (see `motion.md`). No bounce, no overshoot, no spinners.
- **Nothing moves unless the user caused it, and then it only settles.** Controls appear and leave in place. Nothing scales up or flies. No footer slides in, no sheet floats, no content jumps when something opens.
- **One look per state.** Selected, needs an answer, disabled and busy each have one recipe below, and every component points to it.

## Tokens

The tokens replace `src/ui/theme.ts`. Names are semantic so dark mode can add a second `colors` set later without renaming. Components read only these names, and raw hex values do not appear outside `theme.ts`.

### Colour

Blush comes from the logo ribbon. Sampled from `assets/brand/icon.png`, the ribbon's lit face is `#F0C9C0`, its body is `#E1B1A8` and its fold shadow is `#C99189`. The blush family below is built from the ribbon body. The logo's ivory scarf, plum ground and the silk highlight are not UI colours. They live in `theme.brand` (see Token file shape): splash, mark and sheen band only, never UI. `motion.md` refers to them by these names.

| Token | Value | Use | Contrast (WCAG 2.2) |
|---|---|---|---|
| `canvas` | `#FFFFFF` | Screen background, the ground for every cut-out (tiles and flat lays alike) | - |
| `surface` | `#FBF9F7` | Grouped content: banner, expander, field fill | ink 12.84, inkMuted 5.14, plum 6.56 |
| `sunken` | `#F2EDE7` | Unselected chip, segmented track, placeholder, pressed row and tile, pressed quiet and destructive button, disabled control | ink 11.59, inkMuted 4.64, plum 5.92, error 6.21. 1.16 on canvas, 1.11 on surface |
| `ink` | `#322E28` | Bark. All text, icons in rows, selected checkmarks, halo under camera outlines, the `media` ground | 13.49 on canvas. Plum on ink 1.96: never |
| `inkMuted` | `#706963` | Secondary values, meta line, segmented thumb edge | 5.40 on canvas, 4.64 on sunken. Never on `blush` (2.85) |
| `inkDisabled` | `#706963` | Disabled text. Not swapped under Increase Contrast | 4.64 on sunken |
| `placeholder` | `#706963` | Field placeholder, fact chip key ("Colour"). Not swapped under Increase Contrast, so it never looks like typed text or a value | 5.14 on surface, 4.64 on sunken |
| `line` | `#E6E0DC` | Hairlines: row separators, footer top edge. Decorative only | 1.31, never the only cue |
| `lineField` | `#948B85` | Field border, empty-slot silhouette (non-text 3:1) | 3.34 on canvas, 3.18 on surface. Never on `sunken` (2.87) |
| `plum` | `#675469` | Primary fill, quiet buttons, header and tab tint, focus ring, progress, the needs-an-answer dot | 6.89 on canvas, 6.56 on surface, 6.02 on plumSoft, 5.20 on plumSoftPressed |
| `plumPressed` | `#574559` | Primary pressed fill; quiet pressed fill on `media` | onPlum and onMedia 8.75 |
| `plumSoft` | `#F3EEF4` | Secondary button fill on `canvas` | plum text 6.02 |
| `plumSoftPressed` | `#E6DDE7` | Secondary pressed fill on `canvas`; secondary rest fill inside `surface` containers | plum text 5.20. 1.26 on surface |
| `plumSoftDeep` | `#DDD2DF` | Secondary pressed fill inside `surface` containers | plum text 4.71. 1.39 on surface |
| `onPlum` | `#FFFFFF` | Text and icons on plum | 6.89 |
| `blush` | `#E2B1A8` | Second accent fill, closed list in Rules. Ink text only | ink on blush 7.12. Plum on blush 3.64: never. inkMuted on blush 2.85: never |
| `blushStrong` | `#BE8077` | Non-text blush marks that must show on white: selected chip edge, session dot | 3.21 on canvas, 3.06 on surface. Never on `sunken` (2.76) |
| `error` | `#96354A` | Error text, error field border, destructive label | 7.23 on canvas, 6.88 on surface, 6.21 on sunken |
| `scrim` | `rgba(50,46,40,0.55)` | Dimming the photo behind a selected piece (single-photo select, cut-out editor). Never under text | - |
| `scrimPill` | `rgba(50,46,40,0.70)` | The only ground for `onMedia` text on a live photo: guide pill, readout | onMedia 5.15 worst case (over white) |
| `onMedia` | `#FFFFFF` | Text, icons, outlines and shutter ring on the `media` ground or on a photo | 13.49 on `ink` |

Rules:

- **Plum** means "do something": primary fill, quiet actions, header and tab tint, focus, progress, and the needs-an-answer dot (answering is something to do). Nothing else is plum. Plum text never sits inline inside `ink` text (1.96:1, colour alone would mark it): a link is always a standalone quiet Button.
- **Blush** means "this one" and stays small. It never fills a banner, a track or a large area, and it is never a text colour (1.89:1 on white). The closed list of blush uses: the selected choice chip (fill, `blushStrong` edge), the selected tile disc, the mark capsule (planned day only), the session dot (`blushStrong`), and the found outline on camera. Anything else is not blush, including tip drawings (`inkMuted` only). Kept is the selected Keep Chip in the Change strip, not a mark. There is no New mark: the Closet "N added" Banner says it.
- **Selected, one recipe.** Capsules (choice chips): `blush` fill and a 2 pt `blushStrong` border. The border is always present and transparent when unselected, so the chip keeps its width. Rectangles (tiles): a 22 pt `blush` disc top right with an `ink` `checkmark` (7.12), as in iOS Photos. No ring, so the cut-out stays unframed. Rows: a trailing `ink` `checkmark`. Each carries `accessibilityState.selected` (or `checked`, see Chip). `Segmented` is a value, not a selection set: its thumb shows position, not blush.
- **Needs an answer, one recipe.** One 8 pt `plum` dot before the label (6.56 on surface, 5.92 on sunken, 6.89 on canvas), nothing else: no extra text, no dashed edge, no "?". VoiceOver carries the words ("Needs an answer" / "Trenger svar"). Used by the Expander `attention` tone, the fact Chip `tentative` and the Tile `needsAnswers` state. The dot scales by `symbolScale`.
- **Camera and photo.** A live photo is never treated as a dark ground. `onMedia` text on a photo sits only on `scrimPill`. Every outline, oval and sample ring on a photo gets a 1 pt solid `ink` halo underneath (blush on ink 7.12, onMedia on ink 13.49), so it reads on white garments as well as dark ones. Blush on camera marks a found piece or a ready oval; this is the one place blush is a line, not a fill.
- **Media rule.** `Screen media` has an `ink` ground, and plum never sits on it (1.96). On a media screen the header tint, `quiet` Button labels and icons, and `EmptyState` title and line all use `onMedia` (13.49). So do `Row` titles and the trailing `checkmark` (the `large` Row lists of cut-out editor and scan controls); those Rows press to `plumPressed` (8.75). A quiet Button there presses to `plumPressed` (onMedia 8.75). `Segmented` and `Chip`s keep their own light fills on media with `ink` labels (11.59 on `sunken`, 13.49 on the `canvas` thumb, 7.12 on a `blush` selected chip), thumb edge `inkMuted` (4.64), and the `sunken` fill reads on the `ink` ground (11.59). Only text, quiet Buttons and Rows drawn straight on the `ink` ground use `onMedia`. The `secondary` Button keeps its `plumSoft` fill with a `plum` label (6.02) and presses to `plumSoftPressed` (5.20). The `primary` Button there (Footer, or an EmptyState action on a screen with no Footer) takes the media variant: `onMedia` fill (13.49 on ink) with a `plum` label (6.89), pressed `plumSoft` (plum 6.02), so it stays the one filled capsule. A `Row` there (Segmented at `large`) has `onMedia` title and checkmark (13.49), presses to `plumPressed` (onMedia 8.75) and has no separators. `Screen`, `Button`, `Row`, `Segmented`, `EmptyState` and `CameraFrame` point here.
- **Dashes** mean empty or not yet: the empty slot in a flat lay and the searching outline on camera. Nothing else is dashed.
- There is no success green. Confirmations are ink text with a plum `checkmark` symbol.
- **Disabled** is never shown by opacity alone: `inkDisabled` text on `sunken`, plus `accessibilityState.disabled`. An action that does not exist yet is not rendered (see Footer > Waiting); an editor's commit is always rendered, disabled until it can act (see Footer > Disabled).
- **In-flight writes.** A control waiting on a write sets `accessibilityState.disabled` or `busy` at once, but shows the disabled or busy look only if the write is still running after motion `wait`. A fast local save never blinks grey and the band never flashes. This applies to Chip, Segmented, Row toggles and Button `busy`.
- **Increase Contrast.** When `AccessibilityInfo.isDarkerSystemColorsEnabled()` is true (listen to `darkerSystemColorsChanged`), `theme.ts` swaps `blushStrong` to `#9A5A52` (5.31 on canvas, 5.05 on surface, 4.56 on sunken), `inkMuted` to `ink`, and `line` to `lineField`. A `Silk` placeholder gets a 1 pt `lineField` edge. `inkDisabled` and `placeholder` are not swapped, so a disabled control still differs from an enabled one and a placeholder never looks typed.

### Type

Georgia is for names you would say out loud: tab titles, outfit names, look names, piece names, empty-state titles. Everything else uses the system font (SF Pro). Seven roles cover the app. `display` is native-bar only and is not a `Text` role.

| Token | Font | Size / line | Weight | Tracking | iOS text style (Dynamic Type) | `maxFontSizeMultiplier` | Use |
|---|---|---|---|---|---|---|---|
| `display` | Georgia | 34 / 41 | 400 | -0.4 | Large Title | 2.0 (set by hand, see below) | Native large title on tab roots only |
| `title` | Georgia | 26 / 32 | 400 | -0.2 | Title 1 | 2.0 | Outfit name, look name, piece name, empty-state title |
| `headline` | System | 17 / 22 | 600 | 0 | Headline | none | Section title, button label, visible field label |
| `body` | System | 17 / 24 | 400 | 0 | Body | none | Row title, values, sentences that must stay |
| `subhead` | System | 15 / 20 | 400 | 0 | Subheadline | none | Chip label, meta line under a row title, tile name |
| `footnote` | System | 13 / 18 | 400 | 0 | Footnote | none | Inline errors, the one-line reason under an outfit |
| `mark` | System | 12 / 16 | 600 | 0 | Caption 1 | 1.4 | Labels on photos below `ax`: planned day, guide pill, readout |

System roles use tracking 0: SF Pro already applies optical tracking per size.

Bold Text: `useLargeText()` also reads `AccessibilityInfo.isBoldTextEnabled()` and listens to `boldTextChanged`. When it is on, `title` and `display` use `Georgia-Bold`. System roles follow Bold Text on their own.

Dynamic Type:

- One hook, `useLargeText()`, reads `fontScale` and returns `{ large: fontScale >= 1.35, ax: fontScale >= 1.6, bold, symbolScale: Math.min(fontScale, 2) }`. Every threshold in this file uses it. 1.35 is iOS xxxLarge, the last standard size. 1.6 sits between xxxLarge and AX1 (Accessibility Medium, fontScale 1.786), so `ax` is on at every accessibility size. AX3 (Accessibility Extra Large, fontScale 2.643, `body` about 45 pt) is the size Lane 1 tests every screen at.
- System text scales without a cap. Georgia `title` caps at 2.0x (52 pt), past which serif display text pushes the outfit off screen. `mark` caps at 1.4x because it sits on a photo, and at `ax` no `mark` text stays on a photo (see below and CameraFrame).
- The Large Content Viewer reaches native bar items only: icon header items and tab bar items show there on long press. Capped `title` and `mark` text is plain RN `Text` and the viewer does not reach it. So at `ax` the Tile mark leaves the photo and becomes the first item of the line under it, as uncapped `subhead` `ink` in its `blush` capsule, and the CameraFrame guide and readout leave the photo for the controls area under the frame.
- The native large title: react-native-screens builds a fixed-size font when only `fontFamily` is set, so `src/navigation/options.ts` sets `headerLargeTitleStyle` to `{ fontFamily: "Georgia", fontSize: 34 * Math.min(fontScale, 1.76) }` on tab roots (60 pt at most, Apple's Large Title at AX5) and updates it when `fontScale` changes. The native large title truncates instead of wrapping, so Lane 1 checks on a device that I dag, Garderobe and Samling fit at 60 pt on a 375 pt wide phone.
- At `large`: button pairs stack vertically, Row trailing values and Expander values move under the title, Segmented becomes a vertical list of Rows, header text items become icons with the label in VoiceOver and the Large Content Viewer, and `numberOfLines` is dropped from the Tile label.
- At `ax`: Tile grids go from 2 columns to 1, the Change strip becomes a list of `Row`s, and `ChipRow` `scroll` becomes `wrap`.
- Inline symbols, swatches, the needs-an-answer dot, chip chevrons and checkmarks, and the Tile selected disc scale by `symbolScale`.
- Nothing truncates. The only line cap in the app is the Tile label, 2 lines below `large`. The full name is always in the Tile's `accessibilityLabel` and in full on the screen the Tile pushes. Bokmål is planned at 20 percent longer: every label sits in a wrapping container, never a fixed width or height. The shared `Text` adds soft hyphens at render time to Bokmål words of 12 or more characters (`copy.md`, F12 B), so `strip` Tile and Segmented labels break at a syllable, not mid-word.

### Spacing

The 4 pt scale keeps the current names, so `theme.space.*` call sites survive. `gutter` and `footerInset` are new.

| Token | Value | Rule |
|---|---|---|
| `space.xs` | 4 | Icon to label inside a button, mark padding |
| `space.sm` | 8 | Chip to chip, tile name to photo, title to meta line, side padding of the Today quiet row buttons |
| `space.md` | 12 | Label to control, items inside a banner or expander, tile to tile, segment side padding |
| `space.lg` | 16 | Block to block inside a section, card padding, button side padding |
| `space.xl` | 24 | Hero to the content under it |
| `space.xxl` | 32 | Section to section |
| `space.footerInset` | 48 | Breathing room after the last content block. The ScrollView bottom inset is the measured Footer height plus this |
| `gutter` | 16 (20 when window width >= 428) | Screen side inset. Matches the native large title, back chevron and tab bar margins |

Rule: every screen uses `gutter` left and right, `space.xxl` between sections, `space.lg` inside them. No other horizontal paddings and no content max width (the app is iPhone only).

### Radius

| Token | Value | Use |
|---|---|---|
| `radius.sm` | 8 | Thumbs (40 pt) |
| `radius.md` | 12 | Raw photo frames, tile pressed fill, banner, expander, field |
| `radius.lg` | 20 | Camera frame, cut-out canvas, selfie frame |
| `radius.full` | 999 | Buttons, chips, segments, guide pill, mark capsule |

All rectangles use `borderCurve: "continuous"`. The single `theme.radius = 14` is retired.

### Elevation

Chrome has no shadows. The native header and tab bar bring their own glass. Shadows exist only for cut-outs, because transparent PNGs of ivory and white garments disappear on a white canvas without a contact shadow. iOS draws the shadow from the image alpha when the wrapping View has no background colour, so the shadow follows the garment's outline.

| Token | Shadow (iOS) | Use |
|---|---|---|
| `elevation.flat` | none | Everything that is not a cut-out, and every cut-out smaller than 72 pt (thumbs, tray thumbs, mini flat lays), where a shadow turns into a grey smudge |
| `elevation.rest` | colour `ink`, opacity 0.10, radius 6, offset 0 / 3 | Cut-outs at rest at 72 pt and larger: grid and strip tiles, row and hero flat lays |
| `elevation.lift` | colour `ink`, opacity 0.14, radius 12, offset 0 / 6 | One use: a flat-lay piece under a finger |

`lift` is never a resting state. A piece settles back to `rest` on release. `rest` and `lift` are the two ends of one animated value (see `motion.md`, lift). Grid Tiles and static flat lays set `shouldRasterizeIOS`, so a Closet grid and a Looks list scroll without offscreen shadow passes.

### Size and touch

| Token | Minimum height | Use |
|---|---|---|
| `touch` | 44 | Minimum hit area for every control, header item, tile, thumb, dot |
| `control.regular` | 52 | Footer buttons, field, row |
| `control.small` | 44 | Buttons inside banners, expanders, rows and section titles; chips; segments; expander header |
| `icon.inline` | 17 | SF Symbol next to body text |
| `icon.bar` | 22 | Quiet buttons with icon, row leading icon |
| `thumb` | 40 | Row leading thumbnail, Tile `thumb` size. `hitSlop` to 44 when pressable |
| `swatch` | 14 | Colour dot, with a 1 pt `lineField` inner edge (3.34 on canvas, 3.18 on surface) so white and ivory swatches show, also when scaled to `thumb` (selfie palette). Inside a chip the edge is 1 pt `ink` (11.59 on sunken, 7.12 on blush) |
| `brandMark` | 96 | The still mark on its tile in `EmptyState` (Closet empty, Today first run, onboarding done). The splash keeps its native 160 pt rect |

Control tokens are `minHeight`, never `height`. Controls keep their vertical padding and grow with their line height. `icon.*` and `swatch` scale by `symbolScale`. Icons are SF Symbols through `expo-symbols`, weight medium, scale medium.

### Haptics

`motion.md` > Haptics owns every haptic. A `ResultBar` never fires one: the action that caused it does.

### Reduce Motion

One hook, `useReduceMotion()`, reads `AccessibilityInfo.isReduceMotionEnabled()` and listens to `reduceMotionChanged`, so a change in Settings applies without a restart. Reanimated's `useReducedMotion()` reads once and is not used. Every Reduce Motion fallback lives in `motion.md` only (Named motions, Transitions and each Magic moment). This file does not restate them.

`CutoutEditorView.swift` reads `UIAccessibility.isReduceMotionEnabled` and observes its change notification itself, because the hook does not reach native code.

### Accessibility rules shared by every component

- **Announcements.** `accessibilityLiveRegion` is Android-only and `accessibilityRole="alert"` does not announce on appear on iOS. Every announced text (Banner, ResultBar, Field and Text errors, the guide pill, the Footer primary) calls `AccessibilityInfo.announceForAccessibilityWithOptions(text, { queue: true })` only when the text appears or changes after the screen has rendered. Never on initial mount: a session Banner already there when Today opens is read in normal order, not announced. When focus moves to a text, that text is not also announced, so VoiceOver reads it once. The Footer primary is announced only the first time it becomes usable per visit to the screen.
- **Focus.** When a control is replaced in place, focus goes to its replacement, never to the top of the screen. ResultBar: see ResultBar > Focus. After Undo: focus the restored button that was pressed. Expander resolves or Banner leaves: focus the next sibling. Expander closes: focus its header. Footer primary appears: focus does not move.
- **No nested pressables.** A pressable Tile is one accessible element, and its inner controls (Change colour, Try again, Put away) are `accessibilityActions` on it. A Row with a trailing toggle or action has no `onPress`, so the toggle or action is its own element that VoiceOver and Voice Control can name.
- **Decoration is hidden.** Decorative images and symbols (EmptyState mark, Banner `leading` symbol, Row `icon` leading, quiet Button icons, the needs-an-answer dot, the session dot) set `accessibilityElementsHidden`. The label carries the meaning.
- **Smart Invert.** Every piece image, FlatLay, swatch and camera view sets `accessibilityIgnoresInvertColors`.
- **Semantics on device.** Chip and Segmented single choice use `radio` plus `accessibilityState.selected` in a `radiogroup`. iOS has no radiogroup trait, so Lane 1 checks with VoiceOver in English and bokmål. If it does not read the position or reads the role in English on an nb-NO device, single choice falls back to `button` plus `accessibilityState.selected`. The same check covers checkbox/checked, expanded and busy, so these state words are read in bokmål on an nb-NO device.
- **Selected tab.** Never colour alone (plum against ink is 1.96). The selected tab shows its filled symbol through the NativeTabs selected icon (`sun.horizon.fill`, `rectangle.stack.fill`) inside the native iOS 26 selection capsule. Closet has no system fill, so it ships a custom `hanger.fill` symbol asset as its selected icon. Every tab changes shape when selected; the faint native capsule is never the only cue.
- **Headers.** Section titles, the `EmptyState` title and the hero `FlatLay` title carry `accessibilityRole="header"`, so the rotor can jump to them.

### Token file shape

```ts
export const theme = {
  colors: {
    canvas: "#FFFFFF", surface: "#FBF9F7", sunken: "#F2EDE7",
    ink: "#322E28", inkMuted: "#706963", inkDisabled: "#706963", placeholder: "#706963",
    line: "#E6E0DC", lineField: "#948B85",
    plum: "#675469", plumPressed: "#574559",
    plumSoft: "#F3EEF4", plumSoftPressed: "#E6DDE7", plumSoftDeep: "#DDD2DF", onPlum: "#FFFFFF",
    blush: "#E2B1A8", blushStrong: "#BE8077",
    error: "#96354A",
    scrim: "rgba(50,46,40,0.55)", scrimPill: "rgba(50,46,40,0.70)", onMedia: "#FFFFFF",
  },
  colorsIncreasedContrast: { blushStrong: "#9A5A52", inkMuted: "#322E28", line: "#948B85" },
  brand: { ivory: "#F4EDE3", plumGround: "#644E64", sheen: "#FAF8F3" },
  space: { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32, footerInset: 48 },
  radius: { sm: 8, md: 12, lg: 20, full: 999 },
  type: { display, title, headline, body, subhead, footnote, mark },
  elevation: { rest, lift },
} as const;
```

`brand` is for the splash tile, the mark and the sheen band only, never UI. `ivory` is the scarf and `sheen` the band's peak. `plumGround` is sampled from `icon.png`, so the splash tile matches the app icon pixel for pixel when iOS hands off from the icon to the splash; UI plum stays `plum`.

`accent`, `accentSoft`, `accentText`, `background` and `muted` become `plum`, `plumSoft`, `onPlum`, `canvas` and `inkMuted`. Lane 1 renames them in one pass.

## Component library

`Text` is the primitive (0), and seventeen components sit on it, one way to do each job. Every screen in `docs/redesign/flows/*.md` is built only from these plus native navigation. A pattern not listed here is not allowed, and a flow that needs one asks the UI designer first.

| # | Component | Job |
|---|---|---|
| 0 | `Text` | Every string |
| 1 | `Screen` | Every route: header, scroll, gutter, footer, gone state |
| 2 | `HeaderItem` | Header left and right actions |
| 3 | `Footer` | The pinned primary action |
| 4 | `Button` | Every pressable action that is not a chip, row or tile |
| 5 | `Section` | Titled group of content |
| 6 | `Row` | List item, setting, link, toggle |
| 7 | `Chip` and `ChipRow` | Filters, multi or optional choices, facts, control chips |
| 8 | `Segmented` | One of two or three fixed choices that always has a value |
| 9 | `Field` | Text entry and search |
| 10 | `Tile` | Piece, capture job, photo variant, body shape |
| 11 | `FlatLay` | Every picture of an outfit |
| 12 | `Expander` | Every inline change that used to be a sheet |
| 13 | `Banner` | Session state and problems at the top of content |
| 14 | `ResultBar` | Inline confirm and undo where the action was |
| 15 | `EmptyState` | Empty, first run and gone |
| 16 | `Silk` | Loading, generating and busy surfaces |
| 17 | `CameraFrame` | Camera, cut-out canvas and selfie surfaces |

System alerts through `confirmAction` stay as they are for destructive confirms and discard prompts. They are not a component here.

---

### 0. Text

**Purpose.** Every string in the app, with a type role and a colour.

**Props.** `role: "title" | "headline" | "body" | "subhead" | "footnote" | "mark"` (default `body`; `display` is native-bar only), `tone: "ink" | "muted" | "disabled" | "plum" | "error" | "onPlum" | "onMedia"` (default `ink`), `announce?: boolean`, plus `TextProps`.

**States.** None. Error text sets `announce`, which follows the shared announcement rule.

**Anatomy.** A single `Text` with the role's font, size, line height, tracking and `maxFontSizeMultiplier` from the type table.

---

### 1. Screen

**Purpose.** The single scaffold for every route. It owns the header, the scroll view, the gutter, the keyboard, the footer and the gone state, so screens only describe content.

**Props.**

| Prop | Type | Notes |
|---|---|---|
| `title` | string | Inline title on pushes, large title on tab roots |
| `large` | boolean | Tab roots only. Native large title in Georgia `display`, collapses on scroll |
| `leading` | `"back" \| "cancel"` | Default `back`: native chevron, no label. `cancel` only on draft editors, wired to `useDiscardChanges` |
| `actions` | up to two `HeaderItem` | Header right |
| `footer` | `Footer` element | Present on every screen that can commit, even before it can act (see Footer > Waiting and Disabled) |
| `progress` | `{ step, total }` | Onboarding only: 2 pt plum track under the header bar. `accessibilityRole="progressbar"`, `accessibilityValue { min: 0, max: 100, now }`, and `accessibilityValue.text` "Step 2 of 6" / "Steg 2 av 6" |
| `scroll` | boolean, default true | `false` for builder, camera and canvas screens that lay out to the full height |
| `gone` | `{ title }` | Renders `EmptyState` with "Go back" (pops) under the same header |
| `media` | boolean | `ink` ground for `CameraFrame` screens, header background `ink`, light status bar, header tint and title colour `onMedia` (`headerTitleStyle` as well as the tint, 13.49). Children follow the media rule (Colour > Rules) |

**States.** Default; loading (children render `Silk` placeholders, header and footer are already present so nothing jumps); gone; keyboard open (footer rides the keyboard, scroll insets adjust automatically; exception: during an in-place title rename the Footer stays at the bottom under the keyboard, because Done or dragging the keyboard down commits, see `flows/F09-looks.md` 2a).

**Anatomy.** Native stack header (glass items, `plum` tint, or `onMedia` on `media`, no shadow, `canvas` background, `ink` on `media` with an `onMedia` title) / `ScrollView` with `contentInsetAdjustmentBehavior="automatic"`, `keyboardShouldPersistTaps="handled"`, `keyboardDismissMode="on-drag"`, horizontal padding `gutter`, top `space.sm`, bottom inset = measured Footer height + `space.footerInset` (just `space.footerInset` on a screen with no Footer) / `Footer`, a flex sibling under the ScrollView, never absolutely positioned. No max width.

No intro sentence under any title.

---

### 2. HeaderItem

**Purpose.** One header action. It is a native header item, so iOS draws it in system glass and the Large Content Viewer works.

**Props.** `icon?: SFSymbol`, `label: string` (always required, used as the VoiceOver label for icon items), `onPress`, `kind: "icon" | "text"` (derived: `icon` present means icon), `menu?` (native UIMenu items) with `disabled?: boolean`.

**Rules.**

- An icon is used for going somewhere or creating: `plus` (Add pieces, New look), `person.crop.circle` (Profile), `lightbulb` (Tips), and the scan camera action `camera.rotate` (Switch camera). The Closet select menu `ellipsis.circle` is labelled `common.actions`.
- Text is used for changing mode: Edit, Select, Done, Cancel. Commits never live in the header: they use the Footer.
- A menu item uses `ellipsis.circle` and holds actions on a selection that are not the next step. Only Closet select uses it (F04).
- At most two on the right, one on the left. Text items keep `maxFontSizeMultiplier` 1.3 and become icon plus VoiceOver and Large Content Viewer label at `large` (`pencil` Edit, `checklist` Select, `checkmark` Done, `xmark` Cancel).

**States.** Default, pressed (system).

**Anatomy.** Native `headerRight`/`headerLeft` item, the Screen's tint, 44 pt hit area.

---

### 3. Footer

**Purpose.** The pinned home of the one primary action on any screen that commits something.

**Props.** `primary?: ButtonProps` (absent only in Waiting), `secondary?: ButtonProps` (one at most), `waiting?: boolean`, `error?: string`, `children?` (only `ResultBar`, which replaces the buttons in place).

**States.**

- Waiting: only where the action does not exist yet (Today before an outfit, selection mode before a selection). The primary is rendered at opacity 0 with `pointerEvents="none"`, `accessibilityElementsHidden` and `importantForAccessibility="no-hide-descendants"` (RN still hit-tests opacity 0 views; every control hidden in place follows this until it is shown), so the reserved height is measured at the current text size and for the bokmål label. No reason text.
- Disabled: on Editor screens (new piece, edit piece, build look, Your style, Adjust, answer) the primary is rendered from the first frame with the disabled look (`inkDisabled` label on `sunken`, `accessibilityState.disabled`) until it can act, then takes the `plum` fill with the selection crossfade. The commit point is always visible and nothing appears.
- Shown: from Waiting, the primary fades in place (`base`, `silk`) with no change in height or position. It never slides or expands. Focus does not move to it; it is announced per the shared rule.
- Busy: the primary shows `Silk` busy and the secondary stays enabled. Exception, corrupting writes: when both buttons commit the same record (onboarding done: Add pieces and Try the sample closet), the one not busy is disabled, because a second commit would corrupt the write.
- Result: a `ResultBar` sits where the buttons were.
- Error: `error` is drawn inside the Footer above the buttons as `footnote` `error`, announced (shared rule). The Footer grows upward, so the buttons do not move. It clears on the next press. Every Footer commit error uses this slot (F02, F05, F06, F09).

**Anatomy.** A flex sibling under the ScrollView, never absolutely positioned. `Screen` measures it with `onLayout` and sets the ScrollView bottom inset to that height plus `space.footerInset`, so the last block is never behind it. `canvas` background (`ink` on `media`), `line` hairline on the top edge only when content scrolls under it, padding `space.md` vertical and `gutter` horizontal, bottom safe area. Buttons are `control.regular`. A lone primary is full width. A pair sits side by side, secondary left, and stacks (secondary above) when either label wraps or at `large`. Both labels are measured in a hidden layer before the pair is shown (as `motion.md` > Banners and bars), so the pair never paints side by side and then stacks. At `ax` only the primary stays pinned; the secondary becomes a quiet Button at the end of the scroll content. The Footer is last in reading order.

---

### 4. Button

**Purpose.** Every action that is not selecting a chip, row or tile.

**Props.** `label`, `onPress`, `variant: "primary" | "secondary" | "quiet" | "destructive"`, `size: "regular" | "small"` (default `regular` in `Footer`, `small` elsewhere), `icon?: SFSymbol` (quiet only, leading), `busy?`, `busyLabel?` (VoiceOver only), `disabled?`, `accessibilityLabel?`.

| Variant | Fill | Pressed fill | Label | Where |
|---|---|---|---|---|
| `primary` | `plum` | `plumPressed` (onPlum 8.75) | `onPlum` `headline` | Footer, and the EmptyState action on a screen with no Footer. One per screen |
| `secondary` | `plumSoft`; `plumSoftPressed` inside `surface` containers (1.26 on surface, plum 5.20) | `plumSoftPressed` (plum 5.20); `plumSoftDeep` inside `surface` containers (plum 4.71) | `plum` `headline` | The Footer's second action; Banner and Expander actions |
| `quiet` | none | `sunken` (plum 5.92) | `plum` `headline`, optional `icon.bar` symbol | Today quiet row, Undo, "Go back", links, "Show all", "Show all hijabs" |
| `destructive` | none | `sunken` (error 6.21) | `error` `headline` | Remove piece, Remove look, Delete all data, always followed by a system alert |

On `Screen media`, and on anything inside a `CameraFrame`'s `ink` frame on a canvas screen (the selfie's EmptyState), the media rule applies: `quiet` labels and icons are `onMedia` and press to `plumPressed`; `primary` is the media variant, `onMedia` fill with a `plum` label (6.89), pressed `plumSoft` (plum 6.02).

**States.** Default; pressed (the variant's pressed fill, motion `press`; no opacity change); busy (`Silk` busy sweep across the fill, label unchanged and not dimmed, `accessibilityState.busy`, look delayed per the in-flight rule). Disabled (`inkDisabled` label on `sunken`, `accessibilityState.disabled`): only an editor's Footer primary and a control waiting on a write. Anywhere else an action that cannot be used yet is not rendered; where it can appear later, its row reserves the height (see Expander).

**Anatomy.** Capsule (`radius.full`), `minHeight` `control.regular` 52 or `control.small` 44, vertical padding `space.md`, horizontal padding `space.lg`, label centred and wrapping (never truncates).

---

### 5. Section

**Purpose.** Group related content under one short title.

**Props.** `title?: string`, `action?: { label, onPress }` (one action on the title line, for example "Show all"), `children`.

**States.** Default only. A section with no content is not rendered, and its empty state belongs to the screen.

**Anatomy.** Title in `headline` `ink`, `accessibilityRole="header"`, with the action as `Button quiet small` at the trailing end; at `large` the action wraps under the title, leading-aligned / `space.md` / children with `space.lg` between blocks. Sections are separated by `space.xxl` and no rules or dividers. There is no caption slot.

---

### 6. Row

**Purpose.** A list item that shows one thing and leads somewhere or changes one setting. It covers settings, look lists, saved-look suggestions, "Used in", profile stats, the scanned-piece review and the Change strip at `ax`.

**Props.**

| Prop | Type | Notes |
|---|---|---|
| `title` | string | `body` `ink`. Wraps, never capped |
| `meta?` | string | `subhead` `inkMuted`: "Worn 3 times", "Fits today", "Work". Wraps, never capped |
| `leading?` | `{ thumb: Piece } \| { lay: Piece[] } \| { swatch: string } \| { icon: SFSymbol }` | `thumb` 40 pt; `lay` `FlatLay` `row` 72 pt on the Looks tab, `mini` 56 pt elsewhere; swatch; icon `icon.bar` `inkMuted`, hidden from VoiceOver |
| `trailing?` | `"chevron" \| { value: string } \| { toggle: boolean, onToggle } \| { action: ButtonProps(quiet, small) } \| "selected"` | One trailing item only |
| `onPress?` | function | Whole row is the target. Not allowed with `toggle` or `action` |
| `below?` | `ButtonProps(quiet, small)` | Action under the meta (Today variant look Row, "Fill the gap"). It sits outside the press area, leading-aligned with the title, as its own element; the Row keeps `onPress` for lay, title and meta and also carries the action as an `accessibilityAction` |

**States.** Default, pressed (`sunken` fill, motion `press`), selected (the selected recipe: trailing `ink` `checkmark`, `accessibilityState.selected`), checked (a keep-or-drop list such as the scanned-piece review: the same trailing checkmark, role `checkbox` with `accessibilityState.checked` true or false, so a dropped row reads its state), disabled (toggle only, system), busy (the toggle stays visible and disabled while the write runs, per the in-flight rule, `accessibilityState.busy`, no extra glyph).

**Accessibility.** One element, except that a trailing toggle or action is its own element. Label = title, meta, trailing value. A toggle row is the native `Switch` row (`accessibilityRole="switch"`). A row with a trailing action has no `onPress`; the action is its own button element ("Put away"), so Voice Control can name it. A row with a `below` action keeps `onPress`, because the action sits outside its press area as a sibling element, and adds the action to the Row's `accessibilityActions` so the rotor offers it. A `lay` or `thumb` leading is hidden from VoiceOver (`accessibilityElementsHidden`), and a look row's label carries the look name, occasion, piece count (spoken even when not shown) and status, joined with ", " ("Eid lunch, Eid, 5 pieces, Planned for Saturday 11 October").

**Anatomy.** `minHeight` `control.regular`, vertical padding `space.md`. The pressed fill bleeds to the screen edges (margin `-gutter`, padding `gutter`); the separator stays inset to the text start. Leading / `space.md` / title and meta stack / trailing. Hairline `line` separator between rows, none after the last. At `large` the trailing value moves under the title. At `ax` a `lay` leading sits above the title and meta and a trailing chevron moves onto the lay line (trailing, vertically centred on the lay), so the title and meta take the full content width (343 pt on a 375 pt phone). Toggle is the native `Switch` with `trackColor.true = plum` and `hitSlop` `{ top: 7, bottom: 7 }`, so its 51 x 31 pt control reaches the 44 pt target.

---

### 7. Chip and ChipRow

**Purpose.** The only small pressable token. It covers filters, choices with four or more options, multi-select, optional single choices, facts on piece detail, and control chips that open something (Today context row).

**Chip props.** `label`, `selected?`, `onPress`, `swatch?: string` (leading colour dot), `kind: "choice" | "control" | "action" | "fact"` (default `choice`), `opens?: "expander" | "screen"` (control only), `tentative?` (fact guessed by the app, not confirmed), `accessibilityLabel?`.

| Kind | Look | Behaviour and semantics |
|---|---|---|
| `choice` | Unselected `sunken` fill, transparent 2 pt border, `ink` `subhead`. Selected per the selected recipe: `blush` fill, 2 pt `blushStrong` border, same label weight, no glyph, so the chip keeps its width | Toggles, no haptic (`motion.md` > Haptics). Single select: `radio` plus `accessibilityState.selected`, `radiogroup` on the row (device check in the shared rules). Multi: `checkbox` plus `accessibilityState.checked` |
| `control` | `sunken` fill, `ink` label, trailing 13 pt `inkMuted` `chevron.down` when it opens an Expander, `chevron.right` when it pushes a screen, no glyph when it starts an in-place edit | Today occasion, style, weather; Closet More; look detail Worn, Plan and Rename (Rename opens the title Field in place). `button`; `accessibilityState.expanded` tied to its Expander when it opens one |
| `action` | `sunken` fill, `ink` label, no glyph, never selected | A commit chip: one tap writes at once (Today and Yesterday in the look detail Worn body). `button`, no selected state, `press` only, no haptic. The result shows elsewhere (a ResultBar in the same body, the meta line), never as a blush flash on the chip |
| `fact` | `sunken` fill, key "Colour" in `placeholder` then value in `ink`, trailing 13 pt `inkMuted` `chevron.down`. `tentative`: the needs-an-answer dot before the label, nothing else | Opens its `Expander` with choices; a pick writes at once and closes it. Reads "Colour: sage, suggested" / "Farge: salvie, foreslått" |

**ChipRow props.** `label?` (rendered as a `Section`-style `headline`, or omitted when the Section already names it), `options`, `value` (single id, id array for multi, or null), `onChange`, `layout: "wrap" | "scroll"` (default `wrap`; `scroll` only for Closet and builder category filters, leading edge on `gutter`, content running to the screen edge; becomes `wrap` at `ax`), `multi?`.

**States.** Default, pressed (motion `press`), selected, disabled (`inkDisabled` on `sunken`, `accessibilityState.disabled`, only while a write is in flight, per the in-flight rule), tentative (fact), busy (`accessibilityState.busy` while the work it started runs, look unchanged; the `Silk` region the work happens in carries the VoiceOver label, for example Clean background with `photo.cleanMaking`).

**Anatomy.** Inside a `surface` container (an Expander body) unselected chips get a 1 pt `lineField` edge (3.18 on surface), because `sunken` on `surface` is 1.11, and the selected chip edge uses `#9A5A52` (5.05 on surface, 1.59 against `lineField`, the Increase Contrast value), so selected and unselected differ by more than edge width. On `canvas`, `action`, `control` and `fact` chips get the same edge (3.34 on canvas), because `sunken` on `canvas` is 1.16 and a chip with no glyph would read as a plain word. Capsule (`radius.full`), switching to `radius.md` once the label wraps to a second line, `minHeight` `control.small` 44, `maxWidth: "100%"`, vertical padding `space.sm`, horizontal padding `space.lg`, gap `space.sm`. The label wraps inside the capsule, so a chip never runs off screen. Chevron scales by `symbolScale`. A selected chip that carries a chevron (the chosen date in Adjust When, which reopens the date Expander) draws it in `ink` (7.12 on `blush`); `inkMuted` is never drawn on `blush` (2.85).

---

### 8. Segmented

**Purpose.** Choose exactly one of two or three fixed, short options that always has a value. Rule: two or three options and a required value means `Segmented`; anything else is a `ChipRow`. Exception: a fact `Expander` body (piece detail, capture confirm) always uses a `ChipRow`, whatever the option count, so every fact edits the same way.

Used for, outside fact Expanders: Style (Desi, Western, Both); Your day (Mostly indoors, Time outside); Warmth (Light, Medium, Warm); Rain and Snow (Yes, No); Closet in Adjust (Sample closet, My clothes); Units (cm and °C, ft and °F).

**Props.** `label?`, `options` (2 or 3), `value`, `onChange`, `disabled?`.

**States.** Default, pressed, selected, disabled (in-flight write, per the in-flight rule, `accessibilityState.disabled`), `large` (a vertical list of `Row`s with a trailing `checkmark` on the chosen one; the list keeps `radiogroup` and each Row keeps `radio` plus `accessibilityState.selected`; on `Screen media` the Rows follow the media rule: `onMedia` title and checkmark, pressed `plumPressed`, no separators).

**Anatomy.** Track: capsule, `sunken` fill, `minHeight` 44, 2 pt inset. The inset is visual only: each segment's Pressable fills the full 44 pt track height. Thumb: capsule, `canvas` fill with a 1 pt `inkMuted` edge (4.64 on sunken), slides between segments with the settle motion. The thumb alone marks the choice, as in native iOS segments; no checkmark. Labels are `subhead` `ink` at one weight, horizontal padding `space.md` per segment. Segments share width equally, and when a bokmål label would wrap ("Eksempelgarderobe" / "Mine klær") the control switches to the vertical list instead of truncating. On `Screen media` it never becomes a list: each Segmented takes its own full-width line, and at `large`, or when a label would wrap, each segment shows its option's symbol (scaled by `symbolScale`) with the word as `accessibilityLabel` (cut-out editor: `paintbrush`, `eraser`, three `circle.fill` sizes). `accessibilityRole="radiogroup"` on the track, `radio` plus `accessibilityState.selected` on each segment (device check in the shared rules). Native `UISegmentedControl` is not used because it does not scale with Dynamic Type.

---

### 9. Field

**Purpose.** Text entry: piece name, look name, place search, rename in place. Closet search is the native header search bar.

**Props.** `label` (visible `headline` above; hidden, as placeholder and VoiceOver label only, for search, whenever the Field is the only control in a titled Section, and for rename in place), `value`, `onChangeText`, `kind: "text" | "search"`, `error?: string`, plus `TextInputProps`.

**States.** Default (`surface` fill, 1 pt `lineField` edge), focused (1.5 pt `plum` edge), error (1.5 pt `error` edge and `footnote` `error` text directly under, announced per the shared rule), disabled (`sunken` fill, `inkDisabled` text, `accessibilityState.disabled`), filled-search (trailing `xmark.circle.fill` clear, 44 pt target).

**Anatomy.** Label / `space.sm` / input (`minHeight` `control.regular` 52, vertical padding `space.md`, grows with its line height, `radius.md`, padding `space.md` horizontal, `body` `ink`, `selectionColor` plum, placeholder in `placeholder`). The search kind has a leading `magnifyingglass` `icon.inline` `inkMuted`. Placeholders are short nouns ("Search"), not examples. Rename in place (look title) uses the `title` role at the title's size and line height, no fill and no box, only the caret and a 1 pt `lineField` underline inside the title's bottom padding, so nothing moves when it opens.

---

### 10. Tile

**Purpose.** A photo you can tap or select, with a name under it. It covers closet pieces, picker cells, Change strip alternatives, capture jobs, photo variants and body shapes.

**Props.**

| Prop | Type | Notes |
|---|---|---|
| `image` | `Piece` or image source | Piece photos render as cut-outs on `canvas`, with `elevation.rest` at `grid` and `strip` size |
| `label?` | string | `subhead` `ink`, 2 lines below `large`, no cap at `large`. Omitted in `thumb` size |
| `meta?` | string | `subhead` `inkMuted`. Grid only, and only for Failed, Put away and the unavailable reason |
| `size` | `"hero" \| "grid" \| "strip" \| "thumb"` | `hero` full content width, aspect 4:5, a cut-out on `canvas` at `elevation.rest` or a raw photo in a `radius.md` frame; switching between the two crossfades image and frame together (`base`, `silk`) (piece detail, edit piece); `grid` 2 columns (1 at `ax`), aspect 4:5; `strip` 112 pt wide in a horizontal strip, below `ax` only (at `ax` the strip becomes `Row`s, see Expander); `thumb` 40 pt square, `hitSlop` to 44 when pressable |
| `selected?` | boolean | Selection mode, chosen alternative |
| `planned?` | string | The planned-day mark, top left. At `ax` it moves to the line under the photo |
| `colour?` | `{ hex, name, onPress? }` | Capture tiles: its own 44 pt colour line under the label, the swatch plus `capture.colourLabel` ("Farge: salvie"); the piece name stays on the label line. Change strip hijabs: a swatch inline before the label, the colour name spoken, not shown |
| `state?` | `"queued" \| "preparing" \| "ready" \| "needsAnswers" \| "failed" \| "removed" \| "putAway"` | Capture jobs, and put-away pieces |
| `tint?` | colour | Body-shape drawings: `inkMuted`, `ink` when selected |

**States.**

- Default.
- Pressed: a `sunken` fill at `radius.md` fades in behind the cut-out (motion `press`); the image is never dimmed.
- Selected: the selected recipe, a 22 pt `blush` disc top right with an `ink` `checkmark` (the disc scales by `symbolScale`). The cut-out stays at `rest`.
- Queued (capture Waiting): `Silk` placeholder in the tile shape.
- Preparing: `Silk` sheen over the photo. The label block below is reserved from Queued on, sized for the tallest capture layout (a meta line plus a 44 pt line) and holding a `Silk` placeholder `text` shape, so resolve is opacity only (F02).
- Needs answers: the needs-an-answer dot before the label. No meta text, no swatch.
- Failed: `footnote` `error` meta, quiet "Try again" as its own 44 pt control below the photo's press area.
- Removed (capture only): the photo area stays empty at its size and the label block shows "Removed" (`subhead` `inkMuted`) with a quiet Undo. The slot leaves with List remove only while the screen is covered or once it scrolls out of view, never on a press (F02).
- Put away: photo at full strength, `meta` "Put away".

**Mark look.** One capsule: `blush` fill, `mark` `ink` text, the planned day in its short form ("Fri" / "fre."). The mark may wrap to 2 lines.

**Decoration cap.** At most one decoration on the photo (the planned mark or the selected disc, never both; selected wins) and at most one before the label (the needs-an-answer dot or the swatch; the dot wins). The swatch is 14 pt and always draws its 1 pt `lineField` edge; the dot is 8 pt and never has an edge, so a plum swatch never reads as the dot.

**Anatomy.** Cut-outs sit straight on `canvas` with `contentFit="contain"`; there is no bed at rest. Raw photos (a capture before its cut-out, photo variants) fill a `radius.md` frame. / `space.sm` / label line (optional dot, optional swatch, label) / meta. On a capture tile with `colour.onPress`, the colour line under the label is one control with a real `minHeight` 44 (not `hitSlop`), below the photo's press area, and opens the colour Expander.

**Accessibility.** One element. Label = name, colour, mark, state: "Sage kurta, green, Planned for Friday"; "Sage kurta, green, Put away"; "Sage kurta, green, Needs an answer". Preparing reads "Preparing photo" with `accessibilityState.busy`. The planned mark is spoken in full ("Planned for Friday"). Selected uses `accessibilityState.selected`. Inner controls are `accessibilityActions`: "Change colour", "Try again", "Put away".

---

### 11. FlatLay

**Purpose.** The one picture of an outfit everywhere: Today, look detail, builder, the Change strip swap, Looks rows, "From your looks". It is the dressing-room image: cut-outs arranged on the white canvas as if laid on a bed.

**Props.** `pieces`, `size: "hero" | "row" | "mini"` (hero is square, full content width except on Today, see Anatomy; row 72 pt; mini 56 pt), `keptIds?` (VoiceOver labels only, never drawn), `onPiecePress?` (hero only; opens the Change strip on Today, pushes the piece on look detail), `state?: "arranging"`, `testID`.

**States.**

- Rest.
- Arranging (generating moment): only changed slots swap, in dressing order, `step` apart; unchanged pieces hold still (`motion.md` > Generating).
- Swap: a piece picked in the Change strip takes its slot with the piece-swap motion. No outline, no glow, no lift. The rest of the outfit holds still.
- Empty slot: a dashed 1 pt `lineField` silhouette of the missing role (3.34:1), label read by VoiceOver only ("No shoes").
- Loading: `Silk` placeholder in the flat-lay shape.
- Pressed piece: lifts to `lift` while the finger is down, settles to `rest` on release.

**Anatomy.** A square viewport on `canvas` holding the arrangement from `arrangePieces`, unchanged, so storage, fixtures and tests keep their geometry. Each piece is a View around an `expo-image` in its frame, with `elevation.rest` at hero and row size and none at mini. On Today the hero is centred and capped at 300 pt, or 196 pt while a session Banner shows, so the reason line and the whole quiet row sit above the Footer in the first viewport on a 390 x 844 phone; at `large` and up the row may scroll. Text never sits on top of the flat lay. Under it, in order and only when present: `title` (outfit or look name, Georgia, `accessibilityRole="header"` in hero size), then one `footnote` `inkMuted` reason line. The reason line is always shown; there is no setting for it. Checks become `Banner`s, never a list of sentences.

**Accessibility.** In hero size each piece is its own button (label `change.pieceLabel`, "{name}, {role}" with the role left out when the name holds it, plus ", kept" / ", beholdt" when kept; hint `change.hint` "Changes this piece"; `accessibilityState.expanded` while its Change strip is open). Pieces are rendered in depth order, so the container sets `experimental_accessibilityOrder` (RN 0.86) to the title first, then the piece ids in dressing order (top, bottom, layer, shoes, hijab, accessories), so VoiceOver names the outfit before its pieces. Each hero piece has a hit area of at least 44 x 44 pt (`hitSlop` on small pieces), and where cut-outs overlap the piece highest in z-order wins the touch. Row and mini FlatLays are hidden from VoiceOver; their parent carries the label. Preview variant (hero without `onPiecePress` and without a title, the F07 picker): each piece is `accessibilityRole="image"`, label = piece name and colour, no hint, in dressing order; empty-slot silhouettes keep their VoiceOver-only labels. On look detail the hero's `onPiecePress` pushes the piece, and its piece views stay hidden from VoiceOver (`accessibilityElementsHidden`) because the piece rows below are the same targets; the title stays a header.

---

### 12. Expander

**Purpose.** The single replacement for sheets. An inline region opens under the thing that raised it and pushes the content below down, then closes back. The header, the screen and the outfit stay where they are.

**Props.** `title`, `value?` (current answer shown when closed), `open`, `onToggle`, `tone: "plain" | "attention"`, `children`, `actions?` (up to two Buttons, at most one `secondary`).

`attention` marks a check card that needs an answer: the needs-an-answer dot before the title. The header button's `accessibilityValue` is "{value}, Needs an answer" / "{value}, Trenger svar" when a value is shown, else "Needs an answer" / "Trenger svar".

**Rules.**

- One Expander open per screen. Opening another closes the first.
- When the open one sits above the new one, it collapses without animation and the scroll offset drops by the height removed, in the same frame, so the new header stays still. The new one then opens per `motion.md` > Transitions > Inline expand: anchored at its top, scroll follows on the UI thread until the body is in view.
- Focus follows the shared focus rule.
- No drag handles, no dimming, no overlay, no swipe-to-dismiss.

**States.** Closed (header line, `minHeight` `control.small`: title, value, `chevron.down`; at `large` the value moves under the title), open (chevron rotates 180 degrees, body expands with the inline-expand motion), busy (actions busy), resolved (closes itself and the line shows the new value; a check card disappears once answered).

**Anatomy.** `surface` fill, `radius.md`, padding `space.lg`. Header line: title `headline` / value `subhead` `inkMuted` / chevron. Body: `space.md` gap; content is ChipRows, Segmented, a `Tile` strip, a `Row`, or a `Field`. Actions sit under the content in a leading-aligned wrapping row (the same as Banner), and stack at `large`. When a second action can appear later, the row reserves its stacked height from the start, so the body never changes height. `accessibilityState.expanded` is set on the header button.

**Uses.** Every inline mode in the architecture table (`architecture.md`, "Inline modes"):

- Change strip on Today: body = horizontal `Tile` strip (strip size) of alternatives with `colour`, and a Keep `Chip`. At `ax` the alternatives become a list of `Row`s with `thumb` leading and `selected` trailing. It sits directly under the `FlatLay` hero, above the title. Tapping an alternative applies it at once: the `FlatLay` above swaps the piece with the piece-swap motion and the tapped alternative shows selected. Focus stays on the tapped alternative, and "Changed" is announced. Undo is Today's Undo slot under the quiet row, never in the strip; closing the strip keeps the swap and the slot's Undo. Actions: "Show all hijabs" (quiet, hijab role only). Kept shows only as the selected Keep `Chip` here and in the piece's VoiceOver label.
- Check card on Today: question chips, then the piece as a `Row` (`thumb` leading, piece name, `chevron` trailing) that pushes the piece ("Open {name}" in VoiceOver). Actions "Save answer" (secondary) and "Use another piece" (quiet).
- Not for me reasons.
- Colour correction on Ready capture tiles, confirm and piece detail.
- Tips on Add pieces: no closed header line; the `lightbulb` header item opens and closes it (`accessibilityState.expanded` on that item) and Got it closes it. Body: three tip titles, two with a meta line, no icons.
- Fact guesses on piece detail.
- Worn and Plan on look detail: opened by `control` chips under the meta line. Worn's body holds `action` chips; Plan opens straight onto the native `display="inline"` calendar at full content width, or at `ax` a 14-day `Row` list, with Clear date as a quiet Button under it.
- Rename in place on look detail (Field rename style, counts as the open Expander).
- Draw-box controls on capture group.
- "More" filters in Closet.

---

### 13. Banner

**Purpose.** One true sentence about the state of this screen, with at most two ways out. It sits at the top of content, under the Today context row.

**Props.** `tone: "session" | "notice"`, `text`, `actions?` (up to two: first `secondary`, second `quiet`), `leading?: SFSymbol | { thumb: Piece }` (notice only; the thumb only for the capture duplicate, labelled by its matched piece).

| Tone | Look | Use |
|---|---|---|
| `session` | `surface` fill, leading 8 pt `blushStrong` dot (3.06 on surface, hidden from VoiceOver: the sentence carries the state) | Two patterns, worded in `copy.md`: "{What}, today only" (an occasion or a starting piece) with Back to everyday, and "Planning {day}" with Back to today, or with Open plan and Drop for a plan left unsaved. "Planned for today: {look}" / Show on Today |
| `notice` | `surface` fill, optional leading symbol in `inkMuted` | Problems that stop an outfit ("No shoes for snow" / Start with a piece), "3 preparing" in Closet, "N added" in Closet (`flows/F04-closet.md`), forecast unavailable |

**States.** Default, busy (action busy), leaving (collapses with the inline-collapse motion when the session ends; focus per the shared rule).

**Anatomy.** `radius.md`, padding `space.lg`, `body` `ink` text, actions under the text in a leading-aligned wrapping row at `control.small`, stacked at `large`. "One sentence, at most two lines at default size" is a copy-length rule for the UX writer, not `numberOfLines`. Announced per the shared rule. There are never two Banners stacked: a session banner and a problem merge into one Banner with the problem's action.

---

### 14. ResultBar

**Purpose.** It confirms an action where the action happened, and offers the way back or the next step. It never floats: it takes the place of the action row or footer buttons that caused it.

**Props.** `text` (past tense, short: "Worn today", "Saved", "Changed", "Put away"), `action?` ("Undo", "Open", "Show on Today"), `onDone?`.

**Rules.** One ResultBar per screen. A new one replaces the old one, which restores its buttons. No haptic of its own: the action that caused it owns any haptic (see Haptics).

**States.**

- Shown: replaces the triggering buttons in place with a cross-fade.
- Focus: the text takes VoiceOver focus only when the ResultBar replaces the control that was pressed (Wear this), and is then not announced. Undo slot on Today: focus stays on the pressed control and the slot text is not announced; the change announces itself (`today.announce.outfit`, or `result.changed` for a Change strip pick). When the cause is elsewhere, the text is announced and focus stays where it is.
- Stays until the user acts elsewhere on the screen (a press or an edit; scrolling and VoiceOver focus moves do not count), leaves the screen, or presses its action. No timer.
- After Undo: the original buttons cross-fade back and focus returns to the button that was pressed.

**Anatomy.** `minHeight` of the row it replaced, grows when the text wraps. Leading `checkmark` `icon.inline` in `plum` / `body` `ink` text / trailing quiet Button. At `large` it stacks, as Banner actions do: checkmark and text on the first line, the quiet action under it, leading-aligned. A host that reserves the ResultBar's height measures this stacked layout at the current text size, in English and bokmål.

Inline two-choice confirms that are not destructive use the same bar with two actions. Example: "Save this plan?" with Save look (secondary) and Discard (quiet), shown in place of the planning Banner's text and action row when "Back to today" is pressed with an unsaved plan. Destructive confirms stay system alerts.

---

### 15. EmptyState

**Purpose.** It names the next step when a screen has nothing to show, a flow has nothing to work on, or the thing has gone.

**Props.** `title` (optional on Today first run only, where the large title already says Today), `line?` (one sentence max, only when the title alone cannot say what will happen), `action: ButtonProps` (always one; "Add pieces", "Set your style", "New look", "Go back"), `secondary?: ButtonProps` (Today first run only: one `quiet` Button, "Try the sample closet"), `mark?: boolean` (default false).

**States.** Empty (closet, looks, picker, builder), first run (Today without an everyday style), gone ("This piece is no longer here" with Go back, which pops), unavailable on `media` (CameraFrame).

**Anatomy.** Placed in the upper third, not centred in the void. Optional mark / `space.xl` / `title` (Georgia, centred, `accessibilityRole="header"`) / `space.sm` / optional `body` `inkMuted` line / `space.xl` / Button, centred. The Button is `primary` regular when the screen has no Footer (empty Closet, Looks, Today first run), and `secondary` small when a Footer owns the primary. On `media`, and inside a `CameraFrame` `ink` frame on a canvas screen, title and line are `onMedia` (13.49) and the action takes the Button media variant (`onMedia` fill, `plum` label 6.89, pressed `plumSoft` 6.02). The mark is `assets/brand/mark.png` on `assets/brand/tile.png` (ivory alone on white is about 1.1:1) at `brandMark` size, still, shown only on Closet empty, Today first run and the onboarding done step. Every other empty and gone state is title plus action; Today first run is mark plus actions, no title. The closet-could-not-open screen (F01 S2) is not an EmptyState: it is the splash overlay's error state, with the tile and mark at the splash rect and the title and button below.

---

### 16. Silk

**Purpose.** It shows that something is loading, generating or busy, in the logo's material. It replaces every spinner. The motion and the sheen colour are defined in `motion.md` (Loading and Generating moments, Sheen asset spec). This component defines the surfaces.

**Props.** `kind: "placeholder" | "sheen" | "busy" | "progress"`, `shape?: "tile" | "row" | "lay" | "chip" | "text"` (placeholder only), `value?: number` (progress, 0 to 1), `label` (VoiceOver: "Loading", "Preparing photo", "Saving").

| Kind | Surface | Where |
|---|---|---|
| `placeholder` | `sunken` shape in the target component's exact size and radius, so nothing moves when content lands. `text` and `row` shapes take their height from `role.lineHeight * fontScale` | Closet grid before photos, Looks rows, Today flat lay on launch, forecast chip |
| `sheen` | Over an existing image: one plain soft diagonal band (Sheen asset spec). No ribbon thread | Capture tile preparing, Clean background being made, the flat lay while arranging, selfie "Measuring your colours" |
| `busy` | The same band, clipped to a Button's capsule, label unchanged | Every committing Button |
| `progress` | 2 pt `plum` fill on a 1 pt `lineField` track (3.34 on canvas), full width of its container, eased fill, so the total shows | Onboarding steps (`Screen.progress`), multi-photo import count, Clean background when the model reports progress |

**States.** Running, resolving (sheen fades as content cross-fades in), Reduce Motion (see `motion.md`), interrupted (leaving the screen cancels and clears it).

**Accessibility.** Each placeholder is hidden from VoiceOver. One element per region (the grid, the list, the chip) carries the `label` and `accessibilityState.busy`, so a Closet grid says "Loading" once. `busy` sets `accessibilityState.busy` on its Button. `progress` sets `accessibilityRole="progressbar"` and `accessibilityValue { min: 0, max: 100, now }`.

**Anatomy.** A Reanimated translated band inside an `overflow: "hidden"` container, drawn with RN `experimental_backgroundImage` linear gradients (no new dependency), with a three-step View fallback.

---

### 17. CameraFrame

**Purpose.** The one media surface. It covers live scan, selfie, cut-out editor canvas, capture-group box drawing and colour sample points. It sits on `Screen media`, so the media rule applies around it, except the selfie, which sits on `canvas` (F01 S4). The media itself is a live photo and can be any colour, so every mark on it follows the camera and photo rule.

**Props.** `children` (camera view, canvas or photo), `guide?: string` (live guide pill text), `outline?: { frame, state: "searching" | "found" }`, `oval?: { state: "find" | "ready" }` (selfie), `points?` (selfie sample dots), `tray?: Piece[] | Sticker[]`, `shutter?: { onPress, disabled }`, `controls?` (quiet Buttons under the frame: `onMedia` on `Screen media` per the media rule (Undo, Reset, Smaller, Larger), `plum` on the canvas selfie; on canvas screens such as capture group and the selfie, the controls follow the canvas colours, standard `plum` quiet Buttons (6.89) with any text off the photo in `ink` (13.49), the same way the shutter ring turns `plum`), `readout?: string` (scan speed readout, in release per owner decision 3).

**States.**

- Searching: `onMedia` 2 pt dashed outline (or dashed oval) on its 1 pt `ink` halo.
- Found (also selfie `ready`): solid `blush` 2 pt outline (or oval) on its `ink` halo, and the shutter is enabled. Scan, capture group and the cut-out editor share this one order. In live scan the outline alone marks the piece, because detection comes and goes and a dim would pulse. The background dims with `scrim` only in single-photo select and the cut-out editor. Choreography in `motion.md`.
- Lifting: the cut-out fades from the frame while its tray thumb fades in and settles in place. No scale, no flight.
- Unavailable: no camera permission or no camera. `EmptyState` on the `ink` ground with "Choose photos", title and line in `onMedia`, action in the Button media variant, also inside the selfie's frame on canvas. On the selfie at `ax` the frame grows to fit its EmptyState, since there is no live photo to keep still.

**Anatomy.** Frame (`ink` ground, `radius.lg`, full width; full screen for scan) / guide pill bottom centre (`scrimPill`, `radius.full`, `mark` `onMedia`) / readout top left (`mark` full `onMedia` on its own `scrimPill`), never on the guide's line. Pill and readout stay on the photo only below `ax`. At `ax` both leave the photo for the controls area under the frame as uncapped `subhead` `onMedia` on the `ink` ground (13.49; `ink` on canvas screens), and the frame keeps a floor of 40 percent of the safe-area height between header and Footer while everything between the frame and the Footer scrolls as one ScrollView, Footer pinned. The shutter sits directly under the frame so it is always in the first viewport, then guide, readout, tray, controls; VoiceOver order stays guide, readout, shutter (`experimental_accessibilityOrder`) / shutter centred under the frame (76 pt ring 4 pt `onMedia` on an `ink` halo, 60 pt inner disc `onMedia`; on canvas screens the ring and the inner disc are `plum` (6.89), with a 4 pt `canvas` gap between them, because an `onMedia` disc is white on white) / tray (horizontal strip of `Tile` thumbs, 56 pt, each on a `canvas` bed at `radius.sm`, no shadow, role `image`) / controls row. Sample points are 44 pt targets with a 26 pt ring 3 pt `onMedia` on an `ink` halo, filled with the sampled colour.

On a camera with no Footer (the selfie, F01 S4a) the shutter is the one control rendered while unavailable, because the camera layout must not move. The scan screen has a Footer it cannot show while unavailable, so its unavailable state has no ring (F03 S1u). Disabled is a plain solid ring in `sunken` with no inner disc (`inkDisabled` on canvas screens), plus `accessibilityState.disabled`. Enabled and disabled differ as filled against empty, not by colour alone.

**Accessibility.** The shutter is "Take photo" / "Ta bilde" (`common.takePhoto`) with `accessibilityState.disabled` when disabled. Tray thumbs are labelled with the piece name. Sample points are labelled with the sampled colour name. The draw box is "Selection box". The guide pill is announced per the shared rule, only when the guide state changes and at most once every 2 s. Gesture-only actions have VoiceOver equivalents as `accessibilityActions`: "Select piece" on the photo (replaces hold to select), "Move" and "Resize" on the draw box, "Move" on each sample point (stepping by a fixed amount), next to the existing Smaller and Larger controls.

---

## Screen recipes

These are the fixed orders that make screens consistent. Flow docs fill them in.

| Screen type | Order |
|---|---|
| Tab root | `Screen large` / optional `Banner` / hero (`ChipRow` filters plus `Tile` grid on Closet, `Row` list on Looks) / `Section`s |
| Today | `Screen large` / context `ChipRow` (control chips) / optional `Banner` / `FlatLay` hero / Change strip `Expander` (when open) / title / reason line / check card `Expander` / quiet row / Undo slot / one `Section` / Apple Weather link (while a forecast is shown) / `Footer`. Today shows one Section at most: "Start with", holding saved-look `Row`s first, then the start chips (Hijab, Knit, A piece), with a single "Show all" |
| Detail (piece, look) | `Screen` with Edit or nothing, `title` passed for VoiceOver and the back menu, no visible bar title / optional `Banner` (sentence only when a Section action already repairs it; on a look it sits under the meta line instead, so visual and reading order match) / hero (`Tile` photo full width for a piece, `FlatLay` for a look) / `title` / meta line / `Section`s of `Row`s and fact `Chip`s / `Footer` with the one primary. When the push ends, `setAccessibilityFocus` goes to the `title`, so VoiceOver starts on the name, not on Back (piece and look). Look only: a `control` ChipRow (Rename, Worn, Plan) under the meta line, and `Button destructive` Remove look last in the scroll, because a look has no editor with a scroll end |
| Editor (new piece, edit piece, build look, Your style, Adjust, answer) | `Screen leading="cancel"` / content in `Section`s / `Footer` primary (Save, Add to closet, Find outfits) |
| Media (scan, cut-out) | `Screen media` / `CameraFrame` / `Footer` |
| Selfie | `Screen` on `canvas`, scrolling / `CameraFrame` (first scroll child, `ink` inside `radius.lg`) / content / `Footer` on the result only |

**Today action area.**

- Everyday and occasion: `Footer` primary "Wear this", nothing else. Hijabs are compared by tapping the hijab in the FlatLay, which opens the hijab Change strip.
- The quiet row scrolls with the content, directly under the reason line. It is never pinned. Three `quiet` Buttons, labels only: Another, Save look, Not for me, in equal thirds with `space.sm` side padding. Every label the row can show is measured in a hidden layer before it is shown (as Footer > Anatomy). At `large`, or when a label would wrap, it is the stacked quiet row from its first frame: the three quiet Buttons full width, labels leading-aligned in `plum`. Same layout in English and bokmål.
- Planning a day: "Wear this" is not rendered. `Footer` primary is "Save look", nothing else. The quiet row holds Another and Not for me only (halves at standard sizes, stacked at `large`). "Back to today" with an unsaved plan asks `today.savePlanTitle` in the planning Banner: its text and action row crossfade to the question with Save look and Discard, focus on the question.
- Undo: after Wear this the Footer becomes a `ResultBar`. Every other outfit change (Another, Show on Today, Fill the gap, a Change strip pick, a Not for me reason) undoes from the one Undo slot under the quiet row: "Changed" or "Noted for next time" with Undo. The slot's height is reserved from the first frame (measured in a hidden layer at the current text size and language) and its content only crossfades; empty, it is hidden from VoiceOver. Save look crossfades to "Open look" and needs no Undo. One ResultBar per screen.

## Review log

- **Today Sections merged, not moved.** Owner decision 4 keeps the Knit start chip on Today, so "Start with" stays and absorbs "From your looks" as one Section instead of moving to the Change strip or Closet.
- **`plumGround` kept next to `plum`.** It is sampled from `icon.png` so the splash tile matches the app icon; it is never used in UI.
- **"Compare hijabs" restored** as the Footer secondary, matching `architecture.md` row 81, instead of asking the owner to drop it. Superseded by `flows/F06-today.md`: it opened the same strip as tapping the hijab, so the Footer holds Wear this alone.
- **Mockup review, 3 Oct.** Chips on `canvas` that are not `choice` now draw their 1 pt `lineField` edge in the mockup, and Expander chips their `surface` recipe, matching Chip > Anatomy. The selected tab rule and the Today hero cap above were added from the same review.
