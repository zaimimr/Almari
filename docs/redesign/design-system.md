# Almari design system

Date: 2026-10-03. Phase 2a output (plan Task 3). Sources: `src/ui/`, `src/features/`, `src/navigation/`, the ad-hoc styles in `app/`, the logo `assets/brand/icon.png`, `docs/redesign/architecture.md` (owner decisions apply) and the before screenshots in `docs/redesign/screens/before/`.

Motion durations, easing and the magic-moment choreography live in `docs/redesign/motion.md`. This file names which motion each component uses, never the numbers. The before-screen findings and the file and line references to the current code live in `docs/redesign/migration.md`.

## Principles

- **The garment is the colour.** The canvas is white and the chrome stays quiet, so a dusty-rose hijab next to a sage kurta reads true. Plum is for actions, blush for small marks, nothing else is coloured. Piece images, the FlatLay, swatches and the camera view set `accessibilityIgnoresInvertColors`, so Smart Invert never changes a garment.
- **Two shapes.** Anything you press is a capsule (buttons, chips, segments). Anything you look at is a continuous-corner rectangle (photos, cards, fields).
- **One fill for grouped content.** Grouped content sits on `surface`. No borders around cards, no shadows on chrome. The only shadow in the app belongs to cut-out garments, so they lie on the canvas like fabric on a table.
- **Native first.** Native large titles, native back chevron, native tab bar, native header items in system glass, system alerts for destructive confirms. Custom components only where iOS has nothing that fits.
- **Silk, not spring.** Every state change eases and settles (see `motion.md`). No bounce, no overshoot, no spinners.
- **Nothing moves unless the user caused it, and then it only settles.** The one exception is the splash error: the tile settles once from the splash rect into the centred block (Screen recipes > Splash error). Controls appear and leave in place. Nothing scales up or flies. No footer slides in, no sheet floats, no content jumps when something opens.
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
| `inkMuted` | `#706963` | Secondary values, meta line, segmented thumb edge, unselected outfit icon buttons | 5.40 on canvas, 4.64 on sunken. Never on `blush` (2.85) |
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
| `blushStrong` | `#9A5A52` | Non-text blush marks that must show on white: the selected edge (chip, disc, day), session dot | 5.31 on canvas, 5.05 on surface, 4.56 on sunken |
| `error` | `#96354A` | Error text, error field border, destructive label | 7.23 on canvas, 6.88 on surface, 6.21 on sunken |
| `scrim` | `rgba(50,46,40,0.55)` | Dimming the photo behind a selected piece (single-photo select, cut-out editor). Never under text | - |
| `scrimPill` | `rgba(50,46,40,0.70)` | The only ground for `onMedia` text on a live photo: guide pill, readout | onMedia 5.15 worst case (over white) |
| `onMedia` | `#FFFFFF` | Text, icons, outlines and shutter ring on the `media` ground or on a photo | 13.49 on `ink` |

Rules:

- **Plum** means "do something": primary fill, quiet actions, header and tab tint, focus, progress (the selfie hold arc included), the needs-an-answer dot (answering is something to do) and the hijab swap mark on the Today flat lay (FlatLay > Hijab swap mark). Nothing else is plum. Plum text never sits inline inside `ink` text (1.96:1, colour alone would mark it): a link is always a standalone quiet Button.
- **Blush** means "this one" and stays small. It never fills a banner, a track or a large area, and it is never a text colour (1.89:1 on white). The closed list of blush uses: the selected choice chip (fill, `blushStrong` edge), the selected tile and `ChoiceCard` disc, the selected day in `MonthGrid` (disc, `blushStrong` edge), the mark capsule (planned day only), the session dot (`blushStrong`), the Closet More chip while a panel filter is set (the selected capsule recipe, Chip > `control`) and the found outline on camera. Anything else is not blush. Kept is the selected Keep Chip in the Change strip, not a mark. There is no New mark: the Closet "N added" Banner says it.
- **Selected, one recipe.** Capsules (choice chips): `blush` fill and a 2 pt `blushStrong` border. The border is always present and transparent when unselected, so the chip keeps its width. Days (`MonthGrid`): the capsule form as a 28 pt disc, `blush` fill and the same 2 pt `blushStrong` edge. Rectangles (tiles and `ChoiceCard`s): a 22 pt `blush` disc top right with the same 2 pt `blushStrong` edge and an `ink` `checkmark` (7.12), as in iOS Photos, and no ring, so the cut-out and the art stay unframed. Icon buttons: the filled symbol in `ink`, no disc; filled means on or saved (Like carries `selected`, Save look carries no selected state, Button > Icon variant). Rows: a trailing `ink` `checkmark`. Each carries `accessibilityState.selected` (or `checked`, see Chip). `Segmented` is a value, not a selection set: its thumb shows position, not blush.
- **Needs an answer, one recipe.** One 8 pt `plum` dot before the label (6.56 on surface, 5.92 on sunken, 6.89 on canvas), nothing else: no extra text, no dashed edge, no "?". VoiceOver carries the words ("Needs an answer" / "Trenger svar"). Used by the Expander `attention` tone, the fact Chip `tentative` and the Tile `needsAnswers` state. The dot scales by `symbolScale`.
- **Camera and photo.** A live photo is never treated as a dark ground. `onMedia` text on a photo sits only on `scrimPill`. Every outline and sample ring on a photo gets a 1 pt solid `ink` halo underneath (blush on ink 7.12, onMedia on ink 13.49), so it reads on white garments as well as dark ones. Blush on camera marks a found piece; there blush is a line, not a fill.
- **Media rule.** `Screen media` has an `ink` ground, and plum never sits on it (1.96). On a media screen the header tint, `quiet` Button labels and icons, and `EmptyState` title and line all use `onMedia` (13.49). So do `Row` titles and the trailing `checkmark` (the `large` Row lists of cut-out editor and scan controls); those Rows press to `plumPressed` (8.75). A quiet Button there presses to `plumPressed` (onMedia 8.75). `Segmented` and `Chip`s keep their own light fills on media with `ink` labels (11.59 on `sunken`, 13.49 on the `canvas` thumb, 7.12 on a `blush` selected chip), thumb edge `inkMuted` (4.64), and the `sunken` fill reads on the `ink` ground (11.59). Only text, quiet Buttons and Rows drawn straight on the `ink` ground use `onMedia`. The `secondary` Button keeps its `plumSoft` fill with a `plum` label (6.02) and presses to `plumSoftPressed` (5.20). The `primary` Button there (Footer, or an EmptyState action on a screen with no Footer) takes the media variant: `onMedia` fill (13.49 on ink) with a `plum` label (6.89), pressed `plumSoft` (plum 6.02), so it stays the one filled capsule. A `Row` there (Segmented at `large`) has `onMedia` title and checkmark (13.49), presses to `plumPressed` (onMedia 8.75) and has no separators. `Screen`, `Button`, `Row`, `Segmented`, `EmptyState` and `CameraFrame` point here.
- **Dashes** mean empty or not yet: the empty slot in a flat lay and the searching outline on camera. Nothing else is dashed.
- There is no success green. Confirmations are ink text with a plum `checkmark` symbol.
- **Disabled** is never shown by opacity alone: `inkDisabled` text on `sunken`, plus `accessibilityState.disabled`. An action that does not exist yet is not rendered (see Footer > Waiting); an editor's commit is always rendered, disabled until it can act (see Footer > Disabled).
- **In-flight writes.** A control waiting on a write sets `accessibilityState.disabled` or `busy` at once, but shows the disabled or busy look only if the write is still running after motion `wait`. A fast local save never blinks grey and the band never flashes. This applies to Chip, Segmented, Row toggles and Button `busy`.
- **Increase Contrast.** When `AccessibilityInfo.isDarkerSystemColorsEnabled()` is true (listen to `darkerSystemColorsChanged`), `theme.ts` swaps `inkMuted` to `ink` and `line` to `lineField`. A `Silk` placeholder gets a 1 pt `lineField` edge. `inkDisabled` and `placeholder` are not swapped, so a disabled control still differs from an enabled one and a placeholder never looks typed.

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

- One hook, `useLargeText()`, reads `fontScale` and returns `{ large: fontScale >= 1.35, ax: fontScale >= 1.6, bold, symbolScale: Math.min(fontScale, 2) }`. Every threshold in this file uses it. 1.35 is iOS xxxLarge, the last standard size. 1.6 sits between xxxLarge and AX1 (Accessibility Medium, fontScale 1.786), so `ax` is on at every accessibility size. AX5 (fontScale 3.571, `body` about 61 pt) is the size Lane 1 tests every screen at, with AX3 (fontScale 2.643, `body` about 45 pt) as a second pass (F12 L).
- System text scales without a cap. Georgia `title` caps at 2.0x (52 pt), past which serif display text pushes the outfit off screen. `mark` caps at 1.4x because it sits on a photo, and at `ax` no `mark` text stays on a photo (see below and CameraFrame).
- The Large Content Viewer is on for native bar items (icon header items, tab bar items) and for `Button icon` (`accessibilityShowsLargeContentViewer`). Capped `title` and `mark` text is handled by the `ax` moves instead: at `ax` the Tile mark leaves the photo and becomes the first item of the line under it, as uncapped `subhead` `ink` in its `blush` capsule, and the CameraFrame guide and readout leave the photo for the controls area under the frame.
- The native large title: react-native-screens builds a fixed-size font when only `fontFamily` is set, so `src/navigation/options.ts` sets `headerLargeTitleStyle` to `{ fontFamily: bold ? "Georgia-Bold" : "Georgia", fontSize: 34 * Math.min(fontScale, 1.76) }` on tab roots (60 pt at most, Apple's Large Title at AX5) and updates it when `fontScale` or Bold Text changes. The native header takes no letter spacing, so the large title draws at tracking 0, not the type table's -0.4. The native large title truncates instead of wrapping, so Lane 1 checks on a device that I dag, Garderobe and Samling fit at 60 pt on a 375 pt wide phone.
- At `large`: button pairs stack vertically, Row trailing values and Expander values move under the title, Segmented becomes a vertical list of Rows, header text items become icons with the label in VoiceOver and the Large Content Viewer, and `numberOfLines` is dropped from the Tile label.
- At `ax`: Tile grids go from 2 columns to 1, the Change strip becomes a list of `Row`s, and `ChipRow` `scroll` becomes `wrap`, except the Closet filter row and the Closet panel group lines, which stay one scroll line (`flows/F04-closet.md` > States > Largest text).
- Inline symbols, swatches, the needs-an-answer dot, chip chevrons and checkmarks, the Tile and `ChoiceCard` selected disc and its edge, the `MonthGrid` today circle and selected disc, and the hijab swap mark scale by `symbolScale`.
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
| `swatch` | 14 | Colour dot, with a 1 pt `lineField` inner edge (3.34 on canvas, 3.18 on surface) so white and ivory swatches show. Inside a chip the edge is 1 pt `ink` (11.59 on sunken, 7.12 on blush) |
| `swatchLarge` | 44 | The palette swatch in `Swatches` (selfie result). Same edge as `swatch`. Six fit one line on a 375 pt phone (6 x 44 + 5 x 12 = 324) |
| `faceCircle` | 264 | Selfie circle diameter at most (the ring adds 10 pt per side); circle and ring together never take more than 40 percent of the safe-area height, so the feedback line and the library button stay in the first viewport |
| `brandMark` | 96 | The still mark on its tile in `EmptyState` (Closet empty, Today first run, onboarding done). The splash keeps its native 160 pt rect |

Control tokens are `minHeight`, never `height`. Controls keep their vertical padding and grow with their line height. `icon.*`, `swatch` and `swatchLarge` scale by `symbolScale`. Icons are SF Symbols through `expo-symbols`, weight medium, scale medium.

### Haptics

`motion.md` > Haptics owns every haptic. A `ResultBar` never fires one: the action that caused it does.

### Reduce Motion

One hook, `useReduceMotion()`, reads `AccessibilityInfo.isReduceMotionEnabled()` and listens to `reduceMotionChanged`, so a change in Settings applies without a restart. Reanimated's `useReducedMotion()` reads once and is not used. Every Reduce Motion fallback lives in `motion.md` only (Named motions, Transitions and each Magic moment). This file does not restate them.

`CutoutEditorView.swift` reads `UIAccessibility.isReduceMotionEnabled` and observes its change notification itself, because the hook does not reach native code.

### Accessibility rules shared by every component

- **Announcements.** `accessibilityLiveRegion` is Android-only and `accessibilityRole="alert"` does not announce on appear on iOS. Every announced text (Banner, ResultBar, Field and Text errors, the guide pill, the Footer primary) calls `AccessibilityInfo.announceForAccessibilityWithOptions(text, { queue: true })` only when the text appears or changes after the screen has rendered. Live camera guides (scan pill, selfie feedback line) are the one exception: `{ queue: false }`, so a stale guide never plays after a capture (CameraFrame). Never on initial mount: a session Banner already there when Today opens is read in normal order, not announced. When focus moves to a text, that text is not also announced, so VoiceOver reads it once. The Footer primary is announced only the first time it becomes usable per visit to the screen.
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
    blush: "#E2B1A8", blushStrong: "#9A5A52",
    error: "#96354A",
    scrim: "rgba(50,46,40,0.55)", scrimPill: "rgba(50,46,40,0.70)", onMedia: "#FFFFFF",
  },
  colorsIncreasedContrast: { inkMuted: "#322E28", line: "#948B85" },
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

