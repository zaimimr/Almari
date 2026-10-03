import { FlatList, Pressable, StyleSheet, View } from "react-native";
import { Stack, router } from "expo-router";
import { useCloset } from "../../../src/state/closet";
import { lookEntries } from "../../../src/domain/looks";
import { locale, occasionName, t } from "../../../src/i18n";
import {
  AppText,
  Button,
  HeaderAction,
  Message,
  OutfitCollage,
} from "../../../src/ui/legacy";
import { addPiecesRoute } from "../../../src/state/imports";
import { theme } from "../../../src/ui/theme";
import { useLargeText } from "../../../src/ui/useLargeText";
import { largeTitleOptions } from "../../../src/navigation/options";

export default function LooksScreen() {
  const { closet } = useCloset();
  const { fontScale, bold } = useLargeText();
  const entries = lookEntries(closet, locale);
  return (
    <View style={styles.screen}>
      <Stack.Screen
        options={{
          ...largeTitleOptions(fontScale, bold),
          title: t("title.yourLooks"),
          headerRight: () => (
            <HeaderAction
              label={t("title.buildLook")}
              onPress={() => router.push("/look/build")}
            />
          ),
        }}
      />
      <FlatList
        data={entries}
        keyExtractor={(look) => look.id}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <AppText muted style={styles.intro}>
            {t("looksTab.intro")}
          </AppText>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Message
              title={t("looksTab.emptyTitle")}
              description={
                closet.pieces.length
                  ? t("looksTab.emptyWithPieces")
                  : t("looksTab.emptyNoPieces")
              }
              action={
                <Button
                  label={
                    closet.pieces.length
                      ? t("looksTab.buildFirst")
                      : t("capture.addPiece")
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
          const pieces = item.pieceIds.flatMap((id) => {
            const piece = closet.pieces.find((each) => each.id === id);
            return piece ? [piece] : [];
          });
          const missing = item.pieceIds.length - pieces.length;
          const about = [
            item.occasion ? occasionName(item.occasion) : null,
            item.saved ? null : t("looks.worn"),
          ]
            .filter(Boolean)
            .join(" · ");
          return (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t("looks.open", { name: item.name })}
              style={styles.look}
              onPress={() =>
                item.saved
                  ? router.push({
                      pathname: "/look/[id]",
                      params: { id: item.id },
                    })
                  : router.push({
                      pathname: "/look/build",
                      params: {
                        pieces: item.pieceIds.join(","),
                        name: item.name,
                        ...(item.occasion ? { occasion: item.occasion } : {}),
                      },
                    })
              }
            >
              <OutfitCollage pieces={pieces} />
              <AppText variant="title">{item.name}</AppText>
              {about ? <AppText muted>{about}</AppText> : null}
              <AppText variant="footnote" muted>
                {missing
                  ? missing === 1
                    ? t("looksTab.missingOne")
                    : t("looksTab.missingMany", { count: missing })
                  : pieces.length === 1
                    ? t("looksTab.countOne")
                    : t("looksTab.countMany", { count: pieces.length })}
              </AppText>
            </Pressable>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.colors.canvas },
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
