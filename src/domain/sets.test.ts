import { test } from "node:test";
import assert from "node:assert/strict";
import {
  decodeCloset,
  emptyCloset,
  removePiece,
  type Closet,
  type Piece,
} from "./closet";
import { linkSet, setMembers, unlinkPiece } from "./sets";

const piece = (
  id: string,
  category: Piece["category"],
  kind: Piece["kind"],
): Piece => ({
  id,
  name: id,
  category,
  kind,
  photo: `${id}.png`,
  createdAt: "2026-10-01T08:00:00Z",
  source: "owned",
});

const closet: Closet = {
  ...emptyCloset,
  pieces: [
    piece("kurta", "tunic", "kurta"),
    piece("shalwar", "bottom", "shalwar"),
    piece("dupatta", "accessory", "dupatta"),
    piece("trousers", "bottom", "trousers"),
  ],
};

const setOf = (current: Closet, id: string) =>
  current.pieces.find((item) => item.id === id)!.setId;

test("P04 three pieces become one linked Desi set", () => {
  const linked = linkSet(closet, ["kurta", "shalwar", "dupatta"], "set-1");
  assert.equal(setOf(linked, "kurta"), "set-1");
  assert.equal(setOf(linked, "shalwar"), "set-1");
  assert.equal(setOf(linked, "dupatta"), "set-1");
  assert.equal(setOf(linked, "trousers"), undefined);
  const kurta = linked.pieces.find((item) => item.id === "kurta")!;
  assert.deepEqual(
    setMembers(linked, kurta).map((item) => item.id),
    ["shalwar", "dupatta"],
  );
  assert.deepEqual(
    decodeCloset(JSON.stringify(linked)).pieces.map((item) => item.setId),
    ["set-1", "set-1", "set-1", undefined],
  );
});

test("a set needs at least two pieces that exist", () => {
  assert.throws(() => linkSet(closet, ["kurta"], "set-1"));
  assert.throws(() => linkSet(closet, ["kurta", "missing"], "set-1"));
  assert.throws(() => linkSet(closet, ["kurta", "kurta"], "set-1"));
});

test("linking a piece into a new set moves it and clears a lone old set", () => {
  let linked = linkSet(closet, ["kurta", "shalwar"], "set-1");
  linked = linkSet(linked, ["shalwar", "trousers"], "set-2");
  assert.equal(setOf(linked, "kurta"), undefined);
  assert.equal(setOf(linked, "shalwar"), "set-2");
  assert.equal(setOf(linked, "trousers"), "set-2");
});

test("unlinking one piece keeps the rest of the set together", () => {
  const linked = linkSet(closet, ["kurta", "shalwar", "dupatta"], "set-1");
  const unlinked = unlinkPiece(linked, "dupatta");
  assert.equal(setOf(unlinked, "dupatta"), undefined);
  assert.equal(setOf(unlinked, "kurta"), "set-1");
  assert.equal(setOf(unlinked, "shalwar"), "set-1");
  assert.equal(unlinkPiece(unlinked, "dupatta"), unlinked);
  assert.equal(unlinkPiece(unlinked, "missing"), unlinked);
});

test("removing a piece from a pair leaves no lone set", () => {
  const linked = linkSet(closet, ["kurta", "shalwar"], "set-1");
  const removed = removePiece(unlinkPiece(linked, "shalwar"), "shalwar");
  assert.equal(setOf(removed, "kurta"), undefined);
  const kurta = removed.pieces.find((item) => item.id === "kurta")!;
  assert.deepEqual(setMembers(removed, kurta), []);
});
