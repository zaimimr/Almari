import { StyleSheet, View } from "react-native";
import { router } from "expo-router";
import { answersFrom, type AnswerStep } from "../../src/domain/onboarding";
import { formatHeight } from "../../src/domain/units";
import { seasonLabel } from "../../src/features/colourText";
import { t } from "../../src/i18n";
import { useCloset } from "../../src/state/closet";
import { AppText, Chip, FormScreen } from "../../src/ui";

export default function Profile() {
  const { closet } = useCloset();
  const answers = answersFrom(closet);
  const { hijab, place, body, taste, colours } = answers;
  const summary = (...parts: (string | null)[]) =>
    parts.filter(Boolean).join(", ") || t("profile.notAnswered");
  const rows: { step: AnswerStep; title: string; text: string }[] = [
    {
      step: "hijab",
      title: t("onboarding.hijab.title"),
      text: summary(
        hijab.hijab && t(`onboarding.hijab.${hijab.hijab}`),
        hijab.coverage && t(`onboarding.coverage.${hijab.coverage}`),
      ),
    },
    {
      step: "place",
      title: t("onboarding.place.title"),
      text: summary(
        t(`onboarding.units.${place.units}`),
        place.place?.name ?? null,
      ),
    },
    {
      step: "body",
      title: t("onboarding.body.title"),
      text: summary(
        body.heightCm === null
          ? null
          : formatHeight(body.heightCm, place.units),
        body.bodyShape && t(`shape.${body.bodyShape}`),
      ),
    },
    {
      step: "taste",
      title: t("onboarding.taste.title"),
      text: summary(
        taste.fit && t(`onboarding.fit.${taste.fit}`),
        taste.colourLean && t(`onboarding.colourLean.${taste.colourLean}`),
        taste.styleLean && t(`onboarding.styleLean.${taste.styleLean}`),
      ),
    },
    {
      step: "colours",
      title: t("profile.colours"),
      text: summary(colours.colour ? seasonLabel(colours.colour.season) : null),
    },
  ];
  return (
    <FormScreen>
      {rows.map((row) => (
        <View key={row.step} style={styles.row} testID={`answer-${row.step}`}>
          <View style={styles.text}>
            <AppText style={styles.label}>{row.title}</AppText>
            <AppText muted>{row.text}</AppText>
          </View>
          <Chip
            label={t("profile.change")}
            accessibilityLabel={`${t("profile.change")}: ${row.title}`}
            onPress={() =>
              row.step === "colours"
                ? router.push("/onboarding/colours")
                : router.push({
                    pathname: "/onboarding",
                    params: { step: row.step },
                  })
            }
          />
        </View>
      ))}
    </FormScreen>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 12,
  },
  text: { flex: 1, minWidth: 160, gap: 2 },
  label: { fontWeight: "600" },
});
