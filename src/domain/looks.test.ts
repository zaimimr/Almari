import { test } from "node:test";
import assert from "node:assert/strict";
import {
  emptyCloset,
  saveLook,
  savePiece,
  setAway,
  type Closet,
} from "./closet";
import { undoFeedback, woreLately, woreLook, woreThis } from "./feedback";
import {
  firstWearMonth,
  lookEntries,
  lastPlannedMonth,
  lookForPieces,
  plannedDays,
  plannedOn,
  plannedPieces,
  plannedToday,
  planSnapshot,
  removeLook,
  restorePlans,
  setPlannedFor,
  wearCalendar,
  weekPlan,
} from "./looks";
import { monthWearStats } from "./profileStats";
import { addSampleWardrobe } from "./samples";
import {
  activeSession,
  saveEverydayStyle,
  setWardrobe,
  stylePiece,
} from "./today";
import { at, piece, styledSample } from "./test-helpers";

const clock = { localDate: "2026-10-01", timeZone: "Europe/Oslo" };

function styled(): Closet {
  return saveEverydayStyle(
    addSampleWardrobe(emptyCloset),
    { occasion: "work", style: "western", hijab: "always", sample: true },
    clock,
    true,
  );
}

test("saved looks and worn outfits are one list with names and occasions", () => {
  const closet = styled();
  const session = activeSession(closet.styling.today!);
  const worn = woreThis(
    closet,
    session.revision,
    "2026-10-01T09:00:00.000Z",
    "w1",
  );
  const saved = saveLook(worn, {
    id: "look-1",
    name: "Eid at home",
    pieceIds: ["sample-sage-kurta", "sample-ivory-salwar"],
    createdAt: "2026-10-01T08:00:00.000Z",
    occasion: "eid",
  });
  assert.deepEqual(
    lookEntries(saved, "en").map((entry) => [
      entry.id,
      entry.name,
      entry.occasion,
      entry.saved,
    ]),
    [
      [
        `set-${[...session.pieceIds].sort().join(",")}`,
        "Dusty blue tunic",
        "work",
        false,
      ],
      ["look-1", "Eid at home", "eid", true],
    ],
  );
  assert.equal(lookEntries(saved, "nb")[0]!.name.endsWith(" til jobb"), true);
});

test("a worn outfit that matches a saved look shows once, and undo removes it", () => {
  const closet = styled();
  const session = activeSession(closet.styling.today!);
  const worn = woreThis(
    closet,
    session.revision,
    "2026-10-01T09:00:00.000Z",
    "w1",
  );
  const saved = saveLook(worn, {
    id: "look-2",
    name: "Monday",
    pieceIds: [...session.pieceIds].reverse(),
    createdAt: "2026-10-01T10:00:00.000Z",
  });
  assert.deepEqual(
    lookEntries(saved, "en").map((entry) => [entry.id, entry.occasion]),
    [["look-2", null]],
  );
  assert.deepEqual(lookEntries(undoFeedback(worn, "w1"), "en"), []);
});

test("Style this piece keeps the piece and leaves the everyday outfit as it was", () => {
  const closet = styled();
  const everyday = closet.styling.today!.everyday;
  const next = stylePiece(closet, "sample-sage-kurta", clock);
  const today = next.styling.today!;
  assert.equal(today.active, "occasion");
  assert.deepEqual(today.everyday, everyday);
  const session = activeSession(today);
  assert.deepEqual(session.request.keptIds, ["sample-sage-kurta"]);
  assert.equal(session.request.style, "desi");
  assert.ok(session.pieceIds.includes("sample-sage-kurta"));
});

test("Style this piece leaves an away piece, an unknown piece and a closet without a style alone", () => {
  const closet = styled();
  const away = setAway(closet, "sample-sage-kurta", "wash");
  assert.equal(stylePiece(away, "sample-sage-kurta", clock), away);
  assert.equal(stylePiece(closet, "nope", clock), closet);
  const fresh = addSampleWardrobe(emptyCloset);
  assert.equal(stylePiece(fresh, "sample-sage-kurta", clock), fresh);
});

