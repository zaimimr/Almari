import type { Occasion } from "../../domain/taxonomy";
import { occasionName, t } from "../../i18n";
import { ChipRow } from "../../ui";
import { intents, type TodayModel } from "./useToday";

export function IntentRow({ model }: { model: TodayModel }) {
  const { request } = model;
  if (!request) return null;
  const ids: Occasion[] = (intents as readonly Occasion[]).includes(
    request.occasion,
  )
    ? [...intents]
    : [...intents, request.occasion];
  return (
    <ChipRow
      options={ids.map((id) => ({
        id,
        label: id === "party" ? t("today.intent.party") : occasionName(id),
      }))}
      value={request.occasion}
      onChange={(next) => {
        if (typeof next === "string") model.intent(next);
      }}
      layout="scroll"
      keepScroll
      reselect
      testID="today-intent"
    />
  );
}
