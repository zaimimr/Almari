import { test } from "node:test";
import assert from "node:assert/strict";
import {
  decodeCloset,
  emptyCloset,
  removePiece,
  saveLook,
  savePiece,
  setAway,
  type Closet,
  type OutfitRequest,
  type Piece,
} from "./closet";
import { addSampleWardrobe, sampleTraits } from "./samples";
import {
  activeSession,
  applyLook,
  replacePiece,
  resultFor,
  saveEverydayStyle,
  undoChange,
} from "./today";
import { hijabAlternatives, setArchived, shelf } from "./wardrobe";

const day = "2026-10-01";
const samples = addSampleWardrobe(emptyCloset);

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

const suggested = (closet: Closet, changes: Partial<OutfitRequest> = {}) =>
  resultFor(closet, request(changes), day).outfits.map((outfit) => outfit.ids);

const pieceOf = (closet: Closet, id: string) =>
  closet.pieces.find((piece) => piece.id === id)!;

test("archived pieces are left out of every suggestion, like away pieces", () => {
  assert.equal(
    suggested(samples).some((ids) => ids.includes("sample-mauve-hijab")),
    true,
  );
  const closet = setArchived(
    setAway(samples, "sample-navy-blazer", "wash"),
    "sample-mauve-hijab",
    true,
  );
  const outfits = suggested(closet);
  assert.ok(outfits.length);
  for (const ids of outfits) {
    assert.equal(ids.includes("sample-mauve-hijab"), false);
    assert.equal(ids.includes("sample-navy-blazer"), false);
  }
});

test("archive is reversible, survives reopening, and is separate from removing and from away", () => {
  const look = {
    id: "office",
    name: "Office",
    pieceIds: ["sample-mauve-hijab", "sample-ivory-tunic"],
    createdAt: day,
  };
  const closet = saveLook(samples, look);
  const archived = setArchived(closet, "sample-mauve-hijab", true);
  assert.equal(archived.pieces.length, closet.pieces.length);
  assert.deepEqual(archived.looks, closet.looks);
  assert.equal(pieceOf(archived, "sample-mauve-hijab").status, "archived");
  assert.equal(setArchived(archived, "sample-mauve-hijab", true), archived);
  assert.deepEqual(setArchived(archived, "sample-mauve-hijab", false), closet);
  assert.equal(
    removePiece(closet, "sample-mauve-hijab").pieces.length,
    closet.pieces.length - 1,
  );
  const reopened = decodeCloset(JSON.stringify(archived), sampleTraits);
  assert.equal(pieceOf(reopened, "sample-mauve-hijab").status, "archived");

  const away = setAway(closet, "sample-ivory-tunic", "lent");
  assert.equal(setArchived(away, "sample-ivory-tunic", false), away);
  const archivedAway = pieceOf(
    setArchived(away, "sample-ivory-tunic", true),
    "sample-ivory-tunic",
  );
  assert.equal(archivedAway.status, "archived");
  assert.equal(archivedAway.away, undefined);
  assert.equal(
    pieceOf(
      setArchived(
        setArchived(away, "sample-ivory-tunic", true),
        "sample-ivory-tunic",
        false,
      ),
      "sample-ivory-tunic",
    ).status,
    undefined,
  );
});

test("an unknown status is rejected", () => {
  assert.throws(() =>
    savePiece(samples, {
      ...samples.pieces[0]!,
      status: "gone",
    } as unknown as Piece),
  );
});

test("a kept piece that becomes archived is explained with a release", () => {
  const closet = setArchived(samples, "sample-taupe-bag", true);
  const result = resultFor(
    closet,
    request({ keptIds: ["sample-taupe-bag"] }),
    day,
  );
  assert.equal(result.status, "missing");
  assert.equal(result.problems[0]!.code, "kept-missing");
  assert.equal(
    result.problems[0]!.message,
    "A piece you chose to keep is marked unavailable or archived.",
  );
  assert.deepEqual(result.problems[0]!.actions, [
    { type: "release", id: "sample-taupe-bag" },
  ]);
});

test("the closet shows archived pieces only on their own shelf", () => {
  const closet = setArchived(
    setAway(samples, "sample-ivory-tunic", "wash"),
    "sample-mauve-hijab",
    true,
  );
  const ids = (pieces: Piece[]) => pieces.map((piece) => piece.id);
  assert.deepEqual(ids(shelf(closet.pieces, true)), ["sample-mauve-hijab"]);
  assert.equal(
    ids(shelf(closet.pieces, false)).includes("sample-mauve-hijab"),
    false,
  );
  assert.equal(
    ids(shelf(closet.pieces, false)).includes("sample-ivory-tunic"),
    true,
  );
  assert.equal(shelf(closet.pieces, false).length, closet.pieces.length - 1);
});

