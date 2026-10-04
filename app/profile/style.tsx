import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import {
  coverageNeedFor,
  settingKeys,
  type Closet,
  type HemNeed,
  type SleeveNeed,
} from "../../src/domain/closet";
import { saveProfile } from "../../src/domain/feedback";
import {
  answersFrom,
  applyAnswer,
  type Answers,
} from "../../src/domain/onboarding";
import { occasions, type Occasion } from "../../src/domain/taxonomy";
import { clockFor, saveEverydayStyle } from "../../src/domain/today";
import { StepFit } from "../../src/features/onboarding/StepFit";
import { StepHijab } from "../../src/features/onboarding/StepHijab";
import { StepHijabStyles } from "../../src/features/onboarding/StepHijabStyles";
import { StepSparkle } from "../../src/features/onboarding/StepSparkle";
import { StepStyle } from "../../src/features/onboarding/StepStyle";
import { coverageOptions } from "../../src/features/onboarding/illustrations";
import { StyleRules, type Rules } from "../../src/features/profile/StyleRules";
import { t, type Key } from "../../src/i18n";
import { useDiscardChanges } from "../../src/navigation/useDiscardChanges";
import { useCloset } from "../../src/state/closet";
import { now } from "../../src/state/clock";
import {
  ChipRow,
  ChoiceCardGroup,
  Expander,
  Footer,
  Screen,
  Text,
} from "../../src/ui";
import { theme } from "../../src/ui/theme";

const steps = [
  "hijab",
  "hijabStyles",
  "coverage",
  "style",
  "fit",
  "sparkle",
] as const;

type Row = "occasion" | (typeof steps)[number] | "exposure" | "rules";

type Exposure = "mostly-indoors" | "time-outside";
type CoverageChoice = "full" | "moderate" | "relaxed" | "none" | "own";

type Draft = {
  answers: Answers;
  occasion: Occasion;
  exposure: Exposure;
  sleeve: SleeveNeed | null;
  hem: HemNeed | null;
  rules: Rules;
};

function draftFrom(closet: Closet): Draft {
  const everyday = closet.styling.everyday;
  const profile = closet.styling.profile;
  return {
    answers: answersFrom(closet),
    occasion: everyday?.occasion ?? "everyday",
    exposure: everyday?.exposure ?? "mostly-indoors",
    sleeve: everyday?.coverage?.sleeve ?? null,
    hem: everyday?.coverage?.hem ?? null,
    rules: Object.fromEntries(
      settingKeys.map((key) => [key, profile[key]]),
    ) as Rules,
  };
}

const notAnswered = () => t("profile.notAnswered");

function values(draft: Draft) {
  const { hijab, hijabStyles, coverage, style, fit, sparkle } = draft.answers;
  const level = coverage.coverage;
  return {
    occasion: t(`occasion.${draft.occasion}`),
    hijab: hijab.hijab
      ? t(hijab.hijab === "no" ? "onboarding.hijab.no" : `hijab.${hijab.hijab}`)
      : notAnswered(),
    hijabStyles: hijabStyles.hijabStyles
      ? hijabStyles.hijabStyles.length
        ? new Intl.ListFormat(undefined, { type: "conjunction" }).format(
            hijabStyles.hijabStyles.map((id) => t(`hijabStyle.${id}` as Key)),
          )
        : t("common.noneOfThese")
      : notAnswered(),
    coverage: level
      ? t(`coverage.${level}` as Key)
      : coverage.answered
        ? t("coverage.noPreference")
        : notAnswered(),
    style: style.styleLean
      ? t(`onboarding.style.${style.styleLean}`)
      : t("onboarding.style.both"),
    fit: fit.fit
      ? t(
          fit.fit === "depends"
            ? "onboarding.depends"
            : `onboarding.fit.${fit.fit}`,
        )
      : notAnswered(),
    sparkle: sparkle.sparkle ? t(`sparkle.${sparkle.sparkle}`) : notAnswered(),
    exposure: t(
      draft.exposure === "mostly-indoors" ? "adjust.indoors" : "adjust.outside",
    ),
  };
}

