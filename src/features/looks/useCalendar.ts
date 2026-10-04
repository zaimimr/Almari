import { useState } from "react";
import type { Piece } from "../../domain/closet";
import { firstWearMonth, wearCalendar } from "../../domain/looks";
import { monthWearStats } from "../../domain/profileStats";
import { clockFor } from "../../domain/today";
import { locale } from "../../i18n";
import { useCloset } from "../../state/closet";
import { now } from "../../state/clock";

function shiftMonth(month: string, delta: number): string {
  const date = new Date(`${month}-01T12:00:00Z`);
  date.setUTCMonth(date.getUTCMonth() + delta);
  return date.toISOString().slice(0, 7);
}

export function useCalendar() {
  const { closet } = useCloset();
  const clock = clockFor(now());
  const current = clock.localDate.slice(0, 7);
  const [month, setMonth] = useState(current);
  const [selected, setSelected] = useState<string | null>(null);
  const days = wearCalendar(closet, month, locale);
  const marks: Record<string, Piece> = {};
  for (const day of Object.values(days))
    if (day.mark) marks[day.date] = day.mark;
  const stats = monthWearStats(closet, month, clock);

  return {
    closet,
    today: clock.localDate,
    month,
    first: firstWearMonth(closet) ?? current,
    days,
    marks,
    wornCount: Object.keys(days).length,
    selected,
    select: (date: string) =>
      setSelected((open) => (open === date ? null : date)),
    page: (delta: -1 | 1) => {
      setSelected(null);
      setMonth((shown) => shiftMonth(shown, delta));
    },
    stats,
  };
}
