import { test } from "node:test";
import assert from "node:assert/strict";
import {
  decodeCloset,
  emptyCloset,
  type Closet,
  type Prepared,
} from "./closet";
import {
  acceptImports,
  correctImport,
  finishImport,
  queueImport,
  removeImport,
  startImport,
} from "./importing";
import {
  editedPhoto,
  importCutout,
  leftoverFiles,
  pieceCutout,
  replaceImportCutout,
  replacePieceCutout,
  type CutoutEdit,
} from "./cutout";

const area = { x: 0.1, y: -0.05, width: 0.7, height: 0.93 };

const prepared = (changes: Partial<Prepared> = {}): Prepared => ({
  original: "job-original.jpg",
  cutout: "job.png",
  enhanced: "job-enhanced.png",
  thumbnail: "job-thumb.png",
  frame: { x: 0.2, y: 0, width: 0.6, height: 1 },
  instances: 1,
  labels: [
    { group: "kind", value: "kurta", score: 0.14 },
    { group: "kind", value: "tunic", score: 0.1 },
    { group: "style", value: "desi", score: 0.09 },
  ],
  palette: [{ rgb: [167, 174, 152], share: 1 }],
  embedding: null,
  area,
  ...changes,
});

const finished = (changes: Partial<Prepared> = {}): Closet =>
  finishImport(
    startImport(
      queueImport(emptyCloset, {
        id: "job",
        source: "job-original.jpg",
        createdAt: "2026-10-01T08:00:00Z",
      }),
      "job",
    ),
    "job",
    prepared(changes),
  );

const edit: CutoutEdit = {
  cutout: "job-cut-1.png",
  enhanced: "job-cut-1-enhanced.png",
  thumbnail: "job-cut-1-thumb.png",
  frame: { x: 0.1, y: 0.05, width: 0.8, height: 0.9 },
  area: { x: 0.12, y: -0.04, width: 0.68, height: 0.9 },
};

test("a piece from a cut-out keeps where the cut-out sits on its original photo", () => {
  const piece = acceptImports(finished()).pieces[0]!;
  assert.deepEqual(piece.cutoutArea, area);
  assert.deepEqual(pieceCutout(piece), {
    original: "job-original.jpg",
    cutout: "job.png",
    area,
  });
  const older = acceptImports(finished({ area: undefined })).pieces[0]!;
  assert.equal(older.cutoutArea, undefined);
  assert.deepEqual(pieceCutout(older)?.area, null);
});

test("only pieces and imports with their original photo can be adjusted", () => {
  const kept = acceptImports(finished()).pieces[0]!;
  assert.equal(pieceCutout({ ...kept, original: undefined }), null);
  assert.equal(pieceCutout({ ...kept, variants: { plain: "job.png" } }), null);
  assert.equal(pieceCutout({ ...kept, source: "sample" }), null);
  const job = finished().imports[0]!;
  assert.deepEqual(importCutout(job), {
    original: "job-original.jpg",
    cutout: "job.png",
    area,
  });
  assert.equal(importCutout({ ...job, state: "preparing" }), null);
  assert.equal(importCutout(finished({ enhanced: null }).imports[0]!), null);
});

const uncut = (): Closet =>
  finished({
    cutout: null,
    enhanced: null,
    thumbnail: null,
    frame: null,
    area: undefined,
    palette: [],
  });

test("a piece or import with no cut-out can be cut out by hand from its original photo", () => {
  const closet = uncut();
  assert.deepEqual(importCutout(closet.imports[0]!), {
    original: "job-original.jpg",
    cutout: null,
    area: null,
  });
  const piece = acceptImports(
    correctImport(closet, "job", { keepOriginal: true }),
  ).pieces[0]!;
  assert.equal(piece.photo, "job-original.jpg");
  assert.deepEqual(pieceCutout(piece), {
    original: "job-original.jpg",
    cutout: null,
    area: null,
  });
});

test("cutting out an import by hand gives it the normal cut-out photos", () => {
  const closet = uncut();
  const before = { ...closet.imports[0]!, keepOriginal: true };
  assert.deepEqual(before.checks, ["no-cutout"]);
  const next = replaceImportCutout(
    { ...closet, imports: [before] },
    "job",
    edit,
  );
  const job = next.imports[0]!;
  assert.equal(job.prepared?.cutout, "job-cut-1.png");
  assert.equal(job.prepared?.enhanced, "job-cut-1-enhanced.png");
  assert.equal(job.prepared?.thumbnail, "job-cut-1-thumb.png");
  assert.deepEqual(job.prepared?.area, edit.area);
  assert.deepEqual(job.checks, []);
  assert.equal(job.keepOriginal, undefined);
  assert.deepEqual(importCutout(job)?.cutout, "job-cut-1.png");
  const piece = acceptImports(
    correctImport(next, "job", { variant: "enhanced" }),
  ).pieces[0]!;
  assert.equal(piece.photo, "job-cut-1-enhanced.png");
  assert.deepEqual(piece.variants, {
    enhanced: "job-cut-1-enhanced.png",
    plain: "job-cut-1.png",
  });
  assert.deepEqual(piece.frame, edit.frame);
});

