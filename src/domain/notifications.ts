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
};

export function notificationPlan(
  styling: Pick<Styling, "notification" | "name">,
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
  };
}
