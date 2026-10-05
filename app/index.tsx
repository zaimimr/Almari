import { useEffect } from "react";
import { Redirect } from "expo-router";
import * as Notifications from "expo-notifications";
import { useCloset } from "../src/state/closet";
import { firstSeen, setLaunchIntent } from "../src/state/launch";
import { fixtures } from "../src/testing/fixtures";

export default function Index() {
  const { closet } = useCloset();
  const response = Notifications.useLastNotificationResponse();
  useEffect(() => {
    const id = response?.notification.request.identifier;
    const day =
      fixtures.launchDay ??
      (id && firstSeen(id)
        ? response?.notification.request.content.data?.day
        : undefined);
    if (day === "today" || day === "tomorrow") setLaunchIntent({ day });
  }, [response]);
  return (
    <Redirect href={closet.styling.onboarded ? "/today" : "/onboarding"} />
  );
}
