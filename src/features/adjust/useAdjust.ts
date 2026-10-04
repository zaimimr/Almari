import { useCallback, useState } from "react";
import { router, useFocusEffect } from "expo-router";
import type { OutfitRequest, Weather } from "../../domain/closet";
import {
  activeSession,
  applyRequest,
  clockFor,
  nextLocalDate,
  saveEverydayStyle,
  startOccasion,
  startPlan,
} from "../../domain/today";
import { forecastWeather } from "../../domain/weather";
import { t } from "../../i18n";
import { useCloset } from "../../state/closet";
import { now } from "../../state/clock";
import { useDiscardChanges } from "../../navigation/useDiscardChanges";

export type Exposure = "mostly-indoors" | "time-outside";

let picked: string[] | null = null;

export function pickPieces(ids: string[]) {
  picked = ids;
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
  const [exposure, setExposure] = useState<Exposure>(() => {
    const weather = initial?.weather;
    return (
      (weather && weather.source !== "unknown" ? weather.exposure : null) ??
      preset?.exposure ??
      "mostly-indoors"
    );
  });
  const [includeSetAside, setIncludeSetAside] = useState(false);
  const [makeEveryday, setMakeEveryday] = useState(false);
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
  const forecast = forecastWeather(
    closet.styling.forecast,
    date,
    today?.timeZone,
  );
  const startedOn =
    session?.date && session.date !== localDate ? session.date : localDate;
  const dirty =
    Boolean(keep) ||
    makeEveryday ||
    includeSetAside ||
    date !== startedOn ||
    JSON.stringify(request) !== JSON.stringify(initial);
  const allowClose = useDiscardChanges(dirty, busy);

  const set = (changes: Partial<OutfitRequest>) =>
    setRequest((current) => (current ? { ...current, ...changes } : current));

  const chooseDate = (next: string) => {
    setDate(next);
    if (next !== localDate) setMakeEveryday(false);
    const covered = forecastWeather(
      closet.styling.forecast,
      next,
      today?.timeZone,
    );
    if (request?.weather.source === "forecast" && !covered)
      set({ weather: { source: "unknown" } });
  };

  const withExposure = (weather: Weather): Weather =>
    weather.source === "unknown" ? weather : { ...weather, exposure };

  async function submit() {
    if (!request || !today || busy) return;
    setBusy(true);
    setError(null);
    const final: OutfitRequest = {
      ...request,
      weather: withExposure(request.weather),
      excludedIds: includeSetAside ? [] : request.excludedIds,
    };
    try {
      await update((current) => {
        const day = current.styling.today;
        const everyday = current.styling.everyday;
        if (!day) return current;
        if (!isToday) return startPlan(current, final, date);
        if (makeEveryday && everyday) {
          const saved = saveEverydayStyle(
            current,
            {
              occasion: final.occasion,
              style: final.style,
              hijab: everyday.hijab,
              sample: everyday.sample,
              coverage: everyday.coverage,
              exposure,
            },
            clockFor(now()),
            true,
          );
          const fresh = saved.styling.today;
          if (!fresh) return saved;
          const everydaySaved: typeof saved = {
            ...saved,
            styling: {
              ...saved.styling,
              today: { ...fresh, active: "everyday", occasion: null },
            },
          };
          return applyRequest(
            everydaySaved,
            final,
            everydaySaved.styling.today!.everyday.revision,
          );
        }
        if (
          day.active === "everyday" &&
          final.occasion === (everyday?.occasion ?? "everyday")
        )
          return applyRequest(current, final, day.everyday.revision);
        return startOccasion(current, final);
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
    forecast,
    exposure,
    setExposure,
    includeSetAside,
    setIncludeSetAside,
    makeEveryday,
    setMakeEveryday,
    dirty,
    busy,
    error,
    submit,
  };
}
