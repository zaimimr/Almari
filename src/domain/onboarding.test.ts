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
  placeFrom,
  previousStep,
  setName,
  skipStep,
  stepsFor,
  type OnboardingStep,
} from "./onboarding";
import { greeting, greetingShort } from "./greeting";
import { at } from "./test-helpers";
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

test("skip moves to the next step without saving and stops at done", () => {
  const answers = answersFrom(fresh());
  const walked: OnboardingStep[] = ["name"];
  while (walked[walked.length - 1] !== "done")
    walked.push(skipStep(walked[walked.length - 1]!, answers));
  assert.deepEqual(walked, onboardingSteps);
  assert.equal(skipStep("done", answers), "done");
});

test("the sample closet works with every answer skipped", () => {
  const closet = finishOnboarding(fresh(), clock);
  assert.equal(closet.styling.onboarded, true);
  assert.deepEqual(closet.styling.profile, neutralProfile);
  assert.ok(closet.pieces.length > 0);
});

test("hijab always creates an everyday preset and stores coverage", () => {
  const closet = applyAnswer(
    applyAnswer(fresh(), "hijab", { hijab: "always" }, clock),
    "coverage",
    { coverage: "full", answered: true },
    clock,
  );
  assert.deepEqual(closet.styling.everyday, {
    occasion: "everyday",
    style: "western",
    hijab: "always",
    sample: false,
    version: 2,
  });
  assert.equal(closet.styling.profile.coverageLevel, "full");
  assert.equal(closet.styling.today?.localDate, clock.localDate);
});

test("changing only the coverage level restyles today with the new coverage", () => {
  const moderate = applyAnswer(
    applyAnswer(fresh(), "hijab", { hijab: "always" }, clock),
    "coverage",
    { coverage: "moderate", answered: true },
    clock,
  );
  assert.deepEqual(moderate.styling.today?.everyday.request.coverage, {
    sleeve: "elbow",
    hem: "calf",
  });
  const full = applyAnswer(
    moderate,
    "coverage",
    { coverage: "full", answered: true },
    clock,
  );
  assert.equal(full.styling.profile.coverageLevel, "full");
  assert.deepEqual(full.styling.today?.everyday.request.coverage, {
    sleeve: "long",
    hem: "ankle",
  });
  assert.equal(
    full.styling.today?.everyday.revision,
    (moderate.styling.today?.everyday.revision ?? 0) + 1,
  );
});

test("hijab no maps to not needed and keeps her occasion and style", () => {
  const closet = applyAnswer(
    withPreset("always"),
    "hijab",
    { hijab: "no" },
    clock,
  );
  assert.equal(closet.styling.everyday?.hijab, "not-needed");
  assert.equal(closet.styling.everyday?.occasion, "work");
  assert.equal(closet.styling.everyday?.version, 2);
});

test("hijab sometimes clears the preset hijab and never creates a preset", () => {
  assert.equal(
    applyAnswer(withPreset("always"), "hijab", { hijab: "sometimes" }, clock)
      .styling.everyday?.hijab,
    null,
  );
  const none = applyAnswer(
    applyAnswer(fresh(), "hijab", { hijab: "sometimes" }, clock),
    "coverage",
    { coverage: "own", answered: true },
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
    applyAnswer(withForecast, "place", { place: oslo }, clock),
    "body",
    { units: "imperial", heightCm: null, bodyShape: null },
    clock,
  );
  assert.equal(same.styling.units, "imperial");
  assert.notEqual(same.styling.forecast, null);
  const bergen = { name: "Bergen", latitude: 60.39, longitude: 5.32 };
  const moved = applyAnswer(withForecast, "place", { place: bergen }, clock);
  assert.deepEqual(moved.styling.place, bergen);
  assert.equal(moved.styling.forecast, null);
});

test("body answers fill height and shape, and prefer not to say stays null", () => {
  const closet = applyAnswer(
    fresh(),
    "body",
    { units: "metric", heightCm: 165, bodyShape: "pear" },
    clock,
  );
  assert.equal(closet.styling.profile.heightCm, 165);
  assert.equal(closet.styling.profile.bodyShape, "pear");
  const preferNot = applyAnswer(
    closet,
    "body",
    { units: "metric", heightCm: null, bodyShape: null },
    clock,
  ).styling.profile;
  assert.equal(preferNot.bodyShape, null);
  assert.equal(preferNot.bodyAnswered, true);
});

test("style Desi sets the everyday style, and Both keeps it", () => {
  let desi = applyAnswer(
    withPreset("always"),
    "style",
    { styleLean: "desi" },
    clock,
  );
  desi = applyAnswer(desi, "fit", { fit: "loose" }, clock);
  desi = applyAnswer(
    desi,
    "colours",
    { colour: null, colourLean: "bold" },
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
    "style",
    { styleLean: "both" },
    clock,
  );
  assert.equal(both.styling.everyday?.style, "western");
  assert.equal(both.styling.profile.styleLean, "both");
  assert.equal(
    applyAnswer(desi, "style", { styleLean: "both" }, clock).styling.everyday
      ?.style,
    "desi",
  );
  const first = applyAnswer(fresh(), "style", { styleLean: "both" }, clock);
  assert.equal(first.styling.everyday?.style, "western");
  assert.equal(first.styling.profile.styleLean, "both");
});

test("the colour answer is stored on the profile", () => {
  assert.deepEqual(
    applyAnswer(fresh(), "colours", { colour, colourLean: null }, clock).styling
      .profile.colour,
    colour,
  );
});

