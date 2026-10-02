import { test } from "node:test";
import assert from "node:assert/strict";
import {
  decodeCloset,
  emptyCloset,
  neutralProfile,
  type Closet,
} from "./closet";
import {
  answersFrom,
  applyAnswer,
  finishOnboarding,
  onboardingSteps,
  skipStep,
  type OnboardingStep,
} from "./onboarding";
import { addSampleWardrobe } from "./samples";
import { saveEverydayStyle } from "./today";
import {
  feetAndInches,
  formatHeight,
  formatTemperature,
  parseHeight,
} from "./units";

const clock = { localDate: "2026-10-01", timeZone: "Europe/Oslo" };
const fresh = () => addSampleWardrobe(decodeCloset(null));
const withPreset = (hijab: "always" | "not-needed" | null): Closet =>
  saveEverydayStyle(
    fresh(),
    { occasion: "work", style: "western", hijab, sample: false },
    clock,
    true,
  );

const colour = {
  skin: [56, 11, 22] as [number, number, number],
  hair: null,
  eyes: null,
  undertone: "warm" as const,
  depth: "medium" as const,
  contrast: "medium" as const,
  season: "warm-autumn" as const,
  source: "swatch" as const,
};

test("onboarding has six steps in the agreed order", () => {
  assert.deepEqual(onboardingSteps, [
    "hijab",
    "place",
    "body",
    "taste",
    "colours",
    "done",
  ]);
});

test("skip moves to the next step without saving and stops at done", () => {
  const walked: OnboardingStep[] = ["hijab"];
  while (walked[walked.length - 1] !== "done")
    walked.push(skipStep(walked[walked.length - 1]!));
  assert.deepEqual(walked, onboardingSteps);
  assert.equal(skipStep("done"), "done");
});

test("the sample closet works with every answer skipped", () => {
  const closet = finishOnboarding(fresh());
  assert.equal(closet.styling.onboarded, true);
  assert.deepEqual(closet.styling.profile, neutralProfile);
  assert.equal(closet.styling.everyday, null);
  assert.ok(closet.pieces.length > 0);
});

test("hijab always creates an everyday preset and stores coverage", () => {
  const closet = applyAnswer(
    fresh(),
    "hijab",
    { hijab: "always", coverage: "full" },
    clock,
  );
  assert.deepEqual(closet.styling.everyday, {
    occasion: "everyday",
    style: "western",
    hijab: "always",
    sample: false,
    version: 1,
  });
  assert.equal(closet.styling.profile.coverageLevel, "full");
  assert.equal(closet.styling.today?.localDate, clock.localDate);
});

test("hijab no maps to not needed and keeps her occasion and style", () => {
  const closet = applyAnswer(
    withPreset("always"),
    "hijab",
    { hijab: "no", coverage: null },
    clock,
  );
  assert.equal(closet.styling.everyday?.hijab, "not-needed");
  assert.equal(closet.styling.everyday?.occasion, "work");
  assert.equal(closet.styling.everyday?.version, 2);
});

test("hijab sometimes clears the preset hijab and never creates a preset", () => {
  assert.equal(
    applyAnswer(
      withPreset("always"),
      "hijab",
      { hijab: "sometimes", coverage: null },
      clock,
    ).styling.everyday?.hijab,
    null,
  );
  const none = applyAnswer(
    fresh(),
    "hijab",
    { hijab: "sometimes", coverage: "own" },
    clock,
  );
  assert.equal(none.styling.everyday, null);
  assert.equal(none.styling.profile.coverageLevel, "own");
});

test("units and city are stored and a new city clears the old forecast", () => {
  const oslo = { name: "Oslo", latitude: 59.91, longitude: 10.75 };
  const withForecast: Closet = {
    ...fresh(),
    styling: {
      ...fresh().styling,
      place: oslo,
      forecast: {
        date: "2026-10-01",
        fetchedAt: "2026-10-01T05:00:00.000Z",
        weather: {
          source: "forecast",
          warmth: "mild",
          precipitation: "dry",
          exposure: null,
          at: "2026-10-01",
        },
        low: 9,
        high: 13,
        attribution: { logo: "l", url: "u" },
      },
    },
  };
  const same = applyAnswer(
    withForecast,
    "place",
    { units: "imperial", place: oslo },
    clock,
  );
  assert.equal(same.styling.units, "imperial");
  assert.notEqual(same.styling.forecast, null);
  const bergen = { name: "Bergen", latitude: 60.39, longitude: 5.32 };
  const moved = applyAnswer(
    withForecast,
    "place",
    { units: "metric", place: bergen },
    clock,
  );
  assert.deepEqual(moved.styling.place, bergen);
  assert.equal(moved.styling.forecast, null);
});

