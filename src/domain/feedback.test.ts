import { test } from "node:test";
import assert from "node:assert/strict";
import {
  emptyCloset,
  neutralProfile,
  removePiece,
  type Closet,
} from "./closet";
import {
  giveFeedback,
  recordSaved,
  saveProfile,
  swapPiece,
  undoFeedback,
  woreThis,
  wornNow,
} from "./feedback";
import { addSampleWardrobe } from "./samples";
import { baseWeights, rulesScorer } from "./scoring/rulesScorer";
import { scoreContext, tasteLimit, weightOf } from "./scoring/taste";
import { replacementsFor } from "./styling";
import {
  activeSession,
  resultFor,
  saveEverydayStyle,
  startOccasion,
} from "./today";

const clock = { localDate: "2026-10-01", timeZone: "Europe/Oslo" };
const at = "2026-10-01T08:00:00.000Z";

function styled(occasion: "work" | "dinner" = "work"): Closet {
  return saveEverydayStyle(
    addSampleWardrobe(emptyCloset),
    { occasion, style: "western", hijab: "always", sample: true },
    clock,
    true,
  );
}

const session = (closet: Closet) => activeSession(closet.styling.today!);

function within(closet: Closet) {
  const bases = baseWeights(closet.styling.profile);
  for (const [id, base] of Object.entries(bases))
    assert.ok(
      Math.abs(weightOf(id, base, closet.styling.taste) - base) <=
        tasteLimit + 1e-9,
      id,
    );
}

test("Too formal records the event and moves to a less formal outfit for the same request", () => {
  const closet = styled("work");
  const before = session(closet);
  const after = giveFeedback(closet, "too-formal", before.revision, at, "f1");
  const next = session(after);
  assert.notDeepEqual(next.pieceIds, before.pieceIds);
  assert.deepEqual(next.request, before.request);
  assert.deepEqual(next.previousPieceIds, before.pieceIds);
  assert.equal(after.feedback.length, 1);
  assert.equal(after.feedback[0]!.kind, "too-formal");
  assert.equal(after.feedback[0]!.engine, "rules");
  assert.deepEqual(after.feedback[0]!.pieceIds, before.pieceIds);
  assert.deepEqual(after.feedback[0]!.against, next.pieceIds);
  assert.notDeepEqual(after.styling.taste.weights, {});
  assert.equal(
    giveFeedback(after, "too-formal", before.revision, at, "f2"),
    after,
  );
});

test("twenty Not my style taps on one outfit stay within the limit and blacklist nothing", () => {
  let closet = styled("work");
  const rejected = session(closet).pieceIds;
  for (let index = 0; index < 20; index++)
    closet = {
      ...closet,
      styling: {
        ...closet.styling,
        today: {
          ...closet.styling.today!,
          everyday: { ...session(closet), pieceIds: rejected },
        },
      },
    };
  for (let index = 0; index < 20; index++) {
    const current = session(closet);
    closet = giveFeedback(
      {
        ...closet,
        styling: {
          ...closet.styling,
          today: {
            ...closet.styling.today!,
            everyday: { ...current, pieceIds: rejected },
          },
        },
      },
      "not-my-style",
      current.revision,
      at,
      `n${index}`,
    );
  }
  assert.equal(closet.feedback.length, 20);
  within(closet);
  const outfits = resultFor(
    closet,
    session(closet).request,
    clock.localDate,
  ).outfits;
  assert.notDeepEqual(outfits[0]!.ids, rejected);
  for (const id of rejected)
    assert.ok(
      outfits.some((outfit) => outfit.ids.includes(id)),
      `${id} is still suggested`,
    );
});

test("Wore this counts once, boosts less-worn pieces and undo puts everything back", () => {
  const closet = styled("work");
  const current = session(closet);
  const worn = woreThis(closet, current.revision, at, "w1");
  assert.equal(worn.feedback.length, 1);
  assert.equal(wornNow(worn)?.id, "w1");
  assert.equal(woreThis(worn, current.revision, at, "w2"), worn);
  assert.deepEqual(
    scoreContext(worn).wear,
    Object.fromEntries(current.pieceIds.map((id) => [id, 1])),
  );
  const undone = undoFeedback(worn, "w1");
  assert.equal(wornNow(undone), null);
  assert.deepEqual(scoreContext(undone).wear, {});
  assert.deepEqual(undone.styling.taste, closet.styling.taste);
  assert.equal(undoFeedback(undone, "w1"), undone);
});

