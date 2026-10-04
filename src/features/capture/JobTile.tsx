import { Pressable, StyleSheet, View } from "react-native";
import type { ImportJob } from "../../domain/closet";
import { t } from "../../i18n";
import { Symbol, Text, Tile } from "../../ui";
import { theme } from "../../ui/theme";
import { colourLabel } from "../ColourChips";
import type { Group, Slot } from "./useCaptureGrid";
import {
  hexOf,
  jobColour,
  jobLabel,
  jobName,
  jobPhoto,
  jobPiece,
  tileState,
} from "./jobs";

type Props = {
  slot: Slot;
  testID: string;
  selecting: boolean;
  selected: boolean;
  colourOpen: boolean;
  onOpen: (job: ImportJob) => void;
  onOpenGroup: (group: Group) => void;
  onColour: (job: ImportJob) => void;
  onSelect: (job: ImportJob) => void;
  onStartSelect: (job: ImportJob) => void;
  onRetry: (job: ImportJob) => void;
  onRetake: (job: ImportJob) => void;
  onRemove: (job: ImportJob) => void;
  onUndo: (job: ImportJob) => void;
};

function GroupTile({
  group,
  testID,
  disabled,
  onOpen,
}: {
  group: Group;
  testID: string;
  disabled: boolean;
  onOpen: () => void;
}) {
  const label =
    group.jobs.length === 1
      ? t("capture.foundOne")
      : t("capture.found", { count: group.jobs.length });
  return (
    <Pressable
      onPress={disabled ? undefined : onOpen}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      style={styles.group}
      testID={testID}
    >
      <View
        pointerEvents="none"
        importantForAccessibility="no-hide-descendants"
        accessibilityElementsHidden
      >
        <Tile
          image={{ ...jobPiece(group.jobs[0]!), photo: group.thumbnail }}
          raw
          size="grid"
          accessibilityLabel={label}
        />
      </View>
      <View
        style={styles.groupLabel}
        importantForAccessibility="no-hide-descendants"
        accessibilityElementsHidden
      >
        <Text role="subhead" style={styles.flex}>
          {label}
        </Text>
        <Symbol name="chevron.right" size={14} tone="muted" />
      </View>
    </Pressable>
  );
}

export function JobTile({
  slot,
  testID,
  selecting,
  selected,
  colourOpen,
  onOpen,
  onOpenGroup,
  onColour,
  onSelect,
  onStartSelect,
  onRetry,
  onRetake,
  onRemove,
  onUndo,
}: Props) {
  if (slot.kind === "group")
    return (
      <GroupTile
        group={slot.group}
        testID={testID}
        disabled={selecting}
        onOpen={() => onOpenGroup(slot.group)}
      />
    );
  const { job, number } = slot;
  const piece = jobPiece(job);
  const { raw } = jobPhoto(job);
  if (slot.kind === "removed")
    return (
      <Tile
        image={piece}
        size="grid"
        state="removed"
        accessibilityLabel={jobName(job, number)}
        onUndoRemove={() => onUndo(job)}
        testID={testID}
      />
    );
  const state = tileState(job);
  const colour = jobColour(job);
  const confirm = state === "needsAnswers";
  const opens = state === "ready" || confirm || state === "failed";
  const actions = [
    ...(state === "ready" && colour
      ? [
          {
            name: "colour",
            label: t("common.editColour"),
            onPress: () => onColour(job),
          },
        ]
      : []),
    ...(state === "failed"
      ? [
          {
            name: "retry",
            label: t("common.tryAgain"),
            onPress: () => onRetry(job),
          },
        ]
      : []),
    ...(opens
      ? [
          {
            name: "retake",
            label: t("capture.retake"),
            onPress: () => onRetake(job),
          },
          {
            name: "remove",
            label: t("common.remove"),
            onPress: () => onRemove(job),
          },
        ]
      : []),
  ];
  return (
    <Tile
      image={piece}
      raw={raw}
      size="grid"
      state={state}
      label={state === "failed" ? undefined : job.name}
      meta={state === "failed" ? t("capture.stateFailed") : undefined}
      selected={selecting && selected}
      colour={
        state === "ready" && colour && !selecting
          ? {
              hex: hexOf(colour),
              name: colourLabel(colour),
              onPress: () => onColour(job),
              expanded: colourOpen,
            }
          : undefined
      }
      onPress={
        selecting
          ? confirm
            ? () => onSelect(job)
            : undefined
          : opens
            ? () => onOpen(job)
            : undefined
      }
      onLongPress={confirm && !selecting ? () => onStartSelect(job) : undefined}
      actions={selecting ? undefined : actions}
      accessibilityLabel={jobLabel(job, number)}
      busyLabel={jobLabel(job, number)}
      onRetry={selecting ? undefined : () => onRetry(job)}
      testID={testID}
    />
  );
}

const styles = StyleSheet.create({
  group: { flex: 1, minWidth: 0 },
  groupLabel: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.space.xs,
    marginTop: theme.space.sm,
  },
  flex: { flex: 1 },
});
