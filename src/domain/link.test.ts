import { test } from "node:test";
import assert from "node:assert/strict";
import {
  cleanTitle,
  imageExtension,
  productFromPage,
  productLink,
} from "./link";

test("a product page gives its og image and a short name", () => {
  const html = `<html><head>
    <meta property="og:title" content="Linen Kurta &amp; Trousers | Shop Name" />
    <meta content="/media/kurta.jpg?w=1200" property="og:image">
    <title>Ignored</title></head></html>`;
  assert.deepEqual(productFromPage(html, "https://shop.example/p/42"), {
    image: "https://shop.example/media/kurta.jpg?w=1200",
    name: "Linen Kurta & Trousers",
  });
});

test("twitter tags and the page title are fallbacks", () => {
  const html = `<meta name='twitter:image' content='https://cdn.example/a.png'>
    <title>Silk scarf - Brand</title>`;
  assert.deepEqual(productFromPage(html, "https://shop.example/"), {
    image: "https://cdn.example/a.png",
    name: "Silk scarf",
  });
});

test("a page with no image gives nothing", () => {
  assert.equal(
    productFromPage("<title>Hi</title>", "https://shop.example/"),
    null,
  );
  assert.equal(
    productFromPage(
      `<meta property="og:image" content="data:image/png;base64,AA">`,
      "https://shop.example/",
    ),
    null,
  );
});

test("links without a scheme get https and junk is refused", () => {
  assert.equal(productLink(" shop.example/p/1 "), "https://shop.example/p/1");
  assert.equal(productLink("http://shop.example"), "http://shop.example/");
  assert.equal(productLink("hello"), null);
  assert.equal(productLink("ftp://shop.example/a"), null);
});

test("long titles stop at a word", () => {
  const name = cleanTitle(`${"word ".repeat(30)}end`)!;
  assert.ok(name.length <= 80);
  assert.ok(name.endsWith("word"));
  assert.equal(cleanTitle("  "), null);
  assert.equal(
    cleanTitle("ASOS DESIGN oversized t-shirt in black | ASOS"),
    "Oversized t-shirt in black",
  );
  assert.equal(cleanTitle("Linen Kurta | Shop"), "Linen Kurta");
});

test("png images keep their extension", () => {
  assert.equal(imageExtension("image/png", "https://a.example/x"), ".png");
  assert.equal(imageExtension(null, "https://a.example/x.PNG?w=2"), ".png");
  assert.equal(imageExtension("image/jpeg", "https://a.example/x"), ".jpg");
});
