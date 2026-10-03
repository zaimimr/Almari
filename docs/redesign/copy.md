# Almari copy

Date: 2026-10-03. Phase 2 output, UX writer. Source: `src/i18n/en.ts`, `src/i18n/nb.ts`, `architecture.md` (Owner decisions win), `use-cases.md`.

Rules for every string:

- Labels and values. No helper text unless the user cannot act correctly without it. Kept lines are marked "kept: needed to act" or "kept: privacy".
- One term per concept. The glossary below is the only source for these words. A developer who needs a word not in it asks the writer.
- Bokmål is written as a Norwegian would say it, not translated word for word. Never nynorsk.
- No em dash. No exclamation marks. No "Please". Sentences end with a full stop only when they are sentences; labels have none. A one-line status that stands alone in its slot (`outfit.thanks`, `today.noLongerFits`) counts as a label: no full stop. A line of two sentences, or a sentence under a control, keeps its stops.
- Errors are one line next to the control that failed: what happened, then the way out.
- Dates come from `Intl.DateTimeFormat` with the app locale: EN `Sat 11 Oct`, NB `lør. 11. okt.`. Short form `12 Sep` / `12. sep.`. Visible text keeps the short form; the VoiceOver label of `looks.lastWorn`, `looks.planned`, `piece.wornMany`, `piece.wornOnce`, `change.inPlan`, `today.banner.planning`, `today.unsavedPlan` and the `adjust.pickDate` value uses `dateStyle: "full"`, so NB is never read as an abbreviation. On the calendar (`calendar.dayTitle`, `calendar.day`, `calendar.today`) the VoiceOver date is `weekday: "long", day: "numeric", month: "long"` with no year, because the month title holds it: "Friday 9 October", "fredag 9. oktober".
- `{percent}` is always the formatted string from `Intl.NumberFormat(locale, { style: "percent" })`, sign included: EN "60%", NB "60 %" with a no-break space (U+00A0), so "%" never wraps onto its own line at AX3 to AX5. No value writes a literal "%" or space after `{percent}`.
- Errors use one grammar: EN "Could not {verb} {object}", NB "Kunne ikke {verb} {object}". "this photo" / "bildet" for a photo.
- No string sits in a fixed-height or fixed-width container. Buttons and chips use 44 and 52 as `minHeight` with vertical padding, so a label that wraps to two lines grows its capsule.
- Every `mark` string, NB included, fits a 112 pt strip tile at the 1.4x mark cap (about 9 characters).
- Copy keys hold no soft hyphens (F12 B). The shared `Text` adds them at render time in `nb` to any word of 12 or more characters, user-entered piece and look names included, using the TeX `hyph-nb` Liang patterns (as packaged in `hyphen/nb-no`), and in `en` to any word of 11 or more characters with `hyph-en-us` (`hyphen/en-us`), so AX5 breaks at a syllable with a visible hyphen, never mid-word. English examples: Avail|abil|ity, Un|avail|able, Noti|fi|ca|tion. Expected breaks: eksempel|garderoben, eksempel|garderobe, tilbake|meldinger, tilgjengelig|het, til|gjengelig, u|tilgjengelig, familie|selskap, bilde|avlesning, hals|ringningen, gjennom|siktig, kamera|tilgang, inn|stillinger, sammen|ligning, antrekks|kort, tilbake|still, be|grunnelser, posisjons|tilgang (`place.locationOff`), varsel|tilgang (`notify.denied`), morgen|dagens (`today.tomorrow`, `notify.tomorrow`), morgen|antrekk (`profile.morning`, step 9). Hijabstiler has 11 characters, so no break.
- English questions and the owner's own phrases use contractions as speech does ("What's your name?", "These don't look like me", "I'll never wear"). Status and error lines do not ("You are offline", "Could not save").
- Every count has a `One` / `Many` key pair, new keys included, except a count that is never 1, named in its row (`calendar.timesMany`). NB uses the same form for 1 and many where the word does not change (`1 plagg`, `3 plagg`), but still gets both keys (`1 klar`, `3 klare`).
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
| Record a wear for selected pieces in Closet | Mark as worn | Merk som brukt | Wear this on a look, Worn lately, Wore recently |
| Record a wear from a look (`look.markWorn`) | Worn | Brukt | Mark as worn on a look |
| Pick an alternative in a strip | Use | Velg | Bruk (NB, reserved for wearing) |
| Pieces picked in Select or Start with a piece | selected | valgt | chosen |
| A date set on a look | Plan, planned | Planlegg, planlagt | Schedule, Plan for (as a verb) |
| Hold a piece across Another | Keep, kept | Behold, beholdt | Lock, Pin. Keep for anything else (rows, sets, saving) |
| Swap one piece for another | Change | Bytt | Swap, Replace (EN); Erstatt (NB) |
| Modify stored data (piece, answer, care label) | Edit | Endre | Change (EN); Rediger (NB) |
| Next outfit for the same request | Another | Et annet | Next, Shuffle, Restyle; Et nytt, Nytt antrekk, Et annet antrekk (NB: one short word pair like the EN, and the outfit is already on the card above it) |
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
| Everyday preferences screen | Your style | Din stil | Everyday style as the screen title (it is the row label `style.style` inside it), Style settings, Stilinnstillinger |
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
| Sleeve and hem rules | coverage | dekning | modesty. Modest: the owner's coverage value (`coverage.moderate`, `pieceCoverage.moderate`) and her style words Western modest (`onboarding.style.western`) only |
| Warmth of a piece | Warmth: Light, Medium, Warm | Varme: Lett, Middels, Varm | |
| Leave without saving | Discard | Forkast | Throw away, Drop |
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

Revision 1 > F01 Onboarding and F01 Colours define every onboarding and colours key. This table holds only the keys they do not redefine.

| Key | English | Bokmål | Replaces |
|---|---|---|---|
| `start.error.title` | Could not open your closet | Kunne ikke åpne garderoben | `closet.openFailed` |
| `common.tryAgain` | Try again | Prøv igjen | `closet.tryAgain`, `common.retry`, `problem.tryAgain`, `colours.tryAgain` |
| `onboarding.progress` | cut | cut | no visible progress text; the step title carries `onboarding.progressLabel` |
| `onboarding.progressLabel` | Step {step} of {total} | Steg {step} av {total} | new (the `accessibilityValue` of the step title, the question header; the bar is hidden) |
| `onboarding.next` | Next | Neste | `onboarding.next` (Next on an unanswered step skips it) |
| `common.skip` | cut | cut | `onboarding.skip` (there is no Skip) |
| `onboarding.units.*` | kept while `architecture.md` Open question 8 is open | kept | the Units `Segmented` on the Profile Body answer (F11); cut only if the owner confirms that units follow the phone's region |
| `onboarding.height.label` | Height (cm) | Høyde (cm) | `onboarding.height.label` (metric region only) |
| `onboarding.height.labelImperial` | Height | Høyde | new (ft and in fields carry the units) |
| `onboarding.height.labelVoice` | Height in centimetres | Høyde i centimeter | new (VoiceOver) |
| `onboarding.height.feet` | ft | fot | `onboarding.height.feet` |
| `onboarding.height.feetLabel` | Feet | Fot | new (VoiceOver) |
| `onboarding.height.inches` | in | tommer | `onboarding.height.inches` |
| `onboarding.height.inchesLabel` | Inches | Tommer | new (VoiceOver) |
| `onboarding.height.invalid` | Enter 120 to 220 cm | Skriv 120 til 220 cm | `onboarding.height.invalid` |
| `onboarding.height.invalidImperial` | Enter 3 ft 11 in to 7 ft 3 in | Skriv 3 fot 11 tommer til 7 fot 3 tommer | new |
| `onboarding.shape.question` | Body shape | Kroppsform | `onboarding.shape.question` |
| `onboarding.colourLean.question` | Colour strength | Fargestyrke | `onboarding.colourLean.question` (single optional ChipRow label on the Colours answer, F11 Profile; each chip reads `common.optionInGroup`, "Bold, Colour strength") |
| `onboarding.colourLean.bold` | Bold | Sterke | `onboarding.colourLean.bold` |
| `onboarding.colourLean.soft` | Soft | Dempede | `onboarding.colourLean.soft` |
| `style.both` | Both | Begge | `piece.styleBoth`, `style.bottoms.both` (piece style and the Trousers or skirts rule only; her answer is `onboarding.style.both`, Revision 1) |
| `onboarding.colours.title` | Your colours | Dine farger | `onboarding.colours.title`, `colours.title` |
| `closet.addPieces` | Add pieces | Legg til plagg | `onboarding.done.add` |
| `sample.try` | Try the sample closet | Prøv eksempelgarderoben | `onboarding.done.sample`, `today.trySample`, `today.useSample` |
| `colours.cameraFailed` | Could not open the camera | Kunne ikke åpne kameraet | `colours.cameraFailed` (way out: `common.tryAgain`) |
| `common.cameraOff` | Camera access is off | Kameratilgang er av | `colours.cameraOff`, `careLabel.cameraOff`, `problem.camera-off`, `error.cameraOffOne` |
| `common.openSettings` | Open Settings | Åpne Innstillinger | `problem.openSettings` |
| `common.light.dark` | Too dark. Move closer to a window. | For mørkt. Gå nærmere et vindu. | `colours.retake.dark`, `advice.dark.title`, `advice.dark.body` |
| `common.light.mixed` | Mixed light. Daylight only, lamps off. | Blandet lys. Bare dagslys, slå av lampene. | `colours.retake.mixed`, `advice.mixed-light.title`, `advice.mixed-light.body` |
| `colours.retake.no-face` | No face found. Hold the phone at eye level. | Fant ikke ansiktet. Hold telefonen i øyehøyde. | `colours.retake.no-face` |
| `colours.retake.failed` | Could not read this photo | Kunne ikke lese bildet | `colours.retake.failed` |
| `colours.undertone` | Undertone | Undertone | `colours.undertone` |
| `colours.depth` | Depth | Dybde | `colours.depth` |
| `colours.contrast` | Contrast | Kontrast | `colours.contrast` |
| `common.takePhoto` | Take photo | Ta bilde | `selfie.take`, `scan.shutter`, `careLabel.takePhoto`, `common.takePhoto` |

The palette rows follow Revision 1 > F01 Colours (`colours.paletteLabel`, one element per row, swatches hidden).

Cut: `onboarding.intro`, `onboarding.body.why`, `onboarding.colours.why`, `onboarding.done.text`, `colours.tips`, `colours.hijab` (replaced by `colours.hairCovered`, In a hijab), `colours.measured`, `colours.unknown`, `closet.openFailedBody`, `closet.opening`, `closet.openingBody` (the shimmer is the loading state; VoiceOver uses `common.loading`).

## F02 Add pieces

