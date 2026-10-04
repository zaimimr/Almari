import { useEffect, useEffectEvent } from "react";
import { StyleSheet } from "react-native";
import { Image } from "expo-image";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
import type { Frame } from "../domain/closet";
import { motion, timing, useReduceMotion } from "../ui/motion";

export type Sticker = { uri: string; frame: Frame; mirrored: boolean };

export function ScanLift({
  sticker,
  onSettle,
  onLanded,
}: {
  sticker: Sticker;
  onSettle: () => void;
  onLanded: () => void;
}) {
  const reduce = useReduceMotion();
  const shown = useSharedValue(0);
  const settle = useEffectEvent(() => onSettle());
  const land = useEffectEvent(() => onLanded());

  useEffect(() => {
    const done = () => {
      "worklet";
      scheduleOnRN(land);
    };
    const leave = () => {
      "worklet";
      scheduleOnRN(settle);
    };
    if (reduce) {
      shown.set(1);
      shown.set(
        withDelay(
          motion.timer.wait,
          timing(0, "base", "silk", () => {
            "worklet";
            done();
          }),
        ),
      );
      const id = setTimeout(settle, motion.timer.wait);
      return () => clearTimeout(id);
    }
    shown.set(
      withSequence(
        timing(1, "quick", "silk", () => {
          "worklet";
          leave();
        }),
        timing(0, "base", "release", () => {
          "worklet";
          done();
        }),
      ),
    );
  }, [reduce, shown]);

  const style = useAnimatedStyle(() => ({ opacity: shown.get() }));
  const { x, y, width, height } = sticker.frame;

  return (
    <Animated.View
      testID="scan-sticker"
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[styles.sticker, { left: x, top: y, width, height }, style]}
    >
      <Image
        source={{ uri: sticker.uri }}
        style={[
          styles.fill,
          sticker.mirrored ? { transform: [{ scaleX: -1 }] } : null,
        ]}
        contentFit="fill"
        accessibilityIgnoresInvertColors
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  sticker: { position: "absolute" },
  fill: { width: "100%", height: "100%" },
});
