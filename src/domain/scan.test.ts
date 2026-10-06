import { test } from "node:test";
import assert from "node:assert/strict";
import { emptyCloset, type Closet, type ScanMode } from "./closet";
import { toLab, type Rgb } from "./color";
import {
  addScanCapture,
  baselineMs,
  heldPiece,
  holdMs,
  itemPiece,
  paddedBox,
  previewBox,
  readFrame,
  restartScan,
  scanCols,
  scanRows,
  scanSpeed,
  scanStep,
  shutter,
  startScan,
  type ScanFrame,
  type ScanState,
} from "./scan";

const upper = 4;
const pants = 6;
const dress = 7;
const shoe = 9;
const face = 11;

const cream: Rgb = [236, 231, 218];
const navy: Rgb = [30, 40, 80];
const rose: Rgb = [200, 90, 120];
const wall: Rgb = [200, 200, 200];

type Paint = {
  label: number;
  rgb: Rgb;
  x: number;
  y: number;
  w: number;
  h: number;
};

function frame(
  at: number,
  paints: Paint[],
  hands: [number, number][] = [],
  found: { people?: number; items?: Paint[] } = {},
): ScanFrame {
  const cells = scanCols * scanRows;
  const labels = new Uint8Array(cells);
  const colours = Array.from({ length: cells }, () => toLab(wall));
  for (const paint of paints)
    for (let y = paint.y; y < paint.y + paint.h; y++)
      for (let x = paint.x; x < paint.x + paint.w; x++) {
        labels[y * scanCols + x] = paint.label;
        colours[y * scanCols + x] = toLab(paint.rgb);
      }
  return {
    at,
    cols: scanCols,
    rows: scanRows,
    labels,
    colours,
    hands: hands.map(([x, y]) => ({ x, y })),
    people: found.people ?? 1,
    items: found.items ? mask(found.items) : null,
    parseMs: 50,
  };
}

function mask(paints: Paint[]) {
  const items = new Uint8Array(scanCols * scanRows);
  paints.forEach((paint, index) => {
    for (let y = paint.y; y < paint.y + paint.h; y++)
      for (let x = paint.x; x < paint.x + paint.w; x++)
        items[y * scanCols + x] = index + 1;
  });
  return items;
}

const her: Paint[] = [
  { label: face, rgb: [190, 150, 120], x: 15, y: 4, w: 6, h: 6 },
  { label: upper, rgb: cream, x: 11, y: 10, w: 14, h: 16 },
  { label: pants, rgb: navy, x: 12, y: 26, w: 12, h: 20 },
];

const heldDress: Paint = {
  label: dress,
  rgb: rose,
  x: 10,
  y: 12,
  w: 16,
  h: 26,
};
const edgeHands: [number, number][] = [
  [10 / scanCols, 13 / scanRows],
  [26 / scanCols, 13 / scanRows],
];

function withBaseline(): ScanState {
  let state = startScan;
  for (const at of [0, 250, 500, 750, 1000])
    state = scanStep(state, frame(at, her)).state;
  return state;
}

function run(state: ScanState, frames: ScanFrame[], mode?: ScanMode) {
  const captures = [];
  const statuses = [];
  for (const item of frames) {
    const step = scanStep(state, item, mode);
    state = step.state;
    statuses.push(step.status);
    if (step.capture) captures.push(step.capture);
  }
  return { state, captures, statuses };
}

test("the baseline is taken after she has been in view for a second", () => {
  const empty = scanStep(startScan, frame(0, []));
  assert.equal(empty.status, "find");
  assert.equal(empty.state.baseline, null);
  const early = scanStep(
    scanStep(startScan, frame(0, her)).state,
    frame(baselineMs - 1, her),
  );
  assert.equal(early.status, "find");
  assert.equal(early.state.baseline, null);
  const state = withBaseline();
  assert.notEqual(state.baseline, null);
  assert.equal(scanStep(state, frame(1250, her)).status, "show");
});

