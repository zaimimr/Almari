import { en } from "../i18n/en";
import { nb } from "../i18n/nb";
import type { Occasion, Piece } from "./closet";
import { colorName, type Rgb } from "./color";
import { roleOf } from "./styling";

export type NameLocale = "en" | "nb";

const catalogs: Record<NameLocale, Record<string, string>> = { en, nb };

export function say(
  locale: NameLocale,
  key: string,
  vars: Record<string, string> = {},
) {
  return (catalogs[locale][key] ?? key).replace(
    /\{(\w+)\}/g,
    (_match, name: string) => vars[name] ?? "",
  );
}

const slug = (name: string) => name.toLowerCase().replaceAll(" ", "-");

export function colourWord(rgb: Rgb, locale: NameLocale) {
  return say(locale, `outfitName.colour.${slug(colorName(rgb))}`);
}

export function garmentWord(
  piece: Pick<Piece, "kind" | "category">,
  locale: NameLocale,
) {
  return piece.kind
    ? say(locale, `kind.${piece.kind}`).toLowerCase()
    : say(locale, `outfitName.category.${piece.category}`);
}

export function mainPiece(pieces: Piece[]) {
  return (
    pieces.find((piece) => roleOf(piece) === "main") ??
    pieces.find((piece) => roleOf(piece) === "outer") ??
    pieces[0] ??
    null
  );
}

function mainColour(piece: Piece): Rgb | null {
  const [first] = [...(piece.colors ?? [])].sort((a, b) => b.share - a.share);
  return first?.rgb ?? null;
}

export function outfitName(
  pieces: Piece[],
  occasion: Occasion,
  locale: NameLocale,
) {
  const main = mainPiece(pieces);
  if (!main) return "";
  const rgb = mainColour(main);
  const occasionWord =
    occasion === "everyday"
      ? ""
      : say(locale, `outfitName.occasion.${occasion}`);
  const shape = rgb
    ? occasionWord
      ? "full"
      : "noOccasion"
    : occasionWord
      ? "noColour"
      : "plain";
  const text = say(locale, `outfitName.${shape}`, {
    colour: rgb ? colourWord(rgb, locale) : "",
    occasion: occasionWord,
    garment: garmentWord(main, locale),
  });
  return text.charAt(0).toUpperCase() + text.slice(1);
}
