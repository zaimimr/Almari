import { useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { router } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import ClosetVision from "../../modules/closet-vision/src";
import type { ColourProfile } from "../../src/domain/closet";
import {
  adjustColours,
  bestColours,
  fromSelfie,
  labHex,
  type Retake,
} from "../../src/domain/colourAnalysis";
import { applyAnswer } from "../../src/domain/onboarding";
import { clockFor } from "../../src/domain/today";
import { seasonLabel } from "../../src/features/colourText";
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
  | { kind: "result"; profile: ColourProfile };

export default function Colours() {
  const { update } = useCloset();
  const [phase, setPhase] = useState<Phase>({ kind: "intro" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function take(source: "camera" | "library") {
    setError(null);
    let uri: string | undefined;
    try {
      if (source === "camera") {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted) return setError(t("colours.cameraOff"));
      }
      const picked =
        source === "camera"
          ? await ImagePicker.launchCameraAsync({
              mediaTypes: ["images"],
              cameraType: ImagePicker.CameraType.front,
              quality: 1,
              exif: false,
            })
          : await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ["images"],
              quality: 1,
              exif: false,
            });
      if (picked.canceled) return;
      uri = picked.assets[0]?.uri;
    } catch {
      return setError(t("colours.cameraFailed"));
    }
    if (!uri) return;
    setPhase({ kind: "measuring" });
    try {
      const outcome = fromSelfie(await ClosetVision.analyzeSelfie(uri));
      setPhase(
        "retake" in outcome
          ? { kind: "retake", reason: outcome.retake }
          : { kind: "result", profile: outcome.profile },
      );
    } catch {
      setPhase({ kind: "retake", reason: "failed" });
    } finally {
      void discardTemporary(uri).catch(() => undefined);
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
          { colour: adjustColours(profile, {}) },
          clockFor(new Date()),
        ),
      );
      router.back();
    } catch {
      setError(t("colours.saveFailed"));
    } finally {
      setBusy(false);
    }
  }

  const pickers = (
    <>
      <Button
        label={t("colours.camera")}
        onPress={() => {
          void take("camera");
        }}
      />
      <Button
        label={t("colours.library")}
        secondary
        onPress={() => {
          void take("library");
        }}
      />
    </>
  );

  if (phase.kind === "measuring")
    return (
      <FormScreen>
        <ActivityIndicator color={theme.colors.accent} />
        <AppText muted accessibilityLiveRegion="polite">
          {t("colours.busy")}
        </AppText>
      </FormScreen>
    );

  if (phase.kind === "result") {
    const profile = phase.profile;
    const set = (change: Parameters<typeof adjustColours>[1]) =>
      setPhase({ kind: "result", profile: adjustColours(profile, change) });
    return (
      <FormScreen>
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
          onPress={() => setPhase({ kind: "intro" })}
        />
      </FormScreen>
    );
  }

  return (
    <FormScreen>
      {phase.kind === "retake" ? (
        <View style={styles.notice} accessibilityLiveRegion="polite">
          <AppText>{t(`colours.retake.${phase.reason}`)}</AppText>
        </View>
      ) : null}
      <AppText>{t("colours.tips")}</AppText>
      <AppText muted>{t("colours.hijab")}</AppText>
      <AppText variant="caption" muted>
        {t("colours.deleted")}
      </AppText>
      <ErrorMessage message={error} />
      {pickers}
    </FormScreen>
  );
}

const styles = StyleSheet.create({
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
