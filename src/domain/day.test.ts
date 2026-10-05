import { test } from "node:test";
import assert from "node:assert/strict";
import { decodeCloset, type DayFit, type ForecastHour } from "./closet";
import {
  addFit,
  dayLine,
  earlierFits,
  fitsOn,
  hourLabel,
  parseBrief,
  removeFit,
  slotOf,
  unwearFit,
  updateFit,
  windowFor,
  windowTemp,
  windowWeather,
  wornMains,
} from "./day";
import { woreThis } from "./feedback";
import { activeSession, startOccasion } from "./today";
import { oslo, styledSample } from "./test-helpers";

const date = "2026-10-06";
const hour = (
  local: number,
  change: Partial<ForecastHour> = {},
): ForecastHour => ({
  at: new Date(Date.UTC(2026, 9, 6, local - 2)).toISOString(),
  celsius: 6,
  precipitation: "none",
  chance: 0,
  windMs: 0,
  ...change,
});
const rainyAfternoon = Array.from({ length: 24 }, (_, local) =>
  local >= 15
    ? hour(local, { celsius: 3, precipitation: "rain", chance: 0.8 })
    : hour(local, { celsius: local >= 12 ? 9 : 6 }),
);

test("the day line names the dry start and when the rain arrives", () => {
  assert.deepEqual(dayLine(rainyAfternoon, date, 7, oslo), {
    kind: "dryThenRain",
    celsius: 6,
    hour: 15,
  });
  assert.deepEqual(dayLine(rainyAfternoon, date, 16, oslo), {
    kind: "rain",
    celsius: 3,
  });
  assert.equal(dayLine(rainyAfternoon, "2026-10-07", 7, oslo), null);
  assert.equal(hourLabel(15, "en"), "3 pm");
  assert.equal(hourLabel(15, "nb"), "15");
});

test("each part of the day carries its own temperature and weather", () => {
  const morning = windowFor("morning", 9);
  const evening = windowFor("evening", 9);
  assert.equal(
    windowTemp(rainyAfternoon, date, morning.from, morning.to, oslo),
    6,
  );
  assert.equal(
    windowTemp(rainyAfternoon, date, evening.from, evening.to, oslo),
    3,
  );
  assert.equal(
    windowWeather(rainyAfternoon, date, morning.from, morning.to, oslo)
      ?.precipitation,
    "dry",
  );
  assert.equal(
    windowWeather(rainyAfternoon, date, evening.from, evening.to, oslo)
      ?.precipitation,
    "rain",
  );
  assert.equal(slotOf("now", 8), "morning");
  assert.equal(slotOf("now", 13), "afternoon");
  assert.equal(slotOf("now", 19), "evening");
});

test("a typed plan picks the occasion, time, style and feel", () => {
  assert.deepEqual(parseBrief("Work, then dinner at 7"), { occasion: "work" });
  assert.deepEqual(parseBrief("Dinner at 7"), {
    occasion: "dinner",
    when: "evening",
  });
  assert.deepEqual(parseBrief("Middag kl. 19, noe pent"), {
    occasion: "dinner",
    when: "evening",
    feel: "smart",
  });
  assert.deepEqual(parseBrief("comfy desi for a mehndi tonight"), {
    occasion: "party",
    when: "evening",
    style: "desi",
    feel: "comfy",
  });
  assert.deepEqual(parseBrief("lunch at 1pm"), {
    occasion: "dinner",
    when: "afternoon",
  });
  assert.deepEqual(parseBrief(""), {});
});

const fit = (id: string, change: Partial<DayFit> = {}): DayFit => ({
  id,
  date,
  pieceIds: [],
  occasion: "everyday",
  slot: "morning",
  celsius: 6,
  createdAt: "2026-10-06T07:00:00.000Z",
  ...change,
});

test("fits are kept per day, survive a reload and old days fall away", () => {
  const closet = styledSample("2026-10-06T08:00:00+02:00");
  const old = addFit(closet, fit("old", { date: "2026-09-01" }));
  const two = addFit(addFit(old, fit("a")), fit("b", { slot: "evening" }));
  assert.deepEqual(
    fitsOn(two, date).map((item) => item.id),
    ["a", "b"],
  );
  assert.deepEqual(fitsOn(two, "2026-09-01"), []);
  const worn = updateFit(two, date, "a", { wornAt: "x", wearId: "w" });
  assert.equal(fitsOn(worn, date)[0]?.wornAt, "x");
  assert.equal(fitsOn(unwearFit(worn, date, "a"), date)[0]?.wornAt, undefined);
  const reloaded = decodeCloset(JSON.stringify(worn));
  assert.deepEqual(reloaded.styling.fits, worn.styling.fits);
  const gone = removeFit(removeFit(worn, date, "a"), date, "b");
  assert.equal(gone.styling.fits?.[date], undefined);
});

test("a second fit of the day leaves out the worn main pieces", () => {
  const closet = styledSample("2026-10-06T08:00:00+02:00");
  const session = activeSession(closet.styling.today!);
  const worn = updateFit(
    addFit(closet, fit("a", { pieceIds: session.pieceIds })),
    date,
    "a",
    { wornAt: "2026-10-06T08:00:00.000Z" },
  );
  const mains = wornMains(worn, date);
  assert.ok(mains.length > 0);
  const evening = startOccasion(worn, {
    ...session.request,
    occasion: "dinner",
    excludedIds: mains,
  });
  const next = activeSession(evening.styling.today!).pieceIds;
  assert.ok(next.length > 0);
  assert.ok(next.every((id) => !mains.includes(id)));
});

test("earlier lists past worn outfits once, newest first", () => {
  const monday = styledSample("2026-10-05T08:00:00+02:00");
  const session = activeSession(monday.styling.today!);
  const worn = woreThis(
    monday,
    session.revision,
    "2026-10-05T08:00:00.000Z",
    "wear-1",
  );
  assert.deepEqual(earlierFits(worn, "2026-10-05", oslo), []);
  const list = earlierFits(worn, date, oslo);
  assert.equal(list.length, 1);
  assert.equal(list[0]?.date, "2026-10-05");
  assert.deepEqual(list[0]?.pieceIds, session.pieceIds);
});
