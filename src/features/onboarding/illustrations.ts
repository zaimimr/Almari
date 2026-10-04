import { hijabStyles, type HijabStyle } from "../../domain/closet";
import { t } from "../../i18n";
import type { ChoiceOption } from "../../ui";

export const illustrations = {
  "coverage-full": require("../../../assets/illustrations/coverage-full.jpg"),
  "coverage-moderate": require("../../../assets/illustrations/coverage-moderate.jpg"),
  "coverage-relaxed": require("../../../assets/illustrations/coverage-relaxed.jpg"),
  "style-western": require("../../../assets/illustrations/style-western.jpg"),
  "style-abaya": require("../../../assets/illustrations/style-abaya.jpg"),
  "style-mix": require("../../../assets/illustrations/style-mix.jpg"),
  "fit-loose": require("../../../assets/illustrations/fit-loose.jpg"),
  "fit-structured": require("../../../assets/illustrations/fit-structured.jpg"),
  "hijab-hijab": require("../../../assets/illustrations/hijab-hijab.jpg"),
  "hijab-shayla": require("../../../assets/illustrations/hijab-shayla.jpg"),
  "hijab-al-amira": require("../../../assets/illustrations/hijab-al-amira.jpg"),
  "hijab-khimar": require("../../../assets/illustrations/hijab-khimar.jpg"),
  "hijab-chador": require("../../../assets/illustrations/hijab-chador.jpg"),
  "hijab-niqab": require("../../../assets/illustrations/hijab-niqab.jpg"),
  "hijab-burqa": require("../../../assets/illustrations/hijab-burqa.jpg"),
} as const;

export function coverageOptions(): ChoiceOption<
  "full" | "moderate" | "relaxed"
>[] {
  return (["full", "moderate", "relaxed"] as const).map((id) => ({
    id,
    label: t(`coverage.${id}`),
    description: t(`coverage.${id}.description`),
    image: illustrations[`coverage-${id}`],
  }));
}

export function styleOptionsCards(): ChoiceOption<
  "western" | "desi" | "both"
>[] {
  return [
    {
      id: "western",
      label: t("onboarding.style.western"),
      image: illustrations["style-western"],
    },
    {
      id: "desi",
      label: t("onboarding.style.desi"),
      image: illustrations["style-abaya"],
    },
    {
      id: "both",
      label: t("onboarding.style.both"),
      image: illustrations["style-mix"],
    },
  ];
}

export function fitOptions(): ChoiceOption<"loose" | "structured">[] {
  return (["loose", "structured"] as const).map((id) => ({
    id,
    label: t(`onboarding.fit.${id}`),
    image: illustrations[`fit-${id}`],
  }));
}

export function hijabStyleOptions(): ChoiceOption<HijabStyle>[] {
  return hijabStyles.map((id) => ({
    id,
    label: t(`hijabStyle.${id}`),
    description: t(`hijabStyle.${id}.description`),
    image: illustrations[`hijab-${id}`],
    bust: true,
  }));
}
