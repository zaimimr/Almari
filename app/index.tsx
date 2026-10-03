import { Redirect } from "expo-router";
import * as Notifications from "expo-notifications";
import { useCloset } from "../src/state/closet";
import { setLaunchIntent } from "../src/state/launch";

export default function Index() {
  const { closet } = useCloset();
  const response = Notifications.useLastNotificationResponse();
  const day = response?.notification.request.content.data?.day;
  if (day === "today" || day === "tomorrow") setLaunchIntent({ day });
  return (
    <Redirect href={closet.styling.onboarded ? "/today" : "/onboarding"} />
  );
}
