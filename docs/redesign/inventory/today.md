# Inventory: Today and stylist

Area: Today tab (`app/(tabs)/today`), every `app/today/*` route, `src/ui/OutfitView.tsx`, `src/ui/OutfitCollage.tsx`, `src/features/today/*` (`useToday.ts`, `ForecastNote.tsx`, `SavedLooks.tsx`), stylist engine screens. Read from code on 2026-10-03.

Data model shorthand used below:

- `styling.everyday` = everyday style preset (occasion, style, hijab, coverage, sample flag, version).
- `styling.today` = `TodayState` (localDate, timeZone, `everyday` session, optional `occasion` session, `active`).
- Session = `{ revision, request, cursor, pieceIds, previousPieceIds, engine }`. Request = `{ occasion, style, garmentType, weather, keptIds, excludedIds, wardrobe, hijab, coverage }`.
- `feedback[]` = events (`wore`, `saved`, `swap`, chip kinds) that feed `styling.taste`.
- `styling.profile` = StyleProfile (coverageLevel, belt, top length, bottoms, prints, weddings, dupatta, region).
- `styling.layout` (minimal | reasons | full), `styling.engine` (rules | model | compare), `styling.wardrobe` (sample | owned), `styling.place`, `styling.forecast`, `looks[]`, `pieces[]`.
- All writes go through `useCloset().update(transform)` (SQLite `closet.v3`). Outfit generation is synchronous (`resultFor` in `useMemo`, `src/features/today/useToday.ts:28-39`). The only network call is the forecast (`ClosetVision.forecast`, `useToday.ts:92`).

## Routes

| Path | Title (EN / NB key) | How reached | Presentation |
|---|---|---|---|
| `/(tabs)/today` (`app/(tabs)/today/index.tsx`) | "Today" (`nav.today`), iOS large title, Georgia | App launch redirect when onboarded (`app/index.tsx:7`); end of onboarding (`app/onboarding/index.tsx:154`); tab bar (iOS `NativeTabs` icon `sparkles`, `src/navigation/Tabs.native.tsx:11-16`; web/Android `Tabs` icon Feather `sun`, `src/navigation/Tabs.tsx:21-29`); "Style this piece" on piece detail (`app/piece/[id].tsx:99-104`, `router.navigate("/today")`) | Tab root, own Stack with `largeTitleOptions` (`app/(tabs)/today/_layout.tsx:7-8`) |
| `/today/adjust` | "Adjust today" (`title.adjustToday`); overridden to "For an occasion" (`today.forOccasion`) when `target=occasion` or an occasion is active (`app/today/adjust.tsx:230-235`) | Today "Adjust" chip (`index.tsx:294-298`); Today "For an occasion" button with `params.target=occasion` (`index.tsx:515-527`) | Root-stack modal (`app/_layout.tsx:64-67`) |
| `/today/everyday` | "Everyday style" (`title.everyday`) | Today header right text action "Everyday style" (`index.tsx:91-100`); first-run "Set my everyday style" button (`index.tsx:133-136`) | Modal (`_layout.tsx:68-71`) |
| `/today/pieces` | "Choose pieces" (`title.choosePieces`) | Today "Choose pieces" / "Choose pieces (n)" chip in "Want to start with something?" (`index.tsx:605-613`); problem action `choose-pieces` (`index.tsx:192-193`) | Modal (`_layout.tsx:72-75`) |
| `/today/replace?id=` | "Change the {name}" (`replace.title`, `replace.tsx:87`); registered as "Change a piece" (`title.changePiece`) | Piece row thumbnail or "Change" chip under "In this outfit" for non-hijab pieces (`index.tsx:629-635`) | Modal (`_layout.tsx:76-79`) |
| `/today/check?id=&ask=` | "One question" (`check.title`) | "Answer one question" button inside "Check before wearing" card (`index.tsx:470-499`), or in a problem card (`index.tsx:200-204`) | Modal (`_layout.tsx:80-83`) |
| `/today/hijab` | "Compare hijabs" (`hijabs.title`) | "Compare hijabs" compact button under the outfit when the outfit has a hijab (`index.tsx:441-449`); "Change" on the hijab row in "In this outfit" (`index.tsx:630-631`) | Modal (`_layout.tsx:84-87`) |
| `/today/style` | "Style settings" (`style.title`) | "Style settings" compact button at the bottom of Today (`index.tsx:642-648`); Profile "Open style settings" (`app/(tabs)/profile/index.tsx:146-150`) | Modal (`_layout.tsx:88-91`) |
| `/today/stylist-results` | "Compare results" (`stylist.results`) | "Compare results" button inside Style settings (`app/today/style.tsx:233-239`) | Modal on top of the Style settings modal (`_layout.tsx:92-95`) |

Routes reached from Today that belong to other areas (hand-offs):

| Path | From Today | Presentation |
|---|---|---|
| `/look/build?pieces=&name=&occasion=` | "Save look" (`index.tsx:500-514`) | Modal (`_layout.tsx:38-41`); on save `router.back()` to Today (`app/look/build.tsx:163`) |
| `/piece/[id]` | Problem action `edit-piece` "Open {name}" (`index.tsx:205-209`) | Push on root stack |
| `/capture` or `/piece/new` (`addPiecesRoute`, `src/state/imports.ts:26`) | Problem action `add-pieces` "Add a piece" (`index.tsx:194-195`) | Both modals (`_layout.tsx:29-32`, `43-46`) |

