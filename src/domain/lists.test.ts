import { test } from "node:test";
import assert from "node:assert/strict";
import {
  decodeCloset,
  emptyCloset,
  type Closet,
  type LabelScore,
  type Prepared,
} from "./closet";
import { filterPieces, noFilter } from "./closetFilters";
import { withCategory, withKind, withSeason, wearSeason } from "./facts";
import {
  acceptImports,
  correctImport,
  finishImport,
  queueImport,
  startImport,
} from "./importing";
import {
  addOwn,
  cleanLists,
  colourOf,
  colourSwatch,
  removeOwn,
  renameOwn,
  setLists,
} from "./lists";
import { piece, ownedCloset } from "./test-helpers";

const labels: LabelScore[] = [
  { group: "kind", value: "kurta", score: 0.14 },
  { group: "kind", value: "tunic", score: 0.1 },
  { group: "style", value: "desi", score: 0.09 },
];

const prepared: Prepared = {
  original: "job-original.jpg",
  cutout: "job.png",
  thumbnail: "job-thumb.png",
  frame: { x: 0.2, y: 0, width: 0.6, height: 1 },
  instances: 1,
  labels,
  palette: [{ rgb: [167, 174, 152], share: 1 }],
  embedding: null,
};

const finished = (base: Closet = emptyCloset) =>
  finishImport(
    startImport(
      queueImport(base, {
        id: "job",
        source: "job-original.jpg",
        createdAt: "2026-10-01T08:00:00Z",
      }),
      "job",
    ),
    "job",
    prepared,
  );

test("own values get stable ids, reuse built-in and duplicate names", () => {
  let closet: Closet = emptyCloset;
  const cloak = addOwn(closet, "kinds", {
    name: " Ponchokåpe ",
    category: "layer",
  });
  assert.equal(cloak.id, "own-kind-1");
  closet = cloak.closet;
  assert.deepEqual(closet.lists?.kinds, [
    { id: "own-kind-1", name: "Ponchokåpe", category: "layer" },
  ]);
  assert.equal(
    addOwn(closet, "kinds", { name: "ponchokåpe", category: "layer" }).id,
    "own-kind-1",
  );
  assert.equal(
    addOwn(closet, "kinds", { name: "Kåpe", category: "layer" }).id,
    "coat",
  );
  assert.equal(
    addOwn(closet, "kinds", { name: "Abaya", category: "dress" }).id,
    "abaya",
  );
  assert.equal(
    addOwn(closet, "colours", { name: "Svart", rgb: [1, 1, 1] }).id,
    "Black",
  );
  assert.equal(addOwn(closet, "fabrics", { name: "   " }).id, null);
  assert.equal(addOwn(closet, "colours", { name: "Dusty rose" }).id, null);
  const fabric = addOwn(closet, "fabrics", { name: "Bouclé" });
  assert.equal(fabric.id, "own-fabric-1");
  closet = renameOwn(fabric.closet, "fabrics", "own-fabric-1", "Boucle wool");
  assert.equal(closet.lists?.fabrics[0]?.name, "Boucle wool");
  assert.equal(renameOwn(closet, "fabrics", "own-fabric-1", " "), closet);
});

test("removing an own value clears it from pieces and drops empty lists", () => {
  const added = addOwn(emptyCloset, "fabrics", { name: "Bouclé" });
  setLists(added.closet.lists);
  let closet = ownedCloset(
    [piece("coat", "layer", { ownFabric: added.id! })],
    added.closet,
  );
  closet = removeOwn(closet, "fabrics", added.id!);
  assert.equal(closet.lists, undefined);
  assert.equal(closet.pieces[0]!.ownFabric, undefined);
  setLists(undefined);
});

test("stored lists are cleaned and dangling references dropped on load", () => {
  assert.equal(cleanLists("nope"), undefined);
  assert.deepEqual(
    cleanLists({
      colours: [
        { id: "own-colour-1", name: "Paprika", rgb: [180, 80, 40] },
        { id: "own-colour-1", name: "Twice", rgb: [1, 2, 3] },
        { id: "own-colour-2", name: "Bad", rgb: [300, 0, 0] },
      ],
      fabrics: [{ id: "bad id", name: "x" }],
      kinds: [{ id: "own-kind-1", name: "Ponchokåpe", category: "nowhere" }],
    }),
    {
      colours: [{ id: "own-colour-1", name: "Paprika", rgb: [180, 80, 40] }],
      fabrics: [],
      kinds: [],
    },
  );
  const stored = ownedCloset([
    piece("coat", "layer", {
      ownKind: "own-kind-9",
      ownFabric: "own-fabric-1",
    }),
  ]);
  const reopened = decodeCloset(
    JSON.stringify({
      ...stored,
      lists: { fabrics: [{ id: "own-fabric-1", name: "Bouclé" }], kinds: "x" },
    }),
  );
  assert.deepEqual(reopened.lists, {
    colours: [],
    fabrics: [{ id: "own-fabric-1", name: "Bouclé" }],
    kinds: [],
  });
  assert.equal(reopened.pieces[0]!.ownKind, undefined);
  assert.equal(reopened.pieces[0]!.ownFabric, "own-fabric-1");
  assert.equal(decodeCloset(JSON.stringify(stored)).lists, undefined);
});

