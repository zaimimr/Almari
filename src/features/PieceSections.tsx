import { useState } from "react";
import { StyleSheet, View } from "react-native";
import type { Piece } from "../domain/closet";
import { dropFromToday } from "../domain/today";
import { setArchived } from "../domain/wardrobe";
import { t } from "../i18n";
import { useCloset } from "../state/closet";
import { AppText, Button, ErrorMessage } from "../ui";
import { theme } from "../ui/theme";

function useChange() {
  const { update } = useCloset();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function run(transform: Parameters<typeof update>[0]) {
    setBusy(true);
    setError(null);
    try {
      await update(transform);
    } catch {
      setError(t("piece.error.save"));
    } finally {
      setBusy(false);
    }
  }
  return { busy, error, run };
}

export function ArchiveSection({ piece }: { piece: Piece }) {
  const { busy, error, run } = useChange();
  const archived = piece.status === "archived";
  return (
    <View style={styles.section} testID="piece-archive">
      <AppText style={styles.label}>{t("archive.title")}</AppText>
      <AppText variant="caption" muted testID="archive-state">
        {archived ? t("archive.archived") : t("archive.help")}
      </AppText>
      <Button
        label={archived ? t("archive.restore") : t("archive.action")}
        secondary
        busy={busy}
        onPress={() => {
          void run((current) =>
            archived
              ? setArchived(current, piece.id, false)
              : dropFromToday(setArchived(current, piece.id, true), piece.id),
          );
        }}
      />
      <ErrorMessage message={error} />
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: theme.space.md },
  label: { fontWeight: "600" },
});
