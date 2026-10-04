import {
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
} from "react-native";
import { lastWorn } from "../../domain/closetFilters";
import type { Piece } from "../../domain/closet";
import { clockFor, stylePiece } from "../../domain/today";
import { locale, t } from "../../i18n";
import { now } from "../../state/clock";
import { Row, Rows, Section, Tile, shortDate } from "../../ui";
import { gutterFor, theme } from "../../ui/theme";
import { useLargeText } from "../../ui/useLargeText";
import { tileLabel } from "../ChangeStrip";
import type { TodayModel } from "./useToday";

export function Rediscover({ model }: { model: TodayModel }) {
  const { ax } = useLargeText();
  const gutter = gutterFor(useWindowDimensions().width);
  const pieces = model.rediscoverPieces;
  if (pieces.length === 0) return null;
  const worn = lastWorn(model.closet);
  const meta = (piece: Piece) => {
    const date = worn[piece.id];
    return date
      ? t("looks.lastWorn", { date: shortDate(date, locale) })
      : t("closet.neverWorn");
  };
  const start = (piece: Piece) =>
    void model.restyle(
      (current) => stylePiece(current, piece.id, clockFor(now())),
      null,
    );

  return (
    <Section title={t("today.rediscover")} testID="today-rediscover">
      {ax ? (
        <Rows>
          {pieces.map((piece, index) => (
            <Row
              key={piece.id}
              title={piece.name}
              meta={meta(piece)}
              leading={{ thumb: piece }}
              trailing="chevron"
              onPress={() => start(piece)}
              last={index === pieces.length - 1}
              testID={`rediscover-${piece.id}`}
            />
          ))}
        </Rows>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginRight: -gutter }}
          contentContainerStyle={styles.row}
        >
          {pieces.map((piece) => (
            <View key={piece.id} style={styles.tile}>
              <Tile
                image={piece}
                size="strip"
                label={piece.name}
                meta={meta(piece)}
                accessibilityLabel={`${tileLabel(piece)}, ${meta(piece)}`}
                onPress={() => start(piece)}
                testID={`rediscover-${piece.id}`}
              />
            </View>
          ))}
        </ScrollView>
      )}
    </Section>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: theme.space.md },
  tile: { width: 112 },
});