| Key | English | Bokmål | Replaces |
|---|---|---|---|
| `title.addPieces` | Add pieces | Legg til plagg | `title.addPieces` |
| `capture.tips` | Tips | Tips | `capture.tips`, `capture.photoTip` (header icon label) |
| `common.select` | Select | Velg | `sets.select` |
| `capture.tip1Title` | Daylight, facing a window | Dagslys, mot et vindu | `capture.tip1Title` (one daylight line with `colours.tip.daylight`) |
| `capture.tip1Body` | cut | cut | one tip recipe: bold lines only, as the selfie tips |
| `capture.tip2Title` | One piece, plain background | Ett plagg, rolig bakgrunn | `capture.tip2Title` |
| `capture.tip2Body` | cut | cut | one tip recipe: bold lines only, as the selfie tips |
| `capture.tip3Title` | Every edge in view | Alle kanter med | `capture.tip3Title` |
| `capture.gotIt` | Got it | OK | `capture.nextTip` |
| `capture.takePhotos` | Take photos | Ta bilder | `capture.startAdding` |
| `capture.choosePhotos` | Choose photos | Velg bilder | `capture.choosePhotos`, `problem.choosePhotosInstead` |
| `capture.scan` | Scan | Skann | new |
| `capture.byHand` | Add by hand | Legg til manuelt | `capture.addWithout` |
| `capture.stateQueued` | Waiting | Venter | `capture.stateQueued` |
| `capture.statePreparing` | Preparing | Klargjøres | `capture.statePreparing` |
| `capture.stateReady` | Ready | Klar | `capture.stateReady` |
| `capture.stateConfirm` | Needs an answer | Trenger svar | `capture.stateReview` (VoiceOver only, the `{state}` of a Confirm tile; the words of the needs-an-answer recipe) |
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
| `fact.mixed` | Mixed | Blandet | new (fact chip value in Confirm N pieces while the selected pieces differ) |
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
| `common.move` | Move {direction} | Flytt {direction} | new (VoiceOver actions on the box, and on the colour points in F01 Colours) |
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
| `editor.nameHint` | Mauve chiffon hijab | Gammelrosa chiffonhijab | `editor.nameHint` (placeholder; no longer used by F02 Add by hand) |

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
| `closet.worn` | Worn | Brukt | new (More row label) |
| `closet.neverWorn` | Never worn | Aldri brukt | new |
| `closet.putAway` | Put away | Lagt bort | `archive.filter`, `archive.tag` |
| `closet.unavailable` | Unavailable | Utilgjengelig | `closet.away` |
| `adjust.occasion` | Occasion | Anledning | `adjust.occasion` |
| `closet.clearFilters` | Clear filters | Fjern filtre | `closet.clearFilters` |
| `closet.noneFoundTitle` | No pieces found | Fant ingen plagg | `closet.noneFoundTitle` |
| `closet.firstTitle` | Your first piece | Ditt første plagg | `closet.firstTitle` |
| `closet.addPieces` | Add pieces | Legg til plagg | `closet.addFirst` |
| `closet.samples` | Samples | Eksempler | `closet.sample` (`{category}` in `closet.section` and `closet.sectionLabel` for the sample Section: "Samples 13") |
| `tile.label` | {name}, {colour}, {marks} | {name}, {colour}, {marks} | `tile.selected` (VoiceOver) |
| `common.selectedOne` | 1 selected | 1 valgt | new |
| `common.selectedMany` | {count} selected | {count} valgt | new |
| `common.notSelected` | Not selected | Ikke valgt | new (VoiceOver value on an unselected tile in Closet select) |
| `closet.linkSet` | Link as a set | Koble som sett | `sets.link` |
| `closet.linked` | Linked | Koblet | `sets.linked` |
| `looks.new` | New look | Ny look | `title.buildLook` (select footer secondary and the added bar) |
| `pieces.startWithThese` | Start with these | Start med disse | new on this screen (select footer and the added bar) |
| `looks.markWorn` | Mark as worn | Merk som brukt | new on this screen (first quiet Button of the select Footer action row; opens `adjust.today`, `looks.yesterday` in that row as in F09; results `outfit.worn`, `looks.wornYesterday`) |
| `closet.putAwayAction` | Put away | Legg bort | `archive.action` |
| `closet.backInCloset` | Back in the closet | Tilbake i garderoben | `archive.restore` |
| `result.backInCloset` | Put back | Lagt tilbake | new (ResultBar text after Back in the closet, announced; differs from the button so VoiceOver confirms the change) |
| `closet.addedOne` | 1 added | 1 lagt til | new |
| `closet.addedMany` | {count} added | {count} lagt til | new |
| `closet.missingRoles` | Add {roles} to style from your clothes | Legg til {roles} for antrekk fra dine klær | new (kept: needed to act) |
| `error.setTooSmall` | Choose at least two pieces | Velg minst to plagg | `error.setTooSmall` |

`tile.label` is the one VoiceOver label for every tile. `{colour}` is the piece's colour name (`colour.*`), left out when unknown. `{marks}` joins, with commas, the marks the tile shows: `outfit.kept`, `change.inPlan`, and the `piece.away.*` value (or `closet.unavailable`) of an unavailable piece, which is also the tile's visible meta. With no marks it is just `{name}, {colour}`. Closet tiles have no New or Sample mark. A selected tile carries `accessibilityState.selected`. In Closet select an unselected tile carries `accessibilityValue` `common.notSelected`, because iOS reads nothing for selected false. Strip-only variant, hijab tiles in the Change strip: `{name}, {colour}, {reason}, {marks}`, where `{colour}` is left out when the name already holds it and `{reason}` is the full `change.reason.picksUp` or `reason.*` text: "Mauve chiffon hijab, Picks up the plum in the tunic, In Friday's plan". Every strip tile's visible label is the name, as in Closet.

`closet.putAway` (filter, "Put away") and `closet.putAwayAction` (action, "Put away") share EN text, because in English the state and the verb are one word; NB differs (Lagt bort / Legg bort). Accepted: the filter is a chip under More > Availability, the action a Button in the select Footer, and while the filter is set the action reads `closet.backInCloset`.

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
| `careLabel.fibreItem` | {percent} {fibre} | {percent} {fibre} | new (piece detail care label meta, joined with `Intl.ListFormat` unit narrow) |
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
| `style.chipLabel` | {adjust}, {style} | {adjust}, {style} | new (VoiceOver: "Style, Western modest") |
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
| `outfit.notForMe` | Not for me | Passer ikke | `outfit.notForMe` (icon on the outfit card and next to Undo after Another; see Revision 1 > F06) |
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
| `today.banner.planning` | Planning {day} | Planlegger {day} | new (only for a date after tomorrow; Tomorrow opens `today.tomorrow`) |
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

The quiet row under the outfit holds `today.another` alone, full width. Like, Not for me and Save look are icon Buttons on the outfit card (Revision 1 > F06). The Today Footer holds `outfit.wear` alone. Undo is never in the quiet row; it is the Undo slot's action, with `outfit.notForMe` next to it after Another.

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
| `adjust.pickDate` | Choose a date | Velg dato | new (dates after tomorrow; these run under `today.banner.planning`) |
| `adjust.style` | Style | Stil | `adjust.style` |
| `onboarding.style.both` | A mix of both | Litt av begge | `adjust.any` on the style row (the style row is `onboarding.style.*`, the same choice as onboarding and Your style) |
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
| `change.hintHijab` | Changes this hijab | Bytter hijaben | new (VoiceOver hint on the hijab in the flat lay, in place of `change.hint`; the swap mark is hidden) |

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
| `look.change` | Change | Endre | new (Section action on look detail; VoiceOver label `look.changePieces`) |
| `look.changePieces` | Change pieces | Endre plagg | `look.changePieces` (VoiceOver label of `look.change`) |
| `look.remove` | Remove look | Fjern looken | `look.remove` |
| `look.removeTitle` | Remove this look? | Fjerne looken? | `look.removeTitle` |
| `look.removeBody` | The pieces stay in your closet. | Plaggene blir i garderoben. | `look.removeBody` (kept: needed to act, the fear is losing pieces) |
| `look.removeBodyWorn` | The pieces and the days you wore it stay. | Plaggene og dagene du brukte den blir. | new (in place of `look.removeBody` for a look with wears: its row stays on Looks as Worn, not saved, with its name) |
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
| `style.rules` | Style rules | Stilregler | new (Expander title on Your style) |
| `style.rulesSet` | {count} set | {count} valgt | new (closed value of the Style rules Expander) |
| `settings.answers` | Your answers | Svarene dine | `settings.answers` |
| `onboarding.place.title` | Location | Sted | row label |
| `onboarding.body.title` | Body | Kropp | row label |
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
| `settings.replay` | Show intro again | Vis introen igjen | `settings.replay` |
| `settings.replay.title` | Show intro again? | Vise introen igjen? | new (system dialog) |
| `settings.replay.body` | Your pieces and looks stay. | Plaggene og lookene blir. | new (kept: needed to act) |
| `settings.reset` | Delete all data | Slett alle data | `settings.reset` |
| `settings.reset.title` | Delete all data? | Slette alle data? | `settings.reset.title` |
| `settings.reset.text` | Pieces, photos, looks and answers are deleted from this phone. This cannot be undone. | Plagg, bilder, looker og svar slettes fra telefonen. Dette kan ikke angres. | `settings.reset.text` (kept: needed to act) |
| `settings.reset.confirm` | Delete everything | Slett alt | `settings.reset.confirm` |
| `settings.privacy` | Your closet stays on this phone. Your location, rounded to the city, goes to Apple. Clean background photos go to Cloudflare. | Garderoben blir på telefonen. Stedet ditt, rundet av til byen, sendes til Apple. Bilder med Ren bakgrunn sendes til Cloudflare. | `settings.privacy` (kept: privacy; matches `place.privacy`: rounded coordinates, not a city name, reach Apple) |
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
| `stylist.rate` | {part} of {whole} ({percent}) | {part} av {whole} ({percent}) | `stylist.rate` |
| `stylist.noFeedback` | No feedback yet | Ingen tilbakemeldinger ennå | `stylist.noFeedback` |
| `stylist.unreadOne` | 1 piece has no photo reading, so Rules styles it | 1 plagg mangler bildeavlesning, så Regler styler det | `stylist.unreadOne` |
| `stylist.unreadMany` | {count} pieces have no photo reading, so Rules styles them | {count} plagg mangler bildeavlesning, så Regler styler dem | `stylist.unreadMany` |
| `style.occasion` | Occasion | Anledning | `everyday.occasion` |
| `style.style` | Everyday style | Hverdagsstil | `everyday.style` (row label on Your style; value `onboarding.style.*`) |
| `style.hijab` | Hijab | Hijab | `everyday.hijab` (Expander title; its chips and value are the step 2 words, `hijab.always`, `hijab.sometimes`, `onboarding.hijab.no`, Revision 1 > F01 Onboarding) |
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

