import type { Closet, Piece } from "./closet";
import { replacePieceCutout, type CutoutEdit } from "./cutout";

export type BackgroundFix = "studio" | "cutout" | "prepare";

export const isOpaque = (file: string) => !/\.png$/i.test(file);

export function hasBackground(piece: Piece): boolean {
  return piece.source === "owned" && isOpaque(piece.photo);
}

export function backgroundFix(piece: Piece): BackgroundFix | null {
  if (!hasBackground(piece)) return null;
  if (piece.variants?.studio === piece.photo) return "studio";
  const cut = piece.variants?.enhanced ?? piece.variants?.plain;
  if (cut && !isOpaque(cut)) return "cutout";
  return "prepare";
}

export function opaqueStudios(closet: Closet): string[] {
  return [
    ...new Set(
      [
        ...closet.pieces.map((piece) => piece.variants?.studio),
        ...closet.imports.map((job) => job.prepared?.studio),
      ].filter((file): file is string => Boolean(file) && isOpaque(file!)),
    ),
  ];
}

export function replacePhotoFile(
  closet: Closet,
  from: string,
  to: string,
): Closet {
  let changed = false;
  const swap = <T extends string | null | undefined>(file: T): T => {
    if (file !== from) return file;
    changed = true;
    return to as T;
  };
  const pieces = closet.pieces.map((piece) => {
    const photo = swap(piece.photo);
    const studio = swap(piece.variants?.studio);
    if (photo === piece.photo && studio === piece.variants?.studio)
      return piece;
    return {
      ...piece,
      photo,
      ...(piece.variants ? { variants: { ...piece.variants, studio } } : {}),
    };
  });
  const imports = closet.imports.map((job) => {
    if (!job.prepared) return job;
    const studio = swap(job.prepared.studio);
    return studio === job.prepared.studio
      ? job
      : { ...job, prepared: { ...job.prepared, studio } };
  });
  return changed ? { ...closet, pieces, imports } : closet;
}

export function toCutout(closet: Closet, id: string): Closet {
  const piece = closet.pieces.find((item) => item.id === id);
  const cut = piece?.variants?.enhanced ?? piece?.variants?.plain;
  if (!piece || !cut || piece.photo === cut) return closet;
  return {
    ...closet,
    pieces: closet.pieces.map((item) =>
      item.id === id ? { ...item, photo: cut } : item,
    ),
  };
}

export function withCutout(
  closet: Closet,
  id: string,
  edit: CutoutEdit,
): Closet {
  const piece = closet.pieces.find((item) => item.id === id);
  if (!piece || piece.source !== "owned" || !hasBackground(piece))
    return closet;
  const based: Closet = piece.original
    ? closet
    : {
        ...closet,
        pieces: closet.pieces.map((item) =>
          item.id === id ? { ...item, original: item.photo } : item,
        ),
      };
  const next = replacePieceCutout(based, id, edit);
  return next === based ? closet : toCutout(next, id);
}
