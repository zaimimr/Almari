import { useEffect, useRef, useState, type PropsWithChildren } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { router } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import ClosetVision, {
  type SelfieReading,
} from "../../modules/closet-vision/src";
import type { ColourProfile } from "../../src/domain/closet";
import {
  adjustColours,
  bestColours,
  fromSelfie,
  labHex,
  resampleColours,
  type Retake,
} from "../../src/domain/colourAnalysis";
import { applyAnswer } from "../../src/domain/onboarding";
import { clockFor } from "../../src/domain/today";
import { seasonLabel } from "../../src/features/colourText";
import { OnboardingBar } from "../../src/features/OnboardingBar";
import { SamplePoints } from "../../src/features/SamplePoints";
import { SelfieCamera } from "../../src/features/SelfieCamera";
import { t } from "../../src/i18n";
import { useCloset } from "../../src/state/closet";
import { discardTemporary } from "../../src/storage/local";
import {
  AppText,
  Button,
  ChoiceGroup,
  ErrorMessage,
  FormScreen,
} from "../../src/ui";
import { theme } from "../../src/ui/theme";

type Phase =
  | { kind: "intro" }
  | { kind: "measuring" }
  | { kind: "retake"; reason: Retake | "failed" }
  | {
      kind: "result";
      profile: ColourProfile;
      photo: { uri: string; reading: SelfieReading };
    };

type Camera = "pending" | "on" | "off" | "denied";

