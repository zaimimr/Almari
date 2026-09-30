import { useState } from "react";
import { FlatList, StyleSheet, View } from "react-native";
import { Stack, router, useLocalSearchParams } from "expo-router";
import { randomUUID } from "expo-crypto";
import { useCloset } from "../../src/state/closet";
import { type Category, saveLook } from "../../src/domain/closet";
import { useDiscardChanges } from "../../src/navigation/useDiscardChanges";
import {
  AppText,
  Button,
  ErrorMessage,
  Field,
  Filters,
  HeaderAction,
  Message,
  OutfitCollage,
  PieceTile,
} from "../../src/ui";
import { theme } from "../../src/ui/theme";

export default function BuildLook() {
  const { id: sourceId } = useLocalSearchParams<{ id?: string }>();
  const { closet, update } = useCloset();
  const [source] = useState(() =>
    closet.looks.find((look) => look.id === sourceId),
  );
  const [id] = useState(() => source?.id ?? randomUUID());
  const [name, setName] = useState(source?.name ?? "");
  const [selected, setSelected] = useState(
    () =>
      source?.pieceIds.filter((pieceId) =>
        closet.pieces.some((piece) => piece.id === pieceId),
      ) ?? [],
  );
  const [category, setCategory] = useState<Category | "all">("all");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dirty =
    name !== (source?.name ?? "") ||
    JSON.stringify(selected) !== JSON.stringify(source?.pieceIds ?? []);
  const allowClose = useDiscardChanges(dirty, busy);
  const pieces = selected.flatMap((pieceId) => {
    const piece = closet.pieces.find((item) => item.id === pieceId);
    return piece ? [piece] : [];
  });
  const options = closet.pieces.filter(
    (piece) => category === "all" || piece.category === category,
  );

  async function save() {
    if (busy || !selected.length || !name.trim()) return;
    setBusy(true);
    setError(null);
    try {
      await update((current) =>
        saveLook(current, {
          id,
          name,
          pieceIds: selected,
          createdAt: source?.createdAt ?? new Date().toISOString(),
        }),
      );
      allowClose();
      router.back();
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Your look could not be saved. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={styles.screen}>
      <Stack.Screen
        options={{
          title: source ? "Edit your look" : "Build a look",
          headerLeft: () => (
            <HeaderAction label="Cancel" onPress={() => router.back()} />
          ),
        }}
      />
      <FlatList
        data={options}
        numColumns={2}
        keyExtractor={(piece) => piece.id}
        contentInsetAdjustmentBehavior="automatic"
        automaticallyAdjustKeyboardInsets
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        contentContainerStyle={styles.content}
        columnWrapperStyle={styles.row}
        ListHeaderComponent={
          <View style={styles.header}>
            <AppText muted>
              Choose the pieces you want to wear together.
            </AppText>
            <OutfitCollage pieces={pieces} compact />
            <Field
              label="Look name"
              testID="look-name"
              placeholder="e.g. Soft layers for work"
              value={name}
              onChangeText={setName}
              maxLength={80}
              editable={!busy}
            />
            <ErrorMessage message={error} />
            <Button
              label={source ? "Save changes" : "Save look"}
              onPress={() => {
                void save();
              }}
              disabled={
                !selected.length || !name.trim() || Boolean(source && !dirty)
              }
              busy={busy}
            />
            <AppText variant="caption" muted>
              {selected.length
                ? `${selected.length} selected. Tap a selected piece to remove it.`
                : "Tap a piece below to add it to your look."}
            </AppText>
            <Filters value={category} onChange={setCategory} />
          </View>
        }
        ListEmptyComponent={
          <Message
            title={
              closet.pieces.length
                ? "No pieces in this category"
                : "Your closet comes first"
            }
            description={
              closet.pieces.length
                ? "Choose another category to keep building."
                : "Add your first pieces, then return here to make a look."
            }
            action={
              <Button
                label={
                  closet.pieces.length ? "Show all pieces" : "Go to closet"
                }
                secondary
                onPress={() =>
                  closet.pieces.length
                    ? setCategory("all")
                    : router.replace("/closet")
                }
              />
            }
          />
        }
        renderItem={({ item }) => (
          <View style={styles.cell}>
            <PieceTile
              piece={item}
              selected={selected.includes(item.id)}
              onPress={() => {
                if (!busy)
                  setSelected((current) =>
                    current.includes(item.id)
                      ? current.filter((pieceId) => pieceId !== item.id)
                      : [...current, item.id],
                  );
              }}
            />
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.colors.background },
  content: {
    padding: 24,
    paddingBottom: 56,
    width: "100%",
    maxWidth: 720,
    alignSelf: "center",
  },
  header: { gap: 20, paddingBottom: 24 },
  row: { gap: 16 },
  cell: { width: "48%" },
});
