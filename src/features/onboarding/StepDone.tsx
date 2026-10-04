import { t } from "../../i18n";
import { EmptyState } from "../../ui";

export function StepDone({
  onAddPieces,
  onSample,
  busy,
}: {
  onAddPieces: () => void;
  onSample: () => void;
  busy: "add" | "sample" | null;
}) {
  return (
    <EmptyState
      mark
      title={t("onboarding.done.title")}
      action={{
        label: t("closet.addPieces"),
        onPress: onAddPieces,
        busy: busy === "add",
        disabled: busy === "sample",
        testID: "done-add",
      }}
      secondary={{
        label: t("sample.try"),
        onPress: onSample,
        busy: busy === "sample",
        disabled: busy === "add",
        testID: "done-sample",
      }}
      testID="onboarding-done"
    />
  );
}
