# Inventory: Looks, builder, Profile, onboarding, settings

Scope: `app/index.tsx`, `app/(tabs)/looks`, `app/look/build.tsx`, `app/look/[id].tsx`, `app/(tabs)/profile`, `app/onboarding/index.tsx`, `app/onboarding/colours.tsx`, `app/today/style.tsx` (style settings, reached from Profile), `src/features/OnboardingBar.tsx`, `src/features/BodyShapes.tsx`, `src/features/SelfieCamera.tsx`, `src/features/SamplePoints.tsx`, app start in `src/state/closet.tsx`, shell in `app/_layout.tsx` and `src/navigation/*`. Copy from `src/i18n/en.ts`.

## Routes

| Path | Title (EN) | How reached | Presentation |
|---|---|---|---|
| `/` (`app/index.tsx`) | none | App launch. Redirects to `/today` if `closet.styling.onboarded`, else `/onboarding` (`app/index.tsx:7`) | Root stack, `headerShown: false` (`app/_layout.tsx:27`) |
| app start gate (`ClosetProvider`) | "Opening your closet" / "Your closet could not open" | Every launch, before any route renders (`src/state/closet.tsx:62-85`) | Full screen `Screen centered`, not a route |
| `/(tabs)` | none | After redirect | Root stack, `headerShown: false` (`app/_layout.tsx:28`). Tabs: `NativeTabs` on iOS (`src/navigation/Tabs.native.tsx`), JS `Tabs` on web (`src/navigation/Tabs.tsx`) |
| `/looks` (`app/(tabs)/looks/index.tsx`) | "Your looks" (large title), tab label "Looks" | Tab bar "Looks"; `router.replace("/looks")` from gone look (`app/look/[id].tsx:33`) | Tab root, nested stack with `largeTitleOptions` (`app/(tabs)/looks/_layout.tsx:7-8`) |
| `/look/build` (`app/look/build.tsx`) | "Build a look" (new, empty), "Save this look" (prefilled pieces), "Edit your look" (with `id`) (`app/look/build.tsx:175-179`) | Looks header "Build a look" (`looks/index.tsx:26`); Looks empty state "Build your first look" (`looks/index.tsx:59`); Looks row for a worn, unsaved outfit with `pieces,name,occasion` params (`looks/index.tsx:90-97`); Look detail "Change pieces" with `id` (`look/[id].tsx:88`); Today card "Save look" with `pieces,name,occasion` (`app/(tabs)/today/index.tsx:501-511`); Closet starter "Build a look" when samples exist (`app/(tabs)/closet/index.tsx:166`) | **Modal** (`app/_layout.tsx:38-41`), header left "Cancel" (`build.tsx:180-185`) |
| `/look/[id]` (`app/look/[id].tsx`) | "Your look" (header) plus look name as in-page title | Looks row for a saved look (`looks/index.tsx:86-89`) | Push on root stack (`app/_layout.tsx:42`) |
| `/profile` (`app/(tabs)/profile/index.tsx`) | "Profile and settings" (large title), tab label "Profile" | Tab bar "Profile" | Tab root, nested stack with `largeTitleOptions` (`app/(tabs)/profile/_layout.tsx:7-8`) |
| `/today/style` (`app/today/style.tsx`) | "Style settings" | Profile "Open style settings" (`profile/index.tsx:149`); Today "Style settings" button (`app/(tabs)/today/index.tsx:643-647`) | **Modal** (`app/_layout.tsx:88-91`), header left "Cancel" (`style.tsx:205-213`) |
| `/today/stylist-results` | "Compare results" | Style settings "Compare results" (`style.tsx:233-239`) | **Modal** stacked on the style settings modal (`app/_layout.tsx:92-95`). Owned by the Today inventory, listed here for the hand-off |
| `/onboarding` (`app/onboarding/index.tsx`) full flow | Step title per step: "Hijab and coverage", "Units and city", "Body", "Your taste", "Your colours", "You are set" | Redirect on first run (`app/index.tsx:7`); Profile "Replay onboarding" (`profile/index.tsx:106`, replace); Profile "Reset all data" (`profile/index.tsx:120`, replace) | Root stack, `headerShown: false` (`app/_layout.tsx:96`), custom `OnboardingBar`, swipe back disabled (`onboarding/index.tsx:165`) |
| `/onboarding?step=<hijab\|place\|body\|taste\|colours>` single step | Same step title | Profile "Change" chip on an answer row (`profile/index.tsx:136-141`) | Push on root stack, `headerShown: false`, `OnboardingBar` with "Cancel" text and no progress, swipe back enabled (`onboarding/index.tsx:165-183`) |
| `/onboarding/colours` (`app/onboarding/colours.tsx`) | "Colour analysis" (in-page title) | "Take a selfie" on the colours step (`onboarding/index.tsx:350-355`), both full flow and single step from Profile | Push, `headerShown: false` (`app/_layout.tsx:97-100`), `OnboardingBar` with chevron "Back" (`colours.tsx:290-296`) |

