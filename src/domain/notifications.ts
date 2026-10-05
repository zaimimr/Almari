import { en } from "../i18n/en";
import { nb } from "../i18n/nb";
import { translate, type Locale } from "../i18n/translate";
import type { Styling } from "./closet";
import { greeting } from "./greeting";

export type NotificationPlan = {
  hour: number;
  minute: number;
  title: string;
  body: string;
  data: { day: "today" | "tomorrow" };
  weekdays?: number[];
};

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
