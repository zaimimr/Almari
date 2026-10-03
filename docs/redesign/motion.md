# Almari motion

Date: 2026-10-03. Phase 2 output (plan Task 3). Inputs: `architecture.md`, `use-cases.md`, the spec.

## Language: silk

Things move like fabric put down on a table: they arrive a little high, fall the last few points and come to rest. They never bounce, spring, wobble or overshoot. Motion is short, calm and always means something: something arrived, something moved, something is being made.

Rules that hold everywhere:

1. No springs. `withSpring` is not used in the app. Every animation is `withTiming` with a duration token and an easing token. No raw millisecond value appears outside the Tokens section.
2. No overshoot. Every curve below keeps both y control points at or below 1.
3. Distances are small. Entrances travel 4 to 10 pt. Scale changes stay within 0.94 to 1.06, and a scale under 2 % is not used because nobody sees it.
4. Only `transform` and `opacity` animate per frame, except Reanimated layout transitions and the native mask sweep (see Performance). Colour only on control and row fills, via `interpolateColor`. Shadow only on the one cut-out under a finger (see `lift`).
5. Every animation can be interrupted. A new target starts from the current value; nothing snaps back first.
6. Nothing waits on motion. Taps work during any animation; results show the moment they arrive; content is in its final place for VoiceOver from the first frame. The splash is the one exception: hand-off waits for the drape end, and when the destination is not yet known (the closet is still opening) the overlay holds the still mark until it is, so a Today placeholder never flashes before onboarding.
7. Every moving thing has a Reduce Motion path: layout applies at once, content fades, no travel, no scale, no loops. One exception: the sheen pulse (`flows/F12-app-wide-checks.md`, R), where the band fades in and out in place by opacity only, 0 to the host's peak over `sheen`, `wait` between, stopped after `loop` on a usable screen.

## Tokens

Lives in `src/ui/motion.ts` (Phase 3, Lane 1), next to `theme.ts`. Native code (Swift) uses the same numbers as constants in `CutoutEditorView.swift` and `CAMediaTimingFunction(controlPoints:)`.

### Duration (ms)

| Token | Value | Use |
|---|---|---|
| `quick` | 160 | Exits, `press`, selection fills, fade out of a sheen, a scan outline gliding to a new detection |
| `base` | 240 | Content fading in, every resolve, every Reduce Motion fade |
| `settle` | 320 | Inline expand and collapse, sibling reflow, box snap, segmented thumb, chevron, splash overlay fade |
| `arrange` | 420 | A piece laid down in the flat lay, scan sticker flying into the tray |
| `drape` | 640 | Splash scarf fall, outline sweep |
| `sheen` | 1100 | One pass of the sheen band |

Timers (not animation lengths):

| Token | Value | Use |
|---|---|---|
| `wait` | 300 | Delay before any loading cue shows, so fast loads never flicker. Pause between two sheen passes. Reduce Motion hold for a cue that goes away (scan sticker, outline); never delays a result |
| `dwell` | 700 | Hold-still threshold on a scan outline (UC-F03-02). A camera status must also hold this long before it is spoken (`copy.md`, Announcements) |
| `step` | 60 | Gap between items entering (max 6, the rest arrive with the 6th), between flat lay pieces, and before inline content or an incoming piece starts |
| `linger` | 1500 | Minimum time `scan.status.taken` stays up, Reduce Motion included |
| `announce` | 2000 | Minimum gap between two spoken camera statuses (guide pill, selfie guide) |
| `loop` | 5000 | Longest the sheen loops on a host whose screen is otherwise usable; then the band stands still until resolve |

### Easing (`Easing.bezier`)

| Token | Value | Use |
|---|---|---|
| `silk` | `Easing.bezier(0.22, 0.61, 0.36, 1)` | Default for anything arriving or moving into place |
| `fall` | `Easing.bezier(0.16, 1, 0.3, 1)` | Last few points of a fall: fast start, long soft tail. Scarf drape, flat lay pieces, box snap, lift returning to rest |
| `carry` | `Easing.bezier(0.5, 0, 0.2, 1)` | Something carried across its host: the sticker into the tray, the sheen band across a surface. Same value `ScanLift` uses today |
| `release` | `Easing.bezier(0.32, 0, 0.67, 0)` | Leaving: fades out, pieces lifting off |

```ts
import { Easing } from "react-native-reanimated";

export const motion = {
  duration: {
    quick: 160,
    base: 240,
    settle: 320,
    arrange: 420,
    drape: 640,
    sheen: 1100,
  },
  timer: {
    wait: 300,
    dwell: 700,
    step: 60,
    linger: 1500,
    announce: 2000,
    loop: 5000,
  },
  easing: {
    silk: Easing.bezier(0.22, 0.61, 0.36, 1),
    fall: Easing.bezier(0.16, 1, 0.3, 1),
    carry: Easing.bezier(0.5, 0, 0.2, 1),
    release: Easing.bezier(0.32, 0, 0.67, 0),
  },
} as const;
```

