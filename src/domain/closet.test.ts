import { test } from "node:test";
import assert from "node:assert/strict";
import {
  decodeCloset,
  emptyCloset,
  neutralProfile,
  pieceVariant,
  piecesForLook,
  removePiece,
  saveLook,
  savePiece,
  setPieceLabel,
  type Piece,
  type Prepared,
  withVariant,
  emptyTaste,
  renameCelebration,
} from "./closet";
import type { CareLabel } from "./careLabel";
import { closetV2, ids } from "./closet-v2.fixture";
import {
  acceptImports,
  correctImport,
  queueImport,
  startImport,
} from "./importing";
import {
  ClosetRepository,
  keyedStorage,
  type ClosetStorage,
} from "./repository";
import {
  addSampleWardrobe,
  sampleCatalogVersion,
  samplePieces,
  sampleTraits,
} from "./samples";

const hijab: Piece = {
  id: "hijab",
  name: "Mauve hijab",
  category: "hijab",
  photo: "hijab.jpg",
  createdAt: "2026-09-30T12:00:00Z",
  source: "owned",
};
const tunic: Piece = {
  id: "tunic",
  name: "Ivory tunic",
  category: "tunic",
  photo: "tunic.jpg",
  createdAt: hijab.createdAt,
  source: "owned",
};
const trousers: Piece = {
  id: "trousers",
  name: "Wide trousers",
  category: "bottom",
  photo: "trousers.jpg",
  createdAt: hijab.createdAt,
  source: "owned",
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
  assert.equal(saved.sampleCatalog, sampleCatalogVersion);
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

function v1Snapshot() {
  const oldSample = (id: string) => {
    const {
      source: _source,
      kind: _kind,
      styles: _styles,
      traits: _traits,
      ...rest
    } = samplePieces.find((piece) => piece.id === id)!;
    return rest;
  };
  const { source: _source, ...ownedHijab } = hijab;
  return {
    version: 1,
    sampleWardrobeAdded: true,
    pieces: [
      ownedHijab,
      { ...oldSample("sample-navy-blazer"), name: "My navy blazer" },
      { ...oldSample("sample-ivory-tunic"), category: "top" },
      oldSample("sample-chocolate-loafers"),
    ],
    looks: [
      {
        id: "old-look",
        name: "Before styling",
        pieceIds: [hijab.id, "sample-mauve-hijab"],
        createdAt: hijab.createdAt,
      },
    ],
  };
}

test("an old closet migrates without losing edits, removals, or saved looks", async () => {
  const storage = memoryStorage();
  const raw = JSON.stringify(v1Snapshot());
  await storage.write(raw);
  const repository = new ClosetRepository(storage);
  await repository.load();
  const migrated = repository.getSnapshot();
  assert.equal(migrated.version, 3);
  assert.deepEqual(
    migrated.pieces.map((piece) => [piece.id, piece.source]),
    [
      [hijab.id, "owned"],
      ["sample-navy-blazer", "sample"],
      ["sample-ivory-tunic", "sample"],
      ["sample-chocolate-loafers", "sample"],
    ],
  );
  const blazer = migrated.pieces[1]!;
  assert.equal(blazer.name, "My navy blazer");
  assert.equal(blazer.kind, "blazer");
  assert.equal(migrated.pieces[0]!.kind, undefined);
  assert.equal(migrated.pieces[0]!.traits, undefined);
  assert.equal(migrated.pieces[2]!.kind, undefined);
  assert.deepEqual(migrated.looks, v1Snapshot().looks);
  assert.equal(migrated.sampleCatalog, 1);

  await repository.update(addSampleWardrobe);
  const ids = repository.getSnapshot().pieces.map((piece) => piece.id);
  assert.equal(ids.includes("sample-olive-maxi-dress"), true);
  assert.equal(ids.includes("sample-mauve-hijab"), false);
  assert.equal(ids.length, 5);

  await repository.update((closet) =>
    removePiece(closet, "sample-olive-maxi-dress"),
  );
  const reopened = new ClosetRepository(storage);
  await reopened.load();
  await reopened.update(addSampleWardrobe);
  assert.equal(
    reopened
      .getSnapshot()
      .pieces.some((piece) => piece.id === "sample-olive-maxi-dress"),
    false,
  );
});

test("a closet that never had samples receives the whole catalog once", () => {
  const seeded = addSampleWardrobe(emptyCloset);
  assert.equal(seeded.pieces.length, samplePieces.length);
  assert.equal(addSampleWardrobe(seeded), seeded);
  assert.equal(
    seeded.pieces.every((piece) => piece.source === "sample"),
    true,
  );
  assert.equal(Object.keys(sampleTraits).length, samplePieces.length);
});

test("a malformed old closet stays unreadable instead of becoming empty", () => {
  assert.throws(() =>
    decodeCloset(
      JSON.stringify({ ...v1Snapshot(), pieces: [{ id: "broken" }] }),
      sampleTraits,
    ),
  );
});

test("piece sources accept only known fields and origins", () => {
  const proposed: Piece = {
    ...hijab,
    kind: "hijab",
    sources: { kind: "proposed", styles: "label" },
  };
  assert.deepEqual(savePiece(emptyCloset, proposed).pieces[0]!.sources, {
    kind: "proposed",
    styles: "label",
  });
  assert.throws(() =>
    savePiece(emptyCloset, {
      ...hijab,
      sources: { kind: "guessed" },
    } as unknown as Piece),
  );
  assert.throws(() =>
    savePiece(emptyCloset, {
      ...hijab,
      sources: { colour: "proposed" },
    } as unknown as Piece),
  );
});

function keyed(entries: Record<string, string>) {
  const store = new Map(Object.entries(entries));
  const storage = keyedStorage(
    async (key) => store.get(key) ?? null,
    async (key, value) => {
      store.set(key, value);
    },
    async (key) => {
      store.delete(key);
    },
  );
  return { store, storage };
}

test("the newest stored closet wins and older keys are never written", async () => {
  const v1 = JSON.stringify(v1Snapshot());
  const v2 = JSON.stringify(closetV2);
  const { store, storage } = keyed({ "closet.v1": v1, "closet.v2": v2 });
  assert.equal(await storage.read(), v2);
  await storage.write("{}");
  assert.equal(await storage.read(), "{}");
  assert.equal(store.get("closet.v3"), "{}");
  assert.equal(store.get("closet.v2"), v2);
  assert.equal(store.get("closet.v1"), v1);
  assert.equal(await keyed({ "closet.v1": v1 }).storage.read(), v1);
  assert.equal(await keyed({}).storage.read(), null);
});

test("a version 2 closet opens as version 3 with every piece, look, Today session and import kept", async () => {
  const raw = JSON.stringify(closetV2);
  const { store, storage } = keyed({ "closet.v2": raw });
  const repository = new ClosetRepository(storage);
  await repository.load();
  const migrated = repository.getSnapshot();
  assert.equal(migrated.version, 3);
  assert.deepEqual(migrated.pieces, renameCelebration(closetV2.pieces));
  assert.deepEqual(migrated.looks, closetV2.looks);
  assert.deepEqual(migrated.styling, {
    ...(renameCelebration(closetV2.styling) as object),
    profile: neutralProfile,
    taste: emptyTaste,
    engine: "rules",
    units: "metric",
    place: null,
    forecast: null,
    onboarded: true,
    layout: "reasons",
    language: "system",
    studio: false,
  });
  assert.deepEqual(migrated.feedback, []);
  assert.equal(migrated.sampleCatalog, 2);
  assert.equal(migrated.photoTipsSeen, true);
  assert.deepEqual(
    migrated.imports.map(({ prepared: _prepared, ...job }) => job),
    closetV2.imports.map(({ prepared: _prepared, ...job }) => job),
  );
  const ready = migrated.imports.find((job) => job.id === ids.ready)!;
  const {
    kinds: _kinds,
    color,
    ...oldPrepared
  } = closetV2.imports[2]!.prepared!;
  const { labels, ...newPrepared } = ready.prepared!;
  assert.deepEqual(newPrepared, {
    ...oldPrepared,
    palette: [{ rgb: color, share: 1 }],
    embedding: null,
  });
  assert.deepEqual(labels, [
    { group: "kind", value: "kurta", score: 0.1412 },
    { group: "kind", value: "tunic", score: 0.1187 },
    { group: "kind", value: "dress", score: 0.0973 },
    { group: "kind", value: "abaya", score: 0.0911 },
    { group: "kind", value: "top", score: 0.0802 },
  ]);

  await repository.update((closet) =>
    correctImport(acceptImports(closet), ids.review, { kind: "hijab" }),
  );
  const saved = repository.getSnapshot();
  const piece = saved.pieces.find((item) => item.id === ids.ready)!;
  assert.equal(piece.category, "tunic");
  assert.deepEqual(piece.styles, ["desi"]);
  assert.deepEqual(piece.sources, {
    kind: "proposed",
    styles: "proposed",
    formality: "proposed",
  });
  const review = saved.imports.find((job) => job.id === ids.review)!;
  assert.equal(review.state, "ready");
  assert.equal(review.name, "Hijab");
  assert.deepEqual(review.sources, { kind: "confirmed", styles: "confirmed" });
  assert.deepEqual(
    saved.imports.map((job) => job.state),
    ["queued", "preparing", "ready", "failed"],
  );

  assert.equal(store.get("closet.v2"), raw);
  assert.equal(JSON.parse(store.get("closet.v3")!).version, 3);
  const reopened = new ClosetRepository(storage);
  await reopened.load();
  assert.deepEqual(reopened.getSnapshot(), JSON.parse(JSON.stringify(saved)));
});

test("label groups added by a newer native module do not lock the closet", () => {
  const closet = {
    ...emptyCloset,
    imports: [
      {
        id: "job",
        source: "job.jpg",
        createdAt: "2026-10-01T08:00:00Z",
        state: "review",
        attempts: 1,
        prepared: {
          original: "job.jpg",
          cutout: null,
          thumbnail: null,
          frame: null,
          instances: 0,
          labels: [
            { group: "length", value: "ankle", score: 0.2 },
            { group: "kind", value: "kurta", score: 0.14 },
          ],
          color: null,
        },
        kind: "kurta",
        name: "Kurta",
        checks: ["no-cutout"],
      },
    ],
  };
  assert.equal(decodeCloset(JSON.stringify(closet)).imports.length, 1);
});

const described: Piece = {
  ...hijab,
  id: "described",
  kind: "hijab",
  attributes: {
    pattern: "print",
    scale: "small",
    fabric: "chiffon",
    formality: 2,
  },
  sources: {
    pattern: "proposed",
    scale: "proposed",
    fabric: "confirmed",
    formality: "proposed",
  },
  colors: [
    { rgb: [151, 107, 112], share: 0.62 },
    { rgb: [238, 235, 230], share: 0.21 },
  ],
  embedding: "f".repeat(1024),
};

test("pieces keep attributes, sources, colours and the embedding through a reopen", () => {
  const closet = savePiece(emptyCloset, described);
  const reopened = decodeCloset(JSON.stringify(closet));
  assert.deepEqual(reopened.pieces[0], described);
});

test("invalid attributes, colours, embeddings and sources are refused", () => {
  const broken: Partial<Piece>[] = [
    { attributes: { length: "floor" as never } },
    { attributes: { formality: 9 as never } },
    { colors: [{ rgb: [300, 0, 0], share: 0.5 }] },
    { embedding: "short" },
    { sources: { fabric: "guessed" as never } },
    { sources: { colour: "confirmed" } as never },
  ];
  for (const change of broken)
    assert.throws(() => savePiece(emptyCloset, { ...described, ...change }));
});

test("an import job from before palettes keeps its colour as the only swatch", () => {
  let closet = queueImport(emptyCloset, {
    id: "job",
    source: "job-original.jpg",
    createdAt: "2026-10-01T08:00:00Z",
  });
  closet = startImport(closet, "job");
  const stored = JSON.parse(JSON.stringify(closet));
  stored.imports[0].prepared = {
    original: "job-original.jpg",
    cutout: null,
    thumbnail: null,
    frame: null,
    instances: 0,
    labels: [],
    color: [151, 107, 112],
  };
  const reopened = decodeCloset(JSON.stringify(stored));
  const prepared = reopened.imports[0]!.prepared as Prepared;
  assert.deepEqual(prepared.palette, [{ rgb: [151, 107, 112], share: 1 }]);
  assert.equal(prepared.embedding, null);
  assert.equal("color" in prepared, false);
  stored.imports[0].prepared.color = null;
  assert.deepEqual(
    (decodeCloset(JSON.stringify(stored)).imports[0]!.prepared as Prepared)
      .palette,
    [],
  );
});

test("the refresh marker survives reopening and must be a whole number", () => {
  const marked = { ...emptyCloset, attributeRefresh: 1 };
  assert.equal(decodeCloset(JSON.stringify(marked)).attributeRefresh, 1);
  assert.throws(() =>
    decodeCloset(JSON.stringify({ ...emptyCloset, attributeRefresh: "yes" })),
  );
});

test("C18 a care label is kept when the closet is saved and reopened", () => {
  const label: CareLabel = {
    photo: "tunic-label.jpg",
    materials: [{ fibre: "cotton", percent: 100 }],
    size: "M",
    origin: "Turkey",
  };
  const closet = setPieceLabel(savePiece(emptyCloset, tunic), "tunic", label);
  const reopened = decodeCloset(JSON.stringify(closet));
  const piece = reopened.pieces.find((item) => item.id === "tunic")!;
  assert.deepEqual(piece.label, label);
  assert.equal(piece.attributes?.fabric, "cotton");
  assert.equal(piece.sources?.fabric, "label");
  const renamed = savePiece(reopened, { ...piece, name: "Ivory tunic two" });
  assert.deepEqual(renamed.pieces[0]!.label, label);
  const removed = setPieceLabel(reopened, "tunic", undefined).pieces[0]!;
  assert.equal(removed.label, undefined);
  assert.equal(removed.attributes?.fabric, undefined);
  assert.equal(setPieceLabel(reopened, "missing", label), reopened);
});

test("C19 a malformed care label is refused instead of stored", () => {
  assert.throws(() =>
    savePiece(emptyCloset, { ...tunic, label: { photo: "", materials: [] } }),
  );
  const stored = JSON.parse(JSON.stringify(savePiece(emptyCloset, tunic)));
  stored.pieces[0].label = {
    photo: "tunic-label.jpg",
    materials: [{ fibre: "cotton", percent: 140 }],
  };
  assert.throws(() => decodeCloset(JSON.stringify(stored)));
});

test("enhanced and plain variants switch the closet photo and keep both files", () => {
  const piece: Piece = {
    ...hijab,
    photo: "hijab-enhanced.png",
    variants: { enhanced: "hijab-enhanced.png", plain: "hijab.png" },
  };
  assert.equal(pieceVariant(piece), "enhanced");
  const plain = withVariant(piece, "plain");
  assert.equal(plain.photo, "hijab.png");
  assert.equal(pieceVariant(plain), "plain");
  assert.deepEqual(plain.variants, piece.variants);
  assert.equal(withVariant(plain, "plain"), plain);
  assert.equal(pieceVariant(hijab), null);
  assert.equal(withVariant(hijab, "enhanced"), hijab);
  const saved = savePiece(emptyCloset, plain);
  assert.deepEqual(decodeCloset(JSON.stringify(saved)).pieces[0], plain);
});

test("a piece with an empty variant or set id is rejected", () => {
  assert.throws(() =>
    savePiece(emptyCloset, { ...hijab, variants: { enhanced: "" } }),
  );
  assert.throws(() => savePiece(emptyCloset, { ...hijab, setId: "" }));
});
