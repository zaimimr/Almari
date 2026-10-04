import { test } from "node:test";
import assert from "node:assert/strict";
import {
  decodeCloset,
  emptyCloset,
  emptyTaste,
  neutralProfile,
  settingKeys,
} from "./closet";
import { giveFeedback } from "./feedback";
import { addSampleWardrobe } from "./samples";
import { activeSession, saveEverydayStyle } from "./today";

test("a closet saved before the stylist opens with neutral settings and no feedback", () => {
  const raw = JSON.parse(JSON.stringify(addSampleWardrobe(emptyCloset)));
  delete raw.feedback;
  for (const key of settingKeys) delete raw.styling.profile[key];
  delete raw.styling.taste;
  const closet = decodeCloset(JSON.stringify(raw));
  assert.deepEqual(closet.styling.profile, neutralProfile);
  assert.deepEqual(closet.styling.taste, emptyTaste);
  assert.deepEqual(closet.feedback, []);
  assert.deepEqual(emptyCloset.styling.profile, neutralProfile);
  assert.equal(neutralProfile.printOnPrint, null);
  assert.deepEqual(neutralProfile.avoidAtWeddings, []);
});

test("saved style settings, taste, feedback and a look occasion survive a round trip", () => {
  const closet = {
    ...emptyCloset,
    looks: [
      {
        id: "look-1",
        name: "Green Eid kurta",
        pieceIds: ["a", "b"],
        createdAt: "2026-10-01T08:00:00.000Z",
        occasion: "eid" as const,
      },
    ],
    styling: {
      ...emptyCloset.styling,
      profile: {
        ...neutralProfile,
        printOnPrint: true,
        avoidAtWeddings: ["white" as const],
      },
      taste: {
        weights: { "tonal-steps": 0.7 },
        pairs: { "a|b": { worn: 2, rejected: 0 } },
      },
    },
  };
  assert.deepEqual(decodeCloset(JSON.stringify(closet)), closet);
});

test("broken style settings, taste or feedback keep the closet unreadable instead of empty", () => {
  const raw = JSON.parse(JSON.stringify(addSampleWardrobe(emptyCloset)));
  const broken = (changes: Record<string, unknown>) =>
    JSON.stringify({ ...raw, ...changes });
  assert.throws(() =>
    decodeCloset(
      broken({
        styling: {
          ...raw.styling,
          profile: { ...raw.styling.profile, bottoms: "kilts" },
        },
      }),
    ),
  );
  assert.throws(() =>
    decodeCloset(
      broken({
        styling: {
          ...raw.styling,
          taste: { weights: { a: "high" }, pairs: {} },
        },
      }),
    ),
  );
  assert.throws(() => decodeCloset(broken({ feedback: [{ id: "x" }] })));
});

test("a feedback event whose cursor is not a whole number keeps the closet unreadable", () => {
  const closet = saveEverydayStyle(
    addSampleWardrobe(emptyCloset),
    { occasion: "work", style: "western", hijab: "always", sample: true },
    { localDate: "2026-10-01", timeZone: "Europe/Oslo" },
    true,
  );
  const revision = activeSession(closet.styling.today!).revision;
  const rated = giveFeedback(
    closet,
    "too-formal",
    revision,
    "2026-10-01T08:00:00.000Z",
    "f1",
  );
  const raw = JSON.parse(JSON.stringify(rated));
  assert.doesNotThrow(() => decodeCloset(JSON.stringify(raw)));
  raw.feedback[0].cursor = 1.5;
  assert.throws(() => decodeCloset(JSON.stringify(raw)));
});

test("a closet saved with the Model or Compare stylist still opens and drops the choice", () => {
  const closet = saveEverydayStyle(
    addSampleWardrobe(emptyCloset),
    { occasion: "work", style: "western", hijab: "always", sample: true },
    { localDate: "2026-10-01", timeZone: "Europe/Oslo" },
    true,
  );
  const rated = giveFeedback(
    closet,
    "too-formal",
    activeSession(closet.styling.today!).revision,
    "2026-10-01T08:00:00.000Z",
    "f1",
  );
  for (const engine of ["compare", "model"]) {
    const raw = JSON.parse(JSON.stringify(rated));
    raw.styling.engine = engine;
    raw.styling.today.everyday.engine = "model";
    raw.feedback[0].engine = "model";
    const opened = decodeCloset(JSON.stringify(raw));
    assert.equal("engine" in opened.styling, false);
    assert.equal(opened.feedback.length, 1);
    assert.deepEqual(
      activeSession(opened.styling.today!).pieceIds,
      activeSession(rated.styling.today!).pieceIds,
    );
  }
});
