import { test } from "node:test";
import assert from "node:assert/strict";
import {
  emptyTaste,
  neutralProfile,
  type Category,
  type GarmentKind,
  type OutfitRequest,
  type Piece,
  type StyleProfile,
} from "../closet";
import type { Attributes } from "../attributes";
import { ruleBook } from "./rulebook";
import { styleOutfits } from "../styling";
import { reasonFor, ruleHits } from "./rules";
import { rulesScorer } from "./rulesScorer";

const request = (changes: Partial<OutfitRequest> = {}): OutfitRequest => ({
  occasion: "everyday",
  style: "western",
  garmentType: null,
  keptIds: [],
  excludedIds: [],
  weather: { source: "unknown" },
  hijab: "always",
  wardrobe: "owned",
  ...changes,
});

function make(
  id: string,
  category: Category,
  kind: GarmentKind,
  attributes: Attributes = {},
  rgb: [number, number, number] | null = null,
  extra: Partial<Piece> = {},
): Piece {
  return {
    id,
    name: id.charAt(0).toUpperCase() + id.slice(1),
    category,
    kind,
    photo: `${id}.jpg`,
    createdAt: "2026-10-01T00:00:00Z",
    source: "owned",
    attributes,
    ...(rgb ? { colors: [{ rgb, share: 1 }] } : {}),
    ...extra,
  };
}

const hitIds = (
  pieces: Piece[],
  changes: Partial<OutfitRequest> = {},
  profile: StyleProfile = neutralProfile,
) =>
  ruleHits(ruleBook, pieces, request(changes), profile).map(
    (hit) => hit.rule.id,
  );

test("a solid hijab with a printed top fires the hijab rule with a true reason", () => {
  const top = make("floral blouse", "top", "blouse", { pattern: "print" });
  const hijab = make("plain hijab", "hijab", "hijab", { pattern: "solid" });
  const hits = ruleHits(ruleBook, [top, hijab], request(), neutralProfile);
  const hit = hits.find((item) => item.rule.id === "hijab-solid-with-print")!;
  assert.ok(hit);
  assert.equal(
    reasonFor(hit, request()),
    "A solid plain hijab keeps the floral blouse the focus.",
  );
});

test("Desi length pairing rewards a short top with a gharara and penalises a long one", () => {
  const gharara = make("gharara", "bottom", "gharara");
  const short = make("short kurti", "tunic", "kurti", { length: "hip" });
  const long = make("long kameez", "tunic", "kameez", { length: "knee" });
  assert.ok(
    hitIds([short, gharara], { style: "desi" }).includes("gharara-short-top"),
  );
  assert.ok(
    hitIds([long, gharara], { style: "desi" }).includes("gharara-long-top"),
  );
  assert.ok(!hitIds([short, gharara]).includes("gharara-long-top"));
});

test("volume on both halves is penalised and unknown volume is never judged", () => {
  const wide = make("wide trousers", "bottom", "wide-leg", {
    volume: "voluminous",
  });
  const flowing = make("flowing top", "top", "top", { volume: "voluminous" });
  const unknown = make("plain top", "top", "top");
  assert.ok(hitIds([flowing, wide]).includes("volume-both-halves"));
  assert.ok(!hitIds([unknown, wide]).includes("volume-both-halves"));
  assert.ok(!hitIds([unknown, wide]).includes("volume-balanced"));
});

test("the dressed-up check starts at dinner and not before", () => {
  const lawn = make("lawn kameez", "tunic", "kameez", {
    fabric: "lawn",
    embellishment: "none",
    formality: 1,
  });
  const shalwar = make("shalwar", "bottom", "shalwar", { formality: 1 });
  assert.ok(
    hitIds([lawn, shalwar], { occasion: "dinner", style: "desi" }).includes(
      "not-dressed-up",
    ),
  );
  assert.ok(
    !hitIds([lawn, shalwar], { occasion: "everyday", style: "desi" }).includes(
      "not-dressed-up",
    ),
  );
  assert.ok(
    hitIds([lawn, shalwar], { occasion: "barat", style: "desi" }).includes(
      "too-casual-for-occasion",
    ),
  );
});

