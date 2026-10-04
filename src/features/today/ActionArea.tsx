import { StyleSheet, View } from "react-native";
import { t } from "../../i18n";
import { Button, Expander, ResultBar, Text } from "../../ui";
import { theme } from "../../ui/theme";
import { ReasonChips } from "./OutfitCard";
import type { TodayModel } from "./useToday";

export function ActionArea({ model }: { model: TodayModel }) {
  const { slot, open, setOpen } = model;
  const slotReasons = open?.kind === "slotReasons";
  const skipped = slot?.kind === "undo" && slot.another;

  return (
    <View style={styles.area}>
      {model.only ? (
        <Text role="footnote" tone="muted" style={styles.only}>
          {t("today.onlyCombination")}
        </Text>
      ) : (
        <Button
          label={t(model.last ? "today.lastCombination" : "today.another")}
          variant="quiet"
          busy={model.styling}
          disabled={model.busy}
          onPress={() => void model.another()}
          testID="today-another"
        />
      )}
      <View
        style={styles.slot}
        accessibilityElementsHidden={!slot}
        importantForAccessibility={slot ? "auto" : "no-hide-descendants"}
      >
        {slot ? (
          <ResultBar
            text={slot.kind === "thanks" ? t("outfit.thanks") : undefined}
            action={{
              label: t("common.undo"),
              onPress: model.undo,
              disabled: model.busy,
              testID: "today-undo",
            }}
            second={
              skipped
                ? {
                    label: t("outfit.notForMe"),
                    accessibilityLabel: t("outfit.notForMeSkipped"),
                    expanded: slotReasons,
                    onPress: () =>
                      setOpen(slotReasons ? null : { kind: "slotReasons" }),
                    testID: "today-not-for-me-skipped",
                  }
                : undefined
            }
            testID="today-slot"
          />
        ) : null}
      </View>
      <Expander
        id="today-slot-reasons"
        headless
        open={slotReasons && skipped}
        onToggle={() => setOpen(null)}
      >
        <ReasonChips onPick={model.skippedFeedback} hint={false} />
      </Expander>
    </View>
  );
}

const styles = StyleSheet.create({
  area: { gap: theme.space.xs, alignItems: "stretch" },
  only: { textAlign: "center", paddingVertical: theme.space.md },
  slot: {
    minHeight: theme.size.controlSmall,
    alignItems: "center",
    justifyContent: "center",
  },
});