### Named motions

| Name | Motion | Reduce Motion |
|---|---|---|
| `press` | The fill steps to its pressed colour from `design-system.md` (`plumPressed`, or `sunken` for quiet, rows and chips) in `quick`, `silk`, and steps back in `quick`, `silk` on release. No opacity change, no scale. A tile: a `sunken` fill at `radius.md` fades in behind the cut-out; the image is never dimmed, so garment colours stay true | Same |
| `lift` | The one cut-out under a finger (a flat lay piece pressed or dragged) moves from `elevation.rest` to `elevation.lift` (`base`, `silk`) and back on release (`settle`, `fall`). Values live in `design-system.md`, Elevation. Never on a selected tile, the editor or the scan | The shadow steps at once |

### Sheen

The `Silk` band. `design-system.md`, Silk, owns the surfaces; the band itself is defined here.

- One plain soft diagonal band, 20 deg from vertical, 40 % of the host width: transparent, `sheen` `#FAF8F3` at its peak, transparent. No ribbon thread.
- Peak alpha: 0.7 on `sunken` (placeholders, the pressed fill of a busy quiet or destructive Button). 0.35 over photos and cut-outs, so a garment never washes out to white. 0.15 on plum (busy primary Button), so `onPlum` keeps 4.82:1 over the blend `#7D6D7E`. Never higher on primary (0.2 gives 4.32:1), because under Reduce Motion and after `loop` the band stands still right behind the label.
- Z-order: the band is clipped to the image layer and draws under every `scrimPill`, outline, halo, ring and text; it never crosses text except the busy Button label, which sits above it.
- Busy Button: primary and secondary run the band over their fill. Quiet and destructive have no fill, so the capsule takes the `sunken` pressed fill for the whole busy state and the band crosses that at peak 0.7 (`plum` label on it 5.92:1, `error` stays above 4.5:1).
- Loop limit (WCAG 2.2.2): on a host whose screen is otherwise usable (capture tile preparing, Clean background, Today Generating), the band stops looping after `loop` and stands still at the centre until resolve, as under Reduce Motion. A flat lay is the exception: a still band would tint the cloth, so after `loop` it fades out (`quick`) and the tapped control shows the still busy band until resolve. Placeholders and Buttons keep the still band. Full-screen waits (the editor mask load) keep the loop.
- Increase Contrast (`darkerSystemColorsChanged`): a placeholder gets a 1 pt `lineField` edge (3.34:1 on canvas); the band stays.
- Over a flat lay the band is clipped to the pieces' alpha: each piece draws a second copy of its cut-out with `expo-image` `tintColor` `sheen` inside a window that moves with the band. Light falls on cloth, never on the white canvas.

### Reduce Motion in code

- JS: a `useReduceMotion` hook in `src/ui/motion.ts` that seeds from `AccessibilityInfo.isReduceMotionEnabled()` and listens to `reduceMotionChanged`; every moment reads it and branches. Reanimated `useReducedMotion()` is not used: it reads once and misses a change in Settings mid-session. The reduced branch animates `opacity` only, with `base`.
- Pass `reduceMotion: ReduceMotion.Never` on the fades of the reduced branch (as `ScanLift` does). The Reanimated default (`ReduceMotion.System`) jumps straight to the end and the fade would be lost.
- Layout animations: no `LinearTransition` in the reduced branch; entering content uses `FadeIn.duration(motion.duration.base).reduceMotion(ReduceMotion.Never)`.
- Native (`CutoutEditorView.swift`): read `UIAccessibility.isReduceMotionEnabled` and observe `UIAccessibility.reduceMotionStatusDidChangeNotification`, so a change in Settings applies without reopening the editor.
- The sheen loop does not run. A placeholder stays still. A sheen host (except a flat lay, which shows no band; its tapped control shows it instead) and a busy Button show the band still at its centre after `wait`, at the host's peak (0.15 on a primary Button) (fade in `base`, kept until resolve, fade out `base`). The Button label never changes; `busyLabel` stays VoiceOver only, with `accessibilityState.busy`.

## Transitions

