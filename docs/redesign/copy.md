# Almari copy

Date: 2026-10-03. Phase 2 output, UX writer. Source: `src/i18n/en.ts`, `src/i18n/nb.ts`, `architecture.md` (Owner decisions win), `use-cases.md`.

Rules for every string:

- Labels and values. No helper text unless the user cannot act correctly without it. Kept lines are marked "kept: needed to act" or "kept: privacy".
- One term per concept. The glossary below is the only source for these words. A developer who needs a word not in it asks the writer.
- Bokmål is written as a Norwegian would say it, not translated word for word. Never nynorsk.
- No em dash. No exclamation marks. No "Please". Sentences end with a full stop only when they are sentences; labels have none.
- Errors are one line next to the control that failed: what happened, then the way out.
- Dates come from `Intl.DateTimeFormat` with the app locale: EN `Sat 11 Oct`, NB `lør. 11. okt.`. Short form `12 Sep` / `12. sep.`. Visible text keeps the short form; the VoiceOver label of `looks.lastWorn`, `looks.planned`, `piece.wornMany`, `piece.wornOnce`, `change.inPlan`, `today.banner.planning`, `today.unsavedPlan` and the `adjust.pickDate` value uses `dateStyle: "full"`.
- Errors use one grammar: EN "Could not {verb} {object}", NB "Kunne ikke {verb} {object}". "this photo" / "bildet" for a photo.
- No string sits in a fixed-height or fixed-width container. Buttons and chips use 44 and 52 as `minHeight` with vertical padding, so a label that wraps to two lines grows its capsule.
- Every `mark` string, NB included, fits a 112 pt strip tile at the 1.4x mark cap (about 9 characters).
- Copy keys hold no soft hyphens (F12 B). The shared `Text` adds them at render time in `nb` to any word of 12 or more characters, user-entered piece and look names included, using the TeX `hyph-nb` Liang patterns (as packaged in `hyphen/nb-no`), so AX5 breaks at a syllable with a visible hyphen, never mid-word. Expected breaks: eksempel|garderoben, eksempel|garderobe, tilbake|meldinger, tilgjengelig|het, til|gjengelig, u|tilgjengelig, familie|selskap, bilde|avlesning, hals|ringningen, gjennom|siktig, kamera|tilgang, inn|stillinger, sammen|ligning, antrekks|kort, tilbake|still, be|grunnelser.
- Every count has a `One` / `Many` key pair, new keys included. NB uses the same form for 1 and many where the word does not change (`1 plagg`, `3 plagg`), but still gets both keys (`1 klar`, `3 klare`).
- The "Replaces" column names the current key. "new" means no current key. A current key that appears nowhere below and is not listed under "Unchanged" or "Cut" is cut.

## Glossary

| Concept | English | Bokmål | Never use |
|---|---|---|---|
| One garment, shoe, bag or accessory the user owns | piece | plagg | item, garment (EN); klesplagg, element (NB) |
| The garments on Today, made by the stylist for now | outfit | antrekk | look (EN); look (NB) |
| A saved, worn or planned combination | look | look (en look, looken, looker, lookene) | outfit, combination (EN); antrekk, kombinasjon (NB) |
| Where the looks live (tab) | Looks | Samling | Your looks, Lagret, Antrekk |
| All pieces (tab and place) | closet | garderobe | wardrobe (EN UI); klesskap (NB) |
| Head covering | hijab | hijab (hijaber) | scarf when a hijab is meant |
| Record that something was worn | wear, worn | bruke, brukt | use for wearing (EN); ha på, gå med (NB). NB "Bruk" means wear, everywhere |
| Wear today's outfit (Today button) | Wear this | Bruk i dag | Mark as worn on Today |
| Record a wear from a look or selected pieces | Mark as worn | Merk som brukt | Wear this on a look, Worn lately, Wore recently |
| Pick an alternative in a strip | Use | Velg | Bruk (NB, reserved for wearing) |
| Pieces picked in Select or Start with a piece | selected | valgt | chosen |
| A date set on a look | Plan, planned | Planlegg, planlagt | Schedule, Plan for (as a verb) |
| Hold a piece across Another | Keep, kept | Behold, beholdt | Lock, Pin. Keep for anything else (rows, sets, saving) |
| Swap one piece for another | Change | Bytt | Swap, Replace (EN); Erstatt (NB) |
| Modify stored data (piece, answer, care label) | Edit | Endre | Change (EN); Rediger (NB) |
| Next outfit for the same request | Another | Et annet | Next, Shuffle, Restyle; Et nytt, Nytt antrekk (NB, too wide for a third of the quiet row) |
| Make a look by hand | New look | Ny look | Build a look, Sett sammen en look |
| Pick one of several options (date, photo, garment) | Choose | Velg | Pick |
| Build the outfit around a type, a piece or a selection | Start with, Started with | Start med, Startet med | Style around, Style this piece, Style today |
| Remove from suggestions, keep the piece | Put away | Legg bort, lagt bort | Archive, Arkiver |
| Piece back from put away | Back in the closet | Tilbake i garderoben | Restore, Unarchive |
| Temporarily away (wash, lent, repair) | Unavailable | Utilgjengelig | Away, Set aside |
| Excluded for one request only | Set aside | Lagt til side | Unavailable |
| Display a look on Today without a wear | Show on Today | Vis på I dag | Use this look, Wear this look |
| Save the outfit as a look | Save look | Lagre look | Save this look, Lagre antrekket |
| Change today's request | Adjust | Juster | Customise, Endre dagen |
| Everyday preferences screen | Your style | Din stil | Everyday style, Style settings, Stilinnstillinger |
| Today's default request, set in Your style | everyday | hverdag | default, normal |
| Event the outfit is for | occasion | anledning | event |
| Desi or Western | style | stil | type |
| Kind of garment (Knit, Dress) | garment | plaggtype | kind (in UI) |
| Pieces bundled with the app | sample closet, Sample, Try the sample closet | eksempelgarderobe, Eksempel, Prøv eksempelgarderoben | demo, sample style, Use the sample (NB Bruk) |
| The user's own pieces as stylist source | My clothes | Mine klær | Your closet (as source) |
| Pieces that belong together | set, Link as a set | sett, Koble som sett | group, suit, Keep as a set, Link as set |
| Add pieces flow | Add pieces | Legg til plagg | Import, Capture |
| Capture tile that needs answers | Confirm | Bekreft | Quick check, Review, Answer for, Fix |
| Today card asking a fact before wearing | Check | Sjekk | Question, Verify |
| Edited mask of the piece photo | cut-out | utklipp | cutout, mask, Plain |
| Label sewn into a piece | care label | vaskelapp | tag, label alone |
| Cloud photo clean-up | Clean background | Ren bakgrunn | Studio |
| Forecast | forecast | værmelding | værvarsel |
| Sleeve and hem rules | coverage | dekning | modesty |
| Warmth of a piece | Warmth: Light, Medium, Warm | Varme: Lett, Middels, Varm | |
| Leave without saving | Discard | Forkast | Throw away, Drop |
| Leave an onboarding step | Skip | Hopp over | Drop, Dropp. Never on a capture row |
| A fact the app proposed, not yet confirmed | suggested | foreslått | a guess, gjetning, Forslag |
| Camera or library | Take photo, Choose photo | Ta bilde, Velg bilde | Take a photo, Choose a photo |
| Retry after a failure | Try again | Prøv igjen | Retry |
| Leave a gone screen | Go back | Gå tilbake | Go to closet, Go to looks |

### Bokmål name for the Looks tab: Samling

The owner delegated this (owner decision 6). The tab is **Samling**; each item in it is **en look**.

- "Antrekk" is taken. It is the outfit on Today (`dagens antrekk`), used in about forty strings. Two meanings for one word is the confusion the advocate hit (A12-01).
- "Lagret" fails because the tab also holds worn rows that are not saved and planned looks (B9-03).
- "Samling" covers saved, worn and planned alike. It is a place, like "Garderobe", and a tab is a place: Garderobe holds plagg, Samling holds looks. It is short (7 letters, shorter than "Garderobe") and sits beside "I dag" and "Garderobe" without truncating.
- "Looks" as the tab label was the other candidate. It reads as untranslated English in a bokmål tab bar. As a noun for the item, though, "look" is ordinary Norwegian in fashion talk ("dagens look", "en ny look") and is in NAOB, so it stays the item word: "Lagre look", "Ny look", "Med i 3 looker".
- "Fra samlingen" on Today reads naturally and points at the tab by name.

## F01 Start

