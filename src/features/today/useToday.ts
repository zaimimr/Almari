import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AppState } from "react-native";
import { useFocusEffect } from "expo-router";
import { randomUUID } from "expo-crypto";
import {
  isAvailable,
  type Closet,
  type OutfitRequest,
  type Piece,
  type Weather,
} from "../../domain/closet";
import {
  dislikeOutfit,
  giveFeedback,
  likedNow,
  likeOutfit,
  recordSaved,
  swapPiece,
  undoFeedback,
  woreThis,
  wornNow,
  type Chip,
} from "../../domain/feedback";
import { saveLook as storeLook } from "../../domain/closet";
import { lookForPieces, plannedToday } from "../../domain/looks";
import { outfitName } from "../../domain/outfitName";
import { coverageNote } from "../../domain/outfitView";
import { scorerFor } from "../../domain/scoring/engine";
import { scoreContext } from "../../domain/scoring/taste";
import { evaluateOutfit } from "../../domain/styling";
import {
  activeSession,
  applyLook,
  applyRequest,
  backToToday,
  clockFor,
  ensureToday,
  nextLocalDate,
  prepareTomorrow,
  resultFor,
  saveForecast,
  startOver,
  tryAnother,
  undoChange,
  unsavedPlan,
} from "../../domain/today";
import { forecastFor, forecastWeather } from "../../domain/weather";
import { rediscover } from "../../domain/wardrobe";
import { locale, t } from "../../i18n";
import { useCloset } from "../../state/closet";
import { now } from "../../state/clock";
import { fetchForecast } from "../../state/forecast";
import { takeLaunchIntent } from "../../state/launch";
import { announce } from "../../ui/announce";

export type Mode = "everyday" | "occasion" | "planning" | "tomorrow";

export type Slot =
  | { kind: "undo"; revision: number; another: boolean }
  | { kind: "thanks"; revision: number; eventId: string; restore: boolean };

