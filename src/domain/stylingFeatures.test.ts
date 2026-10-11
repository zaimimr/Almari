import assert from "node:assert/strict";
import { test } from "node:test";
import { baseRequest } from "./builder";
import { decodeCloset, emptyCloset, type Closet, type Piece } from "./closet";
import { inspirationOutfits, type InspirationGarment } from "./inspiration";
import { plannedOn } from "./looks";
import { presetFromRequest, saveStylePreset } from "./presets";
import { realisticPieces } from "./realistic-closet.fixture";
import { ClosetRepository } from "./repository";
import { previewWeek, saveWeekPlan, StaleWeekPlanError } from "./weekPlanning";

const date = "2026-10-11";
const stamp = `${date}T08:00:00.000Z`;
const options = { start: date, today: date, timeZone: "Europe/Oslo" };

function wardrobe(): Closet {
  const closet: Closet = {
    ...emptyCloset,
    pieces: realisticPieces,
    styling: {
      ...emptyCloset.styling,
      wardrobe: "owned",
      everyday: {
        version: 1,
        occasion: "everyday",
        style: "western",
        hijab: "always",
        sample: false,
      },
    },
  };
  const request = baseRequest(closet);
  const work = presetFromRequest("office", "Office", {
    ...request,
    occasion: "work",
    feel: "smart",
  })!;
  const casual = presetFromRequest("weekend", "Weekend", {
    ...request,
    feel: "comfy",
  })!;
  return saveStylePreset(saveStylePreset(closet, work), casual);
}

function reference(piece: Piece): InspirationGarment {
  return {
    category: piece.category,
    kind: piece.kind,
    attributes: piece.attributes,
    palette: piece.colors ?? [],
    embedding: piece.embedding,
    partial: false,
  };
}

test("saved presets drive the week and generated looks survive a repository reload", async () => {
  const original = wardrobe();
  const preview = previewWeek(original, options);
  const selected = preview.days.filter((day) => day.pieceIds.length);
  assert.equal(selected.length, 7);
  assert.equal(selected[0]!.request.occasion, "everyday");
  assert.equal(selected[0]!.request.feel, "comfy");
  assert.equal(selected[1]!.request.occasion, "work");
  assert.equal(selected[1]!.request.feel, "smart");
  let value: string | null = JSON.stringify(original);
  const storage = {
    read: async () => value,
    write: async (next: string) => {
      value = next;
    },
  };
  const repository = new ClosetRepository(storage);
  await repository.load();
  await repository.update((closet) =>
    saveWeekPlan(
      closet,
      preview,
      selected.map((day) => day.date),
      stamp,
      "en",
    ),
  );
  const reopened = new ClosetRepository(storage);
  await reopened.load();
  const saved = reopened.getSnapshot();
  assert.deepEqual(saved.styling, original.styling);
  assert.deepEqual(saved.pieces, original.pieces);
  for (const day of selected) {
    assert.deepEqual(plannedOn(saved, day.date)?.pieceIds, day.pieceIds);
    assert.equal(plannedOn(saved, day.date)?.occasion, day.request.occasion);
  }
});

test("photo matching uses the same owned wardrobe and changes invalidate a week preview", () => {
  const closet = decodeCloset(JSON.stringify(wardrobe()));
  const references = ["real-white-blouse", "real-black-trousers"].map((id) =>
    reference(closet.pieces.find((piece) => piece.id === id)!),
  );
  const matches = inspirationOutfits(closet, references, date);
  assert.ok(matches.length);
  assert.ok(matches[0]!.ids.includes("real-white-blouse"));
  assert.ok(matches[0]!.ids.includes("real-black-trousers"));
  const preview = previewWeek(closet, options);
  const first = preview.days.find((day) => day.pieceIds.length)!;
  const removed = first.pieceIds[0]!;
  const changed: Closet = {
    ...closet,
    pieces: closet.pieces.map((piece) =>
      piece.id === removed ? { ...piece, status: "away" } : piece,
    ),
  };
  assert.ok(
    inspirationOutfits(changed, references, date).every(
      (match) => !match.ids.includes(removed),
    ),
  );
  assert.throws(
    () => saveWeekPlan(changed, preview, [first.date], stamp, "en"),
    StaleWeekPlanError,
  );
  assert.deepEqual(changed.looks, []);
  assert.deepEqual(changed.imports, []);
});
