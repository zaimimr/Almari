import { StyleSheet, View } from "react-native";
import { notificationTimes, type NotificationTime } from "../../domain/closet";
import type { Answers } from "../../domain/onboarding";
import { locale, t } from "../../i18n";
import { openSettings } from "../../state/notifications";
import { Button, ChipRow, Text } from "../../ui";
import { theme } from "../../ui/theme";

type Choice = NotificationTime | "off";

const clock = (time: NotificationTime) => {
  const [hour, minute] = time.split(":").map(Number) as [number, number];
  return new Intl.DateTimeFormat(locale === "nb" ? "nb-NO" : "en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(new Date(2000, 0, 1, hour, minute));
};

export function notifyLabel(time: NotificationTime | null) {
  if (!time) return t("notify.off");
  const shown = clock(time);
  return Number(time.slice(0, 2)) >= 18
    ? t("notify.nightBefore", { time: shown })
    : t("notify.time", { time: shown });
}

export function StepNotifications({
  answers,
  onPick,
  denied,
}: {
  answers: Answers;
  onPick: (time: NotificationTime | null) => Promise<void>;
  denied: boolean;
}) {
  const time = answers.notifications.notification;
  return (
    <View style={styles.notify}>
      <ChipRow<Choice>
        options={[
          { id: "off", label: notifyLabel(null) },
          ...notificationTimes.map((id) => ({ id, label: notifyLabel(id) })),
        ]}
        value={time ?? "off"}
        onChange={(next) =>
          void onPick(next === "off" || typeof next !== "string" ? null : next)
        }
        testID="notify"
      />
      {denied && time ? (
        <View style={styles.denied}>
          <Text role="footnote" tone="error" accessibilityLiveRegion="polite">
            {t("notify.denied")}
          </Text>
          <View style={styles.start}>
            <Button
              label={t("common.openSettings")}
              variant="quiet"
              onPress={openSettings}
            />
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  notify: { gap: theme.space.lg },
  denied: { gap: theme.space.xs },
  start: { alignItems: "flex-start" },
});
