import { test } from "node:test";
import assert from "node:assert/strict";
import {
  colorClass,
  colorName,
  contrastRange,
  deltaE,
  echoes,
  isSwatches,
  pairRelation,
  relationFrom,
  toLab,
  toLch,
  type Lab,
  type Lch,
} from "./color";

const sharma: [Lab, Lab, number][] = [
  [[50, 2.6772, -79.7751], [50, 0, -82.7485], 2.0425],
  [[50, 3.1571, -77.2803], [50, 0, -82.7485], 2.8615],
  [[50, 2.8361, -74.02], [50, 0, -82.7485], 3.4412],
  [[50, -1.3802, -84.2814], [50, 0, -82.7485], 1.0],
  [[50, -1.1848, -84.8006], [50, 0, -82.7485], 1.0],
  [[50, -0.9009, -85.5211], [50, 0, -82.7485], 1.0],
  [[50, 0, 0], [50, -1, 2], 2.3669],
  [[50, -1, 2], [50, 0, 0], 2.3669],
  [[50, 2.49, -0.001], [50, -2.49, 0.0009], 7.1792],
  [[50, 2.49, -0.001], [50, -2.49, 0.001], 7.1792],
  [[50, 2.49, -0.001], [50, -2.49, 0.0011], 7.2195],
  [[50, 2.49, -0.001], [50, -2.49, 0.0012], 7.2195],
  [[50, -0.001, 2.49], [50, 0.0009, -2.49], 4.8045],
  [[50, -0.001, 2.49], [50, 0.001, -2.49], 4.8045],
  [[50, -0.001, 2.49], [50, 0.0011, -2.49], 4.7461],
  [[50, 2.5, 0], [50, 0, -2.5], 4.3065],
  [[50, 2.5, 0], [73, 25, -18], 27.1492],
  [[50, 2.5, 0], [61, -5, 29], 22.8977],
  [[50, 2.5, 0], [56, -27, -3], 31.903],
  [[50, 2.5, 0], [58, 24, 15], 19.4535],
  [[50, 2.5, 0], [50, 3.1736, 0.5854], 1.0],
  [[50, 2.5, 0], [50, 3.2972, 0], 1.0],
  [[50, 2.5, 0], [50, 1.8634, 0.5757], 1.0],
  [[50, 2.5, 0], [50, 3.2592, 0.335], 1.0],
  [[60.2574, -34.0099, 36.2677], [60.4626, -34.1751, 39.4387], 1.2644],
  [[63.0109, -31.0961, -5.8663], [62.8187, -29.7946, -4.0864], 1.263],
  [[61.2901, 3.7196, -5.3901], [61.4292, 2.248, -4.962], 1.8731],
  [[35.0831, -44.1164, 3.7933], [35.0232, -40.0716, 1.5901], 1.8645],
  [[22.7233, 20.0904, -46.694], [23.0331, 14.973, -42.5619], 2.0373],
  [[36.4612, 47.858, 18.3852], [36.2715, 50.5065, 21.2231], 1.4146],
  [[90.8027, -2.0831, 1.441], [91.1528, -1.6435, 0.0447], 1.4441],
  [[90.9257, -0.5406, -0.9208], [88.6381, -0.8985, -0.7239], 1.5381],
  [[6.7747, -0.2908, -2.4247], [5.8714, -0.0985, -2.2286], 0.6377],
  [[2.0776, 0.0795, -1.135], [0.9033, -0.0636, -0.5514], 0.9082],
];

test("CIEDE2000 matches all 34 Sharma 2005 reference pairs in both directions", () => {
  for (const [a, b, expected] of sharma) {
    assert.ok(Math.abs(deltaE(a, b) - expected) < 0.0001, `${a} to ${b}`);
    assert.ok(Math.abs(deltaE(b, a) - expected) < 0.0001, `${b} to ${a}`);
  }
});

test("sample garment colours get the names a person would use", () => {
  const cases: [[number, number, number], string][] = [
    [[70, 70, 71], "Charcoal"],
    [[75, 51, 44], "Chocolate"],
    [[238, 235, 230], "Ivory"],
    [[151, 107, 112], "Mauve"],
    [[36, 45, 71], "Navy"],
    [[106, 109, 85], "Olive"],
    [[167, 174, 152], "Sage"],
    [[141, 118, 105], "Taupe"],
  ];
  for (const [rgb, name] of cases) assert.equal(colorName(rgb), name);
});

test("LCh gives chroma and a hue angle between 0 and 360", () => {
  const [l, c, h] = toLch([50, 0, -10]);
  assert.equal(l, 50);
  assert.equal(c, 10);
  assert.equal(h, 270);
  assert.equal(toLch([50, 10, 0])[2], 0);
});

test("colour classes follow the colour report at each threshold", () => {
  const cases: [Lch, string][] = [
    [[21.9, 11.9, 0], "black"],
    [[22, 0, 0], "grey"],
    [[21.9, 12, 0], "accent"],
    [[88.1, 9.9, 80], "white"],
    [[88, 0, 0], "grey"],
    [[88.1, 10, 80], "warm-neutral"],
    [[50, 7.9, 0], "grey"],
    [[50, 8, 0], "accent"],
    [[34.9, 39.9, 240], "navy"],
    [[34.9, 39.9, 290], "navy"],
    [[34.9, 39.9, 239.9], "accent"],
    [[34.9, 40, 260], "accent"],
    [[35, 20, 260], "accent"],
    [[60, 27.9, 45], "warm-neutral"],
    [[60, 27.9, 100], "warm-neutral"],
    [[60, 27.9, 100.1], "accent"],
    [[60, 27.9, 44.9], "accent"],
    [[60, 28, 60], "accent"],
  ];
  for (const [lch, expected] of cases)
    assert.equal(colorClass(lch), expected, `${lch}`);
});

