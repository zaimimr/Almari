# Almari architecture

Date: 2026-10-03. Phase 1 output. Source: `docs/redesign/inventory/*.md`, the spec, `PRODUCT.md`, `DESIGN.md`, `planning/TODAY.md`, `planning/OUTFIT-BUILDER.md`, `planning/implementation/PRODUCT-UX.md`, `app/`.

## Principles

1. One loop: capture -> closet -> outfit -> look -> wear. Every flow ends by handing the user to the next step in that loop, never by closing a sheet into nothing.
2. Three tabs, one stack. Everything that is not a tab root is a push with a native back chevron, or an inline change on the screen the user is already on. No sheets, no modals on modals, no `router.replace` jumps between tabs from inside a flow.
3. One screen, one job, one primary action. The primary action is a pinned footer button on every screen that commits something. Header right holds at most two icon actions.
4. Fewer words. Labels and values. Helper text only where the user cannot act without it.
5. The logo is the loading language. The scarf A drapes in on the splash, shimmers while anything loads, and marks every empty state. Blush pink marks what is selected, new or chosen for today. Plum is the action colour.

## Tabs

| Tab | Route | Icon (SF, same name on web) | Job | Header right |
|---|---|---|---|---|
| Today | `/(tabs)/today` | `sparkles` | Today's outfit and everything that changes it | Profile (`person.crop.circle`) |
| Closet | `/(tabs)/closet` | `hanger` | Pieces: add, find, inspect, link | Add (`plus`), Select |
| Looks | `/(tabs)/looks` | `rectangle.stack` | Saved and worn combinations | New look (`plus`) |

Decisions:

- Profile leaves the tab bar. It is pushed from the Today header. `DESIGN.md` and `PRODUCT-UX.md` both placed settings behind Today's profile. Three tabs keep bokmål labels short (I dag, Garderobe, Antrekk) and remove the weakest tab.
- No central add tab. Native iOS tabs cannot host a raised action, and a JS tab bar would lose native behaviour. Add lives top right on Closet, on every empty state that needs pieces, and at the end of onboarding. That is the single `addPiecesRoute` entry, reached from five places today and still five tomorrow.
- Tab roots use the native large title in Georgia. Tab switch keeps each tab's stack.

## Shell rules

- Push screens: native back chevron, no label, no text replacement. Only editors that must guard a draft show "Cancel" left (new piece, edit piece, build look, cut-out, Adjust, Your style, change an answer), and they prompt "Discard changes?" through the system dialog. System dialogs are the only non-screen UI left: destructive confirms (remove piece, remove look, remove care label, delete all data, replay onboarding) and discard prompts.
- Primary action: pinned footer button. Disabled with no reason text is not allowed: the button is hidden until it can do something (no "Add 0 ready pieces").
- Errors render next to the control that failed, never at the bottom of a scroll.
- Busy: every committing button shows its own in-button progress; everything else stays enabled unless it would corrupt the write.
- Missing or gone states ("This piece is no longer here", "This look is no longer here", "This photo is no longer waiting") always offer "Go back", which pops. Never `router.replace` into a tab.
- Loading of any list, photo or result uses the silk shimmer, never a bare spinner.
- One term per concept across the app (owned by the UX writer): Add pieces, Confirm (a capture tile that needs answers), Check (the Today card before wearing), Cut-out, Care label, Another (next outfit), Change (one piece), Keep (hold a piece across Another), Start with (build the outfit around a garment type, a piece or a selection: "Start with" chips, "Start with a piece", "Start with these", "Start with this piece", banner "Started with {name}"), Wear this (records a wear on Today), Mark as worn (records a wear from a look), Worn lately (records a wear for selected pieces in Closet), Show on Today (displays a look, records nothing), Save look, Put away (everywhere: piece detail, Closet select, the filter chip; "Archive" is gone), Your style, Adjust, Plan (a date on a look, set on look detail; "Planning {day}" is the Adjust session for a day that is not today).
- Sessions end with their day. An occasion session ("For a party", "Started with {name}", "Style today" from Closet) is for today only, and the first open of a new day lands on the everyday outfit. A planning session is never the active outfit on a new day either; what survives the night is a planned look, or a "Plan for {day}, not saved" card that offers the unsaved plan back.

