import type { Key } from "../i18n/en";
import {
  confirmAttribute,
  fitAttributes,
  optionsFor,
  type AttributeKey,
  type AttributeValue,
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
  type Warmth,
} from "./closet";
import { colorName } from "./color";

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

const sourceOf = (piece: Piece, key: SourceKey): Source =>
  piece.sources?.[key] ?? "confirmed";

export const attributeLabelKey = (key: AttributeKey): Key => `attribute.${key}`;

export const attributeValueKey = (key: AttributeKey, value: AttributeValue) =>
  `value.${key}.${value}` as Key;

export function wearSeason(
  piece: Piece,
): { season: WearSeason; source: Source } | null {
  const warmth = piece.traits?.warmth;
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
    if (!kind) throw new Error("Choose one of the listed options.");
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
    throw new Error("Choose one of the listed options.");
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