Today screen, top to bottom (when an outfit shows), `app/(tabs)/today/index.tsx`:

1. Header right: "Everyday style" text action (91-100).
2. Heading: "Styled for {occasion}." or "A little inspiration for today." (281-287).
3. Context line `today-context`: "{Occasion} · {Style} · {Weather}" + " (entered by you)" / " (forecast)" (288-293), with "Adjust" chip (294-298).
4. Forecast note `forecast-note` (300, `ForecastNote.tsx`).
5. Occasion banner "Just for now. Your everyday style is unchanged." + "Back to today's look" (301-314).
6. "Style from" segmented choice Sample closet / My clothes, or caption "Styled from the sample closet..." (315-332).
7. Outfit card `today-outfit` (`OutfitView`): flat lay, name, reasons, coverage checks, tip (336-345).
8. Action row: "Change", "Not for me", "Wear this" (346-387); worn row "Marked as worn today." + "Undo" (388-403); feedback chips "What is not right?" (404-434); thanks caption (435-439).
9. "Compare hijabs" (441-449).
10. Caption "{n} pieces from {source}, {k} kept" (450-453).
11. Problem card "This outfit no longer fits your choices..." + "Find a new outfit" (454-469).
12. "Check before wearing" card with per-problem "Answer one question" / "Open {name}" (470-499).
13. "Save look" (500-514).
14. "For an occasion" (515-527).
15. Caption "This is the only combination..." / "That was the last new combination..." (528-536).
16. "Undo last change" (537-547).
17. "From your looks" saved looks and variants (`SavedLooks`, 585).
18. "Want to start with something?" chips Blazer, Dress, Kurta, Trousers, "Choose pieces" (586-615).
19. "In this outfit" piece rows with thumbnail, name, "Kept in every option", "Keep"/"Kept" chip, "Change" chip (617-640).
20. "Style settings" (642-648).
21. Notes: hijab unset caption, `coverage-note` (649-660).
22. Error message (661).

## User actions

