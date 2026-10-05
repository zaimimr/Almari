import type { SFSymbol } from "expo-symbols";
import type { Units } from "../../domain/closet";
import { hourLabel, type DayLine, type Sky, type When } from "../../domain/day";
import { formatDegrees } from "../../domain/units";
import { locale, t } from "../../i18n";

export function skyIcon(sky: Sky, when: When): SFSymbol {
  if (sky === "rain") return "cloud.rain";
  if (sky === "snow") return "cloud.snow";
  return when === "evening" ? "moon" : "cloud.sun";
}

export function degrees(celsius: number | null, units: Units) {
  return celsius === null ? "" : formatDegrees(celsius, units);
}

export function lineText(
  line: DayLine,
  day: "today" | "tomorrow",
  units: Units,
) {
  const temp = formatDegrees(line.celsius, units);
  const time = "hour" in line ? hourLabel(line.hour, locale) : "";
  return { text: t(`${day}.sky.${line.kind}`, { temp, time }), temp };
}

export function whenLabel(when: When) {
  return t(`day.${when}`);
}
