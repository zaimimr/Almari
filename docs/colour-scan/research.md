# Colour scan: research and design

Date: 2026-10-05. Scope: `src/features/selfie/*`, `src/domain/colourAnalysis.ts`, `src/domain/seasons.ts`, `modules/closet-vision/ios/Selfie*.swift`.

## What others do

| App | Capture | Result | Weak spots |
|---|---|---|---|
| Dressika | One selfie plus questions on hair and eyes | 12 seasons, 120 colours, makeup on the face, virtual drapes | Different season on each try, rating nags, paywall |
| Colorwise.me | Upload, then pick skin, hair and eyes by hand | Draping camera, live colour picker | Manual work, dated look |
| Style DNA | Quiz plus selfie, 35 s | Season and style type | Calls warm people "True Summer", surprise paywall |
| Acloset | Wardrobe app with a colour add-on | Season only | Thin |
| Colormaxxing | Second photo of white paper as reference | Lab sampling | Two photos, fiddly |

Reviews agree: one verdict from one photo in random light is right about half the time. The apps people trust let them compare colours against their own face.

## How the pros do it

- House of Colour: cool white against warm white first, then neighbouring seasons against each other, then the season's own drapes rated. People leave with a 36 swatch wallet.
- Sci\ART 12 seasons: each season is a main trait plus a second trait on three axes, hue (warm, cool), value (light, deep) and chroma (clear, soft). Light spring is light then warm, soft summer is soft then cool. 16 season systems add a "true" middle per family but have no shared standard, so we stay on 12.
- Physical cards: wallets of 30 to 65 strips or fabric squares on a white or cream card.

## Technical notes

- White balance: a white reference in the same light beats grey world. Eye whites work without extra props. We already balance on the sclera plus neutral background and reject mixed light.
- Skin: cheeks below the eyes, trimmed by lightness to drop shine and shadow. Avoid nose, lips, under eyes.
- Stability: average several frames and drop outliers.
- Light: reject too dark, clipped, or one side much brighter than the other.

## What we build

1. Live guide with three checks (light, framing, still) that turn on as the camera sees them, then auto capture after a short hold. Three frames are taken and combined with a per channel median, outliers dropped.
2. Reveal: the season in serif, three traits as values, her own face on a swipeable drape in best colours and colours to avoid. Palette: best, neutrals, metals, avoid.
3. Confidence: when the measured skin sits near a boundary the closest other season is shown as a side by side drape. One tap picks the one that looks better.
4. Quick fix: warmer, cooler, lighter, deeper, softer, brighter. Each moves to the nearest season in that direction on the 12 season wheel.
5. "I know my colours": pick one of 12 seasons from swatch fans, optionally add skin, hair and eyes, optionally photograph a pro card. Swatches are pulled on the phone (k-means in Lab on a downsampled image, card background and shadows dropped), each removable. A card palette replaces the season palette in outfit scoring.
6. Everything runs on the phone. No upload, no account.

## Sources

- kettlewellcolours.com/blogs/the-colour-blog/does-ai-colour-analysis-work
- imore.com/apps/im-obsessed-with-finding-my-color-season-but-can-an-iphone-app-help
- sterlingstyleacademy.com/what-is-12-seasonal-color-analysis-and-how-does-it-work
- online.sterlingstyleacademy.com/blog/12-seasonal-color-analysis-and-16-seasonal-color-analysis-whats-the-difference
- indigotones.com/products/twelve-season-color-analysis-test-drapes
- koasas.kaist.ac.kr/handle/10203/239798
