import { useCallback, useEffect, useMemo, useState } from "react";
import { AppState } from "react-native";
import type { Closet, Piece, Weather } from "../../domain/closet";
import { occasionLabel, styleLabel } from "../../domain/closet";
import {
  activeSession,
  clockFor,
  ensureToday,
  resultFor,
} from "../../domain/today";
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
        ? resultFor(closet, activeSession(today).request, today.localDate)
        : null,
    [closet, today],
  );
  const pieces = session
    ? session.pieceIds.flatMap((id) => {
        const piece = closet.pieces.find((item) => item.id === id);
        return piece ? [piece] : [];
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
        setError("This change could not be saved. Please try again.");
        return false;
      } finally {
        setBusy(false);
      }
    },
    [update],
  );

  useEffect(() => {
    const refresh = () => {
      void update((current) =>
        ensureToday(current, clockFor(new Date())),
      ).catch(() => undefined);
    };
    refresh();
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") refresh();
    });
    return () => subscription.remove();
  }, [update]);

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
  };
}

export function weatherText(weather: Weather) {
  if (weather.source === "unknown") return "Weather not set";
  const warmth = { warm: "Warm", mild: "Mild", cold: "Cold" }[weather.warmth];
  const rain = { dry: "", rain: ", rain", snow: ", snow" }[
    weather.precipitation
  ];
  const where =
    weather.exposure === "mostly-indoors"
      ? ", mostly indoors"
      : weather.exposure === "time-outside"
        ? ", time outside"
        : "";
  return `${warmth}${rain}${where}`;
}

export function contextText(
  request: NonNullable<ReturnType<typeof useToday>["session"]>["request"],
) {
  return `${occasionLabel(request.occasion)} · ${styleLabel(request.style)} · ${weatherText(request.weather)}`;
}

export function pieceCount(pieces: Piece[]) {
  return `${pieces.length} ${pieces.length === 1 ? "piece" : "pieces"}`;
}
