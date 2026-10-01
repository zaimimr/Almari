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

export function categoryForRegion(kind: GarmentRegionKind): Category | null {
  return kind === "head" ? "hijab" : null;
}

export function proposalsFromRegions(
  regions: GarmentRegion[],
  people: number,
): CapturePlan {
  const notice = people > 1 ? "others-ignored" : null;
  if (!regions.length || (people === 0 && regions.length === 1))
    return { proposals: [], people, notice };
  const proposals = [...regions]
    .sort(
      (a, b) =>
        regionOrder.indexOf(a.kind) - regionOrder.indexOf(b.kind) ||
        b.share - a.share,
    )
    .map((region) => ({ region, category: categoryForRegion(region.kind) }));
  return { proposals, people, notice };
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
