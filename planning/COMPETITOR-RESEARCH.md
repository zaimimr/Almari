# Closet and styling app research

Research date: 30 September 2026.

[Open the visual reference board](research/index.html).

## Scope and evidence

Reviewed official websites, support instructions, tutorials, and App Store materials for seven products. Downloaded selected publisher product images for visual comparison. These are references from the publishers, not captures from testing their installed apps. Older tutorials can differ from current interfaces.

No accounts were created, subscriptions purchased, or personal wardrobe photos uploaded. Recommendation quality, color fidelity, privacy implementation, and actual coverage accuracy remain untested. A feature absent from these sources is unverified, not necessarily absent from the app.

## What other products do

| Product | Published behavior | Lesson for this project |
| --- | --- | --- |
| Whering | Daily suggestions, item pinning during shuffle, saved collections, and wear-based filtering. | Keep the parts she likes and expose useful ways to find alternatives. |
| Acloset | Completes selected missing clothing categories while retaining chosen pieces. | Finding a hijab can be a focused request within a complete look. |
| Indyx | Saved outfits linked to individual garments, duplication, tags, and wardrobe analysis. | A favorite piece should lead directly to the looks already built around it. |
| Stylebook | Freeform outfit collages, cloning, folders, tags, and notes. | Manual creation and retrieval deserve clear, reliable controls. |
| Alta | Daily recommendations and occasion-oriented styling. | Start with the day she is dressing for. |
| ALIFF | Modest wardrobe positioning, personal coverage preferences, and explanations. | Coverage and explanations already exist as competitor promises. |
| Mirah | Hijab coordination and named cultural occasions. | Desi occasion advice is an existing competitor claim that needs practical benchmarking. |

The sources and limitations for these summaries follow.

### Whering: controlled discovery

Dress Me lets the user pin a garment while shuffling the rest, including starting from an individual item's menu. A Lookbook can constrain the items used in a shuffle. These are documented interactions, not evidence that shuffling evaluates coverage. [Pinning instructions](https://whering.co.uk/faq/pin-dress-me-items), [Lookbook shuffle](https://whering.co.uk/faq/shuffle-lookbook-dress-me-1).

