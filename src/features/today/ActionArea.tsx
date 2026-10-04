import { StyleSheet, View } from "react-native";
import { router } from "expo-router";
import { t } from "../../i18n";
import { Button, Text } from "../../ui";
import { theme } from "../../ui/theme";
import type { TodayModel } from "./useToday";

export function ActionArea({ model }: { model: TodayModel }) {
  return (
    <View style={styles.area}>
      {model.only ? (
        <Text role="footnote" tone="muted" style={styles.only}>
          {t("today.onlyCombination")}
        </Text>
      ) : (
        <Button
          label={t(model.last ? "today.lastCombination" : "today.another")}
          variant="quiet"
          busy={model.styling}
          disabled={model.busy}
          onPress={() => void model.another()}
          testID="today-another"
        />
      )}
      <Button
        label={t("today.adjust")}
        variant="quiet"
        disabled={model.busy}
        onPress={() => router.push("/today/adjust")}
        testID="today-adjust"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  area: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    alignItems: "center",
    gap: theme.space.md,
  },
  only: { textAlign: "center", paddingVertical: theme.space.md },
});
