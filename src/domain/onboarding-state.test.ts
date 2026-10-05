import { test } from "node:test";
import assert from "node:assert/strict";
import { decodeCloset, emptyCloset, neutralProfile } from "./closet";
import { closetV2 } from "./closet-v2.fixture";
import { ClosetRepository, keyedStorage } from "./repository";
import { addSampleWardrobe } from "./samples";

const onboardingKeys = [
  "profile",
  "units",
  "place",
  "forecast",
  "onboarded",
  "layout",
];

const ownedPiece = {
  id: "owned-kurta",
  name: "Sage kurta",
  category: "tunic",
  photo: "owned-kurta.png",
  createdAt: "2026-10-01T08:00:00.000Z",
  source: "owned",
};

function storedBeforeThisPart(withOwned: boolean) {
  const raw = JSON.parse(JSON.stringify(addSampleWardrobe(emptyCloset)));
  for (const key of onboardingKeys) delete raw.styling[key];
  if (withOwned) raw.pieces.push(ownedPiece);
  return raw;
}

const forecast = {
  date: "2026-10-01",
  fetchedAt: "2026-10-01T05:00:00.000Z",
  weather: {
    source: "forecast",
    warmth: "mild",
    precipitation: "rain",
    exposure: null,
    at: "2026-10-01",
  },
  low: 9,
  high: 13,
  attribution: {
    logo: "https://example.com/mark.png",
    url: "https://example.com/legal",
  },
};

test("a new install starts neutral, metric and not onboarded", () => {
  const closet = decodeCloset(null);
  assert.deepEqual(closet.styling.profile, neutralProfile);
  assert.equal(closet.styling.units, "metric");
  assert.equal(closet.styling.place, null);
  assert.equal(closet.styling.forecast, null);
  assert.equal(closet.styling.onboarded, false);
  assert.equal(closet.styling.layout, "reasons");
  assert.ok(
    Object.values(neutralProfile).every(
      (value) => value === null || (Array.isArray(value) && !value.length),
    ),
  );
});

test("a closet with only samples saved before this part still gets onboarding", () => {
  const closet = decodeCloset(JSON.stringify(storedBeforeThisPart(false)));
  assert.equal(closet.styling.onboarded, false);
  assert.deepEqual(closet.styling.profile, neutralProfile);
});

test("a closet with her own clothes saved before this part skips onboarding", () => {
  assert.equal(
    decodeCloset(JSON.stringify(storedBeforeThisPart(true))).styling.onboarded,
    true,
  );
  assert.equal(decodeCloset(JSON.stringify(closetV2)).styling.onboarded, true);
  const v1 = {
    version: 1,
    pieces: [
      {
        id: ownedPiece.id,
        name: ownedPiece.name,
        category: ownedPiece.category,
        photo: ownedPiece.photo,
        createdAt: ownedPiece.createdAt,
      },
    ],
    looks: [],
  };
  assert.equal(decodeCloset(JSON.stringify(v1)).styling.onboarded, true);
});

test("a stored onboarded false is kept even when she has her own clothes", () => {
  const raw = storedBeforeThisPart(true);
  raw.styling.onboarded = false;
  assert.equal(decodeCloset(JSON.stringify(raw)).styling.onboarded, false);
});

test("stored answers, place and forecast survive a round trip", () => {
  const closet = {
    ...emptyCloset,
    styling: {
      ...emptyCloset.styling,
      profile: {
        ...neutralProfile,
        coverageLevel: "full" as const,
        heightCm: 165,
        weightKg: 61.2,
        bodyShape: "hourglass" as const,
        fit: "loose" as const,
        colourLean: "soft" as const,
        styleLean: "both" as const,
        colour: {
          skin: [60, 12, 20] as [number, number, number],
          hair: null,
          eyes: [30, 4, 9] as [number, number, number],
          undertone: "warm" as const,
          depth: "medium" as const,
          contrast: "medium" as const,
          season: "warm-spring" as const,
          source: "confirmed" as const,
        },
      },
      units: "imperial" as const,
      place: { name: "Oslo", latitude: 59.91, longitude: 10.75 },
      forecast: forecast as never,
      onboarded: true,
      layout: "full" as const,
    },
  };
  assert.deepEqual(decodeCloset(JSON.stringify(closet)), closet);
});

test("a profile saved with fewer fields gets the missing ones as null", () => {
  const raw = storedBeforeThisPart(false);
  raw.styling.profile = { coverageLevel: "moderate" };
  assert.deepEqual(decodeCloset(JSON.stringify(raw)).styling.profile, {
    ...neutralProfile,
    coverageLevel: "moderate",
  });
});

test("broken onboarding values keep the closet unreadable instead of empty", () => {
  const broken = [
    { units: "kelvin" },
    { place: { name: "Oslo", latitude: 200, longitude: 10 } },
    { profile: { heightCm: 500 } },
    { profile: { weightKg: 900 } },
    { profile: { weightKg: "heavy" } },
    { profile: { bodyShape: "triangle" } },
    { profile: "tall" },
    {
      profile: {
        colour: {
          skin: null,
          hair: null,
          eyes: null,
          undertone: "warm",
          depth: "medium",
          contrast: "low",
          season: "monsoon",
          source: "measured",
        },
      },
    },
    { forecast: { ...forecast, weather: { source: "unknown" } } },
    { onboarded: "yes" },
    { layout: "huge" },
  ];
  for (const change of broken) {
    const raw = storedBeforeThisPart(true);
    raw.styling = { ...raw.styling, ...change };
    assert.throws(
      () => decodeCloset(JSON.stringify(raw)),
      JSON.stringify(change),
    );
  }
});

test("an existing closet with her own clothes skips onboarding and keeps closet.v2 untouched", async () => {
  const v2 = JSON.stringify(closetV2);
  const store = new Map<string, string>([["closet.v2", v2]]);
  const repository = new ClosetRepository(
    keyedStorage(
      async (key) => store.get(key) ?? null,
      async (key, value) => {
        store.set(key, value);
      },
      async (key) => {
        store.delete(key);
      },
    ),
  );
  await repository.load();
  assert.equal(repository.getSnapshot().styling.onboarded, true);
  await repository.update((closet) => ({
    ...closet,
    styling: { ...closet.styling, units: "imperial" },
  }));
  assert.equal(store.get("closet.v2"), v2);
  const written = JSON.parse(store.get("closet.v3")!);
  assert.equal(written.styling.units, "imperial");
  assert.equal(written.styling.onboarded, true);
});

test("reset removes every older closet key and writes only closet.v3", async () => {
  const store = new Map<string, string>([
    ["closet.v2", JSON.stringify(closetV2)],
    ["closet.v1", "{}"],
  ]);
  const repository = new ClosetRepository(
    keyedStorage(
      async (key) => store.get(key) ?? null,
      async (key, value) => {
        store.set(key, value);
      },
      async (key) => {
        store.delete(key);
      },
    ),
  );
  await repository.load();
  await repository.reset((closet) => closet);
  assert.deepEqual([...store.keys()], ["closet.v3"]);
});
