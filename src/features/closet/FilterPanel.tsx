import { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
} from "react-native";
import {
  occasions,
  type Category,
  type Occasion,
  type Piece,
  type Style,
} from "../../domain/closet";
import { colorName, namedSwatch } from "../../domain/color";
import type { ClosetFilter } from "../../domain/closetFilters";
import type { PieceCoverage, WearSeason } from "../../domain/facts";
import { categoryName, occasionName, styleName, t } from "../../i18n";
import { Button, Chip, ChipRow, Text } from "../../ui";
import { gutterFor, theme } from "../../ui/theme";
import { useColors } from "../../ui/useColors";
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

const coverages: PieceCoverage[] = ["full", "moderate", "layer"];
const seasonIds: WearSeason[] = ["summer", "winter", "all-year"];
const styleIds: Style[] = ["desi", "western"];

const showOf = (filter: ClosetFilter): Show | null =>
  filter.wear ??
  (filter.availability === "away" || filter.availability === "archived"
    ? filter.availability
    : null);

export function filterValues(filter: ClosetFilter): string[] {
  const show = showOf(filter);
  return [
    filter.colour ? colourLabel(filter.colour) : null,
    filter.coverage === "needs-details"
      ? t("piece.needsDetails")
      : filter.coverage
        ? t(`pieceCoverage.${filter.coverage}`)
        : null,
    filter.season ? t(`value.season.${filter.season}`) : null,
    show ? t(showLabels[show] as Parameters<typeof t>[0]) : null,
    filter.style ? styleName(filter.style) : null,
    filter.occasion ? occasionName(filter.occasion) : null,
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
  const colors = useColors();
  const { width: windowWidth } = useWindowDimensions();
  const gutter = gutterFor(windowWidth);
  const values = filterValues(filter);
  const needs = filter.coverage === "needs-details";

  const chips = (
    <>
      <Chip
        label={t("piece.needsDetails")}
        dot
        selected={needs}
        role="button"
        onPress={() => onChange({ coverage: needs ? null : "needs-details" })}
        testID="chip-needs-details"
      />
      <View
        style={[styles.divider, { backgroundColor: colors.line }]}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      />
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
    </>
  );

  return (
    <View style={styles.filterRow}>
      <Chip
        label={t("closet.more")}
        kind="control"
        opens="expander"
        expanded={open}
        selected={values.length > 0}
        accessibilityValue={values.join(", ")}
        onPress={onToggle}
        testID="chip-more"
      />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ marginRight: -gutter }}
        contentContainerStyle={[styles.row, { paddingRight: gutter }]}
      >
        {chips}
      </ScrollView>
    </View>
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
  const used = occasions.filter(({ id }) =>
    pieces.some((piece) => piece.traits?.occasions?.includes(id)),
  );
  const show = showOf(filter);
  const coverage = filter.coverage === "needs-details" ? null : filter.coverage;

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
        t("coverage.levelLabel"),
        <ChipRow
          layout="scroll"
          optional
          options={coverages.map((id) => ({
            id,
            label: t(`pieceCoverage.${id}`),
          }))}
          value={coverage}
          onChange={(next) =>
            onChange({ coverage: typeof next === "string" ? next : null })
          }
          testID="coverage"
        />,
      )}
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
      {group(
        t("adjust.style"),
        <ChipRow
          layout="scroll"
          optional
          options={styleIds.map((id) => ({ id, label: styleName(id) }))}
          value={filter.style}
          onChange={(next) =>
            onChange({ style: typeof next === "string" ? next : null })
          }
          testID="style"
        />,
      )}
      {used.length
        ? group(
            t("adjust.occasion"),
            <ChipRow
              layout="scroll"
              optional
              options={used.map(({ id }) => ({ id, label: occasionName(id) }))}
              value={filter.occasion}
              onChange={(next) =>
                onChange({
                  occasion:
                    typeof next === "string" ? (next as Occasion) : null,
                })
              }
              testID="occasion"
            />,
          )
        : null}
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
  filterRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.space.sm,
  },
  row: { flexDirection: "row", alignItems: "center", gap: theme.space.sm },
  divider: {
    width: StyleSheet.hairlineWidth,
    alignSelf: "stretch",
    marginVertical: theme.space.sm,
  },
  panel: { gap: theme.space.md },
  group: { flexDirection: "row", alignItems: "center", gap: theme.space.md },
  groupStacked: { flexDirection: "column", alignItems: "stretch" },
  chips: { flex: 1 },
  clear: { minHeight: theme.size.controlSmall, alignItems: "flex-start" },
});
