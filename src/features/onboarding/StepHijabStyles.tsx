import type { HijabStyle } from "../../domain/closet";
import type { Answers } from "../../domain/onboarding";
import { t } from "../../i18n";
import { ChoiceCardGroup } from "../../ui";
import { hijabStyleOptions } from "./illustrations";

type Choice = HijabStyle | "none";

export function StepHijabStyles({
  answers,
  onChange,
}: {
  answers: Answers;
  onChange: (next: Answers["hijabStyles"]) => void;
}) {
  const chosen = answers.hijabStyles.hijabStyles;
  return (
    <ChoiceCardGroup<Choice>
      options={hijabStyleOptions()}
      plain={[{ id: "none", label: t("common.noneOfThese") }]}
      value={chosen === null ? [] : chosen.length === 0 ? ["none"] : chosen}
      onChange={(next) => {
        const list = (Array.isArray(next) ? next : []) as Choice[];
        onChange({
          hijabStyles: list.includes("none")
            ? []
            : list.length === 0
              ? null
              : (list as HijabStyle[]),
        });
      }}
      multi
      exclusive="none"
      testID="card"
    />
  );
}