| Route | Action | Result | Data read / written |
|---|---|---|---|
| Today (first run) | Tap "Set my everyday style" (`index.tsx:133-136`) | Opens `/today/everyday` modal | none |
| Today (first run) | Tap "Try a sample style" (`index.tsx:137-156`) | Sets wardrobe to sample, saves preset Work + Western + hijab always (sample flag), restyles today; button shows spinner | W: `styling.wardrobe`, `styling.everyday`, `styling.today` |
| Today | Open app / foreground app (`useToday.ts:67-80`) | `ensureToday` builds a new everyday session when the local date changes; keeps an active occasion session across days | R: `styling.everyday`, `pieces`, `forecast`. W: `styling.today` |
| Today | Automatic forecast fetch when a place is set and no fresh forecast (`useToday.ts:87-112`) | Fetches WeatherKit forecast, stores it, request weather becomes forecast | R: `styling.place`, `styling.forecast`. W: `styling.forecast` |
| Today | Tap header "Everyday style" (`index.tsx:94-97`) | Opens `/today/everyday` | none |
| Today | Tap "Adjust" chip (a11y "Adjust occasion, style, and weather") (`index.tsx:294-298`) | Opens `/today/adjust` | none |
| Today | Tap "Data sources" link in forecast note (`ForecastNote.tsx:44-54`) | Opens Apple Weather attribution URL in browser | R: `forecast.attribution` |
| Today | Tap "Back to today's look" in occasion banner (`index.tsx:304-312`) | Leaves occasion session, everyday session becomes active | W: `styling.today.active`, `occasion` |
| Today | Choose "Sample closet" / "My clothes" in "Style from" (`index.tsx:316-327`) | Switches wardrobe, clears today and restyles from scratch | W: `styling.wardrobe`, `styling.today` |
| Today | Tap "Change" (outfit) (`index.tsx:348-359`) | Next ranked outfit (`tryAnother`); at the last one, starts over at the first (`startOver`). Disabled with fewer than 2 outfits | W: session `cursor`, `pieceIds`, `previousPieceIds`, `revision` |
| Today | Tap "Not for me" (`index.tsx:362-367`) | Toggles inline chip row "What is not right?" | local state only |
| Today | Tap feedback chip "Too formal" / "Too plain" / "Too warm" / "Not my style" (`index.tsx:408-431`) | Records feedback, picks an alternative outfit, shows "Thanks. This outfit takes that into account, and later ones will too." | W: `feedback[]`, `styling.taste`, session |
| Today | Tap "Wear this" (`index.tsx:369-386`) | Records `wore` event for today; button replaced with "Marked as worn today." + "Undo". Shows in Looks tab as worn and Profile stats | W: `feedback[]`, taste |
| Today | Tap "Undo" after wearing (`index.tsx:393-401`) | Marks the worn event undone, rebuilds taste | W: `feedback[].undone`, `styling.taste` |
| Today | Tap "Compare hijabs" (`index.tsx:441-449`) | Opens `/today/hijab` | none |
| Today | Tap "Find a new outfit" in "no longer fits" card (`index.tsx:454-468`) | `startOver` for the current request | W: session |
| Today | Tap "Answer one question" in "Check before wearing" (`index.tsx:484-495`) | Opens `/today/check?id&ask` | none |
| Today | Tap "Open {name}" in "Check before wearing" (`index.tsx:484-495`) | Pushes `/piece/[id]` | none |
| Today | Tap "Save look" (`index.tsx:500-514`) | Opens `/look/build` prefilled with outfit pieces, suggested name and occasion. Save returns to Today, records `saved` feedback, look then appears in "From your looks" as "Showing now" | W (in build): `looks[]`, `feedback[]` |
| Today | Tap "For an occasion" (`index.tsx:515-527`, everyday only) | Opens `/today/adjust?target=occasion` | none |
| Today | Tap "Undo last change" (`index.tsx:537-547`) | Restores previous piece set (one level only), drops keeps not in it | W: session `pieceIds`, `previousPieceIds=null`, `keptIds` |
| Today (problem state) | Problem actions (`index.tsx:178-236`, `568-580`): "Stop keeping {name}", "Any type of garment", "Switch to {style}", "Clear the weather", "Include set-aside pieces", "Choose pieces", "Add a piece", "Use the sample closet", "Answer one question", "Open {name}" | Each changes the request and restyles, or navigates (`/today/pieces`, add pieces route, `/today/check`, `/piece/[id]`) | W: session request (`keptIds`, `garmentType`, `style`, `weather`, `excludedIds`), `styling.wardrobe` |
| Today (piece gone) | "Find a new outfit" when a piece in the outfit became unavailable (`index.tsx:552-566`) | `startOver` | W: session |
| Today | "Use this look" on a saved look (`SavedLooks.tsx:47-57`) | Applies the look's pieces to the session; button turns to "Showing now" (disabled) | R: `looks[]`. W: session `pieceIds`, `previousPieceIds` |
| Today | "Fill the gap" on a look variant (`SavedLooks.tsx:81-91`) | Applies the repair request (keeps available pieces, restyles the rest) | W: session request |
| Today | "See all ({count})" in From your looks (`SavedLooks.tsx:94-101`) | Expands from 2 exact + 2 variants to all | local state |
| Today | Tap Blazer / Dress / Kurta / Trousers chip (`index.tsx:589-604`) | Toggles `garmentType` and restyles | W: session request |
| Today | Tap "Choose pieces" chip (`index.tsx:605-613`) | Opens `/today/pieces` | none |
| Today | Tap piece thumbnail or "Change" chip in "In this outfit" (`index.tsx:629-636`, `707-741`) | Hijab -> `/today/hijab`; other -> `/today/replace?id` | none |
| Today | Tap "Keep" / "Kept" chip on a piece row (`index.tsx:626-628`, `725-735`) | Toggles keep, piece stays in every option; no restyle | W: session `keptIds` |
| Today | Tap "Style settings" (`index.tsx:642-648`) | Opens `/today/style` | none |
| Adjust | Header "Cancel" (`adjust.tsx:236-241`) | Back; discard confirm if dirty (always dirty in new occasion mode) | none |
| Adjust | Choose Occasion (`adjust.tsx:249-255`) | Local draft | none |
| Adjust | Choose Style Western / Desi (`adjust.tsx:256-262`) | Local draft | none |
| Adjust | Choose "Something you want to wear": No preference / Blazer / Dress / Kurta / Trousers (`adjust.tsx:263-271`) | Local draft `garmentType` | none |
| Adjust | Choose Weather: Forecast (only when a fresh forecast exists) / Not set / Warm / Mild / Cold (`adjust.tsx:273-291`) | Local draft; manual choice reveals Conditions and Your day | R: `styling.forecast` |
| Adjust | Choose Conditions Dry / Rain / Snow; Your day Mostly indoors / Time outside (`adjust.tsx:292-309`) | Local draft manual weather | none |
| Adjust | "Stop keeping them" (`adjust.tsx:314-329`) | Clears keeps in draft | none |
| Adjust | "Include set-aside pieces again" (`adjust.tsx:330-338`) | Clears exclusions in draft | none |
| Adjust | "Find outfits" (`adjust.tsx:340-346`) | Applies request to active session, or starts an occasion session when `target=occasion`; closes | W: `styling.today` |
| Adjust | "Also make this occasion and style my everyday" (`adjust.tsx:347-356`, everyday mode only) | Saves occasion and style into the preset, then applies request; closes | W: `styling.everyday`, `styling.today` |
| Everyday | Header "Cancel" (`everyday.tsx:100-105`) | Back with discard confirm if dirty | none |
| Everyday | Choose Usual occasion, Usual style, Hijab in outfits (Always include a hijab / Not needed), Coverage (Full / Moderate / My own line) (`everyday.tsx:114-141`) | Local draft | R: `styling.everyday`, `styling.profile.coverageLevel` |
| Everyday | With "My own line": choose Sleeves and Hem (`everyday.tsx:142-159`) | Local draft | none |
| Everyday | "Save everyday style" (first time) / "Save and restyle today" (`everyday.tsx:164-171`) | Saves preset and coverage level, restyles today; closes | W: `styling.everyday`, `styling.profile`, `styling.today` |
| Everyday | "Save, keep today's outfit" (`everyday.tsx:172-181`) | Saves preset, today unchanged; closes | W: `styling.everyday`, `styling.profile` |
| Choose pieces | Header "Cancel" / "Clear" (`pieces.tsx:92-107`) | Back with discard confirm / clears selection | none |
| Choose pieces | Category filter (`pieces.tsx:133-135`) | Filters strip | none |
| Choose pieces | Tap piece tile (`pieces.tsx:163-180`) | Toggles selection, live collage preview `kept-preview` | R: `pieces[]` (current wardrobe, available) |
| Choose pieces | "Show all pieces" in empty category (`pieces.tsx:154-160`) | Resets filter | none |
| Choose pieces | Footer "Style around these" / "Stop keeping pieces" / "Done" (`pieces.tsx:187-200`) | Sets `keptIds`, removes them from exclusions, restyles; closes | W: session request |
| Replace | Header "Cancel" (`replace.tsx:88-93`) | Back, no discard confirm | none |
| Replace | Tap alternative tile (`replace.tsx:134-146`) | Preview in `replace-preview` collage; "Trying {name}. Everything else stays the same." plus problem messages | R: `replacementsFor` ranked options |
| Replace | "Use this piece" (`replace.tsx:183-202`) | Swaps piece (`swapPiece`), records `swap` feedback; closes | W: session, `feedback[]`, taste |
| Replace | "Restyle without this piece" when no alternatives (`replace.tsx:149-176`) | Unkeeps and excludes the piece, restyles; closes | W: session request |
| Check | Header "Not now" (`check.tsx:104-111`) | Back | none |
| Check | Choose answer (sleeve / length / see-through choices) (`check.tsx:126-132`) | Draft; sleeve and length preselect the photo suggestion | R: piece attributes |
| Check | "Save answer" (`check.tsx:134-145`) | Confirms the attribute on the piece; closes | W: `pieces[].attributes` (confirmed) |
| Check | "Use another piece" (`check.tsx:146-169`) | Unkeeps and excludes the piece, restyles; closes | W: session request |
| Hijab | Header "Cancel" (`hijab.tsx:89-96`) | Back, no discard confirm | none |
| Hijab | Tap option tile (`hijab.tsx:141-183`); index 0 is current, labelled "Current" + "In the outfit now"; others show a reason | Preview in `hijab-preview` collage, "Trying {name}..." | R: `hijabAlternatives` scored with session engine |
| Hijab | "Use this hijab" (`hijab.tsx:196-203`) | `replacePiece`, no feedback event; closes. Undo via Today "Undo last change" | W: session |
| Style settings | Header "Cancel" (`style.tsx:205-213`, key `style.cancel`) | Back with discard confirm if dirty | none |
| Style settings | Outfit card: Outfit only / With reasons / With reasons and coverage checks (`style.tsx:216-222`) | Draft | R/W: `styling.layout` |
| Style settings | Stylist: Rules / Model / Compare (`style.tsx:223-229`) | Draft | R/W: `styling.engine` |
| Style settings | "Compare results" (`style.tsx:233-239`) | Opens `/today/stylist-results` modal over this modal | none |
| Style settings | Belt, Shortest top with trousers, Trousers or skirts, Print on print, Colours to avoid at weddings (White, Black chips), Dupatta at family events, Regional leaning (`style.tsx:240-309`) | Draft | R/W: `styling.profile` |
| Style settings | "Save style settings" (`style.tsx:311-318`) | Saves profile, layout, engine; closes. Today re-renders card layout and ranking | W: `styling.profile`, `styling.taste` (via `saveProfile`), `styling.layout`, `styling.engine` |
| Stylist results | Read only (`stylist-results.tsx:14-61`) | Per style (Western, Desi) and engine: "Would wear, first three", "Not my style", "Wore this"; unread photo count | R: `feedback[]`, `pieces[]` embeddings |
| Piece detail (other area) | "Style this piece" (`app/piece/[id].tsx:136-142`) | Starts an occasion session keeping that piece, switches to Today tab | W: `styling.today` |

