import { t } from "../i18n";
import type { Key } from "../i18n/en";
import {
  confirmAttribute,
  fitAttributes,
  optionsFor,
  type AttributeKey,
  type AttributeValue,
  type Embellishment,
  type Fabric,
} from "./attributes";
import {
  fixedStyles,
  kindsIn,
  savePiece,
  type Closet,
  type Piece,
  type Source,
  type SourceKey,
  type Sparkle,
  type Warmth,
} from "./closet";
import { colorName, namedSwatch } from "./color";
import { confirmedLength, confirmedSleeve, opacity } from "./coverage";
import { confirmedWeather } from "./pieceWeather";

export type FactKey =
  | "colour"
  | "kind"
  | "fabric"
  | "pattern"
  | "sheer"
  | "volume"
  | "length"
  | "sleeve"
  | "formality"
  | "season";

export type Fact = {
  key: FactKey;
  label: Key;
  value: Key;
  source: Source;
};

export type WearSeason = "summer" | "winter" | "all-year";

export type PieceCoverage = "full" | "moderate" | "layer";

export type FactChoice = {
  label: Key;
  current: string | null;
  options: { id: string; label: Key }[];
};

type AttributeFact = Extract<FactKey, AttributeKey>;

const colourKeys: Record<string, Key> = {
  Black: "colour.black",
  Charcoal: "colour.charcoal",
  Grey: "colour.grey",
  "Light grey": "colour.light-grey",
  White: "colour.white",
  Ivory: "colour.ivory",
  Beige: "colour.beige",
  Camel: "colour.camel",
  Taupe: "colour.taupe",
  Brown: "colour.brown",
  Chocolate: "colour.chocolate",
  Navy: "colour.navy",
  Blue: "colour.blue",
  "Sky blue": "colour.sky-blue",
  Teal: "colour.teal",
  Green: "colour.green",
  Sage: "colour.sage",
  Olive: "colour.olive",
  Mustard: "colour.mustard",
  Yellow: "colour.yellow",
  Orange: "colour.orange",
  Rust: "colour.rust",
  Red: "colour.red",
  Burgundy: "colour.burgundy",
  Pink: "colour.pink",
  Blush: "colour.blush",
  Mauve: "colour.mauve",
  Lavender: "colour.lavender",
  Purple: "colour.purple",
  Plum: "colour.plum",
};

const warmthSeasons: Record<Warmth, WearSeason> = {
  light: "summer",
  medium: "all-year",
  warm: "winter",
};

const fabricSeasons: Partial<Record<Fabric, WearSeason>> = {
  lawn: "summer",
  linen: "summer",
  chiffon: "summer",
  wool: "winter",
  velvet: "winter",
  knit: "winter",
  khaddar: "winter",
  karandi: "winter",
};

const sparkleLevels: Record<Embellishment, Sparkle> = {
  none: "plain",
  light: "little",
  heavy: "heavy",
  bridal: "bridal",
};

const embellishmentFor: Record<Sparkle, Embellishment> = {
  plain: "none",
  little: "light",
  heavy: "heavy",
  bridal: "bridal",
};

export function sparkleOf(piece: Piece): Sparkle | null {
  const embellishment = piece.attributes?.embellishment;
  return embellishment ? sparkleLevels[embellishment] : null;
}

export function setSparkle(
  closet: Closet,
  pieceId: string,
  sparkle: Sparkle,
): Closet {
  const piece = closet.pieces.find((item) => item.id === pieceId);
  if (!piece) return closet;
  return savePiece(
    closet,
    confirmAttribute(piece, "embellishment", embellishmentFor[sparkle]),
  );
}

export function setColour(
  closet: Closet,
  pieceId: string,
  name: string,
): Closet {
  const piece = closet.pieces.find((item) => item.id === pieceId);
  if (!piece) return closet;
  return savePiece(closet, {
    ...piece,
    colors: [namedSwatch(name), ...(piece.colors ?? []).slice(1)],
    sources: { ...piece.sources, colour: "confirmed" },
  });
}

const coverageLevels: PieceCoverage[] = ["layer", "moderate", "full"];

function coverageOf(piece: Piece, key: FactKey): PieceCoverage | null {
  if (key === "sleeve") {
    const sleeve = confirmedSleeve(piece);
    if (!sleeve) return null;
    return sleeve === "long"
      ? "full"
      : sleeve === "elbow"
        ? "moderate"
        : "layer";
  }
  if (key === "length") {
    const length = confirmedLength(piece);
    if (!length) return null;
    return length === "ankle"
      ? "full"
      : length === "calf"
        ? "moderate"
        : "layer";
  }
  if (piece.attributes?.sheer === true) return "layer";
  return opacity(piece) === "unknown" ? null : "full";
}

export function pieceCoverage(piece: Piece): PieceCoverage | null {
  const reads = coverageReads(piece);
  const levels = reads.map((key) => coverageOf(piece, key));
  if (!reads.length || levels.includes(null)) return null;
  return coverageLevels[
    Math.min(...levels.map((level) => coverageLevels.indexOf(level!)))
  ]!;
}

