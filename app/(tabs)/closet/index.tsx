import { StyleSheet, View } from "react-native";
import { router } from "expo-router";
import {
  captureProgress,
  type CaptureProgress,
} from "../../../src/domain/importing";
import { categoryName, t, type Key } from "../../../src/i18n";
import { addPiecesRoute, canPrepareOnDevice } from "../../../src/state/imports";
import { AddedBanner } from "../../../src/features/closet/AddedBanner";
import { ClosetGrid } from "../../../src/features/closet/ClosetGrid";
import {
  FilterPanel,
  FilterRow,
} from "../../../src/features/closet/FilterPanel";
import { SelectFooter } from "../../../src/features/closet/SelectFooter";
import { useClosetScreen } from "../../../src/features/closet/useClosetScreen";
import {
  Banner,
  Button,
  Chip,
  EmptyState,
  HeaderItem,
  Screen,
  Text,
} from "../../../src/ui";
import { theme } from "../../../src/ui/theme";
import { useLargeText } from "../../../src/ui/useLargeText";

function progressText(progress: CaptureProgress) {
  if (!progress.done)
    return progress.total === 1
      ? t("progress.newOne")
      : t("progress.newMany", {
          total: progress.total,
          ready: progress.ready,
        });
  const part = (count: number, one: Key, many: Key) =>
    count ? [count === 1 ? t(one) : t(many, { count })] : [];
  return [
    ...part(progress.ready, "progress.readyOne", "progress.readyMany"),
    ...part(progress.confirm, "progress.confirmOne", "progress.confirmMany"),
    ...part(progress.failed, "capture.failedOne", "capture.failedMany"),
  ].join(", ");
}

function ProgressCard({ progress }: { progress: CaptureProgress }) {
  const { large } = useLargeText();
  const text = progressText(progress);
  const groups = progress.byCategory.map(({ category, count }) => ({
    shown: t("closet.section", { category: categoryName(category), count }),
    spoken: t("closet.sectionLabel", {
      category: categoryName(category),
      pieces:
        count === 1
          ? t("common.pieceCountOne")
          : t("common.pieceCountMany", { count }),
    }),
  }));
  const settled = progress.ready + progress.confirm + progress.failed;
  return (
    <Banner
      tone="progress"
      text={text}
      progress={{
        value: settled / progress.total,
        meta: groups.map((group) => group.shown).join(large ? "\n" : " · "),
        done: progress.done,
      }}
      accessibilityLabel={[text, ...groups.map((group) => group.spoken)].join(
        ", ",
      )}
      onPress={() => router.push(addPiecesRoute)}
      testID="progress-card"
    />
  );
}

