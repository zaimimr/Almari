import { useState } from "react";
import { StyleSheet, View, type GestureResponderEvent } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { randomUUID } from "expo-crypto";
import { Stack, router, useLocalSearchParams } from "expo-router";
import type { Frame, ImportJob } from "../../../src/domain/closet";
import { boxFrom, resizeBox } from "../../../src/domain/capture";
import {
  addToCapture,
  captureJobs,
  cropCapture,
  removeImport,
} from "../../../src/domain/importing";
import { t } from "../../../src/i18n";
import { useCloset } from "../../../src/state/closet";
import { changeImports } from "../../../src/state/imports";
import { photoUri } from "../../../src/storage/local";
import {
  AppText,
  Button,
  Chip,
  ErrorMessage,
  FormScreen,
  HeaderAction,
  Message,
  Screen,
} from "../../../src/ui";
import { theme } from "../../../src/ui/theme";

const startBox: Frame = { x: 0.25, y: 0.25, width: 0.5, height: 0.5 };
const step = 0.05;

function frameOf(job: ImportJob) {
  return job.crop ?? job.region?.frame ?? null;
}

function titleOf(job: ImportJob) {
  if (job.name) return job.name;
  return job.region ? t(`region.${job.region.kind}`) : t("capture.newPiece");
}

function place(frame: Frame) {
  return {
    left: `${frame.x * 100}%`,
    top: `${frame.y * 100}%`,
    width: `${frame.width * 100}%`,
    height: `${frame.height * 100}%`,
  } as const;
}

