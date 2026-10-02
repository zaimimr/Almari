import { test } from "node:test";
import assert from "node:assert/strict";
import {
  emptyCloset,
  removePiece,
  savePiece,
  type Closet,
  type OutfitRequest,
  type Piece,
} from "./closet";
import { ClosetRepository, type ClosetStorage } from "./repository";
import { addSampleWardrobe } from "./samples";
import { rulesScorer } from "./scoring/rulesScorer";
import { scoreContext } from "./scoring/taste";
import { replacementsFor, roleOf, styleOutfits } from "./styling";
import {
  activeSession,
  applyRequest,
  backToEveryday,
  clockFor,
  ensureToday,
  replacePiece,
  saveEverydayStyle,
  startOccasion,
  toggleKeep,
  tryAnother,
  undoChange,
} from "./today";

const clock = { localDate: "2026-10-01", timeZone: "Europe/Oslo" };
const samples = addSampleWardrobe(emptyCloset);
const context = scoreContext(emptyCloset);
const byId = (closet: Closet, id: string) =>
  closet.pieces.find((piece) => piece.id === id)!;

const request = (changes: Partial<OutfitRequest> = {}): OutfitRequest => ({
  occasion: "work",
  style: "western",
  garmentType: null,
  keptIds: [],
  excludedIds: [],
  weather: { source: "unknown" },
  hijab: "always",
  wardrobe: "sample",
  ...changes,
});

function styled(closet: Closet) {
  return saveEverydayStyle(
    closet,
    { occasion: "work", style: "western", hijab: "always", sample: true },
    clock,
    true,
  );
}

function everyOutfit(changes: Partial<OutfitRequest>, closet = samples) {
  const result = styleOutfits(
    closet.pieces,
    request(changes),
    "seed",
    rulesScorer,
    context,
  );
  return { result, outfits: result.outfits.map((outfit) => outfit.ids) };
}

function memoryStorage(): ClosetStorage {
  let value: string | null = null;
  return {
    read: async () => value,
    write: async (next) => {
      value = next;
    },
  };
}

test("T01 today's everyday outfit survives a restart and try another changes it deliberately", async () => {
  const storage = memoryStorage();
  const repository = new ClosetRepository(storage);
  await repository.load();
  await repository.update(addSampleWardrobe);
  await repository.update(styled);
  const first = activeSession(repository.getSnapshot().styling.today!);
  assert.ok(first.pieceIds.length >= 4);

  const reopened = new ClosetRepository(storage);
  await reopened.load();
  await reopened.update((closet) => ensureToday(closet, clock));
  const again = activeSession(reopened.getSnapshot().styling.today!);
  assert.deepEqual(again.pieceIds, first.pieceIds);

  await reopened.update((closet) => tryAnother(closet, again.revision));
  const next = activeSession(reopened.getSnapshot().styling.today!);
  assert.notDeepEqual(next.pieceIds, first.pieceIds);
  assert.equal(next.request, again.request);
  assert.equal(
    next.pieceIds.some((id) => byId(samples, id).kind === "hijab"),
    true,
  );
});

test("a new local day gives a fresh suggestion while the same day stays stable", () => {
  const today = styled(samples);
  assert.equal(ensureToday(today, clock), today);
  const tomorrow = ensureToday(today, { ...clock, localDate: "2026-10-02" });
  assert.equal(tomorrow.styling.today!.localDate, "2026-10-02");
  assert.equal(
    clockFor(new Date("2026-10-01T22:30:00Z"), "Europe/Oslo").localDate,
    "2026-10-02",
  );
  assert.equal(
    clockFor(new Date("2026-10-01T22:30:00Z"), "America/New_York").localDate,
    "2026-10-01",
  );
});

test("T02 an occasion does not change everyday defaults and back restores today's look", () => {
  const today = styled(samples);
  const everyday = today.styling.today!.everyday;
  const party = startOccasion(today, {
    ...everyday.request,
    occasion: "party",
    style: "desi",
    weather: {
      source: "manual",
      warmth: "cold",
      precipitation: "dry",
      exposure: "mostly-indoors",
    },
  });
  assert.equal(party.styling.today!.active, "occasion");
  assert.deepEqual(party.styling.everyday, today.styling.everyday);
  assert.deepEqual(party.styling.today!.everyday, everyday);
  const desi = activeSession(party.styling.today!).pieceIds;
  assert.equal(desi.includes("sample-sage-kurta"), true);
  const back = backToEveryday(party);
  assert.deepEqual(activeSession(back.styling.today!), everyday);
  assert.deepEqual(back.styling.everyday, today.styling.everyday);
});

