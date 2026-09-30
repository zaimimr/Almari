# Product

## Platform

ios

First release: iPhone. Android is a future expansion. Minimum supported devices and operating systems remain undecided; the user prefers modern phones and current technology.

## Stack

The user requested a simple first build, with larger ideas retained in the plans. The initial implementation uses React Native, Expo SDK 57, and TypeScript, with local storage and native iPhone navigation. This is an implementation choice based on the brief, not a separately confirmed stack preference. See [first-build scope](planning/FIRST-BUILD.md).

## Users

The first user is the founder's wife. The initial commercial audience is Muslim women who want outfits that reflect their personal coverage preferences and style. Men may be included later if demand supports it.

Her confirmed struggles are finding a hijab that matches the outfit and style, and using more of her wardrobe when she naturally returns to favorite pieces. These should drive the first useful styling experience.

She also needs help choosing outfits for occasions, judging whether Desi clothing is dressy enough for a particular event, and deciding what to wear to work based on her mood. She should be able to choose from outfits already created.

She wants to start with a garment type, such as a blazer or a dress for work, or choose any number of specific owned pieces and have the rest of the outfit built around them. Shoes and a bag, or one pair of trousers, are valid starting points. She needs an explicit Desi/Western choice and clothing appropriate for warm days, cold weather, and snow.

## Product Purpose

Build modest outfits from clothes the user already owns. Help people see new combinations, plan what to wear, and save looks for future reference.

## Positioning

User-supplied statements:

- "Modest doesn't mean invisible."
- "Four tools. One closet."
- "Your privacy is an Amanah."
- "Never sold. Never used for advertising."
- "You decide what you share."
- "Delete your account anytime, data removed within 90 days."

These statements are product commitments to implement and verify, not claims about an existing service. The product does not push shopping or trends.

## Operating Context

Start with frequently worn pieces, review the digital closet, then create outfits. Support work, casual, party, and other occasions. Styling must understand Western, Pakistani/South Asian, and Arab garments and combinations without treating these as mutually exclusive identities.

## Capabilities and Constraints

- Capture or import clothes, clean their photographs, and organize by category, color, and coverage.
- Automatically suggest each item's name and category, remove its background, and prepare a faithful closet image. Routine importing should not require typing. See [photo import task](planning/PHOTO-IMPORT.md).
- Learn coverage preferences, hijab choices, taste, and user-selected body or fit preferences. The collection method and optionality of body information need discussion.
- Build outfits with coverage preferences applied from the beginning.
- Let users save a default everyday style and receive an outfit based on it each day.
- Offer occasion-based restyling from the daily outfit. Refresh timing and temporary override behavior remain design proposals.
- Support garment-type requests such as Use a blazer today and A dress for work.
- Build around multiple exact selected pieces, preserving those pieces during generation and subsequent alternatives.
- Provide an explicit Desi/Western outfit-style selector, separate from clothing categories. Shared pieces may work in either style.
- Account for weather and personal warmth preferences, including lighter clothing, removable layers, and cold or snowy conditions. Manual weather input and optional automatic forecasts are proposed delivery stages.
- Help match owned hijabs to the complete outfit and its intended style.
- Help users rediscover clothes beyond their favorite pieces.
- Allow individual pieces in a suggested outfit to be changed.
- Help assess occasion appropriateness and dressiness, including Desi outfits, using the user's event context and preferences.
- Let an explicitly chosen mood influence work and daily outfit suggestions.
- Surface relevant previously created outfits as ready-to-use options. The current proposal starts with saved looks; automatic retention of all generated drafts is undecided.
- Let users assemble outfits manually and save them.
- Generate suggestions inspired by saved outfits.
- Use an imported screenshot or Pinterest photo as inspiration for outfits drawn from owned clothes.
- Provide a conversational stylist.
- Use replaceable capability layers for image processing, recommendations, and model providers.
- Research Jev and the user's reference to "needle3.bin" before choosing models.
- Discuss scope and design in detail before building the production app.

## Brand Commitments

Clean, minimal design. Earthy tones with hints of flower pink, flower purple, and flower white. No name is chosen. Visual concept names are direction labels, not product names.

The user selected Direction A, The dressing room, as the visual foundation. Preserve its white/light neutral background so the hijab and garments stand out and their colors remain easy to judge. Keep its overall look and feel. This supersedes the earlier suggestion to combine three visual directions.

## Evidence on Hand

No real wardrobe photos, tested recommendations, commercial pricing, or performance results have been supplied. Concept wardrobes and screenshots must be labeled illustrative. The first working increment supports a local closet and manual saved looks; styling intelligence remains planned.

The user requested sample clothes to try outfit building without entering clothing. The prototype includes a labeled starter wardrobe. These items are illustrative and do not represent the wife's real closet.

## Product Principles

- Start with the clothes already owned.
- Make personal coverage preferences foundational.
- Preserve the user's control of personal data.
- Support varied garment traditions and mixed wardrobes.
- Keep capabilities replaceable without speculative infrastructure.

## Open Decisions

Product name; final minimum iPhone and iOS versions; initial languages and markets; account requirements; cloud permissions; membership model; body information optionality; detailed launch scope; model providers; exact daily refresh and occasion-restyling behavior; the wife's initial everyday defaults; optional mixed-style behavior and automatic weather source.
