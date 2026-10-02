import { test } from "node:test";
import assert from "node:assert/strict";
import { emptyCloset, saveLook, setAway, type Closet } from "./closet";
import { undoFeedback, woreThis } from "./feedback";
import { lookEntries } from "./looks";
import { addSampleWardrobe } from "./samples";
import { activeSession, saveEverydayStyle, stylePiece } from "./today";

const clock = { localDate: "2026-10-01", timeZone: "Europe/Oslo" };

function styled(): Closet {
  return saveEverydayStyle(
    addSampleWardrobe(emptyCloset),
    { occasion: "work", style: "western", hijab: "always", sample: true },
    clock,
    true,
  );
}

test("saved looks and worn outfits are one list with names and occasions", () => {
  const closet = styled();
  const session = activeSession(closet.styling.today!);
  const worn = woreThis(
    closet,
    session.revision,
    "2026-10-01T09:00:00.000Z",
    "w1",
  );
  const saved = saveLook(worn, {
    id: "look-1",
    name: "Eid at home",
    pieceIds: ["sample-sage-kurta", "sample-ivory-salwar"],
    createdAt: "2026-10-01T08:00:00.000Z",
    occasion: "eid",
  });
  assert.deepEqual(
    lookEntries(saved, "en").map((entry) => [
      entry.id,
      entry.name,
      entry.occasion,
      entry.saved,
    ]),
    [
      ["worn-w1", "Ivory work tunic", "work", false],
      ["look-1", "Eid at home", "eid", true],
    ],
  );
  assert.equal(lookEntries(saved, "nb")[0]!.name.endsWith(" til jobb"), true);
});

test("a worn outfit that matches a saved look shows once, and undo removes it", () => {
  const closet = styled();
  const session = activeSession(closet.styling.today!);
  const worn = woreThis(
    closet,
    session.revision,
    "2026-10-01T09:00:00.000Z",
    "w1",
  );
  const saved = saveLook(worn, {
    id: "look-2",
    name: "Monday",
    pieceIds: [...session.pieceIds].reverse(),
    createdAt: "2026-10-01T10:00:00.000Z",
  });
  assert.deepEqual(
    lookEntries(saved, "en").map((entry) => [entry.id, entry.occasion]),
    [["look-2", null]],
  );
  assert.deepEqual(lookEntries(undoFeedback(worn, "w1"), "en"), []);
});

test("Style this piece keeps the piece and leaves the everyday outfit as it was", () => {
  const closet = styled();
  const everyday = closet.styling.today!.everyday;
  const next = stylePiece(closet, "sample-sage-kurta", clock);
  const today = next.styling.today!;
  assert.equal(today.active, "occasion");
  assert.deepEqual(today.everyday, everyday);
  const session = activeSession(today);
  assert.deepEqual(session.request.keptIds, ["sample-sage-kurta"]);
  assert.equal(session.request.style, "desi");
  assert.ok(session.pieceIds.includes("sample-sage-kurta"));
});

test("Style this piece leaves an away piece, an unknown piece and a closet without a style alone", () => {
  const closet = styled();
  const away = setAway(closet, "sample-sage-kurta", "wash");
  assert.equal(stylePiece(away, "sample-sage-kurta", clock), away);
  assert.equal(stylePiece(closet, "nope", clock), closet);
  const fresh = addSampleWardrobe(emptyCloset);
  assert.equal(stylePiece(fresh, "sample-sage-kurta", clock), fresh);
});
