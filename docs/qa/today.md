# QA: Today (Idag)

Device: Almari QA 4 (iPhone, iOS 27), release build 0.1.14 (17). Seed closet + Oslo place + fixture forecast 4 to 9°, EN and NB, Large and AX5 text. Stylist checked with a scratch script over the sample closet (every style x intent x weather) plus synthetic large closets, and `npm run evaluate`.

Screens: `docs/qa/screens/today/`

## 1. Bugs

### B1. Tapping the selected intent does nothing (broken)
- Repro: Today, tap Party or mehndi, tap Everyday, then tap Everyday again (and again).
- Actual: the outfit never changes. Expected (decisions.md and commit 51ef86b): you get a fresh outfit and kept pieces are dropped.
- Cause: `src/ui/Chip.tsx:271` `ChipRow.pick` only calls `onChange` when `optional || value !== id`, so for a radio row like the intents a tap on the selected chip is swallowed. `useToday.ts:293` (`if (occasion === request.occasion && !anchored) return void another()`) is never reached.
- Fix: add a `reselect` prop to `ChipRow` that calls `onChange(id)` even when `value === id`, and pass it from `IntentRow`.
- Screen: `intent-reselect.png`

### B2. Large closets: every outfit uses the same top, and variety is low (wrong)
- Repro (scratch script on `styleOutfits`): a 30-piece closet (5 tops, 6 bottoms, 8 hijabs, 4 cardigans, 2 coats, 5 shoes) returns 30 outfits that all share the first top (`limited: true`). With 15 tops only about 11 get explored. Even when nothing is capped, 6 tops give only 3 different mains across 30 outfits.
- Actual: "Another" mostly swaps the hijab or shoes. Expected: a different main or bottom most of the time.
- Cause: `src/domain/styling.ts:691` loops `for (const main of mains)` depth first, and the global count stops at `maxCombinations = 4000` (`:83`, `:681`), so later mains are never scored. `diversify` (`:387`) treats any 2 changed pieces as different, and a hijab or shoe change counts.
- Fix: give each main its share of the budget (round robin, or a per-main beam of about 4000 / mains.length), and make `diversify` require a new main or bottom before it counts accessories.

### B3. "Another" after "Wear this" silently loses the worn state (wrong)
- Repro: tap Wear this (footer shows Worn today + Undo), scroll, tap Another.
- Actual: a new outfit appears with "Wear this" again. The first wear stays logged and can't be undone from Today any more. Wearing again logs a second outfit for the same day.
- Cause: `src/domain/feedback.ts:237` `wornNow` only matches the last wore event against the current session's pieceIds. `woreThis` (`:254`, `:266`) uses the same check.
- Fix: hide Another and the intents while worn (only show Undo), or have Another first undo the wear when you confirm.
- Screen: `worn-then-another.png`

### B4. The outfit changes a few seconds after it appears (wrong)
- Repro: clear the session, launch with a place set. The outfit renders, then the forecast arrives and both the outfit and the caption change.
- Cause: `src/domain/today.ts:469` `saveForecast` restyles everyday and occasion sessions when the weather differs. It does this even after the user has kept or swapped a piece, and it ignores whether the outfit is already worn.
- Fix: wait for the forecast (or the cached one) before the first styling. After that, only restyle when the user has not touched the outfit, and never when it is worn.

### B5. Missing-category closets show only one gap at a time (wrong)
- Repro: a closet with just a blouse and trousers, hijab always.
- Actual: "Add shoes to complete an outfit." Once shoes are added she learns that a hijab is missing too. Expected: one banner listing every missing category ("Add shoes and a hijab").
- Cause: `app/(tabs)/today/index.tsx:163` `result.problems.slice(0, 1)`.
- Fix: merge gap problems into one sentence and one "Add pieces" action.
- Screen: `two-piece-closet.png`

### B6. Party or mehndi with an everyday closet returns casual outfits and says nothing (wrong, stylist)
- Repro: seed closet (no dressy pieces), tap Party or mehndi.
- Actual: tunic + trousers + loafers + blazer (score 0.7, sometimes below 0) offered as a party look. PRODUCT.md wants an honest "is this dressy enough" call.
- Cause: `rulebook.json` only has small formality penalties, and `styleOutfits` raises no problem when the best score is low.
- Fix: when the top outfit hits `formality-below` or scores under 0, add a review problem: "Nothing in your closet is dressy enough for a party. Here's the closest."
- Screen: `gym-work-party.png`

### B7. Gym allows jeans, skirts and tunics once any activewear exists (wrong, stylist)
- Cause: `src/domain/styling.ts` `fitsOccasion` for gym only excludes dresses, bags, accessories, heels and blazers. `gapGym` fires only when there is zero activewear, and `gym-activewear` (+1.5) matches a single t-shirt.
- Fix: for gym, require the main and the bottom to be activewear or sports subcategories. If that leaves nothing, show gapGym.

