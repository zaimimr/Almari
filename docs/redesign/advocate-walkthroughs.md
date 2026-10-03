# Advocate walkthroughs

The user advocate walks every flow in `architecture.md` and `use-cases.md` as the first user and records friction, dead ends, missing hand-offs, too many steps and confusing words. Severity is blocking (she gives up, gets a wrong result, or the app fails her main reason for using it) or minor (slower or unclear, but she gets there).

## Pass 1

Date: 2026-10-03. Walked against `architecture.md` and `use-cases.md` of the same date, with `docs/redesign/inventory/*.md` for current behaviour.

Who I am: a Muslim woman in Oslo. I wear hijab every day. My problem is finding a hijab that goes with the outfit, and I keep wearing the same five favourites while the rest of my closet hangs there. I dress for work by mood, go to dinners, and to Desi events (Eid, mehndi, barat, walima). Winter means cold, snow and slush. I am not technical and my mornings are short.

Scenarios I walked:

- S1 Weekday, 07:10, ten minutes. I feel low and want something soft but fine for work.
- S2 Snow morning, minus 6, walk to the bus.
- S3 Wednesday evening, planning my Eid outfit for Saturday.
- S4 Work, then dinner with friends the same evening.
- S5 Cousin's wedding: mehndi Friday, barat Saturday, same family at both.
- S6 First weekend: install, onboarding, add my clothes.
- S7 Later weekend: add 12 hijabs and a new three-piece suit, put summer clothes away.
- S8 I bought a dusty pink hijab and want to know what to wear it with.

### F01 Start

I open the app. The scarf A drapes in, that is lovely. Step 1 asks about hijab and coverage first, so the app feels made for me. I type Oslo, choose "Prefer not to say" for body, and reach colours. I tap "Take a selfie". I am wearing my hijab, like always when I hold a phone to my face. The result wants points on Skin, Hair and Eyes. My hair is covered. If the Hair point lands on my hijab, my colour season is measured from a scarf. Then "You are set". I tap "Start with the sample closet" because I have no time today, and Today shows an outfit. Nothing tells me these are not my clothes.

| ID | Kind | Severity | Issue | What I need |
|---|---|---|---|---|
| A1-01 | Wrong result | blocking | Selfie colours assume visible hair (UC-F01-07). In hijab the Hair point measures the scarf and the season is wrong, and every colour suggestion after that is wrong too. | A "Hair covered" choice on the result that drops the hair point and measures from skin and eyes only. |
| A1-02 | Missing info | minor | Nothing before the camera says the selfie stays on my phone. I would only take my hijab off for a private photo. | One line on the selfie screen. This is helper text I cannot act correctly without. |
| A1-03 | Too slow | minor | If the drape plays on every launch, it costs me time each morning. | Full drape on cold launch only; warm launch goes straight to Today. |
| A1-04 | Confusing | minor | After "Start with the sample closet", Today shows sample pieces with no sign they are not mine. | A "Sample" mark on the context row or the flat lay while the sample closet is in use. |

### F02 Add pieces

S6 and S7. Closet, Add. Three tip cards, "Got it". I see Take photos, Choose photos, Scan and "Add without photo". I don't know the difference between Take photos and Scan. I lay my hijabs on the bed and take photos. Tiles shimmer, most turn Ready, some Check. Each Check asks category, subcategory, Desi or Western, then a question. I answer the same thing for several hijabs, one by one. "Add 12 pieces" takes me to Closet with "12 added: Style today / Build a look". I go to Today. It still styles the sample closet.

Then my new suit: kameez, shalwar and dupatta in one photo. The group card says "3 pieces in one photo", I Keep all three, Done. They become three loose pieces. Later I must find them among 60 tiles in Closet Select to link them.

| ID | Kind | Severity | Issue | What I need |
|---|---|---|---|---|
| A2-01 | Dead end, missing hand-off | blocking | After I add my own pieces, Today keeps styling the sample closet. The only switch is Adjust > Closet > My clothes (UC-F07-06), which I would never find. My first real outfit never comes. | The first time I add pieces, switch to My clothes (or ask once in the "N added" bar). "Style today" in that bar always uses my clothes. |
| A2-02 | Wrong result | blocking | Pieces found in one photo are never offered as a set. A Desi suit is kameez, shalwar and dupatta; split apart, the stylist mixes them and my Eid and wedding outfits are wrong. | "Keep as a set" on the group review when two or more rows are kept (UC-F02-06), and "Link as set" in the "N added" bar. |
| A2-03 | Confusing word | minor | "Add without photo" still asks for a photo (UC-F02-16 step 2, Save hidden until a photo exists). The label is not true. | Name it for what it is, for example "Add by hand". |
| A2-04 | Confusing word | minor | I cannot tell "Scan" from "Take photos". Scan needs the phone propped up while I hold pieces up; nothing says so. | A short value under Scan such as "Hold pieces up to the camera". Needed to choose correctly. |
| A2-05 | Confusing word | minor | "Check" means two things: a capture tile that needs my answers, and the Today card before wearing. Breaks the one-term rule. | A different word for the capture badge, for example "Confirm". |
| A2-06 | Too many steps | minor | Twelve similar hijabs that land in Check each need the same answers, one screen each. | Select several Check tiles and answer category and style once. |
| A2-07 | Confusing words | minor | Enhanced, Plain, Keep original, Studio and Cut-out are five photo words on one screen. I don't know Studio sends my photo away until I tap it. | Fewer photo choices with plain names, for example "Clean background" for Studio. |
| A2-08 | Missing hand-off | minor | On a weekend the "N added" bar only offers "Style today" and "Build a look". For S8 I want to see what goes with my new hijab, not change today. | "Style with it" that works without replacing today, or route through the plan entry from A7-01. |

### F03 Scan

I tap Scan, the camera starts, "Step into view". I have to prop the phone on the dresser to hold pieces up (A2-04). The tray fills, I tap Done, see Scanned pieces, then each check, then Add. The flow itself holds together. The long tail after Done for ten pieces is A2-06. No new issues.

### F04 Closet

Sixty pieces. I want the dusty pink hijab. I type "pink": nothing, search is name only and the app named it "Hijab". I filter Hijab and scroll. Then I want to wear something I have forgotten. There is no way to ask for that.

| ID | Kind | Severity | Issue | What I need |
|---|---|---|---|---|
| A4-01 | Missing flow | blocking | Using more of my wardrobe is why I installed the app, and no screen helps. No "Not worn lately" or "Never worn" filter, no sort by last worn, and Profile "Never worn: 23" cannot be tapped (inventory gap, kept in UC-F11-01). The stylist already prefers less-worn pieces (`wearBoost` in `src/domain/scoring/taste.ts`) but I never see it. | Closet filter "Not worn lately" and "Never worn"; Profile "Never worn" pushes Closet with that filter; from there "Style this piece" in one tap. |
| A4-02 | Friction | minor | Search and filters ignore colour. | Colour words in search, or a colour filter at least for hijabs. |
| A4-03 | Too many steps | minor | Putting 20 summer pieces away is 20 times open, Archive, confirm, back. Select mode has no Archive. "Archive" is also an office word. | "Put away" in the Select footer, and "Back in my closet" in bulk. |

### F05 Piece

I open my hijab. Photo, name, facts, "Used in 2 looks". I look for the colour the app thinks it is. It is nowhere. Weather chips show on tops, dresses, layers and shoes, not on my hijab. "Style this piece" lands on Today with the banner "For work, today only".

| ID | Kind | Severity | Issue | What I need |
|---|---|---|---|---|
| A5-01 | Wrong result, no fix | blocking | The colour the app read is not shown and cannot be corrected anywhere (not in facts, edit, check, search or filters). Hijab matching runs on it. Indoor light turns dusty pink into beige, every hijab reason is then wrong, and I cannot fix it. | A colour swatch on piece detail and on the capture check, tap to choose the right colour. |
| A5-02 | Missing info | minor | No wear history on the piece. | A value "Worn 3 times, last 12 Sep" or "Never worn". |
| A5-03 | Confusing words | minor | "Style this piece" shows "For work, today only". I did not pick an occasion. | Banner "Styled around {name}, today only". |
| A5-04 | Missing option | minor | Warmth cannot be set on hijabs. In snow I want wool or jersey, not chiffon. | Warmth on hijabs, used by the stylist. |

