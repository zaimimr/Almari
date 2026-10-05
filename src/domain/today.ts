import {
  coverageNeedFor,
  type Closet,
  type Coverage,
  type EverydayStyle,
  type Forecast,
  type ForecastWeather,
  type Occasion,
  type OutfitRequest,
  type Session,
  type TodayState,
  type WardrobeMode,
  type Weather,
} from "./closet";
import { rulesScorer } from "./scoring/rulesScorer";
import { scoreContext } from "./scoring/taste";
import { styleOutfits, type StyleResult } from "./styling";
import { weatherFor } from "./weather";

export type Clock = { localDate: string; timeZone: string };

export function clockFor(now: Date, timeZone?: string): Clock {
  const zone = timeZone ?? Intl.DateTimeFormat().resolvedOptions().timeZone;
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: zone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const part = (type: string) =>
    parts.find((item) => item.type === type)?.value ?? "";
  return {
    localDate: `${part("year")}-${part("month")}-${part("day")}`,
    timeZone: zone,
  };
}

export function everydayRequest(
  preset: EverydayStyle,
  wardrobe: WardrobeMode,
  level: Coverage | null,
  weather: Weather,
): OutfitRequest {
  return {
    occasion: preset.occasion,
    style: preset.style,
    garmentType: null,
    keptIds: [],
    excludedIds: [],
    weather:
      weather.source === "forecast"
        ? { ...weather, exposure: preset.exposure ?? null }
        : weather,
    hijab: preset.hijab,
    wardrobe,
    ...(coverageNeedFor(level, preset.coverage)
      ? { coverage: coverageNeedFor(level, preset.coverage) }
      : {}),
  };
}

function coverageLevel(closet: Closet) {
  return closet.styling.profile?.coverageLevel ?? null;
}

function seedFor(localDate: string, request: OutfitRequest) {
  return `${localDate}:${request.wardrobe}`;
}

export function resultFor(
  closet: Closet,
  request: OutfitRequest,
  localDate: string,
): StyleResult {
  return styleOutfits(
    closet.pieces,
    request,
    seedFor(localDate, request),
    rulesScorer,
    scoreContext(closet),
  );
}

function sessionFor(
  closet: Closet,
  request: OutfitRequest,
  localDate: string,
  revision: number,
): Session {
  const result = resultFor(closet, request, localDate);
  return {
    revision,
    request,
    cursor: 0,
    pieceIds: result.outfits[0]?.ids ?? [],
    previousPieceIds: null,
  };
}

export function activeSession(today: TodayState): Session {
  if (today.active === "tomorrow" && today.tomorrow) return today.tomorrow;
  return today.active === "occasion" && today.occasion
    ? today.occasion
    : today.everyday;
}

const dayOf = (session: Session, today: TodayState) =>
  session.date ?? today.localDate;

function restyle(
  closet: Closet,
  session: Session,
  today: TodayState,
  request: OutfitRequest = session.request,
): Session {
  const next = sessionFor(
    closet,
    request,
    dayOf(session, today),
    session.revision + 1,
  );
  return session.date ? { ...next, date: session.date } : next;
}

function undated({ date: _date, ...session }: Session): Session {
  return session;
}

export function nextLocalDate(localDate: string): string {
  const next = new Date(`${localDate}T00:00:00Z`);
  next.setUTCDate(next.getUTCDate() + 1);
  return next.toISOString().slice(0, 10);
}

function withToday(closet: Closet, today: TodayState): Closet {
  return { ...closet, styling: { ...closet.styling, today } };
}

function withActive(
  closet: Closet,
  change: (session: Session, today: TodayState) => Session,
): Closet {
  const today = closet.styling.today;
  if (!today) return closet;
  const session = activeSession(today);
  const next = change(session, today);
  if (next === session) return closet;
  return withToday(
    closet,
    today.active === "tomorrow"
      ? { ...today, tomorrow: next }
      : today.active === "occasion"
        ? { ...today, occasion: next }
        : { ...today, everyday: next },
  );
}

