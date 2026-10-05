import { test } from "node:test";
import assert from "node:assert/strict";
import { emptyCloset, type Closet, type Piece, type Prepared } from "./closet";
import {
  acceptImports,
  finishImport,
  queueImport,
  startImport,
} from "./importing";
import {
  backgroundFix,
  hasBackground,
  opaqueStudios,
  replacePhotoFile,
  toCutout,
  withCutout,
} from "./background";
import type { CutoutEdit } from "./cutout";

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
  ],
  palette: [{ rgb: [167, 174, 152], share: 1 }],
  embedding: null,
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

const withPiece = (changes: Partial<Piece>): Closet => {
  const closet = acceptImports(finished());
  return {
    ...closet,
    pieces: closet.pieces.map((piece) => ({ ...piece, ...changes })),
  };
};

const edit: CutoutEdit = {
  cutout: "job-cut-1.png",
  enhanced: "job-cut-1-enhanced.png",
  thumbnail: "job-cut-1-thumb.png",
  frame: { x: 0.1, y: 0.05, width: 0.8, height: 0.9 },
  area: { x: 0.12, y: -0.04, width: 0.68, height: 0.9 },
};

test("only owned pieces showing an opaque photo still have a background", () => {
  const piece = acceptImports(finished()).pieces[0]!;
  assert.equal(hasBackground(piece), false);
  assert.equal(hasBackground({ ...piece, photo: "job-original.jpg" }), true);
  assert.equal(
    hasBackground({ ...piece, photo: "job-original.jpg", source: "sample" }),
    false,
  );
});

test("the fix depends on what the piece already has", () => {
  const piece = acceptImports(finished()).pieces[0]!;
  assert.equal(backgroundFix(piece), null);
  assert.equal(
    backgroundFix({
      ...piece,
      photo: "job-studio.jpg",
      variants: { ...piece.variants, studio: "job-studio.jpg" },
    }),
    "studio",
  );
  assert.equal(
    backgroundFix({ ...piece, photo: "job-original.jpg" }),
    "cutout",
  );
  assert.equal(
    backgroundFix({ ...piece, photo: "job-original.jpg", variants: {} }),
    "prepare",
  );
});

test("opaque studio images are found once across pieces and imports", () => {
  const closet = withPiece({
    variants: { plain: "job.png", studio: "job-studio.jpg" },
  });
  const job = finished({ studio: "job-studio.jpg" }).imports[0]!;
  const other = {
    ...job,
    id: "other",
    prepared: { ...job.prepared!, studio: "other-studio.png" },
  };
  assert.deepEqual(opaqueStudios({ ...closet, imports: [job, other] }), [
    "job-studio.jpg",
  ]);
});

test("a cleared studio file replaces every use of the old one", () => {
  const closet = withPiece({
    photo: "job-studio.jpg",
    variants: { plain: "job.png", studio: "job-studio.jpg" },
  });
  const job = finished({ studio: "job-studio.jpg" }).imports[0]!;
  const next = replacePhotoFile(
    { ...closet, imports: [job] },
    "job-studio.jpg",
    "job-clear.png",
  );
  assert.equal(next.pieces[0]!.photo, "job-clear.png");
  assert.equal(next.pieces[0]!.variants?.studio, "job-clear.png");
  assert.equal(next.pieces[0]!.variants?.plain, "job.png");
  assert.equal(next.imports[0]!.prepared?.studio, "job-clear.png");
  assert.equal(replacePhotoFile(next, "job-studio.jpg", "x.png"), next);
});

test("a piece with a cut-out switches its photo to it", () => {
  const closet = withPiece({ photo: "job-original.jpg" });
  const next = toCutout(closet, closet.pieces[0]!.id);
  assert.equal(next.pieces[0]!.photo, "job-enhanced.png");
  assert.equal(toCutout(next, next.pieces[0]!.id), next);
});

test("a new cut-out is kept and shown only for a piece with a background", () => {
  const closet = withPiece({
    photo: "job-original.jpg",
    original: undefined,
    variants: undefined,
  });
  const id = closet.pieces[0]!.id;
  const next = withCutout(closet, id, edit);
  const piece = next.pieces[0]!;
  assert.equal(piece.original, "job-original.jpg");
  assert.equal(hasBackground(piece), false);
  assert.equal(withCutout(next, id, edit), next);
});
