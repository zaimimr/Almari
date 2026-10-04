---
name: Almari
description: A white dressing room where the clothes carry the colour.
colors:
  canvas: "#FFFFFF"
  surface: "#FBF9F7"
  sunken: "#F2EDE7"
  ink: "#322E28"
  inkMuted: "#706963"
  inkDisabled: "#706963"
  placeholder: "#706963"
  line: "#E6E0DC"
  lineField: "#948B85"
  plum: "#675469"
  plumPressed: "#574559"
  plumSoft: "#F3EEF4"
  plumSoftPressed: "#E6DDE7"
  plumSoftDeep: "#DDD2DF"
  onPlum: "#FFFFFF"
  blush: "#E2B1A8"
  blushStrong: "#BE8077"
  blushEdge: "#9A5A52"
  paper: "#FEF6DE"
  error: "#96354A"
  scrim: "rgba(50,46,40,0.55)"
  scrimPill: "rgba(50,46,40,0.70)"
  onMedia: "#FFFFFF"
  ivory: "#F4EDE3"
  plumGround: "#644E64"
  sheen: "#FAF8F3"
typography:
  display:
    fontFamily: "Georgia"
    fontSize: "34px"
    lineHeight: "41px"
    letterSpacing: "-0.4px"
  title:
    fontFamily: "Georgia"
    fontSize: "26px"
    lineHeight: "32px"
    letterSpacing: "-0.2px"
  headline:
    fontFamily: "system-ui"
    fontSize: "17px"
    lineHeight: "22px"
    fontWeight: 600
  body:
    fontFamily: "system-ui"
    fontSize: "17px"
    lineHeight: "24px"
  subhead:
    fontFamily: "system-ui"
    fontSize: "15px"
    lineHeight: "20px"
  footnote:
    fontFamily: "system-ui"
    fontSize: "13px"
    lineHeight: "18px"
  mark:
    fontFamily: "system-ui"
    fontSize: "12px"
    lineHeight: "16px"
    fontWeight: 600
rounded:
  sm: "8px"
  md: "12px"
  lg: "20px"
  full: "999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
  xxl: "32px"
  footerInset: "48px"
components:
  button-primary:
    backgroundColor: "{colors.plum}"
    textColor: "{colors.onPlum}"
    typography: "{typography.headline}"
    rounded: "{rounded.full}"
    padding: "12px 16px"
    height: "44px"
  button-primary-pressed:
    backgroundColor: "{colors.plumPressed}"
  button-primary-regular:
    height: "52px"
  button-secondary:
    backgroundColor: "{colors.plumSoft}"
    textColor: "{colors.plum}"
    rounded: "{rounded.full}"
  button-secondary-pressed:
    backgroundColor: "{colors.plumSoftPressed}"
  button-quiet:
    textColor: "{colors.plum}"
    rounded: "{rounded.full}"
    padding: "12px 8px"
  button-quiet-pressed:
    backgroundColor: "{colors.sunken}"
  button-destructive:
    textColor: "{colors.error}"
    rounded: "{rounded.full}"
  chip:
    backgroundColor: "{colors.sunken}"
    textColor: "{colors.ink}"
    typography: "{typography.subhead}"
    rounded: "{rounded.full}"
    padding: "6px 14px"
    height: "44px"
  chip-pressed:
    backgroundColor: "{colors.line}"
  chip-selected:
    backgroundColor: "{colors.blush}"
    textColor: "{colors.ink}"
  field:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    height: "52px"
  banner:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.md}"
    padding: "16px"
  expander:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.md}"
    padding: "0 16px"
  tile:
    backgroundColor: "{colors.sunken}"
    rounded: "{rounded.md}"
  segmented:
    backgroundColor: "{colors.sunken}"
    rounded: "{rounded.full}"
    height: "44px"
  segmented-thumb:
    backgroundColor: "{colors.canvas}"
    rounded: "{rounded.full}"
---

# Design System: Almari

## Overview

**Creative North Star: "The Dressing Room"**

A white room with good light. The canvas is pure white so hijabs and garments show their true colour, and the interface steps back to a few warm neutrals, a muted plum for actions and a soft blush for what is chosen. Clothing is the only saturated thing on screen.

