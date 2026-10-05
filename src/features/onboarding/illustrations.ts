import {
  bodyShapes,
  hijabStyles,
  sparkles,
  type BodyShape,
  type HijabStyle,
  type Sparkle,
} from "../../domain/closet";
import { t } from "../../i18n";
import type { ChoiceOption } from "../../ui";

export const illustrations = {
  "coverage-full": require("../../../assets/illustrations/coverage-full.jpg"),
  "coverage-moderate": require("../../../assets/illustrations/coverage-moderate.jpg"),
  "coverage-relaxed": require("../../../assets/illustrations/coverage-relaxed.jpg"),
  "style-western": require("../../../assets/illustrations/style-western.jpg"),
  "style-abaya": require("../../../assets/illustrations/style-abaya.jpg"),
  "style-desi": require("../../../assets/illustrations/style-desi.jpg"),
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
  "sparkle-plain": require("../../../assets/illustrations/sparkle-plain.jpg"),
  "sparkle-little": require("../../../assets/illustrations/sparkle-little.jpg"),
  "sparkle-heavy": require("../../../assets/illustrations/sparkle-heavy.jpg"),
  "sparkle-bridal": require("../../../assets/illustrations/sparkle-bridal.jpg"),
  "hijab-always": require("../../../assets/illustrations/hijab-always.jpg"),
  "hijab-sometimes": require("../../../assets/illustrations/hijab-sometimes.jpg"),
  "hijab-no": require("../../../assets/illustrations/hijab-no.jpg"),
  "coverage-full-bare": require("../../../assets/illustrations/coverage-full-bare.jpg"),
  "coverage-moderate-bare": require("../../../assets/illustrations/coverage-moderate-bare.jpg"),
  "coverage-relaxed-bare": require("../../../assets/illustrations/coverage-relaxed-bare.jpg"),
  "style-western-bare": require("../../../assets/illustrations/style-western-bare.jpg"),
  "style-abaya-bare": require("../../../assets/illustrations/style-abaya-bare.jpg"),
  "style-desi-bare": require("../../../assets/illustrations/style-desi-bare.jpg"),
  "style-mix-bare": require("../../../assets/illustrations/style-mix-bare.jpg"),
  "fit-loose-bare": require("../../../assets/illustrations/fit-loose-bare.jpg"),
  "fit-structured-bare": require("../../../assets/illustrations/fit-structured-bare.jpg"),
  "sparkle-plain-bare": require("../../../assets/illustrations/sparkle-plain-bare.jpg"),
  "sparkle-little-bare": require("../../../assets/illustrations/sparkle-little-bare.jpg"),
  "sparkle-heavy-bare": require("../../../assets/illustrations/sparkle-heavy-bare.jpg"),
  "sparkle-bridal-bare": require("../../../assets/illustrations/sparkle-bridal-bare.jpg"),
  "shape-pear": require("../../../assets/illustrations/shape-pear.jpg"),
  "shape-apple": require("../../../assets/illustrations/shape-apple.jpg"),
  "shape-hourglass": require("../../../assets/illustrations/shape-hourglass.jpg"),
  "shape-rectangle": require("../../../assets/illustrations/shape-rectangle.jpg"),
  "shape-inverted-triangle": require("../../../assets/illustrations/shape-inverted-triangle.jpg"),
  "shape-athletic": require("../../../assets/illustrations/shape-athletic.jpg"),
} as const;

type Bare = `${string}-bare` & keyof typeof illustrations;
type Covered = Bare extends `${infer Key}-bare` ? Key : never;

export function art(key: Covered, bare: boolean) {
  return bare ? illustrations[`${key}-bare` as Bare] : illustrations[key];
}

export function hijabOptions(): ChoiceOption<"always" | "sometimes" | "no">[] {
  return (["always", "sometimes", "no"] as const).map((id) => ({
    id,
    label: id === "no" ? t("onboarding.hijab.no") : t(`hijab.${id}`),
    image: illustrations[`hijab-${id}`],
  }));
}

export function coverageOptions(
  bare: boolean,
): ChoiceOption<"full" | "moderate" | "relaxed">[] {
  return (["full", "moderate", "relaxed"] as const).map((id) => ({
    id,
    label: t(`coverage.${id}`),
    description: t(`coverage.${id}.description`),
    image: art(`coverage-${id}`, bare),
  }));
}

export const leanArt = {
  western: "style-western",
  abaya: "style-abaya",
  desi: "style-desi",
  both: "style-mix",
} as const;

export function styleOptionsCards(
  bare: boolean,
): ChoiceOption<keyof typeof leanArt>[] {
  return (["western", "abaya", "desi", "both"] as const).map((id) => ({
    id,
    label: t(`onboarding.style.${id}`),
    image: art(leanArt[id], bare),
  }));
}

export function fitOptions(
  bare: boolean,
): ChoiceOption<"loose" | "structured">[] {
  return (["loose", "structured"] as const).map((id) => ({
    id,
    label: t(`onboarding.fit.${id}`),
    image: art(`fit-${id}`, bare),
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

export function sparkleOptions(bare: boolean): ChoiceOption<Sparkle>[] {
  return sparkles.map((id) => ({
    id,
    label: t(`sparkle.${id}`),
    description: t(`sparkle.${id}.description`),
    image: art(`sparkle-${id}`, bare),
  }));
}

export function shapeOptions(): ChoiceOption<BodyShape>[] {
  return bodyShapes.map((id) => ({
    id,
    label: t(`shape.${id}`),
    image: illustrations[`shape-${id}`],
  }));
}
