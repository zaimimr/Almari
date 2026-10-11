import {
  ActionSheetIOS,
  Alert,
  Platform,
  StyleSheet,
  View,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { occasionLabel, occasionOptions } from "../../src/domain/closet";
import { outfitName } from "../../src/domain/outfitName";
import { weekOccasion, type PlannedDay } from "../../src/domain/weekPlanning";
import { useWeekPlanning } from "../../src/features/weekPlanning/useWeekPlanning";
import { locale, t } from "../../src/i18n";
import {
  Button,
  ChipRow,
  Footer,
  Row,
  Rows,
  Screen,
  Section,
  Text,
} from "../../src/ui";
import { shortDate, spokenDate } from "../../src/ui/dates";
import { theme } from "../../src/ui/theme";

function choose(
  title: string,
  choices: { label: string; select: () => void }[],
) {
  if (Platform.OS === "ios") {
    ActionSheetIOS.showActionSheetWithOptions(
      {
        title,
        options: [...choices.map((choice) => choice.label), t("common.cancel")],
        cancelButtonIndex: choices.length,
      },
      (index) => choices[index]?.select(),
    );
    return;
  }
  Alert.alert(title, undefined, [
    ...choices.map((choice) => ({
      text: choice.label,
      onPress: choice.select,
    })),
    { text: t("common.cancel"), style: "cancel" },
  ]);
}

function weatherLabel(day: PlannedDay): string {
  const weather = day.request.weather;
  if (weather.source === "unknown") return t("week.unknownWeather");
  return [
    t(`weather.${weather.warmth}`),
    weather.precipitation === "rain"
      ? t("weather.rainSuffix").replace(/^,\s*/, "")
      : weather.precipitation === "snow"
        ? t("weather.snowSuffix").replace(/^,\s*/, "")
        : null,
  ]
    .filter(Boolean)
    .join(", ");
}

export default function PlanWeekScreen() {
  const planner = useWeekPlanning();
  const defaultPreset = planner.presets.find(
    (preset) => preset.id === planner.presetId,
  );
  const selectDay = (date: string) =>
    choose(spokenDate(date, locale), [
      { label: t("week.currentStyle"), select: () => planner.resetDay(date) },
      ...planner.presets.map((preset) => ({
        label: preset.name,
        select: () => planner.setDayPreset(date, preset.id),
      })),
      ...occasionOptions().map((occasion) => ({
        label: occasion.label,
        select: () => planner.setOccasion(date, occasion.id),
      })),
    ]);

  return (
    <Screen
      title={t("week.title")}
      testID="plan-week"
      footer={
        <Footer
          error={planner.error}
          primary={
            planner.preview
              ? {
                  label: t("week.save", { count: planner.selected.length }),
                  onPress: () => void planner.save(),
                  disabled: !planner.selected.length,
                  busy: planner.busy,
                  testID: "week-save",
                }
              : {
                  label: t("week.preview"),
                  onPress: planner.generate,
                  testID: "week-preview",
                }
          }
        />
      }
    >
      {planner.preview ? (
        <>
          <Button
            variant="quiet"
            label={t("week.edit")}
            onPress={planner.edit}
            testID="week-edit"
          />
          <Rows>
            {planner.preview.days.map((day, index) => {
              const pieces = day.pieceIds.flatMap((id) =>
                planner.closet.pieces.filter((piece) => piece.id === id),
              );
              const name =
                day.existing?.name ??
                (pieces.length
                  ? outfitName(pieces, day.request.occasion, locale)
                  : t("week.gap"));
              const meta = [
                name,
                day.existing
                  ? t("week.kept")
                  : occasionLabel(day.request.occasion),
                weatherLabel(day),
                day.repeated ? t("week.repeated") : null,
                ...day.problems.map((problem) => problem.message),
              ]
                .filter(Boolean)
                .join(" · ");
              return (
                <Row
                  key={day.date}
                  title={spokenDate(day.date, locale)}
                  meta={meta}
                  leading={pieces.length ? { lay: pieces } : undefined}
                  checked={
                    !day.existing && pieces.length
                      ? planner.selected.includes(day.date)
                      : undefined
                  }
                  onPress={
                    !day.existing && pieces.length
                      ? () => planner.toggle(day.date)
                      : undefined
                  }
                  last={index === 6}
                  testID={`week-preview-${day.date}`}
                />
              );
            })}
          </Rows>
          {!planner.preview.days.some(
            (day) => !day.existing && day.pieceIds.length,
          ) ? (
            <Text tone="muted">{t("week.noNewDays")}</Text>
          ) : null}
        </>
      ) : (
        <>
          <Section title={t("week.start")}>
            <DateTimePicker
              mode="date"
              display="compact"
              value={new Date(`${planner.start}T12:00:00`)}
              minimumDate={new Date(`${planner.today}T00:00:00`)}
              locale={locale === "nb" ? "nb-NO" : "en-GB"}
              onValueChange={(_event, date) =>
                planner.changeStart(
                  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`,
                )
              }
              accessibilityLabel={t("week.start")}
              testID="week-start"
            />
          </Section>
          <Section title={t("week.style")}>
            <ChipRow
              options={[
                { id: "", label: t("week.currentStyle") },
                ...planner.presets.map((preset) => ({
                  id: preset.id,
                  label: preset.name,
                })),
              ]}
              value={planner.presetId ?? ""}
              onChange={(id) => {
                if (!Array.isArray(id)) planner.changePreset(id || null);
              }}
              testID="week-style"
            />
          </Section>
          <Section title={t("week.days")}>
            <Rows>
              {planner.slots.map(({ date, look }, index) => {
                const preset =
                  planner.presets.find(
                    (item) => item.id === planner.dayPresetIds[date],
                  ) ??
                  defaultPreset ??
                  planner.presets.find(
                    (preset) => preset.occasion === weekOccasion(date),
                  );
                return (
                  <Row
                    key={date}
                    title={shortDate(date, locale)}
                    meta={
                      look
                        ? `${look.name} · ${t("week.kept")}`
                        : [
                            preset?.name,
                            occasionLabel(
                              planner.occasions[date] ??
                                preset?.occasion ??
                                weekOccasion(date),
                            ),
                          ]
                            .filter(Boolean)
                            .join(" · ")
                    }
                    onPress={look ? undefined : () => selectDay(date)}
                    trailing={look ? undefined : "chevron"}
                    last={index === 6}
                    testID={`week-config-${date}`}
                  />
                );
              })}
            </Rows>
          </Section>
          <View style={styles.end} />
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({ end: { height: theme.space.sm } });
