import { Image, StyleSheet, View, useWindowDimensions } from "react-native";
import type { ColourProfile } from "../../domain/closet";
import { t } from "../../i18n";
import { Swatches, Text } from "../../ui";
import { gutterFor, theme } from "../../ui/theme";
import { useColors } from "../../ui/useColors";
import { seasonLabel } from "./palette";

type Colour = { hex: string; name: string };

export function PaletteResult({
  profile,
  palette,
  photo,
  plain,
  children,
}: {
  profile: ColourProfile;
  palette: { best: Colour[]; goEasy: Colour[] };
  photo: string | null;
  plain: boolean;
  children: React.ReactNode;
}) {
  const colors = useColors();
  const { width } = useWindowDimensions();
  const diameter = Math.min(
    theme.size.faceCircle,
    width - 2 * gutterFor(width),
  );
  const best = t(plain ? "colours.bestShadesPlain" : "colours.bestShades");
  const goEasy = t("colours.goEasy");
  return (
    <View style={styles.result} testID="colour-result">
      {photo ? (
        <Image
          source={{ uri: photo }}
          accessibilityIgnoresInvertColors
          style={[
            styles.photo,
            {
              width: diameter,
              height: diameter,
              borderRadius: diameter / 2,
              backgroundColor: colors.sunken,
            },
          ]}
        />
      ) : null}
      <Text role="title" accessibilityRole="header">
        {seasonLabel(profile.season)}
      </Text>
      <View style={styles.section}>
        <Text role="headline" accessibilityRole="header">
          {best}
        </Text>
        <Swatches title={best} colours={palette.best} testID="colours-best" />
      </View>
      <View style={styles.section}>
        <Text role="headline" accessibilityRole="header">
          {goEasy}
        </Text>
        <Swatches
          title={goEasy}
          colours={palette.goEasy}
          testID="colours-go-easy"
        />
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  result: { gap: theme.space.lg },
  photo: { alignSelf: "center" },
  section: { gap: theme.space.sm },
});