test("body answers fill height and shape, and prefer not to say stays null", () => {
  const closet = applyAnswer(
    fresh(),
    "body",
    { heightCm: 165, bodyShape: "pear" },
    clock,
  );
  assert.equal(closet.styling.profile.heightCm, 165);
  assert.equal(closet.styling.profile.bodyShape, "pear");
  assert.equal(
    applyAnswer(closet, "body", { heightCm: null, bodyShape: null }, clock)
      .styling.profile.bodyShape,
    null,
  );
});

test("taste Desi sets the everyday style, and Both keeps it", () => {
  const desi = applyAnswer(
    withPreset("always"),
    "taste",
    { fit: "loose", colourLean: "bold", styleLean: "desi" },
    clock,
  );
  assert.equal(desi.styling.everyday?.style, "desi");
  assert.deepEqual(
    [
      desi.styling.profile.fit,
      desi.styling.profile.colourLean,
      desi.styling.profile.styleLean,
    ],
    ["loose", "bold", "desi"],
  );
  const both = applyAnswer(
    withPreset("always"),
    "taste",
    { fit: null, colourLean: null, styleLean: "both" },
    clock,
  );
  assert.equal(both.styling.everyday?.style, "western");
  assert.equal(both.styling.profile.styleLean, "both");
});

test("the colour answer is stored on the profile", () => {
  assert.deepEqual(
    applyAnswer(fresh(), "colours", { colour }, clock).styling.profile.colour,
    colour,
  );
});

test("answers read back from the closet for editing", () => {
  let closet = applyAnswer(
    fresh(),
    "hijab",
    { hijab: "always", coverage: "moderate" },
    clock,
  );
  closet = applyAnswer(
    closet,
    "body",
    { heightCm: 170, bodyShape: null },
    clock,
  );
  closet = applyAnswer(closet, "colours", { colour }, clock);
  const answers = answersFrom(closet);
  assert.deepEqual(answers.hijab, { hijab: "always", coverage: "moderate" });
  assert.deepEqual(answers.place, { units: "metric", place: null });
  assert.deepEqual(answers.body, { heightCm: 170, bodyShape: null });
  assert.deepEqual(answers.colours, { colour });
  assert.equal(answersFrom(withPreset(null)).hijab.hijab, null);
  assert.equal(answersFrom(fresh()).hijab.hijab, null);
});

test("finishing keeps every answer and marks her as onboarded", () => {
  const answered = applyAnswer(
    fresh(),
    "body",
    { heightCm: 160, bodyShape: null },
    clock,
  );
  const done = finishOnboarding(answered);
  assert.equal(done.styling.onboarded, true);
  assert.equal(done.styling.profile.heightCm, 160);
  assert.equal(decodeCloset(JSON.stringify(done)).styling.onboarded, true);
});

test("temperatures follow the chosen units", () => {
  assert.equal(formatTemperature(12.4, "metric"), "12°C");
  assert.equal(formatTemperature(-3.6, "metric"), "-4°C");
  assert.equal(formatTemperature(12.4, "imperial"), "54°F");
});

test("heights follow the chosen units and survive a round trip", () => {
  assert.equal(formatHeight(165, "metric"), "165 cm");
  assert.deepEqual(feetAndInches(165), { feet: 5, inches: 5 });
  assert.equal(formatHeight(165, "imperial"), "5 ft 5 in");
  assert.equal(parseHeight("imperial", { feet: "5", inches: "5" }), 165);
  assert.equal(parseHeight("imperial", { feet: "5", inches: "" }), 152);
  assert.equal(parseHeight("metric", { cm: " 165,4 " }), 165);
});

test("height entries outside 120 to 220 cm or with 12 inches or more are rejected", () => {
  assert.equal(parseHeight("metric", { cm: "1.65" }), null);
  assert.equal(parseHeight("metric", { cm: "500" }), null);
  assert.equal(parseHeight("metric", { cm: "tall" }), null);
  assert.equal(parseHeight("metric", { cm: "" }), null);
  assert.equal(parseHeight("imperial", { feet: "5", inches: "13" }), null);
  assert.equal(parseHeight("imperial", { feet: "", inches: "5" }), null);
  assert.equal(parseHeight("metric", { cm: "120" }), 120);
  assert.equal(parseHeight("metric", { cm: "220" }), 220);
  assert.equal(emptyCloset.styling.profile.heightCm, null);
});
