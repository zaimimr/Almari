import {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  type ReactElement,
} from "react";
import { FlatList, StyleSheet, useWindowDimensions, View } from "react-native";
import type { Piece } from "../../domain/closet";
import { hasBackground } from "../../domain/background";
import type { ClosetSection } from "../../domain/closetFilters";
import { mainColourName } from "../../domain/color";
import { needsDetails } from "../../domain/facts";
import { categoryName, t } from "../../i18n";
import { Symbol, Text, Tile } from "../../ui";
import { gutterFor, theme } from "../../ui/theme";
import { useColors } from "../../ui/useColors";
import { colourLabel } from "../ColourChips";

const columns = 3;
const gap = 2;

type Item =
  | { type: "chips" }
  | { type: "header" }
  | { type: "section"; section: ClosetSection }
  | { type: "row"; key: string; pieces: Piece[] };

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
  const marks = [
    meta,
    hasDot(piece) ? t("piece.needsDetails") : undefined,
    hasBackground(piece) ? t("background.has") : undefined,
  ]
    .filter(Boolean)
    .join(", ");
  return [piece.name, colour ? colourLabel(colour) : "", marks]
    .filter(Boolean)
    .join(", ");
}

const sectionTitle = (section: ClosetSection) =>
  section.id === "samples"
    ? t("closet.samples")
    : t("closet.section", {
        category: categoryName(section.id),
        count: section.pieces.length,
      });

const sectionLabel = (section: ClosetSection) =>
  section.id === "samples"
    ? t("closet.samples")
    : t("closet.sectionLabel", {
        category: categoryName(section.id),
        pieces:
          section.pieces.length === 1
            ? t("common.pieceCountOne")
            : t("common.pieceCountMany", { count: section.pieces.length }),
      });

const Row = memo(function Row({
  pieces,
  side,
  selecting,
  selected,
  clearing,
  onPress,
  onLongPress,
}: {
  pieces: Piece[];
  side: number;
  selecting: boolean;
  selected: string;
  clearing: string;
  onPress: (piece: Piece) => void;
  onLongPress: (piece: Piece) => void;
}) {
  const colors = useColors();
  const chosen = selected.split(",");
  const busy = clearing.split(",");
  return (
    <View style={styles.row}>
      {pieces.map((piece) => {
        const meta = metaOf(piece);
        const isSelected = chosen.includes(piece.id);
        return (
          <View key={piece.id} style={{ width: side }}>
            <View style={meta && !selecting ? styles.away : null}>
              <Tile
                image={piece}
                size="cell"
                dot={hasDot(piece)}
                state={busy.includes(piece.id) ? "preparing" : undefined}
                busyLabel={
                  busy.includes(piece.id) ? t("background.removing") : undefined
                }
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
            {meta ? (
              <View
                style={[styles.moon, { backgroundColor: colors.scrimPill }]}
                pointerEvents="none"
                accessibilityElementsHidden
                importantForAccessibility="no-hide-descendants"
              >
                <Symbol name="moon.zzz" size={13} tone="onMedia" />
              </View>
            ) : null}
            {hasBackground(piece) ? (
              <View
                style={[styles.backdrop, { backgroundColor: colors.scrimPill }]}
                pointerEvents="none"
                accessibilityElementsHidden
                importantForAccessibility="no-hide-descendants"
                testID={`tile-background-${piece.id}`}
              >
                <Symbol name="square.dashed" size={13} tone="onMedia" />
              </View>
            ) : null}
          </View>
        );
      })}
    </View>
  );
});

export function ClosetGrid({
  sections,
  headings,
  selecting,
  selected,
  clearing = [],
  chips,
  header,
  empty,
  onPress,
  onLongPress,
}: {
  sections: ClosetSection[];
  headings: boolean;
  selecting: boolean;
  selected: string[];
  clearing?: string[];
  chips: ReactElement;
  header: ReactElement;
  empty?: ReactElement;
  onPress: (piece: Piece) => void;
  onLongPress: (piece: Piece) => void;
}) {
  const colors = useColors();
  const { width } = useWindowDimensions();
  const gutter = gutterFor(width);
  const side = (width - gap * (columns - 1)) / columns;
  const items = useMemo(() => {
    const list: Item[] = [{ type: "chips" }, { type: "header" }];
    const pieces = (section: ClosetSection) => {
      for (let start = 0; start < section.pieces.length; start += columns) {
        const row = section.pieces.slice(start, start + columns);
        list.push({ type: "row", key: row[0]!.id, pieces: row });
      }
    };
    if (headings)
      for (const section of sections) {
        list.push({ type: "section", section });
        pieces(section);
      }
    else
      pieces({
        id: "samples",
        pieces: sections.flatMap((section) => section.pieces),
      });
    return list;
  }, [sections, headings]);
  const handlers = useRef({ onPress, onLongPress });
  useEffect(() => {
    handlers.current = { onPress, onLongPress };
  });
  const press = useCallback(
    (piece: Piece) => handlers.current.onPress(piece),
    [],
  );
  const longPress = useCallback(
    (piece: Piece) => handlers.current.onLongPress(piece),
    [],
  );

  return (
    <FlatList
      data={items}
      keyExtractor={(item) =>
        item.type === "row"
          ? item.key
          : item.type === "section"
            ? `section-${item.section.id}`
            : item.type
      }
      style={{ marginHorizontal: -gutter }}
      contentInsetAdjustmentBehavior="automatic"
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      automaticallyAdjustKeyboardInsets={false}
      contentContainerStyle={styles.content}
      ListFooterComponent={
        items.length === 2 && empty ? (
          <View style={{ paddingHorizontal: gutter }}>{empty}</View>
        ) : null
      }
      testID="closet-grid"
      renderItem={({ item }) =>
        item.type === "chips" ? (
          <View
            style={[
              styles.chips,
              { paddingHorizontal: gutter, backgroundColor: colors.canvas },
            ]}
          >
            {chips}
          </View>
        ) : item.type === "header" ? (
          <View style={[styles.header, { paddingHorizontal: gutter }]}>
            {header}
          </View>
        ) : item.type === "section" ? (
          <Text
            role="headline"
            accessibilityRole="header"
            accessibilityLabel={sectionLabel(item.section)}
            style={[styles.section, { paddingHorizontal: gutter }]}
            testID={`section-${item.section.id}`}
          >
            {sectionTitle(item.section)}
          </Text>
        ) : (
          <Row
            pieces={item.pieces}
            side={side}
            selecting={selecting}
            selected={item.pieces
              .filter((piece) => selected.includes(piece.id))
              .map((piece) => piece.id)
              .join(",")}
            clearing={item.pieces
              .filter((piece) => clearing.includes(piece.id))
              .map((piece) => piece.id)
              .join(",")}
            onPress={press}
            onLongPress={longPress}
          />
        )
      }
    />
  );
}

const styles = StyleSheet.create({
  chips: { paddingVertical: theme.space.sm },
  header: { gap: theme.space.lg, paddingBottom: theme.space.lg },
  content: { gap, paddingBottom: theme.space.footerInset },
  section: { paddingTop: theme.space.md, paddingBottom: theme.space.sm },
  row: { flexDirection: "row", gap },
  away: { opacity: 0.5 },
  moon: {
    position: "absolute",
    right: theme.space.sm,
    bottom: theme.space.sm,
    padding: theme.space.xs,
    borderRadius: theme.radius.full,
  },
  backdrop: {
    position: "absolute",
    left: theme.space.sm,
    bottom: theme.space.sm,
    padding: theme.space.xs,
    borderRadius: theme.radius.full,
  },
});
