import type { ReactNode } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { mainColourName } from "../domain/color";
import type { Piece } from "../domain/closet";
import type { Role } from "../domain/styling";
import { t, type Key } from "../i18n";
import { Button, Chip, Row, Rows, Silk, Symbol, Text, Tile } from "../ui";
import { theme } from "../ui/theme";
import { useColors } from "../ui/useColors";
import { useLargeText } from "../ui/useLargeText";
import { colourLabel } from "./ColourChips";

export type ChangeStripProps = {
  role: Role;
  pieceId: string;
  alternatives: { piece: Piece; reason: string | null; planned?: string }[];
  currentId: string;
  open: boolean;
  onClose: () => void;
  onPick: (piece: Piece) => void;
  keep?: { kept: boolean; onToggle: () => void };
  onRemove?: () => void;
  value?: string;
  onShowAll?: () => void;
  onEditColour?: (piece: Piece) => void;
  onAnotherWithout?: () => void;
  loading?: boolean;
  testID?: string;
  children?: ReactNode;
};

export function tileLabel(piece: Piece) {
  const colour = mainColourName(piece.colors);
  return colour
    ? t("tile.label", {
        name: piece.name,
        colour: colourLabel(colour),
        marks: "",
      }).replace(/, $/, "")
    : piece.name;
}

export function ChangeStrip({
  role,
  alternatives,
  currentId,
  open,
  onClose,
  onPick,
  keep,
  onRemove,
  value,
  onShowAll,
  onEditColour,
  onAnotherWithout,
  loading = false,
  testID,
  children,
}: ChangeStripProps) {
  const colors = useColors();
  const { ax } = useLargeText();
  if (!open) return null;
  const title = t("change.title", { role: t(`role.one.${role}` as Key) });
  const current = alternatives.find((item) => item.piece.id === currentId);
  const others = alternatives.filter((item) => item.piece.id !== currentId);
  const none = others.length === 0;

  const editAction = (piece: Piece) =>
    onEditColour
      ? [
          {
            name: "editColour",
            label: t("change.editColourLabel", { name: piece.name }),
            onPress: () => onEditColour(piece),
          },
        ]
      : undefined;

  return (
    <View testID={testID} style={styles.strip}>
      <View style={[styles.hair, { backgroundColor: colors.line }]} />
      <View style={styles.header}>
        <Pressable
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel={value ? `${title}, ${value}` : title}
          accessibilityState={{ expanded: true }}
          style={styles.title}
          testID={`${testID ?? "change-strip"}-header`}
        >
          <Text role="headline">{title}</Text>
          {value ? (
            <Text role="subhead" tone="muted">
              {value}
            </Text>
          ) : null}
        </Pressable>
        {keep && current ? (
          <Chip
            label={t("today.keep")}
            selected={keep.kept}
            role="checkbox"
            onPress={keep.onToggle}
            accessibilityLabel={t("change.keepLabel", {
              name: current.piece.name,
            })}
            testID="change-keep"
          />
        ) : null}
        {onRemove && current ? (
          <Button
            label={t("common.remove")}
            accessibilityLabel={t("change.removeLabel", {
              name: current.piece.name,
            })}
            variant="quiet"
            size="small"
            onPress={onRemove}
            testID="change-remove"
          />
        ) : null}
        <Pressable
          onPress={onClose}
          accessible={false}
          importantForAccessibility="no-hide-descendants"
          style={styles.chevron}
        >
          <Symbol name="chevron.up" size={theme.size.iconInline} tone="muted" />
        </Pressable>
      </View>
      {loading ? (
        <View style={styles.tiles}>
          {[0, 1, 2].map((index) => (
            <Silk
              key={index}
              kind="placeholder"
              shape="tile"
              label={t("common.loading")}
              style={styles.placeholder}
            />
          ))}
        </View>
      ) : ax ? (
        <Rows>
          {alternatives.map(({ piece, reason, planned }, index) => (
            <Row
              key={piece.id}
              title={piece.name}
              meta={[reason, planned].filter(Boolean).join(" · ") || undefined}
              leading={{ thumb: piece }}
              trailing={piece.id === currentId ? "selected" : undefined}
              radio
              checked={piece.id === currentId}
              onPress={() => {
                if (piece.id !== currentId) onPick(piece);
              }}
              last={index === alternatives.length - 1}
              testID={`strip-piece-${piece.id}`}
            />
          ))}
        </Rows>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.scroller}
          contentContainerStyle={styles.tiles}
        >
          {alternatives.map(({ piece, planned }) => {
            const selected = piece.id === currentId;
            return (
              <View key={piece.id} style={styles.tile}>
                <Tile
                  image={piece}
                  size="strip"
                  label={piece.name}
                  selected={selected}
                  planned={
                    planned ? { short: planned, spoken: planned } : undefined
                  }
                  accessibilityLabel={tileLabel(piece)}
                  selectedLabel={t("tile.selected")}
                  onPress={() => {
                    if (!selected) onPick(piece);
                  }}
                  onLongPress={
                    selected && onEditColour
                      ? () => onEditColour(piece)
                      : undefined
                  }
                  actions={selected ? editAction(piece) : undefined}
                  testID={`strip-piece-${piece.id}`}
                />
              </View>
            );
          })}
        </ScrollView>
      )}
      {!loading && none ? (
        <View style={styles.none}>
          <Text role="subhead" tone="muted">
            {t(role === "hijab" ? "hijabs.noOther" : "change.none")}
          </Text>
          <View style={styles.actions}>
            {onShowAll ? (
              <Button
                label={t("common.showAll")}
                accessibilityLabel={
                  role === "hijab" ? t("hijabs.showAllLabel") : undefined
                }
                variant="quiet"
                size="small"
                onPress={onShowAll}
              />
            ) : null}
            {onAnotherWithout ? (
              <Button
                label={t("change.anotherWithout")}
                variant="quiet"
                size="small"
                onPress={onAnotherWithout}
              />
            ) : null}
          </View>
        </View>
      ) : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  strip: { gap: theme.space.sm },
  hair: { height: StyleSheet.hairlineWidth },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.space.sm,
    minHeight: theme.size.touch,
  },
  title: {
    flex: 1,
    minWidth: 0,
    minHeight: theme.size.touch,
    justifyContent: "center",
  },
  chevron: {
    minWidth: theme.size.touch,
    minHeight: theme.size.touch,
    alignItems: "center",
    justifyContent: "center",
  },
  scroller: { marginRight: -theme.space.lg },
  tiles: { flexDirection: "row", gap: theme.space.md },
  tile: { width: 112 },
  placeholder: { width: 112 },
  none: { gap: theme.space.xs },
  actions: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginLeft: -theme.space.sm,
  },
});
