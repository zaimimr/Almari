import { StyleSheet, View } from "react-native";
import { engineName } from "../../src/domain/scoring/engine";
import {
  embeddingVector,
  embeddingOf,
} from "../../src/domain/scoring/modelScorer";
import { engineResults, rateText } from "../../src/domain/scoring/results";
import { styleName, t } from "../../src/i18n";
import { useCloset } from "../../src/state/closet";
import { AppText, FormScreen } from "../../src/ui";
import { theme } from "../../src/ui/theme";

export default function StylistResults() {
  const { closet } = useCloset();
  const rows = engineResults(closet.feedback);
  const unread = closet.pieces.filter(
    (piece) =>
      piece.source === "owned" &&
      embeddingVector(embeddingOf(piece) ?? "") === null,
  ).length;

  return (
    <FormScreen>
      <AppText muted>{t("stylist.intro")}</AppText>
      {(["western", "desi"] as const).map((style) => (
        <View key={style} style={styles.section}>
          <AppText variant="heading" maxFontSizeMultiplier={2}>
            {styleName(style)}
          </AppText>
          {rows
            .filter((row) => row.style === style)
            .map((row) => (
              <View key={row.engine} style={styles.card}>
                <AppText style={styles.name}>{engineName(row.engine)}</AppText>
                <AppText>
                  {t("stylist.wouldWear", {
                    rate: rateText(row.earlyWouldWear, row.earlyRated),
                  })}
                </AppText>
                <AppText>
                  {t("stylist.notMyStyle", {
                    rate: rateText(row.notMyStyle, row.rated),
                  })}
                </AppText>
                <AppText>{t("stylist.wore", { count: row.wore })}</AppText>
              </View>
            ))}
        </View>
      ))}
      {unread ? (
        <AppText variant="caption" muted>
          {unread === 1
            ? t("stylist.unreadOne")
            : t("stylist.unreadMany", { count: unread })}
        </AppText>
      ) : null}
    </FormScreen>
  );
}

const styles = StyleSheet.create({
  section: { gap: theme.space.md },
  card: {
    gap: theme.space.xs,
    padding: theme.space.lg,
    borderRadius: theme.radius,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.line,
    backgroundColor: theme.colors.surface,
  },
  name: { fontWeight: "600" },
});
