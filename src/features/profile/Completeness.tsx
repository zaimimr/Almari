import { StyleSheet, View } from "react-native";
import type { Closet } from "../../domain/closet";
import { completeness, type QuickAdd } from "../../domain/profileStats";
import { locale, t } from "../../i18n";
import { Chip, Silk, Text } from "../../ui";
import { percent } from "../../ui/dates";
import { theme } from "../../ui/theme";
import { openQuick } from "./useProfile";

export function Completeness({ closet }: { closet: Closet }) {
  const { score, next } = completeness(closet);
  const sentence = t("profile.meter", {
    percent: percent(score / 100, locale),
  });
  return (
    <View style={styles.block} testID="profile-meter">
      <View accessible accessibilityLabel={sentence}>
        <Text role="headline">{sentence}</Text>
      </View>
      <Silk kind="progress" value={score / 100} label={sentence} hidden />
      {next.length ? (
        <View style={styles.chips}>
          {next.map((key: QuickAdd) => (
            <Chip
              key={key}
              label={t(`quick.${key}`)}
              kind="control"
              opens="screen"
              onPress={() => openQuick(key)}
              testID={`quick-${key}`}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  block: { gap: theme.space.md, paddingBottom: theme.space.lg },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: theme.space.sm },
});
