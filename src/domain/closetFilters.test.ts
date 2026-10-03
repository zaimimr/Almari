import { test } from "node:test";
import assert from "node:assert/strict";
import { emptyCloset, setAway, type Piece } from "./closet";
import { addSampleWardrobe } from "./samples";
import {
  closetChips,
  filterPieces,
  groupByCategory,
  lastWorn,
  noFilter,
  panelFilterCount,
  type ClosetFilter,
} from "./closetFilters";
import { ownedCloset, piece } from "./test-helpers";
import { setLanguage } from "../i18n";

const shaped = (id: string, changes: Partial<Piece>): Piece => ({
  id,
  name: id,
  category: "top",
  photo: `${id}.jpg`,
  createdAt: "2026-10-01T08:00:00Z",
  source: "owned",
  ...changes,
});

const blazer = shaped("blazer", {
  category: "layer",
  kind: "blazer",
  styles: ["western"],
  traits: { occasions: ["work"] },
});
const hijab = shaped("hijab", {
  category: "hijab",
  kind: "hijab",
  styles: ["western", "desi"],
  traits: { occasions: ["work", "party"] },
});
const kurta = shaped("kurta", { category: "tunic", kind: "kurta" });
const shoes = shaped("shoes", { category: "shoes" });
const pieces = [blazer, hijab, kurta, shoes];

const noWear = { lastWorn: {}, today: "2026-10-02" };

const ids = (filter: Partial<ClosetFilter>, list = pieces) =>
  filterPieces(list, { ...noFilter, ...filter }, noWear).map((item) => item.id);

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
  assert.deepEqual(filterPieces(pieces, noFilter, noWear), pieces);
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
  assert.deepEqual(ids({ occasion: "party", style: "western" }), ["hijab"]);
  assert.deepEqual(ids({ category: "tunic", occasion: "work" }), ["kurta"]);
  assert.deepEqual(ids({ category: "shoes", style: "western" }), []);
});

test("pieces without a status count as available, away and put away pieces only show under their own filter", () => {
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
  assert.deepEqual(ids({ availability: "archived" }, all), ["archived"]);
  assert.deepEqual(ids({}, all), ["blazer", "hijab", "kurta", "shoes", "away"]);
});

test("a piece marked unavailable shows only under Unavailable", () => {
  const closet = setAway(
    addSampleWardrobe(emptyCloset),
    "sample-mauve-hijab",
    "wash",
  );
  const shown = (availability: "available" | "away" | null) =>
    filterPieces(closet.pieces, { ...noFilter, availability }, noWear).map(
      (piece) => piece.id,
    );
  assert.deepEqual(shown("away"), ["sample-mauve-hijab"]);
  assert.equal(shown("available").length, closet.pieces.length - 1);
  assert.equal(shown("available").includes("sample-mauve-hijab"), false);
  assert.equal(shown(null).length, closet.pieces.length);
  assert.deepEqual(
    filterPieces(
      setAway(closet, "sample-mauve-hijab", null).pieces,
      { ...noFilter, availability: "away" },
      noWear,
    ),
    [],
  );
});

const wore = (id: string, pieceIds: string[], at: string, scope?: "piece") => ({
  id,
  at,
  kind: "wore" as const,
  pieceIds,
  request: {
    occasion: "everyday" as const,
    style: "western" as const,
    garmentType: null,
    keptIds: [],
    excludedIds: [],
    weather: { source: "unknown" as const },
    hijab: null,
    wardrobe: "owned" as const,
  },
  engine: "rules" as const,
  ...(scope ? { scope } : {}),
});

test("wear filters read the last wear per piece, piece wears included", () => {
  const closet = {
    ...ownedCloset([piece("a", "top"), piece("b", "top"), piece("c", "top")]),
    feedback: [
      wore("e1", ["a"], "2026-09-30T08:00:00Z"),
      wore("e2", ["b"], "2026-08-01T08:00:00Z", "piece"),
      { ...wore("e3", ["b"], "2026-09-29T08:00:00Z"), undone: true },
    ],
  };
  const last = lastWorn(closet);
  assert.equal(last.a, "2026-09-30T08:00:00Z");
  assert.equal(last.b, "2026-08-01T08:00:00Z");
  const context = { lastWorn: last, today: "2026-10-02" };
  assert.deepEqual(
    filterPieces(
      closet.pieces,
      { ...noFilter, wear: "never-worn" },
      context,
    ).map((p) => p.id),
    ["c"],
  );
  assert.deepEqual(
    filterPieces(
      closet.pieces,
      { ...noFilter, wear: "not-worn-lately" },
      context,
    ).map((p) => p.id),
    ["c", "b"],
  );
});

test("search matches the colour name and coverage filters use piece coverage", () => {
  const pink = piece("h", "hijab", {
    name: "Chiffon hijab",
    colors: [{ rgb: [226, 177, 168], share: 1 }],
  });
  const blouse = piece("bl", "top", {
    attributes: { sleeve: "long", length: "hip", sheer: false },
    sources: { sleeve: "confirmed", length: "confirmed" },
  });
  const dress = piece("d", "dress");
  const context = { lastWorn: {}, today: "2026-10-02" };
  const list = [pink, blouse, dress];
  const shown = (filter: Partial<ClosetFilter>) =>
    filterPieces(list, { ...noFilter, ...filter }, context).map((p) => p.id);
  assert.deepEqual(shown({ search: "blush" }), ["h"]);
  assert.deepEqual(shown({ search: "CHIFFON" }), ["h"]);
  assert.deepEqual(shown({ colour: "Blush" }), ["h"]);
  setLanguage("nb");
  assert.deepEqual(shown({ search: "pudderrosa" }), ["h"]);
  setLanguage("en");
  assert.deepEqual(shown({ coverage: "full" }), ["bl"]);
  assert.deepEqual(shown({ coverage: "needs-details" }), ["d"]);
});

test("sections follow taxonomy order with hijabs by hue and the rest newest first", () => {
  const sections = groupByCategory([
    piece("t-old", "top", { createdAt: "2026-09-01T00:00:00Z" }),
    piece("t-new", "top", { createdAt: "2026-09-20T00:00:00Z" }),
    piece("h-blue", "hijab", { colors: [{ rgb: [60, 80, 160], share: 1 }] }),
    piece("h-pink", "hijab", { colors: [{ rgb: [226, 177, 168], share: 1 }] }),
    piece("h-red", "hijab", { colors: [{ rgb: [180, 40, 40], share: 1 }] }),
    piece("s", "shoes", { source: "sample" }),
  ]);
  assert.deepEqual(
    sections.map((s) => s.id),
    ["hijab", "top", "samples"],
  );
  assert.deepEqual(
    sections[1]!.pieces.map((p) => p.id),
    ["t-new", "t-old"],
  );
  const hues = sections[0]!.pieces.map((p) => p.id);
  assert.notEqual(hues.indexOf("h-blue"), 1);
});

test("the panel count leaves out category and search", () => {
  assert.equal(panelFilterCount(noFilter), 0);
  assert.equal(
    panelFilterCount({
      ...noFilter,
      category: "top",
      search: "blue",
      wear: "never-worn",
      season: "winter",
      availability: "archived",
    }),
    3,
  );
});