test("two nearly matching blacks are a near miss and tonal steps need visible lightness", () => {
  const top = make("black top", "top", "top", {}, [25, 25, 27]);
  const trousers = make(
    "black trousers",
    "bottom",
    "trousers",
    {},
    [45, 42, 48],
  );
  assert.ok(hitIds([top, trousers]).includes("top-bottom-near-miss"));
  const deep = make("berry top", "top", "top", {}, [150, 60, 70]);
  const light = make(
    "rose trousers",
    "bottom",
    "trousers",
    {},
    [220, 150, 160],
  );
  assert.ok(hitIds([deep, light]).includes("tonal-steps"));
  const same = make("berry trousers", "bottom", "trousers", {}, [150, 60, 70]);
  assert.ok(!hitIds([deep, same]).includes("tonal-steps"));
});

test("an accent hijab that repeats a colour of the main piece is an echo", () => {
  const kurta = make(
    "printed kurta",
    "tunic",
    "kurta",
    { pattern: "print" },
    null,
    {
      colors: [
        { rgb: [160, 170, 145], share: 0.6 },
        { rgb: [150, 60, 70], share: 0.4 },
      ],
    },
  );
  const hijab = make(
    "berry hijab",
    "hijab",
    "hijab",
    { pattern: "solid" },
    [150, 60, 70],
  );
  const ids = hitIds([kurta, hijab]);
  assert.ok(ids.includes("accent-echo"));
  assert.ok(ids.includes("hijab-from-print"));
});

test("proposed attributes still score but never produce a reason", () => {
  const top = make(
    "floral blouse",
    "top",
    "blouse",
    { pattern: "print" },
    null,
    {
      sources: { pattern: "proposed" },
    },
  );
  const hijab = make("plain hijab", "hijab", "hijab", { pattern: "solid" });
  const hit = ruleHits(ruleBook, [top, hijab], request(), neutralProfile).find(
    (item) => item.rule.id === "hijab-solid-with-print",
  )!;
  assert.equal(hit.certain, false);
});

test("style settings switch rules on and off without touching other rules", () => {
  const print = make("printed blouse", "top", "blouse", { pattern: "print" });
  const printedHijab = make("printed hijab", "hijab", "hijab", {
    pattern: "print",
  });
  assert.ok(hitIds([print, printedHijab]).includes("print-hijab-print-outfit"));
  assert.ok(
    !hitIds(
      [print, printedHijab],
      {},
      { ...neutralProfile, printOnPrint: true },
    ).includes("print-hijab-print-outfit"),
  );
  const abaya = make("long abaya", "dress", "abaya", { length: "ankle" });
  const belt = make("belt", "accessory", "belt");
  assert.deepEqual(
    hitIds([abaya, belt]).filter((id) => id.includes("belt")),
    [],
  );
  assert.ok(
    hitIds(
      [abaya, belt],
      {},
      { ...neutralProfile, beltOverOuter: false },
    ).includes("no-belt-over-long-piece"),
  );
  const skirt = make("skirt", "bottom", "skirt");
  assert.ok(
    hitIds([skirt], {}, { ...neutralProfile, bottoms: "trousers" }).includes(
      "prefers-trousers",
    ),
  );
  const white = make("white dress", "dress", "dress", {}, [250, 250, 250]);
  assert.ok(
    hitIds(
      [white],
      { occasion: "wedding" },
      {
        ...neutralProfile,
        avoidAtWeddings: ["white"],
      },
    ).includes("avoid-white-at-weddings"),
  );
  assert.ok(
    !hitIds([white], { occasion: "wedding" }).includes(
      "avoid-white-at-weddings",
    ),
  );
});