### F06 Today

S1. 07:10, open, Today. The outfit is fine but I feel low and want something soft. The context row says Work, Western, Oslo 4 to 9°. Nothing lets me say how I feel. "Not for me" offers Too formal, Too plain, Too warm, Not my style. None is my mood, so I tap Another three times. The hijab does not match: "Compare hijabs", strip, tap, "Use this hijab". "Wear this". Out the door. That part is good.

S2. Snow. The chip says "Oslo -6 to -2°". It does not say snow, so I don't know if the boots are there on purpose. Minus 15 and plus 7 are both "Cold". I walk 15 minutes but "Time outside" only exists if I set the weather by hand.

S4. I tapped "Wear this" for work. In the evening I switch to Dinner. I don't know if wearing a second outfit counts.

| ID | Kind | Severity | Issue | What I need |
|---|---|---|---|---|
| A6-01 | Missing control | blocking | I dress for work by mood and there is no way to say it. "Another" becomes roulette and "Not for me" records a dislike I don't have. | A mood choice on Today (for example Calm, Bright, Cosy, Sharp) mapped onto the existing request levers. Architect decides if it counts as a new feature; without it, S1 fails every morning. |
| A6-02 | Missing option, confusing word | minor | "Not for me" lacks "Too cold" and "Hijab does not match". "Too warm" can mean temperature or warm colours. | Add both chips, rename "Too warm" to "Too hot". |
| A6-03 | Missing info | minor | The forecast chip shows temperature only. | Show rain or snow on the chip when the forecast has it. |
| A6-04 | Wrong result | minor | One cold band below 8°. Minus 15 and plus 7 get the same request. | A "Very cold" band below zero that reaches for the warmest coat and layers. |
| A6-05 | Missing option | minor | "Your day: Time outside" is only offered with manual weather. | Offer it with the forecast too. |
| A6-06 | Unclear state | minor | After "Wear this" in the morning, it is unclear whether a dinner outfit in the evening can also be worn. | "Wear this" per outfit, not once per day. |
| A6-07 | Missing path | minor | If I forget "Wear this" in the rush, the wear is lost and my counts lie. | A way to record "I wore this yesterday" from Looks or Today. |
| A6-08 | Too slow | minor | If every "Another" plays the full piece-by-piece arrange, flicking through four outfits costs seconds. | Short arrange, interrupted by the next tap. |
| A6-09 | Missing hand-off | minor | "Start with" offers Blazer, Dress, Kurta, Trousers, no Hijab. S8 needs "Start with a hijab"; today that is Choose pieces, filter, tap, "Style around these". | Hijab chip in "Start with". |

### F07 Adjust today

S3. Wednesday evening. Context row, Adjust, Occasion Eid, Style Desi, scroll to "Find outfits". Today now says "For Eid, today only" and my work outfit for tomorrow is gone until I tap "Back to everyday". The weather used is Wednesday's. I "Save look"; it gets a suggested name. On Saturday I must remember to go to Looks, open it, "Wear today", then "Wear this".

S5. Mehndi Friday, barat Saturday, same family. I need two different outfits and two different hijabs, planned ahead.

| ID | Kind | Severity | Issue | What I need |
|---|---|---|---|---|
| A7-01 | Missing flow | blocking | No way to plan for a day that is not today. Occasions are "today only", replace my current outfit while I plan, and use today's weather. Every Desi event is planned days ahead. | A day choice in Adjust (Today, Tomorrow, a date) or a "Plan" entry that saves a look for that date without touching today, and shows it on Today that morning. |
| A7-02 | Missing option | minor | The occasion list has no Walima, Nikah or Dholki. I don't know if "Wedding guest" covers walima. | Add the names, or map them to the existing occasions. |
| A7-03 | Too many steps | minor | On Eid morning I only need Occasion, but I scroll a form of eight sections to reach "Find outfits". | Occasion first; the pinned footer button visible without scrolling. |
| A7-04 | Hidden entry | minor | The old "For an occasion" button is gone. The context chip reads "Work", which does not say I can tap it to pick Eid. | The occasion chip must look like a control. |
| A7-05 | Missing info | minor | Nothing tells me I wore this suit at the last family event. | Last worn date on look rows (see A9-03). |

### F08 Change a piece

I tap my hijab in the flat lay, or "Compare hijabs". The strip shows Current first, then others with a reason. I tap, see it on the outfit, "Use this hijab", and "Undo" is there. This is my main problem solved in three taps.

| ID | Kind | Severity | Issue | What I need |
|---|---|---|---|---|
| A8-01 | Dead end | minor | "No other hijab works with this outfit" hides the rest of my hijabs. I know my closet and want to try one anyway. | "Show all hijabs" under the message. |
| A8-02 | Confusing words | minor | Reasons must speak colours I know ("Picks up the plum in the tunic"), not scores. | UX writer writes hijab reasons colour first. |
| A8-03 | Friction | minor | Fifteen hijabs in one line are hard to scan. | Order alternatives by tone so pinks sit together. |

### F09 Looks

I open Looks, my saved Eid look has a suggested name. I open it, tap "Wear today", Today shows it. Did I wear it? I don't know if I also need "Wear this".

| ID | Kind | Severity | Issue | What I need |
|---|---|---|---|---|
| A9-01 | Confusing words, lost data | blocking | "Wear today" on a look and "Wear this" on Today sound like the same act. If "Wear today" only shows the look, I think I wore it and the wear is never counted, which breaks the counts that A4-01 relies on. | One word. Either "Wear today" records the wear and Today shows "Worn today", or it is called "Show on Today". |
| A9-02 | Too many steps | minor | No rename on look detail; only via "Change pieces" and the builder. Today saves with a suggested name (open question 2), so renaming must be easy. | Tap the look name to rename. |
| A9-03 | Missing info | minor | Rows don't show when I last wore a look. | Last worn date on the row. |

### F10 Build a look

New look, tap hijab, tunic, trousers, shoes, "Fill the rest", name "Office", "Save look". It works.

| ID | Kind | Severity | Issue | What I need |
|---|---|---|---|---|
| A10-01 | Inconsistent | minor | UC-F10-03 says "same strip pattern as Today" but not that hijab tiles show reasons. Today's replace tiles had no reasons before (inventory point 23). | Hijab reasons in the builder swap strip too. |

### F11 Profile and style

Today header, Profile. Your style, Your answers (hijab, place, body, taste, colours), stats, Stylist, Language, App.

| ID | Kind | Severity | Issue | What I need |
|---|---|---|---|---|
| A11-01 | Confusing | minor | Hijab and coverage live in two places: Your answers > Hijab and Your style. I don't know which one wins. | One home for hijab and coverage. |
| A11-02 | Confusing words | minor | Stylist Rules, Model, Compare and Compare results mean nothing to me and look like something I could break. | Dev builds only (answer to open question 3). |

The "Never worn" stat hand-off is part of A4-01.

### F12 App-wide

Empty states all name the next step, offline keeps an outfit. Good.

| ID | Kind | Severity | Issue | What I need |
|---|---|---|---|---|
| A12-01 | Confusing word | minor | In bokmål the Looks tab is "Antrekk", but today's outfit is also an "antrekk". One word for two concepts. | A different bokmål tab name for saved looks. |

### Pass 1 summary

Blocking: 8. Minor: 35.

Blocking, in the order they hurt me:

1. A5-01 Piece colour is hidden and cannot be corrected, so hijab matching can be wrong with no fix.
2. A4-01 No way to find and style pieces I have not worn; "Never worn" is a dead number.
3. A2-01 After adding my clothes, Today keeps styling the sample closet.
4. A7-01 No way to plan an outfit for Eid or a wedding ahead of the day.
5. A1-01 Selfie colours assume visible hair; in hijab the season is measured from the scarf.
6. A9-01 "Wear today" and "Wear this" are unclear; worn looks may never be counted.
7. A2-02 Desi suits found in one photo are not kept as a set.
8. A6-01 No way to say my mood for work.

