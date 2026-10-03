# F11 Profile and style

Routes: `/profile`, `/profile/style`, `/profile/answer/[step]` (step = `place`, `body`, `taste`, `colours`), `/profile/stylist`, `/onboarding` (replay and reset). Entry: Today header `person.crop.circle` (`nav.profile`); Today first run "Set your style"; any styling entry (Start with these, Start with this piece, Plan with this piece, Open plan) when no everyday style exists. Exit: back to Today. Hand-offs: "Save and update today" (`everyday.saveRestyle`) pops to Today, which plays the Generating moment (F06); "Never worn": Profile pops off the Today stack, Closet tab on top, More shows Never worn as its closed value, no expand (F04 States Filtered, UC-F04-11, hand-off rule 7); Most worn pushes the piece, `/piece/[id]` (F05); Colours "Take a selfie" pushes `/onboarding/colours` (F01) and hands its result back to the draft; Show intro again and Delete all data land on onboarding step 1 (F01).

Sources: `architecture.md` (Owner decisions win), `design-system.md`, `motion.md`, `copy.md` F11, `use-cases.md` F11. Before: `screens/before/tab-profile.png` (Profile as a fourth tab, empty space above the first heading, Georgia section headings, five "Change" pills, hijab and coverage under answers, "Open style settings" button, stat cards), `screens/before/today-everyday.png` and `screens/before/today-style.png` (two floating sheets, intro paragraphs, chip labels like "Always include a hijab", the stylist engine mixed into style settings with a help paragraph), `screens/before/today-stylist-results.png` (a sheet on a sheet with an intro paragraph and bordered cards).

What changes: Profile leaves the tab bar and is a push from Today. Everyday style and Style settings merge into one pushed screen, Your style, the only home for hijab and coverage. The style rules fold into one closed Expander. Answer rows become chevron rows with their value under the title, no pills. Stats become rows, and "Never worn" and "Most worn" are doors. Outfit card moves out of the style settings to Profile, next to Language, and applies on tap. The stylist engine moves out of Your style into an Advanced group on Profile (owner decision 3, release builds too): one Stylist row that pushes one screen holding the engine choice and the results, not a sheet on a sheet. Every intro paragraph goes; the privacy line is the only sentence left.

## Screens

### 1. Profile (`/profile`)

Purpose: see your answers, style and closet numbers in one place, and reach each one to change it.

Layout, top to bottom: `Screen` / `Section`s of `Row`s. This is the Tab root order without the large title, Banner and hero; nothing here commits through a primary, so there is no Footer.

1. `Screen`, `leading="back"`, title `profile.title`. No header items. No Footer.
2. `Section` no title:
   - `Row` title `style.title`, `meta` occasion and style joined by " · " ("Everyday · Desi and Western"; `profile.notAnswered` when no everyday style exists), `trailing: "chevron"`, pushes `/profile/style`, VoiceOver hint `common.edit`. Desi and Western show as is; Both shows `style.bothLong` ("Desi and Western" / "Desi og vestlig", new key), because "Both" alone says nothing. Hijab and coverage stay inside Your style. VoiceOver label joins with ", ": "Your style, Everyday, Desi and Western" / "Din stil, {occasion}, Desi og vestlig".
3. `Section` `settings.answers`, four `Row`s, each `title` the step name, `meta` the saved value or `profile.notAnswered`, `trailing: "chevron"`, pushes `/profile/answer/[step]`. VoiceOver hint `common.edit`. The visible meta joins with " · "; the VoiceOver label joins with ", " and puts the group name before a value that means nothing alone.
   - `onboarding.place.title`: units label and city ("cm and °C · Oslo"). Reads "Units and city, Centimetres and Celsius, Oslo".
   - `onboarding.body.title`: height in the chosen units and body shape ("165 cm · Hourglass").
   - `onboarding.taste.title`: fit, colour lean, style lean ("Structured · Bold · Desi"). Reads "Your taste, Fit Structured, Colours Bold, Style Desi".
   - `profile.colours`: the season name only (`season.*`, "Soft autumn").
4. `Section` `stats.title`:
   - `Row` `stats.neverWorn`, `meta` `common.pieceCountOne` / `common.pieceCountMany`, `trailing: "chevron"`. Pops Profile and switches to the Closet tab with Never worn on (UC-F04-11). Not rendered when the count is 0.
   - `Row` `stats.mostWorn`, `leading: { thumb }` (the most worn piece), `meta` `stats.wornOnce` / `stats.wornMany` ("Sage kurta · 5 times"; VoiceOver joins with ", "), `trailing: "chevron"`, pushes `/piece/[id]` (F05). One piece only, the top one. With no wears: the same `Row` with `trailing: { value: stats.nothingWorn }` and no thumb; it does not open anything.
   - Both rows have the same shape: title, count in `meta`, chevron. The piece count is not repeated here; the Closet Section title shows it one tab away (F04 S1 item 6).
