import { Pressable, StyleSheet, View, useWindowDimensions } from "react-native";
import type { ColourProfile, Season } from "../../domain/closet";
import { seasonColours } from "../../domain/colourAnalysis";
import { t } from "../../i18n";
import { Swatches, Text } from "../../ui";
import { gutterFor, theme } from "../../ui/theme";
import { useColors } from "../../ui/useColors";
import { Drape, Drapes } from "./Drapes";
import type { FaceBox, PhotoSize } from "./FacePhoto";
import { named, seasonLabel, type Palette } from "./palette";

export function SeasonHeading({ profile }: { profile: ColourProfile }) {
  const colors = useColors();
  const traits = [
    ["colours.undertone", `undertone.${profile.undertone}`],
    ["colours.depth", `depth.${profile.depth}`],
    ["colours.contrast", `contrast.${profile.contrast}`],
  ] as const;
  return (
    <View style={styles.heading}>
      <Text role="eyebrow" tone="muted">
        {t("colours.yourSeason")}
      </Text>
      <Text role="display" accessibilityRole="header" testID="colours-season">
        {seasonLabel(profile.season)}
      </Text>
      <View style={[styles.traits, { borderColor: colors.line }]}>
        {traits.map(([label, value]) => (
          <View key={label} style={styles.trait} accessible>
            <Text role="footnote" tone="muted">
              {t(label)}
            </Text>
            <Text role="headline">{t(value)}</Text>
          </View>
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

function CloseSeasons({
  seasons,
  current,
  photo,
  face,
  size,
  width,
  onPick,
}: {
  seasons: Season[];
  current: Season;
  photo: string;
  face: FaceBox | null;
  size: PhotoSize | null;
  width: number;
  onPick: (season: Season) => void;
}) {
  const colors = useColors();
  const card = (width - theme.space.md) / 2;
  return (
    <View style={styles.section}>
      <Text role="headline" accessibilityRole="header">
        {t("colours.alsoClose")}
      </Text>
      <View style={styles.close}>
        {seasons.map((season) => {
          const selected = season === current;
          return (
            <Pressable
              key={season}
              onPress={() => onPick(season)}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              accessibilityLabel={seasonLabel(season)}
              testID={`colours-close-${season}`}
              style={styles.closeCard}
            >
              <View
                style={[
                  styles.closeFrame,
                  { borderColor: selected ? colors.plum : "transparent" },
                ]}
              >
                <Drape
                  colour={named(seasonColours(season)[0]!)}
                  label={seasonLabel(season)}
                  photo={photo}
                  face={face}
                  size={size}
                  width={card - 8}
                  height={card - 8}
                  diameter={Math.round(card * 0.6)}
                />
              </View>
            </Pressable>
          );
        })}
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
  close,
  onPick,
  children,
}: {
  profile: ColourProfile;
  palette: Palette;
  photo: string | null;
  face: FaceBox | null;
  size: PhotoSize | null;
  plain: boolean;
  close: Season[] | null;
  onPick: (season: Season) => void;
  children: React.ReactNode;
}) {
  const { width } = useWindowDimensions();
  const content = width - 2 * gutterFor(width);
  return (
    <View style={styles.result} testID="colour-result">
      <SeasonHeading profile={profile} />
      {photo ? (
        <Drapes
          best={palette.best}
          avoid={palette.goEasy}
          photo={photo}
          face={face}
          size={size}
          width={content}
        />
      ) : null}
      {photo && close ? (
        <CloseSeasons
          seasons={close}
          current={profile.season}
          photo={photo}
          face={face}
          size={size}
          width={content}
          onPick={onPick}
        />
      ) : null}
      <PaletteSections palette={palette} plain={plain} />
      {children}
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
  closeCard: { flex: 1 },
  closeFrame: {
    borderWidth: 2,
    borderRadius: theme.radius.lg,
    padding: 2,
    overflow: "hidden",
  },
});
