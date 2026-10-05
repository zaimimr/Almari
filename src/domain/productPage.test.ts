import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { botPage } from "./link";
import {
  readProductPage,
  readShopifyProduct,
  shopifyJsonUrl,
  type ProductPage,
} from "./productPage";
import shopify from "./fixtures/shops/shopify.json";

const shop = (name: string) =>
  readFileSync(join(__dirname, "fixtures", "shops", name), "utf8");

test("a Boozt page gives the chosen colour, price, sizes, material and gallery", () => {
  const page = readProductPage(
    shop("boozt.html"),
    "https://www.boozt.com/no/no/andiata/fifi-2-top_32195178/226208750",
  );
  assert.equal(page.name, "Fifi 2 Top");
  assert.equal(page.brand, "Andiata");
  assert.equal(page.colour, "BLACK");
  assert.deepEqual(page.price, { amount: 2100, currency: "NOK" });
  assert.deepEqual(page.sizes, ["XS", "S", "M", "L", "XL"]);
  assert.deepEqual(page.materials, [
    { fibre: "viscose", percent: 91 },
    { fibre: "elastane", percent: 9 },
  ]);
  assert.equal(page.images.length, 3);
  assert.match(page.images[0]!, /ndi0422599000_cblack\.webp/);
  assert.ok(page.images.every((url) => !url.includes("chalkwhite")));
});

test("a Lindex page reads the JSON-LD material and finds the full gallery", () => {
  const page = readProductPage(
    shop("lindex.html"),
    "https://www.lindex.com/no/p/3001152-7390-rod-topp-i-ullblanding",
  );
  assert.equal(page.brand, "Lindex");
  assert.equal(page.colour, "Dark Dusty Red");
  assert.deepEqual(page.price, { amount: 399, currency: "NOK" });
  assert.deepEqual(page.sizes, ["S", "M", "L", "XL"]);
  assert.deepEqual(page.materials, [
    { fibre: "lyocell", percent: 65 },
    { fibre: "wool", percent: 30 },
    { fibre: "elastane", percent: 5 },
  ]);
  assert.equal(page.fabric, "wool");
  assert.ok(page.images.length >= 6);
  assert.ok(page.images.every((url) => url.includes("3001152_7390")));
});

test("a Zalando page reads labelled material, fabric and care, not reviews", () => {
  const page = readProductPage(
    shop("zalando.html"),
    "https://www.zalando.no/anna-field-3-pack-topper-langermet-blackbordeauxwhite-an621d1al-q11.html",
  );
  assert.equal(page.brand, "Anna Field by Zalando");
  assert.deepEqual(page.price, { amount: 271, currency: "NOK" });
  assert.deepEqual(page.materials, [
    { fibre: "cotton", percent: 95 },
    { fibre: "elastane", percent: 5 },
  ]);
  assert.equal(page.fabric, "jersey");
  assert.deepEqual(page.sizes, ["XS", "S", "M", "L", "XL", "XXL", "3XL"]);
  assert.equal(page.size, null);
  assert.equal(page.care[0], "Maskinvask på 30 °C");
  assert.ok(page.images.length >= 4);
  assert.ok(page.images.every((url) => url.includes("imwidth=1000")));
});

test("a size variant link picks her size", () => {
  const html = `<script type="application/ld+json">${JSON.stringify({
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "ProductGroup",
        name: "Wrap dress",
        brand: { "@type": "Brand", name: "Shop" },
        color: "Navy",
        image: ["https://shop.example/a.jpg", "https://shop.example/b.jpg"],
        hasVariant: ["S", "M", "L"].map((size) => ({
          "@type": "Product",
          size,
          color: "Navy",
          url: `https://shop.example/p/dress?size=${size}`,
          offers: { price: "499.00", priceCurrency: "NOK" },
        })),
      },
    ],
  })}</script>`;
  const page = readProductPage(html, "https://shop.example/p/dress?size=M");
  assert.equal(page.size, "M");
  assert.deepEqual(page.sizes, ["S", "M", "L"]);
  assert.deepEqual(page.price, { amount: 499, currency: "NOK" });
  assert.deepEqual(page.images, [
    "https://shop.example/a.jpg",
    "https://shop.example/b.jpg",
  ]);
});

test("microdata and Open Graph fill in when there is no JSON-LD", () => {
  const html = `<html><head>
    <meta property="og:title" content="Silke hijab | Butikk" />
    <meta property="og:image" content="https://butikk.example/hijab.jpg" />
    <meta property="product:price:amount" content="349" />
    <meta property="product:price:currency" content="NOK" />
    </head><body>
    <span itemprop="brand" content="Butikk"></span>
    <dl><dt>Materiale</dt><dd>100% silke</dd><dt>Vaskeråd</dt><dd>Håndvask</dd></dl>
    </body></html>`;
  const page = readProductPage(html, "https://butikk.example/hijab");
  assert.equal(page.name, "Silke hijab");
  assert.equal(page.brand, "Butikk");
  assert.deepEqual(page.price, { amount: 349, currency: "NOK" });
  assert.deepEqual(page.materials, [{ fibre: "silk", percent: 100 }]);
  assert.equal(page.fabric, "silk");
  assert.deepEqual(page.care, ["Håndvask"]);
  assert.deepEqual(page.images, ["https://butikk.example/hijab.jpg"]);
});

test("a blocked page gives no product", () => {
  const html = shop("blocked.html");
  assert.ok(botPage(html));
  const page = readProductPage(
    html,
    "https://www2.hm.com/no_no/productpage.1300636004.html",
  );
  assert.deepEqual(page.images, []);
  assert.equal(page.price, null);
});

test("a Shopify product link has a JSON endpoint", () => {
  assert.equal(
    shopifyJsonUrl(
      '<link href="//cdn.shopify.com/s/files/x.css">',
      "https://verona-collection.com/products/premium-viscose?variant=39612690038864",
    ),
    "https://verona-collection.com/products/premium-viscose.json",
  );
  assert.equal(
    shopifyJsonUrl(null, "https://shop.example/collections/products/x"),
    "https://shop.example/collections/products/x.json",
  );
  assert.equal(
    shopifyJsonUrl("<html></html>", "https://shop.example/products/x"),
    null,
  );
  assert.equal(shopifyJsonUrl(null, "https://shop.example/p/x"), null);
});

test("Shopify product JSON gives photos, sizes, colour and material", () => {
  const before: ProductPage = {
    url: "https://verona-collection.com/products/premium-viscose?variant=39709800038480",
    name: "Premium Viscose",
    brand: null,
    colour: null,
    price: { amount: 12, currency: "USD" },
    images: ["https://www.verona-collection.com/cdn/shop/products/3_600x.jpg"],
    materials: [],
    fabric: null,
    sizes: [],
    size: null,
    care: [],
  };
  const page = readShopifyProduct(shopify, before);
  assert.equal(page.brand, "Verona Collection");
  assert.equal(page.colour, "Burnt Orange");
  assert.deepEqual(page.sizes, ["BASIC", "MAXI"]);
  assert.equal(page.size, "MAXI");
  assert.deepEqual(page.materials, [{ fibre: "viscose", percent: 100 }]);
  assert.deepEqual(page.price, { amount: 12, currency: "USD" });
  assert.equal(page.images.length, 4);
  assert.ok(page.images.every((url) => url.includes("cdn.shopify.com")));
});
