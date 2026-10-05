import { test } from "node:test";
import assert from "node:assert/strict";
import { emptyCloset, saveLook, type ImportJob } from "./closet";
import { closetEvents, pieceSource } from "./events";
import { woreThis } from "./feedback";
import { activeSession } from "./today";
import { ownedCloset, piece, styledSample } from "./test-helpers";

function job(id: string, extra: Partial<ImportJob> = {}): ImportJob {
  return {
    id,
    source: `${id}.jpg`,
    createdAt: "2026-10-01T08:00:00.000Z",
    state: "ready",
    attempts: 0,
    ...extra,
  };
}

test("piece source follows the import that made it", () => {
  assert.equal(pieceSource(undefined), "manual");
  assert.equal(pieceSource(job("a", { fromLink: true })), "link");
  assert.equal(pieceSource(job("a", { captureId: "scan-1" })), "scan");
  assert.equal(pieceSource(job("a", { captureId: "a" })), "photo");
  assert.equal(pieceSource(job("a-2", { captureId: "a" })), "photo");
  assert.equal(pieceSource(job("a")), "photo");
});

test("added owned pieces are tracked with source and category only", () => {
  const before = { ...emptyCloset, imports: [job("p1", { fromLink: true })] };
  const after = ownedCloset([piece("p1", "top"), piece("p2", "bottom")], {
    ...before,
    imports: [],
  });
  assert.deepEqual(closetEvents(before, after), [
    { event: "piece_added", props: { source: "manual", category: "bottom" } },
    { event: "piece_added", props: { source: "link", category: "top" } },
  ]);
});

test("onboarding, outfits, wears and looks are tracked once", () => {
  const styled = styledSample();
  const events = closetEvents(emptyCloset, styled).map((item) => item.event);
  assert.ok(events.includes("outfit_created"));
  assert.ok(!events.includes("piece_added"));

  const onboarded = {
    ...styled,
    styling: { ...styled.styling, onboarded: true },
  };
  assert.deepEqual(closetEvents(styled, onboarded), [
    { event: "onboarding_completed", props: {} },
  ]);

  const session = activeSession(onboarded.styling.today!);
  const worn = woreThis(
    onboarded,
    session.revision,
    "2026-10-02T09:00:00.000Z",
    "w1",
  );
  assert.ok(
    closetEvents(onboarded, worn).some(
      (item) =>
        item.event === "outfit_worn" &&
        item.props.occasion === session.request.occasion,
    ),
  );

  const saved = saveLook(worn, {
    id: "look-1",
    name: "Eid",
    pieceIds: session.pieceIds.slice(0, 1),
    createdAt: "2026-10-02T09:00:00.000Z",
    occasion: "eid",
  });
  assert.deepEqual(closetEvents(worn, saved), [
    { event: "look_saved", props: { pieces: 1, occasion: "eid" } },
  ]);
  assert.deepEqual(closetEvents(saved, saved), []);
});
