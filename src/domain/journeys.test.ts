import assert from "node:assert/strict";
import { test } from "node:test";
import {
  decodeCloset,
  emptyCloset,
  occasions,
  removePiece,
  saveLook,
  savePiece,
  setAway,
  studioSource,
  withStudio,
  type Closet,
  type Prepared,
} from "./closet";
import {
  acceptImports,
  correctImport,
  finishImport,
  importStudioSource,
  queueImport,
  setImportStudio,
  startImport,
} from "./importing";
import { replaceImportCutout } from "./cutout";
import { builderRequest, fillOutfit } from "./builder";
import { woreThis, undoFeedback } from "./feedback";
import {
  lookEntries,
  planSnapshot,
  plannedDays,
  plannedToday,
  restorePlans,
  setPlannedFor,
  wearCalendar,
  weekPlan,
} from "./looks";
import { notificationPlan, notificationSchedule } from "./notifications";
import { ClosetRepository, type ClosetStorage } from "./repository";
import { realisticPieces } from "./realistic-closet.fixture";
import { evaluateOutfit, roleOf } from "./styling";
import {
  activeSession,
  ensureToday,
  prepareTomorrow,
  resultFor,
  saveEverydayStyle,
  showLook,
} from "./today";
import { at, ownedCloset, piece } from "./test-helpers";

const clock = at("2026-10-11T10:00:00+02:00");
const reopen = (closet: Closet) => decodeCloset(JSON.stringify(closet));

function imported(category: "hijab" | "bottom" | "layer", hasCutout: boolean) {
  const original = `${category}-outfit.jpg`;
  const prepared: Prepared = {
    original,
    cutout: hasCutout ? `${category}-fragment.png` : null,
    enhanced: hasCutout ? `${category}-enhanced.png` : null,
    thumbnail: null,
    frame: hasCutout ? { x: 0.2, y: 0.3, width: 0.1, height: 0.2 } : null,
    area: hasCutout ? { x: 0.2, y: 0.3, width: 0.1, height: 0.2 } : undefined,
    instances: 1,
    labels: [{ group: "kind", value: "t-shirt", score: 0.2 }],
    palette: [],
    embedding: null,
  };
  const queued = queueImport(emptyCloset, {
    id: category,
    source: original,
    createdAt: "2026-10-11T08:00:00Z",
  });
  const processed = finishImport(
    startImport(queued, category),
    category,
    prepared,
  );
  return correctImport(processed, category, {
    kind:
      category === "hijab"
        ? "hijab"
        : category === "bottom"
          ? "trousers"
          : "blazer",
    name: category,
  });
}

function styledCloset() {
  return saveEverydayStyle(
    ownedCloset(realisticPieces),
    { occasion: "everyday", style: "western", hijab: "always", sample: false },
    clock,
    true,
  );
}

for (const category of ["hijab", "bottom", "layer"] as const) {
  for (const hasCutout of [true, false]) {
    test(`capture-to-closet: ${category}, ${hasCutout ? "partial crop" : "failed cutout"}, correction, Studio, reopen, regenerate`, () => {
      const before = imported(category, hasCutout);
      const job = before.imports[0]!;
      assert.equal(
        importStudioSource(job),
        hasCutout ? `${category}-fragment.png` : `${category}-outfit.jpg`,
      );
      const shot = setImportStudio(before, category, `${category}-studio.png`);
      const accepted = reopen(
        acceptImports(
          correctImport(shot, category, {
            variant: "studio",
            keepOriginal: false,
          }),
          [category],
        ),
      );
      assert.equal(accepted.imports.length, 0);
      assert.equal(accepted.pieces.length, 1);
      const item = accepted.pieces[0]!;
      assert.equal(item.category, category);
      assert.equal(item.photo, `${category}-studio.png`);
      assert.equal(item.original, `${category}-outfit.jpg`);
      assert.equal(studioSource(item), importStudioSource(job));
      const regenerated = reopen(
        savePiece(accepted, withStudio(item, `${category}-studio-2.png`)),
      );
      assert.equal(regenerated.pieces[0]!.original, item.original);
      assert.notEqual(
        studioSource(regenerated.pieces[0]!),
        regenerated.pieces[0]!.photo,
      );
      assert.equal(before.imports[0]!.prepared?.studio, undefined);
    });
  }

  test(`capture-to-closet: recropping ${category} preserves original and invalidates Studio until regenerated`, () => {
    const before = setImportStudio(
      imported(category, true),
      category,
      "studio-1.png",
    );
    const edit = {
      cutout: "new-cut.png",
      enhanced: "new-enhanced.png",
      thumbnail: "new-thumb.png",
      frame: { x: 0.1, y: 0, width: 0.8, height: 1 },
      area: { x: 0.1, y: -0.05, width: 0.8, height: 1.05 },
    };
    const changed = reopen(replaceImportCutout(before, category, edit));
    assert.equal(changed.imports[0]!.prepared?.studioStale, true);
    assert.equal(importStudioSource(changed.imports[0]!), "new-cut.png");
    const fresh = reopen(
      acceptImports(
        correctImport(
          setImportStudio(changed, category, "studio-2.png"),
          category,
          { variant: "studio", keepOriginal: false },
        ),
      ),
    );
    assert.equal(fresh.pieces[0]!.studioStale, undefined);
    assert.equal(fresh.pieces[0]!.original, `${category}-outfit.jpg`);
    assert.deepEqual(fresh.pieces[0]!.cutoutArea, edit.area);
  });
}

