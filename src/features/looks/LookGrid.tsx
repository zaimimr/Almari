import { Pressable, StyleSheet, View } from "react-native";
import { router } from "expo-router";
import type { Closet } from "../../domain/closet";
import type { LookEntry } from "../../domain/looks";
import { t } from "../../i18n";
import { FlatLay, Text } from "../../ui";
import { theme } from "../../ui/theme";
import { useColors } from "../../ui/useColors";
import { useLargeText } from "../../ui/useLargeText";
import { LookRow } from "./LookRow";
import { entryMeta } from "./format";

function LookCard({ closet, entry }: { closet: Closet; entry: LookEntry }) {
  const colors = useColors();
  const pieces = entry.pieceIds.flatMap((id) => {
    const piece = closet.pieces.find((item) => item.id === id);
    return piece ? [piece] : [];
  });
  const meta = entryMeta(closet, entry);
  const count =
    pieces.length === 1
      ? t("common.pieceCountOne")
      : t("common.pieceCountMany", { count: pieces.length });
  return (
    <Pressable
      onPress={() => router.push(`/look/${entry.id}`)}
      accessibilityRole="button"
      accessibilityLabel={[entry.name, meta, count].filter(Boolean).join(", ")}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
      testID={`look-${entry.id}`}
    >
      <View
        style={[styles.bed, { borderColor: colors.line }]}
        pointerEvents="none"
      >
        <FlatLay pieces={pieces} size="hero" />
      </View>
      <View style={styles.text}>
        <Text role="headline" numberOfLines={2}>
          {entry.name}
        </Text>
        {meta ? (
          <Text role="footnote" tone="muted" numberOfLines={1}>
            {meta}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

export function LookGrid({
  closet,
  entries,
}: {
  closet: Closet;
  entries: LookEntry[];
}) {
  const { ax } = useLargeText();
  if (ax)
    return (
      <View>
        {entries.map((entry, index) => (
          <LookRow
            key={entry.id}
            closet={closet}
            entry={entry}
            last={index === entries.length - 1}
          />
        ))}
      </View>
    );
  const pairs = entries.flatMap((entry, index) =>
    index % 2 ? [] : [entries.slice(index, index + 2)],
  );
  return (
    <View style={styles.grid}>
      {pairs.map((pair) => (
        <View key={pair[0]!.id} style={styles.pair}>
          {pair.map((entry) => (
            <LookCard key={entry.id} closet={closet} entry={entry} />
          ))}
          {pair.length === 1 ? <View style={styles.card} /> : null}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { gap: theme.space.lg },
  pair: { flexDirection: "row", gap: theme.space.md },
  card: { flex: 1, gap: theme.space.sm },
  pressed: { opacity: 0.7 },
  bed: {
    borderRadius: theme.radius.md,
    overflow: "hidden",
    borderWidth: StyleSheet.hairlineWidth,
  },
  text: { gap: 2 },
});
