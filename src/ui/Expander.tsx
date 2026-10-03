import { useEffect, useRef, useState, type PropsWithChildren } from "react";
import { AccessibilityInfo, Pressable, StyleSheet, View } from "react-native";
import Animated, {
  interpolateColor,
  useAnimatedRef,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
} from "react-native-reanimated";
import { t } from "../i18n";
import { ActionRow } from "./Banner";
import type { ButtonProps } from "./Button";
import { motion, reflow, timing, useReduceMotion } from "./motion";
import { useScrollIntoView } from "./Screen";
import { Symbol } from "./symbol";
import { Text } from "./Text";
import { theme } from "./theme";
import { useColors } from "./useColors";
import { useLargeText } from "./useLargeText";

export type ExpanderProps = PropsWithChildren<{
  id: string;
  title?: string;
  value?: string;
  open: boolean;
  onToggle: () => void;
  tone?: "plain" | "attention";
  headless?: boolean;
  actions?: [ButtonProps] | [ButtonProps, ButtonProps];
  reserveActions?: boolean;
  card?: boolean;
  testID?: string;
}>;

const hidden = {
  accessibilityElementsHidden: true,
  importantForAccessibility: "no-hide-descendants",
} as const;

export function Expander({
  id,
  title,
  value,
  open,
  onToggle,
  tone = "plain",
  headless = false,
  actions,
  reserveActions = false,
  card = false,
  testID,
  children,
}: ExpanderProps) {
  const colors = useColors();
  const reduce = useReduceMotion();
  const { large, symbolScale } = useLargeText();
  const showPart = useScrollIntoView();
  const part = useAnimatedRef<Animated.View>();
  const header = useRef<View>(null);
  const was = useRef(open);
  const reveal = useRef(false);
  const fromBody = useRef(false);
  const [mounted, setMounted] = useState(open);
  if (open && !mounted) setMounted(true);
  const shown = useSharedValue(open ? 1 : 0);
  const rise = useSharedValue(0);
  const turn = useSharedValue(open ? 1 : 0);
  const press = useSharedValue(0);

  useEffect(() => {
    if (open === was.current) return;
    was.current = open;
    turn.set(reduce ? (open ? 1 : 0) : timing(open ? 1 : 0, "settle", "silk"));
    if (open) {
      reveal.current = true;
      if (reduce) {
        rise.set(0);
        shown.set(timing(1, "base", "silk"));
        return;
      }
      if (shown.get() === 0) rise.set(4);
      shown.set(withDelay(motion.timer.step, timing(1, "base", "silk")));
      rise.set(withDelay(motion.timer.step, timing(0, "base", "silk")));
      return;
    }
    shown.set(
      reduce ? timing(0, "base", "silk") : timing(0, "quick", "release"),
    );
    if (fromBody.current && header.current) {
      AccessibilityInfo.sendAccessibilityEvent(header.current, "focus");
    }
    fromBody.current = false;
  }, [open, reduce, shown, rise, turn]);

  useEffect(() => {
    if (open || !mounted) return;
    const timer = setTimeout(
      () => setMounted(false),
      motion.duration[reduce ? "base" : "quick"],
    );
    return () => clearTimeout(timer);
  }, [open, mounted, reduce]);

  const bodyStyle = useAnimatedStyle(() => ({
    opacity: shown.get(),
    transform: [{ translateY: rise.get() }],
  }));
  const chevron = useAnimatedStyle(() => ({
    transform: [{ rotate: `${turn.get() * 180}deg` }],
  }));
  const rest = card ? colors.surface : `${colors.sunken}00`;
  const fill = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      press.get(),
      [0, 1],
      [rest, colors.sunken],
    ),
  }));

  if (headless && !mounted) return null;

  const dot = 8 * symbolScale;
  const needsAnswer = tone === "attention" ? t("capture.stateConfirm") : "";
  const spokenValue = [value, needsAnswer].filter(Boolean).join(", ");

  return (
    <Animated.View
      ref={part}
      layout={reflow(reduce)}
      testID={testID ?? id}
      onLayout={(event) => {
        if (!reveal.current || !open) return;
        reveal.current = false;
        showPart(part, event.nativeEvent.layout.height);
      }}
      style={[
        styles.expander,
        !card && { backgroundColor: colors.surface },
        !card && styles.padded,
        headless && bodyStyle,
      ]}
    >
      {headless ? null : (
        <Pressable
          ref={header}
          accessibilityRole="button"
          accessibilityLabel={title}
          accessibilityValue={spokenValue ? { text: spokenValue } : undefined}
          accessibilityState={{ expanded: open }}
          onPress={onToggle}
          onPressIn={() => press.set(timing(1, "quick", "silk"))}
          onPressOut={() => press.set(timing(0, "quick", "silk"))}
        >
          <Animated.View
            style={[styles.header, !card && styles.headerBleed, fill]}
          >
            <View style={[styles.words, large && styles.wordsLarge]}>
              <View style={styles.title}>
                {tone === "attention" ? (
                  <View
                    style={{
                      width: dot,
                      height: dot,
                      borderRadius: dot / 2,
                      backgroundColor: colors.plum,
                    }}
                    {...hidden}
                  />
                ) : null}
                <Text role="headline" style={styles.shrink}>
                  {title}
                </Text>
              </View>
              {value ? (
                <Text role="subhead" tone="muted">
                  {value}
                </Text>
              ) : null}
            </View>
            <Animated.View style={chevron}>
              <Symbol
                name="chevron.down"
                size={theme.size.iconInline}
                tone="muted"
              />
            </Animated.View>
          </Animated.View>
        </Pressable>
      )}
      {mounted ? (
        <Animated.View
          nativeID={id}
          style={[
            styles.body,
            !card && (headless ? styles.bodyHeadless : styles.bodyUnder),
            card && styles.bodyCard,
            !headless && bodyStyle,
          ]}
          {...(open ? null : hidden)}
        >
          {children}
          <ActionRow
            actions={actions?.map((action) => ({
              ...action,
              onPress: () => {
                fromBody.current = true;
                action.onPress();
              },
            }))}
            reserve={reserveActions}
          />
        </Animated.View>
      ) : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  expander: {
    borderRadius: theme.radius.md,
    borderCurve: "continuous",
    overflow: "hidden",
  },
  padded: { paddingHorizontal: theme.space.lg },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.space.sm,
    minHeight: theme.size.controlSmall,
    paddingVertical: theme.space.xs,
    paddingHorizontal: theme.space.lg,
    borderRadius: theme.radius.md,
    borderCurve: "continuous",
  },
  headerBleed: { marginHorizontal: -theme.space.lg },
  words: {
    flex: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "space-between",
    columnGap: theme.space.sm,
  },
  wordsLarge: { flexDirection: "column", alignItems: "flex-start" },
  title: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.space.sm,
    flexShrink: 1,
  },
  shrink: { flexShrink: 1 },
  body: { gap: theme.space.md },
  bodyUnder: { paddingTop: theme.space.sm, paddingBottom: theme.space.lg },
  bodyHeadless: { paddingVertical: theme.space.lg },
  bodyCard: { paddingTop: theme.space.md },
});