export function ensureToday(closet: Closet, clock: Clock): Closet {
  const preset = closet.styling.everyday;
  if (!preset) return closet;
  const current = closet.styling.today;
  if (current?.localDate === clock.localDate) return closet;
  const everyday =
    current?.tomorrow?.date === clock.localDate
      ? undated(current.tomorrow)
      : sessionFor(
          closet,
          everydayRequest(
            preset,
            closet.styling.wardrobe,
            coverageLevel(closet),
            weatherFor(closet, clock.localDate, clock.timeZone),
          ),
          clock.localDate,
          (current?.everyday.revision ?? 0) + 1,
        );
  const plan = current?.occasion;
  return withToday(closet, {
    localDate: clock.localDate,
    timeZone: clock.timeZone,
    presetVersion: preset.version,
    everyday,
    occasion: plan?.date && plan.date >= clock.localDate ? plan : null,
    active: "everyday",
  });
}

export function saveEverydayStyle(
  closet: Closet,
  preset: Omit<EverydayStyle, "version">,
  clock: Clock,
  restyleToday: boolean,
): Closet {
  const version = (closet.styling.everyday?.version ?? 0) + 1;
  const saved: Closet = {
    ...closet,
    styling: { ...closet.styling, everyday: { ...preset, version } },
  };
  const today = saved.styling.today;
  if (!today || today.localDate !== clock.localDate)
    return ensureToday(
      { ...saved, styling: { ...saved.styling, today: null } },
      clock,
    );
  if (!restyleToday) return saved;
  return withToday(saved, {
    ...today,
    presetVersion: version,
    everyday: sessionFor(
      saved,
      everydayRequest(
        saved.styling.everyday!,
        saved.styling.wardrobe,
        coverageLevel(saved),
        weatherFor(saved, today.localDate, today.timeZone),
      ),
      today.localDate,
      today.everyday.revision + 1,
    ),
  });
}

export function applyRequest(
  closet: Closet,
  request: OutfitRequest,
  expectedRevision: number,
): Closet {
  return withActive(closet, (session, today) =>
    session.revision !== expectedRevision
      ? session
      : restyle(closet, session, today, request),
  );
}

function withOccasion(
  closet: Closet,
  request: OutfitRequest,
  date?: string,
): Closet {
  const today = closet.styling.today;
  if (!today) return closet;
  const session = sessionFor(
    closet,
    request,
    date ?? today.localDate,
    (today.occasion?.revision ?? 0) + 1,
  );
  return withToday(closet, {
    ...today,
    active: "occasion",
    occasion: date ? { ...session, date } : session,
  });
}

export function startOccasion(closet: Closet, request: OutfitRequest): Closet {
  return withOccasion(closet, request);
}

export function startPlan(
  closet: Closet,
  request: OutfitRequest,
  date: string,
): Closet {
  return withOccasion(closet, request, date);
}

export function unsavedPlan(closet: Closet): Session | null {
  const today = closet.styling.today;
  const plan = today?.occasion;
  if (!today || !plan?.date || today.active === "occasion") return null;
  if (plan.date < today.localDate) return null;
  const key = [...plan.pieceIds].sort().join(",");
  return closet.looks.some(
    (look) => [...look.pieceIds].sort().join(",") === key,
  )
    ? null
    : plan;
}

export function resumePlan(closet: Closet): Closet {
  const today = closet.styling.today;
  if (!today?.occasion) return closet;
  return withToday(closet, { ...today, active: "occasion" });
}

export function discardPlan(closet: Closet): Closet {
  const today = closet.styling.today;
  if (!today?.occasion) return closet;
  return withToday(closet, {
    ...today,
    occasion: null,
    active: today.active === "occasion" ? "everyday" : today.active,
  });
}

