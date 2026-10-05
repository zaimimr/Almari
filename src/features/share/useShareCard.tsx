import { useRef, useState } from "react";
import { Image } from "expo-image";
import { Share, StyleSheet, View } from "react-native";
import { captureRef } from "react-native-view-shot";
import type { Piece } from "../../domain/closet";
import { FlatLay, Text } from "../../ui";
import { theme } from "../../ui/theme";
import { useColors } from "../../ui/useColors";

const mark = require("../../../assets/brand/mark.png");

export type ShareFormat = "story" | "post";

const frames = {
  story: { width: 360, height: 640, lay: 312, output: [1080, 1920] },
  post: { width: 360, height: 450, lay: 248, output: [1080, 1350] },
} as const;

const hidden = {
  accessibilityElementsHidden: true,
  importantForAccessibility: "no-hide-descendants",
} as const;

export type ShareContent = {
  pieces: Piece[];
  name: string;
  caption?: string | null;
};

export function useShareCard(
  content: ShareContent,
  format: ShareFormat = "story",
) {
  const colors = useColors();
  const ref = useRef<View>(null);
  const [busy, setBusy] = useState(false);
  const frame = frames[format];

  const share = async () => {
    if (busy || !ref.current) return;
    setBusy(true);
    try {
      const url = await captureRef(ref, {
        format: "png",
        width: frame.output[0],
        height: frame.output[1],
        result: "tmpfile",
      });
      await Share.share({ url });
    } catch {
      return;
    } finally {
      setBusy(false);
    }
  };

  const card = (
    <View pointerEvents="none" style={styles.away} {...hidden}>
      <View
        ref={ref}
        collapsable={false}
        style={[
          styles.card,
          {
            width: frame.width,
            height: frame.height,
            backgroundColor: colors.canvas,
          },
        ]}
      >
        <View style={styles.head}>
          {content.caption ? (
            <Text role="eyebrow" allowFontScaling={false} numberOfLines={1}>
              {content.caption}
            </Text>
          ) : null}
          <Text
            role={format === "story" ? "display" : "title"}
            allowFontScaling={false}
            numberOfLines={2}
          >
            {content.name}
          </Text>
        </View>
        <View style={styles.lay}>
          <FlatLay pieces={content.pieces} size="hero" maxSize={frame.lay} />
        </View>
        <View style={styles.brand}>
          <Image source={mark} style={styles.mark} contentFit="contain" />
          <Text
            role="mark"
            tone="muted"
            allowFontScaling={false}
            style={styles.word}
          >
            ALMARI
          </Text>
        </View>
      </View>
    </View>
  );

  return { card, share, busy };
}

const styles = StyleSheet.create({
  away: { position: "absolute", left: -10000, top: 0 },
  card: {
    paddingHorizontal: theme.space.xl,
    paddingVertical: theme.space.xxl,
    justifyContent: "space-between",
  },
  head: { gap: theme.space.sm },
  lay: { flex: 1, justifyContent: "center", alignItems: "center" },
  brand: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: theme.space.xs,
  },
  mark: { width: 28, height: 28 },
  word: { letterSpacing: 3 },
});
