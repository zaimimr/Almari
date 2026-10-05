import { useCallback, useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useFocusEffect } from "expo-router";
import {
  clockTime,
  type NotificationTime,
  type Styling,
} from "../../domain/closet";
import { notificationPlan } from "../../domain/notifications";
import { locale, t } from "../../i18n";
import { useCloset } from "../../state/closet";
import {
  askNotificationPermission,
  notificationPermission,
  openSettings,
  syncSchedule,
} from "../../state/notifications";
import { Button, Expander, Row, Rows, Text } from "../../ui";
import { theme } from "../../ui/theme";
import { notifyLabel } from "../onboarding/StepNotifications";

const fallback: NotificationTime = "07:00";

function dateOf(time: NotificationTime) {
  const [hour, minute] = time.split(":").map(Number) as [number, number];
  return new Date(2000, 0, 1, hour, minute);
}

export function MorningOutfit({
  open,
  onToggle,
}: {
  open: boolean;
  onToggle: () => void;
}) {
  const { closet, update } = useCloset();
  const time = closet.styling.notification ?? null;
  const weekdaysOnly = closet.styling.weekdaysOnly ?? false;
  const [denied, setDenied] = useState(false);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(() => {
    void notificationPermission().then((status) => {
      setDenied(Boolean(time) && status === "denied");
      void syncSchedule(notificationPlan(closet.styling, locale)).catch(
        () => undefined,
      );
    });
  }, [closet.styling, time]);

  useFocusEffect(refresh);
  useEffect(() => {
    void syncSchedule(notificationPlan(closet.styling, locale)).catch(
      () => undefined,
    );
  }, [closet.styling]);

  const save = (change: Partial<Styling>) =>
    update((current) => {
      const { notification, ...styling } = { ...current.styling, ...change };
      return {
        ...current,
        styling: notification ? { ...styling, notification } : styling,
      };
    }).catch(() => undefined);

  async function turn(on: boolean) {
    if (!on) {
      setDenied(false);
      await save({ notification: null });
      return;
    }
    setBusy(true);
    const status = await askNotificationPermission().catch(
      () => "denied" as const,
    );
    setBusy(false);
    setDenied(status === "denied");
    if (status === "granted") await save({ notification: fallback });
  }

  return (
    <Expander
      id="profile-morning"
      title={t("profile.morning")}
      value={notifyLabel(time)}
      open={open}
      onToggle={onToggle}
      testID="profile-morning"
    >
      <Rows>
        <Row
          title={t("notify.remind")}
          trailing={{
            toggle: Boolean(time),
            onToggle: (next) => void turn(next),
            busy,
          }}
          testID="morning-on"
        />
        {time ? (
          <Row
            title={t("notify.weekdays")}
            trailing={{
              toggle: weekdaysOnly,
              onToggle: (next) => void save({ weekdaysOnly: next }),
            }}
            testID="morning-weekdays"
          />
        ) : null}
      </Rows>
      {time ? (
        <DateTimePicker
          mode="time"
          display="spinner"
          value={dateOf(time)}
          minuteInterval={5}
          locale={locale === "nb" ? "nb-NO" : "en-GB"}
          themeVariant="light"
          onValueChange={(_event, date) =>
            void save({
              notification: clockTime(date.getHours(), date.getMinutes()),
            })
          }
          accessibilityLabel={t("profile.morning")}
          testID="morning-time"
        />
      ) : null}
      {denied ? (
        <View style={styles.denied}>
          <Text role="footnote" tone="muted" announce testID="notify-denied">
            {t("notify.denied")}
          </Text>
          <Button
            label={t("common.openSettings")}
            variant="quiet"
            size="small"
            onPress={openSettings}
          />
        </View>
      ) : null}
    </Expander>
  );
}

const styles = StyleSheet.create({
  denied: { gap: theme.space.sm, alignItems: "flex-start" },
});