Tab bar (iOS native): Today `sparkles`, Closet `hanger`, Looks `square.grid.2x2`, Profile `person.crop.circle`. Web: Today `sun`, Closet `grid`, Looks `bookmark`, Profile `user`.

Native splash: `assets/brand/splash.png`, 220 wide, background `#FDFBF7` (`app.json:47-52`). No `SplashScreen.preventAutoHideAsync` anywhere, so the splash hides on its own before the closet is loaded.

## User actions

### App start

| Route | Action | Result | Data read / written |
|---|---|---|---|
| start gate | Launch app | Native splash, then "Opening your closet / Your pieces will be here in a moment." text, then redirect | Reads closet storage (`repository.load`), writes sample wardrobe if `sampleCatalog` is old, writes `withSampleAttributes` and `proposeWeatherTraits` if they change anything (`closet.tsx:37-60`). Discards leftover Studio model (`app/_layout.tsx:11-13`) |
| start gate | "Try again" after load error | Status back to loading, reload | Reads closet storage |
| `/` | (none, automatic) | Redirect to `/today` or `/onboarding` | Reads `styling.onboarded`. Legacy closets with owned pieces count as onboarded (`src/domain/closet.ts:1061`) |

### Looks tab

| Route | Action | Result | Data read / written |
|---|---|---|---|
| `/looks` | Open tab | List of saved looks plus outfits worn but not saved, newest first | Reads `closet.looks`, `closet.feedback` (`wore` events not undone), `closet.pieces` via `lookEntries` (`src/domain/looks.ts:15-46`) |
| `/looks` | Header "Build a look" | Opens `/look/build` modal, empty | none |
| `/looks` | Tap saved look row ("Open {name}") | Push `/look/[id]` | none |
| `/looks` | Tap worn, unsaved row (caption "Worn, not saved yet") | Opens `/look/build` modal titled "Save this look", prefilled pieces, generated name, occasion | none |
| `/looks` | Empty, has pieces: "Build your first look" | Opens `/look/build` | none |
| `/looks` | Empty, no pieces: "Add a piece" | Opens `addPiecesRoute`: `/capture` modal on device, `/piece/new` modal otherwise (`src/state/imports.ts:25-26`) | none |
| `/looks` | Read row | Collage, name, occasion and/or "Worn, not saved yet", piece count or missing count | Reads pieces per look |

### Look builder (`/look/build`)

| Route | Action | Result | Data read / written |
|---|---|---|---|
| `/look/build` | Open | Live collage on top, category filters and horizontal piece strip below (2 column grid if width >= 900), name field and save button pinned to bottom | Reads `closet.pieces`, `closet.looks` (source when `id`), params `pieces`, `name`, `occasion` |
| `/look/build` | Tap a piece in strip | Toggles it in the look, collage updates, strip scrolls to start, count caption updates ("1 piece in your look") | Ranks options with `rankPieces` (taste, occasion, today date) |
| `/look/build` | Category filter chip | Strip filtered by category | none |
| `/look/build` | "Fill the rest" | Completes the outfit around chosen pieces via `fillOutfit`, or shows notice (first problem message or "These choices do not make a complete outfit.") | Reads closet, request, date |
| `/look/build` | Tap a piece in the collage | Strip area switches to "Swap {name}" with up to N alternatives; tap again closes | `swapOptions` |
| `/look/build` | Tap alternative in swap | Replaces that piece, closes swap | none |
| `/look/build` | Swap "Done" | Closes swap, back to strip | none |
| `/look/build` | Edit "Look name" | Name changes. While the user has not typed a custom name, the name follows the suggested name as pieces change (`followName`, `build.tsx:83-89`) | none |
| `/look/build` | "Save look" / "Save changes" | Saves look, records a `saved` feedback event, `router.back()` | Writes `closet.looks` (`saveLook`) and `closet.feedback` (`recordSaved`) (`build.tsx:148-161`) |
| `/look/build` | "Cancel" or swipe down with changes | Native alert "Discard changes?" via `useDiscardChanges` | none |
| `/look/build` | Empty closet: "Go to closet" | `router.replace("/closet")` from inside the modal (`build.tsx:310`) | none |
| `/look/build` | Empty category: "Show all pieces" | Resets filter to all | none |

