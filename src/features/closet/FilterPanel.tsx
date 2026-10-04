import { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
} from "react-native";
import type { Category, Piece } from "../../domain/closet";
import { colorName, namedSwatch } from "../../domain/color";
import type { ClosetFilter } from "../../domain/closetFilters";
import type { WearSeason } from "../../domain/facts";
import { categoryName, t } from "../../i18n";
import { Button, Chip, ChipRow, Text } from "../../ui";
import { gutterFor, theme } from "../../ui/theme";
import { useLargeText } from "../../ui/useLargeText";
import { colourLabel } from "../ColourChips";

const colourId = (name: string) => name.toLowerCase().replace(" ", "-");

const hex = (name: string) =>
  `#${namedSwatch(name)
    .rgb.map((part) => part.toString(16).padStart(2, "0"))
    .join("")}`;

type Show = "not-worn-lately" | "never-worn" | "away" | "archived";

const showLabels: Record<Show, string> = {
  "not-worn-lately": "closet.notWornLately",
  "never-worn": "closet.neverWorn",
  away: "closet.unavailable",
  archived: "closet.putAway",
};

const seasonIds: WearSeason[] = ["summer", "winter", "all-year"];

const showOf = (filter: ClosetFilter): Show | null =>
  filter.wear ??
  (filter.availability === "away" || filter.availability === "archived"
    ? filter.availability
    : null);

export function filterValues(filter: ClosetFilter): string[] {
  const show = showOf(filter);
  return [
    filter.colour ? colourLabel(filter.colour) : null,
    filter.season ? t(`value.season.${filter.season}`) : null,
    show ? t(showLabels[show] as Parameters<typeof t>[0]) : null,
  ].filter((value): value is string => value !== null);
}

export function FilterRow({
  filter,
  offered,
  open,
  onToggle,
  onChange,
}: {
  filter: ClosetFilter;
  offered: Category[];
  open: boolean;
  onToggle: () => void;
  onChange: (next: Partial<ClosetFilter>) => void;
}) {
  const { width: windowWidth } = useWindowDimensions();
  const gutter = gutterFor(windowWidth);
  const values = filterValues(filter);

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={{ marginHorizontal: -gutter }}
      contentContainerStyle={[styles.row, { paddingHorizontal: gutter }]}
    >
      <View accessibilityRole="radiogroup" style={styles.row}>
        {(["all", ...offered] as const).map((id) => (
          <Chip
            key={id}
            label={id === "all" ? t("closet.all") : categoryName(id)}
            selected={filter.category === id}
            role="radio"
            onPress={() => onChange({ category: id })}
            testID={`category-${id}`}
          />
        ))}
      </View>
      <Chip
        label={t("closet.filter")}
        kind="control"
        opens="expander"
        expanded={open}
        selected={values.length > 0}
        accessibilityValue={values.join(", ")}
        onPress={onToggle}
        testID="chip-more"
      />
    </ScrollView>
  );
}

function Group({
  label,
  width,
  onMeasure,
  children,
}: {
  label: string;
  width: number;
  onMeasure: (width: number) => void;
  children: React.ReactNode;
}) {
  const { large } = useLargeText();
  return (
    <View style={[styles.group, large && styles.groupStacked]}>
      <Text
        role="headline"
        accessibilityRole="header"
        onLayout={(event) => onMeasure(event.nativeEvent.layout.width)}
        style={large ? null : { minWidth: width }}
      >
        {label}
      </Text>
      <View style={styles.chips}>{children}</View>
    </View>
  );
}

export function FilterPanel({
  filter,
  pieces,
  filtered,
  onChange,
  onClear,
}: {
  filter: ClosetFilter;
  pieces: Piece[];
  filtered: boolean;
  onChange: (next: Partial<ClosetFilter>) => void;
  onClear: () => void;
}) {
  const { large } = useLargeText();
  const [labelWidth, setLabelWidth] = useState(0);
  const measure = (width: number) =>
    setLabelWidth((current) => Math.max(current, Math.ceil(width)));
  const names = [
    ...new Set(
      pieces.flatMap((piece) =>
        piece.colors?.[0] ? [colorName(piece.colors[0].rgb)] : [],
      ),
    ),
  ];
  const ids = new Map(names.map((name) => [colourId(name), name]));
  const show = showOf(filter);

  const group = (label: string, row: React.ReactNode) => (
    <Group label={label} width={labelWidth} onMeasure={measure}>
      {row}
    </Group>
  );

  return (
    <View style={styles.panel} testID="closet-panel">
      {names.length
        ? group(
            t("fact.colour"),
            <ChipRow
              layout="scroll"
              optional
              options={names.map((name) => ({
                id: colourId(name),
                label: large ? colourLabel(name) : "",
                swatch: hex(name),
                accessibilityLabel: colourLabel(name),
              }))}
              value={filter.colour ? colourId(filter.colour) : null}
              onChange={(next) =>
                onChange({
                  colour: typeof next === "string" ? ids.get(next)! : null,
                })
              }
              testID="colour"
            />,
          )
        : null}
      {group(
        t("fact.season"),
        <ChipRow
          layout="scroll"
          optional
          options={seasonIds.map((id) => ({
            id,
            label: t(`value.season.${id}`),
          }))}
          value={filter.season}
          onChange={(next) =>
            onChange({ season: typeof next === "string" ? next : null })
          }
          testID="season"
        />,
      )}
      {group(
        t("closet.show"),
        <ChipRow
          layout="scroll"
          optional
          options={(Object.keys(showLabels) as Show[]).map((id) => ({
            id,
            label: t(showLabels[id] as Parameters<typeof t>[0]),
          }))}
          value={show}
          onChange={(next) =>
            onChange({
              wear:
                next === "not-worn-lately" || next === "never-worn"
                  ? next
                  : null,
              availability:
                next === "away" || next === "archived" ? next : null,
            })
          }
          testID="show"
        />,
      )}
      <View style={styles.clear}>
        {filtered ? (
          <Button
            variant="quiet"
            size="small"
            label={t("closet.clearFilters")}
            onPress={onClear}
            testID="closet-clear"
          />
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: theme.space.sm },
  panel: { gap: theme.space.md },
  group: { flexDirection: "row", alignItems: "center", gap: theme.space.md },
  groupStacked: { flexDirection: "column", alignItems: "stretch" },
  chips: { flex: 1 },
  clear: { minHeight: theme.size.controlSmall, alignItems: "flex-start" },
});
