import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import type { Piece } from "../domain/closet";
import { arrangePieces } from "./flatLayLayout";
import { photoSource } from "./photos";
import sampleFrames from "./sample-frames.json";
import { theme } from "./theme";
import { t } from "../i18n";

export function OutfitCollage({
  pieces,
  fill = false,
  testID,
  keptIds = [],
  onPiecePress,
}: {
  pieces: Piece[];
  fill?: boolean;
  testID?: string;
  keptIds?: string[];
  onPiecePress?: (piece: Piece) => void;
}) {
  const [size, setSize] = useState(0);
  return (
    <View
      testID={testID}
      style={[styles.viewport, fill ? styles.fill : styles.square]}
      onLayout={({ nativeEvent }) => {
        setSize(Math.min(nativeEvent.layout.width, nativeEvent.layout.height));
      }}
    >
      {pieces.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>{t("collage.emptyTitle")}</Text>
          <Text style={styles.emptyCopy}>{t("collage.emptyBody")}</Text>
        </View>
      ) : (
        <View style={{ width: size, height: size }}>
          {arrangePieces(pieces).map(
            ({ piece, x, y, width, height, depth }) => {
              const frame =
                piece.frame ??
                sampleFrames[piece.photo as keyof typeof sampleFrames];
              const slotWidth = width * size;
              const slotHeight = height * size;
              const scale = frame
                ? Math.min(slotWidth / frame.width, slotHeight / frame.height)
                : 0;
              const imageWidth = frame ? frame.width * scale : slotWidth;
              const imageHeight = frame ? frame.height * scale : slotHeight;
              return (
                <Pressable
                  key={piece.id}
                  testID={`outfit-piece-${piece.id}`}
                  disabled={!onPiecePress}
                  accessible={Boolean(onPiecePress)}
                  accessibilityRole={onPiecePress ? "button" : undefined}
                  accessibilityLabel={onPiecePress ? piece.name : undefined}
                  onPress={() => onPiecePress?.(piece)}
                  style={[
                    styles.piece,
                    {
                      left: x * size + (slotWidth - imageWidth) / 2,
                      top: y * size + (slotHeight - imageHeight) / 2,
                      width: imageWidth,
                      height: imageHeight,
                      zIndex: depth,
                    },
                  ]}
                >
                  <Image
                    source={photoSource(piece.photo)}
                    accessible
                    accessibilityLabel={
                      keptIds.includes(piece.id)
                        ? t("outfit.keptLabel", { name: piece.name })
                        : piece.name
                    }
                    contentFit={frame ? "fill" : "contain"}
                    style={
                      frame
                        ? {
                            position: "absolute",
                            left: -frame.x * scale,
                            top: -frame.y * scale,
                            width: scale,
                            height: scale,
                          }
                        : StyleSheet.absoluteFill
                    }
                  />
                  {keptIds.includes(piece.id) ? (
                    <View style={styles.kept}>
                      <Text
                        style={styles.keptLabel}
                        numberOfLines={1}
                        maxFontSizeMultiplier={1.3}
                      >
                        Kept
                      </Text>
                    </View>
                  ) : null}
                </Pressable>
              );
            },
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  viewport: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.canvas,
    overflow: "hidden",
  },
  square: { aspectRatio: 1 },
  fill: { flex: 1, minHeight: 0 },
  piece: { position: "absolute", overflow: "hidden" },
  kept: {
    position: "absolute",
    top: 2,
    left: 2,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: theme.radius.print,
    backgroundColor: theme.colors.plum,
  },
  keptLabel: {
    ...theme.type.footnote,
    fontSize: 11,
    lineHeight: 15,
    color: theme.colors.onPlum,
    fontWeight: "600",
  },
  empty: { padding: 24, maxWidth: 340, gap: 16 },
  emptyTitle: {
    ...theme.type.title,
    color: theme.colors.ink,
    textAlign: "center",
  },
  emptyCopy: {
    ...theme.type.body,
    color: theme.colors.inkMuted,
    textAlign: "center",
  },
});