W Pick offers daily suggestions informed by style and weather. Its documented editing route requires saving the suggestion, finding it in the wardrobe, and editing there. Wardrobe filters also expose most and least worn items. [Suggestions](https://whering.co.uk/faq/outfit-suggestions-on-Whering), [Editing](https://whering.co.uk/faq/edit-w-pick-outfits), [Wear filters](https://whering.co.uk/faq/filter-by-most-worn).

**Proposal:** offer Change this piece directly on our daily outfit. Give rediscovery a visible entry point and keep genuine wear history separate from recommendation history.

### Acloset: complete a partial outfit

Its support page describes preserving selected garments and recommending only missing categories. It also documents excluding dresses when trousers are the starting item. [Official support](https://www.acloset.app/support/).

**Proposal:** use the partial-outfit interaction for hijab matching. Our compatibility rules must allow valid layered combinations, including a tunic or dress over trousers. A category-level exclusion would be too restrictive for the intended wardrobe.

### Indyx: connect pieces to saved looks

Indyx documents an Outfits tab on an item, outfit duplication, favorites, and editable tags. Its own user survey found some users asking for features that already existed. This is useful evidence about discoverability within its surveyed audience, not a market-wide result. [Founder report and interaction instructions](https://www.myindyx.com/blog/you-spoke-what-you-said).

Its workshop explains finding pieces used in few saved outfits through an Insider feature and distinguishing untried combinations with tags. [Closet workshop](https://www.myindyx.com/blog/personal-style-workshop/shop-your-closet).

**Proposal:** tapping a favorite blazer or hijab should expose Looks with this piece. The main results should distinguish saved combinations from new proposals. Saving a look must not automatically imply wearing or liking it in practice.

### Stylebook: a capable manual wardrobe

The feature list documents freely arranged garment collages, outfit cloning, customizable categories, searchable notes, and tags. Its published outfit image gives the collage most of the screen and uses a white canvas. [Official features and images](https://www.stylebookapp.com/features.html).

**Proposal:** retain our white garment background and provide Duplicate and change for saved looks. Label important actions clearly. A manual builder should remain usable independently of model availability.

### Alta: start with an occasion

Alta presents daily outfits based on wardrobe and weather, styling for contexts such as interviews and trips, and a style-goal entry point. It also includes shopping-related wishlist features. [Official website](https://www.altadaily.com/).

**Proposal:** put occasion and optional mood near the outfit. Our brief remains focused on owned clothes. A marketing description of personalization does not establish an explicit mood selector, which was not verified here.

### ALIFF: direct modest-fashion competition

ALIFF advertises coverage preferences, hijab-aware styling, and owned-clothes recommendations. Its published result image pairs a collage with an explanation and a coverage summary. The original wording supplied in this project's brief appears on its homepage. Treat that wording as competitor reference material when developing original product copy. [Official website and product images](https://aliff.app/).

**Proposal:** keep explanations concise and accessible beneath the outfit. Display only coverage conclusions supported by known garment attributes and layering. Published coverage claims do not prove reliable coverage checking.

### Mirah: direct cultural-occasion competition

Mirah's App Store listing specifically advertises hijab color, contrast, and texture coordination, plus events including mehndi, walima, Eid, and jumuah. Its published occasion screen shows a vertical garment list followed by reasoning. [Publisher's App Store listing and images](https://apps.apple.com/us/app/ai-closet-ootd-mirah/id6778236177).

**Proposal:** retain a full-outfit visual when comparing hijabs. Let the user describe event expectations; the event name alone should not become a universal dress code. Mirah's real recommendation quality remains untested.

## How this should shape the next mockups

These are recommendations for discussion. They do not replace the confirmed visual direction or approve additional features.

### 1. Today

Keep Direction A's light background, editorial heading, and restrained plum accents. Shorten the headline enough to give the outfit and context controls more space.

Show the current occasion and optional mood, for example Work and Comfortable. A daily outfit appears from her default style. Below it, offer relevant saved looks and an action to explore a new combination. She should not have to generate something new to wear a familiar look.

### 2. Match my hijab

Keep the outfit visible. Present a small set of available owned hijabs using their photographs, with short, grounded matching reasons. Preview one replacement at a time and keep all other garments fixed. Support confirm, cancel, and undo.

Do not rely on swatches alone or redraw the garment in a way that changes its color, print, opacity, or fabric appearance. White backgrounds improve comparison but cannot correct poor capture lighting.

### 3. Dress for an occasion

Capture the event and, when needed, its dress expectations. Show saved looks that fit the request before asking for another generated combination. Offer Is this dressy enough? on a selected look, with a contextual explanation and an owned-piece adjustment when appropriate.

Keep Western, Desi, Arab, and mixed combinations eligible. Work need not imply Western tailoring, and Desi does not establish one level of dressiness.

### 4. Rediscover a piece

Start with an overlooked suitable garment and pair it with familiar pieces. Let her keep the anchor, reject a pairing, or explain that an item is unavailable. Avoid turning wardrobe use into a guilt-inducing score.

Without reported wear data, describe a piece as less suggested or less represented in saved looks. Do not call it unworn.

### Shared interactions

- Tap a garment: Change this piece, Keep this piece, and Looks with this piece.
- Tap a saved look: Use this look, Change a piece, and Make another like this.
- Preserve the saved source when trying a variant.
- Recheck availability and coverage for both saved and newly assembled results.
- Use the same replacement behavior for every garment, with a prominent shortcut for hijabs.

## What we can claim, and what to test

There are already products targeting Muslim women, hijab coordination, and cultural events. Serving this audience alone is not a unique market position. A promising product hypothesis is a faster, more trustworthy daily decision flow for a mixed wardrobe. That requires evidence from use.

For a later hands-on comparison, use the same small wardrobe and tasks in each relevant app:

| Task | Observable success |
| --- | --- |
| Work, comfortable, use an existing look | Finds a suitable saved outfit without requiring a new generation. |
| Keep everything except the hijab | Changes exactly one garment and makes alternatives easy to compare. |
| A Desi outfit for a described wedding event | Accounts for stated expectations and gives an explanation she finds useful. |
| Use an overlooked piece | Produces a wearable combination while preserving coverage and comfort. |
| Correct an unsuitable recommendation | Learns the contextual correction without treating it as a blanket dislike. |

Record time to a usable choice, number of corrections, coverage failures, and her satisfaction. No benchmark results exist yet.

## Reference assets

The [visual board](research/index.html) links each publisher image to its source. [Asset metadata](research/assets.json) records the source URL and retrieval date. These images are retained for research comparison and are not product artwork or assets for a shipped app.