5. `Section` `settings.language`: `Segmented` (no label, the Section names it) `settings.language.system`, `settings.language.en`, `settings.language.nb`. The labels wrap at 343 pt, so per the Segmented rule it renders as the vertical list of `Row`s with a trailing `checkmark` on the chosen one. The choice applies on tap and re-renders without a remount (Motion, Language switch). The "English" Row sets `accessibilityLanguage="en"` and the "Norsk bokmål" Row `accessibilityLanguage="nb-NO"`, so each is spoken in its own language whatever the UI language (WCAG 3.1.2).
6. `Section` `style.layout`: the same vertical list of `Row`s as Language, `style.layout.minimal`, `style.layout.reasons`, `style.layout.full`, trailing `checkmark` on the chosen one. Applies on tap, like Language; no Save. Today crossfades the reason line in place the next time it renders. Each Row reads "{option}, Outfit card" ("With reasons, Outfit card").
7. `Section` `settings.advanced`: one `Row` title `stylist.label`, `meta` the chosen engine (`stylist.rules`, `stylist.model` or `stylist.compare`), `trailing: "chevron"`, pushes `/profile/stylist`, VoiceOver hint `common.edit`. One heading above one row; the choice itself lives on the pushed screen.
8. `Section` `settings.app`:
   - `Row` title `settings.replay` in `plum`, no trailing -> system alert `settings.replay.title` / `settings.replay.body`, confirm `settings.replay`, cancel `common.cancel`.
   - `Row` title `settings.reset` in `error`, no trailing -> system alert `settings.reset.title` / `settings.reset.text`, confirm `settings.reset.confirm`, cancel `common.cancel`.
   - Both are full-width Rows like every other tappable line here, with no chevron because they open a system alert, not a screen. Role `button`, no hint.
   - `Text footnote inkMuted` `settings.privacy` (kept: privacy).
   - `Text footnote inkMuted` `settings.version`.

Rows without `onPress` (Pieces 0 in Empty, no pieces; Most worn with `stats.nothingWorn`) are plain text elements: no button trait and no hint, so VoiceOver never offers a button that does nothing.

```
+--------------------------------------+
| <            Profile                 |
|                                      |
| Your style                         > |
| Everyday · Desi and Western          |
|                                      |
| Your answers                         |
| Units and city                     > |
| cm and °C · Oslo                     |
| ------------------------------------ |
| Body                               > |
| 165 cm · Hourglass                   |
| ------------------------------------ |
| Your taste                         > |
| Structured · Bold · Desi             |
| ------------------------------------ |
| Colours                            > |
| Soft autumn                          |
|                                      |
| Closet stats                         |
| Never worn                         > |
| 4 pieces                             |
| ------------------------------------ |
| [th] Most worn                     > |
|      Sage kurta · 5 times            |
|                                      |
| Language                             |
| Follow phone                       ✓ |
| English                              |
| Norsk bokmål                         |
|                                      |
| Outfit card                          |
| Outfit only                          |
| With reasons                       ✓ |
| With reasons and checks              |
|                                      |
| Advanced                             |
| Stylist                            > |
| Rules                                |
|                                      |
| App                                  |
| Show intro again                     |
| ------------------------------------ |
| Delete all data                      |
| Stays on this phone. Your city goes  |
| to Apple, Clean background photos    |
| to Cloudflare.                       |
| Version 1.4.0                        |
+--------------------------------------+
```

Bokmål meta lines: "{occasion} · Desi og vestlig", "Strukturert · Sterke · Desi", "{name} · 5 ganger".

Primary action: tap a row to change it. There is no Footer primary because every change here happens on the screen it opens, or on tap (Language, Outfit card).

### 2. Your style (`/profile/style`)

Purpose: set what you wear: the everyday request and the style rules every outfit starts from. One screen replaces Everyday style and Style settings.

Layout, top to bottom (Editor recipe):

1. `Screen`, `leading="cancel"` (`common.cancel`, wired to `useDiscardChanges`), title `style.title`. No header items. `onAccessibilityEscape` calls the same Cancel handler, so the VoiceOver two-finger scrub never pops past the discard alert.
2. `Section` no title. Every block is a labelled control, `space.lg` apart:
   - `ChipRow` label `style.occasion`, single, `wrap`, `occasion.*`. Required: always holds a value; tapping the selected chip keeps it.
   - `Segmented` label `style.style`: `style.desi`, `style.western`, `style.both`. Required.
   - With no everyday style (onboarding skipped, UC-F06-01) the draft starts at occasion Everyday and style Both, the values `finishOnboarding` writes; everything else starts unset. Occasion and Style therefore always hold a value.
   - `ChipRow` label `style.hijab`, single: `hijab.always`, `hijab.sometimes`, `hijab.notNeeded`. Nothing selected when never answered (`architecture.md` > Domain touches, `hijabAnswered`); same block as F01 step 1.
   - `ChipRow` label `coverage.levelLabel`, single: `coverage.full`, `coverage.moderate`, `coverage.own` (the labels wrap inside their chips). The "Own line" chip carries `accessibilityState.expanded` true or false, as an Expander header does.
   - Only with `coverage.own`: `ChipRow` label `coverage.sleevesLabel` (`coverage.toElbow`, `coverage.toWrist`, `coverage.anyLength`) and `ChipRow` label `coverage.hemLabel` (`coverage.toCalf`, `coverage.toAnkle`, `coverage.anyLength`), single. They open in place under Coverage.
   - `Segmented` label `adjust.yourDay`: `adjust.indoors`, `adjust.outside`. Required, `adjust.indoors` by default (a stored unset value reads as Mostly indoors), so Adjust (F07) always has a value to preselect.
   - `Expander` plain, title `style.rules`, closed by default, closed `value` `style.rulesSet` (the count of rules set) or `style.none` when none is set. Body: seven `ChipRow`s, single, `wrap`, `style.none` first and selected when unset. The body opens in place with inline expand.
     - `style.belt`: `style.none`, `style.belt.yes`, `style.belt.no`.
     - `style.topLength`: `style.none`, `style.topLength.*`.
     - `style.bottoms`: `style.none`, `style.bottoms.*`.
     - `style.prints`: `style.none`, `style.prints.yes`, `style.prints.no`.
     - `style.wedding`: multi, `style.wedding.white`, `style.wedding.black`.
     - `style.dupatta`: `style.none`, `style.dupatta.yes`, `style.dupatta.no`.
     - `style.region`: `style.none`, `style.region.*`.