test("marking an archived piece unavailable or available leaves it archived", () => {
  const archived = setArchived(samples, "sample-mauve-hijab", true);
  assert.equal(setAway(archived, "sample-mauve-hijab", "wash"), archived);
  assert.equal(setAway(archived, "sample-mauve-hijab", null), archived);
});

const clock = { localDate: day, timeZone: "Europe/Oslo" };
const outfit = [
  "sample-ivory-tunic",
  "sample-charcoal-trousers",
  "sample-mauve-hijab",
  "sample-chocolate-loafers",
];
const hijab = (id: string, name: string): Piece => ({
  id,
  name,
  category: "hijab",
  kind: "hijab",
  styles: ["western", "desi"],
  photo: `${id}.jpg`,
  createdAt: day,
  source: "sample",
});
const hijabs = [
  hijab("sample-rose-hijab", "Rose hijab"),
  hijab("sample-sky-hijab", "Sky hijab"),
].reduce(savePiece, samples);
const preference = [
  "sample-sky-hijab",
  "sample-chocolate-hijab",
  "sample-rose-hijab",
  "sample-ivory-hijab",
];
const byPreference = (pieces: Piece[]) => {
  const worn = pieces.find((piece) => piece.category === "hijab")!;
  return {
    score: 10 - preference.indexOf(worn.id),
    reasons: [
      "Every piece is marked for work.",
      `The ${worn.name.toLowerCase()} brings contrast to the ivory longline tunic.`,
    ],
  };
};

test("R03 the comparison shows three alternatives ranked by the scorer, each keeping every other piece", () => {
  const comparison = hijabAlternatives(
    hijabs,
    request(),
    outfit,
    byPreference,
  )!;
  assert.equal(comparison.current.piece.id, "sample-mauve-hijab");
  assert.deepEqual(comparison.current.ids, outfit);
  assert.deepEqual(
    comparison.options.map((option) => option.piece.id),
    ["sample-sky-hijab", "sample-chocolate-hijab", "sample-rose-hijab"],
  );
  for (const option of comparison.options) {
    assert.deepEqual(
      option.ids,
      outfit.map((id) => (id === "sample-mauve-hijab" ? option.piece.id : id)),
    );
    assert.equal(
      option.reason,
      `The ${option.piece.name.toLowerCase()} brings contrast to the ivory longline tunic.`,
    );
  }
});

test("R03 away, archived and set-aside hijabs are not offered", () => {
  const closet = setArchived(
    setAway(hijabs, "sample-sky-hijab", "wash"),
    "sample-ivory-hijab",
    true,
  );
  const comparison = hijabAlternatives(
    closet,
    request({ excludedIds: ["sample-rose-hijab"] }),
    outfit,
    byPreference,
  )!;
  assert.deepEqual(
    comparison.options.map((option) => option.piece.id),
    ["sample-chocolate-hijab"],
  );
});

test("R03 using a hijab changes only the hijab and undo restores the outfit", () => {
  const styled = saveEverydayStyle(
    hijabs,
    { occasion: "work", style: "western", hijab: "always", sample: true },
    clock,
    true,
  );
  const shown = applyLook(
    styled,
    outfit,
    activeSession(styled.styling.today!).revision,
  );
  const session = activeSession(shown.styling.today!);
  assert.deepEqual(session.pieceIds, outfit);
  const choice = hijabAlternatives(
    shown,
    session.request,
    session.pieceIds,
    byPreference,
  )!.options[0]!;
  const used = replacePiece(
    shown,
    "sample-mauve-hijab",
    choice.piece.id,
    session.revision,
  );
  assert.deepEqual(activeSession(used.styling.today!).pieceIds, choice.ids);
  assert.deepEqual(
    activeSession(undoChange(used).styling.today!).pieceIds,
    outfit,
  );
  assert.deepEqual(undoChange(used).looks, hijabs.looks);
});

test("R03 a closet with one hijab shows no alternatives, and no hijab means no comparison", () => {
  const single = removePiece(
    removePiece(samples, "sample-ivory-hijab"),
    "sample-chocolate-hijab",
  );
  assert.deepEqual(
    hijabAlternatives(single, request(), outfit, byPreference)!.options,
    [],
  );
  assert.equal(
    hijabAlternatives(
      samples,
      request({ hijab: "not-needed" }),
      outfit.filter((id) => id !== "sample-mauve-hijab"),
      byPreference,
    ),
    null,
  );
});