### Architect response

Date: 2026-10-03. Each issue is fixed in `architecture.md` and `use-cases.md`, or declined with the reason. Domain changes needed for a fix are listed in the new "Domain touches" section of `architecture.md`; each is an additive optional field or a pure function with a unit test first.

| ID | Decision | How, or why not |
|---|---|---|
| A1-01 | Fixed | "Hair covered" toggle on the selfie result drops the Hair point; `analyseColours` already accepts `hair: null`. The flag persists so a retake does not bring the point back. UC-F01-07. |
| A1-02 | Fixed | One line on the camera screen: the selfie stays on the phone. UC-F01-07. |
| A1-03 | Fixed | Full drape on cold launch only; warm launch lands on Today. UC-F01-01. |
| A1-04 | Fixed | "Sample" chip in the Today context row and the sample mark on Closet tiles while the sample closet is in use. UC-F01-10, UC-F06-02. |
| A2-01 | Fixed | Adding the first owned pieces switches the stylist to My clothes; the "N added" bar says so. "Style today" from the bar starts an occasion session with the pieces kept, so the everyday outfit comes back with "Back to everyday". Too few pieces lands on the existing problem card with "Add pieces" and "Use the sample closet". UC-F02-14, UC-F02-21. |
| A2-02 | Fixed | "Keep as a set" on the group review when two or more rows are kept, linked on add. "Link as set" in the "N added" bar. UC-F02-06, UC-F02-14. |
| A2-03 | Fixed | "Add by hand". UC-F02-01, UC-F02-16. |
| A2-04 | Fixed | Scan carries the value "Hold pieces up to the camera". UC-F02-01. |
| A2-05 | Fixed | Capture badge and screen are "Confirm"; "Check" stays the Today card. One-term list updated. |
| A2-06 | Fixed | Long press selects Confirm tiles; footer "Answer for N" opens one confirm screen for all. UC-F02-20. |
| A2-07 | Fixed | Studio is "Clean background"; the cut-out action moves onto the photo so the chip row is Enhanced, Plain, Original, Clean background. UC-F02-08, UC-F02-11. |
| A2-08 | Fixed | "Style today" from the bar runs as an occasion session, so today's outfit is not lost (A2-01). Planning for another day goes through the Day row (A7-01). |
| A4-01 | Fixed | Closet filters "Never worn" and "Not worn lately" (30 days) under More; Profile "Never worn" is a row that opens Closet with the filter on; "Style this piece" is the next tap. UC-F04-04, UC-F04-11, UC-F11-01. |
| A4-02 | Fixed | Search matches colour names. UC-F04-03. |
| A4-03 | Fixed | "Put away" and "Back in my closet" in the Select footer, one confirm per batch. UC-F04-10. |
| A5-01 | Fixed | The colour fact (it existed as a word, `pieceFacts`) becomes a swatch chip on piece detail and a colour row on the capture confirm; tap opens the named colours; the choice is confirmed, survives a re-prepare and feeds hijab reasons. UC-F02-07, UC-F05-01, UC-F05-15. |
| A5-02 | Fixed | Wear line "Worn 3 times, last 12 Sep" or "Never worn". UC-F05-01. |
| A5-03 | Fixed | Banner "Styled around {name}, today only". UC-F05-12, UC-F06-12. |
| A5-04 | Fixed | Hijab joins the warmth traits; the stylist reads it under a cold request. UC-F05-03. |
| A6-01 | Declined, owner question | A mood lever does not exist in the stylist; adding one is a new feature and an engine change, both out of scope in the spec. Open question 5 asks the owner for a Phase 3 lane. Until then "Start with a piece" (Choose pieces) sits on Today so a soft day starts from a soft piece. UC-F06-09. |
| A6-02 | Fixed | Chips Too hot, Too cold, Hijab does not match (opens the hijab strip). UC-F06-05. |
| A6-03 | Fixed | Rain or snow on the forecast chip. UC-F06-10. |
| A6-04 | Declined | A "Very cold" band changes styling engine behaviour, out of scope. Listed under Domain touches as declined for the owner. Warmth on hijabs and "Time outside" with the forecast cover the snow morning. |
| A6-05 | Fixed | "Your day" offered with the forecast too. UC-F07-01. |
| A6-06 | Fixed | "Wear this" is per outfit; `wornNow` already compares the active outfit, so a dinner wear after a work wear is its own event. UC-F06-04. |
| A6-07 | Fixed | "Mark as worn" on look detail with Today / Yesterday. UC-F09-09. |
| A6-08 | Fixed | Short arrange, interrupted by the next tap. UC-F06-03, motion designer. |
| A6-09 | Fixed | Hijab chip in Start with. UC-F06-09. |
| A7-01 | Fixed | Day row in Adjust (Today, Tomorrow, a date). Another day runs in the occasion session under a "Planning {day}" banner with "Back to today", uses that day's forecast when present, and "Save look" keeps the date. Today shows "Planned for today" that morning. Two plans for two days are two looks. UC-F07-08, UC-F06-17, UC-F09-11. |
| A7-02 | Fixed | Labels "Party (mehndi, dholki)" and "Wedding guest (nikah, walima)". No new occasion ids. UC-F07-02. |
| A7-03 | Fixed | Occasion first; pinned footer visible without scrolling. UC-F07-01. |
| A7-04 | Fixed | Context chips drawn as controls with a chevron. UC-F06-02. |
| A7-05 | Fixed | Last worn date on look rows (A9-03). UC-F09-02. |
| A8-01 | Fixed | "Show all hijabs" under the message. UC-F08-03. |
| A8-02 | Fixed | Reasons name a colour first; UX writer owns the sentences. UC-F08-02. |
| A8-03 | Fixed | Hijab tiles ordered by tone after the current one. UC-F08-02, UC-F10-03. |
| A9-01 | Fixed | Look detail says "Show on Today" and records nothing; wearing is "Wear this" on Today or "Mark as worn" on the look. Hand-off rule 4 rewritten. UC-F09-04, UC-F09-09. |
| A9-02 | Fixed | Tap the name to rename in place. UC-F09-10. |
| A9-03 | Fixed | Last worn and planned date on rows. UC-F09-02. |
| A10-01 | Fixed | Builder swap strip shows hijab reasons and tone order. UC-F10-03. |
| A11-01 | Fixed | Hijab and coverage live in Your style only; the Your answers hijab row is gone, onboarding step 1 writes to the same place. UC-F11-01, UC-F11-03. |
| A11-02 | Fixed | Stylist section and scan speed readout are dev builds only; open questions 3 and 4 now state the decision for the owner to veto. UC-F11-06, UC-F03-06. |
| A12-01 | Fixed, pending word | UX writer proposes a bokmål tab name that is not "Antrekk" ("Lagret" suggested), open question 7. UC-F12-03. |

Blocking resolved: 7 of 8. A6-01 is declined as an engine change and handed to the owner as open question 5, with "Start with a piece" as the interim path.

## Pass 2

Date: 2026-10-03. Walked against the revised `architecture.md` and `use-cases.md` of the same date, with `docs/redesign/inventory/*.md` and `src/domain/today.ts` for what the code does today. Same person, same scenarios S1 to S8, plus:

- S9 Monday 07:10 after a Saturday dholki where I set Today to Party.
- S10 Thursday 07:10 after planning Eid on Wednesday evening.
- S11 First Monday after a weekend where I only added my 15 hijabs.

IDs are `B{flow}-NN`. A pass 1 issue that is still open keeps its pass 1 ID.

### F01 Start

Cold launch, the scarf A drapes in. Step 1 asks hijab: Always. I take the selfie in my hijab. The result shows Skin, Hair and Eyes, and the Hair point sits on my scarf until I notice the "Hair covered" toggle and turn it on. Then "You are set", "Start with the sample closet", and Today asks me to "Set your style" or "Try the sample style". I just answered six steps; this feels like starting over. The "Sample" chip now tells me these are not my clothes. Good.