test("denim needs a denim shape or fabric and the denim hue and chroma band", () => {
  const jeans = { kind: "jeans" as const };
  assert.equal(colorClass([50, 8, 215], jeans), "denim");
  assert.equal(colorClass([50, 35, 265], jeans), "denim");
  assert.equal(colorClass([50, 7.9, 230], jeans), "grey");
  assert.equal(colorClass([50, 35.1, 230], jeans), "accent");
  assert.equal(colorClass([50, 20, 214.9], jeans), "accent");
  assert.equal(colorClass([50, 20, 265.1], jeans), "accent");
  assert.equal(colorClass([50, 20, 240]), "accent");
  assert.equal(
    colorClass([50, 20, 240], { kind: "skirt", fabric: "denim" }),
    "denim",
  );
  assert.equal(colorClass([30, 20, 250], jeans), "navy");
});

test("photographed garment colours land in the expected class", () => {
  const cases: [[number, number, number], string][] = [
    [[30, 30, 32], "black"],
    [[35, 45, 75], "navy"],
    [[236, 231, 218], "white"],
    [[128, 128, 128], "grey"],
    [[70, 70, 71], "grey"],
    [[214, 198, 176], "warm-neutral"],
    [[110, 75, 50], "warm-neutral"],
    [[190, 35, 40], "accent"],
  ];
  for (const [rgb, expected] of cases)
    assert.equal(colorClass(toLch(toLab(rgb))), expected, `${rgb}`);
  assert.equal(
    colorClass(toLch(toLab([90, 120, 150])), { kind: "jeans" }),
    "denim",
  );
});

const measure = (
  deltaE: number,
  hueGap: number,
  deltaL = 0,
  chroma: [number, number] = [30, 30],
) => relationFrom({ deltaE, hueGap, deltaL, chroma });

test("pair relations switch exactly at their thresholds", () => {
  assert.equal(measure(4.99, 0), "same");
  assert.equal(measure(5, 0), "near-miss");
  assert.equal(measure(11.99, 24.99), "near-miss");
  assert.equal(measure(12, 10), null);
  assert.equal(measure(8, 25, 0, [10, 10]), null);
  assert.equal(measure(20, 19.99, 15), "tonal");
  assert.equal(measure(20, 19.99, 14.99), null);
  assert.equal(measure(20, 20, 15), "analogous");
  assert.equal(measure(20, 60), "analogous");
  assert.equal(measure(20, 60.01), null);
  assert.equal(measure(20, 40, 0, [15, 30]), null);
  assert.equal(measure(30, 150), "complementary");
  assert.equal(measure(30, 149.99), null);
  assert.equal(measure(30, 180, 0, [15.01, 60]), "complementary");
  assert.equal(measure(30, 180, 0, [15, 60]), null);
});

test("real colour pairs get the relation a stylist would name", () => {
  const lab = (rgb: [number, number, number]) => toLab(rgb);
  assert.equal(pairRelation(lab([35, 45, 75]), lab([45, 55, 90])), "same");
  assert.equal(pairRelation(lab([25, 25, 27]), lab([45, 45, 48])), "near-miss");
  assert.equal(pairRelation(lab([60, 85, 125]), lab([140, 180, 220])), "tonal");
  assert.equal(
    pairRelation(lab([190, 35, 40]), lab([225, 120, 45])),
    "analogous",
  );
  assert.equal(
    pairRelation(lab([190, 35, 40]), lab([30, 110, 115])),
    "complementary",
  );
  assert.equal(pairRelation(lab([128, 128, 128]), lab([190, 35, 40])), null);
});

test("an accent echoes a palette colour closer than 10", () => {
  assert.equal(echoes([50, 2.49, -0.001], [[50, -2.49, 0.0009]]), true);
  assert.equal(
    echoes(
      [50, 2.5, 0],
      [
        [58, 24, 15],
        [73, 25, -18],
      ],
    ),
    false,
  );
  assert.equal(echoes([50, 2.5, 0], []), false);
});

test("contrast range sorts outfits into low, medium and high", () => {
  assert.deepEqual(contrastRange([40, 64.9]).level, "low");
  assert.deepEqual(contrastRange([40, 65]), { range: 25, level: "medium" });
  assert.deepEqual(contrastRange([20, 70, 45]), { range: 50, level: "medium" });
  assert.deepEqual(contrastRange([20, 70.1]).level, "high");
  assert.deepEqual(contrastRange([]), { range: 0, level: "low" });
});

test("stored palettes hold up to three valid swatches", () => {
  const swatch = { rgb: [167, 174, 152], share: 0.6 };
  assert.ok(isSwatches([]));
  assert.ok(isSwatches([swatch, swatch, swatch]));
  assert.equal(isSwatches([swatch, swatch, swatch, swatch]), false);
  assert.equal(isSwatches([{ rgb: [256, 0, 0], share: 0.5 }]), false);
  assert.equal(isSwatches([{ rgb: [1, 2], share: 0.5 }]), false);
  assert.equal(isSwatches([{ rgb: [1, 2, 3], share: 0 }]), false);
  assert.equal(isSwatches(null), false);
});
