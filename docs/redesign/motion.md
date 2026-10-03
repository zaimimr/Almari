# Almari motion

Date: 2026-10-03. Phase 2 output (plan Task 3). Inputs: `architecture.md`, `use-cases.md`, the spec.

## Language: silk

Things move like fabric put down on a table: they arrive a little high, fall the last few points and come to rest. They never bounce, spring, wobble or overshoot. Motion is short, calm and always means something: something arrived, something moved, something is being made.

Rules that hold everywhere:

1. No springs. `withSpring` is not used in the app. Every animation is `withTiming` with a duration token and an easing token. No raw millisecond value appears outside the Tokens section.
2. No overshoot. Every curve below keeps both y control points at or below 1.
3. Distances are small. Nothing scales, except the box edges in the snap and the `Silk` progress fill (scaleX from the leading edge). Entrances travel 4 to 10 pt; longer moves are the box snap and the M2b tile settle.
4. Only `transform` and `opacity` animate per frame, except Reanimated layout transitions and the native mask sweep (see Performance). Colour only on control and row fills, via `interpolateColor`. Shadow only on the one cut-out under a finger (see `lift`).
5. Every animation can be interrupted. A new target starts from the current value; nothing snaps back first.
6. Nothing waits on motion. Taps work during any animation; results show the moment they arrive; content is in its final place for VoiceOver from the first frame. Two exceptions. The splash: hand-off waits for the drape end, and when the destination is not yet known (the closet is still opening) the overlay holds the still mark until it is, so a Today placeholder never flashes before onboarding. Today: the visible title and reason line crossfade with the last swap, while their VoiceOver labels switch when the result arrives (Generating); and after a warm 21:00 tap only, the swaps wait for the Banner to settle and the Banner text waits for the last swap (`flows/F06-today.md` > Motion).
7. Every moving thing has a Reduce Motion path: layout applies at once, content fades, no travel, no scale, no loops. One exception: the sheen pulse (`flows/F12-app-wide-checks.md`, R). The band fades in place by opacity only, 0 to the host's peak over `sheen` and back, `wait` between, and stops after `loop` on a usable screen (Sheen, Loop limit).

## Tokens

Lives in `src/ui/motion.ts` (Phase 3, Lane 1), next to `theme.ts`. Native code (Swift) uses the same numbers as constants in `CutoutEditorView.swift` and `CAMediaTimingFunction(controlPoints:)`.

### Duration (ms)

| Token | Value | Use |
|---|---|---|
| `quick` | 160 | Exits, `press`, selection fills, fade out of a sheen at resolve, a scan outline gliding to a new detection, the face circle fill easing back, the selfie feed crossfading to the still photo |
| `base` | 240 | Content fading in, every resolve, every Reduce Motion fade, the sheen fading out after `loop` |
| `settle` | 320 | Inline expand and collapse, sibling reflow, box snap, segmented thumb, chevron, splash overlay fade, the M2b tile settle |
| `arrange` | 420 | A piece laid down in the flat lay |
| `drape` | 640 | Splash scarf fall, outline sweep |
| `sheen` | 1100 | One pass of the sheen band |

Timers (not animation lengths):

| Token | Value | Use |
|---|---|---|
| `wait` | 300 | Delay before any loading cue shows, so fast loads never flicker. Pause between two sheen passes. Reduce Motion hold for a cue that goes away (scan sticker, outline); never delays a result |
| `dwell` | 700 | Hold-still threshold on a scan outline (UC-F03-02) and the selfie auto capture hold (the face circle ring fill). A scan status or face guide must hold this long before it shows or is spoken (`copy.md`, Announcements) |
| `step` | 60 | Gap between items entering (max 6, the rest arrive with the 6th), between flat lay pieces, and before inline content or an incoming piece starts |
| `linger` | 1500 | Minimum time `scan.status.taken` and a selfie retake reason stay up before anything replaces them, Reduce Motion included |
| `announce` | 2000 | Minimum gap between two spoken camera statuses (scan guide pill, face circle guide) |
| `loop` | 5000 | Longest the sheen runs, travelling or pulsing, on a host whose screen is otherwise usable; then the band fades out (`base`) and VoiceOver carries the wait until resolve. A full-screen wait keeps the pulse |

### Easing (`Easing.bezier`)

| Token | Value | Use |
|---|---|---|
| `silk` | `Easing.bezier(0.22, 0.61, 0.36, 1)` | Default for anything arriving or moving into place |
| `fall` | `Easing.bezier(0.16, 1, 0.3, 1)` | Last few points of a fall: fast start, long soft tail. Scarf drape, flat lay pieces, box snap, lift returning to rest |
| `carry` | `Easing.bezier(0.5, 0, 0.2, 1)` | The sheen band across a surface |
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
| `scrollSettle` | The scroll view moves by the least distance that shows a target whole, with `scrollTo` from a worklet (`settle`, `silk`), never the native `animated: true` jump. Today: the Undo slot or a Not for me Expander filling below the Footer edge (`design-system.md` 11 > Anatomy, Screen recipes > Today action area). A Rediscover tile does not scroll (Generating) | `scrollTo` not animated |
| `lift` | The one cut-out under a finger (a flat lay piece pressed or dragged) moves from `elevation.rest` to `elevation.lift` (`base`, `silk`) and back on release (`settle`, `fall`). Values live in `design-system.md`, Elevation. Never on a selected tile, the editor or the scan | The shadow steps at once |

### Sheen

