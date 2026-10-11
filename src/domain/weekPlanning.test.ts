import { test } from "node:test";
import assert from "node:assert/strict";
import { emptyCloset, type Closet, type StylePreset } from "./closet";
import { weekPlan } from "./looks";
import { ClosetRepository, type ClosetStorage } from "./repository";
import { ownedCloset, piece } from "./test-helpers";
import {
  planningWeather,
  previewWeek,
  saveWeekPlan,
  StaleWeekPlanError,
  weekOccasion,
} from "./weekPlanning";

const start = "2026-10-05";
const stamp = "2026-10-05T08:00:00.000Z";
const options = { start, today: start, timeZone: "Europe/Oslo" };
const key = (ids: string[]) => [...ids].sort().join(",");

function wardrobe(count = 8): Closet {
  return ownedCloset(
    [
      ...Array.from({ length: count }, (_, index) =>
        piece(`dress-${index}`, "dress", {
          kind: "dress",
          styles: ["western"],
          attributes: {
            sleeve: "long",
            length: "ankle",
            formality: 2,
            fabric: "cotton",
          },
        }),
      ),
      piece("shoes", "shoes", { kind: "loafers" }),
      piece("hijab", "hijab", { kind: "hijab" }),
    ],
    {
      ...emptyCloset,
      styling: {
        ...emptyCloset.styling,
        profile: { ...emptyCloset.styling.profile, coverageLevel: "full" },
        everyday: {
          occasion: "everyday",
          style: "western",
          hijab: "always",
          version: 1,
          sample: false,
        },
      },
    },
  );
}

function forecast(closet = wardrobe()): Closet {
  return {
    ...closet,
    styling: {
      ...closet.styling,
      forecast: {
        date: start,
        fetchedAt: stamp,
        low: 10,
        high: 22,
        weather: {
          source: "forecast",
          at: start,
          warmth: "warm",
          precipitation: "dry",
          exposure: null,
        },
        attribution: { logo: "", url: "" },
        hours: [
          {
            at: "2026-10-05T10:00:00.000Z",
            celsius: 22,
            windMs: 0,
            precipitation: "none",
            chance: 0,
          },
          {
            at: "2026-10-06T10:00:00.000Z",
            celsius: 12,
            windMs: 0,
            precipitation: "rain",
            chance: 0.8,
          },
        ],
      },
    },
  };
}

const newDates = (preview: ReturnType<typeof previewWeek>) =>
  preview.days
    .filter((day) => !day.existing && day.pieceIds.length)
    .map((day) => day.date);

test("week planning defaults to work on weekdays and everyday on weekends across months", () => {
  assert.equal(weekOccasion("2026-10-05"), "work");
  assert.equal(weekOccasion("2026-10-10"), "everyday");
  const preview = previewWeek(wardrobe(), { ...options, start: "2026-10-30" });
  assert.deepEqual(
    preview.days.map((day) => day.date),
    [
      "2026-10-30",
      "2026-10-31",
      "2026-11-01",
      "2026-11-02",
      "2026-11-03",
      "2026-11-04",
      "2026-11-05",
    ],
  );
  assert.deepEqual(
    preview.days.map((day) => day.request.occasion),
    ["work", "everyday", "everyday", "work", "work", "work", "work"],
  );
});

test("forecast uses each day's actual local hours and marks missing or stale days unknown", () => {
  const closet = forecast();
  assert.equal(
    planningWeather(closet, start, start, options.timeZone).source,
    "forecast",
  );
  assert.deepEqual(
    planningWeather(closet, "2026-10-06", start, options.timeZone),
    {
      source: "forecast",
      warmth: "mild",
      precipitation: "rain",
      exposure: null,
      at: "2026-10-06",
      feelsLike: 12,
    },
  );
  assert.deepEqual(
    planningWeather(closet, "2026-10-07", start, options.timeZone),
    { source: "unknown" },
  );
  assert.deepEqual(
    planningWeather(closet, "2026-10-06", "2026-10-06", options.timeZone),
    { source: "unknown" },
  );
  const preview = previewWeek(closet, options);
  assert.equal(preview.days[1]!.request.weather.source, "forecast");
  assert.equal(preview.days[2]!.request.weather.source, "unknown");
});