function coverageReads(piece: Piece): FactKey[] {
  switch (piece.category) {
    case "top":
    case "tunic":
    case "layer":
      return ["sleeve", "sheer"];
    case "bottom":
      return ["length"];
    case "dress":
      return ["sleeve", "sheer", "length"];
    default:
      return [];
  }
}

export function needsDetails(piece: Piece): FactKey[] {
  if (piece.source === "sample") return [];
  return coverageReads(piece).filter((key) =>
    key === "sleeve"
      ? confirmedSleeve(piece) === undefined
      : key === "length"
        ? confirmedLength(piece) === undefined
        : piece.attributes?.sheer === undefined ||
          piece.sources?.sheer === "proposed",
  );
}

const sourceOf = (piece: Piece, key: SourceKey): Source =>
  piece.sources?.[key] ?? "confirmed";

export const attributeLabelKey = (key: AttributeKey): Key => `attribute.${key}`;

export const attributeValueKey = (key: AttributeKey, value: AttributeValue) =>
  `value.${key}.${value}` as Key;

export function wearSeason(
  piece: Piece,
): { season: WearSeason; source: Source } | null {
  const warmth = confirmedWeather(piece, "warmth");
  if (warmth) return { season: warmthSeasons[warmth], source: "confirmed" };
  const fabric = piece.attributes?.fabric;
  const season = fabric ? fabricSeasons[fabric] : undefined;
  return season ? { season, source: sourceOf(piece, "fabric") } : null;
}

function attributeFact(piece: Piece, key: AttributeFact): Fact[] {
  const value = piece.attributes?.[key];
  if (value === undefined) return [];
  return [
    {
      key,
      label: attributeLabelKey(key),
      value: attributeValueKey(key, value),
      source: sourceOf(piece, key),
    },
  ];
}

export function pieceFacts(piece: Piece): Fact[] {
  const facts: Fact[] = [];
  const swatch = piece.colors?.[0];
  const colour = swatch ? colourKeys[colorName(swatch.rgb)] : undefined;
  if (colour)
    facts.push({
      key: "colour",
      label: "fact.colour",
      value: colour,
      source: "confirmed",
    });
  if (piece.kind)
    facts.push({
      key: "kind",
      label: "piece.kind",
      value: `kind.${piece.kind}`,
      source: sourceOf(piece, "kind"),
    });
  facts.push(
    ...attributeFact(piece, "fabric"),
    ...attributeFact(piece, "pattern"),
  );
  const sheer = piece.attributes?.sheer;
  if (sheer !== undefined)
    facts.push({
      key: "sheer",
      label: "fact.sheer",
      value: sheer ? "value.sheer.yes" : "value.sheer.no",
      source: sourceOf(piece, "sheer"),
    });
  for (const key of ["volume", "length", "sleeve", "formality"] as const)
    facts.push(...attributeFact(piece, key));
  const season = wearSeason(piece);
  if (season)
    facts.push({
      key: "season",
      label: "fact.season",
      value: `value.season.${season.season}`,
      source: season.source,
    });
  return facts;
}

function askedAttribute(key: FactKey): AttributeKey | null {
  if (key === "season") return "fabric";
  if (key === "colour" || key === "kind" || key === "sheer") return null;
  return key;
}

export function factChoice(piece: Piece, key: FactKey): FactChoice | null {
  if (key === "kind")
    return {
      label: "piece.kind",
      current: piece.kind ?? null,
      options: kindsIn(piece.category).map((kind) => ({
        id: kind.id,
        label: `kind.${kind.id}`,
      })),
    };
  const attribute = askedAttribute(key);
  if (!attribute) return null;
  const value = piece.attributes?.[attribute];
  return {
    label: attributeLabelKey(attribute),
    current: value === undefined ? null : String(value),
    options: optionsFor(attribute).map((option) => ({
      id: String(option.id),
      label: attributeValueKey(attribute, option.id),
    })),
  };
}

function confirmedPiece(piece: Piece, key: FactKey, option: string): Piece {
  if (key === "kind") {
    const kind =
      piece.kind === option
        ? piece.kind
        : kindsIn(piece.category).find((item) => item.id === option)?.id;
    if (!kind) throw new Error(t("error.listedOption"));
    const styles = fixedStyles(kind);
    const dropStyles =
      !styles &&
      kind !== piece.kind &&
      !!piece.kind &&
      !!fixedStyles(piece.kind);
    const sources: Partial<Record<SourceKey, Source>> = {
      ...piece.sources,
      kind: "confirmed",
    };
    if (styles) sources.styles = "confirmed";
    if (dropStyles) delete sources.styles;
    const next: Piece = {
      ...piece,
      kind,
      ...(styles ? { styles } : {}),
      sources,
    };
    if (dropStyles) delete next.styles;
    return fitAttributes(next);
  }
  const attribute = askedAttribute(key);
  const value = attribute
    ? optionsFor(attribute).find((item) => String(item.id) === option)?.id
    : undefined;
  if (!attribute || value === undefined)
    throw new Error(t("error.listedOption"));
  return confirmAttribute(piece, attribute, value);
}

export function confirmFact(
  closet: Closet,
  id: string,
  key: FactKey,
  option: string,
): Closet {
  const piece = closet.pieces.find((item) => item.id === id);
  if (!piece) return closet;
  return savePiece(closet, confirmedPiece(piece, key, option));
}
