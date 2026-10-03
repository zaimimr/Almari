import {
  isAvailable,
  type Closet,
  type NeverWear,
  type Piece,
  type StyleProfile,
} from "./closet";
import { colorName } from "./color";

function matchesEntry(entry: NeverWear, piece: Piece) {
  if ("kind" in entry) return piece.kind === entry.kind;
  if ("pattern" in entry) return piece.attributes?.pattern === entry.pattern;
  if ((piece.category === "hijab") !== (entry.on === "hijabs")) return false;
  const swatch = piece.colors?.[0];
  return !!swatch && colorName(swatch.rgb) === entry.colour;
}

export function isNeverWear(profile: StyleProfile, piece: Piece): boolean {
  return (profile.neverWear ?? []).some((entry) => matchesEntry(entry, piece));
}

export function allowedPieces(closet: Closet, pieces: Piece[]): Piece[] {
  return pieces.filter((piece) => !isNeverWear(closet.styling.profile, piece));
}

export function wearMoreIds(closet: Closet): string[] {
  return (closet.styling.profile.wearMore ?? []).filter((id) =>
    closet.pieces.some(
      (piece) =>
        piece.id === id && piece.source === "owned" && isAvailable(piece),
    ),
  );
}

function withProfile(closet: Closet, change: Partial<StyleProfile>): Closet {
  return {
    ...closet,
    styling: {
      ...closet.styling,
      profile: { ...closet.styling.profile, ...change },
    },
  };
}

export function setNeverWear(closet: Closet, entries: NeverWear[]): Closet {
  return withProfile(closet, { neverWear: entries });
}

export function setWearMore(closet: Closet, ids: string[]): Closet {
  return withProfile(closet, { wearMore: ids });
}