export default function ClosetScreen() {
  const screen = useClosetScreen();
  const { closet, filter, selecting, selected } = screen;
  const progress = captureProgress(closet);
  const empty = closet.pieces.length === 0;
  const putAwayShown = filter.availability === "archived";
  const showFooter =
    selecting || Boolean(screen.result && "text" in screen.result);
  const count = screen.visible.length;

  const header = (
    <View style={styles.header}>
      {selecting ? null : (
        <HeaderItem
          label={t("closet.addPieces")}
          icon="plus"
          onPress={() => router.push(addPiecesRoute)}
          testID="header-add"
        />
      )}
      {empty ? null : selecting ? (
        <HeaderItem
          label={t("common.cancel")}
          onPress={screen.endSelect}
          testID="header-cancel"
        />
      ) : (
        <HeaderItem
          label={t("common.select")}
          onPress={screen.startSelect}
          testID="header-select"
        />
      )}
    </View>
  );

  const banner = progress ? (
    <ProgressCard progress={progress} />
  ) : screen.added.length && !selecting ? (
    <AddedBanner
      key={screen.added.join(",")}
      closet={closet}
      ids={screen.added}
      onStart={screen.startWith}
    />
  ) : null;

  const laundry =
    !selecting && (screen.load.length || screen.washing.length) ? (
      <View style={styles.chips}>
        {screen.load.length ? (
          <Chip
            kind="action"
            label={t("closet.intoWash", { count: screen.load.length })}
            onPress={() => screen.laundry(false)}
            testID="closet-into-wash"
          />
        ) : null}
        {screen.washing.length ? (
          <Chip
            kind="action"
            label={t("closet.laundryDone", { count: screen.washing.length })}
            onPress={() => screen.laundry(true)}
            testID="closet-laundry-done"
          />
        ) : null}
      </View>
    ) : null;

  return (
    <Screen
      large
      title={
        selecting
          ? selected.length === 1
            ? t("common.selectedOne")
            : t("common.selectedMany", { count: selected.length })
          : t("nav.closet")
      }
      actions={header}
      search={
        empty
          ? undefined
          : {
              placeholder: t("closet.search"),
              ref: screen.searchRef,
              onChangeText: (search) => screen.change({ search }),
            }
      }
      footer={
        showFooter ? (
          <SelectFooter
            selecting={selecting}
            canAct={screen.owned.length > 0}
            canLink={screen.owned.length > 1}
            putAwayShown={putAwayShown}
            expanded={screen.expanded}
            result={screen.result}
            onExpand={screen.setExpanded}
            onWorn={screen.markWorn}
            onLink={screen.linkSelected}
            onPutAway={() => screen.putAway(!putAwayShown)}
            onChange={screen.changeAll}
          />
        ) : undefined
      }
      scroll={empty}
      testID="closet-screen"
    >
      {empty ? (
        <View style={styles.content}>
          {banner ?? (
            <EmptyState
              mark
              title={t("closet.firstTitle")}
              action={{
                label: canPrepareOnDevice
                  ? t("closet.scan")
                  : t("closet.addPhoto"),
                icon: canPrepareOnDevice ? "viewfinder" : "camera",
                onPress: () =>
                  router.push(
                    canPrepareOnDevice ? "/capture/scan" : addPiecesRoute,
                  ),
                testID: "closet-empty-add",
              }}
              secondary={
                canPrepareOnDevice
                  ? {
                      label: t("closet.addPhoto"),
                      onPress: () => router.push(addPiecesRoute),
                      testID: "closet-empty-photo",
                    }
                  : undefined
              }
              testID="closet-empty"
            />
          )}
        </View>
      ) : (
        <ClosetGrid
          sections={screen.sections}
          headings={filter.category === "all" && screen.sections.length > 1}
          selecting={selecting}
          selected={selected}
          chips={
            <FilterRow
              filter={filter}
              offered={screen.offered}
              forgotten={screen.forgotten}
              open={screen.panelOpen}
              onToggle={() => screen.setPanelOpen(!screen.panelOpen)}
              onChange={screen.change}
            />
          }
          header={
            <>
              {screen.panelOpen ? (
                <FilterPanel
                  filter={filter}
                  pieces={closet.pieces}
                  filtered={screen.filtered}
                  onChange={screen.change}
                  onClear={screen.clear}
                />
              ) : null}
              {banner}
              {laundry}
              {count ? (
                <View style={styles.summary}>
                  <Text role="subhead" tone="muted" testID="closet-count">
                    {count === 1
                      ? t("common.pieceCountOne")
                      : t("common.pieceCountMany", { count })}
                  </Text>
                  {selecting ? null : (
                    <Button
                      variant="quiet"
                      size="small"
                      label={t("closet.stats")}
                      onPress={() => router.push("/closet/stats")}
                      testID="closet-stats"
                    />
                  )}
                </View>
              ) : null}
            </>
          }
          empty={
            screen.allPutAway && !putAwayShown ? (
              <EmptyState
                title={t("closet.allPutAwayTitle")}
                secondary={{
                  label: t("closet.showPutAway"),
                  onPress: () => screen.change({ availability: "archived" }),
                  testID: "closet-show-put-away",
                }}
                testID="closet-all-put-away"
              />
            ) : (
              <EmptyState
                title={t("closet.noneFoundTitle")}
                secondary={
                  screen.panelOpen
                    ? undefined
                    : { label: t("closet.clearFilters"), onPress: screen.clear }
                }
                testID="closet-none"
              />
            )
          }
          onPress={(piece) =>
            selecting
              ? screen.toggle(piece.id)
              : router.push(`/piece/${piece.id}`)
          }
          onLongPress={(piece) => {
            if (!selecting) screen.startSelect();
            screen.toggle(piece.id);
          }}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", gap: theme.space.sm },
  content: { gap: theme.space.lg },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: theme.space.sm },
  summary: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
});