test("stepping out of view before a second starts the baseline wait again", () => {
  let state = scanStep(startScan, frame(0, her)).state;
  state = scanStep(state, frame(500, [])).state;
  state = scanStep(state, frame(1000, her)).state;
  assert.equal(scanStep(state, frame(1500, her)).state.baseline, null);
  assert.notEqual(scanStep(state, frame(2000, her)).state.baseline, null);
});

test("a dress held over her body with hands at its edges is the held piece", () => {
  const state = withBaseline();
  const held = heldPiece(
    state.baseline!,
    frame(2000, [...her, heldDress], edgeHands),
  );
  assert.equal(held?.kind, "dress");
  assert.ok(Math.abs(held!.box.x - 10 / scanCols) < 1e-9);
  assert.ok(Math.abs(held!.box.width - 16 / scanCols) < 1e-9);
  assert.ok(Math.abs(held!.box.height - 26 / scanRows) < 1e-9);
});

test("the same region without hands at its edges is not held", () => {
  const state = withBaseline();
  assert.equal(
    heldPiece(state.baseline!, frame(2000, [...her, heldDress])),
    null,
  );
  const centre: [number, number][] = [[18 / scanCols, 25 / scanRows]];
  assert.equal(
    heldPiece(state.baseline!, frame(2000, [...her, heldDress], centre)),
    null,
  );
});

test("a small region and her own unchanged clothes are not held, held shoes are", () => {
  const state = withBaseline();
  const small: Paint = { label: dress, rgb: rose, x: 16, y: 14, w: 3, h: 3 };
  assert.equal(
    heldPiece(
      state.baseline!,
      frame(2000, [...her, small], [[16 / scanCols, 15 / scanRows]]),
    ),
    null,
  );
  const shoes: Paint = { label: shoe, rgb: rose, x: 10, y: 12, w: 16, h: 26 };
  assert.equal(
    heldPiece(state.baseline!, frame(2000, [...her, shoes], edgeHands))?.kind,
    "item",
  );
  assert.equal(heldPiece(state.baseline!, frame(2000, her, edgeHands)), null);
});

test("a top held over her own top counts when its colour differs", () => {
  const state = withBaseline();
  const navyTop: Paint = {
    label: upper,
    rgb: navy,
    x: 11,
    y: 10,
    w: 14,
    h: 14,
  };
  const hands: [number, number][] = [[11 / scanCols, 11 / scanRows]];
  assert.equal(
    heldPiece(state.baseline!, frame(2000, [...her, navyTop], hands))?.kind,
    "upper",
  );
  const creamTop: Paint = { ...navyTop, rgb: cream };
  assert.equal(
    heldPiece(state.baseline!, frame(2000, [...her, creamTop], hands)),
    null,
  );
});

test("a piece held still for the hold time is captured once", () => {
  const holding = [...her, heldDress];
  const frames = [2000, 2250, 2500, 2750, 3000, 3250].map((at) =>
    frame(at, holding, edgeHands),
  );
  const { captures, statuses } = run(withBaseline(), frames);
  assert.equal(captures.length, 1);
  assert.equal(captures[0]!.kind, "dress");
  assert.deepEqual(statuses, [
    "hold",
    "hold",
    "hold",
    "taken",
    "taken",
    "taken",
  ]);
  assert.equal(2750 - 2000 >= holdMs, true);
});

test("moving the piece starts the hold again", () => {
  const moved: Paint = { ...heldDress, x: 2, y: 4 };
  const movedHands: [number, number][] = [[2 / scanCols, 5 / scanRows]];
  const frames = [
    frame(2000, [...her, heldDress], edgeHands),
    frame(2500, [...her, heldDress], edgeHands),
    frame(2600, [...her, moved], movedHands),
    frame(3200, [...her, moved], movedHands),
    frame(3300, [...her, moved], movedHands),
  ];
  const { captures, statuses } = run(withBaseline(), frames);
  assert.deepEqual(statuses, ["hold", "hold", "hold", "hold", "taken"]);
  assert.equal(captures.length, 1);
});

