import { useEffect } from "react";
import ClosetVision from "../../modules/closet-vision/src";
import {
  backgroundFix,
  opaqueStudios,
  repairPhotos,
  replacePhotoFile,
  toCutout,
  withCutout,
} from "../domain/background";
import type { Closet, Piece } from "../domain/closet";
import { filesInUse } from "../domain/importing";
import type { ClosetRepository } from "../domain/repository";
import { discardPhoto, photoExists, photoUri } from "../storage/local";
import { canPrepareOnDevice } from "./imports";
import { clearStudio } from "./studio";

type Update = ClosetRepository["update"];

const stamp = () => Date.now().toString(36);

const stem = (file: string) => file.replace(/\.[^.]+$/, "");

function discardUnused(closet: Closet, files: (string | null | undefined)[]) {
  const kept = filesInUse(closet);
  for (const file of new Set(files))
    if (file && !kept.has(file)) void discardPhoto(file).catch(() => undefined);
}

async function clearFile(
  update: Update,
  read: () => Closet,
  file: string,
): Promise<boolean> {
  const clear = await clearStudio(file, `${stem(file)}-clear-${stamp()}`);
  if (!clear) return false;
  let applied = false;
  await update((current) => {
    const next = replacePhotoFile(current, file, clear);
    applied = next !== current;
    return next;
  });
  discardUnused(read(), applied ? [file] : [clear]);
  return applied;
}

export function canRemoveBackground(piece: Piece): boolean {
  const fix = backgroundFix(piece);
  return fix === "cutout" || (fix !== null && canPrepareOnDevice);
}

export async function removeBackground(
  update: Update,
  read: () => Closet,
  piece: Piece,
): Promise<boolean> {
  const fix = backgroundFix(piece);
  if (!fix) return false;
  try {
    if (fix === "cutout") {
      await update((current) => toCutout(current, piece.id));
      return true;
    }
    if (!canPrepareOnDevice) return false;
    if (fix === "studio") return await clearFile(update, read, piece.photo);
    const result = await ClosetVision.prepare(
      photoUri(piece.original ?? piece.photo),
      `${piece.id}-cut-${stamp()}`,
    );
    const made = [
      result.original,
      result.cutout,
      result.enhanced,
      result.thumbnail,
    ];
    if (!result.cutout || !result.enhanced) {
      discardUnused(read(), made);
      return false;
    }
    const whole = { x: 0, y: 0, width: 1, height: 1 };
    let applied = false;
    await update((current) => {
      const next = withCutout(current, piece.id, {
        cutout: result.cutout!,
        enhanced: result.enhanced!,
        thumbnail: result.thumbnail ?? result.enhanced!,
        frame: result.frame ?? whole,
        area: result.area ?? whole,
      });
      applied = next !== current;
      return next;
    });
    discardUnused(read(), made);
    return applied;
  } catch {
    return false;
  }
}

const tried = new Set<string>();

export function useStudioRepair(repository: ClosetRepository, ready: boolean) {
  useEffect(() => {
    if (!ready || !canPrepareOnDevice) return;
    let stopped = false;
    const read = () => repository.getSnapshot();
    const run = async () => {
      for (const file of opaqueStudios(read())) {
        if (stopped) return;
        if (tried.has(file)) continue;
        tried.add(file);
        try {
          await clearFile(repository.update.bind(repository), read, file);
        } catch {
          continue;
        }
      }
    };
    void run().catch(() => undefined);
    return () => {
      stopped = true;
    };
  }, [repository, ready]);
}

export function usePhotoRepair(repository: ClosetRepository, ready: boolean) {
  useEffect(() => {
    if (!ready) return;
    const repair = () => {
      const snapshot = repository.getSnapshot();
      if (repairPhotos(snapshot, photoExists) === snapshot) return;
      void repository
        .update((closet) => repairPhotos(closet, photoExists))
        .catch(() => undefined);
    };
    repair();
    return repository.subscribe(repair);
  }, [repository, ready]);
}
