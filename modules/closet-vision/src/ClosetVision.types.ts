export type LabelGroup = "kind" | "style";

export type LabelScore = { group: LabelGroup; value: string; score: number };

export type PreparedGarment = {
  original: string;
  cutout: string | null;
  thumbnail: string | null;
  frame: { x: number; y: number; width: number; height: number } | null;
  instances: number;
  labels: LabelScore[];
  color: [number, number, number] | null;
  width: number;
  height: number;
  milliseconds: Record<string, number>;
};
