import { Tabs } from "expo-router";
import Feather from "@expo/vector-icons/Feather";
import { theme } from "../ui/theme";
import { t, useLocale } from "../i18n";

export default function ClosetTabs() {
  useLocale();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.plum,
        tabBarInactiveTintColor: theme.colors.inkMuted,
        tabBarStyle: {
          backgroundColor: theme.colors.canvas,
          borderTopColor: theme.colors.line,
          height: 72,
        },
        tabBarLabelStyle: { fontSize: 13, paddingBottom: 12 },
      }}
    >
      <Tabs.Screen
        name="today"
        options={{
          title: t("nav.today"),
          tabBarIcon: ({ color, size }) => (
            <Feather name="sun" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="closet"
        options={{
          title: t("nav.closet"),
          tabBarIcon: ({ color, size }) => (
            <Feather name="grid" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="looks"
        options={{
          title: t("nav.looks"),
          tabBarIcon: ({ color, size }) => (
            <Feather name="bookmark" color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}
