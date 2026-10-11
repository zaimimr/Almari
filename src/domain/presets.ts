import type { Closet, OutfitRequest, StylePreset } from "./closet";
import { occasions, styleOptions } from "./taxonomy";

export const presetNameLimit = 40;

export function normalizePresetName(value: unknown): string | null {
  if (typeof value !== "string" || /[\u0000-\u001f\u007f-\u009f]/u.test(value))
    return null;
  const name = value.trim().replace(/\s+/gu, " ");
  return name.length > 0 && name.length <= presetNameLimit ? name : null;
}

export function isStylePreset(value: unknown): value is StylePreset {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const item = value as Record<string, unknown>;
  if (
    typeof item.id !== "string" ||
    !item.id.trim() ||
    typeof item.name !== "string" ||
    normalizePresetName(item.name) !== item.name ||
    !occasions.some(({ id }) => id === item.occasion) ||
    !styleOptions.some(({ id }) => id === item.style) ||
    ![null, "always", "not-needed"].includes(item.hijab as string | null) ||
    (item.feel !== undefined &&
      !["comfy", "smart", "dressed"].includes(item.feel as string))
  )
    return false;
  if (item.coverage === undefined) return true;
  if (
    !item.coverage ||
    typeof item.coverage !== "object" ||
    Array.isArray(item.coverage)
  )
    return false;
  const coverage = item.coverage as Record<string, unknown>;
  return (
    [null, "any", "elbow", "long"].includes(coverage.sleeve as string | null) &&
    [null, "any", "calf", "ankle"].includes(coverage.hem as string | null)
  );
}

export function presetFromRequest(
  id: string,
  name: string,
  request: Pick<
    OutfitRequest,
    "occasion" | "style" | "hijab" | "coverage" | "feel"
  >,
): StylePreset | null {
  const normalized = normalizePresetName(name);
  if (!normalized) return null;
  const preset: StylePreset = {
    id,
    name: normalized,
    occasion: request.occasion,
    style: request.style,
    hijab: request.hijab,
    ...(request.coverage ? { coverage: { ...request.coverage } } : {}),
    ...(request.feel ? { feel: request.feel } : {}),
  };
  return isStylePreset(preset) ? preset : null;
}

export function applyStylePreset(
  request: OutfitRequest,
  preset: StylePreset,
): OutfitRequest {
  const { coverage, feel, ...current } = request;
  return {
    ...current,
    occasion: preset.occasion,
    style: preset.style,
    hijab: preset.hijab,
    ...(preset.coverage ? { coverage: { ...preset.coverage } } : {}),
    ...(preset.feel ? { feel: preset.feel } : {}),
  };
}

export function saveStylePreset(closet: Closet, preset: StylePreset): Closet {
  if (!isStylePreset(preset)) return closet;
  const presets = closet.styling.presets ?? [];
  if (
    presets.some(
      (item) =>
        item.id !== preset.id &&
        item.name.toLowerCase() === preset.name.toLowerCase(),
    )
  )
    return closet;
  const next = {
    ...preset,
    ...(preset.coverage ? { coverage: { ...preset.coverage } } : {}),
  };
  return {
    ...closet,
    styling: {
      ...closet.styling,
      presets: presets.some(({ id }) => id === preset.id)
        ? presets.map((item) => (item.id === preset.id ? next : item))
        : [...presets, next],
    },
  };
}

export function removeStylePreset(closet: Closet, id: string): Closet {
  const presets = closet.styling.presets ?? [];
  if (!presets.some((item) => item.id === id)) return closet;
  return {
    ...closet,
    styling: {
      ...closet.styling,
      presets: presets.filter((item) => item.id !== id),
    },
  };
}
