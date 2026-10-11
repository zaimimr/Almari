import type { InspirationAnalysis } from "../../modules/closet-vision/src/ClosetVision.types";
import {
  inspirationGarments,
  type InspirationGarment,
} from "../domain/inspiration";

export type InspirationReading = {
  garments: InspirationGarment[];
  people: number;
};
export type InspirationAnalyzer = {
  isAvailable(): boolean;
  analyzeInspiration(uri: string): Promise<InspirationAnalysis>;
};

const regions = [
  "head",
  "upper",
  "skirt",
  "pants",
  "dress",
  "belt",
  "shoes",
  "bag",
  "sunglasses",
  "item",
];
const groups = [
  "kind",
  "style",
  "length",
  "sleeve",
  "volume",
  "pattern",
  "scale",
  "fabric",
  "embellishment",
];
const record = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value);

function validAnalysis(value: unknown): value is InspirationAnalysis {
  if (
    !record(value) ||
    !Number.isInteger(value.people) ||
    (value.people as number) < 0 ||
    !Array.isArray(value.garments) ||
    value.garments.length > 12
  )
    return false;
  return value.garments.every(
    (garment) =>
      record(garment) &&
      typeof garment.region === "string" &&
      regions.includes(garment.region) &&
      Array.isArray(garment.labels) &&
      garment.labels.every(
        (label) =>
          record(label) &&
          typeof label.group === "string" &&
          groups.includes(label.group) &&
          typeof label.value === "string" &&
          Number.isFinite(label.score),
      ) &&
      Array.isArray(garment.palette) &&
      garment.palette.every(
        (swatch) =>
          record(swatch) &&
          Array.isArray(swatch.rgb) &&
          swatch.rgb.length === 3 &&
          swatch.rgb.every(
            (channel) =>
              typeof channel === "number" &&
              Number.isFinite(channel) &&
              channel >= 0 &&
              channel <= 255,
          ) &&
          typeof swatch.share === "number" &&
          Number.isFinite(swatch.share) &&
          swatch.share >= 0 &&
          swatch.share <= 1,
      ) &&
      (garment.embedding === null ||
        (typeof garment.embedding === "string" &&
          garment.embedding.length <= 4096 &&
          /^[A-Za-z0-9+/]*={0,2}$/.test(garment.embedding))) &&
      typeof garment.partial === "boolean",
  );
}

export async function analyzeReference(
  uri: string,
  analyzer: InspirationAnalyzer,
): Promise<InspirationReading> {
  if (!analyzer.isAvailable()) throw new Error("unavailable");
  if (!uri.startsWith("file://")) throw new Error("unreadable");
  const result = await analyzer.analyzeInspiration(uri);
  if (!validAnalysis(result)) throw new Error("invalid-analysis");
  return { garments: inspirationGarments(result), people: result.people };
}

export class InspirationRequest {
  private revision = 0;
  cancel() {
    this.revision += 1;
  }
  async read(
    uri: string,
    analyzer: InspirationAnalyzer,
  ): Promise<InspirationReading | null> {
    const revision = ++this.revision;
    try {
      const reading = await analyzeReference(uri, analyzer);
      return revision === this.revision ? reading : null;
    } catch (error) {
      if (revision !== this.revision) return null;
      throw error;
    }
  }
}
