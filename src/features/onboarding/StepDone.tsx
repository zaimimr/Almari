import { StyleSheet, View } from "react-native";
import type { Answers } from "../../domain/onboarding";
import { t } from "../../i18n";
import { EmptyState, Text } from "../../ui";
import { theme } from "../../ui/theme";

type Line = { label: string; value: string };

function summaryOf(answers: Answers): Line[] {
  const { hijab } = answers.hijab;
  const worn = answers.hijabStyles.hijabStyles ?? [];
  const { coverage, answered } = answers.coverage;
  const { styleLean } = answers.style;
  const lines: (Line | null)[] = [
    hijab
      ? {
          label: t("style.hijab"),
          value:
            hijab === "no"
              ? t("onboarding.hijab.no")
              : [
                  t(`hijab.${hijab}`),
                  ...worn.map((id) => t(`hijabStyle.${id}`)),
                ].join(", "),
        }
      : null,
    coverage || answered
      ? {
          label: t("profile.tile.coverage"),
          value: coverage
            ? t(`coverage.${coverage}`)
            : t("coverage.noPreference"),
        }
      : null,
    styleLean
      ? { label: t("style.style"), value: t(`onboarding.style.${styleLean}`) }
      : null,
  ];
  return lines.filter((line): line is Line => line !== null);
}

export function StepDone({
  answers,
  onAddPieces,
  onSample,
  busy,
}: {
  answers: Answers;
  onAddPieces: () => void;
  onSample: () => void;
  busy: "add" | "sample" | null;
}) {
  const lines = summaryOf(answers);
  return (
    <View style={styles.done}>
      <EmptyState mark title={t("onboarding.done.title")} />
      {lines.length > 0 ? (
        <View style={styles.summary} testID="done-summary">
          {lines.map(({ label, value }) => (
            <View key={label} accessible style={styles.line}>
              <Text role="eyebrow" style={styles.center}>
                {label}
              </Text>
              <Text role="body" style={styles.center}>
                {value}
              </Text>
            </View>
          ))}
        </View>
      ) : null}
      <EmptyState
        action={{
          label: t("closet.addPieces"),
          onPress: onAddPieces,
          busy: busy === "add",
          disabled: busy === "sample",
          testID: "done-add",
        }}
        secondary={{
          label: t("sample.try"),
          onPress: onSample,
          busy: busy === "sample",
          disabled: busy === "add",
          testID: "done-sample",
        }}
        testID="onboarding-done"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  done: { gap: theme.space.xl },
  summary: { gap: theme.space.lg },
  line: { gap: theme.space.xs },
  center: { textAlign: "center" },
});
