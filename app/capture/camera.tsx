import { useCallback, useEffect, useRef, useState } from "react";
import { AppState, Linking, Pressable, StyleSheet, View } from "react-native";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { randomUUID } from "expo-crypto";
import { router, useFocusEffect } from "expo-router";
import {
  LiveScanView,
  type LiveScanHandle,
  type ScanCameraState,
} from "../../modules/closet-vision/src";
import { wholePhoto } from "../../src/domain/capture";
import { queueImport } from "../../src/domain/importing";
import { FixtureScanView } from "../../src/features/FixtureScanView";
import { t } from "../../src/i18n";
import { useDiscardChanges } from "../../src/navigation/useDiscardChanges";
import { useCloset } from "../../src/state/closet";
import { now } from "../../src/state/clock";
import { discardPhoto, lowOnSpace, photoUri } from "../../src/storage/local";
import { fixtures } from "../../src/testing/fixtures";
import { Button, CameraFrame, Footer, Screen, Text } from "../../src/ui";
import { theme } from "../../src/ui/theme";
import { useColors } from "../../src/ui/useColors";
import { useLargeText } from "../../src/ui/useLargeText";

type Shot = { id: string; photo: string };

export default function ItemCamera() {
  const { update } = useCloset();
  const colors = useColors();
  const { ax } = useLargeText();
  const camera = useRef<LiveScanHandle>(null);
  const pending = useRef<Shot | null>(null);
  const mounted = useRef(true);
  const working = useRef(false);
  const focusTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [shot, setShot] = useState<Shot | null>(null);
  const [state, setState] = useState<ScanCameraState | "starting">("starting");
  const [allowed, setAllowed] = useState(false);
  const [focused, setFocused] = useState(false);
  const [active, setActive] = useState(AppState.currentState === "active");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [point, setPoint] = useState<{ x: number; y: number } | null>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const allowClose = useDiscardChanges(false, busy);

  useFocusEffect(
    useCallback(() => {
      setFocused(true);
      return () => setFocused(false);
    }, []),
  );

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (next) =>
      setActive(next === "active"),
    );
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    let live = true;
    if (active && focused) {
      ImagePicker.requestCameraPermissionsAsync()
        .then((permission) => {
          if (!live) return;
          setAllowed(permission.granted);
          if (!permission.granted) setState("denied");
        })
        .catch(() => {
          if (live) setState("unavailable");
        });
    }
    return () => {
      live = false;
    };
  }, [active, focused]);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      if (focusTimer.current) clearTimeout(focusTimer.current);
      if (pending.current) void discardPhoto(pending.current.photo);
    };
  }, []);

  async function take() {
    if (!camera.current || working.current || state !== "ready") return;
    setError(null);
    if (lowOnSpace()) {
      setError(t("problem.low-space"));
      return;
    }
    working.current = true;
    setBusy(true);
    try {
      if (fixtures.failCapture) throw new Error("fixture");
      const id = randomUUID();
      const result = await camera.current.capture(id, wholePhoto, "item");
      if (result.sticker) void discardPhoto(result.sticker.name);
      if (result.region) void discardPhoto(result.region.cutout);
      if (!mounted.current) {
        void discardPhoto(result.photo);
        return;
      }
      pending.current = { id, photo: result.photo };
      setShot(pending.current);
    } catch {
      if (mounted.current) setError(t("camera.failed"));
    } finally {
      working.current = false;
      if (mounted.current) setBusy(false);
    }
  }

  function retake() {
    if (busy || !shot) return;
    void discardPhoto(shot.photo);
    pending.current = null;
    setShot(null);
    setPoint(null);
    setError(null);
    setState("starting");
  }

  async function save() {
    if (!shot || working.current) return;
    working.current = true;
    setBusy(true);
    setError(null);
    pending.current = null;
    try {
      await update((current) =>
        queueImport(
          { ...current, photoTipsSeen: true },
          {
            id: shot.id,
            source: shot.photo,
            createdAt: now().toISOString(),
          },
        ),
      );
      if (mounted.current) {
        allowClose();
        router.back();
      }
    } catch {
      if (mounted.current) {
        pending.current = shot;
        setError(t("capture.saveFailed"));
      } else void discardPhoto(shot.photo);
    } finally {
      working.current = false;
      if (mounted.current) setBusy(false);
    }
  }

  function focus(x: number, y: number) {
    if (!size.width || !size.height || busy || state !== "ready") return;
    setPoint({ x, y });
    void camera.current
      ?.focus(x / size.width, y / size.height)
      .catch(() => setPoint(null));
    if (focusTimer.current) clearTimeout(focusTimer.current);
    focusTimer.current = setTimeout(() => setPoint(null), 1200);
  }

  const library = () =>
    router.dismissTo({ pathname: "/capture", params: { open: "library" } });
  const unavailable = state === "denied" || state === "unavailable";
  const Camera = fixtures.scan ? FixtureScanView : LiveScanView;

  return (
    <Screen
      title={t(shot ? "camera.review" : "camera.title")}
      headerTitleVisible
      leading="cancel"
      onCancel={() => {
        if (!busy) router.back();
      }}
      media={!shot}
      scroll={false}
      footer={
        shot ? (
          <Footer
            error={error}
            actions={ax ? [] : undefined}
            primary={{
              label: t("camera.usePhoto"),
              onPress: () => void save(),
              busy,
              testID: "camera-use",
            }}
            secondary={{
              label: t("capture.retake"),
              onPress: retake,
              disabled: busy,
              testID: "camera-retake",
            }}
          />
        ) : undefined
      }
      testID="item-camera"
    >
      {shot ? (
        <View style={[styles.review, { backgroundColor: colors.sunken }]}>
          <Image
            source={{ uri: photoUri(shot.photo) }}
            contentFit="contain"
            style={StyleSheet.absoluteFill}
            accessibilityLabel={t("capture.photo")}
            accessibilityIgnoresInvertColors
            testID="camera-preview"
          />
        </View>
      ) : (
        <CameraFrame
          full
          guide={
            error ??
            t(state === "ready" ? "camera.frameGuide" : "scan.starting")
          }
          shutter={{
            onPress: () => void take(),
            disabled: state !== "ready" || busy,
          }}
          controls={
            !unavailable ? (
              <View style={styles.controls}>
                <Text role="subhead" tone="onMedia">
                  {t("camera.lightGuide")}
                </Text>
                <Button
                  label={t("capture.choosePhotos")}
                  variant="quiet"
                  media
                  onPress={library}
                  disabled={busy}
                />
              </View>
            ) : undefined
          }
          unavailable={
            unavailable
              ? {
                  title: t(
                    state === "denied"
                      ? "common.cameraOff"
                      : "scan.unavailable",
                  ),
                  action: {
                    label: t("capture.choosePhotos"),
                    onPress: library,
                    media: true,
                  },
                  ...(state === "denied"
                    ? {
                        secondary: {
                          label: t("common.openSettings"),
                          onPress: () => void Linking.openSettings(),
                          variant: "quiet" as const,
                          media: true,
                        },
                      }
                    : {}),
                }
              : undefined
          }
        >
          <View
            style={StyleSheet.absoluteFill}
            onLayout={(event) => setSize(event.nativeEvent.layout)}
          >
            <Camera
              ref={camera}
              style={StyleSheet.absoluteFill}
              photograph
              facing="back"
              active={allowed && active && focused}
              frozen={busy}
              fps={4}
              onFrame={() => undefined}
              onCamera={(event) => setState(event.nativeEvent.state)}
            />
            <Pressable
              style={StyleSheet.absoluteFill}
              accessibilityRole="button"
              accessibilityLabel={t("camera.focus")}
              onPress={(event) =>
                focus(event.nativeEvent.locationX, event.nativeEvent.locationY)
              }
              onAccessibilityTap={() => focus(size.width / 2, size.height / 2)}
              testID="camera-focus"
            >
              <View
                pointerEvents="none"
                style={[styles.framing, { borderColor: colors.onMedia }]}
              />
              {point ? (
                <View
                  pointerEvents="none"
                  style={[
                    styles.focus,
                    {
                      borderColor: colors.blush,
                      left: point.x - 30,
                      top: point.y - 30,
                    },
                  ]}
                />
              ) : null}
            </Pressable>
          </View>
        </CameraFrame>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  review: {
    flex: 1,
    borderRadius: theme.radius.md,
    borderCurve: "continuous",
    overflow: "hidden",
    marginVertical: theme.space.lg,
  },
  controls: { alignItems: "center", gap: theme.space.sm },
  framing: {
    position: "absolute",
    top: "8%",
    bottom: "12%",
    left: "8%",
    right: "8%",
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: theme.radius.md,
  },
  focus: {
    position: "absolute",
    width: 60,
    height: 60,
    borderWidth: 2,
    borderRadius: theme.radius.sm,
  },
});
