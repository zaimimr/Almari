import assert from "node:assert/strict";
import { test } from "node:test";
import { decodeCloset, emptyCloset, type StylePreset } from "./closet";
import { ClosetRepository } from "./repository";

const office: StylePreset = {
  id: "office",
  name: "Office",
  occasion: "work",
  style: "western",
  hijab: "always",
  coverage: { sleeve: "long", hem: "ankle" },
  feel: "smart",
};

function stored(presets: unknown) {
  return JSON.stringify({
    ...emptyCloset,
    styling: { ...emptyCloset.styling, presets },
  });
}

test("existing closets load without adding or requiring named presets", () => {
  assert.deepEqual(decodeCloset(JSON.stringify(emptyCloset)), emptyCloset);
  assert.equal(decodeCloset(null).styling.presets, undefined);
});

test("named presets survive decoding with coverage and dressiness intact", () => {
  assert.deepEqual(decodeCloset(stored([office])).styling.presets, [office]);
});

test("invalid preset fields cannot make an otherwise valid closet unreadable", () => {
  const malformed = [
    null,
    "office",
    { ...office, name: " " },
    { ...office, name: " Office " },
    { ...office, name: "x".repeat(41) },
    { ...office, name: "Office\u0000" },
    { ...office, name: "Office  hours" },
    { ...office, occasion: "unknown" },
    { ...office, style: "unknown" },
    { ...office, hijab: "sometimes" },
    { ...office, feel: "unknown" },
    { ...office, coverage: { sleeve: "unknown", hem: "ankle" } },
    { ...office, id: " " },
  ];
  assert.deepEqual(
    decodeCloset(stored([...malformed, office])).styling.presets,
    [office],
  );
  assert.equal(decodeCloset(stored({ office })).styling.presets, undefined);
});

test("duplicate preset names and ids keep the first valid preset", () => {
  const casual: StylePreset = {
    ...office,
    id: "casual",
    name: "Weekend",
    occasion: "everyday",
    feel: "comfy",
  };
  assert.deepEqual(
    decodeCloset(
      stored([
        office,
        { ...office, name: "Another" },
        { ...office, id: "duplicate", name: "OFFICE" },
        casual,
      ]),
    ).styling.presets,
    [office, casual],
  );
});

test("named presets persist through repository reload without changing defaults", async () => {
  let value: string | null = null;
  const storage = {
    read: async () => value,
    write: async (next: string) => {
      value = next;
    },
  };
  const repository = new ClosetRepository(storage);
  await repository.load();
  const before = repository.getSnapshot().styling;
  await repository.update((closet) => ({
    ...closet,
    styling: { ...closet.styling, presets: [office] },
  }));
  const reopened = new ClosetRepository(storage);
  await reopened.load();
  assert.deepEqual(reopened.getSnapshot().styling, {
    ...before,
    presets: [office],
  });
});
