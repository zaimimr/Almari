import type { Locale } from "../i18n/translate";

const tags: Record<Locale, string> = { en: "en-GB", nb: "nb-NO" };

const noon = (date: string) => new Date(`${date}T12:00:00`);

const format = (
  date: string,
  locale: Locale,
  options: Intl.DateTimeFormatOptions,
) => new Intl.DateTimeFormat(tags[locale], options).format(noon(date));

export function shortDate(date: string, locale: Locale): string {
  return format(date, locale, {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

export function fullDate(date: string, locale: Locale): string {
  return format(date, locale, { dateStyle: "full" });
}

export function spokenDate(date: string, locale: Locale): string {
  return format(date, locale, {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

export function monthTitle(month: string, locale: Locale): string {
  return format(`${month}-01`, locale, { month: "long", year: "numeric" });
}

export function shortWeekday(date: string, locale: Locale): string {
  return format(date, locale, { weekday: "short" });
}

export function weekdayLetters(locale: Locale): string[] {
  return [5, 6, 7, 8, 9, 10, 11].map((day) =>
    format(`2026-10-${String(day).padStart(2, "0")}`, locale, {
      weekday: "narrow",
    }).toLocaleUpperCase(tags[locale]),
  );
}

export function percent(value: number, locale: Locale): string {
  return new Intl.NumberFormat(tags[locale], { style: "percent" }).format(
    value,
  );
}
