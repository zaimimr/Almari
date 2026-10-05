import { Pressable, StyleSheet, View } from "react-native";
import { router } from "expo-router";
import { t } from "../../i18n";
import { useCloset } from "../../state/closet";
import { Symbol, Text } from "../../ui";
import { theme } from "../../ui/theme";
import { useColors } from "../../ui/useColors";

const size = 32;

export function ProfileButton({ testID }: { testID: string }) {
  const colors = useColors();
  const { closet } = useCloset();
  const initial = closet.styling.name?.trim().charAt(0).toLocaleUpperCase();

  return (
    <Pressable
      onPress={() => router.push("/profile")}
      accessibilityRole="button"
      accessibilityLabel={t("nav.profile")}
      accessibilityShowsLargeContentViewer
      accessibilityLargeContentTitle={t("nav.profile")}
      testID={testID}
      style={({ pressed }) => [styles.item, pressed && styles.pressed]}
    >
      <View style={[styles.disc, { backgroundColor: colors.blush }]}>
        {initial ? (
          <Text role="headline" maxFontSizeMultiplier={1} user>
            {initial}
          </Text>
        ) : (
          <Symbol name="person.fill" size={theme.size.iconInline} tone="ink" />
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  item: {
    minWidth: theme.size.touch,
    minHeight: theme.size.touch,
    alignItems: "center",
    justifyContent: "center",
  },
  pressed: { opacity: 0.7 },
  disc: {
    width: size,
    height: size,
    borderRadius: size / 2,
    alignItems: "center",
    justifyContent: "center",
  },
});