| Key | English | Bokmål | Replaces |
|---|---|---|---|
| `start.error.title` | Could not open your closet | Kunne ikke åpne garderoben | `closet.openFailed` |
| `common.tryAgain` | Try again | Prøv igjen | `closet.tryAgain`, `common.retry`, `problem.tryAgain`, `colours.tryAgain` |
| `onboarding.progress` | {step} of {total} | {step} av {total} | `onboarding.progress` |
| `onboarding.progressLabel` | Step {step} of {total} | Steg {step} av {total} | new (VoiceOver) |
| `onboarding.next` | Next | Neste | `onboarding.next` |
| `common.skip` | Skip | Hopp over | `onboarding.skip` |
| `onboarding.hijab.title` | Hijab and coverage | Hijab og dekning | `onboarding.hijab.title` |
| `onboarding.hijab.question` | Do you wear a hijab? | Bruker du hijab? | `onboarding.hijab.question` |
| `hijab.always` | Always | Alltid | `onboarding.hijab.always`, `everyday.always` |
| `hijab.sometimes` | Sometimes | Noen ganger | `onboarding.hijab.sometimes` |
| `hijab.notNeeded` | Not needed | Trengs ikke | `onboarding.hijab.no`, `everyday.notNeeded` |
| `coverage.levelLabel` | Coverage | Dekning | `coverage.levelLabel`, `onboarding.coverage.question` |
| `coverage.full` | Full: wrist and ankle | Full: håndledd og ankel | `onboarding.coverage.full` |
| `coverage.moderate` | Moderate: elbow and mid-calf | Moderat: albue og midt på leggen | `onboarding.coverage.moderate` |
| `coverage.own` | My own limit | Egen grense | `onboarding.coverage.own` |
| `onboarding.place.title` | Units and city | Enheter og by | `onboarding.place.title` |
| `onboarding.units.label` | Units | Enheter | new (Segmented label on step 2 and the place answer) |
| `onboarding.units.metric` | cm and °C | cm og °C | `onboarding.units.metric` |
| `onboarding.units.metricLabel` | Centimetres and Celsius | Centimeter og celsius | new (VoiceOver) |
| `onboarding.units.imperial` | ft and °F | fot og °F | `onboarding.units.imperial` |
| `onboarding.units.imperialLabel` | Feet and Fahrenheit | Fot og fahrenheit | new (VoiceOver) |
| `onboarding.city.label` | City | By | `onboarding.city.label` |
| `onboarding.city.find` | Find city | Finn by | `onboarding.city.find` |
| `onboarding.city.found` | Weather for {name} | Vær for {name} | `onboarding.city.found` |
| `onboarding.city.notFound` | City not found | Fant ikke byen | `onboarding.city.notFound` |
| `common.offline` | You are offline | Du er uten nett | `photo.studioOffline` (first half) |
| `onboarding.city.privacy` | Only the city is sent to Apple, for the weather. | Bare byen sendes til Apple, for været. | `onboarding.city.privacy` (kept: privacy) |
| `onboarding.body.title` | Body | Kropp | `onboarding.body.title` |
| `onboarding.height.label` | Height (cm) | Høyde (cm) | `onboarding.height.label` (metric only) |
| `onboarding.height.labelImperial` | Height | Høyde | new (ft and in fields carry the units) |
| `onboarding.height.labelVoice` | Height in centimetres | Høyde i centimeter | new (VoiceOver) |
| `onboarding.height.feet` | ft | fot | `onboarding.height.feet` |
| `onboarding.height.feetLabel` | Feet | Fot | new (VoiceOver) |
| `onboarding.height.inches` | in | tommer | `onboarding.height.inches` |
| `onboarding.height.inchesLabel` | Inches | Tommer | new (VoiceOver) |
| `onboarding.height.invalid` | Enter 120 to 220 cm | Skriv 120 til 220 cm | `onboarding.height.invalid` |
| `onboarding.height.invalidImperial` | Enter 3 ft 11 in to 7 ft 3 in | Skriv 3 fot 11 tommer til 7 fot 3 tommer | new |
| `onboarding.shape.question` | Body shape | Kroppsform | `onboarding.shape.question` |
| `onboarding.taste.title` | Your taste | Din smak | `onboarding.taste.title` |
| `onboarding.fit.question` | Fit | Passform | `onboarding.fit.question` |
| `onboarding.fit.loose` | Loose | Løs | `onboarding.fit.loose` |
| `onboarding.fit.structured` | Structured | Strukturert | `onboarding.fit.structured` |
| `onboarding.depends` | It depends | Det varierer | `onboarding.fit.depends`, `onboarding.colourLean.depends` |
| `onboarding.colourLean.question` | Colours | Farger | `onboarding.colourLean.question` |
| `onboarding.colourLean.bold` | Bold | Sterke | `onboarding.colourLean.bold` |
| `onboarding.colourLean.soft` | Soft | Dempede | `onboarding.colourLean.soft` |
| `onboarding.styleLean.question` | Style | Stil | `onboarding.styleLean.question` |
| `style.both` | Both | Begge | `onboarding.styleLean.both`, `piece.styleBoth`, `style.bottoms.both` |
| `onboarding.colours.title` | Your colours | Dine farger | `onboarding.colours.title`, `colours.title` |
| `colours.selfie` | Take a selfie | Ta en selfie | `onboarding.colours.selfie`, `colours.camera` |
| `onboarding.colours.swatch` | Skin tone | Hudtone | `onboarding.colours.swatch` (the `space.xxl` gap under the selfie Row already separates the two ways) |
| `colours.season` | Season: {season} | Sesong: {season} | `onboarding.colours.saved`, `colours.result` |
| `onboarding.done.title` | You are set | Du er klar | `onboarding.done.title` (reinstated: every step has a title, so the done step matches the others) |
| `closet.addPieces` | Add pieces | Legg til plagg | `onboarding.done.add` |
| `sample.try` | Try the sample closet | Prøv eksempelgarderoben | `onboarding.done.sample`, `today.trySample`, `today.useSample` |
| `colours.camera.privacy` | The selfie stays on this phone. | Selfien blir på telefonen. | `colours.deleted` (kept: privacy) |
| `colours.library` | Choose a recent selfie | Velg en nylig selfie | `colours.library` |
| `colours.cameraFailed` | Could not open the camera | Kunne ikke åpne kameraet | `colours.cameraFailed` (way out: `common.tryAgain`) |
| `common.cameraOff` | Camera access is off | Kameratilgang er av | `colours.cameraOff`, `careLabel.cameraOff`, `problem.camera-off`, `error.cameraOffOne` |
| `common.openSettings` | Open Settings | Åpne Innstillinger | `problem.openSettings` |
| `colours.busy` | Measuring your colours | Måler fargene dine | `colours.busy` |
| `common.light.dark` | Too dark. Move closer to a window. | For mørkt. Gå nærmere et vindu. | `colours.retake.dark`, `advice.dark.title`, `advice.dark.body` |
| `common.light.mixed` | Mixed light. Daylight only, lamps off. | Blandet lys. Bare dagslys, slå av lampene. | `colours.retake.mixed`, `advice.mixed-light.title`, `advice.mixed-light.body` |
| `colours.retake.no-face` | No face found. Hold the phone at eye level. | Fant ikke ansiktet. Hold telefonen i øyehøyde. | `colours.retake.no-face` |
| `colours.retake.failed` | Could not read this photo | Kunne ikke lese bildet | `colours.retake.failed` |
| `colours.hairCovered` | Hair covered | Håret er dekket | new |
| `colours.skin` | Skin | Hud | `colours.skin` |
| `colours.hair` | Hair | Hår | `colours.hair` |
| `colours.eyes` | Eyes | Øyne | `colours.eyes` |
| `colours.undertone` | Undertone | Undertone | `colours.undertone` |
| `colours.depth` | Depth | Dybde | `colours.depth` |
| `colours.contrast` | Contrast | Kontrast | `colours.contrast` |
| `colours.best` | Colours that suit you | Farger som kler deg | `colours.best` |
| `colours.adjust` | Adjust | Juster | `colours.adjust` (reinstated as the closed Expander title over Hair covered, Undertone, Depth and Contrast on the selfie result) |
| `colours.save` | Save colours | Lagre fargene | `colours.save` |
| `colours.photo` | Your selfie with the measuring points | Selfien din med målepunktene | `colours.photo` (VoiceOver) |
| `common.takePhoto` | Take photo | Ta bilde | `selfie.take`, `scan.shutter`, `careLabel.takePhoto`, `common.takePhoto` |
| `selfie.guide.*` | unchanged | unchanged | `selfie.guide.*` |

`selfie.guide.still` in NB becomes "Hold stille", one phrase with scan (see Unchanged sets).

The `colours.best` palette is one VoiceOver element, `colours.best` and the `colour.*` names joined ("Colours that suit you: rust, olive, ..."); the dots are hidden. Each sample point on `colours.photo` (44 pt) has `colours.skin`, `colours.hair` or `colours.eyes` as its label and the measured `colour.*` name as its value.

Cut: `onboarding.intro`, `onboarding.body.why`, `onboarding.colours.why`, `onboarding.done.text`, `colours.tips`, `colours.hijab` (replaced by the Hair covered toggle), `colours.measured`, `colours.unknown`, `closet.openFailedBody`, `closet.opening`, `closet.openingBody` (the shimmer is the loading state; VoiceOver uses `common.loading`).

## F02 Add pieces

