import {
  categories,
  fixedStyles,
  isAvailable,
  type Category,
  type Closet,
  type Occasion,
  type Piece,
  type Style,
} from "./closet";
import { t } from "../i18n";
import { colorName, toLab, toLch } from "./color";
import {
  colourKeys,
  needsDetails,
  pieceCoverage,
  wearSeason,
  type PieceCoverage,
  type WearSeason,
} from "./facts";

export type Availability = "available" | "away" | "archived";

export type ClosetFilter = {
  category: Category | "all";
  style: Style | null;
  occasion: Occasion | null;
  availability: Availability | null;
  colour: string | null;
  coverage: PieceCoverage | "needs-details" | null;
  season: WearSeason | null;
  wear: "never-worn" | "not-worn-lately" | null;
  search: string;
};

export type WearContext = { lastWorn: Record<string, string>; today: string };

export const noFilter: ClosetFilter = {
  category: "all",
  style: null,
  occasion: null,
  availability: null,
  colour: null,
  coverage: null,
  season: null,
  wear: null,
  search: "",
};

const noWear: WearContext = { lastWorn: {}, today: "" };

const lateDays = 30;

export function closetChips(_pieces: readonly Piece[]): (Category | "all")[] {
  return ["all", ...categories.map((category) => category.id)];
}

const stylesOf = (piece: Piece): readonly Style[] =>
  piece.styles ?? (piece.kind ? fixedStyles(piece.kind) : undefined) ?? [];

const availabilityOf = (piece: Piece): Availability =>
  isAvailable(piece)
    ? "available"
    : piece.status === "away"
      ? "away"
      : "archived";

const colourOf = (piece: Piece) =>
  piece.colors?.[0] ? colorName(piece.colors[0].rgb) : null;

const time = (iso: string) => Date.parse(iso);

export function lastWorn(closet: Closet): Record<string, string> {
  const last: Record<string, string> = {};
  for (const event of closet.feedback)
    if (event.kind === "wore" && !event.undone)
      for (const id of event.pieceIds)
        if (!last[id] || time(event.at) > time(last[id])) last[id] = event.at;
  return last;
}

function wornLately(worn: string | undefined, today: string) {
  if (!worn) return false;
  const cutoff = new Date(`${today}T00:00:00Z`);
  cutoff.setUTCDate(cutoff.getUTCDate() - lateDays);
  return worn.slice(0, 10) >= cutoff.toISOString().slice(0, 10);
}

function matchesCoverage(
  piece: Piece,
  coverage: ClosetFilter["coverage"],
): boolean {
  if (!coverage) return true;
  if (coverage === "needs-details") return needsDetails(piece).length > 0;
  return pieceCoverage(piece) === coverage;
}

function matchesWear(
  piece: Piece,
  wear: ClosetFilter["wear"],
  context: WearContext,
): boolean {
  if (!wear) return true;
  const worn = context.lastWorn[piece.id];
  return wear === "never-worn" ? !worn : !wornLately(worn, context.today);
}

function matchesSearch(piece: Piece, search: string): boolean {
  const query = search.trim().toLowerCase();
  if (!query) return true;
  const colour = colourOf(piece);
  const key = colour ? colourKeys[colour] : undefined;
  return [piece.name, colour ?? "", key ? t(key) : ""].some((text) =>
    text.toLowerCase().includes(query),
  );
}

export function filterPieces<T extends Piece>(
  pieces: readonly T[],
  filter: ClosetFilter,
  context: WearContext = noWear,
): T[] {
  return pieces.filter(
    (piece) =>
      (filter.category === "all" || piece.category === filter.category) &&
      (!filter.style || stylesOf(piece).includes(filter.style)) &&
      (!filter.occasion ||
        !piece.traits?.occasions?.length ||
        piece.traits.occasions.includes(filter.occasion)) &&
      (filter.availability
        ? availabilityOf(piece) === filter.availability
        : availabilityOf(piece) !== "archived") &&
      (!filter.colour || colourOf(piece) === filter.colour) &&
      matchesCoverage(piece, filter.coverage) &&
      (!filter.season || wearSeason(piece)?.season === filter.season) &&
      matchesWear(piece, filter.wear, context) &&
      matchesSearch(piece, filter.search),
  );
}

export type ClosetSection = { id: Category | "samples"; pieces: Piece[] };

const hueOf = (piece: Piece) =>
  piece.colors?.[0]
    ? toLch(toLab(piece.colors[0].rgb))[2]
    : Number.POSITIVE_INFINITY;

const byHue = (a: Piece, b: Piece) =>
  hueOf(a) - hueOf(b) || a.name.localeCompare(b.name);

const newestFirst = (a: Piece, b: Piece) =>
  time(b.createdAt) - time(a.createdAt);

export function groupByCategory(pieces: readonly Piece[]): ClosetSection[] {
  const owned = pieces.filter((piece) => piece.source !== "sample");
  const samples = pieces.filter((piece) => piece.source === "sample");
  const sections: ClosetSection[] = categories.map(({ id }) => ({
    id,
    pieces: owned
      .filter((piece) => piece.category === id)
      .sort(id === "hijab" ? byHue : newestFirst),
  }));
  return [...sections, { id: "samples" as const, pieces: samples }].filter(
    (section) => section.pieces.length > 0,
  );
}

export function panelFilterCount(filter: ClosetFilter): number {
  return [
    filter.colour,
    filter.coverage,
    filter.season,
    filter.wear,
    filter.availability,
    filter.style,
    filter.occasion,
  ].filter((value) => value !== null).length;
}
