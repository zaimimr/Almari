import type { ColourProfile, Season } from "./closet";
import {
  contrastRange,
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

export const undertoneHue = { cool: 48, warm: 58 };
export const minWarmYellow = 10;
export const depthLightness = { light: 65, deep: 48 };
export const lighterSkin = 57;

export function undertoneOf(skin: Lab): Undertone {
  const [, , hue] = toLch(skin);
  if (skin[2] < minWarmYellow || hue < undertoneHue.cool) return "cool";
  return hue >= undertoneHue.warm ? "warm" : "neutral";
}

export function depthOf([lightness]: Lab): Depth {
  if (lightness >= depthLightness.light) return "light";
  return lightness < depthLightness.deep ? "deep" : "medium";
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
  if (contrast === "low") return warm ? "soft-autumn" : "soft-summer";
  const lighter = skinLightness === null || skinLightness >= lighterSkin;
  if (warm) return lighter ? "warm-spring" : "warm-autumn";
  if (cool) return lighter ? "cool-summer" : "cool-winter";
  return lighter ? "soft-summer" : "soft-autumn";
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
): { profile: ColourProfile } | { retake: Retake } {
  if (reading.light !== "ok") return { retake: reading.light };
  if (!reading.skin) return { retake: "no-face" };
  return {
    profile: analyseColours(reading.skin, reading.hair, reading.eyes),
  };
}

export const skinSwatches: Swatch[] = [
  { id: "light-cool", depth: "light", undertone: "cool", lab: [72, 14, 12] },
  {
    id: "light-neutral",
    depth: "light",
    undertone: "neutral",
    lab: [70, 12, 15],
  },
  { id: "light-warm", depth: "light", undertone: "warm", lab: [70, 10, 20] },
  { id: "medium-cool", depth: "medium", undertone: "cool", lab: [58, 15, 13] },
  {
    id: "medium-neutral",
    depth: "medium",
    undertone: "neutral",
    lab: [56, 13, 17],
  },
  { id: "medium-warm", depth: "medium", undertone: "warm", lab: [56, 11, 22] },
  { id: "deep-cool", depth: "deep", undertone: "cool", lab: [40, 14, 12] },
  {
    id: "deep-neutral",
    depth: "deep",
    undertone: "neutral",
    lab: [40, 12, 15],
  },
  { id: "deep-warm", depth: "deep", undertone: "warm", lab: [40, 10, 19] },
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

const paletteLab = Object.fromEntries(
  Object.entries(palettes).map(([season, colours]) => [
    season,
    colours.map(toLab),
  ]),
) as Record<Season, Lab[]>;

export function bestColours(profile: Pick<ColourProfile, "season">): Lab[] {
  return paletteLab[profile.season];
}

export function labHex(lab: Lab) {
  return `#${toRgb(lab)
    .map((part) => part.toString(16).padStart(2, "0"))
    .join("")}`;
}