const sample = () => {
  const base = styledSample();
  const ids = activeSession(base.styling.today!).pieceIds;
  const look = {
    id: "eid",
    name: "Eid lunch",
    pieceIds: ids,
    createdAt: "2026-09-20T00:00:00Z",
    occasion: "eid" as const,
  };
  return { closet: { ...base, looks: [look] }, ids, look };
};

test("piece wears add no Looks row and removing a worn look keeps its name and id", () => {
  const { closet, ids, look } = sample();
  const marked = woreLately(
    closet,
    ids.slice(0, 2),
    "2026-10-01T12:00:00Z",
    (id) => `w-${id}`,
  );
  assert.equal(lookEntries(marked, "en").filter((e) => !e.saved).length, 0);
  const worn = woreLook(marked, "eid", "2026-10-01T18:00:00Z", "w-look");
  const before = lookEntries(worn, "en").find((e) => e.lookId === "eid")!;
  const removed = removeLook(worn, "eid");
  const after = lookEntries(removed, "en").find((e) => e.name === "Eid lunch")!;
  assert.equal(after.saved, false);
  assert.equal(after.id, `set-${[...look.pieceIds].sort().join(",")}`);
  assert.equal(before.name, after.name);
});

test("planned looks come first and surface on their day", () => {
  const { closet, ids } = sample();
  const planned = setPlannedFor(
    {
      ...closet,
      looks: [
        ...closet.looks,
        {
          id: "office",
          name: "Office",
          pieceIds: ids.slice(0, 3),
          createdAt: "2026-10-01T00:00:00Z",
        },
      ],
    },
    "eid",
    "2026-10-11",
  );
  assert.equal(lookEntries(planned, "en")[0]?.lookId, "eid");
  assert.deepEqual(
    plannedToday(planned, at("2026-10-11T08:00:00+02:00")).map((l) => l.id),
    ["eid"],
  );
  assert.deepEqual(plannedToday(planned, at("2026-10-12T08:00:00+02:00")), []);
  assert.deepEqual(
    Object.values(
      plannedPieces(planned, at("2026-10-05T08:00:00+02:00")),
    ).every((d) => d === "2026-10-11"),
    true,
  );
  assert.deepEqual(plannedPieces(planned, at("2026-10-03T08:00:00+02:00")), {});
  assert.equal(lookForPieces(planned, [...ids].reverse())?.id, "eid");
  assert.equal(lookForPieces(planned, ids.slice(1)), null);
});

test("the calendar holds outfit wears, marks piece wears with a dot, and variety plus not worn lately is the whole closet", () => {
  const { closet, ids } = sample();
  let worn = woreLately(closet, ids, "2026-10-01T12:00:00Z", (id) => `w-${id}`);
  worn = woreLook(worn, "eid", "2026-10-02T18:00:00Z", "w-eid");
  const month = wearCalendar(worn, "2026-10", "en");
  assert.deepEqual(Object.keys(month).sort(), ["2026-10-01", "2026-10-02"]);
  assert.deepEqual(
    [month["2026-10-01"]!.wears.length, month["2026-10-01"]!.pieceWorn],
    [0, true],
  );
  assert.equal(month["2026-10-02"]!.pieceWorn, false);
  assert.equal(month["2026-10-02"]!.wears[0]!.name, "Eid lunch");
  assert.equal(month["2026-10-02"]!.wears[0]!.occasion, "eid");
  assert.notEqual(month["2026-10-02"]!.mark?.category, "hijab");
  assert.equal(firstWearMonth(worn), "2026-10");
  const stats = monthWearStats(
    { ...worn, styling: { ...worn.styling, wardrobe: "sample" } },
    "2026-10",
    at("2026-10-14T08:00:00+02:00"),
  );
  assert.ok(stats.variety !== null && stats.variety > 0 && stats.variety <= 1);
  assert.equal(
    monthWearStats(worn, "2026-09", at("2026-10-14T08:00:00+02:00")).variety,
    null,
  );
});

test("a calendar wear leaves once all its pieces have left the closet", () => {
  const { closet, ids } = sample();
  const worn = woreLook(closet, "eid", "2026-10-02T18:00:00Z", "w-eid");
  const without = (gone: string[]) => ({
    ...worn,
    pieces: worn.pieces.filter((piece) => !gone.includes(piece.id)),
  });
  assert.deepEqual(
    Object.keys(wearCalendar(without(ids.slice(1)), "2026-10", "en")),
    ["2026-10-02"],
  );
  assert.deepEqual(wearCalendar(without(ids), "2026-10", "en"), {});
  assert.equal(firstWearMonth(without(ids)), null);
});

