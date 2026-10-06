import type {
  Closet,
  DayFit,
  Feel,
  ForecastHour,
  ForecastWeather,
  Slot,
  Style,
} from "./closet";
import { addDays } from "./looks";
import type { Occasion } from "./taxonomy";
import { clockFor } from "./today";
import { localTime, wetChance, weatherFromHours } from "./weather";

export type When = "now" | Slot;

export const eveningFrom = 17;

const windows: Record<Slot, { from: number; to: number }> = {
  morning: { from: 7, to: 12 },
  afternoon: { from: 12, to: 17 },
  evening: { from: 17, to: 22 },
};

export function windowFor(when: When, hour: number) {
  return when === "now"
    ? { from: hour, to: Math.min(24, Math.max(hour + 4, windows.morning.to)) }
    : windows[when];
}

export function slotOf(when: When, hour: number): Slot {
  if (when !== "now") return when;
  return hour >= windows.evening.from
    ? "evening"
    : hour >= windows.afternoon.from
      ? "afternoon"
      : "morning";
}

export function hoursIn(
  hours: ForecastHour[],
  date: string,
  from: number,
  to: number,
  timeZone?: string,
) {
  return hours.filter((item) => {
    const local = localTime(item.at, timeZone);
    return local.date === date && local.hour >= from && local.hour < to;
  });
}

export function windowTemp(
  hours: ForecastHour[],
  date: string,
  from: number,
  to: number,
  timeZone?: string,
): number | null {
  const found = hoursIn(hours, date, from, to, timeZone);
  if (!found.length) return null;
  return found.reduce((sum, item) => sum + item.celsius, 0) / found.length;
}

export function windowWeather(
  hours: ForecastHour[],
  date: string,
  from: number,
  to: number,
  timeZone?: string,
): ForecastWeather | null {
  return weatherFromHours(hoursIn(hours, date, from, to, timeZone), date);
}

export type Sky = "rain" | "snow" | "dry";

export function windowSky(
  hours: ForecastHour[],
  date: string,
  from: number,
  to: number,
  timeZone?: string,
): Sky {
  const found = hoursIn(hours, date, from, to, timeZone);
  return found.some((item) => isWet(item, "snow"))
    ? "snow"
    : found.some((item) => isWet(item, "rain"))
      ? "rain"
      : "dry";
}

const isWet = (item: ForecastHour, kind: "rain" | "snow") =>
  item.precipitation === kind && item.chance >= wetChance;

export type DayLine =
  | { kind: "dry"; celsius: number }
  | { kind: "rain" | "snow"; celsius: number }
  | { kind: "dryThenRain" | "dryThenSnow"; celsius: number; hour: number };

export function dayLine(
  hours: ForecastHour[],
  date: string,
  from: number,
  timeZone?: string,
): DayLine | null {
  const found = hoursIn(hours, date, from, windows.evening.to, timeZone);
  const first = found[0];
  if (!first) return null;
  const celsius = first.celsius;
  const wet = (item: ForecastHour) =>
    isWet(item, "rain") || isWet(item, "snow");
  if (wet(first))
    return { kind: isWet(first, "snow") ? "snow" : "rain", celsius };
  const later = found.find(wet);
  if (!later) return { kind: "dry", celsius };
  return {
    kind: isWet(later, "snow") ? "dryThenSnow" : "dryThenRain",
    celsius,
    hour: localTime(later.at, timeZone).hour,
  };
}

export function hourLabel(hour: number, locale: "en" | "nb") {
  if (locale === "nb") return String(hour).padStart(2, "0");
  const twelve = hour % 12 || 12;
  return `${twelve} ${hour < 12 ? "am" : "pm"}`;
}

export type Brief = {
  occasion?: Occasion;
  when?: Slot;
  style?: Style;
  feel?: Feel;
};

const occasionWords: [Occasion, RegExp][] = [
  ["work", /\b(work|office|meeting|jobb\w*|kontor\w*|møte)\b/],
  ["dinner", /\b(dinner|lunch|restaurant|middag|lunsj|date)\b/],
  ["party", /\b(party|fest|bursdag|birthday|mehndi|mehendi|dholki)\b/],
  ["gym", /\b(gym|workout|run|trening|trene|løping)\b/],
  ["eid", /\b(eid)\b/],
  ["barat", /\b(barat|baraat)\b/],
  ["wedding", /\b(wedding|nikah|walima|bryllup)\b/],
  ["everyday", /\b(everyday|school|uni|errands|hverdag|skole)\b/],
];

const styleWords: [Style, RegExp][] = [
  ["desi", /\b(desi|shalwar|kameez|kurta)\b/],
  ["western", /\b(western|vestlig)\b/],
];

const feelWords: [Feel, RegExp][] = [
  ["dressed", /\b(dressed up|fancy|glam|elegant|finstas)\b/],
  ["smart", /\b(smart|sharp|pen|pent|stilig)\b/],
  ["comfy", /\b(comfy|cosy|cozy|relaxed|koselig|behagelig)\b/],
];

