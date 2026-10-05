import { StyleSheet, View } from "react-native";
import type { ImportJob } from "../../domain/closet";
import { t } from "../../i18n";
import { Button, Text, Tile } from "../../ui";
import { theme } from "../../ui/theme";
import { useColors } from "../../ui/useColors";
import { jobPhoto, jobPiece } from "./jobs";
import type { Lookalike } from "./useCaptureGrid";

export function Lookalikes({
  pairs,
  onOpen,
  onKeepBoth,
  onKeepOne,
}: {
  pairs: Lookalike[];
  onOpen: (job: ImportJob) => void;
  onKeepBoth: (job: ImportJob) => void;
  onKeepOne: (job: ImportJob) => void;
}) {
  const colors = useColors();
  if (!pairs.length) return null;
  return (
    <View style={styles.list}>
      {pairs.map(({ job, match, matchJob }) => (
        <View
          key={job.id}
          style={[styles.card, { backgroundColor: colors.surface }]}
          testID="lookalike"
        >
          <Text role="headline" accessibilityRole="header">
            {t("lookalike.title")}
          </Text>
          <View style={styles.row}>
            <View style={styles.cell}>
              <Tile
                image={jobPiece(job)}
                raw={jobPhoto(job).raw}
                size="grid"
                label={job.name}
                accessibilityLabel={job.name ?? t("capture.photo")}
                onPress={() => onOpen(job)}
              />
            </View>
            <View style={styles.cell}>
              <Tile
                image={match}
                raw={matchJob ? jobPhoto(matchJob).raw : false}
                size="grid"
                label={match.name}
                accessibilityLabel={match.name || t("capture.photo")}
                onPress={matchJob ? () => onOpen(matchJob) : undefined}
              />
            </View>
          </View>
          <View style={styles.actions}>
            <Button
              label={t("lookalike.keepOne")}
              variant="secondary"
              onPress={() => onKeepOne(job)}
              testID="lookalike-keep-one"
            />
            <Button
              label={t("lookalike.keepBoth")}
              variant="quiet"
              onPress={() => onKeepBoth(job)}
              testID="lookalike-keep-both"
            />
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: theme.space.lg },
  card: {
    borderRadius: theme.radius.lg,
    padding: theme.space.lg,
    gap: theme.space.md,
  },
  row: { flexDirection: "row", gap: theme.space.md },
  cell: { flex: 1, minWidth: 0 },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: theme.space.sm },
});
