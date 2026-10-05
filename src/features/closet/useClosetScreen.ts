import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { router, useFocusEffect } from "expo-router";
import { randomUUID } from "expo-crypto";
import type { SearchBarCommands } from "react-native-screens";
import {
  categories,
  type Category,
  type Closet,
  type Piece,
} from "../../domain/closet";
import {
  filterPieces,
  groupByCategory,
  lastWorn,
  noFilter,
  panelFilterCount,
  type ClosetFilter,
} from "../../domain/closetFilters";
import type { WearSeason } from "../../domain/facts";
import { undoFeedback, woreLately } from "../../domain/feedback";
import { wearCounts } from "../../domain/scoring/taste";
import { linkSet } from "../../domain/sets";
import {
  inWash,
  intoWash,
  laundryDone,
  laundryLoad,
  setArchived,
  setCategory,
  setSeason,
} from "../../domain/wardrobe";
import { builderRequest } from "../../domain/builder";
import { clockFor, ensureToday, startOccasion } from "../../domain/today";
import { t } from "../../i18n";
import { canRemoveBackground, removeBackground } from "../../state/background";
import { useCloset } from "../../state/closet";
import { now } from "../../state/clock";
import { takePendingFilter } from "../../state/closetFilter";
import { takeLastAdded } from "../../state/launch";
import { announce } from "../../ui/announce";
import { motion } from "../../ui/motion";

export type SelectResult =
  { text: string; undo?: () => void } | { error: string } | null;

export type Expanded = "worn" | "change" | null;

const errorText = (error: unknown) =>
  error instanceof Error && error.message === t("error.setTooSmall")
    ? error.message
    : t("common.error.save");

