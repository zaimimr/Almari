import { heightRange, weightRange, type Units } from "./closet";

export function formatTemperature(celsius: number, units: Units) {
  return units === "imperial"
    ? `${Math.round((celsius * 9) / 5 + 32)}°F`
    : `${Math.round(celsius)}°C`;
}

export function formatDegrees(celsius: number, units: Units) {
  return `${Math.round(units === "imperial" ? (celsius * 9) / 5 + 32 : celsius)}°`;
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

const poundsPerKg = 2.20462;

export function formatWeight(kg: number, units: Units) {
  return units === "metric"
    ? `${Math.round(kg)} kg`
    : `${Math.round(kg * poundsPerKg)} lb`;
}

export type Measure = "height" | "weight";

export type Scale = {
  min: number;
  max: number;
  mid: number;
  major: number;
  start: number;
  toBase: (mark: number) => number;
  fromBase: (value: number) => number;
  label: (mark: number) => string;
  parts: (value: number) => { amount: string; unit: string }[];
};

const clamp = (value: number, range: { min: number; max: number }) =>
  Math.min(range.max, Math.max(range.min, value));

export function scaleFor(measure: Measure, units: Units): Scale {
  if (measure === "height" && units === "metric")
    return {
      ...heightRange,
      mid: 5,
      major: 10,
      start: 165,
      toBase: (mark) => clamp(mark, heightRange),
      fromBase: (cm) => cm,
      label: String,
      parts: (cm) => [{ amount: String(cm), unit: "cm" }],
    };
  if (measure === "height")
    return {
      min: Math.ceil(heightRange.min / 2.54),
      max: Math.floor(heightRange.max / 2.54),
      mid: 6,
      major: 12,
      start: 65,
      toBase: (inches) => clamp(Math.round(inches * 2.54), heightRange),
      fromBase: (cm) => Math.round(cm / 2.54),
      label: (inches) => `${inches / 12} ft`,
      parts: (cm) => {
        const { feet, inches } = feetAndInches(cm);
        return [
          { amount: String(feet), unit: "ft" },
          { amount: String(inches), unit: "in" },
        ];
      },
    };
  if (units === "metric")
    return {
      ...weightRange,
      mid: 5,
      major: 10,
      start: 65,
      toBase: (kg) => clamp(kg, weightRange),
      fromBase: (kg) => Math.round(kg),
      label: String,
      parts: (kg) => [{ amount: String(Math.round(kg)), unit: "kg" }],
    };
  return {
    min: Math.ceil(weightRange.min * poundsPerKg),
    max: Math.floor(weightRange.max * poundsPerKg),
    mid: 5,
    major: 10,
    start: 145,
    toBase: (lb) =>
      clamp(Math.round((lb / poundsPerKg) * 10) / 10, weightRange),
    fromBase: (kg) => Math.round(kg * poundsPerKg),
    label: String,
    parts: (kg) => [
      { amount: String(Math.round(kg * poundsPerKg)), unit: "lb" },
    ],
  };
}
