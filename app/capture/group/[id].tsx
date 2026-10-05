import { useRef, useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Image } from "expo-image";
import { randomUUID } from "expo-crypto";
import { router, useLocalSearchParams } from "expo-router";
import type { Frame, ImportJob } from "../../../src/domain/closet";
import { boxFrom, resizeBox } from "../../../src/domain/capture";
import {
  acceptImports,
  addToCapture,
  captureJobs,
  cropCapture,
  isSettled,
  removeImport,
  setKeepAsSet,
} from "../../../src/domain/importing";
import { jobPiece } from "../../../src/features/capture/jobs";
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
import { theme } from "../../../src/ui/theme";
import { useColors } from "../../../src/ui/useColors";
import { useLargeText } from "../../../src/ui/useLargeText";

const startBox: Frame = { x: 0.25, y: 0.25, width: 0.5, height: 0.5 };
const step = 0.05;
const moveStep = 0.05;

const handle = 28;

type Drag =
  | { mode: "draw"; start: { x: number; y: number }; moved: boolean }
  | { mode: "move"; offset: { x: number; y: number }; moved: boolean }
  | { mode: "resize"; anchor: { x: number; y: number }; moved: boolean };

const clamp = (value: number, max: number) =>
  Math.min(Math.max(value, 0), Math.max(max, 0));

function frameOf(job: ImportJob) {
  return job.crop ?? job.region?.frame ?? null;
}

function nameOf(job: ImportJob, number: number) {
  if (job.name) return job.name;
  return job.region
    ? t(`region.${job.region.kind}`)
    : t("capture.photoNumber", { number });
}

function place(frame: Frame) {
  return {
    left: `${frame.x * 100}%`,
    top: `${frame.y * 100}%`,
    width: `${frame.width * 100}%`,
    height: `${frame.height * 100}%`,
  } as const;
}

const percent = (value: number) => Math.round(value * 100);

