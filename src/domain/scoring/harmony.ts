import type { Piece } from "../closet";
import {
  colorClass,
  deltaE,
  toLab,
  toLch,
  type ColorClass,
  type Lab,
  type Lch,
} from "../color";
import type { Role } from "../styling";
import type { ColorFamily, Shade, Thresholds } from "./rulebook";

export type Tone = {
  lab: Lab;
  lch: Lch;
  colorClass: ColorClass;
};

export type ColorFacts = {
  main: Tone | null;
  palette: Tone[];
  family: ColorFamily | null;
  shade: Shade | null;
};

export type Colored = { role: Role; print: boolean; color: ColorFacts };

const largeRoles: Role[] = ["main", "bottom", "outer"];

function toneOf(rgb: [number, number, number], piece: Piece): Tone {
  const lab = toLab(rgb);
  const lch = toLch(lab);
  return {
    lab,
    lch,
    colorClass: colorClass(lch, {
      kind: piece.kind,
      fabric: piece.attributes?.fabric,
    }),
  };
}

function familyOf(tone: Tone, t: Thresholds): ColorFamily | null {
  const [l, c, h] = tone.lch;
  if (tone.colorClass !== "accent" || c < t.vividChroma) return null;
  if (h < 25 || h >= 345) return l >= 65 ? "pink" : "red";
  if (h < 60) return "orange";
  if (h < 105) return "yellow";
  if (h < 200) return "green";
  if (h < 290) return "blue";
  if (h < 330) return "purple";
  return "pink";
}

function shadeOf(tone: Tone): Shade | null {
  const [l, c] = tone.lch;
  if (c >= 80 && l >= 55) return "neon";
  if (l >= 72 && c >= 8 && c <= 40) return "pastel";
  if (l <= 50 && c >= 30) return "jewel";
  return null;
}

export function colorFacts(piece: Piece, t: Thresholds): ColorFacts {
  const swatches = [...(piece.colors ?? [])]
    .filter((swatch) => swatch.share >= t.paletteShare)
    .sort((a, b) => b.share - a.share);
  const palette = swatches.map((swatch) => toneOf(swatch.rgb, piece));
  const main = palette[0] ?? null;
  return {
    main,
    palette,
    family: main ? familyOf(main, t) : null,
    shade: main ? shadeOf(main) : null,
  };
}

const distances = new WeakMap<Tone, WeakMap<Tone, number>>();

function distance(a: Tone, b: Tone) {
  const row = distances.get(a) ?? new WeakMap<Tone, number>();
  distances.set(a, row);
  const cached = row.get(b);
  if (cached !== undefined) return cached;
  const value = deltaE(a.lab, b.lab);
  row.set(b, value);
  return value;
}

function hueGap(a: Tone, b: Tone) {
  const gap = Math.abs(a.lch[2] - b.lch[2]) % 360;
  return gap > 180 ? 360 - gap : gap;
}

function chromatic(tone: Tone, t: Thresholds) {
  return tone.lch[1] >= t.neutralChroma;
}

function within(value: number, [low, high]: [number, number]) {
  return value >= low && value <= high;
}

