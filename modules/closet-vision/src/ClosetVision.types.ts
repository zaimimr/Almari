export type KindScore = { kind: string; score: number };

export type PreparedGarment = {
  original: string;
  cutout: string | null;
  thumbnail: string | null;
  frame: { x: number; y: number; width: number; height: number } | null;
  instances: number;
  kinds: KindScore[];
  color: [number, number, number] | null;
  width: number;
  height: number;
  milliseconds: Record<string, number>;
};
