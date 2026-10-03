# F11 Profile and style

Routes: `/profile`, `/profile/style`, `/profile/answer/[step]` (step = `name`, `place`, `body`, `colours`), `/profile/never`, `/profile/wear-more`, `/profile/stylist`, `/onboarding` (replay and reset), `/onboarding/colours` (from the Colours answer). Entry: Today header `person.crop.circle` (`nav.profile`); Today first run "Set your style"; any styling entry (Start with these, Start with this piece, Plan a day, Open plan) when no everyday style exists (hand-off rule 2). A morning notification tap lands on Today, never here. Exit: back to Today.

Hand-offs:

- "Save and update today" (`everyday.saveRestyle`) pops to Today, which plays the Generating moment (F06).
- Completeness quick add chips push the screen that holds the answer and pop back to Profile, where the meter settles to its new value (hand-off rule 10, UC-F11-08). `quick.details` pops Profile and switches to the Closet tab with Needs details on (F04, UC-F04-13).
- "Never worn": Profile pops off the Today stack, Closet tab on top, More shows Never worn as its closed value, no expand (F04, UC-F04-11, hand-off rule 7).
- "Most worn" pushes its piece, `/piece/[id]` (F05). The wear calendar lives in Looks, reached from the Looks header only (F09).
- "I'll never wear" keeps matching pieces out of the next outfit, the Change strip and Fill the rest (F06, F08, F10). "Trying to wear more of" puts its pieces first in Rediscover (F06, UC-F06-21).
- Colours "Take a selfie" pushes `/onboarding/colours` (F01). "Save colours" there writes the colours, as in onboarding, and pops back to the Colours answer with the new season and swatches.
- Morning outfit chips set the one daily notification; its tap opens Today, or "Tomorrow's outfit" at 21:00 (F06, UC-F06-23).
- Show intro again and Delete all data land on onboarding step 1 (F01).

Sources: `architecture.md` (Owner decisions, Open questions 8, Revision 1 and 2 changes, Inline modes rows 116 to 119, Domain touches), `owner-feedback.md` rounds 1 and 2, `advocate-walkthroughs.md` (Revision 1 walk, architect response: C11-01 to C11-05, C1-01, C1-04), `design-system.md` (Profile and Editor recipes, ChoiceCard, Swatches, Expander > Uses), `motion.md`, `copy.md` F11, Revision 1 > F11 Profile and the F01 flow design additions, `use-cases.md` F11. Before: `screens/before/tab-profile.png`, `screens/before/today-everyday.png`, `screens/before/today-style.png`, `screens/before/today-stylist-results.png`. What exists in code: `closetStats` (`src/domain/profileStats.ts`), `StyleProfile` with `fit`, `colourLean`, `styleLean`, `coverageLevel` (`full`, `moderate`, `own`), the style rules, `colour`, `Styling.units`; nothing else below exists yet and each new read is a Domain touches row (`completeness`, `neverWear`, `wearMore`, `hijabStyles`, `hijabAnswered`, `coverageAnswered`, `hasAnyWear`, `sparkle`, `Coverage` `relaxed`, `Styling.name`, `Styling.notification`, `Place.source`, `paletteFor`).

What changes in revision 1:

- Profile opens with the completeness meter and up to three quick add chips (round 2, item 14).
- Your style gains Hijab styles, Fit and Sparkle for events and becomes one list of closed Expander rows, title and value, one open at a time. Coverage, Everyday style, Fit and Hijab styles open onto the onboarding's illustrated cards (round 1, items 3 and 4; round 2, item 1; C11-05). Coverage gains Relaxed and No preference; My own limit stays here only.
- Two new rows under Your style, "I'll never wear" and "Trying to wear more of", each a push that saves at once (round 2, item 13; C11-03, C11-04).
- Your answers: Name, Location, Body, Colours (round 2, items 3 and 4). Location is onboarding step 8 as drawn: "Use my location", then the search Field. Your taste is gone: fit moved to Your style, the colour lean moved into Colours.
- Morning outfit, Language and Outfit card are three closed Expanders in one Section, each applied on tap (round 2, item 2).
- Units stay until the owner answers `architecture.md` > Open questions for owner, 8: a Units `Segmented` on the Body answer, above Height, drives the metric or imperial fields and the temperature unit. If she confirms the removal, the region-follow variant under Screen 3 > body applies instead.
- Colours shows the one palette summary of onboarding step 10 (Take a selfie, the season, the six best shades) and the colour lean, saved at once; the skin tone chips are gone (round 1, item 5).
- "Most worn" opens its piece, not the calendar.

## Screens

### 1. Profile (`/profile`)

Purpose: see how much the stylist knows, your answers and your numbers in one place, and reach each one to change it.

Layout, top to bottom (Profile recipe): `Screen` / completeness block / `Section`s of `Row`s and `Expander`s. Nothing here commits through a primary, so there is no Footer.

1. `Screen`, `leading="back"`, title `profile.title`. No header items.
2. Completeness block, no Section title (`completeness(closet)`):
   - `Text headline` `profile.meter` ("The stylist knows 60% of your style").
   - `space.md`, then `Silk progress` at full content width, value `score`. It is hidden from accessibility (`accessibilityElementsHidden`, `importantForAccessibility="no-hide-descendants"`), which overrides the `progressbar` role `Silk progress` sets by default.
   - `space.md`, then a `wrap` `ChipRow` of up to three `control` Chips with `chevron.right`, the `next` list in onboarding order, each pushing the home of its answer:

     | Chip | Opens |
     |---|---|
     | `quick.name` | `/profile/answer/name` |
     | `quick.hijab` | `/profile/style`, Hijab open |
     | `quick.hijabStyles` | `/profile/style`, Hijab styles open |
     | `quick.coverage` | `/profile/style`, Coverage open |
     | `quick.style` | `/profile/style`, Everyday style open |
     | `quick.fit` | `/profile/style`, Fit open |
     | `quick.sparkle` | `/profile/style`, Sparkle for events open |
     | `quick.location` | `/profile/answer/place` |
     | `quick.colours` | `/profile/answer/colours` |
     | `quick.body` | `/profile/answer/body` |
     | `quick.never` | `/profile/never` |
     | `quick.wearMore` | `/profile/wear-more` |
     | `quick.details` | Pops Profile, Closet tab with Needs details on (UC-F04-13) |

   - Never a chip for a question she cannot answer: with hijab Not needed, Hijab styles is out of the meter and has no chip (C11-01). An opened, empty "I'll never wear" or "Trying to wear more of" and Body `shape.none` count as answers (C11-02). Body counts once height or shape is set, so `quick.body` ("Add height") shows only while both are empty.
   - At 100% the chips are not rendered; the sentence and the full line stay. No praise.
   - The sentence is one VoiceOver element labelled `profile.meter`, so the percent is read once. Each chip is a `button` with its own label.
   - The block reads `completeness` when Profile gains focus, during the pop, before Profile is shown: the chip set (crossfaded, fewer, or none at 100%) and the ChipRow's line count are laid out in one frame under the transition. After `transitionEnd` the only motion is the line easing to its new value and the sentence crossfading. Nothing below the block moves (Motion).
3. `Section` no title, three `Row`s, each `trailing: "chevron"`, VoiceOver hint `common.edit`:
   - `style.title`, `meta` the everyday style card word (`onboarding.style.*`, "A mix of both"); when the everyday occasion is not Everyday, the occasion first, joined by " · " ("Work · A mix of both"). `profile.notAnswered` when no everyday style exists. Pushes `/profile/style`. VoiceOver joins with ", ": "Your style, A mix of both".
   - `never.title`, `meta` the number of entries ("3") or `common.none`. Pushes `/profile/never`. VoiceOver "I'll never wear, 3": the entries mix kinds, colours and patterns, so the number stands alone.
   - `wearMore.title`, `meta` `common.pieceCountOne` / `common.pieceCountMany` ("3 pieces") or `common.none`. Pushes `/profile/wear-more`. VoiceOver "Trying to wear more of, 3 pieces".
4. `Section` `settings.answers`. Four `Row`s, each `meta` the saved value or `profile.notAnswered`, `trailing: "chevron"`, pushing `/profile/answer/[step]`, VoiceOver hint `common.edit`.
   - `profile.name`: the name ("Sara").
   - `onboarding.place.title`: the city ("Oslo").
   - `onboarding.body.title`: height in the region's units and the body shape, joined by " · " ("165 cm · Hourglass", "165 cm · Prefer not to say"). Either part alone when only one is set.
   - `profile.colours`: the colour season name (`season.*`, "Soft autumn").
