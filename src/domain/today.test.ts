import { test } from "node:test";
import assert from "node:assert/strict";
import {
  activeSession,
  backToToday,
  discardPlan,
  ensureToday,
  prepareTomorrow,
  replacePiece,
  resumePlan,
  startOccasion,
  startPlan,
  unsavedPlan,
} from "./today";
import { setPlannedFor } from "./looks";
import { at, styledSample } from "./test-helpers";

const weather = {
  source: "manual" as const,
  warmth: "cold" as const,
  precipitation: "snow" as const,
  exposure: null,
};

test("an undated occasion session ends with its day", () => {
  const saturday = styledSample("2026-10-03T09:00:00+02:00");
  const party = startOccasion(saturday, {
    ...activeSession(saturday.styling.today!).request,
    occasion: "party",
  });
  assert.equal(party.styling.today!.active, "occasion");
  const monday = ensureToday(party, at("2026-10-05T08:00:00+02:00"));
  assert.equal(monday.styling.today!.active, "everyday");
  assert.equal(monday.styling.today!.occasion, null);
  assert.equal(monday.styling.today!.localDate, "2026-10-05");
});

test("a dated plan is kept inactive, offered back, and gone once its day has passed", () => {
  const wednesday = styledSample("2026-10-07T09:00:00+02:00");
  const plan = startPlan(
    wednesday,
    { ...activeSession(wednesday.styling.today!).request, occasion: "eid" },
    "2026-10-11",
  );
  assert.equal(activeSession(plan.styling.today!).date, "2026-10-11");
  const thursday = ensureToday(plan, at("2026-10-08T08:00:00+02:00"));
  assert.equal(thursday.styling.today!.active, "everyday");
  assert.equal(unsavedPlan(thursday)?.date, "2026-10-11");
  const resumed = resumePlan(thursday);
  assert.equal(activeSession(resumed.styling.today!).date, "2026-10-11");
  assert.equal(unsavedPlan(discardPlan(thursday)), null);
  const later = ensureToday(thursday, at("2026-10-12T08:00:00+02:00"));
  assert.equal(later.styling.today!.occasion, null);
});

test("tomorrow's outfit becomes the next morning's everyday outfit, with the evening's changes", () => {
  const sunday = styledSample("2026-10-04T21:00:00+02:00");
  const tomorrow = prepareTomorrow(
    sunday,
    at("2026-10-04T21:00:00+02:00"),
    weather,
  );
  assert.equal(tomorrow.styling.today!.active, "tomorrow");
  assert.equal(activeSession(tomorrow.styling.today!).date, "2026-10-05");
  const before = activeSession(tomorrow.styling.today!).pieceIds;
  const hijab = tomorrow.pieces.find(
    (p) => p.category === "hijab" && !before.includes(p.id),
  )!;
  const current = before.find(
    (id) => tomorrow.pieces.find((p) => p.id === id)?.category === "hijab",
  )!;
  const changed = replacePiece(
    tomorrow,
    current,
    hijab.id,
    activeSession(tomorrow.styling.today!).revision,
  );
  assert.deepEqual(
    changed.styling.today!.everyday.pieceIds,
    sunday.styling.today!.everyday.pieceIds,
  );
  const shown = backToToday(changed);
  assert.equal(shown.styling.today!.active, "everyday");
  assert.ok(shown.styling.today!.tomorrow);
  const monday = ensureToday(shown, at("2026-10-05T07:00:00+02:00"));
  assert.equal(monday.styling.today!.active, "everyday");
  assert.ok(monday.styling.today!.everyday.pieceIds.includes(hijab.id));
  assert.equal(monday.styling.today!.tomorrow, undefined);
  const tuesday = ensureToday(shown, at("2026-10-06T07:00:00+02:00"));
  assert.ok(
    !tuesday.styling.today!.everyday.pieceIds.includes(hijab.id) ||
      tuesday.styling.today!.everyday.revision !==
        monday.styling.today!.everyday.revision,
  );
  assert.equal(tuesday.styling.today!.tomorrow, undefined);
});

test("a planned look survives the night and a removed piece never breaks the morning", () => {
  const closet = styledSample("2026-10-10T09:00:00+02:00");
  const ids = activeSession(closet.styling.today!).pieceIds;
  const planned = setPlannedFor(
    {
      ...closet,
      looks: [
        {
          id: "l",
          name: "Eid",
          pieceIds: ids,
          createdAt: "2026-10-01T00:00:00Z",
        },
      ],
    },
    "l",
    "2026-10-11",
  );
  const removedPiece = {
    ...planned,
    pieces: planned.pieces.filter((p) => p.id !== ids[0]),
  };
  const morning = ensureToday(removedPiece, at("2026-10-11T08:00:00+02:00"));
  assert.equal(morning.looks[0]?.plannedFor, "2026-10-11");
  assert.ok(morning.styling.today!.everyday.pieceIds.length > 0);
});

test("opening tomorrow's outfit again keeps the evening's changes", () => {
  const clock = at("2026-10-04T21:00:00+02:00");
  const tomorrow = prepareTomorrow(
    styledSample("2026-10-04T21:00:00+02:00"),
    clock,
    weather,
  );
  const session = activeSession(tomorrow.styling.today!);
  const hijab = tomorrow.pieces.find(
    (p) => p.category === "hijab" && !session.pieceIds.includes(p.id),
  )!;
  const current = session.pieceIds.find(
    (id) => tomorrow.pieces.find((p) => p.id === id)?.category === "hijab",
  )!;
  const kept = backToToday(
    replacePiece(tomorrow, current, hijab.id, session.revision),
  );
  const again = prepareTomorrow(kept, clock, weather);
  assert.equal(again.styling.today!.active, "tomorrow");
  assert.ok(activeSession(again.styling.today!).pieceIds.includes(hijab.id));
});
