# Design system and interaction specification

Authority: [DESIGN.md](../../DESIGN.md), the approved [Direction A reference](../concepts/a-dressing-room.png), and the working [iPhone builder](../build/flatlay-builder-iphone.png). Extend this identity. The user has already chosen the white background and overall look and feel.

## 1. Visual intent

The clothes are the main visual content. A quiet interface frames an expressive wardrobe. Use white behind garments, editorial serif headings sparingly, system typography for practical controls, and muted plum for primary actions and selection.

Earthy and floral colors belong mostly to the clothes. Pink and purple details can support the interface, but should not compete with scarf colors or create a color cast behind a cutout. Avoid decorative flower illustrations, fashion-magazine clutter, shopping banners, ornamental cards, or a dashboard of metrics.

The first viewport should make the main task obvious: see today's outfit, understand its context, and change it. Keep developer language, provider names, schema versions, confidence decimals, and model controls out of daily dressing screens.

## 2. Current tokens to preserve

These are the values currently implemented in `src/ui/theme.ts`, not new palette proposals.

| Token | Value | Use |
| --- | --- | --- |
| background | `#FFFFFF` | Garment canvas and primary page |
| surface | `#FBF9F7` | Quiet controls and secondary surfaces |
| ink | `#322E28` | Primary text |
| muted | `#706963` | Secondary text |
| accent | `#675469` | Primary action and selected controls |
| accentText | `#FFFFFF` | Text on plum |
| accentSoft | `#F3EEF4` | Secondary action surface |
| line | `#E6E0DC` | Subtle separators and boundaries |
| error | `#96354A` | Actionable error text |

Spacing tokens: 4, 8, 12, 16, 24, 32, and 48 points. Current standard radius: 14 points. Use continuous native corners where supported. Avoid a different radius on every component.

| Type role | Current baseline | Use |
| --- | --- | --- |
| Title | Georgia, 38/44, tracking -0.8 | One main heading |
| Heading | Georgia, 27/34 | Outfit names and sections |
| Body | System, 17/25 | Controls and readable content |
| Caption | System, 13/19 | Supporting metadata |

These are scalable native text styles. Preserve Dynamic Type. Do not shrink text to force a layout to fit. The existing compact clothing picker uses 13/18 labels; reserve that size for supporting item labels with full accessible names.

The source concept's warm white is reference imagery. The implemented pure white garment canvas is the concrete application baseline. Keep originals and cutouts free of decorative color grading. A white UI improves comparison but cannot guarantee accurate physical color across cameras, lighting, and displays.

## 3. Today composition

### iPhone, ordinary text size

1. Native navigation with Today and access to settings.
2. One concise editorial heading, such as A little inspiration for today.
3. A compact context summary: Work, Western, Mild, and an Edit action. Weather is labeled Entered by you when manual.
4. Large overlapping outfit collage on white.
5. Outfit name, piece count, and short supported explanation or coverage summary.
6. Primary action appropriate to the state, such as Save look.
7. Try another and Restyle for an occasion as clearly named secondary actions.
8. Optional request controls revealed through What would you like to wear? and Choose pieces.
9. Relevant saved outfits below, not a second competing hero.

If many controls compete for space, move detailed adjustments into a focused sheet. Do not make the user scroll past an entire form before seeing the outfit. At large text sizes, allow the page to scroll rather than forcing all content into one screen.

### Editing and choosing pieces

Keep the live preview fixed above the scrollable item picker during focused selection, following the current builder. On a small phone, reserve meaningful space for both. Collapse secondary explanations while choosing items; preserve the count, kept state, and Done action.

On wide browser previews, place the outfit on the left and controls/picker on the right. Constrain overall width; do not stretch clothing into a panoramic composition. Browser layouts aid review, while native iPhone behavior remains the product target.

### Suggested hierarchy sketch

```text
Today                                  Settings

A little inspiration
for today.

Work · Western · Mild                    Edit

            [ live outfit ]

Soft layers, busy days
5 pieces from your closet

                Save look
Try another             For an occasion

Want to start with something?
Blazer     Dress     Choose pieces

From your looks
[ saved outfit ]       [ saved outfit ]
```

This sketch defines hierarchy, not exact spacing or a screenshot to reproduce literally. Avoid showing more options than the active task needs.

## 4. Flat-lay rendering

Use real item photographs or their faithful cutouts. Position clothing by semantic role, with underlayers behind outer layers, trousers beneath a tunic, and hijabs, shoes, and bags arranged around the combination. Preserve the recognizable scale and proportions of each item.

- Retain transparency. No white rectangular photo card behind each selected garment.
- Store visible alpha bounds independently of the original image size.
- Use aspect-fit for each garment; do not stretch sleeves or hems to fill a slot.
- Keep the render layout separate from outfit eligibility. Visual overlap does not establish physical coverage.
- Use stable garment IDs as keys so the outfit does not jump unnecessarily during a replacement.
- Make kept pieces visibly identifiable without covering their color or details.
- Provide an item list or named actions for VoiceOver. Overlapping images alone are not a usable selection interface.
- Keep the same composition in Today, saved looks, replacement previews, and the manual builder.
- Handle one item, a partial outfit, a full dress, multiple layers, bags/shoes only, and long item names.
- Allow zoom or a full-screen view; zoom must not be necessary to identify the main garment.

Automatic arrangement ships first. User-controlled drag, rotation, resize, and saved positioning are later refinements. If introduced, include non-drag controls and persist normalized positions per look.

The current sample-specific bounds file is suitable for existing fixtures. New imports should calculate their own bounds during processing. Do not hardcode every uploaded garment into that file.

