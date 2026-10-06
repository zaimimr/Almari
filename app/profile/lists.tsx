import { useState } from "react";
import { StyleSheet, View } from "react-native";
import {
  removeOwn,
  renameOwn,
  type ListKey,
  type Lists,
} from "../../src/domain/lists";
import { colourHex } from "../../src/features/ColourChips";
import { categoryName, t } from "../../src/i18n";
import { useCloset } from "../../src/state/closet";
import { Expander, Field, Screen, Section, Text } from "../../src/ui";
import { announce } from "../../src/ui/announce";
import { confirmAction } from "../../src/ui/confirm";
import { theme } from "../../src/ui/theme";
import { useColors } from "../../src/ui/useColors";

const sections: {
  list: ListKey;
  title: "own.colours" | "own.fabrics" | "own.kinds";
}[] = [
  { list: "colours", title: "own.colours" },
  { list: "fabrics", title: "own.fabrics" },
  { list: "kinds", title: "own.kinds" },
];

type Item = Lists[ListKey][number];

function OwnItem({
  list,
  item,
  open,
  onToggle,
}: {
  list: ListKey;
  item: Item;
  open: boolean;
  onToggle: () => void;
}) {
  const { update } = useCloset();
  const colors = useColors();
  const [name, setName] = useState(item.name);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  async function act(change: () => Promise<unknown>) {
    if (busy) return;
    setBusy(true);
    setFailed(false);
    try {
      await change();
      announce(t("result.saved"));
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    const sure = await confirmAction(
      t("own.removeTitle", { name: item.name }),
      t("own.removeBody"),
      t("common.remove"),
    );
    if (sure)
      await act(() => update((current) => removeOwn(current, list, item.id)));
  }

  return (
    <Expander
      id={`own-${item.id}`}
      title={item.name}
      value={"category" in item ? categoryName(item.category) : undefined}
      open={open}
      onToggle={onToggle}
      actions={[
        {
          label: t("common.save"),
          variant: "secondary",
          disabled: busy || !name.trim() || name.trim() === item.name,
          testID: `own-${item.id}-save`,
          onPress: () =>
            void act(() =>
              update((current) => renameOwn(current, list, item.id, name)),
            ),
        },
        {
          label: t("common.remove"),
          variant: "quiet",
          disabled: busy,
          testID: `own-${item.id}-remove`,
          onPress: () => void remove(),
        },
      ]}
      testID={`own-${item.id}`}
    >
      <View style={styles.body}>
        {"rgb" in item ? (
          <View
            style={[
              styles.swatch,
              {
                backgroundColor: colourHex(item.id),
                borderColor: colors.lineField,
              },
            ]}
          />
        ) : null}
        <Field
          label={t("own.name")}
          value={name}
          onChangeText={setName}
          maxLength={40}
          returnKeyType="done"
          testID={`own-${item.id}-name`}
        />
        {failed ? (
          <Text role="footnote" tone="error" announce>
            {t("common.error.save")}
          </Text>
        ) : null}
      </View>
    </Expander>
  );
}

export default function OwnLists() {
  const { closet } = useCloset();
  const [open, setOpen] = useState<string | null>(null);
  const lists = closet.lists;
  const empty =
    !lists?.colours.length && !lists?.fabrics.length && !lists?.kinds.length;

  return (
    <Screen title={t("own.lists")} leading="back" testID="own-lists">
      <View style={styles.list}>
        {empty ? (
          <Text role="body" tone="muted" testID="own-empty">
            {t("own.empty")}
          </Text>
        ) : null}
        {sections.map(({ list, title }) =>
          lists?.[list].length ? (
            <Section key={list} title={t(title)} testID={`own-${list}`}>
              {lists[list].map((item) => (
                <OwnItem
                  key={item.id}
                  list={list}
                  item={item}
                  open={open === item.id}
                  onToggle={() =>
                    setOpen((current) => (current === item.id ? null : item.id))
                  }
                />
              ))}
            </Section>
          ) : null,
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { gap: theme.space.lg },
  body: { gap: theme.space.md },
  swatch: { width: 32, height: 32, borderRadius: 16, borderWidth: 1 },
});
