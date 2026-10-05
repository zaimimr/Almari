import { seasons, type ColourProfile, type Season } from "./closet";
import { deltaE, toLab, toLch, type Lab, type Rgb } from "./color";
import {
  analyseColours,
  seasonColours,
  type SelfieReading,
} from "./colourAnalysis";

export type Shift =
  "warmer" | "cooler" | "lighter" | "deeper" | "brighter" | "softer";

export const shifts: Shift[] = [
  "warmer",
  "cooler",
  "lighter",
  "deeper",
  "brighter",
  "softer",
];

type Axes = [temperature: number, value: number, chroma: number];

export const seasonAxes: Record<Season, Axes> = {
  "light-spring": [0.5, 1, 0.3],
  "warm-spring": [1, 0.4, 0.5],
  "clear-spring": [0.5, 0.3, 1],
  "clear-winter": [-0.5, 0.2, 1],
  "cool-winter": [-1, -0.3, 0.6],
  "deep-winter": [-0.5, -1, 0.4],
  "deep-autumn": [0.5, -1, -0.2],
  "warm-autumn": [1, -0.4, -0.4],
  "soft-autumn": [0.5, -0.1, -1],
  "soft-summer": [-0.5, -0.1, -1],
  "cool-summer": [-1, 0.3, -0.5],
  "light-summer": [-0.5, 1, -0.4],
};

const shiftAxis: Record<Shift, [axis: 0 | 1 | 2, sign: 1 | -1]> = {
  warmer: [0, 1],
  cooler: [0, -1],
  lighter: [1, 1],
  deeper: [1, -1],
  brighter: [2, 1],
  softer: [2, -1],
};

const minStep = 0.5;

export function shiftSeason(season: Season, shift: Shift): Season | null {
  const [axis, sign] = shiftAxis[shift];
  const from = seasonAxes[season];
  const score = (to: Axes) =>
    to.reduce(
      (sum, value, index) =>
        sum + (index === axis ? 0.25 : 1) * (value - from[index]!) ** 2,
      0,
    );
  const candidates = seasons.filter(
    (other) => sign * (seasonAxes[other][axis] - from[axis]) >= minStep,
  );
  return (
    candidates.sort((a, b) => score(seasonAxes[a]) - score(seasonAxes[b]))[0] ??
    null
  );
}

export function traitsOf(
  season: Season,
): Pick<ColourProfile, "undertone" | "depth" | "contrast"> {
  const [temperature, value, chroma] = seasonAxes[season];
  return {
    undertone:
      temperature > 0.25 ? "warm" : temperature < -0.25 ? "cool" : "neutral",
    depth: value >= 0.7 ? "light" : value <= -0.7 ? "deep" : "medium",
    contrast: chroma >= 0.7 ? "high" : chroma <= -0.7 ? "low" : "medium",
  };
}

export function withSeason(
  profile: ColourProfile | null,
  season: Season,
  source: ColourProfile["source"] = "confirmed",
): ColourProfile {
  return {
    skin: profile?.skin ?? null,
    hair: profile?.hair ?? null,
    eyes: profile?.eyes ?? null,
    ...traitsOf(season),
    season,
    source,
    ...(profile?.palette ? { palette: profile.palette } : null),
  };
}

const nudges: Lab[] = [
  [3, 0, 0],
  [-3, 0, 0],
  [0, 0, 3],
  [0, 0, -3],
  [0, 2, 0],
  [0, -2, 0],
];

export function closeSeason(
  profile: Pick<ColourProfile, "skin" | "hair" | "eyes" | "season">,
): Season | null {
  const { skin, hair, eyes, season } = profile;
  if (!skin) return null;
  const found = nudges
    .map(
      ([l, a, b]) =>
        analyseColours([skin[0] + l, skin[1] + a, skin[2] + b], hair, eyes)
          .season,
    )
    .filter((other) => other !== season);
  const counts = new Map<Season, number>();
  for (const other of found) counts.set(other, (counts.get(other) ?? 0) + 1);
  return [...counts].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
}

