import { useState } from "react";
import { FlatList, StyleSheet, View, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, router } from "expo-router";
import { isAvailable, type Category } from "../../src/domain/closet";
import { activeSession, applyRequest } from "../../src/domain/today";
import { useCloset } from "../../src/state/closet";
import { useDiscardChanges } from "../../src/navigation/useDiscardChanges";
import {
  AppText,
  Button,
  ErrorMessage,
  Filters,
  HeaderAction,
  Message,
  OutfitCollage,
  PieceTile,
  Screen,
} from "../../src/ui";
import { theme } from "../../src/ui/theme";

export default function ChoosePieces() {
  const { width, fontScale } = useWindowDimensions();
  const wide = width >= 900;
  const { closet, update } = useCloset();
  const today = closet.styling.today;
  const session = today ? activeSession(today) : null;
  const [initial] = useState(() => session?.request.keptIds ?? []);
  const [selected, setSelected] = useState(initial);
  const [category, setCategory] = useState<Category | "all">("all");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dirty = selected.join() !== initial.join();
  const allowClose = useDiscardChanges(dirty, busy);

  if (!today || !session)
    return (
      <Screen centered>
        <Message
          title="Set your everyday style first"
          description="Today's outfit starts from your everyday style."
          action={<Button label="Go back" onPress={() => router.back()} />}
        />
      </Screen>
    );

  const pool = closet.pieces.filter(
    (piece) => piece.source === session.request.wardrobe && isAvailable(piece),
  );
  const options = pool.filter(
    (piece) => category === "all" || piece.category === category,
  );
  const pieces = selected.flatMap((id) => {
    const piece = pool.find((item) => item.id === id);
    return piece ? [piece] : [];
  });

  async function submit() {
    if (!session || busy) return;
    setBusy(true);
    setError(null);
    try {
      await update((current) =>
        applyRequest(
          current,
          {
            ...session.request,
            keptIds: selected.filter((id) =>
              pool.some((piece) => piece.id === id),
            ),
            excludedIds: session.request.excludedIds.filter(
              (id) => !selected.includes(id),
            ),
          },
          session.revision,
        ),
      );
      allowClose();
      router.back();
    } catch {
      setError("These pieces could not be saved. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={styles.screen}>
      <Stack.Screen
        options={{
          headerLeft: () => (
            <HeaderAction label="Cancel" onPress={() => router.back()} />
          ),
          headerRight: () =>
            selected.length ? (
              <HeaderAction label="Clear" onPress={() => setSelected([])} />
            ) : null,
        }}
      />
      <View style={[styles.workspace, wide && styles.workspaceWide]}>
        <View style={styles.preview}>
          <OutfitCollage pieces={pieces} fill testID="kept-preview" />
          <AppText
            variant="caption"
            muted
            style={styles.summary}
            accessibilityLiveRegion="polite"
          >
            {selected.length
              ? `Keeping ${selected.length} ${selected.length === 1 ? "piece" : "pieces"}. The rest of the outfit is chosen around them.`
              : "Choose any pieces you want to wear. The rest is styled around them."}
          </AppText>
        </View>
        <View
          style={[
            styles.wardrobe,
            wide
              ? styles.wardrobeWide
              : { height: 256 + Math.max(0, fontScale - 1) * 68 },
          ]}
        >
          <View style={styles.filters}>
            <Filters value={category} onChange={setCategory} />
          </View>
          <FlatList
            key={wide ? "grid" : "strip"}
            data={options}
            horizontal={!wide}
            numColumns={wide ? 2 : 1}
            keyExtractor={(piece) => piece.id}
            contentInsetAdjustmentBehavior="never"
            style={styles.picker}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={wide ? styles.grid : styles.strip}
            columnWrapperStyle={wide ? styles.row : undefined}
            ListEmptyComponent={
              <View style={[styles.empty, !wide && { width: width - 48 }]}>
                <AppText muted>
                  {pool.length
                    ? "No pieces in this category yet."
                    : "There are no pieces in this closet yet."}
                </AppText>
                {pool.length ? (
                  <Button
                    label="Show all pieces"
                    secondary
                    onPress={() => setCategory("all")}
                  />
                ) : null}
              </View>
            }
            renderItem={({ item }) => (
              <View style={wide ? styles.cell : styles.stripCell}>
                <PieceTile
                  piece={item}
                  compact={!wide}
                  selected={selected.includes(item.id)}
                  selectedLabel="Kept"
                  onPress={() => {
                    if (!busy)
                      setSelected((current) =>
                        current.includes(item.id)
                          ? current.filter((id) => id !== item.id)
                          : [...current, item.id],
                      );
                  }}
                />
              </View>
            )}
          />
        </View>
      </View>
      <SafeAreaView edges={["bottom"]} style={styles.footer}>
        <View style={styles.footerContent}>
          <ErrorMessage message={error} />
          <Button
            label={
              selected.length
                ? "Style around these"
                : initial.length
                  ? "Stop keeping pieces"
                  : "Done"
            }
            busy={busy}
            disabled={!dirty && !selected.length}
            onPress={() => {
              void submit();
            }}
          />
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.colors.background },
  workspace: {
    flex: 1,
    minHeight: 0,
    width: "100%",
    maxWidth: 1120,
    alignSelf: "center",
  },
  workspaceWide: { flexDirection: "row" },
  preview: { flex: 1, minHeight: 0, paddingHorizontal: 24, paddingTop: 8 },
  summary: { textAlign: "center", paddingTop: 4, paddingBottom: 12 },
  wardrobe: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderColor: theme.colors.line,
  },
  wardrobeWide: { width: 400, borderTopWidth: 0, paddingTop: 16 },
  filters: { paddingHorizontal: 24, paddingBottom: 12 },
  picker: { flex: 1 },
  strip: { paddingHorizontal: 24, gap: 12 },
  stripCell: { width: 116 },
  grid: { paddingHorizontal: 24, paddingBottom: 24 },
  row: { gap: 12 },
  cell: { width: "48%" },
  empty: { gap: 12 },
  footer: {
    backgroundColor: theme.colors.background,
    borderTopWidth: 1,
    borderColor: theme.colors.line,
  },
  footerContent: {
    width: "100%",
    maxWidth: 1120,
    alignSelf: "center",
    paddingHorizontal: 24,
    paddingVertical: 12,
    gap: 12,
  },
});
