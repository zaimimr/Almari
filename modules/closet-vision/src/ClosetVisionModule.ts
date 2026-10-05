import { NativeModule, requireOptionalNativeModule } from "expo";
import type {
  Box,
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
  zipFolder(folderUri: string): Promise<string>;
  prepare(
    sourceUri: string,
    id: string,
    options?: PrepareOptions,
  ): Promise<PreparedGarment>;
  parseGarments(sourceUri: string, id: string): Promise<GarmentParse>;
  pickGarment(sourceUri: string, x: number, y: number): Promise<Box | null>;
  studioInput(sourceUri: string, id: string): Promise<string>;
  clearBackground(sourceUri: string, id: string): Promise<string>;
  readLabel(sourceUri: string, id: string): Promise<ReadLabelResult>;
  labelModelAvailable(): Promise<boolean>;
  extractLabel(text: string): Promise<LabelExtraction>;
  analyzeSelfie(uri: string, paper?: boolean): Promise<SelfieReading>;
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
  zipFolder: (_folderUri: string): Promise<string> =>
    Promise.reject(new Error("unavailable")),
  prepare: (
    _sourceUri: string,
    _id: string,
    _options?: PrepareOptions,
  ): Promise<PreparedGarment> => Promise.reject(new Error("unavailable")),
  parseGarments: (_sourceUri: string, _id: string): Promise<GarmentParse> =>
    Promise.reject(new Error("unavailable")),
  pickGarment: async (
    _sourceUri: string,
    _x: number,
    _y: number,
  ): Promise<Box | null> => null,
  studioInput: (_sourceUri: string, _id: string): Promise<string> =>
    Promise.reject(new Error("unavailable")),
  clearBackground: async (sourceUri: string, _id: string): Promise<string> =>
    sourceUri,
  readLabel: (_sourceUri: string, _id: string): Promise<ReadLabelResult> =>
    Promise.reject(new Error("unavailable")),
  labelModelAvailable: (): Promise<boolean> => Promise.resolve(false),
  extractLabel: (_text: string): Promise<LabelExtraction> =>
    Promise.resolve({ json: null }),
  analyzeSelfie: (_uri: string, _paper?: boolean): Promise<SelfieReading> =>
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