test("cutting out a piece by hand switches it from the original photo to the enhanced cut-out", () => {
  const closet = acceptImports(
    correctImport(uncut(), "job", { keepOriginal: true }),
  );
  const next = replacePieceCutout(closet, "job", edit);
  const piece = next.pieces[0]!;
  assert.equal(piece.photo, "job-cut-1-enhanced.png");
  assert.deepEqual(piece.variants, {
    enhanced: "job-cut-1-enhanced.png",
    plain: "job-cut-1.png",
  });
  assert.deepEqual(piece.frame, edit.frame);
  assert.deepEqual(piece.cutoutArea, edit.area);
  assert.equal(piece.original, "job-original.jpg");
  assert.deepEqual(pieceCutout(piece)?.cutout, "job-cut-1.png");
  assert.deepEqual(leftoverFiles(closet, next, edit), ["job-cut-1-thumb.png"]);
});

test("an adjusted cut-out replaces the plain and enhanced photos of the piece she sees", () => {
  const closet = acceptImports(finished());
  const piece = closet.pieces[0]!;
  assert.equal(piece.photo, "job-enhanced.png");
  const next = replacePieceCutout(closet, piece.id, edit);
  const changed = next.pieces[0]!;
  assert.equal(changed.photo, "job-cut-1-enhanced.png");
  assert.deepEqual(changed.variants, {
    enhanced: "job-cut-1-enhanced.png",
    plain: "job-cut-1.png",
  });
  assert.deepEqual(changed.frame, edit.frame);
  assert.deepEqual(changed.cutoutArea, edit.area);
  assert.equal(changed.original, "job-original.jpg");
  assert.deepEqual(
    decodeCloset(JSON.stringify(next)).pieces[0]!.cutoutArea,
    edit.area,
  );
  const plain = replacePieceCutout(
    { ...closet, pieces: [{ ...piece, photo: "job.png" }] },
    piece.id,
    edit,
  );
  assert.equal(plain.pieces[0]!.photo, "job-cut-1.png");
});

test("a studio photo stays chosen when the cut-out is adjusted", () => {
  const closet = acceptImports(finished());
  const piece = {
    ...closet.pieces[0]!,
    photo: "job-studio.jpg",
    variants: {
      ...closet.pieces[0]!.variants,
      studio: "job-studio.jpg",
    },
  };
  const next = replacePieceCutout(
    { ...closet, pieces: [piece] },
    piece.id,
    edit,
  );
  assert.equal(next.pieces[0]!.photo, "job-studio.jpg");
  assert.equal(next.pieces[0]!.variants?.studio, "job-studio.jpg");
  assert.equal(next.pieces[0]!.variants?.plain, "job-cut-1.png");
});

test("an adjusted cut-out on an import replaces every prepared cut-out file", () => {
  const closet = finished();
  const next = replaceImportCutout(closet, "job", edit);
  const job = next.imports[0]!;
  assert.equal(job.prepared?.cutout, "job-cut-1.png");
  assert.equal(job.prepared?.enhanced, "job-cut-1-enhanced.png");
  assert.equal(job.prepared?.thumbnail, "job-cut-1-thumb.png");
  assert.deepEqual(job.prepared?.frame, edit.frame);
  assert.deepEqual(job.prepared?.area, edit.area);
  assert.equal(job.prepared?.original, "job-original.jpg");
  assert.deepEqual(job.prepared?.labels, closet.imports[0]!.prepared?.labels);
  assert.equal(job.state, closet.imports[0]!.state);
  assert.deepEqual(
    decodeCloset(JSON.stringify(next)).imports[0]!.prepared?.area,
    edit.area,
  );
  const piece = acceptImports(next).pieces[0]!;
  assert.equal(piece.photo, "job-cut-1-enhanced.png");
  assert.deepEqual(piece.cutoutArea, edit.area);
});

test("the old cut-out files are cleaned up and the new ones are kept", () => {
  const closet = finished();
  const next = replaceImportCutout(closet, "job", edit);
  assert.deepEqual(leftoverFiles(closet, next, edit).sort(), [
    "job-enhanced.png",
    "job-thumb.png",
    "job.png",
  ]);
  const pieces = acceptImports(closet);
  const changed = replacePieceCutout(pieces, "job", edit);
  assert.deepEqual(leftoverFiles(pieces, changed, edit).sort(), [
    "job-cut-1-thumb.png",
    "job-enhanced.png",
    "job.png",
  ]);
});

test("a cut-out made for a piece that is gone is thrown away", () => {
  const closet = removeImport(finished(), "job");
  const next = replaceImportCutout(closet, "job", edit);
  assert.equal(next, closet);
  assert.deepEqual(replacePieceCutout(closet, "job", edit), closet);
  assert.deepEqual(leftoverFiles(closet, next, edit).sort(), [
    "job-cut-1-enhanced.png",
    "job-cut-1-thumb.png",
    "job-cut-1.png",
  ]);
});

test("the photo chosen in the editor follows the adjusted cut-out", () => {
  const before = {
    enhanced: "a-enhanced.png",
    plain: "a.png",
    studio: "s.jpg",
  };
  const after = { enhanced: "b-enhanced.png", plain: "b.png", studio: "s.jpg" };
  assert.equal(editedPhoto("a.png", before, after), "b.png");
  assert.equal(editedPhoto("a-enhanced.png", before, after), "b-enhanced.png");
  assert.equal(editedPhoto("s.jpg", before, after), "s.jpg");
  assert.equal(editedPhoto("a.png", before, undefined), "a.png");
  assert.equal(editedPhoto("o.jpg", undefined, after), "b-enhanced.png");
});
