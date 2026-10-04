import { StyleSheet, View } from "react-native";
import Animated, {
  FadeIn,
  FadeOut,
  ReduceMotion,
} from "react-native-reanimated";
import type { Piece } from "../../domain/closet";
import type { ClosetSection } from "../../domain/closetFilters";
import { mainColourName } from "../../domain/color";
import { needsDetails } from "../../domain/facts";
import { categoryName, t } from "../../i18n";
import { Section, Tile } from "../../ui";
import { motion } from "../../ui/motion";
import { theme } from "../../ui/theme";
import { useLargeText } from "../../ui/useLargeText";
import { colourLabel } from "../ColourChips";

const crossfade = {
  entering: FadeIn.duration(motion.duration.base)
    .easing(motion.easing.silk)
    .reduceMotion(ReduceMotion.Never),
  exiting: FadeOut.duration(motion.duration.base)
    .easing(motion.easing.silk)
    .reduceMotion(ReduceMotion.Never),
};

const metaOf = (piece: Piece) =>
  piece.status === "away"
    ? piece.away
      ? t(`piece.away.${piece.away}`)
      : t("closet.unavailable")
    : undefined;

const hasDot = (piece: Piece) =>
  piece.source === "owned" && needsDetails(piece).length > 0;

function tileLabel(piece: Piece, meta: string | undefined) {
  const colour = mainColourName(piece.colors);
  const marks = [meta, hasDot(piece) ? t("piece.needsDetails") : undefined]
    .filter(Boolean)
    .join(", ");
  return [piece.name, colour ? colourLabel(colour) : "", marks]
    .filter(Boolean)
    .join(", ");
}

export function ClosetGrid({
  sections,
  selecting,
  selected,
  onPress,
  onLongPress,
}: {
  sections: ClosetSection[];
  selecting: boolean;
  selected: string[];
  onPress: (piece: Piece) => void;
  onLongPress: (piece: Piece) => void;
}) {
  const { ax } = useLargeText();
  const columns = ax ? 1 : 2;

  return (
    <Animated.View
      entering={crossfade.entering}
      exiting={crossfade.exiting}
      style={styles.sections}
      testID="closet-grid"
    >
      {sections.map((section) => {
        const rows = Array.from(
          { length: Math.ceil(section.pieces.length / columns) },
          (_, index) =>
            section.pieces.slice(index * columns, (index + 1) * columns),
        );
        return (
          <Section
            key={section.id}
            title={
              section.id === "samples"
                ? t("closet.samples")
                : categoryName(section.id)
            }
            count={section.pieces.length}
            testID={`section-${section.id}`}
          >
            <View style={styles.grid}>
              {rows.map((row) => (
                <View key={row[0]!.id} style={styles.row}>
                  {Array.from({ length: columns }, (_, index) => {
                    const piece = row[index];
                    if (!piece) return <View key={index} style={styles.cell} />;
                    const meta = metaOf(piece);
                    const isSelected = selected.includes(piece.id);
                    return (
                      <Tile
                        key={piece.id}
                        image={piece}
                        label={piece.name}
                        meta={meta}
                        size="grid"
                        dot={hasDot(piece)}
                        selected={selecting && isSelected}
                        selectedLabel={
                          selecting && !isSelected
                            ? t("common.notSelected")
                            : undefined
                        }
                        onPress={() => onPress(piece)}
                        onLongPress={() => onLongPress(piece)}
                        accessibilityLabel={tileLabel(piece, meta)}
                        testID={`tile-${piece.id}`}
                      />
                    );
                  })}
                </View>
              ))}
            </View>
          </Section>
        );
      })}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  sections: { gap: theme.space.xl },
  grid: { gap: theme.space.md },
  row: { flexDirection: "row", gap: theme.space.md },
  cell: { flex: 1 },
});
