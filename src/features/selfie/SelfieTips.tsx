import { StyleSheet, View } from "react-native";
import { seasons } from "../../domain/closet";
import { labHex, seasonColours } from "../../domain/colourAnalysis";
import { t } from "../../i18n";
import { Symbol, Text } from "../../ui";
import { theme } from "../../ui/theme";
import { useColors } from "../../ui/useColors";

const tips = [
  ["colours.tip.daylight", "sun.max"],
  ["colours.tip.lens", "camera.aperture"],
  ["colours.tip.glasses", "eyeglasses"],
  ["colours.tip.lip", "mouth"],
] as const;

const ring = 176;
const bead = 26;

function Halo() {
  const colors = useColors();
  const radius = (ring - bead) / 2;
  return (
    <View
      style={styles.halo}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {seasons.map((season, index) => {
        const angle = (index / seasons.length) * 2 * Math.PI - Math.PI / 2;
        return (
          <View
            key={season}
            style={[
              styles.bead,
              {
                left: radius + radius * Math.cos(angle),
                top: radius + radius * Math.sin(angle),
                backgroundColor: labHex(seasonColours(season)[0]!),
                borderColor: colors.line,
              },
            ]}
          />
        );
      })}
      <View style={[styles.face, { backgroundColor: colors.surface }]}>
        <Symbol name="face.smiling" size={48} tone="plum" />
      </View>
    </View>
  );
}

export function SelfieTips() {
  const colors = useColors();
  return (
    <View style={styles.tips} testID="selfie-tips">
      <Halo />
      <View style={[styles.card, { backgroundColor: colors.surface }]}>
        {tips.map(([tip, icon]) => (
          <View key={tip} style={styles.tip}>
            <View style={[styles.icon, { backgroundColor: colors.plumSoft }]}>
              <Symbol name={icon} size={20} tone="plum" />
            </View>
            <Text role="headline" style={styles.label}>
              {t(tip)}
            </Text>
          </View>
        ))}
      </View>
      <Text role="footnote" tone="muted">
        {t("colours.camera.privacy")}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tips: { gap: theme.space.lg },
  halo: {
    width: ring,
    height: ring,
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
    marginVertical: theme.space.lg,
  },
  bead: {
    position: "absolute",
    width: bead,
    height: bead,
    borderRadius: bead / 2,
    borderWidth: StyleSheet.hairlineWidth,
  },
  face: {
    width: ring - 2 * bead - 2 * theme.space.md,
    height: ring - 2 * bead - 2 * theme.space.md,
    borderRadius: ring,
    alignItems: "center",
    justifyContent: "center",
  },
  tip: { flexDirection: "row", alignItems: "center", gap: theme.space.md },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  label: { flexShrink: 1 },
  card: {
    gap: theme.space.lg,
    padding: theme.space.lg,
    borderRadius: theme.radius.md,
    borderCurve: "continuous",
  },
});
