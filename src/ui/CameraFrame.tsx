import {
  useEffect,
  useId,
  useRef,
  type PropsWithChildren,
  type ReactNode,
} from "react";
import { Pressable, StyleSheet, View, useWindowDimensions } from "react-native";
import Animated, {
  Easing,
  FadeIn,
  FadeOut,
  LayoutAnimationConfig,
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  type SharedValue,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { Frame } from "../domain/closet";
import { t } from "../i18n";
import { announce } from "./announce";
import type { ButtonProps } from "./Button";
import { EmptyState } from "./EmptyState";
import { motion, timing, useReduceMotion } from "./motion";
import { Silk } from "./Silk";
import { Text } from "./Text";
import { gutterFor, theme } from "./theme";
import { useColors } from "./useColors";
import { useLargeText } from "./useLargeText";

export type CameraFrameProps = PropsWithChildren<{
  guide?: string;
  readout?: string;
  outline?: { frame: Frame; state: "searching" | "found" } | null;
  shutter?: { onPress: () => void; disabled: boolean; canvas?: boolean };
  tray?: ReactNode;
  controls?: ReactNode;
  unavailable?: {
    title: string;
    line?: string;
    action: ButtonProps;
    secondary?: ButtonProps;
  };
  full?: boolean;
  testID?: string;
}>;

export type FaceCircleProps = {
  children: ReactNode;
  state: "unavailable" | "find" | "guiding" | "ready" | "taken" | "measuring";
  hold: SharedValue<number>;
  guide: string;
  guideSlotHeight: number;
  label: string;
  onActivate?: () => void;
  faceFound: boolean;
  busyLabel?: string;
  testID?: string;
};

const hidden = {
  accessibilityElementsHidden: true,
  importantForAccessibility: "no-hide-descendants",
} as const;

const crossfade = {
  entering: FadeIn.duration(motion.duration.base)
    .easing(motion.easing.silk)
    .reduceMotion(ReduceMotion.Never),
  exiting: FadeOut.duration(motion.duration.quick)
    .easing(motion.easing.release)
    .reduceMotion(ReduceMotion.Never),
};

const ringWidth = 4;
const ringGap = 6;
const lane = ringGap + ringWidth;

function useLiveGuide(text: string | undefined, quiet: boolean) {
  const said = useRef(text);
  const last = useRef(0);

  useEffect(() => {
    if (quiet) {
      said.current = text;
      return;
    }
    if (!text || text === said.current) return;
    const wait = Math.max(0, last.current + motion.timer.announce - Date.now());
    const id = setTimeout(() => {
      said.current = text;
      last.current = Date.now();
      announce(text, { queue: false });
    }, wait);
    return () => clearTimeout(id);
  }, [text, quiet]);
}

function useSafeHeight(): number {
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  return height - insets.top - insets.bottom;
}

function Outline({
  frame,
  state,
}: {
  frame: Frame;
  state: "searching" | "found";
}) {
  const colors = useColors();
  const reduce = useReduceMotion();
  const x = useSharedValue(frame.x);
  const y = useSharedValue(frame.y);
  const width = useSharedValue(frame.width);
  const height = useSharedValue(frame.height);
  const visible = useSharedValue(0);
  const solid = useSharedValue(state === "found" ? 1 : 0);

  useEffect(() => {
    visible.set(timing(1, "base", "silk"));
  }, [visible]);

  useEffect(() => {
    const move = (value: SharedValue<number>, to: number) =>
      value.set(reduce ? to : timing(to, "quick", "silk"));
    move(x, frame.x);
    move(y, frame.y);
    move(width, frame.width);
    move(height, frame.height);
  }, [
    frame.x,
    frame.y,
    frame.width,
    frame.height,
    reduce,
    x,
    y,
    width,
    height,
  ]);

  useEffect(() => {
    solid.set(
      state === "found"
        ? withTiming(1, {
            duration: motion.timer.dwell,
            easing: Easing.linear,
            reduceMotion: ReduceMotion.Never,
          })
        : timing(0, "quick", "release"),
    );
  }, [state, solid]);

  const box = useAnimatedStyle(() => ({
    width: width.get(),
    height: height.get(),
    opacity: visible.get(),
    transform: [{ translateX: x.get() }, { translateY: y.get() }],
  }));
  const found = useAnimatedStyle(() => ({ opacity: solid.get() }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.outline, box]}
      {...hidden}
    >
      <View style={[styles.halo, { borderColor: colors.ink }]} />
      <View
        style={[
          styles.stroke,
          { borderColor: colors.onMedia, borderStyle: "dashed" },
        ]}
      />
      <Animated.View
        style={[styles.stroke, { borderColor: colors.blush }, found]}
      />
    </Animated.View>
  );
}