### Look detail (`/look/[id]`)

| Route | Action | Result | Data read / written |
|---|---|---|---|
| `/look/[id]` | Open | Name (title), occasion, piece count, collage, missing note, "Change pieces", plain list of piece names, "Remove look" | Reads `closet.looks`, `piecesForLook` |
| `/look/[id]` | "Change pieces" | Opens `/look/build` modal with `id`, titled "Edit your look" | none |
| `/look/[id]` | "Remove look" | Alert "Remove this look? / The pieces will stay in your closet.", then `router.back()` | Writes `closet.looks` (filter out) |
| `/look/[id]` | Gone look: "Go to looks" | `router.replace("/looks")` | none |

### Profile tab

| Route | Action | Result | Data read / written |
|---|---|---|---|
| `/profile` | Open | Sections: "Your answers" (5 rows), "Style settings" (one button), "Closet stats", "App" (language, replay, reset, privacy, version) | Reads `answersFrom(closet)`, `closetStats(closet)` (only current wardrobe source, not archived), `Constants.expoConfig.version` |
| `/profile` | "Change" on Hijab and coverage / Units and city / Body / Your taste / Colours | Push `/onboarding?step=<step>` single step | none |
| `/profile` | "Open style settings" | Opens `/today/style` modal | none |
| `/profile` | Read stats | "Pieces", "Never worn", "Most worn" top 3 ("{name}, once" / "{name}, {count} times") or "Nothing worn yet". Not tappable | Reads `closet.feedback` wear counts |
| `/profile` | Language: "Follow phone" / "English" / "Norsk bokmål" | Saves at once, app tree remounts in new language (`closet.tsx:88-91`), navigation falls back to the first tab | Writes `styling.language` |
| `/profile` | "Replay onboarding" | No confirm. Sets `onboarded: false`, `router.replace("/onboarding")` | Writes `styling.onboarded` |
| `/profile` | "Reset all data" | Alert "Delete all your data?" / "Delete everything". Resets closet to sample wardrobe keeping language and scan settings, deletes all photos, replace to `/onboarding` | Writes whole closet (`resetCloset`), deletes photo files (`discardAllPhotos`) |
| `/profile` | Read privacy and version | Caption text | none |

### Style settings (`/today/style`, the Profile "settings" target)

| Route | Action | Result | Data read / written |
|---|---|---|---|
| `/today/style` | Open | Intro text, "Outfit card" layout choice, "Stylist" engine choice (Rules / Model / Compare) with help caption, "Compare results" button, belt, shortest top, trousers or skirts, print on print, wedding colours to avoid (chips), dupatta, regional leaning, "Save style settings" | Reads `styling.profile`, `styling.layout`, `styling.engine` |
| `/today/style` | Change any choice | Local draft, Save enabled when dirty | none |
| `/today/style` | "Compare results" | Opens `/today/stylist-results` modal on top of this modal | none |
| `/today/style` | "Save style settings" | Saves, `router.back()` | Writes `styling.profile` via `saveProfile`, `styling.layout`, engine via `setEngine` |
| `/today/style` | "Cancel" or swipe with changes | "Discard changes?" alert | none |

### Onboarding full flow (`/onboarding`)

