import { en } from "../i18n/en";
import { nb } from "../i18n/nb";
import { translate, type Locale } from "../i18n/translate";
import type { Look, Styling } from "./closet";
import { greeting } from "./greeting";
import { addDays, plannedOn } from "./looks";

export type NotificationPlan = {
  hour: number;
  minute: number;
  title: string;
  body: string;
  data: { day: "today" | "tomorrow"; lookId?: string };
  weekdays?: number[];
};

export type ScheduledNotification = NotificationPlan & { date: string };

const evening = 20;

export function notificationSchedule(
  plan: NotificationPlan | null,
  looks: Look[],
  today: string,
  locale: Locale,
  name: string | null = null,
): ScheduledNotification[] {
  if (!plan) return [];
  const planned = { looks };
  const text = (key: "todayLook" | "tomorrowLook", look: Look) =>
    translate({ en, nb }, locale, `notify.${key}`, { name: look.name });
  return Array.from({ length: 14 }, (_, index) => {
    const date = addDays(today, index);
    const next = addDays(date, 1);
    const day = plan.data.day;
    const look = plannedOn(planned, day === "tomorrow" ? next : date);
    const main: ScheduledNotification = look
      ? {
          ...plan,
          date,
          body: text(day === "tomorrow" ? "tomorrowLook" : "todayLook", look),
          data: { day, lookId: look.id },
        }
      : { ...plan, date };
    const ahead = day === "today" ? plannedOn(planned, next) : null;
    const weekday = new Date(`${date}T12:00:00Z`).getUTCDay() + 1;
    const mains =
      !plan.weekdays || plan.weekdays.includes(weekday) ? [main] : [];
    return ahead && plan.hour < evening
      ? [
          ...mains,
          {
            date,
            hour: evening,
            minute: 0,
            title: greeting(name, evening, locale),
            body: text("tomorrowLook", ahead),
            data: { day: "tomorrow" as const, lookId: ahead.id },
          },
        ]
      : mains;
  }).flat();
}

export function notificationPlan(
  styling: Pick<Styling, "notification" | "name" | "weekdaysOnly">,
  locale: Locale,
): NotificationPlan | null {
  if (!styling.notification) return null;
  const [hour, minute] = styling.notification.split(":").map(Number) as [
    number,
    number,
  ];
  const day = hour >= 18 ? "tomorrow" : "today";
  return {
    hour,
    minute,
    title: greeting(styling.name, hour, locale),
    body: translate({ en, nb }, locale, `notify.${day}`),
    data: { day },
    ...(styling.weekdaysOnly
      ? { weekdays: day === "today" ? [2, 3, 4, 5, 6] : [1, 2, 3, 4, 5] }
      : {}),
  };
}
