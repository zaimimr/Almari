import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import type { NeverWear } from "../../src/domain/closet";
import { patterns } from "../../src/domain/attributes";
import { colourNames, namedSwatch } from "../../src/domain/color";
import { setNeverWear } from "../../src/domain/preferences";
import {
  categories,
  kindsIn,
  type GarmentKind,
} from "../../src/domain/taxonomy";
import { colourLabel } from "../../src/features/ColourChips";
import { t, type Key } from "../../src/i18n";
import { useCloset } from "../../src/state/closet";
import { ChipRow, Screen, Section } from "../../src/ui";
import { announce } from "../../src/ui/announce";
import { theme } from "../../src/ui/theme";

const hex = (name: string) =>
  `#${namedSwatch(name)
    .rgb.map((part) => part.toString(16).padStart(2, "0"))
    .join("")}`;

const avoidable = patterns.filter(({ id }) => id !== "solid");

export default function Never() {
  const { closet, update } = useCloset();
  const entries = closet.styling.profile.neverWear ?? [];

  useEffect(() => {
    if (closet.styling.profile.neverWear === undefined)
      void update((current) => setNeverWear(current, []));
  }, [closet.styling.profile.neverWear, update]);

  const kinds = entries.flatMap((entry) =>
    "kind" in entry ? [entry.kind] : [],
  );
  const colours = (on: "clothes" | "hijabs") =>
    entries.flatMap((entry) =>
      "colour" in entry && entry.on === on ? [entry.colour] : [],
    );
  const chosenPatterns = entries.flatMap((entry) =>
    "pattern" in entry ? [entry.pattern] : [],
  );

  function save(next: NeverWear[]) {
    void update((current) => setNeverWear(current, next)).then(() =>
      announce(t("result.saved")),
    );
  }

  const keep = (test: (entry: NeverWear) => boolean) =>
    entries.filter((entry) => !test(entry));

  const list = (value: unknown) =>
    Array.isArray(value) ? (value as string[]) : [];

  const swatchOptions = (group: Key) =>
    colourNames.map((name) => ({
      id: name,
      label: colourLabel(name),
      swatch: hex(name),
      accessibilityLabel: t("common.optionInGroup", {
        option: colourLabel(name),
        group: t(group),
      }),
    }));

  return (
    <Screen title={t("never.title")} leading="back" testID="never-wear">
      <View style={styles.list}>
        {categories.map((category) => {
          const options = kindsIn(category.id);
          if (!options.length) return null;
          const ids = options.map((kind) => kind.id as GarmentKind);
          return (
            <Section key={category.id} title={category.label}>
              <ChipRow<GarmentKind>
                multi
                options={ids.map((id) => ({
                  id,
                  label: t(`kind.${id}` as Key),
                  accessibilityLabel: t("common.optionInGroup", {
                    option: t(`kind.${id}` as Key),
                    group: category.label,
                  }),
                }))}
                value={kinds.filter((kind) => ids.includes(kind))}
                onChange={(next) =>
                  save([
                    ...keep(
                      (entry) => "kind" in entry && ids.includes(entry.kind),
                    ),
                    ...list(next).map((kind) => ({
                      kind: kind as GarmentKind,
                    })),
                  ])
                }
                testID={`never-${category.id}`}
              />
            </Section>
          );
        })}
        {(["clothes", "hijabs"] as const).map((on) => {
          const group: Key =
            on === "clothes" ? "never.colours" : "never.hijabColours";
          return (
            <Section key={on} title={t(group)}>
              <ChipRow<string>
                multi
                options={swatchOptions(group)}
                value={colours(on)}
                onChange={(next) =>
                  save([
                    ...keep((entry) => "colour" in entry && entry.on === on),
                    ...list(next).map((colour) => ({ colour, on })),
                  ])
                }
                testID={`never-colours-${on}`}
              />
            </Section>
          );
        })}
        <Section title={t("never.patterns")}>
          <ChipRow<(typeof avoidable)[number]["id"]>
            multi
            options={avoidable.map(({ id }) => ({
              id,
              label: t(`value.pattern.${id}` as Key),
              accessibilityLabel: t("common.optionInGroup", {
                option: t(`value.pattern.${id}` as Key),
                group: t("never.patterns"),
              }),
            }))}
            value={chosenPatterns.filter((id) => id !== "solid") as never}
            onChange={(next) =>
              save([
                ...keep((entry) => "pattern" in entry),
                ...list(next).map((pattern) => ({
                  pattern: pattern as (typeof avoidable)[number]["id"],
                })),
              ])
            }
            testID="never-patterns"
          />
        </Section>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { gap: theme.space.lg },
});
