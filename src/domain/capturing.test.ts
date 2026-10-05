import { test } from "node:test";
import assert from "node:assert/strict";
import {
  emptyCloset,
  type GarmentRegion,
  type LabelScore,
  type Prepared,
} from "./closet";
import { proposalsFromRegions } from "./capture";
import {
  correctImport,
  failImport,
  finishImport,
  keepRejected,
  nameFor,
  nameOptions,
  queueImport,
  rejectReason,
  renameAuto,
  splitCapture,
  startImport,
} from "./importing";

const kurtaLabels: LabelScore[] = [
  { group: "kind", value: "kurta", score: 0.14 },
  { group: "kind", value: "tunic", score: 0.1 },
  { group: "style", value: "desi", score: 0.09 },
];

const sage = { rgb: [167, 174, 152] as [number, number, number], share: 0.7 };
const navy = { rgb: [31, 42, 68] as [number, number, number], share: 0.3 };

const prepared = (changes: Partial<Prepared> = {}): Prepared => ({
  original: "job-original.jpg",
  cutout: "job.png",
  thumbnail: "job-thumb.png",
  frame: { x: 0.2, y: 0, width: 0.6, height: 1 },
  instances: 1,
  labels: kurtaLabels,
  palette: [{ ...sage, share: 1 }],
  embedding: null,
  ...changes,
});

const queued = (linkName?: string) =>
  queueImport(emptyCloset, {
    id: "job",
    source: "job-original.jpg",
    createdAt: "2026-10-01T08:00:00Z",
    ...(linkName ? { linkName } : {}),
  });

const finish = (
  changes: Partial<Prepared> = {},
  size?: { width: number; height: number },
) => finishImport(startImport(queued(), "job"), "job", prepared(changes), size);

test("a tiny image is rejected as no clothing", () => {
  const job = finish({}, { width: 8, height: 8 }).imports[0]!;
  assert.equal(job.state, "failed");
  assert.equal(job.error, "no-clothing");
});

test("a flat photo with no cut-out is rejected", () => {
  const flat = prepared({
    cutout: null,
    quality: {
      sharpness: 1,
      brightness: 0.1,
      clipped: [],
      coverage: null,
      lightSpread: null,
    },
  });
  assert.equal(rejectReason(flat), "no-clothing");
  assert.equal(rejectReason(prepared()), null);
});

test("weak garment labels are rejected and can still be added", () => {
  const weak = finish({
    labels: [{ group: "kind", value: "belt", score: 0.08 }],
  });
  const job = weak.imports[0]!;
  assert.equal(job.state, "failed");
  const kept = keepRejected(weak, "job").imports[0]!;
  assert.equal(kept.state, "review");
  assert.equal(kept.error, undefined);
  assert.equal(kept.checks?.[0], "uncertain");
});

test("a region found as a bag stays a bag even with weak labels", () => {
  const weak = prepared({
    labels: [{ group: "kind", value: "t-shirt", score: 0.08 }],
  });
  assert.equal(rejectReason(weak, undefined, "bag"), null);
  assert.equal(rejectReason(weak), "no-clothing");
});

test("a waiting job can fail before it starts", () => {
  const failed = failImport(queued(), "job", "failed").imports[0]!;
  assert.equal(failed.state, "failed");
});

test("names use fabric and offer colour alternatives", () => {
  const options = nameOptions("kurta", [sage, navy], {
    fabric: "cotton",
    pattern: "print",
  });
  assert.deepEqual(options, [
    "Sage cotton kurta",
    "Sage kurta",
    "Sage print kurta",
    "Sage and navy kurta",
    "Kurta",
  ]);
  assert.equal(nameFor("kurta", []), "Kurta");
});

test("renaming keeps the kind of auto name and leaves typed names", () => {
  const before = { kind: "kurta" as const, palette: [sage] };
  const after = {
    kind: "kurta" as const,
    palette: [{ rgb: [104, 107, 54] as [number, number, number], share: 1 }],
  };
  assert.equal(renameAuto("Sage kurta", before, after), "Olive kurta");
  assert.equal(renameAuto("Eid kurta", before, after), "Eid kurta");
});

test("changing the colour renames an auto name", () => {
  const closet = correctImport(finish(), "job", { colour: "Olive" });
  assert.equal(closet.imports[0]!.name, "Olive kurta");
});

test("a link import keeps the shop name", () => {
  const closet = finishImport(
    startImport(queued("Linen Kurta"), "job"),
    "job",
    prepared(),
  );
  assert.equal(closet.imports[0]!.name, "Linen Kurta");
});

const region = (
  kind: GarmentRegion["kind"],
  share: number,
  partial = false,
): GarmentRegion => ({
  kind,
  cutout: `photo-region-${kind}.png`,
  frame: { x: 0.25, y: 0.25, width: 0.5, height: 0.25 },
  share,
  partial,
});

test("splitting a link capture keeps the shop name on the first piece", () => {
  const split = splitCapture(
    startImport(queued("Linen Kurta"), "job"),
    "job",
    proposalsFromRegions([region("upper", 0.3), region("pants", 0.3)], 1),
  );
  assert.equal(split.imports.length, 2);
  assert.equal(split.imports[0]!.linkName, "Linen Kurta");
  assert.equal(split.imports[1]!.linkName, undefined);
});

test("tiny cut-off regions are not proposed", () => {
  const plan = proposalsFromRegions(
    [region("upper", 0.4), region("pants", 0.3), region("shoes", 0.02, true)],
    1,
  );
  assert.equal(plan.proposals.length, 2);
});