Cut: `settings.app` (Show intro again, Delete all data, the privacy line and the version sit under `settings.title`, Revision 1 > F11 Profile), `style.sampleNote`, `style.intro`, `everyday.intro`, `coverage.helpFull`, `coverage.helpModerate`, `coverage.helpOwn`, `coverage.helpUnset`, `coverage.sleevesUnset`, `coverage.sleevesWrist`, `coverage.sleevesElbow`, `coverage.hemUnset`, `coverage.hemAnkle`, `coverage.hemCalf` (the chosen values say it), `style.wedding.avoid`, `stylist.help`, `stylist.intro`, `error.everydaySave`, `style.error`.

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
| `common.optionInGroup` | {option}, {group} | {option}, {group} | new (VoiceOver label of an option outside onboarding, Controls and VoiceOver) |
| `common.open` | Open | Åpne | new (ResultBar action) |
| `common.showAll` | Show all | Vis alle | `common.showAllPieces` |
| `result.saved` | Saved | Lagret | new (ResultBar text, announced) |
| `result.changed` | Changed | Byttet | new (ResultBar text, announced) |
| `result.putAway` | Put away | Lagt bort | `archive.archived` (ResultBar text, announced) |
| `result.removed` | Removed | Fjernet | new (label block text of the Removed slot on Add pieces after Remove photo or Same piece, with `common.undo`; focus moves to Undo, so it is not announced) |

The ResultBar is docked in the screen's fixed footer. It crossfades in place of the footer content and never slides or floats, like `today.openLook` and `outfit.thanks`.

### Announcements

`accessibilityLiveRegion` works only on Android. Status lines are also announced with `AccessibilityInfo.announceForAccessibilityWithOptions`, in three ways:

- One-off results, `{ queue: true }`: `today.announce.outfit`, `outfit.thanks`, `result.saved` (also after a never-wear chip), `result.changed`, `result.putAway`, `result.backInCloset`, `closet.linked`, `looks.wornYesterday`, `outfit.worn`, `cutout.selected`, `cutout.noneFound`, `photo.cleanDone`, `scan.pieceAdded`, `colours.taken` (once at capture), the found city on the place step (the name alone), `choice.clearedOne` / `choice.clearedMany`, the calendar month label after a month change (`calendar.monthLabel*`, focus stays on the chevron), `common.error.*`.
- Filter results, `{ queue: true }`, once after the last filter change has held for `wait`: `closet.resultsOne`, `closet.resultsMany`.
- Live camera status, `{ queue: false }`, and only after a status has held for the `dwell` token: `scan.status.*` (with `scan.status.readyVoice` in place of `scan.status.ready`), `scan.captureFailed`, `selfie.guide.*`. A status that changes before `dwell` is never spoken. `scan.speed` is never announced.
- Counts, once, after the batch settles (no tile Waiting or Preparing), with the last value only: on Add pieces `capture.readyOne`, `capture.readyMany`; on Closet, when the queue ends, `progress.readyOne`, `progress.readyMany`; on both, `progress.confirmOne`, `progress.confirmMany`, then `capture.failedOne`, `capture.failedMany` joined after the ready count (a part with 0 left out; the ready count is Ready tiles only); Add pieces announces only while it is the focused screen; and `closet.addedOne`, `closet.addedMany`. The progress card's counting up is never announced; a VoiceOver user who focuses the card hears its current label.

### Controls and VoiceOver