## Screen tree

Every route, its parent in the navigation stack, and every entry point. "Push" means a root-stack push with a back chevron unless noted.

```
/ (gate, not a route)        Animated splash. Loads closet. Hands off to /onboarding or /(tabs)/today.
/onboarding                  Push, custom bar. Entry: gate on first run; Profile > Replay onboarding; Profile > Reset all data.
/onboarding/colours          Push. Entry: onboarding colours step "Take a selfie"; Profile > Change colours > "Take a selfie".
/(tabs)
  /today                     Tab root.
  /closet                    Tab root.
  /looks                     Tab root.
/profile                     Push. Entry: Today header profile icon.
/profile/style               Push. Entry: Profile > Your style; Today first run "Set your style"; any styling entry (Style today, Start with this piece, Plan with this piece, Open plan) when no everyday style exists. The only home for hijab and coverage. Adjust "Make this my everyday" writes here without opening it.
/profile/answer/[step]       Push. Entry: Profile > Change on an answer row (place, body, taste, colours).
/profile/stylist             Push (dev builds only). Entry: Profile > Stylist > Compare results.
/today/adjust                Push. Entry: Today context row (occasion, style, weather chips); Today problem card actions that need a request change; piece detail "Plan with this piece"; Today "Plan for {day}, not saved" card "Open plan". Holds the Day row (Today, Tomorrow, a date). Closet "Style today" and piece detail "Start with this piece" never open Adjust: they land on Today with the pieces kept.
/today/pieces                Push. Entry: Today "Start with a piece"; Adjust "Start with a piece"; Today problem action "Start with a piece".
/capture                     Push, header right Tips and Select. Entry: Closet header Add; Closet empty state; Today empty closet card; Looks empty state; Start with a piece empty; Build look empty; onboarding done "Add my clothes"; Closet "N preparing" row.
/capture/[id]                Push. Entry: tap a Ready or Confirm tile on /capture; "Next piece" from another confirm; group "Done" when kept pieces need a confirm.
/capture/group/[id]          Push. Entry: group card "Review" on /capture; scan "Done" with pieces.
/capture/scan                Push. Entry: /capture "Scan".
/cutout/[id]                 Push (target=import or piece). Entry: confirm screen photo action; piece detail photo action; edit piece.
/label/[id]                  Push (target=import or piece). Entry: confirm screen Care label row; piece detail Care label row.
/piece/new                   Push. Entry: /capture "Add by hand" link; every Add entry when on-device preparation is unavailable.
/piece/[id]                  Push. Entry: Closet tile; Today check card "Open {name}"; look detail piece row; "Used in" look rows resolve the other way.
/piece/edit/[id]             Push. Entry: piece detail header Edit.
/look/build                  Push. Entry: Looks header New look; Looks empty "Build your first look"; look detail "Change pieces" (with id); Closet select footer "Build a look" (with pieces); piece detail "Use in a look" (with piece).
/look/[id]                   Push. Entry: Looks row (saved or worn); Today "Saved, open" after Save look; piece detail "Used in" row.
```

Inline modes that replaced routes or screen swaps (same screen, same header, no navigation):