## States

| Route | State | What the UI shows today |
|---|---|---|
| App start | Closet loading / failed (`src/state/closet.tsx:43-66`) | Centered Message "Opening your closet" + body; on error "Your closet could not open" + "Try again" button. No visual motion |
| Today | First run (no everyday preset) (`index.tsx:125-165`) | Message "Start with your everyday style." + long body, "Set my everyday style" (primary), "Try a sample style" (secondary), caption "The sample style is Work, Western, with a hijab...". Header "Everyday style" also shown. Onboarding sets a preset, so skipping onboarding lands here (`.maestro/onboarding/skip.yaml`) |
| Today | Loading / generating (preset exists, `today` not built yet) (`index.tsx:167-168`) | Plain muted text "Styling your day..." in the scroll view. No spinner, no motion |
| Today | `ensureToday` fails (`useToday.ts:69-71`) | Error swallowed; stays on "Styling your day..." forever, no retry |
| Today | Busy (any write in flight) | Most buttons and chips only become disabled (opacity); spinner only on "Try a sample style" (`index.tsx:146`). No outfit transition |
| Today | Save error (`useToday.ts:55-57`) | Red alert text at the very bottom of the page "This change could not be saved. Please try again." (`index.tsx:661`), often off screen |
| Today | Ready, everyday | Heading "A little inspiration for today.", full stack listed above |
| Today | Ready, occasion active | Heading "Styled for {occasion}.", plum-soft banner "Just for now..." + "Back to today's look"; "For an occasion" button hidden |
| Today | Sample-only closet (no owned pieces) | Caption "Styled from the sample closet. Add your own pieces to style from your clothes." instead of Style from choice (`index.tsx:328-331`). No add button |
| Today | Only one combination | "Change" and "Not for me" disabled; caption "This is the only combination I can make with these choices." (`index.tsx:528-531`) |
| Today | Last combination reached | Caption "That was the last new combination for this request."; next "Change" silently starts over (`index.tsx:353-357`, `532-535`) |
| Today | Worn today | "Wear this" removed; "Marked as worn today." + "Undo" |
| Today | Feedback chips open | Inline chip list; after tap, thanks caption tied to the new revision |
| Today | Review problems (coverage unknown, see-through) | Bordered card "Check before wearing" with problem sentences and "Answer one question" / "Open {name}" |
| Today | Broken (outfit no longer fits after a change) | Surface card "This outfit no longer fits your choices. {problems}" + "Find a new outfit" |
| Today | Conflict or missing (no outfit possible) (`index.tsx:549-583`) | Kept pieces collage (if any) + one ProblemCard per problem with stacked compact buttons. Examples: "No combination in this closet meets your sleeve and hem choices.", "Add shoes to complete an outfit.", empty closet |
| Today | Piece in outfit became unavailable (`index.tsx:552-566`) | Card "A piece in this outfit is no longer available." + "Find a new outfit" |
| Today | Forecast: no place | No forecast note |
| Today | Forecast: fresh | Caption "Forecast for {city}: {low} to {high}" + Apple Weather mark + "Data sources" link; context suffix " (forecast)" |
| Today | Forecast: manual weather | Caption "You chose today's weather yourself. It replaces the forecast for today."; context suffix " (entered by you)" |
| Today | Offline / forecast failed (`ForecastNote.tsx:58-62`) | Caption "The forecast is not available right now. You can set the weather yourself." No retry; refetch only on next foreground |
| Today | Hijab preference unset | Caption "Your hijab preference is not set, so a hijab is included when one is available." (`index.tsx:650-654`) |
| Today | Layout not "full" | Caption `coverage-note`: coverage sentences + "The layout shows how pieces go together, not how they fit." (`index.tsx:655-659`) |
| Today | Saved looks match | "From your looks" cards: thumbs, name, "Fits this request as saved." or "Check before wearing. {message}", "Use this look" / "Showing now"; variants "Variant of {name}" with gap text and "Fill the gap"; "See all ({count})" |
| Today | Permission denied | Not applicable. Forecast uses the city chosen in onboarding, no location permission |
| Adjust | No today session (`adjust.tsx:147-158`) | Centered "Set your everyday style first" + "Today's outfit starts from your everyday style." + "Go back" only |
| Adjust | Everyday vs occasion mode | Title and intro switch ("These changes are for today only..." vs "These choices are just for now..."); "Also make this ... my everyday" only in everyday mode |
| Adjust | Fresh forecast missing | "Forecast" option absent from Weather |
| Adjust | Saving / error | Spinner on "Find outfits"; "These choices could not be saved. Please try again." above button |
| Adjust | Dirty + dismiss | Native alert "Discard your changes?" / "These changes have not been saved." / "Discard" |
| Everyday | First time vs editing | Primary "Save everyday style" vs "Save and restyle today" + secondary "Save, keep today's outfit"; both disabled until dirty when editing |
| Everyday | Sample preset | Caption "You are using the sample style. Choose what fits you." |
| Everyday | Coverage help | One of four long captions under coverage choice (`everyday.tsx:160-162`) |
| Everyday | Error | "Your everyday style could not be saved. Please try again." |
| Choose pieces | No session | Same "Set your everyday style first" dead end (`pieces.tsx:37-48`) |
| Choose pieces | Nothing selected | Collage empty state "Start with a piece you love." / "Choose below and watch your outfit come together here." + caption "Choose any pieces you want to wear. The rest is styled around them." |
| Choose pieces | Selection | Collage preview + "Keeping 1 piece..." / "Keeping {count} pieces..." |
| Choose pieces | Empty category / empty closet | "No pieces in this category" + "Show all pieces", or "There are no pieces in this closet yet." with no action |
| Choose pieces | Error | "These pieces could not be saved. Please try again." |
| Replace | Piece no longer in outfit | Centered "This piece is no longer in the outfit" + "Go back to see today's outfit." + "Go back" |
| Replace | No alternatives | "No other piece works here without changing more of the outfit." + "Restyle without this piece"; "Use this piece" stays disabled in footer |
| Replace | Trying | Collage swaps, "Trying {name}. Everything else stays the same." + any problem messages |
| Check | Nothing to ask | Centered "Nothing to check" / "This piece is already confirmed for this outfit." + "Go back" |
| Check | See-through vs sleeve/length | Body "Your answer decides whether..." vs "Suggested from the photo. Your answer is kept and never replaced." vs "Your answer is kept and never replaced." |
| Check | Error | "Your answer could not be saved. Please try again." or "The outfit could not be restyled..." |
| Hijab | No hijab / no session | Centered "There is no hijab in this outfit" + "Go back" |
| Hijab | No other hijab works | "No other hijab works with this outfit right now." in place of the strip |
| Hijab | Trying | "Trying {name}. Everything else stays the same." + problems; footer caption "You can undo this on Today." always visible |
| Style settings | Nothing set | Every setting "No preference"; intro "People and families see these differently..." |
| Style settings | Compare chosen | Caption "Compare takes turns between Rules and Model..." always visible (not only when chosen) |
| Style settings | Error | "Your style settings could not be saved. Please try again." |
| Stylist results | No feedback | Each rate shows "No feedback yet"; "Wore this: 0" |
| Stylist results | Unread pieces | Caption "Model needs a photo reading of every piece..." |
| All Today modals | Large text | Picker strip heights grow by formula (`pieces.tsx:130`, `replace.tsx:120`, `hijab.tsx:123-126`) |
| All Today modals | Wide (>= 900 pt) | Side-by-side preview and 2-column grid (`pieces.tsx:109,137-146`, same in replace and hijab) |

