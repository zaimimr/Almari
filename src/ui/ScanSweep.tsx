import { useEffect } from "react";
import {
  StyleSheet,
  type LayoutChangeEvent,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import Animated, {
  cancelAnimation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
} from "react-native-reanimated";
import { motion, timing, useReduceMotion } from "./motion";

const light = "255,255,255";

export function ScanSweep({ style }: { style?: StyleProp<ViewStyle> }) {
  const reduce = useReduceMotion();
  const progress = useSharedValue(0);
  const height = useSharedValue(0);

  useEffect(() => {
    progress.set(
      reduce
        ? withRepeat(
            withSequence(
              timing(1, "drape", "silk"),
              timing(0, "drape", "silk"),
            ),
            -1,
          )
        : withRepeat(
            withDelay(motion.timer.wait, timing(1, "sheen", "carry")),
            -1,
            false,
          ),
    );
    return () => cancelAnimation(progress);
  }, [reduce, progress]);

  const onLayout = (event: LayoutChangeEvent) =>
    height.set(event.nativeEvent.layout.height);

  const band = useAnimatedStyle(() => {
    const size = height.get() * 0.45;
    return {
      height: size,
      transform: [
        {
          translateY: interpolate(
            progress.get(),
            [0, 1],
            [-size, height.get()],
          ),
        },
      ],
    };
  });

  const veil = useAnimatedStyle(() => ({
    opacity: reduce ? 0.12 + 0.18 * progress.get() : 0.12,
  }));

  return (
    <Animated.View
      pointerEvents="none"
      onLayout={onLayout}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      testID="scan-sweep"
      style={[StyleSheet.absoluteFill, styles.clip, style]}
    >
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: `rgb(${light})` },
          veil,
        ]}
      />
      {reduce ? null : (
        <Animated.View
          style={[
            styles.band,
            {
              experimental_backgroundImage: `linear-gradient(180deg, rgba(${light},0), rgba(${light},0.5) 70%, rgba(${light},0.85) 76%, rgba(${light},0))`,
            },
            band,
          ]}
        />
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  clip: { overflow: "hidden" },
  band: { position: "absolute", left: 0, right: 0, top: 0 },
});
