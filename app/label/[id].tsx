import { useEffect, useRef, useState } from "react";
import { Platform, StyleSheet, View } from "react-native";
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
import { t } from "../../src/i18n";
import { useDiscardChanges } from "../../src/navigation/useDiscardChanges";
import { useCloset } from "../../src/state/closet";
import { fibreLabel, readCareLabel } from "../../src/state/careLabel";
import { discardPhoto, photoUri } from "../../src/storage/local";
import {
  Button,
  Field,
  Footer,
  Screen,
  Section,
  Silk,
  Text,
  Tile,
} from "../../src/ui";
import { confirmAction } from "../../src/ui/confirm";
import { useLargeText } from "../../src/ui/useLargeText";
import { theme } from "../../src/ui/theme";

export default function CareLabelScreen() {
  const { id, target } = useLocalSearchParams<{
    id: string;
    target: "import" | "piece";
  }>();
  const { closet } = useCloset();
  const owner =
    target === "piece"
      ? closet.pieces.find((item) => item.id === id)
      : closet.imports.find((item) => item.id === id);
  if (!owner)
    return (
      <Screen
        title={t("careLabel.title")}
        gone={{
          title:
            target === "import"
              ? t("capture.gone.title")
              : t("piece.missing.title"),
        }}
      />
    );
  return (
    <LabelEditor id={id} target={target === "import" ? "import" : "piece"} />
  );
}

