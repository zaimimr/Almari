# Simplify: profile, onboarding and visual language

Date: 2026-10-05. Scope: `app/profile/*`, `src/features/profile/*`, `app/onboarding/*`, `src/features/onboarding/*`, `src/features/selfie/*`, `src/navigation/*`, `src/ui/*`, `assets/illustrations`.

The one idea: **Profile is her style card, not a control panel.** One screen she would screenshot: her name, the drawings of what she wears, and a handful of plain rows. Everything that reads like tuning a machine goes.

---

## 1. Inventory and verdicts

Today Profile (`app/profile/index.tsx`) has 7 blocks, 17 controls and 5 sub screens. Your style (`app/profile/style.tsx`, 448 lines) adds 9 expanders and 7 style rules, with two save buttons.

### Profile (`app/profile/index.tsx`)

| # | Control | What it is | Verdict | Why |
|---|---|---|---|---|
| 1 | Completeness meter "The stylist knows 62% of your style" + quick-add chips (`Completeness.tsx`) | Gamified score and up to N chips | **Cut** | Reads as an expert system grading her. The style board (section 2) shows unanswered questions as empty drawings, which says the same thing without a score |
| 2 | Your style row | Opens 9-expander editor | **Merge** into the style board on Profile | One less screen |
| 3 | I'll never wear row | Garment kinds, colours, patterns | **Keep** | Simple and useful, already autosaves |
| 4 | Trying to wear more of row | Piece picker | **Cut** (remove row and screen; keep domain field) | Niche, nobody thinks this way on day one. "Wear this" on a piece already covers it |
| 5 | Your answers > Name | Edit name | **Merge**: tap the name in the header | |
| 6 | Your answers > Location | City for weather | **Keep** as a row | Weather is a real driver of outfits |
| 7 | Your answers > Body (height, shape) | | **Keep** as a row | |
| 8 | Your answers > Colours | Selfie palette | **Merge** into the style board as a swatch tile | Most visual, most shareable answer |
| 9 | Closet stats > Never worn | Count, opens filtered Closet | **Cut** from Profile | Closet filter already has it; Profile is not a dashboard |
| 10 | Closet stats > Most worn | | **Cut** from Profile | Belongs in Looks calendar if anywhere |
| 11 | Settings > Morning outfit (notification time) | Expander with chips | **Keep** | Inline expander is fine (no sheet) |
| 12 | Settings > Language | Expander with chips | **Keep** | |
| 13 | Settings > Outfit card (Outfit only / With reasons / With reasons and coverage checks) | `styling.layout` | **Cut** | Dead setting: nothing outside Profile reads `styling.layout` (grep: only `app/profile/index.tsx` and the parser in `src/domain/closet.ts`). Pure noise |
| 14 | Advanced > Stylist (Rules / Model / Compare) + `app/profile/stylist.tsx` | Scoring engine switch | **Hide** | Debug. Reachable only in `__DEV__` by long-pressing the version line |
| 15 | App > Show intro again | Replays onboarding | **Cut** | Every answer is editable on the style board; replay is a dev tool |
| 16 | App > Delete all data | | **Keep** | Required, system confirm stays |
| 17 | Privacy footnote + Version | | **Keep**, shorten privacy to one line: "Everything stays on this phone." | |

### Your style (`app/profile/style.tsx`) - screen removed, answers move to the board

| Control | Verdict | Where it goes |
|---|---|---|
| Occasion (everyday, work, Eid, ...) | **Cut here** | It is a per-day choice; Today's Adjust already owns it |
| Hijab | **Keep** | Board tile -> single step screen |
| Hijab styles | **Keep** | Board tile (hidden when hijab = No) |
| Coverage (+ "My own" sleeves/hem chips) | **Keep** coverage, **cut** "My own" | Board tile. "My own" sleeve/hem is an expert knob; the three drawn levels + No preference are enough. Domain keeps the fields |
| Everyday style | **Keep** | Board tile |
| Fit | **Keep** | Board tile |
| Sparkle for events | **Keep** | Board tile, now drawn (section 3) |
| Your day (indoors / time outside) | **Cut here** | Per-day; Today's Adjust owns it |
| Style rules (belt over outer, min top length, bottoms, print on print, dupatta, region, avoid at weddings) | **Hide** (remove UI, keep stored values) | Seven rules is the definition of an expert system. Defaults are fine. If one rule earns its way back, it should be "Trousers, skirts or both", shown as a drawn tile |
| Save / Save and restyle footer, Cancel, discard prompt | **Cut** | Each step saves on Save, like the existing single-step onboarding screen. Today restyles on next open |

### Sub screens

