import { useRef, useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Image } from "expo-image";
import { randomUUID } from "expo-crypto";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import Animated, { FadeIn, ReduceMotion } from "react-native-reanimated";
import ClosetVision from "../../../modules/closet-vision/src";
import type { Frame, ImportJob } from "../../../src/domain/closet";
import {
  boxAround,
  boxFrom,
  holds,
  pickedBox,
  resizeBox,
  toggled,
  toggledAll,
} from "../../../src/domain/capture";
import {
  acceptImports,
  addToCapture,
  captureMembers,
  cropCapture,
  isSettled,
  jobFrame,
  removeImport,
  setKeepAsSet,
} from "../../../src/domain/importing";
import { jobPiece } from "../../../src/features/capture/jobs";
import {
  PickPulse,
  RegionMark,
  place,
} from "../../../src/features/capture/RegionMark";
import { t } from "../../../src/i18n";
import { useDiscardChanges } from "../../../src/navigation/useDiscardChanges";
import { useCloset } from "../../../src/state/closet";
import { now } from "../../../src/state/clock";
import { changeImports } from "../../../src/state/imports";
import { setLastAdded } from "../../../src/state/launch";
import { photoUri } from "../../../src/storage/local";
import {
  Button,
  Footer,
  Row,
  Rows,
  Screen,
  Symbol,
  Text,
  Tile,
} from "../../../src/ui";
import { confirmAction } from "../../../src/ui/confirm";
import { motion } from "../../../src/ui/motion";
import { ScanSweep } from "../../../src/ui/ScanSweep";
import { theme } from "../../../src/ui/theme";
import { useColors } from "../../../src/ui/useColors";
import { useLargeText } from "../../../src/ui/useLargeText";

const step = 0.05;
const moveStep = 0.05;

const handle = 22;
const dragThreshold = 4;

type Point = { x: number; y: number };

type Drag =
  | { mode: "draw"; start: Point; moved: boolean }
  | { mode: "move"; start: Point; offset: Point; moved: boolean }
  | { mode: "resize"; start: Point; anchor: Point; moved: boolean };

type Drawing = { job: string | null; box: Frame | null };

const clamp = (value: number, max: number) =>
  Math.min(Math.max(value, 0), Math.max(max, 0));

const area = (frame: Frame) => frame.width * frame.height;

const boxIn = FadeIn.duration(motion.duration.base)
  .easing(motion.easing.fall)
  .reduceMotion(ReduceMotion.Never);

function nameOf(job: ImportJob, number: number) {
  if (job.name) return job.name;
  return job.region
    ? t(`region.${job.region.kind}`)
    : t("capture.photoNumber", { number });
}

function foundNothing(job: ImportJob) {
  return job.state === "failed" && job.error === "no-clothing" && !job.region;
}

const percent = (value: number) => Math.round(value * 100);

