import type {
  Closet,
  Forecast,
  ForecastHour,
  ForecastWeather,
  Weather,
} from "./closet";

export const daytime = { from: 8, to: 20 };
export const warmFrom = 18;
export const coldBelow = 8;
export const wetChance = 0.4;

export function localTime(iso: string, timeZone?: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timeZone ?? Intl.DateTimeFormat().resolvedOptions().timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(iso));
  const part = (type: string) =>
    parts.find((item) => item.type === type)?.value ?? "";
  return {
    date: `${part("year")}-${part("month")}-${part("day")}`,
    hour: Number(part("hour")),
  };
}

export function feelsLike(celsius: number, windMs: number) {
  const kmh = windMs * 3.6;
  if (celsius > 10 || kmh < 4.8) return celsius;
  const factor = kmh ** 0.16;
  return 13.12 + 0.6215 * celsius - 11.37 * factor + 0.3965 * celsius * factor;
}

export function daytimeHours(
  hours: ForecastHour[],
  date: string,
  timeZone?: string,
) {
  return hours.filter((item) => {
    const local = localTime(item.at, timeZone);
    return (
      local.date === date &&
      local.hour >= daytime.from &&
      local.hour < daytime.to
    );
  });
}

export function weatherFromForecast(
  hours: ForecastHour[],
  date: string,
  timeZone?: string,
): ForecastWeather | null {
  const day = daytimeHours(hours, date, timeZone);
  if (!day.length) return null;
  const feels =
    day.reduce((sum, item) => sum + feelsLike(item.celsius, item.windMs), 0) /
    day.length;
  const wet = (kind: "rain" | "snow") =>
    day.some((item) => item.precipitation === kind && item.chance >= wetChance);
  return {
    source: "forecast",
    warmth: feels >= warmFrom ? "warm" : feels < coldBelow ? "cold" : "mild",
    precipitation: wet("snow") ? "snow" : wet("rain") ? "rain" : "dry",
    exposure: null,
    at: date,
  };
}

export function forecastFor(
  result: { hours: ForecastHour[]; attribution: Forecast["attribution"] },
  date: string,
  fetchedAt: string,
  timeZone?: string,
): Forecast | null {
  const weather = weatherFromForecast(result.hours, date, timeZone);
  if (!weather) return null;
  const temperatures = daytimeHours(result.hours, date, timeZone).map(
    (item) => item.celsius,
  );
  return {
    date,
    fetchedAt,
    weather,
    low: Math.min(...temperatures),
    high: Math.max(...temperatures),
    attribution: result.attribution,
  };
}

export function forecastWeather(
  forecast: Forecast | null,
  date: string,
  timeZone?: string,
): ForecastWeather | null {
  return forecast &&
    forecast.date === date &&
    localTime(forecast.fetchedAt, timeZone).date === date
    ? forecast.weather
    : null;
}

export function weatherFor(
  closet: Closet,
  date: string,
  timeZone?: string,
): Weather {
  const today = closet.styling.today;
  const session =
    today?.localDate === date
      ? today.active === "occasion" && today.occasion
        ? today.occasion
        : today.everyday
      : null;
  if (session?.request.weather.source === "manual")
    return session.request.weather;
  return (
    forecastWeather(closet.styling.forecast, date, timeZone) ?? {
      source: "unknown",
    }
  );
}
