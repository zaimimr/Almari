import { useEffect, useRef, useState } from "react";
import { Linking, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { randomUUID } from "expo-crypto";
import { Stack, router } from "expo-router";
import {
  LiveScanView,
  type LiveScanHandle,
  type ScanCameraState,
  type ScanFrameEvent,
} from "../../modules/closet-vision/src";
import { captureJobs } from "../../src/domain/importing";
import {
  addScanCapture,
  readFrame,
  restartScan,
  scanFps,
  scanSpeed,
  scanStep,
  speedWindow,
  startScan,
  type HeldPiece,
  type ScanStatus,
} from "../../src/domain/scan";
import { t } from "../../src/i18n";
import { useCloset } from "../../src/state/closet";
import { photoUri } from "../../src/storage/local";
import {
  AppText,
  Button,
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
} as const;

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
  const view = useRef<LiveScanHandle>(null);
  const scan = useRef(startScan);
  const readings = useRef<{ at: number; parse: number }[]>([]);
  const taking = useRef(false);
  const jobs = captureJobs(closet, scanId);

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
    } catch {
      scan.current = { ...scan.current, last: null };
      setFailed(true);
    } finally {
      taking.current = false;
    }
  }

  function onFrame(event: ScanFrameEvent) {
    const frame = readFrame(event);
    readings.current = [
      ...readings.current.slice(1 - speedWindow),
      { at: frame.at, parse: frame.parseMs },
    ];
    if (showSpeed) setSpeed(scanSpeed(readings.current));
    if (taking.current) return;
    const step = scanStep(scan.current, frame);
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
    <View style={styles.screen}>
      {header}
      <LiveScanView
        ref={view}
        style={styles.camera}
        facing={facing}
        active={allowed}
        fps={scanFps}
        onFrame={(event) => onFrame(event.nativeEvent)}
        onCamera={(event) => setCamera(event.nativeEvent.state)}
      />
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
        {jobs.length ? (
          <ScrollView horizontal contentContainerStyle={styles.strip}>
            {jobs.map((job) => {
              const image =
                job.prepared?.thumbnail ?? job.region?.cutout ?? job.source;
              return (
                <View
                  key={job.id}
                  style={styles.thumb}
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
        ) : null}
        <View style={styles.row}>
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
  image: { width: "100%", height: "100%" },
  row: { flexDirection: "row", flexWrap: "wrap", gap: theme.space.sm },
});
