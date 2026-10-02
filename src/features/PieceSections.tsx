import { useState } from "react";
import { StyleSheet, View } from "react-native";
import type { Category, Piece, Traits } from "../domain/closet";
import type { WeatherKey } from "../domain/pieceWeather";
import { dropFromToday } from "../domain/today";
import { confirmPiece, setArchived } from "../domain/wardrobe";
import { t } from "../i18n";
import { useCloset } from "../state/closet";
import { AppText, Button, ChoiceGroup, ErrorMessage } from "../ui";
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

const clothing: Category[] = ["top", "tunic", "dress", "layer"];

function yesNo(value: boolean | undefined) {
  return value === undefined ? null : value ? "yes" : "no";
}

export function WeatherSection({ piece }: { piece: Piece }) {
  const { busy, error, run } = useChange();
  const shoes = piece.category === "shoes";
  if (!shoes && !clothing.includes(piece.category)) return null;
  const suggested = (key: WeatherKey) => piece.sources?.[key] === "proposed";
  const label = (name: string, key: WeatherKey) =>
    suggested(key) ? t("pieceWeather.suggested", { label: name }) : name;
  const confirm = (traits: Partial<Pick<Traits, WeatherKey>>) => {
    void run((current) => confirmPiece(current, piece.id, { traits }));
  };
  const anySuggested = (["warmth", "rain", "snow"] as const).some(suggested);
  return (
    <View style={styles.section} testID="piece-weather">
      <AppText style={styles.label}>{t("pieceWeather.title")}</AppText>
      {shoes ? (
        <>
          <ChoiceGroup
            label={label(t("pieceWeather.rain"), "rain")}
            options={[
              { id: "yes", label: t("pieceWeather.rainYes") },
              { id: "no", label: t("pieceWeather.rainNo") },
            ]}
            value={yesNo(piece.traits?.rain)}
            disabled={busy}
            onChange={(value) => confirm({ rain: value === "yes" })}
          />
          <ChoiceGroup
            label={label(t("pieceWeather.snow"), "snow")}
            options={[
              { id: "yes", label: t("pieceWeather.snowYes") },
              { id: "no", label: t("pieceWeather.snowNo") },
            ]}
            value={yesNo(piece.traits?.snow)}
            disabled={busy}
            onChange={(value) => confirm({ snow: value === "yes" })}
          />
        </>
      ) : (
        <ChoiceGroup
          label={label(t("pieceWeather.warmth"), "warmth")}
          options={[
            { id: "light", label: t("pieceWeather.light") },
            { id: "medium", label: t("pieceWeather.medium") },
            { id: "warm", label: t("pieceWeather.warm") },
          ]}
          value={piece.traits?.warmth ?? null}
          disabled={busy}
          onChange={(warmth) => confirm({ warmth })}
        />
      )}
      <AppText variant="caption" muted>
        {anySuggested
          ? t("pieceWeather.helpSuggested")
          : t("pieceWeather.help")}
      </AppText>
      <ErrorMessage message={error} />
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: theme.space.md },
  label: { fontWeight: "600" },
});