export function useClosetScreen() {
  const { closet: whole, update, read } = useCloset();
  const closet = useMemo(
    () => ({
      ...whole,
      pieces: whole.pieces.filter(
        (piece) => piece.source === whole.styling.wardrobe,
      ),
    }),
    [whole],
  );
  const searchRef = useRef<SearchBarCommands | null>(null);
  const [raw, setFilter] = useState<ClosetFilter>(noFilter);
  const [panelOpen, setPanelOpen] = useState(false);
  const [selecting, setSelecting] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [added, setAdded] = useState<string[]>([]);
  const [result, setResult] = useState<SelectResult>(null);
  const [expanded, setExpanded] = useState<Expanded>(null);
  const [clearing, setClearing] = useState<string[]>([]);

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
      setExpanded(null);
    }, []),
  );

  const today = clockFor(now()).localDate;
  const context = useMemo(
    () => ({ lastWorn: lastWorn(closet), today }),
    [closet, today],
  );
  const worn = useMemo(() => wearCounts(closet.feedback), [closet.feedback]);
  const showingArchived = raw.availability === "archived";
  const shelved = useMemo(
    () =>
      closet.pieces.filter(
        (piece) => (piece.status === "archived") === showingArchived,
      ),
    [closet.pieces, showingArchived],
  );
  const offered = useMemo(
    () =>
      categories
        .map(({ id }) => id)
        .filter((id) => shelved.some((piece) => piece.category === id)),
    [shelved],
  );
  const filter = useMemo(
    () =>
      raw.category === "all" || offered.includes(raw.category)
        ? raw
        : { ...raw, category: "all" as const },
    [raw, offered],
  );
  const visible = useMemo(
    () => filterPieces(closet.pieces, filter, context),
    [closet.pieces, filter, context],
  );
  const sections = useMemo(
    () => groupByCategory(visible, filter.sort, worn),
    [visible, filter.sort, worn],
  );
  const allPutAway =
    closet.pieces.length > 0 &&
    closet.pieces.every((piece) => piece.status === "archived");
  const forgotten = useMemo(
    () =>
      filterPieces(
        closet.pieces.filter((piece) => piece.status !== "archived"),
        { ...noFilter, wear: "forgotten" },
        context,
      ).length,
    [closet.pieces, context],
  );
  const load = useMemo(() => laundryLoad(closet, today), [closet, today]);
  const washing = useMemo(() => inWash(closet), [closet]);
  const filtered =
    filter.search.trim() !== "" ||
    filter.category !== "all" ||
    panelFilterCount(filter) > 0 ||
    filter.wear === "forgotten" ||
    filter.sort !== null;

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
    setFilter({ ...filter, ...next });
  const clear = () => {
    searchRef.current?.clearText();
    setFilter(noFilter);
  };

  const startSelect = () => {
    setSelecting(true);
    setSelected([]);
    setResult(null);
    setExpanded(null);
    setAdded([]);
  };
  const endSelect = () => {
    setSelecting(false);
    setSelected([]);
    setResult(null);
    setExpanded(null);
  };
  const toggle = (id: string) => {
    setResult(null);
    setSelected((current) => {
      const next = current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id];
      if (!next.length) setExpanded(null);
      return next;
    });
  };

  const pieceById = new Map(closet.pieces.map((piece) => [piece.id, piece]));
  const chosen = selected.flatMap((id) => {
    const piece = pieceById.get(id);
    return piece ? [piece] : [];
  });
  const owned = chosen.filter((piece) => piece.source === "owned");
  const backed = owned.filter(canRemoveBackground);

  const run = (transform: (current: Closet) => Closet, done: () => void) =>
    update(transform).then(done, (error: unknown) =>
      setResult({ error: errorText(error) }),
    );

  const finish = (text: string, revert?: (current: Closet) => Closet) => {
    const restore = selected;
    setSelecting(false);
    setSelected([]);
    setExpanded(null);
    setResult({
      text,
      undo: revert
        ? () =>
            run(revert, () => {
              setResult(null);
              setSelecting(true);
              setSelected(restore);
            })
        : undefined,
    });
  };

  const markWorn = (day: "today" | "yesterday") => {
    const ids = owned.map((piece) => piece.id);
    const events = new Map(ids.map((id) => [id, randomUUID()]));
    const at = new Date(now());
    if (day === "yesterday") at.setDate(at.getDate() - 1);
    let changed = false;
    run(
      (current) => {
        const next = woreLately(current, ids, at.toISOString(), (id) =>
          events.get(id)!,
        );
        changed = next !== current;
        return next;
      },
      () =>
        changed
          ? finish(
              t(day === "today" ? "outfit.worn" : "looks.wornYesterday"),
              (current) => [...events.values()].reduce(undoFeedback, current),
            )
          : finish(t("closet.wornAlready")),
    );
  };

  const linkSelected = () =>
    run(
      (current) =>
        linkSet(
          current,
          owned.map((piece) => piece.id),
          randomUUID(),
        ),
      () => finish(t("closet.linked")),
    );

  const putAway = (archived: boolean) => {
    const ids = owned
      .filter((piece) => (piece.status === "archived") !== archived)
      .map((piece) => piece.id);
    const apply = (value: boolean) => (current: Closet) =>
      ids.reduce((next, id) => setArchived(next, id, value), current);
    run(apply(archived), () =>
      finish(
        t(archived ? "result.putAway" : "result.backInCloset"),
        apply(!archived),
      ),
    );
  };

  const changeAll = (next: { season: WearSeason } | { category: Category }) => {
    const ids = owned.map((piece) => piece.id);
    const before = new Map(owned.map((piece) => [piece.id, piece]));
    run(
      (current) =>
        "season" in next
          ? setSeason(current, ids, next.season)
          : setCategory(current, ids, next.category),
      () =>
        finish(t("closet.changed"), (current) => ({
          ...current,
          pieces: current.pieces.map((piece) => before.get(piece.id) ?? piece),
        })),
    );
  };

  const clearBackgrounds = async () => {
    const pieces = backed;
    setSelecting(false);
    setSelected([]);
    setExpanded(null);
    setResult(null);
    setClearing(pieces.map((piece) => piece.id));
    let failed = false;
    for (const piece of pieces) {
      const done = await removeBackground(update, read, piece);
      if (!done) failed = true;
      setClearing((current) => current.filter((id) => id !== piece.id));
    }
    const text = t(failed ? "background.failed" : "background.removed");
    announce(text);
    setResult({ text });
  };

  const laundry = (done: boolean) => {
    const ids = (done ? washing : load).map((piece) => piece.id);
    run(
      (current) =>
        done
          ? laundryDone(current, ids, new Date(now()).toISOString())
          : intoWash(current, ids),
      () =>
        setResult({
          text: t(done ? "result.backInCloset" : "piece.away.wash"),
          undo: () =>
            run(
              (current) =>
                done ? intoWash(current, ids) : laundryDone(current, ids),
              () => setResult(null),
            ),
        }),
    );
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
    searchRef,
    filter,
    change,
    clear,
    filtered,
    panelOpen,
    setPanelOpen,
    visible,
    sections,
    offered: offered as Category[],
    allPutAway,
    forgotten,
    load,
    washing,
    laundry,
    selecting,
    selected,
    chosen,
    owned,
    backed,
    clearing,
    clearBackgrounds,
    startSelect,
    endSelect,
    toggle,
    result,
    setResult,
    expanded,
    setExpanded,
    markWorn,
    linkSelected,
    putAway,
    changeAll,
    startWith,
    added,
    setAdded,
  };
}
