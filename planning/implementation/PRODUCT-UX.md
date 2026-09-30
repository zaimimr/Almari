# Product behavior and UX specification

Read with [the handoff](../../BUILD-PLAN.md). This is an implementation specification. Personal preference examples are illustrative until the wife supplies her own answers.

## 1. Design around her day

The first user already has clothes, recurring favorites, and some combinations she trusts. She should be able to arrive with no idea, a garment type in mind, several pieces chosen, or a known occasion. All four starting points should reach the same understandable outfit experience.

| Situation | Her task | Successful experience |
| --- | --- | --- |
| Getting ready for work | Find something comfortable and appropriate quickly | One useful complete outfit appears; alternatives are nearby |
| A hijab does not feel right | Compare scarves against the outfit | Only the hijab changes, with the whole combination visible |
| She wants a blazer today | Start with a type of garment | The app chooses an actual blazer she owns |
| Shoes and a bag are already chosen | Complete the remaining outfit | Both exact items remain in every result |
| Wearing Desi clothing to an event | Judge the combination in context | Event expectations guide suggestions and explanations |
| Returning to the same few favorites | Discover a different combination | A familiar piece can anchor a suitable less-used suggestion |
| Cold commute, heated workplace | Dress for both settings | Removable outer layers and indoor coverage work together |
| Adding several clothes | Avoid catalog administration | Photograph, review thumbnails, save ready pieces together |

The personal pilot tests usefulness and effort. It must not treat her as a labeling service for a large training dataset. Avoid repeated questionnaires, compulsory daily logging, streaks, wardrobe guilt, body scoring, or shopping suggestions.

## 2. Navigation and information hierarchy

### Initial styling release

- Today: daily suggestion, occasion changes, starting pieces, and garment-type controls.
- Closet: add, search, filter, inspect, and correct clothing.
- Looks: intentionally saved outfits and useful variants.
- Profile/settings from Today: everyday style, coverage, privacy, device storage, help, and later account controls.

Add a Stylist tab only when conversation can complete useful tasks. Until then, use clear controls on Today. Keep Help and photo guidance accessible from capture and settings. Do not add a nonfunctional tab as a promise.

### Screen inventory

| Screen or focused sheet | Main task | Primary action |
| --- | --- | --- |
| First use | Try samples or begin with real clothes | Try sample closet / Add my clothes |
| Coverage setup | State essential personal preferences | Save preferences |
| Everyday style | Set usual occasion and taste | Save everyday style |
| Today | Choose an outfit for today | Save look or use a saved look |
| Occasion adjustments | Set a temporary request | Find outfits |
| Choose pieces | Keep one or many exact items | Style around these |
| Replace a piece | Compare alternatives for one role | Use this piece |
| Closet | Find or add clothing | Add pieces |
| Capture | Photograph clothes in a batch | Take photo / Review photos |
| Import review | Accept prepared pieces and resolve failures | Add ready pieces |
| Item detail | Inspect and correct one item | Save changes |
| Looks | Reuse a saved combination | Open look |
| Look detail | Use, edit, or vary a combination | Use this look / Change pieces |
| Reference import | Describe what she likes in a reference | Find outfits from my closet |
| Data and privacy | Control storage, sharing, and deletion | Context-specific action |

Use separate screens when the task needs room, such as batch review. Use a sheet for focused temporary adjustments that benefit from returning to the visible outfit. Preserve drafts through dismissal, or explicitly confirm discarding unsaved edits.

## 3. First use and preferences

### A useful start

1. Show the closet's value through a clearly labeled sample combination.
2. Offer Try sample closet and Add my clothes. Do not mix samples into real suggestions without an explicit sample mode.
3. For real styling, ask essential coverage choices with Skip for now available.
4. Let her choose a usual occasion and Desi/Western preference. Present actual options, not a personality quiz.
5. Guide her to capture a small useful selection, such as two outfits and a few alternative hijabs, using the photo tutorial.
6. Review ready pieces and show the first suggestion when the closet can form one.

A skipped coverage profile permits browsing and manual styling. It must not produce an assurance that recommendations match personal coverage requirements. Clearly explain the missing preference when it becomes relevant.

### Coverage questions

Use plain descriptions: hair/neck coverage, sleeve reach, leg/hem coverage, preferred looseness, and whether a lining or underlayer is needed. Support separate contexts later if she asks, such as different private or public settings. Never infer these from her name, religion, face, or nationality.

Body shape and measurements are optional future aids. Useful early questions concern fit on her: This reaches my ankles, I prefer this over trousers, I only wear this with an underlayer. Do not ask for a body photo or infer skin tone to match a scarf.

### Everyday preset

Start with one preset containing usual occasion, style direction, preferred silhouettes, coverage profile, and warmth comfort. Mood can be a temporary choice. A preset might be Work, Western, relaxed tailoring, but that is an example, not a seeded assumption about her.

Let her try a suggested sample preset in sample mode. Entering real mode should invite review of personal preferences rather than silently adopting sample coverage.

## 4. Everyday and occasion styling