## Magic moments

| Moment | Where | How it looks now |
|---|---|---|
| Loading (closet open) | `src/state/closet.tsx:43-66` | Static centered Message "Opening your closet". No shimmer |
| Loading (forecast) | `useToday.ts:87-112`, `ForecastNote.tsx` | Nothing shown while fetching; the note appears or the failure caption appears later. Context line changes from weather to "(forecast)" without transition |
| Generating (today's outfit) | `index.tsx:167-168`; generation itself is synchronous in `useToday.ts:28-39` | "Styling your day..." plain text for the frame before `ensureToday` writes. Then the full outfit pops in |
| Generating (new outfit after Change, feedback chip, keep, garment chip, Adjust, Choose pieces) | `index.tsx` actions via `run` | Instant swap of the `OutfitView` flat lay, no animation, buttons only dim while busy. Feedback chip result has a polite live region caption |
| Generating (trying a piece / hijab / kept pieces) | `OutfitCollage` in `replace.tsx:98`, `hijab.tsx:100`, `pieces.tsx:111` | Layered collage re-lays out instantly on each tap. No motion between states |
| Stylist results | `stylist-results.tsx` | Static numbers, computed synchronously |
| Segmentation / cutout | Not in this area | Today only shows the already cut-out photos through `PiecePhoto`, `OutfitView` tiles and `OutfitCollage` frames (`OutfitCollage.tsx:126-135` uses `piece.frame` or `sample-frames.json` to crop) |
| Live scan detection | Not in this area | n/a |

## Pain points

Navigation and modals

1. Eight Today sub-screens are root-stack modals (`app/_layout.tsx:64-95`), plus `look/build` (`_layout.tsx:38-41`) and add pieces (`_layout.tsx:29-32`, `43-46`) reached from Today. All are iOS page sheets that scale the Today tab behind them.
2. Modal on modal: Style settings (modal) opens Compare results (another modal) (`app/today/style.tsx:233-239`, `_layout.tsx:92-95`).
3. Same destination, different doors: Adjust is reached by the "Adjust" chip and the "For an occasion" button with a param, and changes its own title and intro (`index.tsx:294-298`, `515-527`; `adjust.tsx:230-248`). Compare hijabs is reached by a button and by the hijab row's "Change" (`index.tsx:441-449`, `630-631`).
4. Styling settings live in four places: Everyday style (header text action, `index.tsx:91-100`), Adjust (chip), Style settings (bottom button, `index.tsx:642-648`, and Profile `app/(tabs)/profile/index.tsx:146-150`), plus coverage level inside Everyday (`everyday.tsx:135-159`) that onboarding also sets.
5. Dead-end fallbacks: Adjust and Choose pieces without a session show "Set your everyday style first" with only "Go back", no link to Everyday (`adjust.tsx:147-158`, `pieces.tsx:37-48`). Choose pieces with an empty closet says "There are no pieces in this closet yet." with no add action (`pieces.tsx:149-160`). Sample-only caption on Today has no add action (`index.tsx:328-331`).
6. Stuck loading: `ensureToday` errors are swallowed (`useToday.ts:69-71`), Today then shows "Styling your day..." forever with no retry (`index.tsx:167-168`).

Disconnected hand-offs

7. "Save look" opens the builder modal; on save it silently returns to Today with no confirmation (`index.tsx:500-514`, `app/look/build.tsx:163`). The only sign is the look appearing far down in "From your looks".
8. Looks to Today: a saved look's detail has no "wear today" action (`app/look/[id].tsx`); the only path is "Use this look" inside Today's From your looks (`SavedLooks.tsx:47-57`).
9. "Style this piece" on piece detail jumps tabs with `router.navigate("/today")` and starts an occasion session (`app/piece/[id].tsx:99-104`), leaving the Closet stack behind.
10. "Open {name}" from a Today check card pushes piece detail on the root stack (`index.tsx:205-209`), outside the Today flow; returning relies on back.
11. Forecast failure gives no retry or link to Adjust (`ForecastNote.tsx:58-62`); refetch only happens on app foreground (`useToday.ts:74-78`).
12. Replacing a piece records swap feedback (`replace.tsx:191`, `swapPiece`) but changing a hijab does not (`hijab.tsx:71`, `replacePiece`), so the stylist learns from one and not the other.
13. Feedback chip with no alternative records feedback but the outfit stays and the thanks caption never appears, because the revision does not change (`index.tsx:425-427`, `src/domain/feedback.ts` `giveFeedback` returns `recorded`).
14. Undo is single level and only for piece changes (`src/domain/today.ts:287-302`); request changes (garment chip, Adjust, Choose pieces) cannot be undone from Today.

Clutter and text

15. Today is one long scroll of about 22 blocks (`index.tsx:279-662`), with five stacked secondary buttons outside the card ("Compare hijabs" 442, "Save look" 501, "For an occasion" 517, "Undo last change" 539, "Style settings" 643) and the per-piece list duplicating the card.
16. Helper captions everywhere: `today.sampleNote` (157), `today.sampleOnly` (329), `today.hijabUnset` (650), coverage note + `today.layoutNote` (655-658), `adjust.todayNote` / `occasionNote` (`adjust.tsx:244-248`), `adjust.notForecast` (`adjust.tsx:310-312`), `everyday.intro` (`everyday.tsx:108`), four coverage help texts (`everyday.tsx:160-162`), `style.intro` (`style.tsx:215`), `stylist.help` always visible (`style.tsx:230-232`), `hijabs.undoHint` (`hijab.tsx:204-206`), `pieces.intro`, `replace.choose`, `check.whySeeThrough` / `check.suggested`, `looks.needChange`, `stylist.intro`.
17. Context line packs occasion, style, weather and source into one muted string with " · " separators (`useToday.ts:152-156`, `index.tsx:289-293`).

Inconsistency

18. "Change" means two things on the same screen: next outfit (`index.tsx:349`) and replace one piece (`index.tsx:737`). Maestro needs `index: 0` to tell them apart (`.maestro/stylist/feedback.yaml`, `.maestro/07-model/today-unlabelled.yaml`).
19. Dismiss labels differ: `common.cancel` (adjust, everyday, pieces, replace, hijab), separate `style.cancel` (`style.tsx:209`), "Not now" (`check.tsx:107`), none on stylist results.
20. Discard protection only on adjust, everyday, pieces, style (`useDiscardChanges` at `adjust.tsx:145`, `everyday.tsx:67`, `pieces.tsx:35`, `style.tsx:169`); replace, hijab and check drop a pending choice silently.
21. Two outfit renderers: Today uses `OutfitView` flat-lay grid (`src/ui/OutfitView.tsx:72-110`), while the change screens use the layered `OutfitCollage` (`src/ui/OutfitCollage.tsx:95-196`). The same outfit looks different on Today and in the modal that edits it.
22. `OutfitCollage` hard-codes the English "Kept" badge (`src/ui/OutfitCollage.tsx:184`); `OutfitView` uses `t("outfit.kept")` (`OutfitView.tsx:44`). Bokmål users see English in collages.
23. Three near-copy screens (pieces, replace, hijab) with duplicated styles, footers and wide/strip branches, and magic-number strip heights tied to font scale (`pieces.tsx:130`, `replace.tsx:120`, `hijab.tsx:123-126`). Hijab tiles show reasons, replace tiles do not.
24. Hard-coded spacing (24, 20, 12, 8) in Today and modals (`index.tsx:747-815`) while `stylist-results.tsx:63-73` uses `theme.space`. Card styles differ: problem card surface fill (`index.tsx:787-793`), review card border (`774-781`), saved look card surface (`SavedLooks.tsx:145-154`), stylist card hairline border + surface (`stylist-results.tsx:65-72`), occasion banner accent-soft (`index.tsx:765-771`).
25. Error text renders at the bottom of long scrolls (`index.tsx:661`), far from the action that failed.
26. Busy state shows a spinner only on some buttons (`index.tsx:146`, `adjust.tsx:342`, footers); most Today actions just dim (`disabled={busy}`).
27. Tab icon differs by platform: `sparkles` on iOS native tabs (`Tabs.native.tsx:14`) vs Feather `sun` elsewhere (`Tabs.tsx:26`).
28. Header actions mix: Today header right is a text link "Everyday style" (`index.tsx:94-97`); Choose pieces has a "Clear" header action (`pieces.tsx:100-106`); other modals have only Cancel.
29. Modals that resize: pieces, replace and hijab size the picker from window height and font scale, not the sheet (`hijab.tsx:123-126` uses `height * 0.4`), so content shifts when the sheet detent or text size changes. Style settings is a long form in a sheet with Save at the very end (`style.tsx:311-318`).

## Existing Maestro coverage

| Flow file | Actions covered |
|---|---|
| `.maestro/wardrobe/start.yaml` | Clear state, skip onboarding, "Start with the sample closet", lands on first-run Today ("Try a sample style" visible) |
| `.maestro/stylist/start.yaml` | Same plus "Try a sample style", asserts "A little inspiration for today." |
| `.maestro/onboarding/skip.yaml` | Skipping onboarding lands on first-run Today "Start with your everyday style." |
| `.maestro/onboarding/flow.yaml` | Full onboarding lands on ready Today, `today-context` contains "Desi", relaunch stays on Today |
| `.maestro/onboarding/city.yaml` | Onboarding with city, lands on Today |
| `.maestro/onboarding/today-forecast.yaml` | `forecast-note` appears; Adjust chip (a11y label) -> Weather "Cold" -> "Find outfits"; manual weather caption and "(entered by you)" in `today-context`; persists after relaunch |
| `.maestro/stylist/feedback.yaml` | Reasons visible; "Wear this" -> "Marked as worn today." -> "Undo"; "Not for me" -> "Too formal" -> thanks + "Undo last change"; outfit "Change" (index 0) clears thanks; "Not my style" -> "Undo last change" |
| `.maestro/stylist/layouts.yaml` | Style settings layout "Outfit only" hides reasons; "With reasons and coverage checks" shows sleeve and neckline checks |
| `.maestro/stylist/style-settings.yaml` | Style settings defaults, layout full, print on print "I like it", "Avoid white at weddings", save, reopen shows saved values, Cancel |
| `.maestro/stylist/occasions.yaml` | "For an occasion" -> occasion list (Dinner or dawat, Eid, Party or mehndi, Wedding guest, Barat) -> Party + Desi -> "Find outfits" -> "Styled for a party or mehndi." and hijab reason |
| `.maestro/stylist/looks.yaml` | "Wear this" -> Looks tab shows worn outfit "Open Ivory work tunic" -> Save this look -> Cancel; Closet piece "Style this piece" -> Today "Styled for work.", banner "Just for now...", "Kept" |
| `.maestro/stylist/large-text.yaml` | Screenshots at large text: Today outfit, feedback chips, Style settings top and end |
| `.maestro/wardrobe/hijab.yaml` | "Try a sample style" -> "Compare hijabs" -> `hijab-preview`, "In the outfit now", `hijab-option-1` -> "Trying..." -> "Use this hijab" -> "Undo last change"; hijab row "Change .* hijab" opens same screen -> Cancel |
| `.maestro/wardrobe/looks.yaml` | Build and save a look in Closet -> Today "From your looks", "Fits this request as saved.", "Use this look" -> "Showing now" + "Undo last change"; mark hijab "In the wash" -> Today "Variant of Office" gap text -> "Fill the gap" -> "3 kept"; Looks tab "Open Office" |
| `.maestro/wardrobe/coverage.yaml` | First-run "Set my everyday style" -> Work, Western, Always include a hijab, My own line, Sleeves To the wrist -> "Save everyday style" -> `coverage-note` "Sleeves to the wrist are checked", no "Check before wearing" |
| `.maestro/wardrobe/coverage-owned.yaml` | (needs `seed-owned.sh`) "My clothes" in Style from -> "Check before wearing" sleeve unknown -> "Answer one question" -> "Long" -> "Save answer" clears it; edit fabric to chiffon -> see-through review -> "See-through" -> "Save answer" -> conflict "No combination in this closet meets your sleeve and hem choices."; header "Everyday style" -> "Full: arms, legs and neck" help text |
| `.maestro/wardrobe/bokmal.yaml` | Bokmål: first-run "Prøv en eksempelstil", "Litt inspirasjon for i dag.", Adjust ("Juster anledning.*") -> "Avbryt", scroll to "Lagre antrekket", "I dette antrekket", "Stilinnstillinger" (screenshots only) |
| `.maestro/wardrobe/archive.yaml` | Starts with "Try a sample style" (Today) then Closet archive flow |
| `.maestro/07-model/stylist-setting.yaml` | Style settings -> Stylist "Compare" -> help text -> "Compare results" -> Western, Desi, Rules, Model -> swipe down to close -> "Save style settings" |
| `.maestro/07-model/stylist-setting-nb.yaml` | Same in bokmål ("Sammenlign", "Resultater fra sammenligningen", "Lagre stilinnstillinger") |
| `.maestro/07-model/today-unlabelled.yaml` | Today never shows "Rules" or "Model" before and after outfit "Change" |
| `.maestro/profile-onboarding-builder/profile.yaml` | "Wear this" on Today -> Profile stats "Most worn" -> Profile "Open style settings" opens `/today/style` -> Cancel -> Today tab |
| `.maestro/profile-onboarding-builder/builder.yaml` | Uses stylist start (Today) then Looks builder; not a Today action |

Not covered by any flow:

- Today: "Back to today's look"; "Style from" switch to Sample closet; garment chips Blazer / Dress / Kurta / Trousers; "Keep" / "Kept" chip on piece rows; "Save look" from Today into the builder; "Find a new outfit" (broken and unavailable cards); problem actions "Stop keeping", "Any type of garment", "Switch to {style}", "Clear the weather", "Include set-aside pieces", "Add a piece", "Use the sample closet", "Open {name}"; "See all" in From your looks; "Data sources" link; only/last combination captions; forecast failure caption; save error.
- Adjust: style, garment, Conditions and Your day, "Stop keeping them", "Include set-aside pieces again", "Also make this occasion and style my everyday", discard confirm.
- Everyday: "Save and restyle today" vs "Save, keep today's outfit", hijab "Not needed", Moderate coverage, Hem, discard confirm.
- Choose pieces: whole route (select, filter, Clear, "Style around these", "Stop keeping pieces", empty states).
- Replace: whole route (try, "Use this piece", "Restyle without this piece", gone state).
- Check: "Use another piece", "Not now", length question, nothing-to-check state.
- Hijab: "No other hijab works" state, no-hijab state.
- Style settings: Belt, Shortest top, Trousers or skirts, Dupatta, Regional leaning, Rules / Model engine choice effects.
- First-run "Try a sample style" busy state; closet open failure and "Try again"; "Styling your day..." state.
