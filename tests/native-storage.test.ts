import { beforeEach, expect, it, vi } from "vitest";

import { emptyCloset } from "../src/domain/closet";
import { closetStorage } from "../src/storage/local.native";

const native = vi.hoisted(() => ({
  values: new Map<string, string>(),
  fixtures: {} as { failWrite?: boolean; failLookSave?: boolean },
}));

vi.mock("expo-sqlite/kv-store", () => ({
  default: {
    getItem: async (key: string) => native.values.get(key) ?? null,
    setItem: async (key: string, value: string) =>
      native.values.set(key, value),
    removeItem: async (key: string) => native.values.delete(key),
  },
}));
vi.mock("expo-file-system", () => ({
  Directory: class {},
  File: class {},
  Paths: { document: "file:///documents" },
}));
vi.mock("expo-crypto", () => ({ randomUUID: vi.fn() }));
vi.mock("../src/testing/fixtures", () => ({ fixtures: native.fixtures }));

beforeEach(() => {
  native.values.clear();
  delete native.fixtures.failWrite;
  delete native.fixtures.failLookSave;
});

it("normal native closet writes persist without fixture flags", async () => {
  const value = JSON.stringify(emptyCloset);
  await closetStorage.write(value);
  expect(await closetStorage.read()).toBe(value);
});

it("a look-save fault survives startup writes, preserves the old look and permits retry", async () => {
  const look = {
    id: "office",
    name: "Office",
    pieceIds: ["old-hijab"],
    createdAt: "2026-10-07T07:00:00Z",
  };
  const initial = { ...emptyCloset, looks: [look] };
  await closetStorage.write(JSON.stringify(initial));
  native.fixtures.failLookSave = true;
  const prepared = { ...initial, photoTipsSeen: true };
  await closetStorage.write(JSON.stringify(prepared));
  expect(native.fixtures.failLookSave).toBe(true);
  const changed = JSON.stringify({
    ...prepared,
    looks: [{ ...look, pieceIds: ["new-hijab"] }],
  });
  await expect(closetStorage.write(changed)).rejects.toThrow("fixture");
  expect(await closetStorage.read()).toBe(JSON.stringify(prepared));
  await closetStorage.write(changed);
  expect(await closetStorage.read()).toBe(changed);
});

it("the existing next-write fault still fails once and allows retry", async () => {
  const value = JSON.stringify(emptyCloset);
  native.fixtures.failWrite = true;
  await expect(closetStorage.write(value)).rejects.toThrow("fixture");
  expect(await closetStorage.read()).toBeNull();
  await closetStorage.write(value);
  expect(await closetStorage.read()).toBe(value);
});
