import { useState } from "react";
import { router } from "expo-router";
import { randomUUID } from "expo-crypto";
import { saveLook, type Closet } from "../../domain/closet";
import { undoFeedback, woreLook } from "../../domain/feedback";
import {
  lookEntries,
  lookForPieces,
  removeLook,
  renameSet,
  setPlannedFor,
} from "../../domain/looks";
import {
  activeSession,
  applyLook,
  clockFor,
  ensureToday,
} from "../../domain/today";
import { locale, t } from "../../i18n";
import { useCloset } from "../../state/closet";
import { now } from "../../state/clock";
import { confirmAction } from "../../ui/confirm";

export type Body = "worn" | "plan" | null;

function resolve(closet: Closet, id: string) {
  const pieceIds = id.startsWith("set-") ? id.slice(4).split(",") : null;
  const look = pieceIds
    ? lookForPieces(closet, pieceIds)
    : (closet.looks.find((item) => item.id === id) ?? null);
  const entry = lookEntries(closet, locale).find((item) =>
    look ? item.lookId === look.id : item.id === id,
  );
  return { look, entry: entry ?? null };
}

function today(closet: Closet): Closet {
  return ensureToday(closet, clockFor(now()));
}

export function useLook(id: string) {
  const { closet, update } = useCloset();
  const { look, entry } = resolve(closet, id);
  const [body, setBody] = useState<Body>(null);
  const [worn, setWorn] = useState<{
    eventId: string;
    yesterday: boolean;
  } | null>(null);
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
    if (!look) return;
    const eventId = randomUUID();
    const at = new Date(
      now().getTime() - (yesterday ? 24 * 60 * 60 * 1000 : 0),
    ).toISOString();
    if (
      await run(
        (current) => woreLook(today(current), look.id, at, eventId),
        t("common.error.save"),
      )
    )
      setWorn({ eventId, yesterday });
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
    if (!look) return;
    if (
      await run(
        (current) => setPlannedFor(current, look.id, date),
        t("common.error.save"),
      )
    )
      setBody(null);
  };

  const save = async () => {
    if (!entry || look) return;
    await run(
      (current) =>
        lookForPieces(current, entry.pieceIds)
          ? current
          : saveLook(current, {
              id: randomUUID(),
              name: entry.name,
              pieceIds: entry.pieceIds,
              createdAt: now().toISOString(),
              ...(entry.occasion ? { occasion: entry.occasion } : null),
            }),
      t("common.error.save"),
    );
  };

  const showOnToday = async () => {
    if (!entry) return;
    const shown = await run((current) => {
      const ready = today(current);
      const state = ready.styling.today;
      return state
        ? applyLook(ready, entry.pieceIds, activeSession(state).revision)
        : ready;
    }, t("common.error.save"));
    if (shown) router.dismissTo("/(tabs)/today");
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
    error,
    rename,
    markWorn,
    undoWorn,
    plan,
    save,
    showOnToday,
    remove,
  };
}
