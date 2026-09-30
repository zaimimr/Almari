# Implementation status

Read with [the handoff](../../BUILD-PLAN.md) and [Delivery](DELIVERY.md). This records what has actually been built and checked. It is updated after each packet.

## D0: Baseline and fixtures (done, 1 October 2026)

- Baseline before changes: all 8 existing tests, typecheck, lint, and formatting passed.
- The simulator's stored closet (`closet.v1`, 12 samples, no saved looks) was copied before migration. The old key is never overwritten; the app now writes `closet.v2` and reads `closet.v1` only when no newer snapshot exists.
- Pieces now record `source: "sample" | "owned"`. The Sample label in the closet uses this field instead of the photo path.
- The twelve samples received reviewed fixture metadata in `src/domain/samples.ts`: garment type, Desi/Western, tone, suitable occasions, and warmth where relevant. These are fixture assumptions, not facts about anyone's clothes. Metadata is only restored for a sample whose category is unchanged, and owned pieces never inherit it.
- Fixture choices worth knowing: the taupe abaya is an open outer layer that needs a complete outfit beneath it, and it sits in the Western path because there is no Arab or Either option yet. No sample shoe is marked suitable for rain or snow, and no layer is marked warm, so cold time outside and snow stay honest gaps.
- The olive maxi dress was added as catalog version 2 so "Dress for work" has a real dress. It is added once through `sampleCatalog`, and it is never re-added after being deleted. Deleted version 1 samples are not restored.

## D1: Today with the sample wardrobe (done, 1 October 2026)

What works:

- Today is the first tab and the entry route. Closet and Looks are unchanged.
- Everyday style: usual occasion, Desi or Western, and a hijab preference (always, not needed, or unset). Nothing is preselected. A clearly labeled sample style is available for the sample closet.
- A stable daily outfit per local date and time zone. It survives restarts and is recomputed on a new day when the app returns to the foreground.
- Try another walks a ranked, varied list and says when there are no further combinations.
- For an occasion opens a temporary request. The everyday style and today's look stay untouched, and Back to today's look restores them.
- Garment-type requests (Blazer, Dress, Kurta, Trousers) use the stored garment type, not item names. A kept item can satisfy the request.
- Choose pieces keeps any number of exact items. Kept items are marked in the flat lay and in the piece list, and each can be released.
- Manual weather: warm, mild, or cold; dry, rain, or snow; mostly indoors or time outside. It is labeled as entered by you, never as a forecast.
- Conflicts, missing pieces, and weather gaps are explained with specific recovery actions.
- Change a piece previews alternatives in the whole outfit, changes only that piece, and supports undo. When nothing fits, it offers a separate restyle without that piece.
- Save look opens the existing builder with the outfit preselected, so saved looks keep the same item IDs and composition.
- Owned clothes can optionally be marked with a garment type and Desi/Western in the piece editor. Owned and sample clothes are never mixed in suggestions.

Automated checks: `npm run check` (typecheck, lint, formatting, 25 domain tests), `npx expo-doctor` (21/21), and `npx expo export --platform ios --platform web`. The tests cover T01 to T09, T11, T12, migration, one-time fixture seeding, day rollover in two time zones, and stale revisions.

Screens checked on the Closet Development simulator (iPhone 18 Pro, iOS 27.0, simulator, not a physical phone) with Maestro 2.11: first run, everyday style, blazer and dress requests, keeping shoes and a bag, try another, a Desi celebration in cold snow, back to today, changing the hijab, saving and reopening the look with the keyboard open, a kept-pieces conflict and its recovery, and accessibility-large text. The browser preview was checked at 1280 and 390 pixels wide. Screenshots are in [planning/build/today](../build/today).

Known limitations:

- Only the hijab preference is a coverage rule. Sleeve, neckline, hem, and opacity are not checked, and the app says so.
- Owned clothes cannot yet be marked for warmth, rain, or snow, so those requests always show "Check before wearing".
- A Kept badge can be hidden when another garment overlaps it, for example trousers under a tunic. The piece list below the outfit always shows the kept state.
- Saved looks are not yet suggested on Today, and mood is not implemented. Both belong to D3.
- The wide browser layout is a single centered column rather than two columns.
- VoiceOver reading order and Reduce Motion have not been audited.
- The wife-led usability check in the D1 stop gate has not happened yet.

Next: D2, easy clothing capture. It needs her phone model and a decision about local or optional cloud processing before any personal photo is processed.
