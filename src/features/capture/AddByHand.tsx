import { useState } from "react";
import { Linking, StyleSheet, View } from "react-native";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { randomUUID } from "expo-crypto";
import { router } from "expo-router";
import {
  categories,
  fixedStyles,
  isOffered,
  kindsIn,
  savePiece,
  type Category,
  type Closet,
  type GarmentKind,
  type Piece,
} from "../../domain/closet";
import { fitAttributes } from "../../domain/attributes";
import { colourSwatch, ownKind, ownKindsIn } from "../../domain/lists";
import { nameFor } from "../../domain/importing";
import { confirmEdits } from "../../domain/recognition";
import { categoryName, kindName, stylesName, t } from "../../i18n";
import { useDiscardChanges } from "../../navigation/useDiscardChanges";
import { useCloset } from "../../state/closet";
import { now } from "../../state/clock";
import { measurePiece } from "../../state/imports";
import { setLastAdded } from "../../state/launch";
import { discardPhoto, keepPhoto } from "../../storage/local";
import {
  Banner,
  Button,
  ChipRow,
  Expander,
  Field,
  Footer,
  Row,
  Rows,
  Screen,
  Segmented,
  Text,
} from "../../ui";
import { theme } from "../../ui/theme";
import { useColors } from "../../ui/useColors";
import { AddOwn, addOwnId, addOwnOption } from "../AddOwn";
import { ColourChips } from "../ColourChips";
import { FactChips } from "../piece/FactChips";
import { styleChoices, stylesOf } from "./ConfirmPiece";

const commonColours = ["Black", "White", "Beige", "Navy", "Red", "Green"];

type StyleChoice = ReturnType<typeof styleChoices>[number]["id"];

