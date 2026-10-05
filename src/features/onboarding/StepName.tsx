import { StyleSheet, View } from "react-native";
import type { Answers } from "../../domain/onboarding";
import { t } from "../../i18n";
import { Field, Text } from "../../ui";
import { theme } from "../../ui/theme";

const max = 40;

export function StepName({
  answers,
  onChange,
  onSubmit,
}: {
  answers: Answers;
  onChange: (next: Answers["name"]) => void;
  onSubmit: () => void;
}) {
  const count = answers.name.name?.length ?? 0;
  return (
    <View style={styles.name}>
      <Field
        label={t("onboarding.name.question")}
        hideLabel
        placeholder=""
        value={answers.name.name ?? ""}
        onChangeText={(name) => onChange({ name })}
        returnKeyType="next"
        submitBehavior="submit"
        onSubmitEditing={onSubmit}
        maxLength={max}
        autoCorrect={false}
        spellCheck={false}
        autoFocus
        autoComplete="given-name"
        textContentType="givenName"
        testID="name-field"
      />
      {count >= max - 10 ? (
        <Text
          role="footnote"
          tone={count >= max ? "error" : "muted"}
          style={styles.count}
          testID="name-count"
        >
          {t("onboarding.name.count", { count, max })}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  name: { gap: theme.space.xs },
  count: { textAlign: "right" },
});
