import { test } from "node:test";
import assert from "node:assert/strict";
import { motionTokens } from "../ui/motionTokens";

test("motion tokens match motion.md", () => {
  assert.deepEqual(motionTokens.duration, {
    quick: 160,
    base: 240,
    settle: 320,
    arrange: 420,
    drape: 640,
    sheen: 1100,
  });
  assert.deepEqual(motionTokens.timer, {
    wait: 300,
    dwell: 700,
    step: 60,
    linger: 1500,
    announce: 2000,
    loop: 5000,
  });
  assert.deepEqual(motionTokens.easing, {
    silk: [0.22, 0.61, 0.36, 1],
    fall: [0.16, 1, 0.3, 1],
    carry: [0.5, 0, 0.2, 1],
    release: [0.32, 0, 0.67, 0],
  });
});

test("no easing curve overshoots", () => {
  for (const [, y1, , y2] of Object.values(motionTokens.easing)) {
    assert.ok(y1 <= 1 && y2 <= 1);
  }
});
