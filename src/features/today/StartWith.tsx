import { StyleSheet, View } from "react-native";
import { router } from "expo-router";
import type { GarmentKind } from "../../domain/closet";
import { applyRequest } from "../../domain/today";
import { matchingLooks } from "../../domain/wardrobe";
import { t } from "../../i18n";
import { Chip, Row, Rows, Section } from "../../ui";
import { theme } from "../../ui/theme";
import type { TodayModel } from "./useToday";

const sameIds = (a: string[], b: string[]) =>
  [...a].sort().join() === [...b].sort().join();

export function StartWith({ model }: { model: TodayModel }) {
  const { closet, request, session, revision } = model;
  if (!request || !session) return null;
  const { exact, variants } = matchingLooks(closet, request);
  const rows = [
    ...exact.map((match) => ({
      look: match.look,
      pieces: match.pieces,
      meta: undefined as string | undefined,
      onPress: () => void model.showLook(match.look.pieceIds),
    })),
    ...variants.map((variant) => ({
      look: variant.look,
      pieces: variant.pieces,
      meta: t("looks.variantOf", { name: variant.look.name }),
      onPress: () =>
        void model.restyle(
          (current) => applyRequest(current, variant.repair, revision),
          { kind: "undo", revision: revision + 1, another: false },
        ),
    })),
  ];
  const shown = rows.slice(0, 3);

  const garment = (kind: GarmentKind) => ({
    selected: request.garmentType === kind,
    onPress: () =>
      void model.change({
        garmentType: request.garmentType === kind ? null : kind,
      }),
  });

  return (
    <Section
      title={t("today.startWith")}
      action={
        rows.length > shown.length
          ? {
              label: t("common.showAll"),
              onPress: () => router.push("/looks"),
            }
          : undefined
      }
      testID="today-start-with"
    >
      <View style={styles.body}>
        {shown.length > 0 ? (
          <Rows>
            {shown.map((row, index) => {
              const showing = sameIds(row.look.pieceIds, session.pieceIds);
              return (
                <Row
                  key={row.look.id}
                  title={row.look.name}
                  meta={row.meta}
                  leading={{ lay: row.pieces }}
                  trailing={showing ? "selected" : "chevron"}
                  radio
                  accessibilityLabel={t("today.lookLabel", {
                    look: row.look.name,
                  })}
                  onPress={showing ? () => undefined : row.onPress}
                  last={index === shown.length - 1}
                  testID={`start-look-${row.look.id}`}
                />
              );
            })}
          </Rows>
        ) : null}
        <View style={styles.chips}>
          <Chip
            label={t("today.garment.hijab")}
            kind="control"
            role="checkbox"
            disabled={model.busy}
            testID="start-hijab"
            {...garment("hijab")}
          />
          <Chip
            label={t("today.garment.knit")}
            kind="control"
            role="checkbox"
            disabled={model.busy}
            testID="start-knit"
            {...garment("sweater")}
          />
          <Chip
            label={t("today.startWithPiece")}
            kind="control"
            opens="screen"
            onPress={() => router.push("/today/pieces")}
            testID="start-piece"
          />
        </View>
      </View>
    </Section>
  );
}

const styles = StyleSheet.create({
  body: { gap: theme.space.md },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: theme.space.sm },
});
