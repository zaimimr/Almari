import { useState } from "react";
import { Platform, Pressable, StyleSheet, View } from "react-native";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { randomUUID } from "expo-crypto";
import { Stack, router } from "expo-router";
import {
  type Piece,
  type Category,
  type GarmentKind,
  type Style,
  categories,
  fixedStyles,
  isOffered,
  kindsIn,
  styleOptions,
  savePiece,
  removePiece,
  usedIn,
} from "../domain/closet";
import {
  confirmAttribute,
  fitAttributes,
  withDetails,
} from "../domain/attributes";
import { confirmEdits } from "../domain/recognition";
import { categoryName, kindName, styleName, stylesName, t } from "../i18n";
import { useCloset } from "../state/closet";
import { measurePiece } from "../state/imports";
import { keepPhoto, discardPhoto } from "../storage/local";
import { photoSource } from "../ui/photos";
import {
  AppText,
  Button,
  Chip,
  ErrorMessage,
  Field,
  FormScreen,
  HeaderAction,
} from "../ui";
import { theme } from "../ui/theme";
import { confirmAction } from "../ui/confirm";
import { useDiscardChanges } from "../navigation/useDiscardChanges";
import { AttributeEditor } from "./AttributeEditor";

export function PieceEditor({ piece }: { piece?: Piece }) {
  const { closet, update } = useCloset();
  const [id] = useState(() => piece?.id ?? randomUUID());
  const [name, setName] = useState(piece?.name ?? "");
  const [category, setCategory] = useState<Category | null>(
    piece?.category ?? null,
  );
  const [kind, setKind] = useState<GarmentKind | undefined>(piece?.kind);
  const [worn, setWorn] = useState<Style[] | undefined>(piece?.styles);
  const [image, setImage] = useState<string | null>(piece?.photo ?? null);
  const [newImage, setNewImage] = useState(false);
  const [details, setDetails] = useState<Pick<Piece, "attributes" | "sources">>(
    { attributes: piece?.attributes, sources: piece?.sources },
  );
  const describes = piece?.source !== "sample";
  const described = category
    ? fitAttributes({ category, kind, ...details })
    : null;
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dirty =
    name !== (piece?.name ?? "") ||
    category !== (piece?.category ?? null) ||
    kind !== piece?.kind ||
    JSON.stringify(worn) !== JSON.stringify(piece?.styles) ||
    JSON.stringify(details) !==
      JSON.stringify({
        attributes: piece?.attributes,
        sources: piece?.sources,
      }) ||
    newImage;
  const kindOptions = category ? kindsIn(category) : [];
  const fixed = kind ? fixedStyles(kind) : undefined;
  const needsKind = (piece?.source ?? "owned") === "owned";
  const kindMissing = needsKind && (!kind || !isOffered(kind));
  const allowClose = useDiscardChanges(dirty, busy);

  async function pick(source: "camera" | "library") {
    setError(null);
    try {
      if (source === "camera") {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted) {
          setError(
            "Camera access is off. You can choose a photo, or enable camera access in Settings.",
          );
          return;
        }
      }
      const options: ImagePicker.ImagePickerOptions = {
        mediaTypes: ["images"],
        quality: 0.9,
        allowsEditing: false,
        exif: false,
      };
      const result =
        source === "camera"
          ? await ImagePicker.launchCameraAsync(options)
          : await ImagePicker.launchImageLibraryAsync(options);
      const asset = result.assets?.[0];
      if (!result.canceled && asset) {
        setImage(asset.uri);
        setNewImage(true);
      }
    } catch {
      setError("The photo could not be opened. Please choose it again.");
    }
  }

  async function save() {
    if (!image || !category || !name.trim() || kindMissing || busy) return;
    setBusy(true);
    setError(null);
    let copiedPhoto: string | null = null;
    try {
      const photo = newImage
        ? (copiedPhoto = await keepPhoto(image))
        : piece!.photo;
      const chosenStyles = fixed ?? worn;
      const base: Piece = {
        id,
        name,
        category,
        photo,
        createdAt: piece?.createdAt ?? new Date().toISOString(),
        source: piece?.source ?? "owned",
        ...(kind ? { kind } : {}),
        ...(chosenStyles?.length ? { styles: chosenStyles } : {}),
        ...(piece?.traits && category === piece.category
          ? { traits: piece.traits }
          : {}),
        ...(!newImage && piece?.original ? { original: piece.original } : {}),
        ...(!newImage && piece?.frame ? { frame: piece.frame } : {}),
        ...(!newImage && piece?.colors ? { colors: piece.colors } : {}),
        ...(!newImage && piece?.embedding
          ? { embedding: piece.embedding }
          : {}),
        ...(piece?.status ? { status: piece.status } : {}),
        ...(piece?.away ? { away: piece.away } : {}),
      };
      const confirmed = confirmEdits(piece, base);
      await update((current) =>
        savePiece(
          current,
          describes ? withDetails(confirmed, details) : confirmed,
        ),
      );
      if (piece && newImage)
        void discardPhoto(piece.photo).catch(() => undefined);
      if (newImage) void measurePiece({ update }, confirmed);
      allowClose();
      router.back();
    } catch {
      if (copiedPhoto) void discardPhoto(copiedPhoto).catch(() => undefined);
      setError(
        "This piece could not be saved. Check that your device has free space, then try again.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!piece || busy) return;
    const uses = usedIn(closet, piece.id);
    const confirmed = await confirmAction(
      "Remove this piece?",
      uses
        ? `It appears in ${uses} saved ${uses === 1 ? "look" : "looks"}. Those looks will show that this piece is missing.`
        : "This removes the piece and its closet photo from this device.",
      "Remove",
    );
    if (!confirmed) return;
    setBusy(true);
    try {
      await update((current) => removePiece(current, piece.id));
      void discardPhoto(piece.photo).catch(() => undefined);
      if (piece.original && piece.original !== piece.photo)
        void discardPhoto(piece.original).catch(() => undefined);
      allowClose();
      router.dismissTo("/closet");
    } catch {
      setError("This piece could not be removed. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <FormScreen>
      <Stack.Screen
        options={{
          title: piece ? t("piece.edit.title") : "Add a piece",
          headerLeft: () => (
            <HeaderAction
              label={piece ? "Back" : "Cancel"}
              onPress={() => router.back()}
            />
          ),
        }}
      />
      <View style={[styles.photo, image && styles.photoWithImage]}>
        {image ? (
          <Image
            source={newImage ? { uri: image } : photoSource(image)}
            style={styles.image}
            contentFit="contain"
            accessibilityLabel="Clothing photo preview"
          />
        ) : (
          <View style={styles.photoHint}>
            <AppText variant="heading">Start with a photo.</AppText>
            <AppText muted style={styles.hint}>
              A clear photo in natural light helps you see the colors you love.
            </AppText>
          </View>
        )}
      </View>
      <View style={styles.actions}>
        <View style={styles.action}>
          <Button
            label={image ? "Change photo" : "Choose a photo"}
            secondary
            disabled={busy}
            onPress={() => {
              void pick("library");
            }}
          />
        </View>
        {Platform.OS !== "web" ? (
          <View style={styles.action}>
            <Button
              label="Take a photo"
              secondary
              disabled={busy}
              onPress={() => {
                void pick("camera");
              }}
            />
          </View>
        ) : null}
      </View>
      <Field
        label="Name"
        testID="piece-name"
        placeholder="e.g. Mauve chiffon hijab"
        value={name}
        onChangeText={setName}
        maxLength={80}
        editable={!busy}
        returnKeyType="done"
      />
      <View style={styles.categorySection}>
        <AppText style={styles.label}>{t("piece.category")}</AppText>
        <View style={styles.categories}>
          {categories.map((option) => (
            <Pressable
              key={option.id}
              accessibilityRole="button"
              accessibilityState={{
                selected: category === option.id,
                disabled: busy,
              }}
              disabled={busy}
              onPress={() => {
                if (option.id !== category) {
                  setKind(undefined);
                  if (fixed) setWorn(undefined);
                }
                setCategory(option.id);
              }}
              style={[
                styles.category,
                category === option.id && styles.selectedCategory,
              ]}
            >
              <AppText
                variant="caption"
                style={category === option.id ? styles.selectedText : undefined}
              >
                {categoryName(option.id)}
              </AppText>
            </Pressable>
          ))}
        </View>
      </View>
      {kindOptions.length ? (
        <View style={styles.categorySection}>
          <AppText style={styles.label}>
            {needsKind ? t("piece.kind") : t("piece.kindOptional")}
          </AppText>
          <View style={styles.categories}>
            {kindOptions.map((option) => (
              <Chip
                key={option.id}
                label={kindName(option.id)}
                selected={kind === option.id}
                disabled={busy}
                onPress={() => {
                  const next =
                    !needsKind && kind === option.id ? undefined : option.id;
                  setKind(next);
                  const nextFixed = next ? fixedStyles(next) : undefined;
                  if (nextFixed) setWorn(nextFixed);
                  else if (fixed) setWorn(undefined);
                }}
              />
            ))}
          </View>
          {kindMissing ? (
            <AppText variant="caption" muted>
              {t("piece.kindRequired")}
            </AppText>
          ) : null}
        </View>
      ) : null}
      <View style={styles.categorySection}>
        <AppText style={styles.label}>{t("piece.style")}</AppText>
        {fixed ? (
          <AppText muted>
            {t("piece.styleFixed", { styles: stylesName(fixed) })}
          </AppText>
        ) : (
          <>
            <View style={styles.categories}>
              {styleOptions.map((option) => {
                const selected = Boolean(worn?.includes(option.id));
                return (
                  <Chip
                    key={option.id}
                    label={styleName(option.id)}
                    selected={selected}
                    disabled={busy}
                    onPress={() =>
                      setWorn((current = []) =>
                        selected
                          ? current.filter((item) => item !== option.id)
                          : [...current, option.id],
                      )
                    }
                  />
                );
              })}
            </View>
            <AppText variant="caption" muted>
              {t("piece.styleHint")}
            </AppText>
          </>
        )}
      </View>
      {described && describes ? (
        <AttributeEditor
          piece={described}
          disabled={busy}
          onConfirm={(key, value) => {
            const next = confirmAttribute(described, key, value);
            setDetails({ attributes: next.attributes, sources: next.sources });
          }}
        />
      ) : null}
      <ErrorMessage message={error} />
      <Button
        label={piece ? "Save changes" : "Add to closet"}
        onPress={() => {
          void save();
        }}
        busy={busy}
        disabled={
          !image ||
          !category ||
          !name.trim() ||
          kindMissing ||
          Boolean(piece && !dirty)
        }
      />
      <AppText variant="caption" muted>
        {piece?.source === "sample"
          ? "A sample piece for trying outfit combinations."
          : "Saved on this device. Photos keep their original backgrounds."}
      </AppText>
      {piece ? (
        <Button
          label="Remove piece"
          danger
          disabled={busy}
          onPress={() => {
            void remove();
          }}
        />
      ) : null}
    </FormScreen>
  );
}

const styles = StyleSheet.create({
  photo: {
    minHeight: 280,
    justifyContent: "center",
    borderWidth: 1,
    borderColor: theme.colors.line,
    borderRadius: theme.radius,
    borderCurve: "continuous",
    overflow: "hidden",
    backgroundColor: theme.colors.background,
  },
  photoWithImage: { height: 280 },
  image: { width: "100%", height: "100%" },
  photoHint: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    gap: 16,
  },
  hint: { textAlign: "center", maxWidth: 260 },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  action: { flexGrow: 1, minWidth: 130 },
  categorySection: { gap: 12 },
  categories: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  category: {
    minHeight: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  selectedCategory: { backgroundColor: theme.colors.accent },
  selectedText: { color: theme.colors.accentText },
  label: { fontWeight: "600" },
});
