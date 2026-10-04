import { useEffect, useRef, useState } from "react";
import {
  AppState,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import Animated, { FadeIn, ReduceMotion } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { randomUUID } from "expo-crypto";
import { router } from "expo-router";
import {
  LiveScanView,
  type LiveScanHandle,
  type ScanCameraState,
  type ScanFrameEvent,
} from "../../modules/closet-vision/src";
import type { ScanMode } from "../../src/domain/closet";
import { captureJobs } from "../../src/domain/importing";
import {
  addScanCapture,
  heldPiece,
  previewBox,
  readFrame,
  restartScan,
  scanCols,
  scanFps,
  scanRows,
  scanSpeed,
  scanStep,
  speedWindow,
  startScan,
  type HeldPiece,
  type ScanStatus,
} from "../../src/domain/scan";
import { FixtureScanView } from "../../src/features/FixtureScanView";
import { ScanLift, type Sticker } from "../../src/features/ScanLift";
import { t } from "../../src/i18n";
import { now } from "../../src/state/clock";
import { useCloset } from "../../src/state/closet";
import { discardPhoto, photoUri } from "../../src/storage/local";
import { fixtures } from "../../src/testing/fixtures";
import {
  Footer,
  HeaderItem,
  Screen,
  Segmented,
  Text,
  Tile,
} from "../../src/ui";
import { announce } from "../../src/ui/announce";
import { CameraFrame } from "../../src/ui/CameraFrame";
import { motion } from "../../src/ui/motion";
import { theme } from "../../src/ui/theme";
import { useColors } from "../../src/ui/useColors";

type Guide = ScanStatus | "failed";

const guideKeys = {
  find: "scan.status.find",
  show: "scan.status.show",
  hold: "scan.status.hold",
  taken: "scan.status.taken",
  ready: "scan.status.ready",
  failed: "scan.captureFailed",
} as const;

const aspect = scanCols / scanRows;

const thumbIn = FadeIn.duration(motion.duration.base)
  .easing(motion.easing.silk)
  .reduceMotion(ReduceMotion.Never);

type Lift = { id: string; sticker: Sticker | null; file: string | null };

function useSteadyGuide(raw: Guide): Guide {
  const [shown, setShown] = useState<Guide>(raw);
  const takenAt = useRef(0);

  useEffect(() => {
    const at = Date.now();
    const instant = raw === "taken" || raw === "failed";
    const wait = instant
      ? 0
      : Math.max(
          motion.timer.dwell,
          takenAt.current + motion.timer.linger - at,
        );
    if (raw === "taken") takenAt.current = at;
    const id = setTimeout(() => setShown(raw), wait);
    return () => clearTimeout(id);
  }, [raw]);

  return shown;
}

function useSpoken(
  guide: Guide,
  active: boolean,
  lastSpoken: { current: number },
) {
  useEffect(() => {
    if (!active || guide === "taken") return;
    const text =
      guide === "ready" ? t("scan.status.readyVoice") : t(guideKeys[guide]);
    const wait = Math.max(
      0,
      lastSpoken.current + motion.timer.announce - Date.now(),
    );
    const id = setTimeout(() => {
      lastSpoken.current = Date.now();
      announce(text, { queue: false });
    }, wait);
    return () => clearTimeout(id);
  }, [guide, active, lastSpoken]);
}

export default function Scan() {
  const { closet, update } = useCloset();
  const colors = useColors();
  const [scanId] = useState(() => randomUUID());
  const [facing, setFacing] = useState<"front" | "back">("back");
  const [allowed, setAllowed] = useState(false);
  const [camera, setCamera] = useState<ScanCameraState | "starting">(
    "starting",
  );
  const [status, setStatus] = useState<Guide>("find");
  const [seen, setSeen] = useState<HeldPiece | null>(null);
  const [readout, setReadout] = useState(false);
  const [speed, setSpeed] = useState<{ fps: number; parse: number } | null>(
    null,
  );
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [lift, setLift] = useState<Lift | null>(null);
  const [settled, setSettled] = useState<string[]>([]);
  const view = useRef<LiveScanHandle>(null);
  const strip = useRef<ScrollView>(null);
  const scan = useRef(startScan);
  const held = useRef<HeldPiece | null>(null);
  const readings = useRef<{ at: number; parse: number }[]>([]);
  const speedAt = useRef(0);
  const taking = useRef(false);
  const captures = useRef(0);
  const lastSpoken = useRef(0);
  const jobs = captureJobs(closet, scanId);
  const mode = closet.styling.scan;
  const ready = camera === "ready";
  const guide = useSteadyGuide(status);
  const found =
    ready && Boolean(seen) && (guide === "hold" || guide === "ready");
  useSpoken(guide, ready, lastSpoken);

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

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") restart();
    });
    return () => subscription.remove();
  }, []);

  async function take(piece: HeldPiece) {
    if (!view.current) return;
    taking.current = true;
    const id = randomUUID();
    const mirrored = facing === "front";
    captures.current += 1;
    try {
      if (fixtures.failCapture && captures.current <= fixtures.failCapture)
        throw new Error("fixture");
      const shot = await view.current.capture(id, piece.box, piece.kind);
      await update((current) =>
        addScanCapture(current, scanId, {
          id,
          source: shot.photo,
          createdAt: now().toISOString(),
          ...(shot.region ? { region: shot.region } : { crop: shot.box }),
        }),
      );
      const sticker = shot.sticker
        ? {
            uri: photoUri(shot.sticker.name),
            frame: previewBox(shot.sticker.frame, size, aspect, mirrored),
            mirrored,
          }
        : null;
      if (sticker) setLift({ id, sticker, file: shot.sticker?.name ?? null });
      else landed(id, null);
    } catch {
      scan.current = { ...scan.current, last: null };
      setStatus("failed");
      lastSpoken.current = Date.now();
      announce(t("scan.captureFailed"), { queue: false });
      taking.current = false;
    }
  }

  function settle(id: string) {
    setSettled((current) => [...current, id]);
  }

  function landed(id: string, file: string | null) {
    if (file) void discardPhoto(file);
    settle(id);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const job = closet.imports.find((item) => item.id === id);
    lastSpoken.current = Date.now();
    announce(
      t("scan.pieceAdded", {
        name: job?.name ?? t("scan.traySlot", { number: jobs.length + 1 }),
      }),
    );
    setLift(null);
    taking.current = false;
  }

  function capture(piece: HeldPiece) {
    scan.current = {
      ...scan.current,
      hold: null,
      held: null,
      last: { kind: piece.kind, colour: piece.colour },
    };
    setStatus("taken");
    void take(piece);
  }

  function press() {
    const piece = held.current;
    if (taking.current || !piece) return;
    capture(piece);
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
    if (readout && frame.at - speedAt.current >= 1000) {
      speedAt.current = frame.at;
      setSpeed(scanSpeed(readings.current));
    }
    if (taking.current) return;
    const step = scanStep(scan.current, frame, mode);
    scan.current = step.state;
    const piece = step.state.baseline
      ? heldPiece(step.state.baseline, frame)
      : null;
    held.current = piece;
    setSeen(piece);
    setStatus(step.status);
    if (step.capture) capture(step.capture);
  }

  function restart() {
    scan.current = restartScan(scan.current);
    held.current = null;
    setSeen(null);
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

  function toggleReadout() {
    setReadout((shown) => !shown);
  }

  const library = () =>
    router.dismissTo({ pathname: "/capture", params: { open: "library" } });

  if (camera === "denied" || camera === "unavailable")
    return (
      <Screen media scroll={false} title={t("scan.title")}>
        <CameraFrame
          full
          unavailable={
            camera === "denied"
              ? {
                  title: t("common.cameraOff"),
                  action: {
                    label: t("common.openSettings"),
                    onPress: () => void Linking.openSettings(),
                    media: true,
                  },
                  secondary: {
                    label: t("capture.choosePhotos"),
                    onPress: library,
                    variant: "quiet",
                    media: true,
                  },
                }
              : {
                  title: t("scan.unavailable"),
                  action: {
                    label: t("capture.choosePhotos"),
                    onPress: library,
                    media: true,
                  },
                }
          }
        />
      </Screen>
    );

  const box =
    seen && size.width
      ? previewBox(seen.box, size, aspect, facing === "front")
      : null;
  const shelf = jobs.filter((job) => settled.includes(job.id));
  const names = shelf
    .map((job, index) => job.name ?? t("scan.traySlot", { number: index + 1 }))
    .join(", ");
  const guideText = ready ? t(guideKeys[guide]) : t("scan.starting");
  const speedText = speed ? t("scan.speed", speed) : null;

  return (
    <Screen
      media
      scroll={false}
      title={t("scan.title")}
      actions={
        <HeaderItem
          icon="camera.rotate"
          label={t("scan.switch")}
          testID="header-switch"
          onPress={() => {
            setFacing((current) => (current === "back" ? "front" : "back"));
            restart();
          }}
        />
      }
      footer={
        <Footer
          media
          primary={{
            label: t("common.done"),
            onPress: finish,
            disabled: jobs.length === 0,
          }}
        />
      }
    >
      <CameraFrame
        full
        outline={
          box ? { frame: box, state: found ? "found" : "searching" } : null
        }
        shutter={{ onPress: press, disabled: !found || Boolean(lift) }}
        tray={
          <View
            accessible={shelf.length > 0}
            accessibilityRole="image"
            accessibilityLabel={
              shelf.length
                ? t("scan.trayLabel", { count: shelf.length, names })
                : undefined
            }
            accessibilityElementsHidden={shelf.length === 0}
            style={styles.trayBox}
          >
            <ScrollView
              ref={strip}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.tray}
              onContentSizeChange={() =>
                strip.current?.scrollToEnd({ animated: false })
              }
            >
              {shelf.map((job, index) => (
                <Animated.View
                  key={job.id}
                  entering={thumbIn}
                  testID={`tray-slot-${index + 1}`}
                  style={[styles.slot, { backgroundColor: colors.canvas }]}
                >
                  <Tile
                    size="thumb"
                    raw
                    image={{
                      uri: photoUri(
                        job.prepared?.thumbnail ??
                          job.region?.cutout ??
                          job.source,
                      ),
                    }}
                    accessibilityLabel={
                      job.name ?? t("scan.traySlot", { number: index + 1 })
                    }
                  />
                </Animated.View>
              ))}
            </ScrollView>
          </View>
        }
        controls={
          <View style={styles.controls}>
            <Segmented
              media
              options={[
                { id: "auto", label: t("scan.auto") },
                { id: "manual", label: t("scan.manual") },
              ]}
              value={mode}
              onChange={choose}
            />
          </View>
        }
      >
        <View
          style={StyleSheet.absoluteFill}
          onLayout={(event) => setSize(event.nativeEvent.layout)}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        >
          {fixtures.scan ? (
            <FixtureScanView
              ref={view}
              style={StyleSheet.absoluteFill}
              facing={facing}
              active={allowed}
              frozen={Boolean(lift)}
              fps={scanFps}
              onFrame={(event) => onFrame(event.nativeEvent)}
              onCamera={(event) => setCamera(event.nativeEvent.state)}
            />
          ) : (
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
          )}
        </View>
        {box && found ? (
          <View
            testID="moment-found"
            pointerEvents="none"
            style={[
              styles.marker,
              {
                left: box.x,
                top: box.y,
                width: box.width,
                height: box.height,
              },
            ]}
          />
        ) : null}
        {lift?.sticker ? (
          <ScanLift
            key={lift.id}
            sticker={lift.sticker}
            onSettle={() => settle(lift.id)}
            onLanded={() => landed(lift.id, lift.file)}
          />
        ) : null}
        {readout && speedText ? (
          <View
            testID="scan-readout"
            accessible
            accessibilityLabel={t("scan.speedLabel", speed ?? {})}
            style={[styles.readout, { backgroundColor: colors.scrimPill }]}
          >
            <Text role="mark" tone="onMedia">
              {speedText}
            </Text>
          </View>
        ) : null}
        <View style={styles.guideSlot}>
          <Pressable
            testID="scan-guide"
            accessible
            accessibilityLabel={guideText}
            accessibilityActions={[
              {
                name: "readout",
                label: t(readout ? "scan.speedHide" : "scan.speedShow"),
              },
            ]}
            onAccessibilityAction={toggleReadout}
            onLongPress={toggleReadout}
            hitSlop={theme.space.md}
            style={[styles.pill, { backgroundColor: colors.scrimPill }]}
          >
            <Text role="mark" tone="onMedia" style={styles.centred}>
              {guideText}
            </Text>
          </Pressable>
        </View>
      </CameraFrame>
    </Screen>
  );
}

const styles = StyleSheet.create({
  trayBox: { minHeight: 56 },
  tray: { gap: theme.space.sm },
  slot: {
    width: 56,
    height: 56,
    borderRadius: theme.radius.sm,
    borderCurve: "continuous",
    overflow: "hidden",
  },
  controls: { alignItems: "center" },
  marker: { position: "absolute" },
  readout: {
    position: "absolute",
    top: theme.space.sm,
    left: theme.space.sm,
    paddingHorizontal: theme.space.sm,
    paddingVertical: theme.space.xs,
    borderRadius: theme.radius.full,
  },
  guideSlot: {
    position: "absolute",
    left: theme.space.lg,
    right: theme.space.lg,
    bottom: theme.space.lg,
    alignItems: "center",
  },
  pill: {
    paddingHorizontal: theme.space.md,
    paddingVertical: theme.space.sm,
    borderRadius: theme.radius.full,
  },
  centred: { textAlign: "center" },
});
