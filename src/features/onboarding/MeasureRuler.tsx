import { memo, useEffect, useRef, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from "react-native";
import * as Haptics from "expo-haptics";
import type { Scale } from "../../domain/units";
import { t } from "../../i18n";
import { Button, Text } from "../../ui";
import { theme, type Colors } from "../../ui/theme";
import { useColors } from "../../ui/useColors";

const gap = 10;
const labelWidth = 56;

const Ticks = memo(function Ticks({
  scale,
  colors,
}: {
  scale: Scale;
  colors: Colors;
}) {
  const marks = Array.from(
    { length: scale.max - scale.min + 1 },
    (_, index) => scale.min + index,
  );
  return marks.map((mark) => {
    const major = mark % scale.major === 0;
    const mid = !major && mark % scale.mid === 0;
    return (
      <View key={mark} style={styles.cell}>
        <View
          style={[
            styles.tick,
            major ? styles.major : mid ? styles.mid : styles.minor,
            { backgroundColor: major ? colors.ink : colors.lineField },
          ]}
        />
        {major ? (
          <Text
            role="footnote"
            tone="muted"
            maxFontSizeMultiplier={1.3}
            numberOfLines={1}
            style={styles.label}
          >
            {scale.label(mark)}
          </Text>
        ) : null}
      </View>
    );
  });
});

export function MeasureRuler({
  label,
  scale,
  value,
  onChange,
  testID,
}: {
  label: string;
  scale: Scale;
  value: number | null;
  onChange: (value: number | null) => void;
  testID?: string;
}) {
  const colors = useColors();
  const [width, setWidth] = useState(0);
  const ruler = useRef<ScrollView>(null);
  const touched = useRef(false);
  const mark = value === null ? scale.start : scale.fromBase(value);
  const last = useRef(mark);
  const latest = useRef(mark);
  const shown = scale.parts(value ?? scale.toBase(scale.start));
  const spoken =
    value === null
      ? t("profile.notAnswered")
      : shown.map((part) => `${part.amount} ${part.unit}`).join(" ");

  useEffect(() => {
    latest.current = mark;
  });

  useEffect(() => {
    if (width === 0) return;
    last.current = latest.current;
    ruler.current?.scrollTo({
      x: (latest.current - scale.min) * gap,
      animated: false,
    });
  }, [scale, width]);

  function onScroll(event: NativeSyntheticEvent<NativeScrollEvent>) {
    const index = Math.round(event.nativeEvent.contentOffset.x / gap);
    const next = Math.min(scale.max, Math.max(scale.min, scale.min + index));
    if (next === last.current) return;
    last.current = next;
    if (!touched.current) return;
    void Haptics.selectionAsync();
    onChange(scale.toBase(next));
  }

  function moveTo(next: number) {
    last.current = next;
    ruler.current?.scrollTo({ x: (next - scale.min) * gap, animated: false });
  }

  function step(by: number) {
    const next = Math.min(scale.max, Math.max(scale.min, mark + by));
    moveTo(next);
    onChange(scale.toBase(next));
  }

  function clear() {
    moveTo(scale.start);
    onChange(null);
  }

  return (
    <View style={styles.group}>
      <View style={styles.head}>
        <Text role="headline">{label}</Text>
        {value === null ? null : (
          <Button
            label={t("common.clear")}
            variant="quiet"
            size="small"
            onPress={clear}
            accessibilityLabel={`${t("common.clear")}, ${label}`}
            testID={testID ? `${testID}-clear` : undefined}
          />
        )}
      </View>
      <View
        accessible
        accessibilityRole="adjustable"
        accessibilityLabel={label}
        accessibilityValue={{ text: spoken }}
        accessibilityActions={[{ name: "increment" }, { name: "decrement" }]}
        onAccessibilityAction={(event) =>
          step(event.nativeEvent.actionName === "increment" ? 1 : -1)
        }
        onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
        testID={testID}
      >
        <View style={styles.value}>
          {shown.map((part) => (
            <View key={part.unit} style={styles.part}>
              <Text
                role="display"
                tone={value === null ? "placeholder" : "ink"}
                style={styles.amount}
              >
                {part.amount}
              </Text>
              <Text role="subhead" tone="muted">
                {part.unit}
              </Text>
            </View>
          ))}
        </View>
        <View style={styles.track}>
          {width > 0 ? (
            <ScrollView
              ref={ruler}
              horizontal
              showsHorizontalScrollIndicator={false}
              snapToInterval={gap}
              decelerationRate="fast"
              scrollEventThrottle={16}
              contentOffset={{ x: (mark - scale.min) * gap, y: 0 }}
              contentContainerStyle={{ paddingHorizontal: width / 2 - gap / 2 }}
              onScrollBeginDrag={() => {
                touched.current = true;
              }}
              onScroll={onScroll}
            >
              <Ticks scale={scale} colors={colors} />
            </ScrollView>
          ) : null}
          <View
            pointerEvents="none"
            style={[
              styles.needle,
              { left: width / 2 - 1, backgroundColor: colors.plum },
            ]}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  group: { gap: theme.space.sm },
  head: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: 44,
  },
  value: {
    flexDirection: "row",
    justifyContent: "center",
    flexWrap: "wrap",
    columnGap: theme.space.md,
  },
  part: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: theme.space.xs,
  },
  amount: { fontVariant: ["tabular-nums"] },
  track: { height: 64, marginTop: theme.space.sm },
  cell: { width: gap, alignItems: "center" },
  tick: { width: 1.5, borderRadius: 1 },
  minor: { height: 12 },
  mid: { height: 20 },
  major: { height: 30 },
  label: {
    position: "absolute",
    top: 36,
    width: labelWidth,
    left: (gap - labelWidth) / 2,
    textAlign: "center",
  },
  needle: {
    position: "absolute",
    top: -4,
    width: 2,
    height: 42,
    borderRadius: 1,
  },
});
