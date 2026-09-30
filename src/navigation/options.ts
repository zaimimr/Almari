import { theme } from "../ui/theme";

export const stackOptions = {
  headerTintColor: theme.colors.accent,
  headerStyle: { backgroundColor: theme.colors.background },
  contentStyle: { backgroundColor: theme.colors.background },
  headerShadowVisible: false,
  headerBackButtonDisplayMode: "minimal" as const,
};

export const largeTitleOptions = {
  ...stackOptions,
  headerLargeTitleEnabled: true,
  headerLargeTitleStyle: {
    color: theme.colors.ink,
    fontFamily: "Georgia",
    fontWeight: "400" as const,
  },
  headerTitleStyle: { color: theme.colors.ink },
};
