import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { randomUUID } from "expo-crypto";
import {
  isAvailable,
  type Closet,
  type OutfitRequest,
  type Piece,
  type Slot,
} from "../../domain/closet";
import { addFit, fitsOn, updateFit } from "../../domain/day";
import {
  recordSaved,
  removeFromOutfit,
  swapPiece,
  woreThis,
} from "../../domain/feedback";
import { answerRule, ruleToAsk } from "../../domain/personalRules";
import { saveLook as storeLook } from "../../domain/closet";
import { lookForPieces } from "../../domain/looks";
import { outfitName } from "../../domain/outfitName";
import { rulesScorer } from "../../domain/scoring/rulesScorer";
import { scoreContext } from "../../domain/scoring/taste";
import { evaluateOutfit } from "../../domain/styling";
import {
  activeSession,
  applyLook,
  applyRequest,
  resultFor,
  startOver,
  tryAnother,
} from "../../domain/today";
import { weatherTip } from "../../domain/weatherTip";
import { locale, t } from "../../i18n";
import { useCloset } from "../../state/closet";
import { now } from "../../state/clock";
import { announce } from "../../ui/announce";

const at = () => now().toISOString();

export function useToday() {
  const { closet, update } = useCloset();
  const [busy, setBusy] = useState(false);
  const [styling, setStyling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [failed, setFailed] = useState<{
    transform: (closet: Closet) => Closet;
    options: { restyle?: boolean };
  } | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const announcing = useRef(false);
  const handledStale = useRef<string | null>(null);

  const today = closet.styling.today;
  const session = today ? activeSession(today) : null;
  const request = session?.request ?? null;
  const revision = session?.revision ?? 0;
  const date = session?.date ?? today?.localDate ?? "";
  const planning = !!session?.date && session.date !== today?.localDate;

  const result = useMemo(
    () =>
      today && session
        ? resultFor(closet, session.request, session.date ?? today.localDate)
        : null,
    [closet, today, session],
  );

  const pieces = useMemo(
    () =>
      session
        ? session.pieceIds.flatMap((id) => {
            const piece = closet.pieces.find((item) => item.id === id);
            return piece && isAvailable(piece) ? [piece] : [];
          })
        : [],
    [closet.pieces, session],
  );
  const lostPieces = session ? session.pieceIds.length - pieces.length : 0;

  const pool = useMemo(
    () =>
      request
        ? closet.pieces.filter(
            (piece) => piece.source === request.wardrobe && isAvailable(piece),
          )
        : [],
    [closet.pieces, request],
  );

  const showOutfit =
    !!result &&
    lostPieces === 0 &&
    pieces.length > 0 &&
    result.status !== "conflict" &&
    result.status !== "missing";
  const review = useMemo(
    () => (showOutfit && request ? evaluateOutfit(pieces, request, pool) : []),
    [showOutfit, pieces, request, pool],
  );
  const tip = showOutfit && request ? weatherTip(pieces, request, pool) : null;
  const broken = review.filter((problem) => problem.severity !== "review");

  const savedLook = session ? lookForPieces(closet, session.pieceIds) : null;
  const name = request
    ? (savedLook?.name ?? outfitName(pieces, request.occasion, locale))
    : "";
  const scorer = rulesScorer;
  const context = useMemo(() => scoreContext(closet), [closet]);
  const score = useCallback(
    (outfit: Piece[]) =>
      request
        ? scorer.score(outfit, request, context)
        : { score: 0, reasons: [] },
    [scorer, request, context],
  );
  const reasons = showOutfit ? score(pieces).reasons : [];
  const note = session?.shown ? broken[0]?.message : undefined;
  const reasonLine = note ?? reasons[0] ?? "";

  const run = useCallback(
    async (
      transform: (closet: Closet) => Closet,
      options: { restyle?: boolean } = {},
    ) => {
      setBusy(true);
      setError(null);
      if (options.restyle) setStyling(true);
      try {
        await update(transform);
        setFailed(null);
        return true;
      } catch {
        if (options.restyle) setFailed({ transform, options });
        else setError(t("common.error.save"));
        return false;
      } finally {
        setBusy(false);
        setStyling(false);
      }
    },
    [update],
  );

  const restyle = useCallback(
    async (transform: (closet: Closet) => Closet) => {
      announcing.current = true;
      setOpenId(null);
      const saved = await run(transform, { restyle: true });
      if (!saved) announcing.current = false;
      return saved;
    },
    [run],
  );

  const pieceKey = session?.pieceIds.join(",");
  useEffect(() => {
    if (!announcing.current || !pieceKey) return;
    announcing.current = false;
    announce(t("today.announce.outfit", { name }), { queue: true });
  }, [pieceKey, name]);

  const stylingFailed = failed
    ? () => void run(failed.transform, failed.options)
    : null;

  const last =
    !!result &&
    result.outfits.length > 1 &&
    !!session &&
    session.cursor >= result.outfits.length - 1;
  const only = !!result && result.outfits.length <= 1;

  const another = () =>
    restyle((current) =>
      last ? startOver(current) : tryAnother(current, revision),
    );

  const saveLook = async () => {
    if (!session || !request) return null;
    const id = randomUUID();
    const ids = session.pieceIds;
    const saved = await run((current) =>
      recordSaved(
        storeLook(current, {
          id,
          name,
          pieceIds: ids,
          createdAt: at(),
          occasion: request.occasion,
          ...(planning ? { plannedFor: date } : {}),
        }),
        ids,
        at(),
        randomUUID(),
      ),
    );
    if (saved) announce(t("result.saved"), { queue: true });
    return saved ? id : null;
  };

  const keep = (slot: Slot, celsius: number | null, fitId?: string) => {
    if (!session || !request) return Promise.resolve(false);
    const ids = session.pieceIds;
    const wearId = randomUUID();
    return run((current) => {
      const wornAt = at();
      const wearing = planning
        ? current
        : woreThis(current, revision, wornAt, wearId);
      const marks = wearing !== current ? { wornAt, wearId } : {};
      const existing = fitId
        ? fitsOn(current, date).find((fit) => fit.id === fitId)
        : undefined;
      return existing
        ? updateFit(wearing, date, existing.id, { pieceIds: ids, ...marks })
        : addFit(wearing, {
            id: randomUUID(),
            date,
            pieceIds: ids,
            occasion: request.occasion,
            slot,
            celsius,
            createdAt: wornAt,
            ...marks,
          });
    });
  };

  const pick = (from: Piece, to: Piece) =>
    void run((current) =>
      swapPiece(current, from.id, to.id, revision, at(), randomUUID()),
    ).then((saved) => {
      if (saved) announce(t("result.changed"), { queue: true });
    });

  const remove = (piece: Piece) => {
    setOpenId(null);
    void run((current) =>
      removeFromOutfit(current, piece.id, revision, at(), randomUUID()),
    ).then((saved) => {
      if (saved) announce(t("result.removed"), { queue: true });
    });
  };

  const ruleAsk = useMemo(() => ruleToAsk(closet), [closet]);
  const answerAsk = (accept: boolean) => {
    if (ruleAsk) void run((current) => answerRule(current, ruleAsk, accept));
  };

  const change = (next: Partial<OutfitRequest>) =>
    request
      ? restyle((current) =>
          applyRequest(current, { ...request, ...next }, revision),
        )
      : Promise.resolve(false);

  const addPiece = (piece: Piece) =>
    void restyle((current) =>
      applyLook(current, [...(session?.pieceIds ?? []), piece.id], revision),
    );

  const stale =
    !!today &&
    !!session &&
    (lostPieces > 0 || (broken.length > 0 && !session.shown));
  const staleKey = stale ? `${today.active}:${revision}` : null;
  useEffect(() => {
    if (!staleKey || busy || handledStale.current === staleKey) return;
    handledStale.current = staleKey;
    void restyle(startOver);
  }, [staleKey, busy, restyle]);

  return {
    closet,
    today,
    session,
    request,
    revision,
    date,
    planning,
    result,
    pieces,
    lostPieces,
    showOutfit,
    broken,
    tip,
    addPiece,
    name,
    reasonLine,
    score,
    busy,
    styling,
    error,
    setError,
    stylingFailed,
    run,
    restyle,
    openId,
    setOpenId,
    last,
    only,
    another,
    savedLook,
    saveLook,
    keep,
    pick,
    remove,
    ruleAsk,
    answerAsk,
    change,
    scorer,
    context,
  };
}

export type TodayModel = ReturnType<typeof useToday>;
