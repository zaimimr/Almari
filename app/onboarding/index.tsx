import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Stack, router, useLocalSearchParams } from "expo-router";
import ClosetVision from "../../modules/closet-vision/src";
import { bodyShapes, type Closet } from "../../src/domain/closet";
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
  onboardingSteps,
  skipStep,
  type AnswerStep,
  type Answers,
  type OnboardingStep,
} from "../../src/domain/onboarding";
import { clockFor } from "../../src/domain/today";
import { feetAndInches, parseHeight } from "../../src/domain/units";
import { seasonLabel, swatchLabel } from "../../src/features/colourText";
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
  HeaderAction,
} from "../../src/ui";
import { theme } from "../../src/ui/theme";

const isStep = (value: unknown): value is OnboardingStep =>
  onboardingSteps.includes(value as OnboardingStep);

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
  const [step, setStep] = useState<OnboardingStep>(
    single ?? onboardingSteps[0],
  );
  const [answers, setAnswers] = useState<Answers>(() => answersFrom(closet));
  const [height, setHeight] = useState(() =>
    heightEntry(closet.styling.profile.heightCm),
  );
  const [declined, setDeclined] = useState(false);
  const [city, setCity] = useState(closet.styling.place?.name ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const units = answers.place.units;
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
    else setStep(skipStep(step));
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
    let answer: Answers[AnswerStep] = answers[step];
    if (step === "body") {
      const empty =
        units === "metric"
          ? !height.cm.trim()
          : !height.feet.trim() && !height.inches.trim();
      const heightCm = empty ? null : parseHeight(units, height);
      if (!empty && heightCm === null)
        return setError(t("onboarding.height.invalid"));
      answer = { ...answers.body, heightCm };
    }
    if (step === "place") {
      if (city.trim() && city.trim() !== answers.place.place?.name)
        return void findCity();
      if (!city.trim()) answer = { ...answers.place, place: null };
    }
    void run(
      (current) => applyAnswer(current, step, answer, clockFor(new Date())),
      advance,
    );
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
          { colour: seasonFromSwatch(swatch) },
          clockFor(new Date()),
        ),
      () => undefined,
    );
  }

  function finish(addClothes: boolean) {
    void run(finishOnboarding, () => {
      router.replace("/today");
      if (addClothes) router.push(addPiecesRoute);
    });
  }

  const position = onboardingSteps.indexOf(step) + 1;

  return (
    <FormScreen key={step}>
      <Stack.Screen
        options={{
          title: t(`onboarding.${step}.title`),
          headerBackVisible: Boolean(single),
          gestureEnabled: Boolean(single),
          headerLeft: single
            ? () => (
                <HeaderAction
                  label={t("onboarding.cancel")}
                  onPress={() => router.back()}
                />
              )
            : undefined,
        }}
      />
      {single ? null : (
        <View style={styles.progress}>
          <AppText variant="caption" muted>
            {t("onboarding.progress", {
              step: position,
              total: onboardingSteps.length,
            })}
          </AppText>
          <View style={styles.track}>
            <View
              style={[
                styles.fill,
                { width: `${(position / onboardingSteps.length) * 100}%` },
              ]}
            />
          </View>
        </View>
      )}

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
            value={answers.hijab.coverage}
            disabled={busy}
            onChange={(coverage) => change("hijab", { coverage })}
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
            onChange={(next) => change("place", { units: next })}
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
          <AppText variant="caption" muted>
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
          <ChoiceGroup
            label={t("onboarding.shape.question")}
            options={[...bodyShapes, "none" as const].map((id) => ({
              id,
              label: t(`shape.${id}`),
            }))}
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
            value={answers.taste.fit}
            disabled={busy}
            onChange={(fit) => change("taste", { fit })}
          />
          <ChoiceGroup
            label={t("onboarding.colourLean.question")}
            options={(["bold", "soft", "depends"] as const).map((id) => ({
              id,
              label: t(`onboarding.colourLean.${id}`),
            }))}
            value={answers.taste.colourLean}
            disabled={busy}
            onChange={(colourLean) => change("taste", { colourLean })}
          />
          <ChoiceGroup
            label={t("onboarding.styleLean.question")}
            options={(["desi", "western", "both"] as const).map((id) => ({
              id,
              label: t(`onboarding.styleLean.${id}`),
            }))}
            value={answers.taste.styleLean}
            disabled={busy}
            onChange={(styleLean) => change("taste", { styleLean })}
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
                <AppText variant="caption">{swatchLabel(swatch)}</AppText>
              </Pressable>
            ))}
          </View>
        </>
      ) : null}

      {step === "done" ? <AppText>{t("onboarding.done.text")}</AppText> : null}

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
  );
}

const styles = StyleSheet.create({
  progress: { gap: 8 },
  track: {
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.colors.line,
    overflow: "hidden",
  },
  fill: { height: 6, backgroundColor: theme.colors.accent },
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
