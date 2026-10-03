import { test } from "node:test";
import assert from "node:assert/strict";
import { hyphenate } from "./hyphenate";

const soft = "­";

test("long bokmål words get soft hyphens at syllables, short words stay", () => {
  assert.equal(
    hyphenate("eksempelgarderoben", "nb"),
    ["ek", "sem", "pel", "gar", "de", "ro", "ben"].join(soft),
  );
  assert.ok(hyphenate("tilgjengelighet", "nb").includes(soft));
  assert.equal(hyphenate("Hijabstiler", "nb"), "Hijabstiler");
  assert.equal(hyphenate("Bruk i dag", "nb"), "Bruk i dag");
});

test("long English words get soft hyphens, eleven letters and up", () => {
  assert.ok(hyphenate("Unavailable", "en").includes(soft));
  assert.equal(hyphenate("Availability".slice(0, 10), "en"), "Availabili");
});

test("English keeps at least three letters after the last break", () => {
  assert.equal(
    hyphenate("Availability", "en"),
    ["Avail", "abil", "ity"].join(soft),
  );
});
