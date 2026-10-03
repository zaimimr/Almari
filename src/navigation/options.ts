import { theme } from "../ui/theme";

export const stackOptions = {
  headerTintColor: theme.colors.plum,
  headerStyle: { backgroundColor: theme.colors.canvas },
  contentStyle: { backgroundColor: theme.colors.canvas },
  headerShadowVisible: false,
  headerBackButtonDisplayMode: "minimal" as const,
  animation: "default" as const,
};

export function largeTitleOptions(fontScale: number, bold: boolean) {
  return {
    ...stackOptions,
    headerLargeTitleEnabled: true,
    headerLargeTitleStyle: {
      color: theme.colors.ink,
      fontFamily: bold ? "Georgia-Bold" : "Georgia",
      fontSize: 34 * Math.min(fontScale, 1.76),
    },
    headerTitleStyle: { color: theme.colors.ink },
  };
}
