import { useState } from "react";
import type { Closet, Piece } from "../../domain/closet";
import { wearDate } from "../../domain/looks";
import { locale, t } from "../../i18n";
import { useCloset } from "../../state/closet";
import { shortDate } from "../../ui";

export function wearLine(closet: Closet, id: string): string {
  const wears = closet.feedback.filter(
    (event) =>
      event.kind === "wore" && !event.undone && event.pieceIds.includes(id),
  );
  if (!wears.length) return t("closet.neverWorn");
  const last = wears.reduce((latest, event) =>
    Date.parse(event.at) > Date.parse(latest.at) ? event : latest,
  );
  const date = shortDate(wearDate(closet, last.at), locale);
  return wears.length === 1
    ? t("piece.wornOnce", { date })
    : t("piece.wornMany", { count: wears.length, date });
}

export function usePiece(id: string | undefined) {
  const { closet, update } = useCloset();
  const [error, setError] = useState<string | null>(null);
  const piece: Piece | undefined = closet.pieces.find((item) => item.id === id);

  async function change(next: (current: Closet) => Closet) {
    setError(null);
    try {
      await update(next);
    } catch (failure) {
      setError(t("common.error.save"));
      throw failure;
    }
  }

  return { closet, update, piece, change, error, setError };
}
