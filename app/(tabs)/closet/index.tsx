import { useState } from "react";
import { FlatList, ScrollView, StyleSheet, View } from "react-native";
import { Stack, router } from "expo-router";
import { randomUUID } from "expo-crypto";
import { useCloset } from "../../../src/state/closet";
import { occasions } from "../../../src/domain/closet";
import { linkSet } from "../../../src/domain/sets";
import { shelf } from "../../../src/domain/wardrobe";
import {
  closetChips,
  filterPieces,
  noFilter,
  type ClosetFilter,
} from "../../../src/domain/closetFilters";
import { categoryName, occasionName, styleName, t } from "../../../src/i18n";
import {
  AppText,
  Button,
  Chip,
  ErrorMessage,
  Field,
  HeaderAction,
  Message,
  PieceTile,
} from "../../../src/ui";
import { addPiecesRoute } from "../../../src/state/imports";
import { theme } from "../../../src/ui/theme";

type FilterOption = {
  key: string;
  label: string;
  selected: boolean;
  change: Partial<ClosetFilter>;
};

export default function ClosetScreen() {
  const { closet, update } = useCloset();
  const [selecting, setSelecting] = useState(false);
  const [chosen, setChosen] = useState<string[]>([]);
  const [linked, setLinked] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<ClosetFilter>(noFilter);
  const [search, setSearch] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const archivedCount = shelf(closet.pieces, true).length;
  const shelved = shelf(closet.pieces, showArchived);
  const sampleCount = shelf(closet.pieces, false).filter(
    (piece) => piece.source === "sample",
  ).length;
  const chips = closetChips(shelved);
  const query = search.trim().toLowerCase();
  const filtered = filterPieces(shelved, filter).filter((piece) =>
    piece.name.toLowerCase().includes(query),
  );
  const filterOptions: FilterOption[] = [
    ...(["desi", "western"] as const).map((style) => ({
      key: `style-${style}`,
      label: styleName(style),
      selected: filter.style === style,
      change: { style: filter.style === style ? null : style },
    })),
    ...occasions.map((occasion) => ({
      key: `occasion-${occasion.id}`,
      label: occasionName(occasion.id),
      selected: filter.occasion === occasion.id,
      change: {
        occasion: filter.occasion === occasion.id ? null : occasion.id,
      },
    })),
    ...(["available", "away"] as const).map((availability) => ({
      key: `availability-${availability}`,
      label: t(
        availability === "available" ? "closet.available" : "closet.away",
      ),
      selected: filter.availability === availability,
      change: {
        availability:
          filter.availability === availability ? null : availability,
      },
    })),
  ];

  function toggleSelecting() {
    setSelecting(!selecting);
    setChosen([]);
    setLinked(false);
    setError(null);
  }

  async function link() {
    setError(null);
    try {
      await update((current) => linkSet(current, chosen, randomUUID()));
      setSelecting(false);
      setChosen([]);
      setLinked(true);
    } catch {
      setError(t("sets.linkFailed"));
    }
  }

  return (
    <View style={styles.screen}>
      <Stack.Screen
        options={{
          headerLeft:
            closet.pieces.length > 1
              ? () => (
                  <HeaderAction
                    label={selecting ? t("capture.cancel") : t("sets.select")}
                    onPress={toggleSelecting}
                  />
                )
              : undefined,
          headerRight: () => (
            <HeaderAction
              label="Add pieces"
              onPress={() => router.push(addPiecesRoute)}
            />
          ),
        }}
      />
      <FlatList
        data={filtered}
        numColumns={2}
        keyExtractor={(piece) => piece.id}
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        contentContainerStyle={styles.content}
        columnWrapperStyle={styles.row}
        extraData={{ selecting, chosen }}
        ListHeaderComponent={
          <View style={styles.intro}>
            <AppText muted>
              {closet.pieces.length === 0
                ? "A little space for the pieces you love."
                : `${shelved.length} ${shelved.length === 1 ? "piece" : "pieces"}, ready for a new combination.`}
            </AppText>
            {selecting ? (
              <View style={styles.starter}>
                <AppText muted>{t("sets.hint")}</AppText>
                <Button
                  label={t("sets.link")}
                  disabled={chosen.length < 2}
                  onPress={() => {
                    void link();
                  }}
                />
                <ErrorMessage message={error} />
              </View>
            ) : linked ? (
              <AppText accessibilityLiveRegion="polite">
                {t("sets.linked")}
              </AppText>
            ) : null}
            {sampleCount > 0 ? (
              <View style={styles.starter}>
                <AppText variant="caption" muted>
                  {sampleCount} sample pieces included. Try a combination you
                  love.
                </AppText>
                <Button
                  label="Build a look"
                  onPress={() => router.push("/look/build")}
                />
              </View>
            ) : null}
            {closet.pieces.length > 0 ? (
              <>
                <Field
                  label="Find a piece"
                  placeholder="Try a name, like mauve hijab"
                  value={search}
                  onChangeText={setSearch}
                  autoCorrect={false}
                  clearButtonMode="while-editing"
                />
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.chips}
                  accessibilityLabel={t("closet.categories")}
                >
                  {chips.map((id) => (
                    <Chip
                      key={id}
                      label={id === "all" ? t("closet.all") : categoryName(id)}
                      selected={filter.category === id}
                      onPress={() =>
                        setFilter((current) => ({ ...current, category: id }))
                      }
                    />
                  ))}
                </ScrollView>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.chips}
                  accessibilityLabel={t("closet.filters")}
                  testID="closet-filters"
                >
                  {filterOptions.map((option) => (
                    <Chip
                      key={option.key}
                      label={option.label}
                      selected={option.selected}
                      onPress={() =>
                        setFilter((current) => ({
                          ...current,
                          ...option.change,
                        }))
                      }
                    />
                  ))}
                  {archivedCount || showArchived ? (
                    <Chip
                      label={t("archive.filter", { count: archivedCount })}
                      selected={showArchived}
                      onPress={() => setShowArchived(!showArchived)}
                    />
                  ) : null}
                </ScrollView>
              </>
            ) : null}
          </View>
        }
        ListEmptyComponent={
          closet.pieces.length === 0 ? (
            <View style={styles.empty}>
              <View style={styles.firstPiece}>
                <AppText variant="title" style={styles.emptyNumber}>
                  Your first piece.
                </AppText>
                <AppText muted style={styles.emptyCopy}>
                  Start with a favorite hijab,{"\n"}a go-to layer, or something
                  {"\n"}you want to wear more.
                </AppText>
              </View>
              <Button
                label="Add your first piece"
                onPress={() => router.push(addPiecesRoute)}
              />
              <AppText variant="caption" muted style={styles.note}>
                Your closet is saved on this device.
              </AppText>
            </View>
          ) : (
            <Message
              title="No pieces found"
              description={t("closet.noMatch")}
              action={
                <Button
                  label="Clear filters"
                  secondary
                  onPress={() => {
                    setSearch("");
                    setFilter(noFilter);
                    setShowArchived(false);
                  }}
                />
              }
            />
          )
        }
        renderItem={({ item }) => (
          <View style={styles.cell}>
            <PieceTile
              piece={item}
              selected={selecting && chosen.includes(item.id)}
              onPress={() =>
                selecting
                  ? setChosen((current) =>
                      current.includes(item.id)
                        ? current.filter((id) => id !== item.id)
                        : [...current, item.id],
                    )
                  : router.push({
                      pathname: "/piece/[id]",
                      params: { id: item.id },
                    })
              }
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
    paddingBottom: 110,
    width: "100%",
    maxWidth: 720,
    alignSelf: "center",
  },
  intro: { gap: 20, paddingBottom: 24 },
  starter: { gap: 12 },
  chips: { gap: 8, paddingVertical: 4 },
  row: { gap: 16 },
  cell: { width: "48%", flexGrow: 0 },
  empty: { gap: 20, paddingTop: 24 },
  firstPiece: {
    minHeight: 270,
    justifyContent: "center",
    gap: 20,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: theme.colors.line,
    paddingVertical: 40,
  },
  emptyNumber: { color: theme.colors.accent },
  emptyCopy: { lineHeight: 28 },
  note: { textAlign: "center" },
});