`Text` is the primitive (0), and twenty components sit on it, one way to do each job. Every screen in `docs/redesign/flows/*.md` is built only from these plus native navigation. A pattern not listed here is not allowed, and a flow that needs one asks the UI designer first.

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
| 16 | `Silk` | Loading, generating, busy and progress toward a total |
| 17 | `CameraFrame` | The media frame (scan, cut-out canvas) and the selfie face circle |
| 18 | `ChoiceCard` and `ChoiceCardGroup` | Illustrated answers: coverage, everyday style, fit, hijab styles |
| 19 | `Swatches` | A colour palette to look at: best shades, go easy on |
| 20 | `MonthGrid` | The wear calendar month |

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
| `progress` | `{ step, total }` | Onboarding only: 2 pt plum track under the header bar, hidden from VoiceOver (`accessibilityElementsHidden`, `importantForAccessibility="no-hide-descendants"`). The step title is `accessibilityRole="header"` and carries "Step 2 of 6" / "Steg 2 av 6" as its `accessibilityValue` |
| `scroll` | boolean, default true | `false` for builder, camera and canvas screens that lay out to the full height |
| `gone` | `{ title }` | Renders `EmptyState` with "Go back" (pops) under the same header |
| `media` | boolean | `ink` ground for `CameraFrame` screens, header background `ink`, light status bar, header tint and title colour `onMedia` (`headerTitleStyle` as well as the tint, 13.49). Children follow the media rule (Colour > Rules) |

**States.** Default; loading (children render `Silk` placeholders, header and footer are already present so nothing jumps); gone; keyboard open (footer rides the keyboard, scroll insets adjust automatically; exception: during an in-place title rename the Footer stays at the bottom under the keyboard, because Done or dragging the keyboard down commits, see `flows/F09-looks.md` 2a).

**Anatomy.** Native stack header (glass items, `plum` tint, or `onMedia` on `media`, no shadow, `canvas` background, `ink` on `media` with an `onMedia` title) / `ScrollView` with `contentInsetAdjustmentBehavior="automatic"`, `keyboardShouldPersistTaps="handled"`, `keyboardDismissMode="on-drag"`, horizontal padding `gutter`, top `space.sm`, bottom inset = measured Footer height + `space.footerInset` (just `space.footerInset` on a screen with no Footer) / `Footer`, a flex sibling under the ScrollView, never absolutely positioned. No max width.

No intro sentence under any title.

---

### 2. HeaderItem

**Purpose.** One header action. It is a native header item, so iOS draws it in system glass and the Large Content Viewer works.

**Props.** `icon?: SFSymbol`, `label: string` (always required, used as the VoiceOver label for icon items), `onPress`, `kind: "icon" | "text"` (derived: `icon` present means icon), `disabled?: boolean`.

**Rules.**

- An icon is used for going somewhere or creating: `plus` (Add pieces, New look), `person.crop.circle` (Profile), `lightbulb` (Tips), and the scan camera action `camera.rotate` (Switch camera).
- Text is used for changing mode: Edit, Select, Done, Cancel. Commits never live in the header: they use the Footer.
- There are no header menus. Closet select keeps its actions in the Footer (F04).
- At most two on the right, one on the left. Text items keep `maxFontSizeMultiplier` 1.3 and become icon plus VoiceOver and Large Content Viewer label at `large` (`pencil` Edit, `checklist` Select, `checkmark` Done, `xmark` Cancel).

**States.** Default, pressed (system).

**Anatomy.** Native `headerRight`/`headerLeft` item, the Screen's tint, 44 pt hit area.

---

### 3. Footer

**Purpose.** The pinned home of the one primary action on any screen that commits something.

**Props.** `primary?: ButtonProps` (absent only in Waiting), `secondary?: ButtonProps` (one at most), `waiting?: boolean`, `error?: string`, `children?` (only `ResultBar`, which replaces the buttons in place), `actions?` (Closet select only: a row of `quiet` small Buttons above the buttons).

**States.**

- Waiting: only where the action does not exist yet (Today before an outfit). The primary is rendered at opacity 0 with `pointerEvents="none"`, `accessibilityElementsHidden` and `importantForAccessibility="no-hide-descendants"` (RN still hit-tests opacity 0 views; every control hidden in place follows this until it is shown), so the reserved height is measured at the current text size and for the bokmål label. No reason text.
- Disabled: on Editor screens (new piece, edit piece, build look, Your style, Adjust, answer) the primary is rendered from the first frame with the disabled look (`inkDisabled` label on `sunken`, `accessibilityState.disabled`) until it can act, then takes the `plum` fill with the selection crossfade. The commit point is always visible and nothing appears. Closet select does the same: its action row and pair are laid out disabled from entry until the first tile is selected.
- Shown: from Waiting, the primary fades in place (`base`, `silk`) with no change in height or position. It never slides or expands. Focus does not move to it; it is announced per the shared rule.
- Busy: the primary shows `Silk` busy and the secondary stays enabled. Exception, corrupting writes: when both buttons commit the same record (onboarding done: Add pieces and Try the sample closet), the one not busy is disabled, because a second commit would corrupt the write.
- Result: a `ResultBar` sits where the buttons were.
- Error: `error` is drawn inside the Footer above the buttons as `footnote` `error`, announced (shared rule). The Footer grows upward, so the buttons do not move. It clears on the next press. Every Footer commit error uses this slot (F02, F05, F06, F09).

**Anatomy.** A flex sibling under the ScrollView, never absolutely positioned. `Screen` measures it with `onLayout` and sets the ScrollView bottom inset to that height plus `space.footerInset`, so the last block is never behind it. `canvas` background (`ink` on `media`), `line` hairline on the top edge only when content scrolls under it, padding `space.md` vertical and `gutter` horizontal, bottom safe area. Buttons are `control.regular`. A lone primary is full width. A pair sits side by side, secondary left, and stacks (secondary above) when either label wraps or at `large`. Both labels are measured in a hidden layer before the pair is shown (as `motion.md` > Banners and bars), so the pair never paints side by side and then stacks. At `ax` only the primary stays pinned; the secondary becomes a quiet Button at the end of the scroll content. Exception, Closet select: at `ax` its action row stays pinned and the secondary becomes the last Button of that row, because the end of its scroll content is a 1-column grid of every piece. The Footer is last in reading order.

**Action row (Closet select).** One line above the pair at every size: a horizontal scroll of `quiet` small Buttons from the leading `gutter` to the screen edge, each label wrapping inside a `maxWidth` of the Footer's inner width. Its `minHeight` is measured in the hidden layer at the current size and language. A ResultBar, an error and the Mark as worn `action` chips take this row's place at that height, with a crossfade; the pair never moves.

---

### 4. Button

**Purpose.** Every action that is not selecting a chip, row or tile.

**Props.** `label`, `onPress`, `variant: "primary" | "secondary" | "quiet" | "destructive" | "icon"`, `size: "regular" | "small"` (default `regular` in `Footer`, `small` elsewhere), `icon?: SFSymbol` (quiet: leading; `icon` variant: the whole button), `selected?` (`icon` variant only), `selectedIcon?: SFSymbol` (the filled form), `busy?`, `busyLabel?` (VoiceOver only), `disabled?`, `accessibilityLabel?`.

| Variant | Fill | Pressed fill | Label | Where |
|---|---|---|---|---|
| `primary` | `plum` | `plumPressed` (onPlum 8.75) | `onPlum` `headline` | Footer, and the EmptyState action on a screen with no Footer. One per screen |
| `secondary` | `plumSoft`; `plumSoftPressed` inside `surface` containers (1.26 on surface, plum 5.20) | `plumSoftPressed` (plum 5.20); `plumSoftDeep` inside `surface` containers (plum 4.71) | `plum` `headline` | The Footer's second action; Banner and Expander actions |
| `quiet` | none | `sunken` (plum 5.92) | `plum` `headline`, optional `icon.bar` symbol | Today quiet row, Undo, "Go back", links, "Show all", "Show all hijabs" |
| `destructive` | none | `sunken` (error 6.21) | `error` `headline` | Remove piece, Remove look, Delete all data, always followed by a system alert |
| `icon` | none | `sunken` 32 pt disc (inkMuted 4.64, ink 11.59) | No visible label. `icon.bar` outline symbol in `inkMuted` (5.40); selected: `selectedIcon` in `ink` (13.49) | The outfit card on Today: Like (`hand.thumbsup`, `.fill`), Not for me (`hand.thumbsdown`, `.fill`), Save look (`bookmark`, `.fill`). `MonthGrid` previous and next month (`chevron.left`, `chevron.right`, never selected). Nowhere else |

On `Screen media`, and on anything inside a `CameraFrame`'s `ink` frame on a canvas screen, the media rule applies: `quiet` labels and icons are `onMedia` and press to `plumPressed`; `primary` is the media variant, `onMedia` fill with a `plum` label (6.89), pressed `plumSoft` (plum 6.02).

