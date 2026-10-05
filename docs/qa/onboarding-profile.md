# QA: onboarding and profile

Simulator: Almari QA 1, Release build 0.1.14 (17). Tested in English and bokmål, at default and AX5 text size, with the system set to light and to dark.

Screens: `docs/qa/screens/onboarding-profile/`

## 1. Bugs

Totals: 0 crash, 3 broken, 3 wrong, 7 polish.

### 1. Broken: Profile has no way to change the hijab answer back to "No"
- Repro: onboarding, pick Hijab "Always" (or "Sometimes"), finish. Profile > hijab tile.
- Happened: the tile opens the hijab styles step. The always/sometimes/no question cannot be reached from Profile again, so you can never switch to "No" or between always and sometimes.
- Expected: the tile opens the hijab question, and styles come after it (or are a second tile).
- Screenshot: `screens/onboarding-profile/hijab-dead-end.png`
- Source: `src/features/profile/StyleBoard.tsx:44-52`
- Fix: always route the tile to step `hijab`. In single mode, when the answer is always or sometimes, push `hijabStyles` after saving. Or split it into two tiles, "Hijab" and "Hijab styles".

### 2. Broken: the first tap on Save/Next after typing is swallowed
- Repro (3 out of 3 times): Profile > name > type a name > tap Save. The same happens in onboarding on the name step with Next.
- Happened: the first tap only dismisses the keyboard, and nothing is saved. A second tap works.
- Expected: one tap saves and goes back.
- Screenshot: `screens/onboarding-profile/first-tap-swallowed.png`
- Source: `src/ui/Screen.tsx:152` and `:307`. The footer sits outside the ScrollView and moves with the `keyboardSpace` animation, so the tap lands while the button is moving down. `keyboardShouldPersistTaps="handled"` (`:260`) only covers the ScrollView, not the footer.
- Fix: keep the footer still while the keyboard closes, for example by using `KeyboardAvoidingView` or `react-native-keyboard-controller`'s `KeyboardStickyView` for the footer. Or submit from `onSubmitEditing` on the name field, with `returnKeyType="done"`.

### 3. Broken: height ignores imperial units
- Repro: Profile > Body > choose "Feet and °F" > height field.
- Happened: the field still says "Height in centimetres" and rejects anything outside 120-220, so 5'6" cannot be entered.
- Expected: feet and inches input when imperial is chosen.
- Screenshot: `screens/onboarding-profile/height-imperial.png`
- Source: `src/features/profile/BodyAnswer.tsx:25`. The feet/inch strings and `parseHeight` in `src/domain/units.ts` already exist but are not used here.
- Fix: switch the label, placeholder and validation on `units`, and parse the value with `parseHeight`.

### 4. Wrong: the QA build renders titles in the system font, not Fraunces
- Repro: open any screen with a title (for example "Hva heter du?" or "God morgen").
- Happened: titles use SF instead of Fraunces. The `.app` contains no TTF files, and `ios/Almari/Info.plist` has no `UIAppFonts`.
- Expected: Fraunces display type, as in DESIGN.md.
- Screenshot: `screens/onboarding-profile/system-font-and-empty-board.png`
- Source: `app.json:27` and `:55`. `expo-font` is listed twice, once with the font list and once bare. The native project is stale.
- Fix: remove the bare `"expo-font"` entry, run `npx expo prebuild --clean`, and check that the TTFs are in the bundle before release.

### 5. Wrong: switching hijab to "No" keeps the old hijab styles
- Repro: onboarding, pick Always, pick 2 styles, go back, pick No, finish. Later set hijab to Sometimes again.
- Happened: the old styles are still saved and come back pre-selected. They can still affect styling while the answer is "No".
- Expected: "No" clears `profile.hijabStyles`.
- Source: `src/domain/onboarding.ts:202-210`
- Fix: when `hijab === "no"`, strip `hijabStyles` from the profile in the same write.

### 6. Wrong: an offline city search says "Could not find this city"
- Repro (from code): place step or Profile > Location > search while offline.
- Happened: every thrown error maps to `notFound`, so the user thinks the city name is wrong.
- Expected: the `offline` message, which already exists in `PlaceMessage`.
- Source: `src/features/onboarding/useOnboarding.ts:125-126`
- Fix: in the `catch`, set `offline` (or `unavailable`) instead of `notFound`.

### 7. Polish: the hijab tile is a blank rectangle when the answer is "No"
- Repro: answer Hijab "No", then open Profile.
- Happened: the tile has no image and no "+", only an empty beige box with a caption.
- Source: `src/features/profile/StyleBoard.tsx:44-50`
- Fix: show a small uncovered-hair illustration, or a neutral "Not worn" art card.

### 8. Polish: changing the text size while the app is open breaks Profile until relaunch
- Repro: open Profile, change Settings > Text size to AX5, then return to the app.
- Happened: the name and eyebrow are clipped, and the expander titles, the reset row and the footer overlap. After a relaunch it renders fine.
- Screenshots: `screens/onboarding-profile/dynamic-type-runtime-1.png`, `-2.png`, `-3.png`
- Source: `app/profile/index.tsx`, with the layout measured once in the expanders (MorningOutfit / Language).
- Fix: avoid fixed heights that are measured once in the expanders. Let them size to their content, or measure again on `onLayout`.

### 9. Polish: "Good morning" at 02:35
- Repro: open Today between midnight and 05:00.
- Source: `src/domain/greeting.ts:10`
- Fix: before 05:00, use "Good evening" or a neutral "Hi, Sofie".

