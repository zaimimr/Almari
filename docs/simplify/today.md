# Simplify: I dag and making a look

Date: 2026-10-05. Scope: the I dag tab, Juster, Start med et plagg, the Samling (Looks) tab, Ny look (`/look/build`), look detail, and the Stilist engine switch ("Needle").

## The 7:15 test

She opens the app late for work. Today she sees, before the outfit is even fully on screen: a greeting, a horizontal row of up to five chips (Jobb, Western, "Oslo 8-12°", Prøvegarderobe, "Startet med ..."), up to five banners, a 236 pt flat lay where every piece is a button, a title with three icons (Liker, Ikke for meg, Lagre), a hidden row of six reason chips, check cards with their own chips, "Et annet", an Undo slot with its own "Ikke for meg", a "Start med" section with up to three look rows plus Hijab, Strikk and "Start med et plagg", a "Lite brukt" carousel of six tiles, an "Apple Weather" link and finally "Bruk dette" in the footer.

That is 30+ distinct controls for a job that has one answer: "here is what you wear, tap to accept". The stylist already generates an outfit with no piece selected (`ensureToday` builds the everyday session on open). The owner's "I have to select a piece" feeling comes from the screen, not the engine: "Start med" sits directly under the outfit and reads as the next step, and the Samling "+" opens a piece picker.

Principle for the rewrite: **one outfit, one yes, one "not that", one "change the brief".** Everything else lives behind Juster or leaves Today.

## 1. Inventory and verdicts

Verdicts: **Keep** (stays on Today), **Move** (lives elsewhere), **Cut** (deleted).

### I dag, header and context

| Control | File | Verdict | Note |
| --- | --- | --- | --- |
| Profile icon (header) | `app/(tabs)/today/index.tsx` | Keep | Header chrome, not a Today action |
| Greeting large title | `src/features/today/useGreeting.tsx` | Keep | Replace with date when not today's outfit |
| Session chip "Startet med X" with x | `src/features/today/ContextRow.tsx` | Cut | The intent row shows the state; kept pieces are visible in Juster |
| Occasion chip (Jobb) | `ContextRow.tsx` | Cut | Replaced by the intent row |
| Style chip (Western/Desi) | `ContextRow.tsx` | Move | To Juster only |
| Weather chip | `ContextRow.tsx` | Cut as a button | Becomes plain text in the hero caption ("8-12° og regn") |
| Sample closet chip | `ContextRow.tsx` | Cut | Sample vs own closet is decided by whether she has pieces |
| Title row "Tilbake til i dag" | `index.tsx` `TitleRow` | Keep (only in tomorrow/plan mode) | Replaces the intent row in that state, so it is never extra |

### I dag, banners

| Control | Verdict | Note |
| --- | --- | --- |
| "I morgen" waiting banner + "Vis i morgen" | Cut | The 21:00 notification opens tomorrow directly; Juster > Når covers the rest |
| Planned look banner + "Vis på I dag" | Cut | If a look is planned for today, it *is* the hero. No banner, no tap |
| Unsaved plan banner + "Åpne plan" / "Forkast" | Cut | Plans are saved when made (see Juster). Nothing half-made survives the night |
| Styling failed + "Prøv igjen" | Keep | Errors only |
| Problem banner (`ProblemBanner.tsx`) | Keep, simplified | One line, one action, and only when there is no outfit at all |
| Stale banner + "Finn nytt" | Cut | Restyle silently when a piece in the outfit is gone |

### I dag, the outfit

