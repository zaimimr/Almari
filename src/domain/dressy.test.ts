import { test } from "node:test";
import assert from "node:assert/strict";
import { emptyCloset, type Piece } from "./closet";
import { dressiness } from "./dressy";
import { addSampleWardrobe } from "./samples";

const samples = addSampleWardrobe(emptyCloset).pieces;
const pick = (...ids: string[]) =>
  ids.map((id) => samples.find((piece) => piece.id === `sample-${id}`)!);

test("an everyday tunic look is smart, enough for work but short for a party", () => {
  const look = pick("ivory-tunic", "charcoal-trousers", "chocolate-loafers");
  assert.deepEqual(dressiness(look, "work"), {
    level: "smart",
    goal: "smart",
    short: false,
  });
  assert.deepEqual(dressiness(look, "party"), {
    level: "smart",
    goal: "festive",
    short: true,
  });
});

test("a festive main piece meets a party and casual days get no meter", () => {
  const festive: Piece = {
    ...pick("olive-maxi-dress")[0]!,
    id: "festive",
    attributes: { formality: 5 },
  };
  assert.equal(dressiness([festive], "party")?.short, false);
  assert.equal(dressiness([festive], "everyday"), null);
  assert.equal(dressiness([festive], "gym"), null);
});
