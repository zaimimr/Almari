import { test } from "node:test";
import assert from "node:assert/strict";
import { gutterFor, theme } from "../ui/theme";

test("tokens follow the approved mockup", () => {
  assert.equal(theme.colors.blushStrong, "#BE8077");
  assert.equal(theme.colors.blushEdge, "#9A5A52");
  assert.equal(theme.colors.paper, "#FEF6DE");
  assert.equal(theme.colors.plum, "#675469");
  assert.equal(theme.radius.full, 999);
  assert.equal(theme.space.footerInset, 48);
  assert.equal(gutterFor(390), 16);
  assert.equal(gutterFor(428), 20);
  assert.equal(theme.type.title.maxFontSizeMultiplier, 2);
});
