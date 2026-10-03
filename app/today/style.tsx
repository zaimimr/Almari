import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { Stack, router } from "expo-router";
import type { CardLayout, StyleProfile } from "../../src/domain/closet";
import { saveProfile } from "../../src/domain/feedback";
import {
  engineChoices,
  engineName,
  setEngine,
  type EngineChoice,
} from "../../src/domain/scoring/engine";
import { t, type Key } from "../../src/i18n";
import { useCloset } from "../../src/state/closet";
import { useDiscardChanges } from "../../src/navigation/useDiscardChanges";
import {
  AppText,
  Button,
  Chip,
  ChoiceGroup,
  ErrorMessage,
  FormScreen,
  HeaderAction,
} from "../../src/ui";

type Choice<T> = { id: string; label: string; value: T };

function choices<T>(
  key: string,
  values: { id: string; value: T }[],
  none: T,
): Choice<T>[] {
  return [
    { id: "unset", label: t("style.none"), value: none },
    ...values.map((item) => ({
      ...item,
      label: t(`style.${key}.${item.id}` as Key),
    })),
  ];
}

function settingOptions() {
  const belt = choices<StyleProfile["beltOverOuter"]>(
    "belt",
    [
      { id: "yes", value: true },
      { id: "no", value: false },
    ],
    null,
  );

  const topLength = choices<StyleProfile["minTopLength"]>(
    "topLength",
    (["hip", "thigh", "knee", "calf"] as const).map((id) => ({
      id,
      value: id,
    })),
    null,
  );

  const bottoms = choices<StyleProfile["bottoms"]>(
    "bottoms",
    (["trousers", "skirts", "both"] as const).map((id) => ({ id, value: id })),
    null,
  );

  const prints = choices<StyleProfile["printOnPrint"]>(
    "prints",
    [
      { id: "yes", value: true },
      { id: "no", value: false },
    ],
    null,
  );

  const dupatta = choices<StyleProfile["dupattaExpected"]>(
    "dupatta",
    [
      { id: "yes", value: true },
      { id: "no", value: false },
    ],
    null,
  );

  const region = choices<StyleProfile["region"]>(
    "region",
    (["south-asian", "gulf", "turkish", "western-europe"] as const).map(
      (id) => ({ id, value: id }),
    ),
    null,
  );

  const layouts = (["minimal", "reasons", "full"] as const).map((id) => ({
    id,
    label: t(`style.layout.${id}`),
  }));

  const weddingColours = (["white", "black"] as const).map((id) => ({
    id,
    label: t(`style.wedding.${id}`),
  }));
  const engineOptions = engineChoices.map((id) => ({
    id,
    label: engineName(id),
  }));
  return {
    engineOptions,
    belt,
    topLength,
    bottoms,
    prints,
    dupatta,
    region,
    layouts,
    weddingColours,
  };
}

function Setting<T>({
  label,
  options,
  value,
  disabled,
  onChange,
}: {
  label: string;
  options: Choice<T>[];
  value: T;
  disabled: boolean;
  onChange: (value: T) => void;
}) {
  return (
    <ChoiceGroup
      label={label}
      options={options}
      value={options.find((option) => option.value === value)?.id ?? "unset"}
      disabled={disabled}
      onChange={(id) =>
        onChange(options.find((option) => option.id === id)!.value)
      }
    />
  );
}

