import { test } from "node:test";
import assert from "node:assert/strict";
import { decodeCloset, emptyCloset, seasons, type Season } from "./closet";
import { deltaE, toLab, type Lab } from "./color";
import {
  analyseColours,
  bestColours,
  paletteFor,
  seasonColours,
  type SelfieReading,
} from "./colourAnalysis";
import {
  closeSeason,
  combineReadings,
  drapePair,
  extractPalette,
  nearestSeason,
  seasonChoice,
  seasonAxes,
  seasonMetals,
  seasonNeutrals,
  shiftSeason,
  shifts,
  traitsOf,
  withSeason,
} from "./seasons";

test("each shift moves along its own axis on the season wheel", () => {
  const axis = {
    warmer: [0, 1],
    cooler: [0, -1],
    lighter: [1, 1],
    deeper: [1, -1],
    brighter: [2, 1],
    softer: [2, -1],
  } as const;
  for (const season of seasons)
    for (const shift of shifts) {
      const next = shiftSeason(season, shift);
      if (!next) continue;
      const [index, sign] = axis[shift];
      assert.ok(
        sign * (seasonAxes[next][index] - seasonAxes[season][index]) > 0,
        `${season} ${shift} ${next}`,
      );
    }
});

test("shifts land on the neighbour a draper would try next", () => {
  const cases: [Season, (typeof shifts)[number], Season | null][] = [
    ["cool-summer", "warmer", "soft-summer"],
    ["cool-summer", "lighter", "light-summer"],
    ["cool-summer", "deeper", "cool-winter"],
    ["cool-summer", "brighter", "cool-winter"],
    ["cool-summer", "softer", "soft-summer"],
    ["cool-summer", "cooler", null],
    ["soft-autumn", "cooler", "soft-summer"],
    ["warm-autumn", "deeper", "deep-autumn"],
    ["deep-winter", "warmer", "deep-autumn"],
    ["light-spring", "lighter", null],
    ["clear-winter", "warmer", "clear-spring"],
  ];
  for (const [season, shift, expected] of cases)
    assert.equal(shiftSeason(season, shift), expected, `${season} ${shift}`);
});

test("every season can be reached from some other season with one shift", () => {
  const reached = new Set(
    seasons.flatMap((season) =>
      shifts.map((shift) => shiftSeason(season, shift)),
    ),
  );
  for (const season of seasons) assert.ok(reached.has(season), season);
});

test("a chosen season brings matching traits and keeps measured colours", () => {
  assert.deepEqual(traitsOf("light-spring"), {
    undertone: "warm",
    depth: "light",
    contrast: "medium",
  });
  assert.deepEqual(traitsOf("soft-summer"), {
    undertone: "cool",
    depth: "medium",
    contrast: "low",
  });
  const measured = analyseColours([62, 14, 19], [22, 3, 4], [32, 6, 12]);
  const picked = withSeason(measured, "deep-winter");
  assert.equal(picked.season, "deep-winter");
  assert.equal(picked.source, "confirmed");
  assert.deepEqual(picked.skin, measured.skin);
  assert.equal(picked.depth, "deep");
  const manual = withSeason(null, "warm-autumn", "professional");
  assert.equal(manual.skin, null);
  assert.equal(manual.source, "professional");
  assert.equal(manual.palette, undefined);
});

test("a skin near a boundary names the close season, a clear one does not", () => {
  const edge = analyseColours([74, 12, 18], [20, 3, 4], [30, 5, 10]);
  const near = closeSeason(edge);
  assert.ok(near !== null && near !== edge.season);
  const clear = analyseColours([80, 8, 26], [60, 4, 24], [55, 5, 20]);
  assert.equal(closeSeason(clear), null);
  assert.equal(closeSeason({ ...clear, skin: null }), null);
});

test("an unsure reading offers the measured season and the closest other one", () => {
  const clear = analyseColours([80, 8, 26], [60, 4, 24], [55, 5, 20]);
  assert.equal(seasonChoice(clear), null);
  assert.equal(seasonChoice({ ...clear, skin: null }), null);
  const unsure = [30, 40, 50, 60, 70]
    .flatMap((l) => [6, 12, 18, 24].flatMap((b) => [[l, 14, b] as Lab]))
    .map((skin) => analyseColours(skin, [20, 3, 4], [30, 5, 10]))
    .filter((profile) => seasonChoice(profile));
  assert.ok(unsure.length > 0);
  for (const profile of unsure)
    assert.deepEqual(seasonChoice(profile), [
      profile.season,
      closeSeason(profile),
    ]);
});