export function prepareTomorrow(
  closet: Closet,
  clock: Clock,
  forecast: Weather,
): Closet {
  const ready = ensureToday(closet, clock);
  const preset = ready.styling.everyday;
  const today = ready.styling.today;
  if (!preset || !today) return closet;
  const date = nextLocalDate(clock.localDate);
  if (today.tomorrow?.date === date)
    return withToday(ready, { ...today, active: "tomorrow" });
  const session = sessionFor(
    ready,
    everydayRequest(
      preset,
      ready.styling.wardrobe,
      coverageLevel(ready),
      forecast,
    ),
    date,
    1,
  );
  return withToday(ready, {
    ...today,
    tomorrow: { ...session, date },
    active: "tomorrow",
  });
}

export function backToToday(closet: Closet): Closet {
  const today = closet.styling.today;
  if (!today) return closet;
  return withToday(closet, { ...today, active: "everyday" });
}

export function backToEveryday(closet: Closet): Closet {
  const today = closet.styling.today;
  if (!today) return closet;
  return withToday(closet, { ...today, active: "everyday", occasion: null });
}

export function tryAnother(closet: Closet, expectedRevision: number): Closet {
  return withActive(closet, (session, today) => {
    if (session.revision !== expectedRevision) return session;
    const result = resultFor(closet, session.request, dayOf(session, today));
    const cursor = session.cursor + 1;
    const next = result.outfits[cursor];
    if (!next) return session;
    return {
      ...session,
      revision: session.revision + 1,
      cursor,
      pieceIds: next.ids,
      previousPieceIds: session.pieceIds,
    };
  });
}

export function startOver(closet: Closet): Closet {
  return withActive(closet, (session, today) =>
    restyle(closet, session, today),
  );
}

export function replacePiece(
  closet: Closet,
  fromId: string,
  toId: string,
  expectedRevision: number,
): Closet {
  return withActive(closet, (session) => {
    if (session.revision !== expectedRevision) return session;
    if (!session.pieceIds.includes(fromId) || session.pieceIds.includes(toId))
      return session;
    const swap = (ids: string[]) =>
      ids.map((id) => (id === fromId ? toId : id));
    return {
      ...session,
      revision: session.revision + 1,
      request: { ...session.request, keptIds: swap(session.request.keptIds) },
      pieceIds: swap(session.pieceIds),
      previousPieceIds: session.pieceIds,
    };
  });
}

export function undoChange(closet: Closet): Closet {
  return withActive(closet, (session) => {
    const previous = session.previousPieceIds;
    if (!previous) return session;
    return {
      ...session,
      revision: session.revision + 1,
      request: {
        ...session.request,
        keptIds: session.request.keptIds.filter((id) => previous.includes(id)),
      },
      pieceIds: previous,
      previousPieceIds: null,
    };
  });
}

export function toggleKeep(closet: Closet, id: string): Closet {
  return withActive(closet, (session) => {
    const kept = session.request.keptIds.includes(id);
    if (!kept && !session.pieceIds.includes(id)) return session;
    return {
      ...session,
      revision: session.revision + 1,
      request: {
        ...session.request,
        keptIds: kept
          ? session.request.keptIds.filter((item) => item !== id)
          : [...session.request.keptIds, id],
      },
    };
  });
}

export function setWardrobe(
  closet: Closet,
  wardrobe: WardrobeMode,
  clock: Clock,
): Closet {
  const next: Closet = {
    ...closet,
    styling: { ...closet.styling, wardrobe, today: null },
  };
  return ensureToday(next, clock);
}

export function applyLook(
  closet: Closet,
  pieceIds: string[],
  expectedRevision: number,
): Closet {
  return withActive(closet, (session) =>
    session.revision !== expectedRevision
      ? session
      : {
          ...session,
          revision: session.revision + 1,
          pieceIds,
          previousPieceIds: session.pieceIds,
        },
  );
}

