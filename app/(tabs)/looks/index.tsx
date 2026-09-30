import { FlatList, Pressable, StyleSheet, View } from "react-native";
import { Stack, router } from "expo-router";
import { useCloset } from "../../../src/state/closet";
import { piecesForLook } from "../../../src/domain/closet";
import {
  AppText,
  Button,
  HeaderAction,
  Message,
  OutfitCollage,
} from "../../../src/ui";
import { addPiecesRoute } from "../../../src/state/imports";
import { theme } from "../../../src/ui/theme";

export default function LooksScreen() {
  const { closet } = useCloset();
  return (
    <View style={styles.screen}>
      <Stack.Screen
        options={{
          headerRight: () => (
            <HeaderAction
              label="Build a look"
              onPress={() => router.push("/look/build")}
            />
          ),
        }}
      />
      <FlatList
        data={closet.looks}
        keyExtractor={(look) => look.id}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <AppText muted style={styles.intro}>
            Good combinations, kept for another day.
          </AppText>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Message
              title="Keep a look you love."
              description={
                closet.pieces.length
                  ? "Bring a few pieces together and save the combination. It will be here when you need it."
                  : "Add a few pieces to your closet, then bring them together in your first outfit."
              }
              action={
                <Button
                  label={
                    closet.pieces.length
                      ? "Build your first look"
                      : "Add a piece"
                  }
                  onPress={() =>
                    router.push(
                      closet.pieces.length ? "/look/build" : addPiecesRoute,
                    )
                  }
                />
              }
            />
          </View>
        }
        renderItem={({ item }) => {
          const pieces = piecesForLook(closet, item);
          const missing = item.pieceIds.length - pieces.length;
          return (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Open ${item.name}`}
              style={styles.look}
              onPress={() =>
                router.push({ pathname: "/look/[id]", params: { id: item.id } })
              }
            >
              <OutfitCollage pieces={pieces} />
              <AppText variant="heading">{item.name}</AppText>
              <AppText variant="caption" muted>
                {missing
                  ? `${missing} ${missing === 1 ? "piece is" : "pieces are"} no longer in your closet`
                  : `${pieces.length} ${pieces.length === 1 ? "piece" : "pieces"} from your closet`}
              </AppText>
            </Pressable>
          );
        }}
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
  intro: { paddingBottom: 32 },
  empty: { paddingVertical: 56 },
  look: {
    gap: 8,
    marginBottom: 32,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderColor: theme.colors.line,
  },
});
