import { useEffect, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
} from "react-native";
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";
import type { SFSymbol } from "expo-symbols";
import { timing, useAfterWait, useReduceMotion } from "./motion";
import { Symbol } from "./symbol";
import { Text } from "./Text";
import { gutterFor, theme } from "./theme";
import { useColors } from "./useColors";
import { useLargeText } from "./useLargeText";

export type ChipKind = "choice" | "control" | "action" | "fact";

export type ChipProps = {
  label: string;
  selected?: boolean;
  onPress: () => void;
  swatch?: string;
  kind?: ChipKind;
  opens?: "expander" | "screen";
  tentative?: boolean;
  dot?: boolean;
  key?: string;
  keyLabel?: string;
  accessibilityLabel?: string;
  accessibilityValue?: string;
  role?: "radio" | "checkbox" | "button";
  disabled?: boolean;
  busy?: boolean;
  inSurface?: boolean;
  icon?: "xmark";
  expanded?: boolean;
  testID?: string;
};

const border = 2;

const hidden = {
  accessibilityElementsHidden: true,
  importantForAccessibility: "no-hide-descendants",
} as const;

export function Chip({
  label,
  selected = false,
  onPress,
  swatch,
  kind = "choice",
  opens,
  tentative = false,
  dot = false,
  keyLabel,
  accessibilityLabel,
  accessibilityValue,
  role = "button",
  disabled = false,
  busy = false,
  icon,
  expanded,
  testID,
}: ChipProps) {
  const colors = useColors();
  const reduce = useReduceMotion();
  const { symbolScale } = useLargeText();
  const dim = useAfterWait(disabled);
  const [wrapped, setWrapped] = useState(false);
  const shown = selected && !dim;
  const on = useSharedValue(shown ? 1 : 0);
  const press = useSharedValue(0);
  const turn = useSharedValue(expanded ? 1 : 0);

  useEffect(() => {
    on.set(timing(shown ? 1 : 0, "quick", "silk"));
  }, [shown, on]);

  useEffect(() => {
    const to = expanded ? 1 : 0;
    turn.set(reduce ? to : timing(to, "settle", "silk"));
  }, [expanded, reduce, turn]);

  const { sunken, blush, blushEdge } = colors;
  const pressed = theme.colors.line;
  const fill = useAnimatedStyle(() => {
    const rest = interpolateColor(on.get(), [0, 1], [sunken, blush]);
    const down = interpolateColor(on.get(), [0, 1], [pressed, blush]);
    return {
      backgroundColor: interpolateColor(press.get(), [0, 1], [rest, down]),
      borderColor: interpolateColor(
        on.get(),
        [0, 1],
        [`${blushEdge}00`, blushEdge],
      ),
    };
  });
  const edge = useAnimatedStyle(() => ({ opacity: 1 - on.get() }));
  const chevron = useAnimatedStyle(() => ({
    transform: [{ rotate: `${turn.get() * 180}deg` }],
  }));

  const glyph: SFSymbol | undefined =
    icon === "xmark"
      ? "xmark"
      : kind === "fact" || opens === "expander"
        ? "chevron.down"
        : opens === "screen"
          ? "chevron.right"
          : undefined;
  const radius = wrapped ? theme.radius.md : theme.radius.full;
  const dotSize = 8 * symbolScale;
  const swatchSize = theme.size.swatch * symbolScale;
  const tone = dim ? "disabled" : "ink";

  const pressTo = (to: number) => {
    if (!busy && !disabled) press.set(timing(to, "quick", "silk"));
  };

  return (
    <Pressable
      onPress={() => {
        if (!busy && !disabled) onPress();
      }}
      onPressIn={() => pressTo(1)}
      onPressOut={() => pressTo(0)}
      disabled={disabled}
      accessibilityRole={role}
      accessibilityLabel={
        accessibilityLabel ?? [keyLabel, label].filter(Boolean).join(": ")
      }
      accessibilityValue={
        accessibilityValue ? { text: accessibilityValue } : undefined
      }
      accessibilityState={
        role === "checkbox"
          ? { checked: selected, disabled, busy }
          : {
              selected: kind === "choice" ? selected : undefined,
              disabled,
              busy,
              expanded,
            }
      }
      testID={testID}
      style={styles.target}
    >
      <Animated.View style={[styles.chip, { borderRadius: radius }, fill]}>
        <Animated.View
          pointerEvents="none"
          style={[
            styles.edge,
            {
              borderRadius: radius - border,
              borderColor: colors.lineField,
            },
            edge,
          ]}
        />
        {tentative || dot ? (
          <View
            style={{
              width: dotSize,
              height: dotSize,
              borderRadius: dotSize / 2,
              backgroundColor: colors.plum,
            }}
            {...hidden}
          />
        ) : null}
        {swatch ? (
          <View
            accessibilityIgnoresInvertColors
            style={[
              styles.swatch,
              {
                width: swatchSize,
                height: swatchSize,
                borderRadius: swatchSize / 2,
                backgroundColor: swatch,
                borderColor: colors.ink,
              },
            ]}
            {...hidden}
          />
        ) : null}
        {label ? (
          <Text
            role="subhead"
            tone={tone}
            maxFontSizeMultiplier={2}
            style={styles.label}
            onTextLayout={(event) =>
              setWrapped(event.nativeEvent.lines.length > 1)
            }
          >
            {keyLabel ? (
              <Text role="subhead" tone="placeholder">
                {`${keyLabel} `}
              </Text>
            ) : null}
            {label}
          </Text>
        ) : null}
        {glyph ? (
          <Animated.View style={glyph === "chevron.down" ? chevron : null}>
            <Symbol
              name={glyph}
              size={13}
              tone={shown ? "ink" : "muted"}
              weight="semibold"
            />
          </Animated.View>
        ) : null}
      </Animated.View>
    </Pressable>
  );
}

