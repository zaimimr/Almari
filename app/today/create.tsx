import { useCallback, useMemo, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import {
  isAvailable,
  occasionOptions,
  styleOptions,
  type Feel,
  type Occasion,
  type OutfitRequest,
  type Style,
} from "../../src/domain/closet";
import {
  parseBrief,
  slotOf,
  windowFor,
  windowSky,
  windowTemp,
  windowWeather,
  type When,
} from "../../src/domain/day";
import { roleOf } from "../../src/domain/styling";
import {
  clockFor,
  ensureToday,
  nextLocalDate,
  startOccasion,
  startPlan,
  wornMains,
} from "../../src/domain/today";
import { forecastWeather } from "../../src/domain/weather";
import { takePicked } from "../../src/features/adjust/useAdjust";
import { degrees, skyIcon, whenLabel } from "../../src/features/today/sky";
import { t } from "../../src/i18n";
import { useCloset } from "../../src/state/closet";
import { now } from "../../src/state/clock";
import {
  ChipRow,
  EmptyState,
  Expander,
  Footer,
  Row,
  Screen,
  Section,
  Segmented,
  Symbol,
  Text,
} from "../../src/ui";
import { theme } from "../../src/ui/theme";
import { useColors } from "../../src/ui/useColors";

const feels: Feel[] = ["comfy", "smart", "dressed"];

export default function CreateFit() {
  const params = useLocalSearchParams<{ day?: string; text?: string }>();
  const tomorrow = params.day === "tomorrow";
  const { closet, update } = useCloset();
  const colors = useColors();
  const clock = clockFor(now());
  const hour = now().getHours();
  const date = tomorrow ? nextLocalDate(clock.localDate) : clock.localDate;
  const base = closet.styling.today?.everyday.request ?? null;
  const preset = closet.styling.everyday;
  const brief = useMemo(() => parseBrief(params.text ?? ""), [params.text]);

  const whens: When[] = tomorrow
    ? ["morning", "afternoon", "evening"]
    : hour >= windowFor("evening", hour).from
      ? ["now"]
      : hour >= windowFor("afternoon", hour).from
        ? ["now", "evening"]
        : ["now", "afternoon", "evening"];
  const firstWhen = whens[0] ?? "now";
  const fromBrief = brief.when ?? null;

  const [occasion, setOccasion] = useState<Occasion>(
    brief.occasion ?? base?.occasion ?? "everyday",
  );
  const [when, setWhen] = useState<When>(
    fromBrief && whens.includes(fromBrief) ? fromBrief : firstWhen,
  );
  const [feel, setFeel] = useState<Feel>(
    brief.feel ??
      (brief.occasion && brief.occasion !== "everyday" ? "smart" : "comfy"),
  );
  const [style, setStyle] = useState<Style>(
    brief.style ?? base?.style ?? "western",
  );
  const [keptIds, setKeptIds] = useState<string[]>([]);
  const [hijabId, setHijabId] = useState<string | null>(null);
  const [more, setMore] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      const ids = takePicked();
      if (ids) setKeptIds(ids);
    }, []),
  );

  const stored = closet.styling.forecast;
  const hours =
    stored?.hours && forecastWeather(stored, clock.localDate, clock.timeZone)
      ? stored.hours
      : [];
  const weatherOf = (option: When) => {
    const window = windowFor(option, hour);
    return {
      window,
      celsius: windowTemp(hours, date, window.from, window.to, clock.timeZone),
      sky: windowSky(hours, date, window.from, window.to, clock.timeZone),
    };
  };
  const units = closet.styling.units;

  const hijabs = base
    ? closet.pieces.filter(
        (piece) =>
          isAvailable(piece) &&
          piece.source === base.wardrobe &&
          roleOf(piece) === "hijab",
      )
    : [];
  const kept = keptIds.flatMap((id) =>
    closet.pieces.filter((piece) => piece.id === id),
  );

  if (!base)
    return (
      <Screen title={t("home.create")}>
        <EmptyState
          title={t("common.setEverydayFirst")}
          action={{ label: t("common.goBack"), onPress: () => router.back() }}
        />
      </Screen>
    );

  async function submit() {
    if (busy || !base) return;
    setBusy(true);
    setError(null);
    const chosen = weatherOf(when);
    const forecast = windowWeather(
      hours,
      date,
      chosen.window.from,
      chosen.window.to,
      clock.timeZone,
    );
    const kept = [...keptIds, ...(hijabId ? [hijabId] : [])];
    try {
      await update((current) => {
        const ready = ensureToday(current, clockFor(now()));
        const everyday = ready.styling.today?.everyday.request ?? base;
        const request: OutfitRequest = {
          ...everyday,
          occasion,
          style,
          feel,
          garmentType: null,
          keptIds: kept,
          excludedIds: [],
          weather: forecast
            ? { ...forecast, exposure: preset?.exposure ?? null }
            : tomorrow
              ? { source: "unknown" }
              : everyday.weather,
        };
        if (tomorrow) return startPlan(ready, request, date);
        const worn = wornMains(ready).filter((id) => !kept.includes(id));
        const fresh = startOccasion(ready, { ...request, excludedIds: worn });
        return worn.length && !fresh.styling.today?.occasion?.pieceIds.length
          ? startOccasion(ready, request)
          : fresh;
      });
      router.push({
        pathname: "/today/fit",
        params: {
          slot: slotOf(when, hour),
          from: "create",
          ...(chosen.celsius === null
            ? {}
            : { celsius: String(chosen.celsius) }),
        },
      });
    } catch {
      setError(t("common.error.save"));
    } finally {
      setBusy(false);
    }
  }

  const moreValue = [
    t(`style.${style}`),
    ...kept.map((piece) => piece.name),
    ...hijabs
      .filter((piece) => piece.id === hijabId)
      .map((piece) => piece.name),
  ].join(", ");

  return (
    <Screen
      title={tomorrow ? t("home.plan") : t("home.create")}
      leading="cancel"
      onCancel={() => router.back()}
      testID="create"
      footer={
        <Footer
          primary={{
            label: t("create.submit"),
            onPress: () => void submit(),
            busy,
            testID: "create-submit",
          }}
          error={error}
        />
      }
    >
      <Section title={t("create.for")}>
        <ChipRow
          options={occasionOptions()}
          value={occasion}
          onChange={(next) => next && setOccasion(next as Occasion)}
          testID="create-occasion"
        />
      </Section>
      <Section title={t("create.when")}>
        <View style={styles.whens} accessibilityRole="radiogroup">
          {whens.map((option) => {
            const weather = weatherOf(option);
            const selected = option === when;
            return (
              <Pressable
                key={option}
                onPress={() => setWhen(option)}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                accessibilityLabel={[
                  whenLabel(option),
                  degrees(weather.celsius, units),
                ]
                  .filter(Boolean)
                  .join(", ")}
                style={[
                  styles.when,
                  {
                    backgroundColor: selected
                      ? colors.plumSoft
                      : colors.surface,
                    borderColor: selected ? colors.plum : colors.line,
                  },
                ]}
                testID={`create-when-${option}`}
              >
                <Text role="subhead" tone={selected ? "plum" : "ink"}>
                  {whenLabel(option)}
                </Text>
                {weather.celsius !== null ? (
                  <View style={styles.whenValue}>
                    <Symbol
                      name={skyIcon(weather.sky, slotOf(option, hour))}
                      size={14}
                      tone={selected ? "plum" : "muted"}
                    />
                    <Text role="footnote" tone={selected ? "plum" : "muted"}>
                      {degrees(weather.celsius, units)}
                    </Text>
                  </View>
                ) : null}
              </Pressable>
            );
          })}
        </View>
      </Section>
      <Section title={t("create.feel")}>
        <Segmented<Feel>
          options={feels.map((id) => ({ id, label: t(`feel.${id}`) }))}
          value={feel}
          onChange={setFeel}
        />
      </Section>
      <Expander
        id="create-more"
        title={t("create.more")}
        value={more ? undefined : moreValue}
        open={more}
        onToggle={() => setMore((open) => !open)}
        card
        testID="create-more"
      >
        <View style={styles.more}>
          <Segmented<Style>
            label={t("adjust.style")}
            options={styleOptions.map((option) => ({
              id: option.id,
              label: option.label,
            }))}
            value={style}
            onChange={setStyle}
          />
          <Row
            title={
              kept.length
                ? kept.map((piece) => piece.name).join(", ")
                : t("today.startWithPiece")
            }
            leading={kept.length ? { lay: kept } : undefined}
            trailing="chevron"
            onPress={() =>
              router.push({
                pathname: "/today/pieces",
                params: { from: "adjust" },
              })
            }
            testID="create-start-with"
          />
          {hijabs.length && base.hijab === "always" ? (
            <View style={styles.hijab}>
              <ChipRow
                label={t("create.hijab")}
                layout="scroll"
                optional
                options={hijabs.map((piece) => {
                  const rgb = piece.colors?.[0]?.rgb;
                  return {
                    id: piece.id,
                    label: piece.name,
                    ...(rgb ? { swatch: `rgb(${rgb.join(",")})` } : {}),
                  };
                })}
                value={hijabId}
                onChange={(next) =>
                  setHijabId(typeof next === "string" ? next : null)
                }
                testID="create-hijab"
              />
            </View>
          ) : null}
        </View>
      </Expander>
    </Screen>
  );
}

const styles = StyleSheet.create({
  whens: { flexDirection: "row", gap: theme.space.sm },
  when: {
    flex: 1,
    minHeight: 64,
    gap: theme.space.xs,
    padding: theme.space.md,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    justifyContent: "center",
  },
  whenValue: { flexDirection: "row", alignItems: "center", gap: 4 },
  more: { gap: theme.space.lg },
  hijab: { gap: theme.space.sm },
});
