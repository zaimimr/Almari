import { useMemo, type ReactElement } from "react";
import { FlatList, StyleSheet, useWindowDimensions, View } from "react-native";
import type { Piece } from "../../domain/closet";
import type { ClosetSection } from "../../domain/closetFilters";
import { mainColourName } from "../../domain/color";
import { needsDetails } from "../../domain/facts";
import { t } from "../../i18n";
import { Tile } from "../../ui";
import { gutterFor, theme } from "../../ui/theme";
import { colourLabel } from "../ColourChips";

const columns = 3;
const gap = 2;

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
  header,
  empty,
  onPress,
  onLongPress,
}: {
  sections: ClosetSection[];
  selecting: boolean;
  selected: string[];
  header: ReactElement;
  empty?: ReactElement;
  onPress: (piece: Piece) => void;
  onLongPress: (piece: Piece) => void;
}) {
  const { width } = useWindowDimensions();
  const gutter = gutterFor(width);
  const pieces = useMemo(
    () => sections.flatMap((section) => section.pieces),
    [sections],
  );
  const side = (width - gap * (columns - 1)) / columns;

  return (
    <FlatList
      data={pieces}
      keyExtractor={(piece) => piece.id}
      numColumns={columns}
      extraData={selected}
      style={{ marginHorizontal: -gutter }}
      contentInsetAdjustmentBehavior="automatic"
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      automaticallyAdjustKeyboardInsets={false}
      columnWrapperStyle={styles.row}
      contentContainerStyle={styles.content}
      ListHeaderComponent={header}
      ListHeaderComponentStyle={[styles.header, { paddingHorizontal: gutter }]}
      ListEmptyComponent={
        empty ? (
          <View style={{ paddingHorizontal: gutter }}>{empty}</View>
        ) : null
      }
      testID="closet-grid"
      renderItem={({ item: piece }) => {
        const meta = metaOf(piece);
        const isSelected = selected.includes(piece.id);
        return (
          <View style={{ width: side }}>
            <Tile
              image={piece}
              size="cell"
              dot={hasDot(piece)}
              selected={selecting && isSelected}
              selectedLabel={
                selecting && !isSelected ? t("common.notSelected") : undefined
              }
              onPress={() => onPress(piece)}
              onLongPress={() => onLongPress(piece)}
              accessibilityLabel={tileLabel(piece, meta)}
              testID={`tile-${piece.id}`}
            />
          </View>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  header: { gap: theme.space.lg, paddingBottom: theme.space.lg },
  content: {
    gap,
    paddingTop: theme.space.sm,
    paddingBottom: theme.space.footerInset,
  },
  row: { gap },
});
