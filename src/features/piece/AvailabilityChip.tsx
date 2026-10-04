import {
  awayReasons,
  setAway,
  type AwayReason,
  type Piece,
} from "../../domain/closet";
import { dropFromToday } from "../../domain/today";
import { t } from "../../i18n";
import type { FactSpec } from "./FactChips";

export function availabilityFact(piece: Piece): FactSpec {
  const reason = piece.status === "away" ? (piece.away ?? null) : null;
  const value = reason ? t(`piece.away.${reason}`) : t("piece.available");
  return {
    id: "availability",
    name: t("piece.availability"),
    value,
    spoken: `${value}, ${t("piece.availability")}`,
    rows: [
      {
        id: "availability",
        options: [
          { id: "available", label: t("piece.available") },
          ...awayReasons.map((id) => ({ id, label: t(`piece.away.${id}`) })),
        ],
        value: reason ?? "available",
        pick: () => (latest) => latest,
      },
    ],
    transform: (option) => (closet) => {
      const next = option === "available" ? null : (option as AwayReason);
      const changed = setAway(closet, piece.id, next);
      return next ? dropFromToday(changed, piece.id) : changed;
    },
  };
}
