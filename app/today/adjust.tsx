import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { Stack, router, useLocalSearchParams } from "expo-router";
import {
  occasionOptions,
  styleOptions,
  type GarmentKind,
  type OutfitRequest,
  type Weather,
} from "../../src/domain/closet";
import {
  activeSession,
  applyRequest,
  clockFor,
  saveEverydayStyle,
  startOccasion,
} from "../../src/domain/today";
import { forecastWeather } from "../../src/domain/weather";
import { kindName, t } from "../../src/i18n";
import { useCloset } from "../../src/state/closet";
import { useDiscardChanges } from "../../src/navigation/useDiscardChanges";
import {
  AppText,
  Button,
  ChoiceGroup,
  ErrorMessage,
  FormScreen,
  Message,
  Screen,
} from "../../src/ui/legacy";

const garmentOptions = [
  {
    id: "any",
    get label() {
      return t("adjust.any");
    },
  },
  {
    id: "blazer",
    get label() {
      return kindName("blazer");
    },
  },
  {
    id: "dress",
    get label() {
      return kindName("dress");
    },
  },
  {
    id: "kurta",
    get label() {
      return kindName("kurta");
    },
  },
  {
    id: "trousers",
    get label() {
      return kindName("trousers");
    },
  },
] as const;

const warmthOptions = [
  {
    id: "unset",
    get label() {
      return t("adjust.notSet");
    },
  },
  {
    id: "warm",
    get label() {
      return t("weather.warm");
    },
  },
  {
    id: "mild",
    get label() {
      return t("weather.mild");
    },
  },
  {
    id: "cold",
    get label() {
      return t("weather.cold");
    },
  },
] as const;

const precipitationOptions = [
  {
    id: "dry",
    get label() {
      return t("adjust.dry");
    },
  },
  {
    id: "rain",
    get label() {
      return t("adjust.rain");
    },
  },
  {
    id: "snow",
    get label() {
      return t("adjust.snow");
    },
  },
] as const;

const exposureOptions = [
  {
    id: "mostly-indoors",
    get label() {
      return t("adjust.indoors");
    },
  },
  {
    id: "time-outside",
    get label() {
      return t("adjust.outside");
    },
  },
] as const;

type Manual = Extract<Weather, { source: "manual" }>;

