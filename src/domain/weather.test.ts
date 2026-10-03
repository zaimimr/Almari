import { test } from "node:test";
import assert from "node:assert/strict";
import { addSampleWardrobe } from "./samples";
import {
  decodeCloset,
  emptyCloset,
  type Closet,
  type Forecast,
  type ForecastHour,
  type OutfitRequest,
} from "./closet";
import { rulesScorer } from "./scoring/rulesScorer";
import { scoreContext } from "./scoring/taste";
import { styleOutfits } from "./styling";
import {
  activeSession,
  applyRequest,
  ensureToday,
  everydayRequest,
  saveEverydayStyle,
  saveForecast,
} from "./today";
import {
  feelsLike,
  forecastFor,
  forecastWeather,
  weatherFor,
  weatherFromForecast,
} from "./weather";

const zone = "Europe/Oslo";
const date = "2026-10-01";
const clock = { localDate: date, timeZone: zone };
const hourAt = (local: number) =>
  new Date(Date.UTC(2026, 9, 1, local - 2)).toISOString();
const hour = (
  local: number,
  change: Partial<ForecastHour> = {},
): ForecastHour => ({
  at: hourAt(local),
  celsius: 12,
  precipitation: "none",
  chance: 0,
  windMs: 0,
  ...change,
});
const range = (from: number, to: number, change: Partial<ForecastHour> = {}) =>
  Array.from({ length: to - from + 1 }, (_, index) =>
    hour(from + index, change),
  );
const day = (change: Partial<ForecastHour> = {}) => range(6, 22, change);
const at = (hours: ForecastHour[]) => weatherFromForecast(hours, date, zone);

const attribution = {
  logo: "https://example.com/mark.png",
  url: "https://example.com/legal",
};

const forecast = (change: Partial<Forecast> = {}): Forecast => ({
  date,
  fetchedAt: "2026-10-01T05:00:00.000Z",
  weather: at(day({ celsius: 3, precipitation: "snow", chance: 0.8 }))!,
  low: 3,
  high: 3,
  attribution,
  ...change,
});

const styled = (): Closet =>
  saveEverydayStyle(
    addSampleWardrobe(emptyCloset),
    { occasion: "work", style: "western", hijab: "always", sample: true },
    clock,
    true,
  );

const manual = {
  source: "manual" as const,
  warmth: "warm" as const,
  precipitation: "dry" as const,
  exposure: "mostly-indoors" as const,
};

test("a mild dry day becomes a forecast for that date", () => {
  assert.deepEqual(at(day()), {
    source: "forecast",
    warmth: "mild",
    precipitation: "dry",
    exposure: null,
    at: date,
  });
});

test("warmth thresholds are warm from 18 and cold below 8", () => {
  assert.equal(at(day({ celsius: 18 }))?.warmth, "warm");
  assert.equal(at(day({ celsius: 17.9 }))?.warmth, "mild");
  assert.equal(at(day({ celsius: 8 }))?.warmth, "mild");
  assert.equal(at(day({ celsius: 7.9 }))?.warmth, "cold");
});

test("only hours from 08 to 20 local time count", () => {
  const hours = [
    ...[6, 7, 20, 21, 22].map((local) => hour(local, { celsius: -5 })),
    ...range(8, 19, { celsius: 20 }),
  ];
  assert.equal(at(hours)?.warmth, "warm");
  assert.equal(
    at([...range(8, 19), hour(7, { precipitation: "rain", chance: 0.9 })])
      ?.precipitation,
    "dry",
  );
  assert.equal(
    at([...range(8, 19), hour(20, { precipitation: "rain", chance: 0.9 })])
      ?.precipitation,
    "dry",
  );
});

test("wind is folded into feels-like on cold days", () => {
  assert.ok(Math.abs(feelsLike(9, 8) - 5.36) < 0.05);
  assert.equal(feelsLike(15, 10), 15);
  assert.equal(feelsLike(5, 1), 5);
  assert.equal(at(day({ celsius: 9 }))?.warmth, "mild");
  assert.equal(at(day({ celsius: 9, windMs: 8 }))?.warmth, "cold");
});

test("rain or snow needs a chance of at least 0.4 in daytime, and snow wins", () => {
  const once = (change: Partial<ForecastHour>) =>
    at([...range(8, 13), hour(14, change), ...range(15, 19)])?.precipitation;
  assert.equal(once({ precipitation: "rain", chance: 0.4 }), "rain");
  assert.equal(once({ precipitation: "rain", chance: 0.39 }), "dry");
  assert.equal(once({ precipitation: "snow", chance: 0.5 }), "snow");
  assert.equal(
    at([
      ...range(8, 9),
      hour(10, { precipitation: "rain", chance: 0.8 }),
      hour(15, { precipitation: "snow", chance: 0.5 }),
    ])?.precipitation,
    "snow",
  );
});

test("hours for another day give no forecast", () => {
  assert.equal(weatherFromForecast(day(), "2026-10-02", zone), null);
  assert.equal(at([]), null);
  assert.equal(forecastFor({ hours: [], attribution }, date, "x", zone), null);
});

test("a stored forecast keeps the daytime range and the attribution", () => {
  const hours = [
    hour(7, { celsius: 2 }),
    hour(9, { celsius: 6 }),
    hour(15, { celsius: 11 }),
  ];
  assert.deepEqual(
    forecastFor({ hours, attribution }, date, "2026-10-01T05:00:00.000Z", zone),
    {
      date,
      fetchedAt: "2026-10-01T05:00:00.000Z",
      weather: at(hours),
      low: 6,
      high: 11,
      attribution,
    },
  );
});

