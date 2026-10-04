import {
  FadeIn,
  FadeOut,
  ReduceMotion,
  withDelay,
  type EntryExitAnimationFunction,
} from "react-native-reanimated";
import { motion, timing } from "../../ui/motion";

const delay = motion.timer.step;

const incoming: EntryExitAnimationFunction = () => {
  "worklet";
  return {
    initialValues: { opacity: 0, transform: [{ translateY: 4 }] },
    animations: {
      opacity: withDelay(delay, timing(1, "base", "silk")),
      transform: [{ translateY: withDelay(delay, timing(0, "base", "silk")) }],
    },
  };
};

const outgoing: EntryExitAnimationFunction = () => {
  "worklet";
  return {
    initialValues: { opacity: 1 },
    animations: { opacity: timing(0, "quick", "release") },
  };
};

export const stepEnter = (reduce: boolean) =>
  reduce
    ? FadeIn.duration(motion.duration.base).reduceMotion(ReduceMotion.Never)
    : incoming;

export const stepExit = (reduce: boolean) =>
  reduce
    ? FadeOut.duration(motion.duration.base).reduceMotion(ReduceMotion.Never)
    : outgoing;
