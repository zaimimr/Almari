import { useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import { Image } from "expo-image";
import ClosetVision, {
  type SelfiePoint,
  type SelfieReading,
} from "../../modules/closet-vision/src";
import type { ColourProfile } from "../domain/closet";
import { labHex } from "../domain/colourAnalysis";
import { t } from "../i18n";
import { AppText } from "../ui/legacy";
import { theme } from "../ui/theme";

type Part = SelfiePoint["part"];
type At = { x: number; y: number };
type Box = { width: number; height: number };

const clamp = (value: number) => Math.min(1, Math.max(0, value));

function Dot({
  part,
  at,
  box,
  colour,
  onDrag,
  onMove,
}: {
  part: Part;
  at: At;
  box: Box;
  colour: string | null;
  onDrag: (dragging: boolean) => void;
  onMove: (at: At) => void;
}) {
  const drag = useRef<{ pageX: number; pageY: number; at: At } | null>(null);
  const end = () => {
    drag.current = null;
    onDrag(false);
  };
  return (
    <View
      onStartShouldSetResponder={() => true}
      onMoveShouldSetResponder={() => true}
      onResponderTerminationRequest={() => false}
      onResponderGrant={({ nativeEvent }) => {
        drag.current = {
          pageX: nativeEvent.pageX,
          pageY: nativeEvent.pageY,
          at,
        };
        onDrag(true);
      }}
      onResponderMove={({ nativeEvent }) => {
        const start = drag.current;
        if (!start || !box.width || !box.height) return;
        onMove({
          x: clamp(start.at.x + (nativeEvent.pageX - start.pageX) / box.width),
          y: clamp(start.at.y + (nativeEvent.pageY - start.pageY) / box.height),
        });
      }}
      onResponderRelease={end}
      onResponderTerminate={end}
      accessible
      accessibilityLabel={t(`colours.${part}`)}
      testID={`point-${part}`}
      style={[
        styles.dot,
        { left: at.x * box.width - 22, top: at.y * box.height - 22 },
      ]}
    >
      <View
        style={[
          styles.ring,
          colour ? { backgroundColor: colour } : styles.empty,
        ]}
      />
      <AppText
        variant="footnote"
        style={styles.tag}
        maxFontSizeMultiplier={1.3}
      >
        {t(`colours.${part}`)}
      </AppText>
    </View>
  );
}

export function SamplePoints({
  uri,
  reading,
  profile,
  onSample,
  onDragging,
}: {
  uri: string;
  reading: SelfieReading;
  profile: ColourProfile;
  onSample: (part: Part, lab: [number, number, number]) => void;
  onDragging: (dragging: boolean) => void;
}) {
  const [box, setBox] = useState<Box>({ width: 0, height: 0 });
  const [points, setPoints] = useState(() =>
    Object.fromEntries(reading.points.map((point) => [point.part, point])),
  );
  const busy = useRef<Partial<Record<Part, boolean>>>({});
  const queued = useRef<Partial<Record<Part, SelfiePoint>>>({});

  async function sample(point: SelfiePoint) {
    if (busy.current[point.part]) {
      queued.current[point.part] = point;
      return;
    }
    busy.current[point.part] = true;
    try {
      const lab = await ClosetVision.sampleSelfie(uri, point, reading.gains);
      if (lab) onSample(point.part, lab);
    } catch {}
    busy.current[point.part] = false;
    const next = queued.current[point.part];
    if (next) {
      delete queued.current[point.part];
      void sample(next);
    }
  }

  return (
    <View
      style={[
        styles.photo,
        { aspectRatio: reading.width / Math.max(1, reading.height) },
      ]}
      onLayout={({ nativeEvent }) => setBox(nativeEvent.layout)}
    >
      <Image
        source={{ uri }}
        style={StyleSheet.absoluteFill}
        contentFit="fill"
        accessibilityLabel={t("colours.photo")}
      />
      {Object.values(points).map((point) => (
        <Dot
          key={point.part}
          part={point.part}
          at={point}
          box={box}
          colour={profile[point.part] ? labHex(profile[point.part]!) : null}
          onDrag={onDragging}
          onMove={(at) => {
            const next = { ...point, ...at };
            setPoints((current) => ({ ...current, [point.part]: next }));
            void sample(next);
          }}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  photo: {
    width: "100%",
    borderRadius: theme.radius.md,
    borderCurve: "continuous",
    overflow: "hidden",
    backgroundColor: theme.colors.surface,
  },
  dot: {
    position: "absolute",
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  ring: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 3,
    borderColor: theme.colors.onPlum,
    boxShadow: "0 1px 4px rgba(0,0,0,0.45)",
  },
  empty: { backgroundColor: "transparent" },
  tag: {
    position: "absolute",
    top: 40,
    width: 80,
    textAlign: "center",
    color: theme.colors.onPlum,
    fontWeight: "600",
    textShadowColor: "rgba(0,0,0,0.6)",
    textShadowRadius: 3,
  },
});
