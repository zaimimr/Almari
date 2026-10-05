import { test } from "node:test";
import assert from "node:assert/strict";
import { decodeCloset, emptyCloset, setAway } from "./closet";
import {
  filterPieces,
  groupByCategory,
  lastWorn,
  noFilter,
} from "./closetFilters";
import { woreLately } from "./feedback";
import { closetBreakdown } from "./profileStats";
import { wearCounts } from "./scoring/taste";
import { ownedCloset, piece } from "./test-helpers";
import { clockFor } from "./today";
import {
  costPerWear,
  inWash,
  intoWash,
  laundryDone,
  laundryLoad,
  setCategory,
  setSeason,
} from "./wardrobe";
import { wearSeason } from "./facts";
import { setLanguage } from "../i18n";

const at = (iso: string) => clockFor(new Date(iso));

test("marking worn works without a Today outfit and counts once per day", () => {
  const closet = ownedCloset([piece("a", "top"), piece("b", "bottom")]);
  assert.equal(closet.styling.today, null);
  const once = woreLately(
    closet,
    ["a"],
    "2026-10-01T12:00:00Z",
    (id) => `w1-${id}`,
  );
  assert.deepEqual(wearCounts(once.feedback), { a: 1 });
  const twice = woreLately(
    once,
    ["a", "b"],
    "2026-10-01T13:00:00Z",
    (id) => `w2-${id}`,
  );
  assert.deepEqual(wearCounts(twice.feedback), { a: 1, b: 1 });
  assert.equal(
    woreLately(twice, ["a", "b"], "2026-10-01T14:00:00Z", (id) => id),
    twice,
  );
  const later = woreLately(
    twice,
    ["a"],
    "2026-10-03T12:00:00Z",
    (id) => `w3-${id}`,
  );
  assert.deepEqual(wearCounts(later.feedback), { a: 2, b: 1 });
});

test("sorts order pieces by wear or newest within each category", () => {
  const old = piece("old", "top", { createdAt: "2026-01-01T08:00:00Z" });
  const fresh = piece("fresh", "top", { createdAt: "2026-09-01T08:00:00Z" });
  const ids = (sort: Parameters<typeof groupByCategory>[1]) =>
    groupByCategory([old, fresh], sort, { old: 3 })[0]!.pieces.map(
      (item) => item.id,
    );
  assert.deepEqual(ids("newest"), ["fresh", "old"]);
  assert.deepEqual(ids("most-worn"), ["old", "fresh"]);
  assert.deepEqual(ids("least-worn"), ["fresh", "old"]);
});

test("forgotten pieces are owned, older than 60 days and not worn in 60 days", () => {
  const today = "2026-10-05";
  const pieces = [
    piece("new", "top", { createdAt: "2026-09-20T08:00:00Z" }),
    piece("never", "top", { createdAt: "2026-06-01T08:00:00Z" }),
    piece("recent", "top", { createdAt: "2026-06-01T08:00:00Z" }),
    piece("long", "top", { createdAt: "2026-06-01T08:00:00Z" }),
  ];
  const context = {
    today,
    lastWorn: { recent: "2026-09-30T08:00:00Z", long: "2026-07-01T08:00:00Z" },
  };
  assert.deepEqual(
    filterPieces(pieces, { ...noFilter, wear: "forgotten" }, context).map(
      (item) => item.id,
    ),
    ["never", "long"],
  );
});

test("search matches kind and category names in English and Norwegian", () => {
  setLanguage("en");
  const kurta = piece("k", "tunic", { name: "Green one", kind: "kurta" });
  const shoes = piece("s", "shoes", { name: "Party pair" });
  const found = (search: string) =>
    filterPieces([kurta, shoes], { ...noFilter, search }).map(
      (item) => item.id,
    );
  assert.deepEqual(found("kurta"), ["k"]);
  assert.deepEqual(found("sko"), ["s"]);
  assert.deepEqual(found("shoes"), ["s"]);
});

