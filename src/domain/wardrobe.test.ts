import { test } from "node:test";
import assert from "node:assert/strict";
import {
  decodeCloset,
  emptyCloset,
  removePiece,
  saveLook,
  savePiece,
  setAway,
  type Closet,
  type OutfitRequest,
  type Piece,
} from "./closet";
import { colorName } from "./color";
import { woreLately } from "./feedback";
import { setNeverWear } from "./preferences";
import { addSampleWardrobe, sampleTraits } from "./samples";
import {
  activeSession,
  applyLook,
  applyRequest,
  replacePiece,
  resultFor,
  saveEverydayStyle,
  undoChange,
} from "./today";
import {
  confirmPiece,
  hijabAlternatives,
  hijabHue,
  matchingLooks,
  rediscover,
  setArchived,
  shelf,
} from "./wardrobe";
import { at, ownedCloset, piece, styledSample } from "./test-helpers";

const day = "2026-10-01";
const samples = addSampleWardrobe(emptyCloset);

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

const suggested = (closet: Closet, changes: Partial<OutfitRequest> = {}) =>
  resultFor(closet, request(changes), day).outfits.map((outfit) => outfit.ids);

const pieceOf = (closet: Closet, id: string) =>
  closet.pieces.find((piece) => piece.id === id)!;

test("archived pieces are left out of every suggestion, like away pieces", () => {
  assert.equal(
    suggested(samples).some((ids) => ids.includes("sample-mauve-hijab")),
    true,
  );
  const closet = setArchived(
    setAway(samples, "sample-navy-blazer", "wash"),
    "sample-mauve-hijab",
    true,
  );
  const outfits = suggested(closet);
  assert.ok(outfits.length);
  for (const ids of outfits) {
    assert.equal(ids.includes("sample-mauve-hijab"), false);
    assert.equal(ids.includes("sample-navy-blazer"), false);
  }
});

test("archive is reversible, survives reopening, and is separate from removing and from away", () => {
  const look = {
    id: "office",
    name: "Office",
    pieceIds: ["sample-mauve-hijab", "sample-ivory-tunic"],
    createdAt: day,
  };
  const closet = saveLook(samples, look);
  const archived = setArchived(closet, "sample-mauve-hijab", true);
  assert.equal(archived.pieces.length, closet.pieces.length);
  assert.deepEqual(archived.looks, closet.looks);
  assert.equal(pieceOf(archived, "sample-mauve-hijab").status, "archived");
  assert.equal(setArchived(archived, "sample-mauve-hijab", true), archived);
  assert.deepEqual(setArchived(archived, "sample-mauve-hijab", false), closet);
  assert.equal(
    removePiece(closet, "sample-mauve-hijab").pieces.length,
    closet.pieces.length - 1,
  );
  const reopened = decodeCloset(JSON.stringify(archived), sampleTraits);
  assert.equal(pieceOf(reopened, "sample-mauve-hijab").status, "archived");

  const away = setAway(closet, "sample-ivory-tunic", "lent");
  assert.equal(setArchived(away, "sample-ivory-tunic", false), away);
  const archivedAway = pieceOf(
    setArchived(away, "sample-ivory-tunic", true),
    "sample-ivory-tunic",
  );
  assert.equal(archivedAway.status, "archived");
  assert.equal(archivedAway.away, undefined);
  assert.equal(
    pieceOf(
      setArchived(
        setArchived(away, "sample-ivory-tunic", true),
        "sample-ivory-tunic",
        false,
      ),
      "sample-ivory-tunic",
    ).status,
    undefined,
  );
});

test("an unknown status is rejected", () => {
  assert.throws(() =>
    savePiece(samples, {
      ...samples.pieces[0]!,
      status: "gone",
    } as unknown as Piece),
  );
});

test("a kept piece that becomes archived is explained with a release", () => {
  const closet = setArchived(samples, "sample-taupe-bag", true);
  const result = resultFor(
    closet,
    request({ keptIds: ["sample-taupe-bag"] }),
    day,
  );
  assert.equal(result.status, "missing");
  assert.equal(result.problems[0]!.code, "kept-missing");
  assert.equal(result.problems[0]!.message, "Taupe everyday bag is archived.");
  assert.deepEqual(result.problems[0]!.actions, [
    { type: "release", id: "sample-taupe-bag" },
  ]);
});

