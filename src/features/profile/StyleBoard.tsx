import { Pressable, StyleSheet, View } from "react-native";
import { Image, type ImageSource } from "expo-image";
import { router } from "expo-router";
import type { Closet } from "../../domain/closet";
import { answersFrom, type OnboardingStep } from "../../domain/onboarding";
import { t } from "../../i18n";
import { Symbol, Text } from "../../ui";
import { theme } from "../../ui/theme";
import { useColors } from "../../ui/useColors";
import { useLargeText } from "../../ui/useLargeText";
import { art, illustrations, leanArt } from "../onboarding/illustrations";
import { paletteOf, seasonLabel } from "../selfie/palette";

type Tile = {
  id: string;
  step: OnboardingStep;
  label: string;
  value: string | null;
  image?: ImageSource;
  bust?: boolean;
  swatches?: string[];
};

const hidden = {
  accessibilityElementsHidden: true,
  importantForAccessibility: "no-hide-descendants",
} as const;

function tilesFor(closet: Closet): Tile[] {
  const answers = answersFrom(closet);
  const worn = answers.hijabStyles.hijabStyles ?? [];
  const [first] = worn;
  const { coverage, answered } = answers.coverage;
  const { styleLean } = answers.style;
  const { fit } = answers.fit;
  const { sparkle } = answers.sparkle;
  const { colour } = answers.colours;
  const { hijab } = answers.hijab;
  const bare = hijab === "no";

  return [
    {
      id: "hijab",
      step: "hijab",
      label: t("style.hijab"),
      value:
        hijab === null
          ? null
          : bare
            ? t("onboarding.hijab.no")
            : first
              ? [
                  t(`hijabStyle.${first}`),
                  worn.length > 1 && `+${worn.length - 1}`,
                ]
                  .filter(Boolean)
                  .join(" ")
              : t(`hijab.${hijab}`),
      image:
        hijab === null
          ? undefined
          : first && !bare
            ? illustrations[`hijab-${first}`]
            : illustrations[`hijab-${hijab}`],
      bust: Boolean(first) && !bare,
    },
    {
      id: "coverage",
      step: "coverage",
      label: t("profile.tile.coverage"),
      value: coverage
        ? t(`coverage.${coverage}`)
        : answered
          ? t("coverage.noPreference")
          : null,
      image:
        coverage && coverage !== "own"
          ? art(`coverage-${coverage}`, bare)
          : undefined,
    },
    {
      id: "style",
      step: "style",
      label: t("style.style"),
      value: styleLean && t(`onboarding.style.${styleLean}`),
      image: styleLean ? art(leanArt[styleLean], bare) : undefined,
    },
    {
      id: "fit",
      step: "fit",
      label: t("style.fit"),
      value: fit && t(`onboarding.fit.${fit}`),
      image: fit && fit !== "depends" ? art(`fit-${fit}`, bare) : undefined,
    },
    {
      id: "sparkle",
      step: "sparkle",
      label: t("profile.tile.sparkle"),
      value: sparkle && t(`sparkle.${sparkle}`),
      image: sparkle ? art(`sparkle-${sparkle}`, bare) : undefined,
    },
    {
      id: "colours",
      step: "colours",
      label: t("profile.colours"),
      value: colour && seasonLabel(colour.season),
      swatches: colour
        ? paletteOf(colour)
            .best.slice(0, 6)
            .map(({ hex }) => hex)
        : undefined,
    },
  ];
}

function BoardTile({ tile }: { tile: Tile }) {
  const colors = useColors();
  const value = tile.value ?? t("common.add");

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${tile.label}, ${value}`}
      onPress={() => router.push(`/profile/answer/${tile.step}`)}
      testID={`tile-${tile.id}`}
      style={({ pressed }) => [styles.tile, pressed && styles.pressed]}
    >
      <View
        accessibilityIgnoresInvertColors
        style={[styles.art, { backgroundColor: colors.paper }]}
        {...hidden}
      >
        {tile.image ? (
          <Image
            source={tile.image}
            transition={0}
            contentFit="cover"
            style={[StyleSheet.absoluteFill, tile.bust && styles.bust]}
          />
        ) : tile.swatches ? (
          <View style={styles.swatches}>
            {tile.swatches.map((hex) => (
              <View
                key={hex}
                style={[
                  styles.swatch,
                  { backgroundColor: hex, borderColor: colors.lineField },
                ]}
              />
            ))}
          </View>
        ) : tile.value === null ? (
          <Symbol name="plus" size={theme.size.iconBar} tone="plum" />
        ) : null}
      </View>
      <View style={styles.words}>
        <Text role="eyebrow">{tile.label}</Text>
        <Text role="subhead" tone={tile.value === null ? "plum" : "ink"}>
          {value}
        </Text>
      </View>
    </Pressable>
  );
}

export function StyleBoard({ closet }: { closet: Closet }) {
  const { ax } = useLargeText();
  const all = tilesFor(closet);
  const open = all.filter(
    ({ value, step }) => value === null && step !== "colours",
  );
  const tiles = [
    ...all.filter(({ value, step }) => value !== null || step === "colours"),
    ...open.slice(0, 1).map((tile) => ({
      id: "finish",
      step: tile.step,
      label: t("profile.finish"),
      value: null,
    })),
  ];
  const rows = ax
    ? tiles.map((tile) => [tile])
    : tiles.flatMap((tile, index) =>
        index % 2 === 0 ? [tiles.slice(index, index + 2)] : [],
      );

  return (
    <View style={styles.board} testID="style-board">
      {rows.map((row) => (
        <View key={row.map(({ id }) => id).join()} style={styles.row}>
          {row.map((tile) => (
            <BoardTile key={tile.id} tile={tile} />
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  board: { gap: theme.space.xl },
  row: { flexDirection: "row", alignItems: "flex-start", gap: theme.space.lg },
  tile: { flex: 1, minWidth: 0, gap: theme.space.sm },
  pressed: { opacity: 0.7 },
  art: {
    aspectRatio: 3 / 4,
    borderRadius: theme.radius.print,
    borderCurve: "continuous",
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  bust: { transform: [{ scale: 1.8 }], transformOrigin: "50% 12%" },
  swatches: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: theme.space.sm,
    padding: theme.space.lg,
  },
  swatch: {
    width: theme.size.swatchLarge,
    height: theme.size.swatchLarge,
    borderRadius: theme.size.swatchLarge / 2,
    borderWidth: StyleSheet.hairlineWidth,
  },
  words: { gap: theme.space.xs },
});
