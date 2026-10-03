import { useState } from "react";
import { FlatList, StyleSheet, View, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, router } from "expo-router";
import { scorerFor } from "../../src/domain/scoring/engine";
import { scoreContext } from "../../src/domain/scoring/taste";
import { activeSession, replacePiece } from "../../src/domain/today";
import { hijabAlternatives, type HijabOption } from "../../src/domain/wardrobe";
import { t } from "../../src/i18n";
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

export default function CompareHijabs() {
  const { width, height, fontScale } = useWindowDimensions();
  const wide = width >= 900;
  const { closet, update } = useCloset();
  const today = closet.styling.today;
  const session = today ? activeSession(today) : null;
  const [choice, setChoice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const comparison = session
    ? hijabAlternatives(closet, session.request, session.pieceIds, (outfit) =>
        scorerFor(session.engine ?? "rules").score(
          outfit,
          session.request,
          scoreContext(closet),
        ),
      )
    : null;

  if (!session || !comparison)
    return (
      <Screen centered>
        <Message
          title={t("hijabs.noneTitle")}
          description={t("common.backToToday")}
          action={
            <Button label={t("common.goBack")} onPress={() => router.back()} />
          }
        />
      </Screen>
    );

  const options = [comparison.current, ...comparison.options];
  const chosen = comparison.options.find(
    (option) => option.piece.id === choice,
  );
  const shown = chosen ?? comparison.current;
  const pieces = shown.ids.flatMap((id) => {
    const piece = closet.pieces.find((item) => item.id === id);
    return piece ? [piece] : [];
  });

  async function use(option: HijabOption) {
    if (!session || !comparison) return;
    setBusy(true);
    setError(null);
    try {
      await update((current) =>
        replacePiece(
          current,
          comparison.current.piece.id,
          option.piece.id,
          session.revision,
        ),
      );
      router.back();
    } catch {
      setError(t("piece.error.save"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={styles.screen}>
      <Stack.Screen
        options={{
          headerLeft: () => (
            <HeaderAction
              label={t("common.cancel")}
              onPress={() => router.back()}
            />
          ),
        }}
      />
      <View style={[styles.workspace, wide && styles.workspaceWide]}>
        <View style={styles.preview}>
          <OutfitCollage pieces={pieces} fill testID="hijab-preview" />
          <AppText
            variant="footnote"
            muted
            style={styles.summary}
            accessibilityLiveRegion="polite"
          >
            {chosen
              ? t("common.trying", { name: chosen.piece.name })
              : t("hijabs.current", { name: comparison.current.piece.name })}
          </AppText>
          {shown.problems.map((problem) => (
            <AppText key={problem.message} style={styles.summary}>
              {problem.message}
            </AppText>
          ))}
        </View>
        <View
          style={[
            styles.choices,
            wide
              ? styles.choicesWide
              : {
                  height: Math.min(
                    300 + Math.max(0, fontScale - 1) * 160,
                    height * 0.4,
                  ),
                },
          ]}
        >
          {comparison.options.length ? (
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
              renderItem={({ item, index }) => (
                <View
                  testID={`hijab-option-${index}`}
                  style={wide ? styles.cell : styles.stripCell}
                >
                  <PieceTile
                    piece={item.piece}
                    compact={!wide}
                    selected={item === shown}
                    selectedLabel={
                      index === 0
                        ? t("hijabs.currentLabel")
                        : t("common.tryingLabel")
                    }
                    onPress={() =>
                      setChoice(
                        index === 0 || choice === item.piece.id
                          ? null
                          : item.piece.id,
                      )
                    }
                  />
                  {index === 0 ? (
                    <AppText
                      variant="footnote"
                      style={styles.current}
                      numberOfLines={1}
                      maxFontSizeMultiplier={1.5}
                    >
                      {t("hijabs.inOutfit")}
                    </AppText>
                  ) : null}
                  {item.reason ? (
                    <AppText
                      variant="footnote"
                      muted
                      numberOfLines={fontScale > 1.3 ? 2 : 3}
                      maxFontSizeMultiplier={1.5}
                    >
                      {item.reason}
                    </AppText>
                  ) : null}
                </View>
              )}
            />
          ) : (
            <View style={styles.none}>
              <AppText>{t("hijabs.noOther")}</AppText>
            </View>
          )}
        </View>
      </View>
      <SafeAreaView edges={["bottom"]} style={styles.footer}>
        <View style={styles.footerContent}>
          <ErrorMessage message={error} />
          <Button
            label={t("hijabs.use")}
            busy={busy}
            disabled={!chosen}
            onPress={() => {
              if (chosen) void use(chosen);
            }}
          />
          <AppText variant="footnote" muted style={styles.center}>
            {t("hijabs.undoHint")}
          </AppText>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.colors.canvas },
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
  choices: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderColor: theme.colors.line,
  },
  choicesWide: { width: 400, borderTopWidth: 0 },
  strip: { paddingHorizontal: 24, gap: 12 },
  stripCell: { width: 140, gap: 4 },
  grid: { paddingHorizontal: 24, paddingBottom: 24 },
  row: { gap: 12 },
  cell: { width: "48%", gap: 4 },
  current: { color: theme.colors.plum, fontWeight: "600" },
  none: { paddingHorizontal: 24, gap: 12 },
  footer: {
    backgroundColor: theme.colors.canvas,
    borderTopWidth: 1,
    borderColor: theme.colors.line,
  },
  footerContent: {
    width: "100%",
    maxWidth: 1120,
    alignSelf: "center",
    paddingHorizontal: 24,
    paddingVertical: 12,
    gap: 8,
  },
  center: { textAlign: "center" },
});
