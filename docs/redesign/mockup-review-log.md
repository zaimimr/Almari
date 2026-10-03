# Mockup review log

The reasoning behind `mockups/index.html`. The page itself keeps only the lines the owner has to confirm.

## Review log

### Round 3, 3 Oct

Fixed in the mockup:

- Hijab styles at AX5 keep the head-and-shoulders framing (`bust`), so the largest text does not get the smallest heads.
- Chips follow Chip > Anatomy everywhere: a 1 pt `lineField` edge inside the transparent 2 pt border on every unselected chip, `#9A5A52` as the selected edge on canvas and in containers, a 2 pt `blushStrong` edge on the Tile disc (the ChoiceCard disc keeps `#9A5A52`). A chip is at least 44 x 44 with its content centred, so the swatch-only colour chip is a full target.
- One progress card for the whole batch: "6 new pieces, 4 of 6 ready", then "6 new pieces ready", same title line, progress line, category line and chevron, so nothing jumps when the work ends. The "6 added" Banner frame is gone; Link as a set and Start with these sit in the Footer of the screen the card opens ("6 new pieces", grouped by category).
- AX5 proof frames added: Everyday style and Fit one column, Location with the wrapping "Finn posisjonen min", Morning outfit with "21:00 kvelden før", Face circle with the guide pushing "Velg en nylig selfie" down, Rediscover as Rows, the Closet progress card with one group per line.
- Calendar at AX5: the chevrons take their own line under a wrapped month title.
- Bokmål names: "Gammelrosa chiffonhijab" everywhere, "Salviekurta" as one word.
- "Passer ikke" in the AX5 Undo slot reads "Passer ikke, forrige antrekk", as in English.
- Collapsed Today title at AX5 is "Hei, Sara" in every frame. First run Today greets "Good morning, Sara".
- Not for me reasons open under Another, so Another stays put.
- Your style: every answer is the same closed Expander row with its value trailing. The hijab answer uses the step's question and "No".
- Profile "I'll never wear" reads "3 things".
- These don't look like me: the trigger carries the Expander chevron, Retake is the first control as a secondary button, the toggle reads "Wearing a hijab in the photo".
- One tip recipe (bold lines in a surface card) for selfie and capture tips, one daylight line, "Daylight, facing a window".
- Everyday style shows one figure per card; "A mix of both" is an empty placeholder until it is drawn.
- Closet More panel: Colour, Coverage, Season, then one Show line (Not worn lately, Never worn, Unavailable, Put away). Style and Occasion are out (Style is a Today choice). Needs details is its own chip after More.
- Piece facts: no "Colour" or "Garment" prefix; Season is the same edged chip with no chevron.
- Stylist groups are labelled Western and Desi.
- This log moved off the approval page.

Declined:

