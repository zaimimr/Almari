import { test } from "node:test";
import assert from "node:assert/strict";
import {
  decodeCloset,
  emptyCloset,
  savePiece,
  type Closet,
  type LabelScore,
  type Piece,
  type Prepared,
} from "./closet";
import type { CareLabel } from "./careLabel";
import {
  acceptImports,
  correctImport,
  failImport,
  finishImport,
  finishRefresh,
  piecesToRefresh,
  queueImport,
  recoverImports,
  refreshPiece,
  removeImport,
  retryImport,
  setImportLabel,
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
  assert.deepEqual(piece.sources, {
    kind: "proposed",
    styles: "proposed",
    formality: "proposed",
  });
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
    formality: "proposed",
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
    formality: "proposed",
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

const embedding = "A".repeat(1024);

const withAttributes = (
  labels: LabelScore[],
  kinds: LabelScore[] = [
    { group: "kind", value: "kurta", score: 0.2 },
    { group: "kind", value: "tunic", score: 0.1 },
  ],
): Prepared => ({
  original: "job-original.jpg",
  cutout: "job.png",
  thumbnail: "job-thumb.png",
  frame: { x: 0.2, y: 0, width: 0.6, height: 1 },
  instances: 1,
  labels: [...kinds, ...labels],
  palette: [
    { rgb: [167, 174, 152], share: 0.7 },
    { rgb: [238, 235, 230], share: 0.2 },
  ],
  embedding,
});

const sureLength: LabelScore[] = [
  { group: "length", value: "knee", score: 0.12 },
  { group: "length", value: "calf", score: 0.09 },
  { group: "sleeve", value: "long", score: 0.11 },
  { group: "sleeve", value: "elbow", score: 0.08 },
  { group: "fabric", value: "lawn", score: 0.1 },
  { group: "fabric", value: "cotton", score: 0.099 },
];

const unsureLength: LabelScore[] = [
  { group: "length", value: "knee", score: 0.12 },
  { group: "length", value: "calf", score: 0.115 },
  { group: "sleeve", value: "long", score: 0.11 },
  { group: "sleeve", value: "elbow", score: 0.105 },
];

test("an imported piece keeps proposed attributes, its palette and its embedding", () => {
  let closet = finishImport(
    startImport(queued(), "job"),
    "job",
    withAttributes(sureLength),
  );
  const job = closet.imports[0]!;
  assert.equal(job.state, "ready");
  assert.equal(job.attributeCheck, undefined);
  assert.equal(job.name, "Sage kurta");
  closet = acceptImports(closet);
  const piece = closet.pieces[0]!;
  assert.equal(piece.attributes?.length, "knee");
  assert.equal(piece.attributes?.fabric, "lawn");
  assert.equal(piece.attributes?.formality, 2);
  assert.equal(piece.sources?.length, "proposed");
  assert.equal(piece.sources?.fabric, "proposed");
  assert.equal(piece.attributes?.sheer, undefined);
  assert.deepEqual(piece.colors, withAttributes([]).palette);
  assert.equal(piece.embedding, embedding);
});

test("an unsure length is the only quick check and her answer is stored as confirmed", () => {
  let closet = finishImport(
    startImport(queued(), "job"),
    "job",
    withAttributes(unsureLength),
  );
  assert.equal(closet.imports[0]!.state, "review");
  assert.deepEqual(closet.imports[0]!.checks, ["attribute"]);
  assert.equal(closet.imports[0]!.attributeCheck, "length");
  closet = correctImport(closet, "job", {
    attribute: { key: "length", value: "calf" },
  });
  assert.equal(closet.imports[0]!.state, "ready");
  assert.equal(closet.imports[0]!.attributeCheck, undefined);
  closet = acceptImports(closet);
  assert.equal(closet.pieces[0]!.attributes?.length, "calf");
  assert.equal(closet.pieces[0]!.sources?.length, "confirmed");
  assert.equal(closet.pieces[0]!.sources?.sleeve, "proposed");
});

test("a subcategory close call keeps the attribute question away", () => {
  const closet = finishImport(
    startImport(queued(), "job"),
    "job",
    withAttributes(unsureLength, [
      { group: "kind", value: "kurta", score: 0.14 },
      { group: "kind", value: "kameez", score: 0.135 },
    ]),
  );
  const job = closet.imports[0]!;
  assert.ok(job.checks?.includes("uncertain"));
  assert.equal(job.checks?.includes("attribute"), false);
  assert.equal(job.attributeCheck, undefined);
  assert.equal(job.attributes?.length, "knee");
});

test("correcting the subcategory re-proposes attributes and keeps confirmed answers that still apply", () => {
  let closet = finishImport(
    startImport(queued(), "job"),
    "job",
    withAttributes([
      ...sureLength,
      { group: "volume", value: "straight", score: 0.1 },
      { group: "volume", value: "fitted", score: 0.05 },
    ]),
  );
  closet = correctImport(closet, "job", {
    attribute: { key: "fabric", value: "silk" },
  });
  closet = correctImport(closet, "job", { kind: "trousers" });
  const job = closet.imports[0]!;
  assert.equal(job.attributes?.length, undefined);
  assert.equal(job.attributes?.sleeve, undefined);
  assert.equal(job.attributes?.fabric, "silk");
  assert.equal(job.attributeSources?.fabric, "confirmed");
  assert.equal(job.attributes?.volume, "straight");
  assert.equal(job.attributes?.formality, 3);
  assert.equal(job.name, "Sage trousers");
});

test("a piece without a cutout is named by its subcategory alone", () => {
  const closet = finishImport(startImport(queued(), "job"), "job", {
    ...withAttributes(sureLength),
    cutout: null,
    palette: [],
  });
  assert.equal(closet.imports[0]!.name, "Kurta");
  assert.equal(acceptImports(closet).pieces.length, 0);
});

test("re-preparing an owned piece fills attributes and keeps what she confirmed", () => {
  const old: Piece = {
    id: "old",
    name: "My kurta",
    category: "tunic",
    kind: "kurta",
    photo: "old.png",
    original: "old-original.jpg",
    createdAt: "2026-09-01T08:00:00Z",
    source: "owned",
    attributes: { length: "ankle", fabric: "cotton" },
    sources: { length: "confirmed", kind: "confirmed" },
  };
  const sample: Piece = {
    id: "sample",
    name: "Sample hijab",
    category: "hijab",
    photo: "sample.png",
    createdAt: old.createdAt,
    source: "sample",
  };
  const refreshed: Prepared = {
    ...withAttributes([
      { group: "length", value: "knee", score: 0.12 },
      { group: "length", value: "ankle", score: 0.09 },
      { group: "sleeve", value: "long", score: 0.1 },
      { group: "fabric", value: "silk", score: 0.1 },
    ]),
    original: "old-refresh-original.jpg",
    cutout: "old-refresh.png",
    palette: [{ rgb: [151, 107, 112], share: 0.8 }],
  };
  let closet: Closet = { ...emptyCloset, pieces: [old, sample] };
  assert.deepEqual(
    piecesToRefresh(closet).map((piece) => piece.id),
    ["old"],
  );
  closet = refreshPiece(closet, "old", refreshed);
  const piece = closet.pieces[0]!;
  assert.equal(piece.attributes?.length, "ankle");
  assert.equal(piece.sources?.length, "confirmed");
  assert.equal(piece.attributes?.fabric, "cotton");
  assert.equal(piece.sources?.fabric, undefined);
  assert.equal(piece.attributes?.sleeve, "long");
  assert.equal(piece.sources?.sleeve, "proposed");
  assert.equal(piece.attributes?.formality, 2);
  assert.equal(piece.sources?.kind, "confirmed");
  assert.equal(piece.name, "My kurta");
  assert.equal(piece.photo, "old.png");
  assert.equal(piece.original, "old-original.jpg");
  assert.equal(piece.embedding, embedding);
  assert.deepEqual(piece.colors, [{ rgb: [151, 107, 112], share: 0.8 }]);
  assert.deepEqual(closet.pieces[1], sample);
  assert.deepEqual(piecesToRefresh(closet), []);
  assert.equal(refreshPiece(closet, "gone", refreshed), closet);
  const done = finishRefresh({
    ...closet,
    pieces: [{ ...old, id: "failed" }, ...closet.pieces],
  });
  assert.equal(done.attributeRefresh, 1);
  assert.deepEqual(piecesToRefresh(done), []);
  assert.deepEqual(
    decodeCloset(JSON.stringify(savePiece(closet, piece))).pieces[0],
    piece,
  );
});

test("C20 a care label added in Check this piece goes with the piece", () => {
  const label: CareLabel = {
    photo: "job-label.jpg",
    materials: [
      { fibre: "cotton", percent: 95 },
      { fibre: "elastane", percent: 5 },
    ],
    size: "S",
  };
  let closet = startImport(queued(), "job");
  closet = finishImport(closet, "job", prepared());
  closet = correctImport(closet, "job", {});
  assert.equal(
    setImportLabel(
      failImport(startImport(queued("other"), "other"), "other", "processing"),
      "other",
      label,
    ).imports[0]!.label,
    undefined,
  );
  closet = setImportLabel(closet, "job", label);
  assert.deepEqual(closet.imports[0]!.label, label);
  assert.equal(
    setImportLabel(closet, "job", undefined).imports[0]!.label,
    undefined,
  );
  closet = acceptImports(closet);
  const piece = closet.pieces.find((item) => item.id === "job")!;
  assert.deepEqual(piece.label, label);
  assert.equal(piece.attributes?.fabric, "cotton");
  assert.equal(piece.sources?.fabric, "label");
  assert.deepEqual(
    decodeCloset(JSON.stringify(closet)).pieces[0]!.label,
    label,
  );
});

test("refreshing a piece whose photo was replaced measures colours and embedding again", () => {
  const replaced: Piece = {
    id: "swap",
    name: "Swap",
    category: "tunic",
    photo: "new.png",
    createdAt: "2026-10-01T08:00:00.000Z",
    source: "owned",
  };
  const prepared: Prepared = {
    ...withAttributes([]),
    original: "new-original.jpg",
    cutout: "new.png",
    palette: [{ rgb: [10, 20, 30], share: 1 }],
    embedding,
  };
  const closet = refreshPiece(
    { ...emptyCloset, pieces: [replaced] },
    "swap",
    prepared,
  );
  assert.equal(closet.pieces[0]!.embedding, embedding);
  assert.deepEqual(closet.pieces[0]!.colors, [{ rgb: [10, 20, 30], share: 1 }]);
});
