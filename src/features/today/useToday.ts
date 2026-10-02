import { useCallback, useEffect, useMemo, useState } from "react";
import { AppState } from "react-native";
import ClosetVision from "../../../modules/closet-vision/src";
import type {
  Closet,
  OutfitRequest,
  Piece,
  Weather,
} from "../../domain/closet";
import { isAvailable } from "../../domain/closet";
import {
  activeSession,
  clockFor,
  ensureToday,
  resultFor,
  saveForecast,
} from "../../domain/today";
import { forecastFor, forecastWeather } from "../../domain/weather";
import { occasionName, styleName, t } from "../../i18n";
import { useCloset } from "../../state/closet";

export function useToday() {
  const { closet, update } = useCloset();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const today = closet.styling.today;
  const session = today ? activeSession(today) : null;
  const result = useMemo(
    () =>
      today
        ? resultFor(
            closet,
            activeSession(today).request,
            today.localDate,
            activeSession(today).engine ?? "rules",
          )
        : null,
    [closet, today],
  );
  const pieces = session
    ? session.pieceIds.flatMap((id) => {
        const piece = closet.pieces.find((item) => item.id === id);
        return piece && isAvailable(piece) ? [piece] : [];
      })
    : [];
  const lostPieces = session ? session.pieceIds.length - pieces.length : 0;

  const run = useCallback(
    async (transform: (closet: Closet) => Closet) => {
      setBusy(true);
      setError(null);
      try {
        await update(transform);
        return true;
      } catch {
        setError(t("piece.error.save"));
        return false;
      } finally {
        setBusy(false);
      }
    },
    [update],
  );

  const [foregrounded, setForegrounded] = useState(0);

  useEffect(() => {
    const refresh = () => {
      void update((current) =>
        ensureToday(current, clockFor(new Date())),
      ).catch(() => undefined);
    };
    refresh();
    const subscription = AppState.addEventListener("change", (state) => {
      if (state !== "active") return;
      refresh();
      setForegrounded((count) => count + 1);
    });
    return () => subscription.remove();
  }, [update]);

  const [forecastFailed, setForecastFailed] = useState(false);
  const place = closet.styling.place;
  const stored = closet.styling.forecast;
  const localDate = today?.localDate;

  useEffect(() => {
    const clock = clockFor(new Date());
    if (!place || forecastWeather(stored, clock.localDate, clock.timeZone))
      return;
    let active = true;
    ClosetVision.forecast(place.latitude, place.longitude)
      .then((result) => {
        const fresh = result
          ? forecastFor(
              result,
              clock.localDate,
              new Date().toISOString(),
              clock.timeZone,
            )
          : null;
        if (!active) return;
        setForecastFailed(!fresh);
        if (fresh) return update((current) => saveForecast(current, fresh));
      })
      .catch(() => {
        if (active) setForecastFailed(true);
      });
    return () => {
      active = false;
    };
  }, [place, stored, localDate, foregrounded, update]);

  return {
    closet,
    today,
    session,
    result,
    pieces,
    lostPieces,
    run,
    busy,
    error,
    forecastFailed,
  };
}

const warmthKeys = {
  warm: "weather.warm",
  mild: "weather.mild",
  cold: "weather.cold",
} as const;

export function weatherText(weather: Weather) {
  if (weather.source === "unknown") return t("weather.unset");
  const warmth = t(warmthKeys[weather.warmth]);
  const rain =
    weather.precipitation === "rain"
      ? t("weather.rainSuffix")
      : weather.precipitation === "snow"
        ? t("weather.snowSuffix")
        : "";
  const where =
    weather.exposure === "mostly-indoors"
      ? t("weather.indoorsSuffix")
      : weather.exposure === "time-outside"
        ? t("weather.outsideSuffix")
        : "";
  return `${warmth}${rain}${where}`;
}

export function contextText(
  request: NonNullable<ReturnType<typeof useToday>["session"]>["request"],
) {
  return `${occasionName(request.occasion)} · ${styleName(request.style)} · ${weatherText(request.weather)}`;
}

export function pieceCount(pieces: Piece[]) {
  return pieces.length === 1
    ? t("common.pieceCountOne")
    : t("common.pieceCountMany", { count: pieces.length });
}

export function coverageText(request: OutfitRequest) {
  const sleeve = request.coverage?.sleeve ?? null;
  const hem = request.coverage?.hem ?? null;
  return [
    sleeve === null
      ? t("coverage.sleevesUnset")
      : sleeve === "any"
        ? ""
        : t(
            sleeve === "long"
              ? "coverage.sleevesWrist"
              : "coverage.sleevesElbow",
          ),
    hem === null
      ? t("coverage.hemUnset")
      : hem === "any"
        ? ""
        : t(hem === "ankle" ? "coverage.hemAnkle" : "coverage.hemCalf"),
    t("coverage.necklineUnchecked"),
  ]
    .filter(Boolean)
    .join(" ");
}
