import type {
  Closet,
  EverydayStyle,
  OutfitRequest,
  Session,
  TodayState,
  WardrobeMode,
} from "./closet";
import { rulesScorer } from "./scoring/rulesScorer";
import { scoreContext } from "./scoring/taste";
import { styleOutfits, type StyleResult } from "./styling";

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
): OutfitRequest {
  return {
    occasion: preset.occasion,
    style: preset.style,
    garmentType: null,
    keptIds: [],
    excludedIds: [],
    weather: { source: "unknown" },
    hijab: preset.hijab,
    wardrobe,
  };
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
    engine: rulesScorer.id,
  };
}

export function activeSession(today: TodayState): Session {
  return today.active === "occasion" && today.occasion
    ? today.occasion
    : today.everyday;
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
    today.active === "occasion"
      ? { ...today, occasion: next }
      : { ...today, everyday: next },
  );
}

export function ensureToday(closet: Closet, clock: Clock): Closet {
  const preset = closet.styling.everyday;
  if (!preset) return closet;
  const current = closet.styling.today;
  if (current?.localDate === clock.localDate) return closet;
  const everyday = sessionFor(
    closet,
    everydayRequest(preset, closet.styling.wardrobe),
    clock.localDate,
    (current?.everyday.revision ?? 0) + 1,
  );
  const keepOccasion = current?.active === "occasion" && current.occasion;
  return withToday(closet, {
    localDate: clock.localDate,
    timeZone: clock.timeZone,
    presetVersion: preset.version,
    everyday,
    occasion: keepOccasion ? current.occasion : null,
    active: keepOccasion ? "occasion" : "everyday",
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
      everydayRequest(saved.styling.everyday!, saved.styling.wardrobe),
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
      : sessionFor(closet, request, today.localDate, session.revision + 1),
  );
}

export function startOccasion(closet: Closet, request: OutfitRequest): Closet {
  const today = closet.styling.today;
  if (!today) return closet;
  return withToday(closet, {
    ...today,
    active: "occasion",
    occasion: sessionFor(
      closet,
      request,
      today.localDate,
      (today.occasion?.revision ?? 0) + 1,
    ),
  });
}

export function backToEveryday(closet: Closet): Closet {
  const today = closet.styling.today;
  if (!today) return closet;
  return withToday(closet, { ...today, active: "everyday", occasion: null });
}

export function tryAnother(closet: Closet, expectedRevision: number): Closet {
  return withActive(closet, (session, today) => {
    if (session.revision !== expectedRevision) return session;
    const result = resultFor(closet, session.request, today.localDate);
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
    sessionFor(closet, session.request, today.localDate, session.revision + 1),
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

export function dropFromToday(closet: Closet, id: string): Closet {
  const today = closet.styling.today;
  if (!today) return closet;
  const restyle = (session: Session) =>
    session.pieceIds.includes(id) && !session.request.keptIds.includes(id)
      ? sessionFor(
          closet,
          session.request,
          today.localDate,
          session.revision + 1,
        )
      : session;
  const everyday = restyle(today.everyday);
  const occasion = today.occasion ? restyle(today.occasion) : null;
  if (everyday === today.everyday && occasion === today.occasion) return closet;
  return withToday(closet, { ...today, everyday, occasion });
}
