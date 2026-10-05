import { test } from "node:test";
import assert from "node:assert/strict";
import {
  emptyCloset,
  type Category,
  type GarmentKind,
  type Occasion,
  type OutfitRequest,
  type Piece,
} from "../closet";
import type { Attributes } from "../attributes";
import { styleOutfits } from "../styling";
import { rulesScorer } from "./rulesScorer";
import { scoreContext } from "./taste";

function seed(
  id: string,
  category: Category,
  kind: GarmentKind,
  rgb: [number, number, number],
  attributes: Attributes = {},
): Piece {
  return {
    id,
    name: id,
    category,
    kind,
    styles: ["western"],
    photo: `${id}.png`,
    createdAt: "2026-09-01T08:00:00.000Z",
    source: "owned",
    colors: [{ rgb, share: 1 }],
    attributes,
  };
}

const closet = [
  seed("tunic", "tunic", "tunic", [230, 140, 170]),
  seed("trousers", "bottom", "trousers", [120, 120, 125]),
  seed("boots", "shoes", "boots", [20, 20, 20]),
  seed("hijab", "hijab", "hijab", [214, 198, 176]),
  seed("blazer", "layer", "blazer", [35, 45, 75], {
    sleeve: "long",
    fabric: "wool",
  }),
  seed("ankle-trousers", "bottom", "trousers", [235, 228, 215], {
    length: "ankle",
  }),
  seed("knee-skirt", "bottom", "skirt", [235, 228, 215], { length: "knee" }),
  seed("abaya", "dress", "abaya", [150, 130, 115], {
    sleeve: "long",
    length: "ankle",
  }),
  seed("blouse", "top", "blouse", [150, 170, 140], {
    sleeve: "long",
    length: "hip",
  }),
  seed("chiffon-hijab", "hijab", "hijab", [225, 185, 180], {
    fabric: "chiffon",
  }),
  seed("dress", "dress", "dress", [100, 110, 60]),
];

const top = (occasion: Occasion, pieces: Piece[] = closet) => {
  const request: OutfitRequest = {
    occasion,
    style: "western",
    garmentType: null,
    keptIds: [],
    excludedIds: [],
    weather: { source: "unknown" },
    hijab: "always",
    wardrobe: "owned",
  };
  const result = styleOutfits(
    pieces,
    request,
    "2026-10-05:owned",
    rulesScorer,
    scoreContext(emptyCloset),
  );
  return result.outfits[0]?.ids ?? result.partial?.ids ?? [];
};

test("work, everyday and party each lead with a different outfit from the same closet", () => {
  const everyday = top("everyday");
  const work = top("work");
  const party = top("party");
  assert.notDeepEqual(work, everyday);
  assert.notDeepEqual(party, work);
  assert.notDeepEqual(party, everyday);
});

test("work leads with the blazer", () => {
  assert.ok(top("work").includes("blazer"));
  assert.ok(!top("everyday").includes("blazer"));
});

test("party leads with the dress and the chiffon hijab", () => {
  const party = top("party");
  assert.ok(party.includes("dress"));
  assert.ok(party.includes("chiffon-hijab"));
});

test("gym never offers a chiffon hijab and prefers a jersey one", () => {
  const gym = [
    ...closet,
    seed("leggings", "bottom", "leggings", [20, 20, 20]),
    seed("sports-top", "top", "sports-top", [20, 20, 20]),
    seed("sneakers", "shoes", "sneakers", [240, 240, 240]),
    seed("jersey-hijab", "hijab", "hijab", [20, 20, 20], { fabric: "jersey" }),
  ];
  assert.ok(!top("gym").includes("chiffon-hijab"));
  assert.ok(top("gym", gym).includes("jersey-hijab"));
});
