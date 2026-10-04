import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Stack, router, useLocalSearchParams } from "expo-router";
import ClosetVision from "../../modules/closet-vision/src";
import type { Closet } from "../../src/domain/closet";
import {
  labHex,
  seasonFromSwatch,
  skinSwatches,
  type Swatch,
} from "../../src/domain/colourAnalysis";
import {
  answersFrom,
  applyAnswer,
  finishOnboarding,
  type AnswerStep,
  type Answers,
} from "../../src/domain/onboarding";
import { clockFor } from "../../src/domain/today";
import { feetAndInches, parseHeight } from "../../src/domain/units";
import { seasonLabel, swatchLabel } from "../../src/features/colourText";
import { BodyShapes } from "../../src/features/BodyShapes";
import { OnboardingBar } from "../../src/features/OnboardingBar";
import { t } from "../../src/i18n";
import { useCloset } from "../../src/state/closet";
import { addPiecesRoute } from "../../src/state/imports";
import {
  AppText,
  Button,
  ChoiceGroup,
  ErrorMessage,
  Field,
  FormScreen,
} from "../../src/ui/legacy";
import { theme } from "../../src/ui/theme";
import { now } from "../../src/state/clock";

const steps = ["hijab", "place", "body", "taste", "colours", "done"] as const;

type Step = (typeof steps)[number];

const isStep = (value: unknown): value is Step => steps.includes(value as Step);

const heightEntry = (cm: number | null) =>
  cm === null
    ? { cm: "", feet: "", inches: "" }
    : {
        cm: String(cm),
        feet: String(feetAndInches(cm).feet),
        inches: String(feetAndInches(cm).inches),
      };

