import { useCallback, useEffect, useState } from "react";
import { AppState } from "react-native";
import { router, useFocusEffect } from "expo-router";
import type { Closet, DayFit, Occasion } from "../../domain/closet";
import {
  dayLine,
  earlierFits,
  eveningFrom,
  fitsOn,
  slotOf,
  windowFor,
  windowSky,
  windowTemp,
  type When,
} from "../../domain/day";
import { plannedToday } from "../../domain/looks";
import {
  clockFor,
  ensureToday,
  nextLocalDate,
  saveForecast,
  showLook,
} from "../../domain/today";
import { forecastFor, forecastWeather } from "../../domain/weather";
import { useCloset } from "../../state/closet";
import { now } from "../../state/clock";
import { fetchForecast } from "../../state/forecast";
import { onLaunchIntent, takeLaunchIntent } from "../../state/launch";

export type Day = "today" | "tomorrow";

const at = () => now().toISOString();

export function useHome() {
  const { closet, update } = useCloset();
  const [hour, setHour] = useState(() => now().getHours());
  const [foregrounded, setForegrounded] = useState(0);
  const [picked, setPicked] = useState<Day | null>(null);
  const [styling, setStyling] = useState(false);
  const [failed, setFailed] = useState<((closet: Closet) => Closet) | null>(
    null,
  );
  const clock = clockFor(now());
  const tomorrowDate = nextLocalDate(clock.localDate);
  const evening = hour >= eveningFrom;
  const day: Day = picked ?? (evening ? "tomorrow" : "today");
  const date = day === "tomorrow" ? tomorrowDate : clock.localDate;

  const takeIntent = useCallback(() => {
    setHour(now().getHours());
    const intent = takeLaunchIntent();
    if (intent) setPicked(intent.day);
  }, []);
  useFocusEffect(takeIntent);
  useEffect(() => onLaunchIntent(takeIntent), [takeIntent]);

  useEffect(() => {
    const refresh = () => {
      void update((current) => ensureToday(current, clockFor(now()))).catch(
        () => undefined,
      );
    };
    refresh();
    const subscription = AppState.addEventListener("change", (state) => {
      if (state !== "active") return;
      refresh();
      setHour(now().getHours());
      setForegrounded((count) => count + 1);
    });
    return () => subscription.remove();
  }, [update]);

  const place = closet.styling.place;
  const stored = closet.styling.forecast;
  const needsForecast =
    !!place &&
    (!forecastWeather(stored, clock.localDate, clock.timeZone) ||
      !stored?.hours);
  const forecastKey = `${clock.localDate}:${foregrounded}:${place?.latitude}:${place?.longitude}`;
  const [forecastDone, setForecastDone] = useState<string | null>(null);
  useEffect(() => {
    if (!place || !needsForecast) return;
    const today = clockFor(now());
    let active = true;
    fetchForecast(place.latitude, place.longitude)
      .then((found) => {
        const fresh = found
          ? forecastFor(found, today.localDate, at(), today.timeZone)
          : null;
        if (!active) return;
        setForecastDone(forecastKey);
        if (fresh) return update((current) => saveForecast(current, fresh));
      })
      .catch(() => {
        if (active) setForecastDone(forecastKey);
      });
    return () => {
      active = false;
    };
  }, [place, needsForecast, forecastKey, update]);
  const forecastLoading = needsForecast && forecastDone !== forecastKey;

  const hours =
    stored?.hours && forecastWeather(stored, clock.localDate, clock.timeZone)
      ? stored.hours
      : [];
  const from = day === "today" ? hour : windowFor("morning", hour).from;
  const line = dayLine(hours, date, from, clock.timeZone);
  const tiles = (["morning", "afternoon", "evening"] as const).map((slot) => {
    const window = windowFor(slot, hour);
    return {
      slot,
      celsius: windowTemp(hours, date, window.from, window.to, clock.timeZone),
      sky: windowSky(hours, date, window.from, window.to, clock.timeZone),
      past: day === "today" && hour >= window.to,
    };
  });
  const slotWeather = (when: When) => {
    const window = windowFor(when, hour);
    return {
      celsius: windowTemp(hours, date, window.from, window.to, clock.timeZone),
      sky: windowSky(hours, date, window.from, window.to, clock.timeZone),
    };
  };

  const fits = fitsOn(closet, date);
  const fitKeys = new Set(fits.map((fit) => [...fit.pieceIds].sort().join()));
  const looks =
    day === "today"
      ? plannedToday(closet, clock).filter(
          (look) => !fitKeys.has([...look.pieceIds].sort().join()),
        )
      : closet.looks.filter(
          (look) =>
            look.plannedFor === tomorrowDate &&
            !fitKeys.has([...look.pieceIds].sort().join()),
        );
  const earlier = earlierFits(closet, clock.localDate, clock.timeZone);

  const restyle = useCallback(
    async (transform: (closet: Closet) => Closet) => {
      setStyling(true);
      try {
        await update(transform);
        setFailed(null);
        return true;
      } catch {
        setFailed(() => transform);
        return false;
      } finally {
        setStyling(false);
      }
    },
    [update],
  );
  const stylingFailed = failed ? () => void restyle(failed) : null;

  const open = async (
    look: { pieceIds: string[]; occasion?: Occasion | null },
    fit?: DayFit,
  ) => {
    const ready = await restyle((current) =>
      showLook(ensureToday(current, clockFor(now())), look),
    );
    if (!ready) return;
    router.push({
      pathname: "/today/fit",
      params: fit
        ? { fit: fit.id, date: fit.date, slot: fit.slot }
        : { slot: slotOf("now", hour) },
    });
  };

  const view = (fit: DayFit) =>
    router.push({
      pathname: "/today/fit",
      params: { fit: fit.id, date: fit.date, slot: fit.slot, view: "1" },
    });

  return {
    closet,
    clock,
    hour,
    evening,
    day,
    setDay: setPicked,
    date,
    tomorrowDate,
    line,
    tiles,
    slotWeather,
    forecastLoading,
    fits,
    looks,
    earlier,
    open,
    view,
    restyle,
    styling,
    stylingFailed,
  };
}

export type HomeModel = ReturnType<typeof useHome>;
