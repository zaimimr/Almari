import { StyleSheet, View } from "react-native";
import { router } from "expo-router";
import { locale, t } from "../../src/i18n";
import {
  MonthGrid,
  Row,
  Rows,
  Screen,
  Section,
  Text,
  useMonthGridFits,
} from "../../src/ui";
import { monthTitle, percent, shortDate, spokenDate } from "../../src/ui/dates";
import { theme } from "../../src/ui/theme";
import { setPendingFilter } from "../../src/state/closetFilter";
import { useCalendar } from "../../src/features/looks/useCalendar";
import { monthName, occasionText } from "../../src/features/looks/format";

const setKey = (ids: string[]) => [...ids].sort().join(",");

export default function CalendarScreen() {
  const {
    closet,
    today,
    month,
    first,
    days,
    marks,
    wornCount,
    selected,
    select,
    page,
    stats,
  } = useCalendar();
  const fits = useMonthGridFits();
  const title = monthTitle(month, locale);
  const wears = selected ? (days[selected]?.wears ?? []) : [];

  const wearRows = wears.map((wear, index) => {
    const pieces = wear.pieceIds.flatMap((id) => {
      const piece = closet.pieces.find((item) => item.id === id);
      return piece ? [piece] : [];
    });
    return (
      <Row
        key={wear.eventId}
        title={wear.name}
        meta={occasionText(wear.occasion) ?? undefined}
        leading={{ lay: pieces, size: "mini" }}
        trailing="chevron"
        onPress={() =>
          router.push(`/look/${wear.lookId ?? `set-${setKey(wear.pieceIds)}`}`)
        }
        last={index === wears.length - 1}
        testID={`wear-${wear.eventId}`}
      />
    );
  });

  return (
    <Screen title={t("calendar.title")}>
      <MonthGrid
        mode="wear"
        month={month}
        today={today}
        selected={selected}
        onSelect={select}
        onMonth={page}
        days={marks}
        first={first}
        monthLabel={
          wornCount === 1
            ? t("calendar.monthLabelOne", { month: title })
            : wornCount
              ? t("calendar.monthLabelMany", { month: title, count: wornCount })
              : title
        }
        dayLabel={(date) =>
          t(date === today ? "calendar.today" : "calendar.day", {
            date: spokenDate(date, locale),
          })
        }
        wornCount={wornCount}
      >
        {selected && wears.length ? (
          fits ? (
            <Section title={shortDate(selected, locale)}>{wearRows}</Section>
          ) : (
            <View>{wearRows}</View>
          )
        ) : null}
      </MonthGrid>
      {wornCount ? (
        <>
          <Section title={t("stats.mostWorn")}>
            {stats.mostWorn.map(({ piece, count }, index) => (
              <Row
                key={piece.id}
                title={piece.name}
                meta={t("calendar.timesMany", { count })}
                leading={{ thumb: piece }}
                trailing="chevron"
                onPress={() => router.push(`/piece/${piece.id}`)}
                last={index === stats.mostWorn.length - 1}
              />
            ))}
          </Section>
          {stats.variety !== null ? (
            <View style={styles.variety}>
              <Rows>
                <Row
                  title={t("calendar.variety")}
                  meta={t("calendar.varietyValue", {
                    percent: percent(stats.variety, locale),
                  })}
                  trailing="chevron"
                  onPress={() => {
                    setPendingFilter({
                      wear: "not-worn-lately",
                      panelOpen: true,
                    });
                    router.navigate("/(tabs)/closet");
                  }}
                  testID="calendar-variety"
                />
              </Rows>
            </View>
          ) : null}
        </>
      ) : (
        <Text role="body" tone="muted">
          {t("calendar.emptyMonth", { month: monthName(month) })}
        </Text>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  variety: { marginTop: theme.space.lg },
});
