# Phase 2 sign-off

Date: 2026-10-03. Architect. Checked: `flows/F01` to `F12`, `mockups/index.html`, against `architecture.md` (Owner decisions win), `use-cases.md`, `design-system.md`, `motion.md`, `copy.md`.

## Checks run

| Check | Result |
|---|---|
| Every use case (132 IDs) appears in its flow doc with a States row | Pass. No ID missing, no ID in a flow that is not in `use-cases.md` |
| No floating sheet, modal or toast in any flow or mockup | Pass. Only system dialogs remain (destructive confirms, discard prompts). No `router.replace` into a tab anywhere |
| Hand-off rules 1 to 8 | Pass after fixes. Rule wording in `architecture.md` now uses the copy words (Start with these, Mark as worn, New look, Link as a set, Open look) |
| Components used exist in `design-system.md` | Pass. Every backticked component in the flows is one of the 18 (Text, Screen, HeaderItem, Footer, Button, Section, Row, Chip and ChipRow, Segmented, Field, Tile, FlatLay, Expander, Banner, ResultBar, EmptyState, Silk, CameraFrame). `CardLayout` appears only as "deleted" |
| Motion references exist in `motion.md` | Pass. Every duration token (`quick`, `base`, `settle`, `arrange`, `drape`, `sheen`, `wait`, `dwell`, `step`, `linger`, `announce`, `loop`), easing (`silk`, `fall`, `carry`, `release`), named motion (`press`, `lift`), transition row and magic moment the flows cite is defined |
| Copy keys exist in `copy.md` in both languages | Pass after fixes. 628 keys referenced by the flows, 558 defined. Every remaining difference is a key the flows name as cut, a token (`space.*`, `radius.*`, `elevation.*`), an SF symbol or an accessibility prop. No row in `copy.md` has an empty English or bokmål cell. Keys defined twice carry the same strings |
| Em dash, nynorsk | Pass. None found |

## Per flow

| Flow | Result | Note |
|---|---|---|
| F01 Start | Pass | `splash.label` removed, done step title reinstated, Hair covered rule matches `architecture.md` |
| F02 Add pieces | Pass | Words in `use-cases.md` aligned (Draw a box, outline tap, Confirm N pieces, Blush) |
| F03 Scan | Pass | Scan speed readout follows owner decision 3 (release builds, hidden until long press); UC-F03-06 updated |
| F04 Closet | Pass | `architecture.md` lines the flow listed (35, 87, 88, 89, 99, 100, 137, 139, 152, 154) updated in one pass |
| F05 Piece | Pass | No change needed |
| F06 Today | Pass | Footer holds Wear this alone; Start with Section absorbs From your looks; use cases updated |
| F07 Adjust today | Pass | Use cases already carried Show outfit, When, Choose a date, Save to Your style |
| F08 Change a piece | Pass after fix | Still carried a Footer secondary "Change hijab" and the key `today.changeHijab`, which F06, the Today recipe in `design-system.md` and `copy.md` (key cut) had removed. Removed from entry, S1 item 8, the ASCII frame, the state rows, the copy table and the open items |
| F09 Looks | Pass | No change needed |
| F10 Build a look | Pass | Mockup caption aligned to "Change hijab" |
| F11 Profile and style | Pass after fix | Four new keys the flow asked for were missing from `copy.md`: `style.rules`, `style.rulesSet`, `style.bothLong`, `onboarding.units.label`. Added with the flow's strings |
| F12 App-wide checks | Pass | UC-F12-02 and UC-F12-07 now take their screens and states from the flow's table |
| Mockups | Pass | 44 screens, 11 flow strips. Today footer is Wear this alone, Closet select footer is New look and Start with these, planning screen hides Wear this. No old words |

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
