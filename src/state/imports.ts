import { useEffect } from "react";
import ClosetVision, {
  type PreparedGarment,
} from "../../modules/closet-vision/src";
import type { ClosetRepository } from "../domain/repository";
import type { Closet, ImportJob, Piece, Prepared } from "../domain/closet";
import { proposalsFromRegions, unparsedCapture } from "../domain/capture";
import {
  attributeRefreshVersion,
  failImport,
  fileStem,
  finishImport,
  finishRefresh,
  importFailure,
  jobStem,
  orphanedFiles,
  piecesToRefresh,
  recoverImports,
  refreshPiece,
  splitCapture,
  startImport,
} from "../domain/importing";
import { discardPhoto, photoUri } from "../storage/local";
import { fixtures } from "../testing/fixtures";

export const canPrepareOnDevice = ClosetVision.isAvailable();
export const addPiecesRoute = canPrepareOnDevice ? "/capture" : "/piece/new";

export async function changeImports(
  update: (transform: (closet: Closet) => Closet) => Promise<void>,
  transform: (closet: Closet) => Closet,
) {
  let files: string[] = [];
  await update((current) => {
    const next = transform(current);
    files = orphanedFiles(current, next);
    return next;
  });
  for (const file of files) void discardPhoto(file).catch(() => undefined);
}

async function parseCapture(repository: ClosetRepository, job: ImportJob) {
  const found = await ClosetVision.parseGarments(
    photoUri(job.source),
    fileStem(job.source),
  ).catch(() => null);
  const plan = found
    ? proposalsFromRegions(found.regions, found.people)
    : unparsedCapture;
  let applied = false;
  await repository.update((closet) => {
    const next = splitCapture(closet, job.id, plan);
    applied = next !== closet;
    return next;
  });
  const kept = new Set(
    applied ? plan.proposals.map((proposal) => proposal.region.cutout) : [],
  );
  for (const region of found?.regions ?? [])
    if (!kept.has(region.cutout))
      void discardPhoto(region.cutout).catch(() => undefined);
}

export function preparedFrom(result: PreparedGarment): Prepared {
  return {
    original: result.original,
    cutout: result.cutout,
    enhanced: result.enhanced,
    quality: result.quality
      ? {
          ...result.quality,
          coverage: result.quality.coverage ?? null,
          lightSpread: result.quality.lightSpread ?? null,
        }
      : null,
    thumbnail: result.thumbnail,
    frame: result.frame,
    instances: result.instances,
    labels: result.labels,
    palette: result.palette,
    embedding: result.embedding,
    ...(result.area ? { area: result.area } : {}),
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
        if (fixtures.slowPrepare) await wait(fixtures.slowPrepare);
        if (!job.captureId) {
          await parseCapture(repository, job);
          return;
        }
        try {
          if (fixtures.failPrepare) {
            fixtures.failPrepare -= 1;
            throw new Error("fixture");
          }
          const result = await ClosetVision.prepare(
            photoUri(job.source),
            jobStem(job),
            job.crop
              ? { crop: job.crop }
              : job.region
                ? { cutout: job.region.cutout }
                : undefined,
          );
          const prepared = preparedFrom(result);
          const current = repository
            .getSnapshot()
            .imports.find((item) => item.id === job.id);
          if (current?.state === "preparing")
            await repository.update((closet) =>
              finishImport(closet, job.id, prepared, {
                width: result.width,
                height: result.height,
              }),
            );
          else {
            const closet = repository.getSnapshot();
            const stale = { ...closet, imports: [{ ...job, prepared }] };
            for (const file of orphanedFiles(stale, closet))
              void discardPhoto(file).catch(() => undefined);
          }
        } catch (error) {
          await repository.update((closet) =>
            failImport(closet, job.id, importFailure(error)),
          );
        }
      } catch (error) {
        await repository
          .update((closet) => failImport(closet, job.id, importFailure(error)))
          .catch(() => {
            stopped = true;
          });
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
    for (const file of [
      result.original,
      result.cutout,
      result.enhanced,
      result.thumbnail,
    ])
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
          for (const file of [
            result.original,
            result.cutout,
            result.enhanced,
            result.thumbnail,
          ])
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
