import { useState, type ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { Text, type TextRole } from "./Text";
import { useLargeText } from "./useLargeText";

export function useMeasuredMax(
  samples: { text: string; role: TextRole; width?: number }[],
): [number | null, ReactNode] {
  const { fontScale, bold } = useLargeText();
  const [heights, setHeights] = useState<Record<string, number>>({});
  const entries = samples.map((sample, index) => ({
    sample,
    key: `${index}:${fontScale}:${bold}:${sample.role}:${sample.width ?? ""}:${sample.text}`,
  }));
  const known = entries.map(({ key }) => heights[key]);
  const max =
    known.length > 0 && known.every((height) => height !== undefined)
      ? Math.max(...known)
      : null;

  const layer = (
    <View
      style={styles.layer}
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {entries.map(({ sample, key }) => (
        <View
          key={key}
          style={sample.width === undefined ? null : { width: sample.width }}
          onLayout={(event) => {
            const height = event.nativeEvent.layout.height;
            setHeights((current) =>
              current[key] === height ? current : { ...current, [key]: height },
            );
          }}
        >
          <Text role={sample.role}>{sample.text}</Text>
        </View>
      ))}
    </View>
  );

  return [max, layer];
}

const styles = StyleSheet.create({
  layer: { position: "absolute", top: 0, left: 0, opacity: 0 },
});
