import { StyleSheet, View } from "react-native";
import type { Answers } from "../../domain/onboarding";
import { t } from "../../i18n";
import { Button, Swatches, Text } from "../../ui";
import { theme } from "../../ui/theme";
import { useColors } from "../../ui/useColors";
import { paletteOf, seasonLabel } from "../selfie/palette";

export function StepColours({
  answers,
  onSelfie,
  onKnown,
}: {
  answers: Answers;
  onSelfie: () => void;
  onKnown: () => void;
}) {
  const colors = useColors();
  const { colour } = answers.colours;
  const plain = answers.hijab.hijab === "no";
  return (
    <View style={styles.colours}>
      {colour ? (
        <View
          style={[styles.palette, { backgroundColor: colors.surface }]}
          testID="colours-saved"
        >
          <Text role="title">{seasonLabel(colour.season)}</Text>
          <Swatches
            title={t(plain ? "colours.bestShadesPlain" : "colours.bestShades")}
            colours={paletteOf(colour).best}
          />
        </View>
      ) : null}
      <View style={styles.actions}>
        <Button
          label={t("colours.selfie")}
          variant="secondary"
          icon="faceid"
          onPress={onSelfie}
          testID="colours-selfie"
        />
        <Button
          label={t("colours.known")}
          variant="secondary"
          icon="swatchpalette"
          onPress={onKnown}
          testID="colours-known"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  colours: { gap: theme.space.xl },
  actions: { gap: theme.space.sm },
  palette: {
    gap: theme.space.md,
    padding: theme.space.lg,
    borderRadius: theme.radius.lg,
    borderCurve: "continuous",
  },
});
