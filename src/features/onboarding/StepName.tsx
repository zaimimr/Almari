import type { Answers } from "../../domain/onboarding";
import { t } from "../../i18n";
import { Field } from "../../ui";

export function StepName({
  answers,
  onChange,
  onSubmit,
}: {
  answers: Answers;
  onChange: (next: Answers["name"]) => void;
  onSubmit: () => void;
}) {
  return (
    <Field
      label={t("onboarding.name.question")}
      hideLabel
      placeholder=""
      value={answers.name.name ?? ""}
      onChangeText={(name) => onChange({ name })}
      returnKeyType="next"
      submitBehavior="submit"
      onSubmitEditing={onSubmit}
      maxLength={40}
      autoFocus
      autoComplete="given-name"
      textContentType="givenName"
      testID="name-field"
    />
  );
}
