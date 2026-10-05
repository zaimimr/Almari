import { test } from "node:test";
import assert from "node:assert/strict";
import { emptyCloset } from "./closet";
import { notificationPlan, notificationSchedule } from "./notifications";
import { resetCloset, replayOnboarding } from "./onboarding";

test("one plan per setting, none when off, cleared by a reset", () => {
  assert.equal(
    notificationPlan({ notification: null, name: "Sara" }, "en"),
    null,
  );
  assert.equal(
    notificationPlan({ notification: undefined, name: "Sara" }, "en"),
    null,
  );
  const morning = notificationPlan(
    { notification: "07:00", name: "Sara" },
    "en",
  )!;
  assert.deepEqual(
    [morning.hour, morning.minute, morning.data.day],
    [7, 0, "today"],
  );
  assert.equal(morning.title, "Good morning, Sara");
  assert.equal(morning.body, "See today's outfit");
  const night = notificationPlan(
    { notification: "21:00", name: null as never },
    "nb",
  )!;
  assert.deepEqual(
    [night.hour, night.data.day, night.body],
    [21, "tomorrow", "Se morgendagens antrekk"],
  );
  assert.equal(night.title, "God kveld");
  const set = {
    ...emptyCloset,
    styling: { ...emptyCloset.styling, notification: "08:00" as const },
  };
  assert.equal(resetCloset(set).closet.styling.notification, undefined);
  assert.equal(replayOnboarding(set).styling.notification, undefined);
});

test("the schedule names planned looks and adds an evening reminder before them", () => {
  const morning = notificationPlan(
    { notification: "07:00", name: "Sara" },
    "en",
  );
  const looks = [
    {
      id: "eid",
      name: "Eid lunch",
      pieceIds: [],
      createdAt: "2026-10-01T00:00:00Z",
      plannedFor: "2026-10-07",
    },
  ];
  const days = notificationSchedule(morning, looks, "2026-10-05", "en", "Sara");
  assert.equal(days.filter((item) => item.hour === 7).length, 14);
  const eve = days.find((item) => item.hour === 20);
  assert.deepEqual(
    [eve?.date, eve?.body, eve?.data.lookId, eve?.data.day],
    ["2026-10-06", "Tomorrow: Eid lunch", "eid", "tomorrow"],
  );
  const lookDay = days.find((item) => item.date === "2026-10-07");
  assert.deepEqual(
    [lookDay?.body, lookDay?.data.lookId],
    ["Today: Eid lunch", "eid"],
  );
  assert.equal(days[0]?.body, "See today's outfit");
  const night = notificationPlan({ notification: "21:00", name: "Sara" }, "nb");
  const evenings = notificationSchedule(night, looks, "2026-10-05", "nb");
  assert.equal(evenings.length, 14);
  assert.equal(
    evenings.find((item) => item.date === "2026-10-06")?.body,
    "I morgen: Eid lunch",
  );
  assert.deepEqual(notificationSchedule(null, looks, "2026-10-05", "en"), []);
});
