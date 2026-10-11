import {
  hemNeeds,
  occasionOptions,
  sleeveNeeds,
  styleOptions,
  type StylePreset,
} from "../../domain/closet";
import { t } from "../../i18n";
import { ChipRow, Section } from "../../ui";

export type PresetSettingsValue = Omit<StylePreset, "id" | "name">;

export function PresetSettings({
  value,
  onChange,
  id,
  occasion = true,
  style = true,
  feel = true,
}: {
  value: PresetSettingsValue;
  onChange: (change: Partial<PresetSettingsValue>) => void;
  id: string;
  occasion?: boolean;
  style?: boolean;
  feel?: boolean;
}) {
  return (
    <>
      {occasion ? (
        <Section title={t("adjust.occasion")}>
          <ChipRow
            options={occasionOptions()}
            value={value.occasion}
            onChange={(next) =>
              typeof next === "string" && onChange({ occasion: next })
            }
            testID={`${id}-occasion`}
          />
        </Section>
      ) : null}
      {style ? (
        <Section title={t("adjust.style")}>
          <ChipRow
            options={[...styleOptions]}
            value={value.style}
            onChange={(next) =>
              typeof next === "string" && onChange({ style: next })
            }
            testID={`${id}-style`}
          />
        </Section>
      ) : null}
      <Section title={t("presets.hijab")}>
        <ChipRow
          options={[
            { id: "default", label: t("coverage.noPreference") },
            { id: "always", label: t("presets.withHijab") },
            { id: "not-needed", label: t("presets.withoutHijab") },
          ]}
          value={value.hijab ?? "default"}
          onChange={(next) =>
            typeof next === "string" &&
            onChange({ hijab: next === "default" ? null : next })
          }
          testID={`${id}-hijab`}
        />
      </Section>
      {feel ? (
        <Section title={t("create.feel")}>
          <ChipRow
            options={[
              { id: "default", label: t("coverage.noPreference") },
              { id: "comfy", label: t("feel.comfy") },
              { id: "smart", label: t("feel.smart") },
              { id: "dressed", label: t("feel.dressed") },
            ]}
            value={value.feel ?? "default"}
            onChange={(next) =>
              typeof next === "string" &&
              onChange({ feel: next === "default" ? undefined : next })
            }
            testID={`${id}-feel`}
          />
        </Section>
      ) : null}
      <Section title={t("coverage.sleevesLabel")}>
        <ChipRow
          options={[
            { id: "default", label: t("coverage.noPreference") },
            ...sleeveNeeds,
          ]}
          value={value.coverage?.sleeve ?? "default"}
          onChange={(next) =>
            typeof next === "string" &&
            onChange({
              coverage: {
                hem: value.coverage?.hem ?? null,
                sleeve: next === "default" ? null : next,
              },
            })
          }
          testID={`${id}-sleeve`}
        />
      </Section>
      <Section title={t("coverage.hemLabel")}>
        <ChipRow
          options={[
            { id: "default", label: t("coverage.noPreference") },
            ...hemNeeds,
          ]}
          value={value.coverage?.hem ?? "default"}
          onChange={(next) =>
            typeof next === "string" &&
            onChange({
              coverage: {
                sleeve: value.coverage?.sleeve ?? null,
                hem: next === "default" ? null : next,
              },
            })
          }
          testID={`${id}-hem`}
        />
      </Section>
    </>
  );
}
