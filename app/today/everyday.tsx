import { useState } from "react";
import { Stack, router } from "expo-router";
import {
  hemNeeds,
  occasionOptions,
  sleeveNeeds,
  styleOptions,
  type Coverage,
  type HemNeed,
  type HijabPreference,
  type Occasion,
  type SleeveNeed,
  type Style,
} from "../../src/domain/closet";
import { saveProfile } from "../../src/domain/feedback";
import { t } from "../../src/i18n";
import { clockFor, saveEverydayStyle } from "../../src/domain/today";
import { useCloset } from "../../src/state/closet";
import { useDiscardChanges } from "../../src/navigation/useDiscardChanges";
import {
  AppText,
  Button,
  ChoiceGroup,
  ErrorMessage,
  FormScreen,
  HeaderAction,
} from "../../src/ui";

const hijabOptions = [
  { id: "always", label: "Always include a hijab" },
  { id: "not-needed", label: "Not needed" },
] as const;

const levelHelp = {
  full: "coverage.helpFull",
  moderate: "coverage.helpModerate",
  own: "coverage.helpOwn",
} as const;

export default function EverydayStyle() {
  const { closet, update } = useCloset();
  const preset = closet.styling.everyday;
  const [occasion, setOccasion] = useState<Occasion | null>(
    preset?.occasion ?? null,
  );
  const [style, setStyle] = useState<Style | null>(preset?.style ?? null);
  const [hijab, setHijab] = useState<HijabPreference>(preset?.hijab ?? null);
  const savedLevel = closet.styling.profile.coverageLevel;
  const [level, setLevel] = useState<Coverage | null>(savedLevel);
  const [sleeve, setSleeve] = useState<SleeveNeed | null>(
    preset?.coverage?.sleeve ?? null,
  );
  const [hem, setHem] = useState<HemNeed | null>(preset?.coverage?.hem ?? null);
  const levelOptions = [
    { id: "full", label: t("onboarding.coverage.full") },
    { id: "moderate", label: t("onboarding.coverage.moderate") },
    { id: "own", label: t("onboarding.coverage.own") },
  ] as const;
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dirty =
    occasion !== (preset?.occasion ?? null) ||
    style !== (preset?.style ?? null) ||
    hijab !== (preset?.hijab ?? null) ||
    level !== savedLevel ||
    sleeve !== (preset?.coverage?.sleeve ?? null) ||
    hem !== (preset?.coverage?.hem ?? null);
  const allowClose = useDiscardChanges(dirty, busy);

  async function save(restyleToday: boolean) {
    if (!occasion || !style || busy) return;
    setBusy(true);
    setError(null);
    try {
      await update((current) =>
        saveEverydayStyle(
          level === current.styling.profile.coverageLevel
            ? current
            : saveProfile(current, {
                ...current.styling.profile,
                coverageLevel: level,
              }),
          { occasion, style, hijab, sample: false, coverage: { sleeve, hem } },
          clockFor(new Date()),
          restyleToday,
        ),
      );
      allowClose();
      router.back();
    } catch {
      setError("Your everyday style could not be saved. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <FormScreen>
      <Stack.Screen
        options={{
          headerLeft: () => (
            <HeaderAction label="Cancel" onPress={() => router.back()} />
          ),
        }}
      />
      <AppText muted>
        Each day starts from these choices. You can still change anything for a
        single day or an occasion.
      </AppText>
      {preset?.sample ? (
        <AppText variant="caption" muted>
          You are using the sample style. Choose what fits you.
        </AppText>
      ) : null}
      <ChoiceGroup
        label="Usual occasion"
        options={occasionOptions()}
        value={occasion}
        disabled={busy}
        onChange={setOccasion}
      />
      <ChoiceGroup
        label="Usual style"
        options={styleOptions}
        value={style}
        disabled={busy}
        onChange={setStyle}
      />
      <ChoiceGroup
        label="Hijab in outfits"
        options={hijabOptions}
        value={hijab}
        disabled={busy}
        onChange={setHijab}
      />
      <ChoiceGroup
        label={t("coverage.levelLabel")}
        options={levelOptions}
        value={level}
        disabled={busy}
        onChange={setLevel}
      />
      {level === "own" ? (
        <>
          <ChoiceGroup
            label={t("coverage.sleevesLabel")}
            options={sleeveNeeds}
            value={sleeve}
            disabled={busy}
            onChange={setSleeve}
          />
          <ChoiceGroup
            label={t("coverage.hemLabel")}
            options={hemNeeds}
            value={hem}
            disabled={busy}
            onChange={setHem}
          />
        </>
      ) : null}
      <AppText variant="caption" muted>
        {t(level ? levelHelp[level] : "coverage.helpUnset")}
      </AppText>
      <ErrorMessage message={error} />
      <Button
        label={preset ? "Save and restyle today" : "Save everyday style"}
        busy={busy}
        disabled={!occasion || !style || (Boolean(preset) && !dirty)}
        onPress={() => {
          void save(true);
        }}
      />
      {preset ? (
        <Button
          label="Save, keep today's outfit"
          secondary
          disabled={busy || !occasion || !style || !dirty}
          onPress={() => {
            void save(false);
          }}
        />
      ) : null}
    </FormScreen>
  );
}
