# Owner feedback on the approval artifact

## Round 1 (2026-10-03)

Not approved yet. Changes requested:

1. Closet could not open: the logo tile sits too low and the Try again button is cut off under the home indicator. Centre the content and keep the action visible.
2. Units and city: find the location automatically instead of typing a city. Typing stays as the fallback when location is denied.
3. Fit, coverage and everyday style: show illustrated examples to choose from, like the competitor screens (a figure per option on a card, selected card marked). Applies to Fit, Coverage ("How covered do you like your everyday outfits?": Fully covered, Modest, Relaxed, No preference) and everyday style (Western modest, Abaya or desi, A mix of both).
4. Hijab style: new multi-select question "Which styles do you wear?" with an illustration per style: Hijab, Shayla, Al-Amira, Khimar, Chador, Niqab, Burqa, None of these.
5. Your colours: run colour analysis from the selfie and auto take the photo when the face is right. Remove the manual skin tone chips.
6. Today: fold "Not for me" into the Undo line. Only "Another" stays in the action row; after Another, "Not for me" appears next to Undo.
7. Next: the owner uploads competitor screenshots. We go through them together, keep what we like and list features worth adding, before the design is approved.

Illustrations: owner chose to generate our own set. Version 1 made with Workers AI `@cf/black-forest-labs/flux-2-dev` through `scripts/illustrate.sh` (seed 7, burqa seed 11), saved to `assets/illustrations/` (600 x 800 JPEG). Contact sheet: `docs/redesign/illustrations-v1.png`. Waiting for owner review.

## Round 2: competitor review (2026-10-03)

The owner reviewed three apps (DrobeAI, Mirah, ClotheMeFor) and chose what to take. These are new features. They amend the spec: "no new features" no longer applies to the items below. Everything else in the spec still holds (no floating sheets, light only, white canvas, no login).

Taken:

1. Onboarding: "How much sparkle" (Plain, A little, Heavy, Bridal) as an embellishment preference. Used to judge if Desi pieces are dressy enough for an occasion.
2. Onboarding and Profile: morning outfit notification, one a day, at a time she picks (06:00, 07:00, 08:00, or 21:00 the night before). Off unless she turns it on.
3. Onboarding: ask her name once. Today greets her by name ("Good morning, Sara").
4. Onboarding: location with two choices, "Use my location" or "Search for your city". Replaces typing a city.
5. Selfie and colours: prep tips before the camera (daylight, wipe lens, no glasses or bold lip), live face circle with feedback ("a bit dark", "centre your face"), auto capture, then a palette: best hijab shades, "go easy on" shades, and "These don't look like me" to redo or adjust. No skin tone chips.
6. Today: one line on the outfit saying why it meets her coverage (for example "Blazer covers the arms").
7. Today: thumbs up, thumbs down and save on the outfit.
8. Today: Rediscover row of pieces she has not worn yet. Tapping one styles an outfit around it.
9. Pieces: richer facts per piece: coverage (Fully covered, Modest, Needs layering), sparkle (Plain to Bridal), season, and a "Needs details" flag when the app could not read it.
10. Closet: grouped in category sections with counts, plus filters for category, colour, coverage and season. No floating menus, filters expand inline.
11. Wear calendar: month view of what she wore, with most worn and variety. The architect decides where it lives.
12. Adding: background tagging. She can add many photos and keep using the app; a card shows progress ("6 new pieces, 4 of 6 ready") and the results grouped by category.
13. Profile: "I'll never wear" (dislikes the stylist avoids) and "Trying to wear more of" (feeds Rediscover).
14. Profile: completeness meter showing how much the stylist knows, with quick add chips.

Not taken: occasions picker in onboarding, "what we heard" summary, occasion grid, batch library scan, step progress card, closet "what happens next" steps, italic accent headlines, overline labels, wore today on piece, wear memory, lifestyle chips, share, sign-in, age, gender, ethnicity, shopping questions, social features, gamification.

Today action change from round 1 stays: only "Another" in the action row, "Not for me" next to Undo.

## Approval (2026-10-03)

Owner: "Its good i like it. Start making. It i approve"

- The approved design is the artifact version published at 19:12 on 2026-10-03 (https://claude.ai/artifact/VfoMSnYRQPBRihKGwvxaHG), plus the "A mix of both" card now using `style-mix`. `docs/redesign/mockups/index.html` holds that version.
- Illustrations are approved as they are: version 1 figures on warm ivory paper with blush and plum scarves, `assets/illustrations/*.jpg`, 16 files including `style-mix`. Do not re-render them, do not strip the blush or the paper background.
- The like, not for me and save icons, and the swap mark on the hijab, are approved.
- Some docs were edited by a review pass after 19:12 (design-system.md, motion.md, copy.md, architecture.md, use-cases.md, signoff.md and flows F01, F06). Where those edits contradict the approved mockup (for example removing `paper`, changing `blushStrong`, or re-rendering illustrations without blush), the mockup wins.
- Build starts now without further owner questions.
