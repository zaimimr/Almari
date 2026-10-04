import type { Answers } from "../../domain/onboarding";
import { ChoiceCardGroup } from "../../ui";
import { styleOptionsCards } from "./illustrations";

type Choice = "western" | "desi" | "both";

export function StepStyle({
  answers,
  onChange,
}: {
  answers: Answers;
  onChange: (next: Answers["style"]) => void;
}) {
  return (
    <ChoiceCardGroup<Choice>
      options={styleOptionsCards()}
      value={answers.style.styleLean}
      onChange={(next) =>
        onChange({ styleLean: typeof next === "string" ? next : null })
      }
      testID="style"
    />
  );
}
