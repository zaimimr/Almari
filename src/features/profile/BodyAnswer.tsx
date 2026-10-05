import { useState } from "react";
import { InputAccessoryView, Keyboard, StyleSheet, View } from "react-native";
import { router } from "expo-router";
import { answersFrom, applyAnswer } from "../../domain/onboarding";
import { clockFor } from "../../domain/today";
import { feetAndInches, parseHeight } from "../../domain/units";
import { t } from "../../i18n";
import { useCloset } from "../../state/closet";
import { now } from "../../state/clock";
import { Button, Field, Footer, Screen, Text } from "../../ui";
import { theme } from "../../ui/theme";
import { BodyShapes } from "../onboarding/BodyShapes";

const accessory = "height-done";

export function BodyAnswer() {
  const { closet, update } = useCloset();
  const [body, setBody] = useState(() => answersFrom(closet).body);
  const { units } = body;
  const [height, setHeight] = useState(() => {
    if (body.heightCm === null) return { cm: "", feet: "", inches: "" };
    const { feet, inches } = feetAndInches(body.heightCm);
    return {
      cm: String(body.heightCm),
      feet: String(feet),
      inches: String(inches),
    };
  });
  const [checked, setChecked] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const entered = (
    units === "metric" ? height.cm : height.feet + height.inches
  ).trim();
  const parsed = entered === "" ? null : parseHeight(units, height);
  const invalid = entered !== "" && parsed === null;
  const shownError =
    checked && invalid
      ? t(
          units === "metric"
            ? "onboarding.height.invalid"
            : "onboarding.height.invalidImperial",
        )
      : null;
  const field = (key: keyof typeof height, label: string) => (
    <Field
      label={label}
      value={height[key]}
      onChangeText={(text) => {
        setChecked(false);
        setHeight((current) => ({ ...current, [key]: text }));
      }}
      onBlur={() => setChecked(true)}
      keyboardType="number-pad"
      inputAccessoryViewID={accessory}
      error={shownError}
      testID={key === "cm" ? "answer-height" : `answer-height-${key}`}
    />
  );

  async function save() {
    if (busy) return;
    if (invalid) {
      setChecked(true);
      return;
    }
    setBusy(true);
    try {
      await update((current) =>
        applyAnswer(
          current,
          "body",
          { ...body, heightCm: parsed },
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
            disabled: Boolean(shownError),
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
        {units === "metric" ? (
          field("cm", t("onboarding.height.label"))
        ) : (
          <View style={styles.pair}>
            <View style={styles.half}>
              {field("feet", t("onboarding.height.feet"))}
            </View>
            <View style={styles.half}>
              {field("inches", t("onboarding.height.inches"))}
            </View>
          </View>
        )}
        <BodyShapes
          value={body.bodyShape}
          onChange={(bodyShape) =>
            setBody((current) => ({ ...current, bodyShape }))
          }
        />
      </View>
      <InputAccessoryView nativeID={accessory}>
        <View style={styles.accessory}>
          <Button
            label={t("common.done")}
            variant="quiet"
            size="small"
            onPress={() => Keyboard.dismiss()}
            testID="height-done"
          />
        </View>
      </InputAccessoryView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { gap: theme.space.lg },
  pair: { flexDirection: "row", gap: theme.space.md },
  half: { flex: 1 },
  accessory: { alignItems: "flex-end", paddingHorizontal: theme.space.sm },
});
