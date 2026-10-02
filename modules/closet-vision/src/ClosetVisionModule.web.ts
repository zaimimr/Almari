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

export default {
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
  geocodeCity: async (_name: string): Promise<City | null> => null,
  forecast: async (
    _latitude: number,
    _longitude: number,
  ): Promise<ForecastResult | null> => null,
};
