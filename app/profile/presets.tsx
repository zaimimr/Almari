import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { coverageNeedFor } from "../../src/domain/closet";
import { PresetEditor } from "../../src/features/presets/PresetEditor";
import type { PresetSettingsValue } from "../../src/features/presets/PresetSettings";
import { t } from "../../src/i18n";
import { useCloset } from "../../src/state/closet";
import { Screen } from "../../src/ui";
import { theme } from "../../src/ui/theme";

export default function Presets() {
  const { closet } = useCloset();
  const [open, setOpen] = useState<string | null>(null);
  const everyday = closet.styling.everyday;
  const coverage = coverageNeedFor(
    closet.styling.profile.coverageLevel,
    everyday?.coverage,
  );
  const initial: PresetSettingsValue = {
    occasion: everyday?.occasion ?? "everyday",
    style: everyday?.style ?? "western",
    hijab: everyday?.hijab ?? null,
    ...(coverage ? { coverage } : {}),
  };

  return (
    <Screen title={t("presets.title")} leading="back" testID="presets">
      <View style={styles.list}>
        {(closet.styling.presets ?? []).map((preset) => (
          <PresetEditor
            key={`${preset.id}-${JSON.stringify(preset)}`}
            preset={preset}
            initial={{
              occasion: preset.occasion,
              style: preset.style,
              hijab: preset.hijab,
              ...(preset.coverage ? { coverage: preset.coverage } : {}),
              ...(preset.feel ? { feel: preset.feel } : {}),
            }}
            open={open === preset.id}
            onToggle={() =>
              setOpen((current) => (current === preset.id ? null : preset.id))
            }
            onSaved={() => setOpen(null)}
          />
        ))}
        <PresetEditor
          initial={initial}
          open={open === "new"}
          onToggle={() =>
            setOpen((current) => (current === "new" ? null : "new"))
          }
          onSaved={() => setOpen(null)}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({ list: { gap: theme.space.lg } });