const titles: Record<Exclude<Row, "rules">, Key> = {
  occasion: "style.occasion",
  hijab: "style.hijab",
  hijabStyles: "style.hijabStyles",
  coverage: "coverage.levelLabel",
  style: "style.style",
  fit: "style.fit",
  sparkle: "style.sparkle",
  exposure: "adjust.yourDay",
};

export default function YourStyle() {
  const params = useLocalSearchParams<{ open?: string; then?: string }>();
  const { closet, update } = useCloset();
  const [saved] = useState(() => draftFrom(closet));
  const [draft, setDraft] = useState(saved);
  const [open, setOpen] = useState<Row | null>(
    (params.open as Row | undefined) ?? null,
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dirty = JSON.stringify(draft) !== JSON.stringify(saved);
  const allowClose = useDiscardChanges(dirty, busy);
  const shown = values(draft);
  const hasEveryday = closet.styling.everyday !== null;
  const fromQuick = Boolean(params.open);

  const toggle = (row: Row) =>
    setOpen((current) => (current === row ? null : row));
  const setAnswer = <S extends keyof Answers>(key: S, next: Answers[S]) =>
    setDraft((current) => ({
      ...current,
      answers: { ...current.answers, [key]: next },
    }));
  const option = (label: string, group: Key) => ({
    label,
    accessibilityLabel: t("common.optionInGroup", {
      option: label,
      group: t(group),
    }),
  });

  async function save(restyle: boolean) {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      await update((current) => {
        const clock = clockFor(now());
        const before = answersFrom(current);
        let next = current;
        for (const step of steps) {
          if (
            JSON.stringify(before[step]) !== JSON.stringify(draft.answers[step])
          )
            next = applyAnswer(next, step, draft.answers[step], clock);
        }
        next = saveProfile(next, {
          ...next.styling.profile,
          ...draft.rules,
        });
        const lean = next.styling.profile.styleLean;
        const prior = next.styling.everyday;
        const coverage = coverageNeedFor(next.styling.profile.coverageLevel, {
          sleeve: draft.sleeve,
          hem: draft.hem,
        });
        const rest = {
          style:
            prior?.style ??
            (lean === "desi" ? ("desi" as const) : ("western" as const)),
          hijab: prior?.hijab ?? null,
          sample: prior?.sample ?? false,
        };
        return saveEverydayStyle(
          next,
          {
            ...rest,
            occasion: draft.occasion,
            exposure: draft.exposure,
            ...(coverage ? { coverage } : {}),
          },
          clock,
          restyle,
        );
      });
      allowClose();
      if (restyle || params.then === "today") router.navigate("/(tabs)/today");
      else router.back();
    } catch {
      setError(t("common.error.save"));
    } finally {
      setBusy(false);
    }
  }

  const expander = (row: Exclude<Row, "rules">, body: React.ReactNode) => (
    <Expander
      key={row}
      id={`style-${row}`}
      title={t(titles[row])}
      value={shown[row]}
      open={open === row}
      onToggle={() => toggle(row)}
      testID={`style-${row}`}
    >
      {body}
    </Expander>
  );

  const coverage = draft.answers.coverage;
  const coverageValue: CoverageChoice | null = coverage.coverage
    ? coverage.coverage
    : coverage.answered
      ? "none"
      : null;

  const restyleLabel = t("everyday.saveRestyle");
  const footer = hasEveryday ? (
    <Footer
      secondary={{
        label: t("common.save"),
        onPress: () => void save(false),
        disabled: !dirty,
        busy,
        testID: "style-save",
      }}
      primary={{
        label: restyleLabel,
        onPress: () => void save(true),
        disabled: !dirty,
        busy,
        testID: "style-restyle",
      }}
      error={error}
    />
  ) : (
    <Footer
      primary={{
        label: fromQuick ? t("common.save") : restyleLabel,
        onPress: () => void save(!fromQuick),
        busy,
        testID: "style-save",
      }}
      error={error}
    />
  );

  return (
    <Screen
      title={t("style.title")}
      leading="cancel"
      onCancel={() => router.back()}
      footer={footer}
      testID="your-style"
    >
      <View style={styles.list}>
        {expander(
          "occasion",
          <ChipRow<Occasion>
            options={occasions.map(({ id }) => ({
              id,
              ...option(t(`occasion.${id}`), "style.occasion"),
            }))}
            value={draft.occasion}
            onChange={(next) => {
              if (typeof next === "string")
                setDraft((current) => ({ ...current, occasion: next }));
            }}
            inSurface
          />,
        )}
        {expander(
          "hijab",
          <StepHijab
            answers={draft.answers}
            onChange={(next) => setAnswer("hijab", next)}
          />,
        )}
        {draft.answers.hijab.hijab === "no"
          ? null
          : expander(
              "hijabStyles",
              <StepHijabStyles
                answers={draft.answers}
                onChange={(next) => setAnswer("hijabStyles", next)}
              />,
            )}
        {expander(
          "coverage",
          <View style={styles.list}>
            <ChoiceCardGroup<CoverageChoice>
              options={coverageOptions()}
              plain={[
                { id: "none", label: t("coverage.noPreference") },
                { id: "own", label: t("coverage.own") },
              ]}
              value={coverageValue}
              onChange={(next) =>
                setAnswer("coverage", {
                  coverage:
                    next === "none" || next === null || Array.isArray(next)
                      ? null
                      : next,
                  answered: true,
                })
              }
              testID="coverage-card"
            />
            {coverage.coverage === "own" ? (
              <>
                <ChipRow<SleeveNeed>
                  label={t("coverage.sleevesLabel")}
                  options={[
                    {
                      id: "elbow",
                      ...option(t("coverage.toElbow"), "coverage.sleevesLabel"),
                    },
                    {
                      id: "long",
                      ...option(t("coverage.toWrist"), "coverage.sleevesLabel"),
                    },
                    {
                      id: "any",
                      ...option(
                        t("coverage.anyLength"),
                        "coverage.sleevesLabel",
                      ),
                    },
                  ]}
                  value={draft.sleeve}
                  onChange={(next) =>
                    setDraft((current) => ({
                      ...current,
                      sleeve: typeof next === "string" ? next : null,
                    }))
                  }
                />
                <ChipRow<HemNeed>
                  label={t("coverage.hemLabel")}
                  options={[
                    {
                      id: "calf",
                      ...option(t("coverage.toCalf"), "coverage.hemLabel"),
                    },
                    {
                      id: "ankle",
                      ...option(t("coverage.toAnkle"), "coverage.hemLabel"),
                    },
                    {
                      id: "any",
                      ...option(t("coverage.anyLength"), "coverage.hemLabel"),
                    },
                  ]}
                  value={draft.hem}
                  onChange={(next) =>
                    setDraft((current) => ({
                      ...current,
                      hem: typeof next === "string" ? next : null,
                    }))
                  }
                />
              </>
            ) : null}
          </View>,
        )}
        {expander(
          "style",
          <StepStyle
            answers={draft.answers}
            onChange={(next) => setAnswer("style", next)}
          />,
        )}
        {expander(
          "fit",
          <StepFit
            answers={draft.answers}
            onChange={(next) => setAnswer("fit", next)}
          />,
        )}
        {expander(
          "sparkle",
          <StepSparkle
            answers={draft.answers}
            onChange={(next) => setAnswer("sparkle", next)}
          />,
        )}
        {expander(
          "exposure",
          <ChipRow<Exposure>
            options={[
              {
                id: "mostly-indoors",
                ...option(t("adjust.indoors"), "adjust.yourDay"),
              },
              {
                id: "time-outside",
                ...option(t("adjust.outside"), "adjust.yourDay"),
              },
            ]}
            value={draft.exposure}
            onChange={(next) => {
              if (typeof next === "string")
                setDraft((current) => ({ ...current, exposure: next }));
            }}
            inSurface
          />,
        )}
        <StyleRules
          value={draft.rules}
          onChange={(next) =>
            setDraft((current) => ({
              ...current,
              rules: { ...current.rules, ...next },
            }))
          }
          open={open === "rules"}
          onToggle={() => toggle("rules")}
        />
        {error ? (
          <Text role="footnote" tone="error">
            {error}
          </Text>
        ) : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { gap: theme.space.lg },
});