| Control | Verdict | Note |
| --- | --- | --- |
| Flat lay, tap a piece to open change strip | Keep | Direct manipulation, not a button row. This is the "what pieces" control at the point of use |
| Hijab swap mark | Keep | Visual only |
| Change strip alternatives | Keep | |
| Change strip "Behold" | Keep | Holds the piece across "Et annet" |
| Change strip "Vis alle" (hijab) | Cut | Strip shows the best 6, enough |
| Change strip "Nytt uten dette plagget" | Cut | "Et annet" after picking an alternative does the same |
| Change strip "Rediger farge" + colour chips | Move | To piece detail (`/piece/[id]`). Fixing data is not getting dressed |
| Outfit name (serif title) | Keep | Part of the hero |
| Reason line | Keep, shorter | One line: weather + why, muted |
| Liker (thumbs up) | Cut | "Bruk dette" is the like. Wear history already feeds taste |
| Ikke for meg (thumbs down) + 6 reason chips | Cut | "Et annet" is the dislike. Reason chips are expert-system UI |
| Lagre / Åpne look (bookmark icon) | Move | Worn outfits land in Samling automatically; save from there (look detail already has "Lagre antrekket") |
| Check card (fact questions, "Lagre svar", "Bruk et annet plagg") | Move | To the Garderobe tab "Bekreft" flow / piece detail. Never block the morning |
| "Et annet" | Keep | Secondary action 1 |
| "Tilbake til det første antrekket" | Keep (as the label of "Et annet" on the last combination) | No new control |
| "Kun én kombinasjon" text | Keep | Text only |
| Undo slot "Angre" after Et annet | Cut | "Et annet" cycles; the first comes back at the end |
| Undo slot "Ikke for meg" + reason chips | Cut | |

### I dag, below the outfit

| Control | Verdict | Note |
| --- | --- | --- |
| "Start med" section title + "Vis alle" | Cut | |
| Matching look rows (up to 3) | Cut | Saved looks live in Samling; "Vis på I dag" there |
| Hijab chip | Move | Juster > Plagg |
| Strikk chip | Cut | Covered by picking a piece in Juster |
| "Start med et plagg" chip | Move | Juster > Plagg |
| "Lite brukt" carousel (6 tiles) | Move | To Garderobe as a sort/filter ("Lite brukt"). Not a 7:15 task |
| Apple Weather link | Keep, demoted | Required WeatherKit attribution. Tiny footnote under the caption, only when a forecast is shown |

### I dag, footer

| Control | Verdict |
| --- | --- |
| "Bruk dette" | Keep, primary |
| "Brukt i dag" + "Angre" | Keep |
| "Lagre antrekket" / "Åpne look" (plan mode) | Keep, renamed "Lagre for {dag}" |

### Juster (`app/today/adjust.tsx`)

| Control | Verdict | Note |
| --- | --- | --- |
| Anledning chips (7) | Keep | Add Trening |
| Når: I dag / I morgen / Velg dato | Keep | |
| Stil segmented | Keep | |
| Ha på chips (7 garment types) | Cut | Replaced by "Plagg" row; "Hijab" etc. via piece picking |
| Start med et plagg row / Beholder X + "Slutt å beholde" | Keep, renamed section "Plagg" | Generation still works with zero pieces |
| Vær chips (Bruk værmelding, Ikke satt, Varmt, Mildt, Kaldt) | Cut | Forecast is automatic. No forecast means no weather rule |
| Opphold (Tørt, Regn, Snø) | Cut | |
| Dagen din (Mest inne / Ute) | Cut | Set once in Din stil |
| Garderobe (Prøve / Egen) | Cut | |
| Ta med plagg lagt til side | Cut | |
| Lagre i Din stil toggle | Cut | Din stil is edited in Profile |
| Footer "Vis antrekk" | Keep | Enabled with no change at all too (fresh outfit for the same brief) |

### Start med et plagg (`app/today/pieces.tsx`)

Keep as is, reached only from Juster > Plagg.

### Samling and look creation

