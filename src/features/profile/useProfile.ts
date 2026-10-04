import { router, type Href } from "expo-router";
import type { Closet } from "../../domain/closet";
import { hasAnyWear } from "../../domain/feedback";
import { formatHeight } from "../../domain/units";
import { closetStats, type QuickAdd } from "../../domain/profileStats";
import { t, type Key } from "../../i18n";
import { setPendingFilter } from "../../state/closetFilter";
import { seasonLabel } from "../selfie/palette";

export const quickRoutes: Record<Exclude<QuickAdd, "details">, Href> = {
  name: "/profile/answer/name",
  hijab: "/profile/style?open=hijab",
  hijabStyles: "/profile/style?open=hijabStyles",
  coverage: "/profile/style?open=coverage",
  style: "/profile/style?open=style",
  fit: "/profile/style?open=fit",
  sparkle: "/profile/style?open=sparkle",
  location: "/profile/answer/place",
  colours: "/profile/answer/colours",
  body: "/profile/answer/body",
  never: "/profile/never",
  wearMore: "/profile/wear-more",
};

export function openQuick(key: QuickAdd) {
  if (key === "details") {
    setPendingFilter({ coverage: "needs-details", panelOpen: true });
    router.navigate("/(tabs)/closet");
    return;
  }
  router.push(quickRoutes[key]);
}

export function openNeverWorn() {
  setPendingFilter({ wear: "never-worn", panelOpen: true });
  router.navigate("/(tabs)/closet");
}

const pieceCount = (count: number) =>
  count
    ? t(count === 1 ? "common.pieceCountOne" : "common.pieceCountMany", {
        count,
      })
    : t("common.none");

export function profileSummary(closet: Closet) {
  const { everyday, profile, place, name, units } = closet.styling;
  const notAnswered = t("profile.notAnswered");
  const join = (...parts: (string | null | false | undefined)[]) =>
    parts.filter(Boolean).join(" · ") || notAnswered;
  const lean = profile.styleLean
    ? t(`onboarding.style.${profile.styleLean}`)
    : everyday
      ? t(`style.${everyday.style}` as Key)
      : null;
  const stats = closetStats(closet);
  const top = stats.mostWorn[0];
  return {
    style: everyday
      ? join(
          everyday.occasion !== "everyday" &&
            t(`occasion.${everyday.occasion}`),
          lean,
        )
      : notAnswered,
    never: profile.neverWear?.length
      ? String(profile.neverWear.length)
      : t("common.none"),
    wearMore: pieceCount(profile.wearMore?.length ?? 0),
    name: name ?? notAnswered,
    place: place?.name ?? notAnswered,
    body: join(
      profile.heightCm !== null && formatHeight(profile.heightCm, units),
      profile.bodyShape
        ? t(`shape.${profile.bodyShape}`)
        : profile.bodyAnswered && profile.heightCm === null
          ? t("shape.none")
          : null,
    ),
    colours: profile.colour ? seasonLabel(profile.colour.season) : notAnswered,
    neverWorn:
      hasAnyWear(closet) && stats.neverWorn > 0
        ? pieceCount(stats.neverWorn)
        : null,
    mostWorn: top
      ? {
          id: top.piece.id,
          text: t(top.count === 1 ? "stats.wornOnce" : "stats.wornMany", {
            name: top.piece.name,
            count: top.count,
          }),
        }
      : null,
  };
}
