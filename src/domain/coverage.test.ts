import { test } from "node:test";
import assert from "node:assert/strict";
import {
  coverageNeedFor,
  emptyCloset,
  savePiece,
  type CoverageNeed,
  type OutfitRequest,
  type Piece,
} from "./closet";
import {
  coverageQuestion,
  seeThroughChoices,
  seeThroughConfirmation,
} from "./coverage";
import {
  addSampleWardrobe,
  samplePieces,
  withSampleAttributes,
} from "./samples";
import { evaluateOutfit } from "./styling";
import { activeSession, resultFor, saveEverydayStyle } from "./today";
import { confirmPiece } from "./wardrobe";

const day = "2026-10-01";
const covered: CoverageNeed = { sleeve: "long", hem: "ankle" };

const owned = (
  piece: Partial<Piece> & Pick<Piece, "id" | "name" | "category">,
): Piece => ({
  photo: `${piece.id}.jpg`,
  createdAt: "2026-10-01T00:00:00Z",
  source: "owned",
  styles: ["western"],
  ...piece,
});

const tunic = owned({
  id: "rose-tunic",
  name: "Rose tunic",
  category: "tunic",
  kind: "tunic",
  attributes: { sleeve: "long", length: "knee" },
  sources: { sleeve: "proposed", length: "proposed" },
});
const trousers = owned({
  id: "grey-trousers",
  name: "Grey trousers",
  category: "bottom",
  kind: "trousers",
});
const shoes = owned({
  id: "black-shoes",
  name: "Black shoes",
  category: "shoes",
  kind: "shoes",
  styles: ["western", "desi"],
});
const hijab = owned({
  id: "sand-hijab",
  name: "Sand hijab",
  category: "hijab",
  kind: "hijab",
  styles: ["western", "desi"],
});
const wardrobe = [tunic, trousers, shoes, hijab].reduce(savePiece, emptyCloset);

const request = (changes: Partial<OutfitRequest> = {}): OutfitRequest => ({
  occasion: "work",
  style: "western",
  garmentType: null,
  keptIds: [],
  excludedIds: [],
  weather: { source: "unknown" },
  hijab: "always",
  wardrobe: "owned",
  coverage: covered,
  ...changes,
});

const coverageOf = (outfit: Piece[], coverage: CoverageNeed = covered) =>
  evaluateOutfit(outfit, request({ coverage }), outfit).filter((problem) =>
    problem.code.startsWith("coverage"),
  );

test("one coverage vocabulary: full, moderate and her own line become sleeve and hem needs", () => {
  assert.deepEqual(coverageNeedFor("full", undefined), {
    sleeve: "long",
    hem: "ankle",
  });
  assert.deepEqual(coverageNeedFor("moderate", { sleeve: "any", hem: "any" }), {
    sleeve: "elbow",
    hem: "calf",
  });
  assert.deepEqual(coverageNeedFor("own", { sleeve: "long", hem: null }), {
    sleeve: "long",
    hem: null,
  });
  assert.equal(coverageNeedFor("own", undefined), undefined);
  assert.equal(coverageNeedFor(null, covered), undefined);
  const full = {
    ...wardrobe,
    styling: {
      ...wardrobe.styling,
      profile: { ...wardrobe.styling.profile, coverageLevel: "full" as const },
    },
  };
  const styled = saveEverydayStyle(
    full,
    { occasion: "work", style: "western", hijab: "always", sample: false },
    { localDate: day, timeZone: "Europe/Oslo" },
    true,
  );
  assert.deepEqual(
    activeSession(styled.styling.today!).request.coverage,
    covered,
  );
});

test("R02 a proposed sleeve length never makes an outfit ready", () => {
  const result = resultFor(wardrobe, request(), day);
  assert.equal(result.status, "review");
  assert.ok(result.outfits.length);
  const problem = result.problems.find(
    (item) => item.code === "coverage-unknown",
  )!;
  assert.equal(
    problem.message,
    "The sleeve length of Rose tunic is not confirmed yet.",
  );
  assert.equal(problem.severity, "review");
  assert.deepEqual(problem.actions, [
    { type: "check-piece", id: "rose-tunic", ask: "sleeve" },
  ]);
  assert.deepEqual(coverageQuestion(tunic, "sleeve"), {
    kind: "sleeve",
    proposed: "long",
  });
  const confirmed = confirmPiece(wardrobe, "rose-tunic", {
    attributes: { sleeve: "long" },
  });
  assert.equal(
    confirmed.pieces.find((piece) => piece.id === "rose-tunic")!.sources
      ?.sleeve,
    "confirmed",
  );
  assert.equal(resultFor(confirmed, request(), day).status, "ready");
});

test("R02 an outfit with unknown coverage is never listed as ready, whatever its score", () => {
  const plain = owned({
    id: "ivory-tunic",
    name: "Ivory tunic",
    category: "tunic",
    kind: "tunic",
    attributes: { sleeve: "long" },
  });
  const result = resultFor(savePiece(wardrobe, plain), request(), day);
  assert.equal(result.status, "ready");
  assert.equal(
    result.outfits.some((outfit) => outfit.ids.includes("rose-tunic")),
    false,
  );
});

test("R02 a confirmed short sleeve removes the outfit and says why", () => {
  const short = confirmPiece(wardrobe, "rose-tunic", {
    attributes: { sleeve: "short" },
  });
  const result = resultFor(short, request(), day);
  assert.equal(result.status, "missing");
  assert.equal(result.problems[0]!.code, "coverage");
  assert.equal(
    result.problems[0]!.message,
    "No combination in this closet meets your sleeve and hem choices.",
  );
});

