import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { router } from "expo-router";
import type { Closet } from "../../domain/closet";
import { weekPlan } from "../../domain/looks";
import { locale, t } from "../../i18n";
import { FlatLay, Row, Rows, Section, Symbol, Text } from "../../ui";
import { shortWeekday, spokenDate } from "../../ui/dates";
import { theme } from "../../ui/theme";
import { useColors } from "../../ui/useColors";
import { useLargeText } from "../../ui/useLargeText";

const slot = 72;

export function WeekStrip({
  closet,
  today,
}: {
  closet: Closet;
  today: string;
}) {
  const colors = useColors();
  const { ax } = useLargeText();
  const week = weekPlan(closet, today).map(({ date, look }) => ({
    date,
    look,
    pieces: (look?.pieceIds ?? []).flatMap((id) => {
      const piece = closet.pieces.find((item) => item.id === id);
      return piece ? [piece] : [];
    }),
    label: look
      ? t("looks.plannedDay", {
          date: spokenDate(date, locale),
          name: look.name,
        })
      : t("looks.emptyDay", { date: spokenDate(date, locale) }),
    open: () =>
      look
        ? router.push(`/look/${look.id}`)
        : router.push({ pathname: "/looks/plan", params: { date } }),
  }));

  if (ax)
    return (
      <Section title={t("looks.week")}>
        <Rows>
          {week.map((day, index) => (
            <Row
              key={day.date}
              title={spokenDate(day.date, locale)}
              meta={day.look?.name}
              trailing="chevron"
              accessibilityLabel={day.label}
              onPress={day.open}
              last={index === week.length - 1}
              testID={`week-${day.date}`}
            />
          ))}
        </Rows>
      </Section>
    );

  return (
    <Section title={t("looks.week")}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.scroller}
        contentContainerStyle={styles.days}
      >
        {week.map((day) => (
          <Pressable
            key={day.date}
            onPress={day.open}
            accessibilityRole="button"
            accessibilityLabel={day.label}
            style={styles.day}
            testID={`week-${day.date}`}
          >
            <Text
              role="footnote"
              tone={day.date === today ? "ink" : "muted"}
              numberOfLines={1}
            >
              {shortWeekday(day.date, locale)} {Number(day.date.slice(8))}
            </Text>
            {day.look ? (
              <View style={[styles.slot, { backgroundColor: colors.sunken }]}>
                <FlatLay pieces={day.pieces} size="mini" />
              </View>
            ) : (
              <View
                style={[
                  styles.slot,
                  styles.empty,
                  { borderColor: colors.lineField },
                ]}
              >
                <Symbol name="plus" size={theme.size.iconInline} tone="muted" />
              </View>
            )}
          </Pressable>
        ))}
      </ScrollView>
    </Section>
  );
}

const styles = StyleSheet.create({
  scroller: { marginHorizontal: -theme.space.lg },
  days: {
    flexDirection: "row",
    gap: theme.space.sm,
    paddingHorizontal: theme.space.lg,
  },
  day: { width: slot, alignItems: "center", gap: theme.space.xs },
  slot: {
    width: slot,
    height: slot,
    borderRadius: theme.radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  empty: { borderWidth: 1, borderStyle: "dashed" },
});