const median = (values: number[]) => {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = sorted.length >> 1;
  return sorted.length % 2
    ? sorted[middle]!
    : (sorted[middle - 1]! + sorted[middle]!) / 2;
};

const medianLab = (labs: Lab[]): Lab => [
  median(labs.map((lab) => lab[0])),
  median(labs.map((lab) => lab[1])),
  median(labs.map((lab) => lab[2])),
];

export const outlierDeltaE = 8;

export function combineReadings<T extends SelfieReading>(readings: T[]): T {
  const ok = readings.filter(
    (reading) => reading.light === "ok" && reading.skin,
  );
  if (ok.length === 0) return readings[0]!;
  const centre = medianLab(ok.map((reading) => reading.skin!));
  const kept = ok.filter(
    (reading) => deltaE(reading.skin!, centre) <= outlierDeltaE,
  );
  const part = (key: "skin" | "hair" | "eyes") => {
    const labs = kept.flatMap((reading) =>
      reading[key] ? [reading[key]] : [],
    );
    return labs.length > 0 ? medianLab(labs) : null;
  };
  return {
    ...kept[0]!,
    skin: part("skin"),
    hair: part("hair"),
    eyes: part("eyes"),
  };
}

export function nearestSeason(palette: Lab[]): Season {
  const fit = (season: Season) => {
    const colours = seasonColours(season);
    return (
      palette.reduce(
        (sum, lab) =>
          sum + Math.min(...colours.map((colour) => deltaE(colour, lab))),
        0,
      ) / palette.length
    );
  };
  return [...seasons].sort((a, b) => fit(a) - fit(b))[0]!;
}

export const paletteLimits = {
  colours: 12,
  minShare: 0.012,
  merge: 9,
  background: { lightness: 88, chroma: 8 },
  shadow: 12,
  rounds: 12,
};

