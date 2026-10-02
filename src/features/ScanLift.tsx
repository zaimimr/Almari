import { useEffect, useEffectEvent } from "react";
import { StyleSheet, View } from "react-native";
import { Image } from "expo-image";
import Animated, {
  Easing,
  ReduceMotion,
  interpolate,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
  type SharedValue,
} from "react-native-reanimated";
import type { Frame } from "../domain/closet";

export type Sticker = { uri: string; frame: Frame; mirrored: boolean };

const lifted = 1.08;
const fade = { duration: 200, reduceMotion: ReduceMotion.Never };

function useFlight(
  frame: Frame,
  lift: SharedValue<number>,
  fly: SharedValue<number>,
  target: SharedValue<Frame | null>,
) {
  return useAnimatedStyle(() => {
    const to = target.value ?? {
      x: frame.x + frame.width / 2,
      y: frame.y + frame.height / 2,
      width: 0,
      height: 0,
    };
    const fit = Math.min(to.width / frame.width, to.height / frame.height);
    const raised = 1 + (lifted - 1) * lift.value;
    return {
      shadowOpacity: 0.35 * lift.value * (1 - fly.value),
      transform: [
        {
          translateX:
            fly.value * (to.x + to.width / 2 - frame.x - frame.width / 2),
        },
        {
          translateY:
            fly.value * (to.y + to.height / 2 - frame.y - frame.height / 2),
        },
        { scale: raised + (fit - raised) * fly.value },
      ],
    };
  });
}

const place = (frame: Frame) => ({
  left: frame.x,
  top: frame.y,
  width: frame.width,
  height: frame.height,
});

export function ScanLift({
  camera,
  box,
  done,
  sticker,
  slot,
  onLanded,
}: {
  camera: { width: number; height: number };
  box: Frame;
  done: boolean;
  sticker: Sticker | null;
  slot: () => Promise<Frame | null>;
  onLanded: () => void;
}) {
  const still = useReducedMotion();
  const dim = useSharedValue(0);
  const sweep = useSharedValue(0);
  const lift = useSharedValue(0);
  const gleam = useSharedValue(0);
  const fly = useSharedValue(0);
  const shown = useSharedValue(0);
  const target = useSharedValue<Frame | null>(null);
  const frame = sticker?.frame ?? box;
  const band = Math.max(24, frame.width * 0.35);

  useEffect(() => {
    dim.set(withTiming(1, fade));
    if (!still)
      sweep.set(
        withRepeat(
          withTiming(1, { duration: 900, easing: Easing.inOut(Easing.quad) }),
          -1,
        ),
      );
  }, [dim, sweep, still]);

  const land = useEffectEvent(() => onLanded());
  const locate = useEffectEvent(() => slot());

  useEffect(() => {
    if (!done) return;
    if (still) {
      lift.set(withTiming(1, fade));
      shown.set(
        withSequence(withTiming(1, fade), withDelay(400, withTiming(0, fade))),
      );
      dim.set(withDelay(600, withTiming(0, fade)));
      const timer = setTimeout(land, 800);
      return () => clearTimeout(timer);
    }
    let live = true;
    let landing: ReturnType<typeof setTimeout> | undefined;
    lift.set(
      withTiming(1, {
        duration: 260,
        easing: Easing.out(Easing.cubic),
      }),
    );
    gleam.set(
      withDelay(
        120,
        withTiming(1, { duration: 440, easing: Easing.inOut(Easing.quad) }),
      ),
    );
    const timer = setTimeout(() => {
      void locate().then((found) => {
        if (!live) return;
        target.set(
          found
            ? {
                x: found.x + 6,
                y: found.y + 6,
                width: found.width - 12,
                height: found.height - 12,
              }
            : null,
        );
        const flight = {
          duration: 360,
          easing: Easing.bezier(0.5, 0, 0.2, 1),
        };
        dim.set(withTiming(0, flight));
        fly.set(withTiming(1, flight));
        landing = setTimeout(land, flight.duration);
      });
    }, 560);
    return () => {
      live = false;
      clearTimeout(timer);
      clearTimeout(landing);
    };
  }, [done, still, dim, lift, gleam, fly, shown, target]);

  const shade = useAnimatedStyle(() => ({ opacity: dim.value * 0.45 }));
  const stickerFlight = useFlight(frame, lift, fly, target);
  const boxFlight = useFlight(box, lift, fly, target);
  const outline = useAnimatedStyle(() => ({
    opacity: sticker || still ? 1 - lift.value : 1,
  }));
  const shine = useAnimatedStyle(() => ({
    transform: [
      { translateX: interpolate(sweep.value, [0, 1], [-band, box.width]) },
      { skewX: "-20deg" },
    ],
  }));
  const piece = useAnimatedStyle(() => ({ opacity: shown.value }));
  const glint = useAnimatedStyle(() => ({
    opacity: 0.6 * Math.sin(Math.PI * gleam.value),
    transform: [
      {
        translateX: interpolate(gleam.value, [0, 1], [-band, frame.width]),
      },
    ],
  }));
  const glintImage = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: -interpolate(gleam.value, [0, 1], [-band, frame.width]),
      },
    ],
  }));
  const flip = sticker?.mirrored ? [{ scaleX: -1 }] : [];

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Animated.View style={[styles.shade, camera, shade]} />
      <Animated.View
        style={[
          styles.box,
          place(box),
          sticker || still ? null : boxFlight,
          outline,
        ]}
      >
        {still ? null : (
          <Animated.View style={[styles.shine, { width: band }, shine]} />
        )}
      </Animated.View>
      {sticker ? (
        <Animated.View
          style={[styles.raised, place(frame), still ? piece : stickerFlight]}
        >
          <Image
            source={{ uri: sticker.uri }}
            style={[styles.fill, { transform: flip }]}
            contentFit="fill"
          />
          {still ? null : (
            <Animated.View style={[styles.glint, { width: band }, glint]}>
              <Animated.View
                style={[
                  { width: frame.width, height: frame.height },
                  glintImage,
                ]}
              >
                <Image
                  source={{ uri: sticker.uri }}
                  style={[styles.fill, { transform: flip }]}
                  contentFit="fill"
                  tintColor="#FFFFFF"
                />
              </Animated.View>
            </Animated.View>
          )}
        </Animated.View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  shade: { position: "absolute", left: 0, top: 0, backgroundColor: "#000" },
  box: {
    position: "absolute",
    borderRadius: 18,
    borderCurve: "continuous",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.9)",
    backgroundColor: "rgba(255,255,255,0.12)",
    overflow: "hidden",
  },
  shine: {
    position: "absolute",
    top: -20,
    bottom: -20,
    backgroundColor: "rgba(255,255,255,0.35)",
  },
  raised: {
    position: "absolute",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 18,
  },
  fill: { width: "100%", height: "100%" },
  glint: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    overflow: "hidden",
  },
});
