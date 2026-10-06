import { test } from "node:test";
import assert from "node:assert/strict";
import { emptyCloset, saveLook, setAway, type Closet } from "./closet";
import {
  builderRequest,
  fillOutfit,
  followName,
  rankPieces,
  swapOptions,
  withPiece,
} from "./builder";
import { colorName } from "./color";
import { setNeverWear } from "./preferences";
import { addSampleWardrobe } from "./samples";
import { roleOf } from "./styling";
import { saveEverydayStyle } from "./today";

const clock = { localDate: "2026-10-01", timeZone: "Europe/Oslo" };
const samples = addSampleWardrobe(emptyCloset);
const styled: Closet = saveEverydayStyle(
  samples,
  { occasion: "work", style: "western", hijab: "always", sample: true },
  clock,
  true,
);
const piece = (id: string) => samples.pieces.find((item) => item.id === id)!;

test("the builder request follows today and keeps the picked pieces", () => {
  const request = builderRequest(styled, ["sample-ivory-tunic"]);
  assert.equal(request.occasion, "work");
  assert.equal(request.style, "western");
  assert.equal(request.hijab, "always");
  assert.equal(request.wardrobe, "sample");
  assert.deepEqual(request.keptIds, ["sample-ivory-tunic"]);
  assert.equal(builderRequest(styled, [], "eid").occasion, "eid");
});

test("the builder request switches style when every picked piece is Desi", () => {
  assert.equal(builderRequest(styled, ["sample-sage-kurta"]).style, "desi");
  assert.equal(
    builderRequest(styled, ["sample-ivory-trousers"]).style,
    "western",
  );
});

test("without a today or everyday style the request is a plain everyday one", () => {
  const request = builderRequest(samples, []);
  assert.equal(request.occasion, "everyday");
  assert.equal(request.hijab, null);
  assert.equal(request.wardrobe, "sample");
});

test("fill the rest keeps every picked piece and completes the outfit", () => {
  const picked = ["sample-sage-kurta"];
  const filled = fillOutfit(
    styled,
    builderRequest(styled, picked),
    clock.localDate,
  );
  assert.ok("ids" in filled);
  assert.ok(filled.ids.includes("sample-sage-kurta"));
  const roles = filled.ids.map((id) => roleOf(piece(id)));
  assert.ok(roles.includes("bottom"));
  assert.ok(roles.includes("shoes"));
  assert.ok(roles.includes("hijab"));
});

test("fill the rest explains a picked conflict instead of dropping a piece", () => {
  const picked = ["sample-ivory-tunic", "sample-olive-maxi-dress"];
  const filled = fillOutfit(
    styled,
    builderRequest(styled, picked),
    clock.localDate,
  );
  assert.ok("problems" in filled);
  assert.equal(filled.problems[0]!.code, "kept-conflict");
});

test("with nothing picked the strip keeps its order", () => {
  const request = builderRequest(styled, []);
  assert.deepEqual(
    rankPieces(styled, request, [], samples.pieces, clock.localDate),
    samples.pieces,
  );
});

test("the strip puts picked pieces first and pieces that break a rule last", () => {
  const away = setAway(styled, "sample-ivory-trousers", "wash");
  const picked = ["sample-ivory-tunic"];
  const ranked = rankPieces(
    away,
    builderRequest(away, picked),
    picked,
    away.pieces,
    clock.localDate,
  ).map((item) => item.id);
  assert.equal(ranked[0], "sample-ivory-tunic");
  assert.equal(ranked.length, away.pieces.length);
  const fitting = ["sample-ivory-hijab", "sample-chocolate-loafers"].map((id) =>
    ranked.indexOf(id),
  );
  for (const id of [
    "sample-sage-kurta",
    "sample-ivory-salwar",
    "sample-olive-maxi-dress",
    "sample-ivory-trousers",
  ])
    assert.ok(
      fitting.every((index) => index < ranked.indexOf(id)),
      id,
    );
});

