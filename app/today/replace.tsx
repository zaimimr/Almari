import { useState } from "react";
import { FlatList, StyleSheet, View, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, router, useLocalSearchParams } from "expo-router";
import { randomUUID } from "expo-crypto";
import { replacementsFor } from "../../src/domain/styling";
import { rulesScorer } from "../../src/domain/scoring/rulesScorer";
import { scoreContext } from "../../src/domain/scoring/taste";
import { activeSession, applyRequest } from "../../src/domain/today";
import { swapPiece } from "../../src/domain/feedback";
import { useCloset } from "../../src/state/closet";
import {
  AppText,
  Button,
  ErrorMessage,
  HeaderAction,
  Message,
  OutfitCollage,
  PieceTile,
  Screen,
} from "../../src/ui";
import { theme } from "../../src/ui/theme";

export default function ReplacePiece() {
  const { width, fontScale } = useWindowDimensions();
  const wide = width >= 900;
  const { id } = useLocalSearchParams<{ id: string }>();
  const { closet, update } = useCloset();
  const today = closet.styling.today;
  const session = today ? activeSession(today) : null;
  const [choice, setChoice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const target = closet.pieces.find((piece) => piece.id === id);

  if (!session || !target || !session.pieceIds.includes(target.id))
    return (
      <Screen centered>
        <Message
          title="This piece is no longer in the outfit"
          description="Go back to see today's outfit."
          action={<Button label="Go back" onPress={() => router.back()} />}
        />
      </Screen>
    );

  const options = replacementsFor(
    closet.pieces,
    session.request,
    session.pieceIds,
    target.id,
    rulesScorer,
    scoreContext(closet),
  );
  const chosen = options.find((option) => option.piece.id === choice);
  const previewIds = session.pieceIds.map((pieceId) =>
    pieceId === target.id && chosen ? chosen.piece.id : pieceId,
  );
  const pieces = previewIds.flatMap((pieceId) => {
    const piece = closet.pieces.find((item) => item.id === pieceId);
    return piece ? [piece] : [];
  });

  async function commit(
    transform: Parameters<typeof update>[0],
    failure: string,
  ) {
    setBusy(true);
    setError(null);
    try {
      await update(transform);
      router.back();
    } catch {
      setError(failure);
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={styles.screen}>
      <Stack.Screen
        options={{
          title: `Change the ${target.name.toLowerCase()}`,
          headerLeft: () => (
            <HeaderAction label="Cancel" onPress={() => router.back()} />
          ),
        }}
      />
      <View style={[styles.workspace, wide && styles.workspaceWide]}>
        <View style={styles.preview}>
          <OutfitCollage pieces={pieces} fill testID="replace-preview" />
          <AppText
            variant="caption"
            muted
            style={styles.summary}
            accessibilityLiveRegion="polite"
          >
            {chosen
              ? `Trying ${chosen.piece.name}. Everything else stays the same.`
              : "Choose an alternative to preview it in the whole outfit."}
          </AppText>
          {chosen?.problems.map((problem) => (
            <AppText key={problem.message} style={styles.summary}>
              {problem.message}
            </AppText>
          ))}
        </View>
        <View
          style={[
            styles.wardrobe,
            wide
              ? styles.wardrobeWide
              : { height: 220 + Math.max(0, fontScale - 1) * 68 },
          ]}
        >
          {options.length ? (
            <FlatList
              key={wide ? "grid" : "strip"}
              data={options}
              horizontal={!wide}
              numColumns={wide ? 2 : 1}
              keyExtractor={(option) => option.piece.id}
              contentInsetAdjustmentBehavior="never"
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={wide ? styles.grid : styles.strip}
              columnWrapperStyle={wide ? styles.row : undefined}
              renderItem={({ item }) => (
                <View style={wide ? styles.cell : styles.stripCell}>
                  <PieceTile
                    piece={item.piece}
                    compact={!wide}
                    selected={choice === item.piece.id}
                    selectedLabel="Trying"
                    onPress={() =>
                      setChoice(choice === item.piece.id ? null : item.piece.id)
                    }
                  />
                </View>
              )}
            />
          ) : (
            <View style={styles.none}>
              <AppText>
                No other piece works here without changing more of the outfit.
              </AppText>
              <Button
                label="Restyle without this piece"
                secondary
                busy={busy}
                onPress={() => {
                  void commit(
                    (current) =>
                      applyRequest(
                        current,
                        {
                          ...session.request,
                          keptIds: session.request.keptIds.filter(
                            (pieceId) => pieceId !== target.id,
                          ),
                          excludedIds: [
                            ...session.request.excludedIds,
                            target.id,
                          ],
                        },
                        session.revision,
                      ),
                    "The outfit could not be restyled. Please try again.",
                  );
                }}
              />
            </View>
          )}
        </View>
      </View>
      <SafeAreaView edges={["bottom"]} style={styles.footer}>
        <View style={styles.footerContent}>
          <ErrorMessage message={error} />
          <Button
            label="Use this piece"
            busy={busy}
            disabled={!chosen}
            onPress={() => {
              if (chosen)
                void commit(
                  (current) =>
                    swapPiece(
                      current,
                      target.id,
                      chosen.piece.id,
                      session.revision,
                      new Date().toISOString(),
                      randomUUID(),
                    ),
                  "This change could not be saved. Please try again.",
                );
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
  summary: { textAlign: "center", paddingTop: 4, paddingBottom: 8 },
  wardrobe: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderColor: theme.colors.line,
  },
  wardrobeWide: { width: 400, borderTopWidth: 0 },
  strip: { paddingHorizontal: 24, gap: 12 },
  stripCell: { width: 116 },
  grid: { paddingHorizontal: 24, paddingBottom: 24 },
  row: { gap: 12 },
  cell: { width: "48%" },
  none: { paddingHorizontal: 24, gap: 12 },
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