export default function PiecesFound() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { closet, update } = useCloset();
  const colors = useColors();
  const { ax } = useLargeText();
  const jobs = captureJobs(closet, id);
  const [initialSet] = useState(() => jobs.some((job) => job.keepAsSet));
  const [dropped, setDropped] = useState<string[]>([]);
  const [keepSet, setKeepSet] = useState(initialSet);
  const [drawing, setDrawing] = useState<{
    job: string | null;
    box: Frame;
  } | null>(null);
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

  function point(x: number, y: number) {
    return {
      x: width ? x / width : 0,
      y: height ? y / height : 0,
    };
  }

  function moveBox(dx: number, dy: number) {
    if (!drawing) return;
    const box = drawing.box;
    setDrawing({
      ...drawing,
      box: {
        ...box,
        x: clamp(box.x + dx, 1 - box.width),
        y: clamp(box.y + dy, 1 - box.height),
      },
    });
  }

  function grab(at: { x: number; y: number }): Drag {
    const box = drawing!.box;
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
          offset: { x: at.x - box.x, y: at.y - box.y },
          moved: false,
        }
      : { mode: "draw", start: at, moved: false };
  }

  function drag(current: Drag, at: { x: number; y: number }) {
    if (!drawing) return;
    const box = drawing.box;
    const next =
      current.mode === "move"
        ? {
            ...box,
            x: clamp(at.x - current.offset.x, 1 - box.width),
            y: clamp(at.y - current.offset.y, 1 - box.height),
          }
        : boxFrom(current.mode === "draw" ? current.start : current.anchor, at);
    if (!next) return;
    current.moved = true;
    setDrawing({ ...drawing, box: next });
  }

  function centreBox(at: { x: number; y: number }) {
    if (!drawing) return;
    const box = drawing.box;
    setDrawing({
      ...drawing,
      box: {
        ...box,
        x: clamp(at.x - box.width / 2, 1 - box.width),
        y: clamp(at.y - box.height / 2, 1 - box.height),
      },
    });
  }

  function resize(change: number) {
    if (drawing)
      setDrawing({ ...drawing, box: resizeBox(drawing.box, change) });
  }

  function toggle(job: string) {
    setDropped((current) =>
      current.includes(job)
        ? current.filter((item) => item !== job)
        : [...current, job],
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
          ? cropCapture(current, job, box, `${job}-${randomUUID()}`)
          : addToCapture(current, id, randomUUID(), box, now().toISOString()),
      );
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
      else router.back();
    } catch {
      setError(t("capture.saveFailed"));
      setBusy(false);
    }
  }

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
      {drawing ? (
        <View
          style={StyleSheet.absoluteFill}
          testID="draw-area"
          accessible
          accessibilityRole="adjustable"
          accessibilityLabel={t("capture.box")}
          accessibilityValue={{
            text: t("capture.boxValue", {
              width: percent(drawing.box.width),
              height: percent(drawing.box.height),
              x: percent(drawing.box.x),
              y: percent(drawing.box.y),
            }),
          }}
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
            if (action === "increment") resize(step);
            else if (action === "decrement") resize(-step);
            else if (action === "up") moveBox(0, -moveStep);
            else if (action === "down") moveBox(0, moveStep);
            else if (action === "left") moveBox(-moveStep, 0);
            else if (action === "right") moveBox(moveStep, 0);
          }}
          onAccessibilityEscape={() => setDrawing(null)}
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
            if (current?.mode === "draw" && !current.moved)
              centreBox(current.start);
          }}
        >
          <View
            pointerEvents="none"
            style={[
              styles.box,
              {
                borderColor: colors.blush,
                backgroundColor: `${colors.plumSoft}40`,
              },
              place(drawing.box),
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
          </View>
          {busy ? (
            <View
              testID="moment-selecting"
              pointerEvents="none"
              style={StyleSheet.absoluteFill}
            />
          ) : null}
        </View>
      ) : (
        jobs.map((job, index) => {
          const frame = frameOf(job);
          if (!frame) return null;
          const isDropped = dropped.includes(job.id);
          return (
            <Pressable
              key={job.id}
              testID={`region-${index + 1}`}
              accessibilityRole="button"
              accessibilityLabel={`${index + 1}, ${nameOf(job, index + 1)}, ${t("capture.adjust")}`}
              hitSlop={12}
              disabled={!isSettled(job)}
              onPress={() => setDrawing({ job: job.id, box: frame })}
              style={[
                styles.outline,
                {
                  borderColor: isDropped ? colors.onMedia : colors.blush,
                  borderStyle: isDropped ? "dashed" : "solid",
                  shadowColor: colors.ink,
                },
                place(frame),
              ]}
            >
              {ax ? null : (
                <View
                  style={[styles.pill, { backgroundColor: colors.scrimPill }]}
                >
                  <Text role="mark" tone="onMedia">
                    {index + 1}
                  </Text>
                </View>
              )}
            </Pressable>
          );
        })
      )}
    </View>
  );

  if (drawing)
    return (
      <Screen
        title={t("capture.group.title")}
        headerTitleVisible
        leading="cancel"
        onCancel={() => setDrawing(null)}
        footer={
          <Footer
            error={error}
            primary={{
              label: t("capture.useBox"),
              onPress: () => void applyBox(),
              busy,
              testID: "group-use-box",
            }}
          />
        }
        testID="group-screen"
      >
        <View style={styles.content}>{photo}</View>
      </Screen>
    );

  return (
    <Screen
      title={t("capture.group.title")}
      headerTitleVisible
      leading="cancel"
      onCancel={() => router.back()}
      footer={
        <Footer
          error={error}
          waiting={waiting}
          primary={{
            label:
              adding.length === 1
                ? t("capture.addOne")
                : t("capture.addMany", { count: adding.length }),
            onPress: () => void done(),
            busy,
            disabled: adding.length === 0,
            testID: "group-done",
          }}
        />
      }
      testID="group-screen"
    >
      <View style={styles.content}>
        {scanned ? null : photo}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.strip}
          testID="group-strip"
        >
          {jobs.map((job, index) => {
            const name = nameOf(job, index + 1);
            const spoken = scanned ? name : `${index + 1}, ${name}`;
            const isKept = !dropped.includes(job.id);
            return (
              <View key={job.id}>
                <Tile
                  image={jobPiece(job)}
                  label={scanned ? name : `${index + 1} ${name}`}
                  meta={
                    job.region?.partial ? t("capture.partialShort") : undefined
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
                  testID={`group-card-${index + 1}`}
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
                  testID={`group-row-${index + 1}`}
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
        {scanned ? null : (
          <View style={styles.bleed}>
            <Button
              label={t("capture.addPiece")}
              variant="quiet"
              onPress={() => setDrawing({ job: null, box: startBox })}
              testID="group-draw"
            />
          </View>
        )}
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
  outline: {
    position: "absolute",
    borderWidth: 2,
    borderRadius: theme.radius.sm,
    shadowOpacity: 0.6,
    shadowRadius: 1,
    shadowOffset: { width: 0, height: 0 },
  },
  box: {
    position: "absolute",
    borderWidth: 2,
    borderRadius: theme.radius.sm,
  },
  pill: {
    alignSelf: "flex-start",
    margin: theme.space.xs,
    paddingHorizontal: theme.space.sm,
    borderRadius: theme.radius.full,
  },
  handle: {
    position: "absolute",
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
  },
  strip: { gap: theme.space.md },
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