function LabelEditor({
  id,
  target,
}: {
  id: string;
  target: "import" | "piece";
}) {
  const { closet, update } = useCloset();
  const { ax } = useLargeText();
  const owner =
    target === "piece"
      ? closet.pieces.find((item) => item.id === id)
      : closet.imports.find((item) => item.id === id);
  const [saved] = useState(owner?.label);
  const [photo, setPhoto] = useState<string | null>(saved?.photo ?? null);
  const [initial] = useState<LabelDraft>(() =>
    draftFromLabel(saved, fibreLabel),
  );
  const [draft, setDraft] = useState<LabelDraft>(initial);
  const [busy, setBusy] = useState(false);
  const [reading, setReading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [readError, setReadError] = useState<string | null>(null);
  const unsaved = useRef<string | null>(null);
  const closed = useRef(false);

  const dirty =
    photo !== (saved?.photo ?? null) ||
    JSON.stringify(draft) !== JSON.stringify(initial);
  const allowClose = useDiscardChanges(dirty, busy);

  useEffect(
    () => () => {
      closed.current = true;
      if (unsaved.current)
        void discardPhoto(unsaved.current).catch(() => undefined);
    },
    [],
  );

  async function pick(source: "camera" | "library") {
    setError(null);
    setReadError(null);
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
      const any = hasLabelFields(read.fields);
      if (!any) setReadError(t("careLabel.nothingFound"));
    } catch {
      setReadError(t("careLabel.unreadable"));
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
    if (!photo || busy || reading || !dirty) return;
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
      allowClose();
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
      allowClose();
      router.back();
    } catch {
      setError(t("careLabel.removeFailed"));
      setBusy(false);
    }
  }

  const camera = Platform.OS !== "web";
  const shown = Boolean(photo) || Boolean(saved);

  return (
    <Screen
      title={t("careLabel.title")}
      leading="cancel"
      onCancel={() => router.back()}
      footer={
        <Footer
          primary={{
            label: t("careLabel.save"),
            onPress: () => void save(),
            busy,
            disabled: !photo || !dirty || reading,
            testID: "care-label-save",
          }}
          error={error}
        />
      }
      testID="care-label-screen"
    >
      {photo ? (
        reading ? (
          <View testID="moment-generating">
            <Silk kind="sheen" label={t("careLabel.reading")}>
              <Tile
                image={{ uri: photoUri(photo) }}
                size="hero"
                raw
                accessibilityLabel={t("careLabel.photo")}
              />
            </Silk>
          </View>
        ) : (
          <Tile
            image={{ uri: photoUri(photo) }}
            size="hero"
            raw
            accessibilityLabel={t("careLabel.photo")}
            testID="care-label-photo"
          />
        )
      ) : reading ? (
        <View testID="moment-generating">
          <Silk
            kind="placeholder"
            shape="tile"
            label={t("careLabel.reading")}
          />
        </View>
      ) : (
        <Text role="body" tone="muted">
          {t("careLabel.intro")}
        </Text>
      )}
      {readError ? (
        <Text role="footnote" tone="error" testID="care-label-read-error">
          {readError}
        </Text>
      ) : null}
      <View style={styles.leading}>
        {photo ? (
          <>
            {camera ? (
              <Button
                variant="quiet"
                label={t("careLabel.takeAnother")}
                disabled={busy || reading}
                onPress={() => void pick("camera")}
              />
            ) : null}
            <Button
              variant="quiet"
              label={t("common.choosePhoto")}
              disabled={busy || reading}
              testID="care-label-choose"
              onPress={() => void pick("library")}
            />
          </>
        ) : (
          <>
            {camera ? (
              <Button
                variant="secondary"
                label={t("common.takePhoto")}
                disabled={busy || reading}
                onPress={() => void pick("camera")}
              />
            ) : null}
            <Button
              variant="quiet"
              label={t("common.choosePhoto")}
              disabled={busy || reading}
              testID="care-label-choose"
              onPress={() => void pick("library")}
            />
          </>
        )}
      </View>
      {shown ? (
        <>
          <Section title={t("careLabel.madeOf")} testID="care-label-materials">
            <View style={styles.materials}>
              {!ax && draft.materials.length ? (
                <View
                  style={styles.material}
                  importantForAccessibility="no-hide-descendants"
                  accessibilityElementsHidden
                >
                  <View style={styles.fibre}>
                    <Text role="subhead" tone="muted">
                      {t("careLabel.fibreLabel")}
                    </Text>
                  </View>
                  <View style={styles.percent}>
                    <Text role="subhead" tone="muted">
                      {t("careLabel.percentLabel")}
                    </Text>
                  </View>
                  <View style={styles.spacer} />
                </View>
              ) : null}
              {draft.materials.map((item, index) => (
                <View key={index} style={ax ? styles.stacked : styles.material}>
                  <View style={ax ? undefined : styles.fibre}>
                    <Field
                      label={
                        ax
                          ? t("careLabel.fibreLabel")
                          : t("careLabel.fibre", { number: index + 1 })
                      }
                      hideLabel={!ax}
                      accessibilityLabel={t("careLabel.fibre", {
                        number: index + 1,
                      })}
                      value={item.fibre}
                      onChangeText={(fibre) => changeMaterial(index, { fibre })}
                      maxLength={40}
                      autoCapitalize="none"
                      testID={`care-label-fibre-${index}`}
                    />
                  </View>
                  <View style={ax ? undefined : styles.percent}>
                    <Field
                      label={
                        ax
                          ? t("careLabel.percentLabel")
                          : t("careLabel.percent", { number: index + 1 })
                      }
                      hideLabel={!ax}
                      accessibilityLabel={t("careLabel.percent", {
                        number: index + 1,
                      })}
                      value={item.percent}
                      onChangeText={(percent) =>
                        changeMaterial(index, { percent })
                      }
                      keyboardType="number-pad"
                      maxLength={3}
                      testID={`care-label-percent-${index}`}
                    />
                  </View>
                  <View style={styles.leading}>
                    <Button
                      variant="icon"
                      icon="minus.circle"
                      label={t("careLabel.removeFibre", { number: index + 1 })}
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
                </View>
              ))}
              <View style={styles.leading}>
                <Button
                  variant="quiet"
                  label={t("careLabel.addFibre")}
                  disabled={busy || reading}
                  onPress={() =>
                    change({
                      materials: [
                        ...draft.materials,
                        { fibre: "", percent: "" },
                      ],
                    })
                  }
                />
              </View>
            </View>
          </Section>
          <Field
            label={t("careLabel.size")}
            testID="care-label-size"
            value={draft.size}
            onChangeText={(size) => change({ size })}
            maxLength={20}
          />
          <Field
            label={t("careLabel.brand")}
            testID="care-label-brand"
            value={draft.brand}
            onChangeText={(brand) => change({ brand })}
            maxLength={40}
          />
          <Field
            label={t("careLabel.origin")}
            testID="care-label-origin"
            value={draft.origin}
            onChangeText={(origin) => change({ origin })}
            maxLength={40}
          />
        </>
      ) : null}
      {saved ? (
        <View style={styles.leading}>
          <Button
            variant="destructive"
            label={t("careLabel.remove")}
            disabled={busy || reading}
            testID="care-label-remove"
            onPress={() => void remove()}
          />
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  leading: { alignItems: "flex-start" },
  materials: { gap: theme.space.sm },
  material: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.space.sm,
  },
  stacked: { gap: theme.space.sm },
  fibre: { flex: 2 },
  percent: { flex: 1 },
  spacer: { width: theme.size.controlSmall },
});
