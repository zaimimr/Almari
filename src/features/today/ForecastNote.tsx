import { Pressable, StyleSheet, View } from "react-native";
import { Image } from "expo-image";
import * as Linking from "expo-linking";
import type { Closet, OutfitRequest } from "../../domain/closet";
import { formatTemperature } from "../../domain/units";
import { t } from "../../i18n";
import { AppText } from "../../ui/legacy";
import { theme } from "../../ui/theme";

export function ForecastNote({
  closet,
  request,
  failed,
}: {
  closet: Closet;
  request: OutfitRequest;
  failed: boolean;
}) {
  const { place, forecast, units } = closet.styling;
  if (!place) return null;
  if (request.weather.source === "manual")
    return (
      <AppText testID="forecast-note" variant="footnote" muted>
        {t("forecast.manual")}
      </AppText>
    );
  if (request.weather.source === "forecast" && forecast)
    return (
      <View testID="forecast-note" style={styles.note}>
        <AppText variant="footnote" muted>
          {t("forecast.label", {
            city: place.name,
            low: formatTemperature(forecast.low, units),
            high: formatTemperature(forecast.high, units),
          })}
        </AppText>
        <View style={styles.row}>
          <Image
            source={{ uri: forecast.attribution.logo }}
            style={styles.mark}
            contentFit="contain"
            accessibilityLabel={t("forecast.mark")}
          />
          <Pressable
            accessibilityRole="link"
            hitSlop={8}
            onPress={() => {
              void Linking.openURL(forecast.attribution.url);
            }}
          >
            <AppText variant="footnote" style={styles.link}>
              {t("forecast.sources")}
            </AppText>
          </Pressable>
        </View>
      </View>
    );
  return failed ? (
    <AppText testID="forecast-note" variant="footnote" muted>
      {t("forecast.unavailable")}
    </AppText>
  ) : null;
}

const styles = StyleSheet.create({
  note: { gap: 6 },
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 12,
  },
  mark: { width: 96, height: 14 },
  link: { color: theme.colors.plum, fontWeight: "600" },
});
