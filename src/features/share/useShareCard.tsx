import { useRef, useState } from "react";
import { Image } from "expo-image";
import {
  ActionSheetIOS,
  Alert,
  PixelRatio,
  Platform,
  Share,
  StyleSheet,
  View,
} from "react-native";
import { captureRef } from "react-native-view-shot";
import type { Piece } from "../../domain/closet";
import { t } from "../../i18n";
import { FlatLay, Text } from "../../ui";
import { theme } from "../../ui/theme";
import { useColors } from "../../ui/useColors";

const mark = require("../../../assets/brand/mark.png");

export type ShareFormat = "story" | "post";

const frames = {
  story: { width: 360, height: 640, lay: 280, output: [1080, 1920] },
  post: { width: 360, height: 450, lay: 236, output: [1080, 1350] },
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

const formats: ShareFormat[] = ["story", "post"];

function chooseFormat(): Promise<ShareFormat | null> {
  const labels = formats.map((format) => t(`share.${format}`));
  return new Promise((resolve) => {
    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: [...labels, t("common.cancel")],
          cancelButtonIndex: labels.length,
        },
        (index) => resolve(formats[index] ?? null),
      );
      return;
    }
    Alert.alert(
      t("looks.share"),
      undefined,
      [
        ...formats.map((format, index) => ({
          text: labels[index]!,
          onPress: () => resolve(format),
        })),
        {
          text: t("common.cancel"),
          style: "cancel" as const,
          onPress: () => resolve(null),
        },
      ],
      { cancelable: true, onDismiss: () => resolve(null) },
    );
  });
}

export function useShareCard(content: ShareContent) {
  const colors = useColors();
  const story = useRef<View>(null);
  const post = useRef<View>(null);
  const [busy, setBusy] = useState(false);

  const share = async () => {
    if (busy) return;
    const format = await chooseFormat();
    const ref = format === "post" ? post : story;
    if (!format || !ref.current) return;
    setBusy(true);
    try {
      const [width, height] = frames[format].output;
      const scale = PixelRatio.get();
      const url = await captureRef(ref, {
        format: "jpg",
        quality: 0.92,
        width: width / scale,
        height: height / scale,
        result: "tmpfile",
        fileName: "almari",
      });
      await Share.share({ url });
    } catch {
      return;
    } finally {
      setBusy(false);
    }
  };

  const render = (format: ShareFormat) => {
    const frame = frames[format];
    return (
      <View
        ref={format === "post" ? post : story}
        collapsable={false}
        style={[
          styles.card,
          format === "post" && styles.cardPost,
          { width: frame.width, height: frame.height },
        ]}
      >
        <View style={styles.head}>
          {content.caption ? (
            <Text
              role="eyebrow"
              allowFontScaling={false}
              numberOfLines={1}
              style={styles.center}
            >
              {content.caption}
            </Text>
          ) : null}
          <Text
            role={format === "story" ? "display" : "title"}
            allowFontScaling={false}
            numberOfLines={2}
            adjustsFontSizeToFit
            style={styles.center}
          >
            {content.name}
          </Text>
        </View>
        <View style={[styles.paper, { backgroundColor: colors.canvas }]}>
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
    );
  };

  const card = (
    <View pointerEvents="none" style={styles.away} {...hidden}>
      {render("story")}
      {render("post")}
    </View>
  );

  return { card, share, busy };
}

const styles = StyleSheet.create({
  away: { position: "absolute", left: -10000, top: 0 },
  card: {
    backgroundColor: theme.brand.ivory,
    paddingHorizontal: theme.space.xl,
    paddingTop: theme.space.xxxl,
    paddingBottom: theme.space.xl,
    gap: theme.space.xl,
  },
  cardPost: {
    paddingTop: theme.space.xl,
    paddingBottom: theme.space.lg,
    gap: theme.space.lg,
  },
  head: { gap: theme.space.sm, alignItems: "center" },
  center: { textAlign: "center" },
  paper: {
    flex: 1,
    borderRadius: theme.radius.lg,
    justifyContent: "center",
    alignItems: "center",
  },
  brand: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: theme.space.xs,
  },
  mark: { width: 24, height: 24 },
  word: { letterSpacing: 3 },
});
