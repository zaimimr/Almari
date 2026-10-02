import { heightRange, type Units } from "./closet";

export function formatTemperature(celsius: number, units: Units) {
  return units === "imperial"
    ? `${Math.round((celsius * 9) / 5 + 32)}°F`
    : `${Math.round(celsius)}°C`;
}

export function feetAndInches(cm: number) {
  const total = Math.round(cm / 2.54);
  return { feet: Math.floor(total / 12), inches: total % 12 };
}

export function formatHeight(cm: number, units: Units) {
  if (units === "metric") return `${cm} cm`;
  const { feet, inches } = feetAndInches(cm);
  return `${feet} ft ${inches} in`;
}

function numberFrom(text: string | undefined) {
  const clean = (text ?? "").trim().replace(",", ".");
  return clean ? Number(clean) : NaN;
}

export function parseHeight(
  units: Units,
  entry: { cm?: string; feet?: string; inches?: string },
): number | null {
  const inches = entry.inches?.trim() ? numberFrom(entry.inches) : 0;
  const cm =
    units === "metric"
      ? numberFrom(entry.cm)
      : inches >= 0 && inches < 12
        ? (numberFrom(entry.feet) * 12 + inches) * 2.54
        : NaN;
  const rounded = Math.round(cm);
  return Number.isFinite(cm) &&
    rounded >= heightRange.min &&
    rounded <= heightRange.max
    ? rounded
    : null;
}
