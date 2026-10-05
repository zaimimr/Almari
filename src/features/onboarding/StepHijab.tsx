import type { Answers } from "../../domain/onboarding";
import { ChoiceCardGroup } from "../../ui";
import { hijabOptions } from "./illustrations";

type Hijab = NonNullable<Answers["hijab"]["hijab"]>;

export function StepHijab({
  answers,
  onChange,
}: {
  answers: Answers;
  onChange: (next: Answers["hijab"]) => void;
}) {
  return (
    <ChoiceCardGroup<Hijab>
      options={hijabOptions()}
      value={answers.hijab.hijab}
      onChange={(hijab) => {
        if (typeof hijab === "string") onChange({ hijab });
      }}
      testID="hijab"
    />
  );
}
