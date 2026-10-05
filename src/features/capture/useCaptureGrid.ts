import { useCallback, useEffect, useRef, useState } from "react";
import { AccessibilityInfo } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { randomUUID } from "expo-crypto";
import { useFocusEffect } from "expo-router";
import {
  categoryOf,
  type Category,
  type ImportJob,
  type Piece,
} from "../../domain/closet";
import {
  acceptImports,
  correctImport,
  importStudioSource,
  keepDuplicate,
  queueImport,
  retryImport,
  setImportStudio,
} from "../../domain/importing";
import { t } from "../../i18n";
import { useCloset } from "../../state/closet";
import { now } from "../../state/clock";
import { changeImports } from "../../state/imports";
import { setLastAdded } from "../../state/launch";
import { renderStudio, studioFailure, studioOffered } from "../../state/studio";
import { discardPhoto, keepPhotoAs, lowOnSpace } from "../../storage/local";
import { confirmAction } from "../../ui/confirm";
import type { CaptureProblem } from "../Retake";
import { isGrouped, jobColour, jobPiece } from "./jobs";
import {
  removeWithUndo,
  settleRemoved,
  undoRemove as restore,
  useRemovedSlots,
} from "./removed";

export type Group = { captureId: string; jobs: ImportJob[]; thumbnail: string };

export type Slot =
  | { kind: "job"; job: ImportJob; number: number }
  | { kind: "removed"; job: ImportJob; number: number }
  | { kind: "group"; group: Group };

export type GridSection = { category: Category | null; slots: Slot[] };

export type Problem = {
  kind: CaptureProblem;
  from: "camera" | "library";
  count?: number;
};

export type Lookalike = { job: ImportJob; match: Piece; matchJob?: ImportJob };

