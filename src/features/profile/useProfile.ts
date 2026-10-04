import type { Closet } from "../../domain/closet";
import { formatHeight } from "../../domain/units";
import { t } from "../../i18n";

export function profileSummary(closet: Closet) {
  const { profile, place, units } = closet.styling;
  const notAnswered = t("profile.notAnswered");
  const body = [
    profile.heightCm !== null && formatHeight(profile.heightCm, units),
    profile.bodyShape
      ? t(`shape.${profile.bodyShape}`)
      : profile.bodyAnswered && profile.heightCm === null
        ? t("shape.none")
        : null,
  ]
    .filter(Boolean)
    .join(" · ");
  return {
    never: profile.neverWear?.length
      ? String(profile.neverWear.length)
      : t("common.none"),
    place: place?.name ?? notAnswered,
    body: body || notAnswered,
  };
}
