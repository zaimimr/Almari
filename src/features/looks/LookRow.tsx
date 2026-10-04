import { router } from "expo-router";
import type { Closet } from "../../domain/closet";
import type { LookEntry } from "../../domain/looks";
import { t } from "../../i18n";
import { Row } from "../../ui";
import { entryMeta } from "./format";

export function LookRow({
  closet,
  entry,
  last,
}: {
  closet: Closet;
  entry: LookEntry;
  last?: boolean;
}) {
  const pieces = entry.pieceIds.flatMap((id) => {
    const piece = closet.pieces.find((item) => item.id === id);
    return piece ? [piece] : [];
  });
  const meta = entryMeta(closet, entry);
  const count =
    pieces.length === 1
      ? t("common.pieceCountOne")
      : t("common.pieceCountMany", { count: pieces.length });
  return (
    <Row
      title={entry.name}
      meta={meta}
      leading={{ lay: pieces }}
      trailing="chevron"
      accessibilityLabel={[entry.name, meta, count].filter(Boolean).join(", ")}
      onPress={() => router.push(`/look/${entry.id}`)}
      last={last}
      testID={`look-${entry.id}`}
    />
  );
}
