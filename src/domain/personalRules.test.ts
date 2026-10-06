import { test } from "node:test";
import assert from "node:assert/strict";
import {
  decodeCloset,
  type Closet,
  type FeedbackEvent,
  type OutfitRequest,
} from "./closet";
import { removeFromOutfit } from "./feedback";
import { answerRule, removeRule, ruleAllows, ruleToAsk } from "./personalRules";
import { activeSession, applyLook, leaveOut, resultFor } from "./today";
import { styledSample } from "./test-helpers";

const date = "2026-10-02";
const at = "2026-10-02T08:00:00.000Z";

const session = (closet: Closet) => activeSession(closet.styling.today!);

const bagIn = (closet: Closet) =>
  session(closet).pieceIds.find(
    (id) => closet.pieces.find((piece) => piece.id === id)?.kind === "handbag",
  )!;

function withBag(): Closet {
  const closet = styledSample();
  const handbag = closet.pieces.find(
    (piece) => piece.kind === "handbag" && piece.source === "sample",
  )!;
  const current = session(closet);
  return applyLook(closet, [...current.pieceIds, handbag.id], current.revision);
}

function warm(closet: Closet, low = 15, high = 25): Closet {
  return {
    ...closet,
    styling: {
      ...closet.styling,
      forecast: {
        date,
        fetchedAt: at,
        weather: {
          source: "forecast",
          warmth: "warm",
          precipitation: "dry",
          exposure: null,
          at: date,
        },
        low,
        high,
        attribution: { logo: "", url: "" },
      },
    },
  };
}

const forecastRequest = (closet: Closet): OutfitRequest => ({
  ...session(closet).request,
  weather: {
    source: "forecast",
    warmth: "warm",
    precipitation: "dry",
    exposure: null,
    at: date,
  },
});

function removal(id: string, kind: "handbag" | "blazer", feels: number) {
  return {
    id,
    at,
    kind: "removed",
    pieceIds: [],
    request: forecastRequest(styledSample()),
    removed: { id: "x", kind, role: "bag", feels },
  } satisfies FeedbackEvent;
}

test("leaving out an optional piece keeps the rest of the outfit", () => {
  const closet = withBag();
  const before = session(closet);
  const id = bagIn(closet);
  const after = session(leaveOut(closet, id, before.revision));
  assert.deepEqual(
    after.pieceIds,
    before.pieceIds.filter((item) => item !== id),
  );
  assert.ok(after.request.excludedIds.includes(id));
  assert.equal(after.revision, before.revision + 1);
});

test("required pieces are never left out", () => {
  const closet = styledSample();
  const current = session(closet);
  for (const id of current.pieceIds)
    assert.equal(leaveOut(closet, id, current.revision), closet);
});

test("a removal is recorded with its context and taught as a rejection", () => {
  const closet = warm(withBag());
  const before = session(closet);
  const id = bagIn(closet);
  const next = removeFromOutfit(closet, id, before.revision, at, "r1");
  const event = next.feedback.at(-1)!;
  assert.equal(event.kind, "removed");
  assert.deepEqual(event.removed, {
    id,
    kind: "handbag",
    role: "bag",
    feels: null,
  });
  assert.deepEqual(event.against, session(next).pieceIds);
  const other = session(next).pieceIds[0]!;
  const key = id < other ? `${id}|${other}` : `${other}|${id}`;
  assert.equal(next.styling.taste.pairs[key]?.rejected, 1);
});

test("removals note the feels-like temperature from the forecast", () => {
  const base = withBag();
  const current = session(base);
  const closet = warm(
    applyLook(
      {
        ...base,
        styling: {
          ...base.styling,
          today: {
            ...base.styling.today!,
            everyday: {
              ...current,
              request: forecastRequest(base),
            },
          },
        },
      },
      current.pieceIds,
      current.revision,
    ),
  );
  const ready = session(closet);
  const id = bagIn(closet);
  const next = removeFromOutfit(closet, id, ready.revision, at, "r1");
  assert.equal(next.feedback.at(-1)?.removed?.feels, 20);
});

test("asks once after the same kind is removed twice in similar warmth", () => {
  const closet = styledSample();
  const once = { ...closet, feedback: [removal("a", "handbag", 21)] };
  assert.equal(ruleToAsk(once), null);
  const twice = {
    ...closet,
    feedback: [
      removal("a", "handbag", 21),
      removal("b", "blazer", 2),
      removal("c", "handbag", 15.6),
    ],
  };
  assert.deepEqual(ruleToAsk(twice), { kind: "handbag", aboveTemp: 16 });
  const far = {
    ...closet,
    feedback: [removal("a", "handbag", 25), removal("b", "handbag", 2)],
  };
  assert.equal(ruleToAsk(far), null);
  const declined = answerRule(twice, ruleToAsk(twice)!, false);
  assert.equal(ruleToAsk(declined), null);
  assert.deepEqual(declined.styling.rules ?? [], []);
  const accepted = answerRule(twice, ruleToAsk(twice)!, true);
  assert.equal(ruleToAsk(accepted), null);
  assert.deepEqual(accepted.styling.rules, [
    { kind: "handbag", aboveTemp: 16 },
  ]);
  assert.equal(ruleToAsk(removeRule(accepted, "handbag")), null);
});

test("personal rules keep that kind out when it is warm enough", () => {
  const closet = warm(styledSample());
  const request = forecastRequest(closet);
  const handbag = closet.pieces.find((piece) => piece.kind === "handbag")!;
  const ruled: Closet = {
    ...closet,
    styling: { ...closet.styling, rules: [{ kind: "handbag", aboveTemp: 18 }] },
  };
  assert.equal(ruleAllows(ruled, request, date)(handbag), false);
  assert.equal(ruleAllows(warm(ruled, 5, 15), request, date)(handbag), true);
  assert.equal(
    ruleAllows(ruled, { ...request, garmentType: "handbag" }, date)(handbag),
    true,
  );
  assert.equal(
    ruleAllows(ruled, { ...request, keptIds: [handbag.id] }, date)(handbag),
    true,
  );
  assert.equal(ruleAllows(ruled, session(closet).request, date)(handbag), true);
  const kinds = resultFor(ruled, request, date).outfits.flatMap((outfit) =>
    outfit.ids.map((id) => ruled.pieces.find((piece) => piece.id === id)?.kind),
  );
  assert.ok(!kinds.includes("handbag"));
});

test("rules, prompts and removals survive a reload", () => {
  const closet = answerRule(
    { ...styledSample(), feedback: [removal("a", "handbag", 21)] },
    { kind: "handbag", aboveTemp: 18 },
    true,
  );
  const reopened = decodeCloset(JSON.stringify(closet));
  assert.deepEqual(reopened.styling.rules, [
    { kind: "handbag", aboveTemp: 18 },
  ]);
  assert.deepEqual(reopened.styling.ruleAsked, ["handbag"]);
  assert.deepEqual(reopened.feedback[0]?.removed, closet.feedback[0]?.removed);
});
