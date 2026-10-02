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
import { t } from "../../src/i18n";
import { useCloset } from "../../src/state/closet";
import { useDiscardChanges } from "../../src/navigation/useDiscardChanges";
import {
  AppText,
  Button,
  ChoiceGroup,
  ErrorMessage,
  FormScreen,
  HeaderAction,
  Message,
  Screen,
} from "../../src/ui";

const garmentOptions = [
  { id: "any", label: "No preference" },
  { id: "blazer", label: "Blazer" },
  { id: "dress", label: "Dress" },
  { id: "kurta", label: "Kurta" },
  { id: "trousers", label: "Trousers" },
] as const;

const warmthOptions = [
  { id: "unset", label: "Not set" },
  { id: "warm", label: "Warm" },
  { id: "mild", label: "Mild" },
  { id: "cold", label: "Cold" },
] as const;

const precipitationOptions = [
  { id: "dry", label: "Dry" },
  { id: "rain", label: "Rain" },
  { id: "snow", label: "Snow" },
] as const;

const exposureOptions = [
  { id: "mostly-indoors", label: "Mostly indoors" },
  { id: "time-outside", label: "Time outside" },
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
          title="Set your everyday style first"
          description="Today's outfit starts from your everyday style."
          action={<Button label="Go back" onPress={() => router.back()} />}
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
      setError("These choices could not be saved. Please try again.");
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
              ? "For an occasion"
              : "Adjust today",
          headerLeft: () => (
            <HeaderAction label="Cancel" onPress={() => router.back()} />
          ),
        }}
      />
      <AppText muted>
        {newOccasion || today.active === "occasion"
          ? "These choices are just for now. Your everyday style and today's look stay as they are."
          : "These changes are for today only. Your everyday style stays the same."}
      </AppText>
      <ChoiceGroup
        label="Occasion"
        options={occasionOptions()}
        value={request.occasion}
        disabled={busy}
        onChange={(occasion) => set({ occasion })}
      />
      <ChoiceGroup
        label="Style"
        options={styleOptions}
        value={request.style}
        disabled={busy}
        onChange={(style) => set({ style })}
      />
      <ChoiceGroup
        label="Something you want to wear"
        options={garmentOptions}
        value={request.garmentType ?? "any"}
        disabled={busy}
        onChange={(value) =>
          set({ garmentType: value === "any" ? null : (value as GarmentKind) })
        }
      />
      <View style={styles.group}>
        <ChoiceGroup
          label="Weather"
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
              label="Conditions"
              options={precipitationOptions}
              value={manual.precipitation}
              disabled={busy}
              onChange={(precipitation) => setManual({ precipitation })}
            />
            <ChoiceGroup
              label="Your day"
              options={exposureOptions}
              value={manual.exposure}
              disabled={busy}
              onChange={(exposure) => setManual({ exposure })}
            />
          </>
        ) : null}
        <AppText variant="caption" muted>
          Weather you choose here is not a forecast. Sunny but cold still counts
          as cold.
        </AppText>
      </View>
      {kept ? (
        <View style={styles.group}>
          <AppText>
            Keeping {kept} {kept === 1 ? "piece" : "pieces"} in every option.
          </AppText>
          <Button
            label="Stop keeping them"
            secondary
            compact
            disabled={busy}
            onPress={() => set({ keptIds: [] })}
          />
        </View>
      ) : null}
      {request.excludedIds.length ? (
        <Button
          label="Include set-aside pieces again"
          secondary
          compact
          disabled={busy}
          onPress={() => set({ excludedIds: [] })}
        />
      ) : null}
      <ErrorMessage message={error} />
      <Button
        label="Find outfits"
        busy={busy}
        onPress={() => {
          void submit(false);
        }}
      />
      {!newOccasion && today.active === "everyday" ? (
        <Button
          label="Also make this occasion and style my everyday"
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
