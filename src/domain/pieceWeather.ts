import type { Category, Closet, GarmentKind, Piece, Traits } from "./closet";

export type WeatherKey = "warmth" | "rain" | "snow";

const keys: WeatherKey[] = ["warmth", "rain", "snow"];
const clothing: Category[] = ["top", "tunic", "dress", "layer"];
const warmFabrics: string[] = ["wool", "velvet", "knit", "karandi", "khaddar"];
const mediumFabrics: string[] = ["denim", "jersey"];
const mediumKinds: GarmentKind[] = ["jacket", "blazer", "cardigan", "sweater"];
const openShoes: GarmentKind[] = ["sandals", "heels", "khussa", "flats"];

export function proposedWeather(
  piece: Piece,
): Partial<Pick<Traits, WeatherKey>> {
  if (piece.category === "shoes") {
    if (piece.kind === "boots") return { rain: true, snow: true };
    if (piece.kind && openShoes.includes(piece.kind))
      return { rain: false, snow: false };
    return {};
  }
  if (!clothing.includes(piece.category)) return {};
  if (piece.kind === "coat") return { warmth: "warm" };
  const fabric = piece.attributes?.fabric;
  if (fabric)
    return {
      warmth: warmFabrics.includes(fabric)
        ? "warm"
        : mediumFabrics.includes(fabric)
          ? "medium"
          : "light",
    };
  if (piece.kind && mediumKinds.includes(piece.kind))
    return { warmth: "medium" };
  return {};
}

export function confirmedWeather<K extends WeatherKey>(
  piece: Piece,
  key: K,
): Traits[K] | undefined {
  return piece.sources?.[key] === "proposed" ? undefined : piece.traits?.[key];
}

export function unconfirmedWeather<K extends WeatherKey>(
  piece: Piece,
  key: K,
): Traits[K] | undefined {
  return piece.sources?.[key] === "proposed" ? piece.traits?.[key] : undefined;
}

export function withWeatherProposals(piece: Piece): Piece {
  if (piece.source !== "owned") return piece;
  const proposal = proposedWeather(piece);
  const traits: Record<string, unknown> = { ...piece.traits };
  const sources: Record<string, unknown> = { ...piece.sources };
  let changed = false;
  for (const key of keys) {
    if (traits[key] !== undefined && sources[key] !== "proposed") continue;
    const value = proposal[key];
    if (value === undefined) {
      if (traits[key] === undefined) continue;
      delete traits[key];
      delete sources[key];
    } else {
      if (traits[key] === value && sources[key] === "proposed") continue;
      traits[key] = value;
      sources[key] = "proposed";
    }
    changed = true;
  }
  if (!changed) return piece;
  const { traits: _traits, sources: _sources, ...rest } = piece;
  return {
    ...rest,
    ...(Object.keys(traits).length ? { traits: traits as Traits } : {}),
    ...(Object.keys(sources).length
      ? { sources: sources as NonNullable<Piece["sources"]> }
      : {}),
  };
}

export function proposeWeatherTraits(closet: Closet): Closet {
  let changed = false;
  const pieces = closet.pieces.map((piece) => {
    const next = withWeatherProposals(piece);
    if (next !== piece) changed = true;
    return next;
  });
  return changed ? { ...closet, pieces } : closet;
}