| ID | Kind | Severity | Issue | What I need |
|---|---|---|---|---|
| B1-01 | Wrong default | minor | "Hair covered" starts off even though step 1 already knows I wear hijab Always. If I miss the toggle the season is measured from my scarf (A1-01 again). | "Hair covered" on by default when hijab is Always. |
| B1-02 | Too many steps | minor | After six onboarding steps, Today's first-run card asks "Set your style" again (UC-F01-10, UC-F06-01). Hijab, coverage and taste were already given. | Onboarding writes the everyday style, or Your style opens prefilled from onboarding and only asks what is missing (everyday occasion, style). |
| B1-03 | Confusing words | minor | "Start with the sample closet" then "Try the sample style": two sample choices in a row. | One tap. "Start with the sample closet" lands on an outfit. |

### F02 Add pieces

S6 and S11. Add pieces, tips, "Got it". "Take photos", "Scan: Hold pieces up to the camera", "Add by hand". Clear now. I photograph 15 hijabs on the bed. Most turn Ready, four Confirm. I would never find "Answer for N" because it starts with a long press. I tap "Add 15 pieces". The bar says "15 added, styling from your clothes now". I never saw what colour the app read for the 11 Ready hijabs. On Monday at 07:10 Today has no outfit, only a problem card, because I own nothing but hijabs.

The suit in one photo: "Keep as a set", on. That works.

| ID | Kind | Severity | Issue | What I need |
|---|---|---|---|---|
| B2-01 | Wrong result, no hand-off | blocking | The colour row only exists on the Confirm screen and piece detail (UC-F02-07, UC-F05-15). Ready tiles go straight into the closet, so most hijabs are never shown with their colour. I first meet a wrong colour on Today, in the hijab reason ("Picks up the beige..."), and the Change strip has no way to fix it. I must leave Today, find the hijab in Closet (search by colour finds the wrong colour) and open it. Hijab matching is why I use the app. | A colour dot and name on every capture tile, tap to pick the right colour before "Add N pieces". In the Change strip, a way to open the colour chips for a hijab ("Not this colour?") without leaving Today. |
| B2-02 | Dead end on a busy morning | blocking | Adding my first owned pieces switches the stylist to My clothes even when they cannot make an outfit (UC-F02-21). After a weekend of adding only hijabs, Monday 07:10 shows a problem card with "Add pieces" and "Use the sample closet". I cannot add clothes at 07:10. | Switch to My clothes only when my pieces can make a full outfit. Until then the bar says what is missing ("Add tops and bottoms to style from your clothes") and Today keeps working. |
| B2-03 | Hidden control | minor | "Answer for N" starts with a long press on a Confirm tile (UC-F02-20). I would not find it. | A visible "Select" in the header, the same as Closet. |
| B2-04 | Too many steps | minor | Warmth for hijabs (A5-04) can only be set one piece at a time on piece detail. Fifteen hijabs means fifteen visits before snow styling works. | Warmth on the Confirm and "Answer for N" screens for hijabs and layers, or in the Closet select footer. |
| B2-05 | Wrong result | minor | "Link as set" in the "N added" bar links everything added. Fifteen hijabs and a suit added together become one set of 18. | Offer it in the bar only when every added piece came from one group, or drop it from the bar (group review and Closet select already cover sets). |
| B2-06 | Unclear exit | minor | UC-F02-14 says the capture stack pops to Closet, and also "If other tiles remain, the grid stays". I do not know where I land when Confirm tiles are left. | Stay on the grid with "2 added" while tiles remain; pop to Closet only when the grid is empty. |
| B2-07 | Missing hand-off | minor | "Style today" from the "N added" bar or Closet select with no everyday style set (onboarding, then "Add my clothes") is not described. UC-F05-12 opens Your style first only for "Style this piece". | The same rule for every "Style" entry: Your style first, then Today. |
| B2-08 | Order | minor | On the Confirm screen the colour row comes after category, subcategory, style and the attribute question. For a hijab the colour is the one thing I must check. | Colour row directly under the photo. |

### F03 Scan

I prop the phone on the dresser. "Hold up a piece", outline, it lifts into the tray. "Done", "Scanned pieces", Keep or Drop, confirms, "Add 2 pieces". The flow holds together.

| ID | Kind | Severity | Issue | What I need |
|---|---|---|---|---|
| B3-01 | Missing info | minor | UC-F03-04 describes the scanned pieces review as rows with "no photo". Without a thumbnail I cannot tell which kameez is which. | A thumbnail on every row. |
| B3-02 | Missing option | minor | If I scan a kameez, shalwar and dupatta one after another, the review has no "Keep as a set". | The same "Keep as a set" as the group review when two or more rows are kept. |

### F04 Closet

Sixty pieces. "pink" now finds my dusty pink hijab if the colour was read right. "More" > "Never worn". In my first weeks every piece is never worn, so the filter shows the whole closet and Profile says "Never worn: 60". The app has no idea that I wear the same five things.

| ID | Kind | Severity | Issue | What I need |
|---|---|---|---|---|
| B4-01 | Main goal inert | blocking | Wear history only starts with in-app wears. For the first weeks "Never worn" and "Not worn lately" return the whole closet, and `wearBoost` in `src/domain/scoring/taste.ts` returns 0 with no wear data. The app cannot help me leave my favourites because it does not know them, and nothing lets me tell it. | A way to tell the app what I wear a lot, for example Closet select footer "Worn lately" that records a wear (existing `wore` events, dated) for the selected pieces, offered once after the first add. |
| B4-02 | Hidden entry | minor | "Never worn" and "Not worn lately" sit under "More". Using more of my wardrobe is why I installed the app. | "Not worn lately" as a first-row chip. |
| B4-03 | Confusing words | minor | "Put away" in Closet select, but "Archive" on piece detail (UC-F05-05) and "Archived" in the filter (UC-F04-04). Three words for one act. | "Put away" everywhere, filter "Put away". |

### F05 Piece

My hijab shows a swatch and "Dusty pink", "Worn 3 times, last 12 Sep", and Warmth. "Style this piece" now says "Styled around Dusty pink hijab, today only". Good.

| ID | Kind | Severity | Issue | What I need |
|---|---|---|---|---|
| B5-01 | Missing hand-off | minor | S8 on a Saturday: I want to plan Eid around my new hijab. "Style this piece" changes today; planning needs Today, the context row, Adjust, Day, "Find outfits". | Day chips (Today, Tomorrow, a date) right after "Style this piece", or the same Day row reached in one tap from the banner. |

### F06 Today

S1. 07:10, warm launch, straight to Today. Compare hijabs, tap, "Use this hijab", "Wear this". Four taps. Still no way to say I feel low; "Start with a piece" means opening the picker, filtering and guessing which piece is soft.

S9. Saturday I set Party for a dholki. Monday 07:10 Today still shows the party outfit under "For a party, today only". `ensureToday` in `src/domain/today.ts` keeps an active occasion session across days and the Domain touches only change dated sessions.

S2. "Oslo -6 to -2°, snow" on the chip. My wool hijab now comes up. I still go to Adjust each snowy morning to say I walk to the bus.