**States.** Default; pressed (the variant's pressed fill, motion `press`; no opacity change); busy (`Silk` busy sweep across the fill, label unchanged and not dimmed, `accessibilityState.busy`, look delayed per the in-flight rule). Disabled (`inkDisabled` label on `sunken`, `accessibilityState.disabled`): only an editor's Footer primary, the Closet select Footer (action row and pair) before the first tile, and a control waiting on a write. Anywhere else an action that cannot be used yet is not rendered; where it can appear later, its row reserves the height (see Expander).

**Anatomy.** Capsule (`radius.full`), `minHeight` `control.regular` 52 or `control.small` 44, vertical padding `space.md`, horizontal padding `space.lg`, label centred and wrapping (never truncates).

**Icon variant.** A square target of max(44, scaled disc + 12) pt holding the 32 pt pressed disc and the symbol, both scaled by `symbolScale`. Unselected and selected differ by shape (outline against filled symbol) and colour (`inkMuted` against `ink`), never by colour alone. The outfit rating icons are not `plum`: plum stays for Another, the Undo slot and the swap mark, so the outfit block is not a row of plum marks. `label` is the VoiceOver label and the Large Content Viewer text (`accessibilityShowsLargeContentViewer`). Like is a toggle and sets `accessibilityState.selected`; the filled `ink` symbol means on or saved. Not for me opens something in place, sets `accessibilityState.expanded` on the trigger that opened it and is never drawn selected. Save look saves at once and fills; its label becomes `today.openLook` with value `result.saved`, no selected state, and a press pushes the look. It never removes the look (Remove look lives on look detail) and the Undo slot is untouched (`flows/F06-today.md` S1 > Save look). Selection crossfades the outline and filled symbols (motion `press` timings), no scale. Icon buttons sit in a group of at most three, `space.sm` apart, so two opposite actions (thumbs up, thumbs down) are not one slip apart. An icon-only action anywhere else is a `HeaderItem`.

---

### 5. Section

**Purpose.** Group related content under one short title.

**Props.** `title?: string`, `count?: number` (Closet category sections only), `action?: { label, onPress }` (one action on the title line, for example "Show all"), `children`.

**States.** Default only. A section with no content is not rendered, and its empty state belongs to the screen.

**Anatomy.** Title in `headline` `ink`, `accessibilityRole="header"`, followed on the same line by the count in `headline` `inkMuted` after `space.sm` ("Tops 12"), so the number is quieter than the name but the same size, with the action as `Button quiet small` at the trailing end. Title and count are drawn from `closet.section` ("Tops 12") and are one header element read as `closet.sectionLabel` ("Tops, 12 pieces" / "Topper, 12 plagg"). At `large` the action wraps under the title, leading-aligned. The count is a value, never a badge, capsule or colour mark, and the header is never sticky. / `space.md` / children with `space.lg` between blocks. Sections are separated by `space.xxl` and no rules or dividers. There is no caption slot.

---

### 6. Row

**Purpose.** A list item that shows one thing and leads somewhere, changes one setting, or is a static list item (no `onPress`, a plain text element with no button trait). It covers settings, look lists, saved-look suggestions, "Used in", profile stats, the scanned-piece review, the selfie tips and the Change strip at `ax`.

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
| `choice` | Unselected `sunken` fill, transparent 2 pt border, `ink` `subhead`. Selected per the selected recipe: `blush` fill, 2 pt `blushStrong` border, same label weight, no glyph, so the chip keeps its width | Toggles, no haptic (`motion.md` > Haptics). Single select: `radio` plus `accessibilityState.selected`, `radiogroup` on the row (device check in the shared rules). Multi: `checkbox` plus `accessibilityState.checked`. Optional single choice (Closet panel, a second tap clears): `button` plus `accessibilityState.selected`, no hint |
| `control` | `sunken` fill, `ink` label, trailing 13 pt `inkMuted` `chevron.down` when it opens an Expander, `chevron.right` when it pushes a screen, no glyph when it starts an in-place edit | Today occasion, style, weather; Closet More; look detail Worn, Plan and Rename (Rename opens the title Field in place); Profile quick add chips (`chevron.right`). `button`; `accessibilityState.expanded` tied to its Expander when it opens one. Closet More is the one control chip that can look selected: while any filter in its panel is set it takes the selected recipe (`blush` fill, `blushStrong` edge, chevron in `ink`), so set filters show with the panel closed. Its label is always "More" (`closet.more`), so its width never changes and the chips after it never shift. The set filters are its `accessibilityValue`, joined with `Intl.ListFormat` `{ type: "unit", style: "short" }` ("Modest, Summer", no "and"; fallback a plain ", " join pending the Lane 1 Hermes check) |
| `action` | `sunken` fill, `ink` label, no glyph, never selected | A commit chip: one tap writes at once (Today and Yesterday in the look detail Worn body). `button`, no selected state, `press` only, no haptic. The result shows elsewhere (a ResultBar in the same body, the meta line), never as a blush flash on the chip |
| `fact` | `sunken` fill, key "Colour" in `placeholder` then value in `ink`, trailing 13 pt `inkMuted` `chevron.down`. `tentative`: the needs-an-answer dot before the label, nothing else | Opens its `Expander` with choices; a pick writes at once and closes it. Reads "Colour: sage, suggested" / "Farge: salvie, foreslått" |

**ChipRow props.** `label?` (rendered as a `Section`-style `headline`, or omitted when the Section already names it), `options`, `value` (single id, id array for multi, or null), `onChange`, `layout: "wrap" | "scroll"` (default `wrap`; `scroll` only for Closet and builder category filters and the Closet panel group lines, leading edge on `gutter`, content running to the screen edge; becomes `wrap` at `ax`, except in Closet, where each chip sets `maxWidth` in points to the ScrollView's width, since `"100%"` resolves against the unbounded content width), `multi?`.

**States.** Default, pressed (motion `press`), selected, disabled (`inkDisabled` on `sunken`, `accessibilityState.disabled`, only while a write is in flight, per the in-flight rule), tentative (fact), busy (`accessibilityState.busy` while the work it started runs, look unchanged; the `Silk` region the work happens in carries the VoiceOver label, for example Clean background with `photo.cleanMaking`).

**Anatomy.** Inside a `surface` container (an Expander body) unselected chips get a 1 pt `lineField` edge (3.18 on surface), because `sunken` on `surface` is 1.11; the selected `blushStrong` edge is 5.05 on surface and 1.59 against `lineField`, so selected and unselected differ by more than edge width. On `canvas`, `action`, `control` and `fact` chips get the same edge (3.34 on canvas), because `sunken` on `canvas` is 1.16 and a chip with no glyph would read as a plain word. Unselected `choice` chips on `canvas` draw the same 1 pt `lineField` edge inside their transparent 2 pt border, so the width still never changes (onboarding steps, where the chip row is the whole control); the selected `blushStrong` edge (5.31 on canvas, 1.59 against `lineField`) differs from it by lightness, fill and width, not hue alone. Capsule (`radius.full`), switching to `radius.md` once the label wraps to a second line, `minHeight` `control.small` 44, `maxWidth: "100%"`; a chip with no drawn label (the swatch-only colour chip in the Closet panel) also takes `minWidth` `control.small` (44), content centred. Vertical padding `space.sm`, horizontal padding `space.lg`, gap `space.sm`. The label wraps inside the capsule, so a chip never runs off screen. Chevron scales by `symbolScale`. A selected chip that carries a chevron (the chosen date in Adjust When, which reopens the date Expander) draws it in `ink` (7.12 on `blush`); `inkMuted` is never drawn on `blush` (2.85).

---

### 8. Segmented

**Purpose.** Choose exactly one of two or three fixed, short options that always has a value. Rule: two or three options and a required value means `Segmented`; anything else is a `ChipRow`. Exception: a fact `Expander` body (piece detail, capture confirm) always uses a `ChipRow`, whatever the option count, so every fact edits the same way.

Used for, outside fact Expanders: Style in Adjust (`style.*`, the filter words, as the Today style chip; her answer uses the `onboarding.style.*` card words, `copy.md` > Cards and chips); Your day (Mostly indoors, Time outside); Warmth (Light, Medium, Warm); Rain and Snow (Yes, No); Closet in Adjust (Sample closet, My clothes); Units (cm and °C, ft and °F).

**Props.** `label?`, `options` (2 or 3), `value`, `onChange`, `disabled?`.

**States.** Default, pressed, selected, disabled (in-flight write, per the in-flight rule, `accessibilityState.disabled`), `large` (a vertical list of `Row`s with a trailing `checkmark` on the chosen one; the list keeps `radiogroup` and each Row keeps `radio` plus `accessibilityState.selected`; on `Screen media` the Rows follow the media rule: `onMedia` title and checkmark, pressed `plumPressed`, no separators).

**Anatomy.** Track: capsule, `sunken` fill, `minHeight` 44, 2 pt inset. The inset is visual only: each segment's Pressable fills the full 44 pt track height. Thumb: capsule, `canvas` fill with a 1 pt `inkMuted` edge (4.64 on sunken), slides between segments with the settle motion. The thumb alone marks the choice, as in native iOS segments; no checkmark. Labels are `subhead` `ink` at one weight, horizontal padding `space.md` per segment. Segments share width equally, and when a bokmål label would wrap ("Eksempelgarderobe" / "Mine klær") the control switches to the vertical list instead of truncating. On `Screen media` it never becomes a list: each Segmented takes its own full-width line, and at `large`, or when a label would wrap, each segment shows its option's symbol (scaled by `symbolScale`) with the word as `accessibilityLabel` (cut-out editor: `paintbrush`, `eraser`, three `circle.fill` sizes). `accessibilityRole="radiogroup"` on the track, `radio` plus `accessibilityState.selected` on each segment (device check in the shared rules). Native `UISegmentedControl` is not used because it does not scale with Dynamic Type.

---

### 9. Field

**Purpose.** Text entry: piece name, look name, place search, rename in place. Closet search is the native header search bar.

**Props.** `label` (visible `headline` above; hidden, as placeholder and VoiceOver label only, for search, whenever the Field is the only control in a titled Section, and for rename in place), `value`, `onChangeText`, `kind: "text" | "search"`, `error?: string`, plus `TextInputProps`.

**States.** Default (`surface` fill, 1 pt `lineField` edge), focused (1.5 pt `plum` edge), error (1.5 pt `error` edge and `footnote` `error` text directly under, announced per the shared rule; while it shows, the input's `accessibilityLabel` is "{label}, {error}" and the Text under it is hidden from VoiceOver, because a TextInput does not read a sibling Text and a hint can be switched off), disabled (`sunken` fill, `inkDisabled` text, `accessibilityState.disabled`), filled-search (trailing `xmark.circle.fill` clear, 44 pt target).

**Anatomy.** Label / `space.sm` / input (`minHeight` `control.regular` 52, vertical padding `space.md`, grows with its line height, `radius.md`, padding `space.md` horizontal, `body` `ink`, `selectionColor` plum, placeholder in `placeholder`). The search kind has a leading `magnifyingglass` `icon.inline` `inkMuted`. Placeholders are short nouns ("Search"), not examples. Rename in place (look title) uses the `title` role at the title's size and line height, no fill and no box, only the caret and a 1 pt `lineField` underline inside the title's bottom padding, so nothing moves when it opens.

**Location search.** On the onboarding place step and its Profile answer screen both choices sit in content under the title, never in the Footer, both there from the first frame: `Button secondary` "Use my location" (`place.useLocation`), then the search `Field`, with "Search for your city" (`place.search`) as its placeholder and `accessibilityLabel`. One message slot sits directly under the Field: `place.locationOff` with `common.openSettings`, `place.notFound`, `onboarding.city.notFound` or `common.offline`, one at a time, so nothing ever shows between the two choices. "Use my location" goes busy while it finds the city and the Field shows the wait (`motion.md` > Loading). Both paths write the found city into the Field with a trailing `plum` `checkmark` (the confirmation rule), hidden from VoiceOver, no keyboard, the city announced once, queued. The check takes the clear button's 44 pt slot until the text is edited; then the check goes and the clear button returns, so the trailing slot and the VoiceOver order never change. Details in `flows/F01-start.md` > Step 8. The Footer is the normal step Footer, Next alone.

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
- Selected: the selected recipe, a 22 pt `blush` disc top right with its 2 pt `blushStrong` edge and an `ink` `checkmark` (the disc scales by `symbolScale`). The cut-out stays at `rest`.
- Queued (capture Waiting): `Silk` placeholder in the tile shape.
- Preparing: `Silk` sheen over the photo. The label block below is reserved from Queued on, sized for the tallest capture layout (a meta line plus a 44 pt line) and holding a `Silk` placeholder `text` shape, so resolve is opacity only (F02).
- Needs answers: the needs-an-answer dot before the label. No meta text, no swatch.
- Failed: `footnote` `error` meta, quiet "Try again" as its own 44 pt control below the photo's press area.
- Removed (capture only): the photo area stays empty at its size and the label block shows "Removed" (`subhead` `inkMuted`) with a quiet Undo. The slot leaves with List remove only while the screen is covered or once it scrolls out of view, never on a press (F02).
- Put away: photo at full strength, `meta` "Put away".

**Mark look.** One capsule: `blush` fill, `mark` `ink` text, the planned day in its short form ("Fri" / "fre."). The mark may wrap to 2 lines.

**Decoration cap.** At most one decoration on the photo (the planned mark or the selected disc, never both; selected wins) and at most one before the label (the needs-an-answer dot or the swatch; the dot wins). The swatch is 14 pt and always draws its 1 pt `lineField` edge; the dot is 8 pt and never has an edge, so a plum swatch never reads as the dot.

**Anatomy.** Cut-outs sit straight on `canvas` with `contentFit="contain"`; there is no bed at rest. Raw photos (a capture before its cut-out, photo variants) fill a `radius.md` frame. / `space.sm` / label line (optional dot, optional swatch, label) / meta. On a capture tile with `colour.onPress`, the colour line under the label is one control with a real `minHeight` 44 (not `hitSlop`), below the photo's press area, and opens the colour Expander.

**Accessibility.** One element. Label = name, colour, mark, state: "Sage kurta, green, Planned for Friday"; "Sage kurta, green, Put away"; "Sage kurta, green, Needs an answer". Preparing reads "Preparing photo" with `accessibilityState.busy`. The planned mark is spoken in full ("Planned for Friday"). In Closet the needs-an-answer dot of an owned piece reads `piece.needsDetails` ("Ivory blouse, ivory, Needs details"). Selected uses `accessibilityState.selected`. Inner controls are `accessibilityActions`: "Change colour", "Try again", "Put away".

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
- Hijab swap mark (Today hero only, always on): `arrow.2.squarepath` at `icon.inline` 17 pt in `plum` (6.89) on a 26 pt `canvas` disc, both scaled by min(`symbolScale`, 1.35), so the disc never hides most of a small hijab, no shadow (`elevation.flat`), at the top trailing corner of the hijab's frame and inside the hijab's own hit area. It is never its own button: a tap on it is a tap on the hijab, which opens the hijab Change strip. It stays while the strip is open and crossfades with the hijab in a swap. Hidden from VoiceOver; the hijab's hint says it (`change.hintHijab`, "Changes this hijab"). It is the only mark ever drawn on a flat lay.

**Anatomy.** A square viewport on `canvas` holding the arrangement from `arrangePieces`, unchanged, so storage, fixtures and tests keep their geometry. Each piece is a View around an `expo-image` in its frame, with `elevation.rest` at hero and row size and none at mini. Text never sits on top of the flat lay. Under it, in order: the title line, `space.sm`, the reason line. Checks become `Banner`s, never a list of sentences.

On Today the hero is centred and capped at 236 pt, with or without a Banner, so it never resizes (`motion.md` > Transitions, Banner arrives on Today). Budget on a 390 x 844 phone at default text size: 542 pt between the large title bar (47 + 96) and the Footer (76) above the tab bar (83). Top `space.sm` 8, context row 44, `space.lg` 16, hero, `space.lg` 16, a two-line title 64, `space.sm` 8, the two-line reason slot 36, `space.lg` 16, Another 44, `space.sm` 8, the one-line Undo slot 44: 304 pt plus the hero, so a 236 pt hero leaves 2 pt and the Undo line is in the first viewport. A one-line Banner with its action row and `space.lg` takes 128 pt, so the Undo line sits under the Footer edge; when a change fills it there, the scroll settles by the least distance that shows it whole (`motion.md` > Named motions > `scrollSettle`). A title or reason line past two lines does the same, as does any size from `large` up, and the Not for me Expander settles the scroll the same way when it opens below the Footer edge.

- **Title line.** `title` (outfit or look name, Georgia, `accessibilityRole="header"` in hero size) leading and wrapping, and on Today only the outfit actions trailing, top-aligned to the title's first line: Like, Not for me, Save look as `Button icon`, in that order, `space.sm` apart (3 x 44 + 2 x 8 = 148 pt, at default size only; the targets grow with `symbolScale`). Nothing else sits on the title line. The three move to their own line under the reason line, leading-aligned, in the same order, at `large`, and below `large` when the hidden layer finds the longest word a title can hold (the `outfitName.*` words and her look names) wider than the title column, measured on focus and on a fontScale or language change, never per outfit (`flows/F06-today.md` S1 item 6).
- **Reason line.** One `footnote` `inkMuted` text element, always shown, with no setting for it: the reason, then on Today the coverage sentence from `coverageNote` as its second sentence when there is one ("Picks up the brown in the loafers. Blazer covers the arms."), same style, no symbol. On Today the slot's height is a minimum, never a line cap (`numberOfLines` is not set): the hidden layer measures the tallest of two lines, the current text, and the longest `reason.*` followed by the longest `coverageNote.*` (the coverage sentence left out while her coverage answer is No preference), filled as the `copy.md` length rule fills them, at the current text size and language, filled or not; that rule keeps every pair within two lines at default size, so the budget's 36 pt slot holds, and its text crossfades with the outfit (`base`, `silk`), so Another does not move the quiet row. An outfit whose text needs more grows the line once in the same `LinearTransition` (`settle`, `silk`) and the content below follows. While a check card is open the coverage sentence is not drawn; the card asks about the same need.

**Accessibility.** In hero size each piece is its own button (label `change.pieceLabel`, "{name}, {role}" with the role left out when the name holds it, plus ", kept" / ", beholdt" when kept; hint `change.hint` "Changes this piece", or `change.hintHijab` on the hijab; `accessibilityState.expanded` while its Change strip is open). Pieces are rendered in depth order, so the order is set with `experimental_accessibilityOrder` (RN 0.86). One sequence at every size: title, the pieces in dressing order (top, bottom, layer, shoes, hijab, accessories), the Change strip (while open), reason line, Like, Not for me, Save look, so she hears the outfit and why before she rates it. On Today the outfit block that wraps hero, strip, title line and reason sets it; elsewhere the FlatLay sets title, then pieces. Each hero piece has a hit area of at least 44 x 44 pt (`hitSlop` on small pieces), and where cut-outs overlap the piece highest in z-order wins the touch. Row and mini FlatLays are hidden from VoiceOver; their parent carries the label. Preview variant (hero without `onPiecePress` and without a title, the F07 picker): each piece is `accessibilityRole="image"`, label = piece name and colour, no hint, in dressing order; empty-slot silhouettes keep their VoiceOver-only labels. On look detail the hero's `onPiecePress` pushes the piece, and its piece views stay hidden from VoiceOver (`accessibilityElementsHidden`) because the piece rows below are the same targets; the title stays a header.

---

### 12. Expander

**Purpose.** The single replacement for sheets. An inline region opens under the thing that raised it and pushes the content below down, then closes back. The header, the screen and the outfit stay where they are.

**Props.** `title`, `value?` (current answer shown when closed), `open`, `onToggle`, `tone: "plain" | "attention"`, `headless?` (no closed header line: a `control` chip, a quiet Button or a header item outside it opens and closes it and carries `accessibilityState.expanded`; Tips on Add pieces, Closet More, a calendar day Row at `ax`, Not for me reasons, "These don't look like me" on the selfie result), `children`, `actions?` (up to two Buttons, at most one `secondary`).

`attention` marks a check card that needs an answer: the needs-an-answer dot before the title. The header button's `accessibilityValue` is "{value}, Needs an answer" / "{value}, Trenger svar" when a value is shown, else "Needs an answer" / "Trenger svar".

**Rules.**

- One Expander open per screen. Opening another closes the first.
- When the open one sits above the new one, it collapses without animation and the scroll offset drops by the height removed, in the same frame, so the new header stays still. The new one then opens per `motion.md` > Transitions > Inline expand: anchored at its top, scroll follows on the UI thread until the body is in view.
- Focus follows the shared focus rule.
- No drag handles, no dimming, no overlay, no swipe-to-dismiss.

**States.** Closed (header line, `minHeight` `control.small`: title, value, `chevron.down`; at `large` the value moves under the title), open (chevron rotates 180 degrees, body expands with the inline-expand motion), busy (actions busy), resolved (closes itself and the line shows the new value; a check card disappears once answered).

**Anatomy.** `surface` fill, `radius.md`, padding `space.lg`; a card-question body is the one exception (Uses > Your style card questions). Header line: title `headline` / value `subhead` `inkMuted` / chevron. Body: `space.md` gap; content is ChipRows, Segmented, a `Tile` strip, a `Row`, or a `Field`. Actions sit under the content in a leading-aligned wrapping row (the same as Banner), and stack at `large`. When a second action can appear later, the row reserves its stacked height from the start, so the body never changes height. `accessibilityState.expanded` is set on the header button.

**Uses.** Every inline mode in the architecture table (`architecture.md`, "Inline modes"):

- Change strip on Today: body = horizontal `Tile` strip (strip size) of alternatives with `colour`, and a Keep `Chip`. At `ax` the alternatives become a list of `Row`s with `thumb` leading and `selected` trailing. It sits directly under the `FlatLay` hero, above the title. Tapping an alternative applies it at once: the `FlatLay` above swaps the piece with the piece-swap motion and the tapped alternative shows selected. Focus stays on the tapped alternative, and "Changed" is announced. Undo is Today's Undo slot under the quiet row, never in the strip; closing the strip keeps the swap and the slot's Undo. Actions: "Show all hijabs" (quiet, hijab role only). Kept shows only as the selected Keep `Chip` here and in the piece's VoiceOver label.
- Check card on Today: question chips, then the piece as a `Row` (`thumb` leading, piece name, `chevron` trailing) that pushes the piece ("Open {name}" in VoiceOver). Actions "Save answer" (secondary) and "Use another piece" (quiet).
- Not for me reasons: each trigger opens them under itself (`architecture.md` Inline modes, Today action row): the card's thumbs down under the reason line (under the icon line at `large`), the Not for me word in the slot under the Undo slot. Each trigger sits above its chips and neither moves when they open.
- Colour correction on Ready capture tiles, confirm and piece detail.
- Tips on Add pieces: no closed header line; the `lightbulb` header item opens and closes it (`accessibilityState.expanded` on that item) and Got it closes it. Body: three tip titles, two with a meta line, no icons.
- Fact guesses on piece detail.
- Worn and Plan on look detail: opened by `control` chips under the meta line. Worn's body holds `action` chips; Plan opens straight onto `MonthGrid` `pick` (20), with Clear date as a quiet Button under it.
- Rename in place on look detail (Field rename style, counts as the open Expander).
- Draw-box controls on capture group.
- "More" filters in Closet (the filter panel, below).
- "These don't look like me" on the selfie result: Retake, Hair covered, Undertone, Depth and Contrast, opened by the quiet Button, which carries `accessibilityState.expanded`.
- Morning outfit chips on Profile. The time chips show `notify.time` in h23 ("06:00"). Lane 1 checks with VoiceOver in English and bokmål that they are read as times, not digits; if not, every time label (the chips, the `{time}` in `notify.nightBefore` and the closed value) comes from `Intl.DateTimeFormat` with `hour: "numeric", minute: "2-digit", hourCycle: "h23"`, so the spoken name matches the visible "07:00".
- Your style card questions: one closed Expander per question, body the `ChoiceCardGroup` (ChoiceCard > Purpose). The header line keeps its `surface` fill; the open body has no fill and no padding, so the cards sit on the `gutter` at the onboarding size.

**Closet filter row and panel.** One recipe, no menu, nothing floats.

- Filter row: directly under the native search bar. More (`control`, `chevron.down`, role `button` with `accessibilityState.expanded`) is fixed on the leading `gutter`, outside the ScrollView, so it never scrolls away. After it a `ChipRow` `scroll` of the categories as single-select `choice` chips starting with All, in their own `radiogroup` View (never `accessible` itself), `radio` plus `accessibilityState.selected` (the row always has a value). A category chip shows that section only and sets the scroll offset so the filter row sits at the top of the content; All shows every section. The row never reorders, no chip changes width and no chip appears or leaves when a filter changes. It stays one scroll line at `ax` (Dynamic Type exception).
- Panel: a `headless` Expander opened by More, directly under the filter row, after it in reading order, full content width, pushing the progress card and grid down (`motion.md` > Inline expand). Groups, in this order, the owner's colour, coverage and season first and no group added beyond these: Colour, Coverage (Fully covered, Modest, Needs layering, Needs details), Season (Summer, Winter, All year), Worn (Not worn lately, Never worn), Availability (Unavailable, Put away), Style, Occasion. Each group is one line: its `headline` label in a measured leading column, then its chips in a `ChipRow` `scroll`; at `large` and `ax` the label sits over the line. Below `large` Colour chips are round and show only their `swatch`, name in VoiceOver (Swatch names, Review log). Category, colour and occasion chips come from the whole closet. Each group is single select within itself and a second tap clears it, so panel chips are `button` plus `accessibilityState.selected`, no hint, never `radio`. Chips use the `surface` recipe (Chip > Anatomy). One quiet action "Clear filters" under the groups, its row reserved from the first frame and rendered only while a search or filter is set. At default size on 390 x 844 the open panel leaves the first Section title and the top of the first tile row in view.
- Results apply at once on every tap, with the panel open; there is no Apply or Done. The grid changes with the Filter result crossfade; tiles never slide. The More chip look and value update in the same frame. The match count is announced once the change has held for `wait`, queued (`closet.resultsMany`, "12 pieces found" / "12 plagg funnet"); `closet.noneFoundTitle` is announced when it shows.
- No results: the sections give way to `EmptyState` `closet.noneFoundTitle` ("No pieces found") under the panel, no mark, so the chips that caused it stay in view. "Clear filters" is its button only while the panel is closed; with the panel open, the panel's Clear filters directly above is the one.

---

### 13. Banner

**Purpose.** One true sentence about the state of this screen, with at most two ways out. It sits at the top of content, under the Today context row.

**Props.** `tone: "session" | "notice" | "progress"`, `text`, `actions?` (up to two: first `secondary`, second `quiet`), `leading?: SFSymbol | { thumb: Piece }` (notice only; the thumb only for the capture duplicate, labelled by its matched piece), `progress?: { value: number; meta?: string }` (progress tone only).

| Tone | Look | Use |
|---|---|---|
| `session` | `surface` fill, leading 8 pt `blushStrong` dot (5.05 on surface, hidden from VoiceOver: the sentence carries the state) | Two patterns, worded in `copy.md`: "{What}, today only" (an occasion or a starting piece) with Back to everyday, and "Planning {day}" with Back to today, or with Open plan and Drop for a plan left unsaved. "Planned for today: {look}" / Show on Today |
| `notice` | `surface` fill, optional leading symbol in `inkMuted` | Problems that stop an outfit ("No shoes for snow" / Start with a piece), "N added" in Closet (`flows/F04-closet.md`), forecast unavailable |
| `progress` | The one Banner that is a button. `surface` fill, no leading mark, no actions. Under the sentence a `Silk progress` line (2 pt `plum` on its 1 pt `lineField` track, 3.18 on surface), then the meta in `subhead` `inkMuted`. A trailing 13 pt `chevron.right` in `inkMuted` (5.14 on surface), vertically centred. The whole card is one `button`, `minHeight` `control.regular`, pressed `sunken` (motion `press`) | The Closet background progress card only: "6 new pieces, 4 of 6 ready", meta "Hijabs & scarves 3, Tops 1" (`closet.section` per group, joined with `Intl.ListFormat` `{ type: "unit", style: "short" }`; one line below `large`, one group per line at `large` and `ax`). Done: "6 ready to add" or "5 ready to add, 1 could not finish", the line held full, same meta. It replaces the old "3 preparing" Banner |

**States.** Default, busy (action busy), leaving (collapses with the inline-collapse motion when the session ends; focus per the shared rule).

**Anatomy.** `radius.md`, padding `space.lg`, `body` `ink` text, actions under the text in a leading-aligned wrapping row at `control.small`, stacked at `large`. "One sentence, at most two lines at default size" is a copy-length rule for the UX writer, not `numberOfLines`. Announced per the shared rule. There are never two Banners stacked: a session banner and a problem merge into one Banner with the problem's action.

**Progress card.** It sits at the top of the Closet content, under the filter row and its panel, above the first section, whatever filter is set. It is in place from the first frame Closet renders with a job in the queue, and across a relaunch (`captureProgress`). The sentence, the line value and the meta change in place: text uses the label crossfade (`motion.md` > Banners and bars), the line eases to its new value (`Silk` > `progress`), and nothing in the card moves. The meta line is reserved at one line from the first frame and only grows if the category list wraps. Busy is the line, never a sheen or a spinner. A press anywhere on the card pushes Add pieces. The card leaves with the inline-collapse motion only when the queue is empty: "Add N pieces" on Add pieces empties it before Closet is shown again, so the card and the "N added" Banner never share a frame. VoiceOver: the card is one `button` element, label the sentence then each group as `closet.sectionLabel` ("6 new pieces, 4 of 6 ready, Hijabs & scarves, 3 pieces, Tops, 1 piece"), no hint; the line and chevron are hidden, and nothing inside it is its own target. Only the switch to done is announced; count changes are read when focus reaches the card.

There is no tab badge: the card is the one place progress shows, and Today shows nothing.

---

### 14. ResultBar

**Purpose.** It confirms an action where the action happened, and offers the way back or the next step. It never floats: it takes the place of the action row or footer buttons that caused it.

**Props.** `text?` (past tense, short: "Worn today", "Saved", "Put away"; left out only in the Today Undo slot after an outfit change, which shows its action alone, no checkmark, because the change is on screen), `action?` ("Undo", "Open", "Show on Today"), `onDone?`.

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

**Props.** `title` (optional on Today first run only, where the large title already says Today), `line?` (one sentence max, only when the title alone cannot say what will happen), `action: ButtonProps` (always one, except Closet No results while the filter panel is open, whose Clear filters sits directly above; "Add pieces", "Set your style", "New look", "Go back"), `secondary?: ButtonProps` (Today first run only: one `quiet` Button, "Try the sample closet"), `mark?: boolean` (default false).

**States.** Empty (closet, looks, picker, builder), first run (Today without an everyday style), gone ("This piece is no longer here" with Go back, which pops), unavailable on `media` (CameraFrame).

**Anatomy.** Placed in the upper third, not centred in the void. Optional mark / `space.xl` / `title` (Georgia, centred, `accessibilityRole="header"`) / `space.sm` / optional `body` `inkMuted` line / `space.xl` / Button, centred. The Button is `primary` regular when the screen has no Footer (empty Closet, Looks, Today first run), and `secondary` small when a Footer owns the primary. On `media`, and inside a `CameraFrame` `ink` frame on a canvas screen, title and line are `onMedia` (13.49) and the action takes the Button media variant (`onMedia` fill, `plum` label 6.89, pressed `plumSoft` 6.02). The mark is `assets/brand/mark.png` on `assets/brand/tile.png` (ivory alone on white is about 1.1:1) at `brandMark` size, still, shown only on Closet empty, Today first run and the onboarding done step. Every other empty and gone state is title plus action; Today first run is mark plus actions, no title. The closet-could-not-open screen (F01 S2) is not an EmptyState: it is the splash overlay's error state, laid out by Screen recipes > Splash error.

---

### 16. Silk

**Purpose.** It shows that something is loading, generating, busy or making progress toward a total, in the logo's material. It replaces every spinner. The motion and the sheen colour are defined in `motion.md` (Loading and Generating moments, Sheen asset spec). This component defines the surfaces.

**Props.** `kind: "placeholder" | "sheen" | "busy" | "progress"`, `shape?: "tile" | "row" | "lay" | "chip" | "text"` (placeholder only), `value?: number` (progress, 0 to 1), `label` (VoiceOver: "Loading", "Preparing photo", "Saving").

| Kind | Surface | Where |
|---|---|---|
| `placeholder` | `sunken` shape in the target component's exact size and radius, so nothing moves when content lands. `text` and `row` shapes take their height from `role.lineHeight * fontScale` | Closet grid before photos, Looks rows, Today flat lay on launch, forecast chip |
| `sheen` | Over an existing image: one plain soft diagonal band (Sheen asset spec). No ribbon thread | Capture tile preparing, Clean background being made, the flat lay while arranging, selfie "Measuring your colours" |
| `busy` | The same band, clipped to a Button's capsule, label unchanged | Every committing Button |
| `progress` | 2 pt `plum` fill on a 1 pt `lineField` track (3.34 on canvas), full width of its container, eased fill, so the total shows | Onboarding steps (`Screen.progress`), multi-photo import count, Closet progress card, Clean background when the model reports progress, the Profile completeness line. On onboarding steps and Profile the line is hidden from VoiceOver (`accessibilityElementsHidden`, `importantForAccessibility="no-hide-descendants"`): the step title or the sentence above carries the value |

**States.** Running, resolving (sheen fades as content cross-fades in), Reduce Motion (see `motion.md`), interrupted (leaving the screen cancels and clears it).

**Accessibility.** Each placeholder is hidden from VoiceOver. One element per region (the grid, the list, the chip) carries the `label` and `accessibilityState.busy`, so a Closet grid says "Loading" once. `busy` sets `accessibilityState.busy` on its Button. `progress` sets `accessibilityRole="progressbar"` and `accessibilityValue { min: 0, max: 100, now }`, except where its Where row hides it.

**Anatomy.** A Reanimated translated band inside an `overflow: "hidden"` container, drawn with RN `experimental_backgroundImage` linear gradients (no new dependency), with a three-step View fallback.

---

### 17. CameraFrame

**Purpose.** Two forms. The media frame covers live scan, cut-out editor canvas, capture-group box drawing and colour sample points; it sits on `Screen media`, so the media rule applies around it. The face circle is the selfie camera on `canvas` (F01 S4), with no frame and no shutter (Face circle below). The media itself is a live photo and can be any colour, so every mark on it follows the camera and photo rule.

**Props.** `children` (camera view, canvas or photo), `guide?: string` (live guide pill text), `outline?: { frame, state: "searching" | "found" }`, `circle?: { state: "find" | "guiding" | "ready" | "taken"; hold: number }` (selfie face circle, `hold` 0 to 1 over `dwell`), `points?` (selfie Adjust sample dots), `tray?: Piece[] | Sticker[]`, `shutter?: { onPress, disabled }` (scan and capture only; the selfie has none, it takes the photo itself), `controls?` (quiet Buttons under the frame: `onMedia` on `Screen media` per the media rule (Undo, Reset, Smaller, Larger), `plum` on the canvas selfie; on canvas screens such as capture group and the selfie, the controls follow the canvas colours, standard `plum` quiet Buttons (6.89) with any text off the photo in `ink` (13.49), the same way the shutter ring turns `plum`), `readout?: string` (scan speed readout, in release per owner decision 3).

**States.**

- Searching: `onMedia` 2 pt dashed outline on its 1 pt `ink` halo.
- Found: solid `blush` 2 pt outline on its `ink` halo, and the shutter is enabled. Scan, capture group and the cut-out editor share this one order. In live scan the outline alone marks the piece, because detection comes and goes and a dim would pulse. The background dims with `scrim` only in single-photo select and the cut-out editor. Choreography in `motion.md`.
- Lifting: the cut-out fades from the frame while its tray thumb fades in and settles in place. No scale, no flight.
- Unavailable: no camera permission or no camera. `EmptyState` on the `ink` ground with "Choose photos", title and line in `onMedia`, action in the Button media variant, on scan and the cut-out editor. The selfie has its own unavailable state (Face circle below).

**Anatomy.** Frame (`ink` ground, `radius.lg`, full width; full screen for scan) / guide pill bottom centre (`scrimPill`, `radius.full`, `mark` `onMedia`) / readout top left (`mark` full `onMedia` on its own `scrimPill`), never on the guide's line. Pill and readout stay on the photo only below `ax`. At `ax` both leave the photo for the controls area under the frame as uncapped `subhead` `onMedia` on the `ink` ground (13.49; `ink` on canvas screens), and the frame keeps a floor of 40 percent of the safe-area height between header and Footer while everything between the frame and the Footer scrolls as one ScrollView, Footer pinned. The shutter sits directly under the frame so it is always in the first viewport, then guide, readout, tray, controls; VoiceOver order stays guide, readout, shutter (`experimental_accessibilityOrder`) / shutter centred under the frame (76 pt ring 4 pt `onMedia` on an `ink` halo, 60 pt inner disc `onMedia`; on canvas screens the ring and the inner disc are `plum` (6.89), with a 4 pt `canvas` gap between them, because an `onMedia` disc is white on white) / tray (horizontal strip of `Tile` thumbs, 56 pt, each on a `canvas` bed at `radius.sm`, no shadow, role `image`) / controls row. Sample points are 44 pt targets with a 26 pt ring 3 pt `onMedia` on an `ink` halo, filled with the sampled colour.

The scan screen has a Footer it cannot show while unavailable, so its unavailable state has no ring (F03 S1u). Disabled is a plain solid ring in `sunken` with no inner disc (`inkDisabled` on canvas screens), plus `accessibilityState.disabled`. Enabled and disabled differ as filled against empty, not by colour alone.

**Face circle (selfie).** The selfie has no `ink` frame and no shutter. It is a canvas screen (Screen recipes > Selfie), and the camera shows through one circle, so the white canvas stays the ground and the face is the only thing in colour, as a garment is everywhere else.

- Circle: the front camera view clipped to a circle (`overflow: "hidden"`, radius half the diameter), diameter `faceCircle` (264 pt at most; with its ring never more than 40 percent of the safe-area height), centred horizontally, first child of the scroll. The circle's centre maps to `guideLimits.centre` (x 0.5, y 0.42 of the camera frame), so the face that `selfieGuide` calls centred is the face in the middle of the circle. Smart Invert ignored.
- Ring: one 4 pt stroke drawn 6 pt outside the circle, with `canvas` between, so it never sits on the photo and needs no halo. Dashed `lineField` (3.34, dashes mean not yet) until `ready`. `ready`: the dashed ring fades out and a 4 pt `plum` arc (6.89 on canvas, progress) draws in the same lane, growing clockwise from 12 o'clock with `hold` over `dwell` (700 ms, the `readyToCapture` hold), drawn as two rotating half rings (`motion.md` > Face circle); if the face leaves ready the arc eases back to nothing and the dashed ring fades back in. `taken`: the arc is a full `plum` circle, the circle holds the still frame, and `Silk` `sheen` runs over the circle ("Measuring your colours"). One stroke at a time, no blush. Reduce Motion: `motion.md` > Magic moments > 4 > Face circle and auto capture.
- Feedback line: directly under the ring after `space.lg`, `headline` `ink`, centred, one guide at a time from `selfieGuide` (`find`, `dark`, `closer`, `back`, `centre`, `straight`, `still`, `ready`; words in `copy.md`). The line reserves the height of the tallest guide or retake reason (`motion.md` > Face circle and auto capture), measured in the hidden layer at the current size and language, its text top-aligned, and the text uses the label crossfade (`motion.md` > Banners and bars), so the circle never moves. It is the guide pill's job on canvas: no `scrimPill`, nothing written on the photo.
- Under the line: "Choose a recent selfie" (`colours.library`, `quiet`), the library path for anyone the camera cannot serve.
- Unavailable (no permission or no camera): the circle is an empty `sunken` disc at the same size, the ring is not drawn, and the feedback slot holds the camera-off sentence with "Open Settings" (`secondary` small); "Choose a recent selfie" stays. Nothing moves when permission returns.
- VoiceOver: the circle is one element labelled `colours.circleLabel` ("Camera, {guide}"), an `image` until a face is found, then a `button` (Manual capture below); the feedback line, the ring and the arc are hidden, because the circle carries the guide. A guide change is announced with `{ queue: false }` (the live camera exception in the shared rule), held `dwell` and spaced `announce` (2 s), so a stale guide never plays after the capture. `ready` is not spoken. `colours.taken` is announced once at `taken`, queued. Auto capture works without sight because the guide words say what to do.
- Manual capture: while a face is found, the circle has `accessibilityRole="button"`, keeps `activate` for the double tap, and carries a second, non-default custom action `takePhoto` named `common.takePhoto`, so VoiceOver says "Actions available" and the rotor lists Take photo (iOS never speaks the name of `activate`). The screen answers `magicTap` the same way. The label always starts with the fixed word "Camera", so Voice Control "Tap Camera" finds it whatever the guide says. Switch Control, VoiceOver and anyone who cannot hold still for `dwell` can take the photo. Nothing is drawn for it.
- At `ax`: the circle shrinks to keep its 40 percent cap, the line wraps uncapped and the content under it scrolls; the circle stays the first child.

**Accessibility.** The shutter is "Take photo" / "Ta bilde" (`common.takePhoto`) with `accessibilityState.disabled` when disabled. Tray thumbs are labelled with the piece name. Sample points are labelled with the sampled colour name. The draw box is "Selection box". The guide pill is announced with `{ queue: false }` (the live camera exception in the shared rule), only when the guide state changes and at most once every 2 s. Gesture-only actions have VoiceOver equivalents as `accessibilityActions`: "Select piece" on the photo (replaces hold to select), "Move" and "Resize" on the draw box, "Move" on each sample point (stepping by a fixed amount), next to the existing Smaller and Larger controls.

---

### 18. ChoiceCard and ChoiceCardGroup

**Purpose.** Answer a style question by picture: one illustrated figure per option, as the owner asked (round 1, item 3; round 1, item 4). Used for coverage, everyday style, fit and hijab styles, with the same cards at the same size in the same order wherever the question is asked. Onboarding shows the full grid, one question per step. On Your style each card question is a closed `Expander` row with its title and current value ("Coverage  Modest"), and its body is the same `ChoiceCardGroup` on `canvas` (Expander > Uses); one Expander is open at a time (Expander > Rules), so the screen never stacks grids. Every other choice stays a `ChipRow` or `Segmented`.

**Art pending owner approval.** The 16 files in `assets/illustrations/` are version 1, shown together in `docs/redesign/illustrations-v1.png`. The owner has not approved them, so no token and no rule in this file is taken from the art. Art upkeep below lists what the re-render must deliver before Lane 1 builds this component.

**ChoiceCard props.** `label`, `image: ImageSource` (one figure per card, everywhere), `description?` (VoiceOver only, joined after the label), `selected`, `onPress`. Role and state come from the group.

**ChoiceCardGroup props.** `label?` (omitted on an onboarding step and inside a Your style Expander, where the step title or the Expander header, read just before the group, names the question), `options: { id, label, image, description? }[]`, `plain?: { id, label }[]` (the options with no picture, drawn as chips under the grid), `value` (single id, id array for multi, or null), `onChange`, `multi?`, `exclusive?: id` (the plain "None of these": choosing it clears the others, choosing any other clears it).

| Question | Labels | Images, in order (files on disk) | Description (VoiceOver, after the label) | Plain chips |
|---|---|---|---|---|
| Coverage | `coverage.full`, `coverage.moderate`, `coverage.relaxed` | `coverage-full`, `coverage-moderate`, `coverage-relaxed` | `coverage.*.description` (words in `copy.md` > F01 flow design additions) | No preference (`coverage.noPreference`). On Your style only, a second: My own limit (`coverage.own`) |
| Everyday style | `onboarding.style.*` (Western modest, Abaya or desi, A mix of both) | `style-western`, `style-abaya`, `style-mix`. `style-abaya` gives way to `style-abaya-desi` when the re-render lands (`architecture.md` > Onboarding); `style-desi` is on disk and not used | none, the label says it | none |
| Fit | `onboarding.fit.*` | `fit-loose`, `fit-structured` | none, the label says it | It depends (`onboarding.depends`) |
| Hijab styles (multi) | `hijabStyle.*` | `hijab-hijab`, `hijab-shayla`, `hijab-al-amira`, `hijab-khimar`, `hijab-chador`, `hijab-niqab`, `hijab-burqa`. They ship only as head-and-shoulders art at one scale (Art upkeep) | `hijabStyle.*.description` (words in `copy.md` > F01 flow design additions) | None of these (`exclusive`) |

**My own limit.** When it is selected, the Sleeves and Hem `ChipRow`s (`coverage.sleevesLabel`, `coverage.hemLabel`, single select) open directly under the plain chips in the same body with the inline-expand motion; choosing another coverage option closes them with inline collapse. The chip carries `accessibilityState.expanded` and focus stays on it.

**States.** Each card is a cut-out `Tile` with a picture of an answer.

- Default: the figure straight on `canvas`, no fill and no edge, label under it.
- Pressed: a `sunken` fill at `radius.md` fades in behind the figure and label column (motion `press`), as on a Tile. The art is never dimmed and never scales.
- Selected: the rectangle form of the selected recipe, as on a Tile: a 22 pt `blush` disc top right, inset `space.sm`, with its 2 pt `blushStrong` edge (5.31 on canvas) and an `ink` `checkmark` (7.12), scaled by `symbolScale`. No ring. The disc is always laid out and transparent when unselected, so nothing moves; it crossfades in `quick`, `silk`. No haptic, as the `choice` chip.
- Single select: choosing a card or a plain chip moves the selection; nothing advances by itself, the step's Footer Next does. Multi: each card toggles; the `exclusive` chip follows its rule in the same frame.

**Anatomy.** The card and its label are one `Pressable` and one accessible element, the full column wide. Two columns. Card edges sit on the `gutter`, so cards align with the title above them. Cards are `space.lg` apart across, and the next row starts `space.lg` under the labels. On a 375 pt phone a card is 163.5 x 218 pt, on an onboarding step and on Your style alike. Card: aspect 3:4 (the art is 600 x 800), no fill and no edge; `radius.md`, continuous corners, is the shape of the pressed fill. One figure fills the card (`expo-image`, `contentFit="cover"`, which on 3:4 art is the whole picture). The art is bundled, so there is no placeholder and no fade (`transition` 0). Label under the card after `space.sm`: `subhead` `ink`, leading-aligned, wrapping, never capped, the same as a `Tile` label. A row of two cards keeps both labels top-aligned.

Plain options (No preference, It depends, None of these, My own limit) are not cards: they are `choice` Chips in a `wrap` `ChipRow` `space.lg` under the last row of labels, inside the same group, after the cards. So every card in the grid has a picture and one label position.

At `large` the grid stays two columns and labels wrap. At `ax` the grid is one column: each card is full content width and min(240 pt, 30 percent of the safe-area height) tall with `contentFit="contain"`, so the whole figure shows centred on `canvas` and the seven hijab cards stay a short scroll.

The table names keys only; `copy.md` holds the words, so VoiceOver says the same thing whichever file is read.

**Accessibility.** The images are hidden. Each card's `accessibilityLabel` is its visible label, then its description when it has one, joined with ", " ("Shayla, long scarf, loose over one shoulder"; "Fully covered, long sleeves, to the ankle"). The description is part of the label, never `accessibilityHint`, because hints can be switched off and the picture is the only other way to know where a coverage level stops or what a Shayla is; the visible word comes first, so Voice Control still finds the card by it. The group View is never `accessible` itself (as the Closet filter row), so each card stays its own element; the step title or Expander header read just before it names the question. Single: the group View has `accessibilityRole="radiogroup"`, each card and plain chip `radio` with `accessibilityState.selected` (device check in the shared rules). Multi: each card and plain chip `checkbox` with `accessibilityState.checked`. Reading order follows the grid, row by row, then the plain chips. Smart Invert ignored on the art.

**Art upkeep.** The re-render pass (`architecture.md` > Onboarding) delivers, and the owner approves, before Lane 1:

- Every figure on a transparent background, so the card is a cut-out on `canvas` and the pressed fill shows behind it.
- Garments and scarves in neutral garment tones (ivory, sage, taupe, navy, brown). No blush and no plum anywhere in the art: blush means "this one" and plum means "do something".
- Skin tone varies across the set.
- The seven hijab cards as head-and-shoulders art at one scale, because the head covering is the answer. Full-length hijab art does not ship.
- No text in the art.

With the new art in the mockup, the owner then checks the selected disc on every card, the lone third card on coverage and everyday style, and the length of the seven-card hijab scroll.

---

### 19. Swatches

**Purpose.** Show a set of colours to look at, not to pick: the selfie result's best hijab shades and "go easy on" shades (`paletteFor`).

**Props.** `colours: { hex, name }[]` (six per set from the season palettes).

**States.** Default only. Not pressable.

**Anatomy.** Under a Section title or the step title that names the set. A wrapping row of `swatchLarge` circles (44 pt, scaled by `symbolScale`), `space.md` apart, each with the 1 pt `lineField` inner edge so ivory and white shades show. Below `large` no names are drawn. At `large` and up, under Increase Contrast and under Differentiate Without Color (`AccessibilityInfo` `isDifferentiateWithoutColorEnabled`, listen to its change event), each name (`colorName`) shows under its swatch as `footnote` `inkMuted`, centred and wrapping, the swatch and name one column, so someone who cannot tell the shades apart can still read them. At `ax` the set becomes a vertical list, one colour per line, the swatch leading and its name trailing, so a name never breaks mid-word in a swatch-wide column; still one VoiceOver element per set. No ticks, no strike-through and no dimming on "go easy on": both sets draw every colour true, and the Section title is the only difference. Smart Invert ignored.

**Accessibility.** Each row is one element, always labelled `colours.paletteLabel`: the set's name, then the colour names from `colorName` joined with `Intl.ListFormat` ("Best shades: dusty rose, sage, ..."), so a touch explorer who lands on the row knows which set it is. The swatches and drawn names inside are hidden, because they cannot be pressed.

---

### 20. MonthGrid

**Purpose.** The one calendar in the app. `wear`: one month of what she wore, read at a glance, at `/looks/calendar` (round 2, item 11); reads `wearCalendar`, writes nothing. `pick`: choose a future day, in the look detail Plan body (F09) and Adjust "Choose a date" (F07).

**Props.** `mode: "wear" | "pick"`, `month` (local year and month), `today` (local date), `selected?` (local date), `onSelect`, `onMonth(delta)`. `wear`: `days` (local date to `{ piece }`, the day's mark piece from `wearCalendar`). `pick`: `from` (the first pressable date: tomorrow in F09, the day after tomorrow in F07).

**Grid or Rows.** The grid is used only when each column, (window width - 2 x `gutter`) / 7, is at least 44 pt and 28 x `symbolScale` is no larger than the column less 4 pt, and never at `ax`. Otherwise the Rows form below. A 375 pt phone keeps the grid up to `large` (49 pt columns); a 320 pt phone (Display Zoom) always gets the Rows. MonthGrid decides it from `useLargeText()` and `useWindowDimensions`, so no screen computes its own.

**Anatomy.**

- Month line: the month and year as `headline` `ink` (`calendar.month`, "October 2026" / "oktober 2026"), `accessibilityRole="header"`, leading; trailing, previous and next month as `Button icon` (`chevron.left`, `chevron.right`, never selected), each in a kept 44 pt slot. `wear`: Next is not rendered on the current month; Previous is not rendered on the month of her first outfit wear, or on the current month when she has none. `pick`: Previous is not rendered on the month that holds `from`; Next has no limit. When the title wraps (AX5), the chevrons take their own line under it, trailing, both slots kept.
- Weekday line: seven narrow weekday letters, `footnote` `inkMuted`, the app locale's first weekday (Monday for nb-NO), hidden from VoiceOver.
- Grid: seven equal columns, no gaps, six rows always laid out, so the content under it never moves between months. Days outside the month are empty cells.
- `wear` cell, `minHeight` 72: the day number in `subhead`, centred, then `space.xs`, then a 40 pt (`thumb`) cut-out of the day's mark piece, `contentFit="contain"`, centred, straight on `canvas` at `elevation.flat` with no bed, as a `thumb` Tile. The day number is its only frame, so no day looks framed or chosen: blush stays the only selection signal. One mark per day, however many wears.
- `wear` worn day: number in `ink`, cut-out under it, pressable. Pressed: a `sunken` fill at `radius.sm` fades in behind the cut-out (motion `press`), as on a Tile; the number and its ring or disc stay on `canvas`.
- `wear` not worn, or not yet: number in `inkMuted`, no mark, not pressable.
- `pick` cell, `minHeight` 44: the number alone. From `from` on: `ink`, pressable, pressed a `sunken` fill at `radius.full` behind the number while unselected. Before `from`, today included: `inkDisabled`, not pressable. `inkDisabled` is not swapped under Increase Contrast, so these days never turn `ink` like the days she can pick.
- Today: number in `headline` weight inside a 28 pt circle with a 1.5 pt `ink` ring.
- Selected: number in `ink` on a 28 pt `blush` disc with a 2 pt `blushStrong` edge (ink on blush 7.12; the edge 5.31 on canvas), the day form of the selected recipe. Today and selected together: the disc takes the 1.5 pt `ink` ring as its edge (13.49 on canvas) and the number keeps `headline` weight. One selected day at most.
- The today circle and the selected disc scale by `symbolScale`; Grid or Rows keeps them inside their column.

**States.** Default, pressed, selected, month change (`motion.md` > Month change; no slide and no swipe between months), loading (`wear`: a 40 pt `Silk` placeholder per worn cell until its cut-out decodes; numbers drawn at once).

**Rows form.** The month line stays; the grid becomes a `Row` list in date order, as the grid. `wear`: each worn day of the month is a `Row`, the short date as its title alone (no leading, no meta), trailing a 13 pt `inkMuted` `chevron.down` that rotates 180 degrees when open. A tap opens that day's wear Rows directly under it in a `headless` Expander; the day Row carries `accessibilityState.expanded` only, never `selected`. `pick`: each pressable day of the month is a `Row`, the short date as its title, trailing `selected` (`ink` `checkmark`) on the chosen day; a tap commits.

**Accessibility.** Only pressable days are elements: `button`, the date as `weekday: "long", day: "numeric", month: "long"` with no year, and `accessibilityState.selected` on the chosen day. `wear`: label `calendar.day` ("Friday 2 October, worn") or `calendar.today` ("Wednesday 14 October, today, worn"), no count; in the Rows form the same label with `expanded` instead of `selected`. After a day is selected, the first Row label of that day's Section (look name and occasion) is announced once, queued; focus stays on the day. `pick`: the date alone. Other cells are hidden, so the rotor walks days she can act on, not thirty numbers. The month title reads `calendar.monthLabel*` ("October 2026, worn on 9 days") in `wear`, or `calendar.month` alone (`pick`, or a month with no wears); `calendar.emptyMonth` is its own text element after the chevrons. Month buttons read `calendar.previous` and `calendar.next`. After a month change focus stays on the pressed chevron and the new month title is announced (queued). Only when the pressed chevron leaves does focus move to the month title.

---

## Screen recipes

These are the fixed orders that make screens consistent. Flow docs fill them in.

| Screen type | Order |
|---|---|
| Tab root | `Screen large` / optional `Banner` / hero (`Row` list on Looks; Closet has its own row below) / `Section`s |
| Today | `Screen large` (title is the greeting, see below) / context `ChipRow` (control chips) / optional `Banner` / `FlatLay` hero / Change strip `Expander` (when open) / title line (title; Like, Not for me, Save look) / reason line (measured height reserved) / Not for me `Expander` from the card (when open) / check card `Expander` (when open) / quiet row (Another) / Undo slot / Not for me `Expander` from the slot (when open) / `Section` "Start with" / `Section` "Rediscover" / Apple Weather link (while a forecast is shown) / `Footer`. "Start with" holds saved-look `Row`s first, then the start chips (Hijab, Knit, A piece), with a single "Show all". Rediscover is its own `Section` after it, title `today.rediscover` (a header, like every Section title), holding a horizontal strip of up to six `Tile`s at `strip` size, label only, no meta, leading edge on `gutter` and running to the screen edge; at `ax` it is a list of `Row`s with `thumb` leading. A tap styles an outfit around that piece; each tile carries the hint `rediscover.hint`. The Section is not rendered until a wear exists (`rediscover` returns `[]`), and never empty |
| Closet | `Screen large` / native search bar / filter row (`ChipRow` scroll) / filter panel (`Expander` headless, when open) / optional progress card (`Banner` `progress`, one button with a trailing chevron that pushes Add pieces), or "N added" `Banner` / one `Section` per category with its count, each a `Tile` grid / `Footer` in select mode only (action row above the New look and Start with these pair; the title becomes the selected count). Tiles with open facts carry the needs-an-answer dot before the label (Tile > Needs answers) |
| Looks calendar | `Screen` (push, inline title) / `MonthGrid` `wear` (outfit wears only) / `Section` for the selected day: its outfit wears as `Row`s with `lay` leading (`mini`) and the occasion as meta, in the order recorded, each opening its look / `Section` `stats.mostWorn`, only when a piece was worn twice or more this month: up to three such pieces as `Row`s with `thumb` leading and `calendar.timesMany` as meta / on the current month only, after `space.lg`, Variety alone as a `Row` (no Section title, no leading) with `calendar.varietyValue` as meta and a chevron, which opens Closet with "Not worn lately" selected; its percentage is the owned pieces worn in the last 30 days, the window and pool of that filter. A month with no outfit wears shows the grid, `calendar.emptyMonth` under it and no Sections |
| Profile | `Screen` (push) / completeness block / `Section`s of `Row`s, in the order of `flows/F11-profile-and-style.md`. Completeness block, no Section title: one `headline` `ink` sentence ("The stylist knows 60% of your style"), `space.md`, the 2 pt `Silk progress` line at full content width. The sentence is one plain text element and carries the value; the line is hidden (`accessibilityElementsHidden`, `importantForAccessibility="no-hide-descendants"`). `space.md`, up to three quick add `control` chips with `chevron.right` in a `wrap` ChipRow, each pushing the answer's home. The block updates when Profile is shown again, never while it is visible; at 100 percent the chips are not rendered and the sentence and full line stay |
| Onboarding step | Every step, the same: `Screen` with `progress` / step title (`title`, the question, `accessibilityRole="header"`, the step as its `accessibilityValue`) / one control: a `Field` (name), a `ChoiceCardGroup` (hijab styles, coverage, everyday style, fit; no drawn label, the step title read just before it names the question), a `ChipRow` (hijab, sparkle, notification time), the place choices (9 Field > Location search) or the colours step's `colours.selfie` `Button secondary` / `Footer` with `onboarding.next` alone, always enabled. The `Silk progress` bar is hidden from VoiceOver (Screen > `progress`), so the step is read once, on the title. There is no Skip: Next on an unanswered step writes nothing (`flows/F01-start.md` S3). No line under the title. Content scrolls under the pinned Footer when it is taller than the viewport (hijab styles) |
| Splash error | The splash overlay, no header, no Footer. One block, centred vertically between the top and bottom safe-area insets (never the screen centre): the tile and mark at 160 pt / `space.xl` / `title` `start.error.title`, centred / `space.xl` / `Button primary regular` `common.tryAgain`, centred, intrinsic width. The block's bottom is never closer than `space.xl` to the bottom safe-area inset, so Try again always sits clear of the home indicator. The block is measured in the hidden layer before the error shows; the tile then settles from the native splash rect to its place in the block, and the title and button fade in after it (`motion.md` > Splash, M2b, which owns the timing and the Reduce Motion path). The overlay sets `accessibilityViewIsModal` and focus goes to the title when the error shows. When the block is taller than the safe area (`ax`), it is a ScrollView starting `space.xxl` under the top inset, the tile first and Try again last in the scroll |
| Detail (piece, look) | `Screen` with Edit or nothing, `title` passed for VoiceOver and the back menu, no visible bar title / optional `Banner` (sentence only when a Section action already repairs it; on a look it sits under the meta line instead, so visual and reading order match) / hero (`Tile` photo full width for a piece, `FlatLay` for a look) / `title` / meta line / `Section`s of `Row`s and fact `Chip`s / `Footer` with the one primary. When the push ends, `setAccessibilityFocus` goes to the `title`, so VoiceOver starts on the name, not on Back (piece and look). Look only: a `control` ChipRow (Rename, Worn, Plan) under the meta line, and `Button destructive` Remove look last in the scroll, because a look has no editor with a scroll end |
| Editor (new piece, edit piece, build look, Your style, Adjust, answer) | `Screen leading="cancel"` / content in `Section`s / `Footer` primary (Save, Add to closet, Find outfits). On Your style each card question (hijab styles, coverage, everyday style, fit) is a closed `Expander` row, title and current value, whose body is its `ChoiceCardGroup`; one open at a time |
| Media (scan, cut-out) | `Screen media` / `CameraFrame` / `Footer` |
| Selfie | `Screen` on `canvas`, scrolling, one route in three phases that replace each other with Step change in place (`motion.md` > Transitions). Tips: a `Section` of four static `Row`s, no icons (as Tips on Add pieces) / `Footer` "Open camera". Camera: `CameraFrame` face circle / feedback line / "Choose a recent selfie" (`colours.library`, quiet), no Footer. Result: the face circle with the still photo, first, so the points have a photo to sit on / season line (`season.*`, `title`, `accessibilityRole="header"`; `setAccessibilityFocus` moves to it when the phase arrives, `motion.md` > Palette reveal) / `Swatches` best / `Swatches` go easy / "These don't look like me" (quiet, `accessibilityState.expanded`, opens a `headless` `Expander`: Retake, the "Hair covered" toggle `Row`, then the Undertone, Depth and Contrast `Segmented` controls) / `Footer` "Save colours" |

**Today action area.**

- Everyday and occasion: `Footer` primary "Wear this", nothing else. Hijabs are compared by tapping the hijab in the FlatLay (its swap mark is part of it), which opens the hijab Change strip.
- Outfit actions live on the card's title line (FlatLay > Title line): Like, Not for me, Save look as `Button icon`. Not for me opens the reason chips in place under the reason line (Expander > Uses > Not for me reasons), about the outfit shown; Save look saves at once, shows its filled symbol and then opens the look when pressed (Button > Icon variant). They are never repeated in the quiet row.
- The quiet row scrolls with the content, directly under the reason line, or under the card's Not for me reasons or the check card while open. It is never pinned. It holds one `quiet` Button, Another, full content width, label centred. Its height is measured in the hidden layer (as Footer > Anatomy), the same in English and bokmål.
- Planning a day and Tomorrow's outfit: "Wear this" is not rendered. `Footer` primary is "Save look", nothing else, and the card's Save look icon is not rendered; Like and Not for me sit flush trailing (the outfit and title are new on entering planning, so nothing reflows under her eyes). The quiet row is Another. "Back to today" with an unsaved plan asks `today.savePlanTitle` in the planning Banner: its text and action row crossfade to the question with Save look and Discard, focus on the question.
- Undo: after Wear this the Footer becomes a `ResultBar`. Another, Show on Today, Fill the gap and a Change strip pick undo from the one Undo slot under the quiet row, which shows Undo alone, no text. After Another the slot holds two quiet actions, Undo then Not for me, both about the outfit she skipped: Not for me there opens the same reason chips as the card's thumbs down, under the Undo slot, aimed at the skipped outfit (VoiceOver "Not for me, previous outfit"). One set of chips is open at a time; pressing the other trigger closes them and opens its own, in one `LinearTransition`, and neither trigger moves. The slot's content is centred under Another, as one pair or stacked line by line. A Not for me reason shows "Noted for next time" with Undo. A change that shows its own way back does not fill the slot: Like, Save look, the Hijab and Knit chips (their state) and a Rediscover tile (its session Banner). A Rediscover tile is pressed while she is scrolled down, so the scroll settles to the top on the tap (`motion.md` > Named motions > `scrollSettle`). The slot reserves the taller of its two bars, each side by side or stacked as the hidden-layer measurement decides at the current fontScale and language, never by the `large` threshold. Its content only crossfades; empty, it is hidden from VoiceOver. One ResultBar per screen (`flows/F06-today.md` S1 > Undo).
- Greeting: the large title is `greeting(name, hour, locale)`, computed when Today gains focus and when the app returns to the foreground, never while Today is visible, so the title never changes under her eyes. The native large title truncates instead of wrapping, so the title is measured in the hidden layer with the exact `headerLargeTitleStyle` (Type > Dynamic Type: Georgia, or Georgia-Bold under Bold Text, 34 x min(fontScale, 1.76), tracking 0 as the native title draws it), again on a fontScale change and on `boldTextChanged`: it takes the first form that fits one line. With a name: the greeting, then "Hi, {name}" (`today.greeting.short`, the time of day drops before the name), then the tab name ("Today" / "I dag"). Without a name: the plain greeting, then the tab name. It never truncates. The tab bar label is always "Today". Lane 1 device check: "God ettermiddag, {name}" at default size on a 375 pt phone with a 6 to 8 letter name keeps the name or falls back to "Hei, {name}".

## Review log

- **Today Sections merged, not moved.** Owner decision 4 keeps the Knit start chip on Today, so "Start with" stays and absorbs "From your looks" as one Section instead of moving to the Change strip or Closet.
- **`plumGround` kept next to `plum`.** It is sampled from `icon.png` so the splash tile matches the app icon; it is never used in UI.
- **Mockup review, 3 Oct.** Chips on `canvas` that are not `choice` now draw their 1 pt `lineField` edge in the mockup, and Expander chips their `surface` recipe, matching Chip > Anatomy. The selected tab rule and the Today hero cap above were added from the same review.
- **Revision 1 review, 3 Oct.** Fixed: ChoiceCard edge, plain-card label and Your style Expander rows; MonthGrid selected edge, scaling and focus; face circle ring, arc and VoiceOver (with `motion.md`); FlatLay reason line, swap mark and one VoiceOver order; Today order; Segmented style labels; filter row semantics; Swatches as one element; Silk `meter` removed; splash error Reduce Motion moved to `motion.md` M2b, and its one tile settle written into Principles as the exception.
- **Title line, budget kept over a second layout.** The icons stay trailing on the title line below `large`, and the 390 x 844 budget is worked out in FlatLay > Anatomy (hero 236 pt, so the Undo line fits too). Moving the icons under the reason line at every size costs a 52 pt line on every outfit and shrinks the hero to about 184 pt.
- **Closet filters, closed.** Row: More plus the categories only. Panel: Colour, Coverage (with Needs details), Season, Worn (Not worn lately, Never worn), Availability (Unavailable, Put away), Style, Occasion, one line per group (`flows/F04-closet.md` S1 item 4). The review asked to drop Worn; it stays as one group of two because Profile "Never worn" and the calendar's Variety open Closet with those filters on (`architecture.md` rule 7), and with "Not worn lately" moved out of the row nothing repeats. More keeps its label (`closet.more`).
- **Splash error settle kept, not a crossfade.** `flows/F01-start.md` S2 and `motion.md` M2b already settle the tile once into the centred block, and a crossfade would show two tiles at once. The settle is written into Principles as the one exception instead.
- **Rediscover hint.** Uses the existing `rediscover.hint` ("Starts with this piece") instead of a new key, so `copy.md` stays the one source.
- **Hijab swap mark kept.** The critic case (an always-on glyph is clutter on the dressing-room image) loses to `architecture.md` row 78 and C6-01: it is the one visible door to the hijab strip. It is kept small, plum on a canvas disc, inside the hijab's own hit area.
- **Revision 1 cross-review, 3 Oct.** Fixed: ChoiceCard descriptions (coverage and hijab) in the label, edge dropped, plain options as chips, one card size, `ax` height cap; one Onboarding step recipe with Next alone; place choices in content with the Field under Search for your city; progress card as one button, no badge; Today hero 236 pt with the Undo line in the budget; Save look as a toggle with "Saved" and Open in the slot; More keeps its label; filter panel regrouped; Swatches names and label; selected disc edge; reading order at `large`; Rediscover as its own Section; selfie tips without icons and the manual capture action; Section keys; LCV wording; greeting and time chip device checks.
- **Descriptions in the label, not the value.** The review allowed either. The label ("Shayla, long scarf, loose over one shoulder") keeps the visible word first for Voice Control and avoids sharing `accessibilityValue` with the checked state RN writes there for `checkbox`. Keys are `*.description`, not `*.hint`, so nobody wires them to `accessibilityHint`.
- **Place step, the architecture layout.** Of the three versions, `architecture.md` row 121 wins (two choices in content, the Field opening under the second), because focus can follow the trigger. `copy.md`'s always-visible field under one button is not taken.
- **Progress card, the `copy.md` layout.** One button, no Review, no text element of its own.
- **Banner case, Undo line not forced into the first viewport.** With a Banner the hero would drop to 110 pt to fit it, too small for a flat lay. The hero stays 236 pt, so a Banner arriving never resizes it, and the scroll settles to show the slot when a change fills it below the Footer edge.
- **Closet tab badge dropped.** The owner asked for a progress card (round 2, item 12), not a badge; it repeated the card's count on a second surface.
- **Plain options as chips, not cards.** A card with no art, or with its label inside, was a second card form in one grid.
- **Swatch names, not always drawn.** Drawn at `large` and up, under Increase Contrast and under Differentiate Without Color, the least clutter that still gives a reading without colour; at default size the row stays six plain circles.
- **Saved look, a door (reversed).** Once saved, the bookmark opens the look, as `architecture.md` row 86, UC-F06-06, `copy.md` and `motion.md` say. A remove on the daily screen sits one tap from Like and needs a system alert; Remove look lives on look detail.
- **Revision 1 review, round 3, 3 Oct.** Fixed: outfit icon colour `inkMuted` in the Button table, the face circle feedback line hidden from VoiceOver, busy Use my location, splash fade order, selfie phases as Step change in place. `motion.md` aligned: month title focus when Next leaves, Swatches one element per row, choice card Footer and `exclusive` chip.
- **"Double-tap to clear" hint on Closet panel chips, declined.** Panel chips are `button` plus `selected`, never `radio`, so VoiceOver does not promise a choice that stays set, and the hint key was cut with `flows/F04-closet.md`.
- **Rediscover inside "Start with", declined.** "Start with" opens the builder or a start chip on a piece she picks; Rediscover styles today around a piece she has not worn. Its own header lets the rotor reach it, and it is not rendered until a wear exists, so it adds nothing on day one.
- **FlatLay reading order, reason before the icons.** The review proposed the icons first. She hears the outfit and why before she rates it; the order is one sequence at every size.
- **Review round 4, 3 Oct.** Fixed: Swatches always labelled `colours.paletteLabel`; the onboarding bar and the Profile line hidden from VoiceOver, the step title a header with the step as its value; `pick` days she cannot press in `inkDisabled`; Plan opens on `MonthGrid` `pick`; `blushStrong` is `#9A5A52` everywhere and `paper` is gone; ChoiceCard as a cut-out Tile, art pending owner approval with the file names on disk and the re-render rules in Art upkeep; `MonthGrid` cut-outs with no bed; the face circle as one stroke; location search under Field with the check taking the clear button's slot; `scrollSettle` named in `motion.md`; the progress card meta joined with ", ". The contact sheet holds all 16 files and the mockup shows real art on every card.
- **Style words, `copy.md`'s rule.** Two sets, as `copy.md` > Cards and chips says: the card words where she answers, the filter words on the Today chip and in Adjust. They name two different controls, so each control keeps one name everywhere (WCAG 3.2.4).
- **Expander exception for Not for me, declined.** Each trigger opens the chips under itself (`architecture.md` row 86, `flows/F06-today.md` item 8 and 12), so the Expander rule holds. Pressing the other trigger closes the chips and opens them under that trigger, which is the visible change, and a reason commits on tap, so there is no picked reason to clear.
- **Selected card edge under Increase Contrast, not needed.** The card has no fill and no edge now; selected is the Tile disc with its 5.31 edge at every setting.
- **Two greeting forms, declined.** `flows/F06-today.md` and `copy.md` own the chain with `today.greeting.short`, which keeps her name at larger sizes (round 2, item 3). The title is measured on focus only, so it never changes in view.
- **Lighter "These don't look like me", declined.** `seasonFor` reads undertone, depth and contrast, and Hair covered decides whether hair is sampled, so every control is one the palette needs. Retake is already first; an Adjust line would add a word and a tap.

## Revision 1

Owner feedback rounds 1 and 2 folded in, with `architecture.md` Revision 1 and 2 as the source for where each feature lives. Built on what exists: `selfieGuide` and its guide states, `guideLimits.centre`, the season palettes behind `bestColours`, `colorName`, `closetStats`, `wearCounts`, `closetFilters` and the import runner in `src/state/imports.ts`. The new domain functions this file reads (`paletteFor`, `readyToCapture`, `coverageNote`, `rediscover`, `completeness`, `wearCalendar`, `monthWearStats`, `captureProgress`, `groupByCategory`, `greeting`) are the architecture's Domain touches rows, not new asks.

Changes:

- **Closet could not open (round 1, item 1).** New Screen recipe "Splash error": tile, title and Try again are one block centred between the safe-area insets, Try again at least `space.xl` above the bottom inset, scrolling at `ax`. The tile settles from the native splash rect into the block. The old rule kept the tile at the screen-centred splash rect and hung the title and button under it, which pushed the button under the home indicator. EmptyState now points to the recipe.
- **Tokens.** `swatchLarge` (44) and `faceCircle` (264). Blush closed list gains the selected `ChoiceCard` disc and the selected `MonthGrid` day. The selected recipe gains its day and icon-toggle forms; `ChoiceCard` takes the Tile form. `blushStrong` is `#9A5A52` everywhere, so every selected form has one edge.
- **Illustrated choice card (round 1, items 3 and 4).** New component 18, `ChoiceCard` and `ChoiceCardGroup`: a figure on `canvas` at 3:4, treated as a cut-out `Tile`, label under it, single (`radio`) and multi (`checkbox`) select, `exclusive` None of these, selected as the Tile's `blush` check disc with its edge, one column at `ax`. Options with no picture (No preference, It depends, None of these, My own limit) are `choice` Chips under the grid. Coverage and hijab cards carry a VoiceOver description after the label. On Your style each card question is a closed Expander row. The art is pending owner approval, with no placeholder and no ground of its own.
- **Palette swatch group (round 2, item 5).** New component 19, `Swatches`: six 44 pt colours per set, names drawn only at `large` and up or under Increase Contrast, both sets drawn true and told apart only by their Section titles.
- **Face circle (round 1, item 5; round 2, item 5).** `CameraFrame` replaces the selfie oval, ink frame, guide pill and shutter with the face circle on canvas: a dashed `lineField` ring that gives way to a `plum` arc in the same lane through the 700 ms hold, then the sheen while measuring. One feedback line under the circle, two lines reserved. "Choose a recent selfie" (`colours.library`) stays as the library path, and the circle carries a `common.takePhoto` action and `magicTap`. Selfie screen recipe now has the three phases: tips, camera, result.
- **Background progress card (round 2, item 12).** Banner `tone: "progress"` with a `Silk progress` line and the category meta; the whole card is one button with a trailing chevron that pushes Add pieces; reserved meta line, in-place updates, never shares a frame with "N added". No tab badge.
- **Category section header with count (round 2, item 10).** `Section` `count`: same size as the title, `inkMuted`, one header element, not sticky.
- **Inline filter row and panel (round 2, item 10).** Closet More is a `headless` Expander under the filter row, with groups in the architecture's order, applied at once, "Clear filters" in a reserved row. More takes the selected recipe while a filter is set; its label never changes. "No pieces found" EmptyState. Expander gains `headless`.
- **Calendar month grid (round 2, item 11).** New component 20, `MonthGrid`: six reserved rows, a 40 pt cut-out as the worn mark, today ringed in `ink`, selected on a `blush` disc with a `blushStrong` edge, only worn days are elements, a list of `Row`s at `ax`. New Screen recipe "Looks calendar". F09 review: `pick` mode replaces the native date picker in F09 Plan and F07 Choose a date; Grid or Rows by column width, not only `ax`; outfit wears only; cut-outs on `canvas` with no bed, pressed as a Tile; today selected keeps its ring as the disc edge.
- **Completeness meter (round 2, item 14).** The 2 pt `Silk progress` line, its value in the sentence. New Screen recipe "Profile" with the completeness block and quick add `control` chips.
- **Thumbs and save (round 2, item 7; round 1, item 6).** Button `icon` variant: `inkMuted` outline symbol, selected as the filled `ink` symbol, no disc. Like, Not for me and Save look sit on the FlatLay title line. Like is a toggle; Save look fills and then opens the look, with nothing in the Undo slot. The quiet row holds Another alone; Not for me sits next to Undo in the Undo slot after Another. While planning and on Tomorrow's outfit the Save icon is not rendered and the Footer primary is Save look.
- **Coverage line (round 2, item 6).** The second sentence of the reason line, same `footnote` `inkMuted` style, in a slot with a measured minimum height; not drawn while a check card is open.
- **Rediscover row (round 2, item 8).** Its own `Section` after "Start with": a `strip` `Tile` row of up to six, label only, hidden until a wear exists, `Row`s at `ax`.
- **Greeting (round 2, item 3).** The native large title truncates, so the greeting falls back to "Hi, {name}", then to "Today", whenever it would not fit one line.
