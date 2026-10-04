# Phase 2 sign-off

Date: 2026-10-03. Architect. Checked: `flows/F01` to `F12`, `mockups/index.html`, against `architecture.md` (Owner decisions win), `use-cases.md`, `design-system.md`, `motion.md`, `copy.md`.

## Checks run

| Check                                                              | Result                                                                                                                                                                                                                                                                                                                |
| ------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Every use case (132 IDs) appears in its flow doc with a States row | Pass. No ID missing, no ID in a flow that is not in `use-cases.md`                                                                                                                                                                                                                                                    |
| No floating sheet, modal or toast in any flow or mockup            | Pass. Only system dialogs remain (destructive confirms, discard prompts). No `router.replace` into a tab anywhere                                                                                                                                                                                                     |
| Hand-off rules 1 to 8                                              | Pass after fixes. Rule wording in `architecture.md` now uses the copy words (Start with these, Mark as worn, New look, Link as a set, Open look)                                                                                                                                                                      |
| Components used exist in `design-system.md`                        | Pass. Every backticked component in the flows is one of the 18 (Text, Screen, HeaderItem, Footer, Button, Section, Row, Chip and ChipRow, Segmented, Field, Tile, FlatLay, Expander, Banner, ResultBar, EmptyState, Silk, CameraFrame). `CardLayout` appears only as "deleted"                                        |
| Motion references exist in `motion.md`                             | Pass. Every duration token (`quick`, `base`, `settle`, `arrange`, `drape`, `sheen`, `wait`, `dwell`, `step`, `linger`, `announce`, `loop`), easing (`silk`, `fall`, `carry`, `release`), named motion (`press`, `lift`), transition row and magic moment the flows cite is defined                                    |
| Copy keys exist in `copy.md` in both languages                     | Pass after fixes. 628 keys referenced by the flows, 558 defined. Every remaining difference is a key the flows name as cut, a token (`space.*`, `radius.*`, `elevation.*`), an SF symbol or an accessibility prop. No row in `copy.md` has an empty English or bokmål cell. Keys defined twice carry the same strings |
| Em dash, nynorsk                                                   | Pass. None found                                                                                                                                                                                                                                                                                                      |

## Per flow

| Flow                  | Result         | Note                                                                                                                                                                                                                                                                      |
| --------------------- | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| F01 Start             | Pass           | `splash.label` removed, done step title reinstated, Hair covered rule matches `architecture.md`                                                                                                                                                                           |
| F02 Add pieces        | Pass           | Words in `use-cases.md` aligned (Draw a box, outline tap, Confirm N pieces, Blush)                                                                                                                                                                                        |
| F03 Scan              | Pass           | Scan speed readout follows owner decision 3 (release builds, hidden until long press); UC-F03-06 updated                                                                                                                                                                  |
| F04 Closet            | Pass           | `architecture.md` lines the flow listed (35, 87, 88, 89, 99, 100, 137, 139, 152, 154) updated in one pass                                                                                                                                                                 |
| F05 Piece             | Pass           | No change needed                                                                                                                                                                                                                                                          |
| F06 Today             | Pass           | Footer holds Wear this alone; Start with Section absorbs From your looks; use cases updated                                                                                                                                                                               |
| F07 Adjust today      | Pass           | Use cases already carried Show outfit, When, Choose a date, Save to Your style                                                                                                                                                                                            |
| F08 Change a piece    | Pass after fix | Still carried a Footer secondary "Change hijab" and the key `today.changeHijab`, which F06, the Today recipe in `design-system.md` and `copy.md` (key cut) had removed. Removed from entry, S1 item 8, the ASCII frame, the state rows, the copy table and the open items |
| F09 Looks             | Pass           | No change needed                                                                                                                                                                                                                                                          |
| F10 Build a look      | Pass           | Mockup caption aligned to "Change hijab"                                                                                                                                                                                                                                  |
| F11 Profile and style | Pass after fix | Four new keys the flow asked for were missing from `copy.md`: `style.rules`, `style.rulesSet`, `style.bothLong`, `onboarding.units.label`. Added with the flow's strings                                                                                                  |
| F12 App-wide checks   | Pass           | UC-F12-02 and UC-F12-07 now take their screens and states from the flow's table                                                                                                                                                                                           |
| Mockups               | Pass           | 44 screens, 11 flow strips. Today footer is Wear this alone, Closet select footer is New look and Start with these, planning screen hides Wear this. No old words                                                                                                         |

## Fixes made