| Screen | Verdict |
|---|---|
| `app/profile/answer/[step].tsx` (single onboarding step / BodyAnswer) | **Keep**, becomes the only editor for every board tile |
| `app/profile/never.tsx` | **Keep** as is |
| `app/profile/wear-more.tsx` | **Delete** |
| `app/profile/stylist.tsx` | **Keep file**, dev-only entry |
| `app/profile/style.tsx` | **Delete**; redirect callers to `/profile` |
| `app/onboarding/colours.tsx` + `src/features/selfie/*` | **Keep**, opened from the Colours tile |

---

## 2. New Profile

One screen, no sections with headings except one eyebrow. No expanders except the two inline ones.

```
 ┌──────────────────────────────────┐
 │ Aisha                    (serif, display 40)
 │ Oslo                     (subhead, muted)
 │
 │ YOUR STYLE               (eyebrow)
 │ ┌────────┐ ┌────────┐
 │ │drawing │ │drawing │    2-col board, 3:4, art full bleed
 │ │        │ │        │
 │ └────────┘ └────────┘
 │ Hijab      Coverage      label: eyebrow (question)
 │ Shayla     Modest        value: subhead ink (answer)
 │ ┌────────┐ ┌────────┐
 │ │ style  │ │  fit   │
 │ └────────┘ └────────┘
 │ ┌────────┐ ┌────────┐
 │ │sparkle │ │swatches│    Colours tile: palette swatches on paper
 │ └────────┘ └────────┘
 │
 │ I'll never wear        3  ›
 │ Body          165 cm · Pear ›
 │ Location           Oslo   ›
 │ Morning outfit     07:00  ˅   (inline expander)
 │ Language    Follow phone  ˅   (inline expander)
 │ Delete all data              (error tone)
 │
 │ Everything stays on this phone.
 │ Version 0.1.13            (long-press: Stylist, dev only)
 └──────────────────────────────────┘
```

- **Rows: 6.** Never wear, Body, Location, Morning outfit, Language, Delete all data.
- **Board tiles** (one per answer, the drawing of her current answer): Hijab styles (or Hijab when she wears none), Coverage, Everyday style, Fit, Sparkle, Colours. Unanswered tile: the empty `paper` card with a plum "+" and the question as value ("Add"). This replaces the completeness meter.
- Tap a tile -> `router.push("/profile/answer/<step>")`, which already renders the onboarding step in single mode with one Save. Hijab tile opens `hijab`, and from there `hijabStyles` is the next tile.
- Tap the name -> `/profile/answer/name`.
- Multi-select hijab styles show the first chosen drawing with "+2" in the value line.
- The board is the Instagram moment: the illustrations already share one hand and one paper, so the grid looks like a fashion sketchbook page.

---

## 3. Onboarding

### Shortest path that still gives good outfits

What actually moves the scorer: hijab, coverage, everyday style, place (weather). Sparkle only matters on event days but is cheap with drawings and is what the owner asked to see. Name is one field and powers the greeting.

| Now (10) | New (7, or 6 without hijab) |
|---|---|
| name, hijab, hijab styles, coverage, style, fit, sparkle, place, notifications, colours, done | **name, hijab, hijab styles\*, coverage, style, sparkle, place, done** |

- **Fit** moves out: defaults to "It depends", editable on the board.
- **Notifications** move out: Profile > Morning outfit. Do not ask for push permission before she has seen one outfit.
- **Colours** (selfie) moves out: the Colours tile on the board, the most fun thing to do after the first outfit, not a hurdle before it.
- Done keeps "Add pieces" and "Try the sample closet".
- Every remaining step is a drawn card grid except name and place, so onboarding is now mostly pictures.

\* skipped when hijab = No (existing `stepsFor`).

### Sparkle illustrations (owner: "The sparkle screen does not have reference drawn photos")

Current state: `src/features/onboarding/StepSparkle.tsx` renders a `ChipRow` of words (Plain, A little, Heavy, Bridal). `illustrations.ts` maps 16 files, none for sparkle. `architecture.md` row 7 says "words only, no illustration", which the owner now overrides.

**Existing art (16 files, `assets/illustrations/`, 600 x 800 JPEG, approved as is):**
`coverage-full`, `coverage-moderate`, `coverage-relaxed`, `style-western`, `style-abaya`, `style-desi` (on disk, unused), `style-mix`, `fit-loose`, `fit-structured`, `hijab-hijab`, `hijab-shayla`, `hijab-al-amira`, `hijab-khimar`, `hijab-chador`, `hijab-niqab`, `hijab-burqa`.

**Need generating (4):** `sparkle-plain.jpg`, `sparkle-little.jpg`, `sparkle-heavy.jpg`, `sparkle-bridal.jpg`.

Match the approved v1 look (single full-length front-facing woman, soft coloured pencil and watercolour, warm ivory paper, dusty rose or plum hijab, no text). Same model and seed as v1: flux-2-dev, `SEED=7`.