### Everyday behavior

- On the first visit each local day, retrieve or compute a suggestion from the saved preset and available clothing.
- Save the chosen item IDs and request context. Reopening the app should show the same choice.
- Try another is explicit. It retains the active constraints and advances to another eligible combination.
- Today's edits are temporary. Save as my everyday style is a separate deliberate action.
- Preserve an active unsaved edit across midnight. Offer the new day's suggestion after the draft is saved or dismissed.
- Recheck deleted/unavailable items on revisit. Explain invalidation before offering a repair.
- Do not promise a particular background execution time. First opening may perform the work.

### Occasion behavior

Restyle for an occasion opens a temporary request. Start with familiar choices such as Work, Everyday, Dinner, and Celebration, plus a way to describe another event. Celebration may need a second detail about the event or dress code; an ordinary work request should not open a long form.

Carry over coverage, selected starting pieces, and her current style only when visibly shown in the request. Show occasion, style, weather, and kept pieces together before generation. The user can clear or change each explicitly.

Cancel restores the original daily suggestion. Back to today's look returns to the stable baseline after exploring a variant. Keeping an occasion look does not overwrite the daily preset. Returning from another tab should preserve the occasion draft.

### Context precedence

Apply the active request's explicit choices over preset defaults. Exact kept items and required garment types are constraints. Coverage and known availability remain constraints too. If constraints conflict, show a conflict; priority rules must not silently discard one of them.

Fresh weather may propose an adjustment but must not replace a look she is editing. A future event uses its own date and place. Manual weather input takes priority until she chooses forecast-based weather again.

## 5. Garment types and exact pieces

These are different requests and need different data fields.

| Request | Required type | Exact required IDs |
| --- | --- | --- |
| A blazer today | Blazer | None |
| This navy blazer | Blazer if explicitly requested | Selected blazer ID |
| A dress for work | Dress | None |
| These shoes and this bag | None | Both selected IDs |
| A blazer with these trousers | Blazer | Selected trousers ID |

Use a small garment-type selector initially: No preference, Blazer, Dress, Kurta/tunic, and Trousers as appropriate for the reviewed catalog. Natural language later fills these same fields. Do not depend on matching the substring blazer in the item name.

Choose pieces supports any number of items. Show selected thumbnails and a visible count, with an action to remove an individual choice. Starting pieces can also come from an item detail or manual builder through Style around this / Style around these.

User-chosen starting pieces are kept by default for that generation session. Suggested pieces are not automatically kept. Label the distinction with a lock icon and readable Keep action, plus accessible state text. Never require a long press to discover it.

Try another preserves all kept IDs and required types. If only one valid outfit exists, say so and offer a targeted change. If the chosen selection already makes a complete outfit, show it without adding unnecessary accessories.

Selecting several pieces in one category is allowed. A complete layered outfit may include a dress and trousers, an underlayer and tunic, or multiple layers. Validate the actual combination. If two pieces cannot be used together, name those pieces and offer specific resolution actions.

## 6. Desi and Western

Place a clear Desi / Western control in everyday and occasion adjustments. Include the same filter in the closet. Store it separately from garment category and formality.

Support garment types such as kurta, kameez, shalwar, straight trousers, palazzo trousers, dupatta, abaya, maxi dress, blazer, and hijab. Search should recognize common transliterations such as salwar and shalwar while keeping her preferred display label.

A garment can support several style contexts. Shared bags, hijabs, and shoes should remain available in either path. A Desi request should be recognizable through the whole combination, not rejected because its shoes have a Western-style label.

Keep matching-set relationships: a kurta, trousers, and dupatta can be linked while remaining individually selectable. A dupatta and a hijab have distinct roles. Do not automatically substitute one for the other.

An optional Either / Mix choice can follow a user review. Preserve room for Arab and other garment traditions in the data. Do not add an unexplained culture taxonomy to onboarding.

## 7. Weather and comfort

Initial controls: Warm, Mild, Cold; and Dry, Rain, Snow. Explain that these are conditions she selects. Offer Mostly indoors / Time outside only where useful. Temperature thresholds are configurable guidance to evaluate with her, not universal comfort facts.

The eventual forecast context includes location, date/time window, feels-like temperature, precipitation, and wind. Sunny does not establish warmth. A winter trip outside and an afternoon in a heated office need different layering considerations.

Keep the requested blazer when adding an outdoor coat, if compatible clothes exist. Offer an Indoors / Outside view when removable outer layers are present. Indoor coverage must remain valid after those layers are removed.

For warmth, breathability, water resistance, and footwear grip, use known or owner-confirmed attributes. Do not certify snow suitability from a photograph. If no suitable combination is available, state the missing role and offer to adjust context or build manually. Avoid turning the gap into a shopping prompt.

No location permission is needed for manual conditions. Later, allow a typed city and optional location sharing. Forecast failures preserve the last chosen outfit and expose manual controls.

## 8. Hijab matching and single-item replacement