| Type | Motion | Reduce Motion |
|---|---|---|
| Push and pop | Native iOS stack transition, unchanged. `animation: "default"` everywhere; never `fade`, `slide_from_bottom` or `modal`. Swipe back always works except guarded editors after their first edit. The pushed screen renders complete: no entrance animation on its content. Images that arrive later fade in (`base`, `silk`) | System. Late images fade in (`base`) |
| Pop to a tab after a flow | Capture ends with one `dismissTo` the Closet tab, never a chain. The "N added" bar is already in place in the first frame, with no expand. Only the new tiles fade in (list insert). The same holds for any banner the app shows on arrival (occasion banner, planning banner): it is there when the screen is. VoiceOver: move focus to the bar (its label carries the count); no separate announcement | New tiles fade in (`base`) |
| Inline expand | The one container that grows gets `LinearTransition.duration(settle).easing(silk)`; siblings below get the same transition so they glide down together. Its content enters after `step`: opacity 0 to 1, translateY 4 to 0 (`base`, `silk`). Anchored at its top: nothing above it moves. If the opened part ends below the fold, the scroll view brings the top of the opened part into view, and its end only when the whole part fits the viewport, with `scrollTo` from a worklet (`settle`, `silk`), never the native `animated: true` jump | Layout in one frame, no `LinearTransition`. Content fades in (`base`). `scrollTo` not animated |
| Inline collapse | Content opacity 1 to 0 (`quick`, `release`), then height closes (`settle`, `silk`) with siblings gliding up | Content fades out (`base`), then layout in one frame |
| Step change in place | One route whose steps swap content (onboarding): header and Footer hold still; outgoing content opacity 1 to 0 (`quick`, `release`); incoming after `step`, opacity 0 to 1, translateY 4 to 0 (`base`, `silk`). Scroll to top in one frame. `gestureEnabled: false` between steps, so swipe never means two things | Content crossfade (`base`) |
| Tab switch | None. Native tabs switch instantly and keep each stack. A switch triggered by an action ("Style today", "Show on Today") is also instant; the destination then plays its own moment. Never animate between tabs | Same |
| List insert | Opacity 0 to 1 (`base`, `silk`). Neighbours reflow with `LinearTransition` (`settle`, `silk`). Several at once: `step`, max 6. `Animated.FlatList` uses `itemLayoutAnimation` for the reflow | Fade in (`base`), all at once, no stagger. Neighbours move in one frame |
| List remove | Opacity to 0 (`quick`, `release`), then neighbours close the gap (`settle`, `silk`). A removal after a system confirm starts when the dialog has gone | Fade out (`base`). Neighbours move in one frame |
| Flat lay piece swap | Outgoing: opacity 1 to 0, translateY 0 to -4 (`quick`, `release`). Incoming starts after `step`: opacity 0 to 1, translateY -6 to 0 (`arrange`, `fall`), at `elevation.rest`. The other pieces do not move. Tapping an alternative in the Change strip applies it with this swap; nothing else plays. Undo plays the same swap back | Crossfade in place (`base`) |
| Selection | Chips, tiles and segments crossfade to their selected fill in `quick`, `silk`. Native switches are not custom-animated. Pressing uses `press`. A flat lay piece under a finger plays `lift` and returns on release. Each flat lay piece's touch area is at least 44 x 44 pt (`hitSlop`), and pieces are exposed to VoiceOver in dressing order (top, bottom, layer, shoes, hijab, accessories), matching the swap order | Same |
| Segmented thumb | translateX to the chosen segment (`settle`, `silk`). Vertical layout: selection crossfade (`quick`, `silk`), no travel | Thumb crossfades (`base`). Vertical: same as motion |
| Expander chevron | rotate 0 to 180 deg (`settle`, `silk`) | Rotates in one frame |
| `Silk` progress | Fill grows as scaleX from the leading edge (`base`, `silk`) | Steps in one frame |
| Footer entering | Waiting (no action yet): the primary is laid out at opacity 0 from the first frame, so the height is measured and held, then fades in place (`base`, `silk`). Editors: the primary is there from the first frame, disabled, and crossfades to `plum` (`quick`, `silk`) when it can act. No height change | Same fade |
| ResultBar | Footer content and the ResultBar crossfade in the reserved footer: outgoing `quick`, `release`, absolutely positioned and hidden from VoiceOver from frame 0; incoming `base`, `silk`. Height held per the Banners and bars `minHeight` rule. Focus and announcement per `design-system.md` > ResultBar > Focus, which wins | Same crossfade at `base` |
| Banners and bars | A banner the user opens on this screen uses inline expand and collapse. A label that changes in place (`today.saveLook` to `today.openLook`): the old label fades out (`quick`) over the new one, which fades in (`base`). The wrapper holds `minHeight` at the larger measured height until the fade ends; then the height changes via inline expand or collapse. Never a fixed width. Where a row picks horizontal or vertical layout from its labels, it measures both labels of a crossfading pair and lays out for the longer one, so the row never switches layout on a label change. Announce `result.saved` when the label switches | Label crossfades (`base`); height in one frame after the fade |
| Keyboard | System. The pinned footer rides the keyboard with the system curve (`useAnimatedKeyboard`). No custom timing | System |
| System dialogs | System. Confirms and discard prompts keep the native alert | System |

### VoiceOver during motion

