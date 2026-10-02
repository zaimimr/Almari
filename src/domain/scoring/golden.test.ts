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
import { activeSession, saveEverydayStyle } from "../today";
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
        "sample-ivory-tunic",
        "sample-charcoal-trousers",
        "sample-chocolate-hijab",
        "sample-navy-blazer",
        "sample-chocolate-loafers",
        "sample-taupe-bag",
      ],
      [
        "sample-olive-maxi-dress",
        "sample-ivory-trousers",
        "sample-ivory-hijab",
        "sample-navy-blazer",
        "sample-chocolate-loafers",
        "sample-taupe-bag",
      ],
    ],
  );
  assert.deepEqual(result.outfits[0]!.reasons, [
    "Every piece is marked for work.",
    "The chocolate jersey hijab brings contrast to the ivory longline tunic.",
  ]);
  assert.deepEqual(result.outfits[2]!.reasons, [
    "Every piece is marked for work.",
    "The ivory modal hijab brings contrast to the olive maxi dress.",
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
    "The ivory modal hijab repeats the colour of the ivory cotton shalwar.",
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
    [
      "Add trousers or a skirt that suits a Western outfit.",
      "Add shoes to complete an outfit.",
    ],
  );
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

test("a new suggestion records the engine that produced it", () => {
  const closet = saveEverydayStyle(
    samples,
    { occasion: "work", style: "western", hijab: "always", sample: true },
    { localDate: "2026-10-01", timeZone: "Europe/Oslo" },
    true,
  );
  assert.equal(activeSession(closet.styling.today!).engine, "rules");
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
