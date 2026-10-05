import { test } from "node:test";
import assert from "node:assert/strict";
import {
  emptyCloset,
  occasions,
  type OutfitRequest,
  type Style,
} from "./closet";
import { realisticPieces } from "./realistic-closet.fixture";
import { rulesScorer } from "./scoring/rulesScorer";
import { scoreContext } from "./scoring/taste";
import { roleOf, styleOutfits } from "./styling";

const request = (
  occasion: OutfitRequest["occasion"],
  style: Style,
): OutfitRequest => ({
  occasion,
  style,
  garmentType: null,
  keptIds: [],
  excludedIds: [],
  weather: { source: "unknown" },
  hijab: "always",
  wardrobe: "owned",
});

const top = (occasion: OutfitRequest["occasion"], style: Style, day: string) =>
  styleOutfits(
    realisticPieces,
    request(occasion, style),
    `${day}:owned`,
    rulesScorer,
    scoreContext(emptyCloset),
  ).outfits[0];

const piecesOf = (ids: string[]) =>
  ids.map((id) => realisticPieces.find((piece) => piece.id === id)!);

const days = ["2026-10-01", "2026-10-02", "2026-10-03"];
const styles: Style[] = ["western", "desi"];

test("a full closet gives an outfit for every occasion and style", () => {
  for (const style of styles)
    for (const { id } of occasions)
      assert.ok(top(id, style, days[0]!), `${style} ${id}`);
});

test("top outfits skip jackets and coats when nothing calls for them", () => {
  for (const style of styles)
    for (const { id } of occasions.filter(({ id }) => id !== "work"))
      for (const day of days) {
        const outfit = top(id, style, day)!;
        const extra = piecesOf(outfit.ids).find(
          (piece) => roleOf(piece) === "layer" || piece.kind === "coat",
        );
        assert.equal(extra, undefined, `${style} ${id} ${day}`);
      }
});

test("a heavy kameez is not paired with a plain lawn shalwar for a wedding", () => {
  for (const day of days) {
    const ids = top("wedding", "desi", day)!.ids;
    assert.ok(!ids.includes("real-white-shalwar"), day);
  }
});

test("the gym never gets a cardigan", () => {
  const result = styleOutfits(
    realisticPieces,
    request("gym", "western"),
    "2026-10-01:owned",
    rulesScorer,
    scoreContext(emptyCloset),
  );
  for (const outfit of result.outfits)
    assert.ok(piecesOf(outfit.ids).every((piece) => piece.kind !== "cardigan"));
});
