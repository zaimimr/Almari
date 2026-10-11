import { useState } from "react";
import { router } from "expo-router";
import type { Occasion, StylePreset } from "../../domain/closet";
import { weekPlan } from "../../domain/looks";
import {
  previewWeek,
  saveWeekPlan,
  StaleWeekPlanError,
  type WeekPreview,
} from "../../domain/weekPlanning";
import { locale, t } from "../../i18n";
import { useCloset } from "../../state/closet";
import { now } from "../../state/clock";
import { todayDate } from "../looks/format";

export function useWeekPlanning() {
  const { closet, update, read } = useCloset();
  const today = todayDate();
  const [start, setStart] = useState(today);
  const [presetId, setPresetId] = useState<string | null>(null);
  const [occasions, setOccasions] = useState<Record<string, Occasion>>({});
  const [dayPresetIds, setDayPresetIds] = useState<Record<string, string>>({});
  const [preview, setPreview] = useState<WeekPreview | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const presets = closet.styling.presets ?? [];
  const slots = weekPlan(closet, start);

  const generate = () => {
    const current = read();
    const available = current.styling.presets ?? [];
    const dayPresets = Object.fromEntries(
      Object.entries(dayPresetIds).flatMap(([date, id]) => {
        const preset = available.find((item) => item.id === id);
        return preset ? [[date, preset]] : [];
      }),
    ) as Record<string, StylePreset>;
    const localDate = todayDate();
    const planningStart = start < localDate ? localDate : start;
    if (planningStart !== start) setStart(planningStart);
    const next = previewWeek(current, {
      start: planningStart,
      today: localDate,
      preset: available.find((item) => item.id === presetId),
      dayPresets,
      occasions,
      timeZone: current.styling.today?.timeZone,
    });
    setPreview(next);
    setSelected(
      next.days
        .filter((day) => !day.existing && day.pieceIds.length)
        .map((day) => day.date),
    );
    setError(null);
  };

  const save = async () => {
    if (!preview || busy) return;
    setBusy(true);
    setError(null);
    try {
      await update((current) =>
        saveWeekPlan(current, preview, selected, now().toISOString(), locale),
      );
      router.dismissTo("/(tabs)/looks");
    } catch (cause) {
      setError(
        t(
          cause instanceof StaleWeekPlanError
            ? "week.stale"
            : "week.saveFailed",
        ),
      );
    } finally {
      setBusy(false);
    }
  };

  return {
    closet,
    today,
    start,
    presetId,
    presets,
    slots,
    occasions,
    dayPresetIds,
    preview,
    selected,
    busy,
    error,
    changeStart: (date: string) => {
      setStart(date);
      setPreview(null);
      setError(null);
    },
    changePreset: (id: string | null) => {
      setPresetId(id);
      setPreview(null);
    },
    setOccasion: (date: string, occasion: Occasion) => {
      setOccasions((value) => ({ ...value, [date]: occasion }));
      setPreview(null);
    },
    setDayPreset: (date: string, id: string) => {
      setDayPresetIds((value) => ({ ...value, [date]: id }));
      setOccasions((value) =>
        Object.fromEntries(
          Object.entries(value).filter(([day]) => day !== date),
        ),
      );
      setPreview(null);
    },
    resetDay: (date: string) => {
      setDayPresetIds((value) =>
        Object.fromEntries(
          Object.entries(value).filter(([day]) => day !== date),
        ),
      );
      setOccasions((value) =>
        Object.fromEntries(
          Object.entries(value).filter(([day]) => day !== date),
        ),
      );
      setPreview(null);
    },
    toggle: (date: string) =>
      setSelected((value) =>
        value.includes(date)
          ? value.filter((item) => item !== date)
          : [...value, date],
      ),
    edit: () => {
      setPreview(null);
      setError(null);
    },
    generate,
    save,
  };
}