| Key | English | Bokmål | Replaces |
|---|---|---|---|
| `title.addPieces` | Add pieces | Legg til plagg | `title.addPieces` |
| `capture.tips` | Tips | Tips | `capture.tips`, `capture.photoTip` (header icon label) |
| `common.select` | Select | Velg | `sets.select` |
| `capture.tip1Title` | Daylight shows true colour | Dagslys gir riktig farge | `capture.tip1Title` |
| `capture.tip1Body` | Near a window, lamps off | Ved et vindu, lampene av | `capture.tip1Body` |
| `capture.tip2Title` | One piece, plain background | Ett plagg, rolig bakgrunn | `capture.tip2Title` |
| `capture.tip2Body` | A pair of shoes is one piece | Et par sko er ett plagg | `capture.tip2Body` |
| `capture.tip3Title` | Every edge in view | Alle kanter med | `capture.tip3Title` |
| `capture.gotIt` | Got it | OK | `capture.nextTip` |
| `capture.takePhotos` | Take photos | Ta bilder | `capture.startAdding` |
| `capture.choosePhotos` | Choose photos | Velg bilder | `capture.choosePhotos`, `problem.choosePhotosInstead` |
| `capture.scan` | Scan | Skann | new |
| `capture.byHand` | Add by hand | Legg til manuelt | `capture.addWithout` |
| `capture.stateQueued` | Waiting | Venter | `capture.stateQueued` |
| `capture.statePreparing` | Preparing | Klargjøres | `capture.statePreparing` |
| `capture.stateReady` | Ready | Klar | `capture.stateReady` |
| `capture.stateConfirm` | Confirm | Bekreft | `capture.stateReview` |
| `capture.stateFailed` | Could not finish | Ble ikke ferdig | `capture.stateFailed` |
| `capture.retake` | Retake | Ta på nytt | `capture.retake` |
| `common.remove` | Remove | Fjern | `common.remove` |
| `capture.readyOne` | 1 ready | 1 klar | `capture.readyCount` |
| `capture.readyMany` | {count} ready | {count} klare | `capture.readyCount` |
| `capture.failedOne` | 1 could not finish | 1 ble ikke ferdig | `capture.failedCount` |
| `capture.failedMany` | {count} could not finish | {count} ble ikke ferdig | `capture.failedCount` |
| `capture.addOne` | Add 1 piece | Legg til 1 plagg | `capture.addReadyOne` |
| `capture.addMany` | Add {count} pieces | Legg til {count} plagg | `capture.addReadyMany`, `capture.addReady` |
| `capture.confirmOne` | Confirm 1 piece | Bekreft 1 plagg | new |
| `capture.confirmMany` | Confirm {count} pieces | Bekreft {count} plagg | new |
| `capture.found` | {count} pieces in one photo | {count} plagg i ett bilde | `capture.found` |
| `capture.foundOne` | 1 piece in one photo | 1 plagg i ett bilde | `capture.foundOne` |
| `common.open` | Open | Åpne | `capture.review` |
| `capture.jobLabel` | {name}, {colour}, {state} | {name}, {colour}, {state} | `capture.jobLabel` (VoiceOver; `{colour}` is the `colour.*` name, left out when unknown, as in `tile.label`) |
| `capture.photoNumber` | Photo {number} | Bilde {number} | new (`{name}` in `capture.jobLabel` before a tile has a name) |
| `capture.colourLabel` | Colour: {colour} | Farge: {colour} | new (the colour row under the tile photo) |
| `common.editColourHint` | Opens colour choices | Åpner fargevalg | new (VoiceOver hint on the capture colour row) |
| `problem.low-space` | iPhone is almost full. Your pieces are kept. | iPhonen er nesten full. Plaggene er tatt vare på. | `problem.low-space`, `failure.storage` |
| `common.photoOpenFailed` | Could not open this photo | Kunne ikke åpne bildet | `problem.unavailable`, `error.photoOpen`, `cutout.failed` |
| `problem.failed` | Could not add this photo | Kunne ikke legge til bildet | `problem.failed`, `failure.processing`, `failure.unreadable` |
| `confirm.title` | New piece | Nytt plagg | `capture.newPiece` |
| `confirm.titleStep` | New piece, {n} of {total} | Nytt plagg, {n} av {total} | new (VoiceOver label on the New piece header when several pieces wait; nothing visible) |
| `fact.photo` | Photo | Bilde | new (fact chip key on New piece, and the VoiceOver label of its photo variant radiogroup) |
| `fact.colour` | Colour | Farge | `fact.colour` |
| `capture.askCategory` | {first} or {second}? | {first} eller {second}? | `capture.askCategory` |
| `capture.askKind` | {first} or {second}? | {first} eller {second}? | `capture.askKind` |
| `capture.askStyle` | Desi or Western? | Desi eller vestlig? | `capture.askStyle` |
| `capture.somethingElse` | Something else | Noe annet | `capture.somethingElse` |
| `fact.suggested` | Suggested: {value} | Foreslått: {value} | `fact.suggested` |
| `common.looksRight` | Looks right | Ser riktig ut | `capture.looksRight`, `fact.looksRight` |
| `piece.name` | Name | Navn | `piece.name` |
| `piece.category` | Category | Kategori | `piece.category` |
| `piece.kind` | Garment | Plaggtype | `piece.kind` |
| `piece.style` | Style | Stil | `piece.style` |
| `pieceWeather.warmth` | Warmth | Varme | `pieceWeather.warmth` |
| `photo.enhanced` | Enhanced | Forbedret | `photo.enhanced` |
| `photo.plain` | Cut-out | Utklipp | `photo.plain` (the cut-out without colour boost) |
| `photo.original` | Original | Original | `capture.originalPhoto`, `capture.keepOriginal` |
| `photo.clean` | Clean background | Ren bakgrunn | `photo.studio` |
| `photo.cleanMaking` | Cleaning the background | Renser bakgrunnen | `photo.studioMaking` (VoiceOver) |
| `photo.cleanDone` | Background cleaned | Bakgrunnen er renset | new (announced) |
| `photo.cleanFailed` | Could not clean the background | Kunne ikke rense bakgrunnen | `photo.studioFailed` |
| `photo.cleanLimit` | Daily limit reached. Try tomorrow. | Dagens grense er nådd. Prøv i morgen. | `photo.studioLimit` |
| `photo.cleanNote` | Clean background sends this photo to Cloudflare. | Ren bakgrunn sender bildet til Cloudflare. | `photo.studioNote` (kept: privacy, shown once) |
| `cutout.adjust` | Adjust cut-out | Juster utklipp | `cutout.adjust` |
| `cutout.byHand` | Cut out by hand | Klipp ut selv | `cutout.byHand` |
| `capture.noCutout` | Could not cut out this piece | Kunne ikke klippe ut plagget | `capture.noCutout` |
| `capture.several` | May show more than one piece | Kan vise mer enn ett plagg | `capture.several` |
| `capture.partial` | Partly visible. Check length and sleeves. | Delvis synlig. Sjekk lengde og ermer. | `capture.partial`, `capture.partialCheck` (kept: needed to act) |
| `capture.partialShort` | Partly visible | Delvis synlig | new (row meta on Pieces in this photo and Scanned pieces; the confirm keeps `capture.partial`) |
| `duplicate.title` | Already in your closet? | Har du denne fra før? | `duplicate.title` |
| `duplicate.named` | Looks like {name} | Ligner på {name} | `duplicate.named` |
| `duplicate.same` | Same piece | Samme plagg | `duplicate.same` |
| `duplicate.different` | Different piece | Et annet plagg | `duplicate.different` |
| `advice.merged` | Background blends in. Use a plain, contrasting one. | Bakgrunnen glir inn. Velg en rolig bakgrunn som skiller seg ut. | `advice.merged.title`, `advice.merged.body` |
| `advice.clipped` | Part is cut off. Step back a little. | En del er kuttet. Gå litt bakover. | `advice.clipped.title`, `advice.clipped.body` |
| `advice.blur` | Blurry. Hold steady and tap to focus. | Uskarpt. Hold stødig og trykk for å fokusere. | `advice.blur.title`, `advice.blur.body` |
| `advice.useAnyway` | Continue anyway | Fortsett likevel | `advice.useAnyway` |
| `careLabel.title` | Care label | Vaskelapp | `careLabel.title` |
| `common.add` | Add | Legg til | `careLabel.add` |
| `common.edit` | Edit | Endre | `careLabel.change`, `careLabel.viewOrEdit`, `piece.edit`, `profile.change` |
| `careLabel.addLabel` | Add care label | Legg til vaskelapp | new (VoiceOver label on the Care label row's Add) |
| `careLabel.editLabel` | Edit care label | Endre vaskelapp | new (VoiceOver label on the Care label row's Edit) |
| `capture.remove` | Remove photo | Fjern bildet | `capture.remove` |
| `capture.gone.title` | This photo is no longer waiting | Dette bildet venter ikke lenger | `capture.gone.title` |
| `common.goBack` | Go back | Gå tilbake | `common.goBack` |
| `capture.group.title` | Pieces found | Plagg funnet | `capture.group.title` |
| `closet.linkSet` | Link as a set | Koble som sett | new on this screen |
| `capture.adjust` | Adjust crop | Juster utsnitt | `capture.adjust` |
| `capture.addPiece` | Draw a box | Tegn en ramme | `capture.addPiece` (places a centred box; tap the photo outside the box to move it there, drag it, or use Smaller, Larger and the move actions) |
| `capture.boxMove` | Move {direction} | Flytt {direction} | new (VoiceOver actions on the box) |
| `direction.up` | up | opp | new |
| `direction.down` | down | ned | new |
| `direction.left` | left | til venstre | new |
| `direction.right` | right | til høyre | new |
| `capture.smaller` | Smaller | Mindre | `capture.smaller` |
| `capture.larger` | Larger | Større | `capture.larger` |
| `capture.boxValue` | {width} by {height} percent, {x} from left, {y} from top | {width} ganger {height} prosent, {x} fra venstre, {y} fra toppen | new (VoiceOver value on the box's adjustable wrapper) |
| `capture.useBox` | Use this box | Velg denne rammen | `capture.useBox` |
| `common.cancel` | Cancel | Avbryt | `common.cancel`, `capture.cancel`, `style.cancel`, `onboarding.cancel` |
| `common.done` | Done | Ferdig | `common.done`, `capture.done`, `careLabel.done`, `build.swapDone` |
| `capture.group.gone` | These pieces are no longer waiting | Disse plaggene venter ikke lenger | `capture.group.gone` |
| `capture.box` | Box around the piece | Ramme rundt plagget | `capture.box` (VoiceOver) |
| `capture.photo` | Photo with the pieces found | Bildet med plaggene som ble funnet | `capture.photo` (VoiceOver) |
| `careLabel.intro` | Photograph the label flat, in good light. | Ta bilde av lappen flatt, i godt lys. | `careLabel.intro` (kept: needed to act) |
| `careLabel.takeAnother` | Take another photo | Ta et nytt bilde | `careLabel.takeAnother` |
| `common.choosePhoto` | Choose photo | Velg bilde | `careLabel.choosePhoto`, `editor.choosePhoto`, `problem.chooseInstead` |
| `careLabel.reading` | Reading the label | Leser lappen | `careLabel.reading` |
| `careLabel.nothingFound` | Could not read anything. Fill it in or take another photo. | Kunne ikke lese noe. Fyll inn selv eller ta et nytt bilde. | `careLabel.nothingFound` |
| `careLabel.unreadable` | Could not read this label. Try a sharper photo. | Kunne ikke lese lappen. Prøv et skarpere bilde. | `careLabel.unreadable` |
| `careLabel.madeOf` | Made of | Materiale | `careLabel.madeOf` |
| `careLabel.fibre` | Fibre {number} | Fiber {number} | `careLabel.fibre` |
| `careLabel.percent` | Percent, fibre {number} | Prosent, fiber {number} | `careLabel.percent` |
| `careLabel.fibreLabel` | Fibre | Fiber | new (visible Field label; the numbered key is the VoiceOver label) |
| `careLabel.percentLabel` | Percent | Prosent | new (visible Field label; the numbered key is the VoiceOver label) |
| `careLabel.removeFibre` | Remove fibre {number} | Fjern fiber {number} | `careLabel.removeFibre` |
| `careLabel.addFibre` | Add a fibre | Legg til fiber | `careLabel.addFibre` |
| `careLabel.size` | Size | Størrelse | `careLabel.size` |
| `careLabel.brand` | Brand | Merke | `careLabel.brand` |
| `careLabel.origin` | Made in | Produsert i | `careLabel.origin` |
| `careLabel.save` | Save care label | Lagre vaskelapp | `careLabel.save` |
| `careLabel.remove` | Remove care label | Fjern vaskelapp | `careLabel.remove` |
| `careLabel.removeTitle` | Remove the care label? | Fjerne vaskelappen? | `careLabel.removeTitle` |
| `careLabel.lineSize` | Size {size} | Størrelse {size} | `careLabel.lineSize` |
| `careLabel.lineBrand` | {brand} | {brand} | `careLabel.lineBrand` |
| `careLabel.lineOrigin` | Made in {origin} | Produsert i {origin} | `careLabel.lineOrigin` |
| `careLabel.photo` | Care label photo | Bilde av vaskelappen | `careLabel.photo` (VoiceOver) |
| `cutout.title` | Cut-out | Utklipp | new |
| `cutout.hold` | Hold on a piece to select it | Hold på et plagg for å velge det | `cutout.hold` (kept: needed to act; visible only, hides after first use; never a VoiceOver hint) |
| `cutout.selectPiece` | Select the piece | Velg plagget | new (VoiceOver action on the canvas; selects the most prominent detected piece) |
| `cutout.selectPieceN` | Select piece {n} | Velg plagg {n} | new (VoiceOver actions, one per piece, in place of `cutout.selectPiece` when several are detected) |
| `cutout.zoomIn` | Zoom in | Zoom inn | new (zoom button label and VoiceOver action on the canvas) |
| `cutout.fit` | Fit to screen | Tilpass skjermen | new (zoom button label and VoiceOver action on the canvas) |
| `cutout.selected` | Piece selected | Plagget er valgt | new (announced) |
| `cutout.noneFound` | No piece found | Fant ikke noe plagg | new (announced) |
| `cutout.restore` | Restore | Gjenopprett | `cutout.restore` |
| `cutout.erase` | Erase | Visk ut | `cutout.erase` |
| `cutout.brush` | Brush | Pensel | `cutout.brush` |
| `cutout.small` | Small | Liten | `cutout.small` |
| `cutout.medium` | Medium | Middels | `cutout.medium` |
| `cutout.large` | Large | Stor | `cutout.large` |
| `common.undo` | Undo | Angre | `cutout.undo`, `outfit.undo` |
| `cutout.reset` | Reset | Tilbakestill | `cutout.reset` |
| `manual.title` | Add by hand | Legg til manuelt | `title.addPieces` on `/piece/new` |
| `editor.addToCloset` | Add to closet | Legg i garderoben | `editor.addToCloset` |
| `manual.missing` | Add a photo, name, category and garment | Legg til bilde, navn, kategori og plaggtype | `closet.pieceInvalid` (kept: needed to act) |
| `piece.kindRequired` | Choose a garment | Velg plaggtype | `piece.kindRequired` |
| `editor.photoPreview` | Piece photo | Bilde av plagget | `editor.photoPreview` (VoiceOver) |
| `editor.nameHint` | Mauve chiffon hijab | Lilla chiffonhijab | `editor.nameHint` (placeholder; no longer used by F02 Add by hand) |

The colour on a Ready capture tile sits in its own 44 pt row under the name (swatch plus `capture.colourLabel`, "Farge: salvie"; the name stays on the label line above), outside the photo's press area, and opens the colour chips (hint `common.editColourHint`). A Confirm tile has no colour row; its colour is set on New piece.

Each capture tile is one VoiceOver element labelled `capture.jobLabel`. Activating it opens the tile (`common.open`); `capture.retake` and `common.remove` are its `accessibilityActions`, plus `common.editColour` on a Ready tile and `common.tryAgain` on a failed one, so the rotor never lists a bare "Retake" or "Remove". Visibly a tile shows at most one action: a failed tile shows `capture.stateFailed` and `common.tryAgain` in its own 44 pt row under the photo. Retake and Remove photo for a failed tile are on New piece, which the tile opens (F02 S1).

In Pieces in this photo, each row has a checkbox with no visible text. Its VoiceOver label is `{number}, {name}` ("1, Sage kameez") when the photo shows numbered outlines, else the piece name, with `accessibilityState.checked`. Checked means the piece is added. `capture.drop` and `capture.keep` are cut.

The canvas in Cut-out has no VoiceOver hint; iOS already says "Actions available".

Cut: `capture.fix` (a Confirm tile opens with the tile itself; a failed tile shows Try again and opens New piece), `capture.tipStep` (tips are not a pager), `capture.confirmCountOne`, `capture.confirmCountMany`, `capture.workingOne`, `capture.workingMany` (the tiles show their own state; no status line), `capture.drop`, `capture.keep`, `colours.cameraAgain` (uses `common.tryAgain`), `capture.tip3Body` (the title says it), `capture.drawHint` (the button says it), `capture.scanValue` (the scan screen's first status says it), `capture.intro`, `capture.group.intro`, `capture.othersIgnored`, `capture.usePrepared`, `capture.gone.description`, `capture.group.goneHint`, `duplicate.unnamed` (the matched photo shows), `editor.detailsHint`, `editor.startTitle`, `editor.startBody`, `editor.savedNote`, `careLabel.offerTitle`, `careLabel.offerBody`, `careLabel.skip`, `careLabel.pieceHint`, `careLabel.pieceEmpty`, `careLabel.found`, `tips.window`, `tips.sheet`, `tips.frame` (tip images get the tip title as their VoiceOver label), `piece.kindOptional` (shown as "Garment" with no value), `piece.styleHint`.

## F03 Scan

| Key | English | Bokmål | Replaces |
|---|---|---|---|
| `scan.title` | Scan | Skann | `scan.title` |
| `scan.starting` | Starting the camera | Starter kameraet | `scan.starting` (VoiceOver while shimmering) |
| `scan.status.find` | Step into view | Still deg i bildet | `scan.status.find` |
| `scan.status.show` | Hold up a piece | Hold opp et plagg | `scan.status.show` |
| `scan.status.hold` | Hold still | Hold stille | `scan.status.hold` |
| `scan.status.taken` | Taken | Tatt | `scan.status.taken` |
| `scan.status.ready` | Tap to take it | Trykk for å ta bildet | `scan.status.ready` (visible only) |
| `scan.status.readyVoice` | Ready | Klar | new (announced in place of `scan.status.ready`) |
| `scan.auto` | Auto | Auto | `scan.auto` |
| `scan.manual` | Manual | Manuell | `scan.manual` |
| `common.takePhoto` | Take photo | Ta bilde | `scan.shutter` |
| `scan.switch` | Switch camera | Bytt kamera | `scan.switch` |
| `common.done` | Done | Ferdig | `capture.done` |
| `scan.unavailable` | Camera not available | Kameraet er ikke tilgjengelig | `scan.unavailable` |
| `scan.captureFailed` | Missed. Hold still. | Bommet. Hold stille. | new |
| `scan.reviewTitle` | cut | cut | `scan.reviewTitle` (photo and scan share one review screen, `capture.group.title`) |
| `scan.found` | {count} from a scan | {count} fra en skanning | `scan.found` |
| `scan.foundOne` | 1 from a scan | 1 fra en skanning | `scan.foundOne` |
| `scan.speed` | {fps} fps · {parse} ms | {fps} fps · {parse} ms | `scan.speed` (release builds too, owner decision 3; full opacity `onMedia` on its own `scrim` 0.70 capsule; outside the guide pill live region, never announced) |
| `scan.speedLabel` | {fps} frames per second, {parse} milliseconds | {fps} bilder per sekund, {parse} millisekunder | new (VoiceOver label for `scan.speed`) |
| `scan.traySlot` | Scanned piece {number} | Skannet plagg {number} | new (VoiceOver) |
| `scan.pieceAdded` | {name} added | {name} lagt til | new (announced when a sticker lands in the tray) |
| `scan.speedShow` | Show scan speed | Vis skannefart | new (VoiceOver action on the guide pill; the long press shows the readout) |
| `scan.speedHide` | Hide scan speed | Skjul skannefart | new (VoiceOver action on the guide pill while the readout shows) |
| `scan.trayLabel` | {count} scanned: {names} | {count} skannet: {names} | new (VoiceOver label for the whole tray, names comma separated) |

`scan.status.taken` stays up for at least the `linger` token, Reduce Motion included, and is announced.

The denied state reuses `common.cameraOff`, `common.openSettings`, `capture.choosePhotos`. `scan.unavailable` breaks at til|gjengelig at render time. Region names (`region.*`) are unchanged.

Cut: `scan.again` (detection already restarts on Switch camera and on return from the background).

Scanned pieces reuses `closet.linkSet`, `capture.partialShort`, `region.*` and `confirm.title` (a row with no piece name or region name), `capture.group.gone`, `common.goBack`, `common.done`, `common.error.save` and the discard prompt keys. Its rows follow the Pieces in this photo checkbox rule in F02.

## F04 Closet

| Key | English | Bokmål | Replaces |
|---|---|---|---|
| `nav.closet` | Closet | Garderobe | `nav.closet`, `title.yourCloset` |
| `common.pieceCountOne` | 1 piece | 1 plagg | `common.pieceCountOne`, `closet.introOne` |
| `common.pieceCountMany` | {count} pieces | {count} plagg | `common.pieceCountMany`, `closet.introMany` |
| `closet.search` | Name or colour | Navn eller farge | `closet.find`, `closet.findHint` (placeholder) |
| `closet.all` | All | Alle | `closet.all`, `filters.all` |
| `closet.notWornLately` | Not worn lately | Ikke brukt nylig | new |
| `closet.more` | More | Mer | `closet.filters` |
| `closet.moreValue` | More: {value} | Mer: {value} | new (More chip label, one More filter on) |
| `closet.moreCount` | More: {count} | Mer: {count} | new (More chip label, two or more More filters on; VoiceOver always reads `closet.moreValue` with the values joined) |
| `closet.worn` | Worn | Brukt | new (More row label) |
| `closet.neverWorn` | Never worn | Aldri brukt | new |
| `closet.putAway` | Put away | Lagt bort | `archive.filter`, `archive.tag` |
| `closet.unavailable` | Unavailable | Utilgjengelig | `closet.away` |
| `adjust.occasion` | Occasion | Anledning | `adjust.occasion` |
| `closet.clearFilters` | Clear filters | Fjern filtre | `closet.clearFilters` |
| `closet.noneFoundTitle` | No pieces found | Fant ingen plagg | `closet.noneFoundTitle` |
| `closet.firstTitle` | Your first piece | Ditt første plagg | `closet.firstTitle` |
| `closet.addPieces` | Add pieces | Legg til plagg | `closet.addFirst` |
| `closet.sampleCountOne` | 1 sample piece | 1 eksempelplagg | `closet.sample` (Section title over sample tiles) |
| `closet.sampleCountMany` | {count} sample pieces | {count} eksempelplagg | `closet.sample` (Section title over sample tiles) |
| `tile.label` | {name}, {colour}, {marks} | {name}, {colour}, {marks} | `tile.selected` (VoiceOver) |
| `common.selectedOne` | 1 selected | 1 valgt | new |
| `common.selectedMany` | {count} selected | {count} valgt | new |
| `common.notSelected` | Not selected | Ikke valgt | new (VoiceOver value on an unselected tile in Closet select) |
| `common.actions` | Actions | Handlinger | new (VoiceOver label on the select header menu, `ellipsis.circle`) |
| `closet.linkSet` | Link as a set | Koble som sett | `sets.link` |
| `closet.linked` | Linked | Koblet | `sets.linked` |
| `looks.new` | New look | Ny look | `title.buildLook` (select footer secondary and the added bar) |
| `pieces.startWithThese` | Start with these | Start med disse | new on this screen (select footer and the added bar) |
| `looks.markWorn` | Mark as worn | Merk som brukt | new on this screen (select header menu, submenu `adjust.today`, `looks.yesterday` as in F09; results `outfit.worn`, `looks.wornYesterday`) |
| `closet.putAwayAction` | Put away | Legg bort | `archive.action` |
| `closet.backInCloset` | Back in the closet | Tilbake i garderoben | `archive.restore` |
| `result.backInCloset` | Put back | Lagt tilbake | new (ResultBar text after Back in the closet, announced; differs from the button so VoiceOver confirms the change) |
| `closet.addedOne` | 1 added | 1 lagt til | new |
| `closet.addedMany` | {count} added | {count} lagt til | new |
| `closet.missingRoles` | Add {roles} to style from your clothes | Legg til {roles} for antrekk fra dine klær | new (kept: needed to act) |
| `closet.preparingOne` | 1 preparing | 1 klargjøres | new |
| `closet.preparingMany` | {count} preparing | {count} klargjøres | new |
| `closet.readyOne` | 1 ready | 1 klar | new |
| `closet.readyMany` | {count} ready | {count} klare | new |
| `error.setTooSmall` | Choose at least two pieces | Velg minst to plagg | `error.setTooSmall` |

`tile.label` is the one VoiceOver label for every tile. `{colour}` is the piece's colour name (`colour.*`), left out when unknown. `{marks}` joins, with commas, the marks the tile shows: `outfit.kept`, `change.inPlan`, and the `piece.away.*` value (or `closet.unavailable`) of an unavailable piece, which is also the tile's visible meta. With no marks it is just `{name}, {colour}`. Closet tiles have no New or Sample mark. A selected tile carries `accessibilityState.selected`. In Closet select an unselected tile carries `accessibilityValue` `common.notSelected`, because iOS reads nothing for selected false. Strip-only variant, hijab tiles in the Change strip: `{name}, {colour}, {reason}, {marks}`, where `{colour}` is left out when the name already holds it and `{reason}` is the full `change.reason.picksUp` or `reason.*` text: "Mauve chiffon hijab, Picks up the plum in the tunic, In Friday's plan". Every strip tile's visible label is the name, as in Closet.

`closet.putAway` (filter, "Put away") and `closet.putAwayAction` (action, "Put away") share EN text. Accepted: the filter lives only under More, the action only in the select header menu.

`{roles}` in `closet.missingRoles` joins with `word.and`: EN "tops, bottoms and shoes", NB "overdeler, underdeler og sko". New role words for this line: `role.mainList` tops / overdeler, `role.bottomList` bottoms / underdeler, `role.shoesList` shoes / sko, `role.hijabList` a hijab / en hijab.

Cut: `closet.introEmpty`, `closet.samplesIncluded`, `closet.savedOnDevice`, `closet.firstBody`, `closet.noMatch`, `closet.categories`, `sets.hint`, `common.noPiecesInCategory` (empty categories are not offered), `archive.title`, `archive.help`.

## F05 Piece

| Key | English | Bokmål | Replaces |
|---|---|---|---|
| `common.edit` | Edit | Endre | `piece.edit` |
| `piece.fact.confirmed` | {label}: {value}, confirmed | {label}: {value}, bekreftet | new (VoiceOver on a confirmed colour chip) |
| `piece.facts.title` | Details | Detaljer | `piece.facts.title`, `editor.details` |
| `piece.fact.known` | {label}: {value} | {label}: {value} | `piece.fact.known` |
| `piece.fact.suggested` | {label}: {value}, suggested | {label}: {value}, foreslått | `piece.fact.guess`, `piece.fact.guessFixed` (VoiceOver) |
| `pieceWeather.light` | Light | Lett | `pieceWeather.light` |
| `pieceWeather.medium` | Medium | Middels | `pieceWeather.medium` |
| `pieceWeather.warm` | Warm | Varm | `pieceWeather.warm` |
| `pieceWeather.rain` | Rain | Regn | new (fact chip key) |
| `pieceWeather.snow` | Snow | Snø | new (fact chip key) |
| `pieceWeather.fine` | Fine | Greit | `pieceWeather.rainYes`, `pieceWeather.snowYes` |
| `pieceWeather.avoid` | Avoid | Unngå | `pieceWeather.rainNo`, `pieceWeather.snowNo` |
| `piece.availability` | Availability | Tilgjengelighet | `piece.away.title` |
| `closet.available` | Available | Tilgjengelig | `piece.away.back` |
| `piece.away.wash` | In the wash | Til vask | `piece.away.wash` |
| `piece.away.lent` | Lent out | Lånt bort | `piece.away.lent` |
| `piece.away.repair` | Needs repair | Til reparasjon | `piece.away.repair` |
| `piece.wornMany` | Worn {count} times, last {date} | Brukt {count} ganger, sist {date} | new |
| `piece.wornOnce` | Worn once, {date} | Brukt én gang, {date} | new |
| `closet.neverWorn` | Never worn | Aldri brukt | new |
| `piece.usedIn.one` | In 1 look | Med i 1 look | `piece.usedIn.one` |
| `piece.usedIn.other` | In {count} looks | Med i {count} looker | `piece.usedIn.other` |
| `sets.partOf` | Part of a set | Del av et sett | `sets.partOf` |
| `sets.remove` | Remove from set | Fjern fra settet | `sets.remove` |
| `sets.removed` | Removed from set | Fjernet fra settet | new (ResultBar text on edit piece, applied on Save) |
| `careLabel.title` | Care label | Vaskelapp | `careLabel.title` |
| `careLabel.fibreItem` | {percent}% {fibre} | {percent} % {fibre} | new (piece detail care label meta, joined with `Intl.ListFormat` unit narrow) |
| `piece.startWith` | Start with this piece | Start med dette plagget | `piece.styleThis` |
| `piece.planWith` | Plan a day | Planlegg en dag | new |
| `piece.addToLook` | Add to a look | Legg i en look | new |
| `closet.putAwayAction` | Put away | Legg bort | `archive.action` |
| `closet.backInCloset` | Back in the closet | Tilbake i garderoben | `archive.restore` |
| `closet.sample` | Sample | Eksempel | `editor.sampleNote` |
| `piece.edit.title` | Edit piece | Endre plagget | `piece.edit.title` |
| `editor.changePhoto` | Change photo | Bytt bilde | `editor.changePhoto` |
| `common.saveChanges` | Save changes | Lagre endringer | `common.saveChanges` |
| `editor.remove` | Remove piece | Fjern plagget | `editor.remove` |
| `editor.removeTitle` | Remove this piece? | Fjerne plagget? | `editor.removeTitle` |
| `editor.removeUsedOne` | It is in 1 look. | Det er med i 1 look. | `editor.removeUsedOne` (kept: needed to act) |
| `editor.removeUsedMany` | It is in {count} looks. | Det er med i {count} looker. | `editor.removeUsedMany` (kept: needed to act) |
| `piece.missing.title` | This piece is no longer here | Dette plagget er ikke her lenger | `piece.missing.title` |
| `attribute.*`, `value.*` | unchanged | unchanged | `attribute.*`, `value.*` |

Cut: `piece.title` (the piece name is the title), `piece.facts.hint`, `piece.away.hint`, `piece.away.status` (the selected chip is the status), `pieceWeather.help`, `pieceWeather.helpSuggested`, `piece.missing.description`, `piece.missing.action` (replaced by `common.goBack`), `editor.removeBody`, `piece.styleFixed` (the style chip shows the fixed value, disabled), `sets.linkFailed`, `sets.removeFailed`, `piece.error.save`, `piece.styleError` (all errors use `common.error.save`), `piece.facts.none` (the availability chip is always there), `common.notNow`, `question.length`, `question.sleeve`, `source.*` (fact Expanders have no question, source line or Not now), `pieceWeather.title`, `pieceWeather.suggested`, `pieceWeather.rainYes`, `pieceWeather.rainNo`, `pieceWeather.snowYes`, `pieceWeather.snowNo` (weather traits are fact chips), `piece.colourConfirmed` (now `piece.fact.confirmed`), `piece.usedIn.none` (no looks shows only `piece.addToLook`).

## F06 Today

| Key | English | Bokmål | Replaces |
|---|---|---|---|
| `nav.today` | Today | I dag | `nav.today` |
| `nav.profile` | Profile | Profil | `nav.profile` (header icon label) |
| `today.firstRun.style` | Set your style | Velg stilen din | `today.setEveryday` |
| `today.firstRun.styleHint` | Needed before your first outfit | Trengs før det første antrekket | new (VoiceOver hint on `today.firstRun.style`) |
| `sample.try` | Try the sample closet | Prøv eksempelgarderoben | `today.trySample`, `today.useSample` |
| `closet.sample` | Sample | Eksempel | `today.sampleOnly` (chip in the context row) |
| `weather.chip` | {city} {low} to {high}° | {city} {low} til {high}° | `forecast.label` |
| `weather.chipRain` | {city} {low} to {high}°, rain | {city} {low} til {high}°, regn | `forecast.label` + `weather.rainSuffix` |
| `weather.chipSnow` | {city} {low} to {high}°, snow | {city} {low} til {high}°, snø | `forecast.label` + `weather.snowSuffix` |
| `weather.chipLabel` | {adjust}, {weather} | {adjust}, {weather} | new (VoiceOver on the chip: `adjust.weather` then the chip text, "Weather, Oslo 4 to 9°"; {weather} uses `weather.spoken`) |
| `weather.spoken` | {city} {low} to {high} degrees | {city} {low} til {high} grader | new (VoiceOver only; a temperature below zero is the word "minus" and the number, "minus 6", while the chip shows U+2212 `−6`) |
| `weather.setByYou` | {weather}, set by you | {weather}, valgt av deg | `today.enteredByYou`, `forecast.manual` (VoiceOver only; visibly the missing Apple Weather mark says it) |
| `weather.unavailable` | Weather unavailable | Ingen værmelding | `forecast.unavailable` |
| `weather.unset` | Weather | Vær | `weather.unset` |
| `occasion.chipLabel` | {adjust}, {occasion} | {adjust}, {occasion} | new (VoiceOver on the chip: `adjust.occasion` then the chip text, "Occasion, Work") |
| `style.chipLabel` | {adjust}, {style} | {adjust}, {style} | new (VoiceOver: "Style, Western") |
| `closet.sampleChipLabel` | Closet, {value} | Garderobe, {value} | new (VoiceOver: "Closet, Sample") |
| `forecast.mark` | Apple Weather | Apple Weather | `forecast.mark` |
| `forecast.markLabel` | Apple Weather, data sources | Apple Weather, datakilder | `forecast.sources` (VoiceOver on the Apple Weather link, the last item in Today's scroll) |
| `weather.cold` | Cold | Kaldt | `weather.cold` |
| `weather.mild` | Mild | Mildt | `weather.mild` |
| `weather.warm` | Warm | Varmt | `weather.warm` |
| `outfit.wear` | Wear this | Bruk i dag | `outfit.wear` |
| `outfit.worn` | Worn today | Brukt i dag | `outfit.worn` |
| `today.another` | Another | Et annet | new |
| `common.saveLook` | Save look | Lagre look | `common.saveLook` |
| `today.openLook` | Open look | Åpne look | new (Save look turns into this in place; no toast) |
| `outfit.notForMe` | Not for me | Passer ikke | `outfit.notForMe` (NB 96 pt fits the 98 pt label width of a third on a 375 pt phone) |
| `common.undo` | Undo | Angre | `today.undo`, `outfit.undo` |
| `feedback.too-formal` | Too formal | For pent | `feedback.too-formal` |
| `feedback.too-plain` | Too plain | For enkelt | `feedback.too-plain` |
| `feedback.too-warm` | Too hot | For varmt | `feedback.too-warm` |
| `feedback.too-cold` | Too cold | For kaldt | new |
| `feedback.hijab-mismatch` | Hijab does not match | Hijaben passer ikke | new |
| `feedback.not-my-style` | Not my style | Ikke min stil | `feedback.not-my-style` |
| `outfit.thanks` | Noted for next time | Notert til neste gang | `outfit.thanks` (in Today's Undo slot with Undo after a reason, never a toast) |
| `outfit.chipHint` | Shows another outfit | Viser et annet antrekk | `outfit.chipHint` (VoiceOver hint; the label is the chip text) |
| `today.lastCombination` | Back to the first outfit | Tilbake til det første antrekket | `today.lastCombination` |
| `today.onlyCombination` | The only outfit for these choices | Det eneste antrekket med disse valgene | `today.onlyCombination` |
| `today.banner.occasion` | For {occasion} | Til {occasion} | `today.styledFor`, `today.justForNow` |
| `today.banner.started` | Started with {names} | Startet med {names} | new (one or two names) |
| `today.banner.startedMore` | Started with {names} and {count} more | Startet med {names} og {count} til | new (first two names, then the count) |
| `today.banner.planning` | Planning {day} | Planlegger {day} | new |
| `today.backToEveryday` | Back to everyday | Tilbake til hverdag | `today.backToLook` |
| `today.backToToday` | Back to today | Tilbake til i dag | `common.backToToday` |
| `today.savePlanTitle` | Save this plan? | Lagre planen? | new (asked in place in the planning Banner, with `common.saveLook` and `common.discard`) |
| `common.discard` | Discard | Forkast | new on this screen (unsaved plan) |
| `today.planned` | Planned for today: {name} | Planlagt i dag: {name} | new |
| `today.unsavedPlan` | Plan for {day}, not saved | Plan for {day}, ikke lagret | new |
| `today.openPlan` | Open plan | Åpne planen | new |
| `looks.fromYourLooks` | From your looks | Fra samlingen | `looks.fromYourLooks` |
| `looks.showOnToday` | Show on Today | Vis på I dag | `looks.use` |
| `today.lookLabel` | {look}, show on Today | {look}, vis på I dag | new (VoiceOver label of a Start with look Row, role radio; {look} is the Row label) |
| `looks.variantOf` | Variant of {name} | Variant av {name} | `looks.variantOf` |
| `looks.fillGap` | Fill the gap | Fyll hullet | `looks.fillGap` |
| `common.showAll` | Show all | Vis alle | `looks.seeAll` (no count on screen) |
| `looks.showAllLabel` | Show all {count} looks | Vis alle {count} looker | new (VoiceOver label for `common.showAll` here) |
| `looks.missingOne` | 1 piece missing | 1 plagg mangler | `looks.missingOne`, `looksTab.missingOne` |
| `looks.missingMany` | {count} pieces missing | {count} plagg mangler | `looks.missingMany`, `looksTab.missingMany` |
| `today.startWith` | Start with | Start med | `today.startWith` |
| `today.garment.hijab` | Hijab | Hijab | `today.wearKind` |
| `today.garment.knit` | Knit | Strikk | new |
| `today.garment.blazer` | Blazer | Blazer | `today.wearKind` (Adjust only; Today shows Hijab and Knit) |
| `today.garment.dress` | Dress | Kjole | `today.wearKind` |
| `today.garment.kurta` | Kurta | Kurta | `today.wearKind` |
| `today.garment.trousers` | Trousers | Bukse | `today.wearKind` |
| `today.startWithPiece` | Start with a piece | Start med et plagg | `title.choosePieces`, `today.choosePiecesCount` |
| `today.check.title` | Check {name} | Sjekk {name} | `title.checkPiece`, `today.checkBeforeWearing` |
| `coverage.askSleeve` | Sleeve length on {name}? | Ermelengde på {name}? | `coverage.askSleeve` |
| `coverage.askLength` | Where does {name} reach on you? | Hvor langt når {name} på deg? | `coverage.askLength` |
| `coverage.askSheer` | Is {name} see-through? | Er {name} gjennomsiktig? | `coverage.askSheer` |
| `coverage.askOpen` | Does {name} open at the front? | Er {name} åpen foran? | `coverage.askOpen` |
| `coverage.askBoth` | Is {name} see-through or open at the front? | Er {name} gjennomsiktig eller åpen foran? | `coverage.askBoth` |
| `check.save` | Save answer | Lagre svaret | `check.save` |
| `check.useAnother` | Choose another piece | Velg et annet plagg | `check.useAnother` |
| `today.openPiece` | Open {name} | Åpne {name} | `today.openPiece` |
| `today.noLongerFits` | This outfit no longer fits your choices | Antrekket passer ikke lenger til valgene dine | `today.noLongerFits` |
| `today.pieceUnavailable` | A piece is no longer available | Et plagg er ikke lenger tilgjengelig | `today.pieceUnavailable` |
| `today.findNew` | Find a new outfit | Finn et nytt antrekk | `today.findNew` |
| `today.stopKeeping` | Stop keeping {name} | Ikke behold {name} | `today.stopKeeping` |
| `today.anyType` | Any garment | Alle plaggtyper | `today.anyType` |
| `today.switchTo` | Switch to {style} | Bytt til {style} | `today.switchTo` |
| `today.clearWeather` | Clear the weather | Fjern været | `today.clearWeather` |
| `today.includeSetAside` | Include set-aside pieces | Ta med plagg lagt til side | `today.includeSetAside`, `adjust.includeAgain` |
| `today.answerQuestion` | Answer one question | Svar på ett spørsmål | new (problem row action; opens the check card that blocks the outfit) |
| `today.stylingFailed` | Could not style today | Kunne ikke sette sammen antrekket | `common.restyleError` |
| `today.styling` | Styling | Setter sammen | `today.styling` (VoiceOver while the flat lay arranges) |
| `today.announce.outfit` | New outfit: {name} | Nytt antrekk: {name} | new (announced when Another, Adjust, Start with these or Show on Today lays down an outfit) |
| `common.error.save` | Could not save. Try again. | Kunne ikke lagre. Prøv igjen. | every `*.saveFailed`, `*.saveError`, `error.*Save`, `settings.failed`, `onboarding.saveFailed` |
| `coverage.*`, `styling.*`, `pieceWeather.*Unconfirmed`, `stylist.often`, `stylist.keptAway`, `outfitTip`, `reason.*`, `outfitName.*` | unchanged | unchanged | problem lines and reasons (`stylist.keptAway` NB says "utilgjengelig", already matches) |

Problem lines (`coverage.*`, `styling.*`) stay word for word except: every "archived" becomes "put away" (`styling.keptUnavailable` EN "A piece you chose to keep is unavailable or put away", NB "Et plagg du valgte å beholde, er utilgjengelig eller lagt bort"; `stylist.keptArchived` and `looks.archived` EN "{name} is put away", NB "{name} er lagt bort"). `today.hijabUnset` is cut: Sometimes shows no caption.

The first-run card is the scarf A mark plus `today.firstRun.style` and `sample.try`, no title.

The Banner's two lines are a writing budget, not `numberOfLines`: at large text it grows, never clips. That is why `today.banner.started` shows at most two names.

The check card title, and Mark as worn and Plan on a look, carry `accessibilityState.expanded` while their chips are open.

The quiet action row (Another, Save look, Not for me) becomes the stacked quiet row (full-width quiet Buttons, leading-aligned labels) at `large` or when any of its labels would wrap, measured in a hidden layer before the row is shown. A third on a 375 pt phone is 114 pt, so a label gets 98 pt inside the 8 + 8 padding. SF Pro Semibold 17: NB `Et annet` 69, `Lagre look` 87, `Åpne look` 83, `Passer ikke` 96; EN `Another` 67, `Save look` 80, `Open look` 84, `Not for me` 89. Both languages get thirds at default size. The Today Footer holds `outfit.wear` alone. Undo is never in that row; it is the Undo slot's action.

The check card's title row expands it; there is no separate action. Collapsing is the dismissal.

Cut: `today.changeHijab` and `today.compareHijabs` (the hijab in the flat lay opens the hijab strip, F06), `looks.showing` (the trailing checkmark says it), `check.action` (the title row expands the card), `today.startTitle`, `common.setEverydayFirst` (the card's button says it), `today.savedOpen`, `today.drop`, `today.inspiration`, `today.layoutNote`, `today.sampleNote`, `today.sampleOnly`, `today.startBody`, `common.everydayFirstBody`, `today.countFrom`, `today.sourceOwned`, `today.sourceSample`, `today.adjustHint` (each context chip is its own control), `today.inThisOutfit`, `today.forOccasion` (merged into Adjust), `today.styleFrom` (moved to Adjust), `today.keptSuffix`, `looks.fits`, `looks.checkFirst`, `looks.needChange`, `looks.away`, `looks.setAside` (the variant card says what changed with `looks.variantOf`), `forecast.suffix`, `forecast.sources`, `weather.indoorsSuffix`, `weather.outsideSuffix`, `check.title`, `check.nothingTitle`, `check.nothingBody`, `check.notNow` (collapsing is the dismissal), `check.whySeeThrough`, `check.suggested`, `check.kept`, `check.answer`, `outfit.why`, `outfit.change`.

## F07 Adjust today

| Key | English | Bokmål | Replaces |
|---|---|---|---|
| `title.adjust` | Adjust | Juster | `title.adjustToday`, `today.adjust` |
| `adjust.occasion` | Occasion | Anledning | `adjust.occasion` |
| `adjust.day` | When | Når | new |
| `adjust.today` | Today | I dag | new |
| `adjust.tomorrow` | Tomorrow | I morgen | new |
| `adjust.pickDate` | Choose a date | Velg dato | new |
| `adjust.style` | Style | Stil | `adjust.style` |
| `style.both` | Both | Begge | `adjust.any` on the style row (same choice as onboarding and Your style) |
| `adjust.garment` | Wear | Ha på | `adjust.wear` (not "Garment": the piece type is Category everywhere) |
| `adjust.any` | Any | Alle | `adjust.any` on the garment row |
| `adjust.weather` | Weather | Vær | `adjust.weather` |
| `adjust.useForecast` | Forecast | Værmelding | `adjust.useForecast` |
| `adjust.notSet` | Not set | Ikke satt | `adjust.notSet` |
| `adjust.conditions` | Conditions | Føre | `adjust.conditions` |
| `adjust.dry` | Dry | Tørt | `adjust.dry` |
| `adjust.rain` | Rain | Regn | `adjust.rain` |
| `adjust.snow` | Snow | Snø | `adjust.snow` |
| `adjust.yourDay` | Your day | Dagen din | `adjust.day` |
| `adjust.indoors` | Mostly indoors | Mest inne | `adjust.indoors` |
| `adjust.outside` | Time outside | Mye ute | `adjust.outside` |
| `adjust.closet` | Closet | Garderobe | `today.styleFrom` |
| `today.wardrobeSample` | Sample closet | Eksempelgarderobe | `today.wardrobeSample` |
| `today.wardrobeOwned` | My clothes | Mine klær | `today.wardrobeOwned` |
| `adjust.keepingOne` | Keeping 1 piece | Beholder 1 plagg | `adjust.keepingOne`, `pieces.keepingOne`, `today.keptEverywhere` |
| `adjust.keepingMany` | Keeping {count} pieces | Beholder {count} plagg | `adjust.keepingMany`, `pieces.keepingMany` |
| `adjust.stopKeeping` | Stop keeping | Ikke behold | `adjust.stopKeeping`, `pieces.stopKeeping` |
| `today.includeSetAside` | Include set-aside pieces | Ta med plagg lagt til side | `adjust.includeAgain` |
| `adjust.makeEveryday` | Save to Your style | Lagre i Din stil | `adjust.alsoEveryday` |
| `adjust.find` | Show outfit | Vis antrekk | `adjust.find` |
| `common.discardTitle` | Discard changes? | Forkaste endringene? | `common.discardTitle` |
| `common.keepEditing` | Continue editing | Fortsett å endre | new |
| `common.discard` | Discard | Forkast | `common.discard` |
| `today.startWithPiece` | Start with a piece | Start med et plagg | `title.choosePieces` |
| `common.selectedOne` | 1 selected | 1 valgt | new on this screen |
| `common.selectedMany` | {count} selected | {count} valgt | new on this screen |
| `pieces.clear` | Clear | Fjern alle | `common.clear` |
| `common.showAll` | Show all | Vis alle | `common.showAllPieces` |
| `pieces.startWithThese` | Start with these | Start med disse | `pieces.styleAround` |
| `pieces.none` | No pieces yet | Ingen plagg ennå | `pieces.noneInCloset` |
| `closet.addPieces` | Add pieces | Legg til plagg | `styling.addOwnPieces` (action) |
| `occasion.*` | unchanged, except the two rows below | unchanged | `occasion.*` |
| `occasion.wedding` | Wedding or nikah | Bryllup eller nikah | "Wedding guest, nikah or walima" (a comma inside a chip reads as two chips) |
| `occasion.barat` | Barat | Barat | "Barat or formal wedding" |

`adjust.conditions` in NB is "Føre", the word Norwegians use for ground conditions (tørt føre, glatt føre). "Forhold" was vague.

Cut: `adjust.notForecast`, `adjust.occasionNote`, `adjust.todayNote`, `pieces.intro`, `collage.emptyBody`, `error.choicesSave` (uses `common.error.save`), `common.discardBody`.

## F08 Change a piece

| Key | English | Bokmål | Replaces |
|---|---|---|---|
| `change.title` | Change {role} | Bytt {role} | `replace.title`, `today.changePiece`, `build.swapTitle` (`{role}` from `role.one.*`, so it matches `today.changeHijab`: "Change hijab" / "Bytt hijab"; also the strip header's VoiceOver text) |
| `today.keep` | Keep | Behold | `today.keep`, `today.keepPiece` (visible Keep chip in the strip header) |
| `change.keepLabel` | Keep {name} | Behold {name} | new (VoiceOver label of the Keep chip, `checkbox` with `checked`; names the piece in the outfit) |
| `outfit.kept` | Kept | Beholdt | `outfit.kept` |
| `outfit.keptLabel` | {name}, kept | {name}, beholdt | `outfit.keptLabel` (VoiceOver) |
| `common.close` | Close | Lukk | `common.close` |
| `change.none` | No other piece works here | Ingen andre plagg passer her | `replace.none`, `build.swapNone` |
| `change.anotherWithout` | Another without it | Nytt uten dette plagget | `replace.restyle` |
| `hijabs.noOther` | No other hijab works with this outfit | Ingen annen hijab passer til antrekket | `hijabs.noOther` |
| `common.showAll` | Show all | Vis alle | new on this screen |
| `hijabs.showAllLabel` | Show all hijabs | Vis alle hijaber | new (VoiceOver label for `common.showAll` here) |
| `common.editColour` | Edit colour | Endre farge | new (opens the colour chips; same on the capture tile) |
| `change.editColourLabel` | Edit colour of {name} | Endre farge på {name} | new (VoiceOver label for `common.editColour` in the Change strip, names the hijab in the outfit) |
| `change.inPlan` | In {day}'s plan | I planen for {day} | new (VoiceOver, full weekday: "In Friday's plan". Visible: calendar symbol plus short weekday, "Fri" / "fre.") |
| `change.reason.with` | With {piece} | Med {piece} | new (Expander value of the hijab strip, for the hijab in the outfit only: "With the tunic" / "Med tunikaen"; crossfades on a pick. Tiles show the name) |
| `change.reason.picksUp` | Picks up the {colour} in {piece} | Tar opp {colour} fra {piece} | new (hijab tile reason, VoiceOver only; `{colour}` is the `colour.*` name in lower case, "gammelrosa") |
| `change.pieceLabel` | {name}, {role} | {name}, {role} | `today.changePiece` (VoiceOver on flat lay pieces; `{role}` from `role.one.*`, left out when the name holds it; add `, kept` from `outfit.keptLabel` when kept) |
| `change.hint` | Changes this piece | Bytter plagget | new (VoiceOver hint on flat lay pieces) |

Each strip tile is one VoiceOver element labelled `tile.label`, `accessibilityRole="button"` with `accessibilityState.selected`; double-tap applies it, with no custom action or hint. Keep is a visible `checkbox` Chip in the strip header with VoiceOver label `change.keepLabel`, which starts with its visible text.

`{piece}` in `change.reason.with` and `change.reason.picksUp` is the drawn piece in definite form ("the tunic" / "tunikaen"). That is the only place the definite form is used.

Role words, new: `role.one.*` for `change.title` and `change.pieceLabel`; `role.the.*` only for `{piece}` in `change.reason.*`:

| Role | `role.the.*` EN | NB | `role.one.*` EN | NB |
|---|---|---|---|---|
| main | the main piece | hovedplagget | main piece | hovedplagg |
| bottom | the bottoms | underdelen | bottoms | underdel |
| layer | the layer | laget | layer | lag |
| outer | the outer layer | yttertøyet | outer layer | yttertøy |
| shoes | the shoes | skoene | shoes | sko |
| hijab | the hijab | hijaben | hijab | hijab |
| bag | the bag | vesken | bag | veske |
| accessory | the accessory | tilbehøret | accessory | tilbehør |

The other hijab tile reasons reuse `reason.*` with `{a}` dropped where the tile already shows the hijab. That is a template change in Phase 3, not new copy.

Cut: `change.trying` (picks apply at once), `change.use` (a tile is a `button`, double-tap applies it), `replace.choose`, `replace.goneTitle` (the strip closes when the piece leaves), `hijabs.noneTitle`, `hijabs.current`, `hijabs.undoHint`, `hijabs.currentLabel` and `hijabs.currentVoice` (the selected disc and `accessibilityState.selected` say which hijab is in the outfit).

## F09 Looks

| Key | English | Bokmål | Replaces |
|---|---|---|---|
| `nav.looks` | Looks | Samling | `nav.looks`, `title.yourLooks` |
| `looks.new` | New look | Ny look | new (header icon label) |
| `looks.lastWorn` | Last worn {date} | Sist brukt {date} | new |
| `looks.planned` | Planned for {date} | Planlagt {date} | new. `{date}` is "today" / "i dag" and "tomorrow" / "i morgen" for those two days (`Intl.RelativeTimeFormat`, `numeric: "auto"`), else the short date |
| `looks.worn` | Worn, not saved | Brukt, ikke lagret | `looks.worn` |
| `common.pieceCountMany` | {count} pieces | {count} plagg | `looksTab.countMany` |
| `common.pieceCountOne` | 1 piece | 1 plagg | `looksTab.countOne` |
| `looks.missingOne` | 1 piece missing | 1 plagg mangler | `looksTab.missingOne` |
| `looks.missingMany` | {count} pieces missing | {count} plagg mangler | `looksTab.missingMany` |
| `looksTab.emptyTitle` | No looks yet | Ingen looker ennå | `looksTab.emptyTitle` |
| `looks.new` | New look | Ny look | `looksTab.buildFirst` (empty state) |
| `closet.addPieces` | Add pieces | Legg til plagg | new on this screen |
| `looks.showOnToday` | Show on Today | Vis på I dag | `looks.use` |
| `look.markWorn` | Worn | Brukt | new (chip on look detail that opens the Today / Yesterday body; Closet keeps `looks.markWorn`) |
| `adjust.today` | Today | I dag | new |
| `looks.yesterday` | Yesterday | I går | new |
| `looks.wornYesterday` | Worn yesterday | Brukt i går | new (ResultBar text in the Mark as worn body after Yesterday; Today uses `outfit.worn`. Takes focus, not announced) |
| `outfit.worn` | Worn today | Brukt i dag | `outfit.worn` (ResultBar text after Mark as worn, Today) |
| `common.undo` | Undo | Angre | new on this screen (ResultBar action after Mark as worn) |
| `result.saved` | Saved | Lagret | new on this screen (VoiceOver announcement when Save look on a worn look becomes Show on Today) |
| `looks.plan` | Plan | Planlegg | new |
| `looks.clearPlan` | Clear date | Fjern dato | new (quiet Button under the calendar when a date is set) |
| `looks.planCleared` | Plan cleared | Planen er fjernet | new (VoiceOver announcement after Clear date) |
| `looks.laterDates` | Later | Senere | new (last row of the 14-day list at `ax`) |
| `looks.earlierDates` | Earlier | Tidligere | new (first row of the 14-day list at `ax` once a later window shows) |
| `look.change` | Change | Endre | new (Section action on look detail; VoiceOver label `look.changePieces`) |
| `look.changePieces` | Change pieces | Endre plagg | `look.changePieces` (VoiceOver label of `look.change`) |
| `look.remove` | Remove look | Fjern looken | `look.remove` |
| `look.removeTitle` | Remove this look? | Fjerne looken? | `look.removeTitle` |
| `look.removeBody` | The pieces stay in your closet. | Plaggene blir i garderoben. | `look.removeBody` (kept: needed to act, the fear is losing pieces) |
| `look.missingOne` | 1 piece is no longer in your closet | 1 plagg er ikke lenger i garderoben | `look.missingOne` |
| `look.missingMany` | {count} pieces are no longer in your closet | {count} plagg er ikke lenger i garderoben | `look.missingMany` |
| `look.goneTitle` | This look is no longer here | Denne looken er ikke her lenger | `look.goneTitle` |
| `look.name` | Name | Navn | `build.name` |
| `look.rename` | Rename | Endre navn | new (chip under the meta line) |
| `common.saveLook` | Save look | Lagre look | `common.saveLook` |

Cut: `looksTab.intro`, `looksTab.emptyNoPieces`, `looksTab.emptyWithPieces`, `look.goneBody`, `look.goToLooks`, `title.yourLook` (the look name is the title), `looks.open` (repeated the name; the button role and chevron say it), `error.lookRemove`, `error.lookSave` (use `common.error.save` and `common.error.remove`).

## F10 New look

| Key | English | Bokmål | Replaces |
|---|---|---|---|
| `looks.new` | New look | Ny look | `title.buildLook` (screen title) |
| `build.edit` | Edit look | Endre look | `build.edit` |
| `adjust.occasion` | Occasion | Anledning | new on this screen (VoiceOver only: `{adjust}` in the occasion chip label and the occasion radiogroup label; no visible title) |
| `adjust.chipLabel` | {adjust}, {value} | {adjust}, {value} | new (VoiceOver on the occasion chip: "Occasion, Eid") |
| `build.slotEmpty` | No {role} | Mangler {role} | new (VoiceOver on an empty collage slot, `{role}` from `role.one.*` as F08: "No shoes" / "Mangler sko", "Mangler hovedplagg") |
| `common.pieceCountOne` | 1 piece | 1 plagg | `build.countOne` (announced only) |
| `common.pieceCountMany` | {count} pieces | {count} plagg | `build.countMany` (announced only) |
| `build.fill` | Fill the rest | Fyll ut resten | `build.fill` |
| `build.filling` | Filling the rest | Fyller ut resten | new (`busyLabel` on Fill the rest) |
| `change.title` | Change {role} | Bytt {role} | `build.swapTitle` (`{role}` from `role.one.*`, as F08) |
| `change.none` | No other piece works here | Ingen andre plagg passer her | `build.swapNone` |
| `common.showAll` | Show all | Vis alle | `common.showAllPieces` (Show all hijabs in the Change strip, as F08) |
| `common.saveLook` | Save look | Lagre look | `build.save` |
| `common.saveChanges` | Save changes | Lagre endringer | `common.saveChanges` |
| `closet.addPieces` | Add pieces | Legg til plagg | new on this screen |
| `common.cancel` | Cancel | Avbryt | `common.cancel` |
| `common.remove` | Remove | Fjern | VoiceOver action on a collage piece |
| `occasion.*` | unchanged | unchanged | new on this screen (occasion Expander chips) |
| `closet.all` | All | Alle | `filters.all` (category filter) |
| `category.*` | unchanged | unchanged | `category.*` |
| `build.pieceGone` | A piece is gone | Et plagg er borte | `closet.lookPieceGone` |
| `styling.*` | unchanged | unchanged | Fill the rest problem line (`styling.incomplete` when no problem is named) |
| `common.error.save` | Could not save. Try again. | Kunne ikke lagre. Prøv igjen. | `error.lookSave` |
| `common.discardTitle` | Discard changes? | Forkaste endringene? | `common.discardTitle` |
| `common.discard` | Discard | Forkast | `common.discard` |
| `common.keepEditing` | Continue editing | Fortsett å endre | new on this screen |
| `look.goneTitle` | This look is no longer here | Denne looken er ikke her lenger | gone look id from "Change pieces" |
| `common.goBack` | Go back | Gå tilbake | `common.goBack` |

The look takes the suggested outfit name (`outfitName.*`) as its FlatLay title and rename happens in look detail, so `build.nameHint` and `look.name` are cut here. Save is disabled until a piece is placed, so `closet.lookInvalid` is cut. `build.empty`, `common.done`, `closet.noneFoundTitle` and `closet.firstTitle` are cut from this screen. `closet.lookPieceGone` becomes `build.pieceGone`: EN "A piece is gone", NB "Et plagg er borte". The Change strip uses F08's keys.

## F11 Profile and style

| Key | English | Bokmål | Replaces |
|---|---|---|---|
| `profile.title` | Profile | Profil | `profile.title` |
| `style.title` | Your style | Din stil | `style.title`, `title.everyday`, `profile.style` |
| `style.bothLong` | Desi and Western | Desi og vestlig | new (Your style row meta on Profile) |
| `style.rules` | Style rules | Stilregler | new (Expander title on Your style) |
| `style.rulesSet` | {count} set | {count} valgt | new (closed value of the Style rules Expander) |
| `settings.answers` | Your answers | Svarene dine | `settings.answers` |
| `onboarding.place.title` | Units and city | Enheter og by | row label |
| `onboarding.body.title` | Body | Kropp | row label |
| `onboarding.taste.title` | Your taste | Din smak | row label |
| `profile.colours` | Colours | Farger | `profile.colours` |
| `common.edit` | Edit | Endre | `profile.change` |
| `profile.notAnswered` | Not answered | Ikke besvart | `profile.notAnswered` |
| `stats.title` | Closet stats | Garderoben i tall | `stats.title` |
| `stats.pieces` | Pieces | Plagg | `stats.pieces` |
| `stats.neverWorn` | Never worn | Aldri brukt | `stats.neverWorn` |
| `stats.mostWorn` | Most worn | Mest brukt | `stats.mostWorn` |
| `stats.wornOnce` | {name}, once | {name}, én gang | `stats.wornOnce` |
| `stats.wornMany` | {name}, {count} times | {name}, {count} ganger | `stats.wornMany` |
| `stats.nothingWorn` | Nothing worn yet | Ingenting brukt ennå | `stats.nothingWorn` |
| `settings.language` | Language | Språk | `settings.language` |
| `settings.language.system` | Follow phone | Følg telefonen | `settings.language.system` |
| `settings.language.en` | English | English | `settings.language.en` |
| `settings.language.nb` | Norsk bokmål | Norsk bokmål | `settings.language.nb` |
| `settings.app` | App | App | `settings.app` |
| `settings.replay` | Show intro again | Vis introen igjen | `settings.replay` |
| `settings.replay.title` | Show intro again? | Vise introen igjen? | new (system dialog) |
| `settings.replay.body` | Your pieces and looks stay. | Plaggene og lookene blir. | new (kept: needed to act) |
| `settings.reset` | Delete all data | Slett alle data | `settings.reset` |
| `settings.reset.title` | Delete all data? | Slette alle data? | `settings.reset.title` |
| `settings.reset.text` | Pieces, photos, looks and answers are deleted from this phone. This cannot be undone. | Plagg, bilder, looker og svar slettes fra telefonen. Dette kan ikke angres. | `settings.reset.text` (kept: needed to act) |
| `settings.reset.confirm` | Delete everything | Slett alt | `settings.reset.confirm` |
| `settings.privacy` | Stays on this phone. Your city goes to Apple, Clean background photos to Cloudflare. | Blir på telefonen. Byen sendes til Apple, bilder med Ren bakgrunn til Cloudflare. | `settings.privacy` (kept: privacy) |
| `settings.version` | Version {version} | Versjon {version} | `settings.version` |
| `settings.advanced` | Advanced | Avansert | new (owner decision 3) |
| `stylist.label` | Stylist | Stilist | `stylist.label` |
| `stylist.rules` | Rules | Regler | `stylist.rules` |
| `stylist.model` | Model | Modell | `stylist.model` |
| `stylist.compare` | Compare | Sammenlign | `stylist.compare` |
| `stylist.results` | Compare results | Sammenligning | `stylist.results` |
| `stylist.wouldWear` | Would wear, top three: {rate} | Ville brukt, topp tre: {rate} | `stylist.wouldWear` |
| `stylist.notMyStyle` | Not my style: {rate} | Ikke min stil: {rate} | `stylist.notMyStyle` |
| `stylist.wore` | Worn: {count} | Brukt: {count} | `stylist.wore` |
| `stylist.rate` | {part} of {whole} ({percent}%) | {part} av {whole} ({percent} %) | `stylist.rate` |
| `stylist.noFeedback` | No feedback yet | Ingen tilbakemeldinger ennå | `stylist.noFeedback` |
| `stylist.unreadOne` | 1 piece has no photo reading, so Rules styles it | 1 plagg mangler bildeavlesning, så Regler styler det | `stylist.unreadOne` |
| `stylist.unreadMany` | {count} pieces have no photo reading, so Rules styles them | {count} plagg mangler bildeavlesning, så Regler styler dem | `stylist.unreadMany` |
| `style.occasion` | Occasion | Anledning | `everyday.occasion` |
| `style.style` | Style | Stil | `everyday.style` |
| `style.hijab` | Hijab | Hijab | `everyday.hijab` |
| `hijab.always` | Always | Alltid | `everyday.always` |
| `hijab.sometimes` | Sometimes | Noen ganger | new on this screen |
| `hijab.notNeeded` | Not needed | Trengs ikke | `everyday.notNeeded` |
| `coverage.levelLabel` | Coverage | Dekning | `coverage.levelLabel` |
| `coverage.sleevesLabel` | Sleeves | Ermer | `coverage.sleevesLabel` |
| `coverage.hemLabel` | Hem | Lengde | `coverage.hemLabel` |
| `coverage.toElbow` | To the elbow | Til albuen | `coverage.toElbow` |
| `coverage.toWrist` | To the wrist | Til håndleddet | `coverage.toWrist` |
| `coverage.toCalf` | To mid-calf | Til midt på leggen | `coverage.toCalf` |
| `coverage.toAnkle` | To the ankle | Til ankelen | `coverage.toAnkle` |
| `coverage.anyLength` | Any length | Alle lengder | `coverage.anyLength` |
| `coverage.necklineUnchecked` | Neckline is not checked. | Halsringningen sjekkes ikke. | `coverage.necklineUnchecked` (kept: needed to act) |
| `adjust.yourDay` | Your day | Dagen din | new on this screen |
| `style.layout` | Outfit card | Antrekkskort | `style.layout` |
| `style.layout.minimal` | Outfit only | Bare antrekket | `style.layout.minimal` |
| `style.layout.reasons` | With reasons | Med begrunnelser | `style.layout.reasons` |
| `style.layout.full` | With reasons and checks | Med begrunnelser og sjekker | `style.layout.full` |
| `style.belt` | Belt over long pieces | Belte over lange plagg | `style.belt` |
| `style.belt.yes` | Suggest | Foreslå | `style.belt.yes` |
| `style.belt.no` | Never | Aldri | `style.belt.no` |
| `style.topLength` | Shortest top with trousers | Korteste overdel til bukse | `style.topLength` |
| `style.bottoms` | Trousers or skirts | Bukser eller skjørt | `style.bottoms` |
| `style.prints` | Print on print | Mønster på mønster | `style.prints` |
| `style.prints.yes` | Yes | Ja | `style.prints.yes` |
| `style.prints.no` | Avoid | Unngå | `style.prints.no` |
| `style.wedding` | Avoid at weddings | Unngå i bryllup | `style.wedding` |
| `style.dupatta` | Dupatta at family events | Dupatta i familieselskap | `style.dupatta` |
| `style.dupatta.yes` | Expected | Forventet | `style.dupatta.yes` |
| `style.dupatta.no` | Optional | Valgfri | `style.dupatta.no` |
| `style.region` | Region | Region | `style.region` |
| `style.none` | Any | Uansett | `style.none` |
| `closet.sample` | Sample | Eksempel | `everyday.sampleNote` (Your style shows no sample note; the word lives in the Closet section title and the Today chip) |
| `everyday.saveRestyle` | Save and update today | Lagre og oppdater i dag | `everyday.saveRestyle` |
| `common.save` | Save | Lagre | `everyday.save`, `everyday.saveKeep`, `style.save`, `onboarding.save` |
| `common.cancel` | Cancel | Avbryt | answer screen header |
| `style.topLength.*`, `style.bottoms.*`, `style.wedding.white/black`, `style.region.*`, `shape.*` | unchanged | unchanged | same keys |

The Your style save pair (`everyday.saveRestyle`, `common.save`) is always stacked, full width.

Cut: `style.sampleNote`, `style.intro`, `everyday.intro`, `coverage.helpFull`, `coverage.helpModerate`, `coverage.helpOwn`, `coverage.helpUnset`, `coverage.sleevesUnset`, `coverage.sleevesWrist`, `coverage.sleevesElbow`, `coverage.hemUnset`, `coverage.hemAnkle`, `coverage.hemCalf` (the chosen values say it), `style.wedding.avoid`, `stylist.help`, `stylist.intro`, `error.everydaySave`, `style.error`.

## F12 App-wide

| Key | English | Bokmål | Replaces |
|---|---|---|---|
| `common.back` | Back | Tilbake | `common.back` (VoiceOver on the chevron) |
| `common.goBack` | Go back | Gå tilbake | `common.goBack` |
| `common.loading` | Loading | Laster | new (VoiceOver, one element per loading region: grid, flat lay, forecast chip; the placeholders inside are hidden from accessibility) |
| `common.offline` | You are offline | Du er uten nett | `photo.studioOffline` |
| `common.error.save` | Could not save. Try again. | Kunne ikke lagre. Prøv igjen. | all save errors |
| `common.error.remove` | Could not remove. Try again. | Kunne ikke fjerne. Prøv igjen. | `error.pieceRemove`, `error.lookRemove`, `capture.removeFailed`, `careLabel.removeFailed` |
| `common.tryAgain` | Try again | Prøv igjen | all retry labels |
| `common.discardTitle` | Discard changes? | Forkaste endringene? | `common.discardTitle` |
| `common.keepEditing` | Continue editing | Fortsett å endre | new |
| `common.discard` | Discard | Forkast | `common.discard` |
| `error.closetOpening` | Still opening. Try again in a moment. | Åpner fortsatt. Prøv igjen om litt. | `error.closetOpening` |
| `error.listedOption` | Choose one of the options | Velg ett av valgene | `error.listedOption` |
| `word.and` | and | og | `word.and` |
| `common.open` | Open | Åpne | new (ResultBar action) |
| `common.showAll` | Show all | Vis alle | `common.showAllPieces` |
| `result.saved` | Saved | Lagret | new (ResultBar text, announced) |
| `result.changed` | Changed | Byttet | new (ResultBar text, announced) |
| `result.putAway` | Put away | Lagt bort | `archive.archived` (ResultBar text, announced) |
| `result.removed` | Removed | Fjernet | new (label block text of the Removed slot on Add pieces after Remove photo or Same piece, with `common.undo`; focus moves to Undo, so it is not announced) |

The ResultBar is docked in the screen's fixed footer. It crossfades in place of the footer content and never slides or floats, like `today.openLook` and `outfit.thanks`.

### Announcements

`accessibilityLiveRegion` works only on Android. Status lines are also announced with `AccessibilityInfo.announceForAccessibilityWithOptions`, in three ways:

- One-off results, `{ queue: true }`: `today.announce.outfit`, `outfit.thanks`, `result.saved`, `result.changed`, `result.putAway`, `result.backInCloset`, `closet.linked`, `looks.wornYesterday`, `outfit.worn`, `cutout.selected`, `cutout.noneFound`, `photo.cleanDone`, `scan.pieceAdded`, `common.error.*`.
- Live camera status, `{ queue: false }`, and only after a status has held for the `dwell` token: `scan.status.*` (with `scan.status.readyVoice` in place of `scan.status.ready`), `scan.captureFailed`, `selfie.guide.*`. A status that changes before `dwell` is never spoken. `scan.speed` is never announced.
- Counts, once, after the batch settles (no tile Waiting or Preparing), with the last value only: `capture.readyOne`, `capture.readyMany`, `capture.failedOne`, `capture.failedMany`, `closet.addedOne`, `closet.addedMany`.

### Controls and VoiceOver

- No target inside a target. The Apple Weather mark sits next to the forecast chip as its own 44 pt target; the capture tile colour sits in its own row.
- Segmented options and choice chips have `accessibilityRole="radio"` and `accessibilityState.selected`. The label is the option text only; the selection is never added as words.
- After any in-place replacement, `AccessibilityInfo.setAccessibilityFocus` moves to the replacing element: the ResultBar text after the Footer buttons, the next card after the check card collapses, the next tile after a capture tile is removed. `today.openLook` keeps focus because it is the same element. The announcement stays queued as above.

### Unchanged sets

These key families keep their keys and values in both languages: `category.*`, `kind.*`, `colour.*`, `value.*`, `attribute.*`, `fibre.*`, `season.*`, `depth.*`, `undertone.*`, `contrast.*`, `shape.*`, `region.*`, `occasion.*` (except `occasion.wedding` and `occasion.barat`, F07), `role.*`, `reason.*`, `outfitName.*`, `outfitTip`, `selfie.guide.*` (except `selfie.guide.still` in NB), `style.western`, `style.desi`. Bokmål fixes inside them:

| Key | Bokmål now | Bokmål new | Why |
|---|---|---|---|
| `selfie.guide.still` | Hold deg i ro | Hold stille | One phrase with scan |
| `style.layout.reasons` | Med begrunnelse | Med begrunnelser | Plural, there are several |
| `forecast.*` | værvarsel | værmelding | One word for forecast |

### Notes for other roles

- Use cases say "Dusty pink" in UC-F02-22, UC-F05-15 and UC-F08-06. There is no such colour in `colour.*`; the nearest named colours are Blush (`colour.blush`, NB "Pudderrosa") and Mauve (`colour.mauve`, NB "Gammelrosa"). Testers should use "Blush" or "Mauve", or the domain adds a colour, which is out of scope.
- "Bruk" in NB means wear, with no exceptions.
- Bokmål tab labels: I dag (5), Garderobe (9), Samling (7). Tab labels do not grow with Dynamic Type. Test: at AX5, long press on each tab shows I dag, Garderobe and Samling in the Large Content Viewer. Check that NativeTabs exposes it.

Renamed visible text. Maestro flows select by text, so the architect updates `use-cases.md` and the hand-off rules in `architecture.md` (rules 2 and 4, and the flow table) to this column before Phase 3:

| Old visible text | Key | English | Bokmål |
|---|---|---|---|
| Style today | `pieces.startWithThese` | Start with these | Start med disse |
| Worn lately (Closet select menu) | `looks.markWorn` | Mark as worn | Merk som brukt |
| Mark what I wear most | `looks.markWorn` | Mark as worn | Merk som brukt |
| Answer for N | `capture.confirmMany` | Confirm {count} pieces | Bekreft {count} plagg |
| Link as set | `closet.linkSet` | Link as a set | Koble som sett |
| Build a look | `looks.new` | New look | Ny look |
| Find outfits | `adjust.find` | Show outfit | Vis antrekk |
| styling from your clothes now | cut | | |
| Back in my closet | `closet.backInCloset` | Back in the closet | Tilbake i garderoben |
| Remove from this set | `sets.remove` | Remove from set | Fjern fra settet |
| Make this my everyday | `adjust.makeEveryday` | Save to Your style | Lagre i Din stil |
| Save and restyle today | `everyday.saveRestyle` | Save and update today | Lagre og oppdater i dag |
| Save, keep today's outfit | `common.save` | Save | Lagre |
| Started with {names}, today only | `today.banner.started` | Started with {names} | Startet med {names} |
| My own limit | `coverage.own` | My own limit | Egen grense |
| Tap what you wear a lot | cut | | |

For `design-system.md` (its owner edits it; copy above already assumes these):

- Section 16 MediaFrame: `scan.speed` at full opacity `onMedia` on its own `scrim` 0.70 capsule (5.15:1 over pure white), not at 60 percent with no scrim.
- Sections 7 and 8: Button and Chip heights 52 and 44 become `minHeight` with vertical padding.
- Colour never list: add blushInk on blushSoft (4.46:1, so the planned mark "fre." never sits inside the blushSoft planning Banner), inkMuted on blush (2.85:1, no muted meta or disabled label on a selected chip or segment), and white text on `scrim` 0.55 (3.35:1; text scrims use 0.70).
- `lineField` on `sunken` is 2.87:1: darken the segment divider and the disabled Field border on sunken to about #8C847E, or drop the divider.

For `motion.md`:

- Add the token `linger` 1500 (minimum time `scan.status.taken` stays up).
- Banners and bars: Save look crossfades to `today.openLook` "Open look" / "Åpne look", not "Saved, open"; the accessibilityLabel switches at once; Reduce Motion keeps the `base` crossfade.

## Review log

- Edits to `design-system.md` and `motion.md` (MediaFrame readout, Button and Chip `minHeight`, the contrast never list, `lineField`, the `linger` token, the Save look crossfade): not made here, because this role writes only `copy.md` and those files have their own owners. They are listed under Notes for other roles.
- `onboarding.done.title` reinstated by the F01 flow design (`flows/F01-start.md`): without it the done step is the only onboarding step with no title, which reads as an inconsistent screen.
- `splash.label` removed by the F01 flow design: the splash tile and mark are hidden from VoiceOver, so the label is never read.
- Onboarding step titles keep "Your" (`onboarding.taste.title`, `onboarding.colours.title`): the keys are shared with the Profile row labels and `colours.title`, where "Your" marks the user's own answers.
- `colours.adjust` reinstated as "Adjust" / "Juster" by the F01 flow design: the selfie result's toggle and three Segmented controls sit in one closed Expander, which needs a title. `onboarding.colours.swatch` shortened to "Skin tone" / "Hudtone".