export default function StyleSettings() {
  const {
    belt,
    topLength,
    bottoms,
    prints,
    dupatta,
    region,
    layouts,
    weddingColours,
    engineOptions,
  } = settingOptions();
  const { closet, update } = useCloset();
  const saved = closet.styling.profile;
  const [profile, setProfile] = useState(saved);
  const [layout, setLayout] = useState<CardLayout>(closet.styling.layout);
  const [engine, setEngineChoice] = useState<EngineChoice>(
    closet.styling.engine,
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dirty =
    JSON.stringify(profile) !== JSON.stringify(saved) ||
    layout !== closet.styling.layout ||
    engine !== closet.styling.engine;
  const allowClose = useDiscardChanges(dirty, busy);
  const set = (changes: Partial<StyleProfile>) =>
    setProfile((current) => ({ ...current, ...changes }));

  async function save() {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      await update((current) => {
        const next = saveProfile(current, {
          ...current.styling.profile,
          beltOverOuter: profile.beltOverOuter,
          minTopLength: profile.minTopLength,
          bottoms: profile.bottoms,
          printOnPrint: profile.printOnPrint,
          avoidAtWeddings: profile.avoidAtWeddings,
          dupattaExpected: profile.dupattaExpected,
          region: profile.region,
        });
        return setEngine(
          { ...next, styling: { ...next.styling, layout } },
          engine,
        );
      });
      allowClose();
      router.back();
    } catch {
      setError(t("style.error"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <FormScreen>
      <Stack.Screen
        options={{
          headerLeft: () => (
            <HeaderAction
              label={t("style.cancel")}
              onPress={() => router.back()}
            />
          ),
        }}
      />
      <AppText muted>{t("style.intro")}</AppText>
      <ChoiceGroup
        label={t("style.layout")}
        options={layouts}
        value={layout}
        disabled={busy}
        onChange={setLayout}
      />
      <ChoiceGroup
        label={t("stylist.label")}
        options={engineOptions}
        value={engine}
        disabled={busy}
        onChange={setEngineChoice}
      />
      <AppText variant="footnote" muted>
        {t("stylist.help")}
      </AppText>
      <Button
        label={t("stylist.results")}
        secondary
        compact
        disabled={busy}
        onPress={() => router.push("/today/stylist-results")}
      />
      <Setting
        label={t("style.belt")}
        options={belt}
        value={profile.beltOverOuter}
        disabled={busy}
        onChange={(beltOverOuter) => set({ beltOverOuter })}
      />
      <Setting
        label={t("style.topLength")}
        options={topLength}
        value={profile.minTopLength}
        disabled={busy}
        onChange={(minTopLength) => set({ minTopLength })}
      />
      <Setting
        label={t("style.bottoms")}
        options={bottoms}
        value={profile.bottoms}
        disabled={busy}
        onChange={(value) => set({ bottoms: value })}
      />
      <Setting
        label={t("style.prints")}
        options={prints}
        value={profile.printOnPrint}
        disabled={busy}
        onChange={(printOnPrint) => set({ printOnPrint })}
      />
      <View style={styles.group}>
        <AppText style={styles.label}>{t("style.wedding")}</AppText>
        <View style={styles.chips}>
          {weddingColours.map((colour) => {
            const selected = profile.avoidAtWeddings.includes(colour.id);
            return (
              <Chip
                key={colour.id}
                label={colour.label}
                selected={selected}
                disabled={busy}
                accessibilityLabel={t("style.wedding.avoid", {
                  colour: colour.label.toLowerCase(),
                })}
                onPress={() =>
                  set({
                    avoidAtWeddings: selected
                      ? profile.avoidAtWeddings.filter(
                          (item) => item !== colour.id,
                        )
                      : [...profile.avoidAtWeddings, colour.id],
                  })
                }
              />
            );
          })}
        </View>
      </View>
      <Setting
        label={t("style.dupatta")}
        options={dupatta}
        value={profile.dupattaExpected}
        disabled={busy}
        onChange={(dupattaExpected) => set({ dupattaExpected })}
      />
      <Setting
        label={t("style.region")}
        options={region}
        value={profile.region}
        disabled={busy}
        onChange={(value) => set({ region: value })}
      />
      <ErrorMessage message={error} />
      <Button
        label={t("style.save")}
        busy={busy}
        disabled={!dirty}
        onPress={() => {
          void save();
        }}
      />
    </FormScreen>
  );
}

const styles = StyleSheet.create({
  group: { gap: 12 },
  label: { fontWeight: "600" },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
});
