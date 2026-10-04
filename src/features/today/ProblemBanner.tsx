import { router } from "expo-router";
import type { ButtonProps } from "../../ui";
import type { Problem, ProblemAction } from "../../domain/styling";
import { clockFor, setWardrobe, startOver } from "../../domain/today";
import { styleName, t } from "../../i18n";
import { now } from "../../state/clock";
import { addPiecesRoute } from "../../state/imports";
import { Banner } from "../../ui";
import type { TodayModel } from "./useToday";

export function ProblemBanner({
  model,
  problem,
}: {
  model: TodayModel;
  problem: Problem;
}) {
  const { closet, request, setOpen } = model;
  if (!request) return null;
  const nameOf = (id: string) =>
    closet.pieces.find((piece) => piece.id === id)?.name ?? "";

  const act = (action: ProblemAction) => {
    switch (action.type) {
      case "release":
        return void model.change({
          keptIds: request.keptIds.filter((id) => id !== action.id),
        });
      case "clear-type":
        return void model.change({ garmentType: null });
      case "set-style":
        return void model.change({ style: action.style });
      case "clear-weather":
        return void model.change({ weather: { source: "unknown" } });
      case "clear-excluded":
        return void model.change({ excludedIds: [] });
      case "choose-pieces":
        return router.push("/today/pieces");
      case "add-pieces":
        return router.push(addPiecesRoute);
      case "use-samples":
        return void model.restyle(
          (current) => setWardrobe(current, "sample", clockFor(now())),
          null,
        );
      case "check-piece":
        return setOpen({ kind: "check" });
      case "edit-piece":
        return router.push({
          pathname: "/piece/[id]",
          params: { id: action.id },
        });
    }
  };

  const label = (action: ProblemAction) => {
    switch (action.type) {
      case "release":
        return t("today.stopKeeping", { name: nameOf(action.id) });
      case "clear-type":
        return t("today.anyType");
      case "set-style":
        return t("today.switchTo", { style: styleName(action.style) });
      case "clear-weather":
        return t("today.clearWeather");
      case "clear-excluded":
        return t("today.includeSetAside");
      case "choose-pieces":
        return t("today.startWithPiece");
      case "add-pieces":
        return t("closet.addPieces");
      case "use-samples":
        return t("sample.try");
      case "check-piece":
        return t("today.answerQuestion");
      case "edit-piece":
        return t("today.openPiece", { name: nameOf(action.id) });
    }
  };

  const buttons: ButtonProps[] = problem.actions.slice(0, 2).map((action) => ({
    label: label(action),
    onPress: () => act(action),
    disabled: model.busy,
  }));

  return (
    <Banner
      tone="notice"
      text={problem.message}
      actions={
        buttons.length === 2
          ? [buttons[0]!, buttons[1]!]
          : buttons.length === 1
            ? [buttons[0]!]
            : undefined
      }
      testID="today-problem"
    />
  );
}

export function StaleBanner({ model }: { model: TodayModel }) {
  const lost = model.lostPieces > 0;
  return (
    <Banner
      tone="notice"
      text={
        lost
          ? t("today.pieceUnavailable")
          : t("today.noLongerFits", {
              problems: model.broken.map((item) => item.message).join(" "),
            })
      }
      actions={[
        {
          label: t("today.findNew"),
          onPress: () => void model.restyle(startOver, null),
          busy: model.styling,
        },
      ]}
      testID="today-stale"
    />
  );
}