export default function PiecesFound() {
  const { id, add } = useLocalSearchParams<{ id: string; add?: string }>();
  const entry = add === "1";
  const { closet, update } = useCloset();
  const colors = useColors();
  const { ax } = useLargeText();
  const jobs = captureMembers(closet, id);
  const [initialSet] = useState(() => jobs.some((job) => job.keepAsSet));
  const [dropped, setDropped] = useState<string[]>([]);
  const [keepSet, setKeepSet] = useState(initialSet);
  const [drawing, setDrawing] = useState<Drawing | null>(() =>
    entry || (jobs.length > 0 && jobs.every(foundNothing))
      ? { job: null, box: null }
      : null,
  );
  const [picking, setPicking] = useState<Point | null>(null);
  const [picks, setPicks] = useState(0);
  const [added, setAdded] = useState(false);
  const pickRun = useRef(0);
  const gesture = useRef<Drag | null>(null);
  const origin = useRef<Point>({ x: 0, y: 0 });
  const [canvas, setCanvas] = useState({ width: 0, height: 0 });
  const [width, setWidth] = useState(0);
  const [aspect, setAspect] = useState(0.75);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dirty = dropped.length > 0 || keepSet !== initialSet;
  const allowClose = useDiscardChanges(dirty, busy);

  if (!jobs.length)
    return (
      <Screen
        title={t("capture.group.title")}
        headerTitleVisible
        gone={{ title: t("capture.group.gone") }}
      />
    );

  const scanned = new Set(jobs.map((job) => job.source)).size > 1;
  const source =
    jobs.find((job) => job.id === drawing?.job)?.source ?? jobs[0]!.source;
  const kept = jobs.filter((job) => !dropped.includes(job.id));
  const adding = kept.filter(
    (job) => job.state === "ready" || job.state === "review",
  );
  const waiting = kept.some((job) => !isSettled(job));
  const height = width / aspect;
  const numbered = jobs.map((job, index) => ({ job, number: index + 1 }));
  const layered = [...numbered].sort(
    (a, b) => area(jobFrame(b.job)) - area(jobFrame(a.job)),
  );

  function point(x: number, y: number) {
    return {
      x: width ? clamp(x / width, 1) : 0,
      y: height ? clamp(y / height, 1) : 0,
    };
  }

  function setBox(box: Frame | null) {
    setDrawing((current) => (current ? { ...current, box } : current));
  }

  async function pick(at: Point) {
    if (!drawing || busy) return;
    const run = (pickRun.current += 1);
    setPicking(at);
    const found = await ClosetVision.pickGarment(
      photoUri(source),
      at.x,
      at.y,
    ).catch(() => null);
    if (run !== pickRun.current) return;
    setPicking(null);
    const picked = found ? pickedBox(found) : null;
    const hit = picked && holds(picked, at) ? picked : null;
    const box = hit ?? boxAround(at);
    void (hit
      ? Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
      : Haptics.selectionAsync());
    setPicks((count) => count + 1);
    setBox(box);
  }

  function moveBox(dx: number, dy: number) {
    const box = drawing?.box;
    if (!box) return;
    setBox({
      ...box,
      x: clamp(box.x + dx, 1 - box.width),
      y: clamp(box.y + dy, 1 - box.height),
    });
  }

  function grab(at: Point): Drag {
    const box = drawing?.box;
    if (!box) return { mode: "draw", start: at, moved: false };
    const near = (x: number, y: number) =>
      Math.abs((at.x - x) * width) < handle &&
      Math.abs((at.y - y) * height) < handle;
    const corners = [
      [box.x, box.y, box.x + box.width, box.y + box.height],
      [box.x + box.width, box.y, box.x, box.y + box.height],
      [box.x, box.y + box.height, box.x + box.width, box.y],
      [box.x + box.width, box.y + box.height, box.x, box.y],
    ] as const;
    const corner = corners
      .filter(([x, y]) => near(x, y))
      .sort(
        ([ax, ay], [bx, by]) =>
          Math.hypot((at.x - ax) * width, (at.y - ay) * height) -
          Math.hypot((at.x - bx) * width, (at.y - by) * height),
      )[0];
    if (corner)
      return {
        mode: "resize",
        start: at,
        anchor: { x: corner[2], y: corner[3] },
        moved: false,
      };
    const inside =
      at.x >= box.x &&
      at.x <= box.x + box.width &&
      at.y >= box.y &&
      at.y <= box.y + box.height;
    return inside
      ? {
          mode: "move",
          start: at,
          offset: { x: at.x - box.x, y: at.y - box.y },
          moved: false,
        }
      : { mode: "draw", start: at, moved: false };
  }

  function drag(current: Drag, at: Point) {
    if (
      !current.moved &&
      Math.hypot(
        (at.x - current.start.x) * width,
        (at.y - current.start.y) * height,
      ) < dragThreshold
    )
      return;
    const box = drawing?.box;
    if (current.mode === "move" && box) {
      current.moved = true;
      setBox({
        ...box,
        x: clamp(at.x - current.offset.x, 1 - box.width),
        y: clamp(at.y - current.offset.y, 1 - box.height),
      });
      return;
    }
    const next = boxFrom(
      current.mode === "resize" ? current.anchor : current.start,
      at,
    );
    if (!next) return;
    if (!current.moved) {
      pickRun.current += 1;
      setPicking(null);
    }
    current.moved = true;
    setBox(next);
  }

  function centreBox(at: Point) {
    const box = drawing?.box;
    if (!box) return;
    setBox({
      ...box,
      x: clamp(at.x - box.width / 2, 1 - box.width),
      y: clamp(at.y - box.height / 2, 1 - box.height),
    });
  }

  function resize(change: number) {
    const box = drawing?.box;
    if (box) setBox(resizeBox(box, change));
  }

  function toggle(job: string) {
    void Haptics.selectionAsync();
    setDropped((current) => toggled(current, job));
  }

  function toggleAll() {
    void Haptics.selectionAsync();
    setDropped((current) =>
      toggledAll(
        jobs.map((job) => job.id),
        current,
      ),
    );
  }

  function startAdding() {
    setError(null);
    setDrawing({ job: null, box: null });
  }

  function clearMarks() {
    void Haptics.selectionAsync();
    setDropped(jobs.map((job) => job.id));
    setDrawing({ job: null, box: null });
    pickRun.current += 1;
    setPicking(null);
    setError(null);
  }

  function stopDrawing() {
    pickRun.current += 1;
    setPicking(null);
    setError(null);
    if (entry && !added && drawing?.job === null) router.back();
    else setDrawing(null);
  }

  async function applyBox() {
    if (!drawing?.box || busy || picking) return;
    const { job, box } = drawing;
    setBusy(true);
    setError(null);
    try {
      await changeImports(update, (current) =>
        job
          ? cropCapture(current, job, box, `${job}-${randomUUID()}`)
          : addToCapture(current, id, randomUUID(), box, now().toISOString()),
      );
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setAdded(true);
      setDrawing(null);
    } catch {
      setError(t("capture.saveFailed"));
    } finally {
      setBusy(false);
    }
  }

  function review(job: string) {
    router.push({
      pathname: "/capture/[id]",
      params: { id: job, run: adding.map((item) => item.id).join(",") },
    });
  }

  async function removeAll() {
    if (busy) return;
    if (
      !(await confirmAction(t("capture.removeTitle"), "", t("capture.remove")))
    )
      return;
    setBusy(true);
    setError(null);
    try {
      await changeImports(update, (current) =>
        jobs.reduce((result, job) => removeImport(result, job.id), current),
      );
      allowClose();
      if (entry) router.dismissTo("/capture");
      else router.back();
    } catch {
      setError(t("capture.saveFailed"));
      setBusy(false);
    }
  }

  async function done() {
    if (busy || waiting || !adding.length) return;
    const next = adding.find((job) => job.state === "review");
    const ids = adding.map((job) => job.id);
    let emptied = false;
    setBusy(true);
    setError(null);
    try {
      await changeImports(update, (current) => {
        const settled = setKeepAsSet(
          dropped.reduce((result, job) => removeImport(result, job), current),
          id,
          keepSet && kept.length > 1,
        );
        if (next) return settled;
        const accepted = acceptImports(settled, ids);
        emptied = accepted.imports.length === 0;
        return accepted;
      });
      setDropped([]);
      setBusy(false);
      if (next) {
        review(next.id);
        return;
      }
      setLastAdded(ids);
      allowClose();
      if (emptied) router.dismissTo("/closet");
      else if (entry) router.dismissTo("/capture");
      else router.back();
    } catch {
      setError(t("capture.saveFailed"));
      setBusy(false);
    }
  }

  const box = drawing?.box ?? null;

  const drawArea = drawing ? (
    <View
      style={StyleSheet.absoluteFill}
      testID="draw-area"
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel={t("capture.box")}
      accessibilityValue={
        box
          ? {
              text: t("capture.boxValue", {
                width: percent(box.width),
                height: percent(box.height),
                x: percent(box.x),
                y: percent(box.y),
              }),
            }
          : undefined
      }
      accessibilityActions={[
        { name: "increment", label: t("capture.larger") },
        { name: "decrement", label: t("capture.smaller") },
        {
          name: "up",
          label: t("common.move", { direction: t("direction.up") }),
        },
        {
          name: "down",
          label: t("common.move", { direction: t("direction.down") }),
        },
        {
          name: "left",
          label: t("common.move", { direction: t("direction.left") }),
        },
        {
          name: "right",
          label: t("common.move", { direction: t("direction.right") }),
        },
      ]}
      onAccessibilityAction={(event) => {
        const action = event.nativeEvent.actionName;
        if (!box) {
          setBox(boxAround({ x: 0.5, y: 0.5 }, 0.5));
          return;
        }
        if (action === "increment") resize(step);
        else if (action === "decrement") resize(-step);
        else if (action === "up") moveBox(0, -moveStep);
        else if (action === "down") moveBox(0, moveStep);
        else if (action === "left") moveBox(-moveStep, 0);
        else if (action === "right") moveBox(moveStep, 0);
      }}
      onAccessibilityEscape={stopDrawing}
      onStartShouldSetResponder={() => !busy}
      onMoveShouldSetResponder={() => !busy}
      onResponderTerminationRequest={() => false}
      onResponderGrant={(event) => {
        const { pageX, pageY, locationX, locationY } = event.nativeEvent;
        origin.current = { x: pageX - locationX, y: pageY - locationY };
        pickRun.current += 1;
        setPicking(null);
        gesture.current = grab(point(locationX, locationY));
      }}
      onResponderMove={(event) => {
        const current = gesture.current;
        if (current)
          drag(
            current,
            point(
              event.nativeEvent.pageX - origin.current.x,
              event.nativeEvent.pageY - origin.current.y,
            ),
          );
      }}
      onResponderTerminate={() => {
        gesture.current = null;
      }}
      onResponderRelease={() => {
        const current = gesture.current;
        gesture.current = null;
        if (!current || current.moved) return;
        if (drawing.job === null) void pick(current.start);
        else if (current.mode === "draw") centreBox(current.start);
      }}
    >
      {box ? (
        <Animated.View
          key={picks}
          entering={boxIn}
          pointerEvents="none"
          testID="draw-box"
          style={[
            styles.box,
            {
              borderColor: colors.blush,
              backgroundColor: `${colors.blush}24`,
              shadowColor: colors.ink,
            },
            place(box),
          ]}
        >
          {(
            [
              { top: -8, left: -8 },
              { top: -8, right: -8 },
              { bottom: -8, left: -8 },
              { bottom: -8, right: -8 },
            ] as const
          ).map((corner, index) => (
            <View
              key={index}
              style={[
                styles.handle,
                corner,
                {
                  backgroundColor: colors.onMedia,
                  borderColor: colors.blushStrong,
                },
              ]}
            />
          ))}
        </Animated.View>
      ) : null}
      {picking ? <PickPulse at={picking} /> : null}
      {busy ? (
        <View
          testID="moment-selecting"
          pointerEvents="none"
          style={StyleSheet.absoluteFill}
        />
      ) : null}
    </View>
  ) : null;

  const photo = (
    <View
      style={[
        styles.photo,
        {
          backgroundColor: colors.sunken,
          aspectRatio: aspect,
          ...(drawing && canvas.width && canvas.height
            ? { width: Math.min(canvas.width, canvas.height * aspect) }
            : {}),
        },
      ]}
      onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
    >
      <Image
        source={{ uri: photoUri(source) }}
        style={StyleSheet.absoluteFill}
        contentFit="fill"
        accessibilityLabel={t("capture.photo")}
        onLoad={(event) => setAspect(event.source.width / event.source.height)}
      />
      {!drawing &&
      jobs.some(
        (job) => job.state === "queued" || job.state === "preparing",
      ) ? (
        <ScanSweep />
      ) : null}
      {layered.map(({ job, number }) => {
        if (
          dropped.includes(job.id) ||
          (drawing && (job.id === drawing.job || foundNothing(job)))
        )
          return null;
        const name = nameOf(job, number);
        return (
          <RegionMark
            key={job.id}
            frame={jobFrame(job)}
            number={number}
            label={`${number}, ${name}`}
            kept={!dropped.includes(job.id)}
            order={number - 1}
            compact={ax}
            faint={Boolean(drawing)}
            onToggle={() => toggle(job.id)}
            onAdjust={
              isSettled(job)
                ? () => {
                    setDrawing({ job: job.id, box: jobFrame(job) });
                  }
                : undefined
            }
            testID={`region-${number}`}
          />
        );
      })}
      {drawArea}
    </View>
  );

  if (drawing)
    return (
      <Screen
        title={drawing.job ? t("capture.group.title") : t("capture.pickPiece")}
        headerTitleVisible
        scroll={false}
        leading="cancel"
        onCancel={stopDrawing}
        footer={
          <Footer
            error={error}
            actions={ax ? [] : undefined}
            secondary={
              kept.length
                ? {
                    label: t("capture.clearMarks"),
                    onPress: clearMarks,
                    disabled: busy,
                    testID: "group-clear-marks",
                  }
                : undefined
            }
            primary={{
              label: t("capture.useBox"),
              onPress: () => void applyBox(),
              busy,
              disabled: !box || Boolean(picking),
              testID: "group-use-box",
            }}
          />
        }
        testID="group-screen"
      >
        <View style={styles.drawingContent}>
          <View
            style={styles.canvas}
            onLayout={(event) => {
              const { width, height } = event.nativeEvent.layout;
              setCanvas({ width, height });
            }}
          >
            {photo}
          </View>
          <Text
            role="footnote"
            tone="muted"
            style={styles.hint}
            testID="group-hint"
          >
            {t("capture.tapHint")}
          </Text>
        </View>
      </Screen>
    );

  const none = kept.length === 0;

  return (
    <Screen
      title={t("capture.group.title")}
      headerTitleVisible
      leading="cancel"
      onCancel={() => router.back()}
      footer={
        <Footer
          error={error}
          waiting={waiting && !none}
          primary={
            none
              ? {
                  label: t("capture.remove"),
                  variant: "destructive",
                  onPress: () => void removeAll(),
                  busy,
                  testID: "group-remove",
                }
              : {
                  label:
                    adding.length === 1
                      ? t("capture.addOne")
                      : t("capture.addMany", { count: adding.length }),
                  onPress: () => void done(),
                  busy,
                  disabled: adding.length === 0,
                  testID: "group-done",
                }
          }
        />
      }
      testID="group-screen"
    >
      <View style={styles.content}>
        {scanned ? null : photo}
        {jobs.length > 1 ? (
          <View style={styles.tally}>
            <Text role="subhead" tone="muted" testID="group-count">
              {t("capture.chosen", {
                count: kept.length,
                total: jobs.length,
              })}
            </Text>
            <Button
              label={
                dropped.length
                  ? t("capture.selectAll")
                  : t("capture.selectNone")
              }
              variant="quiet"
              size="small"
              onPress={toggleAll}
              testID="group-all"
            />
          </View>
        ) : null}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.strip}
          testID="group-strip"
        >
          {numbered.map(({ job, number }) => {
            const name = nameOf(job, number);
            const label = scanned ? name : `${number}, ${name}`;
            const meta =
              job.state === "failed"
                ? t(
                    job.error === "no-clothing"
                      ? "capture.noClothing"
                      : "capture.stateFailed",
                  )
                : job.region?.partial
                  ? t("capture.partialShort")
                  : undefined;
            const spoken = job.state === "failed" ? `${label}, ${meta}` : label;
            const isKept = !dropped.includes(job.id);
            return (
              <View key={job.id} style={isKept ? null : styles.left}>
                <Tile
                  image={jobPiece(job)}
                  label={scanned ? name : `${number} ${name}`}
                  meta={meta}
                  size="strip"
                  state={
                    job.state === "queued" ||
                    job.state === "preparing" ||
                    job.state === "failed"
                      ? job.state
                      : undefined
                  }
                  onPress={
                    isKept && isSettled(job) ? () => review(job.id) : undefined
                  }
                  accessibilityLabel={spoken}
                  testID={`group-card-${number}`}
                />
                <Pressable
                  accessibilityRole="checkbox"
                  accessibilityLabel={spoken}
                  accessibilityState={{ checked: isKept }}
                  hitSlop={theme.space.sm}
                  onPress={() => toggle(job.id)}
                  style={[
                    styles.check,
                    {
                      backgroundColor: isKept ? colors.blush : colors.scrimPill,
                      borderColor: isKept ? colors.blushStrong : colors.onMedia,
                    },
                  ]}
                  testID={`group-row-${number}`}
                >
                  {isKept ? (
                    <Symbol
                      name="checkmark"
                      size={13}
                      tone="ink"
                      weight="semibold"
                    />
                  ) : null}
                </Pressable>
              </View>
            );
          })}
        </ScrollView>
        {scanned ? null : (
          <View style={styles.markActions}>
            <Button
              label={t("capture.pickPiece")}
              icon="plus"
              variant="quiet"
              onPress={startAdding}
              testID="group-draw"
            />
            <Button
              label={t("capture.clearMarks")}
              variant="quiet"
              disabled={busy || !kept.length}
              onPress={clearMarks}
              testID="group-clear-marks"
            />
          </View>
        )}
        {jobs.length > 1 ? (
          <Rows>
            <Row
              title={t("closet.linkSet")}
              trailing={{
                toggle: keepSet && kept.length > 1,
                onToggle: (next) => {
                  if (kept.length > 1) setKeepSet(next);
                },
              }}
              last
              testID="group-set"
            />
          </Rows>
        ) : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: theme.space.lg },
  drawingContent: {
    flex: 1,
    gap: theme.space.md,
    paddingVertical: theme.space.md,
  },
  canvas: { flex: 1, alignItems: "center", justifyContent: "center" },
  photo: {
    width: "100%",
    borderRadius: theme.radius.md,
    borderCurve: "continuous",
    overflow: "hidden",
  },
  box: {
    position: "absolute",
    borderWidth: 2.5,
    borderRadius: theme.radius.sm,
    shadowOpacity: 0.35,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 0 },
  },
  handle: {
    position: "absolute",
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
  },
  hint: { textAlign: "center" },
  tally: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    marginRight: -theme.space.sm,
    marginBottom: -theme.space.sm,
  },
  strip: { gap: theme.space.md },
  left: { opacity: 0.55 },
  check: {
    position: "absolute",
    top: theme.space.sm,
    right: theme.space.sm,
    width: theme.size.controlSmall,
    height: theme.size.controlSmall,
    borderRadius: theme.radius.full,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  markActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.space.sm,
    marginLeft: -theme.space.sm,
  },
});
