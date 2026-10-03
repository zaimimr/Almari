import { useEffect, useRef, type ReactNode } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Animated, {
  FadeIn,
  FadeOut,
  LayoutAnimationConfig,
  ReduceMotion,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";
import { Image } from "expo-image";
import type { SFSymbol } from "expo-symbols";
import type { Piece } from "../domain/closet";
import { announce } from "./announce";
import { Button, type ButtonProps } from "./Button";
import { motion, timing, useReduceMotion } from "./motion";
import { photoSource } from "./photos";
import { Silk } from "./Silk";
import { Symbol } from "./symbol";
import { Text, type TextRole, type TextTone } from "./Text";
import { theme } from "./theme";
import { useColors } from "./useColors";
import { useLargeText } from "./useLargeText";

export type BannerProps = {
  tone: "session" | "notice" | "progress";
  text: string;
  actions?: [ButtonProps] | [ButtonProps, ButtonProps];
  leading?: SFSymbol | { thumb: Piece };
  progress?: { value: number; meta?: string; done?: boolean };
  onPress?: () => void;
  accessibilityLabel?: string;
  children?: ReactNode;
  testID?: string;
};

const hidden = {
  accessibilityElementsHidden: true,
  importantForAccessibility: "no-hide-descendants",
} as const;

const fadeIn = FadeIn.duration(motion.duration.base)
  .easing(motion.easing.silk)
  .reduceMotion(ReduceMotion.Never);
const fadeOut = FadeOut.duration(motion.duration.quick)
  .easing(motion.easing.release)
  .reduceMotion(ReduceMotion.Never);
const fadeOutReduced = FadeOut.duration(motion.duration.base).reduceMotion(
  ReduceMotion.Never,
);

function Swap({
  text,
  role,
  tone = "ink",
  reduce,
}: {
  text: string;
  role: TextRole;
  tone?: TextTone;
  reduce: boolean;
}) {
  return (
    <LayoutAnimationConfig skipEntering>
      <Animated.View
        key={text}
        entering={fadeIn}
        exiting={reduce ? fadeOutReduced : fadeOut}
      >
        <Text role={role} tone={tone}>
          {text}
        </Text>
      </Animated.View>
    </LayoutAnimationConfig>
  );
}

export function ActionRow({
  actions,
  reserve = false,
}: {
  actions?: ButtonProps[];
  reserve?: boolean;
}) {
  const { large, fontScale } = useLargeText();
  if (!actions?.length && !reserve) return null;
  const button = Math.max(
    theme.size.controlSmall,
    theme.type.headline.lineHeight * fontScale + 2 * theme.space.md,
  );
  return (
    <View
      style={[
        large ? styles.stack : styles.row,
        reserve && { minHeight: 2 * button + theme.space.sm },
      ]}
    >
      {actions?.map((action, index) => (
        <Button
          key={action.label}
          variant={index === 0 ? "secondary" : "quiet"}
          inSurface
          {...action}
        />
      ))}
    </View>
  );
}

export function Banner({
  tone,
  text,
  actions,
  leading,
  progress,
  onPress,
  accessibilityLabel,
  children,
  testID,
}: BannerProps) {
  const colors = useColors();
  const reduce = useReduceMotion();
  const { fontScale, symbolScale } = useLargeText();
  const press = useSharedValue(0);
  const said = useRef(text);
  const done = progress?.done ?? false;
  const wasDone = useRef(done);

  useEffect(() => {
    if (tone !== "progress" && text !== said.current) announce(text);
    said.current = text;
  }, [tone, text]);

  useEffect(() => {
    if (tone === "progress" && done && !wasDone.current) announce(text);
    wasDone.current = done;
  }, [tone, done, text]);

  const fill = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      press.get(),
      [0, 1],
      [colors.surface, colors.sunken],
    ),
  }));
  const exiting = reduce ? fadeOutReduced : fadeOut;

  if (tone === "progress") {
    return (
      <Animated.View exiting={exiting}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={accessibilityLabel ?? text}
          onPress={onPress}
          onPressIn={() => press.set(timing(1, "quick", "silk"))}
          onPressOut={() => press.set(timing(0, "quick", "silk"))}
          testID={done ? testID : "moment-generating"}
        >
          <Animated.View style={[styles.banner, styles.card, fill]}>
            <View style={styles.progress}>
              <Swap text={text} role="body" reduce={reduce} />
              <Silk
                kind="progress"
                value={done ? 1 : (progress?.value ?? 0)}
                label={text}
                hidden
              />
              <View
                style={{
                  minHeight: theme.type.subhead.lineHeight * fontScale,
                }}
              >
                {progress?.meta ? (
                  <Swap
                    text={progress.meta}
                    role="subhead"
                    tone="muted"
                    reduce={reduce}
                  />
                ) : null}
              </View>
            </View>
            <Symbol name="chevron.right" size={13} tone="muted" />
          </Animated.View>
        </Pressable>
      </Animated.View>
    );
  }

  const dot = 8 * symbolScale;

  return (
    <Animated.View
      exiting={exiting}
      testID={testID}
      style={[styles.banner, { backgroundColor: colors.surface }]}
    >
      {tone === "session" ? (
        <View
          style={{
            width: dot,
            height: dot,
            borderRadius: dot / 2,
            marginTop: (theme.type.body.lineHeight * fontScale - dot) / 2,
            backgroundColor: colors.blushStrong,
          }}
          {...hidden}
        />
      ) : typeof leading === "string" ? (
        <Symbol name={leading} size={theme.size.iconBar} tone="muted" />
      ) : leading ? (
        <View accessibilityIgnoresInvertColors style={styles.thumb} {...hidden}>
          <Image
            source={photoSource(leading.thumb.photo)}
            contentFit="contain"
            recyclingKey={leading.thumb.id}
            style={styles.image}
          />
        </View>
      ) : null}
      <View style={styles.body}>
        <Swap text={text} role="body" reduce={reduce} />
        <ActionRow actions={actions} />
        {children}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: "row",
    gap: theme.space.md,
    padding: theme.space.lg,
    borderRadius: theme.radius.md,
    borderCurve: "continuous",
  },
  card: { alignItems: "center", minHeight: theme.size.controlRegular },
  body: { flex: 1, gap: theme.space.md },
  progress: { flex: 1, gap: theme.space.sm },
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "flex-start",
    gap: theme.space.sm,
  },
  stack: { alignItems: "flex-start", gap: theme.space.sm },
  thumb: { width: theme.size.thumb, height: theme.size.thumb },
  image: {
    width: "100%",
    height: "100%",
    borderRadius: theme.radius.sm,
    borderCurve: "continuous",
  },
});