### B8. Maxi dress over wide-leg trousers ranks above the dress alone (wrong, stylist)
- Repro (script, warm weather): dress + trousers scores 4.5, the dress alone 3.9.
- Cause: colour echo and harmony rules reward the extra hidden bottom more than `dress-with-bottom` (-1) costs.
- Fix: skip colour rules for a bottom under a full-length dress, or make `dress-with-bottom` -2.5 unless the profile wants extra coverage.

### B9. Cold-weather party looks stack a blazer and an open abaya (wrong, stylist)
- Cause: `two-layers-not-cold` only applies when it isn't cold, and nothing penalises two structured mid layers together.
- Fix: add a rule against blazer + abaya (or any two open long layers).

### B10. Reason grammar with plural pieces (polish)
- "The charcoal wide-leg trousers is a warm fabric for a cold day."
- Cause: reason templates in `src/domain/scoring/rules.ts` `reasonFor` always use singular "is".
- Fix: pass a `plural` flag for trousers, jeans, shoes and boots, and add `_plural` keys in i18n.

### B11. Outfit names are weak and sometimes wrong (polish)
- A green embroidered kameez outfit is named "Blouse". The cream tunic outfit is "Pink tunic" or "Pink work tunic" (the name comes from the colour data, not what's in the photo). Party looks are "Party blouse".
- Fix in `outfitName.ts`: build the name from the main subcategory plus the overall palette or mood ("Taupe layers", "Soft neutrals"). Fall back to the piece's own name, never a bare category.
- Screen: `keep-another.png`

### B12. Kept piece has no visible mark on the hero (polish)
- Repro: open the abaya, tap Keep, close the strip. The hero looks exactly the same.
- `keptIds` is passed to `FlatLay` but nothing shows at hero size. Fix: a small pin badge on kept pieces, matching the swap mark.

## 2. UX and design problems

1. **Actions sit below the fold on a 6.1 to 6.3 inch phone.** Another and Adjust need a scroll (the spec says nothing scrolls). The hero is 360 pt plus a big gap above it. Fix: hero about 300 pt, a tighter gap under the intents, and the actions next to the outfit title. Screen: `fold-apple-weather.png`.
2. **Apple Weather is a full purple quiet button** that is louder than the caption and gets cut off under the footer divider. The spec says it should be a tiny footnote. Fix: an 11 pt secondary text link right after the temperature.
3. **The change strip opens below the fold** without scrolling to it, so tapping a piece seems to do nothing. Fix: `scrollTo` the strip when it opens, or show it as a sheet. Screen: `strip-below-fold.png`.
4. **The intent row clips the last pill** ("Party or mehndi", and "Fest eller mehndi" is cut mid-word in NB) with no hint that it scrolls. Fix: shorter labels ("Fest", "Party") so all four fit, or wrap onto 2 rows.
5. **AX5 Dynamic Type:** the intents stack vertically and fill the whole first screen, and the pills become rectangles. Fix: keep a horizontal scroll at large sizes and cap the chip font at AX2. Screen: `dynamic-type-ax5.png`.
6. **The swap mark only shows on the hijab** and floats away from it. The other pieces look untappable. Fix: either no mark at all with a one-time hint, or a small mark on every piece.
7. **Reasons sound robotic** ("Every piece is marked for everyday wear.", "Trousers reach the ankle."). Show one reason, written like a stylist ("Taupe over cream keeps it soft for a cold morning").
8. **Gym and missing-piece states** are a left-aligned card in a large empty area. Fix: show the partial lay with dashed empty slots for the missing pieces and an "Add" in each slot.
9. **The filled heart is ink black.** Use the accent rose so it reads as "loved".
10. **Cold and rain warnings never show** when an outfit exists (for example "no layer warm enough", or loafers in the rain). Show them as one quiet line under the caption.
11. **No dark mode** (light only in `app.json`). Every premium wardrobe app supports it, and the white flat lay is very bright at night.
12. **`npm run evaluate` means nothing yet:** 12 outfits, 3 requests, rated by the developer, and it scores 100%. Rate about 60 outfits from the real closet (including gym, party, cold and rain) before trusting any rule tuning.

## 3. Feature and premium ideas (ranked)

1. **Show what's missing:** the outfit drawn with empty slots for missing categories (shoes, hijab, activewear), each tapping straight into add. This turns dead ends into progress.
2. **Dressy-enough meter:** for Party or mehndi and Work, a small 3-step scale (casual, smart, festive) under the outfit with the closest option, plus one "you'd need..." suggestion.
3. **Weather layer tip:** when it's cold or wet, a one-line tip ("Add the black coat after 17:00, 4°") with a one-tap swap.
4. **Not worn lately:** once a week, build the outfit around a piece she hasn't worn for 30+ days and label it.
5. **Share card:** export the hero lay with the date and weather as a clean 4:5 image for Instagram or WhatsApp.
6. **Morning notification with the outfit:** at a time she picks, send the outfit thumbnail and the temperature. Tapping it opens Today with that outfit ready to wear.