export function showLook(
  closet: Closet,
  look: { pieceIds: string[]; occasion?: Occasion | null },
): Closet {
  const today = closet.styling.today;
  if (!today) return closet;
  const everyday = today.everyday.request;
  const occasion = look.occasion ?? everyday.occasion;
  const base =
    occasion === everyday.occasion
      ? backToEveryday(closet)
      : withOccasion(closet, {
          ...everyday,
          occasion,
          keptIds: [],
          garmentType: null,
        });
  return withActive(base, (session) => ({
    ...session,
    revision: session.revision + 1,
    pieceIds: look.pieceIds,
    previousPieceIds: session.pieceIds,
    shown: true,
  }));
}

export function dropFromToday(closet: Closet, id: string): Closet {
  const today = closet.styling.today;
  if (!today) return closet;
  const drop = (session: Session) =>
    session.pieceIds.includes(id) && !session.request.keptIds.includes(id)
      ? restyle(closet, session, today)
      : session;
  const everyday = drop(today.everyday);
  const occasion = today.occasion ? drop(today.occasion) : null;
  const tomorrow = today.tomorrow ? drop(today.tomorrow) : undefined;
  if (
    everyday === today.everyday &&
    occasion === today.occasion &&
    tomorrow === today.tomorrow
  )
    return closet;
  return withToday(closet, {
    ...today,
    everyday,
    occasion,
    ...(tomorrow ? { tomorrow } : {}),
  });
}

function untouched(closet: Closet, session: Session, today: TodayState) {
  const ids = [...session.pieceIds].sort().join();
  return (
    session.cursor === 0 &&
    !session.previousPieceIds &&
    !session.request.keptIds.length &&
    !session.request.garmentType &&
    !closet.feedback.some(
      (event) =>
        event.kind === "wore" &&
        !event.undone &&
        event.scope !== "piece" &&
        [...event.pieceIds].sort().join() === ids &&
        clockFor(new Date(event.at), today.timeZone).localDate ===
          today.localDate,
    )
  );
}

export function saveForecast(closet: Closet, forecast: Forecast): Closet {
  const saved: Closet = {
    ...closet,
    styling: { ...closet.styling, forecast },
  };
  const today = saved.styling.today;
  if (!today || today.localDate !== forecast.date) return saved;
  const refresh = (session: Session, exposure: ForecastWeather["exposure"]) => {
    const weather = { ...forecast.weather, exposure };
    if (
      session.request.weather.source === "manual" ||
      dayOf(session, today) !== forecast.date ||
      JSON.stringify(session.request.weather) === JSON.stringify(weather)
    )
      return session;
    return untouched(saved, session, today)
      ? restyle(saved, session, today, { ...session.request, weather })
      : { ...session, request: { ...session.request, weather } };
  };
  const everyday = refresh(
    today.everyday,
    saved.styling.everyday?.exposure ?? null,
  );
  const occasion = today.occasion
    ? refresh(
        today.occasion,
        today.occasion.request.weather.source === "forecast"
          ? today.occasion.request.weather.exposure
          : null,
      )
    : null;
  if (everyday === today.everyday && occasion === today.occasion) return saved;
  return withToday(saved, { ...today, everyday, occasion });
}

export function stylePiece(
  closet: Closet,
  pieceId: string,
  clock: Clock,
): Closet {
  const piece = closet.pieces.find((item) => item.id === pieceId);
  if (!piece || piece.status) return closet;
  const ready = ensureToday(closet, clock);
  const today = ready.styling.today;
  if (!today) return closet;
  const current = activeSession(today).request;
  const style =
    piece.styles?.length && !piece.styles.includes(current.style)
      ? piece.styles[0]!
      : current.style;
  return startOccasion(ready, {
    ...current,
    style,
    garmentType: null,
    keptIds: [pieceId],
    excludedIds: current.excludedIds.filter((id) => id !== pieceId),
    wardrobe: piece.source === "sample" ? "sample" : "owned",
  });
}
