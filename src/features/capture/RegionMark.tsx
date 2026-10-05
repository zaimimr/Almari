import { useEffect } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Animated, {
  FadeIn,
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
} from "react-native-reanimated";
import type { Frame } from "../../domain/closet";
import { t } from "../../i18n";
import { Symbol, Text } from "../../ui";
import { motion, timing, useReduceMotion } from "../../ui/motion";
import { theme } from "../../ui/theme";
import { useColors } from "../../ui/useColors";

export function place(frame: Frame) {
  return {
    left: `${frame.x * 100}%`,
    top: `${frame.y * 100}%`,
    width: `${frame.width * 100}%`,
    height: `${frame.height * 100}%`,
  } as const;
}

type Props = {
  frame: Frame;
  number: number;
  label: string;
  kept: boolean;
  order: number;
  compact: boolean;
  faint?: boolean;
  flash?: number;
  disabled?: boolean;
  onToggle?: () => void;
  onAdjust?: () => void;
  testID?: string;
};

export function RegionMark({
  frame,
  number,
  label,
  kept,
  order,
  compact,
  faint = false,
  flash = 0,
  disabled = false,
  onToggle,
  onAdjust,
  testID,
}: Props) {
  const colors = useColors();
  const on = useSharedValue(kept ? 1 : 0);
  const pulse = useSharedValue(1);

  useEffect(() => {
    on.value = timing(kept ? 1 : 0, "base", "silk");
  }, [kept, on]);

  useEffect(() => {
    if (flash)
      pulse.value = withSequence(
        timing(1.04, "quick", "silk"),
        timing(1, "settle", "silk"),
      );
  }, [flash, pulse]);

  const keptStyle = useAnimatedStyle(() => ({ opacity: on.value }));
  const droppedStyle = useAnimatedStyle(() => ({ opacity: 1 - on.value }));
  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  const entering = FadeIn.duration(motion.duration.base)
    .delay(order * motion.timer.step)
    .easing(motion.easing.fall)
    .reduceMotion(ReduceMotion.Never);

  if (faint)
    return (
      <Animated.View
        entering={entering}
        pointerEvents="none"
        style={[
          styles.region,
          styles.faint,
          { borderColor: colors.onMedia, shadowColor: colors.ink },
          place(frame),
          pulseStyle,
        ]}
      />
    );

  return (
    <Animated.View
      entering={entering}
      style={[styles.region, place(frame), pulseStyle]}
    >
      <Pressable
        testID={testID}
        accessibilityRole="checkbox"
        accessibilityLabel={label}
        accessibilityState={{ checked: kept, disabled }}
        accessibilityActions={
          onAdjust ? [{ name: "adjust", label: t("capture.adjust") }] : []
        }
        onAccessibilityAction={(event) => {
          if (event.nativeEvent.actionName === "adjust") onAdjust?.();
        }}
        disabled={disabled}
        onPress={onToggle}
        onLongPress={onAdjust}
        style={StyleSheet.absoluteFill}
      >
        <Animated.View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            styles.edge,
            styles.dropped,
            { borderColor: colors.onMedia, backgroundColor: `${colors.ink}33` },
            droppedStyle,
          ]}
        />
        <Animated.View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            styles.edge,
            styles.kept,
            {
              borderColor: colors.blush,
              backgroundColor: `${colors.blush}24`,
              shadowColor: colors.ink,
            },
            keptStyle,
          ]}
        />
        {compact ? null : (
          <View pointerEvents="none" style={styles.corner}>
            <Animated.View
              style={[
                styles.badge,
                { backgroundColor: colors.scrimPill },
                droppedStyle,
              ]}
            >
              <Text role="mark" tone="onMedia">
                {number}
              </Text>
            </Animated.View>
            <Animated.View
              style={[
                styles.badge,
                styles.over,
                {
                  backgroundColor: colors.blush,
                  borderColor: colors.blushEdge,
                },
                keptStyle,
              ]}
            >
              <Symbol name="checkmark" size={11} tone="ink" weight="semibold" />
              <Text role="mark">{number}</Text>
            </Animated.View>
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
}

export function PickPulse({ at }: { at: { x: number; y: number } }) {
  const colors = useColors();
  const reduce = useReduceMotion();
  const grow = useSharedValue(0);

  useEffect(() => {
    if (reduce) return;
    grow.value = withRepeat(timing(1, "sheen", "silk"), -1, false);
  }, [grow, reduce]);

  const ring = useAnimatedStyle(() => ({
    opacity: reduce ? 1 : 1 - grow.value,
    transform: [{ scale: reduce ? 1 : 0.5 + grow.value }],
  }));

  return (
    <View
      testID="pick-pulse"
      pointerEvents="none"
      accessible
      accessibilityLabel={t("capture.picking")}
      style={[styles.pulse, { left: `${at.x * 100}%`, top: `${at.y * 100}%` }]}
    >
      <Animated.View
        style={[
          styles.ring,
          { borderColor: colors.blush, shadowColor: colors.ink },
          ring,
        ]}
      />
      <View
        style={[
          styles.dot,
          { backgroundColor: colors.blush, borderColor: colors.onMedia },
        ]}
      />
    </View>
  );
}

const pulseSize = 56;

const styles = StyleSheet.create({
  region: { position: "absolute" },
  edge: { borderRadius: theme.radius.sm, borderCurve: "continuous" },
  faint: {
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderRadius: theme.radius.sm,
    opacity: 0.8,
    shadowOpacity: 0.6,
    shadowRadius: 1,
    shadowOffset: { width: 0, height: 0 },
  },
  dropped: { borderWidth: 1.5, borderStyle: "dashed" },
  kept: {
    borderWidth: 2.5,
    shadowOpacity: 0.35,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 0 },
  },
  corner: { position: "absolute", top: theme.space.xs, left: theme.space.xs },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    minWidth: 24,
    height: 24,
    paddingHorizontal: theme.space.sm,
    borderRadius: theme.radius.full,
    justifyContent: "center",
  },
  over: { position: "absolute", top: 0, left: 0, borderWidth: 1 },
  pulse: {
    position: "absolute",
    width: pulseSize,
    height: pulseSize,
    marginLeft: -pulseSize / 2,
    marginTop: -pulseSize / 2,
    alignItems: "center",
    justifyContent: "center",
  },
  ring: {
    position: "absolute",
    width: pulseSize,
    height: pulseSize,
    borderRadius: pulseSize / 2,
    borderWidth: 3,
    shadowOpacity: 0.4,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 0 },
  },
  dot: { width: 14, height: 14, borderRadius: 7, borderWidth: 2 },
});
