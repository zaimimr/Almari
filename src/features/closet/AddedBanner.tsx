import { useState } from "react";
import type { Closet, Piece } from "../../domain/closet";
import { hasAnyWear } from "../../domain/feedback";
import { sameCapture } from "../../domain/importing";
import { missingRoles } from "../../domain/styling";
import { t, type Key } from "../../i18n";
import { Banner, ResultBar, type ButtonProps } from "../../ui";

const listOf = (words: string[]) =>
  words.length > 1
    ? `${words.slice(0, -1).join(", ")} ${t("word.and")} ${words.at(-1)}`
    : (words[0] ?? "");

export function AddedBanner({
  closet,
  ids,
  onStart,
  onLink,
  onMarkWearMost,
  onNewLook,
}: {
  closet: Closet;
  ids: string[];
  onStart: (pieces: Piece[]) => void;
  onLink: (ids: string[], after: () => void) => void;
  onMarkWearMost: () => void;
  onNewLook: (pieces: Piece[]) => void;
}) {
  const [linked, setLinked] = useState(false);
  const pieces = closet.pieces.filter((piece) => ids.includes(piece.id));
  if (!pieces.length) return null;

  const owned = closet.pieces.filter(
    (piece) => piece.source === "owned" && piece.status !== "archived",
  );
  const missing = missingRoles(owned, {
    hijab: closet.styling.everyday?.hijab ?? null,
  });
  const canLink =
    pieces.length > 1 &&
    sameCapture(pieces) &&
    pieces.every((piece) => !piece.setId);
  const offers: ButtonProps[] = [
    ...(canLink
      ? [
          {
            label: t("closet.linkSet"),
            onPress: () =>
              onLink(
                pieces.map((piece) => piece.id),
                () => setLinked(true),
              ),
          },
        ]
      : []),
    ...(hasAnyWear(closet)
      ? []
      : [{ label: t("closet.markWearMost"), onPress: onMarkWearMost }]),
    { label: t("looks.new"), onPress: () => onNewLook(pieces) },
  ];
  const start = {
    label: t("pieces.startWithThese"),
    onPress: () => onStart(pieces),
  };
  const actions = (missing.length ? offers : [start, ...offers]).slice(0, 2);
  const text = missing.length
    ? t("closet.missingRoles", {
        roles: listOf(missing.map((role) => t(`role.${role}List` as Key))),
      })
    : pieces.length === 1
      ? t("closet.addedOne")
      : t("closet.addedMany", { count: pieces.length });

  return (
    <Banner
      tone="notice"
      text={text}
      actions={
        linked
          ? undefined
          : (actions as [ButtonProps] | [ButtonProps, ButtonProps])
      }
      testID="closet-added"
    >
      {linked ? <ResultBar text={t("closet.linked")} focus /> : null}
    </Banner>
  );
}
