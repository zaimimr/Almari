import { NativeModule, requireOptionalNativeModule } from "expo";
import type {
  LabelExtraction,
  PreparedGarment,
  ReadLabelResult,
} from "./ClosetVision.types";

declare class ClosetVisionModule extends NativeModule {
  isAvailable(): boolean;
  prepare(sourceUri: string, id: string): Promise<PreparedGarment>;
  readLabel(sourceUri: string, id: string): Promise<ReadLabelResult>;
  labelModelAvailable(): Promise<boolean>;
  extractLabel(text: string): Promise<LabelExtraction>;
}

const native = requireOptionalNativeModule<ClosetVisionModule>("ClosetVision");

export default native ?? {
  isAvailable: () => false,
  prepare: (_sourceUri: string, _id: string): Promise<PreparedGarment> =>
    Promise.reject(new Error("unavailable")),
  readLabel: (_sourceUri: string, _id: string): Promise<ReadLabelResult> =>
    Promise.reject(new Error("unavailable")),
  labelModelAvailable: (): Promise<boolean> => Promise.resolve(false),
  extractLabel: (_text: string): Promise<LabelExtraction> =>
    Promise.resolve({ json: null }),
};
