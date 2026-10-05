import { test } from "node:test";
import assert from "node:assert/strict";
import {
  emptyCloset,
  neutralProfile,
  savePiece,
  setAway,
  type OutfitRequest,
  type Piece,
} from "../closet";
import { addSampleWardrobe } from "../samples";
import {
  evaluateOutfit,
  replacementsFor,
  roleOf,
  styleOutfits,
} from "../styling";
import { rulesScorer } from "./rulesScorer";
import { scoreContext } from "./taste";

const samples = addSampleWardrobe(emptyCloset);
const context = scoreContext(emptyCloset);
const request = (changes: Partial<OutfitRequest> = {}): OutfitRequest => ({
  occasion: "work",
  style: "western",
  garmentType: null,
  keptIds: [],
  excludedIds: [],
  weather: { source: "unknown" },
  hijab: "always",
  wardrobe: "sample",
  ...changes,
});

test("the sample closet on a fixed day gives a fixed top three with fixed reasons", () => {
  const result = styleOutfits(
    samples.pieces,
    request(),
    "2026-10-01:sample",
    rulesScorer,
    context,
  );
  assert.equal(result.status, "ready");
  assert.deepEqual(
    result.outfits.slice(0, 3).map((outfit) => outfit.ids),
    [
      [
        "sample-ivory-tunic",
        "sample-ivory-trousers",
        "sample-chocolate-hijab",
        "sample-taupe-abaya",
        "sample-chocolate-loafers",
        "sample-taupe-bag",
      ],
      [
        "sample-olive-maxi-dress",
        "sample-ivory-hijab",
        "sample-navy-blazer",
        "sample-chocolate-loafers",
        "sample-taupe-bag",
      ],
      [
        "sample-ivory-tunic",
        "sample-charcoal-trousers",
        "sample-chocolate-hijab",
        "sample-taupe-abaya",
        "sample-chocolate-loafers",
        "sample-taupe-bag",
      ],
    ],
  );
  assert.deepEqual(result.outfits[0]!.reasons, [
    "The chocolate jersey hijab frames your face against the ivory longline tunic.",
    "The chocolate jersey hijab ties in with the chocolate leather loafers.",
  ]);
  assert.deepEqual(result.outfits[1]!.reasons.slice(0, 1), [
    "The ivory modal hijab frames your face against the olive maxi dress.",
  ]);
});

test("a Desi party from the samples is explained by colour and pairing rules", () => {
  const result = styleOutfits(
    samples.pieces,
    request({ occasion: "party", style: "desi" }),
    "2026-10-01:sample",
    rulesScorer,
    context,
  );
  assert.deepEqual(result.outfits[0]!.ids, [
    "sample-sage-kurta",
    "sample-ivory-salwar",
    "sample-ivory-hijab",
    "sample-chocolate-loafers",
  ]);
  assert.deepEqual(result.outfits[0]!.reasons, [
    "The ivory modal hijab picks up a colour from the sage embroidered kurta.",
    "The ivory modal hijab ties in with the ivory cotton shalwar.",
  ]);
});

const owned = (piece: Partial<Piece> & Pick<Piece, "id" | "category">) =>
  ({
    name: piece.id,
    photo: `${piece.id}.jpg`,
    createdAt: "2026-10-01T00:00:00Z",
    source: "owned",
    ...piece,
  }) as Piece;

test("a closet with one hijab and one tunic explains what is missing instead of failing", () => {
  const closet = [
    owned({ id: "my-hijab", category: "hijab", kind: "hijab" }),
    owned({
      id: "my-tunic",
      category: "tunic",
      kind: "tunic",
      styles: ["western"],
    }),
  ].reduce(savePiece, emptyCloset);
  const result = styleOutfits(
    closet.pieces,
    request({ wardrobe: "owned" }),
    "2026-10-01:owned",
    rulesScorer,
    context,
  );
  assert.equal(result.status, "missing");
  assert.deepEqual(
    result.problems.map((problem) => problem.message),
    ["Add shoes and trousers or a skirt to complete an outfit."],
  );
  assert.deepEqual(result.partial, {
    ids: ["my-tunic", "my-hijab"],
    missing: ["bottom", "shoes"],
  });
});

test("style settings never let an outfit past the hard constraints", () => {
  const profile = {
    ...neutralProfile,
    bottoms: "skirts" as const,
    printOnPrint: true,
    minTopLength: "ankle" as const,
    region: "gulf" as const,
  };
  const pool = samples.pieces.filter((piece) => piece.source === "sample");
  const result = styleOutfits(
    samples.pieces,
    request({ keptIds: ["sample-mauve-hijab"] }),
    "2026-10-01:sample",
    rulesScorer,
    { ...context, profile },
  );
  assert.equal(result.status, "ready");
  for (const outfit of result.outfits) {
    const pieces = outfit.ids.map((id) =>
      pool.find((piece) => piece.id === id)!,
    );
    assert.ok(outfit.ids.includes("sample-mauve-hijab"));
    assert.deepEqual(
      evaluateOutfit(pieces, request(), pool).filter(
        (problem) => problem.severity !== "review",
      ),
      [],
    );
  }
});