test("answers read back from the closet for editing", () => {
  let closet = applyAnswer(fresh(), "hijab", { hijab: "always" }, clock);
  closet = applyAnswer(
    closet,
    "coverage",
    { coverage: "moderate", answered: true },
    clock,
  );
  closet = applyAnswer(
    closet,
    "body",
    { units: "metric", heightCm: 170, bodyShape: null },
    clock,
  );
  closet = applyAnswer(closet, "colours", { colour, colourLean: null }, clock);
  const answers = answersFrom(closet);
  assert.deepEqual(answers.hijab, { hijab: "always" });
  assert.deepEqual(answers.coverage, { coverage: "moderate", answered: true });
  assert.deepEqual(answers.place, { place: null });
  assert.deepEqual(answers.body, {
    units: "metric",
    heightCm: 170,
    bodyShape: null,
  });
  assert.deepEqual(answers.colours, { colour, colourLean: null });
  assert.equal(answersFrom(withPreset(null)).hijab.hijab, "sometimes");
  assert.equal(answersFrom(fresh()).hijab.hijab, null);
});

test("finishing keeps every answer and marks her as onboarded", () => {
  const answered = applyAnswer(
    fresh(),
    "body",
    { units: "metric", heightCm: 160, bodyShape: null },
    clock,
  );
  const done = finishOnboarding(answered, clock);
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

test("Back goes to the step before, and the first step has no Back", () => {
  const answers = answersFrom(fresh());
  assert.equal(previousStep("name", answers), null);
  assert.equal(previousStep("hijab", answers), "name");
  assert.equal(previousStep("coverage", answers), "hijabStyles");
  assert.equal(previousStep("done", answers), "colours");
});

test("ten steps in the owner's order, hijab styles skipped after Not needed", () => {
  assert.deepEqual(
    [...onboardingSteps],
    [
      "name",
      "hijab",
      "hijabStyles",
      "coverage",
      "style",
      "fit",
      "sparkle",
      "place",
      "notifications",
      "colours",
      "done",
    ],
  );
  const answers = answersFrom(emptyCloset);
  assert.equal(stepsFor(answers).length, 11);
  assert.equal(skipStep("hijab", answers), "hijabStyles");
  const no = { ...answers, hijab: { hijab: "no" as const } };
  assert.equal(stepsFor(no).length, 10);
  assert.equal(skipStep("hijab", no), "coverage");
  assert.equal(previousStep("coverage", no), "hijab");
});

test("Sometimes and never answered are told apart", () => {
  const clock = at("2026-10-02T08:00:00+02:00");
  assert.equal(answersFrom(emptyCloset).hijab.hijab, null);
  const sometimes = applyAnswer(
    emptyCloset,
    "hijab",
    { hijab: "sometimes" },
    clock,
  );
  assert.equal(sometimes.styling.profile.hijabAnswered, true);
  assert.equal(answersFrom(sometimes).hijab.hijab, "sometimes");
  const none = applyAnswer(
    emptyCloset,
    "coverage",
    { coverage: null, answered: true },
    clock,
  );
  assert.equal(none.styling.profile.coverageAnswered, true);
  assert.equal(answersFrom(none).coverage.answered, true);
  assert.equal(answersFrom(emptyCloset).coverage.answered, false);
});

test("finishing onboarding writes the everyday style so the sample closet lands on an outfit", () => {
  const clock = at("2026-10-02T08:00:00+02:00");
  let closet = applyAnswer(
    addSampleWardrobe(emptyCloset),
    "hijab",
    { hijab: "always" },
    clock,
  );
  closet = applyAnswer(closet, "style", { styleLean: "desi" }, clock);
  closet = applyAnswer(
    closet,
    "coverage",
    { coverage: "moderate", answered: true },
    clock,
  );
  closet = finishOnboarding(closet, clock);
  assert.equal(closet.styling.onboarded, true);
  assert.equal(closet.styling.everyday?.occasion, "everyday");
  assert.equal(closet.styling.everyday?.style, "desi");
  assert.equal(closet.styling.everyday?.hijab, "always");
  const skipped = finishOnboarding(addSampleWardrobe(emptyCloset), clock);
  assert.equal(skipped.styling.everyday?.style, "western");
  assert.equal(skipped.styling.everyday?.hijab, null);
});

test("the name is trimmed and the greeting follows the hour", () => {
  const named = setName(emptyCloset, "  Sara  ");
  assert.equal(named.styling.name, "Sara");
  assert.equal(setName(named, "   ").styling.name, undefined);
  assert.equal(setName(emptyCloset, "a".repeat(50)).styling.name?.length, 40);
  assert.equal(greeting("Sara", 8, "en"), "Good morning, Sara");
  assert.equal(greeting("Sara", 15, "en"), "Good afternoon, Sara");
  assert.equal(greeting("Sara", 20, "nb"), "God kveld, Sara");
  assert.equal(greeting(null, 9, "en"), "Good morning");
  assert.equal(greeting("Sara", 15, "nb"), "Hei, Sara");
  assert.equal(greetingShort("Sara", "en"), "Hi, Sara");
});

test("a place is trimmed, rounded and validated", () => {
  assert.deepEqual(placeFrom(" Oslo ", 59.91273, 10.74609, "device"), {
    name: "Oslo",
    latitude: 59.91,
    longitude: 10.75,
    source: "device",
  });
  assert.equal(placeFrom("Oslo", Number.NaN, 10, "search"), null);
  assert.equal(placeFrom("Oslo", 91, 10, "search"), null);
  assert.equal(placeFrom("   ", 59.9, 10.7, "search"), null);
});
