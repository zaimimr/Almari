import { test } from "node:test";
import assert from "node:assert/strict";
import type { Piece } from "./closet";
import {
  closetChips,
  filterPieces,
  noFilter,
  type ClosetFilter,
} from "./closetFilters";

const piece = (id: string, changes: Partial<Piece>): Piece => ({
  id,
  name: id,
  category: "top",
  photo: `${id}.jpg`,
  createdAt: "2026-10-01T08:00:00Z",
  source: "owned",
  ...changes,
});

const blazer = piece("blazer", {
  category: "layer",
  kind: "blazer",
  styles: ["western"],
  traits: { occasions: ["work"] },
});
const hijab = piece("hijab", {
  category: "hijab",
  kind: "hijab",
  styles: ["western", "desi"],
  traits: { occasions: ["work", "celebration"] },
});
const kurta = piece("kurta", { category: "tunic", kind: "kurta" });
const shoes = piece("shoes", { category: "shoes" });
const pieces = [blazer, hijab, kurta, shoes];

const ids = (filter: Partial<ClosetFilter>, list = pieces) =>
  filterPieces(list, { ...noFilter, ...filter }).map((item) => item.id);

test("chips show All, then every category with Hijabs & scarves first, even when empty", () => {
  const expected = [
    "all",
    "hijab",
    "top",
    "tunic",
    "bottom",
    "dress",
    "layer",
    "shoes",
    "bag",
    "accessory",
  ];
  assert.deepEqual(closetChips(pieces), expected);
  assert.deepEqual(closetChips([]), expected);
});

test("no filter shows every piece in closet order", () => {
  assert.deepEqual(filterPieces(pieces, noFilter), pieces);
});

test("category, style and occasion filters combine", () => {
  assert.deepEqual(ids({ category: "layer" }), ["blazer"]);
  assert.deepEqual(ids({ style: "desi" }), ["hijab", "kurta"]);
  assert.deepEqual(ids({ style: "western" }), ["blazer", "hijab"]);
  assert.deepEqual(ids({ occasion: "work" }), [
    "blazer",
    "hijab",
    "kurta",
    "shoes",
  ]);
  assert.deepEqual(ids({ occasion: "everyday" }), ["kurta", "shoes"]);
  assert.deepEqual(ids({ occasion: "celebration", style: "western" }), [
    "hijab",
  ]);
  assert.deepEqual(ids({ category: "tunic", occasion: "work" }), ["kurta"]);
  assert.deepEqual(ids({ category: "shoes", style: "western" }), []);
});

test("pieces without a status count as available and away pieces only show under Unavailable", () => {
  const away = { ...blazer, id: "away", status: "away" as const };
  const archived = { ...hijab, id: "archived", status: "archived" as const };
  const all = [...pieces, away, archived];
  assert.deepEqual(ids({ availability: "available" }, all), [
    "blazer",
    "hijab",
    "kurta",
    "shoes",
  ]);
  assert.deepEqual(ids({ availability: "away" }, all), ["away"]);
  assert.deepEqual(ids({ availability: "away" }), []);
  assert.deepEqual(ids({}, all), [
    "blazer",
    "hijab",
    "kurta",
    "shoes",
    "away",
    "archived",
  ]);
});
