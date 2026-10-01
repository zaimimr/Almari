import { useEffect } from "react";
import ClosetVision, {
  type PreparedGarment,
} from "../../modules/closet-vision/src";
import type { ClosetRepository } from "../domain/repository";
import type { ImportJob, Piece, Prepared } from "../domain/closet";
import {
  attributeRefreshVersion,
  failImport,
  finishImport,
  finishRefresh,
  piecesToRefresh,
  recoverImports,
  refreshPiece,
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

const wait = (milliseconds: number) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

export async function measurePiece(
  repository: Pick<ClosetRepository, "update">,
  piece: Piece,
) {
  if (!canPrepareOnDevice) return;
  try {
    const result = await ClosetVision.prepare(
      photoUri(piece.original ?? piece.photo),
      `${piece.id}-refresh`,
    );
    for (const file of [result.original, result.cutout, result.thumbnail])
      if (file && file !== piece.photo && file !== piece.original)
        void discardPhoto(file).catch(() => undefined);
    await repository.update((closet) =>
      refreshPiece(closet, piece.id, preparedFrom(result)),
    );
  } catch {
    return;
  }
}

export function useAttributeRefresh(
  repository: ClosetRepository,
  ready: boolean,
) {
  useEffect(() => {
    if (!ready || !canPrepareOnDevice) return;
    let stopped = false;
    const importing = () =>
      repository
        .getSnapshot()
        .imports.some(
          (job) => job.state === "queued" || job.state === "preparing",
        );
    const run = async () => {
      if (
        (repository.getSnapshot().attributeRefresh ?? 0) >=
        attributeRefreshVersion
      )
        return;
      for (const piece of piecesToRefresh(repository.getSnapshot())) {
        while (!stopped && importing()) await wait(2000);
        if (stopped) return;
        try {
          const result = await ClosetVision.prepare(
            photoUri(piece.original ?? piece.photo),
            `${piece.id}-refresh`,
          );
          for (const file of [result.original, result.cutout, result.thumbnail])
            if (file && file !== piece.photo && file !== piece.original)
              void discardPhoto(file).catch(() => undefined);
          if (stopped) return;
          await repository.update((closet) =>
            refreshPiece(closet, piece.id, preparedFrom(result)),
          );
        } catch {
          continue;
        }
      }
      if (!stopped) await repository.update(finishRefresh);
    };
    void run().catch(() => undefined);
    return () => {
      stopped = true;
    };
  }, [repository, ready]);
}
