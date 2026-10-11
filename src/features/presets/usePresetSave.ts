import { useState } from "react";
import { randomUUID } from "expo-crypto";
import {
  normalizePresetName,
  presetFromRequest,
  saveStylePreset,
} from "../../domain/presets";
import { t } from "../../i18n";
import { useCloset } from "../../state/closet";
import { announce } from "../../ui/announce";
import type { PresetSettingsValue } from "./PresetSettings";

export function usePresetSave() {
  const { update } = useCloset();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save(
    name: string,
    settings: PresetSettingsValue,
    id?: string,
  ) {
    if (busy) return false;
    const normalized = normalizePresetName(name);
    if (!normalized) {
      setError(t("presets.invalidName"));
      return false;
    }
    const preset = presetFromRequest(id ?? randomUUID(), normalized, settings);
    if (!preset) {
      setError(t("common.error.save"));
      return false;
    }
    setBusy(true);
    setError(null);
    try {
      await update((current) => {
        const next = saveStylePreset(current, preset);
        if (next === current) throw new Error(t("presets.duplicateName"));
        return next;
      });
      announce(t("result.saved"));
      return true;
    } catch (failure) {
      setError(
        failure instanceof Error &&
          failure.message === t("presets.duplicateName")
          ? failure.message
          : t("common.error.save"),
      );
      return false;
    } finally {
      setBusy(false);
    }
  }

  return { busy, error, save };
}