The `Silk` band. `design-system.md`, Silk, owns the surfaces; the band itself is defined here.

- One plain soft diagonal band, 20 deg from vertical, 40 % of the host width: transparent, `sheen` `#FAF8F3` at its peak, transparent. No ribbon thread.
- Peak alpha: 0.7 on `sunken` (placeholders, the pressed fill of a busy quiet or destructive Button). Secondary: 0.7 (plum label at least 5.93:1 on every secondary fill). 0.35 over photos and cut-outs, so a garment never washes out to white. 0.15 on plum (busy primary Button), so `onPlum` keeps 4.82:1 over the blend `#7D6D7E`. Never higher on primary (0.2 gives 4.32:1), because at the pulse peak the band covers the whole label at once.
- Z-order: the band is clipped to the image layer and draws under every `scrimPill`, outline, halo, ring and text; it never crosses text except the busy Button label, which sits above it.
- Busy Button: primary and secondary run the band over their fill. Quiet and destructive have no fill, so the capsule takes the `sunken` pressed fill for the whole busy state and the band crosses that at peak 0.7 (`plum` label on it 5.92:1, `error` stays above 4.5:1). A Button whose wait shows on the thing that is coming draws no band (Loading, one visible cue per wait): "Use my location", whose Field shows the wait, and every control that starts Generating, whose flat lay shows it. Not pressable there means `accessibilityState.busy` with presses ignored, never `disabled`, so VoiceOver does not read "dimmed".
- Loop limit (WCAG 2.2.2): on a host whose screen is otherwise usable (placeholders, busy Buttons, capture tile preparing, Clean background, Today and builder Generating), the band travels for `loop`, then fades out (`base`) and stays off until resolve; VoiceOver carries the wait (`accessibilityState.busy`, `busyLabel`, the host's label). Reduce Motion: the pulse (rule 7) runs instead, with the same `loop` stop. A full-screen wait (the editor mask load) runs the pulse after `loop`, in either mode, until it resolves.
- Increase Contrast (`darkerSystemColorsChanged`): a placeholder gets a 1 pt `lineField` edge (3.34:1 on canvas); the band stays.
- Over a flat lay the band is clipped to the pieces' alpha: each piece draws a second copy of its cut-out with `expo-image` `tintColor` `sheen` inside a window that moves with the band. Light falls on cloth, never on the white canvas.

### Reduce Motion in code

- JS: a `useReduceMotion` hook in `src/ui/motion.ts` that seeds from `AccessibilityInfo.isReduceMotionEnabled()` and listens to `reduceMotionChanged`; every moment reads it and branches. Reanimated `useReducedMotion()` is not used: it reads once and misses a change in Settings mid-session. The reduced branch animates `opacity` only, with `base`.
- Pass `reduceMotion: ReduceMotion.Never` on the fades of the reduced branch (as `ScanLift` does). The Reanimated default (`ReduceMotion.System`) jumps straight to the end and the fade would be lost.
- Layout animations: no `LinearTransition` in the reduced branch; entering content uses `FadeIn.duration(motion.duration.base).reduceMotion(ReduceMotion.Never)`.
- Native (`CutoutEditorView.swift`): read `UIAccessibility.isReduceMotionEnabled` and observe `UIAccessibility.reduceMotionStatusDidChangeNotification`, so a change in Settings applies without reopening the editor.
- The travelling band does not run. A placeholder stays still. Every sheen host, the flat lay included, and every busy Button pulse after `wait` at the host's peak (0.15 on a primary Button), until resolve or `loop` (Sheen, Loop limit); at resolve the band fades out (`base`). The Button label never changes; `busyLabel` stays VoiceOver only, with `accessibilityState.busy`.

## Transitions

| Type | Motion | Reduce Motion |
|---|---|---|
| Push and pop | Native iOS stack transition, unchanged. `animation: "default"` everywhere; never `fade`, `slide_from_bottom` or `modal`. Swipe back always works except guarded editors after their first edit. The pushed screen renders complete: no entrance animation on its content. Images that arrive later fade in (`base`, `silk`) | System. Late images fade in (`base`) |
| Pop to a tab after a flow | Capture ends with one `dismissTo` the Closet tab, never a chain. The "N added" bar is already in place in the first frame, with no expand. Only the new tiles fade in (list insert). The same holds for the Today greeting and any banner the app shows on arrival (occasion banner, planning banner, "Tomorrow's outfit"): it is there when the screen is. One exception: a warm 21:00 notification tap (Splash, Notification tap). VoiceOver: move focus to the bar (its label carries the count); no separate announcement | New tiles fade in (`base`) |
| Inline expand | Every `Expander` (Closet More, morning outfit chips, Needs details, Not for me reasons wherever their trigger sits). The one container that grows gets `LinearTransition.duration(settle).easing(silk)`; siblings below get the same transition so they glide down together. Its content enters after `step`: opacity 0 to 1, translateY 4 to 0 (`base`, `silk`). Anchored at its top: nothing above it moves. If the opened part ends below the fold, the scroll view brings the top of the opened part into view, and its end only when the whole part fits the viewport, with `scrollTo` from a worklet (`settle`, `silk`), never the native `animated: true` jump | Layout in one frame, no `LinearTransition`. Content fades in (`base`). `scrollTo` not animated |
| Inline collapse | Content opacity 1 to 0 (`quick`, `release`), then height closes (`settle`, `silk`) with siblings gliding up | Content fades out (`base`), then layout in one frame |
| Expander replaces another | One open per screen (`design-system.md` 12): opening one closes the other. Both height changes run in one `LinearTransition` (`settle`, `silk`). When the closing part sits above the tapped trigger, the scroll offset drops by the closed height in the same frame (`scrollTo` not animated, or `maintainVisibleContentPosition`), so the tapped trigger keeps its place on screen. Then the Inline expand scroll rule applies to the opened part. Focus stays on the trigger | Layout in one frame with the same offset correction; content fades (`base`) |
| Step change in place | One route whose steps swap content (onboarding steps, the selfie's tips, camera and result phases): header and Footer hold still; outgoing content opacity 1 to 0 (`quick`, `release`); incoming after `step`, opacity 0 to 1, translateY 4 to 0 (`base`, `silk`). Scroll to top in one frame. `gestureEnabled: false` between steps, so swipe never means two things. Selfie Footer: the tips Footer ("Open camera") fades out with its phase (`quick`, `release`); the camera phase keeps the Footer slot empty and hidden from VoiceOver; the result Footer ("Save colours") uses Footer entering. VoiceOver: `setAccessibilityFocus` on the incoming step title, which carries the step value (`flows/F01-start.md` M3); selfie phases per F01 S4 | Content crossfade (`base`) |
| Tab switch | None. Native tabs switch instantly and keep each stack. A switch triggered by an action ("Style today", "Show on Today") is also instant; the destination then plays its own moment. Never animate between tabs | Same |
| List insert | Opacity 0 to 1 (`base`, `silk`). Neighbours reflow with `LinearTransition` (`settle`, `silk`). Several at once: `step`, max 6. `Animated.FlatList` uses `itemLayoutAnimation` for the reflow | Fade in (`base`), all at once, no stagger. Neighbours move in one frame |
| List remove | Opacity to 0 (`quick`, `release`), then neighbours close the gap (`settle`, `silk`). A removal after a system confirm starts when the dialog has gone. Also a Rediscover tile once its piece is worn. Not the completeness quick add chips: their set is laid out under the pop (`flows/F11-profile-and-style.md` > Motion, Back on Profile after a change) | Fade out (`base`). Neighbours move in one frame |
| Filter result | Closet category chip, every tap in the More panel, Clear filters, and Put away, Back in the closet and their Undo in Closet select. Replaces List insert and List remove there. The outgoing grid is an absolute overlay, hidden from VoiceOver from frame 0, and fades out (`quick`, `release`); the new grid is laid out at its final place and fades in (`base`, `silk`). Tiles never slide. A category chip sets the scroll offset in that same frame (`scrollTo` not animated) so the filter row sits at the top of the content, keeps focus on the chip and announces `closet.sectionLabel`. A panel tap keeps focus on the tapped chip and announces `closet.resultsOne` / `closet.resultsMany` once the change has held for `wait` (queued); nothing visible is added | Same crossfade at `base` |
| Flat lay piece swap | Outgoing: opacity 1 to 0, translateY 0 to -4 (`quick`, `release`). Incoming starts after `step`: opacity 0 to 1, translateY -6 to 0 (`arrange`, `fall`), at `elevation.rest`. The other pieces do not move. Tapping an alternative in the Change strip applies it with this swap; nothing else plays. Undo plays the same swap back | Crossfade in place (`base`) |
| Selection | Chips, tiles and segments crossfade to their selected fill in `quick`, `silk`. Native switches are not custom-animated. Pressing uses `press`. A flat lay piece under a finger plays `lift` and returns on release. Each flat lay piece's touch area is at least 44 x 44 pt (`hitSlop`), and pieces are exposed to VoiceOver in dressing order (top, bottom, layer, shoes, hijab, accessories), matching the swap order | Same |
| Choice card | Surface in `design-system.md` 18. The art is there from the first frame: no placeholder, no fade, never dimmed, scaled or tinted. Press: `press`, on a selected card too; the selected disc stays while the finger is down. Select: the disc crossfades in (`quick`, `silk`). Single select: the old disc fades out (`quick`, `release`) in the same frame. Multi: the `exclusive` chip and the cards it clears change in the same frame; when a tap clears other cards, VoiceOver hears `choice.clearedOne` or `choice.clearedMany` once (queued), nothing visible is added. No auto advance: the step's Footer (`onboarding.next` alone) is in place from the first frame and does not change on a pick. No haptic | Same |
| Icon toggle | Today outfit card, surface in `design-system.md` 4 > Icon variant: Like, Not for me (thumbs down) and Save look. `press` per press. Like: outline to filled (`quick`, `silk`), off reversed (`quick`, `release`). Save look: outline to filled once with the `success` haptic, the label switches to `today.openLook` at once and `result.saved` is announced; it never reverses. Not for me opens its reasons with Inline expand and is never drawn selected. A new outfit: when its first swap starts, each icon crossfades to the new outfit's state. Labels, states and announcements: `flows/F06-today.md` S1 | Same |
| Segmented thumb | translateX to the chosen segment (`settle`, `silk`). Vertical layout: selection crossfade (`quick`, `silk`), no travel | Thumb crossfades (`base`). Vertical: same as motion |
| Expander chevron | rotate 0 to 180 deg (`settle`, `silk`) | Rotates in one frame |
| `Silk` progress | Fill grows as scaleX from the leading edge (`base`, `silk`). Profile completeness: changes start when Profile is shown again, after the pop transition ends (`transitionEnd`, focused), never while it is visible. The meter eases to its new value and the sentence uses the label crossfade. The quick add chip set is laid out in one frame under the pop, so nothing below the meter moves after `transitionEnd` (`flows/F11-profile-and-style.md` > Motion) | Steps in one frame; the sentence crossfades (`base`) |
| Month change | `MonthGrid`, see Month change below | See Month change |
| Footer entering | Waiting (no action yet): the primary is laid out at opacity 0 from the first frame, so the height is measured and held, then fades in place (`base`, `silk`). Editors: the primary is there from the first frame, disabled, and crossfades to `plum` (`quick`, `silk`) when it can act. No height change | Same fade |
| ResultBar | Footer content and the ResultBar crossfade in the reserved footer: outgoing `quick`, `release`, absolutely positioned and hidden from VoiceOver from frame 0; incoming `base`, `silk`. Height held per the Banners and bars `minHeight` rule. Focus and announcement per `design-system.md` > ResultBar > Focus, which wins | Same crossfade at `base` |
| Banners and bars | A banner the user opens on this screen uses inline expand and collapse. A label that changes in place (`common.saveLook` to `today.openLook`): the old label fades out (`quick`) over the new one, which fades in (`base`). The wrapper holds `minHeight` at the larger measured height until the fade ends; then the height changes via inline expand or collapse. Never a fixed width. Where a row picks horizontal or vertical layout from its labels, it measures both labels of a crossfading pair and lays out for the longer one, so the row never switches layout on a label change. Announce `result.saved` when the label switches | Label crossfades (`base`); height in one frame after the fade |
| Banner arrives on Today | A warm 21:00 tap only. Inline expand, siblings glide, then the changed slots swap; the hero never resizes (`flows/F06-today.md` > Motion) | Layout in one frame with a content fade, then the swap crossfade |
| Keyboard | System. The pinned footer rides the keyboard with the system curve (`useAnimatedKeyboard`). No custom timing | System |
| System dialogs | System. Confirms and discard prompts keep the native alert | System |

### Month change

`MonthGrid`, surface in `design-system.md` 20. Chevrons only: no swipe, no slide. Six week rows are always laid out, so nothing below moves.

| When | Frame |
|---|---|
| month change | The month line and grid crossfade: the outgoing copy is an absolute overlay, hidden from VoiceOver from frame 0, out `quick`, `release`; the incoming is in place, in `base`, `silk`. Most worn, Variety and the nothing-worn line use the label crossfade. Worn days' 40 pt cut-outs hold a `Silk` placeholder until they decode; numbers draw at once. An open day list closes with inline collapse. Focus and announcement per `design-system.md` 20 > Accessibility. |
| a chevron reaching its limit | `wear`: Next on the current month, Previous on the first wear month. `pick`: Previous on the month that holds `from`. The chevron stays in place and crossfades to its disabled look (`quick`, `silk`) with `accessibilityState.disabled` from frame 0; presses are ignored. Nothing disappears, so focus stays on it. Leaving the limit, it crossfades back (`quick`, `silk`). |
| day select | The selected day's disc crossfades in (`quick`, `silk`); the today ring never animates. Its list opens with inline expand. Another day's rows crossfade in place (`quick` out, `base` in), height by the Banners and bars `minHeight` rule. |
| `ax` | The Row list crossfades (`quick` out, `base` in) and its height changes in one frame after the fade (Banners and bars). A day Row opens its wears in a `headless` Expander under it with inline expand, scrolled into view; its `chevron.down` rotates (`settle`, `silk`). |

Reduce Motion: the same crossfades at `base`; the day list, and at `ax` the day Row's Expander, open and close in one frame, the chevron turns in one frame, and the scroll into view is not animated.

### VoiceOver during motion

- Exits: from frame 0 of any exit, the outgoing copy gets `accessibilityElementsHidden` and `importantForAccessibility="no-hide-descendants"`. This covers a lifted flat lay piece, the old label in a crossfade, the scan sticker and a placeholder after its content has resolved. VoiceOver never reads a stale outfit or two buttons.
- Focus: if the focused element exits, call `setAccessibilityFocus` on the control that opened the collapsing part, and after a Change strip pick focus stays on the tapped alternative. After a list remove, focus the next row, or the previous one if it was the last. A crossfading button keeps focus because it stays one element; its `accessibilityLabel` switches to the new label at once.
- Announcements: one per moment, when the result arrives, never one per piece across a stagger. Use `AccessibilityInfo.announceForAccessibilityWithOptions(text, { queue: true })` with the `copy.md` keys named under each moment.

### Haptics

This file owns haptics; `design-system.md` links here. `expo-haptics` (installed):

- `selection`: a hold selects a piece in the cut-out editor, a scan outline locks, a segment changes. Chips and tiles stay silent, so Closet multi-select never buzzes on every tap.
- `success`: Wear this, Save look, Add N pieces.
- `light` impact: a scan sticker lands in the tray, the selfie auto capture fires.

Nothing else. No haptic before a system destructive alert: the alert is already the cue.

## Magic moments

Each moment has one component in Lane 1 so every screen gets the same motion: `Silk` (kinds `placeholder`, `sheen`, `busy`, `progress`), `FlatLay` (state `arranging`), `CameraFrame` and `ScanLift` (kept, retuned to tokens). `design-system.md` owns their surfaces; this file owns their timing and the band. Every in-progress state has a `testID` (`moment-loading`, `moment-generating`, `moment-selecting`, `moment-found`) that exists only while the work is actually running, and resolves to the `testID` of its result.

### 1. Loading

One form on every screen: a `Silk` placeholder in the shape of what is coming. One visible cue per wait: the band shows on the thing that is coming; the control that started it only sets `accessibilityState.busy` and ignores presses. A Button carries the band only when it is the thing that is coming: a committing Button with nothing else on screen showing the wait. Every wait has a known shape:

- Closet tiles, Looks rows, the forecast chip, the calendar's worn-day cut-outs, Today's flat lay on launch: `placeholder` in the component's shape.
- The place Field while "Use my location" finds the city: `placeholder` in the Field's shape, shown only after `wait`, because the Field is already on screen.
- The care label photo while reading, the selfie while "Measuring your colours": `sheen` over the photo (the selfie: over the face circle).
- The Closet progress card: no placeholder and no band; busy is its `Silk` progress line (Generating).
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
| then | `wait`, and the pass repeats until resolved. On a screen that is otherwise usable it stops after `loop`: the band fades out (`base`) (Sheen, Loop limit). |
| resolve | Content opacity 0 to 1 over the placeholder (`base`, `silk`), no scale, whether it arrives early or late. The band fades out (`quick`). The placeholder is hidden from VoiceOver from the first frame of resolve and unmounts at the end. |

- Increase Contrast: the placeholder gets its 1 pt `lineField` edge (Sheen).
- Text hosts (forecast chip, rows, the place Field, Tiles with their label, meta and colour line, the FlatLay title and reason line): the placeholder is the real component rendered with its text hidden, so its size follows Dynamic Type and nothing jumps when the text lands at large sizes.
- One clock per screen: a single shared value drives every band on screen, and each host offsets it by its x position, so on the closet grid one light moves across all tiles together like light over cloth, instead of 20 unsynced shimmers.
- Busy Button: the label stays at full opacity, above the band. Primary: the band crosses the fill at peak 0.15. Secondary: the band crosses its fill at peak 0.7. Quiet and destructive: the capsule holds the `sunken` fill and the band crosses that (Sheen). `accessibilityState.busy` and `busyLabel` (VoiceOver only) are always set.

Reduce Motion: a placeholder stays still. A sheen host and a busy Button pulse after `wait` (rule 7) until resolve or `loop`, and the band fades out at resolve (`base`); the Button label never changes. Content resolves with the same `base` fade. The control that started the work sets `accessibilityState.busy`.

VoiceOver: one label per wait. While loading, the grid or list container has `accessible`, `accessibilityState.busy` and the label (`common.loading`, or the wait's own key such as `colours.busy`); at resolve both turn off so the tiles become reachable. The closet grid says "Loading" once, not 20 times.

"Use my location" follows the one cue rule: `accessibilityState.busy`, presses ignored, never `disabled`, nothing drawn on it, focus kept on it. After `wait` the Field shows its `placeholder` with `place.finding` as its value and busy state; the city and check resolve with the Loading fade, and the city name is announced once (queued). Denied or not found: focus goes to the line in the slot (`flows/F01-start.md` Step 8).

**Palette reveal** (UC-F01-07, UC-F01-21). Measuring resolves to the result phase with Step change in place. The band fades out (`quick`). The circle keeps the still photo; the full arc fades out (`quick`, `release`) as the result fades in. The result phase lays out whole and fades in together (`base`, `silk`), as a capture tile resolves: season line, both `Swatches` rows and "These don't look like me". The Footer follows Step change in place. No stagger, no travel. The result space holds its largest measured height from the first frame (`flows/F01-start.md`), so nothing below moves.

- "These don't look like me": its Expander (Retake, Hair covered, Undertone, Depth, Contrast) opens under it with inline expand and the Inline expand scroll rule, at `ax` too. Nothing is drawn on the circle.
- A change (Hair covered, Undertone, Depth, Contrast): every swatch crossfades to its new colour in place (`base`, `silk`), two layers by opacity, all at once. The season line uses the label crossfade. Row counts stay, so nothing reflows. Each row's `colours.paletteLabel` switches to the new names at once. When the season changes, the new season (`season.*`) is announced once (queued) and focus stays on the control.
- Retake: the camera phase returns with Step change in place and its Loading rule.
- VoiceOver: when the result phase arrives, `setAccessibilityFocus` on the season line, which is a header; no separate announcement. Each `Swatches` row is one element labelled `colours.paletteLabel`; the swatches are hidden (`design-system.md` 19).

Reduce Motion: the phase crossfades (`base`); the arc fades out at `base`; the Expander opens in one frame with a content fade and the scroll is not animated; changes crossfade as above.

### 2. Generating

Fabric being arranged. The current thing stays until the new one is ready; only what changes moves.

**Flat lay on Today** (Another, Adjust, Start with these, Show on Today, a Rediscover tile, tomorrow's outfit from the 21:00 notification on a warm start) and **collage in the builder** (Fill the rest):

| Time | Frame |
|---|---|
| tap | The current outfit stays in place. `moment-generating` appears. Nothing moves. The tapped control sets `accessibilityState.busy` until the result row, in every mode. |
| after `wait` | If the stylist has not answered, the `sheen` passes over the pieces (clipped to their alpha) with every piece where it is. The frame never empties. |
| result | Only the slots that changed play the piece swap, in dressing order (top, bottom, layer, shoes, hijab, accessories), `step` apart. Unchanged pieces do not move. The band fades out (`quick`). |
| last swap ends | The title, the reason line (with its coverage sentence) and the action row update in place with the label crossfade. |

A second tap mid-swap takes every moving piece from where it is now; nothing resets first.

A Rediscover tile runs exactly as Another: Generating on the hero, the changed slots swap, Undo in the Undo slot as after Another, and the reason line names the piece the outfit was built around. No Banner, no scroll, no Section collapse: Rediscover stays fixed while visible and focus stays on the tapped tile.

Ceiling: from the result to the last piece landing, a Today sequence takes at most `settle` + 6 x `step` + `arrange`, including a Banner arriving first (warm 21:00 tap): the Banner's Inline expand, then up to six swaps `step` apart, the last incoming piece starting `step` after its outgoing one and landing over `arrange`. Check it on device. The stylist's own time before the result is not counted. The hero stays 236 pt while a Banner shows and never resizes; the Undo slot under the Footer edge settles the scroll as for any Banner (`design-system.md` 11 > Anatomy).

VoiceOver: one announcement when the result arrives, `today.announce.outfit`, not when the last piece lands. At the same moment the `accessibilityLabel` of `today-title` and `today-reason` switch to the new outfit, as for a crossfading button (VoiceOver during motion, Focus); only the visible crossfade waits for the last swap.

**Capture tile preparing** (Add pieces grid): the original photo at full opacity under the `sheen`. No visible label; the tile's VoiceOver label carries `capture.statePreparing`, which also appears in the status line. When ready, the cut-out, badge, colour dot and name fade in together over the original in one step (`base`, `silk`), no translate, no scale. VoiceOver announces once when no tile is Waiting or Preparing, with the last count (`capture.readyOne` / `capture.readyMany`).

**Closet progress card** (Banner `progress`, `design-system.md` 13, UC-F02-15, UC-F02-23). The card never floats and never moves; only its contents change. The motion never holds a result back.

| State | Motion |
|---|---|
| arrival | In place from the first frame Closet renders with a job in the queue, relaunch included. |
| a count changes | The sentence and meta change with the label crossfade; the `Silk` progress line eases to its new value (`base`, `silk`). Below `ax` the meta keeps one reserved line and the groups that do not fit go into `progress.moreGroups`, so the card never changes height while a job runs. At `ax`, where the meta is not capped, growth keeps the visible tiles in place with `maintainVisibleContentPosition`, as for a collapse. |
| done | The sentence crossfades to `progress.readyOne` / `progress.readyMany` (with the failed count joined); the line holds full; the meta stays. |
| queue empty | "Add N pieces" empties the queue on Add pieces, so Closet comes back with the "N added" Banner in the card's place from its first frame (Pop to a tab after a flow). If the queue empties while Closet is focused, the card leaves with inline collapse. |

- Busy is the line: no sheen and no spinner. `moment-generating` is on the card while a job runs and resolves to the done card.
- Closet not focused (another tab, a push on top): nothing animates. On return the card shows its current state with no catch-up.
- Card above the viewport when it collapses: the layout changes in one frame and the visible tiles keep their place with `maintainVisibleContentPosition`. That works only when the card is a child of the same list as the grid, so the Closet grid sets the prop on the list that holds the card.
- VoiceOver: elements per `copy.md` > F02 and F04 Background tagging. While Closet is focused only the switch to done is announced (queued): `progress.readyOne` or `progress.readyMany`, joined with `capture.failedOne` or `capture.failedMany` when any failed. Count changes are read when focus reaches the card.

Reduce Motion: the line steps in one frame, the text crossfades at `base`, and a collapse is a content fade (`base`) then layout in one frame.

**Studio, "Clean background"** (confirm and edit): the photo stays, the `sheen` passes over it while the chip shows selected and is busy (`photo.cleanMaking`). Result: the new image crossfades in (`base`, `silk`), no scale. VoiceOver announces `photo.cleanDone`. On failure the original stays and the chip returns with a `quick` crossfade.

**Care label reading**: `sheen` over the label photo; filled fields fade in `step` apart, max 6.

Reduce Motion: the current outfit stays, still. Sheen hosts, the flat lay included, pulse (Loading). Changed slots crossfade in place (`base`), no travel, no stagger. Care label fields fade in together (`base`). Everything else resolves with its `base` fade.

### 3. Selecting an object in an image

**Outlines on media.** Every outline and ring drawn over a photo or camera feed (cut-out editor ring and outline, capture group box, scan) sits on the 1 pt solid `ink` halo from `design-system.md` (Colour, Camera and photo): `onMedia` on it is 13.49:1, `blush` 7.12:1, so it reads on white and cream garments as well as dark ones. One state order everywhere: searching is dashed `onMedia`, found is solid `blush`. A dim is always `scrim`. The selfie's face circle ring sits on canvas, never on the photo, and has its own colours (Face circle and auto capture).

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

Reduce Motion: the band pulses inside the box after `wait`. The outline fades in (`base`), holds (`wait`), fades out (`base`). The box crossfades from the drawn frame to the snapped frame. The dim, the mask and the row are in place at once.

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

Reduce Motion: an outline fades in once (`base`) and then moves at most once per `dwell`, as a crossfade (old out `quick`, new in `base`) with no travel. Hold still works the same (the solid line fades in over `dwell`). The strip jumps to the new slot (`scrollTo` not animated). On capture the sticker fades in on the box (`base`), holds (`wait`) and fades out (`base`) while the tray thumbnail fades in; it lands when the sticker has faded out.

**Face circle and auto capture** (`/onboarding/colours`, UC-F01-07, UC-F01-20; surface in `design-system.md` 17 > Face circle). A canvas screen; the circle and its ring are surface (`design-system.md` 17). `selfieGuide` gives the guide per reading, `readyToCapture` (`src/domain/selfieGuide.ts`, architecture Domain touches) decides when the hold is met, and `SelfieCameraView` exposes `capture`, so only JS changes. Tips, camera and result phases replace each other with Step change in place.

| Time | Frame |
|---|---|
| feed live | The circle is `sunken` until the feed is live, then the feed fades in (`base`, `silk`). The dashed ring is there from the first frame the camera is available and never moves, follows or resizes; while permission is asked, after it is denied or when the camera fails it is not drawn (`flows/F01-start.md` S4b > Unavailable). |
| guide changes | A new guide shows only after it has held `dwell` (`ready` at once), with the label crossfade. The line reserves the measured height of the tallest of `selfie.guide.*`, `common.light.mixed`, `colours.retake.no-face` and `colours.retake.failed`, in the current language and text size, in the hidden layer, uncapped at `ax`, so "Choose a recent selfie" (`colours.library`) under it never moves. |
| `ready` | The dashed ring fades out (`quick`, `release`) and the `plum` arc grows clockwise from 12 o'clock in the ring's own lane on canvas: the `circle.hold` shared value (0 to 1) over `dwell`, linear: it is the countdown. Filled against unfilled is `plum` against `canvas`, 6.89, also under Increase Contrast, where neither is swapped. |
| leaves `ready` | The arc eases back to nothing from where it is (`quick`, `release`) and the dashed ring fades back in (`base`, `silk`). Nothing fires. |
| arc full | The arc's `withTiming` completion asks `readyToCapture(guides, now)` through `scheduleOnRN`, and only when that is true calls `capture`. `light` impact haptic. `colours.taken` is announced once (queued). |
| manual | Tap, `activate`, `takePhoto` or `magicTap`, only while a face is found: cancel the countdown, set the arc to full in one frame, then run the arc full and capture rows (same `light` haptic, `colours.taken` once, queued). |
| capture | The feed crossfades to the still photo (`quick`), so the circle freezes on what was taken. The arc stays full. `colours.library` fades out in place (`quick`, `release`). |
| measuring | After `wait`, the `sheen` over the circle (Loading). The circle's label becomes `colours.busy` with `accessibilityState.busy`, and focus stays on it. |
| retake reason | `selfie.guide.dark`, `common.light.mixed`, `colours.retake.no-face` or `colours.retake.failed`: the band fades out (`quick`), the still photo crossfades back to the live feed (`base`), the arc clears (`quick`, `release`) and the dashed ring fades back in (`base`, `silk`), `colours.library` fades back in (`base`, `silk`), and the line shows the reason at once and keeps it for at least `linger` (Reduce Motion included) before any guide can replace it. Focus stays on the circle, whose label now holds the reason; the reason is announced once (`{ queue: true }`), because iOS does not reliably re-read an element that already has focus. |

- The arc is two half rings, each clipped to one half of the ring's box, rotated in turn from `circle.hold`, so it moves by transform only (rule 4) and needs no SVG.
- Capture fires once, from the arc or a manual action; the other is ignored while `capture` is pending and until the feed is live again.
- "Choose a recent selfie" is never disabled or hidden by the countdown; using it cancels the countdown. From capture until a retake it is hidden in place (opacity 0, `pointerEvents="none"`, `accessibilityElementsHidden`, slot kept), so nothing moves (`flows/F01-start.md` S4b > Measuring).
- Leaving the screen cancels the countdown and its callback (UC-F12-05).
- VoiceOver: one element labelled `colours.circleLabel`, an `image` until a face is found, then a `button` with `activate` and `takePhoto` (`flows/F01-start.md` S4b). The feedback line is hidden from VoiceOver, because the circle carries it. Guide changes follow the guide pill rule (`dwell` hold, `announce` gap, `{ queue: false }`). `ready` is not spoken; `colours.taken` is, once. The ring and the arc are hidden.

Reduce Motion: the arc stays, because it is a timer, not travel. The still photo crossfades over the feed (`base`), then the pulse over the circle (Loading). Same haptic.

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
| error (M2b) | The closet cannot open: the overlay does not fade out. The block (tile and mark, `space.xl`, title, `space.xl`, Try again) is measured in the hidden layer and centred between the safe-area insets (`design-system.md` > Screen recipes > Splash error). The tile and still mark move up once, translateY only, from the splash rect to the top of the block (`settle`, `silk`). After `step` the title and Try again fade in (`base`, `silk`). At `ax` the block is a ScrollView and the tile moves to its top the same way. The overlay sets `accessibilityViewIsModal`; focus moves to the title. Reduce Motion: the tile crossfades from the old rect to the new one (`base`) and the title and Try again fade in with it. Success runs the hand-off above. |

Warm launch (app returns from background, process alive): no overlay, nothing plays. The overlay mounts only once per JS start.

Notification tap. Morning (06:00, 07:00, 08:00): cold, splash then Today; warm, nothing plays. 21:00: cold, splash then Today on tomorrow's outfit, never Generating; warm, as Banner arrives on Today (`flows/F06-today.md` > Motion, UC-F06-23). The label crossfade is only for a Banner already on screen.

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
- UC-F12-06 also covers auto capture (real phone), the palette, the progress card, a choice card, the icon toggles, a month change and the M2b settle.
- The progress card has no band; assert `moment-generating`, then the done card, with `extendedWaitUntil`.
- Auto capture: a unit test on `readyToCapture` (`src/domain/selfieGuide.test.ts`): true once `ready` has held `dwell`, false after the guide leaves `ready`. A JS test on the camera feature: `capture` fires once per arc completion, never while a capture is pending, and each manual path (tap, `activate`, `takePhoto`, `magicTap`) fires `capture` once and cancels a running arc.
- UC-F12-06 and UC-F12-07 on the selfie: a retake reason holds `linger` before a guide can replace it and is read once, by announcement, while focus stays on the circle; manual capture with VoiceOver, Switch Control and Voice Control ("Tap Camera"); the feedback line at AX5 in bokmål, the tallest reason measured and the content under the circle scrolling, never clipped.

## Current code to retune (Lane 1)

| Where | Today | Becomes |
|---|---|---|
| `ScanLift.tsx` | `Easing.out(Easing.cubic)` lift to 1.08 with a raised shadow, `setTimeout` then flight | No scale, no flight: the sticker fades out while the tray thumb fades in and settles, with `withDelay` and `withSequence`, `scheduleOnRN` on landing |
| `ScanLift.tsx` | Looping white sweep across the box while holding still | Removed. Hold still is the dashed outline closing into a solid blush line over `dwell` |
| `ScanLift.tsx` | Gleam across the sticker | Removed |
| `ScanLift.tsx` | Flight `Easing.bezier(0.5, 0, 0.2, 1)` | Removed |
| `app/cutout/[id].tsx` | `ActivityIndicator` while loading or saving | The photo, or a `Silk` placeholder at the photo's rect, then `sheen`; `Button` busy on Done |
| `app/onboarding/colours.tsx` | `ActivityIndicator` | `Silk` sheen over the selfie |
| `src/ui/index.tsx` `Button` | `ActivityIndicator` when busy | `Silk` busy, label at full opacity, `sunken` fill for quiet and destructive, `accessibilityState.busy`, `busyLabel` (VoiceOver only) |
| `CutoutEditorView.swift` | Spinner, `.easeInEaseOut` sweep, delayed fade | Still 72 pt `onMedia` ring centred on the touch point, sweep from touch (`drape`, `silk`) with `scrim`, outline fade (`base`, `release`), `cutout.selectPiece` and `cutout.selectPieceN` actions, Reduce Motion read from `UIAccessibility` |
| `app/capture/scan.tsx` | `scrollToEnd({ animated: false })` | Empty slot inserted, UI-thread scroll to it before the thumb fades in |
| `app.json` | Splash `splash.png`, `#FDFBF7` | `tile.png`, `#FFFFFF`, ProMotion key |

## Review log

Declined, revision 2:

- `blush` disc behind a selected Like: not taken; `design-system.md` 4 keeps the filled `ink` symbol with no disc.
- ChoiceCard outer `blushStrong` ring: moot; `design-system.md` 18 dropped it.
- Month change focus: `design-system.md` 20 owns it; a chevron at its limit now stays and shows disabled, so focus no longer moves.
- `scrollSettle` named, with its Reduce Motion path, for the Today Undo slot, Not for me below the Footer edge and the Rediscover tap (the Rediscover tap superseded in revision 3); the face circle is one stroke: the dashed ring gives way to the arc in the same lane (`design-system.md` review round 4).

Revision 3 review, taken: retake reason announced once with focus kept on the circle (F01 aligned); Expander replaces another; the still band replaced by the F12 R pulse everywhere, with `loop` and the 0.15 peak re-justified; a Rediscover tile runs as Another; rule 3 names the box snap and the progress fill; Palette reveal scrolls at `ax`; Save look never reverses; the title and reason labels switch when the result arrives; one visible cue per wait, "Use my location" busy and never `disabled`; secondary peak 0.7; the progress card meta keeps one line below `ax`; the selfie veil and the colour points dropped; the slot's Not for me moved to Inline expand, worded neutrally; a chevron at its limit shows disabled; the ceiling in tokens; Month change column "When".

Declined, revision 3:

- Scroll to top on a Rediscover tap: the blocking fix runs the tile as Another, with no auto scroll.
- M2b tile crossfade for everyone: `design-system.md` keeps the settle, because a crossfade shows two tiles at once.
- Face circle fill over the dashes: one ring is taken as `design-system.md` 17 words it (the dashed ring gives way to the arc in the same lane, one stroke at a time), so the two docs keep one picture.

Raised with other owners, revision 3:

- `flows/F06-today.md` Motion rows "Banner arrives from an action on Today", "Banner leaves", "Rediscover", and S1 > Undo: a Rediscover tile runs as Another (no Banner, no scroll, no Section collapse, Undo in the slot). Its Reduce Motion row: the flat lay pulses; the tapped control draws no band.
- `flows/F01-start.md`: drop the points (S4c item 5, the sketch, S4 VoiceOver, Motion rows "These don't look like me", "Adjust change", "Point drag", UC-F01-07) and the capture veil (Motion row Capture, UC-F01-20). `copy.md` cuts `colours.skin`, `colours.eyes`, `colours.hair` with them.
- `flows/F12-app-wide-checks.md` R, Selfie row: no capture veil. Its open item on `motion.md` Sheen is done.
- `design-system.md`: 20 MonthGrid, a chevron at its limit stays in its slot, disabled, instead of not rendered; 11 and Today action area, no scroll on a Rediscover tap; Screen recipes > Profile, the meter has no `progressbar` role and no value, as `copy.md` and F11 say.
