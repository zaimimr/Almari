import type { Attributes } from "./attributes";
import { savePiece, type Closet, type Piece, type Traits } from "./closet";

export function setArchived(
  closet: Closet,
  id: string,
  archived: boolean,
): Closet {
  const piece = closet.pieces.find((item) => item.id === id);
  if (!piece || (piece.status === "archived") === archived) return closet;
  const { status: _status, away: _away, ...rest } = piece;
  const next: Piece = archived ? { ...rest, status: "archived" } : rest;
  return {
    ...closet,
    pieces: closet.pieces.map((item) => (item.id === id ? next : item)),
  };
}

export function shelf(pieces: Piece[], archived: boolean) {
  return pieces.filter((piece) => (piece.status === "archived") === archived);
}

export type Confirmation = {
  attributes?: Partial<Attributes>;
  traits?: Partial<Pick<Traits, "warmth" | "rain" | "snow" | "open">>;
};

export function confirmPiece(
  closet: Closet,
  id: string,
  change: Confirmation,
): Closet {
  const piece = closet.pieces.find((item) => item.id === id);
  if (!piece) return closet;
  const keys = [
    ...Object.keys(change.attributes ?? {}),
    ...Object.keys(change.traits ?? {}),
  ];
  return savePiece(closet, {
    ...piece,
    ...(change.attributes
      ? { attributes: { ...piece.attributes, ...change.attributes } }
      : {}),
    ...(change.traits ? { traits: { ...piece.traits, ...change.traits } } : {}),
    sources: {
      ...piece.sources,
      ...Object.fromEntries(keys.map((key) => [key, "confirmed" as const])),
    },
  });
}