export type Open =
  | { kind: "reasons" }
  | { kind: "slotReasons" }
  | { kind: "check" }
  | { kind: "strip"; pieceId: string };

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
  const [slot, setSlot] = useState<Slot | null>(null);
  const [open, setOpen] = useState<Open | null>(null);
  const [pendingHijab, setPendingHijab] = useState<string | null>(null);
  const [leftTomorrow, setLeftTomorrow] = useState(false);
  const [hour, setHour] = useState(() => now().getHours());
  const [foregrounded, setForegrounded] = useState(0);
  const [forecastFailed, setForecastFailed] = useState(false);
  const [forecastDone, setForecastDone] = useState<string | null>(null);
  const announcing = useRef(false);

  const today = closet.styling.today;
  const session = today ? activeSession(today) : null;
  const request = session?.request ?? null;
  const revision = session?.revision ?? 0;
  const clock = clockFor(now());

  const mode: Mode = !today
    ? "everyday"
    : today.active === "tomorrow" && today.tomorrow
      ? "tomorrow"
      : today.active === "occasion" && today.occasion
        ? today.occasion.date
          ? "planning"
          : "occasion"
        : "everyday";

  const result = useMemo(
    () =>
      today && session
        ? resultFor(
            closet,
            session.request,
            session.date ?? today.localDate,
            session.engine ?? "rules",
          )
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
  const checks = review.filter((problem) => problem.severity === "review");
  const broken = review.filter((problem) => problem.severity !== "review");

  const name = request ? outfitName(pieces, request.occasion, locale) : "";
  const scorer = scorerFor(session?.engine ?? "rules");
  const context = useMemo(() => scoreContext(closet), [closet]);
  const score = useCallback(
    (outfit: Piece[]) =>
      request
        ? scorer.score(outfit, request, context)
        : { score: 0, reasons: [] },
    [scorer, request, context],
  );
  const reasons = showOutfit ? score(pieces).reasons : [];
  const coverageLine =
    showOutfit && request
      ? coverageNote(pieces, request.coverage, locale)
      : null;
  const reasonLine = [reasons[0], coverageLine].filter(Boolean).join(" ");

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
    async (transform: (closet: Closet) => Closet, next: Slot | null) => {
      announcing.current = true;
      setOpen(null);
      const saved = await run(transform, { restyle: true });
      if (saved) setSlot(next);
      else announcing.current = false;
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

  useFocusEffect(
    useCallback(() => {
      setHour(now().getHours());
      const intent = takeLaunchIntent();
      if (intent?.day !== "tomorrow") return;
      const date = nextLocalDate(clockFor(now()).localDate);
      const place = closet.styling.place;
      const weatherFor = async (): Promise<Weather> => {
        if (!place) return { source: "unknown" };
        try {
          const found = await fetchForecast(place.latitude, place.longitude);
          const forecast = found
            ? forecastFor(found, date, at(), clockFor(now()).timeZone)
            : null;
          return forecast
            ? {
                ...forecast.weather,
                exposure: closet.styling.everyday?.exposure ?? null,
              }
            : { source: "unknown" };
        } catch {
          return { source: "unknown" };
        }
      };
      void weatherFor().then((weather) =>
        update((current) =>
          prepareTomorrow(current, clockFor(now()), weather),
        ).catch(() => undefined),
      );
    }, [closet.styling.place, closet.styling.everyday, update]),
  );

  useEffect(() => {
    const refresh = () => {
      void update((current) => ensureToday(current, clockFor(now()))).catch(
        () => undefined,
      );
    };
    refresh();
    const subscription = AppState.addEventListener("change", (state) => {
      if (state !== "active") return;
      refresh();
      setHour(now().getHours());
      setForegrounded((count) => count + 1);
    });
    return () => subscription.remove();
  }, [update]);

  const place = closet.styling.place;
  const stored = closet.styling.forecast;
  const localDate = today?.localDate;
  const needsForecast =
    !!place && !forecastWeather(stored, clock.localDate, clock.timeZone);
  const forecastKey = `${localDate}:${foregrounded}:${place?.latitude}:${place?.longitude}`;
  useEffect(() => {
    if (!place || !needsForecast) return;
    const day = clockFor(now());
    let active = true;
    fetchForecast(place.latitude, place.longitude)
      .then((found) => {
        const fresh = found
          ? forecastFor(found, day.localDate, at(), day.timeZone)
          : null;
        if (!active) return;
        setForecastFailed(!fresh);
        setForecastDone(forecastKey);
        if (fresh) return update((current) => saveForecast(current, fresh));
      })
      .catch(() => {
        if (!active) return;
        setForecastFailed(true);
        setForecastDone(forecastKey);
      });
    return () => {
      active = false;
    };
  }, [place, needsForecast, forecastKey, update]);
  const forecastLoading = needsForecast && forecastDone !== forecastKey;

  const stylingFailed = failed
    ? () => void run(failed.transform, failed.options)
    : null;

  const visibleSlot = slot && slot.revision === revision ? slot : null;
  const last =
    !!result &&
    result.outfits.length > 1 &&
    !!session &&
    session.cursor >= result.outfits.length - 1;
  const only = !!result && result.outfits.length <= 1;

  const another = () =>
    restyle(
      (current) => (last ? startOver(current) : tryAnother(current, revision)),
      last ? null : { kind: "undo", revision: revision + 1, another: true },
    );

  const liked = likedNow(closet);
  const like = () => {
    setOpen((current) => (current?.kind === "reasons" ? null : current));
    void run((current) =>
      liked
        ? undoFeedback(current, liked.id)
        : likeOutfit(current, at(), randomUUID()),
    ).then((saved) => {
      if (saved && !liked) announce(t("outfit.thanks"), { queue: true });
    });
  };

  const feedback = (chip: Chip) => {
    const id = randomUUID();
    if (chip === "hijab-mismatch") {
      const hijab = pieces.find((piece) => piece.category === "hijab");
      void run((current) =>
        giveFeedback(current, chip, revision, at(), id),
      ).then((saved) => {
        if (!saved) return;
        setPendingHijab(id);
        setOpen(hijab ? { kind: "strip", pieceId: hijab.id } : null);
      });
      return;
    }
    void restyle(
      (current) => {
        const liked = likedNow(current);
        const cleared = liked ? undoFeedback(current, liked.id) : current;
        return giveFeedback(cleared, chip, revision, at(), id);
      },
      { kind: "thanks", revision: revision + 1, eventId: id, restore: true },
    );
  };

  const skippedFeedback = (_chip: Chip) => {
    const previous = session?.previousPieceIds;
    if (!previous) return;
    const id = randomUUID();
    setOpen(null);
    void run((current) => dislikeOutfit(current, previous, at(), id)).then(
      (saved) => {
        if (saved)
          setSlot({ kind: "thanks", revision, eventId: id, restore: false });
      },
    );
  };

  const undo = () => {
    const current = visibleSlot;
    setSlot(null);
    setOpen(null);
    if (current?.kind === "thanks") {
      void run((closetNow) => {
        const withdrawn = undoFeedback(closetNow, current.eventId);
        return current.restore ? undoChange(withdrawn) : withdrawn;
      });
      return;
    }
    void run(undoChange);
  };

  const savedLook = session ? lookForPieces(closet, session.pieceIds) : null;
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
          ...(session.date ? { plannedFor: session.date } : {}),
        }),
        ids,
        at(),
        randomUUID(),
      ),
    );
    if (saved) announce(t("result.saved"), { queue: true });
    return saved ? id : null;
  };

  const worn = wornNow(closet);
  const wear = () =>
    run((current) => woreThis(current, revision, at(), randomUUID()));
  const unwear = () => {
    if (worn) void run((current) => undoFeedback(current, worn.id));
  };

  const pick = (from: Piece, to: Piece) => {
    const pending = pendingHijab;
    setPendingHijab(null);
    void run((current) =>
      swapPiece(current, from.id, to.id, revision, at(), randomUUID()),
    ).then((saved) => {
      if (!saved) return;
      announce(t("result.changed"), { queue: true });
      setSlot(
        pending
          ? {
              kind: "thanks",
              revision: revision + 1,
              eventId: pending,
              restore: true,
            }
          : { kind: "undo", revision: revision + 1, another: false },
      );
    });
  };

  const showLook = (ids: string[]) =>
    restyle((current) => applyLook(current, ids, revision), {
      kind: "undo",
      revision: revision + 1,
      another: false,
    });

  const change = (next: Partial<OutfitRequest>) =>
    request
      ? restyle(
          (current) => applyRequest(current, { ...request, ...next }, revision),
          null,
        )
      : Promise.resolve(false);

  const leaveTomorrow = () => {
    setLeftTomorrow(true);
    void restyle(backToToday, null);
  };

  const showTomorrow = () => {
    setLeftTomorrow(false);
    void restyle((current) => {
      const day = clockFor(now());
      return prepareTomorrow(current, day, { source: "unknown" });
    }, null);
  };

  const tomorrowWaiting =
    mode === "everyday" &&
    leftTomorrow &&
    !!today?.tomorrow &&
    today.tomorrow.date === nextLocalDate(today.localDate);

  const planned =
    mode === "everyday"
      ? (plannedToday(closet, clock).find(
          (look) =>
            [...look.pieceIds].sort().join() !==
            [...(session?.pieceIds ?? [])].sort().join(),
        ) ?? null)
      : null;
  const unsaved = mode === "everyday" ? unsavedPlan(closet) : null;

  const rediscoverPieces =
    mode === "tomorrow" ? [] : rediscover(closet, clock, 6);

  return {
    closet,
    today,
    session,
    request,
    revision,
    result,
    pieces,
    lostPieces,
    showOutfit,
    checks,
    broken,
    name,
    reasonLine,
    coverageLine,
    score,
    mode,
    hour,
    busy,
    styling,
    error,
    setError,
    stylingFailed,
    forecastFailed,
    forecastLoading,
    run,
    restyle,
    slot: visibleSlot,
    open,
    setOpen,
    last,
    only,
    another,
    liked: !!liked,
    like,
    feedback,
    skippedFeedback,
    undo,
    savedLook,
    saveLook,
    worn,
    wear,
    unwear,
    pick,
    showLook,
    change,
    leaveTomorrow,
    showTomorrow,
    tomorrowWaiting,
    planned,
    unsaved,
    rediscoverPieces,
    scorer,
    context,
  };
}

export type TodayModel = ReturnType<typeof useToday>;
