import { test } from "node:test";
import assert from "node:assert/strict";
import { guideLimits, selfieGuide, type CameraReading } from "./selfieGuide";

const good: CameraReading = {
  face: { x: 0.3, y: 0.22, width: 0.4, height: 0.4 },
  brightness: 0.5,
  yaw: 0,
  roll: 0,
  motion: 0,
};
const read = (changes: Partial<CameraReading>) => ({ ...good, ...changes });
const face = (x: number, y: number, size: number) => ({
  x: x - size / 2,
  y: y - size / 2,
  width: size,
  height: size,
});

test("a centred, bright, still face that fills the guide is ready", () => {
  assert.equal(selfieGuide(good), "ready");
});

test("no face asks her to look into the camera", () => {
  assert.equal(selfieGuide(read({ face: null })), "find");
});

test("a dark face asks for more light before anything else", () => {
  assert.equal(
    selfieGuide(read({ brightness: guideLimits.dark - 0.01, motion: 1 })),
    "dark",
  );
  assert.equal(selfieGuide(read({ brightness: guideLimits.dark })), "ready");
  assert.equal(selfieGuide(read({ brightness: null })), "ready");
});

test("a small face asks her to move closer and a large one to move back", () => {
  const { x, y } = guideLimits.centre;
  assert.equal(
    selfieGuide(read({ face: face(x, y, guideLimits.small - 0.01) })),
    "closer",
  );
  assert.equal(
    selfieGuide(read({ face: face(x, y, guideLimits.small) })),
    "ready",
  );
  assert.equal(
    selfieGuide(read({ face: face(x, y, guideLimits.large) })),
    "ready",
  );
  assert.equal(
    selfieGuide(read({ face: face(x, y, guideLimits.large + 0.01) })),
    "back",
  );
});

test("a face away from the guide asks her to centre it", () => {
  const { x, y } = guideLimits.centre;
  const off = guideLimits.offset + 0.01;
  assert.equal(selfieGuide(read({ face: face(x + off, y, 0.4) })), "centre");
  assert.equal(selfieGuide(read({ face: face(x, y - off, 0.4) })), "centre");
  assert.equal(
    selfieGuide(read({ face: face(x + guideLimits.offset, y, 0.4) })),
    "ready",
  );
});

test("a turned or tilted head asks her to face the camera", () => {
  assert.equal(selfieGuide(read({ yaw: guideLimits.turn + 1 })), "straight");
  assert.equal(selfieGuide(read({ roll: -guideLimits.tilt - 1 })), "straight");
  assert.equal(selfieGuide(read({ yaw: null, roll: null })), "ready");
});

test("movement asks her to hold still", () => {
  assert.equal(
    selfieGuide(read({ motion: guideLimits.motion + 0.001 })),
    "still",
  );
  assert.equal(selfieGuide(read({ motion: guideLimits.motion })), "ready");
});