3. Save error, only after a failed write: `Text footnote error` `common.error.save` as the last content block, directly above the Footer. At `ax` it is the second to last block, directly above the quiet Save.
4. `Footer`:
   - No everyday style yet (first run, styling entries): one full-width primary `everyday.saveRestyle`. There is no today's outfit to keep, so `common.save` is not rendered.
   - An everyday style exists: a stacked pair, always stacked and full width (`copy.md` F11), secondary `common.save` above, primary `everyday.saveRestyle` below. Both disabled from the first frame until something changed, both with the one disabled recipe (`inkDisabled` on `sunken`, `accessibilityState.disabled`). On the first change the secondary takes the `plumSoft` fill and `plum` label and the primary the `plum` fill.
   - Occasion and Style always hold a value, so the lone primary is enabled from the first frame and the Footer never waits on them.

Option labels: every `Chip`, segment and vertical-list `Row` on this screen sets `accessibilityLabel` to "{option}, {group label}", because several groups share option words ("Any", "Any length") and iOS reads no group name when focus enters an option. Examples: "Any, Belt over long pieces" / "Uansett, Belte over lange plagg", "Always, Hijab" / "Alltid, Hijab", "Any length, Hem" / "Alle lengder, Lengde", "Own line, Coverage, expanded". The same pattern holds for the Outfit card Rows on Profile and the Stylist Rows. Language is the only exception (Review log). Voice Control takes the same label, so "Tap Any, Region" picks one chip.

```
+--------------------------------------+
| Cancel        Your style             |
|                                      |
| Occasion                             |
| [Everyday] (Work) (Dinner or dawat)  |
| (Eid) (Party or mehndi)              |
| (Wedding or nikah) (Barat)           |
|                                      |
| Style                                |
| (  Desi  | Western  |  [Both]  )     |
|                                      |
| Hijab                                |
| [Always] (Sometimes) (Not needed)    |
|                                      |
| Coverage                             |
| [Full: wrist and ankle]              |
| (Moderate: elbow and mid-calf)       |
| (Own line)                           |
|                                      |
| Your day                             |
| ( [Mostly indoors] | Time outside )  |
|                                      |
| +----------------------------------+ |
| | Style rules              2 set v | |
| +----------------------------------+ |
+--------------------------------------+
| (            Save                  ) |
| [       Save and update today      ] |
+--------------------------------------+
```

`[ ]` marks the selected chip (blush fill, `blushStrong` edge); `( )` an unselected chip. First run shows only the lower Footer button.

Primary action: `everyday.saveRestyle` saves and pops to Today with the new outfit. `common.save` saves and pops to the screen that pushed Your style (Profile), keeping today's outfit. From a styling entry with no everyday style (hand-off rule 2), `everyday.saveRestyle` lands on Today with the pieces kept and the session banner present on arrival.

### 3. Change an answer (`/profile/answer/[step]`)

Purpose: change one onboarding answer without replaying onboarding.

Layout, top to bottom (Editor recipe; no `progress`, no `common.skip`):

1. `Screen`, `leading="cancel"` (wired to `useDiscardChanges`), title the step name (`onboarding.place.title`, `onboarding.body.title`, `onboarding.taste.title`, `profile.colours`). No header items. `onAccessibilityEscape` calls the same Cancel handler.
2. Step content:
   - **place**, one `Section` without a title: `Segmented` label `onboarding.units.label` ("Units" / "Enheter", new key): `onboarding.units.metric`, `onboarding.units.imperial` (VoiceOver `onboarding.units.metricLabel`, `onboarding.units.imperialLabel`). `Field` label `onboarding.city.label`, then `Button secondary small` `onboarding.city.find`. Under it one line only: `Text body` `onboarding.city.found`, or `Field` error `onboarding.city.notFound` / `common.offline`. No privacy note here; `settings.privacy` on Profile covers it, and `onboarding.city.privacy` stays in onboarding (F01).
   - **body**, two sibling `Section`s: first without a title, `Field` `onboarding.height.label` (metric), or two `Field`s `onboarding.height.feet` and `onboarding.height.inches` under the visible label `onboarding.height.labelImperial` (imperial). Then `Section` `onboarding.shape.question`: `Tile` `grid` of body-shape drawings (`tint`), single select, `shape.*` labels.
   - **taste**, one `Section` without a title: `ChipRow` label `onboarding.fit.question` (`onboarding.fit.loose`, `onboarding.fit.structured`, `onboarding.depends`); `ChipRow` label `onboarding.colourLean.question` (`onboarding.colourLean.bold`, `onboarding.colourLean.soft`, `onboarding.depends`); `ChipRow` label `onboarding.styleLean.question` (`style.desi`, `style.western`, `style.both`). Single, optional, because an unanswered taste has no value. Each `Chip` reads "{option}, {group label}": "It depends, Fit" / "Kommer an på, Passform".
   - **colours**, one `Section` without a title: `Text headline` the draft season name (`season.*`), or `Text body inkMuted` `profile.notAnswered`. It is the screen's only value line. Its `accessibilityLabel` is `colours.season` ("Season: Soft autumn" / "Sesong: ..."); the visible text stays the bare name. Then `Row` `colours.selfie`, leading icon `camera`, trailing `chevron`, the same Row as F01 step 5: pushes `/onboarding/colours` (F01, UC-F01-07). From this entry the selfie does not write; its result replaces the draft (season line and selected swatch) and pops back here with the Footer Save enabled. Then `ChipRow` label `onboarding.colours.swatch`, single, each `Chip` with `swatch` and the skin-tone name. Each Chip reads "{skin-tone name}, Skin tone" / "{name}, Hudtone"; the swatch dot is hidden from VoiceOver. On a selected chip the swatch edge is `ink` (7.12 on blush), not `lineField`, so light skin tones keep their outline. Every change on this screen commits through Save.
3. Save error, only after a failed write: `Text footnote error` `common.error.save` as the last content block, directly above the Footer. The draft stays.
4. `Footer` primary `common.save`, disabled from the first frame until the draft differs from the saved answer (and, for body, the height is valid). Save pops to Profile; the row shows the new value.

