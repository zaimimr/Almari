import type { Closet, Occasion } from "../../domain/closet";
import type { LookEntry } from "../../domain/looks";
import { wearDate } from "../../domain/looks";
import { clockFor } from "../../domain/today";
import { locale, occasionName, t } from "../../i18n";
import { now } from "../../state/clock";
import { shortDate } from "../../ui/dates";

const tags = { en: "en-GB", nb: "nb-NO" } as const;

function shift(date: string, days: number): string {
  const next = new Date(`${date}T00:00:00Z`);
  next.setUTCDate(next.getUTCDate() + days);
  return next.toISOString().slice(0, 10);
}

export function todayDate(): string {
  return clockFor(now()).localDate;
}

export function tomorrowDate(): string {
  return shift(todayDate(), 1);
}

export function dayMonth(date: string): string {
  return new Intl.DateTimeFormat(tags[locale], {
    day: "numeric",
    month: "short",
  }).format(new Date(`${date}T12:00:00`));
}

export function monthName(month: string): string {
  return new Intl.DateTimeFormat(tags[locale], { month: "long" }).format(
    new Date(`${month}-01T12:00:00`),
  );
}

export function plannedText(date: string): string {
  const today = todayDate();
  const day =
    date === today
      ? t("looks.dayToday")
      : date === shift(today, 1)
        ? t("looks.dayTomorrow")
        : shortDate(date, locale);
  return t("looks.planned", { date: day });
}

export function wornDay(closet: Closet, at: string): string {
  const date = wearDate(closet, at);
  const today = todayDate();
  return date === today
    ? t("looks.dayToday")
    : date === shift(today, -1)
      ? t("looks.dayYesterday")
      : dayMonth(date);
}

export function lastWornText(closet: Closet, at: string): string {
  return t("looks.lastWorn", { date: wornDay(closet, at) });
}

function missingText(count: number): string {
  return count === 1
    ? t("looks.missingOne")
    : t("looks.missingMany", { count });
}

export function occasionText(occasion: Occasion | null): string | null {
  return occasion ? occasionName(occasion) : null;
}

export function entryMeta(closet: Closet, entry: LookEntry): string {
  const occasion = occasionText(entry.occasion);
  const planned =
    entry.plannedFor && entry.plannedFor >= todayDate()
      ? plannedText(entry.plannedFor)
      : null;
  const parts = !entry.saved
    ? [occasion, entry.lastWorn ? wornDay(closet, entry.lastWorn) : null]
    : planned && entry.missing
      ? [planned, missingText(entry.missing)]
      : entry.missing
        ? [occasion, missingText(entry.missing)]
        : [
            occasion,
            planned ??
              (entry.lastWorn ? lastWornText(closet, entry.lastWorn) : null),
          ];
  return parts.filter(Boolean).join(" · ");
}