test("unset or any coverage adds no coverage checks", () => {
  const options: (CoverageNeed | undefined)[] = [
    undefined,
    { sleeve: null, hem: null },
    { sleeve: "any", hem: "any" },
  ];
  for (const coverage of options)
    assert.equal(
      resultFor(wardrobe, request({ coverage }), day).status,
      "ready",
    );
});

test("R07 an open abaya never certifies a short dress beneath it", () => {
  const dress = owned({
    id: "knee-dress",
    name: "Knee dress",
    category: "dress",
    kind: "dress",
    attributes: { sleeve: "short", length: "knee" },
  });
  const abaya = owned({
    id: "open-abaya",
    name: "Open abaya",
    category: "dress",
    kind: "abaya",
    attributes: { sleeve: "long", length: "ankle" },
    traits: { open: true },
  });
  assert.deepEqual(
    coverageOf([dress, abaya, shoes, hijab]).map((problem) => [
      problem.code,
      problem.severity,
    ]),
    [
      ["coverage", "missing"],
      ["coverage", "missing"],
    ],
  );
});

test("R07 a see-through layer never certifies the sleeves beneath it", () => {
  const cami = owned({
    id: "cami",
    name: "Silk cami",
    category: "top",
    kind: "top",
    attributes: { sleeve: "sleeveless", length: "hip" },
  });
  const sheer = owned({
    id: "net-cardigan",
    name: "Net cardigan",
    category: "layer",
    kind: "cardigan",
    attributes: { sleeve: "long", sheer: true, fabric: "net" },
  });
  const opaque = owned({
    id: "wool-cardigan",
    name: "Wool cardigan",
    category: "layer",
    kind: "cardigan",
    attributes: { sleeve: "long", fabric: "wool" },
  });
  const [problem] = coverageOf([cami, sheer, trousers, shoes, hijab]);
  assert.equal(problem!.code, "coverage");
  assert.equal(
    problem!.message,
    "Nothing in this outfit has opaque sleeves to the wrist.",
  );
  assert.deepEqual(coverageOf([cami, opaque, trousers, shoes, hijab]), []);
});

test("see-through and open front are asked only when coverage depends on them, as one question", () => {
  const chiffon = owned({
    id: "chiffon-tunic",
    name: "Chiffon tunic",
    category: "tunic",
    kind: "tunic",
    attributes: { sleeve: "long", fabric: "chiffon" },
  });
  const [problem] = coverageOf([chiffon, trousers, shoes, hijab]);
  assert.equal(
    problem!.message,
    "Chiffon tunic may be see-through, so its sleeves are not confirmed.",
  );
  assert.deepEqual(coverageQuestion(chiffon, "sleeve"), {
    kind: "see-through",
    sheer: true,
    open: false,
  });
  assert.deepEqual(
    coverageOf([chiffon, trousers, shoes, hijab], {
      sleeve: "any",
      hem: "ankle",
    }),
    [],
  );

  const dress = owned({
    id: "knee-dress",
    name: "Knee dress",
    category: "dress",
    kind: "dress",
    attributes: { sleeve: "long", length: "knee" },
  });
  const abaya = owned({
    id: "long-abaya",
    name: "Long abaya",
    category: "dress",
    kind: "abaya",
    attributes: { sleeve: "long", length: "ankle", fabric: "chiffon" },
  });
  const [hem] = coverageOf([dress, abaya, shoes, hijab]);
  assert.equal(hem!.severity, "review");
  assert.deepEqual(hem!.actions, [
    { type: "check-piece", id: "long-abaya", ask: "length" },
  ]);
  const question = coverageQuestion(abaya, "length")!;
  assert.deepEqual(question, { kind: "see-through", sheer: true, open: true });
  assert.ok(question.kind === "see-through");
  assert.deepEqual(
    seeThroughChoices(question).map((choice) => choice.label),
    ["Neither", "See-through", "Opens at the front", "Both"],
  );
  const answered = confirmPiece(
    savePiece(emptyCloset, abaya),
    "long-abaya",
    seeThroughConfirmation({ sheer: false, open: false }),
  ).pieces[0]!;
  assert.equal(answered.traits?.open, false);
  assert.equal(answered.attributes?.sheer, false);
  assert.equal(answered.sources?.sheer, "confirmed");
  assert.equal(answered.sources?.open, "confirmed");
  assert.equal(coverageQuestion(answered, "length"), null);
});

test("sample clothes carry confirmed sleeves and lengths, also when stored earlier", () => {
  const samples = addSampleWardrobe(emptyCloset);
  assert.equal(
    resultFor(samples, request({ wardrobe: "sample" }), day).status,
    "ready",
  );
  const stored = {
    ...samples,
    pieces: samples.pieces.map(
      ({ attributes: _attributes, ...piece }) => piece,
    ),
  };
  const refreshed = withSampleAttributes(stored);
  assert.deepEqual(
    refreshed.pieces.find((piece) => piece.id === "sample-ivory-tunic")!
      .attributes,
    samplePieces.find((piece) => piece.id === "sample-ivory-tunic")!.attributes,
  );
  assert.equal(
    refreshed.pieces.find((piece) => piece.id === "sample-ivory-tunic")!
      .attributes?.sleeve,
    "long",
  );
  assert.equal(withSampleAttributes(refreshed), refreshed);
});
