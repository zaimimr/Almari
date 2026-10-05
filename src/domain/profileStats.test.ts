import { test } from "node:test";
import assert from "node:assert/strict";
import {
  emptyCloset,
  neutralProfile,
  type Closet,
  type FeedbackEvent,
} from "./closet";
import { filterPieces, lastWorn, noFilter } from "./closetFilters";
import { closetStats, completeness, monthWearStats } from "./profileStats";
import { addSampleWardrobe } from "./samples";
import { at, ownedCloset, piece } from "./test-helpers";
import { setArchived } from "./wardrobe";

const samples = addSampleWardrobe(emptyCloset);

function wore(
  pieceIds: string[],
  undone = false,
  when = "2026-10-01T08:00:00.000Z",
): FeedbackEvent {
  return {
    id: pieceIds.join() + when,
    at: when,
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
      wore(
        ["sample-ivory-tunic", "sample-chocolate-loafers"],
        false,
        "2026-10-02T08:00:00.000Z",
      ),
      wore(
        ["sample-navy-blazer", "sample-ivory-tunic"],
        false,
        "2026-10-03T08:00:00.000Z",
      ),
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

test("month stats list pieces worn twice in the month's outfits and variety is the share worn lately", () => {
  const closet = withWear(samples, [
    wore(["sample-ivory-tunic", "sample-ivory-trousers"]),
    wore(["sample-ivory-tunic"], false, "2026-10-02T08:00:00.000Z"),
    wore(["sample-ivory-tunic"], false, "2026-09-10T08:00:00.000Z"),
    { ...wore(["sample-navy-blazer"]), scope: "piece" },
    {
      ...wore(["sample-navy-blazer"], false, "2026-10-03T08:00:00.000Z"),
      scope: "piece",
    },
  ]);
  const stats = monthWearStats(
    closet,
    "2026-10",
    at("2026-10-14T08:00:00+02:00"),
  );
  assert.deepEqual(
    stats.mostWorn.map(({ piece, count }) => [piece.id, count]),
    [["sample-ivory-tunic", 2]],
  );
  for (const day of ["2026-10-02", "2026-10-14"]) {
    const { variety } = monthWearStats(
      closet,
      "2026-10",
      at(`${day}T08:00:00+02:00`),
    );
    const notLately = filterPieces(
      samples.pieces,
      { ...noFilter, wear: "not-worn-lately" },
      { lastWorn: lastWorn(closet), today: day },
    ).length;
    assert.equal(
      Math.round(variety! * samples.pieces.length) + notLately,
      samples.pieces.length,
    );
  }
});

test("completeness counts only questions she can answer", () => {
  const empty = completeness(emptyCloset);
  assert.equal(empty.score, 0);
  assert.deepEqual(empty.next, ["name", "hijab", "hijabStyles"]);
  const notNeeded = {
    ...emptyCloset,
    styling: {
      ...emptyCloset.styling,
      name: "Sara",
      place: { name: "Oslo", latitude: 59.91, longitude: 10.75 },
      everyday: {
        version: 1,
        occasion: "everyday" as const,
        style: "western" as const,
        hijab: "not-needed" as const,
        sample: false,
      },
      profile: {
        ...neutralProfile,
        hijabAnswered: true as const,
        coverageAnswered: true as const,
        coverageLevel: null,
        fit: "loose" as const,
        sparkle: "plain" as const,
        styleLean: "western" as const,
        colour: {
          skin: [60, 10, 20] as [number, number, number],
          hair: null,
          eyes: null,
          undertone: "warm" as const,
          depth: "medium" as const,
          contrast: "medium" as const,
          season:
            emptyCloset.styling.profile.colour?.season ??
            ("warm-autumn" as never),
          source: "measured" as const,
        },
        heightCm: null,
        bodyShape: null,
        neverWear: [],
        wearMore: [],
      },
    },
  };
  const almost = completeness(notNeeded);
  assert.deepEqual(almost.next, ["body"]);
  const body = {
    ...notNeeded,
    styling: {
      ...notNeeded.styling,
      profile: { ...notNeeded.styling.profile, heightCm: 165 },
    },
  };
  assert.equal(completeness(body).score, 100);
  assert.deepEqual(completeness(body).next, []);
  const preferNot = {
    ...notNeeded,
    styling: {
      ...notNeeded.styling,
      profile: { ...notNeeded.styling.profile, bodyAnswered: true as const },
    },
  };
  assert.equal(completeness(preferNot).score, 100);
  const unread = ownedCloset([piece("tee", "top")], preferNot);
  assert.deepEqual(completeness(unread).next, ["details"]);
  assert.ok(completeness(unread).score < 100);
});
