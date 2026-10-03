import { useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import type { SFSymbol } from "expo-symbols";
import { useMeasuredMax } from "./measure";
import { timing, useAfterWait, useReduceMotion } from "./motion";
import { Row } from "./Row";
import { Symbol } from "./symbol";
import { Text } from "./Text";
import { theme } from "./theme";
import { useColors } from "./useColors";
import { useLargeText } from "./useLargeText";

const inset = 2;

export function Segmented<T extends string>({
  label,
  options,
  value,
  onChange,
  disabled = false,
  media = false,
  icons = false,
}: {
  label?: string;
  options: readonly { id: T; label: string; icon?: SFSymbol }[];
  value: T;
  onChange: (next: T) => void;
  disabled?: boolean;
  media?: boolean;
  icons?: boolean;
}) {
  const colors = useColors();
  const reduce = useReduceMotion();
  const { large, fontScale } = useLargeText();
  const dim = useAfterWait(disabled);
  const [width, setWidth] = useState(0);
  const segment = width / options.length;
  const [max, layer] = useMeasuredMax(
    width > 0 && !large
      ? options.map((option) => ({
          text: option.label,
          role: "subhead" as const,
          width: segment - 2 * theme.space.md,
        }))
      : [],
  );
  const wraps =
    max !== null && max > theme.type.subhead.lineHeight * fontScale * 1.5;
  const measuring = !large && max === null;
  const list = !media && (large || wraps);
  const symbols = media && icons && (large || wraps);
  const index = Math.max(
    0,
    options.findIndex((option) => option.id === value),
  );

  const x = useSharedValue(0);
  const fade = useSharedValue(1);
  const placed = useRef(-1);

  useEffect(() => {
    const to = index * segment;
    if (placed.current !== segment) {
      placed.current = segment;
      x.set(to);
    } else if (reduce) {
      x.set(to);
      fade.set(0);
      fade.set(timing(1, "base", "silk"));
    } else {
      x.set(timing(to, "settle", "silk"));
    }
  }, [index, segment, reduce, x, fade]);

  const thumb = useAnimatedStyle(() => ({
    opacity: fade.get(),
    transform: [{ translateX: x.get() }],
  }));

  const select = (id: T) => {
    if (disabled || id === value) return;
    void Haptics.selectionAsync();
    onChange(id);
  };

  const tone = dim ? "disabled" : "ink";

  return (
    <View
      style={styles.group}
      onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
    >
      {layer}
      {label ? (
        <Text role="headline" tone={media ? "onMedia" : "ink"}>
          {label}
        </Text>
      ) : null}
      {list ? (
        <View accessibilityRole="radiogroup" accessibilityLabel={label}>
          {options.map((option, position) => (
            <Row
              key={option.id}
              title={option.label}
              radio
              trailing={option.id === value ? "selected" : undefined}
              onPress={() => select(option.id)}
              last={position === options.length - 1}
            />
          ))}
        </View>
      ) : (
        <View
          accessibilityRole="radiogroup"
          accessibilityLabel={label}
          style={[
            styles.track,
            { backgroundColor: colors.sunken },
            measuring && styles.measuring,
          ]}
        >
          {segment > 0 ? (
            <Animated.View
              style={[
                styles.thumb,
                {
                  width: segment - 2 * inset,
                  backgroundColor: colors.canvas,
                  borderColor: colors.inkMuted,
                },
                thumb,
              ]}
            />
          ) : null}
          {options.map((option) => (
            <Pressable
              key={option.id}
              onPress={() => select(option.id)}
              accessibilityRole="radio"
              accessibilityLabel={option.label}
              accessibilityState={{ selected: option.id === value, disabled }}
              style={styles.segment}
            >
              {symbols && option.icon ? (
                <Symbol
                  name={option.icon}
                  size={theme.size.iconBar}
                  tone={tone}
                />
              ) : (
                <Text role="subhead" tone={tone} style={styles.label}>
                  {option.label}
                </Text>
              )}
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  group: { gap: theme.space.md },
  track: {
    flexDirection: "row",
    minHeight: theme.size.controlSmall,
    borderRadius: theme.radius.full,
  },
  thumb: {
    position: "absolute",
    top: inset,
    bottom: inset,
    left: inset,
    borderRadius: theme.radius.full,
    borderWidth: 1,
  },
  segment: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: theme.space.md,
  },
  label: { textAlign: "center" },
  measuring: { opacity: 0 },
});
