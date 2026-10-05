import * as Notifications from "expo-notifications";
import { Linking } from "react-native";
import type { Look } from "../domain/closet";
import {
  notificationSchedule,
  type NotificationPlan,
} from "../domain/notifications";
import { clockFor } from "../domain/today";
import { locale } from "../i18n";
import { now } from "./clock";

let context: { looks: Look[]; name: string | null } = {
  looks: [],
  name: null,
};

export function setScheduleContext(next: typeof context) {
  context = next;
}

export async function askNotificationPermission(): Promise<
  "granted" | "denied"
> {
  const { granted } = await Notifications.requestPermissionsAsync();
  return granted ? "granted" : "denied";
}

export async function notificationPermission(): Promise<
  "granted" | "denied" | "undetermined"
> {
  const { granted, status } = await Notifications.getPermissionsAsync();
  if (granted) return "granted";
  return status === "undetermined" ? "undetermined" : "denied";
}

let pending: Promise<void> = Promise.resolve();

export async function syncSchedule(plan: NotificationPlan | null) {
  const run = pending.catch(() => undefined).then(() => schedule(plan));
  pending = run;
  return run;
}

async function schedule(plan: NotificationPlan | null) {
  await Notifications.cancelAllScheduledNotificationsAsync();
  if (!plan || (await notificationPermission()) !== "granted") return;
  const start = now();
  const items = notificationSchedule(
    plan,
    context.looks,
    clockFor(start).localDate,
    locale,
    context.name,
  );
  for (const item of items) {
    const [year, month, day] = item.date.split("-").map(Number) as [
      number,
      number,
      number,
    ];
    const date = new Date(year, month - 1, day, item.hour, item.minute);
    if (date <= start) continue;
    await Notifications.scheduleNotificationAsync({
      content: { title: item.title, body: item.body, data: item.data },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date },
    });
  }
}

export function openSettings() {
  void Linking.openSettings();
}
