import { test } from "node:test";
import assert from "node:assert/strict";
import type { OutfitRequest, Piece } from "./closet";
import { weatherTip } from "./weatherTip";

const piece = (
  id: string,
  category: Piece["category"],
  kind: Piece["kind"],
  traits: Piece["traits"] = {},
): Piece => ({
  id,
  name: id,
  category,
  kind,
  traits,
  photo: `${id}.jpg`,
  createdAt: "2026-10-01T00:00:00Z",
  source: "owned",
});

const request = (weather: OutfitRequest["weather"]): OutfitRequest => ({
  occasion: "everyday",
  style: "western",
  garmentType: null,
  keptIds: [],
  excludedIds: [],
  weather,
  hijab: "always",
  wardrobe: "owned",
});

const tunic = piece("tunic", "tunic", "tunic");
const loafers = piece("loafers", "shoes", "loafers");
const boots = piece("boots", "shoes", "boots", { rain: true, snow: true });
const coat = piece("coat", "layer", "coat", { warmth: "warm" });
const cardigan = piece("cardigan", "layer", "cardigan", { warmth: "light" });
const pool = [tunic, loafers, boots, coat, cardigan];

test("a cold day without a warm layer suggests the warm coat", () => {
  const tip = weatherTip(
    [tunic, loafers],
    request({
      source: "manual",
      warmth: "cold",
      precipitation: "dry",
      exposure: null,
    }),
    pool,
  );
  assert.equal(tip?.weather, "cold");
  assert.equal(tip?.piece.id, "coat");
  assert.equal(tip?.replaces, null);
});

test("a warm blazer is never offered under an open abaya", () => {
  const abaya = piece("abaya", "layer", "abaya", { open: true });
  const blazer = piece("blazer", "layer", "blazer", { warmth: "warm" });
  const tip = weatherTip(
    [tunic, abaya, loafers],
    request({
      source: "manual",
      warmth: "cold",
      precipitation: "dry",
      exposure: null,
    }),
    [tunic, abaya, loafers, blazer],
  );
  assert.equal(tip, null);
});

test("rain with loafers suggests swapping to boots", () => {
  const tip = weatherTip(
    [tunic, loafers],
    request({
      source: "manual",
      warmth: "mild",
      precipitation: "rain",
      exposure: null,
    }),
    pool,
  );
  assert.equal(tip?.weather, "rain");
  assert.equal(tip?.piece.id, "boots");
  assert.equal(tip?.replaces?.id, "loafers");
});

test("no tip when the outfit already suits the weather or she stays inside", () => {
  const cold = {
    source: "manual" as const,
    warmth: "cold" as const,
    precipitation: "rain" as const,
    exposure: null,
  };
  assert.equal(weatherTip([tunic, boots, coat], request(cold), pool), null);
  assert.equal(
    weatherTip(
      [tunic, loafers],
      request({ ...cold, exposure: "mostly-indoors" }),
      pool,
    ),
    null,
  );
  assert.equal(
    weatherTip([tunic, loafers], request({ source: "unknown" }), pool),
    null,
  );
});