| Control | File | Verdict | Note |
| --- | --- | --- | --- |
| Header "+" Ny look | `app/(tabs)/looks/index.tsx` | Cut | Creating a look = I dag |
| Header Kalender | same | Keep | |
| Empty state "Ny look" | same | Change | "Lag et antrekk" switches to the I dag tab |
| Look rows | same | Keep | |
| `/look/build` new mode: category tabs, piece picker, "Fyll ut resten", occasion chip and picker, swap strip, name, "Lagre antrekket" | `app/look/build.tsx` | Cut new mode | Second outfit generator with its own UI. Keep only edit mode |
| Look detail: Gi nytt navn, Vis på I dag, Lagre antrekket, Endre plagg, piece rows, Brukt (I dag/I går), Planlegg en dag, Fjern plan, Fjern | `app/look/[id].tsx` | Keep | This is the right home for save/plan/rename |
| Closet select "Ny look" | `src/features/closet/useClosetScreen.ts:224` | Cut | "Start med disse" already exists and lands on I dag |
| Piece detail "Bruk i en look" | `app/piece/[id].tsx:234` | Cut | "Start med dette plagget" already exists |

### Profile

| Control | Verdict |
| --- | --- |
| Profile > Stilist row (Regler / Modell / Sammenlign) | Cut (this is "Needle", see section 4) |

## 2. New I dag

### Layout (top to bottom, everyday mode)

```
[ God morgen, Sara ]                                   (o)   <- large title, profile icon

  Hverdag   Jobb   Trening   Fest                            <- intent row, one selected

  +-------------------------------------------------+
  |                                                 |
  |            flat lay, full width                 |         <- hero, silk background,
  |            (tap a piece = change strip)         |            no buttons inside
  |                                                 |
  +-------------------------------------------------+
  Kremhvit og kamel                                          <- serif outfit name
  8-12° og regn i Oslo                                       <- muted caption (+ tiny Apple Weather)

        Et annet                 Juster                      <- two quiet secondary actions

[               Bruk dette               ]                   <- footer primary
```

Counts: 1 primary, 2 secondary, 4 intent pills, the pieces. Nothing scrolls on a 6.1" phone.

### Rules

- **Primary:** "Bruk dette". After tap: "Brukt i dag · Angre". The outfit now also appears in Samling > Brukt.
- **Secondary 1:** "Et annet" cycles the ranked list. On the last one it reads "Tilbake til det første".
- **Secondary 2:** "Juster" pushes `/today/adjust` (full screen push, no sheet).
- **Intent row** (one tap, outfit now): `Hverdag`, `Jobb`, `Trening`, `Fest`. Tapping one restyles in place with the "arranging" animation and no navigation. It starts a today-only occasion session with the current request, the new occasion and no kept pieces. Tapping the intent that equals her everyday preset returns to the everyday session (`backToEveryday`). If Juster set an occasion outside the four (Middag, Eid, Bryllup, Barat), a fifth pill with that name appears selected at the end, so the row always tells the truth.
- **No piece needed, ever.** Every path (open app, intent tap, Juster > Vis antrekk with empty Plagg) generates from the whole closet.
- **Hero for screenshots:** flat lay full content width (drop the 236 pt cap; use the gutter width, max about 360 pt), centred on the silk surface, name and caption below it, nothing tappable drawn on top except the existing small hijab mark. A screenshot from intent row to caption is a clean square-ish post.
- **Change strip:** opens inline under the hero when a piece is tapped, shows alternatives and "Behold". Tapping the same piece again closes it.
- **Tomorrow / plan mode:** intent row is replaced by "I morgen" (or the date) and "Tilbake til i dag". Footer reads "Lagre for {dag}" and saves a planned look in one tap.
- **No outfit possible:** hero area shows one line and one action, e.g. "Ingen treningsklær ennå" + "Legg til plagg". Footer hidden.
- **First run:** unchanged (`FirstRun.tsx`).

### Trening (new occasion)

The taxonomy has no gym occasion and no activewear. Minimum to make "Trening" honest:

