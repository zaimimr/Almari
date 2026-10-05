import { test } from "node:test";
import assert from "node:assert/strict";
import data from "./rulebook.json";
import { en } from "../../i18n/en";
import { nb } from "../../i18n/nb";
import { parseRuleBook, ruleBook } from "./rulebook";

const copy = () => JSON.parse(JSON.stringify(data)) as Record<string, unknown>;
const rules = (book: Record<string, unknown>) =>
  book.rules as Record<string, unknown>[];
const placeholders = (text: string) =>
  [...text.matchAll(/\{(\w+)\}/g)].map((match) => match[1]!).sort();

test("the bundled rule book loads with sourced rules and positive-only reasons", () => {
  assert.equal(ruleBook.version, 1);
  assert.ok(ruleBook.rules.length >= 100);
  for (const rule of ruleBook.rules) {
    assert.match(rule.source, /^[a-z-]+:/);
    assert.notEqual(rule.weight, 0);
    if (rule.reason) assert.ok(rule.weight > 0, rule.id);
  }
  const ids = ruleBook.rules.map((rule) => rule.id);
  for (const id of [
    "hijab-solid-with-print",
    "volume-both-halves",
    "formality-spread",
    "formal-shoes",
    "gharara-short-top",
    "formal-set-split",
    "hijab-dupatta-three-colours",
    "not-dressed-up",
    "denim-jacket-kurti",
    "warm-fabric-cold",
    "accent-four",
    "accent-echo",
    "top-bottom-near-miss",
    "tonal-steps",
    "one-bold-print",
    "warm-cool-large-pieces",
    "all-light",
  ])
    assert.ok(ids.includes(id), id);
});

test("every reason has English and bokmål text with the same known placeholders", () => {
  const english: Record<string, string> = en;
  const bokmal: Record<string, string> = nb;
  const withReason = ruleBook.rules.filter((rule) => rule.reason);
  for (const rule of withReason) {
    const key = `reason.${rule.id}`;
    assert.ok(english[key], key);
    assert.ok(bokmal[key], key);
    assert.deepEqual(placeholders(bokmal[key]!), placeholders(english[key]!));
    for (const name of placeholders(english[key]!))
      assert.ok(["a", "b", "occasion"].includes(name), `${key}: ${name}`);
  }
  const keys = Object.keys(english).filter((key) => key.startsWith("reason."));
  const plural = keys.filter((key) => key.endsWith("_plural"));
  assert.deepEqual(
    keys.filter((key) => !key.endsWith("_plural")).sort(),
    withReason.map((rule) => `reason.${rule.id}`).sort(),
  );
  for (const key of plural) {
    const base = key.replace(/_plural$/, "");
    assert.ok(english[base], key);
    assert.ok(bokmal[key], key);
    assert.deepEqual(placeholders(english[key]!), placeholders(english[base]!));
    assert.deepEqual(placeholders(bokmal[key]!), placeholders(english[base]!));
  }
});

test("a rule book with an unknown garment, setting, reason value or duplicate id is rejected", () => {
  const unknownKind = copy();
  rules(unknownKind)[0]!.if = { has: { kind: ["poncho"] } };
  assert.throws(() => parseRuleBook(unknownKind), /unknown value poncho/);

  const unknownSetting = copy();
  rules(unknownSetting)[0]!.when = { profile: { mood: [true] } };
  assert.throws(() => parseRuleBook(unknownSetting), /unknown setting mood/);

  const coverage = copy();
  rules(coverage)[0]!.when = { profile: { coverageLevel: ["full"] } };
  assert.throws(() => parseRuleBook(coverage), /unknown setting coverageLevel/);

  const text = copy();
  rules(text)[0]!.reason = "Every piece is lovely.";
  assert.throws(() => parseRuleBook(text), /reason must be true/);

  const duplicate = copy();
  rules(duplicate)[1]!.id = rules(duplicate)[0]!.id;
  assert.throws(() => parseRuleBook(duplicate), /duplicate id/);

  const negativeReason = copy();
  rules(negativeReason)[1]!.reason = true;
  assert.throws(
    () => parseRuleBook(negativeReason),
    /only positive rules give reasons/,
  );
});
