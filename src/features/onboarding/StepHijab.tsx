import type { Answers } from "../../domain/onboarding";
import { t } from "../../i18n";
import { ChipRow } from "../../ui";

type Hijab = NonNullable<Answers["hijab"]["hijab"]>;

export function StepHijab({
  answers,
  onChange,
}: {
  answers: Answers;
  onChange: (next: Answers["hijab"]) => void;
}) {
  return (
    <ChipRow<Hijab>
      options={[
        { id: "always", label: t("hijab.always") },
        { id: "sometimes", label: t("hijab.sometimes") },
        { id: "no", label: t("onboarding.hijab.no") },
      ]}
      value={answers.hijab.hijab}
      onChange={(hijab) => onChange({ hijab: hijab as Hijab })}
      testID="hijab"
    />
  );
}
