import { useEffect } from "react";
import { router } from "expo-router";
import * as Notifications from "expo-notifications";
import { notificationPlan } from "../../domain/notifications";
import { locale } from "../../i18n";
import { useCloset } from "../../state/closet";
import { firstSeen, setLaunchIntent } from "../../state/launch";
import { setScheduleContext, syncSchedule } from "../../state/notifications";

export function useReminders() {
  const { closet } = useCloset();
  const { looks } = closet;
  const { notification, name, onboarded } = closet.styling;
  const localDate = closet.styling.today?.localDate;
  const response = Notifications.useLastNotificationResponse();

  useEffect(() => {
    if (!onboarded) return;
    setScheduleContext({ looks, name: name ?? null });
    void syncSchedule(notificationPlan({ notification, name }, locale)).catch(
      () => undefined,
    );
  }, [looks, notification, name, onboarded, localDate]);

  useEffect(() => {
    const id = response?.notification.request.identifier;
    if (!response || !id || !firstSeen(id)) return;
    const data = response.notification.request.content.data ?? {};
    const day = data.day;
    if (day !== "today" && day !== "tomorrow") return;
    if (day === "tomorrow" && typeof data.lookId === "string") {
      router.push({ pathname: "/look/[id]", params: { id: data.lookId } });
      return;
    }
    setLaunchIntent({ day });
    router.navigate("/(tabs)/today");
  }, [response]);
}