```
+--------------------------------------+
| Cancel        Your taste             |
|                                      |
| Fit                                  |
| (Loose) [Structured] (It depends)    |
|                                      |
| Colours                              |
| [Bold] (Soft) (It depends)           |
|                                      |
| Style                                |
| [Desi] (Western) (Both)              |
|                                      |
|                                      |
+--------------------------------------+
| [              Save                ] |
+--------------------------------------+
```

```
+--------------------------------------+
| Cancel        Units and city         |
|                                      |
| Units                                |
| ( [cm and °C] |   ft and °F   )      |
|                                      |
| City                                 |
| | Oslo                            |  |
| (  Find city  )                      |
| Weather for Oslo                     |
|                                      |
+--------------------------------------+
| [              Save                ] |
+--------------------------------------+
```

```
+--------------------------------------+
| Cancel          Colours              |
|                                      |
| Soft autumn                          |
|                                      |
| [cam] Take a selfie                > |
|                                      |
| Skin tone                            |
| (o Fair) [o Light] (o Medium)        |
| (o Tan) (o Deep)                     |
+--------------------------------------+
| [              Save                ] |
+--------------------------------------+
```

Primary action: `common.save`. Saving taste writes fit, colour lean and style lean; the everyday style's Style follows only when the style lean changed (UC-F11-03). There is no hijab row here; Your style holds it.

### 4. Stylist (`/profile/stylist`)

Purpose: choose the stylist engine and read how Rules and Model compare on stored feedback, per style.

Layout, top to bottom:

1. `Screen`, `leading="back"`, title `stylist.label`. No header items. No Footer.
2. `Banner notice` `stylist.unreadOne` / `stylist.unreadMany` ("Not read yet: 2 pieces" / "Ikke lest ennå: 2 plagg", rephrase for the copy owner), only when pieces have no photo reading. No actions. Present on arrival.
3. `Section` without a title: vertical list of `Row`s `stylist.rules`, `stylist.model`, `stylist.compare`, trailing `checkmark` on the chosen one. Applies on tap, like Language. Each Row reads "{option}, Stylist" ("Rules, Stylist").
4. `Section` `style.desi`, two `Row`s, no `onPress` (plain text elements, no button trait, no hint):
   - `title` `stylist.rules`. With data, `meta` three lines: `stylist.wouldWear`, `stylist.notMyStyle`, `stylist.wore`, a rate as `stylist.rate`. With no feedback and no wears in this style, `meta` is the single line `stylist.noFeedback`.
   - `title` `stylist.model`, same meta.
   - VoiceOver label starts with the Section name and joins the parts with ". " so each gets a pause: "Desi, Rules. Would wear, top three: 3 of 8, 38 percent. Not my style: 1 of 8, 13 percent. Worn: 2"; "Desi, Model. No feedback yet". The visible title stays "Rules" / "Model".
5. `Section` `style.western`, same two `Row`s.

Section titles carry the header trait, so the rotor jumps Desi to Western. Desi comes first, as in every Style control.

```
+--------------------------------------+
| <              Stylist               |
|                                      |
| +----------------------------------+ |
| | Not read yet: 2 pieces           | |
| +----------------------------------+ |
|                                      |
| Rules                              ✓ |
| Model                                |
| Compare                              |
|                                      |
| Desi                                 |
| Rules                                |
| Would wear, top three: 3 of 8 (38%)  |
| Not my style: 1 of 8 (13%)           |
| Worn: 2                              |
| ------------------------------------ |
| Model                                |
| No feedback yet                      |
|                                      |
| Western                              |
| Rules                                |
| ...                                  |
+--------------------------------------+
```

Primary action: tap an engine Row. Back pops to Profile, whose Stylist row shows the new value. The table arrives complete with the screen (architecture Magic moments decision). Today never shows the engine name.

## States

