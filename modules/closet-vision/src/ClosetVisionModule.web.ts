import type {
  GarmentParse,
  LabelExtraction,
  PrepareOptions,
  PreparedGarment,
  ReadLabelResult,
} from "./ClosetVision.types";

export default {
  isAvailable: () => false,
  prepare: (
    _sourceUri: string,
    _id: string,
    _options?: PrepareOptions,
  ): Promise<PreparedGarment> => Promise.reject(new Error("unavailable")),
  parseGarments: (_sourceUri: string, _id: string): Promise<GarmentParse> =>
    Promise.reject(new Error("unavailable")),
  readLabel: (_sourceUri: string, _id: string): Promise<ReadLabelResult> =>
    Promise.reject(new Error("unavailable")),
  labelModelAvailable: (): Promise<boolean> => Promise.resolve(false),
  extractLabel: (_text: string): Promise<LabelExtraction> =>
    Promise.resolve({ json: null }),
};
