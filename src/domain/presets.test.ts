import { test } from "node:test";
import assert from "node:assert/strict";
import { emptyCloset, type OutfitRequest, type StylePreset } from "./closet";
import {
  applyStylePreset,
  isStylePreset,
  normalizePresetName,
  presetFromRequest,
  removeStylePreset,
  saveStylePreset,
} from "./presets";

const request: OutfitRequest = {
  occasion: "everyday",
  style: "western",
  hijab: "always",
  coverage: { sleeve: "long", hem: "ankle" },
  feel: "comfy",
  garmentType: "kurti",
  keptIds: ["owned-top"],
  excludedIds: ["owned-bottom"],
  wardrobe: "owned",
  weather: {
    source: "manual",
    warmth: "cold",
    precipitation: "rain",
    exposure: "time-outside",
  },
};

const dinner: StylePreset = {
  id: "dinner",
  name: "Dinner",
  occasion: "dinner",
  style: "desi",
  hijab: "not-needed",
  coverage: { sleeve: "elbow", hem: "calf" },
  feel: "dressed",
};

test("preset names trim and normalize repeated spaces", () => {
  assert.equal(
    normalizePresetName("  Family   gathering  "),
    "Family gathering",
  );
  assert.equal(normalizePresetName("Kontor"), "Kontor");
  assert.equal(normalizePresetName("A".repeat(40)), "A".repeat(40));
});

test("malformed names cannot create a preset", () => {
  for (const name of [
    "",
    " ",
    "A".repeat(41),
    "Work\nNight",
    "Work\u0000",
    "\t",
    "A\u007f",
  ]) {
    assert.equal(normalizePresetName(name), null);
    assert.equal(presetFromRequest("new", name, request), null);
  }
  assert.equal(normalizePresetName(null), null);
  assert.equal(normalizePresetName(8), null);
});

test("capture stores styling without weather, pieces or wardrobe", () => {
  const preset = presetFromRequest("office", "  Office  ", request);
  assert.deepEqual(preset, {
    id: "office",
    name: "Office",
    occasion: "everyday",
    style: "western",
    hijab: "always",
    coverage: { sleeve: "long", hem: "ankle" },
    feel: "comfy",
  });
  assert.notEqual(preset?.coverage, request.coverage);
});

test("application changes every styling setting and preserves request context", () => {
  const applied = applyStylePreset(request, dinner);
  assert.deepEqual(applied, {
    ...request,
    occasion: "dinner",
    style: "desi",
    hijab: "not-needed",
    coverage: { sleeve: "elbow", hem: "calf" },
    feel: "dressed",
  });
  assert.equal(applied.keptIds, request.keptIds);
  assert.equal(applied.excludedIds, request.excludedIds);
  assert.equal(applied.weather, request.weather);
  assert.notEqual(applied.coverage, dinner.coverage);
  assert.equal(request.occasion, "everyday");
});

test("a preset without coverage or dressiness clears previous choices", () => {
  const preset = presetFromRequest("weekend", "Weekend", {
    occasion: "everyday",
    style: "western",
    hijab: null,
  })!;
  const applied = applyStylePreset(request, preset);
  assert.equal(applied.coverage, undefined);
  assert.equal(applied.feel, undefined);
  assert.equal(applied.hijab, null);
  assert.equal("coverage" in applied, false);
  assert.equal("feel" in applied, false);
});

test("preset boundary rejects invalid ids, settings, names and coverage", () => {
  for (const preset of [
    null,
    [],
    {},
    { ...dinner, id: "" },
    { ...dinner, id: " " },
    { ...dinner, name: null },
    { ...dinner, name: 1 },
    { ...dinner, name: " Dinner" },
    { ...dinner, name: "Double  spaces" },
    { ...dinner, name: "A\nB" },
    { ...dinner, occasion: "office" },
    { ...dinner, style: "casual" },
    { ...dinner, hijab: "sometimes" },
    { ...dinner, hijab: undefined },
    { ...dinner, feel: "formal" },
    { ...dinner, coverage: null },
    { ...dinner, coverage: [] },
    { ...dinner, coverage: {} },
    { ...dinner, coverage: { sleeve: "short", hem: "ankle" } },
    { ...dinner, coverage: { sleeve: "long", hem: "mini" } },
  ])
    assert.equal(isStylePreset(preset), false, JSON.stringify(preset));
  assert.equal(presetFromRequest("", "Office", request), null);
});

test("preset boundary accepts optional and nullable settings", () => {
  assert.equal(isStylePreset(dinner), true);
  assert.equal(
    isStylePreset({ ...dinner, coverage: undefined, feel: undefined }),
    true,
  );
  assert.equal(
    isStylePreset({
      ...dinner,
      hijab: null,
      coverage: { sleeve: null, hem: null },
    }),
    true,
  );
  assert.equal(
    isStylePreset({ ...dinner, coverage: { sleeve: "any", hem: "any" } }),
    true,
  );
});

test("saving and updating a preset leaves the wardrobe and personal profile unchanged", () => {
  const saved = saveStylePreset(emptyCloset, dinner);
  const updated = saveStylePreset(saved, {
    ...dinner,
    name: "Family gathering",
    occasion: "party",
    feel: "smart",
  });
  assert.equal(updated.styling.presets?.length, 1);
  assert.equal(updated.styling.presets?.[0]?.name, "Family gathering");
  assert.equal(updated.styling.presets?.[0]?.occasion, "party");
  assert.equal(updated.styling.presets?.[0]?.feel, "smart");
  assert.equal(updated.styling.profile, emptyCloset.styling.profile);
  assert.equal(updated.styling.everyday, emptyCloset.styling.everyday);
  assert.equal(updated.pieces, emptyCloset.pieces);
  assert.equal(saved.styling.presets?.[0]?.name, "Dinner");
  assert.equal(emptyCloset.styling.presets?.length ?? 0, 0);
});

test("save rejects invalid presets and duplicate names while allowing unchanged name updates", () => {
  const saved = saveStylePreset(emptyCloset, dinner);
  assert.equal(
    saveStylePreset(saved, { ...dinner, id: "second", name: "dinner" }),
    saved,
  );
  assert.equal(saveStylePreset(saved, { ...dinner, name: "" }), saved);
  assert.equal(
    saveStylePreset(saved, { ...dinner, feel: "smart" }).styling.presets?.[0]
      ?.feel,
    "smart",
  );
});

test("JSON roundtrip retains every preset setting", () => {
  const saved = saveStylePreset(emptyCloset, dinner);
  const roundtrip = JSON.parse(JSON.stringify(saved));
  assert.equal(isStylePreset(roundtrip.styling.presets[0]), true);
  assert.deepEqual(roundtrip.styling.presets[0], dinner);
  assert.deepEqual(
    applyStylePreset(request, roundtrip.styling.presets[0]),
    applyStylePreset(request, dinner),
  );
});

test("removing a preset preserves other presets and existing plans", () => {
  const saved = saveStylePreset(saveStylePreset(emptyCloset, dinner), {
    ...dinner,
    id: "office",
    name: "Office",
  });
  const removed = removeStylePreset(saved, "dinner");
  assert.deepEqual(
    removed.styling.presets?.map(({ id }) => id),
    ["office"],
  );
  assert.equal(removed.styling.today, saved.styling.today);
  assert.equal(removed.styling.fits, saved.styling.fits);
  assert.equal(removed.looks, saved.looks);
  assert.equal(removeStylePreset(removed, "missing"), removed);
  assert.equal(removeStylePreset(emptyCloset, "missing"), emptyCloset);
});