| ID | Kind | Severity | Issue | What I need |
|---|---|---|---|---|
| B6-01 | Wrong result on a busy morning | blocking | "today only" is not true. An occasion session ("For a party", "Styled around {name}", "Style today" from Closet) stays active the next morning (`ensureToday` keeps `active: "occasion"` when the date changes). Monday 07:10 shows Saturday's party outfit. | On the first open of a new day, Today shows the everyday outfit. An undated occasion session ends with its day. Add this to the Domain touches with a unit test. |
| A6-01 | Missing control (still open) | blocking | Mood for work is still missing (open question 5). "Start with a piece" is five taps and needs me to know which piece fits the mood. Every low morning still ends in "Another" roulette. | Owner approves a mood row as a Phase 3 lane. If it must wait, a "Soft" and a "Sharp" chip in "Start with" that map to existing levers. |
| B6-02 | Buried | minor | On Eid morning the "Planned for today" card sits under the outfit, the action row and the check card (UC-F06-17). | On the planned day, the planned look is the first thing on Today, above the everyday outfit. |
| B6-03 | Crowded | minor | The action row can hold Another, Wear this, Save look, Not for me, Compare hijabs and Undo, plus Start with chips. At 07:10 I need Compare hijabs and Wear this. | Designer ranks them: Wear this as the pinned primary, Compare hijabs next, the rest quieter. |
| B6-04 | Repeated every morning | minor | "Your day: Time outside" is part of each Adjust request. I walk to the bus every day. | Remember it as an answer (Your style or Your answers) so snow mornings need no Adjust. |

### F07 Adjust today

S3. Wednesday evening: context row, Adjust, Occasion Eid, Day "Saturday 11 Oct", "Find outfits". Today shows "Planning Saturday 11 Oct". Compare hijabs, "Save look". If I put the phone down without "Back to today", Thursday 07:10 opens on the Eid outfit, because a dated session stays until its date passes.

S5. Mehndi Friday, barat Saturday. Two plans, two looks. The second plan does not know the first, so the same hijab and dupatta can come up for both, in front of the same family.

| ID | Kind | Severity | Issue | What I need |
|---|---|---|---|---|
| B7-01 | Wrong result on a busy morning | blocking | A planning session is dated and kept "until its date passes" (Domain touches, hand-off rule 6), and it stays the active outfit. Every morning between planning and the event opens on the event outfit unless I remembered "Back to today". | Planning never stays active overnight. On a new day Today opens on the everyday outfit; an unsaved plan is either saved as a planned look or offered back from the "Planned" card. |
| B7-02 | Wrong result | minor | "Wear this" is still shown under "Planning Saturday 11 Oct". One tap records a wear today for Saturday's outfit and the wear counts lie. | Hide "Wear this" while planning; "Save look" is the primary. |
| B7-03 | Lost work | minor | "Back to today" with an unsaved plan drops it without asking. | "Save this plan?" when the planned outfit was changed and not saved. |
| B7-04 | Missing info | minor | Two plans in one week can reuse the same hijab or dupatta. | In the Change strip, mark pieces already in another plan this week ("In Friday's plan"). |
| B7-05 | Confusing words | minor | One idea, seven names: Start with, Start with a piece, Choose pieces, Style around these, Style this piece, Keep / Stop keeping, Styled around. | One verb for "build the outfit around this", owned by the UX writer. |

### F08 Change a piece

Tap the hijab, the strip opens, Current first, pinks together, "Picks up the plum in the tunic". "Show all hijabs" when nothing fits. This is the best part of the app.

| ID | Kind | Severity | Issue | What I need |
|---|---|---|---|---|
| B8-01 | Wrong order in snow | minor | Tiles are ordered by tone only. On a snow morning chiffon hijabs come first. | When the weather is cold or snowy, warm hijabs first or a warmth mark on the tile. |
| B8-02 | Unclear reason | minor | On a Desi outfit with a dupatta the reason does not say whether the hijab matches the dupatta or the kameez. | Reasons name the piece they match ("Matches the dupatta"). |

The wrong-colour hand-off from this strip is B2-01.

### F09 Looks

Looks, my Eid look shows "Planned for Sat 11 Oct" and "Last worn". "Show on Today" no longer pretends to wear it, and "Mark as worn", Yesterday, fixes my forgotten mornings. Rename in place works.

| ID | Kind | Severity | Issue | What I need |
|---|---|---|---|---|
| B9-01 | Confusing words | minor | "Use this look" on Today and "Show on Today" on look detail do the same thing. Hand-off rule 3 in `architecture.md` still says "Wear today". | One term, and rule 3 updated. |
| B9-02 | Too many steps, duplicate | minor | "Plan" on a saved look goes Adjust, Day, "Find outfits", Today, "Save look" (UC-F09-11) and saves a second look. I only wanted to put a date on the look I have. | "Plan" on look detail opens Day chips in place and sets the date on this look. |
| B9-03 | Confusing word | minor | Bokmål tab "Lagret" (saved) holds "Worn, not saved" rows and planned looks. | A tab word that covers saved, worn and planned. |

### F10 Build a look

Saturday, New look, hijab, kameez, shalwar, "Fill the rest", name "Eid", "Save look". It works.

| ID | Kind | Severity | Issue | What I need |
|---|---|---|---|---|
| B10-01 | Missing option | minor | A new look has no occasion and no day. "Fill the rest" for an Eid look ranks as everyday, and the look then needs the Plan detour (B9-02). | Occasion chip in the builder; Day chips after "Save look". |

### F11 Profile and style

Profile from the Today header. Your style is the one home for hijab and coverage. "Never worn" opens Closet with the filter (useful once B4-01 is fixed). Stylist is gone from my build. No new issues.

### F12 App-wide

Offline still gives an outfit, empty states all point onward. No new issues beyond B9-03.

### Pass 2 summary

Blocking: 6. Minor: 27.

Pass 1 blocking now resolved for me: A1-01 (with B1-01 as a minor follow-up), A2-01 (but see B2-02), A2-02, A4-01 in design (but see B4-01), A5-01 on piece detail and Confirm (but see B2-01), A7-01 in design (but see B7-01), A9-01.

Blocking, in the order they hurt me:

1. B6-01 "today only" sessions survive the night; Monday morning opens on Saturday's party outfit.
2. B2-01 Colour is never shown for Ready pieces, and a wrong hijab colour found on Today cannot be fixed from Today.
3. B4-01 No wear history at the start, so "Never worn" is the whole closet and the app cannot steer me off my favourites.
4. B7-01 A plan stays the active outfit every morning until the event.
5. B2-02 Adding only hijabs switches the stylist to my clothes and leaves the next morning without an outfit.
6. A6-01 Mood for work, still open as owner question 5.

### Architect response

Date: 2026-10-03. Each issue is fixed in `architecture.md` and `use-cases.md`, or declined with the reason. Domain changes are rows in the Domain touches table of `architecture.md`; each is additive and gets a unit test first in Phase 3. New shell rule: sessions end with their day.