test("a forecast fetched yesterday is not used today", () => {
  assert.equal(
    forecastWeather(
      forecast({ fetchedAt: "2026-09-30T20:00:00.000Z" }),
      date,
      zone,
    ),
    null,
  );
  assert.equal(
    forecastWeather(forecast({ date: "2026-09-30" }), date, zone),
    null,
  );
  assert.equal(forecastWeather(null, date, zone), null);
  assert.deepEqual(forecastWeather(forecast(), date, zone), forecast().weather);
});

test("without a fresh forecast Today starts with unknown weather and manual choice still works", () => {
  const closet = styled();
  const session = activeSession(closet.styling.today!);
  assert.deepEqual(session.request.weather, { source: "unknown" });
  assert.deepEqual(weatherFor(closet, date, zone), { source: "unknown" });
  const chosen = applyRequest(
    closet,
    { ...session.request, weather: manual },
    session.revision,
  );
  assert.deepEqual(
    activeSession(chosen.styling.today!).request.weather,
    manual,
  );
  assert.deepEqual(weatherFor(chosen, date, zone), manual);
});

test("a fresh forecast restyles today when no weather was chosen", () => {
  const closet = saveForecast(styled(), forecast());
  const session = activeSession(closet.styling.today!);
  assert.deepEqual(session.request.weather, forecast().weather);
  assert.equal(session.revision, 2);
  assert.deepEqual(weatherFor(closet, date, zone), forecast().weather);
  assert.deepEqual(decodeCloset(JSON.stringify(closet)), closet);
  assert.equal(
    saveForecast(closet, forecast()).styling.today,
    closet.styling.today,
  );
});

test("a manual choice is never replaced by a forecast", () => {
  const closet = styled();
  const session = activeSession(closet.styling.today!);
  const chosen = applyRequest(
    closet,
    { ...session.request, weather: manual },
    session.revision,
  );
  const after = saveForecast(chosen, forecast());
  assert.deepEqual(after.styling.today, chosen.styling.today);
  assert.deepEqual(after.styling.forecast, forecast());
  assert.deepEqual(weatherFor(after, date, zone), manual);
});

test("a forecast for another day is stored but leaves today alone", () => {
  const closet = styled();
  const tomorrow = forecast({
    date: "2026-10-02",
    fetchedAt: "2026-10-02T05:00:00.000Z",
  });
  const after = saveForecast(closet, tomorrow);
  assert.deepEqual(after.styling.today, closet.styling.today);
  const next = ensureToday(after, { localDate: "2026-10-02", timeZone: zone });
  assert.deepEqual(
    activeSession(next.styling.today!).request.weather,
    tomorrow.weather,
  );
});

test("forecast weather is treated like the same weather entered by hand", () => {
  const pieces = addSampleWardrobe(emptyCloset).pieces;
  const base: OutfitRequest = {
    occasion: "work",
    style: "western",
    garmentType: null,
    keptIds: [],
    excludedIds: [],
    weather: { source: "unknown" },
    hijab: "always",
    wardrobe: "sample",
  };
  const snow = {
    warmth: "cold",
    precipitation: "snow",
    exposure: null,
  } as const;
  const byHand = styleOutfits(
    pieces,
    { ...base, weather: { source: "manual", ...snow } },
    "seed",
    rulesScorer,
    scoreContext(emptyCloset),
  );
  const forecasted = styleOutfits(
    pieces,
    { ...base, weather: { source: "forecast", ...snow, at: date } },
    "seed",
    rulesScorer,
    scoreContext(emptyCloset),
  );
  const unknown = styleOutfits(
    pieces,
    base,
    "seed",
    rulesScorer,
    scoreContext(emptyCloset),
  );
  assert.equal(forecasted.status, "review");
  const withoutClear = (result: typeof byHand) =>
    JSON.parse(
      JSON.stringify(result, (key, value) =>
        key === "actions"
          ? value.filter(
              (action: { type: string }) => action.type !== "clear-weather",
            )
          : value,
      ),
    );
  assert.deepEqual(forecasted, withoutClear(byHand));
  assert.notDeepEqual(forecasted, unknown);
});

test("the everyday exposure answer is applied to forecast weather", () => {
  const preset = {
    version: 1,
    occasion: "everyday" as const,
    style: "western" as const,
    hijab: "always" as const,
    sample: false,
    exposure: "time-outside" as const,
  };
  const forecast = {
    source: "forecast" as const,
    warmth: "cold" as const,
    precipitation: "rain" as const,
    exposure: null,
    at: date,
  };
  assert.deepEqual(everydayRequest(preset, "owned", null, forecast).weather, {
    ...forecast,
    exposure: "time-outside",
  });
  assert.deepEqual(
    everydayRequest({ ...preset, exposure: undefined }, "owned", null, forecast)
      .weather,
    forecast,
  );
  assert.deepEqual(
    everydayRequest(preset, "owned", null, manual).weather,
    manual,
  );
});

test("a fresh forecast keeps the everyday exposure answer", () => {
  const outside = saveEverydayStyle(
    addSampleWardrobe(emptyCloset),
    {
      occasion: "work",
      style: "western",
      hijab: "always",
      sample: true,
      exposure: "time-outside",
    },
    clock,
    true,
  );
  const closet = saveForecast(outside, forecast());
  const session = activeSession(closet.styling.today!);
  assert.deepEqual(session.request.weather, {
    ...forecast().weather,
    exposure: "time-outside",
  });
  assert.equal(
    saveForecast(closet, forecast()).styling.today,
    closet.styling.today,
  );
  const next = ensureToday(
    { ...closet, styling: { ...closet.styling, today: null } },
    clock,
  );
  assert.equal(
    saveForecast(next, forecast()).styling.today,
    next.styling.today,
  );
});
