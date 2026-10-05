import { useMemo, useState } from "react";
import { randomUUID } from "expo-crypto";
import { router } from "expo-router";
import { type Piece, saveLook } from "../../domain/closet";
import {
  builderRequest,
  fillOutfit,
  rankPieces,
  swapOptions,
} from "../../domain/builder";
import { recordSaved } from "../../domain/feedback";
import { outfitName } from "../../domain/outfitName";
import { missingRoles, roleOf } from "../../domain/styling";
import { clockFor } from "../../domain/today";
import { locale, t } from "../../i18n";
import { useDiscardChanges } from "../../navigation/useDiscardChanges";
import { useCloset } from "../../state/closet";
import { now } from "../../state/clock";
import { announce } from "../../ui/announce";

export type Mode = { kind: "picker" } | { kind: "swap"; pieceId: string };

const setKey = (ids: string[]) => [...ids].sort().join();

function countLine(count: number) {
  return count === 1
    ? t("common.pieceCountOne")
    : t("common.pieceCountMany", { count });
}

export function useBuilder(params: { id?: string }) {
  const { closet, update } = useCloset();
  const [source] = useState(() =>
    params.id ? closet.looks.find((look) => look.id === params.id) : undefined,
  );
  const gone = !source;
  const [startIds] = useState(() => source?.pieceIds ?? []);
  const [initial] = useState(() =>
    startIds.filter((id) => closet.pieces.some((piece) => piece.id === id)),
  );
  const [selected, setSelected] = useState(initial);
  const occasion = source?.occasion ?? "everyday";
  const [category, setCategory] = useState<string>("all");
  const [mode, setMode] = useState<Mode>({ kind: "picker" });
  const [line, setLine] = useState<{ text: string; error: boolean } | null>(
    initial.length < startIds.length
      ? { text: t("build.pieceGone"), error: false }
      : null,
  );
  const [undo, setUndo] = useState<string[] | null>(null);
  const [filling, setFilling] = useState(false);
  const [saving, setSaving] = useState(false);
  const localDate = clockFor(now()).localDate;

  const live = selected.filter((id) =>
    closet.pieces.some((piece) => piece.id === id),
  );
  if (live.length !== selected.length) {
    setSelected(live);
    setLine({ text: t("build.pieceGone"), error: false });
    announce(t("build.pieceGone"));
  }

  const request = useMemo(
    () => builderRequest(closet, selected, occasion),
    [closet, selected, occasion],
  );
  const pieces = selected.flatMap((id) =>
    closet.pieces.filter((piece) => piece.id === id),
  );
  const name = source?.name ?? "";
  const same =
    closet.looks.find(
      (look) =>
        look.id !== source?.id && setKey(look.pieceIds) === setKey(selected),
    ) ?? null;
  const empty = missingRoles(pieces, request);
  const rankKey = `${category}|${occasion}|${closet.pieces.map((piece) => piece.id).join()}`;
  const [ranked, setRanked] = useState<{ key: string; ids: string[] }>({
    key: "",
    ids: [],
  });
  if (ranked.key !== rankKey) {
    const pool = closet.pieces.filter(
      (piece) => category === "all" || piece.category === category,
    );
    setRanked({
      key: rankKey,
      ids: rankPieces(closet, request, selected, pool, localDate).map(
        (piece) => piece.id,
      ),
    });
  }
  const strip = ranked.ids.flatMap((id) =>
    closet.pieces.filter((piece) => piece.id === id),
  );

  const dirty = !!source && setKey(source.pieceIds) !== setKey(selected);
  const swapId = mode.kind === "swap" ? mode.pieceId : null;
  const [swapOrder, setSwapOrder] = useState<string[]>([]);
  if (swapId && !swapOrder.includes(swapId)) {
    setSwapOrder([
      swapId,
      ...swapOptions(closet, request, selected, swapId, localDate).map(
        (piece) => piece.id,
      ),
    ]);
  }
  const allowClose = useDiscardChanges(dirty, saving);

  function apply(next: string[]) {
    setLine(null);
    setSelected(next);
    announce(countLine(next.length), { queue: true });
  }

  function toggle(piece: Piece) {
    if (selected.includes(piece.id)) {
      apply(selected.filter((id) => id !== piece.id));
      return;
    }
    const role = roleOf(piece);
    const whole = piece.category === "dress" || piece.kind === "abaya";
    apply([
      ...selected.filter((id) => {
        const other = closet.pieces.find((item) => item.id === id);
        if (!other) return false;
        const otherRole = roleOf(other);
        if (otherRole === role) return false;
        if (whole && otherRole === "bottom") return false;
        if (
          role === "bottom" &&
          (other.category === "dress" || other.kind === "abaya")
        )
          return false;
        return true;
      }),
      piece.id,
    ]);
  }

  function swapTo(target: string, piece: Piece) {
    setUndo(selected);
    apply(selected.map((id) => (id === target ? piece.id : id)));
    setMode({ kind: "swap", pieceId: piece.id });
    announce(t("result.changed"), { queue: true });
  }

  function undoSwap() {
    if (!undo) return;
    const back = undo.find((id) => !selected.includes(id));
    apply(undo);
    setUndo(null);
    if (back) setMode({ kind: "swap", pieceId: back });
  }

  function alternatives(pieceId: string) {
    const ids = swapOrder.includes(pieceId) ? swapOrder : [pieceId];
    return ids.flatMap((id) =>
      closet.pieces
        .filter((piece) => piece.id === id)
        .map((piece) => ({ piece, reason: null })),
    );
  }

  function fill() {
    setFilling(true);
    setTimeout(() => {
      const filled = fillOutfit(closet, request, localDate);
      setFilling(false);
      if ("ids" in filled) apply(filled.ids);
      else {
        const text = filled.problems[0]?.message ?? t("styling.incomplete");
        setLine({ text, error: false });
        announce(text);
      }
    }, 0);
  }

  async function save() {
    if (saving || !selected.length || !source || same) return;
    setSaving(true);
    setLine(null);
    try {
      await update((current) =>
        recordSaved(
          saveLook(current, {
            ...source,
            name: name || outfitName(pieces, occasion, locale),
            pieceIds: selected,
          }),
          selected,
          now().toISOString(),
          randomUUID(),
        ),
      );
      allowClose();
      router.back();
    } catch {
      setLine({ text: t("common.error.save"), error: true });
      announce(t("common.error.save"));
    } finally {
      setSaving(false);
    }
  }

  return {
    closet,
    gone,
    pieces,
    selected,
    name,
    same,
    empty,
    occasion,
    category,
    setCategory,
    mode,
    setMode,
    line,
    undo,
    filling,
    saving,
    dirty,
    strip,
    toggle,
    swapTo,
    undoSwap,
    alternatives,
    fill,
    save,
  };
}
