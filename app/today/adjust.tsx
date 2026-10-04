import { router, useLocalSearchParams } from "expo-router";
import {
  occasionOptions,
  styleOptions,
  type GarmentKind,
  type Occasion,
  type Style,
} from "../../src/domain/closet";
import { kindName, t } from "../../src/i18n";
import { useAdjust, type Exposure } from "../../src/features/adjust/useAdjust";
import { WhenRow } from "../../src/features/adjust/WhenRow";
import {
  ChipRow,
  EmptyState,
  Footer,
  Row,
  Screen,
  Section,
  Segmented,
} from "../../src/ui";

type Garment = GarmentKind | "any";
type WeatherChoice = "forecast" | "unset" | "warm" | "mild" | "cold";

const garments = (): { id: Garment; label: string }[] => [
  { id: "any", label: t("adjust.any") },
  { id: "hijab", label: t("today.garment.hijab") },
  { id: "sweater", label: t("today.garment.knit") },
  { id: "blazer", label: kindName("blazer") },
  { id: "dress", label: kindName("dress") },
  { id: "kurta", label: kindName("kurta") },
  { id: "trousers", label: kindName("trousers") },
];

export default function Adjust() {
  const { keep } = useLocalSearchParams<{ keep?: string; focus?: string }>();
  const adjust = useAdjust(keep);
  const { closet, request, set } = adjust;

  if (!adjust.today || !request)
    return (
      <Screen title={t("title.adjust")}>
        <EmptyState
          title={t("common.setEverydayFirst")}
          action={{ label: t("common.goBack"), onPress: () => router.back() }}
        />
      </Screen>
    );

  const weather = request.weather;
  const manual = weather.source === "manual" ? weather : null;
  const weatherValue: WeatherChoice =
    weather.source === "forecast"
      ? "forecast"
      : manual
        ? manual.warmth
        : "unset";
  const weatherOptions: { id: WeatherChoice; label: string }[] = [
    ...(adjust.forecast
      ? [{ id: "forecast" as const, label: t("adjust.useForecast") }]
      : []),
    { id: "unset", label: t("adjust.notSet") },
    { id: "warm", label: t("weather.warm") },
    { id: "mild", label: t("weather.mild") },
    { id: "cold", label: t("weather.cold") },
  ];
  const chooseWeather = (value: WeatherChoice) =>
    value === "unset"
      ? set({ weather: { source: "unknown" } })
      : value === "forecast"
        ? adjust.forecast && set({ weather: adjust.forecast })
        : set({
            weather: {
              source: "manual",
              warmth: value,
              precipitation: manual?.precipitation ?? "dry",
              exposure: adjust.exposure,
            },
          });

  const kept = request.keptIds.flatMap((id) => {
    const piece = closet.pieces.find((item) => item.id === id);
    return piece ? [piece] : [];
  });
  const keeping =
    kept.length === 1
      ? t("adjust.keepingOne")
      : t("adjust.keepingMany", { count: kept.length });

  return (
    <Screen
      title={t("title.adjust")}
      leading="cancel"
      onCancel={() => router.back()}
      testID="adjust"
      footer={
        <Footer
          primary={{
            label: t("adjust.find"),
            onPress: () => void adjust.submit(),
            busy: adjust.busy,
            disabled: !adjust.dirty,
            testID: "adjust-find",
          }}
          error={adjust.error}
        />
      }
    >
      <Section title={t("adjust.occasion")}>
        <ChipRow
          label={t("adjust.occasion")}
          options={occasionOptions()}
          value={request.occasion}
          onChange={(next) => next && set({ occasion: next as Occasion })}
          testID="adjust-occasion"
        />
      </Section>
      <Section title={t("adjust.day")}>
        <WhenRow
          date={adjust.date}
          today={adjust.localDate}
          tomorrow={adjust.tomorrow}
          onChange={adjust.chooseDate}
        />
      </Section>
      <Section title={t("adjust.style")}>
        <Segmented<Style>
          label={t("adjust.style")}
          options={styleOptions.map((option) => ({
            id: option.id,
            label: option.label,
          }))}
          value={request.style}
          onChange={(style) => set({ style })}
        />
      </Section>
      <Section title={t("adjust.garment")}>
        <ChipRow<Garment>
          label={t("adjust.garment")}
          options={garments()}
          value={request.garmentType ?? "any"}
          onChange={(next) =>
            set({
              garmentType:
                !next || next === "any" ? null : (next as GarmentKind),
            })
          }
          testID="adjust-garment"
        />
        {kept.length ? (
          <Row
            title={`${keeping}, ${kept.map((piece) => piece.name).join(", ")}`}
            leading={
              kept[0] && kept.length === 1 ? { thumb: kept[0] } : { lay: kept }
            }
            trailing={{
              action: {
                label: t("adjust.stopKeeping"),
                onPress: () => set({ keptIds: [] }),
                variant: "quiet",
                size: "small",
              },
            }}
            testID="adjust-kept"
          />
        ) : (
          <Row
            title={t("today.startWithPiece")}
            trailing="chevron"
            onPress={() =>
              router.push({
                pathname: "/today/pieces",
                params: { from: "adjust" },
              })
            }
            testID="adjust-start-with"
          />
        )}
      </Section>
      <Section title={t("adjust.weather")}>
        <ChipRow<WeatherChoice>
          label={t("adjust.weather")}
          options={weatherOptions}
          value={weatherValue}
          onChange={(next) => next && chooseWeather(next as WeatherChoice)}
          testID="adjust-weather"
        />
        {manual ? (
          <Segmented<"dry" | "rain" | "snow">
            label={t("adjust.conditions")}
            options={[
              { id: "dry", label: t("adjust.dry") },
              { id: "rain", label: t("adjust.rain") },
              { id: "snow", label: t("adjust.snow") },
            ]}
            value={manual.precipitation}
            onChange={(precipitation) =>
              set({ weather: { ...manual, precipitation } })
            }
          />
        ) : null}
      </Section>
      <Section title={t("adjust.yourDay")}>
        <Segmented<Exposure>
          label={t("adjust.yourDay")}
          options={[
            { id: "mostly-indoors", label: t("adjust.indoors") },
            { id: "time-outside", label: t("adjust.outside") },
          ]}
          value={adjust.exposure}
          onChange={adjust.setExposure}
        />
      </Section>
      <Section title={t("adjust.closet")}>
        <Segmented<"sample" | "owned">
          label={t("adjust.closet")}
          options={[
            { id: "sample", label: t("today.wardrobeSample") },
            { id: "owned", label: t("today.wardrobeOwned") },
          ]}
          value={request.wardrobe}
          onChange={(wardrobe) => set({ wardrobe, keptIds: [] })}
        />
        {request.excludedIds.length ? (
          <Row
            title={t("today.includeSetAside")}
            trailing={{
              toggle: adjust.includeSetAside,
              onToggle: adjust.setIncludeSetAside,
            }}
            testID="adjust-include"
          />
        ) : null}
      </Section>
      {adjust.isToday ? (
        <Row
          title={t("adjust.makeEveryday")}
          trailing={{
            toggle: adjust.makeEveryday,
            onToggle: adjust.setMakeEveryday,
          }}
          testID="adjust-make-everyday"
        />
      ) : null}
    </Screen>
  );
}
