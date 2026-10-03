import { File, Paths } from "expo-file-system";
import type { ForecastResult } from "../../modules/closet-vision/src";
import type { NativeScanFrame } from "../domain/scan";

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
