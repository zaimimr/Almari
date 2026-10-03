import {
  coverageNeedFor,
  emptyCloset,
  type BodyShape,
  type Closet,
  type ColourProfile,
  type Coverage,
  type EverydayStyle,
  type HijabStyle,
  type NotificationTime,
  type Place,
  type Sparkle,
  type StyleProfile,
  type Units,
} from "./closet";
import { closetFiles } from "./importing";
import { addSampleWardrobe } from "./samples";
import { saveEverydayStyle, type Clock } from "./today";

export const onboardingSteps = [
  "name",
  "hijab",
  "hijabStyles",
  "coverage",
  "style",
  "fit",
  "sparkle",
  "place",
  "notifications",
  "colours",
  "done",
] as const;

export type OnboardingStep = (typeof onboardingSteps)[number];

export type Answers = {
  name: { name: string | null };
  hijab: { hijab: "always" | "sometimes" | "no" | null };
  hijabStyles: { hijabStyles: HijabStyle[] | null };
  coverage: { coverage: Coverage | null; answered: boolean };
  style: { styleLean: StyleProfile["styleLean"] };
  fit: { fit: StyleProfile["fit"] };
  sparkle: { sparkle: Sparkle | null };
  place: { place: Place | null };
  notifications: { notification: NotificationTime | null };
  colours: {
    colour: ColourProfile | null;
    colourLean: StyleProfile["colourLean"];
  };
  body: { units: Units; heightCm: number | null; bodyShape: BodyShape | null };
};

export type AnswerStep = keyof Answers;

const hijabPreference = {
  always: "always",
  no: "not-needed",
  sometimes: null,
} as const;

export function stepsFor(answers: Answers): OnboardingStep[] {
  return onboardingSteps.filter(
    (step) => step !== "hijabStyles" || answers.hijab.hijab !== "no",
  );
}

export function skipStep(
  step: OnboardingStep,
  answers: Answers,
): OnboardingStep {
  const steps = stepsFor(answers);
  return (
    onboardingSteps
      .slice(onboardingSteps.indexOf(step) + 1)
      .find((next) => steps.includes(next)) ?? "done"
  );
}

export function previousStep(
  step: OnboardingStep,
  answers: Answers,
): OnboardingStep | null {
  const steps = stepsFor(answers);
  return (
    onboardingSteps
      .slice(0, onboardingSteps.indexOf(step))
      .reverse()
      .find((before) => steps.includes(before)) ?? null
  );
}

export function answersFrom(closet: Closet): Answers {
  const { everyday, profile, units, place, name, notification } =
    closet.styling;
  return {
    name: { name: name ?? null },
    hijab: {
      hijab:
        everyday?.hijab === "always"
          ? "always"
          : everyday?.hijab === "not-needed"
            ? "no"
            : profile.hijabAnswered || everyday
              ? "sometimes"
              : null,
    },
    hijabStyles: { hijabStyles: profile.hijabStyles ?? null },
    coverage: {
      coverage: profile.coverageLevel,
      answered: profile.coverageAnswered === true,
    },
    style: { styleLean: profile.styleLean },
    fit: { fit: profile.fit },
    sparkle: { sparkle: profile.sparkle ?? null },
    place: { place },
    notifications: { notification: notification ?? null },
    colours: { colour: profile.colour, colourLean: profile.colourLean },
    body: { units, heightCm: profile.heightCm, bodyShape: profile.bodyShape },
  };
}

function withProfile(closet: Closet, change: Partial<StyleProfile>): Closet {
  return {
    ...closet,
    styling: {
      ...closet.styling,
      profile: { ...closet.styling.profile, ...change },
    },
  };
}

function withPreset(
  closet: Closet,
  change: Partial<Pick<EverydayStyle, "style" | "hijab">>,
  clock: Clock,
): Closet {
  const current = closet.styling.everyday;
  if (!current && Object.values(change).every((value) => value === null))
    return closet;
  const preset = {
    occasion: current?.occasion ?? "everyday",
    style: current?.style ?? "western",
    hijab: current?.hijab ?? null,
    sample: false,
    ...change,
  };
  if (
    current &&
    preset.style === current.style &&
    preset.hijab === current.hijab
  )
    return closet;
  return saveEverydayStyle(closet, preset, clock, true);
}