test("a formal set split across outfits is penalised and a set worn together is praised", () => {
  const shirt = make("silk kameez", "tunic", "kameez", { formality: 5 }, null, {
    setId: "set-1",
  });
  const trousers = make(
    "silk trousers",
    "bottom",
    "trousers",
    { formality: 5 },
    null,
    { setId: "set-1" },
  );
  const other = make("plain trousers", "bottom", "trousers", { formality: 2 });
  assert.ok(
    hitIds([shirt, trousers], { occasion: "wedding", style: "desi" }).includes(
      "set-together",
    ),
  );
  assert.ok(
    hitIds([shirt, other], { occasion: "wedding", style: "desi" }).includes(
      "formal-set-split",
    ),
  );
});

test("a bridal piece is read as heavy by the rules", () => {
  const hijab = make("beaded hijab", "hijab", "hijab", {
    embellishment: "heavy",
  });
  const bridal = make("bridal kameez", "tunic", "kameez", {
    embellishment: "bridal",
  });
  assert.ok(hitIds([bridal, hijab]).includes("statement-hijab-busy-main"));
});

const gymCloset = [
  make("leggings", "bottom", "leggings"),
  make("jeans", "bottom", "jeans"),
  make("sports top", "top", "sports-top"),
  make("blouse", "top", "blouse"),
  make("dress", "dress", "dress"),
  make("abaya", "dress", "abaya"),
  make("sneakers", "shoes", "sneakers"),
  make("heels", "shoes", "heels"),
  make("loafers", "shoes", "loafers"),
  make("instant hijab", "hijab", "instant-hijab"),
  make("silk hijab", "hijab", "hijab"),
  make("blazer", "layer", "blazer"),
  make("tote", "bag", "tote"),
];
const gymContext = { profile: neutralProfile, taste: emptyTaste, wear: {} };

test("Trening picks sneakers, never a dress, heels, a blazer or a bag", () => {
  const result = styleOutfits(
    gymCloset,
    request({ occasion: "gym" }),
    "seed",
    rulesScorer,
    gymContext,
  );
  assert.ok(result.outfits.length);
  for (const outfit of result.outfits) {
    assert.ok(outfit.ids.includes("sneakers"));
    for (const id of ["dress", "abaya", "heels", "loafers", "blazer", "tote"])
      assert.ok(!outfit.ids.includes(id));
  }
  assert.ok(result.outfits[0]!.ids.includes("leggings"));
  assert.ok(result.outfits[0]!.ids.includes("sports top"));
  assert.ok(result.outfits[0]!.ids.includes("instant hijab"));
});

test("Trening never pairs jeans or a blouse with gym pieces", () => {
  const result = styleOutfits(
    gymCloset,
    request({ occasion: "gym" }),
    "seed",
    rulesScorer,
    gymContext,
  );
  for (const outfit of result.outfits)
    for (const id of ["jeans", "blouse"]) assert.ok(!outfit.ids.includes(id));
});

test("Trening with only a sports top asks for gym bottoms and shows the rest", () => {
  const result = styleOutfits(
    gymCloset.filter((piece) => piece.kind !== "leggings"),
    request({ occasion: "gym" }),
    "seed",
    rulesScorer,
    gymContext,
  );
  assert.equal(result.status, "missing");
  assert.deepEqual(
    result.problems.map((problem) => problem.message),
    ["Add leggings or joggers to complete an outfit."],
  );
  assert.deepEqual(result.partial?.missing, ["bottom"]);
  assert.ok(result.partial?.ids.includes("sports top"));
  assert.ok(result.partial?.ids.includes("sneakers"));
});

test("Trening without any gym clothes says so instead of styling", () => {
  const result = styleOutfits(
    gymCloset.filter(
      (piece) => piece.kind !== "leggings" && piece.kind !== "sports-top",
    ),
    request({ occasion: "gym" }),
    "seed",
    rulesScorer,
    gymContext,
  );
  assert.equal(result.status, "missing");
  assert.equal(result.outfits.length, 0);
  assert.equal(
    result.problems[0]!.message,
    "Add gym clothes to complete an outfit.",
  );
});
