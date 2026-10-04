import { StyleSheet, View } from "react-native";
import { router } from "expo-router";
import { chips, type Chip as FeedbackChip } from "../../domain/feedback";
import { t } from "../../i18n";
import { Button, ChipRow, Expander, Text } from "../../ui";
import { theme } from "../../ui/theme";
import { useLargeText } from "../../ui/useLargeText";
import { CheckCard } from "./CheckCard";
import type { TodayModel } from "./useToday";

export function ReasonChips({
  onPick,
  hint,
}: {
  onPick: (chip: FeedbackChip) => void;
  hint: boolean;
}) {
  return (
    <ChipRow
      options={chips.map(({ id, label }) => ({
        id,
        label,
        accessibilityLabel: hint
          ? id === "hijab-mismatch"
            ? `${label}, ${t("change.hintHijab")}`
            : t("outfit.chipHint", { chip: label })
          : undefined,
      }))}
      value={null}
      optional
      onChange={(next) => {
        if (typeof next === "string") onPick(next);
      }}
      inSurface
      testID="reason-chips"
    />
  );
}

export function OutfitCard({ model }: { model: TodayModel }) {
  const { large } = useLargeText();
  const { open, setOpen, mode, savedLook, busy } = model;
  const planOnly = mode === "planning" || mode === "tomorrow";
  const reasonsOpen = open?.kind === "reasons";

  const icons = (
    <View style={styles.icons}>
      <Button
        label={t("outfit.like")}
        variant="icon"
        icon="hand.thumbsup"
        selectedIcon="hand.thumbsup.fill"
        selected={model.liked}
        onPress={model.like}
        testID={model.liked ? "today-like-on" : "today-like"}
      />
      <Button
        label={t("outfit.notForMe")}
        variant="icon"
        icon="hand.thumbsdown"
        expanded={reasonsOpen}
        onPress={() => setOpen(reasonsOpen ? null : { kind: "reasons" })}
        testID="today-not-for-me"
      />
      {planOnly ? null : (
        <Button
          label={savedLook ? t("today.openLook") : t("common.saveLook")}
          accessibilityValue={savedLook ? t("result.saved") : undefined}
          variant="icon"
          icon={savedLook ? "bookmark.fill" : "bookmark"}
          disabled={busy && !savedLook}
          onPress={() => {
            if (savedLook)
              router.push({
                pathname: "/look/[id]",
                params: { id: savedLook.id },
              });
            else void model.saveLook();
          }}
          testID={savedLook ? "today-save-saved" : "today-save"}
        />
      )}
    </View>
  );

  return (
    <View style={styles.card}>
      <View style={[styles.titleLine, large && styles.titleStacked]}>
        <Text
          role="title"
          style={styles.title}
          accessibilityRole="header"
          testID="today-title"
        >
          {model.name}
        </Text>
        {large ? null : icons}
      </View>
      {model.reasonLine ? (
        <Text role="footnote" tone="muted" testID="today-reason">
          {model.reasonLine}
        </Text>
      ) : null}
      {large ? icons : null}
      <Expander
        id="today-reasons"
        headless
        open={reasonsOpen}
        onToggle={() => setOpen(null)}
      >
        <ReasonChips onPick={model.feedback} hint />
      </Expander>
      {model.checks.flatMap((problem) =>
        problem.actions.flatMap((action) => {
          if (action.type !== "check-piece") return [];
          const piece = model.pieces.find((item) => item.id === action.id);
          return piece
            ? [
                <CheckCard
                  key={`${piece.id}-${action.ask}`}
                  piece={piece}
                  ask={action.ask}
                  busy={busy}
                  onSave={(transform) => void model.run(transform)}
                  onUseAnother={() =>
                    setOpen({ kind: "strip", pieceId: piece.id })
                  }
                />,
              ]
            : [];
        }),
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { gap: theme.space.sm },
  titleLine: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.space.sm,
  },
  titleStacked: { flexDirection: "column", alignItems: "flex-start" },
  title: { flex: 1, minWidth: 0 },
  icons: { flexDirection: "row", marginRight: -theme.space.sm },
});