- `src/domain/taxonomy.ts`: add `{ id: "gym", formality: 0 }` to `occasions`, and kinds `leggings` (bottom), `joggers` (bottom), `sports-top` (top), `hoodie` (top), all `styles: both`.
- Rules (`src/domain/scoring/rulebook.json` / `rules.ts`): for `gym`, require sneakers, prefer the new kinds and `t-shirt`, exclude dresses, abaya, kaftan, heels, blazer, coat-as-layer only when cold; hijab prefers `instant-hijab`; skip bag and accessory.
- Copy: `occasion.gym` "Trening" / "Gym", `occasion.gym.phrase` "trening" / "the gym", kind labels.
- The on-device classifier does not know the new kinds; she sets the kind by hand once per piece. Acceptable.

### Copy (nb / en)

| Key | nb | en |
| --- | --- | --- |
| `today.adjust` (new) | Juster | Adjust |
| `today.another` | Et annet | Another |
| `outfit.wear` | Bruk dette | Wear this |
| `today.saveFor` (new) | Lagre for {day} | Save for {day} |
| `adjust.pieces` (new section) | Plagg | Pieces |
| `occasion.gym` (new) | Trening | Gym |

## 3. Samling and build collapse into I dag

- **One generator.** I dag is the only place a new outfit is made. Samling holds results: saved, worn, planned, calendar.
- Remove the "+" from the Samling header. Empty state action becomes "Lag et antrekk" and navigates to `/(tabs)/today`.
- `/look/build` keeps only edit mode (`?id=`), reached from look detail "Endre plagg". Drop its occasion chip and occasion picker (a look keeps the occasion it was made with). "Fyll ut resten" stays in edit mode, it is useful after removing a piece.
- Closet select "Ny look" and piece detail "Bruk i en look" are removed; both screens already have "Start med disse" / "Start med dette plagget", which land on I dag with those pieces kept. Save from there by wearing it, or from Samling.
- Saving: I dag no longer has a save icon. Worn outfits appear in Samling > Brukt where look detail offers "Lagre antrekket". Planned outfits are saved by "Lagre for {dag}".

## 4. Delete "Needle"

What "Needle" is: Cactus Needle (a small on-device text model) was researched for care labels and parsing and **never shipped**; `planning/implementation/STATUS.md` already says "no Needle traces remain in the code". What the owner sees in the app is the **Stilist** switch in Profile (Regler / Modell / Sammenlign). "Modell" is a trained outfit-compatibility head (Polyvore, over SigLIP 2 embeddings) and "Sammenlign" alternates it with the rules per suggestion. That is the thing to delete. The rules scorer stays the only stylist.

Keep: `GarmentEncoder.mlpackage` / `.mlmodelc` and `piece.embedding`. They power duplicate detection (`src/domain/duplicates.ts`) and zero-shot labelling in `ClosetVisionModule.swift`, not the Modell engine.

### Delete files

- `src/domain/scoring/modelScorer.ts`
- `src/domain/scoring/compat-head.json`
- `src/domain/scoring/sample-embeddings.json`
- `src/domain/scoring/evaluate-engines.ts`
- `src/domain/scoring/results.ts` (engine comparison stats, only used by tests)
- `src/domain/modelScorer.test.ts`
- `src/domain/engineResults.test.ts`
- `app/profile/stylist.tsx`
- `modules/closet-vision/model/compat/` (whole folder: `common.py`, `download.py`, `embed.py`, `embed_samples.py`, `evaluate.py`, `export.py`, `head.py`, `train.py`, `README.md`)
- `.maestro/profile/stylist.yaml`

### Edit files

