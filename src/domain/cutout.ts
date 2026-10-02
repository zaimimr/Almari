import type { Closet, Frame, ImportJob, Piece } from "./closet";
import { filesInUse } from "./importing";

export type CutoutEdit = {
  cutout: string;
  enhanced: string;
  thumbnail: string;
  frame: Frame;
  area: Frame;
};

export type CutoutSource = {
  original: string;
  cutout: string;
  area: Frame | null;
};

export type CutoutMode = "restore" | "erase";

export const brushSizes = { small: 12, medium: 28, large: 56 } as const;

export type BrushSize = keyof typeof brushSizes;

export function pieceCutout(piece: Piece): CutoutSource | null {
  const plain = piece.variants?.plain;
  if (piece.source !== "owned" || !piece.original) return null;
  if (!plain || !piece.variants?.enhanced) return null;
  return {
    original: piece.original,
    cutout: plain,
    area: piece.cutoutArea ?? null,
  };
}

export function importCutout(job: ImportJob): CutoutSource | null {
  if (job.state !== "ready" && job.state !== "review") return null;
  const prepared = job.prepared;
  if (!prepared?.cutout || !prepared.enhanced) return null;
  return {
    original: prepared.original,
    cutout: prepared.cutout,
    area: prepared.area ?? null,
  };
}

export function replacePieceCutout(
  closet: Closet,
  id: string,
  edit: CutoutEdit,
): Closet {
  const piece = closet.pieces.find((item) => item.id === id);
  if (!piece || !pieceCutout(piece)) return closet;
  const { plain, enhanced } = piece.variants!;
  const photo =
    piece.photo === plain
      ? edit.cutout
      : piece.photo === enhanced
        ? edit.enhanced
        : piece.photo;
  const next: Piece = {
    ...piece,
    photo,
    variants: {
      ...piece.variants,
      plain: edit.cutout,
      enhanced: edit.enhanced,
    },
    cutoutArea: edit.area,
    ...(piece.frame ? { frame: edit.frame } : {}),
  };
  return {
    ...closet,
    pieces: closet.pieces.map((item) => (item.id === id ? next : item)),
  };
}

export function replaceImportCutout(
  closet: Closet,
  id: string,
  edit: CutoutEdit,
): Closet {
  const job = closet.imports.find((item) => item.id === id);
  if (!job?.prepared || !importCutout(job)) return closet;
  const next: ImportJob = {
    ...job,
    prepared: {
      ...job.prepared,
      cutout: edit.cutout,
      enhanced: edit.enhanced,
      thumbnail: edit.thumbnail,
      frame: edit.frame,
      area: edit.area,
    },
  };
  return {
    ...closet,
    imports: closet.imports.map((item) => (item.id === id ? next : item)),
  };
}

export function leftoverFiles(
  before: Closet,
  after: Closet,
  edit: CutoutEdit,
): string[] {
  const kept = filesInUse(after);
  return [
    ...new Set([
      ...filesInUse(before),
      edit.cutout,
      edit.enhanced,
      edit.thumbnail,
    ]),
  ].filter((file) => !kept.has(file));
}

export function editedPhoto(
  photo: string,
  before: Piece["variants"],
  after: Piece["variants"],
): string {
  if (!before || !after) return photo;
  if (photo === before.plain && after.plain) return after.plain;
  if (photo === before.enhanced && after.enhanced) return after.enhanced;
  return photo;
}
