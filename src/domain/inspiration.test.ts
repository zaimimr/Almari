import { test } from "node:test";
import assert from "node:assert/strict";
import { emptyCloset, type Closet, type Piece } from "./closet";
import {
  inspirationGarments,
  inspirationOutfits,
  garmentResemblance,
  inspirationRequest,
  type InspirationGarment,
} from "./inspiration";
import { realisticPieces } from "./realistic-closet.fixture";
import { setNeverWear } from "./preferences";
import { analyzeReference, InspirationRequest } from "../state/inspiration";
import type { InspirationAnalysis } from "../../modules/closet-vision/src/ClosetVision.types";

const date = "2026-10-11";
const closet: Closet = {
  ...emptyCloset,
  pieces: realisticPieces,
  styling: {
    ...emptyCloset.styling,
    wardrobe: "owned",
    everyday: {
      version: 1,
      occasion: "work",
      style: "western",
      hijab: "always",
      sample: false,
    },
  },
};
const reference = (piece: Piece): InspirationGarment => ({
  category: piece.category,
  kind: piece.kind,
  palette: piece.colors ?? [],
  attributes: piece.attributes,
  embedding: piece.embedding,
  partial: false,
});
const shirt = realisticPieces.find(
  (piece) => piece.id === "real-white-blouse",
)!;
const trousers = realisticPieces.find(
  (piece) => piece.id === "real-black-trousers",
)!;
const references = [reference(shirt), reference(trousers)];
const analysis: InspirationAnalysis = {
  people: 1,
  garments: [
    {
      region: "upper",
      partial: false,
      labels: [
        { group: "kind", value: "blouse", score: 0.3 },
        { group: "sleeve", value: "long", score: 0.3 },
      ],
      palette: [{ rgb: [242, 240, 235], share: 1 }],
      embedding: null,
    },
  ],
};

test("reference analysis extracts individual classified garment signatures", () => {
  const garments = inspirationGarments(analysis);
  assert.equal(garments.length, 1);
  assert.equal(garments[0]?.kind, "blouse");
  assert.equal(garments[0]?.attributes?.sleeve, "long");
  assert.deepEqual(garments[0]?.palette, analysis.garments[0]?.palette);
  assert.deepEqual(
    inspirationGarments({
      ...analysis,
      garments: [{ ...analysis.garments[0]!, labels: [] }],
    }),
    [],
  );
});

test("references containing several people cannot combine their garments into one outfit", () => {
  assert.deepEqual(inspirationGarments({ ...analysis, people: 2 }), []);
});

test("shape, colour and embedding influence garment resemblance independently", () => {
  const encoded = btoa(String.fromCharCode(127, 0, 0, 0));
  const similar = { ...shirt, embedding: encoded };
  const look = { ...reference(shirt), embedding: encoded };
  assert.equal(garmentResemblance(look, similar), 1);
  assert.ok(
    garmentResemblance(look, {
      ...similar,
      colors: [{ rgb: [1, 1, 1], share: 1 }],
    }) < 0.8,
  );
  assert.ok(
    garmentResemblance(look, {
      ...similar,
      attributes: { sleeve: "short", length: "ankle", pattern: "print" },
    }) < 1,
  );
  assert.ok(
    garmentResemblance(look, {
      ...similar,
      embedding: btoa(String.fromCharCode(0, 127, 0, 0)),
    }) < 0.8,
  );
  assert.equal(garmentResemblance(look, { ...similar, category: "bottom" }), 0);
});

test("inspiration ranks complete owned outfits and does not alter the closet", () => {
  const before = JSON.stringify(closet);
  const outfits = inspirationOutfits(closet, references, date);
  assert.ok(outfits.length > 1);
  const best = outfits[0]!;
  assert.ok(best.ids.includes(shirt.id));
  assert.ok(best.ids.includes(trousers.id));
  assert.ok(
    best.ids.some(
      (id) =>
        realisticPieces.find((piece) => piece.id === id)?.category === "shoes",
    ),
  );
  assert.ok(
    best.ids.some(
      (id) =>
        realisticPieces.find((piece) => piece.id === id)?.category === "hijab",
    ),
  );
  assert.equal(JSON.stringify(closet), before);
});

