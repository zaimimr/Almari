import type { Closet, ImportJob } from "./closet";

export type EventProps = Record<string, string | number | boolean>;

export type ClosetEvent = { event: string; props: EventProps };

export type PieceSource = "scan" | "photo" | "link" | "manual";

export function pieceSource(job: ImportJob | undefined): PieceSource {
  if (!job) return "manual";
  if (job.fromLink) return "link";
  const capture = job.captureId;
  if (capture && job.id !== capture && !job.id.startsWith(`${capture}-`))
    return "scan";
  return "photo";
}

const sessionSlots = ["everyday", "occasion", "tomorrow"] as const;

export function closetEvents(previous: Closet, next: Closet): ClosetEvent[] {
  if (previous === next) return [];
  const events: ClosetEvent[] = [];

  if (!previous.styling.onboarded && next.styling.onboarded)
    events.push({ event: "onboarding_completed", props: {} });

  const knownPieces = new Set(previous.pieces.map((piece) => piece.id));
  const added = next.pieces.filter(
    (piece) => piece.source === "owned" && !knownPieces.has(piece.id),
  );
  for (const piece of added) {
    const job = previous.imports.find((item) => item.id === piece.id);
    events.push({
      event: "piece_added",
      props: { source: pieceSource(job), category: piece.category },
    });
  }

  for (const slot of sessionSlots) {
    const session = next.styling.today?.[slot];
    if (!session?.pieceIds.length) continue;
    const before = previous.styling.today?.[slot];
    if (before && before.pieceIds.join() === session.pieceIds.join()) continue;
    events.push({
      event: "outfit_created",
      props: { occasion: session.request.occasion, slot },
    });
  }

  const knownFeedback = new Set(previous.feedback.map((event) => event.id));
  for (const feedback of next.feedback) {
    if (feedback.kind !== "wore" || knownFeedback.has(feedback.id)) continue;
    events.push({
      event: "outfit_worn",
      props: { occasion: feedback.request.occasion },
    });
  }

  const knownLooks = new Set(previous.looks.map((look) => look.id));
  for (const look of next.looks) {
    if (knownLooks.has(look.id)) continue;
    events.push({
      event: "look_saved",
      props: {
        pieces: look.pieceIds.length,
        ...(look.occasion ? { occasion: look.occasion } : {}),
      },
    });
  }

  return events;
}