test("wearing a saved look moves it to the top", () => {
  const { closet, ids } = sample();
  const two = {
    ...closet,
    looks: [
      ...closet.looks,
      {
        id: "office",
        name: "Office",
        pieceIds: ids.slice(0, 2),
        createdAt: "2026-10-01T00:00:00Z",
      },
    ],
  };
  assert.equal(lookEntries(two, "en")[0]?.lookId, "office");
  const worn = woreLook(two, "eid", "2026-10-02T09:00:00Z", "w-eid");
  assert.equal(lookEntries(worn, "en")[0]?.lookId, "eid");
  assert.equal(lookEntries(worn, "en")[0]?.lastWorn, "2026-10-02T09:00:00Z");
});

test("one look per day, past plans expire, and the week shows each day", () => {
  const { closet, ids } = sample();
  const both = setPlannedFor(
    setPlannedFor(
      {
        ...closet,
        looks: [
          ...closet.looks,
          {
            id: "office",
            name: "Office",
            pieceIds: ids.slice(0, 3),
            createdAt: "2026-10-01T00:00:00Z",
          },
        ],
      },
      "eid",
      "2026-10-11",
    ),
    "office",
    "2026-10-11",
  );
  assert.equal(plannedOn(both, "2026-10-11")?.id, "office");
  const before = setPlannedFor(both, "eid", "2026-10-11");
  const undone = restorePlans(
    setPlannedFor(before, "office", "2026-10-11"),
    planSnapshot(before),
  );
  assert.equal(plannedOn(undone, "2026-10-11")?.id, "eid");
  assert.equal(
    undone.looks.find((look) => look.id === "office")?.plannedFor,
    undefined,
  );
  assert.equal(
    both.looks.find((look) => look.id === "eid")?.plannedFor,
    undefined,
  );
  const entries = (today: string) =>
    lookEntries(both, "en", today).find((entry) => entry.lookId === "office")
      ?.plannedFor;
  assert.equal(entries("2026-10-05"), "2026-10-11");
  assert.equal(entries("2026-10-12"), null);
  const week = weekPlan(both, "2026-10-05");
  assert.equal(week.length, 7);
  assert.deepEqual(
    week.map((day) => day.look?.id ?? null),
    [null, null, null, null, null, null, "office"],
  );
  assert.deepEqual(Object.keys(plannedDays(both, "2026-10", "2026-10-05")), [
    "2026-10-11",
  ]);
  assert.deepEqual(plannedDays(both, "2026-10", "2026-10-12"), {});
  const later = setPlannedFor(both, "eid", "2026-12-02");
  assert.equal(lastPlannedMonth(later, "2026-10-05"), "2026-12");
  assert.equal(lastPlannedMonth(closet, "2026-10-05"), "2026-10");
});

test("the sample closet keeps its own looks and wears apart from her own", () => {
  const closet = styled();
  const session = activeSession(closet.styling.today!);
  const worn = saveLook(
    woreThis(closet, session.revision, "2026-10-01T09:00:00.000Z", "w1"),
    {
      id: "look-1",
      name: "Sample look",
      pieceIds: ["sample-sage-kurta", "sample-ivory-salwar"],
      createdAt: "2026-10-01T08:00:00.000Z",
      plannedFor: "2026-10-01",
    },
  );
  const own = savePiece(worn, piece("my-top", "top"));
  assert.equal(own.styling.wardrobe, "owned");
  assert.deepEqual(lookEntries(own, "en"), []);
  assert.deepEqual(wearCalendar(own, "2026-10", "en"), {});
  assert.deepEqual(plannedToday(own, clock), []);
  const back = setWardrobe(own, "sample", clock);
  assert.equal(lookEntries(back, "en").length, 2);
  assert.equal(
    wearCalendar(back, "2026-10", "en")["2026-10-01"]!.wears.length,
    1,
  );
  assert.deepEqual(
    plannedToday(back, clock).map((look) => look.id),
    ["look-1"],
  );
});
