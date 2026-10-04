import { StyleSheet, View } from "react-native";
import { bodyShapes, type BodyShape } from "../../domain/closet";
import { t } from "../../i18n";
import { Text, Tile } from "../../ui";
import { theme } from "../../ui/theme";
import { useColors } from "../../ui/useColors";
import { useLargeText } from "../../ui/useLargeText";

const drawings = {
  pear: require("../../../assets/shapes/pear.png"),
  apple: require("../../../assets/shapes/apple.png"),
  hourglass: require("../../../assets/shapes/hourglass.png"),
  rectangle: require("../../../assets/shapes/rectangle.png"),
  "inverted-triangle": require("../../../assets/shapes/inverted-triangle.png"),
  athletic: require("../../../assets/shapes/athletic.png"),
} satisfies Record<BodyShape, unknown>;

export function BodyShapes({
  value,
  onChange,
}: {
  value: BodyShape | null;
  onChange: (value: BodyShape) => void;
}) {
  const colors = useColors();
  const { ax } = useLargeText();
  return (
    <View style={styles.group} accessibilityRole="radiogroup">
      <Text role="headline">{t("onboarding.shape.question")}</Text>
      <View style={styles.grid}>
        {bodyShapes.map((shape) => (
          <View key={shape} style={ax ? styles.full : styles.third}>
            <Tile
              image={drawings[shape]}
              size="grid"
              label={t(`shape.${shape}`)}
              selected={value === shape}
              tint={value === shape ? colors.plum : colors.inkMuted}
              accessibilityLabel={t(`shape.${shape}`)}
              onPress={() => onChange(shape)}
              testID={`shape-${shape}`}
            />
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  group: { gap: theme.space.md },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: theme.space.md },
  third: { width: "30%", flexGrow: 1 },
  full: { width: "100%" },
});
