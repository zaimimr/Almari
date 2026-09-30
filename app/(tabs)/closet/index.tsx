import { useState } from "react";
import { FlatList, StyleSheet, View } from "react-native";
import { Stack, router } from "expo-router";
import { useCloset } from "../../../src/state/closet";
import { type Category } from "../../../src/domain/closet";
import {
  AppText,
  Button,
  Field,
  Filters,
  HeaderAction,
  Message,
  PieceTile,
} from "../../../src/ui";
import { theme } from "../../../src/ui/theme";

export default function ClosetScreen() {
  const { closet } = useCloset();
  const [category, setCategory] = useState<Category | "all">("all");
  const [search, setSearch] = useState("");
  const sampleCount = closet.pieces.filter(
    (piece) => piece.source === "sample",
  ).length;
  const filtered = closet.pieces.filter(
    (piece) =>
      (category === "all" || piece.category === category) &&
      piece.name.toLowerCase().includes(search.trim().toLowerCase()),
  );

  return (
    <View style={styles.screen}>
      <Stack.Screen
        options={{
          headerRight: () => (
            <HeaderAction
              label="Add piece"
              onPress={() => router.push("/piece/new")}
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
        ListHeaderComponent={
          <View style={styles.intro}>
            <AppText muted>
              {closet.pieces.length === 0
                ? "A little space for the pieces you love."
                : `${closet.pieces.length} ${closet.pieces.length === 1 ? "piece" : "pieces"}, ready for a new combination.`}
            </AppText>
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
                <Filters value={category} onChange={setCategory} />
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
                onPress={() => router.push("/piece/new")}
              />
              <AppText variant="caption" muted style={styles.note}>
                Your closet is saved on this device.
              </AppText>
            </View>
          ) : (
            <Message
              title="No pieces found"
              description="Try another name or category."
              action={
                <Button
                  label="Clear filters"
                  secondary
                  onPress={() => {
                    setSearch("");
                    setCategory("all");
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
              onPress={() =>
                router.push({
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
