export type LabelGroup =
  | "kind"
  | "style"
  | "length"
  | "sleeve"
  | "volume"
  | "pattern"
  | "scale"
  | "fabric"
  | "embellishment";

export type LabelScore = { group: LabelGroup; value: string; score: number };

export type Swatch = { rgb: [number, number, number]; share: number };

export type Quality = {
  sharpness: number;
  brightness: number;
  clipped: ("top" | "bottom" | "left" | "right")[];
  coverage?: number | null;
  lightSpread?: number | null;
};

export type PreparedGarment = {
  original: string;
  cutout: string | null;
  enhanced: string | null;
  quality: Quality | null;
  thumbnail: string | null;
  frame: { x: number; y: number; width: number; height: number } | null;
  instances: number;
  labels: LabelScore[];
  palette: Swatch[];
  embedding: string | null;
  area?: { x: number; y: number; width: number; height: number } | null;
  width: number;
  height: number;
  milliseconds: Record<string, number>;
};

export type ReadLabelResult = { photo: string; lines: string[] };

export type LabelExtraction = { json: string | null };

export type GarmentRegionKind =
  | "head"
  | "upper"
  | "skirt"
  | "pants"
  | "dress"
  | "belt"
  | "shoes"
  | "bag"
  | "sunglasses";

export type GarmentRegion = {
  kind: GarmentRegionKind;
  cutout: string;
  frame: { x: number; y: number; width: number; height: number };
  share: number;
  partial: boolean;
};

export type GarmentParse = { regions: GarmentRegion[]; people: number };

export type PrepareOptions = {
  cutout?: string;
  crop?: { x: number; y: number; width: number; height: number };
};

export type CameraFrame = {
  face: { x: number; y: number; width: number; height: number } | null;
  brightness: number | null;
  yaw: number | null;
  roll: number | null;
  motion: number;
};

export type SelfiePoint = {
  part: "skin" | "hair" | "eyes";
  x: number;
  y: number;
  radius: number;
};

export type SelfieReading = {
  skin: [number, number, number] | null;
  hair: [number, number, number] | null;
  eyes: [number, number, number] | null;
  light: "ok" | "dark" | "mixed";
  points: SelfiePoint[];
  face?: [number, number, number, number] | null;
  gains: [number, number, number];
  width: number;
  height: number;
  paper?: boolean;
};

export type City = { name: string; latitude: number; longitude: number };

export type ForecastResult = {
  hours: {
    at: string;
    celsius: number;
    precipitation: "none" | "rain" | "snow";
    chance: number;
    windMs: number;
  }[];
  attribution: { logo: string; url: string };
};

export type ScanCapture = {
  photo: string;
  region: GarmentRegion | null;
  sticker: {
    name: string;
    frame: { x: number; y: number; width: number; height: number };
  } | null;
  box: { x: number; y: number; width: number; height: number };
  milliseconds: Record<string, number>;
};

export type ScanFrameEvent = {
  at: number;
  cols: number;
  rows: number;
  labels: string;
  colours: string;
  hands: number[][];
  milliseconds: Record<string, number>;
};

export type ScanCameraState = "ready" | "unavailable" | "denied";

export type LiveScanHandle = {
  capture(
    id: string,
    box: { x: number; y: number; width: number; height: number },
    kind: string,
  ): Promise<ScanCapture>;
};

export type CutoutEdit = {
  cutout: string;
  enhanced: string;
  thumbnail: string;
  frame: { x: number; y: number; width: number; height: number };
  area: { x: number; y: number; width: number; height: number };
};

export type CutoutEditorHandle = {
  undo(): Promise<void>;
  reset(): Promise<void>;
  zoom(closer: boolean): Promise<void>;
  save(id: string): Promise<CutoutEdit>;
};