| State | Screen | What shows |
|---|---|---|
| Empty, no everyday style | Profile | Your style row `meta` `profile.notAnswered`. The row still pushes Your style |
| Empty, unanswered | Profile, answer | Answer rows `meta` `profile.notAnswered`. Colours step value line `profile.notAnswered`. Taste chips start with none selected |
| Empty, no pieces | Profile | Closet stats: only `Row` `closet.addPieces` with `trailing: "chevron"` pushing `/capture` (F02, hand-off rule 5). Never worn and Most worn are not rendered (UC-F12-01) |
| Empty, nothing worn | Profile | `Row` `stats.mostWorn` with value `stats.nothingWorn`, no chevron. Never worn row shows every piece |
| Empty, no feedback | Stylist | Each result Row's `meta` is the single line `stylist.noFeedback`. Both Sections still show |
| First run | Your style from Today first run | The first-run card exists only when onboarding was skipped (UC-F06-01), so no everyday style exists. The draft starts at occasion Everyday and style Both, the values `finishOnboarding` writes; the rest is unset. Footer is the lone primary `everyday.saveRestyle`, enabled from the first frame because Occasion and Style always hold a value. Cancel with no change pops to Today with no prompt. It pops to Today, which plays Generating (UC-F06-01) |
| First run | Your style from a styling entry | Same screen, same lone primary. `everyday.saveRestyle` lands on Today with the kept pieces and the session banner already in place (hand-off rule 2) |
| Loading | Profile | The closet is open before Today renders, so Profile renders complete. On a cold deep link before it opens: answer and stat `Row`s are `Silk placeholder` `row` shapes; the list carries `common.loading` and `accessibilityState.busy` |
| Loading | Your style, answer | Same rule: renders complete; on a cold deep link the controls are `Silk placeholder` `chip` shapes and the Footer is already there, disabled |
| Generating | All | None on these screens. "Save and update today" hands off to Today, which plays the Generating moment (F06). Stylist has no generating state: it is a synchronous read (UC-F11-06) |
| Busy | Your style | The pressed Footer button shows `Silk busy`; the other takes the disabled look per the in-flight rule. Both looks after `wait` |
| Busy | Answer | Footer `common.save` `Silk busy`. `onboarding.city.find` `Silk busy` while the lookup runs |
| Busy | Profile, Stylist | Language, Outfit card and Stylist Row lists: in-flight rule, disabled look only after `wait`. Show intro again and Delete all data: `Silk busy` on the pressed Row after its alert has gone; while the replay or reset runs, every other control on Profile takes the in-flight disabled look after `wait` |
| Error, save | Your style | `Text footnote error` `common.error.save` directly above the Footer (at `ax`, directly above the quiet Save), announced; the scroll view brings it into view (`settle`, `silk`). Draft kept, Footer stays enabled, focus stays on whichever Save was pressed |
| Error, save | Answer | Same, above `common.save`. Draft kept (UC-F11-03) |
| Error, input | Answer | Body: `Field` error `onboarding.height.invalid` / `onboarding.height.invalidImperial`, Save disabled. Place: `Field` error `onboarding.city.notFound` |
| Error, write | Profile, Stylist | Language, Outfit card or Stylist write fails: `footnote` `error` `common.error.save` directly under that Row list; the old value stays selected. Show intro again or Delete all data fails: `footnote` `error` `common.error.save` directly under that Row; the user stays on Profile (UC-F11-05). Announced once per the shared rule; focus stays on the control |
| Discard | Your style, answer | Cancel or swipe back after a change: system alert `common.discardTitle`, actions `common.keepEditing` and `common.discard` (destructive). Swipe back is off after the first change (`gestureEnabled: false`). The VoiceOver escape scrub calls the same handler through `onAccessibilityEscape`, so it shows the alert too. A selfie result counts as a change. Lane 1 device check: change a value, two-finger scrub, `common.discardTitle` shows |
| Offline | Answer, place | `onboarding.city.find` offline: `Field` error `common.offline`, distinct from not found (UC-F01-04). Everything else in this flow is local and does not change (UC-F12-04) |
| Permission denied | Answer, colours | Not on this screen. "Take a selfie" pushes `/onboarding/colours`, which owns camera permission, its `EmptyState` with `common.openSettings` and `colours.library` (F01, UC-F01-07) |
| Accessibility sizes (AX1 to AX5) | All | Row values move under the title; chevrons stay trailing. Every `Segmented` is the vertical `Row` list. `ChipRow`s wrap. Body-shape `Tile` grid goes to 1 column. Header Cancel becomes `xmark` with its label in VoiceOver and the Large Content Viewer. Your style Footer: at `ax` only `everyday.saveRestyle` stays pinned and `common.save` becomes a `quiet` Button at the end of the scroll content, after the save error when there is one. Privacy line wraps in full. Nothing truncates or clips up to AX5. At AX5 the pinned "Lagre og oppdater i dag" wraps to two or more lines; Lane 1 checks on device that the pinned Footer leaves the Style rules Expander reachable by scroll and never covers the save error |
| Bokmål | All | "Profil", "Din stil", "Svarene dine", "Enheter og by", "Kropp", "Din smak", "Farger", "Garderoben i tall", "Plagg", "Aldri brukt", "Mest brukt", "Ingenting brukt ennå", "Språk", "Følg telefonen", "Antrekkskort", "Avansert", "Stilist", "Regler", "Modell", "Sammenlign", "Stilregler", "Vis introen igjen", "Slett alle data", "Versjon {version}". Your style Footer "Lagre" and "Lagre og oppdater i dag". Switching to "Norsk bokmål" re-renders Profile in place; the user stays on Profile (UC-F11-04). When the in-app language differs from the phone's, VoiceOver speaks the strings with the matching voice through the F12 B rule (native `UIApplication.shared.accessibilityLanguage`, updated on every switch) (WCAG 3.1.1). Lane 1 checks this on device in both directions, including that focus lands on the chosen Language Row and is read again in the new voice. It screenshots in nb at default and xLarge: answer place Units "cm og °C / fot og °F" sit near the wrap point; each must switch cleanly to the vertical list and never truncate |
| Reduce Motion | All | Fallbacks per Motion below |

## Motion

All tokens from `motion.md`.