```sh
S="Fashion illustration, soft coloured pencil and watercolour, one young woman standing front-facing, full length, centred, wearing a draped hijab in dusty rose, calm expression, plain warm ivory paper background, muted palette, no text, no logo"
SEED=7 scripts/illustrate.sh /tmp/sparkle-plain.png  "$S, festive but plain: a long solid silk kameez and straight trousers, no embroidery, no jewellery"
SEED=7 scripts/illustrate.sh /tmp/sparkle-little.png "$S, a long kameez with a little gold embroidery at the neckline and cuffs only, small earrings"
SEED=7 scripts/illustrate.sh /tmp/sparkle-heavy.png  "$S, a long anarkali covered in dense gold zari embroidery and sequins, embellished dupatta, statement earrings"
SEED=7 scripts/illustrate.sh /tmp/sparkle-bridal.png "$S, bridal: a deep red heavily embroidered lehenga with a long gold-bordered dupatta over the hijab, bridal jewellery"
for f in plain little heavy bridal; do
  sips -z 800 600 -s format jpeg -s formatOptions 70 /tmp/sparkle-$f.png --out assets/illustrations/sparkle-$f.jpg
done
```

Check the four next to `style-mix.jpg` for the same scale and paper; re-roll a single one with another seed if it drifts. Each file ~30 KB, so the bundle grows ~120 KB.

**Wiring:**

1. `src/features/onboarding/illustrations.ts`: add the four `sparkle-*` requires, and
   ```ts
   export function sparkleOptions(): ChoiceOption<Sparkle>[] {
     return sparkles.map((id) => ({
       id,
       label: t(`sparkle.${id}`),
       description: t(`sparkle.${id}.description`),
       image: illustrations[`sparkle-${id}`],
     }));
   }
   ```
2. `src/features/onboarding/StepSparkle.tsx`: replace `ChipRow` with `ChoiceCardGroup<Sparkle>` (`options={sparkleOptions()}`, `value={answers.sparkle.sparkle}`, same `onChange`, `testID="sparkle"`). Card testIDs become `sparkle-plain` etc. (`ChoiceCard.tsx` line 191), so `.maestro/start/sparkle.yaml` (`id: "sparkle-heavy"`) keeps working.
3. `src/i18n/en.ts` + `nb.ts`: add `sparkle.<id>.description` (VoiceOver), e.g. en "No embroidery" / "Embroidery at the neck and cuffs" / "Embroidered all over" / "Full bridal" ; nb "Uten broderi" / "Broderi ved hals og ermer" / "Broderi over alt" / "Full brudestas".
4. `docs/redesign/architecture.md` row 7 and `design-system.md` ChoiceCard table: sparkle is now a drawn 2 x 2 grid.

---

## 4. Visual language: editorial, inside the existing palette

Keep: white `canvas`, `plum` for actions, `ink` (bark), `blush` for "selected", `paper` behind art. Change how much air and type contrast there is. Today the app looks like iOS Settings with Georgia titles; it should look like a fashion magazine page.

### Tokens (`src/ui/theme.ts`, mirror in `DESIGN.md`)

| Token | Now | New | Why |
|---|---|---|---|
| `type.display` | Georgia 34/41, -0.4 (not exposed in `Text`) | Serif 40/44, -0.8, exposed as `role="display"` | Hero names and greetings |
| `type.title` | Georgia 26/32 | Serif 28/34, -0.4 | |
| new `type.eyebrow` | none | system 12/16, weight 600, `letterSpacing: 1.4`, uppercase, `inkMuted` | Editorial section labels instead of 17 pt semibold headlines |
| `type.headline` | 17/22 600 | unchanged, used less | |
| Serif family | system `Georgia` | Bundle **Fraunces** (soft, opsz) via `@expo-google-fonts/fraunces`, 400 and 600. Fallback: keep Georgia if the owner prefers no new dependency | Georgia reads "default"; Fraunces reads editorial at large sizes |
| `space` | xs4 sm8 md12 lg16 xl24 xxl32 | add `xxxl: 48` | Section gaps |
| page gap | `space.xl` (24) | `space.xxxl` (48) between blocks, `space.xl` inside | Air is the cheapest luxury |
| gutter (`gutterFor`) | 16 / 20 | 20 / 24 | Wider margins = magazine column |
| `radius` for art and photos | `md` 12 | new `radius.print: 4` | Printed-photo corners on tiles, cards, collages. Controls keep 12 and full |
| `elevation.rest` on cards | shadow 0.10 | `flat` everywhere except floating camera controls | Flat paper look |
| `surface` fills on Expander and Rows | `#FBF9F7` box | no fill, hairline `line` separators | Boxes read as settings UI |
| Row `minHeight` | 52 | 56, title `body`, value `subhead inkMuted` | Calmer rhythm |

### Shared components to change

