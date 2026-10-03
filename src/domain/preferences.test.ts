import { test } from "node:test";
import assert from "node:assert/strict";
import { neutralProfile } from "./closet";
import { sparkleOf } from "./facts";
import { isNeverWear, wearMoreIds } from "./preferences";
import { rulesScorer } from "./scoring/rulesScorer";
import { scoreContext } from "./scoring/taste";
import { ownedCloset, piece } from "./test-helpers";

const black = { rgb: [20, 20, 22] as [number, number, number], share: 1 };

test("a never-wear colour on clothes keeps black hijabs", () => {
  const profile = {
    ...neutralProfile,
    neverWear: [
      { colour: "Black", on: "clothes" as const },
      { kind: "skirt" as const },
      { pattern: "stripe" as const },
    ],
  };
  assert.equal(
    isNeverWear(profile, piece("top", "top", { colors: [black] })),
    true,
  );
  assert.equal(
    isNeverWear(
      profile,
      piece("hijab", "hijab", { kind: "hijab", colors: [black] }),
    ),
    false,
  );
  assert.equal(
    isNeverWear(
      { ...neutralProfile, neverWear: [{ colour: "Black", on: "hijabs" }] },
      piece("hijab", "hijab", { kind: "hijab", colors: [black] }),
    ),
    true,
  );
  assert.equal(
    isNeverWear(profile, piece("skirt", "bottom", { kind: "skirt" })),
    true,
  );
  assert.equal(
    isNeverWear(
      profile,
      piece("tee", "top", { attributes: { pattern: "stripe" } }),
    ),
    true,
  );
  assert.equal(
    isNeverWear(
      profile,
      piece("tee2", "top", { attributes: { pattern: "solid" } }),
    ),
    false,
  );
});

test("wear more drops pieces that are gone, put away or sample", () => {
  const closet = ownedCloset([
    piece("a", "top"),
    piece("b", "top", { status: "archived" }),
  ]);
  const withList = {
    ...closet,
    styling: {
      ...closet.styling,
      profile: { ...neutralProfile, wearMore: ["a", "b", "gone"] },
    },
  };
  assert.deepEqual(wearMoreIds(withList), ["a"]);
});

test("sparkle maps the embellishment and is read for events only", () => {
  const plain = piece("k1", "tunic", {
    kind: "kameez",
    styles: ["desi"],
    attributes: { embellishment: "none" },
  });
  const heavy = piece("k2", "tunic", {
    kind: "kameez",
    styles: ["desi"],
    attributes: { embellishment: "heavy" },
  });
  assert.equal(sparkleOf(plain), "plain");
  assert.equal(sparkleOf(heavy), "heavy");
  assert.equal(sparkleOf(piece("k3", "tunic")), null);
  const request = (occasion: "everyday" | "eid") => ({
    occasion,
    style: "desi" as const,
    garmentType: null,
    keptIds: [],
    excludedIds: [],
    weather: { source: "unknown" as const },
    hijab: null,
    wardrobe: "owned" as const,
  });
  const scoreWith = (
    level: "plain" | "heavy",
    occasion: "everyday" | "eid",
    outfit: typeof heavy,
  ) => {
    const closet = ownedCloset([outfit]);
    const context = scoreContext({
      ...closet,
      styling: {
        ...closet.styling,
        profile: { ...neutralProfile, sparkle: level },
      },
    });
    return rulesScorer.score([outfit], request(occasion), context).score;
  };
  assert.equal(
    scoreWith("plain", "everyday", heavy),
    scoreWith("heavy", "everyday", heavy),
  );
  assert.ok(
    scoreWith("heavy", "eid", heavy) > scoreWith("plain", "eid", heavy),
  );
  assert.ok(
    scoreWith("heavy", "eid", heavy) > scoreWith("heavy", "eid", plain),
  );
});
