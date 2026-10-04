import { StyleSheet, View } from "react-native";
import type { SettingKey, StyleProfile } from "../../domain/closet";
import { t, type Key } from "../../i18n";
import { ChipRow, Expander } from "../../ui";
import { theme } from "../../ui/theme";

export type Rules = Pick<StyleProfile, SettingKey>;

type Rule = {
  key: Exclude<SettingKey, "avoidAtWeddings">;
  label: Key;
  values: { id: string; value: unknown }[];
};

const yesNo = [
  { id: "yes", value: true },
  { id: "no", value: false },
];
const ids = (list: readonly string[]) => list.map((id) => ({ id, value: id }));

const rules: Rule[] = [
  { key: "beltOverOuter", label: "style.belt", values: yesNo },
  {
    key: "minTopLength",
    label: "style.topLength",
    values: ids(["hip", "thigh", "knee", "calf"]),
  },
  {
    key: "bottoms",
    label: "style.bottoms",
    values: ids(["trousers", "skirts", "both"]),
  },
  { key: "printOnPrint", label: "style.prints", values: yesNo },
  { key: "dupattaExpected", label: "style.dupatta", values: yesNo },
  {
    key: "region",
    label: "style.region",
    values: ids(["south-asian", "gulf", "turkish", "western-europe"]),
  },
];

const prefixes: Record<Rule["key"], string> = {
  beltOverOuter: "belt",
  minTopLength: "topLength",
  bottoms: "bottoms",
  printOnPrint: "prints",
  dupattaExpected: "dupatta",
  region: "region",
};

export const rulesSet = (value: Rules) =>
  rules.filter((rule) => value[rule.key] !== null).length +
  (value.avoidAtWeddings.length ? 1 : 0);

export function StyleRules({
  value,
  onChange,
  open,
  onToggle,
}: {
  value: Rules;
  onChange: (next: Partial<Rules>) => void;
  open: boolean;
  onToggle: () => void;
}) {
  const count = rulesSet(value);
  const option = (label: string, group: Key) => ({
    label,
    accessibilityLabel: t("common.optionInGroup", {
      option: label,
      group: t(group),
    }),
  });
  return (
    <Expander
      id="style-rules"
      title={t("style.rules")}
      value={count ? t("style.rulesSet", { count }) : t("style.none")}
      open={open}
      onToggle={onToggle}
      testID="style-rules"
    >
      <View style={styles.rules}>
        {rules.map((rule) => {
          const current = rule.values.find(
            (item) => item.value === value[rule.key],
          );
          return (
            <ChipRow<string>
              key={rule.key}
              label={t(rule.label)}
              options={[
                { id: "unset", ...option(t("style.none"), rule.label) },
                ...rule.values.map((item) => ({
                  id: item.id,
                  ...option(
                    t(`style.${prefixes[rule.key]}.${item.id}` as Key),
                    rule.label,
                  ),
                })),
              ]}
              value={current?.id ?? "unset"}
              onChange={(next) =>
                onChange({
                  [rule.key]:
                    rule.values.find((item) => item.id === next)?.value ?? null,
                })
              }
              inSurface
            />
          );
        })}
        <ChipRow<"white" | "black">
          label={t("style.wedding")}
          multi
          options={(["white", "black"] as const).map((id) => ({
            id,
            ...option(t(`style.wedding.${id}`), "style.wedding"),
          }))}
          value={value.avoidAtWeddings}
          onChange={(next) =>
            onChange({
              avoidAtWeddings: Array.isArray(next) ? next : next ? [next] : [],
            })
          }
          inSurface
        />
      </View>
    </Expander>
  );
}

const styles = StyleSheet.create({
  rules: { gap: theme.space.lg },
});
