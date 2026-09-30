import { NativeTabs } from "expo-router/unstable-native-tabs";
import { theme } from "../ui/theme";

export default function ClosetTabs() {
  return (
    <NativeTabs
      tintColor={theme.colors.accent}
      backgroundColor={theme.colors.background}
    >
      <NativeTabs.Trigger name="today">
        <NativeTabs.Trigger.Label>Today</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: "sparkles", selected: "sparkles" }}
        />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="closet">
        <NativeTabs.Trigger.Label>Closet</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="hanger" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="looks">
        <NativeTabs.Trigger.Label>Looks</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: "square.grid.2x2", selected: "square.grid.2x2.fill" }}
        />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
