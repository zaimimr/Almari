import { useCallback, useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { useFocusEffect } from "expo-router";
import { notificationTimes, type NotificationTime } from "../../domain/closet";
import { notificationPlan } from "../../domain/notifications";
import { locale, t } from "../../i18n";
import { useCloset } from "../../state/closet";
import {
  askNotificationPermission,
  notificationPermission,
  openSettings,
  syncSchedule,
} from "../../state/notifications";
import { Button, ChipRow, Expander, Text } from "../../ui";
import { theme } from "../../ui/theme";
import { notifyLabel } from "../onboarding/StepNotifications";

type Option = NotificationTime | "off";

export function MorningOutfit({
  open,
  onToggle,
}: {
  open: boolean;
  onToggle: () => void;
}) {
  const { closet, update } = useCloset();
  const time = closet.styling.notification ?? null;
  const [denied, setDenied] = useState(false);

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

  async function pick(next: Option) {
    const notification = next === "off" ? null : next;
    await update((current) => {
      const { notification: _old, ...styling } = current.styling;
      return {
        ...current,
        styling: notification ? { ...styling, notification } : styling,
      };
    }).catch(() => undefined);
    if (!notification) {
      setDenied(false);
      return;
    }
    setDenied((await askNotificationPermission()) === "denied");
  }

  const value = denied ? t("notify.denied") : notifyLabel(time);
  return (
    <Expander
      id="profile-morning"
      title={t("profile.morning")}
      value={value}
      open={open}
      onToggle={onToggle}
      testID="profile-morning"
    >
      <ChipRow<Option>
        options={[
          { id: "off" as Option, label: t("notify.off") },
          ...notificationTimes.map((id) => ({ id, label: notifyLabel(id) })),
        ].map((option) => ({
          ...option,
          accessibilityLabel: t("common.optionInGroup", {
            option: option.label,
            group: t("profile.morning"),
          }),
        }))}
        value={time ?? "off"}
        onChange={(next) => {
          if (typeof next === "string") void pick(next);
        }}
        inSurface
        testID="morning-chips"
      />
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
