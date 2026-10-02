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
import { resultFor } from "./today";
import { setArchived, shelf } from "./wardrobe";

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