- Exits: from frame 0 of any exit, the outgoing copy gets `accessibilityElementsHidden` and `importantForAccessibility="no-hide-descendants"`. This covers a lifted flat lay piece, the old label in a crossfade, the scan sticker and a placeholder after its content has resolved. VoiceOver never reads a stale outfit or two buttons.
- Focus: if the focused element exits, call `setAccessibilityFocus` on the control that opened the collapsing part, and after a Change strip pick focus stays on the tapped alternative. After a list remove, focus the next row, or the previous one if it was the last. A crossfading button keeps focus because it stays one element; its `accessibilityLabel` switches to the new label at once.
- Announcements: one per moment, when the result arrives, never one per piece across a stagger. Use `AccessibilityInfo.announceForAccessibilityWithOptions(text, { queue: true })` with the `copy.md` keys named under each moment.

### Haptics

This file owns haptics; `design-system.md` links here. `expo-haptics` (installed):

- `selection`: a hold selects a piece in the cut-out editor, a scan outline locks, a segment changes. Chips and tiles stay silent, so Closet multi-select never buzzes on every tap.
- `success`: Wear this, Save look, Add N pieces.
- `light` impact: a scan sticker lands in the tray.

Nothing else. No haptic before a system destructive alert: the alert is already the cue.

## Magic moments

Each moment has one component in Lane 1 so every screen gets the same motion: `Silk` (kinds `placeholder`, `sheen`, `busy`, `progress`), `FlatLay` (state `arranging`), `CameraFrame` and `ScanLift` (kept, retuned to tokens). `design-system.md` owns their surfaces; this file owns their timing and the band. Every in-progress state has a `testID` (`moment-loading`, `moment-generating`, `moment-selecting`, `moment-found`) that exists only while the work is actually running, and resolves to the `testID` of its result.

### 1. Loading

One form on every screen: a `Silk` placeholder in the shape of what is coming. Every wait has a known shape:

- Closet tiles, Looks rows, the forecast chip, the "N preparing" row, Today's flat lay on launch: `placeholder` in the component's shape.
- The care label photo while reading, the selfie while "Measuring your colours": `sheen` over the photo.
- The cut-out editor: the photo, or a `placeholder` at the photo's rect until it decodes, then `sheen` over the photo while the mask loads.
- The camera: its ink frame and nothing else until the feed is live.
- A committing Button: `busy`.
- `EmptyState` mark: still, no motion.

No logo spinner, no `ActivityIndicator` anywhere.

| Time | Frame |
|---|---|
| start | The placeholder appears at once, with the target's final size and radius. No fade in, so nothing flickers. Band off. |
| before `wait` | Still. If the content lands now it resolves (below) and no band ever shows. |
| after `wait` | The band crosses the host once (`sheen`, `carry`). |
| then | `wait`, and the pass repeats until resolved, or until `loop` on a screen that is otherwise usable (Sheen, Loop limit). |
| resolve | Content opacity 0 to 1 over the placeholder (`base`, `silk`), no scale, whether it arrives early or late. The band fades out (`quick`). The placeholder is hidden from VoiceOver from the first frame of resolve and unmounts at the end. |

- Increase Contrast: the placeholder gets its 1 pt `lineField` edge (Sheen).
- Text hosts (forecast chip, rows, the "N preparing" row, Tiles with their label, meta and colour line, the FlatLay title and reason line): the placeholder is the real component rendered with its text hidden, so its size follows Dynamic Type and nothing jumps when the text lands at large sizes.
- One clock per screen: a single shared value drives every band on screen, and each host offsets it by its x position, so on the closet grid one light moves across all tiles together like light over cloth, instead of 20 unsynced shimmers.
- Busy Button: the label stays at full opacity, above the band. Primary: the band crosses the fill at peak 0.15. Secondary: the band crosses its fill. Quiet and destructive: the capsule holds the `sunken` fill and the band crosses that (Sheen). `accessibilityState.busy` and `busyLabel` (VoiceOver only) are always set.

Reduce Motion: a placeholder stays still. A sheen host and a busy Button fade the band in still at its centre after `wait` (`base`) and fade it out at resolve (`base`); the Button label never changes. Content resolves with the same `base` fade. The control that started the work sets `accessibilityState.busy`.