const distance = (a: Lab, b: Lab) =>
  (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2;

export function extractPalette(
  pixels: Lab[],
  count = paletteLimits.colours,
): Lab[] {
  const { background, shadow, merge, minShare, rounds } = paletteLimits;
  const usable = pixels.filter((lab) => {
    const [lightness, chroma] = toLch(lab);
    if (lightness < shadow) return false;
    return !(lightness > background.lightness && chroma < background.chroma);
  });
  if (usable.length === 0) return [];
  const sorted = [...usable].sort(
    (a, b) => toLch(a)[2] - toLch(b)[2] || a[0] - b[0],
  );
  const k = Math.min(count * 2, sorted.length);
  let centres: Lab[] = Array.from(
    { length: k },
    (_, index) => sorted[Math.floor(((index + 0.5) * sorted.length) / k)]!,
  );
  let members: Lab[][] = [];
  for (let round = 0; round < rounds; round++) {
    members = centres.map(() => []);
    for (const lab of usable) {
      let best = 0;
      for (let index = 1; index < centres.length; index++)
        if (distance(lab, centres[index]!) < distance(lab, centres[best]!))
          best = index;
      members[best]!.push(lab);
    }
    centres = centres.map((centre, index) =>
      members[index]!.length > 0 ? medianLab(members[index]!) : centre,
    );
  }
  const clusters = centres
    .map((lab, index) => ({ lab, size: members[index]!.length }))
    .filter(({ size }) => size / usable.length >= minShare)
    .sort((a, b) => b.size - a.size);
  const picked: Lab[] = [];
  for (const { lab } of clusters) {
    if (picked.some((other) => deltaE(other, lab) < merge)) continue;
    picked.push(lab.map((value) => Math.round(value * 10) / 10) as Lab);
    if (picked.length === count) break;
  }
  return picked;
}

export type Metal =
  "gold" | "rose-gold" | "silver" | "copper" | "bronze" | "pewter" | "platinum";

export const metalHex: Record<Metal, string> = {
  gold: "#D4AF37",
  "rose-gold": "#B76E79",
  silver: "#C0C0C0",
  copper: "#B87333",
  bronze: "#A97142",
  pewter: "#8E9196",
  platinum: "#E5E4E2",
};

export const seasonMetals: Record<Season, Metal[]> = {
  "light-spring": ["gold", "rose-gold"],
  "warm-spring": ["gold", "copper"],
  "clear-spring": ["gold", "silver"],
  "light-summer": ["silver", "rose-gold"],
  "cool-summer": ["silver", "platinum"],
  "soft-summer": ["pewter", "rose-gold"],
  "soft-autumn": ["gold", "bronze"],
  "warm-autumn": ["gold", "copper"],
  "deep-autumn": ["bronze", "copper"],
  "deep-winter": ["silver", "platinum"],
  "cool-winter": ["silver", "platinum"],
  "clear-winter": ["silver", "platinum"],
};

const neutrals: Record<Season, Rgb[]> = {
  "light-spring": [
    [255, 245, 225],
    [217, 184, 143],
    [184, 175, 164],
    [91, 110, 145],
  ],
  "warm-spring": [
    [251, 239, 213],
    [193, 154, 107],
    [139, 90, 43],
    [59, 74, 107],
  ],
  "clear-spring": [
    [255, 248, 231],
    [163, 158, 147],
    [44, 62, 107],
    [92, 58, 33],
  ],
  "light-summer": [
    [245, 245, 240],
    [200, 200, 204],
    [168, 159, 154],
    [90, 99, 120],
  ],
  "cool-summer": [
    [242, 242, 242],
    [138, 149, 165],
    [123, 111, 111],
    [52, 64, 94],
  ],
  "soft-summer": [
    [232, 226, 218],
    [163, 150, 140],
    [110, 123, 139],
    [74, 74, 80],
  ],
  "soft-autumn": [
    [231, 220, 200],
    [168, 153, 138],
    [125, 102, 80],
    [107, 107, 85],
  ],
  "warm-autumn": [
    [243, 229, 200],
    [184, 138, 90],
    [94, 59, 34],
    [85, 107, 47],
  ],
  "deep-autumn": [
    [240, 228, 204],
    [74, 44, 29],
    [61, 68, 41],
    [62, 58, 54],
  ],
  "deep-winter": [
    [255, 255, 255],
    [17, 17, 17],
    [54, 54, 60],
    [27, 36, 66],
  ],
  "cool-winter": [
    [255, 255, 255],
    [58, 58, 64],
    [142, 142, 150],
    [31, 42, 85],
  ],
  "clear-winter": [
    [255, 255, 255],
    [13, 13, 13],
    [51, 51, 56],
    [24, 35, 74],
  ],
};

export function seasonNeutrals(season: Season): Lab[] {
  return neutrals[season].map(toLab);
}

export type HairShade =
  | "black"
  | "dark-brown"
  | "brown"
  | "light-brown"
  | "auburn"
  | "red"
  | "blonde"
  | "grey";

export const hairShades: { id: HairShade; lab: Lab }[] = [
  { id: "black", lab: [12, 1, 1] },
  { id: "dark-brown", lab: [22, 4, 7] },
  { id: "brown", lab: [32, 7, 13] },
  { id: "light-brown", lab: [45, 8, 18] },
  { id: "auburn", lab: [35, 22, 24] },
  { id: "red", lab: [45, 30, 35] },
  { id: "blonde", lab: [68, 4, 28] },
  { id: "grey", lab: [70, 0, 2] },
];

export type EyeShade =
  "dark-brown" | "brown" | "hazel" | "green" | "blue" | "grey";

export const eyeShades: { id: EyeShade; lab: Lab }[] = [
  { id: "dark-brown", lab: [22, 5, 8] },
  { id: "brown", lab: [32, 9, 16] },
  { id: "hazel", lab: [42, 6, 22] },
  { id: "green", lab: [45, -10, 15] },
  { id: "blue", lab: [50, -4, -18] },
  { id: "grey", lab: [55, -2, -4] },
];
