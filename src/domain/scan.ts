import type {
  Closet,
  Frame,
  GarmentRegion,
  ImportJob,
  ScanMode,
} from "./closet";
import { deltaE, toLab, type Lab } from "./color";

export const scanFps = 4;
export const scanCols = 36;
export const scanRows = 48;
export const baselineMs = 1000;
export const holdMs = 700;
export const minPersonShare = 0.08;
export const minHeldShare = 0.03;
export const minBodyCover = 0.15;
export const minBagCover = 0.04;
export const changedDeltaE = 18;
export const handMargin = 0.08;
export const stillOverlap = 0.75;
export const stillDeltaE = 8;
export const duplicateDeltaE = 10;
export const speedWindow = 12;
export const cropPadding = 0.1;
export const minItemShare = 0.04;
export const maxItemShare = 0.9;
export const minItemClothes = 0.15;
export const overBody = 0.5;

export type HeldKind =
  "head" | "upper" | "dress" | "skirt" | "pants" | "bag" | "item";

const heldClasses: Record<number, HeldKind> = {
  1: "head",
  4: "upper",
  5: "skirt",
  6: "pants",
  7: "dress",
  16: "bag",
  17: "head",
};

const bodyClasses = new Set([2, 11, 12, 13, 14, 15]);
const wornClasses = new Set([1, 3, 4, 5, 6, 7, 8, 9, 10, 16, 17]);

export type Point = { x: number; y: number };

export type ScanFrame = {
  at: number;
  cols: number;
  rows: number;
  labels: Uint8Array;
  colours: Lab[];
  hands: Point[];
  people: number;
  items: Uint8Array | null;
  parseMs: number;
};

export type NativeScanFrame = {
  at: number;
  cols: number;
  rows: number;
  labels: string;
  colours: string;
  hands: number[][];
  people?: number;
  items?: string;
  milliseconds: Record<string, number>;
};

export type Baseline = { labels: Uint8Array; colours: Lab[]; body: number };

export type HeldPiece = {
  kind: HeldKind;
  box: Frame;
  colour: Lab;
  share: number;
};

export type ScanState = {
  baseline: Baseline | null;
  seenSince: number | null;
  hold: { since: number; box: Frame; colour: Lab } | null;
  last: { kind: HeldKind; colour: Lab } | null;
  held: HeldPiece | null;
};

export type ScanStatus = "find" | "show" | "hold" | "taken" | "ready";

export const startScan: ScanState = {
  baseline: null,
  seenSince: null,
  hold: null,
  last: null,
  held: null,
};

const bytes = (value: string) =>
  Uint8Array.from(atob(value), (char) => char.charCodeAt(0));

export function readFrame(raw: NativeScanFrame): ScanFrame {
  const rgb = bytes(raw.colours);
  const colours: Lab[] = [];
  for (let index = 0; index + 2 < rgb.length; index += 3)
    colours.push(toLab([rgb[index]!, rgb[index + 1]!, rgb[index + 2]!]));
  return {
    at: raw.at,
    cols: raw.cols,
    rows: raw.rows,
    labels: bytes(raw.labels),
    colours,
    hands: raw.hands.map(([x, y]) => ({ x: x ?? 0, y: y ?? 0 })),
    people: raw.people ?? 1,
    items: raw.items ? bytes(raw.items) : null,
    parseMs: raw.milliseconds.parse ?? 0,
  };
}

function bodyCells(labels: Uint8Array) {
  return labels.reduce((count, label) => count + (label ? 1 : 0), 0);
}

function nearEdge(box: Frame, hand: Point) {
  const right = box.x + box.width;
  const bottom = box.y + box.height;
  if (
    hand.x < box.x - handMargin ||
    hand.x > right + handMargin ||
    hand.y < box.y - handMargin ||
    hand.y > bottom + handMargin
  )
    return false;
  return (
    Math.min(
      Math.abs(hand.x - box.x),
      Math.abs(hand.x - right),
      Math.abs(hand.y - box.y),
      Math.abs(hand.y - bottom),
    ) <= handMargin
  );
}

function nearBox(box: Frame, hand: Point) {
  return (
    hand.x >= box.x - handMargin &&
    hand.x <= box.x + box.width + handMargin &&
    hand.y >= box.y - handMargin &&
    hand.y <= box.y + box.height + handMargin
  );
}

