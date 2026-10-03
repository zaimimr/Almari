import { NativeTabs } from "expo-router/unstable-native-tabs";
import { theme } from "../ui/theme";
import { t } from "../i18n";

export default function ClosetTabs() {
  return (
    <NativeTabs
      tintColor={theme.colors.plum}
      backgroundColor={theme.colors.canvas}
    >
      <NativeTabs.Trigger name="today">
        <NativeTabs.Trigger.Label>{t("nav.today")}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: "sun.horizon", selected: "sun.horizon.fill" }}
        />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="closet">
        <NativeTabs.Trigger.Label>{t("nav.closet")}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="hanger" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="looks">
        <NativeTabs.Trigger.Label>{t("nav.looks")}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: "rectangle.stack", selected: "rectangle.stack.fill" }}
        />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
