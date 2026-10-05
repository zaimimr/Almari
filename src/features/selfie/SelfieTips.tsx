import { StyleSheet, View } from "react-native";
import { t } from "../../i18n";
import { Symbol, Text } from "../../ui";
import { theme } from "../../ui/theme";
import { useColors } from "../../ui/useColors";

const tips = [
  ["colours.tip.daylight", "sun.max"],
  ["colours.tip.lens", "camera.aperture"],
  ["colours.tip.glasses", "eyeglasses"],
  ["colours.tip.lip", "mouth"],
] as const;

export function SelfieTips() {
  const colors = useColors();
  return (
    <View style={styles.tips} testID="selfie-tips">
      <View style={[styles.card, { backgroundColor: colors.surface }]}>
        {tips.map(([tip, icon]) => (
          <View key={tip} style={styles.tip}>
            <View style={[styles.icon, { backgroundColor: colors.plumSoft }]}>
              <Symbol name={icon} size={20} tone="plum" />
            </View>
            <Text role="headline" style={styles.label}>
              {t(tip)}
            </Text>
          </View>
        ))}
      </View>
      <Text role="footnote" tone="muted">
        {t("colours.camera.privacy")}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tips: { gap: theme.space.lg },
  tip: { flexDirection: "row", alignItems: "center", gap: theme.space.md },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  label: { flexShrink: 1 },
  card: {
    gap: theme.space.lg,
    padding: theme.space.lg,
    borderRadius: theme.radius.md,
    borderCurve: "continuous",
  },
});
