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
  matchingPiece,
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

const handle = 28;

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
  const [flash, setFlash] = useState<{ job: string; count: number } | null>(
    null,
  );
  const [notice, setNotice] = useState<string | null>(null);
  const [added, setAdded] = useState(false);
  const pickRun = useRef(0);
  const gesture = useRef<Drag | null>(null);
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

  function others(job: string | null) {
    return jobs.filter((item) => item.id !== job && !foundNothing(item));
  }

  function alreadyFound(match: ImportJob) {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    setFlash((current) => ({
      job: match.id,
      count: (current?.count ?? 0) + 1,
    }));
    if (dropped.includes(match.id)) {
      setDropped((current) => toggled(current, match.id));
      setNotice(null);
      setDrawing(null);
      return;
    }
    setNotice(t("capture.alreadyFound"));
    setBox(null);
  }

  function duplicateOf(job: string | null, box: Frame) {
    const candidates = others(job);
    const match = matchingPiece(candidates.map(jobFrame), box);
    return match >= 0 ? candidates[match]! : null;
  }

  async function pick(at: Point) {
    if (!drawing || busy) return;
    const run = (pickRun.current += 1);
    setNotice(null);
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
    const match = hit ? duplicateOf(drawing.job, hit) : null;
    if (match) {
      alreadyFound(match);
      return;
    }
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
    const corner = corners.find(([x, y]) => near(x, y));
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
      setNotice(null);
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
    setNotice(null);
    setError(null);
    setDrawing({ job: null, box: null });
  }

  function stopDrawing() {
    pickRun.current += 1;
    setPicking(null);
    setNotice(null);
    setError(null);
    if (entry && !added && drawing?.job === null) router.back();
    else setDrawing(null);
  }

  async function applyBox() {
    if (!drawing?.box || busy || picking) return;
    const { job, box } = drawing;
    const match = scanned ? null : duplicateOf(job, box);
    if (match) {
      alreadyFound(match);
      return;
    }
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
      setNotice(null);
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
      onStartShouldSetResponder={() => true}
      onMoveShouldSetResponder={() => true}
      onResponderTerminationRequest={() => false}
      onResponderGrant={(event) => {
        gesture.current = grab(
          point(event.nativeEvent.locationX, event.nativeEvent.locationY),
        );
      }}
      onResponderMove={(event) => {
        const current = gesture.current;
        if (current)
          drag(
            current,
            point(event.nativeEvent.locationX, event.nativeEvent.locationY),
          );
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
        { backgroundColor: colors.sunken, aspectRatio: aspect },
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
        if (drawing && (job.id === drawing.job || foundNothing(job)))
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
            flash={flash?.job === job.id ? flash.count : 0}
            onToggle={() => toggle(job.id)}
            onAdjust={
              isSettled(job)
                ? () => {
                    setNotice(null);
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
        leading="cancel"
        onCancel={stopDrawing}
        footer={
          <Footer
            error={error}
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
        <View style={styles.content}>
          {photo}
          <Text
            role="footnote"
            tone={notice ? "rose" : "muted"}
            style={styles.hint}
            accessibilityLiveRegion="polite"
            testID="group-hint"
          >
            {notice ?? t("capture.tapHint")}
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
            const spoken = scanned ? name : `${number}, ${name}`;
            const isKept = !dropped.includes(job.id);
            return (
              <View key={job.id} style={isKept ? null : styles.left}>
                <Tile
                  image={jobPiece(job)}
                  label={scanned ? name : `${number} ${name}`}
                  meta={
                    job.state === "failed"
                      ? t(
                          job.error === "no-clothing"
                            ? "capture.noClothing"
                            : "capture.stateFailed",
                        )
                      : job.region?.partial
                        ? t("capture.partialShort")
                        : undefined
                  }
                  size="strip"
                  state={
                    job.state === "queued" ||
                    job.state === "preparing" ||
                    job.state === "failed"
                      ? job.state
                      : undefined
                  }
                  onPress={
                    isKept && isSettled(job) && job.state !== "failed"
                      ? () => review(job.id)
                      : undefined
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
          <View style={styles.bleed}>
            <Button
              label={t("capture.pickPiece")}
              icon="plus"
              variant="quiet"
              onPress={startAdding}
              testID="group-draw"
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
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  bleed: { marginLeft: -theme.space.sm, alignSelf: "flex-start" },
});
