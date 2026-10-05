import { useEffect, useRef, useState } from "react";
import { router } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import {
  Easing,
  ReduceMotion,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
import ClosetVision, {
  type SelfieCameraHandle,
  type SelfieReading,
} from "../../../modules/closet-vision/src";
import type { ColourProfile, Season } from "../../domain/closet";
import { fromSelfie, type Retake } from "../../domain/colourAnalysis";
import { applyAnswer } from "../../domain/onboarding";
import {
  closeSeason,
  combineReadings,
  shiftSeason,
  withSeason,
  type Shift,
} from "../../domain/seasons";
import {
  readyToCapture,
  selfieChecks,
  selfieGuide,
  type CameraReading,
  type Guide,
  type GuideSample,
  type SelfieChecks,
} from "../../domain/selfieGuide";
import { clockFor } from "../../domain/today";
import { t } from "../../i18n";
import { useCloset } from "../../state/closet";
import { now } from "../../state/clock";
import { discardTemporary } from "../../storage/local";
import { fixtures } from "../../testing/fixtures";
import { motion, timing } from "../../ui/motion";
import { paletteOf } from "./palette";

export type SelfiePhase = "tips" | "camera" | "measuring" | "result";
export type CameraState = "ready" | "denied" | "unavailable" | "failed";
type Photo = { uri: string; reading: SelfieReading };

const frames = 3;

export function useSelfie() {
  const { closet, update } = useCloset();
  const [phase, setPhase] = useState<SelfiePhase>("tips");
  const [camera, setCamera] = useState<CameraState>("ready");
  const [guide, setGuide] = useState<Guide | null>(null);
  const [checks, setChecks] = useState<SelfieChecks | null>(null);
  const [retake, setRetake] = useState<Retake | "failed" | null>(null);
  const [photo, setPhoto] = useState<Photo | null>(null);
  const [still, setStill] = useState<string | null>(null);
  const [base, setBase] = useState<ColourProfile | null>(null);
  const [profile, setProfile] = useState<ColourProfile | null>(null);
  const [hairCovered, setHair] = useState(
    closet.styling.everyday?.hijab !== "not-needed",
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hold = useSharedValue(0);
  const cameraRef = useRef<SelfieCameraHandle>(null);
  const samples = useRef<GuideSample[]>([]);
  const taking = useRef(false);
  const active = useRef(true);
  const kept = useRef<string[]>([]);
  const fire = useRef<() => void>(() => undefined);

  function discard(uris = kept.current) {
    kept.current = kept.current.filter((uri) => !uris.includes(uri));
    for (const uri of uris) void discardTemporary(uri).catch(() => undefined);
  }

  useEffect(() => {
    active.current = true;
    return () => {
      active.current = false;
      discard();
    };
  }, []);

  const counting =
    phase === "camera" && camera === "ready" && guide === "ready";

  useEffect(() => {
    fire.current = () => {
      if (readyToCapture(samples.current, Date.now(), motion.timer.dwell))
        void capture();
    };
  });

  useEffect(() => {
    if (!counting) {
      hold.set(timing(0, "quick", "release"));
      return;
    }
    const done = () => fire.current();
    hold.set(
      withTiming(
        1,
        {
          duration: motion.timer.dwell,
          easing: Easing.linear,
          reduceMotion: ReduceMotion.Never,
        },
        (finished) => {
          if (finished) scheduleOnRN(done);
        },
      ),
    );
  }, [counting, hold]);

  async function openCamera() {
    setRetake(null);
    setGuide(null);
    setChecks(null);
    samples.current = [];
    setPhase("camera");
    if (fixtures.cameraFails) {
      setCamera("failed");
      return;
    }
    if (!ClosetVision.isAvailable()) {
      setCamera("unavailable");
      return;
    }
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (active.current) setCamera(permission.granted ? "ready" : "denied");
    } catch {
      if (active.current) setCamera("failed");
    }
  }

  function onReading(reading: CameraReading) {
    if (taking.current) return;
    const next = selfieGuide(reading);
    const list = samples.current;
    list.push({ guide: next, at: Date.now() });
    if (list.length > 60) list.splice(0, list.length - 60);
    if (next === "ready") setRetake(null);
    setGuide((current) => (current === next ? current : next));
    const nextChecks = selfieChecks(reading);
    setChecks((current) =>
      current &&
      current.light === nextChecks.light &&
      current.framing === nextChecks.framing &&
      current.still === nextChecks.still
        ? current
        : nextChecks,
    );
  }

  async function measure(uris: string[]) {
    const uri = uris[0]!;
    discard();
    kept.current = uris;
    setStill(uri);
    setRetake(null);
    setPhase("measuring");
    try {
      const reading =
        fixtures.selfie ??
        combineReadings(
          await Promise.all(
            uris.map((each) => ClosetVision.analyzeSelfie(each)),
          ),
        );
      discard(uris.slice(1));
      if (!active.current) return;
      const outcome = fromSelfie(reading, hairCovered);
      if ("retake" in outcome) {
        discard();
        setStill(null);
        setRetake(outcome.retake);
        setPhase("camera");
        return;
      }
      setPhoto({ uri, reading });
      setBase(outcome.profile);
      setProfile(outcome.profile);
      setPhase("result");
    } catch {
      if (!active.current) return;
      discard();
      setStill(null);
      setRetake("failed");
      setPhase("camera");
    }
  }

  async function capture() {
    if (taking.current || phase !== "camera") return;
    taking.current = true;
    try {
      const uris: string[] = [];
      for (let frame = 0; frame < frames; frame++) {
        const uri = await cameraRef.current?.capture();
        if (uri) uris.push(uri);
      }
      if (!active.current) discard(uris);
      else if (uris.length > 0) await measure(uris);
    } catch {
      if (active.current) setCamera("failed");
    } finally {
      taking.current = false;
      samples.current = [];
    }
  }

  async function chooseFromLibrary() {
    setError(null);
    try {
      const picked = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        quality: 1,
        exif: false,
      });
      const uri = picked.canceled ? undefined : picked.assets[0]?.uri;
      if (uri && active.current) await measure([uri]);
    } catch {
      if (active.current) setCamera("failed");
    }
  }

  function setHairCovered(next: boolean) {
    setHair(next);
    if (!photo) return;
    const outcome = fromSelfie(photo.reading, next);
    if (!("profile" in outcome)) return;
    setBase(outcome.profile);
    setProfile(outcome.profile);
  }

  function pick(season: Season) {
    if (!base) return;
    setProfile(season === base.season ? base : withSeason(base, season));
  }

  function shift(direction: Shift) {
    const next = profile && shiftSeason(profile.season, direction);
    if (next) pick(next);
  }

  function retakePhoto() {
    discard();
    setStill(null);
    setPhoto(null);
    setBase(null);
    setProfile(null);
    void openCamera();
  }

  async function save() {
    if (!profile || saving) return;
    setSaving(true);
    setError(null);
    try {
      await update((current) =>
        applyAnswer(
          current,
          "colours",
          {
            colour: profile,
            colourLean: current.styling.profile.colourLean,
          },
          clockFor(now()),
        ),
      );
      discard();
      router.back();
    } catch {
      setError(t("colours.saveFailed"));
      setSaving(false);
    }
  }

  return {
    phase,
    camera,
    guide,
    checks,
    retake,
    hold,
    cameraRef,
    photo: still,
    face: photo?.reading.face ?? null,
    size: photo
      ? { width: photo.reading.width, height: photo.reading.height }
      : null,
    profile,
    measured: base?.season ?? null,
    close: base ? closeSeason(base) : null,
    hairCovered,
    plain: closet.styling.everyday?.hijab === "not-needed",
    palette: profile ? paletteOf(profile) : null,
    saving,
    error,
    openCamera: () => void openCamera(),
    onReading,
    onUnavailable: () => setCamera("unavailable"),
    capture: () => void capture(),
    chooseFromLibrary,
    setHairCovered,
    pick,
    shift,
    retakePhoto,
    save,
  };
}
