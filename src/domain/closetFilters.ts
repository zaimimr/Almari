import {
  categories,
  fixedStyles,
  type Category,
  type Occasion,
  type Piece,
  type Style,
} from "./closet";

export type Availability = "available" | "away";

export type ClosetFilter = {
  category: Category | "all";
  style: Style | null;
  occasion: Occasion | null;
  availability: Availability | null;
};

export const noFilter: ClosetFilter = {
  category: "all",
  style: null,
  occasion: null,
  availability: null,
};

type Filterable = Piece & { status?: string };

export function closetChips(_pieces: readonly Piece[]): (Category | "all")[] {
  return ["all", ...categories.map((category) => category.id)];
}

const stylesOf = (piece: Piece): readonly Style[] =>
  piece.styles ?? (piece.kind ? fixedStyles(piece.kind) : undefined) ?? [];

const availabilityOf = (piece: Filterable): Availability | null =>
  piece.status === undefined
    ? "available"
    : piece.status === "away"
      ? "away"
      : null;

export function filterPieces<T extends Filterable>(
  pieces: readonly T[],
  filter: ClosetFilter,
): T[] {
  return pieces.filter(
    (piece) =>
      (filter.category === "all" || piece.category === filter.category) &&
      (!filter.style || stylesOf(piece).includes(filter.style)) &&
      (!filter.occasion ||
        !piece.traits?.occasions?.length ||
        piece.traits.occasions.includes(filter.occasion)) &&
      (!filter.availability || availabilityOf(piece) === filter.availability),
  );
}
