import { useRef, useState, type ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import {
  attributeLabelKey,
  attributeValueKey,
  needsDetails,
  pieceCoverage,
  setColour,
  guessedSeason,
  setSparkle,
  sparkleOf,
  wearSeason,
  wearSeasons,
  withCategory,
  withKind,
  withSeason,
  type FactKey,
} from "../../domain/facts";
import {
  applicableAttributes,
  confirmAttribute,
  optionsFor,
  type AttributeKey,
} from "../../domain/attributes";
import {
  categories,
  fixedStyles,
  kindsIn,
  savePiece,
  sparkles,
  type Closet,
  type Piece,
  type Sparkle,
  type Style,
} from "../../domain/closet";
import {
  colourChoices,
  colourOf,
  colourSwatch,
  ownFabric,
  ownKind,
  ownKindsIn,
  ownLists,
  type ListKey,
} from "../../domain/lists";
import { categoryName, listName, locale, t, type Key } from "../../i18n";
import { Chip, ChipRow, Expander, Text } from "../../ui";
import { useColors } from "../../ui/useColors";
import { announce } from "../../ui/announce";
import { theme } from "../../ui/theme";
import { AddOwn, addOwnId, addOwnOption } from "../AddOwn";
import { colourLabel } from "../ColourChips";
import { availabilityFact } from "./AvailabilityChip";
import { weatherFacts } from "./WeatherChips";

export type FactRow = {
  id: string;
  label?: string;
  options: { id: string; label: string; swatch?: string }[];
  value: string | null;
  adds?: ListKey;
  pick: (option: string) => (piece: Piece) => Piece;
};

export type FactSpec = {
  id: string;
  name: string;
  value: string;
  showKey?: boolean;
  swatch?: string;
  tentative?: boolean;
  spoken?: string;
  spokenValue?: string;
  rows?: FactRow[];
  looksRight?: (piece: Piece) => Piece;
  done?: (piece: Piece) => boolean;
  transform?: (option: string) => (closet: Closet) => Closet;
};

const hex = (rgb: readonly number[]) =>
  `#${rgb.map((part) => part.toString(16).padStart(2, "0")).join("")}`;

const coverageReads: Partial<Record<Piece["category"], FactKey[]>> = {
  top: ["sleeve", "sheer"],
  tunic: ["sleeve", "sheer"],
  layer: ["sleeve", "sheer"],
  bottom: ["length"],
  dress: ["sleeve", "sheer", "length"],
};

const factName = (key: FactKey | AttributeKey) =>
  key === "sheer" ? t("fact.sheer") : t(attributeLabelKey(key as AttributeKey));

export function withSheer(piece: Piece, sheer: boolean): Piece {
  return {
    ...piece,
    attributes: { ...piece.attributes, sheer },
    sources: { ...piece.sources, sheer: "confirmed" },
  };
}

function attributeRow(
  piece: Piece,
  key: AttributeKey,
  label?: string,
): FactRow {
  const value = piece.attributes?.[key];
  return {
    id: key,
    label,
    options: optionsFor(key).map((option) => ({
      id: String(option.id),
      label: t(attributeValueKey(key, option.id)),
    })),
    value: value === undefined ? null : String(value),
    pick: (option) => (latest) => {
      const id = optionsFor(key).find((item) => String(item.id) === option)?.id;
      return id === undefined ? latest : confirmAttribute(latest, key, id);
    },
  };
}

function sheerRow(piece: Piece, label?: string): FactRow {
  const sheer = piece.attributes?.sheer;
  return {
    id: "sheer",
    label,
    options: [
      { id: "no", label: t("value.sheer.no") },
      { id: "yes", label: t("value.sheer.yes") },
    ],
    value: sheer === undefined ? null : sheer ? "yes" : "no",
    pick: (option) => (latest) => withSheer(latest, option === "yes"),
  };
}

const isProposed = (piece: Piece, key: FactKey | AttributeKey) =>
  key === "sheer"
    ? piece.attributes?.sheer !== undefined &&
      piece.sources?.sheer === "proposed"
    : piece.attributes?.[key as AttributeKey] !== undefined &&
      piece.sources?.[key as AttributeKey] === "proposed";

function confirmShown(piece: Piece, keys: (FactKey | AttributeKey)[]): Piece {
  return keys.reduce((latest, key) => {
    if (!isProposed(latest, key)) return latest;
    if (key === "sheer") return withSheer(latest, latest.attributes!.sheer!);
    const value = latest.attributes![key as AttributeKey]!;
    return confirmAttribute(latest, key as AttributeKey, value);
  }, piece);
}

const addLabel = (name: string) =>
  t("fact.add", { label: name.toLocaleLowerCase(locale) });

const colourOptions = () =>
  colourChoices().map((option) => ({
    id: option,
    label: colourLabel(option),
    swatch: hex(colourSwatch(option).rgb),
  }));

function colourFact(piece: Piece): FactSpec {
  const swatch = piece.colors?.[0];
  if (!swatch)
    return {
      id: "colour",
      name: t("fact.colour"),
      value: addLabel(t("fact.colour")),
      tentative: true,
      rows: [
        {
          id: "colour",
          options: colourOptions(),
          value: null,
          adds: "colours",
          pick: () => (latest) => latest,
        },
      ],
      transform: (option) => (closet) => setColour(closet, piece.id, option),
    };
  const name = colourOf(swatch.rgb);
  const confirmed = piece.sources?.colour === "confirmed";
  const value = colourLabel(name);
  const vars = { label: t("fact.colour"), value };
  return {
    id: "colour",
    name: t("fact.colour"),
    value,
    swatch: hex(swatch.rgb),
    spoken: t(confirmed ? "piece.fact.confirmed" : "piece.fact.known", vars),
    rows: [
      {
        id: "colour",
        options: colourOptions(),
        value: name,
        adds: "colours",
        pick: (option) => (latest) => latest,
      },
    ],
    transform: (option) => (closet) => setColour(closet, piece.id, option),
    looksRight: confirmed
      ? undefined
      : (latest) => ({
          ...latest,
          sources: { ...latest.sources, colour: "confirmed" },
        }),
  };
}

export const kindLabel = (piece: Pick<Piece, "kind" | "ownKind">) =>
  (piece.ownKind ? ownKind(piece.ownKind)?.name : undefined) ??
  (piece.kind ? t(`kind.${piece.kind}`) : null);

function kindFact(piece: Piece): FactSpec {
  const label = kindLabel(piece);
  const tentative =
    !label || (!piece.ownKind && piece.sources?.kind === "proposed");
  return {
    id: "kind",
    name: t("piece.kind"),
    value: label ?? addLabel(t("piece.kind")),
    tentative,
    rows: [
      {
        id: "category",
        label: t("piece.category"),
        options: categories.map((item) => ({
          id: item.id,
          label: categoryName(item.id),
        })),
        value: piece.category,
        pick: (option) => (latest) => withCategory(latest, option),
      },
      {
        id: "kind",
        label: t("piece.kind"),
        options: [
          ...ownKindsIn(piece.category).map((item) => ({
            id: item.id,
            label: item.name,
          })),
          ...kindsIn(piece.category).map((kind) => ({
            id: kind.id,
            label: t(`kind.${kind.id}`),
          })),
        ],
        value: piece.ownKind ?? piece.kind ?? null,
        adds: "kinds",
        pick: (option) => (latest) => withKind(latest, option),
      },
    ],
    looksRight:
      tentative && label
        ? (latest) => ({
            ...latest,
            sources: { ...latest.sources, kind: "confirmed" },
          })
        : undefined,
    done: (latest) => Boolean(latest.kind || latest.ownKind),
  };
}

const styleOf = (piece: Piece): "desi" | "western" | "both" | null => {
  const styles = piece.styles ?? [];
  if (styles.includes("desi") && styles.includes("western")) return "both";
  return styles[0] ?? null;
};

function styleFact(piece: Piece): FactSpec | null {
  if (piece.kind && fixedStyles(piece.kind)) return null;
  const style = styleOf(piece);
  if (!style) return null;
  const tentative = piece.sources?.styles === "proposed";
  const stylesFor = (option: string): Style[] =>
    option === "both" ? ["desi", "western"] : [option as Style];
  return {
    id: "style",
    name: t("piece.style"),
    value: t(`style.${style}`),
    tentative,
    rows: [
      {
        id: "style",
        options: (["desi", "western", "both"] as const).map((id) => ({
          id,
          label: t(`style.${id}`),
        })),
        value: style,
        pick: (option) => (latest) => ({
          ...latest,
          styles: stylesFor(option),
          sources: { ...latest.sources, styles: "confirmed" },
        }),
      },
    ],
    looksRight: tentative
      ? (latest) => ({
          ...latest,
          sources: { ...latest.sources, styles: "confirmed" },
        })
      : undefined,
  };
}

function coverageFact(piece: Piece): FactSpec | null {
  const reads = coverageReads[piece.category];
  if (!reads) return null;
  const open = needsDetails(piece);
  const coverage = pieceCoverage(piece);
  if (!open.length && !coverage) return null;
  const rows = reads.map((key) =>
    key === "sheer"
      ? sheerRow(piece, t("fact.sheer"))
      : attributeRow(piece, key as AttributeKey, factName(key)),
  );
  const suggested = reads.filter((key) => isProposed(piece, key));
  return {
    id: "coverage",
    name: t("fact.coverage"),
    value: open.length
      ? t("piece.needsDetails")
      : t(`pieceCoverage.${coverage!}` as Key),
    showKey: true,
    tentative: open.length > 0,
    spokenValue: open.length
      ? listName(open.map((key) => factName(key)))
      : undefined,
    rows,
    looksRight: suggested.length
      ? (latest) => confirmShown(latest, reads)
      : undefined,
    done: (latest) => needsDetails(latest).length === 0,
  };
}

function sparkleFact(piece: Piece): FactSpec | null {
  const styles = piece.styles ?? [];
  if (!styles.includes("desi") && piece.kind !== "dupatta") return null;
  const current = sparkleOf(piece);
  const tentative =
    current !== null && piece.sources?.embellishment === "proposed";
  const value: Sparkle = current ?? "plain";
  return {
    id: "sparkle",
    name: t("fact.sparkle"),
    value: t(`sparkle.${value}`),
    showKey: true,
    tentative,
    rows: [
      {
        id: "sparkle",
        options: sparkles.map((id) => ({ id, label: t(`sparkle.${id}`) })),
        value,
        pick: () => (latest) => latest,
      },
    ],
    transform: (option) => (closet) =>
      setSparkle(closet, piece.id, option as Sparkle),
    looksRight: tentative
      ? (latest) => ({
          ...latest,
          sources: { ...latest.sources, embellishment: "confirmed" },
        })
      : undefined,
  };
}

function fabricRow(piece: Piece): FactRow {
  const row = attributeRow(piece, "fabric");
  return {
    ...row,
    options: [
      ...ownLists().fabrics.map((item) => ({ id: item.id, label: item.name })),
      ...row.options,
    ],
    value: piece.ownFabric ?? row.value,
    adds: "fabrics",
    pick: (option) => (latest) => {
      if (ownFabric(option)) {
        const { fabric: _fabric, ...attributes } = latest.attributes ?? {};
        const { fabric: _source, ...sources } = latest.sources ?? {};
        return { ...latest, attributes, sources, ownFabric: option };
      }
      const { ownFabric: _own, ...rest } = latest;
      return row.pick(option)(rest);
    },
  };
}

function ownFabricFact(piece: Piece): FactSpec | null {
  const own = piece.ownFabric ? ownFabric(piece.ownFabric) : undefined;
  if (!own) return null;
  return {
    id: "fabric",
    name: factName("fabric"),
    value: own.name,
    showKey: true,
    rows: [fabricRow(piece)],
  };
}

function attributeFact(piece: Piece, key: AttributeKey): FactSpec | null {
  const value = piece.attributes?.[key];
  if (key === "fabric" && piece.ownFabric) return ownFabricFact(piece);
  if (value === undefined)
    return key === "fabric" &&
      applicableAttributes(piece.category, piece.kind).includes(key)
      ? {
          id: key,
          name: factName(key),
          value: addLabel(factName(key)),
          tentative: true,
          rows: [fabricRow(piece)],
        }
      : null;
  const tentative = piece.sources?.[key] === "proposed";
  return {
    id: key,
    name: factName(key),
    value: t(attributeValueKey(key, value)),
    showKey: true,
    tentative,
    rows: [key === "fabric" ? fabricRow(piece) : attributeRow(piece, key)],
    looksRight: tentative ? (latest) => confirmShown(latest, [key]) : undefined,
  };
}

function sheerFact(piece: Piece): FactSpec | null {
  const sheer = piece.attributes?.sheer;
  if (sheer === undefined) return null;
  const tentative = piece.sources?.sheer === "proposed";
  return {
    id: "sheer",
    name: t("fact.sheer"),
    value: t(sheer ? "value.sheer.yes" : "value.sheer.no"),
    showKey: true,
    tentative,
    rows: [sheerRow(piece)],
    looksRight: tentative
      ? (latest) => confirmShown(latest, ["sheer"])
      : undefined,
  };
}

function seasonFact(piece: Piece): FactSpec {
  const known = wearSeason(piece);
  const season = known?.season ?? guessedSeason(piece);
  const confirmed = known?.source === "confirmed";
  return {
    id: "season",
    name: t("fact.season"),
    value: season ? t(`value.season.${season}`) : addLabel(t("fact.season")),
    showKey: Boolean(season),
    tentative: !confirmed,
    rows: [
      {
        id: "season",
        options: wearSeasons.map((id) => ({
          id,
          label: t(`value.season.${id}`),
        })),
        value: season,
        pick: (option) => (latest) =>
          wearSeasons.includes(option as never)
            ? withSeason(latest, option as (typeof wearSeasons)[number])
            : latest,
      },
    ],
    looksRight:
      season && !confirmed ? (latest) => withSeason(latest, season) : undefined,
  };
}

export function factSpecs(piece: Piece): FactSpec[] {
  const judged = coverageReads[piece.category] ?? [];
  const extra = (
    ["fabric", "pattern", "volume", "length", "formality"] as const
  )
    .filter((key) => !judged.includes(key))
    .map((key) => attributeFact(piece, key));
  const loose = judged.includes("sleeve")
    ? []
    : [attributeFact(piece, "sleeve")];
  return [
    colourFact(piece),
    kindFact(piece),
    styleFact(piece),
    coverageFact(piece),
    sparkleFact(piece),
    ...extra,
    ...loose,
    judged.includes("sheer") ? null : sheerFact(piece),
    ...weatherFacts(piece),
    seasonFact(piece),
    availabilityFact(piece),
  ].filter((spec): spec is FactSpec => spec !== null);
}

const briefFacts = ["kind", "colour", "season", "availability"];

export const moreFacts = (piece: Piece) =>
  factSpecs(piece).filter((spec) => !briefFacts.includes(spec.id));

const shownElsewhere = ["kind", "colour", "availability"];

export const detailFacts = (piece: Piece) =>
  factSpecs(piece).filter((spec) => !shownElsewhere.includes(spec.id));

export function FactChips({
  piece,
  onChange,
  more = false,
}: {
  piece: Piece;
  onChange: (next: (closet: Closet) => Closet) => Promise<void>;
  more?: boolean;
}) {
  const colors = useColors();
  const specs = more
    ? detailFacts(piece)
    : factSpecs(piece).filter((spec) => briefFacts.includes(spec.id));
  const [adding, setAdding] = useState<ListKey | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const [shown, setShown] = useState<string | null>(null);
  const [lineEnd, setLineEnd] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const lines = useRef(new Map<string, number>());
  const secondTop = useRef(0);
  const current = specs.find((spec) => spec.id === shown) ?? null;

  const toggle = (id: string) => {
    if (open === id) {
      setOpen(null);
      return;
    }
    const at = specs.findIndex((spec) => spec.id === id);
    const top = lines.current.get(id);
    let end = at;
    for (
      let index = at + 1;
      top !== undefined && index < specs.length;
      index++
    ) {
      const y = lines.current.get(specs[index]!.id);
      if (y === undefined || Math.abs(y - top) > 2) break;
      end = index;
    }
    setLineEnd(specs[end]?.id ?? null);
    setShown(id);
    setOpen(id);
  };

  const edit =
    (piece: Piece, apply: (latest: Piece) => Piece) => (closet: Closet) => {
      const latest = closet.pieces.find((item) => item.id === piece.id);
      return latest ? savePiece(closet, apply(latest)) : closet;
    };

  const run = async (
    spec: FactSpec,
    next: (closet: Closet) => Closet,
    after: Piece,
  ) => {
    if (busy) return;
    setBusy(true);
    try {
      await onChange(next);
      if (!spec.done || spec.done(after)) setOpen(null);
    } catch {
      return;
    } finally {
      setBusy(false);
    }
  };

  const breakAt = lineEnd ? specs.findIndex((spec) => spec.id === lineEnd) : -1;
  const split = current && breakAt >= 0 ? breakAt + 1 : specs.length;

  const chip = (spec: FactSpec, second: boolean) => {
    const label = spec.showKey ? spec.name : undefined;
    const known = t(
      spec.tentative ? "piece.fact.suggested" : "piece.fact.known",
      {
        label: spec.name,
        value: spec.value,
      },
    );
    const content = spec.rows ? (
      <Chip
        kind="fact"
        label={spec.value}
        keyLabel={label}
        swatch={spec.swatch}
        tentative={spec.tentative}
        expanded={open === spec.id}
        accessibilityLabel={spec.spoken ?? known}
        accessibilityValue={spec.spokenValue}
        onPress={() => toggle(spec.id)}
        testID={`fact-${spec.id}`}
      />
    ) : (
      <View
        accessible
        accessibilityLabel={known}
        testID={`fact-${spec.id}`}
        style={[styles.still, { backgroundColor: colors.sunken }]}
      >
        <Text role="subhead">
          {label ? (
            <Text role="subhead" tone="placeholder">{`${label} `}</Text>
          ) : null}
          {spec.value}
        </Text>
      </View>
    );
    return (
      <View
        key={spec.id}
        style={styles.item}
        onLayout={(event) =>
          lines.current.set(
            spec.id,
            event.nativeEvent.layout.y + (second ? secondTop.current : 0),
          )
        }
      >
        {content}
      </View>
    );
  };

  const choose = (spec: FactSpec, row: FactRow, next: string) => {
    const apply = row.pick(next);
    const after = apply(piece);
    const transform = spec.transform
      ? spec.transform(next)
      : edit(piece, apply);
    void run(spec, transform, after).then(() => {
      if (spec.done && !spec.done(after)) return;
      if (spec.id === "coverage" && after !== piece) {
        const verdict = pieceCoverage(after);
        if (verdict)
          announce(
            t("piece.fact.known", {
              label: spec.name,
              value: t(`pieceCoverage.${verdict}` as Key),
            }),
          );
      }
    });
  };

  const body = (spec: FactSpec): ReactNode =>
    spec.rows?.map((row) => (
      <View key={row.id} style={styles.row}>
        {row.label ? (
          <Text role="subhead" tone="muted">
            {row.label}
          </Text>
        ) : null}
        <ChipRow
          label={row.label ? undefined : spec.name}
          options={[
            ...row.options.map((option) => ({
              ...option,
              accessibilityLabel: `${option.label}, ${row.label ?? spec.name}`,
            })),
            ...(row.adds ? [addOwnOption()] : []),
          ]}
          value={row.value}
          inSurface
          testID={`fact-${spec.id}-${row.id}`}
          onChange={(next) => {
            if (typeof next !== "string" || busy) return;
            if (next === addOwnId && row.adds) setAdding(row.adds);
            else choose(spec, row, next);
          }}
        />
        {row.adds && adding === row.adds ? (
          <AddOwn
            list={row.adds}
            category={piece.category}
            photo={piece.colors?.map((swatch) => swatch.rgb)}
            onAdded={(id) => {
              setAdding(null);
              choose(spec, row, id);
            }}
            onCancel={() => setAdding(null)}
            testID={`fact-${spec.id}-own`}
          />
        ) : null}
      </View>
    ));

  return (
    <View style={styles.facts}>
      <View style={styles.wrap}>
        {specs.slice(0, split).map((spec) => chip(spec, false))}
      </View>
      {current ? (
        <Expander
          id={`fact-${current.id}-body`}
          headless
          open={open === current.id}
          onToggle={() => setOpen(null)}
          actions={
            current.looksRight
              ? [
                  {
                    label: t("common.looksRight"),
                    variant: "secondary",
                    disabled: busy,
                    testID: "fact-looks-right",
                    onPress: () => {
                      const apply = current.looksRight!;
                      const after = apply(piece);
                      void run(current, edit(piece, apply), after);
                    },
                  },
                ]
              : undefined
          }
        >
          {body(current)}
        </Expander>
      ) : null}
      {split < specs.length ? (
        <View
          style={styles.wrap}
          onLayout={(event) => {
            secondTop.current = event.nativeEvent.layout.y;
          }}
        >
          {specs.slice(split).map((spec) => chip(spec, true))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  facts: { gap: theme.space.sm },
  wrap: { flexDirection: "row", flexWrap: "wrap", gap: theme.space.sm },
  item: { maxWidth: "100%" },
  row: { gap: theme.space.sm },
  still: {
    minHeight: theme.size.controlSmall,
    justifyContent: "center",
    paddingVertical: theme.space.sm,
    paddingHorizontal: theme.space.lg,
    borderRadius: theme.radius.full,
    borderCurve: "continuous",
  },
});
