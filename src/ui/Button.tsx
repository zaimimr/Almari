import { useEffect, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";
import type { SFSymbol } from "expo-symbols";
import { motion, timing } from "./motion";
import { Silk } from "./Silk";
import { Symbol } from "./symbol";
import { Text, type TextTone } from "./Text";
import { theme, type Colors } from "./theme";
import { useColors } from "./useColors";
import { useLargeText } from "./useLargeText";

export type ButtonVariant =
  "primary" | "secondary" | "quiet" | "destructive" | "icon";

export type ButtonProps = {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: "regular" | "small";
  icon?: SFSymbol;
  selectedIcon?: SFSymbol;
  selected?: boolean;
  busy?: boolean;
  busyLabel?: string;
  disabled?: boolean;
  accessibilityLabel?: string;
  accessibilityValue?: string;
  expanded?: boolean;
  media?: boolean;
  inSurface?: boolean;
  testID?: string;
};

type Look = { fill?: keyof Colors; pressed: keyof Colors; label: TextTone };

function lookFor(
  variant: ButtonVariant,
  media: boolean,
  inSurface: boolean,
): Look {
  switch (variant) {
    case "primary":
      return media
        ? { fill: "onMedia", pressed: "plumSoft", label: "plum" }
        : { fill: "plum", pressed: "plumPressed", label: "onPlum" };
    case "secondary":
      return inSurface
        ? { fill: "plumSoftPressed", pressed: "plumSoftDeep", label: "plum" }
        : { fill: "plumSoft", pressed: "plumSoftPressed", label: "plum" };
    case "quiet":
      return media
        ? { pressed: "plumPressed", label: "onMedia" }
        : { pressed: "sunken", label: "plum" };
    case "destructive":
      return { pressed: "sunken", label: "error" };
    case "icon":
      return { pressed: "sunken", label: "muted" };
  }
}

const discSize = 32;

export function Button({
  label,
  onPress,
  variant = "primary",
  size = "small",
  icon,
  selectedIcon,
  selected,
  busy = false,
  busyLabel,
  disabled = false,
  accessibilityLabel,
  accessibilityValue,
  expanded,
  media = false,
  inSurface = false,
  testID,
}: ButtonProps) {
  const colors = useColors();
  const { symbolScale } = useLargeText();
  const look = lookFor(variant, media, inSurface);
  const [waited, setWaited] = useState(false);
  const busyLook = busy && waited;
  const filled = look.fill !== undefined;
  const pressedColor = colors[look.pressed];
  const restColor = disabled
    ? colors.sunken
    : busyLook && !filled
      ? colors.sunken
      : look.fill
        ? colors[look.fill]
        : `${pressedColor}00`;
  const press = useSharedValue(0);
  const rest = useSharedValue(restColor);
  const on = useSharedValue(selected ? 1 : 0);

  useEffect(() => {
    if (!busy) return;
    const id = setTimeout(() => setWaited(true), motion.timer.wait);
    return () => {
      clearTimeout(id);
      setWaited(false);
    };
  }, [busy]);

  useEffect(() => {
    rest.set(timing(restColor, "quick", "silk"));
  }, [restColor, rest]);

  useEffect(() => {
    on.set(timing(selected ? 1 : 0, "quick", selected ? "silk" : "release"));
  }, [selected, on]);

  const fill = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      press.get(),
      [0, 1],
      [rest.get(), pressedColor],
    ),
  }));
  const outline = useAnimatedStyle(() => ({ opacity: 1 - on.get() }));
  const solid = useAnimatedStyle(() => ({ opacity: on.get() }));

  const pressTo = (to: number) => {
    if (!busy) press.set(timing(to, "quick", "silk"));
  };

  const accessibility = {
    accessibilityRole: "button" as const,
    accessibilityLabel:
      busy && busyLabel ? busyLabel : (accessibilityLabel ?? label),
    accessibilityValue: accessibilityValue
      ? { text: accessibilityValue }
      : undefined,
    accessibilityState: {
      disabled,
      busy,
      expanded,
      selected: variant === "icon" ? selected : undefined,
    },
    disabled,
    testID,
    onPress: () => {
      if (!busy) onPress();
    },
    onPressIn: () => pressTo(1),
    onPressOut: () => pressTo(0),
  };

  if (variant === "icon") {
    const disc = discSize * symbolScale;
    const target = Math.max(theme.size.touch, disc + 12);
    return (
      <Pressable
        {...accessibility}
        accessibilityShowsLargeContentViewer
        accessibilityLargeContentTitle={label}
        style={[styles.iconTarget, { width: target, height: target }]}
      >
        <Animated.View
          style={[
            styles.disc,
            { width: disc, height: disc, borderRadius: disc / 2 },
            fill,
          ]}
        />
        {icon ? (
          <Animated.View style={[styles.layer, outline]}>
            <Symbol name={icon} size={theme.size.iconBar} tone="muted" />
          </Animated.View>
        ) : null}
        {selectedIcon ? (
          <Animated.View style={[styles.layer, solid]}>
            <Symbol name={selectedIcon} size={theme.size.iconBar} tone="ink" />
          </Animated.View>
        ) : null}
      </Pressable>
    );
  }

  const tone: TextTone = disabled ? "disabled" : look.label;

  return (
    <Pressable {...accessibility}>
      <Animated.View
        style={[
          styles.capsule,
          {
            minHeight:
              size === "regular"
                ? theme.size.controlRegular
                : theme.size.controlSmall,
            paddingHorizontal: filled ? theme.space.lg : theme.space.sm,
          },
          fill,
        ]}
      >
        {busyLook ? (
          <Silk
            kind="busy"
            peak={variant === "primary" ? 0.15 : 0.7}
            style={styles.band}
          />
        ) : null}
        {icon ? (
          <Symbol name={icon} size={theme.size.iconBar} tone={tone} />
        ) : null}
        <View style={styles.label}>
          <Text role="headline" tone={tone} style={styles.text}>
            {label}
          </Text>
        </View>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  capsule: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: theme.space.xs,
    paddingVertical: theme.space.md,
    borderRadius: theme.radius.full,
    borderCurve: "continuous",
    overflow: "hidden",
  },
  band: { borderRadius: theme.radius.full },
  label: { flexShrink: 1 },
  text: { textAlign: "center" },
  iconTarget: { alignItems: "center", justifyContent: "center" },
  disc: { position: "absolute" },
  layer: {
    position: "absolute",
    inset: 0,
    alignItems: "center",
    justifyContent: "center",
  },
});
