import { test } from "node:test";
import assert from "node:assert/strict";
import { en } from "../i18n/en";
import { nb } from "../i18n/nb";

const keys = [
  "capture.found",
  "capture.foundOne",
  "capture.review",
  "capture.group.title",
  "capture.group.intro",
  "capture.group.gone",
  "capture.group.goneHint",
  "capture.othersIgnored",
  "capture.keep",
  "capture.drop",
  "capture.adjust",
  "capture.addPiece",
  "capture.drawHint",
  "capture.useBox",
  "capture.cancel",
  "capture.done",
  "capture.larger",
  "capture.smaller",
  "capture.box",
  "capture.photo",
  "capture.newPiece",
  "capture.partial",
  "capture.partialCheck",
  "capture.retake",
  "capture.photoTip",
  "region.head",
  "region.upper",
  "region.skirt",
  "region.pants",
  "region.dress",
  "region.belt",
  "region.shoes",
  "region.bag",
  "region.sunglasses",
  "advice.useAnyway",
  "advice.merged.title",
  "advice.merged.body",
  "advice.clipped.title",
  "advice.clipped.body",
  "advice.blur.title",
  "advice.blur.body",
  "advice.dark.title",
  "advice.dark.body",
  "advice.mixed-light.title",
  "advice.mixed-light.body",
  "problem.camera-off",
  "problem.unavailable",
  "problem.low-space",
  "problem.failed",
  "problem.chooseInstead",
  "problem.choosePhotosInstead",
  "problem.openSettings",
  "problem.tryAgain",
  "failure.storage",
  "failure.unreadable",
  "failure.processing",
  "photo.enhancedImage",
  "photo.plainImage",
  "photo.enhanced",
  "photo.plain",
  "duplicate.title",
  "duplicate.named",
  "duplicate.unnamed",
  "duplicate.same",
  "duplicate.different",
  "tips.window",
  "tips.sheet",
  "tips.frame",
  "sets.select",
  "sets.hint",
  "sets.link",
  "sets.linked",
  "sets.linkFailed",
  "sets.partOf",
  "sets.remove",
  "sets.removeFailed",
];

const placeholders = (text: string) =>
  [...text.matchAll(/\{(\w+)\}/g)].map((match) => match[1]).sort();

test("every capture string exists in English and bokmål", () => {
  const english = en as Record<string, string>;
  const norwegian = nb as Record<string, string>;
  assert.equal(new Set(keys).size, 76);
  for (const key of keys) {
    assert.ok(english[key], `${key} missing in English`);
    assert.ok(norwegian[key], `${key} missing in bokmål`);
    assert.ok(
      !`${english[key]}${norwegian[key]}`.includes(String.fromCharCode(0x2014)),
      `${key} has an em dash`,
    );
    assert.deepEqual(
      placeholders(english[key]!),
      placeholders(norwegian[key]!),
      key,
    );
  }
  assert.deepEqual(placeholders(english["capture.found"]!), ["count"]);
  assert.deepEqual(placeholders(english["duplicate.named"]!), ["name"]);
});
