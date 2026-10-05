import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { categories, type Category } from "../domain/closet";
import { colorName, type Rgb } from "../domain/color";
import { addOwn, setLists, type ListKey, type Lists } from "../domain/lists";
import { categoryName, t } from "../i18n";
import { useCloset } from "../state/closet";
import { Button, ChipRow, Field, Text } from "../ui";
import { theme } from "../ui/theme";
import { useColors } from "../ui/useColors";
import { colourLabel } from "./ColourChips";

export const addOwnId = "add-own";

export const addOwnOption = () => ({ id: addOwnId, label: t("own.add") });

const hex = (rgb: readonly number[]) =>
  `#${rgb.map((part) => part.toString(16).padStart(2, "0")).join("")}`;

function fromHsl(hue: number, saturation: number, lightness: number): Rgb {
  const chroma = (1 - Math.abs(2 * lightness - 1)) * saturation;
  const step = hue / 60;
  const x = chroma * (1 - Math.abs((step % 2) - 1));
  const [r, g, b] =
    step < 1
      ? [chroma, x, 0]
      : step < 2
        ? [x, chroma, 0]
        : step < 3
          ? [0, chroma, x]
          : step < 4
            ? [0, x, chroma]
            : step < 5
              ? [x, 0, chroma]
              : [chroma, 0, x];
  const m = lightness - chroma / 2;
  return [r, g, b].map((part) => Math.round((part + m) * 255)) as Rgb;
}

const spectrum: Rgb[] = [
  ...[0.3, 0.5, 0.72].flatMap((lightness) =>
    Array.from({ length: 12 }, (_, index) =>
      fromHsl(index * 30, 0.6, lightness),
    ),
  ),
  [20, 20, 20],
  [120, 120, 120],
  [200, 200, 200],
  [250, 250, 250],
];

function SwatchGrid({
  label,
  colours,
  value,
  onPick,
  testID,
}: {
  label: string;
  colours: Rgb[];
  value: Rgb | null;
  onPick: (rgb: Rgb) => void;
  testID: string;
}) {
  const colors = useColors();
  return (
    <View style={styles.block}>
      <Text role="subhead" tone="muted">
        {label}
      </Text>
      <View style={styles.grid} testID={testID}>
        {colours.map((rgb, index) => {
          const chosen = value !== null && hex(value) === hex(rgb);
          return (
            <Pressable
              key={`${hex(rgb)}-${index}`}
              accessibilityRole="radio"
              accessibilityLabel={colourLabel(colorName(rgb))}
              accessibilityState={{ selected: chosen }}
              hitSlop={4}
              onPress={() => onPick(rgb)}
              style={[
                styles.swatch,
                {
                  backgroundColor: hex(rgb),
                  borderColor: chosen ? colors.ink : colors.lineField,
                  borderWidth: chosen ? 3 : 1,
                },
              ]}
              testID={`${testID}-${index}`}
            />
          );
        })}
      </View>
    </View>
  );
}

export function AddOwn({
  list,
  category,
  photo,
  onAdded,
  onCancel,
  testID,
}: {
  list: ListKey;
  category?: Category;
  photo?: Rgb[];
  onAdded: (id: string) => void;
  onCancel: () => void;
  testID?: string;
}) {
  const { update } = useCloset();
  const [name, setName] = useState("");
  const [rgb, setRgb] = useState<Rgb | null>(photo?.[0] ?? null);
  const [parent, setParent] = useState<Category | null>(category ?? null);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const ready =
    Boolean(name.trim()) &&
    (list !== "colours" || rgb !== null) &&
    (list !== "kinds" || parent !== null);
  const id = testID ?? `add-own-${list}`;

  async function save() {
    if (!ready || busy) return;
    setBusy(true);
    setFailed(false);
    let added: string | null = null;
    let lists: Lists | undefined;
    try {
      await update((current) => {
        const result = addOwn(current, list, {
          name,
          rgb: rgb ?? undefined,
          category: parent ?? undefined,
        });
        added = result.id;
        lists = result.closet.lists;
        return result.closet;
      });
      setLists(lists);
      setBusy(false);
      if (added) onAdded(added);
    } catch {
      setBusy(false);
      setFailed(true);
    }
  }

  const photoColours = [
    ...new Map((photo ?? []).map((item) => [hex(item), item])).values(),
  ];

  return (
    <View style={styles.form} testID={id}>
      <Field
        label={t("own.name")}
        value={name}
        onChangeText={setName}
        maxLength={40}
        autoFocus
        returnKeyType="done"
        onSubmitEditing={() => void save()}
        testID={`${id}-name`}
      />
      {list === "kinds" ? (
        <ChipRow
          label={t("piece.category")}
          options={categories.map((option) => ({
            id: option.id as string,
            label: categoryName(option.id),
          }))}
          value={parent}
          onChange={(next) => {
            if (typeof next === "string") setParent(next as Category);
          }}
          testID={`${id}-category`}
        />
      ) : null}
      {list === "colours" && photoColours.length ? (
        <SwatchGrid
          label={t("own.fromPhoto")}
          colours={photoColours}
          value={rgb}
          onPick={setRgb}
          testID={`${id}-photo`}
        />
      ) : null}
      {list === "colours" ? (
        <SwatchGrid
          label={t("fact.colour")}
          colours={spectrum}
          value={rgb}
          onPick={setRgb}
          testID={`${id}-swatch`}
        />
      ) : null}
      {failed ? (
        <Text role="footnote" tone="error" announce>
          {t("common.error.save")}
        </Text>
      ) : null}
      <View style={styles.actions}>
        <Button
          label={t("common.add")}
          variant="secondary"
          size="small"
          disabled={!ready}
          busy={busy}
          onPress={() => void save()}
          testID={`${id}-save`}
        />
        <Button
          label={t("common.cancel")}
          variant="quiet"
          size="small"
          disabled={busy}
          onPress={onCancel}
          testID={`${id}-cancel`}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  form: { gap: theme.space.md },
  block: { gap: theme.space.sm },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: theme.space.sm },
  swatch: { width: 32, height: 32, borderRadius: 16 },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: theme.space.sm },
});