test("scoring is deterministic for the same closet, request and seed", () => {
  const run = () =>
    styleOutfits(samples.pieces, request(), "seed", rulesScorer, context);
  assert.deepEqual(run(), run());
});

test("a hijab marked away is never suggested or offered as a replacement", () => {
  const away = setAway(samples, "sample-chocolate-hijab", "wash");
  const result = styleOutfits(
    away.pieces,
    request(),
    "2026-10-01:sample",
    rulesScorer,
    context,
  );
  assert.equal(result.status, "ready");
  assert.ok(
    result.outfits.every(
      (outfit) => !outfit.ids.includes("sample-chocolate-hijab"),
    ),
  );
  const first = result.outfits[0]!.ids;
  const hijab = first.find((id) => id.includes("hijab"))!;
  assert.ok(
    replacementsFor(away.pieces, request(), first, hijab, rulesScorer, context)
      .map((option) => option.piece.id)
      .every((id) => id !== "sample-chocolate-hijab"),
  );
});

test("a kept piece that is marked away explains itself", () => {
  const away = setAway(samples, "sample-mauve-hijab", "lent");
  const result = styleOutfits(
    away.pieces,
    request({ keptIds: ["sample-mauve-hijab"] }),
    "2026-10-01:sample",
    rulesScorer,
    context,
  );
  assert.equal(result.status, "missing");
  assert.deepEqual(result.problems, [
    {
      code: "kept-missing",
      severity: "missing",
      message: "Mauve chiffon hijab is marked as unavailable right now.",
      ids: ["sample-mauve-hijab"],
      actions: [{ type: "release", id: "sample-mauve-hijab" }],
    },
  ]);
});

test("only a hijab or an instant hijab fills the hijab slot", () => {
  const kinds = ["hijab", "instant-hijab", "shawl", "underscarf"] as const;
  assert.deepEqual(
    kinds.map((kind) => roleOf(owned({ id: kind, category: "hijab", kind }))),
    ["hijab", "hijab", "accessory", "accessory"],
  );
  const closet = [
    owned({ id: "my-shawl", category: "hijab", kind: "shawl" }),
    owned({ id: "my-underscarf", category: "hijab", kind: "underscarf" }),
    owned({ id: "my-tunic", category: "tunic", kind: "tunic" }),
    owned({ id: "my-trousers", category: "bottom", kind: "trousers" }),
    owned({ id: "my-loafers", category: "shoes", kind: "loafers" }),
  ].reduce(savePiece, emptyCloset);
  const result = styleOutfits(
    closet.pieces,
    request({ wardrobe: "owned" }),
    "2026-10-01:owned",
    rulesScorer,
    context,
  );
  assert.equal(result.status, "missing");
  assert.deepEqual(
    result.problems.map((problem) => problem.message),
    ["Add a hijab to complete an outfit."],
  );
});

const pick = (...ids: string[]) =>
  ids.map((id) => samples.pieces.find((piece) => piece.id === `sample-${id}`)!);

test("a maxi dress alone beats the same dress over trousers on a warm day", () => {
  const warm = request({
    occasion: "everyday",
    weather: {
      source: "manual",
      warmth: "warm",
      precipitation: "dry",
      exposure: null,
    },
  });
  const alone = rulesScorer.score(
    pick("olive-maxi-dress", "ivory-hijab", "chocolate-loafers"),
    warm,
    context,
  ).score;
  const layered = rulesScorer.score(
    pick(
      "olive-maxi-dress",
      "ivory-trousers",
      "ivory-hijab",
      "chocolate-loafers",
    ),
    warm,
    context,
  ).score;
  assert.ok(alone > layered);
});

test("a blazer under an open abaya scores below either layer alone", () => {
  const cold = request({
    occasion: "party",
    weather: {
      source: "manual",
      warmth: "cold",
      precipitation: "dry",
      exposure: null,
    },
  });
  const base = [
    "ivory-tunic",
    "charcoal-trousers",
    "mauve-hijab",
    "chocolate-loafers",
  ];
  const score = (...extra: string[]) =>
    rulesScorer.score(pick(...base, ...extra), cold, context).score;
  assert.ok(score("navy-blazer", "taupe-abaya") < score("navy-blazer"));
  assert.ok(score("navy-blazer", "taupe-abaya") < score("taupe-abaya"));
});

test("reasons about trousers and shoes use plural grammar", () => {
  const { reasons } = rulesScorer.score(
    pick("sage-kurta", "charcoal-trousers", "ivory-hijab", "chocolate-loafers"),
    request({
      occasion: "work",
      style: "desi",
      weather: {
        source: "manual",
        warmth: "cold",
        precipitation: "dry",
        exposure: null,
      },
    }),
    context,
  );
  assert.ok(
    reasons.includes("The charcoal wide-leg trousers are warm for a cold day."),
    reasons.join(" | "),
  );
});
