import { Pressable, StyleSheet, View } from "react-native";
import { Image } from "expo-image";
import { bodyShapes, type BodyShape } from "../domain/closet";
import { t } from "../i18n";
import { AppText, Chip } from "../ui/legacy";
import { theme } from "../ui/theme";

const drawings: Record<BodyShape, number> = {
  pear: require("../../assets/shapes/pear.png"),
  apple: require("../../assets/shapes/apple.png"),
  hourglass: require("../../assets/shapes/hourglass.png"),
  rectangle: require("../../assets/shapes/rectangle.png"),
  "inverted-triangle": require("../../assets/shapes/inverted-triangle.png"),
  athletic: require("../../assets/shapes/athletic.png"),
};

export function BodyShapes({
  value,
  disabled,
  onChange,
}: {
  value: BodyShape | "none" | null;
  disabled: boolean;
  onChange: (value: BodyShape | "none") => void;
}) {
  return (
    <View style={styles.group} accessibilityRole="radiogroup">
      <AppText style={styles.label}>{t("onboarding.shape.question")}</AppText>
      <View style={styles.grid}>
        {bodyShapes.map((shape) => {
          const selected = value === shape;
          return (
            <Pressable
              key={shape}
              accessibilityRole="button"
              accessibilityLabel={t(`shape.${shape}`)}
              accessibilityState={{ selected, disabled }}
              disabled={disabled}
              onPress={() => onChange(shape)}
              style={({ pressed }) => [
                styles.tile,
                selected && styles.selected,
                pressed && styles.pressed,
              ]}
            >
              <Image
                source={drawings[shape]}
                style={styles.drawing}
                contentFit="contain"
                tintColor={selected ? theme.colors.plum : theme.colors.inkMuted}
              />
              <AppText
                variant="footnote"
                style={[styles.name, selected && styles.selectedName]}
              >
                {t(`shape.${shape}`)}
              </AppText>
            </Pressable>
          );
        })}
      </View>
      <View style={styles.none}>
        <Chip
          label={t("shape.none")}
          selected={value === "none"}
          disabled={disabled}
          onPress={() => onChange("none")}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  group: { gap: 12 },
  label: { fontWeight: "600" },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  tile: {
    flexGrow: 1,
    flexBasis: "28%",
    alignItems: "center",
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderRadius: theme.radius.md,
    borderCurve: "continuous",
    borderWidth: 1,
    borderColor: theme.colors.line,
    backgroundColor: theme.colors.canvas,
  },
  selected: {
    borderColor: theme.colors.plum,
    borderWidth: 2,
    backgroundColor: theme.colors.plumSoft,
  },
  pressed: { opacity: 0.7 },
  drawing: { width: 54, height: 90 },
  name: { textAlign: "center", fontWeight: "500" },
  selectedName: { color: theme.colors.plum, fontWeight: "600" },
  none: { flexDirection: "row" },
});
