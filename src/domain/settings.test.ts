import { test } from "node:test";
import assert from "node:assert/strict";
import { localeFrom } from "../i18n/translate";
import { decodeCloset, type Closet, type Piece } from "./closet";
import { applyAnswer, replayOnboarding, resetCloset } from "./onboarding";
import { addSampleWardrobe, sampleCatalogVersion } from "./samples";

const clock = { localDate: "2026-10-01", timeZone: "Europe/Oslo" };

const owned: Piece = {
  id: "owned-kurta",
  name: "Sage kurta",
  category: "tunic",
  photo: "owned-kurta.png",
  original: "owned-kurta-original.jpg",
  createdAt: "2026-10-01T08:00:00.000Z",
  source: "owned",
  label: { photo: "owned-kurta-label.jpg", materials: [] },
};

function used(): Closet {
  const start = addSampleWardrobe(decodeCloset(null));
  const answered = applyAnswer(
    applyAnswer(start, "hijab", { hijab: "always" }, clock),
    "coverage",
    { coverage: "full", answered: true },
    clock,
  );
  return {
    ...answered,
    pieces: [owned, ...answered.pieces],
    looks: [
      {
        id: "look-1",
        name: "Work",
        pieceIds: [owned.id],
        createdAt: "2026-10-01T09:00:00.000Z",
      },
    ],
    imports: [
      {
        id: "job-1",
        source: "job-1.jpg",
        createdAt: "2026-10-01T09:00:00.000Z",
        state: "queued",
        attempts: 0,
      },
    ],
    styling: {
      ...answered.styling,
      units: "imperial",
      onboarded: true,
      language: "nb",
    },
  };
}

test("a stored language choice wins over the phone language", () => {
  assert.equal(localeFrom("system", "nb"), "nb");
  assert.equal(localeFrom("system", "sv"), "en");
  assert.equal(localeFrom("en", "nb"), "en");
  assert.equal(localeFrom("nb", "en"), "nb");
  assert.equal(localeFrom("nb", null), "nb");
});

test("a new install follows the phone and the choice survives a reopen", () => {
  assert.equal(decodeCloset(null).styling.language, "system");
  const closet = used();
  assert.equal(decodeCloset(JSON.stringify(closet)).styling.language, "nb");
  const raw = JSON.parse(JSON.stringify(closet));
  delete raw.styling.language;
  assert.equal(decodeCloset(JSON.stringify(raw)).styling.language, "system");
  raw.styling.language = "nn";
  assert.throws(() => decodeCloset(JSON.stringify(raw)));
});

test("replaying onboarding keeps every answer and survives a reopen", () => {
  const closet = used();
  const replayed = replayOnboarding(closet);
  assert.equal(replayed.styling.onboarded, false);
  assert.deepEqual(replayed.styling.profile, closet.styling.profile);
  assert.deepEqual(replayed.styling.everyday, closet.styling.everyday);
  assert.deepEqual(replayed.pieces, closet.pieces);
  assert.equal(decodeCloset(JSON.stringify(replayed)).styling.onboarded, false);
});

test("reset returns the sample closet and every file of hers to delete", () => {
  const { closet, files } = resetCloset(used());
  const fresh = addSampleWardrobe(decodeCloset(null));
  assert.deepEqual(closet, {
    ...fresh,
    styling: { ...fresh.styling, language: "nb" },
  });
  assert.equal(closet.styling.onboarded, false);
  assert.equal(closet.sampleCatalog, sampleCatalogVersion);
  assert.ok(closet.pieces.every((piece) => piece.source === "sample"));
  assert.deepEqual(closet.looks, []);
  assert.deepEqual(closet.imports, []);
  assert.deepEqual([...files].sort(), [
    "job-1.jpg",
    "owned-kurta-label.jpg",
    "owned-kurta-original.jpg",
    "owned-kurta.png",
  ]);
  assert.ok(files.every((file) => !file.startsWith("sample:")));
  assert.deepEqual(decodeCloset(JSON.stringify(closet)), closet);
});

test("the scan starts on auto and a manual choice survives a reopen and a reset", () => {
  assert.equal(decodeCloset(null).styling.scan, "auto");
  const start = used();
  const closet: Closet = {
    ...start,
    styling: { ...start.styling, scan: "manual" },
  };
  assert.equal(decodeCloset(JSON.stringify(closet)).styling.scan, "manual");
  assert.equal(resetCloset(closet).closet.styling.scan, "manual");
  const raw = JSON.parse(JSON.stringify(closet));
  delete raw.styling.scan;
  assert.equal(decodeCloset(JSON.stringify(raw)).styling.scan, "auto");
  raw.styling.scan = "burst";
  assert.throws(() => decodeCloset(JSON.stringify(raw)));
});
