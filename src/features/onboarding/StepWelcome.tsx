import { t } from "../../i18n";
import { EmptyState } from "../../ui";

export function StepWelcome({
  onStart,
  onSkip,
  busy,
}: {
  onStart: () => void;
  onSkip: () => void;
  busy: boolean;
}) {
  return (
    <EmptyState
      mark
      title={t("onboarding.welcome.title")}
      action={{
        label: t("onboarding.welcome.start"),
        onPress: onStart,
        disabled: busy,
        testID: "welcome-start",
      }}
      secondary={{
        label: t("onboarding.welcome.skip"),
        onPress: onSkip,
        busy,
        testID: "welcome-skip",
      }}
      testID="onboarding-welcome"
    />
  );
}
