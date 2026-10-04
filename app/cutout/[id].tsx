import { useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import { router, useLocalSearchParams, useNavigation } from "expo-router";
import {
  CutoutEditorView,
  type CutoutEditorHandle,
} from "../../modules/closet-vision/src";
import {
  brushSizes,
  importCutout,
  leftoverFiles,
  pieceCutout,
  replaceImportCutout,
  replacePieceCutout,
  type BrushSize,
  type CutoutMode,
} from "../../src/domain/cutout";
import { t } from "../../src/i18n";
import { useDiscardChanges } from "../../src/navigation/useDiscardChanges";
import { useCloset } from "../../src/state/closet";
import { discardPhoto, photoUri } from "../../src/storage/local";
import {
  Button,
  CameraFrame,
  Footer,
  Screen,
  Segmented,
  Silk,
} from "../../src/ui";
import { announce } from "../../src/ui/announce";
import { theme } from "../../src/ui/theme";

const brushes: BrushSize[] = ["small", "medium", "large"];

export default function AdjustCutout() {
  const { id, target } = useLocalSearchParams<{
    id: string;
    target: "import" | "piece";
  }>();
  const { closet } = useCloset();
  const exists =
    target === "piece"
      ? closet.pieces.some((item) => item.id === id)
      : closet.imports.some((item) => item.id === id);
  if (!exists)
    return (
      <Screen
        title={t("cutout.title")}
        gone={{
          title:
            target === "import"
              ? t("capture.gone.title")
              : t("piece.missing.title"),
        }}
      />
    );
  return <Editor id={id} target={target === "import" ? "import" : "piece"} />;
}

function Editor({ id, target }: { id: string; target: "import" | "piece" }) {
  const { closet, update } = useCloset();
  const navigation = useNavigation();
  const [source] = useState(() => {
    if (target === "piece") {
      const piece = closet.pieces.find((item) => item.id === id);
      return piece ? pieceCutout(piece) : null;
    }
    const job = closet.imports.find((item) => item.id === id);
    return job ? importCutout(job) : null;
  });
  const editor = useRef<CutoutEditorHandle>(null);
  const [state, setState] = useState<"loading" | "ready" | "failed">("loading");
  const [mode, setMode] = useState<CutoutMode>("restore");
  const [brush, setBrush] = useState<BrushSize>("medium");
  const [canUndo, setCanUndo] = useState(false);
  const [edited, setEdited] = useState(false);
  const [held, setHeld] = useState(false);
  const [picked, setPicked] = useState(false);
  const [selecting, setSelecting] = useState(false);
  const [zoomed, setZoomed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const allowClose = useDiscardChanges(edited, busy);

  if (!source || state === "failed")
    return (
      <Screen
        title={t("cutout.title")}
        media
        gone={{ title: t("cutout.failed") }}
      />
    );

  async function done() {
    if (!editor.current || busy) return;
    if (!canUndo) {
      allowClose();
      router.back();
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const edit = await editor.current.save(
        `${id}-cut-${Date.now().toString(36)}`,
      );
      let files: string[] = [];
      await update((current) => {
        const next =
          target === "piece"
            ? replacePieceCutout(current, id, edit)
            : replaceImportCutout(current, id, edit);
        files = leftoverFiles(current, next, edit);
        return next;
      });
      for (const file of files) void discardPhoto(file).catch(() => undefined);
      allowClose();
      router.back();
    } catch {
      setError(t("cutout.saveFailed"));
      setBusy(false);
    }
  }

  const ready = state === "ready" && !busy;
  const guide = !held
    ? t("cutout.hold")
    : picked
      ? t("cutout.selected")
      : undefined;

  const markEdited = () => {
    if (edited) return;
    setEdited(true);
    navigation.setOptions({ gestureEnabled: false });
  };

  return (
    <Screen
      title={t("cutout.adjust")}
      media
      scroll={false}
      leading="cancel"
      onCancel={() => router.back()}
      footer={
        <Footer
          media
          primary={{
            label: t("common.done"),
            onPress: () => void done(),
            busy,
            disabled: state !== "ready",
            testID: "cutout-done",
          }}
          error={error}
        />
      }
      testID="cutout-screen"
    >
      <View style={styles.body}>
        <CameraFrame
          full
          guide={guide}
          testID="cutout-frame"
          controls={
            <View style={styles.controls}>
              <Segmented
                media
                label={t("cutout.brush")}
                options={[
                  { id: "restore", label: t("cutout.restore") },
                  { id: "erase", label: t("cutout.erase") },
                ]}
                value={mode}
                onChange={setMode}
                disabled={!ready}
              />
              <Segmented
                media
                label={t("cutout.brush")}
                options={brushes.map((size) => ({
                  id: size,
                  label: t(`cutout.${size}`),
                }))}
                value={brush}
                onChange={setBrush}
                disabled={!ready}
              />
              <View style={styles.row}>
                <Button
                  variant="quiet"
                  media
                  label={t("cutout.undo")}
                  disabled={!ready || !canUndo}
                  testID="cutout-undo"
                  onPress={() => void editor.current?.undo()}
                />
                <Button
                  variant="quiet"
                  media
                  label={t("cutout.reset")}
                  disabled={!ready}
                  testID="cutout-reset"
                  onPress={() => void editor.current?.reset()}
                />
                <Button
                  variant="quiet"
                  media
                  label={zoomed ? t("cutout.fit") : t("cutout.zoomIn")}
                  disabled={!ready}
                  testID="cutout-zoom"
                  onPress={() => {
                    void editor.current?.zoom(!zoomed);
                    setZoomed(!zoomed);
                  }}
                />
              </View>
            </View>
          }
        >
          <View style={StyleSheet.absoluteFill} testID="cutout-canvas">
            <CutoutEditorView
              ref={editor}
              style={StyleSheet.absoluteFill}
              original={photoUri(source.original)}
              cutout={source.cutout ? photoUri(source.cutout) : null}
              area={source.area}
              mode={mode}
              brushSize={brushSizes[brush]}
              labels={{
                canvas: t("editor.photoPreview"),
                selectPiece: t("cutout.selectPiece"),
                zoomIn: t("cutout.zoomIn"),
                fit: t("cutout.fit"),
              }}
              onReady={(event) => setState(event.nativeEvent.state)}
              onEdit={(event) => {
                setCanUndo(event.nativeEvent.canUndo);
                if (event.nativeEvent.canUndo) markEdited();
                setPicked(false);
              }}
              onSelecting={(event) => {
                const { selecting: now, found } = event.nativeEvent;
                setSelecting(now);
                if (now) return;
                setHeld(true);
                if (found) {
                  setPicked(true);
                  announce(t("cutout.selected"));
                } else announce(t("cutout.noneFound"));
              }}
            />
          </View>
          {state === "loading" ? (
            <View
              style={StyleSheet.absoluteFill}
              pointerEvents="none"
              testID="moment-loading"
            >
              <Silk
                kind="placeholder"
                shape="tile"
                label={t("cutout.title")}
                style={StyleSheet.absoluteFill}
              />
            </View>
          ) : null}
          {selecting ? (
            <View
              style={styles.selecting}
              pointerEvents="none"
              testID="moment-selecting"
            />
          ) : null}
        </CameraFrame>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { flex: 1, gap: theme.space.md },
  controls: { gap: theme.space.md },
  row: { flexDirection: "row", flexWrap: "wrap" },
  selecting: { position: "absolute", width: 1, height: 1 },
});
