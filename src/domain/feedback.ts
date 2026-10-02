import type {
  Closet,
  FeedbackEvent,
  FeedbackKind,
  Piece,
  Session,
  StyleProfile,
  Taste,
} from "./closet";
import { factsFor } from "./scoring/rules";
import { ruleBook } from "./scoring/rulebook";
import { baseWeights, features } from "./scoring/rulesScorer";
import { countPairs, learnPreference } from "./scoring/taste";
import type { Candidate } from "./styling";
import { activeSession, replacePiece, resultFor } from "./today";
import { t } from "../i18n";

export type Chip = "too-formal" | "too-plain" | "too-warm" | "not-my-style";

const chipIds: Chip[] = ["too-formal", "too-plain", "too-warm", "not-my-style"];

export const chips: { id: Chip; label: string }[] = chipIds.map((id) => ({
  id,
  label: t(`feedback.${id}`),
}));

const warmFabrics = ["wool", "knit", "velvet", "khaddar", "karandi"];
const warmthSteps = { light: 0, medium: 1, warm: 2 };

function piecesFor(closet: Closet, ids: string[]) {
  return ids.flatMap((id) => {
    const piece = closet.pieces.find((item) => item.id === id);
    return piece ? [piece] : [];
  });
}

function formality(pieces: Piece[]) {
  const levels = factsFor(pieces, ruleBook.thresholds)
    .filter((facts) =>
      ["main", "bottom", "layer", "outer"].includes(facts.role),
    )
    .map((facts) => facts.formality);
  return levels.length
    ? levels.reduce((total, level) => total + level, 0) / levels.length
    : null;
}

function statement(pieces: Piece[]) {
  return factsFor(pieces, ruleBook.thresholds).filter(
    (facts) =>
      facts.print ||
      facts.color.main?.colorClass === "accent" ||
      ["light", "heavy"].includes(facts.piece.attributes?.embellishment ?? ""),
  ).length;
}

function warmth(pieces: Piece[]) {
  return factsFor(pieces, ruleBook.thresholds).reduce(
    (total, facts) =>
      total +
      (facts.role === "layer" || facts.role === "outer" ? 1 : 0) +
      (facts.piece.traits?.warmth
        ? warmthSteps[facts.piece.traits.warmth]
        : 0) +
      (warmFabrics.includes(facts.piece.attributes?.fabric ?? "") ? 1 : 0),
    0,
  );
}

function changed(a: string[], b: string[]) {
  return b.filter((id) => !a.includes(id)).length;
}

function alternative(
  closet: Closet,
  kind: Chip,
  current: string[],
  outfits: Candidate[],
): Candidate | null {
  const others = outfits.filter((outfit) => changed(current, outfit.ids) > 0);
  const now = piecesFor(closet, current);
  const better = (outfit: Candidate) => {
    const next = piecesFor(closet, outfit.ids);
    if (kind === "too-formal") {
      const before = formality(now);
      const after = formality(next);
      return before !== null && after !== null && after < before;
    }
    if (kind === "too-plain") return statement(next) > statement(now);
    if (kind === "too-warm") return warmth(next) < warmth(now);
    return changed(current, outfit.ids) >= 2;
  };
  return (
    others.find(better) ??
    others.find((outfit) => changed(current, outfit.ids) >= 2) ??
    others[0] ??
    null
  );
}

function prefers(kind: FeedbackKind) {
  return kind === "wore" || kind === "saved" || kind === "swap";
}

export function rebuildTaste(closet: Closet, profile: StyleProfile): Taste {
  const bases = baseWeights(profile);
  let taste: Taste = { weights: {}, pairs: {} };
  for (const event of closet.feedback) {
    if (event.undone) continue;
    if (event.kind === "wore")
      taste = countPairs(taste, event.pieceIds, "worn");
    if (event.kind === "not-my-style")
      taste = countPairs(taste, event.pieceIds, "rejected");
    const shown = piecesFor(closet, event.pieceIds);
    const other = piecesFor(closet, event.against ?? []);
    if (!shown.length || !other.length) continue;
    const shownFeatures = features(shown, event.request, profile);
    const otherFeatures = features(other, event.request, profile);
    taste = prefers(event.kind)
      ? learnPreference(taste, bases, shownFeatures, otherFeatures)
      : learnPreference(taste, bases, otherFeatures, shownFeatures);
  }
  return taste;
}

function withFeedback(closet: Closet, event: FeedbackEvent): Closet {
  const next = { ...closet, feedback: [...closet.feedback, event] };
  return {
    ...next,
    styling: {
      ...next.styling,
      taste: rebuildTaste(next, next.styling.profile),
    },
  };
}