test("variety uses different outfits and dresses before repeating", () => {
  const preview = previewWeek(wardrobe(), options);
  assert.ok(preview.days.every((day) => day.pieceIds.length >= 3));
  assert.equal(new Set(preview.days.map((day) => key(day.pieceIds))).size, 7);
  assert.equal(
    new Set(
      preview.days.flatMap((day) =>
        day.pieceIds.filter((id) => id.startsWith("dress")),
      ),
    ).size,
    7,
  );
  assert.ok(preview.days.every((day) => !day.repeated));
});

test("existing plans remain intact and new days get separate looks even with repeated clothes", () => {
  const original = {
    id: "saved",
    name: "Mine",
    createdAt: stamp,
    plannedFor: start,
    pieceIds: ["dress-0", "shoes", "hijab"],
  };
  const closet = { ...wardrobe(1), looks: [original] };
  const preview = previewWeek(closet, options);
  assert.equal(preview.days[0]!.existing, original);
  assert.ok(preview.days.slice(1).every((day) => day.repeated));
  const after = saveWeekPlan(closet, preview, newDates(preview), stamp, "en");
  assert.equal(after.looks[0], original);
  assert.equal(new Set(after.looks.map((look) => look.id)).size, 7);
  assert.ok(weekPlan(after, start).every((day) => day.look));
});

test("empty or incomplete wardrobes show gaps without saving fabricated outfits", () => {
  const closet = wardrobe(0);
  const preview = previewWeek(closet, options);
  assert.ok(
    preview.days.every((day) => !day.pieceIds.length && day.problems.length),
  );
  assert.equal(saveWeekPlan(closet, preview, [], stamp, "en"), closet);
  assert.throws(
    () => saveWeekPlan(closet, preview, [start], stamp, "en"),
    StaleWeekPlanError,
  );
});

test("presets apply by weekday occasion and per-day selections override defaults", () => {
  const work: StylePreset = {
    id: "office",
    name: "Office",
    occasion: "work",
    style: "western",
    hijab: "always",
    feel: "smart",
  };
  const casual: StylePreset = {
    id: "weekend",
    name: "Weekend",
    occasion: "everyday",
    style: "western",
    hijab: "not-needed",
    feel: "comfy",
  };
  const closet = wardrobe();
  closet.styling = { ...closet.styling, presets: [work, casual] };
  const preview = previewWeek(closet, options);
  assert.equal(preview.days[0]!.request.feel, "smart");
  assert.equal(preview.days[5]!.request.feel, "comfy");
  assert.equal(preview.days[5]!.request.hijab, "not-needed");
  const custom = previewWeek(closet, {
    ...options,
    preset: casual,
    dayPresets: { [start]: work },
    occasions: { "2026-10-06": "dinner" },
  });
  assert.equal(custom.days[0]!.request.occasion, "work");
  assert.equal(custom.days[1]!.request.occasion, "dinner");
  assert.equal(custom.days[2]!.request.occasion, "everyday");
});

test("preset feel changes the selected outfits before variety ranking", () => {
  const closet = wardrobe(0);
  closet.pieces.push(
    piece("casual", "dress", {
      kind: "dress",
      attributes: { sleeve: "long", length: "ankle", formality: 1 },
    }),
    piece("festive", "dress", {
      kind: "dress",
      attributes: { sleeve: "long", length: "ankle", formality: 5 },
    }),
  );
  const preset: StylePreset = {
    id: "style",
    name: "Style",
    occasion: "everyday",
    style: "western",
    hijab: "always",
    feel: "comfy",
  };
  const comfy = previewWeek(closet, { ...options, preset });
  const dressed = previewWeek(closet, {
    ...options,
    preset: { ...preset, feel: "dressed" },
  });
  assert.ok(comfy.days.every((day) => day.pieceIds.includes("casual")));
  assert.ok(dressed.days.every((day) => day.pieceIds.includes("festive")));
});

test("unavailable, archived and never-wear pieces are excluded and unknown coverage creates gaps", () => {
  const closet = wardrobe(4);
  closet.pieces = closet.pieces.map((item) =>
    item.id === "dress-0"
      ? { ...item, status: "away" as const }
      : item.id === "dress-1"
        ? { ...item, status: "archived" as const }
        : item.id === "dress-2"
          ? { ...item, kind: "kaftan" as const }
          : item,
  );
  closet.styling.profile.neverWear = [{ kind: "kaftan" }];
  const preview = previewWeek(closet, options);
  assert.ok(
    preview.days.every(
      (day) =>
        day.pieceIds.includes("dress-3") &&
        !day.pieceIds.some((id) =>
          ["dress-0", "dress-1", "dress-2"].includes(id),
        ),
    ),
  );
  closet.pieces = closet.pieces.map((item) =>
    item.id === "dress-3" ? { ...item, attributes: {} } : item,
  );
  assert.ok(
    previewWeek(closet, options).days.every((day) => !day.pieceIds.length),
  );
});

