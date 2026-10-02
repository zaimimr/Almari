# Part 10: Profile tab, onboarding polish and a smarter outfit builder

> **For agentic workers:** Use superpowers:executing-plans to implement this plan task by task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give the app a Profile tab with her answers, style settings, app settings and closet stats; make onboarding a full screen flow with Back, body shape drawings, a live selfie camera with a head guide and draggable sample points; and let the outfit builder use the active stylist to fill, rank, swap and name.

**Architecture:** Rules stay pure in `src/domain` and are tested with `tsx --test`: `profileStats.ts` (closet stats), `onboarding.ts` (`previousStep`), `selfieGuide.ts` (live instruction from a camera reading), `colourAnalysis.ts` (`resampleColours`) and `builder.ts` (request, fill, ranking, swaps, auto name). The native module `modules/closet-vision` gains a front camera view (`SelfieCamera`, AVCaptureSession with Vision face rectangles on frames, no new dependency) and returns the points the selfie analysis used, plus `sampleSelfie` for one point. Screens only call domain functions.

**Tech Stack:** Expo SDK 57, React Native 0.86, expo-router native tabs, Swift with AVFoundation and Vision, TypeScript, `node:test` through `tsx`, Maestro on the "Closet Development" simulator.

**Decided by the owner (2 October 2026):** Profile is a fourth tab ("Profile", bokmål "Profil", SF symbol `person.crop.circle`). Onboarding is full screen with Back on every step but the first and Skip kept. Body shapes get line drawings. The selfie uses a live front camera with an oval head guide and live instructions, library pick stays as the fallback. After capture she can drag skin, hair and eye points. The builder gets Fill the rest, a ranked strip, swap per slot and an auto name.

## Global constraints

- No comments in code. Never the em dash character. English and bokmål only, never nynorsk.
- Every user-facing string goes through `t()` with `en` and `nb` entries; `npm run strings` passes.
- Minimum code, existing style, `npx prettier --write` on changed files.
- UI copy: labels and values only.
- The selfie photo is deleted after Save or when she leaves the screen. Nothing leaves the phone.
- Commits straight to `main`, conventional prefixes, no attribution lines.

## Decisions

- **Camera:** neither `expo-camera` nor face detection in it is needed. Expo camera has no live face detection since SDK 51, so the camera is a native view in `closet-vision` (`AVCaptureSession`, front wide camera, `AVCaptureVideoPreviewLayer`), with AVFoundation face metadata on the live frames, read about six times a second. Each reading reports whether a face is seen, its box in view coordinates, roll and yaw, the face brightness and how much the face moved since the last reading. `capture()` writes a JPEG to the temporary folder. The simulator has no camera, so the view reports `unavailable` and the screen falls back to the library.
- **Guide:** `selfieGuide(reading)` returns one instruction in order of priority: no face, too dark, move closer, move back, centre your face, face the camera, hold still, ready. The capture button is always enabled; the instruction only guides.
- **Sample points:** `analyzeSelfie` adds `points` (skin on one cheek, eyes on one iris, hair on the hair area or above the forehead when no hair was found) in 0 to 1 image coordinates, a sample `radius` per part, and the white balance `gains`. `sampleSelfie(uri, part, x, y, radius, gains)` returns the balanced Lab colour of a disc at that point. The decoded selfie is cached natively for the last uri. `resampleColours(profile, part, lab)` re-derives undertone, depth, contrast and season.
- **Body shapes:** six neutral line figures drawn as SVG in `assets/shapes/` and rendered to PNG at 1x, 2x and 3x with `rsvg-convert` (no `react-native-svg`). They are tinted with `expo-image` `tintColor`.
- **Builder:** `builderRequest` starts from today's active request (or the everyday style, or a plain everyday request), keeps her picked pieces and uses the wardrobe of the picked pieces. Fill the rest calls `styleOutfits` with the active engine (`engineFor`) and keeps the first outfit. The strip is ranked by the score of picked plus that piece, with pieces that break a hard rule (second main, wrong style, other wardrobe, unavailable) last. Swap uses `replacementsFor` and shows the best three. The name follows `outfitName` until she types her own.
- **Profile tab:** `app/(tabs)/profile` holds the content of `app/today/profile.tsx` (removed) and adds a Style settings button that opens `/today/style`, and Closet stats. Today loses its Profile header button; Style settings loses its Edit your answers link.

## Tasks

### Task 1: Profile tab

- [ ] Test `closetStats(closet)` in `src/domain/profileStats.test.ts`: counts pieces in the active wardrobe without archived ones, most worn top three by wear count (undone events ignored, ties by name), never worn count.
- [ ] Implement `src/domain/profileStats.ts`.
- [ ] Add `app/(tabs)/profile/_layout.tsx` and `index.tsx`; add the tab to `Tabs.native.tsx` and `Tabs.tsx`; remove `app/today/profile.tsx`, its route in `app/_layout.tsx`, the Today header button and the style settings link.
- [ ] Strings: `nav.profile`, `stats.*`, `profile.style`.
- [ ] Update `.maestro/onboarding/settings.yaml`, `answers*.yaml` for the tab.
- [ ] `npm run check`, commit `feat: add a Profile tab with answers, settings and closet stats`.

### Task 2: Full screen onboarding with Back and body drawings

- [ ] Test `previousStep` in `src/domain/onboarding.test.ts`: none for the first step, the step before otherwise.
- [ ] Onboarding and colours screens headerless with their own top bar (Back or Cancel, progress).
- [ ] Draw six body shape SVGs, render PNGs, show them in a body shape grid.
- [ ] Commit `feat: full screen onboarding with Back and body shape drawings`.

### Task 3: Builder with the stylist

- [ ] Test `src/domain/builder.test.ts`: request from today, fill keeps picks and completes, conflict explains, ranking puts best first and hard breaks last, swaps per slot, auto name follows pieces until edited.
- [ ] Implement `src/domain/builder.ts` and wire `app/look/build.tsx` (Fill the rest, ranked strip, tap preview piece for swaps, auto name).
- [ ] Commit `feat: fill, rank, swap and name in the outfit builder`.

### Task 4: Live selfie camera

- [ ] Test `selfieGuide` in `src/domain/selfieGuide.test.ts` at every threshold.
- [ ] Native `SelfieCameraView.swift` with the `onReading` event, `capture` and `unavailable`.
- [ ] `src/features/SelfieCamera.tsx` with the oval guide and instruction line; colours screen uses it with the library fallback.
- [ ] Commit `feat: live front camera with a head guide for the selfie`.

### Task 5: Draggable sample points

- [ ] Test `resampleColours` in `src/domain/colourAnalysis.test.ts`.
- [ ] Native: points, radius and gains from `analyzeSelfie`, `sampleSelfie`.
- [ ] Result screen: frozen selfie with three draggable dots, live swatch and season; file deleted on Save, Try again or leaving.
- [ ] Commit `feat: drag the skin, hair and eye points on the selfie`.

### Task 6: Verify and record

- [ ] `npm run check`, `npm run strings`, `npx expo-doctor`, `npx expo export --platform ios --platform web`.
- [ ] Release build on the simulator, Maestro flows in `.maestro/profile-onboarding-builder`, screenshots in `planning/build/profile-onboarding-builder`.
- [ ] STATUS.md Part 10 section with owner checks for the live camera and dragging on her iPhone.
