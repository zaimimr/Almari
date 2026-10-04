import { StyleSheet, View } from "react-native";
import type { Answers } from "../../domain/onboarding";
import { t } from "../../i18n";
import { Button, Swatches, Text } from "../../ui";
import { theme } from "../../ui/theme";
import { paletteOf, seasonLabel } from "../selfie/palette";

export function StepColours({
  answers,
  onSelfie,
}: {
  answers: Answers;
  onSelfie: () => void;
}) {
  const { colour } = answers.colours;
  const plain = answers.hijab.hijab === "no";
  return (
    <View style={styles.colours}>
      <View style={styles.start}>
        <Button
          label={t("colours.selfie")}
          variant="secondary"
          size="regular"
          icon="camera"
          onPress={onSelfie}
          testID="colours-selfie"
        />
      </View>
      {colour ? (
        <View style={styles.palette} testID="colours-saved">
          <Text role="headline">{seasonLabel(colour.season)}</Text>
          <Swatches
            title={t(plain ? "colours.bestShadesPlain" : "colours.bestShades")}
            colours={paletteOf(colour).best}
          />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  colours: { gap: theme.space.xl },
  start: { alignItems: "flex-start" },
  palette: { gap: theme.space.sm },
});
