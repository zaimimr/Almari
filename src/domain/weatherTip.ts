import type { OutfitRequest, Piece } from "./closet";
import { roleOf } from "./styling";

export type WeatherTip = {
  weather: "cold" | "rain" | "snow";
  piece: Piece;
  replaces: Piece | null;
};

const fits = (piece: Piece, outfit: Piece[], request: OutfitRequest) =>
  !outfit.some((item) => item.id === piece.id) &&
  !request.excludedIds.includes(piece.id) &&
  (!piece.styles || piece.styles.includes(request.style));

export function weatherTip(
  outfit: Piece[],
  request: OutfitRequest,
  pool: Piece[],
): WeatherTip | null {
  const weather = request.weather;
  if (weather.source === "unknown") return null;
  const outside = weather.exposure !== "mostly-indoors";
  const shoes = outfit.find((piece) => roleOf(piece) === "shoes") ?? null;
  const wet =
    weather.precipitation === "snow"
      ? "snow"
      : weather.precipitation === "rain" && outside
        ? "rain"
        : null;
  if (wet && shoes && shoes.traits?.[wet] !== true) {
    const dry = pool.find(
      (piece) =>
        roleOf(piece) === "shoes" &&
        piece.traits?.[wet] === true &&
        fits(piece, outfit, request),
    );
    if (dry) return { weather: wet, piece: dry, replaces: shoes };
  }
  if (weather.warmth !== "cold" || !outside) return null;
  const layers = outfit.filter(
    (piece) => roleOf(piece) === "layer" || roleOf(piece) === "outer",
  );
  if (layers.some((piece) => piece.traits?.warmth === "warm")) return null;
  const abaya = layers.some(
    (piece) => piece.kind === "abaya" && roleOf(piece) === "outer",
  );
  const warm = pool
    .filter(
      (piece) =>
        (roleOf(piece) === "outer" || (!abaya && roleOf(piece) === "layer")) &&
        piece.traits?.warmth === "warm" &&
        fits(piece, outfit, request),
    )
    .sort(
      (a, b) => Number(roleOf(b) === "outer") - Number(roleOf(a) === "outer"),
    )[0];
  if (!warm) return null;
  return {
    weather: "cold",
    piece: warm,
    replaces: layers.find((piece) => roleOf(piece) === roleOf(warm)) ?? null,
  };
}
