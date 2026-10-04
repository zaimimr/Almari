import { StyleSheet, View } from "react-native";
import { router } from "expo-router";
import { clockFor, saveEverydayStyle, setWardrobe } from "../../domain/today";
import { t } from "../../i18n";
import { now } from "../../state/clock";
import { Banner, EmptyState } from "../../ui";
import { theme } from "../../ui/theme";
import type { TodayModel } from "./useToday";

export function FirstRun({ model }: { model: TodayModel }) {
  const trySample = () =>
    void model.restyle(
      (current) =>
        saveEverydayStyle(
          setWardrobe(current, "sample", clockFor(now())),
          { occasion: "work", style: "western", hijab: "always", sample: true },
          clockFor(now()),
          true,
        ),
      null,
    );

  return (
    <View style={styles.first}>
      {model.stylingFailed ? (
        <Banner
          tone="notice"
          text={t("today.stylingFailed")}
          actions={[
            { label: t("common.tryAgain"), onPress: model.stylingFailed },
          ]}
          testID="today-styling-failed"
        />
      ) : null}
      <EmptyState
        mark
        action={{
          label: t("today.firstRun.style"),
          accessibilityValue: t("today.firstRun.styleHint"),
          onPress: () => router.push("/profile/style"),
        }}
        secondary={{
          label: t("sample.try"),
          busy: model.styling,
          onPress: trySample,
        }}
        testID="today-first-run"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  first: { gap: theme.space.xl, paddingTop: theme.space.xl },
});