test("the closet shows archived pieces only on their own shelf", () => {
  const closet = setArchived(
    setAway(samples, "sample-ivory-tunic", "wash"),
    "sample-mauve-hijab",
    true,
  );
  const ids = (pieces: Piece[]) => pieces.map((piece) => piece.id);
  assert.deepEqual(ids(shelf(closet.pieces, true)), ["sample-mauve-hijab"]);
  assert.equal(
    ids(shelf(closet.pieces, false)).includes("sample-mauve-hijab"),
    false,
  );
  assert.equal(
    ids(shelf(closet.pieces, false)).includes("sample-ivory-tunic"),
    true,
  );
  assert.equal(shelf(closet.pieces, false).length, closet.pieces.length - 1);
});

test("marking an archived piece unavailable or available leaves it archived", () => {
  const archived = setArchived(samples, "sample-mauve-hijab", true);
  assert.equal(setAway(archived, "sample-mauve-hijab", "wash"), archived);
  assert.equal(setAway(archived, "sample-mauve-hijab", null), archived);
});

const clock = { localDate: day, timeZone: "Europe/Oslo" };
const outfit = [
  "sample-ivory-tunic",
  "sample-charcoal-trousers",
  "sample-mauve-hijab",
  "sample-chocolate-loafers",
];
const hijab = (
  id: string,
  name: string,
  rgb: [number, number, number],
): Piece => ({
  id,
  name,
  colors: [{ rgb, share: 1 }],
  category: "hijab",
  kind: "hijab",
  styles: ["western", "desi"],
  photo: `${id}.jpg`,
  createdAt: day,
  source: "sample",
});
const hijabs = [
  hijab("sample-rose-hijab", "Rose hijab", [214, 140, 160]),
  hijab("sample-sky-hijab", "Sky hijab", [140, 180, 220]),
].reduce(savePiece, samples);
const preference = [
  "sample-sky-hijab",
  "sample-chocolate-hijab",
  "sample-rose-hijab",
  "sample-ivory-hijab",
];
const byPreference = (pieces: Piece[]) => {
  const worn = pieces.find((piece) => piece.category === "hijab")!;
  return {
    score: 10 - preference.indexOf(worn.id),
    reasons: [
      "Every piece is marked for work.",
      `The ${worn.name.toLowerCase()} brings contrast to the ivory longline tunic.`,
    ],
  };
};

test("R03 the comparison shows the three closest in tone, each keeping every other piece", () => {
  const comparison = hijabAlternatives(
    hijabs,
    request(),
    outfit,
    byPreference,
  )!;
  assert.equal(comparison.current.piece.id, "sample-mauve-hijab");
  assert.deepEqual(comparison.current.ids, outfit);
  assert.deepEqual(
    comparison.options.map((option) => option.piece.id),
    ["sample-rose-hijab", "sample-chocolate-hijab", "sample-ivory-hijab"],
  );
  for (const option of comparison.options) {
    assert.deepEqual(
      option.ids,
      outfit.map((id) => (id === "sample-mauve-hijab" ? option.piece.id : id)),
    );
    assert.equal(
      option.reason,
      `The ${option.piece.name.toLowerCase()} brings contrast to the ivory longline tunic.`,
    );
  }
});

test("R03 away, archived and set-aside hijabs are not offered", () => {
  const closet = setArchived(
    setAway(hijabs, "sample-sky-hijab", "wash"),
    "sample-ivory-hijab",
    true,
  );
  const comparison = hijabAlternatives(
    closet,
    request({ excludedIds: ["sample-rose-hijab"] }),
    outfit,
    byPreference,
  )!;
  assert.deepEqual(
    comparison.options.map((option) => option.piece.id),
    ["sample-chocolate-hijab"],
  );
});

test("a never-wear colour on clothes keeps that hijab, on hijabs drops it", () => {
  const colour = colorName([78, 52, 42]);
  const offered = (on: "clothes" | "hijabs") =>
    hijabAlternatives(
      setNeverWear(hijabs, [{ colour, on }]),
      request(),
      outfit,
      byPreference,
    )!.options.map((option) => option.piece.id);
  assert.ok(offered("clothes").includes("sample-chocolate-hijab"));
  assert.ok(!offered("hijabs").includes("sample-chocolate-hijab"));
});

