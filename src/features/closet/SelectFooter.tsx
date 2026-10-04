import { ScrollView, StyleSheet, View } from "react-native";
import { t } from "../../i18n";
import { Button, Chip, Footer, ResultBar } from "../../ui";
import { theme } from "../../ui/theme";
import type { SelectResult } from "./useClosetScreen";

export function SelectFooter({
  canAct,
  canStyle,
  putAwayShown,
  wornOpen,
  result,
  onWornToggle,
  onWorn,
  onLink,
  onPutAway,
  onNewLook,
  onStart,
}: {
  canAct: boolean;
  canStyle: boolean;
  putAwayShown: boolean;
  wornOpen: boolean;
  result: SelectResult;
  onWornToggle: () => void;
  onWorn: (day: "today" | "yesterday") => void;
  onLink: () => void;
  onPutAway: () => void;
  onNewLook: () => void;
  onStart: () => void;
}) {
  const markWorn = {
    label: t("looks.markWorn"),
    onPress: onWornToggle,
    disabled: !canAct,
    expanded: wornOpen,
    testID: "select-mark-worn",
  };
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
    ) : wornOpen ? (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
      >
        <Button variant="quiet" {...markWorn} />
        <View style={styles.chips}>
          <Chip
            kind="action"
            label={t("adjust.today")}
            onPress={() => onWorn("today")}
            testID="worn-today"
          />
          <Chip
            kind="action"
            label={t("looks.yesterday")}
            onPress={() => onWorn("yesterday")}
            testID="worn-yesterday"
          />
        </View>
      </ScrollView>
    ) : undefined;

  return (
    <Footer
      actions={[
        markWorn,
        {
          label: t("closet.linkSet"),
          onPress: onLink,
          disabled: !canAct,
          testID: "select-link",
        },
        {
          label: t(
            putAwayShown ? "closet.backInCloset" : "closet.putAwayAction",
          ),
          onPress: onPutAway,
          disabled: !canAct,
          testID: "select-put-away",
        },
      ]}
      actionsContent={content}
      error={result && "error" in result ? result.error : null}
      secondary={{
        label: t("looks.new"),
        onPress: onNewLook,
        disabled: !canStyle,
        testID: "select-new-look",
      }}
      primary={{
        label: t("pieces.startWithThese"),
        onPress: onStart,
        disabled: !canStyle,
        testID: "select-start",
      }}
    />
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: theme.space.sm },
  chips: { flexDirection: "row", gap: theme.space.sm },
});