- Hijab swap mark kept. It is the one visible door to the hijab strip (`architecture.md` row 78, C6-01). It sits inside the hijab's own hit area, so it is not a 26 pt target of its own. The owner can veto it on the page.
- Variety stays "in 30 days". It opens Closet with Not worn lately, which is the same 30 days; a month figure would open a different set than it counts. It is shown only on the current month.
- Quick add chip "Choose pieces to wear more" kept. `copy.md` keeps "Add pieces..." for the capture flow, and every quick add chip points at a row on the same screen by design (UC-F11-08).
- Profile edit model kept as two forms. Screens with a draft that is typed or regenerates Today (Your style, Name, Location, Body) have Cancel and Save; lists that write each tap (I'll never wear, Trying to wear more of, Colours) have Back. One form would either add a Save to tap lists or drop the discard guard from typed fields.
- Illustrations not re-rendered here. The re-render runs through `scripts/illustrate.sh` with the owner's Workers AI account, outside `docs/redesign/`, and `paper` is the ground `design-system.md` 18 keeps after it.

For other owners:

- `flows/F02-add-pieces.md`, `flows/F04-closet.md` and `design-system.md` 13: the batch model above (Add joins the closet at once, the card tracks tagging, its screen holds Link as a set and Start with these, the "N added" Banner and its keys are cut). Done in `copy.md`: `progress.readyOne` / `progress.readyMany` read "1 new piece ready" / "{count} new pieces ready".
- `flows/F04-closet.md` S1 item 4 and `copy.md` line 1119: the panel groups and the Needs details chip above, a `closet.show` key ("Show" / "Vis").
- `flows/F05-piece.md` and `design-system.md` 7: fact chips drop the key for Colour and Garment; VoiceOver keeps it.
- `flows/F11-profile-and-style.md`: Your style rows, `never.title` meta "{count} things".
- Done in `copy.md`: `hijabStyle.*.hint` and `coverage.*.hint` cut for `*.description`; `editor.nameHint` "Gammelrosa chiffonhijab"; `onboarding.hijab.no` on the Your style row; `colours.hairCovered` "Wearing a hijab in the photo" / "Hijab på bildet"; `capture.tip1Title` "Daylight, facing a window", `capture.tip1Body` and `capture.tip2Body` cut. Done in `design-system.md` 7: `minWidth` 44 for a chip with no drawn label.
- Lane 1: `nameFor` in `src/domain/importing.ts` joins colour and kind with a space, which gives "Salvie kurta" in bokmål. Bokmål needs a compound ("Salviekurta").

### Earlier rounds

- Another is alone under the outfit. After Another, Not for me sits next to Undo and is about the skipped outfit. Thumbs up, thumbs down and Save sit on the outfit title line.
- The builder's Change strip has no Keep. In a new look every piece is already your own pick (F10, Swap).
- Closet could not open stays the splash state, now one centred block with Try again clear of the home indicator (F01 S2).
- Cut-out keeps Zoom in. Pinch needs two fingers; the button lets one finger and Voice Control reach any part (F05 S3).
- Piece keeps Edit in the header, like Rename on a look. Header text names the action; the screen it opens is titled Photo and name.
- First run empty states keep one quiet Try the sample closet under the action. It is the only way to try the app without photos.
- At the largest text the search placeholder is cut short with an ellipsis. It is the system search bar, which does not wrap.
- Piece facts stay chips, not Rows. F05 keeps one wrapping chip row where each fact opens its choices under its own line; nine Rows would be nine full-width lines. Superseded in round 3 for Season (now edged, no chevron).
- Available keeps no visible key. VoiceOver reads "Available, Availability" (F05); "Availability Available" on screen says one thing twice.
- Hijab styles stay two columns of 3:4 cards. Three columns or 1:1 cards make the head too small to tell Hijab, Shayla, Al-Amira and Khimar apart.
- No ring on a selected card. The art stays unframed, as on a Tile; the disc carries the same dark blush edge as a selected chip.
- More filter lines keep scrolling sideways. Each group stays one line (F04 item 4) so the open panel fits above the first Section.
- The coverage line stays the reason's second sentence at footnote size (`copy.md`). A larger reason raises the reserved two-line height under every outfit and pushes Another down.
- The Profile meter keeps the progress line the Closet card uses, at the F11 spacing, so the two read as one kind of thing.
- Add height stays the Body chip. Body holds height and shape, the chip shows only while both are empty, and "Legg til kropp" reads badly.
- Closet stats stay on Profile. Never worn is the door to the Closet filter and Most worn opens the piece; the calendar's Most worn is for the month shown.
- Location on Profile shows the saved city. The empty search state is on F01.
- The icon keeps the name Not for me; the slot button is "Not for me, previous outfit" (`copy.md`). Outfit names change with every Another, so they are not used in labels.
- Swatch names under Differentiate Without Color: added to F04 item 4, F01 S4c and design system 19.
- Rating icons are muted outlines, filled ink when on, for the owner to confirm (F06).