function Shutter({
  onPress,
  disabled,
  canvas = false,
}: {
  onPress: () => void;
  disabled: boolean;
  canvas?: boolean;
}) {
  const colors = useColors();
  const on = canvas ? colors.plum : colors.onMedia;
  const off = canvas ? colors.inkDisabled : colors.sunken;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={t("common.takePhoto")}
      accessibilityState={{ disabled }}
      style={styles.shutter}
    >
      <View style={[styles.ring, { borderColor: disabled ? off : on }]}>
        {disabled ? null : (
          <View style={[styles.inner, { backgroundColor: on }]} />
        )}
      </View>
    </Pressable>
  );
}

export function CameraFrame({
  guide,
  readout,
  outline,
  shutter,
  tray,
  controls,
  unavailable,
  full = false,
  testID,
  children,
}: CameraFrameProps) {
  const colors = useColors();
  const { ax } = useLargeText();
  const { width } = useWindowDimensions();
  const safeHeight = useSafeHeight();
  const id = useId();
  const canvas = shutter?.canvas ?? false;
  const tone = canvas ? "ink" : "onMedia";
  useLiveGuide(guide, Boolean(unavailable));

  const ids = {
    frame: `${id}frame`,
    guide: `${id}guide`,
    readout: `${id}readout`,
    shutter: `${id}shutter`,
    tray: `${id}tray`,
    controls: `${id}controls`,
  };

  const ordered = {
    experimental_accessibilityOrder: ax ? Object.values(ids) : undefined,
  };

  const pill = guide ? (
    <View style={[styles.pill, { backgroundColor: colors.scrimPill }]}>
      <LayoutAnimationConfig skipEntering>
        <Animated.View
          key={guide}
          entering={crossfade.entering}
          exiting={crossfade.exiting}
        >
          <Text role="mark" tone="onMedia">
            {guide}
          </Text>
        </Animated.View>
      </LayoutAnimationConfig>
    </View>
  ) : null;

  return (
    <View
      testID={testID}
      style={[styles.root, full && styles.full]}
      {...ordered}
    >
      <View
        nativeID={ids.frame}
        accessibilityIgnoresInvertColors
        style={[
          styles.frame,
          { backgroundColor: colors.ink },
          full && [styles.frameFull, { marginHorizontal: -gutterFor(width) }],
          ax && { minHeight: 0.4 * safeHeight },
        ]}
      >
        {unavailable ? (
          <View style={styles.unavailable}>
            <EmptyState
              media
              title={unavailable.title}
              line={unavailable.line}
              action={unavailable.action}
              secondary={unavailable.secondary}
            />
          </View>
        ) : (
          children
        )}
        {outline && !unavailable ? (
          <Outline frame={outline.frame} state={outline.state} />
        ) : null}
        {!ax && pill ? (
          <View nativeID={ids.guide} style={styles.guideSlot}>
            {pill}
          </View>
        ) : null}
        {!ax && readout ? (
          <View
            nativeID={ids.readout}
            style={[styles.readout, { backgroundColor: colors.scrimPill }]}
          >
            <Text role="mark" tone="onMedia">
              {readout}
            </Text>
          </View>
        ) : null}
      </View>
      {shutter && !unavailable ? (
        <View nativeID={ids.shutter}>
          <Shutter {...shutter} />
        </View>
      ) : null}
      {ax && guide ? (
        <View nativeID={ids.guide}>
          <Text role="subhead" tone={tone}>
            {guide}
          </Text>
        </View>
      ) : null}
      {ax && readout ? (
        <View nativeID={ids.readout}>
          <Text role="subhead" tone={tone}>
            {readout}
          </Text>
        </View>
      ) : null}
      {tray ? <View nativeID={ids.tray}>{tray}</View> : null}
      {controls ? <View nativeID={ids.controls}>{controls}</View> : null}
    </View>
  );
}

