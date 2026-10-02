import { test } from "node:test";
import assert from "node:assert/strict";
import { emptyCloset, type Closet, type FeedbackEvent } from "./closet";
import { closetStats } from "./profileStats";
import { addSampleWardrobe } from "./samples";
import { setArchived } from "./wardrobe";

const samples = addSampleWardrobe(emptyCloset);

function wore(pieceIds: string[], undone = false): FeedbackEvent {
  return {
    id: pieceIds.join(),
    at: "2026-10-01T08:00:00.000Z",
    kind: "wore",
    pieceIds,
    request: {
      occasion: "work",
      style: "western",
      garmentType: null,
      keptIds: [],
      excludedIds: [],
      weather: { source: "unknown" },
      hijab: "always",
      wardrobe: "sample",
    },
    engine: "rules",
    ...(undone ? { undone } : {}),
  };
}

const withWear = (closet: Closet, events: FeedbackEvent[]): Closet => ({
  ...closet,
  feedback: events,
});

test("an empty closet has no pieces and nothing worn", () => {
  assert.deepEqual(closetStats(emptyCloset), {
    pieces: 0,
    mostWorn: [],
    neverWorn: 0,
  });
});

test("stats count the active wardrobe and leave archived pieces out", () => {
  const archived = setArchived(samples, "sample-taupe-bag", true);
  assert.equal(closetStats(samples).pieces, samples.pieces.length);
  assert.equal(closetStats(archived).pieces, samples.pieces.length - 1);
  assert.equal(
    closetStats({
      ...samples,
      styling: { ...samples.styling, wardrobe: "owned" },
    }).pieces,
    0,
  );
});

test("most worn lists the top three by wears, ties by name, and ignores undone wears", () => {
  const stats = closetStats(
    withWear(samples, [
      wore(["sample-ivory-tunic", "sample-ivory-trousers"]),
      wore(["sample-ivory-tunic", "sample-chocolate-loafers"]),
      wore(["sample-navy-blazer", "sample-ivory-tunic"]),
      wore(["sample-navy-blazer"], true),
      wore(["sample-mauve-hijab"]),
    ]),
  );
  assert.deepEqual(
    stats.mostWorn.map(({ piece, count }) => [piece.id, count]),
    [
      ["sample-ivory-tunic", 3],
      ["sample-chocolate-loafers", 1],
      ["sample-ivory-trousers", 1],
    ],
  );
  assert.equal(stats.neverWorn, samples.pieces.length - 5);
});

test("wears of removed pieces are not listed", () => {
  const stats = closetStats(withWear(samples, [wore(["gone"])]));
  assert.deepEqual(stats.mostWorn, []);
  assert.equal(stats.neverWorn, samples.pieces.length);
});
