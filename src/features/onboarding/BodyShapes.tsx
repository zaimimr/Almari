import type { BodyShape } from "../../domain/closet";
import { t } from "../../i18n";
import { ChoiceCardGroup } from "../../ui";
import { shapeOptions } from "./illustrations";

export function BodyShapes({
  value,
  onChange,
}: {
  value: BodyShape | null;
  onChange: (value: BodyShape) => void;
}) {
  return (
    <ChoiceCardGroup<BodyShape>
      label={t("onboarding.shape.question")}
      options={shapeOptions()}
      columns={3}
      value={value}
      onChange={(next) => {
        if (typeof next === "string") onChange(next);
      }}
      testID="shape"
    />
  );
}
