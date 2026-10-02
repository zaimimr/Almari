import { test } from "node:test";
import assert from "node:assert/strict";
import {
  decodeCloset,
  emptyCloset,
  emptyTaste,
  neutralProfile,
  settingKeys,
} from "./closet";
import { addSampleWardrobe } from "./samples";

test("a closet saved before the stylist opens with neutral settings and no feedback", () => {
  const raw = JSON.parse(JSON.stringify(addSampleWardrobe(emptyCloset)));
  delete raw.feedback;
  for (const key of settingKeys) delete raw.styling.profile[key];
  delete raw.styling.taste;
  delete raw.styling.engine;
  const closet = decodeCloset(JSON.stringify(raw));
  assert.deepEqual(closet.styling.profile, neutralProfile);
  assert.deepEqual(closet.styling.taste, emptyTaste);
  assert.equal(closet.styling.engine, "rules");
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
