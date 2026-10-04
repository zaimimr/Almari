import { useCallback, useEffect, useRef, useState } from "react";
import { AccessibilityInfo } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { randomUUID } from "expo-crypto";
import { useFocusEffect } from "expo-router";
import {
  categories,
  categoryOf,
  type Category,
  type Closet,
  type ImportJob,
} from "../../domain/closet";
import {
  acceptImports,
  correctImport,
  queueImport,
  retryImport,
} from "../../domain/importing";
import { t } from "../../i18n";
import { useCloset } from "../../state/closet";
import { now } from "../../state/clock";
import { changeImports } from "../../state/imports";
import { setLastAdded } from "../../state/launch";
import { discardPhoto, keepPhotoAs, lowOnSpace } from "../../storage/local";
import type { CaptureProblem } from "../Retake";
import { isGrouped } from "./jobs";
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

export type Problem = { kind: CaptureProblem; from: "camera" | "library" };

function placeOf(job: ImportJob): Category | null {
  if (!job.kind || isGrouped(job)) return null;
  if (job.state === "ready") return categoryOf(job.kind);
  if (job.state === "review" && job.question !== "category")
    return categoryOf(job.kind);
  return null;
}

function placements(closet: Closet) {
  return Object.fromEntries(
    closet.imports.map((job) => [job.id, placeOf(job)]),
  ) as Record<string, Category | null>;
}

export function useCaptureGrid() {
  const { closet, update } = useCloset();
  const removedSlots = useRemovedSlots();
  const latest = useRef(closet);
  useEffect(() => {
    latest.current = closet;
  });
  const [placed, setPlaced] = useState(() => placements(closet));
  const [tipsOpen, setTipsOpen] = useState(!closet.photoTipsSeen);
  const [selecting, setSelecting] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [problem, setProblem] = useState<Problem | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useFocusEffect(
    useCallback(() => {
      setPlaced(placements(latest.current));
      return () => {
        settleRemoved(latest.current);
        setPlaced(placements(latest.current));
      };
    }, []),
  );

  useEffect(() => () => settleRemoved(latest.current), []);

  const jobs = closet.imports;
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
  const byCategory = new Map<Category, Slot[]>();
  const seenGroups = new Set<string>();
  for (const { job, removed } of slotsInOrder) {
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
    const category = placed[job.id] ?? null;
    if (!category) untitled.push(slot);
    else byCategory.set(category, [...(byCategory.get(category) ?? []), slot]);
  }
  const sections: GridSection[] = [
    { category: null, slots: untitled },
    ...categories.flatMap(({ id }) => {
      const slots = byCategory.get(id);
      return slots ? [{ category: id, slots }] : [];
    }),
  ].filter((section) => section.slots.length > 0);

  const ready = jobs.filter((job) => job.state === "ready").length;
  const confirm = jobs.filter((job) => job.state === "review").length;
  const failed = jobs.filter((job) => job.state === "failed").length;

  async function closeTipsSeen() {
    setTipsOpen(false);
    if (!latest.current.photoTipsSeen)
      await update((current) => ({ ...current, photoTipsSeen: true })).catch(
        () => undefined,
      );
  }

  async function add(uris: string[]) {
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
        setProblem({
          kind: lowOnSpace() ? "low-space" : "failed",
          from: "library",
        });
        return;
      }
    }
    if (uris.length) await closeTipsSeen();
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
    toggleTips: () => setTipsOpen((open) => !open),
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
