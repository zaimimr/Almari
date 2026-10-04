import { useEffect, type Ref } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Animated, {
  FadeIn,
  FadeOut,
  LayoutAnimationConfig,
  ReduceMotion,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";
import { Image, type ImageSource } from "expo-image";
import type { Piece } from "../domain/closet";
import { t } from "../i18n";
import { Button } from "./Button";
import { motion, timing } from "./motion";
import { photoSource } from "./photos";
import { Silk } from "./Silk";
import { Symbol } from "./symbol";
import { Text } from "./Text";
import { theme } from "./theme";
import { useColors } from "./useColors";
import { useLargeText } from "./useLargeText";

export type TileState =
  | "queued"
  | "preparing"
  | "ready"
  | "needsAnswers"
  | "failed"
  | "removed"
  | "putAway";

export type TileProps = {
  image: Piece | ImageSource;
  label?: string;
  meta?: string;
  size: "hero" | "grid" | "strip" | "thumb";
  selected?: boolean;
  planned?: { short: string; spoken: string };
  colour?: {
    hex: string;
    name: string;
    onPress?: () => void;
    expanded?: boolean;
  };
  state?: TileState;
  tint?: string;
  dot?: boolean;
  onPress?: () => void;
  onLongPress?: () => void;
  actions?: { name: string; label: string; onPress: () => void }[];
  accessibilityLabel: string;
  selectedLabel?: string;
  busyLabel?: string;
  raw?: boolean;
  testID?: string;
  onRetry?: () => void;
  onUndoRemove?: () => void;
  ref?: Ref<View>;
};

const discSize = 22;
const checkSize = 13;
const dotSize = 8;

const hidden = {
  accessibilityElementsHidden: true,
  importantForAccessibility: "no-hide-descendants",
} as const;

const crossfade = {
  entering: FadeIn.duration(motion.duration.base)
    .easing(motion.easing.silk)
    .reduceMotion(ReduceMotion.Never),
  exiting: FadeOut.duration(motion.duration.base)
    .easing(motion.easing.silk)
    .reduceMotion(ReduceMotion.Never),
};

const isPiece = (image: Piece | ImageSource): image is Piece =>
  typeof image === "object" && "photo" in image && "id" in image;

export function Tile({
  image,
  label,
  meta,
  size,
  selected,
  planned,
  colour,
  state = "ready",
  tint,
  dot = false,
  onPress,
  onLongPress,
  actions,
  accessibilityLabel,
  selectedLabel,
  busyLabel,
  raw = false,
  testID,
  onRetry,
  onUndoRemove,
  ref,
}: TileProps) {
  const colors = useColors();
  const { large, ax, fontScale, symbolScale } = useLargeText();
  const press = useSharedValue(0);
  const on = useSharedValue(selected ? 1 : 0);

  useEffect(() => {
    on.set(timing(selected ? 1 : 0, "quick", selected ? "silk" : "release"));
  }, [selected, on]);

  const pressed = colors.sunken;
  const fill = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      press.get(),
      [0, 1],
      [`${pressed}00`, pressed],
    ),
  }));
  const shown = useAnimatedStyle(() => ({ opacity: on.get() }));

  const thumb = size === "thumb";
  const waiting = state === "queued" || state === "preparing";
  const pressable = Boolean(onPress || onLongPress) && state !== "removed";
  const mark = planned && !selected ? planned : undefined;
  const marker = dot || state === "needsAnswers";
  const disc = discSize * symbolScale;
  const lineHeight = theme.type.subhead.lineHeight * fontScale;
  const spoken =
    state === "preparing" && busyLabel
      ? busyLabel
      : [accessibilityLabel, mark?.spoken].filter(Boolean).join(", ");
  const source = isPiece(image) ? photoSource(image.photo) : image;
  const recyclingKey = isPiece(image) ? image.id : undefined;

  const picture = (
    <Animated.View
      key={raw ? "raw" : "cut"}
      entering={crossfade.entering}
      exiting={crossfade.exiting}
      style={StyleSheet.absoluteFill}
    >
      {raw ? (
        <Image
          source={source}
          contentFit="cover"
          tintColor={tint}
          recyclingKey={recyclingKey}
          style={[StyleSheet.absoluteFill, styles.frame]}
        />
      ) : (
        <View style={styles.cut} shouldRasterizeIOS={size === "grid"}>
          <Image
            source={source}
            contentFit="contain"
            tintColor={tint}
            recyclingKey={recyclingKey}
            style={StyleSheet.absoluteFill}
          />
        </View>
      )}
    </Animated.View>
  );

  const box = (
    <View
      accessibilityIgnoresInvertColors
      style={[styles.box, thumb ? styles.thumb : styles.portrait]}
    >
      <Animated.View style={[StyleSheet.absoluteFill, styles.frame, fill]} />
      {state === "removed" ? null : state === "queued" ? (
        <Silk
          kind="placeholder"
          shape="tile"
          label={spoken}
          style={StyleSheet.absoluteFill}
        />
      ) : (
        picture
      )}
      {state === "preparing" ? (
        <Silk
          kind="sheen"
          label={spoken}
          style={[StyleSheet.absoluteFill, styles.frame]}
        >
          {null}
        </Silk>
      ) : null}
      {mark && !ax ? (
        <View style={styles.markSlot} {...hidden}>
          <View style={[styles.capsule, { backgroundColor: colors.blush }]}>
            <Text role="mark">{mark.short}</Text>
          </View>
        </View>
      ) : null}
      {thumb ? null : (
        <Animated.View
          style={[
            styles.disc,
            {
              width: disc,
              height: disc,
              borderRadius: disc / 2,
              backgroundColor: colors.blush,
              borderColor: colors.blushStrong,
            },
            shown,
          ]}
          {...hidden}
        >
          <Symbol
            name="checkmark"
            size={checkSize}
            tone="ink"
            weight="semibold"
          />
        </Animated.View>
      )}
    </View>
  );

  const lead = (diameter: number) => ({
    width: diameter,
    height: diameter,
    borderRadius: diameter / 2,
    marginTop: Math.max(0, (lineHeight - diameter) / 2),
  });

  const swatch = (hex: string, inline: boolean) => (
    <View
      style={[
        styles.swatch,
        lead(theme.size.swatch * symbolScale),
        !inline && { marginTop: 0 },
        { backgroundColor: hex, borderColor: colors.lineField },
      ]}
      accessibilityIgnoresInvertColors
      {...hidden}
    />
  );

  const words = thumb ? null : waiting ? (
    <View style={{ minHeight: lineHeight + theme.size.controlSmall }}>
      <Silk kind="placeholder" shape="text" label={spoken} />
    </View>
  ) : state === "removed" ? null : (
    <>
      {label ? (
        <View style={[styles.line, mark && ax && styles.wrap]}>
          {mark && ax ? (
            <View
              style={[styles.capsule, { backgroundColor: colors.blush }]}
              {...hidden}
            >
              <Text role="subhead">{mark.short}</Text>
            </View>
          ) : null}
          {marker ? (
            <View
              style={[
                lead(dotSize * symbolScale),
                { backgroundColor: colors.plum },
              ]}
              {...hidden}
            />
          ) : colour && !colour.onPress ? (
            swatch(colour.hex, true)
          ) : null}
          <Text
            role="subhead"
            numberOfLines={large ? undefined : 2}
            style={styles.label}
          >
            {label}
          </Text>
        </View>
      ) : null}
      {meta ? (
        state === "failed" ? (
          <Text role="footnote" tone="error">
            {meta}
          </Text>
        ) : (
          <Text role="subhead" tone="muted">
            {meta}
          </Text>
        )
      ) : null}
    </>
  );

  return (
    <LayoutAnimationConfig skipEntering>
      <View
        style={[
          size === "strip" && styles.strip,
          size === "grid" && styles.grid,
          thumb && styles.thumb,
        ]}
      >
        {state === "removed" ? (
          <>
            {box}
            <View style={styles.words}>
              <Text role="subhead" tone="muted">
                {t("result.removed")}
              </Text>
              {onUndoRemove ? (
                <View style={styles.start}>
                  <Button
                    variant="quiet"
                    label={t("common.undo")}
                    onPress={onUndoRemove}
                  />
                </View>
              ) : null}
            </View>
          </>
        ) : (
          <Pressable
            ref={ref}
            onPress={onPress}
            onLongPress={onLongPress}
            onPressIn={() => {
              if (pressable) press.set(timing(1, "quick", "silk"));
            }}
            onPressOut={() => press.set(timing(0, "quick", "silk"))}
            hitSlop={
              thumb && pressable
                ? (theme.size.touch - theme.size.thumb) / 2
                : undefined
            }
            accessible
            accessibilityRole={pressable ? "button" : "image"}
            accessibilityLabel={spoken}
            accessibilityValue={
              selectedLabel ? { text: selectedLabel } : undefined
            }
            accessibilityState={{
              selected,
              busy: waiting,
              expanded: colour?.onPress ? Boolean(colour.expanded) : undefined,
            }}
            accessibilityActions={actions?.map(({ name, label: text }) => ({
              name,
              label: text,
            }))}
            onAccessibilityAction={(event) =>
              actions
                ?.find((action) => action.name === event.nativeEvent.actionName)
                ?.onPress()
            }
            testID={state === "preparing" ? "moment-generating" : testID}
          >
            {box}
            {words ? (
              <Animated.View
                key={waiting ? "wait" : "done"}
                entering={crossfade.entering}
                style={styles.words}
              >
                {words}
              </Animated.View>
            ) : null}
          </Pressable>
        )}
        {colour?.onPress && !waiting && state !== "removed" ? (
          <Animated.View entering={crossfade.entering}>
            <Pressable
              onPress={colour.onPress}
              accessibilityRole="button"
              accessibilityHint={t("common.editColourHint")}
              accessibilityState={{ expanded: colour.expanded }}
              style={styles.colourLine}
            >
              {swatch(colour.hex, false)}
              <Text role="subhead" style={styles.label}>
                {t("capture.colourLabel", { colour: colour.name })}
              </Text>
            </Pressable>
          </Animated.View>
        ) : null}
        {state === "failed" && onRetry ? (
          <View style={styles.start}>
            <Button
              variant="quiet"
              label={t("common.tryAgain")}
              onPress={onRetry}
            />
          </View>
        ) : null}
      </View>
    </LayoutAnimationConfig>
  );
}

