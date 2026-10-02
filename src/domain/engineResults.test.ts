import { test } from "node:test";
import assert from "node:assert/strict";
import type {
  Engine,
  FeedbackEvent,
  FeedbackKind,
  OutfitRequest,
  Style,
} from "./closet";
import { en } from "../i18n/en";
import { nb } from "../i18n/nb";
import { engineResults, rateText } from "./scoring/results";

const request = (style: Style): OutfitRequest => ({
  occasion: "everyday",
  style,
  garmentType: null,
  keptIds: [],
  excludedIds: [],
  weather: { source: "unknown" },
  hijab: "always",
  wardrobe: "owned",
});

let next = 0;
const event = (
  engine: Engine,
  style: Style,
  kind: FeedbackKind,
  cursor?: number,
  undone?: boolean,
): FeedbackEvent => ({
  id: `event-${next++}`,
  at: "2026-10-01T08:00:00.000Z",
  kind,
  pieceIds: ["a", "b"],
  request: request(style),
  engine,
  ...(cursor === undefined ? {} : { cursor }),
  ...(undone ? { undone } : {}),
});

const row = (
  results: ReturnType<typeof engineResults>,
  engine: Engine,
  style: Style,
) => results.find((item) => item.engine === engine && item.style === style)!;

test("results are split by engine and by Desi and Western", () => {
  const results = engineResults([
    event("rules", "western", "wore", 0),
    event("rules", "western", "not-my-style", 1),
    event("rules", "western", "saved", 2),
    event("rules", "western", "too-plain", 4),
    event("model", "western", "not-my-style", 0),
    event("model", "desi", "wore", 1),
    event("model", "desi", "not-my-style", 0),
  ]);
  assert.deepEqual(
    results.map((item) => `${item.style}:${item.engine}`),
    ["western:rules", "western:model", "desi:rules", "desi:model"],
  );
  assert.deepEqual(row(results, "rules", "western"), {
    engine: "rules",
    style: "western",
    earlyRated: 3,
    earlyWouldWear: 2,
    rated: 4,
    notMyStyle: 1,
    wore: 1,
  });
  assert.deepEqual(row(results, "model", "desi"), {
    engine: "model",
    style: "desi",
    earlyRated: 2,
    earlyWouldWear: 1,
    rated: 2,
    notMyStyle: 1,
    wore: 1,
  });
  assert.equal(row(results, "rules", "desi").rated, 0);
});

test("undone and old events: undone never counts, no position skips the first three", () => {
  const results = engineResults([
    event("model", "western", "wore", 0, true),
    event("model", "western", "wore"),
    event("model", "western", "not-my-style"),
  ]);
  assert.deepEqual(row(results, "model", "western"), {
    engine: "model",
    style: "western",
    earlyRated: 0,
    earlyWouldWear: 0,
    rated: 2,
    notMyStyle: 1,
    wore: 1,
  });
});

test("rates read as counts with a percentage", () => {
  assert.equal(rateText(2, 3), "2 of 3 (67%)");
  assert.equal(rateText(0, 4), "0 of 4 (0%)");
  assert.equal(rateText(0, 0), "No feedback yet");
});

const placeholders = (text: string) =>
  [...text.matchAll(/\{(\w+)\}/g)].map((match) => match[1]).sort();

test("every stylist text has a bokmål text with the same placeholders", () => {
  const keys = Object.keys(en).filter((key) => key.startsWith("stylist."));
  assert.ok(keys.length >= 5);
  for (const key of keys) {
    const english = en[key as keyof typeof en];
    const bokmal = nb[key as keyof typeof nb];
    assert.ok(bokmal, key);
    assert.notEqual(bokmal, english, key);
    assert.deepEqual(placeholders(bokmal), placeholders(english), key);
  }
});
