import { StyleSheet, View } from "react-native";
import { router } from "expo-router";
import { dressiness, dressLevels } from "../../domain/dressy";
import { t } from "../../i18n";
import { addPiecesRoute } from "../../state/imports";
import { Button, Text } from "../../ui";
import { theme } from "../../ui/theme";
import { useColors } from "../../ui/useColors";
import type { TodayModel } from "./useToday";

export function DressyMeter({ model }: { model: TodayModel }) {
  const colors = useColors();
  const occasion = model.request?.occasion;
  const meter = occasion ? dressiness(model.pieces, occasion) : null;
  if (!occasion || !meter) return null;
  const reached = dressLevels.indexOf(meter.level);
  return (
    <View style={styles.meter} testID="today-dressy">
      <View
        accessible
        accessibilityLabel={t("today.dressy.label", {
          level: t(`today.dressy.${meter.level}`),
          goal: t(`today.dressy.${meter.goal}`),
        })}
        style={styles.steps}
      >
        {dressLevels.map((level, index) => (
          <View key={level} style={styles.step}>
            <View
              style={[
                styles.bar,
                {
                  backgroundColor:
                    index <= reached ? colors.plum : colors.sunken,
                },
              ]}
            />
            <Text
              role="footnote"
              tone={level === meter.level ? "ink" : "muted"}
              maxFontSizeMultiplier={2}
            >
              {t(`today.dressy.${level}`)}
            </Text>
          </View>
        ))}
      </View>
      {meter.short ? (
        <View style={styles.short}>
          <Text role="footnote" tone="muted" testID="today-dressy-short">
            {t("today.dressy.short", {
              occasion: t(`occasion.${occasion}.phrase`),
            })}
          </Text>
          <Button
            label={t("today.dressy.add")}
            variant="quiet"
            size="small"
            onPress={() => router.push(addPiecesRoute)}
            testID="today-dressy-add"
          />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  meter: { gap: theme.space.xs },
  steps: { flexDirection: "row", gap: theme.space.xs },
  step: { flex: 1, gap: theme.space.xs },
  bar: { height: 4, borderRadius: theme.radius.full },
  short: { alignItems: "flex-start", gap: theme.space.xs },
});
