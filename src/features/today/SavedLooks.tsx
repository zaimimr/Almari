import { useState } from "react";
import { StyleSheet, View } from "react-native";
import type { Closet, Piece, Session } from "../../domain/closet";
import { applyLook, applyRequest } from "../../domain/today";
import { matchingLooks, type LookVariant } from "../../domain/wardrobe";
import { t } from "../../i18n";
import { AppText, Button, PiecePhoto } from "../../ui";
import { theme } from "../../ui/theme";

const initial = 2;

export function SavedLooks({
  closet,
  session,
  busy,
  run,
}: {
  closet: Closet;
  session: Session;
  busy: boolean;
  run: (transform: (closet: Closet) => Closet) => Promise<boolean>;
}) {
  const [all, setAll] = useState(false);
  const { exact, variants } = matchingLooks(closet, session.request);
  if (!exact.length && !variants.length) return null;
  const current = [...session.pieceIds].sort().join();
  const shownExact = all ? exact : exact.slice(0, initial);
  const shownVariants = all ? variants : variants.slice(0, initial);
  const total = exact.length + variants.length;

  return (
    <View style={styles.section}>
      <AppText style={styles.label}>{t("looks.fromYourLooks")}</AppText>
      {shownExact.map(({ look, pieces, problems }) => {
        const showing = [...look.pieceIds].sort().join() === current;
        return (
          <View key={look.id} style={styles.card} testID={`look-${look.id}`}>
            <Thumbs pieces={pieces} />
            <View style={styles.text}>
              <AppText>{look.name}</AppText>
              <AppText variant="caption" muted>
                {problems[0]
                  ? t("looks.checkFirst", { message: problems[0].message })
                  : t("looks.fits")}
              </AppText>
            </View>
            <Button
              label={showing ? t("looks.showing") : t("looks.use")}
              secondary
              compact
              disabled={busy || showing}
              onPress={() => {
                void run((now) =>
                  applyLook(now, look.pieceIds, session.revision),
                );
              }}
            />
          </View>
        );
      })}
      {shownVariants.length ? (
        <AppText variant="caption" muted>
          {t("looks.needChange")}
        </AppText>
      ) : null}
      {shownVariants.map((variant) => (
        <View
          key={variant.look.id}
          style={styles.card}
          testID={`variant-${variant.look.id}`}
        >
          <Thumbs pieces={variant.pieces} />
          <View style={styles.text}>
            <AppText>
              {t("looks.variantOf", { name: variant.look.name })}
            </AppText>
            <AppText variant="caption" muted>
              {gapText(variant)}
            </AppText>
          </View>
          <Button
            label={t("looks.fillGap")}
            secondary
            compact
            disabled={busy}
            onPress={() => {
              void run((now) =>
                applyRequest(now, variant.repair, session.revision),
              );
            }}
          />
        </View>
      ))}
      {!all && total > shownExact.length + shownVariants.length ? (
        <Button
          label={t("looks.seeAll", { count: total })}
          secondary
          compact
          onPress={() => setAll(true)}
        />
      ) : null}
    </View>
  );
}

function gapText(variant: LookVariant) {
  const parts = variant.unavailable.map((piece) =>
    t(
      piece.status === "away"
        ? "looks.away"
        : piece.status === "archived"
          ? "looks.archived"
          : "looks.setAside",
      { name: piece.name },
    ),
  );
  if (variant.missing)
    parts.push(
      variant.missing === 1
        ? t("looks.missingOne")
        : t("looks.missingMany", { count: variant.missing }),
    );
  return parts.join(" ");
}

function Thumbs({ pieces }: { pieces: Piece[] }) {
  return (
    <View
      style={styles.thumbs}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {pieces.slice(0, 4).map((piece) => (
        <View key={piece.id} style={styles.thumb}>
          <PiecePhoto piece={piece} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: 12 },
  label: { fontWeight: "600" },
  card: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: theme.radius,
    borderCurve: "continuous",
    backgroundColor: theme.colors.surface,
  },
  text: { flex: 1, minWidth: 140, gap: 2 },
  thumbs: { flexDirection: "row", gap: 4 },
  thumb: {
    width: 40,
    height: 40,
    borderRadius: 8,
    borderCurve: "continuous",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: theme.colors.line,
  },
});
