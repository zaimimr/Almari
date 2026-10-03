import { useEffect, useRef, useState } from "react";
import { Platform, StyleSheet, View } from "react-native";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { randomUUID } from "expo-crypto";
import { router, useLocalSearchParams } from "expo-router";
import { setPieceLabel } from "../../src/domain/closet";
import { setImportLabel } from "../../src/domain/importing";
import {
  draftFromLabel,
  hasLabelFields,
  labelFromDraft,
  type LabelDraft,
} from "../../src/domain/careLabel";
import { MissingPiece } from "../../src/features/MissingPiece";
import { t } from "../../src/i18n";
import { useCloset } from "../../src/state/closet";
import { fibreLabel, readCareLabel } from "../../src/state/careLabel";
import { discardPhoto, photoUri } from "../../src/storage/local";
import {
  AppText,
  Button,
  ErrorMessage,
  Field,
  FormScreen,
} from "../../src/ui/legacy";
import { confirmAction } from "../../src/ui/confirm";
import { theme } from "../../src/ui/theme";

export default function CareLabelScreen() {
  const { id, target } = useLocalSearchParams<{
    id: string;
    target: "import" | "piece";
  }>();
  const { closet, update } = useCloset();
  const owner =
    target === "piece"
      ? closet.pieces.find((item) => item.id === id)
      : closet.imports.find((item) => item.id === id);
  const saved = owner?.label;
  const [photo, setPhoto] = useState<string | null>(saved?.photo ?? null);
  const [draft, setDraft] = useState<LabelDraft>(() =>
    draftFromLabel(saved, fibreLabel),
  );
  const [found, setFound] = useState(saved ? hasLabelFields(saved) : false);
  const [busy, setBusy] = useState(false);
  const [reading, setReading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const unsaved = useRef<string | null>(null);
  const closed = useRef(false);

  useEffect(
    () => () => {
      closed.current = true;
      if (unsaved.current)
        void discardPhoto(unsaved.current).catch(() => undefined);
    },
    [],
  );

  if (!owner) return <MissingPiece />;

  async function pick(source: "camera" | "library") {
    setError(null);
    try {
      if (source === "camera") {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted) {
          setError(t("careLabel.cameraOff"));
          return;
        }
      }
      const options: ImagePicker.ImagePickerOptions = {
        mediaTypes: ["images"],
        quality: 1,
        exif: false,
      };
      const result =
        source === "camera"
          ? await ImagePicker.launchCameraAsync(options)
          : await ImagePicker.launchImageLibraryAsync(options);
      const asset = result.assets?.[0];
      if (result.canceled || !asset) return;
      setReading(true);
      const read = await readCareLabel(asset.uri, `${id}-${randomUUID()}`);
      if (closed.current) {
        void discardPhoto(read.photo).catch(() => undefined);
        return;
      }
      if (unsaved.current)
        void discardPhoto(unsaved.current).catch(() => undefined);
      unsaved.current = read.photo;
      setPhoto(read.photo);
      setDraft(draftFromLabel(read.fields, fibreLabel));
      setFound(hasLabelFields(read.fields));
    } catch {
      setError(t("careLabel.unreadable"));
    } finally {
      setReading(false);
    }
  }

  function change(next: Partial<LabelDraft>) {
    setDraft((current) => ({ ...current, ...next }));
  }

  function changeMaterial(
    index: number,
    next: Partial<LabelDraft["materials"][number]>,
  ) {
    setDraft((current) => ({
      ...current,
      materials: current.materials.map((item, at) =>
        at === index ? { ...item, ...next } : item,
      ),
    }));
  }

  async function save() {
    if (!photo || busy || reading) return;
    setBusy(true);
    setError(null);
    try {
      const label = labelFromDraft(photo, draft);
      await update((current) =>
        target === "piece"
          ? setPieceLabel(current, id, label)
          : setImportLabel(current, id, label),
      );
      if (saved && saved.photo !== photo)
        void discardPhoto(saved.photo).catch(() => undefined);
      unsaved.current = null;
      router.back();
    } catch {
      setError(t("careLabel.saveFailed"));
      setBusy(false);
    }
  }

  async function remove() {
    if (!saved || busy) return;
    const confirmed = await confirmAction(
      t("careLabel.removeTitle"),
      t("careLabel.removeBody"),
      t("careLabel.removeConfirm"),
    );
    if (!confirmed) return;
    setBusy(true);
    try {
      await update((current) =>
        target === "piece"
          ? setPieceLabel(current, id, undefined)
          : setImportLabel(current, id, undefined),
      );
      void discardPhoto(saved.photo).catch(() => undefined);
      router.back();
    } catch {
      setError(t("careLabel.removeFailed"));
      setBusy(false);
    }
  }

  const choose = (
    <View style={styles.actions}>
      {Platform.OS !== "web" ? (
        <View style={styles.action}>
          <Button
            label={
              photo ? t("careLabel.takeAnother") : t("careLabel.takePhoto")
            }
            secondary={Boolean(photo)}
            disabled={busy || reading}
            onPress={() => {
              void pick("camera");
            }}
          />
        </View>
      ) : null}
      <View style={styles.action}>
        <Button
          label={t("careLabel.choosePhoto")}
          secondary
          disabled={busy || reading}
          onPress={() => {
            void pick("library");
          }}
        />
      </View>
    </View>
  );

  return (
    <FormScreen>
      {photo ? (
        <View style={styles.photo}>
          <Image
            source={{ uri: photoUri(photo) }}
            style={styles.image}
            contentFit="contain"
            accessibilityLabel={t("careLabel.photo")}
          />
        </View>
      ) : (
        <AppText>{t("careLabel.intro")}</AppText>
      )}
      {reading ? (
        <AppText muted accessibilityLiveRegion="polite">
          {t("careLabel.reading")}
        </AppText>
      ) : null}
      {choose}
      {photo ? (
        <>
          <AppText muted>
            {found ? t("careLabel.found") : t("careLabel.nothingFound")}
          </AppText>
          <View style={styles.section}>
            <AppText style={styles.label}>{t("careLabel.madeOf")}</AppText>
            {draft.materials.map((item, index) => (
              <View key={index} style={styles.material}>
                <View style={styles.fibre}>
                  <Field
                    label={t("careLabel.fibre", { number: index + 1 })}
                    value={item.fibre}
                    onChangeText={(fibre) => changeMaterial(index, { fibre })}
                    maxLength={40}
                    autoCapitalize="none"
                  />
                </View>
                <View style={styles.percent}>
                  <Field
                    label={t("careLabel.percent", { number: index + 1 })}
                    value={item.percent}
                    onChangeText={(percent) =>
                      changeMaterial(index, { percent })
                    }
                    keyboardType="number-pad"
                    maxLength={3}
                  />
                </View>
                <Button
                  label={t("careLabel.removeFibre", { number: index + 1 })}
                  danger
                  compact
                  disabled={busy || reading}
                  onPress={() =>
                    change({
                      materials: draft.materials.filter(
                        (_, at) => at !== index,
                      ),
                    })
                  }
                />
              </View>
            ))}
            <Button
              label={t("careLabel.addFibre")}
              secondary
              compact
              disabled={busy || reading}
              onPress={() =>
                change({
                  materials: [...draft.materials, { fibre: "", percent: "" }],
                })
              }
            />
          </View>
          <Field
            label={t("careLabel.size")}
            testID="care-label-size"
            value={draft.size}
            onChangeText={(size) => change({ size })}
            maxLength={20}
          />
          <Field
            label={t("careLabel.brand")}
            value={draft.brand}
            onChangeText={(brand) => change({ brand })}
            maxLength={40}
          />
          <Field
            label={t("careLabel.origin")}
            value={draft.origin}
            onChangeText={(origin) => change({ origin })}
            maxLength={40}
          />
          <ErrorMessage message={error} />
          <Button
            label={t("careLabel.save")}
            busy={busy}
            disabled={reading}
            onPress={() => {
              void save();
            }}
          />
        </>
      ) : (
        <ErrorMessage message={error} />
      )}
      {saved ? (
        <Button
          label={t("careLabel.remove")}
          danger
          disabled={busy || reading}
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
    height: 220,
    borderRadius: theme.radius.md,
    borderCurve: "continuous",
    borderWidth: 1,
    borderColor: theme.colors.line,
    overflow: "hidden",
    backgroundColor: theme.colors.canvas,
  },
  image: { width: "100%", height: "100%" },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  action: { flexGrow: 1, minWidth: 130 },
  section: { gap: 12 },
  label: { fontWeight: "600" },
  material: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "flex-end",
    gap: 8,
  },
  fibre: { flexGrow: 2, flexBasis: 140 },
  percent: { flexGrow: 1, flexBasis: 90 },
});
