import { useEffect, useMemo, useRef, useState } from "react";
import {
  FlatList,
  Keyboard,
  StyleSheet,
  View,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, router, useLocalSearchParams } from "expo-router";
import { randomUUID } from "expo-crypto";
import { useCloset } from "../../src/state/closet";
import {
  type Category,
  type Occasion,
  type Piece,
  saveLook,
} from "../../src/domain/closet";
import {
  builderRequest,
  fillOutfit,
  followName,
  rankPieces,
  swapOptions,
} from "../../src/domain/builder";
import { recordSaved } from "../../src/domain/feedback";
import { outfitName } from "../../src/domain/outfitName";
import { clockFor } from "../../src/domain/today";
import { useDiscardChanges } from "../../src/navigation/useDiscardChanges";
import {
  AppText,
  Button,
  ErrorMessage,
  Field,
  Filters,
  HeaderAction,
  OutfitCollage,
  PieceTile,
} from "../../src/ui";
import { theme } from "../../src/ui/theme";
import { locale, t } from "../../src/i18n";

export default function BuildLook() {
  const { width, fontScale } = useWindowDimensions();
  const wide = width >= 900;
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const keyboardVisible = keyboardHeight > 0;
  const {
    id: sourceId,
    pieces: startingPieces,
    name: startingName,
    occasion: startingOccasion,
  } = useLocalSearchParams<{
    id?: string;
    pieces?: string;
    name?: string;
    occasion?: Occasion;
  }>();
  const { closet, update } = useCloset();
  const [source] = useState(() =>
    closet.looks.find((look) => look.id === sourceId),
  );
  const [id] = useState(() => source?.id ?? randomUUID());
  const [initialSelection] = useState(() =>
    (source?.pieceIds ?? startingPieces?.split(",") ?? []).filter((pieceId) =>
      closet.pieces.some((piece) => piece.id === pieceId),
    ),
  );
  const [selected, setSelected] = useState(initialSelection);
  const list = useRef<FlatList<Piece>>(null);
  const [swapping, setSwapping] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const occasion = source?.occasion ?? startingOccasion;
  const localDate = clockFor(new Date()).localDate;
  const request = useMemo(
    () => builderRequest(closet, selected, occasion),
    [closet, selected, occasion],
  );
  const pieces = selected.flatMap((pieceId) => {
    const piece = closet.pieces.find((item) => item.id === pieceId);
    return piece ? [piece] : [];
  });
  const suggested = outfitName(pieces, request.occasion, locale);
  const [named, setNamed] = useState(suggested);
  const [name, setName] = useState(source?.name ?? startingName ?? suggested);
  if (named !== suggested) {
    setNamed(suggested);
    setName(followName(name, named, suggested));
  }
  const [category, setCategory] = useState<Category | "all">("all");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dirty =
    name !== (source?.name ?? startingName ?? suggested) ||
    JSON.stringify(selected) !==
      JSON.stringify(source?.pieceIds ?? initialSelection);
  const allowClose = useDiscardChanges(dirty, busy);
  const options = useMemo(
    () =>
      rankPieces(
        closet,
        request,
        selected,
        closet.pieces.filter(
          (piece) => category === "all" || piece.category === category,
        ),
        localDate,
      ),
    [closet, request, selected, category, localDate],
  );
  const swapTarget = pieces.find((piece) => piece.id === swapping) ?? null;
  const alternatives = swapTarget
    ? swapOptions(closet, request, selected, swapTarget.id, localDate)
    : [];

  function choose(next: string[]) {
    list.current?.scrollToOffset({ offset: 0, animated: false });
    setNotice(null);
    setSwapping(null);
    setSelected(next);
  }

  function fill() {
    const filled = fillOutfit(closet, request, localDate);
    if ("ids" in filled) choose(filled.ids);
    else setNotice(filled.problems[0]?.message ?? t("styling.incomplete"));
  }

  useEffect(() => {
    const show = Keyboard.addListener("keyboardWillShow", (event) =>
      setKeyboardHeight(event.endCoordinates.height),
    );
    const hide = Keyboard.addListener("keyboardWillHide", () =>
      setKeyboardHeight(0),
    );
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  async function save() {
    if (busy || !selected.length || !name.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const occasion = source?.occasion ?? startingOccasion;
      await update((current) =>
        recordSaved(
          saveLook(current, {
            id,
            name,
            pieceIds: selected,
            createdAt: source?.createdAt ?? new Date().toISOString(),
            ...(occasion ? { occasion } : {}),
          }),
          selected,
          new Date().toISOString(),
          randomUUID(),
        ),
      );
      allowClose();
      router.back();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t("error.lookSave"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={[styles.screen, { paddingBottom: keyboardHeight }]}>
      <Stack.Screen
        options={{
          title: source
            ? t("build.edit")
            : initialSelection.length
              ? t("build.save")
              : t("title.buildLook"),
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
          <OutfitCollage
            pieces={pieces}
            fill
            testID="live-outfit-preview"
            onPiecePress={(piece) =>
              setSwapping((current) => (current === piece.id ? null : piece.id))
            }
          />
          {pieces.length ? (
            <AppText
              variant="caption"
              muted
              style={styles.summary}
              accessibilityLiveRegion="polite"
            >
              {pieces.length === 1
                ? t("build.countOne")
                : t("build.countMany", { count: pieces.length })}
            </AppText>
          ) : null}
          {notice ? (
            <AppText
              muted
              style={styles.summary}
              accessibilityLiveRegion="polite"
            >
              {notice}
            </AppText>
          ) : null}
          {closet.pieces.length ? (
            <View style={styles.fill}>
              <Button
                label={t("build.fill")}
                secondary
                compact
                disabled={busy}
                onPress={fill}
              />
            </View>
          ) : null}
        </View>
        <View
          style={[
            styles.wardrobe,
            wide
              ? styles.wardrobeWide
              : { height: 256 + Math.max(0, fontScale - 1) * 68 },
            keyboardVisible && styles.hidden,
          ]}
        >
          {swapTarget ? (
            <View style={styles.swap} testID="swap-options">
              <View style={styles.swapHeader}>
                <AppText style={styles.swapTitle} numberOfLines={2}>
                  {t("build.swapTitle", { name: swapTarget.name })}
                </AppText>
                <HeaderAction
                  label={t("build.swapDone")}
                  onPress={() => setSwapping(null)}
                />
              </View>
              {alternatives.length ? (
                <View style={styles.swapRow}>
                  {alternatives.map((piece) => (
                    <View key={piece.id} style={styles.swapCell}>
                      <PieceTile
                        piece={piece}
                        compact
                        onPress={() =>
                          choose(
                            selected.map((pieceId) =>
                              pieceId === swapTarget.id ? piece.id : pieceId,
                            ),
                          )
                        }
                      />
                    </View>
                  ))}
                </View>
              ) : (
                <AppText muted>{t("build.swapNone")}</AppText>
              )}
            </View>
          ) : (
            <>
              <View style={styles.filters}>
                <Filters value={category} onChange={setCategory} />
              </View>
              <FlatList
                ref={list}
                key={wide ? "grid" : "strip"}
                testID="outfit-piece-picker"
                data={options}
                horizontal={!wide}
                numColumns={wide ? 2 : 1}
                keyExtractor={(piece) => piece.id}
                contentInsetAdjustmentBehavior="never"
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="on-drag"
                style={styles.picker}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={wide ? styles.grid : styles.strip}
                columnWrapperStyle={wide ? styles.row : undefined}
                ListEmptyComponent={
                  <View style={[styles.empty, !wide && { width: width - 48 }]}>
                    <AppText muted>
                      {closet.pieces.length
                        ? t("common.noPiecesInCategory")
                        : t("build.empty")}
                    </AppText>
                    <Button
                      label={
                        closet.pieces.length
                          ? t("common.showAllPieces")
                          : t("piece.missing.action")
                      }
                      secondary
                      onPress={() =>
                        closet.pieces.length
                          ? setCategory("all")
                          : router.replace("/closet")
                      }
                    />
                  </View>
                }
                renderItem={({ item }) => (
                  <View style={wide ? styles.cell : styles.stripCell}>
                    <PieceTile
                      piece={item}
                      compact={!wide}
                      selected={selected.includes(item.id)}
                      onPress={() => {
                        if (!busy)
                          choose(
                            selected.includes(item.id)
                              ? selected.filter(
                                  (pieceId) => pieceId !== item.id,
                                )
                              : [...selected, item.id],
                          );
                      }}
                    />
                  </View>
                )}
              />
            </>
          )}
        </View>
      </View>
      <SafeAreaView
        edges={keyboardVisible ? [] : ["bottom"]}
        style={styles.footer}
      >
        <View style={styles.footerContent}>
          <ErrorMessage message={error} />
          <View style={styles.saveRow}>
            <View style={styles.nameField}>
              <Field
                label={t("build.name")}
                testID="look-name"
                placeholder={t("build.nameHint")}
                value={name}
                onChangeText={setName}
                maxLength={80}
                editable={!busy}
                returnKeyType="done"
              />
            </View>
            <Button
              label={source ? t("common.saveChanges") : t("common.saveLook")}
              onPress={() => {
                void save();
              }}
              disabled={
                !selected.length || !name.trim() || Boolean(source && !dirty)
              }
              busy={busy}
            />
          </View>
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
  hidden: { display: "none" },
  strip: { paddingHorizontal: 24, gap: 12 },
  stripCell: { width: 116 },
  swapCell: { width: 116, height: 176 },
  grid: { paddingHorizontal: 24, paddingBottom: 24 },
  row: { gap: 12 },
  cell: { width: "48%" },
  empty: { gap: 12 },
  fill: { alignItems: "center", paddingBottom: 12 },
  swap: { paddingHorizontal: 24, gap: 12 },
  swapHeader: { flexDirection: "row", alignItems: "center", gap: 12 },
  swapTitle: { flex: 1, fontWeight: "600" },
  swapRow: { flexDirection: "row", gap: 12 },
  saveRow: { flexDirection: "row", gap: 12, alignItems: "flex-end" },
  nameField: { flex: 1 },
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