- `flows/F08-change-a-piece.md`: Footer entry "Change hijab" removed everywhere; entries are the flat lay piece and the "Hijab does not match" chip.
- `copy.md`: added `style.bothLong`, `style.rules`, `style.rulesSet` (F11 table) and `onboarding.units.label` (F01 table); `closet.sample` note no longer claims a chip on Your style.
- `use-cases.md`: 45 wording fixes so Maestro text matches `copy.md` and the flows. Among them: "Dusty pink" is "Blush" (no such colour exists), "Compare hijabs" is "tap the hijab in the flat lay", "Saved, open" is "Open look", "today only" dropped from banners, "Drop" is "Discard", "Keep as a set" and "Link as set" are "Link as a set", "Answer for 4" is "Confirm 4 pieces", "Add a piece" is "Draw a box", "Adjust crop" is a tap on the outline, F08 steps have no preview, no "Use this" button and no "Current" mark, UC-F06-08 uses Start with rows, UC-F06-09 chips are Hijab and Knit, UC-F11-01, UC-F11-06 and UC-F03-06 follow owner decision 3, UC-F12-03 names Samling, UC-F12-02 and UC-F12-07 widened.
- `architecture.md`: Shell rules, Screen tree, Inline modes, Flow list, Hand-off rules and Domain touches use the final words (Start with these, Mark as worn with Today or Yesterday, New look, Link as a set, Show outfit, Open look, Back in the closet, Save and update today, Confirm N pieces, Edit colour, Show all). "N added" is a Banner with no "New" mark and no "Mark what I wear most"; Preparing is a Banner without sheen; wear filters sit under More; `/profile/stylist` is not dev-only.
- `mockups/index.html`: F10 caption "Change hijab".

## Remaining risks for Phase 3

1. Colour names in tests: "Blush" and "Mauve" are the nearest named colours to the advocate's "dusty pink". If the owner wants a dusty pink, it is a domain colour addition, out of scope.
2. `today.changeHijab` and `today.compareHijabs` are cut. Any code path that still pins a second Footer button on Today must go; the hijab is reached only through the flat lay (44 x 44 pt uncovered rule in F06 S1) and the reason chip.
3. Open questions 3 and 4 in `architecture.md` still read "dev builds only" above the Owner decisions. The decisions section overrides them; developers must read to the end.
4. Native tab Large Content Viewer for I dag, Garderobe, Samling is unverified (`copy.md` notes). Check NativeTabs early in Lane 1.
5. The scan fixture feed (`ALMARI_SCAN_FIXTURE`) and the clock fixture for new-day use cases (UC-F06-17, UC-F06-18, UC-F07-08) do not exist yet; they gate six Maestro rows.
6. `design-system.md` keeps notes from `copy.md` as asks (blushInk on blushSoft never-list, `lineField` on `sunken` contrast, Button and Chip `minHeight`). `minHeight` is in; the other two are not yet written into the tokens.
7. Hyphenation in bokmål at AX5 depends on the `hyphen/nb-no` patterns being bundled; the expected breaks in `copy.md` need a unit test.
8. Domain touches are approved but untested; each row needs its unit test before the screen that uses it (owner decision 5).

## Open across files

From `design-system.md` review round 4. Each file's owner edits.

- `owner-feedback.md`: the version 1 illustrations are still waiting for owner review. `illustrations-v1.png` now holds all 16 files, `style-mix` included.
- `architecture.md` line 313: 16 files, not 15, and no placeholder (no blush, no `paper`). Line 150, re-render list: every figure on a transparent background, garments and scarves in neutral tones with no blush and no plum, and owner approval before Lane 1. Lines 143 and 150 keep `style-abaya-desi` as the target; until it lands the card uses `style-abaya`.
- `architecture.md` row 99, `copy.md` lines 1056 and 1313: the progress card meta is joined with ", ", not " · ".
- `copy.md` line 1028: `colours.paletteLabel` stays as written; `design-system.md` 19 now matches it.
- `flows/F01-start.md` lines 77, 548 and 559, `flows/F11-profile-and-style.md` lines 262 and 618, `flows/F12-app-wide-checks.md` lines 139 and 352: `blushStrong` is `#9A5A52` at every setting and is no longer swapped under Increase Contrast; `paper` is gone (cards are cut-outs on `canvas`).
- `flows/F01-start.md` lines 332 and 344: the face circle has one stroke; the dashed ring gives way to the `plum` arc in the same lane, with no lane outside it.
- `flows/F11-profile-and-style.md` line 605: done in `design-system.md` (Profile recipe and Silk > `progress`).

## Lane notes

### L3 F01 Start

