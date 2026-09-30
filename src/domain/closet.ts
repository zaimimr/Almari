export const categories = [
  { id: "hijab", label: "Hijabs & scarves" },
  { id: "top", label: "Tops" },
  { id: "tunic", label: "Kurtas & tunics" },
  { id: "bottom", label: "Trousers & skirts" },
  { id: "dress", label: "Dresses & abayas" },
  { id: "layer", label: "Layers" },
  { id: "shoes", label: "Shoes" },
  { id: "bag", label: "Bags" },
  { id: "accessory", label: "Accessories" },
] as const;

export type Category = (typeof categories)[number]["id"];
export type Piece = {
  id: string;
  name: string;
  category: Category;
  photo: string;
  createdAt: string;
};
export type Look = {
  id: string;
  name: string;
  pieceIds: string[];
  createdAt: string;
};
export type Closet = { version: 1; pieces: Piece[]; looks: Look[] };
export const emptyCloset: Closet = { version: 1, pieces: [], looks: [] };
export const categoryLabel = (id: Category) =>
  categories.find((c) => c.id === id)?.label ?? id;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isPiece(value: unknown): value is Piece {
  return (
    isRecord(value) &&
    isString(value.id) &&
    isString(value.name) &&
    isString(value.photo) &&
    isString(value.createdAt) &&
    categories.some((category) => category.id === value.category)
  );
}

function isLook(value: unknown): value is Look {
  return (
    isRecord(value) &&
    isString(value.id) &&
    isString(value.name) &&
    isString(value.createdAt) &&
    Array.isArray(value.pieceIds) &&
    value.pieceIds.every(isString) &&
    value.pieceIds.length > 0 &&
    new Set(value.pieceIds).size === value.pieceIds.length
  );
}

export function decodeCloset(raw: string | null): Closet {
  if (raw === null) return emptyCloset;
  const value: unknown = JSON.parse(raw);
  if (
    !isRecord(value) ||
    value.version !== 1 ||
    !Array.isArray(value.pieces) ||
    !Array.isArray(value.looks) ||
    !value.pieces.every(isPiece) ||
    !value.looks.every(isLook) ||
    new Set(value.pieces.map((piece) => piece.id)).size !==
      value.pieces.length ||
    new Set(value.looks.map((look) => look.id)).size !== value.looks.length
  ) {
    throw new Error(
      "This closet could not be opened. Your saved data has been kept.",
    );
  }
  return value as Closet;
}

export function savePiece(closet: Closet, piece: Piece): Closet {
  const clean = { ...piece, name: piece.name.trim() };
  if (!isPiece(clean))
    throw new Error("Add a photo, a name, and a category for this piece.");
  const exists = closet.pieces.some((item) => item.id === piece.id);
  return {
    ...closet,
    pieces: exists
      ? closet.pieces.map((item) => (item.id === piece.id ? clean : item))
      : [clean, ...closet.pieces],
  };
}

export function saveLook(closet: Closet, look: Look): Closet {
  const clean = {
    ...look,
    name: look.name.trim(),
    pieceIds: [...new Set(look.pieceIds)],
  };
  if (!isLook(clean))
    throw new Error("Name your look and choose at least one piece.");
  if (
    clean.pieceIds.some((id) => !closet.pieces.some((piece) => piece.id === id))
  ) {
    throw new Error(
      "A selected piece is no longer in your closet. Choose another piece.",
    );
  }
  const exists = closet.looks.some((item) => item.id === look.id);
  return {
    ...closet,
    looks: exists
      ? closet.looks.map((item) => (item.id === look.id ? clean : item))
      : [clean, ...closet.looks],
  };
}

export function piecesForLook(closet: Closet, look: Look): Piece[] {
  return look.pieceIds.flatMap((id) => {
    const piece = closet.pieces.find((item) => item.id === id);
    return piece ? [piece] : [];
  });
}

export function removePiece(closet: Closet, id: string): Closet {
  return {
    ...closet,
    pieces: closet.pieces.filter((piece) => piece.id !== id),
  };
}
