import { test } from "node:test";
import assert from "node:assert/strict";
import type { LabelScore, Piece } from "./closet";
import {
  applyRecognition,
  confirmEdits,
  rankCategories,
  rankKinds,
  recognize,
} from "./recognition";

const kind = (value: string, score: number): LabelScore => ({
  group: "kind",
  value,
  score,
});
const style = (value: string, score: number): LabelScore => ({
  group: "style",
  value,
  score,
});

const base: Piece = {
  id: "piece",
  name: "Sage kurta",
  category: "tunic",
  photo: "piece.png",
  createdAt: "2026-10-01T08:00:00Z",
  source: "owned",
};

const kurtiPhoto = [
  kind("kurti", 0.15),
  kind("kurta", 0.1),
  kind("top", 0.09),
  style("western", 0.09),
  style("desi", 0.05),
];

test("the category comes from adding up its subcategory scores", () => {
  const labels = [
    kind("dress", 0.127),
    kind("trousers", 0.125),
    kind("jeans", 0.124),
    kind("wide-leg", 0.124),
    kind("shalwar", 0.123),
    style("western", 0.09),
    style("desi", 0.05),
  ];
  const result = recognize(labels);
  assert.equal(result.category, "bottom");
  assert.equal(result.kind, "trousers");
  assert.deepEqual(rankCategories(labels).slice(0, 2), ["bottom", "dress"]);
  assert.deepEqual(rankKinds(labels, "bottom").slice(0, 3), [
    "trousers",
    "jeans",
    "wide-leg",
  ]);
});

test("a clear photo gets category, subcategory and style with no question", () => {
  assert.deepEqual(
    recognize([
      kind("blouse", 0.15),
      kind("top", 0.11),
      kind("kurta", 0.1),
      style("desi", 0.09),
      style("western", 0.05),
    ]),
    { category: "top", kind: "blouse", styles: ["desi"], question: null },
  );
});

test("a subcategory with a fixed style ignores the style descriptions", () => {
  const kurta = recognize([
    kind("kurta", 0.15),
    kind("tunic", 0.1),
    style("western", 0.12),
    style("desi", 0.05),
  ]);
  assert.deepEqual(kurta.styles, ["desi"]);
  assert.equal(kurta.question, null);
  assert.deepEqual(
    recognize([kind("hijab", 0.15), kind("shawl", 0.1)]).styles,
    ["western", "desi"],
  );
});

test("when unsure about several things she gets one question, the most useful first", () => {
  const unsure = [
    kind("dupatta", 0.12),
    kind("shawl", 0.118),
    kind("hijab", 0.1),
    style("desi", 0.07),
    style("western", 0.069),
  ];
  assert.equal(recognize(unsure).question, "category");
  const subcategory = [
    kind("kurta", 0.14),
    kind("kurti", 0.138),
    kind("dress", 0.1),
    style("desi", 0.07),
    style("western", 0.069),
  ];
  assert.equal(recognize(subcategory).question, "subcategory");
  const styleOnly = [
    kind("trousers", 0.14),
    kind("skirt", 0.1),
    style("desi", 0.07),
    style("western", 0.069),
  ];
  assert.equal(recognize(styleOnly).question, "style");
  assert.equal(recognize([]).question, "category");
});

test("labels the app does not offer are ignored", () => {
  const result = recognize([
    kind("shoes", 0.3),
    kind("raincoat", 0.25),
    kind("loafers", 0.12),
    kind("sneakers", 0.08),
    { group: "length", value: "ankle", score: 0.4 } as unknown as LabelScore,
  ]);
  assert.equal(result.category, "shoes");
  assert.equal(result.kind, "loafers");
  assert.deepEqual(result.styles, []);
  assert.equal(result.question, "style");
});

test("R01 a confirmed subcategory and style survive re-preparation", () => {
  const confirmed: Piece = {
    ...base,
    kind: "kurta",
    styles: ["desi"],
    sources: { kind: "confirmed", styles: "confirmed" },
  };
  assert.equal(applyRecognition(confirmed, kurtiPhoto), confirmed);
  const unrecorded: Piece = { ...base, kind: "kurta", styles: ["desi"] };
  assert.equal(applyRecognition(unrecorded, kurtiPhoto), unrecorded);

  const proposed: Piece = {
    ...base,
    kind: "kurta",
    styles: ["desi"],
    sources: { kind: "proposed", styles: "proposed" },
  };
  const updated = applyRecognition(proposed, kurtiPhoto);
  assert.equal(updated.kind, "kurti");
  assert.deepEqual(updated.styles, ["desi"]);
  assert.deepEqual(updated.sources, { kind: "proposed", styles: "proposed" });

  const confirmedTop: Piece = {
    ...base,
    category: "top",
    kind: "top",
    sources: { kind: "confirmed" },
  };
  const styled = applyRecognition(confirmedTop, kurtiPhoto);
  assert.equal(styled.kind, "top");
  assert.deepEqual(styled.styles, ["western"]);
  assert.deepEqual(styled.sources, { kind: "confirmed", styles: "proposed" });

  const withoutKind = applyRecognition(base, kurtiPhoto);
  assert.equal(withoutKind.category, "tunic");
  assert.equal(withoutKind.kind, "kurti");
  assert.deepEqual(withoutKind.sources, {
    kind: "proposed",
    styles: "proposed",
  });

  assert.equal(applyRecognition(proposed, [style("desi", 0.2)]), proposed);
});

test("editing only the name keeps proposals open, and a changed subcategory becomes confirmed", () => {
  const proposed: Piece = {
    ...base,
    kind: "kurta",
    styles: ["desi"],
    sources: { kind: "proposed", styles: "proposed" },
  };
  assert.deepEqual(
    confirmEdits(proposed, { ...proposed, name: "Green kurta" }).sources,
    { kind: "proposed", styles: "proposed" },
  );
  const changed = confirmEdits(proposed, {
    ...base,
    kind: "kameez",
    styles: ["desi"],
  });
  assert.deepEqual(changed.sources, { kind: "confirmed", styles: "proposed" });
  assert.equal(applyRecognition(changed, kurtiPhoto).kind, "kameez");
  assert.deepEqual(
    confirmEdits(undefined, { ...base, kind: "top", styles: ["western"] })
      .sources,
    { kind: "confirmed", styles: "confirmed" },
  );
  const cleared = confirmEdits(proposed, { ...base, kind: "kurta" });
  assert.deepEqual(cleared.sources, { kind: "proposed" });
  assert.equal(confirmEdits(undefined, base).sources, undefined);
});
