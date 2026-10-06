import { useCallback, useEffect, useId, useRef, useState } from "react";
import {
  Pressable,
  StyleSheet,
  View,
  useWindowDimensions,
  type AccessibilityProps,
  type ImageStyle,
  type StyleProp,
} from "react-native";
import Animated, {
  FadeOut,
  LayoutAnimationConfig,
  ReduceMotion,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  type SharedValue,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
import { Image } from "expo-image";
import type { Category, Piece } from "../domain/closet";
import { roleOf, type Role } from "../domain/styling";
import { t } from "../i18n";
import { arrangePieces } from "./flatLayLayout";
import { motion, timing, useReduceMotion } from "./motion";
import { photoSource } from "./photos";
import sampleFrames from "./sample-frames.json";
import { useSheen } from "./SheenClock";
import { Silk } from "./Silk";
import { Symbol } from "./symbol";
import { theme } from "./theme";
import { useColors } from "./useColors";
import { useLargeText } from "./useLargeText";

export type FlatLayProps = {
  pieces: Piece[];
  size: "hero" | "row" | "mini";
  keptIds?: string[];
  onPiecePress?: (piece: Piece) => void;
  openId?: string | null;
  state?: "arranging" | "loading";
  swapMark?: boolean;
  emptyRoles?: Role[];
  onEmptyPress?: (role: Role) => void;
  preview?: boolean;
  hiddenPieces?: boolean;
  revision?: number;
  order?: string[];
  accessibilityLabel?: string;
  labelFor?: (piece: Piece) => string;
  hintFor?: (piece: Piece) => string | undefined;
  testID?: string;
  maxSize?: number;
};

type Laid = ReturnType<typeof arrangePieces>[number];

type Phase = "still" | "in" | "out";

type Swap = {
  revision?: number;
  slots: Record<string, Piece>;
  changed: string[];
  outgoing: { laid: Laid; delay: number }[];
};

const sides = { row: 72, mini: 56 } as const;
const markDisc = 26;
const markCap = 1.35;
const gleamPeak = 0.35;

const dressing: Record<Role, number> = {
  main: 0,
  bottom: 1,
  under: 1,
  layer: 2,
  outer: 2,
  shoes: 3,
  hijab: 4,
  bag: 5,
  accessory: 5,
};

const slotCategory: Record<Role, Category> = {
  main: "top",
  bottom: "bottom",
  under: "bottom",
  layer: "layer",
  outer: "layer",
  shoes: "shoes",
  hijab: "hijab",
  bag: "bag",
  accessory: "accessory",
};

const hidden = {
  accessibilityElementsHidden: true,
  importantForAccessibility: "no-hide-descendants",
} as const;

function slotsOf(pieces: Piece[]): Record<string, Piece> {
  const counts: Partial<Record<Role, number>> = {};
  return Object.fromEntries(
    pieces.map((piece) => {
      const role = roleOf(piece);
      const index = counts[role] ?? 0;
      counts[role] = index + 1;
      return [`${role}-${index}`, piece];
    }),
  );
}

const rankOf = (slot: string) => dressing[slot.split("-")[0] as Role];

function fit(laid: Laid, side: number) {
  const frame =
    laid.piece.frame ??
    sampleFrames[laid.piece.photo as keyof typeof sampleFrames];
  const slotWidth = laid.width * side;
  const slotHeight = laid.height * side;
  const scale = frame
    ? Math.min(slotWidth / frame.width, slotHeight / frame.height)
    : 0;
  const width = frame ? frame.width * scale : slotWidth;
  const height = frame ? frame.height * scale : slotHeight;
  const image: StyleProp<ImageStyle> = frame
    ? {
        position: "absolute",
        left: -frame.x * scale,
        top: -frame.y * scale,
        width: scale,
        height: scale,
      }
    : StyleSheet.absoluteFill;
  return {
    box: {
      left: laid.x * side + (slotWidth - width) / 2,
      top: laid.y * side + (slotHeight - height) / 2,
      width,
      height,
    },
    image,
    contentFit: frame ? ("fill" as const) : ("contain" as const),
  };
}

function Gleam({
  laid,
  side,
  origin,
}: {
  laid: Laid;
  side: number;
  origin: SharedValue<number>;
}) {
  const { progress, pulse, reduce } = useSheen();
  const { width: windowWidth } = useWindowDimensions();
  const { box, image, contentFit } = fit(laid, side);

  const light = useAnimatedStyle(() => {
    if (reduce) return { opacity: pulse.get() * gleamPeak };
    const band = side * 0.4;
    const start = interpolate(
      progress.get(),
      [0, 1],
      [-1.6 * band, windowWidth + 1.1 * band],
    );
    const left = origin.get() + box.left;
    const overlap =
      Math.min(start + band, left + box.width) - Math.max(start, left);
    return {
      opacity:
        (gleamPeak * Math.max(0, overlap)) / Math.min(band, box.width || 1),
    };
  });

  return (
    <Animated.View
      pointerEvents="none"
      exiting={FadeOut.duration(
        motion.duration[reduce ? "base" : "quick"],
      ).reduceMotion(ReduceMotion.Never)}
      style={[StyleSheet.absoluteFill, styles.crop, light]}
      {...hidden}
    >
      <Image
        source={photoSource(laid.piece.photo)}
        contentFit={contentFit}
        tintColor={theme.brand.sheen}
        style={image}
      />
    </Animated.View>
  );
}

function LaidPiece({
  laid,
  side,
  elevated,
  phase,
  delay,
  onGone,
  gleam,
  origin,
  mark,
  kept,
  nativeID,
  onPress,
  access,
}: {
  laid: Laid;
  side: number;
  elevated: boolean;
  phase: Phase;
  delay: number;
  onGone: (id: string) => void;
  gleam: boolean;
  origin: SharedValue<number>;
  mark: boolean;
  kept: boolean;
  nativeID?: string;
  onPress?: () => void;
  access: AccessibilityProps;
}) {
  const colors = useColors();
  const reduce = useReduceMotion();
  const { symbolScale } = useLargeText();
  const lift = useSharedValue(0);
  const shown = useSharedValue(phase === "in" ? 0 : 1);
  const drop = useSharedValue(phase === "in" && !reduce ? -6 : 0);
  const ghost = phase === "out";
  const id = laid.piece.id;
  const { box, image, contentFit } = fit(laid, side);
  const slopX = Math.max(0, (theme.size.touch - box.width) / 2);
  const slopY = Math.max(0, (theme.size.touch - box.height) / 2);
  const scale = Math.min(symbolScale, markCap);
  const disc = markDisc * scale;
  const raised = theme.elevation.lift;
  const inset = { top: box.height * 0.08, right: box.width * 0.08 };
  const badge = (name: "arrow.2.squarepath" | "pin.fill", at: object) => (
    <View
      style={[
        styles.mark,
        at,
        {
          width: disc,
          height: disc,
          borderRadius: disc / 2,
          backgroundColor: colors.canvas,
        },
      ]}
      {...hidden}
    >
      <Symbol
        name={name}
        size={(theme.size.iconInline * scale) / symbolScale}
        tone="plum"
      />
    </View>
  );

  useEffect(() => {
    if (phase === "still") return;
    const arriving = phase === "in";
    const gone = (finished?: boolean) => {
      "worklet";
      if (finished && !arriving) scheduleOnRN(onGone, id);
    };
    if (reduce) {
      drop.set(0);
      shown.set(timing(arriving ? 1 : 0, "base", "silk", gone));
      return;
    }
    shown.set(
      withDelay(
        delay,
        arriving
          ? timing(1, "arrange", "fall")
          : timing(0, "quick", "release", gone),
        ReduceMotion.Never,
      ),
    );
    drop.set(
      withDelay(
        delay,
        arriving
          ? timing(0, "arrange", "fall")
          : timing(-4, "quick", "release"),
        ReduceMotion.Never,
      ),
    );
  }, [phase, delay, reduce, id, onGone, shown, drop]);

  const travel = useAnimatedStyle(() => ({
    opacity: shown.get(),
    transform: [{ translateY: drop.get() }],
  }));

  const shadow = useAnimatedStyle(() => ({
    shadowOpacity: interpolate(lift.get(), [0, 1], [0, raised.shadowOpacity]),
    shadowRadius: interpolate(lift.get(), [0, 1], [0, raised.shadowRadius]),
    shadowOffset: {
      width: 0,
      height: interpolate(lift.get(), [0, 1], [0, raised.shadowOffset.height]),
    },
  }));

  return (
    <Animated.View
      pointerEvents={ghost ? "none" : "box-none"}
      style={[styles.piece, box, { zIndex: laid.depth }, travel]}
      {...(ghost ? hidden : null)}
    >
      <Pressable
        nativeID={ghost ? undefined : nativeID}
        testID={ghost ? undefined : `outfit-piece-${id}`}
        onPress={ghost ? undefined : onPress}
        onPressIn={() => {
          if (onPress) lift.set(reduce ? 1 : timing(1, "base", "silk"));
        }}
        onPressOut={() => {
          if (onPress) lift.set(reduce ? 0 : timing(0, "settle", "fall"));
        }}
        hitSlop={{ left: slopX, right: slopX, top: slopY, bottom: slopY }}
        style={StyleSheet.absoluteFill}
        {...(ghost ? hidden : access)}
      >
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            elevated && { shadowColor: raised.shadowColor },
            elevated && onPress && shadow,
          ]}
        >
          <View style={[StyleSheet.absoluteFill, styles.crop]}>
            <Image
              source={photoSource(laid.piece.photo)}
              contentFit={contentFit}
              recyclingKey={laid.piece.id}
              style={image}
            />
          </View>
        </Animated.View>
        {gleam && !ghost ? (
          <Gleam laid={laid} side={side} origin={origin} />
        ) : null}
        {mark ? badge("arrow.2.squarepath", inset) : null}
        {kept
          ? badge("pin.fill", {
              top: inset.top,
              left: (box.width - disc) / 2,
            })
          : null}
      </Pressable>
    </Animated.View>
  );
}

