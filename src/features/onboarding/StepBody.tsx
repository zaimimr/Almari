import { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import type { Answers } from "../../domain/onboarding";
import { scaleFor } from "../../domain/units";
import { t } from "../../i18n";
import { Segmented, Text } from "../../ui";
import { theme } from "../../ui/theme";
import { BodyShapes } from "./BodyShapes";
import { MeasureRuler } from "./MeasureRuler";

export function StepBody({
  answers,
  onChange,
}: {
  answers: Answers;
  onChange: (next: Answers["body"]) => void;
}) {
  const { body } = answers;
  const height = useMemo(() => scaleFor("height", body.units), [body.units]);
  const weight = useMemo(() => scaleFor("weight", body.units), [body.units]);
  return (
    <View style={styles.list}>
      <Segmented
        options={[
          { id: "metric", label: t("onboarding.units.metricShort") },
          { id: "imperial", label: t("onboarding.units.imperialShort") },
        ]}
        value={body.units}
        onChange={(units) => onChange({ ...body, units })}
      />
      <MeasureRuler
        label={t("onboarding.height.title")}
        scale={height}
        value={body.heightCm}
        onChange={(heightCm) => onChange({ ...body, heightCm })}
        testID="body-height"
      />
      <MeasureRuler
        label={t("onboarding.weight.title")}
        scale={weight}
        value={body.weightKg}
        onChange={(weightKg) => onChange({ ...body, weightKg })}
        testID="body-weight"
      />
      <BodyShapes
        value={body.bodyShape}
        onChange={(bodyShape) => onChange({ ...body, bodyShape })}
      />
      <Text role="footnote" tone="muted">
        {t("onboarding.body.why")}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: theme.space.xl },
});
