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
  likedNow,
  likeOutfit,
  recordSaved,
  swapPiece,
  undoFeedback,
  woreThis,
  wornNow,
} from "../../domain/feedback";
import { saveLook as storeLook } from "../../domain/closet";
import { lookForPieces, plannedToday } from "../../domain/looks";
import { outfitName } from "../../domain/outfitName";
import type { Occasion } from "../../domain/taxonomy";
import { coverageNote } from "../../domain/outfitView";
import { rulesScorer } from "../../domain/scoring/rulesScorer";
import { scoreContext } from "../../domain/scoring/taste";
import { evaluateOutfit } from "../../domain/styling";
import {
  activeSession,
  applyRequest,
  backToEveryday,
  backToToday,
  clockFor,
  ensureToday,
  nextLocalDate,
  prepareTomorrow,
  resultFor,
  saveForecast,
  showLook,
  startOccasion,
  startOver,
  tryAnother,
} from "../../domain/today";
import { forecastFor, forecastWeather } from "../../domain/weather";
import { locale, t } from "../../i18n";
import { useCloset } from "../../state/closet";
import { now } from "../../state/clock";
import { fetchForecast } from "../../state/forecast";
import { onLaunchIntent, takeLaunchIntent } from "../../state/launch";
import { announce } from "../../ui/announce";

export type Mode = "everyday" | "occasion" | "planning" | "tomorrow";

export const intents = ["everyday", "work", "gym", "party"] as const;

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
  const [hour, setHour] = useState(() => now().getHours());
  const [foregrounded, setForegrounded] = useState(0);
  const [forecastFailed, setForecastFailed] = useState(false);
  const [forecastDone, setForecastDone] = useState<string | null>(null);
  const announcing = useRef(false);
  const shownPlan = useRef<string | null>(null);
  const handledStale = useRef<string | null>(null);

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
  const broken = review.filter((problem) => problem.severity !== "review");

  const name = request ? outfitName(pieces, request.occasion, locale) : "";
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
  const coverageLine =
    showOutfit && request
      ? coverageNote(pieces, request.coverage, locale)
      : null;
  const note = session?.shown ? broken[0]?.message : undefined;
  const reasonLine = [note ?? reasons[0], coverageLine]
    .filter(Boolean)
    .join(" ");

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

  const takeIntent = useCallback(() => {
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
  }, [closet.styling.place, closet.styling.everyday, update]);
  useFocusEffect(takeIntent);
  useEffect(() => onLaunchIntent(takeIntent), [takeIntent]);

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

  const intent = (occasion: Occasion) => {
    if (!request) return;
    const anchored = request.keptIds.length > 0 || !!request.garmentType;
    if (occasion === request.occasion && !anchored) return void another();
    const everyday = closet.styling.everyday?.occasion ?? "everyday";
    void restyle((current) =>
      occasion === everyday
        ? backToEveryday(current)
        : startOccasion(current, {
            ...request,
            occasion,
            keptIds: [],
            garmentType: null,
          }),
    );
  };

  const liked = likedNow(closet);
  const like = () =>
    void run((current) =>
      liked
        ? undoFeedback(current, liked.id)
        : likeOutfit(current, at(), randomUUID()),
    );

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

  const pick = (from: Piece, to: Piece) =>
    void run((current) =>
      swapPiece(current, from.id, to.id, revision, at(), randomUUID()),
    ).then((saved) => {
      if (saved) announce(t("result.changed"), { queue: true });
    });

  const change = (next: Partial<OutfitRequest>) =>
    request
      ? restyle((current) =>
          applyRequest(current, { ...request, ...next }, revision),
        )
      : Promise.resolve(false);

  const leaveTomorrow = () => void restyle(backToToday);

  const planned =
    mode === "everyday" && !worn
      ? (plannedToday(closet, clock).find((look) =>
          look.pieceIds.every((id) =>
            closet.pieces.some(
              (piece) => piece.id === id && isAvailable(piece),
            ),
          ),
        ) ?? null)
      : null;
  const plannedKey =
    planned &&
    [...planned.pieceIds].sort().join() !==
      [...(session?.pieceIds ?? [])].sort().join()
      ? `${clock.localDate}:${planned.id}`
      : null;
  const stale =
    !!today &&
    !!session &&
    (lostPieces > 0 || (broken.length > 0 && !session.shown));
  const staleKey = stale ? `${today.active}:${revision}` : null;
  useEffect(() => {
    if (!plannedKey || !planned || busy || shownPlan.current === plannedKey)
      return;
    shownPlan.current = plannedKey;
    void restyle((current) => showLook(current, planned));
  }, [plannedKey, planned, busy, restyle]);
  useEffect(() => {
    if (!staleKey || plannedKey || busy || handledStale.current === staleKey)
      return;
    handledStale.current = staleKey;
    void restyle(startOver);
  }, [staleKey, plannedKey, busy, restyle]);

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
    openId,
    setOpenId,
    last,
    only,
    another,
    intent,
    liked: !!liked,
    like,
    savedLook,
    saveLook,
    worn,
    wear,
    unwear,
    pick,
    change,
    leaveTomorrow,
    scorer,
    context,
  };
}

export type TodayModel = ReturnType<typeof useToday>;