export default function AdjustToday() {
  const { target } = useLocalSearchParams<{ target?: string }>();
  const { closet, update } = useCloset();
  const today = closet.styling.today;
  const session = today ? activeSession(today) : null;
  const newOccasion = target === "occasion" && today?.active !== "occasion";
  const [initial] = useState<OutfitRequest | null>(() =>
    session ? session.request : null,
  );
  const [request, setRequest] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dirty =
    newOccasion || JSON.stringify(request) !== JSON.stringify(initial);
  const allowClose = useDiscardChanges(dirty, busy);

  if (!today || !session || !request)
    return (
      <Screen centered>
        <Message
          title={t("common.setEverydayFirst")}
          description={t("common.everydayFirstBody")}
          action={
            <Button label={t("common.goBack")} onPress={() => router.back()} />
          }
        />
      </Screen>
    );

  const weather = request.weather;
  const manual: Manual | null = weather.source === "manual" ? weather : null;
  const fresh = forecastWeather(
    closet.styling.forecast,
    today.localDate,
    today.timeZone,
  );
  const weatherChoices: {
    id: "forecast" | (typeof warmthOptions)[number]["id"];
    label: string;
  }[] = fresh
    ? [{ id: "forecast", label: t("adjust.useForecast") }, ...warmthOptions]
    : [...warmthOptions];
  const set = (changes: Partial<OutfitRequest>) =>
    setRequest((current) => (current ? { ...current, ...changes } : current));
  const setManual = (changes: Partial<Manual>) =>
    set({
      weather: {
        source: "manual",
        warmth: "mild",
        precipitation: "dry",
        exposure: null,
        ...manual,
        ...changes,
      },
    });

  async function submit(saveAsEveryday: boolean) {
    if (!request || !session || busy) return;
    setBusy(true);
    setError(null);
    try {
      await update((current) => {
        const preset = current.styling.everyday;
        const withPreset =
          saveAsEveryday && preset
            ? saveEverydayStyle(
                current,
                {
                  occasion: request.occasion,
                  style: request.style,
                  hijab: preset.hijab,
                  sample: false,
                  coverage: preset.coverage,
                },
                clockFor(new Date()),
                false,
              )
            : current;
        return newOccasion
          ? startOccasion(withPreset, request)
          : applyRequest(
              withPreset,
              request,
              activeSession(withPreset.styling.today!).revision,
            );
      });
      allowClose();
      router.back();
    } catch {
      setError(t("error.choicesSave"));
    } finally {
      setBusy(false);
    }
  }

  const kept = request.keptIds.length;

  return (
    <FormScreen>
      <Stack.Screen
        options={{
          title:
            newOccasion || today.active === "occasion"
              ? t("today.forOccasion")
              : t("title.adjustToday"),
        }}
      />
      <AppText muted>
        {newOccasion || today.active === "occasion"
          ? t("adjust.occasionNote")
          : t("adjust.todayNote")}
      </AppText>
      <ChoiceGroup
        label={t("adjust.occasion")}
        options={occasionOptions()}
        value={request.occasion}
        disabled={busy}
        onChange={(occasion) => set({ occasion })}
      />
      <ChoiceGroup
        label={t("adjust.style")}
        options={styleOptions}
        value={request.style}
        disabled={busy}
        onChange={(style) => set({ style })}
      />
      <ChoiceGroup
        label={t("adjust.wear")}
        options={garmentOptions}
        value={request.garmentType ?? "any"}
        disabled={busy}
        onChange={(value) =>
          set({ garmentType: value === "any" ? null : (value as GarmentKind) })
        }
      />
      <View style={styles.group}>
        <ChoiceGroup
          label={t("adjust.weather")}
          options={weatherChoices}
          value={
            manual
              ? manual.warmth
              : weather.source === "forecast"
                ? "forecast"
                : "unset"
          }
          disabled={busy}
          onChange={(value) =>
            value === "unset"
              ? set({ weather: { source: "unknown" } })
              : value === "forecast"
                ? fresh && set({ weather: fresh })
                : setManual({ warmth: value })
          }
        />
        {manual ? (
          <>
            <ChoiceGroup
              label={t("adjust.conditions")}
              options={precipitationOptions}
              value={manual.precipitation}
              disabled={busy}
              onChange={(precipitation) => setManual({ precipitation })}
            />
            <ChoiceGroup
              label={t("adjust.day")}
              options={exposureOptions}
              value={manual.exposure}
              disabled={busy}
              onChange={(exposure) => setManual({ exposure })}
            />
          </>
        ) : null}
        <AppText variant="footnote" muted>
          {t("adjust.notForecast")}
        </AppText>
      </View>
      {kept ? (
        <View style={styles.group}>
          <AppText>
            {kept === 1
              ? t("adjust.keepingOne")
              : t("adjust.keepingMany", { count: kept })}
          </AppText>
          <Button
            label={t("adjust.stopKeeping")}
            secondary
            compact
            disabled={busy}
            onPress={() => set({ keptIds: [] })}
          />
        </View>
      ) : null}
      {request.excludedIds.length ? (
        <Button
          label={t("adjust.includeAgain")}
          secondary
          compact
          disabled={busy}
          onPress={() => set({ excludedIds: [] })}
        />
      ) : null}
      <ErrorMessage message={error} />
      <Button
        label={t("adjust.find")}
        busy={busy}
        onPress={() => {
          void submit(false);
        }}
      />
      {!newOccasion && today.active === "everyday" ? (
        <Button
          label={t("adjust.alsoEveryday")}
          secondary
          disabled={busy}
          onPress={() => {
            void submit(true);
          }}
        />
      ) : null}
    </FormScreen>
  );
}

const styles = StyleSheet.create({
  group: { gap: 12 },
});
