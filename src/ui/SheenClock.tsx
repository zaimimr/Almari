import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";
import { useIsFocused } from "expo-router";
import {
  cancelAnimation,
  makeMutable,
  ReduceMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
  type SharedValue,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
import { motion, timing, useReduceMotion } from "./motion";

type Sheen = {
  progress: SharedValue<number>;
  pulse: SharedValue<number>;
  reduce: boolean;
};

const SheenClock = createContext<Sheen & { join: () => () => void }>({
  progress: makeMutable(0),
  pulse: makeMutable(0),
  reduce: false,
  join: () => () => {},
});

const passes = Math.floor(
  motion.timer.loop / (motion.timer.wait + motion.duration.sheen),
);
const half = {
  duration: motion.duration.sheen / 2,
  easing: motion.easing.silk,
  reduceMotion: ReduceMotion.Never,
};

export function SheenClockProvider({
  children,
  usable = true,
}: PropsWithChildren<{ usable?: boolean }>) {
  const progress = useSharedValue(0);
  const pulse = useSharedValue(0);
  const reduceMotion = useReduceMotion();
  const focused = useIsFocused();
  const [clock, setClock] = useState({ hosts: 0, held: false });
  const running = focused && clock.hosts > 0;
  const reduce = reduceMotion || clock.held;

  const join = useCallback(() => {
    setClock((current) => ({ ...current, hosts: current.hosts + 1 }));
    return () =>
      setClock((current) => ({
        hosts: current.hosts - 1,
        held: current.hosts > 1 && current.held,
      }));
  }, []);

  const hold = useCallback(
    () => setClock((current) => ({ ...current, held: true })),
    [],
  );

  useEffect(() => {
    if (!running) return;
    if (reduce) {
      pulse.set(
        withRepeat(
          withDelay(
            motion.timer.wait,
            withSequence(withTiming(1, half), withTiming(0, half)),
          ),
          usable ? passes : -1,
        ),
      );
    } else {
      progress.set(
        withRepeat(
          withDelay(motion.timer.wait, timing(1, "sheen", "carry")),
          passes,
          false,
          (finished) => {
            "worklet";
            if (finished && !usable) scheduleOnRN(hold);
          },
        ),
      );
    }
    return () => {
      cancelAnimation(progress);
      cancelAnimation(pulse);
      progress.set(0);
      pulse.set(0);
    };
  }, [running, reduce, usable, hold, progress, pulse]);

  const value = useMemo(
    () => ({ progress, pulse, reduce, join }),
    [progress, pulse, reduce, join],
  );

  return <SheenClock value={value}>{children}</SheenClock>;
}

export function useSheen(): Sheen {
  const { progress, pulse, reduce, join } = useContext(SheenClock);
  useEffect(join, [join]);
  return { progress, pulse, reduce };
}