export function useCaptureGrid() {
  const { closet, update } = useCloset();
  const removedSlots = useRemovedSlots();
  const latest = useRef(closet);
  useEffect(() => {
    latest.current = closet;
  });
  const [tipsChoice, setTipsOpen] = useState<boolean | null>(null);
  const tipsOpen = tipsChoice ?? !closet.photoTipsSeen;
  const [cleaning, setCleaning] = useState<{
    done: number;
    total: number;
  } | null>(null);
  const [selecting, setSelecting] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [problem, setProblem] = useState<Problem | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useFocusEffect(useCallback(() => () => settleRemoved(latest.current), []));

  useEffect(() => () => settleRemoved(latest.current), []);

  const jobs = closet.imports;
  const lookalikes: Lookalike[] = jobs.flatMap((job) => {
    if (!job.duplicateOf || job.state === "failed") return [];
    const piece = closet.pieces.find((item) => item.id === job.duplicateOf);
    if (piece) return [{ job, match: piece }];
    const other = jobs.find((item) => item.id === job.duplicateOf);
    return other ? [{ job, match: jobPiece(other), matchJob: other }] : [];
  });
  const paired = new Set(
    lookalikes.flatMap((pair) => [pair.job.id, pair.matchJob?.id ?? ""]),
  );
  const numbered = new Map(jobs.map((job, index) => [job.id, index + 1]));
  const slotsInOrder: { job: ImportJob; removed: boolean }[] = jobs.map(
    (job) => ({ job, removed: false }),
  );
  for (const slot of [...removedSlots].sort((a, b) => a.index - b.index))
    slotsInOrder.splice(Math.min(slot.index, slotsInOrder.length), 0, {
      job: slot.job,
      removed: true,
    });

  const grouped = new Map<string, ImportJob[]>();
  for (const job of jobs)
    if (isGrouped(job))
      grouped.set(job.captureId!, [
        ...(grouped.get(job.captureId!) ?? []),
        job,
      ]);
  const groups: Group[] = [...grouped.entries()]
    .filter(([, members]) => members.length > 1)
    .map(([captureId, members]) => ({
      captureId,
      jobs: members,
      thumbnail: members[0]!.source,
    }));
  const inGroup = new Set(
    groups.flatMap((group) => group.jobs.map((job) => job.id)),
  );

  const untitled: Slot[] = [];
  const seenGroups = new Set<string>();
  for (const { job, removed } of slotsInOrder) {
    if (!removed && paired.has(job.id)) continue;
    if (inGroup.has(job.id)) {
      const group = groups.find((item) => item.captureId === job.captureId)!;
      if (seenGroups.has(group.captureId)) continue;
      seenGroups.add(group.captureId);
      untitled.push({ kind: "group", group });
      continue;
    }
    const slot: Slot = {
      kind: removed ? "removed" : "job",
      job,
      number: numbered.get(job.id) ?? 0,
    };
    untitled.push(slot);
  }
  const sections: GridSection[] = untitled.length
    ? [{ category: null, slots: untitled }]
    : [];

  const ready = jobs.filter((job) => job.state === "ready").length;
  const confirm = jobs.filter((job) => job.state === "review").length;
  const failed = jobs.filter((job) => job.state === "failed").length;
  const waiting = jobs.filter(
    (job) => job.state === "queued" || job.state === "preparing",
  ).length;
  const preparing = waiting
    ? { n: jobs.length - waiting + 1, total: jobs.length }
    : null;
  const cleanable = studioOffered()
    ? jobs.filter(
        (job) =>
          (job.state === "ready" || job.state === "review") &&
          importStudioSource(job) &&
          !job.prepared?.studio &&
          !job.keepOriginal,
      )
    : [];

  async function cleanAll() {
    if (cleaning || !cleanable.length) return;
    const go = await confirmAction(
      t("capture.cleanAllTitle"),
      t("photo.cleanNote"),
      t("capture.cleanAllAction"),
    );
    if (!go) return;
    const list = cleanable.map((job) => job.id);
    setError(null);
    let missed = false;
    for (const [index, id] of list.entries()) {
      setCleaning({ done: index + 1, total: list.length });
      const job = latest.current.imports.find((item) => item.id === id);
      const source = job && importStudioSource(job);
      if (!job?.kind || !source) continue;
      try {
        const file = await renderStudio(source, id, {
          category: categoryOf(job.kind),
          kind: job.kind,
          name: job.name,
          colour: jobColour(job),
        });
        let applied = false;
        await update((current) => {
          const next = setImportStudio(current, id, file);
          applied = next !== current;
          return next;
        }).catch(() => undefined);
        if (!applied) void discardPhoto(file).catch(() => undefined);
      } catch (problem) {
        missed = true;
        if (studioFailure(problem) !== "failed") break;
      }
    }
    setCleaning(null);
    if (missed) setError(t("photo.cleanFailed"));
  }

  async function closeTipsSeen() {
    setTipsOpen(false);
    if (!latest.current.photoTipsSeen)
      await update((current) => ({ ...current, photoTipsSeen: true })).catch(
        () => undefined,
      );
  }

  async function add(uris: string[]) {
    let missed = 0;
    for (const uri of uris) {
      const id = randomUUID();
      let source: string | null = null;
      try {
        source = await keepPhotoAs(uri, id);
        const stored = source;
        await update((current) =>
          queueImport(current, {
            id,
            source: stored,
            createdAt: now().toISOString(),
          }),
        );
      } catch {
        if (source) void discardPhoto(source).catch(() => undefined);
        missed += 1;
      }
    }
    if (missed)
      setProblem({
        kind: lowOnSpace() ? "low-space" : "failed",
        from: "library",
        count: missed,
      });
    if (uris.length > missed) await closeTipsSeen();
  }

  async function pick(from: "camera" | "library") {
    setProblem(null);
    if (lowOnSpace()) {
      setProblem({ kind: "low-space", from });
      return;
    }
    try {
      if (from === "camera") {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted) {
          setProblem({ kind: "camera-off", from });
          return;
        }
      }
      const result =
        from === "camera"
          ? await ImagePicker.launchCameraAsync({
              mediaTypes: ["images"],
              quality: 1,
              exif: false,
            })
          : await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ["images"],
              allowsMultipleSelection: true,
              selectionLimit: 20,
              quality: 1,
              exif: false,
            });
      if (!result.canceled) await add(result.assets.map((asset) => asset.uri));
    } catch {
      setProblem({ kind: "unavailable", from });
    }
  }

  async function addReady(): Promise<"popped" | "stayed"> {
    if (busy) return "stayed";
    const ids = latest.current.imports
      .filter((job) => job.state === "ready")
      .map((job) => job.id);
    if (!ids.length) return "stayed";
    const emptied = ids.length === latest.current.imports.length;
    setBusy(true);
    setError(null);
    try {
      await changeImports(update, acceptImports);
      setLastAdded(ids);
      if (emptied) return "popped";
      AccessibilityInfo.announceForAccessibilityWithOptions(
        ids.length === 1
          ? t("closet.addedOne")
          : t("closet.addedMany", { count: ids.length }),
        { queue: true },
      );
      return "stayed";
    } catch {
      setError(t("error.piecesSave"));
      return "stayed";
    } finally {
      setBusy(false);
    }
  }

  return {
    jobs,
    sections,
    groups,
    ready,
    confirm,
    failed,
    tipsOpen,
    toggleTips: () => setTipsOpen(!tipsOpen),
    closeTips: closeTipsSeen,
    selecting,
    selected,
    toggleSelect: (id: string) =>
      setSelected((current) =>
        current.includes(id)
          ? current.filter((item) => item !== id)
          : [...current, id],
      ),
    startSelect: (id?: string) => {
      setSelecting(true);
      setSelected(id ? [id] : []);
    },
    endSelect: () => {
      setSelecting(false);
      setSelected([]);
    },
    takePhotos: () => pick("camera"),
    choosePhotos: () => pick("library"),
    problem,
    clearProblem: () => setProblem(null),
    report: (kind: CaptureProblem, from: "camera" | "library") =>
      setProblem({ kind, from }),
    lookalikes,
    keepBoth: (id: string) => update((current) => keepDuplicate(current, id)),
    preparing,
    cleanable: cleanable.length,
    cleaning,
    cleanAll,
    setColour: (id: string, name: string) =>
      update((current) => correctImport(current, id, { colour: name })),
    retry: (id: string) => update((current) => retryImport(current, id)),
    remove: (id: string) => removeWithUndo(update, id),
    undoRemove: (id: string) => restore(update, id),
    addReady,
    error,
    busy,
  };
}
