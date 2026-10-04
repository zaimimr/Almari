import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { nextLocalDate } from "../../domain/today";
import { locale, t } from "../../i18n";
import {
  Chip,
  Expander,
  MonthGrid,
  fullDate,
  monthTitle,
  shortDate,
  spokenDate,
} from "../../ui";
import { theme } from "../../ui/theme";

function shiftMonth(month: string, delta: -1 | 1): string {
  const year = Number(month.slice(0, 4));
  const index = Number(month.slice(5, 7));
  const next = new Date(Date.UTC(year, index - 1 + delta, 1));
  return `${next.getUTCFullYear()}-${String(next.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function WhenRow({
  date,
  today,
  tomorrow,
  onChange,
}: {
  date: string;
  today: string;
  tomorrow: string;
  onChange: (date: string) => void;
}) {
  const from = nextLocalDate(tomorrow);
  const picked = date !== today && date !== tomorrow ? date : null;
  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState((picked ?? from).slice(0, 7));

  const choose = (next: string) => {
    setOpen(false);
    onChange(next);
  };

  return (
    <View style={styles.when}>
      <View style={styles.chips} accessibilityRole="radiogroup">
        <Chip
          label={t("adjust.today")}
          selected={date === today}
          role="radio"
          onPress={() => choose(today)}
          testID="when-today"
        />
        <Chip
          label={t("adjust.tomorrow")}
          selected={date === tomorrow}
          role="radio"
          onPress={() => choose(tomorrow)}
          testID="when-tomorrow"
        />
        <Chip
          label={picked ? shortDate(picked, locale) : t("adjust.pickDate")}
          kind="control"
          opens="expander"
          expanded={open}
          selected={Boolean(picked)}
          accessibilityLabel={t("adjust.pickDate")}
          accessibilityValue={picked ? fullDate(picked, locale) : undefined}
          onPress={() => setOpen((current) => !current)}
          testID="when-pick"
        />
      </View>
      <Expander
        id="when"
        headless
        open={open}
        onToggle={() => setOpen((current) => !current)}
      >
        <MonthGrid
          mode="pick"
          month={month}
          today={today}
          from={from}
          selected={picked}
          onSelect={choose}
          onMonth={(delta) => setMonth((current) => shiftMonth(current, delta))}
          monthLabel={monthTitle(month, locale)}
          dayLabel={(day) => spokenDate(day, locale)}
          testID="pick"
        />
      </Expander>
    </View>
  );
}

const styles = StyleSheet.create({
  when: { gap: theme.space.md },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: theme.space.sm },
});