function largestGroup(marked: Uint8Array, cols: number) {
  const total = marked.length;
  let best: number[] = [];
  const seen = new Uint8Array(total);
  for (let start = 0; start < total; start++) {
    if (!marked[start] || seen[start]) continue;
    const group: number[] = [];
    const stack = [start];
    seen[start] = 1;
    while (stack.length) {
      const index = stack.pop()!;
      group.push(index);
      const x = index % cols;
      const next = [
        x > 0 ? index - 1 : -1,
        x < cols - 1 ? index + 1 : -1,
        index - cols,
        index + cols,
      ];
      for (const cell of next)
        if (cell >= 0 && cell < total && marked[cell] && !seen[cell]) {
          seen[cell] = 1;
          stack.push(cell);
        }
    }
    if (group.length > best.length) best = group;
  }
  return best;
}

function describe(cells: number[], frame: ScanFrame) {
  const { cols, rows, labels, colours } = frame;
  const tally = new Map<HeldKind, number>();
  let minX = cols;
  let minY = rows;
  let maxX = -1;
  let maxY = -1;
  let worn = 0;
  const sum: Lab = [0, 0, 0];
  for (const index of cells) {
    const label = labels[index]!;
    const kind = heldClasses[label];
    if (kind) tally.set(kind, (tally.get(kind) ?? 0) + 1);
    if (wornClasses.has(label)) worn++;
    const x = index % cols;
    const y = Math.floor(index / cols);
    minX = Math.min(minX, x);
    maxX = Math.max(maxX, x);
    minY = Math.min(minY, y);
    maxY = Math.max(maxY, y);
    const lab = colours[index]!;
    sum[0] += lab[0];
    sum[1] += lab[1];
    sum[2] += lab[2];
  }
  const top = [...tally].sort((a, b) => b[1] - a[1])[0];
  const kind: HeldKind = top && top[1] * 2 >= cells.length ? top[0] : "item";
  const box: Frame = {
    x: minX / cols,
    y: minY / rows,
    width: (maxX - minX + 1) / cols,
    height: (maxY - minY + 1) / rows,
  };
  const colour: Lab = [
    sum[0] / cells.length,
    sum[1] / cells.length,
    sum[2] / cells.length,
  ];
  return { kind, box, colour, worn: worn / cells.length };
}

export function heldPiece(
  baseline: Baseline,
  frame: ScanFrame,
): HeldPiece | null {
  const { cols, labels, colours, items } = frame;
  const total = labels.length;
  const changed = new Uint8Array(total);
  for (let index = 0; index < total; index++) {
    const label = labels[index]!;
    if (bodyClasses.has(label)) continue;
    if (items ? !items[index] : !label) continue;
    if (
      baseline.labels[index] !== label ||
      deltaE(colours[index]!, baseline.colours[index]!) > changedDeltaE
    )
      changed[index] = 1;
  }
  const best = largestGroup(changed, cols);
  const share = best.length / total;
  if (share < minHeldShare) return null;
  const { kind, box, colour } = describe(best, frame);
  const covered = best.filter((index) => baseline.labels[index]).length;
  if (covered >= best.length * overBody) {
    const cover = baseline.body ? covered / baseline.body : 0;
    if (cover < (kind === "bag" ? minBagCover : minBodyCover)) return null;
  }
  if (!frame.hands.some((hand) => nearEdge(box, hand))) return null;
  return { kind, box, colour, share };
}

export function itemPiece(frame: ScanFrame): HeldPiece | null {
  const { cols, items } = frame;
  if (!items) return null;
  const sizes = new Map<number, number>();
  for (const label of items)
    if (label) sizes.set(label, (sizes.get(label) ?? 0) + 1);
  const top = [...sizes].sort((a, b) => b[1] - a[1])[0];
  if (!top) return null;
  const share = top[1] / items.length;
  if (share < minItemShare || share > maxItemShare) return null;
  const marked = items.map((label) => (label === top[0] ? 1 : 0));
  const cells = largestGroup(marked, cols);
  const { kind, box, colour, worn } = describe(cells, frame);
  if (worn < minItemClothes && !frame.hands.some((hand) => nearBox(box, hand)))
    return null;
  return { kind, box, colour, share: cells.length / items.length };
}

export function paddedBox(box: Frame, padding = cropPadding): Frame {
  const x = Math.max(0, box.x - box.width * padding);
  const y = Math.max(0, box.y - box.height * padding);
  const right = Math.min(1, box.x + box.width * (1 + padding));
  const bottom = Math.min(1, box.y + box.height * (1 + padding));
  return { x, y, width: right - x, height: bottom - y };
}

export function overlap(a: Frame, b: Frame) {
  const width = Math.max(
    0,
    Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x),
  );
  const height = Math.max(
    0,
    Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y),
  );
  const shared = width * height;
  const union = a.width * a.height + b.width * b.height - shared;
  return union > 0 ? shared / union : 0;
}

