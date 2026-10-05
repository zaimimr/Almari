import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { randomUUID } from "expo-crypto";
import { router } from "expo-router";
import {
  imageExtension,
  productFromPage,
  productLink,
} from "../../src/domain/link";
import { queueImport } from "../../src/domain/importing";
import { t } from "../../src/i18n";
import { useCloset } from "../../src/state/closet";
import { now } from "../../src/state/clock";
import { isOffline } from "../../src/state/studio";
import { discardPhoto, keepPhotoBytes } from "../../src/storage/local";
import { Field, Footer, Screen } from "../../src/ui";
import { theme } from "../../src/ui/theme";

const linkTimeout = 20000;

async function download(url: string, accept: string) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), linkTimeout);
  try {
    const response = await fetch(url, {
      headers: { Accept: accept },
      signal: controller.signal,
    });
    if (!response.ok) throw new Error("failed");
    return response;
  } finally {
    clearTimeout(timer);
  }
}

export default function AddFromLink() {
  const { update } = useCloset();
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const link = productLink(text);

  async function add() {
    if (!link || busy) return;
    setBusy(true);
    setError(null);
    let source: string | null = null;
    try {
      const page = await download(link, "text/html");
      const product = productFromPage(await page.text(), page.url || link);
      if (!product) {
        setError(t("link.failed"));
        return;
      }
      const image = await download(product.image, "image/*");
      const bytes = new Uint8Array(await image.arrayBuffer());
      if (!bytes.length) throw new Error("failed");
      const id = randomUUID();
      source = await keepPhotoBytes(
        bytes,
        `${id}-original${imageExtension(image.headers.get("content-type"), product.image)}`,
      );
      const stored = source;
      await update((current) =>
        queueImport(current, {
          id,
          source: stored,
          createdAt: now().toISOString(),
          ...(product.name ? { linkName: product.name } : {}),
        }),
      );
      router.back();
    } catch {
      if (source) void discardPhoto(source).catch(() => undefined);
      setError(t((await isOffline()) ? "common.offline" : "link.failed"));
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
          }}
          autoCapitalize="none"
          autoCorrect={false}
          autoFocus
          keyboardType="url"
          returnKeyType="go"
          onSubmitEditing={() => void add()}
          testID="link-field"
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: theme.space.lg },
});