| Where | Motion |
|---|---|
| Today -> Profile, Profile -> Your style, answer, Stylist, piece, and back | Push and pop: native stack transition. Pushed screens render complete, no entrance animation. The Most worn thumb, if it decodes late, fades in (`base`, `silk`) |
| "Never worn" -> Closet | Profile pops off the Today stack, Closet tab on top: tab switch, none, instant. More shows Never worn as its closed value, no expand (F04) |
| "Take a selfie" -> `/onboarding/colours` and back | Push and pop. On return the season line changes in place with the label change (old `quick`, new `base`), the selected swatch crossfades (`quick`, `silk`) and the Footer Save crossfades to enabled (`quick`, `silk`) |
| Chip tap | Selection crossfade (`quick`, `silk`). No haptic (chips stay silent) |
| `Segmented` change (Style, Your day, Units) | Segmented thumb: translateX (`settle`, `silk`), `selection` haptic. Vertical list (Language, Outfit card, Stylist engine): selection crossfade (`quick`, `silk`), `selection` haptic |
| Outfit card change | Applies on tap on Profile, no Save. Today crossfades the reason line in place (`base`, `silk`) the next time it renders |
| Coverage "Own line" chosen | Sleeves and Hem open with inline expand: the block grows (`settle`, `silk`), the sections below glide down together, content enters after `step` (opacity, translateY 4 to 0, `base`, `silk`). Choosing Full or Moderate closes them with inline collapse (`quick`, `release`, then `settle`, `silk`). Nothing above moves |
| Style rules Expander | Inline expand on open, inline collapse on close, chevron rotates (`settle`, `silk`). The closed value changes in place with the label change |
| Footer, editors | Both buttons are there from the first frame with the disabled look (`inkDisabled` on `sunken`). The primary crossfades to `plum` (`quick`, `silk`) on the first change. The secondary crossfades from the disabled look to the `plumSoft` fill and `plum` label at the same moment. No height change |
| Save | `Silk busy` on the pressed button after `wait` (band `sheen`, `carry`). On success the screen pops; no ResultBar, the destination shows the result |
| "Save and update today" | Pop to Today. Today plays the Generating moment: the current outfit stays, only changed slots swap in dressing order, `step` apart (`arrange`, `fall`) |
| Save error, discard | Error text fades in (`base`, `silk`) and the scroll view brings it into view with `scrollTo` from a worklet (`settle`, `silk`). Discard: system alert |
| City found or not found | The line under Find city appears with inline expand; a changed line uses the label change in place |
| Language switch | No animation. Strings re-render in place in the same frame, with no remount (no root `key={locale}`), so the scroll offset holds. Then the chosen Row gets `AccessibilityInfo.setAccessibilityFocus`, so VoiceOver reads it again in the new voice |
| Stats and answer values | Label change in place when a value changes on return: old text out (`quick`), new text in (`base`), height held until the fade ends |
| Show intro again, Delete all data | System alert. After it has gone, the pressed Row shows `Silk busy` (after `wait`). Then the stack is reset to `/onboarding` step 1 with the native transition; onboarding renders complete |
| Stylist | Push only. No `Silk`, no `moment-generating`: the Sections are in place in the first frame |
| Reduce Motion | Push and pop: system. Segmented thumb crossfades (`base`). Sleeves and Hem, and the Style rules Expander: layout in one frame, content fades in (`base`); collapse fades out (`base`) then layout in one frame. Expander chevron: rotates in one frame. City found or not found line: layout in one frame, the line fades in (`base`); changed text crossfades at `base`. Cold deep link `Silk placeholder` `row` and `chip` shapes stay still and resolve with a `base` fade. Busy: the still band fades in at its centre after `wait` (`base`). Label changes crossfade at `base`. `scrollTo` not animated. Today's swap after "Save and update today" crossfades in place (`base`) |

VoiceOver: answer rows read "{step}, {value}" with group names before bare values ("Your taste, Fit Structured, Colours Bold, Style Desi") and hint `common.edit`. The Your style row reads "Your style, Everyday, Desi and Western" and the Stylist row "Stylist, Rules", both with hint `common.edit`. The Never worn row reads "Never worn, 4 pieces"; the Most worn row reads "Most worn, Sage kurta, 5 times". Rows without `onPress` are plain text elements, no button trait, no hint. Every `Chip`, segment and option `Row` in a labelled group reads "{option}, {group label}" ("Any, Belt over long pieces", "Always, Hijab", "It depends, Fit", "Own line, Coverage", "With reasons, Outfit card", "Rules, Stylist", "Light, Skin tone"), because iOS has no radiogroup trait and does not read the group label on entry. Language Rows read their own name only, in their own language (`accessibilityLanguage` "en" and "nb-NO"); the Section title names the group. When the in-app language is not the phone's, the voice follows the F12 B rule (native `UIApplication.shared.accessibilityLanguage`). A Segmented change is not announced; the selected state carries it. Save errors are announced once (`common.error.save`), and focus stays on the pressed button or control. "Own line" carries `accessibilityState.expanded`; after Sleeves and Hem open, focus stays on it and it reads "expanded". The Style rules Expander header carries `accessibilityState.expanded` and follows the shared focus rule. Stylist result Rows start with their Section name and read with ". " between parts ("Desi, Rules. ..."); Section titles are headers. Your style and every answer screen wire `onAccessibilityEscape` to `useDiscardChanges`. Focus on arrival: after "Never worn", the Closet More header ("More, Never worn"); after Show intro again or Delete all data, the onboarding step 1 title; after a selfie returns, the season line, read "Season: Soft autumn" (`colours.season`). After a language switch, the chosen Row gets `AccessibilityInfo.setAccessibilityFocus` and is read again in the new language.

## Copy

Keys from `copy.md` F11 unless noted.