export default function Onboarding() {
  const params = useLocalSearchParams<{ step?: string }>();
  const single =
    isStep(params.step) && params.step !== "done" ? params.step : null;
  const { closet, update } = useCloset();
  const [step, setStep] = useState<Step>(single ?? steps[0]);
  const [answers, setAnswers] = useState<Answers>(() => answersFrom(closet));
  const [height, setHeight] = useState(() =>
    heightEntry(closet.styling.profile.heightCm),
  );
  const [declined, setDeclined] = useState(false);
  const [city, setCity] = useState(closet.styling.place?.name ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const units = answers.body.units;
  const saved = closet.styling.profile.colour;

  function change<S extends AnswerStep>(key: S, value: Partial<Answers[S]>) {
    setAnswers((current) => ({
      ...current,
      [key]: { ...current[key], ...value },
    }));
  }

  function advance() {
    setError(null);
    if (single) router.back();
    else setStep(steps[steps.indexOf(step) + 1] ?? "done");
  }

  async function run(transform: (current: Closet) => Closet, then: () => void) {
    setBusy(true);
    setError(null);
    try {
      await update(transform);
      then();
    } catch {
      setError(t("onboarding.saveFailed"));
    } finally {
      setBusy(false);
    }
  }

  function save() {
    if (step === "done" || step === "colours") return advance();
    let body = answers.body;
    let place = answers.place;
    if (step === "body") {
      const empty =
        units === "metric"
          ? !height.cm.trim()
          : !height.feet.trim() && !height.inches.trim();
      const heightCm = empty ? null : parseHeight(units, height);
      if (!empty && heightCm === null)
        return setError(t("onboarding.height.invalid"));
      body = { ...answers.body, heightCm };
    }
    if (step === "place") {
      if (city.trim() && city.trim() !== answers.place.place?.name)
        return void findCity();
      if (!city.trim()) place = { place: null };
    }
    const clock = clockFor(now());
    const transforms = {
      hijab: (current: Closet) =>
        applyAnswer(
          applyAnswer(current, "hijab", answers.hijab, clock),
          "coverage",
          answers.coverage,
          clock,
        ),
      place: (current: Closet) =>
        applyAnswer(
          applyAnswer(current, "place", place, clock),
          "body",
          { ...answersFrom(current).body, units },
          clock,
        ),
      body: (current: Closet) => applyAnswer(current, "body", body, clock),
      taste: (current: Closet) =>
        applyAnswer(
          applyAnswer(
            applyAnswer(current, "style", answers.style, clock),
            "fit",
            answers.fit,
            clock,
          ),
          "colours",
          {
            ...answersFrom(current).colours,
            colourLean: answers.colours.colourLean,
          },
          clock,
        ),
    };
    void run(transforms[step], advance);
  }

  async function findCity() {
    setBusy(true);
    setError(null);
    try {
      const found = await ClosetVision.geocodeCity(city);
      if (!found) setError(t("onboarding.city.notFound"));
      else {
        change("place", { place: found });
        setCity(found.name);
      }
    } catch {
      setError(t("onboarding.city.notFound"));
    } finally {
      setBusy(false);
    }
  }

  function pickSwatch(swatch: Swatch) {
    void run(
      (current) =>
        applyAnswer(
          current,
          "colours",
          {
            colour: seasonFromSwatch(swatch),
            colourLean: current.styling.profile.colourLean,
          },
          clockFor(now()),
        ),
      () => undefined,
    );
  }

  function finish(addClothes: boolean) {
    void run(
      (current) => finishOnboarding(current, clockFor(now())),
      () => {
        router.replace("/today");
        if (addClothes) router.push(addPiecesRoute);
      },
    );
  }

  const position = steps.indexOf(step) + 1;

  const back = steps[steps.indexOf(step) - 1] ?? null;

  return (
    <View style={styles.screen}>
      <Stack.Screen
        options={{ headerShown: false, gestureEnabled: Boolean(single) }}
      />
      <OnboardingBar
        action={
          single
            ? { label: t("onboarding.cancel"), onPress: () => router.back() }
            : back
              ? {
                  label: t("common.back"),
                  back: true,
                  onPress: () => {
                    setError(null);
                    setStep(back);
                  },
                }
              : null
        }
        progress={single ? undefined : { step: position, total: steps.length }}
      />
      <FormScreen key={step}>
        <AppText variant="display" accessibilityRole="header">
          {t(`onboarding.${step}.title`)}
        </AppText>
        {step === "hijab" ? (
          <>
            {single ? null : <AppText muted>{t("onboarding.intro")}</AppText>}
            <ChoiceGroup
              label={t("onboarding.hijab.question")}
              options={(["always", "sometimes", "no"] as const).map((id) => ({
                id,
                label: t(`onboarding.hijab.${id}`),
              }))}
              value={answers.hijab.hijab}
              disabled={busy}
              onChange={(hijab) => change("hijab", { hijab })}
            />
            <ChoiceGroup
              label={t("onboarding.coverage.question")}
              options={(["full", "moderate", "own"] as const).map((id) => ({
                id,
                label: t(`onboarding.coverage.${id}`),
              }))}
              value={answers.coverage.coverage}
              disabled={busy}
              onChange={(coverage) =>
                change("coverage", { coverage, answered: true })
              }
            />
          </>
        ) : null}

        {step === "place" ? (
          <>
            <ChoiceGroup
              label={t("onboarding.units.question")}
              options={(["metric", "imperial"] as const).map((id) => ({
                id,
                label: t(`onboarding.units.${id}`),
              }))}
              value={units}
              disabled={busy}
              onChange={(next) => change("body", { units: next })}
            />
            <Field
              label={t("onboarding.city.label")}
              value={city}
              onChangeText={setCity}
              autoCapitalize="words"
              autoCorrect={false}
              returnKeyType="search"
              onSubmitEditing={() => {
                void findCity();
              }}
              testID="city"
            />
            <Button
              label={t("onboarding.city.find")}
              secondary
              compact
              disabled={busy || !city.trim()}
              onPress={() => {
                void findCity();
              }}
            />
            {answers.place.place ? (
              <AppText>
                {t("onboarding.city.found", { name: answers.place.place.name })}
              </AppText>
            ) : null}
            <AppText variant="footnote" muted>
              {t("onboarding.city.privacy")}
            </AppText>
          </>
        ) : null}

        {step === "body" ? (
          <>
            <AppText muted>{t("onboarding.body.why")}</AppText>
            {units === "metric" ? (
              <Field
                label={t("onboarding.height.label")}
                value={height.cm}
                onChangeText={(cm) => setHeight({ ...height, cm })}
                keyboardType="numbers-and-punctuation"
                returnKeyType="done"
                testID="height-cm"
              />
            ) : (
              <View style={styles.row}>
                <View style={styles.grow}>
                  <Field
                    label={t("onboarding.height.feet")}
                    value={height.feet}
                    onChangeText={(feet) => setHeight({ ...height, feet })}
                    keyboardType="numbers-and-punctuation"
                    returnKeyType="done"
                    testID="height-feet"
                  />
                </View>
                <View style={styles.grow}>
                  <Field
                    label={t("onboarding.height.inches")}
                    value={height.inches}
                    onChangeText={(inches) => setHeight({ ...height, inches })}
                    keyboardType="numbers-and-punctuation"
                    returnKeyType="done"
                    testID="height-inches"
                  />
                </View>
              </View>
            )}
            <BodyShapes
              value={answers.body.bodyShape ?? (declined ? "none" : null)}
              disabled={busy}
              onChange={(shape) => {
                setDeclined(shape === "none");
                change("body", { bodyShape: shape === "none" ? null : shape });
              }}
            />
          </>
        ) : null}

        {step === "taste" ? (
          <>
            <ChoiceGroup
              label={t("onboarding.fit.question")}
              options={(["loose", "structured", "depends"] as const).map(
                (id) => ({ id, label: t(`onboarding.fit.${id}`) }),
              )}
              value={answers.fit.fit}
              disabled={busy}
              onChange={(fit) => change("fit", { fit })}
            />
            <ChoiceGroup
              label={t("onboarding.colourLean.question")}
              options={(["bold", "soft", "depends"] as const).map((id) => ({
                id,
                label: t(`onboarding.colourLean.${id}`),
              }))}
              value={answers.colours.colourLean}
              disabled={busy}
              onChange={(colourLean) => change("colours", { colourLean })}
            />
            <ChoiceGroup
              label={t("onboarding.styleLean.question")}
              options={(["desi", "western", "both"] as const).map((id) => ({
                id,
                label: t(`onboarding.styleLean.${id}`),
              }))}
              value={answers.style.styleLean}
              disabled={busy}
              onChange={(styleLean) => change("style", { styleLean })}
            />
          </>
        ) : null}

        {step === "colours" ? (
          <>
            <AppText muted>{t("onboarding.colours.why")}</AppText>
            {saved ? (
              <AppText testID="colour-result">
                {t("onboarding.colours.saved", {
                  season: seasonLabel(saved.season),
                })}
              </AppText>
            ) : null}
            <Button
              label={t("onboarding.colours.selfie")}
              secondary
              disabled={busy}
              onPress={() => router.push("/onboarding/colours")}
            />
            <AppText style={styles.label}>
              {t("onboarding.colours.swatch")}
            </AppText>
            <View style={styles.swatches}>
              {skinSwatches.map((swatch) => (
                <Pressable
                  key={swatch.id}
                  accessibilityRole="button"
                  accessibilityLabel={swatchLabel(swatch)}
                  accessibilityState={{
                    selected:
                      saved?.source === "swatch" &&
                      saved.skin?.join() === swatch.lab.join(),
                  }}
                  disabled={busy}
                  onPress={() => pickSwatch(swatch)}
                  style={styles.swatch}
                >
                  <View
                    style={[
                      styles.swatchColour,
                      { backgroundColor: labHex(swatch.lab) },
                    ]}
                  />
                  <AppText variant="footnote">{swatchLabel(swatch)}</AppText>
                </Pressable>
              ))}
            </View>
          </>
        ) : null}

        {step === "done" ? (
          <AppText>{t("onboarding.done.text")}</AppText>
        ) : null}

        <ErrorMessage message={error} />
        {step === "done" ? (
          <>
            <Button
              label={t("onboarding.done.add")}
              busy={busy}
              onPress={() => finish(true)}
            />
            <Button
              label={t("onboarding.done.sample")}
              secondary
              disabled={busy}
              onPress={() => finish(false)}
            />
          </>
        ) : (
          <>
            <Button
              label={single ? t("onboarding.save") : t("onboarding.next")}
              busy={busy}
              onPress={save}
            />
            {single ? null : (
              <Button
                label={t("onboarding.skip")}
                secondary
                disabled={busy}
                onPress={advance}
              />
            )}
          </>
        )}
      </FormScreen>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.colors.canvas },
  label: { fontWeight: "600" },
  row: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  grow: { flexGrow: 1, flexBasis: 120 },
  swatches: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  swatch: { minWidth: 96, maxWidth: "100%", alignItems: "center", gap: 6 },
  swatchColour: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: theme.colors.line,
  },
});
