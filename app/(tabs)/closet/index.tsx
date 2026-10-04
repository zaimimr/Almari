import { StyleSheet, View } from "react-native";
import { router } from "expo-router";
import {
  captureProgress,
  type CaptureProgress,
} from "../../../src/domain/importing";
import { categoryName, t, type Key } from "../../../src/i18n";
import { addPiecesRoute } from "../../../src/state/imports";
import { AddedBanner } from "../../../src/features/closet/AddedBanner";
import { ClosetGrid } from "../../../src/features/closet/ClosetGrid";
import {
  FilterPanel,
  FilterRow,
} from "../../../src/features/closet/FilterPanel";
import { SelectFooter } from "../../../src/features/closet/SelectFooter";
import { useClosetScreen } from "../../../src/features/closet/useClosetScreen";
import { Banner, EmptyState, HeaderItem, Screen } from "../../../src/ui";
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
              onChangeText: (search) => screen.change({ search }),
            }
      }
      footer={
        selecting ? (
          <SelectFooter
            canAct={screen.owned.length > 0}
            putAwayShown={putAwayShown}
            wornOpen={screen.wornOpen}
            result={screen.result}
            onWornToggle={() => screen.setWornOpen(!screen.wornOpen)}
            onWorn={screen.markWorn}
            onLink={screen.linkSelected}
            onPutAway={() => screen.putAway(!putAwayShown)}
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
                label: t("closet.addPieces"),
                onPress: () => router.push(addPiecesRoute),
                testID: "closet-empty-add",
              }}
              testID="closet-empty"
            />
          )}
        </View>
      ) : (
        <ClosetGrid
          sections={screen.sections}
          selecting={selecting}
          selected={selected}
          header={
            <>
              <FilterRow
                filter={filter}
                offered={screen.offered}
                open={screen.panelOpen}
                onToggle={() => screen.setPanelOpen(!screen.panelOpen)}
                onChange={screen.change}
              />
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
            </>
          }
          empty={
            <EmptyState
              title={t("closet.noneFoundTitle")}
              secondary={
                screen.panelOpen
                  ? undefined
                  : { label: t("closet.clearFilters"), onPress: screen.clear }
              }
              testID="closet-none"
            />
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
});
