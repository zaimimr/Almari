import { useState } from "react";
import { StyleSheet, View } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { router, useLocalSearchParams } from "expo-router";
import { getLocales } from "expo-localization";
import { fitAttributes } from "../../../src/domain/attributes";
import {
  categories,
  fixedStyles,
  isOffered,
  kindsIn,
  pieceVariant,
  removePiece,
  savePiece,
  studioSource,
  usedIn,
  type Category,
  type GarmentKind,
  type Closet,
  type Piece,
} from "../../../src/domain/closet";
import {
  colorName,
  colourNames,
  mainColourName,
} from "../../../src/domain/color";
import { setColour } from "../../../src/domain/facts";
import { pieceCutout } from "../../../src/domain/cutout";
import { filesInUse } from "../../../src/domain/importing";
import { confirmEdits } from "../../../src/domain/recognition";
import { unlinkPiece } from "../../../src/domain/sets";
import { dropFromToday } from "../../../src/domain/today";
import { defaultCurrency, setArchived } from "../../../src/domain/wardrobe";
import { useDiscardChanges } from "../../../src/navigation/useDiscardChanges";
import { categoryName, kindName, t } from "../../../src/i18n";
import { ColourChips } from "../../../src/features/ColourChips";
import { useCloset } from "../../../src/state/closet";
import { canPrepareOnDevice, measurePiece } from "../../../src/state/imports";
import { studioOffered, useStudioMaker } from "../../../src/state/studio";
import { discardPhoto, keepPhoto } from "../../../src/storage/local";
import { FactChips, moreFacts } from "../../../src/features/piece/FactChips";
import {
  Button,
  ChipRow,
  Expander,
  Field,
  Footer,
  ResultBar,
  Screen,
  Text,
} from "../../../src/ui";
import {
  PiecePhoto,
  type PhotoChoice,
  type PhotoView,
} from "../../../src/features/capture/PiecePhoto";
import { announce } from "../../../src/ui/announce";
import { confirmAction } from "../../../src/ui/confirm";
import { theme } from "../../../src/ui/theme";

function shownOf(piece: Piece, photo: string): PhotoView | null {
  const variants = piece.variants ?? {};
  if (variants.studio && photo === variants.studio) return "studio";
  if (variants.enhanced && photo === variants.enhanced) return "cutout";
  if (variants.plain && photo === variants.plain) return "cutout";
  if (piece.original && photo === piece.original) return "original";
  return null;
}

const leftovers = (piece: Piece) =>
  [
    piece.photo,
    piece.original,
    piece.variants?.enhanced,
    piece.variants?.plain,
    piece.variants?.studio,
  ].filter((file): file is string => Boolean(file));

const switchCategory = "switch-category";

const paletteColours = (piece: Piece) =>
  [
    ...new Set((piece.colors ?? []).map((swatch) => colorName(swatch.rgb))),
  ].slice(0, 5);

const paletteName = (piece: Piece) => {
  const main = mainColourName(piece.colors);
  return colourNames.find((option) => option.toLowerCase() === main) ?? null;
};

const priceText = (piece: Piece) =>
  piece.price ? String(piece.price.amount) : "";

const parsePrice = (text: string) => {
  const trimmed = text.trim().replace(",", ".");
  if (!trimmed) return null;
  const amount = Number(trimmed);
  return Number.isFinite(amount) && amount >= 0 ? amount : undefined;
};

export default function EditPiece() {
  const { id, more } = useLocalSearchParams<{ id: string; more?: string }>();
  const { closet } = useCloset();
  const piece = closet.pieces.find((item) => item.id === id);
  if (!piece)
    return (
      <Screen
        title={t("piece.edit.title")}
        gone={{ title: t("piece.missing.title") }}
      />
    );
  return <Editor key={piece.id} piece={piece} moreOpen={more === "1"} />;
}

