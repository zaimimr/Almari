import * as Notifications from "expo-notifications";
import { Linking } from "react-native";

export type NotificationPlan = {
  hour: number;
  minute: number;
  title: string;
  body: string;
  data: { day: "today" | "tomorrow" };
};

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
  await Notifications.scheduleNotificationAsync({
    content: { title: plan.title, body: plan.body, data: plan.data },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
      hour: plan.hour,
      minute: plan.minute,
      repeats: true,
    },
  });
}

export function openSettings() {
  void Linking.openSettings();
}
