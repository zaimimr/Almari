import type { Key } from "../i18n/en";
import type { AdviceReason, Quality } from "./closet";

export const blurBelow = 60;
export const darkBelow = 0.22;
export const mergedAbove = 0.9;
export const mixedLightAbove = 8;

export type Advice = {
  reason: AdviceReason;
  title: Key;
  body: Key;
};

export function adviceReason(
  quality: Quality | null | undefined,
): AdviceReason | null {
  if (!quality) return null;
  if ((quality.coverage ?? 0) > mergedAbove) return "merged";
  if (quality.clipped.length) return "clipped";
  if (quality.brightness < darkBelow) return "dark";
  if (quality.sharpness < blurBelow) return "blur";
  if ((quality.lightSpread ?? 0) > mixedLightAbove) return "mixed-light";
  return null;
}

export function adviceFor(reason: AdviceReason): Advice {
  return {
    reason,
    title: `advice.${reason}.title`,
    body: `advice.${reason}.body`,
  };
}