5. `Section` `stats.title`:
   - `Row` `stats.neverWorn`, `meta` `common.pieceCountOne` / `common.pieceCountMany`, `trailing: "chevron"`. Pops Profile and switches to the Closet tab with Never worn on (UC-F04-11). Rendered only when `hasAnyWear` is true and the count is above 0: before the first wear the app does not call her pieces forgotten (B4-01, C6-02, as Today's Rediscover).
   - `Row` `stats.mostWorn`, no leading, `meta` `stats.wornOnce` / `stats.wornMany` ("Sage kurta, 5 times"), `trailing: "chevron"`, pushes `/piece/[id]` for that piece (F05). With no wears: the same `Row` with `trailing: { value: stats.nothingWorn }`, no `onPress`.
6. `Section` `settings.title`: three plain `Expander`s of the same recipe, `space.lg` apart. Each closed `value` is the current choice; each body is one single `ChipRow`, `wrap`, no label (the Expander title names it), on the `surface` chip recipe. A tap applies at once, no Save; the closed value follows. One Expander open at a time (Expander > Rules).
   - `profile.morning`: value `notify.off`, `notify.time` ("07:00") or `notify.nightBefore` ("21:00 the night before"); while permission is denied, `notify.denied`, because nothing will arrive. Chips `notify.off`, `notify.time` 06:00, 07:00, 08:00, `notify.nightBefore`. Off is selected until she picks a time. A pick replaces the one schedule; choosing a time when permission was never asked shows the system prompt. Denied: the chosen chip stays selected and under the chips `Text footnote inkMuted` `notify.denied` (announced once, queued, when it appears) and `Button quiet small` `common.openSettings`. Back in the app with permission allowed, the line leaves and the schedule is set without another tap (UC-F11-11, UC-F12-08). Each Chip reads "{option}, Morning outfit". Lane 1 runs the `copy.md` `notify.time` check: if VoiceOver reads "06:00" digit by digit, every time label comes from `Intl.DateTimeFormat` with `hour: "numeric", minute: "2-digit", hourCycle: "h23"`, so the spoken name is the visible "07:00" in both languages: the time chips, the `{time}` in `notify.nightBefore` and the closed Expander value ("Morning outfit, 07:00").
   - `settings.language`: value `settings.language.system`, `settings.language.en` or `settings.language.nb`. Chips in that order, re-rendered without a remount. "English" sets `accessibilityLanguage="en"`, "Norsk bokmål" `accessibilityLanguage="nb-NO"`. Each reads its own name, no group suffix.
   - `style.layout`: value `style.layout.minimal`, `style.layout.reasons` or `style.layout.full`. Chips in that order. Today crossfades its reason line the next time it renders. Each Chip reads "{option}, Outfit card".
7. `Section` `settings.advanced`: one `Row` `stylist.label`, `meta` the engine (`stylist.rules`, `stylist.model`, `stylist.compare`), `trailing: "chevron"`, pushes `/profile/stylist`, hint `common.edit` (owner decision 3).
8. `Section` `settings.app`:
   - `Row` `settings.replay` in `plum`, no trailing -> system alert `settings.replay.title` / `settings.replay.body`, confirm `settings.replay`, cancel `common.cancel`.
   - `Row` `settings.reset` in `error`, no trailing -> system alert `settings.reset.title` / `settings.reset.text`, confirm `settings.reset.confirm`, cancel `common.cancel`.
   - `Text footnote inkMuted` `settings.privacy` (kept: privacy).
   - `Text footnote inkMuted` `settings.version`.

Rows without `onPress` (Most worn with `stats.nothingWorn`) are plain text elements: no button trait, no hint.

Every Expander in this flow, here and on Your style: a closed value that does not fit beside the title moves under it, at any text size, and is never truncated ("Hijabstiler" over "Hijab, Shayla, Al-Amira og Khimar").

```
+--------------------------------------+
| <            Profile                 |
|                                      |
| The stylist knows 60% of your style  |
| ==================------------------ |
| (Add sparkle >) (Add colours >)      |
| (Add height >)                       |
|                                      |
| Your style                         > |
| A mix of both                        |
| ------------------------------------ |
| I'll never wear                    > |
| 3                                    |
| ------------------------------------ |
| Trying to wear more of             > |
| None                                 |
|                                      |
| Your answers                         |
| Name                               > |
| Sara                                 |
| ------------------------------------ |
| Location                           > |
| Oslo                                 |
| ------------------------------------ |
| Body                               > |
| 165 cm · Hourglass                   |
| ------------------------------------ |
| Colours                            > |
| Not answered                         |
|                                      |
| Closet stats                         |
| Never worn                         > |
| 4 pieces                             |
| ------------------------------------ |
| Most worn                          > |
| Sage kurta, 5 times                  |
|                                      |
| Settings                             |
| +----------------------------------+ |
| | Morning outfit         07:00   v | |
| +----------------------------------+ |
| +----------------------------------+ |
| | Language        Follow phone   v | |
| +----------------------------------+ |
| +----------------------------------+ |
| | Outfit card     With reasons   v | |
| +----------------------------------+ |
|                                      |
| Advanced                             |
| Stylist                            > |
| Rules                                |
|                                      |
| App                                  |
| Show intro again                     |
| ------------------------------------ |
| Delete all data                      |
| Stays on this phone. Your location,  |
| rounded to the city, goes to Apple.  |
| Clean background photos go to        |
| Cloudflare.                          |
| Version 1.4.0                        |
+--------------------------------------+
```

Morning outfit open:

```
| +----------------------------------+ |
| | Morning outfit                 ^ | |
| | (Off) (06:00) [07:00] (08:00)    | |
| | (21:00 the night before)         | |
| | Notification access is off       | |
| | Open Settings                    | |
| +----------------------------------+ |
```

`=` is the `Silk progress` fill on its `lineField` track. The access line shows only when permission is denied. Language and Outfit card open the same way, three chips each.

Bokmål meta lines: "En blanding", "Jobb · En blanding", "165 cm · Timeglass", "Sage kurta, 5 ganger"; meter "Stilisten kjenner 60 % av stilen din".

Primary action: tap a row or a quick add chip. Morning outfit, Language and Outfit card apply on tap.

### 2. Your style (`/profile/style`)

Purpose: set what you wear: the everyday request and every style answer the stylist reads. One home for hijab, hijab styles, coverage, everyday style, fit and sparkle (`architecture.md` > Screen tree; C11-05).

Layout, top to bottom (Editor recipe):

1. `Screen`, `leading="cancel"` (`common.cancel`, wired to `useDiscardChanges`), title `style.title`. No header items. `onAccessibilityEscape` calls the same Cancel handler.
2. `Section` no title: one list of closed plain `Expander` rows, the recipe of Profile's Settings, `space.lg` apart, each its title and closed `value`, in onboarding order after Occasion. One Expander open at a time (Expander > Rules); none is open on arrival except from a quick add chip. A pick changes the draft and the closed value follows; nothing is written before the Footer, and the body stays open until its header is tapped or another row opens.
   - `style.occasion`: value `occasion.*`. Body: `ChipRow` single, `wrap`, no label, `occasion.*`. Always holds a value.
   - `style.hijab`: value `hijab.always`, `hijab.sometimes`, `hijab.notNeeded`, or `profile.notAnswered` while never answered (`hijabAnswered`). Body: `ChipRow` single, no label, the three options.
   - `style.hijabStyles`: value the chosen styles joined with `Intl.ListFormat` ("Hijab and Khimar"), `common.noneOfThese`, or `profile.notAnswered`. Body: `ChoiceCardGroup` multi, the hijab styles row of `design-system.md` 18, `exclusive` `common.noneOfThese`. Rendered while hijab is Always, Sometimes or unanswered; not rendered while the draft says Not needed. Its stored answer is kept either way.
   - `coverage.levelLabel`: value `coverage.full`, `coverage.moderate`, `coverage.relaxed`, `coverage.own`, or, when `coverageLevel` is `null`, `coverage.noPreference` once `coverageAnswered` is set and `profile.notAnswered` before. Body: `ChoiceCardGroup` single, Fully covered, Modest, Relaxed cards; plain Chips `coverage.noPreference` and `coverage.own`. With `coverage.own`: `ChipRow` single `coverage.sleevesLabel` (`coverage.toElbow`, `coverage.toWrist`, `coverage.anyLength`) and `ChipRow` single `coverage.hemLabel` (`coverage.toCalf`, `coverage.toAnkle`, `coverage.anyLength`) open in place under the plain chips (ChoiceCard > My own limit). Saving any coverage choice writes `coverageAnswered: true`.
   - `style.style` ("Everyday style"): value `onboarding.style.western`, `onboarding.style.desi` or `onboarding.style.both`. Body: `ChoiceCardGroup` single, the everyday style row of `design-system.md` 18. Always holds a value. Writes `everyday.style` and `profile.styleLean`.
   - `style.fit`: value `onboarding.fit.loose`, `onboarding.fit.structured`, `onboarding.depends` or `profile.notAnswered`. Body: `ChoiceCardGroup` single, Loose and Structured cards, plain Chip `onboarding.depends`.
   - `style.sparkle`: value `sparkle.*` or `profile.notAnswered`. Body: `ChipRow` single, no label, `sparkle.plain`, `sparkle.little`, `sparkle.heavy`, `sparkle.bridal`. Optional. The stylist reads it on Eid, party, wedding guest and barat only (C1-01).
   - `adjust.yourDay`: value `adjust.indoors` or `adjust.outside`. Body: `ChipRow` single, no label, the two options. Required, `adjust.indoors` by default.
   - `style.rules`: value `style.rulesSet` or `style.none`. Body: seven single `ChipRow`s with labels, `wrap`, `style.none` first: `style.belt`, `style.topLength`, `style.bottoms`, `style.prints`, `style.wedding` (multi), `style.dupatta`, `style.region`.
   - Chip bodies (Occasion, Hijab, Sparkle for events, Your day, Style rules) sit on `surface` with the Expander padding and use the surface chip recipe (Chip > Anatomy), as Profile's Settings. Card bodies (Hijab styles, Coverage, Everyday style, Fit) have no fill and no padding, so the cards are the onboarding size (163.5 x 218 pt on a 375 pt phone) and their plain chips are `choice` chips on `canvas`.
   - From a quick add chip the screen opens with that Expander open and its header at the top of the viewport. After the push's `transitionEnd`, `setAccessibilityFocus` moves to that header. Every target is an Expander header, so every chip lands the same way.
   - With no everyday style (onboarding skipped, UC-F06-01) the draft starts at occasion Everyday and style A mix of both, the values `finishOnboarding` writes; every other answer starts as stored.
3. Save error, only after a failed write: `Text footnote error` `common.error.save` as the last content block, directly above the Footer (at `ax`, directly above the quiet button at the end of the scroll).
4. `Footer`:
   - No everyday style yet, from Today or a styling entry: one full-width primary `everyday.saveRestyle`, enabled from the first frame.
   - No everyday style yet, from a quick add chip: one full-width primary `common.save`, enabled from the first frame. It saves (the everyday style included) and pops to Profile; Today shows the first outfit when it next gains focus.
   - An everyday style exists: the stacked pair, secondary `common.save` above, primary `everyday.saveRestyle` below, both with the one disabled recipe until something changes, then both enabled at once.

Option labels: every `Chip` reads "{option}, {group}", the group being its ChipRow label or, with no label, the Expander title ("Always, Hijab", "Any length, Hem", "Heavy, Sparkle for events", "Mostly indoors, Your day"). The plain chips under the cards do too ("It depends, Fit"; "No preference, Coverage"; "My own limit, Coverage", with expanded from `accessibilityState`), because touch exploration or a scroll reaches them past the cards. Cards carry no suffix: a card reads its label, then its description (`hijabStyle.*.description`, `coverage.*.description`) in the `accessibilityLabel` ("Shayla, long scarf, loose over one shoulder"; "Fully covered, long sleeves, to the ankle"). Expander headers read "{title}, {value}" with `accessibilityState.expanded`.

```
+--------------------------------------+
| Cancel        Your style             |
|                                      |
| +----------------------------------+ |
| | Occasion            Everyday   v | |
| +----------------------------------+ |
| +----------------------------------+ |
| | Hijab                 Always   v | |
| +----------------------------------+ |
| +----------------------------------+ |
| | Hijab styles  Hijab and Khimar v | |
| +----------------------------------+ |
| +----------------------------------+ |
| | Coverage                       ^ | |
| +----------------------------------+ |
| +---------------+  +---------------+ |
| |               |  |            (v)| |
| |   [figure]    |  |   [figure]    | |
| |               |  |               | |
| +---------------+  +---------------+ |
| Fully covered      Modest            |
| +---------------+                    |
| |               |                    |
| |   [figure]    |                    |
| |               |                    |
| +---------------+                    |
| Relaxed                              |
| (No preference) (My own limit)       |
|                                      |
| +----------------------------------+ |
| | Everyday style  A mix of both  v | |
| +----------------------------------+ |
| +----------------------------------+ |
| | Fit             Structured     v | |
| +----------------------------------+ |
| +----------------------------------+ |
| | Sparkle for events  A little   v | |
| +----------------------------------+ |
| +----------------------------------+ |
| | Your day      Mostly indoors   v | |
| +----------------------------------+ |
| +----------------------------------+ |
| | Style rules              2 set v | |
| +----------------------------------+ |
+--------------------------------------+
| (            Save                  ) |
| [       Save and update today      ] |
+--------------------------------------+
```

A chip body open:

```
| +----------------------------------+ |
| | Hijab                          ^ | |
| | [Always] (Sometimes)             | |
| | (Not needed)                     | |
| +----------------------------------+ |
```

`[ ]` marks a selected chip (blush fill; `blushStrong` edge on `canvas`, `#9A5A52` on `surface`), `( )` an unselected one, `(v)` the selected card's blush disc with its check. Every card is 163.5 x 218 pt. First run shows only one Footer button. With hijab Not needed the Hijab styles row is not there.

Primary action: `everyday.saveRestyle` saves and pops to Today with the new outfit. `common.save` saves and pops to Profile, keeping today's outfit, and the meter there settles.

### 3. Change an answer (`/profile/answer/[step]`)

Purpose: change one answer without replaying onboarding.

Layout, top to bottom (Editor recipe; no `progress`, no Skip):

1. `Screen`, title the step name: `profile.name`, `onboarding.place.title`, `onboarding.body.title`, `profile.colours`. No header items. Name, Location and Body: `leading="cancel"` (wired to `useDiscardChanges`), and `onAccessibilityEscape` calls the same Cancel handler. Colours: `leading="back"`, no discard guard, because every change there is already saved.
2. Step content:
   - **name**: one `Field`, label `profile.name` hidden (VoiceOver label only; the screen title already says it), `maxLength` 40, `autoFocus`, return key `done` presses Save. Spaces are trimmed on save. An empty field saves no name, and Today greets without one (UC-F11-12).
   - **place**: the place choices of F01 step 8 as drawn there, no privacy note (`settings.privacy` on Profile covers it): `Button secondary` `place.useLocation`, then the search `Field` (`place.search` as its placeholder and `accessibilityLabel`, no drawn label, `returnKeyType="search"`; the return key runs `geocodeCity`), then one message slot directly under the Field: `place.locationOff` with `Button quiet small` `common.openSettings`, `place.notFound`, `onboarding.city.notFound` or `common.offline`, one at a time. Nothing ever shows between the two choices. The saved city is in the Field from the first frame with its check, read as "Search for your city, Oslo". A city found by location or search fills the Field with a trailing check (hidden from VoiceOver), no keyboard, announced once, queued; editing the text removes the check. While Use my location looks, the Button is busy and, after `wait`, the Field shows its `Silk` placeholder with `place.finding` as its `accessibilityValue`. Denied or unavailable: the line shows in the slot, focus moves to it, the keyboard stays down. Offline from Use my location: `common.offline` in the slot; only the city name needs the network. While the slot holds a search error, the Field's `accessibilityLabel` is "{label}, {error}" (`design-system.md` 9 Field).
   - **body**: `Section` without a title: `Segmented` label `onboarding.units.question`, `onboarding.units.metric` and `onboarding.units.imperial`, starting at the stored `Styling.units`, then `space.lg` and `Field` `onboarding.height.label` while metric, or two `Field`s `onboarding.height.feet` and `onboarding.height.inches` under the visible label `onboarding.height.labelImperial` while imperial. Switching converts the typed height in place. Save writes `styling.units` with the height, and Today's temperature follows it. Region-follow variant, only once the owner confirms the removal (`architecture.md` > Open questions for owner, 8): no Segmented, the fields follow `getLocales()[0].measurementSystem` and the temperature `temperatureUnit`. Then `Section` `onboarding.shape.question`: a `Tile` `grid` of seven, single select: the six shape drawings (`tint`, `shape.*`) and a seventh Tile, same size and empty, with `shape.none` as its label under it like the other six. One `radiogroup`, "of 7" ("Prefer not to say, 7 of 7"). Choosing `shape.none` stores no shape by hand, which the meter counts (C11-02).
   - **colours**: the palette summary of F01 step 10, then the colour lean. `Button secondary` `colours.selfie`, leading `camera`, pushing `/onboarding/colours`; "Save colours" there writes `profile.colour` as in onboarding and pops back here. With a saved palette: `space.xl` / `Text headline` the season (`season.*`) / `space.md` / `Swatches` of the six best shades, no Section title (row label `colours.paletteLabel` with `colours.bestShades`, or `colours.bestShadesPlain` while hijab is Not needed). Then `space.xl` and `ChipRow` label `onboarding.colourLean.question`, single, optional: `onboarding.colourLean.bold`, `onboarding.colourLean.soft`, `onboarding.depends`, written on tap. Each Chip reads "{option}, Colour strength".
3. Save error (Name, Location, Body), only after a failed write: `Text footnote error` `common.error.save` as the last content block, directly above the Footer. The draft stays. Colours: a failed Colour strength write puts the old chip back and shows `common.error.save` directly under the ChipRow.
4. `Footer` (Name, Location, Body; Colours has none) primary `common.save`, disabled from the first frame until the draft differs from the saved answer (for body, the height is valid; for place, a city is found). Save pops to Profile; the row shows the new value and the meter settles.

```
+--------------------------------------+
| Cancel           Name                |
|                                      |
| | Sara                            |  |
|                                      |
+--------------------------------------+
| [              Save                ] |
+--------------------------------------+
```

```
+--------------------------------------+
| Cancel         Location              |
|                                      |
| (        Use my location        )    |
|                                      |
| [Q Search for your city           ]  |
|                                      |
| Location access is off               |
| Open Settings                        |
+--------------------------------------+
| [              Save                ] |
+--------------------------------------+
```

"Search for your city" is the Field's placeholder. The slot holds one line at a time, here denied; a found city fills the Field with its check.

```
+--------------------------------------+
| Cancel           Body                |
|                                      |
| Units                                |
| ([Centimetres and °C] | Feet and °F) |
|                                      |
| Height (cm)                          |
| | 165                             |  |
|                                      |
| Body shape                           |
| +--------+  +--------+               |
| | shape  |  | shape  |               |
| +--------+  +--------+               |
| Pear        Apple                    |
| ...                                  |
| +--------+                           |
| |        |                           |
| +--------+                           |
| Prefer not to say                    |
+--------------------------------------+
| [              Save                ] |
+--------------------------------------+
```

```
+--------------------------------------+
| <               Colours              |
|                                      |
| ([cam]  Take a selfie           )    |
|                                      |
| Soft autumn                          |
| (o) (o) (o) (o) (o) (o)              |
|                                      |
| Colour strength                      |
| [Bold] (Soft) (It depends)           |
+--------------------------------------+
```

Primary action: `common.save` on Name, Location and Body. Name writes `styling.name`; Location writes `styling.place` with its `source`; Body writes height, units and shape. Colours has no primary: "Save colours" on the selfie writes `profile.colour`, a Colour strength tap writes `profile.colourLean`. No hijab, coverage, style, fit or sparkle here: Your style holds them.

### 4. I'll never wear (`/profile/never`)

Purpose: tell the stylist what to leave out. Saved at once; nothing is deleted or put away (hand-off rule 10).

Layout, top to bottom:

1. `Screen`, `leading="back"`, title `never.title`. No header items, no Footer, no discard guard: every tap is already saved.
2. One `Section` per Closet category except Hijabs & scarves, in Closet section order, title `category.*`. Body: `ChipRow` multi, `wrap`, no label, the garment kinds of that category (`kind.*`) (C11-03).
3. `Section` `never.colours`: `ChipRow` multi, `wrap`, `colour.*` with `swatch`. Applies to clothes only; a black hijab stays (C11-04).
4. `Section` `never.hijabColours`: the same colour chips, for hijabs only. Not rendered while hijab is Not needed.
5. `Section` `never.patterns`: `ChipRow` multi, `wrap`, `value.pattern.*`.

Only what the stylist can draw from is offered: the kinds, colours (clothes for Colours, hijabs for Hijab colours) and patterns present in the active wardrobe (owned pieces, or the sample while Sample is on), plus every entry already selected. A Section with nothing to offer is not rendered. The set is read when the screen gains focus, never while it is visible.

Every Chip writes at once (`neverWear`). `result.saved` is announced, queued, at most once per `announce` interval; nothing visible is added beyond the selected chip. A failed write puts the chip back and shows `Text footnote error` `common.error.save` directly under that ChipRow, announced every time. The first visit writes the empty list when none exists, so an opened, empty screen counts in the meter (C11-02). Each Chip reads "{option}, {Section title}" ("Black, Colours"; "Black, Hijab colours").

```
+--------------------------------------+
| <         I'll never wear            |
|                                      |
| Tops                                 |
| (Blouse) (Shirt)                     |
|                                      |
| Kurtas & tunics                      |
| (Kurta) (Tunic)                      |
|                                      |
| Trousers & skirts                    |
| (Trousers) [Skirt]                   |
|                                      |
| Colours                              |
| [o Black] (o White) (o Sage)         |
|                                      |
| Hijab colours                        |
| (o Black) (o Mauve)                  |
|                                      |
| Patterns                             |
| (Floral) [Stripe]                    |
+--------------------------------------+
```

Primary action: tap a chip. Back pops to Profile, whose row shows the new count.

### 5. Trying to wear more of (`/profile/wear-more`)

Purpose: name the pieces she wants to wear more, so Rediscover offers them first.

Layout, top to bottom (the picker parts of `/today/pieces`, F07 screen 2, without its preview and Footer):

1. `Screen`, `leading="back"`, title `wearMore.title`. No header items, no Footer, no discard guard.
2. Selection line, height reserved from the first frame: `Text subhead` `common.selectedOne` / `common.selectedMany`; hidden in place while nothing is selected (opacity 0, `pointerEvents="none"`, hidden from VoiceOver).
3. `ChipRow` single, `scroll`: `closet.all`, then `category.*` for the categories that hold owned pieces. A `radiogroup` of `radio` chips. At `ax` it wraps.
4. `Tile` `grid` of owned pieces that are not put away, `selected` showing the blush disc. Each Tile is a `checkbox` with `accessibilityState.checked`, label `tile.label`, the disc hidden. A tap toggles and writes at once (`wearMore`); `result.saved` is announced, queued, at most once per `announce` interval.

Reading order: selection line, category row, grid. A failed write puts the tile back and shows `Text footnote error` `common.error.save` in the selection line's place, announced every time. Removed and put-away pieces leave the list on read. The first visit writes the empty list when none exists (C11-02).

```
+--------------------------------------+
| <       Trying to wear more of       |
|                                      |
| 3 selected                           |
| [All] (Hijabs & scarves) (Tops) (..  |
|                                      |
| +-------------+  +-------------+     |
| |          (v)|  |             |     |
| |   kurta     |  |   blouse    |     |
| +-------------+  +-------------+     |
| Sage kurta       Ivory blouse        |
| +-------------+  +-------------+     |
| |          (v)|  |          (v)|     |
| |   dress     |  |   skirt     |     |
| +-------------+  +-------------+     |
| Plum maxi        Grey skirt          |
+--------------------------------------+
```

Primary action: tap a tile. Back pops to Profile, whose row shows the new count.

### 6. Stylist (`/profile/stylist`)

Purpose: choose the stylist engine and read how Rules and Model compare on stored feedback, per style. Unchanged from the first pass.

Layout, top to bottom:

1. `Screen`, `leading="back"`, title `stylist.label`. No header items. No Footer.
2. `Banner notice` `stylist.unreadOne` / `stylist.unreadMany`, only when pieces have no photo reading. No actions. Present on arrival.
3. `Section` without a title: the vertical `Row` list `stylist.rules`, `stylist.model`, `stylist.compare`, trailing `checkmark` on the chosen one, applied on tap. Each Row reads "{option}, Stylist".
4. `Section` `style.desi`, two `Row`s without `onPress`: `stylist.rules` and `stylist.model`, each `meta` the three lines `stylist.wouldWear`, `stylist.notMyStyle`, `stylist.wore` (rates as `stylist.rate`), or the one line `stylist.noFeedback`. VoiceOver starts with the Section name and joins the parts with ". ": "Desi, Rules. Would wear, top three: 3 of 8, 38 percent. Not my style: 1 of 8, 13 percent. Worn: 2".
5. `Section` `style.western`, the same two `Row`s.

```
+--------------------------------------+
| <              Stylist               |
|                                      |
| +----------------------------------+ |
| | 2 pieces have no photo reading,  | |
| | so Rules styles them             | |
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
| ...                                  |
+--------------------------------------+
```

Primary action: tap an engine Row. Back pops to Profile. The table arrives complete with the screen. Today never shows the engine name.

## States

| State | Screen | What shows |
|---|---|---|
| Empty, nothing answered | Profile | Meter at its lowest value with the first three chips in onboarding order (`quick.name`, `quick.hijab`, `quick.hijabStyles`). Answer rows and Your style `meta` `profile.notAnswered`. The two list rows `common.none` |
| Empty, no everyday style | Profile | Your style row `meta` `profile.notAnswered`; it still pushes Your style |
| Empty, unanswered | Your style | Hijab, Sparkle and the Fit, Coverage and Hijab styles cards start with nothing selected; their Expander values read `profile.notAnswered`. Coverage reads `profile.notAnswered` until `coverageAnswered` is set, then `coverage.noPreference` for a `null` level |
| Empty, unanswered | Answer | Name Field empty; Location Field empty with its placeholder, Save disabled; Body Field empty, no Tile selected; Colours shows Take a selfie and Colour strength only, no chip selected |
| Empty, no pieces | Profile | Closet stats holds only `Row` `closet.addPieces` with `trailing: "chevron"`, pushing `/capture` (F02, UC-F12-01). Never worn and Most worn are not rendered |
| Empty, nothing worn | Profile | Never worn not rendered (`hasAnyWear` false). `Row` `stats.mostWorn` with value `stats.nothingWorn`, no chevron, no door |
| Empty, no pieces | Never wear | Nothing in the active wardrobe and nothing selected: no Sections; `EmptyState` (no mark) `pieces.none` with `Button primary` `closet.addPieces`, pushing Add pieces (F02); back returns here |
| Wardrobe changes | Never wear | A kind, colour or pattern leaves the screen when its last piece is removed or Sample is turned off, but stays while selected. A new kind, colour or pattern appears the next time the screen gains focus |
| Empty, no owned pieces | Wear more | Selection line, category row and grid are not rendered. `EmptyState` (no mark) `pieces.none` with `Button primary` `closet.addPieces`, pushing Add pieces (F02); back returns here (UC-F11-10) |
| Empty category | Wear more | The chosen category has no pieces left: `EmptyState` `closet.noneFoundTitle` with secondary `common.showAll`, which selects `closet.all` |
| Empty, no feedback | Stylist | Each result Row's `meta` is `stylist.noFeedback`. Both Sections still show |
| Full | Profile | Meter at 100%: sentence and full line, no chips, no praise |
| Hijab Not needed | Your style, never wear, colours answer, Profile | Hijab styles row not rendered on Your style; Hijab colours Section not rendered on I'll never wear; Colours answer labels the Swatches row `colours.bestShadesPlain`; no `quick.hijabStyles` chip and 100% reachable without it (C11-01) |
| First run | Your style from Today first run | No everyday style (UC-F06-01): the draft starts at Everyday and A mix of both, Footer the lone `everyday.saveRestyle`, enabled from the first frame. Cancel with no change pops to Today with no prompt |
| First run | Your style from a styling entry | Same screen, same lone primary. `everyday.saveRestyle` lands on Today with the kept pieces and the session banner in place (hand-off rule 2) |
| First run | Your style from a quick add chip with no everyday style | Footer the lone `common.save`, enabled from the first frame. It pops to Profile, where the meter settles; Today shows the first outfit when it next gains focus |
| Loading | Profile | The closet is open before Today renders, so Profile renders complete. On a cold deep link before it opens: the meter line and the answer and stat `Row`s are `Silk placeholder` `text` and `row` shapes; one element carries `common.loading` and `accessibilityState.busy` |
| Loading | Your style, answer, never wear, wear more | Same rule; on a cold deep link the controls are `Silk placeholder` `chip` or `tile` shapes and the Footer is already there, disabled |
| Loading | Answer, place | While "Use my location" looks: `Silk busy` on the Button after `wait`; the Field, on screen from the first frame, shows its `Silk` placeholder, `accessibilityValue` `place.finding` with `accessibilityState.busy`. Nothing opens |
| Generating | All | None on these screens. "Save and update today" hands off to Today's Generating moment (F06). Stylist is a synchronous read (UC-F11-06) |
| Busy | Your style, answer | The pressed Footer button shows `Silk busy` after `wait`; on Your style the other takes the disabled look per the in-flight rule |
| Busy | Profile, never wear, wear more, colours answer | Chips, Tiles and option Rows follow the in-flight rule: disabled look only after `wait`. Show intro again and Delete all data: `Silk busy` on the pressed Row after its alert; every other control takes the in-flight disabled look after `wait` |
| Error, save | Your style, answer | `Text footnote error` `common.error.save` directly above the Footer, announced, brought into view (`settle`, `silk`). Draft kept, focus stays on the pressed button |
| Error, input | Answer | Body: `Field` error `onboarding.height.invalid` / `onboarding.height.invalidImperial`, Save disabled. Place: `onboarding.city.notFound` in the slot under the Field, joined to the Field's label |
| Error, write | Profile, never wear, wear more, colours answer, Stylist | Morning outfit, Language, Outfit card, Colour strength or Stylist: `Text footnote error` `common.error.save` directly under that chip row or list, old value selected again. Never wear: under the ChipRow whose chip failed. Wear more: in the selection line's place. Show intro again or Delete all data: under that Row; she stays on Profile (UC-F11-05). Announced every time; focus stays on the control |
| Discard | Your style, name, place, body | Cancel, swipe back or the VoiceOver escape scrub after a change: system alert `common.discardTitle`, `common.keepEditing` / `common.discard` (destructive). Swipe back is off after the first change |
| Offline | Answer, place | `common.offline` in the slot under the Field, distinct from not found (UC-F01-04), from a search or from Use my location (the position is found; only the city name needs the network). Everything else in this flow is local (UC-F12-04) |
| Permission denied | Answer, place | `place.locationOff` with `common.openSettings` in the slot under the Field; focus moves to the line, the keyboard stays down (UC-F01-04, UC-F12-08). Nothing asks again on its own |
| Permission denied | Profile, Morning outfit | The chosen chip stays; `notify.denied` with `common.openSettings` under the chips, announced once; the closed value reads `notify.denied`. Returning with permission allowed removes the line, the closed value shows the time again and the schedule is set (UC-F11-11) |
| Permission denied | Answer, colours | Not on this screen: `/onboarding/colours` owns camera permission (F01, UC-F01-08) |
| Accessibility sizes (AX1 to AX5) | All | Row values move under the title; chevrons stay trailing. Expander values move under the title (at any size when they do not fit beside it). Every `Segmented` is the vertical `Row` list. `ChipRow`s wrap, the wear more category row too. ChoiceCards go one per row at the `ax` height cap. Tile grids go to one column, the body-shape grid included. The `Silk progress` line keeps full width; the sentence wraps. Header Cancel becomes `xmark`. Your style Footer: at `ax` one button stays pinned and the other is a `quiet` Button at the end of the scroll, after the save error. The pinned one is the screen's expected action: `common.save` when she came from a quick add chip (back to the meter), `everyday.saveRestyle` otherwise. Nothing truncates up to AX5. Lane 1 checks on iPhone SE at AX5, Bold Text, nb, with Hijab styles open: one whole `ax` card and its label are visible above the pinned "Lagre og oppdater i dag", and from a quick add chip above the pinned "Lagre" |
| Bokmål | All | "Profil", "Stilisten kjenner 60 % av stilen din", "Din stil", "Jeg bruker aldri", "Vil bruke mer", "Svarene dine", "Navn", "Sted", "Kropp", "Farger", "Morgenantrekk", "Innstillinger", "Garderoben i tall", "Aldri brukt", "Mest brukt", "Språk", "Antrekkskort", "Avansert", "Stilist", "Hijabstiler", "Dekning", "Hverdagsstil", "Passform", "Pynt til fest", "Stilregler", "Fargestyrke", "Måleenheter", "Finn posisjonen min", "Søk etter byen din", "Vis introen igjen", "Slett alle data". Your style Footer "Lagre" and "Lagre og oppdater i dag". Switching to Norsk bokmål re-renders Profile in place, focus back on the chosen chip (UC-F11-04). Lane 1 screenshots nb at default size with four hijab styles chosen (the Hijab styles value under its title) and at xLarge; "21:00 kvelden før" must stay one chip |
| Reduce Motion | All | Fallbacks per Motion below |

## Motion

All tokens from `motion.md`.

| Where | Motion |
|---|---|
| Today -> Profile, and every push from Profile (Your style, answer, never wear, wear more, Stylist, Most worn piece), and back | Push and pop: native stack transition. Pushed screens render complete |
| Back on Profile after a change | The chip set, the ChipRow's line count and changed row values are laid out in one frame during the pop, under the transition. After the pop's `transitionEnd`, only the `Silk progress` line eases to its new value (`base`, `silk`) and the sentence uses the label crossfade. Nothing else moves while Profile is visible |
| "Never worn" -> Closet, `quick.details` -> Closet | Profile pops off the Today stack, Closet tab on top: tab switch, none, instant. More shows the filter as its closed value, no expand (F04) |
| Quick add chip -> Your style | Push. The target Expander is open in the first frame (no expand motion) and the scroll offset is set in that frame (`scrollTo` not animated) |
| Morning outfit, Language, Outfit card Expanders | Inline expand and collapse, chevron rotates (`settle`, `silk`); opening one closes the open one per Expander > Rules. Chip pick: selection crossfade (`quick`, `silk`); the closed value uses the label change in place. The denied line opens with inline expand when the prompt returns denied and leaves with inline collapse when permission comes back |
| Chip tap (Your style, never wear, colour strength) | Selection crossfade (`quick`, `silk`). No haptic. A failed write crossfades the chip back and the error fades in (`base`, `silk`) |
| Tile tap (wear more, body shape) | The blush disc crossfades in or out (`quick`, `silk`). The selection line uses the label change in place; its first appearance and its last disappearance are an opacity fade in its reserved height (`base`, `silk` in; `quick`, `release` out) |
| Expanders on Your style | Header: inline expand, chevron rotate (`settle`, `silk`). Opening one closes the open one without animation and drops the scroll by the removed height in the same frame (Expander > Rules). Chip bodies: selection crossfade (`quick`, `silk`). Cards: Choice card motion (art present from the first frame, disc crossfade `quick`, `silk`, the exclusive clear in the same frame, `choice.clearedOne` / `choice.clearedMany` queued). The closed value changes with the label change in place |
| My own limit chosen | Sleeves and Hem open with inline expand under the plain chips; another coverage choice closes them with inline collapse. Nothing above moves |
| Hijab set to Not needed, and back | The Hijab styles row leaves with inline collapse (closing its body first if open, in the same frame); choosing Always or Sometimes brings it back with inline expand. Its value is kept |
| `Segmented` change (Units on Body) | Thumb translateX (`settle`, `silk`), `selection` haptic. Stylist engine list: selection crossfade (`quick`, `silk`), `selection` haptic |
| Footer, editors | Both buttons there from the first frame with the disabled look; on the first change both crossfade to their enabled fills (`quick`, `silk`). No height change |
| Save | `Silk busy` on the pressed button after `wait`. On success the screen pops; no ResultBar, the destination shows the result |
| "Save and update today" | Pop to Today. Today plays the Generating moment: only changed slots swap in dressing order, `step` apart (`arrange`, `fall`) |
| Save error, discard | Error text fades in (`base`, `silk`); the scroll view brings it into view with worklet `scrollTo` (`settle`, `silk`). Discard: system alert |
| Location found, denied, not found | Nothing opens: the Field is on screen from the first frame. "Use my location" busy after `wait`; the Field shows its `Silk` placeholder, then the found city fills it and its check fades in (`base`, `silk`). Only the slot line under the Field uses inline expand when it first appears; a changed line uses the label change in place |
| "Take a selfie" -> `/onboarding/colours` and back | Push and pop. "Save colours" writes before the pop, so the Colours answer is laid out with the new season and its `Swatches` row in one frame under the transition; nothing moves after `transitionEnd`. The season is announced once, queued (F01) |
| Language switch | No animation. Strings re-render in the same frame with no remount, scroll offset held, the Language Expander still open; then the chosen chip gets `AccessibilityInfo.setAccessibilityFocus` |
| Show intro again, Delete all data | System alert. After it, `Silk busy` on the pressed Row (after `wait`). Then the stack resets to onboarding step 1 with the native transition |
| Stylist | Push only. No `Silk`, no generating: the Sections are in place in the first frame |
| Reduce Motion | Push and pop: system. Meter: the chips are laid out under the pop as above; after `transitionEnd` the line steps to its value in one frame and the sentence crossfades (`base`). Expanders (Morning outfit, Language, Outfit card, card questions, Style rules, the Hijab styles row, Sleeves and Hem, the location slot line): layout in one frame, content fades in (`base`); collapse fades out (`base`) then layout in one frame; chevrons rotate in one frame. Segmented thumb crossfades (`base`). Chip, tile and card selection: same crossfades, opacity only. Cold deep link placeholders stay still and resolve with a `base` fade. Busy: the still band fades in at its centre after `wait` (`base`). Label changes crossfade at `base`. `scrollTo` not animated. Today's swap after "Save and update today" crossfades in place (`base`) |

VoiceOver: the meter sentence is one element, `profile.meter`, read first, the line hidden; each quick add chip is a `button` read by its label. Rows read "{title}, {value}" with hint `common.edit` on every row that opens an editor ("Your style, A mix of both"; "I'll never wear, 3"; "Trying to wear more of, 3 pieces"; "Body, 165 cm, Hourglass"). Never worn reads "Never worn, 4 pieces"; Most worn "Most worn, Sage kurta, 5 times" with no hint. Rows without `onPress` are plain text elements. Every Chip and segment, and every option Row, reads "{option}, {group}", the group being its label or, with none, its Expander title ("07:00, Morning outfit", "Heavy, Sparkle for events", "It depends, Fit", "Black, Hijab colours", "Bold, Colour strength", "With reasons, Outfit card", "Rules, Stylist"), because iOS reads no group name on entry. Language chips read their own name in their own language. Inside a ChoiceCardGroup, cards read label then description, with no suffix. Expander headers carry `accessibilityState.expanded` and read "{title}, {value}". Each never-wear or wear-more write announces `result.saved`, queued, at most once per `announce`; an error is announced every time and focus stays on the control. Focus on arrival: back on Profile from a quick add chip, after `transitionEnd`, when the answer changed, `setAccessibilityFocus` on the meter element (`profile.meter`), so the new percent is read once and the chips follow in reading order, the same under Reduce Motion; when nothing changed, focus stays on the pressed chip, as for a Row; back on Profile from a Row, focus stays on that Row, which reads its new value; after a quick add chip on Your style, the opened Expander header, after the push's `transitionEnd`; after "Never worn" or `quick.details`, the Closet More header; after Show intro again or Delete all data, the onboarding step 1 question; after a selfie returns, the season line; after a denied or unavailable location, the slot line; after a language switch, the chosen chip. Your style and the Name, Location and Body answers wire `onAccessibilityEscape` to `useDiscardChanges`.

## Copy

Keys from `copy.md` F11, Revision 1 > F11 Profile and the F01 flow design additions unless noted. Changed in `copy.md` in this pass: `style.style` "Everyday style" / "Hverdagsstil", `quick.style` "Add everyday style" / "Legg til hverdagsstil", `settings.title` "Settings" / "Innstillinger" (new), `sparkle.plain` bokmål "Enkel", and `onboarding.units.*` kept while Open question 8 is open.

| Where | Keys |
|---|---|
| Today header | `nav.profile` (F06) |
| Profile title | `profile.title` |
| Completeness | `profile.meter`, `quick.name`, `quick.hijab`, `quick.hijabStyles`, `quick.coverage`, `quick.style`, `quick.fit`, `quick.sparkle`, `quick.location`, `quick.colours`, `quick.body`, `quick.never`, `quick.wearMore`, `quick.details` |
| Style rows | `style.title`, `occasion.*`, `onboarding.style.western`, `onboarding.style.desi`, `onboarding.style.both`, `never.title`, `wearMore.title`, `common.none`, `common.pieceCountOne`, `common.pieceCountMany`, `profile.notAnswered`, `common.edit` (VoiceOver hint) |
| Your answers | `settings.answers`, `profile.name`, `onboarding.place.title`, `onboarding.body.title`, `profile.colours`, `shape.*`, `shape.none`, `season.*`, `profile.notAnswered` |
| Closet stats | `stats.title`, `stats.neverWorn`, `common.pieceCountOne`, `common.pieceCountMany`, `stats.mostWorn`, `stats.wornOnce`, `stats.wornMany`, `stats.nothingWorn`, `closet.addPieces` |
| Settings Expanders | `settings.title`, `profile.morning`, `notify.off`, `notify.time`, `notify.nightBefore`, `notify.denied`, `common.openSettings`, `settings.language`, `settings.language.system`, `settings.language.en`, `settings.language.nb`, `style.layout`, `style.layout.minimal`, `style.layout.reasons`, `style.layout.full` |
| Advanced | `settings.advanced`, `stylist.label`, `stylist.rules`, `stylist.model`, `stylist.compare` |
| App | `settings.app`, `settings.replay`, `settings.replay.title`, `settings.replay.body`, `settings.reset`, `settings.reset.title`, `settings.reset.text`, `settings.reset.confirm`, `common.cancel`, `settings.privacy`, `settings.version` |
| Your style | `style.title`, `style.occasion`, `occasion.*`, `style.hijab`, `hijab.always`, `hijab.sometimes`, `hijab.notNeeded`, `style.hijabStyles`, `hijabStyle.*`, `hijabStyle.*.description`, `common.noneOfThese`, `choice.clearedOne`, `choice.clearedMany`, `coverage.levelLabel`, `coverage.full`, `coverage.moderate`, `coverage.relaxed`, `coverage.full.description`, `coverage.moderate.description`, `coverage.relaxed.description`, `coverage.noPreference`, `coverage.own`, `coverage.sleevesLabel`, `coverage.hemLabel`, `coverage.toElbow`, `coverage.toWrist`, `coverage.toCalf`, `coverage.toAnkle`, `coverage.anyLength`, `style.style`, `onboarding.style.*`, `style.fit`, `onboarding.fit.loose`, `onboarding.fit.structured`, `onboarding.depends`, `style.sparkle`, `sparkle.plain`, `sparkle.little`, `sparkle.heavy`, `sparkle.bridal`, `adjust.yourDay`, `adjust.indoors`, `adjust.outside` (F07), `style.rules`, `style.rulesSet`, `style.belt`, `style.belt.*`, `style.topLength`, `style.topLength.*`, `style.bottoms`, `style.bottoms.*`, `style.prints`, `style.prints.*`, `style.wedding`, `style.wedding.white`, `style.wedding.black`, `style.dupatta`, `style.dupatta.*`, `style.region`, `style.region.*`, `style.none`, `profile.notAnswered` |
| Your style Footer | `common.save`, `everyday.saveRestyle` |
| Answer, name | `profile.name` (title and hidden Field label) |
| Answer, place | `onboarding.place.title`, `place.useLocation`, `place.search` (Field placeholder and label), `place.finding`, `place.locationOff`, `place.notFound`, `onboarding.city.notFound`, `common.offline`, `common.openSettings` |
| Answer, body | `onboarding.body.title`, `onboarding.units.question`, `onboarding.units.metric`, `onboarding.units.imperial`, `onboarding.height.label`, `onboarding.height.labelImperial`, `onboarding.height.labelVoice`, `onboarding.height.feet`, `onboarding.height.feetLabel`, `onboarding.height.inches`, `onboarding.height.inchesLabel`, `onboarding.height.invalid`, `onboarding.height.invalidImperial`, `onboarding.shape.question`, `shape.*`, `shape.none` |
| Answer, colours | `profile.colours`, `season.*`, `profile.notAnswered`, `colours.bestShades`, `colours.bestShadesPlain`, `colours.paletteLabel`, `colours.selfie`, `onboarding.colourLean.question`, `onboarding.colourLean.bold`, `onboarding.colourLean.soft`, `onboarding.depends`, `common.error.save` |
| Answer Footer | `common.save` |
| I'll never wear | `never.title`, `category.*`, `kind.*`, `never.colours`, `never.hijabColours`, `colour.*`, `never.patterns`, `value.pattern.*`, `result.saved`, `common.error.save`, `pieces.none`, `closet.addPieces` |
| Trying to wear more of | `wearMore.title`, `common.selectedOne`, `common.selectedMany`, `closet.all`, `category.*`, `tile.label`, `result.saved`, `common.error.save`, `pieces.none`, `closet.addPieces`, `closet.noneFoundTitle`, `common.showAll` |
| Stylist | `stylist.label`, `stylist.unreadOne`, `stylist.unreadMany`, `stylist.rules`, `stylist.model`, `stylist.compare`, `style.desi`, `style.western`, `stylist.wouldWear`, `stylist.notMyStyle`, `stylist.wore`, `stylist.rate`, `stylist.noFeedback` |
| Discard, errors, loading | `common.discardTitle`, `common.keepEditing`, `common.discard`, `common.error.save`, `common.loading` (F12) |

Not used by this flow any more: `stylist.results`, `never.garments` (the category Section titles name the groups), `hijabStyle.*.hint` and `coverage.*.hint` (now `*.description`), `place.city`, `colours.goEasy` (selfie result only), `onboarding.taste.title`, `onboarding.styleLean.question`, `onboarding.colours.swatch`, `colours.season`, `onboarding.city.label`, `onboarding.city.find`, `onboarding.city.found`, `style.bothLong`.

## Use cases

| ID | Screen | State |
|---|---|---|
| UC-F11-01 Read the profile | 1 Profile: meter, Your style, I'll never wear, Trying to wear more of, Your answers (Name, Location, Body, Colours), Closet stats (Never worn -> Closet; Most worn -> its piece), Morning outfit, Language and Outfit card Expanders, Advanced, App | empty (nothing answered, no style, no pieces, nothing worn), loading, largest text, bokmål |
| UC-F11-02 Set your style | 2 Your style: occasion, hijab, hijab styles cards, coverage cards with My own limit, everyday style cards, fit cards, sparkle for events, Your day, Style rules; Footer `common.save` or `everyday.saveRestyle` | first run, unanswered, hijab Not needed, busy, error above the Footer, discard, largest text, bokmål |
| UC-F11-03 Change an answer | 3 Answer: location (Use my location, the search Field, one slot), body (Units, `shape.none`), colours (Take a selfie, season and best shades, colour strength saved on tap) | error above Save with draft kept, input errors, discard, offline, permission denied, largest text |
| UC-F11-04 Switch language | 1 Language Expander | bokmål, in place, no remount, focus back on the chosen chip, error under the chips |
| UC-F11-05 Show intro again or delete all data | 1 App Rows, system alerts, busy, onboarding step 1 | busy, error under the Row |
| UC-F11-06 Choose the stylist engine and compare | 1 Advanced -> 6 Stylist | empty, unread Banner, no generating state, bokmål |
| UC-F11-07 Read privacy and version | 1 App, last on the screen | largest text |
| UC-F11-08 See how much the stylist knows | 1 completeness block; each quick add chip -> its home and back, line settles; `quick.details` -> Closet | empty, full, hijab Not needed, largest text, bokmål, reduce motion |
| UC-F11-09 Tell the stylist what I never wear | 4 I'll never wear: category Sections, Colours, Hijab colours, Patterns, from the active wardrobe, saved at once | empty (opened counts), no pieces, error under the ChipRow, hijab Not needed, largest text, bokmål |
| UC-F11-10 Choose pieces I am trying to wear more | 5 Trying to wear more of: category row, tile grid, saved at once | empty closet, empty category, error, largest text |
| UC-F11-11 Change the morning outfit time | 1 Morning outfit Expander: chips in place | permission denied and allowed on return, bokmål |
| UC-F11-12 Change my name | 3 Answer, name | empty saves no name, largest text, bokmål |

Entries owned by other flows that land here or start here: UC-F06-01 ("Set your style" -> 2), UC-F04-11 ("Never worn" -> Closet), UC-F04-13 (`quick.details` -> Closet), UC-F06-21 (wear more feeds Rediscover), UC-F01-05 (body, now 3), UC-F01-07 and UC-F01-21 (Colours "Take a selfie"), UC-F01-04 and UC-F01-18 (Location answer), UC-F01-19 (Morning outfit on Profile), UC-F07-01 (Your day lives in Your style). App-wide rows this flow answers: UC-F12-01, UC-F12-02 (including `/profile/never` and `/profile/wear-more`), UC-F12-03, UC-F12-04, UC-F12-08.

## Open questions for owner

- Your style Footer: keep the stacked "Save" and "Save and update today", or one "Save" that also restyles Today when the everyday request changed. One button is fewer words; the pair lets her save without changing today's outfit.

## Review log

Revision 1 (owner feedback rounds 1 and 2, architect response to the revision 1 walk):

- The wear calendar is not added here. `architecture.md` > Tabs puts it under Looks at `/looks/calendar` (F09), reached from the Looks header only.
- "Most worn" opens its piece, not the calendar (F09 review, landed in `architecture.md` and `use-cases.md`): Profile counts all time and the calendar's "Most worn" counts this month, so one tap apart the same label named a different piece and count. The meta names the piece the Row opens.
- Morning outfit, Language and Outfit card are one Section of three closed Expanders of one recipe, each body a single ChipRow applied on tap. This replaces a boxed Expander inside Your answers and two always-open checkmark lists: six fewer rows and one pattern for "pick one of N". Language and Outfit card have three required options, which `design-system.md` 8 would draw as `Segmented`; inside an Expander body they use a ChipRow, as fact Expanders do, so the three settings edit the same way. UI designer to extend the fact Expander exception in 8 to these three and to the chip bodies on Your style (Occasion, Hijab, Sparkle for events, Your day).
- Colour strength is a single optional `ChipRow`: it can be unanswered, and `design-system.md` 8 keeps `Segmented` for required values. `copy.md` (`profile.colours` note, `onboarding.colourLean.question`) now says the same.
- The Colours answer has no Footer and no discard guard. "Save colours" on the selfie writes, as in onboarding (F01 says it pops to the Colours answer with the season in place), and Colour strength applies on tap. One save per change, and the button means what it says.
- Units are kept and drawn: a Units `Segmented` on the Body answer above Height, driving the height fields and the temperature unit (`Styling.units` exists in code). The spec says no feature is removed and the owner has not answered `architecture.md` > Open questions for owner, 8, so approving this flow does not approve the removal. Body, not Location, holds it because height is the only field it changes. If she confirms the removal, the region-follow variant under Screen 3 > body applies, `onboarding.units.*` are cut and `design-system.md` 8 drops Units.
- Coverage: `StyleProfile.coverageAnswered?: true` is in `architecture.md` > Domain touches next to `hijabAnswered`, set by onboarding step 4 and Your style. The closed value and `completeness` read it, so No preference is an answer and `quick.coverage` leaves once she gives it.
- Card descriptions: `design-system.md` 18 names keys only and `copy.md` holds the words. Open for the re-render pass: `hijabStyle.chador.description` ("full-length cloak, held closed") does not match the v1 chador art, an open drape, and the description is all a VoiceOver user gets. Copy owner and UI designer to make the art and the words agree.
- Never worn shows only once `hasAnyWear` is true (B4-01, C6-02): Today hides Rediscover and Closet offers "Mark what I wear most" for the same reason.
- I'll never wear offers only what is in the active wardrobe, plus what is already selected. A kind, colour or pattern that is not in the closet the stylist draws from can never reach an outfit, so its chip did nothing; the full lists ran to over 100 chips.
- I'll never wear uses flat category Sections, not a "Garments" group with sub-labels: a `ChipRow` label and a `Section` title share the `headline` size, so a group title over category labels would read as equal headings anyway. `never.garments` is unused; copy owner can cut it. Hijabs & scarves has no Section: hijabs are left out by colour only, through Hijab colours (C11-04).
- No "Clear all" on I'll never wear. Each chip toggles off on its own; a one-tap clear of a saved list would need an Undo nobody asked for.
- Trying to wear more of uses a `Tile` `grid`, not F07's `strip`: it has no preview to share the screen with, and a strip of a 70 piece closet is a long sideways scroll. The category row and the selection line are F07's.
- The meter's `Silk progress` is hidden from accessibility and the sentence is one element, per `copy.md`, so the percent is read once. `design-system.md` line 720 (Profile recipe) and the `Silk progress` default role still say `progressbar`; UI designer to align.
- Back on Profile, nothing moves but the line: the chip set is laid out under the pop. A chip that leaves after `transitionEnd` would slide every Section below it up while she looks.
- Quick add chips that land on Your style open their Expander in the first frame and set the scroll in that frame. The question order on Your style follows onboarding after Occasion, so the chips and the screen agree. The two list chips use `quick.never` and `quick.wearMore` as `copy.md` defines them, so every chip but the hijab question is an action (`copy.md` chip rule).
- A quick add chip into Your style with no everyday style shows `common.save` alone and pops to Profile, so every chip returns to the meter. Today builds the first outfit when it next gains focus.
- Your style meta shows the style card word, and the occasion only when it is not Everyday, which it is on almost every profile.
- The card question for style is "Everyday style", the owner's words (round 1, item 3), so the screen "Your style" does not hold a "Style" and a "Style rules". Landed in `copy.md` with `quick.style` "Add everyday style", so the chip names the row it opens.
- The location answer is F01 step 8 as drawn: Use my location, the always-visible search Field named by `place.search`, one message slot under it; denied moves focus to the slot line with the keyboard down, and offline shows `common.offline`. No quiet Search button, no Expander, no `place.city`, so VoiceOver hears the same control and the same messages on Profile as in onboarding.
- The Colours answer is the one palette summary of F01 step 10 (Take a selfie, the season in `headline`, the six best shades), then Colour strength. Go easy on stays on the selfie result only (round 2, item 5), so onboarding and Profile draw the same thing.
- Your style is one list of closed Expander rows, the Settings recipe on Profile: open chip blocks between boxed card rows read as bolted on. Each row shows its value closed, so the whole style reads at a glance.
- Body keeps `shape.none` as the seventh Tile, label under an empty tile like the others, so the grid is one radiogroup "of 7" and follows the Tile label wrap rule at AX5.
- The Name Field hides its label because the screen title is the same word. `design-system.md` 9 lists when a label is hidden; UI designer to add "the only control on an answer screen whose title names it".
- `stats.wornMany` keeps the `copy.md` comma ("Sage kurta, 5 times"); the first pass asked for " · " and copy did not take it. One source wins.
- `architecture.md` (screen tree, Your taste, Revision 2 summary, Domain touches, Open questions) and `use-cases.md` (UC-F11-01 to -05, -08, -09, -11, UC-F01-21 step 8) were aligned with this flow in the same round, so Maestro finds the strings F11 shows.
- Contrast and target checks: ink/canvas 13.49, ink on `paper` 12.49, inkMuted/canvas 5.40, inkMuted on surface 5.14 (`notify.denied`), plum/canvas 6.89, plum on surface 6.56 (Open Settings), error/canvas 7.23, ink on blush 7.12, `blushStrong` edge 3.21 on canvas, the ChoiceCard disc edge 4.91 on `paper`, `Silk progress` plum 6.89 on canvas. Chips inside the three settings Expanders and the chip bodies on Your style (Occasion, Hijab, Sparkle for events, Your day, Style rules) use the surface recipe: unselected edge `lineField` 3.18 on surface, selected edge `#9A5A52` 5.05 on surface, never `blushStrong` (3.06 on surface); Lane 1 checks that recipe there. Rows and Footer buttons 52 pt; Chips, segments, Expander headers, small Buttons and header items 44 pt; ChoiceCards 163.5 x 218 pt.
- Settings has a Section title (`settings.title`), so Profile keeps one titled-Section rhythm. Its Expanders put the value beside the title and Rows put it under: that is the Expander header recipe (`design-system.md` 12, the value moves under when it does not fit), the same on Your style, so each pattern stays one recipe.
- Morning outfit while notifications are denied shows `notify.denied` as its closed value, so the closed row never promises an outfit that will not arrive.
- Body counts in the meter once height or shape is set, so `quick.body` "Add height" only shows when neither is, and never asks for height after she gave it.
- Declined: dropping `quick.details` from the meter. It changes `completeness` in `architecture.md`, F04's arrival rows and UC-F04-13, all owned elsewhere; a piece the stylist cannot read is also something it does not know. Architect to decide with the owner.
- Declined here: a scoped label for the calendar's "Most worn". The calendar is F09's; F09 and the copy owner to add `calendar.mostWorn` ("Most worn this month" / "Mest brukt denne måneden") so one label means one thing.
- Declined: dropping the selection line on Trying to wear more of. It is F07's picker part and the slot the write error uses, and it reserves its height, so nothing jumps.

Kept from the first pass:

- Owner decision 3: the stylist engine and its results live in release builds under `settings.advanced`, one Row that pushes `/profile/stylist`.
- Save on every editor is the Footer `common.save`, never a header item; rows are whole-row targets with a chevron and `common.edit` as the VoiceOver hint, never "Change" pills.
- Hijab, Sparkle and Colour strength are single `ChipRow`s because they can be unanswered. Your day, required with Mostly indoors as default, is a two-chip body on Your style so every Expander body edits the same way; Adjust (F07) keeps its `Segmented`.
- A row that only shows puts its value trailing; a row that opens something puts its value in `meta` and keeps the chevron.
- Show intro again and Delete all data are full-width `Row`s with no chevron, `plum` and `error` titles, `Silk busy` after the alert.
- Language chips are the only options without the "{option}, {group label}" pattern; their names are unique and are spoken in their own language.
- `coverage.necklineUnchecked` belongs to the Today checks (F06), not to Your style.
- Both Footer buttons on Your style use the one disabled recipe and enable together.