test("a drape pair takes the colours that set two seasons apart", () => {
  const [warm, cool] = drapePair("warm-autumn", "cool-winter");
  assert.ok(seasonColours("warm-autumn").includes(warm));
  assert.ok(seasonColours("cool-winter").includes(cool));
  const gap = (lab: Lab, season: Season) =>
    Math.min(...seasonColours(season).map((colour) => deltaE(colour, lab)));
  for (const colour of seasonColours("warm-autumn"))
    assert.ok(gap(warm, "cool-winter") >= gap(colour, "cool-winter"));
});

const reading = (skin: Lab, light: SelfieReading["light"] = "ok") => ({
  skin,
  hair: [20, 3, 4] as Lab,
  eyes: [30, 5, 9] as Lab,
  light,
});

test("several frames combine to the median and drop an outlier", () => {
  const combined = combineReadings([
    reading([60, 12, 18]),
    reading([62, 13, 20]),
    reading([61, 11, 19]),
    reading([80, 30, 40]),
    reading([10, 0, 0], "dark"),
  ]);
  assert.deepEqual(combined.skin, [61, 12, 19]);
  assert.deepEqual(combined.hair, [20, 3, 4]);
  assert.equal(combined.light, "ok");
  const failed = combineReadings([reading([60, 12, 18], "mixed")]);
  assert.equal(failed.light, "mixed");
});

test("a palette card photo yields its swatches without card or shadow", () => {
  const swatches: Lab[] = [
    toLab([200, 30, 60]),
    toLab([30, 80, 160]),
    toLab([40, 130, 90]),
    toLab([230, 190, 60]),
  ];
  const pixels: Lab[] = [
    ...Array.from({ length: 400 }, () => toLab([250, 248, 244])),
    ...Array.from({ length: 30 }, () => [5, 0, 0] as Lab),
    ...swatches.flatMap((lab, index) =>
      Array.from(
        { length: 60 + index * 10 },
        (_, n) => [lab[0] + (n % 3) - 1, lab[1], lab[2]] as Lab,
      ),
    ),
  ];
  const found = extractPalette(pixels);
  assert.equal(found.length, swatches.length);
  for (const lab of swatches)
    assert.ok(found.some((colour) => deltaE(colour, lab) < 3));
  assert.deepEqual(extractPalette([toLab([255, 255, 255])]), []);
});

test("a card palette maps to the season it came from and drives scoring", () => {
  for (const season of seasons)
    assert.equal(nearestSeason(seasonColours(season)), season);
  const palette = seasonColours("cool-winter").slice(0, 5);
  const profile = {
    ...withSeason(null, "cool-winter", "professional"),
    palette,
  };
  assert.deepEqual(bestColours(profile), palette);
  assert.equal(paletteFor(profile).best.length, 5);
});

test("every season has neutrals and metals", () => {
  for (const season of seasons) {
    assert.equal(seasonNeutrals(season).length, 4);
    assert.ok(seasonMetals[season].length > 0);
  }
});

test("old colours load, and a professional card palette survives a reopen", () => {
  const stored = JSON.parse(JSON.stringify(emptyCloset));
  stored.styling.profile.colour = {
    skin: [60, 10, 20],
    hair: null,
    eyes: null,
    undertone: "warm",
    depth: "medium",
    contrast: "medium",
    season: "warm-autumn",
    source: "measured",
  };
  const old = decodeCloset(JSON.stringify(stored));
  assert.equal(old.styling.profile.colour?.palette, undefined);
  stored.styling.profile.colour = {
    ...withSeason(null, "soft-summer", "professional"),
    palette: [
      [50, 10, -10],
      [70, 5, 5],
    ],
  };
  const reopened = decodeCloset(JSON.stringify(stored));
  assert.equal(reopened.styling.profile.colour?.source, "professional");
  assert.deepEqual(reopened.styling.profile.colour?.palette, [
    [50, 10, -10],
    [70, 5, 5],
  ]);
  stored.styling.profile.colour.palette = [];
  assert.throws(() => decodeCloset(JSON.stringify(stored)));
});
