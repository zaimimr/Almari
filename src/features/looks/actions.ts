import type { Closet, Occasion } from "../../domain/closet";
import { woreThis } from "../../domain/feedback";
import { plannedOn } from "../../domain/looks";
import {
  activeSession,
  clockFor,
  ensureToday,
  showLook,
} from "../../domain/today";
import { locale, t } from "../../i18n";
import { now } from "../../state/clock";
import { confirmAction } from "../../ui/confirm";
import { shortDate } from "../../ui/dates";

type Shown = { pieceIds: string[]; occasion?: Occasion | null };

export function showOn(look: Shown) {
  return (closet: Closet) =>
    showLook(ensureToday(closet, clockFor(now())), look);
}

export function wearAgain(look: Shown, id: string) {
  return (closet: Closet) => {
    const shown = showOn(look)(closet);
    const state = shown.styling.today;
    return state
      ? woreThis(shown, activeSession(state).revision, now().toISOString(), id)
      : shown;
  };
}

export function confirmReplace(
  closet: Closet,
  date: string,
  lookId: string | null,
): Promise<boolean> {
  const other = plannedOn(closet, date);
  if (!other || other.id === lookId) return Promise.resolve(true);
  return confirmAction(
    t("looks.replaceTitle", {
      name: other.name,
      date: shortDate(date, locale),
    }),
    "",
    t("looks.replace"),
  );
}
