import type {
  Closet,
  OutfitRequest,
  PersonalRule,
  Piece,
  Removal,
} from "./closet";
import type { GarmentKind } from "./taxonomy";
import { daytimeHours, feelsLike } from "./weather";

export const askAfter = 2;
const similarWithin = 10;

export function feelsFor(
  closet: Closet,
  request: OutfitRequest,
  date: string,
): number | null {
  const forecast = closet.styling.forecast;
  if (request.weather.source !== "forecast" || forecast?.date !== date)
    return null;
  const day = daytimeHours(
    forecast.hours ?? [],
    date,
    closet.styling.today?.timeZone,
  );
  return day.length
    ? day.reduce((sum, item) => sum + feelsLike(item.celsius, item.windMs), 0) /
        day.length
    : (forecast.low + forecast.high) / 2;
}

export function ruleAllows(
  closet: Closet,
  request: OutfitRequest,
  date: string,
): (piece: Piece) => boolean {
  const rules = closet.styling.rules ?? [];
  const feels = rules.length ? feelsFor(closet, request, date) : null;
  return (piece) =>
    feels === null ||
    request.keptIds.includes(piece.id) ||
    piece.kind === request.garmentType ||
    !rules.some((rule) => rule.kind === piece.kind && feels >= rule.aboveTemp);
}

export function ruleToAsk(closet: Closet): PersonalRule | null {
  const done = new Set([
    ...(closet.styling.ruleAsked ?? []),
    ...(closet.styling.rules ?? []).map((rule) => rule.kind),
  ]);
  const removals = closet.feedback
    .flatMap((event) =>
      event.kind === "removed" && !event.undone && event.removed
        ? [event.removed]
        : [],
    )
    .filter(
      (removal): removal is Removal & { kind: GarmentKind; feels: number } =>
        !!removal.kind && removal.feels !== null && !done.has(removal.kind),
    )
    .reverse();
  for (const kind of new Set(removals.map((removal) => removal.kind))) {
    const temps = removals
      .filter((removal) => removal.kind === kind)
      .map((removal) => removal.feels);
    const top = Math.max(...temps);
    const similar = temps.filter((temp) => temp >= top - similarWithin);
    if (similar.length >= askAfter)
      return { kind, aboveTemp: Math.round(Math.min(...similar)) };
  }
  return null;
}

export function answerRule(
  closet: Closet,
  rule: PersonalRule,
  accept: boolean,
): Closet {
  const asked = closet.styling.ruleAsked ?? [];
  const rules = closet.styling.rules ?? [];
  return {
    ...closet,
    styling: {
      ...closet.styling,
      ruleAsked: asked.includes(rule.kind) ? asked : [...asked, rule.kind],
      ...(accept
        ? {
            rules: [...rules.filter((item) => item.kind !== rule.kind), rule],
          }
        : {}),
    },
  };
}

export function removeRule(closet: Closet, kind: GarmentKind): Closet {
  return {
    ...closet,
    styling: {
      ...closet.styling,
      rules: (closet.styling.rules ?? []).filter((rule) => rule.kind !== kind),
    },
  };
}
