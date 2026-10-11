import { useState } from "react";
import { StyleSheet, View } from "react-native";
import type { StylePreset } from "../../domain/closet";
import { presetNameLimit, removeStylePreset } from "../../domain/presets";
import { occasionName, styleName, t } from "../../i18n";
import { useCloset } from "../../state/closet";
import { Expander, Field, Text } from "../../ui";
import { confirmAction } from "../../ui/confirm";
import { theme } from "../../ui/theme";
import { PresetSettings, type PresetSettingsValue } from "./PresetSettings";
import { usePresetSave } from "./usePresetSave";

export function PresetEditor({
  preset,
  initial,
  open,
  onToggle,
  onSaved,
}: {
  preset?: StylePreset;
  initial: PresetSettingsValue;
  open: boolean;
  onToggle: () => void;
  onSaved: () => void;
}) {
  const { update } = useCloset();
  const [name, setName] = useState(preset?.name ?? "");
  const [settings, setSettings] = useState(initial);
  const [removing, setRemoving] = useState(false);
  const [removeFailed, setRemoveFailed] = useState(false);
  const action = usePresetSave();
  const id = preset ? `preset-${preset.id}` : "preset-new";
  const busy = action.busy || removing;
  const dirty =
    name !== (preset?.name ?? "") ||
    JSON.stringify(settings) !== JSON.stringify(initial);

  async function save() {
    if (!(await action.save(name, settings, preset?.id))) return;
    if (!preset) {
      setName("");
      setSettings(initial);
    }
    onSaved();
  }

  async function remove() {
    if (!preset || busy) return;
    const confirmed = await confirmAction(
      t("presets.removeTitle", { name: preset.name }),
      t("presets.removeBody"),
      t("common.remove"),
    );
    if (!confirmed) return;
    setRemoving(true);
    setRemoveFailed(false);
    try {
      await update((current) => removeStylePreset(current, preset.id));
      onSaved();
    } catch {
      setRemoveFailed(true);
    } finally {
      setRemoving(false);
    }
  }

  const saveAction = {
    label: t("common.save"),
    onPress: () => void save(),
    busy: action.busy,
    disabled: removing || !name.trim() || (Boolean(preset) && !dirty),
    testID: `${id}-save`,
  };

  return (
    <Expander
      id={id}
      title={preset?.name ?? t("presets.add")}
      value={
        preset
          ? `${occasionName(preset.occasion)}, ${styleName(preset.style)}`
          : undefined
      }
      open={open}
      onToggle={onToggle}
      actions={
        preset
          ? [
              saveAction,
              {
                label: t("common.remove"),
                onPress: () => void remove(),
                variant: "quiet",
                disabled: busy,
                testID: `${id}-remove`,
              },
            ]
          : [saveAction]
      }
      testID={id}
    >
      <View style={styles.form}>
        <Field
          label={t("presets.name")}
          value={name}
          onChangeText={setName}
          maxLength={presetNameLimit}
          returnKeyType="done"
          testID={`${id}-name`}
        />
        <PresetSettings
          id={id}
          value={settings}
          onChange={(change) =>
            setSettings((current) => ({ ...current, ...change }))
          }
        />
        {action.error || removeFailed ? (
          <Text role="footnote" tone="error" announce>
            {action.error ?? t("common.error.save")}
          </Text>
        ) : null}
      </View>
    </Expander>
  );
}

const styles = StyleSheet.create({ form: { gap: theme.space.xl } });
