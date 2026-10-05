import { useState } from "react";
import { Alert, Linking, ScrollView, StyleSheet, View } from "react-native";
import { randomUUID } from "expo-crypto";
import { router, useLocalSearchParams } from "expo-router";
import { savePiece, type Piece } from "../../../src/domain/closet";
import { filesInUse, pieceFiles } from "../../../src/domain/importing";
import { productLink } from "../../../src/domain/link";
import {
  linkFromPage,
  linkHost,
  withoutProductLink,
  withProductLink,
  type ProductLink,
} from "../../../src/domain/productLink";
import type { ProductPage } from "../../../src/domain/productPage";
import { isSamplePhoto } from "../../../src/domain/samples";
import { listName, locale, t } from "../../../src/i18n";
import { useDiscardChanges } from "../../../src/navigation/useDiscardChanges";
import { fibreLabel } from "../../../src/state/careLabel";
import { useCloset } from "../../../src/state/closet";
import { now } from "../../../src/state/clock";
import { measurePiece } from "../../../src/state/imports";
import { keepShopPhoto, readShop } from "../../../src/state/productLink";
import { discardPhoto, photoUri } from "../../../src/storage/local";
import {
  Button,
  ChipRow,
  Field,
  Footer,
  Row,
  Rows,
  Screen,
  Section,
  Silk,
  Tile,
} from "../../../src/ui";
import { confirmAction } from "../../../src/ui/confirm";
import { theme } from "../../../src/ui/theme";

function materialsLine(link: ProductLink): string | undefined {
  if (!link.materials?.length) return undefined;
  const percent = new Intl.NumberFormat(locale, { style: "percent" });
  return listName(
    link.materials.map((material) =>
      material.percent === null
        ? fibreLabel(material.fibre)
        : t("careLabel.fibreItem", {
            percent: percent.format(material.percent / 100),
            fibre: fibreLabel(material.fibre).toLocaleLowerCase(locale),
          }),
    ),
  );
}

function priceLine(link: ProductLink) {
  if (!link.price) return undefined;
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: link.price.currency,
    maximumFractionDigits: Number.isInteger(link.price.amount) ? 0 : 2,
  }).format(link.price.amount);
}

export default function ProductLinkScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { closet } = useCloset();
  const piece = closet.pieces.find((item) => item.id === id);
  if (!piece)
    return (
      <Screen
        title={t("link.field")}
        gone={{ title: t("piece.missing.title") }}
      />
    );
  return <LinkEditor piece={piece} />;
}

