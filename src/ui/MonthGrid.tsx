import { useEffect, useRef, type ReactNode } from "react";
import {
  AccessibilityInfo,
  Pressable,
  StyleSheet,
  View,
  useWindowDimensions,
} from "react-native";
import Animated, {
  FadeIn,
  FadeOut,
  LayoutAnimationConfig,
  ReduceMotion,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";
import { Image } from "expo-image";
import type { SFSymbol } from "expo-symbols";
import type { Piece } from "../domain/closet";
import { locale, t } from "../i18n";
import { announce } from "./announce";
import { monthTitle, shortDate, spokenDate, weekdayLetters } from "./dates";
import { Expander } from "./Expander";
import { motion, timing, useReduceMotion } from "./motion";
import { photoSource } from "./photos";
import { Row } from "./Row";
import { Silk } from "./Silk";
import { Symbol } from "./symbol";
import { Text } from "./Text";
import { gutterFor, theme } from "./theme";
import { useColors } from "./useColors";
import { useLargeText } from "./useLargeText";

export type MonthGridProps = {
  mode: "wear" | "pick";
  month: string;
  today: string;
  selected?: string | null;
  onSelect: (date: string) => void;
  onMonth: (delta: -1 | 1) => void;
  days?: Record<string, Piece>;
  planned?: Record<string, Piece>;
  dots?: Record<string, boolean>;
  last?: string;
  from?: string;
  first?: string;
  monthLabel: string;
  dayLabel: (date: string) => string;
  wornCount?: number;
  loading?: boolean;
  children?: ReactNode;
  testID?: string;
};

const disc = 28;
const bed = 40;

const chevronTarget = (symbolScale: number) =>
  Math.max(theme.size.touch, 32 * symbolScale + 12);

const hidden = {
  accessibilityElementsHidden: true,
  importantForAccessibility: "no-hide-descendants",
} as const;

const pad = (value: number) => String(value).padStart(2, "0");

function monthDates(month: string): (string | null)[] {
  const year = Number(month.slice(0, 4));
  const index = Number(month.slice(5, 7));
  const count = new Date(Date.UTC(year, index, 0)).getUTCDate();
  const lead = (new Date(Date.UTC(year, index - 1, 1)).getUTCDay() + 6) % 7;
  return Array.from({ length: 42 }, (_, cell) => {
    const day = cell - lead + 1;
    return day >= 1 && day <= count ? `${month}-${pad(day)}` : null;
  });
}

export function useMonthGridFits(): boolean {
  const { width } = useWindowDimensions();
  const { ax, symbolScale } = useLargeText();
  const column = (width - 2 * gutterFor(width)) / 7;
  return !ax && column >= theme.size.touch && disc * symbolScale <= column - 4;
}

function Chevron({
  icon,
  label,
  onPress,
  testID,
}: {
  icon: SFSymbol;
  label: string;
  onPress: () => void;
  testID: string;
}) {
  const colors = useColors();
  const { symbolScale } = useLargeText();
  const press = useSharedValue(0);
  const { sunken } = colors;
  const fill = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      press.get(),
      [0, 1],
      [`${sunken}00`, sunken],
    ),
  }));
  const size = 32 * symbolScale;
  const target = chevronTarget(symbolScale);

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => press.set(timing(1, "quick", "silk"))}
      onPressOut={() => press.set(timing(0, "quick", "silk"))}
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={[styles.circle, { width: target, height: target }]}
    >
      <Animated.View
        style={[
          styles.disc,
          { width: size, height: size, borderRadius: size / 2 },
          fill,
        ]}
      />
      <Symbol name={icon} size={20} tone="plum" />
    </Pressable>
  );
}