test("the strip is ordered by the stylist score with the picked pieces", () => {
  const picked = ["sample-ivory-tunic", "sample-charcoal-trousers"];
  const request = builderRequest(styled, picked);
  const ranked = rankPieces(
    styled,
    request,
    picked,
    styled.pieces,
    clock.localDate,
  );
  const hijabs = ranked.filter((item) => roleOf(item) === "hijab");
  assert.equal(hijabs.length, 5);
  const first = ranked.findIndex((item) => roleOf(item) === "hijab");
  assert.ok(first > 1);
});

test("swap shows up to three other pieces for the same slot, never a picked or away one", () => {
  const away = setAway(styled, "sample-chocolate-hijab", "wash");
  const picked = [
    "sample-ivory-tunic",
    "sample-charcoal-trousers",
    "sample-mauve-hijab",
  ];
  const options = swapOptions(
    away,
    builderRequest(away, picked),
    picked,
    "sample-mauve-hijab",
    clock.localDate,
  ).map((item) => item.id);
  assert.ok(options.includes("sample-ivory-hijab"));
  assert.ok(options.length <= 3);
  assert.ok(
    !options.some(
      (id) => picked.includes(id) || id === "sample-chocolate-hijab",
    ),
  );
  const bottoms = swapOptions(
    styled,
    builderRequest(styled, picked),
    picked,
    "sample-charcoal-trousers",
    clock.localDate,
  ).map((item) => item.id);
  assert.deepEqual(bottoms, ["sample-ivory-trousers"]);
});

test("never wear leaves Fill the rest and the swap, the picker strip keeps it", () => {
  const picked = ["sample-ivory-tunic", "sample-charcoal-trousers"];
  const request = builderRequest(styled, picked);
  const isHijab = (id: string) => roleOf(piece(id)) === "hijab";
  const before = fillOutfit(styled, request, clock.localDate);
  assert.ok("ids" in before);
  const usual = before.ids.find(isHijab)!;
  const colour = colorName(piece(usual).colors![0]!.rgb);
  const never = setNeverWear(styled, [{ colour, on: "hijabs" }]);
  const filled = fillOutfit(never, request, clock.localDate);
  assert.ok("ids" in filled);
  const hijab = filled.ids.find(isHijab);
  assert.ok(hijab && hijab !== usual);
  assert.ok(
    !swapOptions(never, request, filled.ids, hijab, clock.localDate).some(
      (item) => item.id === usual,
    ),
  );
  assert.ok(
    rankPieces(never, request, picked, never.pieces, clock.localDate).some(
      (item) => item.id === usual,
    ),
  );
});

test("the name follows the pieces until she types her own", () => {
  assert.equal(followName("", "", "Sage kurta"), "Sage kurta");
  assert.equal(
    followName("Sage kurta", "Sage kurta", "Ivory tunic"),
    "Ivory tunic",
  );
  assert.equal(
    followName("My Eid look", "Sage kurta", "Ivory tunic"),
    "My Eid look",
  );
});

test("a look built for an occasion keeps it when saved", () => {
  const request = builderRequest(styled, [], "eid");
  assert.equal(request.occasion, "eid");
  const saved = saveLook(styled, {
    id: "eid-look",
    name: "Eid",
    pieceIds: ["sample-sage-kurta"],
    createdAt: "2026-10-01T08:00:00.000Z",
    occasion: request.occasion,
  });
  assert.equal(
    saved.looks.find((look) => look.id === "eid-look")!.occasion,
    "eid",
  );
});

test("a blazer and an open abaya never sit in the same built look", () => {
  const base = ["sample-ivory-tunic", "sample-ivory-trousers"];
  assert.deepEqual(
    withPiece(
      samples.pieces,
      [...base, "sample-navy-blazer"],
      piece("sample-taupe-abaya"),
    ),
    [...base, "sample-taupe-abaya"],
  );
  assert.deepEqual(
    withPiece(
      samples.pieces,
      [...base, "sample-taupe-abaya"],
      piece("sample-navy-blazer"),
    ),
    [...base, "sample-navy-blazer"],
  );
});