| Where | Inline mode | Replaces |
|---|---|---|
| Today | Change strip under the outfit: tap any piece in the flat lay, or "Compare hijabs", opens a strip of alternatives with preview, Keep toggle, "Use this piece" / "Use this hijab" | `/today/replace`, `/today/hijab`, the "In this outfit" list |
| Today | Check card expands to its question chips and "Save answer" / "Use another piece"; tapping its title again collapses it to one line, where it stays until answered or the piece leaves the outfit. No "Not now": a collapsed card is the dismissal | `/today/check` |
| Today | Forecast chip carries the Apple Weather mark whenever a forecast is shown; tapping the mark opens Apple's data sources page in the browser (the attribution WeatherKit requires). The chip itself opens Adjust weather | "Data sources" link under the forecast note |
| Today | "Save look" turns into "Saved, open" in place | `/look/build` from Today |
| Today | "Not for me" opens the reason chips in place (kept) | same as today |
| Today | Occasion banner "For {occasion}, today only" with "Back to everyday"; "Started with {name}, today only" when started from a piece or a selection; "Planning {day}" with "Back to today" when the Day row is not Today. While planning, "Wear this" is hidden and "Save look" is the primary; "Back to today" with a changed, unsaved plan asks "Save this plan?" (Save look / Drop). Every banner is true: the session is gone on the next day | same as today, moved under the context row |
| Today | "Planned for today: {name}" card is the first block on the planned date, above the everyday outfit, with "Show on Today"; "Plan for {day}, not saved" card in From your looks when a dated planning session was left unsaved, with "Open plan" and "Drop" | nothing (planning did not exist) |
| Today | "Start with" chips include Hijab and Knit (sweater or cardigan); "Start with a piece" opens the picker | Choose pieces link only |
| Today | Action row ranked: "Wear this" pinned primary, "Compare hijabs" second; Another, Save look, Not for me and Undo in a quieter row under them | one flat row |
| Today | Context row chips are drawn as controls (chevron), occasion first | plain text row |
| Capture | Every Ready and Confirm tile carries a colour dot and name under the photo; tap the dot and a chip row of the named colours expands under that tile, the choice is confirmed before "Add N pieces" | nothing (colour was read only, never shown) |
| Capture confirm | Colour row directly under the photo: the measured swatch and name, tap opens a chip list of the named colours inline, "Looks right" keeps it. Warmth chips (Light / Medium / Warm) on hijabs and layers | nothing (colour was read only) |
| Capture group | "Keep as a set" toggle shown when two or more rows are kept; kept rows are linked on add. The same screen reviews scanned pieces: every row has a thumbnail | nothing (sets were manual, in Closet select) |
| Capture | Header "Select" (same as Closet) toggles tile selection; footer "Answer for N" opens one confirm screen whose answers apply to all | one confirm per tile |
| Closet | "N added" bar: "Style today" and "Build a look"; "Link as set" only when every added piece came from one photo. The stylist switches to My clothes the first time owned pieces can make a full outfit and the bar says "styling from your clothes now"; before that the bar says what is missing ("Add tops, bottoms and shoes to style from your clothes") and "Style today" is hidden. On the first owned add the bar also offers "Mark what I wear most" | bar without set linking, stylist stayed on the sample closet |
| Closet | "Not worn lately" is a first-row filter chip; "Never worn" and "Put away" under the More chip; search matches colour names | name search, no wear filters |
| Closet | Select footer gains "Worn lately" (records a wear for each selected piece, dated now), "Put away" and "Back in my closet" when put-away tiles are selected | one piece at a time from piece detail |
| Piece detail | Colour fact is a swatch chip; tap opens the same chip list as the capture confirm | colour fact as a word, read only |
| Piece detail | Wear line "Worn 3 times, last 12 Sep" or "Never worn"; "Start with this piece" (today) and "Plan with this piece" (Adjust with the piece kept and the Day row focused) | nothing; "Style this piece" only |
| Look detail | Tap the name to rename in place; "Mark as worn" opens Today / Yesterday chips in place; "Plan" opens Day chips in place (Tomorrow, a date, Clear) and sets the date on this look | rename only through the builder |
| Change strip | "No other hijab works with this outfit" keeps "Show all hijabs" under it; hijab tiles are ordered by tone, warm hijabs first under a cold or snow request; "Not this colour?" under the current or previewed hijab opens the colour chips in the strip and re-ranks it; a tile in a look planned within the next seven days carries "In {day}'s plan" | strip ended at the message |
| Build a look | Occasion chip row above the collage; "Fill the rest" ranks for it and the saved look carries it | looks had no occasion from the builder |
| Colours (selfie) | "Hair covered" toggle on the result drops the Hair point; the season is measured from skin and eyes. It starts on when hijab is Always | three points always |
| Capture | First-run tips are three swipeable cards at the top of the empty Add pieces screen with "Got it"; "Tips" header icon reopens them | tips mode that swapped the whole screen |
| Capture confirm | Care label row (Add / Change) at the end of the form; "Looks right" goes straight to the next piece or back | care label step that swapped the screen |
| Capture group | Draw or adjust box: the photo stays, the row list is replaced by Smaller / Larger / "Use this box" / Cancel; header unchanged, swipe back disabled only while drawing | box mode that swapped the screen and header |
| Closet | Select mode: tiles toggle, pinned footer "Link as set", "Build a look", "Style today"; header left Cancel | select hint and button in the scrolling list header |
| Closet | Pending imports row "3 preparing" with shimmer, tap opens Add pieces | nothing (imports were invisible outside capture) |
| Piece detail | Guessed fact question card (kept), weather and availability chips (kept, no helper captions) | same as today |
| Look detail | Unsaved worn look shows a name field and "Save look" in place | builder opened for worn rows |
| Profile | Language choice saves and the user stays on Profile | remount that dropped the user to Today |

