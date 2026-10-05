import type { Answers } from "../../domain/onboarding";
import { t } from "../../i18n";
import { ChoiceCardGroup } from "../../ui";
import { fitOptions } from "./illustrations";

type Choice = "loose" | "structured" | "depends";

export function StepFit({
  answers,
  onChange,
}: {
  answers: Answers;
  onChange: (next: Answers["fit"]) => void;
}) {
  return (
    <ChoiceCardGroup<Choice>
      options={fitOptions(answers.hijab.hijab === "no")}
      plainFirst
      plain={[{ id: "depends", label: t("onboarding.depends") }]}
      value={answers.fit.fit}
      onChange={(next) =>
        onChange({ fit: typeof next === "string" ? next : null })
      }
      testID="card"
    />
  );
}
