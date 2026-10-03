import { useState } from "react";
import { StyleSheet, View } from "react-native";
import Constants from "expo-constants";
import { router } from "expo-router";
import type { Language } from "../../../src/domain/closet";
import {
  answersFrom,
  replayOnboarding,
  resetCloset,
} from "../../../src/domain/onboarding";
import { closetStats } from "../../../src/domain/profileStats";
import { formatHeight } from "../../../src/domain/units";
import { seasonLabel } from "../../../src/features/colourText";
import { t } from "../../../src/i18n";
import { useCloset } from "../../../src/state/closet";
import { discardAllPhotos } from "../../../src/storage/local";
import {
  AppText,
  Button,
  Chip,
  ChoiceGroup,
  ErrorMessage,
  FormScreen,
} from "../../../src/ui";
import { confirmAction } from "../../../src/ui/confirm";
import { theme } from "../../../src/ui/theme";

const languages = ["system", "en", "nb"] as const;

export default function Profile() {
  const { closet, update, reset: resetStore } = useCloset();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const answers = answersFrom(closet);
  const stats = closetStats(closet);
  const { hijab, coverage, place, body, style, fit, colours } = answers;
  const summary = (...parts: (string | null)[]) =>
    parts.filter(Boolean).join(", ") || t("profile.notAnswered");
  const rows: { step: string; title: string; text: string }[] = [
    {
      step: "hijab",
      title: t("onboarding.hijab.title"),
      text: summary(
        hijab.hijab && t(`onboarding.hijab.${hijab.hijab}`),
        coverage.coverage && coverage.coverage !== "relaxed"
          ? t(`onboarding.coverage.${coverage.coverage}`)
          : null,
      ),
    },
    {
      step: "place",
      title: t("onboarding.place.title"),
      text: summary(
        t(`onboarding.units.${body.units}`),
        place.place?.name ?? null,
      ),
    },
    {
      step: "body",
      title: t("onboarding.body.title"),
      text: summary(
        body.heightCm === null ? null : formatHeight(body.heightCm, body.units),
        body.bodyShape && t(`shape.${body.bodyShape}`),
      ),
    },
    {
      step: "taste",
      title: t("onboarding.taste.title"),
      text: summary(
        fit.fit && t(`onboarding.fit.${fit.fit}`),
        colours.colourLean && t(`onboarding.colourLean.${colours.colourLean}`),
        style.styleLean && t(`onboarding.styleLean.${style.styleLean}`),
      ),
    },
    {
      step: "colours",
      title: t("profile.colours"),
      text: summary(colours.colour ? seasonLabel(colours.colour.season) : null),
    },
  ];
  async function run(action: () => Promise<void>) {
    setBusy(true);
    setError(null);
    try {
      await action();
    } catch {
      setError(t("settings.failed"));
    } finally {
      setBusy(false);
    }
  }

  function chooseLanguage(language: Language) {
    void run(() =>
      update((current) => ({
        ...current,
        styling: { ...current.styling, language },
      })),
    );
  }

  function replay() {
    void run(async () => {
      await update(replayOnboarding);
      router.replace("/onboarding");
    });
  }

  async function reset() {
    const confirmed = await confirmAction(
      t("settings.reset.title"),
      t("settings.reset.text"),
      t("settings.reset.confirm"),
    );
    if (!confirmed) return;
    await run(async () => {
      await resetStore((current) => resetCloset(current).closet);
      await discardAllPhotos().catch(() => undefined);
      router.replace("/onboarding");
    });
  }

  return (
    <FormScreen>
      <AppText variant="title">{t("settings.answers")}</AppText>
      {rows.map((row) => (
        <View key={row.step} style={styles.row} testID={`answer-${row.step}`}>
          <View style={styles.text}>
            <AppText style={styles.label}>{row.title}</AppText>
            <AppText muted>{row.text}</AppText>
          </View>
          <Chip
            label={t("profile.change")}
            accessibilityLabel={`${t("profile.change")}: ${row.title}`}
            onPress={() =>
              router.push({
                pathname: "/onboarding",
                params: { step: row.step },
              })
            }
          />
        </View>
      ))}
      <AppText variant="title">{t("style.title")}</AppText>
      <Button
        label={t("profile.style")}
        secondary
        onPress={() => router.push("/today/style")}
      />
      <AppText variant="title">{t("stats.title")}</AppText>
      <View style={styles.stats} testID="closet-stats">
        <Stat label={t("stats.pieces")} value={String(stats.pieces)} />
        <Stat label={t("stats.neverWorn")} value={String(stats.neverWorn)} />
      </View>
      <View style={styles.text}>
        <AppText style={styles.label}>{t("stats.mostWorn")}</AppText>
        {stats.mostWorn.length ? (
          stats.mostWorn.map(({ piece, count }) => (
            <AppText key={piece.id} muted>
              {t(count === 1 ? "stats.wornOnce" : "stats.wornMany", {
                name: piece.name,
                count,
              })}
            </AppText>
          ))
        ) : (
          <AppText muted>{t("stats.nothingWorn")}</AppText>
        )}
      </View>
      <AppText variant="title">{t("settings.app")}</AppText>
      <ChoiceGroup
        label={t("settings.language")}
        options={languages.map((id) => ({
          id,
          label: t(`settings.language.${id}`),
        }))}
        value={closet.styling.language}
        disabled={busy}
        onChange={chooseLanguage}
      />
      <Button
        label={t("settings.replay")}
        secondary
        disabled={busy}
        onPress={replay}
      />
      <Button
        label={t("settings.reset")}
        danger
        disabled={busy}
        onPress={() => {
          void reset();
        }}
      />
      <ErrorMessage message={error} />
      <AppText variant="footnote" muted>
        {t("settings.privacy")}
      </AppText>
      <AppText variant="footnote" muted testID="app-version">
        {t("settings.version", {
          version: Constants.expoConfig?.version ?? "",
        })}
      </AppText>
    </FormScreen>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <AppText variant="title">{value}</AppText>
      <AppText muted>{label}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  stats: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  stat: {
    flexGrow: 1,
    flexBasis: 140,
    padding: 16,
    gap: 2,
    borderRadius: theme.radius.md,
    borderCurve: "continuous",
    backgroundColor: theme.colors.surface,
  },
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 12,
  },
  text: { flexGrow: 1, flexBasis: 240, gap: 2 },
  label: { fontWeight: "600" },
});
