import { useState } from "react";
import { StyleSheet, View } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { router, useLocalSearchParams } from "expo-router";
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
  type Piece,
} from "../../../src/domain/closet";
import { mainColourName } from "../../../src/domain/color";
import { pieceCutout } from "../../../src/domain/cutout";
import { filesInUse } from "../../../src/domain/importing";
import { confirmEdits } from "../../../src/domain/recognition";
import { unlinkPiece } from "../../../src/domain/sets";
import { dropFromToday } from "../../../src/domain/today";
import { setArchived } from "../../../src/domain/wardrobe";
import { useDiscardChanges } from "../../../src/navigation/useDiscardChanges";
import { categoryName, kindName, t } from "../../../src/i18n";
import { useCloset } from "../../../src/state/closet";
import { canPrepareOnDevice, measurePiece } from "../../../src/state/imports";
import { studioAvailable, useStudioMaker } from "../../../src/state/studio";
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
  Tile,
} from "../../../src/ui";
import {
  PhotoToolbar,
  type PhotoView,
} from "../../../src/features/capture/PhotoToolbar";
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

export default function EditPiece() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { closet } = useCloset();
  const piece = closet.pieces.find((item) => item.id === id);
  if (!piece)
    return (
      <Screen
        title={t("piece.edit.title")}
        gone={{ title: t("piece.missing.title") }}
      />
    );
  return <Editor key={piece.id} piece={piece} />;
}

