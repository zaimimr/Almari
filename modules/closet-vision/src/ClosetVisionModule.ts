import { NativeModule, requireOptionalNativeModule } from "expo";
import type {
  City,
  ForecastResult,
  GarmentParse,
  LabelExtraction,
  PrepareOptions,
  PreparedGarment,
  ReadLabelResult,
  SelfiePoint,
  SelfieReading,
} from "./ClosetVision.types";

declare class ClosetVisionModule extends NativeModule {
  isAvailable(): boolean;
  prepare(
    sourceUri: string,
    id: string,
    options?: PrepareOptions,
  ): Promise<PreparedGarment>;
  parseGarments(sourceUri: string, id: string): Promise<GarmentParse>;
  studioInput(sourceUri: string, id: string): Promise<string>;
  whitenBackground(sourceUri: string, id: string): Promise<string>;
  readLabel(sourceUri: string, id: string): Promise<ReadLabelResult>;
  labelModelAvailable(): Promise<boolean>;
  extractLabel(text: string): Promise<LabelExtraction>;
  analyzeSelfie(uri: string): Promise<SelfieReading>;
  sampleSelfie(
    uri: string,
    point: SelfiePoint,
    gains: [number, number, number],
  ): Promise<[number, number, number] | null>;
  palettePixels(uri: string): Promise<[number, number, number][]>;
  geocodeCity(name: string): Promise<City | null>;
  forecast(latitude: number, longitude: number): Promise<ForecastResult | null>;
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
  studioInput: (_sourceUri: string, _id: string): Promise<string> =>
    Promise.reject(new Error("unavailable")),
  whitenBackground: async (sourceUri: string, _id: string): Promise<string> =>
    sourceUri,
  readLabel: (_sourceUri: string, _id: string): Promise<ReadLabelResult> =>
    Promise.reject(new Error("unavailable")),
  labelModelAvailable: (): Promise<boolean> => Promise.resolve(false),
  extractLabel: (_text: string): Promise<LabelExtraction> =>
    Promise.resolve({ json: null }),
  analyzeSelfie: (_uri: string): Promise<SelfieReading> =>
    Promise.reject(new Error("unavailable")),
  sampleSelfie: async (
    _uri: string,
    _point: SelfiePoint,
    _gains: [number, number, number],
  ): Promise<[number, number, number] | null> => null,
  palettePixels: (_uri: string): Promise<[number, number, number][]> =>
    Promise.reject(new Error("unavailable")),
  geocodeCity: async (_name: string): Promise<City | null> => null,
  forecast: async (
    _latitude: number,
    _longitude: number,
  ): Promise<ForecastResult | null> => null,
};
