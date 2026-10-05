import { test } from "node:test";
import assert from "node:assert/strict";
import type { AdviceReason, Quality } from "./closet";
import { en } from "../i18n/en";
import { nb } from "../i18n/nb";
import {
  adviceFor,
  adviceReason,
  blurBelow,
  darkBelow,
  mergedAbove,
  mixedLightAbove,
} from "./quality";

const clear: Quality = {
  sharpness: 240,
  brightness: 0.55,
  clipped: [],
  coverage: 0.3,
  lightSpread: 2,
};

test("a clear photo gets no advice", () => {
  assert.equal(adviceReason(clear), null);
  assert.equal(adviceReason(null), null);
  assert.equal(adviceReason(undefined), null);
});

test("P05 each problem gets its own specific advice", () => {
  const cases: [Partial<Quality>, AdviceReason][] = [
    [{ coverage: 0.96 }, "merged"],
    [{ clipped: ["bottom"] }, "clipped"],
    [{ sharpness: 20 }, "blur"],
    [{ brightness: 0.1 }, "dark"],
    [{ lightSpread: 14 }, "mixed-light"],
  ];
  const titles = new Set<string>();
  for (const [change, reason] of cases) {
    assert.equal(adviceReason({ ...clear, ...change }), reason);
    const advice = adviceFor(reason);
    assert.equal(advice.reason, reason);
    for (const key of [advice.title, advice.body]) {
      assert.ok(en[key].length > 0, key);
      assert.ok(nb[key].length > 0, key);
    }
    titles.add(en[advice.title]);
  }
  assert.equal(titles.size, cases.length);
});

test("several problems still give one message, the most useful first", () => {
  assert.equal(
    adviceReason({
      ...clear,
      coverage: 0.97,
      clipped: ["top", "bottom", "left", "right"],
    }),
    "merged",
  );
  assert.equal(
    adviceReason({
      ...clear,
      clipped: ["left", "bottom"],
      sharpness: 10,
      brightness: 0.05,
    }),
    "clipped",
  );
  assert.equal(
    adviceReason({
      ...clear,
      sharpness: 10,
      brightness: 0.05,
      lightSpread: 20,
    }),
    "dark",
  );
  assert.equal(
    adviceReason({ ...clear, sharpness: 10, lightSpread: 20 }),
    "blur",
  );
  assert.equal(
    adviceReason({ ...clear, brightness: 0.05, lightSpread: 20 }),
    "dark",
  );
});

test("values exactly at a threshold do not trigger advice", () => {
  assert.equal(
    adviceReason({
      ...clear,
      sharpness: blurBelow,
      brightness: darkBelow,
      coverage: mergedAbove,
      lightSpread: mixedLightAbove,
    }),
    null,
  );
});

test("missing coverage and light measurements never trigger advice", () => {
  assert.equal(
    adviceReason({ ...clear, coverage: null, lightSpread: null }),
    null,
  );
});