| ID | Decision | How, or why not |
|---|---|---|
| B1-01 | Fixed | "Hair covered" starts on when hijab is Always; `SelfieReading.hairCovered` defaults from `everyday.hijab`. UC-F01-07. |
| B1-02 | Fixed | `finishOnboarding` writes the everyday style (Everyday, Both, hijab and coverage from step 1). Your style opens prefilled. The first-run card remains only for the skipped-onboarding path. UC-F01-10, UC-F06-01, UC-F11-02. |
| B1-03 | Fixed | "Start with the sample closet" lands on an outfit; "Try the sample style" is gone from that path. UC-F01-10. |
| B2-01 | Fixed | Every capture tile carries a colour dot and name; tap expands the colour chips under the tile, confirmed before "Add N pieces" (`correctImport` carries the confirmed colour). In the Change strip, "Not this colour?" under the current or previewed hijab opens the same chips, writes `setColour` and re-ranks the strip. UC-F02-02, UC-F02-22, UC-F08-06. |
| B2-02 | Fixed | `missingRoles` over the owned pool; the stylist switches to My clothes only when it returns empty. Until then the bar names what is missing, "Style today" is hidden and Today keeps styling the sample closet. Hand-off rule 8. UC-F02-21, UC-F06-11. |
| B2-03 | Fixed | Header "Select" on Add pieces, same as Closet; long press still works. UC-F02-01, UC-F02-20. |
| B2-04 | Fixed | Warmth chips on the confirm and on "Answer for N" for hijabs and layers. UC-F02-07, UC-F02-20, UC-F05-03. |
| B2-05 | Fixed | "Link as set" in the bar only when every added piece came from one photo. UC-F02-14. |
| B2-06 | Fixed | The grid stays with "N added" while tiles remain; it pops to Closet when empty. UC-F02-14, flow list F02. |
| B2-07 | Fixed | Hand-off rule 2: every styling entry opens Your style first when no everyday style exists. With B1-02 this is rare. UC-F02-14. |
| B2-08 | Fixed | Colour row directly under the photo on the confirm. UC-F02-07. |
| B3-01 | Fixed | Scanned pieces review is the group review screen: a thumbnail on every row. UC-F03-04. |
| B3-02 | Fixed | "Keep as a set" on the scanned pieces review with two or more kept rows. UC-F03-04. |
| B4-01 | Fixed | Closet select footer "Worn lately": `woreLately` writes one dated `wore` event per piece (no pairs learned), so `wearCounts`, `lastWorn`, Most worn and `wearBoost` work from day one. The "N added" bar offers "Mark what I wear most" once after the first owned add. Hand-off rule 4. UC-F04-12. |
| B4-02 | Fixed | "Not worn lately" is a first-row chip; Never worn and Put away under More. UC-F04-04. |
| B4-03 | Fixed | "Put away" everywhere: piece detail, Closet select, filter. "Archive" and "Archived" are gone. UC-F04-04, UC-F04-10, UC-F05-05. |
| B5-01 | Fixed | "Plan with this piece" on piece detail opens Adjust with the piece kept and the Day row focused. UC-F05-01, UC-F05-16. |
| B6-01 | Fixed | `ensureToday` on a new local date always sets `active: "everyday"` and drops an undated occasion session. Unit tests: undated gone on day two, dated kept inactive, dated gone after its date. Shell rule "Sessions end with their day". UC-F06-18. |
| A6-01 | Declined, interim added | A mood lever is an engine change and stays owner question 5, now marked as raised twice. Interim: a Knit chip in "Start with" (garment type sweater or cardigan, an existing lever), so a soft day is one tap instead of five. "Soft" and "Sharp" as words are not used because the stylist cannot promise a mood. UC-F06-09. |
| B6-02 | Fixed | "Planned for today" is the first block on Today on the planned date, above the everyday outfit. UC-F06-17. |
| B6-03 | Fixed | Action row ranked: "Wear this" pinned primary, "Compare hijabs" second, Another, Save look, Not for me and Undo in a quieter row. UC-F06-02. |
| B6-04 | Fixed | "Your day" lives in Your style (`EverydayStyle.exposure`) and feeds every forecast request; Adjust overrides it for one request. UC-F07-01, UC-F11-02. |
| B7-01 | Fixed | Planning never stays active overnight: `ensureToday` keeps a dated session inactive until its date passes and Today offers it back as "Plan for {day}, not saved" with "Open plan" (`resumePlan`) and "Drop". Hand-off rule 6. UC-F06-18, UC-F07-08. |
| B7-02 | Fixed | "Wear this" hidden while planning, "Save look" is the primary; `woreThis` refuses a dated session. UC-F07-08. |
| B7-03 | Fixed | "Back to today" with a changed, unsaved plan asks "Save this plan?" (Save look / Drop) through the system dialog. UC-F06-12. |
| B7-04 | Fixed | `plannedPieces` marks strip tiles "In {day}'s plan" for looks planned within seven days. UC-F07-08, UC-F08-02. |
| B7-05 | Fixed | One verb, "Start with": chips, "Start with a piece" (picker), "Start with these" (commit), "Start with this piece" (piece detail), banner "Started with {name}". "Keep" stays, it is a different act (holding a piece across Another). One-term list, UC-F07-05. |
| B8-01 | Fixed | Under a cold or snow request warm hijabs come first, then hue. UC-F08-02. |
| B8-02 | Fixed | Reasons name the matched piece ("Picks up the plum in the dupatta"); UX writer owns the sentences. UC-F08-02. |
| B9-01 | Fixed | "Show on Today" is the one name on look detail and the Today cards; hand-off rule 3 rewritten. UC-F06-08, UC-F06-17. |
| B9-02 | Fixed | "Plan" on look detail opens Day chips in place and sets `plannedFor` on this look; no Adjust detour, no second look. "Change pieces" restyles it. UC-F09-11. |
| B9-03 | Declined here, owner question 7 updated | The word belongs to the UX writer and the owner. The question now states the constraint: it must cover saved, worn and planned, and names "Looks" (loanword) and "Samling" as candidates. |
| B10-01 | Fixed | Occasion chip row in the builder, the look carries it and "Fill the rest" ranks for it; the day is set with "Plan" on look detail, one tap after save. UC-F10-01, UC-F10-02. |

Blocking resolved: 5 of 6. A6-01 remains an owner decision with the Knit chip as the interim path.

## Revision 1 walk

Date: 2026-10-03. Walked against "Revision 1 changes" and "Owner decisions" in `architecture.md`, the revision 1 rows in `use-cases.md`, `owner-feedback.md` rounds 1 and 2, `flows/F06-today.md`, `flows/F08-change-a-piece.md`, `flows/F04-closet.md`, `illustrations-v1.png`, and `src/domain` for what exists (none of the revision 1 functions exist yet; `Coverage` is still `full | moderate | own`, onboarding still has five steps).

Same person. New scenarios:

- R1 Fresh install on a Sunday evening, onboarding end to end.
- R2 Weekday, morning outfit at 07:00. Another week I try 21:00 the night before.
- R3 Ten new photos from my camera roll, then I keep browsing while they prepare.
- R4 Today with Rediscover and the coverage line, first week with my own clothes.
- R5 Closet with 70 pieces: sections and filters.
- R6 End of the month: what did I wear, and did I wear the green suit at the last family dinner?
- R7 Profile: things I never wear, things I want to wear more, the meter.

IDs are `C{flow}-NN`. A pass 2 issue that is open again keeps its pass 2 ID.

### F01 Start

R1. "What should we call you?" Sara, return. Hijab: Always. Then the styles cards. Hijab and Shayla look almost the same: a wrapped scarf with a long tail. Al-Amira looks like a plain hijab, not the two-piece tube cap I know. I pick Hijab and Al-Amira and guess. Coverage: the Modest figure wears a blazer, long sleeves and wide trousers to the ankle, which is how I dress for work, so I pick Modest. Everyday style: Western modest for most days. Fit: Loose. Then "How much sparkle?" For every day I say Plain; for Eid I want heavy. I tap Plain. Location in one tap, nice. 07:00 for the morning outfit. Selfie: the tips help, the circle takes the photo by itself, the palette shows hijab shades. That is the moment I wanted.

| ID | Kind | Severity | Issue | What I need |
|---|---|---|---|---|
| C1-01 | Wrong result for Desi events | blocking | "How much sparkle?" does not say for when. I answer for every day (Plain). The rule penalises a Desi piece above my level outside wedding occasions, so Eid, a dholki or a dinner party now prefers my plain kameez over the embroidered one. Eid is one of my main reasons for the app. | Ask about events, not every day: "For Eid and parties, how much sparkle?". Everyday outfits stay plain without asking. |
| C1-02 | Confusing picture | minor | The Modest figure (long sleeves, ankle-length trousers) is what the app later calls Fully covered on a piece. The picture and the meaning disagree. | Modest figure with elbow sleeves and a calf hem, as the domain reads it. |
| C1-03 | Look alike | minor | Hijab and Shayla cards are near copies; Al-Amira does not show the tube cap. I guess. | Hijab wrapped and pinned close, Shayla long and loose over one shoulder, Al-Amira as the two-piece cap and tube. |
| C1-04 | Asked, then unused | minor | Hijab styles change nothing in this revision (no scoring use), yet the meter later asks for them. | Fine to ask once. Do not count it in the meter until the stylist reads it. |
| C1-05 | Wrong picture for me | minor | The "A mix of both" card shows western and abaya. For me the mix is western and desi; "Abaya or desi" lumps two traditions and an abaya wearer gets kameez. | Third card shows western and desi. |
| C1-06 | Wrong default | minor | "Hair covered" starts on only for Always. On Sometimes I still take the selfie in my hijab. | Start on for Always and Sometimes. |
| C1-07 | Counting | minor | With Not needed the styles step is skipped but the bar still reads "of 10". | Count the steps she will see. |
| C1-08 | Same faces | minor | Every figure has the same pale face. | Vary skin tone across the set. |