export function scanStep(
  state: ScanState,
  frame: ScanFrame,
  mode: ScanMode = "auto",
): { state: ScanState; status: ScanStatus; capture: HeldPiece | null } {
  if (frame.people === 0)
    return holding(
      { ...state, baseline: null, seenSince: null },
      itemPiece(frame),
      frame,
      mode,
    );
  if (!state.baseline) {
    const body = bodyCells(frame.labels);
    if (body / frame.labels.length < minPersonShare)
      return {
        state: { ...state, seenSince: null },
        status: "find",
        capture: null,
      };
    const seenSince = state.seenSince ?? frame.at;
    if (frame.at - seenSince < baselineMs)
      return { state: { ...state, seenSince }, status: "find", capture: null };
    return {
      state: {
        ...state,
        seenSince,
        baseline: { labels: frame.labels, colours: frame.colours, body },
      },
      status: "show",
      capture: null,
    };
  }
  return holding(state, heldPiece(state.baseline, frame), frame, mode);
}

function holding(
  state: ScanState,
  held: HeldPiece | null,
  frame: ScanFrame,
  mode: ScanMode,
): { state: ScanState; status: ScanStatus; capture: HeldPiece | null } {
  if (mode === "manual")
    return {
      state: { ...state, hold: null, held },
      status: held ? "ready" : "show",
      capture: null,
    };
  if (!held)
    return { state: { ...state, hold: null }, status: "show", capture: null };
  if (
    state.last?.kind === held.kind &&
    deltaE(state.last.colour, held.colour) < duplicateDeltaE
  )
    return { state: { ...state, hold: null }, status: "taken", capture: null };
  const hold = state.hold;
  if (
    hold &&
    overlap(hold.box, held.box) >= stillOverlap &&
    deltaE(hold.colour, held.colour) < stillDeltaE
  ) {
    if (frame.at - hold.since < holdMs)
      return { state, status: "hold", capture: null };
    return {
      state: {
        ...state,
        hold: null,
        last: { kind: held.kind, colour: held.colour },
      },
      status: "taken",
      capture: held,
    };
  }
  return {
    state: {
      ...state,
      hold: { since: frame.at, box: held.box, colour: held.colour },
    },
    status: "hold",
    capture: null,
  };
}

export function shutter(state: ScanState): {
  state: ScanState;
  capture: HeldPiece | null;
} {
  const held = state.held;
  if (!held) return { state, capture: null };
  return {
    state: {
      ...state,
      hold: null,
      held: null,
      last: { kind: held.kind, colour: held.colour },
    },
    capture: held,
  };
}

export function previewBox(
  box: Frame,
  view: { width: number; height: number },
  aspect: number,
  mirrored = false,
): Frame {
  const width = Math.min(view.width, view.height * aspect);
  const height = width / aspect;
  return {
    x:
      (view.width - width) / 2 +
      (mirrored ? 1 - box.x - box.width : box.x) * width,
    y: (view.height - height) / 2 + box.y * height,
    width: box.width * width,
    height: box.height * height,
  };
}

export function restartScan(state: ScanState): ScanState {
  return { ...startScan, last: state.last };
}

export function scanSpeed(
  readings: { at: number; parse: number }[],
): { fps: number; parse: number } | null {
  const recent = readings.slice(-speedWindow);
  if (recent.length < 2) return null;
  const span = recent[recent.length - 1]!.at - recent[0]!.at;
  if (span <= 0) return null;
  const times = recent.map((item) => item.parse).sort((a, b) => a - b);
  const middle = times.length / 2;
  const parse =
    times.length % 2
      ? times[Math.floor(middle)]!
      : (times[middle - 1]! + times[middle]!) / 2;
  return {
    fps: Math.round(((recent.length - 1) * 10000) / span) / 10,
    parse: Math.round(parse),
  };
}

export function addScanCapture(
  closet: Closet,
  scanId: string,
  job: Pick<ImportJob, "id" | "source" | "createdAt"> & {
    region?: GarmentRegion;
    crop?: Frame;
  },
): Closet {
  if (closet.imports.some((item) => item.id === job.id)) return closet;
  return {
    ...closet,
    imports: [
      ...closet.imports,
      {
        id: job.id,
        source: job.source,
        createdAt: job.createdAt,
        state: "queued",
        attempts: 0,
        captureId: scanId,
        ...(job.region ? { region: job.region } : {}),
        ...(job.crop ? { crop: paddedBox(job.crop) } : {}),
      },
    ],
  };
}
