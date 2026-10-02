import { test } from "node:test";
import assert from "node:assert/strict";
import {
  emptyTaste,
  neutralProfile,
  type OutfitRequest,
  type Piece,
} from "../closet";
import { rulesScorer } from "./rulesScorer";
import { countPairs } from "./taste";

const request: OutfitRequest = {
  occasion: "work",
  style: "western",
  garmentType: null,
  keptIds: [],
  excludedIds: [],
  weather: { source: "unknown" },
  hijab: "always",
  wardrobe: "owned",
};
const context = { profile: neutralProfile, taste: emptyTaste, wear: {} };

const top: Piece = {
  id: "top",
  name: "Floral blouse",
  category: "top",
  kind: "blouse",
  photo: "top.jpg",
  createdAt: "2026-10-01T00:00:00Z",
  source: "owned",
  attributes: { pattern: "print", formality: 2 },
  colors: [{ rgb: [236, 231, 218], share: 1 }],
};
const hijab: Piece = {
  ...top,
  id: "hijab",
  name: "Chocolate hijab",
  category: "hijab",
  kind: "hijab",
  attributes: { pattern: "solid", fabric: "jersey" },
  colors: [{ rgb: [78, 52, 42], share: 1 }],
};
const shoes: Piece = {
  ...top,
  id: "shoes",
  name: "Brown loafers",
  category: "shoes",
  kind: "loafers",
  attributes: {},
  colors: [{ rgb: [78, 52, 42], share: 1 }],
};

test("the two strongest positive rules explain the outfit", () => {
  const result = rulesScorer.score([top, hijab, shoes], request, context);
  assert.deepEqual(result.reasons, [
    "A solid chocolate hijab keeps the floral blouse the focus.",
    "The chocolate hijab brings contrast to the floral blouse.",
  ]);
});

test("her taste can lift a rule and its reason above another", () => {
  const taste = {
    ...emptyTaste,
    weights: { "hijab-repeats-colour": 1.6 },
  };
  const before = rulesScorer.score([top, hijab, shoes], request, context);
  const after = rulesScorer.score([top, hijab, shoes], request, {
    ...context,
    taste,
  });
  assert.ok(after.score > before.score);
  assert.equal(
    after.reasons[0],
    "The chocolate hijab repeats the colour of the brown loafers.",
  );
});

test("a proposed pattern still scores but never becomes a reason", () => {
  const guessed = { ...top, sources: { pattern: "proposed" as const } };
  const result = rulesScorer.score([guessed, hijab, shoes], request, context);
  assert.ok(!result.reasons.some((reason) => reason.includes("keeps the")));
  assert.ok(
    result.score >
      rulesScorer.score(
        [{ ...guessed, attributes: { formality: 2 } }, hijab, shoes],
        request,
        context,
      ).score,
  );
});

test("pieces she often wears together earn a reason", () => {
  const taste = countPairs(
    countPairs(emptyTaste, ["top", "hijab"], "worn"),
    ["top", "hijab"],
    "worn",
  );
  const result = rulesScorer.score([top, hijab, shoes], request, {
    ...context,
    taste,
  });
  assert.ok(
    result.reasons.includes(
      "You often wear the floral blouse with the chocolate hijab.",
    ),
  );
});