| Where | Keys |
|---|---|
| Today header | `nav.profile` (F06) |
| Profile title | `profile.title` |
| Your style row | `style.title`, `occasion.*`, `style.desi`, `style.western`, `style.bothLong` (new), `profile.notAnswered`, `common.edit` (VoiceOver hint) |
| Your answers | `settings.answers`, `onboarding.place.title`, `onboarding.body.title`, `onboarding.taste.title`, `profile.colours`, `profile.notAnswered`, `common.edit` (VoiceOver hint), `onboarding.units.metric`, `onboarding.units.imperial`, `onboarding.units.metricLabel`, `onboarding.units.imperialLabel`, `shape.*`, `onboarding.fit.*`, `onboarding.colourLean.*`, `onboarding.styleLean.question`, `season.*` |
| Closet stats | `stats.title`, `stats.pieces` (Empty, no pieces only), `stats.neverWorn`, `common.pieceCountOne`, `common.pieceCountMany` (F04), `stats.mostWorn`, `stats.wornOnce`, `stats.wornMany`, `stats.nothingWorn`, `closet.addPieces` (F01) |
| Language | `settings.language`, `settings.language.system`, `settings.language.en`, `settings.language.nb` |
| Outfit card | `style.layout`, `style.layout.minimal`, `style.layout.reasons`, `style.layout.full` |
| Advanced | `settings.advanced`, `stylist.label`, `stylist.rules`, `stylist.model`, `stylist.compare`, `common.edit` (VoiceOver hint) |
| App | `settings.app`, `settings.replay`, `settings.replay.title`, `settings.replay.body`, `settings.reset`, `settings.reset.title`, `settings.reset.text`, `settings.reset.confirm`, `common.cancel`, `settings.privacy`, `settings.version` |
| Your style | `style.title`, `style.occasion`, `style.style`, `style.hijab`, `hijab.always`, `hijab.sometimes`, `hijab.notNeeded`, `coverage.levelLabel`, `coverage.full`, `coverage.moderate`, `coverage.own`, `coverage.sleevesLabel`, `coverage.hemLabel`, `coverage.toElbow`, `coverage.toWrist`, `coverage.toCalf`, `coverage.toAnkle`, `coverage.anyLength`, `adjust.yourDay`, `adjust.indoors`, `adjust.outside` (F07), `style.rules` (new), `style.rulesSet` (new), `style.belt`, `style.belt.yes`, `style.belt.no`, `style.topLength`, `style.topLength.*`, `style.bottoms`, `style.bottoms.*`, `style.prints`, `style.prints.yes`, `style.prints.no`, `style.wedding`, `style.wedding.white`, `style.wedding.black`, `style.dupatta`, `style.dupatta.yes`, `style.dupatta.no`, `style.region`, `style.region.*`, `style.none` |
| Your style Footer | `common.save`, `everyday.saveRestyle` |
| Answer, place | `onboarding.place.title`, `onboarding.units.label` (new), `onboarding.units.metric`, `onboarding.units.metricLabel`, `onboarding.units.imperial`, `onboarding.units.imperialLabel`, `onboarding.city.label`, `onboarding.city.find`, `onboarding.city.found`, `onboarding.city.notFound`, `common.offline` |
| Answer, body | `onboarding.body.title`, `onboarding.height.label`, `onboarding.height.labelImperial`, `onboarding.height.labelVoice`, `onboarding.height.feet`, `onboarding.height.feetLabel`, `onboarding.height.inches`, `onboarding.height.inchesLabel`, `onboarding.height.invalid`, `onboarding.height.invalidImperial`, `onboarding.shape.question`, `shape.*` |
| Answer, taste | `onboarding.taste.title`, `onboarding.fit.question`, `onboarding.fit.loose`, `onboarding.fit.structured`, `onboarding.depends`, `onboarding.colourLean.question`, `onboarding.colourLean.bold`, `onboarding.colourLean.soft`, `onboarding.styleLean.question`, `style.desi`, `style.western`, `style.both` |
| Answer, colours | `profile.colours`, `season.*`, `colours.season` (VoiceOver label), `profile.notAnswered`, `colours.selfie`, `onboarding.colours.swatch` |
| Answer Footer | `common.save` |
| Stylist | `stylist.label`, `stylist.unreadOne`, `stylist.unreadMany`, `stylist.compare`, `style.desi`, `style.western`, `stylist.rules`, `stylist.model`, `stylist.wouldWear`, `stylist.notMyStyle`, `stylist.wore`, `stylist.rate`, `stylist.noFeedback` |
| Discard, errors, loading | `common.discardTitle`, `common.keepEditing`, `common.discard`, `common.error.save`, `common.loading` (F12) |

New keys for the copy owner: `style.rules` "Style rules" / "Stilregler"; `style.rulesSet` "{count} set" / "{count} valgt"; `style.bothLong` "Desi and Western" / "Desi og vestlig"; `onboarding.units.label` "Units" / "Enheter". Changed strings: `stats.wornOnce` / `stats.wornMany` visible "{name} · once" / "{name} · {count} times" ("{name} · én gang" / "{name} · {count} ganger"), VoiceOver keeps ", "; `stylist.unreadOne` / `stylist.unreadMany` "Not read yet: 1 piece" / "Not read yet: {count} pieces" ("Ikke lest ennå: 1 plagg" / "Ikke lest ennå: {count} plagg"). VoiceOver option labels are built from existing keys ("{option}, {group label}"), no new keys.

## Use cases