function Day({
  date,
  mode,
  today,
  selected,
  piece,
  planned,
  dot,
  tall,
  pressable,
  loading,
  label,
  onPress,
}: {
  date: string;
  mode: "wear" | "pick";
  today: boolean;
  selected: boolean;
  piece?: Piece;
  planned: boolean;
  dot: boolean;
  tall: boolean;
  pressable: boolean;
  loading: boolean;
  label: string;
  onPress: () => void;
}) {
  const colors = useColors();
  const { symbolScale } = useLargeText();
  const press = useSharedValue(0);
  const on = useSharedValue(selected ? 1 : 0);

  useEffect(() => {
    on.set(timing(selected ? 1 : 0, "quick", selected ? "silk" : "release"));
  }, [selected, on]);

  const wear = mode === "wear";
  const rest = wear ? colors.sunken : `${colors.sunken}00`;
  const down = wear ? colors.line : colors.sunken;
  const fill = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(press.get(), [0, 1], [rest, down]),
  }));
  const shown = useAnimatedStyle(() => ({ opacity: on.get() }));
  const size = disc * symbolScale;
  const round = { width: size, height: size, borderRadius: size / 2 };
  const tone = !pressable ? (wear ? "muted" : "disabled") : "ink";

  const number = (
    <View style={[styles.circle, round]}>
      {wear ? null : <Animated.View style={[styles.disc, round, fill]} />}
      <Animated.View
        style={[
          styles.disc,
          round,
          styles.edge,
          {
            backgroundColor: colors.blush,
            borderColor: today ? colors.ink : colors.blushStrong,
            borderWidth: today ? 1.5 : 2,
          },
          shown,
        ]}
      />
      {today ? (
        <View
          style={[
            styles.disc,
            round,
            { borderWidth: 1.5, borderColor: colors.ink },
          ]}
        />
      ) : null}
      <Text
        role="subhead"
        tone={tone}
        style={today && styles.today}
        {...hidden}
      >
        {String(Number(date.slice(8)))}
      </Text>
      {dot ? (
        <View
          style={[styles.dot, { backgroundColor: colors.blushStrong }]}
          {...hidden}
        />
      ) : null}
    </View>
  );

  return (
    <Pressable
      disabled={!pressable}
      onPress={onPress}
      testID={
        pressable ? `${mode === "wear" ? "day" : "pick"}-${date}` : undefined
      }
      onPressIn={() => press.set(timing(1, "quick", "silk"))}
      onPressOut={() => press.set(timing(0, "quick", "silk"))}
      accessible
      accessibilityRole={pressable ? "button" : undefined}
      accessibilityLabel={pressable ? label : spokenDate(date, locale)}
      accessibilityState={
        pressable ? { selected } : wear ? undefined : { disabled: true }
      }
      style={[
        styles.cell,
        wear ? (tall ? styles.wearCell : styles.shortCell) : styles.pickCell,
      ]}
    >
      {number}
      {wear && piece ? (
        <Animated.View
          accessibilityIgnoresInvertColors
          style={[
            styles.bed,
            fill,
            planned && [styles.planned, { borderColor: colors.lineField }],
          ]}
          {...hidden}
        >
          {loading ? (
            <Silk
              kind="placeholder"
              shape="tile"
              label={label}
              style={StyleSheet.absoluteFill}
            />
          ) : (
            <Image
              source={photoSource(piece.photo)}
              recyclingKey={piece.id}
              contentFit="contain"
              style={styles.mark}
            />
          )}
        </Animated.View>
      ) : null}
    </Pressable>
  );
}