function LinkEditor({ piece }: { piece: Piece }) {
  const { update } = useCloset();
  const saved = piece.link;
  const [text, setText] = useState(saved?.url ?? "");
  const [page, setPage] = useState<ProductPage | null>(null);
  const [kept, setKept] = useState<string[]>(saved?.photos ?? []);
  const [cover, setCover] = useState<string | null>(null);
  const [size, setSize] = useState<string | null>(saved?.size ?? null);
  const [sizeChosen, setSizeChosen] = useState(false);
  const [reading, setReading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const url = productLink(text);
  const link: ProductLink | undefined = page
    ? linkFromPage(page, now().toISOString())
    : saved;
  const photos = page ? page.images : (saved?.photos ?? []);
  const dirty =
    page !== null ||
    cover !== null ||
    size !== (saved?.size ?? null) ||
    JSON.stringify(kept) !== JSON.stringify(saved?.photos ?? []);
  const allowClose = useDiscardChanges(dirty, busy || reading);

  async function read() {
    if (!url || reading) return;
    setReading(true);
    setError(null);
    const result = await readShop(url);
    setReading(false);
    if ("error" in result) {
      setError(t(result.error));
      return;
    }
    setPage(result.page);
    setText(result.page.url);
    setKept([]);
    setCover(null);
    if (!sizeChosen) setSize(result.page.size ?? saved?.size ?? null);
  }

  function choose(photo: string, index: number) {
    const keptNow = kept.includes(photo);
    Alert.alert(t("link.photo", { number: index + 1 }), undefined, [
      {
        text: t("link.usePhoto"),
        onPress: () => {
          setCover(photo);
          setKept((current) => current.filter((item) => item !== photo));
        },
      },
      {
        text: keptNow ? t("link.dropPhoto") : t("link.keepPhoto"),
        onPress: () => {
          if (cover === photo) setCover(null);
          setKept((current) =>
            keptNow
              ? current.filter((item) => item !== photo)
              : [...current, photo],
          );
        },
      },
      { text: t("common.cancel"), style: "cancel" },
    ]);
  }

  async function save() {
    if (!link || busy || !dirty) return;
    setBusy(true);
    setError(null);
    const fetched: string[] = [];
    try {
      const local = async (photo: string) => {
        if (!/^https?:/i.test(photo)) return photo;
        const file = await keepShopPhoto(photo, `${piece.id}-${randomUUID()}`);
        fetched.push(file);
        return file;
      };
      const coverFile = cover ? await local(cover) : null;
      const photoFiles = await Promise.all(kept.map(local));
      const { photos: _photos, size: _size, ...rest } = link;
      const nextLink: ProductLink = {
        ...rest,
        ...(size ? { size } : {}),
        ...(photoFiles.length ? { photos: photoFiles } : {}),
      };
      const base: Piece = coverFile
        ? { ...piece, photo: coverFile }
        : { ...piece };
      if (coverFile)
        for (const key of [
          "original",
          "frame",
          "colors",
          "embedding",
          "variants",
          "cutoutArea",
          "studioStale",
        ] as const)
          delete base[key];
      const next = page
        ? withProductLink(base, nextLink)
        : { ...base, link: nextLink };
      let after = null as ReturnType<typeof savePiece> | null;
      await update((current) => (after = savePiece(current, next)));
      discardUnused(piece, after);
      if (coverFile) void measurePiece({ update }, next);
      allowClose();
      router.back();
    } catch {
      for (const file of fetched)
        void discardPhoto(file).catch(() => undefined);
      setError(t("common.error.save"));
      setBusy(false);
    }
  }

  async function remove() {
    if (!saved || busy) return;
    const confirmed = await confirmAction(
      t("link.removeTitle"),
      "",
      t("link.remove"),
    );
    if (!confirmed) return;
    setBusy(true);
    try {
      let after = null as ReturnType<typeof savePiece> | null;
      await update(
        (current) => (after = savePiece(current, withoutProductLink(piece))),
      );
      discardUnused(piece, after);
      allowClose();
      router.back();
    } catch {
      setError(t("common.error.save"));
      setBusy(false);
    }
  }

  const sizes = link?.sizes ?? [];
  const details = link
    ? [
        {
          key: "madeOf",
          title: t("careLabel.madeOf"),
          meta: materialsLine(link),
        },
        { key: "brand", title: t("careLabel.brand"), value: link.brand },
        { key: "colour", title: t("fact.colour"), value: link.colour },
        { key: "price", title: t("piece.edit.price"), value: priceLine(link) },
        { key: "care", title: t("link.care"), meta: link.care?.join("\n") },
      ].filter((row) => row.meta || row.value)
    : [];

  return (
    <Screen
      title={t("link.field")}
      leading="cancel"
      onCancel={() => router.back()}
      footer={
        <Footer
          primary={{
            label: t("common.save"),
            onPress: () => void save(),
            busy,
            disabled: !dirty || reading || !link,
            testID: "product-link-save",
          }}
          error={error}
        />
      }
      testID="product-link-screen"
    >
      <Field
        label={t("link.field")}
        value={text}
        onChangeText={(value) => {
          setText(value);
          setError(null);
        }}
        autoCapitalize="none"
        autoCorrect={false}
        autoFocus={!saved}
        keyboardType="url"
        returnKeyType="go"
        onSubmitEditing={() => void read()}
        testID="product-link-field"
      />
      <View style={styles.leading}>
        <Button
          variant="secondary"
          label={saved || page ? t("link.readAgain") : t("link.read")}
          disabled={!url || reading || busy}
          busy={reading}
          onPress={() => void read()}
          testID="product-link-read"
        />
      </View>
      {reading ? (
        <View testID="moment-generating">
          <Silk kind="placeholder" shape="tile" label={t("link.reading")} />
        </View>
      ) : null}
      {!reading && photos.length ? (
        <Section title={t("link.photos")} testID="product-link-photos">
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.scroller}
            contentContainerStyle={styles.tiles}
          >
            {photos.map((photo, index) => (
              <View key={photo} style={styles.tile}>
                <Tile
                  image={{
                    uri: /^https?:/i.test(photo) ? photo : photoUri(photo),
                  }}
                  size="strip"
                  raw
                  label={cover === photo ? t("link.piecePhoto") : undefined}
                  selected={cover === photo || kept.includes(photo)}
                  selectedLabel={t("tile.selected")}
                  accessibilityLabel={t("link.photo", { number: index + 1 })}
                  onPress={() => choose(photo, index)}
                  testID={`product-link-photo-${index}`}
                />
              </View>
            ))}
          </ScrollView>
        </Section>
      ) : null}
      {!reading && sizes.length ? (
        <ChipRow
          label={t("link.yourSize")}
          options={sizes.map((item) => ({ id: item, label: item }))}
          value={size}
          optional
          guessed={Boolean(size) && !sizeChosen && size === page?.size}
          onChange={(next) => {
            setSize(typeof next === "string" ? next : null);
            setSizeChosen(true);
          }}
          testID="product-link-size"
        />
      ) : null}
      {!reading && link ? (
        <Rows>
          {details.map((row) => (
            <Row
              key={row.key}
              title={row.title}
              meta={row.meta}
              trailing={row.value ? { value: row.value } : undefined}
              testID={`product-link-${row.key}`}
            />
          ))}
          <Row
            title={t("link.open")}
            meta={linkHost(link.url)}
            trailing="chevron"
            onPress={() => void Linking.openURL(link.url)}
            testID="product-link-open"
          />
        </Rows>
      ) : null}
      {saved ? (
        <View style={styles.leading}>
          <Button
            variant="destructive"
            label={t("link.remove")}
            disabled={busy || reading}
            onPress={() => void remove()}
            testID="product-link-remove"
          />
        </View>
      ) : null}
    </Screen>
  );
}

function discardUnused(
  before: Piece,
  after: ReturnType<typeof savePiece> | null,
) {
  if (!after) return;
  const inUse = filesInUse(after);
  for (const file of new Set(pieceFiles(before)))
    if (file && !inUse.has(file) && !isSamplePhoto(file))
      void discardPhoto(file).catch(() => undefined);
}

const styles = StyleSheet.create({
  leading: { alignItems: "flex-start" },
  scroller: { marginRight: -theme.space.lg },
  tiles: { flexDirection: "row", gap: theme.space.md },
  tile: { width: 112 },
});
