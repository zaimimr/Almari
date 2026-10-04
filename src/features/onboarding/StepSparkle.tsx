import { sparkles, type Sparkle } from "../../domain/closet";
import type { Answers } from "../../domain/onboarding";
import { t } from "../../i18n";
import { ChipRow } from "../../ui";

export function StepSparkle({
  answers,
  onChange,
}: {
  answers: Answers;
  onChange: (next: Answers["sparkle"]) => void;
}) {
  return (
    <ChipRow<Sparkle>
      options={sparkles.map((id) => ({ id, label: t(`sparkle.${id}`) }))}
      value={answers.sparkle.sparkle}
      onChange={(next) =>
        onChange({ sparkle: typeof next === "string" ? next : null })
      }
      testID="sparkle"
    />
  );
}