| ID | Screen | State |
|---|---|---|
| UC-F11-01 Read the profile | 1 Profile: Your style row (occasion and style), Your answers (4 rows), Closet stats (Never worn, Most worn), Language, Outfit card (applies on tap), Advanced, App; "Never worn" -> Closet tab, More shows Never worn; Most worn -> piece | empty (no style, unanswered, no pieces, nothing worn), loading, largest text, bokmål |
| UC-F11-02 Set your style | 2 Your style: occasion, style, hijab (Always / Sometimes / Not needed), coverage with Own line Sleeves and Hem, Your day, Style rules Expander; Footer `common.save` or `everyday.saveRestyle` -> Today Generating | first run (lone primary, draft starts at Everyday and Both), busy, error above the Footer, discard (including VoiceOver escape), largest text (secondary moves into the scroll at `ax`), bokmål |
| UC-F11-03 Change an answer | 3 Answer: place (feet), body (no Skip, Cancel), taste (row reads "Structured · Bold · Desi", Your style's Style follows), colours (swatch, "Take a selfie" push, result fills the draft) | error above Save with draft kept, input errors, discard, offline (city), largest text |
| UC-F11-04 Switch language | 1 Language `Segmented` (vertical list): Norsk bokmål, then Follow phone | bokmål, in place, no remount, no jump to Today, focus back on the chosen Row, VoiceOver voice follows, error under the control |
| UC-F11-05 Replay onboarding or reset | 1 App: Show intro again and Delete all data Rows, each a system alert, busy on the Row, rest of Profile disabled, then onboarding step 1 | busy, error under the Button |
| UC-F11-06 Choose the stylist engine and compare | 1 Advanced: Stylist Row -> 4 push: engine Row list (applies on tap), Desi and Western results | empty (one `stylist.noFeedback` line per Row), unread Banner, no generating state, bokmål |
| UC-F11-07 Read privacy and version | 1 App: privacy line and version, last on the screen | largest text |

App-wide rows this flow answers: UC-F12-01 (Profile stats with no pieces offer Add pieces), UC-F12-02 (largest text), UC-F12-03 (bokmål), UC-F12-04 (offline only changes the city lookup). Entries owned by other flows that land here: UC-F06-01 ("Set your style" -> 2), UC-F04-11 (lands from "Never worn"), UC-F01-07 (Profile Change colours "Take a selfie"), UC-F07-01 (Your day lives in Your style).

## Review log

- Owner decision 3 overrides UC-F11-01 and UC-F11-06 ("dev builds", "absent in a release build"): the stylist engine and its results live in release builds under `settings.advanced`, placed after Language and Outfit card so they stay out of the main path. Advanced holds one Row, `stylist.label` with the engine as its value, that pushes `/profile/stylist`; the engine list and the results share that screen, so only one heading sits above each control. Architect to update the two use case rows, the `/profile/stylist` line in the screen tree and the "Stylist section on Profile" line in Route changes. `stylist.results` is no longer used; copy owner can drop it.
- Outfit card (`style.layout`) moved from Your style to Profile, after Language: it is a display setting, so it follows Language's commit model (applies on tap) and Your style keeps only what you wear. Architect to move "Outfit card" from UC-F11-02 to UC-F11-01.
- UC-F11-03 asks for "a small header with Cancel and Save". `design-system.md` HeaderItem says commits never live in the header, and every editor has a Footer primary, so Save is the Footer `common.save`. Maestro taps "Save" either way.
- UC-F11-01 and UC-F11-03 say "Change" on answer rows. The before screen had five Change pills; here the whole row is the target with a chevron and `common.edit` as the VoiceOver hint, the same as every other row that opens something. Maestro taps the row title.
- UC-F11-05 says "Replay onboarding" and "Reset all data"; `copy.md` names them `settings.replay` ("Show intro again") and `settings.reset` ("Delete all data"). Maestro selects the `copy.md` text.
- UC-F11-02 says "Save and restyle today" and "Save, keep today's outfit"; `copy.md` renames them to `everyday.saveRestyle` ("Save and update today") and `common.save` ("Save"). With no everyday style yet only `everyday.saveRestyle` is rendered; Maestro first-run flows tap that one.
- Hijab, Coverage and Taste use single `ChipRow`s, not `Segmented`, because an unanswered value is allowed and a Segmented always holds a value. Your day is a required `Segmented` with Mostly indoors as default, the same control as on Adjust (F07), so the same choice looks the same on both screens. Style rules use `ChipRow`s with `style.none` first for the same reason, matching the current `unset` option.
- `coverage.necklineUnchecked` is in `copy.md` F11, but the current app shows it with the Today checks (`useToday.ts`), not on the style screen. This flow does not place it; F06 owns it.
- Row has one trailing slot, so a value and a chevron cannot share it. Rule used here: a row that only shows puts its value trailing (Pieces 0, Most worn with nothing worn); a row that opens something puts its value in `meta` and keeps the chevron (answers, Never worn, Most worn, Your style, Stylist).
- Pieces is dropped from the populated Closet stats: the Closet Section title shows the count one tab away (F04 S1 item 6), and without it the Section holds two doors of one shape. `stats.pieces` 0 stays only in Empty, no pieces, above `closet.addPieces`.
- Show intro again and Delete all data are full-width `Row`s with no chevron (both open a system alert), so every tappable line on Profile is a Row. Design-system owner to add a Row title tone (`plum` for an action, `error` for a destructive one) and the `Silk busy` look for a pressed action Row.
- Units gets the visible label `onboarding.units.label`, so it matches the labelled City Field below it. F01 step 2 may adopt the same key.
- The answer place step drops `onboarding.city.privacy`; `settings.privacy` one screen back says the same. The note stays in onboarding (F01).
- `closet.sample` ("Sample") is dropped from Your style, and with it the "sample note" in UC-F11-02. The title is a native header, so `copy.md`'s "chip by the title" has no place to sit, and a lone "Sample" line says nothing to VoiceOver. The prefilled values are a starting point the user edits either way. Copy owner can cut the `everyday.sampleNote` mapping; architect to drop "sample note" from UC-F11-02.
- Style rules key: no existing key names the group, so `style.rules` and `style.rulesSet` are new (Copy section). Copy owner to add them to `copy.md` F11.
- Language Rows are the only option Rows that do not take the "{option}, {group label}" pattern. Their names are already unique, and a suffix like ", Språk" would be spoken in the Row's own voice, not the UI voice. Units segments keep `metricLabel` and `imperialLabel`, which are unique and already say what they are.
- F01 step 5 owner: from the Profile colours entry, the selfie's final action returns the result to the caller instead of writing. Only the Profile entry changes; onboarding still writes on its own save.
- Copy owner: `stylist.rate` in bokmål "({percent} %)" needs a no-break space (U+00A0) before "%", and `stylist.unreadMany` needs one between {count} and "plagg", so neither splits at AX sizes. This doc writes only under `flows/`, so the change is left to `copy.md`.
- Contrast and target checks from review pass and need no change: ink/canvas 13.49, ink/surface 12.84, ink/sunken 11.59, ink/blush 7.12, inkMuted/canvas 5.40, inkMuted/surface 5.14, inkMuted/sunken 4.64, plum/canvas 6.89, plum/surface 6.56, plum/plumSoft 6.02, onPlum/plum 6.89 (4.82 under the busy band), error/canvas 7.23, error/surface 6.88, error/sunken 6.21, blushStrong/canvas 3.21 and surface 3.06, lineField chip edge on surface 3.18, swatch ink edge 11.59 on sunken and 7.12 on blush; Row and Footer buttons 52, Chip, segment, Expander header, small Button and header items 44.
- Both Footer buttons on Your style use the one disabled recipe (`inkDisabled` on `sunken`). While disabled they read as off together; on the first change both take their enabled fills at once, so no one-off secondary look is needed.