export function FaceCircle({
  children,
  state,
  hold,
  guide,
  guideSlotHeight,
  label,
  onActivate,
  faceFound,
  busyLabel,
  testID,
}: FaceCircleProps) {
  const colors = useColors();
  const safeHeight = useSafeHeight();
  const diameter = Math.max(
    0,
    Math.min(theme.size.faceCircle, 0.4 * safeHeight - 2 * lane),
  );
  const box = diameter + 2 * lane;
  const measuring = state === "measuring";
  const live = state !== "unavailable";
  const arc = state === "ready" || state === "taken" || measuring;
  const dashed = useSharedValue(arc ? 0 : 1);
  useLiveGuide(guide, state !== "find" && state !== "guiding");

  useEffect(() => {
    dashed.set(arc ? timing(0, "quick", "release") : timing(1, "base", "silk"));
  }, [arc, dashed]);

  const dashes = useAnimatedStyle(() => ({ opacity: dashed.get() }));
  const firstHalf = useAnimatedStyle(() => ({
    transform: [{ rotate: `${Math.min(hold.get(), 0.5) * 360}deg` }],
  }));
  const secondHalf = useAnimatedStyle(() => ({
    transform: [{ rotate: `${Math.max(hold.get() - 0.5, 0) * 360}deg` }],
  }));

  const half = box / 2;
  const ring = {
    width: box,
    height: box,
    borderRadius: half,
    borderWidth: ringWidth,
  };
  const plumRing = [styles.absolute, ring, { borderColor: colors.plum }];
  const take = faceFound && onActivate ? onActivate : undefined;

  return (
    <View style={styles.face}>
      <Pressable
        onPress={take}
        onMagicTap={take}
        accessible
        accessibilityRole={faceFound && !measuring ? "button" : "image"}
        accessibilityLabel={measuring && busyLabel ? busyLabel : label}
        accessibilityState={{ busy: measuring }}
        accessibilityActions={
          take
            ? [{ name: "takePhoto", label: t("common.takePhoto") }]
            : undefined
        }
        onAccessibilityAction={(event) => {
          if (event.nativeEvent.actionName === "takePhoto") take?.();
        }}
        testID={measuring ? "moment-loading" : testID}
        style={{ width: box, height: box }}
      >
        {live ? (
          <View
            pointerEvents="none"
            style={StyleSheet.absoluteFill}
            {...hidden}
          >
            <Animated.View
              style={[
                styles.absolute,
                ring,
                { borderColor: colors.lineField, borderStyle: "dashed" },
                dashes,
              ]}
            />
            <View
              style={[styles.clip, { left: half, width: half, height: box }]}
            >
              <Animated.View
                style={[
                  styles.absolute,
                  { left: -half, width: box, height: box },
                  firstHalf,
                ]}
              >
                <View style={[styles.clip, { width: half, height: box }]}>
                  <View style={plumRing} />
                </View>
              </Animated.View>
            </View>
            <View style={[styles.clip, { width: half, height: box }]}>
              <Animated.View
                style={[
                  styles.absolute,
                  { width: box, height: box },
                  secondHalf,
                ]}
              >
                <View
                  style={[
                    styles.clip,
                    { left: half, width: half, height: box },
                  ]}
                >
                  <View style={[...plumRing, { left: -half }]} />
                </View>
              </Animated.View>
            </View>
          </View>
        ) : null}
        <View
          accessibilityIgnoresInvertColors
          style={[
            styles.circle,
            {
              top: lane,
              left: lane,
              width: diameter,
              height: diameter,
              borderRadius: diameter / 2,
              backgroundColor: colors.sunken,
            },
          ]}
        >
          {live ? children : null}
          {measuring ? (
            <Silk
              kind="sheen"
              label={busyLabel ?? label}
              style={StyleSheet.absoluteFill}
            >
              {null}
            </Silk>
          ) : null}
        </View>
      </Pressable>
      <View
        style={[styles.feedback, { minHeight: guideSlotHeight }]}
        {...hidden}
      >
        <LayoutAnimationConfig skipEntering>
          <Animated.View
            key={guide}
            entering={crossfade.entering}
            exiting={crossfade.exiting}
          >
            <Text role="headline" style={styles.centred}>
              {guide}
            </Text>
          </Animated.View>
        </LayoutAnimationConfig>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: theme.space.lg },
  full: { flex: 1 },
  frame: {
    borderRadius: theme.radius.lg,
    borderCurve: "continuous",
    overflow: "hidden",
  },
  frameFull: {
    flex: 1,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
  },
  unavailable: { flex: 1, justifyContent: "center", padding: theme.space.lg },
  outline: { position: "absolute", top: 0, left: 0 },
  halo: {
    position: "absolute",
    inset: -1,
    borderWidth: 4,
    borderRadius: 19,
    borderCurve: "continuous",
  },
  stroke: {
    position: "absolute",
    inset: 0,
    borderWidth: 2,
    borderRadius: 18,
    borderCurve: "continuous",
  },
  guideSlot: {
    position: "absolute",
    left: theme.space.lg,
    right: theme.space.lg,
    bottom: theme.space.lg,
    alignItems: "center",
  },
  pill: {
    paddingHorizontal: theme.space.md,
    paddingVertical: theme.space.sm,
    borderRadius: theme.radius.full,
  },
  readout: {
    position: "absolute",
    top: theme.space.sm,
    left: theme.space.sm,
    paddingHorizontal: theme.space.sm,
    paddingVertical: theme.space.xs,
    borderRadius: theme.radius.full,
  },
  shutter: {
    alignSelf: "center",
    width: 76,
    height: 76,
    alignItems: "center",
    justifyContent: "center",
  },
  ring: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  inner: { width: 60, height: 60, borderRadius: 30 },
  face: { alignItems: "center", gap: theme.space.lg },
  absolute: { position: "absolute", top: 0, left: 0 },
  clip: { position: "absolute", top: 0, left: 0, overflow: "hidden" },
  circle: { position: "absolute", overflow: "hidden" },
  feedback: { alignSelf: "stretch" },
  centred: { textAlign: "center" },
});