## 5. Controls and shared components

Continue the existing `src/ui` theme and components. Add only components needed by an implemented screen.

| Component | Responsibility | Important states |
| --- | --- | --- |
| OutfitCollage | Render actual selected pieces | Empty, partial, full, missing media |
| ContextSummary | Read occasion/style/weather at a glance | Default, temporary override, stale forecast |
| ChoiceGroup | A small set of mutually exclusive options | Selected, disabled, wrapped labels |
| PiecePicker | Browse and choose exact clothing | Selected, kept, unavailable, no matches |
| KeptPieces | Review starting constraints | One/many items, remove one, clear all |
| ReplacementPanel | Preview one-role alternatives | Preview, apply, cancel, no alternative |
| CoverageSummary | Explain supported conclusions | Satisfied, conflict, needs review |
| PhotoCaptureHelp | Brief practical guidance | First use, replay, dismissed |
| ImportTile | Progress and result for one photo | Queued, working, ready, review, failed |
| ImportReview | Batch acceptance and correction | Mixed success, partial save, retry |
| EmptyState / ErrorMessage | Specific recovery | Retry, change context, add pieces |

Use established native controls where they fit the task: navigation, sheets, segmented choices, menus, date pickers, and switches. Evaluate an Expo UI control in one contained screen before widening its use. The existing shared components remain the default; do not install a large UI kit and rebuild every screen without a concrete benefit.

Use SF Symbols consistently on iPhone and the existing compatible icon family on web. Icons supplement important action labels. Do not use decorative Unicode characters as replacement icons.

All controls need selected, disabled, busy, pressed, keyboard-focus where applicable, and error states. A control must not look actionable if its feature is unavailable.

## 6. Copy and tone

Write to a person choosing clothes. Prefer short descriptions with a clear action.

| Situation | Example |
| --- | --- |
| Starting piece | Build around these pieces |
| No alternative | This is the only combination I can make with these pieces. |
| Missing weather item | Your closet does not have footwear marked suitable for snow. |
| Unknown opacity | Does this tunic need an underlayer? |
| Hijab option | The mauve scarf adds a softer contrast to these neutral pieces. |
| Partial import | 7 pieces are ready. 2 photos need a quick check. |
| Photo edge clipped | The hem is outside the photo. Step back to include it. |
| Sharing choice | Process this photo on device / Use the optional online service |

Examples about particular pairings must be grounded in the real attributes at runtime. Do not fill explanations with invented fabric, weather, fit, or cultural claims.

Use the user's garment terminology. Avoid modesty scores, body judgments, wardrobe guilt, exaggerated certainty, or claiming an item was worn based on a saved look. Produce original commercial copy; competitor wording in earlier research is not approved marketing text to ship unchanged.

## 7. Accessibility and comfortable use

- Aim for at least 44 by 44 point interactive targets on iPhone.
- Verify text contrast: normal text at least 4.5:1 and large text at least 3:1. Check selected, disabled, caption, and error states on their real surfaces.
- Ensure meaningful control boundaries and focus indicators where required. Never rely on pale separators alone to identify an action.
- Respect Dynamic Type through accessibility sizes. Allow wrapping, scrolling, and vertical action arrangements.
- Test VoiceOver reading order: context, outfit description, pieces with kept state, actions, alternatives.
- Label every scarf and item by its useful name, category, and state. Do not announce only an image filename.
- Announce completed generation or a changed selection once; avoid repeated announcements during every render.
- Support Reduce Motion. Never hide essential content behind entrance animations.
- Do not require drag, hover, swipe-only discovery, color-only state, or precise tapping on overlapping clothes.
- Support system keyboard navigation in browser previews and appropriate keyboard return actions on iPhone.
- Keep save/cancel actions reachable above the keyboard and safe areas.
- Respect screen orientation policy. If portrait remains the product policy, document and test it; do not imply landscape support.

The first build is intentionally light. A later dark interface should retain a neutral white clothing comparison canvas with an appropriate boundary, and be evaluated separately. Do not invert garment images.

## 8. Motion and feedback

Use short, purposeful transitions for a replaced item, opening a sheet, and completing an import. Avoid making every garment animate separately. Retain the old outfit until a new result is ready, then replace it coherently.

Use a clear busy label and cancellation for slow tasks. A thumbnail's real processing stage is preferable to an arbitrary percentage. Do not show a false countdown. Haptics, if added, should confirm meaningful selection or completion and respect platform expectations.

## 9. Design workflow and evidence

Use Impeccable for shaping, critique, and native interaction review, together with React Native guidance. The established Direction A and this specification settle the design foundation; no new identity competition is needed.

Before a screen is implemented, write its short surface brief: audience, task, data, hierarchy, main actions, empty/loading/error states, and constraints. Use existing assets and real item names in the prototype. Verify accessibility and difficult content while building the component.

For each delivered surface:

1. Capture the current implementation before changes where relevant.
2. Build the complete flow, including failure and cancellation states.
3. Inspect a batch of iPhone normal text, larger text, keyboard, and browser narrow/wide captures.
4. Fix material findings together, then run one confirmation pass.
5. Save the final screenshots and state the tested devices and remaining limitations.

The visual comparison must show the actual app with settled assets. A static image mockup is not evidence that navigation, native text scaling, keyboard handling, or saving works.

Create a small development-only component preview covering the shared controls' relevant states when enough new controls exist. Keep it out of production navigation. Avoid screenshot tests for every trivial wrapper; focus on important compositions and regressions.