function Editor({ piece }: { piece: Piece }) {
  const { closet, update } = useCloset();
  const sample = piece.source === "sample";
  const [name, setName] = useState(piece.name);
  const [category, setCategory] = useState<Category>(piece.category);
  const [kind, setKind] = useState<GarmentKind | undefined>(piece.kind);
  const [photo, setPhoto] = useState(piece.photo);
  const [newPhoto, setNewPhoto] = useState<string | null>(null);
  const [leaveSet, setLeaveSet] = useState(false);
  const [more, setMore] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const studio = useStudioMaker();

  const categoryChanged = category !== piece.category;
  const kindMissing = categoryChanged && (!kind || !isOffered(kind));
  const dirty =
    name.trim() !== piece.name ||
    categoryChanged ||
    kind !== piece.kind ||
    photo !== piece.photo ||
    newPhoto !== null ||
    leaveSet;
  const allowClose = useDiscardChanges(dirty, busy);
  const valid = Boolean(name.trim()) && !kindMissing;

  const variantPiece = { ...piece, photo };
  const shown = newPhoto ? null : shownOf(piece, photo);
  const hasVariants = Boolean(pieceVariant(piece) || piece.original);
  const studioMade = Boolean(piece.variants?.studio);
  const cleanOffered = studioMade || studioAvailable;
  const cutout = pieceCutout(piece);
  const cutoutOffered =
    !sample && !newPhoto && canPrepareOnDevice && Boolean(cutout);

  const options = [
    piece.variants?.enhanced || piece.variants?.plain ? "cutout" : null,
    piece.original ? "original" : null,
    cleanOffered && studioSource(piece) ? "studio" : null,
  ].filter((option): option is PhotoView => option !== null);

  async function makeClean() {
    const source = studioSource(piece);
    if (!source || studio.making) return;
    const file = await studio.make(source, piece.id, {
      category,
      kind,
      name,
      colour: mainColourName(piece.colors),
    });
    if (!file) return;
    await update((current) => {
      const latest = current.pieces.find((item) => item.id === piece.id);
      return latest
        ? savePiece(current, {
            ...latest,
            variants: { ...latest.variants, studio: file },
          })
        : current;
    });
    setPhoto(file);
  }

  function pickShown(next: PhotoView) {
    if (next === "studio" && !studioMade) {
      void makeClean();
      return;
    }
    const file =
      next === "original"
        ? piece.original
        : next === "studio"
          ? piece.variants?.studio
          : (piece.variants?.enhanced ?? piece.variants?.plain);
    if (file) setPhoto(file);
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

  async function save() {
    if (!dirty || !valid || busy) return;
    setBusy(true);
    setError(null);
    let copied: string | null = null;
    try {
      const kept = newPhoto ? (copied = await keepPhoto(newPhoto)) : photo;
      const fixed = kind ? fixedStyles(kind) : undefined;
      const base: Piece = {
        ...piece,
        name: name.trim(),
        category,
        photo: kept,
        ...(kind ? { kind } : {}),
        ...(fixed ? { styles: fixed } : {}),
      };
      if (!kind) delete base.kind;
      if (categoryChanged) delete base.traits;
      if (newPhoto) {
        delete base.original;
        delete base.frame;
        delete base.colors;
        delete base.embedding;
        delete base.variants;
        delete base.cutoutArea;
      }
      if (leaveSet) delete base.setId;
      const confirmed = confirmEdits(piece, base);
      const next = categoryChanged
        ? { ...confirmed, ...fitAttributes(confirmed) }
        : confirmed;
      await update((current) => {
        const saved = savePiece(current, next);
        return leaveSet ? unlinkPiece(saved, piece.id) : saved;
      });
      if (newPhoto) {
        for (const file of new Set(leftovers(piece)))
          void discardPhoto(file).catch(() => undefined);
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
          error={error ?? studio.message}
        />
      }
      testID="piece-edit-screen"
    >
      <Tile
        image={newPhoto ? { uri: newPhoto } : variantPiece}
        size="hero"
        raw={Boolean(newPhoto) || shown === "original"}
        state={studio.making ? "preparing" : undefined}
        busyLabel={t("photo.cleanMaking")}
        accessibilityLabel={t("editor.photoPreview")}
        testID={studio.making ? "moment-generating" : "edit-hero"}
      />
      {sample ? (
        <Text role="subhead" tone="muted">
          {t("closet.sample")}
        </Text>
      ) : (
        <>
          {(hasVariants && !newPhoto && options.length) || cutoutOffered ? (
            <PhotoToolbar
              options={hasVariants && !newPhoto ? options : []}
              value={shown ?? "cutout"}
              onChange={(next) => {
                if (!busy) pickShown(next);
              }}
              adjust={
                cutoutOffered
                  ? {
                      label: cutout?.cutout
                        ? t("photo.adjust")
                        : t("cutout.byHand"),
                      disabled:
                        busy ||
                        (Boolean(cutout?.cutout) && shown === "original"),
                      testID: "edit-cutout",
                      onPress: () =>
                        router.push({
                          pathname: "/cutout/[id]",
                          params: { id: piece.id, target: "piece" },
                        }),
                    }
                  : null
              }
              making={studio.making}
              testID="edit-photo"
            />
          ) : null}
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
        </>
      )}
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
      <ChipRow
        label={t("piece.category")}
        options={categories.map((option) => ({
          id: option.id,
          label: categoryName(option.id),
        }))}
        value={category}
        onChange={(next) => {
          if (typeof next !== "string" || busy) return;
          setCategory(next as Category);
          setKind(next === piece.category ? piece.kind : undefined);
        }}
        testID="edit-category"
      />
      {categoryChanged ? (
        <View style={styles.group}>
          <ChipRow
            label={t("piece.kind")}
            options={kindsIn(category).map((option) => ({
              id: option.id,
              label: kindName(option.id),
            }))}
            value={kind ?? null}
            optional={sample}
            onChange={(next) => {
              if (busy) return;
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
      ) : null}
      {moreFacts(piece).length ? (
        <Expander
          id="edit-more"
          title={t("editor.moreDetails")}
          open={more}
          onToggle={() => setMore((open) => !open)}
          testID="edit-more"
        >
          <FactChips piece={piece} onChange={update} more />
        </Expander>
      ) : null}
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
            onPress={() => void putAway()}
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
    </Screen>
  );
}

const styles = StyleSheet.create({
  leading: { alignItems: "flex-start", gap: theme.space.sm },
  photoRow: { flexDirection: "row", flexWrap: "wrap", gap: theme.space.sm },
  group: { gap: theme.space.sm },
});
