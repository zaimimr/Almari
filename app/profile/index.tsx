import { useState } from "react";
import { Pressable, StyleSheet, useWindowDimensions, View } from "react-native";
import Constants from "expo-constants";
import { router } from "expo-router";
import type { Language, Units } from "../../src/domain/closet";
import { resetCloset } from "../../src/domain/onboarding";
import { MorningOutfit } from "../../src/features/profile/MorningOutfit";
import { StyleBoard } from "../../src/features/profile/StyleBoard";
import { profileSummary } from "../../src/features/profile/useProfile";
import { t, useLocale } from "../../src/i18n";
import { useCloset } from "../../src/state/closet";
import { shareData } from "../../src/state/export";
import { syncSchedule } from "../../src/state/notifications";
import { discardAllPhotos } from "../../src/storage/local";
import {
  ChipRow,
  Expander,
  Row,
  Rows,
  Screen,
  Text,
  useOneExpander,
} from "../../src/ui";
import { confirmAction } from "../../src/ui/confirm";
import { theme } from "../../src/ui/theme";

const languages = ["system", "en", "nb"] as const;
const unitOptions = ["metric", "imperial"] as const;

type Open = "morning" | "language" | "units";

export default function Profile() {
  useLocale();
  const { closet, update, reset } = useCloset();
  const { open, toggle } = useOneExpander<Open>();
  const summary = profileSummary(closet);
  const { name, place } = closet.styling;
  const [exportFailed, setExportFailed] = useState(false);
  const { fontScale } = useWindowDimensions();

  const setStyling = (change: { language: Language } | { units: Units }) =>
    void update((current) => ({
      ...current,
      styling: { ...current.styling, ...change },
    })).catch(() => undefined);

  async function exportData() {
    setExportFailed(false);
    await shareData(closet).catch(() => setExportFailed(true));
  }

  async function wipe() {
    const confirmed = await confirmAction(
      t("settings.reset.title"),
      t("settings.reset.text"),
      t("settings.reset.confirm"),
    );
    if (!confirmed) return;
    await reset((current) => resetCloset(current).closet);
    await syncSchedule(null).catch(() => undefined);
    await discardAllPhotos().catch(() => undefined);
    router.replace("/onboarding");
  }

  return (
    <Screen title={t("profile.title")} testID="profile">
      <View key={fontScale} style={styles.page}>
        <View style={styles.head}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={name ?? t("quick.name")}
            accessibilityHint={t("common.edit")}
            onPress={() => router.push("/profile/answer/name")}
            testID="profile-name"
          >
            <Text role="display" tone={name ? "ink" : "plum"} user={!!name}>
              {name ?? t("quick.name")}
            </Text>
          </Pressable>
          {place ? (
            <Text role="subhead" tone="muted">
              {place.name}
            </Text>
          ) : null}
        </View>
        <View style={styles.block}>
          <Text role="eyebrow" accessibilityRole="header">
            {t("style.title")}
          </Text>
          <StyleBoard closet={closet} />
        </View>
        <View>
          <Rows>
            <Row
              title={t("never.title")}
              trailing={{ value: summary.never }}
              onPress={() => router.push("/profile/never")}
              testID="profile-never"
            />
            <Row
              title={t("onboarding.body.title")}
              trailing={{ value: summary.body }}
              onPress={() => router.push("/profile/answer/body")}
              testID="profile-body"
            />
            <Row
              title={t("profile.location")}
              trailing={{ value: summary.place }}
              onPress={() => router.push("/profile/answer/place")}
              testID="profile-location"
            />
          </Rows>
          <MorningOutfit
            open={open === "morning"}
            onToggle={() => toggle("morning")}
          />
          <Expander
            id="profile-language"
            title={t("settings.language")}
            value={t(`settings.language.${closet.styling.language}`)}
            open={open === "language"}
            onToggle={() => toggle("language")}
            testID="profile-language"
          >
            <ChipRow<Language>
              options={languages.map((id) => ({
                id,
                label: t(`settings.language.${id}`),
              }))}
              value={closet.styling.language}
              onChange={(language) => {
                if (typeof language === "string") setStyling({ language });
              }}
              inSurface
            />
          </Expander>
          <Expander
            id="profile-units"
            title={t("onboarding.units.question")}
            value={t(`onboarding.units.${closet.styling.units}`)}
            open={open === "units"}
            onToggle={() => toggle("units")}
            testID="profile-units"
          >
            <ChipRow<Units>
              options={unitOptions.map((id) => ({
                id,
                label: t(`onboarding.units.${id}`),
              }))}
              value={closet.styling.units}
              onChange={(units) => {
                if (typeof units === "string") setStyling({ units });
              }}
              inSurface
            />
          </Expander>
          <Rows>
            <Row
              title={t("settings.export")}
              onPress={() => void exportData()}
              testID="settings-export"
            />
          </Rows>
          {exportFailed ? (
            <Text role="footnote" tone="error" announce>
              {t("settings.export.failed")}
            </Text>
          ) : null}
        </View>
        <Rows>
          <Row
            title={t("settings.reset")}
            tone="error"
            onPress={() => void wipe()}
            testID="settings-reset"
          />
        </Rows>
        <View style={styles.foot}>
          <Text role="footnote" tone="muted" testID="app-privacy">
            {t("settings.privacy")}
          </Text>
          <Text role="footnote" tone="muted" testID="app-version">
            {t("settings.version", {
              version: Constants.expoConfig?.version ?? "",
            })}
          </Text>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  page: { gap: theme.space.xxxl },
  head: { gap: theme.space.xs },
  block: { gap: theme.space.lg },
  foot: { gap: theme.space.xs },
});
