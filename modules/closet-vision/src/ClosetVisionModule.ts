import { NativeModule, requireOptionalNativeModule } from "expo";
import type {
  GarmentParse,
  LabelExtraction,
  PrepareOptions,
  PreparedGarment,
  ReadLabelResult,
} from "./ClosetVision.types";

declare class ClosetVisionModule extends NativeModule {
  isAvailable(): boolean;
  prepare(
    sourceUri: string,
    id: string,
    options?: PrepareOptions,
  ): Promise<PreparedGarment>;
  parseGarments(sourceUri: string, id: string): Promise<GarmentParse>;
  readLabel(sourceUri: string, id: string): Promise<ReadLabelResult>;
  labelModelAvailable(): Promise<boolean>;
  extractLabel(text: string): Promise<LabelExtraction>;
}

const native = requireOptionalNativeModule<ClosetVisionModule>("ClosetVision");

export default native ?? {
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
