import {
  engineChoices,
  engineName,
  setEngine,
} from "../../src/domain/scoring/engine";
import { t } from "../../src/i18n";
import { useCloset } from "../../src/state/closet";
import { Row, Rows, Screen, Section, Text } from "../../src/ui";

export default function Stylist() {
  const { closet, update } = useCloset();
  const engine = closet.styling.engine;

  return (
    <Screen title={t("stylist.label")} leading="back" testID="stylist">
      <Section title={t("stylist.label")}>
        <Rows>
          {engineChoices.map((choice) => (
            <Row
              key={choice}
              title={engineName(choice)}
              trailing={engine === choice ? "selected" : undefined}
              onPress={() =>
                void update((current) => setEngine(current, choice))
              }
              testID={`stylist-${choice}`}
            />
          ))}
        </Rows>
      </Section>
      <Text role="footnote" tone="muted">
        {t("stylist.help")}
      </Text>
    </Screen>
  );
}
