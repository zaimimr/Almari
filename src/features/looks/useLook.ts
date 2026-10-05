import { useState } from "react";
import { router } from "expo-router";
import { randomUUID } from "expo-crypto";
import * as Haptics from "expo-haptics";
import { saveLook, type Closet } from "../../domain/closet";
import { undoFeedback, woreLook } from "../../domain/feedback";
import {
  lookEntries,
  lookForPieces,
  removeLook,
  renameSet,
  planSnapshot,
  restorePlans,
  setPlannedFor,
  type LookEntry,
} from "../../domain/looks";
import { clockFor, ensureToday } from "../../domain/today";
import { locale, t } from "../../i18n";
import { useCloset } from "../../state/closet";
import { now } from "../../state/clock";
import { confirmAction } from "../../ui/confirm";
import { confirmReplace, showOn, wearAgain as wearAgainOn } from "./actions";
import { plannedText, todayDate } from "./format";

export type Body = "worn" | "plan" | null;

function resolve(closet: Closet, id: string) {
  const pieceIds = id.startsWith("set-") ? id.slice(4).split(",") : null;
  const look = pieceIds
    ? lookForPieces(closet, pieceIds)
    : (closet.looks.find((item) => item.id === id) ?? null);
  const entry = lookEntries(closet, locale, todayDate()).find((item) =>
    look ? item.lookId === look.id : item.id === id,
  );
  return { look, entry: entry ?? null };
}

function today(closet: Closet): Closet {
  return ensureToday(closet, clockFor(now()));
}

function withSaved(closet: Closet, entry: LookEntry, id: string) {
  const found = lookForPieces(closet, entry.pieceIds);
  if (found) return { closet, id: found.id };
  return {
    id,
    closet: saveLook(closet, {
      id,
      name: entry.name,
      pieceIds: entry.pieceIds,
      createdAt: now().toISOString(),
      ...(entry.occasion ? { occasion: entry.occasion } : null),
    }),
  };
}

function success() {
  void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
}

export type Notice = { text: string; undo?: () => void };

export function useLook(id: string) {
  const { closet, update } = useCloset();
  const { look, entry } = resolve(closet, id);
  const [body, setBody] = useState<Body>(null);
  const [worn, setWorn] = useState<{
    eventId: string;
    yesterday: boolean;
  } | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [error, setError] = useState<string | null>(null);
  const pieces = (entry?.pieceIds ?? []).flatMap((pieceId) => {
    const piece = closet.pieces.find((item) => item.id === pieceId);
    return piece ? [piece] : [];
  });

  const run = async (change: (current: Closet) => Closet, failed: string) => {
    setError(null);
    try {
      await update(change);
      return true;
    } catch {
      setError(failed);
      return false;
    }
  };

  const rename = (name: string) => {
    const clean = name.trim();
    if (!entry || !clean || clean === entry.name) return;
    void run(
      (current) =>
        look
          ? {
              ...current,
              looks: current.looks.map((item) =>
                item.id === look.id ? { ...item, name: clean } : item,
              ),
            }
          : renameSet(current, entry.pieceIds, clean),
      t("common.error.save"),
    );
  };

  const markWorn = async (yesterday: boolean) => {
    if (!entry) return;
    const eventId = randomUUID();
    const lookId = randomUUID();
    const at = new Date(
      now().getTime() - (yesterday ? 24 * 60 * 60 * 1000 : 0),
    ).toISOString();
    if (
      await run((current) => {
        const saved = withSaved(today(current), entry, lookId);
        return woreLook(saved.closet, saved.id, at, eventId);
      }, t("common.error.save"))
    ) {
      success();
      setNotice(null);
      setWorn({ eventId, yesterday });
    }
  };

  const undoWorn = async () => {
    if (!worn) return;
    if (
      await run(
        (current) => undoFeedback(current, worn.eventId),
        t("common.error.save"),
      )
    ) {
      setWorn(null);
      setBody(null);
    }
  };

  const plan = async (date: string | null) => {
    if (!entry) return;
    if (date && !(await confirmReplace(closet, date, look?.id ?? null))) return;
    const snapshot = planSnapshot(closet);
    const lookId = randomUUID();
    const isToday = date === todayDate();
    const done = await run((current) => {
      const saved = withSaved(current, entry, lookId);
      const planned = setPlannedFor(saved.closet, saved.id, date);
      return isToday ? showOn(entry)(planned) : planned;
    }, t("common.error.save"));
    if (!done) return;
    success();
    setBody(null);
    if (isToday) return router.dismissTo("/(tabs)/today");
    setWorn(null);
    setNotice({
      text: date ? plannedText(date) : t("looks.planCleared"),
      undo: () => {
        setNotice(null);
        void run(
          (current) => restorePlans(current, snapshot),
          t("common.error.save"),
        );
      },
    });
  };

  const save = async () => {
    if (!entry || look) return;
    if (
      await run(
        (current) => withSaved(current, entry, randomUUID()).closet,
        t("common.error.save"),
      )
    ) {
      success();
      setNotice({ text: t("looks.saved") });
    }
  };

  const showOnToday = async () => {
    if (!entry) return;
    if (await run(showOn(entry), t("common.error.save")))
      router.dismissTo("/(tabs)/today");
  };

  const wearAgain = async () => {
    if (!entry) return;
    if (await run(wearAgainOn(entry, randomUUID()), t("common.error.save"))) {
      success();
      router.dismissTo("/(tabs)/today");
    }
  };

  const remove = async () => {
    if (!look) return;
    const wears = closet.feedback.some(
      (event) =>
        event.kind === "wore" &&
        !event.undone &&
        event.scope !== "piece" &&
        [...event.pieceIds].sort().join() === [...look.pieceIds].sort().join(),
    );
    const ok = await confirmAction(
      t("look.removeTitle"),
      t(wears ? "look.removeBodyWorn" : "look.removeBody"),
      t("common.remove"),
    );
    if (!ok) return;
    if (
      await run(
        (current) => removeLook(current, look.id),
        t("common.error.remove"),
      )
    )
      router.back();
  };

  return {
    closet,
    look,
    entry,
    pieces,
    body,
    setBody,
    worn,
    setWorn,
    notice,
    setNotice,
    error,
    rename,
    markWorn,
    undoWorn,
    plan,
    save,
    showOnToday,
    wearAgain,
    remove,
  };
}
