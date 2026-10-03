import {
  Children,
  cloneElement,
  isValidElement,
  useEffect,
  type ReactElement,
  type ReactNode,
} from "react";
import {
  Pressable,
  StyleSheet,
  Switch,
  View,
  useWindowDimensions,
} from "react-native";
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";
import { Image } from "expo-image";
import type { SFSymbol } from "expo-symbols";
import type { Piece } from "../domain/closet";
import { Button, type ButtonProps } from "./Button";
import { timing, useAfterWait, useReduceMotion } from "./motion";
import { OutfitCollage } from "./OutfitCollage";
import { photoSource } from "./photos";
import { Symbol } from "./symbol";
import { Text } from "./Text";
import { gutterFor, theme } from "./theme";
import { useColors } from "./useColors";
import { useLargeText } from "./useLargeText";

type Leading =
  | { thumb: Piece }
  | { lay: Piece[]; size?: "row" | "mini" }
  | { swatch: string }
  | { icon: SFSymbol };

export type RowProps = {
  title: string;
  meta?: string;
  leading?: Leading;
  trailing?:
    | "chevron"
    | "down"
    | { value: string }
    | { toggle: boolean; onToggle: (next: boolean) => void; busy?: boolean }
    | { action: ButtonProps }
    | "selected";
  onPress?: () => void;
  below?: ButtonProps;
  checked?: boolean;
  expanded?: boolean;
  accessibilityLabel?: string;
  media?: boolean;
  user?: boolean;
  radio?: boolean;
  last?: boolean;
  testID?: string;
};

const laySize = { row: 72, mini: 56 } as const;

const hidden = {
  accessibilityElementsHidden: true,
  importantForAccessibility: "no-hide-descendants",
} as const;

function leadingWidth(leading: Leading, symbolScale: number): number {
  if ("thumb" in leading) return theme.size.thumb;
  if ("lay" in leading) return laySize[leading.size ?? "row"];
  if ("swatch" in leading) return theme.size.swatch * symbolScale;
  return theme.size.iconBar * symbolScale;
}

function LeadingView({ leading, media }: { leading: Leading; media: boolean }) {
  const colors = useColors();
  const { symbolScale } = useLargeText();

  if ("icon" in leading) {
    return (
      <Symbol
        name={leading.icon}
        size={theme.size.iconBar}
        tone={media ? "onMedia" : "ink"}
      />
    );
  }

  const size = leadingWidth(leading, symbolScale);
  return (
    <View
      accessibilityIgnoresInvertColors
      style={{ width: size, height: size }}
      {...hidden}
    >
      {"thumb" in leading ? (
        <Image
          source={photoSource(leading.thumb.photo)}
          contentFit="contain"
          recyclingKey={leading.thumb.id}
          style={styles.thumb}
        />
      ) : "lay" in leading ? (
        <OutfitCollage pieces={leading.lay} />
      ) : (
        <View
          style={[
            styles.swatch,
            {
              borderRadius: size / 2,
              backgroundColor: leading.swatch,
              borderColor: colors.lineField,
            },
          ]}
        />
      )}
    </View>
  );
}

