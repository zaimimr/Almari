import { test } from "node:test";
import assert from "node:assert/strict";
import {
  emptyCloset,
  savePiece,
  type OutfitRequest,
  type Piece,
} from "./closet";
import { proposeWeatherTraits } from "./pieceWeather";
import { addSampleWardrobe } from "./samples";
import { evaluateOutfit } from "./styling";
import { confirmPiece } from "./wardrobe";

const owned = (
  piece: Partial<Piece> & Pick<Piece, "id" | "name" | "category">,
): Piece => ({
  photo: `${piece.id}.jpg`,
  createdAt: "2026-10-01T00:00:00Z",
  source: "owned",
  styles: ["western", "desi"],
  ...piece,
});

const save = (piece: Piece) => savePiece(emptyCloset, piece).pieces[0]!;
const weatherOf = (piece: Piece) => ({
  traits: piece.traits,
  sources: piece.sources,
});

const boots = owned({
  id: "boots",
  name: "Black boots",
  category: "shoes",
  kind: "boots",
});
const coat = owned({
  id: "coat",
  name: "Camel coat",
  category: "layer",
  kind: "coat",
});

const tunic = owned({
  id: "tunic",
  name: "Rose tunic",
  category: "tunic",
  kind: "tunic",
});
const trousers = owned({
  id: "trousers",
  name: "Grey trousers",
  category: "bottom",
  kind: "trousers",
});
const hijab = owned({
  id: "hijab",
  name: "Sand hijab",
  category: "hijab",
  kind: "hijab",
});
const closet = [tunic, trousers, boots, hijab, coat].reduce(
  savePiece,
  emptyCloset,
);
const ids = ["tunic", "trousers", "coat", "boots", "hijab"];
const outfitOf = (pieces: Piece[]) =>
  ids.map((id) => pieces.find((piece) => piece.id === id)!);

const request = (weather: OutfitRequest["weather"]): OutfitRequest => ({
  occasion: "work",
  style: "western",
  garmentType: null,
  keptIds: [],
  excludedIds: [],
  weather,
  hijab: "always",
  wardrobe: "owned",
});

test("warmth, rain and snow are proposed from fabric and subcategory and marked proposed", () => {
  assert.deepEqual(weatherOf(save(boots)), {
    traits: { rain: true, snow: true },
    sources: { rain: "proposed", snow: "proposed" },
  });
  assert.deepEqual(
    weatherOf(
      save(
        owned({
          id: "sandals",
          name: "Gold sandals",
          category: "shoes",
          kind: "sandals",
        }),
      ),
    ),
    {
      traits: { rain: false, snow: false },
      sources: { rain: "proposed", snow: "proposed" },
    },
  );
  assert.deepEqual(weatherOf(save(coat)), {
    traits: { warmth: "warm" },
    sources: { warmth: "proposed" },
  });
  const warmth = (
    piece: Partial<Piece> & Pick<Piece, "id" | "name" | "category">,
  ) => save(owned(piece)).traits?.warmth;
  assert.equal(
    warmth({
      id: "k",
      name: "Lawn kurta",
      category: "tunic",
      kind: "kurta",
      attributes: { fabric: "lawn" },
    }),
    "light",
  );
  assert.equal(
    warmth({
      id: "t",
      name: "Jersey top",
      category: "top",
      kind: "top",
      attributes: { fabric: "jersey" },
    }),
    "medium",
  );
  assert.equal(
    warmth({
      id: "s",
      name: "Wool shawl cardigan",
      category: "layer",
      kind: "cardigan",
      attributes: { fabric: "wool" },
    }),
    "warm",
  );
  assert.equal(
    warmth({
      id: "c",
      name: "Grey cardigan",
      category: "layer",
      kind: "cardigan",
    }),
    "medium",
  );
  assert.deepEqual(
    weatherOf(
      save(
        owned({
          id: "h",
          name: "Chiffon hijab",
          category: "hijab",
          kind: "hijab",
          attributes: { fabric: "chiffon" },
        }),
      ),
    ),
    { traits: undefined, sources: undefined },
  );
  const samples = addSampleWardrobe(emptyCloset);
  assert.equal(proposeWeatherTraits(samples), samples);
});