for (const style of ["western", "desi"] as const) {
  test(`create outfits: all ${style} occasions use eligible owned pieces and satisfy hard rules`, () => {
    const closet = styledCloset();
    for (const { id: occasion } of occasions) {
      const request = { ...builderRequest(closet, [], occasion), style };
      const result = resultFor(closet, request, clock.localDate);
      assert.ok(result.outfits.length > 0, `${style}/${occasion}: no outfit`);
      for (const outfit of result.outfits) {
        assert.equal(new Set(outfit.ids).size, outfit.ids.length);
        const pieces = outfit.ids.map((id) =>
          closet.pieces.find((item) => item.id === id)!,
        );
        assert.ok(
          pieces.every((item) => item.source === "owned" && !item.status),
        );
        assert.ok(pieces.some((item) => roleOf(item) === "hijab"));
        const problems = evaluateOutfit(pieces, request, closet.pieces);
        assert.deepEqual(
          problems.filter((problem) => problem.severity === "conflict"),
          [],
          `${style}/${occasion}/${outfit.ids.join(",")}`,
        );
      }
    }
  });
}

test("build, save, plan, reopen, wear and undo preserve the exact selected look", () => {
  const closet = styledCloset();
  const selected = ["real-maroon-embroidered-kameez"];
  const filled = fillOutfit(
    closet,
    builderRequest(closet, selected, "eid"),
    clock.localDate,
  );
  assert.ok("ids" in filled);
  assert.ok(filled.ids.includes(selected[0]!));
  const look = {
    id: "eid-look",
    name: "Eid lunch",
    pieceIds: filled.ids,
    occasion: "eid" as const,
    createdAt: "2026-10-11T08:00:00Z",
  };
  const saved = saveLook(closet, look);
  const planned = reopen(setPlannedFor(saved, look.id, "2026-10-12"));
  assert.equal(weekPlan(planned, clock.localDate)[1]!.look?.id, look.id);
  assert.equal(
    plannedDays(planned, "2026-10", clock.localDate)["2026-10-12"]?.id,
    look.id,
  );
  const nextDay = at("2026-10-12T09:00:00+02:00");
  assert.equal(plannedToday(planned, nextDay)[0]?.id, look.id);
  const shown = showLook(ensureToday(planned, nextDay), planned.looks[0]!);
  const session = activeSession(shown.styling.today!);
  assert.deepEqual(session.pieceIds, filled.ids);
  assert.equal(session.request.occasion, "eid");
  const worn = reopen(
    woreThis(shown, session.revision, "2026-10-12T07:10:00Z", "wear-eid"),
  );
  assert.equal(
    wearCalendar(worn, "2026-10", "en")["2026-10-12"]!.wears[0]!.name,
    "Eid lunch",
  );
  assert.equal(
    woreThis(
      worn,
      activeSession(worn.styling.today!).revision,
      "2026-10-12T07:11:00Z",
      "wear-again",
    ),
    worn,
  );
  const undone = reopen(undoFeedback(worn, "wear-eid"));
  assert.equal(wearCalendar(undone, "2026-10", "en")["2026-10-12"], undefined);
});

test("replacement and move plans remain exclusive and an undo survives reopening", () => {
  const closet = ownedCloset([piece("top", "top"), piece("bottom", "bottom")]);
  const first = saveLook(closet, {
    id: "first",
    name: "First",
    pieceIds: ["top"],
    createdAt: "2026-10-11T08:00:00Z",
  });
  const both = saveLook(first, {
    id: "second",
    name: "Second",
    pieceIds: ["bottom"],
    createdAt: "2026-10-11T08:00:00Z",
  });
  const original = setPlannedFor(both, "first", "2026-10-12");
  const snapshot = planSnapshot(original);
  const replacement = reopen(setPlannedFor(original, "second", "2026-10-12"));
  assert.equal(
    replacement.looks.filter((look) => look.plannedFor === "2026-10-12").length,
    1,
  );
  assert.equal(
    replacement.looks.find((look) => look.id === "first")!.plannedFor,
    undefined,
  );
  const moved = reopen(setPlannedFor(replacement, "second", "2026-11-01"));
  assert.equal(
    plannedDays(moved, "2026-10", clock.localDate)["2026-10-12"],
    undefined,
  );
  assert.equal(
    plannedDays(moved, "2026-11", clock.localDate)["2026-11-01"]?.id,
    "second",
  );
  assert.deepEqual(
    planSnapshot(reopen(restorePlans(moved, snapshot))),
    snapshot,
  );
});