export function Row({
  title,
  meta,
  leading,
  trailing,
  onPress,
  below,
  checked,
  expanded,
  accessibilityLabel,
  media = false,
  user = false,
  radio = false,
  last = false,
  testID,
}: RowProps) {
  const colors = useColors();
  const reduce = useReduceMotion();
  const { large, ax, symbolScale } = useLargeText();
  const { width: windowWidth } = useWindowDimensions();
  const gutter = gutterFor(windowWidth);
  const press = useSharedValue(0);
  const turn = useSharedValue(expanded ? 1 : 0);

  useEffect(() => {
    const to = expanded ? 1 : 0;
    turn.set(reduce ? to : timing(to, "settle", "silk"));
  }, [expanded, reduce, turn]);

  const pressedColor = media ? colors.plumPressed : colors.sunken;
  const fill = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      press.get(),
      [0, 1],
      [`${pressedColor}00`, pressedColor],
    ),
  }));
  const chevron = useAnimatedStyle(() => ({
    transform: [{ rotate: `${turn.get() * 180}deg` }],
  }));

  const toggle =
    typeof trailing === "object" && "toggle" in trailing ? trailing : undefined;
  const action =
    typeof trailing === "object" && "action" in trailing
      ? trailing.action
      : undefined;
  const value =
    typeof trailing === "object" && "value" in trailing
      ? trailing.value
      : undefined;
  const waited = useAfterWait(Boolean(toggle?.busy));
  const pressable = Boolean(onPress) && !toggle && !action;
  const tone = media ? "onMedia" : "ink";
  const quiet = media ? "onMedia" : "muted";
  const spoken =
    accessibilityLabel ?? [title, meta, value].filter(Boolean).join(", ");
  const layAbove = ax && leading !== undefined && "lay" in leading;
  const textStart =
    leading && !layAbove
      ? leadingWidth(leading, symbolScale) + theme.space.md
      : 0;

  const glyph =
    trailing === "chevron" ? (
      <Symbol name="chevron.right" size={theme.size.iconInline} tone={quiet} />
    ) : trailing === "down" ? (
      <Animated.View style={chevron}>
        <Symbol name="chevron.down" size={theme.size.iconInline} tone={quiet} />
      </Animated.View>
    ) : trailing === "selected" || checked ? (
      <Symbol
        name="checkmark"
        size={theme.size.iconInline}
        tone={tone}
        weight="semibold"
      />
    ) : null;

  const end = toggle ? (
    <Switch
      value={toggle.toggle}
      onValueChange={(next) => {
        if (!toggle.busy) toggle.onToggle(next);
      }}
      disabled={waited}
      trackColor={{ true: colors.plum }}
      hitSlop={{ top: 7, bottom: 7 }}
      accessibilityLabel={spoken}
      accessibilityState={{ busy: toggle.busy, disabled: waited }}
      testID={testID ? `${testID}-toggle` : undefined}
    />
  ) : action ? (
    <Button variant="quiet" size="small" media={media} {...action} />
  ) : value !== undefined && !large ? (
    <Text tone={quiet}>{value}</Text>
  ) : null;

  const text = (
    <View
      style={styles.text}
      accessible={!pressable && !toggle}
      accessibilityLabel={pressable || toggle ? undefined : spoken}
      {...(toggle ? hidden : null)}
    >
      <Text tone={tone} user={user}>
        {title}
      </Text>
      {meta ? (
        <Text role="subhead" tone={quiet}>
          {meta}
        </Text>
      ) : null}
      {value !== undefined && large ? <Text tone={quiet}>{value}</Text> : null}
    </View>
  );

  const line = layAbove ? (
    <View style={styles.stack}>
      <View style={styles.line}>
        <LeadingView leading={leading} media={media} />
        <View style={styles.text} />
        {glyph}
      </View>
      {text}
      {end}
    </View>
  ) : (
    <View style={styles.line}>
      {leading ? <LeadingView leading={leading} media={media} /> : null}
      {text}
      {end}
      {glyph}
    </View>
  );

  return (
    <View style={{ marginHorizontal: -gutter }}>
      {pressable ? (
        <Pressable
          onPress={onPress}
          onPressIn={() => press.set(timing(1, "quick", "silk"))}
          onPressOut={() => press.set(timing(0, "quick", "silk"))}
          accessibilityRole={
            radio ? "radio" : checked !== undefined ? "checkbox" : "button"
          }
          accessibilityLabel={spoken}
          accessibilityState={{
            selected:
              radio || trailing === "selected"
                ? trailing === "selected"
                : undefined,
            checked,
            expanded,
          }}
          accessibilityActions={
            below ? [{ name: "below", label: below.label }] : undefined
          }
          onAccessibilityAction={() => below?.onPress()}
          testID={testID}
        >
          <Animated.View
            style={[styles.row, { paddingHorizontal: gutter }, fill]}
          >
            {line}
          </Animated.View>
        </Pressable>
      ) : (
        <View
          style={[styles.row, { paddingHorizontal: gutter }]}
          testID={testID}
        >
          {line}
        </View>
      )}
      {below ? (
        <View
          style={[
            styles.below,
            {
              paddingLeft: gutter + textStart - theme.space.sm,
              paddingRight: gutter,
            },
          ]}
        >
          <Button variant="quiet" size="small" media={media} {...below} />
        </View>
      ) : null}
      {last || media ? null : (
        <View
          style={[
            styles.separator,
            { left: gutter, right: gutter, backgroundColor: colors.line },
          ]}
        />
      )}
    </View>
  );
}

export function Rows({ children }: { children: ReactNode }) {
  const rows = Children.toArray(children).filter(
    (child): child is ReactElement<RowProps> => isValidElement(child),
  );
  return (
    <View>
      {rows.map((row, index) =>
        index === rows.length - 1 ? cloneElement(row, { last: true }) : row,
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: theme.size.controlRegular,
    justifyContent: "center",
    paddingVertical: theme.space.sm,
  },
  line: { flexDirection: "row", alignItems: "center", gap: theme.space.md },
  stack: { gap: theme.space.sm },
  text: { flex: 1 },
  thumb: {
    width: "100%",
    height: "100%",
    borderRadius: theme.radius.sm,
    borderCurve: "continuous",
  },
  swatch: { flex: 1, borderWidth: 1 },
  below: { alignItems: "flex-start" },
  separator: {
    position: "absolute",
    bottom: 0,
    height: StyleSheet.hairlineWidth,
  },
});