const styles = StyleSheet.create({
  strip: { width: 112 },
  grid: { flex: 1, minWidth: 0 },
  thumb: {
    width: theme.size.thumb,
    height: theme.size.thumb,
    borderRadius: theme.radius.sm,
  },
  box: { borderCurve: "continuous" },
  portrait: { width: "100%", aspectRatio: 4 / 5 },
  frame: {
    borderRadius: theme.radius.print,
    borderCurve: "continuous",
    overflow: "hidden",
  },
  cut: {
    position: "absolute",
    top: "3%",
    left: "3%",
    right: "3%",
    bottom: "3%",
  },
  markSlot: {
    position: "absolute",
    top: theme.space.sm,
    left: theme.space.sm,
    right: theme.space.sm,
    alignItems: "flex-start",
  },
  capsule: {
    paddingHorizontal: theme.space.sm,
    paddingVertical: 2,
    borderRadius: theme.radius.full,
  },
  disc: {
    position: "absolute",
    top: theme.space.sm,
    right: theme.space.sm,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
  },
  words: { marginTop: theme.space.sm },
  line: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
  },
  wrap: { flexWrap: "wrap" },
  label: { flexShrink: 1 },
  swatch: { borderWidth: 1 },
  colourLine: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.space.sm,
    minHeight: theme.size.controlSmall,
  },
  start: { alignItems: "flex-start" },
});