- `src/ui/theme.ts`: tokens above.
- `src/ui/Text.tsx`: add `display` and `eyebrow` to `TextRole`; serif family from theme, `Fraunces-SemiBold` where it now picks `Georgia-Bold`.
- `src/ui/Section.tsx`: title renders as `eyebrow`, count muted inline.
- `src/ui/Row.tsx` and `Rows`: new height, no fill.
- `src/ui/Expander.tsx`: default to no fill, hairline under the header; open body on `canvas`.
- `src/ui/ChoiceCard.tsx`, `Tile.tsx`, `OutfitCollage.tsx`, `FlatLay.tsx`: `radius.print`; art on `paper`.
- `src/ui/Screen.tsx` + `src/navigation/options.ts`: large title in the new serif at 40; gutter from `gutterFor`.
- `src/navigation/Tabs.native.tsx`: keep 3 tabs. Today's profile button (`app/(tabs)/today/index.tsx` ~line 366) shows her initial in a `blush` disc instead of the SF `person.crop.circle`.
- `app/_layout.tsx`: load fonts before hiding splash.

### Rules

- One plum filled button per screen. Everything else quiet.
- Section names are eyebrows, never 17 pt bold.
- Pictures (drawings, garments, outfits) are the colour; UI stays ink on white.
- No meter, no percent, no counts unless she asked for them.

---

## 5. Implementation steps (one developer, in order)

Each step is shippable and keeps the build green (`npm test`, typecheck, Maestro flows named).

1. **Sparkle drawings.** Generate and resize the four files (section 3). Edit `src/features/onboarding/illustrations.ts`, `src/features/onboarding/StepSparkle.tsx`, `src/i18n/en.ts`, `src/i18n/nb.ts`. Run `.maestro/start/sparkle.yaml`. Update `docs/redesign/architecture.md` row 7.
2. **Trim onboarding to 7 steps.** `src/domain/onboarding.ts` `onboardingSteps`: drop `fit`, `notifications`, `colours`. `app/onboarding/index.tsx`: keep the `questions` map and step cases (single-step mode still uses them for the board). Update `src/domain/onboarding.test.ts`, `.maestro/start/onboarding.yaml`, `.maestro/start/fit.yaml` (move to profile), screenshot flow. Check `src/domain/profileStats.ts` completeness no longer expects them at onboarding.
3. **Cut dead and expert settings.** `app/profile/index.tsx`: remove Outfit card expander (+ `style.layout*` copy), Advanced section, Show intro again, Closet stats, Completeness. Long-press on the version `Text` pushes `/profile/stylist` only when `__DEV__`. Delete `.maestro/profile/stylist.yaml` (or make it dev-only), `.maestro/profile/completeness.yaml`, and the replay part of `about.yaml`/`reset.yaml`. Leave `styling.layout` in the parser so old data loads.
4. **Remove Wear more.** Delete `app/profile/wear-more.tsx`, its row, `quickRoutes.wearMore` in `src/features/profile/useProfile.ts`, `.maestro/profile/wear-more.yaml`. Keep `profile.wearMore` in the domain.
5. **Style board.** New `src/features/profile/StyleBoard.tsx`: 2-column grid of `ChoiceCard`-styled tiles (reuse `illustrations` map, `paper` placeholder for unanswered, swatch tile from `paletteOf` for Colours). Tile press -> `/profile/answer/<step>`. Rebuild `app/profile/index.tsx` as: name header (display, tap -> name), place line, eyebrow + board, the 6 rows, footer. Remove `Completeness.tsx`. Single-step saves already create `styling.everyday` through `withPreset` in `src/domain/onboarding.ts`; verify on a fresh install that Today shows an outfit after answering only from the board.
6. **Delete Your style.** Remove `app/profile/style.tsx` and `src/features/profile/StyleRules.tsx`. Redirect `src/features/today/FirstRun.tsx` (line 40) and `app/piece/[id].tsx` (lines 101, 107) to `/profile` (or straight to `/profile/answer/coverage` where the piece flow wanted coverage). Replace `quickRoutes` entries pointing at `/profile/style?open=` with `/profile/answer/<step>`. Update `.maestro/profile/your-style.yaml`, `answers.yaml`.
7. **Tokens and type.** `src/ui/theme.ts`, `src/ui/Text.tsx` (display, eyebrow), fonts in `app/_layout.tsx` + `package.json`, `src/navigation/options.ts`. Then `Section.tsx`, `Row.tsx`, `Expander.tsx`. Mirror in `DESIGN.md`.
8. **Art corners and flat cards.** `ChoiceCard.tsx`, `Tile.tsx`, `OutfitCollage.tsx`, `FlatLay.tsx`: `radius.print`, no `rest` shadow. Today header initial disc in `app/(tabs)/today/index.tsx`.
9. **Screenshots.** Re-run the Maestro screenshot flows for start and profile; compare before and after for the owner.