### F02 Add pieces

R3. Add pieces, "Choose photos", ten from the camera roll. I go straight back. Closet shows "10 new pieces, 0 of 10 ready". I go to Today, press Another, look at a look. Nothing stalls. Back on Closet: "10 new pieces, 10 of 10 ready". I think they are in my closet. They are not until I tap Review and "Add 8 pieces".

| ID | Kind | Severity | Issue | What I need |
|---|---|---|---|---|
| C2-01 | Misread as done | minor | "10 of 10 ready" reads like finished. Nothing is in the closet until "Add N pieces". | When all are ready: "10 ready to add" with Review. |
| C2-02 | Out of sight | minor | I live on Today. The card is only on Closet, so ready pieces wait for days. | A count badge on the Closet tab while pieces wait. Nothing on Today. |
| C2-03 | No way forward | minor | "1 could not finish" has no action. | "Try again" on the failed tile in Review. |
| C2-04 | Unclear | minor | Every Ready tile has a colour dot that "is confirmed before Add". If each needs a tap, ten pieces cost ten taps. | The read colour stands unless I change it. |

### F04 Closet

R5. Sections with counts read well: "Hijabs 31", "Tops 14". The Tops chip jumps to Tops. More opens a long block with nine groups; at my larger text it fills the screen. Coverage "Fully covered" shows only my abaya and two maxi dresses. Every one of my long-sleeved blouses says "Needs layering" (see C5-01). "Not worn lately" is back under More.

| ID | Kind | Severity | Issue | What I need |
|---|---|---|---|---|
| B4-02 | Hidden entry (open again) | minor | Revision 1 put Worn back under More. Using more of my closet is why I am here. | "Not worn lately" as a chip next to More. |
| C4-01 | Long | minor | More has nine groups (Colour, Coverage, Season, Worn, Availability, Style, Occasion, Put away, Needs details). | Colour, Coverage, Season, Worn first; the rest after. |
| C4-02 | Floating menu | minor | "Mark as worn", "Link as a set" and "Put away" in Select sit in a native header menu. The owner asked for no floating menus. | The same actions as footer buttons, like "New look" and "Start with these". |
| C4-03 | Order | minor | 31 hijabs in a section in date order. | Hijabs ordered by tone inside their section, like the Change strip. |

### F05 Piece

| ID | Kind | Severity | Issue | What I need |
|---|---|---|---|---|
| C5-01 | Wrong result | blocking | `pieceCoverage` judges every piece by its own sleeve and length. A long-sleeved blouse at the hip is "Needs layering", wide trousers to the ankle have no sleeve, and the Fully covered filter returns only abayas and maxi dresses. My modest work blouses are labelled as if they were not. | Judge what the piece covers: tops by sleeve (and see-through), bottoms by length, one-piece garments by both. A long-sleeved blouse is Fully covered for the arms. |
| C5-02 | Words | minor | "Needs details" on a hijab or shoes would be noise if sleeve and length are asked of them. | Only facts that apply to the category count. |

### F06 Today

R2. 07:00, "Good morning, Sara. Today's outfit is ready". Tap, splash, Today, "Good morning, Sara". Lovely. The outfit, the coverage line "Blazer covers the arms". I want another hijab. Pass 2 gave me "Compare hijabs"; it is gone. Nothing on screen says the hijab in the picture can be tapped. I press Another three times hoping for a better hijab and lose the outfit I liked.

The week I chose 21:00: "Tomorrow's outfit is ready". I tap it in bed. Today shows today's outfit, the one I already wore. In the morning it is a third outfit.

R4. Rediscover under Start with shows six pieces "not worn yet": my black work trousers, my grey cardigan, my favourite plum hijab. I wear them every week. The app has no history yet, and the "Mark what I wear most" offer after adding is gone.

| ID | Kind | Severity | Issue | What I need |
|---|---|---|---|---|
| C6-01 | Main job hidden | blocking | Changing the hijab is now only a tap on the hijab in the flat lay, with a VoiceOver hint and no visible cue (F06 review log, F08). Hijab matching is why I use the app, and at 07:10 I will not discover a hidden tap. | One small, always-there mark on the hijab in the flat lay (a swap glyph), no new button in the rows. |
| C6-02 | Main goal inert (B4-01 again) | blocking | Rediscover lists never-worn pieces, and in the first weeks that is my favourites. The pass 2 fix, "Mark what I wear most" once after the first add, is gone from the "N added" Banner; "Mark as worn" is now in a header menu in Select, Today or Yesterday only. | The one-time "Mark what I wear most" offer back on the first "N added" Banner, and Rediscover hidden until some pieces have a wear. |
| C6-03 | Broken promise | blocking | At 21:00 the notification says "Tomorrow's outfit is ready", but the tap lands on today's outfit, and the morning builds a new one. The night-before choice is for my busiest mornings. | A 21:00 tap opens tomorrow's outfit with tomorrow's forecast, and that is the outfit Today opens on in the morning unless I change it. |
| C6-04 | Two controls, one act | minor | After Another, thumbs down on the card and "Not for me" by Undo are both on screen and do the same thing. `flows/F06-today.md` also still says the quiet row keeps three buttons, while revision 1 says Another alone. | One rule written once in both docs. |
| C6-05 | Same sentence daily | minor | "Abaya covers the arms and reaches the ankle" every day is noise. The line helps when a layer does the work. | Show the line when a layer or second piece meets the need. |
| C6-06 | Narrow | minor | Rediscover is never-worn only. A dress last worn in March never comes back. | Never worn first, then not worn lately. |

### F09 Looks and calendar

R6. Looks, Calendar. The month with dots is calm. "Most worn" shows my plum hijab, no surprise. "Variety: 38% of your closet". I tap the day of the family dinner: the look name, no occasion.

| ID | Kind | Severity | Issue | What I need |
|---|---|---|---|---|
| C9-01 | Missing info | minor | Before a Desi event I need "what did I wear in front of this family last time". Day rows show the look name only. | The occasion word on the day row when the look has one. |
| C9-02 | Number with no door | minor | "Variety" is a number I cannot act on. Profile numbers are doors (hand-off rule 7). | Tap opens Closet with "Not worn lately". |

### F11 Profile

R7. The meter: "The stylist knows 69% of your style", chips "Add body", "Add to I'll never wear", "Add to Trying to wear more of". I skipped body on purpose. I'll never wear: one long wall of 55 garment chips. I tap Black under Colours for clothes, and my black hijabs disappear from outfits too.

My sister answers hijab Not needed. Her meter shows "Pick hijab styles". The chip opens Your style, where the cards are hidden while hijab is Not needed.

| ID | Kind | Severity | Issue | What I need |
|---|---|---|---|---|
| C11-01 | Dead end | blocking | Completeness counts hijab styles for everyone, but the step is skipped and the cards are hidden when hijab is Not needed. The chip opens a screen without the answer, and the meter never reaches 100%. | Hijab styles leave the meter when hijab is Not needed. |
| C11-02 | Pushy meter | minor | An empty "I'll never wear" or "Trying to wear more of" is a real answer, and "Prefer not to say" for body is one too, yet the meter only fills when I add something. | Count an opened screen or a "Prefer not to say" as answered. |
| C11-03 | Wall | minor | 55 garment chips in one block. | Garments grouped by Closet category, same order as the sections. |
| C11-04 | Too wide | minor | A never-wear colour also removes hijabs of that colour. | Colours apply to clothes; hijabs only when I say so. |
| C11-05 | Scattered | minor | Onboarding asked fit next to style and sparkle; on Profile fit sits under Your taste and the rest under Your style. | Fit on Your style too, one home. |

### F12 App-wide

