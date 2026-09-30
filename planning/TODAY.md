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

One editable everyday preset combines the established coverage preferences with taste and fit preferences. Examples include relaxed layers, tailored, colorful, and minimal. Cultural garment preferences can coexist. The editor will be mocked up separately.

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

Keep a piece optionally pins an owned item, such as the current hijab. Create occasion look makes a temporary variant. Coverage preferences stay the same, and this changes this look only.

Refine the earlier Create occasion look proposal to Find outfits so existing saved looks can be returned before asking for a new combination. For ambiguous celebrations, ask for the particular event and expected dressiness only as needed. Work can expose the optional mood choices.

Cancel returns to the unchanged daily outfit. After generating, show the selected occasion and offer Back to today's look. Try another varies the current occasion until the user returns to the baseline.

When an occasion conflicts with a pinned item and required coverage, explain the conflict and allow a different occasion or unpinning. Never silently relax coverage.

## Data and capability implications

Add a default-style reference and a daily-suggestion record keyed by user and local date. Record the preference version and owned item IDs. Reevaluate validity when an item becomes unavailable or preferences change.

An occasion variant references the baseline and carries its own occasion and pinned item IDs. Generating it does not mutate the default-style record. The existing outfit use case handles both contexts; no additional model layer is needed.

A replacement request includes the selected role and fixed IDs for all other pieces. Candidate ranking considers the complete fixed outfit. Keep recommendation exposure separate from explicitly recorded wear. These are additions to the existing outfit request, ranking, and feedback contracts.

The styling request can additionally carry explicit mood, event expectations, an optional user-approved reference look, and a preference for saved or new results. Saved-look retrieval and newly assembled candidates use the same eligibility checks. Keep contextual dressiness feedback separate from global garment preferences and avoid persisting transient mood without a reason.

## Acceptance checks for later implementation

- First opening shows a default-based daily suggestion without a generation-button press.
- Reopening preserves it unless the user changed it or it became invalid.
- Occasion changes preserve coverage and the everyday default.
- Pinned pieces remain or a conflict is explained.
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

These describe future implementation. Current deliverables are static mockups.

The existing two mockups predate prominent hijab matching, rediscovery, mood, and saved-result options. The next visual study should connect the occasion/mood request to saved-look choices and then to hijab comparison and individual-piece replacement, within Direction A.