test("the same piece shown again is not captured again, another colour is", () => {
  const holding = (at: number, paint: Paint) =>
    frame(at, [...her, paint], edgeHands);
  const first = run(withBaseline(), [
    holding(2000, heldDress),
    holding(2800, heldDress),
  ]);
  assert.equal(first.captures.length, 1);
  const lowered = run(first.state, [frame(3000, her)]);
  assert.deepEqual(lowered.statuses, ["show"]);
  const again = run(lowered.state, [
    holding(3200, heldDress),
    holding(4000, heldDress),
  ]);
  assert.equal(again.captures.length, 0);
  assert.deepEqual(again.statuses, ["taken", "taken"]);
  const blue: Paint = { ...heldDress, rgb: [60, 110, 200] };
  const next = run(again.state, [holding(4200, blue), holding(5000, blue)]);
  assert.equal(next.captures.length, 1);
});

test("start again keeps the duplicate guard and waits for a new baseline", () => {
  const holding = (at: number) => frame(at, [...her, heldDress], edgeHands);
  const { state } = run(withBaseline(), [holding(2000), holding(2800)]);
  const restarted = restartScan(state);
  assert.equal(restarted.baseline, null);
  assert.deepEqual(restarted.last, state.last);
});

test("manual waits for the shutter and takes the piece in the latest frame", () => {
  const holding = (at: number) => frame(at, [...her, heldDress], edgeHands);
  const { state, captures, statuses } = run(
    withBaseline(),
    [frame(2000, her), holding(2250), holding(3500)],
    "manual",
  );
  assert.equal(captures.length, 0);
  assert.deepEqual(statuses, ["show", "ready", "ready"]);
  const taken = shutter(state);
  assert.equal(taken.capture?.kind, "dress");
  assert.equal(taken.state.held, null);
  assert.equal(taken.state.last?.kind, "dress");
  assert.equal(shutter(taken.state).capture, null);
  const auto = run(taken.state, [holding(3750), holding(4500)]);
  assert.equal(auto.captures.length, 0);
});

test("the shutter takes nothing when no piece is held", () => {
  const { state } = run(withBaseline(), [frame(2000, her)], "manual");
  assert.deepEqual(shutter(state), { state, capture: null });
  const looking = scanStep(startScan, frame(0, her), "manual");
  assert.equal(looking.status, "find");
  assert.equal(shutter(looking.state).capture, null);
});

test("a frame box lands on the letterboxed preview, mirrored for the front camera", () => {
  const box = { x: 0.1, y: 0.2, width: 0.4, height: 0.5 };
  assert.deepEqual(previewBox(box, { width: 300, height: 500 }, 3 / 4), {
    x: 30,
    y: 130,
    width: 120,
    height: 200,
  });
  assert.deepEqual(previewBox(box, { width: 400, height: 400 }, 3 / 4), {
    x: 80,
    y: 80,
    width: 120,
    height: 200,
  });
  assert.deepEqual(previewBox(box, { width: 300, height: 400 }, 3 / 4, true), {
    x: 150,
    y: 80,
    width: 120,
    height: 200,
  });
});

test("scan speed is frames per second and the median parse time", () => {
  assert.equal(scanSpeed([]), null);
  assert.equal(scanSpeed([{ at: 0, parse: 40 }]), null);
  assert.deepEqual(
    scanSpeed([
      { at: 0, parse: 40 },
      { at: 250, parse: 90 },
      { at: 500, parse: 60 },
      { at: 750, parse: 50 },
      { at: 1000, parse: 70 },
    ]),
    { fps: 4, parse: 60 },
  );
  const many = Array.from({ length: 30 }, (_, index) => ({
    at: index * 500,
    parse: index,
  }));
  assert.deepEqual(scanSpeed(many), { fps: 2, parse: 24 });
});