Removed as separate screens, nothing lost:

- `/today/everyday` and `/today/style` merge into `/profile/style` ("Your style"): everyday occasion, style, hijab, coverage and own line, outfit card layout, belt, top length, bottoms, prints, wedding colours, dupatta, region. Save offers "Save and restyle today" and "Save, keep today's outfit" when a Today session exists.
- `/today/stylist-results` moves to `/profile/stylist`. The Rules / Model / Compare choice sits in a "Stylist" section on Profile.
- "For an occasion" merges into Adjust: choosing an occasion other than the everyday one starts an occasion session; the rest of the form is shared.
- "Style from: Sample closet / My clothes" moves from Today into Adjust under "Closet".
- `/onboarding?step=` becomes `/profile/answer/[step]` with its own small header (Cancel, Save) and a discard guard. The hijab step is not offered here: hijab and coverage have one home, "Your style". Onboarding step 1 still asks them and writes to the same place. Hijab has three values in both places, Always / Sometimes / Not needed, and the labels are the same words on step 1 and on Your style. Always writes `always`, Not needed writes `not-needed`, Sometimes writes `null` (the existing value: a hijab is included when one is available, and "Compare hijabs" can swap or drop it). Today shows no caption for Sometimes. "Hair covered" on the selfie result starts on only for Always. Finishing onboarding writes the everyday style (occasion Everyday, style Both, hijab and coverage from step 1), so "Start with the sample closet" lands on an outfit and Your style opens prefilled. The first-run card on Today exists only when onboarding was skipped.
- "Add without photo" is renamed "Add by hand" (it needs a photo). Scan carries the value "Hold pieces up to the camera". Studio is named "Clean background"; the photo chip row is Enhanced, Plain, Original, Clean background, and the cut-out action sits on the photo itself, so four words remain in the row instead of five.

## Former modals

| Route | Decision | Reason |
|---|---|---|
| `/piece/new` | Push | Full form with photo, name, category, attributes. Needs room and a discard guard. Reached inside the capture flow, so it must sit in the same stack, not on top of a sheet. |
| `/look/build` | Push | Live collage plus a strip and a keyboard. The builder is a destination the user walks into from Looks, look detail, Closet select and piece detail. From Today the builder is no longer needed: "Save look" saves inline. |
| `/capture` (Add pieces) | Push | Starts a multi-screen flow (grid, group, confirm, cut-out, label, scan). A sheet hosting five pushes was the main "windows moving around" complaint. Ends by popping to Closet with the new pieces highlighted. |
| `/today/adjust` | Push | Long form (occasion, style, garment, weather, conditions, day, closet, kept pieces). Returning to Today shows the new outfit arriving, which is the generating moment. |
| `/today/everyday` | Push, merged into `/profile/style` | It is a preference, not a daily action. One "Your style" screen ends the four-places problem. Today first run pushes it directly. |
| `/today/pieces` | Push | Picker with live preview; same component as the builder picker. Needs the whole screen. |
| `/today/replace` | Inline (Change strip on Today) | The outfit must stay visible while comparing. A strip under the flat lay keeps the comparison on one screen and removes a near-copy screen. |
| `/today/check` | Inline (check card on Today) | One question with three chips. Expanding the card that raised the question is shorter than a screen. |
| `/today/hijab` | Inline (Change strip on Today, hijab role) | Same mechanism as replace with reasons on each tile; "Compare hijabs" is the prominent entry, tapping the hijab is the second. |
| `/today/style` | Push, merged into `/profile/style` | Settings belong under Profile. Removes the modal on modal with Compare results. |
| `/today/stylist-results` | Push (`/profile/stylist`) | Read-only table. Pushed from the Stylist section on Profile. |

