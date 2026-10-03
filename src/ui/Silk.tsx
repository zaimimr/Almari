import { useEffect, useRef, type ReactNode } from "react";
import {
  StyleSheet,
  View,
  useWindowDimensions,
  type LayoutChangeEvent,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import Animated, {
  FadeOut,
  ReduceMotion,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";
import { motion, timing, useReduceMotion } from "./motion";
import { useSheen } from "./SheenClock";
import { theme } from "./theme";
import { useColors } from "./useColors";
import { useLargeText } from "./useLargeText";

export type SilkProps =
  | {
      kind: "placeholder";
      shape: "tile" | "row" | "lay" | "chip" | "text";
      label: string;
      style?: StyleProp<ViewStyle>;
      lines?: number;
    }
  | {
      kind: "sheen";
      peak?: number;
      label: string;
      children: ReactNode;
      style?: StyleProp<ViewStyle>;
    }
  | { kind: "busy"; peak: number; style?: StyleProp<ViewStyle> }
  | {
      kind: "progress";
      value: number;
      label: string;
      hidden?: boolean;
      style?: StyleProp<ViewStyle>;
    };

const sheenRgb = [1, 3, 5]
  .map((start) => parseInt(theme.brand.sheen.slice(start, start + 2), 16))
  .join(",");

const hidden = {
  accessibilityElementsHidden: true,
  importantForAccessibility: "no-hide-descendants",
} as const;

function Band({ peak, style }: { peak: number; style?: StyleProp<ViewStyle> }) {
  const { progress, pulse, reduce } = useSheen();
  const { width: windowWidth } = useWindowDimensions();
  const host = useRef<View>(null);
  const x = useSharedValue(0);
  const width = useSharedValue(0);

  const onLayout = (event: LayoutChangeEvent) => {
    width.set(event.nativeEvent.layout.width);
    host.current?.measureInWindow((left) => x.set(left));
  };

  const travel = useAnimatedStyle(() => {
    const band = width.get() * 0.4;
    return {
      width: band,
      transform: [
        {
          translateX:
            interpolate(
              progress.get(),
              [0, 1],
              [-1.6 * band, windowWidth + 1.1 * band],
            ) - x.get(),
        },
        { skewX: "-20deg" },
      ],
    };
  });

  const glow = useAnimatedStyle(() => ({ opacity: pulse.get() }));

  return (
    <Animated.View
      ref={host}
      onLayout={onLayout}
      pointerEvents="none"
      exiting={FadeOut.duration(
        motion.duration[reduce ? "base" : "quick"],
      ).reduceMotion(ReduceMotion.Never)}
      style={[StyleSheet.absoluteFill, styles.clip, style]}
      {...hidden}
    >
      {reduce ? (
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: `rgba(${sheenRgb},${peak})` },
            glow,
          ]}
        />
      ) : (
        <Animated.View
          style={[
            styles.band,
            {
              experimental_backgroundImage: `linear-gradient(90deg, rgba(${sheenRgb},0), rgba(${sheenRgb},${peak}), rgba(${sheenRgb},0))`,
            },
            travel,
          ]}
        />
      )}
    </Animated.View>
  );
}

function Placeholder({
  shape,
  lines = 1,
  style,
}: {
  shape: "tile" | "row" | "lay" | "chip" | "text";
  lines?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const colors = useColors();
  const reduce = useReduceMotion();
  const { fontScale } = useLargeText();
  const contrast = colors.line !== theme.colors.line;

  return (
    <View
      style={[
        styles.placeholder,
        { backgroundColor: colors.sunken },
        contrast && { borderWidth: 1, borderColor: colors.lineField },
        shape === "tile" && styles.tile,
        shape === "row" && styles.row,
        shape === "lay" && styles.lay,
        shape === "chip" && styles.chip,
        shape === "text" && {
          height: lines * theme.type.body.lineHeight * fontScale,
        },
        style,
      ]}
      {...hidden}
    >
      {!reduce && <Band peak={0.7} />}
    </View>
  );
}

function Progress({
  value,
  label,
  hidden: quiet,
  style,
}: {
  value: number;
  label: string;
  hidden?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const colors = useColors();
  const reduce = useReduceMotion();
  const scale = useSharedValue(value);

  useEffect(() => {
    scale.set(reduce ? value : timing(value, "base", "silk"));
  }, [reduce, value, scale]);

  const fill = useAnimatedStyle(() => ({
    transform: [{ scaleX: scale.get() }],
  }));

  return (
    <View
      style={[styles.progress, style]}
      {...(quiet
        ? hidden
        : {
            accessible: true,
            accessibilityRole: "progressbar" as const,
            accessibilityLabel: label,
            accessibilityValue: {
              min: 0,
              max: 100,
              now: Math.round(value * 100),
            },
          })}
    >
      <View style={[styles.track, { backgroundColor: colors.lineField }]} />
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          styles.fill,
          { backgroundColor: colors.plum },
          fill,
        ]}
      />
    </View>
  );
}

export function Silk(props: SilkProps) {
  switch (props.kind) {
    case "placeholder":
      return (
        <Placeholder
          shape={props.shape}
          lines={props.lines}
          style={props.style}
        />
      );
    case "sheen":
      return (
        <View
          style={[styles.clip, props.style]}
          accessible
          accessibilityLabel={props.label}
          accessibilityState={{ busy: true }}
        >
          {props.children}
          <Band peak={props.peak ?? 0.35} />
        </View>
      );
    case "busy":
      return <Band peak={props.peak} style={[styles.capsule, props.style]} />;
    case "progress":
      return (
        <Progress
          value={props.value}
          label={props.label}
          hidden={props.hidden}
          style={props.style}
        />
      );
  }
}

const styles = StyleSheet.create({
  clip: { overflow: "hidden" },
  band: { position: "absolute", top: "-10%", bottom: "-10%", left: 0 },
  placeholder: { overflow: "hidden", borderRadius: theme.radius.sm },
  tile: { aspectRatio: 4 / 5, borderRadius: theme.radius.md },
  row: { minHeight: theme.size.controlRegular },
  lay: { aspectRatio: 1, borderRadius: theme.radius.md },
  chip: { minHeight: theme.size.controlSmall, borderRadius: theme.radius.full },
  capsule: { borderRadius: theme.radius.full },
  progress: { height: 2, justifyContent: "center" },
  track: { height: 1 },
  fill: { transformOrigin: "left" },
});
