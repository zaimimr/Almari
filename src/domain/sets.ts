import { t } from "../i18n";
import type { Closet, Piece } from "./closet";

function withoutSet(piece: Piece): Piece {
  const { setId: _setId, ...rest } = piece;
  return rest;
}

function withoutLoneSets(pieces: Piece[]): Piece[] {
  const counts = new Map<string, number>();
  for (const piece of pieces)
    if (piece.setId)
      counts.set(piece.setId, (counts.get(piece.setId) ?? 0) + 1);
  return pieces.map((piece) =>
    piece.setId && counts.get(piece.setId) === 1 ? withoutSet(piece) : piece,
  );
}

export function linkSet(
  closet: Closet,
  pieceIds: string[],
  setId: string,
): Closet {
  const ids = new Set(pieceIds);
  const members = closet.pieces.filter((piece) => ids.has(piece.id));
  if (members.length < 2 || members.length !== ids.size)
    throw new Error(t("error.setTooSmall"));
  return {
    ...closet,
    pieces: withoutLoneSets(
      closet.pieces.map((piece) =>
        ids.has(piece.id) ? { ...piece, setId } : piece,
      ),
    ),
  };
}

export function unlinkPiece(closet: Closet, pieceId: string): Closet {
  const piece = closet.pieces.find((item) => item.id === pieceId);
  if (!piece?.setId) return closet;
  return {
    ...closet,
    pieces: withoutLoneSets(
      closet.pieces.map((item) =>
        item.id === pieceId ? withoutSet(item) : item,
      ),
    ),
  };
}

export function setMembers(closet: Closet, piece: Piece): Piece[] {
  return piece.setId
    ? closet.pieces.filter(
        (item) => item.setId === piece.setId && item.id !== piece.id,
      )
    : [];
}