export default function Colours() {
  const { update } = useCloset();
  const [phase, setPhase] = useState<Phase>({ kind: "intro" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [camera, setCamera] = useState<Camera>(() =>
    ClosetVision.isAvailable() ? "pending" : "off",
  );
  const [dragging, setDragging] = useState(false);
  const kept = useRef<string | null>(null);

  function discard() {
    const uri = kept.current;
    kept.current = null;
    if (uri) void discardTemporary(uri).catch(() => undefined);
  }

  useEffect(() => {
    if (!ClosetVision.isAvailable()) return;
    ImagePicker.requestCameraPermissionsAsync()
      .then((permission) => setCamera(permission.granted ? "on" : "denied"))
      .catch(() => setCamera("off"));
  }, []);

  useEffect(() => discard, []);

  async function measure(uri: string) {
    setError(null);
    discard();
    kept.current = uri;
    setPhase({ kind: "measuring" });
    try {
      const reading = await ClosetVision.analyzeSelfie(uri);
      const outcome = fromSelfie(reading);
      if ("retake" in outcome) {
        discard();
        setPhase({ kind: "retake", reason: outcome.retake });
      } else
        setPhase({
          kind: "result",
          profile: outcome.profile,
          photo: { uri, reading },
        });
    } catch {
      discard();
      setPhase({ kind: "retake", reason: "failed" });
    }
  }

  async function pick() {
    setError(null);
    try {
      const picked = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        quality: 1,
        exif: false,
      });
      const uri = picked.canceled ? undefined : picked.assets[0]?.uri;
      if (uri) await measure(uri);
    } catch {
      setError(t("colours.cameraFailed"));
    }
  }

  async function save(profile: ColourProfile) {
    setBusy(true);
    setError(null);
    try {
      await update((current) =>
        applyAnswer(
          current,
          "colours",
          {
            colour: adjustColours(profile, {}),
            colourLean: current.styling.profile.colourLean,
          },
          clockFor(new Date()),
        ),
      );
      discard();
      router.back();
    } catch {
      setError(t("colours.saveFailed"));
    } finally {
      setBusy(false);
    }
  }

  if (phase.kind === "measuring")
    return (
      <Shell>
        <ActivityIndicator color={theme.colors.accent} />
        <AppText muted accessibilityLiveRegion="polite">
          {t("colours.busy")}
        </AppText>
      </Shell>
    );

  if (phase.kind === "result") {
    const { profile, photo } = phase;
    const set = (change: Parameters<typeof adjustColours>[1]) =>
      setPhase({ ...phase, profile: adjustColours(profile, change) });
    return (
      <Shell scrollEnabled={!dragging}>
        <SamplePoints
          uri={photo.uri}
          reading={photo.reading}
          profile={profile}
          onDragging={setDragging}
          onSample={(part, lab) =>
            setPhase((current) =>
              current.kind === "result"
                ? {
                    ...current,
                    profile: resampleColours(current.profile, part, lab),
                  }
                : current,
            )
          }
        />
        <AppText style={styles.label}>{t("colours.measured")}</AppText>
        <View style={styles.measured}>
          {(["skin", "hair", "eyes"] as const).map((part) => {
            const lab = profile[part];
            return (
              <View key={part} style={styles.part} testID={`measured-${part}`}>
                <View
                  style={[
                    styles.dot,
                    lab ? { backgroundColor: labHex(lab) } : styles.empty,
                  ]}
                />
                <AppText>{t(`colours.${part}`)}</AppText>
                {lab ? null : (
                  <AppText variant="caption" muted>
                    {t("colours.unknown")}
                  </AppText>
                )}
              </View>
            );
          })}
        </View>
        <AppText variant="heading" testID="season">
          {t("colours.result", { season: seasonLabel(profile.season) })}
        </AppText>
        <AppText muted>{t("colours.adjust")}</AppText>
        <ChoiceGroup
          label={t("colours.undertone")}
          options={(["warm", "cool", "neutral"] as const).map((id) => ({
            id,
            label: t(`undertone.${id}`),
          }))}
          value={profile.undertone}
          disabled={busy}
          onChange={(undertone) => set({ undertone })}
        />
        <ChoiceGroup
          label={t("colours.depth")}
          options={(["light", "medium", "deep"] as const).map((id) => ({
            id,
            label: t(`depth.${id}`),
          }))}
          value={profile.depth}
          disabled={busy}
          onChange={(depth) => set({ depth })}
        />
        <ChoiceGroup
          label={t("colours.contrast")}
          options={(["low", "medium", "high"] as const).map((id) => ({
            id,
            label: t(`contrast.${id}`),
          }))}
          value={profile.contrast}
          disabled={busy}
          onChange={(contrast) => set({ contrast })}
        />
        <AppText style={styles.label}>{t("colours.best")}</AppText>
        <View style={styles.palette}>
          {bestColours(profile).map((lab) => (
            <View
              key={lab.join()}
              style={[styles.dot, { backgroundColor: labHex(lab) }]}
            />
          ))}
        </View>
        <ErrorMessage message={error} />
        <Button
          label={t("colours.save")}
          busy={busy}
          onPress={() => {
            void save(profile);
          }}
        />
        <Button
          label={t("colours.tryAgain")}
          secondary
          disabled={busy}
          onPress={() => {
            discard();
            setPhase({ kind: "intro" });
          }}
        />
      </Shell>
    );
  }

  return (
    <Shell>
      {phase.kind === "retake" ? (
        <View style={styles.notice} accessibilityLiveRegion="polite">
          <AppText>{t(`colours.retake.${phase.reason}`)}</AppText>
        </View>
      ) : null}
      {camera === "on" ? (
        <SelfieCamera
          disabled={busy}
          onCapture={(uri) => {
            void measure(uri);
          }}
          onUnavailable={() => setCamera("off")}
        />
      ) : null}
      {camera === "denied" ? <AppText>{t("colours.cameraOff")}</AppText> : null}
      <AppText>{t("colours.tips")}</AppText>
      <AppText muted>{t("colours.hijab")}</AppText>
      <AppText variant="caption" muted>
        {t("colours.deleted")}
      </AppText>
      <ErrorMessage message={error} />
      <Button
        label={t("colours.library")}
        secondary={camera === "on"}
        onPress={() => {
          void pick();
        }}
      />
    </Shell>
  );
}

function Shell({
  children,
  scrollEnabled,
}: PropsWithChildren<{ scrollEnabled?: boolean }>) {
  return (
    <View style={styles.screen}>
      <OnboardingBar
        action={{
          label: t("common.back"),
          back: true,
          onPress: () => router.back(),
        }}
      />
      <FormScreen scrollEnabled={scrollEnabled}>
        <AppText variant="title" accessibilityRole="header">
          {t("colours.title")}
        </AppText>
        {children}
      </FormScreen>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.colors.background },
  label: { fontWeight: "600" },
  measured: { flexDirection: "row", flexWrap: "wrap", gap: 16 },
  part: { alignItems: "center", gap: 4, minWidth: 88 },
  dot: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: theme.colors.line,
  },
  empty: { backgroundColor: theme.colors.surface, borderStyle: "dashed" },
  palette: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  notice: {
    padding: 16,
    borderRadius: theme.radius,
    borderCurve: "continuous",
    backgroundColor: theme.colors.accentSoft,
  },
});