test("R03 using a hijab changes only the hijab and undo restores the outfit", () => {
  const styled = saveEverydayStyle(
    hijabs,
    { occasion: "work", style: "western", hijab: "always", sample: true },
    clock,
    true,
  );
  const shown = applyLook(
    styled,
    outfit,
    activeSession(styled.styling.today!).revision,
  );
  const session = activeSession(shown.styling.today!);
  assert.deepEqual(session.pieceIds, outfit);
  const choice = hijabAlternatives(
    shown,
    session.request,
    session.pieceIds,
    byPreference,
  )!.options[0]!;
  const used = replacePiece(
    shown,
    "sample-mauve-hijab",
    choice.piece.id,
    session.revision,
  );
  assert.deepEqual(activeSession(used.styling.today!).pieceIds, choice.ids);
  assert.deepEqual(
    activeSession(undoChange(used).styling.today!).pieceIds,
    outfit,
  );
  assert.deepEqual(undoChange(used).looks, hijabs.looks);
});

test("R03 a closet with one hijab shows no alternatives, and no hijab means no comparison", () => {
  const single = removePiece(
    removePiece(samples, "sample-ivory-hijab"),
    "sample-chocolate-hijab",
  );
  assert.deepEqual(
    hijabAlternatives(single, request(), outfit, byPreference)!.options,
    [],
  );
  assert.equal(
    hijabAlternatives(
      samples,
      request({ hijab: "not-needed" }),
      outfit.filter((id) => id !== "sample-mauve-hijab"),
      byPreference,
    ),
    null,
  );
});

const office = {
  id: "office",
  name: "Office",
  pieceIds: outfit,
  createdAt: day,
};
const withLook = saveLook(samples, office);

test("R04 an exact saved look appears only when it fits the request", () => {
  const exact = matchingLooks(withLook, request());
  assert.deepEqual(
    exact.exact.map((match) => [match.look.id, match.problems]),
    [["office", []]],
  );
  assert.deepEqual(exact.variants, []);
  for (const changes of [
    { style: "desi" as const },
    { keptIds: ["sample-navy-blazer"] },
    { garmentType: "blazer" as const },
    { wardrobe: "owned" as const },
  ]) {
    const result = matchingLooks(withLook, request(changes));
    assert.deepEqual(result.exact, []);
    assert.deepEqual(result.variants, []);
  }
});

test("R04 a look with a missing, away or archived piece is a variant with a repair and stays unchanged", () => {
  const away = setAway(withLook, "sample-mauve-hijab", "wash");
  const { exact, variants } = matchingLooks(away, request());
  assert.deepEqual(exact, []);
  assert.equal(variants.length, 1);
  const variant = variants[0]!;
  assert.deepEqual(
    variant.unavailable.map((piece) => piece.id),
    ["sample-mauve-hijab"],
  );
  assert.equal(variant.missing, 0);
  assert.deepEqual(variant.repair.keptIds, [
    "sample-ivory-tunic",
    "sample-charcoal-trousers",
    "sample-chocolate-loafers",
  ]);
  const styled = saveEverydayStyle(
    away,
    { occasion: "work", style: "western", hijab: "always", sample: true },
    clock,
    true,
  );
  const repaired = applyRequest(
    styled,
    variant.repair,
    activeSession(styled.styling.today!).revision,
  );
  const ids = activeSession(repaired.styling.today!).pieceIds;
  for (const id of variant.repair.keptIds) assert.ok(ids.includes(id));
  assert.equal(ids.includes("sample-mauve-hijab"), false);
  assert.deepEqual(repaired.looks, withLook.looks);

  const archived = matchingLooks(
    setArchived(withLook, "sample-mauve-hijab", true),
    request(),
  );
  assert.deepEqual(
    archived.variants[0]!.unavailable.map((piece) => piece.id),
    ["sample-mauve-hijab"],
  );

  const deleted = matchingLooks(
    removePiece(withLook, "sample-charcoal-trousers"),
    request(),
  );
  assert.deepEqual(deleted.exact, []);
  assert.equal(deleted.variants[0]!.missing, 1);
});

test("R04 a broken look whose remaining pieces no longer fit the request is not offered", () => {
  const deleted = removePiece(withLook, "sample-charcoal-trousers");
  assert.deepEqual(matchingLooks(deleted, request({ style: "desi" })), {
    exact: [],
    variants: [],
  });
});

