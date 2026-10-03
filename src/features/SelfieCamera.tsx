import { useRef, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import {
  SelfieCameraView,
  type SelfieCameraHandle,
} from "../../modules/closet-vision/src";
import { guideLimits, selfieGuide, type Guide } from "../domain/selfieGuide";
import { t } from "../i18n";
import { AppText } from "../ui";
import { theme } from "../ui/theme";

const ovalWidth = 0.56;
const ovalAspect = 1.32;

export function SelfieCamera({
  onCapture,
  onUnavailable,
  disabled,
}: {
  onCapture: (uri: string) => void;
  onUnavailable: () => void;
  disabled: boolean;
}) {
  const camera = useRef<SelfieCameraHandle>(null);
  const [guide, setGuide] = useState<Guide>("find");
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [taking, setTaking] = useState(false);
  const oval = {
    width: size.width * ovalWidth,
    height: size.width * ovalWidth * ovalAspect,
  };

  async function capture() {
    if (taking || disabled) return;
    setTaking(true);
    try {
      const uri = await camera.current?.capture();
      if (uri) onCapture(uri);
    } catch {
      onUnavailable();
    } finally {
      setTaking(false);
    }
  }

  return (
    <View style={styles.wrap}>
      <View
        style={styles.frame}
        onLayout={({ nativeEvent }) => setSize(nativeEvent.layout)}
      >
        <SelfieCameraView
          ref={camera}
          style={StyleSheet.absoluteFill}
          onReading={({ nativeEvent }) => setGuide(selfieGuide(nativeEvent))}
          onState={({ nativeEvent }) => {
            if (nativeEvent.state === "unavailable") onUnavailable();
          }}
        />
        <View
          pointerEvents="none"
          style={[
            styles.oval,
            guide === "ready" && styles.ready,
            {
              width: oval.width,
              height: oval.height,
              borderRadius: oval.width,
              left: (size.width - oval.width) / 2,
              top: size.height * guideLimits.centre.y - oval.height / 2,
            },
          ]}
        />
        <View style={styles.guide} pointerEvents="none">
          <AppText
            style={styles.guideText}
            accessibilityLiveRegion="polite"
            testID="selfie-guide"
          >
            {t(`selfie.guide.${guide}`)}
          </AppText>
        </View>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t("selfie.take")}
        accessibilityState={{ disabled: disabled || taking }}
        disabled={disabled || taking}
        onPress={() => {
          void capture();
        }}
        style={({ pressed }) => [
          styles.shutter,
          (disabled || taking) && styles.disabled,
          pressed && styles.pressed,
        ]}
      >
        <View style={styles.shutterInner} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: "center", gap: 16 },
  frame: {
    width: "100%",
    aspectRatio: 3 / 4,
    borderRadius: theme.radius.md,
    borderCurve: "continuous",
    overflow: "hidden",
    backgroundColor: theme.colors.ink,
  },
  oval: {
    position: "absolute",
    borderWidth: 3,
    borderColor: "rgba(255,255,255,0.75)",
    borderStyle: "dashed",
  },
  ready: { borderColor: theme.colors.onPlum, borderStyle: "solid" },
  guide: {
    position: "absolute",
    left: 12,
    right: 12,
    bottom: 12,
    alignItems: "center",
  },
  guideText: {
    color: theme.colors.onPlum,
    fontWeight: "600",
    textAlign: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    overflow: "hidden",
    backgroundColor: "rgba(50,46,40,0.7)",
  },
  shutter: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 4,
    borderColor: theme.colors.plum,
    alignItems: "center",
    justifyContent: "center",
  },
  shutterInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: theme.colors.plum,
  },
  disabled: { opacity: 0.45 },
  pressed: { opacity: 0.7 },
});
