import { StyleSheet, View } from "react-native";
import { router } from "expo-router";
import { randomUUID } from "expo-crypto";
import * as Haptics from "expo-haptics";
import { locale, t } from "../../src/i18n";
import {
  Button,
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
import { wearAgain } from "../../src/features/looks/actions";
import { useCloset } from "../../src/state/closet";
import { monthName, occasionText } from "../../src/features/looks/format";

const setKey = (ids: string[]) => [...ids].sort().join(",");

export default function CalendarScreen() {
  const {
    closet,
    today,
    month,
    first,
    last,
    days,
    marks,
    dots,
    plans,
    planned,
    wornCount,
    selected,
    select,
    page,
    stats,
  } = useCalendar();
  const fits = useMonthGridFits();
  const { update } = useCloset();
  const title = monthTitle(month, locale);
  const wears = selected ? (days[selected]?.wears ?? []) : [];
  const plan = selected ? plans[selected] : undefined;
  const again = selected && selected < today ? wears[0] : undefined;

  const wearToday = async () => {
    if (!again) return;
    try {
      await update(wearAgain(again, randomUUID()));
    } catch {
      return;
    }
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.dismissTo("/(tabs)/today");
  };

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
        last={index === wears.length - 1 && !plan}
        testID={`wear-${wear.eventId}`}
      />
    );
  });

  const planRows = plan
    ? [
        <Row
          key={plan.id}
          title={plan.name}
          meta={occasionText(plan.occasion ?? null) ?? undefined}
          leading={{
            lay: plan.pieceIds.flatMap((id) => {
              const piece = closet.pieces.find((item) => item.id === id);
              return piece ? [piece] : [];
            }),
            size: "mini",
          }}
          trailing="chevron"
          onPress={() => router.push(`/look/${plan.id}`)}
          last
          testID={`planned-${plan.id}`}
        />,
      ]
    : [];
  const rows = [...wearRows, ...planRows];
  const rowsBody = (
    <>
      {rows}
      {again ? (
        <View style={styles.start}>
          <Button
            label={t("looks.wearAgain")}
            variant="quiet"
            icon="arrow.counterclockwise"
            onPress={() => void wearToday()}
            testID="calendar-wear-again"
          />
        </View>
      ) : null}
    </>
  );

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
        planned={planned}
        dots={dots}
        first={first}
        last={last}
        monthLabel={
          wornCount === 1
            ? t("calendar.monthLabelOne", { month: title })
            : wornCount
              ? t("calendar.monthLabelMany", { month: title, count: wornCount })
              : title
        }
        dayLabel={(date) =>
          t(
            plans[date] && !days[date]?.wears.length
              ? "calendar.planned"
              : date === today
                ? "calendar.today"
                : "calendar.day",
            { date: spokenDate(date, locale) },
          )
        }
        wornCount={wornCount}
      >
        {selected && rows.length ? (
          fits ? (
            <Section title={shortDate(selected, locale)}>{rowsBody}</Section>
          ) : (
            <View>{rowsBody}</View>
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
  start: { alignItems: "flex-start", marginLeft: -theme.space.sm },
  variety: { marginTop: theme.space.lg },
});
