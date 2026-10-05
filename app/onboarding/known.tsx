import { KnownColours } from "../../src/features/selfie/KnownColours";
import { useKnownColours } from "../../src/features/selfie/useKnownColours";
import { t } from "../../src/i18n";
import { Footer, Screen } from "../../src/ui";

export default function Known() {
  const known = useKnownColours();
  return (
    <Screen
      title={t("colours.known.title")}
      footer={
        <Footer
          primary={{
            label: t("colours.save"),
            onPress: known.save,
            busy: known.saving,
            disabled: !known.season,
            testID: "known-save",
          }}
          error={known.error}
        />
      }
    >
      <KnownColours known={known} />
    </Screen>
  );
}
