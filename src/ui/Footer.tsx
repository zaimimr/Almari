import { useEffect, useRef, type ReactNode } from "react";
import {
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
} from "react-native";
import Animated, {
  FadeIn,
  FadeOut,
  LayoutAnimationConfig,
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { announce } from "./announce";
import { Button, type ButtonProps } from "./Button";
import { useMeasuredMax } from "./measure";
import { motion, timing } from "./motion";
import { Text } from "./Text";
import { gutterFor, theme } from "./theme";
import { useColors } from "./useColors";
import { useLargeText } from "./useLargeText";

export type FooterProps = {
  primary?: ButtonProps;
  secondary?: ButtonProps;
  waiting?: boolean;
  error?: string | null;
  children?: ReactNode;
  actions?: ButtonProps[];
  actionsContent?: ReactNode;
  media?: boolean;
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

export function Footer({
  primary,
  secondary,
  waiting = false,
  error,
  children,
  actions,
  actionsContent,
  media = false,
}: FooterProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();
  const { large, ax, fontScale } = useLargeText();
  const gutter = gutterFor(windowWidth);
  const inner = windowWidth - 2 * gutter;
  const half = (inner - theme.space.md) / 2 - 2 * theme.space.lg;
  const actionWidth = inner - 2 * theme.space.sm;

  const rowActions =
    actions && ax && secondary
      ? [...actions, { ...secondary, variant: "quiet" as const }]
      : actions;
  const pairSecondary = ax ? undefined : secondary;
  const pair = Boolean(primary && pairSecondary);

  const [pairMax, pairLayer] = useMeasuredMax(
    pair && !large
      ? [primary, pairSecondary].map((button) => ({
          text: button?.label ?? "",
          role: "headline" as const,
          width: half,
        }))
      : [],
  );
  const [actionMax, actionLayer] = useMeasuredMax(
    (rowActions ?? []).map((button) => ({
      text: button.label,
      role: "headline" as const,
      width: actionWidth,
    })),
  );
  const oneLine = theme.type.headline.lineHeight * fontScale * 1.5;
  const stacked = large || (pairMax !== null && pairMax > oneLine);
  const measuring = pair && !large && pairMax === null;
  const rowHeight = Math.max(
    theme.size.controlSmall,
    (actionMax ?? 0) + 2 * theme.space.md,
  );

  const shown = useSharedValue(waiting ? 0 : 1);
  const wasWaiting = useRef(waiting);
  const primaryLabel = primary?.label;
  useEffect(() => {
    shown.set(waiting ? 0 : timing(1, "base", "silk"));
    if (waiting) return;
    if (wasWaiting.current && primaryLabel) announce(primaryLabel);
    wasWaiting.current = false;
  }, [waiting, primaryLabel, shown]);
  const reveal = useAnimatedStyle(() => ({ opacity: shown.get() }));

  const button = (props: ButtonProps) => (
    <Button size="regular" media={media} {...props} />
  );

  return (
    <View
      style={[
        styles.footer,
        {
          backgroundColor: media ? colors.ink : colors.canvas,
          paddingHorizontal: gutter,
          paddingBottom: Math.max(insets.bottom, theme.space.md),
        },
      ]}
    >
      <LayoutAnimationConfig skipEntering>
        {pairLayer}
        {actionLayer}
        {rowActions || actionsContent ? (
          <View style={{ minHeight: rowHeight }}>
            {actionsContent ? (
              <Animated.View key="content" entering={fadeIn} exiting={fadeOut}>
                {actionsContent}
              </Animated.View>
            ) : (
              <Animated.View key="actions" entering={fadeIn} exiting={fadeOut}>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={{ marginRight: -gutter }}
                  contentContainerStyle={[
                    styles.actions,
                    { paddingRight: gutter },
                  ]}
                >
                  {rowActions?.map((action) => (
                    <View key={action.label} style={{ maxWidth: inner }}>
                      <Button variant="quiet" media={media} {...action} />
                    </View>
                  ))}
                </ScrollView>
              </Animated.View>
            )}
          </View>
        ) : null}
        {error ? (
          <Text role="footnote" tone="error" announce>
            {error}
          </Text>
        ) : null}
        {children ? (
          <Animated.View key="result" entering={fadeIn} exiting={fadeOut}>
            {children}
          </Animated.View>
        ) : primary ? (
          <Animated.View
            key="buttons"
            entering={fadeIn}
            exiting={fadeOut}
            style={[
              stacked ? styles.stack : styles.pair,
              measuring && styles.measuring,
            ]}
          >
            {pairSecondary ? (
              <View style={!stacked && styles.half}>
                {button({ variant: "secondary", ...pairSecondary })}
              </View>
            ) : null}
            <Animated.View
              style={[!stacked && pair && styles.half, reveal]}
              pointerEvents={waiting ? "none" : "auto"}
              {...(waiting ? hidden : null)}
            >
              {button(primary)}
            </Animated.View>
          </Animated.View>
        ) : waiting ? (
          <View style={styles.reserve} />
        ) : null}
      </LayoutAnimationConfig>
    </View>
  );
}

function SecondaryInContent({
  secondary,
  media,
}: {
  secondary?: ButtonProps;
  media?: boolean;
}) {
  const { ax } = useLargeText();
  return ax && secondary ? (
    <Button {...secondary} variant="quiet" media={media} />
  ) : null;
}

Footer.secondaryInContent = SecondaryInContent;

const styles = StyleSheet.create({
  footer: { paddingTop: theme.space.md, gap: theme.space.md },
  actions: { gap: theme.space.sm },
  pair: { flexDirection: "row", gap: theme.space.md },
  stack: { gap: theme.space.md },
  half: { flex: 1 },
  measuring: { opacity: 0 },
  reserve: { minHeight: theme.size.controlRegular },
});
