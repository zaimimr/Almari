import type { ColourProfile, Season } from "./closet";
import {
  contrastRange,
  deltaE,
  toLab,
  toLch,
  toRgb,
  type Lab,
  type Rgb,
} from "./color";

export type Undertone = ColourProfile["undertone"];
export type Depth = ColourProfile["depth"];
export type ContrastLevel = ColourProfile["contrast"];
export type Retake = "dark" | "mixed" | "no-face";

export type SelfieReading = {
  skin: Lab | null;
  hair: Lab | null;
  eyes: Lab | null;
  light: "ok" | "dark" | "mixed";
};

export type Swatch = {
  id: string;
  depth: Depth;
  undertone: Undertone;
  lab: Lab;
};

export const undertoneHue = { cool: 33, warm: 40 };
export const olive = { hue: 62, redness: 11 };
export const depthAngle = { light: 41, deep: 12 };
export const lighterSkin = 57;

export function typologyAngle([lightness, , yellow]: Lab): number {
  return (Math.atan2(lightness - 50, yellow) * 180) / Math.PI;
}

export function undertoneOf(skin: Lab): Undertone {
  const [, , hue] = toLch(skin);
  if (hue < undertoneHue.cool) return "cool";
  if (hue >= olive.hue && skin[1] < olive.redness) return "neutral";
  return hue >= undertoneHue.warm ? "warm" : "neutral";
}

export function depthOf(skin: Lab): Depth {
  const angle = typologyAngle(skin);
  if (angle > depthAngle.light) return "light";
  return angle < depthAngle.deep ? "deep" : "medium";
}

export function contrastOf(colours: (Lab | null)[]): ContrastLevel {
  const known = colours.filter((colour): colour is Lab => colour !== null);
  return known.length < 2
    ? "medium"
    : contrastRange(known.map(([lightness]) => lightness)).level;
}

export function seasonFor(
  traits: Pick<ColourProfile, "undertone" | "depth" | "contrast">,
  skinLightness: number | null,
): Season {
  const { undertone, depth, contrast } = traits;
  const warm = undertone === "warm";
  const cool = undertone === "cool";
  if (depth === "light") return warm ? "light-spring" : "light-summer";
  if (depth === "deep")
    return cool || (!warm && contrast === "high")
      ? "deep-winter"
      : "deep-autumn";
  if (contrast === "high") return warm ? "clear-spring" : "clear-winter";
  if (contrast === "low") return cool ? "soft-summer" : "soft-autumn";
  const lighter = skinLightness === null || skinLightness >= lighterSkin;
  if (warm) return lighter ? "warm-spring" : "warm-autumn";
  if (cool) return lighter ? "cool-summer" : "cool-winter";
  return "soft-autumn";
}

export function analyseColours(
  skin: Lab,
  hair: Lab | null,
  eyes: Lab | null,
): ColourProfile {
  const traits = {
    undertone: undertoneOf(skin),
    depth: depthOf(skin),
    contrast: contrastOf([skin, hair, eyes]),
  };
  return {
    skin,
    hair,
    eyes,
    ...traits,
    season: seasonFor(traits, skin[0]),
    source: "measured",
  };
}

export function adjustColours(
  profile: ColourProfile,
  change: Partial<Pick<ColourProfile, "undertone" | "depth" | "contrast">>,
): ColourProfile {
  const next = { ...profile, ...change };
  return {
    ...next,
    season: seasonFor(next, profile.skin?.[0] ?? null),
    source: "confirmed",
  };
}

export function resampleColours(
  profile: ColourProfile,
  part: "skin" | "hair" | "eyes",
  lab: Lab,
): ColourProfile {
  const next = { ...profile, [part]: lab };
  return analyseColours(next.skin ?? lab, next.hair, next.eyes);
}

export function fromSelfie(
  reading: SelfieReading,
  hairCovered = false,
): { profile: ColourProfile } | { retake: Retake } {
  if (reading.light !== "ok") return { retake: reading.light };
  if (!reading.skin) return { retake: "no-face" };
  return {
    profile: analyseColours(
      reading.skin,
      hairCovered ? null : reading.hair,
      reading.eyes,
    ),
  };
}

