export type CameraReading = {
  face: { x: number; y: number; width: number; height: number } | null;
  brightness: number | null;
  yaw: number | null;
  roll: number | null;
  motion: number;
};

export type Guide =
  | "find"
  | "dark"
  | "closer"
  | "back"
  | "centre"
  | "straight"
  | "still"
  | "ready";

export const guideLimits = {
  centre: { x: 0.5, y: 0.42 },
  offset: 0.1,
  small: 0.34,
  large: 0.62,
  dark: 0.25,
  turn: 20,
  tilt: 15,
  motion: 0.03,
};

export function selfieGuide(reading: CameraReading): Guide {
  const { face, brightness, yaw, roll, motion } = reading;
  if (!face) return "find";
  if (brightness !== null && brightness < guideLimits.dark) return "dark";
  if (face.width < guideLimits.small) return "closer";
  if (face.width > guideLimits.large) return "back";
  const x = face.x + face.width / 2 - guideLimits.centre.x;
  const y = face.y + face.height / 2 - guideLimits.centre.y;
  if (Math.abs(x) > guideLimits.offset || Math.abs(y) > guideLimits.offset)
    return "centre";
  if (
    Math.abs(yaw ?? 0) > guideLimits.turn ||
    Math.abs(roll ?? 0) > guideLimits.tilt
  )
    return "straight";
  if (motion > guideLimits.motion) return "still";
  return "ready";
}

export type SelfieChecks = { light: boolean; framing: boolean; still: boolean };

export function selfieChecks(reading: CameraReading): SelfieChecks {
  const { face, brightness, motion } = reading;
  const framing = selfieGuide({ ...reading, brightness: null, motion: 0 });
  return {
    light: brightness !== null && brightness >= guideLimits.dark,
    framing: face !== null && framing === "ready",
    still: face !== null && motion <= guideLimits.motion,
  };
}

export type GuideSample = { guide: Guide; at: number };

export function readyToCapture(
  samples: GuideSample[],
  now: number,
  hold = 700,
): boolean {
  const lastOther = samples.findLastIndex((sample) => sample.guide !== "ready");
  const since = samples[lastOther + 1];
  return since !== undefined && now - since.at >= hold;
}
