import { useEffect, useState } from "react";
import { Image, StyleSheet } from "react-native";
import * as Haptics from "expo-haptics";
import Animated, { FadeIn, FadeOut, ZoomIn } from "react-native-reanimated";
import { coveredFrame } from "../../domain/capture";
import type { Frame } from "../../domain/closet";
import { motion, useReduceMotion } from "../../ui/motion";
import { photoUri } from "../../storage/local";
import { theme } from "../../ui/theme";
import { place } from "./RegionMark";

const box = 4 / 5;
const shown = new Set<string>();

export function FoundMarks({
  id,
  photo,
  frames,
}: {
  id: string;
  photo: string;
  frames: Frame[];
}) {
  const reduce = useReduceMotion();
  const [aspect, setAspect] = useState<number | null>(null);
  const [fresh] = useState(() => !shown.has(id));

  useEffect(() => {
    let active = true;
    Image.getSize(
      photoUri(photo),
      (width, height) => {
        if (active && height) setAspect(width / height);
      },
      () => {},
    );
    return () => {
      active = false;
    };
  }, [photo]);

  const count = frames.length;
  useEffect(() => {
    if (!aspect || !fresh || shown.has(id)) return;
    shown.add(id);
    for (let index = 0; index < count; index++)
      setTimeout(
        () => void Haptics.selectionAsync(),
        index * motion.timer.wait,
      );
  }, [aspect, fresh, id, count]);

  if (!aspect) return null;
  return (
    <Animated.View
      pointerEvents="none"
      exiting={FadeOut.duration(motion.duration.settle)}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={styles.layer}
      testID="found-marks"
    >
      {frames.map((frame, index) => {
        const enter = reduce ? FadeIn : ZoomIn;
        return (
          <Animated.View
            key={index}
            entering={
              fresh
                ? enter
                    .duration(motion.duration.settle)
                    .delay(index * motion.timer.wait)
                    .easing(motion.easing.fall)
                : undefined
            }
            style={[styles.mark, place(coveredFrame(frame, aspect, box))]}
          />
        );
      })}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  layer: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    aspectRatio: box,
  },
  mark: {
    position: "absolute",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.95)",
    borderRadius: theme.radius.sm,
    borderCurve: "continuous",
    backgroundColor: "rgba(255,255,255,0.14)",
    boxShadow: "0 2px 10px rgba(0,0,0,0.25)",
  },
});
