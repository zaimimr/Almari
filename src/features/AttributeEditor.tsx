import { StyleSheet, View } from "react-native";
import {
  applicableAttributes,
  optionsFor,
  type AttributeKey,
  type AttributeValue,
  type Described,
} from "../domain/attributes";
import { attributeLabelKey, attributeValueKey } from "../domain/facts";
import { t } from "../i18n";
import { AppText, Button, Chip } from "../ui";
import { theme } from "../ui/theme";

export function AttributeEditor({
  piece,
  disabled,
  onConfirm,
}: {
  piece: Described;
  disabled?: boolean;
  onConfirm: (key: AttributeKey, value: AttributeValue) => void;
}) {
  const pattern = piece.attributes?.pattern;
  const keys = applicableAttributes(piece.category, piece.kind).filter(
    (key) => key !== "scale" || (pattern !== undefined && pattern !== "solid"),
  );
  return (
    <View style={styles.section}>
      <View style={styles.intro}>
        <AppText style={styles.label}>{t("editor.details")}</AppText>
        <AppText variant="caption" muted>
          {t("editor.detailsHint")}
        </AppText>
      </View>
      {keys.map((key) => {
        const value = piece.attributes?.[key];
        const source =
          value === undefined ? null : (piece.sources?.[key] ?? "confirmed");
        const name = t(attributeLabelKey(key));
        return (
          <View key={key} style={styles.attribute} testID={`attribute-${key}`}>
            <View>
              <AppText style={styles.label}>{name}</AppText>
              <AppText
                variant="caption"
                muted
                testID={`attribute-${key}-source`}
              >
                {source ? t(`source.${source}`) : t("source.none")}
              </AppText>
            </View>
            <View style={styles.chips}>
              {optionsFor(key).map((option) => {
                const label = t(attributeValueKey(key, option.id));
                return (
                  <Chip
                    key={String(option.id)}
                    label={label}
                    accessibilityLabel={`${name}: ${label}`}
                    selected={option.id === value}
                    disabled={disabled}
                    onPress={() => onConfirm(key, option.id)}
                  />
                );
              })}
            </View>
            {source === "proposed" && value !== undefined ? (
              <Button
                label={t("fact.looksRight")}
                secondary
                compact
                disabled={disabled}
                onPress={() => onConfirm(key, value)}
              />
            ) : null}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: theme.space.xl },
  intro: { gap: theme.space.xs },
  attribute: { gap: theme.space.md },
  label: { fontWeight: "600" },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: theme.space.sm },
});
