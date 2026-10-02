import { test } from "node:test";
import assert from "node:assert/strict";
import {
  decodeCloset,
  emptyCloset,
  type Closet,
  type Engine,
  type OutfitRequest,
  type Piece,
} from "./closet";
import { giveFeedback } from "./feedback";
import { addSampleWardrobe, sampleTraits } from "./samples";
import {
  engineChoices,
  engineFor,
  engineName,
  firstEngine,
  scorerFor,
  setEngine,
} from "./scoring/engine";
import { modelScorer } from "./scoring/modelScorer";
import { rulesScorer } from "./scoring/rulesScorer";
import {
  activeSession,
  applyRequest,
  ensureToday,
  saveEverydayStyle,
  startOver,
  tryAnother,
} from "./today";

const clock = { localDate: "2026-10-01", timeZone: "Europe/Oslo" };
const samples = addSampleWardrobe(emptyCloset);
const styled = (closet: Closet) =>
  saveEverydayStyle(
    closet,
    { occasion: "work", style: "western", hijab: "always", sample: true },
    clock,
    true,
  );
const session = (closet: Closet) => activeSession(closet.styling.today!);
const engineOf = (closet: Closet) => session(closet).engine;
const other = (engine: Engine): Engine =>
  engine === "rules" ? "model" : "rules";
const request = (changes: Partial<OutfitRequest> = {}): OutfitRequest => ({
  occasion: "work",
  style: "western",
  garmentType: null,
  keptIds: [],
  excludedIds: [],
  weather: { source: "unknown" },
  hijab: "always",
  wardrobe: "sample",
  ...changes,
});

test("the first engine of a day is fixed by the date and differs between days", () => {
  assert.equal(firstEngine("2026-10-01"), firstEngine("2026-10-01"));
  const dates = Array.from(
    { length: 14 },
    (_, index) => `2026-10-${String(index + 1).padStart(2, "0")}`,
  );
  assert.deepEqual(
    new Set(dates.map(firstEngine)),
    new Set<Engine>(["rules", "model"]),
  );
});

test("compare alternates the engine for each new suggestion", () => {
  const first = styled(setEngine(samples, "compare"));
  assert.equal(engineOf(first), firstEngine(clock.localDate));
  const second = startOver(first);
  assert.equal(engineOf(second), other(engineOf(first)!));
  const third = startOver(second);
  assert.equal(engineOf(third), engineOf(first));
  const adjusted = applyRequest(
    third,
    { ...session(third).request, occasion: "dinner" },
    session(third).revision,
  );
  assert.equal(engineOf(adjusted), other(engineOf(third)!));
});

test("try another keeps the engine of the suggestion list", () => {
  const first = styled(setEngine(samples, "compare"));
  const next = tryAnother(first, session(first).revision);
  assert.notDeepEqual(session(next).pieceIds, session(first).pieceIds);
  assert.equal(engineOf(next), engineOf(first));
});

test("fixed pattern per day: a restart replays it and a new day starts over", () => {
  const run = () => startOver(startOver(styled(setEngine(samples, "compare"))));
  const replay = run();
  assert.equal(engineOf(replay), engineOf(run()));
  assert.equal(ensureToday(replay, clock), replay);
  const tomorrow = ensureToday(run(), { ...clock, localDate: "2026-10-02" });
  assert.equal(engineOf(tomorrow), firstEngine("2026-10-02"));
});

test("rules and model choices always use that engine", () => {
  for (const engine of ["rules", "model"] as const) {
    const closet = styled(setEngine(samples, engine));
    assert.equal(engineOf(closet), engine);
    assert.equal(engineOf(startOver(closet)), engine);
  }
  assert.equal(scorerFor("model"), modelScorer);
  assert.equal(scorerFor("rules"), rulesScorer);
  assert.deepEqual(engineChoices.map(engineName), [
    "Rules",
    "Model",
    "Compare",
  ]);
});

test("model falls back to rules when a piece that could be suggested has no reading", () => {
  const plain: Piece = {
    id: "owned-top",
    name: "Plain top",
    category: "top",
    photo: "plain.jpg",
    createdAt: "2026-10-01T08:00:00.000Z",
    source: "owned",
    styles: ["western"],
  };
  const closet = {
    ...setEngine(samples, "model"),
    pieces: [...samples.pieces, plain],
  };
  assert.equal(
    engineFor(closet, request({ wardrobe: "owned" }), clock.localDate, null),
    "rules",
  );
  assert.equal(
    engineFor(
      closet,
      request({ wardrobe: "owned", style: "desi" }),
      clock.localDate,
      null,
    ),
    "model",
  );
  assert.equal(engineFor(closet, request(), clock.localDate, null), "model");
});

test("the engine choice is stored and older closets default to rules", () => {
  const stored = setEngine(samples, "compare");
  assert.equal(setEngine(stored, "compare"), stored);
  assert.equal(
    decodeCloset(JSON.stringify(stored), sampleTraits).styling.engine,
    "compare",
  );
  const { engine: _engine, ...older } = stored.styling;
  assert.equal(
    decodeCloset(JSON.stringify({ ...stored, styling: older }), sampleTraits)
      .styling.engine,
    "rules",
  );
});

test("feedback records the engine and position of the suggestion", () => {
  const first = styled(setEngine(samples, "compare"));
  const next = tryAnother(first, session(first).revision);
  const rated = giveFeedback(
    next,
    "not-my-style",
    session(next).revision,
    "2026-10-01T08:00:00.000Z",
    "f1",
  );
  const event = rated.feedback.at(-1)!;
  assert.equal(event.engine, engineOf(next));
  assert.equal(event.cursor, 1);
  assert.equal(event.request.style, "western");
  const reopened = decodeCloset(JSON.stringify(rated), sampleTraits);
  assert.equal(reopened.feedback.at(-1)!.cursor, 1);
});

test("an away or archived piece without a reading does not keep Model from running", () => {
  const plain: Piece = {
    id: "owned-top",
    name: "Plain top",
    category: "top",
    photo: "plain.jpg",
    createdAt: "2026-10-01T08:00:00.000Z",
    source: "owned",
    styles: ["desi"],
    status: "archived",
  };
  const closet = {
    ...setEngine(samples, "model"),
    pieces: [...samples.pieces, plain],
  };
  assert.equal(
    engineFor(
      closet,
      request({ wardrobe: "owned", style: "desi" }),
      clock.localDate,
      null,
    ),
    "model",
  );
  const away = {
    ...closet,
    pieces: [
      ...samples.pieces,
      { ...plain, status: "away" as const, away: "wash" as const },
    ],
  };
  assert.equal(
    engineFor(
      away,
      request({ wardrobe: "owned", style: "desi" }),
      clock.localDate,
      null,
    ),
    "model",
  );
});
