import type { PropsWithChildren } from "react";
import {
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { Image } from "expo-image";
import type { CardLayout, Piece } from "../domain/closet";
import { flatLay, type Check } from "../domain/outfitView";
import { t } from "../i18n";
import { photoSource } from "./photos";
import { theme } from "./theme";

function Tile({
  piece,
  kept,
  style,
}: {
  piece: Piece;
  kept: boolean;
  style: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[styles.tile, style]} testID={`outfit-piece-${piece.id}`}>
      <Image
        source={photoSource(piece.photo)}
        accessible
        accessibilityLabel={
          kept ? t("outfit.keptLabel", { name: piece.name }) : piece.name
        }
        contentFit="contain"
        recyclingKey={piece.id}
        style={StyleSheet.absoluteFill}
      />
      {kept ? (
        <View style={styles.kept}>
          <Text
            style={styles.keptLabel}
            numberOfLines={1}
            maxFontSizeMultiplier={1.3}
          >
            {t("outfit.kept")}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

export function OutfitView({
  pieces,
  name,
  reasons,
  checks,
  tip,
  layout,
  keptIds = [],
  testID,
  children,
}: PropsWithChildren<{
  pieces: Piece[];
  name: string;
  reasons: string[];
  checks: Check[];
  tip: string | null;
  layout: CardLayout;
  keptIds?: string[];
  testID?: string;
}>) {
  const lay = flatLay(pieces);
  const kept = (piece: Piece) => keptIds.includes(piece.id);
  return (
    <View style={styles.view}>
      <View style={styles.lay} testID={testID}>
        <View style={styles.garments}>
          {lay.large ? (
            <Tile
              piece={lay.large}
              kept={kept(lay.large)}
              style={styles.large}
            />
          ) : null}
          {lay.garments.length ? (
            <View style={styles.row}>
              {lay.garments.map((piece) => (
                <Tile
                  key={piece.id}
                  piece={piece}
                  kept={kept(piece)}
                  style={styles.garment}
                />
              ))}
            </View>
          ) : null}
        </View>
        {lay.column.length ? (
          <View style={styles.column}>
            {lay.column.map((piece) => (
              <Tile
                key={piece.id}
                piece={piece}
                kept={kept(piece)}
                style={styles.small}
              />
            ))}
          </View>
        ) : null}
      </View>
      {name ? (
        <Text style={styles.name} accessibilityRole="header">
          {name}
        </Text>
      ) : null}
      {layout !== "minimal" && reasons.length ? (
        <Text style={styles.body}>{reasons.join(" ")}</Text>
      ) : null}
      {layout === "full" && checks.length ? (
        <View style={styles.checks}>
          {checks.map((check) => (
            <Text
              key={check.id}
              style={[styles.body, check.state !== "ok" && styles.muted]}
            >
              {check.text}
            </Text>
          ))}
        </View>
      ) : null}
      {tip ? <Text style={[styles.caption, styles.muted]}>{tip}</Text> : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  view: { gap: 12 },
  lay: {
    flexDirection: "row",
    gap: 8,
    width: "100%",
    maxWidth: 560,
    alignSelf: "center",
  },
  garments: { flex: 3, gap: 8 },
  column: { flex: 1, gap: 8 },
  row: { flexDirection: "row", gap: 8 },
  tile: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius,
    borderCurve: "continuous",
    overflow: "hidden",
  },
  large: { width: "100%", aspectRatio: 3 / 4 },
  garment: { flex: 1, aspectRatio: 1 },
  small: { width: "100%", aspectRatio: 1 },
  kept: {
    position: "absolute",
    top: 4,
    left: 4,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 8,
    backgroundColor: theme.colors.accent,
  },
  keptLabel: {
    ...theme.typography.caption,
    fontSize: 11,
    lineHeight: 15,
    color: theme.colors.accentText,
    fontWeight: "600",
  },
  name: { ...theme.typography.heading, color: theme.colors.ink },
  body: { ...theme.typography.body, color: theme.colors.ink },
  caption: { ...theme.typography.caption },
  muted: { color: theme.colors.muted },
  checks: { gap: 4 },
});
