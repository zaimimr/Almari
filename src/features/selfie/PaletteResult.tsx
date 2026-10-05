import type { ReactNode } from "react";
import { Pressable, StyleSheet, View, useWindowDimensions } from "react-native";
import Animated, {
  FadeIn,
  ReduceMotion,
  withDelay,
  type EntryExitAnimationFunction,
} from "react-native-reanimated";
import type { ColourProfile, Season } from "../../domain/closet";
import { drapePair } from "../../domain/seasons";
import { t } from "../../i18n";
import { Swatches, Text } from "../../ui";
import { motion, timing, useReduceMotion } from "../../ui/motion";
import { gutterFor, theme } from "../../ui/theme";
import { useColors } from "../../ui/useColors";
import { Drape, Drapes } from "./Drapes";
import type { FaceBox, PhotoSize } from "./FacePhoto";
import { named, paletteOf, seasonLabel, type Palette } from "./palette";

const step = 110;

function revealAt(reduce: boolean, index: number) {
  if (reduce)
    return FadeIn.duration(motion.duration.base).reduceMotion(
      ReduceMotion.Never,
    );
  const delay = index * step;
  const rise: EntryExitAnimationFunction = () => {
    "worklet";
    return {
      initialValues: {
        opacity: 0,
        transform: [{ translateY: 18 }, { scale: 0.98 }],
      },
      animations: {
        opacity: withDelay(delay, timing(1, "drape", "silk")),
        transform: [
          { translateY: withDelay(delay, timing(0, "drape", "fall")) },
          { scale: withDelay(delay, timing(1, "drape", "fall")) },
        ],
      },
    };
  };
  return rise;
}

function Reveal({
  index,
  grow,
  children,
}: {
  index: number;
  grow?: boolean;
  children: ReactNode;
}) {
  const reduce = useReduceMotion();
  return (
    <Animated.View
      entering={revealAt(reduce, index)}
      style={grow ? styles.grow : undefined}
    >
      {children}
    </Animated.View>
  );
}

export function SeasonHeading({ profile }: { profile: ColourProfile }) {
  const colors = useColors();
  const reduce = useReduceMotion();
  const traits = [
    ["colours.undertone", `undertone.${profile.undertone}`],
    ["colours.depth", `depth.${profile.depth}`],
    ["colours.contrast", `contrast.${profile.contrast}`],
  ] as const;
  return (
    <View style={styles.heading}>
      <Reveal index={0}>
        <Text role="eyebrow" tone="muted">
          {t("colours.yourSeason")}
        </Text>
      </Reveal>
      <Animated.View key={profile.season} entering={revealAt(reduce, 1)}>
        <Text role="display" accessibilityRole="header" testID="colours-season">
          {seasonLabel(profile.season)}
        </Text>
      </Animated.View>
      <View style={[styles.traits, { borderColor: colors.line }]}>
        {traits.map(([label, value], index) => (
          <Animated.View
            key={label}
            style={styles.trait}
            accessible
            entering={revealAt(reduce, 2 + index)}
          >
            <Text role="footnote" tone="muted">
              {t(label)}
            </Text>
            <Text role="headline">{t(value)}</Text>
          </Animated.View>
        ))}
      </View>
    </View>
  );
}

export function PaletteSections({
  palette,
  plain,
}: {
  palette: Palette;
  plain: boolean;
}) {
  const sections = [
    [
      t(plain ? "colours.bestShadesPlain" : "colours.bestShades"),
      palette.best,
      "colours-best",
    ],
    [t("colours.neutrals"), palette.neutrals, "colours-neutrals"],
    [t("colours.metals"), palette.metals, "colours-metals"],
    [t("colours.goEasy"), palette.goEasy, "colours-go-easy"],
  ] as const;
  return (
    <>
      {sections.map(([title, colours, testID]) => (
        <View key={testID} style={styles.section}>
          <Text role="headline" accessibilityRole="header">
            {title}
          </Text>
          <Swatches title={title} colours={colours} testID={testID} />
        </View>
      ))}
    </>
  );
}

