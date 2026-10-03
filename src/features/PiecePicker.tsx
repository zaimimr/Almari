import { useEffect, useRef, useState } from "react";
import { AccessibilityInfo, StyleSheet, View } from "react-native";
import Animated, {
  FadeIn,
  FadeOut,
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";
import { mainColourName } from "../domain/color";
import type { Category, Piece } from "../domain/closet";
import type { Role } from "../domain/styling";
import { categories } from "../domain/taxonomy";
import { categoryName, t } from "../i18n";
import { Button, ChipRow, EmptyState, FlatLay, Text, Tile } from "../ui";
import { motion, timing, useReduceMotion } from "../ui/motion";
import { theme } from "../ui/theme";
import { useLargeText } from "../ui/useLargeText";
import { colourLabel } from "./ColourChips";

export type PiecePickerProps = {
  pieces: Piece[];
  selectedIds: string[];
  onToggle: (id: string) => void;
  onClear?: () => void;
  preview?: boolean;
  emptyRoles?: Role[];
  columns?: 2 | 3;
  onAddPieces: () => void;
  testID?: string;
  countTestID?: string;
};

const hidden = {
  accessibilityElementsHidden: true,
  importantForAccessibility: "no-hide-descendants",
} as const;

const crossfade = {
  entering: FadeIn.duration(motion.duration.base)
    .easing(motion.easing.silk)
    .reduceMotion(ReduceMotion.Never),
  exiting: FadeOut.duration(motion.duration.base)
    .easing(motion.easing.silk)
    .reduceMotion(ReduceMotion.Never),
};

function tileLabel(piece: Piece) {
  const colour = mainColourName(piece.colors);
  return colour
    ? t("tile.label", {
        name: piece.name,
        colour: colourLabel(colour),
        marks: "",
      }).replace(/, $/, "")
    : piece.name;
}

export function PiecePicker({
  pieces,
  selectedIds,
  onToggle,
  onClear,
  preview = false,
  emptyRoles,
  columns = 2,
  onAddPieces,
  testID,
  countTestID,
}: PiecePickerProps) {
  const { large, ax } = useLargeText();
  const reduce = useReduceMotion();
  const [category, setCategory] = useState<Category | "all">("all");
  const first = useRef<View>(null);
  const chosen = selectedIds.flatMap((id) => {
    const piece = pieces.find((item) => item.id === id);
    return piece ? [piece] : [];
  });
  const some = chosen.length > 0;
  const shown = useSharedValue(some ? 1 : 0);

  useEffect(() => {
    shown.set(
      reduce
        ? timing(some ? 1 : 0, "base", "silk")
        : timing(some ? 1 : 0, "quick", some ? "silk" : "release"),
    );
  }, [some, reduce, shown]);
  const reveal = useAnimatedStyle(() => ({ opacity: shown.get() }));

  if (!pieces.length)
    return (
      <EmptyState
        title={t("pieces.none")}
        action={{ label: t("closet.addPieces"), onPress: onAddPieces }}
        testID={testID}
      />
    );

  const offered = categories.filter(({ id }) =>
    pieces.some((piece) => piece.category === id),
  );
  const visible = pieces.filter(
    (piece) => category === "all" || piece.category === category,
  );
  const count = ax ? 1 : columns;
  const rows = Array.from(
    { length: Math.ceil(visible.length / count) },
    (_, index) => visible.slice(index * count, (index + 1) * count),
  );

  return (
    <View style={styles.picker} testID={testID}>
      {preview ? (
        <FlatLay pieces={chosen} size="hero" preview emptyRoles={emptyRoles} />
      ) : null}
      <Animated.View
        style={[styles.line, large && styles.stacked, reveal]}
        pointerEvents={some ? "auto" : "none"}
        {...(some ? null : hidden)}
      >
        <Text role="subhead" testID={countTestID}>
          {chosen.length === 1
            ? t("common.selectedOne")
            : t("common.selectedMany", { count: chosen.length })}
        </Text>
        {onClear ? (
          <Button
            variant="quiet"
            size="small"
            label={t("pieces.clear")}
            onPress={() => {
              onClear();
              if (first.current)
                AccessibilityInfo.sendAccessibilityEvent(
                  first.current,
                  "focus",
                );
            }}
          />
        ) : null}
      </Animated.View>
      <ChipRow
        layout="scroll"
        options={[
          { id: "all" as const, label: t("closet.all") },
          ...offered.map(({ id }) => ({ id, label: categoryName(id) })),
        ]}
        value={category}
        onChange={(next) => {
          if (typeof next === "string") setCategory(next);
        }}
      />
      {visible.length ? (
        <Animated.View
          key={category}
          entering={crossfade.entering}
          exiting={crossfade.exiting}
          style={styles.grid}
        >
          {rows.map((row) => (
            <View key={row[0]!.id} style={styles.row}>
              {Array.from({ length: count }, (_, index) => {
                const piece = row[index];
                return piece ? (
                  <Tile
                    key={piece.id}
                    ref={piece === visible[0] ? first : undefined}
                    image={piece}
                    label={piece.name}
                    size="grid"
                    selected={selectedIds.includes(piece.id)}
                    onPress={() => onToggle(piece.id)}
                    accessibilityLabel={tileLabel(piece)}
                    testID={testID ? `${testID}-${piece.id}` : undefined}
                  />
                ) : (
                  <View key={index} style={styles.cell} />
                );
              })}
            </View>
          ))}
        </Animated.View>
      ) : (
        <Animated.View
          key="empty"
          entering={crossfade.entering}
          exiting={crossfade.exiting}
        >
          <EmptyState
            title={t("closet.noneFoundTitle")}
            secondary={{
              label: t("common.showAll"),
              onPress: () => setCategory("all"),
            }}
          />
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  picker: { gap: theme.space.lg },
  line: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: theme.space.sm,
  },
  stacked: { flexDirection: "column", alignItems: "flex-start" },
  grid: { gap: theme.space.md },
  row: { flexDirection: "row", gap: theme.space.md },
  cell: { flex: 1 },
});
