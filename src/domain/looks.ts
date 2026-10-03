import {
  categories,
  type Closet,
  type FeedbackEvent,
  type Look,
  type Occasion,
  type Piece,
} from "./closet";
import { outfitName, type NameLocale } from "./outfitName";
import { clockFor, type Clock } from "./today";

export type LookEntry = {
  id: string;
  name: string;
  occasion: Occasion | null;
  pieceIds: string[];
  at: string;
  saved: boolean;
  lookId: string | null;
  lastWorn: string | null;
  plannedFor: string | null;
  missing: number;
};

export type CalendarDay = {
  date: string;
  wears: {
    eventId: string;
    pieceIds: string[];
    lookId: string | null;
    name: string;
    occasion: Occasion | null;
  }[];
  mark: Piece | null;
};

const setKey = (ids: string[]) => [...ids].sort().join(",");

const later = (a: string, b: string | null) => (b && b > a ? b : a);

function piecesOf(closet: Closet, ids: string[]): Piece[] {
  return ids.flatMap((id) => {
    const piece = closet.pieces.find((item) => item.id === id);
    return piece ? [piece] : [];
  });
}

function outfitWears(closet: Closet): FeedbackEvent[] {
  return closet.feedback.filter(
    (event) =>
      event.kind === "wore" && !event.undone && event.scope !== "piece",
  );
}

function lastWears(closet: Closet): Map<string, FeedbackEvent> {
  const last = new Map<string, FeedbackEvent>();
  for (const event of outfitWears(closet)) {
    const key = setKey(event.pieceIds);
    const seen = last.get(key);
    if (!seen || event.at >= seen.at) last.set(key, event);
  }
  return last;
}

function setName(
  closet: Closet,
  pieceIds: string[],
  occasion: Occasion,
  locale: NameLocale,
): string {
  return (
    closet.setNames?.[setKey(pieceIds)] ??
    outfitName(piecesOf(closet, pieceIds), occasion, locale)
  );
}

export function lookEntries(closet: Closet, locale: NameLocale): LookEntry[] {
  const wears = lastWears(closet);
  const saved: LookEntry[] = closet.looks.map((look) => {
    const lastWorn = wears.get(setKey(look.pieceIds))?.at ?? null;
    return {
      id: look.id,
      name: look.name,
      occasion: look.occasion ?? null,
      pieceIds: look.pieceIds,
      at: later(look.createdAt, lastWorn),
      saved: true,
      lookId: look.id,
      lastWorn,
      plannedFor: look.plannedFor ?? null,
      missing: look.pieceIds.length - piecesOf(closet, look.pieceIds).length,
    };
  });
  const seen = new Set(saved.map((entry) => setKey(entry.pieceIds)));
  const worn: LookEntry[] = [...wears].flatMap(([key, event]) => {
    const found = piecesOf(closet, event.pieceIds).length;
    if (seen.has(key) || !found) return [];
    return [
      {
        id: `set-${key}`,
        name: setName(closet, event.pieceIds, event.request.occasion, locale),
        occasion: event.request.occasion,
        pieceIds: event.pieceIds,
        at: event.at,
        saved: false,
        lookId: null,
        lastWorn: event.at,
        plannedFor: null,
        missing: event.pieceIds.length - found,
      },
    ];
  });
  const today = closet.styling.today?.localDate ?? "";
  const ahead = (entry: LookEntry) =>
    entry.plannedFor && entry.plannedFor >= today ? entry.plannedFor : null;
  return [...worn, ...saved].sort((a, b) => {
    const [first, second] = [ahead(a), ahead(b)];
    if (first || second)
      return !first ? 1 : !second ? -1 : first.localeCompare(second);
    return b.at.localeCompare(a.at);
  });
}

export function lookForPieces(closet: Closet, pieceIds: string[]): Look | null {
  const key = setKey(pieceIds);
  return closet.looks.find((look) => setKey(look.pieceIds) === key) ?? null;
}

export function removeLook(closet: Closet, id: string): Closet {
  const look = closet.looks.find((item) => item.id === id);
  if (!look) return closet;
  const key = setKey(look.pieceIds);
  const looks = closet.looks.filter((item) => item.id !== id);
  return lastWears(closet).has(key)
    ? { ...closet, looks, setNames: { ...closet.setNames, [key]: look.name } }
    : { ...closet, looks };
}

export function renameSet(
  closet: Closet,
  pieceIds: string[],
  name: string,
): Closet {
  const clean = name.trim();
  if (!clean) return closet;
  return {
    ...closet,
    setNames: { ...closet.setNames, [setKey(pieceIds)]: clean },
  };
}

export function setPlannedFor(
  closet: Closet,
  lookId: string,
  date: string | null,
): Closet {
  return {
    ...closet,
    looks: closet.looks.map((look) => {
      if (look.id !== lookId) return look;
      const { plannedFor: _, ...rest } = look;
      return date ? { ...rest, plannedFor: date } : rest;
    }),
  };
}

export function plannedToday(closet: Closet, clock: Clock): Look[] {
  return closet.looks.filter((look) => look.plannedFor === clock.localDate);
}

function addDays(date: string, days: number): string {
  const next = new Date(`${date}T00:00:00Z`);
  next.setUTCDate(next.getUTCDate() + days);
  return next.toISOString().slice(0, 10);
}

export function plannedPieces(
  closet: Closet,
  clock: Clock,
): Record<string, string> {
  const last = addDays(clock.localDate, 7);
  const planned: Record<string, string> = {};
  for (const look of closet.looks) {
    const date = look.plannedFor;
    if (!date || date <= clock.localDate || date > last) continue;
    for (const id of look.pieceIds)
      if (!planned[id] || date < planned[id]) planned[id] = date;
  }
  return planned;
}

export function wearDate(closet: Closet, iso: string): string {
  return clockFor(new Date(iso), closet.styling.today?.timeZone).localDate;
}

const dressing = categories.map((category) => category.id);

function markOf(pieces: Piece[]): Piece | null {
  const ordered = [...pieces].sort(
    (a, b) => dressing.indexOf(a.category) - dressing.indexOf(b.category),
  );
  return (
    ordered.find((piece) => piece.category !== "hijab") ?? ordered[0] ?? null
  );
}

function calendarWears(closet: Closet): FeedbackEvent[] {
  return outfitWears(closet).filter(
    (event) => piecesOf(closet, event.pieceIds).length,
  );
}

export function wearCalendar(
  closet: Closet,
  month: string,
  locale: NameLocale,
): Record<string, CalendarDay> {
  const days: Record<string, CalendarDay> = {};
  for (const event of calendarWears(closet)) {
    const date = wearDate(closet, event.at);
    if (!date.startsWith(`${month}-`)) continue;
    const look = lookForPieces(closet, event.pieceIds);
    const day = (days[date] ??= {
      date,
      wears: [],
      mark: markOf(piecesOf(closet, event.pieceIds)),
    });
    day.wears.push({
      eventId: event.id,
      pieceIds: event.pieceIds,
      lookId: look?.id ?? null,
      name:
        look?.name ??
        setName(closet, event.pieceIds, event.request.occasion, locale),
      occasion: look ? (look.occasion ?? null) : event.request.occasion,
    });
  }
  return days;
}

export function firstWearMonth(closet: Closet): string | null {
  const months = calendarWears(closet).map((event) =>
    wearDate(closet, event.at).slice(0, 7),
  );
  return months.length ? months.sort()[0]! : null;
}