| Route | Action | Result | Data read / written |
|---|---|---|---|
| `/onboarding` | Arrive (first run, replay, reset) | Step 1 of 6 "Hijab and coverage", intro text, no back | Reads `answersFrom(closet)` into local state |
| step hijab | Choose "Do you wear a hijab?" Always / Sometimes / No; "How much coverage do you want?" Full / Moderate / My own line | Local answer | none until Next |
| step place | Units "Centimetres and °C" / "Feet and °F"; "City for the weather" field; "Find city" or keyboard search | Geocodes via `ClosetVision.geocodeCity`; shows "Weather for {name}" or error "We could not find that city..." | Network call to Apple geocoder; local answer |
| step place | "Next" with typed but unresolved city | Runs find city first instead of advancing (`onboarding/index.tsx:112-113`), user must tap Next again | none |
| step body | Height in cm, or feet and inches (per units); body shape grid (6 drawings) or "Prefer not to say" chip | Local answer; invalid height shows "Enter a height between 120 and 220 cm." on Next | none until Next |
| step taste | Fit Loose / Structured / It depends; Colours Bold / Soft and neutral / It depends; "Desi, Western or both" | Local answer | none until Next |
| step colours | "Take a selfie" | Push `/onboarding/colours` | none |
| step colours | Tap a skin swatch | Saves colour season immediately, shows "Your colours: {season}" | Writes `styling.profile.colour` at once (`onboarding/index.tsx:139-150`) |
| any step 1 to 5 | "Next" | Saves step answer, advances | Writes via `applyAnswer`: hijab writes `profile.coverageLevel` and may create or update the everyday preset (`styling.everyday`); place writes `units`, `place`, clears `forecast` if moved; body writes `heightCm`, `bodyShape`; taste writes `fit`, `colourLean`, `styleLean` and may set everyday style; colours step Next just advances |
| any step 1 to 5 | "Skip" | Advances without saving | none |
| step 2 to 6 | "Back" (chevron in bar) | Previous step, local answers kept | none |
| step done | "Add my clothes" | Sets `onboarded`, replace to `/today`, then push `addPiecesRoute` (capture modal) | Writes `styling.onboarded` |
| step done | "Start with the sample closet" | Sets `onboarded`, replace to `/today` | Writes `styling.onboarded` |

### Onboarding single step (`/onboarding?step=x`, from Profile)

| Route | Action | Result | Data read / written |
|---|---|---|---|
| `/onboarding?step=x` | "Save" | Saves that answer, `router.back()` to Profile | Same writes as Next |
| `/onboarding?step=x` | "Cancel" or swipe back | Back to Profile, unsaved edits lost, no discard prompt | none |
| `/onboarding?step=colours` | Tap swatch | Saves at once; "Save" then only goes back | Writes `profile.colour` |

### Colour analysis (`/onboarding/colours`)

| Route | Action | Result | Data read / written |
|---|---|---|---|
| `/onboarding/colours` | Arrive | Requests camera permission on mount with no pre-prompt (`colours.tsx:64-69`); camera only if `ClosetVision.isAvailable()` | OS camera permission |
| `/onboarding/colours` | Live face guide | Oval and pill text update from face readings: "Look into the camera", "Face a window for more light", "Move closer", "Move back a little", "Fit your face in the oval", "Look straight at the camera", "Hold still", "Ready" | Live camera frames (native) |
| `/onboarding/colours` | Shutter "Take photo" | Captures, measures | Temp photo file |
| `/onboarding/colours` | "Choose a recent selfie" | Photo library picker, then measure | Temp copy of photo |
| `/onboarding/colours` | Measuring | `ClosetVision.analyzeSelfie` | Reads temp photo |
| `/onboarding/colours` | Result: drag Skin / Hair / Eyes points on the photo | Resamples that part's colour (`ClosetVision.sampleSelfie`), updates season live | Reads temp photo |
| `/onboarding/colours` | Result: change Undertone, Depth, Contrast | Adjusts profile and season | none |
| `/onboarding/colours` | "Save my colours" | Saves, deletes temp photo, `router.back()` | Writes `styling.profile.colour`; deletes temp file |
| `/onboarding/colours` | "Try again" | Deletes photo, back to intro | Deletes temp file |
| `/onboarding/colours` | "Back" | Pops, temp photo deleted on unmount | Deletes temp file |

## States