test("T03 a blazer request uses an actual blazer and a cardigan does not count", () => {
  const { outfits } = everyOutfit({ garmentType: "blazer" });
  assert.ok(outfits.length);
  assert.equal(
    outfits.every((ids) => ids.includes("sample-navy-blazer")),
    true,
  );
  const cardigan: Piece = {
    id: "cardigan",
    name: "Grey cardigan",
    category: "layer",
    kind: "cardigan",
    styles: ["western"],
    photo: "cardigan.jpg",
    createdAt: "2026-10-01T00:00:00Z",
    source: "sample",
  };
  const noBlazer = savePiece(
    removePiece(samples, "sample-navy-blazer"),
    cardigan,
  );
  const { result } = everyOutfit({ garmentType: "blazer" }, noBlazer);
  assert.equal(result.status, "missing");
  assert.match(result.problems[0]!.message, /no blazer/);
  assert.deepEqual(result.problems[0]!.actions[0], { type: "clear-type" });
});

test("T04 a dress for work includes a real dress and dress over trousers stays possible", () => {
  const { outfits } = everyOutfit({ garmentType: "dress" });
  assert.ok(outfits.length);
  assert.equal(
    outfits.every((ids) => ids.includes("sample-olive-maxi-dress")),
    true,
  );
  const withTrousers = everyOutfit({
    garmentType: "dress",
    keptIds: ["sample-charcoal-trousers"],
  });
  assert.equal(withTrousers.result.status, "ready");
  assert.equal(
    withTrousers.outfits.every(
      (ids) =>
        ids.includes("sample-olive-maxi-dress") &&
        ids.includes("sample-charcoal-trousers"),
    ),
    true,
  );
});

test("an open abaya always has a complete outfit beneath it", () => {
  const { outfits } = everyOutfit({ keptIds: ["sample-taupe-abaya"] });
  assert.ok(outfits.length);
  for (const ids of outfits) {
    const mains = ids.filter((id) => roleOf(byId(samples, id)) === "main");
    assert.equal(mains.length, 1);
  }
});

test("T05 kept pieces stay in every alternative for one, two, and several choices", () => {
  const cases = [
    ["sample-chocolate-loafers", "sample-taupe-bag"],
    ["sample-charcoal-trousers"],
    ["sample-chocolate-loafers", "sample-taupe-bag", "sample-mauve-hijab"],
  ];
  for (const keptIds of cases) {
    const { result, outfits } = everyOutfit({ keptIds });
    assert.equal(result.status, "ready");
    assert.ok(outfits.length > 1);
    for (const ids of outfits) {
      for (const id of keptIds)
        assert.equal(ids.filter((item) => item === id).length, 1);
      assert.equal(new Set(ids).size, ids.length);
    }
  }
});

test("T06 incompatible kept pieces explain the conflict and offer a release", () => {
  const { result } = everyOutfit({
    keptIds: ["sample-ivory-trousers", "sample-charcoal-trousers"],
  });
  assert.equal(result.status, "conflict");
  assert.deepEqual(result.problems[0]!.actions, [
    { type: "release", id: "sample-ivory-trousers" },
    { type: "release", id: "sample-charcoal-trousers" },
  ]);
  const style = everyOutfit({ keptIds: ["sample-sage-kurta"] });
  assert.equal(style.result.status, "conflict");
  assert.deepEqual(style.result.problems[0]!.actions[0], {
    type: "set-style",
    style: "desi",
  });
});

test("T07 Desi and Western change the garments while sharing shoes, trousers, and hijabs", () => {
  const desi = everyOutfit({ style: "desi" }).outfits;
  const western = everyOutfit({ style: "western" }).outfits;
  assert.ok(desi.length && western.length);
  assert.equal(
    desi.every((ids) => ids.includes("sample-sage-kurta")),
    true,
  );
  assert.equal(
    desi.some((ids) => ids.includes("sample-ivory-tunic")),
    false,
  );
  assert.equal(
    western.some((ids) => ids.includes("sample-sage-kurta")),
    false,
  );
  assert.equal(
    western.some((ids) => ids.includes("sample-ivory-salwar")),
    false,
  );
  assert.equal(
    desi.some((ids) => ids.includes("sample-charcoal-trousers")),
    true,
  );
  for (const outfits of [desi, western])
    assert.equal(
      outfits.every((ids) => ids.includes("sample-chocolate-loafers")),
      true,
    );
});

test("T08 cold and snow remain honest about missing weather evidence", () => {
  const snow = everyOutfit({
    weather: {
      source: "manual",
      warmth: "cold",
      precipitation: "snow",
      exposure: "time-outside",
    },
  });
  assert.equal(snow.result.status, "review");
  const messages = snow.result.problems.map((problem) => problem.message);
  assert.ok(
    messages.includes(
      "Your closet does not have footwear marked suitable for snow.",
    ),
  );
  assert.ok(
    messages.some((message) => /layer marked warm enough/.test(message)),
  );
  const warm = everyOutfit({
    weather: {
      source: "manual",
      warmth: "warm",
      precipitation: "dry",
      exposure: "time-outside",
    },
  });
  assert.equal(warm.result.status, "ready");
  assert.equal(
    warm.outfits.some((ids) => ids.includes("sample-navy-blazer")),
    false,
  );
  const warmBlazer = everyOutfit({
    garmentType: "blazer",
    weather: {
      source: "manual",
      warmth: "warm",
      precipitation: "dry",
      exposure: "mostly-indoors",
    },
  });
  assert.equal(
    warmBlazer.outfits.every((ids) => ids.includes("sample-navy-blazer")),
    true,
  );
});

