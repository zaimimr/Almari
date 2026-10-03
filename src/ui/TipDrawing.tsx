import { StyleSheet, View } from "react-native";
import { t } from "../i18n";
import { theme } from "./theme";

const labels = ["tips.window", "tips.sheet", "tips.frame"] as const;

function Garment({ color, outline }: { color: string; outline?: boolean }) {
  const edge = outline ? drawing.outline : null;
  return (
    <View style={drawing.garment}>
      <View
        style={[drawing.sleeve, drawing.left, { backgroundColor: color }, edge]}
      />
      <View
        style={[
          drawing.sleeve,
          drawing.right,
          { backgroundColor: color },
          edge,
        ]}
      />
      <View style={[drawing.body, { backgroundColor: color }, edge]} />
    </View>
  );
}

export function TipDrawing({ tip }: { tip: number }) {
  return (
    <View
      style={drawing.frame}
      accessible
      accessibilityRole="image"
      accessibilityLabel={t(labels[tip] ?? labels[0])}
    >
      {tip === 0 ? (
        <>
          <View style={drawing.window}>
            <View style={drawing.barVertical} />
            <View style={drawing.barHorizontal} />
          </View>
          <View style={drawing.rays}>
            {[0, 1, 2].map((ray) => (
              <View key={ray} style={drawing.ray} />
            ))}
          </View>
          <Garment color={theme.colors.plum} />
        </>
      ) : tip === 1 ? (
        <View style={drawing.sheet}>
          <View style={[StyleSheet.absoluteFill, drawing.sheetTone]} />
          <Garment color={theme.colors.canvas} outline />
        </View>
      ) : (
        <View style={drawing.phone}>
          <View style={[drawing.corner, drawing.topLeft]} />
          <View style={[drawing.corner, drawing.topRight]} />
          <View style={[drawing.corner, drawing.bottomLeft]} />
          <View style={[drawing.corner, drawing.bottomRight]} />
          <Garment color={theme.colors.plum} />
        </View>
      )}
    </View>
  );
}

const drawing = StyleSheet.create({
  frame: {
    height: 190,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 20,
    borderRadius: theme.radius.md,
    borderCurve: "continuous",
    backgroundColor: theme.colors.surface,
  },
  garment: { width: 76, height: 100 },
  body: {
    position: "absolute",
    left: 16,
    top: 0,
    width: 44,
    height: 100,
    borderRadius: 8,
  },
  sleeve: {
    position: "absolute",
    top: 6,
    width: 18,
    height: 54,
    borderRadius: 8,
  },
  left: { left: 2, transform: [{ rotate: "20deg" }] },
  right: { right: 2, transform: [{ rotate: "-20deg" }] },
  outline: { borderWidth: 1, borderColor: theme.colors.line },
  window: {
    width: 66,
    height: 88,
    borderWidth: 3,
    borderColor: theme.colors.line,
    borderRadius: 6,
    backgroundColor: theme.colors.canvas,
  },
  barVertical: {
    position: "absolute",
    left: 28,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: theme.colors.line,
  },
  barHorizontal: {
    position: "absolute",
    top: 38,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: theme.colors.line,
  },
  rays: { gap: 12 },
  ray: {
    width: 34,
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.colors.plum,
    opacity: 0.25,
  },
  sheet: {
    width: 156,
    height: 156,
    borderRadius: 10,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  sheetTone: { backgroundColor: theme.colors.inkMuted, opacity: 0.45 },
  phone: {
    width: 112,
    height: 168,
    borderWidth: 3,
    borderColor: theme.colors.ink,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  corner: {
    position: "absolute",
    width: 14,
    height: 14,
    borderColor: theme.colors.plum,
  },
  topLeft: { top: 16, left: 12, borderTopWidth: 2, borderLeftWidth: 2 },
  topRight: { top: 16, right: 12, borderTopWidth: 2, borderRightWidth: 2 },
  bottomLeft: {
    bottom: 16,
    left: 12,
    borderBottomWidth: 2,
    borderLeftWidth: 2,
  },
  bottomRight: {
    bottom: 16,
    right: 12,
    borderBottomWidth: 2,
    borderRightWidth: 2,
  },
});
