import { useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { t } from "../../i18n";
import { Segmented, Text } from "../../ui";
import { theme } from "../../ui/theme";
import { useColors } from "../../ui/useColors";
import { FacePhoto, type FaceBox, type PhotoSize } from "./FacePhoto";
import type { Colour } from "./palette";

type Mode = "best" | "avoid";

export const lightHex = (hex: string) => {
  const value = parseInt(hex.slice(1), 16);
  const r = (value >> 16) & 255;
  const g = (value >> 8) & 255;
  const b = value & 255;
  return 0.299 * r + 0.587 * g + 0.114 * b > 150;
};

export function Drape({
  colour,
  photo,
  face,
  size,
  width,
  height,
  diameter,
  label,
}: {
  colour: Colour;
  label?: string;
  photo: string;
  face: FaceBox | null;
  size: PhotoSize | null;
  width: number;
  height: number;
  diameter: number;
}) {
  const light = lightHex(colour.hex);
  return (
    <View
      style={[styles.drape, { width, height, backgroundColor: colour.hex }]}
    >
      <FacePhoto
        uri={photo}
        face={face}
        size={size}
        diameter={diameter}
        ring={light ? "#FFFFFF" : "rgba(255,255,255,0.85)"}
      />
      <Text role="headline" tone={light ? "ink" : "onMedia"}>
        {label ?? colour.name}
      </Text>
    </View>
  );
}

export function Drapes({
  best,
  avoid,
  photo,
  face,
  size,
  width,
}: {
  best: Colour[];
  avoid: Colour[];
  photo: string;
  face: FaceBox | null;
  size: PhotoSize | null;
  width: number;
}) {
  const colors = useColors();
  const [mode, setMode] = useState<Mode>("best");
  const [page, setPage] = useState(0);
  const colours = mode === "best" ? best : avoid;
  const height = Math.round(width * 0.92);
  const diameter = Math.round(width * 0.62);
  return (
    <View style={styles.drapes}>
      <Segmented
        options={[
          { id: "best", label: t("colours.drape.best") },
          { id: "avoid", label: t("colours.drape.avoid") },
        ]}
        value={mode}
        onChange={(next) => {
          setMode(next);
          setPage(0);
        }}
      />
      <ScrollView
        key={mode}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        style={[styles.pager, { width, height }]}
        onMomentumScrollEnd={(event) =>
          setPage(Math.round(event.nativeEvent.contentOffset.x / width))
        }
        testID="colours-drapes"
      >
        {colours.map((colour) => (
          <Drape
            key={colour.hex}
            colour={colour}
            photo={photo}
            face={face}
            size={size}
            width={width}
            height={height}
            diameter={diameter}
          />
        ))}
      </ScrollView>
      <View style={styles.dots} accessibilityElementsHidden>
        {colours.map((colour, index) => (
          <View
            key={colour.hex}
            style={[
              styles.dot,
              {
                backgroundColor: index === page ? colors.ink : colors.lineField,
                opacity: index === page ? 1 : 0.4,
              },
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  drapes: { gap: theme.space.md },
  pager: { flexGrow: 0 },
  drape: {
    borderRadius: 16,
    borderCurve: "continuous",
    alignItems: "center",
    justifyContent: "center",
    gap: theme.space.lg,
  },
  dots: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
});