test("T09 changing one piece changes only that piece and undo restores it", () => {
  const today = styled(samples);
  const session = activeSession(today.styling.today!);
  const hijab = session.pieceIds.find(
    (id) => byId(samples, id).category === "hijab",
  )!;
  const options = replacementsFor(
    today.pieces,
    session.request,
    session.pieceIds,
    hijab,
    rulesScorer,
    context,
  );
  assert.ok(options.length >= 1);
  const replaced = replacePiece(
    today,
    hijab,
    options[0]!.piece.id,
    session.revision,
  );
  const after = activeSession(replaced.styling.today!);
  assert.deepEqual(
    after.pieceIds.filter((id) => id !== options[0]!.piece.id),
    session.pieceIds.filter((id) => id !== hijab),
  );
  const undone = activeSession(undoChange(replaced).styling.today!);
  assert.deepEqual(undone.pieceIds, session.pieceIds);

  const shoes = session.pieceIds.find(
    (id) => byId(samples, id).category === "shoes",
  )!;
  assert.deepEqual(
    replacementsFor(
      today.pieces,
      session.request,
      session.pieceIds,
      shoes,
      rulesScorer,
      context,
    ),
    [],
  );
});

test("a replaced or toggled kept piece stays kept and a stale revision is ignored", () => {
  const today = styled(samples);
  const session = activeSession(today.styling.today!);
  const hijab = session.pieceIds.find(
    (id) => byId(samples, id).category === "hijab",
  )!;
  const kept = toggleKeep(today, hijab);
  const keptSession = activeSession(kept.styling.today!);
  assert.deepEqual(keptSession.request.keptIds, [hijab]);
  const other = replacementsFor(
    kept.pieces,
    keptSession.request,
    keptSession.pieceIds,
    hijab,
    rulesScorer,
    context,
  )[0]!.piece.id;
  const replaced = replacePiece(kept, hijab, other, keptSession.revision);
  assert.deepEqual(activeSession(replaced.styling.today!).request.keptIds, [
    other,
  ]);
  assert.equal(tryAnother(replaced, keptSession.revision), replaced);
  assert.equal(
    applyRequest(replaced, request({ occasion: "dinner" }), 0).styling.today,
    replaced.styling.today,
  );
});

test("T11 empty closets, deleted kept pieces, and exhausted alternatives explain the next step", () => {
  const empty = everyOutfit({ wardrobe: "owned" });
  assert.equal(empty.result.status, "missing");
  assert.deepEqual(empty.result.problems[0]!.actions, [
    { type: "add-pieces" },
    { type: "use-samples" },
  ]);
  const deleted = everyOutfit(
    { keptIds: ["sample-taupe-bag"] },
    removePiece(samples, "sample-taupe-bag"),
  );
  assert.equal(deleted.result.problems[0]!.code, "kept-missing");
  assert.deepEqual(deleted.result.problems[0]!.actions, [
    { type: "release", id: "sample-taupe-bag" },
  ]);
  const noShoes = everyOutfit(
    {},
    removePiece(samples, "sample-chocolate-loafers"),
  );
  assert.match(noShoes.result.problems[0]!.message, /Add shoes/);

  let closet = styled(samples);
  const count = styleOutfits(
    closet.pieces,
    activeSession(closet.styling.today!).request,
    "any",
    rulesScorer,
    context,
  ).outfits.length;
  for (let index = 0; index < count + 3; index++)
    closet = tryAnother(closet, activeSession(closet.styling.today!).revision);
  assert.equal(activeSession(closet.styling.today!).cursor, count - 1);
});

test("T12 sample clothes never appear in owned suggestions and owned clothes carry no sample traits", () => {
  const owned = (piece: Partial<Piece> & Pick<Piece, "id" | "category">) =>
    ({
      name: piece.id,
      photo: `${piece.id}.jpg`,
      createdAt: "2026-10-01T00:00:00Z",
      source: "owned",
      ...piece,
    }) as Piece;
  const closet = [
    owned({ id: "my-tunic", category: "tunic" }),
    owned({ id: "my-trousers", category: "bottom" }),
    owned({ id: "my-shoes", category: "shoes" }),
    owned({ id: "my-hijab", category: "hijab" }),
  ].reduce(savePiece, samples);
  const { result, outfits } = everyOutfit({ wardrobe: "owned" }, closet);
  assert.equal(result.status, "review");
  assert.ok(outfits.length);
  for (const ids of outfits)
    assert.equal(
      ids.every((id) => byId(closet, id).source === "owned"),
      true,
    );
  assert.equal(result.problems[0]!.code, "style-unknown");
  const samplesOnly = everyOutfit({ wardrobe: "sample" }, closet).outfits;
  for (const ids of samplesOnly)
    assert.equal(
      ids.some((id) => id.startsWith("my-")),
      false,
    );
});