export function colorRelation(
  name: string,
  a: ColorFacts,
  b: ColorFacts,
  t: Thresholds,
): boolean {
  const x = a.main;
  const y = b.main;
  if (!x || !y) return false;
  const difference = distance(x, y);
  const lightness = Math.abs(x.lch[0] - y.lch[0]);
  const hue = hueGap(x, y);
  const vivid = x.lch[1] > t.vividChroma && y.lch[1] > t.vividChroma;
  switch (name) {
    case "same":
      return difference < t.sameDE;
    case "tonal":
      return (
        chromatic(x, t) &&
        chromatic(y, t) &&
        hue < t.tonalHue &&
        lightness >= t.tonalMinDL
      );
    case "flat":
      return (
        chromatic(x, t) &&
        chromatic(y, t) &&
        hue < t.tonalHue &&
        lightness < t.tonalMinDL &&
        difference >= t.sameDE
      );
    case "near-miss":
      return (
        difference >= t.nearMissDE[0] &&
        difference < t.nearMissDE[1] &&
        (hue < t.nearMissHue || (!chromatic(x, t) && !chromatic(y, t)))
      );
    case "analogous":
      return vivid && within(hue, t.analogousHue);
    case "complementary":
      return (
        vivid &&
        within(hue, t.complementHue) &&
        (Math.min(x.lch[1], y.lch[1]) < t.mutedChroma || lightness > t.mutedDL)
      );
    case "complementary-loud":
      return (
        within(hue, t.complementHue) &&
        Math.min(x.lch[1], y.lch[1]) > t.loudChroma
      );
    case "echo":
      return b.palette.some((tone) => distance(x, tone) < t.echoDE);
    case "contrast":
      return lightness >= t.contrastDL;
    default:
      return false;
  }
}

function accentCount(outfit: Colored[], t: Thresholds) {
  const accents = outfit.flatMap(({ color, print }) =>
    color.palette
      .map((tone, index) => ({ tone, weight: index > 0 && print ? 0.5 : 1 }))
      .filter(
        ({ tone }, index) =>
          tone.colorClass === "accent" && (index === 0 || print),
      ),
  );
  const clusters: { tones: Tone[]; weight: number }[] = [];
  for (const accent of accents) {
    const joined = clusters.filter((cluster) =>
      cluster.tones.some(
        (tone) => distance(tone, accent.tone) < t.accentJoinDE,
      ),
    );
    const merged = {
      tones: [accent.tone, ...joined.flatMap((cluster) => cluster.tones)],
      weight: Math.max(
        accent.weight,
        ...joined.map((cluster) => cluster.weight),
      ),
    };
    for (const cluster of joined) clusters.splice(clusters.indexOf(cluster), 1);
    clusters.push(merged);
  }
  return clusters.reduce((total, cluster) => total + cluster.weight, 0);
}

function large(outfit: Colored[], t: Thresholds) {
  return outfit
    .filter(({ role, color }) => largeRoles.includes(role) && color.main)
    .map(({ color }) => color.main!)
    .filter((tone) => tone.colorClass === "accent" && chromatic(tone, t));
}

export function toneSide(tone: Tone): "warm" | "cool" | null {
  const hue = tone.lch[2];
  if (hue >= 20 && hue <= 100) return "warm";
  if (hue >= 180 && hue <= 300) return "cool";
  return null;
}

export function colorMetric(
  name: string,
  outfit: Colored[],
  t: Thresholds,
): number | null {
  const lightnesses = outfit
    .filter(({ role }) =>
      ["main", "bottom", "hijab", "layer", "outer"].includes(role),
    )
    .flatMap(({ color }) => (color.main ? [color.main.lch[0]] : []));
  switch (name) {
    case "accent-count":
      return accentCount(outfit, t);
    case "contrast-range":
      return lightnesses.length < 2
        ? null
        : Math.max(...lightnesses) - Math.min(...lightnesses);
    case "saturated-large": {
      const loud = large(outfit, t).filter(
        (tone) => tone.lch[1] > t.saturatedChroma,
      );
      return loud.some((a, index) =>
        loud.slice(index + 1).some((b) => hueGap(a, b) >= t.tonalHue),
      )
        ? 1
        : 0;
    }
    case "warm-cool-large": {
      const sides = new Set(large(outfit, t).map(toneSide));
      return sides.has("warm") && sides.has("cool") ? 1 : 0;
    }
    case "light-count":
      return outfit.filter(
        ({ role, color }) =>
          ["main", "bottom", "hijab"].includes(role) &&
          color.main !== null &&
          color.main.lch[0] > t.lightL,
      ).length;
    default:
      return null;
  }
}