| Route | State | What the UI shows today |
|---|---|---|
| app start | Loading | Native splash on `#FDFBF7`, then white screen with Georgia heading "Opening your closet" and muted "Your pieces will be here in a moment." No indicator, no motion (`closet.tsx:62-74`) |
| app start | Error | "Your closet could not open" / "Your saved data has been kept. Try opening it again." plus "Try again" button |
| app start | First run | Redirect straight into onboarding step 1. Sample wardrobe already added in the background at load |
| `/looks` | Empty, no pieces | Muted intro "Good combinations, kept for another day.", then "Keep a look you love." / "Add a few pieces to your closet, then bring them together in your first outfit." + "Add a piece". Rare in practice: sample wardrobe always exists |
| `/looks` | Empty, has pieces | Same title, "Bring a few pieces together and save the combination..." + "Build your first look" |
| `/looks` | Filled | Full-width square collage per row, name, occasion, count. Worn unsaved rows look the same with "Worn, not saved yet" |
| `/looks` | Look with deleted pieces | Caption "1 piece is no longer in your closet" / "{count} pieces..." instead of count |
| `/looks` | Loading, error, offline | None (synchronous from store) |
| `/look/build` | Empty selection | Collage empty state "Start with a piece you love." / "Choose below and watch your outfit come together here." |
| `/look/build` | Empty closet | Strip shows "Add a few pieces to start building your look." + "Go to closet" |
| `/look/build` | Empty category | "No pieces in this category yet." + "Show all pieces" |
| `/look/build` | Fill failed | Muted notice under collage with domain problem text or "These choices do not make a complete outfit." |
| `/look/build` | Swap with no alternatives | "No other piece fits here." |
| `/look/build` | Saving | Save button spinner, inputs disabled, discard guard blocks dismissal while busy |
| `/look/build` | Save error | Red error above name field (raw `Error.message` or "error.lookSave") |
| `/look/build` | Keyboard open | Piece strip hidden with `display: none`, layout jumps (`build.tsx:237`) |
| `/look/build` | Large text | Strip height grows by `(fontScale - 1) * 68` (`build.tsx:236`) |
| `/look/build` | Wide (>= 900) | Side-by-side collage and 2 column grid |
| `/look/[id]` | Look missing | `Screen centered`: "This look is no longer here" / "Your other saved looks are still in Looks." + "Go to looks" |
| `/look/[id]` | Missing pieces | "1 piece is no longer in your closet. Edit this look to choose a replacement." |
| `/look/[id]` | Removing | Remove button spinner |
| `/look/[id]` | Remove error | Red "error.lookRemove" |
| `/profile` | First run / nothing answered | Each answer row "Not answered" |
| `/profile` | No wear history | Never worn = all pieces, "Nothing worn yet" |
| `/profile` | Busy (language, replay, reset) | Language choices and buttons disabled, no spinner |
| `/profile` | Error | Red "This could not be saved. Please try again." under reset |
| `/today/style` | Clean | Save disabled |
| `/today/style` | Saving / error | Spinner on save / "Your style settings could not be saved. Please try again." |
| `/onboarding` | First run | Step 1 of 6 with progress bar, intro, no back control |
| `/onboarding` | Saving step | Next button spinner, choices disabled |
| `/onboarding` | Save error | "This answer could not be saved. Please try again." |
| `/onboarding` place | Finding city | Find city disabled, Next shows spinner (shared `busy`) |
| `/onboarding` place | City not found / offline | Same text for both: "We could not find that city. Check the spelling, or skip for now." |
| `/onboarding` place | Found | "Weather for {name}" plus long privacy caption |
| `/onboarding` body | Invalid height | "Enter a height between 120 and 220 cm." |
| `/onboarding` colours | Already saved | "Your colours: {season}" |
| `/onboarding` single | Editing from Profile | No progress bar, "Cancel" text link (no chevron), "Save" instead of Next, no Skip |
| `/onboarding/colours` | Intro, camera on | Camera frame 3:4 with dashed oval and guide pill, shutter, tips, hijab note, deletion note, "Choose a recent selfie" (secondary) |
| `/onboarding/colours` | Camera unavailable (simulator, no native module) | No camera, tips, "Choose a recent selfie" as primary |
| `/onboarding/colours` | Permission denied | "Camera access is off. Choose a selfie instead, or turn on camera access in Settings." No button to open Settings |
| `/onboarding/colours` | Camera failed mid-capture | Falls back to camera "off" silently; library error says "The camera could not open. Choose a selfie instead." |
| `/onboarding/colours` | Measuring | `ActivityIndicator` plus "Measuring your colours" |
| `/onboarding/colours` | Retake | Soft plum box: "too dark", "light is mixed", "could not find a face", or "could not be read", above the camera again |
| `/onboarding/colours` | Result | Photo with draggable points, measured dots (dashed "Not measured" when missing), "Your season: {season}", three adjust groups, "Colours that suit you" palette, Save / Try again |
| `/onboarding/colours` | Save error | "Your colours could not be saved. Please try again." |

## Magic moments

