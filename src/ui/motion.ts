import { useEffect, useState } from "react";
import { AccessibilityInfo } from "react-native";
import {
  Easing,
  FadeIn,
  LinearTransition,
  ReduceMotion,
  useReducedMotion,
  withTiming,
  type EntryExitAnimationFunction,
  type EntryOrExitLayoutType,
} from "react-native-reanimated";
import { motionTokens } from "./motionTokens";

const curve = (name: keyof typeof motionTokens.easing) =>
  Easing.bezier(...motionTokens.easing[name]);

export const motion = {
  duration: motionTokens.duration,
  timer: motionTokens.timer,
  easing: {
    silk: curve("silk"),
    fall: curve("fall"),
    carry: curve("carry"),
    release: curve("release"),
  },
} as const;

export type Duration = keyof typeof motion.duration;
export type EasingName = keyof typeof motion.easing;

export function timing<T extends number | string>(
  to: T,
  duration: Duration,
  easing: EasingName,
  callback?: (finished?: boolean) => void,
) {
  "worklet";
  return withTiming(
    to,
    {
      duration: motion.duration[duration],
      easing: motion.easing[easing],
      reduceMotion: ReduceMotion.Never,
    },
    callback,
  );
}

export function useReduceMotion(): boolean {
  const atStart = useReducedMotion();
  const [reduce, setReduce] = useState(atStart);

  useEffect(() => {
    let active = true;
    AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (active) setReduce(enabled);
    });
    const subscription = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      setReduce,
    );
    return () => {
      active = false;
      subscription.remove();
    };
  }, []);

  return reduce;
}

export function useAfterWait(active: boolean): boolean {
  const [waited, setWaited] = useState(false);

  useEffect(() => {
    if (!active) return;
    const id = setTimeout(() => setWaited(true), motion.timer.wait);
    return () => {
      clearTimeout(id);
      setWaited(false);
    };
  }, [active]);

  return active && waited;
}

const rise: EntryExitAnimationFunction = () => {
  "worklet";
  return {
    initialValues: { opacity: 0, transform: [{ translateY: 4 }] },
    animations: {
      opacity: timing(1, "base", "silk"),
      transform: [{ translateY: timing(0, "base", "silk") }],
    },
  };
};

export const enter = (reduce: boolean): EntryOrExitLayoutType =>
  reduce
    ? FadeIn.duration(motion.duration.base).reduceMotion(ReduceMotion.Never)
    : rise;

export const reflow = (reduce: boolean) =>
  reduce
    ? undefined
    : LinearTransition.duration(motion.duration.settle).easing(
        motion.easing.silk,
      );
