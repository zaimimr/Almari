import { test } from "node:test";
import assert from "node:assert/strict";
import {
  decodeCloset,
  emptyCloset,
  piecesForLook,
  removePiece,
  saveLook,
  savePiece,
  type Piece,
} from "./closet";
import { ClosetRepository, type ClosetStorage } from "./repository";
import { addSampleWardrobe, samplePieces } from "./samples";

const hijab: Piece = {
  id: "hijab",
  name: "Mauve hijab",
  category: "hijab",
  photo: "hijab.jpg",
  createdAt: "2026-09-30T12:00:00Z",
};
const tunic: Piece = {
  id: "tunic",
  name: "Ivory tunic",
  category: "tunic",
  photo: "tunic.jpg",
  createdAt: hijab.createdAt,
};
const trousers: Piece = {
  id: "trousers",
  name: "Wide trousers",
  category: "bottom",
  photo: "trousers.jpg",
  createdAt: hijab.createdAt,
};

function memoryStorage() {
  let value: string | null = null;
  return {
    read: async () => value,
    write: async (next: string) => {
      value = next;
    },
  } satisfies ClosetStorage;
}

test("clothes and a layered outfit survive reopening the repository", async () => {
  const storage = memoryStorage();
  const repository = new ClosetRepository(storage);
  await repository.load();
  await repository.update((closet) =>
    savePiece(savePiece(savePiece(closet, hijab), tunic), trousers),
  );
  await repository.update((closet) =>
    saveLook(closet, {
      id: "work",
      name: " Soft layers ",
      pieceIds: [hijab.id, tunic.id, trousers.id],
      createdAt: hijab.createdAt,
    }),
  );
  const reopened = new ClosetRepository(storage);
  await reopened.load();
  assert.equal(reopened.getSnapshot().looks[0]?.name, "Soft layers");
  assert.deepEqual(reopened.getSnapshot().looks[0]?.pieceIds, [
    hijab.id,
    tunic.id,
    trousers.id,
  ]);
  assert.equal(reopened.getSnapshot().pieces.length, 3);
});

test("concurrent writes do not lose either garment", async () => {
  const repository = new ClosetRepository(memoryStorage());
  await repository.load();
  await Promise.all([
    repository.update((closet) => savePiece(closet, hijab)),
    repository.update((closet) => savePiece(closet, tunic)),
  ]);
  assert.equal(repository.getSnapshot().pieces.length, 2);
});

test("a failed save leaves the visible closet intact and permits retry", async () => {
  const storage = memoryStorage();
  let fails = true;
  const repository = new ClosetRepository({
    read: storage.read,
    write: async (value) => {
      if (fails) throw new Error("Storage full");
      await storage.write(value);
    },
  });
  await repository.load();
  await assert.rejects(
    repository.update((closet) => savePiece(closet, hijab)),
    /Storage full/,
  );
  assert.equal(repository.getSnapshot().pieces.length, 0);
  fails = false;
  await repository.update((closet) => savePiece(closet, hijab));
  assert.equal(repository.getSnapshot().pieces.length, 1);
});

test("removing a garment keeps its saved look and exposes a missing reference", () => {
  const full = saveLook(savePiece(savePiece(emptyCloset, hijab), tunic), {
    id: "look",
    name: "Work",
    pieceIds: [hijab.id, tunic.id],
    createdAt: hijab.createdAt,
  });
  const after = removePiece(full, hijab.id);
  const look = after.looks[0]!;
  assert.deepEqual(look.pieceIds, [hijab.id, tunic.id]);
  assert.deepEqual(
    piecesForLook(after, look).map((piece) => piece.id),
    [tunic.id],
  );
  assert.throws(() => saveLook(after, look), /no longer in your closet/);
});

test("changing one piece in a look retains the other selected pieces", () => {
  const alternate = { ...hijab, id: "ivory-hijab", name: "Ivory hijab" };
  const closet = [hijab, tunic, trousers, alternate].reduce(
    savePiece,
    emptyCloset,
  );
  const before = saveLook(closet, {
    id: "look",
    name: "Work",
    pieceIds: [hijab.id, tunic.id, trousers.id],
    createdAt: hijab.createdAt,
  });
  const after = saveLook(before, {
    ...before.looks[0]!,
    pieceIds: [alternate.id, tunic.id, trousers.id],
  });
  assert.equal(after.looks.length, 1);
  assert.deepEqual(after.looks[0]?.pieceIds, [
    alternate.id,
    tunic.id,
    trousers.id,
  ]);
  assert.equal(before.looks[0]?.pieceIds[0], hijab.id);
});

test("invalid stored data is rejected without overwriting it", async () => {
  let writes = 0;
  const repository = new ClosetRepository({
    read: async () => '{"version":2,"pieces":[],"looks":[]}',
    write: async () => {
      writes++;
    },
  });
  await assert.rejects(repository.load());
  await assert.rejects(repository.update((closet) => savePiece(closet, hijab)));
  assert.equal(writes, 0);
  assert.throws(() => decodeCloset("{broken"));
  assert.throws(() =>
    decodeCloset(
      JSON.stringify({ version: 1, pieces: [hijab, hijab], looks: [] }),
    ),
  );
});

test("blank names and missing pieces cannot create saved looks", () => {
  assert.throws(() =>
    saveLook(emptyCloset, {
      id: "look",
      name: "Work",
      pieceIds: ["missing"],
      createdAt: hijab.createdAt,
    }),
  );
  assert.throws(() => savePiece(emptyCloset, { ...hijab, name: " " }));
  assert.throws(() =>
    saveLook(emptyCloset, {
      id: "look",
      name: " ",
      pieceIds: [],
      createdAt: hijab.createdAt,
    }),
  );
});

test("sample setup preserves owned clothing, edits, saved looks, and removals after restarting", async () => {
  const storage = memoryStorage();
  const repository = new ClosetRepository(storage);
  await repository.load();
  await repository.update((closet) =>
    saveLook(savePiece(closet, hijab), {
      id: "existing-look",
      name: "Already saved",
      pieceIds: [hijab.id],
      createdAt: hijab.createdAt,
    }),
  );
  await repository.update(addSampleWardrobe);
  assert.equal(repository.getSnapshot().pieces.length, samplePieces.length + 1);
  const editedSample = { ...samplePieces[0]!, name: "My renamed sample" };
  const removedSample = samplePieces[1]!;
  await repository.update((closet) =>
    removePiece(savePiece(closet, editedSample), removedSample.id),
  );
  await repository.update((closet) =>
    saveLook(closet, {
      id: "sample-look",
      name: "Trying a combination",
      pieceIds: [hijab.id, editedSample.id],
      createdAt: hijab.createdAt,
    }),
  );
  const reopened = new ClosetRepository(storage);
  await reopened.load();
  const saved = reopened.getSnapshot();
  assert.equal(addSampleWardrobe(saved), saved);
  assert.equal(saved.sampleWardrobeAdded, true);
  assert.deepEqual(
    saved.pieces.find((piece) => piece.id === hijab.id),
    hijab,
  );
  assert.deepEqual(
    saved.pieces.find((piece) => piece.id === editedSample.id),
    editedSample,
  );
  assert.equal(
    saved.pieces.some((piece) => piece.id === removedSample.id),
    false,
  );
  assert.equal(saved.looks.length, 2);
  assert.deepEqual(saved.looks[0]?.pieceIds, [hijab.id, editedSample.id]);
  assert.equal(saved.looks[1]?.name, "Already saved");
});