| Moment | Where | How it looks now |
|---|---|---|
| Loading: app start | Native splash then `ClosetProvider` gate | Static splash image on `#FDFBF7`, then a hard cut to a white screen with heading text only, then a hard cut to onboarding or Today. Background colour changes between splash and app (`#FDFBF7` vs `#FFFFFF`). No animation, no spinner, no hand-off |
| Generating: Fill the rest | `/look/build` | Synchronous. Collage pieces jump to the new arrangement in one frame, strip jumps to start (`scrollToOffset` with `animated: false`, `build.tsx:117`). No sense of the outfit being arranged |
| Generating: piece toggle and swap | `/look/build` | Collage re-lays out instantly; swap panel replaces the strip with no transition |
| Live detection: selfie face guide | `SelfieCamera` | Dashed white oval turns solid when ready; dark pill at the bottom changes text live. Guide text is announced with `accessibilityLiveRegion` |
| Generating: measuring colours | `/onboarding/colours` | Bare `ActivityIndicator` plus "Measuring your colours" replaces the whole screen content |
| Selecting in image: sample points | `SamplePoints` | Three 44 pt rings on the photo filled with the sampled colour, draggable; resample runs async with no progress indicator; season text updates when done |
| Saving | Builder, look detail, style, onboarding, colours | Spinner inside the primary button |
| Language switch | `/profile` | Whole tree remounts with no transition; user lands on Today |

## Pain points

Navigation and modals
- `look/build` is a modal (`app/_layout.tsx:38-41`) reached from five places (Looks header, Looks empty, Looks worn row, Look detail, Today card, Closet starter). Editing from Look detail stacks a modal over a push.
- `today/style` is a modal (`app/_layout.tsx:88-91`) and "Compare results" opens a second modal on top of it (`app/today/style.tsx:238`, `app/_layout.tsx:92-95`): stacked sheets.
- Style settings has two entry points with different labels: Profile "Open style settings" under a "Style settings" heading (`profile/index.tsx:145-150`) and Today "Style settings" (`today/index.tsx:643-647`). It lives under the `today/` route group but is a profile setting.
- Builder empty closet "Go to closet" calls `router.replace("/closet")` from inside a modal (`build.tsx:310`), replacing a modal with a tab route.
- Done step "Add my clothes" does `router.replace("/today")` then immediately `router.push(addPiecesRoute)` (`onboarding/index.tsx:153-156`): two transitions, user lands in a capture modal on top of a Today they never saw.
- Language change remounts the app via `Fragment key={locale}` (`src/state/closet.tsx:91`) and drops the user from Profile to Today; the Maestro flow works around this (`.maestro/onboarding/settings.yaml:37-42`).
- Looks rows that look identical go to different places: saved rows push a detail page, worn rows open the builder modal (`looks/index.tsx:84-98`).
- Tab icons differ between native and web (sparkles/hanger/square.grid vs sun/grid/bookmark) (`Tabs.native.tsx:14-29`, `Tabs.tsx:26-53`). Looks uses a grid icon that reads like a closet.

Inconsistent screens
- Three header systems in this area: native large title (Looks, Profile), native small header with text "Cancel" left (builder, style), custom `OnboardingBar` with `headerShown: false` (onboarding, colours) (`app/_layout.tsx:96-100`, `OnboardingBar.tsx`).
- `OnboardingBar` back control is chevron + "Back" in the flow but plain "Cancel" in single step mode (`onboarding/index.tsx:168-169`), and native headers use minimal back with no label (`src/navigation/options.ts:8`).
- Look detail shows "Your look" in the header and the look name again as an in-page title (`app/_layout.tsx:42`, `look/[id].tsx:68`).
- Profile tab label "Profile" but title "Profile and settings" (`en.ts:653`).
- Builder title changes with entry ("Build a look", "Save this look", "Edit your look") and button reads "Save look" or "Save changes" (`build.tsx:175-179`, `build.tsx:359`). Today's "Save look" button opens a screen that asks to save again.
- Same concept, three words: "Your colours" (step title), "Colour analysis" (selfie screen), "Colours" (Profile row) (`en.ts:623,652,700`).
- Missing piece copy exists three times with different punctuation: `looks.missingOne`, `looksTab.missingOne`, `look.missingOne` (`en.ts:942,1032,1017`).
- Swatch pick saves on tap while every other step saves on Next (`onboarding/index.tsx:139-150` vs `98-120`). On the colours step "Next"/"Save" does nothing but navigate (`onboarding/index.tsx:99`).
- Single step edit from Profile has no discard guard, while builder and style settings do (`onboarding/index.tsx` has no `useDiscardChanges`; compare `build.tsx:97`, `style.tsx:169`).
- Swap "Done" uses `HeaderAction` (a header link) inside page content (`build.tsx:246-249`).
- Next shows a spinner while the city lookup runs because `busy` is shared (`onboarding/index.tsx:123,408-412`).
- Unused key `colours.camera` (`en.ts:659`).

