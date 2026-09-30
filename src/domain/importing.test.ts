import { test } from "node:test";
import assert from "node:assert/strict";
import { decodeCloset, emptyCloset, type Prepared } from "./closet";
import {
  acceptImports,
  colorName,
  correctImport,
  failImport,
  finishImport,
  propose,
  queueImport,
  recoverImports,
  removeImport,
  retryImport,
  startImport,
} from "./importing";

const prepared = (changes: Partial<Prepared> = {}): Prepared => ({
  original: "job-original.jpg",
  cutout: "job.png",
  thumbnail: "job-thumb.png",
  frame: { x: 0.2, y: 0, width: 0.6, height: 1 },
  instances: 1,
  kinds: [
    { kind: "kurta", score: 0.14 },
    { kind: "tunic", score: 0.1 },
    { kind: "dress", score: 0.08 },
  ],
  color: [167, 174, 152],
  ...changes,
});

const queued = (id = "job") =>
  queueImport(emptyCloset, {
    id,
    source: `${id}-original.jpg`,
    createdAt: "2026-10-01T08:00:00Z",
  });

test("sample garment colours get the names a person would use", () => {
  const cases: [[number, number, number], string][] = [
    [[70, 70, 71], "Charcoal"],
    [[75, 51, 44], "Chocolate"],
    [[238, 235, 230], "Ivory"],
    [[151, 107, 112], "Mauve"],
    [[36, 45, 71], "Navy"],
    [[106, 109, 85], "Olive"],
    [[167, 174, 152], "Sage"],
    [[141, 118, 105], "Taupe"],
  ];
  for (const [rgb, name] of cases) assert.equal(colorName(rgb), name);
});

test("P01 a clear photo becomes a named, categorized piece without typing", () => {
  const proposal = propose(prepared());
  assert.equal(proposal.kind, "kurta");
  assert.equal(proposal.name, "Sage kurta");
  assert.deepEqual(proposal.checks, []);
  let closet = startImport(queued(), "job");
  closet = finishImport(closet, "job", prepared());
  assert.equal(closet.imports[0]!.state, "ready");
  closet = acceptImports(closet);
  assert.equal(closet.imports.length, 0);
  const piece = closet.pieces[0]!;
  assert.equal(piece.name, "Sage kurta");
  assert.equal(piece.category, "tunic");
  assert.equal(piece.kind, "kurta");
  assert.deepEqual(piece.styles, ["desi"]);
  assert.equal(piece.photo, "job.png");
  assert.equal(piece.original, "job-original.jpg");
  assert.deepEqual(piece.frame, prepared().frame);
  assert.equal(piece.source, "owned");
  assert.equal(piece.traits, undefined);
});

test("close calls, missing cutouts, and several garments ask for a quick check", () => {
  const close = propose(
    prepared({
      kinds: [
        { kind: "dupatta", score: 0.12 },
        { kind: "hijab", score: 0.116 },
      ],
    }),
  );
  assert.deepEqual(close.checks, ["uncertain"]);
  assert.deepEqual(close.alternatives, ["dupatta", "hijab"]);
  assert.deepEqual(propose(prepared({ cutout: null, color: null })).checks, [
    "no-cutout",
  ]);
  assert.equal(propose(prepared({ cutout: null, color: null })).name, "Kurta");
  assert.deepEqual(propose(prepared({ instances: 2 })).checks, ["several"]);

  let closet = finishImport(
    startImport(queued(), "job"),
    "job",
    prepared({
      kinds: [
        { kind: "dupatta", score: 0.12 },
        { kind: "hijab", score: 0.116 },
      ],
      color: [151, 107, 112],
    }),
  );
  assert.equal(closet.imports[0]!.state, "review");
  assert.equal(acceptImports(closet).pieces.length, 0);
  closet = correctImport(closet, "job", { kind: "hijab" });
  assert.equal(closet.imports[0]!.state, "ready");
  assert.equal(closet.imports[0]!.name, "Mauve hijab");
  closet = acceptImports(closet);
  assert.equal(closet.pieces[0]!.category, "hijab");
});

test("keep original saves the untouched photo without cutout bounds", () => {
  let closet = finishImport(startImport(queued(), "job"), "job", prepared());
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
