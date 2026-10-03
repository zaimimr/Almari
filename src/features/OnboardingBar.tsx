import { Pressable, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Feather from "@expo/vector-icons/Feather";
import { t } from "../i18n";
import { AppText } from "../ui/legacy";
import { theme } from "../ui/theme";

export function OnboardingBar({
  action,
  progress,
}: {
  action: { label: string; back?: boolean; onPress: () => void } | null;
  progress?: { step: number; total: number };
}) {
  return (
    <SafeAreaView edges={["top"]} style={styles.bar}>
      <View style={styles.row}>
        {action ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={action.label}
            onPress={action.onPress}
            hitSlop={8}
            style={({ pressed }) => [styles.action, pressed && styles.pressed]}
          >
            {action.back ? (
              <Feather
                name="chevron-left"
                size={24}
                color={theme.colors.plum}
              />
            ) : null}
            <AppText style={styles.link} maxFontSizeMultiplier={1.3}>
              {action.label}
            </AppText>
          </Pressable>
        ) : null}
        {progress ? (
          <View style={styles.progress}>
            <AppText variant="footnote" muted maxFontSizeMultiplier={1.4}>
              {t("onboarding.progress", progress)}
            </AppText>
            <View style={styles.track}>
              <View
                style={[
                  styles.fill,
                  { width: `${(progress.step / progress.total) * 100}%` },
                ]}
              />
            </View>
          </View>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  bar: { backgroundColor: theme.colors.canvas },
  row: {
    width: "100%",
    maxWidth: 720,
    alignSelf: "center",
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    paddingHorizontal: 16,
  },
  action: {
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  link: { color: theme.colors.plum, fontWeight: "600" },
  pressed: { opacity: 0.7 },
  progress: { flex: 1, gap: 6, paddingRight: 8 },
  track: {
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.colors.line,
    overflow: "hidden",
  },
  fill: { height: 6, backgroundColor: theme.colors.plum },
});
