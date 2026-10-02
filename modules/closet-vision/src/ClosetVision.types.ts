export type LabelGroup =
  | "kind"
  | "style"
  | "length"
  | "sleeve"
  | "volume"
  | "pattern"
  | "scale"
  | "fabric"
  | "embellishment";

export type LabelScore = { group: LabelGroup; value: string; score: number };

export type Swatch = { rgb: [number, number, number]; share: number };

export type PreparedGarment = {
  original: string;
  cutout: string | null;
  thumbnail: string | null;
  frame: { x: number; y: number; width: number; height: number } | null;
  instances: number;
  labels: LabelScore[];
  palette: Swatch[];
  embedding: string | null;
  width: number;
  height: number;
  milliseconds: Record<string, number>;
};

export type ReadLabelResult = { photo: string; lines: string[] };

export type LabelExtraction = { json: string | null };

export type GarmentRegionKind =
  | "head"
  | "upper"
  | "skirt"
  | "pants"
  | "dress"
  | "belt"
  | "shoes"
  | "bag"
  | "sunglasses";

export type GarmentRegion = {
  kind: GarmentRegionKind;
  cutout: string;
  frame: { x: number; y: number; width: number; height: number };
  share: number;
  partial: boolean;
};

export type GarmentParse = { regions: GarmentRegion[]; people: number };

export type PrepareOptions = {
  cutout?: string;
  crop?: { x: number; y: number; width: number; height: number };
};
