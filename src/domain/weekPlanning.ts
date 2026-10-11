import { baseRequest } from "./builder";
import {
  coverageNeedFor,
  isAvailable,
  type Closet,
  type Look,
  type Occasion,
  type OutfitRequest,
  type Piece,
  type StylePreset,
  type Weather,
} from "./closet";
import { isPlanDate, plannedOn, weekPlan } from "./looks";
import { outfitName, type NameLocale } from "./outfitName";
import { isNeverWear } from "./preferences";
import { dressLevelOf, dressLevels } from "./dressy";
import { applyStylePreset } from "./presets";
import { evaluateOutfit, roleOf, type Problem } from "./styling";
import { clockFor, resultFor } from "./today";
import { localTime, weatherFromForecast } from "./weather";

export type PlannedDay = {
  date: string;
  request: OutfitRequest;
  pieceIds: string[];
  existing: Look | null;
  problems: Problem[];
  repeated: boolean;
};

export type WeekPreview = {
  days: PlannedDay[];
  pieceSnapshot: Record<string, string>;
  profileSnapshot: string;
  wardrobe: OutfitRequest["wardrobe"];
  timeZone?: string;
};

export type WeekOptions = {
  start: string;
  today: string;
  timeZone?: string;
  preset?: StylePreset;
  dayPresets?: Record<string, StylePreset>;
  occasions?: Record<string, Occasion>;
};

export class StaleWeekPlanError extends Error {}

const setKey = (ids: string[]) => [...ids].sort().join(",");

function planningSettings(closet: Closet): string {
  return JSON.stringify({
    profile: closet.styling.profile,
    rules: closet.styling.rules,
  });
}

function temperatureAllows(
  closet: Closet,
  request: OutfitRequest,
  piece: Piece,
): boolean {
  const weather = request.weather;
  if (weather.source !== "forecast" || weather.feelsLike === undefined)
    return true;
  return !(closet.styling.rules ?? []).some(
    (rule) => rule.kind === piece.kind && weather.feelsLike! >= rule.aboveTemp,
  );
}

function feelDistance(
  closet: Closet,
  ids: string[],
  request: OutfitRequest,
): number {
  if (!request.feel) return 0;
  const goal = { comfy: 0, smart: 1, dressed: 2 }[request.feel];
  const level = dressLevelOf(
    closet.pieces.filter((piece) => ids.includes(piece.id)),
  );
  return level ? Math.abs(dressLevels.indexOf(level) - goal) : 1;
}

export function weekOccasion(date: string): Occasion {
  const weekday = new Date(`${date}T12:00:00Z`).getUTCDay();
  return weekday === 0 || weekday === 6 ? "everyday" : "work";
}

export function planningWeather(
  closet: Closet,
  date: string,
  today: string,
  timeZone?: string,
): Weather {
  const forecast = closet.styling.forecast;
  if (!forecast || localTime(forecast.fetchedAt, timeZone).date !== today)
    return { source: "unknown" };
  return (
    (forecast.hours
      ? weatherFromForecast(forecast.hours, date, timeZone)
      : forecast.date === date
        ? forecast.weather
        : null) ?? {
      source: "unknown",
    }
  );
}

function rememberPieces(usage: Map<string, number>, pieceIds: string[]): void {
  for (const id of pieceIds) usage.set(id, (usage.get(id) ?? 0) + 1);
}

function varietyPenalty(
  ids: string[],
  usage: Map<string, number>,
  pieces: Piece[],
): number {
  return ids.reduce((total, id) => {
    const piece = pieces.find((item) => item.id === id)!;
    const role = roleOf(piece);
    const weight = role === "main" || role === "bottom" ? 4 : 1;
    return total + (usage.get(id) ?? 0) * weight;
  }, 0);
}

function requestFor(closet: Closet, date: string, options: WeekOptions) {
  const base = {
    ...baseRequest(closet),
    keptIds: [],
    excludedIds: [],
    garmentType: null,
    wardrobe: closet.styling.wardrobe,
  };
  const defaultOccasion = weekOccasion(date);
  const preset =
    options.dayPresets?.[date] ??
    options.preset ??
    closet.styling.presets?.find((item) => item.occasion === defaultOccasion);
  const request = preset ? applyStylePreset(base, preset) : base;
  const weather = planningWeather(
    closet,
    date,
    options.today,
    options.timeZone,
  );
  return {
    ...request,
    occasion:
      options.occasions?.[date] ??
      (options.dayPresets?.[date] || options.preset
        ? request.occasion
        : defaultOccasion),
    coverage:
      request.coverage ??
      coverageNeedFor(
        closet.styling.profile.coverageLevel,
        closet.styling.everyday?.coverage,
      ),
    weather:
      weather.source === "unknown"
        ? weather
        : { ...weather, exposure: closet.styling.everyday?.exposure ?? null },
  };
}

