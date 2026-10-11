import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { router } from "expo-router";
import type { OutfitRequest, StylePreset } from "../../domain/closet";
import { presetNameLimit } from "../../domain/presets";
import { t } from "../../i18n";
import { ChipRow, Expander, Field, Row, Section, Text } from "../../ui";
import { theme } from "../../ui/theme";
import { usePresetSave } from "./usePresetSave";

export function AdjustPresets({
  request,
  presets,
  onApply,
}: {
  request: OutfitRequest;
  presets: StylePreset[];
  onApply: (preset: StylePreset) => void;
}) {
  const [name, setName] = useState("");
  const [open, setOpen] = useState(false);
  const action = usePresetSave();
  const selected = presets.find(
    (preset) =>
      preset.occasion === request.occasion &&
      preset.style === request.style &&
      preset.hijab === request.hijab &&
      preset.feel === request.feel &&
      (preset.coverage?.sleeve ?? null) ===
        (request.coverage?.sleeve ?? null) &&
      (preset.coverage?.hem ?? null) === (request.coverage?.hem ?? null),
  );

  async function save() {
    if (await action.save(name, request)) {
      setName("");
      setOpen(false);
    }
  }

  return (
    <Section title={t("presets.title")}>
      {presets.length ? (
        <ChipRow
          options={presets.map(({ id, name }) => ({ id, label: name }))}
          value={selected?.id ?? null}
          onChange={(id) => {
            const preset = presets.find((item) => item.id === id);
            if (preset) onApply(preset);
          }}
          testID="adjust-preset"
        />
      ) : null}
      <Expander
        id="adjust-save-preset"
        title={t("presets.saveCurrent")}
        open={open}
        onToggle={() => setOpen((current) => !current)}
        actions={[
          {
            label: t("common.save"),
            disabled: !name.trim(),
            busy: action.busy,
            onPress: () => void save(),
            testID: "adjust-preset-save",
          },
        ]}
        testID="adjust-save-preset"
      >
        <View style={styles.form}>
          <Field
            label={t("presets.name")}
            value={name}
            onChangeText={setName}
            maxLength={presetNameLimit}
            returnKeyType="done"
            testID="adjust-preset-name"
          />
          {action.error ? (
            <Text role="footnote" tone="error" announce>
              {action.error}
            </Text>
          ) : null}
        </View>
      </Expander>
      {presets.length ? (
        <Row
          title={t("presets.manage")}
          trailing="chevron"
          onPress={() => router.push("/profile/presets")}
          testID="adjust-manage-presets"
        />
      ) : null}
    </Section>
  );
}

const styles = StyleSheet.create({ form: { gap: theme.space.md } });