export const skinSwatches: Swatch[] = [
  { id: "light-cool", depth: "light", undertone: "cool", lab: [72, 14, 8] },
  {
    id: "light-neutral",
    depth: "light",
    undertone: "neutral",
    lab: [70, 13, 10],
  },
  { id: "light-warm", depth: "light", undertone: "warm", lab: [70, 12, 20] },
  { id: "medium-cool", depth: "medium", undertone: "cool", lab: [56, 15, 9] },
  {
    id: "medium-neutral",
    depth: "medium",
    undertone: "neutral",
    lab: [56, 14, 11],
  },
  { id: "medium-warm", depth: "medium", undertone: "warm", lab: [56, 12, 22] },
  { id: "deep-cool", depth: "deep", undertone: "cool", lab: [40, 14, 8] },
  {
    id: "deep-neutral",
    depth: "deep",
    undertone: "neutral",
    lab: [40, 13, 10],
  },
  { id: "deep-warm", depth: "deep", undertone: "warm", lab: [40, 12, 19] },
];

export function seasonFromSwatch(swatch: Swatch): ColourProfile {
  return { ...analyseColours(swatch.lab, null, null), source: "swatch" };
}

const palettes: Record<Season, Rgb[]> = {
  "light-spring": [
    [255, 203, 164],
    [240, 128, 128],
    [127, 205, 187],
    [250, 218, 94],
    [213, 176, 124],
    [204, 204, 255],
  ],
  "warm-spring": [
    [255, 127, 80],
    [255, 200, 40],
    [64, 200, 180],
    [193, 154, 107],
    [230, 80, 50],
    [110, 170, 60],
  ],
  "clear-spring": [
    [255, 95, 80],
    [0, 200, 200],
    [255, 230, 0],
    [76, 187, 23],
    [230, 40, 40],
    [65, 105, 225],
  ],
  "light-summer": [
    [176, 224, 230],
    [200, 180, 230],
    [240, 170, 190],
    [150, 210, 210],
    [200, 200, 205],
    [180, 225, 200],
  ],
  "cool-summer": [
    [60, 75, 120],
    [200, 60, 110],
    [100, 120, 170],
    [140, 145, 155],
    [210, 120, 150],
    [70, 140, 140],
  ],
  "soft-summer": [
    [200, 150, 155],
    [110, 125, 140],
    [150, 160, 145],
    [140, 100, 125],
    [130, 150, 170],
    [153, 108, 115],
  ],
  "soft-autumn": [
    [160, 170, 145],
    [193, 154, 107],
    [90, 140, 135],
    [220, 150, 120],
    [128, 128, 90],
    [225, 180, 150],
  ],
  "warm-autumn": [
    [183, 65, 14],
    [210, 160, 40],
    [110, 110, 50],
    [230, 120, 30],
    [130, 80, 40],
    [0, 128, 128],
  ],
  "deep-autumn": [
    [90, 55, 40],
    [110, 30, 30],
    [34, 85, 50],
    [0, 90, 90],
    [80, 40, 60],
    [190, 85, 25],
  ],
  "deep-winter": [
    [25, 25, 30],
    [0, 100, 70],
    [110, 20, 50],
    [20, 30, 80],
    [90, 30, 120],
    [190, 20, 40],
  ],
  "cool-winter": [
    [200, 16, 46],
    [245, 200, 220],
    [40, 60, 170],
    [0, 140, 90],
    [60, 60, 65],
    [200, 30, 130],
  ],
  "clear-winter": [
    [250, 250, 250],
    [20, 20, 20],
    [255, 20, 147],
    [0, 100, 255],
    [0, 155, 119],
    [255, 250, 100],
  ],
};

