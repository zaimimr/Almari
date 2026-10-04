import { StyleSheet, View } from "react-native";
import { t } from "../../i18n";
import { Text } from "../../ui";
import { theme } from "../../ui/theme";
import { useColors } from "../../ui/useColors";

const tips = [
  "colours.tip.daylight",
  "colours.tip.lens",
  "colours.tip.glasses",
  "colours.tip.lip",
] as const;

export function SelfieTips() {
  const colors = useColors();
  return (
    <View style={styles.tips} testID="selfie-tips">
      <View style={[styles.card, { backgroundColor: colors.surface }]}>
        {tips.map((tip) => (
          <Text key={tip} role="headline">
            {t(tip)}
          </Text>
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
  card: {
    gap: theme.space.md,
    padding: theme.space.lg,
    borderRadius: theme.radius.md,
    borderCurve: "continuous",
  },
});