export function previewWeek(closet: Closet, options: WeekOptions): WeekPreview {
  if (!isPlanDate(options.start) || options.start < options.today)
    throw new RangeError("invalid-planning-date");
  const slots = weekPlan(closet, options.start);
  const usage = new Map<string, number>();
  const usedSets = new Set<string>();
  for (const { look } of slots) {
    if (!look) continue;
    rememberPieces(usage, look.pieceIds);
    usedSets.add(setKey(look.pieceIds));
  }
  const days = slots.map(({ date, look }): PlannedDay => {
    const request = requestFor(closet, date, options);
    if (look)
      return {
        date,
        request,
        pieceIds: look.pieceIds,
        existing: look,
        problems: [],
        repeated: false,
      };
    const result = resultFor(
      {
        ...closet,
        pieces: closet.pieces.filter((piece) =>
          temperatureAllows(closet, request, piece),
        ),
      },
      request,
      date,
    );
    const eligible = result.outfits.filter(
      (outfit) =>
        !outfit.problems.some((problem) =>
          ["coverage", "coverage-unknown"].includes(problem.code),
        ),
    );
    const closest = eligible[0]
      ? feelDistance(closet, eligible[0].ids, request)
      : null;
    const safe = eligible.filter(
      (outfit) => feelDistance(closet, outfit.ids, request) === closest,
    );
    const fresh = safe.filter((outfit) => !usedSets.has(setKey(outfit.ids)));
    const choices = fresh.length ? fresh : safe;
    const best = [...choices].sort(
      (a, b) =>
        varietyPenalty(a.ids, usage, closet.pieces) -
          varietyPenalty(b.ids, usage, closet.pieces) || b.score - a.score,
    )[0];
    const pieceIds = best?.ids ?? [];
    const repeated = best ? usedSets.has(setKey(pieceIds)) : false;
    if (best) {
      rememberPieces(usage, pieceIds);
      usedSets.add(setKey(pieceIds));
    }
    return {
      date,
      request,
      pieceIds,
      existing: null,
      problems: best?.problems ?? result.problems,
      repeated,
    };
  });
  return {
    days,
    pieceSnapshot: Object.fromEntries(
      closet.pieces
        .filter((piece) => days.some((day) => day.pieceIds.includes(piece.id)))
        .map((piece) => [piece.id, JSON.stringify(piece)]),
    ),
    profileSnapshot: planningSettings(closet),
    wardrobe: closet.styling.wardrobe,
    timeZone: options.timeZone,
  };
}

export function saveWeekPlan(
  closet: Closet,
  preview: WeekPreview,
  selectedDates: string[],
  stamp: string,
  locale: NameLocale,
): Closet {
  const selected = new Set(selectedDates);
  if (!selected.size) return closet;
  if (
    preview.wardrobe !== closet.styling.wardrobe ||
    preview.profileSnapshot !== planningSettings(closet)
  )
    throw new StaleWeekPlanError("styling-changed");
  const days = preview.days.filter((day) => selected.has(day.date));
  if (days.length !== selected.size)
    throw new StaleWeekPlanError("unknown-planning-day");
  const looks = days.map((day): Look => {
    if (
      !isPlanDate(day.date) ||
      day.date < clockFor(new Date(stamp), preview.timeZone).localDate ||
      day.existing ||
      !day.pieceIds.length ||
      plannedOn(closet, day.date)
    )
      throw new StaleWeekPlanError("planning-day-changed");
    const pieces = day.pieceIds.map((id) =>
      closet.pieces.find((piece) => piece.id === id),
    );
    if (
      pieces.some(
        (piece) =>
          !piece ||
          !isAvailable(piece) ||
          piece.source !== preview.wardrobe ||
          isNeverWear(closet.styling.profile, piece) ||
          JSON.stringify(piece) !== preview.pieceSnapshot[piece.id],
      )
    )
      throw new StaleWeekPlanError("clothes-changed");
    const outfit = pieces as Piece[];
    const problems = evaluateOutfit(outfit, day.request, closet.pieces);
    if (
      outfit.some((piece) => !temperatureAllows(closet, day.request, piece)) ||
      problems.some(
        (problem) =>
          problem.severity !== "review" || problem.code === "coverage-unknown",
      )
    )
      throw new StaleWeekPlanError("outfit-changed");
    const id = `week-${stamp}-${day.date}`;
    if (closet.looks.some((look) => look.id === id))
      throw new StaleWeekPlanError("planning-identifier-exists");
    return {
      id,
      name: outfitName(outfit, day.request.occasion, locale),
      pieceIds: [...day.pieceIds],
      occasion: day.request.occasion,
      createdAt: stamp,
      plannedFor: day.date,
    };
  });
  return { ...closet, looks: [...closet.looks, ...looks] };
}