function withSession(closet: Closet, session: Session): Closet {
  const today = closet.styling.today!;
  return {
    ...closet,
    styling: {
      ...closet.styling,
      today:
        today.active === "occasion"
          ? { ...today, occasion: session }
          : { ...today, everyday: session },
    },
  };
}

function eventFor(
  session: Session,
  kind: FeedbackKind,
  pieceIds: string[],
  at: string,
  id: string,
  against: string[] | undefined,
): FeedbackEvent {
  return {
    id,
    at,
    kind,
    pieceIds,
    request: session.request,
    engine: session.engine ?? "rules",
    ...(against ? { against } : {}),
  };
}

function nextShown(closet: Closet, session: Session) {
  const today = closet.styling.today!;
  const outfits = resultFor(closet, session.request, today.localDate).outfits;
  return outfits.find((outfit) => changed(session.pieceIds, outfit.ids) > 0)
    ?.ids;
}

export function giveFeedback(
  closet: Closet,
  kind: Chip,
  expectedRevision: number,
  at: string,
  id: string,
): Closet {
  const today = closet.styling.today;
  if (!today) return closet;
  const session = activeSession(today);
  if (session.revision !== expectedRevision || !session.pieceIds.length)
    return closet;
  const outfits = resultFor(closet, session.request, today.localDate).outfits;
  const next = alternative(closet, kind, session.pieceIds, outfits);
  const recorded = withFeedback(
    closet,
    eventFor(session, kind, session.pieceIds, at, id, next?.ids),
  );
  if (!next) return recorded;
  const ranked = resultFor(recorded, session.request, today.localDate).outfits;
  const cursor = ranked.findIndex(
    (outfit) => outfit.ids.join() === next.ids.join(),
  );
  return withSession(recorded, {
    ...session,
    revision: session.revision + 1,
    cursor: Math.max(0, cursor),
    pieceIds: next.ids,
    previousPieceIds: session.pieceIds,
  });
}

export function wornNow(closet: Closet): FeedbackEvent | null {
  const today = closet.styling.today;
  if (!today) return null;
  const ids = [...activeSession(today).pieceIds].sort().join();
  const last = [...closet.feedback]
    .reverse()
    .find((event) => event.kind === "wore" && !event.undone);
  return last && [...last.pieceIds].sort().join() === ids ? last : null;
}

export function woreThis(
  closet: Closet,
  expectedRevision: number,
  at: string,
  id: string,
): Closet {
  const today = closet.styling.today;
  if (!today) return closet;
  const session = activeSession(today);
  if (session.revision !== expectedRevision || !session.pieceIds.length)
    return closet;
  if (wornNow(closet)) return closet;
  return withFeedback(
    closet,
    eventFor(
      session,
      "wore",
      session.pieceIds,
      at,
      id,
      nextShown(closet, session),
    ),
  );
}

export function undoFeedback(closet: Closet, eventId: string): Closet {
  if (!closet.feedback.some((event) => event.id === eventId && !event.undone))
    return closet;
  const next = {
    ...closet,
    feedback: closet.feedback.map((event) =>
      event.id === eventId ? { ...event, undone: true } : event,
    ),
  };
  return {
    ...next,
    styling: {
      ...next.styling,
      taste: rebuildTaste(next, next.styling.profile),
    },
  };
}

export function recordSaved(
  closet: Closet,
  pieceIds: string[],
  at: string,
  id: string,
): Closet {
  const today = closet.styling.today;
  if (!today) return closet;
  const session = activeSession(today);
  const same =
    [...session.pieceIds].sort().join() === [...pieceIds].sort().join();
  if (!same) return closet;
  return withFeedback(
    closet,
    eventFor(
      session,
      "saved",
      session.pieceIds,
      at,
      id,
      nextShown(closet, session),
    ),
  );
}

export function swapPiece(
  closet: Closet,
  fromId: string,
  toId: string,
  expectedRevision: number,
  at: string,
  id: string,
): Closet {
  const today = closet.styling.today;
  if (!today) return closet;
  const before = activeSession(today);
  const swapped = replacePiece(closet, fromId, toId, expectedRevision);
  if (swapped === closet) return closet;
  const after = activeSession(swapped.styling.today!);
  return withFeedback(swapped, {
    ...eventFor(after, "swap", after.pieceIds, at, id, before.pieceIds),
    swap: { from: fromId, to: toId },
  });
}

export function saveProfile(closet: Closet, profile: StyleProfile): Closet {
  return {
    ...closet,
    styling: {
      ...closet.styling,
      profile,
      taste: rebuildTaste(closet, profile),
    },
  };
}
