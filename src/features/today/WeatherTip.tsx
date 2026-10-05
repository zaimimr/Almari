import { StyleSheet, View } from "react-native";
import { garmentWord } from "../../domain/outfitName";
import { locale, t } from "../../i18n";
import { Button, Text } from "../../ui";
import { theme } from "../../ui/theme";
import type { TodayModel } from "./useToday";

export function WeatherTip({ model }: { model: TodayModel }) {
  const tip = model.tip;
  if (!tip) return null;
  const name = tip.piece.name.trim() || garmentWord(tip.piece, locale);
  const replaces = tip.replaces;
  return (
    <View style={styles.tip} testID="today-weather-tip">
      <Text role="footnote" tone="muted">
        {t(`today.tip.${tip.weather}`)}
      </Text>
      <View style={styles.bleed}>
        <Button
          label={t(replaces ? "today.tip.wear" : "today.tip.add", { name })}
          variant="quiet"
          size="small"
          onPress={() =>
            replaces
              ? model.pick(replaces, tip.piece)
              : model.addPiece(tip.piece)
          }
          testID="today-weather-tip-action"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tip: { alignItems: "flex-start", gap: theme.space.xs },
  bleed: { marginLeft: -theme.space.sm },
});
