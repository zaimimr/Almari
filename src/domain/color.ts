import { t } from "../i18n";
import type { Fabric } from "./attributes";
import type { GarmentKind } from "./taxonomy";

export type Rgb = [number, number, number];
export type Lab = [number, number, number];
export type Lch = [number, number, number];
export type Swatch = { rgb: Rgb; share: number };

export type ColorClass =
  "black" | "white" | "grey" | "navy" | "denim" | "warm-neutral" | "accent";

export type PairRelation =
  "same" | "tonal" | "near-miss" | "analogous" | "complementary";

export type Relation = PairRelation | "echo";

export type Contrast = { range: number; level: "low" | "medium" | "high" };

export const neutralChroma = 12;
export const echoDeltaE = 10;

const palette: [string, number, number, number][] = [
  ["Black", 25, 25, 27],
  ["Charcoal", 62, 62, 64],
  ["Grey", 128, 128, 128],
  ["Light grey", 195, 195, 195],
  ["White", 248, 248, 246],
  ["Ivory", 236, 231, 218],
  ["Beige", 214, 198, 176],
  ["Camel", 193, 154, 107],
  ["Taupe", 142, 120, 106],
  ["Brown", 110, 75, 50],
  ["Chocolate", 78, 52, 42],
  ["Navy", 35, 45, 75],
  ["Blue", 50, 90, 170],
  ["Sky blue", 140, 180, 220],
  ["Teal", 30, 110, 115],
  ["Green", 50, 120, 70],
  ["Sage", 160, 170, 145],
  ["Olive", 107, 108, 78],
  ["Mustard", 200, 160, 50],
  ["Yellow", 235, 205, 70],
  ["Orange", 225, 120, 45],
  ["Rust", 165, 75, 45],
  ["Red", 190, 35, 40],
  ["Burgundy", 110, 30, 45],
  ["Pink", 230, 140, 170],
  ["Blush", 225, 185, 180],
  ["Mauve", 153, 108, 115],
  ["Lavender", 180, 160, 210],
  ["Purple", 110, 60, 130],
  ["Plum", 95, 50, 75],
];

export const colourNames: readonly string[] = palette.map(([name]) => name);

export function namedSwatch(name: string): Swatch {
  const entry = palette.find(([item]) => item === name);
  if (!entry) throw new Error(t("error.listedOption"));
  return { rgb: [entry[1], entry[2], entry[3]], share: 1 };
}