### 10. Polish: the morning outfit time stays selected when notifications are denied, and the message shows twice
- Repro: deny notifications, then Profile > Morning outfit > 07:00.
- Happened: 07:00 stays checked and saved, the row value says "Varseltilgang er av", and the footnote below says the same thing.
- Source: `src/features/profile/MorningOutfit.tsx:60-63` and `:91-94`
- Fix: keep the row value as the chosen time. Show one footnote with an "Open Settings" button. Do not mark the time as active until permission is granted.

### 11. Polish: the name field spell-checks names and silently cuts at 40 characters
- Source: `src/features/onboarding/StepName.tsx`, `src/domain/onboarding.ts:187`
- Fix: add `autoCorrect={false}` and `spellCheck={false}`. The 40-character cut is fine, but show a counter near the limit.

### 12. Polish: "Delete all data" looks like a normal row
- Source: `app/profile/index.tsx:129`
- Fix: use the error tone and put it on its own at the bottom, as in the iOS Settings pattern.

### 13. Polish: dead keys in nb/en
- Happened: `style.layout*`, `settings.replay`, `onboarding.done.add` / `onboarding.done.sample` and others are unused. They make translation reviews noisy.
- Source: `src/i18n/nb.ts`, `src/i18n/en.ts`
- Fix: delete the unused keys. A small script that greps `t("...")` against the dictionary can find them.

Notes:
- Dark mode: the app forces light (`app.json:8`) and the StatusBar is set to dark. In system dark mode everything, including the keyboard and alerts, stayed consistently light, so no bug. It is a product choice, but premium peers support dark mode.
- Delete all data works. It re-adds the sample closet, keeps the language, returns to onboarding, and the nb confirm copy is good.
- Switching language updates the UI live.
- No nynorsk was found.
- Colour scan entry: Profile > colours tile > `/profile/answer/colours` (StepColours) > selfie button > `/onboarding/colours`.

## 2. UX and design problems

1. **No welcome moment.** First launch opens straight on "What is your name?" with no logo or promise. Fix: add one brand screen with the logo, one line ("Your closet, styled every morning") and a Start button.
2. **Relaunching mid-onboarding restarts at step 1.** The answers are kept, but the user taps through everything again (`useOnboarding.ts:41`). Fix: start at the first unanswered step.
3. **Skipping is invisible.** Every step can be skipped by tapping Next with nothing chosen, but nothing says so. Fix: show a quiet "Skip" text button in the header, and make Next primary only when something is chosen.
4. **The hijab step is the weakest screen.** It is three small chips on an empty page, while the other choice steps have art. Fix: use three illustrated cards, like the coverage step.
5. **All art shows a hijab,** even after the user answered "No". Fix: add a no-hijab variant of the style and coverage art.
6. **"Abaya or desi" merges two different styles,** and `style-desi.jpg` is unused. Fix: make them separate cards (this also fills the empty cell in the 3-card grid).
7. **Coverage "No preference" is below the fold** and mixed in with the cards. Fix: make it a text chip under the title.
8. **The done screen is sparse.** It is top-aligned and has no summary, and the back button and a full progress bar still show. Fix: center it, hide the back button and progress bar, and show a 3-line summary of the answers above "Add pieces".
9. **A new Profile is 3 screens of empty "+" tiles** before any setting. Fix: collapse unanswered tiles into one "Finish your style profile (4 left)" card, and show tiles only once they are answered.
10. **The Profile entry is a generic person icon,** and Profile is reachable only from Today. Fix: show the user's initial in a blush disc (as in the spec), and also add it to the Closet and Looks headers.
11. **Units are hidden under Body,** although they also control temperature, and the label "Feet and °F" is odd. Fix: move them to a "Units" row next to Language, with the options "Metric (cm, °C)" and "Imperial (ft, °F)".
12. **The body shape drawings look nearly identical.** Fix: make the silhouettes bolder and more different, or add a one-line hint under each.
13. **The single-answer screens have no nav title,** so the back button floats alone. Fix: show the tile label as the header title.
14. **The number-pad keyboard has no Done key,** and the height field shows a validation error on every keystroke. Fix: add an input accessory Done button, and validate on blur.
15. **At AX5, the Today intent chips wrap into stacked rows** and push the outfit below the fold. Fix: keep the chips on one horizontal scroll row at large sizes.
16. **nb copy:**
    - "Hvor dekket vil du være til hverdags?" should be "Hvor tildekket vil du være til hverdags?", and "Mindre dekket" should be "Mindre tildekket". This also matches "Vestlig og tildekket".
    - "Til eid og fest, hvor mye pynt?" should be "Hvor mye pynt til eid og fest?".
    - "Rundes av til byen og sendes bare til Apple for været." should be "Vi bruker bare byen, og deler den kun med Apple for å hente været."

## 3. Feature ideas (ranked)

1. **Resume onboarding where you left off,** plus a "Skip for now" that lands on Today with the sample closet. This cuts drop-off on the most fragile screens.
2. **Export my data:** a Profile row that shares a zip of the closet JSON and photos through the share sheet. It builds trust, and it is a safety net before "Delete all data".
3. **Shareable style board:** render the filled StyleBoard as a 9:16 card (ViewShot is already used in Looks) to share to Instagram stories. It is free marketing.
4. **Custom morning time:** replace the 4 fixed times with a wheel time picker, plus a "Weekdays only" toggle.
5. **Initial avatar and a profile completeness ring** on the Today header, which nudges users to finish their style profile.
6. **No-hijab art set:** swap the onboarding and StyleBoard art when hijab is "No", so the app feels made for every user.