- No target inside a target. The Apple Weather mark sits next to the forecast chip as its own 44 pt target; the capture tile colour sits in its own row.
- Roles for options, three cases:
  - Single choice (Segmented options, single ChipRows, single ChoiceCardGroups and their plain chips): `accessibilityRole="radio"` with `accessibilityState.selected`.
  - Multi choice (I'll never wear chips, the hijab styles group with its cards and `common.noneOfThese`, any multi ChipRow): `checkbox` with `accessibilityState.checked`. Same Lane 1 fallback as Revision 1 > F01 Onboarding > Cards and chips: if `checkbox` does not read "checked" on iOS, the whole group is `button` with `accessibilityState.selected`.
  - Optional single filters she can clear by tapping again (Closet More): `button` with `accessibilityState.selected`.
- Option labels: the option text, followed by its group as `common.optionInGroup` ("Bold, Colour strength", "07:00, Morning outfit") wherever iOS reads no group name: Profile, Your style, I'll never wear and Closet More. The group is the ChipRow label or, with none, the Expander or panel line title. Onboarding steps, where the question header names the group, and cards, which read label then description, take no suffix. The selection is never added as words.
- After any in-place replacement, `AccessibilityInfo.setAccessibilityFocus` moves to the replacing element: the ResultBar text after the Footer buttons, the next card after the check card collapses, the next tile after a capture tile is removed. `today.openLook` keeps focus because it is the same element. The announcement stays queued as above.

### Unchanged sets

These key families keep their keys and values in both languages: `category.*`, `kind.*`, `colour.*`, `value.*`, `attribute.*`, `fibre.*`, `season.*`, `depth.*`, `undertone.*`, `contrast.*`, `shape.*`, `region.*`, `occasion.*` (except `occasion.wedding` and `occasion.barat`, F07), `role.*`, `reason.*`, `outfitName.*`, `outfitTip`, `selfie.guide.*` (except `selfie.guide.still` in NB), `style.western`, `style.desi` (piece style and stylist sentences only; her answer, the Today chip and Adjust use `onboarding.style.*`, Revision 1 > F01 Onboarding). Bokmål fixes inside them:

| Key | Bokmål now | Bokmål new | Why |
|---|---|---|---|
| `selfie.guide.still` | Hold deg i ro | Hold stille | One phrase with scan |
| `style.layout.reasons` | Med begrunnelse | Med begrunnelser | Plural, there are several |
| `forecast.*` | værvarsel | værmelding | One word for forecast |

## Revision 1

Date: 2026-10-03. Source: `owner-feedback.md` rounds 1 and 2, `architecture.md` (Owner decisions, Onboarding, Round 2 feature homes, Domain touches), `use-cases.md`. Everything above still holds unless a row here replaces it. Same rules: labels and values, one term per concept, no em dash, no exclamation marks, every count a `One` / `Many` pair.

### Glossary additions

| Concept | English | Bokmål | Never use |
|---|---|---|---|
| What the app calls her | name | navn | nickname, kallenavn |
| How she wears her head covering (Shayla, Khimar) | hijab style | hijabstil | type, wrap |
| Embellishment level (answer and piece fact) | Sparkle: Plain, A little, Heavy, Bridal | Pynt: Enkel, Litt, Mye, Brudestas | Embellishment (EN UI), Glitter, Ingen (NB) |
| Her everyday style answer | Western modest, Abaya or desi, A mix of both | Vestlig og tildekket, Abaya eller desi, Litt av begge | Western, Both (her answer); Desi alone (her answer) |
| Her coverage answer | Fully covered, Modest, Relaxed, No preference | Helt dekket, Moderat, Mindre dekket, Spiller ingen rolle | Full: wrist and ankle (cut) |
| What one piece covers | Fully covered, Modest, Needs layering | Helt dekket, Moderat, Trenger et lag | Partial, Short |
| When a piece is worn in the year | Season: Summer, Winter, All year | Sesong: Sommer, Vinter, Hele året | "Season" for the colour season (see Colours) |
| A fact the coverage reading still needs | Needs details | Mangler detaljer | Incomplete, Missing info |
| Where she is, for the weather | location | sted (her answer); posisjon only in system words: Finn posisjonen min, Posisjonstilgang er av, Kunne ikke finne posisjonen din | position (EN UI) |
| Daily notification | Morning outfit | Morgenantrekk | Reminder, Daily outfit |
| Her hijab answer | Always, Sometimes, No | Alltid, Noen ganger, Nei | Not needed, Trengs ikke (on screen; `not-needed` is the stored value) |
| The outfit for the next day (21:00 notification) | Tomorrow's outfit | Morgendagens antrekk | Tomorrow's look, Planning {day} for tomorrow |
| Row of pieces she has not worn | Rediscover | Lite brukt | Forgotten, Unworn; Gjenoppdag, Lenge siden sist (NB: false for a piece never worn) |
| Positive outfit feedback | Like | Liker | Love, Thumbs up |
| Month view of wears | Calendar | Kalender | Wear calendar, History |
| Share of the closet worn in a month | Variety | Variasjon | Usage, Rotation |
| Pieces the stylist leaves out | I'll never wear | Jeg bruker aldri | Dislikes, Blocked |
| Pieces Rediscover puts first | Trying to wear more of | Vil bruke mer | Favourites, Wishlist |
| How much the stylist knows | The stylist knows {percent} of your style | Stilisten kjenner {percent} av stilen din | profile score, completeness |
| Photos preparing in the background | new pieces | nye plagg | uploads, imports |

"Use my location" is "Finn posisjonen min", never "Bruk ...": "Bruk" means wear.

### F01 Onboarding

Each step shows its question as the only heading. No step title above it, no line under it. Two steps show a label instead, because they ask nothing a sentence would: the done step (`onboarding.done.title`) and step 9 (`profile.morning`, the same words as its Profile row, because Off and the times answer a setting, not a question). The step title carries the step as its `accessibilityValue` (`onboarding.progressLabel`); the progress bar is hidden from VoiceOver. Next and the back chevron keep their F01 keys. There is no Skip: Next on an unanswered step skips it. F01 no longer uses `onboarding.progress`, `common.skip`, `colours.photo`, `colours.adjust`, `onboarding.colours.swatch` or `place.city`.

`{step}` and `{total}` in `onboarding.progressLabel` count only the steps she will see (`stepsFor(answers)`, done step left out). The total is recomputed on the hijab step the moment the answer changes, before Next, so no step she reaches is renumbered: with No, coverage is "Step 3 of 9" from the first time she sees it.

| Key | English | Bokmål | Replaces |
|---|---|---|---|
| `onboarding.name.question` | What's your name? | Hva heter du? | new (step 1; the app never speaks as "we") |
| `profile.name` | Name | Navn | new (the Profile row label only; on step 1 the Field's VoiceOver label is `onboarding.name.question`, so Voice Control finds it by the words on screen) |
| `onboarding.hijab.question` | Do you wear a hijab? | Bruker du hijab? | `onboarding.hijab.question` (step 2) |
| `hijab.always` | Always | Alltid | `onboarding.hijab.always`, `everyday.always` |
| `hijab.sometimes` | Sometimes | Noen ganger | `onboarding.hijab.sometimes` |
| `onboarding.hijab.no` | No | Nei | `onboarding.hijab.no`, `everyday.notNeeded` (writes `not-needed`) |
| `onboarding.hijabStyles.question` | Which styles do you wear? | Hvilke stiler bruker du? | new (step 3, the owner's words; it follows the hijab question, so "styles" needs no more) |
| `hijabStyle.hijab` | Hijab | Hijab | new |
| `hijabStyle.shayla` | Shayla | Shayla | new |
| `hijabStyle.al-amira` | Al-Amira | Al-Amira | new |
| `hijabStyle.khimar` | Khimar | Khimar | new |
| `hijabStyle.chador` | Chador | Chador | new |
| `hijabStyle.niqab` | Niqab | Niqab | new |
| `hijabStyle.burqa` | Burqa | Burka | new |
| `hijabStyle.hijab.description` | scarf wrapped and pinned close to the face | skjerf viklet og festet tett rundt ansiktet | new (in the card's `accessibilityLabel`, never a hint) |
| `hijabStyle.shayla.description` | long scarf, loose over one shoulder | langt skjerf, løst over den ene skulderen | new |
| `hijabStyle.al-amira.description` | two pieces, a cap and a tube scarf | to deler, en lue og et rørskjerf | new |
| `hijabStyle.khimar.description` | cape to the waist, face open | kappe til midjen, ansiktet fritt | new |
| `hijabStyle.chador.description` | full-length cloak, held closed | kappe til gulvet, holdt sammen | new |
| `hijabStyle.niqab.description` | veil over the face, eyes open | slør over ansiktet, øynene frie | new |
| `hijabStyle.burqa.description` | covers face and body, mesh over the eyes | dekker ansikt og kropp, nett foran øynene | new |
| `common.noneOfThese` | None of these | Ingen av disse | new (plain chip, clears the others; a `checkbox` like the cards, F12 Controls and VoiceOver) |
| `choice.clearedOne` | 1 choice cleared | 1 valg fjernet | new (VoiceOver only, queued, when a tap clears another card) |
| `choice.clearedMany` | {count} choices cleared | {count} valg fjernet | new (VoiceOver only) |
| `onboarding.coverage.question` | How covered do you like your everyday outfits? | Hvor dekket vil du være til hverdags? | `onboarding.coverage.question` (step 4) |
| `coverage.full` | Fully covered | Helt dekket | `onboarding.coverage.full` ("Full: wrist and ankle" cut from the card) |
| `coverage.moderate` | Modest | Moderat | `onboarding.coverage.moderate` |
| `coverage.relaxed` | Relaxed | Mindre dekket | new |
| `coverage.full.description` | sleeves to the wrist, to the ankle | ermer til håndleddet, til ankelen | new (in the card's `accessibilityLabel`, never a hint) |
| `coverage.moderate.description` | sleeves to the elbow, to mid-calf | ermer til albuen, til midt på leggen | new |
| `coverage.relaxed.description` | any sleeves, any length | alle ermer, alle lengder | new |
| `coverage.noPreference` | No preference | Spiller ingen rolle | new (plain chip, no description. Not `coverage.none`: that key is the stylist's coverage error in `src/i18n/en.ts` and `src/domain/styling.ts`) |
| `coverage.own` | My own limit | Egen grense | `onboarding.coverage.own` (Your style only, fifth choice) |
| `onboarding.style.question` | What do you wear most days? | Hva bruker du til vanlig? | `onboarding.styleLean.question` (step 5) |
| `onboarding.style.western` | Western modest | Vestlig og tildekket | `onboarding.styleLean.western` (owner round 1, item 3) |
| `onboarding.style.desi` | Abaya or desi | Abaya eller desi | `onboarding.styleLean.desi` |
| `onboarding.style.both` | A mix of both | Litt av begge | `onboarding.styleLean.both` |
| `onboarding.fit.question` | How do you like your clothes to sit? | Hvordan vil du at klærne skal sitte? | `onboarding.fit.question` (step 6) |
| `onboarding.fit.loose` | Loose | Løs | `onboarding.fit.loose` |
| `onboarding.fit.structured` | Structured | Strukturert | `onboarding.fit.structured` |
| `onboarding.depends` | It depends | Det varierer | `onboarding.fit.depends`, `onboarding.colourLean.depends` (plain chip) |
| `onboarding.sparkle.question` | How much sparkle? | Hvor mye pynt? | new (step 7, the owner's words) |
| `sparkle.plain` | Plain | Enkel | `value.embellishment.none` (not "Ingen", which is `common.none` and reads as an empty value) |
| `sparkle.little` | A little | Litt | `value.embellishment.light` |
| `sparkle.heavy` | Heavy | Mye | `value.embellishment.heavy` |
| `sparkle.bridal` | Bridal | Brudestas | new |
| `onboarding.place.question` | Where are you? | Hvor holder du til? | `onboarding.place.title` on the step (step 8) |
| `place.useLocation` | Use my location | Finn posisjonen min | `onboarding.city.find` |
| `place.search` | Search for your city | Søk etter byen din | new (the one search field under Use my location: its placeholder and its `accessibilityLabel`; no separate choice control. The step question is the visible label once a city fills the field; the Profile Location answer keeps its header title `onboarding.place.title`, so the field never stands without one) |
| `place.finding` | Finding your city | Finner byen din | new (VoiceOver only: the field's `accessibilityValue` with `accessibilityState.busy` while it looks up the city; not announced) |
| `place.locationOff` | Location access is off | Posisjonstilgang er av | new (the app's permission is denied; with `common.openSettings`, same form as `common.cameraOff`) |
| `place.notFound` | Could not find your location | Kunne ikke finne posisjonen din | new (location unavailable; in the message slot under the search field, focused) |
| `onboarding.city.notFound` | Could not find this city | Kunne ikke finne byen | `onboarding.city.notFound` (one error grammar with `place.notFound`) |
| `place.privacy` | Rounded to your city, sent only to Apple for the weather. | Rundes av til byen og sendes bare til Apple for været. | `onboarding.city.privacy` (kept: privacy; `placeFrom` keeps rounded coordinates, and those reach Apple for the weather and the city lookup) |
| `profile.morning` | Morning outfit | Morgenantrekk | new (step 9 heading and the Profile row, F11 Profile) |
| `notify.off` | Off | Av | new (step 9 and the Profile row, one ChipRow; selected first) |
| `notify.time` | {time} | {time} | new (06:00, 07:00, 08:00 from `Intl.DateTimeFormat`, `hour: "2-digit", minute: "2-digit", hourCycle: "h23"`, so en-US never shows "07:00 AM") |
| `notify.nightBefore` | {time} the night before | {time} kvelden før | new (21:00) |
| `notify.denied` | Notification access is off | Varseltilgang er av | new (with `common.openSettings` under the chips; same form as `common.cameraOff` and `place.locationOff`) |
| `onboarding.colours.question` | Which colours suit you? | Hvilke farger kler deg? | new (step 10 heading; `onboarding.colours.title` stays for the Profile row and the colours screen title) |
| `colours.selfie` | Take a selfie | Ta en selfie | `onboarding.colours.selfie`, `colours.camera` |
| `onboarding.done.title` | All set | Alt klart | `onboarding.done.title` |

The place step is `place.useLocation` (secondary Button), the search field under it, and `place.privacy` last, all there from the first frame. The found city, from either way, is the field's text, with a trailing check, and replaces `place.finding` as its value: VoiceOver reads the label `place.search` and the value "Oslo"; the check is hidden. The city name is announced once, queued, when it is found. Every place message (`place.locationOff` with `common.openSettings`, `place.notFound`, `onboarding.city.notFound`, `common.offline`) shows in one slot under the field, so nothing shows between the two choices (`flows/F01-start.md` > Step 8).

Step 9 shows the same five chips as the Profile row (`notify.off`, `notify.time` three times and `notify.nightBefore`) under `profile.morning` and nothing else; Off is selected first. `notify.time` chips: Lane 1 checks with VoiceOver in EN and NB how "06:00" is read. If it reads "zero six zero zero", each chip's `accessibilityLabel` comes from `Intl.DateTimeFormat` with `hour: "numeric", minute: "2-digit", hourCycle: "h23"`, so what VoiceOver speaks and what Voice Control matches stay the chip's text.

Cut: `onboarding.city.found`, `onboarding.city.label`, `onboarding.hijab.title`, `onboarding.taste.title`, `onboarding.notify.question` (step 9 shows `profile.morning`), `hijab.notNeeded` (no screen shows it: step 2 and Your style say No, Today has no hijab chip), `onboarding.body.title` on the step (Profile keeps it), `onboarding.colourLean.*` on the step (the Colours answer keeps them), `onboarding.colours.swatch`, `hijabStyle.*.hint` and `coverage.*.hint` (the `*.description` keys).

Cards and chips:

- Roles follow F12 Controls and VoiceOver: single groups are `radio` with `accessibilityState.selected`; hijab styles is the one multi group, so every card and the `common.noneOfThese` plain chip is a `checkbox` with `accessibilityState.checked`. Lane 1 device check: iOS has no native checkbox trait, so confirm that RN `accessibilityRole="checkbox"` reads "checked" / "not checked" in EN and NB; if it does not, the cards and the chip all fall back to role `button` with `accessibilityState.selected`.
- The label is the card text. Hijab style and coverage cards join their `*.description` after it with ", " in the same `accessibilityLabel` ("Shayla, long scarf, loose over one shoulder"), never `accessibilityHint`, which can be switched off (`design-system.md` 18). The figure is hidden from VoiceOver and is the only thing that shows what a Shayla or Modest is, so the description says it; it starts lower case because it follows the label. Hijab and Shayla follow the architect's C1-03 decision (Hijab wrapped and pinned close, Shayla long and loose over one shoulder). The descriptions apply on the onboarding step and in the Your style Expander.
- Her style is the owner's word set: Western modest, Abaya or desi, A mix of both (`onboarding.style.*`), on the step, Your style, the Your style meta on Profile, the Today chip and Adjust. The labels say the meaning, so the style cards need no description. Piece style keeps `style.western`, `style.desi` "Desi" and `style.both`, because a lehenga is desi, not an abaya.
- Her hijab answer is one word set: Always, Sometimes, No (`hijab.always`, `hijab.sometimes`, `onboarding.hijab.no`), on step 2 and on Your style under `style.hijab`.
- Sparkle chips are words only, no glyphs.
- When a tap clears other cards (None of these, or a style card that clears None of these), `choice.clearedOne` / `choice.clearedMany` is announced once, queued, after the tapped card's own state.

### F01 Colours

| Key | English | Bokmål | Replaces |
|---|---|---|---|
| `colours.tip.daylight` | Daylight, facing a window | Dagslys, mot et vindu | `colours.tips` |
| `colours.tip.lens` | Wipe the lens | Tørk av linsen | new |
| `colours.tip.glasses` | No glasses | Ingen briller | new |
| `colours.tip.lip` | No bold lipstick | Ingen sterk leppestift | new |
| `colours.openCamera` | Open camera | Åpne kameraet | new |
| `selfie.guide.find` | Look into the camera | Se inn i kameraet | `selfie.guide.find` |
| `selfie.guide.dark` | A bit dark | Litt mørkt | `selfie.guide.dark` |
| `selfie.guide.closer` | Move closer | Kom nærmere | `selfie.guide.closer` |
| `selfie.guide.back` | Move back a little | Litt lenger unna | `selfie.guide.back` |
| `selfie.guide.centre` | Centre your face | Sentrer ansiktet | `selfie.guide.centre` |
| `selfie.guide.straight` | Look straight ahead | Se rett frem | `selfie.guide.straight` |
| `selfie.guide.still` | Hold still | Hold stille | `selfie.guide.still` |
| `selfie.guide.ready` | Ready | Klar | `selfie.guide.ready` |
| `colours.taken` | Photo taken | Bilde tatt | new (VoiceOver only, announced once at capture, queued, under Reduce Motion too) |
| `colours.circleLabel` | Camera, {guide} | Kamera, {guide} | new (VoiceOver label of the face circle; `{guide}` is the current `selfie.guide.*` or retake reason) |
| `colours.library` | Choose photo | Velg bilde | `colours.library` (the quiet Button under the feedback line in the camera phase and in its unavailable and failed states, `design-system.md` 17, `motion.md` > Face circle. The simulator, a denied camera, Switch Control and anyone who cannot hold still need it; a library photo skips the tips, the face circle and auto capture) |
| `colours.busy` | Measuring your colours | Måler fargene dine | unchanged |
| `season.*` | unchanged | unchanged | `onboarding.colours.saved`, `colours.result`, `colours.season` (cut: the palette heading is the season name alone, "Deep autumn", straight from `season.*`) |
| `colours.bestShades` | Best hijab shades | Beste hijabfarger | `colours.best` |
| `colours.bestShadesPlain` | Best shades | Beste farger | new (in place of `colours.bestShades` while her hijab answer is No) |
| `colours.goEasy` | Go easy on | Med måte | new |
| `colours.notMe` | These don't look like me | Dette stemmer ikke | new (one tap opens, in place and in this order: Retake, `colours.hairCovered`, `colours.undertone`, `colours.depth`, `colours.contrast`, then the points; no Expander title. The trigger carries `accessibilityState.expanded`; focus moves to Retake) |
| `capture.retake` | Retake | Ta på nytt | new on this screen |
| `colours.hairCovered` | In a hijab | Med hijab | new (the toggle; starts on for Always and Sometimes) |
| `colours.skin`, `colours.eyes`, `colours.hair` | Skin, Eyes, Hair | Hud, Øyne, Hår | the point labels under These don't look like me, read after Contrast in this order; Hair only while In a hijab is off. Each point's VoiceOver actions are `common.move` with `direction.*` (F02), as on the capture box |
| `colours.save` | Save colours | Lagre fargene | unchanged |
| `colours.camera.privacy` | The selfie stays on this phone. | Selfien blir på telefonen. | `colours.deleted` (kept: privacy) |
| `colours.paletteLabel` | {label}: {names} | {label}: {names} | new (VoiceOver label of each swatch row: `{label}` is the row's Section title, `{names}` the `colour.*` names joined with `Intl.ListFormat`: "Go easy on: mustard, olive, rust" / "Med måte: sennep, oliven, rust"; the two rows are drawn alike, so a touch explorer who skips the header still knows which set she is on) |

Each swatch row is one VoiceOver element labelled `colours.paletteLabel`; the swatches inside are hidden, because they cannot be pressed. The camera screen has no shutter and no button text over the camera; the guide line is the only text there. The face circle is the one VoiceOver element over the camera, labelled `colours.circleLabel`. `colours.library` follows it in reading order, and is hidden only while measuring. While a face is found, the circle has `accessibilityRole="button"`, keeps `activate` for the double tap, and carries a second, non-default custom action `takePhoto` named `common.takePhoto`, so VoiceOver says "Actions available" and the rotor lists Take photo; the screen answers `magicTap` the same way. Its label always starts with the fixed word "Camera", so Voice Control "Tap Camera" finds it whatever the guide says. Switch Control, VoiceOver and a hand that cannot hold still for `dwell` can take the photo; nothing is drawn for it. Retake reasons after measuring (`selfie.guide.dark` for a dark photo, `common.light.mixed`, `colours.retake.no-face`, `colours.retake.failed`) show in that same line when the camera reopens, hold it for at least `linger` before any guide can replace them, and are announced with `{ queue: true }`. `common.light.dark` stays for capture only, so this line has one phrasing for dark. The line reserves the height of the tallest of `selfie.guide.*` and these four reasons, measured in the hidden layer in the current language and text size (`motion.md` > Face circle and auto capture).

"Season" alone now means the wear season of a piece. The colour season is shown by its name only ("Deep autumn"), so the two never share a label.

Cut: `colours.tips`, `colours.best`, `colours.season`, `colours.adjust`, `colours.photo` (the result is a palette), `onboarding.colours.swatch`, `point.moveUp`, `point.moveDown`, `point.moveLeft`, `point.moveRight` (`common.move` with `direction.*`). `common.takePhoto` is not drawn on this screen; it is only the name of the circle's `takePhoto` custom action.

### F02 and F04 Background tagging

| Key | English | Bokmål | Replaces |
|---|---|---|---|
| `progress.newOne` | 1 new piece | 1 nytt plagg | `closet.preparingOne` (while it prepares; then `progress.readyOne`) |
| `progress.newMany` | {total} new pieces, {ready} of {total} ready | {total} nye plagg, {ready} av {total} klare | `closet.preparingMany` |
| `progress.readyOne` | 1 ready to add | 1 klar til å legges til | `closet.readyOne` (nothing is in the closet until Add, so never "new piece ready") |
| `progress.readyMany` | {count} ready to add | {count} klare til å legges til | `closet.readyMany` |
| `progress.confirmOne` | 1 to confirm | 1 å bekrefte | new (joined after the ready count with ", ") |
| `progress.confirmMany` | {count} to confirm | {count} å bekrefte | new |
| `capture.failedOne` | 1 could not finish | 1 ble ikke ferdig | unchanged (joined after the ready count with ", ") |
| `capture.failedMany` | {count} could not finish | {count} ble ikke ferdig | unchanged |
| `progress.moreGroups` | +{count} | +{count} | new (the category groups that do not fit the one meta line; hidden from VoiceOver, which reads every group) |

The card is one door: one `accessibilityRole="button"` element with a trailing chevron and no hint, that pushes Add pieces. It has no Review button and no other target inside it. Visible: the progress line (`progress.new*`, or when done `progress.ready*` with `progress.confirm*` and `capture.failed*` joined by ", ", a part with 0 left out), the line bar, then the category meta, each group a `closet.section` ("Hijabs & scarves 3"). Below `large` the meta is one line joined with " · ", and the groups that do not fit become a trailing `progress.moreGroups` ("Hijabs & scarves 3 · Kurtas & tunics 1 · +1"); at `large` and `ax` it wraps, one group per line. VoiceOver label: the progress line, then each group as `closet.sectionLabel` ("Hijabs & scarves, 3 pieces"); the bar is hidden. "Ready" counts tiles Add can take (Ready tiles only), the same number as the Add pieces Footer.

There is no Closet tab badge: the card is the one place progress shows.

One category family for every label: `category.*` (unchanged set: "Hijabs & scarves", "Kurtas & tunics", "Trousers & skirts", "Layers"; NB "Kurtaer og tunikaer", "Bukser og skjørt", "Jakker og lag") on Closet sections, Closet and New look category filters, the progress card, the never-wear groups and piece facts. `role.*List` stays only inside the `closet.missingRoles` sentence. There is no `categoryShort.*`.

### F04 Closet sections and filters

| Key | English | Bokmål | Replaces |
|---|---|---|---|
| `closet.section` | {category} {count} | {category} {count} | new (Section title; the count is in `inkMuted`) |
| `closet.sectionLabel` | {category}, {pieces} | {category}, {pieces} | new (VoiceOver; `{pieces}` is `common.pieceCountOne` / `Many`. `design-system.md` 5 calls it `closet.section.count`; this key wins, because a key under the value key `closet.section` cannot exist) |
| `fact.colour` | Colour | Farge | new on this screen (More row label) |
| `coverage.levelLabel` | Coverage | Dekning | new on this screen (More row label) |
| `pieceCoverage.full` | Fully covered | Helt dekket | new |
| `pieceCoverage.moderate` | Modest | Moderat | new |
| `pieceCoverage.layer` | Needs layering | Trenger et lag | new |
| `fact.season` | Season | Sesong | new (More row label and piece fact key) |
| `value.season.*` | unchanged | unchanged | Summer, Winter, All year |
| `closet.worn` | Worn | Brukt | unchanged |
| `piece.availability` | Availability | Tilgjengelighet | new on this screen |
| `adjust.style` | Style | Stil | new on this screen |
| `adjust.occasion` | Occasion | Anledning | unchanged |
| `closet.putAway` | Put away | Lagt bort | unchanged |
| `piece.facts.title` | Details | Detaljer | new on this screen (More line label over `piece.needsDetails`) |
| `piece.needsDetails` | Needs details | Mangler detaljer | new (filter chip and piece chip. On a tile it is VoiceOver only, one of the `{marks}` in `tile.label`; the visible cue is the needs-an-answer dot, never a `mark`, which would break the 9 character rule) |
| `closet.resultsOne` | 1 piece found | 1 plagg funnet | new (announced once, queued, after the last filter change has held for `wait`) |
| `closet.resultsMany` | {count} pieces found | {count} plagg funnet | new |

The More panel lists its groups in this order with no lead text, each one line: Colour, Coverage, Season, Worn, Availability, Style, Occasion, Details. Put away is the second chip of Availability; Details holds `piece.needsDetails` alone, so a gap in the data never sits beside a coverage value. A group label is a `headline` label, its values are chips: `button` with `accessibilityState.selected`, each read with `common.optionInGroup` (F12 Controls and VoiceOver).

### F04 Closet, revision 2

| Key | English | Bokmål | Replaces |
|---|---|---|---|
| `closet.markWearMost` | Mark what I wear most | Merk det jeg bruker mest | new ("N added" Banner action while no owned piece has a wear; opens Closet select with nothing selected) |

Closet select has no header menu: its title is `common.selectedOne` / `common.selectedMany`, and every select action is in the pinned Footer. `looks.markWorn`, `closet.linkSet` and `closet.putAwayAction` / `closet.backInCloset` are quiet Buttons in the action row above the `looks.new` / `pieces.startWithThese` pair, and Mark as worn opens `adjust.today` / `looks.yesterday` as action chips in that row. The More chip keeps `closet.more` as its label; its VoiceOver value is the set filters joined with `Intl.ListFormat` `{ type: "unit", style: "short" }` ("Never worn, Winter", no "and"), fallback a plain ", " join. The panel's Worn group holds `closet.notWornLately` and `closet.neverWorn`, Availability holds `closet.unavailable` and `closet.putAway`, and Details, the last line, holds `piece.needsDetails`. Cut by `flows/F04-closet.md`: `common.actions`, `closet.moreValue`, `closet.moreCount`, `closet.filterClearHint`, `closet.sampleCountOne`, `closet.sampleCountMany`, `closet.preparingOne`, `closet.preparingMany`, `closet.readyOne`, `closet.readyMany`.

### F05 Piece facts

| Key | English | Bokmål | Replaces |
|---|---|---|---|
| `fact.coverage` | Coverage | Dekning | new (read only; value is `pieceCoverage.*`) |
| `fact.sparkle` | Sparkle | Pynt | `attribute.embellishment` |
| `sparkle.*` | Plain, A little, Heavy, Bridal | Enkel, Litt, Mye, Brudestas | `value.embellishment.*` (the same words as the answer, F01 Onboarding) |
| `fact.season` | Season | Sesong | new (read only, follows Warmth and fabric) |
| `fact.sheer` | See-through | Gjennomsiktig | `fact.sheer` (fact chip key, and the drawn label of the See-through step in Needs details) |
| `piece.needsDetails` | Needs details | Mangler detaljer | new (first chip on piece detail; opens the first open fact. On New piece, F02 S2, the `accessibilityValue` of an unanswered sleeve, see-through or length row) |

These chips are for piece detail. New piece (F02 S2) shows Colour, Category, Garment, Style, Warmth and Sparkle; unread sleeve, see-through and length are rows there, with no Coverage, Season or Needs details chip. No line explains why Coverage or Season cannot be set; the chip is read only and has no chevron.

### F06 Today

| Key | English | Bokmål | Replaces |
|---|---|---|---|
| `today.greeting.morning` | Good morning, {name} | God morgen, {name} | `nav.today` as the heading; the `today.greeting.*` set is also the notification title, by the hour it fires |
| `today.greeting.afternoon` | Good afternoon, {name} | God ettermiddag, {name} | new |
| `today.greeting.evening` | Good evening, {name} | God kveld, {name} | new |
| `today.greeting.morningPlain` | Good morning | God morgen | new (no name only; a named greeting never falls back to these, `flows/F06-today.md`) |
| `today.greeting.afternoonPlain` | Good afternoon | God ettermiddag | new |
| `today.greeting.eveningPlain` | Good evening | God kveld | new |
| `today.greeting.short` | Hi, {name} | Hei, {name} | new (the named greeting's one fallback before `nav.today`: the time of day drops before her name, and `nav.today` shows only when "Hi, {name}" does not fit either, `flows/F06-today.md`) |
| `outfit.like` | Like | Liker | new (icon toggle on the outfit card, VoiceOver label; `accessibilityState.selected` when on, role `button`, never `checkbox`) |
| `outfit.notForMe` | Not for me | Passer ikke | `outfit.notForMe` (thumbs down icon on the card, and the visible text of the quiet Button next to Undo after Another; `accessibilityState.expanded` on the trigger that opened the reason chips, never checked or selected) |
| `outfit.notForMeSkipped` | Not for me, previous outfit | Passer ikke, forrige antrekk | new (`accessibilityLabel` of the quiet Button next to Undo after Another; starts with the visible text for Voice Control, and tells it apart from the card's thumbs down, which rates the outfit shown) |
| `common.saveLook` | Save look | Lagre look | `common.saveLook` (Save icon on the card before saving; no selected state) |
| `today.openLook` | Open look | Åpne look | new (the same Save icon once the outfit is a look: label `today.openLook`, value `result.saved`, no selected state, so VoiceOver says "Open look, Saved" once) |
| `outfit.thanks` | Noted for next time | Notert til neste gang | unchanged (VoiceOver only after Like, announced once per outfit; visible in the Undo slot with Undo after a reason chip) |
| `today.lastCombination` | Back to the first outfit | Tilbake til det første antrekket | unchanged (now the label of the quiet row's Another Button while the last combination is shown; the next press starts over, `flows/F06-today.md`) |
| `today.onlyCombination` | The only outfit for these choices | Det eneste antrekket med disse valgene | unchanged (a `footnote` line in the quiet row's place when there is no Another) |
| `coverageNote.arms` | {piece} covers the arms. | {piece} dekker armene. | new |
| `coverageNote.ankleOne` | {piece} reaches the ankle. | {piece} når til ankelen. | new |
| `coverageNote.ankleMany` | {piece} reach the ankle. | {piece} når til ankelen. | new (EN plural kinds) |
| `coverageNote.calfOne` | {piece} reaches mid-calf. | {piece} når til midt på leggen. | new |
| `coverageNote.calfMany` | {piece} reach mid-calf. | {piece} når til midt på leggen. | new |
| `today.rediscover` | Rediscover | Lite brukt | new (Section title; true for never worn and not worn lately) |
| `rediscover.hint` | Starts with this piece | Starter med dette plagget | new (VoiceOver hint on a tile) |
| `rediscover.action` | Start with {name} | Start med {name} | new (the tile's named custom action, "Start with Grey cardigan", because hints can be switched off) |
| `today.tomorrow` | Tomorrow's outfit | Morgendagens antrekk | new (Banner title of the tomorrow session, opened from the 21:00 notification) |
| `today.backToToday` | Back to today | Tilbake til i dag | unchanged |
| `today.showTomorrow` | Show | Vis | new (one-line Banner after Back to today) |
| `today.showTomorrowLabel` | Show tomorrow's outfit | Vis morgendagens antrekk | new (`accessibilityLabel` of `today.showTomorrow`; starts with the visible text, for Voice Control) |
| `weather.chipLabelTomorrow` | {adjust} tomorrow, {weather} | {adjust} i morgen, {weather} | new (VoiceOver on the weather chip while Tomorrow's outfit is shown, "Weather tomorrow, Oslo 2 to 7 degrees"; the chip is read before the Banner, so it says tomorrow itself; {weather} uses `weather.spoken`) |
| `notify.today` | See today's outfit | Se dagens antrekk | new (notification body, 06:00 to 08:00; nothing is styled before she opens it) |
| `notify.tomorrow` | See tomorrow's outfit | Se morgendagens antrekk | new (notification body, 21:00) |

`{piece}` in `coverageNote.*` is a new key family `kind.subject.*`, layers and bottoms only, definite in both languages (EN "The", as `reason.*` and `role.the.*` write it; NB the definite form), so it reads as a sentence:

| Kind | EN | NB | EN key |
|---|---|---|---|
| blazer | The blazer | Blazeren | One |
| cardigan | The cardigan | Cardiganen | One |
| jacket | The jacket | Jakken | One |
| coat | The coat | Kåpen | One |
| trousers | The trousers | Buksen | Many |
| jeans | The jeans | Jeansen | Many |
| wide-leg | The wide-leg trousers | Den vide buksen | Many |
| shalwar | The shalwar | Shalwaren | One |
| churidar | The churidar | Churidaren | One |
| sharara | The sharara | Shararaen | One |
| gharara | The gharara | Ghararaen | One |
| lehenga | The lehenga | Lehengaen | One |
| skirt | The skirt | Skjørtet | One |

Waistcoat and shorts are never named (no sleeves, never reach the calf). The coverage note is the second sentence of the reason line (`today-reason`), one per outfit: the same `footnote` `inkMuted` text element, no symbol, no slot of its own, ending with a full stop because it joins a sentence: "Picks up the brown in the loafers. The blazer covers the arms." It sits in the reason line's two-line reserved slot (`design-system.md` 11 FlatLay > Reason line), which grows past two lines at large text.

Length rule for the reason line: every `reason.*` followed by every `coverageNote.*` fits two `footnote` lines at default size in 343 pt, in English and bokmål. The fill is the one Today's hidden layer measures with: `{a}` and `{b}` take the longest name `nameFor` gives (longest `colour.*`, then longest `kind.*`), `{occasion}` the longest occasion phrase, `{piece}` the longest `kind.subject.*` (EN "The wide-leg trousers", 4 characters longer than before the article, so the test re-runs on this revision). A unit test renders every pair filled that way and fails past two lines; a pair that fails is shortened here, never capped on screen. It is not drawn while a check card is open.

`kind.subject.wide-leg` is "The wide-leg trousers", not `kind.wide-leg` "Wide-leg": the only grammar exception to one name per piece kind, because "The wide-leg reach the ankle" is not a sentence.

Rediscover tiles show the piece name only, as in Closet. VoiceOver: `tile.label`, then `closet.neverWorn` or `looks.lastWorn` as the value.

Like is the one toggle: `accessibilityState.selected`, never the word, and a second tap turns it off. After Like nothing is added on screen: `outfit.thanks` is announced once per outfit, VoiceOver only. The Undo slot with `common.undo` shows only after Another, a Change strip pick, Show on Today or Fill the gap, with `outfit.notForMe` next to Undo after Another, and after a reason chip, where `outfit.thanks` sits beside Undo and Undo takes the reason back. Not for me shows twice after Another, the card icon (the outfit shown, chips under the reason line) and the slot Button (the skipped outfit, chips under the Undo slot, VoiceOver `outfit.notForMeSkipped`); only the trigger that opened the chips carries `accessibilityState.expanded`, and whichever one was pressed, focus moves to the first reason chip. Save look has no selected state; its label and value say it. The two Buttons in the Undo slot (`outfit.notForMe` or `outfit.thanks` beside `common.undo`) sit on one line only while both fit it whole in the current language; at `ax`, or when they do not fit, they stack, Undo first, so neither is truncated at AX5 in bokmål.

The quiet row under the outfit holds `today.another` alone, a full-width quiet Button. `outfit.like`, `outfit.notForMe` and `common.saveLook` / `today.openLook` are 44 pt icon Buttons on the outfit card's title line, in that order. `outfit.notForMe` also shows as a quiet Button next to `common.undo` in the Undo slot after Another; it opens the same reason chips as the card's thumbs down, under itself, and records the reason against the outfit she skipped, not the one shown. The Today Footer holds `outfit.wear` alone.

### F09 Calendar

| Key | English | Bokmål | Replaces |
|---|---|---|---|
| `calendar.title` | Calendar | Kalender | new (screen title; Looks header icon label) |
| `calendar.month` | {month} | {month} | new (`Intl.DateTimeFormat`, `month: "long", year: "numeric"`: "October 2026", "oktober 2026") |
| `calendar.previous` | Previous month | Forrige måned | new (VoiceOver on the chevron) |
| `calendar.next` | Next month | Neste måned | new |
| `calendar.monthLabelOne` | {month}, worn on 1 day | {month}, brukt 1 dag | new (VoiceOver label of the month title; `{month}` is `calendar.month`) |
| `calendar.monthLabelMany` | {month}, worn on {count} days | {month}, brukt {count} dager | new (with no wears the label is `calendar.month` alone and `calendar.emptyMonth` follows) |
| `stats.mostWorn` | Most worn | Mest brukt | unchanged |
| `calendar.variety` | Variety | Variasjon | new (Row title; the Row is a door that opens Closet with Not worn lately) |
| `calendar.varietyValue` | {percent} of your closet, last 30 days | {percent} av garderoben de siste 30 dagene | new (the Variety Row's meta; the same 30 days as Not worn lately, which it opens. The Variety Row shows only on the current month, as `monthWearStats` gives it) |
| `calendar.emptyMonth` | No looks worn in {month} | Ingen looker brukt i {month} | new (`{month}` is the month name alone; the one line under the grid, or under the month line at `ax`, so VoiceOver always hears it. Also the whole screen when nothing has been worn yet) |
| `calendar.dayTitle` | {date} | {date} | new (Section title of the chosen day, short date: "Fri 9 Oct" / "fre. 9. okt."; VoiceOver the long date with no year, as the Dates rule) |
| `calendar.timesMany` | {count} times | {count} ganger | new (Most worn Row meta, this month's count, always 2 or more, so no One key, the count rule) |
| `calendar.day` | {date}, worn | {date}, brukt | new (VoiceOver label of a worn day cell, and of its Row at `ax`; `{date}` the long date with no year, as the Dates rule. No count: Closet Mark as worn writes one `wore` event per piece, so a count would say "5" for five pieces marked once) |
| `calendar.today` | {date}, today, worn | {date}, i dag, brukt | new (in place of `calendar.day` on today's cell when it is worn) |

A day row: collage, then the same name its Looks row shows (the look name, or the suggested outfit name for a set that is not saved), then the occasion word (`occasion.*`). No time: a Yesterday wear records when she tapped. `looks.worn` is not used on day rows: the screen only holds wears. The calendar holds outfit wears only, so `calendar.emptyMonth` says looks, not pieces: pieces marked in Closet are not looks she wore.

At `ax` the grid becomes a list of worn days: each Row has the short date as its title and no meta, labelled `calendar.day`, and the chosen day's rows open under it. A count meta ("2 outfits") is not used, for the reason under `calendar.day`.

Cut from the calendar: `calendar.emptyDay` (empty days are not pressable, `design-system.md` 20), `stats.nothingWorn` (`calendar.emptyMonth` is the one line; Profile keeps `stats.nothingWorn`) and `calendar.timesOne` (Most worn lists pieces worn twice or more).

After a month change focus stays on the chevron, so she can page on, and the month title's label (`calendar.monthLabel*`, or `calendar.month` then `calendar.emptyMonth`) is announced once, queued.

### F11 Profile

| Key | English | Bokmål | Replaces |
|---|---|---|---|
| `profile.meter` | The stylist knows {percent} of your style | Stilisten kjenner {percent} av stilen din | new |
| `onboarding.place.title` | Location | Sted | `onboarding.place.title` ("Units and city") |
| `onboarding.body.title` | Body | Kropp | unchanged |
| `settings.title` | Settings | Innstillinger | new (Section title over Morning outfit, Language, Outfit card, Show intro again, Delete all data, the privacy line and the version; `settings.app` is cut) |
| `profile.colours` | Colours | Farger | unchanged (value: season name. The Colours answer holds the palette summary as on onboarding step 10, the season in `headline` and the six best `Swatches`, `colours.selfie` above them, then the colour lean as a single optional ChipRow labelled `onboarding.colourLean.question`) |
| `never.title` | I'll never wear | Jeg bruker aldri | new (row and screen title) |
| `never.garments` | Garments | Plaggtyper | new (group; Section titles `category.*`, chips `kind.*`) |
| `never.colours` | Colours | Farger | new (applies to clothes) |
| `never.hijabColours` | Hijab colours | Hijabfarger | new |
| `never.patterns` | Patterns | Mønstre | new (chips `value.pattern.*`) |
| `wearMore.title` | Trying to wear more of | Vil bruke mer | new (row and screen title) |
| `common.selectedOne` | 1 selected | 1 valgt | new on this screen |
| `common.selectedMany` | {count} selected | {count} valgt | new on this screen |
| `common.none` | None | Ingen | new (row value of both lists when empty) |
| `style.hijabStyles` | Hijab styles | Hijabstiler | new (Your style; hidden while her hijab answer is No) |
| `style.fit` | Fit | Passform | new (Your style) |
| `style.sparkle` | Sparkle | Pynt | new (Your style row label, the same word as `fact.sparkle`) |
| `shape.none` | Prefer not to say | Vil helst ikke si | unchanged |

Both list rows show their count as the value ("3") or `common.none`. Never-wear chips save at once; the tick is `result.saved`, announced. The meter sentence and its bar are one VoiceOver element labelled `profile.meter`, with no `progressbar` role and no value; the bar is hidden, so the percent is read once. At 100% the line stays, no praise, no chips. Chips appear in onboarding order, three at most.

Quick add chips have no keys of their own. Each shows a leading plus glyph (hidden from VoiceOver) and the label of the row it opens, so one rule covers all and Voice Control finds a chip by the same words as its row: `profile.name`, `style.hijab`, `style.hijabStyles`, `coverage.levelLabel`, `style.style`, `style.fit`, `style.sparkle`, `profile.colours`, `onboarding.place.title`, `onboarding.body.title`, `never.title`, `wearMore.title`, `piece.needsDetails`. Each is a `button`.

Your style row meta on Profile uses her style word set, `onboarding.style.*` (F01 Onboarding > Cards and chips).

Cut: `profile.style` ("Open style settings"), `style.bothLong` (the meta uses `onboarding.style.both`), `onboarding.taste.title` (the Your taste row; the colour lean moves into the Colours answer). Units: until the owner answers `architecture.md` Open question 8, `onboarding.units.*` label a Units `Segmented` on the Body answer (F11). If she confirms the removal, they are cut and units follow the phone's region: `getLocales()[0].measurementSystem` from `expo-localization` picks `onboarding.height.label` or the ft and in fields, and `temperatureUnit` picks °C or °F. The Location screen holds only location.

## Changelog

Process notes, kept out of the spec above: requests to other files' owners, renamed visible text for Maestro, and review logs.

### Notes for other roles

- Use cases say "Dusty pink" in UC-F02-22, UC-F05-15 and UC-F08-06. There is no such colour in `colour.*`; the nearest named colours are Blush (`colour.blush`, NB "Pudderrosa") and Mauve (`colour.mauve`, NB "Gammelrosa"). Testers should use "Blush" or "Mauve", or the domain adds a colour, which is out of scope.
- "Bruk" in NB means wear, with no exceptions.
- Bokmål tab labels: I dag (5), Garderobe (9), Samling (7). Tab labels do not grow with Dynamic Type. Test: at AX5, long press on each tab shows I dag, Garderobe and Samling in the Large Content Viewer. Check that NativeTabs exposes it.

Renamed visible text. Maestro flows select by text, so the architect updates `use-cases.md` and the hand-off rules in `architecture.md` (rules 2 and 4, and the flow table) to this column before Phase 3:

| Old visible text | Key | English | Bokmål |
|---|---|---|---|
| Style today | `pieces.startWithThese` | Start with these | Start med disse |
| Worn lately (Closet select) | `looks.markWorn` | Mark as worn | Merk som brukt |
| Mark what I wear most ("N added" Banner) | `closet.markWearMost` | Mark what I wear most | Merk det jeg bruker mest |
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

### Review log

- Edits to `design-system.md` and `motion.md`: not made here, because this role writes only `copy.md` and those files have their own owners. They are listed under Notes for other roles.
- `splash.label` removed: the splash tile and mark are hidden from VoiceOver, so the label is never read.
- `onboarding.colours.title` keeps "Your": the key is shared with `colours.title`, where "Your" marks her own answers.

### Notes for other roles (Revision 1)

Copy above already assumes these. Each file's owner makes the edit. Notes the owners have already applied are deleted.

For `architecture.md`:

- Line 247, `notificationPlan`: the body is `notify.today` / `notify.tomorrow` ("See today's outfit" / "See tomorrow's outfit") and the title is `today.greeting.*` by the hour it fires. "Today's outfit is ready" is false, because nothing is styled before she opens the app, and the domain function builds the string, so the wrong text would ship.
- Tomorrow, open until the architect confirms before approval: does Adjust > When > Tomorrow open the same tomorrow session as the 21:00 tap (`prepareTomorrow` with the adjusted request), under Banner `today.tomorrow` with `today.backToToday` and, after it, the one-line `today.showTomorrow`? Then `today.banner.planning` and `today.savePlanTitle` are only for a date after tomorrow. On confirming, update the term list (line 36), the Sessions rule (line 37), the `/today/adjust` row (line 59) and UC-F07-08's When choices.
- Units: `onboarding.units.*` label the Units Segmented on the Body answer until the owner answers Open question 8. If she confirms the removal, the keys are cut and height and temperature follow `getLocales()[0].measurementSystem` and `temperatureUnit`; then update the Location and Body Profile rows and UC-F11-03 step 1.
- Line 130: hijab has three values with one word set on step 2 and Your style, Always / Sometimes / No (`hijab.always`, `hijab.sometimes`, `onboarding.hijab.no`). No writes `not-needed`; "Not needed" is not shown anywhere. The same line says "step 1" for the hijab step; it is step 2. Line 108 and line 120 (Colours row): the toggle is "In a hijab" (`colours.hairCovered`), not "Hair covered".
- Line 117: quick add chips show the label of the row they open ("Colours", "Hijab styles", "Sparkle"), not "Add your colours", "Pick hijab styles", "Add sparkle".
- Onboarding steps 5 to 9 (lines 143 to 147): step 5 keeps the owner's words (`onboarding.style.*`), the same on Your style, the Profile meta, the Today style chip and Adjust; `styleLabel` in `src/domain/taxonomy.ts` keeps "Desi" for piece style and stylist sentences, so the request chip needs its own lookup. Step 7 asks "How much sparkle?". Step 9 is headed "Morning outfit" (`profile.morning`), Off and the four times under it.
- Step 4 writes `null` for No preference; its copy key is `coverage.noPreference`, never `coverage.none`, which is the stylist's existing coverage error.
- Today: Like toggles itself off. The Undo slot with Undo shows after Another, Change or a reason chip, never after Like.

For `design-system.md`:

- 11. FlatLay > Accessibility: VoiceOver order is title, pieces, Change strip (while open), reason line, then Like, Not for me, Save look, so she hears why before she rates.
- 11. Today Undo slot: the two Buttons stack at `ax`, or when they do not fit one line in the current language, Undo first.
- 13. Progress card: `progress.moreGroups` ("+1") ends the one-line meta below `large`. While one piece prepares the line is `progress.newOne` "1 new piece", with no count of 1.
- 17. Selfie recipe: the toggle is "In a hijab" (`colours.hairCovered`), not "Hair covered"; These don't look like me carries `accessibilityState.expanded` and moves focus to Retake.
- 18. Choice card: the hijab styles group's Lane 1 check stays (`checkbox` reads "checked" on iOS; fallback `button` with `selected` for the whole group). Everyday style row: `onboarding.style.*` is now the copy too.
- Profile recipe: the completeness block has no `progressbar` role and no value; its one label is `profile.meter`. Quick add chips carry the row labels after a plus glyph. One Settings Section, no `settings.app`.
- Location search: on the Profile Location answer the header title `onboarding.place.title` stays, so the filled field always has a visible label.

For `motion.md`:

- Background tagging card: the ready count is announced once when the queue ends (`progress.readyOne` / `progress.readyMany`, with `capture.failed*`); the counting up is never announced.
- Banners and bars: the Save label is `common.saveLook`, not `today.saveLook`.

For the flows:

- `flows/F01-start.md`: step 2 chips Always / Sometimes / No, and line 118 drops "`hijab.notNeeded` stays the word on Your style and Today"; step 3 "Which styles do you wear?"; step 7 "How much sparkle?"; step 9 headed `profile.morning` "Morning outfit" (line 245 heading, line 247, the wireframe at line 250, UC-F01-19 and the review note at line 566 that calls it a yes or no question); `colours.hairCovered` "In a hijab"; the line 550 note about `onboarding.notify.question` and `profile.name` is out of date.
- `flows/F04-closet.md`: the More panel's last line is Details (`piece.facts.title`) holding `piece.needsDetails`, out of Coverage; the height budget gains one 44 pt line.
- `flows/F06-today.md`: Rediscover NB "Lite brukt"; each tile carries the custom action `rediscover.action`; the style chip shows `onboarding.style.*` ("Western modest"), so the wireframe's "Western" changes and the line 20 one-line estimate is rechecked; the Undo slot stacking rule above.
- `flows/F07-adjust-today.md`: the style row uses `onboarding.style.*` (Abaya or desi, Western modest, A mix of both), not Desi / Western / Both.
- `flows/F11-profile-and-style.md`: `style.hijab` chips and value are `hijab.always`, `hijab.sometimes`, `onboarding.hijab.no` (lines 182, 258, 551); `style.sparkle` "Sparkle" (the "Sparkle for events" examples on lines 191 and 534); quick add chips show their row labels with no `quick.*` keys (lines 59, 534, 576); option labels use `common.optionInGroup`; `settings.app` cut; `sparkle.plain` NB "Enkel" on piece facts too.

### Renamed visible text (Revision 1)

The architect updates `use-cases.md`, `architecture.md` and the flows to this column before Phase 3, because Maestro selects by text.

| Text in use cases, architecture or flows | Key | English | Bokmål |
|---|---|---|---|
| My own line | `coverage.own` | My own limit | Egen grense |
| Depends | `onboarding.depends` | It depends | Det varierer |
| Pick hijab styles, Add hijab styles (quick add) | `style.hijabStyles` | Hijab styles | Hijabstiler |
| Thanks | `outfit.thanks` | Noted for next time | Notert til neste gang |
| Saved, open look (VoiceOver) | `today.openLook` + `result.saved` | Open look, Saved | Åpne look, Lagret |
| Wear an outfit and it lands here | `calendar.emptyMonth` | No looks worn in October | Ingen looker brukt i oktober |
| Weather for {name} | cut | {name} | {name} |
| Units and city | `onboarding.place.title` | Location | Sted |
| Colours that suit you | `colours.bestShades`, `colours.bestShadesPlain` | Best hijab shades, Best shades | Beste hijabfarger, Beste farger |
| Season: {season} | `season.*` | Deep autumn | Dyp høst |
| Review (Closet progress card, UC-F02-23) | cut | the card itself is the door | |
| Variety: 38% of your closet | `calendar.variety` + `calendar.varietyValue` | Variety, 38% of your closet, last 30 days | Variasjon, 38 % av garderoben de siste 30 dagene |
| Your taste (Profile row) | cut | Colours | Farger |
| Go to Today | cut | | |
| Location is off | `place.locationOff` | Location access is off | Posisjonstilgang er av |
| Notifications are off in Settings | `notify.denied` | Notification access is off | Varseltilgang er av |
| City not found | `onboarding.city.notFound` | Could not find this city | Kunne ikke finne byen |
| Add your colours | `profile.colours` | Colours | Farger |
| Add height (quick add) | `onboarding.body.title` | Body | Kropp |
| Tops, Tunics, Bottoms (never-wear groups) | `category.*` | Tops, Kurtas & tunics, Trousers & skirts | Topper, Kurtaer og tunikaer, Bukser og skjørt |
| What should we call you?, What is your name? | `onboarding.name.question` | What's your name? | Hva heter du? |
| When should your outfit come? | `profile.morning` | Morning outfit | Morgenantrekk |
| Your colours (step 10 heading) | `onboarding.colours.question` | Which colours suit you? | Hvilke farger kler deg? |
| For Eid and parties, how much sparkle? | `onboarding.sparkle.question` | How much sparkle? | Hvor mye pynt? |
| Sparkle for events (Your style row) | `style.sparkle` | Sparkle | Pynt |
| Not needed (step 2 and Your style) | `onboarding.hijab.no` | No | Nei |
| Hair covered | `colours.hairCovered` | In a hijab | Med hijab |
| Western, Desi, Both (Today and Adjust style chip) | `onboarding.style.*` | Western modest, Abaya or desi, A mix of both | Vestlig og tildekket, Abaya eller desi, Litt av begge |
| You are set | `onboarding.done.title` | All set | Alt klart |
| Choose a recent selfie | `colours.library` | Choose photo | Velg bilde |
| Choose pieces to wear more (quick add) | `wearMore.title` | Trying to wear more of | Vil bruke mer |
| Add piece details, Fill in details (quick add) | `piece.needsDetails` | Needs details | Mangler detaljer |
| N new pieces ready | `progress.readyMany` | 6 ready to add | 6 klare til å legges til |
| Gjenoppdag | `today.rediscover` | Rediscover | Lite brukt |
| Planning {day} for tomorrow (Adjust > Tomorrow, once confirmed) | `today.tomorrow` | Tomorrow's outfit | Morgendagens antrekk |

### Review log, Revision 1

Decisions only. Each line is the current state.

- "My own limit", not "My own line": "line" already names the coverage line on Today.
- "Finn posisjonen min", not "Bruk min posisjon": "Bruk" means wear.
- Sparkle is "Pynt", the word the piece fact already used. Plain is "Enkel" in the answer and the piece fact alike, never "Ingen", which is `common.none` and sounds like an empty value ("Pynt: Ingen"); it also matches `feedback.too-plain` "For enkelt". "Brudestas" for Bridal: "Brud" alone reads as a person.
- The coverage note gets its own `kind.subject.*` family, definite in both languages ("The blazer covers the arms.", "Blazeren dekker armene."), so the reason line uses one article style, and ends with a full stop as the reason line's second sentence. `kind.subject.wide-leg` "The wide-leg trousers" is the one grammar exception.
- The colour season has no "Season:" label, so "Season" means one thing: when a piece is worn.
- Quick add chips have no keys: each shows the label of the row it opens after a plus glyph. One rule, no exceptions, and Voice Control finds a chip by its row's words. The 13 `quick.*` keys are cut. "Hijab" under the meter does not read as adding a hijab piece, because every chip there names an answer.
- Her style uses the owner's words, Western modest / Abaya or desi / A mix of both (round 1, item 3), wherever she answers it or filters by it. The figure is hidden from VoiceOver, so the label must carry "modest". Piece style keeps `style.western`, `style.desi` "Desi" and `style.both`, because `style.desi` also names garments and a lehenga is not an abaya. NB "Vestlig og tildekket", not "Vestlig modest", which is half English.
- Her hijab answer is Always / Sometimes / No on step 2 and on Your style. "No" answers the question; "Not needed" was a second word for the same value. `hijab.notNeeded` is cut, because no screen shows it.
- The owner's questions stay in her words: "Which styles do you wear?" (step 3 follows the hijab question, and "hijab styles" would make the first card, Hijab, circular) and "How much sparkle?". Your style's row is "Sparkle", the same word as the piece fact.
- Step 9 is headed "Morning outfit", the Profile row's words, a second label among the questions with the done step: Off does not answer "When do you want your outfit?", and the step and the row now read the same.
- One option label rule (F12 Controls and VoiceOver): three role cases, and the group joined by `common.optionInGroup` where iOS reads no group name, so bokmål never depends on concatenation.
- Needs details is its own last line of the More panel, "Details", so it never sits beside the coverage value Needs layering.
- The selfie toggle is "In a hijab" / "Med hijab": the screen is about the photo, so "in the photo" was extra words.
- `progress.newOne` is "1 new piece" while it prepares, then `progress.readyOne`: "1 new piece, 0 of 1 ready" reads like a machine. Many keeps the owner's "{ready} of {total}".
- `progress.ready*` say "ready to add": nothing is in the closet until Add.
- `colours.library` is "Choose photo", the glossary word for library picking; the key stays so the flows' references hold. It stays on screen for a denied camera, Switch Control and anyone who cannot hold still.
- `point.move*` are cut: the points use `common.move` (formerly `capture.boxMove`) with `direction.*`, one term for one action.
- `today.rediscover` NB is "Lite brukt": true for a piece never worn and one not worn lately, where "Lenge siden sist" is false for the first. "Gjenoppdag" is an imperative no one uses as a title. Its tiles carry `rediscover.action` besides the hint, because hints can be switched off.
- `calendar.varietyValue` is "{percent} of your closet, last 30 days" / "{percent} av garderoben de siste 30 dagene": "in 30 days" can read as the future.
- `onboarding.done.title` is "All set" / "Alt klart", a label like the rest; questions use contractions (rule above).
- `settings.app` is cut: one Settings Section on Profile, then Advanced.
- `calendar.timesMany` has no One key: Most worn lists pieces worn twice or more. The count rule names it.
- Each key is defined once: F01 Start keeps only the keys Revision 1 does not redefine, and the hijab rows live only in Revision 1 > F01 Onboarding.
- Declined: a visible wear count on the `ax` calendar Rows. Closet Mark as worn writes one `wore` event per piece, so the count would say "5 outfits" for five pieces marked once.
- Declined: dropping `today.greeting.short` and letting the greeting wrap. The greeting is the native large title (`Screen large`, `design-system.md` Today recipe, `flows/F06-today.md` step 1), which truncates and does not wrap; a custom wrapping heading is a design-system change, not copy. "Hi, {name}" stays the AX floor that keeps her name, and `nav.today` shows only when that does not fit either. Lane 1 confirms on a device at AX5 in bokmål.
- Declined: cutting `onboarding.units.*` in F01 Start and F11. `architecture.md` Open question 8 is still open and `flows/F11-profile-and-style.md` draws the Units Segmented until the owner answers.
- Declined for now: moving the Changelog to `mockup-review-log.md`. Several notes are not yet applied (`architecture.md` line 247 still says "Today's outfit is ready", `flows/F01-start.md` still asks "When should your outfit come?"), and that file is the review lead's log. Applied notes are deleted here instead; the rest moves once their owners have made the edits.
- Kept: Undo after a reason chip. A reason is stored feedback, and Undo is the only way to take it back.
- Kept: `category.*` as the one category family; `closet.sectionLabel` over `closet.section.count`, because a key under the value key `closet.section` cannot exist.
- Kept: the progress meta overflow is "+{count}" (`progress.moreGroups`); "2 more" beside "Kurtas & tunics 1" reads as two more pieces.
- The colour lean on the Colours answer is "Colour strength" / "Fargestyrke".
- Open for the owner: These don't look like me opens Retake, four controls and up to three draggable points. Her words were "redo or adjust"; confirm the points stay. Meanwhile the order is fixed: Retake first, the points last, no extra labels.
- Open for the owner: a shorter style chip on Today and Adjust. "Western modest" and "A mix of both" are her words and used as they are; if the Today chip row gets too long, she picks a short form ("Western", "Mix").
- Open for the owner: whether the sparkle question should name Eid and parties. The stylist reads it only for those occasions; her words were "How much sparkle", so the step asks that.
- Open for the architect: Adjust > Tomorrow as the tomorrow session (Notes for other roles, Revision 1).
- Open for Lane 1: how "06:00" is read on the notification chips; whether `checkbox` reads "checked" on iOS; the greeting width on a device; the reason line length test with the EN article on `kind.subject.*`.
