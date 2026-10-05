import { test } from "node:test";
import assert from "node:assert/strict";
import { emptyCloset, savePiece, type Piece } from "./closet";
import { namedSwatch } from "./color";
import { filesInUse } from "./importing";
import {
  colourName,
  linkFromPage,
  linkHost,
  withProductLink,
  withoutProductLink,
  type ProductLink,
} from "./productLink";

const piece = (changes: Partial<Piece> = {}): Piece => ({
  id: "piece",
  name: "Top",
  category: "top",
  photo: "piece.png",
  createdAt: "2026-10-01T08:00:00Z",
  source: "owned",
  ...changes,
});

const link = (changes: Partial<ProductLink> = {}): ProductLink => ({
  url: "https://www.zalando.no/top.html",
  at: "2026-10-05T10:00:00Z",
  brand: "Anna Field",
  colour: "black/bordeaux/white/svart",
  price: { amount: 271, currency: "NOK" },
  materials: [
    { fibre: "cotton", percent: 95 },
    { fibre: "elastane", percent: 5 },
  ],
  fabric: "jersey",
  sizes: ["S", "M"],
  care: ["Maskinvask på 30 °C"],
  photos: ["link-1.jpg"],
  ...changes,
});

test("shop colour words map to palette names", () => {
  assert.equal(colourName("BLACK"), "Black");
  assert.equal(colourName("black/bordeaux/white/svart"), "Black");
  assert.equal(colourName("Dark Dusty Red"), "Red");
  assert.equal(colourName("Mørkerød"), "Burgundy");
  assert.equal(colourName("Marineblå"), "Navy");
  assert.equal(colourName("CHALK WHITE"), "White");
  assert.equal(colourName("Støvete rosa"), "Blush");
  assert.equal(colourName("Tapioca"), null);
  assert.equal(colourName(undefined), null);
});

test("a link fills open fields as guesses", () => {
  const next = withProductLink(piece(), link());
  assert.equal(next.link?.url, "https://www.zalando.no/top.html");
  assert.equal(next.attributes?.fabric, "jersey");
  assert.equal(next.sources?.fabric, "proposed");
  assert.deepEqual(next.colors?.[0], namedSwatch("Black"));
  assert.equal(next.sources?.colour, "proposed");
  assert.deepEqual(next.price, { amount: 271, currency: "NOK" });
});

test("a link never overwrites what she confirmed", () => {
  const before = piece({
    attributes: { fabric: "silk" },
    sources: { fabric: "confirmed", colour: "confirmed" },
    colors: [namedSwatch("Navy")],
    price: { amount: 100, currency: "NOK" },
  });
  const next = withProductLink(before, link());
  assert.equal(next.attributes?.fabric, "silk");
  assert.equal(next.sources?.fabric, "confirmed");
  assert.deepEqual(next.colors, [namedSwatch("Navy")]);
  assert.deepEqual(next.price, { amount: 100, currency: "NOK" });
});

test("a link keeps a fabric read from the care label", () => {
  const before = piece({
    attributes: { fabric: "cotton" },
    sources: { fabric: "label" },
  });
  assert.equal(withProductLink(before, link()).attributes?.fabric, "cotton");
});

test("a linked piece saves and keeps its extra photos in use", () => {
  const saved = savePiece(emptyCloset, withProductLink(piece(), link()));
  assert.ok(filesInUse(saved).has("link-1.jpg"));
  const cleared = withoutProductLink(saved.pieces[0]!);
  assert.equal(cleared.link, undefined);
  assert.throws(() =>
    savePiece(emptyCloset, piece({ link: link({ url: "javascript:x" }) })),
  );
});

test("a read page becomes a stored link without empty fields", () => {
  assert.deepEqual(
    linkFromPage(
      {
        url: "https://shop.example/p",
        name: "Top",
        brand: null,
        colour: null,
        price: null,
        images: ["https://shop.example/a.jpg"],
        materials: [],
        fabric: null,
        sizes: ["M"],
        size: "M",
        care: [],
      },
      "2026-10-05T10:00:00Z",
    ),
    {
      url: "https://shop.example/p",
      at: "2026-10-05T10:00:00Z",
      sizes: ["M"],
      size: "M",
    },
  );
  assert.equal(linkHost("https://www2.hm.com/no_no/p.html"), "hm.com");
});