test("own colours keep their rgb for naming, filters and styling", () => {
  const added = addOwn(emptyCloset, "colours", {
    name: "Paprika",
    rgb: [180, 80, 40],
  });
  setLists(added.closet.lists);
  assert.deepEqual(colourSwatch(added.id!).rgb, [180, 80, 40]);
  assert.equal(colourOf([180, 80, 40]), added.id);
  const closet = ownedCloset(
    [
      piece("rust", "top", { colors: [colourSwatch(added.id!)] }),
      piece("black", "top", { colors: [{ rgb: [10, 10, 10], share: 1 }] }),
    ],
    added.closet,
  );
  assert.deepEqual(
    filterPieces(closet.pieces, { ...noFilter, colour: added.id! }).map(
      (item) => item.id,
    ),
    ["rust"],
  );
  assert.deepEqual(
    filterPieces(closet.pieces, { ...noFilter, search: "papri" }).map(
      (item) => item.id,
    ),
    ["rust"],
  );
  setLists(undefined);
});

test("every guess can be overridden and becomes confirmed", () => {
  const hijab = piece("cloak", "hijab", {
    kind: "hijab",
    traits: { warmth: "light" },
    attributes: { fabric: "wool" },
    sources: { kind: "proposed", fabric: "confirmed", warmth: "proposed" },
  });
  const moved = withCategory(hijab, "layer");
  assert.equal(moved.category, "layer");
  assert.equal(moved.kind, undefined);
  assert.equal(moved.sources?.kind, undefined);
  assert.equal(moved.attributes?.fabric, "wool");
  const coat = withKind(moved, "coat");
  assert.equal(coat.kind, "coat");
  assert.equal(coat.sources?.kind, "confirmed");
  const winter = withSeason(coat, "winter");
  assert.deepEqual(wearSeason(winter), {
    season: "winter",
    source: "confirmed",
  });

  const added = addOwn(emptyCloset, "kinds", {
    name: "Ponchokåpe",
    category: "layer",
  });
  setLists(added.closet.lists);
  const own = withKind(hijab, added.id!);
  assert.equal(own.category, "layer");
  assert.equal(own.kind, undefined);
  assert.equal(own.ownKind, added.id);
  assert.equal(withKind(own, "coat").ownKind, undefined);
  setLists(undefined);
});

test("review overrides reach the saved piece as confirmed", () => {
  const kinds = addOwn(emptyCloset, "kinds", {
    name: "Ponchokåpe",
    category: "layer",
  });
  const fabrics = addOwn(kinds.closet, "fabrics", { name: "Bouclé" });
  setLists(fabrics.closet.lists);
  let closet = finished(fabrics.closet);
  closet = correctImport(closet, "job", {
    kind: "coat",
    ownKind: kinds.id,
    name: "Min kåpe",
    details: {
      attributes: { pattern: "solid", formality: 2 },
      sources: {
        pattern: "confirmed",
        formality: "proposed",
        warmth: "confirmed",
      },
      traits: { warmth: "warm" },
      ownFabric: fabrics.id!,
    },
  });
  const job = closet.imports[0]!;
  assert.equal(job.ownKind, kinds.id);
  assert.equal(job.ownFabric, fabrics.id);
  closet = acceptImports(closet);
  const saved = closet.pieces[0]!;
  assert.equal(saved.category, "layer");
  assert.equal(saved.kind, undefined);
  assert.equal(saved.ownKind, kinds.id);
  assert.equal(saved.ownFabric, fabrics.id);
  assert.equal(saved.attributes?.pattern, "solid");
  assert.equal(saved.sources?.pattern, "confirmed");
  assert.equal(saved.attributes?.fabric, undefined);
  assert.deepEqual(wearSeason(saved), {
    season: "winter",
    source: "confirmed",
  });
  setLists(undefined);
});
