import { test } from "node:test";
import assert from "node:assert/strict";
import {
  decodeCloset,
  emptyCloset,
  occasionLabel,
  occasionOptions,
  occasionPhrase,
  occasions,
  savePiece,
  type Piece,
} from "./closet";
import { en } from "../i18n/en";
import { nb } from "../i18n/nb";
import { addSampleWardrobe, sampleCatalogVersion } from "./samples";
import { activeSession, saveEverydayStyle } from "./today";

const clock = { localDate: "2026-10-01", timeZone: "Europe/Oslo" };

test("the eight occasions carry their formality levels and phrases", () => {
  assert.deepEqual(
    occasions.map((occasion) => [
      occasion.id,
      occasionLabel(occasion.id),
      occasion.formality,
    ]),
    [
      ["everyday", "Everyday", 1],
      ["work", "Work", 2],
      ["gym", "Gym", 0],
      ["dinner", "Dinner or dawat", 3],
      ["eid", "Eid", 4],
      ["party", "Party or mehndi", 4],
      ["wedding", "Wedding or nikah", 5],
      ["barat", "Barat", 6],
    ],
  );
  assert.equal(occasionPhrase("party"), "a party or mehndi");
  assert.deepEqual(occasionOptions()[3], {
    id: "dinner",
    label: "Dinner or dawat",
  });
});

test("every occasion has an English and a bokmål label and phrase", () => {
  const catalogs: Record<string, string>[] = [en, nb];
  for (const catalog of catalogs)
    for (const occasion of occasions) {
      assert.ok(catalog[`occasion.${occasion.id}`], occasion.id);
      assert.ok(catalog[`occasion.${occasion.id}.phrase`], occasion.id);
    }
  assert.equal(nb["occasion.party"], "Fest eller mehndi");
});

test("stored celebration occasions open as Party or mehndi everywhere", () => {
  const styled = saveEverydayStyle(
    addSampleWardrobe(emptyCloset),
    { occasion: "party", style: "desi", hijab: "always", sample: false },
    clock,
    true,
  );
  const stored = JSON.stringify(styled).replaceAll('"party"', '"celebration"');
  const closet = decodeCloset(stored);
  assert.equal(JSON.stringify(closet).includes("celebration"), false);
  assert.equal(closet.styling.everyday!.occasion, "party");
  assert.equal(activeSession(closet.styling.today!).request.occasion, "party");
  assert.ok(
    closet.pieces
      .find((piece) => piece.id === "sample-mauve-hijab")!
      .traits!.occasions!.includes("party"),
  );
});

test("a piece tagged both celebration and party keeps one party tag", () => {
  const raw = JSON.parse(JSON.stringify(addSampleWardrobe(emptyCloset)));
  raw.pieces[0].traits.occasions = ["everyday", "celebration", "party"];
  const closet = decodeCloset(JSON.stringify(raw));
  assert.deepEqual(closet.pieces[0]!.traits!.occasions, ["everyday", "party"]);
});

test("the new sample catalog refreshes sample details without restoring removed samples", () => {
  const mine: Piece = {
    id: "my-hijab",
    name: "My hijab",
    category: "hijab",
    photo: "mine.jpg",
    createdAt: "2026-10-01T00:00:00Z",
    source: "owned",
  };
  const current = savePiece(addSampleWardrobe(emptyCloset), mine);
  const stale = {
    ...current,
    sampleCatalog: 2,
    pieces: current.pieces
      .filter((piece) => piece.id !== "sample-navy-blazer")
      .map((piece) =>
        piece.id === "sample-mauve-hijab"
          ? {
              ...piece,
              name: "My favourite mauve",
              attributes: undefined,
              colors: undefined,
              traits: { tone: "mid" as const, occasions: ["work" as const] },
            }
          : piece,
      ),
  };
  const next = addSampleWardrobe(stale);
  assert.equal(next.sampleCatalog, sampleCatalogVersion);
  assert.equal(
    next.pieces.some((piece) => piece.id === "sample-navy-blazer"),
    false,
  );
  const hijab = next.pieces.find((piece) => piece.id === "sample-mauve-hijab")!;
  assert.equal(hijab.name, "My favourite mauve");
  assert.deepEqual(hijab.attributes, {
    pattern: "solid",
    fabric: "chiffon",
    formality: 3,
  });
  assert.deepEqual(hijab.colors, [{ rgb: [153, 108, 115], share: 1 }]);
  assert.ok(hijab.traits!.occasions!.includes("wedding"));
  assert.deepEqual(
    next.pieces.find((piece) => piece.id === "my-hijab"),
    mine,
  );
});