export type ChipRowProps<T extends string> = {
  label?: string;
  options: {
    id: T;
    label: string;
    swatch?: string;
    accessibilityLabel?: string;
  }[];
  value: T | T[] | null;
  onChange: (next: T | T[] | null) => void;
  layout?: "wrap" | "scroll";
  keepScroll?: boolean;
  multi?: boolean;
  optional?: boolean;
  reselect?: boolean;
  inSurface?: boolean;
  testID?: string;
};

export function ChipRow<T extends string>({
  label,
  options,
  value,
  onChange,
  layout = "wrap",
  keepScroll = false,
  multi = false,
  optional = false,
  reselect = false,
  inSurface,
  testID,
}: ChipRowProps<T>) {
  const { ax } = useLargeText();
  const { width: windowWidth } = useWindowDimensions();
  const gutter = gutterFor(windowWidth);
  const [scrollWidth, setScrollWidth] = useState(0);
  const scroll = layout === "scroll" && (!ax || keepScroll);
  const role = multi ? "checkbox" : optional ? "button" : "radio";
  const chosen = (id: T) =>
    Array.isArray(value) ? value.includes(id) : value === id;

  const pick = (id: T) => {
    if (multi) {
      const list = Array.isArray(value) ? value : [];
      onChange(
        list.includes(id) ? list.filter((item) => item !== id) : [...list, id],
      );
    } else if (optional || reselect || value !== id) {
      onChange(optional && value === id ? null : id);
    }
  };

  const chips = options.map((option) => (
    <View
      key={option.id}
      style={
        scroll && scrollWidth > 0
          ? { maxWidth: scrollWidth - gutter }
          : styles.wrapItem
      }
    >
      <Chip
        label={option.label}
        swatch={option.swatch}
        accessibilityLabel={option.accessibilityLabel}
        selected={chosen(option.id)}
        role={role}
        inSurface={inSurface}
        onPress={() => pick(option.id)}
        testID={testID ? `${testID}-${option.id}` : undefined}
      />
    </View>
  ));

  const group = {
    accessibilityRole: role === "radio" ? ("radiogroup" as const) : undefined,
    accessibilityLabel: label,
  };

  return (
    <View style={styles.group} testID={testID}>
      {label ? <Text role="headline">{label}</Text> : null}
      {scroll ? (
        <ScrollView
          {...group}
          horizontal
          showsHorizontalScrollIndicator={false}
          onLayout={(event) => setScrollWidth(event.nativeEvent.layout.width)}
          style={{ marginRight: -gutter }}
          contentContainerStyle={[styles.row, { paddingRight: gutter }]}
        >
          {chips}
        </ScrollView>
      ) : (
        <View {...group} style={[styles.row, ax ? styles.stack : styles.wrap]}>
          {chips}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  target: { maxWidth: "100%" },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    minHeight: theme.size.controlSmall,
    minWidth: theme.size.controlSmall,
    paddingVertical: theme.space.sm - border,
    paddingHorizontal: theme.space.lg - border,
    borderWidth: border,
    borderCurve: "continuous",
  },
  edge: { position: "absolute", inset: 0, borderWidth: 1 },
  swatch: { borderWidth: 1 },
  label: { flexShrink: 1 },
  group: { gap: theme.space.md },
  row: { flexDirection: "row", gap: theme.space.sm },
  wrap: { flexWrap: "wrap" },
  stack: { flexDirection: "column", alignItems: "flex-start" },
  wrapItem: { maxWidth: "100%" },
});