test("inspiration excludes samples, unavailable, archived and never-wear pieces", () => {
  const constrained = setNeverWear(
    {
      ...closet,
      pieces: closet.pieces.map((piece) =>
        piece.id === trousers.id
          ? { ...piece, status: "away" }
          : piece.id === shirt.id
            ? { ...piece, status: "archived" }
            : piece,
      ),
    },
    [{ kind: "heels" }],
  );
  const outfits = inspirationOutfits(constrained, references, date);
  assert.ok(outfits.length);
  assert.ok(
    outfits.every((outfit) =>
      outfit.ids.every((id) => {
        const piece = constrained.pieces.find((item) => item.id === id)!;
        return (
          piece.source === "owned" && !piece.status && piece.kind !== "heels"
        );
      }),
    ),
  );
  assert.equal(
    inspirationRequest({
      ...closet,
      styling: { ...closet.styling, wardrobe: "sample" },
    }).wardrobe,
    "owned",
  );
});

test("inspiration respects coverage and chosen style and reports no match honestly", () => {
  const strict: Closet = {
    ...closet,
    styling: {
      ...closet.styling,
      everyday: {
        ...closet.styling.everyday!,
        coverage: { sleeve: "long", hem: "ankle" },
      },
    },
  };
  const outfits = inspirationOutfits(strict, references, date);
  assert.ok(
    outfits.every(
      (outfit) =>
        !outfit.problems.some(
          (problem) =>
            problem.code === "coverage" || problem.code === "coverage-unknown",
        ),
    ),
  );
  assert.ok(
    outfits.every((outfit) =>
      outfit.ids.every(
        (id) =>
          !strict.pieces
            .find((piece) => piece.id === id)
            ?.styles?.includes("desi") ||
          strict.pieces
            .find((piece) => piece.id === id)
            ?.styles?.includes("western"),
      ),
    ),
  );
  assert.deepEqual(inspirationOutfits(emptyCloset, references, date), []);
  assert.deepEqual(
    inspirationOutfits(
      closet,
      [
        {
          ...references[0]!,
          category: "dress",
          kind: "lehenga",
          palette: [{ rgb: [250, 0, 255], share: 1 }],
        },
      ],
      date,
    ),
    [],
  );
});

test("local reference pipeline invokes only read-only native analysis", async () => {
  const calls: string[] = [];
  const reading = await analyzeReference("file:///reference.jpg", {
    isAvailable: () => true,
    analyzeInspiration: async (uri) => {
      calls.push(uri);
      return analysis;
    },
  });
  assert.deepEqual(calls, ["file:///reference.jpg"]);
  assert.equal(reading.garments[0]?.kind, "blouse");
  await assert.rejects(
    analyzeReference("https://example.test/photo.jpg", {
      isAvailable: () => true,
      analyzeInspiration: async () => analysis,
    }),
    /unreadable/,
  );
  await assert.rejects(
    analyzeReference("file:///reference.jpg", {
      isAvailable: () => false,
      analyzeInspiration: async () => analysis,
    }),
    /unavailable/,
  );
  await assert.rejects(
    analyzeReference("file:///reference.jpg", {
      isAvailable: () => true,
      analyzeInspiration: async () => ({
        ...analysis,
        garments: [
          {
            ...analysis.garments[0]!,
            palette: [{ rgb: [NaN, 1, 2], share: 1 }],
          },
        ],
      }),
    }),
    /invalid-analysis/,
  );
});

test("malformed native regions, labels and embeddings fail before matching", async () => {
  for (const bad of [
    null,
    { ...analysis, garments: [null] },
    {
      ...analysis,
      garments: [{ ...analysis.garments[0]!, region: "unknown" }],
    },
    {
      ...analysis,
      garments: [
        {
          ...analysis.garments[0]!,
          labels: [{ group: "invalid", value: "blouse", score: 0.3 }],
        },
      ],
    },
    {
      ...analysis,
      garments: [{ ...analysis.garments[0]!, embedding: "not a vector" }],
    },
  ]) {
    await assert.rejects(
      analyzeReference("file:///photo.jpg", {
        isAvailable: () => true,
        analyzeInspiration: async () => bad as InspirationAnalysis,
      }),
      /invalid-analysis/,
    );
  }
});

test("replacement and cancellation discard late local analysis without changing state", async () => {
  const requests = new InspirationRequest();
  let resolve!: (value: InspirationAnalysis) => void;
  const pending = requests.read("file:///first.jpg", {
    isAvailable: () => true,
    analyzeInspiration: () =>
      new Promise((done) => {
        resolve = done;
      }),
  });
  const next = await requests.read("file:///second.jpg", {
    isAvailable: () => true,
    analyzeInspiration: async () => analysis,
  });
  assert.equal(next?.garments.length, 1);
  resolve(analysis);
  assert.equal(await pending, null);
  const cancelled = requests.read("file:///cancelled.jpg", {
    isAvailable: () => true,
    analyzeInspiration: () =>
      new Promise((done) => {
        resolve = done;
      }),
  });
  requests.cancel();
  resolve(analysis);
  assert.equal(await cancelled, null);
});
