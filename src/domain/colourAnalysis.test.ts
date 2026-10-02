import { test } from "node:test";
import assert from "node:assert/strict";
import { seasons, type ColourProfile } from "./closet";
import { toLab, toLch, toRgb } from "./color";
import {
  adjustColours,
  analyseColours,
  bestColours,
  contrastOf,
  depthOf,
  fromSelfie,
  labHex,
  seasonFor,
  seasonFromSwatch,
  skinSwatches,
  undertoneOf,
} from "./colourAnalysis";

test("Lab converts back to the same sRGB colour", () => {
  for (const rgb of [
    [200, 120, 90],
    [30, 30, 30],
    [250, 250, 250],
    [0, 155, 119],
  ] as [number, number, number][])
    assert.deepEqual(toRgb(toLab(rgb)), rgb);
  assert.equal(labHex(toLab([200, 120, 90])), "#c8785a");
});

test("undertone follows the skin hue angle with a yellowness floor", () => {
  assert.equal(undertoneOf([60, 10, 16.1]), "warm");
  assert.equal(undertoneOf([60, 10, 16]), "neutral");
  assert.equal(undertoneOf([60, 12, 13.4]), "neutral");
  assert.equal(undertoneOf([60, 12, 13.3]), "cool");
  assert.equal(undertoneOf([55, 6, 8]), "cool");
  assert.equal(toLch([55, 6, 8])[2] > 48, true);
});

test("depth follows skin lightness", () => {
  assert.equal(depthOf([65, 10, 18]), "light");
  assert.equal(depthOf([64.9, 10, 18]), "medium");
  assert.equal(depthOf([48, 10, 18]), "medium");
  assert.equal(depthOf([47.9, 10, 18]), "deep");
});

test("contrast uses the outfit contrast levels on the known colours", () => {
  const skin: [number, number, number] = [60, 10, 20];
  assert.equal(contrastOf([skin, null, [35, 5, 5]]), "medium");
  assert.equal(contrastOf([skin, null, [35.1, 5, 5]]), "low");
  assert.equal(contrastOf([skin, [10, 2, 2], null]), "medium");
  assert.equal(contrastOf([skin, [9.9, 2, 2], null]), "high");
  assert.equal(contrastOf([skin, null, null]), "medium");
});

test("every season is reachable from the decision table", () => {
  const cases: [Parameters<typeof seasonFor>[0], number | null, string][] = [
    [
      { undertone: "warm", depth: "light", contrast: "high" },
      70,
      "light-spring",
    ],
    [
      { undertone: "cool", depth: "light", contrast: "low" },
      70,
      "light-summer",
    ],
    [
      { undertone: "neutral", depth: "light", contrast: "medium" },
      70,
      "light-summer",
    ],
    [{ undertone: "warm", depth: "deep", contrast: "high" }, 40, "deep-autumn"],
    [{ undertone: "cool", depth: "deep", contrast: "low" }, 40, "deep-winter"],
    [
      { undertone: "neutral", depth: "deep", contrast: "high" },
      40,
      "deep-winter",
    ],
    [
      { undertone: "neutral", depth: "deep", contrast: "medium" },
      40,
      "deep-autumn",
    ],
    [
      { undertone: "warm", depth: "medium", contrast: "high" },
      60,
      "clear-spring",
    ],
    [
      { undertone: "cool", depth: "medium", contrast: "high" },
      60,
      "clear-winter",
    ],
    [
      { undertone: "neutral", depth: "medium", contrast: "high" },
      60,
      "clear-winter",
    ],
    [
      { undertone: "warm", depth: "medium", contrast: "low" },
      60,
      "soft-autumn",
    ],
    [
      { undertone: "cool", depth: "medium", contrast: "low" },
      60,
      "soft-summer",
    ],
    [
      { undertone: "neutral", depth: "medium", contrast: "low" },
      60,
      "soft-summer",
    ],
    [
      { undertone: "warm", depth: "medium", contrast: "medium" },
      57,
      "warm-spring",
    ],
    [
      { undertone: "warm", depth: "medium", contrast: "medium" },
      56.9,
      "warm-autumn",
    ],
    [
      { undertone: "warm", depth: "medium", contrast: "medium" },
      null,
      "warm-spring",
    ],
    [
      { undertone: "cool", depth: "medium", contrast: "medium" },
      60,
      "cool-summer",
    ],
    [
      { undertone: "cool", depth: "medium", contrast: "medium" },
      52,
      "cool-winter",
    ],
    [
      { undertone: "neutral", depth: "medium", contrast: "medium" },
      60,
      "soft-summer",
    ],
    [
      { undertone: "neutral", depth: "medium", contrast: "medium" },
      52,
      "soft-autumn",
    ],
  ];
  for (const [traits, lightness, season] of cases)
    assert.equal(seasonFor(traits, lightness), season, JSON.stringify(traits));
  assert.deepEqual(
    new Set(cases.map(([traits, lightness]) => seasonFor(traits, lightness))),
    new Set(seasons),
  );
});

