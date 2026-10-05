import { ScrollView, StyleSheet, View } from "react-native";
import { categories, type Category } from "../../domain/closet";
import type { WearSeason } from "../../domain/facts";
import { categoryName, t } from "../../i18n";
import { Button, Chip, Footer, ResultBar } from "../../ui";
import { theme } from "../../ui/theme";
import type { Expanded, SelectResult } from "./useClosetScreen";

const seasons: WearSeason[] = ["summer", "winter", "all-year"];

export function SelectFooter({
  selecting,
  canAct,
  canLink,
  putAwayShown,
  expanded,
  result,
  onExpand,
  onWorn,
  onLink,
  onPutAway,
  onChange,
}: {
  selecting: boolean;
  canAct: boolean;
  canLink: boolean;
  putAwayShown: boolean;
  expanded: Expanded;
  result: SelectResult;
  onExpand: (next: Expanded) => void;
  onWorn: (day: "today" | "yesterday") => void;
  onLink: () => void;
  onPutAway: () => void;
  onChange: (next: { season: WearSeason } | { category: Category }) => void;
}) {
  const markWorn = {
    label: t("looks.markWorn"),
    onPress: () => onExpand(expanded === "worn" ? null : "worn"),
    disabled: !canAct,
    expanded: expanded === "worn",
    testID: "select-mark-worn",
  };
  const changeAction = {
    label: t("closet.change"),
    onPress: () => onExpand(expanded === "change" ? null : "change"),
    disabled: !canAct,
    expanded: expanded === "change",
    testID: "select-change",
  };
  const expandedRow = (
    action: typeof markWorn,
    chips: { label: string; onPress: () => void; testID: string }[],
  ) => (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      <Button variant="quiet" {...action} />
      <View style={styles.chips}>
        {chips.map((chip) => (
          <Chip key={chip.testID} kind="action" {...chip} />
        ))}
      </View>
    </ScrollView>
  );
  const actions = [
    markWorn,
    {
      label: t("closet.linkSet"),
      onPress: onLink,
      disabled: !canLink,
      testID: "select-link",
    },
    {
      label: t(putAwayShown ? "closet.backInCloset" : "closet.putAwayAction"),
      onPress: onPutAway,
      disabled: !canAct,
      testID: "select-put-away",
    },
    changeAction,
  ];
  const content =
    result && "text" in result ? (
      <ResultBar
        text={result.text}
        action={
          result.undo
            ? { label: t("common.undo"), onPress: result.undo }
            : undefined
        }
        focus
        testID="select-result"
      />
    ) : !selecting ? null : expanded === "worn" ? (
      expandedRow(markWorn, [
        {
          label: t("adjust.today"),
          onPress: () => onWorn("today"),
          testID: "worn-today",
        },
        {
          label: t("looks.yesterday"),
          onPress: () => onWorn("yesterday"),
          testID: "worn-yesterday",
        },
      ])
    ) : expanded === "change" ? (
      expandedRow(changeAction, [
        ...seasons.map((season) => ({
          label: t(`value.season.${season}`),
          onPress: () => onChange({ season }),
          testID: `change-${season}`,
        })),
        ...categories.map(({ id }) => ({
          label: categoryName(id),
          onPress: () => onChange({ category: id }),
          testID: `change-${id}`,
        })),
      ])
    ) : (
      <View style={styles.wrap}>
        {actions.map((action) => (
          <Button key={action.testID} variant="quiet" {...action} />
        ))}
      </View>
    );

  return (
    <Footer
      actions={actions}
      actionsContent={content}
      error={result && "error" in result ? result.error : null}
    />
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: theme.space.sm },
  chips: { flexDirection: "row", gap: theme.space.sm },
  wrap: { flexDirection: "row", flexWrap: "wrap", gap: theme.space.sm },
});