test("R04 using a saved look changes only today's outfit and can be undone", () => {
  const styled = saveEverydayStyle(
    withLook,
    { occasion: "work", style: "western", hijab: "always", sample: true },
    clock,
    true,
  );
  const before = activeSession(styled.styling.today!);
  const used = applyLook(styled, office.pieceIds, before.revision);
  const after = activeSession(used.styling.today!);
  assert.deepEqual(after.pieceIds, office.pieceIds);
  assert.equal(after.request, before.request);
  assert.deepEqual(used.looks, withLook.looks);
  assert.deepEqual(
    activeSession(undoChange(used).styling.today!).pieceIds,
    before.pieceIds,
  );
  assert.equal(applyLook(used, office.pieceIds, before.revision), used);
});

test("rediscover waits for a wear, then never worn first, then not worn lately, wear more first", () => {
  const pieces = [
    piece("never-a", "top", { createdAt: "2026-08-01T00:00:00Z" }),
    piece("never-b", "top", { createdAt: "2026-09-01T00:00:00Z" }),
    piece("march", "dress"),
    piece("fav", "bottom"),
    piece("away", "top", { status: "away", away: "wash" }),
  ];
  const closet = {
    ...ownedCloset(pieces),
    styling: { ...styledSample().styling, wardrobe: "owned" as const },
  };
  const clock = at("2026-10-02T08:00:00+02:00");
  assert.deepEqual(rediscover(closet, clock), []);
  let worn: Closet = {
    ...closet,
    feedback: [
      {
        id: "m",
        at: "2026-03-14T10:00:00Z",
        kind: "wore" as const,
        pieceIds: ["march"],
        request: closet.styling.today!.everyday.request,
        engine: "rules" as const,
        scope: "piece" as const,
      },
    ],
  };
  worn = woreLately(worn, ["fav"], "2026-10-01T12:00:00Z", (id) => `w-${id}`);
  const withMore = {
    ...worn,
    styling: {
      ...worn.styling,
      profile: { ...worn.styling.profile, wearMore: ["never-b"] },
    },
  };
  assert.deepEqual(
    rediscover(withMore, clock).map((p) => p.id),
    ["never-b", "never-a", "march"],
  );
});

test("hijab options follow the current hue, warm first when it is cold", () => {
  const base = styledSample();
  const session = activeSession(base.styling.today!);
  const score = () => ({ score: 1, reasons: [] });
  const mild = hijabAlternatives(
    base,
    session.request,
    session.pieceIds,
    score,
  )!;
  const current = hijabHue(mild.current.piece)!;
  const gaps = mild.options.map((o) =>
    Math.abs((((hijabHue(o.piece) ?? current) - current + 540) % 360) - 180),
  );
  assert.deepEqual(
    gaps,
    [...gaps].sort((a, b) => a - b),
  );
  const cold = hijabAlternatives(
    base,
    {
      ...session.request,
      weather: {
        source: "manual",
        warmth: "cold",
        precipitation: "snow",
        exposure: null,
      },
    },
    session.pieceIds,
    score,
  )!;
  const warmFirst = cold.options.findIndex(
    (o) => o.piece.traits?.warmth !== "warm",
  );
  assert.ok(
    warmFirst !== 0 ||
      cold.options.every((o) => o.piece.traits?.warmth !== "warm"),
  );
  const all = hijabAlternatives(
    base,
    session.request,
    session.pieceIds,
    score,
    { all: true },
  )!;
  assert.ok(all.options.length >= mild.options.length);
});

test("a confirmed warm hijab leads under snow, Show all lists every hijab without a reason", () => {
  const base = styledSample();
  const session = activeSession(base.styling.today!);
  const score = () => ({ score: 1, reasons: ["Picks up the plum"] });
  const options = (closet: Closet, warmth: "mild" | "cold") =>
    hijabAlternatives(
      closet,
      {
        ...session.request,
        weather: {
          source: "manual",
          warmth,
          precipitation: warmth === "cold" ? "snow" : "dry",
          exposure: null,
        },
      },
      session.pieceIds,
      score,
    )!.options.map((o) => o.piece.id);
  const mild = options(base, "mild");
  const last = mild[mild.length - 1]!;
  const warm = confirmPiece(base, last, { traits: { warmth: "warm" } });
  assert.equal(options(warm, "cold")[0], last);
  assert.deepEqual(options(warm, "mild"), mild);
  const all = hijabAlternatives(
    base,
    session.request,
    session.pieceIds,
    score,
    { all: true },
  )!;
  const hijabs = base.pieces.filter(
    (p) => p.category === "hijab" && !session.pieceIds.includes(p.id),
  );
  assert.equal(all.options.length, hijabs.length);
  assert.ok(all.options.every((o) => o.reason === null));
});
