import { useMemo } from "react";
import { plannedPieces } from "../../domain/looks";
import { replacementsFor, roleOf } from "../../domain/styling";
import { clockFor, isRequired, toggleKeep } from "../../domain/today";
import { hijabAlternatives } from "../../domain/wardrobe";
import { locale, t } from "../../i18n";
import { now } from "../../state/clock";
import { shortWeekday } from "../../ui/dates";
import { ChangeStrip } from "../ChangeStrip";
import type { TodayModel } from "./useToday";

export function PieceStrip({ model }: { model: TodayModel }) {
  const { closet, request, session, openId, setOpenId, pieces } = model;
  const target = openId
    ? (pieces.find((piece) => piece.id === openId) ?? null)
    : null;
  const role = target ? roleOf(target) : null;

  const strip = useMemo(() => {
    if (!target || !request || !session) return null;
    if (role === "hijab") {
      const comparison = hijabAlternatives(
        closet,
        request,
        session.pieceIds,
        model.score,
        { all: false },
      );
      const marks = plannedPieces(closet, clockFor(now()));
      const options = comparison
        ? [comparison.current, ...comparison.options]
        : [{ piece: target, reason: null }];
      const partner = pieces.find((piece) => roleOf(piece) === "main");
      return {
        alternatives: options.map(({ piece, reason }) => ({
          piece,
          reason,
          planned: marks[piece.id]
            ? shortWeekday(marks[piece.id]!, locale)
            : undefined,
        })),
        value: partner
          ? t("change.reason.with", { piece: partner.name })
          : undefined,
      };
    }
    const replacements = replacementsFor(
      closet.pieces,
      request,
      session.pieceIds,
      target.id,
      model.scorer,
      model.context,
    );
    return {
      alternatives: [
        { piece: target, reason: null },
        ...replacements
          .filter((item) => item.piece.id !== target.id)
          .map((item) => ({ piece: item.piece, reason: null })),
      ],
      value: undefined,
    };
  }, [target, role, request, session, closet, pieces, model]);

  if (!target || !role || !request || !strip) return null;

  return (
    <ChangeStrip
      role={role}
      pieceId={target.id}
      alternatives={strip.alternatives}
      currentId={target.id}
      open
      onClose={() => setOpenId(null)}
      onPick={(piece) => {
        model.pick(target, piece);
        setOpenId(piece.id);
      }}
      keep={{
        kept: request.keptIds.includes(target.id),
        onToggle: () =>
          void model.run((current) => toggleKeep(current, target.id)),
      }}
      onRemove={
        isRequired(role, request) ? undefined : () => model.remove(target)
      }
      value={strip.value}
      loading={model.styling}
      testID="change-strip"
    />
  );
}
