# Today: everyday style and occasion restyling

## Confirmed requirements

- Carry forward Direction A's look and feel.
- Preserve its white/light neutral background so garments and colors remain prominent.
- Allow a saved default style and an outfit based on it every day.
- Allow restyling for an occasion.
- Prioritize hijab matching to the complete outfit and style.
- Help the user use more of her wardrobe beyond favorite pieces.
- Allow changing an individual piece in a generated outfit.
- Help assess whether an outfit, including Desi clothing, is suitable and dressy enough for the intended occasion.
- Let the user choose a mood for work and daily styling.
- Offer relevant outfits that have already been created.
- Accept garment-type requests, including a blazer today or a dress for work.
- Build around any number of exact owned pieces chosen by the user, including shoes and a bag or a single pair of trousers.
- Provide an explicit choice between Desi and Western styling.
- Adapt clothing and layers to weather, including warm days and cold or snowy conditions.

## Two styling paths

Surface mode: Operate. Help her reach a complete outfit with little effort, while keeping the live flat lay as the visual focus. Direction A and the existing manual builder remain the visual foundation.

| Path | Starting context | What she can change |
| --- | --- | --- |
| Everyday | Saved default style, usual occasion, coverage, and current weather when supplied | Today's mood, garment type, exact pieces, style, and weather |
| For an occasion | A temporary request for work, dinner, a celebration, or another event | The same controls, plus any event expectations that matter |

Everyday describes the repeatable flow. Her default occasion may be Work. Today's overrides apply to the current request. Only Edit everyday style changes future defaults. Both paths can reuse eligible saved looks or assemble a new combination.

### Choose the starting pieces

| Her request | Interpretation | Behavior |
| --- | --- | --- |
| I want to wear a blazer today | Require a blazer garment type | Choose an available owned blazer and complete the outfit |
| A dress for work | Require a dress and set occasion to Work | Find an appropriate complete combination, including required coverage layers |
| Use these shoes and this bag | Keep two exact owned item IDs | Complete the outfit around both |
| Use these trousers | Keep one exact owned item ID | Find the remaining clothing and a suitable hijab |
| Keep these three pieces and try again | Keep three exact IDs | Change only the remaining pieces |

Specific pieces and garment-type requirements can coexist. A selected blazer can satisfy the blazer request without adding another. Do not assume every item in the broad Layers category is a blazer or every item in Dresses & abayas satisfies a request for a particular dress type.

Proposed controls: a short optional What would you like to wear? input, garment-type shortcuts, and Choose pieces. In the closet and manual builder, Style around these takes the chosen pieces into this flow. It does not turn an ordinary manual edit into generation automatically.

Mark user-chosen pieces Keep in every option, with an accessible tap action to release one. Generated pieces remain changeable unless she explicitly keeps them. Try another retains the same chosen IDs, type requirements, style, occasion, weather, and coverage. Change this piece still replaces only that item.

Allow one or many selected pieces, without imposing a one-item-per-category rule that would prevent valid layering. If the selection is already complete, show it and offer an optional change. If it cannot form a suitable outfit, explain the specific conflict and let her change the request or release a piece. Never silently omit a chosen item or add clothes she does not own.

### Desi and Western

Place Desi and Western in a visible outfit-style selector shared by both paths. Save a preferred choice in the everyday default. An optional Either / Mix choice is a proposal for later discussion, and must not weaken an explicit Desi or Western request.

Keep style separate from occasion and garment category. Desi can be appropriate for work or celebrations; Western can be casual or dressed up. Clothing may have multiple style tags. A shared bag, pair of trousers, or hijab can participate in either style without duplicating the closet item. A Desi request can still use the selected everyday shoes and bag when the complete combination fits the requested style.

The closet should offer the same style filter alongside its existing garment categories. Support multi-part sets while allowing their individual pieces to be used separately. Keep Arab garments and mixed wardrobes representable in the data; detailed extra selector options can follow.

### Weather and comfort

Treat weather as part of the request in both paths. For the first styling increment, propose a simple editable warmth choice, Warm / Mild / Cold, with Rain or Snow when relevant. Optional Mostly indoors / Time outside context helps distinguish a heated workplace from the journey there. Avoid requiring this detail every morning.

Later, an optional weather provider can prefill conditions for a chosen city or a location shared with permission. Keep manual input available. Show the place, date, and forecast freshness. Sun alone must not mean warm: temperature or feels-like temperature, precipitation, wind, and her comfort preference matter. A future occasion needs weather for its own date and place when available.