VoiceOver: one label per wait. While loading, the grid or list container has `accessible`, `accessibilityState.busy` and the label (`common.loading`, or the wait's own key such as `colours.busy`); at resolve both turn off so the tiles become reachable. The closet grid says "Loading" once, not 20 times.

### 2. Generating

Fabric being arranged. The current thing stays until the new one is ready; only what changes moves.

**Flat lay on Today** (Another, Adjust, Start with these, Show on Today) and **collage in the builder** (Fill the rest):

| Time | Frame |
|---|---|
| tap | The current outfit stays in place. `moment-generating` appears. Nothing moves. The tapped control sets `accessibilityState.busy` until the result row, in every mode. |
| after `wait` | If the stylist has not answered, the `sheen` passes over the pieces (clipped to their alpha) with every piece where it is. The frame never empties. |
| result | Only the slots that changed play the piece swap, in dressing order (top, bottom, layer, shoes, hijab, accessories), `step` apart. Unchanged pieces do not move. The band fades out (`quick`). |
| last swap ends | The reason line and the action row update in place with the label crossfade. |

A second tap mid-swap takes every moving piece from where it is now; nothing resets first.

VoiceOver: one announcement when the result arrives, `today.announce.outfit`, not when the last piece lands.

**Capture tile preparing** (Add pieces grid): the original photo at full opacity under the `sheen`. No visible label; the tile's VoiceOver label carries `capture.statePreparing`, which also appears in the status line. When ready, the cut-out, badge, colour dot and name fade in together over the original in one step (`base`, `silk`), no translate, no scale. VoiceOver announces once when no tile is Waiting or Preparing, with the last count (`capture.readyOne` / `capture.readyMany`).

**Studio, "Clean background"** (confirm and edit): the photo stays, the `sheen` passes over it while the chip shows selected and is busy (`photo.cleanMaking`). Result: the new image crossfades in (`base`, `silk`), no scale. VoiceOver announces `photo.cleanDone`. On failure the original stays and the chip returns with a `quick` crossfade.

**Care label reading**: `sheen` over the label photo; filled fields fade in `step` apart, max 6.

Reduce Motion: the current outfit stays, still. Sheen hosts show the still band from Loading. Changed slots crossfade in place (`base`), no travel, no stagger. Care label fields fade in together (`base`). Everything else resolves with its `base` fade.

### 3. Selecting an object in an image

**Outlines on media.** Every outline and ring drawn over a photo or camera feed (cut-out editor ring and outline, capture group box, scan, selfie oval) sits on the 1 pt solid `ink` halo from `design-system.md` (Colour, Camera and photo): `onMedia` on it is 13.49:1, `blush` 7.12:1, so it reads on white and cream garments as well as dark ones. One state order everywhere: searching is dashed `onMedia`, found is solid `blush`. A dim is always `scrim`.

**Cut-out editor hold** (native, `CutoutEditorView.swift`). The outline is a raster edge image, not a path, so the trace is a sweep that reveals it, as today, retimed.

| Time | Frame |
|---|---|
| finger down | Nothing yet. |
| hold recognised | `minimumPressDuration` unchanged. `selection` haptic. A 72 pt `onMedia` ring, 2 pt stroke on its halo, fades in (`quick`), centred on the touch point and wider than a fingertip, so it stays visible around the finger and never moves. It stays still while the selector runs: no breathing. Replaces the `UIActivityIndicatorView`. |
| found | The ring fades out (`quick`). The mask is applied. The outline layer appears. VoiceOver announces `cutout.selected`. |
| found to + `drape` | Sweep: the gradient mask moves from the touch point outward across the outline (`drape`, `silk`), so the line traces the piece starting where she held it. The area outside the mask dims with `scrim` (`base`). |
| sweep ends | The outline fades out (`base`, `release`). |
| nothing found | The ring fades out (`quick`). VoiceOver announces `cutout.noneFound`. |

Any touch during the sequence ends it at the final state at once, so painting is never blocked. The hint "Hold on a piece to select it" fades out (`quick`) the first time, then its space closes with the inline collapse rule (at once under Reduce Motion), so no gap is left (UC-F05-08).

VoiceOver: the canvas has the custom action `cutout.selectPiece` (most prominent detected piece), or one `cutout.selectPieceN` action per detected piece when there are several; each plays the same found row.

Native timing: `CAMediaTimingFunction(controlPoints: 0.22, 0.61, 0.36, 1)` for `silk`, `(0.16, 1, 0.3, 1)` for `fall`, `(0.32, 0, 0.67, 0)` for `release`.

Reduce Motion (from `UIAccessibility.isReduceMotionEnabled`): the same ring on its halo fades in (`base`), no sweep. On found the mask and dim are applied at once; the outline fades in (`base`), holds (`wait`) and fades out (`base`).

**Capture group "Use this box"**: the drawn box is four edge lines (absolute `View`s, each on its halo) so it can move by transform only. The edges stay `pointerEvents="none"` inside the existing adjustable wrapper (`app/capture/group/[id].tsx:173-186`), so the hit area and the Larger and Smaller actions stay one target that VoiceOver can resize. The wrapper never shrinks below 44 x 44 pt: padding around the snapped frame makes up the difference.

| Time | Frame |
|---|---|
| tap | "Use this box". The box edges stay; the area outside the box dims with `scrim` (`quick`). `sheen` inside the box after `wait`. |
| found | The outline of the found piece appears inside the box with the sweep (`drape`, `silk`). VoiceOver announces `cutout.selected`. |
| sweep ends | Each edge translates to the piece's bounds; horizontal edges scale on x, vertical on y, so line thickness never changes (`settle`, `fall`). The dim lifts (`base`). The adjustable wrapper's `accessibilityValue` updates to the new box. |
| snap ends | The new row enters the list below (list insert) with its thumbnail. The outline fades (`base`, `release`). |

Nothing found: the dim lifts, the box stays as drawn, the row enters. VoiceOver announces `cutout.noneFound`. One announcement per tap.

Reduce Motion: the box shows the still sheen inside it after `wait`. The outline fades in (`base`), holds (`wait`), fades out (`base`). The box crossfades from the drawn frame to the snapped frame. The dim, the mask and the row are in place at once.

### 4. Found clothes in video

Retunes `ScanLift` and the scan overlay to tokens and to the `CameraFrame` states.

| Time | Frame |
|---|---|
| tracking | Each detected piece gets the searching outline: 2 pt dashed `onMedia` on its halo, radius 18, continuous corners. It fades in (`base`, `silk`). It follows each new detection with `quick`, `silk`, from where it is, so the box glides instead of jittering at the detector rate. |
| hold still, over `dwell` | The solid 2 pt `blush` outline fades in over the dashed one (linear on purpose: it is a timer). The dashes closing into a solid blush line is the cue. `selection` haptic when the line is solid. |
| capture | No dim: the outline alone marks the piece (`design-system.md` 17). The sticker (the cut-out, no elevation) fades in on the box (`quick`, `silk`), so it reads as a freeze, not a lift. The outline fades out (`quick`). No scale, no flight. The tray slot is inserted (list insert) and the strip scrolls to it on the UI thread. |
| settle | The sticker fades from the frame (`base`, `release`) while the slot thumbnail fades in and settles in place (`base`, `silk`). |
| landed | The sticker unmounts, `light` impact haptic. VoiceOver announces `scan.pieceAdded`, the one announcement for this capture. `scan.status.taken` stays visible for at least `linger` and is not spoken when `scan.pieceAdded` follows within `linger`. |

Guide pill: every `scan.status.*` change is announced with `AccessibilityInfo.announceForAccessibilityWithOptions(text, { queue: false })`, only when the status actually changes and has held for `dwell`, and at least `announce` after the last scan announcement of any kind (`scan.pieceAdded` and `scan.captureFailed` included), so detector jitter between find, show and hold never makes a burst. The selfie guide follows the same rule. `accessibilityLiveRegion` is not relied on (Android only). The visible text follows the same hold: a new `scan.status.*` shows only after `dwell` (`scan.status.taken` and `scan.captureFailed` at once), and the pill keeps one fixed size, the widest status string in the current language and text size measured in a hidden layer, so only the label crossfades.

The sticker is hidden from VoiceOver for its whole life. Sequencing runs on the UI thread with `withDelay` and `withSequence`; the landing calls back with `scheduleOnRN` from the final animation's completion, replacing the `setTimeout` chain in `ScanLift`.

Selfie oval: `find` to `ready` crossfades dashed to solid (`quick`, `silk`). Reduce Motion: same.

Reduce Motion: an outline fades in once (`base`) and then moves at most once per `dwell`, as a crossfade (old out `quick`, new in `base`) with no travel. Hold still works the same (the solid line fades in over `dwell`). The strip jumps to the new slot (`scrollTo` not animated). On capture the sticker fades in on the box (`base`), holds (`wait`) and fades out (`base`) while the tray thumbnail fades in; it lands when the sticker has faded out.

## Splash

The scarf A drapes in onto a plum tile on the white canvas, then the overlay fades away over a first screen that is already there. UC-F01-01: splash and app share one background, so the ground is white `#FFFFFF`, not the ivory `#FDFBF7` used today; the plum lives only in the tile, like the app icon resting in the middle of the screen.

### Assets

The hanger `splash.png` is retired from the splash. No new drawing:

| File | What | How |
|---|---|---|
| `assets/brand/tile.png` | Plum rounded square, continuous corners, alpha outside | Filled with `plumGround` `#644E64`, the logo's ground, corner radius 22.5 % like the iOS icon mask. The native and the JS splash use this one file |
| `assets/brand/mark.png` | Scarf A in ivory `#F4EDE3` with the blush ribbon, alpha | Exported from the source artwork if it exists. Otherwise `icon.png` keyed against its plum ground; colour-distance keying leaves a plum fringe on the scarf edges, so check it at 3x on the tile before shipping |

Both are bundled with `require` so they decode from the app binary, never the network.

### Native splash (`app.json`)

```json
[
  "expo-splash-screen",
  {
    "image": "./assets/brand/tile.png",
    "imageWidth": 160,
    "backgroundColor": "#FFFFFF"
  }
]
```

The native launch screen is the empty plum tile on white. The scarf is not in it: it drapes in once JavaScript is running. If launch to drape start is over budget (Performance), the still mark goes into the native image and the drape plays only as the hand-off fade.

### Hand-off

1. `SplashScreen.preventAutoHideAsync()` at module scope in `app/_layout.tsx`, and `SplashScreen.setOptions({ duration: 0, fade: false })`: the JS frame is pixel-identical to the native one, so there is nothing to fade.
2. `RootLayout` renders the stack and, above it, a `Splash` overlay (absolute fill, white). Its `tile.png` and `mark.png` image views are hidden from VoiceOver; the overlay container is not, so its error state stays reachable. The overlay draws `tile.png` at the native size and centre (160 pt, safe-area independent, same as the native image), and `mark.png` at the same rect, opacity 0.
3. The overlay's `onLayout` plus `onLoad` of `mark.png` call `SplashScreen.hide()`. From here the overlay owns the screen.
4. The gate (`app/index.tsx`) and Today or onboarding mount underneath while the scarf drapes, so the first screen is complete when the overlay leaves. Until hand-off the stack has `accessibilityElementsHidden` and `importantForAccessibility="no-hide-descendants"`, so VoiceOver cannot reach a screen nobody can see. The screen registers a ref to its first `accessibilityRole="header"` element with the overlay. If the screen's title is a native header, it registers its first content header instead, or registers nothing and focus is left to the system once `accessibilityElementsHidden` is released.

### Sequence (cold launch)

| Time | Frame |
|---|---|
| start | Native splash: white, plum tile. |
| JS ready | Overlay takes over, identical frame. Native splash hidden with no fade. |
| first frame committed | Drape: the scarf A falls onto the tile. Opacity 0 to 1 (`base`, `silk`), translateY -10 to 0 (`drape`, `fall`). |
| hold | Only when the gate does not know the destination at drape end (closet still opening): the overlay keeps the still mark, nothing loops or moves. Past `wait`, announce `common.loading` once (queued). |
| hand-off | At drape end, or at the end of the hold once the destination is known. In one callback: the overlay gets `pointerEvents="none"` and is hidden from VoiceOver, the stack is released, and `setAccessibilityFocus` goes to the registered header (or the system, see Hand-off). The whole overlay (white fill, tile, mark) fades out (`settle`, `silk`). If the destination is Today and its outfit has not loaded, Today shows its `Silk` placeholder flat lay and resolves with the Loading fade; it never plays Generating on launch. |
| hand-off ends | Overlay unmounts. |
| error (M2b) | The closet cannot open: the overlay does not fade out. The tile and still mark keep their rect; the title and Try again fade in below (`base`, `silk`), nothing moves. The overlay sets `accessibilityViewIsModal`; focus moves to the title. Reduce Motion: same fade. Success runs the hand-off above. |

Warm launch (app returns from background, process alive): no overlay, nothing plays. The overlay mounts only once per JS start.

Reduce Motion: the mark fades in (`base`); hand-off when that fade ends; then the overlay fades out (`base`). No fall. Same VoiceOver steps.

## Performance

- All motion runs on the UI thread through Reanimated shared values and worklets. No React Native `Animated`, no `LayoutAnimation`, no `setState` per frame, no `setTimeout` chains for sequencing.
- Per-frame properties: `transform`, `opacity`, colour on control and row fills, and the shadow of the one cut-out under a finger. Never animate `width`, `height`, `top`, `left`, `margin` or `padding` frame by frame. The one exception is Reanimated layout transitions on a single expanding container and its siblings, which Reanimated drives natively after one React commit.
- Times are in milliseconds, never frames, so motion is identical at 60 and 120 Hz. Turn on ProMotion: add `"CADisableMinimumFrameDurationOnPhone": true` to `ios.infoPlist` in `app.json`, or Reanimated stays at 60 Hz on iPhone.
- One sheen clock per screen. The loop stops when the host unmounts or the screen loses focus (`useIsFocused`), so a backgrounded tab costs nothing.
- Stagger caps at 6 items. A grid of 40 new tiles enters as 6 steps, not 40.
- Images in moments are already decoded: `expo-image` with `cachePolicy="memory-disk"`, cut-out stickers sized to their on-screen rect, brand layers bundled.
- Static cut-outs use `elevation.rest`. Only the cut-out under a finger animates its shadow.
- Native moments (cut-out selection) stay in Core Animation in Swift; no bridge round trip per frame.
- Launch: measure cold start from the icon tap to drape start on the owner's iPhone, Release build. Budget: within one `drape`. Over budget: the still mark moves into the native image (Splash, Native splash).
- Budget: no dropped frame during any moment on the owner's iPhone in a Release build. Check with the Perf Monitor and Instruments (Core Animation FPS) for splash, Another, scan capture and the closet grid sheen.

## Testing notes

- Maestro asserts the in-progress `testID`, then the result `testID`, with `extendedWaitUntil` and no minimum time. Do not use `waitForAnimationToEnd` while a sheen loops: the screen never stops changing and the wait times out.
- The in-progress `testID` appears only while work is actually running. A test that needs a slow state uses a fixture delay in the test build, never a minimum hold in the app.
- UC-F12-06 runs every moment with Reduce Motion on: each shows its reduced path and resolves.
- UC-F12-05 (interrupted moments): every moment cancels its shared values on unmount and guards its JS callbacks, so no callback lands on a gone screen.
- UC-F12-07: check that each moment announces once, that no exiting copy is reachable by VoiceOver, and that focus never jumps to the top of the screen.

## Current code to retune (Lane 1)

| Where | Today | Becomes |
|---|---|---|
| `ScanLift.tsx` | `Easing.out(Easing.cubic)` lift to 1.08 with a raised shadow, `setTimeout` then flight | No scale, no flight: the sticker fades out while the tray thumb fades in and settles, with `withDelay` and `withSequence`, `scheduleOnRN` on landing |
| `ScanLift.tsx` | Looping white sweep across the box while holding still | Removed. Hold still is the dashed outline closing into a solid blush line over `dwell` |
| `ScanLift.tsx` | Gleam across the sticker | Removed |
| `ScanLift.tsx` | Flight `Easing.bezier(0.5, 0, 0.2, 1)` | `arrange`, `carry` |
| `app/cutout/[id].tsx` | `ActivityIndicator` while loading or saving | The photo, or a `Silk` placeholder at the photo's rect, then `sheen`; `Button` busy on Done |
| `app/onboarding/colours.tsx` | `ActivityIndicator` | `Silk` sheen over the selfie |
| `src/ui/index.tsx` `Button` | `ActivityIndicator` when busy | `Silk` busy, label at full opacity, `sunken` fill for quiet and destructive, `accessibilityState.busy`, `busyLabel` (VoiceOver only) |
| `CutoutEditorView.swift` | Spinner, `.easeInEaseOut` sweep, delayed fade | Still 72 pt `onMedia` ring centred on the touch point, sweep from touch (`drape`, `silk`) with `scrim`, outline fade (`base`, `release`), `cutout.selectPiece` and `cutout.selectPieceN` actions, Reduce Motion read from `UIAccessibility` |
| `app/capture/scan.tsx` | `scrollToEnd({ animated: false })` | Empty slot inserted, UI-thread scroll to it before the thumb fades in |
| `app.json` | Splash `splash.png`, `#FDFBF7` | `tile.png`, `#FFFFFF`, ProMotion key |

## Review log

Open items for `design-system.md` (other owner, not edited here):

- 17. CameraFrame: merge Found and Locked into one state, solid `blush` on its `ink` halo, so scan, capture group and editor share one order.
- Elevation: `elevation.lift` use is the flat lay piece under a finger only; drop "scan flight into the tray" and "cut-out trace". 17. CameraFrame Lifting: fade from the frame while the tray thumb fades in and settles; no scale, no flight (done).
- 16. Silk: the selfie "Measuring your colours" is `sheen`, not `placeholder`; Reduce Motion is a still band at centre for sheen hosts and for busy (label kept, `busyLabel` VoiceOver only); `busy` on quiet and destructive takes the `sunken` fill; the band stops looping after `loop` on a usable screen.
- 4. Button and 16. Silk already define `busyLabel` as VoiceOver only and busy as keeping the label; no change there.
- 11. FlatLay > Arranging: change to "only changed slots swap, in dressing order, `step` apart; unchanged pieces hold still (`motion.md`, Generating)".
- Haptics: replace the paragraph with a link to `motion.md` > Haptics. Its `warning` before destructive alerts is dropped, and it misses the scan `light` impact and the editor and scan-lock `selection`.
- Reduce Motion: `useReducedMotion()` becomes the `useReduceMotion` hook in `src/ui/motion.ts` (Reduce Motion in code).
- Increase Contrast line: add "a `Silk` placeholder gets a 1 pt `lineField` edge".
- 12. Expander: the link "`motion.md` > Navigation > Inline expand" becomes "`motion.md` > Transitions > Inline expand".

Open items for `use-cases.md` (architect, not edited here):

- UC-F03-02 and UC-F03-07: "lifts, glints, flies into the tray" becomes "fades into the tray" (no gleam, scale or flight).
- 15. EmptyState: `mark.png` alone is ivory on white (about 1.1:1); show it on `tile.png`.

Declined or changed:

- Halo: used the existing 1 pt solid `ink` halo from `design-system.md` instead of `rgba(50,46,40,0.6)`; it gives more contrast and needs no new `mediaHalo` token.
- Splash: hand-off at drape end; Today shows its placeholder.
- Busy Button under Reduce Motion: the still band at centre with the label kept (option a), so no new copy keys and no capsule resize.
- Speech hold: the guide pill still waits for `dwell` before speaking, as `copy.md` (Announcements) specifies; the new `announce` timer owns the rate, and the "ready" merge window is gone, so `dwell` no longer doubles as an announcement window.
- `breathe` merged into `carry`: one ease-in-out curve for anything crossing its host.
