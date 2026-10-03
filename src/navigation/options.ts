import { theme } from "../ui/theme";

export const stackOptions = {
  headerTintColor: theme.colors.plum,
  headerStyle: { backgroundColor: theme.colors.canvas },
  contentStyle: { backgroundColor: theme.colors.canvas },
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