Clutter and helper text
- Looks intro "Good combinations, kept for another day." (`looks/index.tsx:36-40`).
- Profile is one long scroll of four sections, a heading with a single button under it (`profile/index.tsx:145-150`), and a long privacy paragraph (`en.ts:714`).
- Style settings intro paragraph and engine help paragraph (`style.tsx:215,230-232`); "Stylist: Rules / Model / Compare" and "Compare results" are developer controls in a user settings screen.
- Onboarding: intro sentence, body "why" line, colours "why" paragraph, privacy caption on the place step, done step paragraph (`en.ts:574-631`).
- Colour analysis intro shows tips, hijab note and deletion note as three separate text blocks under the camera (`colours.tsx:267-271`).

Dead ends and missing hand-offs
- Look detail lists piece names as plain text, not tappable to the piece (`look/[id].tsx:90-92`).
- Look detail has no "Wear this" or "Show on Today" action; the only way a saved look reaches Today is the stylist surfacing it ("From your looks").
- Piece detail says "Used in N saved looks" but does not link to them (`app/piece/[id].tsx:128-134`).
- Profile stats ("Never worn", "Most worn") are not tappable, no path to use neglected pieces (`profile/index.tsx:151-170`).
- Saving a look from Today or Looks just pops back with no confirmation (`build.tsx:162-163`).
- Camera denied: no button to open iOS Settings (`colours.tsx:266`).
- Offline city lookup is reported as "could not find that city" (`onboarding/index.tsx:132-133`).
- "Replay onboarding" has no confirm and immediately flips `onboarded` to false (`profile/index.tsx:103-108`).
- Busy Profile actions disable controls without any visible progress (`profile/index.tsx:179-195`).

Layout and accessibility
- Builder hides the piece strip with `display: none` when the keyboard opens and pads by keyboard height manually (`build.tsx:129-140,172,237`): visible jump.
- Builder strip height magic number `256 + (fontScale - 1) * 68` (`build.tsx:236`); Looks list `paddingBottom: 110` (`looks/index.tsx:124`).
- `OnboardingBar` caps text at 1.3 and 1.4 font scale (`OnboardingBar.tsx:33,40`).
- Sample points are drag-only; VoiceOver users get a label but no adjustable action (`SamplePoints.tsx` Dot, `accessible` with no `accessibilityActions`).
- `BodyShapes` group is `radiogroup` but tiles are `button` role (`BodyShapes.tsx:27,35`).
- Measuring and resampling have no Reduce Motion relevant motion today, but also no progress beyond a spinner.
- Splash background `#FDFBF7` differs from app background `#FFFFFF` (`app.json:51`, `src/ui/theme.ts:3`).
- Loading gate replaces the splash with plain text; no `preventAutoHideAsync`, so the user sees splash, white text screen, then the first route.

Interrupted moments
- Leaving colour analysis while measuring: temp photo is discarded on unmount (`colours.tsx:71`), but `measure` still calls `setPhase` after unmount.
- Builder blocks dismissal while saving (`useDiscardChanges` with `busy`, `src/navigation/useDiscardChanges.ts:10-15`), silently ignoring the gesture.

## Existing Maestro coverage