Use known garment attributes to suggest lighter fabrics, warmer layers, or suitable footwear. Keep uncertainty explicit: fabric warmth, breathability, water resistance, and snow suitability cannot be assumed from appearance. Snowy outdoor use must not be labeled suitable just because the outfit contains a coat. If the closet lacks suitable pieces, explain the gap and preserve her selected items until she chooses a change.

Show removable outdoor layers as part of the same outfit when needed, with a proposed Indoors / Outside preview toggle. Both views retain the same underlying outfit. Required modesty must still hold when an outdoor layer comes off. Do not substitute a heavy coat for an explicitly requested blazer; keep the blazer and add a compatible outer layer if one is available and needed.

Weather changes do not silently replace a chosen outfit. Offer an update when conditions change materially. If a forecast is unavailable or stale, show that state and use manual conditions or clearly identified recent data, without inventing a current forecast.

### First styling increment

Add a Today surface using the existing live flat lay. Keep a compact occasion/style/weather summary near the outfit and put detailed adjustments in a sheet. Everyday starts with a suggestion; For an occasion opens the temporary request. Choose pieces and garment-type shortcuts work in both. Keep mood optional and expose matching saved looks beside new combinations.

Start with structured controls and a small local suggestion engine using reviewed sample attributes. Evaluate blazer, dress, Desi/Western, and multiple-piece requests before adding conversational parsing. A later language provider translates a sentence into the same editable request; it must not own the outfit rules. The sample wardrobe lacks verified weather attributes and dedicated snow gear, so extend its reviewed metadata and test fixtures before demonstrating those results.

This is the next proposed styling slice, alongside the already planned photo-import automation. Detailed weather integration, free text, and ranking refinement follow separately. No new model dependency is required just to validate the flow.

## Proposed screen

[Daily outfit](concepts/a-daily-style.png) and [occasion chooser](concepts/a-occasion-sheet.png).

Headline: Styled for your day. Subline: A fresh look from your own closet.

Show Your everyday style, followed by its name and an Edit action. Relaxed layers is an illustrative name, not a preference supplied by the user. The user reaches a complete outfit without pressing Style me first.

Keep the current occasion and an optional mood easy to adjust without crowding the outfit. Example context: Work and Comfortable. The daily choice can reuse a saved look, adapt one, or offer a new combination. Daily styling does not require inventing a new outfit when a saved one fits well.

The collage is followed by its name, piece count, and short coverage summary. Actions:

- Save look saves the combination to Looks.
- Restyle for an occasion opens the occasion chooser.
- Try another produces an alternative using the current request context.
- Match a hijab opens owned alternatives against the current outfit. It should be visible near the collage, and also accessible by tapping the hijab.
- More options exposes Build my own and Use a reference photo.

After choosing an occasion or mood, show relevant saved looks alongside an action to explore new combinations. Keep a small number visible initially, with See all for the rest. These are proposed interaction details, not yet reflected in the existing mockups.

Tapping any garment offers Change this piece and Keep this piece. Do not require drag gestures. Match a hijab is the prominent entry to the same replacement flow.

## Hijab matching proposal

Show a few available owned hijabs with photographs and short reasons grounded in known attributes and the user's preferences. Compare palette, undertone where reliably known, pattern, fabric or finish, drape, and occasion. These are candidate ranking signals to evaluate with her; color similarity alone is not the whole request.

Preview each candidate in the full outfit on the same light canvas. Use photographs rather than relying only on color swatches. Let the user accept the replacement or return to the original. Never invent a third option if only one or two suitable owned hijabs are available.

Matching should reflect personal taste. A rejection of one pairing is not evidence that the user dislikes that hijab in every outfit. Do not infer skin tone or body attributes from garment photos.

## Changing one piece proposal

Keep all unselected pieces fixed while finding alternatives for the selected role. Preserve the active occasion, style, pinned items, and coverage preferences. A hijab replacement changes only the hijab; a trousers replacement changes only the trousers.

Reevaluate the complete layered outfit before presenting a replacement as suitable. If no single-piece replacement works, explain the conflict and offer a separately chosen action to restyle related pieces. Do not silently regenerate the whole outfit.

Preview, confirm, and undo should be available. A saved source outfit stays unchanged until the user explicitly saves an edit or a new look. Updating a daily look does not change the everyday style preset.

## Rediscovering the wardrobe proposal

Make daily suggestions a comfortable mix of favorites and pieces the user does not usually choose. A proposed Rediscover my wardrobe action can deliberately build around one of those pieces while keeping a familiar anchor. For example, combine a favorite outer layer with a different owned top and a matching hijab.