test("a scan capture is a queued import job in the scan", () => {
  const region = {
    kind: "dress" as const,
    cutout: "one-region-1.png",
    frame: { x: 0.2, y: 0.2, width: 0.5, height: 0.6 },
    share: 0.2,
    partial: false,
  };
  const closet: Closet = addScanCapture(emptyCloset, "scan", {
    id: "one",
    source: "one-original.jpg",
    createdAt: "2026-10-02T08:00:00Z",
    region,
  });
  assert.deepEqual(closet.imports, [
    {
      id: "one",
      source: "one-original.jpg",
      createdAt: "2026-10-02T08:00:00Z",
      state: "queued",
      attempts: 0,
      captureId: "scan",
      region,
    },
  ]);
  assert.equal(
    addScanCapture(closet, "scan", {
      id: "one",
      source: "one-original.jpg",
      createdAt: "2026-10-02T08:00:00Z",
    }),
    closet,
  );
  const crop = { x: 0.1, y: 0.1, width: 0.4, height: 0.4 };
  const cropped = addScanCapture(closet, "scan", {
    id: "two",
    source: "two-original.jpg",
    createdAt: "2026-10-02T08:00:01Z",
    crop,
  });
  assert.deepEqual(cropped.imports[1]?.crop, paddedBox(crop));
  assert.equal(cropped.imports[1]?.region, undefined);
});

test("a native frame is decoded from base64", () => {
  const labels = btoa(String.fromCharCode(0, 4, 7, 16));
  const colours = btoa(
    String.fromCharCode(255, 255, 255, 0, 0, 0, 30, 40, 80, 200, 90, 120),
  );
  const decoded = readFrame({
    at: 12,
    cols: 2,
    rows: 2,
    labels,
    colours,
    hands: [[0.5, 0.25]],
    milliseconds: { parse: 61, hands: 9, total: 80 },
  });
  assert.deepEqual([...decoded.labels], [0, 4, 7, 16]);
  assert.deepEqual(decoded.colours[2], toLab(navy));
  assert.deepEqual(decoded.hands, [{ x: 0.5, y: 0.25 }]);
  assert.equal(decoded.parseMs, 61);
  assert.equal(decoded.at, 12);
});

test("a scan crop is padded a tenth on each side and stays inside the photo", () => {
  const near = (a: number, b: number) => Math.abs(a - b) < 1e-9;
  const inside = paddedBox({ x: 0.2, y: 0.3, width: 0.5, height: 0.4 });
  assert.ok(near(inside.x, 0.15) && near(inside.y, 0.26));
  assert.ok(near(inside.width, 0.6) && near(inside.height, 0.48));
  const edge = paddedBox({ x: 0, y: 0.5, width: 0.9, height: 0.5 });
  assert.ok(near(edge.x, 0) && near(edge.width, 0.99));
  assert.ok(near(edge.y, 0.45) && near(edge.y + edge.height, 1));
});

const mug: Paint = { label: 0, rgb: rose, x: 12, y: 14, w: 10, h: 12 };
const jacket: Paint = { label: upper, rgb: navy, x: 8, y: 8, w: 20, h: 28 };
const mugHands: [number, number][] = [[12 / scanCols, 20 / scanRows]];

test("with nobody in view, a held jacket is found without a baseline", () => {
  const seen = frame(0, [jacket], [], { people: 0, items: [jacket] });
  assert.equal(itemPiece(seen)?.kind, "upper");
  const { captures } = run(startScan, [
    seen,
    frame(400, [jacket], [], { people: 0, items: [jacket] }),
    frame(800, [jacket], [], { people: 0, items: [jacket] }),
  ]);
  assert.equal(captures.length, 1);
  assert.equal(captures[0]!.kind, "upper");
});

test("with nobody in view, any object in a hand is an item", () => {
  const held = itemPiece(
    frame(0, [mug], mugHands, { people: 0, items: [mug] }),
  );
  assert.equal(held?.kind, "item");
  assert.equal(
    itemPiece(frame(0, [mug], [], { people: 0, items: [mug] })),
    null,
  );
});

test("a foreground filling the whole view is not an item", () => {
  const wall: Paint = {
    label: 0,
    rgb: rose,
    x: 0,
    y: 0,
    w: scanCols,
    h: scanRows,
  };
  assert.equal(
    itemPiece(frame(0, [wall], mugHands, { people: 0, items: [wall] })),
    null,
  );
});

test("an unknown object held in front of her is an item", () => {
  const state = withBaseline();
  const box: Paint = { label: 0, rgb: rose, x: 10, y: 12, w: 16, h: 26 };
  const held = heldPiece(
    state.baseline!,
    frame(1250, [...her, box], edgeHands, { items: [...her, box] }),
  );
  assert.equal(held?.kind, "item");
});
