# Design direction

## Approved foundation

Direction A, The dressing room, is the user's selected visual identity. Reference: [approved visual](planning/concepts/a-dressing-room.png).

User's words: "we like the white background to make the hijab and clothes really stand out and really se its color. so the back ground in A is the best. and really the look and feel of A feels the best."

Approval covers the background and overall look and feel. The original occasion selector and Style me action are being revised to support a daily outfit based on a saved default style.

## Background and imagery

Use the approved white/light neutral surface as the primary canvas. Clothing supplies most of the color. Do not place garment photos on rose, olive, or beige panels. Preserve garment hues, patterns, texture, and proportions. Use clean cutouts and subtle natural shadows so white garments remain legible.

The light canvas helps people judge color; it cannot guarantee physical color accuracy across cameras and displays. Avoid applying a decorative color grade to uploaded clothes.

Keep earthy and floral colors in small interface details and the garments themselves. The reference's approximate palette is flower white `#FAF8F3`, dark bark `#322E28`, and muted plum `#675469`. These become semantic theme tokens during implementation after contrast checks.

## Typography and layout

Use a restrained editorial serif for display headings and outfit names. Use native system typography for body text, controls, and metadata. Let the garment collage occupy the center of Today with generous breathing room.

A short headline, current style summary, outfit, and explicit actions form the hierarchy. Avoid decorative flowers, ornamental motifs, shopping cues, or large colored containers.

## Native interaction

Preserve familiar iPhone navigation, safe areas, sheets, and dismissal behavior. Proposed tabs: Today, Closet, Looks, Stylist. Settings are accessible through the profile. Use consistent native symbols across screens.

Raster mockups illustrate the design rather than defining exact system chrome, type metrics, or accessibility behavior. Support Dynamic Type, VoiceOver, Reduce Motion, and adequate contrast in implementation.

## Today refinement

The user requested a default style that is styled every day and an option to redesign for an occasion. Proposed behavior and revised mockups live in [the Today brief](planning/TODAY.md).

The original A identity is approved. Revised styling flows remain proposals. The user has requested a simple working foundation, with the richer features kept in the plans. The first implementation exposes Closet and Looks; Today and Stylist can follow as their functionality is built.

## First implementation

Shared tokens and components live in `src/ui`. The app uses a white clothing canvas, restrained plum actions, Georgia display headings, system body typography, and native iPhone navigation. The first version follows the selected light appearance. Adaptive dark appearance remains a later refinement.