- L12 reuses from `src/features/onboarding/`: `coverageOptions`, `styleOptionsCards`, `fitOptions`, `hijabStyleOptions` (`illustrations.ts`), `StepPlace`, `StepNotifications`, `StepColours` and `BodyShapes`.
- `/onboarding/colours` saves through `applyAnswer("colours")` and pops, so Profile's Colours answer needs no second save.
- `seasonLabel` and `paletteOf` live in `src/features/selfie/palette.ts` (not in `PaletteResult.tsx`), because `StepColours` and Profile read them too.
- `/onboarding?step=<step>` still opens one step and Next saves and pops, so the old Profile "Change" rows keep working until L12.
- Card selection in Maestro is asserted with `selected: true` (radio) on `card-<id>`. Checkbox cards and chips always report `checked: false` on iOS, so they are asserted with `id` plus `text: "checkbox, checked"` or `"checkbox, unchecked"`.
- `Footer`: a lone primary is now full width, as in the mockup.
- `.maestro/lib/clear.sh` resets the text size to medium, so a large-text flow does not leak into the next flow.
- `skip-onboarding.yaml` taps `onboarding-next` (up to 15 times) until "You are set"; `sample-closet.yaml` taps "Try the sample closet".
- Fixture key `selfie` (seed `selfie.sh`) returns a canned `SelfieReading`, because the simulator analysis rejects stock photos as mixed light. The live analysis is checked by the owner (UC-F01-07 steps 3 and 4).

### L4 Add pieces

- Closet reads `captureProgress(closet)` from `src/domain/importing.ts` for the progress card.
- Closet reads `takeLastAdded()` from `src/state/launch.ts` on focus for the "N added" Banner. Add pieces calls `setLastAdded(ids)` after `acceptImports`, and Add by hand calls it with the one new id.
- `settleWardrobe` runs inside `acceptImports`, so Closet does not settle again.
- A failed job has no cut-out, so its confirm shows "Cut out by hand" disabled until a retry or retake succeeds.

## Phase 3 and 4 done

Finished on 2026-10-04 under a two hour deadline set by the owner. Lanes 9 to 12 gated on `npm run check` only, and L13 was cut to a one-flow-per-feature smoke run, so most Maestro flows were written but not run.

### Lane merges

| Lane                  | Merge          |
| --------------------- | -------------- |
| L1 and L2 foundations | before 285b0a9 |
| L3 Start              | 383856f        |
| L4 Add pieces         | 05de898        |
| L5 Closet             | 2052525        |
| L6 Piece              | b915859        |
| L7 Today              | da071c9        |
| L8 Looks              | 8dde052        |
| L9 Scan               | 3833064        |
| L10 Adjust            | b530091        |
| L11 Build a look      | 39ec829        |
| L12 Profile           | e29db18        |

### Smoke run on the Release build

- Pass: baseline routes, Today another, Closet browse, Looks browse, capture advice.
- Crashes found and fixed in 754ee95: Today crashed on Rediscover when a piece had been worn (timestamp passed as a day), and Profile body crashed on the body shape drawings (Tile ran `in` on a bundled image).
- Fail on test expectations, no crash: adjust make-everyday (session chip), build-look fill (sample shoes), piece detail (`piece-detail` id), profile answers ("Bold", "Feet and °F"), scan auto fixture (no piece found).
- The App Store build failed on the push entitlement from expo-notifications; `plugins/withoutPush.js` removes it.

### Open for after the redesign

- Run every Maestro folder once and fix what fails: piece (18 flows never run), profile, adjust, build-look and scan were never run; today and change-piece had 7 failures in the last L7 gate, several from the simulator "Open in Almari?" prompt.
- AX5: the Today large title does not collapse and covers content; "Change hijab", "Needs details" and "Gammelrosa" break mid-word.
- Discard dialog copy should read "Discard changes?" with "Continue editing".
- Tapping a settings Row should flip its switch.
- Clear filters in Closet keeps the search text.
- Profile skipped: Compare results table, separate Western and Desi stylist sections, feet and inches.
- Adjust skipped: style "Both" and the forecast loading chip.
- Accessibility Inspector audit and the design critic pass were not run.

### Owner-only steps

- Install the TestFlight build on the phone.
- Rebuild the dev client on the phone (`npx expo run:ios --device`), since the cut-out module changed native code.
- Walk the real-phone rows: UC-F01-07 steps 3 and 4, UC-F01-20 (selfie palette), UC-F02-02 (camera), UC-F02-11 (Studio), UC-F03-02 (live scan), UC-F12-07 (VoiceOver).
