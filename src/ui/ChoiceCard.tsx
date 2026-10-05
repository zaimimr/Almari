import { useEffect } from "react";
import { Pressable, StyleSheet, View, useWindowDimensions } from "react-native";
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Image, type ImageSource } from "expo-image";
import { t } from "../i18n";
import { announce } from "./announce";
import { Chip } from "./Chip";
import { timing } from "./motion";
import { Symbol } from "./symbol";
import { Text } from "./Text";
import { theme } from "./theme";
import { useColors } from "./useColors";
import { useLargeText } from "./useLargeText";

export type ChoiceOption<T extends string> = {
  id: T;
  label: string;
  image?: ImageSource;
  description?: string;
  bust?: boolean;
};

const discSize = 22;
const checkSize = 13;

const hidden = {
  accessibilityElementsHidden: true,
  importantForAccessibility: "no-hide-descendants",
} as const;

function ChoiceCard<T extends string>({
  option,
  selected,
  multi,
  artHeight,
  onPress,
  testID,
}: {
  option: ChoiceOption<T>;
  selected: boolean;
  multi: boolean;
  artHeight: number | null;
  onPress: () => void;
  testID?: string;
}) {
  const colors = useColors();
  const { symbolScale } = useLargeText();
  const press = useSharedValue(0);
  const on = useSharedValue(selected ? 1 : 0);

  useEffect(() => {
    on.set(timing(selected ? 1 : 0, "quick", selected ? "silk" : "release"));
  }, [selected, on]);

  const { sunken } = colors;
  const fill = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      press.get(),
      [0, 1],
      [`${sunken}00`, sunken],
    ),
  }));
  const shown = useAnimatedStyle(() => ({ opacity: on.get() }));
  const disc = discSize * symbolScale;
  const ax = artHeight !== null;

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => press.set(timing(1, "quick", "silk"))}
      onPressOut={() => press.set(timing(0, "quick", "silk"))}
      accessibilityRole={multi ? "checkbox" : "radio"}
      accessibilityLabel={[option.label, option.description]
        .filter(Boolean)
        .join(", ")}
      accessibilityState={multi ? { checked: selected } : { selected }}
      testID={testID}
      style={styles.card}
    >
      <Animated.View style={[StyleSheet.absoluteFill, styles.frame, fill]} />
      <View
        accessibilityIgnoresInvertColors
        style={[
          styles.frame,
          styles.art,
          { backgroundColor: colors.paper },
          ax ? { height: artHeight } : styles.portrait,
        ]}
        {...hidden}
      >
        {option.image ? (
          <Image
            source={option.image}
            transition={0}
            contentFit={ax && !option.bust ? "contain" : "cover"}
            contentPosition={ax && option.bust ? { top: "8%" } : undefined}
            style={[StyleSheet.absoluteFill, option.bust && !ax && styles.bust]}
          />
        ) : null}
        <Animated.View
          style={[
            styles.disc,
            {
              width: disc,
              height: disc,
              borderRadius: disc / 2,
              backgroundColor: colors.blush,
              borderColor: colors.blushEdge,
            },
            shown,
          ]}
        >
          <Symbol
            name="checkmark"
            size={checkSize}
            tone="ink"
            weight="semibold"
          />
        </Animated.View>
      </View>
      <Text role="subhead" style={styles.label}>
        {option.label}
      </Text>
    </Pressable>
  );
}

export function ChoiceCardGroup<T extends string>({
  label,
  options,
  plain,
  value,
  onChange,
  multi = false,
  exclusive,
  plainFirst = false,
  testID,
}: {
  label?: string;
  options: ChoiceOption<T>[];
  plain?: { id: T; label: string }[];
  value: T | T[] | null;
  onChange: (next: T | T[] | null) => void;
  multi?: boolean;
  exclusive?: T;
  plainFirst?: boolean;
  testID?: string;
}) {
  const { ax } = useLargeText();
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const chosen = Array.isArray(value) ? value : value === null ? [] : [value];
  const artHeight = ax
    ? Math.min(240, 0.3 * (height - insets.top - insets.bottom))
    : null;

  const pick = (id: T) => {
    if (!multi) {
      if (value !== id) onChange(id);
      return;
    }
    const next = chosen.includes(id)
      ? chosen.filter((item) => item !== id)
      : id === exclusive
        ? [id]
        : [...chosen.filter((item) => item !== exclusive), id];
    const cleared = chosen.filter(
      (item) => item !== id && !next.includes(item),
    ).length;
    onChange(next);
    if (cleared > 0) {
      announce(
        cleared === 1
          ? t("choice.clearedOne")
          : t("choice.clearedMany", { count: cleared }),
      );
    }
  };

  const card = (option: ChoiceOption<T>) => (
    <ChoiceCard
      key={option.id}
      option={option}
      selected={chosen.includes(option.id)}
      multi={multi}
      artHeight={artHeight}
      onPress={() => pick(option.id)}
      testID={testID ? `${testID}-${option.id}` : undefined}
    />
  );

  const chips =
    plain && plain.length > 0 ? (
      <View style={styles.chips}>
        {plain.map((option) => (
          <View key={option.id} style={styles.chip}>
            <Chip
              label={option.label}
              selected={chosen.includes(option.id)}
              role={multi ? "checkbox" : "radio"}
              onPress={() => pick(option.id)}
              testID={testID ? `${testID}-${option.id}` : undefined}
            />
          </View>
        ))}
      </View>
    ) : null;

  const rows = ax
    ? options.map((option) => [option])
    : options.flatMap((option, index) =>
        index % 2 === 0 ? [options.slice(index, index + 2)] : [],
      );

  return (
    <View
      accessibilityRole={multi ? undefined : "radiogroup"}
      style={styles.group}
      testID={testID}
    >
      {label ? <Text role="headline">{label}</Text> : null}
      {plainFirst ? chips : null}
      <View style={styles.grid}>
        {rows.map((row) => (
          <View key={row.map(({ id }) => id).join()} style={styles.row}>
            {row.map(card)}
            {!ax && row.length === 1 ? <View style={styles.card} /> : null}
          </View>
        ))}
      </View>
      {plainFirst ? null : chips}
    </View>
  );
}

const styles = StyleSheet.create({
  group: { gap: theme.space.lg },
  grid: { gap: theme.space.md },
  row: { flexDirection: "row", alignItems: "flex-start", gap: theme.space.lg },
  card: { flex: 1, minWidth: 0 },
  frame: { borderRadius: theme.radius.print, borderCurve: "continuous" },
  art: { overflow: "hidden" },
  portrait: { aspectRatio: 3 / 4 },
  bust: { transform: [{ scale: 1.8 }], transformOrigin: "50% 12%" },
  disc: {
    position: "absolute",
    top: theme.space.sm,
    right: theme.space.sm,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
  },
  label: { marginTop: theme.space.sm },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: theme.space.sm },
  chip: { maxWidth: "100%" },
});