export function setName(closet: Closet, name: string): Closet {
  const { name: _name, ...styling } = closet.styling;
  const clean = name.trim().slice(0, 40);
  return {
    ...closet,
    styling: clean ? { ...styling, name: clean } : styling,
  };
}

export function applyAnswer<S extends AnswerStep>(
  closet: Closet,
  step: S,
  answer: Answers[S],
  clock: Clock,
): Closet {
  if (step === "name")
    return setName(closet, (answer as Answers["name"]).name ?? "");
  if (step === "hijab") {
    const { hijab } = answer as Answers["hijab"];
    if (hijab === null) return closet;
    return withPreset(
      withProfile(closet, { hijabAnswered: true }),
      { hijab: hijabPreference[hijab] },
      clock,
    );
  }
  if (step === "hijabStyles") {
    const { hijabStyles } = answer as Answers["hijabStyles"];
    const { hijabStyles: _old, ...profile } = closet.styling.profile;
    return {
      ...closet,
      styling: {
        ...closet.styling,
        profile: hijabStyles ? { ...profile, hijabStyles } : profile,
      },
    };
  }
  if (step === "coverage") {
    const { coverage, answered } = answer as Answers["coverage"];
    const saved = withProfile(closet, {
      coverageLevel: coverage,
      ...(answered ? { coverageAnswered: true as const } : {}),
    });
    const everyday = saved.styling.everyday;
    if (!everyday || coverage === closet.styling.profile.coverageLevel)
      return saved;
    return saveEverydayStyle(saved, everyday, clock, true);
  }
  if (step === "style") {
    const { styleLean } = answer as Answers["style"];
    const saved = withProfile(closet, { styleLean });
    const style =
      styleLean === "both"
        ? (closet.styling.everyday?.style ?? "western")
        : styleLean;
    return style === null ? saved : withPreset(saved, { style }, clock);
  }
  if (step === "place") {
    const { place } = answer as Answers["place"];
    const moved =
      JSON.stringify(place) !== JSON.stringify(closet.styling.place);
    return {
      ...closet,
      styling: {
        ...closet.styling,
        place,
        forecast: moved ? null : closet.styling.forecast,
      },
    };
  }
  if (step === "notifications")
    return {
      ...closet,
      styling: {
        ...closet.styling,
        notification: (answer as Answers["notifications"]).notification,
      },
    };
  if (step === "body") {
    const { units, ...body } = answer as Answers["body"];
    return withProfile(
      { ...closet, styling: { ...closet.styling, units } },
      body,
    );
  }
  return withProfile(
    closet,
    answer as Answers["fit"] | Answers["sparkle"] | Answers["colours"],
  );
}

export function finishOnboarding(closet: Closet, clock: Clock): Closet {
  const done = { ...closet, styling: { ...closet.styling, onboarded: true } };
  if (done.styling.everyday) return done;
  const { styleLean, coverageLevel } = done.styling.profile;
  const coverage = coverageNeedFor(coverageLevel);
  return saveEverydayStyle(
    done,
    {
      occasion: "everyday",
      style: styleLean === "desi" ? "desi" : "western",
      hijab: null,
      sample: false,
      ...(coverage ? { coverage } : {}),
    },
    clock,
    true,
  );
}

export function replayOnboarding(closet: Closet): Closet {
  return { ...closet, styling: { ...closet.styling, onboarded: false } };
}

export function resetCloset(closet: Closet): {
  closet: Closet;
  files: string[];
} {
  return {
    closet: addSampleWardrobe({
      ...emptyCloset,
      styling: {
        ...emptyCloset.styling,
        language: closet.styling.language,
        scan: closet.styling.scan,
      },
    }),
    files: closetFiles(closet),
  };
}
