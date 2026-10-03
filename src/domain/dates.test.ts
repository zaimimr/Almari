import { test } from "node:test";
import assert from "node:assert/strict";
import {
  fullDate,
  monthTitle,
  percent,
  shortDate,
  shortWeekday,
  spokenDate,
  weekdayLetters,
} from "../ui/dates";

test("dates and percentages follow the copy rules", () => {
  assert.equal(shortDate("2026-10-10", "en"), "Sat 10 Oct");
  assert.equal(shortDate("2026-10-10", "nb"), "lør. 10. okt.");
  assert.equal(spokenDate("2026-10-09", "nb"), "fredag 9. oktober");
  assert.equal(spokenDate("2026-10-09", "en"), "Friday 9 October");
  assert.equal(fullDate("2026-10-09", "en"), "Friday, 9 October 2026");
  assert.equal(monthTitle("2026-10", "en"), "October 2026");
  assert.equal(monthTitle("2026-10", "nb"), "oktober 2026");
  assert.equal(shortWeekday("2026-10-09", "en"), "Fri");
  assert.equal(shortWeekday("2026-10-09", "nb"), "fre.");
  assert.equal(percent(0.38, "nb"), "38 %");
  assert.equal(percent(0.38, "en"), "38%");
});

test("the week starts on Monday in both languages", () => {
  assert.deepEqual(weekdayLetters("en"), ["M", "T", "W", "T", "F", "S", "S"]);
  assert.deepEqual(weekdayLetters("nb"), ["M", "T", "O", "T", "F", "L", "S"]);
});
