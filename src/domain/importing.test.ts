import { test } from "node:test";
import assert from "node:assert/strict";
import {
  decodeCloset,
  emptyCloset,
  garmentKinds,
  removePiece,
  savePiece,
  type Closet,
  type GarmentRegion,
  type LabelScore,
  type Piece,
  type Prepared,
} from "./closet";
import type { CareLabel } from "./careLabel";
import { proposalsFromRegions, unparsedCapture } from "./capture";
import {
  acceptImports,
  addToCapture,
  captureJobs,
  correctImport,
  cropCapture,
  dismissAdvice,
  failImport,
  finishImport,
  fileStem,
  filesInUse,
  finishRefresh,
  importFailure,
  isSettled,
  keepDuplicate,
  jobStem,
  orphanedFiles,
  piecesToRefresh,
  queueImport,
  recoverImports,
  refreshPiece,
  removeImport,
  retakeImport,
  retryImport,
  setImportLabel,
  splitCapture,
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

const region = (
  kind: GarmentRegion["kind"],
  index: number,
  partial = false,
): GarmentRegion => ({
  kind,
  cutout: `job-region-${index}.png`,
  frame: { x: 0.25, y: 0.125 * index, width: 0.5, height: 0.125 },
  share: 0.1,
  partial,
});

const splitOutfit = (people = 1) =>
  splitCapture(
    startImport(queued(), "job"),
    "job",
    proposalsFromRegions([region("upper", 1), region("pants", 2)], people),
  );

test("one photo of an outfit becomes one job per piece sharing the capture", () => {
  const start = startImport(
    queueImport(queued(), {
      id: "later",
      source: "later-original.jpg",
      createdAt: "2026-10-01T08:01:00Z",
    }),
    "job",
  );
  const closet = splitCapture(
    start,
    "job",
    proposalsFromRegions(
      [region("upper", 1), region("pants", 2), region("head", 3)],
      2,
    ),
  );
  assert.deepEqual(
    closet.imports.map((job) => job.id),
    ["job", "job-2", "job-3", "later"],
  );
  const parts = closet.imports.slice(0, 3);
  assert.deepEqual(
    parts.map((job) => job.region?.kind),
    ["head", "upper", "pants"],
  );
  for (const job of parts) {
    assert.equal(job.captureId, "job");
    assert.equal(job.source, "job-original.jpg");
    assert.equal(job.state, "queued");
    assert.equal(job.attempts, 0);
    assert.equal(job.people, 2);
    assert.equal(jobStem(job), job.id);
  }
  assert.equal(closet.imports[3]!.captureId, undefined);
  assert.deepEqual(
    captureJobs(closet, "job").map((job) => job.id),
    ["job", "job-2", "job-3"],
  );
  assert.equal(
    splitCapture(closet, "job", proposalsFromRegions([], 0)),
    closet,
  );
  assert.deepEqual(
    decodeCloset(JSON.stringify(closet)).imports,
    closet.imports,
  );
});

test("a single-garment photo keeps the existing cutout path", () => {
  const closet = splitCapture(
    startImport(queued(), "job"),
    "job",
    proposalsFromRegions([region("dress", 1)], 0),
  );
  assert.equal(closet.imports.length, 1);
  const job = closet.imports[0]!;
  assert.equal(job.captureId, "job");
  assert.equal(job.region, undefined);
  assert.equal(job.state, "queued");
  assert.equal(jobStem(job), "job");
  assert.deepEqual(captureJobs(closet, "job"), []);
});

test("a parse result for a removed photo changes nothing", () => {
  const removed = removeImport(startImport(queued(), "job"), "job");
  assert.equal(
    splitCapture(removed, "job", proposalsFromRegions([region("upper", 1)], 1)),
    removed,
  );
  const waiting = queued();
  assert.equal(
    splitCapture(waiting, "job", proposalsFromRegions([region("upper", 1)], 1)),
    waiting,
  );
});

test("a head region becomes a hijab and a partly hidden top gets a quick check", () => {
  let closet = splitCapture(
    startImport(queued(), "job"),
    "job",
    proposalsFromRegions([region("upper", 2, true), region("head", 1)], 1),
  );
  closet = finishImport(
    startImport(closet, "job"),
    "job",
    prepared({
      labels: [
        { group: "kind", value: "top", score: 0.3 },
        { group: "kind", value: "hijab", score: 0.2 },
      ],
    }),
  );
  const head = closet.imports.find((job) => job.id === "job")!;
  assert.equal(
    garmentKinds.find((kind) => kind.id === head.kind)?.category,
    "hijab",
  );
  closet = finishImport(startImport(closet, "job-2"), "job-2", prepared());
  const top = closet.imports.find((job) => job.id === "job-2")!;
  assert.equal(top.state, "review");
  assert.ok(top.checks?.includes("partial"));
  closet = correctImport(closet, "job-2", { name: "Ivory top" });
  assert.equal(
    closet.imports.find((job) => job.id === "job-2")!.state,
    "ready",
  );
  const saved = acceptImports(closet);
  assert.equal(
    saved.pieces.find((piece) => piece.id === "job-2")?.captureId,
    "job",
  );
});

test("a box drawn by hand prepares a piece again or adds one that was missed", () => {
  let closet = splitOutfit();
  closet = finishImport(startImport(closet, "job"), "job", prepared());
  const box = { x: 0.25, y: 0.25, width: 0.5, height: 0.5 };
  const cropped = cropCapture(closet, "job", box, "job-crop-1");
  const job = cropped.imports[0]!;
  assert.equal(job.state, "queued");
  assert.equal(job.attempts, 0);
  assert.deepEqual(job.crop, box);
  assert.equal(job.prepared, undefined);
  assert.equal(job.kind, undefined);
  assert.equal(job.region?.kind, "upper");
  assert.equal(job.captureId, "job");
  assert.equal(cropCapture(cropped, "job", box, "job-crop-2"), cropped);
  const added = addToCapture(
    cropped,
    "job",
    "extra",
    box,
    "2026-10-01T09:00:00Z",
  );
  const extra = added.imports.find((item) => item.id === "extra")!;
  assert.equal(extra.source, "job-original.jpg");
  assert.equal(extra.captureId, "job");
  assert.equal(extra.state, "queued");
  assert.equal(extra.people, 1);
  assert.equal(extra.region, undefined);
  assert.equal(jobStem(extra), "extra");
  assert.deepEqual(
    captureJobs(added, "job").map((item) => item.id),
    ["job", "job-2", "extra"],
  );
  assert.equal(addToCapture(added, "missing", "other", box, "x"), added);
  assert.equal(addToCapture(added, "job", "extra", box, "x"), added);
});

test("a piece cropped again is prepared under fresh file names", () => {
  let closet = splitOutfit();
  closet = finishImport(startImport(closet, "job"), "job", prepared());
  const box = { x: 0.25, y: 0.25, width: 0.5, height: 0.5 };
  closet = cropCapture(closet, "job", box, "job-crop-1");
  assert.equal(jobStem(closet.imports[0]!), "job-crop-1");
  closet = finishImport(
    startImport(closet, "job"),
    "job",
    prepared({ original: "job-crop-1-original.jpg", cutout: "job-crop-1.png" }),
  );
  const again = cropCapture(closet, "job", box, "job-crop-2");
  assert.equal(jobStem(again.imports[0]!), "job-crop-2");
  assert.ok(
    !orphanedFiles(closet, again).some((file) => file.startsWith("job-crop-2")),
  );
  assert.deepEqual(decodeCloset(JSON.stringify(again)).imports, again.imports);
  const retaken = retakeImport(again, "job", "second-original.jpg");
  assert.equal(retaken, again);
  const ready = finishImport(startImport(again, "job"), "job", prepared());
  const fresh = retakeImport(ready, "job", "second-original.jpg");
  assert.equal(jobStem(fresh.imports[0]!), "second");
});

test("only a piece that finished preparing can be changed", () => {
  let closet = queued();
  assert.equal(isSettled(closet.imports[0]!), false);
  closet = startImport(closet, "job");
  assert.equal(isSettled(closet.imports[0]!), false);
  assert.equal(
    isSettled(finishImport(closet, "job", prepared()).imports[0]!),
    true,
  );
  assert.equal(
    isSettled(failImport(closet, "job", "processing").imports[0]!),
    true,
  );
});

test("a hand drawn box clears the partly visible check and keeps the care label", () => {
  const label: CareLabel = {
    photo: "job-label.jpg",
    materials: [{ fibre: "cotton", percent: 100 }],
  };
  let closet = splitCapture(
    startImport(queued(), "job"),
    "job",
    proposalsFromRegions([region("upper", 1, true)], 1),
  );
  closet = finishImport(startImport(closet, "job"), "job", prepared());
  closet = setImportLabel(closet, "job", label);
  const box = { x: 0.1, y: 0.1, width: 0.8, height: 0.8 };
  const job = cropCapture(closet, "job", box, "job-crop-1").imports[0]!;
  assert.equal(job.region?.partial, false);
  assert.equal(job.region?.kind, "upper");
  assert.deepEqual(job.label, label);
});

test("dropping one piece from a photo keeps the files the others still use", () => {
  let closet = splitOutfit();
  closet = finishImport(startImport(closet, "job"), "job", prepared());
  closet = finishImport(
    startImport(closet, "job-2"),
    "job-2",
    prepared({
      original: "job-2-original.jpg",
      cutout: "job-2.png",
      thumbnail: "job-2-thumb.png",
    }),
  );
  const dropped = removeImport(closet, "job-2");
  assert.deepEqual(orphanedFiles(closet, dropped).sort(), [
    "job-2-original.jpg",
    "job-2-thumb.png",
    "job-2.png",
    "job-region-2.png",
  ]);
  assert.deepEqual(orphanedFiles(dropped, acceptImports(dropped)).sort(), [
    "job-region-1.png",
    "job-thumb.png",
  ]);
  assert.deepEqual(
    orphanedFiles(dropped, removeImport(dropped, "job")).sort(),
    ["job-original.jpg", "job-region-1.png", "job-thumb.png", "job.png"],
  );
});

test("file stems keep retaken and split files apart", () => {
  assert.equal(fileStem("job-original.jpg"), "job");
  assert.equal(fileStem("b2c1-original.heic"), "b2c1");
  assert.equal(fileStem("plain.png"), "plain");
  assert.equal(fileStem("plain"), "plain");
});

test("a stored job with an unknown region kind is rejected", () => {
  const stored = JSON.parse(JSON.stringify(splitOutfit()));
  stored.imports[0].region.kind = "gloves";
  assert.throws(() => decodeCloset(JSON.stringify(stored)));
});

test("the enhanced image is the default and the plain cutout is kept", () => {
  let closet = finishImport(
    startImport(queued(), "job"),
    "job",
    prepared({ enhanced: "job-enhanced.png" }),
  );
  const enhanced = acceptImports(closet).pieces[0]!;
  assert.equal(enhanced.photo, "job-enhanced.png");
  assert.deepEqual(enhanced.variants, {
    enhanced: "job-enhanced.png",
    plain: "job.png",
  });
  closet = correctImport(closet, "job", { variant: "plain" });
  const plain = acceptImports(closet).pieces[0]!;
  assert.equal(plain.photo, "job.png");
  assert.deepEqual(plain.variants, enhanced.variants);
  const original = acceptImports(
    correctImport(closet, "job", { keepOriginal: true }),
  ).pieces[0]!;
  assert.equal(original.photo, "job-original.jpg");
  assert.equal(original.variants, undefined);
  const without = acceptImports(
    finishImport(startImport(queued(), "job"), "job", prepared()),
  ).pieces[0]!;
  assert.equal(without.photo, "job.png");
  assert.equal(without.variants, undefined);
  assert.deepEqual(orphanedFiles(closet, acceptImports(closet)), [
    "job-thumb.png",
  ]);
  assert.deepEqual(orphanedFiles(closet, removeImport(closet, "job")).sort(), [
    "job-enhanced.png",
    "job-original.jpg",
    "job-thumb.png",
    "job.png",
  ]);
});

test("import jobs saved before enhancement still open", () => {
  const closet = finishImport(startImport(queued(), "job"), "job", prepared());
  const stored = JSON.parse(JSON.stringify(closet));
  assert.equal(
    decodeCloset(JSON.stringify(stored)).imports[0]!.prepared!.enhanced,
    undefined,
  );
  stored.imports[0].prepared.enhanced = null;
  stored.imports[0].prepared.quality = {
    sharpness: 120,
    brightness: 0.5,
    clipped: ["top"],
  };
  assert.deepEqual(
    decodeCloset(JSON.stringify(stored)).imports[0]!.prepared!.quality,
    { sharpness: 120, brightness: 0.5, clipped: ["top"] },
  );
  stored.imports[0].prepared.quality = { sharpness: "sharp" };
  assert.throws(() => decodeCloset(JSON.stringify(stored)));
});

const blurry = () =>
  prepared({
    quality: {
      sharpness: 12,
      brightness: 0.5,
      clipped: [],
      coverage: 0.3,
      lightSpread: 1,
    },
  });

test("P05 photo advice is shown once and never blocks saving", () => {
  let closet = finishImport(startImport(queued(), "job"), "job", blurry());
  assert.equal(closet.imports[0]!.advice, "blur");
  assert.equal(closet.imports[0]!.state, "ready");
  assert.equal(acceptImports(closet).pieces.length, 1);
  closet = dismissAdvice(closet, "job");
  assert.equal(closet.imports[0]!.advice, undefined);
  assert.deepEqual(closet.imports[0]!.adviceShown, ["blur"]);
  assert.equal(dismissAdvice(closet, "job"), closet);
  assert.equal(acceptImports(closet).pieces.length, 1);
  const decoded = decodeCloset(JSON.stringify(closet));
  assert.deepEqual(decoded.imports[0]!.adviceShown, ["blur"]);
});

const vector = (...values: number[]) =>
  btoa(
    String.fromCharCode(
      ...Array.from({ length: 768 }, (_, index) => (values[index] ?? 0) & 255),
    ),
  );

test("a new photo very close to an owned piece asks Same piece or Different piece", () => {
  const owned: Piece = {
    id: "owned",
    name: "Black hijab",
    category: "hijab",
    kind: "hijab",
    photo: "owned.png",
    createdAt: "2026-09-01T08:00:00Z",
    source: "owned",
    embedding: vector(100, 0),
  };
  const start = { ...queued(), pieces: [owned] };
  const close = prepared({ embedding: vector(100, 38) });
  let closet = finishImport(startImport(start, "job"), "job", close);
  assert.equal(closet.imports[0]!.duplicateOf, "owned");
  assert.equal(closet.imports[0]!.state, "review");
  assert.equal(acceptImports(closet).pieces.length, 1);

  const kept = keepDuplicate(closet, "job");
  assert.equal(kept.imports[0]!.duplicateOf, undefined);
  assert.equal(kept.imports[0]!.state, "ready");
  assert.equal(keepDuplicate(kept, "job"), kept);
  assert.equal(finishImport(kept, "job", close), kept);
  assert.equal(acceptImports(kept).pieces.length, 2);

  const corrected = correctImport(closet, "job", {
    name: "Second black hijab",
  });
  assert.equal(corrected.imports[0]!.duplicateOf, undefined);
  assert.equal(corrected.imports[0]!.state, "ready");

  closet = finishImport(
    startImport(start, "job"),
    "job",
    prepared({ embedding: vector(100, 40) }),
  );
  assert.equal(closet.imports[0]!.duplicateOf, undefined);
  assert.equal(closet.imports[0]!.state, "ready");
});

test("retake replaces the photo in place and repeating it changes nothing", () => {
  let closet = finishImport(
    startImport(queued(), "job"),
    "job",
    prepared({ enhanced: "job-enhanced.png" }),
  );
  closet = correctImport(closet, "job", { variant: "plain" });
  closet = retakeImport(closet, "job", "second-original.jpg");
  assert.equal(closet.imports.length, 1);
  const job = closet.imports[0]!;
  assert.equal(job.id, "job");
  assert.equal(job.source, "second-original.jpg");
  assert.equal(job.state, "queued");
  assert.equal(job.attempts, 0);
  assert.equal(job.prepared, undefined);
  assert.equal(job.name, undefined);
  assert.equal(job.variant, undefined);
  assert.equal(retakeImport(closet, "job", "second-original.jpg"), closet);

  const preparing = startImport(closet, "job");
  assert.equal(retakeImport(preparing, "job", "third-original.jpg"), preparing);

  closet = finishImport(
    preparing,
    "job",
    prepared({ original: "second-original.jpg", cutout: "second.png" }),
  );
  closet = acceptImports(closet);
  assert.equal(closet.pieces.length, 1);
  assert.equal(closet.pieces[0]!.id, "job");
  assert.equal(closet.pieces[0]!.photo, "second.png");
  assert.equal(closet.pieces[0]!.original, "second-original.jpg");
  assert.equal(retakeImport(closet, "job", "third-original.jpg"), closet);
});

test("a failed photo can be retaken", () => {
  let closet = failImport(startImport(queued(), "job"), "job", "unreadable");
  closet = retakeImport(closet, "job", "second-original.jpg");
  assert.equal(closet.imports[0]!.state, "queued");
  assert.equal(closet.imports[0]!.error, undefined);
});

test("P05 a retake that is still blurry is not nagged again", () => {
  let closet = finishImport(startImport(queued(), "job"), "job", blurry());
  assert.equal(closet.imports[0]!.advice, "blur");
  closet = retakeImport(closet, "job", "second-original.jpg");
  assert.deepEqual(closet.imports[0]!.adviceShown, ["blur"]);
  closet = finishImport(startImport(closet, "job"), "job", blurry());
  assert.equal(closet.imports[0]!.advice, undefined);
  closet = retakeImport(closet, "job", "third-original.jpg");
  const dark = prepared({
    quality: {
      sharpness: 200,
      brightness: 0.05,
      clipped: [],
      coverage: 0.3,
      lightSpread: 1,
    },
  });
  closet = finishImport(startImport(closet, "job"), "job", dark);
  assert.equal(closet.imports[0]!.advice, "dark");
});

test("a retaken piece from a photo of several pieces is parsed again on its own", () => {
  let closet = splitCapture(
    startImport(queued(), "job"),
    "job",
    proposalsFromRegions([region("upper", 1), region("pants", 2)], 1),
  );
  closet = finishImport(startImport(closet, "job-2"), "job-2", prepared());
  closet = retakeImport(closet, "job-2", "second-original.jpg");
  const job = closet.imports.find((item) => item.id === "job-2")!;
  assert.equal(job.captureId, undefined);
  assert.equal(job.region, undefined);
  assert.equal(job.people, undefined);
  assert.equal(jobStem(job), "second");
  assert.equal(
    closet.imports.find((item) => item.id === "job")!.captureId,
    "job",
  );
});

test("a failed preparation keeps storage and unreadable reasons and calls the rest processing", () => {
  assert.equal(
    importFailure(
      new Error("Calling the 'prepare' function has failed: storage"),
    ),
    "storage",
  );
  assert.equal(importFailure(new Error("unreadable")), "unreadable");
  assert.equal(importFailure(new Error("resources")), "processing");
  assert.equal(importFailure("storage"), "processing");
  assert.equal(importFailure(undefined), "processing");
});

test("removing a piece keeps the photo that a sibling from the same capture still uses", () => {
  let closet = splitOutfit();
  closet = finishImport(startImport(closet, "job"), "job", prepared());
  closet = acceptImports(closet);
  const piece = closet.pieces.find((item) => item.id === "job")!;
  assert.equal(piece.original, "job-original.jpg");
  const inUse = filesInUse(removePiece(closet, "job"));
  assert.ok(inUse.has("job-original.jpg"));
  assert.ok(!inUse.has("job.png"));
  assert.ok(filesInUse(closet).has("job.png"));
});

test("several people with no garment found are checked and can be cropped before the whole photo is used", () => {
  let closet = splitCapture(
    startImport(queued(), "job"),
    "job",
    proposalsFromRegions([], 2),
  );
  const whole = { x: 0, y: 0, width: 1, height: 1 };
  let job = closet.imports[0]!;
  assert.deepEqual(job.crop, whole);
  assert.equal(job.people, 2);
  assert.deepEqual(
    captureJobs(closet, "job").map((item) => item.id),
    ["job"],
  );
  closet = finishImport(startImport(closet, "job"), "job", prepared());
  job = closet.imports[0]!;
  assert.equal(job.state, "review");
  assert.ok(job.checks?.includes("several"));
  assert.equal(acceptImports(closet).pieces.length, 0);
  const box = { x: 0.25, y: 0.25, width: 0.5, height: 0.5 };
  closet = cropCapture(closet, "job", box, "job-crop-1");
  closet = finishImport(
    startImport(closet, "job"),
    "job",
    prepared({ original: "job-crop-1-original.jpg", cutout: "job-crop-1.png" }),
  );
  assert.ok(!closet.imports[0]!.checks?.includes("several"));
});

test("a photo the parser could not read is checked for several subjects and can be cropped", () => {
  let closet = splitCapture(
    startImport(queued(), "job"),
    "job",
    unparsedCapture,
  );
  const job = closet.imports[0]!;
  assert.deepEqual(job.crop, { x: 0, y: 0, width: 1, height: 1 });
  assert.equal(job.people, undefined);
  assert.equal(captureJobs(closet, "job").length, 1);
  closet = finishImport(
    startImport(closet, "job"),
    "job",
    prepared({ instances: 2 }),
  );
  assert.ok(closet.imports[0]!.checks?.includes("several"));
});

test("advice she already dismissed stays dismissed after Adjust crop", () => {
  let closet = splitOutfit();
  closet = finishImport(
    startImport(closet, "job"),
    "job",
    prepared({
      quality: {
        sharpness: 200,
        brightness: 0.05,
        clipped: [],
        coverage: 0.3,
        lightSpread: 1,
      },
    }),
  );
  closet = dismissAdvice(closet, "job");
  const shown = closet.imports[0]!.adviceShown;
  assert.ok(shown?.length);
  const box = { x: 0.25, y: 0.25, width: 0.5, height: 0.5 };
  closet = cropCapture(closet, "job", box, "job-crop-1");
  assert.deepEqual(closet.imports[0]!.adviceShown, shown);
});
