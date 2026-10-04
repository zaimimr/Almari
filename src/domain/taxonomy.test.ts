import { test } from "node:test";
import { readFileSync } from "node:fs";
import assert from "node:assert/strict";
import {
  categories,
  categoryOf,
  fixedStyles,
  garmentKinds,
  isOffered,
  kindsIn,
  offeredKinds,
  retiredKinds,
  type GarmentKind,
} from "./taxonomy";

const table: Record<string, string[]> = {
  hijab: ["Hijab", "Instant hijab", "Underscarf", "Shawl"],
  top: ["Blouse", "Shirt", "T-shirt", "Sweater", "Top", "Sports top", "Hoodie"],
  tunic: ["Kurta", "Kurti", "Kameez", "Tunic"],
  bottom: [
    "Trousers",
    "Jeans",
    "Shorts",
    "Leggings",
    "Joggers",
    "Wide-leg",
    "Shalwar",
    "Churidar",
    "Sharara",
    "Gharara",
    "Lehenga",
    "Skirt",
  ],
  dress: ["Dress", "Anarkali", "Abaya", "Kaftan"],
  layer: ["Blazer", "Cardigan", "Jacket", "Coat", "Waistcoat"],
  shoes: [
    "Sneakers",
    "Flats",
    "Loafers",
    "Heels",
    "Sandals",
    "Khussa",
    "Boots",
  ],
  bag: ["Handbag", "Tote", "Crossbody", "Clutch", "Backpack"],
  accessory: ["Dupatta", "Jewellery", "Belt"],
};

test("the taxonomy offers 9 categories and 51 subcategories in the agreed order", () => {
  assert.deepEqual(
    categories.map((category) => category.label),
    [
      "Hijabs & scarves",
      "Tops",
      "Kurtas & tunics",
      "Trousers & skirts",
      "Dresses & abayas",
      "Layers",
      "Shoes",
      "Bags",
      "Accessories",
    ],
  );
  assert.equal(offeredKinds.length, 51);
  for (const category of categories)
    assert.deepEqual(
      kindsIn(category.id).map((kind) => kind.label),
      table[category.id],
    );
});

test("every subcategory id stored before version 3 keeps its category", () => {
  const before: [GarmentKind, string][] = [
    ["hijab", "hijab"],
    ["top", "top"],
    ["tunic", "tunic"],
    ["kurta", "tunic"],
    ["kameez", "tunic"],
    ["trousers", "bottom"],
    ["shalwar", "bottom"],
    ["skirt", "bottom"],
    ["dress", "dress"],
    ["abaya", "dress"],
    ["blazer", "layer"],
    ["cardigan", "layer"],
    ["jacket", "layer"],
    ["coat", "layer"],
    ["shoes", "shoes"],
    ["boots", "shoes"],
    ["bag", "bag"],
    ["dupatta", "accessory"],
  ];
  for (const [id, category] of before) assert.equal(categoryOf(id), category);
  assert.equal(garmentKinds.length, 53);
  assert.equal(new Set(garmentKinds.map((kind) => kind.id)).size, 53);
  assert.deepEqual(retiredKinds, ["shoes", "bag"]);
  assert.equal(isOffered("shoes"), false);
  assert.equal(isOffered("bag"), false);
  assert.equal(isOffered("loafers"), true);
  assert.equal(
    kindsIn("shoes").some((kind) => kind.id === "shoes"),
    false,
  );
  assert.equal(
    kindsIn("bag").some((kind) => kind.id === "bag"),
    false,
  );
});

test("fixed styles follow the agreed table", () => {
  const desi = [
    "kurta",
    "kurti",
    "kameez",
    "shalwar",
    "churidar",
    "sharara",
    "gharara",
    "lehenga",
    "anarkali",
    "khussa",
    "dupatta",
  ];
  const both = [
    "hijab",
    "instant-hijab",
    "underscarf",
    "shawl",
    "coat",
    "cardigan",
    "handbag",
    "tote",
    "crossbody",
    "clutch",
    "backpack",
    "jewellery",
    "belt",
    "sneakers",
    "flats",
    "heels",
    "boots",
    "sports-top",
    "hoodie",
    "leggings",
    "joggers",
  ];
  let decided = 0;
  for (const kind of offeredKinds) {
    const expected = desi.includes(kind.id)
      ? ["desi"]
      : both.includes(kind.id)
        ? ["western", "desi"]
        : undefined;
    if (!expected) decided++;
    assert.deepEqual(fixedStyles(kind.id), expected, kind.id);
  }
  assert.equal(decided, 19);
});

test("the bundled label file describes every offered subcategory but the gym kinds, and both styles", () => {
  const file = JSON.parse(
    readFileSync(
      "modules/closet-vision/ios/Resources/garment-labels.json",
      "utf8",
    ),
  ) as {
    version: number;
    labels: { group: string; value: string; embeddings: number[][] }[];
  };
  const values = (group: string) =>
    file.labels
      .filter((label) => label.group === group)
      .map((label) => label.value);
  assert.equal(file.version, 2);
  assert.deepEqual(
    values("kind"),
    offeredKinds
      .map((kind) => kind.id)
      .filter(
        (id) => !["sports-top", "hoodie", "leggings", "joggers"].includes(id),
      ),
  );
  assert.deepEqual(values("style"), ["desi", "western"]);
  assert.equal(
    file.labels.every(
      (label) =>
        label.embeddings.length > 0 &&
        label.embeddings.every((row) => row.length === 768),
    ),
    true,
  );
});
