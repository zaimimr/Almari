import type { Answers } from "../../domain/onboarding";
import { t } from "../../i18n";
import { ChoiceCardGroup } from "../../ui";
import { coverageOptions } from "./illustrations";

type Choice = "full" | "moderate" | "relaxed" | "none";

export function StepCoverage({
  answers,
  onChange,
}: {
  answers: Answers;
  onChange: (next: Answers["coverage"]) => void;
}) {
  const { coverage, answered } = answers.coverage;
  const value: Choice | null =
    coverage === "full" || coverage === "moderate" || coverage === "relaxed"
      ? coverage
      : answered && coverage === null
        ? "none"
        : null;
  return (
    <ChoiceCardGroup<Choice>
      options={coverageOptions()}
      plain={[{ id: "none", label: t("coverage.noPreference") }]}
      value={value}
      onChange={(next) =>
        onChange({
          coverage:
            next === "none" || next === null || Array.isArray(next)
              ? null
              : next,
          answered: true,
        })
      }
      testID="card"
    />
  );
}
