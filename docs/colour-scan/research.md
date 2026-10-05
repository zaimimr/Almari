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
- Skin: lower outer cheeks placed from Vision landmarks, clear of the nose, under eyes and lips, plus chin and forehead when they agree with the cheeks within Delta E 12. Hijab fabric drops out through a skin hue and chroma gate. Pixels between the 20th and 60th lightness percentile, averaged in Lab, to drop shine and shadow. When one cheek is in shade the lit cheek is used alone.
- Depth: individual typology angle, ITA = atan2(L - 50, b). Light above 41, deep below 12. Lightness alone failed because phone exposure brightens deep skin.
- Undertone: Lab hue angle. Cool below 33, warm from 40, neutral between. Olive (hue 62 or more with a below 11) counts as neutral.
- Season: depth first. Deep is always deep autumn or deep winter. Summer needs a cool undertone, or light depth that is not warm.
- Stability: average several frames and drop outliers.
- Light: reject too dark, clipped, a colour cast over 30 percent on a channel, or cheeks more than 25 L apart.

## Accuracy

`sh scripts/colour-eval/run.sh` runs the Swift face reader on 40 openly licensed Commons portraits (Fitzpatrick I to VI, 15 in hijab) plus the app fixture and scores the labels in `scripts/colour-eval/labels.json`.

| | Before | After |
|---|---|---|
| Measured (no retake) | 22/40 | 37/40 |
| Depth | 9/22 (41%) | 22/37 (59%) |
| Deep skin read as deep | 2/12 | 12/16 |
| Undertone | 9/22 (41%) | 26/37 (70%) |
| Season in label family | 5/22 | 19/37 |
| Deep skin in a light or summer season | 4 | 0 |
| Fixture | soft summer, medium, neutral | deep autumn, deep, neutral |

Light and medium faces in warm or dim photos still read deeper than labelled. Web portraits have uncontrolled light, so the guided selfie should do better.

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
