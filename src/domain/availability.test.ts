import { test } from "node:test";
import assert from "node:assert/strict";
import {
  decodeCloset,
  emptyCloset,
  isAvailable,
  removePiece,
  saveLook,
  savePiece,
  setAway,
  usedIn,
  type Closet,
  type Piece,
} from "./closet";
import { addSampleWardrobe } from "./samples";
import { replacementsFor } from "./styling";
import {
  activeSession,
  dropFromToday,
  resultFor,
  saveEverydayStyle,
  toggleKeep,
} from "./today";

const clock = { localDate: "2026-10-01", timeZone: "Europe/Oslo" };
const samples = addSampleWardrobe(emptyCloset);
const byId = (closet: Closet, id: string) =>
  closet.pieces.find((piece) => piece.id === id)!;
const styled = (closet: Closet) =>
  saveEverydayStyle(
    closet,
    { occasion: "work", style: "western", hijab: "always", sample: true },
    clock,
    true,
  );
const sessionOf = (closet: Closet) => activeSession(closet.styling.today!);
const hijabIn = (closet: Closet) =>
  sessionOf(closet).pieceIds.find((id) => byId(closet, id).kind === "hijab")!;
const office = {
  id: "office",
  name: "Office",
  pieceIds: ["sample-mauve-hijab", "sample-ivory-tunic"],
  createdAt: clock.localDate,
};

test("marking a piece unavailable is reversible, survives reopening and is separate from removing", () => {
  const closet = saveLook(samples, office);
  const away = setAway(closet, "sample-mauve-hijab", "wash");
  const piece = byId(away, "sample-mauve-hijab");
  assert.equal(piece.status, "away");
  assert.equal(piece.away, "wash");
  assert.equal(isAvailable(piece), false);
  assert.equal(isAvailable(byId(away, "sample-ivory-tunic")), true);
  assert.equal(away.pieces.length, closet.pieces.length);
  assert.deepEqual(away.looks, closet.looks);
  assert.equal(
    byId(setAway(away, "sample-mauve-hijab", "repair"), "sample-mauve-hijab")
      .away,
    "repair",
  );
  assert.deepEqual(setAway(away, "sample-mauve-hijab", null), closet);
  assert.equal(setAway(closet, "gone", "lent"), closet);
  assert.equal(
    byId(decodeCloset(JSON.stringify(away)), "sample-mauve-hijab").away,
    "wash",
  );
  assert.equal(
    removePiece(away, "sample-mauve-hijab").pieces.length,
    closet.pieces.length - 1,
  );
});

test("an unavailable piece needs a known reason and a reason needs the status", () => {
  const piece = byId(samples, "sample-mauve-hijab");
  for (const wrong of [
    { status: "away" },
    { status: "away", away: "holiday" },
    { away: "wash" },
    { status: "gone", away: "wash" },
  ])
    assert.throws(() =>
      savePiece(samples, { ...piece, ...wrong } as unknown as Piece),
    );
  assert.equal(
    byId(
      savePiece(samples, { ...piece, status: "away", away: "lent" }),
      piece.id,
    ).away,
    "lent",
  );
});

test("used in counts the saved looks that contain the piece", () => {
  const closet = saveLook(saveLook(samples, office), {
    ...office,
    id: "weekend",
    name: "Weekend",
    pieceIds: ["sample-mauve-hijab"],
  });
  assert.equal(usedIn(closet, "sample-mauve-hijab"), 2);
  assert.equal(usedIn(closet, "sample-ivory-tunic"), 1);
  assert.equal(usedIn(closet, "sample-taupe-bag"), 0);
  assert.equal(usedIn(closet, "gone"), 0);
});

test("unavailable pieces are left out of suggestions and Change a piece", () => {
  const today = styled(samples);
  const session = sessionOf(today);
  const hijab = hijabIn(today);
  const suggested = (closet: Closet) =>
    resultFor(closet, session.request, clock.localDate).outfits.map(
      (outfit) => outfit.ids,
    );
  assert.ok(suggested(today).some((ids) => ids.includes(hijab)));
  const away = setAway(today, hijab, "wash");
  assert.ok(suggested(away).length);
  assert.equal(
    suggested(away).some((ids) => ids.includes(hijab)),
    false,
  );
  const options = (closet: Closet) =>
    replacementsFor(
      closet.pieces,
      session.request,
      session.pieceIds,
      hijab,
    ).map((option) => option.piece.id);
  const before = options(today);
  assert.ok(before.length >= 2);
  const other = before[0]!;
  assert.deepEqual(
    options(setAway(today, other, "lent")),
    before.filter((id) => id !== other),
  );
});

test("marking a piece on today's outfit unavailable restyles Today without it", () => {
  const today = styled(samples);
  const before = sessionOf(today);
  const hijab = hijabIn(today);
  const next = dropFromToday(setAway(today, hijab, "wash"), hijab);
  const after = sessionOf(next);
  assert.equal(after.pieceIds.includes(hijab), false);
  assert.ok(after.pieceIds.some((id) => byId(next, id).kind === "hijab"));
  assert.equal(after.revision, before.revision + 1);
  assert.equal(dropFromToday(next, hijab), next);
  const notShown = samples.pieces.find(
    (piece) => !before.pieceIds.includes(piece.id),
  )!.id;
  const quiet = setAway(today, notShown, "lent");
  assert.equal(dropFromToday(quiet, notShown), quiet);
});

test("a kept piece that becomes unavailable stays on Today and is explained with a release", () => {
  const today = styled(samples);
  const hijab = hijabIn(today);
  const away = setAway(toggleKeep(today, hijab), hijab, "lent");
  assert.equal(dropFromToday(away, hijab), away);
  const session = sessionOf(away);
  assert.ok(session.pieceIds.includes(hijab));
  const result = resultFor(away, session.request, clock.localDate);
  assert.equal(result.status, "missing");
  assert.equal(result.problems[0]!.code, "kept-missing");
  assert.equal(
    result.problems[0]!.message,
    "A piece you chose to keep is marked unavailable or archived.",
  );
  assert.deepEqual(result.problems[0]!.actions, [
    { type: "release", id: hijab },
  ]);
});

test("a kept piece that became unavailable does not break Change a piece for another piece", () => {
  const today = styled(samples);
  const session = sessionOf(today);
  const hijab = hijabIn(today);
  const other = session.pieceIds.find((id) => id !== hijab)!;
  const away = setAway(toggleKeep(today, hijab), hijab, "lent");
  assert.doesNotThrow(() =>
    replacementsFor(away.pieces, session.request, session.pieceIds, other),
  );
});
