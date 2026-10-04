import type { Closet, Piece } from "../../domain/closet";
import { t } from "../../i18n";
import { Banner } from "../../ui";

export function AddedBanner({
  closet,
  ids,
  onStart,
}: {
  closet: Closet;
  ids: string[];
  onStart: (pieces: Piece[]) => void;
}) {
  const pieces = closet.pieces.filter((piece) => ids.includes(piece.id));
  if (!pieces.length) return null;

  return (
    <Banner
      tone="notice"
      text={
        pieces.length === 1
          ? t("closet.addedOne")
          : t("closet.addedMany", { count: pieces.length })
      }
      actions={[
        {
          label: t("pieces.startWithThese"),
          onPress: () => onStart(pieces),
          testID: "closet-added-start",
        },
      ]}
      testID="closet-added"
    />
  );
}