const whenWords: [Slot, RegExp][] = [
  ["evening", /\b(evening|tonight|night|kveld|i kveld)\b/],
  ["afternoon", /\b(afternoon|ettermiddag\w*)\b/],
  ["morning", /\b(morning|formiddag\w*)\b/],
];

function firstMatch<T>(text: string, words: [T, RegExp][]) {
  return words
    .map(([value, pattern]) => ({ value, index: text.search(pattern) }))
    .filter((item) => item.index >= 0)
    .sort((a, b) => a.index - b.index);
}

function clockHour(text: string): number | null {
  const found =
    text.match(
      /\b(?:at|kl\.?|klokka|klokken)\s*(\d{1,2})(?:[:.](\d{2}))?\s*(am|pm)?/,
    ) ?? text.match(/\b(\d{1,2})(?:[:.](\d{2}))?\s*(am|pm)\b/);
  if (!found) return null;
  const hour = Number(found[1]);
  if (hour > 23) return null;
  if (found[3] === "pm" && hour < 12) return hour + 12;
  if (found[3] === "am") return hour % 12;
  return hour < 8 ? hour + 12 : hour;
}

export function parseBrief(input: string): Brief {
  const text = input.toLowerCase();
  const occasions = firstMatch(text, occasionWords);
  const occasion = occasions[0]?.value;
  const hour = clockHour(text);
  const named = firstMatch(text, whenWords)[0]?.value;
  const when =
    occasions.length > 1
      ? undefined
      : hour !== null
        ? slotOf("now", hour)
        : named;
  const style = firstMatch(text, styleWords)[0]?.value;
  const feel = firstMatch(text, feelWords)[0]?.value;
  return {
    ...(occasion ? { occasion } : {}),
    ...(when ? { when } : {}),
    ...(style ? { style } : {}),
    ...(feel ? { feel } : {}),
  };
}

export const keepDays = 14;

export function fitsOn(closet: Closet, date: string): DayFit[] {
  return closet.styling.fits?.[date] ?? [];
}

function withFits(closet: Closet, fits: Record<string, DayFit[]>): Closet {
  return { ...closet, styling: { ...closet.styling, fits } };
}

function changeFits(
  closet: Closet,
  date: string,
  change: (fits: DayFit[]) => DayFit[],
): Closet {
  const oldest = addDays(date, -keepDays);
  const kept = Object.fromEntries(
    Object.entries(closet.styling.fits ?? {}).filter(([day]) => day >= oldest),
  );
  const next = change(kept[date] ?? []);
  if (next.length) kept[date] = next;
  else delete kept[date];
  return withFits(closet, kept);
}

export function addFit(closet: Closet, fit: DayFit): Closet {
  return changeFits(closet, fit.date, (fits) => [
    ...fits.filter((item) => item.id !== fit.id),
    fit,
  ]);
}

export function updateFit(
  closet: Closet,
  date: string,
  id: string,
  change: Partial<Omit<DayFit, "id" | "date">>,
): Closet {
  if (!fitsOn(closet, date).some((fit) => fit.id === id)) return closet;
  return changeFits(closet, date, (fits) =>
    fits.map((fit) => (fit.id === id ? { ...fit, ...change } : fit)),
  );
}

export function unwearFit(closet: Closet, date: string, id: string): Closet {
  if (!fitsOn(closet, date).some((fit) => fit.id === id)) return closet;
  return changeFits(closet, date, (fits) =>
    fits.map((fit) => {
      if (fit.id !== id) return fit;
      const { wornAt: _wornAt, wearId: _wearId, ...rest } = fit;
      return rest;
    }),
  );
}

export function removeFit(closet: Closet, date: string, id: string): Closet {
  if (!fitsOn(closet, date).some((fit) => fit.id === id)) return closet;
  return changeFits(closet, date, (fits) =>
    fits.filter((fit) => fit.id !== id),
  );
}

export type Earlier = {
  key: string;
  pieceIds: string[];
  occasion: Occasion;
  date: string;
};

export function earlierFits(
  closet: Closet,
  today: string,
  timeZone: string,
  limit = 5,
): Earlier[] {
  const seen = new Set<string>();
  const found: Earlier[] = [];
  for (const event of [...closet.feedback].reverse()) {
    if (event.kind !== "wore" || event.undone || event.scope === "piece")
      continue;
    const date = clockFor(new Date(event.at), timeZone).localDate;
    if (date >= today) continue;
    const key = [...event.pieceIds].sort().join();
    if (seen.has(key)) continue;
    if (
      !event.pieceIds.every((id) =>
        closet.pieces.some((piece) => piece.id === id),
      )
    )
      continue;
    seen.add(key);
    found.push({
      key,
      pieceIds: event.pieceIds,
      occasion: event.request.occasion,
      date,
    });
    if (found.length >= limit) break;
  }
  return found;
}