function Editor({ piece, moreOpen }: { piece: Piece; moreOpen: boolean }) {
  const { closet, update } = useCloset();
  const sample = piece.source === "sample";
  const [name, setName] = useState(piece.name);
  const [category, setCategory] = useState<Category>(piece.category);
  const [kind, setKind] = useState<GarmentKind | undefined>(piece.kind);
  const [view, setView] = useState(() => shownOf(piece, piece.photo));
  const [shownPhoto, setShownPhoto] = useState(piece.photo);
  if (shownPhoto !== piece.photo) {
    setShownPhoto(piece.photo);
    setView(shownOf(piece, piece.photo));
  }
  const [newPhoto, setNewPhoto] = useState<string | null>(null);
  const [leaveSet, setLeaveSet] = useState(false);
  const [pickCategory, setPickCategory] = useState(false);
  const [kindConfirmed, setKindConfirmed] = useState(false);
  const [more, setMore] = useState(moreOpen);
  const [start] = useState(piece);
  const [facts, setFacts] = useState(piece);
  const [price, setPrice] = useState(priceText(piece));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const studio = useStudioMaker();

  const fileFor = (next: PhotoView) =>
    next === "original"
      ? piece.original
      : next === "studio"
        ? piece.variants?.studio
        : (piece.variants?.enhanced ?? piece.variants?.plain);
  const photo =
    view === null || view === shownOf(piece, piece.photo)
      ? piece.photo
      : (fileFor(view) ?? piece.photo);
  const categoryChanged = category !== piece.category;
  const kindMissing = categoryChanged && (!kind || !isOffered(kind));
  const amount = parsePrice(price);
  const dirty =
    facts !== start ||
    price.trim() !== priceText(piece) ||
    name.trim() !== piece.name ||
    categoryChanged ||
    kind !== piece.kind ||
    photo !== piece.photo ||
    newPhoto !== null ||
    kindConfirmed ||
    leaveSet;
  const allowClose = useDiscardChanges(dirty, busy);
  const valid = Boolean(name.trim()) && !kindMissing && amount !== undefined;

  const changeFacts = async (transform: (current: Closet) => Closet) => {
    const next = transform({
      ...closet,
      pieces: closet.pieces.map((item) =>
        item.id === piece.id ? facts : item,
      ),
    });
    setFacts(next.pieces.find((item) => item.id === piece.id) ?? facts);
  };
  const colour = paletteName(facts);
  const [colourFirst] = useState(() => paletteColours(piece));
  const owned = piece.source === "owned";
  const colourGuessed =
    owned && Boolean(colour) && facts.sources?.colour !== "confirmed";
  const kindGuessed =
    owned &&
    piece.sources?.kind === "proposed" &&
    !categoryChanged &&
    kind === piece.kind &&
    !kindConfirmed;

  const shown = newPhoto ? "original" : (shownOf(piece, photo) ?? "cutout");
  const hasVariants = Boolean(pieceVariant(piece) || piece.original);
  const studioMade = Boolean(piece.variants?.studio);
  const cleanOffered = studioMade || studioOffered();
  const cutout = pieceCutout(piece);
  const cutoutOffered =
    !sample && !newPhoto && canPrepareOnDevice && Boolean(cutout);
  const cutoutFile = piece.variants?.enhanced ?? piece.variants?.plain;
  const studioFrom = studioSource(piece);

  const choices: PhotoChoice[] = newPhoto
    ? [{ id: "original", image: piece, raw: true, uri: newPhoto }]
    : !hasVariants
      ? [{ id: "cutout", image: { ...piece, photo }, raw: false }]
      : [
          cutoutFile
            ? {
                id: "cutout",
                image: { ...piece, photo: cutoutFile },
                raw: false,
              }
            : null,
          piece.original
            ? {
                id: "original",
                image: { ...piece, photo: piece.original },
                raw: true,
              }
            : null,
          cleanOffered && studioFrom
            ? {
                id: "studio",
                image: {
                  ...piece,
                  photo: piece.variants?.studio ?? studioFrom,
                },
                raw: false,
              }
            : null,
        ].filter((choice): choice is PhotoChoice => choice !== null);

  async function makeClean() {
    const source = studioSource(piece);
    if (!source || studio.making) return;
    const before = piece.variants?.studio;
    const file = await studio.make(source, piece.id, {
      category,
      kind,
      name,
      colour: mainColourName(piece.colors),
    });
    if (!file) return;
    await update((current) => {
      const latest = current.pieces.find((item) => item.id === piece.id);
      if (!latest) return current;
      const { studioStale: _stale, ...rest } = latest;
      return savePiece(current, {
        ...rest,
        photo: latest.photo === before ? file : latest.photo,
        variants: { ...latest.variants, studio: file },
      });
    });
    if (before && before !== file)
      void discardPhoto(before).catch(() => undefined);
    setView("studio");
  }

  function pickShown(next: PhotoView) {
    if (busy) return;
    if (next === "studio" && !studioMade) {
      void makeClean();
      return;
    }
    if (fileFor(next)) setView(next);
  }

  async function pick(source: "camera" | "library") {
    setError(null);
    try {
      if (source === "camera") {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted) {
          setError(t("error.cameraOffOne"));
          return;
        }
      }
      const pickerOptions: ImagePicker.ImagePickerOptions = {
        mediaTypes: ["images"],
        quality: 0.9,
        allowsEditing: false,
        exif: false,
      };
      const result =
        source === "camera"
          ? await ImagePicker.launchCameraAsync(pickerOptions)
          : await ImagePicker.launchImageLibraryAsync(pickerOptions);
      const asset = result.assets?.[0];
      if (!result.canceled && asset) {
        setNewPhoto(asset.uri);
      }
    } catch {
      setError(t("common.photoOpenFailed"));
    }
  }

  async function save(archive = false) {
    if (busy || (!archive && (!dirty || !valid))) return;
    if (archive && !(dirty && valid)) {
      await putAway();
      return;
    }
    setBusy(true);
    setError(null);
    let copied: string | null = null;
    try {
      const kept = newPhoto ? (copied = await keepPhoto(newPhoto)) : photo;
      const fixed = kind ? fixedStyles(kind) : undefined;
      const { price: _price, ...rest } = {
        ...facts,
        original: piece.original,
        variants: piece.variants,
        cutoutArea: piece.cutoutArea,
        frame: piece.frame,
        studioStale: piece.studioStale,
      };
      const base: Piece = {
        ...rest,
        ...(amount === null || amount === undefined
          ? {}
          : {
              price: {
                amount,
                currency:
                  piece.price?.currency ??
                  getLocales()[0]?.currencyCode ??
                  defaultCurrency,
              },
            }),
        name: name.trim(),
        category,
        photo: kept,
        ...(kind ? { kind } : {}),
        ...(fixed ? { styles: fixed } : {}),
      };
      for (const key of [
        "original",
        "variants",
        "cutoutArea",
        "frame",
        "studioStale",
      ] as const)
        if (base[key] === undefined) delete base[key];
      if (!kind) delete base.kind;
      if (categoryChanged) delete base.traits;
      if (newPhoto) {
        delete base.original;
        delete base.frame;
        delete base.colors;
        delete base.embedding;
        delete base.variants;
        delete base.cutoutArea;
        delete base.studioStale;
      }
      if (leaveSet) delete base.setId;
      const edited = confirmEdits(piece, base);
      const confirmed =
        kindConfirmed && edited.kind === piece.kind
          ? {
              ...edited,
              sources: { ...edited.sources, kind: "confirmed" as const },
            }
          : edited;
      const next = categoryChanged
        ? { ...confirmed, ...fitAttributes(confirmed) }
        : confirmed;
      let inUse = new Set<string>();
      await update((current) => {
        const saved = savePiece(current, next);
        const linked = leaveSet ? unlinkPiece(saved, piece.id) : saved;
        const done = archive
          ? dropFromToday(setArchived(linked, piece.id, true), piece.id)
          : linked;
        inUse = filesInUse(done);
        return done;
      });
      if (archive) announce(t("result.putAway"));
      if (newPhoto) {
        for (const file of new Set(leftovers(piece)))
          if (!inUse.has(file)) void discardPhoto(file).catch(() => undefined);
        void measurePiece({ update }, next);
      }
      allowClose();
      router.back();
    } catch {
      if (copied) void discardPhoto(copied).catch(() => undefined);
      setError(t("common.error.save"));
    } finally {
      setBusy(false);
    }
  }

  async function putAway() {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      await update((current) =>
        dropFromToday(setArchived(current, piece.id, true), piece.id),
      );
      announce(t("result.putAway"));
      allowClose();
      router.back();
    } catch {
      setError(t("common.error.save"));
      setBusy(false);
    }
  }

  async function remove() {
    if (busy) return;
    const uses = usedIn(closet, piece.id);
    const confirmed = await confirmAction(
      t("editor.removeTitle"),
      uses
        ? uses === 1
          ? t("editor.removeUsedOne")
          : t("editor.removeUsedMany", { count: uses })
        : t("editor.removeBody"),
      t("common.remove"),
    );
    if (!confirmed) return;
    setBusy(true);
    try {
      let inUse = new Set<string>();
      await update((latest) => {
        const next = removePiece(unlinkPiece(latest, piece.id), piece.id);
        inUse = filesInUse(next);
        return next;
      });
      for (const file of new Set([...leftovers(piece), piece.label?.photo]))
        if (file && !inUse.has(file))
          void discardPhoto(file).catch(() => undefined);
      allowClose();
      router.dismissTo("/closet");
    } catch {
      setError(t("common.error.remove"));
      setBusy(false);
    }
  }

  return (
    <Screen
      title={t("piece.edit.title")}
      leading="cancel"
      onCancel={() => router.back()}
      footer={
        <Footer
          primary={{
            label: t("common.saveChanges"),
            onPress: () => void save(),
            disabled: !dirty || !valid,
            busy,
            testID: "edit-save",
          }}
          error={error}
        />
      }
      testID="piece-edit-screen"
    >
      <View style={styles.content}>
        <PiecePhoto
          choices={choices}
          value={shown}
          onChange={pickShown}
          making={studio.making}
          stale={Boolean(studioMade && piece.studioStale && !newPhoto)}
          onMake={() => void makeClean()}
          adjust={
            cutoutOffered
              ? {
                  label: cutout?.cutout
                    ? t("photo.adjust")
                    : t("cutout.byHand"),
                  disabled:
                    busy || (Boolean(cutout?.cutout) && shown === "original"),
                  testID: "edit-cutout",
                  onPress: () =>
                    router.push({
                      pathname: "/cutout/[id]",
                      params: { id: piece.id, target: "piece" },
                    }),
                }
              : null
          }
          message={studio.message}
          note={cleanOffered && !studioMade}
          disabled={busy}
          accessibilityLabel={t("editor.photoPreview")}
          heroID="edit-hero"
          testID="edit-photo"
        />
        {sample ? (
          <Text role="subhead" tone="muted">
            {t("closet.sample")}
          </Text>
        ) : null}
        <View style={styles.group}>
          {pickCategory ? (
            <ChipRow
              label={t("piece.category")}
              options={categories.map((option) => ({
                id: option.id,
                label: categoryName(option.id),
              }))}
              value={category}
              guessed={kindGuessed}
              onChange={(next) => {
                if (typeof next !== "string" || busy) return;
                if (next === category) {
                  setKindConfirmed(true);
                  return;
                }
                setCategory(next as Category);
                setKind(next === piece.category ? piece.kind : undefined);
              }}
              testID="edit-category"
            />
          ) : null}
          <ChipRow
            label={t("piece.kind")}
            options={[
              ...kindsIn(category).map((option) => ({
                id: option.id as string,
                label: kindName(option.id),
              })),
              ...(pickCategory
                ? []
                : [{ id: switchCategory, label: t("confirm.switchCategory") }]),
            ]}
            value={kind ?? null}
            optional={sample}
            guessed={kindGuessed}
            onChange={(next) => {
              if (busy) return;
              if (next === switchCategory) {
                setPickCategory(true);
                return;
              }
              if (next === kind) setKindConfirmed(true);
              setKind(
                typeof next === "string" ? (next as GarmentKind) : undefined,
              );
            }}
            testID="edit-kind"
          />
          {kindMissing && !sample ? (
            <Text role="footnote" tone="error">
              {t("piece.kindRequired")}
            </Text>
          ) : null}
        </View>
        <ColourChips
          label={t("fact.colour")}
          value={colour}
          first={colourFirst}
          guessed={colourGuessed}
          onPick={(next) => {
            if (busy) return;
            void changeFacts((current) => setColour(current, piece.id, next));
          }}
          testID="edit-colour"
        />
        <Field
          label={t("piece.name")}
          placeholder={t("editor.nameHint")}
          value={name}
          onChangeText={setName}
          maxLength={80}
          editable={!busy}
          returnKeyType="done"
          testID="edit-name"
        />
        {sample ? null : (
          <View style={styles.photoRow}>
            <Button
              variant="secondary"
              icon="camera"
              label={t("common.takePhoto")}
              disabled={busy}
              testID="edit-take-photo"
              onPress={() => void pick("camera")}
            />
            <Button
              variant="secondary"
              icon="photo.on.rectangle"
              label={t("common.choosePhoto")}
              disabled={busy}
              testID="edit-choose-photo"
              onPress={() => void pick("library")}
            />
          </View>
        )}
        {moreFacts(facts).length ? (
          <Expander
            id="edit-more"
            title={t("editor.moreDetails")}
            open={more}
            onToggle={() => setMore((open) => !open)}
            testID="edit-more"
          >
            <FactChips piece={facts} onChange={changeFacts} more />
          </Expander>
        ) : null}
        {sample ? null : (
          <Field
            label={t("piece.edit.price")}
            value={price}
            onChangeText={setPrice}
            keyboardType="decimal-pad"
            maxLength={10}
            editable={!busy}
            error={amount === undefined ? t("piece.edit.priceInvalid") : null}
            testID="edit-price"
          />
        )}
        {piece.setId ? (
          leaveSet ? (
            <ResultBar
              text={t("sets.removed")}
              focus
              testID="edit-set-removed"
              action={{
                label: t("common.undo"),
                onPress: () => setLeaveSet(false),
              }}
            />
          ) : (
            <View style={styles.leading}>
              <Button
                variant="quiet"
                label={t("sets.remove")}
                disabled={busy}
                testID="edit-leave-set"
                onPress={() => setLeaveSet(true)}
              />
            </View>
          )
        ) : null}
        <View style={styles.leading}>
          {piece.status === "archived" ? null : (
            <Button
              variant="quiet"
              icon="archivebox"
              label={t("closet.putAwayAction")}
              disabled={busy}
              testID="edit-put-away"
              onPress={() => void save(true)}
            />
          )}
          <Button
            variant="destructive"
            label={t("editor.remove")}
            disabled={busy}
            testID="edit-remove"
            onPress={() => void remove()}
          />
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: theme.space.lg },
  leading: { alignItems: "flex-start", gap: theme.space.sm },
  photoRow: { flexDirection: "row", flexWrap: "wrap", gap: theme.space.sm },
  group: { gap: theme.space.sm },
});
