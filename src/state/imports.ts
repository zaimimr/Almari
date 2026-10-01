import { useEffect } from "react";
import ClosetVision, {
  type PreparedGarment,
} from "../../modules/closet-vision/src";
import type { ClosetRepository } from "../domain/repository";
import type { ImportJob, Prepared } from "../domain/closet";
import {
  failImport,
  finishImport,
  recoverImports,
  startImport,
} from "../domain/importing";
import { discardPhoto, photoUri } from "../storage/local";

export const canPrepareOnDevice = ClosetVision.isAvailable();
export const addPiecesRoute = canPrepareOnDevice ? "/capture" : "/piece/new";

export function discardImportFiles(job: ImportJob, keepOriginal = false) {
  const files = [
    keepOriginal ? null : job.source,
    job.prepared?.cutout,
    job.prepared?.thumbnail,
  ];
  for (const file of files)
    if (file) void discardPhoto(file).catch(() => undefined);
}

export function preparedFrom(result: PreparedGarment): Prepared {
  return {
    original: result.original,
    cutout: result.cutout,
    thumbnail: result.thumbnail,
    frame: result.frame,
    instances: result.instances,
    labels: result.labels,
    palette: result.palette,
    embedding: result.embedding,
  };
}

export function useImportRunner(repository: ClosetRepository, ready: boolean) {
  useEffect(() => {
    if (!ready || !canPrepareOnDevice) return;
    let running = false;
    let stopped = false;
    const tick = async () => {
      if (running || stopped) return;
      const job = repository
        .getSnapshot()
        .imports.find((item) => item.state === "queued");
      if (!job) return;
      running = true;
      try {
        await repository.update((closet) => startImport(closet, job.id));
        try {
          const result = await ClosetVision.prepare(
            photoUri(job.source),
            job.id,
          );
          const prepared = preparedFrom(result);
          const current = repository
            .getSnapshot()
            .imports.find((item) => item.id === job.id);
          if (current?.state === "preparing")
            await repository.update((closet) =>
              finishImport(closet, job.id, prepared),
            );
          else discardImportFiles({ ...job, prepared }, true);
        } catch {
          await repository.update((closet) =>
            failImport(closet, job.id, "processing"),
          );
        }
      } catch {
        stopped = true;
      } finally {
        running = false;
        void tick();
      }
    };
    void repository
      .update(recoverImports)
      .then(tick)
      .catch(() => undefined);
    const unsubscribe = repository.subscribe(() => {
      void tick();
    });
    return () => {
      stopped = true;
      unsubscribe();
    };
  }, [repository, ready]);
}