export default function CapturePieces() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { closet, update } = useCloset();
  const jobs = captureJobs(closet, id);
  const [dropped, setDropped] = useState<string[]>([]);
  const [drawing, setDrawing] = useState<{
    job: string | null;
    box: Frame;
  } | null>(null);
  const [start, setStart] = useState<{ x: number; y: number } | null>(null);
  const [stage, setStage] = useState({ width: 0, height: 0 });
  const [aspect, setAspect] = useState(0.75);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!jobs.length)
    return (
      <Screen centered>
        <Message
          title={t("capture.group.gone")}
          description={t("capture.group.goneHint")}
          action={
            <Button label={t("common.goBack")} onPress={() => router.back()} />
          }
        />
      </Screen>
    );

  const source = jobs[0]!.source;
  const othersIgnored = jobs.some((job) => (job.people ?? 0) > 1);
  const fit =
    stage.width && stage.height
      ? stage.width / stage.height > aspect
        ? { width: stage.height * aspect, height: stage.height }
        : { width: stage.width, height: stage.width / aspect }
      : null;

  function point(event: GestureResponderEvent) {
    return {
      x: event.nativeEvent.locationX / (fit?.width ?? 1),
      y: event.nativeEvent.locationY / (fit?.height ?? 1),
    };
  }

  function resize(change: number) {
    if (drawing)
      setDrawing({ ...drawing, box: resizeBox(drawing.box, change) });
  }

  function toggle(job: string, drop: boolean) {
    setDropped((current) =>
      drop
        ? [...new Set([...current, job])]
        : current.filter((item) => item !== job),
    );
  }

  async function applyBox() {
    if (!drawing || busy) return;
    const { job, box } = drawing;
    setBusy(true);
    setError(null);
    try {
      await changeImports(update, (current) =>
        job
          ? cropCapture(current, job, box)
          : addToCapture(
              current,
              id,
              randomUUID(),
              box,
              new Date().toISOString(),
            ),
      );
      setDrawing(null);
    } catch {
      setError(t("capture.saveFailed"));
    } finally {
      setBusy(false);
    }
  }

  async function done() {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      await changeImports(update, (current) =>
        dropped.reduce((next, job) => removeImport(next, job), current),
      );
      router.back();
    } catch {
      setError(t("capture.saveFailed"));
      setBusy(false);
    }
  }

  function photo(size: { width: number; height: number } | null) {
    return (
      <View
        style={[
          styles.photo,
          size
            ? { width: size.width, height: size.height }
            : { aspectRatio: aspect },
        ]}
      >
        <Image
          source={{ uri: photoUri(source) }}
          style={StyleSheet.absoluteFill}
          contentFit="fill"
          accessibilityLabel={t("capture.photo")}
          onLoad={(event) =>
            setAspect(event.source.width / event.source.height)
          }
        />
        {drawing ? (
          <View
            style={StyleSheet.absoluteFill}
            accessible
            accessibilityRole="adjustable"
            accessibilityLabel={t("capture.box")}
            accessibilityActions={[
              { name: "increment", label: t("capture.larger") },
              { name: "decrement", label: t("capture.smaller") },
            ]}
            onAccessibilityAction={(event) =>
              resize(
                event.nativeEvent.actionName === "increment" ? step : -step,
              )
            }
            onStartShouldSetResponder={() => true}
            onMoveShouldSetResponder={() => true}
            onResponderTerminationRequest={() => false}
            onResponderGrant={(event) => setStart(point(event))}
            onResponderMove={(event) => {
              const box = start ? boxFrom(start, point(event)) : null;
              if (box) setDrawing({ ...drawing, box });
            }}
            onResponderRelease={() => setStart(null)}
          >
            <View
              pointerEvents="none"
              style={[styles.box, styles.drawn, place(drawing.box)]}
            />
          </View>
        ) : (
          jobs.map((job, index) => {
            const frame = frameOf(job);
            return frame ? (
              <View
                key={job.id}
                pointerEvents="none"
                style={[
                  styles.box,
                  dropped.includes(job.id) && styles.droppedBox,
                  place(frame),
                ]}
              >
                <AppText variant="caption" style={styles.number}>
                  {index + 1}
                </AppText>
              </View>
            ) : null;
          })
        )}
      </View>
    );
  }

  if (drawing)
    return (
      <SafeAreaView edges={["bottom"]} style={styles.drawing}>
        <Stack.Screen
          options={{
            title: drawing.job ? t("capture.adjust") : t("capture.addPiece"),
            headerLeft: () => (
              <HeaderAction
                label={t("capture.cancel")}
                onPress={() => setDrawing(null)}
              />
            ),
          }}
        />
        <AppText muted>{t("capture.drawHint")}</AppText>
        <View
          style={styles.stage}
          onLayout={(event) => setStage(event.nativeEvent.layout)}
        >
          {fit ? photo(fit) : null}
        </View>
        <View style={styles.row}>
          <Button
            label={t("capture.smaller")}
            secondary
            compact
            onPress={() => resize(-step)}
          />
          <Button
            label={t("capture.larger")}
            secondary
            compact
            onPress={() => resize(step)}
          />
        </View>
        <ErrorMessage message={error} />
        <Button
          label={t("capture.useBox")}
          busy={busy}
          onPress={() => {
            void applyBox();
          }}
        />
      </SafeAreaView>
    );

  return (
    <View style={styles.screen}>
      <Stack.Screen
        options={{
          title: t("capture.group.title"),
          headerLeft: () => (
            <HeaderAction
              label={t("capture.cancel")}
              onPress={() => router.back()}
            />
          ),
        }}
      />
      <FormScreen>
        <AppText muted>{t("capture.group.intro")}</AppText>
        {othersIgnored ? (
          <AppText accessibilityLiveRegion="polite">
            {t("capture.othersIgnored")}
          </AppText>
        ) : null}
        {photo(null)}
        {jobs.map((job, index) => {
          const thumb = job.prepared?.thumbnail ?? job.region?.cutout ?? null;
          const isDropped = dropped.includes(job.id);
          const title = titleOf(job);
          return (
            <View
              key={job.id}
              style={[styles.proposal, isDropped && styles.droppedRow]}
            >
              <View style={styles.thumb}>
                {thumb ? (
                  <Image
                    source={{ uri: photoUri(thumb) }}
                    style={styles.image}
                    contentFit="contain"
                    recyclingKey={`${job.id}-${thumb}`}
                  />
                ) : null}
              </View>
              <View style={styles.details}>
                <AppText
                  style={styles.label}
                >{`${index + 1}. ${title}`}</AppText>
                {job.region?.partial ? (
                  <AppText variant="caption" muted>
                    {t("capture.partial")}
                  </AppText>
                ) : null}
                <View style={styles.row}>
                  <Chip
                    label={t("capture.keep")}
                    accessibilityLabel={`${t("capture.keep")}, ${title}`}
                    selected={!isDropped}
                    onPress={() => toggle(job.id, false)}
                  />
                  <Chip
                    label={t("capture.drop")}
                    accessibilityLabel={`${t("capture.drop")}, ${title}`}
                    selected={isDropped}
                    onPress={() => toggle(job.id, true)}
                  />
                </View>
                {["ready", "review", "failed"].includes(job.state) &&
                !isDropped ? (
                  <Button
                    label={t("capture.adjust")}
                    secondary
                    compact
                    onPress={() =>
                      setDrawing({ job: job.id, box: frameOf(job) ?? startBox })
                    }
                  />
                ) : null}
              </View>
            </View>
          );
        })}
        <Button
          label={t("capture.addPiece")}
          secondary
          onPress={() => setDrawing({ job: null, box: startBox })}
        />
      </FormScreen>
      <SafeAreaView edges={["bottom"]} style={styles.footer}>
        <View style={styles.footerContent}>
          <ErrorMessage message={error} />
          <Button
            label={t("capture.done")}
            busy={busy}
            onPress={() => {
              void done();
            }}
          />
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.colors.background },
  drawing: {
    flex: 1,
    gap: theme.space.md,
    padding: theme.space.xl,
    backgroundColor: theme.colors.background,
  },
  stage: { flex: 1, alignItems: "center", justifyContent: "center" },
  photo: {
    width: "100%",
    borderRadius: theme.radius,
    borderCurve: "continuous",
    overflow: "hidden",
    backgroundColor: theme.colors.surface,
  },
  box: {
    position: "absolute",
    borderWidth: 2,
    borderRadius: 4,
    borderColor: theme.colors.accent,
  },
  drawn: {
    borderStyle: "dashed",
    backgroundColor: `${theme.colors.accentSoft}66`,
  },
  droppedBox: { borderColor: theme.colors.line },
  number: {
    alignSelf: "flex-start",
    margin: 4,
    paddingHorizontal: 6,
    borderRadius: 8,
    overflow: "hidden",
    color: theme.colors.accentText,
    backgroundColor: theme.colors.accent,
    fontWeight: "600",
  },
  proposal: { flexDirection: "row", gap: 12, alignItems: "flex-start" },
  droppedRow: { opacity: 0.55 },
  thumb: {
    width: 88,
    aspectRatio: 1,
    borderRadius: theme.radius,
    borderCurve: "continuous",
    borderWidth: 1,
    borderColor: theme.colors.line,
    overflow: "hidden",
    padding: 4,
    backgroundColor: theme.colors.background,
  },
  image: { width: "100%", height: "100%" },
  details: { flex: 1, gap: 8 },
  label: { fontWeight: "600" },
  row: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  footer: {
    backgroundColor: theme.colors.background,
    borderTopWidth: 1,
    borderColor: theme.colors.line,
  },
  footerContent: {
    width: "100%",
    maxWidth: 720,
    alignSelf: "center",
    paddingHorizontal: 24,
    paddingVertical: 12,
    gap: 12,
  },
});
