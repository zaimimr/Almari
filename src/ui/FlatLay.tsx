import { useId, useRef, useState } from "react";
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
  type EntryExitAnimationFunction,
  type SharedValue,
} from "react-native-reanimated";
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

type Swap = {
  revision?: number;
  slots: Record<string, Piece>;
  changed: string[];
  outgoing: { key: string; laid: Laid }[];
};

const sides = { row: 72, mini: 56 } as const;
const markDisc = 26;
const markCap = 1.35;
const gleamPeak = 0.35;

const dressing: Record<Role, number> = {
  main: 0,
  bottom: 1,
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

const leave =
  (delay: number, reduce: boolean): EntryExitAnimationFunction =>
  () => {
    "worklet";
    if (reduce) {
      return {
        initialValues: { opacity: 1 },
        animations: { opacity: timing(0, "base", "silk") },
      };
    }
    return {
      initialValues: { opacity: 1, transform: [{ translateY: 0 }] },
      animations: {
        opacity: withDelay(
          delay,
          timing(0, "quick", "release"),
          ReduceMotion.Never,
        ),
        transform: [
          {
            translateY: withDelay(
              delay,
              timing(-4, "quick", "release"),
              ReduceMotion.Never,
            ),
          },
        ],
      },
    };
  };

const arrive =
  (delay: number, reduce: boolean): EntryExitAnimationFunction =>
  () => {
    "worklet";
    if (reduce) {
      return {
        initialValues: { opacity: 0 },
        animations: { opacity: timing(1, "base", "silk") },
      };
    }
    return {
      initialValues: { opacity: 0, transform: [{ translateY: -6 }] },
      animations: {
        opacity: withDelay(
          delay,
          timing(1, "arrange", "fall"),
          ReduceMotion.Never,
        ),
        transform: [
          {
            translateY: withDelay(
              delay,
              timing(0, "arrange", "fall"),
              ReduceMotion.Never,
            ),
          },
        ],
      },
    };
  };

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
  entering,
  ghost = false,
  gleam,
  origin,
  mark,
  nativeID,
  onPress,
  access,
}: {
  laid: Laid;
  side: number;
  elevated: boolean;
  entering?: EntryExitAnimationFunction;
  ghost?: boolean;
  gleam: boolean;
  origin: SharedValue<number>;
  mark: boolean;
  nativeID?: string;
  onPress?: () => void;
  access: AccessibilityProps;
}) {
  const colors = useColors();
  const reduce = useReduceMotion();
  const { symbolScale } = useLargeText();
  const lift = useSharedValue(0);
  const { box, image, contentFit } = fit(laid, side);
  const slopX = Math.max(0, (theme.size.touch - box.width) / 2);
  const slopY = Math.max(0, (theme.size.touch - box.height) / 2);
  const scale = Math.min(symbolScale, markCap);
  const disc = markDisc * scale;
  const { rest, lift: raised } = theme.elevation;

  const shadow = useAnimatedStyle(() => ({
    shadowOpacity: interpolate(
      lift.get(),
      [0, 1],
      [rest.shadowOpacity, raised.shadowOpacity],
    ),
    shadowRadius: interpolate(
      lift.get(),
      [0, 1],
      [rest.shadowRadius, raised.shadowRadius],
    ),
    shadowOffset: {
      width: 0,
      height: interpolate(
        lift.get(),
        [0, 1],
        [rest.shadowOffset.height, raised.shadowOffset.height],
      ),
    },
  }));

  return (
    <Animated.View
      entering={entering}
      pointerEvents={ghost ? "none" : "box-none"}
      style={[styles.piece, box, { zIndex: laid.depth }]}
      {...(ghost ? hidden : null)}
    >
      <Pressable
        nativeID={nativeID}
        testID={ghost ? undefined : `outfit-piece-${laid.piece.id}`}
        onPress={onPress}
        onPressIn={() => {
          if (onPress) lift.set(reduce ? 1 : timing(1, "base", "silk"));
        }}
        onPressOut={() => {
          if (onPress) lift.set(reduce ? 0 : timing(0, "settle", "fall"));
        }}
        hitSlop={{ left: slopX, right: slopX, top: slopY, bottom: slopY }}
        style={StyleSheet.absoluteFill}
        {...access}
      >
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            elevated && rest,
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
        {gleam ? <Gleam laid={laid} side={side} origin={origin} /> : null}
        {mark ? (
          <View
            style={[
              styles.mark,
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
              name="arrow.2.squarepath"
              size={(theme.size.iconInline * scale) / symbolScale}
              tone="plum"
            />
          </View>
        ) : null}
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
  const side = hero ? Math.min(width, maxSize ?? width) : sides[size];

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
  if (swap.revision !== revision || (moved.length > 0 && !hero)) {
    setSwap({ revision, slots, changed: [], outgoing: [] });
  } else if (moved.length > 0) {
    const before = arrangePieces(Object.values(swap.slots));
    const ids = new Set(pieces.map((piece) => piece.id));
    const changed = [...moved].sort((a, b) => rankOf(a) - rankOf(b));
    setSwap({
      revision,
      slots,
      changed,
      outgoing: changed.flatMap((key) => {
        const old = swap.slots[key];
        const laid = before.find((item) => item.piece.id === old?.id);
        return laid && !ids.has(laid.piece.id) ? [{ key, laid }] : [];
      }),
    });
  }

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
  const stagger = (key: string, after: number) =>
    reduce
      ? 0
      : swap.changed.indexOf(key) * motion.timer.step +
        after * motion.timer.step;

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

  const lay = (
    <View
      ref={viewport}
      onLayout={() =>
        viewport.current?.measureInWindow((left) => origin.set(left))
      }
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
        { width: side, height: side, backgroundColor: colors.canvas },
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
            <View
              key={piece.id}
              nativeID={`${prefix}-${piece.id}`}
              accessible={!silent}
              accessibilityLabel={t("build.slotEmpty", {
                role: t(`role.one.${role}`),
              })}
              style={[
                styles.empty,
                {
                  left: laid.x * side,
                  top: laid.y * side,
                  width: laid.width * side,
                  height: laid.height * side,
                  borderColor: colors.lineField,
                },
              ]}
            />
          ))}
          {swap.outgoing.map(({ key, laid }) => (
            <LaidPiece
              key={`out-${key}-${laid.piece.id}`}
              laid={laid}
              side={side}
              elevated={size !== "mini"}
              entering={leave(stagger(key, 0), reduce)}
              ghost
              gleam={false}
              origin={origin}
              mark={false}
              access={hidden}
            />
          ))}
          {placed.map((laid) => {
            const key = slotOf(laid.piece);
            return (
              <LaidPiece
                key={laid.piece.id}
                laid={laid}
                side={side}
                elevated={size !== "mini"}
                entering={
                  swap.changed.includes(key)
                    ? arrive(stagger(key, 1), reduce)
                    : undefined
                }
                gleam={state === "arranging"}
                origin={origin}
                mark={hero && swapMark && roleOf(laid.piece) === "hijab"}
                nativeID={`${prefix}-${laid.piece.id}`}
                onPress={
                  hero && onPiecePress
                    ? () => onPiecePress(laid.piece)
                    : undefined
                }
                access={accessFor(laid.piece)}
              />
            );
          })}
        </LayoutAnimationConfig>
      ) : null}
    </View>
  );

  return hero ? (
    <View
      style={styles.hero}
      onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
    >
      {lay}
    </View>
  ) : (
    lay
  );
}

const styles = StyleSheet.create({
  hero: { width: "100%", alignItems: "center" },
  viewport: { position: "relative" },
  piece: { position: "absolute" },
  crop: { overflow: "hidden" },
  empty: {
    position: "absolute",
    borderWidth: 1,
    borderStyle: "dashed",
    borderRadius: theme.radius.md,
    borderCurve: "continuous",
  },
  mark: {
    position: "absolute",
    top: 0,
    right: 0,
    alignItems: "center",
    justifyContent: "center",
  },
});