| Flow file | Actions covered |
|---|---|
| `.maestro/profile-onboarding-builder/onboarding.yaml` | Clear state, step 1 of 6 with no Back, choose Always, Next to step 2, Back keeps selection, Skip x2 to step 3, choose Hourglass, Next, Back keeps Hourglass, Skip to step 5, "Take a selfie" opens "Colour analysis", Back to step 5, Skip to "You are set", Back to step 5 |
| `.maestro/profile-onboarding-builder/profile.yaml` | Sample closet start, Wear this on Today, Profile tab shows "Profile and settings" and "Your answers", Closet stats with "Most worn" "{name}, once", "Open style settings" opens style intro, Cancel back to Profile, Today tab |
| `.maestro/profile-onboarding-builder/builder.yaml` | Looks tab, "Build a look", "Fill the rest" visible, scroll strip and pick tunic, "1 piece in your look", Fill the rest, name follows tunic, tap hijab in collage opens "Swap ... hijab", Done, rename "My Eid look", Save look, row "Open My Eid look" in Looks |
| `.maestro/onboarding/flow.yaml` | Full onboarding: Always + Full coverage, metric default selected, Skip place, invalid height 1.65 error, 165 cm, Hourglass, Loose / Soft and neutral / Desi, swatch "Medium, warm" saves "Your colours: Warm autumn", "You are set", Start with the sample closet, Today shows Desi context, relaunch skips onboarding |
| `.maestro/onboarding/flow-large.yaml` | Large text screenshots of every step and swatches |
| `.maestro/onboarding/skip.yaml` | Skip every step, "You are set", sample closet, Today empty everyday state |
| `.maestro/onboarding/city.yaml` | Type Oslo, Find city, "Weather for Oslo", Next, skip rest, sample closet, Today |
| `.maestro/onboarding/today-forecast.yaml` | After city: forecast note on Today, manual weather override (Today area) |
| `.maestro/onboarding/colours.yaml` | Skip to step 5, "Take a selfie", hijab note and deletion note visible, permission dialog Allow, simulator shows no shutter and "Choose a recent selfie" |
| `.maestro/onboarding/answers.yaml` | After flow: Profile shows hijab, "165 cm, Hourglass", "Warm autumn"; Change: Units and city, switch to Feet and °F, Save, body shows "5 ft 5 in"; Change: Body shows no Skip and feet field, Cancel |
| `.maestro/onboarding/answers-large.yaml` | Large text Profile, scroll to "Change: Colours", open "Change: Body", no Skip, Cancel |
| `.maestro/onboarding/settings.yaml` | Profile privacy text and version, switch to Norsk bokmål (re-tap Profil after remount), back to Følg telefonen, Replay onboarding to step 1, skip through, Reset all data alert, Delete everything, onboarding again, sample closet |
| `.maestro/stylist/looks.yaml` | Wear this on Today, Looks shows worn row "Open Ivory work tunic", opens builder "Save this look", Cancel; then Closet "Style this piece" (Closet area) |
| `.maestro/stylist/style-settings.yaml` | Today "Style settings", intro, layout default "With reasons", choose full layout, print on print "I like it", "Avoid white at weddings", Save, Today shows coverage check, reopen shows saved values, Cancel |
| `.maestro/stylist/layouts.yaml` | Style settings "Outfit only" and "With reasons and coverage checks" saved and reflected on Today card |
| `.maestro/07-model/stylist-setting.yaml` | Style settings Stylist "Compare", help text, "Compare results" modal, rows Western, Desi, Rules, Model, swipe down to close, Save style settings |
| `.maestro/07-model/stylist-setting-nb.yaml` | Same as above in bokmål |
| `.maestro/wardrobe/looks.yaml` | Closet "Build a look", pick hijab, tunic, trousers, loafers by swiping strip, name "Office", Save look; Today "From your looks" / "Use this look"; mark hijab In the wash; Today "Variant of Office", "Fill the gap"; Looks "Open Office" shows "4 pieces from your closet" |
| `.maestro/wardrobe/bokmal.yaml` | Bokmål onboarding skip ("Hopp over", "Da er du klar"), tab labels, "Antrekk" (Looks) tab screenshot |
| `.maestro/wardrobe/start.yaml`, `.maestro/stylist/start.yaml` | Shared setup: clear state, skip onboarding, sample closet, Try a sample style |

Not covered by any flow
- App start loading and "could not open" error with Try again.
- Looks empty states (no pieces, pieces but no looks).
- Look detail: "Change pieces" edit path, "Remove look" with confirm, gone look state, missing pieces message.
- Builder: category filter, empty category "Show all pieces", empty closet "Go to closet", fill failure notice, swap with no alternatives, discard changes alert, save error, keyboard hiding strip.
- Opening a worn row and actually saving it.
- Profile: "Change: Hijab and coverage", "Change: Your taste", "Change: Colours" (swatch in single step), stats with "Nothing worn yet", busy and error states.
- Onboarding: city not found, offline, "Prefer not to say", imperial height entry in the flow, save error, "Add my clothes" hand-off to capture.
- Colour analysis: real selfie capture, live face guide states, measuring, each retake reason, result screen, dragging sample points, adjust undertone/depth/contrast, Save my colours, Try again, permission denied.
- Style settings: belt, top length, bottoms, dupatta, region, discard alert.
