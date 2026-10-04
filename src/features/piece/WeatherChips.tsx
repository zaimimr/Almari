import type { Piece, Warmth } from "../../domain/closet";
import { proposedWeather, type WeatherKey } from "../../domain/pieceWeather";
import { t, type Key } from "../../i18n";
import type { FactSpec } from "./FactChips";

const warmths: Warmth[] = ["light", "medium", "warm"];

const confirm = (latest: Piece, key: WeatherKey, value: unknown): Piece => ({
  ...latest,
  traits: { ...latest.traits, [key]: value },
  sources: { ...latest.sources, [key]: "confirmed" },
});

function warmthFact(piece: Piece): FactSpec | null {
  if (!["layer", "hijab"].includes(piece.category) && piece.kind !== "coat")
    return null;
  const value = piece.traits?.warmth ?? proposedWeather(piece).warmth;
  if (!value) return null;
  const tentative =
    !piece.traits?.warmth || piece.sources?.warmth === "proposed";
  return {
    id: "warmth",
    name: t("pieceWeather.warmth"),
    value: t(`pieceWeather.${value}` as Key),
    showKey: true,
    tentative,
    rows: [
      {
        id: "warmth",
        options: warmths.map((id) => ({
          id,
          label: t(`pieceWeather.${id}` as Key),
        })),
        value,
        pick: (option) => (latest) => confirm(latest, "warmth", option),
      },
    ],
    looksRight: tentative
      ? (latest) => confirm(latest, "warmth", value)
      : undefined,
  };
}

function shoeFact(piece: Piece, key: "rain" | "snow"): FactSpec | null {
  if (piece.category !== "shoes") return null;
  const value = piece.traits?.[key] ?? proposedWeather(piece)[key];
  if (value === undefined) return null;
  const tentative =
    piece.traits?.[key] === undefined || piece.sources?.[key] === "proposed";
  return {
    id: key,
    name: t(`pieceWeather.${key}`),
    value: t(value ? "pieceWeather.fine" : "pieceWeather.avoid"),
    showKey: true,
    tentative,
    rows: [
      {
        id: key,
        options: [
          { id: "yes", label: t("pieceWeather.fine") },
          { id: "no", label: t("pieceWeather.avoid") },
        ],
        value: value ? "yes" : "no",
        pick: (option) => (latest) => confirm(latest, key, option === "yes"),
      },
    ],
    looksRight: tentative ? (latest) => confirm(latest, key, value) : undefined,
  };
}

export function weatherFacts(piece: Piece): (FactSpec | null)[] {
  return [warmthFact(piece), shoeFact(piece, "rain"), shoeFact(piece, "snow")];
}
