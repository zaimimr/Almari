import { beforeEach, describe, expect, it, vi } from "vitest";

import { emptyCloset } from "../src/domain/closet";
import { shareData } from "../src/state/export";
import { notificationPlan } from "../src/domain/notifications";
import {
  askNotificationPermission,
  setScheduleContext,
  syncSchedule,
} from "../src/state/notifications";

const native = vi.hoisted(() => ({
  exportFolder: vi.fn(),
  zip: vi.fn(),
  share: vi.fn(),
  cancel: vi.fn(),
  schedule: vi.fn(),
  permission: vi.fn(),
  requestPermission: vi.fn(),
}));

vi.mock("react-native", () => ({
  Share: { share: native.share },
  Linking: { openSettings: vi.fn() },
}));
vi.mock("../src/storage/local", () => ({
  exportFolder: native.exportFolder,
}));
vi.mock("../modules/closet-vision/src", () => ({
  default: { zipFolder: native.zip },
}));
vi.mock("../src/state/clock", () => ({
  now: () => new Date("2026-10-11T08:00:00Z"),
}));
vi.mock("expo-notifications", () => ({
  cancelAllScheduledNotificationsAsync: native.cancel,
  scheduleNotificationAsync: native.schedule,
  getPermissionsAsync: native.permission,
  requestPermissionsAsync: native.requestPermission,
  SchedulableTriggerInputTypes: { DATE: "date" },
}));

beforeEach(() => {
  native.exportFolder.mockResolvedValue("file:///export");
  native.zip.mockResolvedValue("file:///export.zip");
  native.share.mockResolvedValue({ action: "sharedAction" });
  native.cancel.mockResolvedValue(undefined);
  native.schedule.mockResolvedValue("notification-id");
  native.permission.mockResolvedValue({ granted: true, status: "granted" });
  setScheduleContext({ looks: [], name: null });
});

describe("data export", () => {
  it("shares an archive of the complete closet without altering the stored data", async () => {
    const before = JSON.stringify(emptyCloset);
    await shareData(emptyCloset);
    expect(JSON.parse(native.exportFolder.mock.calls[0]![0])).toEqual(
      emptyCloset,
    );
    expect(native.zip).toHaveBeenCalledWith("file:///export");
    expect(native.share).toHaveBeenCalledWith({ url: "file:///export.zip" });
    expect(JSON.stringify(emptyCloset)).toBe(before);
  });

  it("does not share a partial export when archiving fails", async () => {
    native.zip.mockRejectedValueOnce(new Error("archive failed"));
    await expect(shareData(emptyCloset)).rejects.toThrow("archive failed");
    expect(native.share).not.toHaveBeenCalled();
  });

  it("does not archive or share when writing the export fails", async () => {
    native.exportFolder.mockRejectedValueOnce(new Error("disk full"));
    await expect(shareData(emptyCloset)).rejects.toThrow("disk full");
    expect(native.zip).not.toHaveBeenCalled();
    expect(native.share).not.toHaveBeenCalled();
  });
});

describe("device reminder scheduling", () => {
  const plan = notificationPlan(
    { notification: "08:30", name: undefined },
    "en",
  )!;

  it("turning reminders off cancels previous device notifications", async () => {
    await syncSchedule(null);
    expect(native.cancel).toHaveBeenCalledTimes(1);
    expect(native.schedule).not.toHaveBeenCalled();
  });

  it("denied permission cancels stale notifications without scheduling new ones", async () => {
    native.permission.mockResolvedValueOnce({
      granted: false,
      status: "denied",
    });
    await syncSchedule(plan);
    expect(native.cancel).toHaveBeenCalledTimes(1);
    expect(native.schedule).not.toHaveBeenCalled();
  });

  it("creates only future triggers with the correct saved-look navigation data", async () => {
    setScheduleContext({
      looks: [
        {
          id: "monday",
          name: "Monday work",
          pieceIds: ["top"],
          plannedFor: "2026-10-12",
          createdAt: "2026-10-11T08:00:00Z",
        },
      ],
      name: null,
    });
    await syncSchedule(plan);
    const notifications = native.schedule.mock.calls.map(([item]) => item);
    expect(notifications.length).toBeGreaterThan(0);
    expect(
      notifications.every(
        (item) => item.trigger.date > new Date("2026-10-11T08:00:00Z"),
      ),
    ).toBe(true);
    expect(
      notifications.some(
        (item) =>
          item.content.data.lookId === "monday" &&
          item.content.data.day === "tomorrow",
      ),
    ).toBe(true);
  });

  it("a failed device operation does not poison the queue for a subsequent retry", async () => {
    native.cancel.mockRejectedValueOnce(new Error("device unavailable"));
    await expect(syncSchedule(plan)).rejects.toThrow("device unavailable");
    await syncSchedule(plan);
    expect(native.schedule).toHaveBeenCalled();
  });

  it("a later disable waits for an in-progress enable before cancelling", async () => {
    let finish!: () => void;
    const gate = new Promise<void>((resolve) => {
      finish = resolve;
    });
    native.schedule.mockImplementationOnce(() => gate);
    const enabled = syncSchedule(plan);
    const disabled = syncSchedule(null);
    await vi.waitFor(() => expect(native.schedule).toHaveBeenCalledTimes(1));
    expect(native.cancel).toHaveBeenCalledTimes(1);
    finish();
    await Promise.all([enabled, disabled]);
    expect(native.cancel).toHaveBeenCalledTimes(2);
    expect(native.cancel.mock.invocationCallOrder[1]!).toBeGreaterThan(
      native.schedule.mock.invocationCallOrder.at(-1)!,
    );
  });

  it.each([true, false])(
    "permission result granted=%s is returned to the settings flow",
    async (granted) => {
      native.requestPermission.mockResolvedValueOnce({ granted });
      await expect(askNotificationPermission()).resolves.toBe(
        granted ? "granted" : "denied",
      );
    },
  );
});