Use explicit favorites, recent suggestions, availability, and optional user-reported wear to guide variety. Saving or generating an outfit is not proof it was worn. Without wear records, describe a piece as a new suggestion rather than claiming it has not been worn recently.

Allow a simple reason such as Not my style, Doesn't fit, or Not available when dismissing a piece. This can prevent repeatedly surfacing an unsuitable garment. Discovery is supportive and optional; it must not punish favorite pieces or override coverage and comfort.

The exact discovery control and optional Wore this action remain proposals. A full wear-history dashboard is not required for the first version.

## Default style proposal

One editable everyday preset combines the established coverage preferences with taste, fit, usual occasion, preferred Desi/Western styling, and warmth preference. Examples include relaxed layers, tailored, colorful, and minimal. These are examples, not the wife's supplied default. Cultural garment preferences can coexist. The editor will be mocked up separately.

Explicitly editing the default changes future daily suggestions. Trying an occasion does not implicitly edit it. Multiple named defaults and weekday schedules are not required for this first flow.

## Work and mood proposal

Ask How would you like to feel today? with optional choices such as Comfortable, Polished, Colorful, and Low effort. Allow the user to skip or describe another preference. These are user-selected styling intentions; never infer emotional state from photos or behavior.

Use a saved, user-described workplace dress code when supplied. Mood adjusts recommendations within that context and the user's coverage requirements. Comfortable does not automatically mean casual, and Polished does not automatically mean Western tailoring. Known comfortable Desi and mixed outfits can remain candidates.

The selected mood applies to the current request. It should not silently change the everyday style or become a permanent taste inference. Keep mood optional, and avoid storing a long-term mood diary as a side effect of styling.

## Occasion appropriateness proposal

Support the question Is this dressy enough? on a current or saved outfit. Determine the relevant event and expected level of dress first. An event label or garment tradition alone is insufficient evidence of a universal dress code.

Possible context includes event type, host-provided dress code, setting, the user's role, and how understated or dressed up she wants to feel. Request only the missing detail that would materially change the advice. Everyday work suggestions should not require filling out an event questionnaire.

Desi clothing can be considered through the full combination: known fabric and finish, embellishment, silhouette, dupatta, hijab, shoes, and accessories. Do not infer religion, ethnicity, or appropriate formality from a garment category. Do not assume a dupatta replaces a required hijab.

Give contextual language and short reasons, for example Likely suitable for the dinner you described or More understated than the look you chose as a reference. These are illustrative response patterns, not assessments of the sample wardrobe. Avoid a universal dressiness score or an assurance based on uncertain photo attributes.

Offer an owned-piece change when one would help, with the existing preview and confirmation behavior. Do not assume one accessory can always make an outfit suitable. If no owned combination meets the request, explain the gap without introducing shopping.

Let the user optionally reference a previously saved outfit she explicitly considers right for similar events. Feedback such as Too casual, Too dressy, or Just right applies to that context. Merely saving a look does not prove its appropriateness or that it was worn.

## Previously created outfits proposal

Use intentionally saved looks, whether built manually or generated and then kept, as the initial library. Automatic history of every generated draft is not yet requested or approved.

For the active occasion, mood, and coverage profile, retrieve eligible saved looks before deciding whether new combinations are needed. Show them as From your looks, with New combinations available when the user wants more variety.

Each saved look supports Use this look, Change a piece, and Make another like this. Reevaluate current ownership, item availability, and coverage before presenting it as ready to wear. A look with an unavailable garment may remain in the library with a clear explanation and a repair option; it must not appear as a complete ready-to-use match.

Keep the source look unchanged while trying variants. Saving a variation creates a new look unless the user explicitly chooses to update the original. When there are no saved matches, explain this and offer a new combination without inventing saved results.

## Daily behavior proposal

On first opening of a new local day, create or retrieve that day's suggestion using the default and currently available clothes. Keep it stable through later openings that day. Try another explicitly requests a change.

Retain saved looks and manual edits. Do not regenerate during editing or discard an occasion look when returning from another screen. The baseline daily suggestion and current occasion variant have separate contexts.

First opening may show a short loading state. Do not promise an exact background schedule or readiness at a particular hour. Offline and unavailable-model behavior follows the existing local baseline and manual-building plan.

If the closet cannot form a suitable complete outfit, identify the missing information or garment role. Do not repeat unsuitable suggestions just to meet a daily cadence.

## Occasion chooser proposal

Open a native sheet titled What are you dressing for? It offers Work, Everyday, Celebration, and Something else. These labels are examples for discussion.