test("future-day temperature rules apply to each actual forecast", () => {
  const closet = forecast();
  closet.pieces.push(
    piece("hot-dress", "dress", {
      kind: "kaftan",
      attributes: { sleeve: "long", length: "ankle" },
    }),
  );
  closet.styling.rules = [{ kind: "kaftan", aboveTemp: 11 }];
  const preview = previewWeek(closet, options);
  assert.ok(!preview.days[0]!.pieceIds.includes("hot-dress"));
  assert.ok(!preview.days[1]!.pieceIds.includes("hot-dress"));
});

test("save rejects stale clothes, preferences, personal rules and calendar conflicts atomically", () => {
  const closet = wardrobe();
  const preview = previewWeek(closet, options);
  const id = preview.days[0]!.pieceIds[0]!;
  const away = {
    ...closet,
    pieces: closet.pieces.map((item) =>
      item.id === id ? { ...item, status: "away" as const } : item,
    ),
  };
  assert.throws(
    () => saveWeekPlan(away, preview, newDates(preview), stamp, "en"),
    StaleWeekPlanError,
  );
  const rules = {
    ...closet,
    styling: {
      ...closet.styling,
      rules: [{ kind: "dress" as const, aboveTemp: 20 }],
    },
  };
  assert.throws(
    () => saveWeekPlan(rules, preview, newDates(preview), stamp, "en"),
    StaleWeekPlanError,
  );
  const profile = {
    ...closet,
    styling: {
      ...closet.styling,
      profile: {
        ...closet.styling.profile,
        coverageLevel: "moderate" as const,
      },
    },
  };
  assert.throws(
    () => saveWeekPlan(profile, preview, newDates(preview), stamp, "en"),
    StaleWeekPlanError,
  );
  const conflict = {
    ...closet,
    looks: [
      {
        id: "new",
        name: "New",
        createdAt: stamp,
        pieceIds: ["dress-0"],
        plannedFor: start,
      },
    ],
  };
  assert.throws(
    () => saveWeekPlan(conflict, preview, newDates(preview), stamp, "en"),
    StaleWeekPlanError,
  );
  assert.equal(conflict.looks.length, 1);
});

test("saved selections survive restart, unselected days stay open, failed storage does not publish", async () => {
  let raw: string | null = null;
  let fail = false;
  const storage: ClosetStorage = {
    read: async () => raw,
    write: async (value) => {
      if (fail) throw new Error("disk-full");
      raw = value;
    },
  };
  const repository = new ClosetRepository(storage);
  await repository.load();
  await repository.update(() => wardrobe());
  const preview = previewWeek(repository.getSnapshot(), options);
  await repository.update((current) =>
    saveWeekPlan(current, preview, [start], stamp, "nb"),
  );
  const reopened = new ClosetRepository(storage);
  await reopened.load();
  assert.equal(reopened.getSnapshot().looks.length, 1);
  assert.equal(
    weekPlan(reopened.getSnapshot(), start)[0]!.look?.plannedFor,
    start,
  );
  assert.equal(weekPlan(reopened.getSnapshot(), start)[1]!.look, null);
  const next = previewWeek(repository.getSnapshot(), options);
  fail = true;
  await assert.rejects(
    repository.update((current) =>
      saveWeekPlan(current, next, ["2026-10-06"], stamp, "en"),
    ),
  );
  assert.equal(repository.getSnapshot().looks.length, 1);
});

test("invalid dates and days that become past before save are rejected", () => {
  const closet = wardrobe();
  assert.throws(
    () => previewWeek(closet, { ...options, start: "2026-02-30" }),
    RangeError,
  );
  assert.throws(
    () => previewWeek(closet, { ...options, start: "2026-10-04" }),
    RangeError,
  );
  const preview = previewWeek(closet, options);
  assert.throws(
    () => saveWeekPlan(closet, preview, [start], "2026-10-06T08:00:00Z", "en"),
    StaleWeekPlanError,
  );
  assert.throws(
    () => saveWeekPlan(closet, preview, ["2026-11-01"], stamp, "en"),
    StaleWeekPlanError,
  );
});