export function AddByHand() {
  const { closet, update } = useCloset();
  const colors = useColors();
  const [id] = useState(() => randomUUID());
  const [image, setImage] = useState<string | null>(null);
  const [category, setCategory] = useState<Category | null>(null);
  const [kind, setKind] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [facts, setFacts] = useState<Piece | null>(null);
  const [more, setMore] = useState(false);
  const [style, setStyle] = useState<StyleChoice>("desi");
  const [colour, setColour] = useState<string | null>(null);
  const [typed, setTyped] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);
  const [cameraOff, setCameraOff] = useState(false);
  const [openFailed, setOpenFailed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const own = kind ? ownKind(kind) : undefined;
  const garment = own ? undefined : ((kind as GarmentKind | null) ?? undefined);
  const name =
    typed ??
    (own
      ? own.name
      : garment
        ? nameFor(garment, colour ? [colourSwatch(colour)] : [])
        : "");
  const dirty = Boolean(image || category || kind || colour || typed);
  const allowClose = useDiscardChanges(dirty, busy);
  const kindOptions = category
    ? kindsIn(category)
        .map((option) => option.id)
        .filter(isOffered)
    : [];
  const fixed = garment ? fixedStyles(garment) : undefined;
  const complete = Boolean(image && category && kind && name.trim());

  async function pick(source: "camera" | "library") {
    setCameraOff(false);
    setOpenFailed(false);
    try {
      if (source === "camera") {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted) {
          setCameraOff(true);
          return;
        }
      }
      const options: ImagePicker.ImagePickerOptions = {
        mediaTypes: ["images"],
        quality: 0.9,
        exif: false,
      };
      const result =
        source === "camera"
          ? await ImagePicker.launchCameraAsync(options)
          : await ImagePicker.launchImageLibraryAsync(options);
      const asset = result.assets?.[0];
      if (!result.canceled && asset) {
        setImage(asset.uri);
        setTouched(true);
      }
    } catch {
      setOpenFailed(true);
    }
  }

  const draft: Piece | null = category
    ? fitAttributes({
        id,
        name: name.trim() || categoryName(category),
        category,
        ...(garment ? { kind: garment } : {}),
        ...(own ? { ownKind: own.id } : {}),
        photo: image ?? id,
        createdAt: now().toISOString(),
        source: "owned" as const,
        styles: fixed ?? stylesOf(style),
        attributes: facts?.attributes ?? {},
        sources: facts?.sources ?? {},
        ...(facts?.traits ? { traits: facts.traits } : {}),
        ...(facts?.ownFabric ? { ownFabric: facts.ownFabric } : {}),
      })
    : null;

  const changeFacts = async (transform: (current: Closet) => Closet) => {
    if (!draft) return;
    const next = transform({ ...closet, pieces: [draft] }).pieces[0];
    if (!next) return;
    setTouched(true);
    setFacts(next);
    if (!fixed && next.sources?.styles === "confirmed" && next.styles?.length)
      setStyle(next.styles.length > 1 ? "both" : next.styles[0]!);
  };

  async function save() {
    if (!complete || busy) return;
    setBusy(true);
    setError(null);
    let photo: string | null = null;
    try {
      photo = await keepPhoto(image!);
      const styles = fixed ?? stylesOf(style);
      const plain: Piece = confirmEdits(undefined, {
        id,
        name: name.trim(),
        category: category!,
        ...(garment ? { kind: garment } : {}),
        ...(own ? { ownKind: own.id } : {}),
        photo,
        createdAt: now().toISOString(),
        source: "owned",
        styles,
      });
      const edited: Piece =
        facts && draft
          ? {
              ...plain,
              attributes: draft.attributes,
              sources: { ...draft.sources, ...plain.sources },
              ...(draft.traits ? { traits: draft.traits } : {}),
              ...(draft.ownFabric ? { ownFabric: draft.ownFabric } : {}),
            }
          : plain;
      const piece: Piece = colour
        ? {
            ...edited,
            colors: [colourSwatch(colour)],
            sources: { ...edited.sources, colour: "confirmed" },
          }
        : edited;
      await update((current) => savePiece(current, piece));
      void measurePiece({ update }, piece);
      setLastAdded([id]);
      allowClose();
      router.back();
    } catch {
      if (photo) void discardPhoto(photo).catch(() => undefined);
      setError(t("error.pieceSave"));
      setBusy(false);
    }
  }

  return (
    <Screen
      title={t("manual.title")}
      headerTitleVisible
      leading="cancel"
      onCancel={() => router.back()}
      footer={
        <Footer
          error={error}
          primary={{
            label: t("editor.addToCloset"),
            onPress: () => void save(),
            busy,
            disabled: !complete,
            testID: "manual-save",
          }}
        />
      }
      testID="manual-screen"
    >
      <View style={styles.content}>
        <View style={styles.block}>
          {image ? (
            <Image
              source={{ uri: image }}
              style={[styles.slot, { backgroundColor: colors.surface }]}
              contentFit="contain"
              accessibilityLabel={t("editor.photoPreview")}
              testID="manual-photo"
            />
          ) : (
            <View
              style={[
                styles.slot,
                styles.empty,
                { borderColor: colors.lineField },
              ]}
              testID="manual-slot"
            />
          )}
          {cameraOff ? (
            <Banner
              tone="notice"
              text={t("common.cameraOff")}
              actions={[
                {
                  label: t("common.choosePhoto"),
                  variant: "secondary",
                  onPress: () => void pick("library"),
                },
                {
                  label: t("common.openSettings"),
                  variant: "quiet",
                  onPress: () => void Linking.openSettings(),
                },
              ]}
            />
          ) : null}
          {openFailed ? (
            <Text role="footnote" tone="error">
              {t("common.photoOpenFailed")}
            </Text>
          ) : null}
          <View style={styles.sources}>
            {image ? null : (
              <Button
                label={t("common.takePhoto")}
                variant="quiet"
                icon="camera"
                onPress={() => void pick("camera")}
                testID="manual-camera"
              />
            )}
            <Button
              label={t("common.choosePhoto")}
              variant="quiet"
              icon="photo.on.rectangle"
              onPress={() => void pick("library")}
              testID="manual-library"
            />
          </View>
        </View>
        <ChipRow
          label={t("piece.category")}
          options={categories.map(({ id: option }) => ({
            id: option as string,
            label: categoryName(option),
          }))}
          value={category}
          onChange={(next) => {
            if (typeof next !== "string") return;
            setTouched(true);
            if (next !== category && !(own && own.category === next))
              setKind(null);
            setCategory(next as Category);
          }}
          testID="manual-category"
        />
        {category ? (
          <ChipRow
            label={t("piece.kind")}
            options={[
              ...ownKindsIn(category).map((option) => ({
                id: option.id,
                label: option.name,
              })),
              ...kindOptions.map((option) => ({
                id: option as string,
                label: kindName(option),
              })),
              addOwnOption(),
            ]}
            value={kind}
            onChange={(next) => {
              if (typeof next !== "string") return;
              setTouched(true);
              if (next === addOwnId) setAdding(true);
              else setKind(next);
            }}
            testID="manual-kind"
          />
        ) : null}
        {category && adding ? (
          <AddOwn
            list="kinds"
            category={category}
            onAdded={(next) => {
              setAdding(false);
              const added = ownKind(next);
              if (added && added.category !== category)
                setCategory(added.category);
              setKind(next);
            }}
            onCancel={() => setAdding(false)}
            testID="manual-own-kind"
          />
        ) : null}
        {fixed ? (
          <Rows>
            <Row
              title={t("piece.style")}
              trailing={{ value: stylesName(fixed) }}
              last
            />
          </Rows>
        ) : (
          <Segmented
            label={t("piece.style")}
            options={styleChoices()}
            value={style}
            onChange={(next) => {
              setTouched(true);
              setStyle(next);
            }}
          />
        )}
        <ColourChips
          label={t("fact.colour")}
          value={colour}
          first={commonColours}
          onPick={(next) => {
            setTouched(true);
            setColour(next);
          }}
          testID="manual-colour"
        />
        <Field
          label={t("piece.name")}
          value={name}
          onChangeText={(text) => {
            setTouched(true);
            setTyped(text);
          }}
          maxLength={80}
          returnKeyType="done"
          testID="manual-name"
        />
        {draft ? (
          <Expander
            id="manual-more"
            title={t("editor.moreDetails")}
            open={more}
            onToggle={() => setMore((open) => !open)}
            testID="manual-more"
          >
            <FactChips piece={draft} onChange={changeFacts} more />
          </Expander>
        ) : null}
        {touched && !complete ? (
          <Text role="footnote" tone="muted">
            {t("manual.missing")}
          </Text>
        ) : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: theme.space.lg },
  block: { gap: theme.space.sm },
  slot: {
    width: "100%",
    height: 220,
    borderRadius: theme.radius.md,
    borderCurve: "continuous",
  },
  empty: { borderWidth: 1, borderStyle: "dashed" },
  sources: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginLeft: -theme.space.sm,
    gap: theme.space.sm,
  },
});