test("laundry sends what was worn today to the wash and brings it back", () => {
  const closet = woreLately(
    ownedCloset([piece("a", "top"), piece("b", "bottom"), piece("c", "shoes")]),
    ["a", "b"],
    "2026-10-05T10:00:00Z",
    (id) => `w-${id}`,
  );
  const day = at("2026-10-05T10:00:00Z").localDate;
  const load = laundryLoad(closet, day).map((item) => item.id);
  assert.deepEqual(load.sort(), ["a", "b"]);
  const washing = intoWash(closet, load);
  assert.deepEqual(
    inWash(washing)
      .map((item) => item.id)
      .sort(),
    ["a", "b"],
  );
  assert.deepEqual(laundryLoad(washing, day), []);
  const lent = setAway(washing, "c", "lent");
  const done = laundryDone(
    lent,
    inWash(lent).map((item) => item.id),
  );
  assert.deepEqual(inWash(done), []);
  assert.equal(done.pieces.find((item) => item.id === "c")?.away, "lent");
});

test("cost per wear divides the price by wears and survives a save", () => {
  const priced = piece("a", "top", { price: { amount: 600, currency: "NOK" } });
  assert.equal(costPerWear(priced, 0), 600);
  assert.equal(costPerWear(priced, 4), 150);
  assert.equal(costPerWear(piece("b", "top"), 4), null);
  const reopened = decodeCloset(JSON.stringify(ownedCloset([priced])));
  assert.deepEqual(reopened.pieces[0]?.price, { amount: 600, currency: "NOK" });
  const broken = { ...priced, price: { amount: -1, currency: "NOK" } };
  assert.throws(() =>
    decodeCloset(JSON.stringify({ ...emptyCloset, pieces: [broken] })),
  );
});

test("the closet breakdown counts colours, categories, wear and this month", () => {
  const closet = woreLately(
    ownedCloset([
      piece("a", "top", { colors: [{ rgb: [20, 20, 20], share: 1 }] }),
      piece("b", "top", { colors: [{ rgb: [20, 20, 20], share: 1 }] }),
      piece("c", "shoes"),
      piece("d", "bag", { status: "archived" }),
    ]),
    ["a"],
    "2026-10-02T10:00:00Z",
    (id) => `w-${id}`,
  );
  const stats = closetBreakdown(closet, at("2026-10-05T10:00:00Z"));
  assert.equal(stats.pieces, 3);
  assert.equal(stats.colours.length, 1);
  assert.equal(stats.colours[0]!.count, 2);
  assert.deepEqual(stats.categories, [
    { id: "top", count: 2 },
    { id: "shoes", count: 1 },
  ]);
  assert.equal(stats.mostWorn[0]!.piece.id, "a");
  assert.equal(stats.leastWorn[0]!.count, 0);
  assert.equal(stats.wearsThisMonth, 1);
  assert.deepEqual(Object.keys(lastWorn(closet)), ["a"]);
});

test("multi-edit sets season and category for many pieces at once", () => {
  const closet = ownedCloset([
    piece("a", "top", { kind: "blouse" }),
    piece("b", "top", { kind: "t-shirt" }),
    piece("c", "shoes"),
  ]);
  const summer = setSeason(closet, ["a", "b"], "summer");
  assert.deepEqual(
    Object.fromEntries(
      summer.pieces.map((item) => [item.id, wearSeason(item)?.season ?? null]),
    ),
    { a: "summer", b: "summer", c: null },
  );
  const moved = setCategory(summer, ["a", "c"], "tunic");
  const a = moved.pieces.find((item) => item.id === "a")!;
  assert.equal(a.category, "tunic");
  assert.equal(a.kind, undefined);
  assert.equal(a.traits?.warmth, undefined);
  assert.equal(setCategory(moved, ["a"], "tunic"), moved);
});
