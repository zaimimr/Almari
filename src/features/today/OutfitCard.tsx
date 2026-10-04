import { Linking, StyleSheet, View } from "react-native";
import type { Forecast, Weather } from "../../domain/closet";
import { locale, t } from "../../i18n";
import { Button, Text } from "../../ui";
import { theme } from "../../ui/theme";
import type { TodayModel } from "./useToday";

const warmthKeys = {
  warm: "weather.warm",
  mild: "weather.mild",
  cold: "weather.cold",
} as const;

function weatherText(weather: Weather) {
  if (weather.source === "unknown") return null;
  const rain =
    weather.precipitation === "rain"
      ? t("weather.rainSuffix")
      : weather.precipitation === "snow"
        ? t("weather.snowSuffix")
        : "";
  return `${t(warmthKeys[weather.warmth])}${rain}`;
}

const degrees = (value: number) => Math.round(value).toLocaleString(locale);

function forecastText(forecast: Forecast, city: string) {
  const values = {
    city,
    low: degrees(forecast.low),
    high: degrees(forecast.high),
  };
  const precipitation = forecast.weather.precipitation;
  return precipitation === "rain"
    ? t("weather.chipRain", values)
    : precipitation === "snow"
      ? t("weather.chipSnow", values)
      : t("weather.chip", values);
}

function shownForecast(model: TodayModel) {
  const forecast = model.closet.styling.forecast;
  const date = model.session?.date ?? model.today?.localDate;
  return forecast &&
    forecast.date === date &&
    model.request?.weather.source === "forecast"
    ? forecast
    : null;
}

export function OutfitCard({ model }: { model: TodayModel }) {
  const { closet, request } = model;
  const place = closet.styling.place;
  const forecast = shownForecast(model);
  const weather =
    !request || model.forecastLoading
      ? null
      : forecast && place
        ? forecastText(forecast, place.name)
        : weatherText(request.weather);
  const caption = [weather, model.reasonLine].filter(Boolean).join(" · ");

  return (
    <View style={styles.card}>
      <View style={styles.titleLine}>
        <Text
          role="title"
          style={styles.title}
          accessibilityRole="header"
          testID="today-title"
        >
          {model.name}
        </Text>
        <Button
          label={t("outfit.like")}
          variant="icon"
          icon="heart"
          selectedIcon="heart.fill"
          selected={model.liked}
          onPress={model.like}
          testID={model.liked ? "today-like-on" : "today-like"}
        />
      </View>
      {caption ? (
        <Text role="footnote" tone="muted" testID="today-reason">
          {caption}
        </Text>
      ) : null}
      {forecast ? (
        <View style={styles.mark}>
          <Button
            label={t("forecast.mark")}
            accessibilityLabel={t("forecast.markLabel")}
            variant="quiet"
            size="small"
            onPress={() => void Linking.openURL(forecast.attribution.url)}
            testID="forecast-mark"
          />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { gap: theme.space.xs },
  titleLine: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.space.sm,
  },
  title: { flex: 1, minWidth: 0 },
  mark: { alignItems: "flex-start" },
});