test("ten Wore this events on one outfit raise its rules and stay within the limit", () => {
  let closet = styled("work");
  const current = session(closet);
  for (let index = 0; index < 10; index++)
    closet = {
      ...closet,
      feedback: [
        ...closet.feedback,
        {
          id: `w${index}`,
          at,
          kind: "wore",
          pieceIds: current.pieceIds,
          request: current.request,
          engine: "rules",
          against: resultFor(closet, current.request, clock.localDate)
            .outfits[1]!.ids,
        },
      ],
    };
  const learned = saveProfile(closet, neutralProfile);
  within(learned);
  assert.ok(
    Object.values(learned.styling.taste.pairs).every(
      (pair) => pair.worn === 10,
    ),
  );
  const top = resultFor(learned, current.request, clock.localDate).outfits[0]!;
  assert.deepEqual(top.ids, current.pieceIds);
  assert.ok(top.reasons.some((reason) => reason.startsWith("You often wear")));
});

test("swapping a piece and saving today's look count as feedback", () => {
  const closet = styled("work");
  const current = session(closet);
  const hijab = current.pieceIds.find((id) => id.includes("hijab"))!;
  const option = replacementsFor(
    closet.pieces,
    current.request,
    current.pieceIds,
    hijab,
    rulesScorer,
    scoreContext(closet),
  )[0]!.piece.id;
  const swapped = swapPiece(closet, hijab, option, current.revision, at, "s1");
  assert.equal(swapped.feedback[0]!.kind, "swap");
  assert.deepEqual(swapped.feedback[0]!.swap, { from: hijab, to: option });
  assert.deepEqual(swapped.feedback[0]!.against, current.pieceIds);
  const saved = recordSaved(swapped, session(swapped).pieceIds, at, "s2");
  assert.equal(saved.feedback[1]!.kind, "saved");
  assert.equal(recordSaved(closet, ["sample-taupe-bag"], at, "s3"), closet);
});

test("feedback on an occasion keeps the occasion request", () => {
  const base = styled("work");
  const occasion = startOccasion(base, {
    ...session(base).request,
    occasion: "party",
    style: "desi",
  });
  const current = session(occasion);
  const after = giveFeedback(occasion, "too-plain", current.revision, at, "p1");
  assert.equal(after.styling.today!.active, "occasion");
  assert.equal(after.feedback[0]!.request.occasion, "party");
  assert.deepEqual(
    after.styling.today!.everyday,
    occasion.styling.today!.everyday,
  );
});

test("changing a style setting keeps the feedback history and rebuilds taste", () => {
  const closet = giveFeedback(
    styled("work"),
    "not-my-style",
    session(styled("work")).revision,
    at,
    "x1",
  );
  const changed = saveProfile(closet, {
    ...neutralProfile,
    printOnPrint: true,
  });
  assert.equal(changed.feedback.length, 1);
  assert.equal(changed.styling.profile.printOnPrint, true);
  within(changed);
});

test("feedback about a piece that was later deleted still replays and undoes", () => {
  const closet = styled("work");
  const current = session(closet);
  const worn = woreThis(closet, current.revision, at, "d1");
  const removed = removePiece(worn, current.pieceIds[0]!);
  const undone = undoFeedback(removed, "d1");
  assert.equal(undone.feedback[0]!.undone, true);
  assert.deepEqual(undone.styling.taste, { weights: {}, pairs: {} });
  assert.equal(session(undone).engine, "rules");
});

test("an outfit worn on an earlier day can be worn again today", () => {
  const closet = styled("work");
  const current = session(closet);
  const worn = woreThis(closet, current.revision, at, "w1");
  const nextDay: Closet = {
    ...worn,
    styling: {
      ...worn.styling,
      today: { ...worn.styling.today!, localDate: "2026-10-05" },
    },
  };
  assert.equal(wornNow(nextDay), null);
  const again = woreThis(
    nextDay,
    current.revision,
    "2026-10-05T08:00:00.000Z",
    "w2",
  );
  assert.equal(again.feedback.length, 2);
  assert.equal(wornNow(again)?.id, "w2");
});
