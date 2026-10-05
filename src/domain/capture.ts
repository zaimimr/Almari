import type {
  Category,
  Frame,
  GarmentRegion,
  GarmentRegionKind,
} from "./closet";

export type CaptureProposal = {
  region: GarmentRegion;
  category: Category | null;
};

export type CapturePlan = {
  proposals: CaptureProposal[];
  people: number;
  notice: "others-ignored" | null;
  checkWhole: boolean;
};

export const wholePhoto: Frame = { x: 0, y: 0, width: 1, height: 1 };

export const unparsedCapture: CapturePlan = {
  proposals: [],
  people: 0,
  notice: null,
  checkWhole: true,
};

const regionOrder: GarmentRegionKind[] = [
  "head",
  "upper",
  "dress",
  "skirt",
  "pants",
  "belt",
  "shoes",
  "bag",
  "sunglasses",
];

const regionCategories: Partial<Record<GarmentRegionKind, Category>> = {
  head: "hijab",
  skirt: "bottom",
  pants: "bottom",
  belt: "accessory",
  shoes: "shoes",
  bag: "bag",
};

export function categoryForRegion(kind: GarmentRegionKind): Category | null {
  return regionCategories[kind] ?? null;
}

export const minPartialShare = 0.08;

export function proposalsFromRegions(
  found: GarmentRegion[],
  people: number,
): CapturePlan {
  const regions = found.filter(
    (region) => !region.partial || region.share >= minPartialShare,
  );
  const notice = people > 1 ? "others-ignored" : null;
  if (!regions.length || (people === 0 && regions.length === 1))
    return { proposals: [], people, notice, checkWhole: people > 1 };
  const proposals = [...regions]
    .sort(
      (a, b) =>
        regionOrder.indexOf(a.kind) - regionOrder.indexOf(b.kind) ||
        b.share - a.share,
    )
    .map((region) => ({ region, category: categoryForRegion(region.kind) }));
  return { proposals, people, notice, checkWhole: false };
}

export const minBox = 0.05;

const clamp = (value: number) => Math.min(1, Math.max(0, value));

export function boxFrom(
  start: { x: number; y: number },
  end: { x: number; y: number },
): Frame | null {
  const x = clamp(Math.min(start.x, end.x));
  const y = clamp(Math.min(start.y, end.y));
  const width = clamp(Math.max(start.x, end.x)) - x;
  const height = clamp(Math.max(start.y, end.y)) - y;
  return width >= minBox && height >= minBox ? { x, y, width, height } : null;
}

export function resizeBox(box: Frame, step: number): Frame {
  const width = Math.min(1, Math.max(minBox, box.width + step));
  const height = Math.min(1, Math.max(minBox, box.height + step));
  return {
    x: Math.min(1 - width, Math.max(0, box.x - (width - box.width) / 2)),
    y: Math.min(1 - height, Math.max(0, box.y - (height - box.height) / 2)),
    width,
    height,
  };
}

export const minPick = 0.12;
export const samePiece = 0.6;

export function overlap(a: Frame, b: Frame): number {
  const width = Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x);
  const height = Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y);
  if (width <= 0 || height <= 0) return 0;
  const shared = width * height;
  return shared / (a.width * a.height + b.width * b.height - shared);
}

export function matchingPiece(frames: (Frame | null)[], box: Frame): number {
  let best = -1;
  let score = samePiece;
  frames.forEach((frame, index) => {
    const value = frame ? overlap(frame, box) : 0;
    if (value >= score) {
      best = index;
      score = value;
    }
  });
  return best;
}

function grow(start: number, size: number, least: number) {
  const next = Math.min(1, Math.max(size, least));
  const at = Math.min(1 - next, Math.max(0, start - (next - size) / 2));
  return { at, size: next };
}

export function pickedBox(frame: Frame, pad = 0.02): Frame {
  const x = clamp(frame.x - pad);
  const y = clamp(frame.y - pad);
  const across = grow(x, clamp(frame.x + frame.width + pad) - x, minPick);
  const down = grow(y, clamp(frame.y + frame.height + pad) - y, minPick);
  return { x: across.at, y: down.at, width: across.size, height: down.size };
}

export function boxAround(point: { x: number; y: number }, size = 0.3): Frame {
  const place = (value: number) =>
    Math.min(1 - size, Math.max(0, value - size / 2));
  return { x: place(point.x), y: place(point.y), width: size, height: size };
}

export function toggled(ids: string[], id: string): string[] {
  return ids.includes(id) ? ids.filter((item) => item !== id) : [...ids, id];
}

export function toggledAll(all: string[], dropped: string[]): string[] {
  return dropped.length ? [] : all;
}

export function holds(frame: Frame, point: { x: number; y: number }) {
  return (
    point.x >= frame.x &&
    point.x <= frame.x + frame.width &&
    point.y >= frame.y &&
    point.y <= frame.y + frame.height
  );
}
