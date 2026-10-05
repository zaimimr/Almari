import { StyleSheet, View } from "react-native";
import { router } from "expo-router";
import { namedSwatch } from "../../../src/domain/color";
import { closetBreakdown } from "../../../src/domain/profileStats";
import { colourLabel } from "../../../src/features/ColourChips";
import { categoryName, t } from "../../../src/i18n";
import { useCloset } from "../../../src/state/closet";
import { now } from "../../../src/state/clock";
import { clockFor } from "../../../src/domain/today";
import { Row, Rows, Screen, Section } from "../../../src/ui";
import { theme } from "../../../src/ui/theme";

const hex = (name: string) =>
  `#${namedSwatch(name)
    .rgb.map((part) => part.toString(16).padStart(2, "0"))
    .join("")}`;

const wornText = (name: string, count: number) =>
  count === 0
    ? t("stats.wornNever", { name })
    : count === 1
      ? t("stats.wornOnce", { name })
      : t("stats.wornMany", { name, count });

export default function ClosetStats() {
  const { closet } = useCloset();
  const stats = closetBreakdown(closet, clockFor(now()));
  const worn = (entries: typeof stats.mostWorn, id: string) =>
    entries.map(({ piece, count }, index) => (
      <Row
        key={piece.id}
        title={wornText(piece.name, count)}
        leading={{ thumb: piece }}
        trailing="chevron"
        onPress={() => router.push(`/piece/${piece.id}`)}
        last={index === entries.length - 1}
        testID={`${id}-${piece.id}`}
      />
    ));

  return (
    <Screen title={t("stats.title")} testID="closet-stats-screen">
      <View style={styles.content}>
        <Section>
          <Rows>
            <Row
              title={t("stats.pieces")}
              trailing={{ value: String(stats.pieces) }}
              testID="stats-pieces"
            />
            <Row
              title={t("stats.thisMonth")}
              trailing={{ value: String(stats.wearsThisMonth) }}
              last
              testID="stats-month"
            />
          </Rows>
        </Section>
        <Section title={t("stats.colours")}>
          {stats.colours.length ? (
            <Rows>
              {stats.colours.map(({ name, count }, index) => (
                <Row
                  key={name}
                  title={colourLabel(name)}
                  leading={{ swatch: hex(name) }}
                  trailing={{ value: String(count) }}
                  last={index === stats.colours.length - 1}
                />
              ))}
            </Rows>
          ) : null}
        </Section>
        <Section title={t("stats.categories")}>
          {stats.categories.length ? (
            <Rows>
              {stats.categories.map(({ id, count }, index) => (
                <Row
                  key={id}
                  title={categoryName(id)}
                  trailing={{ value: String(count) }}
                  last={index === stats.categories.length - 1}
                />
              ))}
            </Rows>
          ) : null}
        </Section>
        <Section title={t("stats.mostWorn")}>
          {stats.mostWorn.length ? (
            <Rows>{worn(stats.mostWorn, "stats-most")}</Rows>
          ) : null}
        </Section>
        <Section title={t("stats.leastWorn")}>
          {stats.leastWorn.length ? (
            <Rows>{worn(stats.leastWorn, "stats-least")}</Rows>
          ) : null}
        </Section>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: theme.space.xl },
});
