import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { router } from "expo-router";
import type { Units } from "../../domain/closet";
import { answersFrom, applyAnswer } from "../../domain/onboarding";
import { clockFor } from "../../domain/today";
import { t } from "../../i18n";
import { useCloset } from "../../state/closet";
import { now } from "../../state/clock";
import { ChipRow, Field, Footer, Screen, Text } from "../../ui";
import { theme } from "../../ui/theme";
import { BodyShapes } from "../onboarding/BodyShapes";

export function BodyAnswer() {
  const { closet, update } = useCloset();
  const [body, setBody] = useState(() => answersFrom(closet).body);
  const [height, setHeight] = useState(
    body.heightCm === null ? "" : String(body.heightCm),
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const parsed = height.trim() === "" ? null : Number(height);
  const invalid =
    parsed !== null &&
    (!Number.isFinite(parsed) || parsed < 120 || parsed > 220);

  async function save() {
    if (busy || invalid) return;
    setBusy(true);
    try {
      await update((current) =>
        applyAnswer(
          current,
          "body",
          { ...body, heightCm: parsed === null ? null : Math.round(parsed) },
          clockFor(now()),
        ),
      );
      router.back();
    } catch {
      setError(t("common.error.save"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen
      title={t("onboarding.body.title")}
      leading="cancel"
      onCancel={() => router.back()}
      footer={
        <Footer
          primary={{
            label: t("common.save"),
            onPress: () => void save(),
            busy,
            disabled: invalid,
            testID: "answer-save",
          }}
          error={error}
        />
      }
      testID="answer-body"
    >
      <View style={styles.list}>
        <Text role="footnote" tone="muted">
          {t("onboarding.body.why")}
        </Text>
        <ChipRow<Units>
          label={t("onboarding.units.question")}
          options={(["metric", "imperial"] as const).map((id) => ({
            id,
            label: t(`onboarding.units.${id}`),
          }))}
          value={body.units}
          onChange={(next) => {
            if (typeof next === "string")
              setBody((current) => ({ ...current, units: next }));
          }}
        />
        <Field
          label={t("onboarding.height.label")}
          value={height}
          onChangeText={setHeight}
          keyboardType="number-pad"
          error={invalid ? t("onboarding.height.invalid") : null}
          testID="answer-height"
        />
        <BodyShapes
          value={body.bodyShape}
          onChange={(bodyShape) =>
            setBody((current) => ({ ...current, bodyShape }))
          }
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { gap: theme.space.lg },
});