export function toLab([r, g, b]: Rgb): Lab {
  const linear = (value: number) => {
    const c = value / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  const [lr, lg, lb] = [linear(r), linear(g), linear(b)];
  const x = (lr * 0.4124 + lg * 0.3576 + lb * 0.1805) / 0.95047;
  const y = lr * 0.2126 + lg * 0.7152 + lb * 0.0722;
  const z = (lr * 0.0193 + lg * 0.1192 + lb * 0.9505) / 1.08883;
  const f = (t: number) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  return [116 * f(y) - 16, 500 * (f(x) - f(y)), 200 * (f(y) - f(z))];
}

export function toRgb([l, a, b]: Lab): Rgb {
  const fy = (l + 16) / 116;
  const fx = fy + a / 500;
  const fz = fy - b / 200;
  const inverse = (t: number) =>
    t ** 3 > 0.008856 ? t ** 3 : (t - 16 / 116) / 7.787;
  const x = inverse(fx) * 0.95047;
  const y = inverse(fy);
  const z = inverse(fz) * 1.08883;
  const gamma = (linear: number) => {
    const value =
      linear <= 0.0031308
        ? 12.92 * linear
        : 1.055 * linear ** (1 / 2.4) - 0.055;
    return Math.round(Math.min(1, Math.max(0, value)) * 255);
  };
  return [
    gamma(3.2406 * x - 1.5372 * y - 0.4986 * z),
    gamma(-0.9689 * x + 1.8758 * y + 0.0415 * z),
    gamma(0.0557 * x - 0.204 * y + 1.057 * z),
  ];
}

const degrees = (radians: number) => {
  const value = (radians * 180) / Math.PI;
  return value < 0 ? value + 360 : value;
};

const radians = (value: number) => (value * Math.PI) / 180;

export function toLch([l, a, b]: Lab): Lch {
  return [l, Math.hypot(a, b), degrees(Math.atan2(b, a))];
}

const paletteLab = palette.map(([name, r, g, b]) => ({
  name,
  lab: toLab([r, g, b]),
}));

export function colorName(rgb: Rgb) {
  const target = toLab(rgb);
  let best = paletteLab[0]!;
  let distance = Infinity;
  for (const entry of paletteLab) {
    const d = Math.hypot(
      entry.lab[0] - target[0],
      (entry.lab[1] - target[1]) * 1.4,
      entry.lab[2] - target[2],
    );
    if (d < distance) {
      distance = d;
      best = entry;
    }
  }
  return best.name;
}

export function mainColourName(swatches: Swatch[] | undefined) {
  const main = (swatches ?? []).reduce<Swatch | null>(
    (best, swatch) => (!best || swatch.share > best.share ? swatch : best),
    null,
  );
  return main ? colorName(main.rgb).toLowerCase() : null;
}

export function deltaE([l1, a1, b1]: Lab, [l2, a2, b2]: Lab) {
  const c1 = Math.hypot(a1, b1);
  const c2 = Math.hypot(a2, b2);
  const meanC = (c1 + c2) / 2;
  const g = 0.5 * (1 - Math.sqrt(meanC ** 7 / (meanC ** 7 + 25 ** 7)));
  const p1 = (1 + g) * a1;
  const p2 = (1 + g) * a2;
  const cp1 = Math.hypot(p1, b1);
  const cp2 = Math.hypot(p2, b2);
  const hp1 = p1 === 0 && b1 === 0 ? 0 : degrees(Math.atan2(b1, p1));
  const hp2 = p2 === 0 && b2 === 0 ? 0 : degrees(Math.atan2(b2, p2));
  const dL = l2 - l1;
  const dC = cp2 - cp1;
  let dh = 0;
  if (cp1 * cp2 !== 0) {
    dh = hp2 - hp1;
    if (dh > 180) dh -= 360;
    else if (dh < -180) dh += 360;
  }
  const dH = 2 * Math.sqrt(cp1 * cp2) * Math.sin(radians(dh / 2));
  const meanL = (l1 + l2) / 2;
  const meanCp = (cp1 + cp2) / 2;
  let meanH = hp1 + hp2;
  if (cp1 * cp2 !== 0) {
    if (Math.abs(hp1 - hp2) <= 180) meanH = (hp1 + hp2) / 2;
    else if (hp1 + hp2 < 360) meanH = (hp1 + hp2 + 360) / 2;
    else meanH = (hp1 + hp2 - 360) / 2;
  }
  const t =
    1 -
    0.17 * Math.cos(radians(meanH - 30)) +
    0.24 * Math.cos(radians(2 * meanH)) +
    0.32 * Math.cos(radians(3 * meanH + 6)) -
    0.2 * Math.cos(radians(4 * meanH - 63));
  const dTheta = 30 * Math.exp(-(((meanH - 275) / 25) ** 2));
  const rc = 2 * Math.sqrt(meanCp ** 7 / (meanCp ** 7 + 25 ** 7));
  const sl =
    1 + (0.015 * (meanL - 50) ** 2) / Math.sqrt(20 + (meanL - 50) ** 2);
  const sc = 1 + 0.045 * meanCp;
  const sh = 1 + 0.015 * meanCp * t;
  const rt = -Math.sin(radians(2 * dTheta)) * rc;
  return Math.sqrt(
    (dL / sl) ** 2 +
      (dC / sc) ** 2 +
      (dH / sh) ** 2 +
      rt * (dC / sc) * (dH / sh),
  );
}

const denimKinds: GarmentKind[] = ["jeans", "trousers", "jacket"];

export function colorClass(
  [l, c, h]: Lch,
  piece: { kind?: GarmentKind; fabric?: Fabric } = {},
): ColorClass {
  const denimShape =
    piece.fabric === "denim" ||
    (piece.kind !== undefined && denimKinds.includes(piece.kind));
  if (l < 22 && c < 12) return "black";
  if (l > 88 && c < 10) return "white";
  if (l >= 22 && l <= 88 && c < 8) return "grey";
  if (l < 35 && h >= 240 && h <= 290 && c < 40) return "navy";
  if (denimShape && h >= 215 && h <= 265 && c >= 8 && c <= 35) return "denim";
  if (c < 28 && h >= 45 && h <= 100) return "warm-neutral";
  return "accent";
}

export function hueGap([, c1, h1]: Lch, [, c2, h2]: Lch) {
  const neutral1 = c1 < neutralChroma;
  const neutral2 = c2 < neutralChroma;
  if (neutral1 && neutral2) return 0;
  if (neutral1 || neutral2) return 180;
  const gap = Math.abs(h1 - h2) % 360;
  return gap > 180 ? 360 - gap : gap;
}

export function relationFrom(measure: {
  deltaE: number;
  hueGap: number;
  deltaL: number;
  chroma: [number, number];
}): PairRelation | null {
  const { deltaE: de, hueGap: gap, deltaL } = measure;
  const colourful = Math.min(...measure.chroma) > 15;
  if (de < 5) return "same";
  if (gap < 20 && deltaL >= 15) return "tonal";
  if (de < 12 && gap < 25) return "near-miss";
  if (colourful && gap >= 20 && gap <= 60) return "analogous";
  if (colourful && gap >= 150) return "complementary";
  return null;
}

export function pairRelation(a: Lab, b: Lab): PairRelation | null {
  const lchA = toLch(a);
  const lchB = toLch(b);
  return relationFrom({
    deltaE: deltaE(a, b),
    hueGap: hueGap(lchA, lchB),
    deltaL: Math.abs(a[0] - b[0]),
    chroma: [lchA[1], lchB[1]],
  });
}

export function echoes(accent: Lab, palette: Lab[]) {
  return palette.some((color) => deltaE(accent, color) < echoDeltaE);
}

export function contrastRange(lightness: number[]): Contrast {
  const range = lightness.length
    ? Math.max(...lightness) - Math.min(...lightness)
    : 0;
  return {
    range,
    level: range < 25 ? "low" : range > 50 ? "high" : "medium",
  };
}

export function isSwatches(value: unknown): value is Swatch[] {
  return (
    Array.isArray(value) &&
    value.length <= 3 &&
    value.every(
      (swatch) =>
        typeof swatch === "object" &&
        swatch !== null &&
        Array.isArray(swatch.rgb) &&
        swatch.rgb.length === 3 &&
        swatch.rgb.every(
          (part: unknown) =>
            typeof part === "number" && part >= 0 && part <= 255,
        ) &&
        typeof swatch.share === "number" &&
        swatch.share > 0 &&
        swatch.share <= 1,
    )
  );
}