test("a confirmed or older value is never replaced by a proposal", () => {
  const confirmed = save(
    owned({
      id: "coat",
      name: "Camel coat",
      category: "layer",
      kind: "coat",
      attributes: { fabric: "wool" },
      traits: { warmth: "medium" },
      sources: { warmth: "confirmed" },
    }),
  );
  assert.equal(confirmed.traits?.warmth, "medium");
  assert.equal(confirmed.sources?.warmth, "confirmed");
  const legacy = save({ ...coat, traits: { warmth: "light" } });
  assert.equal(legacy.traits?.warmth, "light");
  assert.equal(legacy.sources, undefined);
  const lawn = save(
    owned({
      id: "kurta",
      name: "Kurta",
      category: "tunic",
      kind: "kurta",
      attributes: { fabric: "lawn" },
    }),
  );
  const wool = save({ ...lawn, attributes: { fabric: "wool" } });
  assert.equal(wool.traits?.warmth, "warm");
  assert.equal(wool.sources?.warmth, "proposed");
});

test("stored pieces get proposals once and an unchanged closet stays the same object", () => {
  const stored = savePiece(emptyCloset, boots);
  assert.equal(proposeWeatherTraits(stored), stored);
  const older = {
    ...stored,
    pieces: stored.pieces.map(
      ({ traits: _traits, sources: _sources, ...piece }) => piece,
    ),
  };
  assert.equal(
    proposeWeatherTraits(older).pieces[0]!.sources?.snow,
    "proposed",
  );
});

test("weather checks use only confirmed values and name what to check before wearing", () => {
  const manual = request({
    source: "manual",
    warmth: "cold",
    precipitation: "snow",
    exposure: "time-outside",
  });
  const problems = evaluateOutfit(
    outfitOf(closet.pieces),
    manual,
    closet.pieces,
  );
  assert.deepEqual(
    problems.map((problem) => problem.message),
    [
      "Camel coat looks warm enough, but you have not confirmed it.",
      "Black boots may suit snow, but you have not confirmed it.",
    ],
  );
  assert.ok(problems.every((problem) => problem.severity === "review"));
  assert.deepEqual(problems[1]!.actions, [
    { type: "edit-piece", id: "boots" },
    { type: "clear-weather" },
  ]);
  const sure = confirmPiece(
    confirmPiece(closet, "boots", { traits: { snow: true } }),
    "coat",
    { traits: { warmth: "warm" } },
  );
  assert.deepEqual(
    evaluateOutfit(outfitOf(sure.pieces), manual, sure.pieces),
    [],
  );
});

test("forecast weather is checked the same way, without a clear weather action", () => {
  const forecast = request({
    source: "forecast",
    warmth: "cold",
    precipitation: "snow",
    exposure: null,
    at: "2026-10-01T06:00:00.000Z",
  });
  const problems = evaluateOutfit(
    outfitOf(closet.pieces),
    forecast,
    closet.pieces,
  );
  assert.deepEqual(
    problems.map((problem) => problem.message),
    [
      "Camel coat looks warm enough, but you have not confirmed it.",
      "Black boots may suit snow, but you have not confirmed it.",
    ],
  );
  assert.deepEqual(problems[1]!.actions, [{ type: "edit-piece", id: "boots" }]);
  assert.equal(
    problems.some((problem) =>
      problem.actions.some((action) => action.type === "clear-weather"),
    ),
    false,
  );
  assert.deepEqual(
    evaluateOutfit(
      outfitOf(closet.pieces),
      request({ source: "unknown" }),
      closet.pieces,
    ),
    [],
  );
});
