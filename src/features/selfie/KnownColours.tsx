import { Pressable, StyleSheet, View } from "react-native";
import { seasons, type Season } from "../../domain/closet";
import type { Lab } from "../../domain/color";
import {
  labHex,
  seasonColours,
  skinSwatches,
} from "../../domain/colourAnalysis";
import { eyeShades, hairShades } from "../../domain/seasons";
import { t } from "../../i18n";
import { Button, ChipRow, Symbol, Text } from "../../ui";
import { theme } from "../../ui/theme";
import { useColors } from "../../ui/useColors";
import { seasonLabel } from "./palette";
import type { useKnownColours } from "./useKnownColours";

const fanAngles = [-24, -12, 0, 12, 24];

function Fan({ season }: { season: Season }) {
  const colours = seasonColours(season);
  return (
    <View style={styles.fan}>
      {fanAngles.map((angle, index) => (
        <View
          key={angle}
          style={[
            styles.blade,
            {
              backgroundColor: labHex(colours[index * 2]!),
              transform: [{ rotate: `${angle}deg` }],
            },
          ]}
        />
      ))}
    </View>
  );
}

function SeasonCard({
  season,
  selected,
  onPress,
}: {
  season: Season;
  selected: boolean;
  onPress: () => void;
}) {
  const colors = useColors();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={seasonLabel(season)}
      testID={`known-season-${season}`}
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: selected ? colors.blushEdge : colors.line,
        },
      ]}
    >
      <Fan season={season} />
      <Text role="subhead">{seasonLabel(season)}</Text>
      {selected ? (
        <View
          style={[
            styles.picked,
            { backgroundColor: colors.blush, borderColor: colors.blushEdge },
          ]}
        >
          <Symbol name="checkmark" size={11} tone="ink" weight="semibold" />
        </View>
      ) : null}
    </Pressable>
  );
}

const same = (a: Lab | null, b: Lab) =>
  a !== null && a.every((value, index) => value === b[index]);

function ShadeRow<T extends { id: string; lab: Lab }>({
  label,
  shades,
  name,
  value,
  onChange,
  testID,
}: {
  label: string;
  shades: T[];
  name: (shade: T) => string;
  value: Lab | null;
  onChange: (next: Lab | null) => void;
  testID: string;
}) {
  return (
    <ChipRow
      label={label}
      options={shades.map((shade) => ({
        id: shade.id,
        label: name(shade),
        swatch: labHex(shade.lab),
      }))}
      value={shades.find((shade) => same(value, shade.lab))?.id ?? null}
      onChange={(next) =>
        onChange(shades.find((shade) => shade.id === next)?.lab ?? null)
      }
      optional
      testID={testID}
    />
  );
}

export function KnownColours({
  known,
}: {
  known: ReturnType<typeof useKnownColours>;
}) {
  const colors = useColors();
  return (
    <View style={styles.known}>
      <View style={styles.section}>
        <Text role="headline" accessibilityRole="header">
          {t("colours.known.card")}
        </Text>
        {known.card.length > 0 ? (
          <View style={styles.swatches} testID="known-card-swatches">
            {known.card.map((lab, index) => (
              <Pressable
                key={`${index}-${lab.join()}`}
                onPress={() => known.removeSwatch(index)}
                accessibilityRole="button"
                accessibilityLabel={t("colours.known.remove")}
                testID={`known-swatch-${index}`}
                style={[
                  styles.swatch,
                  {
                    backgroundColor: labHex(lab),
                    borderColor: colors.lineField,
                  },
                ]}
              >
                <View
                  style={[styles.remove, { backgroundColor: colors.canvas }]}
                >
                  <Symbol name="xmark" size={10} tone="ink" weight="semibold" />
                </View>
              </Pressable>
            ))}
          </View>
        ) : null}
        <View style={styles.start}>
          <Button
            label={t(
              known.card.length > 0
                ? "colours.known.newCard"
                : "colours.known.addCard",
            )}
            variant="secondary"
            icon="photo.on.rectangle"
            busy={known.reading}
            onPress={known.addCard}
            testID="known-card"
          />
        </View>
        {known.cardError ? (
          <Text role="footnote" tone="error">
            {known.cardError}
          </Text>
        ) : null}
      </View>
      <View style={styles.section}>
        <Text role="headline" accessibilityRole="header">
          {t("colours.known.season")}
        </Text>
        <View style={styles.grid} accessibilityRole="radiogroup">
          {seasons.map((season) => (
            <SeasonCard
              key={season}
              season={season}
              selected={known.season === season}
              onPress={() => known.setSeason(season)}
            />
          ))}
        </View>
      </View>
      <ShadeRow
        label={t("colours.skin")}
        shades={skinSwatches}
        name={(shade) =>
          `${t(`depth.${shade.depth}`)}, ${t(`undertone.${shade.undertone}`).toLocaleLowerCase()}`
        }
        value={known.skin}
        onChange={known.setSkin}
        testID="known-skin"
      />
      <ShadeRow
        label={t("colours.hair")}
        shades={hairShades}
        name={(shade) => t(`colours.hairShade.${shade.id}`)}
        value={known.hair}
        onChange={known.setHair}
        testID="known-hair"
      />
      <ShadeRow
        label={t("colours.eyes")}
        shades={eyeShades}
        name={(shade) => t(`colours.eyeShade.${shade.id}`)}
        value={known.eyes}
        onChange={known.setEyes}
        testID="known-eyes"
      />
    </View>
  );
}

const swatch = 44;

const styles = StyleSheet.create({
  known: { gap: theme.space.xxl },
  section: { gap: theme.space.md },
  start: { alignItems: "flex-start" },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: theme.space.sm },
  card: {
    width: "48.5%",
    alignItems: "center",
    gap: theme.space.sm,
    paddingTop: theme.space.lg,
    paddingBottom: theme.space.md,
    borderWidth: 2,
    borderRadius: theme.radius.md,
    borderCurve: "continuous",
  },
  picked: {
    position: "absolute",
    top: theme.space.sm,
    right: theme.space.sm,
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  fan: { width: 96, height: 60, alignItems: "center" },
  blade: {
    position: "absolute",
    bottom: 0,
    width: 20,
    height: 58,
    borderRadius: 5,
    transformOrigin: "50% 92%",
  },
  swatches: { flexDirection: "row", flexWrap: "wrap", gap: theme.space.md },
  swatch: {
    width: swatch,
    height: swatch,
    borderRadius: swatch / 2,
    borderWidth: 1,
  },
  remove: {
    position: "absolute",
    top: -4,
    right: -4,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
});