| ID | Kind | Severity | Issue | What I need |
|---|---|---|---|---|
| C12-01 | Missing words | minor | `copy.md` has none of the revision 1 strings yet (greeting, sparkle, morning outfit, progress card, calendar, meter, never wear). | UX writer pass before build, EN and NB. |

### Revision 1 summary

Blocking: 6. Minor: 26.

What works for me: one-tap location, auto capture and the palette, the greeting, the progress card that never blocks, sections with counts, the calendar on its own push.

Blocking, in the order they hurt me:

1. C6-01 Changing the hijab has no visible door on Today.
2. C6-02 Rediscover shows my favourites; the "Mark what I wear most" offer is gone again.
3. C6-03 The 21:00 "Tomorrow's outfit" opens today's outfit, and the morning shows a different one.
4. C5-01 Piece coverage judges a blouse by its hem, so my modest tops read "Needs layering" and the Fully covered filter is nearly empty.
5. C1-01 "How much sparkle?" answered for every day makes Eid and party outfits plain.
6. C11-01 The meter's "Pick hijab styles" chip is a dead end when hijab is Not needed.

### Architect response

Date: 2026-10-03. Each issue is fixed in `architecture.md` and `use-cases.md`, or declined with the reason. Domain changes are rows in the Domain touches table of `architecture.md` (changed in place, since none are built yet), each with a unit test first in Phase 3. The "Revision 2 changes" section of `architecture.md` lists the whole set. `flows/F06-today.md`, `flows/F04-closet.md`, `flows/F08-change-a-piece.md` and `copy.md` are the UX designer's and UX writer's files and follow `architecture.md` in their next pass.

| ID | Decision | How, or why not |
|---|---|---|
| C6-01 | Fixed | The hijab in the flat lay always carries a small plum swap mark at its corner, part of the hijab's own tap target; no button in the rows, no other piece marked. Inline modes table, flow list F06 and F08, UC-F06-02, UC-F08-02, UC-F12-07. |
| C6-02 | Fixed | The "N added" Banner's second action is "Mark what I wear most" while no owned piece has a wear (after "Link as a set" when that applies, before "New look"), and it returns on every Banner until a wear exists. It opens Closet select with the quiet row. `hasAnyWear`; `rediscover` returns nothing until it is true, so Rediscover is hidden. Hand-off rule 4, UC-F02-14, UC-F02-21, UC-F04-12, UC-F06-21. |
| C6-03 | Fixed | The 21:00 tap opens "Tomorrow's outfit": the everyday outfit for tomorrow's date with tomorrow's forecast under a Banner with "Back to today"; Another, the strip, Start with and Save work on it, "Wear this" is hidden. `TodayState.tomorrow` is promoted to the everyday session by `ensureToday` on that date, dropped after it. "Back to today" leaves a one-line "Tomorrow's outfit" Banner with "Show". Hand-off rule 11, UC-F06-23, UC-F06-18, UC-F01-19. |
| C5-01 | Fixed | `pieceCoverage` judges by category: tops, tunics and layers by sleeve and see-through, bottoms by length, dresses and abayas by both, hijabs, shoes, bags and accessories never. A long-sleeved hip-length blouse is Fully covered. UC-F04-04, UC-F05-01. |
| C1-01 | Fixed | Step 7 asks "For Eid and parties, how much sparkle?"; the rule reads sparkle on Eid, party, wedding guest and barat only, never on everyday or dinner requests. Same words on Your style. UC-F01-17, UC-F11-02. |
| C11-01 | Fixed | `completeness` counts only the questions she can answer; hijab styles leaves the meter when hijab is Not needed, so 100% is reachable and the chip never appears. UC-F11-08. |
| C1-02 | Fixed, next render | `coverage-moderate` re-rendered with elbow sleeves and a calf hem. Listed under Onboarding and in Dependencies. |
| C1-03 | Fixed, next render | Hijab wrapped and pinned close, Shayla long over one shoulder, Al-Amira as the cap and tube. UC-F01-13. |
| C1-04 | Declined | The meter measures answers given, not which rules read them; dropping a part when the engine does not yet use it would make the meter move with engine releases. Hijab styles stays one part for hijab wearers. |
| C1-05 | Fixed | Third card shows the western and the desi figure. UC-F01-15. |
| C1-06 | Fixed | "Hair covered" starts on for Always and Sometimes, off for Not needed. UC-F01-07. |
| C1-07 | Fixed | The bar counts the steps she will see: "3 of 9" when hijab styles is skipped. `stepsFor(answers)`. UC-F01-13. |
| C1-08 | Fixed, next render | Skin tone varied across the set. |
| C2-01 | Fixed | When no photo is preparing the card reads "N ready to add" (and "1 could not finish"), never "N of N ready". `captureProgress.done`. UC-F02-15, UC-F02-23, UC-F04-08. |
| C2-02 | Fixed | The Closet tab carries a badge with the ready count while pieces wait; nothing on Today. UC-F02-15, UC-F02-23. |
| C2-03 | Already there | The failed tile in Review has one "Try again" action (UC-F02-05); UC-F02-23 now points to it. |
| C2-04 | Fixed | The read colour stands unless she changes it; no tap is required before "Add N pieces". UC-F02-22 adds ten tiles with one correction. |
| B4-02 | Fixed | "Not worn lately" is a chip next to More, before the categories. UC-F04-04. |
| C4-01 | Fixed | More is ordered Colour, Coverage, Season, Worn, then Availability, Style, Occasion, Put away, Needs details. UC-F04-04. |
| C4-02 | Fixed | No header menu anywhere. Select has a pinned footer ("Start with these", "New look") and a quiet row under the count ("Link as a set", "Mark as worn" with Today / Yesterday chips in place, "Put away" or "Back in the closet"). Shell rule added. UC-F04-05, UC-F04-10, UC-F04-12. |
| C4-03 | Fixed | Hijabs ordered by tone inside their section, same order as the Change strip. `groupByCategory`. UC-F04-02. |
| C5-02 | Fixed | `needsDetails` lists only the facts `pieceCoverage` reads for that category; a hijab or shoes never carry the chip. UC-F05-18. |
| C6-04 | Fixed, one rule | Both controls are owner decisions (round 1 item 6, round 2 item 7) and are one action with one VoiceOver label: the icon is always on the card, the word sits next to Undo only after Another. The inline modes table row is the one rule; `flows/F06-today.md` is corrected to it in the UX designer's pass. |
| C6-05 | Fixed | The coverage line names a layer or bottom that does the work and is absent when the main piece meets every need by itself, so an abaya never reads the same sentence daily. `coverageNote`. UC-F06-19. |
| C6-06 | Fixed | Never worn first, then not worn in 30 days, oldest wear first; wear-more first within each group. `rediscover`. UC-F06-21. |
| C9-01 | Fixed | Calendar day rows carry the look's occasion word. `wearCalendar`. UC-F09-13. |
| C9-02 | Fixed | "Variety" opens Closet with "Not worn lately" on. Hand-off rule 7. UC-F09-12. |
| C11-02 | Fixed | An opened, empty "I'll never wear" or "Trying to wear more of" (`[]`, not `undefined`) and Body "Prefer not to say" count as answered. UC-F11-08. |
| C11-03 | Fixed | Garments grouped by Closet category in section order. UC-F11-09. |
| C11-04 | Fixed | A colour under Colours applies to clothes; "Hijab colours" is its own group. `NeverWear` colour entries carry `on: "clothes" \| "hijabs"`. UC-F11-09. |
| C11-05 | Fixed | Fit has one home, Your style; Your taste keeps the colour lean. UC-F01-16, UC-F11-01, UC-F11-02, UC-F11-03. |
| C12-01 | Handed to the UX writer | Every revision 1 and 2 string listed in `architecture.md` (greeting, sparkle question, morning and tomorrow notifications, progress card, tab badge, calendar, meter, never wear, Mark what I wear most, Tomorrow's outfit) goes into `copy.md` in EN and NB before build. |

Blocking resolved: 6 of 6. Declined: C1-04. Handed on: C12-01 (copy), the three illustration re-renders, and the flow docs.
