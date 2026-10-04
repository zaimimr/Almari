import { StyleSheet, View } from "react-native";
import Constants from "expo-constants";
import { router } from "expo-router";
import type { CardLayout, Language } from "../../src/domain/closet";
import { replayOnboarding, resetCloset } from "../../src/domain/onboarding";
import { engineName } from "../../src/domain/scoring/engine";
import { Completeness } from "../../src/features/profile/Completeness";
import { MorningOutfit } from "../../src/features/profile/MorningOutfit";
import {
  openNeverWorn,
  profileSummary,
} from "../../src/features/profile/useProfile";
import { t, useLocale } from "../../src/i18n";
import { useCloset } from "../../src/state/closet";
import { syncSchedule } from "../../src/state/notifications";
import { discardAllPhotos } from "../../src/storage/local";
import {
  ChipRow,
  Expander,
  Row,
  Rows,
  Screen,
  Section,
  Text,
  useOneExpander,
} from "../../src/ui";
import { confirmAction } from "../../src/ui/confirm";
import { theme } from "../../src/ui/theme";

const languages = ["system", "en", "nb"] as const;
const layouts = ["minimal", "reasons", "full"] as const;

type Open = "morning" | "language" | "layout";

export default function Profile() {
  useLocale();
  const { closet, update, reset } = useCloset();
  const { open, toggle } = useOneExpander<Open>();
  const summary = profileSummary(closet);
  const edit = t("common.edit");

  const setStyling = (change: Partial<typeof closet.styling>) =>
    void update((current) => ({
      ...current,
      styling: { ...current.styling, ...change },
    })).catch(() => undefined);

  async function replay() {
    const confirmed = await confirmAction(
      t("settings.replay.title"),
      t("settings.replay.body"),
      t("settings.replay"),
    );
    if (!confirmed) return;
    await update(replayOnboarding);
    await syncSchedule(null).catch(() => undefined);
    router.replace("/onboarding");
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

  const answer = (title: string, meta: string, step: string) => (
    <Row
      key={step}
      title={title}
      meta={meta}
      trailing="chevron"
      accessibilityLabel={`${title}, ${meta}, ${edit}`}
      onPress={() => router.push(`/profile/answer/${step}`)}
      testID={`answer-${step}`}
    />
  );

  return (
    <Screen title={t("profile.title")} testID="profile">
      <View style={styles.page}>
        <Completeness closet={closet} />
        <Rows>
          <Row
            title={t("style.title")}
            meta={summary.style}
            trailing="chevron"
            onPress={() => router.push("/profile/style")}
            testID="profile-style"
          />
          <Row
            title={t("never.title")}
            meta={summary.never}
            trailing="chevron"
            onPress={() => router.push("/profile/never")}
            testID="profile-never"
          />
          <Row
            title={t("wearMore.title")}
            meta={summary.wearMore}
            trailing="chevron"
            onPress={() => router.push("/profile/wear-more")}
            testID="profile-wear-more"
          />
        </Rows>
        <Section title={t("settings.answers")}>
          <Rows>
            {answer(t("profile.name"), summary.name, "name")}
            {answer(t("onboarding.place.title"), summary.place, "place")}
            {answer(t("onboarding.body.title"), summary.body, "body")}
            {answer(t("profile.colours"), summary.colours, "colours")}
          </Rows>
        </Section>
        <Section title={t("stats.title")} testID="closet-stats">
          <Rows>
            {summary.neverWorn ? (
              <Row
                title={t("stats.neverWorn")}
                meta={summary.neverWorn}
                trailing="chevron"
                onPress={openNeverWorn}
                testID="stats-never-worn"
              />
            ) : null}
            {summary.mostWorn ? (
              <Row
                title={t("stats.mostWorn")}
                meta={summary.mostWorn.text}
                trailing="chevron"
                onPress={() => router.push(`/piece/${summary.mostWorn!.id}`)}
                testID="stats-most-worn"
              />
            ) : (
              <Row
                title={t("stats.mostWorn")}
                trailing={{ value: t("stats.nothingWorn") }}
                testID="stats-most-worn"
              />
            )}
          </Rows>
        </Section>
        <Section title={t("settings.title")}>
          <View style={styles.expanders}>
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
              id="profile-layout"
              title={t("style.layout")}
              value={t(`style.layout.${closet.styling.layout}`)}
              open={open === "layout"}
              onToggle={() => toggle("layout")}
              testID="profile-layout"
            >
              <ChipRow<CardLayout>
                options={layouts.map((id) => ({
                  id,
                  label: t(`style.layout.${id}`),
                  accessibilityLabel: t("common.optionInGroup", {
                    option: t(`style.layout.${id}`),
                    group: t("style.layout"),
                  }),
                }))}
                value={closet.styling.layout}
                onChange={(layout) => {
                  if (typeof layout === "string") setStyling({ layout });
                }}
                inSurface
              />
            </Expander>
          </View>
        </Section>
        <Section title={t("settings.advanced")}>
          <Rows>
            <Row
              title={t("stylist.label")}
              meta={engineName(closet.styling.engine)}
              trailing="chevron"
              onPress={() => router.push("/profile/stylist")}
              testID="profile-stylist"
            />
          </Rows>
        </Section>
        <Section title={t("settings.app")}>
          <Rows>
            <Row
              title={t("settings.replay")}
              onPress={() => void replay()}
              testID="settings-replay"
            />
            <Row
              title={t("settings.reset")}
              onPress={() => void wipe()}
              testID="settings-reset"
            />
          </Rows>
          <Text role="footnote" tone="muted" testID="app-privacy">
            {t("settings.privacy")}
          </Text>
          <Text role="footnote" tone="muted" testID="app-version">
            {t("settings.version", {
              version: Constants.expoConfig?.version ?? "",
            })}
          </Text>
        </Section>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  page: { gap: theme.space.xl },
  expanders: { gap: theme.space.lg },
});
