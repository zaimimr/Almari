import type { Closet, Piece } from "./closet";

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
