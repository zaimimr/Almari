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