test("measured colours become a full profile", () => {
  assert.deepEqual(analyseColours([62, 12, 22], [20, 3, 5], [30, 5, 10]), {
    skin: [62, 12, 22],
    hair: [20, 3, 5],
    eyes: [30, 5, 10],
    undertone: "warm",
    depth: "medium",
    contrast: "medium",
    season: "warm-spring",
    source: "measured",
  });
  assert.equal(
    analyseColours([60, 14, 11], [8, 1, 1], [25, 2, 3]).season,
    "clear-winter",
  );
  assert.equal(
    analyseColours([52, 11, 20], [20, 3, 5], null).season,
    "warm-autumn",
  );
});

test("hair covered by a hijab gives contrast from skin and eyes only", () => {
  const skin: [number, number, number] = [70, 10, 20];
  const eyes: [number, number, number] = [40, 3, 8];
  assert.equal(analyseColours(skin, [15, 2, 2], eyes).contrast, "high");
  const covered = analyseColours(skin, null, eyes);
  assert.equal(covered.hair, null);
  assert.equal(covered.contrast, "medium");
});

test("dark, mixed or faceless selfies ask for a retake", () => {
  const values = {
    skin: [60, 12, 20] as [number, number, number],
    hair: null,
    eyes: [30, 4, 9] as [number, number, number],
  };
  assert.deepEqual(fromSelfie({ ...values, light: "dark" }), {
    retake: "dark",
  });
  assert.deepEqual(fromSelfie({ ...values, light: "mixed" }), {
    retake: "mixed",
  });
  assert.deepEqual(
    fromSelfie({ skin: null, hair: null, eyes: null, light: "ok" }),
    { retake: "no-face" },
  );
  const outcome = fromSelfie({ ...values, light: "ok" });
  assert.ok("profile" in outcome);
  assert.equal(outcome.profile.source, "measured");
});

test("adjusting a trait recomputes the season and marks it confirmed", () => {
  const measured = analyseColours([62, 12, 22], [20, 3, 5], [30, 5, 10]);
  const cooler = adjustColours(measured, { undertone: "cool" });
  assert.equal(cooler.season, "cool-summer");
  assert.equal(cooler.source, "confirmed");
  assert.deepEqual(cooler.skin, measured.skin);
  assert.equal(adjustColours(measured, {}).season, "warm-spring");
  assert.equal(adjustColours(measured, {}).source, "confirmed");
});

test("each skin swatch reads as its own label", () => {
  assert.equal(skinSwatches.length, 9);
  for (const swatch of skinSwatches) {
    const profile = seasonFromSwatch(swatch);
    assert.equal(profile.depth, swatch.depth, swatch.id);
    assert.equal(profile.undertone, swatch.undertone, swatch.id);
    assert.equal(profile.contrast, "medium");
    assert.equal(profile.source, "swatch");
    assert.deepEqual([profile.hair, profile.eyes], [null, null]);
  }
  assert.equal(
    seasonFromSwatch(
      skinSwatches.find((swatch) => swatch.id === "medium-warm")!,
    ).season,
    "warm-autumn",
  );
});

test("best colours give six Lab colours per season with the expected character", () => {
  const profile = (season: ColourProfile["season"]) => ({ season });
  const mean = (season: ColourProfile["season"], index: 0 | 1) =>
    bestColours(profile(season))
      .map((lab) => toLch(lab)[index])
      .reduce((sum, value) => sum + value, 0) / 6;
  for (const season of seasons)
    assert.equal(bestColours(profile(season)).length, 6, season);
  for (const season of ["light-spring", "light-summer"] as const)
    assert.ok(mean(season, 0) > 75, season);
  for (const season of ["deep-autumn", "deep-winter"] as const)
    assert.ok(mean(season, 0) < 35, season);
  for (const season of ["soft-summer", "soft-autumn"] as const)
    assert.ok(mean(season, 1) < 25, season);
  for (const season of ["clear-spring", "clear-winter"] as const)
    assert.ok(mean(season, 1) > 45, season);
});