test("tomorrow is promoted across Oslo midnight without logging a premature wear", () => {
  const closet = styledCloset();
  const tomorrow = prepareTomorrow(closet, clock, { source: "unknown" });
  const session = activeSession(tomorrow.styling.today!);
  assert.ok(session.pieceIds.length);
  assert.equal(
    woreThis(tomorrow, session.revision, "2026-10-11T21:59:00Z", "early"),
    tomorrow,
  );
  const midnight = at("2026-10-11T22:00:00Z");
  const promoted = ensureToday(reopen(tomorrow), midnight);
  assert.equal(promoted.styling.today?.localDate, "2026-10-12");
  assert.deepEqual(
    activeSession(promoted.styling.today!).pieceIds,
    session.pieceIds,
  );
  assert.equal(activeSession(promoted.styling.today!).date, undefined);
});

test("unavailable or removed planned pieces are never silently replaced", () => {
  const closet = styledCloset();
  const ids = activeSession(closet.styling.today!).pieceIds;
  const saved = setPlannedFor(
    saveLook(closet, {
      id: "planned",
      name: "Mine",
      pieceIds: ids,
      createdAt: "2026-10-11T08:00:00Z",
    }),
    "planned",
    "2026-10-12",
  );
  const away = reopen(setAway(saved, ids[0]!, "wash"));
  assert.deepEqual(away.looks[0]!.pieceIds, ids);
  const request = builderRequest(away, []);
  for (const outfit of resultFor(away, request, clock.localDate).outfits)
    assert.ok(!outfit.ids.includes(ids[0]!));
  const removed = reopen(removePiece(away, ids[0]!));
  assert.deepEqual(
    plannedToday(removed, at("2026-10-12T09:00:00+02:00"))[0]?.pieceIds,
    ids,
  );
  assert.equal(
    lookEntries(removed, "en", clock.localDate).find(
      (entry) => entry.lookId === "planned",
    )?.missing,
    1,
  );
});

test("planning updates reminder names and locale without changing the look", () => {
  const closet = ownedCloset([piece("top", "top")]);
  const planned = setPlannedFor(
    saveLook(closet, {
      id: "look",
      name: "Monday work",
      pieceIds: ["top"],
      createdAt: "2026-10-11T08:00:00Z",
    }),
    "look",
    "2026-10-12",
  );
  const styling = {
    ...planned.styling,
    notification: "08:30" as const,
    weekdaysOnly: true,
  };
  for (const language of ["en", "nb"] as const) {
    const notifications = notificationSchedule(
      notificationPlan(styling, language),
      planned.looks,
      clock.localDate,
      language,
    );
    const ahead = notifications.find(
      (notification) =>
        notification.date === "2026-10-11" &&
        notification.data.day === "tomorrow",
    );
    assert.equal(ahead?.data.lookId, "look");
    assert.ok(ahead?.body.includes("Monday work"));
    assert.equal(
      notifications.some(
        (notification) =>
          notification.date === "2026-10-11" &&
          notification.data.day === "today",
      ),
      false,
    );
  }
  assert.deepEqual(
    notificationSchedule(null, planned.looks, clock.localDate, "en"),
    [],
  );
});

test("a failed plan save leaves the visible closet unchanged and the queue accepts a retry", async () => {
  const original = ownedCloset([piece("top", "top")]);
  const saved = saveLook(original, {
    id: "look",
    name: "Mine",
    pieceIds: ["top"],
    createdAt: "2026-10-11T08:00:00Z",
  });
  let raw = JSON.stringify(saved);
  let fail = true;
  const storage: ClosetStorage = {
    read: async () => raw,
    write: async (value) => {
      if (fail) throw new Error("Disk full");
      raw = value;
    },
  };
  const repository = new ClosetRepository(storage);
  await repository.load();
  let updates = 0;
  repository.subscribe(() => updates++);
  await assert.rejects(
    repository.update((current) =>
      setPlannedFor(current, "look", "2026-10-12"),
    ),
    /Disk full/,
  );
  assert.equal(repository.getSnapshot().looks[0]!.plannedFor, undefined);
  assert.equal(updates, 0);
  fail = false;
  await repository.update((current) =>
    setPlannedFor(current, "look", "2026-10-12"),
  );
  const reopened = new ClosetRepository(storage);
  await reopened.load();
  assert.equal(reopened.getSnapshot().looks[0]!.plannedFor, "2026-10-12");
  assert.equal(updates, 1);
});