const more: Record<Season, Rgb[]> = {
  "light-spring": [
    [255, 160, 122],
    [144, 213, 150],
    [120, 190, 225],
    [250, 170, 180],
    [245, 200, 110],
    [170, 150, 220],
  ],
  "warm-spring": [
    [255, 165, 0],
    [240, 128, 100],
    [150, 200, 80],
    [0, 160, 150],
    [250, 200, 120],
    [200, 110, 60],
  ],
  "clear-spring": [
    [255, 105, 180],
    [0, 180, 140],
    [255, 140, 0],
    [30, 144, 255],
    [140, 80, 220],
    [255, 215, 80],
  ],
  "light-summer": [
    [150, 180, 220],
    [220, 160, 200],
    [170, 200, 180],
    [190, 170, 210],
    [250, 190, 200],
    [140, 170, 190],
  ],
  "cool-summer": [
    [100, 149, 237],
    [180, 80, 130],
    [120, 100, 160],
    [90, 110, 140],
    [220, 150, 180],
    [40, 90, 110],
  ],
  "soft-summer": [
    [170, 150, 170],
    [120, 140, 130],
    [100, 120, 150],
    [190, 130, 140],
    [90, 110, 110],
    [160, 120, 150],
  ],
  "soft-autumn": [
    [180, 120, 100],
    [195, 175, 140],
    [130, 140, 100],
    [110, 130, 140],
    [170, 110, 110],
    [185, 150, 120],
  ],
  "warm-autumn": [
    [160, 82, 45],
    [210, 105, 30],
    [85, 107, 47],
    [205, 133, 63],
    [180, 60, 40],
    [220, 180, 60],
  ],
  "deep-autumn": [
    [128, 0, 32],
    [60, 80, 40],
    [150, 75, 0],
    [0, 70, 80],
    [170, 60, 30],
    [100, 60, 30],
  ],
  "deep-winter": [
    [0, 60, 110],
    [120, 0, 60],
    [0, 80, 60],
    [60, 0, 90],
    [150, 0, 30],
    [40, 40, 60],
  ],
  "cool-winter": [
    [0, 0, 128],
    [150, 0, 100],
    [0, 100, 120],
    [100, 50, 160],
    [220, 0, 80],
    [180, 200, 230],
  ],
  "clear-winter": [
    [220, 20, 60],
    [0, 180, 220],
    [120, 40, 200],
    [0, 140, 70],
    [255, 105, 180],
    [20, 40, 140],
  ],
};

const paletteLab = Object.fromEntries(
  Object.entries(palettes).map(([season, colours]) => [
    season,
    [...colours, ...more[season as Season]].map(toLab),
  ]),
) as Record<Season, Lab[]>;

export function seasonColours(season: Season): Lab[] {
  return paletteLab[season];
}

export function bestColours(
  profile: Pick<ColourProfile, "season" | "palette">,
): Lab[] {
  return profile.palette ?? paletteLab[profile.season];
}

const opposites: Record<Season, Season> = {
  "light-spring": "deep-winter",
  "deep-winter": "light-spring",
  "light-summer": "deep-autumn",
  "deep-autumn": "light-summer",
  "warm-spring": "cool-summer",
  "cool-summer": "warm-spring",
  "warm-autumn": "cool-winter",
  "cool-winter": "warm-autumn",
  "clear-spring": "soft-summer",
  "soft-summer": "clear-spring",
  "clear-winter": "soft-autumn",
  "soft-autumn": "clear-winter",
};

export function oppositeSeason(season: Season): Season {
  return opposites[season];
}

export function paletteFor(
  profile: Pick<ColourProfile, "season" | "palette">,
): {
  best: Lab[];
  goEasy: Lab[];
} {
  const best = bestColours(profile);
  const nearest = (lab: Lab) =>
    Math.min(...best.map((colour) => deltaE(colour, lab)));
  const goEasy = [...paletteLab[oppositeSeason(profile.season)]]
    .sort((a, b) => nearest(b) - nearest(a))
    .slice(0, 6);
  return { best, goEasy };
}

export function labHex(lab: Lab) {
  return `#${toRgb(lab)
    .map((part) => part.toString(16).padStart(2, "0"))
    .join("")}`;
}
