import { Fragment, useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import type { ImportJob } from "../../src/domain/closet";
import {
  CaptureSources,
  CaptureTips,
} from "../../src/features/capture/CaptureSources";
import { JobTile } from "../../src/features/capture/JobTile";
import { Lookalikes } from "../../src/features/capture/Lookalikes";
import { isGrouped, jobColour } from "../../src/features/capture/jobs";
import {
  useCaptureGrid,
  type GridSection,
  type Slot,
} from "../../src/features/capture/useCaptureGrid";
import { ColourChips } from "../../src/features/ColourChips";
import { useRetake } from "../../src/features/Retake";
import { categoryName, t } from "../../src/i18n";
import {
  Banner,
  Button,
  Expander,
  Footer,
  HeaderItem,
  Screen,
  Section,
} from "../../src/ui";
import { theme } from "../../src/ui/theme";
import { useLargeText } from "../../src/ui/useLargeText";

const stateIds = {
  queued: "queued",
  preparing: "preparing",
  ready: "ready",
  review: "confirm",
  failed: "failed",
} as const;

function slotKey(slot: Slot) {
  return slot.kind === "group" ? `group-${slot.group.captureId}` : slot.job.id;
}

export default function AddPieces() {
  const grid = useCaptureGrid();
  const { open: openParam } = useLocalSearchParams<{ open?: string }>();
  useEffect(() => {
    if (openParam !== "library") return;
    router.setParams({ open: undefined });
    void grid.choosePhotos();
  }, [openParam, grid]);
  const retake = useRetake();
  const { ax } = useLargeText();
  const [colourFor, setColourFor] = useState<string | null>(null);
  const count = ax ? 1 : 2;
  const counters: Record<string, number> = {};

  function testIdOf(slot: Slot) {
    const name =
      slot.kind === "group"
        ? "group"
        : slot.kind === "removed"
          ? "removed"
          : stateIds[slot.job.state];
    counters[name] = (counters[name] ?? 0) + 1;
    return `job-${name}-${counters[name]}`;
  }

  function open(job: ImportJob) {
    setColourFor(null);
    if (job.error === "no-clothing" && job.captureId && !isGrouped(job))
      router.push({
        pathname: "/capture/group/[id]",
        params: { id: job.captureId, add: "1" },
      });
    else router.push({ pathname: "/capture/[id]", params: { id: job.id } });
  }

  async function retakeJob(job: ImportJob) {
    const result = await retake(job, "camera");
    if (result !== "done" && result !== "cancelled")
      grid.report(result, "camera");
  }

  async function add() {
    const result = await grid.addReady();
    if (result === "popped") router.dismissTo("/closet");
  }

  function renderSection(section: GridSection) {
    const rows = Array.from(
      { length: Math.ceil(section.slots.length / count) },
      (_, index) => section.slots.slice(index * count, (index + 1) * count),
    );
    const body = rows.map((row) => {
      const opened = row.find(
        (slot) => slot.kind === "job" && slot.job.id === colourFor,
      );
      const openJob = opened && opened.kind === "job" ? opened.job : null;
      return (
        <Fragment key={row.map(slotKey).join("|")}>
          <View style={styles.row}>
            {row.map((slot) => (
              <JobTile
                key={slotKey(slot)}
                slot={slot}
                testID={testIdOf(slot)}
                selecting={grid.selecting}
                selected={
                  slot.kind === "job" && grid.selected.includes(slot.job.id)
                }
                colourOpen={slot.kind === "job" && slot.job.id === colourFor}
                onOpen={open}
                onOpenGroup={(group) => {
                  setColourFor(null);
                  router.push({
                    pathname: "/capture/group/[id]",
                    params: { id: group.captureId },
                  });
                }}
                onColour={(job) =>
                  setColourFor((current) =>
                    current === job.id ? null : job.id,
                  )
                }
                onSelect={(job) => grid.toggleSelect(job.id)}
                onStartSelect={(job) => grid.startSelect(job.id)}
                onRetry={(job) => void grid.retry(job.id)}
                onRetake={(job) => void retakeJob(job)}
                onRemove={(job) => void grid.remove(job.id)}
                onUndo={(job) => void grid.undoRemove(job.id)}
              />
            ))}
            {row.length < count ? <View style={styles.cell} /> : null}
          </View>
          {openJob ? (
            <Expander
              id={`colour-${openJob.id}`}
              headless
              open
              onToggle={() => setColourFor(null)}
              testID="colour-expander"
            >
              <ColourChips
                value={jobColour(openJob)}
                onPick={(name) => {
                  setColourFor(null);
                  void grid.setColour(openJob.id, name);
                }}
                inSurface
              />
            </Expander>
          ) : null}
        </Fragment>
      );
    });
    if (!section.category)
      return (
        <View key="untitled" style={styles.group}>
          {body}
        </View>
      );
    return (
      <Section
        key={section.category}
        title={categoryName(section.category)}
        count={section.slots.filter((slot) => slot.kind !== "removed").length}
        testID={`section-${section.category}`}
      >
        <View style={styles.group}>{body}</View>
      </Section>
    );
  }

  const selectedCount = grid.selected.length;
  const footer = grid.selecting ? (
    <Footer
      waiting={selectedCount === 0}
      primary={{
        label:
          selectedCount === 1
            ? t("capture.confirmOne")
            : t("capture.confirmMany", { count: selectedCount }),
        onPress: () => {
          const ids = grid.selected.join(",");
          grid.endSelect();
          router.push({
            pathname: "/capture/[id]",
            params: { id: grid.selected[0]!, ids },
          });
        },
      }}
    />
  ) : (
    <Footer
      waiting={grid.ready === 0}
      error={grid.error}
      primary={{
        label:
          grid.ready === 1
            ? t("capture.addOne")
            : t("capture.addMany", { count: grid.ready }),
        onPress: () => void add(),
        busy: grid.busy,
        testID: "capture-add",
      }}
    />
  );

  return (
    <Screen
      title={t("title.addPieces")}
      headerTitleVisible
      leading={grid.selecting ? "cancel" : "back"}
      onCancel={grid.selecting ? grid.endSelect : undefined}
      maintainVisibleContentPosition
      actions={
        <View style={styles.actions}>
          <HeaderItem
            label={t("capture.tips")}
            icon="lightbulb"
            expanded={grid.tipsOpen}
            onPress={grid.toggleTips}
            testID="header-tips"
          />
          {grid.jobs.length && !grid.selecting ? (
            <HeaderItem
              label={t("common.select")}
              onPress={() => grid.startSelect()}
              testID="header-select"
            />
          ) : null}
        </View>
      }
      footer={footer}
      testID="capture-screen"
    >
      <View style={styles.content}>
        <CaptureTips
          open={grid.tipsOpen}
          onToggle={grid.toggleTips}
          onGotIt={() => void grid.closeTips()}
        />
        <CaptureSources
          onTakePhotos={() => void grid.takePhotos()}
          onChoosePhotos={() => void grid.choosePhotos()}
          problem={grid.problem}
          onRetryProblem={() =>
            void (grid.problem?.from === "camera"
              ? grid.takePhotos()
              : grid.choosePhotos())
          }
        />
        {grid.cleaning ? (
          <Banner
            tone="progress"
            text={t("capture.cleaning", {
              n: grid.cleaning.done,
              total: grid.cleaning.total,
            })}
            progress={{
              value: (grid.cleaning.done - 1) / grid.cleaning.total,
            }}
            testID="capture-cleaning"
          />
        ) : null}
        <Lookalikes
          pairs={grid.lookalikes}
          onOpen={open}
          onKeepBoth={(job) => void grid.keepBoth(job.id)}
          onKeepOne={(job) => void grid.remove(job.id)}
        />
        {grid.sections.map(renderSection)}
        {grid.cleanable > 1 && !grid.cleaning && !grid.selecting ? (
          <View style={styles.start}>
            <Button
              label={t("capture.cleanAll")}
              variant="quiet"
              icon="wand.and.stars"
              onPress={() => void grid.cleanAll()}
              testID="capture-clean-all"
            />
          </View>
        ) : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: theme.space.xl },
  group: { gap: theme.space.lg },
  row: { flexDirection: "row", gap: theme.space.md },
  cell: { flex: 1 },
  start: { alignSelf: "flex-start", marginLeft: -theme.space.sm },
  actions: { flexDirection: "row", alignItems: "center", gap: theme.space.sm },
});
