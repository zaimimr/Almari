import { useCallback, useState } from "react";
import { router, useFocusEffect } from "expo-router";
import type { OutfitRequest } from "../../domain/closet";
import {
  activeSession,
  applyRequest,
  nextLocalDate,
  startOccasion,
  startOver,
  startPlan,
  tryAnother,
} from "../../domain/today";
import { forecastWeather } from "../../domain/weather";
import { t } from "../../i18n";
import { useCloset } from "../../state/closet";
import { useDiscardChanges } from "../../navigation/useDiscardChanges";

let picked: string[] | null = null;

export function pickPieces(ids: string[]) {
  picked = ids;
}

export function takePicked() {
  const ids = picked;
  picked = null;
  return ids;
}

export function useAdjust(keep?: string) {
  const { closet, update } = useCloset();
  const today = closet.styling.today;
  const session = today ? activeSession(today) : null;
  const preset = closet.styling.everyday;
  const [initial] = useState<OutfitRequest | null>(() =>
    session ? session.request : null,
  );
  const [request, setRequest] = useState<OutfitRequest | null>(() =>
    initial && keep
      ? { ...initial, keptIds: [keep], garmentType: null }
      : initial,
  );
  const [date, setDate] = useState(() =>
    session?.date && today && session.date !== today.localDate
      ? session.date
      : (today?.localDate ?? ""),
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (!picked) return;
      const ids = picked;
      picked = null;
      setRequest((current) =>
        current ? { ...current, keptIds: ids, garmentType: null } : current,
      );
    }, []),
  );

  const localDate = today?.localDate ?? "";
  const tomorrow = localDate ? nextLocalDate(localDate) : "";
  const isToday = date === localDate;
  const startedOn =
    session?.date && session.date !== localDate ? session.date : localDate;
  const dirty =
    Boolean(keep) ||
    date !== startedOn ||
    JSON.stringify(request) !== JSON.stringify(initial);
  const allowClose = useDiscardChanges(dirty, busy);

  const set = (changes: Partial<OutfitRequest>) =>
    setRequest((current) => (current ? { ...current, ...changes } : current));

  const chooseDate = (next: string) => {
    setDate(next);
    const covered = forecastWeather(
      closet.styling.forecast,
      next,
      today?.timeZone,
    );
    set({
      weather: covered
        ? { ...covered, exposure: preset?.exposure ?? null }
        : next === startedOn && initial
          ? initial.weather
          : { source: "unknown" },
    });
  };

  async function submit() {
    if (!request || !today || busy) return;
    setBusy(true);
    setError(null);
    try {
      await update((current) => {
        const day = current.styling.today;
        const everyday = current.styling.everyday;
        if (!day) return current;
        if (!dirty) {
          const session = activeSession(day);
          const next = tryAnother(current, session.revision);
          const moved = next.styling.today
            ? activeSession(next.styling.today).cursor !== session.cursor
            : false;
          return moved ? next : startOver(current);
        }
        if (!isToday) return startPlan(current, request, date);
        if (
          day.active === "everyday" &&
          request.occasion === (everyday?.occasion ?? "everyday")
        )
          return applyRequest(current, request, day.everyday.revision);
        return startOccasion(current, request);
      });
      allowClose();
      router.back();
    } catch {
      setError(t("common.error.save"));
    } finally {
      setBusy(false);
    }
  }

  return {
    closet,
    today,
    request,
    set,
    date,
    localDate,
    tomorrow,
    isToday,
    chooseDate,
    dirty,
    busy,
    error,
    submit,
  };
}
