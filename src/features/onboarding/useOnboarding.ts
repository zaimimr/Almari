import { useState } from "react";
import { router } from "expo-router";
import ClosetVision from "../../../modules/closet-vision/src";
import type { NotificationTime } from "../../domain/closet";
import { notificationPlan } from "../../domain/notifications";
import {
  answersFrom,
  applyAnswer,
  finishOnboarding,
  hasAnswer,
  placeFrom,
  previousStep,
  resumeStep,
  skipStep,
  stepsFor,
  type Answers,
  type OnboardingStep,
} from "../../domain/onboarding";
import { clockFor } from "../../domain/today";
import { locale, t } from "../../i18n";
import { useCloset } from "../../state/closet";
import { now } from "../../state/clock";
import { addPiecesRoute } from "../../state/imports";
import { locatePhone } from "../../state/location";
import {
  askNotificationPermission,
  notificationPermission,
  syncSchedule,
} from "../../state/notifications";
import { announce } from "../../ui/announce";

export type PlaceMessage = "denied" | "unavailable" | "offline" | "notFound";

export function useOnboarding(single: OnboardingStep | null = null) {
  const { closet, update } = useCloset();
  const [answers, setAnswers] = useState<Answers>(() => answersFrom(closet));
  const { colour, colourLean } = closet.styling.profile;
  const [profile, setProfile] = useState({ colour, colourLean });
  if (profile.colour !== colour || profile.colourLean !== colourLean) {
    setProfile({ colour, colourLean });
    setAnswers((current) => ({ ...current, colours: { colour, colourLean } }));
  }
  const [step, setStep] = useState<OnboardingStep>(
    () => single ?? resumeStep(answers),
  );
  const [welcome, setWelcome] = useState(() => !single && step === "name");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [finishing, setFinishing] = useState<"add" | "sample" | null>(null);
  const [locating, setLocating] = useState(false);
  const [searching, setSearching] = useState(false);
  const [placeMessage, setPlaceMessage] = useState<PlaceMessage | null>(null);
  const [notifyDenied, setNotifyDenied] = useState(false);

  const steps = stepsFor(answers).filter((item) => item !== "done");
  const wearsHijab =
    answers.hijab.hijab === "always" || answers.hijab.hijab === "sometimes";
  const total = steps.length;
  const position = step === "done" ? total : steps.indexOf(step) + 1;

  function set<S extends keyof Answers>(key: S, answer: Answers[S]) {
    setAnswers((current) => ({ ...current, [key]: answer }));
  }

  async function write(key: keyof Answers) {
    if (key === "colours") return true;
    try {
      await update((current) =>
        applyAnswer(current, key, answers[key], clockFor(now())),
      );
      return true;
    } catch {
      setError(t("common.error.save"));
      return false;
    }
  }

  async function next() {
    if (busy || step === "done") return;
    setError(null);
    setBusy(true);
    const saved = await write(step);
    setBusy(false);
    if (!saved) return;
    if (single === "hijab" && step === "hijab" && wearsHijab) {
      setStep("hijabStyles");
      return;
    }
    if (single) {
      router.back();
      return;
    }
    setStep(skipStep(step, answers));
  }

  function back() {
    const before = previousStep(step, answers);
    if (!before) return;
    setError(null);
    setStep(before);
  }

  async function locate() {
    setLocating(true);
    setPlaceMessage(null);
    const result = await locatePhone();
    setLocating(false);
    if (!result.ok) {
      setPlaceMessage(result.reason);
      return;
    }
    const { name, latitude, longitude } = result.place;
    const place = placeFrom(name, latitude, longitude, "device");
    if (!place) {
      setPlaceMessage("unavailable");
      return;
    }
    set("place", { place });
    announce(place.name);
  }

  async function search(query: string) {
    if (!query.trim()) return;
    setSearching(true);
    setPlaceMessage(null);
    try {
      const found = await ClosetVision.geocodeCity(query.trim());
      const place =
        found &&
        placeFrom(found.name, found.latitude, found.longitude, "search");
      if (!place) setPlaceMessage("notFound");
      else {
        set("place", { place });
        announce(place.name);
      }
    } catch {
      setPlaceMessage("offline");
    } finally {
      setSearching(false);
    }
  }

  async function pickTime(time: NotificationTime | null) {
    set("notifications", { notification: time });
    if (!time) {
      setNotifyDenied(false);
      return;
    }
    setNotifyDenied((await askNotificationPermission()) === "denied");
  }

  async function finish(target: "add" | "sample") {
    if (finishing) return;
    setError(null);
    setFinishing(target);
    try {
      await update((current) => finishOnboarding(current, clockFor(now())));
    } catch {
      setError(t("common.error.save"));
      setFinishing(null);
      return;
    }
    const plan = notificationPlan(
      {
        notification: answers.notifications.notification,
        name: answers.name.name ?? undefined,
      },
      locale,
    );
    if (plan && (await notificationPermission()) === "granted")
      void syncSchedule(plan).catch(() => undefined);
    if (target === "sample") {
      router.replace("/today");
      return;
    }
    router.replace("/closet");
    router.push(addPiecesRoute);
  }

  return {
    step,
    welcome,
    start: () => setWelcome(false),
    answered: hasAnswer(step, answers),
    steps,
    position,
    total,
    answers,
    error,
    busy,
    finishing,
    set,
    next,
    back,
    finish,
    place: {
      locate,
      search,
      locating,
      searching,
      message: placeMessage,
    },
    notify: { pickTime, denied: notifyDenied },
  };
}