export function FlatLay({
  pieces,
  size,
  keptIds = [],
  onPiecePress,
  openId,
  state,
  swapMark = false,
  emptyRoles = [],
  onEmptyPress,
  preview = false,
  hiddenPieces = false,
  revision,
  order,
  accessibilityLabel,
  labelFor,
  hintFor,
  testID,
  maxSize,
}: FlatLayProps) {
  const colors = useColors();
  const reduce = useReduceMotion();
  const prefix = useId();
  const viewport = useRef<View>(null);
  const origin = useSharedValue(0);
  const [width, setWidth] = useState(0);
  const hero = size === "hero";
  const side = hero ? width : sides[size];

  const slots = slotsOf(pieces);
  const [swap, setSwap] = useState<Swap>({
    revision,
    slots,
    changed: [],
    outgoing: [],
  });
  const moved = Object.keys({ ...swap.slots, ...slots }).filter(
    (key) => swap.slots[key]?.id !== slots[key]?.id,
  );
  const ids = new Set(pieces.map((piece) => piece.id));
  const stagger = (changed: string[], key: string, after: number) =>
    reduce ? 0 : (changed.indexOf(key) + after) * motion.timer.step;
  if (swap.revision !== revision || (moved.length > 0 && !hero)) {
    setSwap({ revision, slots, changed: [], outgoing: [] });
  } else if (moved.length > 0) {
    const before = arrangePieces(Object.values(swap.slots));
    const changed = [...moved].sort((a, b) => rankOf(a) - rankOf(b));
    const leaving = changed.flatMap((key) => {
      const old = swap.slots[key];
      const laid = before.find((item) => item.piece.id === old?.id);
      return laid && !ids.has(laid.piece.id)
        ? [{ laid, delay: stagger(changed, key, 0) }]
        : [];
    });
    setSwap({
      revision,
      slots,
      changed,
      outgoing: [
        ...swap.outgoing.filter(
          ({ laid }) =>
            !ids.has(laid.piece.id) &&
            !leaving.some((item) => item.laid.piece.id === laid.piece.id),
        ),
        ...leaving,
      ],
    });
  }

  const gone = useCallback(
    (id: string) =>
      setSwap((current) => ({
        ...current,
        outgoing: current.outgoing.filter(({ laid }) => laid.piece.id !== id),
      })),
    [],
  );

  const blanks = emptyRoles.map((role) => ({
    role,
    piece: {
      id: `${prefix}-empty-${role}`,
      name: "",
      category: slotCategory[role],
      photo: "",
      createdAt: "",
      source: "sample",
    } satisfies Piece,
  }));
  const laidOut = arrangePieces([
    ...pieces,
    ...blanks.map((blank) => blank.piece),
  ]);
  const placed = laidOut.filter((laid) =>
    pieces.some((piece) => piece === laid.piece),
  );
  const empties = blanks.flatMap((blank) => {
    const laid = laidOut.find((item) => item.piece === blank.piece);
    return laid ? [{ ...blank, laid }] : [];
  });

  const rank = (piece: Piece, role: Role) =>
    order?.includes(piece.id) ? order.indexOf(piece.id) : dressing[role] * 100;
  const reading = [
    ...placed.map((laid) => ({
      id: `${prefix}-${laid.piece.id}`,
      at: rank(laid.piece, roleOf(laid.piece)),
    })),
    ...empties.map((empty) => ({
      id: `${prefix}-${empty.piece.id}`,
      at: rank(empty.piece, empty.role),
    })),
  ]
    .sort((a, b) => a.at - b.at)
    .map((item) => item.id);

  const slotOf = (piece: Piece) =>
    Object.keys(slots).find((key) => slots[key]?.id === piece.id) ?? "";

  const interactive = hero && Boolean(onPiecePress) && !hiddenPieces;
  const described = hero && preview && !hiddenPieces;
  const speak = (piece: Piece) =>
    labelFor?.(piece) ??
    (keptIds.includes(piece.id)
      ? t("outfit.keptLabel", { name: piece.name })
      : piece.name);
  const accessFor = (piece: Piece): AccessibilityProps =>
    interactive
      ? {
          accessible: true,
          accessibilityRole: "button",
          accessibilityLabel: speak(piece),
          accessibilityHint: hintFor?.(piece),
          accessibilityState: {
            expanded: openId === undefined ? undefined : openId === piece.id,
          },
        }
      : described
        ? {
            accessible: true,
            accessibilityRole: "image",
            accessibilityLabel: speak(piece),
          }
        : { accessible: false, ...hidden };

  const labelled =
    hero && Boolean(accessibilityLabel) && !interactive && !described;
  const silent = !hero || (!interactive && !described && !labelled);
  const loading = state === "loading";

  const ordered = {
    experimental_accessibilityOrder:
      interactive || described ? reading : undefined,
  };

  return (
    <View
      ref={viewport}
      onLayout={(event) => {
        if (hero) setWidth(event.nativeEvent.layout.width);
        viewport.current?.measureInWindow((left) => origin.set(left));
      }}
      testID={
        loading
          ? "moment-loading"
          : state === "arranging"
            ? "moment-generating"
            : testID
      }
      accessibilityIgnoresInvertColors
      shouldRasterizeIOS={!hero}
      {...ordered}
      {...(loading
        ? {
            accessible: true,
            accessibilityLabel: t("common.loading"),
            accessibilityState: { busy: true },
          }
        : labelled
          ? {
              accessible: true,
              accessibilityRole: "image" as const,
              accessibilityLabel,
            }
          : silent
            ? hidden
            : null)}
      style={[
        styles.viewport,
        hero
          ? [styles.hero, { maxWidth: maxSize }]
          : { width: side, height: side },
        { backgroundColor: colors.canvas },
      ]}
    >
      {loading ? (
        <Silk
          kind="placeholder"
          shape="lay"
          label={t("common.loading")}
          style={StyleSheet.absoluteFill}
        />
      ) : side > 0 ? (
        <LayoutAnimationConfig key={revision} skipEntering>
          {empties.map(({ role, piece, laid }) => (
            <Pressable
              key={piece.id}
              nativeID={`${prefix}-${piece.id}`}
              accessible={!silent || Boolean(onEmptyPress)}
              accessibilityRole={onEmptyPress ? "button" : undefined}
              accessibilityLabel={t(
                onEmptyPress ? "today.addRole" : "build.slotEmpty",
                { role: t(`role.one.${role}`) },
              )}
              disabled={!onEmptyPress}
              onPress={() => onEmptyPress?.(role)}
              testID={onEmptyPress ? `empty-${role}` : undefined}
              style={[
                styles.empty,
                {
                  left: (laid.x + laid.width * 0.1) * side,
                  top: (laid.y + laid.height * 0.1) * side,
                  width: laid.width * 0.8 * side,
                  height: laid.height * 0.8 * side,
                  borderColor: onEmptyPress ? colors.plum : colors.lineField,
                },
              ]}
            >
              {onEmptyPress ? (
                <Symbol name="plus" size={theme.size.iconInline} tone="plum" />
              ) : null}
            </Pressable>
          ))}
          {[
            ...swap.outgoing
              .filter(({ laid }) => !ids.has(laid.piece.id))
              .map(({ laid, delay }) => ({
                laid,
                delay,
                phase: "out" as const,
              })),
            ...placed.map((laid) => {
              const key = slotOf(laid.piece);
              const moving = swap.changed.includes(key);
              return {
                laid,
                delay: moving ? stagger(swap.changed, key, 1) : 0,
                phase: moving ? ("in" as const) : ("still" as const),
              };
            }),
          ].map(({ laid, delay, phase }) => (
            <LaidPiece
              key={laid.piece.id}
              laid={laid}
              side={side}
              elevated={size !== "mini"}
              phase={phase}
              delay={delay}
              onGone={gone}
              gleam={state === "arranging"}
              origin={origin}
              mark={hero && swapMark && roleOf(laid.piece) === "hijab"}
              kept={hero && keptIds.includes(laid.piece.id)}
              nativeID={`${prefix}-${laid.piece.id}`}
              onPress={
                hero && onPiecePress
                  ? () => onPiecePress(laid.piece)
                  : undefined
              }
              access={accessFor(laid.piece)}
            />
          ))}
        </LayoutAnimationConfig>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { width: "100%", aspectRatio: 1, alignSelf: "center" },
  viewport: { position: "relative" },
  piece: { position: "absolute" },
  crop: { overflow: "hidden" },
  empty: {
    position: "absolute",
    borderWidth: 1,
    borderStyle: "dashed",
    borderRadius: theme.radius.print,
    borderCurve: "continuous",
    alignItems: "center",
    justifyContent: "center",
  },
  mark: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
});