export function SeasonChoice({
  seasons,
  photo,
  face,
  size,
  onChoose,
}: {
  seasons: [Season, Season];
  photo: string;
  face: FaceBox | null;
  size: PhotoSize | null;
  onChoose: (season: Season) => void;
}) {
  const { width, height } = useWindowDimensions();
  const content = width - 2 * gutterFor(width);
  const card = Math.floor((content - theme.space.md) / 2);
  const chip = card / 3;
  const tall = Math.round(
    Math.max(card * 1.3, Math.min(card * 1.9, height - card - 360)),
  );
  const drapes = drapePair(...seasons);
  return (
    <View style={styles.choice} testID="colours-choice">
      <Reveal index={0}>
        <Text role="display" accessibilityRole="header">
          {t("colours.choose")}
        </Text>
      </Reveal>
      <View
        style={styles.close}
        accessibilityRole="radiogroup"
        accessibilityLabel={t("colours.choose")}
      >
        {seasons.map((season, index) => (
          <Reveal key={season} index={1 + index} grow>
            <Pressable
              onPress={() => onChoose(season)}
              accessibilityRole="radio"
              accessibilityState={{ selected: false }}
              accessibilityLabel={seasonLabel(season)}
              testID={`colours-choose-${season}`}
              style={({ pressed }) => [
                styles.closeCard,
                pressed ? styles.pressed : null,
              ]}
            >
              <Drape
                colour={named(drapes[index]!)}
                label={seasonLabel(season)}
                photo={photo}
                face={face}
                size={size}
                width={card}
                height={tall}
                diameter={Math.round(card * 0.78)}
              />
              <View
                style={[styles.strip, { width: card }]}
                accessibilityElementsHidden
                importantForAccessibility="no-hide-descendants"
              >
                {paletteOf({ season })
                  .best.slice(0, 9)
                  .map((colour) => (
                    <View
                      key={colour.hex}
                      style={{
                        width: chip,
                        height: chip,
                        backgroundColor: colour.hex,
                      }}
                    />
                  ))}
              </View>
            </Pressable>
          </Reveal>
        ))}
      </View>
    </View>
  );
}

export function PaletteResult({
  profile,
  palette,
  photo,
  face,
  size,
  plain,
  children,
}: {
  profile: ColourProfile;
  palette: Palette;
  photo: string | null;
  face: FaceBox | null;
  size: PhotoSize | null;
  plain: boolean;
  children: ReactNode;
}) {
  const { width } = useWindowDimensions();
  const content = width - 2 * gutterFor(width);
  return (
    <View style={styles.result} testID="colour-result">
      <SeasonHeading profile={profile} />
      {photo ? (
        <Reveal index={5}>
          <Drapes
            best={palette.best}
            avoid={palette.goEasy}
            photo={photo}
            face={face}
            size={size}
            width={content}
          />
        </Reveal>
      ) : null}
      <Reveal index={6}>
        <View style={styles.result}>
          <PaletteSections palette={palette} plain={plain} />
          {children}
        </View>
      </Reveal>
    </View>
  );
}

const styles = StyleSheet.create({
  result: { gap: theme.space.xl },
  heading: { gap: theme.space.xs },
  traits: {
    flexDirection: "row",
    marginTop: theme.space.md,
    paddingTop: theme.space.md,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  trait: { flex: 1, gap: 2 },
  section: { gap: theme.space.sm },
  close: { flexDirection: "row", gap: theme.space.md },
  closeCard: { gap: theme.space.sm },
  grow: { flex: 1 },
  strip: {
    flexDirection: "row",
    flexWrap: "wrap",
    overflow: "hidden",
    borderRadius: theme.radius.md,
    borderCurve: "continuous",
  },
  choice: { gap: theme.space.lg },
  pressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
});