Type pairs a Georgia serif for titles with the iOS system face for everything else. Navigation is plain native iPhone: three tabs, push navigation, large titles, system alerts for confirmation. Nothing slides up from below. Motion is short and silky, built only from timed curves.

**Key Characteristics:**
- White canvas, garments carry the colour.
- Plum means act, blush means chosen.
- Georgia for titles, system face for reading and controls.
- Capsule controls, softly rounded containers with continuous corners.
- Flat by default; only garment cutouts cast a shadow.
- Timed motion only, every duration and curve named.

## Colors

Warm bark neutrals around a single muted plum, with blush reserved for selection.

### Primary
- **Muted Plum** (plum): primary buttons, links, header back tint, active tab, progress fills and the tentative dot. Pressed state darkens to plumPressed.
- **Plum Mist** (plumSoft, plumSoftPressed, plumSoftDeep): secondary button fills and their pressed steps. The deeper pair is used when the button already sits on a surface.

### Secondary
- **Blush** (blush): the selected chip fill and status capsules on tiles. Edged with blushEdge when selected.
- **Clay Blush** (blushStrong): progress and emphasis marks inside banners and tiles.

### Neutral
- **Canvas** (canvas): every screen, header and tab bar background.
- **Linen** (surface): banners, expanders and fields.
- **Sunken Linen** (sunken): unselected chips, tile placeholders, segmented track, quiet pressed state, disabled fills.
- **Bark Ink** (ink): primary text; also the full-bleed background behind camera screens.
- **Bark Muted** (inkMuted, inkDisabled, placeholder): secondary text, inactive tabs, placeholders, disabled labels.
- **Hairline** (line): separators, the tab bar top edge, chip pressed fill.
- **Field Edge** (lineField): chip and field outlines, swatch rings, empty flat lay slots.
- **Paper** (paper): background behind illustrated choice cards.
- **Error Wine** (error): destructive labels and field errors.
- **Scrims** (scrim, scrimPill): legibility over camera and photos; text on them uses onMedia.
- **Brand** (ivory, plumGround, sheen): sample photo grounds and the silk sheen; never interface fills.

### Named Rules
**The Garment Owns the Colour Rule.** Garment photos sit on canvas or sunken only. Never on a tinted, coloured or graded panel.

**The Plum Acts, Blush Chooses Rule.** Plum is for things you press to do something. Blush is for state already chosen. Do not swap them.