- `src/domain/scoring/engine.ts`: delete `engineChoices`, `engineName`, `firstEngine`, `modelReady`, `engineFor`, `setEngine`; `scorerFor` collapses to returning `rulesScorer`. Simplest end state: delete the file and import `rulesScorer` directly in `today.ts`, `builder.ts`, `useToday.ts`.
- `src/domain/today.ts`: drop the `engine` parameter of `resultFor` and `sessionFor`, stop writing `session.engine`.
- `src/domain/builder.ts:64,74`: use `rulesScorer`.
- `src/features/today/useToday.ts:28,112,155`: use `rulesScorer`.
- `src/domain/closet.ts`:
  - Remove `engine` from `Styling` (line 480) and the default at 530 and 1037.
  - **Gotcha:** `hasStylistState` rejects the whole closet if a stored value is not valid. Old saves contain `styling.engine: "model" | "compare"`, `session.engine` and `feedback[].engine: "model"`. Decoder must accept and drop `styling.engine` of any value; keep `engine?: "rules" | "model"` as an optional, read-only field on `FeedbackEvent` and `Session` (make it optional on `FeedbackEvent`, stop writing it). Add a decode test with a closet saved with `engine: "compare"` and a `model` feedback event.
- `src/domain/scoring/types.ts:22`: drop `id: Engine` from `Scorer` (or keep as the literal `"rules"`).
- `app/profile/index.tsx:6,203-207`: remove the Stilist row and the `engineName` import.
- `src/i18n/nb.ts` and `src/i18n/en.ts`: remove `stylist.rules`, `stylist.model`, `stylist.compare`, `stylist.label`, `stylist.help`, `stylist.results`, `stylist.intro`, `stylist.wouldWear`, `stylist.notMyStyle`, `stylist.wore`, `stylist.unreadOne`, `stylist.unreadMany`, `stylist.rate`, `stylist.noFeedback`. Keep `stylist.often`, `stylist.keptAway`, `stylist.keptArchived` (reason lines).
- Tests to edit: `src/domain/engine.test.ts` (delete, or keep only the "today records rules" case), `src/domain/feedback.test.ts:32,360-361` (drop `engineResults` assertions), `src/domain/stylist-state.test.ts` (assert legacy `engine` is ignored), `src/domain/scoring/golden.test.ts:177-184` (delete "records the engine" test). Fixtures in `closet.test.ts`, `profileStats.test.ts`, `wardrobe.test.ts`, `closetFilters.test.ts` and `.maestro/lib/seed-wears*.sh` can keep `engine: "rules"` (still decodes) and be cleaned later.
- Docs: remove the Modell rows from `modules/closet-vision/model/README.md` and `planning/eval/README.md`; note the removal in `docs/redesign/architecture.md` "Owner decisions" (it currently says the engine switch stays in release builds).

## 5. Implementation steps

Each step is one commit, ships alone, and keeps `npm run check` green.