Choose pieces optionally keeps any number of owned items, such as the current hijab or a bag and shoes. A garment-type request, style selection, and weather can also be set here. Create occasion look makes a temporary variant. Coverage preferences stay the same, and this changes this look only.

Refine the earlier Create occasion look proposal to Find outfits so existing saved looks can be returned before asking for a new combination. For ambiguous celebrations, ask for the particular event and expected dressiness only as needed. Work can expose the optional mood choices.

Cancel returns to the unchanged daily outfit. After generating, show the selected occasion and offer Back to today's look. Try another varies the current occasion until the user returns to the baseline.

When an occasion conflicts with a pinned item and required coverage, explain the conflict and allow a different occasion or unpinning. Never silently relax coverage.

## Data and capability implications

Add a default-style reference and a daily-suggestion record keyed by user and local date. Record the preference version and owned item IDs. Reevaluate validity when an item becomes unavailable or preferences change.

An occasion variant references the baseline and carries its own occasion and pinned item IDs. Generating it does not mutate the default-style record. The existing outfit use case handles both contexts; no additional model layer is needed.

A replacement request includes the selected role and fixed IDs for all other pieces. Candidate ranking considers the complete fixed outfit. Keep recommendation exposure separate from explicitly recorded wear. These are additions to the existing outfit request, ranking, and feedback contracts.

The styling request can additionally carry explicit mood, event expectations, an optional user-approved reference look, and a preference for saved or new results. Saved-look retrieval and newly assembled candidates use the same eligibility checks. Keep contextual dressiness feedback separate from global garment preferences and avoid persisting transient mood without a reason.

Represent exact required item IDs and requested garment types separately. Include the active Desi/Western choice, weather with source/time/place when known, warmth preference, and optional indoor/outdoor context. Changing providers must preserve these meanings. Validation checks every required ID and type before a result is shown. Retrieved saved looks must contain all exact required pieces; label adapted looks as new variants.

Add garment subtype and optional multiple style tags, alongside reviewed warmth, material, and weather-suitability attributes as needed. Keep unknown values explicit. These attributes belong to the existing garment-analysis/review flow, with corrections available; users should not have to complete another long form to get dressed.

## Acceptance checks for later implementation

- First opening shows a default-based daily suggestion without a generation-button press.
- Reopening preserves it unless the user changed it or it became invalid.
- Occasion changes preserve coverage and the everyday default.
- Pinned pieces remain or a conflict is explained.
- A blazer request includes an actual owned blazer; a dress-for-work request includes a dress and retains Work context.
- Requests around shoes and a bag preserve both exact IDs; a trousers request preserves those exact trousers.
- Repeated alternatives retain every required ID and garment type until the user changes them.
- Desi/Western affects the complete outfit and closet filter, while shared accessories remain usable in either style.
- A temporary style change leaves the saved everyday choice unchanged.
- Warm and cold requests use reviewed clothing attributes; sunny cold weather does not trigger a warm-weather outfit.
- Outdoor layers can be removed without losing required indoor coverage. Unknown snow footwear suitability is not presented as verified.
- Forecast failure leaves manual weather input usable; a different occasion date does not reuse today's forecast as if current for that event.
- Cancel and Back to today's look preserve the baseline.
- A new day does not erase saved looks or unsaved edits.
- Garment images keep their colors on the light canvas.
- Replacing one piece leaves every other item ID unchanged unless the user chooses a broader restyle.
- Hijab alternatives are owned, available, and checked against the full outfit and coverage profile.
- A rejected pairing does not become a blanket dislike of the garment.
- Discovery uses suitable overlooked pieces when the closet permits it, without inventing wear history.
- Cancel and undo restore the previous combination; saved source outfits are not silently overwritten.
- Work mood affects suggestions while preserving the stated workplace dress code and coverage.
- Occasion advice states its context and does not equate Desi garments or an event name with one fixed formality level.
- Suitable saved outfits appear as options without requiring new generation.
- Saved outfits with missing or unavailable pieces are not presented as ready to wear.
- Saving a look is not treated as proof of wear, approval of every pairing, or a successful occasion.

These describe future styling implementation. The current app has a local closet, live manual flat-lay builder, and saved looks. Today and automated styling remain planned.

The existing two mockups predate the garment requests, multiple chosen pieces, Desi/Western selector, and weather controls, as well as prominent hijab matching, rediscovery, mood, and saved-result options. The next visual study should show the everyday view, occasion adjustments, and a result built around selected pieces within Direction A.
