import type {
  LabelExtraction,
  PreparedGarment,
  ReadLabelResult,
} from "./ClosetVision.types";

export default {
  isAvailable: () => false,
  prepare: (_sourceUri: string, _id: string): Promise<PreparedGarment> =>
    Promise.reject(new Error("unavailable")),
  readLabel: (_sourceUri: string, _id: string): Promise<ReadLabelResult> =>
    Promise.reject(new Error("unavailable")),
  labelModelAvailable: (): Promise<boolean> => Promise.resolve(false),
  extractLabel: (_text: string): Promise<LabelExtraction> =>
    Promise.resolve({ json: null }),
};
