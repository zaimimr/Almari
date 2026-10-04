import type { Sparkle } from "../../domain/closet";
import type { Answers } from "../../domain/onboarding";
import { ChoiceCardGroup } from "../../ui";
import { sparkleOptions } from "./illustrations";

export function StepSparkle({
  answers,
  onChange,
}: {
  answers: Answers;
  onChange: (next: Answers["sparkle"]) => void;
}) {
  return (
    <ChoiceCardGroup<Sparkle>
      options={sparkleOptions()}
      value={answers.sparkle.sparkle}
      onChange={(next) =>
        onChange({ sparkle: typeof next === "string" ? next : null })
      }
      testID="sparkle"
    />
  );
}
