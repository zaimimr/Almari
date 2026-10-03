import { StyleSheet, View } from "react-native";
import { locale, t } from "../i18n";
import { Text } from "./Text";
import { theme } from "./theme";
import { useColors } from "./useColors";
import { useLargeText } from "./useLargeText";

export function Swatches({
  title,
  colours,
  testID,
}: {
  title: string;
  colours: { hex: string; name: string }[];
  testID?: string;
}) {
  const colors = useColors();
  const { large, ax, symbolScale } = useLargeText();
  const named = large || colors.line !== theme.colors.line;
  const size = theme.size.swatchLarge * symbolScale;
  const names = colours
    .map(({ name }) => name.toLocaleLowerCase(locale))
    .join(", ");

  return (
    <View
      accessible
      accessibilityLabel={t("colours.paletteLabel", { label: title, names })}
      accessibilityIgnoresInvertColors
      testID={testID}
      style={ax ? styles.list : styles.row}
    >
      {colours.map(({ hex, name }) => (
        <View
          key={`${hex}${name}`}
          style={
            ax ? styles.line : named && [styles.column, { minWidth: size }]
          }
        >
          <View
            style={[
              styles.swatch,
              {
                width: size,
                height: size,
                borderRadius: size / 2,
                backgroundColor: hex,
                borderColor: colors.lineField,
              },
            ]}
          />
          {ax ? (
            <Text role="body" style={styles.name}>
              {name}
            </Text>
          ) : named ? (
            <Text role="footnote" tone="muted" style={styles.center}>
              {name}
            </Text>
          ) : null}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", flexWrap: "wrap", gap: theme.space.md },
  list: { gap: theme.space.md },
  line: { flexDirection: "row", alignItems: "center", gap: theme.space.lg },
  column: { alignItems: "center", gap: theme.space.xs },
  swatch: { borderWidth: 1 },
  name: { flexShrink: 1 },
  center: { textAlign: "center" },
});
