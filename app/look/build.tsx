import { useState, type ReactNode } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import type { Piece } from "../../src/domain/closet";
import { roleOf } from "../../src/domain/styling";
import { categories } from "../../src/domain/taxonomy";
import { ChangeStrip, tileLabel } from "../../src/features/ChangeStrip";
import { useBuilder } from "../../src/features/builder/useBuilder";
import { t } from "../../src/i18n";
import { addPiecesRoute } from "../../src/state/imports";
import {
  Button,
  ChipRow,
  FlatLay,
  Footer,
  Row,
  Rows,
  Screen,
  Text,
  Tile,
} from "../../src/ui";
import { theme } from "../../src/ui/theme";
import { useColors } from "../../src/ui/useColors";
import { useLargeText } from "../../src/ui/useLargeText";

export default function BuildLook() {
  const params = useLocalSearchParams<{ id?: string }>();
  const builder = useBuilder(params);
  const colors = useColors();
  const { ax } = useLargeText();
  const [room, setRoom] = useState(0);
  const title = t("build.edit");

  if (builder.gone)
    return <Screen title={title} gone={{ title: t("look.goneTitle") }} />;

  const hasPieces = builder.closet.pieces.length > 0;
  const shown = new Set(builder.closet.pieces.map((piece) => piece.category));
  const swapPiece =
    builder.mode.kind === "swap"
      ? builder.pieces.find(
          (piece) =>
            builder.mode.kind === "swap" && piece.id === builder.mode.pieceId,
        )
      : undefined;

  const pick = (piece: Piece) => {
    if (!builder.filling) builder.toggle(piece);
  };

  const picker = (
    <View style={styles.region}>
      <ChipRow
        layout={ax ? "wrap" : "scroll"}
        options={[
          { id: "all", label: t("closet.all") },
          ...categories
            .filter((category) => shown.has(category.id))
            .map((category) => ({ id: category.id, label: category.label })),
        ]}
        value={builder.category}
        onChange={(next) => {
          if (typeof next === "string") builder.setCategory(next);
        }}
        testID="build-categories"
      />
      {ax ? (
        <Rows>
          {builder.strip.map((piece, index) => (
            <Row
              key={piece.id}
              title={piece.name}
              leading={{ thumb: piece }}
              trailing={
                builder.selected.includes(piece.id) ? "selected" : undefined
              }
              checked={builder.selected.includes(piece.id)}
              onPress={() => pick(piece)}
              last={index === builder.strip.length - 1}
              testID={`build-piece-${piece.id}`}
            />
          ))}
        </Rows>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.scroller}
          contentContainerStyle={styles.tiles}
          testID="outfit-piece-picker"
        >
          {builder.strip.map((piece) => (
            <View key={piece.id} style={styles.tile}>
              <Tile
                image={piece}
                size="strip"
                label={piece.name}
                selected={builder.selected.includes(piece.id)}
                accessibilityLabel={tileLabel(piece)}
                selectedLabel={t("tile.selected")}
                onPress={() => pick(piece)}
                testID={`build-piece-${piece.id}`}
              />
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );

  const swapBody = swapPiece ? (
    <ChangeStrip
      role={roleOf(swapPiece)}
      pieceId={swapPiece.id}
      currentId={swapPiece.id}
      alternatives={builder.alternatives(swapPiece.id)}
      open
      onClose={() => builder.setMode({ kind: "picker" })}
      onPick={(piece) => builder.swapTo(swapPiece.id, piece)}
      testID="build-change-strip"
    >
      {builder.undo ? (
        <View style={styles.undo}>
          <Button
            label={t("common.undo")}
            variant="quiet"
            size="small"
            onPress={builder.undoSwap}
          />
        </View>
      ) : null}
    </ChangeStrip>
  ) : null;

  const region: ReactNode = !hasPieces ? (
    <View style={styles.region}>
      <View style={styles.start}>
        <Button
          label={t("closet.addPieces")}
          variant="secondary"
          size="small"
          onPress={() => router.push(addPiecesRoute)}
        />
      </View>
    </View>
  ) : swapBody ? (
    swapBody
  ) : (
    picker
  );

  const hint = builder.same
    ? t("looks.sameAs", { name: builder.same.name })
    : builder.pieces.length && builder.empty.includes("shoes")
      ? t("build.slotEmpty", { role: t("role.one.shoes") })
      : null;

  const status = (
    <View style={styles.status}>
      {hasPieces && builder.empty.length ? (
        <Button
          label={t("build.fill")}
          variant="quiet"
          size="small"
          busy={builder.filling}
          busyLabel={t("build.filling")}
          disabled={builder.saving}
          onPress={builder.fill}
          testID="build-fill"
        />
      ) : null}
      {builder.line ? (
        <Text
          role="footnote"
          tone={builder.line.error ? "error" : "ink"}
          style={styles.line}
          testID="build-line"
        >
          {builder.line.text}
        </Text>
      ) : hint ? (
        <Text
          role="footnote"
          tone="muted"
          style={styles.line}
          testID="build-hint"
        >
          {hint}
        </Text>
      ) : null}
    </View>
  );

  const collage = (
    <View style={styles.upper}>
      <View style={styles.titleLine}>
        <Text
          role="title"
          accessibilityRole="header"
          style={styles.name}
          numberOfLines={2}
          accessibilityElementsHidden={!builder.name}
          testID="build-name"
        >
          {builder.name}
        </Text>
      </View>
      <FlatLay
        pieces={builder.pieces}
        size="hero"
        maxSize={ax ? 240 : room > 0 ? room - 64 : undefined}
        emptyRoles={builder.empty}
        state={builder.filling ? "arranging" : undefined}
        openId={swapPiece?.id ?? null}
        onPiecePress={(piece) =>
          builder.setMode(
            swapPiece?.id === piece.id
              ? { kind: "picker" }
              : { kind: "swap", pieceId: piece.id },
          )
        }
        testID="build-collage"
      />
    </View>
  );

  return (
    <Screen
      title={title}
      leading="cancel"
      onCancel={() => router.back()}
      scroll={false}
      testID="build-look"
      footer={
        <Footer
          primary={{
            label: t("common.saveChanges"),
            onPress: () => void builder.save(),
            disabled:
              !builder.selected.length ||
              builder.filling ||
              !builder.dirty ||
              !!builder.same,
            busy: builder.saving,
            testID: "build-save",
          }}
        />
      }
    >
      {ax ? (
        <ScrollView
          style={styles.fill}
          contentContainerStyle={styles.column}
          keyboardShouldPersistTaps="handled"
        >
          {collage}
          {status}
          {region}
        </ScrollView>
      ) : (
        <View style={styles.fill}>
          <ScrollView
            style={styles.fill}
            contentContainerStyle={styles.column}
            onLayout={(event) => setRoom(event.nativeEvent.layout.height)}
          >
            {collage}
          </ScrollView>
          <View style={[styles.hair, { backgroundColor: colors.line }]} />
          {status}
          <View style={styles.dock}>{region}</View>
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  column: { paddingTop: theme.space.sm, gap: theme.space.md },
  upper: { gap: theme.space.md },
  titleLine: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: theme.space.sm,
  },
  name: { flexShrink: 1 },
  hair: { height: StyleSheet.hairlineWidth },
  status: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    columnGap: theme.space.md,
    minHeight: theme.size.touch,
  },
  line: { flexShrink: 1 },
  dock: { minHeight: 304 },
  region: { gap: theme.space.md, paddingBottom: theme.space.md },
  scroller: { marginRight: -theme.space.lg },
  tiles: { flexDirection: "row", gap: theme.space.md },
  tile: { width: 112 },
  start: { alignItems: "flex-start" },
  undo: { alignItems: "flex-start", minHeight: theme.size.touch },
});
