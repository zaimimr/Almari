import { test } from "node:test";
import assert from "node:assert/strict";
import {
  decodeCloset,
  emptyCloset,
  type LabelScore,
  type Prepared,
} from "./closet";
import {
  acceptImports,
  correctImport,
  failImport,
  finishImport,
  queueImport,
  recoverImports,
  removeImport,
  retryImport,
  startImport,
} from "./importing";

const kurtaLabels: LabelScore[] = [
  { group: "kind", value: "kurta", score: 0.14 },
  { group: "kind", value: "tunic", score: 0.1 },
  { group: "kind", value: "dress", score: 0.08 },
  { group: "style", value: "desi", score: 0.09 },
  { group: "style", value: "western", score: 0.05 },
];

const closeLabels: LabelScore[] = [
  { group: "kind", value: "dupatta", score: 0.12 },
  { group: "kind", value: "hijab", score: 0.116 },
];

const prepared = (changes: Partial<Prepared> = {}): Prepared => ({
  original: "job-original.jpg",
  cutout: "job.png",
  thumbnail: "job-thumb.png",
  frame: { x: 0.2, y: 0, width: 0.6, height: 1 },
  instances: 1,
  labels: kurtaLabels,
  palette: [{ rgb: [167, 174, 152], share: 1 }],
  embedding: null,
  ...changes,
});

const queued = (id = "job") =>
  queueImport(emptyCloset, {
    id,
    source: `${id}-original.jpg`,
    createdAt: "2026-10-01T08:00:00Z",
  });

const finished = (changes: Partial<Prepared> = {}) =>
  finishImport(startImport(queued(), "job"), "job", prepared(changes));

test("P01 a clear photo becomes a named piece with category, subcategory and style without typing", () => {
  let closet = finished();
  const job = closet.imports[0]!;
  assert.equal(job.state, "ready");
  assert.equal(job.name, "Sage kurta");
  assert.equal(job.question, undefined);
  assert.deepEqual(job.checks, []);
  closet = acceptImports(closet);
  assert.equal(closet.imports.length, 0);
  const piece = closet.pieces[0]!;
  assert.equal(piece.name, "Sage kurta");
  assert.equal(piece.category, "tunic");
  assert.equal(piece.kind, "kurta");
  assert.deepEqual(piece.styles, ["desi"]);
  assert.deepEqual(piece.sources, { kind: "proposed", styles: "proposed" });
  assert.equal(piece.photo, "job.png");
  assert.equal(piece.original, "job-original.jpg");
  assert.deepEqual(piece.frame, prepared().frame);
  assert.equal(piece.source, "owned");
  assert.equal(piece.traits, undefined);
});

test("close calls, missing cutouts, and several garments ask for a quick check", () => {
  let closet = finished({
    labels: closeLabels,
    palette: [{ rgb: [151, 107, 112], share: 1 }],
  });
  let job = closet.imports[0]!;
  assert.equal(job.state, "review");
  assert.deepEqual(job.checks, ["uncertain"]);
  assert.equal(job.question, "category");
  assert.equal(acceptImports(closet).pieces.length, 0);
  const plain = finished({ cutout: null, palette: [] }).imports[0]!;
  assert.deepEqual(plain.checks, ["no-cutout"]);
  assert.equal(plain.name, "Kurta");
  assert.deepEqual(finished({ instances: 2 }).imports[0]!.checks, ["several"]);

  closet = correctImport(closet, "job", { kind: "hijab" });
  job = closet.imports[0]!;
  assert.equal(job.state, "ready");
  assert.equal(job.name, "Mauve hijab");
  assert.equal(job.question, undefined);
  closet = acceptImports(closet);
  assert.equal(closet.pieces[0]!.category, "hijab");
  assert.deepEqual(closet.pieces[0]!.styles, ["western", "desi"]);
  assert.deepEqual(closet.pieces[0]!.sources, {
    kind: "confirmed",
    styles: "confirmed",
  });
});

test("a style she picks in review is stored as confirmed", () => {
  const unsure: LabelScore[] = [
    { group: "kind", value: "trousers", score: 0.14 },
    { group: "kind", value: "skirt", score: 0.1 },
    { group: "style", value: "western", score: 0.07 },
    { group: "style", value: "desi", score: 0.069 },
  ];
  let closet = finished({ labels: unsure });
  assert.equal(closet.imports[0]!.question, "style");
  assert.deepEqual(closet.imports[0]!.styles, ["western"]);
  closet = acceptImports(correctImport(closet, "job", { styles: ["desi"] }));
  assert.deepEqual(closet.pieces[0]!.styles, ["desi"]);
  assert.deepEqual(closet.pieces[0]!.sources, {
    kind: "proposed",
    styles: "confirmed",
  });
});

test("keep original saves the untouched photo without cutout bounds", () => {
  let closet = finished();
  closet = acceptImports(correctImport(closet, "job", { keepOriginal: true }));
  assert.equal(closet.pieces[0]!.photo, "job-original.jpg");
  assert.equal(closet.pieces[0]!.frame, undefined);
});

test("P07 retries and repeated saves create one piece and late results cannot revive a removed photo", () => {
  let closet = queued();
  assert.equal(
    queueImport(closet, {
      id: "job",
      source: "x",
      createdAt: "2026-10-01T08:00:00Z",
    }),
    closet,
  );
  closet = startImport(closet, "job");
  closet = failImport(closet, "job", "processing");
  assert.equal(closet.imports[0]!.state, "failed");
  closet = startImport(retryImport(closet, "job"), "job");
  assert.equal(closet.imports[0]!.attempts, 2);
  closet = finishImport(closet, "job", prepared());
  const once = acceptImports(closet);
  const twice = acceptImports({ ...once, imports: closet.imports });
  assert.equal(twice.pieces.length, 1);
  assert.equal(twice.imports.length, 0);

  const removed = removeImport(startImport(queued(), "job"), "job");
  assert.equal(finishImport(removed, "job", prepared()), removed);
  assert.equal(removed.imports.length, 0);
});

test("a restart puts unfinished work back in the queue and keeps partial batches", () => {
  let closet = ["a", "b", "c"].reduce(
    (current, id) =>
      queueImport(current, {
        id,
        source: `${id}-original.jpg`,
        createdAt: "2026-10-01T08:00:00Z",
      }),
    emptyCloset,
  );
  closet = finishImport(startImport(closet, "a"), "a", prepared());
  closet = startImport(closet, "b");
  const restarted = decodeCloset(JSON.stringify(recoverImports(closet)));
  assert.deepEqual(
    restarted.imports.map((job) => job.state),
    ["ready", "queued", "queued"],
  );
  const saved = acceptImports(restarted);
  assert.equal(saved.pieces.length, 1);
  assert.deepEqual(
    saved.imports.map((job) => job.id),
    ["b", "c"],
  );
});

test("a closet saved before imports existed still opens", () => {
  const { imports: _imports, ...older } = emptyCloset;
  assert.deepEqual(decodeCloset(JSON.stringify(older)).imports, []);
});
