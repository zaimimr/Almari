import { useEffect, useRef, useState } from "react";
import { Linking, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { randomUUID } from "expo-crypto";
import { Stack, router } from "expo-router";
import {
  LiveScanView,
  type LiveScanHandle,
  type ScanCameraState,
  type ScanFrameEvent,
} from "../../modules/closet-vision/src";
import type { Frame, ScanMode } from "../../src/domain/closet";
import { captureJobs } from "../../src/domain/importing";
import {
  addScanCapture,
  previewBox,
  readFrame,
  restartScan,
  scanCols,
  scanFps,
  scanRows,
  scanSpeed,
  scanStep,
  shutter,
  speedWindow,
  startScan,
  type HeldPiece,
  type ScanStatus,
} from "../../src/domain/scan";
import { ScanLift, type Sticker } from "../../src/features/ScanLift";
import { t } from "../../src/i18n";
import { useCloset } from "../../src/state/closet";
import { discardPhoto, photoUri } from "../../src/storage/local";
import {
  AppText,
  Button,
  Chip,
  ErrorMessage,
  HeaderAction,
  Notice,
  Screen,
} from "../../src/ui";
import { theme } from "../../src/ui/theme";

const statusKeys = {
  find: "scan.status.find",
  show: "scan.status.show",
  hold: "scan.status.hold",
  taken: "scan.status.taken",
  ready: "scan.status.ready",
} as const;

const aspect = scanCols / scanRows;

type Lift = {
  id: string;
  box: Frame;
  done: boolean;
  sticker: Sticker | null;
  file: string | null;
};

export default function Scan() {
  const { closet, update } = useCloset();
  const [scanId] = useState(() => randomUUID());
  const [facing, setFacing] = useState<"front" | "back">("back");
  const [allowed, setAllowed] = useState(false);
  const [camera, setCamera] = useState<ScanCameraState | "starting">(
    "starting",
  );
  const [status, setStatus] = useState<ScanStatus>("find");
  const [showSpeed, setShowSpeed] = useState(__DEV__);
  const [speed, setSpeed] = useState<{ fps: number; parse: number } | null>(
    null,
  );
  const [failed, setFailed] = useState(false);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [lift, setLift] = useState<Lift | null>(null);
  const view = useRef<LiveScanHandle>(null);
  const root = useRef<View>(null);
  const slotView = useRef<View>(null);
  const strip = useRef<ScrollView>(null);
  const scan = useRef(startScan);
  const readings = useRef<{ at: number; parse: number }[]>([]);
  const taking = useRef(false);
  const jobs = captureJobs(closet, scanId);
  const mode = closet.styling.scan;

  useEffect(() => {
    let live = true;
    ImagePicker.requestCameraPermissionsAsync()
      .then((permission) => {
        if (!live) return;
        if (permission.granted) setAllowed(true);
        else setCamera("denied");
      })
      .catch(() => {
        if (live) setCamera("unavailable");
      });
    return () => {
      live = false;
    };
  }, []);

  async function take(held: HeldPiece) {
    if (!view.current) return;
    taking.current = true;
    setFailed(false);
    const id = randomUUID();
    const mirrored = facing === "front";
    setLift({
      id,
      box: previewBox(held.box, size, aspect),
      done: false,
      sticker: null,
      file: null,
    });
    try {
      const shot = await view.current.capture(id, held.box, held.kind);
      await update((current) =>
        addScanCapture(current, scanId, {
          id,
          source: shot.photo,
          createdAt: new Date().toISOString(),
          ...(shot.region ? { region: shot.region } : { crop: shot.box }),
        }),
      );
      setLift((current) =>
        current?.id === id
          ? {
              ...current,
              done: true,
              sticker: shot.sticker
                ? {
                    uri: photoUri(shot.sticker.name),
                    frame: previewBox(
                      shot.sticker.frame,
                      size,
                      aspect,
                      mirrored,
                    ),
                    mirrored,
                  }
                : null,
              file: shot.sticker?.name ?? null,
            }
          : current,
      );
    } catch {
      scan.current = { ...scan.current, last: null };
      setFailed(true);
      setLift(null);
      taking.current = false;
    }
  }

  function landed() {
    if (lift?.file) void discardPhoto(lift.file);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setLift(null);
    taking.current = false;
  }

  function slot() {
    return new Promise<Frame | null>((resolve) => {
      const target = slotView.current;
      const base = root.current;
      if (!target || !base) return resolve(null);
      base.measureInWindow((left, top) =>
        target.measureInWindow((x, y, width, height) =>
          resolve({ x: x - left, y: y - top, width, height }),
        ),
      );
    });
  }

  function press() {
    if (taking.current) return;
    const step = shutter(scan.current);
    scan.current = step.state;
    if (!step.capture) return;
    setStatus("taken");
    void take(step.capture);
  }

  function choose(next: ScanMode) {
    scan.current = { ...scan.current, hold: null, held: null };
    void update((current) => ({
      ...current,
      styling: { ...current.styling, scan: next },
    }));
  }

  function onFrame(event: ScanFrameEvent) {
    const frame = readFrame(event);
    readings.current = [
      ...readings.current.slice(1 - speedWindow),
      { at: frame.at, parse: frame.parseMs },
    ];
    if (showSpeed) setSpeed(scanSpeed(readings.current));
    if (taking.current) return;
    const step = scanStep(scan.current, frame, mode);
    scan.current = step.state;
    setStatus(step.status);
    if (step.capture) void take(step.capture);
  }

  function restart() {
    scan.current = restartScan(scan.current);
    setStatus("find");
  }

  function finish() {
    if (jobs.length)
      router.replace({
        pathname: "/capture/group/[id]",
        params: { id: scanId },
      });
    else router.back();
  }

  const header = (
    <Stack.Screen
      options={{
        title: t("scan.title"),
        headerLeft: () => (
          <HeaderAction
            label={t("common.close")}
            onPress={() => router.back()}
          />
        ),
        headerRight: () => (
          <HeaderAction label={t("capture.done")} onPress={finish} />
        ),
      }}
    />
  );

  if (camera === "denied" || camera === "unavailable")
    return (
      <Screen centered>
        {header}
        <Notice
          message={t(
            camera === "denied" ? "problem.camera-off" : "scan.unavailable",
          )}
          actions={[
            ...(camera === "denied"
              ? [
                  {
                    label: t("problem.openSettings"),
                    onPress: () => void Linking.openSettings(),
                  },
                ]
              : []),
            { label: t("common.goBack"), onPress: () => router.back() },
          ]}
        />
      </Screen>
    );

  return (
    <View ref={root} style={styles.screen}>
      {header}
      <View
        style={styles.camera}
        onLayout={(event) => setSize(event.nativeEvent.layout)}
      >
        <LiveScanView
          ref={view}
          style={StyleSheet.absoluteFill}
          facing={facing}
          active={allowed}
          frozen={Boolean(lift)}
          fps={scanFps}
          onFrame={(event) => onFrame(event.nativeEvent)}
          onCamera={(event) => setCamera(event.nativeEvent.state)}
        />
        {mode === "manual" && camera === "ready" ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t("scan.shutter")}
            disabled={Boolean(lift)}
            onPress={press}
            style={({ pressed }) => [
              styles.shutter,
              (pressed || lift) && styles.pressed,
            ]}
          >
            <View style={styles.shutterButton} />
          </Pressable>
        ) : null}
      </View>
      <SafeAreaView edges={["bottom"]} style={styles.panel}>
        <Pressable
          accessibilityLiveRegion="polite"
          onLongPress={() => setShowSpeed((shown) => !shown)}
        >
          <AppText variant="heading">
            {camera === "ready" ? t(statusKeys[status]) : t("scan.starting")}
          </AppText>
        </Pressable>
        {showSpeed && speed ? (
          <AppText variant="caption" muted>
            {t("scan.speed", speed)}
          </AppText>
        ) : null}
        <ErrorMessage message={failed ? t("problem.failed") : null} />
        <ScrollView
          ref={strip}
          horizontal
          style={styles.stripBox}
          contentContainerStyle={styles.strip}
          onContentSizeChange={() =>
            strip.current?.scrollToEnd({ animated: false })
          }
        >
          {jobs.map((job) => {
            const image =
              job.prepared?.thumbnail ?? job.region?.cutout ?? job.source;
            const flying = job.id === lift?.id;
            return (
              <View
                key={job.id}
                ref={flying ? slotView : undefined}
                style={[styles.thumb, flying && styles.hidden]}
                accessible
                accessibilityLabel={job.name ?? t("capture.jobPhoto")}
              >
                <Image
                  source={{ uri: photoUri(image) }}
                  style={styles.image}
                  contentFit="contain"
                  recyclingKey={`${job.id}-${image}`}
                />
              </View>
            );
          })}
        </ScrollView>
        <View style={styles.row}>
          {(
            [
              { id: "auto", label: t("scan.auto") },
              { id: "manual", label: t("scan.manual") },
            ] as const
          ).map((option) => (
            <Chip
              key={option.id}
              label={option.label}
              selected={mode === option.id}
              onPress={() => choose(option.id)}
            />
          ))}
          <Button
            label={t("scan.switch")}
            secondary
            compact
            onPress={() => {
              setFacing((current) => (current === "back" ? "front" : "back"));
              restart();
            }}
          />
          <Button label={t("scan.again")} secondary compact onPress={restart} />
        </View>
      </SafeAreaView>
      {lift ? (
        <ScanLift
          key={lift.id}
          camera={size}
          box={lift.box}
          done={lift.done}
          sticker={lift.sticker}
          slot={slot}
          onLanded={landed}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.colors.background },
  camera: { flex: 1, backgroundColor: theme.colors.ink },
  panel: {
    gap: theme.space.sm,
    paddingHorizontal: theme.space.xl,
    paddingTop: theme.space.md,
    paddingBottom: theme.space.md,
    backgroundColor: theme.colors.background,
    borderTopWidth: 1,
    borderColor: theme.colors.line,
  },
  shutter: {
    position: "absolute",
    alignSelf: "center",
    bottom: theme.space.xl,
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 4,
    borderColor: theme.colors.accentText,
    alignItems: "center",
    justifyContent: "center",
  },
  shutterButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: theme.colors.accentText,
  },
  pressed: { opacity: 0.6 },
  stripBox: { height: 64, flexGrow: 0 },
  strip: { gap: theme.space.sm },
  thumb: {
    width: 64,
    height: 64,
    borderRadius: theme.radius,
    borderCurve: "continuous",
    borderWidth: 1,
    borderColor: theme.colors.line,
    overflow: "hidden",
    padding: 4,
    backgroundColor: theme.colors.surface,
  },
  hidden: { opacity: 0 },
  image: { width: "100%", height: "100%" },
  row: { flexDirection: "row", flexWrap: "wrap", gap: theme.space.sm },
});