1. **Delete Needle (Modell engine).** Section 4, files and edits. Verify: `npm run check`, open an old closet backup with `engine: "compare"` in the simulator, Profile has no Stilist row.
2. **Add Trening.** `src/domain/taxonomy.ts` (occasion + 4 kinds), `src/domain/scoring/rulebook.json` and `rules.ts` (gym rules), `src/i18n/nb.ts` / `en.ts` (labels, phrases, kinds). Domain tests in `src/domain/scoring/rules.test.ts`: gym picks sneakers, never a dress or heels, returns a "missing activewear" problem on a closet without any.
3. **Intent row.** New `src/features/today/IntentRow.tsx` (Hverdag, Jobb, Trening, Fest, plus the current occasion if outside the four). Add `useToday().intent(occasion)` in `src/features/today/useToday.ts`: `restyle(c => occasion === everyday.occasion ? backToEveryday(c) : startOccasion(c, { ...request, occasion, keptIds: [], garmentType: null }), null)`. Replace `<ContextRow>` with `<IntentRow>` in `app/(tabs)/today/index.tsx`. Delete `ContextRow.tsx`; move `weatherText`/`forecastText` into the caption.
4. **Hero and actions.** In `app/(tabs)/today/index.tsx`: raise the flat lay size, render name + caption (weather text, Apple Weather footnote when forecast shown), render a two-button row "Et annet" / "Juster". Rewrite `src/features/today/OutfitCard.tsx` to name + caption only (delete like, not-for-me, save, reason chips, check cards). Shrink `src/features/today/ActionArea.tsx` to the two buttons (delete undo slot and skipped reasons). Remove `like`, `feedback`, `skippedFeedback`, `undo`, `slot`, `saveLook` (everyday mode) from `useToday` if nothing else uses them.
5. **Remove the clutter below the outfit.** Delete `src/features/today/StartWith.tsx`, `Rediscover.tsx`, `CheckCard.tsx` and their usage. Remove the tomorrow-waiting, planned, unsaved-plan and stale banners from `Banners` in `index.tsx`; make a planned look for today the hero (`useToday`: if `planned`, show its pieces); restyle silently when `lostPieces > 0`. Keep styling-failed and one problem line.
6. **Change strip trim.** In `index.tsx` `Strip`: drop `onShowAll`, `onAnotherWithout`, `onEditColour`, colour editing and `ColourChips`. Leave `src/features/ChangeStrip.tsx` props optional so `/look/build` edit keeps working.
7. **Juster trim.** `app/today/adjust.tsx`: sections Anledning, Når, Stil, Plagg. Delete Ha på, Vær, Opphold, Dagen din, Garderobe, include set-aside and Lagre i Din stil. `src/features/adjust/useAdjust.ts`: drop `makeEveryday`, `exposure`, `includeSetAside`, weather setters; let "Vis antrekk" submit when not dirty. Planning a date: on submit, `startPlan` and Today footer "Lagre for {dag}" saves the look with the plan date; remove `unsavedPlan`/`resumePlan`/`discardPlan` callers.
8. **Samling collapse.** `app/(tabs)/looks/index.tsx`: remove header "+", empty state action goes to `/(tabs)/today` with label "Lag et antrekk". `app/look/build.tsx` + `src/features/builder/useBuilder.ts`: require `id` (edit only), drop occasion chip/picker. `app/piece/[id].tsx:234` and `src/features/closet/useClosetScreen.ts:224`: remove "Bruk i en look" / "Ny look".
9. **Move what moved.** "Lite brukt" as a Garderobe sort/filter (`src/features/closet/*`, uses `rediscover` from `src/domain/wardrobe.ts`). Colour edit already exists on piece edit. Check questions go to the existing Garderobe confirm flow.
10. **Copy and strings.** Remove orphaned keys in `src/i18n/nb.ts` / `en.ts` (`today.startWith`, `today.rediscover`, `today.garment.*`, `today.planned`, `today.unsavedPlan`, `today.openPlan`, `today.showTomorrow*`, `outfit.like`, `outfit.notForMe*`, `outfit.thanks`, `outfit.chipHint`, `feedback.*` chips if unused, `adjust.*` for removed sections, `looks.new`, `build.*` new-only). `npm run strings` must pass.
11. **Maestro.** Delete `.maestro/today/{check,feedback,thumbs,rediscover,start-with,save-look,save-error-1,save-error-2,undo,planned}.yaml`, `.maestro/adjust/{closet-source,discard,make-everyday,save-error}.yaml`, `.maestro/build-look/{new,prefilled,filters}.yaml`, `.maestro/change-piece/colour.yaml`, `.maestro/profile/stylist.yaml`. Add `.maestro/today/intent.yaml` (tap Trening, outfit changes, Bruk dette) and `.maestro/today/rush.yaml` (cold open, Jobb, Bruk dette, under 3 taps). Update `another.yaml`, `outfit.yaml`, `wear.yaml`, `tomorrow-*.yaml`, `adjust/*.yaml` for the new controls.
12. **Screenshot check.** Simulator screenshots of I dag in nb at default and largest text, in everyday, Trening, tomorrow and no-outfit states; compare against this layout.

## What gets lost, honestly

- Explicit like/dislike and reason chips: taste learns from wears and skips only. Fine for two users; revisit if suggestions drift.
- Manual weather override: if the forecast is wrong she picks another outfit with "Et annet".
- Quick "Start med" a saved look from Today: one extra tap via Samling > Vis på I dag.
- The Modell engine and its comparison numbers. The rules scorer has been the default for every session already.
