import type { RefObject } from "react";
import { Image, StyleSheet, View, useWindowDimensions } from "react-native";
import type { SharedValue } from "react-native-reanimated";
import {
  SelfieCameraView,
  type SelfieCameraHandle,
} from "../../../modules/closet-vision/src";
import type { Retake } from "../../domain/colourAnalysis";
import type { CameraReading, Guide } from "../../domain/selfieGuide";
import { t, type Key } from "../../i18n";
import { openSettings } from "../../state/notifications";
import { Button, FaceCircle, useMeasuredMax } from "../../ui";
import { gutterFor, theme } from "../../ui/theme";
import type { CameraState } from "./useSelfie";

const guides: Guide[] = [
  "find",
  "dark",
  "closer",
  "back",
  "centre",
  "straight",
  "still",
  "ready",
];
const retakes: (Retake | "failed")[] = ["dark", "mixed", "no-face", "failed"];
const slotTexts: Key[] = [
  ...guides.map((guide) => `selfie.guide.${guide}` as const),
  ...retakes.map((reason) => `colours.retake.${reason}` as const),
  "common.cameraOff",
  "colours.cameraFailed",
];

function messageFor(
  camera: CameraState,
  guide: Guide | null,
  retake: Retake | "failed" | null,
): Key {
  if (camera === "denied") return "common.cameraOff";
  if (retake) return `colours.retake.${retake}`;
  if (camera !== "ready") return "colours.cameraFailed";
  return `selfie.guide.${guide ?? "find"}`;
}

export function SelfieCameraPhase({
  camera,
  guide,
  retake,
  hold,
  cameraRef,
  measuring,
  photo,
  onReading,
  onUnavailable,
  onCapture,
  onLibrary,
  onTryAgain,
}: {
  camera: CameraState;
  guide: Guide | null;
  retake: Retake | "failed" | null;
  hold: SharedValue<number>;
  cameraRef: RefObject<SelfieCameraHandle | null>;
  measuring: boolean;
  photo: string | null;
  onReading: (reading: CameraReading) => void;
  onUnavailable: () => void;
  onCapture: () => void;
  onLibrary: () => void;
  onTryAgain: () => void;
}) {
  const { width } = useWindowDimensions();
  const [slot, layer] = useMeasuredMax(
    slotTexts.map((key) => ({
      text: t(key),
      role: "headline" as const,
      width: width - 2 * gutterFor(width),
    })),
  );
  const live = camera === "ready";
  const faceFound = live && guide !== null && guide !== "find";
  const message = t(messageFor(camera, guide, retake));
  const state = measuring
    ? "measuring"
    : !live
      ? "unavailable"
      : guide === "ready"
        ? "ready"
        : faceFound
          ? "guiding"
          : "find";

  return (
    <View style={styles.camera}>
      {layer}
      <FaceCircle
        state={state}
        hold={hold}
        guide={message}
        guideSlotHeight={slot ?? 0}
        label={t("colours.circleLabel", { guide: message })}
        busyLabel={t("colours.busy")}
        faceFound={faceFound}
        onActivate={onCapture}
        testID="face-circle"
      >
        {measuring && photo ? (
          <Image
            source={{ uri: photo }}
            style={StyleSheet.absoluteFill}
            resizeMode="cover"
          />
        ) : live ? (
          <SelfieCameraView
            ref={cameraRef}
            style={StyleSheet.absoluteFill}
            onReading={({ nativeEvent }) => onReading(nativeEvent)}
            onState={({ nativeEvent }) => {
              if (nativeEvent.state === "unavailable") onUnavailable();
            }}
          />
        ) : null}
      </FaceCircle>
      <View style={styles.actions}>
        {camera === "denied" ? (
          <Button
            label={t("common.openSettings")}
            variant="quiet"
            onPress={openSettings}
            testID="colours-settings"
          />
        ) : null}
        {camera === "failed" ? (
          <Button
            label={t("common.tryAgain")}
            variant="secondary"
            onPress={onTryAgain}
            testID="colours-try-again"
          />
        ) : null}
        <Button
          label={t("colours.library")}
          variant="quiet"
          disabled={measuring}
          onPress={onLibrary}
          testID="colours-library"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  camera: { gap: theme.space.sm },
  actions: { alignItems: "center", gap: theme.space.xs },
});
