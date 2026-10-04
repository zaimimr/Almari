import { useCallback, useEffect, useMemo, useState } from "react";
import { router, useFocusEffect } from "expo-router";
import { randomUUID } from "expo-crypto";
import { categories, type Category, type Piece } from "../../domain/closet";
import {
  filterPieces,
  groupByCategory,
  lastWorn,
  noFilter,
  panelFilterCount,
  type ClosetFilter,
} from "../../domain/closetFilters";
import { undoFeedback, woreLately } from "../../domain/feedback";
import { linkSet } from "../../domain/sets";
import { setArchived } from "../../domain/wardrobe";
import { builderRequest } from "../../domain/builder";
import { clockFor, ensureToday, startOccasion } from "../../domain/today";
import { t } from "../../i18n";
import { useCloset } from "../../state/closet";
import { now } from "../../state/clock";
import { takePendingFilter } from "../../state/closetFilter";
import { takeLastAdded } from "../../state/launch";
import { announce } from "../../ui/announce";
import { motion } from "../../ui/motion";

export type SelectResult =
  { text: string; undo?: () => void } | { error: string } | null;

const errorText = (error: unknown) =>
  error instanceof Error && error.message === t("error.setTooSmall")
    ? error.message
    : t("common.error.save");

export function useClosetScreen() {
  const { closet, update } = useCloset();
  const [filter, setFilter] = useState<ClosetFilter>(noFilter);
  const [panelOpen, setPanelOpen] = useState(false);
  const [selecting, setSelecting] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [added, setAdded] = useState<string[]>([]);
  const [result, setResult] = useState<SelectResult>(null);
  const [wornOpen, setWornOpen] = useState(false);

  useFocusEffect(
    useCallback(() => {
      setAdded(takeLastAdded());
      const pending = takePendingFilter();
      if (!pending) return;
      const { panelOpen: open, select, ...rest } = pending;
      setFilter({ ...noFilter, ...rest });
      setPanelOpen(Boolean(open));
      setSelecting(Boolean(select));
      setSelected([]);
      setResult(null);
      setWornOpen(false);
    }, []),
  );

  const context = useMemo(
    () => ({
      lastWorn: lastWorn(closet),
      today: clockFor(now()).localDate,
    }),
    [closet],
  );
  const visible = useMemo(
    () => filterPieces(closet.pieces, filter, context),
    [closet.pieces, filter, context],
  );
  const sections = useMemo(() => groupByCategory(visible), [visible]);
  const offered = useMemo(
    () =>
      categories
        .map(({ id }) => id)
        .filter((id) => closet.pieces.some((piece) => piece.category === id)),
    [closet.pieces],
  );
  const filtered =
    filter.search.trim() !== "" ||
    filter.category !== "all" ||
    panelFilterCount(filter) > 0;

  useEffect(() => {
    if (!filtered) return;
    const count = visible.length;
    const id = setTimeout(
      () =>
        announce(
          count === 1
            ? t("closet.resultsOne")
            : t("closet.resultsMany", { count }),
        ),
      motion.timer.wait,
    );
    return () => clearTimeout(id);
  }, [filter, filtered, visible.length]);

  const change = (next: Partial<ClosetFilter>) =>
    setFilter((current) => ({ ...current, ...next }));
  const clear = () => setFilter(noFilter);

  const startSelect = () => {
    setSelecting(true);
    setSelected([]);
    setResult(null);
    setWornOpen(false);
    setAdded([]);
  };
  const endSelect = () => {
    setSelecting(false);
    setSelected([]);
    setResult(null);
    setWornOpen(false);
  };
  const toggle = (id: string) => {
    setResult(null);
    setSelected((current) => {
      const next = current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id];
      if (!next.length) setWornOpen(false);
      return next;
    });
  };

  const pieceById = new Map(closet.pieces.map((piece) => [piece.id, piece]));
  const chosen = selected.flatMap((id) => {
    const piece = pieceById.get(id);
    return piece ? [piece] : [];
  });
  const owned = chosen.filter((piece) => piece.source === "owned");

  const run = (transform: Parameters<typeof update>[0], done: () => void) =>
    update(transform).then(done, (error: unknown) =>
      setResult({ error: errorText(error) }),
    );

  const markWorn = (day: "today" | "yesterday") => {
    const ids = owned.map((piece) => piece.id);
    const events = new Map(ids.map((id) => [id, randomUUID()]));
    const at = new Date(now());
    if (day === "yesterday") at.setDate(at.getDate() - 1);
    const restore = selected;
    setWornOpen(false);
    run(
      (current) =>
        woreLately(
          ensureToday(current, clockFor(now())),
          ids,
          at.toISOString(),
          (id) => events.get(id)!,
        ),
      () => {
        setSelected([]);
        setResult({
          text: t(day === "today" ? "outfit.worn" : "looks.wornYesterday"),
          undo: () =>
            run(
              (current) => [...events.values()].reduce(undoFeedback, current),
              () => {
                setResult(null);
                setSelected(restore);
              },
            ),
        });
      },
    );
  };

  const link = (ids: string[], after: () => void) =>
    run((current) => linkSet(current, ids, randomUUID()), after);

  const linkSelected = () =>
    link(
      owned.map((piece) => piece.id),
      () => {
        setSelected([]);
        setResult({ text: t("closet.linked") });
      },
    );

  const putAway = (archived: boolean) => {
    const ids = owned
      .filter((piece) => (piece.status === "archived") !== archived)
      .map((piece) => piece.id);
    const restore = selected;
    const apply = (value: boolean) => (current: typeof closet) =>
      ids.reduce((next, id) => setArchived(next, id, value), current);
    run(apply(archived), () => {
      setSelected([]);
      setResult({
        text: t(archived ? "result.putAway" : "result.backInCloset"),
        undo: () =>
          run(apply(!archived), () => {
            setResult(null);
            setSelected(restore);
          }),
      });
    });
  };

  const startWith = async (pieces: Piece[]) => {
    const ids = pieces
      .filter((piece) => piece.status !== "archived")
      .map((piece) => piece.id);
    endSelect();
    setAdded([]);
    await update((current) => {
      const ready = ensureToday(current, clockFor(now()));
      return ready.styling.today
        ? startOccasion(ready, builderRequest(ready, ids))
        : current;
    });
    router.navigate("/(tabs)/today");
  };

  return {
    closet,
    filter,
    change,
    clear,
    filtered,
    panelOpen,
    setPanelOpen,
    visible,
    sections,
    offered: offered as Category[],
    selecting,
    selected,
    chosen,
    owned,
    startSelect,
    endSelect,
    toggle,
    result,
    setResult,
    wornOpen,
    setWornOpen,
    markWorn,
    linkSelected,
    putAway,
    startWith,
    added,
    setAdded,
  };
}
