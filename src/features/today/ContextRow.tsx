import {
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
} from "react-native";
import { router } from "expo-router";
import type { Forecast, Weather } from "../../domain/closet";
import { occasionPhrase } from "../../domain/taxonomy";
import { backToEveryday } from "../../domain/today";
import { locale, occasionName, styleName, t } from "../../i18n";
import { Chip, Silk } from "../../ui";
import { gutterFor, theme } from "../../ui/theme";
import { useLargeText } from "../../ui/useLargeText";
import type { TodayModel } from "./useToday";

const warmthKeys = {
  warm: "weather.warm",
  mild: "weather.mild",
  cold: "weather.cold",
} as const;

export function weatherText(weather: Weather) {
  if (weather.source === "unknown") return t("weather.unset");
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

export function ContextRow({ model }: { model: TodayModel }) {
  const { ax } = useLargeText();
  const gutter = gutterFor(useWindowDimensions().width);
  const { closet, request, mode, today, session } = model;
  if (!request || !today) return null;
  const adjust = t("title.adjustToday");
  const openAdjust = () => router.push("/today/adjust");

  const keptNames = request.keptIds.flatMap((id) => {
    const piece = closet.pieces.find((item) => item.id === id);
    return piece ? [piece.name] : [];
  });
  const sessionLabel =
    mode !== "occasion"
      ? null
      : keptNames.length > 2
        ? t("today.banner.startedMore", {
            names: keptNames.slice(0, 2).join(", "),
            count: keptNames.length - 2,
          })
        : keptNames.length > 0
          ? t("today.banner.started", {
              names: keptNames.join(` ${t("word.and")} `),
            })
          : t("today.banner.occasion", {
              occasion: occasionPhrase(request.occasion),
            });

  const place = closet.styling.place;
  const forecast = closet.styling.forecast;
  const date = session?.date ?? today.localDate;
  const shownForecast =
    request.weather.source === "forecast" && forecast?.date === date
      ? forecast
      : null;
  const weatherLabel =
    shownForecast && place
      ? forecastText(shownForecast, place.name)
      : place && model.forecastFailed && request.weather.source !== "manual"
        ? t("weather.unavailable")
        : weatherText(request.weather);
  const weatherSpoken =
    shownForecast && place
      ? t("weather.spoken", {
          city: place.name,
          low: degrees(shownForecast.low),
          high: degrees(shownForecast.high),
        })
      : weatherLabel;

  const chips = (
    <>
      {sessionLabel ? (
        <Chip
          label={sessionLabel}
          kind="control"
          icon="xmark"
          onPress={() => void model.restyle(backToEveryday, null)}
          accessibilityLabel={`${sessionLabel}, ${t("today.backToEveryday")}`}
          testID="session-chip"
        />
      ) : null}
      <Chip
        label={occasionName(request.occasion)}
        kind="control"
        opens="screen"
        onPress={openAdjust}
        accessibilityLabel={t("occasion.chipLabel", {
          adjust,
          occasion: occasionName(request.occasion),
        })}
        testID="occasion-chip"
      />
      <Chip
        label={styleName(request.style)}
        kind="control"
        opens="screen"
        onPress={openAdjust}
        accessibilityLabel={t("style.chipLabel", {
          adjust,
          style: styleName(request.style),
        })}
        testID="style-chip"
      />
      {model.forecastLoading && place ? (
        <View style={styles.placeholder}>
          <Silk kind="placeholder" shape="chip" label={t("common.loading")} />
        </View>
      ) : (
        <Chip
          label={weatherLabel}
          kind="control"
          opens="screen"
          onPress={openAdjust}
          accessibilityLabel={t(
            mode === "tomorrow"
              ? "weather.chipLabelTomorrow"
              : "weather.chipLabel",
            { adjust, weather: weatherSpoken },
          )}
          testID="weather-chip"
        />
      )}
      {request.wardrobe === "sample" ? (
        <Chip
          label={t("closet.sample")}
          kind="control"
          opens="screen"
          onPress={openAdjust}
          accessibilityLabel={t("closet.sampleChipLabel", {
            value: t("closet.sample"),
          })}
          testID="sample-chip"
        />
      ) : null}
    </>
  );

  return ax ? (
    <View style={styles.wrap}>{chips}</View>
  ) : (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={{ marginHorizontal: -gutter }}
      contentContainerStyle={[styles.row, { paddingHorizontal: gutter }]}
    >
      {chips}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: theme.space.sm },
  wrap: { flexDirection: "row", flexWrap: "wrap", gap: theme.space.sm },
  placeholder: { width: 120 },
});