export function MonthGrid({
  mode,
  month,
  today,
  selected = null,
  onSelect,
  onMonth,
  days = {},
  planned = {},
  dots = {},
  last,
  from = today,
  first,
  monthLabel,
  dayLabel,
  loading = false,
  children,
  testID,
}: MonthGridProps) {
  const reduce = useReduceMotion();
  const { ax, symbolScale } = useLargeText();
  const fits = useMonthGridFits();
  const slot = chevronTarget(symbolScale);
  const title = useRef<View>(null);
  const pressed = useRef<-1 | 1 | null>(null);
  const shownMonth = useRef(month);
  const wear = mode === "wear";
  const current = today.slice(0, 7);
  const previous = wear
    ? month > (first ?? today).slice(0, 7)
    : month > from.slice(0, 7);
  const next = !wear || month < (last ?? current);
  const dates = monthDates(month);
  const pressable = (date: string) =>
    wear ? (date in days && date <= today) || date in planned : date >= from;

  useEffect(() => {
    if (shownMonth.current === month) return;
    shownMonth.current = month;
    const gone =
      (pressed.current === 1 && !next) || (pressed.current === -1 && !previous);
    pressed.current = null;
    if (gone && title.current) {
      AccessibilityInfo.sendAccessibilityEvent(title.current, "focus");
    } else {
      announce(monthLabel);
    }
  }, [month, next, previous, monthLabel]);

  const page = (delta: -1 | 1) => {
    pressed.current = delta;
    onMonth(delta);
  };

  const fade = {
    entering: FadeIn.duration(motion.duration.base)
      .easing(motion.easing.silk)
      .reduceMotion(ReduceMotion.Never),
    exiting: FadeOut.duration(motion.duration[reduce ? "base" : "quick"])
      .easing(motion.easing[reduce ? "silk" : "release"])
      .reduceMotion(ReduceMotion.Never),
  };

  const letters = weekdayLetters(locale);
  const shown = dates.filter(
    (date): date is string => date !== null && pressable(date),
  );

  const grid = (
    <View>
      <View style={styles.week} {...hidden}>
        {letters.map((letter, index) => (
          <Text key={index} role="footnote" tone="muted" style={styles.letter}>
            {letter}
          </Text>
        ))}
      </View>
      {[0, 1, 2, 3, 4, 5].map((week) => {
        const row = dates.slice(week * 7, week * 7 + 7);
        const tall = row.some(
          (date) => date !== null && (date in days || date in planned),
        );
        if (row.every((date) => date === null)) return null;
        return (
          <View key={week} style={styles.week}>
            {row.map((date, index) =>
              date === null ? (
                <View
                  key={index}
                  style={[
                    styles.cell,
                    wear
                      ? tall
                        ? styles.wearCell
                        : styles.shortCell
                      : styles.pickCell,
                  ]}
                />
              ) : (
                <Day
                  key={date}
                  date={date}
                  mode={mode}
                  today={date === today}
                  selected={date === selected}
                  piece={days[date] ?? planned[date]}
                  planned={!(date in days) && date in planned}
                  dot={!!dots[date]}
                  tall={tall}
                  pressable={pressable(date)}
                  loading={loading}
                  label={dayLabel(date)}
                  onPress={() => onSelect(date)}
                />
              ),
            )}
          </View>
        );
      })}
    </View>
  );

  const rows = (
    <View>
      {shown.map((date, index) => (
        <View key={date}>
          <Row
            title={shortDate(date, locale)}
            accessibilityLabel={dayLabel(date)}
            trailing={
              wear ? "down" : date === selected ? "selected" : undefined
            }
            expanded={wear ? date === selected : undefined}
            onPress={() => onSelect(date)}
            last={index === shown.length - 1}
            testID={`${wear ? "day" : "pick"}-${date}`}
          />
          {wear ? (
            <Expander
              id={`${testID ?? "month"}-${date}`}
              headless
              open={date === selected}
              onToggle={() => onSelect(date)}
            >
              {children}
            </Expander>
          ) : null}
        </View>
      ))}
    </View>
  );

  return (
    <View testID={testID} style={styles.month}>
      <View style={[styles.line, ax && styles.lineStacked]}>
        <LayoutAnimationConfig skipEntering>
          <Animated.View
            key={month}
            entering={fade.entering}
            exiting={fade.exiting}
            style={styles.titleSlot}
          >
            <View
              ref={title}
              accessible
              accessibilityRole="header"
              accessibilityLabel={monthLabel}
            >
              <Text role="headline">{monthTitle(month, locale)}</Text>
            </View>
          </Animated.View>
        </LayoutAnimationConfig>
        <View style={styles.arrows}>
          <View style={{ width: slot, height: slot }}>
            {previous ? (
              <Chevron
                icon="chevron.left"
                label={t("calendar.previous")}
                onPress={() => page(-1)}
                testID="calendar-previous"
              />
            ) : null}
          </View>
          <View style={{ width: slot, height: slot }}>
            {next ? (
              <Chevron
                icon="chevron.right"
                label={t("calendar.next")}
                onPress={() => page(1)}
                testID="calendar-next"
              />
            ) : null}
          </View>
        </View>
      </View>
      <LayoutAnimationConfig skipEntering>
        <Animated.View
          key={`${month}-${fits}`}
          entering={fade.entering}
          exiting={fade.exiting}
        >
          {fits ? grid : rows}
        </Animated.View>
      </LayoutAnimationConfig>
      {fits && children ? <View style={styles.below}>{children}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  month: { gap: theme.space.md },
  line: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: theme.space.sm,
    minHeight: theme.size.touch,
  },
  lineStacked: { flexDirection: "column", alignItems: "stretch" },
  titleSlot: { flexShrink: 1 },
  arrows: { flexDirection: "row", alignSelf: "flex-end" },
  circle: { alignItems: "center", justifyContent: "center" },
  disc: { position: "absolute" },
  edge: { borderCurve: "continuous" },
  week: { flexDirection: "row" },
  letter: { flex: 1, textAlign: "center", paddingBottom: 6 },
  cell: { flex: 1, minWidth: 0, alignItems: "center" },
  wearCell: { minHeight: 72, gap: theme.space.xs },
  shortCell: { minHeight: theme.size.touch },
  dot: {
    position: "absolute",
    bottom: -3,
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  planned: { borderWidth: 1, borderStyle: "dashed", opacity: 0.7 },
  pickCell: { minHeight: theme.size.touch, justifyContent: "center" },
  today: { fontWeight: "600" },
  bed: {
    width: bed,
    height: bed,
    borderRadius: theme.radius.sm,
    borderCurve: "continuous",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  mark: { width: 34, height: 34 },
  below: { marginTop: theme.space.lg },
});
