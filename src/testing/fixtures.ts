import { File, Paths } from "expo-file-system";
import type {
  ForecastResult,
  SelfieReading,
} from "../../modules/closet-vision/src";
import type { NativeScanFrame } from "../domain/scan";
import type { CameraReading } from "../domain/selfieGuide";

export type Fixtures = {
  now?: string;
  scan?: string;
  forecast?: ForecastResult | "fail";
  failWrite?: boolean;
  slowPrepare?: number;
  failPrepare?: number;
  failCapture?: number;
  studio?: "ok" | "offline" | "limit" | "fail";
  cameraFails?: boolean;
  selfie?: SelfieReading;
  selfieLive?: boolean;
  language?: "en" | "nb";
  offline?: boolean;
  launchDay?: "today" | "tomorrow";
};

export type FixtureFrame = NativeScanFrame & { image: number; cutout: string };

export type ScanFixture = {
  frames: FixtureFrame[];
  images: number[];
  cutouts: Record<string, number>;
};

export let fixtures: Fixtures = {};
export let loadedAt = Date.now();

const scans: Record<string, ScanFixture> = {
  "kameez-dupatta": {
    frames: require("../../assets/fixtures/scan/kameez-dupatta/frames.json"),
    images: [
      require("../../assets/fixtures/scan/kameez-dupatta/frame-1.jpg"),
      require("../../assets/fixtures/scan/kameez-dupatta/frame-2.jpg"),
    ],
    cutouts: {
      kameez: require("../../assets/fixtures/scan/kameez-dupatta/kameez.png"),
      dupatta: require("../../assets/fixtures/scan/kameez-dupatta/dupatta.png"),
    },
  },
};

let loading: Promise<void> | null = null;

async function read() {
  try {
    const file = new File(
      Paths.document.uri.replace(/Containers\/.*$/, ""),
      "almari-fixtures.json",
    );
    if (file.exists) fixtures = JSON.parse(await file.text());
  } catch {
    fixtures = {};
  }
  loadedAt = Date.now();
}

export function loadFixtures(): Promise<void> {
  loading ??= read();
  return loading;
}

export function scanFixture(name: string): ScanFixture | null {
  return scans[name] ?? null;
}

export const selfiePhoto = require("../../assets/fixtures/selfie.jpg");

const centred = { x: 0.3, y: 0.22, width: 0.4, height: 0.4 };

export function liveSelfieReading(elapsed: number): CameraReading {
  if (elapsed < 900)
    return { face: null, brightness: 0.5, yaw: 0, roll: 0, motion: 0.1 };
  if (elapsed < 2000)
    return {
      face: { ...centred, x: 0.12 },
      brightness: 0.5,
      yaw: 0,
      roll: 0,
      motion: 0.1,
    };
  if (elapsed < 3100)
    return { face: centred, brightness: 0.5, yaw: 0, roll: 0, motion: 0.1 };
  return { face: centred, brightness: 0.5, yaw: 0, roll: 0, motion: 0 };
}