**The Increased Contrast Rule.** When the system asks for more contrast, inkMuted becomes ink (#322E28) and line becomes lineField (#948B85). New neutrals must survive that swap.

## Typography

**Display Font:** Georgia (Georgia-Bold when Bold Text is on)
**Body Font:** iOS system face

**Character:** An editorial serif for names and titles, a quiet native sans for everything you read or press.

### Hierarchy
- **Display** (Georgia, 34/41): native large titles only, scaled up to 1.76x.
- **Title** (Georgia, 26/32): screen and look names, the rename field.
- **Headline** (600, 17/22): button labels, section and chip group labels.
- **Body** (17/24): reading text and field input.
- **Subhead** (15/20): chip labels and secondary lines.
- **Footnote** (13/18): metadata and tab labels.
- **Mark** (600, 12/16): short status capsules on tiles and over the camera. Not a heading.

### Named Rules
**The Dynamic Type Rule.** All text scales with the system. Serif roles cap at 2x, mark at 1.4x. Layouts stack instead of truncating at accessibility sizes.

**The Sentence Case Rule.** Copy is sentence case, short and plain. No all-caps labels, no exclamation marks, no em dashes. Every string lives in the English and Norwegian bokmål dictionaries.

## Layout

A single column with side gutters of 16 on phones and 20 at 428 wide and up. Spacing follows the 4, 8, 12, 16, 24, 32 scale; 48 keeps content clear of the footer. Sections gap 12 between head and body and 16 within. Footers hold one action or a pair split evenly at gap 12, stacking when labels grow.

Touch targets are at least 44. Controls are 44 (small) or 52 (regular). Thumbnails 40, swatches 14 or 44.

Navigation: three tabs (Today, Closet, Looks) on a 72 tall canvas tab bar with a hairline top edge, plum active and muted inactive. Profile is pushed from Today. Everything else is a pushed screen with a minimal back button, no header shadow, and large titles on top-level screens. Confirmations use the system alert. No modals and no sheets.

## Elevation & Depth

Flat. Depth comes from tonal steps (canvas, surface, sunken) and hairlines, not shadow.

### Shadow Vocabulary
- **Rest** (ink shadow, opacity 0.10, radius 6, offset 0/3): garment cutouts inside tiles.
- **Lift** (ink shadow, opacity 0.14, radius 12, offset 0/6): defined in the theme, not yet used on any surface.

### Named Rules
**The Only Garments Cast Shadows Rule.** Shadows belong to clothing cutouts. Cards, buttons, banners and headers stay flat.

## Shapes

Capsules (full) for buttons, chips, segmented controls and status marks. Gently rounded containers (md, 12) for tiles, fields, banners, expanders and choice cards. Small thumbnails use sm (8). All corners use the continuous iOS curve. A chip that wraps to two lines drops from a capsule to md. Garment tiles are 4:5 portrait, choice cards 3:4, the flat lay square.

## Components

### Buttons (Button)
- **Shape:** capsule, continuous corners.
- **Primary:** plum fill, white headline label. Small 44, regular 52, 16 side padding.
- **Secondary:** plumSoft fill, plum label.
- **Quiet:** no fill, plum label, sunken on press.
- **Destructive:** no fill, error label.
- **Icon:** a 32 disc inside a 44 target, muted symbol, filled symbol when selected.
- **Press:** fill eases to the pressed colour in 160 on silk. Busy waits 300 before showing a silk band.

### Chips (Chip, ChipRow)
- **Style:** sunken fill, 1 lineField inner edge, ink subhead label, optional colour swatch.
- **Selected:** blush fill with a 2 blushEdge border; the edge fades out.
- **Kinds:** choice, control, action, fact. Chevrons show whether a chip opens an expander or a screen. ChipRow wraps, or scrolls past the gutter.

### Cards / Containers (Tile, Banner, Expander, ChoiceCardGroup, Section)
- **Corner Style:** md (12).
- **Background:** Tile sunken with the garment cutout inset 3%. Banner and Expander surface. ChoiceCard on paper.
- **Shadow Strategy:** none, except the cutout rest shadow.
- **Selection:** a ringed disc at top right with blush fill.
- **Internal Padding:** 16.

### Inputs / Fields (Field, Segmented)
- **Style:** surface fill, md radius, 52 tall, body text, lineField edge.
- **Focus:** plum caret and edge.
- **Error:** error colour text and edge. The rename field is a Georgia title on a single underline.
- **Segmented:** sunken capsule track with a canvas capsule thumb.

### Navigation (Screen, HeaderItem, Footer)
- Native stack and tabs as described in Layout. HeaderItem keeps a 44 target. Camera screens switch to an ink ground with onMedia text and scrim pills.

### Flat Lay (FlatLay, OutfitCollage)
The signature. An outfit is one overlapping arrangement on canvas, garments at true proportion, trousers behind tops and tunics, outer layers, hijab, shoes and bag around them. Empty slots are dashed lineField outlines. The same composition appears in Today, the builder and saved looks.

### Silk (Silk, SheenClock)
The loading language: a soft travelling sheen built from the sheen colour, used for placeholders, busy buttons and thin progress lines. Never a spinner.

### Motion
Reanimated timed transitions only. Durations: quick 160, base 240, settle 320, arrange 420, drape 640, sheen 1100. Curves: silk (default), fall (arrivals), carry (moves), release (departures). Content rises 4 and fades in on base silk; layout reflows on settle silk. With Reduce Motion, entries become plain fades and reflow stops.

## Do's and Don'ts

### Do:
- **Do** take every colour, size, radius and duration from `src/ui/theme.ts` and `src/ui/motionTokens.ts`.
- **Do** keep garments on canvas or sunken, at true colour and proportion.
- **Do** use SF Symbols through `Symbol` for interface icons.
- **Do** push new screens on the stack and confirm with the system alert.
- **Do** keep controls at 44 or 52 and let rows stack at large text sizes.

### Don't:
- **Don't** add sheets, modals or bottom drawers.
- **Don't** use springs or decay; use `timing` with a named duration and curve.
- **Don't** put shadows on cards, buttons or headers.
- **Don't** add a second accent colour or tint a garment background.
- **Don't** use all caps, small labels above headings, or em dashes in copy.