Also fixed while here: `/cutout/[id]` keeps `gestureEnabled: false` only once the mask has been edited; pinch to zoom and two-finger pan stay native gestures on the canvas, one finger always paints, and Reset restores the mask but not the zoom. `/label/[id]` gets the same discard guard as the editors. `MissingPiece` pops instead of `router.replace("/closet")`, so `/piece/[id]`, `/piece/edit/[id]`, `/label/[id]` and `/cutout/[id]` all show their gone line under their own header with "Go back"; with `target=import` the line is "This photo is no longer waiting".

## Flow list

| ID | Flow | Routes | Entry | Exit | Hand-off to next flow |
|---|---|---|---|---|---|
| F01 | Start | gate, `/onboarding`, `/onboarding/colours` | Cold launch | Today (returning), or onboarding done | "Add my clothes" -> F02 with Closet as the screen under it; "Start with the sample closet" -> F06 |
| F02 | Add pieces | `/capture`, `/capture/[id]`, `/capture/group/[id]`, `/piece/new`, `/cutout/[id]?target=import`, `/label/[id]?target=import` | Closet Add, empty states, onboarding | "Add N pieces" pops to Closet when the grid is empty, else the grid stays with "N added" | Closet shows the new pieces with a blush "New" mark and a bar "N added: Style today / Build a look" ("Link as set" when all came from one photo). The stylist switches to My clothes once owned pieces can make a full outfit; until then the bar names what is missing. The first owned add offers "Mark what I wear most" (Select with "Worn lately"). "Style today" starts an occasion session with the new pieces kept (today's everyday outfit comes back with "Back to everyday") -> F07, F10 or F04 |
| F03 | Scan | `/capture/scan`, then `/capture/group/[id]` | Add pieces "Scan" | "Done" -> scanned pieces review (thumbnails, Keep as a set) -> confirms | Same exit as F02 |
| F04 | Closet | `/(tabs)/closet` | Tab, Profile "Never worn" (filter on) | Tile -> F05; Add -> F02; select footer -> F10, F06, Worn lately or Put away | "Style today" switches to Today with the pieces kept (F07 session); "Worn lately" feeds the wear filters, Profile stats and the stylist at once; "Never worn" filter -> tile -> "Start with this piece" is two taps from Profile |
| F05 | Piece | `/piece/[id]`, `/piece/edit/[id]`, `/cutout/[id]?target=piece`, `/label/[id]?target=piece` | Closet tile, Today check card, look detail | Back | "Start with this piece" -> F06 (occasion session, piece kept, banner "Started with {name}"); "Plan with this piece" -> F07 with the piece kept and the Day row; "Use in a look" -> F10; "Used in" rows -> F09; colour chip -> corrected colour feeds F08 reasons |
| F06 | Today | `/(tabs)/today` plus inline modes | Tab, app launch | Stays | "Save look" -> F09 inline ("Saved, open"); "Wear this" -> Looks worn row and Profile stats; context row -> F07; tap a piece -> F08; "Set your style" -> F11; "Planned for today" card -> "Show on Today"; "Plan for {day}, not saved" card -> "Open plan" (F07 session) |
| F07 | Adjust today | `/today/adjust`, `/today/pieces` | Today context row, Start with a piece, problem actions, Closet "Style today", piece detail "Plan with this piece", Today "Open plan" | "Find outfits" / "Start with these" pops to Today | New outfit arrives on Today (generating moment). With a Day other than Today, Today shows the planning banner, "Wear this" is hidden and "Save look" saves the look for that day (F09). The session is not active on the next day |
| F08 | Change a piece | Today Change strip (inline) | Tap a piece in the flat lay, "Compare hijabs" | "Use this piece" / "Use this hijab" / close | Outfit updates in place; "Undo" appears in the action row; "Not this colour?" corrects a hijab colour without leaving Today |
| F09 | Looks | `/(tabs)/looks`, `/look/[id]` | Tab, "Saved, open" from Today, "Used in" from a piece | Row -> look detail; New look -> F10 | "Show on Today" switches to Today showing that look (F06); "Mark as worn" records a wear (Today / Yesterday); "Plan" sets a date on the look in place and it surfaces on Today that morning; "Change pieces" -> F10 |
| F10 | Build a look | `/look/build` | Looks New look, empty state, look detail, Closet select, piece detail | "Save look" pops to the caller | Looks row appears; from look detail the detail updates; builder empty closet -> F02 |
| F11 | Profile and style | `/profile`, `/profile/style`, `/profile/answer/[step]`, `/profile/stylist`, `/onboarding` (replay) | Today header | Back to Today | "Save and restyle today" returns to Today with the new outfit |
| F12 | App-wide checks | every route | n/a | n/a | Empty closet, largest text, bokmål, offline, interrupted moments, Reduce Motion |

Hand-off rules the UX designer must keep:

1. Capture ends in Closet, never in the void. The last screen of F02 and F03 pops the whole capture stack and the Closet tab is on top with the new tiles marked.
2. Closet reaches outfit in one tap from a piece ("Start with this piece") or from a selection ("Style today"). Both land on Today with those pieces kept and the occasion banner showing. Every entry that styles (Style today, Start with this piece, Plan with this piece, Open plan) opens Your style first when no everyday style exists, then lands on Today.
3. Today reaches Looks in one tap ("Save look" inline). Looks reaches Today in one tap ("Show on Today"), and that is the only name for it, on look detail and on the Today cards.
4. Wearing is recorded by "Wear this" on Today (per outfit, so a work outfit and a dinner outfit on the same day are two wears), by "Mark as worn" on a look (Today or Yesterday), or by "Worn lately" on a Closet selection (one wear per piece, dated now). It shows in Looks worn rows, Profile stats, the piece wear line, the Closet wear filters and the stylist's wear boost without any extra step. "Show on Today" never records a wear. "Wear this" is hidden while planning.
5. Every empty state names the next flow and links to it: Today without an everyday style -> Your style; any screen without pieces -> Add pieces; Looks without looks -> Build a look.
6. Planning never touches today's outfit and never stays active overnight. A Day other than Today runs in the occasion session under "Planning {day}"; "Back to today" restores the everyday outfit and asks "Save this plan?" when the plan changed and was not saved; a saved look carries its date and is the first block on Today that morning. On a new day an unsaved dated plan is not the outfit: Today offers it back as "Plan for {day}, not saved" until its day passes.
7. Profile numbers are doors: "Never worn" opens Closet with that filter on.
8. Styling from My clothes starts only when owned pieces can make a full outfit (a main, a bottom where the main needs one, shoes, and a hijab when hijab is Always). Until then the stylist stays on the sample closet and the "N added" bar names what is missing. Today is never a problem card the morning after adding pieces.

## Domain touches

The spec keeps `src/domain`, `src/storage` and `src/state` unchanged in behaviour. The advocate's blocking issues need these small, additive changes. Each is an optional field or a pure function, keeps every existing fixture valid, and gets a unit test first in Phase 3.

| Touch | Where | Why |
|---|---|---|
| `setColour(closet, pieceId, name)`: writes `colors[0]` to the named swatch and `sources.colour = "confirmed"`; re-preparing a photo keeps a confirmed colour. The same correction applies to an import job (`correctImport`) so a capture tile can be fixed before it is added | `src/domain/importing.ts`, `src/domain/facts.ts` | A5-01, B2-01: the colour hijab matching runs on must be visible and fixable on the tile, the confirm, the piece and the Change strip |
| `lastWorn(closet)`: piece id -> last `wore` date from feedback; filters `never-worn` and `not-worn-lately` (30 days) in `ClosetFilter`; search matches the colour name | `src/domain/closetFilters.ts`, `src/domain/scoring/taste.ts` | A4-01, A4-02, A5-02, A9-03 |
| `woreLately(closet, pieceIds, at)`: one `wore` event per piece (`pieceIds: [id]`, the everyday request, no `against`, no `cursor`), so `wearCounts`, `lastWorn`, Profile "Most worn" and `wearBoost` see it and no pair is learned as an outfit | `src/domain/feedback.ts` | B4-01: the app must learn her favourites before the first in-app wear |
| `missingRoles(pieces, request)`: the role checks of `evaluateOutfit` (main, bottom when the main needs one, shoes, hijab when Always) as a pure function over the owned pool. Adding pieces while `styling.wardrobe` is `sample` calls `setWardrobe("owned")` only when it returns empty; otherwise the bar names the missing roles | `src/domain/styling.ts`, `src/domain/importing.ts` | A2-01, B2-02 |
| Group review flag `keepAsSet`; on add, kept members of the group get one `setId` through `linkSet`. The "N added" bar offers "Link as set" only when every added piece shares one capture | `src/domain/importing.ts`, `src/domain/sets.ts` | A2-02, B2-05 |
| `Session.date?: string` and `Look.plannedFor?: string`. `ensureToday` on a new local date always sets `active: "everyday"`: an undated occasion session is dropped, a dated one is kept inactive in `today.occasion` until its date passes, and `resumePlan` makes it active again from the "Open plan" card. `plannedToday(closet, clock)` returns looks for the local date; `setPlannedFor(closet, lookId, date | null)` sets the date from look detail. Unit tests: undated session gone on day two; dated session kept but everyday active; dated session gone once the date has passed | `src/domain/today.ts`, `src/domain/looks.ts` | A7-01, B6-01, B7-01 |
| `woreThis` and a look-based `woreLook(closet, lookId, at)` accept a date for Yesterday; `woreThis` is refused while the active session has a `date` | `src/domain/feedback.ts` | A6-07, A9-01, B7-02 |
| `SelfieReading.hairCovered`: the result drops the hair point and `analyseColours` receives `hair: null` (already supported); it defaults to true when `everyday.hijab` is `always` | `src/domain/colourAnalysis.ts` | A1-01, B1-01 |
| Feedback chips `too-cold` and `hijab-mismatch`; `too-warm` keeps its id, label becomes "Too hot" | `src/domain/feedback.ts` | A6-02 |
| Hijab and layer categories join the warmth traits so Warmth can be set (on the confirm, on "Answer for N" and on piece detail) and the stylist reads it; `EverydayStyle.exposure?` holds "Your day" so the forecast carries it without Adjust, and Adjust overrides it for one request | `src/domain/pieceWeather.ts`, `src/domain/closet.ts` Weather and EverydayStyle | A5-04, A6-05, B2-04, B6-04 |
| Hijab options ordered by hue after the current one; under a cold or snow request warm hijabs come first, then hue. `plannedPieces(closet, clock)` returns piece ids in looks planned within the next seven days for the "In {day}'s plan" mark | `src/domain/wardrobe.ts`, `src/domain/looks.ts` | A8-03, B8-01, B7-04 |
| `finishOnboarding` writes the everyday style (occasion `everyday`, style `both`, hijab and coverage from step 1; Sometimes maps to `null` as `hijabPreference` already does) when none exists | `src/domain/onboarding.ts` | B1-02, B1-03 |
| Builder accepts `occasion` and the saved look carries it (`Look.occasion` already exists) | `src/domain/builder.ts` | B10-01 |

Declined as engine behaviour changes (out of scope in the spec, listed for the owner): a mood lever (A6-01), a "Very cold" weather band (A6-04). Interim for A6-01: a Knit chip in "Start with" (garment type sweater or cardigan, the existing lever), so a soft day is one tap.

## Magic moments

| Moment | Flows | Where it shows | Resolves to |
|---|---|---|---|
| Loading | F01, F04, F06 | Splash scarf A drapes in and hands off; "Measuring your colours" shimmer over the selfie; closet grid tiles shimmer until photos land; forecast chip shimmers until the forecast or the "unavailable" state | Today outfit, selfie result, Closet grid, forecast chip |
| Generating | F02, F05, F06, F07, F10 | Capture tile shimmer while preparing; Studio photo arranges in on the confirm and edit screens; the flat lay re-arranges piece by piece after Another, Adjust, Start with these, Show on Today, Fill the rest | Ready tile, Studio chip selected, new outfit |
| Selecting object in image | F02, F05 | Cut-out editor: outline traces the found piece on hold, mask lifts off the background; capture group "Use this box": the outline traces the piece found inside the drawn box and the box snaps onto it before the row appears (a box with nothing found stays as drawn) | Mask replaced, row added with its thumbnail |
| Found clothes in video | F03 | Each detected piece is outlined live in the camera, then lifts into the tray on capture | Tray thumbnail, scanned pieces review |

Each has a Reduce Motion fallback (fade, hold, fade) and a use case in `use-cases.md` that asserts the in-progress state appears and resolves on the simulator.

Decisions:

- The spec's Generating location "stylist results" is the outfit the stylist returns, which is the flat lay arranging on Today after Another, Adjust, Start with and Show on Today (F06, F07). The Compare results table on `/profile/stylist` (dev builds) is a synchronous read of stored feedback with nothing to wait for, so it gets no generating state; UC-F11-06 asserts it arrives complete with the screen.
- The simulator has no camera, so Found clothes in video runs on a fixture feed: a test-only launch argument (`ALMARI_SCAN_FIXTURE=<name>`) makes the scan screen play a bundled frame sequence through the same detector, hold-still and capture pipeline as the live camera. UC-F03-07 asserts the live outline, the lift into the tray and the review on the simulator; UC-F03-02 keeps the real-phone check. UC-F12-05 and UC-F12-06 use the same feed for their scan steps.
- The live face guide (UC-F01-07) and the VoiceOver walk (UC-F12-07) stay real-phone rows. They are not magic moments; the measuring shimmer they lead to is covered on the simulator through the library path.

## Open questions for owner

1. Profile as a push from Today instead of a fourth tab. Three tabs read cleaner and keep bokmål labels short, but Profile becomes two taps away. Confirm, or keep four tabs.
2. "Save look" from Today saves at once with the suggested name (rename later in the look). The builder no longer opens from Today. Confirm this is the behaviour you want.
3. Stylist engine controls (Rules / Model / Compare and Compare results) read as developer tools. The architect has set them to dev builds only (the advocate agreed, A11-02). Say so if you want them in release.
4. Scan speed readout (fps and parse time) is set to dev builds only for the same reason. Say so if you want it in release.
5. Mood on Today (A6-01). The advocate dresses for work by mood and asked for a mood choice (Calm, Bright, Cosy, Sharp). The stylist has no mood lever, so this is a new feature and an engine change, which the spec rules out. The advocate raised it again in pass 2 as still blocking. The redesign gives her a Knit chip in "Start with" (one tap, maps to the existing garment type lever) and "Start with a piece" for anything else. Approve mood as a Phase 3 lane, or leave it for after the redesign.
6. The Domain touches table above adds optional fields and pure functions to `src/domain`. Confirm this is within "domain unchanged in behaviour", or name the rows to drop. Two rows change what the user sees on a new day (`ensureToday` ends sessions with their day, and My clothes starts only when owned pieces can make an outfit); both fix wrong mornings the advocate hit, and both are covered by unit tests first.
7. Bokmål name for the Looks tab (A12-01, B9-03). "Antrekk" also means today's outfit, and "Lagret" (saved) does not cover worn and planned rows. The UX writer picks a word that covers saved, worn and planned ("Looks" as a loanword or "Samling" are the candidates) unless you prefer another.

## Owner decisions (2026-10-03)

These answer the open questions above and override any earlier text in this file.

1. Three tabs: Today, Closet, Looks. Profile is pushed from the Today header.
2. "Save look" on Today saves at once with the suggested name. Rename happens inside the look.
3. Developer tools stay in release builds: the stylist engine switch (Rules, Model, Compare and Compare results) and the scan speed readout. Place them out of the main path (Profile, under an Advanced group, and a small scan readout), but do not gate them on dev builds.
4. Mood on Today is out of scope. It becomes its own feature after the redesign. Keep the Knit chip interim.
5. All rows in Domain touches are approved, each with a unit test first.
6. The UX writer picks the bokmål name for the Looks tab.
