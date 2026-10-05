import { useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { randomUUID } from "expo-crypto";
import { router } from "expo-router";
import { productLink } from "../../src/domain/link";
import { queueImport } from "../../src/domain/importing";
import { linkFromPage } from "../../src/domain/productLink";
import type { ProductPage } from "../../src/domain/productPage";
import { t } from "../../src/i18n";
import { useCloset } from "../../src/state/closet";
import { now } from "../../src/state/clock";
import { keepShopPhoto, readShop } from "../../src/state/productLink";
import { isOffline } from "../../src/state/studio";
import { discardPhoto } from "../../src/storage/local";
import { Field, Footer, Screen, Section, Tile } from "../../src/ui";
import { theme } from "../../src/ui/theme";

export default function AddFromLink() {
  const { update } = useCloset();
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stuck, setStuck] = useState(false);
  const [page, setPage] = useState<ProductPage | null>(null);
  const [cover, setCover] = useState<string | null>(null);
  const link = productLink(text);

  async function read() {
    if (!link) return null;
    const result = await readShop(link);
    if ("error" in result) {
      setError(t(result.error));
      setStuck(result.error !== "common.offline");
      return null;
    }
    if (result.page.images.length > 1) {
      setPage(result.page);
      setCover(result.page.images[0]!);
      return null;
    }
    return result.page;
  }

  async function add() {
    if (!link || busy) return;
    setBusy(true);
    setError(null);
    setStuck(false);
    let source: string | null = null;
    try {
      const product = page ?? (await read());
      if (!product) return;
      const image = cover ?? product.images[0]!;
      const id = randomUUID();
      source = await keepShopPhoto(image, `${id}-original`);
      const stored = source;
      await update((current) =>
        queueImport(current, {
          id,
          source: stored,
          createdAt: now().toISOString(),
          fromLink: true,
          ...(product.name ? { linkName: product.name } : {}),
          link: linkFromPage(product, now().toISOString()),
        }),
      );
      router.back();
    } catch {
      if (source) void discardPhoto(source).catch(() => undefined);
      const offline = await isOffline();
      setError(t(offline ? "common.offline" : "link.blocked"));
      setStuck(!offline);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen
      title={t("link.title")}
      footer={
        <Footer
          waiting={!link}
          error={error}
          primary={{
            label: t("common.add"),
            onPress: () => void add(),
            busy,
            testID: "link-add",
          }}
          secondary={
            stuck
              ? {
                  label: t("capture.byHand"),
                  onPress: () => router.replace("/piece/new"),
                  testID: "link-by-hand",
                }
              : undefined
          }
        />
      }
      testID="link-screen"
    >
      <View style={styles.content}>
        <Field
          label={t("link.field")}
          value={text}
          onChangeText={(value) => {
            setText(value);
            setError(null);
            setStuck(false);
            setPage(null);
            setCover(null);
          }}
          autoCapitalize="none"
          autoCorrect={false}
          autoFocus
          keyboardType="url"
          returnKeyType="go"
          onSubmitEditing={() => void add()}
          testID="link-field"
        />
        {page ? (
          <Section title={t("link.piecePhoto")} testID="link-photos">
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.scroller}
              contentContainerStyle={styles.tiles}
            >
              {page.images.map((photo, index) => (
                <View key={photo} style={styles.tile}>
                  <Tile
                    image={{ uri: photo }}
                    size="strip"
                    raw
                    selected={cover === photo}
                    selectedLabel={t("tile.selected")}
                    accessibilityLabel={t("link.photo", { number: index + 1 })}
                    onPress={() => setCover(photo)}
                    testID={`link-photo-${index}`}
                  />
                </View>
              ))}
            </ScrollView>
          </Section>
        ) : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: theme.space.lg },
  scroller: { marginRight: -theme.space.lg },
  tiles: { flexDirection: "row", gap: theme.space.md },
  tile: { width: 112 },
});