Match a hijab should be visible near the outfit and reachable by tapping its scarf. Keep the complete outfit visible above a horizontal strip of alternatives on iPhone. The scarf photographs should be large enough to compare texture and print, with zoom available.

For each alternative, consider known palette, contrast, print balance, finish, drape preferences, availability, coverage, and occasion. Color matching alone is insufficient. Do not infer fabric composition or personal coloring from an image.

Preview a candidate immediately, then offer Use this hijab and Cancel. Keep all other IDs fixed. Explain a pairing in one short factual sentence where evidence exists. Avoid fabricated certainty such as Perfect for your skin tone.

Use the same replacement mechanism for every role. If changing trousers requires another garment to preserve coverage, present that as an optional broader restyle. Do not perform it through the single-item action.

Support undo for the last accepted replacement. A saved source look stays unchanged until Update saved look is explicitly selected. Save as new look creates a separate variation with its source reference.

## 9. Saved looks, mood, and rediscovery

### Saved looks

Search relevant saved looks before building new combinations. Show From your looks with a small initial selection and See all. A saved match must satisfy current required IDs, requested types, availability, and coverage. An adapted saved look is a new variation and should be labeled accordingly.

Use this look changes the current choice. Change a piece opens replacement. Make another like this asks what to retain: palette, silhouette, occasion, or selected items. Duplicate preserves the source without reinterpreting it.

Saved looks with missing items remain understandable recipes with a repair action. They must not appear as ready-to-wear matches. Do not fill a three-result layout by inventing alternatives when only one exists.

### Mood

Offer optional styling intentions such as Comfortable, Polished, Colorful, or Low effort. Allow free text later. These influence ranking within the selected occasion and workplace expectations. They do not relax coverage or silently become permanent profile facts.

### Rediscovery

Use explicit favorites, suggestion exposure, availability, and optional confirmed wear. Balance a familiar anchor with another suitable piece. Let her request Use more of my closet without requiring tracking every outfit.

Generation, saving, viewing, and wearing are separate events. Without wear records, say A new combination or A piece you haven't used in a saved look. Avoid claims that she has not worn something.

Feedback should be quick and contextual: Wrong color pairing, Too dressy, Too casual, Not comfortable, Not available, or Not my style. A disliked pairing must not globally blacklist the hijab or garment. Wore this is optional and easy to undo.

## 10. Occasion appropriateness

Offer Is this dressy enough? on a current or saved look once contextual advice is implemented. Ask for the event and any known dress expectations; optionally use an outfit she explicitly considers appropriate as a reference.

Desi event examples may include dinner, Eid, mehndi, nikkah, walima, and other celebrations. Treat labels as context prompts, not fixed dress codes. Formality depends on the particular event, her role, known materials and embellishment, and the full combination.

Phrase advice as a contextual recommendation with an uncertainty note when needed: This looks more understated than the reference you chose. Offer a specific owned-piece change if it would help. Do not output a religious assessment or universal dressiness percentage.

## 11. Reference photos and conversation

Start with a selected screenshot or photo; a Pinterest account integration is unnecessary. Let her crop the reference and say what she likes: colors, shape, layering, print, or overall feel.

Produce an editable brief, then match owned clothes. Preserve coverage through appropriate substitutes. Show what was captured and what differs. Do not fabricate ownership, recreate branded product shots as her clothes, or promise exact replication.

Conversation can later express the existing actions: Use a blazer, Keep these shoes, Change only the hijab, Make it warmer, or Show saved Desi work looks. Unsupported or ambiguous requests need an editable clarification. Never let text in an uploaded image become application instructions.

## 12. Important states and recovery

| State | What remains visible | Recovery |
| --- | --- | --- |
| Suggestion loading | Previous outfit or accurate empty preview | Cancel; retain current request |
| No eligible combination | Kept pieces and requested context | Explain the specific conflict; change one constraint |
| Essential attribute unknown | Item in question and why it matters | One focused confirmation or choose another item |
| No clothes | Small capture/sample invitation | Add pieces or try clearly labeled samples |
| Save fails | Full draft and selections | Retry without a duplicate or data loss |
| Item removed elsewhere | Saved recipe with missing-item notice | Choose replacement; retain the original record |
| Provider unavailable | Manual builder and saved outfits | Local fallback where eligible; no silent upload |
| Weather unavailable | Chosen outfit and dated weather state | Enter conditions manually |
| App backgrounded | Durable import jobs and outfit draft | Resume safely without surprising regeneration |
| Unsaved navigation | Current draft | Keep editing or discard explicitly |

Every asynchronous result must be tied to the request version that produced it. A late result for the previous occasion must not replace a newer outfit.

## 13. Proof with the wife

Use short, realistic sessions. Let her complete tasks without explaining where buttons are. Observe hesitation, repeated corrections, and whether she wants to wear the result. Ask What would you change? and What made that feel wrong? rather than seeking approval of the implementation.

Do not collect personal body data or retain photographs outside the app without explicit consent. Keep research notes about task outcomes and product decisions. See [Delivery](DELIVERY.md) for the scenario set and evaluation gates.
