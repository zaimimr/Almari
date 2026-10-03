import { useRef, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, router, useLocalSearchParams } from "expo-router";
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
import { MissingPiece } from "../../src/features/MissingPiece";
import { t } from "../../src/i18n";
import { useDiscardChanges } from "../../src/navigation/useDiscardChanges";
import { useCloset } from "../../src/state/closet";
import { discardPhoto, photoUri } from "../../src/storage/local";
import {
  AppText,
  Button,
  Chip,
  ErrorMessage,
  HeaderAction,
  Message,
  Screen,
} from "../../src/ui/legacy";
import { theme } from "../../src/ui/theme";

const brushes: BrushSize[] = ["small", "medium", "large"];

export default function AdjustCutout() {
  const { id, target } = useLocalSearchParams<{
    id: string;
    target: "import" | "piece";
  }>();
  const { closet, update } = useCloset();
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
  const [held, setHeld] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const allowClose = useDiscardChanges(canUndo, busy);

  if (!source) return <MissingPiece />;

  if (state === "failed")
    return (
      <Screen centered>
        <Message
          title={source.cutout ? t("cutout.adjust") : t("cutout.byHand")}
          description={t("cutout.failed")}
          action={
            <Button label={t("common.goBack")} onPress={() => router.back()} />
          }
        />
      </Screen>
    );

  async function done() {
    if (!editor.current || busy) return;
    if (!canUndo) {
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

  return (
    <View style={styles.screen}>
      <Stack.Screen
        options={{
          title: source.cutout ? t("cutout.adjust") : t("cutout.byHand"),
          gestureEnabled: false,
          headerLeft: () => (
            <HeaderAction
              label={t("common.cancel")}
              onPress={() => router.back()}
            />
          ),
        }}
      />
      <View style={styles.canvas}>
        <CutoutEditorView
          ref={editor}
          style={StyleSheet.absoluteFill}
          original={photoUri(source.original)}
          cutout={source.cutout ? photoUri(source.cutout) : null}
          area={source.area}
          mode={mode}
          brushSize={brushSizes[brush]}
          onReady={(event) => setState(event.nativeEvent.state)}
          onEdit={(event) => setCanUndo(event.nativeEvent.canUndo)}
          onSelect={() => setHeld(true)}
        />
        {state === "loading" || busy ? (
          <View style={styles.loading} pointerEvents="none">
            <ActivityIndicator color={theme.colors.onPlum} />
          </View>
        ) : null}
      </View>
      <SafeAreaView edges={["bottom"]} style={styles.panel}>
        <View style={styles.row}>
          <Chip
            label={t("cutout.restore")}
            selected={mode === "restore"}
            disabled={!ready}
            onPress={() => setMode("restore")}
          />
          <Chip
            label={t("cutout.erase")}
            selected={mode === "erase"}
            disabled={!ready}
            onPress={() => setMode("erase")}
          />
        </View>
        <View style={styles.row}>
          <AppText variant="footnote" muted>
            {t("cutout.brush")}
          </AppText>
          {brushes.map((size) => (
            <Chip
              key={size}
              label={t(`cutout.${size}`)}
              selected={brush === size}
              disabled={!ready}
              onPress={() => setBrush(size)}
            />
          ))}
        </View>
        <AppText
          variant="footnote"
          muted
          style={held ? styles.hidden : undefined}
          accessibilityElementsHidden={held}
        >
          {t("cutout.hold")}
        </AppText>
        <ErrorMessage message={error} />
        <View style={styles.row}>
          <View style={styles.action}>
            <Button
              label={t("cutout.undo")}
              secondary
              compact
              disabled={!ready || !canUndo}
              onPress={() => void editor.current?.undo()}
            />
          </View>
          <View style={styles.action}>
            <Button
              label={t("cutout.reset")}
              secondary
              compact
              disabled={!ready}
              onPress={() => void editor.current?.reset()}
            />
          </View>
        </View>
        <Button
          label={t("common.done")}
          busy={busy}
          disabled={state !== "ready"}
          onPress={() => void done()}
        />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.colors.canvas },
  canvas: { flex: 1, backgroundColor: theme.colors.ink },
  loading: {
    ...StyleSheet.absoluteFill,
    alignItems: "center",
    justifyContent: "center",
  },
  panel: {
    gap: theme.space.md,
    paddingHorizontal: theme.space.xl,
    paddingTop: theme.space.md,
    paddingBottom: theme.space.md,
    backgroundColor: theme.colors.canvas,
    borderTopWidth: 1,
    borderColor: theme.colors.line,
  },
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: theme.space.sm,
  },
  action: { flexGrow: 1, minWidth: 120 },
  hidden: { opacity: 0 },
});
